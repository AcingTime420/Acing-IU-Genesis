// Real Next HTTP boundary with a synthetic upstream; not a PostgreSQL test.
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {setTimeout as delay} from 'node:timers/promises';
const id='11111111-1111-4111-8111-111111111111',human='H'.repeat(43),agent='A'.repeat(43);
let grant=null,evidence=[],failure=null;
const fixture=http.createServer(async(req,res)=>{
 const token=req.headers.authorization?.slice(7),path=req.url.replace('/v1/authority','');
 res.setHeader('Content-Type','application/json');
 if(![human,agent].includes(token)){res.statusCode=401;res.end('{}');return;}
 if(path.startsWith('/documents/')&&token!==human){res.statusCode=403;res.end('{}');return;}
 let data={};
 if(path===`/proposals/${id}`)data={id,documentId:id,agentId:'agent',agentName:'Test agent',operation:'append',text:'Exact',expectedVersion:0,singleUse:true,expiresAt:new Date(Date.now()+600000).toISOString()};
 else if(path.endsWith('/decision')){if(failure){res.statusCode=409;res.end(JSON.stringify({error:failure}));return;}let text='';for await(const c of req)text+=c;const decision=JSON.parse(text).decision;grant=decision==='approved'?{id,state:'active'}:null;evidence=[{id:'event',proposalId:id,action:'proposal_decided',decision,grantId:grant?.id}];data={decision,grantId:grant?.id};}
 else if(path.endsWith('/revoke')){grant.state='revoked';data=grant;}
 else if(path.startsWith('/grants/'))data=grant;
 else if(path.endsWith('/evidence'))data=evidence;
 else if(path.startsWith('/documents/'))data={id,ownerId:'human',title:'Test',content:'unchanged',version:0};
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
 const post=(body,cookie='',requestOrigin=origin)=>fetch(origin+'/api/genesis',{method:'POST',headers:{origin:requestOrigin,'Content-Type':'application/json',cookie},body:JSON.stringify(body)});
 assert.equal((await post({action:'login',credential:human,proposalId:id},'','http://evil.test')).status,403);
 assert.equal((await post({action:'login',credential:agent,proposalId:id})).status,403);
 assert.equal((await fetch(origin+'/api/genesis')).status,401);
 const login=await post({action:'login',credential:human,proposalId:id});assert.equal(login.status,200);
 const cookie=login.headers.get('set-cookie');assert.match(cookie,/HttpOnly/i);assert.match(cookie,/SameSite=strict/i);assert.ok(!cookie.includes(human));assert.ok(!(await login.text()).includes(human));
 const session=cookie.split(';')[0];
 assert.equal((await post({action:'execute'},session)).status,400);
 failure='proposal_expired';assert.match((await (await post({action:'approve'},session)).json()).error,/fresh proposal/);
 failure='decision_conflict';assert.match((await (await post({action:'approve'},session)).json()).error,/different decision/);failure=null;
 assert.equal((await (await post({action:'approve'},session)).json()).grant.state,'active');
 assert.equal((await (await post({action:'revoke'},session)).json()).grant.state,'revoked');
 const current=await (await fetch(origin+'/api/genesis',{headers:{cookie:session}})).json();assert.equal(current.grant.state,'revoked');assert.equal(current.document.content,'unchanged');
 assert.equal((await post({action:'logout'},session)).status,200);
 assert.equal((await fetch(origin+'/api/genesis',{headers:{cookie:session}})).status,401);
 });
}finally{child.kill();await once(child,'exit');await new Promise(r=>fixture.close(r));}
