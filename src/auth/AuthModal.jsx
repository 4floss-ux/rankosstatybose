import { useEffect, useRef, useState } from "react";
import { TERMS_VERSION, getVilniusTodayISO, supabase, workerBirthDateError } from "../lib/config.js";
import { CloseMark, SilentLoader } from "../ui/brand.jsx";
import { normalizeLithuanianMobilePhone } from "../ui/common.jsx";
import { CityAutocomplete, canonicalCityName } from "../ui/location.jsx";
import { sendPasswordRecoveryEmail } from "./passwordRecovery.jsx";
import { PhoneAvailabilityHint, PhoneVerificationFields, usePhoneVerification } from "./phoneVerification.jsx";
import { companyTeamInviteLink } from "../employer/plans.js";

export function AuthModal({
  open,
  onClose,
  initialMode = "login",
  initialRole = "worker",
  teamInvite = null,
}) {
  const [mode, setMode] = useState(initialMode);
  const [role, setRole] = useState(initialRole);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    birthDate: "",
    email: "",
    password: "",
    city: "Vilnius",
    phone: "",
    employerType: "company",
    companyName: "",
    companyCode: "",
    workAbroadChoice: "",
  });
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const submitting = useRef(false);
  const phoneVerification = usePhoneVerification({
    active: open && mode === "signup", purpose: "signup", phone: form.phone, email: form.email,
  });

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setRole(teamInvite ? "employer" : initialRole);
      setMessage("");
      setSuccess(false);
      setTermsAccepted(false);

      if (teamInvite) {
        const invitedName = String(teamInvite.invited_name || "").trim();
        const invitedParts = invitedName.split(/\s+/).filter(Boolean);
        setForm((current) => ({
          ...current,
          firstName: invitedParts[0] || current.firstName,
          lastName: invitedParts.slice(1).join(" ") || current.lastName,
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
    if (submitting.current) return;
    setMessage("");
    setSuccess(false);

    if (!supabase) {
      setMessage("Trūksta Supabase nustatymų Cloudflare aplinkoje.");
      return;
    }

    if (!form.email.trim() || (mode !== "forgot" && !form.password)) {
      setMessage(mode === "forgot" ? "Įveskite el. pašto adresą." : "Įveskite el. paštą ir slaptažodį.");
      return;
    }

    submitting.current = true;
    setLoading(true);

    try {
      if (mode === "forgot") {
        const result = await sendPasswordRecoveryEmail(form.email);
        setSuccess(true);
        setMessage(result);
      } else if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email.trim(),
          password: form.password,
        });

        if (error) throw error;
        // This form belongs to statybos24.lt only. It never signs users in
        // to the independent /hire employer portal or redirects there.
        onClose();
      } else {
        if (!termsAccepted) {
          throw new Error("Norėdami registruotis, susipažinkite su naudojimosi sąlygomis ir jas patvirtinkite.");
        }
        if (!form.firstName.trim()) {
          throw new Error("Įveskite vardą.");
        }
        if (!form.lastName.trim()) {
          throw new Error("Įveskite pavardę.");
        }
        if (role === "worker" && !["yes","no"].includes(form.workAbroadChoice)) throw new Error("Pasirinkite, ar domina darbas užsienyje.");
        if (role === "worker") {
          const birthDateError = workerBirthDateError(form.birthDate, true);
          if (birthDateError) throw new Error(birthDateError);
        }

        if (form.password.length < 8) {
          throw new Error("Slaptažodis turi būti bent 8 simbolių.");
        }

        if (!form.phone.trim()) {
          throw new Error(
            "Registracijai galiojantis Lietuvos mobiliojo telefono numeris yra privalomas."
          );
        }

        const normalizedPhone = normalizeLithuanianMobilePhone(form.phone);
        if (!normalizedPhone) {
          throw new Error(
            "Įveskite galiojantį Lietuvos mobiliojo telefono numerį, pvz. +37061234567."
          );
        }

        if (
          role === "employer" &&
          !teamInvite &&
          form.employerType === "company" &&
          !form.companyName.trim()
        ) {
          throw new Error("Įveskite įmonės pavadinimą.");
        }

        const phoneProof = phoneVerification.requireProof();
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
              terms_accepted: true,
              terms_version: TERMS_VERSION,
              role: teamInvite ? "employer" : role,
              preferred_plan: "basic",
              preferred_billing_interval: "monthly",
              first_name: form.firstName.trim(),
              last_name: form.lastName.trim(),
              ...(role === "worker" ? { birth_date: form.birthDate, work_abroad_interested: form.workAbroadChoice === "yes", work_abroad_interest_updated_at: new Date().toISOString() } : {}),
              display_name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
              legal_name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
              city: canonicalCity,
              phone: normalizedPhone,
              ...(phoneProof ? { phone_verification_proof: phoneProof } : {}),
              employer_type:
                role === "employer" && !teamInvite
                  ? form.employerType
                  : "",
              company_name:
                role === "employer" && !teamInvite
                  ? form.employerType === "individual"
                    ? `${form.firstName.trim()} ${form.lastName.trim()}`.trim()
                    : form.companyName.trim()
                  : "",
              company_code:
                role === "employer" && !teamInvite && form.employerType === "company"
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
          setMessage("Paskyra sukurta. Patvirtinkite el. paštą nuoroda iš laiško, tada spauskite „Atidaryti paskyrą“.");
        }
      }
    } catch (error) {
      setMessage(error?.message || "Nepavyko. Bandykite dar kartą.");
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }

  // Registration creates the Auth user but email confirmation may defer the session.
  // Never repeat signUp when the user presses the finish button: sign in instead.
  async function openRegisteredAccount() {
    if (submitting.current || !supabase) return;
    submitting.current = true;
    setLoading(true);
    setMessage("");
    try {
      // A verification link may be opened in another browser; password sign-in
      // establishes the session in the original Facebook in-app browser.
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password,
      });
      if (error) {
        const confirmationPending = error.code === "email_not_confirmed" ||
          /email.*not confirmed|confirm.*email/i.test(error.message || "");
        if (confirmationPending) {
          setMessage("Paskyra sukurta. Pirmiausia patvirtinkite el. paštą paspausdami laiške esančią nuorodą, tada čia paspauskite „Atidaryti paskyrą“ dar kartą.");
        } else {
          setMessage(error.message || "Nepavyko prisijungti. Galite bandyti prisijungti įprastai.");
        }
        return;
      }
      if (!data?.session?.user) {
        setMessage("Prisijungimo sesija dar nesukurta. Patvirtinkite el. paštą ir bandykite dar kartą.");
        return;
      }
      onClose(); // App.onAuthStateChange automatically opens the account dashboard.
    } catch (error) {
      setMessage(error?.message || "Prisijungti nepavyko. Bandykite dar kartą.");
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }

  const overlay = {
    position: "fixed",
    inset: 0,
    background: "rgba(34,38,49,.58)",
    zIndex: 1000,
    display: "grid",
    placeItems: "center",
    padding: 20,
  };

  const card = {
    width: "min(520px, 100%)",
    maxHeight: "calc(100dvh - 40px)",
    overflow: "hidden",
    background: "#fff",
    borderRadius: 20,
    boxShadow: "0 24px 80px rgba(34,38,49,.24)",
    padding: 0,
  };

  const cardScroll = {
    maxHeight: "calc(100dvh - 40px)",
    overflowY: "auto",
    padding: 28,
    boxSizing: "border-box",
    scrollbarGutter: "stable",
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
    background: active ? "#222631" : "#fff",
    color: active ? "#fff" : "#222631",
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
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div style={card} role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
        <div style={cardScroll}>
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
              {mode === "forgot" ? "SLAPTAŽODŽIO ATKŪRIMAS" : mode === "login" ? "PRISIJUNGIMAS" : "REGISTRACIJA"}
            </div>
            <h2 id="auth-modal-title" style={{ margin: "6px 0 0", fontSize: 30 }}>
              {mode === "forgot" ? "Pamiršote slaptažodį?" : mode === "login" ? "Sveiki sugrįžę" : "Sukurkite paskyrą"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
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
            <CloseMark />
          </button>
        </div>

        {mode === "signup" && success ? (
          <div style={{ display: "grid", gap: 16 }}>
            <div role="status" style={{ padding: 18, borderRadius: 14, background: "#edf8f3", color: "#222631" }}>
              <h3 style={{ margin: "0 0 8px", fontSize: 19 }}>Paskyra sukurta!</h3>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>
                SMS kodas patvirtintas. Patvirtinkite ir el. paštą paspausdami nuorodą iš laiško.
                Jeigu el. paštą jau patvirtinote, spauskite žemiau ir atsidarys jūsų paskyra.
              </p>
            </div>
            {message && <div role="status" style={{ fontSize: 14, lineHeight: 1.5, padding: "11px 12px", borderRadius: 10, background: "#f3f6f8" }}>{message}</div>}
            <button type="button" className="btn primary" disabled={loading} onClick={openRegisteredAccount}
              style={{ width: "100%", justifyContent: "center" }}>
              {loading ? <SilentLoader size={16} minHeight={18} /> : "Atidaryti paskyrą"}
            </button>
            <button type="button" className="btn ghost" disabled={loading} onClick={() => { setMode("login"); setSuccess(false); setMessage(""); }}
              style={{ width: "100%", justifyContent: "center" }}>Prisijungti įprastai</button>
          </div>
        ) : (
          <>
        {mode !== "signup" && (
        <div style={{ ...twoColumns, marginBottom: 18 }}>
          <button
            type="button"
            style={tabStyle(mode === "login")}
            disabled={loading}
            onClick={() => {
              setMode("login");
              setMessage("");
              setSuccess(false);
            }}
          >
            Prisijungti
          </button>
          <button
            type="button"
            style={tabStyle(mode === "signup")}
            disabled={loading}
            onClick={() => {
              setMode("signup");
              setMessage("");
              setSuccess(false);
            }}
          >
            Registruotis
          </button>
        </div>
        )}

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
              {role === "employer" && !teamInvite && (
                <>
                  <div style={{ display: "grid", gap: 7 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#222631" }}>
                      Darbdavio tipas
                    </span>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 8,
                        padding: 4,
                        borderRadius: 12,
                        background: "#f1f4f6",
                      }}
                    >
                      {[
                        ["company", "Įmonė"],
                        ["individual", "Privatus asmuo"],
                      ].map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() =>
                            setForm((current) => ({
                              ...current,
                              employerType: value,
                              ...(value === "individual"
                                ? { companyName: "", companyCode: "" }
                                : {}),
                            }))
                          }
                          style={{
                            minHeight: 42,
                            border: 0,
                            borderRadius: 9,
                            background: form.employerType === value ? "#fff" : "transparent",
                            color: "#222631",
                            font: "inherit",
                            fontSize: 13,
                            fontWeight: 800,
                            cursor: "pointer",
                            boxShadow:
                              form.employerType === value
                                ? "0 1px 5px rgba(34,38,49,.10)"
                                : "none",
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {form.employerType === "company" && (
                    <div style={twoColumns}>
                      <label style={labelStyle}>
                        Įmonės pavadinimas *
                        <input
                          style={inputStyle}
                          value={form.companyName}
                          onChange={setField("companyName")}
                          placeholder="UAB Statyba"
                          required
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

              <div style={twoColumns}>
                <label style={labelStyle}>
                  Vardas *
                  <input
                    style={inputStyle}
                    value={form.firstName}
                    onChange={setField("firstName")}
                    placeholder="Pvz. Tomas"
                    autoComplete="given-name"
                    required
                  />
                </label>

                <label style={labelStyle}>
                  Pavardė *
                  <input
                    style={inputStyle}
                    value={form.lastName}
                    onChange={setField("lastName")}
                    placeholder="Pvz. Jonaitis"
                    autoComplete="family-name"
                    required
                  />
                </label>
              </div>

              {role === "worker" && (
                <label style={labelStyle}>
                  Gimimo data *
                  <input
                    style={{ ...inputStyle, boxSizing: "border-box", minWidth: 0 }}
                    type="date"
                    min="1900-01-01"
                    max={getVilniusTodayISO()}
                    value={form.birthDate}
                    onChange={setField("birthDate")}
                    autoComplete="bday"
                    required
                  />
                  <span style={{ color: "#71808d", fontSize: 11, fontWeight: 400 }}>
                    Gimimo data nėra rodoma darbdaviams.
                  </span>
                </label>
              )}

              {role === "worker" && <fieldset style={{border:"1px solid #dfe7ed",borderRadius:12,padding:14,margin:0}}><legend style={{fontSize:13,fontWeight:800,color:"#222631"}}>Ar domina darbas užsienyje? *</legend><div style={{display:"flex",gap:18,flexWrap:"wrap"}}>{[["yes","Taip, domina"],["no","Ne, nedomina"]].map(([value,label])=><label key={value} style={{display:"flex",alignItems:"center",gap:7,fontSize:13,cursor:"pointer"}}><input type="radio" name="signup-work-abroad" value={value} checked={form.workAbroadChoice===value} onChange={()=>setForm(current=>({...current,workAbroadChoice:value}))} required disabled={loading}/>{label}</label>)}</div></fieldset>}

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
                  Telefonas *
                  <input
                    style={inputStyle}
                    value={form.phone}
                    onChange={setField("phone")}
                    onBlur={() => {
                      const normalized = normalizeLithuanianMobilePhone(form.phone);
                      if (normalized) {
                        setForm((current) => ({ ...current, phone: normalized }));
                      }
                    }}
                    placeholder="+37061234567"
                    autoComplete="tel"
                    inputMode="tel"
                    required
                  />
                  <PhoneAvailabilityHint verification={phoneVerification} />
                </label>
              </div>
            </>
          )}

          {mode === "forgot" && (
            <p style={{ margin: 0, color: "#526374", lineHeight: 1.5 }}>
              Įveskite paskyros el. paštą. Atsiųsime nuorodą naujam slaptažodžiui nustatyti.
            </p>
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
              readOnly={Boolean(teamInvite) && mode !== "forgot"}
              disabled={loading}
              required
            />
          </label>

          {mode !== "forgot" && <label style={labelStyle}>
            Slaptažodis
            <input
              style={inputStyle}
              type="password"
              required
              minLength={mode === "signup" ? 8 : undefined}
              value={form.password}
              onChange={setField("password")}
              placeholder={
                mode === "signup" ? "Bent 8 simboliai" : "Jūsų slaptažodis"
              }
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
            />
          </label>}

          {mode === "signup" && <PhoneVerificationFields verification={phoneVerification} />}

          {mode === "login" && (
            <button type="button" disabled={loading}
              onClick={() => {
                setMode("forgot");
                setForm((current) => ({ ...current, password: "" }));
                setMessage("");
                setSuccess(false);
              }}
              style={{ border: 0, padding: 0, background: "none", color: "#453a63",
                font: "inherit", fontSize: 13, lineHeight: 1.2, fontWeight: 750,
                cursor: "pointer", textAlign: "right" }}>
              Pamiršau slaptažodį
            </button>
          )}

          {mode === "signup" && (
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, color: "#405264", fontSize: 13, lineHeight: 1.5 }}>
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(event) => setTermsAccepted(event.target.checked)}
                required
                style={{ marginTop: 3, accentColor: "#6b5b95", width: 17, height: 17, flexShrink: 0 }}
              />
              <span>
                Susipažinau ir sutinku su{" "}
                <a href="/naudojimosi-salygos" target="_blank" rel="noopener noreferrer" style={{ color: "#453a63", fontWeight: 800, textDecoration: "underline" }}>
                  naudojimosi sąlygomis
                </a>{" "}ir susipažinau su{" "}
                <a href="/privatumo-politika" target="_blank" rel="noopener noreferrer" style={{ color: "#453a63", fontWeight: 800, textDecoration: "underline" }}>
                  privatumo politika
                </a>.
              </span>
            </label>
          )}

          {message && (
            <div
              role={success ? "status" : "alert"}
              style={{
                padding: "11px 12px",
                borderRadius: 10,
                background: success ? "#edf8f3" : "#fff3ed",
                color: "#222631",
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
            disabled={loading || (mode === "signup" && (phoneVerification.busy || phoneVerification.unavailable || (phoneVerification.required && !phoneVerification.verified)))}
            style={{
              width: "100%",
              justifyContent: "center",
              marginTop: 4,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading
              ? <SilentLoader size={16} minHeight={18} />
              : mode === "forgot"
              ? "Siųsti atkūrimo nuorodą"
              : mode === "login"
              ? "Prisijungti"
              : phoneVerification.config?.enabled ? "Užbaigti registraciją" : "Sukurti paskyrą"}
          </button>
        </form>
          </>
        )}
        </div>

      </div>
    </div>
  );
}
