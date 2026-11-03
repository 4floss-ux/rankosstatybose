// Entire Edge handlers with synthetic SDK/fetch; no Supabase or Stripe calls.
import {test} from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {build} from 'esbuild';
const UUID='30000000-0000-4000-8000-000000000100',FOLDER='30000000-0000-4000-8000-000000000200';
const env={SUPABASE_URL:'https://supabase.invalid',SUPABASE_ANON_KEY:'synthetic-anon',SUPABASE_SERVICE_ROLE_KEY:'synthetic-service',STRIPE_SECRET_KEY:'sk_test_synthetic'};
const bundles={};
async function handler(file,sdk,fetchImpl=async()=>{throw new Error('Network prohibited in test');}){
 if(!bundles[file]){const r=await build({entryPoints:[new URL('../supabase/functions/'+file+'/index.ts',import.meta.url).pathname],bundle:true,write:false,format:'iife',platform:'neutral',plugins:[{name:'synthetic-sdk',setup(b){b.onResolve({filter:/^(npm:|jsr:)/},a=>({path:a.path,namespace:'mock'}));b.onLoad({filter:/.*/,namespace:'mock'},a=>({contents:a.path.startsWith('npm:')?'export const createClient=globalThis.__createClient;':''}));}}]});bundles[file]=r.outputFiles[0].text;}
 const logs=[];const context=vm.createContext({__createClient:sdk,Deno:{env:{get:k=>env[k]},serve:fn=>{context.__handler=fn;}},fetch:fetchImpl,Request,Response,URLSearchParams,AbortSignal,crypto,console:{error:(...a)=>logs.push(a)}});
 vm.runInContext(bundles[file],context);return {run:context.__handler,logs};
}
const request=(body,auth='Bearer synthetic-user')=>new Request('https://edge.invalid',{method:'POST',headers:{Authorization:auth,'Content-Type':'application/json',Origin:'https://statybos24.lt'},body:JSON.stringify(body)});
function checkoutSdk(options={}){
 const state={calls:[],reads:0,ad:{id:UUID,company_id:'company',title:'Synthetic',status:'active',pending_session_id:null}};
 const user={auth:{getUser:async()=>({data:{user:{id:'owner',email:'synthetic@example.invalid'}}})},rpc:async(name,args)=>{
  state.calls.push(name);
  if(name==='job_ad_can_manage')return {data:!options.denied};
  if(name==='job_ad_checkout_acquire'){
   if(options.busy)return {error:{message:'Lease unavailable'}};
   if(options.stale)state.ad.pending_session_id='cs_test_old';
   return {data:'synthetic-lease'};
  }return {data:null};
 }};
 const admin={from:table=>{
  let updating=false;const q={select(){return q;},eq(){return q;},neq(){state.calls.push('guard-removed');return q;},update(){updating=true;return q;},single:async()=>({data:{id:'company',name:'Synthetic',billing_customer_id:null}}),maybeSingle:async()=>{
   if(updating){state.calls.push('save-session');return options.deleted?{data:null}:{data:{id:UUID}};}
   state.reads++;return {data:{...state.ad}};
  }};return q;
 }};
 const fetchImpl=async(url,options={})=>{
  assert.ok(url.startsWith('https://api.stripe.com/v1/checkout/sessions'));state.calls.push(options.method==='POST'?'synthetic-stripe-create':'synthetic-stripe-read');
  if(options.method==='POST')assert.ok(options.body instanceof URLSearchParams);
  return new Response(JSON.stringify({id:'cs_test_new',url:'https://stripe.invalid/checkout',livemode:false,status:'open',payment_status:'unpaid'}),{status:200});
 };
 return {state,sdk:(url,key)=>key===env.SUPABASE_SERVICE_ROLE_KEY?admin:user,fetchImpl};
}
test('checkout acquires and releases deletion protection around external work',async()=>{
 const {state,sdk,fetchImpl}=checkoutSdk();const h=await handler('job-ad-checkout',sdk,fetchImpl);
 const r=await h.run(request({action:'create',adId:UUID}));assert.equal(r.status,200);assert.ok((await r.json()).url);
 const calls=state.calls;assert.ok(calls.indexOf('job_ad_checkout_acquire')<calls.indexOf('synthetic-stripe-create'));
 assert.ok(calls.indexOf('save-session')<calls.indexOf('job_ad_checkout_release'));assert.ok(calls.includes('guard-removed'));assert.equal(state.reads,2);
 assert.doesNotMatch(JSON.stringify(h.logs),/sk_test_synthetic|synthetic-service|Bearer/);
});
test('busy/unauthorized checkout never calls Stripe and deleted rows never return a payment URL',async()=>{
 for(const options of [{busy:true},{denied:true},{deleted:true}]){
  const {state,sdk,fetchImpl}=checkoutSdk(options);const h=await handler('job-ad-checkout',sdk,fetchImpl);const r=await h.run(request({action:'create',adId:UUID}));
  assert.equal(r.status,options.denied?403:409);assert.equal(Object.hasOwn(await r.json(),'url'),false);
  if(!options.deleted)assert.equal(state.calls.some(x=>x.startsWith('synthetic-stripe')),false);
  else assert.equal(state.calls.filter(x=>x==='job_ad_checkout_release').length,1);
 }
});
test('checkout reloads after acquiring its lease and reuses a newly registered session',async()=>{
 const {state,sdk,fetchImpl}=checkoutSdk({stale:true});const h=await handler('job-ad-checkout',sdk,fetchImpl);
 assert.equal((await h.run(request({action:'create',adId:UUID}))).status,200);
 assert.equal(state.calls.includes('synthetic-stripe-create'),false);assert.equal(state.calls.includes('synthetic-stripe-read'),true);
});
function deleteSdk(options={}){
 const state={calls:[],deleted:false,removed:[],listed:0};
 const user={auth:{getUser:async()=>options.invalid?{error:{message:'Invalid token'},data:{user:null}}:{data:{user:{id:'owner'}}}},rpc:async(name,args)=>{
  state.calls.push({name,args});if(options.denied)return {error:{code:'42501'}};
  state.deleted=true;return {data:{deleted:true,job_id:'job',cleanup_pending:!!options.files}};
 }};
 const admin={rpc:async(name,args)=>{
  state.calls.push({name,args});if(name==='job_ad_delete_claim_jobs')return {data:[{job_id:'job',lease_id:'lease',application_folders:[FOLDER]}]};
  return {data:name==='job_ad_delete_finish_job'?true:null};
 },storage:{from:bucket=>{assert.equal(bucket,'job-ad-cv');return {
  list:async folder=>{assert.equal(folder,FOLDER);if(options.storageFailure)return {error:{message:'PRIVATE STORAGE ERROR'}};return {data:state.listed++===0?[{id:'object',name:'synthetic.pdf'}]:[]};},
  remove:async paths=>{state.removed.push(...paths);return {};}
 };}}};
 return {state,sdk:(url,key)=>key===env.SUPABASE_SERVICE_ROLE_KEY?admin:user};
}
test('delete Edge rejects invalid users and other companies without cleanup',async()=>{
 for(const options of [{invalid:true},{denied:true}]){
  const {state,sdk}=deleteSdk(options);const h=await handler('job-ad-delete',sdk);const r=await h.run(request({adId:UUID}));
  assert.equal(r.status,options.invalid?401:403);assert.equal(state.deleted,false);assert.equal(state.removed.length,0);
 }
});
test('delete Edge purges only server-provided CV folders and reports incomplete cleanup honestly',async()=>{
 for(const options of [{},{files:true},{files:true,storageFailure:true}]){
  const {state,sdk}=deleteSdk(options);const h=await handler('job-ad-delete',sdk);
  const r=await h.run(request({adId:UUID,application_folders:['../worker-documents']}));assert.equal(r.status,200);
  const result=await r.json();assert.equal(result.deleted,true);assert.equal(result.cleanup_pending,!!options.storageFailure);
  if(options.files&&!options.storageFailure)assert.deepEqual(state.removed,[FOLDER+'/synthetic.pdf']);
  if(options.storageFailure)assert.equal(state.calls.find(x=>x.name==='job_ad_delete_finish_job').args.p_success,false);
  assert.doesNotMatch(JSON.stringify(result),/PRIVATE|synthetic-service|application_folders/);
  assert.doesNotMatch(JSON.stringify(h.logs),/PRIVATE|synthetic-service|Bearer/);
 }
});
test('only the service scheduler can invoke cleanup',async()=>{
 const {state,sdk}=deleteSdk();const h=await handler('job-ad-delete',sdk);
 assert.equal((await h.run(request({action:'cleanup'}))).status,403);assert.equal(state.calls.length,0);
 assert.equal((await h.run(request({action:'cleanup'},'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY))).status,200);
 assert.equal(state.calls.some(x=>x.name==='job_ad_delete'),false);assert.equal(state.calls.some(x=>x.name==='job_ad_delete_claim_jobs'),true);
});
