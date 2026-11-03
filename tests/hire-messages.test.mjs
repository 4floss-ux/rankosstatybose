import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hireMessageCall, hireCompanyInitials, hireUnreadCount, loadHireReadIds, saveHireReadIds } from '../src/hire/hireMessages.js';

test('administrator uses request-scoped RPC without employer token', () => {
  assert.deepEqual(hireMessageCall({ requestId: 'synthetic-request' }), {
    name: 'hire_admin_messages', args: { p_request_id: 'synthetic-request' },
  });
});
test('employer cannot select another company by request ID', () => {
  assert.deepEqual(hireMessageCall({ sessionToken: 'synthetic-token' }), {
    name: 'hire_employer_messages', args: { p_session_token: 'synthetic-token' },
  });
  assert.throws(() => hireMessageCall({ requestId: 'other-company', sessionToken: 'synthetic-token' }));
  assert.throws(() => hireMessageCall({}));
});
test('send trims text and retains retry identifier without accepting sender identity', () => {
  assert.deepEqual(hireMessageCall({ sessionToken: 'synthetic-token' }, '  Sveiki!  ', 'retry-id'), {
    name: 'hire_employer_send_message',
    args: { p_session_token: 'synthetic-token', p_body: 'Sveiki!', p_client_id: 'retry-id' },
  });
});
test('empty, too long and unidentifiable messages are rejected', () => {
  for (const body of ['', ' \n ', 'a'.repeat(4001)]) {
    assert.throws(() => hireMessageCall({ requestId: 'synthetic-request' }, body, 'retry-id'));
  }
  assert.throws(() => hireMessageCall({ requestId: 'synthetic-request' }, 'Sveiki'));
  assert.equal(hireMessageCall({ requestId: 'synthetic-request' }, 'a'.repeat(4000), 'retry-id').args.p_body.length, 4000);
});

test('company initials exclude the synthetic test marker and punctuation', () => {
  assert.equal(hireCompanyInitials('[TEST ONLY] Statybos24 Hire'), 'SH');
  assert.equal(hireCompanyInitials('UAB „Statybų darbai“'), 'SD');
  assert.equal(hireCompanyInitials(''), 'Į');
});
test('only unread incoming messages contribute to each role badge', () => {
  const messages = [{ id:'a',sender_kind:'admin' },{ id:'e',sender_kind:'employer' }];
  assert.equal(hireUnreadCount(messages,'admin',new Set()),1);
  assert.equal(hireUnreadCount(messages,'admin',new Set(['e'])),0);
  assert.equal(hireUnreadCount(messages,'employer',new Set(['e'])),1);
});
test('read IDs persist separately for each administrator/company and never contain message bodies', () => {
  const values = new Map(); const storage = { getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value) };
  saveHireReadIds('admin:owner:company-A',new Set(['read-id']),storage);
  assert.deepEqual([...loadHireReadIds('admin:owner:company-A',storage)],['read-id']);
  assert.equal(loadHireReadIds('admin:other:company-A',storage).size,0);
  assert.equal(loadHireReadIds('admin:owner:company-B',storage).size,0);
  assert.equal([...values.values()][0],'["read-id"]');
  const blocked = {getItem(){throw new Error('blocked');},setItem(){throw new Error('blocked');}};
  assert.equal(loadHireReadIds('any',blocked).size,0);
  assert.doesNotThrow(()=>saveHireReadIds('any',new Set(['id']),blocked));
});
