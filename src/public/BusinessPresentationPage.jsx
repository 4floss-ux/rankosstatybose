import { useEffect } from "react";
import { BrandImage } from "../ui/brand.jsx";

export const BP_SCREEN_JOB_FORM = "/assets/screens/bp-screen-job-form.svg";
export const BP_SCREEN_WORKER_MATCH = "/assets/screens/bp-screen-worker-match.svg";
export const BP_SCREEN_HISTORY = "/assets/screens/bp-screen-history.svg";
export const BP_SCREEN_RATING = "/assets/screens/bp-screen-rating.svg";
export const BP_SCREEN_PRO_TOOLS = "/assets/screens/bp-screen-pro-tools.svg";
export const BP_SCREEN_TRIAL = "/assets/screens/bp-screen-trial.svg";

export const BP_SCREEN_STATS = "/assets/screens/bp-screen-stats.svg";

export function BusinessPresentationScreenshot({ src, alt, className = "", eager = false }) {
  return (
    <div className={`bp-screen ${className}`.trim()}>
      <div className="bp-screen-bar" aria-hidden="true">
        <span></span><span></span><span></span>
        <b>statybos24.lt</b>
      </div>
      <div className="bp-screen-view">
        <img src={src} alt={alt} loading={eager ? "eager" : "lazy"} decoding="async" />
      </div>
    </div>
  );
}

export function BusinessPresentationPage({ onSignup }) {
  useEffect(() => {
    const previousTitle = document.title;
    let robotsMeta = document.querySelector('meta[name="robots"]');
    const createdMeta = !robotsMeta;
    const previousRobots = robotsMeta?.getAttribute("content") || "";

    if (!robotsMeta) {
      robotsMeta = document.createElement("meta");
      robotsMeta.setAttribute("name", "robots");
      document.head.appendChild(robotsMeta);
    }

    robotsMeta.setAttribute("content", "noindex,nofollow,noarchive");
    document.title = "Statybos24.lt | Pristatymas statybos įmonėms";

    return () => {
      document.title = previousTitle;
      if (createdMeta) robotsMeta?.remove();
      else robotsMeta?.setAttribute("content", previousRobots);
    };
  }, []);

  const steps = [
    ["01", "Sukuriate darbo poreikį", "Nurodote vietą, datą, laiką, reikalingų žmonių skaičių, atlygį, atvykimo sąlygas ir darbo aprašymą."],
    ["02", "Sistema atrenka tinkamus žmones", "Matote darbuotojus, kuriems tinka darbo vieta ir laikas, jų aktyvumą, patirtį ir – pagal planą – patikimumo rodiklius."],
    ["03", "Peržiūrite ir kviečiate", "Prieš kviesdami galite atsidaryti darbuotojo profilį. Kvietime darbuotojas gauna konkrečią vietą, laiką ir atlygį."],
    ["04", "Darbuotojas priima pasiūlymą", "Įmonė mato, kiek žmonių patvirtino darbą, gali bendrauti ir valdyti konkretaus darbo eigą vienoje vietoje."],
    ["05", "Užbaigiate darbo dieną", "Fiksuojamas atvykimas, darbo dienos rezultatas ir užbaigtas darbas. Jei kyla nesutarimas, numatytas ginčo procesas."],
    ["06", "Kaupiama darbo istorija", "Po realių darbų lieka įvertinimai, atsiliepimai ir patikimumo istorija, padedanti priimti kitą sprendimą."],
  ];

  const features = [
    ["Darbuotojų paieška", "Paieška pagal miestą, darbo sritį, datą, laiką, realų prieinamumą ir kelionės spindulį."],
    ["Konkretūs darbo kvietimai", "Darbuotojas prieš priimdamas mato darbo vietą, laiką, atlygį ir svarbiausias sąlygas."],
    ["El. pašto pranešimai", "Darbuotojai informuojami apie darbo pasiūlymus, kvietimus ir svarbius darbo veiksmus."],
    ["Patikimumas ir įvertinimai", "Business ir Pro planuose sprendimui padeda realių darbų istorija, atvykimai bei darbdavių vertinimai."],
    ["Favoritai", "Gerai pasirodžiusius darbuotojus išsisaugote ir kitą kartą randate greičiau."],
    ["Darbo pokalbiai", "Privatūs ir bendri darbo pokalbiai padeda su darbu susijusią komunikaciją laikyti vienoje vietoje."],
    ["Ilgalaikio įdarbinimo kryptis", "Po sėkmingo praktinio bendradarbiavimo galite darbuotojui pateikti ilgalaikio darbo pasiūlymą."],
    ["Komandos valdymas", "Business Pro leidžia iki 5 įmonės vartotojų, roles, atsakingo žmogaus paskyrimą, vadovų statistiką ir vidinį pokalbį."],
  ];

  const faqs = [
    ["Ar 30 dienų Business išbandymui reikia kortelės?", "Ne. Naujai užsiregistravusiai įmonei Business planas 30 dienų aktyvuojamas automatiškai, be kortelės ir be automatinio apmokestinimo. Privatiems darbdaviams šis išbandymas netaikomas."],
    ["Kas nutinka pasibaigus 30 dienų?", "Jei nepasirenkate mokamos prenumeratos, planas automatiškai grįžta į nemokamą Basic."],
    ["Ar sistema skirta tik vienos dienos darbams?", "Ne. Platforma tinka trumpalaikiam poreikiui, pakartotiniams darbams ir kaip praktinis kelias į ilgalaikį bendradarbiavimą."],
    ["Ar darbuotojams platforma mokama?", "Ne. Darbuotojams Statybos24.lt naudojimas nemokamas."],
    ["Ar Statybos24.lt moka darbuotojui atlyginimą?", "Ne. Platforma padeda surasti darbuotoją ir valdyti darbo eigą, o už sutartą apmokėjimą, teisėtą ir saugų darbo organizavimą atsako darbdavys."],
  ];

  return (
    <div className="bp-page">
      <style>{`
        .bp-page{min-height:100vh;background:#f4f6f8;color:#222631;font-family:Inter,Arial,sans-serif}
        .bp-page *{box-sizing:border-box}.bp-wrap{width:min(1180px,calc(100% - 36px));margin:0 auto}
        .bp-hero{position:relative;overflow:hidden;background:#222631;color:#fff;padding:30px 0 76px}
        .bp-hero:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 86% 12%,rgba(107,91,149,.2),transparent 31%),linear-gradient(120deg,rgba(107,91,149,.09),transparent 45%);pointer-events:none}
        .bp-hero-inner{position:relative}.bp-brand{display:inline-flex;background:#fff;border-radius:13px;padding:10px 14px}
        .bp-kicker,.bp-eyebrow{color:#6b5b95;font-size:11px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}.bp-kicker{margin-top:42px}
        .bp-hero h1{max-width:940px;margin:12px 0 18px;font-family:Manrope,Inter,sans-serif;font-size:clamp(38px,5.2vw,66px);line-height:1.04;letter-spacing:-.035em}
        .bp-hero-lead{max-width:830px;margin:0;color:#d6dfe6;font-size:18px;line-height:1.62}
        .bp-proof-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:32px}.bp-proof{padding:17px;border:1px solid rgba(255,255,255,.14);border-radius:15px;background:rgba(255,255,255,.04)}
        .bp-proof b{display:block;margin-bottom:5px;font-size:14px}.bp-proof span{color:#bdc9d2;font-size:12px;line-height:1.45}.bp-actions{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-top:28px}
        .bp-primary{border:0;border-radius:11px;background:#6b5b95;color:#fff;padding:13px 20px;font:inherit;font-weight:900;cursor:pointer;transition:transform .15s ease,box-shadow .15s ease}.bp-primary:hover{transform:translateY(-1px);box-shadow:0 9px 24px rgba(107,91,149,.24)}
        .bp-quiet{color:#aebcc7;font-size:12px}.bp-main{padding:58px 0 68px}.bp-section{margin-bottom:64px}
        .bp-head{display:grid;grid-template-columns:1.1fr .9fr;gap:34px;align-items:end;margin-bottom:24px}.bp-head h2{margin:8px 0 0;font:800 clamp(28px,3.4vw,41px)/1.12 Manrope,Inter,sans-serif;letter-spacing:-.025em}.bp-head p{margin:0;color:#61717f;font-size:14px;line-height:1.6}
        .bp-flow{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px}.bp-step{background:#fff;border:1px solid #dfe7ec;border-radius:17px;padding:21px;min-height:190px;box-shadow:0 7px 22px rgba(34,38,49,.04)}
        .bp-step-no{display:inline-flex;padding:8px 10px;border-radius:7px;background:#222631;color:#fff;font-size:11px;font-weight:900;letter-spacing:.06em}.bp-step h3{margin:17px 0 8px;font-size:18px;line-height:1.25}.bp-step p{margin:0;color:#637482;font-size:13px;line-height:1.55}
        .bp-real-flow{display:grid;gap:28px}.bp-real-row{display:grid;grid-template-columns:minmax(0,.78fr) minmax(0,1.42fr);gap:28px;align-items:center;padding:26px;border:1px solid #dfe7ec;border-radius:22px;background:#fff;box-shadow:0 12px 36px rgba(34,38,49,.05)}
        .bp-real-row.reverse{grid-template-columns:minmax(0,1.42fr) minmax(0,.78fr)}.bp-real-copy{padding:4px 4px}.bp-real-no{display:inline-flex;align-items:center;gap:8px;color:#483c67;font-size:11px;font-weight:900;letter-spacing:.09em;text-transform:uppercase}.bp-real-no:before{content:"";width:22px;height:2px;background:#6b5b95;border-radius:99px}
        .bp-real-copy h3{font:850 25px/1.2 Manrope,Inter,sans-serif;margin:11px 0 9px}.bp-real-copy p{margin:0;color:#607180;font-size:14px;line-height:1.67}.bp-real-points{list-style:none;margin:16px 0 0;padding:0;display:grid;gap:8px}.bp-real-points li{position:relative;padding-left:21px;color:#405264;font-size:12.5px;line-height:1.5}.bp-real-points li:before{content:"✓";position:absolute;left:0;color:#16845b;font-weight:900}
        .bp-screen{overflow:hidden;border:1px solid #d9e3e9;border-radius:16px;background:#eef3f6;box-shadow:0 18px 45px rgba(34,38,49,.11)}.bp-screen-bar{height:32px;display:flex;align-items:center;gap:6px;padding:0 11px;background:#eef3f6;border-bottom:1px solid #dae3e9}.bp-screen-bar span{width:8px;height:8px;border-radius:50%;background:#c8d3da}.bp-screen-bar b{margin-left:5px;color:#7c8994;font-size:9px;letter-spacing:.02em}.bp-screen-view{position:relative;overflow:hidden;background:#fff}.bp-screen-view img{display:block;width:100%;height:auto}
        .bp-screen.history .bp-screen-view{aspect-ratio:1153/214}.bp-screen.history .bp-screen-view img{position:absolute;left:0;top:0;width:100%;height:auto}.bp-screen.rating .bp-screen-view{aspect-ratio:1128/362}.bp-screen.rating .bp-screen-view img{width:100%;height:auto;transform:translateY(-48.65%)}.bp-screen.trial .bp-screen-view{aspect-ratio:1342/326}.bp-screen.trial .bp-screen-view img{width:100%;height:auto}.bp-screen.tools{max-width:520px;margin:0 auto}.bp-screen-caption{margin-top:9px;color:#7a8995;font-size:10.5px;text-align:center}
        .bp-trust{display:grid;grid-template-columns:1fr 1fr;gap:14px}.bp-card{background:#fff;border:1px solid #dfe7ec;border-radius:17px;padding:23px}.bp-card h3{margin:0 0 9px;font-size:20px}.bp-card p{margin:0;color:#627381;font-size:13px;line-height:1.62}
        .bp-feature-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.bp-feature{background:#fff;border:1px solid #dfe7ec;border-radius:15px;padding:18px;min-height:145px}.bp-feature b{display:block;margin-bottom:7px;font-size:15px}.bp-feature span{color:#637482;font-size:12px;line-height:1.5}
        .bp-stats-panel{padding:26px;border:1px solid #dfe7ec;border-radius:22px;background:#fff;box-shadow:0 12px 36px rgba(34,38,49,.05)}.bp-stats-copy{max-width:820px;margin-bottom:20px}.bp-stats-copy h3{margin:8px 0 8px;font:850 27px/1.2 Manrope,Inter,sans-serif}.bp-stats-copy p{margin:0;color:#607180;font-size:14px;line-height:1.65}.bp-screen.stats .bp-screen-view{aspect-ratio:1536/242}.bp-screen.stats .bp-screen-view img{width:100%;height:100%;object-fit:cover}
        .bp-tools-layout{display:grid;grid-template-columns:1fr .95fr;gap:22px;align-items:center;padding:26px;border-radius:22px;background:#222631;color:#fff}.bp-tools-layout h3{margin:7px 0 9px;font:850 28px/1.18 Manrope,Inter,sans-serif}.bp-tools-layout p{margin:0;color:#c7d2da;font-size:14px;line-height:1.65}.bp-tools-list{list-style:none;margin:17px 0 0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:9px 14px}.bp-tools-list li{position:relative;padding-left:20px;color:#d9e1e6;font-size:12px;line-height:1.45}.bp-tools-list li:before{content:"✓";position:absolute;left:0;color:#5fd3a4;font-weight:900}
        .bp-long{display:grid;grid-template-columns:1fr 1fr;gap:18px;padding:28px;border-radius:20px;background:#222631;color:#fff}.bp-long h3{margin:0;font-size:26px;line-height:1.2}.bp-long p{margin:0;color:#c7d2da;font-size:14px;line-height:1.65}
        .bp-plans{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px}.bp-plan{display:flex;flex-direction:column;background:#fff;border:1px solid #dfe6eb;border-radius:19px;padding:21px;min-height:405px}.bp-plan.featured{border:2px solid #6b5b95}.bp-plan.pro{background:#222631;color:#fff;border-color:#222631}
        .bp-plan-tag{color:#6b5b95;font-size:10px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}.bp-plan h3{margin:8px 0 4px;font-size:26px}.bp-price{font-size:31px;font-weight:900;margin:8px 0 12px}.bp-price small{font-size:12px;color:#7b8994}.bp-plan.pro .bp-price small{color:#a4b2bc}.bp-desc{min-height:58px;color:#647584;font-size:13px;line-height:1.5}.bp-plan.pro .bp-desc{color:#c6d1d8}
        .bp-plan ul{list-style:none;margin:14px 0 0;padding:0;display:grid;gap:8px}.bp-plan li{position:relative;padding-left:18px;color:#526472;font-size:12px;line-height:1.45}.bp-plan.pro li{color:#d7e0e6}.bp-plan li:before{content:"✓";position:absolute;left:0;color:#2aa576;font-weight:900}.bp-why{margin-top:auto;padding-top:15px;border-top:1px solid #e4eaee;color:#273a4b;font-size:12px;line-height:1.5}.bp-plan.pro .bp-why{border-color:rgba(255,255,255,.12);color:#d7e0e6}
        .bp-trial-demo{display:grid;grid-template-columns:.82fr 1.18fr;gap:25px;align-items:center;padding:28px;border:1px solid #c6bfdc;border-radius:22px;background:linear-gradient(120deg,#f3f1f9,#fff)}.bp-trial-demo h2{margin:7px 0 8px;font:850 31px/1.15 Manrope,Inter,sans-serif}.bp-trial-demo p{margin:0;color:#5e6e7b;font-size:14px;line-height:1.62}.bp-trial-demo .bp-primary{margin-top:18px}
        .bp-faq{display:grid;grid-template-columns:1fr 1fr;gap:12px}.bp-faq-item{background:#fff;border:1px solid #dfe7ec;border-radius:15px;padding:19px}.bp-faq-item b{display:block;margin-bottom:7px;font-size:14px}.bp-faq-item span{color:#627381;font-size:12.5px;line-height:1.55}.bp-faq-item:last-child:nth-child(odd){grid-column:1/-1}
        .bp-final{display:grid;grid-template-columns:1fr auto;gap:24px;align-items:center;padding:30px;border-radius:22px;background:#222631;color:#fff}.bp-final h2{margin:7px 0 8px;font:850 31px/1.15 Manrope,Inter,sans-serif}.bp-final p{margin:0;color:#c6d2da;font-size:14px;line-height:1.62;max-width:760px}
        .bp-footer{padding:22px 0 30px;border-top:1px solid #dfe6ea;color:#74828d;font-size:12px}.bp-footer-inner{display:flex;justify-content:space-between;gap:15px;flex-wrap:wrap}
        @media(max-width:960px){.bp-proof-grid,.bp-flow,.bp-feature-grid,.bp-plans{grid-template-columns:repeat(2,1fr)}.bp-head{grid-template-columns:1fr;gap:9px}.bp-plans .bp-plan:last-child{grid-column:1/-1}.bp-real-row,.bp-real-row.reverse,.bp-tools-layout,.bp-trial-demo{grid-template-columns:1fr}.bp-real-row.reverse .bp-real-copy{order:0}.bp-real-row.reverse .bp-screen-wrap{order:1}.bp-tools-layout .bp-screen{max-width:620px}}
        @media(max-width:650px){.bp-wrap{width:calc(100% - 24px)}.bp-hero{padding:20px 0 52px}.bp-kicker{margin-top:30px}.bp-hero h1{font-size:38px}.bp-hero-lead{font-size:16px}.bp-proof-grid,.bp-flow,.bp-feature-grid,.bp-plans,.bp-trust,.bp-long,.bp-faq{grid-template-columns:1fr}.bp-plans .bp-plan:last-child,.bp-faq-item:last-child:nth-child(odd){grid-column:auto}.bp-main{padding:42px 0 52px}.bp-section{margin-bottom:46px}.bp-step{min-height:0}.bp-real-row{padding:16px;gap:18px}.bp-real-copy h3{font-size:22px}.bp-stats-panel{padding:16px}.bp-stats-copy h3{font-size:22px}.bp-tools-layout{padding:20px}.bp-tools-list{grid-template-columns:1fr}.bp-trial-demo{padding:20px}.bp-final{grid-template-columns:1fr;padding:22px}.bp-primary{width:100%}.bp-screen-bar{height:28px}.bp-screen.history .bp-screen-view{aspect-ratio:1153/218}}
      `}</style>

      <header className="bp-hero">
        <div className="bp-wrap bp-hero-inner">
          <div className="bp-brand"><BrandImage height={44} /></div>
          <div className="bp-kicker">Pristatymas statybos įmonei</div>
          <h1>Raskite darbuotoją konkrečiam darbui ir spręskite pagal realią darbo istoriją.</h1>
          <p className="bp-hero-lead">
            <b>Statybos24.lt</b> – darbuotojų paieškos ir darbo valdymo platforma
            statybos įmonėms. Sukuriate konkretų poreikį, sistema padeda rasti tam
            laikui tinkamus žmones, išsiunčiate kvietimą, valdote darbo eigą ir po
            atlikto darbo kaupiate istoriją, kuri padeda priimti kitą sprendimą.
          </p>

          <div className="bp-proof-grid">
            <div className="bp-proof"><b>Ne vien skelbimas</b><span>Nuo darbo sukūrimo iki priėmimo, darbo dienos ir įvertinimo.</span></div>
            <div className="bp-proof"><b>Reali atranka</b><span>Prieinamumas, vieta, patirtis, atlikti darbai ir patikimumo rodikliai.</span></div>
            <div className="bp-proof"><b>Trumpam arba ilgam</b><span>Gerai pasirodžiusį žmogų išsisaugote, kviečiate vėl arba judate į ilgalaikį įdarbinimą.</span></div>
          </div>

          <div className="bp-actions">
            <button className="bp-primary" type="button" onClick={onSignup}>Registruotis darbdaviui</button>
            <span className="bp-quiet">Naujoms įmonėms – 30 dienų Business automatiškai, nemokamai ir be kortelės.</span>
          </div>
        </div>
      </header>

      <main className="bp-main">
        <div className="bp-wrap">
          <section className="bp-section">
            <div className="bp-head">
              <div><div className="bp-eyebrow">Visa eiga</div><h2>Nuo poreikio iki užbaigto darbo</h2></div>
              <p>Statybos24.lt sujungia darbuotojų paiešką, kvietimą ir darbo valdymą. Kiekvienas realus bendradarbiavimas palieka istoriją, kuri kitą kartą padeda spręsti greičiau.</p>
            </div>
            <div className="bp-flow">
              {steps.map(([no, title, stepText]) => (
                <article className="bp-step" key={no}>
                  <span className="bp-step-no">ŽINGSNIS {no}</span>
                  <h3>{title}</h3>
                  <p>{stepText}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="bp-section">
            <div className="bp-head">
              <div><div className="bp-eyebrow">Reali sistema</div><h2>Kaip tai atrodo darbdavio paskyroje</h2></div>
              <p>Žemiau – realūs Statybos24.lt ekranai. Ne maketai: tai ta pati darbo eiga, kuria naudojasi įmonė prisijungusi prie platformos.</p>
            </div>

            <div className="bp-real-flow">
              <article className="bp-real-row">
                <div className="bp-real-copy">
                  <span className="bp-real-no">01 · Darbo sukūrimas</span>
                  <h3>Sukuriate konkretų darbo poreikį</h3>
                  <p>Per kelias minutes suvedate tai, kas svarbiausia darbuotojui ir paieškai.</p>
                  <ul className="bp-real-points">
                    <li>Darbo pobūdis, vieta, data ir laikas</li>
                    <li>Reikalingų žmonių skaičius</li>
                    <li>Atlygis ir mokėjimo tipas</li>
                    <li>Atvykimas, pietų pertrauka ir darbo sąlygos</li>
                    <li>Sistema iškart parodo tinkamų darbuotojų signalą pagal vietą ir laiką</li>
                  </ul>
                </div>
                <div className="bp-screen-wrap">
                  <BusinessPresentationScreenshot src={BP_SCREEN_JOB_FORM} eager alt="Statybos24.lt naujo darbo pasiūlymo kūrimo forma" />
                  <div className="bp-screen-caption">Darbdavio darbo kūrimo ekranas</div>
                </div>
              </article>

              <article className="bp-real-row reverse">
                <div className="bp-screen-wrap">
                  <BusinessPresentationScreenshot src={BP_SCREEN_WORKER_MATCH} alt="Statybos24.lt tinkamų darbuotojų paieškos ir kvietimo ekranas" />
                  <div className="bp-screen-caption">Darbuotojų atranka ir kvietimas konkrečiam darbui</div>
                </div>
                <div className="bp-real-copy">
                  <span className="bp-real-no">02 · Atranka</span>
                  <h3>Matote, kas iš tikrųjų gali dirbti</h3>
                  <p>Sąraše pateikiami darbui tinkantys žmonės. Darbdavys pats nusprendžia, ką peržiūrėti ir kam siųsti kvietimą.</p>
                  <ul className="bp-real-points">
                    <li>Miestas ir atitikimas darbo vietai</li>
                    <li>Aktyvumas ir realus prieinamumas</li>
                    <li>Atliktų darbų istorija</li>
                    <li>Atvykimo patikimumas ir įvertinimai pagal plano teises</li>
                    <li>Vienu veiksmu atidarote profilį arba siunčiate kvietimą</li>
                  </ul>
                </div>
              </article>

              <article className="bp-real-row">
                <div className="bp-real-copy">
                  <span className="bp-real-no">03 · Užbaigtas darbas</span>
                  <h3>Darbas nedingsta – lieka istorijoje</h3>
                  <p>Pasibaigus darbui matote, kiek darbuotojų buvo priėmę pasiūlymą, darbo būseną ir galite grįžti prie darbo informacijos bei įvertinimų.</p>
                  <ul className="bp-real-points">
                    <li>Aiški užbaigto darbo būsena</li>
                    <li>Priimtų darbuotojų skaičius</li>
                    <li>Darbo informacija išlieka pasiekiama</li>
                    <li>Atskiras darbuotojų ir įvertinimų vaizdas</li>
                  </ul>
                </div>
                <div className="bp-screen-wrap">
                  <BusinessPresentationScreenshot src={BP_SCREEN_HISTORY} className="history" alt="Statybos24.lt užbaigtų darbų istorija" />
                  <div className="bp-screen-caption">Užbaigtų darbų istorija</div>
                </div>
              </article>

              <article className="bp-real-row reverse">
                <div className="bp-screen-wrap">
                  <BusinessPresentationScreenshot src={BP_SCREEN_RATING} className="rating" alt="Statybos24.lt užbaigto darbo darbuotojo patikimumo ir įvertinimo informacija" />
                  <div className="bp-screen-caption">Po darbo matomi realūs dalyvavimo ir vertinimo duomenys</div>
                </div>
                <div className="bp-real-copy">
                  <span className="bp-real-no">04 · Reputacija</span>
                  <h3>Sprendžiate pagal realų elgesį darbe</h3>
                  <p>Po darbo kaupiasi informacija, kuri tampa vertingesnė už vien pažadą ar CV. Gerai pasirodžiusį žmogų galite išsisaugoti favorituose.</p>
                  <ul className="bp-real-points">
                    <li>Atliktų darbų skaičius</li>
                    <li>Atvykimo patikimumas</li>
                    <li>Darbdavių įvertinimų vidurkis</li>
                    <li>Konkretaus darbo užbaigimas ir įvertinimas</li>
                    <li>Favoritai pakartotiniam kvietimui</li>
                  </ul>
                </div>
              </article>
            </div>
          </section>

          <section className="bp-section">
            <div className="bp-head">
              <div><div className="bp-eyebrow">Pasitikėjimo istorija</div><h2>Reputaciją kuria abi pusės</h2></div>
              <p>Darbo istorija nėra vien darbuotojo vertinimas. Įmonė taip pat kaupia savo patikimumo istoriją, kurią darbuotojas gali matyti prieš priimdamas pasiūlymą.</p>
            </div>
            <div className="bp-trust">
              <article className="bp-card">
                <h3>Darbuotojo reputacija</h3>
                <p>Užbaigti darbai, atvykimai, neatvykimai, ankstyvi išėjimai, darbdavių įvertinimai ir atsiliepimai kuria realią darbo istoriją. Patikimumo rodiklis yra atskiras nuo darbdavių balo ir gali keistis pagal patvirtintus darbo rezultatus.</p>
              </article>
              <article className="bp-card">
                <h3>Darbdavio reputacija</h3>
                <p>Patikimumą kaupia ir įmonė. Darbuotojai jį mato prieš priimdami kvietimą. Jei kyla ginčas, reputacija nėra mažinama vien pagal vienos pusės teiginį – ginčytiną situaciją galima perduoti administratoriui.</p>
              </article>
            </div>
          </section>

          <section className="bp-section">
            <div className="bp-head">
              <div><div className="bp-eyebrow">Kasdienis valdymas</div><h2>Ką galite valdyti vienoje vietoje</h2></div>
              <p>Nuo pirmo darbo pasiūlymo iki pakartotinio gero darbuotojo pasirinkimo ir komandos valdymo – svarbiausia eiga lieka vienoje sistemoje.</p>
            </div>
            <div className="bp-feature-grid">
              {features.map(([title, featureText]) => (
                <article className="bp-feature" key={title}><b>{title}</b><span>{featureText}</span></article>
              ))}
            </div>
          </section>

          <section className="bp-section">
            <div className="bp-stats-panel">
              <div className="bp-stats-copy">
                <div className="bp-eyebrow">Įmonės statistika</div>
                <h3>Sekate savo įmonės rezultatus vienoje vietoje</h3>
                <p>Business ir Business Pro planuose matote išplėstinę įmonės statistiką: kiek darbo pasiūlymų sukūrėte, kiek darbų užpildyta ar užbaigta, kiek darbuotojų panaudota, kiek žmonių įdarbinta ir kaip keičiasi įmonės patikimumas.</p>
              </div>
              <div className="bp-screen-wrap">
                <BusinessPresentationScreenshot src={BP_SCREEN_STATS} className="stats" alt="Statybos24.lt įmonės statistikos ekranas su darbo pasiūlymų, užbaigtų darbų, darbuotojų ir patikimumo rodikliais" />
                <div className="bp-screen-caption">Svarbiausi įmonės darbo ir darbuotojų paieškos rodikliai</div>
              </div>
            </div>
          </section>

          <section className="bp-section">
            <div className="bp-tools-layout">
              <div>
                <div className="bp-eyebrow">Business Pro</div>
                <h3>Kai darbuotojų paiešką valdo ne vienas žmogus</h3>
                <p>Pro plane atsiranda papildomi įrankiai komandai ir greitam poreikiui. Darbai, žmonės ir atsakomybės lieka aiškiai atskirti.</p>
                <ul className="bp-tools-list">
                  <li>Neriboti darbo pasiūlymai</li>
                  <li>Iki 5 įmonės vartotojų</li>
                  <li>Savininko, vadovo ir kitų rolių valdymas</li>
                  <li>„Mano darbai“ ir „Visi įmonės darbai“</li>
                  <li>Atsakingo žmogaus paskyrimas</li>
                  <li>Vadovų statistika</li>
                  <li>„Skubiai!“ laisvų darbuotojų kontaktai</li>
                  <li>Vidinis vadovų pokalbis</li>
                </ul>
              </div>
              <div className="bp-screen-wrap">
                <BusinessPresentationScreenshot src={BP_SCREEN_PRO_TOOLS} className="tools" alt="Statybos24.lt Business Pro papildomų valdymo funkcijų mygtukai" />
                <div className="bp-screen-caption" style={{ color: "#9fb0bc" }}>Papildomi darbdavio valdymo įrankiai</div>
              </div>
            </div>
          </section>

          <section className="bp-section">
            <div className="bp-long">
              <h3>Trumpalaikis darbas gali tapti praktišku būdu rasti žmogų ilgam.</h3>
              <p>Užuot sprendus vien iš CV ar pokalbio, galite žmogų pamatyti realiame objekte. Jei jis pasiteisina, išsaugote jį favorituose, kviečiate į kitus darbus ir bendradarbiavimą galite tęsti ilgalaikio įdarbinimo kryptimi.</p>
            </div>
          </section>

          <section className="bp-section">
            <div className="bp-head">
              <div><div className="bp-eyebrow">Planai įmonei</div><h2>Pradėkite nemokamai ir plėskite, kai reikia daugiau</h2></div>
              <p>Basic leidžia išbandyti pagrindinę paiešką. Business prideda daugiau darbo pasiūlymų, reputacijos informaciją ir valdymo funkcijas. Business Pro skirtas komandai.</p>
            </div>

            <div className="bp-plans">
              <article className="bp-plan">
                <span className="bp-plan-tag">Pradžia</span><h3>Basic</h3><div className="bp-price">0 € <small>/ mėn.</small></div>
                <div className="bp-desc">Pagrindinis būdas išbandyti darbuotojų paiešką be prenumeratos.</div>
                <ul><li>Iki 5 darbo pasiūlymų per mėnesį</li><li>Darbuotojų paieška ir kvietimai</li><li>1 įmonės vartotojas</li></ul>
                <div className="bp-why"><b>Kada rinktis:</b> kai poreikis retas arba norite pirmiausia susipažinti su sistema.</div>
              </article>

              <article className="bp-plan featured">
                <span className="bp-plan-tag">Rekomenduojamas</span><h3>Business</h3><div className="bp-price">29 € <small>/ mėn.</small></div>
                <div className="bp-desc">Reguliariai darbuotojų ieškančiai įmonei, kuri nori geriau atsirinkti ir kaupti patikrintų žmonių ratą.</div>
                <ul><li>Viskas, kas yra Basic plane</li><li>Iki 25 darbo pasiūlymų per mėnesį</li><li>Patikimumas ir įvertinimai</li><li>Favoritai</li><li>Privatūs ir bendri darbo pokalbiai</li><li>Išplėstinė įmonės statistika</li><li>1 įmonės vartotojas</li></ul>
                <div className="bp-why"><b>Naujoms įmonėms:</b> 30 dienų Business automatiškai, nemokamai, be kortelės ir be įsipareigojimo.</div>
              </article>

              <article className="bp-plan pro">
                <span className="bp-plan-tag">Komandai</span><h3>Business Pro</h3><div className="bp-price">59 € <small>/ mėn.</small></div>
                <div className="bp-desc">Kai darbuotojų paiešką ir objektus vienu metu valdo keli įmonės žmonės.</div>
                <ul><li>Viskas, kas yra Business plane</li><li>Neriboti darbo pasiūlymai</li><li>Iki 5 įmonės vartotojų ir rolės</li><li>„Mano darbai“ ir „Visi įmonės darbai“</li><li>Atsakingo žmogaus paskyrimas ir keitimas</li><li>Vadovų statistika</li><li>„Skubiai!“ laisvų darbuotojų kontaktai</li><li>Vidinis vadovų pokalbis</li></ul>
                <div className="bp-why"><b>Kada rinktis:</b> kai reikia ne tik paieškos, bet ir aiškaus komandinio valdymo.</div>
              </article>
            </div>

            <div style={{ marginTop: 14, color: "#607180", fontSize: 12, lineHeight: 1.55 }}>
              Business ir Business Pro galima rinktis mėnesiui arba metams. Metiniam atsiskaitymui taikoma <b>20 % nuolaida</b>.
            </div>
          </section>

          <section className="bp-section">
            <div className="bp-trial-demo">
              <div>
                <div className="bp-eyebrow">Išbandykite be rizikos</div>
                <h2>30 dienų Business nemokamai.</h2>
                <p>Naujai užsiregistravusiai įmonei Business planas aktyvuojamas automatiškai 30 dienų be kortelės ir be automatinio mokesčio. Per tą laiką galioja Business funkcijos. Jei po išbandymo nepasirenkate mokamos prenumeratos, paskyra automatiškai grįžta į Basic. Privatiems darbdaviams šis automatinis išbandymas netaikomas.</p>
                <button className="bp-primary" type="button" onClick={onSignup}>Registruotis darbdaviui</button>
              </div>
              <div className="bp-screen-wrap">
                <BusinessPresentationScreenshot src={BP_SCREEN_TRIAL} className="trial" alt="Statybos24.lt 30 dienų nemokamo Business išbandymo ekranas" />
                <div className="bp-screen-caption">Business bandomojo laikotarpio vaizdas įmonės paskyroje</div>
              </div>
            </div>
          </section>

          <section className="bp-section">
            <div className="bp-head">
              <div><div className="bp-eyebrow">Trumpai</div><h2>Dažniausi klausimai prieš išbandant</h2></div>
              <p>Svarbiausios sąlygos vienoje vietoje, kad prieš registraciją būtų aišku, ko tikėtis.</p>
            </div>
            <div className="bp-faq">
              {faqs.map(([question, answer]) => (
                <article className="bp-faq-item" key={question}><b>{question}</b><span>{answer}</span></article>
              ))}
            </div>
          </section>

          <section className="bp-final">
            <div>
              <div className="bp-eyebrow">Pabandykite savo realiame poreikyje</div>
              <h2>Sukurkite pirmą darbą ir įvertinkite sistemą praktiškai.</h2>
              <p>Registracija užtrunka kelias minutes. Pasirinkus darbdavio tipą „Įmonė“, 30 dienų Business išbandymas aktyvuojamas automatiškai be kortelės ir įsipareigojimo.</p>
            </div>
            <button className="bp-primary" type="button" onClick={onSignup}>Registruotis darbdaviui</button>
          </section>
        </div>
      </main>

      <footer className="bp-footer">
        <div className="bp-wrap bp-footer-inner"><span>© 2026 statybos24.lt</span><span>Kontaktas: info@statybos24.lt</span></div>
      </footer>
    </div>
  );
}
