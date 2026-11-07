import test from "node:test";
import assert from "node:assert/strict";
import { createHmac, webcrypto } from "node:crypto";
import { readFileSync } from "node:fs";
import { verifyCleanupAuth } from "../supabase/functions/job-ad-delete/cleanupAuth.mjs";

const secret="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const signed=(ts,s=secret)=>new Headers({
 "x-s24-cleanup-ts":String(ts),
 "x-s24-cleanup-signature":createHmac("sha256",s).update("statybos24:job-ad-cleanup:v1:"+ts).digest("hex"),
});
const now=1800000000000;
const ts=Math.floor(now/1000);

test("valid short-lived HMAC permits only the cleanup handler", async()=>{
 assert.equal(await verifyCleanupAuth(signed(ts),secret,now,webcrypto.subtle),true);
});
test("no signature or invalid timestamp fails",async()=>{
 assert.equal(await verifyCleanupAuth(new Headers(),secret,now,webcrypto.subtle),false);
 assert.equal(await verifyCleanupAuth(signed("not-time"),secret,now,webcrypto.subtle),false);
});
test("tampering, wrong key and replay outside 2 minutes fail",async()=>{
 assert.equal(await verifyCleanupAuth(signed(ts),secret+"bad",now,webcrypto.subtle),false);
 assert.equal(await verifyCleanupAuth(signed(ts-121),secret,now,webcrypto.subtle),false);
 assert.equal(await verifyCleanupAuth(signed(ts+121),secret,now,webcrypto.subtle),false);
 const h=signed(ts);h.set("x-s24-cleanup-signature","0".repeat(64));
 assert.equal(await verifyCleanupAuth(h,secret,now,webcrypto.subtle),false);
});
test("short secret is rejected",async()=>{
 assert.equal(await verifyCleanupAuth(signed(ts),secret.slice(0,16),now,webcrypto.subtle),false);
});
test("Cron and Edge bind the same payload and never include an administrative bearer",()=>{
 const sql=readFileSync(new URL("../docs/sql-review/20261103221000_job_ad_delete_cleanup_schedule_REVIEW.sql",import.meta.url),"utf8");
 const edge=readFileSync(new URL("../supabase/functions/job-ad-delete/index.ts",import.meta.url),"utf8");
 assert.match(sql,/statybos24:job-ad-cleanup:v1:/);
 assert.match(sql,/extensions\.hmac\(/);
 assert.doesNotMatch(sql,/service_role_key|job_ad_cleanup_service_key|Authorization','Bearer/);
 assert.match(edge,/verifyCleanupAuth\(req.headers,secret\)/);
 assert.match(edge,/user\.auth\.getUser\(\)/);
});
