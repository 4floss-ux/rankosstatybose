import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hireMessageCall } from '../src/hire/hireMessages.js';

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
