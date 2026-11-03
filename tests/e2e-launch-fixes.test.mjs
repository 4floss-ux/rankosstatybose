import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { effectivePlanKey } from '../src/lib/effectivePlan.js';

const NOW = Date.parse('2026-11-03T12:00:00Z');

test('admin plan: cancelled subscription after period end is Basic (real E2E case)', () => {
  assert.equal(effectivePlanKey({ plan_key: 'business_pro', subscription_status: 'cancelled', plan_current_period_end: '2026-11-01T20:50:29Z' }, NOW), 'basic');
});
test('admin plan: active and valid trial keep their plan, expired trial falls back', () => {
  assert.equal(effectivePlanKey({ plan_key: 'business_pro', subscription_status: 'active' }, NOW), 'business_pro');
  assert.equal(effectivePlanKey({ plan_key: 'business', subscription_status: 'trialing', plan_current_period_end: '2026-12-01T00:00:00Z' }, NOW), 'business');
  assert.equal(effectivePlanKey({ plan_key: 'business', subscription_status: 'trialing', plan_current_period_end: '2026-10-01T00:00:00Z' }, NOW), 'basic');
  assert.equal(effectivePlanKey({ plan_key: null, subscription_status: null }, NOW), 'basic');
  assert.equal(effectivePlanKey(null, NOW), 'basic');
});

test('admin plan: past_due only stays paid within payment grace', () => {
  assert.equal(effectivePlanKey({ plan_key: 'business_pro', subscription_status: 'past_due' }, NOW), 'basic');
  assert.equal(effectivePlanKey({ plan_key: 'business_pro', subscription_status: 'past_due', payment_grace_until: '2026-11-04T00:00:00Z' }, NOW), 'business_pro');
  assert.equal(effectivePlanKey({ plan_key: 'business_pro', subscription_status: 'past_due', payment_grace_until: '2026-11-01T00:00:00Z' }, NOW), 'basic');
});
test('admin plan: pending switch takes effect at the planned time only', () => {
  const base = { plan_key: 'business_pro', subscription_status: 'active', pending_plan_key: 'business' };
  assert.equal(effectivePlanKey({ ...base, pending_plan_effective_at: '2026-11-04T00:00:00Z' }, NOW), 'business_pro');
  assert.equal(effectivePlanKey({ ...base, pending_plan_effective_at: '2026-11-02T00:00:00Z' }, NOW), 'business');
  assert.equal(effectivePlanKey({ ...base, pending_plan_effective_at: null }, NOW), 'business_pro');
});

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('employer: opening a job (incl. the one just created) switches to the job page', () => {
  const src = read('src/employer/EmployerDashboard.jsx');
  const fn = src.slice(src.indexOf('async function openExistingJob'), src.indexOf('async function openExistingJob') + 1200);
  assert.match(fn, /setCurrentJob\(job\);\s*[\s\S]*?setEmployerView\("job"\)/);
  assert.match(src, /current === "new" \? \(currentJob \? "job" : "overview"\)/);
});

test('worker: answered invitation closes the stale invitation page', () => {
  const src = read('src/worker/WorkerDashboard.jsx');
  const fn = src.slice(src.indexOf('async function respondToInvitation'), src.indexOf('function openWorkerCheckIn'));
  assert.match(fn, /setWorkdayDetailsTarget\(/);
  assert.match(fn, /status === "accepted" \? "jobs" : "invites"/);
});

test('worker overview: availability-only action points to the schedule', () => {
  const src = read('src/p24/worker/WorkerOverview.jsx');
  assert.match(src, /actionOnlyAvailability \? "Patvirtinkite darbo grafiką"/);
  assert.match(src, /onGo\(actionOnlyAvailability \? "schedule" : "jobs"\)/);
});

test('admin plan: labels query all billing fields instead of guessing from admin summary', () => {
  const src = read('src/p24/admin/AdminLists.jsx');
  assert.match(src, /\.from\("companies"\)/);
  assert.match(src, /payment_grace_until,pending_plan_key,pending_plan_effective_at/);
  assert.match(src, /planLabel\(x, planRows\)/);
  assert.match(src, /planLabel\(c, planRows\)/);
});
