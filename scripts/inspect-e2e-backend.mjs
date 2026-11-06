// READ ONLY. Only the fixed, isolated test project is accepted.
import {STAGE_REF} from '../e2e/policy.mjs';
const token=process.env.SUPABASE_TEST_MANAGEMENT_TOKEN;
if(!token){console.error('Missing SUPABASE_TEST_MANAGEMENT_TOKEN; configure it in environment settings, never chat.');process.exit(2);}
const base=`https://api.supabase.com/v1/projects/${STAGE_REF}`;
async function api(path,body){const r=await fetch(base+path,{method:body?'POST':'GET',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:body?JSON.stringify(body):undefined,redirect:'error'});if(!r.ok)throw Error(`Test project API failed: HTTP ${r.status}`);return r.json();}
try{
 const tables=await api('/database/query',{query:"select table_schema,table_name from information_schema.tables where table_schema in ('public','app_private','cron','supabase_migrations') order by 1,2"});
 const functions=await api('/database/query',{query:"select n.nspname as schema,p.proname as name,pg_get_functiondef(p.oid) as definition from pg_proc p join pg_namespace n on n.oid=p.pronamespace where p.prokind='f' and n.nspname in ('public','app_private')"});
 const external=functions.filter(x=>/https?:\/\/|net\.http|http_post|http_get|smtp|sendgrid|resend|twilio|telegram|webpush/i.test(x.definition||''));
 const hasCron=tables.some(x=>x.table_schema==='cron'&&x.table_name==='job');
 const jobs=hasCron?await api('/database/query',{query:'select jobid,active from cron.job'}):[];
 const auth=await api('/config/auth');
 const edge=await api('/functions');
 const report={project:STAGE_REF,production_queried:false,required_tables:['profiles','companies','jobs','job_ads','job_ad_applications','invitations'].map(name=>({name,exists:tables.some(t=>t.table_schema==='public'&&t.table_name===name)})),outbound_function_candidates:external.map(x=>({schema:x.schema,name:x.name})),active_scheduled_jobs:jobs.filter(x=>x.active).length,auth_signup_disabled:auth.disable_signup===true,phone_provider_enabled:auth.external_phone_enabled===true,edge_function_names:Array.isArray(edge)?edge.map(x=>x.slug||x.name):[],ready_to_open:false,note:'Outbound SQL candidates, account identities, stage Storage and server functions require review before setting E2E_SAFETY_VERIFIED. No settings changed; no secrets printed.'};
 console.log(JSON.stringify(report,null,2));
}catch(error){console.error(error.message);process.exit(1);}
