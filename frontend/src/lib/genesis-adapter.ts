export type Decision = "approved" | "rejected" | "pending";
export type GrantState = "not-issued" | "active" | "revoked" | "expired" | "consumed";
export type ExecutionState = "idle" | "pending" | "completed" | "denied" | "failed" | "uncertain";
export type DemoCondition = "normal" | "stale-version" | "expired" | "network-uncertain";

export interface TestDocument {
  id: string;
  title: string;
  content: string;
  version: number;
}

export interface Proposal {
  id: string;
  agentId: string;
  agentName: string;
  documentId: string;
  operation: "append";
  text: string;
  expectedVersion: number;
  expiresAt: string;
  singleUse: true;
}

export interface TimelineEvent {
  id: string;
  actor: string;
  kind: "request" | "decision" | "grant" | "execution" | "note";
  message: string;
  timestamp: string;
}

export interface PrototypeState {
  mode: "mock" | "live";
  human: { id: string; displayName: string; authenticated: boolean };
  document: TestDocument;
  proposal: Proposal;
  decision: Decision;
  grant: { id: string | null; state: GrantState };
  execution: { state: ExecutionState; message: string; attemptId: string | null };
  timeline: TimelineEvent[];
}

export interface ExecuteInput {
  proposalId: string;
  grantId: string | null;
  agentId: string;
  documentId: string;
  operation: string;
  text: string;
  expectedVersion: number;
  idempotencyKey: string;
}

export interface GenesisAdapter {
  readonly mode: "mock" | "live";
  getState(): PrototypeState;
  decide(decision: Exclude<Decision, "pending">): Promise<PrototypeState>;
  revoke(): Promise<PrototypeState>;
  execute(input: ExecuteInput, condition: DemoCondition): Promise<PrototypeState>;
  inspectAttempt(idempotencyKey: string): Promise<PrototypeState>;
}

const initialDocument: TestDocument = {
  id: "doc-genesis-demo-01",
  title: "Governed append test document",
  content: "Genesis local prototype document.\nThis is application-managed demo content; it is not a host file.\n",
  version: 7,
};

const initialProposal: Proposal = {
  id: "prop-demo-1042",
  agentId: "agent-research-notes",
  agentName: "Research Notes Agent (test identity)",
  documentId: initialDocument.id,
  operation: "append",
  text: "Reviewed summary: three findings are ready for human follow-up.",
  expectedVersion: initialDocument.version,
  expiresAt: "2026-10-16T18:34:18.000Z",
  singleUse: true,
};

const now = () => new Date().toISOString();
const idempotencyFingerprint = (input: ExecuteInput) =>
  JSON.stringify([
    input.proposalId,
    input.grantId,
    input.agentId,
    input.documentId,
    input.operation,
    input.text,
    input.expectedVersion,
  ]);

/** In-memory UI fixtures only. This class is not an authorization boundary. */
export class MockGenesisAdapter implements GenesisAdapter {
  readonly mode = "mock" as const;
  private state: PrototypeState;
  private readonly attempts = new Map<string, { fingerprint: string; result: PrototypeState }>();

  constructor() {
    this.state = {
      mode: "mock",
      human: { id: "human-demo-reviewer", displayName: "Alex Morgan (demo human)", authenticated: false },
      document: { ...initialDocument },
      proposal: { ...initialProposal },
      decision: "pending",
      grant: { id: null, state: "not-issued" },
      execution: { state: "idle", message: "No execution submitted.", attemptId: null },
      timeline: [
        { id: "event-request", actor: initialProposal.agentName, kind: "request", message: "Requested exact append to the named test document.", timestamp: "2026-10-16T18:24:18.000Z" },
      ],
    };
  }

  getState() {
    return structuredClone(this.state);
  }

  refreshFixtureClock() {
    const fixtureNow = now();
    this.state.proposal.expiresAt = new Date(Date.now() + 10 * 60_000).toISOString();
    const request = this.state.timeline.find((event) => event.id === "event-request");
    if (request) request.timestamp = fixtureNow;
    return this.getState();
  }

  private record(actor: string, kind: TimelineEvent["kind"], message: string) {
    this.state.timeline = [
      ...this.state.timeline,
      { id: `event-${this.state.timeline.length + 1}`, actor, kind, message, timestamp: now() },
    ];
  }

  async decide(decision: Exclude<Decision, "pending">) {
    if (this.state.decision !== "pending") return this.getState();
    this.state.decision = decision;
    this.record(this.state.human.displayName, "decision", decision === "approved" ? "Human approved the exact proposal." : "Human rejected the proposal.");
    if (decision === "approved") {
      this.state.grant = { id: "grant-demo-2088", state: "active" };
      this.record("Mock authorization service", "grant", "Mock server fixture issued a single-use, proposal-bound grant.");
    } else {
      this.state.execution = { state: "denied", message: "Proposal rejected by the human reviewer. No document change occurred.", attemptId: null };
    }
    return this.getState();
  }

  async revoke() {
    if (this.state.grant.state === "active") {
      this.state.grant.state = "revoked";
      this.record(this.state.human.displayName, "grant", "Mock grant revoked. Revocation does not reverse a completed change.");
    }
    return this.getState();
  }

  async execute(input: ExecuteInput, condition: DemoCondition) {
    const fingerprint = idempotencyFingerprint(input);
    const existing = this.attempts.get(input.idempotencyKey);
    if (existing) {
      if (existing.fingerprint !== fingerprint) {
        this.state.execution = { state: "denied", message: "This idempotency key is already bound to different inputs. A new review and attempt are required.", attemptId: input.idempotencyKey };
      } else {
        this.state = structuredClone(existing.result);
        this.state.execution.message = "Existing attempt returned; the mock append was not repeated.";
      }
      return this.getState();
    }

    const attemptId = `attempt-${input.idempotencyKey.slice(0, 8)}`;
    this.state.execution = { state: "pending", message: "Mock execution is being evaluated. No success is shown before a result.", attemptId };
    this.record("Mock execution service", "execution", `Execution attempt ${attemptId} submitted.`);

    if (this.state.decision !== "approved" || this.state.grant.state !== "active" || !input.grantId) {
      this.state.execution = { state: "denied", message: "No active approved grant is attached to this request. The mock service denied it; no document change occurred.", attemptId };
      this.record("Mock execution service", "execution", "Denied: approved active grant required.");
    } else if (input.proposalId !== this.state.proposal.id || input.agentId !== this.state.proposal.agentId || input.documentId !== this.state.proposal.documentId || input.operation !== this.state.proposal.operation || input.text !== this.state.proposal.text || input.expectedVersion !== this.state.proposal.expectedVersion) {
      this.state.execution = { state: "denied", message: "Proposal scope changed (agent, destination, operation, text, or expected version). Fresh human approval is required.", attemptId };
      this.record("Mock execution service", "execution", "Denied: execution parameters do not exactly match the approved proposal.");
    } else if (condition === "expired") {
      this.state.grant.state = "expired";
      this.state.execution = { state: "denied", message: "The mock server reports that the grant expired. No document change occurred.", attemptId };
      this.record("Mock execution service", "execution", "Denied: expired grant.");
    } else if (condition === "stale-version" || input.expectedVersion !== this.state.document.version) {
      this.state.document.version += 1;
      this.state.execution = { state: "denied", message: "The mock server reports a stale document version. Review the new version and obtain fresh approval.", attemptId };
      this.record("Mock execution service", "execution", "Denied: expected document version is stale.");
    } else if (condition === "network-uncertain") {
      this.state.execution = { state: "uncertain", message: "Connection dropped after submission. The outcome is unknown; inspect this same attempt before retrying.", attemptId };
      this.attempts.set(input.idempotencyKey, { fingerprint, result: this.getState() });
      this.record("Mock transport", "note", "Connection lost after submit; the attempt remains inspectable.");
    } else {
      this.state.document.content += `${input.text}\n`;
      this.state.document.version += 1;
      this.state.grant.state = "consumed";
      this.state.execution = { state: "completed", message: "Mock server confirmed one append. This is a fixture result, not backend enforcement.", attemptId };
      this.record("Mock execution service", "execution", "Completed: exact approved text appended once; mock grant consumed.");
      this.attempts.set(input.idempotencyKey, { fingerprint, result: this.getState() });
    }
    if (!this.attempts.has(input.idempotencyKey)) {
      this.attempts.set(input.idempotencyKey, { fingerprint, result: this.getState() });
    }
    return this.getState();
  }

  async inspectAttempt(idempotencyKey: string) {
    const attempt = this.attempts.get(idempotencyKey);
    if (!attempt) {
      this.state.execution = { state: "failed", message: "No result for this attempt is available in the mock fixture. Do not infer that the operation succeeded.", attemptId: null };
    } else {
      this.state = structuredClone(attempt.result);
      this.state.execution.message = this.state.execution.state === "completed"
        ? "Existing attempt confirmed completed; no second append was made."
        : this.state.execution.state === "uncertain"
          ? "Mock attempt remains uncertain; no duplicate operation was submitted."
          : this.state.execution.message;
    }
    return this.getState();
  }
}

/** Live integration is intentionally unavailable until a reviewed contract exists. */
export class UnconfiguredLiveGenesisAdapter implements GenesisAdapter {
  readonly mode = "live" as const;
  private readonly snapshot: PrototypeState;
  constructor(snapshot: PrototypeState) { this.snapshot = snapshot; }
  getState() { return { ...structuredClone(this.snapshot), mode: "live" as const }; }
  private unavailable(): never { throw new Error("Live Genesis API integration is incomplete: no agreed authority API contract is available. No mock fallback was used."); }
  async decide(decision: Exclude<Decision, "pending">): Promise<PrototypeState> { void decision; return this.unavailable(); }
  async revoke(): Promise<PrototypeState> { return this.unavailable(); }
  async execute(input: ExecuteInput, condition: DemoCondition): Promise<PrototypeState> { void input; void condition; return this.unavailable(); }
  async inspectAttempt(idempotencyKey: string): Promise<PrototypeState> { void idempotencyKey; return this.unavailable(); }
}

export function buildExecutionInput(state: PrototypeState, idempotencyKey: string, overrides: Partial<ExecuteInput> = {}) {
  return {
    proposalId: state.proposal.id,
    grantId: state.grant.id,
    agentId: state.proposal.agentId,
    documentId: state.proposal.documentId,
    operation: state.proposal.operation,
    text: state.proposal.text,
    expectedVersion: state.proposal.expectedVersion,
    ...overrides,
    idempotencyKey,
  };
}
