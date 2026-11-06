import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { lazyPage } from "./lib/lazyPage.js";
import { initialPasswordRecovery, isHireProjectPath, statybos24IsStandalone, supabase } from "./lib/config.js";
import { PasswordRecoveryPage, clearPasswordRecoveryUrl, rememberPasswordRecoveryUser, rememberedPasswordRecoveryUser } from "./auth/passwordRecovery.jsx";
import { AuthModal } from "./auth/AuthModal.jsx";
import { endImpersonation, getImpersonation, leaveImpersonation, watchImpersonation } from "./admin/impersonation.js";
import { TeamInvitePage } from "./team/TeamInvitePage.jsx";
import { localDateISO } from "./lib/jobs.js";
import { BUSINESS_PRESENTATION_TOKEN } from "./employer/plans.js";
import { SuspendedAccount } from "./public/SuspendedAccount.jsx";
import { AppBootLoader } from "./ui/AppBootLoader.jsx";
import { PublicLandingP24 } from "./p24/public/PublicLandingP24.jsx";
import { publicJobRoute } from "./lib/publicJobAds.js";

// Kodo dalys kraunamos pagal rolę – pradinis puslapis lieka lengvas.
const WorkerDashboard = lazyPage(() => import("./worker/WorkerDashboard.jsx"), "WorkerDashboard");
const EmployerDashboard = lazyPage(() => import("./employer/EmployerDashboard.jsx"), "EmployerDashboard");
const AdminDashboard = lazyPage(() => import("./admin/AdminDashboard.jsx"), "AdminDashboard");
const AdminWorkerGateway = lazyPage(() => import("./admin/adminParts.jsx"), "AdminWorkerGateway");
const AdminEmployerGateway = lazyPage(() => import("./admin/adminParts.jsx"), "AdminEmployerGateway");
const QaSandbox = lazyPage(() => import("./p24/qa/QaSandbox.jsx"), "QaSandbox");
const BusinessPresentationPage = lazyPage(() => import("./public/BusinessPresentationPage.jsx"), "BusinessPresentationPage");
const PublicJobAdsPage = lazyPage(() => import("./public/PublicJobAdsPage.jsx"), "PublicJobAdsPage");

export function App() {
  const publicJobs = publicJobRoute(window.location.pathname);
  const [user, setUser] = useState(null);
  const e2eRealAccounts = import.meta.env.VITE_E2E_REAL_ACCOUNTS === "true";
  const [qaMode, setQaMode] = useState(() => new URLSearchParams(window.location.search).get("testas") === "1");
  const [qaAllowed, setQaAllowed] = useState(false);
  useEffect(() => {
    if (e2eRealAccounts || !user?.id || !supabase) { setQaAllowed(false); return; }
    let cancelled = false;
    setQaAllowed(false);
    supabase.functions.invoke("qa-preview", {body: {op: "check"}})
      .then(({data,error}) => {if (!cancelled) setQaAllowed(!error && data?.authorized === true);})
      .catch(() => {if (!cancelled) setQaAllowed(false);});
    return () => {cancelled = true;};
  }, [user?.id]);
  const openQaMode = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("testas","1");
    window.history.replaceState({},"",url.pathname + url.search + url.hash);
    setQaMode(true);
  };
  const closeQaMode = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("testas");
    window.history.replaceState({},"",url.pathname + url.search + url.hash);
    setQaMode(false);
  };

  useEffect(() => {
    if(!user?.id || !supabase) return;
    let stopped=false, busy=false, recordedDay="";
    async function recordDay() {
      if(stopped || busy || document.visibilityState !== "visible" || getImpersonation(user.id)?.expired) return;
      const date=localDateISO(new Date());
      if(recordedDay===date) return;
      busy=true;
      try { const result=await supabase.rpc("record_my_account_day"); if(!result.error && !stopped)recordedDay=date; } catch {} finally {busy=false;}
    }
    recordDay();
    const interval=window.setInterval(recordDay,60000);
    document.addEventListener("visibilitychange",recordDay);
    return()=>{stopped=true;window.clearInterval(interval);document.removeEventListener("visibilitychange",recordDay);};
  },[user?.id]);

  const authUserIdRef = useRef(null);
  const [authSessionChecked, setAuthSessionChecked] = useState(!supabase);
  const [accountStatusChecked, setAccountStatusChecked] = useState(!supabase);
  const [passwordRecovery, setPasswordRecovery] = useState(initialPasswordRecovery.requested);
  const [recoveryError, setRecoveryError] = useState(initialPasswordRecovery.error);
  const [recoveryUserId, setRecoveryUserId] = useState(() =>
    initialPasswordRecovery.requested && !initialPasswordRecovery.error && !initialPasswordRecovery.hasCallback
      ? rememberedPasswordRecoveryUser() : ""
  );
  const [accountRole, setAccountRole] = useState(null);
  const [accountStatus, setAccountStatus] = useState({
    isActive: true,
    suspendedUntil: null,
    suspensionReason: null,
  });
  const [impersonationReturning, setImpersonationReturning] = useState(false);
  const [impersonationError, setImpersonationError] = useState("");
  const impersonated = user && accountRole !== "admin" ? getImpersonation(user.id) : null;
  const finishImpersonation = useCallback(async () => {
    setImpersonationReturning(true);
    setImpersonationError("");
    try { await endImpersonation(); }
    catch { setImpersonationError("Nepavyko atkurti administratoriaus sesijos. Bandykite dar kartą arba prisijunkite iš naujo."); }
  }, []);
  const signInAgain = async () => {
    setImpersonationError("");
    try { await leaveImpersonation(); }
    catch { setImpersonationError("Nepavyko atsijungti. Bandykite dar kartą."); }
  };
  useEffect(() => {
    if (!user?.id || !supabase) return;
    return watchImpersonation(user.id, finishImpersonation);
  }, [user?.id, finishImpersonation]);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authRole, setAuthRole] = useState("worker");
  const [pricingBillingCycle, setPricingBillingCycle] = useState("monthly");
  const [adminMode, setAdminMode] = useState("admin");
  const businessPresentationToken = new URLSearchParams(window.location.search).get(
    "pristatymas"
  );
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
      .then(({ data, error }) => {
        const nextUser = data?.session?.user ?? null;
        authUserIdRef.current = nextUser?.id || null;
        setAccountStatusChecked(!nextUser);
        setUser(nextUser);
        if (error && initialPasswordRecovery.requested) {
          setRecoveryError("Atkūrimo nuoroda nebegalioja. Paprašykite naujos nuorodos.");
        }
        setAuthSessionChecked(true);
      })
      .catch(() => {
        setAccountStatusChecked(true);
        if (initialPasswordRecovery.requested) {
          setRecoveryError("Nepavyko patikrinti atkūrimo nuorodos. Bandykite atidaryti ją dar kartą.");
        }
        setAuthSessionChecked(true);
      });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const nextUser = session?.user ?? null;
        const nextUserId = nextUser?.id || null;
        if (authUserIdRef.current !== nextUserId) {
          setAccountStatusChecked(!nextUser);
          authUserIdRef.current = nextUserId;
        }
        setUser(nextUser);
        if (event === "PASSWORD_RECOVERY" && session?.user?.id) {
          rememberPasswordRecoveryUser(session.user.id);
          setRecoveryUserId(session.user.id);
          setRecoveryError("");
          setPasswordRecovery(true);
          setAuthOpen(false);
          setAuthSessionChecked(true);
        }
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
      setAccountStatusChecked(true);
      return;
    }

    let cancelled = false;
    setAccountStatusChecked(false);

    supabase
      .rpc("get_my_account_status")
      .then(({ data, error }) => {
        if (!cancelled) {
          if (error) {
            console.error(error);
            setAccountRole(null);
          } else {
            const status = data?.[0] || null;
            setAccountRole(status?.role || null);
            setAccountStatus({
              isActive: status?.is_active !== false,
              suspendedUntil: status?.suspended_until || null,
              suspensionReason: status?.suspension_reason || null,
            });
          }
          setAccountStatusChecked(true);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error(error);
          setAccountRole(null);
          setAccountStatusChecked(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

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

      const profileResult = await supabase.rpc("get_my_account_status");

      if (profileResult.error) throw profileResult.error;

      const profileStatus = profileResult.data?.[0] || null;
      setAccountRole(profileStatus?.role || "employer");
      setAccountStatus({
        isActive: profileStatus?.is_active !== false,
        suspendedUntil: profileStatus?.suspended_until || null,
        suspensionReason: profileStatus?.suspension_reason || null,
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
    if (e2eRealAccounts) {window.location.replace("/__e2e/login");return;}
  };

  const finishPasswordRecovery = () => {
    clearPasswordRecoveryUrl();
    setRecoveryUserId("");
    setRecoveryError("");
    setPasswordRecovery(false);
  };

  // Pasibaigus peržiūrai ar grįžtant naudotojo dashboard neberodomas.
  if (impersonationReturning || impersonated?.expired) {
    if (!impersonationError) return <AppBootLoader />;
    return (
      <div className="p24">
        <div className="rolebar adm"><span role="alert">{impersonationError}</span>
          <button type="button" onClick={finishImpersonation}>Grįžti į administratorių</button>
          <button type="button" onClick={signInAgain}>Prisijungti</button>
        </div>
      </div>
    );
  }

  if (!authSessionChecked || (user && !accountStatusChecked)) {
    // Standalone PWA already displays the OS-generated launch screen.
    // Keep login initialization visually quiet; do not show a second logo/spinner.
    // Website and separate /hire portal keep their original loading views.
    if (!isHireProjectPath && statybos24IsStandalone()) {
      return <div role="status" aria-label="Įkeliama" style={{ minHeight: "100vh", background: "#ffffff" }} />;
    }
    return <AppBootLoader />;
  }

  if (passwordRecovery) {
    return (
      <PasswordRecoveryPage
        user={user}
        checking={!authSessionChecked}
        authorized={Boolean(user?.id && recoveryUserId === user.id)}
        error={recoveryError}
        onDone={finishPasswordRecovery}
      />
    );
  }

  if (
    businessPresentationToken === BUSINESS_PRESENTATION_TOKEN &&
    (!user || accountRole === "admin")
  ) {
    return (
      <>
        <BusinessPresentationPage onSignup={openEmployerSignup} />
        <AuthModal
          open={authOpen}
          onClose={() => setAuthOpen(false)}
          initialMode="signup"
          initialRole="employer"
        />
      </>
    );
  }

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
        onLogout={impersonated ? finishImpersonation : logout}
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

  const impersonation = impersonated ? { name: impersonated.name, onEnd: finishImpersonation } : null;
  if (user && accountRole && qaMode && !impersonated && !e2eRealAccounts) {
    return <QaSandbox onExit={closeQaMode} />;
  }
  const e2eAccountSwitcher = e2eRealAccounts && user ? (
    <aside role="note" aria-label="Izoliuota tikrų paskyrų testavimo aplinka"
      style={{position:"fixed",bottom:16,left:16,right:16,zIndex:2200,
        display:"flex",alignItems:"center",justifyContent:"space-between",
        gap:12,flexWrap:"wrap",padding:"10px 14px",borderRadius:9,
        background:"#352b52",color:"#fff",boxShadow:"0 5px 24px #0004"}}>
      <span style={{fontSize:12,fontWeight:800}}>
        🧪 TESTINĖ APLINKA · Tikros funkcijos · Testiniai duomenys · {accountRole}
      </span>
      <button type="button" onClick={async () => {
        await supabase.auth.signOut();
        window.location.replace("/__e2e/login");
        return;
      }} style={{border:0,borderRadius:5,padding:"8px 12px",fontWeight:800,cursor:"pointer"}}>
        Pakeisti testinę paskyrą
      </button>
    </aside>
  ) : null;

  const qaLaunchButton = qaAllowed && !impersonated && !e2eRealAccounts ? (
    <button type="button" onClick={openQaMode}
      title="Privatus testavimo režimas – tik netikri duomenys"
      style={{
        position:"fixed",right:18,top:72,zIndex:210,
        padding:"9px 14px",borderRadius:8,border:"1px solid #c6b4e6",
        background:"#5e478d",color:"#fff",fontWeight:800,fontSize:12,
        boxShadow:"0 4px 16px rgba(0,0,0,.14)",cursor:"pointer"
      }}>
      🧪 Testavimo režimas
    </button>
  ) : null;


  if (publicJobs && !(publicJobs.adId && user && accountRole === "worker")) {
    return <><PublicJobAdsPage route={publicJobs} user={user} onLogin={() => { setAuthMode("login"); setAuthRole("worker"); setAuthOpen(true); }} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialMode={authMode} initialRole="worker" returnPath={window.location.pathname} />
    </>;
  }

  if (user && accountRole === "worker") {
    return (
      <><WorkerDashboard user={user} onLogout={impersonation ? finishImpersonation : logout} impersonation={impersonation} initialAdId={publicJobs?.adId} />{qaLaunchButton}{e2eAccountSwitcher}</>
    );
  }

  if (user && accountRole === "employer") {
    return (
      <><EmployerDashboard user={user} onLogout={impersonation ? finishImpersonation : logout} impersonation={impersonation} />{qaLaunchButton}{e2eAccountSwitcher}</>
    );
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
      <>
      <AdminDashboard
        user={user}
        onLogout={logout}
        onOpenWorker={() => setAdminMode("worker")}
        onOpenEmployer={() => setAdminMode("employer")}
        initialTab={new URLSearchParams(window.location.search).get("admin_tab")}
      />
      {qaLaunchButton}
      {e2eAccountSwitcher}
      </>
    );
  }

  return (
    <>
      <PublicLandingP24
        onLogin={openLogin}
        onEmployerSignup={openEmployerSignup}
        onWorkerSignup={openWorkerSignup}
      />

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        initialMode={authMode}
        initialRole={authRole}
      />
    </>
  );
}
