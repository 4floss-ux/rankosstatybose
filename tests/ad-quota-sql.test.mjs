// Actual proposal + existing repo ad RPCs, in local in-memory Postgres only.
// Billing/auth/company helpers are synthetic; no Supabase or Stripe connection.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {PGlite}=await import(process.env.S24_PGLITE_MODULE || '@electric-sql/pglite');
const id=n=>`10000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const source=await readFile(new URL('../supabase/migrations/20261101150000_redesign_job_ads.sql',import.meta.url),'utf8');
const originalFunction=name=>source.slice(source.indexOf(`create or replace function public.${name}(`)).split('end $$;')[0]+'end $$;';

test('Business Pro shared subscription-month quota proposal',async t=>{
 const db=new PGlite();
 try{
  await db.exec(`
   CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
   CREATE SCHEMA auth; CREATE SCHEMA app_private;
   CREATE TABLE auth.users(id uuid PRIMARY KEY);
   INSERT INTO auth.users VALUES ('${id(1)}'),('${id(2)}'),('${id(3)}'),('${id(4)}');
   CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
   CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql AS $$SELECT coalesce(nullif(current_setting('request.jwt.claim.role',true),''),'authenticated')$$;
   CREATE TABLE public.companies(id uuid PRIMARY KEY,owner_id uuid,plan_key text);
   INSERT INTO public.companies VALUES('${id(10)}','${id(1)}','business_pro'),('${id(20)}','${id(3)}','business_pro');
   CREATE TABLE public.company_members(company_id uuid,user_id uuid,is_active boolean,member_role text);
   INSERT INTO public.company_members VALUES('${id(10)}','${id(2)}',true,'manager'),('${id(10)}','${id(4)}',true,'viewer');
   CREATE FUNCTION public.job_ad_can_manage(c uuid) RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
    SELECT EXISTS(SELECT 1 FROM public.companies WHERE id=c AND owner_id=auth.uid())
    OR EXISTS(SELECT 1 FROM public.company_members WHERE company_id=c AND user_id=auth.uid() AND is_active AND member_role IN ('owner','manager'))$$;
   CREATE FUNCTION public.company_effective_plan(c uuid) RETURNS text LANGUAGE sql AS $$SELECT plan_key FROM public.companies WHERE id=c$$;
  `);
  await db.exec(source.slice(source.indexOf('create table if not exists public.job_ads ('),source.indexOf('create index if not exists job_ads_company_idx')));
  await db.exec('CREATE FUNCTION public.job_ad_row_json(r public.job_ads) RETURNS jsonb LANGUAGE sql AS $$SELECT to_jsonb(r)$$;');
  await db.exec(originalFunction('job_ad_upsert'));
  await db.exec(originalFunction('job_ad_extend_plan'));
  await db.exec(await readFile(new URL('../docs/sql-review/20261103190000_business_pro_ad_quota_REVIEW.sql',import.meta.url),'utf8'));
  const actor=async n=>db.query("SELECT set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claim.role','authenticated',false)",[id(n)]);
  const quota=async(company=10)=>(await db.query('SELECT public.job_ad_pro_quota($1) AS q',[id(company)])).rows[0].q;
  const create=async(company=10)=>(await db.query(`SELECT public.job_ad_upsert(NULL,$1,'Sintetinis skelbimas','Vilnius',NULL,NULL,NULL,NULL,1000,NULL,false,'Sintetinis darbo aprašymas',ARRAY[]::text[],ARRAY[]::text[]) AS ad`,[id(company)])).rows[0].ad;
  const enable=async(company=10,reference='synthetic-subscription-A')=>db.query("SELECT public.job_ad_set_pro_quota_anchor($1,$2,clock_timestamp()-interval '1 day')",[id(company),reference]);
  const extend=async(ad,request)=> (await db.query('SELECT public.job_ad_extend_plan_with_quota($1,$2) AS ad',[ad,id(request)])).rows[0].ad;
  let ad;
  await actor(1);
  await t.test('existing companies unchanged until trusted subscription enrollment',async()=>{
   assert.equal((await quota()).enabled,false);
   const legacy=await create();assert.equal(legacy.status,'active');
   await enable();assert.equal((await quota()).remaining,10);
   ad=await create();assert.equal((await quota()).remaining,9);
  });
  await t.test('owner and manager share one pool for publication and extensions',async()=>{
   await actor(2);
   for(let n=0;n<9;n++) await extend(ad.id,100+n);
   assert.equal((await quota()).remaining,0);
   await actor(1);assert.equal((await quota()).used,10);
   const paid=await create();assert.equal(paid.status,'pending_payment');assert.equal(paid.expires_at,null);
   assert.equal((await quota()).used,10);
  });
  await t.test('same extension request retries without consuming or extending twice',async()=>{
   const before=await db.query('SELECT expires_at FROM public.job_ads WHERE id=$1',[ad.id]);
   await extend(ad.id,108);
   const after=await db.query('SELECT expires_at FROM public.job_ads WHERE id=$1',[ad.id]);
   assert.deepEqual(after.rows,before.rows);
  });
  await t.test('eleventh free extension and direct legacy RPC are rejected atomically',async()=>{
   const before=(await db.query('SELECT expires_at FROM public.job_ads WHERE id=$1',[ad.id])).rows;
   await assert.rejects(extend(ad.id,999),/Nemokami paskelbimai išnaudoti/);
   await assert.rejects(db.query('SELECT public.job_ad_extend_plan($1)',[ad.id]),/Nemokami paskelbimai išnaudoti/);
   assert.deepEqual((await db.query('SELECT expires_at FROM public.job_ads WHERE id=$1',[ad.id])).rows,before);
  });
  await t.test('paid activation does not consume credits and old paid ads cannot bypass free extension quota',async()=>{
   await db.exec("SELECT set_config('request.jwt.claim.role','service_role',false)");
   await db.query("UPDATE public.job_ads SET paid_via='stripe',expires_at=expires_at+interval '30 days' WHERE id=$1",[ad.id]);
   assert.equal((await quota()).used,10);
   await actor(1);
   await assert.rejects(db.query('SELECT public.job_ad_extend_plan($1)',[ad.id]),/Nemokami paskelbimai išnaudoti/);
  });
  await t.test('editing, removing or reloading ads does not refill credits',async()=>{
   await db.query("UPDATE public.job_ads SET title='Pakeistas sintetinis skelbimas' WHERE id=$1",[ad.id]);
   await db.query("UPDATE public.job_ads SET status='removed' WHERE id=$1",[ad.id]);
   await db.query('DELETE FROM public.job_ads WHERE id=$1',[ad.id]);
   assert.equal((await quota()).used,10);
  });
  await t.test('failed insert rolls its credit back and a different company has its own pool',async()=>{
   await actor(3);
   const other=await create(20);
   await enable(20,'synthetic-subscription-B');
   await assert.rejects(db.query("INSERT INTO public.job_ads(company_id,title,city,salary_min,description,status,paid_via,expires_at) VALUES($1,'x','Vilnius',1000,'Sintetinis aprašymas','active','plan',now()+interval '30 days')",[id(20)]),/check constraint/);
   assert.equal((await quota(20)).remaining,10);
   assert.equal(other.status,'active');
   // All ten credits may extend the same pre-existing ad by 300 more days.
   const before=Date.parse(other.expires_at);
   for(let n=0;n<10;n++) await extend(other.id,300+n);
   assert.equal((await quota(20)).remaining,0);
   const expiry=(await db.query('SELECT expires_at FROM public.job_ads WHERE id=$1',[other.id])).rows[0].expires_at.getTime();
   // timestamptz day arithmetic can cross a DST boundary; allow that hour.
   assert.ok(Math.abs(expiry-before-300*86400000)<=3600000);
  });
  await t.test('unauthorized members cannot read or use another company quota',async()=>{
   await actor(3);await assert.rejects(quota(),/Nėra teisių/);
   await actor(4);await assert.rejects(quota(),/Nėra teisių/);
   await assert.rejects(extend(ad.id,200),/Nėra teisių/);
   await actor(2);await db.exec(`UPDATE public.company_members SET is_active=false WHERE user_id='${id(2)}'`);
   await assert.rejects(quota(),/Nėra teisių/);
  });
  await t.test('anniversary windows clamp short months without drifting; yearly still resets monthly',async()=>{
   const window=async(a,n)=>(await db.query('SELECT * FROM app_private.job_ad_quota_window($1,$2)',[a,n])).rows[0];
   let w=await window('2024-01-31T10:00:00Z','2024-02-29T10:00:00Z');
   assert.equal(w.period_start.toISOString(),'2024-02-29T10:00:00.000Z');
   assert.equal(w.period_end.toISOString(),'2024-03-31T10:00:00.000Z');
   w=await window('2024-01-31T10:00:00Z','2024-03-31T10:00:00Z');
   assert.equal(w.period_start.toISOString(),'2024-03-31T10:00:00.000Z');
   assert.equal((await db.query('SELECT * FROM app_private.job_ad_quota_window($1,$2)',['2027-01-01','2026-01-01'])).rows.length,0);
  });
  await t.test('an older exhausted month does not reduce the next month allowance',async()=>{
   await actor(1);
   await db.query('INSERT INTO public.companies VALUES($1,$2,$3)',[id(30),id(1),'business_pro']);
   await db.query("SELECT public.job_ad_set_pro_quota_anchor($1,'synthetic-subscription-C',clock_timestamp()-interval '3 months 2 days')",[id(30)]);
   await db.query(`INSERT INTO app_private.job_ad_pro_quota_usage
    SELECT t.company_id,t.subscription_ref,w.period_start,10
    FROM app_private.job_ad_pro_quota_terms t CROSS JOIN LATERAL
      app_private.job_ad_quota_window(t.anchor_at,clock_timestamp()-interval '1 month') w WHERE company_id=$1`,[id(30)]);
   const fresh=await quota(30);
   assert.equal(fresh.remaining,10);
   for(let n=0;n<9;n++) await create(30);
   // PGlite serializes these promises; real multi-connection contention remains
   // a required integration test. The shared UPSERT is atomic in PostgreSQL.
   const last=await Promise.all([create(30),create(30)]);
   assert.deepEqual(last.map(a=>a.status).sort(),['active','pending_payment']);
   assert.equal((await quota(30)).used,10);
  });
  await t.test('browser roles cannot change subscription anchors or touch counters',async()=>{
   await db.exec('SET ROLE authenticated');
   await assert.rejects(enable(),/permission denied/);
   await assert.rejects(db.query('SELECT * FROM app_private.job_ad_pro_quota_usage'),/permission denied/);
   await db.exec('RESET ROLE; SET ROLE anon');
   await assert.rejects(quota(),/permission denied/);await db.exec('RESET ROLE');
  });
 }finally{await db.close();}
});
