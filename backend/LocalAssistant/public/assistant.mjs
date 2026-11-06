const $ = id => document.getElementById(id);
let csrf, state, connected = false, configured = false, busy = false, selectedId = null;
const attempts = new Map();
const proposal = () => state?.proposals.find(item => item.id === selectedId);
function message(role, content, sample = false) {
  const article = document.createElement('article'); article.className = `message ${role}`;
  const label = document.createElement('small'); label.textContent = `${sample ? 'SIMULATED EXAMPLE · ' : ''}${role === 'user' ? 'YOU' : 'MODEL · UNTRUSTED TEXT'}`;
  const body = document.createElement('p'); body.textContent = content;
  article.append(label, body);
  if (role === 'assistant') {
    const copy = document.createElement('button'); copy.className = 'secondary'; copy.type = 'button';
    copy.textContent = 'Copy into review draft';
    copy.onclick = () => {
      $('draft').value = content;
      $('action-status').textContent = 'Copied to an editable draft. No proposal or approval was created.';
      $('draft').focus();
    }; article.append(copy);
  }
  $('messages').append(article); article.scrollIntoView({block: 'nearest', behavior: 'instant'});
}
function pair(list, name, value) {
  const row = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd');
  dt.textContent = name; dd.textContent = value; row.append(dt, dd); list.append(row);
}
function render() {
  const p = proposal();
  $('send').disabled = busy || !connected || !configured;
  $('stage').disabled = busy || !connected;
  $('consent').disabled = busy || !p || p.state !== 'pending';
  $('approve').disabled = busy || !p || p.state !== 'pending' || !$('consent').checked;
  $('reject').disabled = busy || !p || p.state !== 'pending';
  $('revoke').disabled = busy || !p || p.state !== 'approved';
  $('execute').disabled = busy || !p || !['approved', 'completed'].includes(p.state);
  $('execute').textContent = p?.state === 'completed' ? 'Retry same attempt' : 'Execute approved append';
  $('proposal-state').textContent = p?.state.toUpperCase() ?? 'NO PROPOSAL';
  if (!state) return;
  $('document').textContent = state.document.content; $('version').textContent = `VERSION ${state.document.version}`;
  if (p) {
    const facts = document.createElement('dl');
    pair(facts, 'Resource', p.documentId); pair(facts, 'Operation', 'Append exact text once');
    pair(facts, 'Expected version', String(p.expectedVersion)); pair(facts, 'Expires', new Date(p.expiresAt).toLocaleString());
    const exact = document.createElement('pre'); exact.textContent = p.text;
    const warning = document.createElement('p'); warning.textContent = 'Exact proposal above. Editing the draft requires staging a new proposal and fresh approval.';
    $('contract').replaceChildren(facts, exact, warning);
  }
  $('events').replaceChildren(...[...state.events].reverse().map(item => {
    const row = document.createElement('div'); row.className = 'event';
    const text = document.createElement('div'); text.textContent = item.message;
    const meta = document.createElement('small'); meta.textContent = `${new Date(item.at).toLocaleTimeString()} · ${item.actor}`;
    row.append(text, meta); return row;
  }));
}
async function api(path, body) {
  const response = await fetch(`/api/local/${path}`, {method: 'POST', credentials: 'same-origin',
    headers: {'Content-Type': 'application/json', 'X-Genesis-CSRF': csrf}, body: JSON.stringify(body)});
  const result = await response.json();
  if (!response.ok) {
    if (response.status === 401) { connected = false; $('connection').textContent = 'SESSION EXPIRED'; }
    throw new Error(result.error || 'Local request failed.');
  }
  return result;
}
async function run(action) {
  if (busy || !connected) return;
  busy = true; render();
  try { await action(); }
  catch (error) { $('action-status').textContent = error instanceof Error ? error.message : 'Request failed. No success is confirmed.'; }
  finally { busy = false; render(); }
}
$('consent').onchange = render;
$('chat-form').onsubmit = event => {
  event.preventDefault();
  const prompt = $('prompt').value;
  if (!prompt.trim() || !configured) return;
  return run(async () => {
    $('action-status').textContent = 'Generating locally. No action is being authorized.';
    const result = await api('chat', {message: prompt});
    message('user', prompt); message('assistant', result.reply);
    state = result.state; $('prompt').value = ''; $('action-status').textContent = 'Reply received as text. Nothing was approved or executed.';
  });
};
$('stage').onclick = () => run(async () => {
  const result = await api('proposals', {text: $('draft').value});
  state = result.state; selectedId = state.proposals.at(-1).id; $('consent').checked = false;
  $('action-status').textContent = 'Proposal staged. Inspect the exact contract before deciding.';
});
for (const [button, decision] of [['approve', 'approve'], ['reject', 'reject'], ['revoke', 'revoke']]) {
  $(button).onclick = () => run(async () => {
    const p = proposal();
    if (!p || (decision === 'approve' && !$('consent').checked)) return;
    const result = await api('decision', {id: p.id, fingerprint: p.fingerprint, decision});
    state = result.state; $('consent').checked = false;
    $('action-status').textContent = `Decision recorded: ${proposal().state}.`;
  });
}
$('execute').onclick = () => run(async () => {
  const p = proposal(); if (!p) return;
  // Retain this key on transport failure so a deliberate retry cannot repeat the append.
  if (!attempts.has(p.id)) attempts.set(p.id, crypto.randomUUID());
  const result = await api('execute', {id: p.id, fingerprint: p.fingerprint, grantId: p.grantId, attemptId: attempts.get(p.id)});
  state = result.state; $('action-status').textContent = 'Server receipt received. Inspect the document and evidence below.';
});
$('sample').onclick = () => {
  message('user', 'Draft a short statement about Genesis’s foundation.', true);
  message('assistant', 'Genesis keeps human permission outside the model: review the exact action, enforce its limits, allow revocation, and record the outcome.', true);
  $('action-status').textContent = 'Labeled example only. No model inference took place.';
};
try {
  const response = await fetch('/api/local/state', {credentials: 'same-origin'});
  if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) throw new Error('Local service unavailable');
  const info = await response.json();
  if (info.mode !== 'local-prototype' || typeof info.csrf !== 'string') throw new Error('Unsupported service');
  csrf = info.csrf; state = info.state; connected = true; configured = info.aiConfigured;
  $('connection').textContent = configured ? 'LOCAL SERVICE · AI NOT YET VERIFIED' : 'LOCAL SERVICE · MODEL NOT CONFIGURED';
  $('mode-notice').textContent = 'Experimental local service. Browser-session access only; no verified human identity. Documents, grants, chat, and receipts are in memory and disappear on expiry or restart.';
  $('model-name').textContent = info.model ? `Configured model: ${info.model}` : 'Set GENESIS_MODEL to an installed local model and restart.';
  $('policy-hash').textContent = info.policyHash;
  $('source').textContent = 'Local repository checkout · see git rev-parse HEAD for the source commit';
  for (const item of info.messages) message(item.role, item.content);
  selectedId = state.proposals.at(-1)?.id ?? null;
} catch {
  $('connection').textContent = 'HOSTED REVIEW · LOCAL AI DISCONNECTED';
  $('mode-notice').textContent = 'Interface review only. This hosted page cannot reach your computer or run a local model. Explore the labeled example, or start the repository’s local service to use real local chat and server-side test-document review.';
  $('action-status').textContent = 'Local review actions are unavailable here. No simulated success will be substituted.';
  try {
    const r = await fetch('./provenance.json'); const source = await r.json();
    $('source').textContent = `Genesis source: ${source.commit.slice(0, 12)}`;
  } catch { $('source').textContent = 'Source provenance unavailable; see repository.'; }
}
render();
