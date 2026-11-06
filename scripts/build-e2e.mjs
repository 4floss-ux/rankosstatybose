// Fail-closed build for isolated Statybos24 end-to-end role testing.
// Production project credentials are explicitly forbidden here.
import { publicStageKey } from "../e2e/policy.mjs";
import { spawnSync } from "node:child_process";

const STAGING_REF = "wpldojonwvccdmpmlbfe";
const EXPECTED_URL = `https://${STAGING_REF}.supabase.co`;
const supplied = String(process.env.VITE_SUPABASE_URL || "").replace(/\/+$/, "");
const publishable = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
if (supplied !== EXPECTED_URL || !publicStageKey(publishable)) {
  console.error("QA build blocked: expected staging Supabase URL and staging publishable key.");
  process.exit(1);
}
if (/vxbfihnhielqambosmkc/.test(supplied)) {
  console.error("QA build blocked: production Supabase URL forbidden.");
  process.exit(1);
}
if (process.env.VITE_E2E_REAL_ACCOUNTS !== "true") {
  console.error("QA build blocked: VITE_E2E_REAL_ACCOUNTS=true is required.");
  process.exit(1);
}
delete process.env.SENTRY_AUTH_TOKEN;
delete process.env.SENTRY_ORG;
delete process.env.SENTRY_PROJECT;
const result = spawnSync("npm", ["run", "build", "--", "--outDir", "dist-e2e"], {stdio:"inherit",env:process.env,shell:process.platform==="win32"});
process.exit(result.status === null ? 1 : result.status);
