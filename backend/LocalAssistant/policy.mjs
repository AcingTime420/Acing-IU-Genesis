import { createHash, randomUUID } from 'node:crypto';

// Server-owned limits. No model output, browser preference, or HTTP route can edit them.
export const FOUNDATION = Object.freeze({
  version: 'genesis-local-1',
  resource: 'session-test-document', operation: 'append', singleUse: true,
  approvalRequired: true, grantLifetimeMs: 300_000, sessionLifetimeMs: 900_000,
  maxDraftChars: 4000, maxMessageChars: 4000, maxTurns: 16,
  maxProposals: 32, maxEvents: 256, maxDocumentChars: 32_000,
  tools: Object.freeze([]), policyEditing: false,
});
export const POLICY_HASH = createHash('sha256').update(JSON.stringify(FOUNDATION)).digest('hex');
export class BoundaryError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export function exactObject(value, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      Object.keys(value).length !== keys.length || keys.some(key => !Object.hasOwn(value, key))) {
    throw new BoundaryError(400, 'Request fields do not match this operation.');
  }
}
export function text(value, limit = FOUNDATION.maxDraftChars) {
  if (typeof value !== 'string' || !value.trim() || value.length > limit || value.includes('\0'))
    throw new BoundaryError(400, `Text must contain 1–${limit} characters and no NUL bytes.`);
  return value;
}
const fingerprint = proposal => createHash('sha256').update(JSON.stringify([
  proposal.id, proposal.documentId, proposal.operation, proposal.text,
  proposal.expectedVersion, proposal.expiresAt, POLICY_HASH,
])).digest('hex');

/** Ephemeral, one-browser-session demonstration. Not a replacement for HumanAuthority. */
export class ReviewSession {
  constructor(clock = Date.now) {
    this.clock = clock; this.expiresAt = clock() + FOUNDATION.sessionLifetimeMs;
    this.document = {id: FOUNDATION.resource, version: 0, content: 'Genesis local test document.\n'};
    this.proposals = new Map(); this.events = []; this.turns = []; this.chatBusy = false;
    this.record('session_started', 'human', 'Local session created; no verified human identity.');
  }
  alive() {
    if (this.clock() >= this.expiresAt) throw new BoundaryError(401, 'Local session expired. Reload to start a new session.');
  }
  record(kind, actor, message) {
    this.events.push({id: randomUUID(), kind, actor, message, at: new Date(this.clock()).toISOString()});
    if (this.events.length > FOUNDATION.maxEvents) this.events.shift();
  }
  snapshot() {
    this.alive();
    return structuredClone({document: this.document, proposals: [...this.proposals.values()], events: this.events,
      expiresAt: new Date(this.expiresAt).toISOString()});
  }
  propose(draft) {
    this.alive(); text(draft);
    if (this.proposals.size >= FOUNDATION.maxProposals) throw new BoundaryError(429, 'Session proposal limit reached.');
    const proposal = {id: randomUUID(), documentId: this.document.id, operation: 'append', text: draft,
      expectedVersion: this.document.version, expiresAt: this.clock() + FOUNDATION.grantLifetimeMs,
      state: 'pending', grantId: null, attemptId: null};
    proposal.fingerprint = fingerprint(proposal);
    this.proposals.set(proposal.id, proposal);
    this.record('proposal_created', 'human', `Staged ${proposal.id} for exact review; no approval granted.`);
    return this.snapshot();
  }
  get(id) {
    this.alive();
    const proposal = this.proposals.get(id);
    if (!proposal) throw new BoundaryError(404, 'Proposal does not belong to this session.');
    return proposal;
  }
  decide(id, expectedFingerprint, decision) {
    const proposal = this.get(id);
    if (proposal.fingerprint !== expectedFingerprint) throw new BoundaryError(409, 'Review changed. Refresh before deciding.');
    if (!['approve', 'reject', 'revoke'].includes(decision)) throw new BoundaryError(400, 'Unknown decision.');
    if (decision === 'revoke') {
      if (proposal.state !== 'approved') throw new BoundaryError(409, 'Only an active grant can be revoked.');
      proposal.state = 'revoked';
    } else {
      if (proposal.state !== 'pending') throw new BoundaryError(409, 'This proposal already has a decision.');
      if (this.clock() >= proposal.expiresAt || proposal.expectedVersion !== this.document.version)
        throw new BoundaryError(409, 'Proposal is expired or stale. Create a fresh proposal.');
      proposal.state = decision === 'approve' ? 'approved' : 'rejected';
      if (decision === 'approve') proposal.grantId = randomUUID();
    }
    this.record(proposal.state, 'human', `${proposal.id}: ${proposal.state}.`);
    return this.snapshot();
  }
  execute(id, expectedFingerprint, grantId, attemptId) {
    const proposal = this.get(id);
    if (typeof attemptId !== 'string' || !/^[a-f0-9-]{36}$/.test(attemptId)) throw new BoundaryError(400, 'Invalid attempt identifier.');
    const deny = (status, message) => {
      this.record('execution_denied', 'enforcer', `${proposal.id}: ${message}`);
      throw new BoundaryError(status, message);
    };
    if (proposal.fingerprint !== expectedFingerprint || proposal.grantId !== grantId || !grantId)
      return deny(403, 'Exact proposal and grant are required.');
    if (proposal.state === 'completed' && proposal.attemptId === attemptId) {
      this.record('retry_receipt', 'enforcer', `${proposal.id}: returned prior receipt; no repeated append.`);
      return this.snapshot();
    }
    if (proposal.state !== 'approved') return deny(403, 'No active human approval.');
    if (this.clock() >= proposal.expiresAt) { proposal.state = 'expired'; return deny(403, 'Grant expired.'); }
    if (proposal.expectedVersion !== this.document.version) return deny(409, 'Document version changed. New review required.');
    if (this.document.content.length + proposal.text.length + 1 > FOUNDATION.maxDocumentChars)
      return deny(413, 'Test document size limit reached.');
    // No await between validation and mutation: serialized within this Node process.
    this.document.content += proposal.text + '\n'; this.document.version++;
    proposal.state = 'completed'; proposal.attemptId = attemptId;
    this.record('append_completed', 'enforcer', `${proposal.id}: single append to ${this.document.id}, version ${this.document.version}.`);
    return this.snapshot();
  }
}
