import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/config.js";
import { Svg } from "../Shell.jsx";
import { Empty, initialsOf, up } from "../ui.jsx";

// Administratorius: privatūs darbdavio–darbuotojo pokalbiai (skaityti ir rašyti).
export function AdminPrivateChats() {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase.rpc("get_admin_private_job_threads", { p_limit: 200 }).then(({ data, error: rpcError }) => {
      if (cancelled) return;
      if (rpcError) setError(rpcError.message);
      else { setThreads(data || []); setError(""); }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [reload]);

  const q = query.trim().toLocaleLowerCase("lt-LT");
  const list = threads.filter((row) => !q || `${row.company_name} ${row.worker_name} ${row.job_title}`.toLocaleLowerCase("lt-LT").includes(q));

  return (
    <section className="card">
      <header className="row" style={{ justifyContent: "space-between" }}>
        <div><h2>Privatūs pokalbiai</h2><p className="muted small" style={{ margin: 0 }}>Darbdavio ir darbuotojo susirašinėjimai. Galite skaityti ir parašyti kaip administratorius.</p></div>
        <button className="btn sm" type="button" onClick={() => setReload((value) => value + 1)}>Atnaujinti</button>
      </header>
      <label className="csearch" style={{ maxWidth: 420 }}><Svg name="search" size={17} /><span className="sr">Ieškoti</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Įmonė, darbuotojas ar darbas" /></label>
      {error ? <p className="small" style={{ color: "var(--red)", margin: 0 }}>{error}</p> : null}
      {loading ? <p className="muted small">Kraunama…</p> : list.length ? (
        <div className="list">
          {list.map((row) => (
            <button key={row.invitation_id} type="button" className="conv" style={{ border: "1px solid var(--line)", borderRadius: 7 }} onClick={() => setOpen(row)}>
              <span className="cav">{initialsOf(row.company_name)}</span>
              <div className="cn">
                <span className="ctype p"><Svg name="shield" size={12} width={2.4} />Privatus · {row.message_count} žin.</span>
                <b>{row.company_name || "Įmonė"} ↔ {row.worker_name}</b>
                <small>{up(row.job_title)} · {row.last_at ? new Date(row.last_at).toLocaleString("lt-LT", { dateStyle: "short", timeStyle: "short" }) : ""}</small>
              </div>
            </button>
          ))}
        </div>
      ) : <Empty title="Privačių pokalbių nėra" sub="Kai darbdavys ir darbuotojas susirašinės, pokalbiai atsiras čia." />}
      {open && <AdminPrivateThread thread={open} onClose={() => { setOpen(null); setReload((value) => value + 1); }} />}
    </section>
  );
}

function AdminPrivateThread({ thread, onClose }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef(null);
  const load = async () => {
    const { data, error: rpcError } = await supabase.rpc("get_admin_private_job_messages", { p_invitation_id: thread.invitation_id });
    if (rpcError) setError(rpcError.message); else setMessages(data || []);
  };
  useEffect(() => { load(); }, [thread.invitation_id]);
  useEffect(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; }, [messages.length]);
  const send = async () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    setError("");
    const { error: rpcError } = await supabase.rpc("admin_send_private_job_message", { p_invitation_id: thread.invitation_id, p_body: text.trim() });
    setBusy(false);
    if (rpcError) { setError(rpcError.message); return; }
    setText("");
    load();
  };
  return (
    <div className="modal-bg" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="apc-title">
        <header>
          <div><span className="eyebrow">Privatus pokalbis</span><h2 id="apc-title">{thread.company_name} ↔ {thread.worker_name}</h2><p className="muted small" style={{ margin: 0 }}>{up(thread.job_title)}</p></div>
          <button type="button" className="x" aria-label="Uždaryti" onClick={onClose}><Svg name="x" size={18} width={2.2} /></button>
        </header>
        <div ref={listRef} style={{ maxHeight: "50vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
          {messages.length ? messages.map((message) => (
            <div key={message.message_id} style={{ alignSelf: message.sender_role === "admin" ? "flex-end" : "flex-start", maxWidth: "80%", background: message.sender_role === "admin" ? "var(--navy)" : "var(--soft)", color: message.sender_role === "admin" ? "#fff" : "var(--navy)", borderRadius: 8, padding: "8px 12px" }}>
              <small style={{ display: "block", opacity: 0.75, fontWeight: 700 }}>{message.sender_role === "admin" ? "Administratorius" : message.sender_name}</small>
              <span style={{ whiteSpace: "pre-wrap" }}>{message.body}</span>
              <small style={{ display: "block", opacity: 0.6, marginTop: 2 }}>{new Date(message.created_at).toLocaleString("lt-LT", { dateStyle: "short", timeStyle: "short" })}</small>
            </div>
          )) : <p className="muted small">Žinučių nėra.</p>}
        </div>
        <label className="field">Rašyti kaip administratorius<textarea value={text} maxLength={2000} onChange={(event) => setText(event.target.value)} placeholder="Žinutę matys darbdavys ir darbuotojas" /></label>
        {error ? <p className="small" style={{ color: "var(--red)", margin: 0 }}>{error}</p> : null}
        <div className="row" style={{ justifyContent: "flex-end" }}>
          <button className="btn" type="button" onClick={onClose}>Uždaryti</button>
          <button className="btn primary" type="button" disabled={busy || !text.trim()} onClick={send}>{busy ? "Siunčiama…" : "Siųsti"}</button>
        </div>
      </div>
    </div>
  );
}
