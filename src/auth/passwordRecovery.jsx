import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/config.js";
import { SilentLoader } from "../ui/brand.jsx";
import { AuthModal } from "./AuthModal.jsx";

export function getPasswordRecoveryLocation(href) {
  const url = new URL(href);
  const hash = new URLSearchParams(url.hash.slice(1));
  const requested =
    url.searchParams.get("password_recovery") === "1" ||
    hash.get("type") === "recovery";
  const failed = hash.has("error") || url.searchParams.has("error");
  return {
    requested,
    hasCallback: hash.has("access_token") || hash.has("refresh_token") || url.searchParams.has("code"),
    error: requested && failed
      ? "Atkūrimo nuoroda nebegalioja arba jau panaudota. Paprašykite naujos nuorodos."
      : "",
  };
}

export function rememberPasswordRecoveryUser(userId) {
  try {
    window.sessionStorage.setItem("password-recovery-user", JSON.stringify({ userId, at: Date.now() }));
  } catch { /* Recovery also works when browser storage is unavailable. */ }
}

export function rememberedPasswordRecoveryUser() {
  try {
    const saved = JSON.parse(window.sessionStorage.getItem("password-recovery-user") || "null");
    return saved?.userId && Date.now() - saved.at < 60 * 60 * 1000 ? saved.userId : "";
  } catch { return ""; }
}

export function passwordRecoveryRedirectUrl() {
  const url = new URL(window.location.pathname, window.location.origin);
  url.searchParams.set("password_recovery", "1");
  return url.href;
}

export function clearPasswordRecoveryUrl() {
  try { window.sessionStorage.removeItem("password-recovery-user"); } catch { /* Optional storage. */ }
  const url = new URL(window.location.href);
  url.searchParams.delete("password_recovery");
  for (const name of ["error", "error_code", "error_description"]) {
    url.searchParams.delete(name);
  }
  const hash = new URLSearchParams(url.hash.slice(1));
  if (hash.has("access_token") || hash.has("refresh_token") ||
      hash.get("type") === "recovery" || hash.has("error")) {
    url.hash = "";
  }
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

export function passwordRecoveryErrorMessage(error, fallback) {
  const code = error?.code || "";
  if (code === "over_email_send_rate_limit" || code === "over_request_rate_limit" ||
      error?.status === 429) {
    return "Per daug bandymų. Palaukite kelias minutes ir bandykite dar kartą.";
  }
  if (code === "weak_password") {
    return "Šis slaptažodis per silpnas arba aptiktas nutekintų slaptažodžių sąraše. Pasirinkite kitą, ilgesnį slaptažodį.";
  }
  if (code === "same_password") {
    return "Naujas slaptažodis turi skirtis nuo dabartinio.";
  }
  if (["session_not_found", "session_expired", "bad_jwt", "otp_expired"].includes(code)) {
    return "Atkūrimo nuoroda nebegalioja. Paprašykite naujos nuorodos.";
  }
  return fallback;
}

export async function sendPasswordRecoveryEmail(email) {
  if (!supabase) throw new Error("Trūksta Supabase nustatymų Cloudflare aplinkoje.");
  const cleanEmail = String(email || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new Error("Įveskite galiojantį el. pašto adresą.");
  }
  const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
    redirectTo: passwordRecoveryRedirectUrl(),
  });
  if (error) {
    throw new Error(passwordRecoveryErrorMessage(error,
      "Nepavyko išsiųsti atkūrimo laiško. Bandykite dar kartą."));
  }
  return "Jeigu šiuo el. paštu yra registruota paskyra, išsiuntėme slaptažodžio atkūrimo nuorodą. Patikrinkite gautuosius ir šlamšto aplanką.";
}

export async function updateRecoveredPassword(password, confirmation, expectedUserId) {
  if (!supabase) throw new Error("Trūksta Supabase nustatymų Cloudflare aplinkoje.");
  if (!expectedUserId) throw new Error("Atidarykite el. paštu gautą atkūrimo nuorodą.");
  if (password.length < 8) throw new Error("Slaptažodis turi būti bent 8 simbolių.");
  if (password !== confirmation) throw new Error("Įvesti slaptažodžiai nesutampa.");
  const { data, error: sessionError } = await supabase.auth.getUser();
  if (sessionError || data?.user?.id !== expectedUserId) {
    throw new Error("Atkūrimo sesija nebegalioja arba paskyra pasikeitė. Paprašykite naujos nuorodos.");
  }
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    throw new Error(passwordRecoveryErrorMessage(error,
      "Nepavyko pakeisti slaptažodžio. Bandykite dar kartą."));
  }
}

export function PasswordRecoveryPage({ user, checking, authorized, error, onDone }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [requestOpen, setRequestOpen] = useState(() => new URLSearchParams(window.location.search).get("request") === "1");
  const submitting = useRef(false);
  const requestGeneration = useRef(0);

  useEffect(() => {
    requestGeneration.current += 1;
    submitting.current = false;
    setPassword("");
    setConfirmation("");
    setMessage("");
    setLoading(false);
    setCompleted(false);
    return () => { requestGeneration.current += 1; };
  }, [user?.id]);

  const unavailable = error || (!checking && (!user || !authorized)
    ? "Atkūrimo nuoroda nebegalioja arba jau panaudota. Paprašykite naujos nuorodos."
    : "");

  async function submit(event) {
    event.preventDefault();
    if (checking || unavailable || completed || submitting.current) return;
    submitting.current = true;
    const generation = requestGeneration.current;
    setMessage("");
    setLoading(true);
    try {
      await updateRecoveredPassword(password, confirmation, user?.id);
      if (generation !== requestGeneration.current) return;
      setPassword("");
      setConfirmation("");
      setCompleted(true);
      onDone();
    } catch (err) {
      if (generation === requestGeneration.current) {
        setMessage(err?.message || "Nepavyko pakeisti slaptažodžio.");
      }
    } finally {
      if (generation === requestGeneration.current) {
        submitting.current = false;
        setLoading(false);
      }
    }
  }

  const inputStyle = { width: "100%", border: "1px solid #dfe7ed", borderRadius: 10,
    padding: "12px 13px", font: "inherit" };
  const labelStyle = { display: "grid", gap: 6, fontSize: 14, fontWeight: 700 };

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center",
      padding: 20, background: "#f3f6f8" }}>
      <section aria-labelledby="password-recovery-title" style={{ width: "min(480px, 100%)",
        padding: 28, borderRadius: 20, background: "#fff", boxShadow: "0 16px 60px rgba(16,36,56,.12)" }}>
        <div className="eyebrow">SLAPTAŽODŽIO ATKŪRIMAS</div>
        <h1 id="password-recovery-title" style={{ fontSize: 28, margin: "8px 0 18px" }}>
          {completed ? "Slaptažodis pakeistas" : "Nustatykite naują slaptažodį"}
        </h1>
        {checking ? (
          <SilentLoader size={20} minHeight={42} />
        ) : unavailable ? (
          <>
            <p role="alert" style={{ color: "#a14425", lineHeight: 1.5 }}>{unavailable}</p>
            <button className="btn primary" type="button" onClick={() => setRequestOpen(true)}>
              Gauti naują nuorodą
            </button>
          </>
        ) : completed ? (
          <p role="status" style={{ lineHeight: 1.5 }}>Naujas slaptažodis išsaugotas. Atidaroma jūsų paskyra...</p>
        ) : (
          <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
            <p style={{ margin: "0 0 4px", color: "#526374", lineHeight: 1.5 }}>
              Pasirinkite bent 8 simbolių slaptažodį ir įveskite jį dar kartą.
            </p>
            <label style={labelStyle}>Naujas slaptažodis
              <input style={inputStyle} type="password" autoComplete="new-password"
                required minLength={8} value={password} disabled={loading}
                onChange={(event) => setPassword(event.target.value)} />
            </label>
            <label style={labelStyle}>Pakartokite slaptažodį
              <input style={inputStyle} type="password" autoComplete="new-password"
                required minLength={8} value={confirmation} disabled={loading}
                onChange={(event) => setConfirmation(event.target.value)} />
            </label>
            {message && <p role="alert" style={{ margin: 0, color: "#a14425", lineHeight: 1.5 }}>{message}</p>}
            <button className="btn primary" type="submit" disabled={loading}>
              {loading ? "Išsaugoma..." : "Išsaugoti naują slaptažodį"}
            </button>
          </form>
        )}
      </section>
      <AuthModal open={requestOpen} onClose={() => setRequestOpen(false)} initialMode="forgot" />
    </main>
  );
}
