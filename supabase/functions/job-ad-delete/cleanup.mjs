// Only folders returned by a service-only database claim, never client paths.
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function cleanJob(bucket, job) {
  if(!Array.isArray(job.application_folders)||!job.application_folders.every(x=>typeof x==='string'&&UUID.test(x))) throw new Error('Invalid cleanup folder');
  for(const folder of job.application_folders){
    // Always restart at zero after removing a page; offsets would skip objects.
    for(let page=0;page<100;page++){
      const {data,error}=await bucket.list(folder,{limit:100,offset:0,sortBy:{column:'name',order:'asc'}});
      if(error||!Array.isArray(data))throw new Error('Storage list failed');
      if(!data.length)break;
      // The existing CV uploader writes flat UUID filenames. Reject unexpected
      // nested objects for manual retry rather than deleting outside this folder.
      if(data.some(x=>!x.id||typeof x.name!=='string'||x.name.includes('/')||x.name==='.'||x.name==='..')) throw new Error('Unexpected storage object');
      const removed=await bucket.remove(data.map(x=>`${folder}/${x.name}`));
      if(removed.error)throw new Error('Storage removal failed');
      if(page===99)throw new Error('Cleanup page limit reached');
    }
  }
}
export async function runCleanup(admin, jobId=null){
  const {data,error}=await admin.rpc('job_ad_delete_claim_jobs',{p_job_id:jobId,p_limit:jobId?1:10});
  if(error||!Array.isArray(data))throw new Error('Cleanup claim failed');
  let completed=false;
  for(const job of data){
    let success=false;
    try{await cleanJob(admin.storage.from('job-ad-cv'),job);success=true;}catch{/* Retry queue stores no file contents or error credentials. */}
    const result=await admin.rpc('job_ad_delete_finish_job',{p_job_id:job.job_id,p_lease_id:job.lease_id,p_success:success});
    if(result.error)throw new Error('Cleanup completion failed');
    if(jobId===job.job_id)completed=success&&result.data===true;
  }
  const pruned=await admin.rpc('job_ad_delete_prune_jobs');
  if(pruned.error)throw new Error('Cleanup pruning failed');
  return completed;
}
