import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {test} from 'node:test';
import {verifyDeniedAttempt} from '../../../scripts/adversarial-denial.mjs';

function fixture() {
  const scope = {reimbursementId: randomUUID(), requesterId: randomUUID(),
    proposalId: randomUUID(), grantId: randomUUID(), key: randomUUID()};
  const denied = {id: randomUUID(), reimbursementId: scope.reimbursementId,
    requesterId: scope.requesterId, proposalId: scope.proposalId, grantId: scope.grantId,
    outcome: 'denied', reason: 'authorization_denied', reimbursementVersion: null,
    organizationId: null, createdAt: '2026-11-23T00:00:00Z'};
  const persisted = Object.fromEntries(Object.entries(denied).filter(([field]) => !['organizationId', 'createdAt'].includes(field)));
  const retry = {principalId: scope.requesterId, key: scope.key, attemptId: denied.id,
    responseStatus: 403, responseBody: structuredClone(denied)};
  const ledger = {persisted, retry, evidence: '1'};
  const queries = [];
  const sql = query => {
    queries.push(query);
    if (query.includes('FROM genesis_reimbursements.attempts')) return JSON.stringify(ledger.persisted);
    if (query.includes('FROM genesis_reimbursements.idempotency')) return JSON.stringify(ledger.retry);
    if (query.includes('FROM genesis_reimbursements.evidence')) return ledger.evidence;
    throw new Error('Unexpected query');
  };
  return {scope, denied, ledger, queries, sql};
}

test('current denial requires matching persisted attempt, current retry key and evidence', () => {
  const f = fixture();
  verifyDeniedAttempt({...f.scope, denied: f.denied, sql: f.sql});
  assert.equal(f.queries.length, 3);
  assert.match(f.queries[0], new RegExp(`reimbursement_id='${f.scope.reimbursementId}'`));
  assert.match(f.queries[1], new RegExp(`principal_id='${f.scope.requesterId}' AND key='${f.scope.key}'`));
  assert.ok(f.queries[1].includes(`attempt_id='${f.denied.id}' AND response_status=403`));
});

for (const field of ['reimbursementId', 'requesterId', 'proposalId', 'grantId']) {
  test(`an earlier or foreign denial cannot stand in for the current ${field}`, () => {
    const current = fixture();
    const stale = {...current.denied, [field]: randomUUID()};
    assert.throws(() => verifyDeniedAttempt({...current.scope, denied: stale, sql: current.sql}));
    assert.equal(current.queries.length, 0);
  });
}

test('correct response fields do not excuse a persisted attempt for another record', () => {
  const f = fixture();
  f.ledger.persisted.reimbursementId = randomUUID();
  assert.throws(() => verifyDeniedAttempt({...f.scope, denied: f.denied, sql: f.sql}));
  assert.equal(f.queries.length, 1);
});

for (const field of ['principalId', 'key', 'attemptId', 'responseStatus', 'responseBody']) {
  test(`a retry reservation with the wrong ${field} cannot verify the current denial`, () => {
    const f = fixture();
    f.ledger.retry[field] = field === 'responseStatus' ? 200
      : field === 'responseBody' ? {...f.denied, reimbursementId: randomUUID()} : randomUUID();
    assert.throws(() => verifyDeniedAttempt({...f.scope, denied: f.denied, sql: f.sql}));
    assert.equal(f.queries.length, 2);
  });
}

test('a denial without its persisted evidence is incomplete', () => {
  const f = fixture();
  f.ledger.evidence = '0';
  assert.throws(() => verifyDeniedAttempt({...f.scope, denied: f.denied, sql: f.sql}));
});

test('unsafe identifiers are rejected before SQL is invoked', () => {
  const f = fixture();
  assert.throws(() => verifyDeniedAttempt({...f.scope, key: "' OR true --", denied: f.denied, sql: f.sql}));
  assert.equal(f.queries.length, 0);
});
