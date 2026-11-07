import { useEffect, useMemo, useRef, useState } from "react";
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

async function requestActor(session, role, actorId = null) {
  const response = await fetch(`${supabaseUrl}/functions/v1/qa-actor`, {
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      Authorization:`Bearer ${session.access_token}`,
      apikey:supabaseKey
    },
    body: JSON.stringify({role, ...(actorId ? {actor_id:actorId} : {})})
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body?.ok) {
    const err = new Error(response.status===403
      ? "Ši paskyra neturi teisės naudoti testavimo režimo."
      : body.error || "Testavimo prisijungimas nepavyko.");
    err.status = response.status;
    throw err;
  }
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
  const [testPeople, setTestPeople] = useState([]);
  const [selectedRole, setSelectedRole] = useState("worker");
  const [loadingPeople, setLoadingPeople] = useState(false);
  const ownerIdRef = useRef(null);
  const allowedRef = useRef(false);

  useEffect(() => {
    let active = true;
    Promise.all([ownerAuth.auth.getSession(),supabase.auth.getSession()])
      .then(([a,b]) => {
        if (!active) return;
        const initialOwner = a.data?.session || null;
        ownerIdRef.current = initialOwner?.user?.id || null;
        setOwnerSession(initialOwner);
        setActorSession(b.data?.session || null);
        setInitialized(true);
      }).catch(() => {if(active)setInitialized(true);});
    const ownerListener=ownerAuth.auth.onAuthStateChange((event,session)=>{
      if(!active)return;
      const nextId = session?.user?.id || null;
      // Supabase emits SIGNED_IN on tab focus and TOKEN_REFRESHED when its JWT
      // refreshes. Neither event means the tester logged out. Keep their current
      // dashboard mounted instead of clearing access on every browser tab switch.
      if (ownerIdRef.current !== nextId || event === "SIGNED_OUT") {
        ownerIdRef.current = nextId;
        allowedRef.current = false;
        setAllowed(false);
      }
      setOwnerSession(session);
    });
    const actorListener=supabase.auth.onAuthStateChange((_event,session)=>{
      if(active)setActorSession(session);
    });
    return ()=>{active=false;ownerListener.data.subscription.unsubscribe();
      actorListener.data.subscription.unsubscribe();};
  }, []);

  useEffect(()=>{
    if(!initialized || !ownerSession?.access_token) {
      allowedRef.current = false;
      setAllowed(false);
      setChecking(false);
      return;
    }
    let active=true;
    // Do not cover or unmount an already open dashboard during token refresh.
    if (!allowedRef.current) setChecking(true);
    requestActor(ownerSession,"check")
      .then(()=> {if(active){
        allowedRef.current = true;
        setAllowed(true);
        setError("");
      }})
      .catch((err)=> {if(active){
        // Only explicit authentication / authorization failures should revoke
        // access. A momentary network error on tab resume is not a sign-out.
        if(err?.status===401 || err?.status===403 || !allowedRef.current){
          allowedRef.current = false;
          setAllowed(false);
          setError(err.message);
        }
      }})
      .finally(()=> {if(active)setChecking(false);});
    return ()=>{active=false;};
  }, [initialized,ownerSession?.access_token]);

  useEffect(() => {
    if (!allowed || !ownerSession?.access_token || actorSession) return;
    let active = true;
    setLoadingPeople(true);
    requestActor(ownerSession, "list")
      .then((data) => {
        if(active) {
          setTestPeople(Array.isArray(data.actors) ? data.actors : []);
          setError(data.warning || "");
        }
      })
      .catch((err) => {
        if(active) setError(err.message || "Nepavyko įkelti bandomųjų paskyrų.");
      })
      .finally(() => { if(active) setLoadingPeople(false); });
    return () => {active=false;};
  }, [allowed, ownerSession?.user?.id, actorSession?.user?.id]);

  async function login(e){
    e.preventDefault();setError("");setSwitching("login");
    try {
      const {error:authError}=await ownerAuth.auth.signInWithPassword({email:email.trim(),password});
      if(authError)throw new Error("Prisijungti nepavyko. Patikrink el. paštą ir slaptažodį.");
      setPassword("");
    }catch(e){setError(e.message||"Prisijungti nepavyko.");}
    finally{setSwitching("");}
  }

  async function choose(role, actorId = null) {
    if(!ownerSession || !allowed)return;
    setSwitching(role);setError("");
    try {
      await supabase.auth.signOut();
      const token=await requestActor(ownerSession,role,actorId);
      if(!token.token_hash)throw new Error("Nepavyko gauti bandomosios paskyros.");
      const result=await supabase.auth.verifyOtp({token_hash:token.token_hash,type:"magiclink"});
      if(result.error || !result.data?.session)throw new Error("Nepavyko atidaryti bandomosios paskyros.");
    } catch(e){setError(e.message||"Nepavyko pakeisti paskyros.");}
    finally{setSwitching("");}
  }

  const busy=Boolean(switching || checking);
  const roleHint=useMemo(()=>actorSession?.user?.email?.split("@")?.[0]||"bandomoji paskyra",
    [actorSession?.user?.email]);

  if(!initialized || (checking && !allowed && Boolean(ownerSession))) return <div className="qa-e2e-page">
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
            <div className="qa-e2e-roles" role="group" aria-label="Testuojamas vaidmuo">
              {ACTORS.map(actor=><button type="button" key={actor.role} disabled={busy}
                aria-pressed={selectedRole === actor.role}
                className={selectedRole === actor.role ? "active" : ""}
                onClick={()=>setSelectedRole(actor.role)}>
                <span>{actor.icon}</span> {actor.name}
              </button>)}
            </div>
            <div className="qa-e2e-people" aria-live="polite">
              {loadingPeople ? <p>Paruošiami bandomieji žmonės ir jų profiliai...</p> : null}
              {!loadingPeople && testPeople.filter(p=>p.role===selectedRole).map(person=>
                <button key={person.id} type="button" disabled={busy}
                  onClick={()=>choose(selectedRole,person.id)}>
                  <span className="qa-e2e-person-icon">{selectedRole==="worker"?"👷":selectedRole==="employer"?"🏗️":"🛡️"}</span>
                  <span><strong>{person.name}</strong><small>{person.city || "TESTAS"} · Atidaryti tikrą paskyrą</small></span>
                  <span aria-hidden="true">›</span>
                </button>
              )}
              {!loadingPeople && !testPeople.some(p=>p.role===selectedRole) ? (
                <button type="button" disabled={busy} onClick={()=>choose(selectedRole)}>
                  <span className="qa-e2e-person-icon">🧪</span>
                  <span><strong>Atidaryti pagrindinę bandomąją paskyrą</strong>
                  <small>Testiniai žmonės dar ruošiami</small></span>
                  <span aria-hidden="true">›</span>
                </button>
              ):null}
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
