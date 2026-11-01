import { useEffect, useState } from "react";
import { supabase } from "../../lib/config.js";
import { Svg } from "../Shell.jsx";
import { Empty, Pill, initialsOf } from "../ui.jsx";
import { PlanLock } from "./EmployerPeople.jsx";

/* Prototipo eTeam. Tikroje sistemoje rolės: savininkas, vadovas, vadybininkas. */

const ROLE_LT = { owner: "Savininkas", manager: "Vadovas", recruiter: "Vadybininkas" };
const ROLE_INFO = [
  ["owner", "Savininkas", "Visos teisės ir atsakomybė už mokėjimus.", ["Visi darbai, skelbimai ir statistika", "Komanda: kviesti, šalinti, keisti roles", "Planas, mokėjimai, įmonės profilis"], []],
  ["manager", "Vadovas", "Kasdien valdo visus įmonės darbus.", ["Mato ir valdo visus darbus", "Perduoda darbus kitiems nariams", "Darbo skelbimai ir kandidatai"], ["Komanda, planas ir mokėjimai", "Įmonės ištrynimas"]],
  ["recruiter", "Vadybininkas", "Kuria ir prižiūri savo darbus.", ["Kuria darbus ir kviečia darbuotojus", "Tvirtina atvykimus savo darbuose", "Statistika tik savo darbų"], ["Kitų darbai", "Skelbimai, komanda, planas"]],
];
const MAX_SEATS = 5;

function RoleModal({ member, busy, onClose, onRole, onRemove }) {
  const [role, setRole] = useState(member.member_role);
  return (
    <div className="rs-modal-overlay p24-ov" role="presentation" onClick={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}>
      <div className="rs-modal-card p24-modal" role="dialog" aria-modal="true" aria-label="Teisės">
        <div className="mhead"><div><span className="eyebrow">Teisės</span><h2>{member.display_name || member.email}</h2><span className="muted small">{member.email}</span></div>
          <button type="button" className="iconb" onClick={onClose} aria-label="Uždaryti"><Svg name="x" size={16} width={2.2} /></button></div>
        <div className="field"><span>Rolė</span><div className="segs rolesel" role="radiogroup" aria-label="Rolė">
          {["manager", "recruiter"].map((r) => <label key={r}><input type="radio" name="mrole" checked={role === r} onChange={() => setRole(r)} /><span>{ROLE_LT[r]}</span></label>)}
        </div></div>
        <div className="row" style={{ justifyContent: "space-between", marginTop: 16 }}>
          <button className="btn danger" type="button" disabled={busy} onClick={() => onRemove(member)}>Pašalinti iš komandos</button>
          <div className="row"><button className="btn" type="button" disabled={busy} onClick={onClose}>Atšaukti</button>
            <button className="btn primary" type="button" disabled={busy || role === member.member_role} onClick={() => onRole(member, role)}>Išsaugoti</button></div>
        </div>
      </div>
    </div>
  );
}

const ACT_TXT = { job_created: "sukūrė darbą", job_cancelled: "atšaukė darbą", job_transferred: "perdavė darbą", role_changed: "pakeitė rolę" };
const shortName = (n) => { const p = String(n || "").trim().split(/\s+/).filter(Boolean); return p.length > 1 ? `${p[0]} ${p[p.length - 1][0]}.` : (p[0] || ""); };
function whenText(iso) {
  const d = new Date(iso); const now = new Date();
  const time = d.toLocaleTimeString("lt-LT", { hour: "2-digit", minute: "2-digit" });
  const days = Math.floor((new Date(now.toDateString()) - new Date(d.toDateString())) / 864e5);
  return days <= 0 ? `Šiandien ${time}` : days === 1 ? `Vakar ${time}` : `Prieš ${days} d.`;
}
function TeamActivity({ companyId, myUserId }) {
  const [rows, setRows] = useState(null);
  useEffect(() => {
    if (!companyId) return undefined;
    let off = false;
    supabase.rpc("get_company_team_activity", { p_company_id: companyId, p_limit: 20 }).then(({ data, error }) => { if (!off) setRows(error ? null : data || []); });
    return () => { off = true; };
  }, [companyId]);
  if (!rows) return null;
  const who = (id, name) => (id === myUserId ? "Jūs" : shortName(name) || "Narys");
  return (
    <section className="card"><header><div><h2>Veiksmų istorija</h2><p className="small muted" style={{ margin: "2px 0 0" }}>Kas sukūrė, atšaukė, perdavė darbą ar pakeitė teises</p></div></header>
      {rows.length ? <div className="loglist">{rows.map((r) => {
        const actor = who(r.actor_id, r.actor_name);
        const obj = r.action === "role_changed" ? `${who(r.target_user_id, r.target_name)} → ${ROLE_LT[r.detail] || r.detail || ""}` : r.action === "job_transferred" ? `${r.job_title || ""} → ${who(r.target_user_id, r.target_name)}` : (r.job_title || "");
        return <div className="logrow" key={r.id}><span className="av lt sm">{actor === "Jūs" ? "JŪ" : initialsOf(r.actor_name || "?")}</span><div><b>{actor}</b> {ACT_TXT[r.action] || r.action} <span className="logobj">{obj}</span></div><small>{whenText(r.created_at)}</small></div>;
      })}</div> : <Empty title="Veiksmų dar nėra" sub="Čia matysite, kas sukūrė, atšaukė ar perdavė darbą." icon="history" />}
    </section>
  );
}

export function EmployerTeam({ locked, onPlans, myRole, myUserId, myEmail, members, invites, loading, busy, form, setForm, onInvite, onCopy, onRole, onRemove, companyId }) {
  const [edit, setEdit] = useState(null);
  if (locked) return <PlanLock title="Komanda" lead="Darbai ir žinutės lieka įmonės paskyroje." plan="Business Pro" onPlans={onPlans} />;
  const owner = myRole === "owner";
  const seats = members.length;
  const rows = [...members].sort((a, b) => (a.member_role === "owner" ? -1 : b.member_role === "owner" ? 1 : 0));
  return (
    <>
      <div className="head"><div><h1>Komanda</h1><p className="lead">Darbai ir žinutės lieka įmonės paskyroje.</p></div><Pill tone="navy">Komandos vietos {seats}/{MAX_SEATS}</Pill></div>
      <section className="card"><header><div><h2>Nariai</h2></div></header>
        <div className="list">
          {loading ? <p className="muted small" style={{ margin: 0 }}>Įkeliama...</p> : rows.map((m) => {
            const me = m.user_id === myUserId;
            const canEdit = owner && !me && m.member_role !== "owner";
            const label = m.member_role === "owner" && me ? "Jūs (savininkas)" : `${m.display_name || m.email}${me ? " · jūs" : ""}`;
            return (
              <div className={`wk${canEdit ? " clickable" : ""}`} key={m.user_id} {...(canEdit ? { role: "button", tabIndex: 0, onClick: () => setEdit(m), onKeyDown: (e) => { if (e.key === "Enter") setEdit(m); } } : {})}>
                <div className="av lt">{initialsOf(m.display_name || m.email || "?")}</div>
                <div className="wn"><b>{label}</b><small>{m.email || (me ? myEmail : "")}</small></div>
                <div className="wa"><Pill tone={m.member_role === "owner" ? "navy" : ""}>{ROLE_LT[m.member_role] || m.member_role}</Pill>{canEdit ? <span className="btn sm"><Svg name="user" size={14} />Teisės</span> : null}</div>
              </div>
            );
          })}
        </div></section>
      <section className="card"><header><div><h2>Rolės ir teisės</h2></div></header>
        <div className="rolegrid r3">{ROLE_INFO.map(([k, t, d, yes, no]) => (
          <div className={`rolecard${myRole === k ? " cur" : ""}`} key={k}>
            <div className="rc-h"><b>{t}</b>{myRole === k ? <Pill tone="navy">Jūsų rolė</Pill> : null}</div><p>{d}</p>
            <ul>{yes.map((x) => <li className="y" key={x}><Svg name="check" size={14} width={2.6} />{x}</li>)}{no.map((x) => <li className="n" key={x}><Svg name="x" size={13} width={2.6} />{x}</li>)}</ul>
          </div>))}</div></section>
      {owner ? (
        <section className="card"><h2>Pakviesti naują narį</h2>
          <form className="form" onSubmit={(e) => { e.preventDefault(); onInvite(); }}>
            <label className="field">Vardas<input className="nmcap" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} placeholder="Vardas Pavardė" /></label>
            <label className="field">El. paštas<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="vardas@imone.lt" /></label>
            <div className="field wide"><span>Rolė</span><div className="segs rolesel" role="radiogroup" aria-label="Rolė">
              {["manager", "recruiter"].map((r) => <label key={r}><input type="radio" name="trole" checked={form.memberRole === r} onChange={() => setForm({ ...form, memberRole: r })} /><span>{ROLE_LT[r]}</span></label>)}
            </div></div>
            <div className="wide row" style={{ justifyContent: "flex-end" }}><button className="btn primary" type="submit" disabled={busy || seats + invites.length >= MAX_SEATS}>Sukurti kvietimą</button></div>
          </form></section>
      ) : null}
      {owner ? (
        <section className="card"><h2>Išsiųsti kvietimai</h2><div className="list">
          {invites.length ? invites.map((i) => (
            <div className="wk" key={i.invite_id}><div className="av lt">{initialsOf(i.display_name || i.email)}</div>
              <div className="wn"><b>{i.display_name || i.email}</b><small>{i.email} · {ROLE_LT[i.member_role] || i.member_role}</small></div>
              <div className="wa"><button className="btn sm" type="button" onClick={() => onCopy(i.token)}>Kopijuoti nuorodą</button></div></div>
          )) : <Empty title="Išsiųstų kvietimų nėra" sub="Sukurtas kvietimas atsiras čia." icon="mail" />}
        </div></section>
      ) : null}
      <TeamActivity companyId={companyId} myUserId={myUserId} />
      {edit && <RoleModal member={edit} busy={busy} onClose={() => setEdit(null)} onRole={async (m, r) => { await onRole(m, r); setEdit(null); }} onRemove={async (m) => { await onRemove(m); setEdit(null); }} />}
    </>
  );
}
