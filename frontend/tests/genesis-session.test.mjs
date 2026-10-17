import test from 'node:test';
import assert from 'node:assert/strict';
import { trustedLocalRequest, backendOrigin, newSession, readSession, deleteSession } from '../src/lib/genesis-session.ts';
test('reject cross-origin, remote and DNS-rebinding hosts', () => {
  assert.equal(trustedLocalRequest(new Request('http://localhost:3000/api/genesis',{headers:{origin:'http://evil.test'}})),false);
  assert.equal(trustedLocalRequest(new Request('http://evil.test/api/genesis',{headers:{origin:'http://evil.test'}})),false);
  assert.equal(trustedLocalRequest(new Request('http://localhost:3000/api/genesis',{headers:{origin:'http://localhost:3000'}})),true);
});
test('backend config cannot send credentials to remote hosts or URL paths',()=>{
 for(const value of ['https://evil.test','http://localhost:5088/other','http://user:pass@localhost:5088']) assert.throws(()=>backendOrigin(value));
 assert.equal(backendOrigin('http://127.0.0.1:5088'),'http://127.0.0.1:5088');
});
test('sessions expire and logout removes authority',()=>{
 const data={credential:'secret',proposalId:'p',documentId:'d',reviewContext:'context'};
 const key=newSession(data,1000); assert.equal(readSession(key,1001)?.credential,'secret');
 assert.equal(readSession(key,1000+15*60*1000),null);
 const other=newSession(data);deleteSession(other);assert.equal(readSession(other),null);
});
