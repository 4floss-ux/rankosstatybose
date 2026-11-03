// Only roots returned by a service-only database claim, never client paths.
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function cleanJob(bucket, job) {
  if(!Array.isArray(job.application_folders)||!job.application_folders.every(x=>typeof x==='string'&&UUID.test(x))) throw new Error('Invalid cleanup folder');
  let pages=0;
  async function purge(prefix,depth=0){
    if(depth>512)throw new Error('Cleanup depth limit reached');
    // Restart at zero after removal; offsets would skip remaining objects.
    while(true){
      if(++pages>1000)throw new Error('Cleanup page limit reached');
      const {data,error}=await bucket.list(prefix,{limit:100,offset:0,sortBy:{column:'name',order:'asc'}});
      if(error||!Array.isArray(data))throw new Error('Storage list failed');
      if(!data.length)return;
      if(data.some(x=>typeof x.name!=='string'||!x.name||/[\\/]/.test(x.name)||x.name==='.'||x.name==='..'))throw new Error('Unexpected storage object');
      const files=data.filter(x=>x.id).map(x=>`${prefix}/${x.name}`);
      if(files.length){const removed=await bucket.remove(files);if(removed.error)throw new Error('Storage removal failed');}
      for(const folder of data.filter(x=>!x.id))await purge(`${prefix}/${folder.name}`,depth+1);
    }
  }
  for(const folder of job.application_folders)await purge(folder);
}
export async function runCleanup(admin, jobId=null){
  const {data,error}=await admin.rpc('job_ad_delete_claim_jobs',{p_job_id:jobId,p_limit:jobId?1:10});
  if(error||!Array.isArray(data))throw new Error('Cleanup claim failed');
  let completed=false;
  for(const job of data){
    let success=false;
    try{await cleanJob(admin.storage.from('job-ad-cv'),job);success=true;}catch{/* Keep retry work without recording contents or credentials. */}
    const result=await admin.rpc('job_ad_delete_finish_job',{p_job_id:job.job_id,p_lease_id:job.lease_id,p_success:success});
    if(result.error)throw new Error('Cleanup completion failed');
    if(jobId===job.job_id)completed=success&&result.data===true;
  }
  const pruned=await admin.rpc('job_ad_delete_prune_jobs');
  if(pruned.error)throw new Error('Cleanup pruning failed');
  return completed;
}
