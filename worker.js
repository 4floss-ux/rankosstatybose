import { maintenancePage } from "./maintenance-page.js";

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

const FALLBACK_SUPABASE_URL = "https://vxbfihnhielqambosmkc.supabase.co";
const FALLBACK_SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_fV4wji_VDNfHeBzmtvlwQw_D7jZjBiB";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: JSON_HEADERS,
  });
}

function detectDevice(request) {
  const mobileHint = request.headers.get("sec-ch-ua-mobile");
  if (mobileHint === "?1") return "mobile";

  const ua = String(request.headers.get("user-agent") || "").toLowerCase();

  if (
    /ipad|tablet|kindle|silk|playbook/.test(ua) ||
    (/android/.test(ua) && !/mobile/.test(ua))
  ) {
    return "tablet";
  }

  if (
    /iphone|ipod|android|mobile|windows phone|opera mini|opera mobi/.test(ua)
  ) {
    return "mobile";
  }

  return ua ? "desktop" : "unknown";
}

function isBot(request) {
  const ua = String(request.headers.get("user-agent") || "").toLowerCase();
  return /bot|crawler|spider|slurp|facebookexternalhit|facebot|whatsapp|telegrambot|discordbot|linkedinbot|preview/.test(
    ua
  );
}

async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function recordVisit(request, env) {
  if (request.method !== "POST") {
    return jsonResponse({ ok: false }, 405);
  }

  if (isBot(request)) {
    return jsonResponse({ ok: true, skipped: "bot" });
  }

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== new URL(request.url).host) {
        return jsonResponse({ ok: false }, 403);
      }
    } catch {
      return jsonResponse({ ok: false }, 403);
    }
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false }, 400);
  }

  const visitorId = String(body?.visitorId || "").trim();
  if (visitorId.length < 12 || visitorId.length > 160) {
    return jsonResponse({ ok: false }, 400);
  }

  const userId =
    typeof body?.userId === "string" && body.userId.length <= 64
      ? body.userId
      : null;

  const dateKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Vilnius",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const visitorHash = await sha256Hex(`${dateKey}|${visitorId}`);

  const city =
    typeof request.cf?.city === "string"
      ? request.cf.city.slice(0, 120)
      : null;

  const country =
    typeof request.cf?.country === "string"
      ? request.cf.country.slice(0, 80)
      : null;

  const supabaseUrl = String(
    env?.VITE_SUPABASE_URL || FALLBACK_SUPABASE_URL
  ).replace(/\/+$/, "");

  const supabaseKey = String(
    env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
      FALLBACK_SUPABASE_PUBLISHABLE_KEY
  );

  const result = await fetch(`${supabaseUrl}/rest/v1/rpc/record_site_visit`, {
    method: "POST",
    headers: {
      apikey: supabaseKey,
      authorization: `Bearer ${supabaseKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      p_visitor_hash: visitorHash,
      p_city: city,
      p_country: country,
      p_device_type: detectDevice(request),
      p_user_id: userId,
    }),
  });

  if (!result.ok) {
    const errorText = await result.text().catch(() => "");
    return jsonResponse(
      {
        ok: false,
        error: "supabase_record_failed",
        status: result.status,
        detail: errorText.slice(0, 300),
      },
      502
    );
  }

  return jsonResponse({ ok: true });
}


/* ---------- Atnaujinimo režimas (MAINTENANCE_MODE) ----------
   Įjungiama Cloudflare nustatymuose: MAINTENANCE_MODE=on, MAINTENANCE_UNTIL=2026-11-02T08:00:00+02:00,
   MAINTENANCE_SECRET=<ilga atsitiktinė eilutė, kaip „Secret“>. Tikrinama serveryje, todėl naršyklėje apeiti neįmanoma:
   kol režimas įjungtas, nė vienas svetainės failas (HTML, JS, CSS, paveikslėliai, /hire, /api) neatiduodamas
   niekam, išskyrus administratorių, kurio slaptažodis ir is_admin patikrinami Supabase pusėje. */
const BYPASS_COOKIE = "s24_maint_admin";
const BYPASS_SECONDS = 12 * 60 * 60;
const loginAttempts = new Map();

const maintenanceOn = (env) => String(env?.MAINTENANCE_MODE || "").trim().toLowerCase() === "on";

function b64url(bytes) {
  let s = "";
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(secret, data) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data)));
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function readCookie(request, name) {
  const raw = request.headers.get("cookie") || "";
  for (const part of raw.split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return "";
}

async function hasAdminBypass(request, env) {
  const secret = String(env?.MAINTENANCE_SECRET || "");
  if (secret.length < 32) return false; // be slapto rakto apėjimas neįmanomas
  const token = readCookie(request, BYPASS_COOKIE);
  const [uid, exp, sig] = token.split(".");
  if (!uid || !exp || !sig) return false;
  if (!(Number(exp) > Math.floor(Date.now() / 1000))) return false;
  return safeEqual(sig, await hmac(secret, `${uid}.${exp}`));
}

function safeNext(value) {
  const v = String(value || "/");
  return v.startsWith("/") && !v.startsWith("//") && !v.startsWith("/__admin") ? v : "/";
}

function maintenanceResponse(env, url, error = "") {
  const html = maintenancePage({ until: String(env?.MAINTENANCE_UNTIL || ""), error, next: safeNext(url.pathname + url.search) });
  return new Response(html, {
    status: 503,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store, no-cache, must-revalidate",
      "retry-after": "900",
      "x-robots-tag": "noindex, nofollow",
      "x-frame-options": "DENY",
      "referrer-policy": "same-origin",
      "content-security-policy": "default-src 'none'; img-src data:; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'unsafe-inline'; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
    },
  });
}

function redirect(location, cookie) {
  const headers = { location, "cache-control": "no-store" };
  if (cookie) headers["set-cookie"] = cookie;
  return new Response(null, { status: 303, headers });
}

async function adminLogin(request, env) {
  if (request.method !== "POST") return redirect("/");
  // Tik iš tos pačios svetainės (naršyklė siunčia Sec-Fetch-Site; „Origin: null“ nebeišmeta klaidos)
  const site = request.headers.get("sec-fetch-site");
  const origin = request.headers.get("origin");
  let sameOrigin = site ? site === "same-origin" : true;
  if (!site && origin && origin !== "null") {
    try { sameOrigin = new URL(origin).host === new URL(request.url).host; } catch { sameOrigin = false; }
  }
  if (!sameOrigin) return new Response("Forbidden", { status: 403 });

  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const now = Date.now();
  const rec = loginAttempts.get(ip) || { n: 0, t: now };
  if (now - rec.t > 10 * 60 * 1000) { rec.n = 0; rec.t = now; }
  if (rec.n >= 5) return redirect("/?admin=rate");

  let form;
  try { form = await request.formData(); } catch { return redirect("/?admin=failed"); }
  const email = String(form.get("email") || "").trim().slice(0, 200);
  const password = String(form.get("password") || "").slice(0, 200);
  const next = safeNext(form.get("next"));
  const secret = String(env?.MAINTENANCE_SECRET || "");
  const fail = () => { rec.n += 1; loginAttempts.set(ip, rec); return redirect("/?admin=failed"); };
  if (!email || !password || secret.length < 32) return fail();

  const supabaseUrl = String(env?.VITE_SUPABASE_URL || FALLBACK_SUPABASE_URL).replace(/\/+$/, "");
  const supabaseKey = String(env?.VITE_SUPABASE_PUBLISHABLE_KEY || FALLBACK_SUPABASE_PUBLISHABLE_KEY);

  // 1) Slaptažodį tikrina Supabase
  const auth = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: supabaseKey, "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  }).catch(() => null);
  if (!auth || !auth.ok) return fail();
  const session = await auth.json().catch(() => null);
  if (!session?.access_token || !session?.user?.id) return fail();

  // 2) Administratoriaus teises tikrina ta pati is_admin funkcija, kurią naudoja svetainė
  const check = await fetch(`${supabaseUrl}/rest/v1/rpc/is_admin`, {
    method: "POST",
    headers: { apikey: supabaseKey, authorization: `Bearer ${session.access_token}`, "content-type": "application/json" },
    body: "{}",
  }).catch(() => null);
  const isAdmin = check && check.ok ? (await check.json().catch(() => false)) === true : false;
  // Testuotojai: tik Cloudflare kintamajame MAINTENANCE_TESTERS išvardyti el. paštai (pvz. testinės paskyros).
  // Slaptažodį vis tiek patikrina Supabase, el. paštas imamas iš Supabase atsakymo, ne iš formos.
  const testers = String(env?.MAINTENANCE_TESTERS || "")
    .split(/[\s,;]+/)
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const sessionEmail = String(session.user.email || "").trim().toLowerCase();
  const isTester = Boolean(sessionEmail) && testers.includes(sessionEmail);
  if (!isAdmin && !isTester) return fail();

  loginAttempts.delete(ip);
  const exp = Math.floor(Date.now() / 1000) + BYPASS_SECONDS;
  const payload = `${session.user.id}.${exp}`;
  const token = `${payload}.${await hmac(secret, payload)}`;
  return adminWelcome(supabaseUrl, session, next, `${BYPASS_COOKIE}=${token}; Path=/; Max-Age=${BYPASS_SECONDS}; HttpOnly; Secure; SameSite=Strict`);
}

// Po prisijungimo administratorius iš karto prijungiamas ir prie pačios svetainės (ta pati Supabase sesija),
// kad nereikėtų jungtis antrą kartą. Sesija įrašoma ten pat, kur ją laiko svetainės Supabase klientas.
function adminWelcome(supabaseUrl, session, next, cookie) {
  let ref = "";
  try { ref = new URL(supabaseUrl).hostname.split(".")[0]; } catch {}
  const stored = {
    access_token: session.access_token,
    token_type: session.token_type || "bearer",
    expires_in: session.expires_in,
    expires_at: session.expires_at || Math.floor(Date.now() / 1000) + Number(session.expires_in || 3600),
    refresh_token: session.refresh_token,
    user: session.user,
  };
  const js = (v) => JSON.stringify(v).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  const html = `<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex"><title>statybos24.lt</title><body style="background:#222631"><script>try{localStorage.setItem(${js(`sb-${ref}-auth-token`)},${js(JSON.stringify(stored))})}catch(e){}location.replace(${js(next)});</script></body>`;
  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "set-cookie": cookie,
      "referrer-policy": "same-origin",
      "x-robots-tag": "noindex, nofollow",
      "content-security-policy": "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; frame-ancestors 'none'",
    },
  });
}

export default {
  async fetch(request, env, ctx) {
    try {
      return await handle(request, env, ctx);
    } catch (err) {
      console.error("worker error", err);
      // Klaidos atveju atnaujinimo metu vis tiek rodomas atnaujinimo puslapis, o ne Cloudflare klaida
      if (maintenanceOn(env)) return maintenanceResponse(env, new URL(request.url), "failed");
      throw err;
    }
  },
};

async function handle(request, env) {
    const url = new URL(request.url);

    // Atnaujinimo režimas – tikrinama prieš bet ką kita
    if (url.pathname === "/api/status") {
      const on = maintenanceOn(env);
      const bypass = on && (await hasAdminBypass(request, env));
      return jsonResponse({ ok: true, maintenance: on && !bypass, bypass });
    }
    if (url.pathname === "/__admin/login") {
      return maintenanceOn(env) ? adminLogin(request, env) : redirect("/");
    }
    if (url.pathname === "/__admin/logout") {
      return redirect("/", `${BYPASS_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`);
    }
    if (maintenanceOn(env) && !(await hasAdminBypass(request, env))) {
      if (url.pathname.startsWith("/api/") || (request.method !== "GET" && request.method !== "HEAD")) {
        return new Response(JSON.stringify({ ok: false, error: "maintenance" }), { status: 503, headers: { ...JSON_HEADERS, "retry-after": "900" } });
      }
      const err = url.searchParams.get("admin");
      return maintenanceResponse(env, url, err === "rate" ? "rate" : err === "failed" ? "failed" : "");
    }

    if (url.pathname === "/api/analytics/visit") {
      return recordVisit(request, env);
    }

    if (url.pathname.startsWith("/api/")) {
      return jsonResponse({ ok: false, error: "not_found" }, 404);
    }

    return withSiteHeaders(url, await env.ASSETS.fetch(request));
}

// Saugumo antraštės visiems svetainės atsakymams ir ilgas talpinimas versijuotiems JS/CSS failams.
const HASHED_BUILD_FILE = /^\/assets\/[^/]+-[A-Za-z0-9_-]{8,}\.(?:js|css)$/;
function withSiteHeaders(url, response) {
  // Po naujo diegimo seno failo nebėra: grąžiname 404, o ne pradinio puslapio HTML (kitaip naršyklė gautų klaidingą tipą).
  if (url.pathname.startsWith("/assets/") && (response.headers.get("content-type") || "").includes("text/html")) {
    return new Response("Not found", { status: 404, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
  }
  const headers = new Headers(response.headers);
  headers.set("x-content-type-options", "nosniff");
  headers.set("referrer-policy", "strict-origin-when-cross-origin");
  headers.set("x-frame-options", "SAMEORIGIN");
  headers.set("permissions-policy", "geolocation=(self), camera=(), microphone=(), payment=(), usb=()");
  if (url.protocol === "https:") headers.set("strict-transport-security", "max-age=31536000");
  if (response.ok && HASHED_BUILD_FILE.test(url.pathname)) headers.set("cache-control", "public, max-age=31536000, immutable");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
