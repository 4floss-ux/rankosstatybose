import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createClient} from "npm:@supabase/supabase-js@2.57.4";
import {runCleanup} from "./cleanup.mjs";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json"}});
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
 if(req.method!=='POST')return reply({error:'Method not allowed'},405);
 try{
  const url=Deno.env.get('SUPABASE_URL'),service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),anon=Deno.env.get('SUPABASE_ANON_KEY');
  if(!url||!service||!anon)return reply({error:'Skelbimo trynimas laikinai nepasiekiamas.'},503);
  const authorization=req.headers.get('Authorization')||'';
  const body=await req.json().catch(()=>null);
  const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  if(body?.action==='cleanup'){
   if(authorization!==`Bearer ${service}`)return reply({error:'Nėra teisių.'},403);
   await runCleanup(admin);return reply({ok:true});
  }
  if(!/^Bearer\s+\S+$/i.test(authorization))return reply({error:'Turite būti prisijungę.'},401);
  const adId=String(body?.adId||'');
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(adId))return reply({error:'Netinkamas skelbimas.'},400);
  const user=createClient(url,anon,{global:{headers:{Authorization:authorization}},auth:{persistSession:false,autoRefreshToken:false}});
  const who=await user.auth.getUser();if(who.error||!who.data.user)return reply({error:'Turite būti prisijungę.'},401);
  const {data,error}=await user.rpc('job_ad_delete',{p_ad_id:adId});
  if(error)return reply({error:error.code==='42501'?'Nėra teisių.':error.code==='55000'?error.message:'Nepavyko patvirtinti skelbimo ištrynimo. Atnaujinkite sąrašą ir bandykite dar kartą.'},error.code==='42501'?403:409);
  if(data?.deleted!==true)return reply({error:'Nepavyko patvirtinti skelbimo ištrynimo.'},502);
  let pending=data.cleanup_pending===true;
  if(pending){try{pending=!(await runCleanup(admin,data.job_id));}catch{/* Durable queue retries independently of the browser. */}}
  return reply({deleted:true,cleanup_pending:pending});
 }catch{return reply({error:'Nepavyko patvirtinti skelbimo ištrynimo. Atnaujinkite sąrašą ir bandykite dar kartą.'},500);}
});
