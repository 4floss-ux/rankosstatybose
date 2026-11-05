import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("employer can delete without a close action or closed status", () => {
  const ui = read("src/p24/employer/EmployerAds.jsx");
  assert.match(ui, /Ištrinti skelbimą/);
  assert.match(ui, /job-ad-delete/);
  assert.doesNotMatch(ui, /a\.status\s*===\s*["']closed["']/);
  assert.doesNotMatch(ui, /job_ad_close/);
  assert.match(ui, /iškėlimo dienos bus prarastos/);
});

test("administrator modal closes without closing an advert", () => {
  const ui = read("src/p24/admin/AdminJobAds.jsx");
  assert.match(ui, /Grįžti<\/button>/);
  assert.doesNotMatch(ui, /a\.status\s*===\s*["']closed["']/);
  assert.doesNotMatch(ui, /job_ad_close/);
});

test("public notice does not say an advert was closed", () => {
  assert.doesNotMatch(read("src/public/PublicJobAdsPage.jsx"), /gali būti uždarytas/);
});

test("proposed deletion refuses a pending boosted checkout", () => {
  const sql = read("docs/sql-review/20261103220000_job_ad_delete_REVIEW.sql");
  assert.match(sql, /job_ad_boost_orders[\s\S]*status='pending'/);
  assert.match(sql, /Skelbimo negalima ištrinti, kol vyksta jo iškėlimo mokėjimas/);
  assert.match(sql, /enabled boolean NOT NULL DEFAULT false/);
});

test("retiring closed status is gated on verified deletion activation", () => {
  const sql = read("docs/sql-review/20261105200000_job_ad_closed_retirement_REVIEW.sql");
  assert.match(sql, /job_ad_delete\(uuid\)/);
  assert.match(sql, /job_ad_deletion_policy/);
  assert.match(sql, /IS DISTINCT FROM TRUE/);
  assert.match(sql, /status='closed'/);
  assert.match(sql, /DROP FUNCTION public\.job_ad_close\(uuid\) RESTRICT/);
  assert.match(sql, /CHECK \(status IN \('pending_payment','active','removed'\)\)/);
});

test("reviewed checkout source will not create new closed ad payments", () => {
  const checkout = read("supabase/functions/job-ad-checkout/index.ts");
  assert.match(checkout, /\["pending_payment", "active"\]\.includes\(ad\.status\)/);
  assert.match(checkout, /const AMOUNT_CENTS = 999/);
  assert.match(checkout, /"boost_create", "boost_confirm"/);
});
