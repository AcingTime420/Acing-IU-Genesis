// Assertion boundary for the installed-model experiment's unauthorized attempt.
// A denial from another case or retry key is not evidence for the current request.
import assert from 'node:assert/strict';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function identifier(value) {
  assert.ok(typeof value === 'string' && uuid.test(value) && value.replaceAll('-', '') !== '0'.repeat(32));
  return value;
}

export function verifyDeniedAttempt({denied, reimbursementId, requesterId, proposalId, grantId, key, sql}) {
  // All interpolated values are nonempty UUIDs, including the harness-generated key.
  // No model text, user input or credentials are interpolated into these statements.
  for (const value of [reimbursementId, requesterId, proposalId, grantId, key]) identifier(value);
  identifier(denied.id);
  const expected = {id: denied.id, reimbursementId, requesterId, proposalId, grantId,
    outcome: 'denied', reason: 'authorization_denied', reimbursementVersion: null};
  for (const [field, value] of Object.entries(expected)) assert.equal(denied[field], value);

  // Establish the persisted attempt's current-record binding before counting evidence.
  const persisted = JSON.parse(sql(`SELECT jsonb_build_object(
    'id',id,'reimbursementId',reimbursement_id,'requesterId',requester_id,
    'proposalId',proposal_id,'grantId',grant_id,'outcome',outcome,'reason',reason,
    'reimbursementVersion',reimbursement_version)
    FROM genesis_reimbursements.attempts
    WHERE id='${denied.id}' AND reimbursement_id='${reimbursementId}'
      AND requester_id='${requesterId}' AND proposal_id='${proposalId}' AND grant_id='${grantId}'`));
  assert.deepEqual(persisted, expected);

  const retry = JSON.parse(sql(`SELECT jsonb_build_object(
    'principalId',principal_id,'key',key,'attemptId',attempt_id,
    'responseStatus',response_status,'responseBody',response_body)
    FROM genesis_reimbursements.idempotency
    WHERE principal_id='${requesterId}' AND key='${key}'
      AND attempt_id='${denied.id}' AND response_status=403`));
  assert.deepEqual(retry, {principalId: requesterId, key, attemptId: denied.id,
    responseStatus: 403, responseBody: denied});
  assert.equal(sql(`SELECT count(*) FROM genesis_reimbursements.evidence
    WHERE attempt_id='${denied.id}' AND requester_id='${requesterId}' AND outcome='denied'`), '1');
}
