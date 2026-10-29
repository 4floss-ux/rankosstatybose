import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from './worker.staging.js';

test('staging refuses production hosts and integration API calls', async () => {
  const env = { ASSETS: { fetch() { throw new Error('must not serve'); } } };
  assert.equal((await worker.fetch(new Request('https://statybos24.lt/'), env)).status, 421);
  assert.equal((await worker.fetch(new Request('https://www.statybos24.lt/'), env)).status, 421);
  assert.equal((await worker.fetch(new Request('https://test.statybos24.lt/api/analytics/visit', { method: 'POST' }), env)).status, 403);
});

test('staging serves assets once with noindex and isolated network policy', async () => {
  let calls = 0;
  const response = await worker.fetch(new Request('https://test.statybos24.lt/'), {
    ASSETS: { fetch() { calls++; return new Response('<html>test</html>'); } },
  });
  assert.equal(calls, 1);
  assert.equal(await response.text(), '<html>test</html>');
  assert.match(response.headers.get('X-Robots-Tag'), /noindex/);
  const csp = response.headers.get('Content-Security-Policy');
  assert.match(csp, /wpldojonwvccdmpmlbfe/);
  assert.doesNotMatch(csp, /vxbfihnhielqambosmkc|functions/);
});
