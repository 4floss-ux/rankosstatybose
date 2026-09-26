import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import "./styles.css";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const workers = [
  { initials:"TK", name:"Tomas K.", status:"Laisvas rytoj", city:"Vilnius", skills:["Betonavimo pagalba","Medžiagų nešiojimas","Tvarkymas"], attendance:97, experience:2 },
  { initials:"MP", name:"Mantas P.", status:"Laisvas rytoj", city:"Vilnius", skills:["Medžiagų nešiojimas","Tvarkymas"], attendance:100, experience:1 },
  { initials:"DS", name:"Darius S.", status:"Laisvas šiandien", city:"Vilnius", skills:["Betonavimo pagalba","Krovos darbai"], attendance:94, experience:3 },
  { initials:"RK", name:"Rytis K.", status:"Laisvas rytoj", city:"Vilnius", skills:["Tvarkymas","Statybvietės pagalba"], attendance:92, experience:2 },
];

function Icon({children}) {
  return <span className="icon">{children}</span>;
}

function AuthModal({ open, onClose, initialMode="login", initialRole="worker" }) {
  const [mode, setMode] = useState(initialMode);
  const [role, setRole] = useState(initialRole);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    city: "Vilnius",
    phone: "",
    companyName: "",
    companyCode: "",
  });
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setRole(initialRole);
      setMessage("");
      setSuccess(false);
    }
  }, [open, initialMode, initialRole]);

  if (!open) return null;

  const setField = (key) => (e) =>
    setForm((current) => ({ ...current, [key]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setMessage("");
    setSuccess(false);

    if (!supabase) {
      setMessage("Trūksta Supabase nustatymų Cloudflare aplinkoje.");
      return;
    }

    if (!form.email.trim() || !form.password) {
      setMessage("Įveskite el. paštą ir slaptažodį.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email.trim(),
          password: form.password,
        });

        if (error) throw error;
        onClose();
      } else {
        if (!form.name.trim()) {
          throw new Error("Įveskite vardą.");
        }

        if (form.password.length < 8) {
          throw new Error("Slaptažodis turi būti bent 8 simbolių.");
        }

        if (role === "employer" && !form.companyName.trim()) {
          throw new Error("Įveskite įmonės pavadinimą.");
        }

        const { data, error } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              role,
              display_name: form.name.trim(),
              legal_name: form.name.trim(),
              city: form.city.trim(),
              phone: form.phone.trim(),
              company_name:
                role === "employer" ? form.companyName.trim() : "",
              company_code:
                role === "employer" ? form.companyCode.trim() : "",
            },
          },
        });

        if (error) throw error;

        if (data.session) {
          onClose();
        } else {
          setSuccess(true);
          setMessage(
            "Registracija sėkminga. Patikrinkite el. paštą ir patvirtinkite paskyrą."
          );
        }
      }
    } catch (error) {
      setMessage(error?.message || "Nepavyko. Bandykite dar kartą.");
    } finally {
      setLoading(false);
    }
  }

  const overlay = {
    position: "fixed",
    inset: 0,
    background: "rgba(16,36,56,.58)",
    zIndex: 1000,
    display: "grid",
    placeItems: "center",
    padding: 20,
  };

  const card = {
    width: "min(520px, 100%)",
    maxHeight: "calc(100vh - 40px)",
    overflowY: "auto",
    background: "#fff",
    borderRadius: 20,
    boxShadow: "0 24px 80px rgba(16,36,56,.24)",
    padding: 28,
  };

  const twoColumns = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  };

  const tabStyle = (active) => ({
    border: "1px solid #dfe7ed",
    borderRadius: 10,
    padding: "11px 12px",
    background: active ? "#102438" : "#fff",
    color: active ? "#fff" : "#102438",
    fontWeight: 700,
    cursor: "pointer",
  });

  const labelStyle = {
    display: "grid",
    gap: 6,
    fontSize: 14,
    fontWeight: 700,
  };

  const inputStyle = {
    width: "100%",
    border: "1px solid #dfe7ed",
    borderRadius: 10,
    padding: "12px 13px",
    font: "inherit",
    outline: "none",
  };

  return (
    <div
      style={overlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div style={card}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            alignItems: "flex-start",
            marginBottom: 20,
          }}
        >
          <div>
            <div className="eyebrow">
              {mode === "login" ? "PRISIJUNGIMAS" : "REGISTRACIJA"}
            </div>
            <h2 style={{ margin: "6px 0 0", fontSize: 30 }}>
              {mode === "login" ? "Sveiki sugrįžę" : "Sukurkite paskyrą"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Uždaryti"
            style={{
              border: 0,
              background: "#f3f6f8",
              borderRadius: 10,
              width: 38,
              height: 38,
              cursor: "pointer",
              fontSize: 20,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ ...twoColumns, marginBottom: 18 }}>
          <button
            type="button"
            style={tabStyle(mode === "login")}
            onClick={() => {
              setMode("login");
              setMessage("");
            }}
          >
            Prisijungti
          </button>
          <button
            type="button"
            style={tabStyle(mode === "signup")}
            onClick={() => {
              setMode("signup");
              setMessage("");
            }}
          >
            Registruotis
          </button>
        </div>

        {mode === "signup" && (
          <div style={{ ...twoColumns, marginBottom: 18 }}>
            <button
              type="button"
              style={tabStyle(role === "worker")}
              onClick={() => setRole("worker")}
            >
              Ieškau darbo
            </button>
            <button
              type="button"
              style={tabStyle(role === "employer")}
              onClick={() => setRole("employer")}
            >
              Ieškau darbuotojų
            </button>
          </div>
        )}

        <form onSubmit={submit} style={{ display: "grid", gap: 13 }}>
          {mode === "signup" && (
            <>
              <label style={labelStyle}>
                Vardas
                <input
                  style={inputStyle}
                  value={form.name}
                  onChange={setField("name")}
                  placeholder="Pvz. Tomas"
                  autoComplete="name"
                />
              </label>

              <div style={twoColumns}>
                <label style={labelStyle}>
                  Miestas
                  <input
                    style={inputStyle}
                    value={form.city}
                    onChange={setField("city")}
                    placeholder="Vilnius"
                  />
                </label>

                <label style={labelStyle}>
                  Telefonas
                  <input
                    style={inputStyle}
                    value={form.phone}
                    onChange={setField("phone")}
                    placeholder="+370..."
                    autoComplete="tel"
                  />
                </label>
              </div>

              {role === "employer" && (
                <div style={twoColumns}>
                  <label style={labelStyle}>
                    Įmonės pavadinimas
                    <input
                      style={inputStyle}
                      value={form.companyName}
                      onChange={setField("companyName")}
                      placeholder="UAB Statyba"
                    />
                  </label>

                  <label style={labelStyle}>
                    Įmonės kodas
                    <input
                      style={inputStyle}
                      value={form.companyCode}
                      onChange={setField("companyCode")}
                      placeholder="123456789"
                    />
                  </label>
                </div>
              )}
            </>
          )}

          <label style={labelStyle}>
            El. paštas
            <input
              style={inputStyle}
              type="email"
              value={form.email}
              onChange={setField("email")}
              placeholder="vardas@email.lt"
              autoComplete="email"
            />
          </label>

          <label style={labelStyle}>
            Slaptažodis
            <input
              style={inputStyle}
              type="password"
              value={form.password}
              onChange={setField("password")}
              placeholder={
                mode === "signup" ? "Bent 8 simboliai" : "Jūsų slaptažodis"
              }
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
            />
          </label>

          {message && (
            <div
              style={{
                padding: "11px 12px",
                borderRadius: 10,
                background: success ? "#edf8f3" : "#fff3ed",
                color: "#102438",
                fontSize: 14,
                lineHeight: 1.45,
              }}
            >
              {message}
            </div>
          )}

          <button
            className="btn primary"
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              justifyContent: "center",
              marginTop: 4,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading
              ? "Prašome palaukti..."
              : mode === "login"
              ? "Prisijungti"
              : "Sukurti paskyrą"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Header({ onLogin, onEmployerSignup, user, onLogout }) {
  return (
    <header className="header">
      <div className="container nav">
        <a className="brand" href="#">
          <span className="logo-mark">⌂</span>
          <span>
            rankos<span>statybose</span>.lt
          </span>
        </a>

        <nav className="navlinks">
          <a href="#kaip">Kaip tai veikia</a>
          <a href="#darbdaviams">Darbdaviams</a>
          <a href="#darbuotojams">Darbuotojams</a>
          <a href="#kainodara">Kainodara</a>
        </nav>

        <div className="nav-actions">
          {user ? (
            <button className="btn ghost" onClick={onLogout}>
              Atsijungti
            </button>
          ) : (
            <button className="btn ghost" onClick={onLogin}>
              Prisijungti
            </button>
          )}

          <button className="btn primary" onClick={onEmployerSignup}>
            Pateikti užklausą
          </button>
        </div>
      </div>
    </header>
  );
}

function SearchBox({ onEmployerSignup }) {
  return (
    <div className="searchbox">
      <div className="field">
        <label>Miestas</label>
        <div className="control">
          ⌖ Vilnius <span>⌄</span>
        </div>
      </div>
      <div className="field">
        <label>Data</label>
        <div className="control">
          ▣ Rytoj <span>⌄</span>
        </div>
      </div>
      <div className="field">
        <label>Kiek žmonių reikia?</label>
        <div className="control">
          ◉ 3 <span>⌄</span>
        </div>
      </div>
      <div className="field">
        <label>Atvykimas</label>
        <div className="control">
          ↗ Darbuotojas atvyksta pats <span>⌄</span>
        </div>
      </div>
      <div className="field">
        <label>Pradžios laikas</label>
        <div className="control">
          ◷ 08:00 <span>⌄</span>
        </div>
      </div>

      <button className="btn primary search-cta" onClick={onEmployerSignup}>
        Rasti darbuotojus →
      </button>

      <div className="availability">
        <span></span> Vilniuje rytoj laisvi <b>18 darbuotojų</b>
      </div>
    </div>
  );
}

function WorkersPanel({ onEmployerSignup }) {
  return (
    <div className="product-window">
      <div className="product-top">
        <div className="mini-brand">
          <span className="logo-mark small">⌂</span> rankosstatybose.lt
        </div>
        <div className="mini-actions">
          <span>⌕</span>
          <span>◉</span>
        </div>
      </div>

      <div className="app-shell">
        <aside className="sidebar">
          <div className="active">⌕ Darbuotojų paieška</div>
          <div>▤ Mano užklausos</div>
          <div>▦ Darbo skydelis</div>
          <div>
            ◉ Pranešimai <b>3</b>
          </div>
          <div>▣ Mokėjimai</div>
          <div>⚙ Nustatymai</div>
        </aside>

        <main className="app-main">
          <div className="app-title-row">
            <div>
              <h3>Galimi darbuotojai</h3>
              <p>Rasta 18 darbuotojų</p>
            </div>
            <button className="btn compact">Filtrai</button>
          </div>

          <div className="worker-list">
            {workers.map((w) => (
              <div className="worker-row" key={w.name}>
                <div className="avatar">{w.initials}</div>

                <div className="worker-main">
                  <div className="worker-name">
                    {w.name} <span className="status">{w.status}</span>
                  </div>
                  <div className="muted">{w.city}</div>
                  <div className="tags">
                    {w.skills.slice(0, 2).map((s) => (
                      <span key={s}>{s}</span>
                    ))}
                  </div>
                </div>

                <div className="metric">
                  <strong>{w.attendance}%</strong>
                  <span>atvykimas</span>
                </div>

                <div className="metric">
                  <strong>{w.experience} m.</strong>
                  <span>patirties</span>
                </div>

                <button
                  className="btn primary tiny"
                  onClick={onEmployerSignup}
                >
                  Kviesti
                </button>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}


function localDateISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function nextSevenDays() {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + i);
    return {
      iso: localDateISO(date),
      weekday: new Intl.DateTimeFormat("lt-LT", { weekday: "short" }).format(date),
      label: new Intl.DateTimeFormat("lt-LT", { day: "2-digit", month: "2-digit" }).format(date),
    };
  });
}

function formatNetPay(amount, unit) {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) return "Atlygis nenurodytas";
  const formatted = Number.isInteger(value)
    ? String(value)
    : value.toLocaleString("lt-LT", { maximumFractionDigits: 2 });
  return unit === "day"
    ? `${formatted} € į rankas / dieną`
    : `${formatted} € į rankas / val.`;
}

function formatWorkedMinutes(minutes) {
  const total = Math.max(0, Number(minutes) || 0);
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (!hours) return `${mins} min.`;
  if (!mins) return `${hours} val.`;
  return `${hours} val. ${mins} min.`;
}

function jobEndMoment(job) {
  if (!job?.work_date) return null;
  const end = (job.end_time || job.start_time || "23:59").slice(0, 5);
  const value = new Date(`${job.work_date}T${end}:00`);
  return Number.isNaN(value.getTime()) ? null : value;
}

function jobHasEnded(job) {
  const end = jobEndMoment(job);
  return end ? new Date() >= end : false;
}

function jobCheckInWindowOpen(job) {
  if (!job?.work_date || !job?.start_time) return false;

  const start = new Date(
    `${job.work_date}T${job.start_time.slice(0, 5)}:00`
  );
  if (Number.isNaN(start.getTime())) return false;

  const opens = new Date(start.getTime() - 2 * 60 * 60 * 1000);
  let end = job.end_time
    ? new Date(`${job.work_date}T${job.end_time.slice(0, 5)}:00`)
    : new Date(start.getTime() + 12 * 60 * 60 * 1000);

  if (job.end_time && end <= start) {
    end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
  }

  const now = new Date();
  return now >= opens && now <= end;
}

function attendanceOutcomeLabel(attendance) {
  const outcome = attendance?.final_outcome || attendance?.employer_outcome;
  if (outcome === "full_day") return "Išdirbo visą dieną";
  if (outcome === "left_early_agreed") return "Išėjo anksčiau – suderinta";
  if (outcome === "left_early_unexcused") return "Išėjo anksčiau be pateisinamos priežasties";
  if (outcome === "no_show") return "Neatvyko";
  return "Darbo diena neuždaryta";
}


function timeRangesOverlap(a, b) {
  if (!a || !b || a.work_date !== b.work_date) return false;
  const aStart = (a.start_time || "00:00").slice(0, 5);
  const aEnd = (a.end_time || "23:59").slice(0, 5);
  const bStart = (b.start_time || "00:00").slice(0, 5);
  const bEnd = (b.end_time || "23:59").slice(0, 5);
  return aStart < bEnd && aEnd > bStart;
}

function normalizeCityKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function distanceKmBetweenPoints(a, b) {
  if (!a || !b) return null;

  const lat1 = Number(a.latitude);
  const lon1 = Number(a.longitude);
  const lat2 = Number(b.latitude);
  const lon2 = Number(b.longitude);

  if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return null;

  const toRad = (degrees) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function notificationPresentation(events = []) {
  const types = events.map((event) => event.event_type);

  if (types.includes("invitation_declined")) {
    return { tone: "red", label: "⚑ Darbuotojas atsisakė" };
  }
  if (types.includes("invitation_cancelled")) {
    return { tone: "red", label: "⚑ Darbdavys atšaukė" };
  }
  if (types.includes("message")) {
    return { tone: "orange", label: "● Nauja žinutė" };
  }
  if (types.includes("job_updated")) {
    return { tone: "orange", label: "● Darbas atnaujintas" };
  }
  if (types.includes("invitation_accepted")) {
    return { tone: "green", label: "✓ Darbuotojas priėmė" };
  }
  if (types.includes("attendance_disputed")) {
    return { tone: "red", label: "⚑ Darbo dienos ginčas" };
  }
  if (types.includes("attendance_review_required")) {
    return { tone: "orange", label: "● Reikia patvirtinti darbo dieną" };
  }
  if (types.includes("attendance_action_required")) {
    return { tone: "orange", label: "● Reikia uždaryti darbo dieną" };
  }
  if (types.includes("worker_checked_in")) {
    return { tone: "green", label: "✓ Darbuotojas pažymėjo „Atvykau“" };
  }
  if (types.includes("employer_checked_in")) {
    return { tone: "green", label: "✓ Darbdavys patvirtino atvykimą" };
  }
  if (types.includes("attendance_finalized")) {
    return { tone: "green", label: "✓ Darbo diena uždaryta" };
  }
  if (types.includes("attendance_resolved")) {
    return { tone: "green", label: "✓ Ginčas išspręstas" };
  }
  if (types.includes("invitation_expired")) {
    return { tone: "muted", label: "Kvietimas nebegalioja" };
  }

  return { tone: "orange", label: "● Yra naujienų" };
}

function ConversationModal({ open, onClose, invitationId, title, user }) {
  const [messages, setMessages] = useState([]);
  const [names, setNames] = useState({});
  const [textValue, setTextValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [conversationLocked, setConversationLocked] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && invitationId) loadMessages();
  }, [open, invitationId]);

  async function loadMessages() {
    setLoading(true);
    setError("");
    try {
      const [result, invitationResult] = await Promise.all([
        supabase
          .from("job_messages")
          .select("id, sender_id, body, created_at")
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

      const jobResult = await supabase
        .from("jobs")
        .select("status, cancellation_reason")
        .eq("id", invitationResult.data.job_id)
        .single();

      if (jobResult.error) throw jobResult.error;

      setConversationLocked(jobResult.data?.status === "cancelled");
      setCancellationReason(jobResult.data?.cancellation_reason || "");

      const rows = result.data || [];
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
      const result = await supabase.from("job_messages").insert({
        invitation_id: invitationId,
        sender_id: user.id,
        body,
      });

      if (result.error) throw result.error;

      setTextValue("");
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
          .rs-modal-overlay{position:fixed;inset:0;background:rgba(16,36,56,.62);z-index:2000;display:grid;place-items:center;padding:20px}
          .rs-modal-card{width:min(620px,100%);max-height:calc(100vh - 40px);overflow:auto;background:#fff;border-radius:18px;box-shadow:0 26px 80px rgba(16,36,56,.25);padding:22px;color:#102438}
          .rs-modal-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:18px}
          .rs-modal-head h2{margin:0;font-size:22px}.rs-close{border:0;background:#f1f4f6;border-radius:9px;width:38px;height:38px;font-size:20px;cursor:pointer}
          .rs-messages{display:grid;gap:10px;max-height:360px;overflow:auto;padding:4px 2px 12px}
          .rs-message{max-width:82%;border-radius:12px;padding:10px 12px;background:#f2f5f7}
          .rs-message.mine{margin-left:auto;background:#fff3e7}
          .rs-message b{display:block;font-size:12px;margin-bottom:4px}.rs-message p{margin:0;white-space:pre-wrap;line-height:1.45}
          .rs-message time{display:block;margin-top:5px;font-size:11px;color:#7a8996}
          .rs-msg-form{display:grid;grid-template-columns:1fr auto;gap:8px;border-top:1px solid #e5ebef;padding-top:14px}
          .rs-msg-form textarea{min-height:48px;max-height:120px;resize:vertical;border:1px solid #dbe4ea;border-radius:10px;padding:11px;font:inherit}
          .rs-msg-form button{border:0;background:#f08a28;color:#fff;border-radius:10px;padding:0 16px;font:inherit;font-weight:800;cursor:pointer}
          .rs-msg-form button:disabled{opacity:.6}.rs-error{background:#fff0ec;color:#b64d2a;border-radius:9px;padding:10px;margin-bottom:10px;font-size:13px}
          .rs-empty{color:#6c7a88;text-align:center;padding:28px 10px}
          .rs-locked{background:#fff0ec;color:#9f4529;border-radius:10px;padding:11px 12px;margin:4px 0 12px;font-size:13px;line-height:1.45}
        `}</style>

        <div className="rs-modal-head">
          <div>
            <div className="eyebrow">ŽINUTĖS</div>
            <h2>{title || "Pokalbis apie darbą"}</h2>
          </div>
          <button className="rs-close" onClick={onClose}>×</button>
        </div>

        {error && <div className="rs-error">{error}</div>}

        <div className="rs-messages">
          {loading ? (
            <div className="rs-empty">Kraunama...</div>
          ) : messages.length ? (
            messages.map((message) => (
              <div
                className={message.sender_id === user.id ? "rs-message mine" : "rs-message"}
                key={message.id}
              >
                <b>{message.sender_id === user.id ? "Jūs" : names[message.sender_id] || "Vartotojas"}</b>
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
            <b>Šis darbas atšauktas — pokalbis uždarytas.</b>
            {cancellationReason && (
              <div style={{ marginTop: 4 }}>
                Atšaukimo priežastis: {cancellationReason}
              </div>
            )}
            <div style={{ marginTop: 4 }}>
              Ankstesnes žinutes galite perskaityti, tačiau naujų siųsti nebegalima.
            </div>
          </div>
        )}

        <form className="rs-msg-form" onSubmit={sendMessage}>
          <textarea
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
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


function GroupConversationModal({ open, onClose, jobId, title, user }) {
  const [messages, setMessages] = useState([]);
  const [names, setNames] = useState({});
  const [textValue, setTextValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [conversationLocked, setConversationLocked] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !jobId) return;

    loadMessages();
    const timer = setInterval(loadMessages, 3000);
    return () => clearInterval(timer);
  }, [open, jobId]);

  async function loadMessages() {
    if (!messages.length) setLoading(true);
    setError("");

    try {
      const [messagesResult, jobResult] = await Promise.all([
        supabase
          .from("job_group_messages")
          .select("id, sender_id, body, created_at")
          .eq("job_id", jobId)
          .order("created_at", { ascending: true }),
        supabase
          .from("jobs")
          .select("status, cancellation_reason")
          .eq("id", jobId)
          .single(),
      ]);

      if (messagesResult.error) throw messagesResult.error;
      if (jobResult.error) throw jobResult.error;

      setConversationLocked(jobResult.data?.status === "cancelled");
      setCancellationReason(jobResult.data?.cancellation_reason || "");

      const rows = messagesResult.data || [];
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
      const result = await supabase.from("job_group_messages").insert({
        job_id: jobId,
        sender_id: user.id,
        body,
      });

      if (result.error) throw result.error;

      setTextValue("");
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
      <div className="rs-modal-card">
        <style>{`
          .rs-modal-overlay{position:fixed;inset:0;background:rgba(16,36,56,.62);z-index:2000;display:grid;place-items:center;padding:20px}
          .rs-modal-card{width:min(620px,100%);max-height:calc(100vh - 40px);overflow:auto;background:#fff;border-radius:18px;box-shadow:0 26px 80px rgba(16,36,56,.25);padding:22px;color:#102438}
          .rs-modal-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:18px}
          .rs-modal-head h2{margin:0;font-family:Manrope,Inter,sans-serif;font-size:22px}
          .rs-close{border:0;background:#f1f4f6;border-radius:9px;width:38px;height:38px;font-size:20px;cursor:pointer}
          .rs-group-note{background:#edf8f3;color:#167a54;border-radius:10px;padding:10px 12px;margin-bottom:12px;font-size:13px;line-height:1.45}
          .rs-messages{display:grid;gap:10px;max-height:360px;overflow:auto;padding:4px 2px 12px}
          .rs-message{max-width:82%;border-radius:12px;padding:10px 12px;background:#f2f5f7}
          .rs-message.mine{margin-left:auto;background:#fff3e7}
          .rs-message b{display:block;font-size:12px;margin-bottom:4px}
          .rs-message p{margin:0;white-space:pre-wrap;line-height:1.45}
          .rs-message time{display:block;margin-top:5px;font-size:11px;color:#7a8996}
          .rs-msg-form{display:grid;grid-template-columns:1fr auto;gap:8px;border-top:1px solid #e5ebef;padding-top:14px}
          .rs-msg-form textarea{min-height:48px;max-height:120px;resize:vertical;border:1px solid #dbe4ea;border-radius:10px;padding:11px;font:inherit}
          .rs-msg-form button{border:0;background:#f08a28;color:#fff;border-radius:10px;padding:0 16px;font:inherit;font-weight:800;cursor:pointer}
          .rs-msg-form button:disabled{opacity:.6}
          .rs-error{background:#fff0ec;color:#b64d2a;border-radius:9px;padding:10px;margin-bottom:10px;font-size:13px}
          .rs-empty{color:#6c7a88;text-align:center;padding:28px 10px}
          .rs-locked{background:#fff0ec;color:#9f4529;border-radius:10px;padding:11px 12px;margin:4px 0 12px;font-size:13px;line-height:1.45}
        `}</style>

        <div className="rs-modal-head">
          <div>
            <div className="eyebrow">DARBO POKALBIS</div>
            <h2>{title || "Bendras darbo pokalbis"}</h2>
          </div>
          <button className="rs-close" onClick={onClose}>×</button>
        </div>

        <div className="rs-group-note">
          Šį pokalbį mato darbdavys ir visi šį darbą patvirtinę darbuotojai.
        </div>

        {error && <div className="rs-error">{error}</div>}

        <div className="rs-messages">
          {loading && !messages.length ? (
            <div className="rs-empty">Kraunama...</div>
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
                  {message.sender_id === user.id
                    ? "Jūs"
                    : names[message.sender_id] || "Vartotojas"}
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
            <b>Šis darbas atšauktas — darbo pokalbis uždarytas.</b>
            {cancellationReason && (
              <div style={{ marginTop: 4 }}>
                Atšaukimo priežastis: {cancellationReason}
              </div>
            )}
          </div>
        )}

        <form className="rs-msg-form" onSubmit={sendMessage}>
          <textarea
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
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

function WorkerProfileModal({ worker, onClose }) {
  if (!worker) return null;

  const stats = worker.publicStats || {};
  const monthMinutes = Number(stats.monthWorkedMinutes || 0);
  const ratingAverage =
    stats.ratingAverage ?? worker.ratingAverage ?? null;
  const ratingCount =
    Number(stats.ratingCount ?? worker.ratingCount ?? 0);
  const attendanceRate =
    Number(stats.attendanceRate ?? worker.attendanceRate ?? 100);
  const noShows =
    Number(stats.noShowCount ?? worker.noShowCount ?? 0);
  const earlyLeaves =
    Number(
      stats.unexcusedEarlyLeaveCount ??
        worker.unexcusedEarlyLeaveCount ??
        0
    );

  return (
    <div
      className="rs-modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="rs-modal-card">
        <style>{`
          .rs-modal-overlay{position:fixed;inset:0;background:rgba(16,36,56,.62);z-index:2000;display:grid;place-items:center;padding:20px}
          .rs-modal-card{width:min(700px,100%);max-height:calc(100vh - 40px);overflow:auto;background:#fff;border-radius:18px;box-shadow:0 26px 80px rgba(16,36,56,.25);padding:22px;color:#102438}
          .rs-modal-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:18px}
          .rs-modal-head h2{margin:0;font-family:Manrope,Inter,sans-serif;font-size:22px}.rs-close{border:0;background:#f1f4f6;border-radius:9px;width:38px;height:38px;font-size:20px;cursor:pointer}
          .rs-profile-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
          .rs-profile-stat{background:#f6f8fa;border:1px solid #e4ebf0;border-radius:12px;padding:13px}
          .rs-profile-stat span{display:block;font-size:11px;color:#6c7a88;margin-bottom:5px;line-height:1.3}.rs-profile-stat b{font-family:Manrope,Inter,sans-serif;font-size:18px}
          .rs-profile-section{margin-top:18px}.rs-profile-section> b{font-family:Manrope,Inter,sans-serif}
          @media(max-width:620px){.rs-profile-grid{grid-template-columns:repeat(2,1fr)}}
          @media(max-width:420px){.rs-profile-grid{grid-template-columns:1fr}}
        `}</style>

        <div className="rs-modal-head">
          <div style={{ display: "flex", gap: 13, alignItems: "center" }}>
            <div
              style={{
                width: 50,
                height: 50,
                borderRadius: "50%",
                background: "#102438",
                color: "#fff",
                display: "grid",
                placeItems: "center",
                fontWeight: 800,
              }}
            >
              {worker.initials}
            </div>
            <div>
              <div className="eyebrow">DARBUOTOJO PROFILIS</div>
              <h2>{worker.name}</h2>
            </div>
          </div>
          <button className="rs-close" onClick={onClose}>×</button>
        </div>

        <div className="rs-profile-grid">
          <div className="rs-profile-stat">
            <span>Miestas</span>
            <b>{worker.city || "—"}</b>
          </div>
          <div className="rs-profile-stat">
            <span>Patirtis</span>
            <b>{Number(worker.yearsExperience || 0)} m.</b>
          </div>
          <div className="rs-profile-stat">
            <span>Dirbta šį mėnesį</span>
            <b>{Number(stats.monthWorkedDays || 0)} d.</b>
          </div>
          <div className="rs-profile-stat">
            <span>Valandų šį mėnesį</span>
            <b>{formatWorkedMinutes(monthMinutes)}</b>
          </div>
          <div className="rs-profile-stat">
            <span>Darbų šį mėnesį</span>
            <b>{Number(stats.monthJobs || 0)}</b>
          </div>
          <div className="rs-profile-stat">
            <span>Aktyvūs darbai</span>
            <b>{Number(stats.activeJobs || 0)}</b>
          </div>
          <div className="rs-profile-stat">
            <span>Darbdavio atšaukti</span>
            <b>{Number(stats.cancelledByEmployer || 0)}</b>
          </div>
          <div className="rs-profile-stat">
            <span>Atvykimo patikimumas</span>
            <b>{Math.round(attendanceRate)}%</b>
          </div>
          <div className="rs-profile-stat">
            <span>Darbdavių įvertinimas</span>
            <b>
              {ratingAverage === null || ratingAverage === undefined
                ? "—"
                : `${Number(ratingAverage).toFixed(1)} / 5`}
            </b>
            <span style={{ marginTop: 4, marginBottom: 0 }}>
              {ratingCount ? `${ratingCount} vert.` : "Dar nėra vertinimų"}
            </span>
          </div>
          <div className="rs-profile-stat">
            <span>Neatvykimai</span>
            <b>{noShows}</b>
          </div>
          <div className="rs-profile-stat">
            <span>Nepagrįsti ankstyvi išėjimai</span>
            <b>{earlyLeaves}</b>
          </div>
        </div>

        {worker.hasDrivingLicenseB && (
          <div className="rs-profile-section">
            <b>Vairuotojo pažymėjimas</b>
            <p style={{ margin: "6px 0 0", color: "#6c7a88" }}>
              Turi B kategoriją
            </p>
          </div>
        )}

        {worker.shortBio && (
          <div className="rs-profile-section">
            <b>Apie patirtį</b>
            <p style={{ color: "#6c7a88", lineHeight: 1.55 }}>
              {worker.shortBio}
            </p>
          </div>
        )}

        {!!(worker.skillNames || []).length && (
          <div className="rs-profile-section">
            <b>Įgūdžiai</b>
            <div className="ed-tags" style={{ marginTop: 9 }}>
              {(worker.skillNames || []).map((skill) => (
                <span className="ed-tag" key={skill}>{skill}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function WorkerDashboard({ user, onLogout }) {
  const days = nextSevenDays();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [skills, setSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [originalSkills, setOriginalSkills] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [workerNotifications, setWorkerNotifications] = useState([]);
  const [confirmedJobs, setConfirmedJobs] = useState([]);
  const [respondingInvitation, setRespondingInvitation] = useState(null);
  const [confirmInvitation, setConfirmInvitation] = useState(null);
  const [commitmentChecked, setCommitmentChecked] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [groupConversation, setGroupConversation] = useState(null);
  const [workdays, setWorkdays] = useState([]);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [workerAttendanceTarget, setWorkerAttendanceTarget] = useState(null);
  const [workerAttendanceMode, setWorkerAttendanceMode] = useState(null);
  const [workerAttendanceNote, setWorkerAttendanceNote] = useState("");
  const [workerEvidenceFile, setWorkerEvidenceFile] = useState(null);
  const [arrivalHelpTarget, setArrivalHelpTarget] = useState(null);
  const [attendanceBusy, setAttendanceBusy] = useState(false);
  const [form, setForm] = useState({
    displayName: "",
    city: "Vilnius",
    phone: "",
    travelRadius: 30,
    hasDrivingLicenseB: false,
    yearsExperience: 0,
    shortBio: "",
  });
  const [metrics, setMetrics] = useState({
    attendanceRate: 100,
    completedJobs: 0,
    ratingAverage: null,
    ratingCount: 0,
    noShowCount: 0,
    restrictedUntil: null,
  });
  const [workerStats, setWorkerStats] = useState({
    monthWorkedDays: 0,
    monthWorkedMinutes: 0,
    monthJobs: 0,
    activeJobs: 0,
    cancelledByEmployer: 0,
    unexcusedEarlyLeaveCount: 0,
  });
  const [availability, setAvailability] = useState(() =>
    Object.fromEntries(
      days.map((day) => [
        day.iso,
        { available: false, from: "08:00", to: "17:00" },
      ])
    )
  );

  useEffect(() => {
    loadDashboard();
  }, [user.id]);

  useEffect(() => {
    const timer = setInterval(() => {
      Promise.all([loadInvitations(), loadWorkerStats()]).catch(() => {
        // Periodinis atnaujinimas neturi trukdyti pagrindiniam darbui.
      });
    }, 5000);

    return () => clearInterval(timer);
  }, [user.id]);

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const start = days[0].iso;
      const end = days[days.length - 1].iso;

      const [
        profileResult,
        privateResult,
        workerResult,
        skillsResult,
        workerSkillsResult,
        availabilityResult,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("display_name, city")
          .eq("id", user.id)
          .single(),
        supabase
          .from("user_private")
          .select("phone")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("worker_profiles")
          .select(
            "travel_radius_km, has_driving_license_b, years_experience, short_bio, attendance_rate, completed_jobs, rating_average, rating_count, no_show_count, restricted_until"
          )
          .eq("user_id", user.id)
          .single(),
        supabase
          .from("skills")
          .select("id, name")
          .eq("is_active", true)
          .order("name"),
        supabase
          .from("worker_skills")
          .select("skill_id")
          .eq("worker_id", user.id),
        supabase
          .from("availability")
          .select("available_date, status, available_from, available_to")
          .eq("worker_id", user.id)
          .gte("available_date", start)
          .lte("available_date", end),
      ]);

      const failed = [
        profileResult,
        privateResult,
        workerResult,
        skillsResult,
        workerSkillsResult,
        availabilityResult,
      ].find((result) => result.error);

      if (failed?.error) throw failed.error;

      const profile = profileResult.data;
      const privateData = privateResult.data;
      const worker = workerResult.data;

      setForm({
        displayName: profile?.display_name || "",
        city: profile?.city || "Vilnius",
        phone: privateData?.phone || "",
        travelRadius: worker?.travel_radius_km ?? 30,
        hasDrivingLicenseB: Boolean(worker?.has_driving_license_b),
        yearsExperience: worker?.years_experience ?? 0,
        shortBio: worker?.short_bio || "",
      });

      setMetrics({
        attendanceRate: Number(worker?.attendance_rate ?? 100),
        completedJobs: Number(worker?.completed_jobs ?? 0),
        ratingAverage:
          worker?.rating_average === null || worker?.rating_average === undefined
            ? null
            : Number(worker.rating_average),
        ratingCount: Number(worker?.rating_count || 0),
        noShowCount: Number(worker?.no_show_count || 0),
        restrictedUntil: worker?.restricted_until || null,
      });

      setSkills(skillsResult.data || []);

      const selected = (workerSkillsResult.data || []).map((row) =>
        Number(row.skill_id)
      );
      setSelectedSkills(selected);
      setOriginalSkills(selected);

      const storedAvailability = Object.fromEntries(
        (availabilityResult.data || []).map((row) => [
          row.available_date,
          {
            available: row.status === "available",
            from: row.available_from?.slice(0, 5) || "08:00",
            to: row.available_to?.slice(0, 5) || "17:00",
          },
        ])
      );

      setAvailability(
        Object.fromEntries(
          days.map((day) => [
            day.iso,
            storedAvailability[day.iso] || {
              available: false,
              from: "08:00",
              to: "17:00",
            },
          ])
        )
      );

      await Promise.all([loadInvitations(), loadWorkerStats()]);
    } catch (err) {
      setError(err?.message || "Nepavyko įkelti profilio.");
    } finally {
      setLoading(false);
    }
  }

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleSkill(skillId) {
    setSelectedSkills((current) =>
      current.includes(skillId)
        ? current.filter((id) => id !== skillId)
        : [...current, skillId]
    );
  }

  function updateAvailability(date, patch) {
    setAvailability((current) => ({
      ...current,
      [date]: { ...current[date], ...patch },
    }));
  }

  async function loadWorkerStats() {
    const [statsResult, workerResult] = await Promise.all([
      supabase.rpc("get_worker_public_stats", { p_worker_id: user.id }),
      supabase
        .from("worker_profiles")
        .select(
          "attendance_rate, rating_average, rating_count, no_show_count, restricted_until, completed_jobs, unexcused_early_leave_count"
        )
        .eq("user_id", user.id)
        .single(),
    ]);

    if (statsResult.error) throw statsResult.error;
    if (workerResult.error) throw workerResult.error;

    const stats = statsResult.data?.[0] || {};
    const worker = workerResult.data || {};

    setWorkerStats({
      monthWorkedDays: Number(stats.month_worked_days || 0),
      monthWorkedMinutes: Number(stats.month_worked_minutes || 0),
      monthJobs: Number(stats.month_jobs || 0),
      activeJobs: Number(stats.active_jobs || 0),
      cancelledByEmployer: Number(stats.cancelled_by_employer || 0),
      unexcusedEarlyLeaveCount: Number(
        stats.unexcused_early_leave_count ||
          worker.unexcused_early_leave_count ||
          0
      ),
    });

    setMetrics((current) => ({
      ...current,
      attendanceRate: Number(
        stats.attendance_rate ?? worker.attendance_rate ?? current.attendanceRate ?? 100
      ),
      completedJobs: Number(worker.completed_jobs || 0),
      ratingAverage:
        stats.rating_average === null || stats.rating_average === undefined
          ? worker.rating_average === null || worker.rating_average === undefined
            ? null
            : Number(worker.rating_average)
          : Number(stats.rating_average),
      ratingCount: Number(stats.rating_count ?? worker.rating_count ?? 0),
      noShowCount: Number(stats.no_show_count ?? worker.no_show_count ?? 0),
      restrictedUntil: worker.restricted_until || null,
    }));
  }

  async function loadInvitations() {
    const [invitationResult, bookingResult, notificationResult] = await Promise.all([
      supabase
        .from("job_invitations")
        .select("id, job_id, status, message, invited_at, responded_at")
        .eq("worker_id", user.id)
        .order("invited_at", { ascending: false }),
      supabase
        .from("bookings")
        .select("id, job_id, invitation_id, status, confirmed_at, cancelled_at, cancellation_reason")
        .eq("worker_id", user.id)
        .order("confirmed_at", { ascending: false }),
      supabase
        .from("job_notifications")
        .select("id, job_id, invitation_id, event_type, created_at, read_at")
        .is("read_at", null)
        .order("created_at", { ascending: false }),
    ]);

    if (invitationResult.error) throw invitationResult.error;
    if (bookingResult.error) throw bookingResult.error;
    if (notificationResult.error) throw notificationResult.error;

    setWorkerNotifications(notificationResult.data || []);

    const invitationRows = invitationResult.data || [];
    const bookingRows = bookingResult.data || [];
    const allJobIds = [
      ...new Set([
        ...invitationRows.map((row) => row.job_id),
        ...bookingRows.map((row) => row.job_id),
      ].filter(Boolean)),
    ];

    if (!allJobIds.length) {
      setInvitations([]);
      setConfirmedJobs([]);
      setWorkdays([]);
      return;
    }

    const jobsResult = await supabase
      .from("jobs")
      .select(
        "id, title, city, address_text, work_date, start_time, end_time, break_start_time, break_end_time, description, pay_amount, pay_unit, company_id, status, transport_mode, cancellation_reason, cancelled_at"
      )
      .in("id", allJobIds);

    if (jobsResult.error) throw jobsResult.error;

    const companyIds = [
      ...new Set((jobsResult.data || []).map((job) => job.company_id).filter(Boolean)),
    ];

    let companies = [];
    if (companyIds.length) {
      const companiesResult = await supabase
        .from("companies")
        .select("id, name, reliability_rate, cancelled_confirmed_count")
        .in("id", companyIds);

      if (companiesResult.error) throw companiesResult.error;
      companies = companiesResult.data || [];
    }

    let attendanceRows = [];
    const bookingIds = bookingRows.map((row) => row.id);
    if (bookingIds.length) {
      const attendanceResult = await supabase
        .from("attendance")
        .select(
          "id, booking_id, status, worker_check_in_at, employer_check_in_at, worker_workday_claim, worker_claimed_at, employer_outcome, employer_marked_at, actual_end_time, employer_note, worker_response, worker_response_note, worker_responded_at, dispute_status, final_outcome, finalized_at, worked_minutes, resolution_note, worker_evidence_path, worker_evidence_name"
        )
        .in("booking_id", bookingIds);

      if (attendanceResult.error) throw attendanceResult.error;
      attendanceRows = attendanceResult.data || [];
    }

    const jobMap = new Map((jobsResult.data || []).map((job) => [job.id, job]));
    const companyMap = new Map(companies.map((company) => [company.id, company]));
    const attendanceMap = new Map(
      attendanceRows.map((row) => [row.booking_id, row])
    );

    setInvitations(
      invitationRows.map((invitation) => {
        const job = jobMap.get(invitation.job_id);
        const company = job ? companyMap.get(job.company_id) : null;
        return {
          ...invitation,
          job,
          companyName: company?.name || "Darbdavys",
          companyReliability: Number(company?.reliability_rate ?? 100),
          companyCancelledConfirmed: Number(company?.cancelled_confirmed_count ?? 0),
        };
      })
    );

    setConfirmedJobs(
      bookingRows
        .filter((booking) => booking.status === "confirmed")
        .map((booking) => jobMap.get(booking.job_id))
        .filter(Boolean)
    );

    setWorkdays(
      bookingRows
        .map((booking) => {
          const job = jobMap.get(booking.job_id);
          const company = job ? companyMap.get(job.company_id) : null;
          return {
            ...booking,
            job,
            companyName: company?.name || "Darbdavys",
            attendance: attendanceMap.get(booking.id) || null,
          };
        })
        .filter((item) => item.job)
        .sort((a, b) =>
          String(b.job.work_date || "").localeCompare(String(a.job.work_date || ""))
        )
    );
  }

  function unreadWorkerNotifications(invitationId) {
    return workerNotifications.filter(
      (item) => item.invitation_id === invitationId
    );
  }

  function unreadWorkerJobNotifications(jobId) {
    return workerNotifications.filter(
      (item) => item.job_id === jobId && !item.invitation_id
    );
  }

  async function markWorkerJobNotificationsRead(jobId) {
    const ids = unreadWorkerJobNotifications(jobId).map((item) => item.id);
    if (!ids.length) return;

    const result = await supabase
      .from("job_notifications")
      .update({ read_at: new Date().toISOString() })
      .in("id", ids);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    setWorkerNotifications((current) =>
      current.filter((item) => !ids.includes(item.id))
    );
  }

  async function openWorkerGroupConversation(job) {
    await markWorkerJobNotificationsRead(job.id);
    setGroupConversation({
      jobId: job.id,
      title: job.title,
    });
  }

  async function markWorkerNotificationsRead(invitationId) {
    const ids = unreadWorkerNotifications(invitationId).map((item) => item.id);
    if (!ids.length) return;

    const result = await supabase
      .from("job_notifications")
      .update({ read_at: new Date().toISOString() })
      .in("id", ids);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    setWorkerNotifications((current) =>
      current.filter((item) => !ids.includes(item.id))
    );
  }

  function invitationHasConflict(invitation) {
    if (!invitation?.job) return false;
    return confirmedJobs.some(
      (job) =>
        job.id !== invitation.job.id &&
        timeRangesOverlap(invitation.job, job)
    );
  }

  async function respondToInvitation(invitationId, status) {
    setRespondingInvitation(invitationId);
    setNotice("");
    setError("");

    try {
      const result = await supabase
        .from("job_invitations")
        .update({
          status,
          responded_at: new Date().toISOString(),
        })
        .eq("id", invitationId)
        .eq("worker_id", user.id)
        .eq("status", "pending")
        .select("id")
        .maybeSingle();

      if (result.error) throw result.error;

      if (!result.data) {
        throw new Error("Šis kvietimas jau buvo atsakytas arba nebegalioja.");
      }

      await Promise.all([loadInvitations(), loadWorkerStats()]);
      setConfirmInvitation(null);
      setCommitmentChecked(false);

      setNotice(
        status === "accepted"
          ? "Darbo kvietimas priimtas. Darbas patvirtintas."
          : "Darbo kvietimas atmestas."
      );
    } catch (err) {
      setError(err?.message || "Nepavyko atsakyti į kvietimą.");
    } finally {
      setRespondingInvitation(null);
    }
  }

  async function workerCheckIn(bookingId) {
    setAttendanceBusy(true);
    setNotice("");
    setError("");
    try {
      const result = await supabase.rpc("worker_check_in", {
        p_booking_id: bookingId,
      });
      if (result.error) throw result.error;
      setNotice("Atvykimas pažymėtas. Darbdavys matys, kad atvykote.");
      await Promise.all([loadInvitations(), loadWorkerStats()]);
    } catch (err) {
      setError(err?.message || "Nepavyko pažymėti atvykimo.");
    } finally {
      setAttendanceBusy(false);
    }
  }

  async function copyPhoneNumber(phone) {
    if (!phone) return;
    try {
      await navigator.clipboard.writeText(phone);
      setNotice(`Telefono numeris nukopijuotas: ${phone}`);
    } catch (err) {
      setError("Nepavyko nukopijuoti telefono numerio.");
    }
  }

  async function openArrivalHelp(item) {
    setError("");

    try {
      const result = await supabase.rpc("get_job_contact", {
        p_job_id: item.job.id,
      });

      if (result.error) throw result.error;

      const contact = result.data?.[0] || {};

      setArrivalHelpTarget({
        ...item,
        companyName: contact.company_name || item.companyName,
        companyPhone: contact.phone || "",
      });
    } catch (err) {
      setArrivalHelpTarget({
        ...item,
        companyPhone: "",
      });
      setError(err?.message || "Nepavyko įkelti darbdavio kontaktų.");
    }
  }

  async function workerClaimWorkday(bookingId, claim) {
    setAttendanceBusy(true);
    setNotice("");
    setError("");
    try {
      const result = await supabase.rpc("worker_claim_workday", {
        p_booking_id: bookingId,
        p_claim: claim,
      });
      if (result.error) throw result.error;

      setNotice(
        claim === "worked"
          ? "Pažymėjote, kad dirbote. Laukiama darbdavio darbo dienos uždarymo."
          : "Neatvykimas patvirtintas. Pritaikytas darbuotojo patikimumo poveikis."
      );

      setWorkerAttendanceTarget(null);
      setWorkerAttendanceMode(null);
      setWorkerAttendanceNote("");
      setWorkerEvidenceFile(null);
      await Promise.all([loadInvitations(), loadWorkerStats()]);
    } catch (err) {
      setError(err?.message || "Nepavyko užbaigti darbo dienos.");
    } finally {
      setAttendanceBusy(false);
    }
  }

  async function workerRespondAttendance(attendanceId, response, note = "") {
    setAttendanceBusy(true);
    setNotice("");
    setError("");

    let uploadedPath = null;

    try {
      if (response === "disputed" && workerEvidenceFile) {
        const allowedTypes = [
          "image/jpeg",
          "image/png",
          "image/webp",
          "application/pdf",
        ];

        if (!allowedTypes.includes(workerEvidenceFile.type)) {
          throw new Error(
            "Įrodymui galima įkelti JPG, PNG, WEBP nuotrauką arba PDF dokumentą."
          );
        }

        if (workerEvidenceFile.size > 8 * 1024 * 1024) {
          throw new Error("Įrodymo failas negali būti didesnis nei 8 MB.");
        }

        const safeName = workerEvidenceFile.name
          .replace(/[^a-zA-Z0-9._-]+/g, "-")
          .slice(-100);

        uploadedPath = `${user.id}/${attendanceId}/${Date.now()}-${safeName}`;

        const uploadResult = await supabase.storage
          .from("attendance-evidence")
          .upload(uploadedPath, workerEvidenceFile, {
            cacheControl: "3600",
            upsert: false,
            contentType: workerEvidenceFile.type,
          });

        if (uploadResult.error) throw uploadResult.error;
      }

      const result = await supabase.rpc("worker_respond_attendance", {
        p_attendance_id: attendanceId,
        p_response: response,
        p_note: note || null,
        p_evidence_path: uploadedPath,
        p_evidence_name:
          response === "disputed" && workerEvidenceFile
            ? workerEvidenceFile.name
            : null,
      });

      if (result.error) throw result.error;

      setNotice(
        response === "disputed"
          ? "Ginčas pateiktas. Kol jis neišspręstas, jūsų reitingas nekeičiamas."
          : "Darbo dienos rezultatas patvirtintas."
      );

      setWorkerAttendanceTarget(null);
      setWorkerAttendanceMode(null);
      setWorkerAttendanceNote("");
      setWorkerEvidenceFile(null);

      await Promise.all([loadInvitations(), loadWorkerStats()]);
    } catch (err) {
      if (uploadedPath) {
        await supabase.storage
          .from("attendance-evidence")
          .remove([uploadedPath])
          .catch(() => {});
      }

      setError(err?.message || "Nepavyko pateikti atsakymo.");
    } finally {
      setAttendanceBusy(false);
    }
  }

  async function saveEverything() {
    setSaving(true);
    setNotice("");
    setError("");

    try {
      const profileUpdate = await supabase
        .from("profiles")
        .update({
          display_name: form.displayName.trim(),
          city: form.city.trim(),
        })
        .eq("id", user.id);

      if (profileUpdate.error) throw profileUpdate.error;

      const privateUpdate = await supabase
        .from("user_private")
        .update({ phone: form.phone.trim() || null })
        .eq("user_id", user.id);

      if (privateUpdate.error) throw privateUpdate.error;

      const workerUpdate = await supabase
        .from("worker_profiles")
        .update({
          travel_radius_km: Number(form.travelRadius),
          has_driving_license_b: form.hasDrivingLicenseB,
          years_experience: Number(form.yearsExperience) || 0,
          short_bio: form.shortBio.trim() || null,
        })
        .eq("user_id", user.id);

      if (workerUpdate.error) throw workerUpdate.error;

      const selectedSet = new Set(selectedSkills);
      const originalSet = new Set(originalSkills);
      const toAdd = selectedSkills.filter((id) => !originalSet.has(id));
      const toDelete = originalSkills.filter((id) => !selectedSet.has(id));

      if (toDelete.length) {
        const deleteResult = await supabase
          .from("worker_skills")
          .delete()
          .eq("worker_id", user.id)
          .in("skill_id", toDelete);

        if (deleteResult.error) throw deleteResult.error;
      }

      if (toAdd.length) {
        const insertResult = await supabase.from("worker_skills").insert(
          toAdd.map((skillId) => ({
            worker_id: user.id,
            skill_id: skillId,
            years_experience: 0,
          }))
        );

        if (insertResult.error) throw insertResult.error;
      }

      const availabilityRows = days.map((day) => {
        const state = availability[day.iso];
        return {
          worker_id: user.id,
          available_date: day.iso,
          status: state.available ? "available" : "unavailable",
          available_from: state.available ? state.from : null,
          available_to: state.available ? state.to : null,
        };
      });

      const availabilityResult = await supabase
        .from("availability")
        .upsert(availabilityRows, { onConflict: "worker_id,available_date" });

      if (availabilityResult.error) throw availabilityResult.error;

      setOriginalSkills([...selectedSkills]);
      setNotice("Visi profilio duomenys išsaugoti.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err?.message || "Nepavyko išsaugoti duomenų.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  }

  const initials = (form.displayName || user.email || "D")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const availableCount = Object.values(availability).filter(
    (item) => item.available
  ).length;

  if (loading) {
    return (
      <div className="wd-loading">
        <div className="wd-spinner" />
        <b>Kraunamas darbuotojo profilis...</b>
      </div>
    );
  }

  return (
    <div className="wd-page">
      <style>{`
        .wd-page{min-height:100vh;background:#f6f8fa;color:#102438}
        .wd-topbar{height:72px;background:#fff;border-bottom:1px solid #e4ebf0;display:flex;align-items:center;position:sticky;top:0;z-index:30}
        .wd-topbar-inner{width:min(1060px,calc(100% - 40px));margin:auto;display:flex;align-items:center;justify-content:space-between;gap:24px}
        .wd-shell{width:min(1060px,calc(100% - 40px));margin:32px auto 70px}
        .wd-heading{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-bottom:20px}
        .wd-heading h1{margin:3px 0 0;font-size:34px;letter-spacing:-.035em}
        .wd-heading p{margin:8px 0 0;color:#6c7a88;max-width:650px}
        .wd-user{display:flex;align-items:center;gap:11px}
        .wd-avatar{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;background:#102438;color:#fff;font-weight:800}
        .wd-user b{display:block}.wd-user span{font-size:13px;color:#6c7a88}
        .wd-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:20px}
        .wd-kpi{background:#fff;border:1px solid #e4ebf0;border-radius:14px;padding:18px;display:flex;flex-direction:column;justify-content:space-between;min-height:104px}
        .wd-kpi span{display:block;font-size:13px;color:#6c7a88;line-height:1.35;min-height:36px}.wd-kpi b{font-size:25px;line-height:1;margin-top:10px}
        .wd-form{display:grid;gap:18px}
        .wd-card{background:#fff;border:1px solid #e4ebf0;border-radius:16px;box-shadow:0 8px 28px rgba(16,36,56,.045);padding:24px}
        .wd-card h2{margin:0 0 6px;font-size:22px}.wd-card-sub{margin:0 0 22px;color:#6c7a88}
        .wd-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
        .wd-label{display:grid;gap:7px;font-size:13px;font-weight:700;color:#263b4d}
        .wd-input,.wd-textarea{width:100%;border:1px solid #dbe4ea;border-radius:10px;padding:12px 13px;background:#fff;color:#102438;font:inherit;outline:none}
        .wd-input:focus,.wd-textarea:focus{border-color:#f08a28;box-shadow:0 0 0 3px rgba(240,138,40,.10)}
        .wd-textarea{min-height:92px;resize:vertical}
        .wd-checks{display:flex;gap:18px;flex-wrap:wrap;margin-top:18px}.wd-check{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:700}
        .wd-skills{display:flex;gap:8px;flex-wrap:wrap}.wd-skill{border:1px solid #dfe7ed;background:#fff;color:#425466;border-radius:999px;padding:8px 11px;font:inherit;font-size:13px;font-weight:700;cursor:pointer}
        .wd-skill.on{background:#102438;color:#fff;border-color:#102438}
        .wd-invites{display:grid;gap:12px}.wd-invite{border:1px solid #e4ebf0;border-radius:14px;padding:18px;display:grid;grid-template-columns:1fr auto;gap:18px;align-items:center}
        .wd-invite-main h3{margin:0 0 5px;font-size:18px}.wd-invite-meta{color:#6c7a88;font-size:14px;line-height:1.55}.wd-invite-company{font-weight:800;color:#102438}
        .wd-pay{display:inline-block;margin-top:10px;background:#fff3e7;color:#b85f0e;border-radius:9px;padding:8px 10px;font-weight:800}
        .wd-invite-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.wd-accept,.wd-decline{border-radius:9px;padding:10px 13px;font:inherit;font-weight:800;cursor:pointer}
        .wd-accept{border:0;background:#1c9b67;color:#fff}.wd-decline{border:1px solid #dbe4ea;background:#fff;color:#102438}.wd-accept:disabled,.wd-decline:disabled{opacity:.55;cursor:wait}
        .wd-invite-status{font-size:13px;font-weight:800;border-radius:999px;padding:7px 10px;width:max-content}.wd-invite-status.accepted{background:#edf8f3;color:#167a54}.wd-invite-status.declined{background:#f2f4f6;color:#667788}.wd-invite-status.pending{background:#fff3e7;color:#b85f0e}
        .wd-heading-actions{display:grid;justify-items:end;gap:10px}.wd-edit-profile{border:1px solid #dbe4ea;background:#fff;color:#102438;border-radius:10px;padding:10px 13px;font:inherit;font-size:13px;font-weight:800;cursor:pointer}
        .wd-workdays{display:grid;gap:10px}.wd-workday{border:1px solid #e4ebf0;border-radius:14px;padding:16px;display:grid;grid-template-columns:1fr auto;gap:16px;align-items:center}.wd-workday h3{margin:0 0 5px;font-size:18px}.wd-workday-meta{color:#6c7a88;font-size:13px;line-height:1.55}.wd-workday-actions{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}.wd-workday-status{display:inline-flex;border-radius:999px;padding:6px 9px;font-size:12px;font-weight:800;margin-top:8px}.wd-workday-status.orange{background:#fff3e7;color:#b85f0e}.wd-workday-status.green{background:#edf8f3;color:#167a54}.wd-workday-status.red{background:#fff0ec;color:#b64d2a}.wd-workday-status.muted{background:#f1f4f6;color:#667788}
        .wd-danger{border:1px solid #efc7bc;background:#fff;color:#b64d2a;border-radius:9px;padding:10px 13px;font:inherit;font-weight:800;cursor:pointer}.wd-danger:disabled{opacity:.55;cursor:wait}
        .rs-alert{display:inline-flex;align-items:center;gap:5px;border-radius:999px;padding:6px 9px;font-size:12px;font-weight:800;margin-bottom:9px;width:max-content}
        .rs-alert.red{background:#fff0ec;color:#b64d2a}.rs-alert.orange{background:#fff3e7;color:#b85f0e}.rs-alert.green{background:#edf8f3;color:#167a54}.rs-alert.muted{background:#f1f4f6;color:#667788}
        .rs-modal-overlay{position:fixed;inset:0;background:rgba(16,36,56,.62);z-index:2000;display:grid;place-items:center;padding:20px}
        .rs-modal-card{width:min(640px,100%);max-height:calc(100vh - 40px);overflow:auto;background:#fff;border-radius:18px;box-shadow:0 26px 80px rgba(16,36,56,.25);padding:22px;color:#102438}
        .rs-modal-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:18px}.rs-modal-head h2{margin:0;font-family:Manrope,Inter,sans-serif;font-size:22px}.rs-close{border:0;background:#f1f4f6;border-radius:9px;width:38px;height:38px;font-size:20px;cursor:pointer}
        .ed-attendance-panel{margin-bottom:22px;padding:18px;border:1px solid #e4ebf0;border-radius:14px;background:#f8fafb}.ed-attendance-panel h2{margin:0 0 4px}.ed-attendance-list{display:grid;gap:9px;margin-top:14px}.ed-attendance-row{display:grid;grid-template-columns:minmax(190px,1.2fr) minmax(220px,1.35fr) auto;gap:14px;align-items:center;background:#fff;border:1px solid #e4ebf0;border-radius:12px;padding:13px}.ed-attendance-meta{font-size:12px;color:#6c7a88;line-height:1.5}.ed-attendance-actions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;align-items:center}.ed-attendance-badge{display:inline-flex;align-items:center;border-radius:999px;padding:4px 7px;font-size:10.5px;font-weight:800;margin-top:0}.ed-attendance-badge.green{background:#edf8f3;color:#167a54}.ed-attendance-badge.orange{background:#fff3e7;color:#b85f0e}.ed-attendance-badge.red{background:#fff0ec;color:#b64d2a}.ed-attendance-badge.muted{background:#f1f4f6;color:#667788}
        .rs-alert-read{border:0;background:transparent;color:#6c7a88;text-decoration:underline;font:inherit;font-size:12px;font-weight:700;cursor:pointer;padding:0}
        .rs-modal-overlay{position:fixed;inset:0;background:rgba(16,36,56,.62);z-index:2000;display:grid;place-items:center;padding:20px}
        .rs-modal-card{width:min(620px,100%);max-height:calc(100vh - 40px);overflow:auto;background:#fff;border-radius:18px;box-shadow:0 26px 80px rgba(16,36,56,.25);padding:22px;color:#102438}
        .rs-modal-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:18px}.rs-modal-head h2{margin:0;font-family:Manrope,Inter,sans-serif;font-size:22px}.rs-close{border:0;background:#f1f4f6;border-radius:9px;width:38px;height:38px;font-size:20px;cursor:pointer}
        .wd-days{display:grid;gap:10px}.wd-day{display:grid;grid-template-columns:135px 1fr 110px 110px;align-items:center;gap:14px;border:1px solid #e4ebf0;border-radius:12px;padding:14px}
        .wd-day-date b{display:block;text-transform:capitalize}.wd-day-date span{font-size:13px;color:#6c7a88}
        .wd-toggle{display:flex;align-items:center;gap:9px;font-weight:700}.wd-toggle input{width:18px;height:18px;accent-color:#1c9b67}
        .wd-time{width:100%;border:1px solid #dbe4ea;border-radius:9px;padding:9px 10px;font:inherit}.wd-time:disabled{background:#f4f6f8;color:#a0aab3}
        .wd-bottom{position:sticky;bottom:16px;z-index:20;display:flex;justify-content:flex-end}
        .wd-save{border:0;border-radius:12px;background:#f08a28;color:#fff;padding:14px 24px;font:inherit;font-weight:800;cursor:pointer;box-shadow:0 10px 25px rgba(240,138,40,.24)}
        .wd-save:disabled{opacity:.6;cursor:wait}
        .wd-note{border-radius:10px;padding:11px 13px;font-size:14px;font-weight:700;margin-bottom:18px}.wd-note.ok{background:#edf8f3;color:#167a54}.wd-note.err{background:#fff0ec;color:#b64d2a}
        .wd-loading{min-height:100vh;display:grid;place-items:center;align-content:center;gap:12px;background:#f6f8fa;color:#102438}
        .wd-spinner{width:28px;height:28px;border:3px solid #dfe7ed;border-top-color:#f08a28;border-radius:50%;animation:wdspin .8s linear infinite}
        @keyframes wdspin{to{transform:rotate(360deg)}}
        @media(max-width:760px){
          .wd-topbar-inner,.wd-shell{width:min(100% - 24px,1060px)}
          .wd-heading{align-items:flex-start;flex-direction:column}
          .wd-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}
          .wd-grid-2{grid-template-columns:1fr}
          .wd-day{grid-template-columns:1fr 1fr}
          .wd-day-date{grid-column:1/-1}
          .wd-invite{grid-template-columns:1fr}.wd-invite-actions{justify-content:flex-start}
          .wd-workday{grid-template-columns:1fr}.wd-workday-actions{justify-content:flex-start}
          .wd-heading-actions{justify-items:start}
          .wd-bottom{bottom:10px}
          .wd-save{width:100%}
        }
      `}</style>

      <header className="wd-topbar">
        <div className="wd-topbar-inner">
          <a className="brand" href="#">
            <span className="logo-mark">⌂</span>
            <span>
              rankos<span>statybose</span>.lt
            </span>
          </a>
          <button className="btn ghost" onClick={onLogout}>
            Atsijungti
          </button>
        </div>
      </header>

      <main className="wd-shell">
        <div className="wd-heading">
          <div>
            <div className="eyebrow">DARBUOTOJO PASKYRA</div>
            <h1>Mano darbai ir statistika</h1>
            <p>
              Čia matote aktyvius darbus, neuždarytas darbo dienas ir savo
              patikimumo statistiką.
            </p>
          </div>

          <div className="wd-heading-actions">
            <div className="wd-user">
              <div className="wd-avatar">{initials || "D"}</div>
              <div>
                <b>{form.displayName || "Darbuotojas"}</b>
                <span>{form.city || "Miestas nenurodytas"}</span>
              </div>
            </div>

            <button
              className="wd-edit-profile"
              type="button"
              onClick={() => setShowProfileEditor((current) => !current)}
            >
              {showProfileEditor ? "Uždaryti informaciją" : "Tvarkyti mano informaciją"}
            </button>
          </div>
        </div>

        <section>
          <div style={{ marginBottom: 10 }}>
            <div className="eyebrow">MANO STATISTIKA</div>
          </div>

          <div className="wd-kpis">
            <div className="wd-kpi">
              <span>Dirbta šį mėnesį</span>
              <b>{workerStats.monthWorkedDays} d.</b>
            </div>
            <div className="wd-kpi">
              <span>Valandų šį mėnesį</span>
              <b>{formatWorkedMinutes(workerStats.monthWorkedMinutes)}</b>
            </div>
            <div className="wd-kpi">
              <span>Darbų šį mėnesį</span>
              <b>{workerStats.monthJobs}</b>
            </div>
            <div className="wd-kpi">
              <span>Aktyvūs darbai</span>
              <b>{workerStats.activeJobs}</b>
            </div>
            <div className="wd-kpi">
              <span>Darbdavio atšaukti</span>
              <b>{workerStats.cancelledByEmployer}</b>
            </div>
            <div className="wd-kpi">
              <span>Atvykimo patikimumas</span>
              <b>{Math.round(metrics.attendanceRate)}%</b>
            </div>
            <div className="wd-kpi">
              <span>Darbdavių įvertinimas</span>
              <b>
                {metrics.ratingAverage === null
                  ? "—"
                  : `${metrics.ratingAverage.toFixed(1)} / 5`}
              </b>
              <small style={{ display: "block", marginTop: 5, color: "#8a98a6" }}>
                {metrics.ratingCount
                  ? `${metrics.ratingCount} vertinimai`
                  : "Dar nėra vertinimų"}
              </small>
            </div>
            <div className="wd-kpi">
              <span>Nepagrįsti ankstyvi išėjimai</span>
              <b>{workerStats.unexcusedEarlyLeaveCount}</b>
            </div>
          </div>
        </section>

        {notice && <div className="wd-note ok">{notice}</div>}
        {error && <div className="wd-note err">{error}</div>}
        {metrics.restrictedUntil &&
          new Date(metrics.restrictedUntil) > new Date() && (
            <div className="wd-note err">
              Paskyrai taikomas laikinas apribojimas: naujų darbų priimti negalite iki{" "}
              {new Date(metrics.restrictedUntil).toLocaleString("lt-LT", {
                dateStyle: "short",
                timeStyle: "short",
              })}.
            </div>
          )}

        <div className="wd-form">
          <section className="wd-card">
            <h2>Mano darbo dienos</h2>
            <p className="wd-card-sub">
              Pasibaigus darbo laikui darbo dieną turi uždaryti bent viena pusė.
              Jei rezultatai nesutampa, reitingas nekeičiamas iki ginčo išsprendimo.
            </p>

            {workdays.length ? (
              <div className="wd-workdays">
                {workdays.map((item) => {
                  const job = item.job;
                  const attendance = item.attendance || {};
                  const ended = jobHasEnded(job);
                  const checkInOpen = jobCheckInWindowOpen(job);
                  const isConfirmed = item.status === "confirmed";
                  const pendingNegative =
                    !attendance.finalized_at &&
                    ["no_show", "left_early_agreed", "left_early_unexcused"].includes(
                      attendance.employer_outcome
                    );
                  const disputed =
                    attendance.dispute_status === "disputed";
                  const canCheckIn =
                    isConfirmed &&
                    checkInOpen &&
                    !attendance.worker_check_in_at;
                  const needsClose =
                    isConfirmed &&
                    ended &&
                    !attendance.finalized_at &&
                    !pendingNegative;
                  const recentOrActive =
                    isConfirmed ||
                    item.status === "completed" ||
                    item.status === "no_show" ||
                    item.status === "cancelled_by_employer";

                  if (!recentOrActive) return null;

                  return (
                    <div className="wd-workday" key={item.id}>
                      <div>
                        <h3>{job.title}</h3>
                        <div className="wd-workday-meta">
                          <div><b>{item.companyName}</b></div>
                          <div>
                            {job.work_date} · {job.start_time?.slice(0, 5)}
                            {job.end_time ? `–${job.end_time.slice(0, 5)}` : ""}
                          </div>
                          {job.break_start_time && job.break_end_time && (
                            <div>
                              Pietų pertrauka:{" "}
                              <b>
                                {job.break_start_time.slice(0, 5)}–
                                {job.break_end_time.slice(0, 5)}
                              </b>
                            </div>
                          )}
                          <div>
                            {job.city}
                            {job.address_text ? ` · ${job.address_text}` : ""}
                          </div>
                        </div>

                        {item.status === "cancelled_by_employer" && (
                          <span className="wd-workday-status red">
                            Darbdavys atšaukė darbą
                          </span>
                        )}

                        {unreadWorkerJobNotifications(job.id).length > 0 && (
                          <span className="wd-workday-status orange">
                            ● Nauja žinutė darbo pokalbyje
                          </span>
                        )}

                        {attendance.finalized_at && (
                          <span
                            className={`wd-workday-status ${
                              attendance.final_outcome === "no_show" ||
                              attendance.final_outcome === "left_early_unexcused"
                                ? "red"
                                : "green"
                            }`}
                          >
                            {attendanceOutcomeLabel(attendance)}
                            {attendance.worked_minutes > 0
                              ? ` · ${formatWorkedMinutes(attendance.worked_minutes)}`
                              : ""}
                          </span>
                        )}

                        {!attendance.finalized_at && disputed && (
                          <span className="wd-workday-status red">
                            Ginčas pateiktas · reitingas nekeičiamas
                          </span>
                        )}

                        {!attendance.finalized_at &&
                          pendingNegative &&
                          !disputed && (
                            <div style={{ marginTop: 10 }}>
                              <span className="wd-workday-status orange">
                                Darbdavys pažymėjo: {attendanceOutcomeLabel(attendance)}
                              </span>
                              {attendance.employer_note && (
                                <div
                                  style={{
                                    marginTop: 7,
                                    color: "#6c7a88",
                                    fontSize: 13,
                                  }}
                                >
                                  Darbdavio paaiškinimas: {attendance.employer_note}
                                </div>
                              )}
                              {attendance.worker_check_in_at && (
                                <div
                                  style={{
                                    marginTop: 7,
                                    color: "#167a54",
                                    fontSize: 13,
                                    fontWeight: 700,
                                  }}
                                >
                                  Sistema turi jūsų „Atvykau“ pažymėjimą.
                                </div>
                              )}
                            </div>
                          )}

                        {needsClose &&
                          attendance.worker_workday_claim === "worked" && (
                            <span className="wd-workday-status orange">
                              Pažymėjote, kad dirbote · laukiama darbdavio patvirtinimo
                            </span>
                          )}

                        {needsClose &&
                          attendance.worker_workday_claim !== "worked" && (
                            <span className="wd-workday-status orange">
                              Neuždaryta darbo diena · reikia veiksmo
                            </span>
                          )}

                        {canCheckIn && (
                          <span className="wd-workday-status muted">
                            Darbo diena vyksta
                          </span>
                        )}

                        {attendance.worker_check_in_at &&
                          !attendance.finalized_at &&
                          !pendingNegative && (
                            <div
                              style={{
                                marginTop: 7,
                                color: "#167a54",
                                fontSize: 13,
                                fontWeight: 700,
                              }}
                            >
                              ✓ Atvykimą pažymėjote{" "}
                              {new Date(attendance.worker_check_in_at).toLocaleTimeString(
                                "lt-LT",
                                { hour: "2-digit", minute: "2-digit" }
                              )}
                            </div>
                          )}
                        {attendance.employer_check_in_at &&
                          !attendance.finalized_at && (
                            <div
                              style={{
                                marginTop: 7,
                                color: "#167a54",
                                fontSize: 13,
                                fontWeight: 700,
                              }}
                            >
                              ✓ Darbdavys patvirtino jūsų atvykimą{" "}
                              {new Date(
                                attendance.employer_check_in_at
                              ).toLocaleTimeString("lt-LT", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          )}
                      </div>

                      <div className="wd-workday-actions">
                        {canCheckIn && (
                          <>
                            <button
                              className="wd-accept"
                              disabled={attendanceBusy}
                              onClick={() => workerCheckIn(item.id)}
                            >
                              Atvykau
                            </button>
                            <button
                              className="wd-decline"
                              type="button"
                              onClick={() => openArrivalHelp(item)}
                            >
                              Atvykau, bet nerandu
                            </button>
                            <button
                              className="wd-decline"
                              type="button"
                              onClick={() => openWorkerGroupConversation(job)}
                            >
                              Darbo pokalbis
                            </button>
                          </>
                        )}

                        {!canCheckIn &&
                          ["confirmed", "completed", "no_show"].includes(
                            item.status
                          ) && (
                            <button
                              className="wd-decline"
                              type="button"
                              onClick={() => openWorkerGroupConversation(job)}
                            >
                              Darbo pokalbis
                            </button>
                          )}

                        {pendingNegative && !disputed && (
                          <>
                            <button
                              className="wd-accept"
                              disabled={attendanceBusy}
                              onClick={() =>
                                workerRespondAttendance(
                                  attendance.id,
                                  "confirmed"
                                )
                              }
                            >
                              Patvirtinti
                            </button>
                            <button
                              className="wd-danger"
                              disabled={attendanceBusy}
                              onClick={() => {
                                setWorkerAttendanceTarget(item);
                                setWorkerAttendanceMode("dispute");
                                setWorkerAttendanceNote("");
                                setWorkerEvidenceFile(null);
                              }}
                            >
                              Ginčyti
                            </button>
                          </>
                        )}

                        {disputed && attendance.id && (
                          <button
                            className="wd-decline"
                            disabled={attendanceBusy}
                            onClick={() => {
                              setWorkerAttendanceTarget(item);
                              setWorkerAttendanceMode("dispute");
                              setWorkerAttendanceNote(
                                attendance.worker_response_note?.startsWith(
                                  "Automatinis ginčas:"
                                )
                                  ? ""
                                  : attendance.worker_response_note || ""
                              );
                              setWorkerEvidenceFile(null);
                            }}
                          >
                            Papildyti ginčą
                          </button>
                        )}

                        {needsClose &&
                          attendance.worker_workday_claim !== "worked" && (
                            <>
                              <button
                                className="wd-accept"
                                disabled={attendanceBusy}
                                onClick={() =>
                                  workerClaimWorkday(item.id, "worked")
                                }
                              >
                                Dirbau šiame darbe
                              </button>
                              <button
                                className="wd-danger"
                                disabled={attendanceBusy}
                                onClick={() => {
                                  setWorkerAttendanceTarget(item);
                                  setWorkerAttendanceMode("self_no_show");
                                  setWorkerAttendanceNote("");
                                  setWorkerEvidenceFile(null);
                                }}
                              >
                                Neatvykau
                              </button>
                            </>
                          )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ color: "#6c7a88" }}>
                Patvirtintų darbo dienų kol kas nėra.
              </div>
            )}
          </section>

          <section className="wd-card">
            <h2>Darbo kvietimai</h2>
            <p className="wd-card-sub">
              Čia matote darbdavių pasiūlymus. Atlygis visada rodomas prieš priimant darbą.
            </p>

            {invitations.length ? (
              <div className="wd-invites">
                {invitations.map((invitation) => {
                  const job = invitation.job;
                  if (!job) return null;

                  const busy = respondingInvitation === invitation.id;
                  const unreadNews = unreadWorkerNotifications(invitation.id);
                  const unreadPresentation = notificationPresentation(unreadNews);
                  const statusLabel =
                    invitation.status === "accepted"
                      ? "Priimta"
                      : invitation.status === "declined"
                      ? "Atmesta"
                      : invitation.status === "cancelled"
                      ? "Atšaukta"
                      : invitation.status === "expired"
                      ? "Nebegalioja"
                      : "Laukia atsakymo";

                  return (
                    <div className="wd-invite" key={invitation.id}>
                      <div className="wd-invite-main">
                        {unreadNews.length > 0 && (
                          <div>
                            <span className={`rs-alert ${unreadPresentation.tone}`}>
                              {unreadPresentation.label}
                              {unreadNews.length > 1 ? ` · ${unreadNews.length}` : ""}
                            </span>
                            <div>
                              <button
                                className="rs-alert-read"
                                onClick={() => markWorkerNotificationsRead(invitation.id)}
                              >
                                Pažymėti perskaityta
                              </button>
                            </div>
                          </div>
                        )}
                        <h3>{job.title}</h3>
                        <div className="wd-invite-meta">
                          <div className="wd-invite-company">{invitation.companyName}</div>
                          <div>
                            Darbdavio patikimumas:{" "}
                            <b>{Math.round(invitation.companyReliability)}%</b>
                            {invitation.companyCancelledConfirmed > 0
                              ? ` · atšauktų patvirtintų darbų: ${invitation.companyCancelledConfirmed}`
                              : ""}
                          </div>
                          <div>
                            {job.city}
                            {job.address_text ? ` · ${job.address_text}` : ""}
                          </div>
                          <div>
                            {job.work_date} · {job.start_time?.slice(0, 5)}
                            {job.end_time ? `–${job.end_time.slice(0, 5)}` : ""}
                          </div>
                          {job.break_start_time && job.break_end_time && (
                            <div>
                              Pietų pertrauka:{" "}
                              <b>
                                {job.break_start_time.slice(0, 5)}–
                                {job.break_end_time.slice(0, 5)}
                              </b>
                            </div>
                          )}
                          <div>
                            Atvykimas:{" "}
                            <b>
                              {job.transport_mode === "employer_pickup"
                                ? "darbdavys paima darbuotoją"
                                : "darbuotojas atvyksta pats"}
                            </b>
                          </div>
                          {job.description && <div>{job.description}</div>}
                        </div>

                        <div className="wd-pay">
                          {formatNetPay(job.pay_amount, job.pay_unit)}
                        </div>

                        {job.status === "cancelled" && (
                          <div
                            className="wd-note err"
                            style={{ marginTop: 12 }}
                          >
                            <b>Darbdavys atšaukė šį darbą.</b>
                            <div style={{ marginTop: 4 }}>
                              Priežastis:{" "}
                              {job.cancellation_reason || "Priežastis nenurodyta."}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="wd-invite-actions">
                        {invitation.status === "pending" ? (
                          <>
                            <button
                              className="wd-accept"
                              disabled={
                                busy ||
                                invitationHasConflict(invitation) ||
                                (metrics.restrictedUntil &&
                                  new Date(metrics.restrictedUntil) > new Date())
                              }
                              onClick={() => {
                                setCommitmentChecked(false);
                                setConfirmInvitation(invitation);
                              }}
                            >
                              {busy
                                ? "Prašome..."
                                : invitationHasConflict(invitation)
                                ? "Laikas užimtas"
                                : "Priimti"}
                            </button>
                            <button
                              className="wd-decline"
                              disabled={busy}
                              onClick={() =>
                                respondToInvitation(invitation.id, "declined")
                              }
                            >
                              Atmesti
                            </button>
                          </>
                        ) : (
                          <span className={`wd-invite-status ${invitation.status}`}>
                            {statusLabel}
                          </span>
                        )}

                        <button
                          className="wd-decline"
                          onClick={async () => {
                            await markWorkerNotificationsRead(invitation.id);
                            setConversation({
                              invitationId: invitation.id,
                              title: `${invitation.companyName} · ${job.title}`,
                            });
                          }}
                        >
                          Žinutės
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ color: "#6c7a88" }}>
                Šiuo metu naujų darbo kvietimų nėra.
              </div>
            )}
          </section>

          {showProfileEditor && (
            <>
          <section className="wd-card">
            <h2>1. Pagrindinė informacija</h2>
            <p className="wd-card-sub">
              Nuotraukos nereikia — darbdaviai matys inicialus ir darbo informaciją.
            </p>

            <div className="wd-grid-2">
              <label className="wd-label">
                Vardas
                <input
                  className="wd-input"
                  value={form.displayName}
                  onChange={(e) => updateField("displayName", e.target.value)}
                />
              </label>

              <label className="wd-label">
                Miestas
                <input
                  className="wd-input"
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                />
              </label>

              <label className="wd-label">
                Telefonas
                <input
                  className="wd-input"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="+370..."
                />
              </label>

              <label className="wd-label">
                Kiek km galite nuvykti?
                <input
                  className="wd-input"
                  type="number"
                  min="0"
                  max="300"
                  value={form.travelRadius}
                  onChange={(e) => updateField("travelRadius", e.target.value)}
                />
              </label>

              <label className="wd-label">
                Patirtis statybose (metais)
                <input
                  className="wd-input"
                  type="number"
                  min="0"
                  step="0.5"
                  value={form.yearsExperience}
                  onChange={(e) => updateField("yearsExperience", e.target.value)}
                />
              </label>
            </div>

            <div className="wd-checks">
              <label className="wd-check">
                <input
                  type="checkbox"
                  checked={form.hasDrivingLicenseB}
                  onChange={(e) =>
                    updateField("hasDrivingLicenseB", e.target.checked)
                  }
                />
                Turiu B kategoriją
              </label>
            </div>

            <label className="wd-label" style={{ marginTop: 18 }}>
              Trumpai apie patirtį
              <textarea
                className="wd-textarea"
                value={form.shortBio}
                onChange={(e) => updateField("shortBio", e.target.value)}
                placeholder="Pvz. 2 metus dirbau statybų pagalbiniu, moku naudotis pagrindiniais elektriniais įrankiais."
              />
            </label>
          </section>

          <section className="wd-card">
            <h2>2. Kokius darbus mokate?</h2>
            <p className="wd-card-sub">
              Pasirinkite visus darbus, kuriuos galite atlikti arba kuriuose galite padėti.
            </p>

            <div className="wd-skills">
              {skills.map((skill) => (
                <button
                  type="button"
                  key={skill.id}
                  className={
                    selectedSkills.includes(Number(skill.id))
                      ? "wd-skill on"
                      : "wd-skill"
                  }
                  onClick={() => toggleSkill(Number(skill.id))}
                >
                  {skill.name}
                </button>
              ))}
            </div>
          </section>

          <section className="wd-card">
            <h2>3. Kada galite dirbti?</h2>
            <p className="wd-card-sub">
              Pažymėkite artimiausias dienas, kuriomis realiai galite priimti darbo pasiūlymą.
            </p>

            <div className="wd-days">
              {days.map((day) => {
                const state = availability[day.iso];
                return (
                  <div className="wd-day" key={day.iso}>
                    <div className="wd-day-date">
                      <b>{day.weekday}</b>
                      <span>{day.label}</span>
                    </div>

                    <label className="wd-toggle">
                      <input
                        type="checkbox"
                        checked={state.available}
                        onChange={(e) =>
                          updateAvailability(day.iso, {
                            available: e.target.checked,
                          })
                        }
                      />
                      {state.available ? "Laisvas" : "Užimtas"}
                    </label>

                    <input
                      className="wd-time"
                      type="time"
                      disabled={!state.available}
                      value={state.from}
                      onChange={(e) =>
                        updateAvailability(day.iso, { from: e.target.value })
                      }
                    />

                    <input
                      className="wd-time"
                      type="time"
                      disabled={!state.available}
                      value={state.to}
                      onChange={(e) =>
                        updateAvailability(day.iso, { to: e.target.value })
                      }
                    />
                  </div>
                );
              })}
            </div>
          </section>

          <div className="wd-bottom">
            <button
              className="wd-save"
              disabled={saving}
              onClick={saveEverything}
            >
              {saving ? "Saugoma..." : "Išsaugoti viską"}
            </button>
          </div>
            </>
          )}
        </div>
      </main>

      {arrivalHelpTarget && (
        <div
          className="rs-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setArrivalHelpTarget(null);
            }
          }}
        >
          <div className="rs-modal-card">
            <div className="rs-modal-head">
              <div>
                <div className="eyebrow">PAGALBA ATVYKUS</div>
                <h2>Atvykau, bet nerandu darbdavio</h2>
              </div>
              <button
                className="rs-close"
                onClick={() => setArrivalHelpTarget(null)}
              >
                ×
              </button>
            </div>

            <div
              style={{
                background: "#f6f8fa",
                borderRadius: 12,
                padding: 14,
                marginBottom: 16,
              }}
            >
              <b>{arrivalHelpTarget.companyName}</b>
              <div style={{ color: "#6c7a88", marginTop: 4 }}>
                {arrivalHelpTarget.job?.title} · {arrivalHelpTarget.job?.work_date}
              </div>
              <div style={{ color: "#6c7a88", marginTop: 4 }}>
                {arrivalHelpTarget.job?.address_text || "Adresas nenurodytas"}
              </div>
            </div>

            <div className="wd-note ok" style={{ marginBottom: 16 }}>
              Jei jau esate vietoje, pirmiausia parašykite žinutę darbdaviui.
              Jei reikia, galite nukopijuoti jo telefono numerį ir susisiekti tiesiogiai.
            </div>

            <div style={{ display: "grid", gap: 12, marginBottom: 18 }}>
              <button
                className="wd-accept"
                type="button"
                onClick={() => {
                  setArrivalHelpTarget(null);
                  setConversation({
                    invitationId: arrivalHelpTarget.invitation_id,
                    title: `${arrivalHelpTarget.companyName} · ${arrivalHelpTarget.job?.title}`,
                  });
                }}
              >
                Rašyti žinutę darbdaviui
              </button>

              {arrivalHelpTarget.companyPhone ? (
                <div
                  style={{
                    border: "1px solid #dbe4ea",
                    borderRadius: 12,
                    padding: 14,
                    background: "#fff",
                  }}
                >
                  <div style={{ color: "#6c7a88", fontSize: 13, marginBottom: 6 }}>
                    Darbdavio telefono numeris
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <b style={{ fontSize: 18 }}>{arrivalHelpTarget.companyPhone}</b>
                    <button
                      className="wd-decline"
                      type="button"
                      onClick={() => copyPhoneNumber(arrivalHelpTarget.companyPhone)}
                    >
                      Kopijuoti numerį
                    </button>
                  </div>
                </div>
              ) : (
                <div className="wd-note err" style={{ marginBottom: 0 }}>
                  Šiuo metu darbdavio telefono numeris nenurodytas. Parašykite jam žinutę platformoje.
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                className="wd-decline"
                type="button"
                onClick={() => setArrivalHelpTarget(null)}
              >
                Uždaryti
              </button>
            </div>
          </div>
        </div>
      )}

      {workerAttendanceTarget && workerAttendanceMode && (
        <div
          className="rs-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !attendanceBusy) {
              setWorkerAttendanceTarget(null);
              setWorkerAttendanceMode(null);
              setWorkerAttendanceNote("");
              setWorkerEvidenceFile(null);
            }
          }}
        >
          <div className="rs-modal-card">
            <div className="rs-modal-head">
              <div>
                <div className="eyebrow">
                  {workerAttendanceMode === "dispute"
                    ? "DARBO DIENOS GINČAS"
                    : "DARBO DIENOS PATVIRTINIMAS"}
                </div>
                <h2>
                  {workerAttendanceMode === "dispute"
                    ? "Nesutinkate su darbdavio pažymėjimu?"
                    : "Patvirtinti, kad neatvykote?"}
                </h2>
              </div>
              <button
                className="rs-close"
                disabled={attendanceBusy}
                onClick={() => {
                  setWorkerAttendanceTarget(null);
                  setWorkerAttendanceMode(null);
                  setWorkerAttendanceNote("");
                  setWorkerEvidenceFile(null);
                }}
              >
                ×
              </button>
            </div>

            {workerAttendanceMode === "dispute" ? (
              <>
                <div className="wd-note err" style={{ marginBottom: 14 }}>
                  Kol ginčas neišspręstas, jūsų patikimumo reitingas nebus
                  mažinamas. Trumpai parašykite, kas įvyko.
                </div>
                <label className="wd-label">
                  Paaiškinimas *
                  <textarea
                    className="wd-textarea"
                    value={workerAttendanceNote}
                    maxLength={1000}
                    onChange={(e) => setWorkerAttendanceNote(e.target.value)}
                    placeholder="Pvz. Atvykau 07:55 ir dirbau iki 17:00. Darbdaviui parašiau žinutę..."
                  />
                </label>
                <label className="wd-label" style={{ marginTop: 14 }}>
                  Įrodymas (nebūtina)
                  <input
                    className="wd-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    disabled={attendanceBusy}
                    onChange={(e) =>
                      setWorkerEvidenceFile(e.target.files?.[0] || null)
                    }
                  />
                  <span
                    style={{
                      display: "block",
                      marginTop: 6,
                      color: "#6c7a88",
                      fontSize: 12,
                      lineHeight: 1.45,
                    }}
                  >
                    Galite pridėti nuotrauką arba PDF iki 8 MB. Failą matys tik
                    ginčą nagrinėjantis administratorius.
                  </span>
                  {workerEvidenceFile && (
                    <span
                      style={{
                        display: "block",
                        marginTop: 6,
                        color: "#167a54",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      Pasirinkta: {workerEvidenceFile.name}
                    </span>
                  )}
                </label>
              </>
            ) : (
              <div className="wd-note err" style={{ marginBottom: 0 }}>
                Patvirtinus neatvykimą, bus pritaikytas 3 dienų naujų darbų
                priėmimo apribojimas ir sumažės atvykimo patikimumas.
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 9,
                marginTop: 18,
              }}
            >
              <button
                className="wd-decline"
                disabled={attendanceBusy}
                onClick={() => {
                  setWorkerAttendanceTarget(null);
                  setWorkerAttendanceMode(null);
                  setWorkerAttendanceNote("");
                  setWorkerEvidenceFile(null);
                }}
              >
                Grįžti
              </button>
              <button
                className={
                  workerAttendanceMode === "dispute"
                    ? "wd-danger"
                    : "wd-danger"
                }
                disabled={
                  attendanceBusy ||
                  (workerAttendanceMode === "dispute" &&
                    workerAttendanceNote.trim().length < 5)
                }
                onClick={() => {
                  if (workerAttendanceMode === "dispute") {
                    workerRespondAttendance(
                      workerAttendanceTarget.attendance.id,
                      "disputed",
                      workerAttendanceNote.trim()
                    );
                  } else {
                    workerClaimWorkday(
                      workerAttendanceTarget.id,
                      "no_show"
                    );
                  }
                }}
              >
                {attendanceBusy
                  ? "Prašome..."
                  : workerAttendanceMode === "dispute"
                  ? "Pateikti ginčą"
                  : "Taip, neatvykau"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmInvitation && (
        <div
          className="rs-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !respondingInvitation) {
              setConfirmInvitation(null);
              setCommitmentChecked(false);
            }
          }}
        >
          <div className="rs-modal-card">
            <style>{`
              .rs-modal-overlay{position:fixed;inset:0;background:rgba(16,36,56,.62);z-index:2000;display:grid;place-items:center;padding:20px}
              .rs-modal-card{width:min(620px,100%);max-height:calc(100vh - 40px);overflow:auto;background:#fff;border-radius:18px;box-shadow:0 26px 80px rgba(16,36,56,.25);padding:22px;color:#102438}
              .rs-modal-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:18px}
              .rs-modal-head h2{margin:0;font-size:22px}.rs-close{border:0;background:#f1f4f6;border-radius:9px;width:38px;height:38px;font-size:20px;cursor:pointer}
            `}</style>
            <div className="rs-modal-head">
              <div>
                <div className="eyebrow">DARBO PATVIRTINIMAS</div>
                <h2>Ar tikrai įsipareigojate atvykti laiku?</h2>
              </div>
              <button
                className="rs-close"
                disabled={Boolean(respondingInvitation)}
                onClick={() => {
                  setConfirmInvitation(null);
                  setCommitmentChecked(false);
                }}
              >
                ×
              </button>
            </div>

            <div style={{ background: "#f6f8fa", borderRadius: 12, padding: 15 }}>
              <b>{confirmInvitation.job?.title}</b>
              <div style={{ color: "#6c7a88", marginTop: 5, lineHeight: 1.55 }}>
                {confirmInvitation.companyName} · {confirmInvitation.job?.city}
                <br />
                Darbdavio patikimumas:{" "}
                <b>{Math.round(confirmInvitation.companyReliability)}%</b>
                {confirmInvitation.companyCancelledConfirmed > 0
                  ? ` · atšauktų patvirtintų darbų: ${confirmInvitation.companyCancelledConfirmed}`
                  : ""}
                <br />
                {confirmInvitation.job?.work_date} ·{" "}
                {confirmInvitation.job?.start_time?.slice(0, 5)}
                {confirmInvitation.job?.end_time
                  ? `–${confirmInvitation.job.end_time.slice(0, 5)}`
                  : ""}
                <br />
                Atvykimas:{" "}
                <b>
                  {confirmInvitation.job?.transport_mode === "employer_pickup"
                    ? "darbdavys paima darbuotoją"
                    : "darbuotojas atvyksta pats"}
                </b>
                {confirmInvitation.job?.break_start_time &&
                  confirmInvitation.job?.break_end_time && (
                    <>
                      <br />
                      Pietų pertrauka:{" "}
                      <b>
                        {confirmInvitation.job.break_start_time.slice(0, 5)}–
                        {confirmInvitation.job.break_end_time.slice(0, 5)}
                      </b>
                    </>
                  )}
              </div>
              <div className="wd-pay">
                {formatNetPay(
                  confirmInvitation.job?.pay_amount,
                  confirmInvitation.job?.pay_unit
                )}
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <b>Priimdami darbą prisiimate realų įsipareigojimą.</b>
              <ul style={{ lineHeight: 1.65, color: "#425466", paddingLeft: 22 }}>
                <li>
                  Jei atsiranda problema dėl atvykimo, kuo greičiau parašykite
                  darbdaviui žinutę šiame darbo pokalbyje.
                </li>
                <li>
                  Neatvykus į patvirtintą darbą, 3 dienas negalėsite priimti
                  naujų darbų.
                </li>
                <li>
                  Neatvykimas sumažins jūsų patikimumo reitingą, todėl darbdavių
                  paieškoje būsite rodomi žemiau ir galite gauti mažiau kvietimų.
                </li>
              </ul>
              <p style={{ fontSize: 13, color: "#6c7a88", lineHeight: 1.5 }}>
                Jei negalite atvykti, svarbiausia nepradingti — informuokite
                darbdavį žinute kuo anksčiau.
              </p>
            </div>

            <label style={{
              display: "flex", gap: 9, alignItems: "flex-start",
              padding: "12px 0", fontWeight: 700
            }}>
              <input
                type="checkbox"
                checked={commitmentChecked}
                onChange={(e) => setCommitmentChecked(e.target.checked)}
                style={{ marginTop: 3 }}
              />
              Suprantu sąlygas ir patvirtinu, kad planuoju atvykti laiku.
            </label>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 9 }}>
              <button
                className="wd-decline"
                disabled={Boolean(respondingInvitation)}
                onClick={() => {
                  setConfirmInvitation(null);
                  setCommitmentChecked(false);
                }}
              >
                Grįžti
              </button>
              <button
                className="wd-accept"
                disabled={!commitmentChecked || Boolean(respondingInvitation)}
                onClick={() =>
                  respondToInvitation(confirmInvitation.id, "accepted")
                }
              >
                {respondingInvitation
                  ? "Patvirtinama..."
                  : "Taip, įsipareigoju atvykti"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConversationModal
        open={Boolean(conversation)}
        onClose={() => setConversation(null)}
        invitationId={conversation?.invitationId}
        title={conversation?.title}
        user={user}
      />

      <GroupConversationModal
        open={Boolean(groupConversation)}
        onClose={() => setGroupConversation(null)}
        jobId={groupConversation?.jobId}
        title={groupConversation?.title}
        user={user}
      />
    </div>
  );
}


function employerTomorrowISO() {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + 1);
  return localDateISO(date);
}

function shortWorkerName(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "Darbuotojas";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1][0]}.`;
}

function workerInitials(name) {
  return String(name || "D")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function EmployerDashboard({ user, onLogout }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);
  const [company, setCompany] = useState(null);
  const [skills, setSkills] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [employerStats, setEmployerStats] = useState({
    totalJobs: 0,
    filledJobs: 0,
    missingWorkers: 0,
    completedJobs: 0,
    cancelledJobs: 0,
    monthlyWorkersUsed: 0,
    reliabilityRate: 100,
    cancelledConfirmedCount: 0,
    falseAttendanceClaimCount: 0,
  });
  const [employerPenaltyByJob, setEmployerPenaltyByJob] = useState({});
  const [showReliabilityInfo, setShowReliabilityInfo] = useState(false);
  const [currentJob, setCurrentJob] = useState(null);
  const [matches, setMatches] = useState([]);
  const [invitedIds, setInvitedIds] = useState([]);
  const [invitationStatuses, setInvitationStatuses] = useState({});
  const [invitationByWorker, setInvitationByWorker] = useState({});
  const [employerNotifications, setEmployerNotifications] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [jobWorkers, setJobWorkers] = useState([]);
  const [attendanceTarget, setAttendanceTarget] = useState(null);
  const [attendanceMode, setAttendanceMode] = useState(null);
  const [attendanceEndTime, setAttendanceEndTime] = useState("");
  const [attendanceNote, setAttendanceNote] = useState("");
  const [attendanceSaving, setAttendanceSaving] = useState(false);
  const [ratingTarget, setRatingTarget] = useState(null);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingSaving, setRatingSaving] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [groupConversation, setGroupConversation] = useState(null);
  const [editingJobId, setEditingJobId] = useState(null);
  const [editingConfirmedCount, setEditingConfirmedCount] = useState(0);
  const [showJobForm, setShowJobForm] = useState(false);
  const [cancelJobTarget, setCancelJobTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancellingJob, setCancellingJob] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "Statybų pagalbiniai",
    city: "Vilnius",
    address: "",
    workDate: employerTomorrowISO(),
    startTime: "08:00",
    endTime: "17:00",
    breakStartTime: "12:00",
    breakEndTime: "12:30",
    workersNeeded: 1,
    transportMode: "self_arrival",
    payAmount: "",
    payUnit: "hour",
    description: "",
  });

  useEffect(() => {
    loadEmployerDashboard();
  }, [user.id]);

  useEffect(() => {
    if (!company?.id) return;

    const timer = setInterval(async () => {
      try {
        await reloadJobs(company.id);
        await Promise.all([
          loadEmployerNotifications(),
          loadEmployerStats(company.id),
        ]);

        if (currentJob?.id) {
          await loadCurrentJobWorkers(currentJob.id);

          const [jobResult, bookingResult, invitationsResult] = await Promise.all([
            supabase
              .from("jobs")
              .select(
                "id, title, city, address_text, work_date, start_time, end_time, break_start_time, break_end_time, workers_needed, pay_amount, pay_unit, status, transport_mode, description, cancellation_reason, cancelled_at, created_at"
              )
              .eq("id", currentJob.id)
              .single(),
            supabase
              .from("bookings")
              .select("id", { count: "exact", head: true })
              .eq("job_id", currentJob.id)
              .eq("status", "confirmed"),
            supabase
              .from("job_invitations")
              .select("id, worker_id, status")
              .eq("job_id", currentJob.id),
          ]);

          if (!jobResult.error) {
            const confirmedCount = bookingResult.count || 0;
            setCurrentJob((existing) =>
              existing?.id === currentJob.id
                ? { ...jobResult.data, confirmedCount }
                : existing
            );
          }

          if (!invitationsResult.error) {
            const invitationRows = invitationsResult.data || [];
            setInvitedIds(invitationRows.map((row) => row.worker_id));
            setInvitationStatuses(
              Object.fromEntries(
                invitationRows.map((row) => [row.worker_id, row.status])
              )
            );
            setInvitationByWorker(
              Object.fromEntries(
                invitationRows.map((row) => [row.worker_id, row])
              )
            );
          }
        }
      } catch {
        // Periodinis atnaujinimas neturi trukdyti pagrindiniam darbui.
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [company?.id, currentJob?.id]);

  async function loadEmployerNotifications() {
    const result = await supabase
      .from("job_notifications")
      .select("id, job_id, invitation_id, event_type, created_at, read_at")
      .is("read_at", null)
      .order("created_at", { ascending: false });

    if (result.error) throw result.error;
    setEmployerNotifications(result.data || []);
  }

  function unreadEmployerNotifications(jobId) {
    return employerNotifications.filter((item) => item.job_id === jobId);
  }

  async function markEmployerJobRead(jobId) {
    const ids = unreadEmployerNotifications(jobId).map((item) => item.id);
    if (!ids.length) return;

    const result = await supabase
      .from("job_notifications")
      .update({ read_at: new Date().toISOString() })
      .in("id", ids);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    setEmployerNotifications((current) =>
      current.filter((item) => !ids.includes(item.id))
    );
  }

  async function loadEmployerDashboard() {
    setLoading(true);
    setError("");

    try {
      const memberResult = await supabase
        .from("company_members")
        .select("company_id, member_role")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (memberResult.error) throw memberResult.error;
      if (!memberResult.data?.company_id) {
        throw new Error("Prie paskyros nerasta įmonė.");
      }

      const companyId = memberResult.data.company_id;

      const [companyResult, skillsResult, jobsResult] = await Promise.all([
        supabase
          .from("companies")
          .select(
            "id, name, company_code, city, is_verified, reliability_rate, cancelled_confirmed_count, false_attendance_claim_count"
          )
          .eq("id", companyId)
          .single(),
        supabase
          .from("skills")
          .select("id, name")
          .eq("is_active", true)
          .order("name"),
        supabase
          .from("jobs")
          .select(
            "id, title, city, address_text, work_date, start_time, end_time, break_start_time, break_end_time, workers_needed, pay_amount, pay_unit, status, transport_mode, description, cancellation_reason, cancelled_at, created_at"
          )
          .eq("company_id", companyId)
          .order("created_at", { ascending: false })
          .limit(12),
      ]);

      const failed = [companyResult, skillsResult, jobsResult].find(
        (result) => result.error
      );
      if (failed?.error) throw failed.error;

      setCompany(companyResult.data);
      setJobs(await addConfirmedCounts(jobsResult.data || []));
      setSkills(skillsResult.data || []);
      await Promise.all([
        loadEmployerNotifications(),
        loadEmployerStats(companyId),
      ]);

      setForm((current) => ({
        ...current,
        city: companyResult.data?.city || current.city,
      }));
    } catch (err) {
      setError(err?.message || "Nepavyko įkelti darbdavio paskyros.");
    } finally {
      setLoading(false);
    }
  }

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function loadEmployerStats(companyId = company?.id) {
    if (!companyId) return;

    const [jobsResult, companyResult, penaltiesResult] = await Promise.all([
      supabase
        .from("jobs")
        .select("id, status, workers_needed, work_date")
        .eq("company_id", companyId),
      supabase
        .from("companies")
        .select("reliability_rate, cancelled_confirmed_count, false_attendance_claim_count")
        .eq("id", companyId)
        .single(),
      supabase
        .from("employer_penalties")
        .select("job_id, reliability_change, affected_workers, created_at")
        .eq("company_id", companyId)
        .eq("penalty_type", "job_cancelled")
        .order("created_at", { ascending: false }),
    ]);

    if (jobsResult.error) throw jobsResult.error;
    if (companyResult.error) throw companyResult.error;
    if (penaltiesResult.error) throw penaltiesResult.error;

    const jobRows = jobsResult.data || [];
    const jobIds = jobRows.map((job) => job.id);

    let bookingRows = [];
    let attendanceRows = [];

    if (jobIds.length) {
      const bookingsResult = await supabase
        .from("bookings")
        .select("id, worker_id, job_id, status")
        .in("job_id", jobIds);

      if (bookingsResult.error) throw bookingsResult.error;
      bookingRows = bookingsResult.data || [];

      const bookingIds = bookingRows.map((booking) => booking.id);

      if (bookingIds.length) {
        const attendanceResult = await supabase
          .from("attendance")
          .select("booking_id, final_outcome, finalized_at")
          .in("booking_id", bookingIds)
          .not("finalized_at", "is", null);

        if (attendanceResult.error) throw attendanceResult.error;
        attendanceRows = attendanceResult.data || [];
      }
    }

    const confirmedByJob = {};
    for (const booking of bookingRows) {
      if (booking.status !== "confirmed") continue;

      confirmedByJob[booking.job_id] =
        (confirmedByJob[booking.job_id] || 0) + 1;
    }

    const attendanceByBooking = new Map(
      attendanceRows.map((attendance) => [
        attendance.booking_id,
        attendance,
      ])
    );

    const jobById = new Map(
      jobRows.map((job) => [job.id, job])
    );

    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}-01`;

    const nextMonthDate = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1
    );
    const nextMonthStart = `${nextMonthDate.getFullYear()}-${String(
      nextMonthDate.getMonth() + 1
    ).padStart(2, "0")}-01`;

    const monthlyWorkerIds = new Set();

    for (const booking of bookingRows) {
      const job = jobById.get(booking.job_id);
      const attendance = attendanceByBooking.get(booking.id);

      if (!job || !attendance?.finalized_at) continue;

      const worked =
        attendance.final_outcome === "full_day" ||
        attendance.final_outcome === "left_early_agreed" ||
        attendance.final_outcome === "left_early_unexcused";

      if (
        worked &&
        job.work_date >= monthStart &&
        job.work_date < nextMonthStart
      ) {
        monthlyWorkerIds.add(booking.worker_id);
      }
    }

    const monthlyWorkersUsed = monthlyWorkerIds.size;

    const today = localDateISO(new Date());

    const filledJobs = jobRows.filter((job) => {
      const confirmed = confirmedByJob[job.id] || 0;
      return (
        job.status !== "cancelled" &&
        confirmed >= Number(job.workers_needed || 0) &&
        job.work_date >= today
      );
    }).length;

    const missingWorkers = jobRows
      .filter(
        (job) =>
          job.status !== "cancelled" &&
          job.status !== "completed" &&
          job.work_date >= today
      )
      .reduce((sum, job) => {
        const confirmed = confirmedByJob[job.id] || 0;
        return sum + Math.max(0, Number(job.workers_needed || 0) - confirmed);
      }, 0);

    const completedJobs = jobRows.filter(
      (job) => job.status === "completed"
    ).length;

    setEmployerStats({
      totalJobs: jobRows.length,
      filledJobs,
      missingWorkers,
      completedJobs,
      cancelledJobs: jobRows.filter((job) => job.status === "cancelled").length,
      monthlyWorkersUsed,
      reliabilityRate: Number(companyResult.data?.reliability_rate ?? 100),
      cancelledConfirmedCount: Number(
        companyResult.data?.cancelled_confirmed_count || 0
      ),
      falseAttendanceClaimCount: Number(
        companyResult.data?.false_attendance_claim_count || 0
      ),
    });

    setEmployerPenaltyByJob(
      Object.fromEntries(
        (penaltiesResult.data || []).map((penalty) => [
          penalty.job_id,
          {
            change: Number(penalty.reliability_change || 0),
            affectedWorkers: Number(penalty.affected_workers || 0),
            createdAt: penalty.created_at,
          },
        ])
      )
    );

    setCompany((current) =>
      current
        ? {
            ...current,
            reliability_rate: companyResult.data?.reliability_rate ?? 100,
            cancelled_confirmed_count:
              companyResult.data?.cancelled_confirmed_count || 0,
            false_attendance_claim_count:
              companyResult.data?.false_attendance_claim_count || 0,
          }
        : current
    );
  }

  async function addConfirmedCounts(jobRows) {
    const rows = jobRows || [];
    const ids = rows.map((job) => job.id);
    if (!ids.length) return rows.map((job) => ({ ...job, confirmedCount: 0 }));

    const result = await supabase
      .from("bookings")
      .select("job_id, status")
      .in("job_id", ids)
      .eq("status", "confirmed");

    if (result.error) throw result.error;

    const counts = {};
    for (const booking of result.data || []) {
      counts[booking.job_id] = (counts[booking.job_id] || 0) + 1;
    }

    return rows.map((job) => ({
      ...job,
      confirmedCount: counts[job.id] || 0,
    }));
  }

  async function reloadJobs(companyId = company?.id) {
    if (!companyId) return;

    const result = await supabase
      .from("jobs")
      .select(
        "id, title, city, address_text, work_date, start_time, end_time, break_start_time, break_end_time, workers_needed, pay_amount, pay_unit, status, transport_mode, description, cancellation_reason, cancelled_at, created_at"
      )
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(12);

    if (!result.error) {
      try {
        setJobs(await addConfirmedCounts(result.data || []));
      } catch {
        setJobs(result.data || []);
      }

      try {
        await loadEmployerStats(companyId);
      } catch {
        // Statistikos klaida neturi blokuoti poreikių sąrašo.
      }
    }
  }

  async function loadCurrentJobWorkers(jobId) {
    if (!jobId) {
      setJobWorkers([]);
      return;
    }

    const bookingsResult = await supabase
      .from("bookings")
      .select(
        "id, worker_id, invitation_id, status, confirmed_at, cancelled_at, cancellation_reason"
      )
      .eq("job_id", jobId)
      .order("confirmed_at", { ascending: true });

    if (bookingsResult.error) throw bookingsResult.error;

    const bookingRows = bookingsResult.data || [];
    const workerIds = [...new Set(bookingRows.map((row) => row.worker_id))];
    const bookingIds = bookingRows.map((row) => row.id);

    if (!workerIds.length) {
      setJobWorkers([]);
      return;
    }

    const [profilesResult, workersResult, workerSkillsResult, attendanceResult, ratingsResult] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("id, display_name, city")
          .in("id", workerIds),
        supabase
          .from("worker_profiles")
          .select(
            "user_id, has_driving_license_b, years_experience, attendance_rate, completed_jobs, rating_average, rating_count, short_bio, travel_radius_km, no_show_count, restricted_until, unexcused_early_leave_count"
          )
          .in("user_id", workerIds),
        supabase
          .from("worker_skills")
          .select("worker_id, skill_id")
          .in("worker_id", workerIds),
        supabase
          .from("attendance")
          .select(
            "id, booking_id, status, worker_check_in_at, employer_check_in_at, worker_workday_claim, worker_claimed_at, employer_outcome, employer_marked_at, actual_end_time, employer_note, worker_response, worker_response_note, worker_responded_at, dispute_status, final_outcome, finalized_at, worked_minutes, resolution_note"
          )
          .in("booking_id", bookingIds),
        supabase
          .from("worker_ratings")
          .select("booking_id, score, comment")
          .in("booking_id", bookingIds),
      ]);

    const failed = [
      profilesResult,
      workersResult,
      workerSkillsResult,
      attendanceResult,
      ratingsResult,
    ].find((result) => result.error);

    if (failed?.error) throw failed.error;

    const profileMap = new Map(
      (profilesResult.data || []).map((row) => [row.id, row])
    );
    const workerMap = new Map(
      (workersResult.data || []).map((row) => [row.user_id, row])
    );
    const attendanceMap = new Map(
      (attendanceResult.data || []).map((row) => [row.booking_id, row])
    );
    const ratingMap = new Map(
      (ratingsResult.data || []).map((row) => [row.booking_id, row])
    );

    const skillNameMap = new Map(
      skills.map((skill) => [Number(skill.id), skill.name])
    );
    const skillIdsByWorker = new Map();

    for (const row of workerSkillsResult.data || []) {
      const list = skillIdsByWorker.get(row.worker_id) || [];
      list.push(Number(row.skill_id));
      skillIdsByWorker.set(row.worker_id, list);
    }

    const publicStatsEntries = await Promise.all(
      workerIds.map(async (workerId) => {
        const result = await supabase.rpc("get_worker_public_stats", {
          p_worker_id: workerId,
        });
        if (result.error) return [workerId, null];

        const row = result.data?.[0] || {};
        return [
          workerId,
          {
            monthWorkedDays: Number(row.month_worked_days || 0),
            monthWorkedMinutes: Number(row.month_worked_minutes || 0),
            monthJobs: Number(row.month_jobs || 0),
            activeJobs: Number(row.active_jobs || 0),
            cancelledByEmployer: Number(row.cancelled_by_employer || 0),
            attendanceRate: Number(row.attendance_rate ?? 100),
            ratingAverage:
              row.rating_average === null || row.rating_average === undefined
                ? null
                : Number(row.rating_average),
            ratingCount: Number(row.rating_count || 0),
            noShowCount: Number(row.no_show_count || 0),
            unexcusedEarlyLeaveCount: Number(
              row.unexcused_early_leave_count || 0
            ),
          },
        ];
      })
    );

    const publicStatsMap = new Map();
    for (const [workerId, stats] of publicStatsEntries) {
      publicStatsMap.set(workerId, stats);
    }

    const rows = bookingRows
      .map((booking) => {
        const profile = profileMap.get(booking.worker_id);
        const worker = workerMap.get(booking.worker_id);
        if (!profile || !worker) return null;

        const skillNames = (skillIdsByWorker.get(booking.worker_id) || [])
          .map((id) => skillNameMap.get(id))
          .filter(Boolean)
          .slice(0, 6);

        return {
          id: booking.worker_id,
          bookingId: booking.id,
          invitationId: booking.invitation_id,
          bookingStatus: booking.status,
          name: shortWorkerName(profile.display_name),
          initials: workerInitials(profile.display_name),
          city: profile.city,
          yearsExperience: Number(worker.years_experience || 0),
          attendanceRate: Number(worker.attendance_rate || 100),
          ratingAverage:
            worker.rating_average === null
              ? null
              : Number(worker.rating_average),
          ratingCount: Number(worker.rating_count || 0),
          noShowCount: Number(worker.no_show_count || 0),
          unexcusedEarlyLeaveCount: Number(
            worker.unexcused_early_leave_count || 0
          ),
          hasDrivingLicenseB: Boolean(worker.has_driving_license_b),
          shortBio: worker.short_bio || "",
          skillNames,
          attendance: attendanceMap.get(booking.id) || null,
          rating: ratingMap.get(booking.id) || null,
          publicStats: publicStatsMap.get(booking.worker_id) || null,
        };
      })
      .filter(Boolean);

    setJobWorkers(rows);
  }

  async function openWorkerProfile(worker) {
    setError("");

    if (worker?.publicStats) {
      setSelectedWorker(worker);
      return;
    }

    try {
      const result = await supabase.rpc("get_worker_public_stats", {
        p_worker_id: worker.id,
      });
      if (result.error) throw result.error;

      const row = result.data?.[0] || {};
      setSelectedWorker({
        ...worker,
        publicStats: {
          monthWorkedDays: Number(row.month_worked_days || 0),
          monthWorkedMinutes: Number(row.month_worked_minutes || 0),
          monthJobs: Number(row.month_jobs || 0),
          activeJobs: Number(row.active_jobs || 0),
          cancelledByEmployer: Number(row.cancelled_by_employer || 0),
          attendanceRate: Number(
            row.attendance_rate ?? worker.attendanceRate ?? 100
          ),
          ratingAverage:
            row.rating_average === null || row.rating_average === undefined
              ? worker.ratingAverage ?? null
              : Number(row.rating_average),
          ratingCount: Number(row.rating_count || 0),
          noShowCount: Number(row.no_show_count || worker.noShowCount || 0),
          unexcusedEarlyLeaveCount: Number(
            row.unexcused_early_leave_count ||
              worker.unexcusedEarlyLeaveCount ||
              0
          ),
        },
      });
    } catch (err) {
      setError(err?.message || "Nepavyko atidaryti darbuotojo profilio.");
    }
  }

  async function employerCheckInWorker(target) {
    if (!target?.bookingId) return;

    setAttendanceSaving(true);
    setNotice("");
    setError("");

    try {
      const result = await supabase.rpc("employer_check_in_worker", {
        p_booking_id: target.bookingId,
      });

      if (result.error) throw result.error;

      setNotice(
        `Patvirtinote, kad ${target.name} atvyko į darbą. Darbo dieną vis tiek reikės uždaryti pasibaigus darbo laikui.`
      );

      await Promise.all([
        loadCurrentJobWorkers(currentJob?.id),
        loadEmployerNotifications(),
      ]);
    } catch (err) {
      setError(err?.message || "Nepavyko patvirtinti darbuotojo atvykimo.");
    } finally {
      setAttendanceSaving(false);
    }
  }

  async function recordEmployerAttendance(
    target,
    outcome,
    actualEndTime = null,
    note = ""
  ) {
    if (!target?.bookingId) return;

    setAttendanceSaving(true);
    setNotice("");
    setError("");

    try {
      const result = await supabase.rpc("employer_record_attendance", {
        p_booking_id: target.bookingId,
        p_outcome: outcome,
        p_actual_end_time: actualEndTime || null,
        p_note: note.trim() || null,
      });

      if (result.error) throw result.error;

      const returnedAttendance = Array.isArray(result.data)
        ? result.data[0]
        : result.data;

      setNotice(
        outcome === "full_day"
          ? "Darbo diena uždaryta."
          : returnedAttendance?.dispute_status === "disputed"
          ? "Sistema aptiko nesutapimą ir automatiškai sukūrė ginčą. Darbuotojo reitingas nekeičiamas iki sprendimo."
          : "Darbo dienos rezultatas perduotas darbuotojui patvirtinti. Kol darbuotojas nepatvirtino arba ginčas neišspręstas, galutinis rezultatas nefiksuojamas."
      );

      setAttendanceTarget(null);
      setAttendanceMode(null);
      setAttendanceEndTime("");
      setAttendanceNote("");

      await Promise.all([
        loadCurrentJobWorkers(currentJob?.id),
        reloadJobs(company?.id),
        loadEmployerStats(company?.id),
        loadEmployerNotifications(),
      ]);
    } catch (err) {
      setError(err?.message || "Nepavyko uždaryti darbo dienos.");
    } finally {
      setAttendanceSaving(false);
    }
  }

  async function submitWorkerRating() {
    if (!ratingTarget?.bookingId) return;

    setRatingSaving(true);
    setNotice("");
    setError("");

    try {
      const result = await supabase.from("worker_ratings").insert({
        booking_id: ratingTarget.bookingId,
        worker_id: ratingTarget.id,
        rater_id: user.id,
        score: Number(ratingScore),
        comment: ratingComment.trim() || null,
      });

      if (result.error) throw result.error;

      setNotice("Darbuotojo įvertinimas išsaugotas.");
      setRatingTarget(null);
      setRatingScore(5);
      setRatingComment("");

      await loadCurrentJobWorkers(currentJob?.id);
    } catch (err) {
      setError(
        err?.message?.toLowerCase().includes("duplicate")
          ? "Šį darbuotoją už šį darbą jau įvertinote."
          : err?.message || "Nepavyko išsaugoti įvertinimo."
      );
    } finally {
      setRatingSaving(false);
    }
  }

  async function findMatches(job) {
    setSearching(true);
    setError("");
    setMatches([]);

    try {
      const availabilityResult = await supabase
        .from("availability")
        .select("worker_id, available_from, available_to")
        .eq("available_date", job.work_date)
        .eq("status", "available");

      if (availabilityResult.error) throw availabilityResult.error;

      const suitableAvailability = (availabilityResult.data || []).filter(
        (row) => {
          const from = row.available_from?.slice(0, 5);
          const to = row.available_to?.slice(0, 5);
          const startsInWindow = !from || from <= job.start_time.slice(0, 5);
          const endsInWindow =
            !job.end_time || !to || to >= job.end_time.slice(0, 5);
          return startsInWindow && endsInWindow;
        }
      );

      let workerIds = suitableAvailability.map((row) => row.worker_id);

      if (!workerIds.length) {
        setMatches([]);
        return;
      }

      const busyBookingsResult = await supabase
        .from("bookings")
        .select("worker_id, job_id")
        .in("worker_id", workerIds)
        .eq("status", "confirmed");

      if (busyBookingsResult.error) throw busyBookingsResult.error;

      const busyJobIds = [
        ...new Set(
          (busyBookingsResult.data || [])
            .map((row) => row.job_id)
            .filter((id) => id && id !== job.id)
        ),
      ];

      let busyJobs = [];
      if (busyJobIds.length) {
        const busyJobsResult = await supabase
          .from("jobs")
          .select("id, work_date, start_time, end_time")
          .in("id", busyJobIds);

        if (busyJobsResult.error) throw busyJobsResult.error;
        busyJobs = busyJobsResult.data || [];
      }

      const busyJobMap = new Map(busyJobs.map((item) => [item.id, item]));
      const busyByWorker = new Set();

      for (const booking of busyBookingsResult.data || []) {
        if (booking.job_id === job.id) continue;
        const busyJob = busyJobMap.get(booking.job_id);
        if (busyJob && timeRangesOverlap(job, busyJob)) {
          busyByWorker.add(booking.worker_id);
        }
      }

      workerIds = workerIds.filter((id) => !busyByWorker.has(id));

      if (!workerIds.length) {
        setMatches([]);
        return;
      }

      const [
        profilesResult,
        workersResult,
        workerSkillsResult,
        cityLocationsResult,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, display_name, city")
          .eq("role", "worker")
          .eq("is_active", true)
          .in("id", workerIds),
        supabase
          .from("worker_profiles")
          .select(
            "user_id, has_driving_license_b, years_experience, attendance_rate, completed_jobs, rating_average, short_bio, travel_radius_km, no_show_count, restricted_until"
          )
          .in("user_id", workerIds),
        supabase
          .from("worker_skills")
          .select("worker_id, skill_id")
          .in("worker_id", workerIds),
        supabase
          .from("city_locations")
          .select("city_key, name, latitude, longitude"),
      ]);

      const failed = [
        profilesResult,
        workersResult,
        workerSkillsResult,
        cityLocationsResult,
      ].find((result) => result.error);

      if (failed?.error) throw failed.error;

      const profileMap = new Map(
        (profilesResult.data || []).map((row) => [row.id, row])
      );
      const workerMap = new Map(
        (workersResult.data || []).map((row) => [row.user_id, row])
      );
      const availabilityMap = new Map(
        suitableAvailability.map((row) => [row.worker_id, row])
      );

      const cityLocationMap = new Map(
        (cityLocationsResult.data || []).map((row) => [
          row.city_key,
          row,
        ])
      );

      const jobCityKey = normalizeCityKey(job.city);
      const jobLocation = cityLocationMap.get(jobCityKey) || null;

      const skillIdsByWorker = new Map();
      for (const row of workerSkillsResult.data || []) {
        const list = skillIdsByWorker.get(row.worker_id) || [];
        list.push(Number(row.skill_id));
        skillIdsByWorker.set(row.worker_id, list);
      }

      const skillNameMap = new Map(
        skills.map((skill) => [Number(skill.id), skill.name])
      );

      const combined = workerIds
        .map((workerId) => {
          const profile = profileMap.get(workerId);
          const worker = workerMap.get(workerId);
          const slot = availabilityMap.get(workerId);
          if (!profile || !worker || !slot) return null;

          const workerCityKey = normalizeCityKey(profile.city);
          const workerLocation =
            cityLocationMap.get(workerCityKey) || null;

          let distanceKm = null;

          if (workerCityKey && workerCityKey === jobCityKey) {
            distanceKm = 0;
          } else if (jobLocation && workerLocation) {
            distanceKm = distanceKmBetweenPoints(
              jobLocation,
              workerLocation
            );
          } else {
            // Saugus fallback: jei miesto koordinačių nežinome,
            // skirtingo miesto darbuotojo nerodome.
            return null;
          }

          const rawTravelRadius = Number(worker.travel_radius_km);
          const workerTravelRadius = Number.isFinite(rawTravelRadius)
            ? Math.max(0, rawTravelRadius)
            : 30;

          const allowedDistanceKm = Math.min(30, workerTravelRadius);

          if (
            distanceKm === null ||
            distanceKm > allowedDistanceKm
          ) {
            return null;
          }

          if (
            worker.restricted_until &&
            new Date(worker.restricted_until) > new Date()
          ) {
            return null;
          }

          const skillNames = (skillIdsByWorker.get(workerId) || [])
            .map((id) => skillNameMap.get(id))
            .filter(Boolean)
            .slice(0, 4);

          return {
            id: workerId,
            name: shortWorkerName(profile.display_name),
            initials: workerInitials(profile.display_name),
            city: profile.city,
            hasDrivingLicenseB: Boolean(worker.has_driving_license_b),
            yearsExperience: Number(worker.years_experience || 0),
            attendanceRate: Number(worker.attendance_rate || 0),
            completedJobs: Number(worker.completed_jobs || 0),
            shortBio: worker.short_bio || "",
            travelRadiusKm: Number(worker.travel_radius_km || 0),
            distanceKm:
              distanceKm === null
                ? null
                : Math.round(distanceKm * 10) / 10,
            noShowCount: Number(worker.no_show_count || 0),
            ratingAverage:
              worker.rating_average === null
                ? null
                : Number(worker.rating_average),
            availableFrom: slot.available_from?.slice(0, 5) || "",
            availableTo: slot.available_to?.slice(0, 5) || "",
            skillNames,
          };
        })
        .filter(Boolean)
        .sort((a, b) => {
          const distanceA =
            a.distanceKm === null ? Number.POSITIVE_INFINITY : a.distanceKm;
          const distanceB =
            b.distanceKm === null ? Number.POSITIVE_INFINITY : b.distanceKm;

          if (distanceA !== distanceB) {
            return distanceA - distanceB;
          }

          if (b.attendanceRate !== a.attendanceRate) {
            return b.attendanceRate - a.attendanceRate;
          }

          return (b.ratingAverage || 0) - (a.ratingAverage || 0);
        });

      setMatches(combined);

      const invitationsResult = await supabase
        .from("job_invitations")
        .select("id, worker_id, status")
        .eq("job_id", job.id);

      if (!invitationsResult.error) {
        const invitationRows = invitationsResult.data || [];
        setInvitedIds(invitationRows.map((row) => row.worker_id));
        setInvitationStatuses(
          Object.fromEntries(
            invitationRows.map((row) => [row.worker_id, row.status])
          )
        );
        setInvitationByWorker(
          Object.fromEntries(
            invitationRows.map((row) => [row.worker_id, row])
          )
        );
      }
    } catch (err) {
      setError(err?.message || "Nepavyko rasti darbuotojų.");
    } finally {
      setSearching(false);
    }
  }

  async function saveJobAndFind() {
    setNotice("");
    setError("");

    if (!company?.id) {
      setError("Nerasta įmonė.");
      return;
    }

    if (!form.title.trim()) {
      setError("Įrašykite poreikio pavadinimą.");
      return;
    }

    if (!form.workDate || !form.startTime) {
      setError("Pasirinkite datą ir pradžios laiką.");
      return;
    }

    if (!form.endTime || form.endTime <= form.startTime) {
      setError("Nurodykite teisingą darbo pabaigos laiką.");
      return;
    }

    if (
      editingConfirmedCount === 0 &&
      (!form.breakStartTime || !form.breakEndTime)
    ) {
      setError("Nurodykite pietų pertraukos pradžią ir pabaigą.");
      return;
    }

    if (
      (form.breakStartTime || form.breakEndTime) &&
      (
        !form.breakStartTime ||
        !form.breakEndTime ||
        form.breakStartTime < form.startTime ||
        form.breakEndTime > form.endTime ||
        form.breakEndTime <= form.breakStartTime
      )
    ) {
      setError("Pietų pertrauka turi būti darbo laiko ribose.");
      return;
    }

    if (form.description.trim().length < 10) {
      setError("Aprašykite darbą išsamiau, kad darbuotojui būtų aišku, ką reikės daryti.");
      return;
    }

    if (!form.payAmount || Number(form.payAmount) <= 0) {
      setError("Atlygis į rankas yra privalomas. Įveskite sumą.");
      return;
    }

    if (!["hour", "day"].includes(form.payUnit)) {
      setError("Pasirinkite, ar atlygis mokamas už valandą, ar už dieną.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        city: form.city.trim(),
        address_text: form.address.trim() || null,
        work_date: form.workDate,
        start_time: form.startTime,
        end_time: form.endTime || null,
        break_start_time: form.breakStartTime || null,
        break_end_time: form.breakEndTime || null,
        workers_needed: Number(form.workersNeeded) || 1,
        title: form.title.trim(),
        description: form.description.trim() || null,
        pay_amount: Number(form.payAmount),
        pay_unit: form.payUnit,
        transport_mode: form.transportMode,
      };

      let job;

      if (editingJobId) {
        const updateResult = await supabase
          .from("jobs")
          .update(payload)
          .eq("id", editingJobId)
          .select(
            "id, title, city, address_text, work_date, start_time, end_time, break_start_time, break_end_time, workers_needed, pay_amount, pay_unit, status, transport_mode, description, cancellation_reason, cancelled_at, created_at"
          )
          .single();

        if (updateResult.error) throw updateResult.error;
        job = updateResult.data;


        setNotice("Poreikis atnaujintas.");
      } else {
        const insertResult = await supabase
          .from("jobs")
          .insert({
            ...payload,
            company_id: company.id,
            created_by: user.id,
            status: "open",
          })
          .select(
            "id, title, city, address_text, work_date, start_time, end_time, break_start_time, break_end_time, workers_needed, pay_amount, pay_unit, status, transport_mode, description, cancellation_reason, cancelled_at, created_at"
          )
          .single();

        if (insertResult.error) throw insertResult.error;
        job = insertResult.data;

        setNotice("Darbo pasiūlymas sukurtas. Žemiau rodomi tinkami darbuotojai.");
      }

      setCurrentJob({ ...job, confirmedCount: editingConfirmedCount || 0 });
      setInvitedIds([]);
      setInvitationStatuses({});
      setInvitationByWorker({});
      setEditingJobId(null);
      setEditingConfirmedCount(0);
      await reloadJobs(company.id);
      await findMatches(job);
      setShowJobForm(false);

    } catch (err) {
      setError(err?.message || "Nepavyko sukurti darbo pasiūlymo.");
    } finally {
      setSaving(false);
    }
  }

  async function openExistingJob(job) {
    setNotice("");
    setError("");
    setEditingJobId(null);
    setEditingConfirmedCount(0);
    setShowJobForm(false);
    setCurrentJob(job);

    try {
      setForm((current) => ({
        ...current,
        title: job.title || "",
        city: job.city || "",
        address: job.address_text || "",
        workDate: job.work_date,
        startTime: job.start_time?.slice(0, 5) || "08:00",
        endTime: job.end_time?.slice(0, 5) || "17:00",
        breakStartTime: job.break_start_time?.slice(0, 5) || "",
        breakEndTime: job.break_end_time?.slice(0, 5) || "",
        workersNeeded: job.workers_needed || 1,
        transportMode:
          job.transport_mode === "employer_pickup"
            ? "employer_pickup"
            : "self_arrival",
        payAmount: job.pay_amount ?? "",
        payUnit: job.pay_unit === "day" ? "day" : "hour",
        description: job.description || "",
      }));

      await Promise.all([
        findMatches(job),
        loadCurrentJobWorkers(job.id),
      ]);
      await markEmployerJobRead(job.id);
      window.scrollTo({ top: 430, behavior: "smooth" });
    } catch (err) {
      setError(err?.message || "Nepavyko atidaryti poreikio.");
    }
  }

  function openNewJobForm() {
    setEditingJobId(null);
    setEditingConfirmedCount(0);
    setCurrentJob(null);
    setMatches([]);
    setJobWorkers([]);
    setNotice("");
    setError("");
    setInvitedIds([]);
    setInvitationStatuses({});
    setInvitationByWorker({});
    setForm({
      title: "Statybų pagalbiniai",
      city: company?.city || "Vilnius",
      address: "",
      workDate: employerTomorrowISO(),
      startTime: "08:00",
      endTime: "17:00",
      breakStartTime: "12:00",
      breakEndTime: "12:30",
      workersNeeded: 1,
      transportMode: "self_arrival",
      payAmount: "",
      payUnit: "hour",
      description: "",
    });
    setShowJobForm(true);
    window.scrollTo({ top: 220, behavior: "smooth" });
  }

  async function startEditJob(job) {
    await openExistingJob(job);
    setShowJobForm(true);
    setEditingJobId(job.id);
    setEditingConfirmedCount(Number(job.confirmedCount || 0));
    setNotice(
      job.confirmedCount > 0
        ? "Poreikis jau turi patvirtintų darbuotojų. Esminės sąlygos užrakintos."
        : "Redaguojate esamą poreikį."
    );
    window.scrollTo({ top: 220, behavior: "smooth" });
  }

  async function requestRemoveOrCancelJob(job) {
    setError("");
    setNotice("");

    const visibleConfirmedCount = Number(job.confirmedCount || 0);

    // Jei darbdavys jau mato "Atšaukti", modalą rodome IŠKART.
    // Galutinio atšaukimo metu DB vis tiek dar kartą patikrinama.
    if (visibleConfirmedCount > 0) {
      setCancelReason("");
      setCancelJobTarget({
        ...job,
        confirmedCount: visibleConfirmedCount,
      });

      // Fone tik patiksliname skaičių. Tai neblokuoja modalo atsidarymo.
      supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("job_id", job.id)
        .eq("status", "confirmed")
        .then(({ count, error: countError }) => {
          if (!countError && Number(count || 0) > 0) {
            setCancelJobTarget((current) =>
              current?.id === job.id
                ? { ...current, confirmedCount: Number(count || 0) }
                : current
            );
          }
        });

      return;
    }

    try {
      const countResult = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("job_id", job.id)
        .eq("status", "confirmed");

      if (countResult.error) throw countResult.error;

      const confirmedCount = Number(countResult.count || 0);

      if (confirmedCount > 0) {
        setCancelReason("");
        setCancelJobTarget({
          ...job,
          confirmedCount,
        });
        return;
      }

      const shouldDelete = window.confirm(
        "Šis poreikis neturi patvirtintų darbuotojų. Ar tikrai norite jį ištrinti?"
      );

      if (!shouldDelete) return;

      const result = await supabase.from("jobs").delete().eq("id", job.id);
      if (result.error) throw result.error;

      setNotice("Poreikis ištrintas.");

      if (currentJob?.id === job.id) {
        setCurrentJob(null);
        setMatches([]);
      }

      if (editingJobId === job.id) {
        setEditingJobId(null);
        setEditingConfirmedCount(0);
      }

      await reloadJobs(company.id);
    } catch (err) {
      setError(err?.message || "Nepavyko pašalinti poreikio.");
    }
  }

  async function confirmEmployerCancellation() {
    if (!cancelJobTarget) return;

    const reason = cancelReason.trim();

    if (reason.length < 5) {
      setError("Įrašykite aiškią atšaukimo priežastį.");
      return;
    }

    setCancellingJob(true);
    setError("");
    setNotice("");

    try {
      const now = new Date().toISOString();

      const countResult = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("job_id", cancelJobTarget.id)
        .eq("status", "confirmed");

      if (countResult.error) throw countResult.error;

      const confirmedCount = Number(countResult.count || 0);

      if (confirmedCount === 0) {
        throw new Error(
          "Patvirtintų darbuotojų nebeliko. Atnaujinkite poreikį ir bandykite dar kartą."
        );
      }

      const jobResult = await supabase
        .from("jobs")
        .update({
          status: "cancelled",
          cancellation_reason: reason,
          cancelled_at: now,
        })
        .eq("id", cancelJobTarget.id);

      if (jobResult.error) throw jobResult.error;

      const bookingsResult = await supabase
        .from("bookings")
        .update({
          status: "cancelled_by_employer",
          cancelled_at: now,
          cancellation_reason: reason,
        })
        .eq("job_id", cancelJobTarget.id)
        .eq("status", "confirmed");

      if (bookingsResult.error) throw bookingsResult.error;

      const invitationsResult = await supabase
        .from("job_invitations")
        .update({
          status: "cancelled",
          responded_at: now,
        })
        .eq("job_id", cancelJobTarget.id)
        .in("status", ["pending", "accepted"]);

      if (invitationsResult.error) throw invitationsResult.error;

      setNotice("Poreikis atšauktas. Darbuotojai matys jūsų nurodytą priežastį.");

      if (currentJob?.id === cancelJobTarget.id) {
        setCurrentJob((existing) =>
          existing
            ? {
                ...existing,
                status: "cancelled",
                cancellation_reason: reason,
                cancelled_at: now,
                confirmedCount: 0,
              }
            : existing
        );
        setMatches([]);
      }

      if (editingJobId === cancelJobTarget.id) {
        setEditingJobId(null);
        setEditingConfirmedCount(0);
      }

      setCancelJobTarget(null);
      setCancelReason("");
      await reloadJobs(company.id);
      await loadEmployerNotifications();
    } catch (err) {
      setError(err?.message || "Nepavyko atšaukti poreikio.");
    } finally {
      setCancellingJob(false);
    }
  }


  async function inviteWorker(workerId) {
    if (!currentJob?.id) return;

    setError("");
    setNotice("");

    try {
      if (
        currentJob.status !== "open" ||
        Number(currentJob.confirmedCount || 0) >= Number(currentJob.workers_needed || 0)
      ) {
        throw new Error("Šis poreikis jau užpildytas arba uždarytas.");
      }

      const result = await supabase
        .from("job_invitations")
        .insert({
          job_id: currentJob.id,
          worker_id: workerId,
          status: "pending",
        })
        .select("id, worker_id, status")
        .single();

      if (result.error) throw result.error;

      setInvitedIds((current) => [...current, workerId]);
      setInvitationStatuses((current) => ({
        ...current,
        [workerId]: "pending",
      }));
      setInvitationByWorker((current) => ({
        ...current,
        [workerId]: result.data,
      }));
      setNotice("Kvietimas darbuotojui išsiųstas.");
    } catch (err) {
      if (String(err?.message || "").toLowerCase().includes("duplicate")) {
        setInvitedIds((current) => [...new Set([...current, workerId])]);
        setNotice("Šis darbuotojas jau pakviestas.");
      } else {
        setError(err?.message || "Nepavyko išsiųsti kvietimo.");
      }
    }
  }

  if (loading) {
    return (
      <div className="ed-loading">
        <div className="ed-spinner" />
        <b>Kraunamas darbdavio darbo skydelis...</b>
      </div>
    );
  }

  return (
    <div className="ed-page">
      <style>{`
        .ed-page{min-height:100vh;background:#f6f8fa;color:#102438}
        .ed-topbar{height:72px;background:#fff;border-bottom:1px solid #e4ebf0;display:flex;align-items:center;position:sticky;top:0;z-index:30}
        .ed-topbar-inner{width:min(1180px,calc(100% - 40px));margin:auto;display:flex;align-items:center;justify-content:space-between;gap:24px}
        .ed-company{display:flex;align-items:center;gap:12px}.ed-company-icon{width:42px;height:42px;border-radius:11px;background:#102438;color:#fff;display:grid;place-items:center;font-weight:800}
        .ed-company b{display:block}.ed-company span{font-size:13px;color:#6c7a88}
        .ed-shell{width:min(1180px,calc(100% - 40px));margin:32px auto 70px;display:grid;gap:20px}
        .ed-heading{display:flex;justify-content:space-between;align-items:end;gap:20px}.ed-heading h1{font-family:Manrope,Inter,sans-serif;margin:3px 0 0;font-size:34px;letter-spacing:-.035em}.ed-heading p{margin:8px 0 0;color:#6c7a88;max-width:720px}
        .ed-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}
        .ed-kpi{background:#fff;border:1px solid #e4ebf0;border-radius:14px;padding:17px;display:flex;flex-direction:column;justify-content:space-between;min-height:112px}
        .ed-kpi span{display:block;font-size:12px;color:#6c7a88;line-height:1.35;min-height:34px}
        .ed-kpi b{font-size:24px;line-height:1;margin-top:10px}.ed-kpi small{display:block;margin-top:5px;color:#8a98a6;font-size:11px}
        .ed-reliability-card{display:flex;align-items:center;justify-content:flex-start}
        .ed-reliability-copy{min-width:0;display:flex;flex-direction:column;align-items:flex-start}
        .ed-reliability-title{
          display:flex;
          align-items:center;
          gap:4px;
          color:#6c7a88;
          font-family:Inter,sans-serif;
          font-size:12px;
          line-height:1.25;
          margin-bottom:7px;
        }
        .ed-info-btn{
          width:15px;
          height:15px;
          min-width:15px;
          min-height:15px;
          border-radius:50%;
          border:1px solid #bfc9d0;
          background:#fff;
          color:#6c7a88;
          font-family:Inter,sans-serif;
          font-size:9px;
          font-weight:800;
          line-height:13px;
          text-align:center;
          cursor:pointer;
          padding:0;
          margin:0;
          box-sizing:border-box;
          vertical-align:middle;
          flex:0 0 auto;
        }
        .ed-info-btn:hover{background:#f3f6f8;border-color:#aebbc5}
        .ed-reliability-label{font-family:Manrope,Inter,sans-serif!important;font-size:24px!important;line-height:1.05}
        .ed-reliability-score-text{font-family:Inter,sans-serif;font-size:12px!important;color:#6c7a88!important;margin-top:6px!important}
        .ed-card{background:#fff;border:1px solid #e4ebf0;border-radius:16px;box-shadow:0 8px 28px rgba(16,36,56,.045);padding:24px}
        .ed-card h2{margin:0 0 6px;font-size:22px}.ed-sub{margin:0 0 20px;color:#6c7a88}
        .ed-form-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.ed-span-2{grid-column:span 2}.ed-span-4{grid-column:1/-1}
        .ed-label{display:grid;gap:7px;font-size:13px;font-weight:700;color:#263b4d}
        .ed-input,.ed-select,.ed-textarea{width:100%;border:1px solid #dbe4ea;border-radius:10px;padding:12px 13px;background:#fff;color:#102438;font:inherit;outline:none}
        .ed-input:focus,.ed-select:focus,.ed-textarea:focus{border-color:#f08a28;box-shadow:0 0 0 3px rgba(240,138,40,.10)}
        .ed-textarea{min-height:90px;resize:vertical}
        .ed-check{display:flex;align-items:center;gap:9px;font-size:14px;font-weight:700;min-height:46px}.ed-check input{width:18px;height:18px;accent-color:#1c9b67}
        .ed-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:18px}.ed-primary{border:0;border-radius:10px;background:#f08a28;color:#fff;padding:12px 18px;font:inherit;font-weight:800;cursor:pointer}.ed-primary:disabled{opacity:.6;cursor:wait}
        .ed-note{border-radius:10px;padding:11px 13px;font-size:14px;font-weight:700}.ed-note.ok{background:#edf8f3;color:#167a54}.ed-note.err{background:#fff0ec;color:#b64d2a}
        .ed-results-head{display:flex;justify-content:space-between;align-items:flex-end;gap:18px;margin-bottom:16px}.ed-results-head p{margin:4px 0 0;color:#6c7a88}
        .ed-results{display:grid;gap:10px}.ed-worker{display:grid;grid-template-columns:minmax(190px,1.45fr) minmax(210px,1.8fr) 95px minmax(210px,1.35fr);gap:14px;align-items:center;border:1px solid #e4ebf0;border-radius:13px;padding:14px}
        .ed-worker-id{display:flex;align-items:center;gap:11px}.ed-avatar{width:42px;height:42px;border-radius:50%;background:#eef2f5;display:grid;place-items:center;font-weight:800}.ed-worker-id b{display:block}.ed-worker-id span{font-size:13px;color:#6c7a88}
        .ed-tags{display:flex;flex-wrap:wrap;gap:6px}.ed-tag{font-size:11px;font-weight:700;background:#f1f4f6;border-radius:999px;padding:5px 7px;color:#44576a}
        .ed-metric b{display:block}.ed-metric span{font-size:12px;color:#6c7a88}
        .ed-invite{border:0;border-radius:9px;background:#f08a28;color:#fff;padding:9px 12px;font:inherit;font-weight:800;cursor:pointer}.ed-invite.sent{background:#edf8f3;color:#167a54;cursor:default}
        .ed-worker-actions{display:flex;gap:6px;justify-content:flex-end;flex-wrap:wrap}.ed-secondary{border:1px solid #dbe4ea;background:#fff;color:#102438;border-radius:9px;padding:8px 10px;font:inherit;font-size:12px;font-weight:800;cursor:pointer}
        .ed-attendance-panel{margin-bottom:22px;padding:18px;border:1px solid #e4ebf0;border-radius:14px;background:#f8fafb}
        .ed-attendance-panel h2{margin:0 0 4px}
        .ed-attendance-list{display:grid;gap:9px;margin-top:14px}
        .ed-attendance-row{display:grid;grid-template-columns:minmax(220px,1.35fr) minmax(210px,.9fr) auto;gap:18px;align-items:center;background:#fff;border:1px solid #e4ebf0;border-radius:12px;padding:14px 15px}
        .ed-member-metrics{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .ed-member-metric{padding:8px 10px;border-radius:10px;background:#f6f8fa}
        .ed-member-metric span{display:block;color:#6c7a88;font-size:11px;margin-bottom:3px}
        .ed-member-metric b{font-family:Manrope,Inter,sans-serif;font-size:17px}
        .ed-worker-status{display:flex;gap:6px;flex-wrap:wrap;margin-top:7px}
        .ed-attendance-actions{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end;align-items:center}
        .ed-attendance-badge{display:inline-flex;border-radius:999px;padding:5px 8px;font-size:11px;font-weight:800;margin-top:5px}
        .ed-attendance-badge.green{background:#edf8f3;color:#167a54}.ed-attendance-badge.orange{background:#fff3e7;color:#b85f0e}.ed-attendance-badge.red{background:#fff0ec;color:#b64d2a}.ed-attendance-badge.muted{background:#f1f4f6;color:#667788}
        .ed-progress{font-size:13px;font-weight:800;color:#102438}.ed-job-actions{display:flex;gap:6px;justify-content:flex-end;flex-wrap:wrap}.ed-danger{border-color:#f0c8bc!important;color:#b64d2a!important}
        .rs-alert{display:inline-flex;align-items:center;gap:5px;border-radius:999px;padding:6px 9px;font-size:12px;font-weight:800;width:max-content}
        .rs-alert.red{background:#fff0ec;color:#b64d2a}.rs-alert.orange{background:#fff3e7;color:#b85f0e}.rs-alert.green{background:#edf8f3;color:#167a54}.rs-alert.muted{background:#f1f4f6;color:#667788}
        .ed-news{margin-top:7px}.ed-news .rs-alert{margin:0}
        .ed-empty{border:1px dashed #cfd9e0;border-radius:13px;padding:24px;text-align:center;color:#6c7a88}
        .ed-empty.compact{padding:14px 16px;text-align:left;background:#f8fafb}
        .ed-jobs{display:grid;gap:9px}.ed-job{display:grid;grid-template-columns:105px minmax(220px,1.4fr) 95px 105px minmax(230px,1fr);gap:14px;align-items:center;padding:13px 10px;border-top:1px solid #edf1f4;border-radius:10px;transition:background .18s ease}.ed-job:first-child{border-top:0}.ed-job-active{background:#eef1f3}.ed-opened-badge{display:inline-flex;align-items:center;border-radius:999px;padding:4px 7px;background:#dce2e6;color:#425466;font-size:11px;font-weight:800}
        .ed-job button{border:1px solid #dbe4ea;background:#fff;border-radius:9px;padding:8px 10px;font:inherit;font-size:13px;font-weight:700;cursor:pointer}
        .ed-status{font-size:12px;font-weight:800;border-radius:999px;padding:5px 8px;background:#edf8f3;color:#167a54;width:max-content}
        .ed-loading{min-height:100vh;display:grid;place-items:center;align-content:center;gap:12px;background:#f6f8fa}.ed-spinner{width:28px;height:28px;border:3px solid #dfe7ed;border-top-color:#f08a28;border-radius:50%;animation:edspin .8s linear infinite}@keyframes edspin{to{transform:rotate(360deg)}}
        @media(max-width:980px){.ed-form-grid{grid-template-columns:1fr 1fr}.ed-span-4{grid-column:1/-1}.ed-worker{grid-template-columns:1fr 1fr}.ed-worker .ed-tags{grid-column:1/-1}.ed-job{grid-template-columns:100px 1fr 100px}.ed-job>:nth-child(3){display:none}.ed-attendance-row{grid-template-columns:1fr}.ed-attendance-actions{justify-content:flex-start}.ed-member-metrics{grid-template-columns:1fr 1fr}}
        @media(max-width:620px){.ed-topbar-inner,.ed-shell{width:min(100% - 24px,1180px)}.ed-heading{flex-direction:column;align-items:flex-start}.ed-form-grid{grid-template-columns:1fr}.ed-span-2,.ed-span-4{grid-column:auto}.ed-worker{grid-template-columns:1fr}.ed-jobs .ed-job{grid-template-columns:1fr}.ed-job>:nth-child(3){display:block}.ed-attendance-row{grid-template-columns:1fr}}
      `}</style>

      <header className="ed-topbar">
        <div className="ed-topbar-inner">
          <a className="brand" href="#">
            <span className="logo-mark">⌂</span>
            <span>
              rankos<span>statybose</span>.lt
            </span>
          </a>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {company && (
              <div className="ed-company">
                <div className="ed-company-icon">
                  {workerInitials(company.name) || "Į"}
                </div>
                <div>
                  <b>{company.name}</b>
                  <span>{company.city || "Miestas nenurodytas"}</span>
                </div>
              </div>
            )}
            <button className="btn ghost" onClick={onLogout}>
              Atsijungti
            </button>
          </div>
        </div>
      </header>

      <main className="ed-shell">
        <div className="ed-heading">
          <div>
            <div className="eyebrow">DARBDAVIO PASKYRA</div>
            <h1>Raskite laisvus darbuotojus</h1>
            <p>
              Sukurkite konkretų poreikį. Sistema rodys darbuotojus, kurie tą
              dieną ir tuo laiku pažymėjo, kad gali dirbti.
            </p>
          </div>

          <button
            className="ed-primary"
            type="button"
            onClick={openNewJobForm}
          >
            + Sukurti darbo pasiūlymą
          </button>
        </div>

        <section>
          <div style={{ marginBottom: 10 }}>
            <div className="eyebrow">ĮMONĖS STATISTIKA</div>
          </div>

          <div className="ed-kpis">
            <div className="ed-kpi">
              <span>Sukurta darbo pasiūlymų</span>
              <b>{employerStats.totalJobs}</b>
            </div>

            <div className="ed-kpi">
              <span>Pilnai žmonėmis užpildyti darbai</span>
              <b>{employerStats.filledJobs}</b>
            </div>

            <div className="ed-kpi">
              <span>Trūksta darbuotojų</span>
              <b>{employerStats.missingWorkers}</b>
            </div>

            <div className="ed-kpi">
              <span>Įvykdyti darbai</span>
              <b>{employerStats.completedJobs}</b>
            </div>

            <div className="ed-kpi">
              <span>Atšaukti darbai</span>
              <b>{employerStats.cancelledJobs}</b>
            </div>

            <div className="ed-kpi">
              <span>Panaudoti darbuotojai / mėn.</span>
              <b>{employerStats.monthlyWorkersUsed}</b>
            </div>

            <div className="ed-kpi ed-reliability-card">
              <div className="ed-reliability-copy">
                <div className="ed-reliability-title">
                  <span>Patikimumas</span>
                  <button
                    type="button"
                    className="ed-info-btn"
                    aria-label="Kaip veikia darbdavio patikimumas"
                    title="Kaip veikia darbdavio patikimumas"
                    onClick={() => setShowReliabilityInfo(true)}
                  >
                    i
                  </button>
                </div>

                <b className="ed-reliability-label">
                  {employerStats.reliabilityRate >= 90
                    ? "Puikus"
                    : employerStats.reliabilityRate >= 75
                    ? "Geras"
                    : employerStats.reliabilityRate >= 60
                    ? "Vidutinis"
                    : "Žemas"}
                </b>

                <small className="ed-reliability-score-text">
                  {Math.round(employerStats.reliabilityRate)} / 100
                </small>
              </div>
            </div>
          </div>
        </section>

        {notice && <div className="ed-note ok">{notice}</div>}
        {error && <div className="ed-note err">{error}</div>}

        {showJobForm && (
        <section className="ed-card">
          <h2>
            {editingJobId ? "Redaguoti darbo pasiūlymą" : "Naujas darbo pasiūlymas"}
          </h2>
          <p className="ed-sub">
            {editingJobId
              ? "Atnaujinkite poreikį. Kai darbuotojas jau patvirtino darbą, esminės sąlygos užrakinamos."
              : "Užpildykite svarbiausią informaciją ir iškart ieškosime tinkamų žmonių."}
          </p>

          <div className="ed-form-grid">
            <label className="ed-label ed-span-2">
              Darbo pasiūlymo pavadinimas
              <input
                className="ed-input"
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="Pvz. Reikia 2 statybų pagalbinių rytoj"
              />
            </label>

            <label className="ed-label">
              Miestas
              <input
                className="ed-input"
                value={form.city}
                disabled={editingConfirmedCount > 0}
                onChange={(e) => updateField("city", e.target.value)}
              />
            </label>

            <label className="ed-label">
              Žmonių skaičius
              <input
                className="ed-input"
                type="number"
                min="1"
                max="100"
                value={form.workersNeeded}
                onChange={(e) => updateField("workersNeeded", e.target.value)}
              />
            </label>

            <label className="ed-label ed-span-2">
              Objekto vieta / adresas
              <input
                className="ed-input"
                value={form.address}
                disabled={editingConfirmedCount > 0}
                onChange={(e) => updateField("address", e.target.value)}
                placeholder="Pvz. Naujamiestis, Vilnius"
              />
            </label>

            <label className="ed-label">
              Data
              <input
                className="ed-input"
                type="date"
                value={form.workDate}
                disabled={editingConfirmedCount > 0}
                onChange={(e) => updateField("workDate", e.target.value)}
              />
            </label>

            <label className="ed-label">
              Nuo
              <input
                className="ed-input"
                type="time"
                value={form.startTime}
                disabled={editingConfirmedCount > 0}
                onChange={(e) => updateField("startTime", e.target.value)}
              />
            </label>

            <label className="ed-label">
              Iki
              <input
                className="ed-input"
                type="time"
                value={form.endTime}
                disabled={editingConfirmedCount > 0}
                onChange={(e) => updateField("endTime", e.target.value)}
              />
            </label>
            <label className="ed-label">
              Pietų pertrauka nuo *
              <input
                className="ed-input"
                type="time"
                required
                value={form.breakStartTime}
                disabled={editingConfirmedCount > 0}
                onChange={(e) => updateField("breakStartTime", e.target.value)}
              />
            </label>

            <label className="ed-label">
              Pietų pertrauka iki *
              <input
                className="ed-input"
                type="time"
                required
                value={form.breakEndTime}
                disabled={editingConfirmedCount > 0}
                onChange={(e) => updateField("breakEndTime", e.target.value)}
              />
            </label>

            <label className="ed-label">
              Atlygis į rankas (€) *
              <input
                className="ed-input"
                type="number"
                min="0.01"
                step="0.5"
                required
                value={form.payAmount}
                disabled={editingConfirmedCount > 0}
                onChange={(e) => updateField("payAmount", e.target.value)}
                placeholder={form.payUnit === "day" ? "Pvz. 90" : "Pvz. 12"}
              />
            </label>

            <label className="ed-label">
              Mokėjimo tipas *
              <select
                className="ed-select"
                required
                value={form.payUnit}
                disabled={editingConfirmedCount > 0}
                onChange={(e) => updateField("payUnit", e.target.value)}
              >
                <option value="hour">Už valandą</option>
                <option value="day">Už dieną</option>
              </select>
            </label>

            <label className="ed-label ed-span-2">
              Atvykimas į darbo vietą *
              <select
                className="ed-select"
                value={form.transportMode}
                disabled={editingConfirmedCount > 0}
                onChange={(e) => updateField("transportMode", e.target.value)}
              >
                <option value="self_arrival">Darbuotojas atvyksta pats</option>
                <option value="employer_pickup">Darbdavys paima darbuotoją</option>
              </select>
            </label>

            <label className="ed-label ed-span-4">
              Darbo aprašymas *
              <textarea
                className="ed-textarea"
                required
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Aprašykite, ką reikės daryti, darbo sąlygas, ar suteikiami įrankiai, kokia apranga reikalinga ir kitą svarbią informaciją."
              />
            </label>
          </div>

          <div className="ed-actions">
            <button
              className="ed-secondary"
              type="button"
              disabled={saving}
              onClick={() => {
                setShowJobForm(false);
                setEditingJobId(null);
                setEditingConfirmedCount(0);
              }}
            >
              Uždaryti
            </button>

            <button
              className="ed-primary"
              disabled={saving}
              onClick={saveJobAndFind}
            >
              {saving
                ? "Saugoma..."
                : editingJobId
                ? "Išsaugoti pakeitimus"
                : "Sukurti darbo pasiūlymą"}
            </button>
          </div>
        </section>
        )}

        {currentJob && (
          <section className="ed-card">
            {unreadEmployerNotifications(currentJob.id).length > 0 && (() => {
              const currentNews = unreadEmployerNotifications(currentJob.id);
              const currentPresentation = notificationPresentation(currentNews);
              return (
                <div className={`ed-note ${currentPresentation.tone === "red" ? "err" : "ok"}`} style={{ marginBottom: 16 }}>
                  {currentPresentation.label}
                  {currentNews.length > 1 ? ` · ${currentNews.length} naujienos` : ""}
                  <button
                    className="ed-secondary"
                    style={{ marginLeft: 10 }}
                    onClick={() => markEmployerJobRead(currentJob.id)}
                  >
                    Peržiūrėta
                  </button>
                </div>
              );
            })()}

            {currentJob.status === "cancelled" && (
              <div className="ed-note err" style={{ marginBottom: 16 }}>
                <b>Poreikis atšauktas.</b>
                <div style={{ marginTop: 4 }}>
                  Priežastis:{" "}
                  {currentJob.cancellation_reason || "Priežastis nenurodyta."}
                </div>
              </div>
            )}

            {currentJob.status === "filled" && (
              <div className="ed-note ok" style={{ marginBottom: 16 }}>
                Poreikis užpildytas: {currentJob.confirmedCount}/{currentJob.workers_needed}.
                Darbuotojų paieška automatiškai uždaryta.
              </div>
            )}

            {jobWorkers.length > 0 && (
              <div className="ed-attendance-panel">
                <h2>Patvirtinti darbuotojai ir darbo diena</h2>

                <div className="ed-attendance-list">
                  {jobWorkers.map((worker) => {
                    const attendance = worker.attendance || {};
                    const ended = jobHasEnded(currentJob);
                    const checkInOpen = jobCheckInWindowOpen(currentJob);
                    const isConfirmed = worker.bookingStatus === "confirmed";
                    const pendingNegative =
                      !attendance.finalized_at &&
                      ["no_show", "left_early_agreed", "left_early_unexcused"].includes(
                        attendance.employer_outcome
                      );
                    const disputed =
                      attendance.dispute_status === "disputed";
                    const canClose =
                      isConfirmed &&
                      ended &&
                      !attendance.finalized_at &&
                      !attendance.employer_outcome;

                    return (
                      <div
                        className="ed-attendance-row"
                        key={worker.bookingId}
                      >
                        <div className="ed-worker-id">
                          <div className="ed-avatar">{worker.initials}</div>
                          <div>
                            <b>{worker.name}</b>
                            <span>
                              {worker.city} · {worker.yearsExperience} m. patirties
                            </span>

                            <div className="ed-worker-status">
                              {attendance.worker_check_in_at && (
                                <span className="ed-attendance-badge green">
                                  ✓ Darbuotojas pažymėjo „Atvykau“
                                </span>
                              )}

                              {attendance.employer_check_in_at && (
                                <span className="ed-attendance-badge green">
                                  ✓ Atvykimą patvirtinote
                                </span>
                              )}

                              {attendance.finalized_at && (
                                <span
                                  className={`ed-attendance-badge ${
                                    attendance.final_outcome === "no_show" ||
                                    attendance.final_outcome ===
                                      "left_early_unexcused"
                                      ? "red"
                                      : "green"
                                  }`}
                                >
                                  {attendanceOutcomeLabel(attendance)}
                                  {attendance.worked_minutes > 0
                                    ? ` · ${formatWorkedMinutes(
                                        attendance.worked_minutes
                                      )}`
                                    : ""}
                                </span>
                              )}

                              {pendingNegative && !disputed && (
                                <span className="ed-attendance-badge orange">
                                  Laukiama darbuotojo patvirtinimo
                                </span>
                              )}

                              {disputed && (
                                <span className="ed-attendance-badge red">
                                  Ginčas · reitingas nekeičiamas
                                </span>
                              )}

                              {canClose && (
                                <span className="ed-attendance-badge orange">
                                  Neuždaryta darbo diena
                                </span>
                              )}

                              {!ended &&
                                isConfirmed &&
                                !attendance.finalized_at &&
                                !attendance.employer_check_in_at && (
                                  <span className="ed-attendance-badge muted">
                                    {checkInOpen
                                      ? "Darbo diena vyksta"
                                      : "Darbo diena dar neprasidėjo"}
                                  </span>
                                )}
                            </div>
                          </div>
                        </div>

                        <div className="ed-member-metrics">
                          <div className="ed-member-metric">
                            <span>Atvykimo patikimumas</span>
                            <b>{Math.round(worker.attendanceRate)}%</b>
                          </div>

                          <div className="ed-member-metric">
                            <span>Darbdavių įvertinimas</span>
                            <b>
                              {worker.ratingAverage === null
                                ? "—"
                                : `${worker.ratingAverage.toFixed(1)} / 5`}
                            </b>
                          </div>


                        </div>

                        <div className="ed-attendance-actions">
                          <button
                            className="ed-secondary"
                            onClick={() => openWorkerProfile(worker)}
                          >
                            Profilis
                          </button>

                          <button
                            className="ed-secondary"
                            onClick={() =>
                              setGroupConversation({
                                jobId: currentJob.id,
                                title: currentJob.title,
                              })
                            }
                          >
                            Darbo pokalbis
                          </button>

                          {checkInOpen &&
                            isConfirmed &&
                            !attendance.finalized_at &&
                            !attendance.employer_check_in_at && (
                              <button
                                className="ed-secondary"
                                disabled={attendanceSaving}
                                onClick={() => employerCheckInWorker(worker)}
                              >
                                Patvirtinti atvykimą
                              </button>
                            )}

                          {isConfirmed && !attendance.finalized_at && (
                            <button
                              className="ed-primary"
                              disabled={!canClose || attendanceSaving}
                              title={
                                canClose
                                  ? "Uždaryti šio darbuotojo darbo dieną"
                                  : "Darbo dieną galima uždaryti pasibaigus darbo laikui"
                              }
                              onClick={() => {
                                setAttendanceTarget(worker);
                                setAttendanceMode("choose");
                                setAttendanceEndTime("");
                                setAttendanceNote("");
                              }}
                            >
                              Uždaryti dieną
                            </button>
                          )}

                          {attendance.finalized_at &&
                            attendance.final_outcome !== "no_show" &&
                            !worker.rating && (
                              <button
                                className="ed-primary"
                                onClick={() => {
                                  setRatingTarget(worker);
                                  setRatingScore(5);
                                  setRatingComment("");
                                }}
                              >
                                Įvertinti
                              </button>
                            )}

                          {worker.rating && (
                            <span className="ed-attendance-badge green">
                              Įvertinta {worker.rating.score}/5
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="ed-results-head">
              <div>
                <h2>Kiti laisvi darbuotojai</h2>
                <p>
                  {currentJob.city} · {currentJob.work_date} ·{" "}
                  {currentJob.start_time?.slice(0, 5)}
                  {currentJob.end_time
                    ? `–${currentJob.end_time.slice(0, 5)}`
                    : ""}
                  {currentJob.pay_amount
                    ? ` · ${formatNetPay(currentJob.pay_amount, currentJob.pay_unit)}`
                    : ""}
                  {` · ${
                    currentJob.transport_mode === "employer_pickup"
                      ? "Darbdavys paima darbuotoją"
                      : "Darbuotojas atvyksta pats"
                  }`}
                  {currentJob.break_start_time &&
                    currentJob.break_end_time
                    ? ` · Pietūs ${currentJob.break_start_time.slice(
                        0,
                        5
                      )}–${currentJob.break_end_time.slice(0, 5)}`
                    : ""}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <b>{matches.filter((worker) => !jobWorkers.some((item) => item.id === worker.id)).length} rasti</b>
                <div className="ed-progress">
                  {currentJob.status === "completed"
                    ? "Darbo diena užbaigta"
                    : `${Number(currentJob.confirmedCount || 0)}/${currentJob.workers_needed} patvirtinti`}
                </div>
              </div>
            </div>

            {searching ? (
              <div className="ed-empty">Ieškome tinkamų darbuotojų...</div>
            ) : matches.filter(
              (worker) => !jobWorkers.some((item) => item.id === worker.id)
            ).length ? (
              <div className="ed-results">
                {matches
                  .filter(
                    (worker) => !jobWorkers.some((item) => item.id === worker.id)
                  )
                  .map((worker) => {
                  const invited = invitedIds.includes(worker.id);
                  return (
                    <div className="ed-worker" key={worker.id}>
                      <div className="ed-worker-id">
                        <div className="ed-avatar">{worker.initials}</div>
                        <div>
                          <b>{worker.name}</b>
                          <span>
                            {worker.city} · {worker.yearsExperience} m. patirties
                            {worker.distanceKm !== null
                              ? ` · ${worker.distanceKm} km nuo darbo`
                              : ""}
                          </span>
                        </div>
                      </div>

                      <div className="ed-tags">
                        {worker.skillNames.map((skill) => (
                          <span className="ed-tag" key={skill}>
                            {skill}
                          </span>
                        ))}
                      </div>

                      <div className="ed-metric">
                        <b>{Math.round(worker.attendanceRate)}%</b>
                        <span>atvykimas</span>
                      </div>

                      <div className="ed-worker-actions">
                        <button
                          className="ed-secondary"
                          onClick={() => openWorkerProfile(worker)}
                        >
                          Profilis
                        </button>

                        <button
                          className={invited ? "ed-invite sent" : "ed-invite"}
                          disabled={invited || currentJob.status !== "open"}
                          onClick={() => inviteWorker(worker.id)}
                        >
                          {!invited
                            ? "Kviesti"
                            : invitationStatuses[worker.id] === "accepted"
                            ? "Priėmė"
                            : invitationStatuses[worker.id] === "declined"
                            ? "Atmetė"
                            : invitationStatuses[worker.id] === "expired"
                            ? "Užpildyta"
                            : "Pakviestas"}
                        </button>

                        {invitationByWorker[worker.id] && (
                          <button
                            className="ed-secondary"
                            onClick={async () => {
                              await markEmployerJobRead(currentJob.id);
                              setConversation({
                                invitationId: invitationByWorker[worker.id].id,
                                title: `${worker.name} · ${currentJob.title}`,
                              });
                            }}
                          >
                            Žinutė
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="ed-empty compact">
                Šiuo metu papildomų laisvų darbuotojų pagal šiuos kriterijus
                nerasta.
              </div>
            )}
          </section>
        )}

        <section className="ed-card">
          <h2>Mano poreikiai</h2>
          <p className="ed-sub">
            Galite vėl atidaryti ankstesnį poreikį ir patikrinti, kas dabar laisvas.
          </p>

          {jobs.length ? (
            <div className="ed-jobs">
              {jobs.map((job) => {
                const unreadNews = unreadEmployerNotifications(job.id);
                const newsPresentation = notificationPresentation(unreadNews);

                return (
                  <div
                    className={
                      currentJob?.id === job.id
                        ? "ed-job ed-job-active"
                        : "ed-job"
                    }
                    key={job.id}
                  >
                    <b>{job.work_date}</b>
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        <b>{job.title}</b>
                        {currentJob?.id === job.id && (
                          <span className="ed-opened-badge">Atidarytas</span>
                        )}
                      </div>
                      <div style={{ color: "#6c7a88", fontSize: 13 }}>
                        {job.city} · {job.start_time?.slice(0, 5)}
                        {job.pay_amount
                          ? ` · ${formatNetPay(job.pay_amount, job.pay_unit)}`
                          : ""}
                      </div>
                      {jobHasEnded(job) &&
                        Number(job.confirmedCount || 0) > 0 &&
                        !["cancelled", "completed"].includes(job.status) && (
                          <div style={{ marginTop: 7 }}>
                            <span className="ed-attendance-badge orange">
                              Neuždaryta darbo diena · patvirtinkite rezultatą
                            </span>
                          </div>
                        )}
                      {unreadNews.length > 0 && (
                        <div className="ed-news">
                          <span className={`rs-alert ${newsPresentation.tone}`}>
                            {newsPresentation.label}
                            {unreadNews.length > 1 ? ` · ${unreadNews.length}` : ""}
                          </span>
                        </div>
                      )}
                      {job.status === "cancelled" &&
                        employerPenaltyByJob[job.id] && (
                          <div
                            style={{
                              marginTop: 7,
                              fontSize: 12,
                              fontWeight: 700,
                              color: "#b64d2a",
                            }}
                          >
                            Šis atšaukimas sumažino jūsų patikimumą{" "}
                            {employerPenaltyByJob[job.id].change} taškų.
                          </div>
                        )}
                    </div>
                    <span className="ed-progress">
                      {job.confirmedCount || 0}/{job.workers_needed} patvirtinti
                    </span>
                    <span className="ed-status">
                      {job.status === "filled"
                        ? "Užpildyta"
                        : job.status === "completed"
                        ? "Įvykdyta"
                        : job.status === "cancelled"
                        ? "Atšaukta"
                        : job.status === "open"
                        ? "Atvira"
                        : job.status}
                    </span>
                    <div className="ed-job-actions">
                      <button onClick={() => openExistingJob(job)}>Atidaryti</button>
                      {job.status !== "cancelled" && job.status !== "completed" && (
                        <button onClick={() => startEditJob(job)}>Redaguoti</button>
                      )}
                      {job.status !== "cancelled" && job.status !== "completed" && (
                        <button
                          className="ed-danger"
                          onClick={() => requestRemoveOrCancelJob(job)}
                        >
                          {job.confirmedCount > 0 ? "Atšaukti" : "Ištrinti"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="ed-empty">Dar neturite sukurtų poreikių.</div>
          )}
        </section>
      </main>

      {attendanceTarget && attendanceMode && (
        <div
          className="rs-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !attendanceSaving) {
              setAttendanceTarget(null);
              setAttendanceMode(null);
              setAttendanceEndTime("");
              setAttendanceNote("");
            }
          }}
        >
          <div className="rs-modal-card">
            <div className="rs-modal-head">
              <div>
                <div className="eyebrow">DARBO DIENOS UŽDARYMAS</div>
                <h2>
                  {attendanceMode === "choose"
                    ? "Kaip baigėsi darbuotojo darbo diena?"
                    : attendanceMode === "no_show"
                    ? "Pažymėti, kad darbuotojas neatvyko?"
                    : "Darbuotojas išėjo anksčiau"}
                </h2>
              </div>

              <button
                className="rs-close"
                disabled={attendanceSaving}
                onClick={() => {
                  setAttendanceTarget(null);
                  setAttendanceMode(null);
                  setAttendanceEndTime("");
                  setAttendanceNote("");
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                background: "#f6f8fa",
                borderRadius: 12,
                padding: 14,
                marginBottom: 16,
              }}
            >
              <b>{attendanceTarget.name}</b>
              <div style={{ color: "#6c7a88", marginTop: 4 }}>
                {currentJob?.title} · {currentJob?.work_date}
              </div>
            </div>

            {attendanceMode === "choose" && (
              <div style={{ display: "grid", gap: 10 }}>
                <button
                  className="ed-primary"
                  disabled={attendanceSaving}
                  onClick={() =>
                    recordEmployerAttendance(
                      attendanceTarget,
                      "full_day"
                    )
                  }
                >
                  Išdirbo visą dieną
                </button>

                <button
                  className="ed-secondary"
                  disabled={attendanceSaving}
                  onClick={() => {
                    setAttendanceMode("left_early_agreed");
                    setAttendanceEndTime("");
                    setAttendanceNote("");
                  }}
                >
                  Išėjo anksčiau
                </button>

                {!attendanceTarget?.attendance?.employer_check_in_at && (
                  <button
                    className="ed-secondary ed-danger"
                    disabled={attendanceSaving}
                    onClick={() => {
                      setAttendanceMode("no_show");
                      setAttendanceEndTime("");
                      setAttendanceNote("");
                    }}
                  >
                    Neatvyko
                  </button>
                )}
              </div>
            )}

            {attendanceMode !== "choose" &&
              attendanceMode !== "no_show" && (
                <>
                  <label className="ed-label" style={{ marginBottom: 14 }}>
                    Ankstyvo išėjimo tipas *
                    <select
                      className="ed-select"
                      value={attendanceMode}
                      onChange={(e) => setAttendanceMode(e.target.value)}
                    >
                      <option value="left_early_agreed">
                        Išėjo anksčiau – suderinta
                      </option>
                      <option value="left_early_unexcused">
                        Išėjo anksčiau be pateisinamos priežasties
                      </option>
                    </select>
                  </label>

                  <label className="ed-label" style={{ marginBottom: 14 }}>
                    Faktinis išėjimo laikas *
                    <input
                      className="ed-input"
                      type="time"
                      value={attendanceEndTime}
                      onChange={(e) => setAttendanceEndTime(e.target.value)}
                    />
                  </label>
                </>
              )}

            {attendanceMode !== "choose" && (
              <>
                <label className="ed-label">
                  {attendanceMode === "left_early_agreed"
                    ? "Pastaba"
                    : "Paaiškinimas *"}
                  <textarea
                    className="ed-textarea"
                    maxLength={1000}
                    value={attendanceNote}
                    onChange={(e) => setAttendanceNote(e.target.value)}
                    placeholder={
                      attendanceMode === "no_show"
                        ? "Trumpai parašykite, kodėl pažymite neatvykimą."
                        : attendanceMode === "left_early_unexcused"
                        ? "Trumpai aprašykite, kas įvyko."
                        : "Pvz. Išėjimas buvo suderintas iš anksto."
                    }
                  />
                </label>

                {["no_show", "left_early_unexcused"].includes(
                  attendanceMode
                ) && (
                  <div className="ed-note err" style={{ marginTop: 14 }}>
                    Šis neigiamas pažymėjimas{" "}
                    <b>darbuotojo reitingo iškart nemažina</b>. Darbuotojas
                    galės jį patvirtinti arba ginčyti.
                  </div>
                )}

                {attendanceMode === "left_early_agreed" && (
                  <div className="ed-note ok" style={{ marginTop: 14 }}>
                    Suderintas ankstyvas išėjimas darbuotojo patikimumo
                    nemažina. Į statistiką bus įskaitytas tik faktiškai dirbtas
                    laikas.
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 9,
                    marginTop: 18,
                  }}
                >
                  <button
                    className="ed-secondary"
                    disabled={attendanceSaving}
                    onClick={() => {
                      setAttendanceMode("choose");
                      setAttendanceEndTime("");
                      setAttendanceNote("");
                    }}
                  >
                    Grįžti
                  </button>

                  <button
                    className={
                      ["no_show", "left_early_unexcused"].includes(
                        attendanceMode
                      )
                        ? "ed-secondary ed-danger"
                        : "ed-primary"
                    }
                    disabled={
                      attendanceSaving ||
                      (attendanceMode !== "no_show" && !attendanceEndTime) ||
                      (["no_show", "left_early_unexcused"].includes(
                        attendanceMode
                      ) &&
                        attendanceNote.trim().length < 5)
                    }
                    onClick={() =>
                      recordEmployerAttendance(
                        attendanceTarget,
                        attendanceMode,
                        attendanceEndTime || null,
                        attendanceNote
                      )
                    }
                  >
                    {attendanceSaving
                      ? "Saugoma..."
                      : "Patvirtinti rezultatą"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {ratingTarget && (
        <div
          className="rs-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !ratingSaving) {
              setRatingTarget(null);
              setRatingScore(5);
              setRatingComment("");
            }
          }}
        >
          <div className="rs-modal-card">
            <div className="rs-modal-head">
              <div>
                <div className="eyebrow">DARBUOTOJO ĮVERTINIMAS</div>
                <h2>Kaip įvertintumėte {ratingTarget.name}?</h2>
              </div>
              <button
                className="rs-close"
                disabled={ratingSaving}
                onClick={() => {
                  setRatingTarget(null);
                  setRatingScore(5);
                  setRatingComment("");
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                {[1, 2, 3, 4, 5].map((score) => (
                  <button
                    key={score}
                    type="button"
                    className={
                      Number(ratingScore) === score
                        ? "ed-primary"
                        : "ed-secondary"
                    }
                    style={{ minWidth: 48 }}
                    onClick={() => setRatingScore(score)}
                  >
                    {score} ★
                  </button>
                ))}
              </div>
            </div>

            <label className="ed-label">
              Komentaras
              <textarea
                className="ed-textarea"
                maxLength={1000}
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="Trumpas komentaras apie darbą su šiuo darbuotoju."
              />
            </label>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 9,
                marginTop: 18,
              }}
            >
              <button
                className="ed-secondary"
                disabled={ratingSaving}
                onClick={() => {
                  setRatingTarget(null);
                  setRatingScore(5);
                  setRatingComment("");
                }}
              >
                Grįžti
              </button>
              <button
                className="ed-primary"
                disabled={ratingSaving}
                onClick={submitWorkerRating}
              >
                {ratingSaving ? "Saugoma..." : "Išsaugoti įvertinimą"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showReliabilityInfo && (
        <div
          className="reliability-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowReliabilityInfo(false);
          }}
        >
          <style>{`
            .reliability-modal-overlay{
              position:fixed;
              inset:0;
              z-index:3000;
              display:grid;
              place-items:center;
              padding:24px;
              background:rgba(16,36,56,.62);
              backdrop-filter:blur(2px);
              font-family:Inter,sans-serif;
            }
            .reliability-modal{
              width:min(620px,100%);
              max-height:calc(100vh - 48px);
              overflow:auto;
              background:#fff;
              border:1px solid rgba(16,36,56,.08);
              border-radius:20px;
              box-shadow:0 28px 90px rgba(16,36,56,.28);
              padding:26px;
              color:#102438;
            }
            .reliability-modal-head{
              display:flex;
              justify-content:space-between;
              align-items:flex-start;
              gap:18px;
              margin-bottom:20px;
            }
            .reliability-modal-eyebrow{
              color:#f08a28;
              font-size:12px;
              font-weight:800;
              letter-spacing:.08em;
              margin-bottom:7px;
            }
            .reliability-modal h2{
              margin:0;
              font-family:Manrope,Inter,sans-serif;
              font-size:28px;
              line-height:1.15;
              letter-spacing:-.025em;
              color:#102438;
            }
            .reliability-modal-close{
              width:38px;
              height:38px;
              flex:0 0 auto;
              border:0;
              border-radius:10px;
              background:#f1f4f6;
              color:#102438;
              font-family:Inter,sans-serif;
              font-size:22px;
              line-height:1;
              cursor:pointer;
            }
            .reliability-score-box{
              display:flex;
              align-items:center;
              gap:16px;
              padding:15px;
              margin-bottom:20px;
              border:1px solid #e3e9ed;
              border-radius:14px;
              background:#f7f9fa;
            }
            .reliability-score-ring{
              width:64px;
              height:64px;
              flex:0 0 auto;
              border-radius:50%;
              display:grid;
              place-items:center;
            }
            .reliability-score-ring-inner{
              width:49px;
              height:49px;
              border-radius:50%;
              display:grid;
              place-items:center;
              background:#fff;
              box-shadow:inset 0 0 0 1px rgba(16,36,56,.05);
              font-family:Manrope,Inter,sans-serif;
              font-size:15px;
              font-weight:800;
            }
            .reliability-score-copy strong{
              display:block;
              font-family:Manrope,Inter,sans-serif;
              font-size:18px;
              margin-bottom:4px;
            }
            .reliability-score-copy span{
              color:#6c7a88;
              font-size:13px;
              line-height:1.45;
            }
            .reliability-rules{
              display:grid;
              gap:10px;
            }
            .reliability-rule{
              display:grid;
              grid-template-columns:28px 1fr;
              gap:10px;
              align-items:flex-start;
              padding:12px 0;
              border-bottom:1px solid #edf1f4;
            }
            .reliability-rule:last-child{border-bottom:0}
            .reliability-rule-icon{
              width:28px;
              height:28px;
              border-radius:50%;
              display:grid;
              place-items:center;
              background:#f1f4f6;
              font-weight:800;
              font-size:12px;
              color:#425466;
            }
            .reliability-rule p{
              margin:0;
              color:#425466;
              font-size:14px;
              line-height:1.55;
            }
            .reliability-note{
              margin-top:16px;
              padding:13px 14px;
              border-radius:12px;
              background:#fff3e7;
              color:#8a531d;
              font-size:13px;
              line-height:1.5;
            }
            .reliability-modal-actions{
              display:flex;
              justify-content:flex-end;
              margin-top:20px;
            }
            .reliability-modal-actions button{
              border:0;
              border-radius:10px;
              padding:11px 17px;
              background:#f08a28;
              color:#fff;
              font-family:Manrope,Inter,sans-serif;
              font-weight:800;
              cursor:pointer;
            }
            @media(max-width:600px){
              .reliability-modal-overlay{padding:12px}
              .reliability-modal{padding:20px;border-radius:16px;max-height:calc(100vh - 24px)}
              .reliability-modal h2{font-size:23px}
              .reliability-score-box{align-items:flex-start}
            }
          `}</style>

          <div
            className="reliability-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reliability-modal-title"
          >
            <div className="reliability-modal-head">
              <div>
                <div className="reliability-modal-eyebrow">
                  PATIKIMUMO REITINGAS
                </div>
                <h2 id="reliability-modal-title">
                  Kaip veikia darbdavio patikimumas?
                </h2>
              </div>

              <button
                className="reliability-modal-close"
                type="button"
                aria-label="Uždaryti"
                onClick={() => setShowReliabilityInfo(false)}
              >
                ×
              </button>
            </div>

            <div className="reliability-score-box">
              <div className="reliability-score-copy">
                <strong>
                  Dabartinis patikimumas:{" "}
                  {Math.round(employerStats.reliabilityRate)} / 100
                </strong>
                <span>
                  Darbuotojai šį rodiklį mato prieš priimdami jūsų darbo kvietimą.
                </span>
              </div>
            </div>

            <div className="reliability-rules">
              <div className="reliability-rule">
                <div className="reliability-rule-icon">100</div>
                <p>
                  Nauja darbdavio paskyra pradeda nuo <b>100 patikimumo taškų</b>.
                </p>
              </div>

              <div className="reliability-rule">
                <div className="reliability-rule-icon">−10</div>
                <p>
                  Jei darbuotojas jau <b>patvirtino darbą</b>, o darbdavys visą
                  darbą atšaukia, patikimumas sumažėja <b>10 taškų</b>.
                </p>
              </div>

              <div className="reliability-rule">
                <div className="reliability-rule-icon">0</div>
                <p>
                  Pažymėjus „Neatvyko“ ar „Išėjo anksčiau be pateisinamos
                  priežasties“, darbuotojo reitingas <b>nesumažėja iškart</b>.
                  Darbuotojas pirmiausia gali patvirtinti arba ginčyti rezultatą.
                </p>
              </div>

              <div className="reliability-rule">
                <div className="reliability-rule-icon">−20</div>
                <p>
                  Jei ginčas išsprendžiamas darbuotojo naudai ir paaiškėja, kad
                  darbdavio neigiamas pažymėjimas buvo nepagrįstas, darbdavio
                  patikimumas sumažėja <b>20 taškų</b>.
                </p>
              </div>

              <div className="reliability-rule">
                <div className="reliability-rule-icon">i</div>
                <p>
                  Patvirtintų nepagrįstų darbo dienos pažymėjimų istorija
                  saugoma sistemoje. Šiuo metu jų:{" "}
                  <b>{employerStats.falseAttendanceClaimCount}</b>.
                </p>
              </div>
            </div>

            <div className="reliability-note">
              <b>Svarbu:</b> nei darbdavys, nei darbuotojas negali vienašališkai
              sugadinti kitos pusės reitingo ginčytinoje situacijoje. Ginčo metu
              sankcijos sustabdomos iki sprendimo.
            </div>

            <div className="reliability-modal-actions">
              <button
                type="button"
                onClick={() => setShowReliabilityInfo(false)}
              >
                Supratau
              </button>
            </div>
          </div>
        </div>
      )}

      {cancelJobTarget && (
        <div
          className="rs-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !cancellingJob) {
              setCancelJobTarget(null);
              setCancelReason("");
            }
          }}
        >
          <div className="rs-modal-card">
            <style>{`
              .rs-modal-overlay{position:fixed;inset:0;background:rgba(16,36,56,.62);z-index:2100;display:grid;place-items:center;padding:20px}
              .rs-modal-card{width:min(620px,100%);max-height:calc(100vh - 40px);overflow:auto;background:#fff;border-radius:18px;box-shadow:0 26px 80px rgba(16,36,56,.25);padding:22px;color:#102438}
              .rs-modal-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:18px}
              .rs-modal-head h2{margin:0;font-size:22px}
              .rs-close{border:0;background:#f1f4f6;border-radius:9px;width:38px;height:38px;font-size:20px;cursor:pointer}
              .rs-cancel-warning{background:#fff0ec;color:#9f4529;border-radius:12px;padding:14px;line-height:1.5;margin-bottom:16px}
              .rs-cancel-reason{width:100%;min-height:105px;border:1px solid #dbe4ea;border-radius:10px;padding:12px;font:inherit;resize:vertical}
              .rs-cancel-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:16px}
            `}</style>

            <div className="rs-modal-head">
              <div>
                <div className="eyebrow">DARBO ATŠAUKIMAS</div>
                <h2>Ar tikrai norite atšaukti šį darbą?</h2>
              </div>
              <button
                className="rs-close"
                disabled={cancellingJob}
                onClick={() => {
                  setCancelJobTarget(null);
                  setCancelReason("");
                }}
              >
                ×
              </button>
            </div>

            <div className="rs-cancel-warning">
              <b>
                Šį darbą jau patvirtino {cancelJobTarget.confirmedCount}{" "}
                {cancelJobTarget.confirmedCount === 1 ? "darbuotojas" : "darbuotojai"}.
              </b>
              <div style={{ marginTop: 5 }}>
                Atšaukus darbą jų rezervacijos bus panaikintos, pokalbis bus
                uždarytas, o darbuotojai matys jūsų nurodytą atšaukimo priežastį.
              </div>
              <div style={{ marginTop: 5 }}>
                Kadangi darbą jau patvirtino darbuotojas, atšaukimas sumažins
                jūsų darbdavio patikimumo reitingą 10 punktų.
              </div>
            </div>

            <label className="ed-label">
              Atšaukimo priežastis *
              <textarea
                className="rs-cancel-reason"
                value={cancelReason}
                maxLength={500}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Pvz. Užsakovas netikėtai nukėlė darbus į kitą savaitę."
              />
            </label>

            <div
              style={{
                marginTop: 6,
                color: "#6c7a88",
                fontSize: 12,
              }}
            >
              Šią priežastį matys darbą patvirtinę darbuotojai.
            </div>

            <div className="rs-cancel-actions">
              <button
                className="ed-secondary"
                disabled={cancellingJob}
                onClick={() => {
                  setCancelJobTarget(null);
                  setCancelReason("");
                }}
              >
                Ne, grįžti
              </button>
              <button
                className="ed-primary"
                style={{ background: "#b64d2a" }}
                disabled={cancellingJob || cancelReason.trim().length < 5}
                onClick={confirmEmployerCancellation}
              >
                {cancellingJob ? "Atšaukiama..." : "Taip, atšaukti darbą"}
              </button>
            </div>
          </div>
        </div>
      )}

      <WorkerProfileModal
        worker={selectedWorker}
        onClose={() => setSelectedWorker(null)}
      />

      <ConversationModal
        open={Boolean(conversation)}
        onClose={() => setConversation(null)}
        invitationId={conversation?.invitationId}
        title={conversation?.title}
        user={user}
      />
      <GroupConversationModal
        open={Boolean(groupConversation)}
        onClose={() => setGroupConversation(null)}
        jobId={groupConversation?.jobId}
        title={groupConversation?.title}
        user={user}
      />
    </div>
  );
}


function AdminDashboard({ onLogout }) {
  const [loading, setLoading] = useState(true);
  const [disputes, setDisputes] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [resolvingId, setResolvingId] = useState(null);

  useEffect(() => {
    loadDisputes();
    const timer = setInterval(loadDisputes, 10000);
    return () => clearInterval(timer);
  }, []);

  async function loadDisputes() {
    try {
      const result = await supabase.rpc("get_attendance_disputes");
      if (result.error) throw result.error;

      const rows = result.data || [];
      const withEvidence = await Promise.all(
        rows.map(async (row) => {
          if (!row.worker_evidence_path) return row;

          const signedResult = await supabase.storage
            .from("attendance-evidence")
            .createSignedUrl(row.worker_evidence_path, 60 * 60);

          return {
            ...row,
            evidenceUrl: signedResult.error
              ? null
              : signedResult.data?.signedUrl || null,
          };
        })
      );

      setDisputes(withEvidence);
      setError("");
    } catch (err) {
      setError(err?.message || "Nepavyko įkelti darbo dienos ginčų.");
    } finally {
      setLoading(false);
    }
  }

  async function resolveDispute(dispute, resolution) {
    const workerWon = resolution === "worker";
    const finalOutcome = workerWon
      ? dispute.employer_outcome === "no_show"
        ? "full_day"
        : dispute.employer_outcome === "left_early_unexcused"
        ? "left_early_agreed"
        : "full_day"
      : dispute.employer_outcome;

    const actualEndTime = ["left_early_agreed", "left_early_unexcused"].includes(
      finalOutcome
    )
      ? dispute.actual_end_time
      : null;

    const question = workerWon
      ? "Patvirtinti, kad ginčas išspręstas darbuotojo naudai? Jei darbdavio pažymėjimas nepasitvirtino, jo patikimumas sumažės 20 taškų."
      : "Patvirtinti, kad ginčas išspręstas darbdavio naudai? Darbuotojui bus pritaikytas galutinis darbo dienos rezultatas.";

    if (!window.confirm(question)) return;

    setResolvingId(dispute.attendance_id);
    setError("");
    setNotice("");

    try {
      const result = await supabase.rpc("admin_resolve_attendance_dispute", {
        p_attendance_id: dispute.attendance_id,
        p_resolution: resolution,
        p_final_outcome: finalOutcome,
        p_actual_end_time: actualEndTime || null,
        p_note:
          resolution === "worker"
            ? "Ginčas peržiūrėtas ir išspręstas darbuotojo naudai."
            : "Ginčas peržiūrėtas ir išspręstas darbdavio naudai.",
      });

      if (result.error) throw result.error;

      setNotice("Ginčas išspręstas ir abiem pusėms išsiųstas atnaujinimas.");
      await loadDisputes();
    } catch (err) {
      setError(err?.message || "Nepavyko išspręsti ginčo.");
    } finally {
      setResolvingId(null);
    }
  }

  if (loading) {
    return (
      <div className="ed-loading">
        <div className="ed-spinner" />
        <b>Kraunami darbo dienos ginčai...</b>
      </div>
    );
  }

  return (
    <div className="wd-page">
      <style>{`
        .admin-shell{width:min(1050px,calc(100% - 40px));margin:34px auto 70px;color:#102438}
        .admin-head{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:24px}
        .admin-head h1{font-family:Manrope,Inter,sans-serif;margin:3px 0 0;font-size:34px;letter-spacing:-.035em}
        .admin-head p{margin:8px 0 0;color:#6c7a88}
        .admin-list{display:grid;gap:14px}.admin-card{background:#fff;border:1px solid #e4ebf0;border-radius:16px;padding:20px;box-shadow:0 8px 28px rgba(16,36,56,.045)}
        .admin-card-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}.admin-card h2{font-family:Manrope,Inter,sans-serif;margin:0;font-size:20px}
        .admin-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:16px}.admin-fact{background:#f6f8fa;border-radius:11px;padding:12px}.admin-fact span{display:block;color:#6c7a88;font-size:11px;margin-bottom:4px}.admin-fact b{font-size:14px}
        .admin-note{margin-top:12px;padding:12px;border-radius:11px;background:#fff3e7;color:#8a531d;line-height:1.5;font-size:13px}.admin-actions{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;margin-top:16px}
        .admin-ok,.admin-danger{border-radius:9px;padding:10px 13px;font:inherit;font-weight:800;cursor:pointer}.admin-ok{border:0;background:#1c9b67;color:#fff}.admin-danger{border:1px solid #e8bbae;background:#fff;color:#b64d2a}.admin-ok:disabled,.admin-danger:disabled{opacity:.55;cursor:wait}
        @media(max-width:650px){.admin-shell{width:min(100% - 24px,1050px)}.admin-head{align-items:flex-start;flex-direction:column}.admin-grid{grid-template-columns:1fr}.admin-card-head{flex-direction:column}}
      `}</style>

      <header className="wd-topbar">
        <div className="wd-topbar-inner">
          <a className="brand" href="#">
            <span className="logo-mark">⌂</span>
            <span>
              rankos<span>statybose</span>.lt
            </span>
          </a>
          <button className="btn ghost" onClick={onLogout}>
            Atsijungti
          </button>
        </div>
      </header>

      <main className="admin-shell">
        <div className="admin-head">
          <div>
            <div className="eyebrow">ADMINISTRATORIUS</div>
            <h1>Darbo dienos ginčai</h1>
            <p>
              Čia sprendžiamos situacijos, kai darbdavio ir darbuotojo parodymai
              nesutampa. Iki sprendimo darbuotojo reitingas nekeičiamas.
            </p>
          </div>
          <b>{disputes.length} neišspręsta</b>
        </div>

        {notice && <div className="wd-note ok">{notice}</div>}
        {error && <div className="wd-note err">{error}</div>}

        {disputes.length ? (
          <div className="admin-list">
            {disputes.map((dispute) => {
              const busy = resolvingId === dispute.attendance_id;
              return (
                <section className="admin-card" key={dispute.attendance_id}>
                  <div className="admin-card-head">
                    <div>
                      <div className="eyebrow">GINČAS</div>
                      <h2>{dispute.job_title}</h2>
                      <div style={{ color: "#6c7a88", marginTop: 5 }}>
                        {dispute.work_date} ·{" "}
                        {dispute.start_time?.slice(0, 5)}
                        {dispute.end_time
                          ? `–${dispute.end_time.slice(0, 5)}`
                          : ""}
                      </div>
                    </div>
                    <span className="wd-workday-status red">
                      {attendanceOutcomeLabel({
                        employer_outcome: dispute.employer_outcome,
                      })}
                    </span>
                  </div>

                  <div className="admin-grid">
                    <div className="admin-fact">
                      <span>Darbuotojas</span>
                      <b>{dispute.worker_name}</b>
                    </div>
                    <div className="admin-fact">
                      <span>Darbdavys</span>
                      <b>{dispute.company_name}</b>
                    </div>
                    <div className="admin-fact">
                      <span>Darbuotojo „Atvykau“</span>
                      <b>
                        {dispute.worker_check_in_at
                          ? new Date(
                              dispute.worker_check_in_at
                            ).toLocaleString("lt-LT", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })
                          : "Nepažymėta"}
                      </b>
                    </div>
                    <div className="admin-fact">
                      <span>Darbdavio patvirtintas atvykimas</span>
                      <b>
                        {dispute.employer_check_in_at
                          ? new Date(
                              dispute.employer_check_in_at
                            ).toLocaleString("lt-LT", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })
                          : "Nepažymėta"}
                      </b>
                    </div>
                    <div className="admin-fact">
                      <span>Darbdavio faktinis išėjimo laikas</span>
                      <b>
                        {dispute.actual_end_time?.slice(0, 5) || "Nenurodyta"}
                      </b>
                    </div>
                  </div>

                  {dispute.employer_note && (
                    <div className="admin-note">
                      <b>Darbdavio paaiškinimas:</b>{" "}
                      {dispute.employer_note}
                    </div>
                  )}

                  {dispute.worker_response_note && (
                    <div className="admin-note">
                      <b>Darbuotojo paaiškinimas:</b>{" "}
                      {dispute.worker_response_note}
                    </div>
                  )}

                  {dispute.worker_workday_claim === "worked" && (
                    <div className="admin-note">
                      Darbuotojas sistemoje taip pat buvo pažymėjęs, kad{" "}
                      <b>dirbo šiame darbe</b>.
                    </div>
                  )}

                  {dispute.worker_evidence_path && (
                    <div className="admin-note">
                      <b>Darbuotojo pridėtas įrodymas:</b>{" "}
                      {dispute.evidenceUrl ? (
                        <a
                          href={dispute.evidenceUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            color: "#102438",
                            fontWeight: 800,
                            textDecoration: "underline",
                          }}
                        >
                          {dispute.worker_evidence_name || "Atidaryti failą"}
                        </a>
                      ) : (
                        <span>
                          {dispute.worker_evidence_name || "Failas pridėtas"},
                          bet šiuo metu nepavyko sukurti saugios peržiūros nuorodos.
                        </span>
                      )}
                    </div>
                  )}

                  <div className="admin-actions">
                    <button
                      className="admin-danger"
                      disabled={busy}
                      onClick={() => resolveDispute(dispute, "employer")}
                    >
                      Darbdavio naudai
                    </button>
                    <button
                      className="admin-ok"
                      disabled={busy}
                      onClick={() => resolveDispute(dispute, "worker")}
                    >
                      {busy ? "Sprendžiama..." : "Darbuotojo naudai"}
                    </button>
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="wd-card">
            Šiuo metu neišspręstų darbo dienos ginčų nėra.
          </div>
        )}
      </main>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [accountRole, setAccountRole] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authRole, setAuthRole] = useState("worker");

  useEffect(() => {
    if (!supabase) return;

    supabase.auth
      .getSession()
      .then(({ data }) => setUser(data.session?.user ?? null));

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !supabase) {
      setAccountRole(null);
      return;
    }

    let cancelled = false;

    supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()
      .then(({ data, error }) => {
        if (!cancelled) {
          if (error) {
            console.error(error);
            setAccountRole(null);
          } else {
            setAccountRole(data?.role || null);
          }
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const openLogin = () => {
    setAuthMode("login");
    setAuthRole("worker");
    setAuthOpen(true);
  };

  const openEmployerSignup = () => {
    setAuthMode("signup");
    setAuthRole("employer");
    setAuthOpen(true);
  };

  const openWorkerSignup = () => {
    setAuthMode("signup");
    setAuthRole("worker");
    setAuthOpen(true);
  };

  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
  };

  if (user && accountRole === "worker") {
    return <WorkerDashboard user={user} onLogout={logout} />;
  }

  if (user && accountRole === "employer") {
    return <EmployerDashboard user={user} onLogout={logout} />;
  }

  if (user && accountRole === "admin") {
    return <AdminDashboard onLogout={logout} />;
  }

  return (
    <>
      <Header
        onLogin={openLogin}
        onEmployerSignup={openEmployerSignup}
        user={user}
        onLogout={logout}
      />

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        initialMode={authMode}
        initialRole={authRole}
      />

      <main>
        <section className="hero">
          <div className="container hero-grid">
            <div>
              <div className="eyebrow">
                STATYBŲ PAGALBINIAI, KAI JŲ REIKIA
              </div>

              <h1>
                Reikia papildomų
                <br />
                rankų objekte?
              </h1>

              <p className="lead">
                Raskite statybų pagalbinius pagal vietą, datą ir prieinamumą.
                Jokio CV siuntimo, jokio chaoso — tik realiai laisvi
                darbuotojai.
              </p>

              <SearchBox onEmployerSignup={openEmployerSignup} />
            </div>

            <WorkersPanel onEmployerSignup={openEmployerSignup} />
          </div>
        </section>

        <section className="feature-strip">
          <div className="container features">
            <div>
              <Icon>▣</Icon>
              <h3>Darbuotojai žymi savo užimtumą</h3>
              <p>Matote tik tuos, kurie realiai laisvi norimą dieną.</p>
            </div>
            <div>
              <Icon>▥</Icon>
              <h3>Matote atvykimo istoriją</h3>
              <p>Rinkitės patikimus darbuotojus pagal realius duomenis.</p>
            </div>
            <div>
              <Icon>◉</Icon>
              <h3>Kviečiate tik laisvus darbuotojus</h3>
              <p>Nėra nereikalingo susirašinėjimo ir laukimo.</p>
            </div>
            <div>
              <Icon>ϟ</Icon>
              <h3>Greitas pakaitinio suradimas</h3>
              <p>Jei žmogus neatvyksta, pakaitalą randate greičiau.</p>
            </div>
          </div>
        </section>

        <section id="kaip" className="section">
          <div className="container">
            <div className="section-head">
              <div>
                <div className="eyebrow">PAPRASTAS PROCESAS</div>
                <h2>Kaip tai veikia?</h2>
              </div>
            </div>

            <div className="steps">
              <article>
                <span>1</span>
                <h3>Pateikiate poreikį</h3>
                <p>
                  Nurodote miestą, datą, darbo tipą ir kiek žmonių reikia.
                </p>
              </article>
              <article>
                <span>2</span>
                <h3>Gaunate tinkamus darbuotojus</h3>
                <p>
                  Sistema parodo tik tuos, kurie tuo metu laisvi ir atitinka
                  poreikį.
                </p>
              </article>
              <article>
                <span>3</span>
                <h3>Patvirtinate ir pradedate darbus</h3>
                <p>
                  Pakviečiate, gaunate patvirtinimą ir viską valdote vienoje
                  vietoje.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section id="darbdaviams" className="section dashboard-section">
          <div className="container dash-grid">
            <div>
              <div className="eyebrow">DARBDAVIAMS</div>
              <h2>Darbdavio darbo skydelis</h2>
              <p className="lead small-lead">
                Užklausos, darbuotojai ir atvykimo statistika vienoje vietoje.
                Be papildomo administravimo.
              </p>
              <button className="btn primary" onClick={openEmployerSignup}>
                Pateikti užklausą →
              </button>
            </div>

            <div className="dashboard-card">
              <div className="kpis">
                <div>
                  <span>Aktyvūs šiandien</span>
                  <strong>12</strong>
                </div>
                <div>
                  <span>Atviri poreikiai</span>
                  <strong>3</strong>
                </div>
                <div>
                  <span>Vid. atvykimas</span>
                  <strong>96%</strong>
                </div>
              </div>

              <div className="bookings">
                <h3>Artimiausi užsakymai</h3>
                <div className="booking">
                  <b>Rytoj</b>
                  <span>Vilnius · Betonavimo pagalba</span>
                  <em>3 žmonės</em>
                  <i>Patvirtinta</i>
                </div>
                <div className="booking">
                  <b>09-29</b>
                  <span>Kaunas · Medžiagų nešiojimas</span>
                  <em>2 žmonės</em>
                  <i className="pending">Laukiama</i>
                </div>
                <div className="booking">
                  <b>10-01</b>
                  <span>Vilnius · Tvarkymas</span>
                  <em>4 žmonės</em>
                  <i>Patvirtinta</i>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="darbuotojams" className="section">
          <div className="container">
            <div className="section-head">
              <div>
                <div className="eyebrow">DARBUOTOJAMS</div>
                <h2>Registracija darbuotojams nemokama</h2>
                <p>
                  Pažymėkite, kada galite dirbti, ir gaukite tinkamus darbų
                  pasiūlymus.
                </p>
              </div>
              <button className="btn primary" onClick={openWorkerSignup}>
                Registruotis nemokamai
              </button>
            </div>
          </div>
        </section>

        <section id="kainodara" className="section pricing-section">
          <div className="container">
            <div className="section-head">
              <div>
                <div className="eyebrow">KAINODARA</div>
                <h2>Paprasti planai darbdaviams</h2>
              </div>
            </div>

            <div className="pricing">
              <article>
                <h3>Starteris</h3>
                <div className="price">
                  49 €<span>/mėn.</span>
                </div>
                <p>Smulkiems projektams ir pavieniams poreikiams.</p>
                <ul>
                  <li>Iki 5 užklausų / mėn.</li>
                  <li>Darbuotojų paieška</li>
                  <li>El. pašto pagalba</li>
                </ul>
                <button className="btn ghost full" onClick={openEmployerSignup}>
                  Rinktis planą
                </button>
              </article>

              <article className="featured">
                <div className="popular">POPULIARIAUSIAS</div>
                <h3>Profesionalus</h3>
                <div className="price">
                  99 €<span>/mėn.</span>
                </div>
                <p>Įmonėms, kurios darbuotojų ieško reguliariai.</p>
                <ul>
                  <li>Iki 20 užklausų / mėn.</li>
                  <li>Išplėstiniai filtrai</li>
                  <li>Atvykimo istorija</li>
                </ul>
                <button
                  className="btn primary full"
                  onClick={openEmployerSignup}
                >
                  Rinktis planą
                </button>
              </article>

              <article>
                <h3>Verslui</h3>
                <div className="price">
                  199 €<span>/mėn.</span>
                </div>
                <p>Didelėms įmonėms ir keliems objektams.</p>
                <ul>
                  <li>Neribotos užklausos</li>
                  <li>Keli įmonės vartotojai</li>
                  <li>Išplėstinės ataskaitos</li>
                </ul>
                <button
                  className="btn ghost full"
                  onClick={openEmployerSignup}
                >
                  Susisiekti
                </button>
              </article>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="container footer">
          <div className="brand inverse">
            <span className="logo-mark">⌂</span>
            <span>
              rankos<span>statybose</span>.lt
            </span>
          </div>
          <span>Statybų darbuotojai, kai jų reikia.</span>
          <span>© 2026 rankosstatybose.lt</span>
        </div>
      </footer>
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);
