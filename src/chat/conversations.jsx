import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/config.js";
import { CloseMark, SilentLoader } from "../ui/brand.jsx";
import { ChatConductNotice } from "../ui/common.jsx";

export function ConversationModal({
  open,
  onClose,
  onRead,
  invitationId,
  title,
  user,
  senderMode = null,
}) {
  const [messages, setMessages] = useState([]);
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
    <div className="rs-modal-overlay" onMouseDown={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="rs-modal-card">
        <style>{`
          .rs-modal-overlay{position:fixed;inset:0;background:rgba(34,38,49,.62);z-index:2000;display:grid;place-items:center;padding:20px;backdrop-filter:blur(2px)}
          .rs-modal-card{width:min(760px,100%);max-height:calc(100dvh - 40px);display:grid;grid-template-rows:auto auto minmax(0,1fr) auto;overflow:hidden;background:#fff;border-radius:22px;box-shadow:0 28px 90px rgba(34,38,49,.28);padding:22px;color:#222631}
          .rs-modal-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:14px}
          .rs-modal-head h2{margin:6px 0 0;font-size:24px;line-height:1.2;font-family:Manrope,Inter,sans-serif}.rs-close{border:0;background:#f2f5f7;border-radius:12px;width:42px;height:42px;font-size:20px;cursor:pointer;display:grid;place-items:center;flex:0 0 42px}
          .rs-messages{display:grid;align-content:start;justify-items:start;gap:10px;overflow:auto;padding:16px;background:#f8fafb;border:1px solid #e8eef2;border-radius:18px;min-height:260px;max-height:420px}
          .rs-message{width:fit-content;max-width:min(84%,560px);border:1px solid #dfe7ec;border-radius:16px 16px 16px 6px;padding:12px 14px;background:#fff;box-shadow:0 2px 8px rgba(34,38,49,.04)}
          .rs-message.mine{justify-self:end;background:#f5f3fa;border-color:#c9c2de;border-radius:16px 16px 6px 16px}
          .rs-message.admin{background:#f3f8fb;border-color:#cfe0ec}.rs-message b{display:block;font-size:12px;margin-bottom:5px}.rs-message p{margin:0;white-space:pre-wrap;line-height:1.5;overflow-wrap:anywhere}
          .rs-message time{display:block;margin-top:7px;font-size:10px;color:#7a8996}
          .rs-msg-form{display:grid;grid-template-columns:minmax(0,1fr) 116px;align-items:end;gap:12px;border-top:1px solid #e5ebef;padding-top:14px;margin-top:14px}
          .rs-msg-form textarea{width:100%;min-height:74px;max-height:140px;resize:vertical;border:1px solid #d7e0e7;border-radius:16px;padding:14px 15px;font:inherit;color:#222631;outline:none;line-height:1.45;background:#fff}
          .rs-msg-form textarea:focus{border-color:#6b5b95;box-shadow:0 0 0 3px rgba(107,91,149,.12)}
          .rs-msg-form button{height:54px;align-self:end;min-width:0;border:0;background:#6b5b95;color:#fff;border-radius:16px;padding:0 17px;font:inherit;font-weight:800;cursor:pointer}
          .rs-msg-form button:disabled{opacity:.55;cursor:not-allowed}.rs-error{background:#fff0ec;color:#b64d2a;border-radius:10px;padding:10px 12px;margin-bottom:12px;font-size:12px}
          .rs-empty{color:#6c7a88;text-align:center;padding:28px 10px;justify-self:stretch}.rs-locked{background:#fff0ec;color:#9f4529;border-radius:10px;padding:11px 12px;margin:4px 0 12px;font-size:13px;line-height:1.45}
          .rs-group-note{background:#edf8f3;color:#167a54;border-radius:12px;padding:10px 12px;margin-bottom:12px;font-size:13px;line-height:1.45}
          .dispute-parties{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;color:#6c7a88;font-size:12px}.dispute-party{background:#f2f5f7;border-radius:999px;padding:5px 9px}
          @media(max-width:620px){.rs-modal-overlay{padding:10px}.rs-modal-card{width:calc(100vw - 20px);max-height:calc(100dvh - 20px);border-radius:16px;padding:17px}.rs-msg-form{grid-template-columns:1fr}.rs-msg-form button{width:100%;height:46px}.rs-message{max-width:92%}}
        `}</style>

        <div className="rs-modal-head">
          <div>
            <div className="eyebrow">ŽINUTĖS</div>
            <h2>{title || "Pokalbis apie darbą"}</h2>
          </div>
          <button className="rs-close" onClick={onClose}><CloseMark /></button>
        </div>

        {error && <div className="rs-error">{error}</div>}

        <ChatConductNotice />

        <div className="rs-messages" ref={messagesRef}>
          {loading ? (
            <div className="lt-chat-empty"><SilentLoader size={18} minHeight={42} /></div>
          ) : messages.length ? (
            messages.map((message) => (
              <div
                className={message.sender_id === user.id ? "rs-message mine" : "rs-message"}
                key={message.id}
              >
                <b>
                  {message.sender_label ||
                    names[message.sender_id] ||
                    (message.sender_id === user.id ? "Jūs" : "Vartotojas")}
                </b>
                <p>{message.body}</p>
                <time>
                  {new Date(message.created_at).toLocaleString("lt-LT", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </time>
              </div>
            ))
          ) : (
            <div className="rs-empty">Žinučių dar nėra. Galite parašyti pirmą.</div>
          )}
        </div>

        {conversationLocked && (
          <div className="rs-locked">
            {planLocked ? (
              <>
                <b>Darbo pokalbiai šiame darbe neaktyvūs.</b>
                <div style={{ marginTop: 4 }}>
                  Darbdavys naudoja Basic planą. Žinučių funkcija įtraukta į
                  Business ir Business Pro planus.
                </div>
              </>
            ) : (
              <>
                <b>Šis darbas atšauktas — pokalbis uždarytas.</b>
                {cancellationReason && (
                  <div style={{ marginTop: 4 }}>
                    Atšaukimo priežastis: {cancellationReason}
                  </div>
                )}
                <div style={{ marginTop: 4 }}>
                  Ankstesnes žinutes galite perskaityti, tačiau naujų siųsti
                  nebegalima.
                </div>
              </>
            )}
          </div>
        )}

        <form className="rs-msg-form" onSubmit={sendMessage}>
          <textarea
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.nativeEvent?.isComposing
              ) {
                e.preventDefault();
                if (
                  !conversationLocked &&
                  !sending &&
                  textValue.trim()
                ) {
                  sendMessage(e);
                }
              }
            }}
            maxLength={2000}
            disabled={conversationLocked}
            placeholder={
              conversationLocked
                ? "Pokalbis uždarytas"
                : "Parašykite žinutę..."
            }
          />
          <button disabled={conversationLocked || sending || !textValue.trim()}>
            {sending ? "Siunčiama..." : "Siųsti"}
          </button>
        </form>
      </div>
    </div>
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
    <div
      className="rs-modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="rs-modal-card">
        <style>{`
          .rs-modal-overlay{position:fixed;inset:0;background:rgba(34,38,49,.62);z-index:2000;display:grid;place-items:center;padding:20px;backdrop-filter:blur(2px)}
          .rs-modal-card{width:min(720px,100%);max-height:calc(100dvh - 40px);display:grid;grid-template-rows:auto auto minmax(180px,1fr) auto;overflow:hidden;background:#fff;border-radius:20px;box-shadow:0 28px 90px rgba(34,38,49,.28);padding:22px;color:#222631}
          .rs-modal-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:14px}
          .rs-modal-head h2{margin:6px 0 0;font-size:24px;line-height:1.2;font-family:Manrope,Inter,sans-serif}.rs-close{border:0;background:#f2f5f7;border-radius:12px;width:42px;height:42px;font-size:20px;cursor:pointer;display:grid;place-items:center;flex:0 0 42px}
          .dispute-parties{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;color:#6c7a88;font-size:12px}.dispute-party{background:#f2f5f7;border-radius:999px;padding:5px 9px}
          .rs-messages{display:grid;align-content:start;gap:10px;overflow:auto;padding:18px 4px 14px;background:#f8fafb;border:1px solid #e8eef2;border-radius:16px;min-height:220px;max-height:420px}
          .rs-message{max-width:min(84%,560px);border:1px solid #dfe7ec;border-radius:14px 14px 14px 5px;padding:11px 13px;background:#fff;box-shadow:0 2px 8px rgba(34,38,49,.04)}
          .rs-message.mine{margin-left:auto;background:#f5f3fa;border-color:#c9c2de;border-radius:14px 14px 5px 14px}.rs-message.admin{background:#f3f8fb;border-color:#cfe0ec}
          .rs-message b{display:block;font-size:12px;margin-bottom:5px}.rs-message p{margin:0;white-space:pre-wrap;line-height:1.45;overflow-wrap:anywhere}.rs-message time{display:block;margin-top:7px;font-size:10px;color:#7a8996}
          .rs-msg-form{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;border-top:1px solid #e5ebef;padding-top:14px;margin-top:14px}
          .rs-msg-form textarea{width:100%;min-height:54px;max-height:130px;resize:vertical;border:1px solid #d7e0e7;border-radius:12px;padding:11px 12px;font:inherit;color:#222631;outline:none}
          .rs-msg-form textarea:focus{border-color:#6b5b95;box-shadow:0 0 0 3px rgba(107,91,149,.12)}
          .rs-msg-form button{align-self:stretch;min-width:92px;border:0;background:#6b5b95;color:#fff;border-radius:11px;padding:0 17px;font:inherit;font-weight:800;cursor:pointer}
          .rs-msg-form button:disabled{opacity:.55;cursor:not-allowed}.rs-error{background:#fff0ec;color:#b64d2a;border-radius:10px;padding:10px 12px;margin-bottom:12px;font-size:12px}
          .rs-empty{color:#6c7a88;text-align:center;padding:28px 10px}
          @media(max-width:620px){.rs-modal-overlay{padding:10px}.rs-modal-card{width:calc(100vw - 20px);max-height:calc(100dvh - 20px);border-radius:16px;padding:17px}.rs-msg-form{grid-template-columns:1fr}.rs-msg-form button{min-height:44px}.rs-message{max-width:92%}}
        `}</style>

        <div className="rs-modal-head">
          <div>
            <div className="eyebrow">GINČO POKALBIS</div>
            <h2>{title || "Ginčo aptarimas"}</h2>
            <div className="dispute-parties">
              {workerName && <span className="dispute-party">Darbuotojas: {workerName}</span>}
              {companyName && <span className="dispute-party">Darbdavys: {companyName}</span>}
              <span className="dispute-party">Administratorius</span>
            </div>
          </div>
          <button className="rs-close" onClick={onClose}>
            <CloseMark />
          </button>
        </div>

        {error && <div className="rs-error">{error}</div>}

        <ChatConductNotice />

        <div className="rs-messages" ref={messagesRef}>
          {loading && !messages.length ? (
            <div className="rs-empty"><SilentLoader size={18} minHeight={42} /></div>
          ) : messages.length ? (
            messages.map((message) => {
              const mine = message.sender_id === user?.id;
              const className = [
                "rs-message",
                mine ? "mine" : "",
                message.sender_role === "admin" ? "admin" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <div className={className} key={message.message_id}>
                  <b>{senderLabel(message)}</b>
                  <p>{message.body}</p>
                  <time>
                    {new Date(message.created_at).toLocaleString("lt-LT", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </time>
                </div>
              );
            })
          ) : (
            <div className="lt-chat-empty">Žinučių dar nėra. Galite pradėti aptarimą.</div>
          )}
        </div>

        <form className="rs-msg-form" onSubmit={sendMessage}>
          <textarea
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.nativeEvent?.isComposing
              ) {
                e.preventDefault();
                if (!sending && textValue.trim()) sendMessage(e);
              }
            }}
            maxLength={2000}
            placeholder="Parašykite žinutę abiem ginčo pusėms..."
          />
          <button disabled={sending || !textValue.trim()}>
            {sending ? "Siunčiama..." : "Siųsti"}
          </button>
        </form>
      </div>
    </div>
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
}) {
  const [messages, setMessages] = useState([]);
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
    <div
      className="rs-modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="rs-modal-card rs-job-chat-modal">
        <style>{`
          .rs-modal-overlay{position:fixed;inset:0;background:rgba(34,38,49,.62);z-index:2000;display:grid;place-items:center;padding:20px;backdrop-filter:blur(2px)}
          .rs-modal-card{width:min(760px,100%);max-height:calc(100dvh - 40px);display:grid;grid-template-rows:auto auto minmax(0,1fr) auto;overflow:hidden;background:#fff;border-radius:22px;box-shadow:0 28px 90px rgba(34,38,49,.28);padding:22px;color:#222631}
          .rs-modal-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:14px}
          .rs-modal-head h2{margin:6px 0 0;font-size:24px;line-height:1.2;font-family:Manrope,Inter,sans-serif}.rs-close{border:0;background:#f2f5f7;border-radius:12px;width:42px;height:42px;font-size:20px;cursor:pointer;display:grid;place-items:center;flex:0 0 42px}
          .rs-messages{display:grid;align-content:start;justify-items:start;gap:10px;overflow:auto;padding:16px;background:#f8fafb;border:1px solid #e8eef2;border-radius:18px;min-height:260px;max-height:420px}
          .rs-message{width:fit-content;max-width:min(84%,560px);border:1px solid #dfe7ec;border-radius:16px 16px 16px 6px;padding:12px 14px;background:#fff;box-shadow:0 2px 8px rgba(34,38,49,.04)}
          .rs-message.mine{justify-self:end;background:#f5f3fa;border-color:#c9c2de;border-radius:16px 16px 6px 16px}
          .rs-message.admin{background:#f3f8fb;border-color:#cfe0ec}.rs-message b{display:block;font-size:12px;margin-bottom:5px}.rs-message p{margin:0;white-space:pre-wrap;line-height:1.5;overflow-wrap:anywhere}
          .rs-message time{display:block;margin-top:7px;font-size:10px;color:#7a8996}
          .rs-msg-form{display:grid;grid-template-columns:minmax(0,1fr) 116px;align-items:end;gap:12px;border-top:1px solid #e5ebef;padding-top:14px;margin-top:14px}
          .rs-msg-form textarea{width:100%;min-height:74px;max-height:140px;resize:vertical;border:1px solid #d7e0e7;border-radius:16px;padding:14px 15px;font:inherit;color:#222631;outline:none;line-height:1.45;background:#fff}
          .rs-msg-form textarea:focus{border-color:#6b5b95;box-shadow:0 0 0 3px rgba(107,91,149,.12)}
          .rs-msg-form button{height:54px;align-self:end;min-width:0;border:0;background:#6b5b95;color:#fff;border-radius:16px;padding:0 17px;font:inherit;font-weight:800;cursor:pointer}
          .rs-msg-form button:disabled{opacity:.55;cursor:not-allowed}.rs-error{background:#fff0ec;color:#b64d2a;border-radius:10px;padding:10px 12px;margin-bottom:12px;font-size:12px}
          .rs-empty{color:#6c7a88;text-align:center;padding:28px 10px;justify-self:stretch}.rs-locked{background:#fff0ec;color:#9f4529;border-radius:10px;padding:11px 12px;margin:4px 0 12px;font-size:13px;line-height:1.45}
          .rs-group-note{background:#edf8f3;color:#167a54;border-radius:12px;padding:10px 12px;margin-bottom:12px;font-size:13px;line-height:1.45}.rs-job-chat-modal .rs-modal-head .eyebrow{color:#222631!important}.rs-job-chat-modal [role="note"]{align-items:flex-start!important;padding:8px 10px!important;margin-bottom:10px!important;border-color:#cdc6e0!important;background:#fffaf5!important;color:#6b4a2d!important;font-size:11.5px!important;line-height:1.4!important}
          .dispute-parties{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;color:#6c7a88;font-size:12px}.dispute-party{background:#f2f5f7;border-radius:999px;padding:5px 9px}
          @media(max-width:620px){.rs-modal-overlay{padding:10px}.rs-modal-card{width:calc(100vw - 20px);max-height:calc(100dvh - 20px);border-radius:16px;padding:17px}.rs-msg-form{grid-template-columns:1fr}.rs-msg-form button{width:100%;height:46px}.rs-message{max-width:92%}}
        `}</style>

        <div className="rs-modal-head">
          <div>
            <div className="eyebrow">DARBO POKALBIS</div>
            <h2>{title || "Bendras darbo pokalbis"}</h2>
          </div>
          <button className="rs-close" onClick={onClose}><CloseMark /></button>
        </div>

        <div className="rs-group-note">
          {senderMode === "worker"
            ? "Rašote darbuotojo režimu. Žinutė bus rodoma jūsų darbuotojo vardu."
            : senderMode === "employer"
            ? "Rašote darbdavio režimu. Žinutė bus rodoma jūsų įmonės vardu."
            : "Šį pokalbį mato darbdavys ir visi šį darbą patvirtinę darbuotojai."}
        </div>

        {error && <div className="rs-error">{error}</div>}

        <ChatConductNotice />

        <div className="rs-messages" ref={messagesRef}>
          {loading && !messages.length ? (
            <div className="rs-empty"><SilentLoader size={18} minHeight={42} /></div>
          ) : messages.length ? (
            messages.map((message) => (
              <div
                className={
                  message.sender_id === user.id
                    ? "rs-message mine"
                    : "rs-message"
                }
                key={message.id}
              >
                <b>
                  {message.sender_label ||
                    names[message.sender_id] ||
                    (message.sender_id === user.id ? "Jūs" : "Vartotojas")}
                </b>
                <p>{message.body}</p>
                <time>
                  {new Date(message.created_at).toLocaleString("lt-LT", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </time>
              </div>
            ))
          ) : (
            <div className="rs-empty">
              Darbo pokalbis dar tuščias. Galite parašyti pirmą žinutę.
            </div>
          )}
        </div>

        {conversationLocked && (
          <div className="rs-locked">
            {planLocked ? (
              <>
                <b>Darbo pokalbiai šiame darbe neaktyvūs.</b>
                <div style={{ marginTop: 4 }}>
                  Darbdavys naudoja Basic planą. Bendri ir privatūs darbo
                  pokalbiai įtraukti į Business ir Business Pro.
                </div>
              </>
            ) : (
              <>
                <b>Šis darbas atšauktas — darbo pokalbis uždarytas.</b>
                {cancellationReason && (
                  <div style={{ marginTop: 4 }}>
                    Atšaukimo priežastis: {cancellationReason}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <form className="rs-msg-form" onSubmit={sendMessage}>
          <textarea
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.nativeEvent?.isComposing
              ) {
                e.preventDefault();
                if (
                  !conversationLocked &&
                  !sending &&
                  textValue.trim()
                ) {
                  sendMessage(e);
                }
              }
            }}
            maxLength={2000}
            disabled={conversationLocked}
            placeholder={
              conversationLocked
                ? "Pokalbis uždarytas"
                : "Žinutė visai darbo komandai..."
            }
          />
          <button disabled={conversationLocked || sending || !textValue.trim()}>
            {sending ? "Siunčiama..." : "Siųsti"}
          </button>
        </form>
      </div>
    </div>
  );
}
