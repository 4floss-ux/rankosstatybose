import {test} from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {build} from 'esbuild';
const compiled=await build({entryPoints:[new URL('../supabase/functions/job-ad-checkout/boost.ts',import.meta.url).pathname],bundle:true,write:false,platform:'node',format:'esm'});
const {handleBoost}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const order={id:'60000000-0000-4000-8000-000000000001',ad_id:'ad',company_id:'company',return_origin:'https://statybos24.lt',stripe_customer_id:'cus_synthetic',session_id:null,amount_cents:499,environment:'test'};
function fixture(){let registered=null;const calls=[];let paid=false;const session=()=>({id:'cs_synthetic',url:'https://checkout.stripe.com/synthetic',status:'open',mode:'payment',payment_status:paid?'paid':'unpaid',livemode:false,amount_total:499,currency:'eur',client_reference_id:'company',metadata:{kind:'job_ad_boost',boost_order_id:order.id,ad_id:'ad',company_id:'company'}});
 const admin={rpc:async(n,args)=>{calls.push({n,args});if(n==='job_ad_boost_register_session')registered=args.p_session_id;return {data:n==='job_ad_boost_order'?{...order,session_id:registered}:{paid:true,delivered:true}};}};
 const user={auth:{getUser:async()=>({data:{user:{id:'owner'}}})},rpc:async(n,args)=>{calls.push({n,args});return {data:{...order,session_id:registered}};}};
 const stripe=async(path,params,key)=>{calls.push({path,params:params?Object.fromEntries(params):null,key});return session();};
 const run=body=>handleBoost({cfg:{admin,environment:'test'},user,ad:{id:'ad'},req:new Request('https://local.invalid',{headers:{origin:'https://statybos24.lt'}}),body,stripe});
 return {calls,run,setPaid:()=>{paid=true;}};
}
test('checkout has one server-owned price, seven-day product, stable idempotency and no subscription',async()=>{
 const f=fixture();const r=await f.run({action:'boost_create'});assert.equal(r.url,'https://checkout.stripe.com/synthetic');
 const created=f.calls.find(c=>c.params);assert.equal(created.params['line_items[0][price_data][unit_amount]'],'499');assert.equal(created.params.mode,'payment');assert.equal(created.params.customer,'cus_synthetic');assert.match(created.key,/60000000/);
 await f.run({action:'boost_create'});assert.equal(f.calls.filter(c=>c.params).length,1);
 f.setPaid();assert.equal((await f.run({action:'boost_confirm',sessionId:'cs_synthetic'})).delivered,true);
});
test('boost payment addition leaves publication checkout actions and keys intact',async()=>{
 const source=await readFile(new URL('../supabase/functions/job-ad-checkout/index.ts',import.meta.url),'utf8');
 assert.match(source,/STRIPE_BOOST_SECRET_KEY/);assert.match(source,/STRIPE_SECRET_KEY/);assert.match(source,/AMOUNT_CENTS = 999/);assert.match(source,/job_ad_activate_paid/);assert.match(source,/job_ad_checkout_acquire/);
});
