// Opt-in installed-model experiment. No simulated provider or injected fetch is used.
// The coordinator owns PostgreSQL, the authority backend and the local Ollama process.
// This harness owns only its Next child and Chromium browser. Synthetic records only;
// no payments, screenshots, model downloads, user files or external inference providers.
import assert from 'node:assert/strict';
import {execFile, execFileSync, spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {lstat, readFile, realpath, rename, stat, writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createServer} from 'node:net';
import {isAbsolute, join, relative, resolve, sep} from 'node:path';
import {performance} from 'node:perf_hooks';
import {setTimeout as delay} from 'node:timers/promises';
import {pathToFileURL} from 'node:url';
import {promisify} from 'node:util';

const run = promisify(execFile);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const modelOrigin = 'http://127.0.0.1:11434';
let stage = 'configuration', progressFile, frontend, frontendClosed, browser;
let frontendFailed = false;
let coordinatorPath, coordinatorPython, ollamaPid;
const diagnostic = {mode: 'Development/Test installed-model experiment', syntheticRecords: true,
  simulatedInference: false, paymentExecuted: false, screenshotsRecorded: false,
  managerActions: 'Automated browser validation using a synthetic manager-role fixture; not actual Micki Hart review or independent human review.'};
function within(root, path) {
  const value = relative(root, path);
  return value === '' || (!value.startsWith('..' + sep) && value !== '..' && !isAbsolute(value));
}
async function mark(value, outcome = 'running') {
  stage = value;
  if (!progressFile) return;
  const temporary = progressFile + '.' + randomUUID() + '.tmp';
  await writeFile(temporary, JSON.stringify({stage, outcome, atUtc: new Date().toISOString()}) + '\n',
    {flag: 'wx', mode: 0o600});
  await rename(temporary, progressFile);
}
function validId(value) {
  assert.ok(typeof value === 'string' && uuid.test(value) && value.replaceAll('-', '') !== '0'.repeat(32));
  return value.toLowerCase();
}
function backendOrigin(value) {
  const url = new URL(value);
  assert.equal(url.protocol, 'http:'); assert.equal(url.hostname, '127.0.0.1');
  assert.equal(url.username, ''); assert.equal(url.password, ''); assert.equal(url.pathname, '/');
  assert.equal(url.search, ''); assert.equal(url.hash, '');
  assert.notEqual(url.port, '11434');
  return url.origin;
}
function testPort(value) {
  assert.match(value, /^[1-9]\d{0,4}$/);
  const port = Number(value); assert.ok(port >= 1024 && port <= 65535); return port;
}
async function available(port) {
  const probe = createServer();
  await new Promise((resolve, reject) => {probe.once('error', reject); probe.listen(port, '127.0.0.1', resolve);});
  await new Promise((resolve, reject) => probe.close(error => error ? reject(error) : resolve()));
}
async function verifyRuntime() {
  assert.ok(coordinatorPath && coordinatorPython && ollamaPid);
  const result = await run(coordinatorPython, [coordinatorPath, '--verify-listener', String(ollamaPid), '11434'],
    {encoding: 'utf8', timeout: 10000, maxBuffer: 16384, windowsHide: true, shell: false});
  assert.equal(JSON.parse(result.stdout).owned, true, 'The coordinator must prove ownership of the model listener.');
}
async function waitForMemory(label) {
  await mark('waiting-memory-' + label);
  const deadline = performance.now() + 30000;
  while (performance.now() < deadline) {
    const remaining = Math.max(1, Math.floor(deadline - performance.now()));
    const result = await run(coordinatorPython, [coordinatorPath, '--memory-status'],
      {encoding: 'utf8', timeout: Math.min(10000, remaining), maxBuffer: 16384, windowsHide: true, shell: false});
    const memory = JSON.parse(result.stdout);
    assert.ok(Number.isFinite(memory.physicalMiB) && Number.isFinite(memory.virtualMiB));
    if (memory.physicalMiB >= 1536 && memory.virtualMiB >= 3072)
      return {physicalMiB: memory.physicalMiB, virtualMiB: memory.virtualMiB};
    const delayRemaining = deadline - performance.now();
    if (delayRemaining > 0) await delay(Math.min(250, delayRemaining));
  }
  throw new Error('Memory headroom did not reach the required launch threshold.');
}
async function modelApi(path, body) {
  await verifyRuntime();
  try {
    const response = await fetch(modelOrigin + path, {method: body === undefined ? 'GET' : 'POST', redirect: 'error',
      headers: body === undefined ? {} : {'Content-Type': 'application/json'},
      body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(30000)});
    assert.ok(response.ok); return await response.json();
  } finally { await verifyRuntime(); }
}
function sql(query) {
  return execFileSync('psql', ['-X', '-qAt', '-v', 'ON_ERROR_STOP=1'],
    {encoding: 'utf8', input: query, timeout: 30000, stdio: ['pipe', 'pipe', 'pipe']}).trim();
}
async function waitFrontend(url) {
  const deadline = performance.now() + 60000;
  while (performance.now() < deadline) {
    if (frontendFailed || frontend.exitCode !== null || frontend.signalCode !== null) throw new Error('Frontend unavailable.');
    const response = await fetch(url, {signal: AbortSignal.timeout(1000)}).catch(() => null);
    if (response?.ok) return;
    await delay(100);
  }
  throw new Error('Frontend readiness deadline exceeded.');
}
function boundedCompletion(operation, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Owned resource cleanup deadline exceeded.')), timeoutMs);
    Promise.resolve(operation).then(value => {clearTimeout(timer); resolve(value);},
      error => {clearTimeout(timer); reject(error);});
  });
}

/** Confirm both owned resources closed, even if one cleanup rejects or times out.
 * frontendClosed must resolve only on the actual child `close` event, not on `exit`
 * or a swallowed spawn error. Signals alone are not evidence of process closure.
 */
export async function cleanupOwnedResources({browser, frontend, frontendClosed,
  browserTimeoutMs = 5000, graceTimeoutMs = 5000, killTimeoutMs = 5000} = {}) {
  for (const value of [browserTimeoutMs, graceTimeoutMs, killTimeoutMs])
    assert.ok(Number.isInteger(value) && value > 0);
  async function closeBrowser() {
    if (!browser) return;
    await boundedCompletion(Promise.resolve().then(() => browser.close()), browserTimeoutMs);
    if (browser.isConnected() !== false) throw new Error('Browser closure was not confirmed.');
  }
  async function closeFrontend() {
    if (!frontend) return;
    const waitForClose = async timeoutMs => {
      if (!frontendClosed || typeof frontendClosed.then !== 'function') return false;
      try {await boundedCompletion(frontendClosed, timeoutMs); return true;} catch {return false;}
    };
    // A process may exit before its stdio handles close. Wait for the actual close
    // event in that case rather than signalling an exited child's stored PID.
    if (frontend.exitCode !== null || frontend.signalCode !== null) {
      if (!await waitForClose(killTimeoutMs)) throw new Error('Frontend closure was not confirmed.');
      return;
    }
    try {frontend.kill('SIGTERM');} catch { /* Still attempt confirmation and escalation. */ }
    if (await waitForClose(graceTimeoutMs)) return;
    if (frontend.exitCode === null && frontend.signalCode === null) {
      try {frontend.kill('SIGKILL');} catch { /* Only a close event can establish success. */ }
    }
    if (!await waitForClose(killTimeoutMs)) throw new Error('Frontend closure was not confirmed.');
  }
  const results = await Promise.allSettled([closeBrowser(), closeFrontend()]);
  const errors = results.filter(value => value.status === 'rejected').map(value => value.reason);
  if (errors.length) throw new AggregateError(errors, 'Owned resource cleanup was not confirmed.');
}

/** A successful workflow cannot publish passed/completed until cleanup succeeds. */
export async function runWithConfirmedCleanup({perform, cleanup, completed, failed}) {
  let summary;
  const errors = [];
  try {summary = await perform();} catch (error) {errors.push(error);}
  try {await cleanup();} catch (error) {errors.push(error);}
  if (!errors.length) {
    try {await completed(summary); return summary;} catch (error) {errors.push(error);}
  }
  try {await failed();} catch (error) {errors.push(error);}
  throw new AggregateError(errors, 'Validation or cleanup failed; no passing result was published.');
}
async function main() {
  const [suppliedCredentials, playwrightRoot, suppliedRunDirectory] = process.argv.slice(2);
  assert.equal(process.env.GENESIS_REAL_INFERENCE_TEST, '1');
  assert.equal(process.env.ASPNETCORE_ENVIRONMENT, 'Test');
  assert.equal(process.env.PGDATABASE, 'genesis_authority_test');
  assert.ok(['127.0.0.1', '::1', 'localhost'].includes(process.env.PGHOST));
  assert.ok(suppliedCredentials && playwrightRoot && suppliedRunDirectory && process.env.GENESIS_TRIAL_REPO);
  assert.ok(typeof process.env.GENESIS_TRIAL_COORDINATOR === 'string' && isAbsolute(process.env.GENESIS_TRIAL_COORDINATOR));
  assert.ok(typeof process.env.GENESIS_TRIAL_PYTHON === 'string' && process.env.GENESIS_TRIAL_PYTHON.length > 0
    && !process.env.GENESIS_TRIAL_PYTHON.includes('\0'));
  assert.match(process.env.GENESIS_TRIAL_OLLAMA_PID ?? '', /^[1-9]\d{0,9}$/);
  ollamaPid = Number(process.env.GENESIS_TRIAL_OLLAMA_PID);
  assert.ok(Number.isSafeInteger(ollamaPid) && ollamaPid <= 4294967295);
  coordinatorPath = await realpath(process.env.GENESIS_TRIAL_COORDINATOR);
  assert.ok((await stat(coordinatorPath)).isFile());
  coordinatorPython = process.env.GENESIS_TRIAL_PYTHON;
  const repo = await realpath(process.env.GENESIS_TRIAL_REPO);
  const runDirectory = await realpath(suppliedRunDirectory), credentialFile = await realpath(suppliedCredentials);
  assert.ok(!within(repo, runDirectory) && !within(repo, credentialFile));
  const directoryInfo = await lstat(runDirectory); assert.ok(directoryInfo.isDirectory() && !directoryInfo.isSymbolicLink());
  if (process.platform !== 'win32') assert.equal(directoryInfo.mode & 0o077, 0);
  progressFile = join(runDirectory, 'progress.json');
  const existingProgress = await lstat(progressFile).catch(() => null);
  assert.ok(!existingProgress || (existingProgress.isFile() && !existingProgress.isSymbolicLink()));
  await mark('configuration');
  const revision = execFileSync('git', ['-C', repo, 'rev-parse', 'HEAD'], {encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']}).trim();
  assert.ok(revision.startsWith('5821dab'), 'Use the selected reviewed source revision.');
  assert.equal(execFileSync('git', ['-C', repo, 'status', '--porcelain', '--untracked-files=no'],
    {encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']}).trim(), '', 'Tracked reviewed source must be unchanged.');
  diagnostic.sourceRevision = revision;
  const authorityUrl = backendOrigin(process.env.GENESIS_AUTHORITY_URL);
  const frontendPort = testPort(process.env.GENESIS_REAL_FRONTEND_PORT ?? '54887');
  assert.notEqual(String(frontendPort), new URL(authorityUrl).port); assert.notEqual(frontendPort, 11434);
  const frontendUrl = `http://127.0.0.1:${frontendPort}`, reviewerApi = frontendUrl + '/api/genesis-reimbursements';
  await available(frontendPort);
  const fixtures = JSON.parse(await readFile(credentialFile, 'utf8'));
  for (const role of ['human', 'agent']) {
    validId(fixtures[role]?.id); assert.ok(typeof fixtures[role]?.credential === 'string' && fixtures[role].credential.length >= 32);
  }
  const model = process.env.GENESIS_MODEL;
  assert.ok(typeof model === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,127}$/.test(model) && !/cloud|https?:|\.\./i.test(model));
  async function api(role, path, expected, body, key) {
    const response = await fetch(authorityUrl + '/v1/authority/reimbursements' + path, {
      method: body === undefined ? 'GET' : 'POST', redirect: 'error',
      headers: {Authorization: 'Bearer ' + fixtures[role].credential,
        ...(body === undefined ? {} : {'Content-Type': 'application/json'}), ...(key ? {'Idempotency-Key': key} : {})},
      body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(30000)});
    assert.equal(response.status, expected); return response.json();
  }
  function allocation(record) {
    return JSON.parse(sql(`SELECT jsonb_build_object(
      'proposals',(SELECT count(*) FROM genesis_reimbursements.proposals WHERE reimbursement_id='${record.id}'),
      'decisions',(SELECT count(*) FROM genesis_reimbursements.decisions d JOIN genesis_reimbursements.proposals p ON p.id=d.proposal_id WHERE p.reimbursement_id='${record.id}'),
      'grants',(SELECT count(*) FROM genesis_reimbursements.grants g JOIN genesis_reimbursements.proposals p ON p.id=g.proposal_id WHERE p.reimbursement_id='${record.id}'),
      'attempts',(SELECT count(*) FROM genesis_reimbursements.attempts WHERE reimbursement_id='${record.id}'))`));
  }
  await mark('installed-model-metadata');
  const tags = await modelApi('/api/tags'); assert.ok(Array.isArray(tags.models));
  const selected = tags.models.find(value => value.name === model || value.model === model); assert.ok(selected);
  assert.ok(typeof selected.digest === 'string' && selected.digest.length > 0);
  const alreadyLoaded = await modelApi('/api/ps'); assert.ok(Array.isArray(alreadyLoaded.models));
  assert.ok(alreadyLoaded.models.every(value => value.name === model || value.model === model));
  const version = await modelApi('/api/version');
  diagnostic.model = {selectedName: model, runtimeVersion: version.version ?? null, digest: selected.digest,
    sizeBytes: selected.size ?? null, details: selected.details ?? null,
    warning: 'Runtime-reported metadata is diagnostic, not independent model attestation.'};
  await mark('synthetic-membership-fixtures');
  assert.equal(sql('SELECT count(*) FROM genesis_reimbursements.schema_versions WHERE version=1'), '1');
  const organization = randomUUID(), project = randomUUID();
  sql(`BEGIN;
    INSERT INTO genesis_reimbursements.organizations(id,name) VALUES ('${organization}','Actual local inference synthetic trial');
    INSERT INTO genesis_reimbursements.projects(id,organization_id,name) VALUES ('${project}','${organization}','Project Phoenix');
    INSERT INTO genesis_reimbursements.memberships(organization_id,principal_id,role)
      VALUES ('${organization}','${fixtures.human.id}','manager'),('${organization}','${fixtures.agent.id}','agent');
    COMMIT;`);
  const records = [];
  for (const amountMinor of [12500, 6500]) {
    const record = await api('human', '/records', 201, {organizationId: organization, projectId: project,
      category: 'supplies', amountMinor, currency: 'USD'});
    validId(record.id); assert.equal(record.status, 'pending'); assert.equal(record.version, 0); records.push(record);
  }
  const staged = [];
  for (let index = 0; index < records.length; index++) {
    await mark(`actual-inference-${index + 1}`);
    const intentFile = join(runDirectory, `intent-${index + 1}.txt`), proposalFile = join(runDirectory, `proposal-${index + 1}.json`);
    const intent = 'Please recommend propose so the designated human manager can review this one internal reimbursement. '
      + 'The supplied USD supplies amount is within the fixed limit. This is a request for human review only: do not approve, execute, pay, change scope, or fabricate evidence.';
    await writeFile(intentFile, intent, {mode: 0o600, flag: 'wx'});
    await verifyRuntime();
    let result;
    try {
      result = await run(process.execPath, [join(repo, 'scripts/genesis-local-propose.mjs'), '--credentials', credentialFile,
        '--url', authorityUrl, '--reimbursement-id', records[index].id, '--max-amount-minor', '50000', '--ttl-seconds', '600',
        '--intent-file', intentFile, '--out', proposalFile],
        {env: {...process.env, GENESIS_MODEL: model}, encoding: 'utf8', timeout: 150000, maxBuffer: 131072, windowsHide: true});
    } finally { await verifyRuntime(); }
    assert.ok(!result.stdout.includes(fixtures.human.credential) && !result.stdout.includes(fixtures.agent.credential));
    const value = JSON.parse(result.stdout); assert.equal(value.state, 'proposed');
    assert.equal(value.recommendation.recommendation, 'propose'); assert.ok(typeof value.recommendation.rationale === 'string');
    assert.equal(value.provenance.provider, 'ollama-local'); assert.equal(value.provenance.model, model);
    const proposal = value.proposal; validId(proposal.id);
    assert.equal(proposal.reimbursementId, records[index].id); assert.equal(proposal.organizationId, organization);
    assert.equal(proposal.projectId, project); assert.equal(proposal.managerId, fixtures.human.id);
    assert.equal(proposal.agentId, fixtures.agent.id); assert.equal(proposal.category, 'supplies');
    assert.equal(proposal.amountMinor, records[index].amountMinor); assert.equal(proposal.maxAmountMinor, 50000);
    assert.equal(proposal.currency, 'USD'); assert.equal(proposal.expectedVersion, 0);
    assert.deepEqual(JSON.parse(await readFile(proposalFile, 'utf8')), proposal);
    if (process.platform !== 'win32') assert.equal((await stat(proposalFile)).mode & 0o777, 0o600);
    assert.deepEqual(allocation(records[index]), {proposals: 1, decisions: 0, grants: 0, attempts: 0});
    const current = await api('human', '/records/' + records[index].id, 200);
    assert.equal(current.status, 'pending'); assert.equal(current.version, 0);
    staged.push(value);
  }
  for (const record of records) {
    assert.deepEqual(allocation(record), {proposals: 1, decisions: 0, grants: 0, attempts: 0});
    const unchanged = await api('human', '/records/' + record.id, 200);
    assert.equal(unchanged.status, 'pending'); assert.equal(unchanged.version, 0);
  }
  await mark('loaded-model-measurement');
  const active = await modelApi('/api/ps'); assert.ok(Array.isArray(active.models) && active.models.length > 0);
  assert.ok(active.models.every(value => value.name === model || value.model === model));
  diagnostic.loadedModels = active.models.map(value => ({name: value.name ?? value.model,
    digest: value.digest ?? null, sizeBytes: value.size ?? null, sizeVramBytes: value.size_vram ?? null,
    contextLength: value.context_length ?? null, expiresAt: value.expires_at ?? null}));
  await mark('unloading-selected-model-before-browser');
  await modelApi('/api/generate', {model, keep_alive: 0, stream: false});
  const unloadDeadline = performance.now() + 30000;
  let unloaded = false;
  while (performance.now() < unloadDeadline) {
    const state = await modelApi('/api/ps'); assert.ok(Array.isArray(state.models));
    if (state.models.length === 0) {unloaded = true; break;}
    assert.ok(state.models.every(value => value.name === model || value.model === model));
    await delay(100);
  }
  assert.ok(unloaded); diagnostic.modelUnloadedBeforeBrowser = true;
  diagnostic.memoryBeforeFrontend = await waitForMemory('before-frontend');
  await mark('starting-production-reviewer');
  frontend = spawn(process.execPath, [join(repo, 'frontend/node_modules/next/dist/bin/next'), 'start', '-H', '127.0.0.1', '-p', String(frontendPort)],
    {cwd: join(repo, 'frontend'), env: {...process.env, NODE_OPTIONS: '--max-old-space-size=512',
      NEXT_TELEMETRY_DISABLED: '1', GENESIS_LOCAL_LIVE: '1', GENESIS_AUTHORITY_URL: authorityUrl}, stdio: ['ignore', 'pipe', 'pipe']});
  frontend.once('error', () => {frontendFailed = true;});
  frontend.stdout.on('data', () => {}); frontend.stderr.on('data', () => {});
  frontendClosed = new Promise(resolve => frontend.once('close', resolve));
  await waitFrontend(frontendUrl + '/genesis/reimbursements');
  const {chromium} = createRequire(resolve(playwrightRoot, 'package.json'))('playwright');
  diagnostic.memoryBeforeBrowser = await waitForMemory('before-browser');
  await mark('starting-browser');
  browser = await chromium.launch(); const page = await browser.newPage();
  await page.goto(frontendUrl + '/genesis/reimbursements');
  async function action(name) {
    const result = page.waitForResponse(value => value.url() === reviewerApi && value.request().method() === 'POST');
    await page.getByRole('button', {name, exact: true}).click();
    const response = await result; assert.equal(response.status(), 200); return response.json();
  }
  async function review(proposal) {
    await page.getByLabel('Proposal UUID').fill(proposal.id);
    await page.getByLabel('Human manager development credential').fill(fixtures.human.credential);
    const state = await action('Open reviewer session'); assert.equal(state.proposal.id, proposal.id);
    assert.equal(state.decision, null); assert.equal(state.grant, null);
    await page.getByRole('heading', {name: 'Review exact proposal'}).waitFor();
  }
  async function refresh() {
    const result = page.waitForResponse(value => value.url() === reviewerApi && value.request().method() === 'GET');
    await page.getByRole('button', {name: 'Refresh backend state', exact: true}).click();
    const response = await result; assert.equal(response.status(), 200); return response.json();
  }
  const execute = (proposal, grant, key, expected) => api('agent', '/execute', expected, {
    proposalId: proposal.id, grantId: grant.id, reimbursementId: proposal.reimbursementId,
    organizationId: proposal.organizationId, projectId: proposal.projectId, category: proposal.category,
    amountMinor: proposal.amountMinor, currency: proposal.currency, expectedVersion: proposal.expectedVersion,
    operation: 'approve_reimbursement'}, key);
  await mark('automated-manager-approval-separate-agent-execution');
  await review(staged[0].proposal); const approved = await action('Approve exact proposal');
  assert.equal(approved.grant.state, 'active');
  const key = randomUUID(), allowed = await execute(staged[0].proposal, approved.grant, key, 200);
  validId(allowed.id); assert.equal(allowed.outcome, 'allowed'); assert.equal(allowed.reimbursementVersion, 1);
  assert.deepEqual(await execute(staged[0].proposal, approved.grant, key, 200), allowed);
  const firstState = await refresh(); assert.equal(firstState.reimbursement.status, 'approved');
  assert.equal(firstState.reimbursement.version, 1);
  assert.ok(firstState.evidence.some(value => value.attemptId === allowed.id && value.outcome === 'allowed'));
  await action('Sign out');
  await mark('automated-manager-revocation-denies-separate-agent');
  await review(staged[1].proposal); const revocable = await action('Approve exact proposal');
  assert.equal((await action('Revoke unused grant')).grant.state, 'revoked');
  const denied = await execute(staged[1].proposal, revocable.grant, randomUUID(), 403);
  validId(denied.id); assert.equal(denied.outcome, 'denied');
  const secondState = await refresh(); assert.equal(secondState.reimbursement.status, 'pending');
  assert.equal(secondState.reimbursement.version, 0); assert.equal(secondState.grant.state, 'revoked');
  assert.ok(secondState.evidence.some(value => value.attemptId === denied.id && value.details.reason === 'grant_revoked'));
  await action('Sign out');
  await mark('sql-evidence-agreement');
  const sqlResults = {
    first: sql(`SELECT status||':'||version FROM genesis_reimbursements.reimbursements WHERE id='${records[0].id}'`),
    second: sql(`SELECT status||':'||version FROM genesis_reimbursements.reimbursements WHERE id='${records[1].id}'`),
    firstAllocations: allocation(records[0]), secondAllocations: allocation(records[1]),
    allowedReceiptCount: Number(sql(`SELECT count(*) FROM genesis_reimbursements.evidence WHERE attempt_id='${allowed.id}' AND outcome='allowed'`)),
    deniedReceiptCount: Number(sql(`SELECT count(*) FROM genesis_reimbursements.evidence WHERE attempt_id='${denied.id}' AND outcome='denied'`)),
  };
  assert.equal(sqlResults.first, 'approved:1'); assert.equal(sqlResults.second, 'pending:0');
  assert.deepEqual(sqlResults.firstAllocations, {proposals: 1, decisions: 1, grants: 1, attempts: 1});
  assert.deepEqual(sqlResults.secondAllocations, {proposals: 1, decisions: 1, grants: 1, attempts: 1});
  assert.equal(sqlResults.allowedReceiptCount, 1); assert.equal(sqlResults.deniedReceiptCount, 1);
  diagnostic.actualRecommendations = staged.map(value => ({recommendation: value.recommendation, provenance: value.provenance}));
  diagnostic.sqlResults = sqlResults;
  diagnostic.limitations = ['Two synthetic records do not establish general model quality or production readiness.',
    'Provider/runtime diagnostics are not cryptographic attestation.', 'Approval does not initiate payment.'];
  assert.ok(!JSON.stringify(diagnostic).includes(fixtures.human.credential) && !JSON.stringify(diagnostic).includes(fixtures.agent.credential));
  return diagnostic;
}
// Importing this module for cleanup regressions must not start a real experiment.
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    const summary = await runWithConfirmedCleanup({
      perform: main,
      cleanup: async () => {
        const previousStage = stage;
        stage = 'cleanup';
        await cleanupOwnedResources({browser, frontend, frontendClosed});
        stage = previousStage;
      },
      completed: async value => {
        value.cleanupConfirmed = true;
        value.result = 'passed';
        await mark('completed', 'passed');
      },
      failed: () => mark(stage, 'failed'),
    });
    console.log(JSON.stringify(summary, null, 2));
  } catch {
    console.error('Real local inference validation or cleanup failed. Inspect the private progress stage and coordinator diagnostics.');
    process.exitCode = 1;
  }
}
