import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import "./styles.css";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const workers = [
  { initials:"TK", name:"Tomas K.", status:"Laisvas rytoj", city:"Vilnius", skills:["Betonavimo pagalba","Medžiagų nešiojimas","Tvarkymas"], attendance:97, transport:true },
  { initials:"MP", name:"Mantas P.", status:"Laisvas rytoj", city:"Vilnius", skills:["Medžiagų nešiojimas","Tvarkymas"], attendance:100, transport:true },
  { initials:"DS", name:"Darius S.", status:"Laisvas šiandien", city:"Vilnius", skills:["Betonavimo pagalba","Krovos darbai"], attendance:94, transport:false },
  { initials:"RK", name:"Rytis K.", status:"Laisvas rytoj", city:"Vilnius", skills:["Tvarkymas","Statybvietės pagalba"], attendance:92, transport:true },
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
        <label>Darbo tipas</label>
        <div className="control">
          ⚒ Betonavimo pagalba <span>⌄</span>
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

                <div className={"transport " + (w.transport ? "yes" : "no")}>
                  {w.transport ? "Turi transportą" : "Neturi"}
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

function WorkerDashboard({ user, onLogout }) {
  const days = nextSevenDays();
  const [tab, setTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [skills, setSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [originalSkills, setOriginalSkills] = useState([]);
  const [form, setForm] = useState({
    displayName: "",
    city: "Vilnius",
    phone: "",
    travelRadius: 30,
    hasTransport: false,
    hasDrivingLicenseB: false,
    yearsExperience: 0,
    shortBio: "",
  });
  const [metrics, setMetrics] = useState({
    attendanceRate: 100,
    completedJobs: 0,
    ratingAverage: null,
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
            "travel_radius_km, has_transport, has_driving_license_b, years_experience, short_bio, attendance_rate, completed_jobs, rating_average"
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

      const results = [
        profileResult,
        privateResult,
        workerResult,
        skillsResult,
        workerSkillsResult,
        availabilityResult,
      ];

      const failed = results.find((result) => result.error);
      if (failed?.error) throw failed.error;

      const profile = profileResult.data;
      const privateData = privateResult.data;
      const worker = workerResult.data;

      setForm({
        displayName: profile?.display_name || "",
        city: profile?.city || "Vilnius",
        phone: privateData?.phone || "",
        travelRadius: worker?.travel_radius_km ?? 30,
        hasTransport: Boolean(worker?.has_transport),
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

  async function saveProfile() {
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
          has_transport: form.hasTransport,
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

      setOriginalSkills([...selectedSkills]);
      setNotice("Profilis išsaugotas.");
    } catch (err) {
      setError(err?.message || "Nepavyko išsaugoti profilio.");
    } finally {
      setSaving(false);
    }
  }

  async function saveAvailability() {
    setSaving(true);
    setNotice("");
    setError("");

    try {
      const rows = days.map((day) => {
        const state = availability[day.iso];
        return {
          worker_id: user.id,
          available_date: day.iso,
          status: state.available ? "available" : "unavailable",
          available_from: state.available ? state.from : null,
          available_to: state.available ? state.to : null,
        };
      });

      const result = await supabase
        .from("availability")
        .upsert(rows, { onConflict: "worker_id,available_date" });

      if (result.error) throw result.error;
      setNotice("Prieinamumas išsaugotas.");
    } catch (err) {
      setError(err?.message || "Nepavyko išsaugoti prieinamumo.");
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
        .wd-topbar-inner{width:min(1180px,calc(100% - 40px));margin:auto;display:flex;align-items:center;justify-content:space-between;gap:24px}
        .wd-shell{width:min(1180px,calc(100% - 40px));margin:32px auto 64px;display:grid;grid-template-columns:230px 1fr;gap:28px;align-items:start}
        .wd-sidebar,.wd-card{background:#fff;border:1px solid #e4ebf0;border-radius:16px;box-shadow:0 8px 28px rgba(16,36,56,.045)}
        .wd-sidebar{padding:18px;position:sticky;top:96px}
        .wd-person{display:flex;align-items:center;gap:12px;padding:4px 4px 18px;border-bottom:1px solid #edf1f4;margin-bottom:14px}
        .wd-avatar{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;background:#102438;color:#fff;font-weight:800}
        .wd-person b{display:block}.wd-person span{font-size:13px;color:#6c7a88}
        .wd-nav{display:grid;gap:6px}.wd-nav button{border:0;background:transparent;text-align:left;padding:11px 12px;border-radius:10px;color:#425466;font:inherit;font-weight:700;cursor:pointer}
        .wd-nav button.active{background:#fff3e7;color:#c96a12}
        .wd-main{display:grid;gap:20px}
        .wd-heading{display:flex;justify-content:space-between;align-items:end;gap:20px}
        .wd-heading h1{margin:3px 0 0;font-size:32px;letter-spacing:-.03em}.wd-heading p{margin:8px 0 0;color:#6c7a88}
        .wd-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
        .wd-kpi{background:#fff;border:1px solid #e4ebf0;border-radius:14px;padding:18px}.wd-kpi span{display:block;font-size:13px;color:#6c7a88;margin-bottom:8px}.wd-kpi b{font-size:25px}
        .wd-card{padding:24px}.wd-card h2{margin:0 0 6px;font-size:22px}.wd-card-sub{margin:0 0 22px;color:#6c7a88}
        .wd-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
        .wd-label{display:grid;gap:7px;font-size:13px;font-weight:700;color:#263b4d}
        .wd-input,.wd-textarea{width:100%;border:1px solid #dbe4ea;border-radius:10px;padding:12px 13px;background:#fff;color:#102438;font:inherit;outline:none}
        .wd-input:focus,.wd-textarea:focus{border-color:#f08a28;box-shadow:0 0 0 3px rgba(240,138,40,.10)}
        .wd-textarea{min-height:92px;resize:vertical}
        .wd-checks{display:flex;gap:18px;flex-wrap:wrap;margin-top:4px}.wd-check{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:700}
        .wd-skills{display:flex;gap:8px;flex-wrap:wrap}.wd-skill{border:1px solid #dfe7ed;background:#fff;color:#425466;border-radius:999px;padding:8px 11px;font:inherit;font-size:13px;font-weight:700;cursor:pointer}
        .wd-skill.on{background:#102438;color:#fff;border-color:#102438}
        .wd-actions{display:flex;justify-content:flex-end;margin-top:22px}
        .wd-save{border:0;border-radius:10px;background:#f08a28;color:#fff;padding:12px 18px;font:inherit;font-weight:800;cursor:pointer}.wd-save:disabled{opacity:.6;cursor:wait}
        .wd-days{display:grid;gap:10px}.wd-day{display:grid;grid-template-columns:135px 1fr 110px 110px;align-items:center;gap:14px;border:1px solid #e4ebf0;border-radius:12px;padding:14px}
        .wd-day-date b{display:block;text-transform:capitalize}.wd-day-date span{font-size:13px;color:#6c7a88}
        .wd-toggle{display:flex;align-items:center;gap:9px;font-weight:700}.wd-toggle input{width:18px;height:18px;accent-color:#1c9b67}
        .wd-time{width:100%;border:1px solid #dbe4ea;border-radius:9px;padding:9px 10px;font:inherit}.wd-time:disabled{background:#f4f6f8;color:#a0aab3}
        .wd-note{border-radius:10px;padding:11px 13px;font-size:14px;font-weight:700}.wd-note.ok{background:#edf8f3;color:#167a54}.wd-note.err{background:#fff0ec;color:#b64d2a}
        .wd-loading{min-height:100vh;display:grid;place-items:center;align-content:center;gap:12px;background:#f6f8fa;color:#102438}.wd-spinner{width:28px;height:28px;border:3px solid #dfe7ed;border-top-color:#f08a28;border-radius:50%;animation:wdspin .8s linear infinite}@keyframes wdspin{to{transform:rotate(360deg)}}
        @media(max-width:820px){.wd-shell{grid-template-columns:1fr}.wd-sidebar{position:static}.wd-nav{grid-template-columns:1fr 1fr}.wd-kpis{grid-template-columns:1fr}.wd-grid-2{grid-template-columns:1fr}.wd-day{grid-template-columns:1fr 1fr}.wd-day-date{grid-column:1/-1}.wd-topbar-inner,.wd-shell{width:min(100% - 24px,1180px)}}
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

      <div className="wd-shell">
        <aside className="wd-sidebar">
          <div className="wd-person">
            <div className="wd-avatar">{initials || "D"}</div>
            <div>
              <b>{form.displayName || "Darbuotojas"}</b>
              <span>{form.city || "Miestas nenurodytas"}</span>
            </div>
          </div>

          <div className="wd-nav">
            <button
              className={tab === "profile" ? "active" : ""}
              onClick={() => {
                setTab("profile");
                setNotice("");
                setError("");
              }}
            >
              Mano profilis
            </button>
            <button
              className={tab === "availability" ? "active" : ""}
              onClick={() => {
                setTab("availability");
                setNotice("");
                setError("");
              }}
            >
              Mano prieinamumas
            </button>
          </div>
        </aside>

        <main className="wd-main">
          <div className="wd-heading">
            <div>
              <div className="eyebrow">DARBUOTOJO PASKYRA</div>
              <h1>
                {tab === "profile" ? "Mano profilis" : "Kada galiu dirbti?"}
              </h1>
              <p>
                {tab === "profile"
                  ? "Užpildykite informaciją, pagal kurią darbdaviai ras tinkamus darbuotojus."
                  : "Pažymėkite dienas, kuriomis realiai galite priimti darbą."}
              </p>
            </div>
          </div>

          <div className="wd-kpis">
            <div className="wd-kpi">
              <span>Atvykimo patikimumas</span>
              <b>{Math.round(metrics.attendanceRate)}%</b>
            </div>
            <div className="wd-kpi">
              <span>Pasirinkti įgūdžiai</span>
              <b>{selectedSkills.length}</b>
            </div>
            <div className="wd-kpi">
              <span>Laisvos dienos per 7 d.</span>
              <b>{availableCount}</b>
            </div>
          </div>

          {notice && <div className="wd-note ok">{notice}</div>}
          {error && <div className="wd-note err">{error}</div>}

          {tab === "profile" ? (
            <>
              <section className="wd-card">
                <h2>Pagrindinė informacija</h2>
                <p className="wd-card-sub">
                  Nuotraukos nereikia — darbdaviai matys jūsų inicialus ir darbo informaciją.
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
                      onChange={(e) =>
                        updateField("yearsExperience", e.target.value)
                      }
                    />
                  </label>
                </div>

                <div className="wd-checks">
                  <label className="wd-check">
                    <input
                      type="checkbox"
                      checked={form.hasTransport}
                      onChange={(e) =>
                        updateField("hasTransport", e.target.checked)
                      }
                    />
                    Turiu savo transportą
                  </label>

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
                <h2>Kokius darbus mokate?</h2>
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

                <div className="wd-actions">
                  <button
                    className="wd-save"
                    disabled={saving}
                    onClick={saveProfile}
                  >
                    {saving ? "Saugoma..." : "Išsaugoti profilį"}
                  </button>
                </div>
              </section>
            </>
          ) : (
            <section className="wd-card">
              <h2>Artimiausios 7 dienos</h2>
              <p className="wd-card-sub">
                Žymėkite tik tas dienas, kuriomis tikrai galėtumėte priimti darbo pasiūlymą.
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

              <div className="wd-actions">
                <button
                  className="wd-save"
                  disabled={saving}
                  onClick={saveAvailability}
                >
                  {saving ? "Saugoma..." : "Išsaugoti prieinamumą"}
                </button>
              </div>
            </section>
          )}
        </main>
      </div>
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
