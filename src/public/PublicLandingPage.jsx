import { useEffect, useState } from "react";
import { clearStatybos24DeferredInstallPrompt, statybos24DeferredInstallPrompt, statybos24InstallListeners, statybos24IsStandalone } from "../lib/config.js";
import { BrandLogo } from "../ui/brand.jsx";
import { EMPLOYER_PLANS, employerPlanAnnualPrice, employerPlanAnnualSavings, formatPlanPrice } from "../employer/plans.js";

export function PublicLandingPage({
  onLogin,
  onEmployerSignup,
  onWorkerSignup,
  pricingBillingCycle,
  setPricingBillingCycle,
}) {
  const plans = EMPLOYER_PLANS;
  const [mobilePlanIndex,setMobilePlanIndex] = useState(0);
  const [installPromptReady, setInstallPromptReady] = useState(Boolean(statybos24DeferredInstallPrompt));
  const [pwaInstalled, setPwaInstalled] = useState(statybos24IsStandalone());
  const [installGuide, setInstallGuide] = useState("");

  useEffect(() => {
    const updateInstallStatus = () => {
      setInstallPromptReady(Boolean(statybos24DeferredInstallPrompt));
      setPwaInstalled(statybos24IsStandalone());
    };
    statybos24InstallListeners.add(updateInstallStatus);
    const display = window.matchMedia?.("(display-mode: standalone)");
    display?.addEventListener?.("change", updateInstallStatus);
    updateInstallStatus();
    return () => {
      statybos24InstallListeners.delete(updateInstallStatus);
      display?.removeEventListener?.("change", updateInstallStatus);
    };
  }, []);

  async function handleInstallFromLanding() {
    const promptEvent = statybos24DeferredInstallPrompt;
    if (promptEvent) {
      clearStatybos24DeferredInstallPrompt(); // Browser prompts can only be used once.
      setInstallPromptReady(false);
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice?.outcome === "accepted") {
          setInstallGuide("Programėlės įdiegimas patvirtintas. Atidarykite ją telefono pradžios ekrane.");
        } else {
          setInstallGuide("Įdiegimą galėsite pasirinkti vėliau per naršyklės meniu.");
        }
      } catch {
        setInstallGuide("Atidarykite „Chrome“ meniu ⋮ ir pasirinkite „Pridėti prie pagrindinio ekrano“ arba „Įdiegti programėlę“.");
      }
      return;
    }
    const ua = navigator.userAgent || "";
    const isAppleMobile = /iPhone|iPad|iPod/i.test(ua);
    const isAndroid = /Android/i.test(ua);
    setInstallGuide(isAppleMobile
      ? "Paspauskite naršyklės „Bendrinti“ mygtuką ir pasirinkite „Pridėti prie pradžios ekrano“."
      : isAndroid
      ? "Atidarykite „Chrome“ meniu ⋮ ir pasirinkite „Pridėti prie pagrindinio ekrano“ arba „Įdiegti programėlę“. Jei matote tik nuorodos pridėjimą, jūsų telefone ši naršyklė gali nepalaikyti pilno PWA diegimo."
      : "Naršyklės meniu pasirinkite „Įdiegti programėlę“ arba „Pridėti prie pagrindinio ekrano“."
    );
  }


  const serviceItems = [
    {
      icon: "⌕",
      title: "Darbuotojų paieška",
      text: "Ieškokite žmonių pagal miestą, datą, laiką ir realų prieinamumą.",
    },
    {
      icon: "↗",
      title: "Kvietimai į darbą",
      text: "Siųskite aiškius pasiūlymus su darbo vieta, laiku ir atlygiu.",
    },
    {
      icon: "◷",
      title: "Lengvai valdoma sistema",
      text: "Darbus, kvietimus, grafiką, atvykimus ir darbo istoriją valdote aiškiai vienoje vietoje.",
    },
    {
      icon: "✉",
      title: "Pokalbiai",
      text: "Darbo ir privatūs pokalbiai lieka vienoje vietoje kartu su darbo informacija.",
    },
    {
      icon: "✓",
      title: "Darbo istorija",
      text: "Atvykimai, užbaigti darbai ir įvertinimai padeda matyti realią darbo eigą.",
    },
    {
      icon: "★",
      title: "Patikimumo ir reputacijos auginimas",
      text: "Atvykimų istorija, užbaigti darbai ir įvertinimai padeda abiem pusėms auginti patikimumą ir reputaciją.",
    },
  ];

  return (
    <div className="home-page">
      <a className="home-skip-link" href="#pradzia">Pereiti prie pagrindinio turinio</a>
      <style>{`
        .home-page{--navy:#222631;--navy2:#2a2e3c;--orange:#6b5b95;--orange-dark:#584a7e;--cream:#f5f3fa;--soft:#f5f8fa;--muted:#607180;--line:#e2e9ee;color:var(--navy);background:#fff;font-family:Inter,system-ui,sans-serif;line-height:1.5}
        .home-page *{box-sizing:border-box}.home-wrap{width:min(1120px,calc(100% - 40px));margin:auto}.home-page button{font:inherit;cursor:pointer}.home-skip-link{position:fixed;left:14px;top:12px;z-index:30000;transform:translateY(-160%);padding:10px 14px;border-radius:9px;background:var(--navy);color:#fff;font-size:13px;font-weight:850;text-decoration:none;box-shadow:0 8px 24px rgba(34,38,49,.2)}.home-skip-link:focus{transform:translateY(0)}.home-page a:focus-visible,.home-page button:focus-visible{outline:3px solid var(--navy);outline-offset:3px}
        .home-header{position:sticky;top:0;z-index:20;background:rgba(255,255,255,.96);backdrop-filter:blur(12px);border-bottom:1px solid rgba(226,233,238,.92)}.home-nav{min-height:72px;display:flex;align-items:center;gap:28px}.home-brand{color:var(--navy);font:900 18px Manrope,Inter,sans-serif;text-decoration:none;white-space:nowrap}.home-navlinks{display:flex;align-items:center;gap:24px;margin-left:18px}.home-navlinks a{color:#526374;text-decoration:none;font-size:12px;font-weight:800}.home-navlinks a:hover{color:var(--orange-dark)}.home-actions{display:flex;align-items:center;gap:12px;margin-left:auto}.home-login{border:0;background:none;color:#405264;font-size:13px;font-weight:800;padding:10px 5px}.home-login:hover{color:var(--orange-dark)}
        .home-btn{border:1px solid var(--orange);border-radius:11px;background:var(--orange);color:#fff;padding:12px 18px;font-size:13px;font-weight:850;display:inline-flex;align-items:center;justify-content:center;min-height:46px;transition:transform .18s ease,box-shadow .18s ease,background .18s ease}.home-btn:hover{background:var(--orange-dark);transform:translateY(-1px);box-shadow:0 8px 22px rgba(107,91,149,.2)}.home-btn.outline{border-color:#cbd7df;background:#fff;color:var(--navy)}.home-btn.outline:hover{background:#f7f9fb;box-shadow:0 8px 20px rgba(34,38,49,.08)}.home-btn.dark{background:var(--navy);border-color:var(--navy)}.home-btn.dark:hover{background:var(--navy2);box-shadow:0 8px 22px rgba(34,38,49,.18)}
        .home-hero{position:relative;overflow:hidden;background:radial-gradient(circle at 84% 18%,rgba(107,91,149,.17) 0%,rgba(107,91,149,0) 29%),linear-gradient(125deg,#f4f8fb 0%,#fff 62%);border-bottom:1px solid var(--line)}.home-hero:before{content:"";position:absolute;right:-220px;bottom:-420px;width:760px;height:760px;border:1px solid #d5cfe5;border-radius:50%;pointer-events:none}.home-hero-grid{position:relative;display:grid;grid-template-columns:minmax(0,1.07fr) minmax(360px,.93fr);gap:64px;align-items:center;padding:88px 0 84px}.home-kicker{display:inline-flex;align-items:center;gap:8px;font-size:11px;font-weight:900;letter-spacing:.12em;color:#453a63;text-transform:uppercase}.home-kicker:before{content:"";width:24px;height:2px;border-radius:999px;background:var(--orange)}.home-hero h1{font:900 clamp(40px,5vw,62px)/1.04 Manrope,Inter,sans-serif;letter-spacing:-.05em;margin:17px 0 20px;max-width:690px}.home-hero h1 em{color:var(--orange);font-style:normal}.home-lead{font-size:18px;line-height:1.65;color:var(--muted);max-width:660px;margin:0}.home-worker-free{font-weight:900;color:#16845b}.home-hero-actions{display:flex;flex-wrap:wrap;gap:10px;margin:28px 0 20px}.home-proof{display:flex;flex-wrap:wrap;gap:8px}.home-proof span{display:inline-flex;align-items:center;gap:7px;padding:7px 10px;border:1px solid #dce5eb;border-radius:999px;background:rgba(255,255,255,.72);color:#526374;font-size:11px;font-weight:750}.home-proof span:before{content:"✓";color:#16845b;font-weight:950}
        .home-summary{position:relative;background:var(--navy);color:#fff;border-radius:24px;padding:28px;box-shadow:0 28px 70px rgba(34,38,49,.22);overflow:hidden}.home-summary:after{content:"";position:absolute;right:-70px;top:-70px;width:190px;height:190px;border-radius:50%;background:rgba(107,91,149,.13)}.home-summary-top{position:relative;z-index:1}.home-summary-label{display:inline-flex;padding:6px 10px;border-radius:999px;background:rgba(107,91,149,.16);color:#b3a8d0;font-size:10px;font-weight:900;letter-spacing:.12em}.home-summary h2{font:850 25px/1.2 Manrope,Inter,sans-serif;margin:13px 0 8px}.home-summary>div>p{color:#bfd0dc;font-size:13px;line-height:1.6;margin:0}.home-summary-list{position:relative;z-index:1;display:grid;gap:10px;margin-top:23px}.home-summary-row{display:grid;grid-template-columns:40px minmax(0,1fr);gap:13px;align-items:start;padding:14px;border:1px solid rgba(255,255,255,.11);border-radius:14px;background:rgba(255,255,255,.055)}.home-summary-icon{display:grid;place-items:center;width:40px;height:40px;border-radius:11px;background:var(--orange);color:#fff;font-weight:900}.home-summary-row b{display:block;font-size:14px}.home-summary-row span:last-child{display:block;margin-top:3px;color:#bfd0dc;font-size:11.5px;line-height:1.5}
        .home-section{padding:70px 0}.home-section.soft{background:var(--soft)}.home-section-head{display:flex;justify-content:space-between;gap:28px;align-items:end;margin-bottom:28px}.home-section h2,.home-cta h2{font:850 clamp(28px,3.2vw,40px)/1.15 Manrope,Inter,sans-serif;letter-spacing:-.035em;margin:10px 0 0}.home-intro{color:var(--muted);max-width:610px;margin:0;font-size:14px;line-height:1.65}.home-services{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.home-service{background:#fff;border:1px solid var(--line);border-radius:16px;padding:21px;transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease}.home-service:hover{transform:translateY(-2px);border-color:#b9b0d4;box-shadow:0 14px 34px rgba(34,38,49,.07)}.home-service-icon{display:grid;place-items:center;width:40px;height:40px;border-radius:11px;background:var(--cream);color:#4a3f6b;font-size:18px;font-weight:900}.home-service h3{font:850 16px Manrope,Inter,sans-serif;margin:15px 0 7px}.home-service p{font-size:12.5px;line-height:1.58;color:var(--muted);margin:0}
        .home-live-panel{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(360px,.95fr);gap:28px;align-items:center;padding:38px;border:1px solid #dce5eb;border-radius:24px;background:linear-gradient(135deg,#fff 0%,#fffaf5 56%,#f4f8fa 100%);box-shadow:0 18px 46px rgba(34,38,49,.07)}.home-live-copy h2{font:900 clamp(32px,4vw,52px)/1.06 Manrope,Inter,sans-serif;letter-spacing:-.045em;margin:12px 0 15px;max-width:760px}.home-live-copy p{max-width:720px;margin:0;color:#526374;font-size:16px;line-height:1.65}.home-live-note{display:inline-flex;margin-top:18px;padding:9px 12px;border-radius:10px;background:#222631;color:#fff;font-size:12px;font-weight:800;line-height:1.4}.home-live-flow{display:grid;gap:10px}.home-live-row{position:relative;display:grid;grid-template-columns:42px minmax(0,1fr);gap:13px;align-items:center;padding:16px;border:1px solid #dfe7ed;border-radius:15px;background:#fff}.home-live-row.active{padding-right:72px;border-color:#ab9fcb;box-shadow:0 10px 28px rgba(107,91,149,.10)}.home-live-step{display:grid;place-items:center;width:42px;height:42px;border-radius:12px;background:#f2f0f8;color:#453a63;font:900 15px Manrope,Inter,sans-serif}.home-live-row.active .home-live-step{background:#6b5b95;color:#fff}.home-live-row b{display:block;color:#222631;font-size:14px}.home-live-row div>span{display:block;margin-top:4px;color:#6d7c88;font-size:11.5px;line-height:1.45}.home-live-status{position:absolute;right:14px;top:50%;transform:translateY(-50%);padding:6px 8px;border-radius:999px;background:#e9f7f1;color:#167a54;font-size:9px;font-weight:950;letter-spacing:.08em}
        .home-audiences{display:grid;grid-template-columns:1fr 1fr;gap:16px}.home-audience{position:relative;overflow:hidden;border:1px solid var(--line);border-radius:20px;padding:28px;background:#fff}.home-audience.employer{background:linear-gradient(135deg,#fff8f1,#fff 58%)}.home-audience.worker{background:linear-gradient(135deg,#f1f7fb,#fff 58%)}.home-audience-tag{display:inline-flex;padding:6px 10px;border-radius:999px;background:#fff;border:1px solid var(--line);font-size:10px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.home-audience h3{font:850 24px/1.2 Manrope,Inter,sans-serif;margin:13px 0 8px}.home-audience p{color:var(--muted);font-size:13px;line-height:1.6;margin:0}.home-audience ul{list-style:none;padding:0;display:grid;gap:9px;margin:20px 0 22px}.home-audience li{font-size:12.5px;padding-left:22px;position:relative}.home-audience li:before{content:'✓';position:absolute;left:0;color:#16845b;font-weight:900}
        .home-price-head{display:flex;align-items:end;justify-content:space-between;gap:20px;margin-bottom:24px}.home-price-copy{max-width:680px}.home-free-worker{display:inline-flex;margin-top:12px;padding:7px 10px;border-radius:999px;background:#e9f7f1;color:#167a54;font-size:11px;font-weight:850}.home-trial-offer{display:block;margin-top:10px;color:#433960;font-size:12px;font-weight:800;line-height:1.5}.home-toggle{display:flex;background:#e8eef2;border-radius:11px;padding:4px;flex:none}.home-toggle button{border:0;background:transparent;border-radius:8px;padding:9px 12px;color:#526374;font-size:11.5px;font-weight:800}.home-toggle button.selected{background:#fff;color:var(--navy);box-shadow:0 1px 5px rgba(34,38,49,.12)}.home-prices{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.home-plan{position:relative;display:flex;flex-direction:column;background:#fff;border:1px solid var(--line);border-radius:18px;padding:22px}.home-plan.featured{border:2px solid var(--orange);box-shadow:0 16px 36px rgba(107,91,149,.12)}.home-plan-badge{position:absolute;right:18px;top:-12px;background:var(--orange);color:#fff;padding:5px 10px;border-radius:999px;font-size:9px;font-weight:900;letter-spacing:.06em}.home-plan-badge.pro{background:var(--navy)}.home-plan h3{font:850 20px Manrope,Inter,sans-serif;margin:0}.home-plan-sub{color:var(--muted);font-size:11.5px;line-height:1.5;min-height:35px;margin:8px 0 14px}.home-plan-trial{margin:-5px 0 13px;padding:9px 10px;border:1px solid #ccc4df;border-radius:10px;background:#f6f4fa;color:#433960;font-size:10.5px;font-weight:800;line-height:1.4}.home-amount{font:900 33px Manrope,Inter,sans-serif;letter-spacing:-.03em}.home-amount small{font:700 11px Inter,sans-serif;color:var(--muted);letter-spacing:0}.home-year-note{min-height:23px;color:#167a54;font-size:10.5px;font-weight:750;margin-top:4px}.home-plan ul{list-style:none;padding:0;display:grid;gap:8px;margin:14px 0 20px;flex:1}.home-plan li{font-size:11.5px;padding-left:20px;position:relative;color:#405264}.home-plan li:before{content:'✓';position:absolute;left:0;color:#16845b;font-weight:900}.home-plan .home-btn{width:100%}
        .home-cta{padding:64px 0;background:linear-gradient(135deg,#222631,#2a2e3c);color:#fff}.home-cta-inner{display:flex;align-items:center;justify-content:space-between;gap:30px}.home-cta h2{margin:0 0 8px;color:#fff}.home-cta p{margin:0;color:#bfd0dc;max-width:650px;font-size:13.5px}.home-cta-buttons{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:10px;flex:none}.home-cta .home-btn.outline{border-color:rgba(255,255,255,.32);background:transparent;color:#fff}.home-cta .home-btn.outline:hover{background:rgba(255,255,255,.08)}
        .home-app-install{padding:28px 0 34px;background:#f5f8fa;border-top:1px solid #e2e9ee}
        .home-app-install-card{display:grid;grid-template-columns:84px minmax(0,1fr) auto;align-items:center;gap:21px;padding:20px 24px;background:#fff;border:1px solid #e1e9ef;border-radius:19px;box-shadow:0 12px 32px rgba(34,38,49,.055)}
        .home-app-install-icon{width:76px;height:76px;border-radius:19px;display:block;background:#fff;object-fit:contain;border:1px solid #edf0f3;box-shadow:0 7px 19px rgba(34,38,49,.10)}
        .home-app-install-copy{min-width:0}.home-app-install-copy h2{margin:0 0 6px;font:850 22px/1.25 Manrope,Inter,sans-serif;letter-spacing:-.025em;color:var(--navy)}
        .home-app-install-copy p{margin:0;color:#607180;font-size:13px;line-height:1.55;max-width:610px}
        .home-app-install-help{margin:11px 0 0!important;color:#31526a!important;font-size:12px!important;line-height:1.55!important}
        .home-app-install-actions{display:flex;align-items:center;justify-content:flex-end}.home-app-install-actions .home-btn{min-width:178px}
        @media(max-width:700px){.home-app-install{padding:18px 0 24px}.home-app-install-card{grid-template-columns:64px minmax(0,1fr);gap:12px;padding:17px;border-radius:16px}.home-app-install-icon{width:64px;height:64px;border-radius:16px}.home-app-install-copy h2{font-size:17px;line-height:1.26}.home-app-install-copy p{font-size:12px}.home-app-install-actions{grid-column:1/-1}.home-app-install-actions .home-btn{width:100%;min-height:46px}.home-app-install-help{font-size:12px!important}}
        .home-footer{padding:24px 0;background:#222631;color:#9cb0bf}.home-footer-inner{display:flex;justify-content:space-between;align-items:center;gap:15px;font-size:11.5px}.home-footer .home-brand{color:#fff}.home-legal-links{display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap}.home-terms-link{border:0;background:none;color:#d3dee6;font:inherit;text-decoration:underline;text-underline-offset:3px;cursor:pointer}
        @media(min-width:901px) and (hover:hover) and (pointer:fine){
          .home-page .home-plan{transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease;transform-origin:center center}
          .home-page .home-plan:hover,.home-page .home-plan:focus-within{transform:translateY(-6px) scale(1.025);z-index:2;border-color:var(--orange);box-shadow:0 20px 44px rgba(34,38,49,.14)}
          .home-page .home-plan.featured:hover,.home-page .home-plan.featured:focus-within{box-shadow:0 20px 44px rgba(107,91,149,.2)}
        }
        .home-plan-mobile-nav{display:none}
        @media(max-width:700px){
          .home-plan-mobile-nav{display:grid;grid-template-columns:40px minmax(0,1fr) 40px;gap:12px;align-items:center;margin:0 0 22px;padding:9px;background:#f1f4f6;border:1px solid #e2e9ee;border-radius:13px;position:sticky;top:8px;z-index:5}
          .home-plan-mobile-nav button{width:40px;height:40px;display:grid;place-items:center;border:1px solid #dbe4ea;border-radius:10px;background:#fff;color:#222631;font:inherit;font-size:25px;line-height:1;cursor:pointer}
          .home-plan-mobile-nav button:active{background:#f0edf7;border-color:#6b5b95}
          .home-plan-mobile-nav button:focus-visible{outline:2px solid #6b5b95;outline-offset:2px}
          .home-plan-mobile-nav>div{text-align:center;min-width:0}.home-plan-mobile-nav b{display:block;font-size:14px}.home-plan-mobile-nav span{display:block;font-size:10px;color:#7a8996;margin-top:3px}
          .home-page .home-prices>.home-plan{display:none}.home-page .home-prices>.home-plan.mobile-current-plan{display:flex}
        }
        @media(prefers-reduced-motion:reduce){.home-page .home-plan{transition:none!important}.home-page .home-plan:hover,.home-page .home-plan:focus-within{transform:none!important}}
        @media(max-width:900px){.home-navlinks{display:none}.home-hero-grid{grid-template-columns:1fr;gap:34px;padding:64px 0}.home-summary{max-width:650px}.home-services{grid-template-columns:repeat(2,1fr)}.home-prices{gap:9px}.home-plan{padding:18px}.home-cta-inner{align-items:flex-start;flex-direction:column}.home-cta-buttons{justify-content:flex-start}}
        @media(min-width:701px){.home-page .home-audience-head{flex-direction:column;align-items:flex-start;gap:14px}.home-page .home-audience-head .home-intro{max-width:820px}.home-page .home-price-copy{max-width:none;min-width:0;flex:1}.home-page .home-price-title{color:var(--navy)}.home-page .home-price-subtitle{display:block;margin-top:14px;color:var(--muted);font:400 14px/1.65 Inter,sans-serif;letter-spacing:normal}}
        @media(max-width:700px){.home-wrap{width:calc(100% - 28px)}.home-nav{min-height:68px;justify-content:space-between;gap:8px}.home-actions{gap:5px}.home-actions>.home-btn{font-size:11px;padding:8px 10px;min-height:40px}.home-login{font-size:11px;min-height:40px;padding:8px 4px}.home-hero-grid{padding:48px 0}.home-hero h1{font-size:clamp(37px,11vw,48px)}.home-lead{font-size:16px}.home-proof{gap:6px}.home-proof span{font-size:10px}.home-summary{padding:20px;border-radius:18px}.home-summary h2{font-size:22px}.home-section{padding:52px 0}.home-section-head,.home-price-head{align-items:flex-start;flex-direction:column}.home-services,.home-audiences,.home-prices{grid-template-columns:1fr}.home-service{padding:18px}.home-live-panel{grid-template-columns:1fr;padding:22px;gap:20px}.home-live-copy h2{font-size:34px}.home-live-copy p{font-size:14px}.home-toggle{width:100%}.home-toggle button{flex:1}.home-plan-sub{min-height:0}.home-cta{padding:50px 0}.home-cta-buttons{width:100%}.home-cta .home-btn{flex:1}.home-footer-inner{flex-direction:column;align-items:flex-start}}
        @media(max-width:420px){.home-brand{font-size:13px}.home-actions{margin-left:0}.home-live-panel{padding:18px}.home-live-copy h2{font-size:30px}.home-live-row{grid-template-columns:38px minmax(0,1fr);padding:13px}.home-live-row.active{padding-right:62px}.home-live-step{width:38px;height:38px}.home-live-status{right:10px}.home-hero-actions{display:grid}.home-hero-actions .home-btn{width:100%}.home-cta-buttons{display:grid}.home-cta .home-btn{width:100%}.home-summary-row{grid-template-columns:36px minmax(0,1fr);padding:12px}.home-summary-icon{width:36px;height:36px}}
        /* STATYBOS24 MOBILE: home-page CTAs side by side, never affecting /hire */
        @media(max-width:700px){
          .home-page .home-hero-actions,
          .home-page .home-cta-buttons{
            display:grid!important;
            grid-template-columns:repeat(2,minmax(0,1fr))!important;
            gap:9px!important;
            width:100%!important;
            max-width:540px;
            justify-content:stretch!important;
          }
          .home-page .home-hero-actions .home-btn,
          .home-page .home-cta-buttons .home-btn{
            box-sizing:border-box!important;
            display:flex!important;
            width:100%!important;
            min-width:0!important;
            min-height:48px!important;
            margin:0!important;
            padding:10px 4px!important;
            font-size:clamp(11px,3.3vw,14px)!important;
            font-weight:750!important;
            line-height:1.2!important;
            letter-spacing:-.025em!important;
            text-align:center!important;
            white-space:nowrap!important;
          }
        }
        @media(max-width:350px){
          .home-page .home-hero-actions .home-btn,
          .home-page .home-cta-buttons .home-btn{
            font-size:10.5px!important;
            padding-inline:2px!important;
          }
        }
        @media(prefers-reduced-motion:reduce){.home-page *{scroll-behavior:auto!important;transition:none!important}}
      `}</style>

      <header className="home-header">
        <div className="home-wrap home-nav">
          <BrandLogo className="home-brand" href="#pradzia" height={60} />
          <nav className="home-navlinks" aria-label="Pagrindinė navigacija">
            <a href="#paslaugos">Paslaugos</a>
            <a href="#kam-skirta">Kam skirta</a>
            <a href="#planai">Planai</a>
          </nav>
          <div className="home-actions">
            <button className="home-login" type="button" onClick={onLogin}>Prisijungti</button>
            <button className="home-btn" type="button" onClick={() => onEmployerSignup()}>Registruotis</button>
          </div>
        </div>
      </header>

      <main id="pradzia" tabIndex={-1}>
        <section className="home-hero">
          <div className="home-wrap home-hero-grid">
            <div>
              <div className="home-kicker">Statybų darbo platforma</div>
              <h1>Darbuotojai ir statybų darbai – <em>vienoje vietoje.</em></h1>
              <p className="home-lead">
                Padedame įmonėms ir privatiems darbdaviams rasti žmones pagal realų prieinamumą,
                o darbuotojams – <span className="home-worker-free">visiškai nemokamai</span> gauti aiškius darbo pasiūlymus su vieta, laiku ir atlygiu.
              </p>
              <div className="home-hero-actions">
                <button className="home-btn" type="button" onClick={() => onEmployerSignup()}>Ieškau darbuotojų</button>
                <button className="home-btn outline" type="button" onClick={onWorkerSignup}>Ieškau darbo</button>
              </div>
              <div className="home-proof" aria-label="Pagrindinės platformos galimybės">
                <span>Paieška pagal prieinamumą</span>
                <span>Aiškūs darbo kvietimai</span>
                <span>Lengvai valdoma sistema</span>
              </div>
            </div>

            <aside className="home-summary" aria-label="Kaip veikia statybos24">
              <div className="home-summary-top">
                <span className="home-summary-label">KAIP VEIKIA</span>
                <h2>Nuo poreikio iki darbo dienos</h2>
                <p>Trumpesnis kelias tarp žmogaus, kuriam reikia darbuotojo, ir žmogaus, kuris gali dirbti.</p>
              </div>
              <div className="home-summary-list">
                <div className="home-summary-row">
                  <span className="home-summary-icon">1</span>
                  <div><b>Nurodykite poreikį arba prieinamumą</b><span>Darbdavys sukuria darbą, darbuotojas pažymi, kada gali dirbti.</span></div>
                </div>
                <div className="home-summary-row">
                  <span className="home-summary-icon">2</span>
                  <div><b>Susiraskite tinkamą žmogų arba darbą</b><span>Matomos svarbiausios sąlygos prieš priimant sprendimą.</span></div>
                </div>
                <div className="home-summary-row">
                  <span className="home-summary-icon">3</span>
                  <div><b>Valdykite visą darbo eigą</b><span>Kvietimai, pokalbiai, darbo diena ir istorija lieka vienoje vietoje.</span></div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="home-section soft" id="paslaugos">
          <div className="home-wrap">
            <div className="home-live-panel">
              <div className="home-live-copy">
                <div className="home-kicker">NE CV LENTA · REALUS DARBAS LIVE</div>
                <h2>Esate matomas tada, kai iš tikrųjų galite dirbti.</h2>
                <p>
                  Pažymite savo prieinamumo grafiką, o darbdaviai jus randa pagal
                  miestą, laiką ir realų užimtumą. Kai darbuotojo reikia dabar,
                  kvietimą gaunate tiesiogiai su konkrečia darbo vieta, laiku ir
                  atlygiu.
                </p>
                <div className="home-live-note">
                  Nereikia siųsti CV ir laukti, kol kas nors paskambins.
                </div>
              </div>

              <div className="home-live-flow" aria-label="Kaip veikia darbo paieška gyvai">
                <div className="home-live-row">
                  <span className="home-live-step">1</span>
                  <div>
                    <b>Pažymite, kada galite dirbti</b>
                    <span>Jūsų grafikas parodo realų prieinamumą.</span>
                  </div>
                </div>
                <div className="home-live-row">
                  <span className="home-live-step">2</span>
                  <div>
                    <b>Darbdaviai jus mato pagal poreikį</b>
                    <span>Įmonės ir privatūs darbdaviai ieško pagal miestą, datą ir laiką.</span>
                  </div>
                </div>
                <div className="home-live-row active">
                  <span className="home-live-step">3</span>
                  <div>
                    <b>Gaunate tiesioginį kvietimą</b>
                    <span>Čia ir dabar matote darbą, vietą, laiką ir siūlomą atlygį.</span>
                  </div>
                  <span className="home-live-status">LIVE</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="home-section" id="kam-skirta">
          <div className="home-wrap">
            <div className="home-section-head home-audience-head">
              <div>
                <div className="home-kicker">Kam skirta</div>
                <h2>Viena platforma abiem darbo pusėms.</h2>
              </div>
              <p className="home-intro">Įmonė ar privatus darbdavys greičiau randa tinkamus žmones, o darbuotojas iš anksto mato, į kokį darbą yra kviečiamas.</p>
            </div>
            <div className="home-audiences">
              <article className="home-audience employer">
                <span className="home-audience-tag">Darbdaviams</span>
                <h3>Įmonėms ir privatiems darbdaviams.</h3>
                <p>Registruokitės kaip įmonė arba privatus asmuo, sukurkite darbą, atrinkite tinkamus darbuotojus ir valdykite visą eigą vienoje sistemoje.</p>
                <ul>
                  <li>Paieška pagal miestą, laiką ir prieinamumą</li>
                  <li>Kvietimai, pokalbiai ir darbo dienos valdymas</li>
                  <li>Favoritai, istorija, įvertinimai ir komandos funkcijos</li>
                </ul>
              </article>

              <article className="home-audience worker">
                <span className="home-audience-tag">Darbuotojams</span>
                <h3>Gaukite aiškius darbo pasiūlymus.</h3>
                <p>Pažymėkite, kada galite dirbti, ir vienoje vietoje valdykite kvietimus, žinutes bei darbo istoriją.</p>
                <ul>
                  <li>Darbo vieta, laikas ir atlygis matomi prieš sutinkant</li>
                  <li>Prieinamumo grafikas ir „Laisvas dabar“ galimybė</li>
                  <li>Registracija ir darbo kvietimų gavimas – nemokamai</li>
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section className="home-section soft" id="planai">
          <div className="home-wrap">
            <div className="home-price-head">
              <div className="home-price-copy">
                <div className="home-kicker">Darbdavių planai</div>
                <h2 className="home-price-title">Pradėkite nemokamai.<span className="home-price-subtitle"> Augant poreikiui – rinkitės daugiau galimybių.</span></h2>
              </div>
              <div className="home-toggle" aria-label="Mokėjimo laikotarpis">
                <button className={pricingBillingCycle === "monthly" ? "selected" : ""} type="button" aria-pressed={pricingBillingCycle === "monthly"} onClick={() => setPricingBillingCycle("monthly")}>Kas mėnesį</button>
                <button className={pricingBillingCycle === "yearly" ? "selected" : ""} type="button" aria-pressed={pricingBillingCycle === "yearly"} onClick={() => setPricingBillingCycle("yearly")}>Už metus −20 %</button>
              </div>
            </div>

            <div className="home-plan-mobile-nav" aria-label="Planų pasirinkimas"><button type="button" aria-label="Ankstesnis planas" onClick={()=>setMobilePlanIndex(index=>(index-1+plans.length)%plans.length)}>‹</button><div aria-live="polite"><b>{plans[mobilePlanIndex]?.name}</b><span>{mobilePlanIndex+1} / {plans.length}</span></div><button type="button" aria-label="Kitas planas" onClick={()=>setMobilePlanIndex(index=>(index+1)%plans.length)}>›</button></div>

            <div className="home-prices">
              {plans.map((item, planIndex) => {
                const paid = item.key !== "basic";
                const yearly = pricingBillingCycle === "yearly";
                const visibleFeatures =
                  item.key === "business_pro"
                    ? item.features
                    : item.key === "business"
                    ? item.features.slice(0, 6)
                    : item.features;
                return (
                  <article className={`home-plan ${item.key === "business" ? "featured" : ""} ${planIndex === mobilePlanIndex ? "mobile-current-plan" : ""}`} key={item.key}>
                    {item.key === "business" && <span className="home-plan-badge">POPULIARIAUSIAS</span>}
                    {item.key === "business_pro" && <span className="home-plan-badge pro">PILNAS VALDYMAS</span>}
                    <h3>{item.name}</h3>
                    <p className="home-plan-sub">{item.description}</p>
                    <div className="home-amount">
                      {paid ? yearly ? formatPlanPrice(employerPlanAnnualPrice(item)) : formatPlanPrice(item.price) : "0"} €
                      <small> / {paid && yearly ? "metus" : "mėn."}</small>
                    </div>
                    <div className="home-year-note">{paid && yearly ? `Sutaupote ${formatPlanPrice(employerPlanAnnualSavings(item))} € per metus` : ""}</div>
                    <ul>{visibleFeatures.map((benefit) => <li key={benefit}>{benefit}</li>)}</ul>
                    {item.key === "business" && (
                      <div className="home-plan-trial">
                        <b>Naujoms įmonėms – 30 dienų nemokamai.</b><br />
                        Aktyvuojama automatiškai, be kortelės. Privatūs darbdaviai
                        Business planą gali rinktis įprastai.
                      </div>
                    )}
                    <button className={`home-btn ${item.key === "business" ? "" : "outline"}`} type="button" onClick={() => onEmployerSignup()}>
                      {item.key === "basic" ? "Pradėti nemokamai" : "Registruotis"}
                    </button>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="home-cta">
          <div className="home-wrap home-cta-inner">
            <div>
              <h2>Raskite žmogų darbui arba darbą sau.</h2>
              <p>Registracija užtrunka kelias minutes. Galite registruotis kaip įmonė, privatus darbdavys arba darbuotojas.</p>
            </div>
            <div className="home-cta-buttons">
              <button className="home-btn" type="button" onClick={() => onEmployerSignup()}>Ieškau darbuotojų</button>
              <button className="home-btn outline" type="button" onClick={onWorkerSignup}>Ieškau darbo</button>
            </div>
          </div>
        </section>
        {!pwaInstalled && (
          <section className="home-app-install" aria-labelledby="home-app-install-title">
            <div className="home-wrap">
              <div className="home-app-install-card">
                <img
                  className="home-app-install-icon"
                  src="/statybos24-app-192-v2.png"
                  alt="Statybos24 programėlės ikonėlė"
                  width="76" height="76" loading="lazy"
                />
                <div className="home-app-install-copy">
                  <h2 id="home-app-install-title">Įsidiekite „Statybos24“ telefone</h2>
                  <p>Pasiekite darbus, kvietimus ir savo grafiką vienu paspaudimu iš telefono pradžios ekrano.</p>
                  {installGuide && <p className="home-app-install-help" role="status">{installGuide}</p>}
                </div>
                <div className="home-app-install-actions">
                  <button className="home-btn" type="button" onClick={handleInstallFromLanding}>
                    Įdiegti programėlę
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="home-footer">
        <div className="home-wrap home-footer-inner">
          <BrandLogo className="home-brand" href="#pradzia" height={42} style={{ background: "#fff", padding: "8px 12px", borderRadius: 12 }} />
          <div className="home-legal-links">
            <a className="home-terms-link" href="/naudojimosi-salygos">Naudojimosi sąlygos</a>
            <a className="home-terms-link" href="/privatumo-politika">Privatumo politika</a>
            <a className="home-terms-link" href="/rekvizitai">Rekvizitai</a>
          </div>
          <span>© 2026 statybos24.lt</span>
        </div>
      </footer>


    </div>
  );
}
