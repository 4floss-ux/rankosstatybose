import { useEffect, useState } from "react";
import { supabase } from "../../lib/config.js";
import { MB, prepareUpload, safeExt } from "../../lib/imageUpload.js";
import { Svg } from "../Shell.jsx";
import { Pill } from "../ui.jsx";
import { PasswordModal } from "../account/PasswordModal.jsx";
import { activeMonthlyAwards, monthlyAwardMeta, monthlyAwardMetricText, monthlyAwardMonthLabel } from "../../awards/monthlyAwards.jsx";

/* Prototipo profilio ekranas (wProfile). Logika lieka WorkerDashboard – čia tik markup. */

const AWARD_STYLE = {
  best: { c1: "#ffd36b", c2: "#e8a317", icon: '<path d="m12 5.2 2 4.1 4.5.7-3.3 3.2.8 4.5-4-2.1-4 2.1.8-4.5L5.5 10l4.5-.7Z" fill="#fff"/>' },
  reliability: { c1: "#5fe0a3", c2: "#1c9b67", icon: '<path d="M12 5 6.5 7.2v4.3c0 3.3 2.4 6 5.5 6.7 3.1-.7 5.5-3.4 5.5-6.7V7.2Z" fill="#fff"/><path d="m9.4 11.8 1.8 1.8 3.5-3.6" fill="none" stroke="#1c9b67" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>' },
  activity: { c1: "#baabe3", c2: "#644e9f", icon: '<path d="M13.2 4.5 7.5 13h4l-.9 6.5L16.5 11h-4Z" fill="#fff"/>' },
};

export function AwardSvg({ type, size = 40 }) {
  const st = AWARD_STYLE[type] || AWARD_STYLE.best;
  const id = `ag-${type}-${size}`;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" dangerouslySetInnerHTML={{ __html:
      `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${st.c1}"/><stop offset="1" stop-color="${st.c2}"/></linearGradient></defs><circle cx="12" cy="12" r="11" fill="url(#${id})"/><circle cx="12" cy="12" r="9.2" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="1"/>${st.icon}` }} />
  );
}

export function AwardPanel({ awards }) {
  const list = activeMonthlyAwards(awards);
  if (!list.length) return null;
  return (
    <section className="card">
      <div className="awpanel">
        <h3>Apdovanojimai · {monthlyAwardMonthLabel(list[0].award_month)}</h3>
        <div className="awlist">
          {list.map((a) => (
            <div className={`awitem aw-${a.award_type}`} key={a.id || `${a.award_type}-${a.award_month}`}>
              <AwardSvg type={a.award_type} />
              <div><b>{monthlyAwardMeta(a).title}</b><span>{monthlyAwardMetricText(a)}</span></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const right = '<path d="m9 18 6-6-6-6"/>';
const KM = [5, 10, 20, 30, 50];
const DOC_TYPES = ["Darbas aukštyje", "Saugos ir sveikatos instruktažas", "Krautuvo vairuotojo pažymėjimas", "Elektrosaugos pažymėjimas", "Suvirintojo pažymėjimas", "Pirmoji pagalba", "Kita"];
const todayISO = () => new Date().toISOString().slice(0, 10);
const daysUntil = (iso) => Math.round((new Date(`${iso}T12:00:00`) - new Date(`${todayISO()}T12:00:00`)) / 864e5);

function Field({ label, error, fieldRef, wide, hint, children }) {
  return (
    <label className={`field${wide ? " wide" : ""}${error ? " has-error" : ""}`} ref={fieldRef}>
      {label}
      {children}
      {hint && <span className="hint">{hint}</span>}
      {error && <span className="ferr" role="alert">{error}</span>}
    </label>
  );
}

function Modal({ title, eyebrow, onClose, children }) {
  return (
    <div className="rs-modal-overlay p24-ov" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="rs-modal-card p24-modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="mhead"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2>{title}</h2></div>
          <button type="button" className="iconb" onClick={onClose} aria-label="Uždaryti"><Svg name="x" size={16} width={2.2} /></button></div>
        {children}
      </div>
    </div>
  );
}

/* ---------- Pažymėjimai ir dokumentai ---------- */
function DocsSection({ userId }) {
  const [docs, setDocs] = useState([]);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(DOC_TYPES[0]);
  const [until, setUntil] = useState("");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function load() {
    const { data } = await supabase.from("worker_documents").select("id, doc_type, valid_until, file_path, file_name, show_to_employers, created_at").eq("worker_id", userId).order("created_at", { ascending: false });
    setDocs(data || []);
  }
  useEffect(() => { if (userId) load(); }, [userId]);

  async function save() {
    setErr("");
    if (!file) { setErr("Įkelkite nuotrauką arba PDF."); return; }
    setBusy(true);
    let path = "";
    try {
      const ready = await prepareUpload(file, {
        types: ["application/pdf", "image/jpeg", "image/png", "image/webp", ".pdf"],
        maxBytes: 10 * MB, maxSide: 2000,
        badType: "Tinka PDF, JPG, PNG arba WEBP.", tooBig: "Failas per didelis – iki 10 MB.",
      });
      const contentType = ready.type || "application/pdf";
      path = `${userId}/${Date.now()}.${safeExt(ready, "pdf")}`;
      const up = await supabase.storage.from("worker-documents").upload(path, ready, { contentType, upsert: false });
      if (up.error) { path = ""; throw up.error; }
      const ins = await supabase.from("worker_documents").insert({ worker_id: userId, doc_type: type, valid_until: until || null, file_path: path, file_name: file.name.slice(0, 160) });
      if (ins.error) throw ins.error;
      path = "";
      setOpen(false); setFile(null); setUntil(""); setType(DOC_TYPES[0]);
      await load();
    } catch (e) {
      if (path) await supabase.storage.from("worker-documents").remove([path]);
      setErr(e?.message || "Nepavyko išsaugoti dokumento.");
    }
    finally { setBusy(false); }
  }
  async function toggle(d) {
    const { error } = await supabase.from("worker_documents").update({ show_to_employers: !d.show_to_employers }).eq("id", d.id);
    if (!error) setDocs((cur) => cur.map((x) => x.id === d.id ? { ...x, show_to_employers: !x.show_to_employers } : x));
  }
  async function remove(d) {
    if (!window.confirm(`Ištrinti „${d.doc_type}“?`)) return;
    const { error } = await supabase.from("worker_documents").delete().eq("id", d.id);
    if (error) return;
    await supabase.storage.from("worker-documents").remove([d.file_path]);
    setDocs((cur) => cur.filter((x) => x.id !== d.id));
  }
  async function view(d) {
    const { data } = await supabase.storage.from("worker-documents").createSignedUrl(d.file_path, 120);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener");
  }
  const status = (d) => {
    if (!d.valid_until) return null;
    const n = daysUntil(d.valid_until);
    return n < 0 ? <Pill tone="red">Nebegalioja</Pill> : n <= 30 ? <Pill tone="orange">Baigiasi po {n} d.</Pill> : <Pill tone="green">Galioja</Pill>;
  };

  return (
    <>
    <section className="card setsec">
      <header><div><h2>Pažymėjimai ir dokumentai</h2></div>
        <button className="btn sm" type="button" onClick={() => { setErr(""); setOpen(true); }}><Svg name="plus" size={15} width={2.4} />Pridėti</button></header>
      {docs.length ? (
        <div className="setlist">
          {docs.map((d) => (
            <div className="setrow docrow" key={d.id}>
              <span className="setic"><Svg name="file" size={18} /></span>
              <div className="settx"><b>{d.doc_type}</b><span>{d.valid_until ? `Galioja iki ${d.valid_until}` : "Be galiojimo datos"}{d.file_name ? <> · <button type="button" className="linkin docopen" onClick={() => view(d)} title="Atidaryti failą">{d.file_name}</button></> : ""}</span></div>
              {status(d)}
              <button type="button" className="iconb" onClick={() => toggle(d)} aria-pressed={d.show_to_employers} title={d.show_to_employers ? "Matoma darbdaviams – paspauskite, kad paslėptumėte" : "Paslėpta nuo darbdavių – paspauskite, kad rodytumėte"}><Svg name={d.show_to_employers ? "eye" : "lock"} size={16} /></button>
              <button type="button" className="iconb del" onClick={() => remove(d)} title="Ištrinti"><Svg name="x" size={16} width={2.2} /></button>
            </div>
          ))}
        </div>
      ) : <p className="muted small" style={{ margin: 0 }}>Įkelkite pažymėjimus – darbdaviai juos matys prie jūsų profilio.</p>}
    </section>
      {open && (
        <Modal eyebrow="Pažymėjimai" title="Pridėti dokumentą" onClose={() => !busy && setOpen(false)}>
          <div className="form" style={{ gridTemplateColumns: "1fr" }}>
            <label className="field">Dokumento tipas<select value={type} onChange={(e) => setType(e.target.value)}>{DOC_TYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
            <label className="field">Galioja iki<input type="date" value={until} min={todayISO()} onChange={(e) => setUntil(e.target.value)} /><span className="hint">Nebūtina, jei dokumentas neterminuotas.</span></label>
            <label className="upl">
              <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <Svg name="upload" size={20} />
              <b>{file ? file.name : "Įkelti nuotrauką arba PDF"}</b><span className="muted small">iki 10 MB</span>
            </label>
            {err && <p className="ferr" role="alert" style={{ margin: 0 }}>{err}</p>}
          </div>
          <div className="row" style={{ justifyContent: "flex-end", marginTop: 16 }}>
            <button className="btn" type="button" disabled={busy} onClick={() => setOpen(false)}>Atšaukti</button>
            <button className="btn primary" type="button" disabled={busy} onClick={save}>{busy ? "Saugoma..." : "Išsaugoti"}</button>
          </div>
        </Modal>
      )}
    </>
  );
}

/* ---------- Pagrindinis ekranas ---------- */
export function WorkerProfileEditor({
  user, form, baseline, updateField, errors, fieldRefs, saving, saved, onSave, onUndo, dirty,
  avatarUrl, initials, onAvatarFile, onAvatarRemove,
  phoneVerification, PhoneHint, PhoneFields, normalizePhone, cityInput,
  location, ratings, ratingsLoading, awards, abroad,
  onBugReport, bugNotice, onDelete,
}) {
  const [phoneEdit, setPhoneEdit] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const savedPhone = baseline?.phone || "";
  const phoneChanged = (form.phone || "") !== savedPhone;
  useEffect(() => { if (!phoneChanged && saved) setPhoneEdit(false); }, [saved, phoneChanged]);
  const ref = (k) => (node) => { fieldRefs.current[k] = node; };
  const km = Number(form.travelRadius) || 30;
  const kmOpts = KM.includes(km) ? KM : [...KM, km].sort((x, y) => x - y);

  const saveBtn = (
    <button className="btn primary savebtn" type="button" disabled={saving} onClick={onSave}>
      <Svg name="check" size={16} width={2.4} /><span>{saving ? "Saugoma..." : saved && !dirty ? "Išsaugota" : "Išsaugoti"}</span>
    </button>
  );

  return (
    <>
      <div className="head"><div><span className="eyebrow">Mano informacija</span><h1>Profilis</h1><p className="lead">Atnaujinkite savo profilį ir laiką, kada galite priimti darbo kvietimus.</p></div><div className="row">{saveBtn}</div></div>

      <AwardPanel awards={awards} />

      <section className="card"><h2>Pagrindinė informacija</h2>
        <div className="row" style={{ gap: 16 }}>
          <div className="av lg">{avatarUrl ? <img src={avatarUrl} alt="" /> : initials || "D"}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
            <b>Profilio nuotrauka</b>
            <span className="muted small">Nuotrauką matys darbdaviai prie jūsų profilio. JPG, PNG arba WEBP, iki 5 MB.</span>
            <div className="row">
              <label className="btn sm">{avatarUrl ? "Keisti nuotrauką" : "Pridėti nuotrauką"}<input type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={(e) => onAvatarFile(e.target.files?.[0] || null)} /></label>
              {avatarUrl && <button className="btn sm ghost" type="button" onClick={onAvatarRemove}>Ištrinti nuotrauką</button>}
            </div>
          </div>
        </div>
        <div className="form">
          <Field label="Vardas *" error={errors.firstName} fieldRef={ref("firstName")}><input className="nmcap" value={form.firstName} autoComplete="given-name" onChange={(e) => updateField("firstName", e.target.value)} aria-invalid={Boolean(errors.firstName)} /></Field>
          <Field label="Pavardė *" error={errors.lastName} fieldRef={ref("lastName")}><input className="nmcap" value={form.lastName} autoComplete="family-name" onChange={(e) => updateField("lastName", e.target.value)} aria-invalid={Boolean(errors.lastName)} /></Field>
          <Field label="Gimimo data" error={errors.birthDate} fieldRef={ref("birthDate")} hint="Šią datą matote tik savo profilyje – darbdaviams ji nerodoma."><input type="date" min="1900-01-01" max={todayISO()} value={form.birthDate} autoComplete="bday" onChange={(e) => updateField("birthDate", e.target.value)} /></Field>
          <Field label="Miestas *" error={errors.city} fieldRef={ref("city")}>{cityInput}</Field>

          {phoneEdit || !savedPhone || errors.phone ? (
            <Field label="Telefonas *" error={errors.phone} fieldRef={ref("phone")}>
              <input value={form.phone} inputMode="tel" autoComplete="tel" placeholder="+37061234567"
                onChange={(e) => updateField("phone", e.target.value)}
                onBlur={() => { const n = normalizePhone(form.phone); if (n) updateField("phone", n); }} />
              {PhoneHint}
              {savedPhone && <button type="button" className="linkin" style={{ justifySelf: "start", marginTop: 4 }} onClick={() => { updateField("phone", savedPhone); setPhoneEdit(false); }}>Palikti {savedPhone}</button>}
            </Field>
          ) : (
            <div className="field" ref={ref("phone")}><span>Telefonas *</span>
              <div className="phrow"><b>{savedPhone}</b><span className="phok"><Svg name="check" size={12} width={3} />Patvirtintas</span><button className="btn sm" type="button" onClick={() => setPhoneEdit(true)}>Keisti</button></div>
            </div>
          )}
          <div className="field"><span>El. paštas</span>
            <div className="mailro" title="El. pašto pakeisti negalima – juo jungiatės prie paskyros"><Svg name="mail" size={16} /><b>{user?.email}</b><span className="mlock"><Svg name="lock" size={13} width={2.2} />Užrakinta</span></div>
          </div>
          {(phoneEdit || !savedPhone) && phoneChanged && <div className="wide">{PhoneFields}</div>}

          <Field label="Kiek km galite nuvykti?" error={errors.travelRadius} fieldRef={ref("travelRadius")}>
            <select value={km} onChange={(e) => updateField("travelRadius", Number(e.target.value))}>{kmOpts.map((k) => <option key={k} value={k}>{k} km</option>)}</select>
          </Field>
          <Field label="Patirtis *" wide error={errors.shortBio} fieldRef={ref("shortBio")}>
            <textarea value={form.shortBio} onChange={(e) => updateField("shortBio", e.target.value)} placeholder="Pvz. 2 metus dirbau statybų pagalbiniu. Jei patirties neturite, įrašykite „Neturiu“." aria-invalid={Boolean(errors.shortBio)} />
          </Field>
          <div className="checkrow wide">
            <label className="check"><input type="checkbox" checked={form.hasDrivingLicenseB} onChange={(e) => updateField("hasDrivingLicenseB", e.target.checked)} /> Turiu B kategorijos vairuotojo pažymėjimą</label>
            <label className="check"><input type="checkbox" checked={form.hasIndividualActivity} onChange={(e) => updateField("hasIndividualActivity", e.target.checked)} /> Turiu individualią veiklą</label>
          </div>
        </div>
      </section>

      <DocsSection userId={user?.id} />

      <section className="card"><h2>Paskutiniai 3 darbdavių įvertinimai</h2>
        {ratingsLoading ? <p className="muted small" style={{ margin: 0 }}>Įkeliama...</p> : ratings.length ? (
          <div className="list">{ratings.map((r) => (
            <div className="step ok" key={r.id}><span className="dot" /><div><b>{r.score}/10 · {new Date(r.created_at).toLocaleDateString("lt-LT")}</b>{r.comment?.trim() && <p>{r.comment}</p>}</div></div>
          ))}</div>
        ) : <p className="muted small" style={{ margin: 0 }}>Dar nėra darbdavių įvertinimų. Jie atsiras po pirmųjų įvertintų darbų.</p>}
      </section>

      <section className="card setsec"><h2>Pranešimai</h2>
        <div className="setlist">
          <div id="s24-worker-push-settings" data-variant="p24" style={{ display: "contents" }} />
          <div className="setrow">
            <span className="setic"><Svg name="pin" size={18} /></span>
            <div className="settx"><b>Lokacija</b><span>{location.error || (location.stale ? "Lokacija senesnė nei 7 dienos – įjunkite iš naujo." : "Rodome arčiau esančius darbus. Darbdaviui vietos nerodome.")}</span></div>
            <button type="button" className={`tgl${location.on ? " on" : ""}`} role="switch" aria-checked={location.on} aria-label="Lokacija" disabled={location.busy} onClick={location.toggle}><i /></button>
          </div>
        </div>
      </section>

      <section className="card setsec"><h2>Kita</h2><div className="setlist">{abroad}</div></section>

      <section className="card setsec danger"><h2>Paskyra</h2>
        {bugNotice && <p className="small" role="status" style={{ margin: "0 0 10px", color: "var(--green)", fontWeight: 600 }}>{bugNotice}</p>}
        <div className="setlist2">
          <button type="button" className="setrow link neutral" onClick={() => setPwOpen(true)}><span className="setic"><Svg name="lock" size={18} /></span><div className="settx"><b>Keisti slaptažodį</b><span>Naujas slaptažodis galios kitą kartą jungiantis</span></div><span className="setgo"><Svg paths={right} size={16} /></span></button>
          <button type="button" className="setrow link neutral" onClick={onBugReport}><span className="setic"><Svg name="chat" size={18} /></span><div className="settx"><b>Pranešti apie klaidą</b><span>Aprašykite, kas neveikia – žinutė pasieks administratorių</span></div><span className="setgo"><Svg paths={right} size={16} /></span></button>
          <div className="setrow"><span className="setic"><Svg name="x" size={18} width={2.2} /></span><div className="settx"><b>Ištrinti paskyrą</b><span>Bus pašalintas jūsų profilis, darbų istorija ir įkelti failai. Šio veiksmo atkurti negalima.</span></div><button className="btn sm danger" type="button" onClick={onDelete}>Ištrinti</button></div>
        </div>
      </section>

      <div className="savebar" hidden={!dirty}>
        <div className="sbtx"><span className="sbdot" /><b><span className="sbl">Neišsaugoti pakeitimai</span><span className="sbs">Neišsaugota</span></b></div>
        <div className="row"><button className="btn sm ghostw" type="button" disabled={saving} onClick={() => { setPhoneEdit(false); onUndo(); }}>Atšaukti</button><button className="btn sm primary" type="button" disabled={saving} onClick={onSave}><Svg name="check" size={15} width={2.4} /> {saving ? "Saugoma..." : "Išsaugoti"}</button></div>
      </div>

      {pwOpen && <PasswordModal email={user?.email} onClose={() => setPwOpen(false)} />}
    </>
  );
}
