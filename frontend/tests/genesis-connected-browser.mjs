import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const [credentialFile, playwrightRoot] = process.argv.slice(2);
if (!credentialFile || !playwrightRoot || process.env.PGDATABASE !== 'genesis_authority_test') {
  throw new Error('Provide disposable genesis_authority_test, a private fixture file and the Playwright install path.');
}

const { chromium } = createRequire(resolve(playwrightRoot, 'package.json'))('playwright');
const fixtures = JSON.parse(await readFile(credentialFile, 'utf8'));
const backendUrl = 'http://127.0.0.1:5088';
const frontendUrl = 'http://127.0.0.1:3000';
const processes = [];

function start(command, args, env) {
  const child = spawn(command, args, { env, stdio: 'inherit' });
  processes.push({ child, closed: once(child, 'close') });
  return child;
}

async function waitFor(url, child) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null) throw new Error('Service exited during startup.');
    const ready = await fetch(url, { signal: AbortSignal.timeout(500) }).catch(() => null);
    if (ready?.ok) return;
    await delay(100);
  }
  throw new Error('Loopback service failed readiness: ' + url);
}

async function api(role, path, expected, body, key) {
  const response = await fetch(backendUrl + '/v1/authority' + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      Authorization: 'Bearer ' + fixtures[role].credential,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(key ? { 'Idempotency-Key': key } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });
  assert.equal(response.status, expected, path);
  return response.json();
}

function sql(query) {
  return execFileSync('psql', ['-X', '-qAt', '-v', 'ON_ERROR_STOP=1'], {
    encoding: 'utf8',
    input: query,
  }).trim();
}

let browser;
try {
  const backend = start('dotnet', ['../backend/HumanAuthority/bin/Release/net8.0/HumanAuthority.dll'], {
    ...process.env, ASPNETCORE_ENVIRONMENT: 'Test', ASPNETCORE_URLS: backendUrl,
    ConnectionStrings__Default: process.env.GENESIS_TEST_DATABASE,
  });
  await waitFor(backendUrl + '/health/ready', backend);
  const frontend = start(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', '3000'], {
    ...process.env, GENESIS_LOCAL_LIVE: '1', GENESIS_AUTHORITY_URL: backendUrl,
  });
  await waitFor(frontendUrl + '/genesis/live', frontend);

  const document = await api('human', '/documents', 201, { title: 'Connected browser test', content: 'initial\n' });
  const propose = (text, expectedVersion) => api('agent', '/proposals', 201, {
    documentId: document.id, expectedVersion, text, ttlSeconds: 300,
  });
  const first = await propose('approved append', 0);
  const stale = await propose('stale append', 0);

  browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(frontendUrl + '/genesis/live');
  async function review(proposal) {
    await page.getByLabel('Proposal UUID').fill(proposal.id);
    await page.getByLabel('Human development credential').fill(fixtures.human.credential);
    await page.getByRole('button', { name: 'Open reviewer session' }).click();
    await page.getByText(proposal.text, { exact: true }).waitFor();
  }

  async function action(label, expected = 200) {
    const response = page.waitForResponse(result =>
      result.url() === frontendUrl + '/api/genesis' && result.request().method() === 'POST');
    await page.getByRole('button', { name: label }).click();
    const result = await response;
    assert.equal(result.status(), expected, label);
    return result.json();
  }

  function execute(proposal, grant, key, status) {
    return api('agent', '/execute', status, {
      proposalId: proposal.id, grantId: grant.id, documentId: document.id,
      expectedVersion: proposal.expectedVersion, operation: proposal.operation, text: proposal.text,
    }, key);
  }

  await review(first);
  const approved = await action('Approve exact proposal');
  assert.equal(approved.grant.state, 'active');
  await action('Sign out');
  await review(stale);
  const attempt = await execute(first, approved.grant, 'browser-append', 200);
  assert.equal(attempt.documentVersion, 1);
  assert.deepEqual(await execute(first, approved.grant, 'browser-append', 200), attempt);

  const staleDecision = await action('Approve exact proposal', 409);
  assert.match(staleDecision.error, /document version changed/i);
  await page.getByRole('alert').getByText(/document version changed/i).waitFor();
  const refreshed = page.waitForResponse(result =>
    result.url() === frontendUrl + '/api/genesis' && result.request().method() === 'GET');
  await page.getByRole('button', { name: 'Refresh current backend state' }).click();
  const state = await (await refreshed).json();
  assert.equal(state.document.version, 1);
  assert.equal(state.decision, null);
  assert.equal(state.grant, null);
  await page.getByText(/ask the agent for a fresh proposal before approving/i).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Approve exact proposal' }).isDisabled(), true);
  assert.equal((await action('Reject proposal')).decision.decision, 'rejected');
  await action('Sign out');

  const revoked = await propose('revoked append', 1);
  await review(revoked);
  const revocable = await action('Approve exact proposal');
  assert.equal((await action('Revoke grant')).grant.state, 'revoked');
  const denied = await execute(revoked, revocable.grant, 'browser-revoked', 403);
  assert.equal(denied.outcome, 'denied');
  const current = await api('human', '/documents/' + document.id, 200);
  assert.equal(current.version, 1);
  assert.equal(current.content, 'initial\napproved append\n');
  const evidence = await api('human', '/documents/' + document.id + '/evidence', 200);
  assert.equal(evidence.filter(event => event.action === 'execute' && event.attemptId === attempt.id).length, 1);
  assert.ok(evidence.some(event => event.attemptId === denied.id && event.details.reason === 'grant_revoked'));
  assert.equal(sql("SELECT count(*) FROM genesis_authority.grants WHERE state = 'consumed'"), '1');
  assert.equal(sql('SELECT count(*) FROM genesis_authority.grants'), '2');
  console.log('Connected Chromium, HTTP and PostgreSQL passed: exact append, idempotent retry, stale rejection and revoked execution.');
} finally {
  await browser?.close();
  for (const { child } of processes) child.kill();
  await Promise.all(processes.map(({ closed }) => closed));
}
