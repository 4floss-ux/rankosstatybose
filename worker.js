const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

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

  const now = new Date();
  const dateKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Vilnius",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  const visitorHash = await sha256Hex(`${dateKey}|${visitorId}`);

  const city =
    typeof request.cf?.city === "string"
      ? request.cf.city.slice(0, 120)
      : null;
  const country =
    typeof request.cf?.country === "string"
      ? request.cf.country.slice(0, 80)
      : null;

  const supabaseUrl = String(env.VITE_SUPABASE_URL || "").replace(/\/+$/, "");
  const supabaseKey = String(env.VITE_SUPABASE_PUBLISHABLE_KEY || "");

  if (!supabaseUrl || !supabaseKey) {
    return jsonResponse({ ok: false, error: "analytics_not_configured" }, 503);
  }

  const result = await fetch(
    `${supabaseUrl}/rest/v1/rpc/record_site_visit`,
    {
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
    }
  );

  if (!result.ok) {
    return jsonResponse({ ok: false }, 502);
  }

  return jsonResponse({ ok: true });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/analytics/visit") {
      return recordVisit(request, env);
    }

    if (url.pathname.startsWith("/api/")) {
      return jsonResponse({ ok: false, error: "not_found" }, 404);
    }

    return env.ASSETS.fetch(request);
  },
};
