import { test } from 'node:test';
import assert from 'node:assert/strict';
import { employerPlanValidity } from '../src/employer/planValidity.js';
const now = Date.parse('2026-11-03T12:00:00Z');
const active = { effective_plan_key:'business_pro', subscription_status:'active', current_period_end:'2026-12-03T12:00:00Z', has_stripe_subscription:true };

test('active paid plan shows actual period end and renewal', () => {
  const result = employerPlanValidity('business_pro',active,null,now);
  assert.equal(result.label,'Planas galioja iki');
  assert.match(result.value,/2026.*gruodžio.*3/);
  assert.match(result.detail,/pratęsiama automatiškai/);
});
test('cancelled renewal shows remaining access and no automatic renewal', () => {
  const result = employerPlanValidity('business_pro',{...active,cancel_at_period_end:true},null,now);
  assert.match(result.detail,/pratęsimas išjungtas/);
  assert.match(result.detail,/taps Basic/);
});
test('trial and grace use their own access deadlines', () => {
  assert.equal(employerPlanValidity('business',null,{subscription_status:'trialing',current_period_end:active.current_period_end},now).label,'Išbandymas iki');
  const result = employerPlanValidity('business_pro',{...active,subscription_status:'past_due',in_payment_grace:true,payment_grace_until:'2026-11-06T12:00:00Z'},null,now);
  assert.equal(result.label,'Plano teisės galioja iki');
  assert.match(result.value,/lapkričio.*6/);
});
test('effective Basic never shows a stale paid expiry date', () => {
  const result = employerPlanValidity('business_pro',{...active,effective_plan_key:'basic'},null,now);
  assert.equal(result.key,'basic');
  assert.equal(result.value,'Neterminuotas');
});
test('missing or invalid dates do not invent validity or throw', () => {
  assert.equal(employerPlanValidity(undefined,null,null,now),null);
  assert.equal(employerPlanValidity('business',{...active,current_period_end:'invalid'},null,now).value,'Data nepateikta');
  assert.match(employerPlanValidity('business',null,{current_period_end:active.current_period_end},now).value,/gruodžio/);
  assert.doesNotMatch(employerPlanValidity('business',null,null,now).detail,/pratęsiama automatiškai/);
});
test('past period is historical and date is displayed in Lithuanian time', () => {
  const result = employerPlanValidity('business',{...active,current_period_end:'2026-11-02T23:30:00Z'},null,now);
  assert.equal(result.label,'Paskutinio laikotarpio pabaiga');
  assert.match(result.value,/lapkričio.*3/);
});
