import {test} from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
const {PGlite}=await import(process.env.S24_PGLITE_MODULE||'@electric-sql/pglite');
const id=n=>`60000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
test('paid boost proposal in disposable PostgreSQL only',async t=>{
 const db=new PGlite();try{
 await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;CREATE SCHEMA auth;CREATE SCHEMA app_private;
 CREATE TABLE profiles(id uuid PRIMARY KEY,is_active boolean);
 CREATE TABLE companies(id uuid PRIMARY KEY,owner_id uuid,billing_customer_id text,billing_environment text);
 CREATE TABLE job_ads(id uuid PRIMARY KEY,company_id uuid REFERENCES companies(id),city text,status text,published_at timestamptz,expires_at timestamptz);
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 CREATE FUNCTION account_can_use_platform(u uuid) RETURNS boolean LANGUAGE sql AS $$SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id=u AND is_active)$$;
 CREATE FUNCTION job_ad_can_manage(c uuid) RETURNS boolean LANGUAGE sql AS $$SELECT EXISTS(SELECT 1 FROM public.companies WHERE id=c AND owner_id=auth.uid())$$;
 CREATE FUNCTION job_ad_is_live(a job_ads) RETURNS boolean LANGUAGE sql AS $$SELECT a.status='active' AND a.expires_at>now()$$;
 CREATE FUNCTION app_private.public_job_ad_visible(a job_ads) RETURNS boolean LANGUAGE sql AS $$SELECT public.job_ad_is_live(a) AND EXISTS(SELECT 1 FROM public.companies c WHERE c.id=a.company_id AND public.account_can_use_platform(c.owner_id))$$;
 CREATE FUNCTION app_private.public_job_ad_json(a job_ads) RETURNS jsonb LANGUAGE sql AS $$SELECT jsonb_build_object('id',a.id,'city',a.city,'published_at',a.published_at,'expires_at',a.expires_at,'live',true)$$;
 CREATE FUNCTION job_ad_public_detail(p uuid) RETURNS jsonb LANGUAGE sql AS $$SELECT app_private.public_job_ad_json(a) FROM public.job_ads a WHERE id=p AND app_private.public_job_ad_visible(a)$$;
 CREATE FUNCTION job_ads_worker_list() RETURNS jsonb LANGUAGE plpgsql AS $$BEGIN IF auth.uid()<>'${id(2)}'::uuid THEN RAISE EXCEPTION 'Worker only';END IF;RETURN (SELECT jsonb_agg(app_private.public_job_ad_json(a)||jsonb_build_object('application',jsonb_build_object('interview_note','PRIVATE EXISTING FIELD'))) FROM public.job_ads a);END$$;
 CREATE FUNCTION job_ads_company_list(p uuid) RETURNS jsonb LANGUAGE plpgsql AS $$BEGIN IF NOT public.job_ad_can_manage(p) THEN RAISE EXCEPTION 'Denied';END IF;RETURN (SELECT jsonb_agg(app_private.public_job_ad_json(a)) FROM public.job_ads a WHERE a.company_id=p);END$$;
 INSERT INTO profiles VALUES('${id(1)}',true),('${id(2)}',true),('${id(3)}',true);
 INSERT INTO companies(id,owner_id) VALUES('${id(10)}','${id(1)}'),('${id(20)}','${id(3)}');
 INSERT INTO job_ads VALUES('${id(100)}','${id(10)}','Vilnius','active','2020-01-01',now()+interval '45 days'),('${id(101)}','${id(10)}','Vilnius','active','2026-01-01',now()+interval '45 days'),('${id(200)}','${id(20)}','Kaunas','active','2026-01-01',now()+interval '45 days');`);
 await db.exec(await readFile(new URL('../docs/sql-review/20261105003000_job_ad_paid_boost_REVIEW.sql',import.meta.url),'utf8'));
 const actor=async n=>db.query("SELECT set_config('request.jwt.claim.sub',$1,false)",[n?id(n):'']);
 const prepare=async()=> (await db.query('SELECT job_ad_boost_prepare($1,$2) x',[id(100),'test'])).rows[0].x;
 const quote=async()=> (await db.query('SELECT job_ad_boost_quote($1) x',[id(100)])).rows[0].x;
 const list=async(city=null,limit=24,offset=0)=>(await db.query('SELECT job_ads_public_boosted_list($1,$2,$3) x',[city,limit,offset])).rows[0].x;
 let order;
 await t.test('feature defaults OFF; own order has one fixed server price',async()=>{
  await actor(1);assert.equal((await quote()).enabled,false);await assert.rejects(prepare(),/neįjungtas/);
  await db.exec(`UPDATE app_private.job_ad_boost_settings SET enabled=true,test_company_id='${id(10)}'`);order=await prepare();assert.equal(order.amount_cents,499);assert.equal(order.currency,'eur');assert.equal((await prepare()).id,order.id);
  await actor(2);await assert.rejects(prepare(),/Neturite/);await actor(3);await assert.rejects(prepare(),/Neturite/);await actor(1);
 });
 const apply=async(o,sid='cs_synthetic',amount=499)=>(await db.query('SELECT job_ad_boost_activate_paid($1,$2,$3,$4,$5,$6) x',[o.id,sid,amount,'eur','test','webhook'])).rows[0].x;
 await t.test('only trusted server can register and apply verified payment, idempotently',async()=>{
  await db.exec('SET ROLE authenticated');await assert.rejects(apply(order),/permission denied/);await db.exec('RESET ROLE;SET ROLE service_role');
  await db.query('SELECT job_ad_boost_register_session($1,$2)',[order.id,'cs_synthetic']);await assert.rejects(apply(order,'cs_wrong'),/Unverified/);await assert.rejects(apply(order,'cs_synthetic',999),/Unverified/);
  const paid=await apply(order);assert.equal(paid.delivered,true);assert.equal((await apply(order)).boosted_until,paid.boosted_until);await db.exec('RESET ROLE');
  await assert.rejects(prepare(),/jau iškeltas/);
 });
 await t.test('public priority precedes pagination and respects city filters and expiry',async()=>{
  const first=await list(null,1);assert.equal(first.ads[0].id,id(100));assert.equal(first.has_more,true);assert.equal((await list('Kaunas')).ads[0].id,id(200));
  await db.exec('SET ROLE anon');const all=await list();assert.equal(all.ads[0].id,id(100));await assert.rejects(db.query('SELECT * FROM app_private.job_ad_boost_orders'),/permission denied/);await db.exec('RESET ROLE');
  await actor(2);const own=(await db.query('SELECT job_ads_worker_boosted_list() x')).rows[0].x;assert.equal(own[0].application.interview_note,'PRIVATE EXISTING FIELD');
  assert.ok(!(await list()).ads.some(a=>a.application));
  await db.exec("UPDATE app_private.job_ad_boost_settings SET environment='live'");
  assert.equal((await list('Vilnius')).ads[0].id,id(101));
  await db.exec("UPDATE app_private.job_ad_boost_settings SET environment='test'");
  await actor(3);assert.equal((await db.query('SELECT job_ad_boost_quote($1) x',[id(200)])).rows[0].x.enabled,false);
  await actor(1);
 });
 await t.test('expired boosts can be purchased repeatedly without a lifetime limit',async()=>{
  await actor(1);
  for(let n=0;n<3;n++){
   await db.exec("UPDATE app_private.job_ad_boosts SET boosted_at=now()-interval '8 days',boosted_until=now()-interval '1 second'");
   assert.equal((await list('Vilnius')).ads[0].id,id(101));
   const next=await prepare();assert.notEqual(next.id,order.id);order=next;
   await db.exec('SET ROLE service_role');await db.query('SELECT job_ad_boost_register_session($1,$2)',[next.id,`cs_synthetic${n}`]);assert.equal((await apply(next,`cs_synthetic${n}`)).delivered,true);await db.exec('RESET ROLE');
  }
 });
 await t.test('paid but removed advert is recorded for reconciliation, never silently promoted',async()=>{
  await db.exec("UPDATE app_private.job_ad_boosts SET boosted_at=now()-interval '8 days',boosted_until=now()-interval '1 second'");const o=await prepare();
  await db.exec("UPDATE job_ads SET status='removed' WHERE id='"+id(100)+"';SET ROLE service_role");await db.query('SELECT job_ad_boost_register_session($1,$2)',[o.id,'cs_unavailable']);
  const result=await apply(o,'cs_unavailable');assert.equal(result.paid,true);assert.equal(result.delivered,false);await db.exec('RESET ROLE');assert.ok(!(await list()).ads.some(a=>a.id===id(100)));
 });
 }finally{await db.close();}
});
