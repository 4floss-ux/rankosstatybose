import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/config.js";
import { Svg } from "../p24/Shell.jsx";

/* Prototipo pokalbio langas („chatpop“ su atidarytu pokalbiu). Logika – kiekviename modale. */
const dayLabel = (iso) => {
  const d = new Date(iso); const t = new Date(); const y = new Date(); y.setDate(t.getDate() - 1);
  if (d.toDateString() === t.toDateString()) return "Šiandien";
  if (d.toDateString() === y.toDateString()) return "Vakar";
  return d.toLocaleDateString("lt-LT");
};
const ini2 = (n) => String(n || "?").replace(/^(UAB|MB|IĮ|AB)\s+/i, "").trim().split(/\s+/).map((p) => p[0] || "").join("").slice(0, 2).toLocaleUpperCase("lt-LT");
export function ChatThreadView({ kind = "private", title, sub, privacy, messages, isMine, senderOf, isAdmin, loading, error, locked, lockText, value, setValue, onSend, sending, onClose, placeholder, messagesRef }) {
  const grp = kind !== "private";
  let lastDay = null;
  const rows = [];
  messages.forEach((m, i) => {
    const prev = messages[i - 1]; const next = messages[i + 1];
    const day = m.created_at ? dayLabel(m.created_at) : "";
    if (day !== lastDay) { rows.push(<div className="dsep" key={`d${i}`}>{day}</div>); lastDay = day; }
    const same = (a, b) => a && b && senderOf(a) === senderOf(b) && dayLabel(a.created_at) === dayLabel(b.created_at);
    const first = !same(prev, m); const last = !same(m, next); const me = isMine(m); const who = senderOf(m);
    if ((grp || isAdmin?.(m)) && first) rows.push(<div className={`who-n${me ? " me" : ""}${isAdmin?.(m) ? " adm" : ""}`} key={`w${i}`}>{me ? "Jūs" : who}</div>);
    rows.push(
      <div className={`mrow${me ? " me" : ""}${first ? " first newgrp" : ""}${last ? " last" : ""}`} key={m.id || m.message_id || i}>
        {me ? null : <span className="cav sm">{ini2(who)}</span>}
        <div className="bub" style={{ whiteSpace: "pre-wrap" }}>{m.body}</div>
        {last && m.created_at ? <span className="mtime">{new Date(m.created_at).toLocaleTimeString("lt-LT", { hour: "2-digit", minute: "2-digit" })}</span> : null}
      </div>
    );
  });
  return (
    <div className="p24 p24-portal">
      <div className="chatpop" role="dialog" aria-label={title} style={{ zIndex: 9000 }}>
        <div className="chat narrow has-thread">
          <div className={`thread${grp ? " grp" : ""}`} role="region" aria-label="Pokalbis">
            <div className="thead">
              <button type="button" className="tbtn back" aria-label="Atgal" onClick={onClose}><Svg name="back" size={22} width={2.4} /></button>
              <div className="tperson"><span className={`cav${grp ? " grp" : ""}`}>{grp ? <Svg name="people" size={22} /> : ini2(title)}</span><div className="tn"><b>{title}</b>{sub ? <small>{sub}</small> : null}</div></div>
              <button type="button" className="tbtn" aria-label="Uždaryti" onClick={onClose}><Svg name="x" size={20} width={2.2} /></button>
            </div>
            <div className={`msgs ${grp ? "is-grp" : "is-prv"}`} ref={messagesRef}>
              {privacy ? <div className={`privacy ${grp ? "grp" : "prv"}`}><Svg name={grp ? "people" : "shield"} size={16} /><div><b>{privacy[0]}</b><span>{privacy[1]}</span></div></div> : null}
              {loading && !messages.length ? <p className="muted small" style={{ textAlign: "center" }}>Įkeliama...</p> : messages.length ? rows : <p className="muted small" style={{ textAlign: "center" }}>Žinučių dar nėra. Galite parašyti pirmą.</p>}
            </div>
            {error ? <p className="ferr" role="alert" style={{ margin: "0 12px" }}>{error}</p> : null}
            {locked ? <div className="notebox" style={{ margin: "0 12px 12px" }}>{lockText}</div> : (
              <form className="compose" onSubmit={onSend}>
                <div className={`pillin${grp ? " grp" : ""}`}><span className="to"><Svg name={grp ? "people" : "shield"} size={15} /></span>
                  <input value={value} maxLength={2000} placeholder={placeholder} autoComplete="off" aria-label={placeholder} onChange={(e) => setValue(e.target.value)} /></div>
                <button className="send" type="submit" aria-label="Siųsti" disabled={sending || !value.trim()}><Svg name="send" size={18} width={2.2} /></button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ConversationModal({
  open,
  onClose,
  onRead,
  invitationId,
  title,
  user,
  senderMode = null,
  hiddenBefore = null,
}) {
  const [allMessages, setMessages] = useState([]);
  // „Ištrinti sau“: rodomos tik žinutės po paslėpimo momento
  const messages = hiddenBefore ? allMessages.filter((message) => !message.created_at || new Date(message.created_at) > new Date(hiddenBefore)) : allMessages;
  const [names, setNames] = useState({});
  const [textValue, setTextValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [conversationLocked, setConversationLocked] = useState(false);
  const [planLocked, setPlanLocked] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [error, setError] = useState("");
  const messagesRef = useRef(null);
  const scrollOnLoadRef = useRef(true);
  const loadedConversationRef = useRef(null);

  useEffect(() => {
    if (open && invitationId) {
      scrollOnLoadRef.current = true;
      loadedConversationRef.current = null;
      setMessages([]);
      loadMessages();
    }
  }, [open, invitationId, senderMode]);

  useEffect(() => {
    if (!open || loading || loadedConversationRef.current !== invitationId) return;
    const frame = requestAnimationFrame(() => {
      if (messagesRef.current) {
        messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
      }
      scrollOnLoadRef.current = false;
    });
    if (document.visibilityState === "visible") onRead?.();
    return () => cancelAnimationFrame(frame);
  }, [open, loading, messages, invitationId]);

  async function loadMessages() {
    setLoading(true);
    setError("");
    try {
      const [result, invitationResult] = await Promise.all([
        supabase
          .from("job_messages")
          .select("id, sender_id, sender_context, sender_label, body, created_at")
          .eq("invitation_id", invitationId)
          .order("created_at", { ascending: true }),
        supabase
          .from("job_invitations")
          .select("job_id")
          .eq("id", invitationId)
          .single(),
      ]);

      if (result.error) throw result.error;
      if (invitationResult.error) throw invitationResult.error;

      const [jobResult, chatPlanResult] = await Promise.all([
        supabase
          .from("jobs")
          .select("status, cancellation_reason")
          .eq("id", invitationResult.data.job_id)
          .single(),
        supabase.rpc("job_chat_enabled", {
          p_job_id: invitationResult.data.job_id,
        }),
      ]);

      if (jobResult.error) throw jobResult.error;
      if (chatPlanResult.error) throw chatPlanResult.error;

      const cancelled = jobResult.data?.status === "cancelled";
      const chatPlanLocked = !chatPlanResult.data;

      setPlanLocked(chatPlanLocked);
      setConversationLocked(cancelled || chatPlanLocked);
      setCancellationReason(jobResult.data?.cancellation_reason || "");

      const rows = result.data || [];
      loadedConversationRef.current = invitationId;
      setMessages(rows);

      const ids = [...new Set(rows.map((row) => row.sender_id).filter(Boolean))];
      if (ids.length) {
        const profilesResult = await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", ids);

        if (profilesResult.error) throw profilesResult.error;

        setNames(
          Object.fromEntries(
            (profilesResult.data || []).map((row) => [
              row.id,
              row.display_name || "Vartotojas",
            ])
          )
        );
      } else {
        setNames({});
      }
    } catch (err) {
      setError(err?.message || "Nepavyko įkelti žinučių.");
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(e) {
    e.preventDefault();
    const body = textValue.trim();
    if (!body || !invitationId || conversationLocked) return;

    setSending(true);
    setError("");
    try {
      const result = senderMode
        ? await supabase.rpc("admin_send_private_job_message_as_mode", {
            p_invitation_id: invitationId,
            p_body: body,
            p_mode: senderMode,
          })
        : await supabase.from("job_messages").insert({
            invitation_id: invitationId,
            sender_id: user.id,
            body,
          });

      if (result.error) throw result.error;

      setTextValue("");
      scrollOnLoadRef.current = true;
      await loadMessages();
    } catch (err) {
      setError(err?.message || "Nepavyko išsiųsti žinutės.");
    } finally {
      setSending(false);
    }
  }

  if (!open) return null;

  return (
    <ChatThreadView kind="private" title={title || "Pokalbis apie darbą"} sub="Privatus pokalbis"
      privacy={["Privatus pokalbis", "Mato tik jūs, pašnekovas ir statybos24 administratorius"]}
      messages={messages} isMine={(m) => m.sender_id === user.id}
      senderOf={(m) => m.sender_label || names[m.sender_id] || (m.sender_id === user.id ? "Jūs" : "Vartotojas")}
      loading={loading} error={error} messagesRef={messagesRef}
      locked={conversationLocked}
      lockText={planLocked ? "Darbo pokalbiai šiame darbe neaktyvūs: darbdavys naudoja Basic planą. Žinutės – Business ir Business Pro planuose." : `Šis darbas atšauktas – pokalbis uždarytas.${cancellationReason ? ` Priežastis: ${cancellationReason}.` : ""} Ankstesnes žinutes galite perskaityti.`}
      value={textValue} setValue={setTextValue} onSend={sendMessage} sending={sending} onClose={onClose} placeholder="Rašyti privačiai" />
  );
}


export function DisputeConversationModal({
  open,
  onClose,
  attendanceId,
  title,
  workerName,
  companyName,
  user,
}) {
  const [messages, setMessages] = useState([]);
  const [textValue, setTextValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const messagesRef = useRef(null);
  const scrollOnLoadRef = useRef(true);

  useEffect(() => {
    if (!open || !attendanceId) return;

    scrollOnLoadRef.current = true;
    setMessages([]);
    loadMessages();

    const timer = window.setInterval(loadMessages, 3000);
    return () => window.clearInterval(timer);
  }, [open, attendanceId]);

  useEffect(() => {
    if (!open || loading || !messagesRef.current) return;

    const frame = requestAnimationFrame(() => {
      if (messagesRef.current) {
        messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
      }
      scrollOnLoadRef.current = false;
    });

    return () => cancelAnimationFrame(frame);
  }, [open, loading, messages]);

  async function loadMessages() {
    if (!attendanceId) return;

    setLoading(true);
    setError("");
    try {
      const result = await supabase.rpc(
        "get_attendance_dispute_chat_messages",
        { p_attendance_id: attendanceId }
      );

      if (result.error) throw result.error;
      setMessages(result.data || []);
    } catch (err) {
      setError(err?.message || "Nepavyko įkelti ginčo žinučių.");
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(e) {
    e.preventDefault();
    const body = textValue.trim();
    if (!body || !attendanceId || sending) return;

    setSending(true);
    setError("");
    try {
      const result = await supabase.rpc(
        "send_attendance_dispute_chat_message",
        {
          p_attendance_id: attendanceId,
          p_body: body,
        }
      );

      if (result.error) throw result.error;

      setTextValue("");
      scrollOnLoadRef.current = true;
      await loadMessages();
    } catch (err) {
      setError(err?.message || "Nepavyko išsiųsti žinutės.");
    } finally {
      setSending(false);
    }
  }

  function senderLabel(message) {
    if (message.sender_name) return message.sender_name;
    if (message.sender_role === "admin") return "Administratorius";
    if (message.sender_role === "worker") {
      return workerName ? `Darbuotojas ${workerName}` : "Darbuotojas";
    }
    if (message.sender_role === "employer") {
      return companyName ? `${companyName} · Darbdavys` : "Darbdavys";
    }
    return "Vartotojas";
  }

  if (!open) return null;

  return (
    <ChatThreadView kind="group" title={title || "Ginčo aptarimas"} sub={[workerName, companyName, "Administratorius"].filter(Boolean).join(" · ")}
      privacy={["Ginčo pokalbis", "Mato abi ginčo pusės ir statybos24 administratorius"]}
      messages={messages} isMine={(m) => m.sender_id === user?.id} senderOf={(m) => senderLabel(m)} isAdmin={(m) => m.sender_role === "admin"}
      loading={loading} error={error} messagesRef={messagesRef} locked={false}
      value={textValue} setValue={setTextValue} onSend={sendMessage} sending={sending} onClose={onClose} placeholder="Rašyti abiem pusėms" />
  );
}


export function GroupConversationModal({
  open,
  onClose,
  onRead,
  jobId,
  title,
  user,
  senderMode = null,
  hiddenBefore = null,
}) {
  const [allMessages, setMessages] = useState([]);
  const messages = hiddenBefore ? allMessages.filter((message) => !message.created_at || new Date(message.created_at) > new Date(hiddenBefore)) : allMessages;
  const [names, setNames] = useState({});
  const [textValue, setTextValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [conversationLocked, setConversationLocked] = useState(false);
  const [planLocked, setPlanLocked] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [error, setError] = useState("");
  const messagesRef = useRef(null);
  const scrollOnLoadRef = useRef(true);
  const loadedConversationRef = useRef(null);

  useEffect(() => {
    if (!open || !jobId) return;

    scrollOnLoadRef.current = true;
    loadedConversationRef.current = null;
    setMessages([]);
    loadMessages();
    const timer = setInterval(loadMessages, 3000);
    return () => clearInterval(timer);
  }, [open, jobId, senderMode]);

  useEffect(() => {
    if (!open || loading || loadedConversationRef.current !== jobId) return;
    const frame = requestAnimationFrame(() => {
      if (messagesRef.current) {
        messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
      }
      scrollOnLoadRef.current = false;
    });
    if (document.visibilityState === "visible") onRead?.();
    return () => cancelAnimationFrame(frame);
  }, [open, loading, messages, jobId]);

  async function loadMessages() {
    if (!messages.length) setLoading(true);
    setError("");

    try {
      const [messagesResult, jobResult, chatPlanResult] = await Promise.all([
        supabase
          .from("job_group_messages")
          .select("id, sender_id, sender_context, sender_label, body, created_at")
          .eq("job_id", jobId)
          .order("created_at", { ascending: true }),
        supabase
          .from("jobs")
          .select("status, cancellation_reason")
          .eq("id", jobId)
          .single(),
        supabase.rpc("job_chat_enabled", {
          p_job_id: jobId,
        }),
      ]);

      if (messagesResult.error) throw messagesResult.error;
      if (jobResult.error) throw jobResult.error;
      if (chatPlanResult.error) throw chatPlanResult.error;

      const chatPlanLocked = !chatPlanResult.data;
      setPlanLocked(chatPlanLocked);
      setConversationLocked(
        jobResult.data?.status === "cancelled" || chatPlanLocked
      );
      setCancellationReason(jobResult.data?.cancellation_reason || "");

      const rows = messagesResult.data || [];
      loadedConversationRef.current = jobId;
      setMessages(rows);

      const ids = [...new Set(rows.map((row) => row.sender_id).filter(Boolean))];
      if (ids.length) {
        const profilesResult = await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", ids);

        if (profilesResult.error) throw profilesResult.error;

        setNames(
          Object.fromEntries(
            (profilesResult.data || []).map((row) => [
              row.id,
              row.display_name || "Vartotojas",
            ])
          )
        );
      } else {
        setNames({});
      }
    } catch (err) {
      setError(err?.message || "Nepavyko įkelti darbo pokalbio.");
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(e) {
    e.preventDefault();
    const body = textValue.trim();
    if (!body || !jobId || conversationLocked) return;

    setSending(true);
    setError("");

    try {
      const result = senderMode
        ? await supabase.rpc("admin_send_job_chat_as_mode", {
            p_job_id: jobId,
            p_body: body,
            p_mode: senderMode,
          })
        : await supabase.from("job_group_messages").insert({
            job_id: jobId,
            sender_id: user.id,
            body,
          });

      if (result.error) throw result.error;

      setTextValue("");
      scrollOnLoadRef.current = true;
      await loadMessages();
    } catch (err) {
      setError(err?.message || "Nepavyko išsiųsti žinutės.");
    } finally {
      setSending(false);
    }
  }

  if (!open) return null;

  return (
    <ChatThreadView kind="group" title={String(title || "Bendras darbo pokalbis").toLocaleUpperCase("lt-LT")} sub="Darbo pokalbis"
      privacy={["Bendras darbo pokalbis", "Mato visi šio darbo dalyviai ir statybos24 administratorius"]}
      messages={messages} isMine={(m) => m.sender_id === user.id}
      senderOf={(m) => m.sender_label || names[m.sender_id] || (m.sender_id === user.id ? "Jūs" : "Vartotojas")}
      loading={loading} error={error} messagesRef={messagesRef}
      locked={conversationLocked}
      lockText={planLocked ? "Darbo pokalbiai šiame darbe neaktyvūs: darbdavys naudoja Basic planą. Žinutės – Business ir Business Pro planuose." : `Šis darbas atšauktas – pokalbis uždarytas.${cancellationReason ? ` Priežastis: ${cancellationReason}.` : ""} Ankstesnes žinutes galite perskaityti.`}
      value={textValue} setValue={setTextValue} onSend={sendMessage} sending={sending} onClose={onClose} placeholder="Rašyti visiems" />
  );
}
