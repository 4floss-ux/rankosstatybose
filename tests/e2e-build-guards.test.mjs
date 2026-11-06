import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {STAGE_URL} from '../e2e/policy.mjs';
const base={...process.env,VITE_E2E_REAL_ACCOUNTS:'true',VITE_SUPABASE_URL:STAGE_URL,VITE_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_synthetic_local_only_not_a_real_key'};
test('build rejects production URL, private key, missing key and missing E2E mode before npm',()=>{
 for(const overrides of [{VITE_SUPABASE_URL:'https://vxbfihnhielqambosmkc.supabase.co'},{VITE_SUPABASE_PUBLISHABLE_KEY:'sb_secret_not_for_browser'},{VITE_SUPABASE_PUBLISHABLE_KEY:''},{VITE_E2E_REAL_ACCOUNTS:'false'}]){
  const r=spawnSync(process.execPath,['scripts/build-e2e.mjs'],{env:{...base,...overrides},encoding:'utf8'});assert.equal(r.status,1);assert.match(r.stderr,/QA build blocked/);
 }
});
test('deploy cannot run without a completed backend audit',()=>{
 const r=spawnSync(process.execPath,['scripts/deploy-e2e.mjs'],{env:{...base,E2E_BACKEND_AUDIT_FILE:''},encoding:'utf8'});assert.equal(r.status,2);assert.match(r.stderr,/No completed backend audit/);
});
