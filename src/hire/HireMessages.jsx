import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Svg } from "../p24/Shell.jsx";
import { ChatThreadView } from "../chat/conversations.jsx";
import { supabase } from "../lib/config.js";
import { hireMessageCall, HIRE_MESSAGE_LIMIT, hireCompanyInitials, hireUnreadCount, loadHireReadIds, saveHireReadIds } from "./hireMessages.js";
import "./hireMessages.css";

// A request ID is never an employer credential. The server authorizes every call.
export function HireMessages({ requestId, sessionToken, companyName, readScope, lang = "lt" }) {
  const lt = lang === "lt";
  const t = (a, b) => lt ? a : b;
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const readIds = useRef(new Set());
  const ownKind = requestId ? "admin" : "employer";
  const panelId = useId();
  const launcher = useRef(null);
  const input = useRef(null);
  const list = useRef(null);
  const pending = useRef(null);
  const sending = useRef(false);
  const generation = useRef(0);
  const refresh = useRef(() => {});

  useEffect(() => {
    readIds.current = loadHireReadIds(readScope);
  }, [readScope]);

  useEffect(() => {
    const update = () => {
      if (open && !document.hidden && document.hasFocus()) {
        const incoming = messages.filter(message => message.sender_kind !== ownKind).map(message => message.id);
        readIds.current = new Set([...new Set([...readIds.current, ...incoming])].slice(-200));
        saveHireReadIds(readScope, readIds.current);
      }
      setUnread(hireUnreadCount(messages, ownKind, readIds.current));
    };
    update();
    const storageChanged = event => {
      if (readScope && event.key === `s24-hire-read:v1:${readScope}`) {
        readIds.current = loadHireReadIds(readScope);
        update();
      }
    };
    window.addEventListener("focus", update);
    window.addEventListener("storage", storageChanged);
    document.addEventListener("visibilitychange", update);
    return () => { window.removeEventListener("focus", update); window.removeEventListener("storage", storageChanged); document.removeEventListener("visibilitychange", update); };
  }, [messages, open, ownKind, readScope]);

  function close() {
    setOpen(false);
    launcher.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    refresh.current();
    const escape = event => { if (event.key === "Escape") { event.stopPropagation(); close(); } };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [open]);

  useEffect(() => {
    if (open && list.current) list.current.scrollTop = list.current.scrollHeight;
  }, [open, messages]);

  useEffect(() => {
    let active = true;
    let fetching = false;
    generation.current += 1;
    setMessages([]); setBody(""); setError(""); setSent(false); setLoading(true);
    pending.current = null;
    async function load() {
      if (!active || fetching) return;
      fetching = true;
      try {
        const call = hireMessageCall({ requestId, sessionToken });
        if (!supabase) throw new Error("Unavailable");
        const result = await supabase.rpc(call.name, call.args);
        if (result.error) throw result.error;
        if (active) { setMessages(result.data || []); setError(""); }
      } catch {
        if (active) setError(lt ? "Nepavyko įkelti žinučių. Bandykite atnaujinti." : "Could not load messages. Try refreshing.");
      } finally {
        fetching = false;
        if (active) setLoading(false);
      }
    }
    refresh.current = load;
    load();
    const visibleLoad = () => { if (!document.hidden) load(); };
    const timer = setInterval(visibleLoad, 15000);
    window.addEventListener("focus", visibleLoad);
    document.addEventListener("visibilitychange", visibleLoad);
    return () => { active = false; generation.current += 1; clearInterval(timer); window.removeEventListener("focus", visibleLoad); document.removeEventListener("visibilitychange", visibleLoad); };
  }, [requestId, sessionToken, lt]);

  async function send(event) {
    event.preventDefault();
    if (sending.current || !body.trim() || !supabase) return;
    sending.current = true;
    const current = generation.current;
    setBusy(true); setError(""); setSent(false);
    try {
      // Keep the same ID after a network failure, so retrying cannot duplicate a message.
      if (!pending.current || pending.current.body !== body) pending.current = { body, id: crypto.randomUUID() };
      const call = hireMessageCall({ requestId, sessionToken }, body, pending.current.id);
      const result = await supabase.rpc(call.name, call.args);
      if (result.error) throw result.error;
      if (current === generation.current) {
        pending.current = null; setBody(""); setSent(true);
        await refresh.current();
      }
    } catch {
      if (current === generation.current) setError(t("Žinutė neišsiųsta arba gavimas nepatvirtintas. Bandykite dar kartą.", "Message delivery was not confirmed. Please retry."));
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }

  return createPortal(<div className={`p24 hire-chat-widget${requestId ? " hire-chat-admin" : ""}`}>
    <button ref={launcher} className="chatfab hire-chat-launcher" type="button" aria-label={t("Žinutės", "Messages")} aria-expanded={open} aria-controls={panelId} onClick={() => open ? close() : setOpen(true)}>
      <Svg name={open ? "x" : "chat"} size={24} />
      {unread ? <span className="nb" role="status" aria-label={t(`Naujos žinutės: ${unread}`, `New messages: ${unread}`)}>{unread > 99 ? "99+" : unread}</span> : null}
    </button>
    {open ? <ChatThreadView
      panelId={panelId} panelClassName="hire-chat-panel"
      title={requestId ? companyName || t("Įmonė", "Company") : t("Statybos24 administratorius", "Statybos24 administrator")}
      sub={t("Tarptautinė atranka · visi darbuotojų poreikiai", "International hire · all workforce needs")}
      messages={messages} messagesRef={list}
      isMine={message => message.sender_kind === (requestId ? "admin" : "employer")}
      senderOf={message => message.sender_kind === "admin" ? t("Statybos24 administratorius", "Statybos24 administrator") : companyName || t("Įmonė", "Company")}
      showSenderNames initialsOf={hireCompanyInitials}
      loading={loading} error={error} value={body}
      setValue={value => { if (!busy) { setBody(value); setSent(false); } }}
      onSend={send} sending={busy || loading} onClose={close}
      placeholder={t("Rašykite žinutę...", "Write a message...")}
      inputRef={input} maxLength={HIRE_MESSAGE_LIMIT}
      labels={{ back: t("Atgal", "Back"), close: t("Uždaryti", "Close"), send: t("Siųsti žinutę", "Send message"), loading: t("Įkeliama...", "Loading..."), empty: t("Žinučių dar nėra. Galite parašyti pirmą.", "No messages yet. You can write the first one.") }}
      footer={sent ? <p className="small muted hire-chat-feedback" role="status">{t("Žinutė išsiųsta.", "Message sent.")}</p> : null}
    /> : null}
  </div>, document.body);
}
