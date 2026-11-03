// Actual SQL proposal in local Postgres with synthetic auth/company dependencies.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {PGlite}=await import(process.env.S24_PGLITE_MODULE||'@electric-sql/pglite');
const id=n=>`20000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const source=await readFile(new URL('../supabase/migrations/20261101150000_redesign_job_ads.sql',import.meta.url),'utf8');
function fn(name){const start=source.indexOf(`create or replace function public.${name}(`);return source.slice(start,source.indexOf('end $$;',start)+8);}
test('public listings and once-only application SQL',async t=>{
 const db=new PGlite();
 try{
  await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE SCHEMA auth;CREATE SCHEMA app_private;
   CREATE TABLE auth.users(id uuid PRIMARY KEY);
   CREATE TABLE public.profiles(id uuid PRIMARY KEY,role text,is_active boolean);
   CREATE TABLE public.companies(id uuid PRIMARY KEY,owner_id uuid,name text,avatar_path text,billing_secret text);
   CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
   CREATE FUNCTION public.account_can_use_platform(u uuid) RETURNS boolean LANGUAGE sql AS $$SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id=u AND is_active)$$;
   INSERT INTO auth.users VALUES('${id(1)}'),('${id(2)}'),('${id(3)}'),('${id(4)}'),('${id(5)}');
   INSERT INTO public.profiles VALUES('${id(1)}','employer',true),('${id(2)}','worker',true),('${id(3)}','employer',false),('${id(4)}','worker',true),('${id(5)}','worker',false);
   INSERT INTO public.companies VALUES('${id(10)}','${id(1)}','Vieša įmonė',NULL,'PRIVATE BILLING'),('${id(20)}','${id(3)}','Sustabdyta įmonė',NULL,'PRIVATE BILLING');`);
  await db.exec(source.slice(source.indexOf('create table if not exists public.job_ads ('),source.indexOf('-- ---------- Pagalbinės ----------')));
  await db.exec("CREATE FUNCTION public.job_ad_is_live(a public.job_ads) RETURNS boolean LANGUAGE sql AS $$SELECT a.status='active' AND a.expires_at>now()$$;");
  await db.exec(fn('job_ad_require_worker'));
  const rowStart=source.indexOf('create or replace function public.job_ad_row_json(');
  await db.exec(source.slice(rowStart,source.indexOf('$$;',source.indexOf('as $$',rowStart))+3));
  const interviewMigration=await readFile(new URL('../supabase/migrations/20261101163000_redesign_job_ad_interview_note.sql',import.meta.url),'utf8');
  const columnStart=interviewMigration.indexOf('alter table');
  await db.exec(interviewMigration.slice(columnStart,interviewMigration.indexOf(';',columnStart)+1));
  const latestListStart=interviewMigration.indexOf('create or replace function public.job_ads_worker_list(');
  await db.exec(interviewMigration.slice(latestListStart,interviewMigration.indexOf('end $$;',latestListStart)+8));
  await db.exec(fn('job_ad_apply'));await db.exec(fn('job_ad_withdraw'));
  await db.exec('REVOKE ALL ON FUNCTION public.job_ad_withdraw(uuid) FROM PUBLIC,anon;GRANT EXECUTE ON FUNCTION public.job_ad_withdraw(uuid) TO authenticated;');
  await db.exec('REVOKE ALL ON FUNCTION public.job_ad_apply(uuid,text) FROM PUBLIC,anon;GRANT EXECUTE ON FUNCTION public.job_ad_apply(uuid,text) TO authenticated;REVOKE ALL ON FUNCTION public.job_ads_worker_list() FROM PUBLIC,anon;GRANT EXECUTE ON FUNCTION public.job_ads_worker_list() TO authenticated;');
  for(const [n,status,expiry,company,city] of [[100,'active','1 day',10,'Vilnius'],[101,'pending_payment','1 day',10,'Private city'],[102,'closed','1 day',10,'Private city'],[103,'removed','1 day',10,'Private city'],[104,'active','-1 day',10,'Private city'],[105,'active','1 day',20,'Private city'],[106,'active','1 day',10,'Kaunas']]){
   await db.query("INSERT INTO public.job_ads(id,company_id,created_by,title,city,salary_min,description,status,published_at,expires_at) VALUES($1,$2,$3,'Viešas skelbimas',$4,1500,'Viešas darbo aprašymas',$5,now(),now()+$6::interval)",[id(n),id(company),id(1),city,status,expiry]);
  }
  await db.exec(await readFile(new URL('../docs/sql-review/20261103210000_public_job_ads_REVIEW.sql',import.meta.url),'utf8'));
  const actor=async n=>db.query("SELECT set_config('request.jwt.claim.sub',$1,false)",[n?id(n):'']);
  const list=async(city=null,limit=24,offset=0)=>(await db.query('SELECT public.job_ads_public_list($1,$2,$3) AS x',[city,limit,offset])).rows[0].x;
  const detail=async n=>(await db.query('SELECT public.job_ad_public_detail($1) AS x',[id(n)])).rows[0].x;
  const apply=async n=>(await db.query('SELECT public.job_ad_apply($1,$2) AS x',[id(n),'PRIVATE CANDIDATE MESSAGE'])).rows[0].x;
  await t.test('anonymous list exposes only live ads with active owners, with safe city filtering',async()=>{
   await db.exec('SET ROLE anon');await actor(null);
   const all=await list();assert.equal(all.ads.length,2);
   assert.equal((await list('Vilnius')).ads.length,1);assert.equal((await list("' OR 1=1 --")).ads.length,0);
   assert.deepEqual((await db.query('SELECT public.job_ads_public_cities() AS x')).rows[0].x,['Kaunas','Vilnius']);
   for(const n of [101,102,103,104,105])assert.equal(await detail(n),null);
   assert.ok(await detail(100));await db.exec('RESET ROLE');
  });
  await t.test('public projection omits candidates, owner IDs, billing and session data',async()=>{
   const value=await detail(100);
   for(const key of ['owner_id','created_by','billing_secret','application','candidates','pending_session_id','cv_path','interview_note'])assert.equal(Object.hasOwn(value,key),false);
   assert.doesNotMatch(JSON.stringify(value),/PRIVATE/);
   assert.equal((await db.query('SELECT count(*)::integer AS n FROM public.job_ad_views')).rows[0].n,0);
  });
  await t.test('bounded pagination keeps every live advert reachable',async()=>{
   const first=await list(null,1,0),second=await list(null,1,1);
   assert.equal(first.has_more,true);assert.equal(second.has_more,false);
   assert.notEqual(first.ads[0].id,second.ads[0].id);
   assert.equal((await list(null,0,-1)).ads.length,1);
  });
  await t.test('one application per account, including after withdrawal/rejection',async()=>{
   await actor(2);const application=await apply(100);
   for(const status of ['sent','viewed','interview','rejected','withdrawn']){
    await db.query('UPDATE public.job_ad_applications SET status=$1 WHERE id=$2',[status,application]);
    await assert.rejects(apply(100),/Jau kandidatavote/);
   }
   assert.equal((await db.query('SELECT count(*)::integer AS n FROM public.job_ad_applications')).rows[0].n,1);
   const mine=(await db.query('SELECT public.job_ads_worker_list() AS x')).rows[0].x;
   assert.equal(mine.find(ad=>ad.id===id(100)).application.status,'withdrawn');
   await actor(4);await apply(100);
   assert.equal((await db.query('SELECT count(*)::integer AS n FROM public.job_ad_applications')).rows[0].n,2);
  });
  await t.test('withdrawal RPC refuses changes for an existing candidate',async()=>{
   await actor(4);
   const before=(await db.query('SELECT id,status FROM public.job_ad_applications WHERE worker_id=$1',[id(4)])).rows;
   assert.equal(before.length,1);
   await db.exec('SET ROLE authenticated');
   await assert.rejects(db.query('SELECT public.job_ad_withdraw($1)',[before[0].id]),/atšaukti negalima/);
   await assert.rejects(db.query('DELETE FROM public.job_ad_applications WHERE id=$1',[before[0].id]),/permission denied/);
   await db.exec('RESET ROLE');
   assert.deepEqual((await db.query('SELECT id,status FROM public.job_ad_applications WHERE worker_id=$1',[id(4)])).rows,before);
  });
  await t.test('existing private interview notes survive replacement and never become public',async()=>{
   await actor(4);
   await db.query("UPDATE public.job_ad_applications SET status='interview',interview_note=$1 WHERE worker_id=$2",['PRIVATE INTERVIEW NOTE',id(4)]);
   const mine=(await db.query('SELECT public.job_ads_worker_list() AS x')).rows[0].x;
   const application=mine.find(ad=>ad.id===id(100)).application;
   assert.equal(application.interview_note,'PRIVATE INTERVIEW NOTE');
   assert.equal(application.status,'interview');
   await actor(2);
   const other=(await db.query('SELECT public.job_ads_worker_list() AS x')).rows[0].x;
   assert.notEqual(other.find(ad=>ad.id===id(100)).application.interview_note,'PRIVATE INTERVIEW NOTE');
   await db.exec('SET ROLE anon');await actor(null);
   assert.doesNotMatch(JSON.stringify(await list()),/PRIVATE INTERVIEW NOTE|interview_note/);
   assert.doesNotMatch(JSON.stringify(await detail(100)),/PRIVATE INTERVIEW NOTE|interview_note/);
   await db.exec('RESET ROLE');
  });
  await t.test('anonymous, employer, inactive worker and unavailable-ad applications are rejected',async()=>{
   for(const n of [null,1,5]){await actor(n);await assert.rejects(apply(106),/darbuotojams/);}
   await actor(2);for(const n of [101,102,103,104,105])await assert.rejects(apply(n),/nebegalioja/);
   await db.exec('SET ROLE anon');await assert.rejects(apply(100),/permission denied/);
   await assert.rejects(db.query('SELECT public.job_ad_withdraw($1)',[id(100)]),/permission denied/);
   await assert.rejects(db.query('SELECT * FROM public.job_ad_applications'),/permission denied/);await db.exec('RESET ROLE');
  });
 }finally{await db.close();}
});
