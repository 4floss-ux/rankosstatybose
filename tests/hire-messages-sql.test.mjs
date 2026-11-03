// Executes the actual proposal in an in-memory PostgreSQL engine, not Supabase.
// Existing schema/auth/hash implementations below are synthetic fixtures.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const { PGlite } = await import(process.env.S24_PGLITE_MODULE || '@electric-sql/pglite');
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const tokenA = 'a'.repeat(64), tokenB = 'b'.repeat(64);

test('Hire SQL proposal with synthetic account/request/session fixtures', async t => {
  const db = new PGlite();
  try {
    await db.exec(`
      CREATE ROLE anon; CREATE ROLE authenticated;
      CREATE SCHEMA auth; CREATE SCHEMA app_private; CREATE SCHEMA extensions;
      CREATE TABLE public.profiles(id uuid PRIMARY KEY, role text, is_active boolean);
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS
        $$ SELECT nullif(current_setting('test.uid', true), '')::uuid $$;
      CREATE FUNCTION public.is_admin() RETURNS boolean LANGUAGE sql AS
        $$ SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role='admin' AND is_active) $$;
      -- Deliberately fake digest: tests check session scoping, NOT cryptography.
      CREATE FUNCTION extensions.digest(text,text) RETURNS bytea LANGUAGE sql AS
        $$ SELECT convert_to($1, 'UTF8') $$;
      CREATE TABLE public.foreign_hire_requests(id uuid PRIMARY KEY, employer_account_id uuid);
      CREATE TABLE public.foreign_employer_accounts(id uuid PRIMARY KEY,
        request_id uuid NOT NULL REFERENCES public.foreign_hire_requests(id) ON DELETE CASCADE,
        is_active boolean NOT NULL, must_change_password boolean NOT NULL);
      ALTER TABLE public.foreign_hire_requests ADD FOREIGN KEY (employer_account_id)
        REFERENCES public.foreign_employer_accounts(id) ON DELETE SET NULL;
      CREATE TABLE public.foreign_employer_sessions(id uuid PRIMARY KEY,
        employer_account_id uuid REFERENCES public.foreign_employer_accounts(id) ON DELETE CASCADE,
        token_hash text, expires_at timestamptz, revoked_at timestamptz);
      INSERT INTO public.profiles VALUES ('${id(1)}','admin',true),('${id(2)}','worker',true);
      INSERT INTO public.foreign_hire_requests(id) VALUES ('${id(10)}'),('${id(20)}');
      INSERT INTO public.foreign_employer_accounts VALUES
        ('${id(100)}','${id(10)}',true,false),('${id(200)}','${id(20)}',true,false);
      UPDATE public.foreign_hire_requests SET employer_account_id='${id(100)}' WHERE id='${id(10)}';
      UPDATE public.foreign_hire_requests SET employer_account_id='${id(200)}' WHERE id='${id(20)}';
      INSERT INTO public.foreign_hire_requests VALUES
        ('${id(11)}','${id(100)}'),('${id(12)}','${id(100)}'),('${id(21)}','${id(200)}');
      INSERT INTO public.foreign_employer_sessions VALUES
        ('${id(1000)}','${id(100)}',encode(extensions.digest('${tokenA}','sha256'),'hex'),now()+interval '1 hour',NULL),
        ('${id(2000)}','${id(200)}',encode(extensions.digest('${tokenB}','sha256'),'hex'),now()+interval '1 hour',NULL);
    `);
    await db.exec(await readFile(new URL('../docs/sql-review/20261103160000_hire_messages_REVIEW.sql', import.meta.url), 'utf8'));
    const actor = async uid => db.query("SELECT set_config('test.uid', $1, false)", [uid]);
    const rows = async (fn, arg) => (await db.query(`SELECT * FROM public.${fn}($1)`, [arg])).rows;
    await actor(id(1));

    await t.test('original and additional needs resolve to one company conversation', async () => {
      for (const request of [10,11,12]) {
        await db.query('SELECT public.hire_admin_send_message($1,$2,$3)', [id(request), `need-${request}`, id(300+request)]);
      }
      const employer = await rows('hire_employer_messages', tokenA);
      assert.equal(employer.length, 3);
      assert.deepEqual(await rows('hire_admin_messages', id(11)), employer);
      assert.deepEqual(await rows('hire_admin_messages', id(12)), employer);
      await db.query('SELECT public.hire_employer_send_message($1,$2,$3)', [tokenA,'reply',id(400)]);
      assert.equal((await rows('hire_admin_messages', id(12))).at(-1).body, 'reply');
    });
    await t.test('another company sees only its own messages', async () => {
      assert.equal((await rows('hire_employer_messages', tokenB)).length, 0);
      await db.query('SELECT public.hire_admin_send_message($1,$2,$3)', [id(21),'company B only',id(421)]);
      assert.equal((await rows('hire_employer_messages', tokenB))[0].body, 'company B only');
      assert.equal((await rows('hire_employer_messages', tokenA)).length, 4);
    });
    await t.test('retry through a sibling request cannot duplicate a message', async () => {
      const args = [id(11),'same retry',id(500)];
      const first = await db.query('SELECT public.hire_admin_send_message($1,$2,$3) AS id', args);
      args[0] = id(12);
      const second = await db.query('SELECT public.hire_admin_send_message($1,$2,$3) AS id', args);
      assert.equal(first.rows[0].id, second.rows[0].id);
      assert.equal((await rows('hire_employer_messages',tokenA)).filter(m=>m.body==='same retry').length, 1);
    });
    await t.test('ordinary and inactive administrators are denied', async () => {
      await actor(id(2));
      await assert.rejects(rows('hire_admin_messages',id(11)), /Access denied/);
      await assert.rejects(db.query('SELECT public.hire_admin_send_message($1,$2,$3)',[id(11),'denied',id(600)]), /Access denied/);
      await actor(id(1));
      await db.query('UPDATE public.profiles SET is_active=false WHERE id=$1',[id(1)]);
      await assert.rejects(rows('hire_admin_messages',id(11)), /Access denied/);
      await db.query('UPDATE public.profiles SET is_active=true WHERE id=$1',[id(1)]);
    });
    await t.test('expired, revoked and inactive/first-password accounts are denied', async () => {
      await db.exec(`UPDATE public.foreign_employer_sessions SET revoked_at=now() WHERE id='${id(1000)}'`);
      await assert.rejects(rows('hire_employer_messages',tokenA),/Access denied/);
      await assert.rejects(db.query('SELECT public.hire_employer_send_message($1,$2,$3)',[tokenA,'denied',id(601)]), /Access denied/);
      await db.exec(`UPDATE public.foreign_employer_sessions SET revoked_at=NULL,expires_at=now()-interval '1 hour' WHERE id='${id(1000)}'`);
      await assert.rejects(rows('hire_employer_messages',tokenA),/Access denied/);
      await db.exec(`UPDATE public.foreign_employer_sessions SET expires_at=now()+interval '1 hour' WHERE id='${id(1000)}'`);
      for (const field of ['is_active','must_change_password']) {
        await db.exec(`UPDATE public.foreign_employer_accounts SET ${field}=${field==='is_active'?'false':'true'} WHERE id='${id(100)}'`);
        await assert.rejects(rows('hire_employer_messages',tokenA),/Access denied/);
        await db.exec(`UPDATE public.foreign_employer_accounts SET ${field}=${field==='is_active'?'true':'false'} WHERE id='${id(100)}'`);
      }
    });
    await t.test('browser roles cannot access table or administrator RPC anonymously', async () => {
      await db.exec('SET ROLE anon');
      await assert.rejects(db.query('SELECT * FROM public.foreign_hire_messages'),/permission denied/);
      await assert.rejects(rows('hire_admin_messages',id(11)),/permission denied/);
      await db.exec('RESET ROLE; SET ROLE authenticated');
      await assert.rejects(db.query('SELECT * FROM public.foreign_hire_messages'),/permission denied/);
      await db.exec('RESET ROLE');
    });
    await t.test('deleting an additional need retains company conversation', async () => {
      const before = await rows('hire_employer_messages',tokenA);
      await db.query('DELETE FROM public.foreign_hire_requests WHERE id=$1',[id(11)]);
      assert.deepEqual(await rows('hire_employer_messages',tokenA),before);
      assert.deepEqual(await rows('hire_admin_messages',id(12)),before);
    });
    await t.test('account-first then original-request deletion is not blocked by messages', async () => {
      await db.query('DELETE FROM public.foreign_employer_accounts WHERE id=$1',[id(100)]);
      await db.query('DELETE FROM public.foreign_hire_requests WHERE id=$1',[id(10)]);
      assert.equal((await db.query('SELECT * FROM public.foreign_hire_messages WHERE request_id=$1',[id(10)])).rows.length,0);
      assert.equal((await rows('hire_employer_messages',tokenB)).length,1);
    });
    await t.test('original-request-first deletion cascades messages within fixture schema', async () => {
      await db.query('DELETE FROM public.foreign_hire_requests WHERE id=$1',[id(20)]);
      assert.equal((await db.query('SELECT * FROM public.foreign_hire_messages')).rows.length,0);
    });
  } finally { await db.close(); }
});
