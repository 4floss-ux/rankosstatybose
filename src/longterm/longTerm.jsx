import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/config.js";
import { CloseMark, SilentLoader } from "../ui/brand.jsx";
import { ChatConductNotice } from "../ui/common.jsx";

export function longTermWeekdayLabel(day) {
  return ({
    1: "Pirmadienis",
    2: "Antradienis",
    3: "Trečiadienis",
    4: "Ketvirtadienis",
    5: "Penktadienis",
    6: "Šeštadienis",
    7: "Sekmadienis",
  })[Number(day)] || "Diena";
}

export function longTermContractLabel(value) {
  return value === "fixed_term" ? "Terminuota" : "Neterminuota";
}

export function longTermSalaryBasisLabel(value) {
  return value === "gross" ? "ant popieriaus" : "į rankas";
}

export function safeStorageFileName(name) {
  return String(name || "failas")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "failas";
}

export async function openEmploymentContract(storagePath) {
  if (!storagePath) return false;
  const result = await supabase.storage
    .from("employment-contracts")
    .createSignedUrl(storagePath, 60 * 10);
  if (result.error || !result.data?.signedUrl) {
    throw result.error || new Error("Nepavyko atidaryti sutarties.");
  }
  window.open(result.data.signedUrl, "_blank", "noopener,noreferrer");
  return true;
}

export function defaultLongTermSchedule() {
  return [1, 2, 3, 4, 5, 6, 7].map((weekday) => ({
    weekday,
    enabled: weekday <= 5,
    startTime: "08:00",
    endTime: "17:00",
    noBreak: false,
    breakStartTime: "12:00",
    breakEndTime: "12:30",
  }));
}

export function longTermStatusLabel(value) {
  return ({
    offered: "Pasiūlymas pateiktas",
    active: "Aktyvus įdarbinimas",
    declined: "Pasiūlymas atmestas",
    withdrawn: "Pasiūlymas atšauktas",
    ended: "Įdarbinimas pasibaigęs",
  })[value] || value || "Pasiūlymas";
}

export function longTermEmployerUpdateLabel(offer) {
  if (!offer) return "Pasiūlymas pateiktas";
  if (offer.status === "active") return "Darbuotojas priimtas";
  if (offer.worker_signed_contract_path) {
    return "Pasirašyta sutartis gauta · patvirtinkite įdarbinimą arba atšaukite pasiūlymą";
  }
  if (offer.worker_contract_viewed_at) return "Darbuotojas peržiūrėjo sutartį";
  if (offer.worker_viewed_at) return "Darbuotojas peržiūrėjo pasiūlymą";
  return "Pasiūlymas pateiktas";
}

export function longTermEmployerUpdateTone(offer) {
  if (!offer) return "muted";
  if (offer.status === "active" || offer.worker_signed_contract_path) return "success";
  if (offer.worker_contract_viewed_at) return "attention";
  return "muted";
}

export function longTermWorkerUpdateLabel(offer) {
  if (!offer) return "Darbdavys atsiuntė pasiūlymą";
  if (offer.status === "active") return "Darbdavys patvirtino įdarbinimą";
  if (offer.worker_signed_contract_path) {
    return "Pasirašyta sutartis įkelta · laukiamas sprendimas";
  }
  if (offer.worker_contract_viewed_at) return "Sutartis peržiūrėta";
  if (offer.worker_viewed_at) return "Pasiūlymas peržiūrėtas";
  return "Darbdavys atsiuntė pasiūlymą";
}

export function longTermWorkerUpdateTone(offer) {
  if (!offer) return "orange";
  if (offer.status === "active" || offer.worker_signed_contract_path) return "green";
  if (offer.worker_contract_viewed_at) return "green";
  if (offer.worker_viewed_at) return "muted";
  return "orange";
}

export function LongTermOfferDetails({ offer }) {
  if (!offer) return null;

  const schedule = Array.isArray(offer.schedule) ? offer.schedule : [];

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="lt-detail-grid">
        <div className="lt-detail-card">
          <span>Darbo pozicija</span>
          <b>{offer.position_title || "—"}</b>
        </div>
        <div className="lt-detail-card">
          <span>Sutartis</span>
          <b>{longTermContractLabel(offer.contract_type)}</b>
        </div>
        <div className="lt-detail-card">
          <span>Preliminari pradžia</span>
          <b>{offer.proposed_start_date || "—"}</b>
        </div>
        <div className="lt-detail-card">
          <span>Pabaiga</span>
          <b>
            {offer.contract_type === "fixed_term"
              ? offer.proposed_end_date || "—"
              : "Neterminuota"}
          </b>
        </div>
        <div className="lt-detail-card">
          <span>Darbo vieta</span>
          <b>{offer.workplace_city || "—"}</b>
          {offer.workplace_address && (
            <small>Atvykti adresu: {offer.workplace_address}</small>
          )}
        </div>
        <div className="lt-detail-card">
          <span>Siūlomas atlygis</span>
          <b>
            {offer.salary_amount
              ? `${offer.salary_amount} € ${longTermSalaryBasisLabel(
                  offer.salary_basis
                )} ${
                  offer.salary_period === "monthly" ? "/ mėn." : "/ val."
                }`
              : "Nenurodytas"}
          </b>
          {offer.salary_note && <small>{offer.salary_note}</small>}
        </div>
      </div>

      <div className="lt-detail-card">
        <span>Įdarbinimo informacija</span>
        <div style={{ marginTop: 5, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
          {offer.employment_details?.trim() ||
            "Darbdavys papildomos informacijos nepateikė."}
        </div>
      </div>

      <div className="lt-detail-card">
        <span>Siūlomas darbo grafikas</span>
        {offer.schedule_type === "variable" ? (
          <div style={{ marginTop: 6, lineHeight: 1.5 }}>
            Kintamas grafikas. Konkretų prieinamumą darbuotojas ir toliau valdo
            savo statybos24 grafike.
          </div>
        ) : schedule.length ? (
          <div className="lt-schedule-table">
            {schedule.map((row) => (
              <div className="lt-schedule-row" key={`${offer.id}-${row.weekday}`}>
                <b>{longTermWeekdayLabel(row.weekday)}</b>
                <span>
                  {String(row.start_time || "").slice(0, 5)}–
                  {String(row.end_time || "").slice(0, 5)}
                </span>
                <span>
                  {row.break_start_time && row.break_end_time
                    ? `Pietūs ${String(row.break_start_time).slice(0, 5)}–${String(
                        row.break_end_time
                      ).slice(0, 5)}`
                    : "Pietų pertraukos nėra"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ marginTop: 6 }}>Grafikas nenurodytas.</div>
        )}
      </div>
    </div>
  );
}

export function LongTermConversationModal({ open, onClose, placementId, title, user }) {
  const [messages, setMessages] = useState([]);
  const [textValue, setTextValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const messagesRef = useRef(null);
  const scrollOnLoadRef = useRef(true);

  useEffect(() => {
    if (!open || !placementId) return;
    scrollOnLoadRef.current = true;
    setMessages([]);
    loadMessages();
    const timer = window.setInterval(loadMessages, 3000);
    return () => window.clearInterval(timer);
  }, [open, placementId]);

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
    if (!placementId) return;
    setLoading(true);
    setError("");
    try {
      const result = await supabase.rpc("get_long_term_messages", {
        p_placement_id: placementId,
      });
      if (result.error) throw result.error;
      setMessages(result.data || []);
      const readResult = await supabase.rpc("mark_long_term_messages_read", {
        p_placement_id: placementId,
      });
      if (readResult.error) throw readResult.error;
    } catch (err) {
      setError(err?.message || "Nepavyko įkelti pokalbio.");
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(e) {
    e.preventDefault();
    const body = textValue.trim();
    if (!body || sending || !placementId) return;
    setSending(true);
    setError("");
    try {
      const result = await supabase.rpc("send_long_term_message", {
        p_placement_id: placementId,
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
      className="rs-modal-overlay lt-chat-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <style>{`
        .lt-chat-overlay{position:fixed;inset:0;z-index:2800;display:grid;place-items:center;padding:20px;background:rgba(16,36,56,.62);backdrop-filter:blur(2px)}
        .lt-chat-card{width:min(720px,calc(100vw - 40px));max-height:calc(100dvh - 40px);display:grid;grid-template-rows:auto minmax(180px,1fr) auto;overflow:hidden;background:#fff;border-radius:20px;box-shadow:0 28px 90px rgba(16,36,56,.3);color:#102438}
        .lt-chat-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:22px 22px 18px;border-bottom:1px solid #e8eef2}
        .lt-chat-head h2{margin:5px 0 0;font-size:24px;line-height:1.2}.lt-chat-head p{margin:6px 0 0;color:#6c7a88;font-size:13px;line-height:1.45}
        .lt-chat-close{border:0;background:#f2f5f7;color:#102438;border-radius:12px;width:42px;height:42px;display:grid;place-items:center;cursor:pointer;flex:0 0 42px}
        .lt-chat-body{overflow:auto;padding:18px 20px 20px;display:grid;gap:10px;align-content:start;background:#f5f8fa}
        .lt-chat-body .chat-conduct-inline{margin:0 0 4px}
        .lt-chat-empty{padding:18px;border:1px dashed #d7e0e7;border-radius:13px;background:#fff;color:#71808d;text-align:center;font-size:13px}
        .lt-chat-message{width:min(82%,560px);padding:10px 12px 11px;border:1px solid #dce5eb;border-radius:16px 16px 16px 6px;background:#fff;box-shadow:0 3px 10px rgba(16,36,56,.04)}
        .lt-chat-message.mine{justify-self:end;border-color:#f0cda9;background:#fff7ef;border-radius:16px 16px 6px 16px}.lt-chat-message-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:6px}.lt-chat-message-sender{display:flex;align-items:center;gap:7px;min-width:0}.lt-chat-message-sender b{font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.lt-chat-role{display:inline-flex;align-items:center;border-radius:999px;padding:3px 7px;background:#edf2f5;color:#607180;font-size:9px;font-weight:850;line-height:1}.lt-chat-message.mine .lt-chat-role{background:#ffe8d3;color:#a85a17}.lt-chat-message p{margin:0;color:#263b4d;line-height:1.5;white-space:pre-wrap;overflow-wrap:anywhere}.lt-chat-message time{flex:0 0 auto;color:#8a98a6;font-size:10px;white-space:nowrap}
        .lt-chat-error{margin:0 0 4px;background:#fff0ec;color:#b64d2a;border:1px solid #f0c7bc;border-radius:11px;padding:10px 12px;font-size:12px}
        .lt-chat-form{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;padding:14px 16px 16px;border-top:1px solid #e8eef2;background:#fff}
        .lt-chat-form textarea{width:100%;min-height:54px;max-height:130px;resize:vertical;border:1px solid #d7e0e7;border-radius:12px;padding:11px 12px;font:inherit;color:#102438;outline:none}.lt-chat-form textarea:focus{border-color:#f08a28;box-shadow:0 0 0 3px rgba(240,138,40,.12)}
        .lt-chat-form button{align-self:stretch;min-width:92px;border:0;background:#f08a28;color:#fff;border-radius:11px;padding:0 17px;font:inherit;font-weight:800;cursor:pointer}.lt-chat-form button:disabled{opacity:.45;cursor:not-allowed}
        @media(max-width:620px){.lt-chat-overlay{padding:10px}.lt-chat-card{width:calc(100vw - 20px);max-height:calc(100dvh - 20px);border-radius:16px}.lt-chat-head{padding:17px}.lt-chat-form{grid-template-columns:1fr}.lt-chat-form button{min-height:44px}.lt-chat-message{width:92%}}
      `}</style>
      <div className="lt-chat-card">
        <div className="lt-chat-head">
          <div>
            <div className="eyebrow">ILGALAIKIO DARBO POKALBIS</div>
            <h2>{title || "Aptarti pasiūlymą"}</h2>
            <p style={{ margin: "6px 0 0", color: "#6c7a88", fontSize: 13 }}>
              Čia galite aptarti ilgalaikio darbo sąlygas, sutartį ir kitus su įdarbinimu susijusius klausimus.
            </p>
          </div>
          <button className="lt-chat-close" type="button" onClick={onClose} aria-label="Uždaryti pokalbį">
            <CloseMark />
          </button>
        </div>

        <div className="lt-chat-body" ref={messagesRef}>
          {error && <div className="lt-chat-error">{error}</div>}
          <div className="chat-conduct-inline"><ChatConductNotice /></div>
          {loading && !messages.length ? (
            <div className="lt-chat-empty"><SilentLoader size={18} minHeight={42} /></div>
          ) : messages.length ? (
            messages.map((message) => {
              const mine = message.sender_id === user?.id;
              return (
                <div className={`lt-chat-message ${mine ? "mine" : ""}`} key={message.id}>
                  <div className="lt-chat-message-head">
                    <div className="lt-chat-message-sender">
                      <b>{message.sender_name || (mine ? "Jūs" : "Vartotojas")}</b>
                      <span className="lt-chat-role">
                        {message.sender_role === "worker"
                          ? "Darbuotojas"
                          : message.sender_role === "employer"
                            ? "Darbdavys"
                            : message.sender_role === "admin"
                              ? "Administratorius"
                              : "Pokalbis"}
                      </span>
                    </div>
                    <time>
                      {new Date(message.created_at).toLocaleString("lt-LT", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </time>
                  </div>
                  <p>{message.body}</p>
                </div>
              );
            })
          ) : (
            <div className="lt-chat-empty">Žinučių dar nėra. Galite pradėti aptarimą.</div>
          )}
        </div>

        <form className="lt-chat-form" onSubmit={sendMessage}>
          <textarea
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent?.isComposing) {
                e.preventDefault();
                if (!sending && textValue.trim()) sendMessage(e);
              }
            }}
            maxLength={2000}
            placeholder="Parašykite žinutę apie pasiūlymą..."
          />
          <button disabled={sending || !textValue.trim()}>
            {sending ? "Siunčiama..." : "Siųsti"}
          </button>
        </form>
      </div>
    </div>
  );
}
