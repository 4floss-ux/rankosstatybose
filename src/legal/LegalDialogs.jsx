import { useEffect } from "react";
import { PRIVACY_CONTACT_EMAIL, PRIVACY_VERSION, PUBLIC_BUSINESS_ACTIVITY, PUBLIC_BUSINESS_NAME, PUBLIC_BUSINESS_NUMBER, PUBLIC_CONTROLLER_FULL_NAME, TERMS_VERSION } from "../lib/config.js";
import { BrandLogo, CloseMark } from "../ui/brand.jsx";

export function PlatformTermsDialog({ open, onClose, page = false }) {
  if (!open && !page) return null;

  return (
    <div
      role={page ? undefined : "presentation"}
      onMouseDown={page ? undefined : (event) => { if (event.target === event.currentTarget) onClose(); }}
      style={page ? { width: "100%" } : { position: "fixed", inset: 0, zIndex: 1200, background: "rgba(34,38,49,.68)", display: "grid", placeItems: "center", padding: 16 }}
    >
      <section role={page ? undefined : "dialog"} aria-modal={page ? undefined : "true"} aria-labelledby="platform-terms-title" style={page ? { width: "100%", color: "#222631", lineHeight: 1.75 } : { width: "min(680px,100%)", maxHeight: "min(780px,calc(100dvh - 32px))", overflowY: "auto", background: "#fff", color: "#222631", borderRadius: 18, padding: "28px clamp(18px,4vw,36px)", boxShadow: "0 24px 80px #10243840", lineHeight: 1.6 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20 }}>
          <div><div className="eyebrow">STATYBOS24.LT</div>{page ? <h1 id="platform-terms-title" style={{ margin: "6px 0 22px", fontSize: "clamp(26px,4vw,34px)" }}>Naudojimosi sąlygos</h1> : <h2 id="platform-terms-title" style={{ margin: "6px 0 16px" }}>Naudojimosi sąlygos</h2>}</div>
          {!page && (<button type="button" aria-label="Uždaryti sąlygas" onClick={onClose} style={{ border: 0, background: "#f2f5f7", borderRadius: 9, width: 38, height: 38, cursor: "pointer", fontSize: 22 }}><CloseMark /></button>)}
        </div>
        <p><b>Paslaugos teikėjas.</b> <b>{PUBLIC_CONTROLLER_FULL_NAME}</b>, {PUBLIC_BUSINESS_ACTIVITY.toLowerCase()}, individualios veiklos Nr. <b>{PUBLIC_BUSINESS_NUMBER}</b>, veiklos pavadinimas <b>{PUBLIC_BUSINESS_NAME}</b>. Kontaktinis el. paštas: <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`} style={{ color: "#453a63" }}>{PRIVACY_CONTACT_EMAIL}</a>.</p>
        <p><b>Platformos vaidmuo.</b> statybos24.lt yra darbuotojų ir darbdavių suvedimo bei darbo organizavimo platforma. Padedame rasti vieniems kitus, perduoti darbo pasiūlymo informaciją, bendrauti ir fiksuoti darbo eigą. Vien naudojimasis platforma nepadaro statybos24.lt konkretaus darbo darbdaviu, rangovu ar darbo užmokesčio mokėtoju, o atlygio už paskelbtą darbą platforma nepriima ir neperveda.</p>
        <p><b>Darbdavio pareigos ir darbo reikalavimai.</b> Darbdavys atsako už savo paskelbtos informacijos tikslumą, sutarto atlygio sumokėjimą, teisėtą darbo organizavimą, saugias darbo sąlygas, privalomą instruktavimą ir konkrečiam darbui taikomų teisės aktų laikymąsi. Jei darbui reikalinga konkreti kvalifikacija, pažymėjimas, leidimas, dokumentai, speciali apranga, asmeninės apsaugos priemonės, įrankiai ar kiti reikalavimai, darbdavys turi juos aiškiai ir išsamiai nurodyti darbo aprašyme prieš siųsdamas kvietimus.</p>
        <p><b>Darbuotojo sprendimas.</b> Darbuotojas prieš priimdamas kvietimą turi įvertinti darbo vietą, laiką, atlygį, aprašymą ir visus nurodytus reikalavimus. Priimdamas darbą darbuotojas patvirtina, kad pateikta informacija jam suprantama ir jis pats sprendžia, ar pasiūlymas bei reikalavimai jam tinka. Darbuotojas atsako už savo pateiktą prieinamumą ir prisiimtų įsipareigojimų vykdymą.</p>
        <p><b>Paieška ir patikimumas.</b> Paieškoje vertinamas patvirtintas grafikas, aktyvumas, vieta, darbo laikas, esami įsipareigojimai ir paskyros apribojimai. Darbo dienos žymėjimai, įvertinimai ir ginčų eiga padeda susidaryti patikimumo vaizdą. Šie duomenys mažina neaiškumą, bet negarantuoja atvykimo, darbo kokybės ar apmokėjimo.</p>
        <p><b>Neatvykimas, nemokėjimas ir ginčai.</b> Jei darbuotojas neatvyksta arba darbdavys neatsiskaito, nukentėjusi šalis pirmiausia kreipiasi į kitą susitarimo šalį. Platformoje numatyti pranešimai, darbo dienos žymėjimai ir ginčo nagrinėjimas dėl platformos įrašų bei reputacijos. Toks nagrinėjimas savaime nepakeičia šalių susitarimo, neišieško atlygio ir nepanaikina jų teisės kreiptis į kompetentingas institucijas. Platforma neatsako už kitos šalies neįvykdytus įsipareigojimus tiek, kiek tai leidžia taikytina teisė; ji atsako už savo pačios pareigas pagal teisės aktus.</p>
        <p><b>Naudojimasis paskyra.</b> Vartotojai pateikia teisingus duomenis, laikosi teisės aktų ir nenaudoja platformos apgaulingiems ar neteisėtiems pasiūlymams. Už pažeidimus paskyra gali būti apribota; apie ginčų ir apribojimų priežastis pranešama platformos tvarka.</p>
        <p><b>Svarbūs darbo pranešimai.</b> Platforma paskyroje pateikia informaciją apie kvietimus, su darbais susijusias žinutes, patvirtinimus, atvykimą ir pasikeitimus. Registracijos metu prašome patvirtinti, kad suprantate šią būtiną paslaugos dalį. Pranešimams telefono ekrane reikalingas atskiras naršyklės arba įrenginio leidimas; registracijos varnelė jo nesuteikia.</p>
        <p><b>Įmonių Business išbandymas.</b> Naujas darbdavys, registracijos metu pasirinkęs tipą „Įmonė“, automatiškai gauna 30 dienų Business planą nemokamai, be mokėjimo kortelės ir be automatinio apmokestinimo. Privatiems darbdaviams automatinis Business išbandymas netaikomas. Pasibaigus 30 dienų laikotarpiui įmonės planas automatiškai tampa Basic, nebent iki tol pasirenkama mokama Business arba Business Pro prenumerata.</p>
        <p style={{ fontSize: 13, color: "#607180" }}>Sąlygų versija: {TERMS_VERSION}. Šios sąlygos apibūdina platformos ir naudotojų vaidmenis. Mokamo plano kaina bei funkcijos pateikiamos kainodaroje. Asmens duomenų tvarkymas turi būti atskirai aprašytas privatumo pranešime.</p>
        {!page && (<button type="button" onClick={onClose} style={{ border: 0, background: "#6b5b95", color: "#fff", borderRadius: 10, padding: "11px 18px", font: "inherit", fontWeight: 800, cursor: "pointer" }}>Uždaryti</button>)}
      </section>
    </div>
  );
}


export function PlatformBusinessDetailsDialog({ open, onClose, page = false }) {
  if (!open && !page) return null;

  return (
    <div
      role={page ? undefined : "presentation"}
      onMouseDown={page ? undefined : (event) => { if (event.target === event.currentTarget) onClose(); }}
      style={page ? { width: "100%" } : { position: "fixed", inset: 0, zIndex: 1220, background: "rgba(34,38,49,.68)", display: "grid", placeItems: "center", padding: 16 }}
    >
      <section role={page ? undefined : "dialog"} aria-modal={page ? undefined : "true"} aria-labelledby="platform-business-details-title" style={page ? { width: "100%", color: "#222631", lineHeight: 1.75 } : { width: "min(560px,100%)", maxHeight: "min(720px,calc(100dvh - 32px))", overflowY: "auto", background: "#fff", color: "#222631", borderRadius: 18, padding: "28px clamp(18px,4vw,34px)", boxShadow: "0 24px 80px #10243840", lineHeight: 1.6 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20 }}>
          <div><div className="eyebrow">STATYBOS24.LT</div>{page ? <h1 id="platform-business-details-title" style={{ margin: "6px 0 22px", fontSize: "clamp(26px,4vw,34px)" }}>Rekvizitai</h1> : <h2 id="platform-business-details-title" style={{ margin: "6px 0 16px" }}>Rekvizitai</h2>}</div>
          {!page && (<button type="button" aria-label="Uždaryti rekvizitus" onClick={onClose} style={{ border: 0, background: "#f2f5f7", borderRadius: 9, width: 38, height: 38, cursor: "pointer", fontSize: 22 }}><CloseMark /></button>)}
        </div>

        <div style={{ display: "grid", gap: 10, fontSize: 14 }}>
          <div><b>Individualios veiklos vykdytojas:</b> {PUBLIC_CONTROLLER_FULL_NAME}</div>
          <div><b>Veiklos forma:</b> {PUBLIC_BUSINESS_ACTIVITY}</div>
          <div><b>Individualios veiklos Nr.:</b> {PUBLIC_BUSINESS_NUMBER}</div>
          <div><b>Veiklos pavadinimas:</b> {PUBLIC_BUSINESS_NAME}</div>
          <div><b>El. paštas:</b> <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`} style={{ color: "#453a63", fontWeight: 800 }}>{PRIVACY_CONTACT_EMAIL}</a></div>
          <div><b>Svetainė:</b> <a href="https://statybos24.lt" style={{ color: "#453a63", fontWeight: 700 }}>statybos24.lt</a></div>
        </div>

        {!page && (<button type="button" onClick={onClose} style={{ marginTop: 20, border: 0, background: "#6b5b95", color: "#fff", borderRadius: 10, padding: "11px 18px", font: "inherit", fontWeight: 800, cursor: "pointer" }}>Uždaryti</button>)}
      </section>
    </div>
  );
}


export function PlatformPrivacyDialog({ open, onClose, page = false }) {
  if (!open && !page) return null;

  return (
    <div
      role={page ? undefined : "presentation"}
      onMouseDown={page ? undefined : (event) => { if (event.target === event.currentTarget) onClose(); }}
      style={page ? { width: "100%" } : { position: "fixed", inset: 0, zIndex: 1210, background: "rgba(34,38,49,.68)", display: "grid", placeItems: "center", padding: 16 }}
    >
      <section role={page ? undefined : "dialog"} aria-modal={page ? undefined : "true"} aria-labelledby="platform-privacy-title" style={page ? { width: "100%", color: "#222631", lineHeight: 1.75 } : { width: "min(760px,100%)", maxHeight: "min(820px,calc(100dvh - 32px))", overflowY: "auto", background: "#fff", color: "#222631", borderRadius: 18, padding: "28px clamp(18px,4vw,36px)", boxShadow: "0 24px 80px #10243840", lineHeight: 1.6 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20 }}>
          <div><div className="eyebrow">STATYBOS24.LT</div>{page ? <h1 id="platform-privacy-title" style={{ margin: "6px 0 22px", fontSize: "clamp(26px,4vw,34px)" }}>Privatumo politika</h1> : <h2 id="platform-privacy-title" style={{ margin: "6px 0 16px" }}>Privatumo politika</h2>}</div>
          {!page && (<button type="button" aria-label="Uždaryti privatumo politiką" onClick={onClose} style={{ border: 0, background: "#f2f5f7", borderRadius: 9, width: 38, height: 38, cursor: "pointer", fontSize: 22 }}><CloseMark /></button>)}
        </div>

        <p><b>Duomenų valdytojas.</b> <b>{PUBLIC_CONTROLLER_FULL_NAME}</b>, {PUBLIC_BUSINESS_ACTIVITY.toLowerCase()}, individualios veiklos Nr. <b>{PUBLIC_BUSINESS_NUMBER}</b>, veiklos pavadinimas <b>{PUBLIC_BUSINESS_NAME}</b>. Kontaktai privatumo klausimais: <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`} style={{ color: "#453a63" }}>{PRIVACY_CONTACT_EMAIL}</a>. Svetainė: <a href="https://statybos24.lt" style={{ color: "#453a63" }}>statybos24.lt</a>.</p>

        <p><b>Kokius duomenis tvarkome.</b> Priklausomai nuo naudojimosi platforma, tvarkome paskyros ir kontaktinius duomenis (pvz., vardą, el. paštą, telefono numerį, miestą), darbuotojo gimimo datą (saugoma privačiai, darbdaviams nerodoma), darbuotojo profesinę informaciją ir įgūdžius, prieinamumo grafiką bei aktyvumo būseną, darbdavio ir įmonės duomenis, darbų skelbimų informaciją, kvietimus, rezervacijas, atvykimo ir darbo dienos užbaigimo įrašus, reitingus, patikimumo rodiklius, favoritus, ginčų informaciją, darbo ir komandos pokalbių turinį bei techninius ir saugumo įrašus.</p>

        <p><b>Mokėjimų duomenys.</b> Mokamų darbdavio planų atsiskaitymui naudojamas Stripe. statybos24.lt sistemoje saugomi tik mokėjimo administravimui reikalingi Stripe identifikatoriai, prenumeratos būsena, planas, atsiskaitymo laikotarpis, sąskaitos identifikatorius ir mokėjimo laikas, kai ši informacija gaunama iš Stripe. Pilnų mokėjimo kortelės duomenų statybos24.lt nekaupia ir jie įvedami Stripe valdomame Checkout lange.</p>

        <p><b>Kam naudojame duomenis.</b> Duomenys reikalingi paskyrai sukurti ir administruoti, darbuotojų bei darbų paieškai ir suderinimui, kvietimams ir rezervacijoms, darbo dienos eigai ir atvykimui fiksuoti, bendravimui, reitingams ir patikimumo istorijai, ginčų nagrinėjimui, mokamų planų administravimui, platformos saugumui, piktnaudžiavimo prevencijai, techniniam veikimui ir teisinių pareigų vykdymui.</p>

        <p><b>Tvarkymo pagrindai.</b> Duomenis tvarkome tiek, kiek tai būtina paslaugai suteikti ir sutartiniams veiksmams atlikti, teisėtiems platformos bei jos naudotojų interesams užtikrinti (pvz., saugumui, sukčiavimo ir piktnaudžiavimo prevencijai, ginčų ir patikimumo istorijai), taip pat kai tvarkyti duomenis reikalauja teisės aktai. Jei konkrečiai funkcijai būtų reikalingas sutikimas, jis būtų prašomas atskirai ir galėtų būti atšauktas.</p>

        <p><b>Kam duomenys gali būti perduodami.</b> Duomenis gali tvarkyti platformos techninių paslaugų teikėjai, kurių paslaugos būtinos sistemai veikti, įskaitant Supabase (duomenų bazė, autentifikacija ir serverio funkcijos), Cloudflare (svetainės pateikimas, infrastruktūra ir apsauga nuo automatinių užklausų), Bird (telefono patvirtinimo SMS siuntimas) ir Stripe (mokėjimai bei prenumeratos). Darbo proceso duomenys taip pat gali būti matomi kitai konkretaus darbo šaliai tiek, kiek to reikia darbo kvietimui, rezervacijai, atvykimui, bendravimui, ginčui ar darbo užbaigimui.</p>

        <p><b>Apsauga nuo automatinių užklausų.</b> Registracijos ir SMS užklausų apsaugai naudojama Cloudflare Turnstile patikra, kuri gali veikti nematomai naršyklėje. Daugiau informacijos pateikiama <a href="https://www.cloudflare.com/turnstile-privacy-policy/" target="_blank" rel="noopener noreferrer">Cloudflare Turnstile privatumo pranešime</a>.</p>

        <p><b>Duomenų saugojimas.</b> Duomenys saugomi ne ilgiau, nei būtina tikslams, kuriems jie surinkti, paskyros ir paslaugos veikimui, ginčams ar teisiniams reikalavimams administruoti bei teisės aktuose nustatytoms pareigoms vykdyti. Konkretus terminas priklauso nuo duomenų kategorijos, paskyros būsenos ir galimų teisinių saugojimo pareigų. Kai duomenų nebereikia ir nėra teisinio pagrindo jų saugoti, jie ištrinami arba anonimizuojami.</p>

        <section aria-labelledby="business-marketing-privacy" style={{ margin: "28px 0", paddingTop: 20, borderTop: "1px solid #dfe7ed" }}>
          <h2 id="business-marketing-privacy" style={{ margin: "0 0 16px", fontSize: "clamp(20px,3vw,24px)", lineHeight: 1.35 }}>Įmonių kontaktinių duomenų rinkimas ir tiesioginė rinkodara</h2>
          <p><b>Tikslas.</b> Statybos24.lt siekia informuoti statybos, remonto, renovacijos, montavimo, projektavimo, inžinerijos ir kitas su statybų sektoriumi susijusias paslaugas teikiančias įmones apie platformos galimybes, bendradarbiavimą ir siūlomas paslaugas. Šiuo tikslu galime siųsti aktualius komercinius pasiūlymus juridiniams asmenims jų viešai nurodytais verslo kontaktiniais el. pašto adresais, laikydamiesi toliau nurodytų sąlygų.</p>
          <p><b>Duomenų šaltiniai.</b> Įmonių kontaktinius duomenis galime rinkti iš viešai prieinamų šaltinių: oficialių įmonių interneto svetainių, viešų įmonių katalogų, registrų, paieškos sistemų ir kitų teisėtai prieinamų verslo informacijos šaltinių.</p>
          <p><b>Tvarkomi duomenys.</b> Galime tvarkyti įmonės pavadinimą, juridinio asmens kodą, veiklos sritį, interneto svetainės adresą, viešą kontaktinį el. pašto adresą, duomenų šaltinį, kontaktavimo datą, išsiųstų pranešimų istoriją ir atsisakymo gauti pasiūlymus informaciją.</p>
          <p><b>Teisinis pagrindas.</b> Tiesioginė rinkodara juridiniams asmenims vykdoma vadovaujantis Lietuvos Respublikos elektroninių ryšių įstatymo 81 straipsniu. Kai abonentas ar registruotasis elektroninių ryšių paslaugų gavėjas yra juridinis asmuo, išankstinio sutikimo nereikia, tačiau turi būti užtikrinta aiški, nemokama ir lengvai įgyvendinama galimybė atsisakyti tolesnės rinkodaros. Kai tvarkomi asmens duomenys, taikomos Bendrojo duomenų apsaugos reglamento nuostatos, įskaitant 6 straipsnio 1 dalies f punkte numatytą teisėto intereso pagrindą, kai jis taikytinas įvertinus duomenų subjektų teises ir interesus. Prieš remiantis teisėtu interesu atliekamas ir dokumentuojamas interesų pusiausvyros vertinimas. Vien tai, kad kontaktas paskelbtas viešai, savaime nepanaikina kitų teisinių reikalavimų.</p>
          <p><b>Automatizuota kontaktų paieška.</b> Įmonių paieškai, veiklos atitikčiai ir kontaktų patikrai gali būti naudojamos automatizuotos programinės priemonės, įskaitant dirbtinio intelekto technologijas. Šios priemonės padeda nustatyti įmonės veiklos pobūdį, patikrinti viešus kontaktus ir išvengti pasikartojančių pranešimų. Jos nenaudojamos sprendimams, sukeliantiems fiziniams asmenims teisines ar panašiai reikšmingas pasekmes.</p>
          <p><b>Duomenų gavėjai.</b> Kontaktinius duomenis gali tvarkyti mūsų naudojami techninės infrastruktūros, duomenų saugojimo, paieškos ir elektroninio pašto paslaugų teikėjai tiek, kiek būtina šioms paslaugoms vykdyti ir laikantis taikomų duomenų apsaugos reikalavimų.</p>
          <p><b>Galimybė atsisakyti.</b> Kiekviename rinkodaros el. laiške pateikiama aiški ir nemokama galimybė atsisakyti tolesnių pasiūlymų, pasinaudojant laiške esančia nuoroda „Atsisakyti“ arba parašant el. paštu <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`} style={{ color: "#453a63" }}>{PRIVACY_CONTACT_EMAIL}</a>. Gavus atsisakymą, tolesnis rinkodaros pranešimų siuntimas atitinkamu kontaktu nutraukiamas nepagrįstai nedelsiant. Saugojame minimalų atsisakymo faktą, kad kontaktas nebūtų įtrauktas iš naujo.</p>
          <p><b>Duomenų saugojimas.</b> Verslo kontaktiniai duomenys saugomi tik tiek, kiek būtina įmonių informavimo, komunikacijos administravimo ir teisėtų interesų užtikrinimo tikslams. Neaktualūs ar netinkami kontaktai šalinami. Atsisakymo gauti rinkodaros pranešimus faktas ir minimalūs tam reikalingi duomenys gali būti saugomi ilgiau, siekiant užtikrinti, kad pasiūlymai nebūtų siunčiami pakartotinai.</p>
          <p><b>Duomenų subjektų teisės.</b> Kai tvarkomi asmens duomenys, asmenys turi teisę susipažinti su savo duomenimis, prašyti juos ištaisyti ar ištrinti, apriboti tvarkymą ir nesutikti su duomenų naudojimu tiesioginės rinkodaros tikslais. Prašymus galima teikti el. paštu <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`} style={{ color: "#453a63" }}>{PRIVACY_CONTACT_EMAIL}</a>. Taip pat galima pateikti skundą Valstybinei duomenų apsaugos inspekcijai.</p>
        </section>


        <p><b>Automatinis vertinimas ir paieška.</b> Platformoje darbuotojų paieška ir kai kurie patikimumo rodikliai gali būti apskaičiuojami pagal tokius duomenis kaip patvirtintas prieinamumas, aktyvumas, vieta, darbo laikas, ankstesni atvykimo ir darbo dienos rezultatai, reitingai ir paskyros apribojimai. Šie rodikliai padeda organizuoti paiešką ir pateikti informaciją naudotojams; ginčijamas darbo dienos rezultatas turi atskirą ginčo procesą ir gali būti peržiūrėtas administratoriaus.</p>

        <p><b>Jūsų teisės.</b> Pagal taikytinus duomenų apsaugos teisės aktus galite prašyti susipažinti su savo duomenimis, juos ištaisyti, tam tikrais atvejais ištrinti ar apriboti jų tvarkymą, gauti perduodamus duomenis, nesutikti su tam tikru tvarkymu ir, kai tvarkymas grindžiamas sutikimu, jį atšaukti. Taip pat turite teisę pateikti skundą kompetentingai duomenų apsaugos priežiūros institucijai.</p>

        <p><b>Paskyros ištrynimas.</b> Prašant ištrinti paskyrą gali būti pašalinti su ja susiję platformos duomenys, išskyrus informaciją, kurią būtina toliau saugoti dėl teisinių pareigų, teisinių reikalavimų, saugumo, sukčiavimo prevencijos ar jau įvykusių sandorių ir ginčų dokumentavimo.</p>

        <p><b>Pranešimai apie darbą.</b> Prisijungus platformoje pateikiami su paskyra ir darbo organizavimu susiję pranešimai. Registracijos metu išsaugome patvirtinimo, kad perskaitėte šią informaciją, laiką. Telefono „Web Push“ pranešimai veikia tik naršyklei arba įrenginiui suteikus leidimą. Juos galite išjungti įrenginio ar naršyklės nustatymuose. Registracijos patvirtinimas nereiškia, kad suteiktas telefono leidimas.</p>
        <p><b>Slapukai ir techninė saugykla.</b> Platforma gali naudoti techniškai būtinus autentifikavimo, sesijos ir saugumo identifikatorius, kad vartotojas galėtų prisijungti ir naudotis sistema. Atskiros reklaminės ar rinkodaros sekimo priemonės šiame privatumo pranešime nenumatytos; jei jos būtų įdiegtos, informacija ir pasirinkimai būtų pateikti atskirai.</p>

        <p style={{ fontSize: 13, color: "#607180" }}>Privatumo politikos versija: {PRIVACY_VERSION}. Šis tekstas yra parengtas pagal dabartines statybos24.lt funkcijas.</p>

        {!page && (<button type="button" onClick={onClose} style={{ border: 0, background: "#6b5b95", color: "#fff", borderRadius: 10, padding: "11px 18px", font: "inherit", fontWeight: 800, cursor: "pointer" }}>Uždaryti</button>)}
      </section>
    </div>
  );
}


// Public legal documents are real URLs rather than pop-up dialogs.
// Content is shared with the original dialogs so their legal wording stays unchanged.
export function PlatformLegalDocumentPage({ kind }) {
  const titles = {
    terms: "Naudojimosi sąlygos",
    privacy: "Privatumo politika",
    business: "Rekvizitai",
  };
  const title = titles[kind] || "Teisinė informacija";
  useEffect(() => {
    const previous = document.title;
    document.title = `${title} – Statybos24.lt`;
    return () => { document.title = previous; };
  }, [title]);

  const destinations = [
    ["/naudojimosi-salygos", titles.terms],
    ["/privatumo-politika", titles.privacy],
    ["/rekvizitai", titles.business],
  ];
  const current = kind === "terms" ? destinations[0][0] : kind === "privacy" ? destinations[1][0] : destinations[2][0];
  return (
    <div className="s24-legal-page">
      <style>{`
        .s24-legal-page { --legal-navy:#222631; --legal-orange:#6b5b95; --legal-dark-orange:#584a7e; --legal-muted:#607180; --legal-line:#e2e9ee; min-height:100dvh; display:flex; flex-direction:column; background:linear-gradient(125deg,#f4f8fb 0%,#fff 64%); color:var(--legal-navy); font-family:Inter,system-ui,sans-serif; line-height:1.5; }
        .s24-legal-page *, .s24-legal-page *::before, .s24-legal-page *::after { box-sizing:border-box; }
        .s24-legal-wrap { width:min(1120px,calc(100% - 40px)); margin-inline:auto; }
        .s24-legal-header { position:sticky; top:0; z-index:20; background:rgba(255,255,255,.96); backdrop-filter:blur(12px); border-bottom:1px solid rgba(226,233,238,.92); }
        .s24-legal-header-inner { min-height:72px; display:flex; align-items:center; gap:28px; }
        .s24-legal-brand { display:inline-flex; flex:0 0 auto; align-items:center; color:var(--legal-navy); font:900 18px Manrope,Inter,sans-serif; text-decoration:none; white-space:nowrap; }
        .s24-legal-brand img { max-width:100%; }
        .s24-legal-header-links { display:flex; align-items:center; gap:24px; margin-left:18px; }
        .s24-legal-header-links a { color:#526374; text-decoration:none; font-size:12px; font-weight:800; white-space:nowrap; }
        .s24-legal-header-links a:hover { color:var(--legal-dark-orange); }
        .s24-legal-btn { display:inline-flex; align-items:center; justify-content:center; gap:9px; min-height:46px; border:1px solid var(--legal-orange); border-radius:11px; padding:12px 18px; background:var(--legal-orange); color:#fff !important; font:inherit; font-size:13px; font-weight:850; text-decoration:none !important; text-align:center; cursor:pointer; transition:transform .18s ease,box-shadow .18s ease,background-color .18s ease; }
        .s24-legal-btn:hover { background:var(--legal-dark-orange); transform:translateY(-1px); box-shadow:0 8px 22px rgba(107,91,149,.2); }
        .s24-legal-header-inner > .s24-legal-btn { margin-left:auto; white-space:nowrap; }
        .s24-legal-main { flex:1; padding-block:62px 80px; }
        .s24-legal-card { width:100%; margin:0; padding:clamp(24px,3.8vw,52px); background:#fff; border:1px solid var(--legal-line); border-radius:18px; box-shadow:0 18px 55px rgba(34,38,49,.06); }
        .s24-legal-card .eyebrow { display:inline-flex; align-items:center; gap:8px; color:#453a63; font-size:11px; font-weight:900; letter-spacing:.12em; text-transform:uppercase; }
        .s24-legal-card .eyebrow::before { content:""; display:inline-block; width:24px; height:2px; border-radius:999px; background:var(--legal-orange); }
        .s24-legal-card h1 { color:var(--legal-navy); font-family:Manrope,Inter,system-ui,sans-serif; font-weight:900; letter-spacing:-.035em; }
        .s24-legal-card p { max-width:95ch; margin:0 0 18px; color:#405264; font-size:16px; line-height:1.7; text-align:left; }
        .s24-legal-card p b, .s24-legal-card p strong { color:var(--legal-navy); }
        .s24-legal-card a { overflow-wrap:anywhere; }
        .s24-legal-card [id] { scroll-margin-top:110px; }
        .s24-legal-footer { background:#222631; color:#9cb0bf; padding:25px 0; }
        .s24-legal-footer-inner { display:flex; align-items:center; justify-content:space-between; gap:18px; flex-wrap:wrap; font-size:12px; }
        .s24-legal-footer nav { display:flex; align-items:center; gap:12px 22px; flex-wrap:wrap; }
        .s24-legal-footer a { color:#d3dee6; text-decoration:underline; text-underline-offset:3px; }
        .s24-legal-footer a[aria-current="page"] { color:#fff; font-weight:800; }
        .s24-legal-page a:focus-visible { outline:3px solid var(--legal-orange); outline-offset:3px; }
        @media(max-width:900px) { .s24-legal-header-links { display:none; } .s24-legal-main { padding-block:40px 60px; } }
        @media(max-width:600px) { .s24-legal-wrap { width:calc(100% - 28px); } .s24-legal-header-inner { min-height:68px; gap:10px; } .s24-legal-brand { min-width:0; flex:0 1 auto; } .s24-legal-brand img { max-width:min(176px,100%); max-height:43px; } .s24-legal-header .s24-legal-btn { min-height:40px; padding:8px 11px; font-size:11px; } .s24-legal-main { padding-block:26px 46px; } .s24-legal-card { border-radius:14px; padding:23px 18px; } .s24-legal-card p { font-size:14px; line-height:1.7; } .s24-legal-card h1 { line-height:1.2; } .s24-legal-footer-inner { flex-direction:column; align-items:flex-start; } }
        @media(prefers-reduced-motion:reduce) { .s24-legal-page a { transition:none; } }
      `}</style>
      <a className="home-skip-link" href="#s24-legal-content" style={{ position: "absolute", left: -9999, top: 0 }}>Pereiti prie dokumento</a>
      <header className="s24-legal-header">
        <div className="s24-legal-wrap s24-legal-header-inner">
          <BrandLogo className="s24-legal-brand" href="/" height={60} alt="Statybos24.lt – pagrindinis puslapis" />
          <nav className="s24-legal-header-links" aria-label="Pagrindinė navigacija">
            <a href="/#paslaugos">Paslaugos</a>
            <a href="/#kam-skirta">Kam skirta</a>
            <a href="/#planai">Planai</a>
          </nav>
          <a className="s24-legal-btn" href="/">← Grįžti į pradžią</a>
        </div>
      </header>
      <main id="s24-legal-content" className="s24-legal-wrap s24-legal-main">

        <article className="s24-legal-card">
          {kind === "terms" ? <PlatformTermsDialog open page /> :
           kind === "privacy" ? <PlatformPrivacyDialog open page /> :
           <PlatformBusinessDetailsDialog open page />}
        </article>
      </main>
      <footer className="s24-legal-footer">
        <div className="s24-legal-wrap s24-legal-footer-inner">
          <nav aria-label="Teisinė informacija">
            {destinations.map(([href, label]) => (
              <a key={href} href={href} aria-current={current === href ? "page" : undefined}>{label}</a>
            ))}
          </nav>
          <span>© 2026 statybos24.lt</span>
        </div>
      </footer>
    </div>
  );
}
