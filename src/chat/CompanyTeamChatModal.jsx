import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/config.js";
import { ChatThreadView } from "./conversations.jsx";

export function CompanyTeamChatModal({
  open,
  onClose,
  companyId,
  companyName,
  user,
  onRead = null,
}) {
  const [messages, setMessages] = useState([]);
  const [textValue, setTextValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const messagesRef = useRef(null);
  const scrollOnLoadRef = useRef(true);
  const loadedCompanyRef = useRef(null);

  useEffect(() => {
    if (!open || !companyId) return;

    scrollOnLoadRef.current = true;
    loadedCompanyRef.current = null;
    setMessages([]);
    loadMessages();
    const timer = setInterval(loadMessages, 3000);
    return () => clearInterval(timer);
  }, [open, companyId]);

  useEffect(() => {
    if (!open || loading || loadedCompanyRef.current !== companyId || !messagesRef.current) return;

    const frame = requestAnimationFrame(() => {
      if (messagesRef.current) {
        messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
      }
      scrollOnLoadRef.current = false;
    });
    return () => cancelAnimationFrame(frame);
  }, [open, loading, messages, companyId]);

  async function loadMessages() {
    if (loadedCompanyRef.current !== companyId) setLoading(true);
    setError("");

    try {
      const result = await supabase.rpc("get_company_team_messages", {
        p_company_id: companyId,
      });

      if (result.error) throw result.error;
      loadedCompanyRef.current = companyId;
      setMessages(result.data || []);

      const readResult = await supabase.rpc("mark_company_team_chat_read", {
        p_company_id: companyId,
      });

      if (readResult.error) throw readResult.error;
      onRead?.();
    } catch (err) {
      setError(err?.message || "Nepavyko įkelti vadovų pokalbio.");
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(e) {
    e.preventDefault();

    const body = textValue.trim();
    if (!body || sending || !companyId) return;

    setSending(true);
    setError("");

    try {
      const result = await supabase.rpc("send_company_team_message", {
        p_company_id: companyId,
        p_body: body,
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
    <ChatThreadView kind="team" title="Vadovų pokalbis" sub={companyName || "Įmonės komanda"}
      privacy={["Vadovų pokalbis", "Mato tik įmonės komanda. Darbuotojai nemato. Prireikus – ir statybos24 administratorius."]}
      messages={messages} isMine={(m) => m.sender_id === user.id} senderOf={(m) => m.sender_label || "Komandos narys"}
      loading={loading} error={error} messagesRef={messagesRef} locked={false}
      value={textValue} setValue={setTextValue} onSend={sendMessage} sending={sending} onClose={onClose} placeholder="Rašyti komandai" />
  );
}
