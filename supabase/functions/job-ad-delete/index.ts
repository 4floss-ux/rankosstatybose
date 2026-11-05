import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

// HMAC-authorized internal cleanup for removed job ads only.
// Signatures are short-lived and scoped to one ad (or 'all' for recovery cron).
// No service_role keys or HMAC secret are returned to callers or written to logs.
type Mode = "dry_run" | "execute";
type Application = { id: string; ad_id: string; cv_path: string | null };
const encoder = new TextEncoder();
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const response = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
});

async function authenticated(req: Request, mode: Mode, scope: string, secret: string): Promise<boolean> {
  const ts = req.headers.get("x-job-ad-cleanup-ts") ?? "";
  const hex = req.headers.get("x-job-ad-cleanup-hmac") ?? "";
  if (!/^\d{10}$/.test(ts) || !/^[a-f\d]{64}$/i.test(hex)) return false;
  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(ts));
  if (!Number.isFinite(age) || age > 180) return false;
  const sig = new Uint8Array(hex.match(/../g)!.map((pair) => Number.parseInt(pair, 16)));
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  const payload = "statybos24:job-ad-cv-cleanup:v2:" + ts + ":" + mode + ":" + scope;
  const verified = await crypto.subtle.verify("HMAC", key, sig, encoder.encode(payload));
  if (verified) return true;
  // Compatibility with the existing legacy dry-run-only cron.
  return mode === "dry_run" && scope === "all" &&
    await crypto.subtle.verify("HMAC", key, sig, encoder.encode("statybos24:job-ad-cv-cleanup:v1:" + ts + ":dry_run"));
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return response({ error: "Method not allowed" }, 405);
  try {
    const secret = Deno.env.get("JOB_AD_DELETE_CLEANUP_HMAC_SECRET") ?? "";
    if (secret.length < 32) return response({ error: "Cleanup secret missing" }, 503);
    const raw = await req.text();
    if (raw.length > 320) return response({ error: "Invalid request" }, 400);
    let body: { mode?: string; adId?: string };
    try { body = JSON.parse(raw); } catch { return response({ error: "Invalid JSON" }, 400); }
    const mode = body?.mode;
    const scope = body?.adId || "all";
    if ((mode !== "dry_run" && mode !== "execute") ||
      (scope !== "all" && !UUID_RE.test(scope)) ||
      (mode === "execute" && !body?.adId)) return response({ error: "Invalid parameters" }, 400);
    if (!await authenticated(req, mode, scope, secret)) return response({ error: "Unauthorized" }, 401);

    const url = Deno.env.get("SUPABASE_URL") || "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    if (!url || !serviceKey) return response({ error: "Server is not configured" }, 503);
    const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

    // A scoped request must never delete data from a live or merely closed ad.
    if (scope !== "all") {
      const ad = await db.from("job_ads").select("status").eq("id", scope).maybeSingle();
      if (ad.error) return response({ error: "Ad lookup failed" }, 500);
      if (!ad.data || ad.data.status !== "removed") {
        return response({ ok: true, mode, eligible: 0, removed_files: 0, cleaned_applications: 0, reason: "not_removed" });
      }
    }

    let checked = 0;
    let eligible = 0;
    let removedFiles = 0;
    let cleaned = 0;
    let failures = 0;
    let rejectedPaths = 0;
    let hasMore = false;
    const batchSize = 50;
    const maxBatches = 20;
    for (let page = 0; page < maxBatches; page++) {
      const start = page * batchSize;
      let query = db.from("job_ad_applications")
        .select("id,ad_id,cv_path,ad:job_ads!inner(status)")
        .eq("ad.status", "removed")
        .order("id", { ascending: true })
        .range(start, start + batchSize - 1);
      if (scope !== "all") query = query.eq("ad_id", scope);
      const { data, error } = await query;
      if (error) {
        console.error("job-ad-delete applications lookup failed", { code: error.code });
        return response({ error: "Application lookup failed" }, 500);
      }
      const apps = (data || []) as Application[];
      if (!apps.length) break;
      for (const app of apps) {
        checked++;
        if (app.cv_path !== null) {
          if (!app.cv_path.startsWith(app.id + "/") || app.cv_path.includes("..") || app.cv_path.length > 512) {
            rejectedPaths++;
            continue;
          }
          eligible++;
        }
        if (mode === "dry_run") continue;

        const storage = db.storage.from("job-ad-cv");
        let storageFailed = false;
        let countRemovedForApp = 0;
        for (let iteration = 0; iteration < 20; iteration++) {
          const { data: entries, error: listError } = await storage.list(app.id, { limit: 100, offset: 0 });
          if (listError) { storageFailed = true; break; }
          const paths = (entries || []).filter((f) => f.name && f.id)
            .map((f) => app.id + "/" + f.name);
          if (!paths.length) break;
          const { error: rmError } = await storage.remove(paths);
          if (rmError) { storageFailed = true; break; }
          removedFiles += paths.length;
          countRemovedForApp += paths.length;
          if (iteration === 19) storageFailed = true;
        }
        if (storageFailed) {
          failures++;
          console.error("job-ad-delete storage cleanup failed", { application_id: app.id });
          continue;
        }

        // The referenced path might not appear in a listing of an old object; delete it directly too.
        if (app.cv_path && countRemovedForApp === 0) {
          const { error: directError } = await storage.remove([app.cv_path]);
          if (directError) { failures++; continue; }
        }
        if (app.cv_path !== null) {
          const update = await db.from("job_ad_applications")
            .update({ cv_path: null, cv_name: null, cv_sent_at: null })
            .eq("id", app.id).eq("ad_id", app.ad_id).eq("cv_path", app.cv_path);
          if (update.error) { failures++; continue; }
        }
        cleaned++;
      }
      if (apps.length < batchSize) break;
      if (page === maxBatches - 1) hasMore = true;
    }
    const result = { ok: failures === 0 && rejectedPaths === 0 && !hasMore, mode, checked, eligible,
      removed_files: removedFiles, cleaned_applications: cleaned, failures,
      rejected_paths: rejectedPaths, has_more: hasMore };
    if (!result.ok) console.error("job-ad-delete incomplete", { failures, rejectedPaths, hasMore, scope });
    return response(result, result.ok ? 200 : 207);
  } catch (error) {
    console.error("job-ad-delete unexpected error", { name: error instanceof Error ? error.name : "unknown" });
    return response({ error: "Cleanup failed" }, 500);
  }
});
