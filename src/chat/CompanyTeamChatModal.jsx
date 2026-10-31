import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/config.js";
import { CloseMark, SilentLoader } from "../ui/brand.jsx";
import { ChatConductNotice } from "../ui/common.jsx";

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
    <div
      className="ctc-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !sending) onClose();
      }}
    >
      <div className="ctc-modal">
        <style>{`
          .ctc-overlay{position:fixed;inset:0;z-index:9600;background:rgba(34,38,49,.62);display:grid;place-items:center;padding:20px;backdrop-filter:blur(2px)}
          .ctc-modal{width:min(720px,100%);max-height:calc(100dvh - 40px);display:grid;grid-template-rows:auto auto minmax(180px,1fr) auto;overflow:hidden;background:#fff;border-radius:20px;box-shadow:0 28px 90px rgba(34,38,49,.3);padding:22px;color:#222631}
          .ctc-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:14px}
          .ctc-head h2{margin:6px 0 0;font-family:Manrope,Inter,sans-serif;font-size:24px;line-height:1.2}
          .ctc-head p{margin:6px 0 0;color:#6c7a88;font-size:13px;line-height:1.45}
          .ctc-close{width:42px;height:42px;border:0;border-radius:12px;background:#f2f5f7;color:#222631;font-size:21px;cursor:pointer;display:grid;place-items:center;flex:0 0 auto}
          .ctc-error{background:#fff0ec;color:#b64d2a;border-radius:10px;padding:10px 12px;font-size:12px;margin-bottom:12px}
          .ctc-messages{display:grid;align-content:start;justify-items:start;gap:10px;min-height:220px;max-height:420px;overflow:auto;padding:18px 4px 14px;background:#f8fafb;border:1px solid #e8eef2;border-radius:16px}
          .ctc-empty{justify-self:stretch;text-align:center;color:#7a8996;padding:42px 14px;font-size:13px}
          .ctc-message{width:fit-content;max-width:min(84%,560px);padding:11px 13px;border-radius:14px 14px 14px 5px;background:#fff;border:1px solid #dfe7ec;box-shadow:0 2px 8px rgba(34,38,49,.04)}
          .ctc-message.mine{justify-self:end;background:#f5f3fa;border-color:#c9c2de;border-radius:14px 14px 5px 14px}
          .ctc-message b{display:block;font-size:12px;margin-bottom:5px}.ctc-role{font-weight:600;color:#7a8996}
          .ctc-message p{margin:0;white-space:pre-wrap;line-height:1.45;overflow-wrap:anywhere}.ctc-message time{display:block;margin-top:7px;color:#8a98a6;font-size:10px}
          .ctc-form{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:stretch;gap:10px;border-top:1px solid #e4ebf0;padding-top:14px;margin-top:14px}
          .ctc-form textarea{width:100%;min-height:54px;max-height:130px;resize:vertical;border:1px solid #d7e0e7;border-radius:12px;padding:11px 12px;font:inherit;line-height:1.4;outline:none}.ctc-form textarea:focus{border-color:#6b5b95;box-shadow:0 0 0 3px rgba(107,91,149,.12)}
          .ctc-form button{min-height:54px;border:0;border-radius:11px;background:#6b5b95;color:#fff;padding:0 18px;font:inherit;font-weight:800;cursor:pointer}.ctc-form button:disabled{opacity:.55;cursor:not-allowed}
          @media(max-width:620px){.ctc-overlay{padding:10px}.ctc-modal{width:calc(100vw - 20px);max-height:calc(100dvh - 20px);padding:17px;border-radius:16px}.ctc-head h2{font-size:21px}.ctc-message{max-width:92%}.ctc-form{grid-template-columns:1fr}.ctc-form button{min-height:44px}}
        `}</style>

        <div className="ctc-head">
          <div>
            <div className="eyebrow">BUSINESS PRO · VADOVŲ POKALBIS</div>
            <h2>{companyName || "Įmonės komanda"}</h2>
            <p>
              Vidinis pokalbis tik jūsų įmonės Savininkui, Vadovams ir
              Vadybininkams.
            </p>
          </div>

          <button
            className="ctc-close"
            type="button"
            disabled={sending}
            onClick={onClose}
            aria-label="Uždaryti"
          >
            <CloseMark />
          </button>
        </div>

        {error && <div className="ctc-error">{error}</div>}

        <ChatConductNotice />

        <div className="ctc-messages" ref={messagesRef}>
          {loading && !messages.length ? (
            <div className="ctc-empty"><SilentLoader size={18} minHeight={42} /></div>
          ) : messages.length ? (
            messages.map((message) => (
              <div
                className={
                  message.sender_id === user.id
                    ? "ctc-message mine"
                    : "ctc-message"
                }
                key={message.id}
              >
                <b>{message.sender_label || "Komandos narys"}</b>
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
            <div className="ctc-empty">
              Vadovų pokalbis dar tuščias. Parašykite pirmą žinutę.
            </div>
          )}
        </div>

        <form className="ctc-form" onSubmit={sendMessage}>
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
                if (!sending && textValue.trim()) {
                  sendMessage(e);
                }
              }
            }}
            maxLength={2000}
            placeholder="Žinutė įmonės komandai..."
          />
          <button disabled={sending || !textValue.trim()}>
            {sending ? "Siunčiama..." : "Siųsti"}
          </button>
        </form>
      </div>
    </div>
  );
}
