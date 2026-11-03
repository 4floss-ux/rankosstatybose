import {test} from 'node:test';
import assert from 'node:assert/strict';
import {jobAdFreeAvailable,jobAdFirstFreeAvailable,jobAdOfferValid,jobAdQuotaUnsupported} from '../src/employer/adQuota.js';
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
test('one-time first-ad gift is separate from the Pro extension pool',()=>{
 const offer={enabled:true,remaining:0,first_free_available:true};
 assert.equal(jobAdFirstFreeAvailable(offer),true);
 assert.equal(jobAdFreeAvailable(true,offer),false);
 assert.equal(jobAdFirstFreeAvailable({first_free_available:false}),false);
 assert.equal(jobAdFirstFreeAvailable(null),false);
});
test('malformed offers never confirm a free publication price',()=>{
 for (const value of [null,[],{},'free',{enabled:false},{enabled:'false',first_free_available:true}]) assert.equal(jobAdOfferValid(value),false);
 assert.equal(jobAdOfferValid({enabled:false,first_free_available:true}),true);
 assert.equal(jobAdOfferValid({enabled:false},false),true);
 const offer={enabled:true,limit:10,used:9,remaining:1,resets_at:'2099-12-15T12:00:00Z',first_free_available:false};
 assert.equal(jobAdOfferValid(offer),true);
 for(const change of [{remaining:-1},{remaining:11},{used:NaN},{resets_at:'bad'},{limit:20}]) assert.equal(jobAdOfferValid({...offer,...change}),false);
});
