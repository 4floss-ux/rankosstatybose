import {test} from 'node:test';
import assert from 'node:assert/strict';
import {publicJobAdPath,publicJobRoute,publicJobAuthReturnUrl} from '../src/lib/publicJobAds.js';
const id='00000000-0000-4000-8000-000000000001';
test('every ad has a stable share path and list/detail routes are distinct',()=>{
 const path=publicJobAdPath(id);
 assert.equal(path,`/darbo-skelbimai/${id}`);
 assert.deepEqual(publicJobRoute(path),{adId:id});
 assert.deepEqual(publicJobRoute('/darbo-skelbimai/'),{list:true});
 assert.equal(publicJobRoute('/'),null);
 assert.deepEqual(publicJobRoute('/darbo-skelbimai/not-an-id'),{invalid:true});
 assert.throws(()=>publicJobAdPath('../private'));
});
test('signup confirmation returns to the exact ad, never an external redirect',()=>{
 const origin='https://statybos24.lt';
 assert.equal(publicJobAuthReturnUrl(publicJobAdPath(id),origin),origin+publicJobAdPath(id));
 for(const path of ['//evil.invalid','https://evil.invalid','/darbo-skelbimai/../admin','/admin',null]) assert.equal(publicJobAuthReturnUrl(path,origin),origin);
 assert.equal(publicJobAuthReturnUrl('/darbo-skelbimai',origin),origin+'/darbo-skelbimai');
});
