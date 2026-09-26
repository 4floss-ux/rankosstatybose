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

const LITHUANIAN_CITY_NAMES = [
  "Akmenė",
  "Alytus",
  "Anykščiai",
  "Ariogala",
  "Avižieniai",
  "Baltoji Vokė",
  "Birštonas",
  "Biržai",
  "Bukiškis",
  "Daugai",
  "Didžioji Riešė",
  "Druskininkai",
  "Dūkštas",
  "Dusetos",
  "Eišiškės",
  "Elektrėnai",
  "Ežerėlis",
  "Gargždai",
  "Garliava",
  "Gelgaudiškis",
  "Grigiškės",
  "Ignalina",
  "Jieznas",
  "Jonava",
  "Joniškėlis",
  "Joniškis",
  "Juodšiliai",
  "Jurbarkas",
  "Kaišiadorys",
  "Kalvarija",
  "Kaunas",
  "Kavarskas",
  "Kazlų Rūda",
  "Kėdainiai",
  "Kelmė",
  "Klaipėda",
  "Kretinga",
  "Kudirkos Naumiestis",
  "Kupiškis",
  "Kuršėnai",
  "Kybartai",
  "Lazdijai",
  "Lentvaris",
  "Linkuva",
  "Maišiagala",
  "Marijampolė",
  "Mažeikiai",
  "Medininkai",
  "Molėtai",
  "Naujoji Akmenė",
  "Nemenčinė",
  "Neringa",
  "Obeliai",
  "Pabradė",
  "Pagėgiai",
  "Pagiriai",
  "Pakruojis",
  "Palanga",
  "Pandėlys",
  "Panemunė",
  "Panevėžys",
  "Pasvalys",
  "Plungė",
  "Priekulė",
  "Prienai",
  "Radviliškis",
  "Ramygala",
  "Raseiniai",
  "Riešė",
  "Rietavas",
  "Rokiškis",
  "Rudamina",
  "Rūdiškės",
  "Šakiai",
  "Salantai",
  "Šalčininkai",
  "Seda",
  "Šeduva",
  "Šiauliai",
  "Šilalė",
  "Šilutė",
  "Simnas",
  "Širvintos",
  "Skaidiškės",
  "Skaudvilė",
  "Skuodas",
  "Smalininkai",
  "Subačius",
  "Sudervė",
  "Švenčionėliai",
  "Švenčionys",
  "Tauragė",
  "Telšiai",
  "Trakai",
  "Troškūnai",
  "Tytuvėnai",
  "Ukmergė",
  "Utena",
  "Užventis",
  "Vabalninkas",
  "Valčiūnai",
  "Varėna",
  "Varniai",
  "Veisiejai",
  "Venta",
  "Viekšniai",
  "Vievis",
  "Vilkaviškis",
  "Vilkija",
  "Vilnius",
  "Virbalis",
  "Visaginas",
  "Žagarė",
  "Zarasai",
  "Žiežmariai",
  "Zujūnai",
];

const STATIC_CITY_OPTIONS = LITHUANIAN_CITY_NAMES.map((name) => ({
  city_key: normalizeCityKey(name),
  name,
}));

let cityLocationsCache = STATIC_CITY_OPTIONS;
let cityLocationsPromise = null;

async function loadCityLocations() {
  if (!supabase) return STATIC_CITY_OPTIONS;

  if (!cityLocationsPromise) {
    cityLocationsPromise = supabase
      .from("city_locations")
      .select("city_key, name, latitude, longitude")
      .order("name")
      .then(({ data, error }) => {
        if (error || !data?.length) {
          return STATIC_CITY_OPTIONS;
        }

        const merged = new Map(
          STATIC_CITY_OPTIONS.map((city) => [city.city_key, city])
        );

        for (const city of data) {
          merged.set(city.city_key, city);
        }

        cityLocationsCache = [...merged.values()].sort((a, b) =>
          a.name.localeCompare(b.name, "lt")
        );

        return cityLocationsCache;
      })
      .catch(() => STATIC_CITY_OPTIONS)
      .finally(() => {
        cityLocationsPromise = null;
      });
  }

  return cityLocationsPromise;
}

async function canonicalCityName(value) {
  const key = normalizeCityKey(value);
  if (!key) return null;

  const staticMatch = STATIC_CITY_OPTIONS.find(
    (city) =>
      city.city_key === key ||
      normalizeCityKey(city.name) === key
  );

  if (staticMatch) return staticMatch.name;

  const cities = await loadCityLocations();
  const match = cities.find(
    (city) =>
      city.city_key === key ||
      normalizeCityKey(city.name) === key
  );

  return match?.name || null;
}

function CityAutocomplete({
  value,
  onChange,
  className = "",
  style,
  disabled = false,
  placeholder = "Pradėkite rašyti miestą",
}) {
  const [cities, setCities] = useState(cityLocationsCache);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadCityLocations().then((rows) => {
      if (!cancelled && rows?.length) {
        setCities(rows);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const query = normalizeCityKey(value);

  const exactMatch = cities.some(
    (city) =>
      city.city_key === query ||
      normalizeCityKey(city.name) === query
  );

  const suggestions = cities
    .filter((city) => {
      if (!query) return true;
      const cityKey = normalizeCityKey(city.name);
      return cityKey.includes(query);
    })
    .sort((a, b) => {
      if (!query) return a.name.localeCompare(b.name, "lt");

      const aKey = normalizeCityKey(a.name);
      const bKey = normalizeCityKey(b.name);
      const aStarts = aKey.startsWith(query) ? 0 : 1;
      const bStarts = bKey.startsWith(query) ? 0 : 1;

      if (aStarts !== bStarts) return aStarts - bStarts;
      return a.name.localeCompare(b.name, "lt");
    })
    .slice(0, 12);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        zIndex: open ? 8000 : "auto",
      }}
    >
      <input
        className={className}
        style={style}
        value={value}
        disabled={disabled}
        autoComplete="off"
        placeholder={placeholder}
        onFocus={() => {
          if (!disabled) setOpen(true);
        }}
        onMouseDown={() => {
          if (!disabled) setOpen(true);
        }}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setOpen(false);
          }

          if (e.key === "Enter" && suggestions.length === 1) {
            e.preventDefault();
            onChange(suggestions[0].name);
            setOpen(false);
          }
        }}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 180);
        }}
      />

      {open && !disabled && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            zIndex: 8001,
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            maxHeight: 270,
            overflowY: "auto",
            background: "#fff",
            border: "1px solid #d6e0e7",
            borderRadius: 11,
            boxShadow: "0 16px 42px rgba(16,36,56,.20)",
            padding: 5,
          }}
        >
          {suggestions.length ? (
            suggestions.map((city) => (
              <button
                key={city.city_key}
                type="button"
                role="option"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(city.name);
                  setOpen(false);
                }}
                style={{
                  display: "block",
                  width: "100%",
                  border: 0,
                  background:
                    normalizeCityKey(value) === city.city_key
                      ? "#eef3f6"
                      : "#fff",
                  color: "#102438",
                  textAlign: "left",
                  borderRadius: 8,
                  padding: "10px 11px",
                  font: "inherit",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {city.name}
              </button>
            ))
          ) : (
            <div
              style={{
                padding: "10px 11px",
                color: "#6c7a88",
                fontSize: 13,
              }}
            >
              Tokio miesto sąraše nėra.
            </div>
          )}
        </div>
      )}

      {!!value && !exactMatch && (
        <div
          style={{
            marginTop: 5,
            color: "#b85f0e",
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          Pasirinkite miestą iš pasiūlymų sąrašo.
        </div>
      )}
    </div>
  );
}

function AuthModal({
  open,
  onClose,
  initialMode = "login",
  initialRole = "worker",
  teamInvite = null,
}) {
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
      setRole(teamInvite ? "employer" : initialRole);
      setMessage("");
      setSuccess(false);

      if (teamInvite) {
        setForm((current) => ({
          ...current,
          name: teamInvite.invited_name || current.name,
          email: teamInvite.email || current.email,
        }));
      }
    }
  }, [open, initialMode, initialRole, teamInvite]);

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

        if (
          role === "employer" &&
          !teamInvite &&
          !form.companyName.trim()
        ) {
          throw new Error("Įveskite įmonės pavadinimą.");
        }

        const canonicalCity = await canonicalCityName(form.city);
        if (!canonicalCity) {
          throw new Error("Pasirinkite miestą iš pasiūlymų sąrašo.");
        }

        const { data, error } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: {
            emailRedirectTo: teamInvite?.token
              ? companyTeamInviteLink(teamInvite.token)
              : window.location.origin,
            data: {
              role: teamInvite ? "employer" : role,
              display_name: form.name.trim(),
              legal_name: form.name.trim(),
              city: canonicalCity,
              phone: form.phone.trim(),
              company_name:
                role === "employer" && !teamInvite
                  ? form.companyName.trim()
                  : "",
              company_code:
                role === "employer" && !teamInvite
                  ? form.companyCode.trim()
                  : "",
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

        {mode === "signup" && !teamInvite && (
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
                  <CityAutocomplete
                    style={inputStyle}
                    value={form.city}
                    onChange={(value) =>
                      setForm((current) => ({ ...current, city: value }))
                    }
                    placeholder="Pradėkite rašyti miestą"
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

              {role === "employer" && !teamInvite && (
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
              readOnly={Boolean(teamInvite)}
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


function TeamInvitePage({
  invite,
  loading,
  error,
  user,
  accepting,
  onLogin,
  onSignup,
  onAccept,
  onCancel,
}) {
  const valid = Boolean(invite?.valid);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f6f8fa",
        display: "grid",
        placeItems: "center",
        padding: 20,
        color: "#102438",
      }}
    >
      <div
        style={{
          width: "min(640px,100%)",
          background: "#fff",
          border: "1px solid #e4ebf0",
          borderRadius: 20,
          boxShadow: "0 24px 70px rgba(16,36,56,.10)",
          padding: 28,
        }}
      >
        <a
          className="brand"
          href="/"
          style={{ display: "inline-flex", marginBottom: 26 }}
        >
          <span className="logo-mark">⌂</span>
          <span>
            rankos<span>statybose</span>.lt
          </span>
        </a>

        <div className="eyebrow">ĮMONĖS KOMANDOS KVIETIMAS</div>

        {loading ? (
          <div style={{ padding: "28px 0", color: "#6c7a88" }}>
            Tikrinamas kvietimas...
          </div>
        ) : error || !invite ? (
          <>
            <h1 style={{ margin: "6px 0 10px", fontSize: 30 }}>
              Kvietimo atidaryti nepavyko
            </h1>
            <p style={{ color: "#6c7a88", lineHeight: 1.6 }}>
              {error || "Kvietimo nuoroda nerasta."}
            </p>
            <button className="btn ghost" type="button" onClick={onCancel}>
              Grįžti į pradžią
            </button>
          </>
        ) : !valid ? (
          <>
            <h1 style={{ margin: "6px 0 10px", fontSize: 30 }}>
              Kvietimas nebegalioja
            </h1>
            <p style={{ color: "#6c7a88", lineHeight: 1.6 }}>
              Paprašykite įmonės savininko atsiųsti naują komandos kvietimą.
            </p>
            <button className="btn ghost" type="button" onClick={onCancel}>
              Grįžti į pradžią
            </button>
          </>
        ) : (
          <>
            <h1 style={{ margin: "6px 0 10px", fontSize: 30 }}>
              {invite.company_name} kviečia prisijungti
            </h1>

            <p style={{ color: "#6c7a88", lineHeight: 1.6 }}>
              Jums paruošta atskira darbdavio paskyra. Prisijungę dirbsite kaip{" "}
              <b style={{ color: "#102438" }}>
                {invite.invited_name} · {invite.company_name}
              </b>
              .
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                margin: "20px 0",
              }}
            >
              <div
                style={{
                  background: "#f6f8fa",
                  borderRadius: 12,
                  padding: 14,
                }}
              >
                <span
                  style={{ display: "block", color: "#7a8996", fontSize: 11 }}
                >
                  EL. PAŠTAS
                </span>
                <b style={{ display: "block", marginTop: 5 }}>
                  {invite.email}
                </b>
              </div>

              <div
                style={{
                  background: "#f6f8fa",
                  borderRadius: 12,
                  padding: 14,
                }}
              >
                <span
                  style={{ display: "block", color: "#7a8996", fontSize: 11 }}
                >
                  ROLĖ
                </span>
                <b style={{ display: "block", marginTop: 5 }}>
                  {companyTeamRoleLabel(invite.member_role)}
                </b>
              </div>
            </div>

            {!user ? (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button className="btn primary" type="button" onClick={onSignup}>
                  Sukurti paskyrą
                </button>
                <button className="btn ghost" type="button" onClick={onLogin}>
                  Jau turiu paskyrą
                </button>
              </div>
            ) : (
              <>
                {String(user.email || "").toLowerCase() !==
                  String(invite.email || "").toLowerCase() && (
                  <div
                    style={{
                      background: "#fff0ec",
                      color: "#9f4529",
                      borderRadius: 10,
                      padding: 12,
                      marginBottom: 14,
                      lineHeight: 1.5,
                    }}
                  >
                    Šis kvietimas skirtas <b>{invite.email}</b>, o dabar
                    prisijungta kaip <b>{user.email}</b>.
                  </div>
                )}

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    className="btn primary"
                    type="button"
                    disabled={
                      accepting ||
                      String(user.email || "").toLowerCase() !==
                        String(invite.email || "").toLowerCase()
                    }
                    onClick={onAccept}
                  >
                    {accepting ? "Jungiama..." : "Prisijungti prie komandos"}
                  </button>
                  <button className="btn ghost" type="button" onClick={onCancel}>
                    Atšaukti
                  </button>
                </div>
              </>
            )}
          </>
        )}
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

function ConversationModal({
  open,
  onClose,
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

  useEffect(() => {
    if (open && invitationId) loadMessages();
  }, [open, invitationId, senderMode]);

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


function GroupConversationModal({
  open,
  onClose,
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

  useEffect(() => {
    if (!open || !jobId) return;

    loadMessages();
    const timer = setInterval(loadMessages, 3000);
    return () => clearInterval(timer);
  }, [open, jobId, senderMode]);

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
          {senderMode === "worker"
            ? "Rašote darbuotojo režimu. Žinutė bus rodoma jūsų darbuotojo vardu."
            : senderMode === "employer"
            ? "Rašote darbdavio režimu. Žinutė bus rodoma jūsų įmonės vardu."
            : "Šį pokalbį mato darbdavys ir visi šį darbą patvirtinę darbuotojai."}
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


function CompanyTeamChatModal({
  open,
  onClose,
  companyId,
  companyName,
  user,
}) {
  const [messages, setMessages] = useState([]);
  const [textValue, setTextValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !companyId) return;

    loadMessages();
    const timer = setInterval(loadMessages, 3000);
    return () => clearInterval(timer);
  }, [open, companyId]);

  async function loadMessages() {
    if (!messages.length) setLoading(true);
    setError("");

    try {
      const result = await supabase.rpc("get_company_team_messages", {
        p_company_id: companyId,
      });

      if (result.error) throw result.error;
      setMessages(result.data || []);
    } catch (err) {
      setError(err?.message || "Nepavyko įkelti komandos pokalbio.");
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
          .ctc-overlay{position:fixed;inset:0;z-index:9600;background:rgba(16,36,56,.64);display:grid;place-items:center;padding:20px}
          .ctc-modal{width:min(700px,100%);max-height:calc(100vh - 40px);display:flex;flex-direction:column;background:#fff;border-radius:20px;box-shadow:0 28px 90px rgba(16,36,56,.3);padding:22px;color:#102438}
          .ctc-head{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;margin-bottom:14px}
          .ctc-head h2{margin:3px 0 5px;font-family:Manrope,Inter,sans-serif;font-size:24px}
          .ctc-head p{margin:0;color:#6c7a88;font-size:13px;line-height:1.45}
          .ctc-close{width:38px;height:38px;border:0;border-radius:10px;background:#f1f4f6;color:#102438;font-size:21px;cursor:pointer;flex:0 0 auto}
          .ctc-note{background:#edf8f3;color:#167a54;border-radius:11px;padding:10px 12px;font-size:12px;line-height:1.45;margin-bottom:12px}
          .ctc-error{background:#fff0ec;color:#b64d2a;border-radius:10px;padding:10px 12px;font-size:12px;margin-bottom:10px}
          .ctc-messages{display:grid;gap:10px;min-height:260px;max-height:430px;overflow:auto;padding:4px 2px 14px}
          .ctc-empty{text-align:center;color:#7a8996;padding:52px 14px;font-size:13px}
          .ctc-message{max-width:82%;padding:10px 12px;border-radius:13px;background:#f2f5f7}
          .ctc-message.mine{margin-left:auto;background:#fff3e7}
          .ctc-message b{display:block;font-size:12px;margin-bottom:4px}
          .ctc-role{font-weight:600;color:#7a8996}
          .ctc-message p{margin:0;white-space:pre-wrap;line-height:1.48}
          .ctc-message time{display:block;margin-top:5px;color:#8a98a6;font-size:10px}
          .ctc-form{display:grid;grid-template-columns:1fr auto;gap:8px;border-top:1px solid #e4ebf0;padding-top:14px}
          .ctc-form textarea{min-height:50px;max-height:130px;resize:vertical;border:1px solid #dbe4ea;border-radius:11px;padding:11px 12px;font:inherit}
          .ctc-form button{border:0;border-radius:10px;background:#f08a28;color:#fff;padding:0 18px;font:inherit;font-weight:800;cursor:pointer}
          .ctc-form button:disabled{opacity:.55;cursor:not-allowed}
          @media(max-width:620px){.ctc-overlay{padding:10px}.ctc-modal{max-height:calc(100vh - 20px);padding:17px}.ctc-head h2{font-size:21px}.ctc-message{max-width:92%}.ctc-form{grid-template-columns:1fr}.ctc-form button{min-height:42px}}
        `}</style>

        <div className="ctc-head">
          <div>
            <div className="eyebrow">BUSINESS PRO · KOMANDOS POKALBIS</div>
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
            ×
          </button>
        </div>

        <div className="ctc-note">
          Čia galite tartis dėl darbų, darbuotojų, pamainų ar atsakomybių
          neišeidami į Messenger, WhatsApp ar kitą programėlę.
        </div>

        {error && <div className="ctc-error">{error}</div>}

        <div className="ctc-messages">
          {loading && !messages.length ? (
            <div className="ctc-empty">Kraunamas komandos pokalbis...</div>
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
                <b>
                  {message.sender_label || "Komandos narys"}{" "}
                  <span className="ctc-role">
                    · {companyTeamRoleLabel(message.sender_role)}
                  </span>
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
            <div className="ctc-empty">
              Komandos pokalbis dar tuščias. Parašykite pirmą žinutę.
            </div>
          )}
        </div>

        <form className="ctc-form" onSubmit={sendMessage}>
          <textarea
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            maxLength={2000}
            placeholder="Parašykite komandai..."
          />
          <button disabled={sending || !textValue.trim()}>
            {sending ? "Siunčiama..." : "Siųsti"}
          </button>
        </form>
      </div>
    </div>
  );
}

function WorkerProfileModal({ worker, onClose }) {
  const [ratingReviews, setRatingReviews] = useState([]);
  const [ratingReviewsLoading, setRatingReviewsLoading] = useState(false);

  useEffect(() => {
    if (!worker?.id) {
      setRatingReviews([]);
      return;
    }

    let cancelled = false;

    async function loadRatingReviews() {
      setRatingReviewsLoading(true);

      const result = await supabase
        .from("worker_ratings")
        .select("id, score, comment, created_at")
        .eq("worker_id", worker.id)
        .order("created_at", { ascending: false });

      if (!cancelled) {
        setRatingReviews(result.error ? [] : result.data || []);
        setRatingReviewsLoading(false);
      }
    }

    loadRatingReviews();

    return () => {
      cancelled = true;
    };
  }, [worker?.id]);

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
          .rs-review-list{display:grid;gap:10px;margin-top:10px}.rs-review{border:1px solid #e4ebf0;border-radius:12px;padding:13px;background:#f8fafb}.rs-review-head{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:7px}.rs-review-score{font-family:Manrope,Inter,sans-serif;font-size:17px;font-weight:800}.rs-review-date{font-size:11px;color:#8a98a6}.rs-review p{margin:0;color:#4f6070;line-height:1.5;white-space:pre-wrap}
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
                : `${Number(ratingAverage).toFixed(1)} / 10`}
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

        <div className="rs-profile-section">
          <b>Darbdavių atsiliepimai</b>

          {ratingReviewsLoading ? (
            <div style={{ marginTop: 10, color: "#6c7a88" }}>
              Kraunami atsiliepimai...
            </div>
          ) : ratingReviews.length ? (
            <div className="rs-review-list">
              {ratingReviews.map((review) => (
                <div className="rs-review" key={review.id}>
                  <div className="rs-review-head">
                    <span className="rs-review-score">
                      {review.score} / 10
                    </span>
                    <span className="rs-review-date">
                      {new Date(review.created_at).toLocaleDateString("lt-LT")}
                    </span>
                  </div>

                  <p>
                    {review.comment?.trim()
                      ? review.comment
                      : "Darbdavys komentaro nepaliko."}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ marginTop: 10, color: "#6c7a88" }}>
              Dar nėra darbdavių atsiliepimų.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WorkerDashboard({ user, onLogout, onAdminReturn = null }) {
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
  const [needsAvailabilityConfirm, setNeedsAvailabilityConfirm] = useState(false);
  const [confirmingAvailability, setConfirmingAvailability] = useState(false);
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

  useEffect(() => {
    const timer = window.setInterval(async () => {
      try {
        await supabase.rpc("worker_touch_activity");
      } catch {
        // Aktyvumo atnaujinimas neturi trukdyti naudotis paskyra.
      }
    }, 30 * 60 * 1000);

    return () => window.clearInterval(timer);
  }, [user.id]);

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const activityResult = await supabase.rpc("worker_touch_activity");
      if (activityResult.error) throw activityResult.error;

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
            "travel_radius_km, has_driving_license_b, years_experience, short_bio, attendance_rate, completed_jobs, rating_average, rating_count, no_show_count, restricted_until, last_active_at, availability_confirmed_at"
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

      const availabilityConfirmedAt = worker?.availability_confirmed_at
        ? new Date(worker.availability_confirmed_at).getTime()
        : 0;
      const activityWindowMs = 72 * 60 * 60 * 1000;

      setNeedsAvailabilityConfirm(
        !availabilityConfirmedAt ||
          Date.now() - availabilityConfirmedAt > activityWindowMs
      );

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

  async function confirmCurrentAvailability() {
    setConfirmingAvailability(true);
    setNotice("");
    setError("");

    try {
      const result = await supabase.rpc("worker_confirm_availability");
      if (result.error) throw result.error;

      setNeedsAvailabilityConfirm(false);
      setNotice(
        "Grafikas patvirtintas. Darbdaviai vėl gali matyti jūsų profilį paieškoje."
      );
    } catch (err) {
      setError(err?.message || "Nepavyko patvirtinti grafiko.");
    } finally {
      setConfirmingAvailability(false);
    }
  }

  async function saveEverything() {
    setSaving(true);
    setNotice("");
    setError("");

    try {
      const canonicalCity = await canonicalCityName(form.city);
      if (!canonicalCity) {
        throw new Error("Pasirinkite miestą iš pasiūlymų sąrašo.");
      }

      const profileUpdate = await supabase
        .from("profiles")
        .update({
          display_name: form.displayName.trim(),
          city: canonicalCity,
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

      const confirmResult = await supabase.rpc("worker_confirm_availability");
      if (confirmResult.error) throw confirmResult.error;

      setNeedsAvailabilityConfirm(false);
      setOriginalSkills([...selectedSkills]);
      setForm((current) => ({ ...current, city: canonicalCity }));
      setShowProfileEditor(false);
      setNotice("Profilio informacija atnaujinta.");
    } catch (err) {
      setError(err?.message || "Nepavyko išsaugoti duomenų.");
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
        .wd-profile-editor{background:#fff;border:1px solid #e4ebf0;border-radius:16px;padding:22px;box-shadow:0 8px 28px rgba(16,36,56,.045);margin-bottom:22px}
        .wd-profile-editor-head{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;margin-bottom:4px}
        .wd-profile-editor-head h2{font-family:Manrope,Inter,sans-serif;margin:3px 0 0;font-size:22px}
        .wd-profile-editor-head p{margin:6px 0 0;color:#6c7a88;line-height:1.5}
        .wd-profile-editor-close{border:0;background:#f1f4f6;color:#102438;border-radius:9px;width:38px;height:38px;flex:0 0 38px;font:inherit;font-size:20px;cursor:pointer}
        .wd-profile-editor-section{padding:20px 0;border-top:1px solid #e8edf1}
        .wd-profile-editor-section:first-of-type{margin-top:16px}
        .wd-profile-editor-section h3{margin:0 0 6px;font-family:Manrope,Inter,sans-serif;font-size:17px}
        .wd-profile-editor-section>p{margin:0 0 14px;color:#6c7a88;font-size:13px;line-height:1.5}
        .wd-profile-editor-check{align-content:end;min-height:44px;padding-bottom:9px}
        .wd-profile-editor-actions{display:flex;justify-content:flex-end;gap:9px;padding-top:2px}
        .wd-profile-editor-cancel{border:1px solid #dbe4ea;background:#fff;color:#102438;border-radius:10px;padding:11px 14px;font:inherit;font-weight:800;cursor:pointer}
        .wd-profile-editor-cancel:disabled,.wd-profile-editor-close:disabled{opacity:.55;cursor:wait}
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
        .wd-availability-alert{display:flex;justify-content:space-between;align-items:center;gap:18px;background:#fff8ed;border:1px solid #f1cf9e;border-radius:14px;padding:16px 18px;margin-bottom:20px}
        .wd-availability-alert b{display:block;font-family:Manrope,Inter,sans-serif;font-size:15px;color:#8a531d;margin-bottom:4px}
        .wd-availability-alert span{display:block;color:#6f5a42;font-size:13px;line-height:1.5;max-width:650px}
        .wd-availability-alert-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;flex:0 0 auto}
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
          .wd-availability-alert{align-items:stretch;flex-direction:column}
          .wd-availability-alert-actions{justify-content:flex-start}
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
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            {onAdminReturn && (
              <button
                className="btn ghost"
                type="button"
                onClick={onAdminReturn}
              >
                ← Administravimas
              </button>
            )}
            <button className="btn ghost" onClick={onLogout}>
              Atsijungti
            </button>
          </div>
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
              {showProfileEditor
                ? "Uždaryti redagavimą"
                : "Tvarkyti mano informaciją"}
            </button>
          </div>
        </div>

        {showProfileEditor && (
          <section className="wd-profile-editor">
            <div className="wd-profile-editor-head">
              <div>
                <div className="eyebrow">MANO INFORMACIJA</div>
                <h2>Tvarkyti mano informaciją</h2>
                <p>
                  Atnaujinkite savo profilį, įgūdžius ir laiką, kada galite
                  priimti darbo pasiūlymus.
                </p>
              </div>

              <button
                className="wd-profile-editor-close"
                type="button"
                disabled={saving}
                onClick={() => setShowProfileEditor(false)}
                aria-label="Uždaryti"
              >
                ×
              </button>
            </div>

            <div className="wd-profile-editor-section">
              <h3>Pagrindinė informacija</h3>

              <div className="wd-grid-2">
                <label className="wd-label">
                  Vardas
                  <input
                    className="wd-input"
                    value={form.displayName}
                    onChange={(e) =>
                      updateField("displayName", e.target.value)
                    }
                  />
                </label>

                <label className="wd-label">
                  Miestas
                  <CityAutocomplete
                    className="wd-input"
                    value={form.city}
                    onChange={(value) => updateField("city", value)}
                    placeholder="Pradėkite rašyti miestą"
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
                    onChange={(e) =>
                      updateField("travelRadius", e.target.value)
                    }
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

                <label className="wd-check wd-profile-editor-check">
                  <input
                    type="checkbox"
                    checked={form.hasDrivingLicenseB}
                    onChange={(e) =>
                      updateField("hasDrivingLicenseB", e.target.checked)
                    }
                  />
                  Turiu B kategorijos vairuotojo pažymėjimą
                </label>
              </div>

              <label className="wd-label" style={{ marginTop: 16 }}>
                Trumpai apie patirtį
                <textarea
                  className="wd-textarea"
                  value={form.shortBio}
                  onChange={(e) => updateField("shortBio", e.target.value)}
                  placeholder="Pvz. 2 metus dirbau statybų pagalbiniu, moku naudotis pagrindiniais elektriniais įrankiais."
                />
              </label>
            </div>

            <div className="wd-profile-editor-section">
              <h3>Kokius darbus mokate?</h3>
              <p>
                Pasirinkite visus darbus, kuriuos galite atlikti arba kuriuose
                galite padėti.
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
            </div>

            <div className="wd-profile-editor-section">
              <h3>Kada galite dirbti?</h3>
              <p>
                Pažymėkite artimiausias dienas, kuriomis realiai galite priimti
                darbo pasiūlymą.
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
                          updateAvailability(day.iso, {
                            from: e.target.value,
                          })
                        }
                      />

                      <input
                        className="wd-time"
                        type="time"
                        disabled={!state.available}
                        value={state.to}
                        onChange={(e) =>
                          updateAvailability(day.iso, {
                            to: e.target.value,
                          })
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="wd-profile-editor-actions">
              <button
                className="wd-profile-editor-cancel"
                type="button"
                disabled={saving}
                onClick={() => setShowProfileEditor(false)}
              >
                Atšaukti
              </button>

              <button
                className="wd-save"
                type="button"
                disabled={saving}
                onClick={saveEverything}
              >
                {saving ? "Saugoma..." : "Išsaugoti"}
              </button>
            </div>
          </section>
        )}

        {needsAvailabilityConfirm && (
          <div className="wd-availability-alert">
            <div>
              <b>Patvirtinkite, kad jūsų grafikas vis dar galioja</b>
              <span>
                Kol grafikas nepatvirtintas, darbdaviai jūsų nemato naujų
                darbuotojų paieškoje. Tai padeda rodyti tik realiai aktyvius
                žmones.
              </span>
            </div>

            <div className="wd-availability-alert-actions">
              <button
                className="wd-profile-editor-cancel"
                type="button"
                disabled={confirmingAvailability}
                onClick={() => setShowProfileEditor(true)}
              >
                Keisti grafiką
              </button>

              <button
                className="wd-save"
                type="button"
                disabled={confirmingAvailability}
                onClick={confirmCurrentAvailability}
              >
                {confirmingAvailability
                  ? "Patvirtinama..."
                  : "Patvirtinti dabartinį grafiką"}
              </button>
            </div>
          </div>
        )}

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
                  : `${metrics.ratingAverage.toFixed(1)} / 10`}
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
        senderMode={onAdminReturn ? "worker" : null}
      />

      <GroupConversationModal
        open={Boolean(groupConversation)}
        onClose={() => setGroupConversation(null)}
        jobId={groupConversation?.jobId}
        title={groupConversation?.title}
        user={user}
        senderMode={onAdminReturn ? "worker" : null}
      />
    </div>
  );
}


const EMPLOYER_PLANS = [
  {
    key: "basic",
    name: "Basic",
    price: 0,
    description:
      "Nemokamas planas įmonei, kuri nori išbandyti darbuotojų paiešką.",
    features: [
      "Iki 5 darbo pasiūlymų per mėnesį",
      "Darbuotojų paieška ir kvietimai",
      "Darbuotojų patikimumas ir įvertinimai",
      "1 įmonės vartotojas",
    ],
  },
  {
    key: "business",
    name: "Business",
    price: 29,
    description:
      "Vienam įmonės atsakingam žmogui, kuris darbuotojų ieško reguliariai.",
    features: [
      "Viskas, kas yra Basic plane",
      "Iki 25 darbo pasiūlymų per mėnesį",
      "Privatūs ir bendri darbo pokalbiai",
      "Išplėstinė įmonės statistika",
      "1 įmonės vartotojas",
    ],
  },
  {
    key: "business_pro",
    name: "Business Pro",
    price: 59,
    description:
      "Business planas + pilnas darbų paskirstymas keliems įmonės žmonėms.",
    features: [
      "Viskas, kas yra Business plane",
      "Neribotas darbo pasiūlymų skaičius",
      "Iki 5 atskirų įmonės vartotojų",
      "Savininko, vadovo ir vadybininko rolės",
      "„Mano darbai“ ir „Visi įmonės darbai“",
      "Atsakingo žmogaus priskyrimas ir darbų perskirstymas",
      "Atskira vadybininko darbų statistika",
      "Vidinis įmonės komandos pokalbis platformoje",
      "Žinutėse aiškiai rodoma, kuris įmonės žmogus rašo",
    ],
  },
];

function employerPlanName(key) {
  return (
    EMPLOYER_PLANS.find((item) => item.key === key)?.name || "Basic"
  );
}

function employerSubscriptionStatusLabel(status) {
  if (status === "trialing") return "Bandomasis laikotarpis";
  if (status === "past_due") return "Laukiama apmokėjimo";
  if (status === "cancelled") return "Nutraukta";
  return "Aktyvus";
}

function companyTeamRoleLabel(role) {
  if (role === "owner") return "Savininkas";
  if (role === "manager") return "Vadovas";
  return "Vadybininkas";
}

function companyTeamInviteLink(token) {
  if (!token) return "";
  return `${window.location.origin}${window.location.pathname}?team_invite=${encodeURIComponent(
    token
  )}`;
}


function employerTomorrowISO() {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + 1);
  return localDateISO(date);
}

function workerRecentActivityLabel(value) {
  if (!value) return "";

  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "";

  const hours = Math.max(0, (Date.now() - timestamp) / (60 * 60 * 1000));

  if (hours < 24) return "Aktyvus šiandien";
  if (hours < 48) return "Aktyvus vakar";
  return "Aktyvus per 3 d.";
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

function EmployerDashboard({ user, onLogout, onAdminReturn = null }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);
  const [company, setCompany] = useState(null);
  const [companyMemberRole, setCompanyMemberRole] = useState(null);
  const [showCompanyEditor, setShowCompanyEditor] = useState(false);
  const [companySaving, setCompanySaving] = useState(false);
  const [planSummary, setPlanSummary] = useState(null);
  const [showPlans, setShowPlans] = useState(false);
  const [planActionBusy, setPlanActionBusy] = useState(false);
  const [showTeam, setShowTeam] = useState(false);
  const [showTeamChat, setShowTeamChat] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamInvites, setTeamInvites] = useState([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamActionBusy, setTeamActionBusy] = useState(false);
  const [lastTeamInviteLink, setLastTeamInviteLink] = useState("");
  const [jobScope, setJobScope] = useState("mine");
  const [teamInviteForm, setTeamInviteForm] = useState({
    displayName: "",
    email: "",
    memberRole: "recruiter",
  });
  const [companyForm, setCompanyForm] = useState({
    name: "",
    companyCode: "",
    city: "",
    phone: "",
    description: "",
  });
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
  const [ratingScore, setRatingScore] = useState(null);
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
    responsibleUserId: user.id,
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
          loadEmployerStats(company.id, companyMemberRole),
        ]);

        if (currentJob?.id) {
          await loadCurrentJobWorkers(currentJob.id);

          const [jobResult, bookingResult, invitationsResult] = await Promise.all([
            supabase
              .from("jobs")
              .select(
                "id, title, city, address_text, work_date, start_time, end_time, break_start_time, break_end_time, workers_needed, pay_amount, pay_unit, status, transport_mode, description, cancellation_reason, cancelled_at, created_at, created_by, responsible_user_id"
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

  function teamMemberName(userId) {
    return (
      teamMembers.find((member) => member.user_id === userId)?.display_name ||
      (userId === user.id ? "Aš" : "Komandos narys")
    );
  }

  async function loadCompanyTeam(
    companyId = company?.id,
    role = companyMemberRole,
    plan = planSummary
  ) {
    if (!companyId || !plan?.can_team_management) {
      setTeamMembers([]);
      setTeamInvites([]);
      return;
    }

    setTeamLoading(true);

    try {
      const membersResult = await supabase.rpc("get_company_team", {
        p_company_id: companyId,
      });

      if (membersResult.error) throw membersResult.error;

      setTeamMembers(membersResult.data || []);

      if (role === "owner") {
        const invitesResult = await supabase.rpc(
          "get_company_team_invites",
          { p_company_id: companyId }
        );

        if (invitesResult.error) throw invitesResult.error;
        setTeamInvites(invitesResult.data || []);
      } else {
        setTeamInvites([]);
      }
    } catch (err) {
      setError(err?.message || "Nepavyko įkelti įmonės komandos.");
    } finally {
      setTeamLoading(false);
    }
  }

  async function openCompanyTeam() {
    if (!planSummary?.can_team_management) {
      setShowPlans(true);
      return;
    }

    setShowTeam(true);
    setLastTeamInviteLink("");
    await loadCompanyTeam(company?.id, companyMemberRole, planSummary);
  }

  function openCompanyTeamChat() {
    if (!planSummary?.can_team_chat) {
      setNotice(
        "Vidinis įmonės komandos pokalbis prieinamas tik Business Pro plane."
      );
      setShowPlans(true);
      return;
    }

    setShowTeamChat(true);
  }

  async function createTeamInvite() {
    if (!company?.id || companyMemberRole !== "owner") return;

    setTeamActionBusy(true);
    setError("");
    setNotice("");
    setLastTeamInviteLink("");

    try {
      const result = await supabase.rpc("create_company_team_invite", {
        p_company_id: company.id,
        p_email: teamInviteForm.email.trim(),
        p_display_name: teamInviteForm.displayName.trim(),
        p_member_role: teamInviteForm.memberRole,
      });

      if (result.error) throw result.error;

      const row = result.data?.[0];
      const link = companyTeamInviteLink(row?.token);
      setLastTeamInviteLink(link);

      try {
        await navigator.clipboard.writeText(link);
        setNotice("Kvietimas sukurtas. Nuoroda nukopijuota.");
      } catch {
        setNotice("Kvietimas sukurtas. Nukopijuokite nuorodą iš komandos lango.");
      }

      setTeamInviteForm({
        displayName: "",
        email: "",
        memberRole: "recruiter",
      });

      await loadCompanyTeam(company.id, companyMemberRole, planSummary);
    } catch (err) {
      setError(err?.message || "Nepavyko sukurti komandos kvietimo.");
    } finally {
      setTeamActionBusy(false);
    }
  }

  async function copyTeamInvite(token) {
    const link = companyTeamInviteLink(token);

    try {
      await navigator.clipboard.writeText(link);
      setNotice("Kvietimo nuoroda nukopijuota.");
    } catch {
      setLastTeamInviteLink(link);
      setNotice("Kvietimo nuoroda paruošta kopijavimui.");
    }
  }

  async function revokeTeamInvite(inviteId) {
    if (!company?.id) return;

    setTeamActionBusy(true);
    setError("");

    try {
      const result = await supabase.rpc("revoke_company_team_invite", {
        p_invite_id: inviteId,
      });

      if (result.error) throw result.error;

      setNotice("Kvietimas atšauktas.");
      await loadCompanyTeam(company.id, companyMemberRole, planSummary);
    } catch (err) {
      setError(err?.message || "Nepavyko atšaukti kvietimo.");
    } finally {
      setTeamActionBusy(false);
    }
  }

  async function changeTeamMemberRole(member, memberRole) {
    if (!company?.id || !member?.user_id) return;

    setTeamActionBusy(true);
    setError("");

    try {
      const result = await supabase.rpc(
        "update_company_team_member_role",
        {
          p_company_id: company.id,
          p_user_id: member.user_id,
          p_member_role: memberRole,
        }
      );

      if (result.error) throw result.error;

      setNotice("Komandos nario rolė atnaujinta.");
      await loadCompanyTeam(company.id, companyMemberRole, planSummary);
    } catch (err) {
      setError(err?.message || "Nepavyko pakeisti rolės.");
    } finally {
      setTeamActionBusy(false);
    }
  }

  async function removeTeamMember(member) {
    if (!company?.id || !member?.user_id) return;

    const confirmed = window.confirm(
      `Pašalinti ${member.display_name} iš įmonės komandos? Jo atsakingi darbai bus perduoti įmonės savininkui.`
    );

    if (!confirmed) return;

    setTeamActionBusy(true);
    setError("");

    try {
      const result = await supabase.rpc("remove_company_team_member", {
        p_company_id: company.id,
        p_user_id: member.user_id,
      });

      if (result.error) throw result.error;

      setNotice("Komandos narys pašalintas.");
      await Promise.all([
        loadCompanyTeam(company.id, companyMemberRole, planSummary),
        reloadJobs(company.id),
      ]);
    } catch (err) {
      setError(err?.message || "Nepavyko pašalinti komandos nario.");
    } finally {
      setTeamActionBusy(false);
    }
  }

  function requireEmployerChatPlan() {
    if (planSummary?.can_job_chat) return true;

    setNotice(
      "Darbo pokalbiai prieinami Business ir Business Pro planuose."
    );
    setShowPlans(true);
    return false;
  }

  async function openEmployerPrivateConversation(invitationId, title) {
    if (!requireEmployerChatPlan()) return;

    if (currentJob?.id) {
      await markEmployerJobRead(currentJob.id);
    }

    setConversation({
      invitationId,
      title,
    });
  }

  function openEmployerGroupConversation(job) {
    if (!requireEmployerChatPlan()) return;

    setGroupConversation({
      jobId: job.id,
      title: job.title,
    });
  }

  async function loadCompanyPlan(companyId = company?.id) {
    if (!companyId) return null;

    const result = await supabase.rpc("get_company_plan_summary", {
      p_company_id: companyId,
    });

    if (result.error) throw result.error;

    const summary = result.data?.[0] || null;
    setPlanSummary(summary);
    return summary;
  }

  async function activatePlanForAdminTest(planKey) {
    if (!company?.id || !onAdminReturn) return;

    setPlanActionBusy(true);
    setError("");
    setNotice("");

    try {
      const result = await supabase.rpc("admin_set_company_plan", {
        p_company_id: company.id,
        p_plan_key: planKey,
        p_subscription_status: "active",
        p_period_end: null,
        p_reason: "Plano testavimas administratoriaus darbdavio režime",
      });

      if (result.error) throw result.error;

      await loadCompanyPlan(company.id);
      setNotice(
        `${employerPlanName(planKey)} planas aktyvuotas testavimui.`
      );
      setShowPlans(false);
    } catch (err) {
      setError(err?.message || "Nepavyko pakeisti plano.");
    } finally {
      setPlanActionBusy(false);
    }
  }

  function requestPaidPlan(planKey) {
    const plan = EMPLOYER_PLANS.find((item) => item.key === planKey);
    if (!plan) return;

    setNotice(
      `${plan.name} (${plan.price} € / mėn.) paruoštas prenumeratai. ` +
        "Kortelės apmokėjimo tiekėją prijungsime kaip atskirą paskutinį žingsnį."
    );
    setShowPlans(false);
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
      const loadedMemberRole = memberResult.data.member_role || null;
      setCompanyMemberRole(loadedMemberRole);

      const [
        companyResult,
        privateResult,
        skillsResult,
        jobsResult,
        planResult,
      ] = await Promise.all([
          supabase
            .from("companies")
            .select(
              "id, name, company_code, city, description, is_verified, reliability_rate, cancelled_confirmed_count, false_attendance_claim_count"
            )
            .eq("id", companyId)
            .single(),
          supabase
            .from("user_private")
            .select("phone")
            .eq("user_id", user.id)
            .maybeSingle(),
          supabase
            .from("skills")
            .select("id, name")
            .eq("is_active", true)
            .order("name"),
          supabase
            .from("jobs")
            .select(
              "id, title, city, address_text, work_date, start_time, end_time, break_start_time, break_end_time, workers_needed, pay_amount, pay_unit, status, transport_mode, description, cancellation_reason, cancelled_at, created_at, created_by, responsible_user_id"
            )
            .eq("company_id", companyId)
            .order("created_at", { ascending: false })
            .limit(12),
          supabase.rpc("get_company_plan_summary", {
            p_company_id: companyId,
          }),
        ]);

      const failed = [
        companyResult,
        privateResult,
        skillsResult,
        jobsResult,
        planResult,
      ].find((result) => result.error);
      if (failed?.error) throw failed.error;

      setCompany(companyResult.data);
      setCompanyForm({
        name: companyResult.data?.name || "",
        companyCode: companyResult.data?.company_code || "",
        city: companyResult.data?.city || "",
        phone: privateResult.data?.phone || "",
        description: companyResult.data?.description || "",
      });
      setJobs(await addConfirmedCounts(jobsResult.data || []));
      setSkills(skillsResult.data || []);
      const loadedPlan = planResult.data?.[0] || null;
      setPlanSummary(loadedPlan);

      await Promise.all([
        loadEmployerNotifications(),
        loadEmployerStats(companyId, loadedMemberRole),
        loadedPlan?.can_team_management
          ? loadCompanyTeam(companyId, loadedMemberRole, loadedPlan)
          : Promise.resolve(),
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

  function updateCompanyField(key, value) {
    setCompanyForm((current) => ({ ...current, [key]: value }));
  }

  async function saveCompanyInformation() {
    const name = companyForm.name.trim();
    const cityInput = companyForm.city.trim();
    const phone = companyForm.phone.trim();
    const description = companyForm.description.trim();

    if (!company?.id) return;

    if (companyMemberRole !== "owner") {
      setError("Įmonės informaciją gali redaguoti tik įmonės savininkas.");
      return;
    }

    if (name.length < 2) {
      setError("Įveskite įmonės pavadinimą.");
      return;
    }

    if (cityInput.length < 2) {
      setError("Pasirinkite įmonės miestą.");
      return;
    }

    setCompanySaving(true);
    setError("");
    setNotice("");

    try {
      const city = await canonicalCityName(cityInput);
      if (!city) {
        throw new Error("Pasirinkite miestą iš pasiūlymų sąrašo.");
      }

      const companyResult = await supabase
        .from("companies")
        .update({
          name,
          city,
          description: description || null,
        })
        .eq("id", company.id)
        .select(
          "id, name, company_code, city, description, is_verified, reliability_rate, cancelled_confirmed_count, false_attendance_claim_count"
        )
        .single();

      if (companyResult.error) throw companyResult.error;

      const privateResult = await supabase
        .from("user_private")
        .upsert(
          {
            user_id: user.id,
            phone: phone || null,
          },
          { onConflict: "user_id" }
        );

      if (privateResult.error) throw privateResult.error;

      setCompany(companyResult.data);
      setCompanyForm({
        name: companyResult.data?.name || "",
        companyCode: companyResult.data?.company_code || "",
        city: companyResult.data?.city || "",
        phone,
        description: companyResult.data?.description || "",
      });

      setShowCompanyEditor(false);
      setNotice("Įmonės informacija atnaujinta.");
    } catch (err) {
      setError(err?.message || "Nepavyko atnaujinti įmonės informacijos.");
    } finally {
      setCompanySaving(false);
    }
  }

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function loadEmployerStats(
    companyId = company?.id,
    memberRole = companyMemberRole
  ) {
    if (!companyId) return;

    const [jobsResult, companyResult, penaltiesResult] = await Promise.all([
      supabase
        .from("jobs")
        .select(
          "id, status, workers_needed, work_date, created_by, responsible_user_id"
        )
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

    const allJobRows = jobsResult.data || [];
    const jobRows =
      planSummary?.can_team_management && memberRole === "recruiter"
        ? allJobRows.filter(
            (job) =>
              job.created_by === user.id ||
              job.responsible_user_id === user.id
          )
        : allJobRows;
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
        "id, title, city, address_text, work_date, start_time, end_time, break_start_time, break_end_time, workers_needed, pay_amount, pay_unit, status, transport_mode, description, cancellation_reason, cancelled_at, created_at, created_by, responsible_user_id"
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
        await loadEmployerStats(companyId, companyMemberRole);
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

    const numericScore = Number(ratingScore);
    if (!Number.isInteger(numericScore) || numericScore < 1 || numericScore > 10) {
      setError("Pasirinkite darbuotojo įvertinimą nuo 1 iki 10.");
      return;
    }

    setRatingSaving(true);
    setNotice("");
    setError("");

    try {
      const result = await supabase.from("worker_ratings").insert({
        booking_id: ratingTarget.bookingId,
        worker_id: ratingTarget.id,
        rater_id: user.id,
        score: numericScore,
        comment: ratingComment.trim() || null,
      });

      if (result.error) throw result.error;

      setNotice("Darbuotojo įvertinimas išsaugotas.");
      setRatingTarget(null);
      setRatingScore(null);
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
          .select("id, display_name, city, role, suspended_until")
          .in("role", ["worker", "admin"])
          .eq("is_active", true)
          .in("id", workerIds),
        supabase
          .from("worker_profiles")
          .select(
            "user_id, has_driving_license_b, years_experience, attendance_rate, completed_jobs, rating_average, short_bio, travel_radius_km, no_show_count, restricted_until, last_active_at, availability_confirmed_at"
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

          if (
            profile.suspended_until &&
            new Date(profile.suspended_until) > new Date()
          ) {
            return null;
          }

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

          const activityCutoff = Date.now() - 72 * 60 * 60 * 1000;
          const lastActiveAt = worker.last_active_at
            ? new Date(worker.last_active_at).getTime()
            : 0;
          const availabilityConfirmedAt = worker.availability_confirmed_at
            ? new Date(worker.availability_confirmed_at).getTime()
            : 0;

          if (
            !lastActiveAt ||
            !availabilityConfirmedAt ||
            lastActiveAt < activityCutoff ||
            availabilityConfirmedAt < activityCutoff
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
            lastActiveAt: worker.last_active_at,
            activityLabel: workerRecentActivityLabel(worker.last_active_at),
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
      const canonicalCity = await canonicalCityName(form.city);
      if (!canonicalCity) {
        throw new Error("Pasirinkite miestą iš pasiūlymų sąrašo.");
      }

      const payload = {
        city: canonicalCity,
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
        responsible_user_id:
          planSummary?.can_team_management
            ? form.responsibleUserId || user.id
            : user.id,
      };

      let job;

      if (editingJobId) {
        const updateResult = await supabase
          .from("jobs")
          .update(payload)
          .eq("id", editingJobId)
          .select(
            "id, title, city, address_text, work_date, start_time, end_time, break_start_time, break_end_time, workers_needed, pay_amount, pay_unit, status, transport_mode, description, cancellation_reason, cancelled_at, created_at, created_by, responsible_user_id"
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
            "id, title, city, address_text, work_date, start_time, end_time, break_start_time, break_end_time, workers_needed, pay_amount, pay_unit, status, transport_mode, description, cancellation_reason, cancelled_at, created_at, created_by, responsible_user_id"
          )
          .single();

        if (insertResult.error) throw insertResult.error;
        job = insertResult.data;

        setNotice("Darbo pasiūlymas sukurtas. Žemiau rodomi tinkami darbuotojai.");
      }

      setForm((current) => ({ ...current, city: canonicalCity }));
      setCurrentJob({ ...job, confirmedCount: editingConfirmedCount || 0 });
      setInvitedIds([]);
      setInvitationStatuses({});
      setInvitationByWorker({});
      setEditingJobId(null);
      setEditingConfirmedCount(0);
      await reloadJobs(company.id);
      await loadCompanyPlan(company.id);
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
        responsibleUserId: job.responsible_user_id || job.created_by || user.id,
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
    if (
      planSummary &&
      !planSummary.unlimited_jobs &&
      Number(planSummary.jobs_remaining ?? 0) <= 0
    ) {
      setError(
        planSummary.plan_key === "business"
          ? "Business plano 25 darbo pasiūlymų limitas šį mėnesį išnaudotas. Business Pro plane darbų skaičius neribojamas."
          : "Basic plano 5 darbo pasiūlymų limitas šį mėnesį išnaudotas."
      );
      setShowPlans(true);
      return;
    }

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
      responsibleUserId: user.id,
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

  const canSeeAllCompanyJobs =
    Boolean(planSummary?.can_team_management) &&
    ["owner", "manager"].includes(companyMemberRole);

  const visibleJobs =
    planSummary?.can_team_management &&
    (jobScope === "mine" || !canSeeAllCompanyJobs)
      ? jobs.filter(
          (job) =>
            job.responsible_user_id === user.id ||
            job.created_by === user.id
        )
      : jobs;

  const activeTeamMembers = teamMembers.filter((member) => member.is_active);
  const pendingTeamInvites = teamInvites.filter(
    (invite) =>
      invite.status === "pending" &&
      new Date(invite.expires_at) > new Date()
  );
  const usedTeamSeats =
    activeTeamMembers.length + pendingTeamInvites.length;

  const currentTeamMember = activeTeamMembers.find(
    (member) => member.user_id === user.id
  );

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
        .ed-heading-actions{display:flex;align-items:center;justify-content:flex-end;gap:9px;flex-wrap:wrap}
        .ed-team-chat-btn{position:relative}
        .ed-team-chat-btn.locked{border-style:dashed}
        .ed-company-editor{background:#fff;border:1px solid #e4ebf0;border-radius:16px;padding:20px;box-shadow:0 8px 24px rgba(16,36,56,.04)}
        .ed-company-editor-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:16px}
        .ed-company-editor-head h2{margin:3px 0 0;font-family:Manrope,Inter,sans-serif;font-size:21px}
        .ed-company-editor-head p{margin:6px 0 0;color:#6c7a88;font-size:13px;line-height:1.45}
        .ed-company-editor-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        .ed-company-editor-wide{grid-column:1/-1}
        .ed-company-editor-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:16px}
        .ed-company-readonly{background:#f4f6f8!important;color:#6c7a88!important}
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
        .ed-plan-badge{border:1px solid #dbe4ea;background:#f8fafb;color:#102438;border-radius:999px;padding:7px 10px;font:inherit;font-size:11px;font-weight:800;cursor:pointer;white-space:nowrap}
        .ed-plan-badge strong{color:#f08a28}
        .ed-plan-usage{display:flex;justify-content:space-between;align-items:center;gap:18px;background:#fff;border:1px solid #e4ebf0;border-radius:14px;padding:14px 16px;margin-bottom:20px}
        .ed-plan-usage-copy b{display:block;font-family:Manrope,Inter,sans-serif;font-size:15px;margin-bottom:3px}
        .ed-plan-usage-copy span{display:block;color:#6c7a88;font-size:13px;line-height:1.45}
        .ed-plan-usage-meter{display:flex;align-items:center;gap:10px;min-width:250px}
        .ed-plan-usage-bar{height:8px;flex:1;background:#edf1f4;border-radius:999px;overflow:hidden}
        .ed-plan-usage-fill{height:100%;background:#f08a28;border-radius:999px}
        .ed-plan-usage-meter b{font-size:12px;white-space:nowrap}
        .ed-analytics-lock{margin-top:12px;border:1px dashed #d5dde4;border-radius:12px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;gap:14px;background:#fafbfc}
        .ed-analytics-lock b{display:block;font-size:13px}.ed-analytics-lock span{display:block;color:#6c7a88;font-size:12px;margin-top:3px}
        .ed-plan-overlay{position:fixed;inset:0;z-index:9400;background:rgba(16,36,56,.64);display:grid;place-items:center;padding:20px}
        .ed-plan-modal{width:min(1040px,100%);max-height:calc(100vh - 40px);overflow:auto;background:#fff;border-radius:20px;padding:24px;box-shadow:0 30px 100px rgba(16,36,56,.3)}
        .ed-plan-head{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;margin-bottom:20px}
        .ed-plan-head h2{margin:3px 0 5px;font-family:Manrope,Inter,sans-serif;font-size:26px}.ed-plan-head p{margin:0;color:#6c7a88}
        .ed-plan-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
        .ed-plan-card{border:1px solid #e1e8ed;border-radius:16px;padding:20px;display:flex;flex-direction:column;min-height:390px;background:#fff}
        .ed-plan-card.current{border-color:#f08a28;box-shadow:0 0 0 2px rgba(240,138,40,.08)}
        .ed-plan-card.pro{background:#102438;color:#fff;border-color:#102438}
        .ed-plan-card .eyebrow{margin-bottom:6px}.ed-plan-card.pro .eyebrow{color:#f5a04c}
        .ed-plan-card h3{font-family:Manrope,Inter,sans-serif;font-size:22px;margin:0}
        .ed-plan-price{font-family:Manrope,Inter,sans-serif;font-size:31px;font-weight:900;margin:12px 0 2px}.ed-plan-price small{font:600 12px Inter,sans-serif;color:#7a8996}.ed-plan-card.pro .ed-plan-price small{color:#b7c2cc}
        .ed-plan-desc{font-size:13px;color:#6c7a88;min-height:40px;line-height:1.5}.ed-plan-card.pro .ed-plan-desc{color:#c7d0d8}
        .ed-plan-features{display:grid;gap:9px;margin:17px 0 20px;padding:0;list-style:none;flex:1}.ed-plan-features li{font-size:13px;line-height:1.4}.ed-plan-features li:before{content:"✓";color:#1c9b67;font-weight:900;margin-right:7px}.ed-plan-card.pro .ed-plan-features li:before{color:#65d5aa}
        .ed-plan-current{display:inline-flex;width:max-content;background:#fff3e7;color:#b85f0e;border-radius:999px;padding:5px 8px;font-size:11px;font-weight:800;margin-top:9px}
        .ed-plan-card.pro .ed-plan-current{background:rgba(255,255,255,.12);color:#fff}
        .ed-plan-card .ed-primary,.ed-plan-card .ed-secondary{width:100%;min-height:43px}
        .ed-plan-card.pro .ed-secondary{border-color:#526779;background:#fff;color:#102438}
        .ed-plan-footnote{margin-top:16px;color:#778694;font-size:12px;line-height:1.5}
        .ed-team-btn{border:1px solid #dbe4ea;background:#fff;color:#102438;border-radius:10px;padding:10px 12px;font:inherit;font-size:12px;font-weight:800;cursor:pointer;white-space:nowrap}
        .ed-team-btn.locked{color:#8a98a6;background:#f8fafb}
        .ed-team-overlay{position:fixed;inset:0;z-index:9450;background:rgba(16,36,56,.64);display:grid;place-items:center;padding:20px}
        .ed-team-modal{width:min(960px,100%);max-height:calc(100vh - 40px);overflow:auto;background:#fff;border-radius:20px;padding:24px;box-shadow:0 30px 100px rgba(16,36,56,.30)}
        .ed-team-head{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;margin-bottom:18px}
        .ed-team-head h2{margin:3px 0 4px;font-family:Manrope,Inter,sans-serif;font-size:25px}
        .ed-team-head p{margin:0;color:#6c7a88;font-size:13px;line-height:1.5}
        .ed-team-seat{display:inline-flex;margin-top:9px;border-radius:999px;background:#eef3f6;color:#405264;padding:6px 9px;font-size:11px;font-weight:800}
        .ed-team-layout{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(300px,.8fr);gap:16px}
        .ed-team-panel{border:1px solid #e4ebf0;border-radius:14px;padding:16px}
        .ed-team-panel h3{margin:0 0 5px;font-family:Manrope,Inter,sans-serif;font-size:17px}
        .ed-team-panel>p{margin:0 0 14px;color:#6c7a88;font-size:12px;line-height:1.45}
        .ed-team-list{display:grid;gap:9px}
        .ed-team-member{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;border:1px solid #edf1f4;border-radius:11px;padding:12px}
        .ed-team-member b{display:block;font-size:14px}.ed-team-member span{display:block;color:#6c7a88;font-size:12px;margin-top:3px}
        .ed-team-member-actions{display:flex;gap:7px;align-items:center;flex-wrap:wrap;justify-content:flex-end}
        .ed-team-role-select{border:1px solid #dbe4ea;border-radius:8px;padding:8px 9px;background:#fff;font:inherit;font-size:12px;font-weight:700}
        .ed-team-remove{border:1px solid #e8bbae;background:#fff;color:#b64d2a;border-radius:8px;padding:8px 9px;font:inherit;font-size:12px;font-weight:800;cursor:pointer}
        .ed-team-invite-form{display:grid;gap:10px}.ed-team-invite-form .ed-input,.ed-team-invite-form .ed-select{min-height:42px}
        .ed-team-role-title{display:block;font-size:12px;font-weight:800;color:#405264;margin-bottom:7px}
        .ed-team-role-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}
        .ed-team-role-card{border:1px solid #dfe7ec;background:#fff;border-radius:12px;padding:13px;text-align:left;cursor:pointer;color:#102438;font:inherit;transition:border-color .15s,box-shadow .15s,background .15s}
        .ed-team-role-card:hover{border-color:#bdcbd5}
        .ed-team-role-card.active{border-color:#f08a28;background:#fff9f3;box-shadow:0 0 0 2px rgba(240,138,40,.08)}
        .ed-team-role-card b{display:flex;align-items:center;justify-content:space-between;gap:8px;font-family:Manrope,Inter,sans-serif;font-size:14px;margin-bottom:5px}
        .ed-team-role-card b span{font-family:Inter,sans-serif;font-size:10px;color:#b85f0e;background:#fff0df;border-radius:999px;padding:4px 6px;white-space:nowrap}
        .ed-team-role-card p{margin:0;color:#6c7a88;font-size:11px;line-height:1.45}
        .ed-team-role-card ul{margin:9px 0 0;padding:0;list-style:none;display:grid;gap:5px}
        .ed-team-role-card li{font-size:11px;line-height:1.35;color:#405264}
        .ed-team-role-card li:before{content:"✓";color:#1c9b67;font-weight:900;margin-right:6px}
        .ed-team-role-summary{border:1px solid #e4ebf0;background:#f8fafb;border-radius:11px;padding:11px 12px}
        .ed-team-role-summary b{display:block;font-size:12px;margin-bottom:4px}
        .ed-team-role-summary span{display:block;color:#6c7a88;font-size:11px;line-height:1.45}
        .ed-team-invite-row{display:grid;grid-template-columns:1fr 1fr;gap:9px}
        .ed-team-invites{display:grid;gap:8px;margin-top:15px;padding-top:15px;border-top:1px solid #edf1f4}
        .ed-team-invite{border:1px solid #edf1f4;border-radius:10px;padding:11px}
        .ed-team-invite b{display:block;font-size:13px}.ed-team-invite span{display:block;color:#6c7a88;font-size:11px;margin-top:3px}
        .ed-team-invite-actions{display:flex;gap:7px;margin-top:9px;flex-wrap:wrap}
        .ed-team-link{margin-top:12px;background:#f6f8fa;border-radius:10px;padding:11px;font-size:11px;overflow-wrap:anywhere;color:#405264}
        .ed-job-scope{display:flex;gap:7px;align-items:center;flex-wrap:wrap}
        .ed-job-scope button{border:1px solid #dbe4ea;background:#fff;color:#526374;border-radius:999px;padding:7px 10px;font:inherit;font-size:11px;font-weight:800;cursor:pointer}
        .ed-job-scope button.active{background:#102438;color:#fff;border-color:#102438}
        .ed-responsible{display:inline-flex;margin-top:6px;border-radius:999px;background:#f1f4f6;color:#526374;padding:4px 7px;font-size:11px;font-weight:800}
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
        @media(max-width:980px){.ed-team-layout{grid-template-columns:1fr}.ed-form-grid{grid-template-columns:1fr 1fr}.ed-span-4{grid-column:1/-1}.ed-worker{grid-template-columns:1fr 1fr}.ed-worker .ed-tags{grid-column:1/-1}.ed-job{grid-template-columns:100px 1fr 100px}.ed-job>:nth-child(3){display:none}.ed-attendance-row{grid-template-columns:1fr}.ed-attendance-actions{justify-content:flex-start}.ed-member-metrics{grid-template-columns:1fr 1fr}.ed-plan-grid{grid-template-columns:1fr}.ed-plan-card{min-height:0}}
        @media(max-width:620px){.ed-team-role-grid{grid-template-columns:1fr}.ed-team-invite-row{grid-template-columns:1fr}.ed-team-member{grid-template-columns:1fr}.ed-team-member-actions{justify-content:flex-start}.ed-team-modal{padding:18px}.ed-topbar-inner,.ed-shell{width:min(100% - 24px,1180px)}.ed-heading{flex-direction:column;align-items:flex-start}.ed-heading-actions{justify-content:flex-start;width:100%}.ed-company-editor-grid{grid-template-columns:1fr}.ed-company-editor-wide{grid-column:auto}.ed-form-grid{grid-template-columns:1fr}.ed-span-2,.ed-span-4{grid-column:auto}.ed-worker{grid-template-columns:1fr}.ed-jobs .ed-job{grid-template-columns:1fr}.ed-job>:nth-child(3){display:block}.ed-attendance-row{grid-template-columns:1fr}.ed-plan-usage{align-items:stretch;flex-direction:column}.ed-plan-usage-meter{min-width:0;width:100%}.ed-plan-modal{padding:18px}.ed-plan-head h2{font-size:23px}}
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
                  <span>
                    {currentTeamMember
                      ? `${currentTeamMember.display_name} · ${companyTeamRoleLabel(
                          currentTeamMember.member_role
                        )}`
                      : company.city || "Miestas nenurodytas"}
                  </span>
                </div>
              </div>
            )}
            {company && planSummary && (
              <button
                className="ed-plan-badge"
                type="button"
                onClick={() => setShowPlans(true)}
                title="Peržiūrėti planą"
              >
                Planas: <strong>{planSummary.plan_name}</strong>
              </button>
            )}

            {company && planSummary && (
              <button
                className={`ed-team-btn ${
                  planSummary.can_team_management ? "" : "locked"
                }`}
                type="button"
                onClick={openCompanyTeam}
              >
                {planSummary.can_team_management
                  ? `Komanda · ${Math.max(
                      1,
                      activeTeamMembers.length
                    )}/5`
                  : "Komanda · Pro"}
              </button>
            )}

            {companyMemberRole === "owner" && (
              <button
                className="btn ghost"
                type="button"
                onClick={() =>
                  setShowCompanyEditor((current) => !current)
                }
              >
                {showCompanyEditor
                  ? "Uždaryti redagavimą"
                  : "Redaguoti informaciją"}
              </button>
            )}

            {onAdminReturn && (
              <button
                className="btn ghost"
                type="button"
                onClick={onAdminReturn}
              >
                ← Administravimas
              </button>
            )}

            <button className="btn ghost" onClick={onLogout}>
              Atsijungti
            </button>
          </div>
        </div>
      </header>

      <main className="ed-shell">
        {showCompanyEditor && companyMemberRole === "owner" && (
          <section className="ed-company-editor">
            <div className="ed-company-editor-head">
              <div>
                <div className="eyebrow">ĮMONĖS INFORMACIJA</div>
                <h2>Redaguoti informaciją</h2>
                <p>
                  Atnaujinkite duomenis, kuriuos naudojame jūsų darbdavio
                  paskyroje ir darbuotojams pateikiamuose darbo pasiūlymuose.
                </p>
              </div>
            </div>

            <div className="ed-company-editor-grid">
              <label className="ed-label">
                Įmonės pavadinimas *
                <input
                  className="ed-input"
                  value={companyForm.name}
                  maxLength={160}
                  onChange={(e) =>
                    updateCompanyField("name", e.target.value)
                  }
                />
              </label>

              <label className="ed-label">
                Įmonės kodas
                <input
                  className="ed-input ed-company-readonly"
                  value={companyForm.companyCode || "Nenurodytas"}
                  readOnly
                />
              </label>

              <label className="ed-label">
                Miestas *
                <CityAutocomplete
                  className="ed-input"
                  value={companyForm.city}
                  onChange={(value) =>
                    updateCompanyField("city", value)
                  }
                  placeholder="Pradėkite rašyti miestą"
                />
              </label>

              <label className="ed-label">
                Kontaktinis telefono numeris
                <input
                  className="ed-input"
                  type="tel"
                  value={companyForm.phone}
                  maxLength={40}
                  onChange={(e) =>
                    updateCompanyField("phone", e.target.value)
                  }
                  placeholder="+370..."
                />
              </label>

              <label className="ed-label ed-company-editor-wide">
                Trumpai apie įmonę
                <textarea
                  className="ed-textarea"
                  value={companyForm.description}
                  maxLength={1200}
                  onChange={(e) =>
                    updateCompanyField("description", e.target.value)
                  }
                  placeholder="Pvz. Dirbame Vilniuje ir Vilniaus rajone, vykdome bendrastatybinius darbus..."
                />
              </label>
            </div>

            <div className="ed-company-editor-actions">
              <button
                className="ed-secondary"
                type="button"
                disabled={companySaving}
                onClick={() => setShowCompanyEditor(false)}
              >
                Atšaukti
              </button>

              <button
                className="ed-primary"
                type="button"
                disabled={companySaving}
                onClick={saveCompanyInformation}
              >
                {companySaving ? "Saugoma..." : "Išsaugoti"}
              </button>
            </div>
          </section>
        )}

        <div className="ed-heading">
          <div>
            <div className="eyebrow">DARBDAVIO PASKYRA</div>
            <h1>Sukurkite darbuotojų kvietimą</h1>
            <p>
              Sistema rodys darbuotojus, kurie tą dieną ir tuo laiku pažymėjo,
              kad gali dirbti ir yra arčiausiai jūsų vietovės.
            </p>
          </div>

          <div className="ed-heading-actions">
            <button
              className={`ed-secondary ed-team-chat-btn ${
                planSummary?.can_team_chat ? "" : "locked"
              }`}
              type="button"
              onClick={openCompanyTeamChat}
            >
              {planSummary?.can_team_chat
                ? "Komandos pokalbis"
                : "Komandos pokalbis · Pro"}
            </button>

            <button
              className="ed-primary"
              type="button"
              onClick={openNewJobForm}
            >
              + Sukurti darbo pasiūlymą
            </button>
          </div>
        </div>

        {planSummary && (
          <div className="ed-plan-usage">
            <div className="ed-plan-usage-copy">
              <b>
                {planSummary.plan_name} planas ·{" "}
                {employerSubscriptionStatusLabel(
                  planSummary.subscription_status
                )}
              </b>
              <span>
                {planSummary.unlimited_jobs
                  ? "Darbo pasiūlymų skaičius neribojamas."
                  : `Šį mėnesį panaudota ${Number(
                      planSummary.jobs_used_this_month || 0
                    )} iš ${Number(planSummary.jobs_limit || 5)} darbo pasiūlymų.`}
              </span>
            </div>

            {planSummary.unlimited_jobs ? (
              <button
                className="ed-secondary"
                type="button"
                onClick={() => setShowPlans(true)}
              >
                Valdyti planą
              </button>
            ) : (
              <div className="ed-plan-usage-meter">
                <div className="ed-plan-usage-bar">
                  <div
                    className="ed-plan-usage-fill"
                    style={{
                      width: `${Math.min(
                        100,
                        (Number(planSummary.jobs_used_this_month || 0) /
                          Math.max(1, Number(planSummary.jobs_limit || 5))) *
                          100
                      )}%`,
                    }}
                  />
                </div>
                <b>
                  {Number(planSummary.jobs_remaining ?? 0)} liko
                </b>
                <button
                  className="ed-secondary"
                  type="button"
                  onClick={() => setShowPlans(true)}
                >
                  Keisti planą
                </button>
              </div>
            )}
          </div>
        )}

        <section>
          <div style={{ marginBottom: 10 }}>
            <div className="eyebrow">
              {planSummary?.can_team_management &&
              companyMemberRole === "recruiter"
                ? "MANO DARBŲ STATISTIKA"
                : "ĮMONĖS STATISTIKA"}
            </div>
          </div>

          <div className="ed-kpis">
            <div className="ed-kpi">
              <span>Sukurta darbo pasiūlymų</span>
              <b>{employerStats.totalJobs}</b>
            </div>

            {planSummary?.can_advanced_analytics && (
              <div className="ed-kpi">
                <span>Pilnai žmonėmis užpildyti darbai</span>
                <b>{employerStats.filledJobs}</b>
              </div>
            )}

            <div className="ed-kpi">
              <span>Trūksta darbuotojų</span>
              <b>{employerStats.missingWorkers}</b>
            </div>

            <div className="ed-kpi">
              <span>Įvykdyti darbai</span>
              <b>{employerStats.completedJobs}</b>
            </div>

            {planSummary?.can_advanced_analytics && (
              <>
                <div className="ed-kpi">
                  <span>Atšaukti darbai</span>
                  <b>{employerStats.cancelledJobs}</b>
                </div>

                <div className="ed-kpi">
                  <span>Panaudoti darbuotojai / mėn.</span>
                  <b>{employerStats.monthlyWorkersUsed}</b>
                </div>
              </>
            )}

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

          {planSummary && !planSummary.can_advanced_analytics && (
            <div className="ed-analytics-lock">
              <div>
                <b>Išplėstinė įmonės statistika</b>
                <span>
                  Užpildytų ir atšauktų darbų bei mėnesio darbuotojų analizė
                  įtraukta į Business ir Business Pro.
                </span>
              </div>
              <button
                className="ed-secondary"
                type="button"
                onClick={() => setShowPlans(true)}
              >
                Peržiūrėti planus
              </button>
            </div>
          )}
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

            {planSummary?.can_team_management && (
              <label className="ed-label ed-span-2">
                Atsakingas žmogus
                <select
                  className="ed-select"
                  value={form.responsibleUserId}
                  disabled={
                    !["owner", "manager"].includes(companyMemberRole)
                  }
                  onChange={(e) =>
                    updateField("responsibleUserId", e.target.value)
                  }
                >
                  {activeTeamMembers.map((member) => (
                    <option value={member.user_id} key={member.user_id}>
                      {member.display_name} ·{" "}
                      {companyTeamRoleLabel(member.member_role)}
                    </option>
                  ))}
                </select>
                <span
                  style={{
                    color: "#7a8996",
                    fontSize: 11,
                    fontWeight: 500,
                  }}
                >
                  Vadybininkui naujas darbas automatiškai priskiriamas jam
                  pačiam. Savininkas ir vadovas gali pakeisti atsakingą žmogų.
                </span>
              </label>
            )}

            <label className="ed-label">
              Miestas
              <CityAutocomplete
                className="ed-input"
                value={form.city}
                disabled={editingConfirmedCount > 0}
                onChange={(value) => updateField("city", value)}
                placeholder="Pradėkite rašyti miestą"
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
                                : `${worker.ratingAverage.toFixed(1)} / 10`}
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
                              openEmployerGroupConversation(currentJob)
                            }
                          >
                            {planSummary?.can_job_chat
                              ? "Darbo pokalbis"
                              : "Darbo pokalbis · Business"}
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
                                  setRatingScore(null);
                                  setRatingComment("");
                                }}
                              >
                                Įvertinti
                              </button>
                            )}

                          {worker.rating && (
                            <span className="ed-attendance-badge green">
                              Įvertinta {worker.rating.score}/10
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
                <p style={{ marginBottom: 4 }}>
                  Rodomi tik per paskutines 72 val. aktyvūs ir savo grafiką
                  patvirtinę darbuotojai.
                </p>
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
                          {worker.activityLabel && (
                            <div className="ed-worker-status">
                              <span className="ed-attendance-badge green">
                                {worker.activityLabel}
                              </span>
                            </div>
                          )}
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
                            onClick={() =>
                              openEmployerPrivateConversation(
                                invitationByWorker[worker.id].id,
                                `${worker.name} · ${currentJob.title}`
                              )
                            }
                          >
                            {planSummary?.can_job_chat
                              ? "Žinutė"
                              : "Žinutė · Business"}
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
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2 style={{ marginBottom: 6 }}>
                {planSummary?.can_team_management
                  ? jobScope === "mine"
                    ? "Mano darbai"
                    : "Visi įmonės darbai"
                  : "Mano poreikiai"}
              </h2>
              <p className="ed-sub">
                {planSummary?.can_team_management
                  ? "Darbai atskiriami pagal atsakingą komandos narį, todėl vadybininkų sąrašai nesimaišo."
                  : "Galite vėl atidaryti ankstesnį poreikį ir patikrinti, kas dabar laisvas."}
              </p>
            </div>

            {canSeeAllCompanyJobs && (
              <div className="ed-job-scope">
                <button
                  className={jobScope === "mine" ? "active" : ""}
                  type="button"
                  onClick={() => setJobScope("mine")}
                >
                  Mano darbai
                </button>
                <button
                  className={jobScope === "all" ? "active" : ""}
                  type="button"
                  onClick={() => setJobScope("all")}
                >
                  Visi įmonės darbai
                </button>
              </div>
            )}
          </div>

          {visibleJobs.length ? (
            <div className="ed-jobs">
              {visibleJobs.map((job) => {
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
                      {planSummary?.can_team_management && (
                        <span className="ed-responsible">
                          Atsakingas:{" "}
                          {teamMemberName(
                            job.responsible_user_id || job.created_by
                          )}
                        </span>
                      )}
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
            <div className="ed-empty">
              {planSummary?.can_team_management && jobScope === "mine"
                ? "Šiuo metu neturite jums priskirtų darbų."
                : "Dar neturite sukurtų poreikių."}
            </div>
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
              setRatingScore(null);
              setRatingComment("");
            }
          }}
        >
          <div className="rs-modal-card">
            <div className="rs-modal-head">
              <div>
                <div className="eyebrow">DARBUOTOJO ĮVERTINIMAS</div>
                <h2>Kaip įvertintumėte {ratingTarget.name}?</h2>
                <div style={{ color: "#6c7a88", marginTop: 5, fontSize: 13 }}>
                  Pasirinkite bendrą įvertinimą nuo 1 iki 10.
                </div>
              </div>
              <button
                className="rs-close"
                disabled={ratingSaving}
                onClick={() => {
                  setRatingTarget(null);
                  setRatingScore(null);
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
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                  <button
                    key={score}
                    type="button"
                    className={
                      Number(ratingScore) === score
                        ? "ed-primary"
                        : "ed-secondary"
                    }
                    style={{ minWidth: 46 }}
                    onClick={() => setRatingScore(score)}
                  >
                    {score}
                  </button>
                ))}
              </div>
            </div>

            <label className="ed-label">
              Komentaras apie darbuotoją
              <textarea
                className="ed-textarea"
                maxLength={1000}
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="Pvz. punktualus, gerai atliko užduotis, lengva susitarti..."
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
                  setRatingScore(null);
                  setRatingComment("");
                }}
              >
                Grįžti
              </button>
              <button
                className="ed-primary"
                disabled={ratingSaving || !ratingScore}
                onClick={submitWorkerRating}
              >
                {ratingSaving ? "Saugoma..." : "Išsaugoti įvertinimą"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showTeam && (
        <div
          className="ed-team-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !teamActionBusy) {
              setShowTeam(false);
            }
          }}
        >
          <div className="ed-team-modal">
            <div className="ed-team-head">
              <div>
                <div className="eyebrow">BUSINESS PRO · ĮMONĖS KOMANDA</div>
                <h2>{company?.name} komanda</h2>
                <p>
                  Kiekvienas žmogus jungiasi savo el. paštu. Darbai ir žinutės
                  lieka aiškiai priskirti konkrečiam įmonės atstovui.
                </p>
                <span className="ed-team-seat">
                  Panaudota {usedTeamSeats} iš 5 komandos vietų
                </span>
              </div>

              <button
                className="rs-close"
                type="button"
                disabled={teamActionBusy}
                onClick={() => setShowTeam(false)}
              >
                ×
              </button>
            </div>

            <div className="ed-team-layout">
              <div className="ed-team-panel">
                <h3>Komandos nariai</h3>
                <p>
                  Savininkas ir vadovas gali matyti visus įmonės darbus.
                  Vadybininkas pagal nutylėjimą dirba tik su savo darbais.
                </p>

                {teamLoading ? (
                  <div className="ed-empty compact">Kraunama komanda...</div>
                ) : activeTeamMembers.length ? (
                  <div className="ed-team-list">
                    {activeTeamMembers.map((member) => (
                      <div className="ed-team-member" key={member.user_id}>
                        <div>
                          <b>
                            {member.display_name}
                            {member.user_id === user.id ? " · Jūs" : ""}
                          </b>
                          <span>{member.email}</span>
                          <span>
                            {companyTeamRoleLabel(member.member_role)} ·{" "}
                            {Number(member.jobs_responsible || 0)} atsakingi darbai
                          </span>
                        </div>

                        <div className="ed-team-member-actions">
                          {companyMemberRole === "owner" &&
                          member.member_role !== "owner" ? (
                            <>
                              <select
                                className="ed-team-role-select"
                                value={member.member_role}
                                disabled={teamActionBusy}
                                onChange={(e) =>
                                  changeTeamMemberRole(
                                    member,
                                    e.target.value
                                  )
                                }
                              >
                                <option value="manager">Vadovas</option>
                                <option value="recruiter">Vadybininkas</option>
                              </select>

                              <button
                                className="ed-team-remove"
                                type="button"
                                disabled={teamActionBusy}
                                onClick={() => removeTeamMember(member)}
                              >
                                Pašalinti
                              </button>
                            </>
                          ) : (
                            <span
                              className="ed-opened-badge"
                              style={{ margin: 0 }}
                            >
                              {companyTeamRoleLabel(member.member_role)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="ed-empty compact">Komandos narių nerasta.</div>
                )}
              </div>

              <div className="ed-team-panel">
                {companyMemberRole === "owner" ? (
                  <>
                    <h3>Pakviesti žmogų</h3>
                    <p>
                      Įveskite vardą ir asmeninį darbo el. paštą, tada
                      pasirinkite, kiek teisių žmogui reikia. Sukursime
                      vienkartinę 7 dienas galiojančią registracijos nuorodą.
                    </p>

                    <div className="ed-team-invite-form">
                      <label className="ed-label">
                        Vardas
                        <input
                          className="ed-input"
                          value={teamInviteForm.displayName}
                          maxLength={120}
                          onChange={(e) =>
                            setTeamInviteForm((current) => ({
                              ...current,
                              displayName: e.target.value,
                            }))
                          }
                          placeholder="Pvz. Tomas"
                        />
                      </label>

                      <label className="ed-label">
                        El. paštas
                        <input
                          className="ed-input"
                          type="email"
                          value={teamInviteForm.email}
                          onChange={(e) =>
                            setTeamInviteForm((current) => ({
                              ...current,
                              email: e.target.value,
                            }))
                          }
                          placeholder="tomas@imone.lt"
                        />
                      </label>

                      <div>
                        <span className="ed-team-role-title">
                          Pasirinkite žmogaus rolę
                        </span>

                        <div className="ed-team-role-grid">
                          <button
                            className={`ed-team-role-card ${
                              teamInviteForm.memberRole === "recruiter"
                                ? "active"
                                : ""
                            }`}
                            type="button"
                            onClick={() =>
                              setTeamInviteForm((current) => ({
                                ...current,
                                memberRole: "recruiter",
                              }))
                            }
                          >
                            <b>
                              Vadybininkas
                              {teamInviteForm.memberRole === "recruiter" && (
                                <span>Pasirinkta</span>
                              )}
                            </b>
                            <p>
                              Skirtas žmogui, kuris pats kuria ir prižiūri savo
                              darbo pasiūlymus.
                            </p>
                            <ul>
                              <li>Mato savo sukurtus ir jam priskirtus darbus</li>
                              <li>Gali kviesti darbuotojus į savo darbus</li>
                              <li>Gali vesti pokalbius apie savo darbus</li>
                              <li>Mato savo darbų statistiką</li>
                              <li>Negali valdyti kitų vadybininkų darbų</li>
                            </ul>
                          </button>

                          <button
                            className={`ed-team-role-card ${
                              teamInviteForm.memberRole === "manager"
                                ? "active"
                                : ""
                            }`}
                            type="button"
                            onClick={() =>
                              setTeamInviteForm((current) => ({
                                ...current,
                                memberRole: "manager",
                              }))
                            }
                          >
                            <b>
                              Vadovas
                              {teamInviteForm.memberRole === "manager" && (
                                <span>Pasirinkta</span>
                              )}
                            </b>
                            <p>
                              Skirtas žmogui, kuris koordinuoja kelių
                              vadybininkų darbus ir visos įmonės samdymą.
                            </p>
                            <ul>
                              <li>Mato visus įmonės darbo pasiūlymus</li>
                              <li>Gali valdyti ir redaguoti visus įmonės darbus</li>
                              <li>Gali perskirstyti atsakingus žmones</li>
                              <li>Mato visos įmonės statistiką</li>
                              <li>Negali keisti komandos narių rolių ar jų šalinti</li>
                            </ul>
                          </button>
                        </div>

                        <div className="ed-team-role-summary">
                          <b>
                            {teamInviteForm.memberRole === "manager"
                              ? "Kviečiate kaip Vadovą"
                              : "Kviečiate kaip Vadybininką"}
                          </b>
                          <span>
                            {teamInviteForm.memberRole === "manager"
                              ? "Šis žmogus galės koordinuoti visus įmonės darbus ir perskirstyti juos tarp komandos narių, tačiau komandos sudėtį vis tiek valdys tik Savininkas."
                              : "Šis žmogus dirbs tik su savo sukurtais arba jam priskirtais darbais ir nematys kitų vadybininkų darbų kaip valdomų savo darbų."}
                          </span>
                        </div>
                      </div>

                      <button
                        className="ed-primary"
                        type="button"
                        disabled={
                          teamActionBusy ||
                          usedTeamSeats >= 5 ||
                          !teamInviteForm.displayName.trim() ||
                          !teamInviteForm.email.trim()
                        }
                        onClick={createTeamInvite}
                      >
                        {teamActionBusy
                          ? "Kuriamas kvietimas..."
                          : usedTeamSeats >= 5
                          ? "Visos 5 vietos panaudotos"
                          : "Sukurti kvietimą"}
                      </button>
                    </div>

                    {lastTeamInviteLink && (
                      <div className="ed-team-link">
                        <b>Kvietimo nuoroda</b>
                        <div style={{ marginTop: 5 }}>
                          {lastTeamInviteLink}
                        </div>
                        <button
                          className="ed-secondary"
                          type="button"
                          style={{ marginTop: 9 }}
                          onClick={() =>
                            navigator.clipboard
                              .writeText(lastTeamInviteLink)
                              .then(() =>
                                setNotice("Kvietimo nuoroda nukopijuota.")
                              )
                              .catch(() => {})
                          }
                        >
                          Kopijuoti
                        </button>
                      </div>
                    )}

                    <div className="ed-team-invites">
                      <h3 style={{ marginBottom: 0 }}>Laukiantys kvietimai</h3>

                      {pendingTeamInvites.length ? (
                        pendingTeamInvites.map((invite) => (
                          <div className="ed-team-invite" key={invite.invite_id}>
                            <b>{invite.display_name}</b>
                            <span>
                              {invite.email} ·{" "}
                              {companyTeamRoleLabel(invite.member_role)}
                            </span>
                            <span>
                              Galioja iki{" "}
                              {new Date(invite.expires_at).toLocaleDateString(
                                "lt-LT"
                              )}
                            </span>

                            <div className="ed-team-invite-actions">
                              <button
                                className="ed-secondary"
                                type="button"
                                onClick={() => copyTeamInvite(invite.token)}
                              >
                                Kopijuoti nuorodą
                              </button>
                              <button
                                className="ed-team-remove"
                                type="button"
                                disabled={teamActionBusy}
                                onClick={() =>
                                  revokeTeamInvite(invite.invite_id)
                                }
                              >
                                Atšaukti
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ color: "#7a8996", fontSize: 12 }}>
                          Laukiančių kvietimų nėra.
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <h3>Komandos valdymas</h3>
                    <p>
                      Narius kviesti, keisti jų roles ir šalinti gali įmonės
                      savininkas. Jūs galite matyti komandą ir dirbti pagal savo
                      rolės teises.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showPlans && (
        <div
          className="ed-plan-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !planActionBusy) {
              setShowPlans(false);
            }
          }}
        >
          <div className="ed-plan-modal">
            <div className="ed-plan-head">
              <div>
                <div className="eyebrow">DARBDAVIO PLANAI</div>
                <h2>Pasirinkite pagal įmonės poreikį</h2>
                <p>
                  Basic skirtas išbandyti paiešką. Business atrakina nuolatinį
                  samdymą ir darbo pokalbius, o Business Pro prideda kelių
                  įmonės žmonių darbų paskirstymą ir atsakomybių valdymą.
                </p>
              </div>

              <button
                className="rs-close"
                type="button"
                disabled={planActionBusy}
                onClick={() => setShowPlans(false)}
              >
                ×
              </button>
            </div>

            <div className="ed-plan-grid">
              {EMPLOYER_PLANS.map((plan) => {
                const current = planSummary?.plan_key === plan.key;
                const isPro = plan.key === "business_pro";

                return (
                  <div
                    className={`ed-plan-card ${current ? "current" : ""} ${
                      isPro ? "pro" : ""
                    }`}
                    key={plan.key}
                  >
                    <div className="eyebrow">
                      {plan.key === "basic"
                        ? "PRADŽIA"
                        : plan.key === "business"
                        ? "POPULIARIAUSIAS"
                        : "KOMANDAI"}
                    </div>
                    <h3>{plan.name}</h3>
                    <div className="ed-plan-price">
                      {plan.price} €{" "}
                      <small>{plan.price ? "/ mėn." : "/ mėn."}</small>
                    </div>
                    <div className="ed-plan-desc">{plan.description}</div>

                    {current && (
                      <span className="ed-plan-current">
                        Dabartinis planas
                      </span>
                    )}

                    <ul className="ed-plan-features">
                      {plan.features.map((feature) => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>

                    {current ? (
                      <button
                        className="ed-secondary"
                        type="button"
                        disabled
                      >
                        Aktyvus planas
                      </button>
                    ) : onAdminReturn ? (
                      <button
                        className={isPro ? "ed-secondary" : "ed-primary"}
                        type="button"
                        disabled={planActionBusy}
                        onClick={() => activatePlanForAdminTest(plan.key)}
                      >
                        {planActionBusy
                          ? "Keičiama..."
                          : "Aktyvuoti testavimui"}
                      </button>
                    ) : (
                      <button
                        className={isPro ? "ed-secondary" : "ed-primary"}
                        type="button"
                        onClick={() => requestPaidPlan(plan.key)}
                      >
                        {plan.price === 0
                          ? "Pasirinkti Basic"
                          : `Pasirinkti ${plan.name}`}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="ed-plan-footnote">
              Kainos nurodytos už vieną mėnesį. Mokėjimų sluoksniui DB jau
              paruoštos prenumeratos būsenos, laikotarpiai ir išorinio
              mokėjimų tiekėjo identifikatoriai. Kortelės apmokėjimo tiekėjas
              prijungiamas atskirai prieš viešą mokamų planų paleidimą.
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

      <CompanyTeamChatModal
        open={showTeamChat}
        onClose={() => setShowTeamChat(false)}
        companyId={company?.id}
        companyName={company?.name}
        user={user}
      />

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
        senderMode={onAdminReturn ? "employer" : null}
      />
      <GroupConversationModal
        open={Boolean(groupConversation)}
        onClose={() => setGroupConversation(null)}
        jobId={groupConversation?.jobId}
        title={groupConversation?.title}
        user={user}
        senderMode={onAdminReturn ? "employer" : null}
      />
    </div>
  );
}




function AdminSetupModal({
  eyebrow,
  title,
  description,
  error,
  onClose,
  children,
}) {
  return (
    <div
      className="admin-setup-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <style>{`
        .admin-setup-overlay{position:fixed;inset:0;z-index:9500;background:rgba(16,36,56,.62);display:grid;place-items:center;padding:20px}
        .admin-setup-card{width:min(760px,100%);max-height:calc(100vh - 40px);overflow:auto;background:#fff;border-radius:18px;box-shadow:0 28px 90px rgba(16,36,56,.30);padding:24px;color:#102438}
        .admin-setup-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:18px}
        .admin-setup-head h2{font-family:Manrope,Inter,sans-serif;margin:4px 0 0;font-size:25px}
        .admin-setup-head p{margin:7px 0 0;color:#6c7a88;line-height:1.5;max-width:620px}
        .admin-setup-close{border:0;background:#f1f4f6;color:#102438;border-radius:9px;width:38px;height:38px;font:inherit;font-size:20px;cursor:pointer}
        .admin-setup-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        .admin-setup-wide{grid-column:1/-1}
        .admin-setup-label{display:grid;gap:6px;font-size:13px;font-weight:800;color:#526374}
        .admin-setup-input{width:100%;border:1px solid #dbe4ea;border-radius:10px;padding:11px 12px;font:inherit;color:#102438;background:#fff;outline:none}
        .admin-setup-input:focus{border-color:#f08a28;box-shadow:0 0 0 3px rgba(240,138,40,.12)}
        .admin-setup-textarea{min-height:105px;resize:vertical}
        .admin-setup-check{display:flex;align-items:center;gap:9px;min-height:44px;color:#102438;font-size:13px;font-weight:800}
        .admin-setup-error{margin-bottom:14px;border-radius:10px;padding:11px 12px;background:#fff0ec;color:#b64d2a;font-size:13px;font-weight:700}
        .admin-setup-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:18px}
        .admin-setup-cancel,.admin-setup-save{border-radius:10px;padding:11px 15px;font:inherit;font-weight:800;cursor:pointer}
        .admin-setup-cancel{border:1px solid #dbe4ea;background:#fff;color:#102438}
        .admin-setup-save{border:0;background:#f08a28;color:#fff}
        .admin-setup-save:disabled,.admin-setup-cancel:disabled{opacity:.55;cursor:wait}
        @media(max-width:620px){.admin-setup-grid{grid-template-columns:1fr}.admin-setup-wide{grid-column:auto}.admin-setup-card{padding:18px}}
      `}</style>

      <div className="admin-setup-card">
        <div className="admin-setup-head">
          <div>
            <div className="eyebrow">{eyebrow}</div>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
          <button
            className="admin-setup-close"
            type="button"
            onClick={onClose}
            aria-label="Uždaryti"
          >
            ×
          </button>
        </div>

        {error && <div className="admin-setup-error">{error}</div>}
        {children}
      </div>
    </div>
  );
}

function AdminWorkerGateway({ user, onAdminReturn, onLogout }) {
  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    displayName: "",
    city: "Vilnius",
    phone: "",
    travelRadius: 30,
    hasDrivingLicenseB: false,
    yearsExperience: 0,
    shortBio: "",
  });

  useEffect(() => {
    let cancelled = false;

    async function checkWorkerMode() {
      setChecking(true);
      setError("");

      try {
        const [profileResult, privateResult, workerResult] = await Promise.all([
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
            .select("user_id")
            .eq("user_id", user.id)
            .maybeSingle(),
        ]);

        if (profileResult.error) throw profileResult.error;
        if (privateResult.error) throw privateResult.error;
        if (workerResult.error) throw workerResult.error;

        if (cancelled) return;

        setForm((current) => ({
          ...current,
          displayName: profileResult.data?.display_name || "",
          city: profileResult.data?.city || "Vilnius",
          phone: privateResult.data?.phone || "",
        }));

        setReady(Boolean(workerResult.data?.user_id));
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Nepavyko patikrinti darbuotojo režimo.");
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    checkWorkerMode();

    return () => {
      cancelled = true;
    };
  }, [user.id]);

  async function activateWorkerMode() {
    setSaving(true);
    setError("");

    try {
      const city = await canonicalCityName(form.city);
      if (!city) {
        throw new Error("Pasirinkite miestą iš pasiūlymų sąrašo.");
      }

      const result = await supabase.rpc("admin_register_worker_mode", {
        p_display_name: form.displayName.trim(),
        p_city: city,
        p_phone: form.phone.trim() || null,
        p_travel_radius_km: Number(form.travelRadius) || 0,
        p_has_driving_license_b: Boolean(form.hasDrivingLicenseB),
        p_years_experience: Number(form.yearsExperience) || 0,
        p_short_bio: form.shortBio.trim() || null,
      });

      if (result.error) throw result.error;
      setReady(true);
    } catch (err) {
      setError(err?.message || "Nepavyko aktyvuoti darbuotojo režimo.");
    } finally {
      setSaving(false);
    }
  }

  if (checking) {
    return (
      <div className="ed-loading">
        <div className="ed-spinner" />
        <b>Tikrinamas darbuotojo režimas...</b>
      </div>
    );
  }

  if (ready) {
    return (
      <WorkerDashboard
        user={user}
        onLogout={onLogout}
        onAdminReturn={onAdminReturn}
      />
    );
  }

  return (
    <AdminSetupModal
      eyebrow="ADMIN · DARBUOTOJO REŽIMAS"
      title="Aktyvuoti darbuotojo profilį"
      description="Administratoriaus rolė išliks. Užpildykite informaciją ir galėsite naudotis sistema taip pat kaip darbuotojas."
      error={error}
      onClose={onAdminReturn}
    >
      <div className="admin-setup-grid">
        <label className="admin-setup-label">
          Vardas
          <input
            className="admin-setup-input"
            value={form.displayName}
            onChange={(e) =>
              setForm((current) => ({ ...current, displayName: e.target.value }))
            }
          />
        </label>

        <label className="admin-setup-label">
          Miestas
          <CityAutocomplete
            className="admin-setup-input"
            value={form.city}
            onChange={(value) =>
              setForm((current) => ({ ...current, city: value }))
            }
          />
        </label>

        <label className="admin-setup-label">
          Telefonas
          <input
            className="admin-setup-input"
            value={form.phone}
            onChange={(e) =>
              setForm((current) => ({ ...current, phone: e.target.value }))
            }
            placeholder="+370..."
          />
        </label>

        <label className="admin-setup-label">
          Kiek km galite nuvykti?
          <input
            className="admin-setup-input"
            type="number"
            min="0"
            max="300"
            value={form.travelRadius}
            onChange={(e) =>
              setForm((current) => ({ ...current, travelRadius: e.target.value }))
            }
          />
        </label>

        <label className="admin-setup-label">
          Patirtis statybose (metais)
          <input
            className="admin-setup-input"
            type="number"
            min="0"
            step="0.5"
            value={form.yearsExperience}
            onChange={(e) =>
              setForm((current) => ({
                ...current,
                yearsExperience: e.target.value,
              }))
            }
          />
        </label>

        <label className="admin-setup-check">
          <input
            type="checkbox"
            checked={form.hasDrivingLicenseB}
            onChange={(e) =>
              setForm((current) => ({
                ...current,
                hasDrivingLicenseB: e.target.checked,
              }))
            }
          />
          Turiu B kategorijos vairuotojo pažymėjimą
        </label>

        <label className="admin-setup-label admin-setup-wide">
          Trumpai apie save
          <textarea
            className="admin-setup-input admin-setup-textarea"
            value={form.shortBio}
            onChange={(e) =>
              setForm((current) => ({ ...current, shortBio: e.target.value }))
            }
          />
        </label>
      </div>

      <div className="admin-setup-actions">
        <button
          className="admin-setup-cancel"
          type="button"
          disabled={saving}
          onClick={onAdminReturn}
        >
          Atšaukti
        </button>
        <button
          className="admin-setup-save"
          type="button"
          disabled={saving}
          onClick={activateWorkerMode}
        >
          {saving ? "Aktyvuojama..." : "Aktyvuoti darbuotojo režimą"}
        </button>
      </div>
    </AdminSetupModal>
  );

}function AdminEmployerGateway({ user, onAdminReturn, onLogout }) {
  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    companyName: "",
    companyCode: "",
    city: "Vilnius",
    phone: "",
    description: "",
  });

  useEffect(() => {
    let cancelled = false;

    async function checkEmployerMode() {
      setChecking(true);
      setError("");

      try {
        const [memberResult, profileResult, privateResult] = await Promise.all([
          supabase
            .from("company_members")
            .select("company_id")
            .eq("user_id", user.id)
            .eq("is_active", true)
            .limit(1)
            .maybeSingle(),
          supabase
            .from("profiles")
            .select("city")
            .eq("id", user.id)
            .single(),
          supabase
            .from("user_private")
            .select("phone")
            .eq("user_id", user.id)
            .maybeSingle(),
        ]);

        if (memberResult.error) throw memberResult.error;
        if (profileResult.error) throw profileResult.error;
        if (privateResult.error) throw privateResult.error;

        if (cancelled) return;

        setReady(Boolean(memberResult.data?.company_id));
        setForm((current) => ({
          ...current,
          city: profileResult.data?.city || "Vilnius",
          phone: privateResult.data?.phone || "",
        }));
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Nepavyko patikrinti darbdavio režimo.");
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    checkEmployerMode();

    return () => {
      cancelled = true;
    };
  }, [user.id]);

  async function activateEmployerMode() {
    setSaving(true);
    setError("");

    try {
      const city = await canonicalCityName(form.city);
      if (!city) {
        throw new Error("Pasirinkite miestą iš pasiūlymų sąrašo.");
      }

      const result = await supabase.rpc("admin_register_employer_mode", {
        p_company_name: form.companyName.trim(),
        p_company_code: form.companyCode.trim() || null,
        p_city: city,
        p_phone: form.phone.trim() || null,
        p_description: form.description.trim() || null,
      });

      if (result.error) throw result.error;
      setReady(true);
    } catch (err) {
      setError(err?.message || "Nepavyko aktyvuoti darbdavio režimo.");
    } finally {
      setSaving(false);
    }
  }

  if (checking) {
    return (
      <div className="ed-loading">
        <div className="ed-spinner" />
        <b>Tikrinamas darbdavio režimas...</b>
      </div>
    );
  }

  if (ready) {
    return (
      <EmployerDashboard
        user={user}
        onLogout={onLogout}
        onAdminReturn={onAdminReturn}
      />
    );
  }

  return (
    <AdminSetupModal
      eyebrow="ADMIN · DARBDAVIO REŽIMAS"
      title="Užregistruoti savo įmonę"
      description="Administratoriaus rolė išliks. Užpildykite įmonės informaciją ir galėsite kurti darbus kaip įprastas darbdavys."
      error={error}
      onClose={onAdminReturn}
    >
      <div className="admin-setup-grid">
        <label className="admin-setup-label">
          Įmonės pavadinimas
          <input
            className="admin-setup-input"
            value={form.companyName}
            onChange={(e) =>
              setForm((current) => ({ ...current, companyName: e.target.value }))
            }
            placeholder="UAB ..."
          />
        </label>

        <label className="admin-setup-label">
          Įmonės kodas
          <input
            className="admin-setup-input"
            value={form.companyCode}
            onChange={(e) =>
              setForm((current) => ({ ...current, companyCode: e.target.value }))
            }
          />
        </label>

        <label className="admin-setup-label">
          Miestas
          <CityAutocomplete
            className="admin-setup-input"
            value={form.city}
            onChange={(value) =>
              setForm((current) => ({ ...current, city: value }))
            }
          />
        </label>

        <label className="admin-setup-label">
          Telefonas
          <input
            className="admin-setup-input"
            value={form.phone}
            onChange={(e) =>
              setForm((current) => ({ ...current, phone: e.target.value }))
            }
            placeholder="+370..."
          />
        </label>

        <label className="admin-setup-label admin-setup-wide">
          Trumpai apie įmonę
          <textarea
            className="admin-setup-input admin-setup-textarea"
            value={form.description}
            onChange={(e) =>
              setForm((current) => ({ ...current, description: e.target.value }))
            }
          />
        </label>
      </div>

      <div className="admin-setup-actions">
        <button
          className="admin-setup-cancel"
          type="button"
          disabled={saving}
          onClick={onAdminReturn}
        >
          Atšaukti
        </button>
        <button
          className="admin-setup-save"
          type="button"
          disabled={saving}
          onClick={activateEmployerMode}
        >
          {saving ? "Kuriama..." : "Aktyvuoti darbdavio režimą"}
        </button>
      </div>
    </AdminSetupModal>
  );

}
function AdminJobChatModal({ job, user, onClose }) {
  const [messages, setMessages] = useState([]);
  const [textValue, setTextValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!job?.job_id) return undefined;

    let cancelled = false;

    async function refresh() {
      try {
        const result = await supabase.rpc("get_admin_job_chat_messages", {
          p_job_id: job.job_id,
        });

        if (result.error) throw result.error;

        if (!cancelled) {
          setMessages(result.data || []);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Nepavyko įkelti darbo pokalbio.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    refresh();
    const timer = window.setInterval(refresh, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [job?.job_id]);

  async function sendMessage(e) {
    e.preventDefault();

    const body = textValue.trim();
    if (!body || !job?.job_id || sending) return;

    setSending(true);
    setError("");

    try {
      const result = await supabase.rpc("admin_send_job_chat_message", {
        p_job_id: job.job_id,
        p_body: body,
      });

      if (result.error) throw result.error;

      setTextValue("");

      const refreshed = await supabase.rpc("get_admin_job_chat_messages", {
        p_job_id: job.job_id,
      });

      if (refreshed.error) throw refreshed.error;
      setMessages(refreshed.data || []);
    } catch (err) {
      setError(err?.message || "Nepavyko išsiųsti žinutės.");
    } finally {
      setSending(false);
    }
  }

  if (!job) return null;

  return (
    <div
      className="admin-chat-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !sending) onClose();
      }}
    >
      <style>{`
        .admin-chat-overlay{position:fixed;inset:0;z-index:9700;background:rgba(16,36,56,.62);display:grid;place-items:center;padding:20px}
        .admin-chat-card{width:min(700px,100%);max-height:calc(100vh - 40px);background:#fff;border-radius:18px;box-shadow:0 28px 90px rgba(16,36,56,.30);padding:22px;color:#102438;display:flex;flex-direction:column}
        .admin-chat-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:13px}
        .admin-chat-head h2{font-family:Manrope,Inter,sans-serif;margin:3px 0 0;font-size:22px}
        .admin-chat-meta{margin-top:5px;color:#6c7a88;font-size:12px}
        .admin-chat-info{background:#edf8f3;color:#167a54;border-radius:10px;padding:10px 12px;margin-bottom:12px;font-size:13px;line-height:1.45}
        .admin-chat-info.cancelled{background:#fff3e7;color:#8a531d}
        .admin-chat-messages{display:grid;gap:10px;min-height:180px;max-height:390px;overflow-y:auto;padding:3px 3px 13px}
        .admin-chat-message{max-width:82%;border-radius:12px;padding:10px 12px;background:#f2f5f7}
        .admin-chat-message.mine{margin-left:auto;background:#fff3e7}
        .admin-chat-message.admin-other{background:#eef3f8}
        .admin-chat-message b{display:block;font-size:12px;margin-bottom:4px}
        .admin-chat-message p{margin:0;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.45}
        .admin-chat-message time{display:block;margin-top:5px;font-size:11px;color:#7a8996}
        .admin-chat-empty{text-align:center;color:#6c7a88;padding:34px 10px}
        .admin-chat-error{background:#fff0ec;color:#b64d2a;border-radius:9px;padding:10px 11px;margin-bottom:10px;font-size:13px}
        .admin-chat-form{display:grid;grid-template-columns:1fr auto;gap:8px;border-top:1px solid #e5ebef;padding-top:14px}
        .admin-chat-form textarea{min-height:52px;max-height:120px;resize:vertical;border:1px solid #dbe4ea;border-radius:10px;padding:11px;font:inherit;color:#102438}
        .admin-chat-form button{border:0;background:#f08a28;color:#fff;border-radius:10px;padding:0 17px;font:inherit;font-weight:800;cursor:pointer}
        .admin-chat-form button:disabled{opacity:.55;cursor:wait}
        @media(max-width:560px){.admin-chat-form{grid-template-columns:1fr}.admin-chat-form button{min-height:44px}.admin-chat-message{max-width:94%}}
      `}</style>

      <div className="admin-chat-card">
        <div className="admin-chat-head">
          <div>
            <div className="eyebrow">ADMINISTRATORIUS · DARBO POKALBIS</div>
            <h2>{job.title || "Darbo pokalbis"}</h2>
            <div className="admin-chat-meta">
              {job.company_name || "Įmonė"} · {job.city || "—"} ·{" "}
              {job.work_date || "—"}
            </div>
          </div>

          <button
            className="rs-close"
            type="button"
            disabled={sending}
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div
          className={`admin-chat-info ${
            job.status === "cancelled" ? "cancelled" : ""
          }`}
        >
          {job.status === "cancelled"
            ? "Darbas atšauktas. Administratorius vis tiek gali peržiūrėti istoriją ir rašyti administracinę žinutę."
            : "Matote visą šio darbo grupinio pokalbio istoriją. Jūsų žinutė bus siunčiama kaip administratoriaus žinutė darbo komandai."}
        </div>

        {error && <div className="admin-chat-error">{error}</div>}

        <div className="admin-chat-messages">
          {loading ? (
            <div className="admin-chat-empty">Kraunamas pokalbis...</div>
          ) : messages.length ? (
            messages.map((message) => {
              const mine = message.sender_id === user?.id;
              const adminOther =
                !mine && String(message.sender_role || "") === "admin";

              return (
                <div
                  className={`admin-chat-message ${
                    mine ? "mine" : adminOther ? "admin-other" : ""
                  }`}
                  key={message.message_id}
                >
                  <b>{message.sender_name || "Vartotojas"}</b>
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
            <div className="admin-chat-empty">
              Šiame darbe žinučių dar nėra.
            </div>
          )}
        </div>

        <form className="admin-chat-form" onSubmit={sendMessage}>
          <textarea
            value={textValue}
            maxLength={2000}
            onChange={(e) => setTextValue(e.target.value)}
            placeholder="Administratoriaus žinutė darbo komandai..."
          />
          <button disabled={sending || !textValue.trim()}>
            {sending ? "Siunčiama..." : "Siųsti"}
          </button>
        </form>
      </div>
    </div>
  );
}

function AdminDashboard({
  user,
  onLogout,
  onOpenWorker,
  onOpenEmployer,
}) {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({});
  const [disputes, setDisputes] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [employers, setEmployers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [files, setFiles] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [actionDialog, setActionDialog] = useState(null);
  const [actionDays, setActionDays] = useState(7);
  const [actionReason, setActionReason] = useState("");
  const [actionConfirm, setActionConfirm] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [resolvingId, setResolvingId] = useState(null);
  const [deletingRatingId, setDeletingRatingId] = useState(null);
  const [editor, setEditor] = useState(null);
  const [adminConversation, setAdminConversation] = useState(null);
  const [editorForm, setEditorForm] = useState({});
  const [editorSaving, setEditorSaving] = useState(false);

  const tabs = [
    ["overview", "Suvestinė"],
    ["disputes", `Ginčai${disputes.length ? ` (${disputes.length})` : ""}`],
    ["workers", "Darbuotojai"],
    ["employers", "Darbdaviai"],
    ["jobs", "Darbai"],
    ["ratings", "Atsiliepimai"],
    ["files", "Failai"],
    ["audit", "Veiksmų istorija"],
  ];

  useEffect(() => {
    loadAdminData();

    const timer = setInterval(() => {
      loadAdminData(true).catch(() => {});
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!notice) return undefined;

    const timer = window.setTimeout(() => {
      setNotice("");
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [notice]);

  async function createSafeFileUrl(bucketId, storagePath) {
    if (!bucketId || !storagePath) return null;

    const signedResult = await supabase.storage
      .from(bucketId)
      .createSignedUrl(storagePath, 60 * 60);

    return signedResult.error
      ? null
      : signedResult.data?.signedUrl || null;
  }

  async function loadAdminData(silent = false) {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const [
        statsResult,
        disputesResult,
        workersResult,
        employersResult,
        jobsResult,
        ratingsResult,
        filesResult,
        auditResult,
      ] = await Promise.all([
        supabase.rpc("get_admin_dashboard_stats"),
        supabase.rpc("get_attendance_disputes"),
        supabase.rpc("get_admin_workers"),
        supabase.rpc("get_admin_employers"),
        supabase.rpc("get_admin_jobs"),
        supabase.rpc("get_admin_ratings"),
        supabase.rpc("get_admin_files"),
        supabase.rpc("get_admin_audit_log"),
      ]);

      const failed = [
        statsResult,
        disputesResult,
        workersResult,
        employersResult,
        jobsResult,
        ratingsResult,
        filesResult,
        auditResult,
      ].find((result) => result.error);

      if (failed?.error) throw failed.error;

      const disputeRows = await Promise.all(
        (disputesResult.data || []).map(async (row) => ({
          ...row,
          evidenceUrl: row.worker_evidence_path
            ? await createSafeFileUrl(
                "attendance-evidence",
                row.worker_evidence_path
              )
            : null,
        }))
      );

      const fileRows = await Promise.all(
        (filesResult.data || []).map(async (row) => ({
          ...row,
          signedUrl: await createSafeFileUrl(
            row.bucket_id,
            row.storage_path
          ),
        }))
      );

      setStats(statsResult.data || {});
      setDisputes(disputeRows);
      setWorkers(workersResult.data || []);
      setEmployers(employersResult.data || []);
      setJobs(jobsResult.data || []);
      setRatings(ratingsResult.data || []);
      setFiles(fileRows);
      setAuditLog(auditResult.data || []);
      setError("");
    } catch (err) {
      setError(err?.message || "Nepavyko įkelti administratoriaus duomenų.");
    } finally {
      setLoading(false);
      setRefreshing(false);
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
      ? "Patvirtinti sprendimą darbuotojo naudai? Jei darbdavio neigiamas pažymėjimas nepasitvirtino, darbdavio patikimumui bus pritaikyta sistemos numatyta bauda."
      : "Patvirtinti sprendimą darbdavio naudai? Darbuotojui bus pritaikytas galutinis darbo dienos rezultatas.";

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

      setNotice("Ginčas išspręstas.");
      await loadAdminData(true);
    } catch (err) {
      setError(err?.message || "Nepavyko išspręsti ginčo.");
    } finally {
      setResolvingId(null);
    }
  }

  function openWorkerEditor(worker) {
    setEditor({ type: "worker", id: worker.user_id });
    setEditorForm({
      displayName: worker.display_name || "",
      legalName: worker.legal_name || "",
      phone: worker.phone || "",
      city: worker.city || "",
      isActive: Boolean(worker.is_active),
      travelRadiusKm: Number(worker.travel_radius_km ?? 30),
      hasDrivingLicenseB: Boolean(worker.has_driving_license_b),
      yearsExperience: Number(worker.years_experience || 0),
      shortBio: worker.short_bio || "",
    });
  }

  function openEmployerEditor(employer) {
    setEditor({
      type: "employer",
      id: employer.company_id,
      ownerId: employer.owner_id,
      originalPlanKey: employer.plan_key || "basic",
      originalSubscriptionStatus: employer.subscription_status || "active",
      originalPlanPeriodEnd: employer.plan_current_period_end
        ? String(employer.plan_current_period_end).slice(0, 10)
        : "",
    });
    setEditorForm({
      displayName: employer.display_name || "",
      phone: employer.phone || "",
      name: employer.company_name || "",
      companyCode: employer.company_code || "",
      vatCode: employer.vat_code || "",
      city: employer.city || "",
      description: employer.description || "",
      isVerified: Boolean(employer.is_verified),
      ownerActive: Boolean(employer.is_active),
      planKey: employer.plan_key || "basic",
      subscriptionStatus: employer.subscription_status || "active",
      planPeriodEnd: employer.plan_current_period_end
        ? String(employer.plan_current_period_end).slice(0, 10)
        : "",
    });
  }

  function openJobEditor(job) {
    setEditor({ type: "job", id: job.job_id });
    setEditorForm({
      title: job.title || "",
      city: job.city || "",
      addressText: job.address_text || "",
      workDate: job.work_date || "",
      startTime: job.start_time?.slice(0, 5) || "08:00",
      endTime: job.end_time?.slice(0, 5) || "17:00",
      breakStartTime: job.break_start_time?.slice(0, 5) || "",
      breakEndTime: job.break_end_time?.slice(0, 5) || "",
      workersNeeded: Number(job.workers_needed || 1),
      payAmount: job.pay_amount ?? "",
      payUnit: job.pay_unit === "day" ? "day" : "hour",
      transportMode:
        job.transport_mode === "employer_pickup"
          ? "employer_pickup"
          : "self_arrival",
      description: job.description || "",
    });
  }

  function updateEditorField(key, value) {
    setEditorForm((current) => ({ ...current, [key]: value }));
  }

  async function saveEditor() {
    if (!editor) return;

    setEditorSaving(true);
    setError("");
    setNotice("");

    try {
      if (editor.type === "worker") {
        const city = await canonicalCityName(editorForm.city);
        if (!city) throw new Error("Pasirinkite miestą iš sąrašo.");

        const [profileResult, contactResult] = await Promise.all([
          supabase.rpc("admin_update_worker", {
            p_user_id: editor.id,
            p_display_name: editorForm.displayName.trim(),
            p_city: city,
            p_is_active: Boolean(editorForm.isActive),
            p_travel_radius_km: Number(editorForm.travelRadiusKm) || 0,
            p_has_driving_license_b: Boolean(
              editorForm.hasDrivingLicenseB
            ),
            p_years_experience: Number(editorForm.yearsExperience) || 0,
            p_short_bio: editorForm.shortBio.trim() || null,
          }),
          supabase.rpc("admin_update_account_contact", {
            p_user_id: editor.id,
            p_display_name: editorForm.displayName.trim(),
            p_legal_name: editorForm.legalName.trim() || null,
            p_phone: editorForm.phone.trim() || null,
          }),
        ]);

        if (profileResult.error) throw profileResult.error;
        if (contactResult.error) throw contactResult.error;
      }

      if (editor.type === "employer") {
        const city = await canonicalCityName(editorForm.city);
        if (!city) throw new Error("Pasirinkite miestą iš sąrašo.");

        const [companyResult, contactResult] = await Promise.all([
          supabase.rpc("admin_update_company", {
            p_company_id: editor.id,
            p_name: editorForm.name.trim(),
            p_company_code: editorForm.companyCode.trim() || null,
            p_vat_code: editorForm.vatCode.trim() || null,
            p_city: city,
            p_description: editorForm.description.trim() || null,
            p_is_verified: Boolean(editorForm.isVerified),
            p_owner_active: Boolean(editorForm.ownerActive),
          }),
          supabase.rpc("admin_update_account_contact", {
            p_user_id: editor.ownerId,
            p_display_name: editorForm.displayName.trim(),
            p_legal_name: null,
            p_phone: editorForm.phone.trim() || null,
          }),
        ]);

        if (companyResult.error) throw companyResult.error;
        if (contactResult.error) throw contactResult.error;

        const planChanged =
          editorForm.planKey !== editor.originalPlanKey ||
          editorForm.subscriptionStatus !==
            editor.originalSubscriptionStatus ||
          editorForm.planPeriodEnd !== editor.originalPlanPeriodEnd;

        if (planChanged) {
          const periodEnd = editorForm.planPeriodEnd
            ? `${editorForm.planPeriodEnd}T23:59:59+03:00`
            : null;

          const planResult = await supabase.rpc("admin_set_company_plan", {
            p_company_id: editor.id,
            p_plan_key: editorForm.planKey,
            p_subscription_status: editorForm.subscriptionStatus,
            p_period_end: periodEnd,
            p_reason: "Planas pakeistas administratoriaus valdymo centre",
          });

          if (planResult.error) throw planResult.error;
        }
      }

      if (editor.type === "job") {
        const city = await canonicalCityName(editorForm.city);
        if (!city) throw new Error("Pasirinkite miestą iš sąrašo.");

        const result = await supabase.rpc("admin_update_job", {
          p_job_id: editor.id,
          p_title: editorForm.title.trim(),
          p_city: city,
          p_address_text: editorForm.addressText.trim() || null,
          p_work_date: editorForm.workDate,
          p_start_time: editorForm.startTime,
          p_end_time: editorForm.endTime,
          p_break_start_time: editorForm.breakStartTime || null,
          p_break_end_time: editorForm.breakEndTime || null,
          p_workers_needed: Number(editorForm.workersNeeded) || 1,
          p_pay_amount: Number(editorForm.payAmount),
          p_pay_unit: editorForm.payUnit,
          p_transport_mode: editorForm.transportMode,
          p_description: editorForm.description.trim() || null,
        });

        if (result.error) throw result.error;
      }

      setEditor(null);
      setNotice("Pakeitimai išsaugoti.");
      await loadAdminData(true);
    } catch (err) {
      setError(err?.message || "Nepavyko išsaugoti pakeitimų.");
    } finally {
      setEditorSaving(false);
    }
  }

  async function deleteRating(rating) {
    if (
      !window.confirm(
        `Pašalinti ${rating.worker_name} įvertinimą ${rating.score}/10?`
      )
    ) {
      return;
    }

    setDeletingRatingId(rating.rating_id);
    setError("");
    setNotice("");

    try {
      const result = await supabase.rpc("admin_delete_worker_rating", {
        p_rating_id: rating.rating_id,
      });

      if (result.error) throw result.error;

      setNotice("Atsiliepimas pašalintas ir darbuotojo vidurkis perskaičiuotas.");
      await loadAdminData(true);
    } catch (err) {
      setError(err?.message || "Nepavyko pašalinti atsiliepimo.");
    } finally {
      setDeletingRatingId(null);
    }
  }

  function isCurrentlySuspended(record) {
    if (!record?.suspended_until) return false;
    const until = new Date(record.suspended_until);
    return !Number.isNaN(until.getTime()) && until > new Date();
  }

  function openAccountAction(type, record, role) {
    const userId = role === "worker" ? record.user_id : record.owner_id;
    const name =
      role === "worker"
        ? record.display_name || record.email || "Darbuotojas"
        : record.company_name || record.display_name || record.email || "Darbdavys";

    setActionDialog({
      type,
      role,
      userId,
      companyId: role === "employer" ? record.company_id : null,
      name,
      email: record.email || "",
    });
    setActionDays(7);
    setActionReason(
      type === "unsuspend"
        ? "Administratoriaus sprendimu suspendavimas panaikintas."
        : ""
    );
    setActionConfirm("");
  }

  function openJobDelete(job) {
    setActionDialog({
      type: "deleteJob",
      jobId: job.job_id,
      name: job.title || "Darbas",
      companyId: job.company_id || null,
    });
    setActionDays(7);
    setActionReason("");
    setActionConfirm("");
  }

  async function removeStorageRows(rows) {
    const unique = new Map();

    for (const row of rows || []) {
      if (!row?.bucket_id || !row?.storage_path) continue;
      unique.set(`${row.bucket_id}:${row.storage_path}`, row);
    }

    const grouped = new Map();

    for (const row of unique.values()) {
      if (!grouped.has(row.bucket_id)) grouped.set(row.bucket_id, []);
      grouped.get(row.bucket_id).push(row.storage_path);
    }

    for (const [bucketId, paths] of grouped.entries()) {
      if (!paths.length) continue;
      const result = await supabase.storage.from(bucketId).remove(paths);
      if (result.error) throw result.error;
    }
  }

  async function performAdminAction() {
    if (!actionDialog) return;

    const destructive =
      actionDialog.type === "deleteAccount" ||
      actionDialog.type === "deleteJob";

    if (actionDialog.type === "suspend") {
      const days = Number(actionDays);

      if (!Number.isInteger(days) || days < 1 || days > 3650) {
        setError("Suspendavimo trukmė turi būti nuo 1 iki 3650 dienų.");
        return;
      }
    }

    if (
      actionDialog.type !== "unsuspend" &&
      actionReason.trim().length < 5
    ) {
      setError("Įrašykite aiškią priežastį (bent 5 simboliai).");
      return;
    }

    if (destructive && actionConfirm.trim().toUpperCase() !== "ISTRINTI") {
      setError('Norėdami patvirtinti trynimą, įrašykite „ISTRINTI“.');
      return;
    }

    setActionBusy(true);
    setError("");
    setNotice("");

    try {
      if (actionDialog.type === "suspend") {
        const result = await supabase.rpc("admin_suspend_user", {
          p_user_id: actionDialog.userId,
          p_days: Number(actionDays),
          p_reason: actionReason.trim(),
        });

        if (result.error) throw result.error;

        setNotice(
          `${actionDialog.name} paskyra suspenduota ${Number(actionDays)} d.`
        );
      }

      if (actionDialog.type === "unsuspend") {
        const result = await supabase.rpc("admin_unsuspend_user", {
          p_user_id: actionDialog.userId,
          p_reason: actionReason.trim() || null,
        });

        if (result.error) throw result.error;
        setNotice(`${actionDialog.name} suspendavimas panaikintas.`);
      }

      if (actionDialog.type === "deleteAccount") {
        const targetJobIds = new Set();

        if (actionDialog.role === "employer" && actionDialog.companyId) {
          for (const job of jobs) {
            if (job.company_id === actionDialog.companyId) {
              targetJobIds.add(job.job_id);
            }
          }
        }

        const relatedFiles = files.filter(
          (file) =>
            file.owner_user_id === actionDialog.userId ||
            (file.job_id && targetJobIds.has(file.job_id))
        );

        const result = await supabase.rpc("admin_delete_user_account", {
          p_user_id: actionDialog.userId,
          p_reason: actionReason.trim(),
        });

        if (result.error) throw result.error;

        let cleanupWarning = "";
        try {
          await removeStorageRows(relatedFiles);
        } catch {
          cleanupWarning =
            " Paskyra pašalinta, bet dalies failų automatiškai išvalyti nepavyko.";
        }

        setEditor(null);
        setNotice(
          `${actionDialog.name} paskyra visiškai pašalinta.${cleanupWarning}`
        );
      }

      if (actionDialog.type === "deleteJob") {
        const relatedFiles = files.filter(
          (file) => file.job_id === actionDialog.jobId
        );

        const result = await supabase.rpc("admin_delete_job", {
          p_job_id: actionDialog.jobId,
          p_reason: actionReason.trim(),
        });

        if (result.error) throw result.error;

        let cleanupWarning = "";
        try {
          await removeStorageRows(relatedFiles);
        } catch {
          cleanupWarning =
            " Darbas pašalintas, bet dalies susijusių failų automatiškai išvalyti nepavyko.";
        }

        if (editor?.type === "job" && editor.id === actionDialog.jobId) {
          setEditor(null);
        }

        setNotice(
          `Darbas „${actionDialog.name}“ ištrintas.${cleanupWarning}`
        );
      }

      setActionDialog(null);
      setActionReason("");
      setActionConfirm("");
      await loadAdminData(true);
    } catch (err) {
      setError(err?.message || "Administratoriaus veiksmo atlikti nepavyko.");
    } finally {
      setActionBusy(false);
    }
  }

  function formatAdminDate(value) {
    if (!value) return "—";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleString("lt-LT", {
      dateStyle: "short",
      timeStyle: "short",
    });
  }

  function bytesLabel(value) {
    const bytes = Number(value);
    if (!Number.isFinite(bytes) || bytes <= 0) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  if (loading) {
    return (
      <div className="ed-loading">
        <div className="ed-spinner" />
        <b>Kraunamas administratoriaus skydelis...</b>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <style>{`
        .admin-page{min-height:100vh;background:#f6f8fa;color:#102438}
        .admin-topbar{min-height:72px;background:#fff;border-bottom:1px solid #e4ebf0;display:flex;align-items:center;position:sticky;top:0;z-index:100}
        .admin-topbar-inner{width:min(1280px,calc(100% - 40px));margin:auto;display:flex;justify-content:space-between;align-items:center;gap:18px}
        .admin-top-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end}
        .admin-mode{border:1px solid #dbe4ea;background:#fff;color:#102438;border-radius:9px;padding:9px 11px;font:inherit;font-size:12px;font-weight:800;cursor:pointer}
        .admin-mode.primary{border-color:#f08a28;background:#f08a28;color:#fff}
        .admin-shell{width:min(1280px,calc(100% - 40px));margin:28px auto 70px}
        .admin-head{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:18px}
        .admin-head h1{font-family:Manrope,Inter,sans-serif;margin:3px 0 0;font-size:34px;letter-spacing:-.035em}
        .admin-head p{margin:8px 0 0;color:#6c7a88;max-width:800px;line-height:1.5}
        .admin-tabs{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:20px}
        .admin-tab{border:1px solid #dbe4ea;background:#fff;color:#526374;border-radius:10px;padding:9px 12px;font:inherit;font-size:13px;font-weight:800;cursor:pointer}
        .admin-tab.active{background:#102438;color:#fff;border-color:#102438}
        .admin-kpis{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:11px}
        .admin-kpi{background:#fff;border:1px solid #e4ebf0;border-radius:14px;padding:17px;min-height:116px;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 7px 22px rgba(16,36,56,.035)}
        .admin-kpi span{color:#6c7a88;font-size:12px;line-height:1.35;min-height:33px}.admin-kpi b{font-family:Manrope,Inter,sans-serif;font-size:28px;line-height:1;margin-top:12px}
        .admin-kpi.attention{border-color:#f0c4b5;background:#fffaf8}.admin-kpi.attention b{color:#b64d2a}
        .admin-toast-stack{position:fixed;top:86px;right:22px;z-index:9800;display:grid;gap:8px;width:min(380px,calc(100vw - 44px))}
        .admin-toast{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;border-radius:12px;padding:12px 13px;box-shadow:0 16px 44px rgba(16,36,56,.18);font-size:13px;font-weight:700;line-height:1.45}
        .admin-toast.ok{background:#edf8f3;border:1px solid #bfe6d3;color:#146f4d}
        .admin-toast.err{background:#fff0ec;border:1px solid #efc4b7;color:#a6462b}
        .admin-toast button{border:0;background:transparent;color:inherit;font:inherit;font-size:18px;line-height:1;cursor:pointer;padding:0 1px}
        .admin-section{width:100%;box-sizing:border-box;background:#fff;border:1px solid #e4ebf0;border-radius:16px;padding:20px;box-shadow:0 8px 28px rgba(16,36,56,.035)}
        .admin-section+.admin-section{margin-top:14px}
        .admin-section-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:14px}
        .admin-section h2{font-family:Manrope,Inter,sans-serif;margin:0;font-size:20px}
        .admin-muted{color:#6c7a88;font-size:13px;line-height:1.5}
        .admin-list{display:grid;gap:10px}
        .admin-row{width:100%;box-sizing:border-box;display:grid;grid-template-columns:minmax(240px,1.35fr) repeat(3,minmax(130px,.72fr)) minmax(110px,auto);gap:14px;align-items:center;border:1px solid #e4ebf0;border-radius:12px;padding:13px 15px}
        .admin-row-title b{display:block;font-size:14px}.admin-row-title span{display:block;margin-top:3px;color:#6c7a88;font-size:12px;line-height:1.4}
        .admin-cell span{display:block;color:#7a8996;font-size:10px;text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px}.admin-cell b{font-size:13px}
        .admin-pill{display:inline-flex;width:max-content;border-radius:999px;padding:5px 8px;font-size:11px;font-weight:800}
        .admin-pill.green{background:#edf8f3;color:#167a54}.admin-pill.orange{background:#fff3e7;color:#b85f0e}.admin-pill.red{background:#fff0ec;color:#b64d2a}.admin-pill.gray{background:#f1f4f6;color:#667788}
        .admin-small-btn{border:1px solid #dbe4ea;background:#fff;color:#102438;border-radius:8px;padding:8px 10px;font:inherit;font-size:12px;font-weight:800;cursor:pointer}
        .admin-small-btn.danger{color:#b64d2a;border-color:#e8bbae}
        .admin-small-btn.warning{color:#b85f0e;border-color:#efc88e}
        .admin-small-btn:disabled{opacity:.55;cursor:wait}
        .admin-row-actions{display:flex;gap:7px;align-items:center;flex-wrap:wrap;justify-content:flex-end}
        .admin-dispute{border:1px solid #e4ebf0;border-radius:14px;padding:18px}.admin-dispute+.admin-dispute{margin-top:10px}
        .admin-dispute-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}
        .admin-facts{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-top:13px}.admin-fact{background:#f6f8fa;border-radius:10px;padding:11px}.admin-fact span{display:block;color:#6c7a88;font-size:10px;margin-bottom:4px}.admin-fact b{font-size:13px}
        .admin-note{margin-top:10px;padding:11px;border-radius:10px;background:#fff3e7;color:#8a531d;font-size:13px;line-height:1.5}
        .admin-actions{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;margin-top:14px}
        .admin-modal-overlay{position:fixed;inset:0;background:rgba(16,36,56,.62);z-index:9000;display:grid;place-items:center;padding:20px}
        .admin-modal{width:min(760px,100%);max-height:calc(100vh - 40px);overflow:auto;background:#fff;border-radius:18px;padding:22px;box-shadow:0 28px 90px rgba(16,36,56,.28)}
        .admin-modal-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:17px}.admin-modal-head h2{margin:2px 0 0;font-family:Manrope,Inter,sans-serif;font-size:22px}
        .admin-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:13px}.admin-wide{grid-column:1/-1}
        .admin-label{display:grid;gap:6px;font-size:12px;font-weight:800;color:#526374}.admin-input{width:100%;border:1px solid #dbe4ea;border-radius:9px;padding:10px 11px;font:inherit;color:#102438;background:#fff}.admin-textarea{min-height:100px;resize:vertical}
        .admin-empty{padding:24px;border:1px dashed #d7e0e6;border-radius:12px;color:#6c7a88;text-align:center}
        .admin-file-link{color:#102438;font-weight:800;text-decoration:underline}
        @media(max-width:1120px){.admin-kpis{grid-template-columns:repeat(4,minmax(0,1fr))}}
        @media(max-width:900px){.admin-row{grid-template-columns:1fr 1fr}.admin-row>:last-child{grid-column:1/-1}.admin-facts{grid-template-columns:1fr 1fr}.admin-kpis{grid-template-columns:repeat(2,minmax(0,1fr))} }
        @media(max-width:620px){.admin-topbar-inner,.admin-shell{width:min(100% - 24px,1280px)}.admin-topbar-inner,.admin-head{align-items:flex-start;flex-direction:column}.admin-top-actions{justify-content:flex-start}.admin-grid-2,.admin-facts,.admin-row,.admin-kpis{grid-template-columns:1fr}.admin-wide,.admin-row>:last-child{grid-column:auto}.admin-head h1{font-size:28px}.admin-toast-stack{top:78px;right:12px;width:calc(100vw - 24px)}}
      `}</style>

      <header className="admin-topbar">
        <div className="admin-topbar-inner">
          <a className="brand" href="#">
            <span className="logo-mark">⌂</span>
            <span>
              rankos<span>statybose</span>.lt
            </span>
          </a>

          <div className="admin-top-actions">
            <button
              className="admin-mode"
              type="button"
              onClick={onOpenWorker}
            >
              Darbuotojo režimas
            </button>
            <button
              className="admin-mode"
              type="button"
              onClick={onOpenEmployer}
            >
              Darbdavio režimas
            </button>
            <button
              className="admin-mode primary"
              type="button"
              disabled={refreshing}
              onClick={() => loadAdminData(true)}
            >
              {refreshing ? "Atnaujinama..." : "Atnaujinti"}
            </button>
            <button className="btn ghost" onClick={onLogout}>
              Atsijungti
            </button>
          </div>
        </div>
      </header>

      <main className="admin-shell">
        <div className="admin-head">
          <div>
            <div className="eyebrow">ADMINISTRATORIAUS VALDYMO CENTRAS</div>
            <h1>Svetainės suvestinė ir valdymas</h1>
            <p>
              Čia matote realų sistemos naudojimą, ginčus, vartotojus, darbus,
              atsiliepimus ir įkeltus failus.
            </p>
          </div>

          <span className="admin-pill green">Administratorius</span>
        </div>

        <div className="admin-tabs">
          {tabs.map(([key, label]) => (
            <button
              key={key}
              className={`admin-tab ${activeTab === key ? "active" : ""}`}
              onClick={() => setActiveTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {(notice || error) && (
          <div className="admin-toast-stack">
            {notice && (
              <div className="admin-toast ok">
                <span>{notice}</span>
                <button
                  type="button"
                  aria-label="Uždaryti pranešimą"
                  onClick={() => setNotice("")}
                >
                  ×
                </button>
              </div>
            )}

            {error && (
              <div className="admin-toast err">
                <span>{error}</span>
                <button
                  type="button"
                  aria-label="Uždaryti klaidos pranešimą"
                  onClick={() => setError("")}
                >
                  ×
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "overview" && (
          <div className="admin-kpis">
            <div className="admin-kpi">
              <span>Darbuotojai</span>
              <b>{Number(stats.totalWorkers || 0)}</b>
            </div>

            <div className="admin-kpi">
              <span>Darbdaviai</span>
              <b>{Number(stats.totalEmployers || 0)}</b>
            </div>

            <div className="admin-kpi">
              <span>Aktyvūs darbai</span>
              <b>{Number(stats.openJobs || 0)}</b>
            </div>

            <div className="admin-kpi">
              <span>Įvykdyti darbai</span>
              <b>{Number(stats.completedJobs || 0)}</b>
            </div>

            <div className="admin-kpi">
              <span>Atšaukti darbai</span>
              <b>{Number(stats.cancelledJobs || 0)}</b>
            </div>

            <div
              className={`admin-kpi ${
                Number(stats.unresolvedDisputes || 0) > 0 ? "attention" : ""
              }`}
            >
              <span>Neišspręsti ginčai</span>
              <b>{Number(stats.unresolvedDisputes || 0)}</b>
            </div>

            <div className="admin-kpi">
              <span>Panaudoti darbuotojai / mėn.</span>
              <b>{Number(stats.workersUsedThisMonth || 0)}</b>
            </div>
          </div>
        )}

        {activeTab === "disputes" && (
          <section className="admin-section">
            <div className="admin-section-head">
              <div>
                <h2>Darbo dienos ginčai</h2>
                <div className="admin-muted">
                  Įvertinkite abiejų pusių informaciją ir įrodymus. Kol ginčas
                  neišspręstas, darbuotojo reitingas nekeičiamas.
                </div>
              </div>
              <span className={`admin-pill ${disputes.length ? "red" : "green"}`}>
                {disputes.length} neišspręsta
              </span>
            </div>

            {disputes.length ? (
              disputes.map((dispute) => {
                const busy = resolvingId === dispute.attendance_id;
                return (
                  <div className="admin-dispute" key={dispute.attendance_id}>
                    <div className="admin-dispute-head">
                      <div>
                        <div className="eyebrow">GINČAS</div>
                        <h2>{dispute.job_title}</h2>
                        <div className="admin-muted">
                          {dispute.work_date} · {dispute.start_time?.slice(0, 5)}
                          {dispute.end_time
                            ? `–${dispute.end_time.slice(0, 5)}`
                            : ""}
                        </div>
                      </div>
                      <span className="admin-pill red">
                        {attendanceOutcomeLabel({
                          employer_outcome: dispute.employer_outcome,
                        })}
                      </span>
                    </div>

                    <div className="admin-facts">
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
                        <b>{formatAdminDate(dispute.worker_check_in_at)}</b>
                      </div>
                      <div className="admin-fact">
                        <span>Darbdavio atvykimo patvirtinimas</span>
                        <b>{formatAdminDate(dispute.employer_check_in_at)}</b>
                      </div>
                      <div className="admin-fact">
                        <span>Faktinis išėjimo laikas</span>
                        <b>{dispute.actual_end_time?.slice(0, 5) || "—"}</b>
                      </div>
                      <div className="admin-fact">
                        <span>Darbuotojo dienos pareiškimas</span>
                        <b>{dispute.worker_workday_claim || "—"}</b>
                      </div>
                    </div>

                    {dispute.employer_note && (
                      <div className="admin-note">
                        <b>Darbdavio paaiškinimas:</b> {dispute.employer_note}
                      </div>
                    )}

                    {dispute.worker_response_note && (
                      <div className="admin-note">
                        <b>Darbuotojo paaiškinimas:</b>{" "}
                        {dispute.worker_response_note}
                      </div>
                    )}

                    {dispute.worker_evidence_path && (
                      <div className="admin-note">
                        <b>Darbuotojo įrodymas:</b>{" "}
                        {dispute.evidenceUrl ? (
                          <a
                            className="admin-file-link"
                            href={dispute.evidenceUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {dispute.worker_evidence_name || "Atidaryti failą"}
                          </a>
                        ) : (
                          <span>
                            {dispute.worker_evidence_name || "Failas įkeltas"} ·
                            saugios peržiūros nuorodos sukurti nepavyko
                          </span>
                        )}
                      </div>
                    )}

                    <div className="admin-actions">
                      <button
                        className="admin-small-btn danger"
                        disabled={busy}
                        onClick={() => resolveDispute(dispute, "employer")}
                      >
                        Darbdavio naudai
                      </button>
                      <button
                        className="admin-small-btn"
                        style={{
                          background: "#1c9b67",
                          color: "#fff",
                          borderColor: "#1c9b67",
                        }}
                        disabled={busy}
                        onClick={() => resolveDispute(dispute, "worker")}
                      >
                        {busy ? "Sprendžiama..." : "Darbuotojo naudai"}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="admin-empty">
                Šiuo metu neišspręstų ginčų nėra.
              </div>
            )}
          </section>
        )}

        {activeTab === "workers" && (
          <section className="admin-section">
            <div className="admin-section-head">
              <div>
                <h2>Darbuotojai</h2>
                <div className="admin-muted">
                  Profiliai, aktyvumas, suspendavimai, patikimumas ir pagrindinių
                  duomenų redagavimas.
                </div>
              </div>
              <b>{workers.length}</b>
            </div>

            {workers.length ? (
              <div className="admin-list">
                {workers.map((worker) => {
                  const suspended = isCurrentlySuspended(worker);
                  const isSelf = worker.user_id === user?.id;

                  return (
                    <div className="admin-row" key={worker.user_id}>
                      <div className="admin-row-title">
                        <b>{worker.display_name || worker.email || "Darbuotojas"}</b>
                        <span>
                          {worker.email || "—"} ·{" "}
                          {worker.city || "Miestas nenurodytas"}
                        </span>
                        {suspended && (
                          <span style={{ color: "#b64d2a", fontWeight: 800 }}>
                            Suspenduota iki {formatAdminDate(worker.suspended_until)}
                            {worker.suspension_reason
                              ? ` · ${worker.suspension_reason}`
                              : ""}
                          </span>
                        )}
                      </div>

                      <div className="admin-cell">
                        <span>Patikimumas</span>
                        <b>{Math.round(Number(worker.attendance_rate ?? 100))}%</b>
                      </div>

                      <div className="admin-cell">
                        <span>Įvertinimas</span>
                        <b>
                          {worker.rating_average === null
                            ? "—"
                            : `${Number(worker.rating_average).toFixed(1)} / 10`}
                        </b>
                      </div>

                      <div className="admin-cell">
                        <span>Suspendavimų istorija</span>
                        <b>{Number(worker.suspension_count || 0)}</b>
                      </div>

                      <div className="admin-row-actions">
                        <span
                          className={`admin-pill ${
                            suspended
                              ? "red"
                              : worker.is_active
                              ? "green"
                              : "gray"
                          }`}
                        >
                          {suspended
                            ? "Suspenduotas"
                            : worker.is_active
                            ? "Aktyvus"
                            : "Išjungtas"}
                        </span>

                        <button
                          className="admin-small-btn"
                          onClick={() => openWorkerEditor(worker)}
                        >
                          Redaguoti
                        </button>

                        {!isSelf && (
                          <>
                            <button
                              className="admin-small-btn"
                              onClick={() =>
                                openAccountAction(
                                  suspended ? "unsuspend" : "suspend",
                                  worker,
                                  "worker"
                                )
                              }
                            >
                              {suspended
                                ? "Nuimti suspendavimą"
                                : "Suspenduoti"}
                            </button>

                            <button
                              className="admin-small-btn danger"
                              onClick={() =>
                                openAccountAction(
                                  "deleteAccount",
                                  worker,
                                  "worker"
                                )
                              }
                            >
                              Ištrinti paskyrą
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="admin-empty">Darbuotojų dar nėra.</div>
            )}
          </section>
        )}

        {activeTab === "employers" && (
          <section className="admin-section">
            <div className="admin-section-head">
              <div>
                <h2>Darbdaviai ir įmonės</h2>
                <div className="admin-muted">
                  Įmonės informacija, suspendavimai, patikimumas, atšaukimai ir
                  patvirtinimo būsena.
                </div>
              </div>
              <b>{employers.length}</b>
            </div>

            {employers.length ? (
              <div className="admin-list">
                {employers.map((employer) => {
                  const suspended = isCurrentlySuspended(employer);
                  const isSelf = employer.owner_id === user?.id;

                  return (
                    <div
                      className="admin-row"
                      key={employer.company_id || employer.owner_id}
                    >
                      <div className="admin-row-title">
                        <b>{employer.company_name || "Įmonė"}</b>
                        <span>
                          {employer.email || "—"} ·{" "}
                          {employer.city || "Miestas nenurodytas"}
                        </span>
                        <span style={{ fontWeight: 800, color: "#405264" }}>
                          Planas: {employerPlanName(employer.plan_key)} ·{" "}
                          {employer.subscription_status || "active"} ·{" "}
                          {Number(employer.jobs_used_this_month || 0)} darbai šį mėn.
                        </span>
                        {suspended && (
                          <span style={{ color: "#b64d2a", fontWeight: 800 }}>
                            Suspenduota iki{" "}
                            {formatAdminDate(employer.suspended_until)}
                            {employer.suspension_reason
                              ? ` · ${employer.suspension_reason}`
                              : ""}
                          </span>
                        )}
                      </div>

                      <div className="admin-cell">
                        <span>Patikimumas</span>
                        <b>
                          {Number(employer.reliability_rate ?? 100).toFixed(0)} / 100
                        </b>
                      </div>

                      <div className="admin-cell">
                        <span>Darbų</span>
                        <b>{Number(employer.jobs_count || 0)}</b>
                      </div>

                      <div className="admin-cell">
                        <span>Suspendavimų istorija</span>
                        <b>{Number(employer.suspension_count || 0)}</b>
                      </div>

                      <div className="admin-row-actions">
                        <span
                          className={`admin-pill ${
                            suspended
                              ? "red"
                              : employer.is_verified
                              ? "green"
                              : "gray"
                          }`}
                        >
                          {suspended
                            ? "Suspenduotas"
                            : employer.is_verified
                            ? "Patvirtinta"
                            : "Nepatvirtinta"}
                        </span>

                        <button
                          className="admin-small-btn"
                          onClick={() => openEmployerEditor(employer)}
                        >
                          Redaguoti
                        </button>

                        {!isSelf && employer.account_role !== "admin" && (
                          <>
                            <button
                              className="admin-small-btn"
                              onClick={() =>
                                openAccountAction(
                                  suspended ? "unsuspend" : "suspend",
                                  employer,
                                  "employer"
                                )
                              }
                            >
                              {suspended
                                ? "Nuimti suspendavimą"
                                : "Suspenduoti"}
                            </button>

                            <button
                              className="admin-small-btn danger"
                              onClick={() =>
                                openAccountAction(
                                  "deleteAccount",
                                  employer,
                                  "employer"
                                )
                              }
                            >
                              Ištrinti paskyrą
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="admin-empty">Darbdavių dar nėra.</div>
            )}
          </section>
        )}

        {activeTab === "jobs" && (
          <section className="admin-section">
            <div className="admin-section-head">
              <div>
                <h2>Visi darbai</h2>
                <div className="admin-muted">
                  Administratorius gali redaguoti darbo duomenis, atidaryti
                  visą darbo pokalbį, rašyti darbo komandai arba pašalinti darbą.
                </div>
              </div>
              <b>{jobs.length}</b>
            </div>

            {jobs.length ? (
              <div className="admin-list">
                {jobs.map((job) => (
                  <div className="admin-row" key={job.job_id}>
                    <div className="admin-row-title">
                      <b>{job.title}</b>
                      <span>
                        {job.company_name} · {job.city} · {job.work_date}
                      </span>
                    </div>

                    <div className="admin-cell">
                      <span>Būsena</span>
                      <b>{job.status}</b>
                    </div>

                    <div className="admin-cell">
                      <span>Žmonių</span>
                      <b>
                        {Number(job.confirmed_workers || 0)} /{" "}
                        {Number(job.workers_needed || 0)}
                      </b>
                    </div>

                    <div className="admin-cell">
                      <span>Atlygis</span>
                      <b>{formatNetPay(job.pay_amount, job.pay_unit)}</b>
                    </div>

                    <div className="admin-row-actions">
                      <button
                        className="admin-small-btn"
                        onClick={() => setAdminConversation(job)}
                      >
                        Darbo pokalbis
                      </button>

                      <button
                        className="admin-small-btn"
                        onClick={() => openJobEditor(job)}
                      >
                        Redaguoti
                      </button>

                      <button
                        className="admin-small-btn danger"
                        onClick={() => openJobDelete(job)}
                      >
                        Ištrinti darbą
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="admin-empty">Darbo pasiūlymų dar nėra.</div>
            )}
          </section>
        )}

        {activeTab === "ratings" && (
          <section className="admin-section">
            <div className="admin-section-head">
              <div>
                <h2>Darbuotojų atsiliepimai</h2>
                <div className="admin-muted">
                  Matomi visi darbdavių palikti balai ir komentarai. Administratorius
                  gali pašalinti netinkamą ar piktnaudžiaujantį atsiliepimą.
                </div>
              </div>
              <b>{ratings.length}</b>
            </div>

            {ratings.length ? (
              <div className="admin-list">
                {ratings.map((rating) => (
                  <div className="admin-row" key={rating.rating_id}>
                    <div className="admin-row-title">
                      <b>
                        {rating.worker_name} · {rating.score} / 10
                      </b>
                      <span>
                        {rating.company_name} · {rating.job_title}
                      </span>
                      {rating.comment && (
                        <span style={{ color: "#405264", marginTop: 7 }}>
                          „{rating.comment}“
                        </span>
                      )}
                    </div>
                    <div className="admin-cell">
                      <span>Data</span>
                      <b>{formatAdminDate(rating.created_at)}</b>
                    </div>
                    <div className="admin-cell">
                      <span>Darbdavys</span>
                      <b>{rating.company_name}</b>
                    </div>
                    <div className="admin-cell">
                      <span>Darbas</span>
                      <b>{rating.job_title}</b>
                    </div>
                    <button
                      className="admin-small-btn danger"
                      disabled={deletingRatingId === rating.rating_id}
                      onClick={() => deleteRating(rating)}
                    >
                      {deletingRatingId === rating.rating_id
                        ? "Šalinama..."
                        : "Pašalinti"}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="admin-empty">Atsiliepimų dar nėra.</div>
            )}
          </section>
        )}

        {activeTab === "files" && (
          <section className="admin-section">
            <div className="admin-section-head">
              <div>
                <h2>Įkelti failai</h2>
                <div className="admin-muted">
                  Administratoriui rodomas visų sistemos Storage bucketų failų
                  sąrašas. Šiuo metu naudojami ginčų įrodymų failai; atsiradus
                  kitoms įkėlimo funkcijoms, jų failai taip pat pateks čia.
                </div>
              </div>
              <b>{files.length}</b>
            </div>

            {files.length ? (
              <div className="admin-list">
                {files.map((file) => (
                  <div className="admin-row" key={file.object_id}>
                    <div className="admin-row-title">
                      <b>{file.file_name || file.storage_path}</b>
                      <span>
                        {file.bucket_id} · {file.owner_name || "Savininkas nenustatytas"}
                      </span>
                    </div>
                    <div className="admin-cell">
                      <span>Įkelta</span>
                      <b>{formatAdminDate(file.uploaded_at)}</b>
                    </div>
                    <div className="admin-cell">
                      <span>Dydis</span>
                      <b>{bytesLabel(file.size_bytes)}</b>
                    </div>
                    <div className="admin-cell">
                      <span>Susijęs darbas</span>
                      <b>{file.job_title || "—"}</b>
                    </div>
                    {file.signedUrl ? (
                      <a
                        className="admin-small-btn"
                        href={file.signedUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ textDecoration: "none" }}
                      >
                        Atidaryti
                      </a>
                    ) : (
                      <span className="admin-pill gray">Peržiūra negalima</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="admin-empty">Įkeltų failų šiuo metu nėra.</div>
            )}
          </section>
        )}
        {activeTab === "audit" && (
          <section className="admin-section">
            <div className="admin-section-head">
              <div>
                <h2>Administratoriaus veiksmų istorija</h2>
                <div className="admin-muted">
                  Suspendavimai, suspendavimo panaikinimai ir negrįžtami
                  trynimai registruojami audito istorijoje.
                </div>
              </div>
              <b>{auditLog.length}</b>
            </div>

            {auditLog.length ? (
              <div className="admin-list">
                {auditLog.map((item) => (
                  <div className="admin-row" key={item.audit_id}>
                    <div className="admin-row-title">
                      <b>
                        {item.action === "suspend_user"
                          ? "Paskyra suspenduota"
                          : item.action === "unsuspend_user"
                          ? "Suspendavimas panaikintas"
                          : item.action === "delete_user_account"
                          ? "Paskyra ištrinta"
                          : item.action === "delete_job"
                          ? "Darbas ištrintas"
                          : item.action}
                      </b>
                      <span>
                        {item.target_email || item.target_user_id || "—"}
                        {item.target_role ? ` · ${item.target_role}` : ""}
                      </span>
                      {item.reason && (
                        <span style={{ color: "#405264", marginTop: 6 }}>
                          {item.reason}
                        </span>
                      )}
                    </div>

                    <div className="admin-cell">
                      <span>Administratorius</span>
                      <b>{item.admin_name || item.admin_email || "—"}</b>
                    </div>

                    <div className="admin-cell">
                      <span>Data</span>
                      <b>{formatAdminDate(item.created_at)}</b>
                    </div>

                    <div className="admin-cell">
                      <span>Veiksmas</span>
                      <b>{item.action}</b>
                    </div>

                    <span className="admin-pill gray">Auditas</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="admin-empty">Administratoriaus veiksmų dar nėra.</div>
            )}
          </section>
        )}

      </main>


      <AdminJobChatModal
        job={adminConversation}
        user={user}
        onClose={() => setAdminConversation(null)}
      />

      {editor && (
        <div
          className="admin-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !editorSaving) {
              setEditor(null);
            }
          }}
        >
          <div className="admin-modal">
            <div className="admin-modal-head">
              <div>
                <div className="eyebrow">ADMINISTRATORIAUS REDAGAVIMAS</div>
                <h2>
                  {editor.type === "worker"
                    ? "Darbuotojo informacija"
                    : editor.type === "employer"
                    ? "Darbdavio informacija"
                    : "Darbo pasiūlymas"}
                </h2>
              </div>
              <button
                className="rs-close"
                disabled={editorSaving}
                onClick={() => setEditor(null)}
              >
                ×
              </button>
            </div>

            {editor.type === "worker" && (
              <div className="admin-grid-2">
                <label className="admin-label">
                  Rodomas vardas
                  <input
                    className="admin-input"
                    value={editorForm.displayName}
                    onChange={(e) =>
                      updateEditorField("displayName", e.target.value)
                    }
                  />
                </label>
                <label className="admin-label">
                  Teisinis vardas / pavardė
                  <input
                    className="admin-input"
                    value={editorForm.legalName}
                    onChange={(e) =>
                      updateEditorField("legalName", e.target.value)
                    }
                  />
                </label>
                <label className="admin-label">
                  Telefonas
                  <input
                    className="admin-input"
                    value={editorForm.phone}
                    onChange={(e) =>
                      updateEditorField("phone", e.target.value)
                    }
                  />
                </label>
                <label className="admin-label">
                  Miestas
                  <CityAutocomplete
                    className="admin-input"
                    value={editorForm.city}
                    onChange={(value) => updateEditorField("city", value)}
                  />
                </label>
                <label className="admin-label">
                  Kelionės spindulys, km
                  <input
                    className="admin-input"
                    type="number"
                    min="0"
                    max="300"
                    value={editorForm.travelRadiusKm}
                    onChange={(e) =>
                      updateEditorField("travelRadiusKm", e.target.value)
                    }
                  />
                </label>
                <label className="admin-label">
                  Patirtis, metais
                  <input
                    className="admin-input"
                    type="number"
                    min="0"
                    step="0.5"
                    value={editorForm.yearsExperience}
                    onChange={(e) =>
                      updateEditorField("yearsExperience", e.target.value)
                    }
                  />
                </label>
                <label className="admin-label">
                  <span>
                    <input
                      type="checkbox"
                      checked={editorForm.hasDrivingLicenseB}
                      onChange={(e) =>
                        updateEditorField(
                          "hasDrivingLicenseB",
                          e.target.checked
                        )
                      }
                    />{" "}
                    B kategorija
                  </span>
                </label>
                <label className="admin-label">
                  <span>
                    <input
                      type="checkbox"
                      checked={editorForm.isActive}
                      onChange={(e) =>
                        updateEditorField("isActive", e.target.checked)
                      }
                    />{" "}
                    Paskyra aktyvi
                  </span>
                </label>
                <label className="admin-label admin-wide">
                  Aprašymas
                  <textarea
                    className="admin-input admin-textarea"
                    value={editorForm.shortBio}
                    onChange={(e) =>
                      updateEditorField("shortBio", e.target.value)
                    }
                  />
                </label>
              </div>
            )}

            {editor.type === "employer" && (
              <div className="admin-grid-2">
                <label className="admin-label">
                  Paskyros vardas
                  <input
                    className="admin-input"
                    value={editorForm.displayName}
                    onChange={(e) =>
                      updateEditorField("displayName", e.target.value)
                    }
                  />
                </label>
                <label className="admin-label">
                  Telefonas
                  <input
                    className="admin-input"
                    value={editorForm.phone}
                    onChange={(e) =>
                      updateEditorField("phone", e.target.value)
                    }
                  />
                </label>
                <label className="admin-label">
                  Įmonės pavadinimas
                  <input
                    className="admin-input"
                    value={editorForm.name}
                    onChange={(e) => updateEditorField("name", e.target.value)}
                  />
                </label>
                <label className="admin-label">
                  Įmonės kodas
                  <input
                    className="admin-input"
                    value={editorForm.companyCode}
                    onChange={(e) =>
                      updateEditorField("companyCode", e.target.value)
                    }
                  />
                </label>
                <label className="admin-label">
                  PVM kodas
                  <input
                    className="admin-input"
                    value={editorForm.vatCode}
                    onChange={(e) =>
                      updateEditorField("vatCode", e.target.value)
                    }
                  />
                </label>
                <label className="admin-label">
                  Miestas
                  <CityAutocomplete
                    className="admin-input"
                    value={editorForm.city}
                    onChange={(value) => updateEditorField("city", value)}
                  />
                </label>
                <label className="admin-label">
                  <span>
                    <input
                      type="checkbox"
                      checked={editorForm.isVerified}
                      onChange={(e) =>
                        updateEditorField("isVerified", e.target.checked)
                      }
                    />{" "}
                    Įmonė patvirtinta
                  </span>
                </label>
                <label className="admin-label">
                  <span>
                    <input
                      type="checkbox"
                      checked={editorForm.ownerActive}
                      onChange={(e) =>
                        updateEditorField("ownerActive", e.target.checked)
                      }
                    />{" "}
                    Savininko paskyra aktyvi
                  </span>
                </label>
                <label className="admin-label">
                  Planas
                  <select
                    className="admin-input"
                    value={editorForm.planKey}
                    onChange={(e) =>
                      updateEditorField("planKey", e.target.value)
                    }
                  >
                    <option value="basic">Basic · 0 €</option>
                    <option value="business">Business · 29 €</option>
                    <option value="business_pro">Business Pro · 59 €</option>
                  </select>
                </label>

                <label className="admin-label">
                  Prenumeratos būsena
                  <select
                    className="admin-input"
                    value={editorForm.subscriptionStatus}
                    onChange={(e) =>
                      updateEditorField("subscriptionStatus", e.target.value)
                    }
                  >
                    <option value="active">Aktyvi</option>
                    <option value="trialing">Bandomoji</option>
                    <option value="past_due">Laukiama apmokėjimo</option>
                    <option value="cancelled">Nutraukta</option>
                  </select>
                </label>

                <label className="admin-label">
                  Apmokėta iki / laikotarpio pabaiga
                  <input
                    className="admin-input"
                    type="date"
                    value={editorForm.planPeriodEnd}
                    onChange={(e) =>
                      updateEditorField("planPeriodEnd", e.target.value)
                    }
                  />
                </label>

                <label className="admin-label admin-wide">
                  Įmonės aprašymas
                  <textarea
                    className="admin-input admin-textarea"
                    value={editorForm.description}
                    onChange={(e) =>
                      updateEditorField("description", e.target.value)
                    }
                  />
                </label>
              </div>
            )}

            {editor.type === "job" && (
              <div className="admin-grid-2">
                <label className="admin-label admin-wide">
                  Pavadinimas
                  <input
                    className="admin-input"
                    value={editorForm.title}
                    onChange={(e) => updateEditorField("title", e.target.value)}
                  />
                </label>
                <label className="admin-label">
                  Miestas
                  <CityAutocomplete
                    className="admin-input"
                    value={editorForm.city}
                    onChange={(value) => updateEditorField("city", value)}
                  />
                </label>
                <label className="admin-label">
                  Adresas
                  <input
                    className="admin-input"
                    value={editorForm.addressText}
                    onChange={(e) =>
                      updateEditorField("addressText", e.target.value)
                    }
                  />
                </label>
                <label className="admin-label">
                  Data
                  <input
                    className="admin-input"
                    type="date"
                    value={editorForm.workDate}
                    onChange={(e) =>
                      updateEditorField("workDate", e.target.value)
                    }
                  />
                </label>
                <label className="admin-label">
                  Žmonių skaičius
                  <input
                    className="admin-input"
                    type="number"
                    min="1"
                    max="100"
                    value={editorForm.workersNeeded}
                    onChange={(e) =>
                      updateEditorField("workersNeeded", e.target.value)
                    }
                  />
                </label>
                <label className="admin-label">
                  Pradžia
                  <input
                    className="admin-input"
                    type="time"
                    value={editorForm.startTime}
                    onChange={(e) =>
                      updateEditorField("startTime", e.target.value)
                    }
                  />
                </label>
                <label className="admin-label">
                  Pabaiga
                  <input
                    className="admin-input"
                    type="time"
                    value={editorForm.endTime}
                    onChange={(e) =>
                      updateEditorField("endTime", e.target.value)
                    }
                  />
                </label>
                <label className="admin-label">
                  Pietų pradžia
                  <input
                    className="admin-input"
                    type="time"
                    value={editorForm.breakStartTime}
                    onChange={(e) =>
                      updateEditorField("breakStartTime", e.target.value)
                    }
                  />
                </label>
                <label className="admin-label">
                  Pietų pabaiga
                  <input
                    className="admin-input"
                    type="time"
                    value={editorForm.breakEndTime}
                    onChange={(e) =>
                      updateEditorField("breakEndTime", e.target.value)
                    }
                  />
                </label>
                <label className="admin-label">
                  Atlygis
                  <input
                    className="admin-input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editorForm.payAmount}
                    onChange={(e) =>
                      updateEditorField("payAmount", e.target.value)
                    }
                  />
                </label>
                <label className="admin-label">
                  Atlygio vienetas
                  <select
                    className="admin-input"
                    value={editorForm.payUnit}
                    onChange={(e) =>
                      updateEditorField("payUnit", e.target.value)
                    }
                  >
                    <option value="hour">Už valandą</option>
                    <option value="day">Už dieną</option>
                  </select>
                </label>
                <label className="admin-label admin-wide">
                  Atvykimas
                  <select
                    className="admin-input"
                    value={editorForm.transportMode}
                    onChange={(e) =>
                      updateEditorField("transportMode", e.target.value)
                    }
                  >
                    <option value="self_arrival">
                      Darbuotojas atvyksta pats
                    </option>
                    <option value="employer_pickup">
                      Darbdavys paima darbuotoją
                    </option>
                  </select>
                </label>
                <label className="admin-label admin-wide">
                  Aprašymas
                  <textarea
                    className="admin-input admin-textarea"
                    value={editorForm.description}
                    onChange={(e) =>
                      updateEditorField("description", e.target.value)
                    }
                  />
                </label>
              </div>
            )}

            <div className="admin-actions">
              {editor.type === "job" && (
                <button
                  className="admin-small-btn danger"
                  disabled={editorSaving}
                  onClick={() =>
                    openJobDelete({
                      job_id: editor.id,
                      title: editorForm.title || "Darbas",
                      company_id: null,
                    })
                  }
                  style={{ marginRight: "auto" }}
                >
                  Ištrinti darbą
                </button>
              )}

              <button
                className="admin-small-btn"
                disabled={editorSaving}
                onClick={() => setEditor(null)}
              >
                Atšaukti
              </button>
              <button
                className="admin-small-btn"
                style={{
                  background: "#f08a28",
                  color: "#fff",
                  borderColor: "#f08a28",
                }}
                disabled={editorSaving}
                onClick={saveEditor}
              >
                {editorSaving ? "Saugoma..." : "Išsaugoti"}
              </button>
            </div>
          </div>
        </div>
      )}

      {actionDialog && (
        <div
          className="admin-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !actionBusy) {
              setActionDialog(null);
            }
          }}
        >
          <div className="admin-modal" style={{ width: "min(600px,100%)" }}>
            <div className="admin-modal-head">
              <div>
                <div className="eyebrow">
                  {actionDialog.type === "suspend"
                    ? "PASKYROS SUSPENDAVIMAS"
                    : actionDialog.type === "unsuspend"
                    ? "SUSPENDAVIMO PANAIKINIMAS"
                    : actionDialog.type === "deleteJob"
                    ? "DARBO TRYNIMAS"
                    : "PASKYROS TRYNIMAS"}
                </div>
                <h2>
                  {actionDialog.type === "suspend"
                    ? `Suspenduoti: ${actionDialog.name}`
                    : actionDialog.type === "unsuspend"
                    ? `Nuimti suspendavimą: ${actionDialog.name}`
                    : actionDialog.type === "deleteJob"
                    ? `Ištrinti darbą: ${actionDialog.name}`
                    : `Visiškai ištrinti: ${actionDialog.name}`}
                </h2>
              </div>

              <button
                className="rs-close"
                disabled={actionBusy}
                onClick={() => setActionDialog(null)}
              >
                ×
              </button>
            </div>

            {actionDialog.type === "suspend" && (
              <label className="admin-label">
                Kiek dienų suspenduoti?
                <input
                  className="admin-input"
                  type="number"
                  min="1"
                  max="3650"
                  value={actionDays}
                  onChange={(e) => setActionDays(e.target.value)}
                />
              </label>
            )}

            <label className="admin-label" style={{ marginTop: 13 }}>
              {actionDialog.type === "unsuspend" ? "Pastaba" : "Priežastis *"}
              <textarea
                className="admin-input admin-textarea"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder={
                  actionDialog.type === "suspend"
                    ? "Pvz. Pakartotinis neatvykimas ir taisyklių pažeidimas..."
                    : actionDialog.type === "deleteAccount"
                    ? "Pvz. Pakartotiniai rimti pažeidimai..."
                    : actionDialog.type === "deleteJob"
                    ? "Kodėl šis darbo pasiūlymas šalinamas?"
                    : "Administratoriaus pastaba..."
                }
              />
            </label>

            {(actionDialog.type === "deleteAccount" ||
              actionDialog.type === "deleteJob") && (
              <div
                className="admin-note"
                style={{ background: "#fff0ec", color: "#9f4529" }}
              >
                <b>Negrįžtamas veiksmas.</b>{" "}
                {actionDialog.type === "deleteAccount"
                  ? "Bus pašalinta paskyra ir su ja susiję sistemos duomenys."
                  : "Bus pašalintas darbas ir su juo susiję kvietimai, rezervacijos bei darbo dienų įrašai."}

                <label className="admin-label" style={{ marginTop: 12 }}>
                  Patvirtinimui įrašykite ISTRINTI
                  <input
                    className="admin-input"
                    value={actionConfirm}
                    onChange={(e) => setActionConfirm(e.target.value)}
                    placeholder="ISTRINTI"
                  />
                </label>
              </div>
            )}

            <div className="admin-actions">
              <button
                className="admin-small-btn"
                disabled={actionBusy}
                onClick={() => setActionDialog(null)}
              >
                Atšaukti
              </button>

              <button
                className={`admin-small-btn ${
                  actionDialog.type === "deleteAccount" ||
                  actionDialog.type === "deleteJob"
                    ? "danger"
                    : ""
                }`}
                disabled={actionBusy}
                onClick={performAdminAction}
                style={
                  actionDialog.type === "deleteAccount" ||
                  actionDialog.type === "deleteJob"
                    ? undefined
                    : {
                        background: "#102438",
                        color: "#fff",
                        borderColor: "#102438",
                      }
                }
              >
                {actionBusy
                  ? "Vykdoma..."
                  : actionDialog.type === "suspend"
                  ? "Suspenduoti"
                  : actionDialog.type === "unsuspend"
                  ? "Nuimti suspendavimą"
                  : actionDialog.type === "deleteJob"
                  ? "Ištrinti darbą"
                  : "Ištrinti paskyrą"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function SuspendedAccount({
  onLogout,
  suspendedUntil,
  reason,
  disabled = false,
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f6f8fa",
        display: "grid",
        placeItems: "center",
        padding: 20,
        color: "#102438",
      }}
    >
      <div
        style={{
          width: "min(620px,100%)",
          background: "#fff",
          border: "1px solid #e4ebf0",
          borderRadius: 18,
          padding: 26,
          boxShadow: "0 18px 55px rgba(16,36,56,.10)",
        }}
      >
        <div className="eyebrow">
          {disabled ? "PASKYRA IŠJUNGTA" : "PASKYRA SUSPENDUOTA"}
        </div>

        <h1
          style={{
            fontFamily: "Manrope,Inter,sans-serif",
            margin: "6px 0 10px",
            fontSize: 28,
          }}
        >
          {disabled
            ? "Šios paskyros naudojimas išjungtas"
            : "Šios paskyros naudojimas laikinai sustabdytas"}
        </h1>

        <p style={{ color: "#6c7a88", lineHeight: 1.6 }}>
          {disabled
            ? "Administratoriaus sprendimu ši paskyra šiuo metu negali naudotis platformos funkcijomis."
            : `Paskyra suspenduota iki ${
                suspendedUntil
                  ? new Date(suspendedUntil).toLocaleString("lt-LT", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "nurodyto termino"
              }.`}
        </p>

        {reason && (
          <div
            style={{
              marginTop: 14,
              padding: 13,
              borderRadius: 10,
              background: "#fff3e7",
              color: "#8a531d",
              lineHeight: 1.5,
            }}
          >
            <b>Priežastis:</b> {reason}
          </div>
        )}

        <div
          style={{
            marginTop: 20,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button className="btn ghost" onClick={onLogout}>
            Atsijungti
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [accountRole, setAccountRole] = useState(null);
  const [accountStatus, setAccountStatus] = useState({
    isActive: true,
    suspendedUntil: null,
    suspensionReason: null,
  });
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authRole, setAuthRole] = useState("worker");
  const [adminMode, setAdminMode] = useState("admin");
  const [teamInviteToken, setTeamInviteToken] = useState(() =>
    new URLSearchParams(window.location.search).get("team_invite")
  );
  const [teamInvite, setTeamInvite] = useState(null);
  const [teamInviteLoading, setTeamInviteLoading] = useState(false);
  const [teamInviteError, setTeamInviteError] = useState("");
  const [teamInviteAccepting, setTeamInviteAccepting] = useState(false);

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
    if (!teamInviteToken || !supabase) {
      setTeamInvite(null);
      setTeamInviteError("");
      setTeamInviteLoading(false);
      return;
    }

    let cancelled = false;
    setTeamInviteLoading(true);
    setTeamInviteError("");

    supabase
      .rpc("get_company_team_invite_public", {
        p_token: teamInviteToken,
      })
      .then(({ data, error }) => {
        if (cancelled) return;

        if (error) {
          setTeamInvite(null);
          setTeamInviteError(
            error.message || "Nepavyko patikrinti komandos kvietimo."
          );
        } else {
          setTeamInvite(data?.[0] || null);
        }

        setTeamInviteLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [teamInviteToken]);

  useEffect(() => {
    if (!user || !supabase) {
      setAccountRole(null);
      setAccountStatus({
        isActive: true,
        suspendedUntil: null,
        suspensionReason: null,
      });
      return;
    }

    let cancelled = false;

    supabase
      .from("profiles")
      .select("role, is_active, suspended_until, suspension_reason")
      .eq("id", user.id)
      .single()
      .then(({ data, error }) => {
        if (!cancelled) {
          if (error) {
            console.error(error);
            setAccountRole(null);
          } else {
            setAccountRole(data?.role || null);
            setAccountStatus({
              isActive: data?.is_active !== false,
              suspendedUntil: data?.suspended_until || null,
              suspensionReason: data?.suspension_reason || null,
            });
          }
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user || accountRole !== "admin") {
      setAdminMode("admin");
    }
  }, [user?.id, accountRole]);

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

  const clearTeamInvite = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("team_invite");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    setTeamInviteToken(null);
    setTeamInvite(null);
    setTeamInviteError("");
  };

  const openTeamInviteLogin = () => {
    setAuthMode("login");
    setAuthRole("employer");
    setAuthOpen(true);
  };

  const openTeamInviteSignup = () => {
    setAuthMode("signup");
    setAuthRole("employer");
    setAuthOpen(true);
  };

  const acceptTeamInvite = async () => {
    if (!teamInviteToken || !user) return;

    setTeamInviteAccepting(true);
    setTeamInviteError("");

    try {
      const result = await supabase.rpc("accept_company_team_invite", {
        p_token: teamInviteToken,
      });

      if (result.error) throw result.error;

      const profileResult = await supabase
        .from("profiles")
        .select("role, is_active, suspended_until, suspension_reason")
        .eq("id", user.id)
        .single();

      if (profileResult.error) throw profileResult.error;

      setAccountRole(profileResult.data?.role || "employer");
      setAccountStatus({
        isActive: profileResult.data?.is_active !== false,
        suspendedUntil: profileResult.data?.suspended_until || null,
        suspensionReason: profileResult.data?.suspension_reason || null,
      });

      clearTeamInvite();
    } catch (err) {
      setTeamInviteError(
        err?.message || "Nepavyko prisijungti prie įmonės komandos."
      );
    } finally {
      setTeamInviteAccepting(false);
    }
  };

  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
  };

  const accountIsSuspended =
    accountRole !== "admin" &&
    accountStatus.suspendedUntil &&
    new Date(accountStatus.suspendedUntil) > new Date();

  if (
    user &&
    accountRole !== "admin" &&
    (!accountStatus.isActive || accountIsSuspended)
  ) {
    return (
      <SuspendedAccount
        onLogout={logout}
        disabled={!accountStatus.isActive}
        suspendedUntil={accountStatus.suspendedUntil}
        reason={accountStatus.suspensionReason}
      />
    );
  }

  if (teamInviteToken) {
    return (
      <>
        <TeamInvitePage
          invite={teamInvite}
          loading={teamInviteLoading}
          error={teamInviteError}
          user={user}
          accepting={teamInviteAccepting}
          onLogin={openTeamInviteLogin}
          onSignup={openTeamInviteSignup}
          onAccept={acceptTeamInvite}
          onCancel={clearTeamInvite}
        />

        <AuthModal
          open={authOpen}
          onClose={() => setAuthOpen(false)}
          initialMode={authMode}
          initialRole="employer"
          teamInvite={
            teamInvite
              ? { ...teamInvite, token: teamInviteToken }
              : null
          }
        />
      </>
    );
  }

  if (user && accountRole === "worker") {
    return <WorkerDashboard user={user} onLogout={logout} />;
  }

  if (user && accountRole === "employer") {
    return <EmployerDashboard user={user} onLogout={logout} />;
  }

  if (user && accountRole === "admin") {
    if (adminMode === "worker") {
      return (
        <AdminWorkerGateway
          user={user}
          onLogout={logout}
          onAdminReturn={() => setAdminMode("admin")}
        />
      );
    }

    if (adminMode === "employer") {
      return (
        <AdminEmployerGateway
          user={user}
          onLogout={logout}
          onAdminReturn={() => setAdminMode("admin")}
        />
      );
    }

    return (
      <AdminDashboard
        user={user}
        onLogout={logout}
        onOpenWorker={() => setAdminMode("worker")}
        onOpenEmployer={() => setAdminMode("employer")}
      />
    );
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
                <h3>Basic</h3>
                <div className="price">
                  0 €<span>/mėn.</span>
                </div>
                <p>Išbandykite realų darbuotojų paieškos procesą be rizikos.</p>
                <ul>
                  <li>Iki 5 darbo pasiūlymų / mėn.</li>
                  <li>Darbuotojų paieška ir kvietimai</li>
                  <li>Darbo pokalbiai</li>
                  <li>Patikimumas ir darbuotojų įvertinimai</li>
                </ul>
                <button className="btn ghost full" onClick={openEmployerSignup}>
                  Pradėti nemokamai
                </button>
              </article>

              <article className="featured">
                <div className="popular">POPULIARIAUSIAS</div>
                <h3>Business</h3>
                <div className="price">
                  29 €<span>/mėn.</span>
                </div>
                <p>Įmonėms, kurios darbuotojų ieško reguliariai.</p>
                <ul>
                  <li>Neriboti darbo pasiūlymai</li>
                  <li>Visa Basic funkcionalumo apimtis</li>
                  <li>Išplėstinė įmonės statistika</li>
                  <li>Didesnė darbų istorijos apimtis</li>
                </ul>
                <button
                  className="btn primary full"
                  onClick={openEmployerSignup}
                >
                  Rinktis Business
                </button>
              </article>

              <article>
                <h3>Business Pro</h3>
                <div className="price">
                  59 €<span>/mėn.</span>
                </div>
                <p>Augančiai įmonei, kurioje darbuotojus samdo keli žmonės.</p>
                <ul>
                  <li>Visa Business funkcionalumo apimtis</li>
                  <li>Iki 5 įmonės komandos paskyrų</li>
                  <li>Vadovo ir vadybininko rolės</li>
                  <li>Mano darbai / visi įmonės darbai</li>
                  <li>Atsakingo žmogaus priskyrimas darbui</li>
                </ul>
                <button
                  className="btn ghost full"
                  onClick={openEmployerSignup}
                >
                  Rinktis Business Pro
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
