import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/config.js";
import { hireMessageCall, HIRE_MESSAGE_LIMIT } from "./hireMessages.js";

// A request ID is never an employer credential. The server authorizes every call.
export function HireMessages({ requestId, sessionToken, lang = "lt" }) {
  const lt = lang === "lt";
  const t = (a, b) => lt ? a : b;
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const pending = useRef(null);
  const sending = useRef(false);
  const generation = useRef(0);
  const refresh = useRef(() => {});

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
    const timer = setInterval(() => { if (!document.hidden) load(); }, 30000);
    return () => { active = false; generation.current += 1; clearInterval(timer); };
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

  return <section className="card" aria-label={t("Žinutės", "Messages")}>
    <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
      <h2>{t("Žinutės", "Messages")}</h2>
      <button className="btn sm" type="button" disabled={loading || busy} onClick={() => refresh.current()}>{t("Atnaujinti", "Refresh")}</button>
    </div>
    <p className="small muted">{requestId ? "Bendras susirašinėjimas su šia įmone dėl visų jos darbuotojų poreikių." : t("Bendras susirašinėjimas su Statybos24 dėl visų jūsų darbuotojų poreikių.", "Your conversation with Statybos24 for all your workforce needs.")}</p>
    {error ? <p className="ferr" role="alert">{error}</p> : null}
    {loading ? <p role="status">{t("Kraunama...", "Loading...")}</p> : !messages.length && !error ? <p className="small muted">{t("Žinučių dar nėra.", "No messages yet.")}</p> : null}
    <ol style={{ listStyle: "none", padding: 0, maxHeight: 360, overflowY: "auto" }}>
      {messages.map(message => <li key={message.id} style={{ borderBottom: "1px solid var(--line)", padding: "12px 0" }}>
        <b>{message.sender_kind === "admin" ? "Statybos24" : t("Įmonė", "Company")}</b>{" "}
        <time className="small muted" dateTime={message.created_at}>{new Date(message.created_at).toLocaleString(lt ? "lt-LT" : "en-GB")}</time>
        <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", margin: "6px 0" }}>{message.body}</p>
      </li>)}
    </ol>
    {messages.length >= 100 ? <p className="small muted">{t("Rodoma 100 naujausių žinučių.", "Showing the latest 100 messages.")}</p> : null}
    <form onSubmit={send}>
      <label className="field">{t("Jūsų žinutė", "Your message")}
        <textarea value={body} disabled={busy} maxLength={HIRE_MESSAGE_LIMIT} rows={3} onChange={event => { setBody(event.target.value); setSent(false); }} required />
      </label>
      <button className="btn primary" type="submit" disabled={busy || loading || !body.trim()}>{busy ? t("Siunčiama...", "Sending...") : t("Siųsti žinutę", "Send message")}</button>
      {sent ? <p role="status">{t("Žinutė išsiųsta.", "Message sent.")}</p> : null}
    </form>
  </section>;
}
