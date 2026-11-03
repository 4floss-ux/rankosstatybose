import {test} from 'node:test';
import assert from 'node:assert/strict';
import {jobAdFreeAvailable,jobAdQuotaUnsupported} from '../src/employer/adQuota.js';
test('server quota governs the free/paid offer for the whole company',()=>{
 assert.equal(jobAdFreeAvailable(true,{enabled:true,remaining:1}),true);
 assert.equal(jobAdFreeAvailable(true,{enabled:true,remaining:0}),false);
 assert.equal(jobAdFreeAvailable(true,{enabled:true}),false);
 assert.equal(jobAdFreeAvailable(false,{enabled:true,remaining:10}),false);
});
test('unprovisioned legacy accounts retain their current offer',()=>{
 assert.equal(jobAdFreeAvailable(true,{enabled:false}),true);
 assert.equal(jobAdFreeAvailable(true,null),true);
});
test('only a missing RPC permits legacy compatibility, not authorization/network failures',()=>{
 assert.equal(jobAdQuotaUnsupported({code:'PGRST202'}),true);
 assert.equal(jobAdQuotaUnsupported({code:'42883'}),true);
 assert.equal(jobAdQuotaUnsupported({code:'42501'}),false);
 assert.equal(jobAdQuotaUnsupported({message:'Network failure'}),false);
});
