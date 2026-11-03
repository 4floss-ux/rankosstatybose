// Actual proposal + existing repo ad RPCs, in local in-memory Postgres only.
// Billing/auth/company helpers are synthetic; no Supabase or Stripe connection.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {PGlite}=await import(process.env.S24_PGLITE_MODULE || '@electric-sql/pglite');
const id=n=>`10000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const source=await readFile(new URL('../supabase/migrations/20261101150000_redesign_job_ads.sql',import.meta.url),'utf8');
const originalFunction=name=>source.slice(source.indexOf(`create or replace function public.${name}(`)).split('end $$;')[0]+'end $$;';

test('First free publication without monthly-quota SQL',async t=>{
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
  await db.exec(await readFile(new URL('../docs/sql-review/20261103200000_first_job_ad_free_REVIEW.sql',import.meta.url),'utf8'));
  const actor=async n=>db.query("SELECT set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claim.role','authenticated',false)",[n?id(n):'']);
  const offer=async company=>(await db.query('SELECT public.job_ad_offer($1) AS x',[id(company)])).rows[0].x;
  const create=async(company,title='Sintetinis skelbimas')=>(await db.query("SELECT public.job_ad_upsert(NULL,$1,$2,'Vilnius',NULL,NULL,NULL,NULL,1000,NULL,false,'Sintetinis darbo aprašymas',ARRAY[]::text[],ARRAY[]::text[]) AS x",[id(company),title])).rows[0].x;
  await t.test('installs and authorizes offers without monthly quota functions',async()=>{
   assert.equal((await db.query("SELECT to_regprocedure('public.job_ad_pro_quota(uuid)') AS f")).rows[0].f,null);
   await actor(1);assert.deepEqual(await offer(10),{enabled:false,first_free_available:false});
   await actor(null);await assert.rejects(offer(10),/Nėra teisių/);
   await actor(4);await assert.rejects(offer(10),/Nėra teisių/);
  });
  await t.test('existing publisher is ineligible when campaign is enabled',async()=>{
   await actor(1);await create(10);
   await db.exec('UPDATE app_private.job_ad_first_free_policy SET enabled=true');
   assert.equal((await offer(10)).first_free_available,false);
  });
  await t.test('Basic and Business first publication is free once, never for extensions',async()=>{
   for(const [n,plan] of [[5,'basic'],[6,'business']]){
    await db.query('INSERT INTO auth.users VALUES($1)',[id(n)]);
    await db.query('INSERT INTO public.companies VALUES($1,$2,$3)',[id(n*10),id(n),plan]);
    await actor(n);assert.equal((await offer(n*10)).first_free_available,true);
    await assert.rejects(create(n*10,'x'),/check constraint/);
    assert.equal((await offer(n*10)).first_free_available,true);
    const first=await create(n*10);assert.equal(first.status,'active');assert.equal(first.paid_via,'plan');
    assert.equal(new Date(first.expires_at)-new Date(first.published_at),30*86400000);
    assert.equal((await create(n*10)).status,'pending_payment');
    await assert.rejects(db.query('SELECT public.job_ad_extend_plan($1)',[first.id]),/Pratęsimas apmokamas/);
    await db.query('DELETE FROM public.job_ads WHERE id=$1',[first.id]);
    assert.equal((await offer(n*10)).first_free_available,false);
   }
  });
  await t.test('team member receives one personal gift and Pro behavior remains unchanged',async()=>{
   await actor(2);assert.equal((await offer(10)).first_free_available,true);
   assert.equal((await create(10)).status,'active');assert.equal((await offer(10)).first_free_available,false);
   // Monthly quota is still absent: no subscription conditions are changed here.
   assert.equal((await create(10)).status,'active');
   await actor(3);assert.equal((await offer(20)).first_free_available,true);await create(20);
   assert.equal((await offer(20)).first_free_available,false);
  });
  await t.test('claims and activation cannot be changed by browser roles',async()=>{
   await db.exec('SET ROLE authenticated');
   await assert.rejects(db.query('UPDATE app_private.job_ad_first_free_policy SET enabled=true'),/permission denied/);
   await assert.rejects(db.query('SELECT * FROM app_private.job_ad_first_free_claims'),/permission denied/);
   await db.exec('RESET ROLE;SET ROLE anon');
   await assert.rejects(offer(10),/permission denied/);await db.exec('RESET ROLE');
  });
 }finally{await db.close();}
});
