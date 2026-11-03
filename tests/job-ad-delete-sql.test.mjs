import {test} from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
const {PGlite}=await import(process.env.S24_PGLITE_MODULE||'@electric-sql/pglite');
const id=n=>`30000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const source=await readFile(new URL('../supabase/migrations/20261101150000_redesign_job_ads.sql',import.meta.url),'utf8');
test('permanent advert deletion proposal in synthetic PostgreSQL',async t=>{
 const db=new PGlite();try{
  await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;CREATE SCHEMA auth;CREATE SCHEMA app_private;
  CREATE TABLE auth.users(id uuid PRIMARY KEY);INSERT INTO auth.users VALUES('${id(1)}'),('${id(2)}'),('${id(3)}');
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
  CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql AS $$SELECT 'authenticated'::text$$;
  CREATE FUNCTION public.is_admin() RETURNS boolean LANGUAGE sql AS $$SELECT false$$;
  CREATE TABLE public.companies(id uuid PRIMARY KEY,owner_id uuid,name text,avatar_path text);
  INSERT INTO public.companies VALUES('${id(10)}','${id(1)}','Test one',null),('${id(20)}','${id(2)}','Test two',null);
  CREATE FUNCTION public.job_ad_can_manage(c uuid) RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$SELECT EXISTS(SELECT 1 FROM public.companies WHERE id=c AND owner_id=auth.uid())$$;`);
  await db.exec(source.slice(source.indexOf('create table if not exists public.job_ads ('),source.indexOf('-- ---------- Pagalbinės')));
  await db.exec(`ALTER TABLE public.job_ads ADD COLUMN pending_session_id text;
   CREATE TABLE public.job_ad_payments(stripe_session_id text PRIMARY KEY,ad_id uuid REFERENCES public.job_ads(id) ON DELETE CASCADE,company_id uuid,amount_cents integer,currency text,environment text,paid_at timestamptz DEFAULT now());`);
  const chat=await readFile(new URL('../supabase/migrations/20261101220000_redesign_job_ad_chat.sql',import.meta.url),'utf8');
  await db.exec(chat.slice(0,chat.indexOf('-- Kuri pusė')));
  await db.exec(await readFile(new URL('../docs/sql-review/20261103200000_first_job_ad_free_REVIEW.sql',import.meta.url),'utf8'));
  await db.exec('UPDATE app_private.job_ad_first_free_policy SET enabled=true');
  const cvStart=source.indexOf('create or replace function public.job_ad_cv_access(');
  await db.exec(source.slice(cvStart,source.indexOf('end $$;',cvStart)+8));
  await db.exec('REVOKE ALL ON FUNCTION public.job_ad_cv_access(text,boolean) FROM PUBLIC,anon;GRANT EXECUTE ON FUNCTION public.job_ad_cv_access(text,boolean) TO authenticated;');
  await db.exec(await readFile(new URL('../docs/sql-review/20261103220000_job_ad_delete_REVIEW.sql',import.meta.url),'utf8'));
  assert.equal((await db.query("SELECT has_function_privilege('anon','public.job_ad_cv_access(text,boolean)','EXECUTE') AS x")).rows[0].x,false);

  const actor=async n=>db.query("SELECT set_config('request.jwt.claim.sub',$1,false)",[n?id(n):'']);
  const create=async(n,company=10)=>{await actor(company===10?1:2);await db.query("INSERT INTO public.job_ads(id,company_id,created_by,title,city,salary_min,description,status) VALUES($1,$2,auth.uid(),'Synthetic ad','Vilnius',1000,'Synthetic job description','active')",[id(n),id(company)]);};
  const del=async n=>(await db.query('SELECT public.job_ad_delete($1) AS x',[id(n)])).rows[0].x;
  const count=async table=>(await db.query(`SELECT count(*)::integer AS n FROM ${table}`)).rows[0].n;
  await create(100);
  await t.test('disabled by default, permissions fail closed, no mutation',async()=>{
   await assert.rejects(del(100),/dar neįjungtas/);
   for(const n of [null,2,3]){await actor(n);await assert.rejects(del(100),/teisių/);}
   assert.equal(await count('public.job_ads'),1);
   await db.exec('SET ROLE anon');await assert.rejects(del(100),/permission denied/);await db.exec('RESET ROLE');
  });
  await actor(1);
  await t.test('activation requires an installed retry schedule; schedule stores no secret literal',async()=>{
   const activation=await readFile(new URL('../docs/sql-review/20261103222000_job_ad_delete_ACTIVATE_REVIEW.sql',import.meta.url),'utf8');
   const attempt=async sql=>{try{await db.exec(sql);}catch(error){await db.exec('ROLLBACK');throw error;}};
   await assert.rejects(attempt(activation),/schedule missing/);
   await db.exec(`CREATE SCHEMA cron;CREATE TABLE cron.job(jobname text,active boolean,command text);
    CREATE FUNCTION cron.schedule(n text,s text,c text) RETURNS bigint LANGUAGE plpgsql AS $$BEGIN INSERT INTO cron.job VALUES(n,true,c);RETURN 1;END$$;
    CREATE SCHEMA net;CREATE TABLE net.http_request_queue(headers jsonb);CREATE FUNCTION net.http_post(text,jsonb,jsonb,jsonb,integer) RETURNS bigint LANGUAGE sql AS $$SELECT 1::bigint$$;
    CREATE SCHEMA vault;CREATE TABLE vault.decrypted_secrets(name text,decrypted_secret text);
    INSERT INTO vault.decrypted_secrets VALUES('job_ad_cleanup_url','https://synthetic.supabase.co/functions/v1/job-ad-delete'),('job_ad_cleanup_service_key','synthetic-service-key-for-offline-test');`);
   const scheduler=await readFile(new URL('../docs/sql-review/20261103221000_job_ad_delete_cleanup_schedule_REVIEW.sql',import.meta.url),'utf8');
   await db.exec(scheduler);await assert.rejects(attempt(scheduler),/already exists/);
   const command=(await db.query('SELECT command FROM cron.job')).rows[0].command;
   assert.doesNotMatch(command,/synthetic-service-key-for-offline-test/);
   await db.exec('GRANT SELECT ON net.http_request_queue TO authenticated');
   await assert.rejects(attempt(activation),/readable by browser roles/);
   await db.exec('REVOKE SELECT ON net.http_request_queue FROM authenticated');
   await db.exec(activation);
   assert.equal((await db.query('SELECT public.job_ad_deletion_available($1) AS x',[id(10)])).rows[0].x,true);
  });
  await t.test('checkout lease and pending payment block deletion without changing data',async()=>{
   const lease=(await db.query('SELECT public.job_ad_checkout_acquire($1) AS x',[id(100)])).rows[0].x;
   await assert.rejects(del(100),/apmokėjimas/);
   await db.query('SELECT public.job_ad_checkout_release($1,$2)',[id(100),id(999)]);await assert.rejects(del(100),/apmokėjimas/);
   await db.query('SELECT public.job_ad_checkout_release($1,$2)',[id(100),lease]);
   await db.query("UPDATE public.job_ads SET pending_session_id='synthetic-pending' WHERE id=$1",[id(100)]);
   await assert.rejects(del(100),/apmokėjimas/);await db.query('UPDATE public.job_ads SET pending_session_id=null WHERE id=$1',[id(100)]);
  });
  let job;
  await t.test('hard deletion cascades candidate/chat data, retains only gift and payment accounting',async()=>{
   await db.query("INSERT INTO public.job_ad_applications(id,ad_id,worker_id,status,cv_requested_at,cv_path) VALUES($1,$2,$3,'interview',now(),$4)",[id(200),id(100),id(3),id(200)+'/synthetic.pdf']);
   await db.query("INSERT INTO public.job_ad_messages(application_id,sender_id,sender_side,body) VALUES($1,$2,'worker','PRIVATE MESSAGE')",[id(200),id(3)]);
   await db.query("INSERT INTO public.job_ad_message_reads VALUES($1,'worker',now())",[id(200)]);
   for(const table of ['job_ad_saves','job_ad_views'])await db.query(`INSERT INTO public.${table}(ad_id,worker_id) VALUES($1,$2)`,[id(100),id(3)]);
   await db.query('INSERT INTO public.job_ad_nudges(ad_id,worker_id,created_by) VALUES($1,$2,$3)',[id(100),id(3),id(1)]);
   await db.query("INSERT INTO public.job_ad_payments VALUES('synthetic-payment',$1,$2,999,'eur','test',now())",[id(100),id(10)]);
   const quotaSource=await readFile(new URL('../docs/sql-review/20261103190000_business_pro_ad_quota_REVIEW.sql',import.meta.url),'utf8');
   const receiptStart=quotaSource.indexOf('CREATE TABLE app_private.job_ad_pro_extension_receipts');
   await db.exec(quotaSource.slice(receiptStart,quotaSource.indexOf(');',receiptStart)+2));
   await db.query("INSERT INTO app_private.job_ad_pro_extension_receipts VALUES($1,$2,$3,$4)",[id(10),id(555),id(100),{description:'PRIVATE CACHED AD'}]);
   await actor(3);assert.equal((await db.query('SELECT public.job_ad_cv_access($1,true) AS x',[id(200)+'/new.pdf'])).rows[0].x,true);
   await actor(1);job=await del(100);assert.equal(job.deleted,true);assert.equal(job.cleanup_pending,true);
   for(const table of ['job_ads','job_ad_applications','job_ad_messages','job_ad_message_reads','job_ad_saves','job_ad_views','job_ad_nudges','job_ad_payments'])assert.equal(await count('public.'+table),0,table);
   assert.equal(await count('app_private.job_ad_first_free_claims'),1);
   assert.equal(await count('app_private.job_ad_retained_payments'),1);
   assert.equal((await db.query('SELECT result FROM app_private.job_ad_pro_extension_receipts')).rows[0].result,null);
   const receipt=(await db.query('SELECT * FROM app_private.job_ad_retained_payments')).rows[0];assert.equal(receipt.amount_cents,999);assert.equal(Object.hasOwn(receipt,'description'),false);
   assert.equal((await db.query('SELECT public.job_ad_offer($1) AS x',[id(10)])).rows[0].x.first_free_available,false);
   assert.equal((await db.query('SELECT public.job_ad_cv_access($1,true) AS x',[id(200)+'/new.pdf'])).rows[0].x,false);
   assert.equal((await del(100)).job_id,job.job_id);await actor(2);await assert.rejects(del(100),/teisių/);await actor(1);
  });
  await t.test('cleanup service claims, retries and completes without stale leases or browser access',async()=>{
   await db.exec('SET ROLE authenticated');await assert.rejects(db.query('SELECT public.job_ad_delete_claim_jobs()'),/permission denied/);
   await assert.rejects(db.query('SELECT * FROM app_private.job_ad_retained_payments'),/permission denied/);await db.exec('RESET ROLE; SET ROLE service_role');
   const first=(await db.query('SELECT * FROM public.job_ad_delete_claim_jobs()')).rows[0];assert.deepEqual(first.application_folders,[id(200)]);
   assert.equal((await db.query('SELECT * FROM public.job_ad_delete_claim_jobs()')).rows.length,0);
   assert.equal((await db.query('SELECT public.job_ad_delete_finish_job($1,$2,false) AS x',[job.job_id,first.lease_id])).rows[0].x,true);
   await db.exec('RESET ROLE');await db.exec("UPDATE app_private.job_ad_deletion_jobs SET next_attempt_at=now()-interval '1 minute'");await db.exec('SET ROLE service_role');
   const next=(await db.query('SELECT * FROM public.job_ad_delete_claim_jobs()')).rows[0];assert.notEqual(next.lease_id,first.lease_id);
   assert.equal((await db.query('SELECT public.job_ad_delete_finish_job($1,$2,true) AS x',[job.job_id,first.lease_id])).rows[0].x,false);
   assert.equal((await db.query('SELECT public.job_ad_delete_finish_job($1,$2,true) AS x',[job.job_id,next.lease_id])).rows[0].x,true);await db.exec('RESET ROLE');
   const stored=(await db.query('SELECT application_folders,completed_at FROM app_private.job_ad_deletion_jobs')).rows[0];assert.deepEqual(stored.application_folders,[]);assert.ok(stored.completed_at);
   assert.equal((await del(100)).cleanup_pending,false);
  });
  await t.test('deleting an older paid publication does not fabricate or restore a free gift',async()=>{
   await db.exec('UPDATE app_private.job_ad_first_free_policy SET enabled=false');
   await create(102,20);await db.exec('UPDATE app_private.job_ad_first_free_policy SET enabled=true');
   assert.equal((await db.query('SELECT public.job_ad_offer($1) AS x',[id(20)])).rows[0].x.first_free_available,false);
   const giftsBefore=await count('app_private.job_ad_first_free_claims');
   await del(102);assert.equal(await count('app_private.job_ad_first_free_claims'),giftsBefore);
   assert.equal((await db.query('SELECT public.job_ad_offer($1) AS x',[id(20)])).rows[0].x.first_free_available,false);
   assert.equal(await count('app_private.job_ad_publisher_history'),1);await actor(1);
  });
  await t.test('transaction failure restores advert, receipt and all deletion work',async()=>{
   await create(101);
   await db.exec(`CREATE FUNCTION public.synthetic_fail_delete() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN RAISE EXCEPTION 'synthetic rollback';END$$;
    CREATE TRIGGER synthetic_fail AFTER DELETE ON public.job_ads FOR EACH ROW EXECUTE FUNCTION public.synthetic_fail_delete();`);
   await assert.rejects(del(101),/synthetic rollback/);
   assert.equal(await count('public.job_ads'),1);assert.equal(await count('app_private.job_ad_deletion_jobs'),2);assert.equal(await count('app_private.job_ad_retained_payments'),1);
   await db.exec('DROP TRIGGER synthetic_fail ON public.job_ads');
   assert.equal((await del(101)).cleanup_pending,false);
   await db.exec("UPDATE app_private.job_ad_deletion_jobs SET completed_at=now()-interval '2 days';SELECT public.job_ad_delete_prune_jobs()");
   assert.equal(await count('app_private.job_ad_deletion_jobs'),0);assert.equal(await count('app_private.job_ad_retained_payments'),1);assert.equal(await count('app_private.job_ad_first_free_claims'),1);
  });
 }finally{await db.close();}
});
