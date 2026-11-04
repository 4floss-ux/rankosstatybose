import {test} from 'node:test';import assert from 'node:assert/strict';
import {isAdBoosted,compareAdBoost,boostCompatibleRpc} from '../src/lib/jobAdBoost.js';
import {validBoostSession,fulfilBoost,verifyStripeSignature} from '../supabase/functions/_shared/jobAdBoost.mjs';
const order={id:'60000000-0000-4000-8000-000000000001',ad_id:'ad',company_id:'company',amount_cents:499,session_id:'cs_synthetic',environment:'test'};
const paid={id:'cs_synthetic',mode:'payment',payment_status:'paid',livemode:false,amount_total:499,currency:'eur',client_reference_id:'company',metadata:{kind:'job_ad_boost',boost_order_id:order.id,ad_id:'ad',company_id:'company'}};
test('only live, unexpired boosts outrank regular adverts',()=>{
 const now=Date.now(),base={live:true};const active={...base,boosted_until:new Date(now+100000).toISOString(),boosted_at:new Date(now).toISOString()};
 assert.equal(isAdBoosted(active,now),true);assert.equal(compareAdBoost(base,active,now),1);assert.equal(compareAdBoost(active,base,now),-1);
 assert.equal(isAdBoosted({...active,boosted_until:new Date(now).toISOString()},now),false);assert.equal(isAdBoosted({...active,live:false},now),false);
 const newer={...active,boosted_at:new Date(now+1).toISOString()};assert.ok(compareAdBoost(newer,active,now)<0);
});
test('fallback occurs only for absent RPC, never permission or network failures',async()=>{
 let calls=[];const api={rpc:async n=>{calls.push(n);return n==='new'?{error:{code:'PGRST202'}}:{data:[]};}};
 await boostCompatibleRpc(api,'new','old');assert.deepEqual(calls,['new','old']);
 calls=[];api.rpc=async n=>{calls.push(n);return {error:{code:'42501'}};};await boostCompatibleRpc(api,'new','old');assert.deepEqual(calls,['new']);
});
test('paid proof requires exact price, kind, environment, company, order and advert',()=>{
 assert.equal(validBoostSession(paid,order,'test'),true);
 for(const change of [{amount_total:999},{currency:'usd'},{livemode:true},{mode:'subscription'},{payment_status:'unpaid'},{client_reference_id:'other'},{id:'cs_other'},{metadata:{...paid.metadata,kind:'job_ad'}},{metadata:{...paid.metadata,ad_id:'other'}}])assert.equal(validBoostSession({...paid,...change},order,'test'),false);
});
test('fulfilment rechecks Stripe and never activates a forged or other-ad session',async()=>{
 const calls=[];const admin={rpc:async(n,args)=>{calls.push({n,args});return {data:n==='job_ad_boost_order'?order:{paid:true,delivered:true}};}};
 await fulfilBoost({admin,stripe:async()=>paid,sessionId:'cs_synthetic',environment:'test',expectedAdId:'ad'});assert.equal(calls.at(-1).n,'job_ad_boost_activate_paid');
 calls.length=0;await assert.rejects(fulfilBoost({admin,stripe:async()=>({...paid,amount_total:1}),sessionId:'cs_synthetic',environment:'test'}));assert.ok(!calls.some(c=>c.n==='job_ad_boost_activate_paid'));
 await assert.rejects(fulfilBoost({admin,stripe:async()=>paid,sessionId:'cs_synthetic',environment:'test',expectedAdId:'other'}));
});
test('valid webhook recovers a session if browser checkout registration was interrupted',async()=>{
 const calls=[];const admin={rpc:async(n)=>{calls.push(n);return {data:n==='job_ad_boost_order'?{...order,session_id:null}:{paid:true,delivered:true}};}};
 await fulfilBoost({admin,stripe:async()=>paid,sessionId:'cs_synthetic',environment:'test',source:'webhook'});assert.deepEqual(calls,['job_ad_boost_order','job_ad_boost_register_session','job_ad_boost_activate_paid']);
});
test('Stripe HMAC rejects tampering, wrong secret and stale signatures',async()=>{
 const t=1800000000,raw=JSON.stringify({type:'checkout.session.completed'}),secret='synthetic-only';
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const bytes=new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(`${t}.${raw}`)));const h=[...bytes].map(b=>b.toString(16).padStart(2,'0')).join('');const header=`t=${t},v1=${h}`;
 assert.equal(await verifyStripeSignature(raw,header,secret,t),true);assert.equal(await verifyStripeSignature(raw+'x',header,secret,t),false);assert.equal(await verifyStripeSignature(raw,header,'wrong',t),false);assert.equal(await verifyStripeSignature(raw,header,secret,t+301),false);
});
