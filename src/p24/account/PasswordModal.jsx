import { useState } from "react";
import { supabase } from "../../lib/config.js";
import { passwordRecoveryErrorMessage, sendPasswordRecoveryEmail } from "../../auth/passwordRecovery.jsx";
import { Svg } from "../Shell.jsx";

/* Prototipo „Keisti slaptažodį“ langas (darbuotojui ir darbdaviui). */

const RULES = [
  ["len", "Bent 8 simboliai", (v) => v.length >= 8],
  ["num", "Bent vienas skaičius", (v) => /\d/.test(v)],
  ["up", "Bent viena didžioji raidė", (v) => /[A-ZĄČĘĖĮŠŲŪŽ]/.test(v)],
];

function PwInput({ id, label, value, onChange, auto }) {
  const [show, setShow] = useState(false);
  return (
    <label className="field" htmlFor={id}>{label}
      <span className="pwin">
        <input id={id} type={show ? "text" : "password"} autoComplete={auto} value={value} onChange={(e) => onChange(e.target.value)} />
        <button type="button" className="pweye" aria-label={show ? "Slėpti slaptažodį" : "Rodyti slaptažodį"} onClick={() => setShow(!show)}><Svg name="eye" size={17} /></button>
      </span>
    </label>
  );
}

export function PasswordModal({ email, onClose }) {
  const [o, setO] = useState(""); const [n, setN] = useState(""); const [r, setR] = useState("");
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(""); const [info, setInfo] = useState(""); const [ok, setOk] = useState(false);

  async function save() {
    setErr(""); setInfo("");
    if (!o) return setErr("Įveskite dabartinį slaptažodį.");
    if (!RULES.every(([, , t]) => t(n))) return setErr("Naujas slaptažodis neatitinka reikalavimų.");
    if (n === o) return setErr("Naujas slaptažodis turi skirtis nuo dabartinio.");
    if (n !== r) return setErr("Slaptažodžiai nesutampa.");
    setBusy(true);
    try {
      // Dabartinį slaptažodį patikriname prisijungdami ta pačia paskyra.
      const check = await supabase.auth.signInWithPassword({ email, password: o });
      if (check.error) throw new Error("Dabartinis slaptažodis neteisingas.");
      const { error } = await supabase.auth.updateUser({ password: n });
      if (error) throw new Error(passwordRecoveryErrorMessage(error, "Nepavyko pakeisti slaptažodžio."));
      setOk(true);
    } catch (e) {
      setErr(e?.message || "Nepavyko pakeisti slaptažodžio.");
    } finally {
      setBusy(false);
    }
  }

  async function forgot() {
    setErr(""); setInfo("");
    try { setInfo(await sendPasswordRecoveryEmail(email)); } catch (e) { setErr(e?.message || "Nepavyko išsiųsti nuorodos."); }
  }

  const close = () => { if (!busy) onClose(); };
  return (
    <div className="rs-modal-overlay p24-ov" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="rs-modal-card p24-modal" role="dialog" aria-modal="true" aria-label="Keisti slaptažodį">
        <div className="mhead"><div><span className="eyebrow">Paskyra</span><h2>Keisti slaptažodį</h2></div>
          <button type="button" className="iconb" onClick={close} aria-label="Uždaryti"><Svg name="x" size={16} width={2.2} /></button></div>
        {ok ? <div className="pwm">
          <p className="small" style={{ margin: 0 }}>Slaptažodis pakeistas. Kitą kartą junkitės nauju slaptažodžiu.</p>
          <div className="row" style={{ justifyContent: "flex-end" }}><button className="btn primary" type="button" onClick={onClose}>Gerai</button></div>
        </div> : <div className="pwm">
          <PwInput id="pw-old" label="Dabartinis slaptažodis" value={o} onChange={setO} auto="current-password" />
          <PwInput id="pw-new" label="Naujas slaptažodis" value={n} onChange={setN} auto="new-password" />
          <ul className="pwrules">{RULES.map(([k, t, f]) => <li key={k} className={f(n) ? "ok" : ""}>{t}</li>)}</ul>
          <PwInput id="pw-rep" label="Pakartokite naują slaptažodį" value={r} onChange={setR} auto="new-password" />
          {err && <p className="small" style={{ color: "var(--red)", fontWeight: 600, margin: 0 }} role="alert">{err}</p>}
          {info && <p className="small" style={{ color: "var(--green)", fontWeight: 600, margin: 0 }} role="status">{info}</p>}
          <button type="button" className="linkbtn" onClick={forgot}>Pamiršote dabartinį slaptažodį?</button>
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button className="btn" type="button" disabled={busy} onClick={close}>Atšaukti</button>
            <button className="btn primary" type="button" disabled={busy} onClick={save}>{busy ? "Saugoma..." : "Išsaugoti"}</button>
          </div>
        </div>}
      </div>
    </div>
  );
}
