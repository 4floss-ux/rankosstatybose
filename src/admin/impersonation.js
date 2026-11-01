import { supabase } from "../lib/config.js";

// Administratoriaus „Prisijungti kaip“. Administratoriaus sesija laikinai saugoma šioje naršyklėje,
// kad „Grįžti į administratorių“ galėtų ją atkurti. Serveris (edge funkcija admin-impersonate)
// tikrina teises ir kiekvieną prisijungimą įrašo į veiksmų istoriją.
const KEY = "s24-admin-impersonation";

export function getImpersonation(userId) {
  try {
    const value = JSON.parse(window.localStorage.getItem(KEY) || "null");
    if (!value?.refresh_token) return null;
    // Tik ta pati naudotojo paskyra, į kurią prisijungė administratorius, ir ne seniau nei prieš 12 val.
    if (value.userId !== userId || Date.now() - Number(value.at || 0) > 12 * 3600e3) {
      window.localStorage.removeItem(KEY);
      return null;
    }
    return value;
  } catch {
    return null;
  }
}

export async function startImpersonation({ userId, name }) {
  const { data: current } = await supabase.auth.getSession();
  const session = current?.session;
  if (!session?.refresh_token) throw new Error("Administratoriaus sesija nerasta. Prisijunkite iš naujo.");

  const { data, error } = await supabase.functions.invoke("admin-impersonate", { body: { userId } });
  if (error || !data?.tokenHash) {
    let message = data?.error || "";
    try { if (!message && error?.context?.json) message = (await error.context.json())?.error || ""; } catch { /* ignore */ }
    throw new Error(message || "Nepavyko prisijungti kaip naudotojas.");
  }

  try {
    window.localStorage.setItem(KEY, JSON.stringify({ access_token: session.access_token, refresh_token: session.refresh_token, userId, name: name || data.email || "", at: Date.now() }));
  } catch {
    throw new Error("Naršyklė neleidžia išsaugoti administratoriaus sesijos.");
  }

  const verified = await supabase.auth.verifyOtp({ token_hash: data.tokenHash, type: "magiclink" });
  if (verified.error || !verified.data?.session) {
    await supabase.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token });
    try { window.localStorage.removeItem(KEY); } catch { /* ignore */ }
    throw new Error(verified.error?.message || "Nepavyko prisijungti kaip naudotojas.");
  }
  window.location.assign("/");
}

export async function endImpersonation() {
  let saved = null;
  try { saved = JSON.parse(window.localStorage.getItem(KEY) || "null"); } catch { saved = null; }
  try { await supabase.auth.signOut({ scope: "local" }); } catch { /* ignore */ }
  try { window.localStorage.removeItem(KEY); } catch { /* ignore */ }
  if (saved?.refresh_token) {
    const restored = await supabase.auth.setSession({ access_token: saved.access_token, refresh_token: saved.refresh_token });
    if (restored.error) {
      window.location.assign("/");
      return;
    }
  }
  window.location.assign("/");
}
