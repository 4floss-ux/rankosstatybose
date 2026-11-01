import { useEffect, useRef, useState } from "react";
import { TERMS_VERSION, getVilniusTodayISO, supabase, workerBirthDateError } from "../lib/config.js";
import { SilentLoader } from "../ui/brand.jsx";
import { P24Modal } from "../p24/ui.jsx";
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

  const switchMode = (next) => {
    setMode(next);
    setMessage("");
    setSuccess(false);
    if (next === "forgot") setForm((current) => ({ ...current, password: "" }));
  };
  const signupBlocked = mode === "signup" && (phoneVerification.busy || phoneVerification.unavailable || (phoneVerification.required && !phoneVerification.verified));
  const eyebrow = mode === "forgot" ? "Slaptažodžio atkūrimas" : mode === "login" ? "Prisijungimas" : "Registracija";
  const title = mode === "forgot" ? "Pamiršote slaptažodį?" : mode === "login" ? "Sveiki sugrįžę" : "Sukurkite paskyrą";
  const msgBox = message ? <div className={success ? "notebox" : "alert"} role={success ? "status" : "alert"}><div>{message}</div></div> : null;

  return (
    <P24Modal eyebrow={eyebrow} title={title} onClose={onClose} busy={loading} wide={mode === "signup"}>
      {mode === "signup" && success ? (
        <>
          <div className="notebox" role="status"><b>Paskyra sukurta!</b> SMS kodas patvirtintas. Patvirtinkite ir el. paštą paspausdami nuorodą iš laiško. Jeigu el. paštą jau patvirtinote, spauskite žemiau ir atsidarys jūsų paskyra.</div>
          {msgBox}
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button type="button" className="btn" disabled={loading} onClick={() => switchMode("login")}>Prisijungti įprastai</button>
            <button type="button" className="btn primary" disabled={loading} onClick={openRegisteredAccount}>{loading ? <SilentLoader size={16} minHeight={18} /> : "Atidaryti paskyrą"}</button>
          </div>
        </>
      ) : (
        <form onSubmit={submit} style={{ display: "contents" }}>
          {mode !== "forgot" ? (
            <div className="toggle2" role="group" aria-label="Prisijungti arba registruotis">
              <button type="button" aria-pressed={mode === "login"} disabled={loading} onClick={() => switchMode("login")}>Prisijungti</button>
              <button type="button" aria-pressed={mode === "signup"} disabled={loading} onClick={() => switchMode("signup")}>Registruotis</button>
            </div>
          ) : null}

          {mode === "signup" && !teamInvite ? (
            <div className="toggle2" role="group" aria-label="Paskyros tipas">
              <button type="button" aria-pressed={role === "worker"} onClick={() => setRole("worker")}>Ieškau darbo</button>
              <button type="button" aria-pressed={role === "employer"} onClick={() => setRole("employer")}>Ieškau darbuotojų</button>
            </div>
          ) : null}

          {mode === "login" ? (
            <>
              <div className="form" style={{ gridTemplateColumns: "1fr" }}>
                <label className="field" htmlFor="a-mail">El. paštas<input id="a-mail" type="email" value={form.email} onChange={setField("email")} placeholder="vardas@pastas.lt" autoComplete="email" readOnly={Boolean(teamInvite)} disabled={loading} required /></label>
                <label className="field" htmlFor="a-pass">Slaptažodis<input id="a-pass" type="password" value={form.password} onChange={setField("password")} placeholder="Jūsų slaptažodis" autoComplete="current-password" required /></label>
              </div>
              <button className="btn ghost sm" type="button" disabled={loading} onClick={() => switchMode("forgot")} style={{ alignSelf: "flex-start" }}>Pamiršau slaptažodį</button>
              {msgBox}
              <div className="row" style={{ justifyContent: "flex-end" }}>
                <button className="btn primary" type="submit" disabled={loading}>{loading ? <SilentLoader size={16} minHeight={18} /> : "Prisijungti"}</button>
              </div>
            </>
          ) : mode === "forgot" ? (
            <>
              <p className="muted small" style={{ margin: 0 }}>Įveskite paskyros el. paštą. Atsiųsime nuorodą naujam slaptažodžiui nustatyti.</p>
              <div className="form" style={{ gridTemplateColumns: "1fr" }}>
                <label className="field" htmlFor="f-mail">El. paštas<input id="f-mail" type="email" value={form.email} onChange={setField("email")} placeholder="vardas@pastas.lt" autoComplete="email" disabled={loading} required /></label>
              </div>
              {msgBox}
              <div className="row" style={{ justifyContent: "flex-end" }}>
                <button className="btn" type="button" disabled={loading} onClick={() => switchMode("login")}>Grįžti</button>
                <button className="btn primary" type="submit" disabled={loading}>{loading ? <SilentLoader size={16} minHeight={18} /> : "Siųsti atkūrimo nuorodą"}</button>
              </div>
            </>
          ) : (
            <>
              <div className="form">
                {role === "employer" && !teamInvite ? (
                  <>
                    <div className="field wide"><span>Kas registruojasi?</span>
                      <div className="segs wide2" role="radiogroup" aria-label="Darbdavio tipas">
                        {[["company", "Įmonė"], ["individual", "Privatus asmuo"]].map(([value, label]) => (
                          <label key={value}><input type="radio" name="r-et" checked={form.employerType === value}
                            onChange={() => setForm((current) => ({ ...current, employerType: value, ...(value === "individual" ? { companyName: "", companyCode: "" } : {}) }))} /><span>{label}</span></label>
                        ))}
                      </div>
                    </div>
                    {form.employerType === "company" ? (
                      <>
                        <label className="field wide" htmlFor="r-co">Įmonės pavadinimas *<input id="r-co" value={form.companyName} onChange={setField("companyName")} placeholder="UAB ..." required /></label>
                        <label className="field" htmlFor="r-code">Įmonės kodas<input id="r-code" inputMode="numeric" maxLength={9} value={form.companyCode} onChange={setField("companyCode")} placeholder="9 skaitmenys" /></label>
                      </>
                    ) : null}
                  </>
                ) : null}
                <label className="field" htmlFor="r-fn">Vardas *<input id="r-fn" value={form.firstName} onChange={setField("firstName")} placeholder="Pvz. Jonas" autoComplete="given-name" required /></label>
                <label className="field" htmlFor="r-ln">Pavardė *<input id="r-ln" value={form.lastName} onChange={setField("lastName")} placeholder="Pvz. Petrauskas" autoComplete="family-name" required /></label>
                {role === "employer" && form.employerType === "individual" && !teamInvite
                  ? <p className="hint wide nmhint">Pvz. namo savininkas, ūkininkas ar meistras su individualia veikla. Darbuotojai matys „Privatus darbdavys“.</p>
                  : <p className="hint wide nmhint">Rašykite pilną vardą ir pavardę, kaip asmens dokumente.</p>}
                {role === "worker" ? (
                  <>
                    <label className="field" htmlFor="r-bd">Gimimo data *<input id="r-bd" type="date" min="1900-01-01" max={getVilniusTodayISO()} value={form.birthDate} onChange={setField("birthDate")} autoComplete="bday" required /><span className="hint">Gimimo data nėra rodoma darbdaviams.</span></label>
                    <div className="field"><span>Ar domina darbas užsienyje? *</span>
                      <div className="segs wide2" role="radiogroup" aria-label="Ar domina darbas užsienyje">
                        {[["yes", "Taip, domina"], ["no", "Ne, nedomina"]].map(([value, label]) => (
                          <label key={value}><input type="radio" name="signup-work-abroad" value={value} checked={form.workAbroadChoice === value} onChange={() => setForm((current) => ({ ...current, workAbroadChoice: value }))} required disabled={loading} /><span>{label}</span></label>
                        ))}
                      </div>
                    </div>
                  </>
                ) : null}
                <label className="field" htmlFor="r-city">Miestas<CityAutocomplete value={form.city} onChange={(value) => setForm((current) => ({ ...current, city: value }))} placeholder="Pradėkite rašyti miestą" /></label>
                <label className="field" htmlFor="r-ph">Telefonas *<input id="r-ph" value={form.phone} onChange={setField("phone")}
                  onBlur={() => { const normalized = normalizeLithuanianMobilePhone(form.phone); if (normalized) setForm((current) => ({ ...current, phone: normalized })); }}
                  placeholder="+37061234567" autoComplete="tel" inputMode="tel" required /><PhoneAvailabilityHint verification={phoneVerification} /></label>
                <label className="field" htmlFor="r-mail">El. paštas<input id="r-mail" type="email" value={form.email} onChange={setField("email")} placeholder="vardas@pastas.lt" autoComplete="email" readOnly={Boolean(teamInvite)} disabled={loading} required /></label>
                <label className="field" htmlFor="r-pass">Slaptažodis<input id="r-pass" type="password" minLength={8} value={form.password} onChange={setField("password")} placeholder="Bent 8 simboliai" autoComplete="new-password" required /></label>
                <PhoneVerificationFields verification={phoneVerification} />
              </div>
              <label className="check"><input type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} required />
                <span>Susipažinau su <a href="/naudojimosi-salygos" target="_blank" rel="noopener noreferrer">naudojimosi sąlygomis</a> ir <a href="/privatumo-politika" target="_blank" rel="noopener noreferrer">privatumo politika</a></span></label>
              {msgBox}
              <div className="row" style={{ justifyContent: "flex-end" }}>
                <button className="btn primary" type="submit" disabled={loading || signupBlocked}>{loading ? <SilentLoader size={16} minHeight={18} /> : phoneVerification.config?.enabled ? "Užbaigti registraciją" : "Sukurti paskyrą"}</button>
              </div>
            </>
          )}
        </form>
      )}
    </P24Modal>
  );
}
