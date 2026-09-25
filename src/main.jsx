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

function App() {
  const [user, setUser] = useState(null);
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
