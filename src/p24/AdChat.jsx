import { useEffect, useRef, useState } from "react";
import { publicJobAdPath } from "../lib/publicJobAds.js";
import { supabase } from "../lib/config.js";
import { ChatThreadView } from "../chat/conversations.jsx";

/* Skelbimo pokalbis tarp įmonės ir kandidato (prototipe „Rašyti“ / „Rašyti įmonei“). */
export function AdChat({ applicationId, adId, title, sub, closed, onClose, onRead, hiddenBefore }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const ref = useRef(null);

  async function load(silent) {
    if (document.visibilityState === "hidden" || (ref.current && !ref.current.getClientRects().length)) return;
    if (!silent) setLoading(true);
    const { data, error: err } = await supabase.rpc("job_ad_chat_messages", { p_application_id: applicationId });
    if (err) setError(err.message || "Nepavyko įkelti pokalbio.");
    else { setError(""); setMessages((data || []).filter(message => !hiddenBefore || new Date(message.created_at) > new Date(hiddenBefore))); onRead?.(); }
    setLoading(false);
  }
  useEffect(() => {
    load(false);
    const refresh = () => load(true);
    const timer = setInterval(refresh, 15000);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", refresh); window.removeEventListener("focus", refresh); };
  }, [applicationId]);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [messages.length]);

  async function send(event) {
    event.preventDefault();
    const body = value.trim();
    if (!body || sending) return;
    setSending(true);
    const { error: err } = await supabase.rpc("job_ad_chat_send", { p_application_id: applicationId, p_body: body });
    setSending(false);
    if (err) { setError(err.message || "Žinutės išsiųsti nepavyko."); return; }
    setValue("");
    load(true);
  }

  return (
    <ChatThreadView kind="private" title={title} sub={sub} privacy={[sub ? `Darbo skelbimas: ${sub}` : "Pokalbis dėl skelbimo", <>Žinutes matote tik jūs ir kita pusė.{adId ? <> <a href={publicJobAdPath(adId)}>Atidaryti skelbimą</a></> : null}</>]}
      messages={messages} isMine={(m) => m.is_mine} senderOf={(m) => (m.is_mine ? "Jūs" : title)}
      loading={loading} error={error} locked={closed} lockText="Pokalbis uždarytas."
      value={value} setValue={setValue} onSend={send} sending={sending} onClose={onClose} placeholder="Rašykite žinutę..." messagesRef={ref} />
  );
}
