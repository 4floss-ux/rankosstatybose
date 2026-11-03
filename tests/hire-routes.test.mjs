import test from 'node:test';
import assert from 'node:assert/strict';
import { HIRE_ORIGIN, isHireHostname, legacyHireRedirect } from '../src/lib/hireRoutes.js';
import worker from '../worker.js';

test('hire uses its exact host, not the main site or similar hostnames', () => {
  assert.equal(isHireHostname('hire.statybos24.lt'),true);
  for(const host of ['statybos24.lt','hire.statybos24.lt.example.test','otherhire.statybos24.lt']) assert.equal(isHireHostname(host),false);
});
test('old routes preserve destination, language and fragment', () => {
  assert.equal(legacyHireRedirect('https://statybos24.lt/hire'),HIRE_ORIGIN+'/');
  assert.equal(legacyHireRedirect('https://statybos24.lt/hire/login?lang=de#form'),HIRE_ORIGIN+'/login?lang=de#form');
  assert.equal(legacyHireRedirect('https://statybos24.lt/hire/portal'),HIRE_ORIGIN+'/portal');
});
test('ordinary routes and POST are not redirected', () => {
  for(const path of ['/','/login','/hire-other','/jobs']) assert.equal(legacyHireRedirect('https://statybos24.lt'+path),null);
  assert.equal(legacyHireRedirect('https://statybos24.lt/hire','POST'),null);
});
test('unusual legacy paths cannot change the redirect host', () => {
  assert.equal(new URL(legacyHireRedirect('https://statybos24.lt/hire//evil.example/test')).origin,HIRE_ORIGIN);
});
test('worker redirects old GET/HEAD routes before assets or any database access', async () => {
  for(const method of ['GET','HEAD']) {
    const response=await worker.fetch(new Request('https://statybos24.lt/hire/login?lang=en',{method}),{});
    assert.equal(response.status,308);assert.equal(response.headers.get('location'),HIRE_ORIGIN+'/login?lang=en');
  }
});
test('the new hire root serves its independent asset binding', async () => {
  const response=await worker.fetch(new Request(HIRE_ORIGIN+'/'),{MAINTENANCE_MODE:'off',ASSETS:{fetch:async()=>new Response('synthetic hire')}});
  assert.equal(response.status,200);assert.equal(await response.text(),'synthetic hire');
});
