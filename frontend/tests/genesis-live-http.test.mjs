// Real Next HTTP boundary with a synthetic upstream; not a PostgreSQL test.
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {setTimeout as delay} from 'node:timers/promises';
const id='11111111-1111-4111-8111-111111111111',human='H'.repeat(43),agent='A'.repeat(43);
const otherId='22222222-2222-4222-8222-222222222222';
const canonicalId='abcdef01-2345-4678-8abc-def012345678';
let grant=null,evidence=[],failure=null,mutations=0;
const fixture=http.createServer(async(req,res)=>{
 const token=req.headers.authorization?.slice(7),path=req.url.replace('/v1/authority','');
 res.setHeader('Content-Type','application/json');
 if(![human,agent].includes(token)){res.statusCode=401;res.end('{}');return;}
 if(path.startsWith('/documents/')&&token!==human){res.statusCode=403;res.end('{}');return;}
 let data={};
 const requestedProposal=path.match(/^\/proposals\/([0-9a-f-]{36})$/i)?.[1]?.toLowerCase();
 if([id,otherId,canonicalId].includes(requestedProposal))data={id:requestedProposal,documentId:requestedProposal,agentId:'agent',agentName:'Test agent',operation:'append',text:'Exact',expectedVersion:0,singleUse:true,expiresAt:new Date(Date.now()+600000).toISOString()};
 else if(path.endsWith('/decision')){mutations++;if(failure){res.statusCode=409;res.end(JSON.stringify({error:failure}));return;}let text='';for await(const c of req)text+=c;const decision=JSON.parse(text).decision;grant=decision==='approved'?{id,state:'active'}:null;evidence=[{id:'event',proposalId:path.split('/')[2],action:'proposal_decided',decision,grantId:grant?.id}];data={decision,grantId:grant?.id};}
 else if(path.endsWith('/revoke')){mutations++;grant.state='revoked';data=grant;}
 else if(path.startsWith('/grants/'))data=grant;
 else if(path.endsWith('/evidence'))data=evidence;
 else if(path.startsWith('/documents/'))data={id:path.split('/')[2],ownerId:'human',title:'Test',content:'unchanged',version:0};
 else {res.statusCode=404;}
 res.end(JSON.stringify(data));
});
await new Promise(r=>fixture.listen(0,'127.0.0.1',r));
const probe=http.createServer();await new Promise(r=>probe.listen(0,'127.0.0.1',r));const port=probe.address().port;await new Promise(r=>probe.close(r));
const origin=`http://127.0.0.1:${port}`;
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-H','127.0.0.1','-p',String(port)],{env:{...process.env,GENESIS_LOCAL_LIVE:'1',GENESIS_AUTHORITY_URL:`http://127.0.0.1:${fixture.address().port}`},stdio:'ignore'});
try{
 let ready=false;for(let i=0;i<100;i++){try{if((await fetch(origin+'/genesis/live')).ok){ready=true;break;}}catch{}await delay(100);}assert.ok(ready);
 await test('live HTTP: owner login, CSRF, no agent session, decision, current state, logout',async()=>{
 let binding={};
 const post=(body,cookie='',requestOrigin=origin)=>fetch(origin+'/api/genesis',{method:'POST',headers:{origin:requestOrigin,'Content-Type':'application/json',cookie},body:JSON.stringify({...binding,...body})});
 assert.equal((await post({action:'login',credential:human,proposalId:id},'','http://evil.test')).status,403);
 assert.equal((await post({action:'login',credential:agent,proposalId:id})).status,403);
 assert.equal((await fetch(origin+'/api/genesis')).status,401);
 const login=await post({action:'login',credential:human,proposalId:id});assert.equal(login.status,200);
 const cookie=login.headers.get('set-cookie');assert.match(cookie,/HttpOnly/i);assert.match(cookie,/SameSite=strict/i);assert.ok(!cookie.includes(human));const loaded=await login.json();assert.ok(!JSON.stringify(loaded).includes(human));binding={proposalId:id,documentId:id,reviewContext:loaded.reviewContext};
 const session=cookie.split(';')[0];
 assert.equal((await post({action:'execute'},session)).status,400);
 failure='proposal_expired';assert.match((await (await post({action:'approve'},session)).json()).error,/fresh proposal/);
 failure='decision_conflict';assert.match((await (await post({action:'approve'},session)).json()).error,/different decision/);failure=null;
 assert.equal((await (await post({action:'approve'},session)).json()).grant.state,'active');
 assert.equal((await (await post({action:'revoke',grantId:id},session)).json()).grant.state,'revoked');
 const current=await (await fetch(origin+'/api/genesis',{headers:{cookie:session}})).json();assert.equal(current.grant.state,'revoked');assert.equal(current.document.content,'unchanged');
 assert.equal((await post({action:'logout'},session)).status,200);
 assert.equal((await fetch(origin+'/api/genesis',{headers:{cookie:session}})).status,401);
 });
 await test('uppercase and mixed-case login UUIDs bind the displayed canonical proposal',async()=>{
 const post=(body,cookie='')=>fetch(origin+'/api/genesis',{method:'POST',headers:{origin,'Content-Type':'application/json',cookie},body:JSON.stringify(body)});
 for(const enteredId of [canonicalId.toUpperCase(),canonicalId.slice(0,8).toUpperCase()+canonicalId.slice(8)]){
  const login=await post({action:'login',credential:human,proposalId:enteredId});assert.equal(login.status,200);
  const cookie=login.headers.get('set-cookie').split(';')[0];
  const loaded=await login.json();assert.equal(loaded.proposal.id,canonicalId);assert.equal(loaded.document.id,canonicalId);
  const refreshed=await (await fetch(origin+'/api/genesis',{headers:{cookie}})).json();
  const binding={proposalId:refreshed.proposal.id,documentId:refreshed.document.id,reviewContext:refreshed.reviewContext};
  const before=mutations;
  assert.equal((await post({...binding,action:'approve'},cookie)).status,200,'the displayed canonical ID must remain actionable after refresh');
  assert.equal(mutations,before+1,'the intended approval reaches the upstream exactly once');
  assert.equal((await post({action:'logout'},cookie)).status,200);
 }
 });
 await test('stale tabs cannot approve, reject or revoke another reviewer context',async()=>{
 const post=(body,cookie='')=>fetch(origin+'/api/genesis',{method:'POST',headers:{origin,'Content-Type':'application/json',cookie},body:JSON.stringify(body)});
 const login=async(proposalId,cookie='')=>{const response=await post({action:'login',credential:human,proposalId},cookie);assert.equal(response.status,200);return {cookie:response.headers.get('set-cookie').split(';')[0],state:await response.json()};};
 const a=await login(id);
 const b=await login(otherId,a.cookie);
 const stale={proposalId:id,documentId:id,reviewContext:a.state.reviewContext,grantId:id};
 const before=mutations;
 for(const action of ['approve','reject','revoke']) assert.equal((await post({...stale,action},b.cookie)).status,409,action+' must reject stale tab');
 assert.equal(mutations,before,'stale requests must never reach a mutation endpoint');
 const renewed=await login(otherId,b.cookie);
 assert.equal((await post({action:'approve',proposalId:otherId,documentId:otherId,reviewContext:b.state.reviewContext},renewed.cookie)).status,409,'relogin to same proposal invalidates old context');
 const current={proposalId:otherId,documentId:otherId,reviewContext:renewed.state.reviewContext};
 assert.equal((await post({...current,action:'approve',documentId:id},renewed.cookie)).status,409);
 assert.equal((await post({...current,action:'approve',reviewContext:undefined},renewed.cookie)).status,409);
 assert.equal((await post({...current,action:'approve'},renewed.cookie)).status,200);
 const afterApproval=mutations;
 assert.equal((await post({...current,action:'revoke',grantId:otherId},renewed.cookie)).status,409);
 assert.equal(mutations,afterApproval,'wrong grant must not reach revocation endpoint');
 assert.equal((await post({...current,action:'revoke',grantId:id},renewed.cookie)).status,200);
 });

}finally{child.kill();await once(child,'exit');await new Promise(r=>fixture.close(r));}
