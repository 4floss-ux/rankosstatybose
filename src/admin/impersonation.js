import { supabase } from "../lib/config.js";

// Administratoriaus „Prisijungti kaip“. Administratoriaus sesija laikinai saugoma šioje naršyklėje,
// kad „Grįžti į administratorių“ galėtų ją atkurti. Serveris (edge funkcija admin-impersonate)
// tikrina teises ir kiekvieną prisijungimą įrašo į veiksmų istoriją.
const KEY = "s24-admin-impersonation";

const MAX_AGE = 12 * 3600e3;
let returning = null;

export function getImpersonation(userId) {
  try {
    const value = JSON.parse(window.localStorage.getItem(KEY) || "null");
    if (!value?.refresh_token || value.userId !== userId) return null;
    // Pasibaigus laikui išsaugome atkūrimo duomenis, kol grįžimas patvirtintas.
    const at = Number(value.at);
    return { ...value, expired: !Number.isFinite(at) || at <= 0 || at > Date.now() || Date.now() - at >= MAX_AGE };
  } catch {
    return null;
  }
}

export function watchImpersonation(userId, onExpire) {
  let timer;
  let stopped = false;
  const check = () => {
    window.clearTimeout(timer);
    if (stopped) return;
    const value = getImpersonation(userId);
    if (!value) return;
    if (value.expired) { onExpire(); return; }
    timer = window.setTimeout(check, Math.min(60000, MAX_AGE - (Date.now() - Number(value.at))));
  };
  window.addEventListener("storage", check);
  window.addEventListener("focus", check);
  document.addEventListener("visibilitychange", check);
  check();
  return () => {
    stopped = true;
    window.clearTimeout(timer);
    window.removeEventListener("storage", check);
    window.removeEventListener("focus", check);
    document.removeEventListener("visibilitychange", check);
  };
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
    window.localStorage.setItem(KEY, JSON.stringify({ access_token: session.access_token, refresh_token: session.refresh_token, adminUserId: session.user.id, userId, name: name || data.email || "", at: Date.now() }));
  } catch {
    throw new Error("Naršyklė neleidžia išsaugoti administratoriaus sesijos.");
  }

  const verified = await supabase.auth.verifyOtp({ token_hash: data.tokenHash, type: "magiclink" });
  if (verified.error || !verified.data?.session) {
    const restored = await supabase.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token });
    if (!restored.error && restored.data?.session?.user?.id === session.user.id) {
      try { window.localStorage.removeItem(KEY); } catch { /* ignore */ }
    }
    throw new Error(verified.error?.message || "Nepavyko prisijungti kaip naudotojas.");
  }
  window.location.assign("/");
}

async function restoreAdministrator() {
  const saved = JSON.parse(window.localStorage.getItem(KEY) || "null");
  if (!saved?.refresh_token) throw new Error("Administratoriaus sesija nerasta. Prisijunkite iš naujo.");
  const { data: current, error: currentError } = await supabase.auth.getSession();
  if (currentError) throw currentError;
  let session = current?.session;
  if (session?.user?.id === saved.userId) {
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) throw error;
    session = null;
  }
  // Pakartojant po laikinos RPC klaidos jau atkurto admino neišjungiame.
  if (!session) {
    const restored = await supabase.auth.setSession({ access_token: saved.access_token, refresh_token: saved.refresh_token });
    if (restored.error) throw restored.error;
    session = restored.data?.session;
  }
  if (!session?.user?.id || session.user.id === saved.userId ||
      (saved.adminUserId && session.user.id !== saved.adminUserId)) {
    throw new Error("Nepavyko atkurti administratoriaus sesijos.");
  }
  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error) throw error;
  if (isAdmin !== true) throw new Error("Nepavyko atkurti administratoriaus sesijos.");
  // Neištriname kito skirtuko naujesnio atkūrimo įrašo.
  const latest = JSON.parse(window.localStorage.getItem(KEY) || "null");
  if (latest?.refresh_token === saved.refresh_token && latest?.at === saved.at) {
    window.localStorage.removeItem(KEY);
  }
  window.location.assign("/");
}

export function endImpersonation() {
  if (!returning) returning = restoreAdministrator().finally(() => { returning = null; });
  return returning;
}

// Aiškus atsarginis kelias, jei admino sesija nebegalioja: tik vietinis atsijungimas.
export async function leaveImpersonation() {
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) throw error;
  window.localStorage.removeItem(KEY);
  window.location.assign("/");
}
