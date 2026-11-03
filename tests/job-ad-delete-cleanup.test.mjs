import {test} from 'node:test';import assert from 'node:assert/strict';
import {cleanJob,runCleanup} from '../supabase/functions/job-ad-delete/cleanup.mjs';
const folder='30000000-0000-4000-8000-000000000200';
test('purges all CV pages at offset zero and cannot escape application folders',async()=>{
 const objects=Array.from({length:205},(_,i)=>({id:String(i),name:`synthetic-${i}.pdf`}));const removed=[];
 const bucket={list:async(path,options)=>{assert.equal(path,folder);assert.equal(options.offset,0);return {data:objects.slice(0,options.limit)};},remove:async paths=>{for(const path of paths){assert.ok(path.startsWith(folder+'/'));const i=objects.findIndex(x=>folder+'/'+x.name===path);assert.ok(i>=0);objects.splice(i,1);removed.push(path);}return {};}};
 await cleanJob(bucket,{application_folders:[folder]});assert.equal(removed.length,205);assert.equal(objects.length,0);
 await cleanJob(bucket,{application_folders:[folder]});assert.equal(removed.length,205);
 await assert.rejects(cleanJob(bucket,{application_folders:['../worker-documents']}),/Invalid/);
 await assert.rejects(cleanJob({list:async()=>({data:[{id:null,name:'../nested'}]})},{application_folders:[folder]}),/Unexpected/);
});
test('failed Storage cleanup remains queued and stale completion never claims success',async()=>{
 const calls=[];let fails=true;
 const admin={storage:{from:name=>{assert.equal(name,'job-ad-cv');return {list:async()=>fails?{error:new Error('SYNTHETIC PRIVATE ERROR')}:{data:[]}};}},rpc:async(name,args)=>{
 calls.push({name,args});if(name==='job_ad_delete_claim_jobs')return {data:[{job_id:'job',lease_id:'lease',application_folders:[folder]}]};return {data:name==='job_ad_delete_finish_job'?true:null};}};
 assert.equal(await runCleanup(admin,'job'),false);assert.equal(calls.find(x=>x.name==='job_ad_delete_finish_job').args.p_success,false);
 fails=false;assert.equal(await runCleanup(admin,'job'),true);
 const stale={...admin,rpc:async(name,args)=>name==='job_ad_delete_finish_job'?{data:false}:admin.rpc(name,args)};
 assert.equal(await runCleanup(stale,'job'),false);
});

test('legacy nested files stay within their server-authorized root',async()=>{
 const objects=new Set([folder+'/old/nested.pdf',folder+'/direct.pdf']);
 const bucket={list:async prefix=>{
  const children=new Map();for(const path of objects){if(!path.startsWith(prefix+'/'))continue;const tail=path.slice(prefix.length+1);const name=tail.split('/')[0];children.set(name,{id:tail.includes('/')?null:'file',name});}
  return {data:[...children.values()]};
 },remove:async paths=>{for(const path of paths){assert.ok(path.startsWith(folder+'/'));objects.delete(path);}return {};}};
 await cleanJob(bucket,{application_folders:[folder]});assert.equal(objects.size,0);
});
