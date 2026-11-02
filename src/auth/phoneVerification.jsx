import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/config.js";
import { SilentLoader } from "../ui/brand.jsx";
import { normalizeLithuanianMobilePhone } from "../ui/common.jsx";

export async function invokePhoneVerification(body) {
  if (!supabase) throw new Error("Trūksta svetainės nustatymų.");
  const { data, error } = await supabase.functions.invoke("phone-verification", { body });
  if (error) {
    let message = "Nepavyko patikrinti telefono. Bandykite vėliau.";
    try {
      const response = error.context?.clone?.() || error.context;
      const details = await response?.json?.();
      if (typeof details?.error === "string") message = details.error;
    } catch {}
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

export function loadSmsTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (window.statybos24SmsTurnstile) return window.statybos24SmsTurnstile;
  window.statybos24SmsTurnstile = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = () => window.turnstile ? resolve(window.turnstile) : reject(new Error("Patikra nepasiekiama."));
    script.onerror = () => {
      delete window.statybos24SmsTurnstile;
      script.remove();
      reject(new Error("Nepavyko įkelti patikros. Atnaujinkite puslapį."));
    };
    document.head.appendChild(script);
  });
  return window.statybos24SmsTurnstile;
}

export function SmsCaptcha({ siteKey, resetKey, onToken, onError }) {
  const container = useRef(null);
  const callbacks = useRef({ onToken, onError });
  callbacks.current = { onToken, onError };
  useEffect(() => {
    let cancelled = false, widget = null;
    loadSmsTurnstile().then((api) => {
      if (cancelled || !container.current) return;
      widget = api.render(container.current, {
        sitekey: siteKey, action: "signup_phone", language: "lt", theme: "light",
        appearance: "interaction-only", size: "compact",
        callback: (token) => { if (!cancelled) callbacks.current.onToken(token); },
        "expired-callback": () => { if (!cancelled) callbacks.current.onToken(""); },
        "error-callback": () => {
          if (!cancelled) { callbacks.current.onToken(""); callbacks.current.onError("Patikra nepavyko. Atnaujinkite puslapį ir bandykite dar kartą."); }
        },
      });
    }).catch((error) => { if (!cancelled) callbacks.current.onError(error.message); });
    return () => { cancelled = true; if (widget !== null) window.turnstile?.remove(widget); };
  }, [siteKey, resetKey]);
  return <div ref={container} style={{ maxWidth: "100%" }} />;
}

export function usePhoneVerification({ active, purpose, phone, email = "", userId = "" }) {
  const [config, setConfig] = useState(null);
  const [configError, setConfigError] = useState("");
  const [availability, setAvailability] = useState(null);
  const [availabilityRetry, setAvailabilityRetry] = useState(0);
  const [challenge, setChallenge] = useState(null);
  const [proof, setProof] = useState(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaReset, setCaptchaReset] = useState(0);
  const [clock, setClock] = useState(Date.now());
  const normalizedPhone = normalizeLithuanianMobilePhone(phone);
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const identity = JSON.stringify([active, purpose, normalizedPhone, normalizedEmail, userId]);
  const availabilityIdentity = JSON.stringify([active, purpose, normalizedPhone, userId]);
  const requestState = useRef({ identity, version: 0, busy: false });
  if (requestState.current.identity !== identity) {
    requestState.current = { identity, version: requestState.current.version + 1, busy: false };
  }

  useEffect(() => {
    setChallenge(null); setProof(null); setCode(""); setMessage(""); setError("");
    setBusy(false); setCaptchaToken(""); setCaptchaReset((v) => v + 1);
  }, [identity]);
  useEffect(() => {
    let cancelled = false;
    setConfig(null); setConfigError("");
    if (!active) return;
    invokePhoneVerification({ action: "status", purpose }).then((value) => {
      if (!cancelled) {
        if (typeof value?.enabled !== "boolean") throw new Error("Nepavyko patikrinti telefono nustatymų.");
        setConfig(value);
      }
    }).catch((error) => { if (!cancelled) setConfigError(error.message); });
    return () => { cancelled = true; };
  }, [active, purpose, userId]);
  useEffect(() => {
    if (!active || (!challenge && !proof)) return;
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [active, challenge, proof]);

  useEffect(() => {
    let cancelled = false;
    if (!active || !normalizedPhone || !config || (purpose === "change" && normalizedPhone === config.current_phone)) return;
    setAvailability({ identity: availabilityIdentity, status: "checking" });
    const timer = window.setTimeout(() => {
      invokePhoneVerification({ action: "availability", purpose, phone: normalizedPhone }).then((value) => {
        if (cancelled) return;
        if (typeof value?.available !== "boolean") throw new Error("Nepavyko patikrinti numerio. Bandykite dar kartą.");
        setAvailability({ identity: availabilityIdentity, status: value.available ? "available" : "used" });
      }).catch((error) => {
        if (!cancelled) setAvailability({ identity: availabilityIdentity, status: "error", message: error.message });
      });
    }, 450);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [availabilityIdentity, config?.current_phone, Boolean(config), availabilityRetry]);
  const availabilityStatus = !active || !normalizedPhone || (purpose === "change" && normalizedPhone === config?.current_phone)
    ? "not-required" : availability?.identity === availabilityIdentity ? availability.status : "checking";
  const availabilityError = availabilityStatus === "used" ? "Numeris jau naudojamas."
    : availabilityStatus === "error" ? availability.message || "Nepavyko patikrinti numerio. Bandykite dar kartą." : "";
  const checkingNumber = availabilityStatus === "checking";

  const required = Boolean(config?.enabled && (purpose === "signup" || normalizedPhone !== config.current_phone));
  const verified = Boolean(proof && proof.identity === identity && proof.expiresAt > clock);
  const retrySeconds = challenge?.identity === identity ? Math.max(0, Math.ceil((challenge.retryAt - clock) / 1000)) : 0;
  function requireProof() {
    if (configError) throw new Error(configError);
    if (!config) throw new Error("Palaukite, kol bus patikrinti telefono nustatymai.");
    if (availabilityError) throw new Error(availabilityError);
    if (checkingNumber) throw new Error("Palaukite, kol bus patikrintas numeris.");
    if (!required) return "";
    if (!proof || proof.identity !== identity || proof.expiresAt <= Date.now()) {
      throw new Error("Patvirtinkite telefono numerį SMS kodu.");
    }
    return proof.token;
  }
  async function act(action) {
    if (requestState.current.busy) return;
    const version = requestState.current.version;
    requestState.current.busy = true;
    setBusy(true); setError(""); setMessage("");
    try {
      if (!config?.enabled || !config.ready) throw new Error("SMS patvirtinimas dar neparuoštas. Bandykite vėliau.");
      if (!normalizedPhone) throw new Error("Įveskite galiojantį Lietuvos mobiliojo telefono numerį.");
      if (availabilityError) throw new Error(availabilityError);
      if (checkingNumber) throw new Error("Palaukite, kol bus patikrintas numeris.");
      if (purpose === "signup" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) throw new Error("Prieš siųsdami kodą įveskite el. paštą.");
      if (action === "send" && retrySeconds) throw new Error("Palaukite prieš siųsdami kodą dar kartą.");
      if (action === "send" && purpose === "signup" && !captchaToken) throw new Error("Atlikite patikrą prieš siųsdami SMS.");
      if (action === "verify" && (!challenge || challenge.identity !== identity || !/^\d{6}$/.test(code))) throw new Error("Įveskite gautą 6 skaitmenų SMS kodą.");
      if (action === "send") { setProof(null); setChallenge(null); setCode(""); }
      const value = await invokePhoneVerification({ action, purpose, phone: normalizedPhone, email: normalizedEmail,
        captcha_token: action === "send" ? captchaToken : undefined,
        challenge_id: action === "verify" ? challenge.id : undefined,
        code: action === "verify" ? code : undefined });
      if (requestState.current.version !== version) return;
      const now = Date.now(); setClock(now);
      if (action === "send") {
        if (!value?.challenge_id) throw new Error("Nepavyko išsiųsti SMS kodo.");
        setChallenge({ id: value.challenge_id, identity, retryAt: now + Number(value.retry_after || 60) * 1000 });
      } else {
        const expiresAt = new Date(value?.expires_at).getTime();
        if (!value?.proof || value.phone !== normalizedPhone || !Number.isFinite(expiresAt) || expiresAt <= now) throw new Error("Patvirtinimas nebegalioja. Paprašykite naujo kodo.");
        setProof({ token: value.proof, identity, expiresAt }); setCode("");
      }
    } catch (error) {
      if (requestState.current.version === version) setError(error.message || "Nepavyko patikrinti telefono.");
    } finally {
      if (requestState.current.version === version) {
        requestState.current.busy = false; setBusy(false);
        if (action === "send") { setCaptchaToken(""); setCaptchaReset((v) => v + 1); }
      }
    }
  }
  async function saveChange() {
    const token = requireProof();
    if (!token) return;
    const { data, error } = await supabase.rpc("sms_apply_phone_change", { p_proof: token });
    if (error) throw new Error(error.message || "Nepavyko išsaugoti patvirtinto numerio.");
    if (data?.phone !== normalizedPhone) throw new Error("Nepavyko išsaugoti patvirtinto numerio.");
    setConfig((current) => ({ ...current, current_phone: normalizedPhone }));
    setProof(null); setChallenge(null);
  }
  return { active, purpose, config, configError, required, verified, code, setCode, busy, message, error,
    availabilityError, checkingNumber, availabilityStatus, retryAvailability: () => { setAvailability(null); setAvailabilityRetry((v) => v + 1); },
    retrySeconds, captchaToken, setCaptchaToken, captchaReset, setError, challenge,
    send: () => act("send"), verify: () => act("verify"), requireProof, saveChange,
    unavailable: active && (!config || Boolean(configError) || checkingNumber || Boolean(availabilityError)),
  };
}

export function PhoneAvailabilityHint({ verification: v }) {
  if (!v.active || (!v.checkingNumber && !v.availabilityError)) return null;
  if (!v.availabilityError) {
    return <SilentLoader size={14} minHeight={22} />;
  }
  return (
    <span role="alert" style={{ display: "block", marginTop: 5, fontSize: 13, color: "#ad381f" }}>
      {v.availabilityError}
    </span>
  );
}

export function PhoneVerificationFields({ verification: v }) {
  if (!v.active) return null;
  const style = { gridColumn: "1 / -1", padding: 14, border: "1px solid var(--line, #e2e8ee)", borderRadius: 5,
    background: "var(--soft, #f6f8fa)", fontSize: 13, lineHeight: 1.5 };
  const signup = v.purpose === "signup";
  if (v.configError) return <div style={style} role="alert">{v.configError} Atnaujinkite puslapį ir bandykite dar kartą.</div>;
  if (!v.config) return <div style={style} role="status">Ruošiamas patvirtinimas...</div>;
  if (v.availabilityStatus === "error") return <div style={style}>
    <button type="button" className="btn ghost" onClick={v.retryAvailability}>Tikrinti numerį dar kartą</button>
  </div>;
  if (!v.required || v.availabilityError) return null;
  if (!v.config.ready) return <div style={style} role="alert">SMS patvirtinimas šiuo metu nepasiekiamas. Bandykite vėliau.</div>;
  if (v.verified) return <div style={style} role="status">
    <b>{signup ? "Registracijos kodas patvirtintas" : "Telefono numeris patvirtintas"}</b>
    <p style={{ margin: "4px 0 0", color: "#526374" }}>{signup ? "Galite užbaigti registraciją." : "Išsaugokite pakeitimus."}</p>
  </div>;
  const canRequest = !v.checkingNumber && !v.availabilityError && !v.busy && v.retrySeconds === 0 && (!signup || Boolean(v.captchaToken));
  return (
    <div style={style}>
      <b style={{ color: "var(--navy, #252935)", fontSize: 14 }}>{v.challenge
        ? signup ? "Registracijai patvirtinti įveskite kodą" : "Telefono numeriui patvirtinti įveskite kodą"
        : signup ? "Registracijos patvirtinimas" : "Naujo telefono numerio patvirtinimas"}</b>
      <p style={{ margin: "5px 0 12px", color: "#526374" }}>{v.challenge
        ? "Įveskite į jūsų telefoną atsiųstą 6 skaitmenų kodą."
        : "Į jūsų telefoną atsiųsime 6 skaitmenų patvirtinimo kodą."}</p>
      {v.challenge ? <>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "end" }}>
        <label style={{ flex: "1 1 150px", minWidth: 0, color: "#252935", fontSize: 13 }}>Patvirtinimo kodas
          <input type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
            aria-label="6 skaitmenų SMS kodas" placeholder="000000" value={v.code} disabled={v.busy} autoFocus
            onChange={(event) => v.setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            style={{ width: "100%", boxSizing: "border-box", marginTop: 5, padding: "11px 12px", border: "1px solid var(--line, #cad6df)", borderRadius: 4, background: "#fff",
              fontFamily: "inherit", fontSize: 20, lineHeight: 1.2, letterSpacing: "0.2em" }} />
        </label>
        <button type="button" className="btn primary" disabled={v.busy || v.code.length !== 6} onClick={v.verify}>
          {v.busy ? "Patvirtinama..." : "Patvirtinti kodą"}
        </button>
        </div>
        <div style={{ marginTop: 12 }}>
          {signup && !v.checkingNumber && v.retrySeconds === 0 && <SmsCaptcha siteKey={v.config.site_key} resetKey={v.captchaReset}
            onToken={v.setCaptchaToken} onError={v.setError} />}
          <button type="button" className="btn ghost" disabled={!canRequest} onClick={v.send} style={{ fontSize: 13 }}>
            {v.retrySeconds ? `Siųsti dar kartą po ${v.retrySeconds} s` : "Siųsti kodą dar kartą"}
          </button>
        </div>
      </> : <>
        {signup && !v.checkingNumber && <SmsCaptcha siteKey={v.config.site_key} resetKey={v.captchaReset}
          onToken={v.setCaptchaToken} onError={v.setError} />}
        <button type="button" className="btn primary" disabled={!canRequest} onClick={v.send}>
          {v.busy ? "Siunčiama..." : "Gauti SMS kodą"}
        </button>
      </>}
      {v.error && <p role="alert" style={{ margin: "10px 0 0", color: "#ad381f" }}>{v.error}</p>}
    </div>
  );
}
