// Real proposed SQL in local Postgres, synthetic users only; no external connection.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const { PGlite } = await import(process.env.S24_PGLITE_MODULE || '@electric-sql/pglite');
const id = n => `40000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
test('candidate news extends existing chat reads without crossing accounts', async t => {
 const db = new PGlite();
 try {
 await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA auth;
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 CREATE TABLE public.profiles(id uuid PRIMARY KEY,is_active boolean, display_name text, suspended boolean NOT NULL DEFAULT false);
 CREATE FUNCTION public.account_can_use_platform(u uuid) RETURNS boolean LANGUAGE sql AS $$SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id=u AND is_active AND NOT suspended)$$;
 CREATE TABLE public.job_ads(id uuid PRIMARY KEY,company_id uuid,status text,title text);
 CREATE TABLE public.job_ad_applications(id uuid PRIMARY KEY,ad_id uuid REFERENCES public.job_ads(id),worker_id uuid,status text,cv_sent_at timestamptz,cv_path text,cv_name text,cv_requested_at timestamptz,interview_at timestamptz,interview_how text,interview_address text,interview_note text,interview_confirmed_at timestamptz);
 CREATE FUNCTION public.job_ad_can_manage(c uuid) RETURNS boolean LANGUAGE sql AS $$SELECT auth.uid()='${id(1)}'::uuid AND c='${id(10)}'::uuid$$;
 INSERT INTO public.profiles(id,is_active,display_name) VALUES('${id(1)}',true,'Darbdavys'),('${id(2)}',true,'Testinis Kandidatas'),('${id(3)}',true,'Kita paskyra'),('${id(4)}',false,'Neaktyvi');
 CREATE TABLE public.companies(id uuid PRIMARY KEY, name text);
 INSERT INTO public.companies VALUES('${id(10)}','Bandymų įmonė'),('${id(20)}','Kita įmonė');
 INSERT INTO public.job_ads VALUES('${id(100)}','${id(10)}','active','Bandomas skelbimas'),('${id(200)}','${id(20)}','active','Kitas skelbimas');
 INSERT INTO public.job_ad_applications(id,ad_id,worker_id,status) VALUES('${id(1000)}','${id(100)}','${id(2)}','sent'),('${id(2000)}','${id(200)}','${id(3)}','sent');`);
 await db.exec(await readFile(new URL('../supabase/migrations/20261101220000_redesign_job_ad_chat.sql',import.meta.url),'utf8'));
 await db.exec(await readFile(new URL('../docs/sql-review/20261104003000_job_ad_news_REVIEW.sql',import.meta.url),'utf8'));
 const actor=async n=>db.query("SELECT set_config('request.jwt.claim.sub',$1,false)",[n?id(n):'']);
 const news=async company=>(await db.query('SELECT * FROM public.job_ad_news($1)',[company?id(company):null])).rows;
 const app=id(1000);
 const ack=async row=>db.query('SELECT public.job_ad_news_read($1,$2)',[row.application_id,JSON.stringify(row.events.map(({kind,version})=>({kind,version})))]);
 const unreadNews=async company=>(await news(company)).filter(row=>row.chat_unread>0||row.events.length>0);
 const send=async body=>db.query('SELECT public.job_ad_chat_send($1,$2)',[app,body]);
 await t.test('incoming messages visible to correct party without opening ad',async()=>{
  await actor(1);await send('Darbdavio žinutė');await actor(2);
  assert.equal((await news())[0].chat_unread,1);assert.equal((await news())[0].participant_name,'Bandymų įmonė');assert.ok((await news())[0].chat_latest_at);
  await actor(3);assert.equal((await unreadNews()).length,0);
  await actor(null);assert.equal((await unreadNews()).length,0);
  await actor(2);await db.query('SELECT * FROM public.job_ad_chat_messages($1)',[app]);assert.equal((await unreadNews()).length,0);
  await send('Kandidato atsakymas');await actor(1);assert.equal((await news(10))[0].chat_unread,1);assert.equal((await news(20)).length,0);
 });
 await t.test('read and outgoing-only employer conversations stay available with zero unread',async()=>{
  await actor(1);
  const before=(await news(10))[0];assert.equal(before.chat_unread,1);
  await db.query('SELECT * FROM public.job_ad_chat_messages($1)',[app]);
  let row=(await news(10))[0];assert.equal(row.application_id,app);assert.equal(row.chat_unread,0);assert.ok(row.chat_latest_at);
  await send('Darbdavio tęsinys');row=(await news(10))[0];assert.equal(row.chat_unread,0);assert.ok(row.chat_latest_at);
  const outgoingOnly=id(3000);
  await db.query("INSERT INTO public.job_ad_applications(id,ad_id,worker_id,status) VALUES($1,$2,$3,'sent')",[outgoingOnly,id(100),id(3)]);
  await db.query('SELECT public.job_ad_chat_send($1,$2)',[outgoingOnly,'Pirmoji darbdavio žinutė, kandidatas dar neatsakė']);
  row=(await news(10)).find(r=>r.application_id===outgoingOnly);
  assert.ok(row);assert.equal(row.chat_unread,0);assert.ok(row.chat_latest_at);assert.deepEqual(row.events,[]);
  await db.query('DELETE FROM public.job_ad_applications WHERE id=$1',[outgoingOnly]);

  // Restore an incoming message for the following CV/read-separation assertions.
  await actor(2);await send('Dar vienas atsakymas');await actor(1);
 });
 await t.test('active but suspended participants cannot list or acknowledge candidate news',async()=>{
  for (const user of [1,2]) {
   await actor(user);assert.ok((await news()).length>0);
   const readsBefore=(await db.query('SELECT count(*)::int n FROM public.job_ad_message_reads')).rows[0].n;
   await db.query('UPDATE public.profiles SET suspended=true WHERE id=$1',[id(user)]);
   assert.equal((await news()).length,0);
   await assert.rejects(ack({application_id:app,events:[{kind:'confirmed',version:'2026-01-01 00:00:00+00'}]}),/Neturite prieigos/);
   assert.equal((await db.query('SELECT count(*)::int n FROM public.job_ad_message_reads')).rows[0].n,readsBefore);
   await db.query('UPDATE public.profiles SET suspended=false WHERE id=$1',[id(user)]);
  }
  await actor(1);
 });
 await t.test('CV upload news readable once without consuming chat unread',async()=>{
  await db.query("UPDATE public.job_ad_applications SET cv_path='synthetic/cv.pdf',cv_name='cv.pdf',cv_sent_at=clock_timestamp() WHERE id=$1",[app]);
  const row=(await news())[0];assert.equal(row.events[0].label,'Kandidatas įkėlė CV');await ack(row);
  assert.equal((await news())[0].chat_unread,1);assert.deepEqual((await news())[0].events,[]);
  await db.query('UPDATE public.job_ad_applications SET cv_sent_at=clock_timestamp() WHERE id=$1',[app]);assert.deepEqual((await news())[0].events,[]);
 });
 await t.test('invite, confirmation, reschedule and same-event deduplication',async()=>{
  await db.query("UPDATE public.job_ad_applications SET status='interview',interview_at=now()+interval '2 days',interview_how='phone',interview_note='Pastaba' WHERE id=$1",[app]);
  await actor(2);let row=(await news())[0];assert.equal(row.events[0].label,'Kvietimas į pokalbį');await ack(row);assert.equal((await unreadNews()).length,0);
  await db.query('UPDATE public.job_ad_applications SET interview_confirmed_at=clock_timestamp() WHERE id=$1',[app]);
  await actor(1);row=(await news())[0];assert.equal(row.events[0].label,'Kandidatas patvirtino pokalbio laiką');await ack(row);
  await db.query('UPDATE public.job_ad_applications SET interview_confirmed_at=clock_timestamp() WHERE id=$1',[app]);assert.deepEqual((await news())[0].events,[]);
  await db.query('UPDATE public.job_ad_applications SET interview_confirmed_at=null WHERE id=$1',[app]);
  assert.ok((await db.query('SELECT interview_confirmed_at FROM public.job_ad_applications WHERE id=$1',[app])).rows[0].interview_confirmed_at);
  await db.query("UPDATE public.job_ad_applications SET interview_at=interview_at+interval '1 hour',interview_confirmed_at=null WHERE id=$1",[app]);
  await actor(2);row=(await news())[0];assert.equal(row.events[0].label,'Pakeistas pokalbio laikas');assert.ok(row.events[0].interview_at);
  await ack(row);assert.equal((await unreadNews()).length,0);
 });
 await t.test('acknowledging an old snapshot cannot swallow a concurrent new time',async()=>{
  await db.query("UPDATE public.job_ad_applications SET interview_at=interview_at+interval '1 hour' WHERE id=$1",[app]);const old=(await news())[0];
  await db.query("UPDATE public.job_ad_applications SET interview_at=interview_at+interval '1 hour' WHERE id=$1",[app]);await ack(old);
  const row=(await news())[0];assert.equal(row.events.length,1);assert.notEqual(row.events[0].version,old.events[0].version);
  await ack(row);await ack(old);assert.equal((await unreadNews()).length,0);
 });
 await t.test('unauthorized reads and anonymous execution denied, RLS retained',async()=>{
  await actor(3);await assert.rejects(ack({application_id:app,events:[{kind:'interview',version:'x'}]}),/Neturite prieigos/);
  await actor(4);assert.equal((await unreadNews()).length,0);
  await db.exec('SET ROLE anon');await assert.rejects(news(),/permission denied/);await db.exec('RESET ROLE');
  assert.equal((await db.query("SELECT relrowsecurity FROM pg_class WHERE relname='job_ad_message_reads'")).rows[0].relrowsecurity,true);
  assert.equal((await db.query("SELECT has_table_privilege('authenticated','public.job_ad_message_reads','SELECT') AS ok")).rows[0].ok,false);
 });
 } finally { await db.close(); }
});
