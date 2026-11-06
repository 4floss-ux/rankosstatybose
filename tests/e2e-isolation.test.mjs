import {test} from 'node:test';
import assert from 'node:assert/strict';
import {handle} from '../e2e/worker.mjs';
import {STAGE_URL,SITE_ORIGIN,allowedUser,publicStageKey} from '../e2e/policy.mjs';
const key='sb_publishable_'+ 's'.repeat(45);
const user={id:'test-worker',email:'beatabune@gmail.com',email_confirmed_at:'2026-11-06'};
function env(extra={}) {return {E2E_SAFETY_VERIFIED:'20261106',E2E_SUPABASE_PUBLISHABLE_KEY:key,ASSETS:{fetch:async()=>new Response('REAL APP ASSET')},...extra};}
function request(path,init={}) {return new Request(SITE_ORIGIN+path,{...init,headers:{cookie:'__Host-s24-e2e=verified-stage-token',origin:SITE_ORIGIN,...init.headers}});}
function backend(identity=user) {const calls=[];const f=async(url,init={})=>{calls.push({url,init});if(url.includes('/auth/v1/token'))return Response.json({access_token:'verified-stage-token',refresh_token:'stage-refresh',expires_in:3600,user:identity});if(url.endsWith('/auth/v1/user'))return Response.json(identity);return Response.json({ok:true});};return {f,calls};}
test('inactive or misconfigured sandbox never serves assets or calls any backend',async()=>{
 let count=0;const f=async()=>{count++;throw Error()};
 for(const config of [env({E2E_SAFETY_VERIFIED:''}),env({E2E_SUPABASE_PUBLISHABLE_KEY:'sb_secret_forbidden'})])assert.equal((await handle(request('/'),config,f)).status,503);
 assert.equal(count,0);
});
test('exact staging public key and only confirmed allowlisted accounts',()=>{
 assert.equal(publicStageKey(key),true);
 for(const role of ['service_role','anon']){const jwt='header.'+btoa(JSON.stringify({role,ref:role==='anon'?'production-project':'wpldojonwvccdmpmlbfe'}))+'.signature';assert.equal(publicStageKey(jwt),false);}
 for(const email of ['4floss@gmail.com','tattoo.staponas@gmail.com','beatabune@gmail.com'])assert.equal(allowedUser({...user,email}),true);
 assert.equal(allowedUser({...user,email:'other@example.invalid'}),false);assert.equal(allowedUser({...user,email_confirmed_at:null}),false);
});
test('production hostname is rejected before any network call',async()=>{
 const b=backend();assert.equal((await handle(new Request('https://statybos24.lt/'),env(),b.f)).status,503);assert.equal(b.calls.length,0);
});
test('no unauthenticated page or asset access',async()=>{
 const b=backend();for(const path of ['/','/assets/app.js','/darbo-skelbimai']){const r=await handle(new Request(SITE_ORIGIN+path),env(),b.f);assert.equal(r.status,303);assert.equal(r.headers.get('location'),'/__e2e/login');}
 assert.equal(b.calls.length,0);
});
test('a fourth valid staging account still cannot read an asset',async()=>{
 const b=backend({...user,email:'another@example.invalid'});assert.equal((await handle(request('/assets/app.js'),env(),b.f)).status,303);
});
test('allowed authenticated account receives protected real application assets',async()=>{
 const b=backend();const r=await handle(request('/assets/app.js'),env(),b.f);assert.equal(await r.text(),'REAL APP ASSET');assert.match(r.headers.get('content-security-policy'),/connect-src 'self' wss:\/\/statybos24-e2e-test\.4floss\.workers\.dev;/);assert.equal(r.headers.get('cache-control'),'no-store');assert.match(r.headers.get('x-robots-tag'),/noindex/);
});
test('login verifies stage credentials and server identity; cookie is secure',async()=>{
 const b=backend();const r=await handle(request('/__e2e/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:user.email,password:'synthetic-test-only'})}),env(),b.f);assert.equal(r.status,200);assert.match(r.headers.get('set-cookie'),/Secure; HttpOnly; SameSite=Strict/);assert.equal(b.calls.length,2);assert.ok(b.calls.every(c=>c.url.startsWith(STAGE_URL+'/auth/v1/')));
});
test('unapproved login email, unconfirmed upstream identity and cross-site login fail',async()=>{
 let b=backend();const payload={email:'stranger@example.invalid',password:'synthetic'};assert.equal((await handle(request('/__e2e/login',{method:'POST',body:JSON.stringify(payload)}),env(),b.f)).status,401);assert.equal(b.calls.length,0);
 b=backend({...user,email_confirmed_at:null});assert.equal((await handle(request('/__e2e/login',{method:'POST',body:JSON.stringify({...payload,email:user.email})}),env(),b.f)).status,401);
 b=backend();assert.equal((await handle(request('/__e2e/login',{method:'POST',headers:{origin:'https://attacker.invalid'},body:'{}'}),env(),b.f)).status,403);assert.equal(b.calls.length,0);
});
test('payments, outbound functions, password emails and analytics are blocked',async()=>{
 for(const path of ['/__e2e/supabase/functions/v1/job-ad-checkout','/__e2e/supabase/functions/v1/send-email','/__e2e/supabase/functions/v1/qa-e2e-gateway','/__e2e/supabase/auth/v1/signup','/__e2e/supabase/auth/v1/recover','/api/analytics/visit','/api/stripe/checkout']){
  const b=backend();const r=await handle(request(path,{method:'POST',body:'{}'}),env(),b.f);assert.equal(r.status,403,path);assert.equal(b.calls.length,1);assert.ok(b.calls[0].url.endsWith('/auth/v1/user'));
 }
});
test('DB requests always use staging and cookie identity, never a client-supplied bearer',async()=>{
 const b=backend();const r=await handle(request('/__e2e/supabase/rest/v1/rpc/job_ad_apply',{method:'POST',headers:{authorization:'Bearer attacker-token','content-type':'application/json'},body:'{}'}),env(),b.f);assert.equal(r.status,200);const call=b.calls.at(-1);assert.equal(call.url,STAGE_URL+'/rest/v1/rpc/job_ad_apply');assert.equal(call.init.headers.get('authorization'),'Bearer verified-stage-token');
});
test('encoded path traversal cannot reach an external Edge function',async()=>{
 const b=backend();const r=await handle(request('/__e2e/supabase/rest/v1/%2f%2e%2e/functions/v1/send-email',{method:'POST',body:'{}'}),env(),b.f);assert.equal(r.status,400);assert.equal(b.calls.length,1);
});
test('refresh renews cookie only for a confirmed allowlisted identity',async()=>{
 for(const allowed of [true,false]){const b=backend(allowed?user:{...user,email:'stranger@example.invalid'});const r=await handle(request('/__e2e/supabase/auth/v1/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:'synthetic-refresh'})}),env(),b.f);assert.equal(r.status,allowed?200:401);assert.equal(Boolean(r.headers.get('set-cookie')),allowed);}
});

test('realtime is restricted to authenticated same-origin staging subscriptions',async()=>{
 const b=backend();assert.equal((await handle(request('/__e2e/supabase/realtime/v1/websocket',{headers:{upgrade:'websocket',origin:'https://evil.invalid'}}),env(),b.f)).status,403);assert.equal(b.calls.length,1);
 const c=backend();await handle(request('/__e2e/supabase/realtime/v1/websocket?apikey=evil',{headers:{upgrade:'websocket'}}),env(),c.f);assert.ok(c.calls.at(-1).url.startsWith(STAGE_URL+'/realtime/v1/websocket?'));assert.equal(c.calls.at(-1).init.headers.authorization,'Bearer verified-stage-token');assert.ok(!c.calls.at(-1).url.includes('apikey=evil'));
});
