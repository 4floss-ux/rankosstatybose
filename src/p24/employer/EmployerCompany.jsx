import { useState } from "react";
import { Svg } from "../Shell.jsx";
import { Pill } from "../ui.jsx";
import { PasswordModal } from "../account/PasswordModal.jsx";

/* Prototipo eCompany. Logika (saugojimas, logotipas, telefono patvirtinimas) – EmployerDashboard. */

const right = '<path d="m9 18 6-6-6-6"/>';

function Tile({ label, value, link, onClick }) {
  const body = <><small>{label}</small><b style={{ fontSize: 20 }}>{value}</b>{link && onClick ? <span>{link}</span> : null}</>;
  return onClick ? <button type="button" className="stat" onClick={onClick}>{body}</button> : <div className="stat">{body}</div>;
}

export function EmployerCompany({
  canEdit, email, roleLabel, planName, seats, onPlans, onTeam,
  me, setMe, phone, savedPhone, setPhone, normalizePhone, PhoneHint, PhoneFields,
  form, updateField, cityInput, avatarUrl, initials, onAvatarFile, onAvatarRemove,
  reviews, dirty, saving, onSave, onUndo, onBugReport, bugNotice, onDelete, deleteText,
}) {
  const [pwOpen, setPwOpen] = useState(false);
  const [phoneEdit, setPhoneEdit] = useState(false);
  const phoneChanged = (phone || "") !== (savedPhone || "");
  const undo = () => { setPhoneEdit(false); onUndo(); };
  const saveBtn = (sm) => (
    <button className={`btn primary${sm ? " sm" : " savebtn"}`} type="button" disabled={saving} onClick={onSave}>
      <Svg name="check" size={sm ? 14 : 16} width={2.4} /><span>{saving ? "Saugoma..." : "Išsaugoti"}</span>
    </button>
  );

  return (
    <>
      <div className="head"><div><h1>Įmonės profilis</h1><p className="lead">{canEdit ? "Įmonės informacija ir jūsų duomenys" : "Įmonės informaciją redaguoja savininkas, savo duomenis – jūs"}</p></div>
        {canEdit ? <div className="row">{saveBtn(false)}</div> : <Pill tone="navy">Tik peržiūra</Pill>}</div>

      <div className="stats">
        <Tile label="Jūs prisijungę kaip" value={roleLabel} />
        <Tile label="Dabartinis planas" value={planName} link="Peržiūrėti planus" onClick={onPlans} />
        <Tile label="Komandos vietos" value={seats} link="Valdyti komandą" onClick={onTeam} />
      </div>

      <section className="card"><header><div><h2>Mano duomenys</h2><p className="small muted" style={{ margin: "2px 0 0" }}>Jūsų, kaip komandos nario, duomenys. Matomi darbuotojams jūsų darbuose.</p></div>
        {canEdit ? null : saveBtn(true)}</header>
        <div className="form">
          <label className="field" htmlFor="me-fn">Vardas *<input id="me-fn" className="nmcap" maxLength={60} autoComplete="given-name" value={me.firstName} onChange={(e) => setMe({ ...me, firstName: e.target.value })} /></label>
          <label className="field" htmlFor="me-ln">Pavardė *<input id="me-ln" className="nmcap" maxLength={60} autoComplete="family-name" value={me.lastName} onChange={(e) => setMe({ ...me, lastName: e.target.value })} /></label>
          {phoneEdit || !savedPhone ? (
            <label className="field">Telefonas
              <input value={phone} inputMode="tel" autoComplete="tel" placeholder="+37061234567" maxLength={40}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={() => { const n = normalizePhone(phone); if (n) setPhone(n); }} />
              {PhoneHint}
              {savedPhone && <button type="button" className="linkin" style={{ justifySelf: "start", marginTop: 4 }} onClick={() => { setPhone(savedPhone); setPhoneEdit(false); }}>Palikti {savedPhone}</button>}
            </label>
          ) : (
            <div className="field"><span>Telefonas</span>
              <div className="phrow"><b>{savedPhone}</b><span className="phok"><Svg name="check" size={12} width={3} />Patvirtintas</span><button className="btn sm" type="button" onClick={() => setPhoneEdit(true)}>Keisti</button></div>
            </div>
          )}
          <div className="field"><span>El. paštas</span>
            <div className="mailro" title="El. pašto pakeisti negalima – juo jungiatės prie paskyros"><Svg name="mail" size={16} /><b>{email}</b><span className="mlock"><Svg name="lock" size={13} width={2.2} />Užrakinta</span></div>
          </div>
          {phoneChanged && phone ? <div className="wide">{PhoneFields}</div> : null}
        </div>
      </section>

      <section className="card"><h2>Informacija</h2>
        <div className="row" style={{ gap: 16 }}>
          <div className="av co lg" style={{ border: "1px solid var(--line)", overflow: "hidden" }}>{avatarUrl ? <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}><b>Įmonės logotipas</b><span className="muted small">JPG, PNG arba WEBP, iki 5 MB. Keisti ir ištrinti gali įmonės savininkas.</span>
            {canEdit ? <div className="row">
              <label className="btn sm" style={{ cursor: "pointer" }}>{avatarUrl ? "Keisti logotipą" : "Įkelti logotipą"}
                <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { onAvatarFile(e.target.files?.[0] || null); e.target.value = ""; }} /></label>
              {avatarUrl ? <button className="btn sm ghost" type="button" onClick={onAvatarRemove}>Ištrinti</button> : null}
            </div> : null}
          </div>
        </div>
        <fieldset className="form cofs" disabled={!canEdit}>
          <label className="field" htmlFor="c-name">Darbdavio pavadinimas / vardas *<input id="c-name" maxLength={160} value={form.name} onChange={(e) => updateField("name", e.target.value)} /></label>
          <label className="field">Miestas *{cityInput}</label>
          <label className="field" htmlFor="c-code">Įmonės kodas<input id="c-code" value={form.companyCode || ""} placeholder="Nenurodytas" readOnly title="Įmonės kodą keičia administratorius" /></label>
          <label className="field wide" htmlFor="c-about">Trumpai apie įmonę<textarea id="c-about" maxLength={1200} value={form.description} onChange={(e) => updateField("description", e.target.value)} placeholder="Pvz. Dirbame Vilniuje ir Vilniaus rajone, vykdome bendrastatybinius darbus..." /></label>
        </fieldset>
      </section>

      <section className="card"><h2>Atsiliepimai</h2>
        {reviews.length ? <div className="list">{reviews.map((r) => (
          <div className="step ok" key={r.id}><span className="dot" /><div><b>{r.worker_name || "Darbuotojas"} · {r.score}/10</b>{r.comment?.trim() ? <p>{r.comment}</p> : null}</div></div>
        ))}</div> : <p className="muted small" style={{ margin: 0 }}>Darbuotojų atsiliepimų apie įmonę dar nėra.</p>}
      </section>

      <section className="card setsec danger"><h2>Paskyra</h2>
        {bugNotice && <p className="small" role="status" style={{ margin: "0 0 10px", color: "var(--green)", fontWeight: 600 }}>{bugNotice}</p>}
        <div className="setlist2">
          <button type="button" className="setrow link neutral" onClick={() => setPwOpen(true)}><span className="setic"><Svg name="lock" size={18} /></span><div className="settx"><b>Keisti slaptažodį</b><span>Naujas slaptažodis galios kitą kartą jungiantis</span></div><span className="setgo"><Svg paths={right} size={16} /></span></button>
          <button type="button" className="setrow link neutral" onClick={onBugReport}><span className="setic"><Svg name="chat" size={18} /></span><div className="settx"><b>Pranešti apie klaidą</b><span>Žinutė pasieks administratorių</span></div><span className="setgo"><Svg paths={right} size={16} /></span></button>
          <div className="setrow"><span className="setic"><Svg name="x" size={18} width={2.2} /></span><div className="settx"><b>Ištrinti paskyrą</b><span>{deleteText}</span></div><button className="btn sm danger" type="button" onClick={onDelete}>Ištrinti</button></div>
        </div>
      </section>

      <div className="savebar" hidden={!dirty}>
        <div className="sbtx"><span className="sbdot" /><b><span className="sbl">Neišsaugoti pakeitimai</span><span className="sbs">Neišsaugota</span></b></div>
        <div className="row"><button className="btn sm ghostw" type="button" disabled={saving} onClick={undo}>Atšaukti</button><button className="btn sm primary" type="button" disabled={saving} onClick={onSave}><Svg name="check" size={15} width={2.4} /> {saving ? "Saugoma..." : "Išsaugoti"}</button></div>
      </div>

      {pwOpen && <PasswordModal email={email} onClose={() => setPwOpen(false)} />}
    </>
  );
}
