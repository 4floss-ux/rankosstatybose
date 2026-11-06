// Deliberately cannot deploy the production Worker. No database mutations.
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {STAGE_REF,STAGE_URL,SITE_ORIGIN,ALLOWED_EMAILS,publicStageKey} from '../e2e/policy.mjs';
function stop(message){console.error(message);process.exit(2);}
const key=process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
if(process.env.VITE_SUPABASE_URL!==STAGE_URL || process.env.VITE_E2E_REAL_ACCOUNTS!=='true' || !publicStageKey(key)) stop('Missing verified staging frontend settings.');
const path=process.env.E2E_BACKEND_AUDIT_FILE;if(!path)stop('No completed backend audit. Nothing deployed.');
let audit;try{audit=JSON.parse(readFileSync(path,'utf8'));}catch{stop('Cannot read backend audit.');}
const age=Date.now()-Date.parse(audit.verified_at);
if(audit.project!==STAGE_REF || audit.ready_to_open!==true || audit.outbound_disabled!==true || !Number.isFinite(age) || age<0 || age>6*3600e3)stop('Staging audit is incomplete, stale or for another project.');
const accounts=audit.accounts_verified;
if(!Array.isArray(accounts) || accounts.length!==3 || new Set(accounts.map(x=>x.email)).size!==3 || accounts.some(x=>!ALLOWED_EMAILS.has(x.email)) || !['worker','employer','admin'].every(role=>accounts.some(x=>x.role===role)))stop('All three allowed staging accounts/roles must be verified.');
const digest=createHash('sha256').update(key).digest('hex');if(audit.publishable_key_sha256!==digest)stop('Staging public key does not match the audited project.');
const config=JSON.parse(readFileSync('wrangler.e2e.jsonc','utf8'));
if(config.name!=='statybos24-e2e-test' || config.main!=='./e2e/worker.mjs' || config.routes || config.route || config.env)stop('Unsafe Worker target.');
const build=spawnSync(process.execPath,['scripts/build-e2e.mjs'],{stdio:'inherit'});if(build.status!==0)process.exit(build.status||1);
config.main=resolve(config.main);config.assets.directory=resolve(config.assets.directory);
config.vars={E2E_SUPABASE_PUBLISHABLE_KEY:key,E2E_SAFETY_VERIFIED:'20261106'};
const dir=mkdtempSync(join(tmpdir(),'s24-e2e-config-'));const file=join(dir,'wrangler.json');writeFileSync(file,JSON.stringify(config));
try{
 console.log(`Deploying ONLY ${config.name} at ${SITE_ORIGIN}. Production Worker is excluded.`);
 const result=spawnSync('npx',['--yes','wrangler@4.157.0','deploy','--config',file],{stdio:'inherit',env:process.env,shell:process.platform==='win32'});if(result.error || result.signal || result.status===null)throw new Error('Wrangler did not complete; deployment is unconfirmed.');process.exitCode=result.status;
}finally{rmSync(dir,{recursive:true,force:true});}
