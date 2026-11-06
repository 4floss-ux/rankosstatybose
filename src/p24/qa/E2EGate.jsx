import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { supabase, supabaseKey, supabaseUrl } from "../../lib/config.js";
import "./E2EGate.css";

// This auth client is intentionally separate from the staging app client.
// Production access is used only to verify three approved testers.
// The real dashboards ALWAYS use staging Supabase, never production data.
const ownerAuth = createClient(
  "https://vxbfihnhielqambosmkc.supabase.co",
  "sb_publishable_fV4wji_VDNfHeBzmtvlwQw_D7jZjBiB",
  { auth: {storageKey:"statybos24-private-e2e-owner-gate",
    persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}}
);
const ACTORS = [
  {role:"worker",name:"Darbuotojas",description:"Ieškok darbų, kandidatuok, atsakyk į kvietimus.",icon:"👷"},
  {role:"employer",name:"Darbdavys",description:"Skelbk darbus, vertink kandidatus, kviesk pokalbiui.",icon:"🏗️"},
  {role:"admin",name:"Administratorius",description:"Tikrink skelbimus, vartotojus ir administratoriaus valdymą.",icon:"🛡️"}
];

async function requestActor(session, role) {
  const response = await fetch(`${supabaseUrl}/functions/v1/qa-actor`, {
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      Authorization:`Bearer ${session.access_token}`,
      apikey:supabaseKey
    },
    body: JSON.stringify({role})
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body?.ok) throw new Error(
    response.status===403 ? "Ši paskyra neturi teisės naudoti testavimo režimo."
    : body.error || "Testavimo prisijungimas nepavyko."
  );
  return body;
}

export function E2EGate({ children }) {
  const [ownerSession, setOwnerSession] = useState(null);
  const [actorSession, setActorSession] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(false);
  const [switching, setSwitching] = useState("");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([ownerAuth.auth.getSession(),supabase.auth.getSession()])
      .then(([a,b]) => {
        if (!active) return;
        setOwnerSession(a.data?.session || null);
        setActorSession(b.data?.session || null);
        setInitialized(true);
      }).catch(() => {if(active)setInitialized(true);});
    const ownerListener=ownerAuth.auth.onAuthStateChange((_event,session)=>{
      if(active) {setOwnerSession(session);setAllowed(false);}
    });
    const actorListener=supabase.auth.onAuthStateChange((_event,session)=>{
      if(active)setActorSession(session);
    });
    return ()=>{active=false;ownerListener.data.subscription.unsubscribe();
      actorListener.data.subscription.unsubscribe();};
  }, []);

  useEffect(()=>{
    if(!initialized || !ownerSession?.access_token) {
      setAllowed(false);
      return;
    }
    let active=true;
    setChecking(true);
    requestActor(ownerSession,"check")
      .then(()=> {if(active){setAllowed(true);setError("");}})
      .catch((err)=> {if(active){setAllowed(false);setError(err.message);}})
      .finally(()=> {if(active)setChecking(false);});
    return ()=>{active=false;};
  }, [initialized,ownerSession?.access_token]);

  async function login(e){
    e.preventDefault();setError("");setSwitching("login");
    try {
      const {error:authError}=await ownerAuth.auth.signInWithPassword({email:email.trim(),password});
      if(authError)throw new Error("Prisijungti nepavyko. Patikrink el. paštą ir slaptažodį.");
      setPassword("");
    }catch(e){setError(e.message||"Prisijungti nepavyko.");}
    finally{setSwitching("");}
  }

  async function choose(role) {
    if(!ownerSession || !allowed)return;
    setSwitching(role);setError("");
    try {
      await supabase.auth.signOut();
      const token=await requestActor(ownerSession,role);
      if(!token.token_hash)throw new Error("Nepavyko gauti bandomosios paskyros.");
      const result=await supabase.auth.verifyOtp({token_hash:token.token_hash,type:"magiclink"});
      if(result.error || !result.data?.session)throw new Error("Nepavyko atidaryti bandomosios paskyros.");
    } catch(e){setError(e.message||"Nepavyko pakeisti paskyros.");}
    finally{setSwitching("");}
  }

  const busy=Boolean(switching || checking);
  const roleHint=useMemo(()=>actorSession?.user?.email?.split("@")?.[0]||"bandomoji paskyra",
    [actorSession?.user?.email]);

  if(!initialized || checking) return <div className="qa-e2e-page">
    <div className="qa-e2e-card"><h1>Statybos24 testavimas</h1><p>Tikrinama prieiga...</p></div>
  </div>;

  if(!ownerSession || !allowed || !actorSession) return (
    <div className="qa-e2e-page">
      <div className="qa-e2e-card">
        <div className="qa-e2e-eyebrow">PRIVATI TESTAVIMO APLINKA</div>
        <h1>Statybos24</h1>
        <p>Tie patys paskyrų ekranai ir mygtukai. Duomenys atskirti nuo pagrindinės svetainės.</p>
        {error && <div role="alert" className="qa-e2e-error">{error}</div>}
        {!ownerSession ? (
          <form onSubmit={login} className="qa-e2e-form">
            <h2>Prisijunk savo Statybos24 paskyra</h2>
            <p>Prieiga tik trims patvirtintoms paskyroms. Naudok savo įprastą prisijungimo slaptažodį.</p>
            <label>El. paštas<input type="email" required autoComplete="username"
              value={email} onChange={e=>setEmail(e.target.value)}/></label>
            <label>Slaptažodis<input type="password" required autoComplete="current-password"
              value={password} onChange={e=>setPassword(e.target.value)}/></label>
            <button type="submit" disabled={busy}>Prisijungti prie testavimo</button>
          </form>
        ) : allowed ? (
          <>
            <h2>Pasirink, kuo nori būti</h2>
            <div className="qa-e2e-actors">
              {ACTORS.map(actor=><button type="button" key={actor.role} disabled={busy}
                onClick={()=>choose(actor.role)}>
                <span className="qa-e2e-icon">{actor.icon}</span>
                <span><strong>{actor.name}</strong><small>{actor.description}</small></span>
                <span aria-hidden="true">›</span>
              </button>)}
            </div>
            <button type="button" className="qa-e2e-signout"
              onClick={async()=>{await supabase.auth.signOut();await ownerAuth.auth.signOut();setAllowed(false);}}>
              Atsijungti iš testavimo
            </button>
          </>
        ) : (
          <button type="button" className="qa-e2e-signout" onClick={async()=>{
            await ownerAuth.auth.signOut();setAllowed(false);setError("");
          }}>Prisijungti kita paskyra</button>
        )}
        <div className="qa-e2e-footnote">
          TESTAS · Tikri mokėjimai, SMS ir el. laiškai šioje aplinkoje išjungti.
        </div>
      </div>
    </div>
  );

  return <>
    {children}
    <aside className="qa-e2e-toolbar">
      <span>🧪 TESTAVIMAS · {roleHint} · tik netikri duomenys</span>
      <button type="button" onClick={async()=>{
        await supabase.auth.signOut();
        setError("");
      }}>Pakeisti žmogų</button>
    </aside>
  </>;
}
