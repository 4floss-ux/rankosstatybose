import { test } from 'node:test';
import assert from 'node:assert/strict';
import { confirmedInterviewPhone } from '../src/lib/jobAdInterview.js';
test('authorized confirmed candidate phone does not depend on the employer plan',()=>{
 for (const plan of ['basic','business','business_pro']) {
  assert.equal(confirmedInterviewPhone({status:'interview',interview_confirmed_at:'2026-11-04',phone:' +370 600 00000 ',plan}),'+370 600 00000');
 }
});
test('unconfirmed, rescheduled, rejected and absent contacts remain hidden',()=>{
 for (const candidate of [null,{}, {status:'interview',phone:'+37060000000'}, {status:'interview',interview_confirmed_at:null,phone:'+37060000000'}, {status:'rejected',interview_confirmed_at:'2026-11-04',phone:'+37060000000'}, {status:'interview',interview_confirmed_at:'2026-11-04',phone:null}]) assert.equal(confirmedInterviewPhone(candidate),'');
});
