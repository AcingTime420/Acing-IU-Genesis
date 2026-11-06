import { MockGenesisAdapter, buildExecutionInput } from './genesis-adapter.mjs';

// This view delegates simulated decisions to the repository adapter.
const $ = id => document.getElementById(id);
let adapter, state, attemptKey, busy = false;
function render() {
  $('status').textContent = state.execution.state === 'idle' ? state.decision : state.execution.state;
  $('version').textContent = String(state.document.version);
  $('document').textContent = state.document.content;
  $('proposed-text').textContent = '+ ' + state.proposal.text;
  $('approve').disabled = busy || state.decision !== 'pending' || !$('consent').checked;
  $('reject').disabled = busy || state.decision !== 'pending';
  $('revoke').disabled = busy || state.grant.state !== 'active';
  for (const id of ['execute','change','expire','stale','uncertain','inspect','reset']) $(id).disabled = busy;
  $('ledger').replaceChildren(...[...state.timeline].reverse().map(event => {
    const row = document.createElement('div'); row.className = 'event';
    const title = document.createElement('b'); title.textContent = event.message;
    const detail = document.createElement('small');
    detail.textContent = `${new Date(event.timestamp).toLocaleTimeString()} · ${event.actor} · simulation`;
    row.append(title, detail); return row;
  }));
}
function reset() {
  adapter = new MockGenesisAdapter(); state = adapter.refreshFixtureClock();
  attemptKey = crypto.randomUUID(); $('consent').checked = false;
  $('message').textContent = 'New in-memory fixture. Human: Alex Morgan (demo human), unauthenticated.';
  render();
}
async function run(action) {
  if (busy) return;
  busy = true; render();
  try { state = await action(); $('message').textContent = state.execution.message; }
  catch (error) { $('message').textContent = `Simulation failed: ${error instanceof Error ? error.message : 'unknown error'}`; }
  finally { busy = false; render(); }
}
$('consent').addEventListener('change', render);
$('approve').onclick = () => { if ($('consent').checked) return run(() => adapter.decide('approved')); };
$('reject').onclick = () => run(() => adapter.decide('rejected'));
$('revoke').onclick = () => run(() => adapter.revoke());
$('execute').onclick = () => run(() => adapter.execute(buildExecutionInput(state, attemptKey), 'normal'));
$('change').onclick = () => run(() => adapter.execute(buildExecutionInput(state, crypto.randomUUID(), {text: state.proposal.text + ' (changed after review)'}), 'normal'));
for (const [button, condition] of [['expire','expired'],['stale','stale-version'],['uncertain','network-uncertain']]) {
  $(button).onclick = () => {
    attemptKey = crypto.randomUUID();
    return run(() => adapter.execute(buildExecutionInput(state, attemptKey), condition));
  };
}
$('inspect').onclick = () => run(() => adapter.inspectAttempt(attemptKey));
$('reset').onclick = reset;
document.querySelectorAll('[data-view]').forEach(button => button.onclick = () => {
  document.querySelectorAll('[data-view]').forEach(item => item.classList.toggle('active', item === button));
  for (const id of ['workspace','evidence','capabilities']) $(id).classList.toggle('hidden', id !== button.dataset.view);
});
reset();
try {
  const response = await fetch('./provenance.json');
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const source = await response.json();
  $('provenance').textContent = `Genesis source: ${source.commit.slice(0, 12)} · PR #161 adapter`;
} catch { $('provenance').textContent = 'Source provenance unavailable; see source branch.'; }
