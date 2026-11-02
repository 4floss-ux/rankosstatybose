import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

// Administratoriaus „Prisijungti kaip“: tik aktyvus administratorius gauna vienkartinį prisijungimo raktą
// darbuotojo ar darbdavio paskyrai. Kito administratoriaus paskyrai – negalima. Kiekvienas prisijungimas įrašomas į admin_audit_log.
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply({ error: "Method not allowed" }, 405);
  try {
    const url = Deno.env.get("SUPABASE_URL"), service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"), anon = Deno.env.get("SUPABASE_ANON_KEY");
    if (!url || !service || !anon) return reply({ error: "Serverio konfigūracija neužbaigta." }, 500);
    const auth = req.headers.get("Authorization") || "";
    if (!/^Bearer\s+\S+/i.test(auth)) return reply({ error: "Turite būti prisijungę." }, 401);

    const caller = createClient(url, anon, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
    const [{ data: isAdmin, error: adminErr }, { data: who }] = await Promise.all([caller.rpc("is_admin"), caller.auth.getUser()]);
    if (adminErr || isAdmin !== true || !who?.user?.id) return reply({ error: "Tik administratorius gali prisijungti kaip naudotojas." }, 403);

    let body: any; try { body = await req.json(); } catch { body = {}; }
    const userId = String(body?.userId || "");
    if (!/^[0-9a-f-]{36}$/i.test(userId)) return reply({ error: "Netinkamas naudotojas." }, 400);
    if (userId === who.user.id) return reply({ error: "Negalima prisijungti kaip savo paskyra." }, 400);

    const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: profile } = await admin.from("profiles").select("id, role, is_active").eq("id", userId).maybeSingle();
    if (!profile) return reply({ error: "Naudotojas nerastas." }, 404);
    if (profile.role === "admin") return reply({ error: "Negalima prisijungti kaip kitas administratorius." }, 403);

    const { data: target, error: userErr } = await admin.auth.admin.getUserById(userId);
    const email = target?.user?.email;
    if (userErr || !email) return reply({ error: "Naudotojo el. paštas nerastas." }, 404);

    const { data: link, error: linkErr } = await admin.auth.admin.generateLink({ type: "magiclink", email });
    const tokenHash = link?.properties?.hashed_token;
    if (linkErr || !tokenHash) return reply({ error: "Nepavyko paruošti prisijungimo." }, 500);

    const { error: logErr } = await admin.from("admin_audit_log").insert({
      admin_id: who.user.id, action: "impersonate_start", target_user_id: userId, target_email: email,
      target_role: String(profile.role || ""), metadata: { is_active: profile.is_active },
    });
    if (logErr) return reply({ error: "Nepavyko įrašyti veiksmų istorijos – prisijungimas nutrauktas." }, 500);

    return reply({ tokenHash, email });
  } catch (err) {
    console.error("admin-impersonate failed", err instanceof Error ? err.message : err);
    return reply({ error: "Nepavyko prisijungti kaip naudotojas." }, 500);
  }
});
