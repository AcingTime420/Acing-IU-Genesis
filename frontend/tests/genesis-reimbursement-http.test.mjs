// Production Next HTTP boundary with a synthetic upstream; not database enforcement evidence.
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {setTimeout as delay} from 'node:timers/promises';
const first='abcdef01-2345-4678-8abc-def012345678',second='22222222-2222-4222-8222-222222222222';
const human='H'.repeat(43),agent='A'.repeat(43);
let mutations=0,failure=null;
const states=new Map([first,second].map(id=>[id,{grant:null,evidence:[]} ]));
const fixture=http.createServer(async(req,res)=>{
 res.setHeader('Content-Type','application/json');
 const token=req.headers.authorization?.slice(7);
 if(![human,agent].includes(token)){res.statusCode=401;res.end(JSON.stringify({error:'unauthorized'}));return;}
 const path=req.url.replace('/v1/authority/reimbursements','');
 if(path.startsWith('/records/')&&token!==human){res.statusCode=403;res.end(JSON.stringify({error:'forbidden'}));return;}
 const id=path.split('/')[2]?.toLowerCase(),state=states.get(id);
 if(!state){res.statusCode=404;res.end(JSON.stringify({error:'not_found'}));return;}
 let data;
 if(path.startsWith('/proposals/')&&path.endsWith('/decision')){
  mutations++;
  if(failure){res.statusCode=409;res.end(JSON.stringify({error:failure}));return;}
  let text='';for await(const chunk of req)text+=chunk;
  const decision=JSON.parse(text).decision;
  state.grant=decision==='approved'?{id,proposalId:id,state:'active'}:null;
  state.evidence=[{id:'event',proposalId:id,action:'proposal_decided',outcome:decision,grantId:state.grant?.id}];
  data={proposalId:id,decision,grantId:state.grant?.id};
 }else if(path.startsWith('/proposals/'))data={id,reimbursementId:id,organizationId:first,projectId:first,managerId:first,agentId:second,category:'supplies',amountMinor:12500,maxAmountMinor:50000,currency:'USD',expectedVersion:0,expiresAt:new Date(Date.now()+600000).toISOString()};
 else if(path.endsWith('/revoke')){mutations++;state.grant.state='revoked';data=state.grant;}
 else if(path.startsWith('/grants/'))data=state.grant;
 else if(path.endsWith('/evidence'))data=state.evidence;
 else data={id,organizationId:first,projectId:first,managerId:first,category:'supplies',amountMinor:12500,currency:'USD',status:'pending',version:0};
 res.end(JSON.stringify(data));
});
await new Promise(resolve=>fixture.listen(0,'127.0.0.1',resolve));
const probe=http.createServer();await new Promise(resolve=>probe.listen(0,'127.0.0.1',resolve));
const port=probe.address().port;await new Promise(resolve=>probe.close(resolve));
const origin=`http://127.0.0.1:${port}`,endpoint=origin+'/api/genesis-reimbursements';
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-H','127.0.0.1','-p',String(port)],{env:{...process.env,GENESIS_LOCAL_LIVE:'1',GENESIS_AUTHORITY_URL:`http://127.0.0.1:${fixture.address().port}`},stdio:'ignore'});
const post=(body,cookie='',requestOrigin=origin)=>fetch(endpoint,{method:'POST',headers:{origin:requestOrigin,'Content-Type':'application/json',cookie},body:JSON.stringify(body)});
const login=async(id,cookie='')=>{const response=await post({action:'login',credential:human,proposalId:id},cookie);assert.equal(response.status,200);const setCookie=response.headers.get('set-cookie');return {cookie:setCookie.split(';')[0],state:await response.json(),setCookie};};
const binding=state=>({proposalId:state.proposal.id,reimbursementId:state.reimbursement.id,reviewContext:state.reviewContext});
try{
 let ready=false;for(let n=0;n<100;n++){if(child.exitCode!==null)throw Error('Production Next server exited before readiness.');try{if((await fetch(origin+'/genesis/reimbursements')).ok){ready=true;break;}}catch{}await delay(100);}assert.ok(ready,'Build frontend before running this production HTTP suite.');
 await test('manager-only login, Origin enforcement, isolated cookie, credentials omitted, exact decision/revoke/logout',async()=>{
  assert.equal((await post({action:'login',credential:human,proposalId:first},'','http://evil.test')).status,403);
  assert.equal((await post({action:'login',credential:agent,proposalId:first})).status,403);
  assert.equal((await fetch(endpoint)).status,401);
  const session=await login(first.toUpperCase());
  assert.equal(session.state.proposal.id,first);assert.match(session.setCookie,/HttpOnly/i);assert.match(session.setCookie,/SameSite=strict/i);
  assert.match(session.setCookie,/Path=\/api\/genesis-reimbursements/i);assert.ok(!session.setCookie.includes(human));assert.ok(!JSON.stringify(session.state).includes(human));
  assert.equal((await post({action:'execute'},session.cookie)).status,400);
  failure='scope_exceeded';const failed=await post({...binding(session.state),action:'approve'},session.cookie);assert.equal(failed.status,409);assert.match((await failed.json()).error,/amount limit/);failure=null;
  const approved=await post({...binding(session.state),action:'approve'},session.cookie);assert.equal(approved.status,200);assert.equal((await approved.json()).grant.state,'active');
  const before=mutations;assert.equal((await post({...binding(session.state),action:'revoke',grantId:second},session.cookie)).status,409);assert.equal(mutations,before);
  assert.equal((await (await post({...binding(session.state),action:'revoke',grantId:first},session.cookie)).json()).grant.state,'revoked');
  assert.equal((await (await fetch(endpoint,{headers:{cookie:session.cookie}})).json()).grant.state,'revoked');
  const logout=await post({action:'logout'},session.cookie);assert.equal(logout.status,200);assert.match(logout.headers.get('set-cookie'),/Path=\/api\/genesis-reimbursements/i);
  assert.equal((await fetch(endpoint,{headers:{cookie:session.cookie}})).status,401);
 });
 await test('stale browser tabs cannot approve, reject or revoke another proposal context',async()=>{
  const old=await login(first),current=await login(second,old.cookie),before=mutations;
  for(const action of ['approve','reject','revoke'])assert.equal((await post({...binding(old.state),action,grantId:first},current.cookie)).status,409);
  assert.equal(mutations,before);
  const refreshed=await login(second,current.cookie);
  assert.equal((await post({...binding(current.state),action:'approve'},refreshed.cookie)).status,409);
  assert.equal((await post({...binding(refreshed.state),action:'approve',reimbursementId:first},refreshed.cookie)).status,409);
  assert.equal((await post({...binding(refreshed.state),action:'approve',reviewContext:undefined},refreshed.cookie)).status,409);
  assert.equal(mutations,before);
  assert.equal((await post({...binding(refreshed.state),action:'reject'},refreshed.cookie)).status,200);
 });
 await test('request body limits and backend outage fail explicitly without synthetic success',async()=>{
  const large=await post({action:'login',credential:'x'.repeat(9000),proposalId:first});assert.equal(large.status,413);
  const session=await login(first);await new Promise(resolve=>fixture.close(resolve));
  const failed=await fetch(endpoint,{headers:{cookie:session.cookie}});assert.equal(failed.status,503);assert.match((await failed.json()).error,/unavailable/i);
 });
}finally{
 if(child.exitCode===null){child.kill();await once(child,'exit');}
 if(fixture.listening)await new Promise(resolve=>fixture.close(resolve));
}
