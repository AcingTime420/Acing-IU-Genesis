import test from 'node:test';
import assert from 'node:assert/strict';
import {createReimbursementSession,readReimbursementSession,deleteReimbursementSession,REIMBURSEMENT_SESSION_COOKIE} from '../src/lib/genesis-reimbursement-session.ts';
import {newSession,readSession,deleteSession,SESSION_COOKIE} from '../src/lib/genesis-session.ts';
test('reimbursement sessions expire and logout removes the isolated credential',()=>{
 const data={credential:'private',proposalId:'proposal',reimbursementId:'record',reviewContext:'context'};
 const key=createReimbursementSession(data,1000);
 assert.equal(readReimbursementSession(key,1001)?.credential,'private');
 assert.equal(readReimbursementSession(key,901000),null);
 const current=createReimbursementSession(data);deleteReimbursementSession(current);
 assert.equal(readReimbursementSession(current),null);
});
test('document and reimbursement sessions cannot be substituted',()=>{
 assert.notEqual(REIMBURSEMENT_SESSION_COOKIE,SESSION_COOKIE);
 const human=newSession({credential:'document-secret',proposalId:'proposal',documentId:'document',reviewContext:'document-context'});
 const reimbursement=createReimbursementSession({credential:'reimbursement-secret',proposalId:'proposal',reimbursementId:'record',reviewContext:'reimbursement-context'});
 assert.equal(readReimbursementSession(human),null);
 assert.equal(readSession(reimbursement),null);
 deleteSession(human);deleteReimbursementSession(reimbursement);
});
