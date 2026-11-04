import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {PGlite}=await import(process.env.S24_PGLITE_MODULE||'@electric-sql/pglite');
const id=n=>`50000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
test('all authorized savers remain visible after applying',async t=>{
 const db=new PGlite();try{
 await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE SCHEMA auth;
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 CREATE TABLE profiles(id uuid PRIMARY KEY,display_name text,city text);
 CREATE TABLE worker_profiles(user_id uuid PRIMARY KEY,avatar_path text,attendance_rate integer);
 CREATE TABLE job_ads(id uuid PRIMARY KEY,company_id uuid,status text);
 CREATE TABLE job_ad_saves(ad_id uuid,worker_id uuid,PRIMARY KEY(ad_id,worker_id));
 CREATE TABLE job_ad_applications(ad_id uuid,worker_id uuid,status text);
 CREATE TABLE job_ad_nudges(ad_id uuid,worker_id uuid);
 CREATE FUNCTION account_can_use_platform(u uuid) RETURNS boolean LANGUAGE sql AS $$SELECT u IS NOT NULL AND current_setting('test.suspended',true) IS DISTINCT FROM 'yes'$$;
 CREATE FUNCTION job_ad_can_manage(c uuid) RETURNS boolean LANGUAGE sql AS $$SELECT auth.uid()='${id(1)}'::uuid AND c='${id(10)}'::uuid$$;
 INSERT INTO job_ads VALUES('${id(100)}','${id(10)}','active'),('${id(200)}','${id(20)}','active');
 INSERT INTO profiles VALUES('${id(2)}','Kandidatas','Vilnius'),('${id(3)}','Dar nekandidatavo','Kaunas');
 INSERT INTO worker_profiles VALUES('${id(2)}',null,100);
 INSERT INTO job_ad_saves VALUES('${id(100)}','${id(2)}'),('${id(100)}','${id(3)}');
 INSERT INTO job_ad_applications VALUES('${id(100)}','${id(2)}','interview');`);
 await db.exec(await readFile(new URL('../docs/sql-review/20261104230000_job_ad_company_savers_REVIEW.sql',import.meta.url),'utf8'));
 const actor=async n=>db.query("SELECT set_config('request.jwt.claim.sub',$1,false)",[n?id(n):'']);
 const list=async(ad=100)=>(await db.query('SELECT public.job_ad_company_savers($1) x',[id(ad)])).rows[0].x;
 await actor(1);
 await t.test('both saved applicant and non-applicant returned once without private data',async()=>{
  const rows=await list();assert.equal(rows.length,2);assert.equal(rows.find(r=>r.worker_id===id(2)).has_applied,true);assert.equal(rows.find(r=>r.worker_id===id(3)).has_applied,false);
  for(const row of rows)for(const field of ['phone','cv_path','message','interview_note'])assert.equal(Object.hasOwn(row,field),false);
 });
 await t.test('same saved profile stays present through candidate statuses',async()=>{
  for(const status of ['sent','viewed','interview','rejected','withdrawn']){
   await db.query('UPDATE job_ad_applications SET status=$1',[status]);assert.equal((await list()).length,2);
  }
 });
 await t.test('wrong company, employee, suspended and anonymous requests denied',async()=>{
  await assert.rejects(list(200),/Neturite prieigos/);await actor(2);await assert.rejects(list(),/Neturite prieigos/);
  await actor(1);await db.exec("SELECT set_config('test.suspended','yes',false)");await assert.rejects(list(),/Neturite prieigos/);
  await db.exec("SELECT set_config('test.suspended','no',false)");await db.exec('SET ROLE anon');await assert.rejects(list(),/permission denied/);await db.exec('RESET ROLE');
 });
 await t.test('unsaving removes only the saved entry; removed ads are unavailable',async()=>{
  await actor(1);await db.query('DELETE FROM job_ad_saves WHERE worker_id=$1',[id(2)]);assert.equal((await list()).length,1);assert.equal((await db.query('SELECT count(*)::int n FROM job_ad_applications')).rows[0].n,1);
  await db.exec("UPDATE job_ads SET status='removed'");await assert.rejects(list(),/Neturite prieigos/);
 });
 }finally{await db.close();}
});
