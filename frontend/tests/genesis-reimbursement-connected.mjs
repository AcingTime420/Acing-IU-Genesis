// Real production reviewer -> Development/Test authority -> disposable PostgreSQL.
// Synthetic fixtures only; this harness performs no payment and records no screenshots.
import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createServer } from 'node:net';
import { performance } from 'node:perf_hooks';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const [credentialFile, playwrightRoot] = process.argv.slice(2);
if (!credentialFile || !playwrightRoot || process.env.PGDATABASE !== 'genesis_authority_test'
    || !['127.0.0.1', '::1', 'localhost'].includes(process.env.PGHOST)
    || !process.env.GENESIS_TEST_DATABASE || process.env.ASPNETCORE_ENVIRONMENT !== 'Test')
  throw new Error('Require Test mode, loopback disposable genesis_authority_test, a private fixture file and Playwright root.');
const { chromium } = createRequire(resolve(playwrightRoot, 'package.json'))('playwright');
const fixtures = JSON.parse(await readFile(credentialFile, 'utf8'));
for (const role of ['human', 'agent']) {
  assert.match(fixtures[role]?.id ?? '', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  assert.ok(typeof fixtures[role]?.credential === 'string' && fixtures[role].credential.length >= 32);
}
function port(name, fallback) {
  const value = process.env[name] ?? String(fallback);
  if (!/^[1-9]\d{0,4}$/.test(value) || Number(value) < 1024 || Number(value) > 65535)
    throw new Error('Connected port must be 1024..65535: ' + name);
  return Number(value);
}
const backendPort = port('GENESIS_REIMBURSEMENT_BACKEND_PORT', 54881);
const frontendPort = port('GENESIS_REIMBURSEMENT_FRONTEND_PORT', 54882);
assert.notEqual(backendPort, frontendPort);
const backendUrl = `http://127.0.0.1:${backendPort}`;
const frontendUrl = `http://127.0.0.1:${frontendPort}`;
const apiUrl = frontendUrl + '/api/genesis-reimbursements';
const processes = [];
async function assertPortAvailable(value) {
  const probe = createServer();
  await new Promise((resolve, reject) => {
    probe.once('error', () => reject(new Error('Test port occupied; existing service preserved: ' + value)));
    probe.listen(value, '127.0.0.1', resolve);
  });
  await new Promise((resolve, reject) => probe.close(error => error ? reject(error) : resolve()));
}
function start(command, args, env) {
  const child = spawn(command, args, { env, stdio: 'inherit' });
  processes.push({ child, closed: once(child, 'close') });
  return child;
}
async function waitFor(url, child) {
  const deadline = performance.now() + 60000;
  while (performance.now() < deadline) {
    if (child.exitCode !== null) throw new Error('Service exited during startup.');
    const response = await fetch(url, { signal: AbortSignal.timeout(1000) }).catch(() => null);
    if (response?.ok) return;
    await delay(100);
  }
  throw new Error('Service readiness deadline exceeded: ' + url);
}
async function api(role, path, expected, body, key) {
  const response = await fetch(backendUrl + '/v1/authority/reimbursements' + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { Authorization: 'Bearer ' + fixtures[role].credential,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(key ? { 'Idempotency-Key': key } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(30000),
  });
  assert.equal(response.status, expected, 'Unexpected status for reimbursement path ' + path);
  return response.json();
}
function sql(query) {
  return execFileSync('psql', ['-X', '-qAt', '-v', 'ON_ERROR_STOP=1'], {
    encoding: 'utf8', input: query, timeout: 30000,
  }).trim();
}
let browser;
try {
  await assertPortAvailable(backendPort); await assertPortAvailable(frontendPort);
  assert.equal(sql('SELECT count(*) FROM genesis_reimbursements.schema_versions WHERE version=1'), '1',
    'Apply the opt-in reimbursement migration before starting this harness.');
  const artifact = '../backend/HumanAuthority/bin/Release/net10.0/HumanAuthority.dll';
  const { runtimeOptions } = JSON.parse(await readFile(artifact.replace(/\.dll$/, '.runtimeconfig.json'), 'utf8'));
  assert.equal(runtimeOptions.tfm, 'net10.0');
  assert.ok(runtimeOptions.frameworks.some(value => value.name === 'Microsoft.AspNetCore.App' && value.version.startsWith('10.')));
  const backend = start('dotnet', [artifact], { ...process.env, ASPNETCORE_ENVIRONMENT: 'Test', DOTNET_ENVIRONMENT: 'Test',
    ASPNETCORE_URLS: backendUrl, DOTNET_ROLL_FORWARD: 'LatestPatch', ConnectionStrings__Default: process.env.GENESIS_TEST_DATABASE });
  await waitFor(backendUrl + '/health/ready', backend);
  const frontend = start(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', String(frontendPort)],
    { ...process.env, GENESIS_LOCAL_LIVE: '1', GENESIS_AUTHORITY_URL: backendUrl });
  await waitFor(frontendUrl + '/genesis/reimbursements', frontend);

  // UUIDs above are validated before SQL interpolation. Credentials never enter SQL or output.
  const organization = randomUUID(), project = randomUUID();
  sql(`BEGIN;
    INSERT INTO genesis_reimbursements.organizations(id,name) VALUES ('${organization}','Synthetic connected browser organization');
    INSERT INTO genesis_reimbursements.projects(id,organization_id,name) VALUES ('${project}','${organization}','Project Phoenix');
    INSERT INTO genesis_reimbursements.memberships(organization_id,principal_id,role)
      VALUES ('${organization}','${fixtures.human.id}','manager'),('${organization}','${fixtures.agent.id}','agent');
    COMMIT;`);
  const create = amountMinor => api('human', '/records', 201, {
    organizationId: organization, projectId: project, category: 'supplies', amountMinor, currency: 'USD',
  });
  const propose = record => api('agent', '/proposals', 201, {
    reimbursementId: record.id, expectedVersion: record.version, maxAmountMinor: 50000, ttlSeconds: 600,
  });
  const execute = (proposal, grant, key, status) => api('agent', '/execute', status, {
    proposalId: proposal.id, grantId: grant.id, reimbursementId: proposal.reimbursementId,
    organizationId: proposal.organizationId, projectId: proposal.projectId, category: proposal.category,
    amountMinor: proposal.amountMinor, currency: proposal.currency, expectedVersion: proposal.expectedVersion,
    operation: 'approve_reimbursement',
  }, key);
  const firstRecord = await create(12500), first = await propose(firstRecord), stale = await propose(firstRecord);
  browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(frontendUrl + '/genesis/reimbursements');
  async function review(proposal) {
    await page.getByLabel('Proposal UUID').fill(proposal.id);
    await page.getByLabel('Human manager development credential').fill(fixtures.human.credential);
    const loaded = page.waitForResponse(result => result.url() === apiUrl && result.request().method() === 'POST');
    await page.getByRole('button', { name: 'Open reviewer session' }).click();
    const response = await loaded; assert.equal(response.status(), 200, 'manager login');
    const state = await response.json();
    assert.equal(state.proposal.id, proposal.id); assert.equal(state.reimbursement.id, proposal.reimbursementId);
    assert.ok(!JSON.stringify(state).includes(fixtures.human.credential));
    await page.getByRole('heading', { name: 'Review exact proposal' }).waitFor();
  }
  async function action(label, expected = 200) {
    const loaded = page.waitForResponse(result => result.url() === apiUrl && result.request().method() === 'POST');
    await page.getByRole('button', { name: label, exact: true }).click();
    const response = await loaded; assert.equal(response.status(), expected, label);
    return response.json();
  }
  async function refresh() {
    const loaded = page.waitForResponse(result => result.url() === apiUrl && result.request().method() === 'GET');
    await page.getByRole('button', { name: 'Refresh backend state', exact: true }).click();
    const response = await loaded; assert.equal(response.status(), 200, 'refresh');
    return response.json();
  }
  await review(first);
  const approved = await action('Approve exact proposal');
  assert.equal(approved.grant.state, 'active');
  await action('Sign out');
  await review(stale);
  const key = randomUUID(), allowed = await execute(first, approved.grant, key, 200);
  assert.equal(allowed.outcome, 'allowed'); assert.equal(allowed.reimbursementVersion, 1);
  assert.deepEqual(await execute(first, approved.grant, key, 200), allowed);
  assert.equal((await api('agent', '/attempts/by-key?key=' + key, 200)).id, allowed.id);
  const conflict = await action('Approve exact proposal', 409);
  assert.match(conflict.error, /reimbursement changed/i);
  await page.getByRole('alert').filter({ hasText: /reimbursement changed/i }).waitFor();
  const changed = await refresh();
  assert.equal(changed.reimbursement.status, 'approved'); assert.equal(changed.reimbursement.version, 1);
  assert.equal(changed.decision, null); assert.equal(changed.grant, null);
  assert.ok(changed.evidence.some(event => event.attemptId === allowed.id && event.outcome === 'allowed'));
  assert.equal(await page.getByRole('button', { name: 'Approve exact proposal', exact: true }).isDisabled(), true);
  assert.equal((await action('Reject proposal')).decision.decision, 'rejected');
  await action('Sign out');

  const revokedRecord = await create(6500), revokedProposal = await propose(revokedRecord);
  await review(revokedProposal);
  const revocable = await action('Approve exact proposal');
  assert.equal((await action('Revoke unused grant')).grant.state, 'revoked');
  const denied = await execute(revokedProposal, revocable.grant, randomUUID(), 403);
  assert.equal(denied.outcome, 'denied');
  const current = await refresh();
  assert.equal(current.reimbursement.status, 'pending'); assert.equal(current.reimbursement.version, 0);
  assert.equal(current.grant.state, 'revoked');
  assert.ok(current.evidence.some(event => event.attemptId === denied.id && event.details.reason === 'grant_revoked'));
  assert.equal(sql(`SELECT status||':'||version FROM genesis_reimbursements.reimbursements WHERE id='${firstRecord.id}'`), 'approved:1');
  assert.equal(sql(`SELECT status||':'||version FROM genesis_reimbursements.reimbursements WHERE id='${revokedRecord.id}'`), 'pending:0');
  assert.equal(sql(`SELECT count(*) FROM genesis_reimbursements.attempts WHERE organization_id='${organization}' AND outcome='allowed'`), '1');
  assert.equal(sql(`SELECT count(*) FROM genesis_reimbursements.evidence WHERE attempt_id='${allowed.id}'`), '1');
  assert.equal(sql(`SELECT count(*) FROM genesis_reimbursements.grants g JOIN genesis_reimbursements.proposals p ON p.id=g.proposal_id WHERE p.organization_id='${organization}' AND g.state='consumed'`), '1');
  await action('Sign out');
  console.log('Connected reimbursement Chromium/HTTP/PostgreSQL passed: exact manager approval, one internal effect, idempotent retry, stale denial, rejection, revoked execution denial and evidence/SQL agreement.');
} finally {
  await browser?.close();
  for (const { child } of processes) if (child.exitCode === null) child.kill();
  await Promise.all(processes.map(({ closed }) => closed));
}
