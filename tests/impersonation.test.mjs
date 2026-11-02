// Local control-flow tests with a synthetic Supabase API. No network or DB calls.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../src/admin/impersonation.js', import.meta.url), 'utf8');
const KEY = 's24-admin-impersonation';
const AGE = 12 * 3600e3;
async function fixture() {
  let now = 1800000000000;
  const saved = { access_token: 'synthetic-access', refresh_token: 'synthetic-refresh', userId: 'worker-test', adminUserId: 'admin-test', name: 'Testas', at: now };
  const store = new Map([[KEY, JSON.stringify(saved)]]);
  const events = { window: new Map(), document: new Map() };
  const timers = new Map(); const calls = []; let seq = 0;
  let current = { user: { id: 'worker-test' } };
  const target = (type) => ({
    addEventListener(name, fn) { events[type].set(name, fn); },
    removeEventListener(name) { events[type].delete(name); },
  });
  const window = { ...target('window'),
    localStorage: { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, v), removeItem: k => store.delete(k) },
    location: { assign: url => calls.push(['redirect', url]) },
    setTimeout: (fn, ms) => { timers.set(++seq, { fn, at: now + ms }); return seq; },
    clearTimeout: id => timers.delete(id),
  };
  const api = { auth: {
    getSession: async () => ({ data: { session: current }, error: null }),
    signOut: async options => { calls.push(['signOut', options.scope]); current = null; return { error: null }; },
    setSession: async () => { calls.push(['restore']); current = { user: { id: 'admin-test' } }; return { data: { session: current }, error: null }; },
    verifyOtp: async () => ({ data: { session: { user: { id: 'worker-test' } } }, error: null }),
  }, rpc: async name => { calls.push(['rpc', name]); return { data: true, error: null }; },
  functions: { invoke: async () => ({ data: { tokenHash: 'synthetic-otp' }, error: null }) } };
  const context = vm.createContext({ window, document: target('document'), Date: class extends Date { static now() { return now; } } });
  const config = new vm.SyntheticModule(['supabase'], function () { this.setExport('supabase', api); }, { context });
  const mod = new vm.SourceTextModule(source, { context });
  await mod.link(() => config); await mod.evaluate();
  return { mod: mod.namespace, api, store, saved, events, timers, calls, window,
    setCurrent: value => { current = value; },
    advance: ms => { now += ms; for (const [id, t] of [...timers]) if (t.at <= now) { timers.delete(id); t.fn(); } },
  };
}

test('12h boundary expires without deleting administrator recovery data', async () => {
  const f = await fixture(); assert.equal(f.mod.getImpersonation('worker-test').expired, false);
  f.advance(AGE); assert.equal(f.mod.getImpersonation('worker-test').expired, true); assert.ok(f.store.has(KEY));
});
test('another user lookup preserves the original recovery record', async () => {
  const f = await fixture(); assert.equal(f.mod.getImpersonation('other-test'), null); assert.ok(f.store.has(KEY));
});
test('invalid or future timestamp expires safely', async () => {
  const f = await fixture();
  for (const at of [null, 'invalid', 9999999999999]) {
    f.store.set(KEY, JSON.stringify({ ...f.saved, at })); assert.equal(f.mod.getImpersonation('worker-test').expired, true);
  }
});
test('expiry watcher fires and removes listeners on cleanup', async () => {
  const f = await fixture(); let expired = 0;
  const stop = f.mod.watchImpersonation('worker-test', () => expired++);
  f.advance(AGE); assert.equal(expired, 1); stop();
  assert.equal(f.events.window.size, 0); assert.equal(f.events.document.size, 0); assert.equal(f.timers.size, 0);
});
test('focus after sleep checks expiry immediately', async () => {
  const f = await fixture(); let expired = 0;
  f.mod.watchImpersonation('worker-test', () => expired++);
  f.store.set(KEY, JSON.stringify({ ...f.saved, at: f.saved.at - AGE }));
  f.events.window.get('focus')(); assert.equal(expired, 1);
});
test('return signs out target locally, verifies active admin, then clears and redirects', async () => {
  const f = await fixture(); await f.mod.endImpersonation();
  assert.deepEqual(f.calls, [['signOut', 'local'], ['restore'], ['rpc', 'is_admin'], ['redirect', '/']]);
  assert.equal(f.store.has(KEY), false);
});
test('failed local signout preserves recovery and does not restore or redirect', async () => {
  const f = await fixture(); f.api.auth.signOut = async () => ({ error: new Error('offline') });
  await assert.rejects(f.mod.endImpersonation(), /offline/); assert.ok(f.store.has(KEY)); assert.deepEqual(f.calls, []);
});
test('restoration failure retains recovery and supports retry', async () => {
  const f = await fixture(); const restore = f.api.auth.setSession;
  f.api.auth.setSession = async () => ({ error: new Error('offline') });
  await assert.rejects(f.mod.endImpersonation(), /offline/); assert.ok(f.store.has(KEY));
  f.api.auth.setSession = restore; await f.mod.endImpersonation(); assert.equal(f.store.has(KEY), false);
});
test('temporary admin RPC failure retries without signing out the restored admin', async () => {
  const f = await fixture(); const rpc = f.api.rpc;
  f.api.rpc = async () => ({ data: null, error: new Error('offline') });
  await assert.rejects(f.mod.endImpersonation(), /offline/); assert.ok(f.store.has(KEY));
  f.api.rpc = rpc; await f.mod.endImpersonation();
  assert.equal(f.calls.filter(c => c[0] === 'signOut').length, 1);
  assert.equal(f.calls.filter(c => c[0] === 'restore').length, 1);
});
test('ordinary restored user is rejected, keeping recovery data', async () => {
  const f = await fixture(); f.api.rpc = async () => ({ data: false, error: null });
  await assert.rejects(f.mod.endImpersonation(), /Nepavyko/); assert.ok(f.store.has(KEY));
  assert.equal(f.calls.some(c => c[0] === 'redirect'), false);
});
test('wrong restored identity cannot complete return', async () => {
  const f = await fixture(); f.api.auth.setSession = async () => ({ data: { session: { user: { id: 'other-admin-test' } } } });
  await assert.rejects(f.mod.endImpersonation(), /Nepavyko/); assert.ok(f.store.has(KEY));
});
test('concurrent return requests share one operation', async () => {
  const f = await fixture(); const first = f.mod.endImpersonation(); const second = f.mod.endImpersonation();
  assert.equal(first, second); await Promise.all([first, second]);
  assert.equal(f.calls.filter(c => c[0] === 'restore').length, 1);
});
test('legacy record without admin ID is still checked through is_admin', async () => {
  const f = await fixture(); const { adminUserId, ...legacy } = f.saved;
  f.store.set(KEY, JSON.stringify(legacy)); await f.mod.endImpersonation();
  assert.ok(f.calls.some(c => c[0] === 'rpc' && c[1] === 'is_admin'));
});
test('another tab newer recovery record is not removed', async () => {
  const f = await fixture(); f.api.rpc = async () => {
    f.store.set(KEY, JSON.stringify({ ...f.saved, at: f.saved.at + 1 })); return { data: true, error: null };
  };
  await f.mod.endImpersonation(); assert.ok(f.store.has(KEY));
});
test('fresh login fallback clears recovery only after successful local signout', async () => {
  const f = await fixture(); const signOut = f.api.auth.signOut;
  f.api.auth.signOut = async () => ({ error: new Error('offline') });
  await assert.rejects(f.mod.leaveImpersonation(), /offline/); assert.ok(f.store.has(KEY));
  f.api.auth.signOut = signOut; await f.mod.leaveImpersonation(); assert.equal(f.store.has(KEY), false);
});
test('starting impersonation saves original admin identity', async () => {
  const f = await fixture(); f.setCurrent({ user: { id: 'admin-test' }, access_token: 'synthetic', refresh_token: 'synthetic' });
  await f.mod.startImpersonation({ userId: 'worker-test', name: 'Testas' });
  assert.equal(JSON.parse(f.store.get(KEY)).adminUserId, 'admin-test');
});
test('failed OTP plus failed rollback keeps administrator recovery', async () => {
  const f = await fixture(); f.setCurrent({ user: { id: 'admin-test' }, access_token: 'synthetic', refresh_token: 'synthetic' });
  f.api.auth.verifyOtp = async () => ({ error: new Error('synthetic OTP failure') });
  f.api.auth.setSession = async () => ({ error: new Error('synthetic offline') });
  await assert.rejects(f.mod.startImpersonation({ userId: 'worker-test' }), /OTP/);
  assert.ok(f.store.has(KEY));
});
test('failed OTP clears recovery only after rollback confirms original identity', async () => {
  const f = await fixture(); f.setCurrent({ user: { id: 'admin-test' }, access_token: 'synthetic', refresh_token: 'synthetic' });
  f.api.auth.verifyOtp = async () => ({ error: new Error('synthetic OTP failure') });
  await assert.rejects(f.mod.startImpersonation({ userId: 'worker-test' }), /OTP/);
  assert.equal(f.store.has(KEY), false);
});
