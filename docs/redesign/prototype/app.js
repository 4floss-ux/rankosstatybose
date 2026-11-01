"use strict";
const LP_MINI = window.name === "lpmini";
const LP_SRC = LP_MINI ? "" : "<!doctype html>" + document.documentElement.outerHTML;
/* ---------- Pagalbinės funkcijos ---------- */
const I = {
  overview:'<path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/>',
  mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  jobs:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>',
  history:'<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/>',
  cal:'<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
  chat:'<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  star:'<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9Z"/>',
  bolt:'<path d="M13 2 4 14h7l-1 8 9-12h-7Z"/>',
  team:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7"/><path d="M18 14a6 6 0 0 1 3.5 6"/>',
  pie:'<path d="M21 12a9 9 0 1 1-9-9v9Z"/><path d="M15 3.5A9 9 0 0 1 20.5 9H15Z"/>',
  card:'<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
  home:'<path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/>',
  out:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  more:'<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
  plus:'<path d="M12 5v14"/><path d="M5 12h14"/>',
  nav:'<path d="M3 11 22 2l-9 19-2-8-8-2z"/>',
  heart:'<path d="M12 20.5s-7.5-4.6-7.5-10.4A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 2.7c0 5.8-7.5 10.4-7.5 10.4z"/>',
  lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  eye:'<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  mark:'<path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4"/><path d="m9.5 14.5 5-5M13 9h1.5v1.5"/>',
  check:'<path d="m5 12 5 5 9-10"/>',
  x:'<path d="M6 6l12 12"/><path d="M18 6 6 18"/>',
  left:'<path d="m11 17-5-5 5-5"/><path d="m18 17-5-5 5-5"/>',
  right:'<path d="m6 17 5-5-5-5"/><path d="m13 17 5-5-5-5"/>',
  back:'<path d="m15 18-6-6 6-6"/>',
  pin:'<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  euro:'<path d="M17 6.5A7 7 0 1 0 17 17.5"/><path d="M4 10h9"/><path d="M4 14h9"/>',
  people:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2a5 5 0 0 1 5.5 5.8"/>',
  shield:'<path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6Z"/><path d="m9 12 2 2 4-4"/>',
  phone:'<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>',
  file:'<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z"/><path d="M14 3v6h6"/>',
  upload:'<path d="M12 15V3"/><path d="m7 8 5-5 5 5"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>',
  edit:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  send:'<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  car:'<path d="M5 17h14v-5l-2-5H7l-2 5Z"/><circle cx="8" cy="17" r="2"/><circle cx="16" cy="17" r="2"/>',
  briefcase:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>',
  bell:'<path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 21a2 2 0 0 0 4 0"/>',
  camera:'<path d="M4 8h3l2-3h6l2 3h3v11H4Z"/><circle cx="12" cy="13" r="3.5"/>',
  clip:'<path d="m21 12-8.5 8.5a5 5 0 0 1-7-7L14 5a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L15 8"/>',
  download:'<path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/>',
  sign:'<path d="M3 21h18"/><path d="m14 4 6 6-9 9H5v-6Z"/>'
};
const svg = (k, s = 20, w = 2) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[k] || ""}</svg>`;
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const up = (t) => String(t || "").toLocaleUpperCase("lt-LT");
const ini = (n) => String(n).replace(/\(.*?\)/g, "").replace(/,.*$/, "").trim().split(/\s+/).map((p) => p[0] || "").join("").slice(0, 2).toLocaleUpperCase("lt-LT");

const TODAY = new Date(); TODAY.setHours(12, 0, 0, 0);
const dOff = (n) => { const d = new Date(TODAY); d.setDate(d.getDate() + n); return d; };
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const WD = ["Sekmadienis", "Pirmadienis", "Antradienis", "Trečiadienis", "Ketvirtadienis", "Penktadienis", "Šeštadienis"];
const WDS = ["Sk", "Pr", "An", "Tr", "Kt", "Pn", "Št"];
const MON = ["Sausis", "Vasaris", "Kovas", "Balandis", "Gegužė", "Birželis", "Liepa", "Rugpjūtis", "Rugsėjis", "Spalis", "Lapkritis", "Gruodis"];
const MON_S = ["Sau", "Vas", "Kov", "Bal", "Geg", "Bir", "Lie", "Rgp", "Rgs", "Spa", "Lap", "Grd"];
const rel = (n) => n === 0 ? "Šiandien" : n === 1 ? "Rytoj" : n === -1 ? "Vakar" : WD[dOff(n).getDay()];
const dateLabel = (n) => `${iso(dOff(n))} · ${rel(n)}`;
const timeOpts = (v) => { let o = ""; for (let h = 0; h < 24; h++) for (const mm of ["00", "30"]) { const t = `${String(h).padStart(2, "0")}:${mm}`; o += `<option${t === v ? " selected" : ""}>${t}</option>`; } if (v && !o.includes(`>${v}<`)) o = `<option selected>${v}</option>` + o; return o; };
const pay = (a, u) => u === "day" ? `${a} € į rankas / dieną` : `${a} € į rankas / val.`;

/* ---------- Pavyzdiniai duomenys ---------- */
const WORKERS = {
  w1: { id: "w1", name: "Tomas K.", city: "Vilnius", km: 4.2, skills: ["Betonavimo pagalba", "Medžiagų nešiojimas", "Tvarkymas"], att: 97, rating: 9.3, rc: 14, jobs: 22, b: true, exp: "5 metai statybų pagalbiniu darbuotoju, dirbau su betonavimu ir mūro darbais.", active: "Aktyvus prieš 2 val.", phone: "+370 612 40011", freeNow: true },
  w2: { id: "w2", name: "Mantas P.", city: "Vilnius", km: 7.8, skills: ["Medžiagų nešiojimas", "Tvarkymas"], att: 100, rating: 9.6, rc: 9, jobs: 11, b: true, exp: "3 metai krovos ir tvarkymo darbuose objektuose.", active: "Aktyvus prieš 20 min.", phone: "+370 612 40022", freeNow: false },
  w3: { id: "w3", name: "Darius S.", city: "Vilnius", km: 11.5, skills: ["Betonavimo pagalba", "Krovos darbai"], att: 94, rating: 8.8, rc: 6, jobs: 8, b: false, exp: "2 metai betonavimo pagalbos, turiu darbo avalynę.", active: "Aktyvus prieš 5 val.", phone: "+370 612 40033", freeNow: true },
  w4: { id: "w4", name: "Rytis K.", city: "Vilnius", km: 3.1, skills: ["Tvarkymas", "Statybvietės pagalba"], att: 92, rating: 9.0, rc: 12, jobs: 17, b: true, exp: "4 metai statybvietės pagalbos, ardymo ir tvarkymo darbai.", active: "Aktyvus prieš 1 val.", phone: "+370 612 40044", freeNow: false },
  w5: { id: "w5", name: "Andrius P.", city: "Vilnius", km: 9.0, skills: ["Medžiagų nešiojimas", "Tvarkymas"], att: 98, rating: 9.1, rc: 7, jobs: 9, b: true, exp: "Dirbau sandėlyje ir statybose pagalbiniu.", active: "Aktyvus prieš 3 val.", phone: "+370 612 40055", freeNow: false },
  w6: { id: "w6", name: "Lukas J.", city: "Vilnius", km: 6.4, skills: ["Mūro pagalba", "Medžiagų nešiojimas"], att: 100, rating: null, rc: 0, jobs: 1, b: false, exp: "Neturiu didelės patirties, noriu dirbti statybose.", active: "Aktyvus prieš 40 min.", phone: "+370 612 40066", freeNow: true },
  w7: { id: "w7", name: "Gintaras V.", city: "Vilnius", km: 14.0, skills: ["Betonavimo pagalba", "Mūro pagalba"], att: 96, rating: 9.2, rc: 10, jobs: 15, b: true, exp: "7 metai statybose, galiu dirbti ir savaitgaliais.", active: "Aktyvus prieš 6 val.", phone: "+370 612 40077", freeNow: true }
};

function freshState() {
  return {
    screen: "public", role: "worker", view: "overview", modal: null, chatId: null, free: false, statsOpen: false,
    scheduleConfirmed: true, payUnit: "hour", jobScope: "mine", calDay: iso(TODAY), urgentCity: "Vilnius", urgentShown: true, planPeriod: "month",
    worker: {
      invites: [
        { id: "i1", title: "Pagalbiniai statybos darbai", company: "UAB Statybų partneris", d: 2, from: "08:00", to: "17:00", city: "Vilnius", addr: "Ozo g. 25, Vilnius", pay: 14, unit: "hour", status: "pending", until: "rytoj 10:00", km: 8, min: 18, lunch: "12:00–12:30", arrival: "Darbuotojas atvyksta pats", phone: "+370 600 11223", rel: 98, desc: "Pagalbiniai darbai statybvietėje: medžiagų pernešimas, tvarkymas, pagalba meistrams. Reikalinga darbo avalynė ir pirštinės. Įrankiai suteikiami.", unread: true },
        { id: "i2", title: "Betonavimo pagalba", company: "MB Pamatų meistrai", d: 1, from: "07:00", to: "15:00", city: "Vilnius", addr: "Žirmūnų g. 70, Vilnius", pay: 120, unit: "day", status: "pending", until: "šiandien 14:00", urgent: true, km: 5, min: 12, lunch: "Pietų pertraukos nėra", arrival: "Darbdavys paima darbuotoją", phone: "+370 600 44556", rel: 100, desc: "Pagalba betonuojant pamatus. Darbas lauke, reikalinga tinkama apranga.", conflict: true },
        { id: "i3", title: "Medžiagų nešiojimas", company: "UAB Baltijos sandėliai", d: 3, from: "09:00", to: "14:00", city: "Vilnius", addr: "Savanorių pr. 178, Vilnius", pay: 13, unit: "hour", status: "declined", km: 6, min: 15, lunch: "Pietų pertraukos nėra", arrival: "Darbuotojas atvyksta pats", phone: "", rel: 93, desc: "Statybinių medžiagų pernešimas į 3 aukštą." },
        { id: "i4", title: "Tvarkymo darbai objekte", company: "UAB Rytų rangovai", d: 1, from: "09:00", to: "15:00", city: "Vilnius", addr: "Ukmergės g. 220, Vilnius", pay: 14, unit: "hour", status: "expired", km: 9, min: 20, lunch: "Pietų pertraukos nėra", arrival: "Darbuotojas atvyksta pats", phone: "", rel: 95, desc: "Patalpų tvarkymas po apdailos darbų." }
      ],
      jobs: [
        { id: "j1", title: "Krovos darbai sandėlyje", company: "UAB Baltijos sandėliai", d: 0, from: "08:00", to: "16:00", city: "Vilnius", addr: "Savanorių pr. 178, Vilnius", pay: 13, unit: "hour", state: "live", site: ["Darius S.", "Sandėlio vadovas", "+370 600 77001"], km: 6, min: 15, lunch: "12:00–12:30", arrival: "Darbuotojas atvyksta pats", phone: "+370 600 77889", rel: 93, desc: "Paletių iškrovimas ir statybinių medžiagų rūšiavimas sandėlyje." },
        { id: "j2", title: "Statybvietės tvarkymas", company: "UAB Statybų partneris", d: 1, from: "08:00", to: "16:30", city: "Vilnius", addr: "Ozo g. 25, Vilnius", pay: 14, unit: "hour", state: "waiting", site: ["Rasa M.", "Objekto vadovė", "+370 600 11001"], km: 8, min: 18, lunch: "12:00–12:30", arrival: "Darbuotojas atvyksta pats", phone: "+370 600 11223", rel: 98, desc: "Statybvietės tvarkymas po apdailos darbų, šiukšlių išnešimas." },
        { id: "j3", title: "Pagalbiniai mūro darbai", company: "MB Pamatų meistrai", d: -1, from: "07:30", to: "16:00", city: "Vilnius", addr: "Žirmūnų g. 70, Vilnius", pay: 15, unit: "hour", state: "toClose", km: 5, min: 12, lunch: "12:00–12:30", arrival: "Darbdavys paima darbuotoją", phone: "+370 600 44556", rel: 100, desc: "Blokelių padavimas mūrininkams, skiedinio maišymas." }
      ],
      history: [
        { id: "h1", title: "Fasado pastolių nešimas", company: "UAB Statybų partneris", d: -6, from: "08:00", to: "16:00", result: "done", worked: "7 val. 30 min.", rating: 10, comment: "Punktualus, gerai atliko užduotis." },
        { id: "h2", title: "Tvarkymo darbai objekte", company: "UAB Rytų rangovai", d: -9, from: "09:00", to: "15:00", result: "cancelled", reason: "Užsakovas nukėlė darbus į kitą savaitę." },
        { id: "h3", title: "Medžiagų iškrovimas", company: "UAB Baltijos sandėliai", d: -13, from: "07:00", to: "13:00", result: "done", worked: "6 val.", rating: 9, comment: "Viskas gerai, kviesime dar." },
        { id: "h4", title: "Betonavimo pagalba", company: "MB Pamatų meistrai", d: -20, from: "07:00", to: "15:00", result: "done", worked: "8 val.", rating: 9, comment: "Greitai susiorientavo objekte." },
        { id: "h5", title: "Tvarkymo darbai objekte", company: "UAB Statybų partneris", d: -27, from: "08:00", to: "16:00", result: "done", worked: "6 val.", rating: 10, comment: "Labai tvarkingas darbas." },
        { id: "h6", title: "Krovos darbai", company: "UAB Rytų rangovai", d: -34, from: "08:00", to: "16:00", result: "done", worked: "6 val.", rating: 9, comment: "Rekomenduojame." },
        { id: "h7", title: "Pagalbiniai mūro darbai", company: "MB Pamatų meistrai", d: -41, from: "08:00", to: "16:00", result: "done", worked: "8 val.", rating: 9, comment: "Dirbo greitai ir kruopščiai." },
        { id: "h8", title: "Medžiagų nešiojimas", company: "UAB Baltijos sandėliai", d: -48, from: "08:00", to: "16:00", result: "done", worked: "5 val.", rating: 8, comment: "Viskas gerai." },
        { id: "h9", title: "Betonavimo pagalba", company: "MB Pamatų meistrai", d: -55, from: "08:00", to: "16:00", result: "done", worked: "8 val.", rating: 9, comment: "Puikiai susitvarkė." },
        { id: "h10", title: "Statybvietės tvarkymas", company: "UAB Statybų partneris", d: -62, from: "08:00", to: "16:00", result: "done", worked: "7 val.", rating: 10, comment: "Ačiū už darbą!" },
        { id: "h11", title: "Fasado darbai", company: "UAB Rytų rangovai", d: -69, from: "08:00", to: "16:00", result: "done", worked: "8 val.", rating: 9, comment: "Kviesime vėl." }
      ],
      offer: { id: "o1", position: "Statybų darbininkas", company: "UAB Statybų partneris", type: "Neterminuota darbo sutartis", start: 21, payText: "1 600 € į rankas / mėn.", schedule: "Pirmadienis–penktadienis · 08:00–17:00", lunch: "12:00–13:00", addr: "Ozo g. 25, Vilnius", status: "new", info: "Darbas nuolatiniuose objektuose Vilniuje. Darbo drabužiai ir įrankiai suteikiami. Bandomasis laikotarpis 3 mėnesiai." },
      schedule: Array.from({ length: 14 }, (_, i) => {
        if (i === 0) return { s: "locked", from: "08:00", to: "16:00", note: "Užfiksuota · darbas" };
        if (i === 1) return { s: "locked", from: "08:00", to: "16:30", note: "Užfiksuota · darbas" };
        const wd = dOff(i).getDay();
        if (wd === 0) return { s: "busy" };
        return { s: [2, 3, 4, 7, 8, 9, 10, 11].includes(i) ? "free" : "busy", from: "07:00", to: "18:00" };
      }),
      convs: [
        { id: "c1", kind: "private", name: "UAB Statybų partneris", person: "Rasa, darbų vadovė", online: true, job: "Pagalbiniai statybos darbai", unread: true, msgs: [{ w: "them", t: "Laba diena! Matėme, kad esate laisva poryt.", d: "Šiandien", tm: "09:10" }, { w: "them", t: "Ar galėtumėte atvykti 15 min. anksčiau? Reikės pasiimti apsaugines priemones.", d: "Šiandien", tm: "09:12" }] },
        { id: "c2", kind: "group", name: "Krovos darbai sandėlyje", person: "UAB Baltijos sandėliai", parts: ["Darius (sandėlio vadovas)", "Tomas K.", "Jūs"], online: false, job: "Krovos darbai sandėlyje", unread: false, msgs: [{ w: "Darius (sandėlio vadovas)", t: "Įvažiavimas iš kiemo pusės, vartai Nr. 4.", d: "Vakar", tm: "18:40" }, { w: "Tomas K.", t: "Ačiū, ar galima palikti automobilį prie vartų?", d: "Vakar", tm: "18:46" }, { w: "Darius (sandėlio vadovas)", t: "Taip, kairėje yra stovėjimo aikštelė.", d: "Vakar", tm: "18:47" }, { w: "me", t: "Supratau, ačiū. Iki ryto!", d: "Vakar", tm: "18:52" }] }
      ],
      archive: [{ id: "a1", kind: "group", name: "Fasado pastolių nešimas", person: "UAB Statybų partneris", parts: ["Rasa, darbų vadovė", "Jūs"], job: "Fasado pastolių nešimas", msgs: [{ w: "Rasa, darbų vadovė", t: "Rytoj pradedame 8:00, pastoliai kieme.", d: "Prieš 7 d.", tm: "17:20" }, { w: "me", t: "Gerai, būsiu.", d: "Prieš 7 d.", tm: "17:31" }, { w: "Rasa, darbų vadovė", t: "Ačiū už darbą šiandien!", d: "Prieš 6 d.", tm: "16:05" }] }],
      favCo: ["UAB Statybų partneris"], mutual: ["UAB Statybų partneris"],
      docs: [{ id: "d1", type: "Darbas aukštyje", until: 210, show: true, file: "aukstis_pazymejimas.pdf" }, { id: "d2", type: "Saugos ir sveikatos instruktažas", until: 18, show: true, file: "instruktazas_2025.jpg" }],
      reviews: [["UAB Statybų partneris", 10, "Punktualus, gerai atliko užduotis."], ["UAB Baltijos sandėliai", 9, "Viskas gerai, kviesime dar."], ["MB Pamatų meistrai", 9, "Greitai susiorientavo objekte."]]
    },
    ads: [
      { id: "a1", cvReq: true, title: "Statybų darbininkas", company: "UAB Statybų partneris", city: "Vilnius", sal: [1600, 1900], contract: "Neterminuota darbo sutartis", sched: "I–V · 08:00–17:00", start: "Iš karto", posted: 1, until: 29, addr: "Ozo g. 25, Vilnius", desc: "Ieškome darbininko nuolatiniams objektams Vilniuje. Darbas su patyrusia komanda, aiškios užduotys ir stabilus grafikas.", req: ["Patirtis statybose nuo 1 metų", "Atsakingumas ir punktualumas", "Darbas aukštyje – privalumas"], offer: ["Darbo drabužiai ir įrankiai", "Atlyginimas du kartus per mėnesį", "Transportas į objektus iš Vilniaus centro"], status: "viewed", applied: 3 },
      { id: "a2", saved: true, nudged: true, title: "Pagalbinis darbuotojas sandėlyje", company: "UAB Baltijos sandėliai", city: "Vilnius", sal: [2100, 2450], gross: true, contract: "Terminuota sutartis · 6 mėn.", sched: "Pamaininis 2/2 · 07:00–19:00", start: "Nuo lapkričio 10 d.", posted: 2, until: 25, addr: "Savanorių pr. 178, Vilnius", desc: "Statybinių medžiagų priėmimas, rūšiavimas ir krovimas sandėlyje.", req: ["Fizinis pasirengimas", "Krautuvo pažymėjimas – privalumas"], offer: ["Priedai už viršvalandžius", "Šiltas sandėlis"], status: null },
      { id: "a3", iv: { how: "live", d: 3, t: "09:30", addr: "Žirmūnų g. 70, Vilnius" }, title: "Betonuotojas", company: "MB Pamatų meistrai", city: "Vilnius", sal: [1800, 2200], contract: "Neterminuota darbo sutartis", sched: "I–V · 07:00–16:00", start: "Iš karto", posted: 4, until: 20, addr: "Žirmūnų g. 70, Vilnius", desc: "Pamatų ir perdangų betonavimas, armavimas, klojinių montavimas.", req: ["Betonavimo patirtis", "Gebėjimas skaityti brėžinius"], offer: ["Konkurencingas atlyginimas", "Darbas be komandiruočių"], status: "interview", applied: 6 },
      { id: "a4", title: "Apdailininkas", company: "UAB Rytų rangovai", city: "Kaunas", sal: [1700, 2100], contract: "Neterminuota darbo sutartis", sched: "I–V · 08:00–17:00", start: "Iš karto", posted: 3, until: 27, addr: "Savanorių pr. 400, Kaunas", desc: "Vidaus apdailos darbai naujos statybos būstuose.", req: ["Glaistymo ir dažymo patirtis"], offer: ["Įrankiai suteikiami"], status: null },
      { id: "a5", title: "Krautuvo vairuotojas", company: "UAB Baltijos sandėliai", city: "Vilnius", sal: [1500, 1700], contract: "Neterminuota darbo sutartis", sched: "Pamaininis · 06:00–14:00 / 14:00–22:00", start: "Nuo lapkričio 3 d.", posted: 6, until: 22, addr: "Savanorių pr. 178, Vilnius", desc: "Krautuvo vairavimas statybinių medžiagų sandėlyje.", req: ["Krautuvo vairuotojo pažymėjimas"], offer: ["Pamainų priedai"], status: null },
      { id: "a6", title: "Meistro padėjėjas", company: "UAB Statybų partneris", city: "Vilnius", sal: [2000, 2400], contract: "Neterminuota darbo sutartis", sched: "I–V · 08:00–17:00", start: "Nuo gruodžio", posted: 7, until: 21, addr: "Ozo g. 25, Vilnius", desc: "Pagalba darbų vadovui organizuojant darbus objekte.", req: ["Patirtis statybose nuo 3 metų", "B kategorija"], offer: ["Tarnybinis automobilis"], status: null }
    ],
    emp: {
      jobs: [
        { id: "e1", auto: true, autoLog: [["w5", "w3"]], title: "Pagalbiniai mūro darbai", d: 1, from: "07:30", to: "16:30", city: "Vilnius", addr: "Kalvarijų g. 120, Vilnius", need: 3, pay: 15, unit: "hour", resp: "Jūs", lunch: "12:00–12:30", arrival: "Darbuotojas atvyksta pats", desc: "Blokelių padavimas mūrininkams, skiedinio maišymas, tvarkymas. Reikalinga darbo avalynė.", workers: [["w1", "accepted"], ["w2", "accepted"], ["w3", "invited"], ["w5", "declined"]], unread: 1 },
        { id: "e2", site: "Mindaugas S.", title: "Betonavimo pagalba", d: 0, from: "08:00", to: "17:00", city: "Vilnius", addr: "Linkmenų g. 34, Vilnius", need: 2, pay: 130, unit: "day", resp: "Ieva M.", lunch: "12:00–13:00", arrival: "Darbdavys paima darbuotoją", desc: "Pagalba betonuojant perdangą. Darbas lauke, apsauginės priemonės suteikiamos.", workers: [["w4", "arrived"], ["w7", "accepted"]], unread: 0 },
        { id: "e3", title: "Statybvietės tvarkymas", d: -1, from: "08:00", to: "15:00", city: "Vilnius", addr: "Ukmergės g. 220, Vilnius", need: 3, pay: 14, unit: "hour", resp: "Jūs", lunch: "Pietų pertraukos nėra", arrival: "Darbuotojas atvyksta pats", desc: "Šiukšlių išnešimas, patalpų tvarkymas po apdailos.", workers: [["w6", "toClose"], ["w2", "toClose"], ["w3", "toClose"]], unread: 0 },
        { id: "e5", site: "Mindaugas S.", title: "Krovos darbai sandėlyje", d: 0, from: "07:00", to: "15:00", city: "Vilnius", addr: "Savanorių pr. 178, Vilnius", need: 3, pay: 13, unit: "hour", resp: "Paulius R.", lunch: "11:30–12:00", arrival: "Darbuotojas atvyksta pats", desc: "Paletių iškrovimas ir rūšiavimas.", workers: [["w1", "confirmed"], ["w5", "confirmed"], ["w6", "confirmed"]], unread: 0 },
        { id: "e6", title: "Fasado pastolių nešimas", d: 0, from: "09:00", to: "17:00", city: "Vilnius", addr: "Ozo g. 25, Vilnius", need: 2, pay: 14, unit: "hour", resp: "Jūs", lunch: "12:00–12:30", arrival: "Darbuotojas atvyksta pats", desc: "Pastolių elementų nešimas į 4 aukštą.", workers: [["w2", "arrived"], ["w3", "accepted"]], unread: 0 },
        { id: "e4", title: "Medžiagų iškrovimas", d: 4, from: "09:00", to: "14:00", city: "Kaunas", addr: "Savanorių pr. 400, Kaunas", need: 2, pay: 14, unit: "hour", resp: "Paulius R.", lunch: "Pietų pertraukos nėra", arrival: "Darbuotojas atvyksta pats", desc: "Statybinių medžiagų iškrovimas iš sunkvežimio.", workers: [["w5", "accepted"], ["w6", "accepted"]], unread: 2 }
      ],
      templates: [
        { n: "Mūro pagalba", title: "Pagalbiniai mūro darbai", people: "3", obj: "Kalvarijų objektas", from: "07:30", to: "16:30", lunch: true, lf: "12:00", lt: "12:30", payAmount: "15", unit: "hour", desc: "Blokelių padavimas mūrininkams, skiedinio maišymas, tvarkymas. Reikalinga darbo avalynė." },
        { n: "Fasado pastoliai", title: "Fasado pastolių nešimas", people: "2", obj: "", from: "09:00", to: "17:00", lunch: true, lf: "12:00", lt: "12:30", payAmount: "14", unit: "hour", desc: "Pastolių elementų nešimas į viršutinius aukštus." },
        { n: "Krova sandėlyje", title: "Krovos darbai sandėlyje", people: "3", obj: "Sandėlis Savanorių pr.", from: "07:00", to: "15:00", lunch: true, lf: "11:30", lt: "12:00", payAmount: "13", unit: "hour", desc: "Paletių iškrovimas ir rūšiavimas." },
        { n: "Tvarkymas po apdailos", title: "Statybvietės tvarkymas", people: "3", obj: "", from: "08:00", to: "15:00", lunch: false, lf: "12:00", lt: "12:30", payAmount: "14", unit: "hour", desc: "Šiukšlių išnešimas, patalpų tvarkymas po apdailos." },
        { n: "Gipso plokštės", title: "Gipso plokščių nešimas", people: "2", obj: "", from: "08:00", to: "14:00", lunch: false, lf: "12:00", lt: "12:30", payAmount: "15", unit: "hour", desc: "Gipso kartono plokščių užnešimas į aukštus." },
        { n: "Iškrovimas Kaune", title: "Medžiagų iškrovimas", people: "2", obj: "", from: "09:00", to: "14:00", lunch: false, lf: "12:00", lt: "12:30", payAmount: "14", unit: "hour", desc: "Statybinių medžiagų iškrovimas iš sunkvežimio." },
        { n: "Stogo darbai", title: "Pagalba stogo darbuose", people: "2", obj: "", from: "08:00", to: "17:00", lunch: true, lf: "12:00", lt: "13:00", payAmount: "140", unit: "day", desc: "Medžiagų padavimas stogdengiams, darbas aukštyje." },
        { n: "Langų montavimas", title: "Langų montavimo pagalba", people: "1", obj: "", from: "08:00", to: "16:00", lunch: true, lf: "12:00", lt: "12:30", payAmount: "15", unit: "hour", desc: "Langų nešimas ir pagalba montuotojams." },
        { n: "Šiukšlių išvežimas", title: "Statybinių atliekų išnešimas", people: "2", obj: "", from: "08:00", to: "13:00", lunch: false, lf: "12:00", lt: "12:30", payAmount: "14", unit: "hour", desc: "Atliekų išnešimas į konteinerį." },
        { n: "Betonavimas", title: "Betonavimo pagalba", people: "2", obj: "Linkmenų objektas", from: "08:00", to: "17:00", lunch: true, lf: "12:00", lt: "13:00", payAmount: "130", unit: "day", desc: "Pagalba betonuojant perdangą. Darbas lauke, apsauginės priemonės suteikiamos." }
      ],
      objects: [
        { n: "Kalvarijų objektas", city: "Vilnius", addr: "Kalvarijų g. 120, Vilnius", arrival: "Darbuotojas atvyksta pats", note: "Įvažiavimas iš kiemo pusės" },
        { n: "Linkmenų objektas", city: "Vilnius", addr: "Linkmenų g. 34, Vilnius", arrival: "Darbdavys paima darbuotoją", note: "Susitikimas prie vartų" },
        { n: "Sandėlis Savanorių pr.", city: "Vilnius", addr: "Savanorių pr. 178, Vilnius", arrival: "Darbuotojas atvyksta pats", note: "" }
      ],
      log: [
        ["Ieva M.", "sukūrė darbą", "Betonavimo pagalba", "Šiandien 07:12"],
        ["Paulius R.", "perdavė darbą Jums", "Statybvietės tvarkymas", "Vakar 16:40"],
        ["Jūs", "pakeitė rolę", "Paulius R. → Vadybininkas", "Vakar 10:05"],
        ["Ieva M.", "atšaukė darbą", "Tvarkymo darbai objekte", "Prieš 9 d."]
      ],
      ended: [
        { id: "x1", title: "Fasado pastolių nešimas", d: -6, need: 2, result: "done", workers: [["w1", 10], ["w4", 9]] },
        { id: "x2", title: "Tvarkymo darbai objekte", d: -9, need: 3, result: "cancelled", reason: "Užsakovas netikėtai nukėlė darbus į kitą savaitę." },
        { id: "x3", title: "Medžiagų iškrovimas", d: -13, need: 3, result: "short", workers: [["w2", 9], ["w5", 9]] },
        { id: "x4", title: "Betonavimo pagalba", d: -20, need: 2, result: "done", workers: [["w3", 8], ["w7", 9]] },
        { id: "x5", title: "Tvarkymo darbai objekte", d: -27, need: 2, result: "done", workers: [["w4", 10], ["w1", 9]] },
        { id: "x6", title: "Krovos darbai", d: -34, need: 2, result: "done", workers: [["w2", 9], ["w5", 9]] },
        { id: "x7", title: "Pagalbiniai mūro darbai", d: -41, need: 2, result: "done", workers: [["w7", 9], ["w3", 8]] },
        { id: "x8", title: "Medžiagų nešiojimas", d: -48, need: 2, result: "done", workers: [["w5", 8], ["w6", 9]] },
        { id: "x9", title: "Statybvietės tvarkymas", d: -55, need: 2, result: "done", workers: [["w1", 10], ["w4", 10]] },
        { id: "x10", title: "Fasado darbai", d: -62, need: 2, result: "done", workers: [["w7", 9], ["w2", 9]] }
      ],
      ads: [
        { id: "ea1", by: "Jūs", title: "Statybų darbininkas", city: "Vilnius", sal: [1600, 1900], contract: "Neterminuota darbo sutartis", sched: "I–V · 08:00–17:00", until: 26, views: 184, cands: [["w1", "new", "Galiu pradėti nuo pirmadienio. Su jumis dirbau 3 kartus.", 0], ["w2", "new", "", 1], ["w4", "viewed", "Turiu darbo aukštyje pažymėjimą.", 2, null, "req"], ["w3", "interview", "", 4, { how: "live", d: 4, t: "10:00", addr: "Ozo g. 25, Vilnius", ok: true }]], saves: ["w6", "w7"] },
        { id: "ea2", by: "Ieva M.", title: "Krovos darbuotojas", city: "Vilnius", sal: [1300, 1500], contract: "Terminuota sutartis · 6 mėn.", sched: "Pamaininis 2/2", until: 12, views: 61, cands: [["w5", "new", "", 1]], saves: ["w2"] }
      ],
      favorites: [["w1", "Fasado pastolių nešimas", -6], ["w4", "Fasado pastolių nešimas", -6], ["w7", "Betonavimo pagalba", -20]],
      team: [["Jūs", "Savininkas", "vadovas@pavyzdys.lt"], ["Ieva M.", "Vadovas", "ieva@pavyzdys.lt"], ["Paulius R.", "Vadybininkas", "paulius@pavyzdys.lt"], ["Mindaugas S.", "Objekto vadovas", "mindaugas@pavyzdys.lt"]],
      pendingInvites: [["Justas L.", "Vadybininkas", "justas@pavyzdys.lt"]],
      teamRole: "Vadybininkas",
      teamChat: [["Ieva M.", "Rytoj Linkmenų objekte reikės dar vieno žmogaus.", "08:15"], ["Paulius R.", "Kaune iškrovimas patvirtintas, abu darbuotojai priėmė.", "09:02"]],
      convs: [
        { id: "team", kind: "team", name: "Vadovų pokalbis", person: "UAB Pavyzdinė statyba · tik komanda", parts: ["Jūs", "Ieva M.", "Paulius R."], job: "Vidinis įmonės pokalbis", unread: true, msgs: [{ w: "Ieva M.", t: "Rytoj Linkmenų objekte reikės dar vieno žmogaus.", d: "Šiandien", tm: "08:15" }, { w: "Paulius R.", t: "Kaune iškrovimas patvirtintas, abu darbuotojai priėmė.", d: "Šiandien", tm: "09:02" }, { w: "Ieva M.", t: "", file: { name: "Linkmenu_objekto_planas.pdf", size: "1,2 MB" }, d: "Šiandien", tm: "09:10" }] },
        { id: "ec1", kind: "group", name: "Pagalbiniai mūro darbai", person: "Darbo pokalbis", parts: ["Jūs", "Tomas K.", "Mantas P."], online: false, job: "Pagalbiniai mūro darbai", unread: true, msgs: [{ w: "me", t: "Labas rytas visiems, rytoj pradedame 7:30.", d: "Vakar", tm: "16:02" }, { w: "Mantas P.", t: "Gerai, būsiu.", d: "Vakar", tm: "16:10" }, { w: "Tomas K.", t: "Ar reikės savo pirštinių?", d: "Šiandien", tm: "10:20" }] },
        { id: "ec2", kind: "private", name: "Tomas K.", person: "Pagalbiniai mūro darbai", online: true, job: "Pagalbiniai mūro darbai", unread: false, msgs: [{ w: "me", t: "Laba diena, objekte būsiu nuo 7:15.", d: "Vakar", tm: "17:30" }, { w: "them", t: "Gerai, iki rytojaus.", d: "Vakar", tm: "17:41" }] },
        { id: "ec3", kind: "group", name: "Medžiagų iškrovimas", person: "Darbo pokalbis · Kaunas", parts: ["Jūs", "Andrius P.", "Lukas J."], online: false, job: "Medžiagų iškrovimas", unread: true, msgs: [{ w: "Andrius P.", t: "Kokiu numeriu skambinti atvykus?", d: "Šiandien", tm: "08:47" }, { w: "Lukas J.", t: "Ir aš atvyksiu tuo pačiu metu.", d: "Šiandien", tm: "08:55" }] },
        { id: "ec4", kind: "private", name: "Rytis K.", person: "Betonavimo pagalba", online: true, job: "Betonavimo pagalba", unread: false, msgs: [{ w: "them", t: "Jau esu objekte, laukiu prie vartų.", d: "Šiandien", tm: "07:52" }, { w: "me", t: "Ateinu, 2 minutės.", d: "Šiandien", tm: "07:54" }] }
      ],
      archive: [{ id: "ea1", kind: "group", name: "Fasado pastolių nešimas", person: "Darbo pokalbis", parts: ["Jūs", "Tomas K.", "Rytis K."], job: "Fasado pastolių nešimas", msgs: [{ w: "me", t: "Rytoj pradedame 8:00, pastoliai kieme.", d: "Prieš 7 d.", tm: "17:20" }, { w: "Tomas K.", t: "Gerai, būsiu.", d: "Prieš 7 d.", tm: "17:31" }, { w: "Rytis K.", t: "Aš irgi.", d: "Prieš 7 d.", tm: "17:40" }] }],
      reviews: [["Tomas K.", 10, "Aiškiai paaiškino užduotis, atsiskaitė laiku.", 6, "Fasado pastolių nešimas"], ["Rytis K.", 9, "Geras objektas, tvarkinga komanda.", 6, "Fasado pastolių nešimas"], ["Mantas P.", 9, "Viskas buvo paruošta atvykus, pietų pertrauka kaip sutarta.", 13, "Medžiagų iškrovimas"], ["Gintaras V.", 10, "Rekomenduoju, dirbsiu dar.", 20, "Betonavimo pagalba"], ["Andrius P.", 8, "Darbas užsitęsė ilgiau nei buvo nurodyta.", 34, "Krovos darbai"]],
      openJob: null, draftNo: 0, usedMonth: { basic: 4, business: 21 }
    }
  };
}
let S = freshState();
try { const r = localStorage.getItem("s24full-rail"); S.rail = r === "1"; } catch (e) { S.rail = false; }


/* ---------- Mėnesio apdovanojimų ženkliukai ---------- */
const AWARD_META = {
  worker: { activity: "Mėnesio aktyviausias", best: "Mėnesio geriausias", reliability: "Mėnesio patikimiausias" },
  company: { activity: "Mėnesio aktyviausia", best: "Mėnesio geriausia", reliability: "Mėnesio patikimiausia" }
};
const AWARD_STYLE = {
  best: { c1: "#ffd36b", c2: "#e8a317", icon: '<path d="m12 5.2 2 4.1 4.5.7-3.3 3.2.8 4.5-4-2.1-4 2.1.8-4.5L5.5 10l4.5-.7Z" fill="#fff"/>' },
  reliability: { c1: "#5fe0a3", c2: "#1c9b67", icon: '<path d="M12 5 6.5 7.2v4.3c0 3.3 2.4 6 5.5 6.7 3.1-.7 5.5-3.4 5.5-6.7V7.2Z" fill="#fff"/><path d="m9.4 11.8 1.8 1.8 3.5-3.6" fill="none" stroke="#1c9b67" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>' },
  activity: { c1: "#baabe3", c2: "#644e9f", icon: '<path d="M13.2 4.5 7.5 13h4l-.9 6.5L16.5 11h-4Z" fill="#fff"/>' }
};
const PREV_MONTH = (() => { const d = new Date(TODAY); d.setDate(1); d.setMonth(d.getMonth() - 1); return `${d.getFullYear()} m. ${MON[d.getMonth()].toLocaleLowerCase("lt-LT")}`; })();
const AWARDS = {
  "UAB Statybų partneris": [["best", "9,6 / 10 · 18 įvertinimų"], ["reliability", "100 / 100 patikimumas"]],
  "MB Pamatų meistrai": [["activity", "42 užbaigti darbai"]],
  "UAB Baltijos sandėliai": [],
  "UAB Pavyzdinė statyba": [["reliability", "100 / 100 patikimumas"]],
  w1: [["best", "9,8 / 10 · 6 įvertinimai"], ["reliability", "100 / 100 patikimumas"]],
  w2: [["reliability", "100 / 100 patikimumas"]],
  w7: [["activity", "14 užbaigtų darbų"]],
  me: [["reliability", "100 / 100 patikimumas"]]
};
function awardSVG(type, size = 26) {
  const st = AWARD_STYLE[type]; const id = `ag-${type}`;
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${st.c1}"/><stop offset="1" stop-color="${st.c2}"/></linearGradient></defs><circle cx="12" cy="12" r="11" fill="url(#${id})"/><circle cx="12" cy="12" r="9.2" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="1"/>${st.icon}</svg>`;
}
function awardBadges(key, kind, size = 22) {
  const list = AWARDS[key] || []; if (!list.length) return "";
  return `<span class="awards">${list.map(([t, m]) => `<span class="award" tabindex="0" aria-label="${AWARD_META[kind][t]}, ${PREV_MONTH}, ${m}">${awardSVG(t, size)}<span class="awtip"><b>${AWARD_META[kind][t]}</b><span>${PREV_MONTH}</span><span>${m}</span></span></span>`).join("")}</span>`;
}
function awardPanel(key, kind) {
  const list = AWARDS[key] || [];
  if (!list.length) return "";
  return `<div class="awpanel"><h3>Apdovanojimai · ${PREV_MONTH}</h3><div class="awlist">${list.map(([t, m]) => `<div class="awitem aw-${t}">${awardSVG(t, 40)}<div><b>${AWARD_META[kind][t]}</b><span>${m}</span></div></div>`).join("")}</div></div>`;
}

/* ---------- Puslapiavimas ---------- */
const PER_PAGE = 5;
function paged(key, items, fn) {
  const n = Math.max(1, Math.ceil(items.length / PER_PAGE));
  const p = Math.min(Math.max((S.pages || {})[key] || 0, 0), n - 1);
  const from = p * PER_PAGE, slice = items.slice(from, from + PER_PAGE);
  const nums = [];
  for (let i = 0; i < n; i++) { if (n <= 7 || i === 0 || i === n - 1 || Math.abs(i - p) <= 1) nums.push(i); else if (nums[nums.length - 1] !== "…") nums.push("…"); }
  const pager = n > 1 ? `<nav class="pager" aria-label="Puslapiai" data-pkey="${key}"><span class="pinfo">Rodoma ${from + 1}–${from + slice.length} iš ${items.length}</span><div class="pbtns"><button type="button" class="pbtn" data-act="page" data-k="${key}" data-v="${p - 1}"${p === 0 ? " disabled" : ""} aria-label="Ankstesnis puslapis">${svg("back", 16, 2.2)}</button>${nums.map((i) => i === "…" ? '<span class="pdots">…</span>' : `<button type="button" class="pbtn${i === p ? " cur" : ""}" data-act="page" data-k="${key}" data-v="${i}"${i === p ? ' aria-current="page"' : ""}>${i + 1}</button>`).join("")}<button type="button" class="pbtn" data-act="page" data-k="${key}" data-v="${p + 1}"${p === n - 1 ? " disabled" : ""} aria-label="Kitas puslapis">${svg("back", 16, 2.2).replace(I.back, '<path d="m9 18 6-6-6-6"/>')}</button></div></nav>` : "";
  return `<div class="list" id="pl-${key}">${slice.map(fn).join("")}</div>${pager}`;
}
/* ---------- Bendri komponentai ---------- */
const LOGO_SRC = "__LOGO__", MARK_SRC = "__MARK__", LOGO_LIGHT = "__LOGOL__", MARK_LIGHT = "__MARKL__";
const empty = (t, s, ic = "check") => `<div class="empty"><div class="ic">${svg(ic, 20, 2.2)}</div><div><b>${t}</b><span>${s}</span></div></div>`;
const pill = (t, c = "") => `<span class="pill ${c}">${t}</span>`;
const facts = (j) => `<div class="facts"><span>${svg("cal", 16)}<b>${dateLabel(j.d)}</b></span><span>${svg("clock", 16)}${j.from}–${j.to}</span><span>${svg("pin", 16)}${esc(j.city)}</span><span>${svg("euro", 16)}${pay(j.pay, j.unit)}</span></div>`;
const busyJob = () => S.worker.jobs.find((j) => j.d === 0 && (j.state === "live" || j.state === "arrived"));
const isMutual = (n) => S.role === "worker" && (S.worker.mutual || []).includes(n) && (S.worker.favCo || []).includes(n);
const MUTUAL_W = ["w1", "w4"];
const DOC_UNTIL = { "Darbas aukštyje": 240, "Saugos ir sveikatos instruktažas": 95, "Krautuvo vairuotojo pažymėjimas": 600 };
const FAKE_NM = ["test", "testas", "nera", "nėra", "vardas", "pavarde", "pavardė", "asd", "qwe", "qwerty", "xxx", "abc", "aaa", "nezinau", "nežinau", "anonimas", "darbuotojas", "admin"];
function nameErr(v, t, other) {
  if (!v) return `Įrašykite ${t}`;
  const parts = v.split(/[\s-]+/).filter(Boolean), low = v.toLocaleLowerCase("lt-LT");
  if (parts.some((p) => p.length < 2)) return `Įrašykite pilną ${t}, ne tik raidę`;
  if (v.replace(/[\s-]/g, "").length < 3 && t === "pavardę") return "Pavardė per trumpa";
  if (!/[aąeęėiįyouųū]/i.test(v)) return `Tai nepanašu į tikrą ${t === "vardą" ? "vardą" : "pavardę"}`;
  if (/(.)\1\1/i.test(v) || /[bcčdfghjklmnprsštvzž]{5,}/i.test(v)) return `Tai nepanašu į tikrą ${t === "vardą" ? "vardą" : "pavardę"}`;
  if (FAKE_NM.includes(low)) return `Įrašykite savo tikrą ${t}`;
  if (other && low === other.trim().toLocaleLowerCase("lt-LT")) return "Vardas ir pavardė negali sutapti";
  return "";
}
const capName = (v) => v.replace(/[^A-Za-zĄČĘĖĮŠŲŪŽąčęėįšųūžÀ-ÿ\s-]/g, "").replace(/\s{2,}/g, " ").toLowerCase().replace(/(^|[\s-])(\S)/g, (m, p, c) => p + c.toUpperCase());
// Vienas privatus pokalbis su tuo pačiu žmogumi – istorija tęsiasi, nauja tema pažymima skirtuku
function privConv(list, name, ctx, kind) {
  let c = list.find((x) => x.kind === "private" && x.name === name);
  if (!c) { c = { id: "pv-" + name.replace(/[^\wĄČĘĖĮŠŲŪŽąčęėįšųūž]/g, ""), kind: "private", name, person: ctx ? `${kind} · ${ctx}` : "Tiesioginė žinutė", online: false, job: ctx || "Tiesioginė žinutė", unread: false, msgs: [] }; list.unshift(c); }
  else if (ctx && c.job.toLowerCase() !== ctx.toLowerCase()) { c.job = ctx; c.person = `${kind} · ${ctx}`; list.splice(list.indexOf(c), 1); list.unshift(c); }
  return c;
}
const docTag = (wid, t) => `<button type="button" class="tag doc" data-act="docView" data-w="${wid}" data-v="${esc(t)}">${svg("file", 13)}${esc(t)}</button>`;
const WDOCS = { w1: ["Darbas aukštyje", "Saugos ir sveikatos instruktažas"], w4: ["Darbas aukštyje"], w5: ["Krautuvo vairuotojo pažymėjimas"], w3: ["Saugos ir sveikatos instruktažas"] };
const teamPill = () => `<span class="pill team">${svg("people", 13, 2.2)}Nuolatinė komanda</span>`;
const isFavCo = (n) => S.role === "worker" && (S.worker.favCo || []).includes(n);
const heartSVG = (sz, on) => `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="${on ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true">${I.heart}</svg>`;
const favBtn = (n, label) => { const on = isFavCo(n); return `<button type="button" class="favbtn${on ? " on" : ""}${label ? " lab" : ""}" data-act="favCo" data-v="${esc(n)}" aria-pressed="${on}"${label ? "" : ` title="${on ? "Pašalinti iš mėgstamų įmonių" : "Pridėti prie mėgstamų įmonių"}" aria-label="${on ? "Pašalinti iš mėgstamų įmonių" : "Pridėti prie mėgstamų įmonių"}"`}>${heartSVG(label ? 16 : 17, on)}${label ? `<span>${on ? "Mėgstama įmonė" : "Pridėti prie mėgstamų"}</span>` : ""}</button>`; };
const coLine = (name, sub) => `<div class="co-line"><div class="av co sm" style="border:1px solid var(--line)">${ini(name.replace(/^(UAB|MB)\s+/, ""))}</div><div><b class="nm">${esc(name)}${isFavCo(name) ? `<span class="favmark" title="Mėgstama įmonė">${heartSVG(15, true)}</span>` : ""}${awardBadges(name, "company", 18)}</b>${sub ? `<small>${sub}</small>` : ""}</div></div>`;
const wAv = (w, cls = "") => `<div class="av lt ${cls}">${ini(w.name)}</div>`;

function menuDef() {
  const W = S.worker, E = S.emp;
  if (S.role === "admin") {
    const D = A(), dis = D.disputes.filter((d) => d.open).length, bugs = D.bugs.filter((b) => b.st === "active").length, unv = D.employers.filter((c) => !c.ver).length, fn = H().requests.filter((f) => f.st === "new").length;
    return {
      groups: [
        ["Apžvalga", [["overview", "Suvestinė", "overview", dis + bugs + unv + fn]]],
        ["Naudotojai", [["aworkers", "Darbuotojai", "people"], ["aemployers", "Darbdaviai", "home", unv], ["abroad", "Domisi darbu užsienyje", "nav"]]],
        ["Darbai", [["ajobs", "Visi darbai", "jobs"], ["aads", "Darbo skelbimai", "briefcase"], ["employment", "Įdarbinti darbuotojai", "briefcase"], ["foreign", "Tarptautinė atranka", "user", fn]]],
        ["Priežiūra", [["disputes", "Ginčai", "shield", dis], ["bugs", "Svetainės klaidos", "bell", bugs], ["ratings", "Atsiliepimai", "star"], ["teamchats", "Pokalbiai", "chat"], ["files", "Failai", "file"]]],
        ["Sistema", [["awards", "Mėnesio geriausi", "star"], ["audit", "Veiksmų istorija", "history"], ["aadmins", "Administratoriai", "team"]]]
      ],
      tabs: [["overview", "Suvestinė", "overview", dis + bugs], ["aworkers", "Žmonės", "people"], ["disputes", "Ginčai", "shield", dis], ["bugs", "Klaidos", "bell", bugs]],
      who: admMe() ? [ini(admMe().n), admMe().n, ADM_PRESET_N[admPresetOf(admMe().p)], false] : ["AD", "Administratorius", "statybos24.lt", false]
    };
  }
  if (S.role === "worker") {
    const pend = W.invites.filter((i) => i.status === "pending" && !i.conflict).length;
    const unread = W.convs.filter((c) => c.unread).length;
    return {
      groups: [
        ["Darbai", [["overview", "Apžvalga", "overview"], ["invites", "Kvietimai į darbą", "mail", pend], ["jobs", "Mano darbai", "jobs", W.jobs.filter((j) => ["live", "toClose"].includes(j.state)).length], ["history", "Darbų istorija", "history"], ["favco", "Mėgstamos įmonės", "heart"]]],
        ["Prieinamumas", [["schedule", "Darbo grafikas", "cal", S.scheduleConfirmed ? 0 : "Atnaujinti"]]],
        ["Ilgalaikis darbas", [["ads", "Darbo skelbimai", "briefcase", (S.ads || []).filter((a) => a.status === "interview" || (a.nudged && !a.status) || (a.status && a.cvReq && !a.cvSent && a.status !== "rejected")).length]]]
      ],
      tabs: [["overview", "Apžvalga", "overview"], ["invites", "Kvietimai", "mail", pend], ["jobs", "Darbai", "jobs"], ["schedule", "Grafikas", "cal", S.scheduleConfirmed ? 0 : 1]],
      who: ["BB", "Beata Bune", "Darbuotojas · Vilnius", false]
    };
  }
  const VJs = VJ(), r = RK();
  const attn = VJs.filter((j) => j.workers.some((w) => ["toClose", "arrived"].includes(w[1]))).length;
  const unread = E.convs.filter((c) => c.unread).length;
  const G = [["Darbai", [["overview", "Apžvalga", "overview", attn], ["active", r === "site" ? "Mano objektai" : "Aktyvūs darbai", "jobs", VJs.length], ...(r === "site" ? [] : [["ended", "Pasibaigę darbai", "history"], ["calendar", "Darbų kalendorius", "cal", "Pro"]])]]];
  G.push(["Darbuotojai", r === "site" ? [["urgent", "Skubiai!", "bolt", "Pro"]] : [["favorites", "Mėgstami darbuotojai", "heart"], ["urgent", "Skubiai!", "bolt", "Pro"]]]);
  if (can("ads")) G.push(["Įdarbinimas", [["eads", "Darbo skelbimai", "briefcase", E.ads.reduce((a, x) => a + x.cands.filter((c) => c[1] === "new").length, 0)]]]);
  const co = [...(can("team") ? [["team", "Komanda", "team", "Pro"]] : []), ...(can("stats") ? [["stats", "Statistika", "pie"]] : []), ...(can("plans") ? [["plans", "Planai", "card"]] : [])];
  if (co.length) G.push(["Įmonė", co]);
  return {
    cta: can("create") ? "Naujas darbo pasiūlymas" : "",
    groups: G,
    tabs: r === "site" ? [["overview", "Apžvalga", "overview", attn], ["active", "Objektai", "jobs"], ["urgent", "Skubiai!", "bolt"]] : [["overview", "Apžvalga", "overview", attn], ["active", "Darbai", "jobs"], ["new", "", "plus"], ["calendar", "Kalendorius", "cal"], ...(can("ads") ? [["eads", "Skelbimai", "briefcase", E.ads.reduce((a, x) => a + x.cands.filter((c) => c[1] === "new").length, 0)]] : [["favorites", "Mėgstami", "heart"]])],
    who: r === "owner" ? ["UP", "UAB Pavyzdinė statyba", PLN[PLAN()], true] : [ROLES[PK()].ini, ROLES[PK()].name, "UAB Pavyzdinė statyba", false]
  };
}

function badgeHTML(b) {
  if (b === undefined || b === null || b === "") return "";
  if (b === "Pro") return `<em class="badge pro">Pro</em>`;
  if (typeof b === "string") return `<em class="badge hot txt">${b}</em>`;
  return b ? `<em class="badge hot">${b}</em>` : "";
}

function menuHTML(drawer) {
  const M = menuDef();
  const curView = S.view === "job" ? "active" : S.view === "endedJob" ? "ended" : S.view === "wjob" ? (S.worker.invites.some((x) => x.id === S.wJobId) ? "invites" : "jobs") : S.view === "whist" ? "history" : S.view === "new" ? "__" : S.view === "ead" || S.view === "eadnew" ? "eads" : S.view === "ad" ? "ads" : S.view;
  let h = `<div class="sidetop"><a class="logo" href="#" data-go="overview" aria-label="statybos24.lt"><img class="full" src="${LOGO_LIGHT}" alt="statybos24.lt"><img class="mark" src="${MARK_LIGHT}" alt=""></a>${drawer ? `<button type="button" class="closebtn" data-close aria-label="Uždaryti meniu">${svg("x", 20, 2.2)}</button>` : ""}</div>`;
  if (!drawer) h += `<button type="button" class="railtab" data-rail aria-label="${S.rail ? "Išskleisti meniu" : "Suskleisti meniu"}" title="${S.rail ? "Išskleisti meniu" : "Suskleisti meniu"}" aria-expanded="${!S.rail}">${svg(S.rail ? "right" : "left", 14, 2.4).replace(S.rail ? I.right : I.left, S.rail ? '<path d="m9 18 6-6-6-6"/>' : '<path d="m15 18-6-6 6-6"/>')}</button>`;
  if (M.cta) h += `<button type="button" class="cta ring" data-go="new" title="${M.cta}" aria-label="${M.cta}">${svg("plus", 18, 2.4)}<span class="t">${M.cta}</span></button>`;
  h += `<nav class="navwrap" aria-label="Pagrindinis meniu">`;
  M.groups.forEach(([label, items]) => {
    h += `<div class="group"><div class="glabel">${label}</div><div class="glabel-sep" aria-hidden="true"></div>`;
    items.forEach(([k, t, ic, b]) => { h += `<button type="button" class="item" data-go="${k}" title="${t}"${curView === k ? ' aria-current="page"' : ""}>${svg(ic)}<span>${t}</span>${badgeHTML(b)}</button>`; });
    h += `</div>`;
  });
  h += `</nav><div class="spacer"></div>`;
  h += `<div class="drawdemo"><div class="seg" role="group" aria-label="Prototipas: peržiūrėti kaip"><button type="button" data-role="worker" aria-pressed="${S.role === "worker"}">Darbuotojas</button><button type="button" data-role="employer" aria-pressed="${S.role === "employer"}">Darbdavys</button><button type="button" data-role="admin" aria-pressed="${S.role === "admin"}">Admin</button></div><button type="button" class="linkbtn" data-act="reset" title="Atstatyti pavyzdinius duomenis">↺</button></div>`;
  const w = M.who;
  const prof = S.role === "worker" ? "profile" : S.role === "admin" ? "audit" : "company";
  h += `${S.role === "worker" ? `<button type="button" class="free2${S.free ? " on" : ""}${busyJob() ? " lock" : ""}" data-act="free" role="switch" aria-checked="${S.free}" aria-disabled="${!!busyJob()}" data-tip="${busyJob() ? `Dabar dirbate iki ${busyJob().to}. „Laisvas dabar“ galėsite įjungti pasibaigus darbui.` : S.free ? `Įjungta. ${S.freeFav ? "Jūsų mėgstamos įmonės" : "Darbdaviai"} „Skubiai!“ paieškoje mato jūsų telefono numerį ir gali skambinti dėl darbo šiandien.` : `Įjunkite, jei galite atvykti dirbti dabar. ${S.freeFav ? "Jūsų mėgstamos įmonės" : "Darbdaviai"} „Skubiai!“ paieškoje matys jūsų telefono numerį.`}"><span class="fdot"></span><span class="ftx"><b>Laisvas dabar</b></span><span class="sw"><i></i></span></button>` : ""}<div class="who2"><button type="button" class="wcard" data-go="${prof}" title="Profilis"${S.view === prof ? ' aria-current="page"' : ""}><span class="av${w[3] ? " co" : ""}">${w[0]}</span><span class="wtx"><b>${w[1]}</b><small>${w[2]}</small></span></button><button type="button" class="wout" data-act="logout" title="Atsijungti" aria-label="Atsijungti">${svg("out", 18)}</button></div>`;
  return h;
}

function tabsHTML() {
  const cur = S.view === "job" ? "active" : S.view === "wjob" ? (S.worker.invites.some((x) => x.id === S.wJobId) ? "invites" : "jobs") : S.view;
  return menuDef().tabs.map(([k, t, ic, b]) => {
    if (k === "new") return `<button type="button" class="tab plus" data-go="new" aria-label="Naujas darbo pasiūlymas"><span class="p">${svg("plus", 24, 2.6)}</span></button>`;
    if (k === "more") return `<button type="button" class="tab" data-open aria-label="Daugiau meniu punktų">${svg(ic, 22)}${t}</button>`;
    return `<button type="button" class="tab" data-go="${k}"${cur === k ? ' aria-current="page"' : ""}>${b ? '<span class="dot"></span>' : ""}${svg(ic, 22)}${t}</button>`;
  }).join("");
}

const demoBar = () => `<div class="demo demo-float" role="region" aria-label="Prototipo nustatymai"><span><strong>Prototipas</strong> · visi duomenys pavyzdiniai</span><div class="row" style="gap:6px"><div class="seg" role="group" aria-label="Paskyros tipas"><button type="button" data-role="worker" aria-pressed="${S.role === "worker"}">Darbuotojas</button><button type="button" data-role="employer" aria-pressed="${S.role === "employer"}">Darbdavys</button><button type="button" data-role="admin" aria-pressed="${S.role === "admin"}">Admin</button></div><button type="button" class="btn sm ghost" data-act="reset" title="Grąžinti pradinius pavyzdinius duomenis">Atstatyti</button></div></div>`;


/* ---------- Pilnas darbo puslapis ---------- */
const mapLink = (addr) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
function archSection(role, title) {
  const n = (t) => String(t || "").toLocaleLowerCase("lt-LT");
  const box = role === "worker" ? S.worker : S.emp;
  const list = (box.archive || []).filter((c) => n(c.job) === n(title));
  if (!list.length) return "";
  return `<section class="card jd-sec"><h2 class="sr">Darbo pokalbiai</h2><div class="archnote">${svg("shield", 18)}<div><b>Pokalbis uždarytas ir išsaugotas</b><p>Darbas baigtas, todėl rašyti nebegalima. Susirašinėjimas išsaugotas tam atvejui, jei kiltų ginčas dėl atvykimo, darbo laiko ar atlygio – jį galite atsisiųsti PDF formatu ir pateikti kaip įrodymą.</p><div class="row" style="gap:8px;margin-top:10px">${list.map((c) => `<button type="button" class="btn sm dark" data-act="pdfChat" data-id="${c.id}" data-job="${esc(title)}">${svg("download", 15, 2.2)}Atsisiųsti PDF${list.length > 1 ? ` · ${c.kind === "group" ? "darbo pokalbis" : "privatus"}` : ""}</button>`).join("")}</div></div></div></section>`;
}
function jobDetail(j, o) {
  const dd = dOff(j.d);
  const dateTxt = `${WD[dd.getDay()]}, ${["sausio","vasario","kovo","balandžio","gegužės","birželio","liepos","rugpjūčio","rugsėjo","spalio","lapkričio","gruodžio"][dd.getMonth()]} ${dd.getDate()} d.`;
  const descParas = String(j.desc || "Darbo aprašymas nepateiktas.").split(/(?<=\.)\s+/).filter(Boolean);
  return `<header class="jd-hero"><div class="jd-titlerow"><h1>${up(j.title)}</h1>${o.pills || ""}</div>
    <div class="jd-meta">${o.company ? `${S.role === "worker" ? favBtn(o.company) : ""}<span class="jd-co-chip"><span class="av co sm">${ini(o.company.replace(/^(UAB|MB)\s+/, ""))}</span>${esc(o.company)}${awardBadges(o.company, "company", 20)}</span>` : ""}<span>${svg("pin", 16)}${esc(j.city || "")}</span>${j.km ? `<span>${svg("car", 16)}${j.km} km · ~${j.min} min.</span>` : ""}${o.metaExtra || ""}</div></header>
  <div class="jd-grid">
    <div class="jd-main">
      ${o.alert || ""}
      <section class="card jd-sec"><h2>Darbo aprašymas</h2><div class="jd-desc">${descParas.map((p) => `<p>${esc(p)}</p>`).join("")}</div></section>
      <section class="card jd-sec"><h2>Laikas, vieta ir sąlygos</h2>
        <dl class="jd-dl">
          <div><dt>${svg("cal", 17)}Data</dt><dd>${dateLabel(j.d)}</dd></div>
          <div><dt>${svg("clock", 17)}Darbo laikas</dt><dd>${j.from}–${j.to}</dd></div>
          <div><dt>${svg("clock", 17)}Pietų pertrauka</dt><dd>${esc(j.lunch || "Pietų pertraukos nėra")}</dd></div>
          <div><dt>${svg("pin", 17)}Atvykti adresu</dt><dd>${esc(j.addr)}<a class="jd-map" href="${mapLink(j.addr)}" target="_blank" rel="noopener">Rodyti žemėlapyje ↗</a></dd></div>
          <div><dt>${svg("car", 17)}Atvykimas į darbo vietą</dt><dd>${esc(j.arrival || "Darbuotojas atvyksta pats")}</dd></div>
          ${o.extraRows || ""}
        </dl>
      </section>
      ${o.mainExtra || ""}
    </div>
    <aside class="jd-side">
      ${o.hidePay ? "" : `<section class="card jd-pay"><span class="jd-paylab">Atlygis ${j.gross ? "ant popieriaus" : "į rankas"}</span><b>${j.pay} €</b><span>${j.unit === "day" ? "už dieną" : "už valandą"}</span></section>`}
      ${o.actions ? `<section class="card jd-act">${o.actions}</section>` : ""}
      ${o.side || ""}
    </aside>
  </div>`;
}

/* ---------- Darbo skelbimai ---------- */
const AD_ST = { sent: ["Išsiųsta", "blue"], viewed: ["Peržiūrėta", "blue"], interview: ["Kviečia pokalbiui", "green"], rejected: ["Atmesta", ""] };
const salKind = (a) => a.gross ? "ant popieriaus" : "į rankas";
const salTxt = (a) => a.sal[0] === a.sal[1] ? `${a.sal[0].toLocaleString("lt-LT")} €` : `${a.sal[0].toLocaleString("lt-LT")}–${a.sal[1].toLocaleString("lt-LT")} €`;
const coAv = (n) => `<span class="av co sm" style="border:1px solid var(--line)">${ini(n.replace(/^(UAB|MB)\s+/, ""))}</span>`;
const AD_CITIES = ["Vilnius", "Kaunas", "Klaipėda", "Šiauliai", "Panevėžys", "Alytus", "Marijampolė", "Utena"];
function adSaveBtn(a, lab) { return `<button type="button" class="favbtn adsave${a.saved ? " on" : ""}${lab ? " lab" : ""}" data-act="adSave" data-id="${a.id}" aria-pressed="${!!a.saved}" ${lab ? "" : `title="${a.saved ? "Pašalinti iš įsimintų" : "Įsiminti skelbimą"}"`}>${heartSVG(lab ? 16 : 17, !!a.saved)}${lab ? (a.saved ? "Įsimintas" : "Įsiminti") : ""}</button>`; }
function adCard(a) {
  return `<article class="job" data-act="openAd" data-id="${a.id}" tabindex="0" role="link" aria-label="${esc(up(a.title))}"><div class="jm"><div class="jtop"><h3>${up(a.title)}</h3><div class="row jpills">${a.status && a.cvReq && !a.cvSent && a.status !== "rejected" ? pill("Prašo CV", "orange") : ""}${a.status ? pill(...AD_ST[a.status]) : a.nudged ? pill("Kviečia kandidatuoti", "orange") : ""}${isMutual(a.company) ? teamPill() : ""}</div></div>${coLine(a.company)}<div class="adsal-m"><b>${salTxt(a)}</b> ${salKind(a)} / mėn.</div></div><div class="adsal"><b>${salTxt(a)}</b><span>${salKind(a)} / mėn.</span></div>${a.status ? "" : adSaveBtn(a)}<span class="jgo" aria-hidden="true">${svg("right", 18, 2).replace(I.right, '<path d="m9 18 6-6-6-6"/>')}</span></article>`;
}
function wAds() {
  const tab = S.adTab || "all", city = S.adCity || "Visi";
  const inCity = (a) => city === "Visi" || a.city === city;
  const all = S.ads.filter(inCity).sort((a, b) => isFavCo(b.company) - isFavCo(a.company));
  const saved = S.ads.filter((a) => a.saved), mine = S.ads.filter((a) => a.status);
  const list = tab === "mine" ? mine : tab === "saved" ? saved.filter(inCity) : all;
  const cities = ["Visi", ...AD_CITIES];
  return `<div class="head"><div><h1>Darbo skelbimai</h1><p class="lead">Nuolatinis darbas statybose. Kandidatuokite su savo statybos24 profiliu – CV nereikia.</p></div></div>
  <div class="adbar"><div class="toggle2 sm adtabs" role="group" aria-label="Skelbimai"><button type="button" data-act="adTab" data-v="all" aria-pressed="${tab === "all"}">Visi skelbimai</button><button type="button" data-act="adTab" data-v="saved" aria-pressed="${tab === "saved"}">${heartSVG(14, tab === "saved")}Įsiminti <span class="cnt">${saved.length}</span></button><button type="button" data-act="adTab" data-v="mine" aria-pressed="${tab === "mine"}"><span class="hm">Mano kandidatūros</span><span class="hm2">Kandidatūros</span> <span class="cnt">${mine.length}</span></button></div>
  ${tab !== "mine" ? `<label class="field adcity" for="ad-city"><span class="sr">Miestas</span><select id="ad-city">${cities.map((c) => `<option value="${c}"${city === c ? " selected" : ""}>${c === "Visi" ? "Visi miestai" : `${c} (${S.ads.filter((a) => a.city === c).length})`}</option>`).join("")}</select></label>` : ""}</div>
  <section class="card">${list.length ? paged("ads-" + tab, list, adCard) : (tab === "mine" ? empty("Kandidatūrų dar nėra", "Atidarykite skelbimą ir paspauskite „Kandidatuoti“.", "briefcase") : tab === "saved" ? empty(saved.length ? "Šiame mieste įsimintų skelbimų nėra" : "Įsimintų skelbimų dar nėra", saved.length ? "Pasirinkite kitą miestą." : "Prie patikusio skelbimo paspauskite širdelę.", "briefcase") : empty("Šiame mieste skelbimų nėra", "Pasirinkite kitą miestą.", "briefcase"))}</section>`;
}
function wAd() {
  const a = S.ads.find((x) => x.id === S.adId); if (!a) return wAds();
  const st = a.status;
  const steps = [["sent", "Išsiųsta"], ["viewed", "Peržiūrėjo"], ["interview", "Pokalbis"]];
  const si = st === "rejected" ? -1 : steps.findIndex((x) => x[0] === st);
  const act = st ? `<div class="adtrack">${st === "rejected" ? `<p class="small muted" style="margin:0">Įmonė pasirinko kitą kandidatą.</p>` : steps.map(([k, t], i) => `<div class="ats${i <= si ? " on" : ""}"><i>${i <= si ? svg("check", 12, 3) : ""}</i><span>${t}</span></div>`).join("")}</div>${st !== "rejected" && a.cvReq ? (a.cvSent ? `<div class="cvbox ok">${svg("check", 15, 2.6)}<span><b>CV išsiųstas</b> ${esc(a.cvSent)}</span></div>` : `<div class="cvbox"><span class="ivk">Įmonė prašo CV</span><span>Jai trūksta informacijos apie jus. Įkelkite CV – jį matys tik ši įmonė.</span><label class="btn primary jd-wide cvup">${svg("upload", 16)}Įkelti CV<input type="file" id="cv-file" data-id="${a.id}" accept=".pdf,.doc,.docx,image/*" hidden></label></div>`) : ""}${st === "interview" && a.iv ? `<div class="ivcard"><span class="ivk">Pokalbis</span><b>${iso(dOff(a.iv.d))} · ${a.iv.t}</b><span>${IV_HOW[a.iv.how]}${a.iv.how === "live" ? ` · ${esc(a.iv.addr)}` : " – įmonė paskambins"}</span>${a.iv.how === "live" ? `<a class="jd-map" href="${mapLink(a.iv.addr)}" target="_blank" rel="noopener">Rodyti žemėlapyje ↗</a>` : ""}${a.iv.ok ? `<span class="ivok">${svg("check", 13, 3)}Patvirtinote</span>` : `<button class="btn primary jd-wide" type="button" data-act="ivOk" data-id="${a.id}">Patvirtinti pokalbį</button>`}</div>` : ""}<button class="btn jd-wide" type="button" data-act="toast" data-msg="Prototipe pokalbis su įmone neatidaromas">${svg("chat", 16)}Rašyti įmonei</button><button class="btn jd-wide" type="button" data-act="adWithdraw" data-id="${a.id}">Atšaukti kandidatūrą</button>`
    : `${a.nudged ? `<div class="nudge">${svg("send", 15, 2.2)}<span><b>Įmonė kviečia kandidatuoti.</b> Ji matė, kad įsiminėte skelbimą, ir jūsų profilis jai tinka.</span></div>` : ""}<button class="btn primary jd-wide" type="button" data-act="adApply" data-id="${a.id}">Kandidatuoti</button>${adSaveBtn(a, true)}<p class="small muted" style="margin:0;text-align:center">Įmonė matys jūsų profilį, patikimumą ir įvertinimus</p>`;
  return `<header class="jd-hero"><div class="jd-titlerow"><h1>${up(a.title)}</h1>${st ? pill(...AD_ST[st]) : ""}${isMutual(a.company) ? teamPill() : ""}</div>
    <div class="jd-meta">${favBtn(a.company)}<span class="jd-co-chip"><span class="av co sm">${ini(a.company.replace(/^(UAB|MB)\s+/, ""))}</span>${esc(a.company)}${awardBadges(a.company, "company", 20)}</span><span>${svg("pin", 16)}${esc(a.city)}</span><span>${svg("cal", 16)}Įkelta prieš ${a.posted} d.</span></div></header>
  <div class="jd-grid"><div class="jd-main">
    <section class="card jd-sec"><h2>Apie darbą</h2><div class="jd-desc"><p>${esc(a.desc)}</p></div></section>
    <section class="card jd-sec"><h2>Sąlygos</h2><dl class="jd-dl">
      <div><dt>${svg("file", 17)}Sutartis</dt><dd>${esc(a.contract)}</dd></div>
      <div><dt>${svg("clock", 17)}Darbo grafikas</dt><dd>${esc(a.sched)}</dd></div>
      <div><dt>${svg("cal", 17)}Darbo pradžia</dt><dd>${esc(a.start)}</dd></div>
      <div><dt>${svg("pin", 17)}Darbo vieta</dt><dd>${esc(a.addr)}<a class="jd-map" href="${mapLink(a.addr)}" target="_blank" rel="noopener">Rodyti žemėlapyje ↗</a></dd></div>
    </dl></section>
    <div class="adcols"><section class="card jd-sec"><h2>Reikalavimai</h2><ul class="adlist">${a.req.map((r) => `<li>${svg("check", 15, 2.4)}${esc(r)}</li>`).join("")}</ul></section>
    <section class="card jd-sec"><h2>Siūlome</h2><ul class="adlist">${a.offer.map((r) => `<li>${svg("check", 15, 2.4)}${esc(r)}</li>`).join("")}</ul></section></div>
  </div><aside class="jd-side">
    <section class="card jd-pay"><span class="jd-paylab">Atlyginimas ${salKind(a)}</span><b>${salTxt(a)}</b><span>per mėnesį</span></section>
    <section class="card jd-act">${act}<button class="btn jd-wide" type="button" data-act="companyModal" data-v="${esc(a.company)}">${svg("home", 16)}Įmonės profilis</button></section>
    <p class="small muted adexp">Skelbimas galioja dar ${a.until} d.</p>
  </aside></div>`;
}
function eAds() {
  const A = E().ads;
  return `<div class="head"><div><h1>Darbo skelbimai</h1><p class="lead">Nuolatiniai darbuotojai su patikrinta darbo istorija.</p></div><button class="btn primary" type="button" data-act="eAdNew">${svg("plus", 16, 2.4)}Naujas skelbimas</button></div>
  <section class="card">${A.length ? `<div class="list">${A.map((a) => { const nw = a.cands.filter((c) => c[1] === "new").length; return `<article class="job" data-act="openEAd" data-id="${a.id}" tabindex="0" role="link" aria-label="${esc(up(a.title))}"><div class="jm"><div class="jtop"><h3>${up(a.title)}</h3><div class="row jpills">${nw ? pill(`${nw} ${nw === 1 ? "nauja kandidatūra" : "naujos kandidatūros"}`, "orange") : ""}${pill(`Aktyvus · liko ${a.until} d.`, "green")}</div></div><div class="metrics"><span>${svg("people", 16)}<b>${a.cands.length}</b> kandidatai</span><span>${svg("search", 16)}<b>${a.views}</b> peržiūros</span><span class="msave">${heartSVG(15, false)}<b>${(a.saves || []).length}</b> įsiminė</span><span>${svg("pin", 16)}${esc(a.city)}</span></div><div class="adsal-m"><b>${salTxt(a)}</b> ${salKind(a)} / mėn.</div></div><div class="adsal"><b>${salTxt(a)}</b><span>${salKind(a)} / mėn.</span></div><span class="jgo" aria-hidden="true">${svg("right", 18, 2).replace(I.right, '<path d="m9 18 6-6-6-6"/>')}</span></article>`; }).join("")}</div>` : empty("Skelbimų dar nėra", "Sukurkite skelbimą – kandidatai kandidatuos su savo statybos24 profiliu.", "briefcase")}</section>`;
}
function eAdNewPage() {
  const sec = (n, t, body, extra = "") => `<section class="card afsec"><header class="afh"><span class="afn">${n}</span><h2>${t}</h2>${extra}</header>${body}</section>`;
  const A = S.adEditId ? E().ads.find((x) => x.id === S.adEditId) : null, V = (x) => A ? ` value="${esc(String(x ?? ""))}"` : "", sel = (cur, o) => `<option${A && cur === o ? " selected" : ""}>${o}</option>`;
  return `<div class="head"><div><h1>${A ? "Redaguoti skelbimą" : "Naujas darbo skelbimas"}</h1><p class="lead">${A ? `Galioja dar ${A.until} d. Pakeitimai matomi iš karto.` : "Skelbimas galios 30 dienų."}</p></div></div>
  <div class="jd-grid adnew"><div class="jd-main">
    ${sec(1, "Pareigos ir vieta", `<div class="form"><label class="field wide" for="na-t">Pareigos *<input id="na-t" data-pv="t" placeholder="Pvz. Statybų darbininkas"${V(A && A.title)}></label><label class="field" for="na-c">Miestas *<select id="na-c" data-pv="c">${["Vilnius", "Kaunas", "Klaipėda"].map((o) => sel(A && A.city, o)).join("")}</select></label><label class="field" for="na-k">Sutartis<select id="na-k" data-pv="k">${["Neterminuota darbo sutartis", "Terminuota sutartis · 6 mėn.", "Terminuota sutartis", "Individuali veikla"].filter((o, i) => i !== 1 || (A && A.contract === o)).map((o) => sel(A && A.contract, o)).join("")}</select></label></div>`)}
    ${sec(2, "Atlyginimas", `<div class="form"><label class="field" for="na-s1">Nuo *<span class="inpx"><input id="na-s1" data-pv="s" inputmode="numeric" placeholder="1600"${V(A && A.sal[0])}><em>€ / mėn.</em></span></label><label class="field" for="na-s2">Iki<span class="inpx"><input id="na-s2" data-pv="s" inputmode="numeric" placeholder="1900"${V(A && A.sal[1])}><em>€ / mėn.</em></span></label></div>`, `<div class="segs" role="radiogroup" aria-label="Atlyginimo tipas"><label><input type="radio" name="na-g2" value="net" data-pv="g"${A && A.gross ? "" : " checked"}><span>Į rankas</span></label><label><input type="radio" name="na-g2" value="gross" data-pv="g"${A && A.gross ? " checked" : ""}><span>Ant popieriaus</span></label></div>`)}
    ${sec(3, "Darbo laikas", `<div class="form"><label class="field" for="na-g">Darbo grafikas<input id="na-g" data-pv="g2" placeholder="Pvz. I–V · 08:00–17:00"${V(A && A.sched)}></label><label class="field" for="na-st">Darbo pradžia<input id="na-st" placeholder="Pvz. Iš karto"${V(A && A.start)}></label></div>`)}
    ${sec(4, "Aprašymas", `<div class="form"><label class="field wide" for="na-d">Apie darbą *<textarea id="na-d" placeholder="Ką reikės dirbti, kur, su kuo">${A ? esc(A.desc || "") : ""}</textarea></label><label class="field" for="na-r">Reikalavimai<textarea id="na-r" placeholder="Kiekvienas iš naujos eilutės">${A ? esc((A.req || []).join("\n")) : ""}</textarea></label><label class="field" for="na-o">Siūlome<textarea id="na-o" placeholder="Kiekvienas iš naujos eilutės">${A ? esc((A.offer || []).join("\n")) : ""}</textarea></label></div>`)}
  </div><aside class="jd-side">
    <section class="card adpv"><small class="pvlab">Taip matys darbuotojai</small>
      <div class="adpv-card"><b class="adpv-t" id="pv-t">PAREIGOS</b><div class="co-line"><div class="av co sm" style="border:1px solid var(--line)">UP</div><div><b class="nm">UAB Pavyzdinė statyba</b><small id="pv-c">Vilnius · Neterminuota darbo sutartis</small></div></div><div class="adpv-sal"><b id="pv-s">— €</b><span id="pv-g">į rankas / mėn.</span></div><small class="muted" id="pv-g2"></small></div>
    </section>
    <section class="card jd-act">${A ? "" : `<div class="adfee">${hasPlan("pro") ? `<span>Skelbimo kaina</span><b>0 €</b><small>Įskaičiuota į Business Pro</small>` : `<span>Skelbimo kaina</span><b>9,99 € <em>/ mėn.</em></b><small>Business Pro plane – nemokamai</small>`}</div>`}<button class="btn primary jd-wide" type="button" data-act="eAdSave">${A ? "Išsaugoti pakeitimus" : "Paskelbti skelbimą"}</button><button class="btn jd-wide" type="button" data-act="adEditCancel">Atšaukti</button></section>
  </aside></div>`;
}
const IV_HOW = { live: "Gyvai", phone: "Telefonu" };
function ivLine(iv, emp) { return `<div class="ivline">${svg("cal", 15, 2.2)}<span><b>Pokalbis ${iso(dOff(iv.d)).slice(5)} ${iv.t}</b> · ${IV_HOW[iv.how]}${iv.how === "live" ? ` · ${esc(iv.addr)}` : ""}</span>${emp ? (iv.ok ? `<em class="ok">${svg("check", 12, 3)}Patvirtino</em>` : `<em>Laukiama patvirtinimo</em>`) : ""}</div>`; }
function eAd() {
  const a = E().ads.find((x) => x.id === S.eAdId); if (!a) return eAds();
  const F = S.candF || "all";
  const worked = new Set(E().favorites.map((f) => f[0]));
  let C = a.cands.filter((c) => F === "all" || (F === "rel" && WORKERS[c[0]].att >= 95) || (F === "worked" && worked.has(c[0])) || (F === "docs" && (WDOCS[c[0]] || []).length));
  C = C.sort((x, y) => (MUTUAL_W.includes(y[0]) - MUTUAL_W.includes(x[0])) || (WORKERS[y[0]].att - WORKERS[x[0]].att));
  const c5 = Object.fromEntries(a.cands.map((c) => [c[0], c[5]]));
  const row = eAdRow(a, worked, c5), CL = C.filter((c) => c[1] !== "interview"), IV = a.cands.filter((c) => c[1] === "interview").sort((x, y) => x[4].d - y[4].d);
  return `<header class="jd-hero"><div class="jd-titlerow"><h1>${up(a.title)}</h1>${pill(`Aktyvus · liko ${a.until} d.`, "green")}</div><div class="jd-meta"><span>${svg("pin", 16)}${esc(a.city)}</span><span>${svg("euro", 16)}${salTxt(a)} ${salKind(a)} / mėn.</span><span>${svg("file", 16)}${esc(a.contract)}</span><span>${svg("clock", 16)}${esc(a.sched)}</span></div></header>
  <section class="card"><header><div><h2>Kandidatai <span class="muted">· ${a.cands.filter((c) => c[1] !== "interview").length}</span></h2></div><div class="row" style="gap:8px"><button class="btn sm" type="button" data-act="adEdit" data-id="${a.id}">Redaguoti</button><button class="btn sm" type="button" data-act="adExt" data-id="${a.id}">Pratęsti</button></div></header>
  <div class="chips" role="group" aria-label="Filtras">${[["all", "Visi"], ["rel", "Patikimumas 95+"], ["worked", "Dirbo su mumis"], ["docs", "Turi pažymėjimų"]].map(([k, t]) => `<button type="button" class="chip" data-act="candF" data-v="${k}" aria-pressed="${F === k}">${t}</button>`).join("")}</div>
  <div class="list">${CL.length ? CL.map(row).join("") : empty(F === "all" ? "Naujų kandidatų nėra" : "Pagal šį filtrą kandidatų nėra", F === "all" ? "Pakviestieji pokalbiui rodomi žemiau." : "Pasirinkite kitą filtrą.", "people")}</div></section>
  <section class="card ivsec"><header><div><h2>${svg("cal", 17, 2.2)} Pakviesti pokalbiui <span class="muted">· ${IV.length}</span></h2></div></header><div class="list">${IV.length ? IV.map(row).join("") : `<p class="small muted" style="padding:6px 2px;margin:0">Dar nieko nepakvietėte. Prie kandidato spauskite „Kviesti pokalbiui“.</p>`}</div></section>
  ${eAdSaved(a, worked)}`;
}
function eAdRow(a, worked, c5) { return ([id, st, msg, d, iv]) => { const w = WORKERS[id]; const cv = c5[id], cvB = cv === "got" ? "" : cv === "req" ? `<span class="pill cvp">${svg("clock", 13, 2.2)}CV prašoma</span>` : `<button class="btn sm" type="button" data-act="cvReq" data-ad="${a.id}" data-id="${id}">${svg("file", 14)}Prašyti CV</button>`;
    const prof = `<button class="btn sm" type="button" data-act="profileW" data-id="${id}">${svg("user", 14)}Profilis</button>`;
    const acts = st === "rejected" ? `${pill("Atmesta")}${prof}` : st === "interview" ? `<button class="btn sm" type="button" data-act="ivOpen" data-ad="${a.id}" data-id="${id}">Keisti laiką</button><button class="btn sm" type="button" data-act="adChat" data-ad="${a.id}" data-id="${id}">${svg("chat", 14)}Rašyti</button>${cvB}${prof}` : `<button class="btn sm primary" type="button" data-act="ivOpen" data-ad="${a.id}" data-id="${id}">Kviesti pokalbiui</button>${cvB}<button class="btn sm" type="button" data-act="candSet" data-ad="${a.id}" data-id="${id}" data-v="rejected">Atmesti</button>${prof}`;
    return `<div class="wk cand">${wAv(w)}<div class="wn"><div class="cnm"><b class="nm">${esc(w.name)}</b><small class="cmeta">${esc(w.active)}<i>•</i>Kandidatavo prieš ${d || 1} d.</small></div><div class="tags">${st === "new" ? pill("Nauja", "orange") : ""}${MUTUAL_W.includes(id) ? `<span class="likesus">${svg("people", 13, 2.2)}Nuolatinė komanda</span>` : worked.has(id) ? `<span class="tag">Dirbo su jumis</span>` : ""}${c5[id] === "got" ? docTag(id, "CV") : ""}${(WDOCS[id] || []).map((t) => docTag(id, t)).join("")}</div>${msg ? `<p class="candmsg">„${esc(msg)}“</p>` : ""}${st === "interview" && iv ? ivLine(iv, true) : ""}</div><div class="wa cva">${acts}</div></div>`; }; }
function eAdSaved(a, worked) { return `${(() => { const sv = (a.saves || []).filter((id) => !a.cands.some((c) => c[0] === id)); return `<section class="card"><header><div><h2>${heartSVG(17, true)} Įsiminė skelbimą <span class="muted">· ${sv.length}</span></h2><p class="small muted" style="margin:2px 0 0">Dar nekandidatavo</p></div></header><div class="list">${sv.length ? sv.map((id) => { const w = WORKERS[id], sent = (a.nudged || []).includes(id); return `<div class="wk fw">${wAv(w)}<div class="fwm"><div class="fwt"><b class="nm">${esc(w.name)}</b><small class="muted">${esc(w.active)}</small>${MUTUAL_W.includes(id) ? `<span class="likesus">${svg("people", 13, 2.2)}Nuolatinė komanda</span>` : worked.has(id) ? `<span class="tag">Dirbo su jumis</span>` : ""}</div></div><div class="wa">${sent ? pill("Pakviestas kandidatuoti", "green") : `<button class="btn sm" type="button" data-act="adNudge" data-ad="${a.id}" data-id="${id}">${svg("send", 15)}Pakviesti kandidatuoti</button>`}<button class="btn sm" type="button" data-act="profileW" data-id="${id}">${svg("user", 15)}Profilis</button></div></div>`; }).join("") : `<p class="small muted" style="padding:6px 2px;margin:0">Kol kas niekas neįsiminė.</p>`}</div></section>`; })()}`;
}
function docsSection() {
  const D = S.worker.docs || [];
  const stt = (d) => d.until < 0 ? pill("Nebegalioja", "red") : d.until <= 30 ? pill(`Baigiasi po ${d.until} d.`, "orange") : pill("Galioja", "green");
  return `<section class="card setsec"><header><div><h2>Pažymėjimai ir dokumentai</h2></div><button class="btn sm" type="button" data-act="docAdd">${svg("plus", 15, 2.4)}Pridėti</button></header>
  ${D.length ? `<div class="setlist">${D.map((d) => `<div class="setrow docrow"><span class="setic">${svg("file", 18)}</span><div class="settx"><b>${esc(d.type)}</b><span>Galioja iki ${iso(dOff(d.until))} · ${esc(d.file)}</span></div>${stt(d)}<button type="button" class="iconb" data-act="docVis" data-id="${d.id}" title="${d.show ? "Matoma darbdaviams" : "Paslėpta nuo darbdavių"}" aria-pressed="${d.show}">${d.show ? svg("eye", 16) : svg("lock", 16)}</button><button type="button" class="iconb del" data-act="docDel" data-id="${d.id}" title="Ištrinti">${svg("x", 16, 2.2)}</button></div>`).join("")}</div>` : `<p class="muted small" style="margin:0">Įkelkite pažymėjimus – darbdaviai juos matys prie jūsų profilio.</p>`}</section>`;
}
/* ---------- Darbuotojo ekranai ---------- */
const MON_L = ["Sausis", "Vasaris", "Kovas", "Balandis", "Gegužė", "Birželis", "Liepa", "Rugpjūtis", "Rugsėjis", "Spalis", "Lapkritis", "Gruodis"];
const fmtH = (h) => `${Math.floor(h)} val.${h % 1 ? " 30 min." : ""}`;
const EARN = (() => {
  const rows = [["Krovos darbai sandėlyje", "UAB Baltijos sandėliai", 0, 8, 13, "hour"], ["Fasado pastolių nešimas", "UAB Statybų partneris", -6, 7.5, 14, "hour"], ["Medžiagų iškrovimas", "UAB Baltijos sandėliai", -13, 6, 13, "hour"], ["Betonavimo pagalba", "MB Pamatų meistrai", -20, 8, 120, "day"], ["Statybvietės tvarkymas", "UAB Statybų partneris", -24, 6.5, 14, "hour"], ["Tvarkymo darbai objekte", "UAB Statybų partneris", -26, 6, 14, "hour"], ["Krovos darbai", "UAB Rytų rangovai", -28, 6, 13, "hour"]].map(([t, c, d, h, p, u]) => ({ t, c, d, h, p, u, sum: Math.round(u === "day" ? p : h * p) }));
  return { rows, hours: rows.reduce((a, r) => a + r.h, 0), total: rows.reduce((a, r) => a + r.sum, 0) };
})();
function todayHero() {
  const W = S.worker;
  const j = W.jobs.find((x) => x.d === 0 && ["live", "arrived", "workedWait"].includes(x.state)) || W.jobs.find((x) => x.d === 1 && x.state === "waiting");
  if (!j) return "";
  const today = j.d === 0, tel = (j.phone || "").replace(/\s/g, "");
  const conv = W.convs.find((c) => c.kind === "group" && c.job === j.title);
  const main = today && j.state === "live" ? `<button class="btn green" type="button" data-act="arrive" data-id="${j.id}">${svg("check", 17, 2.6)}Atvykau</button>` : "";
  return `<section class="thero${today ? "" : " tmr"}"><div class="th-l"><span class="th-eb"><i></i>${today ? "Šiandien dirbate" : "Rytoj dirbate"}</span>
    <button type="button" class="th-title" data-act="details" data-id="${j.id}">${up(j.title)}</button>
    <div class="th-meta"><span>${svg("clock", 16)}<b>${j.from}–${j.to}</b></span><span>${svg("pin", 16)}${esc(j.addr)}${j.km ? ` · ${j.km} km` : ""}</span><span>${svg("home", 16)}${esc(j.company)}</span></div>
    ${j.state === "arrived" ? `<span class="th-ok">${svg("check", 14, 2.8)}Atvykimas užfiksuotas</span>` : ""}</div>
    <div class="th-acts">${main}<a class="btn th-g" href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(j.addr)}" target="_blank" rel="noopener">${svg("nav", 16)}Nuvesti</a>${tel ? `<a class="btn th-g" href="tel:${tel}">${svg("phone", 16)}Skambinti</a>` : ""}${conv ? `<button class="btn th-g" type="button" data-act="chatWith" data-id="${conv.id}">${svg("chat", 16)}Pokalbis</button>` : ""}</div></section>`;
}
function ovRingCard(key, label, val, max, color, unit, sub) {
  const R = 40, C = 2 * Math.PI * R, open = S.ovOpen === key;
  return `<button type="button" class="ovcard ovbtn${open ? " sel" : ""}" data-act="ovOpen" data-v="${key}" aria-expanded="${open}"><span class="ovtop"><small>${label}</small></span><div class="ovrrow"><svg viewBox="0 0 100 100" width="92" height="92" aria-hidden="true"><circle cx="50" cy="50" r="${R}" fill="none" stroke="var(--line)" stroke-width="10"/><circle cx="50" cy="50" r="${R}" fill="none" stroke="${color}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - val / max)}" transform="rotate(-90 50 50)"/><text x="50" y="50" text-anchor="middle" font-family="Manrope,Inter,sans-serif" font-weight="800" font-size="24" fill="var(--navy)">${String(val).replace(".", ",")}</text><text x="50" y="66" text-anchor="middle" font-family="Inter,sans-serif" font-size="10" fill="var(--muted)">${unit}</text></svg><div class="ovrtx"><span>${sub}</span></div></div><span class="ovmore">${open ? "Slėpti" : "Plačiau"} ${svg("right", 14).replace(I.right, open ? '<path d="m18 15-6-6-6 6"/>' : '<path d="m6 9 6 6 6-6"/>')}</span></button>`;
}
function ovDetail(months, hrs) {
  const H = S.worker.history.filter((h) => h.result === "done");
  if (S.ovOpen === "rel") {
    const rows = [["Fasado pastolių nešimas", -6, "Atvyko laiku", "Išdirbo visą dieną", 0], ["Medžiagų iškrovimas", -13, "Atvyko laiku", "Išdirbo visą dieną", 0], ["Betonavimo pagalba", -20, "Atvyko laiku", "Išdirbo visą dieną", 0], ["Statybvietės tvarkymas", -27, "Atvyko laiku", "Išėjo anksčiau – suderinta", 0]];
    return `<div class="ovdet card"><header><div><h2>Atvykimo patikimumas</h2><p class="muted small">Kaip formuojasi jūsų 100 iš 100</p></div><button type="button" class="linkb" data-act="reliability">Taisyklės</button></header>
    <div class="ovkpis"><div><b>12</b><span>Darbo dienų iš viso</span></div><div><b>12</b><span>Atvyko laiku</span></div><div><b>0</b><span>Neatvykimai</span></div><div><b>1</b><span>Suderinti ankstyvi išėjimai</span></div><div><b>0</b><span>Nepagrįsti išėjimai</span></div></div>
    <div class="ovtl"><h3>Paskutinės darbo dienos</h3>${rows.map(([t, d, a, r, ch]) => `<div class="ovtlr"><span class="ovtld ok"></span><div><b>${up(t)}</b><span>${iso(dOff(d))} · ${a} · ${r}</span></div><em class="${ch < 0 ? "neg" : "zero"}">${ch < 0 ? ch : "±0"}</em></div>`).join("")}</div>
    <div class="infobox"><span class="infoic">${svg("shield", 20)}</span><div><b>Patikimumas nė karto nesumažėjo</b><p>Neatvykimas sumažina 7 taškais, nepagrįstas ankstyvas išėjimas – 3 taškais. Jei 30 dienų nėra pažeidimų, pridedamas 1 taškas.</p></div></div></div>`;
  }
  if (S.ovOpen === "rate") {
    const dist = [[10, 2], [9, 3], [8, 0], [7, 0], ["≤6", 0]], mxd = 3;
    const revs = [["UAB Statybų partneris", "Fasado pastolių nešimas", -6, 10, "Punktualus, gerai atliko užduotis."], ["UAB Baltijos sandėliai", "Medžiagų iškrovimas", -13, 9, "Viskas gerai, kviesime dar."], ["MB Pamatų meistrai", "Betonavimo pagalba", -20, 9, "Greitai susiorientavo objekte."], ["UAB Statybų partneris", "Tvarkymo darbai", -34, 10, "Labai tvarkingas darbas."], ["UAB Rytų rangovai", "Krovos darbai", -41, 9, "Rekomenduojame."]];
    return `<div class="ovdet card"><header><div><h2>Darbdavių įvertinimai</h2><p class="muted small">Vidurkis 9,4 iš 5 įvertinimų</p></div></header>
    <div class="ovsplit"><div class="ovdist">${dist.map(([k, n]) => `<div class="ovdr"><span>${k}</span><div class="ovdbar"><i style="width:${(n / mxd) * 100}%"></i></div><b>${n}</b></div>`).join("")}</div>
    <div class="ovrevs">${revs.map(([c, t, d, r, txt]) => `<div class="cpr"><span class="av co sm" style="border:1px solid var(--line)">${ini(c.replace(/^(UAB|MB)\s+/, ""))}</span><div><div class="cpr-top"><b>${esc(c)}</b><span class="cpr-score">${r}/10</span></div><p>${esc(txt)}</p><small>${up(t)} · ${iso(dOff(d))}</small></div></div>`).join("")}</div></div></div>`;
  }
  if (S.ovOpen === "hours") {
    return `<div class="ovdet card"><header><div><h2>Išdirbtas laikas ir uždarbis</h2><p class="muted small">${MON_L[TODAY.getMonth()]} · paskutiniai 6 mėnesiai</p></div><button type="button" class="linkb" data-act="earnPdf">${svg("download", 15, 2.2)} Ataskaita PDF</button></header>
    <div class="ovkpis"><div><b>${EARN.hours} val.</b><span>Išdirbta šį mėnesį</span></div><div><b>≈ ${EARN.total} €</b><span>Uždirbta į rankas</span></div><div><b>${EARN.rows.length}</b><span>Užbaigti darbai</span></div><div><b>${String((EARN.total / EARN.hours).toFixed(2)).replace(".", ",")} €</b><span>Vid. už valandą</span></div><div><b>${hrs.reduce((a, b) => a + b, 0)} val.</b><span>Per 6 mėn.</span></div></div>
    <div class="ovsplit"><div class="ovmonths">${months.map((m, i) => `<div class="ovdr"><span>${m}</span><div class="ovdbar nv"><i style="width:${(hrs[i] / 60) * 100}%"></i></div><b>${hrs[i]} val.</b></div>`).join("")}</div>
    <div class="ovtl"><h3>Šio mėnesio darbai</h3>${EARN.rows.map((r) => `<div class="ovtlr"><span class="ovtld nv"></span><div><b>${up(r.t)}</b><span>${iso(dOff(r.d))} · ${esc(r.c)} · ${fmtH(r.h)}</span></div><em class="money">${r.sum} €</em></div>`).join("")}</div></div></div>`;
  }
  return "";
}
function wOverview() {
  const W = S.worker;
  const pend = W.invites.filter((i) => i.status === "pending" && !i.conflict);
  const next = W.jobs.filter((j) => j.d >= 0).sort((a, b) => a.d - b.d)[0];
  const actions = W.jobs.filter((j) => ["live", "toClose"].includes(j.state)).length;
  const unread = W.convs.filter((c) => c.unread).length;
  const tile = (ic, lab, val, sub, go, hot) => `<button type="button" class="ovcard ntile${hot ? " hot" : ""}" ${go}><span class="ovtop"><small>${lab}</small><span class="ntic">${svg(ic, 18)}</span></span><b class="ovval">${val}</b><span class="ovsub">${hot ? '<i class="ovdot"></i>' : ""}${sub}</span></button>`;
  const months = [-5, -4, -3, -2, -1, 0].map((o) => { const d = new Date(TODAY); d.setMonth(d.getMonth() + o); return MON_S[d.getMonth()]; });
  const hrs = [22, 36, 30, 52, 41, 48], mx = 60;
  const relv = 100, R = 46, C = 2 * Math.PI * R;
  return `<h1 class="sr">Apžvalga</h1>${todayHero()}
  <section class="ovsec"><h2 class="sr">Dabar svarbiausia</h2><div class="ntiles">
    ${tile("mail", "Nauji kvietimai", pend.length, pend.length ? "Laukia jūsų atsakymo" : "Naujų kvietimų nėra", 'data-go="invites"', pend.length)}
    ${tile("euro", "Uždirbta šį mėnesį", `≈ ${EARN.total} €`, `${EARN.hours} val. · ${EARN.rows.length} darbai`, 'data-act="ovOpen" data-v="hours"', false)}
    ${tile("check", "Reikia veiksmo", actions, actions ? "Atvykimas ar dienos uždarymas" : "Veiksmų nėra", 'data-go="jobs"', actions)}
    ${tile("chat", "Naujos žinutės", unread, unread ? "Atidarykite pokalbį" : "Visos perskaitytos", 'data-act="openMessenger"', unread)}
  </div></section>
  <section class="ovsec"><h2 class="sect">Mano statistika</h2><div class="ovstats">
    ${ovRingCard("rel", "Atvykimo patikimumas", relv, 100, "var(--green)", "iš 100", "Neatvykimų 0 · ankstyvų išėjimų 0")}
    ${ovRingCard("rate", "Darbdavių įvertinimas", 9.4, 10, "var(--orange)", "iš 10", "Iš 5 įvertinimų")}
    <button type="button" class="ovcard ovhours ovbtn${S.ovOpen === "hours" ? " sel" : ""}" data-act="ovOpen" data-v="hours" aria-expanded="${S.ovOpen === "hours"}"><div class="ovh-top"><div><small>Šį mėnesį išdirbta</small><div class="ovbig">48<span> val.</span></div></div><div class="ovh-side"><b>≈ ${EARN.total} €</b><span>į rankas</span></div></div>
      <div class="minibars">${hrs.map((v, i) => `<div><i class="${i === 5 ? "now" : ""}" style="height:${(v / mx) * 100}%"></i><span>${months[i]}</span></div>`).join("")}</div><span class="ovmore">${S.ovOpen === "hours" ? "Slėpti" : "Plačiau"} ${svg("right", 14).replace(I.right, S.ovOpen === "hours" ? '<path d="m18 15-6-6-6 6"/>' : '<path d="m6 9 6 6 6-6"/>')}</span></button>
  </div>${ovDetail(months, hrs)}</section>`;
}

function wStatsBlock() {
  return `<section class="card"><header><div><h2>Mano statistika</h2></div><button class="btn sm" type="button" data-act="stats" aria-expanded="${S.statsOpen}">${S.statsOpen ? "Slėpti mano statistiką" : "Rodyti mano statistiką"}</button></header>
  ${S.statsOpen ? `<div class="stats">
    <div class="stat"><small>Šį mėnesį išdirbta</small><b>48 val.</b><span>6 darbo dienos</span></div>
    <div class="stat"><small>Užbaigti darbai</small><b>7</b><span>Visa patvirtinta istorija: 12</span></div>
    <button type="button" class="stat" data-act="reliability"><small>Atvykimo patikimumas</small><b style="color:var(--green)">100</b><span>Kaip skaičiuojama? Spauskite</span></button>
    <div class="stat"><small>Darbdavių įvertinimas</small><b>9,4</b><span>Iš 5 įvertinimų</span></div>
    <div class="stat"><small>Probleminės darbo dienos</small><b>0</b><span>Neatvykimai 0 · Ankstyvi išėjimai 0</span></div>
  </div>` : `<p class="muted small">Šį mėnesį išdirbta 48 val. · atvykimo patikimumas 100 · darbdavių įvertinimas 9,4.</p>`}</section>`;
}

function inviteCard(i) {
  const st = i.status === "pending" ? (i.conflict ? pill("Laikas sutampa su jau priimtu darbu", "red") : i.until ? (isMutual(i.company) ? teamPill() : "") + pill(`Atsakyti iki ${i.until}`, i.urgent ? "orange" : "blue") : "") : i.status === "accepted" ? pill("Priimta", "green") : i.status === "expired" ? pill("Nebegalioja") : pill("Atmesta");
  if (i.status === "pending" && i.conflict) { const cj = S.worker.jobs.find((j) => j.d === i.d); return `<article class="job locked" aria-disabled="true" data-tip="Šiuo laiku jau dirbate${cj ? `: ${up(cj.title)} ${cj.from}–${cj.to}` : ""}. Kvietimo priimti negalima."><div class="jm"><div class="jtop"><h3>${up(i.title)}</h3></div>${coLine(i.company)}</div><span class="jgo" aria-hidden="true">${svg("lock", 17, 2)}</span></article>`; }
  return `<article class="job" data-act="details" data-id="${i.id}" tabindex="0" role="link" aria-label="${esc(up(i.title))}"><div class="jm">
    <div class="jtop"><h3>${up(i.title)}</h3><div class="row jpills">${st}${i.unread ? pill("Nauja žinutė", "blue") : ""}</div></div>${coLine(i.company)}</div><span class="jgo" aria-hidden="true">${svg("right", 18, 2).replace(I.right, '<path d="m9 18 6-6-6-6"/>')}</span></article>`;
}


const PROOF_BOX = () => `<div class="infobox"><span class="infoic">${svg("camera", 22, 2)}</span><div><b>Išsaugokite atvykimo ir darbo pabaigos įrodymus</b><p>Atvykę ir baigę darbą, jei objekte leidžiama fotografuoti, padarykite po nuotrauką ir išsaugokite originalą telefone. Tai gali padėti kilus ginčui dėl atvykimo ar darbo laiko.</p><small>Venkite fotografuoti žmones, dokumentus ar kitą jautrią informaciją.</small></div></div>`;
function wJob() {
  const W = S.worker; const id = S.wJobId;
  const inv = W.invites.find((x) => x.id === id), job = W.jobs.find((x) => x.id === id);
  const j = inv || job; if (!j) return wOverview();
  const back = inv ? ['data-go="invites"', "kvietimus"] : ['data-go="jobs"', "Mano darbus"];
  let pills = "", actions = "", alert = "";
  if (inv) {
    pills = inv.status === "pending" ? (inv.conflict ? "" : (isMutual(inv.company) ? teamPill() : "")) : inv.status === "declined" ? pill("Atmesta") : inv.status === "expired" ? pill("Nebegalioja") : pill("Priimta", "green");
    if (inv.status === "expired") actions = `<div class="jd-due">${svg("clock", 16, 2.2)}<span>Atsakymo laikas baigėsi. Kvietimas nebegalioja, patikimumas nesumažėjo.</span></div>`;
    if (inv.status === "pending") actions = `${inv.until && !inv.conflict ? `<div class="jd-due${inv.urgent ? " hot" : ""}">${svg("clock", 16, 2.2)}<span>Atsakykite iki <b>${inv.until}</b></span></div>` : ""}<button class="btn primary jd-wide" type="button" data-act="accept" data-id="${inv.id}"${inv.conflict ? " disabled" : ""}>${inv.conflict ? "Laikas užimtas" : "Priimti darbą"}</button><button class="btn jd-wide" type="button" data-act="decline" data-id="${inv.id}">Atmesti</button><button class="btn jd-wide" type="button" data-act="coChat" data-id="${inv.id}">${svg("chat", 16)}Privati žinutė darbdaviui</button>`;

  } else {
    const st = { live: ["Vyksta šiandien", "green"], arrived: ["Atvykimas užfiksuotas", "green"], waiting: [`${rel(job.d)} · ${job.from}`, "blue"], toClose: ["Pasibaigė · reikia uždaryti", "orange"], workedWait: ["Laukiama darbdavio patvirtinimo", "blue"] }[job.state];
    pills = pill(st[0], st[1]); const ws = WSTATE[job.state]; alert = `<div class="alert ${job.state === "toClose" ? "" : job.state === "waiting" || job.state === "workedWait" ? "blue" : "green"}"><div><b>${ws[2]}</b><p>${ws[3]}</p></div></div>`;
    const a = { live: `<button class="btn green jd-wide" type="button" data-act="arrive" data-id="${job.id}">${svg("check", 16, 2.4)}Atvykau</button><button class="btn jd-wide" type="button" data-act="arriveHelp" data-id="${job.id}">Atvykau, bet nerandu</button>`, toClose: `<button class="btn primary jd-wide" type="button" data-act="worked" data-id="${job.id}">Dirbau šiame darbe</button><button class="btn jd-wide" type="button" data-act="noShow" data-id="${job.id}">Neatvykau</button>`, waiting: `<p class="small muted" style="margin:0">„Atvykau“ galėsite paspausti prasidėjus darbui.</p>`, arrived: `<p class="small muted" style="margin:0">Atvykimas užfiksuotas. Po darbo uždarykite dieną.</p>`, workedWait: `<p class="small muted" style="margin:0">Laukiama, kol darbdavys uždarys darbo dieną.</p>` }[job.state];
    actions = a + `<button class="btn jd-wide" type="button" data-act="jobChatW" data-id="${job.id}">${svg("chat", 16)}Darbo pokalbis</button>`;
  }
  actions += `<button class="btn jd-wide" type="button" data-act="companyModal" data-v="${esc(j.company)}">${svg("home", 16)}Įmonės profilis</button>`;
  const side = inv ? `<section class="card jd-co jd-lock"><h2>Kontaktas objekte</h2><p class="small muted" style="margin:0">${svg("shield", 15)} Darbdavio telefono numeris bus matomas, kai priimsite darbą.</p></section>` : `<section class="card jd-co"><h2>Kontaktai</h2>${(() => { const row = (lab, name, role, ph) => `<div class="ctrow"><small>${lab}</small><div class="co-line"><div class="av lt sm">${ini(name)}</div><div><b>${esc(name)}</b><small>${esc(role)}</small></div></div>${ph ? `<span class="jd-phone">${ph}</span><div class="jd-two"><a class="btn dark sm" href="tel:${ph.replace(/\s/g, "")}">${svg("phone", 14)}Skambinti</a><button class="btn sm" type="button" data-act="copy" data-v="${ph}">Kopijuoti</button></div>` : `<p class="small muted" style="margin:0">Telefono numeris nenurodytas.</p>`}</div>`; return (j.site ? row("Pasitiks objekte", j.site[0], j.site[1], j.site[2]) : "") + row(j.site ? "Darbdavys" : "Kontaktas objekte", j.company, "Atsakingas už darbą", j.phone); })()}</section>`;
  const metaExtra = inv && inv.status === "pending" && inv.conflict ? `<span class="jd-warn">${svg("clock", 14, 2.4)}Sutampa su jau priimtu darbu</span>` : "";
  const mainExtra = job ? PROOF_BOX() : "";
  return jobDetail(j, { back: back[0], backLabel: back[1], pills, company: j.company, actions, alert, side, metaExtra, mainExtra });
}
function wInvites() {
  const W = S.worker;
  const pend = W.invites.filter((i) => i.status === "pending").sort((a, b) => (a.conflict - b.conflict) || (isFavCo(b.company) - isFavCo(a.company))), done = W.invites.filter((i) => i.status !== "pending");
  const grp = (t, list, cls) => list.length ? `<div class="lgroup${cls ? " " + cls : ""}"><h2 class="lgh">${t} <span>${list.length}</span></h2>${paged("inv-" + (cls || "x"), list, inviteCard)}</div>` : "";
  return `<div class="head"><div><h1>Kvietimai į darbą</h1><p class="lead">Darbo vieta, laikas ir atlygis matomi prieš sutinkant.</p></div></div>
  ${pend.length ? `<div class="lgroup hot"><h2 class="lgh">Laukia jūsų atsakymo <span>${pend.filter((i) => !i.conflict).length}</span></h2>${paged("inv-hot", pend, inviteCard)}</div>` : `<section class="card">${empty("Naujų kvietimų į darbą nėra", "Kai darbdavys atsiųs jums tinkamą pasiūlymą, jis atsiras čia.")}</section>`}`;
}

const WSTATE = {
  live: ["Vyksta šiandien", "green", "Atvykę pažymėkite atvykimą", "Paspauskite „Atvykau“. Jei nerandate objekto ar atsakingo žmogaus, naudokite „Atvykau, bet nerandu“."],
  arrived: ["Atvykimas užfiksuotas", "green", "Atvykimas užfiksuotas", "Darbdavys gali jį papildomai patvirtinti. Po darbo pabaigos reikės uždaryti dieną."],
  waiting: [null, "blue", "Laukiama darbo pradžios", "„Atvykau“ galėsite paspausti tik prasidėjus darbui."],
  toClose: ["Pasibaigė · reikia uždaryti", "orange", "Uždarykite darbo dieną", "Pasirinkite „Dirbau šiame darbe“ arba, jei neatvykote, pažymėkite „Neatvykau“."],
  workedWait: ["Laukiama darbdavio patvirtinimo", "blue", "Jūsų veiksmas atliktas", "Pažymėjote, kad dirbote. Dabar laukiama darbdavio darbo dienos uždarymo."]
};
function workerJobCard(j) {
  const st = WSTATE[j.state];
  return `<article class="job${j.state === "toClose" ? " attn" : j.state === "live" ? " jlive" : ""}" data-act="details" data-id="${j.id}" tabindex="0" role="link" aria-label="${esc(up(j.title))}"><div class="jm"><div class="jtop"><h3>${up(j.title)}</h3><div class="row jpills">${pill(st[0] || `${rel(j.d)} · ${j.from}`, st[1])}</div></div>${coLine(j.company)}</div><span class="jgo" aria-hidden="true">${svg("right", 18, 2).replace(I.right, '<path d="m9 18 6-6-6-6"/>')}</span></article>`;
}

function wJobs() {
  const W = S.worker;
  const need = W.jobs.filter((j) => ["live", "toClose"].includes(j.state)), rest = W.jobs.filter((j) => !["live", "toClose"].includes(j.state));
  const grp = (t, list, cls) => list.length ? `<div class="lgroup${cls ? " " + cls : ""}"><h2 class="lgh">${t} <span>${list.length}</span></h2>${paged("job-" + (cls || "x"), list, workerJobCard)}</div>` : "";
  return `<div class="head"><div><h1>Mano darbai</h1><p class="lead">Priimti darbai, atvykimo žymėjimas ir darbo dienos uždarymas.</p></div></div>
  ${W.jobs.length ? grp("Reikia jūsų veiksmo", need, "hot") + grp("Suplanuoti ir laukiantys", rest) : `<section class="card">${empty("Aktyvių darbų nėra", "Kai priimsite darbo kvietimą arba turėsite artėjantį darbą, jis bus rodomas čia.")}</section>`}`;
}

function wFavCo() {
  const L = S.worker.favCo || [];
  return `<div class="head"><div><h1>Mėgstamos įmonės</h1><p class="lead">Šių įmonių kvietimai rodomi pirmiausia.</p></div></div>
  <section class="card setsec">${L.length ? `<div class="setlist">${L.map((n) => { const mu = isMutual(n); return `<div class="setrow fcrow">${favBtn(n)}<span class="av co sm" style="border:1px solid var(--line)">${ini(n.replace(/^(UAB|MB)\s+/, ""))}</span><div class="settx"><b>${esc(n)}${awardBadges(n, "company", 18)}</b><span>${svg("pin", 13)} Vilnius</span>${mu ? teamPill() : ""}</div><button type="button" class="btn sm" data-act="companyModal" data-v="${esc(n)}">Profilis</button></div>`; }).join("")}</div>` : empty("Mėgstamų įmonių dar nėra", `Atidarę darbą ar įmonės profilį paspauskite širdelę – tos įmonės kvietimai bus rodomi pirmiausia.`, "heart")}</section>
  <section class="card teambox"><div class="tb-h">${teamPill()}<b>Kai įmonė jus taip pat pažymi širdele</b></div>
    <ul class="tb-l"><li>${svg("search", 16)}Jos paieškoje esate rodomi aukščiau</li><li>${svg("mail", 16)}Kvietimus gaunate pirmi</li><li>${svg("clock", 16)}Atsakyti turite 24 val., o ne 12</li></ul></section>
  <section class="card setsec"><div class="setlist"><div class="setrow"><span class="setic">${svg("phone", 18)}</span><div class="settx"><b>„Laisvas dabar“ – tik mėgstamoms įmonėms</b><span>${busyJob() ? `Dabar dirbate iki ${busyJob().to} – galėsite keisti po darbo` : "Jūsų telefono numerį matys tik šios įmonės"}</span></div><button type="button" class="tgl${S.freeFav ? " on" : ""}"${busyJob() ? " disabled" : ""} data-act="freeFavTgl" role="switch" aria-checked="${!!S.freeFav}" aria-label="Laisvas dabar tik mėgstamoms įmonėms"><i></i></button></div></div></section>`;
}
function wHistory() {
  const H = S.worker.history;
  return `<div class="head"><div><h1>Darbų istorija</h1><p class="lead">Užbaigti ir atšaukti darbai su darbdavių įvertinimais.</p></div></div>
  <section class="card">${paged("hist", H, (h) => `<article class="job" data-act="openHist" data-id="${h.id}" tabindex="0" role="link" aria-label="${esc(up(h.title))}"><div class="jm"><div class="jtop"><h3>${up(h.title)}</h3><div class="row jpills">${h.result === "done" ? pill("Užbaigtas", "green") : pill("Atšauktas", "red")}</div></div>${coLine(h.company)}</div><span class="jgo" aria-hidden="true">${svg("right", 18, 2).replace(I.right, '<path d="m9 18 6-6-6-6"/>')}</span></article>`)}</section>`;
}
function wHistJob() {
  const h0 = S.worker.history.find((x) => x.id === S.histId); if (!h0) return wHistory();
  const h = { city: "Vilnius", addr: "Ozo g. 25, Vilnius", pay: 14, unit: "hour", lunch: "12:00–12:30", arrival: "Darbuotojas atvyksta pats", desc: "Pagalbiniai darbai statybvietėje: medžiagų pernešimas, tvarkymas, pagalba meistrams.", ...h0 };
  const mainExtra = (h.result === "done" ? `<section class="card jd-sec"><h2>Darbdavio įvertinimas</h2><div class="cpr"><span class="av co sm" style="border:1px solid var(--line)">${ini(h.company.replace(/^(UAB|MB)\s+/, ""))}</span><div><div class="cpr-top"><b>${esc(h.company)}</b><span class="cpr-score">${h.rating}/10</span></div><p>${esc(h.comment)}</p><small>Išdirbta ${h.worked}</small></div></div></section>` : `<section class="card jd-sec"><h2>Atšaukimo priežastis</h2><div class="jd-desc"><p>${esc(h.reason)}</p></div></section>`) + archSection("worker", h.title);
  return jobDetail(h, { back: 'data-go="history"', backLabel: "darbų istoriją", pills: h.result === "done" ? pill("Užbaigtas", "green") : pill("Atšauktas", "red"), company: h.company, mainExtra, actions: `<button class="btn jd-wide" type="button" data-act="companyModal" data-v="${esc(h.company)}">${svg("home", 16)}Įmonės profilis</button>` });
}

function wOffers() {
  const o = S.worker.offer;
  const st = o.status === "new" ? pill("Naujas pasiūlymas", "orange") : o.status === "sent" ? pill("Pasirašyta sutartis išsiųsta", "green") : pill("Atmestas");
  return `<div class="head"><div><span class="eyebrow">Ilgalaikis įdarbinimas</span><h1>Įdarbinimo pasiūlymai</h1><p class="lead">Po sėkmingų darbo dienų darbdavys gali pasiūlyti ilgalaikį darbą su sutartimi.</p></div></div>
  <section class="card"><header><div><div class="row" style="gap:6px">${st}</div><h2 style="margin-top:6px">${up(o.position)}</h2></div></header>${coLine(o.company)}
  <div class="kv"><div><small>Sutarties tipas</small><b>${o.type}</b></div><div><small>Preliminari darbo pradžia</small><b>${iso(dOff(o.start))}</b></div><div><small>Atlygis</small><b>${o.payText}</b></div><div><small>Grafikas</small><b>${o.schedule}</b></div><div><small>Pietų pertrauka</small><b>${o.lunch}</b></div><div><small>Atvykti adresu</small><b>${o.addr}</b></div><div class="wide"><small>Įdarbinimo informacija</small><b style="font-weight:500">${o.info}</b></div></div>
  <div class="step info"><span class="dot"></span><div><b>Papildomi darbai valdomi pagal jūsų laisvumo grafiką</b><p>Aktyvaus įdarbinimo valandos bus užrakintos automatiškai, o kitu laiku galėsite priimti trumpus darbus.</p></div></div>
  ${o.status === "new" ? `<div class="notebox"><b style="color:var(--navy)">Darbo sutartis</b><br>Perskaitykite visą dokumentą prieš pasirašydami. Priimami PDF ir DOCX failai iki 15 MB. Įkėlus sutartį darbdavys gaus pranešimą.</div>
  <div class="row"><button class="btn" type="button" data-act="toast" data-msg="Prototipe sutarties failas neatidaromas">${svg("file", 18)}Atidaryti sutartį</button><button class="btn" type="button" data-act="chatWith" data-id="c3">Aptarti pasiūlymą</button><button class="btn danger" type="button" data-act="offerDecline">Atmesti pasiūlymą</button><button class="btn primary" type="button" data-act="offerSend">Išsiųsti pasirašytą sutartį</button></div>`
  : o.status === "sent" ? `<div class="alert green"><div><b>✓ Pasirašyta sutartis išsiųsta</b><p>Laukiama, kol darbdavys peržiūrės dokumentą ir galutinai patvirtins įdarbinimą.</p></div></div>` : `<p class="muted">Įdarbinimo pasiūlymas atmestas.</p>`}</section>`;
}

function mirrorWeek() { if (!S.rep) return; const W = S.worker.schedule; for (let i = 7; i < 14; i++) { const d = W[i], src = W[i - 7]; if (d.s === "locked") continue; d.s = src.s === "locked" ? "free" : src.s; d.from = src.from || "07:00"; d.to = src.to || "18:00"; } }
function wSchedule() {
  mirrorWeek();
  const W = S.worker;
  const cells = Array.from({ length: 14 }, (_, i) => [dOff(i), i]);
  const cell = ([d, i]) => {
    if (i < 0 || i > 13) return `<div class="sday off" aria-hidden="true"><span class="sdn">${d.getDate()}</span></div>`;
    const s = W.schedule[i];
    const chip = s.s === "locked" ? `<span class="schip job">${s.from}–${s.to}</span><span class="slab">Įdarbintas</span>` : s.s === "free" ? `<span class="schip sfree">${s.from}–${s.to}</span>` : `<span class="slab muted">Nenoriu dirbti</span>`;
    return `<button type="button" class="sday st-${s.s}${i === 0 ? " today" : ""}" data-act="day" data-i="${i}" aria-label="${WD[d.getDay()]} ${iso(d)}: ${s.s === "busy" ? "nenoriu dirbti" : s.from + "–" + s.to}"><span class="sdh"><span class="swk">${i < 2 ? `<span class="lg">${i === 0 ? "Šiandien" : "Rytoj"}</span><span class="sh">${WDS[d.getDay()]}</span>` : WDS[d.getDay()]}</span><span class="smon">${MON_S[d.getMonth()]}</span></span><span class="sdn">${d.getDate()}</span>${chip}</button>`;
  };
  return `<h1 class="sr">Darbo grafikas</h1>
  <section class="card sched">
  <div class="squick">
    <div class="pair stime"><label class="field" for="qs-from"><span class="sr">Nuo</span><select id="qs-from" aria-label="Nuo">${timeOpts("07:00")}</select></label><span class="sdash">–</span><label class="field" for="qs-to"><span class="sr">Iki</span><select id="qs-to" aria-label="Iki">${timeOpts("18:00")}</select></label></div>
    <div class="sbtns"><button class="btn dark" type="button" data-act="qs" data-v="weekdays">Pr–Pn</button><button class="btn dark" type="button" data-act="qs" data-v="all">Visos dienos</button><button class="btn primary" type="button" data-act="qs" data-v="clear">Išvalyti</button></div>
    
  </div>
  <div class="sgrid">${cells.map(cell).join("")}</div>
  <div class="srep"><div class="settx"><b>Kartoti kas savaitę</b><span>Antra savaitė užpildoma pagal pirmą</span></div><button type="button" class="tgl${S.rep ? " on" : ""}" data-act="repTgl" role="switch" aria-checked="${!!S.rep}" aria-label="Kartoti grafiką kas savaitę"><i></i></button></div>
  </section>
  ${(() => { const until = S.confirmedAt ? new Date(S.confirmedAt + 864e5) : null; const tm = until ? `${until.getDate() === new Date().getDate() ? "šiandien" : "rytoj"} ${String(until.getHours()).padStart(2, "0")}:${String(until.getMinutes()).padStart(2, "0")}` : ""; return `<section class="card sinfo">
  <div class="sitable" role="table" aria-label="Grafikas ir matomumas">
    <div class="sir" role="row"><span role="cell" class="sik"><i class="lf"></i>Laisva diena</span><span role="cell">Darbdaviai jus randa paieškoje tik tą dieną ir tik nurodytu laiku.</span></div>
    <div class="sir" role="row"><span role="cell" class="sik"><i class="lb"></i>Nenoriu dirbti</span><span role="cell">Tą dieną paieškoje nerodomi ir kvietimų negaunate.</span></div>
    <div class="sir" role="row"><span role="cell" class="sik"><i class="lj"></i>Įdarbintas</span><span role="cell">Šiuo laiku dirbate darbe, kurį priėmėte (jį rasite skiltyje „Mano darbai“). Laikas užrakintas ir jo keisti negalima. Kitus kvietimus galėsite gauti tik ne šiuo laiku – prieš ir po darbo paliekama 1 val. nuvykimui.</span></div>
  </div></section>`; })()}`;
}



function msgBody(m) {
  if (m.img) return `<div class="bub img"><button type="button" class="imgbtn" data-act="lightbox" data-src="${m.img}" aria-label="Padidinti nuotrauką"><img src="${m.img}" alt="Nuotrauka"></button>${m.t ? `<span>${esc(m.t)}</span>` : ""}</div>`;
  if (m.file) return `<div class="bub filebub"><span class="fic">${svg("file", 20)}</span><span class="fmeta"><b>${esc(m.file.name)}</b><small>${m.file.size}</small></span><button type="button" class="fdl" data-act="toast" data-msg="Tikroje svetainėje failas bus atsisiųstas į jūsų įrenginį" aria-label="Atsisiųsti ${esc(m.file.name)}">${svg("download", 18, 2.2)}</button></div>`;
  return `<div class="bub">${esc(m.t)}</div>`;
}
const fmtSize = (b) => b > 1048576 ? `${(b / 1048576).toFixed(1).replace(".", ",")} MB` : `${Math.max(1, Math.round(b / 1024))} KB`;
function convLast(c) { const m0 = c.msgs.filter((x) => x.w !== "topic").pop(); if (!m0) return ["", ""]; const m = m0.img && !m0.t ? { ...m0, t: "📷 Nuotrauka" } : m0.file ? { ...m0, t: `📎 ${m0.file.name}` } : m0; const who = m.w === "me" ? "Jūs: " : (c.kind === "group" || c.kind === "team") ? `${m.w.split(/[\s,]/)[0]}: ` : ""; return [who + m.t, m.d === "Šiandien" ? m.tm : m.d]; }
function cavHTML(c, sm) { if (c.kind === "support") return `<span class="cav sup${sm ? " sm" : ""}"><img src="${MARK_LIGHT}" alt=""></span>`; if (c.kind === "team") return `<span class="cav team${sm ? " sm" : ""}">${svg("team", sm ? 14 : 22)}</span>`; const txt = c.kind === "group" ? svg("people", sm ? 14 : 22) : ini(c.name.replace(/^(UAB|MB)\s+/, "")); return `<span class="cav${c.kind === "group" ? " grp" : c.kind === "company" ? " co" : ""}${sm ? " sm" : ""}">${txt}${c.online ? '<span class="on" aria-label="Prisijungęs"></span>' : ""}</span>`; }
const ctypeLabel = (c) => c.kind === "support" ? "Pagalba · administratorius" : c.kind === "team" ? `Vadovų pokalbis · ${(c.parts || []).length} nariai` : c.kind === "group" ? `Darbo pokalbis · ${(c.parts || []).length} dalyviai` : c.kind === "company" ? "Privatus · įdarbinimas" : "Privatus";
function chatView(convsAll, title) {
  const teamOk = S.role === "employer" && PLAN() !== "business" && E().team.length > 1 && (PK() !== "site" || ((E().convs.find((c) => c.kind === "team") || {}).parts || []).includes(ME()));
  const live = (c) => c.id === S.chatId || (c.msgs || []).slice(c.cut || 0).some((m) => m.w !== "topic");
  const convs = convsAll.filter((c) => (c.kind !== "team" || teamOk) && (c.kind === "team" && !c.cut ? true : live(c)));
  const cur = convs.find((c) => c.id === S.chatId);
  const q = (S.chatQ || "").toLocaleLowerCase("lt-LT");
  const flt = S.chatFilter || "all";
  const kindOf = (c) => c.kind === "group" ? "group" : c.kind === "team" ? "team" : "private";
  const list = convs.filter((c) => (flt === "all" || kindOf(c) === flt) && (!q || (c.name + " " + c.job).toLocaleLowerCase("lt-LT").includes(q)));
  const cnt = (k) => convs.filter((c) => kindOf(c) === k && c.unread).length;
  let thread = "";
  if (cur) {
    const grp = cur.kind === "group" || cur.kind === "team"; const team = cur.kind === "team";
    const first = (n) => n.split(/[\s,(]/)[0];
    let rows = "", lastDay = null;
    const from = cur.kind === "team" && cur.joined && cur.joined[ME()] != null ? cur.joined[ME()] : 0, MS = cur.msgs.slice(Math.max(from, cur.cut || 0));
    MS.forEach((m, i) => {
      const prev = MS[i - 1], next = MS[i + 1];
      if (m.d !== lastDay) { rows += `<div class="dsep">${m.d}</div>`; lastDay = m.d; }
      if (m.w === "topic") { rows += `<div class="topicsep"><span>${svg("file", 13)}${esc(m.t)}</span></div>`; return; }
      const same = (x, y) => x && y && x.w === y.w && x.d === y.d;
      const isFirst = !same(prev, m), isLast = !same(m, next);
      const me = m.w === "me";
      const sender = me ? "Jūs" : m.w === "them" ? cur.name : m.w;
      if ((grp || ADM_LABELS.includes(m.w)) && isFirst) rows += `<div class="who-n${me ? " me" : ""}${ADM_LABELS.includes(m.w) ? " adm" : ""}">${esc(sender)}</div>`;
      rows += `<div class="mrow${me ? " me" : ""}${isFirst ? " first newgrp" : ""}${isLast ? " last" : ""}">${me ? "" : cavHTML({ kind: cur.kind === "support" ? "support" : "private", name: sender, online: false }, true)}${msgBody(m)}${isLast ? `<span class="mtime">${m.tm}</span>` : ""}</div>`;
    });
    const lastMsg = MS[MS.length - 1];
    if (S.typing === cur.id) rows += `<div class="mrow first last newgrp">${cavHTML({ kind: "private", name: grp ? (cur.parts || ["?"])[1] : cur.name }, true)}<div class="typing" aria-label="Rašo žinutę"><i></i><i></i><i></i></div></div>`;
    else if (lastMsg && lastMsg.w === "me") rows += `<span class="seen">${grp ? "Matė visi" : "Matyta"}</span>`;
    const quick = team ? ["Gerai", "Pasižiūrėsiu", "Ačiū!"] : S.role === "worker" ? ["Jau važiuoju", "Atvykau", "Ačiū!"] : ["Laukiu objekte", "Gerai", "Ačiū!"];
    const others = (cur.parts || []).filter((p) => p !== "Jūs");
    const sup = cur.kind === "support";
    const privacy = sup ? `<div class="privacy prv">${svg("shield", 16)}<div><b>Pranešimas apie klaidą</b><span>Mato tik statybos24.lt administratorius</span></div></div>` : team
      ? `<div class="privacy team">${svg("team", 16)}<div><b>Vadovų pokalbis</b><span>Mato tik įmonės komanda: ${others.map(esc).join(", ")} ir jūs. Darbuotojai nemato. Prireikus – ir statybos24 administratorius.</span></div></div>`
      : grp
      ? `<div class="privacy grp">${svg("people", 16)}<div><b>Bendras darbo pokalbis</b><span>Mato: ${others.map(esc).join(", ")}, jūs ir statybos24 administratorius</span></div><div class="parts">${others.map((p) => `<span class="cav sm" title="${esc(p)}">${ini(p)}</span>`).join("")}</div></div>`
      : `<div class="privacy prv">${svg("shield", 16)}<div><b>Privatus pokalbis</b><span>Mato tik jūs, ${esc(cur.name)} ir statybos24 administratorius</span></div></div>`;
    const ph = sup ? "Aprašykite, kas neveikia" : team ? "Rašyti komandai" : grp ? "Rašyti visiems" : `Privačiai: ${cur.name}`;
    const infoBtn = sup ? "" : team ? `<button type="button" class="tinfo" data-act="chatInfo">${svg("people", 15)}Nariai · ${cur.parts.length}</button>` : grp ? `<button type="button" class="tinfo" data-act="chatInfo">${svg("jobs", 15)}Darbas</button>` : `<button type="button" class="tinfo" data-act="chatInfo">${svg("user", 15)}Profilis</button>`;
    thread = `<div class="thead"><button type="button" class="tbtn back" data-act="closeChat" aria-label="Atgal į pokalbius">${svg("back", 22, 2.4)}</button><button type="button" class="tperson" data-act="chatInfo">${cavHTML(cur)}<div class="tn"><b>${grp && !team ? up(cur.name) : esc(cur.name)}</b><small>${sup ? "Administratorius · atsako darbo dienomis" : grp ? `${esc(cur.person)}` : `${cur.online ? "Aktyvus dabar · " : ""}${up(cur.job)}`}</small></div></button>${infoBtn}${!sup ? `<button type="button" class="tbtn tdel" data-act="chatDel" aria-label="Ištrinti pokalbį" title="Ištrinti pokalbį"><svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg></button>` : ""}<button type="button" class="tbtn" data-act="closeMessenger" aria-label="Uždaryti žinutes">${svg("x", 20, 2.2)}</button></div>
    <div class="msgs${team ? " is-team" : grp ? " is-grp" : " is-prv"}" id="msgs">${rows}</div>
    ${S.pendImg && sup ? `<div class="pendimg"><button type="button" class="pi-img" data-act="lightbox" data-src="pend"><img src="${S.pendImg}" alt="Pažymėta ekrano nuotrauka"></button><span>Ekrano nuotrauka pridėta</span><button type="button" class="pi-x" data-act="pendClear" aria-label="Pašalinti nuotrauką">${svg("x", 14, 2.4)}</button></div>` : ""}<form class="compose" data-form="send">${sup ? `<button type="button" class="tbtn attach shotbtn" data-act="bugShot" title="Pažymėti klaidą ekrane">${svg("mark", 22, 2)}<span class="sr">Pažymėti klaidą ekrane</span></button>` : ""}<label class="tbtn attach" title="Pridėti nuotrauką">${svg("camera", 22, 2)}<span class="sr">Pridėti nuotrauką</span><input type="file" accept="image/*" id="chat-file" class="sr"></label>${team ? `<label class="tbtn attach" title="Pridėti failą">${svg("clip", 21, 2)}<span class="sr">Pridėti failą</span><input type="file" id="chat-anyfile" class="sr"></label>` : ""}<div class="pillin${grp ? " grp" : ""}"><label class="sr" for="msg-in">${esc(ph)}</label><span class="to">${grp ? svg("people", 15) : svg("shield", 15)}</span><input id="msg-in" placeholder="${esc(ph)}" autocomplete="off"></div><button class="send" type="submit" aria-label="Siųsti">${svg("send", 18, 2.2)}</button></form>`;
  } else {
    thread = `<div class="tempty">${cavHTML({ kind: "group", name: "" })}<b style="color:var(--navy);font-size:16px">Pasirinkite pokalbį</b><span><b style="color:var(--navy)">Privatus</b> – žinutes mato tik jūs ir pašnekovas.<br><b style="color:var(--navy)">Darbo pokalbis</b> – žinutes mato visi to darbo dalyviai.</span></div>`;
  }
  const row = (c) => { const [lm, lt] = convLast(c); return `<button type="button" class="conv${c.unread ? " un" : ""}" data-act="openChat" data-id="${c.id}" aria-current="${!!(cur && cur.id === c.id)}">${cavHTML(c)}<div class="cn"><span class="ctype ${c.kind === "group" ? "g" : c.kind === "team" ? "t" : "p"}">${c.kind === "group" ? svg("people", 12, 2.4) : c.kind === "team" ? svg("team", 12, 2.4) : svg("shield", 12, 2.4)}${ctypeLabel(c)}</span><b>${c.kind === "group" ? up(c.name) : esc(c.name)}</b><small>${esc(lm)} · ${lt}</small></div>${c.unread ? '<span class="unread" aria-label="Neperskaityta"></span>' : ""}</button>`; };
  const seg = (k, t) => { const n = k === "all" ? convs.filter((c) => c.unread).length : cnt(k); return `<button type="button" data-act="chatFilter" data-v="${k}" aria-pressed="${flt === k}">${t}${n ? ` <em>${n}</em>` : ""}</button>`; };
  return `<div class="chat narrow${cur ? " has-thread" : ""}"><div class="convs"><div class="pophead"><b>Žinutės</b><button type="button" class="tbtn" data-act="closeMessenger" aria-label="Uždaryti žinutes">${svg("x", 20, 2.2)}</button></div><div class="convs-head"><div class="cfilter" role="group" aria-label="Pokalbių tipas">${seg("all", "Visi")}${seg("private", "Privatūs")}${seg("group", teamOk ? "Darbo" : "Darbo pokalbiai")}${teamOk ? seg("team", "Vadovai") : ""}</div><label class="csearch">${svg("search", 17)}<span class="sr">Ieškoti pokalbio</span><input id="chat-q" data-chatq value="${esc(S.chatQ || "")}" placeholder="Ieškoti" autocomplete="off"></label></div>
  <div class="clist">${list.length ? list.map(row).join("") : `<p class="muted small" style="padding:10px">Pokalbių nerasta.</p>`}</div></div>
  <div class="thread${cur && cur.kind === "group" ? " grp" : cur && cur.kind === "team" ? " grp tm" : ""}" role="region" aria-label="Pokalbis">${thread}</div></div>`;
}

function wProfile() {
  return `<div class="head"><div><span class="eyebrow">Mano informacija</span><h1>Profilis</h1><p class="lead">Atnaujinkite savo profilį ir laiką, kada galite priimti darbo kvietimus.</p></div><div class="row"><button class="btn primary savebtn" id="prof-save" type="button" data-act="profSave">${svg("check", 16, 2.4)}<span>Išsaugoti</span></button></div></div>
  ${awardPanel("me", "worker") ? `<section class="card">${awardPanel("me", "worker")}</section>` : ""}
  <section class="card"><h2>Pagrindinė informacija</h2>
  <div class="row" style="gap:16px"><div class="av lg">BB</div><div style="display:flex;flex-direction:column;gap:6px"><b>Profilio nuotrauka</b><span class="muted small">Nuotrauką matys darbdaviai prie jūsų profilio. JPG, PNG arba WEBP, iki 5 MB.</span><div class="row"><button class="btn sm" type="button" data-act="toast" data-msg="Prototipe nuotrauka neįkeliama">Pridėti nuotrauką</button></div></div></div>
  <div class="form">
    <label class="field" for="p-fn">Vardas *<input id="p-fn" class="nmcap" value="Beata"></label>
    <label class="field" for="p-ln">Pavardė *<input id="p-ln" class="nmcap" value="Bune"></label>
    <label class="field" for="p-bd">Gimimo data<input id="p-bd" type="date" value="1994-05-12"><span class="hint">Šią datą matote tik savo profilyje – darbdaviams ji nerodoma.</span></label>
    <label class="field" for="p-city">Miestas *<input id="p-city" value="Vilnius"></label>
    ${phoneField("worker", "Telefonas *")}
    ${mailField("beatabune@gmail.com")}
    <label class="field" for="p-km">Kiek km galite nuvykti?<select id="p-km"><option>5 km</option><option>10 km</option><option selected>20 km</option><option>50 km</option></select></label>
    <label class="field wide" for="p-exp">Patirtis *<textarea id="p-exp">2 metus dirbau statybų pagalbine darbuotoja, turiu patirties tvarkymo ir krovos darbuose.</textarea></label>
    <div class="checkrow wide"><label class="check"><input type="checkbox" id="p-b" checked> Turiu B kategorijos vairuotojo pažymėjimą</label><label class="check"><input type="checkbox" id="p-iv"> Turiu individualią veiklą</label></div>
  </div></section>
  ${docsSection()}
  <section class="card"><h2>Paskutiniai 3 darbdavių įvertinimai</h2><div class="list">${S.worker.reviews.map(([c, r, t]) => `<div class="step ok"><span class="dot"></span><div><b>${esc(c)} · ${r}/10</b><p>${esc(t)}</p></div></div>`).join("")}</div></section>
  <section class="card setsec"><h2>Pranešimai</h2>
    <div class="setlist">
      <div class="setrow"><span class="setic">${svg("bell", 18)}</span><div class="settx"><b>Pranešimai telefone</b><span>Nauji kvietimai ir žinutės · <button type="button" class="linkin" data-act="notifPrev">Peržiūrėti pavyzdį</button></span></div><button type="button" class="tgl${S.push ? " on" : ""}" data-act="pushTgl" role="switch" aria-checked="${!!S.push}" aria-label="Pranešimai telefone"><i></i></button></div>
      <div class="setrow"><span class="setic">${svg("cal", 18)}</span><div class="settx"><b>Priminimas vakare prieš darbą</b><span>20:00 – laikas, adresas ir kelionės trukmė</span></div><button type="button" class="tgl${S.remEve !== false ? " on" : ""}" data-act="remTgl" data-v="remEve" role="switch" aria-checked="${S.remEve !== false}" aria-label="Priminimas vakare prieš darbą"><i></i></button></div>
      <div class="setrow"><span class="setic">${svg("clock", 18)}</span><div class="settx"><b>Priminimas likus 1 val.</b><span>Kada išvykti, kad atvyktumėte laiku</span></div><button type="button" class="tgl${S.remHour !== false ? " on" : ""}" data-act="remTgl" data-v="remHour" role="switch" aria-checked="${S.remHour !== false}" aria-label="Priminimas likus 1 valandai"><i></i></button></div>
      <div class="setrow"><span class="setic">${svg("pin", 18)}</span><div class="settx"><b>Lokacija</b><span>Rodome arčiau esančius darbus. Darbdaviui vietos nerodome.</span></div><button type="button" class="tgl${S.loc ? " on" : ""}" data-act="locTgl" role="switch" aria-checked="${!!S.loc}" aria-label="Lokacija"><i></i></button></div>
    </div>
  </section>
  <section class="card setsec"><h2>Kita</h2>
    <div class="setlist">
      <div class="setrow"><span class="setic">${svg("pin", 18)}</span><div class="settx"><b>Domina darbas užsienyje</b><span>Padeda administracijai pasiūlyti tinkamas galimybes</span></div><div class="toggle2 sm" role="group" aria-label="Darbas užsienyje"><button type="button" data-act="abroad" data-v="1" aria-pressed="${!!S.abroad}">Taip</button><button type="button" data-act="abroad" data-v="0" aria-pressed="${!S.abroad}">Ne</button></div></div>${S.abroad ? `<div class="abr-c"><span class="small muted">Kokios šalys domina? <em>(nebūtina)</em></span><div class="chips">${ABR_C.map((c) => `<button type="button" class="chip" data-act="abroadC" data-v="${c}" aria-pressed="${(S.abroadC || []).includes(c)}">${c}</button>`).join("")}</div></div>` : ""}
    </div>
  </section>
  <section class="card setsec danger"><h2>Paskyra</h2>
    <div class="setlist2">
      <button type="button" class="setrow link neutral" data-act="pwOpen"><span class="setic">${svg("lock", 18)}</span><div class="settx"><b>Keisti slaptažodį</b><span>Paskutinį kartą keistas prieš 4 mėn.</span></div><span class="setgo">${svg("right", 16).replace(I.right, '<path d="m9 18 6-6-6-6"/>')}</span></button>
      <button type="button" class="setrow link neutral" data-act="reportBug"><span class="setic">${svg("chat", 18)}</span><div class="settx"><b>Pranešti apie klaidą</b><span>Aprašykite, kas neveikia – žinutė pasieks administratorių</span></div><span class="setgo">${svg("right", 16).replace(I.right, '<path d="m9 18 6-6-6-6"/>')}</span></button>
      <div class="setrow"><span class="setic">${svg("x", 18, 2.2)}</span><div class="settx"><b>Ištrinti paskyrą</b><span>Bus pašalintas jūsų profilis, darbų istorija ir įkelti failai. Šio veiksmo atkurti negalima.</span></div><button class="btn sm danger" type="button" data-act="toast" data-msg="Prototipe paskyra netrinama">Ištrinti</button></div>
    </div>
  </section>
  <div class="savebar" id="savebar" hidden><div class="sbtx"><span class="sbdot"></span><b><span class="sbl">Neišsaugoti pakeitimai</span><span class="sbs">Neišsaugota</span></b></div><div class="row"><button class="btn sm ghostw" type="button" data-act="profUndo">Atšaukti</button><button class="btn sm primary" type="button" data-act="profSave">${svg("check", 15, 2.4)} Išsaugoti</button></div></div>`;
}

/* ---------- Darbdavio ekranai ---------- */
const E = () => S.emp;
const ROLES = {
  owner: { name: "Jūs", label: "Savininkas", ini: "UP" },
  manager: { name: "Ieva M.", label: "Vadovas", ini: "IM" },
  recruiter: { name: "Paulius R.", label: "Vadybininkas", ini: "PR" },
  site: { name: "Mindaugas S.", label: "Objekto vadovas", ini: "MS" }
};
const LBL2K = { "Savininkas": "owner", "Vadovas": "manager", "Vadybininkas": "recruiter", "Objekto vadovas": "site" };
const RK = () => { const r = S.empRole || "owner"; return r === "owner" ? "owner" : LBL2K[ROLES[r].label] || r; };
const PK = () => S.empRole || "owner";
const ME = () => ROLES[PK()].name;
const PERMS = [["allJobs", "Mato visus įmonės darbus"], ["create", "Kuria darbo pasiūlymus"], ["invite", "Kviečia darbuotojus ir atšaukia darbus"], ["ads", "Darbo skelbimai ir kandidatai"], ["stats", "Mato statistiką"], ["team", "Valdo komandą"]];
const memberOv = () => { const m = E().team.find((t) => t[0] === ME()); return (m && m[3]) || {}; };
const coBlocked = () => { if (S.adminAs) return false; const c = S.admin && S.admin.employers.find((x) => x.n === "UAB Pavyzdinė statyba"); return !!c && (c.st === "susp" || c.st === "deleted"); };
const can = (what, j) => { if (["create", "invite", "ads"].includes(what) && coBlocked()) return false; const ov = PK() === "owner" ? {} : memberOv(); const map = { cancel: "invite", handover: "invite" }; const key = map[what] || what; if (key in ov) { if (!ov[key]) return false; if (key === "allJobs" || key === "ads" || key === "stats" || key === "team" || key === "create") return true; if (key === "invite") return true; } return can0(what, j); };
const can0 = (what, j) => { const r = RK(), own = j && j.resp === ME(), assigned = j && j.site === ME();
  switch (what) {
    case "allJobs": return r === "owner" || r === "manager";
    case "create": case "favorites": return r !== "site";
    case "invite": case "cancel": case "handover": return r === "owner" || r === "manager" || (r === "recruiter" && own);
    case "attend": case "jobChat": return r === "owner" || r === "manager" || own || assigned;
    case "ads": case "team": return r === "owner" || r === "manager";
    case "plans": case "editCompany": case "deleteCompany": return r === "owner";
    case "teamChat": return r !== "site";
    case "stats": return r !== "site";
    default: return true; } };
const VJ = () => { const r = RK(); return can("allJobs") ? E().jobs : r === "site" ? E().jobs.filter((j) => j.site === ME()) : E().jobs.filter((j) => j.resp === ME()); };
function jobStatus(j) {
  const acc = j.workers.filter((w) => ["accepted", "arrived", "confirmed", "toClose", "closed"].includes(w[1])).length;
  if (j.workers.some((w) => w[1] === "toClose")) return ["Uždarykite darbo dieną", "orange", true];
  if (j.workers.some((w) => w[1] === "arrived")) return ["Patvirtinkite atvykimą", "orange", true];
  if (j.d >= 0 && acc < j.need) return [`Trūksta ${j.need - acc} ${j.need - acc === 1 ? "darbuotojo" : "darbuotojų"}`, "orange", true];
  if (j.d === 0) return ["Vyksta šiandien", "green", false];
  return [j.d === 1 ? "Paruošta rytojui" : "Komanda surinkta", "green", false];
}
function empJobCard(j) {
  const [t, c, attn] = jobStatus(j);
  const acc = j.workers.filter((w) => ["accepted", "arrived", "confirmed", "toClose", "closed"].includes(w[1])).length;
  const hl = S.hlShort && S.view === "active" && t.startsWith("Trūksta");
  return `<article class="job${hl ? " shorthl" : attn ? " attn" : j.d === 0 ? " jlive" : ""}" data-act="openJob" data-id="${j.id}" tabindex="0" role="link" aria-label="${esc(up(j.title))}"><div class="jm"><div class="jtop"><h3>${up(j.title)}</h3><div class="row jpills">${pill(t, hl ? "red" : c)}${j.unread ? pill(`${j.unread} ${j.unread === 1 ? "nauja žinutė" : "naujos žinutės"}`, "blue") : ""}</div></div><div class="metrics"><span>${svg("user", 16)}${j.resp !== "Jūs" ? esc(j.resp) : "Jūsų darbas"}</span><span>${svg("people", 16)}<b>${acc}/${j.need}</b> žmonių</span></div></div><span class="jgo" aria-hidden="true">${svg("right", 18, 2).replace(I.right, '<path d="m9 18 6-6-6-6"/>')}</span></article>`;
}

function actionQueue() {
  const items = [];
  VJ().slice().sort((a, b) => a.d - b.d).forEach((j) => {
    const sub = `${up(j.title)} · ${rel(j.d)} ${j.from}`;
    j.workers.filter((w) => w[1] === "arrived").forEach(([id]) => items.push({ ic: "check", tone: "g", t: `${WORKERS[id].name} pažymėjo „Atvykau“`, s: sub, b: `<button class="btn sm green" type="button" data-act="confirmArr" data-job="${j.id}" data-id="${id}">Patvirtinti atvykimą</button>` }));
    const tc = j.workers.filter((w) => w[1] === "toClose");
    if (tc.length > 1) items.push({ ic: "clock", tone: "o", t: `Neuždarytos ${tc.length} darbuotojų darbo dienos`, s: sub, b: `<button class="btn sm" type="button" data-act="openJob" data-id="${j.id}">Po vieną</button><button class="btn sm primary" type="button" data-act="closeAll" data-id="${j.id}">Uždaryti visiems</button>` });
    else if (tc.length === 1) items.push({ ic: "clock", tone: "o", t: `Neuždaryta ${WORKERS[tc[0][0]].name} darbo diena`, s: sub, b: `<button class="btn sm primary" type="button" data-act="closeDay" data-job="${j.id}" data-id="${tc[0][0]}">Uždaryti dieną</button>` });
    const acc = j.workers.filter((w) => ["accepted", "arrived", "confirmed", "toClose", "closed"].includes(w[1])).length;
    if (j.d >= 0 && acc < j.need) items.push({ ic: "people", tone: "o", t: `Trūksta ${j.need - acc} ${j.need - acc === 1 ? "darbuotojo" : "darbuotojų"}`, s: sub, b: `<button class="btn sm" type="button" data-act="openJob" data-id="${j.id}">Kviesti darbuotojus</button>` });
  });
  return items;
}
function queueCard(items) {
  return `<section class="card queue"><header><div><h2>Reikia veiksmo${items.length ? ` · ${items.length}` : ""}</h2></div></header>${items.length ? `<div class="qlist">${items.map((q) => `<div class="qrow"><span class="qic ${q.tone}">${svg(q.ic, 16, 2.2)}</span><div class="qtx"><b>${esc(q.t)}</b><small>${esc(q.s)}</small></div><div class="qbt">${q.b}</div></div>`).join("")}</div>` : empty("Viskas sutvarkyta", "Šiuo metu jokių veiksmų nereikia.")}</section>`;
}
function eTodayHero() {
  const T = VJ().filter((x) => x.d === 0).sort((a, b) => b.workers.filter((w) => w[1] === "arrived").length - a.workers.filter((w) => w[1] === "arrived").length || a.from.localeCompare(b.from));
  if (!T.length) return "";
  const n = T.length, idx = ((S.heroI || 0) % n + n) % n, j = T[idx];
  const W = j.workers.filter((w) => ["accepted", "arrived", "confirmed", "toClose", "closed"].includes(w[1]));
  const here = W.filter((w) => ["arrived", "confirmed"].includes(w[1])).length;
  const wait = W.filter((w) => w[1] === "arrived").length;
  const nav = n > 1 ? `<div class="th-nav"><button type="button" class="th-arw" data-act="heroNav" data-v="-1" aria-label="Ankstesnis darbas">${svg("right", 16, 2.4).replace(I.right, '<path d="m15 18-6-6 6-6"/>')}</button><div class="th-dots" role="tablist" aria-label="Šiandienos darbai">${T.map((x, i) => `<button type="button" role="tab" class="th-dot${i === idx ? " on" : ""}${x.workers.some((w) => w[1] === "arrived") ? " hot" : ""}" data-act="heroGo" data-v="${i}" aria-selected="${i === idx}" title="${esc(up(x.title))}"></button>`).join("")}</div><span class="th-cnt">${idx + 1} / ${n}</span><button type="button" class="th-arw" data-act="heroNav" data-v="1" aria-label="Kitas darbas">${svg("right", 16, 2.4).replace(I.right, '<path d="m9 18 6-6-6-6"/>')}</button></div>` : "";
  return `<section class="thero" data-swipe="hero"><div class="th-l"><span class="th-eb"><i></i>${n > 1 ? `Šiandien vyksta ${n} darbai` : "Šiandien vyksta"}</span>
    <button type="button" class="th-title" data-act="openJob" data-id="${j.id}">${up(j.title)}</button>
    <div class="th-meta"><span>${svg("clock", 16)}<b>${j.from}–${j.to}</b></span><span>${svg("pin", 16)}${esc(j.addr)}</span><span>${svg("user", 16)}${j.resp === "Jūs" ? "Jūsų darbas" : esc(j.resp)}</span></div>
    <div class="th-arr"><div class="th-avs">${W.map(([id, st]) => `<span class="av lt sm${["arrived", "confirmed"].includes(st) ? " in" : ""}" title="${esc(WORKERS[id].name)} · ${st === "confirmed" ? "atvykimas patvirtintas" : st === "arrived" ? "pažymėjo „Atvykau“" : "dar neatvyko"}">${ini(WORKERS[id].name)}</span>`).join("")}</div><span>Atvyko <b>${here}/${j.need}</b></span></div></div>
    <div class="th-r"><div class="th-acts">${wait ? `<button class="btn green" type="button" data-act="openJob" data-id="${j.id}">${svg("check", 17, 2.6)}Patvirtinti atvykimą · ${wait}</button>` : `<button class="btn th-g" type="button" data-act="openJob" data-id="${j.id}">Atidaryti darbą</button>`}<button class="btn th-g" type="button" data-act="jobChat" data-id="${j.id}">${svg("chat", 16)}Pokalbis</button></div>${nav}</div></section>`;
}
function eOverview() {
  const J = VJ();
  const Q = actionQueue();
  const short = J.filter((j) => jobStatus(j)[0].startsWith("Trūksta")).length, unread = E().convs.filter((c) => c.unread).length;
  const cands = E().ads.reduce((a, x) => a + x.cands.filter((c) => c[1] === "new").length, 0);
  const tile = (ic, lab, val, sub, go, hot) => `<button type="button" class="ovcard ntile${hot ? " hot" : ""}" ${go}><span class="ovtop"><small>${lab}</small><span class="ntic">${svg(ic, 18)}</span></span><b class="ovval">${val}</b><span class="ovsub">${hot ? '<i class="ovdot"></i>' : ""}${sub}</span></button>`;
  const ring = (lab, val, max, color, unit, sub, key) => { const R = 40, C = 2 * Math.PI * R; return `<button type="button" class="ovcard ovbtn" data-act="goStat" data-v="${key}"><span class="ovtop"><small>${lab}</small></span><div class="ovrrow"><svg viewBox="0 0 100 100" width="92" height="92" aria-hidden="true"><circle cx="50" cy="50" r="${R}" fill="none" stroke="var(--line)" stroke-width="10"/><circle cx="50" cy="50" r="${R}" fill="none" stroke="${color}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - val / max)}" transform="rotate(-90 50 50)"/><text x="50" y="50" text-anchor="middle" font-family="Manrope,Inter,sans-serif" font-weight="800" font-size="24" fill="var(--navy)">${val}</text><text x="50" y="66" text-anchor="middle" font-family="Inter,sans-serif" font-size="10" fill="var(--muted)">${unit}</text></svg><div class="ovrtx"><span>${sub}</span></div></div><span class="ovmore">Statistika ${svg("right", 14).replace(I.right, '<path d="m9 18 6-6-6-6"/>')}</span></button>`; };
  const months = [-5, -4, -3, -2, -1, 0].map((o) => { const d = new Date(TODAY); d.setMonth(d.getMonth() + o); return MON_S[d.getMonth()]; });
  const vals = [6, 9, 8, 13, 15, 12 + E().draftNo];
  return `<h1 class="sr">Apžvalga</h1>${eTodayHero()}
  <section class="ovsec"><div class="ntiles">
    ${tile("jobs", "Aktyvūs darbai", J.length, `Šiandien ${J.filter((j) => j.d === 0).length} · rytoj ${J.filter((j) => j.d === 1).length}`, 'data-go="active"', false)}
    ${tile("people", "Trūksta darbuotojų", short, short ? "Pakvieskite laisvus" : "Visi darbai užpildyti", short ? 'data-act="goShort"' : 'data-go="active"', short)}
    ${can("ads") ? tile("briefcase", "Naujos kandidatūros", cands, cands ? "Darbo skelbimuose" : "Naujų nėra", 'data-go="eads"', cands) : tile("check", "Reikia veiksmo", Q.length, Q.length ? "Atvykimai ir darbo dienos" : "Viskas sutvarkyta", 'data-act="scrollQ"', Q.length)}
    ${tile("chat", "Naujos žinutės", unread, unread ? "Atidarykite pokalbį" : "Visos perskaitytos", 'data-act="openMessenger"', unread)}
  </div></section>
  ${Q.length ? `<div id="queue">${queueCard(Q)}</div>` : ""}
  <section class="ovsec"><h2 class="sect">Artimiausi darbai</h2><section class="card">${J.slice().sort((a, b) => (jobStatus(b)[2] ? 1 : 0) - (jobStatus(a)[2] ? 1 : 0) || a.d - b.d).slice(0, 3).map(empJobCard).join("")}<div class="seeall"><button class="linkb" type="button" data-go="active">Visi aktyvūs darbai (${J.length}) →</button></div></section></section>
  ${!can("stats") ? "" : `<section class="ovsec"><h2 class="sect">Įmonės statistika</h2><div class="ovstats">
    ${ring("Įmonės patikimumas", 97, 100, "var(--green)", "iš 100", "1 atšauktas per 30 d.", "rel")}
    ${ring("Užpildyti darbai", 15, 18, "var(--orange)", "iš 18", "83 % šį mėnesį", "fill")}
    <button type="button" class="ovcard ovhours ovbtn" data-act="goStat" data-v="fill"><div class="ovh-top"><div><small>Įvykdyti darbai</small><div class="ovbig">${vals[5]}<span> šį mėn.</span></div></div><div class="ovh-side"><b>21</b><span>darbuotojai</span></div></div>
      <div class="minibars">${vals.map((v, i) => `<div><i class="${i === 5 ? "now" : ""}" style="height:${(v / 16) * 100}%"></i><span>${months[i]}</span></div>`).join("")}</div><span class="ovmore">Statistika ${svg("right", 14).replace(I.right, '<path d="m9 18 6-6-6-6"/>')}</span></button>
  </div></section>`}`;
}

function eStatsBlock(compact) {
  return `<section class="card"><header><div><h2>Šio mėnesio statistika</h2></div>${compact ? `<button class="btn sm" type="button" data-go="stats">Išplėstinė statistika</button>` : ""}</header><div class="stats">
  <div class="stat"><small>Sukurta darbo pasiūlymų</small><b>${18 + E().draftNo}</b></div><div class="stat"><small>Žmonėmis užpildyti darbai</small><b>15</b></div><div class="stat warn"><small>Trūksta darbuotojų</small><b>1</b></div><div class="stat"><small>Įvykdyti darbai</small><b>12</b></div><div class="stat"><small>Atšaukti darbai</small><b>1</b></div><div class="stat"><small>Panaudoti darbuotojai / mėn.</small><b>21</b></div>
  <button type="button" class="stat" data-act="reliability"><small>Įmonės patikimumas</small><b style="color:var(--green)">97</b><span>Kaip skaičiuojama? Spauskite</span></button></div></section>`;
}

const PHONES = { worker: "+37061234567", company: "+37060000000", me: "+37061112233" };
function mailField(v) { return `<div class="field"><span>El. paštas</span><div class="mailro" title="El. pašto pakeisti negalima – juo jungiatės prie paskyros">${svg("mail", 16)}<b>${esc(v)}</b><span class="mlock">${svg("lock", 13, 2.2)}Užrakinta</span></div></div>`; }
function phoneField(key, label, editable = true) { return `<div class="field"><span>${label}</span><div class="phrow"><b>${esc(PHONES[key])}</b><span class="phok">${svg("check", 12, 3)}Patvirtintas</span>${editable ? `<button class="btn sm" type="button" data-act="phOpen" data-v="${key}">Keisti</button>` : ""}</div></div>`; }
const LOG = (what, obj) => { E().log.unshift([ME(), what, obj, "Ką tik"]); };
const proTag = `<span class="protag">Pro</span>`, bizTag = `<span class="protag">Business</span>`;
function tplBar() {
  const T = E().templates, ok = hasPlan("business");
  return `<section class="card tplbar"><div class="tplh">${svg("file", 17)}<b>Šablonai</b>${ok ? "" : bizTag}</div>${ok ? (T.length ? `<div class="tplcar"><button type="button" class="tplarr" data-tplscroll="-1" aria-label="Ankstesni šablonai">${svg("back", 16, 2.4)}</button><div class="tplchips" id="tplchips">${T.map((t, i) => [t, i]).reverse().map(([t, i]) => `<button type="button" class="chip" data-act="tplUse" data-v="${i}" title="${esc(t.n)}">${esc(t.n)}</button>`).join("")}</div><button type="button" class="tplarr" data-tplscroll="1" aria-label="Kiti šablonai">${svg("right", 16, 2.4).replace(I.right, '<path d="m9 18 6-6-6-6"/>')}</button></div>${T.length > 1 ? `<button type="button" class="btn sm ghost tplall" data-act="tplAll" title="Ieškoti ir tvarkyti šablonus">${svg("search", 14, 2.2)}<span>${T.length}</span></button>` : ""}` : `<span class="small muted">Išsaugokite darbą kaip šabloną – kitą kartą užpildysite vienu paspaudimu.</span>`) : `<span class="small muted">Dažnai kartojamą darbą sukurkite vienu paspaudimu.</span><button class="btn sm" type="button" data-go="plans">${svg("lock", 13, 2.2)}Atrakinti</button>`}</section>`;
}
function eNew() {
  const f = S.form || (S.form = { title: "", resp: ME(), people: "2", city: "Vilnius", addr: "", date: iso(dOff(2)), from: "08:00", to: "17:00", lunch: true, lf: "12:00", lt: "12:30", payAmount: "", arrival: "Darbuotojas atvyksta pats", desc: "", agree: false });
  const sec = (n, t, body, extra = "") => `<section class="card afsec"><header class="afh"><span class="afn">${n}</span><h2>${t}</h2>${extra}</header>${body}</section>`;
  const dd = new Date(f.date || iso(dOff(2)));
  const ed = S.editJob, lim = { basic: 5, business: 25 }[PLAN()], used = lim ? E().usedMonth[PLAN()] : 0, full = !ed && lim && used >= lim;
  const limBox = !ed && lim ? `<div class="limbox${used / lim >= 0.8 ? " warn" : ""}"><div class="limtx"><span>Šį mėnesį panaudota <b>${used} iš ${lim}</b> darbo pasiūlymų</span><div class="limbar"><i style="width:${Math.min(100, used / lim * 100)}%"></i></div></div>${used / lim >= 0.8 ? `<span class="limup">${full ? "Limitas pasiektas." : `Liko ${lim - used}.`} Su Business Pro – neribotai.</span><button class="btn sm primary" type="button" data-go="plans">Pereiti į Pro</button>` : ""}</div>` : "";
  return `<div class="head"><div><h1>${ed ? "Redaguoti darbo sąlygas" : "Naujas darbo pasiūlymas"}</h1><p class="lead">${ed ? "Keisti galima, kol niekas nepriėmė ir nepakviestas" : `${PLN[PLAN()]} · ${hasPlan("pro") ? "pasiūlymų skaičius neribojamas" : hasPlan("business") ? "iki 25 per mėnesį" : "iki 5 per mėnesį"}`}</p></div></div>
  ${limBox}
  <form class="jd-grid adnew newjob" data-form="job" novalidate><div class="jd-main">
    ${ed ? "" : tplBar()}
    ${sec(1, "Darbas", `<div class="form"><label class="field wide" for="f-title">Pavadinimas *<input id="f-title" name="title" value="${esc(f.title)}" placeholder="Pvz. Pagalbiniai mūro darbai"></label>
      <label class="field" for="f-people">Kiek žmonių reikia<select id="f-people" name="people">${[1, 2, 3, 4, 5, 6, 8, 10].map((n) => `<option${String(n) === f.people ? " selected" : ""}>${n}</option>`).join("")}</select></label>
      ${can("allJobs") ? `<label class="field" for="f-resp">Atsakingas<select id="f-resp" name="resp">${E().team.filter((t) => t[1] !== "Objekto vadovas").map(([n, r]) => `<option value="${n}"${f.resp === n ? " selected" : ""}>${n} · ${r}</option>`).join("")}</select></label>` : `<div class="field"><span>Atsakingas</span><div class="ro">${esc(ME())}</div></div>`}
      ${E().team.some((t) => t[1] === "Objekto vadovas") ? `<label class="field wide" for="f-site">Pasitinka objekte (nebūtina)<select id="f-site" name="site"><option value="">Nėra – atvykimus tvirtina atsakingas</option>${E().team.filter((t) => t[1] === "Objekto vadovas").map(([n, r]) => `<option value="${n}"${f.site === n ? " selected" : ""}>${n} · ${r}</option>`).join("")}</select></label>` : ""}</div>`)}
    ${sec(2, "Vieta ir laikas", `<div class="form">${hasPlan("business") ? `<label class="field wide" for="f-obj">Objektas<select id="f-obj" name="obj"><option value="">Naujas adresas</option>${E().objects.map((o) => `<option${f.obj === o.n ? " selected" : ""}>${esc(o.n)}</option>`).join("")}</select></label>` : `<div class="field wide"><span>Objektas ${bizTag}</span><button class="btn lockd" type="button" data-go="plans">${svg("lock", 13, 2.2)}Išsaugoti objektai – Business plane</button></div>`}<label class="field" for="f-city">Miestas *<input id="f-city" name="city" value="${esc(f.city)}" placeholder="Pradėkite rašyti miestą"></label>
      <label class="field" for="f-addr">Atvykti adresu *<input id="f-addr" name="addr" value="${esc(f.addr)}" placeholder="Gatvė, namo nr."></label>
      <label class="field" for="f-date">Data *<input id="f-date" name="date" type="date" value="${f.date}"></label>
      <div class="field"><span>Darbo laikas *</span><div class="pair"><label class="sr" for="f-from">Pradžia</label><select id="f-from" name="from">${timeOpts(f.from)}</select><label class="sr" for="f-to">Pabaiga</label><select id="f-to" name="to">${timeOpts(f.to)}</select></div></div>
      <div class="field"><span class="lblrow">Pietų pertrauka<span class="segs" role="radiogroup" aria-label="Pietų pertrauka"><label><input type="radio" name="f-lunchk" data-act="lunch" data-v="1"${f.lunch ? " checked" : ""}><span>Yra</span></label><label><input type="radio" name="f-lunchk" data-act="lunch" data-v="0"${!f.lunch ? " checked" : ""}><span>Nėra</span></label></span></span>${f.lunch ? `<div class="pair"><label class="sr" for="f-lf">Pertraukos pradžia</label><select id="f-lf" name="lf">${timeOpts(f.lf)}</select><label class="sr" for="f-lt">Pertraukos pabaiga</label><select id="f-lt" name="lt">${timeOpts(f.lt)}</select></div>` : `<div class="ro">Pietų pertraukos nėra</div>`}</div>
      <label class="field" for="f-arr">Atvykimas *<select id="f-arr" name="arrival"><option${f.arrival === "Darbuotojas atvyksta pats" ? " selected" : ""}>Darbuotojas atvyksta pats</option><option${f.arrival === "Darbdavys paima darbuotoją" ? " selected" : ""}>Darbdavys paima darbuotoją</option></select></label></div>`)}
    ${sec(3, "Atlygis", `<div class="form"><div class="field"><span>Mokama *</span><div class="segs wide2" role="radiogroup" aria-label="Mokėjimo tipas"><label><input type="radio" name="f-unit" data-act="payUnit" data-v="hour"${S.payUnit === "hour" ? " checked" : ""}><span>Už valandą</span></label><label><input type="radio" name="f-unit" data-act="payUnit" data-v="day"${S.payUnit === "day" ? " checked" : ""}><span>Už dieną</span></label></div></div>
      <label class="field" for="f-pay">Suma *<span class="inpx"><input id="f-pay" name="payAmount" inputmode="decimal" value="${esc(f.payAmount)}" placeholder="${S.payUnit === "hour" ? "14" : "120"}"><em>€ / ${S.payUnit === "hour" ? "val." : "d."}</em></span></label></div>`, `<div class="segs" role="radiogroup" aria-label="Atlygio tipas"><label><input type="radio" name="f-gross" data-act="payKind" data-v="net"${!S.payGross ? " checked" : ""}><span>Į rankas</span></label><label><input type="radio" name="f-gross" data-act="payKind" data-v="gross"${S.payGross ? " checked" : ""}><span>Ant popieriaus</span></label></div>`)}
    ${sec(4, "Aprašymas", `<div class="form"><label class="field wide" for="f-desc">Ką reikės dirbti *<textarea id="f-desc" name="desc" placeholder="Pvz. Blokelių padavimas mūrininkams, skiedinio maišymas. Įrankiai suteikiami, reikalinga darbo avalynė.">${esc(f.desc)}</textarea></label></div>`)}
  </div><aside class="jd-side">
    <section class="card mtc"><header><h2>Kas gaus pasiūlymą</h2></header>
      <div class="mtc-big"><b>6</b><span>darbuotojai atitinka ir gali atvykti</span></div>
      <div class="mtc-steps"><div><span>Pažymėjo, kad laisvi <b id="mt-date">${iso(dd)}</b></span><em>14</em></div><div><span>Laisvi visą laiką <b id="mt-time">${f.from}–${f.to}</b></span><em>9</em></div><div><span>Neturi kito darbo tuo metu</span><em>8</em></div><div><span>Aktyvūs per paskutines 24 val.</span><em class="hl">6</em></div></div>
      <div class="mtc-note gbox">${svg("people", 15, 2.2)}<span>Kviesti galėsite kiek norite žmonių – vietas užims pirmieji priėmę. Kai visos vietos užpildytos, kiti kvietimai nebegalioja automatiškai.</span></div>
      ${hasPlan("pro") ? `<div class="prio">${svg("bolt", 15, 2.2)}<span>Business Pro – jūsų pasiūlymas darbuotojams rodomas pirmiau.</span></div>` : `<button type="button" class="prio lk" data-go="plans">${svg("lock", 14, 2.2)}<span>Su Business Pro pasiūlymas rodomas pirmiau</span></button>`}
    </section>
    <section class="card autoc">${hasPlan("pro") ? `<label class="tglrow"><span><b>Automatinis kvietimas</b><small>Jei kas atsisako – kvietimą automatiškai gaus kitas iš mėgstamų darbuotojų</small></span><input type="checkbox" name="auto" class="sw"${f.auto !== false ? " checked" : ""}></label>` : `<div class="tglrow lk"><span><b>Automatinis kvietimas ${proTag}</b><small>Atsisakius – kvietimas automatiškai siunčiamas kitam</small></span><button class="btn sm" type="button" data-go="plans">${svg("lock", 13, 2.2)}</button></div>`}</section>
    <section class="card jd-act">
      <label class="check small" data-tip="Padedame suvesti darbdavį ir darbuotoją, tačiau atlygio už darbą nemokame. Darbdavys atsako už apmokėjimą, teisėtą ir saugų darbo organizavimą."><input type="checkbox" id="f-agree" name="agree"${f.agree ? " checked" : ""}> Patvirtinu atsakomybę už apmokėjimą ir saugų darbą</label>
      <p class="small" id="f-err" style="color:var(--red);font-weight:600;margin:0" role="alert"></p>
      <button class="btn primary jd-wide" type="submit"${full ? " disabled" : ""}>${ed ? "Išsaugoti pakeitimus" : "Sukurti darbo pasiūlymą"}</button>${hasPlan("business") ? `<button class="btn jd-wide" type="button" data-act="tplSave">${svg("file", 15)}Išsaugoti kaip šabloną</button>` : ""}${ed ? `<button class="btn jd-wide" type="button" data-act="jobEditCancel">Atšaukti</button>` : `<button class="btn jd-wide" type="button" data-go="overview">Atšaukti</button>`}
    </section>
  </aside></form>`;
}

function eActive() {
  const J = can("allJobs") ? (S.jobScope === "mine" ? E().jobs.filter((j) => j.resp === ME()) : S.jobWho && S.jobWho !== "all" ? E().jobs.filter((j) => j.resp === S.jobWho) : E().jobs) : VJ();
  return `<div class="head"><div><h1>${RK() === "site" ? "Mano objektai" : "Aktyvūs darbai"}</h1><p class="lead">${!can("allJobs") ? (RK() === "site" ? "Jums priskirti objektai" : "Jūsų darbai") : S.jobScope === "mine" ? "Darbai, už kuriuos esate atsakingas" : "Visi įmonės darbai"}</p></div>${can("allJobs") ? `<div class="toggle2" role="group" aria-label="Darbų apimtis" style="min-width:280px"><button type="button" data-act="scope" data-v="mine" aria-pressed="${S.jobScope === "mine"}">Mano darbai · ${E().jobs.filter((j) => j.resp === ME()).length}</button><button type="button" data-act="scope" data-v="all" aria-pressed="${S.jobScope === "all"}">Visi įmonės darbai · ${E().jobs.length}</button></div>` : ""}</div>
  ${can("allJobs") && S.jobScope === "all" && E().team.length > 1 ? `<div class="chips whochips" role="group" aria-label="Kieno darbai"><button type="button" class="chip" data-act="jobWho" data-v="all" aria-pressed="${!S.jobWho || S.jobWho === "all"}">Visi · ${E().jobs.length}</button>${E().team.filter(([n]) => E().jobs.some((x) => x.resp === n)).map(([n]) => `<button type="button" class="chip" data-act="jobWho" data-v="${esc(n)}" aria-pressed="${S.jobWho === n}"><span class="av lt">${n === "Jūs" ? "UP" : ini(n)}</span>${esc(n)} · ${E().jobs.filter((x) => x.resp === n).length}</button>`).join("")}</div>` : ""}
  ${(() => { if (!J.length) return `<section class="card">${empty("Aktyvių darbų nėra", "Kai jums bus priskirtas aktyvus darbas, jis atsiras čia.", "jobs")}</section>`; const srt = J.slice().sort((a, b) => a.d - b.d), need = srt.filter((j) => jobStatus(j)[2]), rest = srt.filter((j) => !jobStatus(j)[2]); const grp = (t, L, k) => L.length ? `<div class="lgroup${k === "n" ? " hot" : ""}"><h2 class="lgh">${t} <span>${L.length}</span></h2>${paged("eact-" + k + S.jobScope, L, empJobCard)}</div>` : ""; return grp("Reikia jūsų veiksmo", need, "n") + grp("Vyksta ir suplanuoti", rest, "r"); })()}`;
}

function wkRow(w, actions, extra = "") {
  return `<div class="wk">${wAv(w)}<div class="wn"><b class="nm">${esc(w.name)}</b><small>${esc(w.active)}</small>${extra}</div><div class="wa">${actions}<button class="btn sm" type="button" data-act="profileW" data-id="${w.id}">${svg("user", 15)}Profilis</button></div></div>`;
}

function eJob() {
  const j = E().jobs.find((x) => x.id === E().openJob);
  if (!j) return eActive();
  const [t, c] = jobStatus(j);
  const acc = j.workers.filter((w) => ["accepted", "arrived", "confirmed", "toClose", "closed"].includes(w[1]));
  const inv = j.workers.filter((w) => w[1] === "invited");
  const dec = j.workers.filter((w) => w[1] === "declined");
  const used = new Set(j.workers.map((w) => w[0]));
  const avail = Object.values(WORKERS).filter((w) => !used.has(w.id) && w.city === j.city).sort((a, b) => MUTUAL_W.includes(b.id) - MUTUAL_W.includes(a.id)).slice(0, 4);
  const favIds = new Set(E().favorites.map((f) => f[0]));
  const accAct = (w, st) => {
    const fav = `<button type="button" class="favbtn${favIds.has(w.id) ? " on" : ""}" data-act="${favIds.has(w.id) ? "unfav" : "fav"}" data-id="${w.id}" title="${favIds.has(w.id) ? "Pašalinti iš mėgstamų" : "Pridėti prie mėgstamų"}" aria-pressed="${favIds.has(w.id)}">${heartSVG(17, favIds.has(w.id))}</button>`;
    if (st === "accepted" && j.d === 0) return `<button class="btn sm ghost" type="button" data-act="wChat" data-job="${j.id}" data-id="${w.id}">Privati žinutė</button><button class="btn sm green" type="button" data-act="confirmArr" data-job="${j.id}" data-id="${w.id}">Patvirtinti atvykimą</button>`;
    if (st === "accepted") return `<button class="btn sm ghost" type="button" data-act="wChat" data-job="${j.id}" data-id="${w.id}">Privati žinutė</button>`;
    if (st === "arrived") return `<button class="btn sm ghost" type="button" data-act="wChat" data-job="${j.id}" data-id="${w.id}">Privati žinutė</button><button class="btn sm green" type="button" data-act="confirmArr" data-job="${j.id}" data-id="${w.id}">Patvirtinti atvykimą</button>`;
    if (st === "confirmed") return `<button class="btn sm ghost" type="button" data-act="wChat" data-job="${j.id}" data-id="${w.id}">Privati žinutė</button>`;
    if (st === "toClose") return `<button class="btn sm primary" type="button" data-act="closeDay" data-job="${j.id}" data-id="${w.id}">Uždaryti dieną</button>`;
    if (st === "closed") return fav;
    return "";
  };
  const stLine = (st) => ({ arrived: `<div class="wkst o">${svg("clock", 13, 2.4)}Pažymėjo „Atvykau“</div>`, confirmed: `<div class="wkst g">${svg("check", 13, 2.6)}Atvykimas patvirtintas</div>`, closed: `<div class="wkst g">${svg("check", 13, 2.6)}Diena uždaryta</div>` }[st] || "");
  const accN = acc.length;
  const eSide = `<section class="card jd-co"><h2>Komanda</h2><div class="jd-prog"><b>${accN}/${j.need}</b><span>darbuotojų patvirtino</span></div><div class="jd-bar"><i style="width:${Math.min(100, (accN / j.need) * 100)}%"></i></div><p class="small muted" style="margin:0">${inv.length ? `Laukia atsakymo: ${inv.length}` : accN < j.need ? "Pakvieskite daugiau darbuotojų žemiau" : "Komanda surinkta"}</p>${hasPlan("pro") && accN < j.need ? `<div class="prio sm">${svg("bolt", 14, 2.2)}<span>Rodoma darbuotojams pirmiau</span></div>` : ""}<div class="jd-resp"><small>Atsakingas</small><div class="co-line"><div class="av lt sm">${j.resp === "Jūs" ? "UP" : ini(j.resp)}</div><div><b>${esc(j.resp)}</b><small>${(E().team.find((t) => t[0] === j.resp) || [, "Komandos narys"])[1]} · valdo darbą</small></div></div><small style="margin-top:6px">Pasitinka objekte</small>${j.site ? `<div class="co-line"><div class="av lt sm">${ini(j.site)}</div><div><b>${esc(j.site)}</b><small>${(E().team.find((t) => t[0] === j.site) || [, "Objekto vadovas"])[1]} · tvirtina atvykimus</small></div></div>` : `<p class="small muted" style="margin:0">Atvykimus tvirtina atsakingas</p>`}${can("handover", j) && j.d >= 0 && E().team.some((t) => t[1] === "Objekto vadovas") ? `<button type="button" class="linkb dk sm2" data-act="siteEdit" data-id="${j.id}">${j.site ? "Keisti" : "Priskirti objekto vadovą"}</button>` : ""}${E().team.length > 1 && j.d >= 0 && can("handover", j) ? `<button class="btn sm jd-wide" type="button" data-act="handover" data-id="${j.id}">${svg("send", 15)}Perduoti darbą</button>` : ""}</div></section>`;
  const eActs = `<button class="btn dark jd-wide" type="button" data-act="jobChat" data-id="${j.id}">${svg("chat", 16)}Darbo pokalbis</button>${inv.length || acc.length || !can("invite", j) ? "" : `<button class="btn jd-wide" type="button" data-act="jobEdit" data-id="${j.id}">${svg("file", 15)}Redaguoti sąlygas</button>`}${j.d > 0 && can("cancel", j) ? `<button class="btn danger jd-wide" type="button" data-act="cancelJob" data-id="${j.id}">${acc.length ? "Atšaukti darbą" : "Ištrinti darbą"}</button>` : ""}`;
  const mainExtra = `  ${(() => { const tc = j.workers.filter((w) => w[1] === "toClose"); return tc.length > 1 ? `<div class="alert" data-tip="Jei kas nors išėjo anksčiau ar neatvyko – uždarykite jo dieną atskirai."><div><b>Neuždarytos ${tc.length} darbuotojų darbo dienos</b></div><div class="row"><button class="btn primary" type="button" data-act="closeAll" data-id="${j.id}">Uždaryti visiems</button></div></div>` : ""; })()}
  <section class="card"><header><div><h2>Priėmę darbuotojai · ${acc.length}/${j.need}</h2></div></header><div class="list">${acc.length ? acc.map(([id, st]) => wkRow(WORKERS[id], accAct(WORKERS[id], st), stLine(st))).join("") : empty("Šiuo metu pasiūlymo dar nepriėmė nė vienas darbuotojas.", "Pakvieskite laisvus darbuotojus žemiau.", "people")}</div></section>
  ${acc.length < j.need && j.d >= 0 && can("invite", j) ? (() => {
    const tab = S.invTab === "fav" ? "fav" : "free";
    const busyFav = new Set(["w7"]);
    const favs = E().favorites.map((f) => WORKERS[f[0]]);
    const favFree = favs.filter((w) => !used.has(w.id) && !busyFav.has(w.id));
    const tabs = `<div class="segs invtabs" role="tablist" aria-label="Kviesti"><label><input type="radio" name="invt" data-act="invTab" data-v="free"${tab === "free" ? " checked" : ""}><span>Laisvi darbuotojai</span></label><label><input type="radio" name="invt" data-act="invTab" data-v="fav"${tab === "fav" ? " checked" : ""}><span>Mėgstami darbuotojai</span></label></div>`;
    const waiting = inv.length ? `<div class="list">${inv.map(([id]) => wkRow(WORKERS[id], `<span class="pill orange">Laukia atsakymo</span>`)).join("")}</div>` : "";
    let body;
    if (tab === "free") body = `<div class="list">${avail.length ? avail.map((w) => wkRow(w, `<button class="btn sm primary" type="button" data-act="invite" data-job="${j.id}" data-id="${w.id}">Kviesti</button>`, MUTUAL_W.includes(w.id) ? `<span class="likesus">${svg("people", 13, 2.2)}Nuolatinė komanda · gaus kvietimą pirmas</span>` : "")).join("") : empty("Papildomų laisvų darbuotojų nerasta", "Šiuo metu papildomų laisvų darbuotojų pagal šiuos kriterijus nerasta.", "search")}</div>`;
    else body = `${favFree.length ? `<div class="favall"><span><b>${favFree.length}</b> ${favFree.length === 1 ? "mėgstamas laisvas" : "mėgstami laisvi"} šiam darbui</span><button class="btn sm primary" type="button" data-act="inviteFavs" data-id="${j.id}">${svg("send", 15)}Pakviesti tinkamus · ${favFree.length}</button></div>` : ""}<div class="list">${favs.length ? favs.map((w) => { const st = (j.workers.find((x) => x[0] === w.id) || [])[1]; const act = st === "invited" ? pill("Pakviestas", "orange") : st ? pill("Jau šiame darbe", "green") : busyFav.has(w.id) ? pill("Užimtas tą dieną") : `<button class="btn sm primary" type="button" data-act="invite" data-job="${j.id}" data-id="${w.id}">Kviesti</button>`; return wkRow(w, act); }).join("") : empty("Mėgstamų darbuotojų dar nėra", "Paspauskite širdelę prie darbuotojo po užbaigto darbo.", "star")}</div>`;
    return `<section class="card"><header><div><h2>Kviesti darbuotojus</h2></div>${tabs}</header><div class="invnote">${svg("bolt", 15)}<span>Kviesti galite kiek norite – <b>${j.need - acc.length} ${j.need - acc.length === 1 ? "vietą" : "vietas"}</b> užims pirmieji priėmę. Kitiems kvietimas nebegalios automatiškai.</span>${tab === "free" && avail.length ? `<button class="btn sm primary" type="button" data-act="inviteAll" data-id="${j.id}">${svg("send", 14)}Kviesti visus · ${avail.length}</button>` : ""}</div>${waiting}${body}</section>`;
  })() : ""}
  ${hasPlan("pro") && j.auto ? `<section class="card autoinfo"><header><div><h2>${svg("bolt", 17, 2.2)} Automatinis kvietimas <span class="pill green">Įjungta</span></h2></div><button class="btn sm" type="button" data-act="autoOff" data-id="${j.id}">Išjungti</button></header><p class="small muted" style="margin:0">Kai kas nors atsisako, kvietimą iškart gauna kitas laisvas darbuotojas iš mėgstamų.</p>${(j.autoLog || []).map(([a, b]) => `<div class="autorow"><span>${esc(WORKERS[a].name)} atsisakė</span>${svg("right", 14, 2.4).replace(I.right, '<path d="m9 18 6-6-6-6"/>')}<b>automatiškai pakviestas ${esc(WORKERS[b].name)}</b></div>`).join("")}</section>` : ""}
  ${dec.length ? `<section class="card"><header><div><h2>Atsisakę · ${dec.length}</h2></div></header><div class="list">${dec.map(([id]) => wkRow(WORKERS[id], "")).join("")}</div></section>` : ""}`;
  return jobDetail(j, { back: 'data-go="active"', backLabel: "aktyvius darbus", pills: pill(t, c), actions: eActs, side: eSide, mainExtra, hidePay: RK() === "site" });
}


function eEndedJob() {
  const x0 = E().ended.find((y) => y.id === S.endedId); if (!x0) return eEnded();
  const x = { from: "08:00", to: "16:00", city: "Vilnius", addr: "Ozo g. 25, Vilnius", pay: 14, unit: "hour", lunch: "12:00–12:30", arrival: "Darbuotojas atvyksta pats", desc: "Pagalbiniai darbai statybvietėje: medžiagų pernešimas, tvarkymas, pagalba meistrams. Reikalinga darbo avalynė.", ...x0 };
  const lab = { done: ["Įvykdyta", "green"], cancelled: ["Atšaukta", "red"], short: ["Trūko darbuotojų", "orange"] }[x.result];
  const mainExtra = x.result === "cancelled" ? `<section class="card jd-sec"><h2>Atšaukimo priežastis</h2><div class="jd-desc"><p>${esc(x.reason)}</p></div></section>` : `<section class="card jd-sec"><h2>Dirbę darbuotojai</h2><div class="list">${x.workers.map(([id, r]) => wkRow(WORKERS[id], `<span class="pill green">${r}/10</span>`)).join("")}</div></section>`;
  return jobDetail(x, { back: 'data-go="ended"', backLabel: "pasibaigusius darbus", pills: pill(...lab), mainExtra: mainExtra + archSection("employer", x.title), actions: `<button class="btn primary jd-wide" type="button" data-act="copyJob" data-id="${x.id}">Kurti panašų darbą</button>` });
}
function eEnded() {
  const X = E().ended;
  const lab = { done: ["Įvykdyta", "green"], cancelled: ["Atšaukta", "red"], short: ["Trūko darbuotojų", "orange"] };
  return `<div class="head"><div><span class="eyebrow">Darbdavio paskyra</span><h1>Pasibaigę darbai</h1><p class="lead">Užbaigti ir atšaukti darbai bus saugomi čia. Galite vėl atidaryti ankstesnį poreikį.</p></div></div>
  <section class="card">${paged("ended", X, (x) => `<article class="job" data-act="openEnded" data-id="${x.id}" tabindex="0" role="link" aria-label="${esc(up(x.title))}"><div class="jm"><div class="jtop"><h3>${up(x.title)}</h3><div class="row jpills">${pill(...lab[x.result])}</div></div><div class="metrics"><span>${svg("user", 16)}${x.resp && x.resp !== "Jūs" ? esc(x.resp) : "Jūsų darbas"}</span></div></div><span class="jgo" aria-hidden="true">${svg("right", 18, 2).replace(I.right, '<path d="m9 18 6-6-6-6"/>')}</span></article>`)}</section>`;
}

function eCalendar() {
  const first = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
  const start = new Date(first); start.setDate(1 - ((first.getDay() + 6) % 7));
  const allJobs = VJ().map((j) => ({ ...j, k: iso(dOff(j.d)), ended: false })).concat(E().ended.map((x) => ({ ...x, k: iso(dOff(x.d)), ended: true })));
  let cells = "";
  for (let i = 0; i < 42; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i); const k = iso(d);
    const ev = allJobs.filter((j) => j.k === k);
    cells += `<button type="button" class="${d.getMonth() !== TODAY.getMonth() ? "out" : ""}${k === iso(TODAY) ? " today" : ""}" data-act="calDay" data-k="${k}" aria-pressed="${S.calDay === k}" aria-label="${k}${ev.length ? `, darbų: ${ev.length}` : ""}"><span class="dn">${d.getDate()}</span>${k >= iso(TODAY) && can("create") ? `<span class="addday" data-act="newOnDay" data-k="${k}" title="Sukurti darbą šiai dienai">${svg("plus", 12, 2.6)}</span>` : ""}${ev.map((e) => `<span class="ev${e.ended ? " g" : ""}">${esc(e.title)}</span>`).join("")}</button>`;
  }
  const sel = allJobs.filter((j) => j.k === S.calDay);
  return `<div class="head"><div><h1>Darbų kalendorius</h1><p class="lead">Visi įmonės darbai pagal datą.</p></div></div>
  <section class="card"><header><div><h2>${MON[TODAY.getMonth()]} ${TODAY.getFullYear()}</h2></div><div class="row" style="gap:6px">${pill("Aktyvus", "orange")}${pill("Pasibaigęs", "green")}</div></header>
  <div style="overflow-x:auto"><div class="cal" style="min-width:300px">${["Pr", "An", "Tr", "Kt", "Pn", "Št", "Sk"].map((d) => `<div class="wd">${d}</div>`).join("")}${cells}</div></div></section>
  <section class="card calsel"><header><div><h2>${S.calDay}</h2></div></header><div class="list">${sel.length ? sel.map((j) => j.ended ? `<article class="job"><div class="jm"><div class="jtop"><h3>${up(j.title)}</h3>${pill("Pasibaigęs", "green")}</div></div></article>` : empJobCard(j)).join("") : empty("Šią dieną darbų nėra", S.calDay >= iso(TODAY) ? "Diena laisva – darbą sukursite paspaudę „+“ dienos kampe." : "Pasirinkite kitą dieną.", "cal")}</div></section>`;
}

function eFavorites() {
  return `<div class="head"><div><h1>Mėgstami darbuotojai</h1><p class="lead">Juos galėsite pakviesti pirmiausia.</p></div></div>
  <section class="card"><div class="list flatwk">${E().favorites.length ? E().favorites.map(([id, t, d]) => { const w = WORKERS[id]; return `<div class="wk fw">${wAv(w)}<div class="fwm"><div class="fwt"><b class="nm">${esc(w.name)}</b><small class="muted">${esc(w.active)}</small>${MUTUAL_W.includes(id) ? `<span class="likesus">${svg("people", 13, 2.2)}Nuolatinė komanda</span>` : ""}</div><small class="muted fwl">Paskutinis darbas: <b>${esc(t)}</b> <span>· ${iso(dOff(d))}</span></small></div><div class="wa"><button type="button" class="favbtn on" data-act="unfav" data-id="${id}" title="Pašalinti iš mėgstamų" aria-pressed="true">${heartSVG(17, true)}</button><button class="btn sm" type="button" data-act="profileW" data-id="${w.id}">${svg("user", 15)}Profilis</button></div></div>`; }).join("") : empty("Mėgstamų darbuotojų dar nėra", "Prie patikusio darbuotojo paspauskite širdelę.", "star")}</div></section>`;
}

function eUrgent() {
  const list = Object.values(WORKERS).filter((w) => w.freeNow && w.city === S.urgentCity);
  return `<div class="head"><div><h1>Skubiai!</h1><p class="lead">Kas gali atvykti dirbti dabar. Skambinkite tiesiogiai.</p></div></div>
  <div class="adbar"><div class="chips" role="group" aria-label="Miestas">${["Vilnius", "Kaunas", "Klaipėda"].map((c) => `<button type="button" class="chip" data-act="urgCity" data-v="${c}" aria-pressed="${S.urgentCity === c}">${c}</button>`).join("")}</div></div>
  <section class="card">
  <div class="list">${list.length ? list.map((w) => wkRow(w, `<a class="btn sm dark" href="tel:${w.phone.replace(/\s/g, "")}">${svg("phone", 15)}${w.phone}</a><button class="btn sm" type="button" data-act="copy" data-v="${w.phone}">Kopijuoti</button>`)).join("") : empty("Šiame mieste šiuo metu laisvų ir aktyvių darbuotojų nerasta.", "Pabandykite kitą miestą arba sukurkite įprastą darbo pasiūlymą.", "search")}</div></section>`;
}

function eHire() {
  return `<div class="head"><div><span class="eyebrow">Ilgalaikis įdarbinimas</span><h1>Įdarbinti darbuotoją</h1><p class="lead">Čia galite valdyti aktyvius ilgalaikius darbuotojus, peržiūrėti sutartis ir rašyti žinutes. Pasiūlymą galima siųsti tik darbuotojui, su kuriuo turite bent vieną tvarkingai užbaigtą darbo dieną.</p></div><button class="btn primary" type="button" data-act="hireForm">${svg("plus", 18, 2.4)}Naujas įdarbinimo pasiūlymas</button></div>
  <section class="card"><h2>Išsiųsti pasiūlymai</h2><div class="list">
  ${wkRow(WORKERS.w1, `<button class="btn sm" type="button" data-act="toast" data-msg="Prototipe sutarties failas neatidaromas">${svg("file", 15)}Pasirašyta sutartis</button><button class="btn sm green" type="button" data-act="toast" data-msg="Pasirašyta sutartis priimta. Darbuotojo įdarbinimas aktyvuotas.">Priimu darbuotoją</button>`, `<div class="step"><span class="dot"></span><div><b>Statybų darbininkas · neterminuota</b><p>Darbuotojas įkėlė pasirašytą sutartį. Peržiūrėkite ir patvirtinkite įdarbinimą.</p></div></div>`)}
  ${wkRow(WORKERS.w7, `<button class="btn sm danger" type="button" data-act="toast" data-msg="Įdarbinimo pasiūlymas atšauktas (prototipas)">Atšaukti pasiūlymą</button>`, `<div class="step info"><span class="dot"></span><div><b>Betonuotojas · terminuota iki ${iso(dOff(180))}</b><p>Laukiama, kol darbuotojas perskaitys ir pasirašys sutartį.</p></div></div>`)}
  </div></section>
  <section class="card"><h2>Įdarbinti</h2>${empty("Aktyviai įdarbintų darbuotojų kol kas nėra.", "Patvirtinus pasirašytą sutartį darbuotojas atsiras šiame sąraše.", "people")}</section>`;
}

const ROLE_INFO = [
  ["owner", "Savininkas", "Visos teisės ir atsakomybė už mokėjimus.", ["Visi darbai, skelbimai ir statistika", "Komanda: kviesti, šalinti, keisti roles", "Planas, mokėjimai, įmonės profilis"], []],
  ["manager", "Vadovas", "Kasdien valdo visus įmonės darbus.", ["Mato ir valdo visus darbus", "Perduoda darbus, kviečia vadybininkus ir objekto vadovus", "Darbo skelbimai ir kandidatai"], ["Planas ir mokėjimai", "Įmonės ištrynimas"]],
  ["recruiter", "Vadybininkas", "Kuria ir prižiūri savo darbus.", ["Kuria darbus ir kviečia darbuotojus", "Tvirtina atvykimus savo darbuose", "Statistika tik savo darbų"], ["Kitų darbai", "Skelbimai, komanda, planas"]],
  ["site", "Objekto vadovas", "Dirba objekte su telefonu. Neužima komandos vietos.", ["Mato jam priskirtus darbus", "Tvirtina atvykimus, uždaro dienas", "Rašo darbuotojams, mato „Skubiai!“"], ["Kurti ar atšaukti darbus", "Kainos ir statistika"]]
];
const SEATS = () => E().team.filter((t) => t[1] !== "Objekto vadovas").length;
function eTeam() {
  const T = E(), seats = SEATS(), mgr = RK() === "manager";
  const inviteRoles = mgr ? ["Vadybininkas", "Objekto vadovas"] : ["Vadovas", "Vadybininkas", "Objekto vadovas"];
  if (!inviteRoles.includes(T.teamRole)) T.teamRole = inviteRoles[0];
  return `<div class="head"><div><h1>Komanda</h1><p class="lead">Darbai ir žinutės lieka įmonės paskyroje.</p></div>${pill(`Komandos vietos ${seats}/5`, "navy")}</div>
  <section class="card"><header><div><h2>Nariai</h2></div></header><div class="list">${T.team.map(([n, r, e]) => { const isMe = n === ME() || (n === "Jūs" && RK() === "owner"); const canRemove = RK() === "owner" ? n !== "Jūs" : mgr && ["Vadybininkas", "Objekto vadovas"].includes(r); return `<div class="wk${RK() === "owner" && n !== "Jūs" ? " clickable" : ""}"${RK() === "owner" && n !== "Jūs" ? ` data-act="memberEdit" data-v="${esc(n)}" role="button" tabindex="0"` : ""}><div class="av lt">${n === "Jūs" ? "UP" : ini(n)}</div><div class="wn"><b>${esc(n === "Jūs" ? "Jūs (savininkas)" : n)}${isMe && n !== "Jūs" ? " · jūs" : ""}</b><small>${esc(e)}</small></div><div class="wa">${pill(r, r === "Savininkas" ? "navy" : r === "Objekto vadovas" ? "green" : "")}${(E().team.find((t) => t[0] === n) || [])[3] && Object.keys(E().team.find((t) => t[0] === n)[3]).length ? `<span class="tag">Pritaikytos teisės</span>` : ""}${RK() === "owner" && n !== "Jūs" ? `<span class="btn sm">${svg("user", 14)}Teisės</span>` : ""}${canRemove && RK() !== "owner" ? `<button class="btn sm ghost danger" type="button" data-act="removeMember" data-v="${esc(n)}">Pašalinti</button>` : ""}</div></div>`; }).join("")}</div></section>
  <section class="card"><header><div><h2>Rolės ir teisės</h2></div><span class="small muted">Prototipe galite peržiūrėti svetainę kiekvienos rolės akimis</span></header>
  <div class="rolegrid">${ROLE_INFO.map(([k, t, d, yes, no]) => `<div class="rolecard${RK() === k ? " cur" : ""}"><div class="rc-h"><b>${t}</b>${RK() === k ? pill("Jūsų rolė", "navy") : ""}</div><p>${d}</p><ul>${yes.map((x) => `<li class="y">${svg("check", 14, 2.6)}${x}</li>`).join("")}${no.map((x) => `<li class="n">${svg("x", 13, 2.6)}${x}</li>`).join("")}</ul>${RK() === k ? "" : `<button type="button" class="btn sm" data-act="viewAs" data-v="${k}">${svg("eye", 14)}Peržiūrėti kaip ${t.toLowerCase()}</button>`}</div>`).join("")}</div></section>
  <section class="card"><h2>Pakviesti naują narį</h2>
  <form class="form" data-form="teamInvite"><label class="field" for="t-name">Vardas<input id="t-name" class="nmcap" placeholder="Vardas Pavardė"></label><label class="field" for="t-mail">El. paštas<input id="t-mail" type="email" placeholder="vardas@imone.lt"></label>
  <div class="field wide"><span>Rolė</span><div class="segs rolesel" role="radiogroup" aria-label="Rolė">${inviteRoles.map((r) => `<label><input type="radio" name="trole" data-act="teamRole" data-v="${r}"${T.teamRole === r ? " checked" : ""}><span>${r}</span></label>`).join("")}</div></div>
  <div class="wide row" style="justify-content:flex-end"><button class="btn primary" type="submit">Sukurti kvietimą</button></div></form></section>
  <section class="card"><h2>Išsiųsti kvietimai</h2><div class="list">${T.pendingInvites.length ? T.pendingInvites.map(([n, r, e]) => `<div class="wk"><div class="av lt">${ini(n)}</div><div class="wn"><b>${esc(n)}</b><small>${esc(e)} · ${r}</small></div><div class="wa"><button class="btn sm" type="button" data-act="copy" data-v="https://statybos24.lt/komanda/pavyzdys">Kopijuoti nuorodą</button></div></div>`).join("") : empty("Išsiųstų kvietimų nėra", "Sukurtas kvietimas atsiras čia.", "mail")}</div></section>
  <section class="card"><header><div><h2>Veiksmų istorija ${hasPlan("pro") ? "" : proTag}</h2><p class="small muted" style="margin:2px 0 0">Kas sukūrė, atšaukė, perdavė darbą ar pakeitė teises</p></div></header>${lockWrap("pro", `<div class="loglist">${E().log.slice(0, 8).map(([who, what, obj, when]) => `<div class="logrow"><span class="av lt sm">${who === "Jūs" ? "UP" : ini(who)}</span><div><b>${esc(who)}</b> ${esc(what)} <span class="logobj">${esc(obj)}</span></div><small>${esc(when)}</small></div>`).join("")}</div>`)}</section>`;
}

const PLAN = () => S.plan || "pro";
const GR = (n) => Math.round(n / 0.605);
const NT = (g) => Math.round(g * 0.605);
const MG = () => S.stMoney === "gross";
const MLBL = () => MG() ? "Sumokėta ant popieriaus" : "Sumokėta į rankas";
const pairCells = (v, k) => { const net = k === "g" ? NT(v) : v, gr = k === "g" ? v : GR(v); const exact = MG() ? k === "g" : k === "n"; return `<em class="${exact ? "" : "g"}">${exact ? "" : "≈ "}${eur(MG() ? gr : net)}</em>`; };
const pairCells2 = (v, k) => { const net = k === "g" ? NT(v) : v, gr = k === "g" ? v : GR(v); const en = k === "n", eg = k === "g"; return `<em class="${en ? "" : "g"}">${en ? "" : "≈ "}${eur(net)}</em><em class="${eg ? "" : "g"}">${eg ? "" : "≈ "}${eur(gr)}</em>`; };
const eur = (n) => `${n.toLocaleString("lt-LT")} €`;
const M2HD = (first, cols) => `<div class="str sthd m1"><b>${first}</b>${cols.map((c) => `<span>${c}</span>`).join("")}<em>${MLBL()}</em></div>`;
const money2 = (n) => `<span class="m2"><b>${eur(n)}</b><small>${eur(GR(n))}</small></span>`;
const PLV = { basic: 0, business: 1, pro: 2 };
const PLN = { basic: "Basic", business: "Business", pro: "Business Pro" };
const hasPlan = (p) => PLV[PLAN()] >= PLV[p];
function lockWrap(need, inner) {
  if (hasPlan(need)) return inner;
  return `<div class="stlock"><div class="stlock-in" aria-hidden="true">${inner}</div><div class="stlock-ov">${svg("lock", 20, 2.2)}<b>Prieinama ${PLN[need]} plane</b><button class="btn sm primary" type="button" data-go="plans">Atrakinti su ${PLN[need]}</button></div></div>`;
}
function eStats() {
  const own = RK() === "recruiter";
  const per = S.stPer || "m1";
  const pers = [["m1", "Šis mėnuo", "basic"], ["m3", "3 mėn.", "business"], ["m6", "6 mėn.", "business"], ["m12", "12 mėn.", "pro"], ["cust", "Pasirinkti datas", "pro"]];
  const custM = Math.max(0.1, ((new Date(S.stTo || iso(TODAY)) - new Date(S.stFrom || iso(dOff(-60)))) / 864e5 + 1) / 30); const mult = { m1: 1, m3: 3, m6: 6, m12: 12, cust: Math.round(custM * 10) / 10 }[per] || 1;
  const f = own ? 0.4 : 1;
  const done = Math.round(12 * mult * f), fill = 83, hrs = Math.round(612 * mult * f);
  const nmo = hasPlan("pro") && per === "m12" ? 12 : 6; const months = Array.from({ length: nmo }, (_, i) => { const d = new Date(TODAY); d.setMonth(d.getMonth() - (nmo - 1 - i)); return MON_S[d.getMonth()]; });
  const vals = months.map((_, i) => Math.round(([6, 9, 8, 13, 15, 12, 7, 10, 11, 9, 14, 12][i % 12]) * f) || 1), mx = Math.max(...vals) + 2;
  const exp = hasPlan("pro") ? `<button class="btn sm" type="button" data-act="toast" data-msg="Tikroje svetainėje bus atsisiųstas PDF">${svg("download", 14, 2.2)}PDF</button><button class="btn sm" type="button" data-act="toast" data-msg="Tikroje svetainėje bus atsisiųstas Excel failas">${svg("download", 14, 2.2)}Excel</button>` : hasPlan("business") ? `<button class="btn sm" type="button" data-act="toast" data-msg="Tikroje svetainėje bus atsisiųstas PDF">${svg("download", 14, 2.2)}PDF</button><button class="btn sm lockd" type="button" data-go="plans" title="Excel – Business Pro plane">${svg("lock", 13, 2.2)}Excel</button>` : `<button class="btn sm lockd" type="button" data-go="plans" title="Eksportas – Business plane">${svg("lock", 13, 2.2)}Eksportuoti</button>`;
  const kpi = (k, lab, val, sub, need) => { const ok = hasPlan(need); return `<button type="button" class="ovcard stk${S.stOpen === k ? " sel" : ""}${ok ? "" : " lk"}" ${ok ? `data-act="stOpen" data-v="${k}"` : 'data-go="plans"'}><span class="ovtop"><small>${lab}</small>${ok ? "" : svg("lock", 14, 2.2)}</span><b class="ovval">${ok ? val : "•••"}</b><span class="ovsub">${ok ? sub : `${PLN[need]} plane`}</span></button>`; };
  const bar = (lab, v, cls) => `<div class="ovdr"><span>${lab}</span><div class="ovdbar ${cls || ""}"><i style="width:${v}%"></i></div><b>${v} %</b></div>`;
  const workers = [["w1", 14, 9.8, 1680, "n"], ["w4", 11, 9.5, 1320, "m"], ["w2", 9, 9.6, 1050, "n"], ["w7", 8, 9.2, 1590, "g"], ["w3", 6, 8.8, 690, "n"], ["w5", 5, 9.1, 610, "n"], ["w6", 4, 9.0, 470, "n"]].map(([id, n, r, e, k]) => [id, Math.max(1, Math.round(n * mult * f)), r, Math.round(e * mult * f), k]);
  const topN = workers.slice(0, 5);
  const team = [["Jūs", 8, 7, 6, 0, 3120, "m"], ["Ieva M.", 6, 5, 4, 1, 2860, "n"], ["Paulius R.", 4, 3, 2, 0, 2610, "g"], ["Mindaugas S.", 0, 0, 0, 0, 1080, "n"]].map(([n, a, b2, c, d, e, k]) => [n, ...[a, b2, c, d, e].map((x) => Math.round(x * mult)), k]);
  const sites = [["Ozo g. 25, Vilnius", 5, 168, 2350, "n"], ["Kalvarijų g. 120, Vilnius", 4, 140, 3470, "g"], ["Linkmenų g. 34, Vilnius", 3, 96, 1560, "n"], ["Savanorių pr. 178, Vilnius", 3, 120, 1560, "m"], ["Savanorių pr. 400, Kaunas", 2, 88, 1070, "n"]].map(([a, j, h, e, k]) => [a, ...[j, h, e].map((x) => Math.round(x * mult * f)), k]);
  const SN = sites.reduce((a, [, , , e, k]) => a + (k === "g" ? NT(e) : e), 0), SG = sites.reduce((a, [, , , e, k]) => a + (k === "g" ? e : GR(e)), 0), spend = SN;
  const det = S.stOpen === "ads" ? (() => {
      const A = E().ads, cands = A.reduce((a, x) => a + x.cands.length, 0), news = A.reduce((a, x) => a + x.cands.filter((c) => c[1] === "new").length, 0), intv = A.reduce((a, x) => a + x.cands.filter((c) => c[1] === "interview").length, 0), views = A.reduce((a, x) => a + x.views, 0);
      const st = [["Kandidatavo", cands, 100], ["Peržiūrėta", A.reduce((a, x) => a + x.cands.filter((c) => c[1] !== "new").length, 0), 0], ["Pakviesta pokalbiui", intv, 0], ["Įdarbinta", 0, 0]].map(([t, n]) => [t, n, cands ? Math.round((n / cands) * 100) : 0]);
      return `<div class="ovdet card relrep"><header><div><h2>Ilgalaikio darbo skelbimai</h2><p class="muted small">Nuolatiniams darbuotojams skirti skelbimai – ne vienkartiniai darbo pasiūlymai</p></div><button type="button" class="linkb" data-go="eads">Atidaryti skelbimus</button></header>
      <div class="rr-kpis k6"><div><b>${A.length}</b><span>Aktyvūs skelbimai</span></div><div><b>${views}</b><span>Peržiūros</span></div><div><b>${cands}</b><span>Kandidatai</span></div><div><b>${news}</b><span>Nauji, neperžiūrėti</span></div><div><b>${intv}</b><span>Pakviesta pokalbiui</span></div><div><b>${views ? ((cands / views) * 100).toFixed(1).replace(".", ",") : 0} %</b><span>Kandidatavo iš peržiūrėjusių</span></div></div>
      <div class="rr-grid">
        <section class="rr-box"><h3>Kandidatų kelias</h3><div class="funnel">${st.map(([t, n, p]) => `<div class="fn"><div class="fn-t"><b>${t}</b><span>${n} · ${p} %</span></div><div class="fn-b"><i style="width:${p}%"></i></div></div>`).join("")}</div></section>
        <section class="rr-box"><h3>Kandidatų kokybė</h3><div class="ovkpis mini"><div><b>96</b><span>Vid. kandidatų patikimumas</span></div><div><b>9,4/10</b><span>Vid. įvertinimas</span></div><div><b>2</b><span>Jau dirbo su jumis</span></div><div><b>3</b><span>Turi pažymėjimų</span></div></div></section>
      </div>
      <section class="rr-box"><h3>Skelbimai</h3><div class="sttab"><div class="str sthd ad5"><b>Pareigos</b><span>Įkėlė</span><span>Peržiūros</span><span>Kandidatai</span><span>Nauji</span><em>Liko dienų</em></div>${A.map((a) => `<div class="str ad5"><b>${up(a.title)}</b><span>${esc(a.by || "Jūs")}</span><span>${a.views}</span><span>${a.cands.length}</span><span>${a.cands.filter((c) => c[1] === "new").length}</span><em>${a.until}</em></div>`).join("")}</div></section>
      ${hasPlan("pro") && E().team.length > 1 ? (() => {
        const hist = { "Jūs": [5, 1, 1], "Ieva M.": [3, 0, 1], "Paulius R.": [0, 0, 0], "Mindaugas S.": [0, 0, 0] };
        const rows = E().team.map(([n]) => { const mine = A.filter((a) => (a.by || "Jūs") === n); const h = hist[n] || [0, 0, 0]; return { n, act: mine.length, all: mine.length + h[0], views: mine.reduce((x, a) => x + a.views, 0), cands: mine.reduce((x, a) => x + a.cands.length, 0), intv: mine.reduce((x, a) => x + a.cands.filter((c) => c[1] === "interview").length, 0) + h[1], hired: h[2] }; }).sort((a, b) => b.all - a.all);
        return `<section class="rr-box"><h3>Komandos narių skelbimai</h3><div class="sttab"><div class="str sthd ad5"><b>Žmogus</b><span>Įkėlė iš viso</span><span>Aktyvūs</span><span>Kandidatai</span><span>Pokalbiai</span><em>Įdarbino</em></div>${rows.map((r, i) => `<div class="str ad5"><b>${esc(r.n)}${i === 0 && r.all ? ` ${pill("Daugiausia", "green")}` : ""}</b><span>${r.all}</span><span>${r.act}</span><span>${r.cands}</span><span>${r.intv}</span><em>${r.hired}</em></div>`).join("")}</div></section>`;
      })() : ""}</div>`;
    })()
    : S.stOpen === "fill" ? (() => {
      const created = Math.round(done * 1.5), filled = Math.round(created * 0.83), cancelled = Math.max(0, Math.round(mult * f)), shortN = Math.max(0, created - filled - cancelled);
      const cv = vals.map((v) => Math.round(v * 1.4)), cmx = Math.max(...cv) + 2;
      const funnel = [["Išsiųsta kvietimų", 100, Math.round(created * 2.1 * 2)], ["Priimta", 64, Math.round(created * 2.1 * 2 * 0.64)], ["Atvyko", 60, Math.round(created * 2.1 * 2 * 0.6)], ["Užbaigė darbą", 59, Math.round(created * 2.1 * 2 * 0.59)]];
      return `<div class="ovdet card relrep"><header><div><h2>Darbų statistika</h2><p class="muted small">Kaip kuriami, užpildomi ir įvykdomi jūsų darbai</p></div></header>
      <div class="rr-kpis k6"><div><b>${created}</b><span>Sukurta darbų</span></div><div><b>${filled}</b><span>Užpildyta pilnai</span></div><div><b>${done}</b><span>Įvykdyta</span></div><div><b>${shortN}</b><span>Trūko žmonių</span></div><div><b>${cancelled}</b><span>Atšaukta</span></div><div><b>3:40 val.</b><span>Vid. surinkimo laikas</span></div></div>
      <div class="rr-grid">
        <section class="rr-box"><div class="rr-rh"><h3>Sukurta ir įvykdyta pagal mėnesius</h3><div class="lg2"><span><i class="c1"></i>Sukurta</span><span><i class="c2"></i>Įvykdyta</span></div></div><div class="bars2">${months.map((m, i) => `<div><div class="b2"><i class="c1" style="height:${(cv[i] / cmx) * 100}%" title="Sukurta ${cv[i]}"></i><i class="c2" style="height:${(vals[i] / cmx) * 100}%" title="Įvykdyta ${vals[i]}"></i></div><span>${m}</span></div>`).join("")}</div></section>
        <section class="rr-box"><h3>Nuo kvietimo iki atlikto darbo</h3><div class="funnel">${funnel.map(([t, p, n]) => `<div class="fn"><div class="fn-t"><b>${t}</b><span>${n} · ${p} %</span></div><div class="fn-b"><i style="width:${p}%"></i></div></div>`).join("")}</div></section>
      </div>
      <div class="rr-grid g3">
        <section class="rr-box"><h3>Kvietimai</h3>${bar("Priimta", 64, "")}${bar("Atmesta", 22, "nv")}${bar("Neatsakyta", 14, "nv")}</section>
        <section class="rr-box"><h3>Atvykimas</h3>${bar("Laiku", 94, "")}${bar("Vėlavo", 4, "nv")}${bar("Neatvyko", 2, "nv")}</section>
        <section class="rr-box"><h3>Komandos surinkimas</h3><div class="ovkpis mini"><div><b>2,1</b><span>Kvietimų vienai vietai</span></div><div><b>58 %</b><span>Surinkta per 3 val.</span></div></div></section>
      </div>
      </div>`;
    })()
    : S.stOpen === "spend" ? `<div class="ovdet card"><header><div><h2>Išlaidos darbo jėgai</h2><p class="muted small">Pagal patvirtintą darbo laiką ir nurodytą atlygį</p></div></header><div class="ovkpis"><div><b>${eur(MG() ? SG : SN)}</b><span>Išleista ${MG() ? "ant popieriaus" : "į rankas"}</span></div><div><b>${hrs} val.</b><span>Išdirbta</span></div><div><b>${((MG() ? SG : SN) / hrs).toFixed(2).replace(".", ",")} €</b><span>Vid. valandos kaina ${MG() ? "ant popieriaus" : "į rankas"}</span></div><div><b>${eur(Math.round((MG() ? SG : SN) / Math.max(1, done)))}</b><span>Vid. vieno darbo kaina</span></div></div></div>`
    : S.stOpen === "rel" ? (() => {
      const R = E().reviews, avg = (R.reduce((a, r) => a + r[1], 0) / R.length).toFixed(1).replace(".", ",");
      const dist = [10, 9, 8, 7].map((v) => [v, R.filter((r) => (v === 7 ? r[1] <= 7 : r[1] === v)).length]);
      const hist = [100, 100, 98, 98, 99, 97], hm = TODAY.getMonth();
      const ev = [["−3", "neg", "Atšauktas patvirtintas darbas", "TVARKYMO DARBAI OBJEKTE · priežastis: užsakovas nukėlė darbus", -9], ["+1", "pos", "30 dienų be pažeidimų", "Automatinis atstatymas", -40], ["−3", "neg", "Atšauktas patvirtintas darbas", "MEDŽIAGŲ NEŠIOJIMAS · priežastis: pasikeitė objekto grafikas", -75]];
      const R0 = 40, C0 = 2 * Math.PI * R0;
      return `<div class="ovdet card relrep"><header><div><h2>Įmonės patikimumas</h2><p class="muted small">Tai mato darbuotojai, rinkdamiesi jūsų kvietimus</p></div><button type="button" class="linkb" data-act="reliability">Taisyklės</button></header>
      <div class="rr-top">
        <div class="rr-score"><svg viewBox="0 0 100 100" width="104" height="104" aria-hidden="true"><circle cx="50" cy="50" r="${R0}" fill="none" stroke="var(--line)" stroke-width="9"/><circle cx="50" cy="50" r="${R0}" fill="none" stroke="var(--green)" stroke-width="9" stroke-linecap="round" stroke-dasharray="${C0}" stroke-dashoffset="${C0 * 0.03}" transform="rotate(-90 50 50)"/><text x="50" y="53" text-anchor="middle" font-family="Manrope,Inter,sans-serif" font-weight="800" font-size="26" fill="var(--navy)">97</text><text x="50" y="68" text-anchor="middle" font-family="Inter,sans-serif" font-size="9.5" fill="var(--muted)">iš 100</text></svg><div><b>Labai patikima</b><span>−3 per paskutines 30 d.</span></div></div>
        <div class="rr-kpis"><div><b>46</b><span>Įvykdyti darbai</span></div><div><b>2</b><span>Atšaukti po patvirtinimo</span></div><div><b>0</b><span>Ginčai</span></div><div><b>${avg}</b><span>Darbuotojų įvertinimas</span></div></div>
      </div>
      <div class="rr-grid">
        <section class="rr-box"><h3>Patikimumas per 6 mėn.</h3><div class="relbars">${hist.map((v, i) => { const d = new Date(TODAY); d.setMonth(hm - 5 + i); return `<div><b>${v}</b><i style="height:${(v - 90) * 10}%" class="${i === 5 ? "now" : ""}"></i><span>${MON_S[d.getMonth()]}</span></div>`; }).join("")}</div></section>
        <section class="rr-box"><h3>Kas keitė patikimumą</h3>${ev.map(([p, c, t, sub, d]) => `<div class="ovtlr"><span class="ovtld ${c === "neg" ? "bad" : "ok"}"></span><div><b>${t}</b><span>${iso(dOff(d))} · ${sub}</span></div><em class="${c === "neg" ? "neg" : "zero"}">${p}</em></div>`).join("")}</section>
      </div>
      <section class="rr-box"><div class="rr-rh"><h3>Darbuotojų atsiliepimai</h3><div class="rr-dist">${dist.map(([v, n]) => `<span>${v === 7 ? "≤7" : v}<i style="--w:${(n / R.length) * 100}%"></i>${n}</span>`).join("")}</div></div>
        <div class="rr-revs">${R.slice(0, 4).map(([n, r, t, d, j]) => `<div class="cpr"><span class="av lt sm">${ini(n)}</span><div><div class="cpr-top"><b>${esc(n)}</b><span class="cpr-score">${r}/10</span></div><p>${esc(t)}</p><small>${up(j)} · ${iso(dOff(-d))}</small></div></div>`).join("")}</div></section>
      <p class="rr-tip">${svg("shield", 15)} Neatšaukite darbų, kuriuos darbuotojai jau patvirtino. Jei 30 dienų nėra pažeidimų, pridedamas 1 taškas.</p></div>`;
    })() : "";
  return `<div class="head"><div><h1>Statistika</h1><p class="lead">${own ? "Tik jūsų darbai · " : ""}${PLN[PLAN()]} planas${per === "cust" ? ` · ${S.stFrom || iso(dOff(-60))} – ${S.stTo || iso(TODAY)}` : ""}</p></div><div class="row stexp">${hasPlan("business") ? `<button class="btn sm" type="button" data-act="repOpen">${svg("file", 14)}Mėnesio ataskaita</button>` : `<button class="btn sm lockd" type="button" data-go="plans" title="Business plane">${svg("lock", 13, 2.2)}Mėnesio ataskaita</button>`}${exp}</div></div>
  <div class="stdemo"><span>Prototipas – peržiūrėti planą:</span><div class="segs">${["basic", "business", "pro"].map((p) => `<label><input type="radio" name="stpl" data-act="stPlan" data-v="${p}"${PLAN() === p ? " checked" : ""}><span>${PLN[p]}</span></label>`).join("")}</div></div>
  <div class="stbar"><div class="chips stper" role="group" aria-label="Laikotarpis">${pers.map(([k, t, need]) => hasPlan(need) ? `<button type="button" class="chip" data-act="stPer" data-v="${k}" aria-pressed="${per === k}">${t}</button>` : `<button type="button" class="chip lk" data-go="plans" title="${PLN[need]} plane">${svg("lock", 12, 2.4)}${t}</button>`).join("")}</div><div class="segs stmon" role="radiogroup" aria-label="Sumos"><label><input type="radio" name="stm" data-act="stMoney" data-v="net"${!MG() ? " checked" : ""}><span>Į rankas</span></label><label><input type="radio" name="stm" data-act="stMoney" data-v="gross"${MG() ? " checked" : ""}><span>Ant popieriaus</span></label></div></div>

  ${per === "cust" ? `<div class="stcust"><label class="field" for="st-from">Nuo<input id="st-from" type="date" value="${S.stFrom || iso(dOff(-60))}" max="${iso(TODAY)}"></label><label class="field" for="st-to">Iki<input id="st-to" type="date" value="${S.stTo || iso(TODAY)}" max="${iso(TODAY)}"></label><button class="btn dark" type="button" data-act="stCust">Rodyti</button></div>` : ""}
  <section class="ovsec"><div class="ntiles">
    ${own ? kpi("fill", "Įvykdyti darbai", done, `Sukurta ${Math.round(done * 1.5)}`, "basic") : kpi("ads", "Ilgalaikio darbo skelbimai", E().ads.length, `${E().ads.reduce((a, x) => a + x.cands.length, 0)} kandidatai · 245 peržiūros`, "basic")}
    ${kpi("fill", "Darbų statistika", fill + " %", "Vid. surinkimas 3 val. 40 min.", "business")}
    ${kpi("spend", "Išlaidos darbo jėgai", eur(MG() ? SG : SN), `${MG() ? "ant popieriaus" : "į rankas"} · ${hrs} val.`, "business")}
    ${kpi("rel", "Įmonės patikimumas", "97", "iš 100", "basic")}
  </div>${det}</section>
  ${(() => {
    const o = S.stOpen; if (o === "rel" || o === "ads") return "";
    const fillV = o === "fill";
    const att = { w1: 100, w4: 92, w2: 100, w7: 96, w3: 94, w5: 98, w6: 100 };
    const topFill = `<section class="card stc"><header><div><h2>5 geriausi darbuotojai</h2></div></header>${lockWrap("business", `<div class="sttab"><div class="str sthd tophd tf"><span></span><b>Darbuotojas</b><span>Darbai</span><span>Įvertinimas</span><em>Atvyko laiku</em><span></span></div>${topN.map(([id, n, r], i) => `<div class="str tf"><span class="strk">${i + 1}</span><b>${esc(WORKERS[id].name)}</b><span>${n} darbai</span><span>${String(r).replace(".", ",")}/10</span><em>${att[id] || 100} %</em><button class="btn sm" type="button" data-act="profileW" data-id="${id}">Profilis</button></div>`).join("")}</div>`)}</section>`;
    const topMoney = `<section class="card stc"><header><div><h2>Išlaidos 5 geriausiems darbuotojams</h2></div></header>${lockWrap("business", `<div class="sttab"><div class="str sthd tophd"><span></span><b>Darbuotojas</b><span>Darbai</span><span>Įvertinimas</span><em>${MLBL()}</em><span></span></div>${topN.map(([id, n, r, e, kk], i) => `<div class="str"><span class="strk">${i + 1}</span><b>${esc(WORKERS[id].name)}</b><span>${n} darbai</span><span>${String(r).replace(".", ",")}/10</span>${pairCells(e, kk)}<button class="btn sm" type="button" data-act="profileW" data-id="${id}">Profilis</button></div>`).join("")}</div>`)}</section>`;
    const teamFill = own ? "" : `<section class="card stc"><header><div><h2>Komandos narių darbai</h2></div></header>${lockWrap("pro", `<div class="sttab"><div class="str sthd tm4"><b>Žmogus</b><span>Sukurta</span><span>Užpildyta</span><span>Įvykdyta</span><em>Atšaukta</em></div>${team.map(([n, a, b2, c, d]) => `<div class="str tm4"><b>${esc(n)}</b><span>${a}</span><span>${b2}</span><span>${c}</span><em>${d}</em></div>`).join("")}</div>`)}</section>`;
    const teamMoney = own ? "" : `<section class="card stc"><header><div><h2>Kiek išleido komandos nariai</h2></div></header>${lockWrap("pro", `<div class="sttab"><div class="str sthd m1"><b>Žmogus</b><span>Įvykdyta</span><span>Darbuotojų</span><em>${MG() ? "Išleista ant popieriaus" : "Išleista į rankas"}</em></div>${team.map(([n, a, b2, c, d, e, k]) => `<div class="str m1"><b>${esc(n)}</b><span>${c}</span><span>${c * 2}</span>${pairCells(e, k)}</div>`).join("")}</div>`)}</section>`;
    const sitesM = `<section class="card stc"><header><div><h2>Išlaidos pagal objektą</h2></div></header>${lockWrap("pro", `<div class="sttab">${M2HD("Adresas", ["Darbai", "Valandos"])}${sites.map(([a, j, h, e, k]) => `<div class="str"><b>${esc(a)}</b><span>${j}</span><span>${h} val.</span>${pairCells(e, k)}</div>`).join("")}</div>`)}</section>`;
    const foot = `<p class="stfoot">Sumos be „≈“ – tokios, kokias nurodėte kurdami darbą. Su „≈“ – perskaičiuotos pagal darbuotojo mokesčius (GPM ir „Sodra“), tikslias pateiks buhalterija.</p>`;
    if (fillV) return topFill + teamFill;
    if (o === "spend") return topMoney + teamMoney + sitesM + foot;
    return topFill + teamFill + topMoney + teamMoney + sitesM + foot;
  })()}`;
}
const PLAN_DEF = [
  { k: "basic", n: "Basic", p: 0, eb: "Pradžia", d: "Pradėti darbuotojų paiešką.", f: ["Iki 5 darbo pasiūlymų per mėnesį", "Darbuotojų paieška ir kvietimai", "1 paskyros naudotojas"], x: ["Darbo skelbimai – 9,99 €/mėn."] },
  { k: "business", n: "Business", p: 29, eb: "Reguliariai ieškantiems", d: "Daugiau atrankos ir valdymo galimybių.", f: ["Viskas, kas yra Basic plane", "Iki 25 darbo pasiūlymų per mėnesį", "Darbo šablonai – darbas vienu paspaudimu", "Objektų sąrašas", "Mėnesio darbo ataskaita (PDF)", "Darbuotojų patikimumas ir įvertinimai", "Mėgstami darbuotojai", "Privatūs ir bendri darbo pokalbiai", "Išplėstinė statistika"], x: ["Darbo skelbimai – 9,99 €/mėn."] },
  { k: "pro", n: "Business Pro", p: 59, eb: "Geriausias pasirinkimas", d: "Neriboti darbai, komanda ir pilnas valdymas.", f: ["Viskas, kas yra Business plane", "Neribotas darbo pasiūlymų skaičius", "Automatinis kvietimas – atsisakius, kviečiamas kitas", "Neriboti darbo skelbimai – nemokamai", "Jūsų pasiūlymai darbuotojams rodomi pirmiau", "Iki 5 komandos narių ir rolės", "Objekto vadovai – neužima vietų", "Komandos veiksmų istorija", "„Skubiai!“ – laisvų darbuotojų kontaktai", "Darbuotojo kontaktai ir dokumentai profilyje", "Darbų kalendorius ir komandos pokalbis"], x: [] },
];
const DISC = 0.2;
const r2 = (v) => Math.round(v * 100) / 100;
const eurP = (v) => new Intl.NumberFormat("lt-LT", { minimumFractionDigits: Number.isInteger(r2(v)) ? 0 : 2, maximumFractionDigits: 2 }).format(r2(v));
const planYear = (p) => r2(p * 12 * (1 - DISC)), planYearM = (p) => r2(p * (1 - DISC)), planSave = (p) => r2(p * 12 * DISC);
function periodToggle() {
  const yr = S.planPeriod === "year";
  return `<div class="pertgl" role="group" aria-label="Atsiskaitymo laikotarpis"><button type="button" data-act="period" data-v="month" aria-pressed="${!yr}">Kas mėnesį</button><button type="button" data-act="period" data-v="year" aria-pressed="${yr}">Už metus <em>−20 %</em></button></div>`;
}
function planCards(pub) {
  const yr = S.planPeriod === "year", cur = pub ? "" : PLAN(), ord = { basic: 0, business: 1, pro: 2 }, open = window.matchMedia("(min-width:981px)").matches ? "" : (S.planOpen || "pro");
  return `<div class="pcards${open ? " any" : ""}">${PLAN_DEF.map((P) => {
    const best = P.k === "pro", on = P.k === cur, paid = P.p > 0;
    const y = paid && yr;
    const priceRow = `<div class="pc-price">${y ? `<s>${eurP(P.p * (best ? 14 : 12))} €</s>` : ""}<b>${eurP(y ? planYear(P.p) : P.p)} €</b><span>/ ${y ? "metus" : "mėn."}</span></div>`;
    const bonus = best ? 2 : 0, mos = 12 + bonus, save = r2(P.p * mos - planYear(P.p));
    const day = best ? `<div class="pc-day">${svg("check", 14, 2.8)}<span>Visas mėnuo kainuoja <b>mažiau nei vieno darbuotojo darbo diena</b></span></div>` : "";
    const gift = bonus ? `<div class="pc-gift">${svg("star", 14, 2.4)}<span><b>+${bonus} mėn. nemokamai</b> perkant metams – ${mos} mėn. už ${eurP(planYear(P.p))} €</span></div>` : "";
    const sub = !paid ? `<div class="pc-sub">Nemokamai visada</div>` : yr ? `<div class="pc-sub"><span>≈ ${eurP(r2(planYear(P.p) / mos))} €/mėn.</span><span class="pc-save">Sutaupote ${eurP(save)} €</span></div>${gift}` : `<div class="pc-sub"><span>Už metus – ${eurP(planYear(P.p))} €</span><span class="pc-save soft">sutaupytumėte ${eurP(save)} €</span></div>${gift}`;
    const btn = pub ? `<button class="btn${best ? " primary" : ""} pc-btn" type="button" data-act="auth" data-v="signup-emp">${!paid ? "Pradėti nemokamai" : P.k === "business" ? "30 d. nemokamai" : `Rinktis ${P.n}`}</button>`
      : on ? `<button class="btn pc-btn" type="button" data-act="toast" data-msg="Prototipe Stripe langas neatidaromas">${paid ? "Valdyti prenumeratą" : "Dabartinis planas"}</button>`
      : `<button class="btn${ord[P.k] > ord[cur] ? " primary" : ""} pc-btn" type="button" data-act="toast" data-msg="Prototipe planas nekeičiamas">Pereiti į ${P.n}</button>`;
    const value = best ? `<div class="pc-value">${svg("bolt", 16, 2.2)}<span>Basic ir Business planuose už kiekvieną darbo skelbimą mokate <b>9,99 €/mėn.</b> Su Business Pro skelbimai <b>neriboti ir nemokami</b>.</span></div>` : "";
    const top = (best || on) ? `<div class="pc-ribs">${best ? `<span class="pc-rib">${svg("star", 13, 2.4)}Geriausias pasirinkimas</span>` : ""}${on ? `<span class="pc-rib cur">${svg("check", 13, 3)}Jūsų planas</span>` : ""}</div>` : "";
    return `<article class="pc${best ? " best" : ""}${on ? " on" : ""}${open === P.k ? " open" : ""}" data-plan="${P.k}" tabindex="0">
      <div class="pc-main">${top}<span class="pc-eb">${best ? "Komandai" : P.eb}</span><h3>${P.n}</h3><p class="pc-d">${P.d}</p>${priceRow}${sub}${day}${btn}<ul class="pc-mini">${P.f.filter((x) => !/^Viskas/.test(x)).slice(0, 3).map((x) => `<li>${svg("check", 14, 2.6)}<span>${x}</span></li>`).join("")}</ul><span class="pc-more">Visos galimybės ${svg("right", 14, 2.4).replace(I.right, '<path d="m9 18 6-6-6-6"/>')}</span></div>
      <div class="pc-feat"><div class="pc-fin"><b class="pc-fh">Kas įeina</b><ul>${P.f.map((x) => `<li>${svg("check", 15, 2.6)}<span>${x}</span></li>`).join("")}${P.x.map((x) => `<li class="ex">${svg("plus", 15, 2.4)}<span>${x}</span></li>`).join("")}</ul>${value}</div></div>
    </article>`; }).join("")}</div>`;
}
function ePlans() {
  return `<div class="head"><div><h1>Planai</h1><p class="lead">Apmokama saugiai per Stripe. Prenumeratą valdo įmonės savininkas.</p></div>${periodToggle()}</div>
  ${planCards(false)}
  <div class="notebox">Naujoms įmonėms Business automatiškai aktyvuojamas 30 dienų nemokamai, be kortelės. Pasibaigus išbandymui, jei nepasirenkate mokamos prenumeratos, planas grįžta į nemokamą Basic.</div>`;
}

function eCompany() {
  return `<div class="head"><div><h1>Įmonės profilis</h1><p class="lead">${can("editCompany") ? "Įmonės informacija ir jūsų duomenys" : "Įmonės informaciją redaguoja savininkas, savo duomenis – jūs"}</p></div>${can("editCompany") ? `<div class="row"><button class="btn primary savebtn" id="prof-save" type="button" data-act="profSave">${svg("check", 16, 2.4)}<span>Išsaugoti</span></button></div>` : pill("Tik peržiūra", "navy")}</div>
  <div class="stats"><div class="stat"><small>Jūs prisijungę kaip</small><b style="font-size:20px">${ROLES[PK()].label}</b></div><button type="button" class="stat" data-go="plans"><small>Dabartinis planas</small><b style="font-size:20px">Business Pro</b><span>Peržiūrėti planus</span></button><button type="button" class="stat" data-go="team"><small>Komandos vietos</small><b style="font-size:20px">${SEATS()}/5</b><span>Valdyti komandą</span></button></div>
  <section class="card"><header><div><h2>Mano duomenys</h2><p class="small muted" style="margin:2px 0 0">Jūsų, kaip komandos nario, duomenys. Matomi darbuotojams jūsų darbuose.</p></div>${can("editCompany") ? "" : `<button class="btn sm primary" type="button" data-act="toast" data-msg="Jūsų duomenys išsaugoti">${svg("check", 14, 2.4)}Išsaugoti</button>`}</header><div class="form"><label class="field" for="me-fn">Vardas *<input id="me-fn" class="nmcap" value="${esc((PK() === "owner" ? "Jonas Vadovas" : ROLES[PK()].name).split(" ")[0])}"></label><label class="field" for="me-ln">Pavardė *<input id="me-ln" class="nmcap" value="${esc(PK() === "owner" ? "Vadovas" : ({ manager: "Matulienė", recruiter: "Rimkus", site: "Stankus" }[PK()] || ""))}"></label>${phoneField("me", "Telefonas")}${mailField((E().team.find((t) => t[0] === (PK() === "owner" ? "Jūs" : ME())) || [])[2] || "")}</div></section>
  <section class="card"><h2>Informacija</h2><div class="row" style="gap:16px"><div class="av co lg" style="border:1px solid var(--line)">UP</div><div style="display:flex;flex-direction:column;gap:6px"><b>Įmonės logotipas</b><span class="muted small">JPG, PNG arba WEBP, iki 5 MB. Keisti ir ištrinti gali įmonės savininkas.</span>${can("editCompany") ? `<div class="row"><button class="btn sm" type="button" data-act="toast" data-msg="Prototipe logotipas neįkeliamas">Įkelti logotipą</button></div>` : ""}</div></div>
  <fieldset class="form cofs"${can("editCompany") ? "" : " disabled"}><label class="field" for="c-name">Darbdavio pavadinimas / vardas *<input id="c-name" value="UAB Pavyzdinė statyba"></label><label class="field" for="c-city">Miestas *<input id="c-city" value="Vilnius"></label></fieldset><fieldset class="form cofs" style="margin-top:-6px">${phoneField("company", "Kontaktinis telefono numeris", can("editCompany"))}</fieldset><fieldset class="form cofs"${can("editCompany") ? "" : " disabled"}><label class="field" for="c-code">Įmonės kodas<input id="c-code" value="300000000"></label><label class="field wide" for="c-about">Trumpai apie įmonę<textarea id="c-about">Gyvenamųjų ir komercinių pastatų statyba Vilniuje ir Kaune.</textarea></label></fieldset></section>
  <section class="card"><header><div><h2>Objektai ${hasPlan("business") ? "" : bizTag}</h2><p class="small muted" style="margin:2px 0 0">Kuriant darbą adresas ir atvykimo informacija užsipildys automatiškai.</p></div>${hasPlan("business") && can("editCompany") ? `<button class="btn sm" type="button" data-act="objAdd">${svg("plus", 14, 2.4)}Pridėti objektą</button>` : ""}</header>${lockWrap("business", `<div class="list">${E().objects.map((o, i) => `<div class="objrow"><span class="objic">${svg("pin", 17)}</span><div class="objtx"><b>${esc(o.n)}</b><small>${esc(o.addr)} · ${esc(o.arrival)}${o.note ? ` · ${esc(o.note)}` : ""}</small></div>${can("editCompany") ? `<button class="btn sm ghost" type="button" data-act="objDel" data-v="${i}" aria-label="Pašalinti ${esc(o.n)}">${svg("x", 15, 2.2)}</button>` : ""}</div>`).join("")}</div>`)}</section>
  <section class="card"><h2>Atsiliepimai</h2><div class="list">${E().reviews.map(([n, r, t]) => `<div class="step ok"><span class="dot"></span><div><b>${esc(n)} · ${r}/10</b><p>${esc(t)}</p></div></div>`).join("")}</div></section>
  <section class="card setsec danger"><h2>Paskyra</h2><div class="setlist2">
      <button type="button" class="setrow link neutral" data-act="pwOpen"><span class="setic">${svg("lock", 18)}</span><div class="settx"><b>Keisti slaptažodį</b><span>Paskutinį kartą keistas prieš 4 mėn.</span></div><span class="setgo">${svg("right", 16).replace(I.right, '<path d="m9 18 6-6-6-6"/>')}</span></button>
      <button type="button" class="setrow link neutral" data-act="reportBug"><span class="setic">${svg("chat", 18)}</span><div class="settx"><b>Pranešti apie klaidą</b><span>Žinutė pasieks administratorių</span></div><span class="setgo">${svg("right", 16).replace(I.right, '<path d="m9 18 6-6-6-6"/>')}</span></button>
      ${can("deleteCompany") ? "" : "<!--"}<div class="setrow"><span class="setic">${svg("x", 18, 2.2)}</span><div class="settx"><b>Ištrinti paskyrą</b><span>Bus pašalinta įmonės paskyra, darbai ir failai. Atkurti negalima.</span></div><button class="btn sm danger" type="button" data-act="toast" data-msg="Prototipe paskyra netrinama">Ištrinti</button></div>${can("deleteCompany") ? "" : "-->"}</div></section>
  <div class="savebar" id="savebar" hidden><div class="sbtx"><span class="sbdot"></span><b><span class="sbl">Neišsaugoti pakeitimai</span><span class="sbs">Neišsaugota</span></b></div><div class="row"><button class="btn sm ghostw" type="button" data-act="profUndo">Atšaukti</button><button class="btn sm primary" type="button" data-act="profSave">${svg("check", 15, 2.4)} Išsaugoti</button></div></div>`;
}

/* ---------- Viešas puslapis ---------- */
function publicPage() {
  const ck = svg("check", 16, 2.6);
  const li = (t) => `<li>${ck}<span>${t}</span></li>`;
  const tile = (cls, ic, t, p, vis) => `<article class="lp-tile ${cls}" data-rv><div class="lp-tic">${svg(ic, 20)}</div><h3>${t}</h3><p>${p}</p>${vis || ""}</article>`;
  const flowE = [["Sukurkite darbą", "Vieta, data, laikas, atlygis ir kiek žmonių reikia. Su šablonais – vienu paspaudimu."], ["Pakvieskite tinkamus", "Matote, kas tą dieną laisvas, jų patikimumą ir įvertinimus. Kviesti galite kiek norite – vietas užims pirmieji priėmę."], ["Valdykite darbo dieną", "Darbuotojai pažymi „Atvykau“, jūs patvirtinate, uždarote dieną ir įvertinate."]];
  const flowW = [["Pažymėkite, kada galite", "Užpildote grafiką arba įjungiate „Laisvas dabar“. Nereikia CV."], ["Gaukite kvietimą", "Iš karto matote darbą, vietą, laiką ir atlygį – sprendžiate patys."], ["Dirbkite ir kaupkite reputaciją", "Kiekviena užbaigta diena ir įvertinimas kelia jūsų patikimumą."]];
  const fl = S.lpFlow === "w" ? flowW : flowE;
  return `<header class="pub-top lp-top"><div class="pub-in"><a href="#" aria-label="statybos24.lt"><img src="${LOGO_SRC}" alt="statybos24.lt"></a><nav class="pub-nav" aria-label="Pagrindinė navigacija"><a href="#video" data-scroll="video">Susipažinkime</a><a href="#kam" data-scroll="kam">Naudos</a><a href="#galimybes" data-scroll="galimybes">Ką rasite</a><a href="#programele" data-scroll="programele">Programėlė</a></nav><div class="row lp-hacts" style="gap:8px"><button class="btn" type="button" data-act="auth" data-v="login">Prisijungti</button><button class="btn primary" type="button" data-act="auth" data-v="signup">Registruotis</button></div><button class="lp-burger" type="button" data-act="lpMenu" aria-label="Meniu" aria-expanded="false"><i></i><i></i><i></i></button></div>
    <div class="lp-mmenu"><nav aria-label="Meniu"><a href="#video" data-scroll="video">Susipažinkime</a><a href="#kam" data-scroll="kam">Naudos</a><a href="#galimybes" data-scroll="galimybes">Ką rasite</a><a href="#programele" data-scroll="programele">Programėlė</a></nav><div class="lp-mbtns"><button class="btn primary" type="button" data-act="auth" data-v="signup">Registruotis</button><button class="btn" type="button" data-act="auth" data-v="login">Prisijungti</button></div></div></header>
  <button class="lp-totop" type="button" data-act="lpTop" aria-label="Į viršų"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg></button>
  <main class="lp">
  <section class="lp-hero"><div class="lp-glow" aria-hidden="true"></div><div class="pub-in lp-hero-in">
    <div class="lp-hero-tx">
      <h1>Žmonės statybų darbams.<br><span>Darbai žmonėms.</span></h1>
      <p>Platforma sujungia statybų įmones ir privačius darbdavius su darbuotojais, kurie gali dirbti tada, kai jų reikia – šiandien, rytoj ar ilgam.</p>
      <div class="lp-cta"><button class="btn primary lp-big" type="button" data-act="auth" data-v="signup-emp">Ieškau darbuotojų</button><button class="btn lp-big lp-ghost" type="button" data-act="auth" data-v="signup-wk">Ieškau darbo</button></div>
      <ul class="lp-proof">${li("Darbuotojams – nemokamai")}${li("Be CV ir tarpininkų")}${li("Darbas matomas prieš sutinkant")}</ul>
    </div>
    <div class="lp-hero-vis" aria-hidden="true"><div class="lp-hv-pc"><div class="lp-hv-bar"><span><i></i><i></i><i></i></span><em>statybos24.lt</em></div><img src="hero-pc.jpg" alt=""></div><div class="lp-hv-ph"><img src="hero-phone.jpg" alt=""></div></div>

  </div></section>

  <section class="lp-vid" id="video"><div class="pub-in lp-col">
    <div class="lp-sh" data-rv><span class="lp-k">Susipažinkite</span><h2>Pažiūrėkite, kaip tai veikia.</h2><p class="lp-sub">Pusantros minutės – ką gauna darbuotojai ir ką įmonės.</p></div>
    <div class="lp-vbox" data-rv><video id="lp-video" src="statybos24-video.mp4" poster="video-poster.jpg" preload="metadata" playsinline></video>
      <button class="lp-play" type="button" data-act="lpPlay" aria-label="Paleisti video"><span class="lp-pp"><i><svg viewBox="0 0 24 24" width="18" height="18"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg></i><b>Paleisti video</b><em>1:32</em></span></button><button class="lp-vfsb" type="button" data-act="lpFs" aria-label="Per visą ekraną"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg></button><button class="lp-vfsx" type="button" data-act="lpFsX" aria-label="Uždaryti"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>
  </div></section>


  <section class="lp-sec" id="kam"><div class="pub-in lp-col">
    <div class="lp-sh" data-rv><span class="lp-k">Naudos</span><h2>Ką gaunate jūs.</h2></div>
    <div class="lp-aud">
      <article class="lp-card dark" data-rv><span class="lp-k">Darbdaviams</span><h3>Įmonėms ir privatiems darbdaviams.</h3><p>Nuo vienos dienos pagalbos iki nuolatinės komandos – raskite žmones pagal miestą, datą ir realų prieinamumą.</p>
        <ul class="lp-list">${li("Žmonės tada, kai jų reikia – net tą pačią dieną")}${li("Matote, kas tikrai laisvas ir kaip dirbo anksčiau")}${li("Visa darbo diena – vienoje vietoje")}</ul></article>
      <article class="lp-card" data-rv><span class="lp-k">Darbuotojams</span><h3>Dirbantiems statybose ir pagalbiniuose darbuose.</h3><p>Pažymėkite, kada galite dirbti, ir gaukite aiškius pasiūlymus. Jokio CV siuntinėjimo ir laukimo.</p>
        <ul class="lp-list">${li("Darbas, vieta ir atlygis žinomi prieš sutinkant")}${li("Dirbate tada, kai jums patogu")}${li("Nemokamai ir be CV")}</ul></article>
    </div></div></section>

  <section class="lp-sec lp-feat-s" id="galimybes"><div class="pub-in lp-col">
    <div class="lp-sh" data-rv><span class="lp-k">Ką rasite</span><h2>Viskas, ko reikia darbui organizuoti.</h2><p class="lp-sub">Vienoje vietoje – nuo kvietimo iki ataskaitos.</p></div>
    <div class="lp-fbox" data-rv>
      <ul class="lp-flist">${[
        ["mail", "Aiškūs kvietimai", "Darbas, vieta, laikas ir atlygis"],
        ["cal", "Prieinamumo grafikas", "Kada galite dirbti ir „Laisvas dabar“"],
        ["check", "Atvykimas vienu paspaudimu", "„Atvykau“, patvirtinimas, dienos uždarymas"],
        ["shield", "Patikimumas ir įvertinimai", "Abipusiai įvertinimai 1–10"],
        ["chat", "Darbo pokalbiai", "Komandos ir privačios žinutės"],
        ["briefcase", "Darbo skelbimai", "Ilgalaikis darbas be CV"],
        ["bolt", "Skubiai!", "Kas gali dirbti dabar"],
        ["team", "Komanda ir rolės", "Kiekvienas su savo teisėmis"],
        ["pie", "Statistika ir ataskaitos", "Išlaidos, PDF ir Excel"]
      ].map(([ic, t, p]) => `<li><span class="lp-fi">${svg(ic, 17)}</span><div><b>${t}</b><small>${p}</small></div></li>`).join("")}</ul>
    </div>
  </div></section>

  <section class="lp-final lp-app" id="programele"><div class="lp-glow" aria-hidden="true"></div><div class="pub-in lp-app-in">
    <div class="lp-app-tx" data-rv><h2>Įdiekite programėlę<br>ir pasiekite lengviau.</h2>
      <button class="btn primary lp-big" type="button" data-act="lpApp">${svg("download", 18, 2.2)}Įdiegti programėlę</button></div>
    <div class="lp-app-vis" data-rv aria-hidden="true"><div class="lp-appic"><span><img src="${MARK_LIGHT}" alt=""></span><b>statybos24</b></div>
      <div class="lp-ntf"><div class="lp-ntf-c"><span class="lp-ntf-ai"><img src="${MARK_LIGHT}" alt=""></span><div><div class="lp-ntf-h"><b>statybos24</b><em>dabar</em></div><b>Naujas darbo kvietimas</b><p>Pagalbiniai mūro darbai · Rytoj 07:30 · Vilnius</p></div></div><i class="st1"></i><i class="st2"></i></div></div>
  </div></section>
  </main>
  <footer class="foot lp-foot"><div class="pub-in">
    <div class="lp-ft-top">
      <div class="lp-ft-brand"><img src="${LOGO_SRC}" alt="statybos24.lt"><p>Platforma, jungianti statybų įmones, privačius darbdavius ir darbuotojus.</p></div>
      <div class="lp-ft-col"><b>Platforma</b><a href="#video" data-scroll="video">Susipažinkime</a><a href="#kam" data-scroll="kam">Naudos</a><a href="#galimybes" data-scroll="galimybes">Ką rasite</a><a href="#programele" data-scroll="programele">Programėlė</a></div>
      <div class="lp-ft-col"><b>Paskyra</b><a href="#" data-act="auth" data-v="signup">Registruotis</a><a href="#" data-act="auth" data-v="login">Prisijungti</a></div>
      <div class="lp-ft-col"><b>Kontaktai</b><a href="mailto:info@statybos24.lt">info@statybos24.lt</a><a href="#" data-act="toast" data-msg="Rekvizitai atsidarys kaip dabar">Rekvizitai</a></div>
    </div>
    <div class="lp-ft-bot"><span>© ${TODAY.getFullYear()} statybos24.lt</span><span class="row" style="gap:16px"><a href="#" data-act="toast" data-msg="Naudojimosi sąlygos atsidarys kaip dabar">Naudojimosi sąlygos</a><a href="#" data-act="toast" data-msg="Privatumo politika atsidarys kaip dabar">Privatumo politika</a></span></div>
  </div></footer>
  <div class="demo pubdemo" style="position:fixed;left:50%;transform:translateX(-50%);bottom:calc(14px + env(safe-area-inset-bottom,0px));z-index:40;box-shadow:0 10px 30px rgba(34,38,49,.18);max-width:calc(100% - 32px)"><span><strong>Prototipas</strong> · peržiūrėkite paskyrą:</span><div class="seg"><button type="button" data-act="enter" data-v="worker">Darbuotojas</button><button type="button" data-act="enter" data-v="employer">Darbdavys</button><button type="button" data-act="enter" data-v="admin">Admin</button><button type="button" data-act="hOpen" data-v="landing">/hire</button></div></div>`;
}
/* Judesys: atsiradimas slenkant ir žodžių paryškinimas */
const LP_RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let lpIO = null;
function lpFull() {
  const v = document.getElementById("lp-video"), box = v && v.closest(".lp-vbox"); if (!v) return;
  if (v.paused) { box.classList.add("on"); v.controls = true; v.play().catch(() => {}); }
  const fake = () => { box.classList.add("fs"); document.body.classList.add("lp-vfs-on"); };
  try {
    if (box.requestFullscreen && document.fullscreenEnabled) { box.requestFullscreen().then(() => { box.classList.add("fs"); try { screen.orientation.lock("landscape").catch(() => {}); } catch (e) {} }).catch(fake); }
    else if (v.webkitEnterFullscreen) { v.webkitEnterFullscreen(); }
    else fake();
  } catch (e) { fake(); }
}
function lpFullExit() {
  const box = document.querySelector(".lp-vbox"); if (!box) return;
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  box.classList.remove("fs"); document.body.classList.remove("lp-vfs-on");
}
document.addEventListener("fullscreenchange", () => { if (!document.fullscreenElement) { const b = document.querySelector(".lp-vbox.fs"); if (b && !document.body.classList.contains("lp-vfs-on")) b.classList.remove("fs"); } });
function lpMotion() {
  if (S.screen !== "public" || LP_MINI) return;
  if (!window._lpTopL) { window._lpTopL = 1; const f = () => {
    const pub = S.screen === "public", de = document.documentElement, left = de.scrollHeight - (window.scrollY + window.innerHeight);
    document.body.classList.toggle("lp-up", pub && window.scrollY > 600 && left < 1100);
    const b = document.querySelector(".lp-totop"), ft = document.querySelector(".foot"); if (!b || !ft) return;
    const base = window.innerWidth < 900 ? 84 : 24, over = window.innerHeight - ft.getBoundingClientRect().top;
    const cp = ft.querySelector(".lp-ft-bot > span") || ft, cr = cp.getBoundingClientRect(); b.style.bottom = Math.max(base, window.innerWidth < 900 ? window.innerHeight - (cr.top + cr.height / 2) - 22 : over + 16) + "px";
  }; window.addEventListener("scroll", f, { passive: true }); f(); }
  const words = document.querySelector("[data-words]");
  if (words && !words.dataset.split) { words.dataset.split = 1; words.innerHTML = words.textContent.split(" ").map((w) => `<span>${w}</span>`).join(" "); }
  if (LP_RM || !("IntersectionObserver" in window)) { document.querySelectorAll("[data-rv]").forEach((e) => e.classList.add("in")); return; }
  document.body.classList.add("lp-js");
  if (lpIO) lpIO.disconnect();
  lpIO = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); lpIO.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll("[data-rv]:not(.in)").forEach((e) => lpIO.observe(e));
  lpWords();
  lpPhone();
}
let lpRun = 0;
function lpPhone() {
  const host = document.getElementById("lp-fr"); if (!host || host.dataset.on || LP_MINI) return;
  host.dataset.on = 1;
  const fr = document.createElement("iframe"); fr.name = "lpmini"; fr.title = "Svetainės demonstracija"; fr.tabIndex = -1; fr.setAttribute("aria-hidden", "true");
  fr.srcdoc = LP_SRC; host.appendChild(fr);
  fr.addEventListener("load", () => { try { lpDemo(fr, ++lpRun); } catch (e) {} });
}
async function lpDemo(fr, run) {
  const w = fr.contentWindow, d = w.document, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const st = d.createElement("style"); st.textContent = ".demo,.pubdemo,.chatfab,.toast{display:none!important}html{scrollbar-width:none}::-webkit-scrollbar{display:none}*{cursor:default!important}"; d.head.appendChild(st);
  const alive = () => fr.isConnected && run === lpRun && S.screen === "public";
  const tapEl = document.getElementById("lp-tap"), cap = document.getElementById("lp-cap");
  const say = (t) => { if (cap) { cap.classList.remove("show"); void cap.offsetWidth; cap.textContent = t; cap.classList.add("show"); } };
  const ev = (js) => w.eval(js);
  const goTo = (role, view, extra = "") => { ev(`S.screen="app";S.role="${role}";S.view="${view}";S.modal=null;S.chatOpen=false;document.body.classList.remove("open");${extra}render();window.scrollTo(0,0)`); };
  const tap = async (sel) => { const el = d.querySelector(sel); if (!el || !alive()) return; const r0 = el.getBoundingClientRect(); if (r0.top < 70 || r0.bottom > w.innerHeight - 90) { w.scrollTo({ top: w.scrollY + r0.top - w.innerHeight / 2, behavior: "smooth" }); await sleep(700); }
    const r = el.getBoundingClientRect(), k = fr.getBoundingClientRect().width / w.innerWidth;
    tapEl.style.left = (r.left + r.width / 2) * k + "px"; tapEl.style.top = (r.top + r.height / 2) * k + fr.offsetTop + "px"; tapEl.classList.add("on"); await sleep(650); tapEl.classList.add("press"); await sleep(220); el.click(); await sleep(260); tapEl.classList.remove("on", "press"); };
  const glide = async (y) => { w.scrollTo({ top: y, behavior: "smooth" }); await sleep(1200); };
  while (alive()) {
    ev("S=freshState();"); w.scrollTo(0, 0);
    say("Darbuotojas gauna kvietimą"); goTo("worker", "invites"); await sleep(1800); await tap("article.job[data-act=details]"); await sleep(1600); await glide(420); await sleep(900); if (!alive()) break;
    say("Atvykęs pažymi „Atvykau“"); goTo("worker", "overview"); await sleep(1500); await tap('[data-act="arrive"]'); await sleep(1800); if (!alive()) break;
    say("Darbdavys patvirtina atvykimą"); goTo("employer", "overview"); await sleep(1600); await tap('[data-act="confirmArr"]'); await sleep(1800); if (!alive()) break;
    say("Naujas darbas – vienu paspaudimu"); goTo("employer", "new", "S.form=null;"); await sleep(1400); await tap('[data-act="tplUse"]'); await sleep(900); await glide(520); await sleep(1500); if (!alive()) break;
    say("Darbuotojai matomi pagal prieinamumą"); goTo("employer", "urgent"); await sleep(2600);
  }
}
function lpWords() {
  const w = document.querySelector("[data-words]"); if (!w) return;
  const r = w.getBoundingClientRect(), vh = window.innerHeight;
  const p = Math.max(0, Math.min(1, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
  const sp = w.querySelectorAll("span"), n = Math.round(p * sp.length);
  sp.forEach((s, i) => s.classList.toggle("on", LP_RM || i < n));
}
window.addEventListener("scroll", () => { if (S.screen === "public") requestAnimationFrame(lpWords); }, { passive: true });

/* ---------- Modalai ---------- */
function findAnyWorkerJob(id) { const W = S.worker; return W.invites.find((x) => x.id === id) || W.jobs.find((x) => x.id === id); }
function modalHTML() {
  const m = S.modal; if (!m) return "";
  let h = "";
  const head = (eb, t, sub = "") => `<header><div><span class="eyebrow">${eb}</span><h2 id="m-title">${t}</h2>${sub}</div><button type="button" class="x" data-close-modal aria-label="Uždaryti">${svg("x", 18, 2.2)}</button></header>`;
  if (m.type === "details") {
    const j = findAnyWorkerJob(m.id);
    h = head("Darbo informacija", up(j.title), coLine(j.company, `Darbdavio patikimumas ${j.rel}`)) + `<div class="kv"><div><small>Data ir laikas</small><b>${dateLabel(j.d)} · ${j.from}–${j.to}</b></div><div><small>Atlygis</small><b>${pay(j.pay, j.unit)}</b></div><div><small>Atvykti adresu</small><b>${esc(j.addr)}</b></div><div><small>Pietų pertrauka</small><b>${esc(j.lunch)}</b></div><div><small>Atvykimas į darbo vietą</small><b>${esc(j.arrival)}</b></div><div><small>Darbo kontakto telefono numeris</small><b>${j.phone || "Telefono numeris nenurodytas."}</b>${j.phone ? `<button class="btn sm" style="margin-top:6px" type="button" data-act="copy" data-v="${j.phone}">Kopijuoti numerį</button>` : ""}</div><div class="wide"><small>Darbo aprašymas</small><b style="font-weight:500">${esc(j.desc)}</b></div></div>
    <div class="row"><button class="btn" type="button" data-act="companyModal" data-v="${esc(j.company)}">Įmonės profilis</button>${j.status === "pending" && !j.conflict ? `<button class="btn primary" type="button" data-act="accept" data-id="${j.id}">Priimti darbą</button>` : ""}</div>`;
  } else if (m.type === "commit") {
    const j = findAnyWorkerJob(m.id);
    h = head("Darbo patvirtinimas", "Ar tikrai įsipareigojate atvykti laiku?") + `<div class="kv"><div><small>Darbas</small><b>${up(j.title)}</b></div><div><small>Data ir laikas</small><b>${dateLabel(j.d)} · ${j.from}–${j.to}</b></div><div class="wide"><small>Adresas</small><b>${esc(j.addr)}</b></div></div>
    <div class="notebox"><b style="color:var(--navy)">Priimdami darbą prisiimate realų įsipareigojimą.</b><br>Neatvykus į patvirtintą darbą, 3 dienas negalėsite priimti naujų darbų, o patikimumo reitingas sumažės. Jei negalite atvykti, svarbiausia nepradingti – informuokite darbdavį žinute.</div>
    <label class="check"><input type="checkbox" id="commit-ok"> Perskaičiau darbo aprašymą ir visus nurodytus reikalavimus, jie man tinka, todėl patvirtinu, kad planuoju atvykti.</label>
    <div class="row" style="justify-content:flex-end"><button class="btn" type="button" data-close-modal>Atšaukti</button><button class="btn primary" type="button" data-act="commitOk" data-id="${j.id}">Taip, įsipareigoju atvykti</button></div>`;
  } else if (m.type === "arriveHelp") {
    const jb = S.worker.jobs.find((x) => x.id === m.id) || S.worker.jobs[0];
    h = `<header><div><h2 id="m-title">Atvykote, bet nerandate darbdavio?</h2><span class="muted small">${up(jb.title)} · ${esc(jb.addr)}</span></div><button type="button" class="x" data-close-modal aria-label="Uždaryti">${svg("x", 18, 2.2)}</button></header>
    <div class="ahelp"><a class="ahopt" href="tel:${(jb.phone || "").replace(/\s/g, "")}"><span class="ahic">${svg("phone", 22)}</span><span><b>Skambinti darbdaviui</b><small>${jb.phone || "Numeris nenurodytas"}</small></span></a>
    <button type="button" class="ahopt" data-act="jobChatW" data-id="${m.id}"><span class="ahic">${svg("chat", 22)}</span><span><b>Rašyti darbdaviui</b><small>Atidaryti darbo pokalbį</small></span></button></div>`;
  } else if (m.type === "chatDel") {
    const c = CONVS().find((x) => x.id === m.id);
    h = head("Pokalbiai", "Ištrinti pokalbį?", `<p class="muted" style="margin:6px 0 0"><b>${esc(c ? c.name : "")}</b> pokalbis bus ištrintas tik jums – kiti jį matys toliau. Jei kas nors parašys naują žinutę, pokalbis vėl atsiras, bet matysite tik naujas žinutes.</p>`) + `<div class="row" style="justify-content:flex-end;gap:8px"><button class="btn" type="button" data-close-modal>Atšaukti</button><button class="btn danger" type="button" data-act="chatDelOk" data-id="${m.id}">Ištrinti</button></div>`;
  } else if (m.type === "lpApp") {
    const st = (n, t) => `<li><span>${n}</span><p>${t}</p></li>`;
    h = head("Programėlė", "Kaip įdiegti statybos24?", `<p class="muted" style="margin:6px 0 0">Užtrunka kelias sekundes. Programėlė atsiras jūsų telefono pradžios ekrane.</p>`) + `<div class="lp-inst"><div><b>iPhone</b><ol>${st(1, "Atidarykite statybos24.lt naršyklėje Safari.")}${st(2, "Apačioje spauskite „Bendrinti“ – kvadratą su rodykle.")}${st(3, "Pasirinkite „Į pradžios ekraną“ ir spauskite „Pridėti“.")}</ol></div><div><b>Android</b><ol>${st(1, "Atidarykite statybos24.lt naršyklėje Chrome.")}${st(2, "Spauskite „Įdiegti programą“ arba meniu ⋮.")}${st(3, "Patvirtinkite – spauskite „Įdiegti“.")}</ol></div></div><div class="row" style="justify-content:flex-end"><button class="btn primary" type="button" data-close-modal>Supratau</button></div>`;
  } else if (m.type === "reliability") {
    const w = S.role === "worker";
    h = head("Patikimumo reitingas", w ? "Kaip veikia darbuotojo patikimumas?" : "Kaip veikia įmonės patikimumas?") + `<p class="muted">${w ? "Darbdaviai šį rodiklį mato vertindami jūsų profilį prieš kviesdami į darbą." : "Darbuotojai šį rodiklį mato prieš priimdami jūsų darbo kvietimą."}</p><div class="list">${(w ? [["Pradžia", "Naujas darbuotojas pradeda nuo 100 patikimumo taškų."], ["Neatvykimas", "Patvirtintas neatvykimas sumažina patikimumą 7 taškais ir taikomas 3 dienų darbo priėmimo apribojimas."], ["Ankstyvas išėjimas", "Nepagrįstas ankstyvas išėjimas sumažina patikimumą 3 taškais. Suderintas – laikomas tvarkingu rezultatu."], ["Atsikūrimas", "Jei nėra naujų pažeidimų, pridedamas +1 taškas kas 30 dienų."]] : [["Pradžia", "Nauja įmonė pradeda nuo 100 patikimumo taškų."], ["Atšaukimas", "Atšaukus darbą, kurį jau patvirtino darbuotojas, patikimumas sumažėja 7 taškais."], ["Nepagrįstas pažymėjimas", "Jei ginčas išsprendžiamas darbuotojo naudai, patikimumas sumažėja 15 taškų."], ["Atsikūrimas", "Jei 30 dienų nėra naujo pažeidimo, pridedamas 1 taškas kas 30 dienų."]]).map(([t, p]) => `<div class="step info"><span class="dot"></span><div><b>${t}</b><p>${p}</p></div></div>`).join("")}</div><p class="small muted">Patikimumo sumažėjimų istorija: patikimumas dar nebuvo sumažintas.</p><div class="row" style="justify-content:flex-end"><button class="btn primary" type="button" data-close-modal>Supratau</button></div>`;
  } else if (m.type === "company") {
    const revs = [["Tomas K.", 10, "Aiškiai paaiškino užduotis, atsiskaitė laiku.", 6], ["Rytis K.", 9, "Tvarkingas objektas, viskas buvo paruošta atvykus.", 13], ["Mantas P.", 9, "Gera komanda, pietų pertrauka kaip sutarta.", 20]];
    const relv = 98;
    h = `<header><div class="cphead">${S.role === "worker" ? favBtn(m.v) : ""}<span class="av co lg cplogo">${ini(m.v.replace(/^(UAB|MB)\s+/, ""))}</span><div><h2 id="m-title">${esc(m.v)}</h2><span class="muted small">${svg("pin", 14)} Vilnius</span></div></div><button type="button" class="x" data-close-modal aria-label="Uždaryti">${svg("x", 18, 2.2)}</button></header>
    <div class="cprel"><div class="cprel-top"><span>Patikimumas</span><b>${relv} <small>iš 100</small></b></div><div class="jd-bar"><i style="width:${relv}%"></i></div><span class="muted small">Įmonė pradeda nuo 100 taškų. Taškai mažėja, jei atšaukia jau patvirtintus darbus.</span></div>
    ${awardPanel(m.v, "company")}<div class="cpstats"><div><b>46</b><span>Įvykdyti darbai</span></div><div><b>1</b><span>Atšaukti darbai</span></div><div><b>9,3</b><span>Vid. įvertinimas</span></div></div>
    <div class="cprev"><h3>Paskutiniai 3 atsiliepimai</h3>${revs.map(([n, r, t, d]) => `<div class="cpr"><span class="av lt sm">${ini(n)}</span><div><div class="cpr-top"><b>${esc(n)}</b><span class="cpr-score">${r}/10</span></div><p>${esc(t)}</p><small>${iso(dOff(-d))}</small></div></div>`).join("")}</div>`;
  } else if (m.type === "workerProfile") {
    const w = WORKERS[m.id];
    h = `<header><div class="wph">${S.role === "employer" ? `<button type="button" class="favbtn${E().favorites.some((f) => f[0] === w.id) ? " on" : ""}" data-act="${E().favorites.some((f) => f[0] === w.id) ? "unfav" : "fav"}" data-id="${w.id}" title="Mėgstamas darbuotojas" aria-pressed="${E().favorites.some((f) => f[0] === w.id)}">${heartSVG(17, E().favorites.some((f) => f[0] === w.id))}</button>` : ""}<h2 id="m-title">${esc(w.name)}</h2><span class="muted small">${esc(w.city)} · ${esc(w.active)}</span></div><button type="button" class="x" data-close-modal aria-label="Uždaryti">${svg("x", 18, 2.2)}</button></header>` + (S.role === "employer" ? (hasPlan("pro") ? `<div class="wpc"><div class="wpc-ph"><small>Telefonas</small><b>${w.phone}</b></div><div class="wpc-a"><a class="btn sm dark" href="tel:${w.phone.replace(/\s/g, "")}">${svg("phone", 15)}Skambinti</a><button class="btn sm" type="button" data-act="wDirect" data-id="${w.id}">${svg("chat", 15)}Rašyti žinutę</button><button class="btn sm" type="button" data-act="copy" data-v="${w.phone}">Kopijuoti</button></div></div>` : `<button type="button" class="wpc lk" data-go="plans">${svg("lock", 16, 2.2)}<span><b>Kontaktai ir tiesioginės žinutės</b><small>Prieinama Business Pro plane</small></span><span class="btn sm primary">Atrakinti</span></button>`) : "") + `<div class="stats"><div class="stat"><small>Atvykimo patikimumas</small><b>${w.att}</b></div><div class="stat"><small>Darbdavių įvertinimas</small><b>${w.rating ? String(w.rating).replace(".", ",") : "–"}</b><span>${w.rc ? `Iš ${w.rc} įvertinimų` : "Dar nėra vertinimų"}</span></div><div class="stat"><small>Užbaigti darbai</small><b>${w.jobs}</b></div></div>${w.b ? `<div class="tags"><span class="tag">B kategorijos vairuotojo pažymėjimas</span></div>` : ""}<div class="kv"><div class="wide"><small>Patirtis</small><b style="font-weight:500">${esc(w.exp)}</b></div></div>${(WDOCS[w.id] || []).length ? `<div class="mdocs"><h3>Pažymėjimai ir dokumentai</h3><div class="mdlist">${WDOCS[w.id].map((t) => `<button type="button" class="mdrow" data-act="docView" data-w="${w.id}" data-v="${esc(t)}"><span class="setic">${svg("file", 17)}</span><span class="htx"><b>${esc(t)}</b><small>Galioja iki ${iso(dOff(DOC_UNTIL[t] || 365))}</small></span>${pill("Galioja", "green")}<span class="mdgo">${svg("eye", 16)}</span></button>`).join("")}</div></div>` : ""}${awardPanel(w.id, "worker")}`;
  } else if (m.type === "closeDay") {
    const w = WORKERS[m.id];
    h = head("Darbo dienos uždarymas", `Kaip baigėsi ${esc(w.name)} darbo diena?`) + `<div class="toggle2" role="group" aria-label="Rezultatas"><button type="button" data-act="cdRes" data-v="full" aria-pressed="${m.res === "full"}">Išdirbo visą dieną</button><button type="button" data-act="cdRes" data-v="early" aria-pressed="${m.res === "early"}">Išėjo anksčiau</button><button type="button" data-act="cdRes" data-v="no" aria-pressed="${m.res === "no"}">Neatvyko</button></div>
    ${m.res === "early" ? `<div class="form"><label class="field" for="cd-type">Ankstyvo išėjimo tipas *<select id="cd-type"><option>Išėjo anksčiau – suderinta</option><option>Išėjo anksčiau be pateisinamos priežasties</option></select></label><label class="field" for="cd-time">Faktinis išėjimo laikas *<select id="cd-time">${timeOpts("13:00")}</select></label></div>` : ""}
    ${m.res === "no" ? `<label class="field" for="cd-why">Paaiškinimas *<textarea id="cd-why" placeholder="Trumpai parašykite, kodėl pažymite neatvykimą."></textarea></label><div class="notebox">Pažymėjus „Neatvyko“, darbuotojo reitingas iškart nemažinamas – darbuotojas pirmiausia gali patvirtinti arba ginčyti rezultatą.</div>` : `<div class="field"><span>Darbuotojo įvertinimas *</span><div class="rating" role="group" aria-label="Įvertinimas nuo 1 iki 10">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => `<button type="button" data-act="cdRate" data-v="${n}" aria-pressed="${m.rate === n}">${n}</button>`).join("")}</div></div><label class="field" for="cd-com">Komentaras apie darbuotoją<textarea id="cd-com" placeholder="Pvz. gerai atliko užduotis, buvo punktualus..."></textarea></label>`}
    <p class="small" id="cd-err" style="color:var(--red);font-weight:600" role="alert"></p><div class="row" style="justify-content:flex-end"><button class="btn" type="button" data-close-modal>Atšaukti</button><button class="btn primary" type="button" data-act="cdSave">${m.res === "no" ? "Patvirtinti rezultatą" : "Išsaugoti įvertinimą ir uždaryti dieną"}</button></div>`;
  } else if (m.type === "closeAll") {
    const jj = E().jobs.find((x) => x.id === m.id);
    const tc = jj.workers.filter((w) => w[1] === "toClose").map((w) => w[0]);
    h = head("Darbo dienų uždarymas", "Visi išdirbo visą dieną?", `<span class="muted small">${up(jj.title)} · ${dateLabel(jj.d)} · ${jj.from}–${jj.to}</span>`) + `<div class="field"><span>Pažymėkite darbuotojus, kurie išdirbo visą dieną</span><div class="calist">${tc.map((id) => `<label class="caitem"><input type="checkbox" data-act="caToggle" data-id="${id}"${m.sel.includes(id) ? " checked" : ""}>${wAv(WORKERS[id], "sm")}<b>${esc(WORKERS[id].name)}</b><span class="muted small">${jj.from}–${jj.to}</span></label>`).join("")}</div><span class="hint">Nepažymėtų darbuotojų dieną galėsite uždaryti atskirai – jei kas išėjo anksčiau ar neatvyko.</span></div>
    <div class="field"><span>Bendras įvertinimas visiems pažymėtiems *</span><div class="rating" role="group" aria-label="Įvertinimas nuo 1 iki 10">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => `<button type="button" data-act="caRate" data-v="${n}" aria-pressed="${m.rate === n}">${n}</button>`).join("")}</div><span class="hint">Įvertinimą kiekvienam galėsite pakeisti vėliau darbuotojo eilutėje.</span></div>
    <label class="field" for="ca-com">Komentaras (nebūtina)<textarea id="ca-com" placeholder="Pvz. komanda dirbo tvarkingai ir laiku."></textarea></label>
    <p class="small" id="ca-err" style="color:var(--red);font-weight:600" role="alert"></p><div class="row" style="justify-content:flex-end"><button class="btn" type="button" data-close-modal>Atšaukti</button><button class="btn primary" type="button" data-act="caSave">Uždaryti ${m.sel.length} ${m.sel.length === 1 ? "dieną" : "dienas"}</button></div>`;
  } else if (m.type === "dayEdit") {
    const dd = dOff(m.i);
    h = `<h2 id="m-title" class="dtitle">${WD[dd.getDay()]}, ${["sausio","vasario","kovo","balandžio","gegužės","birželio","liepos","rugpjūčio","rugsėjo","spalio","lapkričio","gruodžio"][dd.getMonth()]} ${dd.getDate()} d.</h2>
    <div class="pair"><label class="field" for="de-from">Nuo<select id="de-from">${timeOpts(m.from)}</select></label><label class="field" for="de-to">Iki<select id="de-to">${timeOpts(m.to)}</select></label></div>
    <p class="small" id="de-err" style="color:var(--red);font-weight:600;margin:-6px 0 0" role="alert"></p>
    <div class="dbtns"><button class="btn" type="button" data-act="deOff">Atšaukti</button><button class="btn dark" type="button" data-act="deDone">Atlikta</button></div>`;
  } else if (m.type === "archChat") {
    const box = S.role === "worker" ? S.worker : S.emp; const c = (box.archive || []).find((x) => x.id === m.id);
    h = `<header><div><h2 id="m-title">${c.kind === "group" ? up(c.name) : esc(c.name)}</h2><span class="muted small">Pokalbis uždarytas · saugomas tik ginčų atvejui</span></div><button type="button" class="x" data-close-modal aria-label="Uždaryti">${svg("x", 18, 2.2)}</button></header>
    <div class="msgs archmsgs">${c.msgs.map((mm, i) => { const prev = c.msgs[i - 1]; const me = mm.w === "me"; return `${!prev || prev.d !== mm.d ? `<div class="dsep">${mm.d}</div>` : ""}${!me && (!prev || prev.w !== mm.w) ? `<div class="who-n">${esc(mm.w === "them" ? c.name : mm.w)}</div>` : ""}<div class="mrow first last${me ? " me" : ""}">${me ? "" : cavHTML({ kind: "private", name: mm.w === "them" ? c.name : mm.w }, true)}${msgBody(mm)}<span class="mtime">${mm.tm}</span></div>`; }).join("")}</div>`;
  } else if (m.type === "pdf") {
    const box = S.role === "worker" ? S.worker : S.emp; const c = (box.archive || []).find((x) => x.id === m.id);
    const who = (w) => w === "me" ? (S.role === "worker" ? "Beata Bune" : "UAB Pavyzdinė statyba") : w === "them" ? c.name : w;
    h = `<header><div><h2 id="m-title">PDF peržiūra</h2><span class="muted small">Taip atrodys atsisiųstas failas</span></div><button type="button" class="x" data-close-modal aria-label="Uždaryti">${svg("x", 18, 2.2)}</button></header>
    <div class="pdfwrap"><div class="pdfpage">
      <div class="pdfhead"><img src="${LOGO_SRC}" alt="statybos24.lt"><div><b>Pokalbio išrašas</b><span>Sugeneruota ${iso(TODAY)}</span></div></div>
      <div class="pdfinfo"><div><small>Darbas</small><b>${up(m.job)}</b></div><div><small>Pokalbio tipas</small><b>${c.kind === "group" ? "Bendras darbo pokalbis" : "Privatus pokalbis"}</b></div><div><small>Dalyviai</small><b>${esc((c.parts || [c.name]).map((p) => p === "Jūs" ? who("me") : p).join(", "))}</b></div><div><small>Žinučių</small><b>${c.msgs.length}</b></div></div>
      <table class="pdftab"><thead><tr><th>Data</th><th>Laikas</th><th>Siuntėjas</th><th>Žinutė</th></tr></thead><tbody>${c.msgs.map((mm) => `<tr><td>${(() => { const k = /Prieš (\d+) d\./.exec(mm.d); return k ? iso(dOff(-k[1])) : mm.d === "Vakar" ? iso(dOff(-1)) : mm.d === "Šiandien" ? iso(TODAY) : esc(mm.d); })()}</td><td>${mm.tm}</td><td><b>${esc(who(mm.w))}</b></td><td>${mm.img ? "[Nuotrauka]" : mm.file ? `[Failas: ${esc(mm.file.name)}]` : esc(mm.t)}</td></tr>`).join("")}</tbody></table>
      <div class="pdffoot">statybos24.lt · Dokumentas sugeneruotas automatiškai ir gali būti naudojamas sprendžiant ginčus · 1 / 1 psl.</div>
    </div></div>
    <div class="row" style="justify-content:flex-end"><button class="btn" type="button" data-close-modal>Uždaryti</button><button class="btn dark" type="button" data-act="toast" data-msg="Tikroje svetainėje PDF failas bus atsisiųstas į jūsų įrenginį">${svg("download", 16, 2.2)}Atsisiųsti PDF</button></div>`;
  } else if (m.type === "adApply") {
    const a = S.ads.find((x) => x.id === m.id); const D = (S.worker.docs || []).filter((d) => d.show);
    h = head("Kandidatavimas", up(a.title), `<span class="muted small">${esc(a.company)}</span>`) + `<div class="apprev"><small class="eyebrow">Įmonė matys</small><div class="apwho"><div class="av">BB</div><div><b>Beata Bune</b><span class="muted small">Vilnius · B kategorija</span></div></div>
      <div class="apstats"><div><b>100</b><span>Patikimumas</span></div><div><b>9,4</b><span>Įvertinimas</span></div><div><b>12</b><span>Darbo dienų</span></div></div>
      ${D.length ? `<div class="tags">${D.map((d) => `<span class="tag doc">${svg("file", 13)}${esc(d.type)}</span>`).join("")}</div>` : ""}</div>
      <label class="field" for="ap-msg">Žinutė įmonei (nebūtina)<textarea id="ap-msg" placeholder="Pvz. Galiu pradėti nuo pirmadienio."></textarea></label>
      <div class="row" style="justify-content:flex-end"><button class="btn" type="button" data-close-modal>Atšaukti</button><button class="btn primary" type="button" data-act="adSend" data-id="${a.id}">Siųsti kandidatūrą</button></div>`;
  } else if (m.type === "docAdd") {
    h = head("Pažymėjimai", "Pridėti dokumentą") + `<div class="form" style="grid-template-columns:1fr"><label class="field" for="dc-type">Dokumento tipas<select id="dc-type">${["Darbas aukštyje", "Saugos ir sveikatos instruktažas", "Krautuvo vairuotojo pažymėjimas", "Elektrosaugos pažymėjimas", "Suvirintojo pažymėjimas", "Pirmoji pagalba", "Kita"].map((t) => `<option>${t}</option>`).join("")}</select></label>
      <label class="field" for="dc-until">Galioja iki<input id="dc-until" type="date" value="${iso(dOff(365))}"></label>
      <label class="upl" for="dc-file"><input id="dc-file" type="file" accept=".pdf,.jpg,.jpeg,.png" hidden>${svg("download", 20, 2).replace(I.download, '<path d="M12 16V4M6 10l6-6 6 6M4 20h16"/>')}<b>Įkelti nuotrauką arba PDF</b><span class="muted small">iki 10 MB</span></label></div>
      <div class="row" style="justify-content:flex-end"><button class="btn" type="button" data-close-modal>Atšaukti</button><button class="btn primary" type="button" data-act="docSave">Išsaugoti</button></div>`;
  } else if (m.type === "phone") {
    h = head("Telefonas", m.step === 1 ? "Keisti telefono numerį" : "Patvirtinkite numerį") + (m.step === 1 ? `<p class="small muted" style="margin:0">Dabartinis: <b style="color:var(--navy)">${esc(PHONES[m.key])}</b>. Į naują numerį atsiųsime SMS su kodu – numeris pasikeis tik jį patvirtinus.</p><label class="field" for="ph-new">Naujas numeris<input id="ph-new" inputmode="tel" placeholder="+37061234567" autocomplete="tel"></label><p class="small" id="ph-err" style="color:var(--red);font-weight:600;margin:0" role="alert"></p><div class="row" style="justify-content:flex-end"><button class="btn" type="button" data-close-modal>Atšaukti</button><button class="btn primary" type="button" data-act="phSend">Siųsti kodą</button></div>`
      : `<p class="small muted" style="margin:0">Išsiuntėme 6 skaitmenų kodą į <b style="color:var(--navy)">${esc(m.num)}</b>.</p><label class="field" for="ph-code">Kodas iš SMS<input id="ph-code" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="000000" class="otp"></label><p class="small muted" style="margin:0">Prototipe tinka bet kokie 6 skaitmenys.</p><p class="small" id="ph-err" style="color:var(--red);font-weight:600;margin:0" role="alert"></p><div class="row" style="justify-content:space-between"><button class="btn ghost sm" type="button" data-act="toast" data-msg="Kodas išsiųstas dar kartą">Siųsti dar kartą</button><div class="row"><button class="btn" type="button" data-act="phBack">Atgal</button><button class="btn primary" type="button" data-act="phVerify">Patvirtinti</button></div></div>`);
  } else if (m.type === "adExt") {
    const a = E().ads.find((x) => x.id === m.id);
    h = head("Skelbimas", "Pratęsti 30 dienų", `<span class="muted small">${up(a.title)} · dabar galioja dar ${a.until} d.</span>`) + `<div class="adfee">${hasPlan("pro") ? `<span>Pratęsimo kaina</span><b>0 €</b><small>Įskaičiuota į Business Pro</small>` : `<span>Pratęsimo kaina</span><b>9,99 €</b><small>Business Pro plane – nemokamai</small>`}</div><p class="small muted" style="margin:0">Po pratęsimo skelbimas galios dar ${a.until + 30} d. Kandidatai ir įsiminimai išlieka.</p><div class="row" style="justify-content:flex-end"><button class="btn" type="button" data-close-modal>Atšaukti</button><button class="btn primary" type="button" data-act="adExtOk" data-id="${a.id}">${hasPlan("pro") ? "Pratęsti" : "Pratęsti už 9,99 €"}</button></div>`;
  } else if (m.type === "tplAll") {
    const T = E().templates;
    h = head("Šablonai", `Visi šablonai · ${T.length}`) + `<label class="field" for="tpl-q"><span class="sr">Ieškoti</span><input id="tpl-q" type="search" placeholder="Ieškoti šablono…" autocomplete="off"></label>
      <div class="tpllist" id="tpl-list">${T.map((t, i) => [t, i]).reverse().map(([t, i]) => `<div class="tplrow" data-q="${esc((t.n + " " + t.title + " " + (t.obj || "")).toLocaleLowerCase("lt-LT"))}">${m.ren === i ? `<div class="tpltx"><input id="tpl-ren" value="${esc(t.n)}" aria-label="Naujas pavadinimas"></div><button class="btn sm primary" type="button" data-act="tplRenOk" data-v="${i}">Išsaugoti</button>` : `<div class="tpltx"><b>${esc(t.n)}</b><small>${t.obj ? esc(t.obj) + " · " : ""}${t.from}–${t.to} · ${t.people} žm. · ${esc(t.payAmount || "—")} € / ${t.unit === "day" ? "d." : "val."}</small></div><button class="btn sm primary" type="button" data-act="tplPick" data-v="${i}">Naudoti</button><button class="btn sm ghost" type="button" data-act="tplRen" data-v="${i}" aria-label="Pervadinti ${esc(t.n)}" title="Pervadinti">${svg("edit", 15, 2.2)}</button>`}<button class="btn sm ghost" type="button" data-act="tplDel" data-v="${i}" aria-label="Ištrinti ${esc(t.n)}">${svg("x", 15, 2.2)}</button></div>`).join("")}<p class="small muted" id="tpl-none" hidden style="margin:6px 2px">Nieko nerasta.</p></div>`;
  } else if (m.type === "objEdit") {
    h = head("Įmonės objektai", "Naujas objektas") + `<div class="form" style="grid-template-columns:1fr 1fr"><label class="field wide" for="o-n">Pavadinimas *<input id="o-n" placeholder="Pvz. Žirmūnų objektas"></label><label class="field" for="o-c">Miestas<input id="o-c" value="Vilnius"></label><label class="field" for="o-a">Adresas *<input id="o-a" placeholder="Gatvė, namo nr."></label><label class="field wide" for="o-arr">Atvykimas<select id="o-arr"><option>Darbuotojas atvyksta pats</option><option>Darbdavys paima darbuotoją</option></select></label><label class="field wide" for="o-note">Pastaba darbuotojams<input id="o-note" placeholder="Pvz. Įvažiavimas iš kiemo pusės"></label></div><p class="small" id="o-err" style="color:var(--red);font-weight:600;margin:0" role="alert"></p><div class="row" style="justify-content:flex-end"><button class="btn" type="button" data-close-modal>Atšaukti</button><button class="btn primary" type="button" data-act="objSave">Išsaugoti</button></div>`;
  } else if (m.type === "monthRep") {
    const hrs = (j) => { if (!j.from) return 8; const t = (x) => +x.slice(0, 2) + +x.slice(3) / 60; let h = t(j.to) - t(j.from); const l = /(\d\d:\d\d)–(\d\d:\d\d)/.exec(j.lunch || ""); if (l) h -= t(l[2]) - t(l[1]); return Math.round(h * 10) / 10; };
    const rows = {}; E().ended.filter((x) => x.workers && x.d > -31).forEach((x) => { const h = hrs(x), pay = +(x.pay || 14), unit = x.unit || "hour"; x.workers.forEach(([id]) => { const r = rows[id] || (rows[id] = { d: 0, h: 0, s: 0 }); r.d++; r.h += h; r.s += unit === "hour" ? pay * h : pay; }); });
    const L = Object.entries(rows).sort((a, b) => b[1].s - a[1].s), tot = L.reduce((a, [, r]) => ({ d: a.d + r.d, h: a.h + r.h, s: a.s + r.s }), { d: 0, h: 0, s: 0 });
    const mo = ["Sausis","Vasaris","Kovas","Balandis","Gegužė","Birželis","Liepa","Rugpjūtis","Rugsėjis","Spalis","Lapkritis","Gruodis"][TODAY.getMonth()];
    h = head("Ataskaita", `${mo} ${TODAY.getFullYear()}`, `<span class="muted small">Pagal uždarytas darbo dienas · sumos į rankas</span>`) + `<div class="reptbl"><div class="rr rh"><span>Darbuotojas</span><span>Dienos</span><span>Valandos</span><span>Suma</span></div>${L.map(([id, r]) => `<div class="rr"><span>${esc(WORKERS[id].name)}</span><span>${r.d}</span><span>${(Math.round(r.h * 10) / 10).toLocaleString("lt-LT")}</span><span>${eur(Math.round(r.s))}</span></div>`).join("")}<div class="rr rt"><span>Iš viso</span><span>${tot.d}</span><span>${(Math.round(tot.h * 10) / 10).toLocaleString("lt-LT")}</span><span>${eur(Math.round(tot.s))}</span></div></div>
      <div class="row" style="justify-content:flex-end"><button class="btn" type="button" data-close-modal>Uždaryti</button>${hasPlan("pro") ? `<button class="btn" type="button" data-act="toast" data-msg="Tikroje svetainėje bus atsisiųstas Excel failas">${svg("download", 15, 2.2)}Excel</button>` : ""}<button class="btn primary" type="button" data-act="toast" data-msg="Tikroje svetainėje bus atsisiųstas PDF">${svg("download", 15, 2.2)}Atsisiųsti PDF</button></div>`;
  } else if (m.type === "teamChat") {
    const c = E().convs.find((x) => x.kind === "team"), mg = ["owner", "manager"].includes(RK());
    const core = E().team.filter((t) => t[1] !== "Objekto vadovas"), site = E().team.filter((t) => t[1] === "Objekto vadovas");
    const rowM = ([n, r], extra) => `<div class="tcrow"><span class="av lt sm">${n === "Jūs" ? "UP" : ini(n)}</span><span class="htx"><b>${esc(n === "Jūs" ? "Jūs (savininkas)" : n)}</b><small>${esc(r)}</small></span>${extra}</div>`;
    h = head("Komandos pokalbis", "Vadovų pokalbis", `<span class="muted small">Pokalbyje visada yra komandos nariai. Objekto vadovus galite pridėti ir pašalinti.</span>`) + `<div class="tcm">
      <h3 class="tch">Komandos nariai · ${core.length}</h3>${core.map((t) => rowM(t, `<span class="muted small">Visada</span>`)).join("")}
      ${site.length ? `<h3 class="tch">Objekto vadovai</h3>${site.map((t) => { const inn = c.parts.includes(t[0]); return rowM(t, mg ? `<button class="btn sm${inn ? "" : " primary"}" type="button" data-act="tcToggle" data-v="${esc(t[0])}">${inn ? "Pašalinti" : `${svg("plus", 14, 2.4)}Pridėti`}</button>` : inn ? pill("Pokalbyje", "green") : `<span class="muted small">Nepridėtas</span>`); }).join("")}` : ""}
      <div class="row" style="justify-content:flex-end"><button class="btn" type="button" data-close-modal>Uždaryti</button></div></div>`;
  } else if (m.type === "pw") {
    const eye = (id) => `<button type="button" class="pweye" data-act="pwEye" data-v="${id}" aria-label="Rodyti slaptažodį">${svg("eye", 17)}</button>`;
    h = head("Paskyra", "Keisti slaptažodį") + `<div class="pwm">
      <label class="field" for="pw-old">Dabartinis slaptažodis<span class="pwin"><input id="pw-old" type="password" autocomplete="current-password">${eye("pw-old")}</span></label>
      <label class="field" for="pw-new">Naujas slaptažodis<span class="pwin"><input id="pw-new" type="password" autocomplete="new-password">${eye("pw-new")}</span></label>
      <ul class="pwrules" id="pw-rules"><li data-r="len">Bent 8 simboliai</li><li data-r="num">Bent vienas skaičius</li><li data-r="up">Bent viena didžioji raidė</li></ul>
      <label class="field" for="pw-rep">Pakartokite naują slaptažodį<span class="pwin"><input id="pw-rep" type="password" autocomplete="new-password">${eye("pw-rep")}</span></label>
      <p class="small" id="pw-err" style="color:var(--red);font-weight:600;margin:0" role="alert"></p>
      <button type="button" class="linkbtn" data-act="toast" data-msg="Slaptažodžio atkūrimo nuoroda išsiųsta el. paštu">Pamiršote dabartinį slaptažodį?</button>
      <div class="row" style="justify-content:flex-end"><button class="btn" type="button" data-close-modal>Atšaukti</button><button class="btn primary" type="button" data-act="pwSave">Išsaugoti</button></div></div>`;
  } else if (m.type === "interview") {
    const a = E().ads.find((x) => x.id === m.ad), c = a.cands.find((x) => x[0] === m.id), w = WORKERS[m.id], iv = c[4] || { how: "live", d: 2, t: "10:00", addr: "" };
    h = head(c[4] ? "Keisti pokalbio laiką" : "Kviesti pokalbiui", esc(w.name), `<span class="muted small">${up(a.title)}</span>`) + `<div class="ivm">
      <div class="field"><span>Kaip vyks pokalbis</span><div class="segs wide2" role="radiogroup" aria-label="Pokalbio būdas"><label><input type="radio" name="iv-how" value="live"${iv.how === "live" ? " checked" : ""}><span>Gyvai</span></label><label><input type="radio" name="iv-how" value="phone"${iv.how === "phone" ? " checked" : ""}><span>Telefonu</span></label></div></div>
      <div class="pair2"><label class="field" for="iv-d">Data<input id="iv-d" type="date" value="${iso(dOff(iv.d))}"></label><label class="field" for="iv-t">Laikas<select id="iv-t">${timeOpts(iv.t)}</select></label></div>
      <label class="field iv-addr" for="iv-a">Adresas<input id="iv-a" value="${esc(iv.addr || "")}" placeholder="Pvz. Ozo g. 25, Vilnius"></label>
      <p class="small muted iv-ph" style="margin:0">Paskambinsite kandidatui nurodytu laiku – jo telefoną matysite patvirtinus.</p>
      <label class="field" for="iv-m">Žinutė (nebūtina)<textarea id="iv-m" placeholder="Pvz. Pasiimkite asmens dokumentą."></textarea></label>
      <p class="small" id="iv-err" style="color:var(--red);font-weight:600;margin:0" role="alert"></p>
      <div class="row" style="justify-content:flex-end"><button class="btn" type="button" data-close-modal>Atšaukti</button><button class="btn primary" type="button" data-act="ivSend" data-ad="${a.id}" data-id="${m.id}">${svg("send", 15)}${c[4] ? "Siųsti naują laiką" : "Siųsti kvietimą"}</button></div></div>`;
  } else if (m.type === "handover") {
    const j = E().jobs.find((x) => x.id === m.id);
    h = head("Perduoti darbą", up(j.title)) + `<div class="hlist" role="radiogroup" aria-label="Naujas atsakingas">${E().team.map(([n, r, e]) => { const cur = n === j.resp; return `<label class="hrow${cur ? " cur" : ""}"><input type="radio" name="ho" value="${esc(n)}"${cur ? " disabled" : ""}${!cur && n === (m.pick || "") ? " checked" : ""}><span class="av lt sm">${n === "Jūs" ? "UP" : ini(n)}</span><span class="htx"><b>${esc(n)}</b><small>${esc(r)}</small></span>${cur ? pill("Dabar atsakingas") : ""}</label>`; }).join("")}</div>
      <label class="field" for="ho-note">Žinutė (nebūtina)<textarea id="ho-note" placeholder="Pvz. Rytoj būsiu kitame objekte, perimk prašau."></textarea></label>
      <p class="small" id="ho-err" style="color:var(--red);font-weight:600;margin:0" role="alert"></p>
      <div class="row" style="justify-content:flex-end"><button class="btn" type="button" data-close-modal>Atšaukti</button><button class="btn primary" type="button" data-act="handoverOk" data-id="${j.id}">Perduoti</button></div>`;
  } else if (m.type === "docView") {
    const w = WORKERS[m.w], u = DOC_UNTIL[m.v] || 365;
    h = `<header><div><h2 id="m-title">${esc(m.v)}</h2><span class="muted small">${esc(w.name)} · galioja iki ${iso(dOff(u))}</span></div><button type="button" class="x" data-close-modal aria-label="Uždaryti">${svg("x", 18, 2.2)}</button></header>
    <div class="docprev" data-protect><div class="docpaper" draggable="false"><div class="dp-shield" aria-hidden="true">${svg("lock", 22, 2)}<b>Dokumentas paslėptas</b><span>Grįžkite į langą, kad matytumėte</span></div><div class="dp-top"><span>MOKYMO CENTRAS</span><span>Nr. ${(1000 + w.name.length * 37) % 9000}-${m.v.length}</span></div><b class="dp-t">PAŽYMĖJIMAS</b><span class="dp-s">${esc(m.v)}</span><div class="dp-name">${esc(w.name.replace(".", ""))}</div><div class="dp-grid"><span>Išduota</span><b>${iso(dOff(u - 730))}</b><span>Galioja iki</span><b>${iso(dOff(u))}</b></div><div class="dp-sign"><i></i><small>Parašas</small></div></div><span class="dp-note">${svg("lock", 12, 2.2)} Tik peržiūra – dokumento atsisiųsti negalima</span></div>
    <div class="row" style="justify-content:space-between"><button class="btn" type="button" data-act="profileW" data-id="${m.w}">${svg("right", 15, 2.4).replace(I.right, '<path d="m15 18-6-6 6-6"/>')}Atgal</button></div>`;
  } else if (m.type === "memberEdit") {
    const t = E().team.find((x) => x[0] === m.v); const role = m.role || t[1]; const k = LBL2K[role]; const ov = m.ov || { ...(t[3] || {}) };
    const saved = S.empRole; S.empRole = "owner"; const def = (p) => { const tmp = { manager: { allJobs: 1, create: 1, invite: 1, ads: 1, stats: 1, team: 1 }, recruiter: { allJobs: 0, create: 1, invite: 1, ads: 0, stats: 1, team: 0 }, site: { allJobs: 0, create: 0, invite: 0, ads: 0, stats: 0, team: 0 } }[k]; return !!tmp[p]; }; S.empRole = saved;
    h = head("Komandos narys", esc(m.v), `<span class="muted small">${esc(t[2])}</span>`) + `<div class="field"><span>Rolė</span><div class="segs" role="radiogroup" aria-label="Rolė">${["Vadovas", "Vadybininkas", "Objekto vadovas"].map((x) => `<label><input type="radio" name="me-role" data-act="meRole" data-v="${x}"${x === role ? " checked" : ""}><span>${x}</span></label>`).join("")}</div></div>
      <div class="field"><span>Teisės</span><div class="setlist">${PERMS.map(([p, lab]) => { const on = p in ov ? !!ov[p] : def(p); const changed = p in ov && !!ov[p] !== def(p); return `<div class="setrow"><div class="settx"><b>${lab}</b><span>${changed ? "Pakeista rankiniu būdu" : "Pagal rolę"}</span></div><button type="button" class="tgl${on ? " on" : ""}" data-act="mePerm" data-v="${p}" role="switch" aria-checked="${on}" aria-label="${lab}"><i></i></button></div>`; }).join("")}</div></div>
      <div class="row" style="justify-content:space-between"><button class="btn danger" type="button" data-act="removeMember" data-v="${esc(m.v)}">Pašalinti iš komandos</button><div class="row" style="gap:8px"><button class="btn" type="button" data-close-modal>Atšaukti</button><button class="btn primary" type="button" data-act="meSave">Išsaugoti</button></div></div>`;
  } else if (m.type === "siteEdit") {
    const j = E().jobs.find((x) => x.id === m.id);
    h = head("Pasitinka objekte", up(j.title)) + `<div class="hlist" role="radiogroup" aria-label="Objekto vadovas"><label class="hrow"><input type="radio" name="se" value=""${!j.site ? " checked" : ""}><span class="htx"><b>Nėra</b><small>Atvykimus tvirtina atsakingas (${esc(j.resp)})</small></span></label>${E().team.filter((t) => t[1] === "Objekto vadovas").map(([n]) => `<label class="hrow"><input type="radio" name="se" value="${esc(n)}"${j.site === n ? " checked" : ""}><span class="av lt sm">${ini(n)}</span><span class="htx"><b>${esc(n)}</b><small>Objekto vadovas</small></span></label>`).join("")}</div>
      <div class="row" style="justify-content:flex-end"><button class="btn" type="button" data-close-modal>Atšaukti</button><button class="btn primary" type="button" data-act="siteOk" data-id="${j.id}">Išsaugoti</button></div>`;
  } else if (m.type === "earnPdf") {
    h = `<header><div><h2 id="m-title">PDF peržiūra</h2><span class="muted small">Taip atrodys atsisiųstas failas</span></div><button type="button" class="x" data-close-modal aria-label="Uždaryti">${svg("x", 18, 2.2)}</button></header>
    <div class="pdfwrap"><div class="pdfpage">
      <div class="pdfhead"><img src="${LOGO_SRC}" alt="statybos24.lt"><div><b>Mėnesio darbo ataskaita</b><span>Sugeneruota ${iso(TODAY)}</span></div></div>
      <div class="pdfinfo"><div><small>Darbuotojas</small><b>Beata Bune</b></div><div><small>Laikotarpis</small><b>${TODAY.getFullYear()} m. ${MON_L[TODAY.getMonth()].toLowerCase()}</b></div><div><small>Išdirbta</small><b>${EARN.hours} val. · ${EARN.rows.length} darbai</b></div><div><small>Uždirbta į rankas</small><b>≈ ${EARN.total} €</b></div></div>
      <table class="pdftab earn"><thead><tr><th>Data</th><th>Darbas</th><th class="pdh">Darbdavys</th><th>Laikas</th><th class="pdh">Atlygis</th><th style="text-align:right">Suma</th></tr></thead><tbody>${EARN.rows.map((r) => `<tr><td>${iso(dOff(r.d))}</td><td><b>${up(r.t)}</b></td><td class="pdh">${esc(r.c)}</td><td>${String(r.h).replace(".", ",")} val.</td><td class="pdh">${r.p} €/${r.u === "day" ? "d." : "val."}</td><td style="text-align:right"><b>${r.sum} €</b></td></tr>`).join("")}<tr class="pdftot"><td colspan="2"><b>Iš viso</b></td><td class="pdh"></td><td><b>${EARN.hours} val.</b></td><td class="pdh"></td><td style="text-align:right"><b>${EARN.total} €</b></td></tr></tbody></table>
      <div class="pdffoot">statybos24.lt · Suma apskaičiuota pagal darbdavių nurodytą atlygį į rankas ir patvirtintą darbo laiką. Tai nėra mokėjimo dokumentas. · 1 / 1 psl.</div>
    </div></div>
    <div class="row" style="justify-content:flex-end"><button class="btn" type="button" data-close-modal>Uždaryti</button><button class="btn dark" type="button" data-act="toast" data-msg="Tikroje svetainėje PDF failas bus atsisiųstas į jūsų įrenginį">${svg("download", 16, 2.2)}Atsisiųsti PDF</button></div>`;
  } else if (m.type === "notifPrev") {
    const n = (ic, app, tm, t, b, acts) => `<div class="pn"><div class="pn-h"><span class="pn-ic"><img src="${MARK_SRC}" alt=""></span><span>statybos24.lt</span><span class="pn-tm">${tm}</span></div><b>${t}</b><p>${b}</p>${acts ? `<div class="pn-acts">${acts.map((a) => `<span>${a}</span>`).join("")}</div>` : ""}</div>`;
    h = head("Pranešimai telefone", "Kaip atrodys pranešimai") + `<div class="phonemock"><div class="pm-time">${String(new Date().getHours()).padStart(2, "0")}:${String(new Date().getMinutes()).padStart(2, "0")}</div><div class="pm-list">
      ${n("mail", "", "dabar", "Naujas kvietimas · MB Pamatų meistrai", "BETONAVIMO PAGALBA · rytoj 07:00–15:00 · 120 €/d. · 5 km", ["Priimti", "Atmesti", "Peržiūrėti"])}
      ${n("clock", "", "13:00", "Liko 1 val. atsakyti į kvietimą", "BETONAVIMO PAGALBA · MB Pamatų meistrai. Neatsakius iki 14:00 kvietimas nebegalios.", ["Priimti", "Atmesti"])}
      ${n("cal", "", "20:00", "Rytoj dirbate 08:00", "STATYBVIETĖS TVARKYMAS · Ozo g. 25, Vilnius. Kelionė ~18 min.", ["Nuvesti"])}
      ${n("clock", "", "07:00", "Po valandos prasideda darbas", "Išvykite iki 07:40, kad atvyktumėte laiku. Atvykę paspauskite „Atvykau“.", ["Nuvesti", "Atvykau"])}
    </div></div>
    <div class="row" style="justify-content:flex-end"><button class="btn" type="button" data-close-modal>Uždaryti</button></div>`;
  } else if (m.type === "cancelJob") {
    h = head("Darbo atšaukimas", "Ar tikrai norite atšaukti šį darbą?") + `<div class="notebox">Atšaukus darbą jų rezervacijos bus panaikintos, pokalbis bus uždarytas. Kadangi darbą jau patvirtino darbuotojai, atšaukimas sumažins įmonės patikimumą.</div><label class="field" for="cj-why">Atšaukimo priežastis *<textarea id="cj-why" placeholder="Pvz. Užsakovas netikėtai nukėlė darbus į kitą savaitę."></textarea><span class="hint">Šią priežastį matys darbą patvirtinę darbuotojai.</span></label><p class="small" id="cj-err" style="color:var(--red);font-weight:600" role="alert"></p><div class="row" style="justify-content:flex-end"><button class="btn" type="button" data-close-modal>Ne, grįžti</button><button class="btn danger" type="button" data-act="cancelOk" data-id="${m.id}">Taip, atšaukti darbą</button></div>`;
  } else if (m.type === "jobInfo") {
    const j = E().jobs.find((x) => x.id === m.id);
    h = head("Darbo informacija", up(j.title), '<span class="muted small">Visa informacija, kuri buvo nurodyta kuriant šį darbo pasiūlymą.</span>') + `<div class="kv"><div><small>Data ir laikas</small><b>${dateLabel(j.d)} · ${j.from}–${j.to}</b></div><div><small>Atlygis</small><b>${pay(j.pay, j.unit)}</b></div><div><small>Reikia darbuotojų</small><b>${j.need}</b></div><div><small>Atsakingas žmogus</small><b>${esc(j.resp)}</b></div><div><small>Atvykti adresu</small><b>${esc(j.addr)}</b></div><div><small>Atvykimas į darbo vietą</small><b>${esc(j.arrival)}</b></div><div class="wide"><small>Darbo aprašymas</small><b style="font-weight:500">${esc(j.desc)}</b></div></div>`;
  } else if (m.type === "auth") {
    const login = m.v === "login";
    const emp = m.v === "signup-emp" || (m.v === "signup" && m.kind === "emp");
    h = head(login ? "Prisijungimas" : "Registracija", login ? "Sveiki sugrįžę" : "Sukurkite paskyrą") + `<div class="toggle2" role="group" aria-label="Prisijungti arba registruotis"><button type="button" data-act="auth" data-v="login" aria-pressed="${login}">Prisijungti</button><button type="button" data-act="auth" data-v="signup-wk" aria-pressed="${!login}">Registruotis</button></div>
    ${login ? `<div class="form" style="grid-template-columns:1fr"><label class="field" for="a-mail">El. paštas<input id="a-mail" type="email" placeholder="vardas@pastas.lt" autocomplete="off"></label><label class="field" for="a-pass">Slaptažodis<input id="a-pass" type="password" placeholder="Jūsų slaptažodis"></label></div><button class="btn ghost sm" type="button" data-act="toast" data-msg="Atsiųsime nuorodą naujam slaptažodžiui nustatyti" style="align-self:flex-start">Pamiršau slaptažodį</button>
    <div class="notebox">Prototipe prisijungimas neveikia. Pasirinkite, kurią paskyrą peržiūrėti:</div><div class="row"><button class="btn primary" type="button" data-act="enter" data-v="worker">Atidaryti darbuotojo paskyrą</button><button class="btn dark" type="button" data-act="enter" data-v="employer">Atidaryti darbdavio paskyrą</button><button class="btn" type="button" data-act="enter" data-v="admin">${svg("shield", 15)}Administratorius</button></div>`
    : `<div class="toggle2" role="group" aria-label="Paskyros tipas"><button type="button" data-act="auth" data-v="signup-wk" aria-pressed="${!emp}">Ieškau darbo</button><button type="button" data-act="auth" data-v="signup-emp" aria-pressed="${emp}">Ieškau darbuotojų</button></div>
    <div class="form">${emp ? `<div class="field wide"><span>Kas registruojasi?</span><div class="segs wide2" role="radiogroup" aria-label="Darbdavio tipas"><label><input type="radio" name="r-et" data-act="regEt" data-v="co"${m.et !== "pr" ? " checked" : ""}><span>Įmonė</span></label><label><input type="radio" name="r-et" data-act="regEt" data-v="pr"${m.et === "pr" ? " checked" : ""}><span>Privatus asmuo</span></label></div></div>${m.et === "pr" ? `<label class="field" for="r-fn">Vardas *<input id="r-fn" class="nmcap" autocomplete="given-name" placeholder="Pvz. Jonas"><span class="ferr" role="alert"></span></label><label class="field" for="r-ln">Pavardė *<input id="r-ln" class="nmcap" autocomplete="family-name" placeholder="Pvz. Petrauskas"><span class="ferr" role="alert"></span></label><p class="hint wide nmhint">Pvz. namo savininkas, ūkininkas ar meistras su individualia veikla. Darbuotojai matys „Privatus darbdavys“.</p>` : `<label class="field wide" for="r-co">Įmonės pavadinimas *<input id="r-co" placeholder="UAB ..."></label><label class="field" for="r-code">Įmonės kodas *<input id="r-code" inputmode="numeric" maxlength="9" placeholder="9 skaitmenys"><span class="ferr" role="alert"></span></label><p class="hint wide nmhint">Įmonės kodas tikrinamas Registrų centre – viena įmonė gali turėti tik vieną paskyrą.</p>`}` : `<label class="field" for="r-fn">Vardas *<input id="r-fn" class="nmcap" autocomplete="given-name" placeholder="Pvz. Jonas"><span class="ferr" role="alert"></span></label><label class="field" for="r-ln">Pavardė *<input id="r-ln" class="nmcap" autocomplete="family-name" placeholder="Pvz. Petrauskas"><span class="ferr" role="alert"></span></label><p class="hint wide nmhint">Rašykite pilną vardą ir pavardę, kaip asmens dokumente.</p><label class="field" for="r-bd">Gimimo data *<input id="r-bd" type="date"><span class="hint">Gimimo data nėra rodoma darbdaviams.</span></label>`}<label class="field" for="r-city">Miestas<input id="r-city" placeholder="Pradėkite rašyti miestą"></label><label class="field" for="r-ph">Telefonas *<input id="r-ph" inputmode="tel" placeholder="+37061234567"></label><label class="field" for="r-mail">El. paštas<input id="r-mail" type="email"></label><label class="field" for="r-pass">Slaptažodis<input id="r-pass" type="password" placeholder="Bent 8 simboliai"></label></div>
    <label class="check"><input type="checkbox" id="r-terms"> Susipažinau su naudojimosi sąlygomis ir privatumo politika</label><div class="row" style="justify-content:flex-end"><button class="btn primary" type="button" data-act="regGo" data-v="${emp ? "employer" : "worker"}">Sukurti paskyrą</button></div><p class="small muted">Prototipe paskyra nesukuriama – mygtukas atidaro pavyzdinę paskyrą.</p>`}`;
  } else if (m.type === "hireForm") {
    h = head("Įdarbinti darbuotoją", "Naujas įdarbinimo pasiūlymas", '<span class="muted small">Darbuotojas pasiūlymą ir jūsų įkeltą darbo sutartį gaus atskiroje skiltyje.</span>') + `<div class="form"><label class="field wide" for="h-w">Darbuotojas<select id="h-w">${["w1", "w2", "w4", "w7"].map((id) => `<option>${WORKERS[id].name}</option>`).join("")}</select></label><label class="field" for="h-pos">Darbo pozicija *<input id="h-pos" placeholder="Pvz. Statybų darbų vadovas"></label><label class="field" for="h-type">Sutarties tipas *<select id="h-type"><option>Neterminuota</option><option>Terminuota</option></select></label><label class="field" for="h-start">Preliminari darbo pradžia *<input id="h-start" type="date"></label><label class="field" for="h-pay">Atlygis į rankas (neto), € / mėn.<input id="h-pay" inputmode="decimal"></label><label class="field wide" for="h-info">Įdarbinimo informacija<textarea id="h-info" placeholder="Aprašykite pareigas, atsakomybes, sąlygas ir kitą darbuotojui svarbią informaciją."></textarea></label><div class="field wide"><span>Darbo sutartis *</span><button class="btn" type="button" data-act="toast" data-msg="Prototipe failas neįkeliamas">${svg("file", 18)}Pasirinkti sutartį</button><span class="hint">Įkelkite galutinę sutartį PDF arba DOCX formatu, iki 15 MB.</span></div></div><div class="row" style="justify-content:flex-end"><button class="btn" type="button" data-close-modal>Atšaukti</button><button class="btn primary" type="button" data-act="hireSend">Pateikti įdarbinimo pasiūlymą</button></div>`;
  }
  if (/^(h[A-Z]|aHire)/.test(m.type)) h = hireModal(m, head);
  else if (/^a[A-Z]/.test(m.type)) h = aModal(m, head);
  return `<div class="modal-bg" data-modal-bg><div class="modal${(m.type === "auth" && m.v !== "login") || m.type === "pdf" || m.type === "earnPdf" ? " wide" : ""}" role="dialog" aria-modal="true" aria-labelledby="m-title">${h}</div></div>`;
}

/* ---------- Administratorius ---------- */
function adminState() {
  return {
    admins: [{ id: "ad1", n: "Administratorius", e: "info@statybos24.lt", owner: true, since: -400, p: null }, { id: "ad2", n: "Rūta Rūtaitė", e: "ruta@pavyzdys.lt", since: -60, p: ["disputes", "bugs", "reviews", "chats", "verify", "suspend", "foreign"] }],
    admInv: [],
    wst: { w6: { s: "worker", reason: "3 neatvykimai per mėnesį be priežasties", until: 14, by: "Administratorius", d: -2 } },
    wreg: { w1: -410, w2: -322, w3: -95, w4: -260, w5: 0, w6: -18, w7: -150 },
    abroadWant: ["w3", "w5", "w7"],
    abroadC: { w3: ["Norvegija", "Švedija"], w5: ["Vokietija"], w7: [] },
    employers: [
      { id: "c1", n: "UAB Pavyzdinė statyba", type: "co", code: "300000000", city: "Vilnius", plan: "pro", jobs: 42, rel: 97, ver: true, st: "ok", owner: "Jonas Vadovas", email: "vadovas@pavyzdys.lt", phone: "+37060000000", team: 3, reg: -380 },
      { id: "c2", n: "UAB Statybų partneris", type: "co", code: "302345678", city: "Vilnius", plan: "business", jobs: 31, rel: 100, ver: true, st: "ok", owner: "Rasa Jonaitienė", email: "rasa@partneris.lt", phone: "+37061111111", team: 1, reg: -510 },
      { id: "c3", n: "MB Pamatų meistrai", type: "co", code: "305678901", city: "Vilnius", plan: "business", jobs: 42, rel: 94, ver: true, st: "ok", owner: "Darius Kazlauskas", email: "darius@pamatai.lt", phone: "+37062222222", team: 1, reg: -290 },
      { id: "c4", n: "UAB Baltijos sandėliai", type: "co", code: "304567890", city: "Vilnius", plan: "basic", jobs: 12, rel: 91, ver: true, st: "ok", owner: "Darius Petraitis", email: "info@baltsand.lt", phone: "+37063333333", team: 1, reg: -120 },
      { id: "c5", n: "UAB Rytų rangovai", type: "co", code: "306789012", city: "Kaunas", plan: "basic", jobs: 3, rel: 88, ver: false, st: "ok", owner: "Mindaugas Rimkus", email: "rangovai@rytai.lt", phone: "+37064444444", team: 1, reg: 0 },
      { id: "c6", n: "Jonas Petrauskas", type: "pr", code: "", city: "Trakai", plan: "basic", jobs: 2, rel: 100, ver: true, st: "ok", owner: "Jonas Petrauskas", email: "jonas.p@gmail.com", phone: "+37065555555", team: 1, reg: -12 },
      { id: "c7", n: "UAB Greita statyba", type: "co", code: "301234567", city: "Klaipėda", plan: "basic", jobs: 7, rel: 62, ver: true, st: "susp", reason: "Neapmokėti darbai – 3 darbuotojų skundai", until: 0, owner: "Tadas Greitas", email: "info@greita.lt", phone: "+37066666666", team: 1, reg: -200 }
    ],
    jobs: [
      { t: "Pagalbiniai mūro darbai", co: "UAB Pavyzdinė statyba", d: 1, need: 3, acc: 2, pay: "15 €/val.", st: "short" },
      { t: "Betonavimo pagalba", co: "UAB Pavyzdinė statyba", d: 0, need: 2, acc: 2, pay: "130 €/d.", st: "live" },
      { t: "Statybvietės tvarkymas", co: "UAB Pavyzdinė statyba", d: -1, need: 3, acc: 3, pay: "14 €/val.", st: "toClose" },
      { t: "Pagalbiniai statybos darbai", co: "UAB Statybų partneris", d: 2, need: 2, acc: 1, pay: "14 €/val.", st: "short", city: "Vilnius", addr: "Ozo g. 25, Vilnius", from: "08:00", to: "17:00", lunch: "12:00–12:30", desc: "Medžiagų pernešimas ir pagalba meistrams objekte.", ws: ["w2"] },
      { t: "Medžiagų nešiojimas", co: "UAB Baltijos sandėliai", d: 3, need: 4, acc: 4, pay: "13 €/val.", st: "full", city: "Vilnius", addr: "Savanorių pr. 178, Vilnius", from: "07:00", to: "15:00", lunch: "11:30–12:00", desc: "Statybinių medžiagų pernešimas sandėlyje.", ws: ["w1", "w3", "w4", "w7"] },
      { t: "Tvarkymo darbai objekte", co: "UAB Rytų rangovai", d: 1, need: 2, acc: 0, pay: "13 €/val.", st: "short", city: "Kaunas", addr: "Savanorių pr. 400, Kaunas", from: "08:00", to: "16:00", lunch: "12:00–12:30", desc: "Patalpų tvarkymas po apdailos darbų.", ws: [] },
      { t: "Sodo tvoros pagalba", co: "Jonas Petrauskas", d: 5, need: 1, acc: 1, pay: "120 €/d.", st: "full", city: "Trakai", addr: "Vytauto g. 12, Trakai", from: "08:00", to: "16:00", lunch: "Pagal susitarimą", desc: "Pagalba statant sodo tvorą: stulpų kasimas, betonavimas.", ws: ["w5"] },
      { t: "Fasado pastolių nešimas", co: "UAB Pavyzdinė statyba", d: -6, need: 2, acc: 2, pay: "14 €/val.", st: "done" },
      { t: "Tvarkymo darbai objekte", co: "UAB Pavyzdinė statyba", d: -9, need: 3, acc: 0, pay: "14 €/val.", st: "cancel" }
    ],
    disputes: [
      { id: "d1", job: "Statybvietės tvarkymas", co: "UAB Pavyzdinė statyba", w: "w6", d: -1, open: true,
        wSays: "Dirbau šiame darbe", wArr: "08:02", wLeft: "15:00", wNote: "Dirbau visą dieną, išėjau kai baigėme. Turiu nuotrauką iš objekto 14:40.", wFile: "objektas_1440.jpg",
        eSays: "Išėjo anksčiau", eArr: "08:10", eLeft: "12:30", eNote: "Po pietų darbuotojo objekte nebebuvo, į skambučius neatsiliepė." },
      { id: "d2", job: "Tvarkymo darbai objekte", co: "UAB Rytų rangovai", w: "w5", d: -3, open: true,
        wSays: "Dirbau šiame darbe", wArr: "09:00", wLeft: "13:00", wNote: "Objekto vadovas leido išeiti 13:00, nes baigėsi medžiagos.", wFile: "",
        eSays: "Išėjo anksčiau be leidimo", eArr: "09:05", eLeft: "13:00", eNote: "Darbo diena iki 15:00, leidimo išeiti niekas nedavė." },
      { id: "d3", job: "Medžiagų iškrovimas", co: "UAB Baltijos sandėliai", w: "w2", d: -12, open: false, res: "Darbuotojo naudai", resNote: "Darbdavys patvirtino, kad atvykimą pažymėjo per klaidą.",
        wSays: "Dirbau šiame darbe", wArr: "07:00", wLeft: "15:00", wNote: "", wFile: "", eSays: "Neatvyko", eArr: "—", eLeft: "—", eNote: "" }
    ],
    bugs: [
      { id: "b1", who: "Tomas K.", kind: "Darbuotojas", page: "Profilis", t: "Telefone nepavyksta įkelti profilio nuotraukos – paspaudus nieko neįvyksta.", d: 0, tm: "09:12", st: "active", shot: true, dev: "Telefonas · Android" },
      { id: "b2", who: "UAB Rytų rangovai", kind: "Darbdavys", page: "Darbų kalendorius", t: "Kalendoriuje nerodo rytojaus darbo, nors jis sukurtas.", d: -1, tm: "17:40", st: "active", shot: true, dev: "Kompiuteris · Chrome" },
      { id: "b3", who: "Rytis K.", kind: "Darbuotojas", page: "Žinutės", t: "Žinutė išsiuntė du kartus.", d: -6, tm: "11:05", st: "fixed", shot: false, dev: "Telefonas · iPhone" }
    ],
    reviews: [
      { by: "Tomas K.", about: "UAB Pavyzdinė statyba", r: 10, t: "Aiškiai paaiškino užduotis, atsiskaitė laiku.", job: "Fasado pastolių nešimas", d: -6 },
      { by: "UAB Statybų partneris", about: "Rytis K.", r: 9, t: "Atvyko laiku, dirbo tvarkingai.", job: "Pagalbiniai statybos darbai", d: -8 },
      { by: "Gintaras V.", about: "UAB Greita statyba", r: 2, t: "Nesumokėjo už dvi dienas, vadovas nekelia ragelio. Sukčiai!!!", job: "Atliekų išnešimas", d: -14, flag: true },
      { by: "MB Pamatų meistrai", about: "Mantas P.", r: 9, t: "Rekomenduoju, stiprus ir greitas.", job: "Betonavimo pagalba", d: -16 }
    ],
    teamChats: [
      { co: "UAB Pavyzdinė statyba", plan: "Business Pro", mem: 3, msgs: 46, last: "Šiandien 08:41" },
      { co: "UAB Statybų partneris", plan: "Business", mem: 1, msgs: 0, last: "" }
    ],
    files: [
      { n: "aukstis_pazymejimas.pdf", who: "Tomas K.", size: "240 KB", job: "", d: -40, kind: "Pažymėjimas" },
      { n: "objektas_1440.jpg", who: "Gintaras V.", size: "1,8 MB", job: "Statybvietės tvarkymas", d: -1, kind: "Ginčo įrodymas" },
      { n: "klaida_profilis.png", who: "Tomas K.", size: "420 KB", job: "", d: 0, kind: "Klaidos nuotrauka" },
      { n: "darbo_sutartis_EA1.pdf", who: "UAB Pavyzdinė statyba", size: "310 KB", job: "Statybų darbininkas", d: -20, kind: "Darbo sutartis" },
      { n: "CV_Rytis_K.pdf", who: "Rytis K.", size: "180 KB", job: "Statybų darbininkas", d: -4, kind: "CV" }
    ],
    placements: [
      { w: "w1", co: "UAB Pavyzdinė statyba", pos: "Statybų darbininkas", st: "active", start: -60, contract: "Pasirašyta" },
      { w: "w4", co: "MB Pamatų meistrai", pos: "Betonuotojas", st: "active", start: -25, contract: "Pasirašyta" },
      { w: "w3", co: "UAB Statybų partneris", pos: "Pagalbinis darbuotojas", st: "pending", start: 7, contract: "Laukiama parašo" },
      { w: "w2", co: "UAB Baltijos sandėliai", pos: "Sandėlio darbuotojas", st: "ended", start: -200, contract: "Pasibaigė" }
    ],
    foreign: [
      { id: "f1", co: "UAB Pavyzdinė statyba", prof: "Mūrininkas", need: 4, st: "new", d: -1, pay: "Apmoka darbdavys", house: "Suteikia darbdavys" },
      { id: "f2", co: "MB Pamatų meistrai", prof: "Betonuotojas", need: 2, st: "presented", d: -14, pay: "Apmoka darbdavys", house: "Nesuteikiama", cands: 5 },
      { id: "f3", co: "UAB Statybų partneris", prof: "Armatūrininkas", need: 3, st: "hired", d: -40, pay: "Moka / prisideda darbuotojas", house: "Suteikia darbdavys", cands: 3 }
    ],
    audit: [
      ["Administratorius", "Darbuotojo režimas suspenduotas", "Gintaras V. · 14 d.", -2],
      ["Administratorius", "Paskyra suspenduota", "UAB Greita statyba", -9],
      ["Administratorius", "Atsiliepimas pašalintas", "Įžeidžiantis turinys", -11],
      ["Administratorius", "Ginčas išspręstas", "Medžiagų iškrovimas · darbuotojo naudai", -12]
    ],
    convs: [
      { id: "ad-b1", kind: "private", name: "Tomas K.", person: "Klaidos pranešimas · Profilis", online: true, job: "Klaidos pranešimas", unread: true, msgs: [{ w: "them", t: "Telefone nepavyksta įkelti profilio nuotraukos – paspaudus nieko neįvyksta.", d: "Šiandien", tm: "09:12" }] },
      { id: "ad-b2", kind: "private", name: "UAB Rytų rangovai", person: "Klaidos pranešimas · Kalendorius", online: false, job: "Klaidos pranešimas", unread: true, msgs: [{ w: "them", t: "Kalendoriuje nerodo rytojaus darbo, nors jis sukurtas.", d: "Vakar", tm: "17:40" }] },
      { id: "ad-c7", kind: "private", name: "UAB Greita statyba", person: "Paskyros suspendavimas", online: false, job: "Paskyros suspendavimas", unread: false, msgs: [{ w: "me", t: "Laba diena. Jūsų paskyra suspenduota dėl neapmokėtų darbų. Prašome susisiekti su darbuotojais ir atsiskaityti.", d: "Prieš 9 d.", tm: "10:20" }, { w: "them", t: "Atsiskaitysime iki penktadienio.", d: "Prieš 8 d.", tm: "08:02" }] }
    ],
    awardsMonth: 0
  };
}
const A = () => S.admin || (S.admin = adminState());
const CONVS = () => S.role === "worker" ? S.worker.convs : S.role === "admin" ? A().convs : E().convs;
const AJ_ST = { short: ["Trūksta žmonių", "orange"], live: ["Vyksta", "green"], toClose: ["Neuždaryta", "orange"], full: ["Surinkta", "green"], done: ["Įvykdytas", ""], cancel: ["Atšauktas", "red"] };
const wStatus = (id) => A().wst[id];
const coById = (id) => A().employers.find((x) => x.id === id);
const aLog = (what, obj) => A().audit.unshift([admMe() ? admMe().n : "Administratorius", what, obj, 0]);
const ago = (d) => d === 0 ? "Šiandien" : d === -1 ? "Vakar" : d < 0 ? `Prieš ${-d} d.` : `Po ${d} d.`;
const aHead = (t, sub, extra = "") => `${admMe() ? `<div class="adm-depbar">${svg("eye", 15)}<span>Peržiūrite kaip <b>${esc(admMe().n)}</b> · ${admPerms(admMe()).length}/${ADM_ALL.length} teisių. Kas neleidžiama – paslėpta.</span><button class="btn sm" type="button" data-act="admViewBack">Grįžti į administratorių</button></div>` : ""}<div class="head"><div><h1>${t}</h1>${sub ? `<p class="lead">${sub}</p>` : ""}</div>${extra}</div>`;
const aSearch = (key, ph) => `<label class="field asrch" for="as-${key}"><span class="sr">Ieškoti</span><span class="asrch-in">${svg("search", 16)}<input id="as-${key}" data-asearch="${key}" type="search" placeholder="${ph}" value="${esc(S["aq_" + key] || "")}" autocomplete="off"></span></label>`;
const aMatch = (key, txt) => { const q = (S["aq_" + key] || "").trim().toLocaleLowerCase("lt-LT"); return !q || txt.toLocaleLowerCase("lt-LT").includes(q); };
const aChips = (key, opts) => { const cur = S["af_" + key] || opts[0][0]; return `<div class="chips" role="group">${opts.map(([k, t, n]) => `<button type="button" class="chip" data-act="aFilter" data-k="${key}" data-v="${k}" aria-pressed="${cur === k}">${t}${n != null ? ` <span class="cnt">${n}</span>` : ""}</button>`).join("")}</div>`; };
const aF = (key, def) => S["af_" + key] || def;

function aOverview() {
  const D = A(), openD = D.disputes.filter((d) => d.open).length, bugs = D.bugs.filter((b) => b.st === "active").length, unver = D.employers.filter((c) => !c.ver).length, fnew = D.foreign.filter((f) => f.st === "new").length;
  const tile = (ic, lab, val, sub, go, hot) => `<button type="button" class="ovcard ntile${hot ? " hot" : ""}" ${go}><span class="ovtop"><small>${lab}</small><span class="ntic">${svg(ic, 18)}</span></span><b class="ovval">${val}</b><span class="ovsub">${hot ? '<i class="ovdot"></i>' : ""}${sub}</span></button>`;
  const Q = [];
  D.disputes.filter((d) => d.open).forEach((d) => Q.push({ ic: "shield", tone: "o", t: `Ginčas: ${WORKERS[d.w].name} ↔ ${d.co}`, s: `${up(d.job)} · ${ago(d.d)}`, b: `<button class="btn sm primary" type="button" data-go="disputes">Spręsti</button>` }));
  D.bugs.filter((b) => b.st === "active").forEach((b) => Q.push({ ic: "bell", tone: "o", t: `Klaida: ${b.page}`, s: `${b.who} · ${ago(b.d)} ${b.tm}`, b: `<button class="btn sm" type="button" data-go="bugs">Peržiūrėti</button>` }));
  D.employers.filter((c) => !c.ver).forEach((c) => Q.push({ ic: "home", tone: "o", t: `Įmonė laukia patvirtinimo: ${c.n}`, s: `Kodas ${c.code} · ${ago(c.reg)}`, b: `<button class="btn sm primary" type="button" data-act="aVerify" data-id="${c.id}">Patvirtinti</button>` }));
  H().requests.filter((f) => f.st === "new" || f.agr === "signed" || f.needs.some((n) => n.st === "new")).forEach((f) => Q.push({ ic: "people", tone: "o", t: f.st === "new" ? `Nauja tarptautinė užklausa: ${f.co}` : f.agr === "signed" ? `Pasirašyta sutartis laukia patvirtinimo: ${f.co}` : `Naujas darbuotojų poreikis: ${f.co}`, s: `${hOpt(f.country)} · ${ago(f.d)}`, b: `<button class="btn sm" type="button" data-act="aHireOpen" data-id="${f.id}">Atidaryti</button>` }));
  const traffic = [["Telefonu", 642], ["Kompiuteriu", 211]], tt = traffic.reduce((a, x) => a + x[1], 0);
  const cities = [["Vilnius", 412], ["Kaunas", 188], ["Klaipėda", 96], ["Šiauliai", 54], ["Panevėžys", 41]], cm = cities[0][1];
  return `${aHead("Suvestinė", `Šiandien, ${iso(TODAY)}`)}
  <section class="ovsec"><h2 class="sr">Šiandien</h2><div class="ntiles">
    ${(() => { const W0 = Object.values(WORKERS).filter((w) => !(D.deleted || {})[w.id]), C0 = D.employers.filter((c) => c.st !== "deleted"), tw = W0.filter((w) => (D.wreg[w.id] ?? -99) >= 0).length, tc = C0.filter((c) => c.reg >= 0).length; return tile("user", "Šiandien užsiregistravo", tw + tc, `${tw} darb. · ${tc} darbd. · iš viso ${W0.length + C0.length}`, 'data-go="aworkers"'); })()}
    ${tile("out", "Šiandien prisijungė", 214, "Vakar 198", 'data-go="aworkers"')}
    ${(() => { const J = aJobsAll(), act = J.filter((j) => j.d >= 0 && j.st !== "cancel" && j.st !== "done"); return tile("jobs", "Aktyvūs darbai", act.length, `Šiandien vyksta ${act.filter((j) => j.d === 0).length}`, 'data-go="ajobs"'); })()}
    ${tile("shield", "Neišspręsti ginčai", openD, openD ? "Reikia sprendimo" : "Nėra", 'data-go="disputes"', openD)}
  </div></section>
  ${queueCard(Q)}
  <section class="ovsec"><h2 class="sect">Šis mėnuo</h2><div class="stats">
    ${(() => { const J = aJobsAll(), dn = J.filter((j) => j.st === "done").length, cn = J.filter((j) => j.st === "cancel").length, used = Object.values(WORKERS).filter((w) => w.jobs > 0 && !(D.deleted || {})[w.id]).length; return `<div class="stat"><small>Įvykdyti darbai</small><b>${dn}</b><span class="muted small">Iš ${J.length} visų darbų</span></div>
    <div class="stat"><small>Atšaukti darbai</small><b>${cn}</b><span class="muted small">${J.length ? Math.round(cn / J.length * 100) : 0} % visų darbų</span></div>
    <div class="stat"><small>Panaudoti darbuotojai</small><b>${used}</b><span class="muted small">Dirbo bent vieną dieną</span></div>`; })()}
    <div class="stat"><small>Įdarbinti darbuotojai</small><b>${D.placements.filter((p) => p.st === "active").length}</b><span class="muted small">Ilgalaikis darbas</span></div>
  </div></section>
  <div class="agrid2">
    <section class="card"><header><div><h2>Svetainės lankomumas šiandien</h2></div></header>
      <div class="abars">${traffic.map(([t, v]) => `<div class="abar"><span>${t}</span><div class="abar-t"><i style="width:${v / tt * 100}%"></i></div><b>${v}</b></div>`).join("")}</div>
      <h3 class="tch" style="margin-top:14px">Lietuvos miestai šiandien</h3>
      <div class="abars">${cities.map(([t, v]) => `<div class="abar"><span>${t}</span><div class="abar-t"><i style="width:${v / cm * 100}%"></i></div><b>${v}</b></div>`).join("")}</div>
    </section>
    <section class="card"><header><div><h2>Pristatymas įmonėms</h2><p class="small muted" style="margin:2px 0 0">Privati nuoroda, kurią galite siųsti potencialiems klientams.</p></div></header>
      <div class="phrow"><b style="font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">statybos24.lt/?pristatymas=•••••</b><span class="phok" style="margin-right:auto">${svg("check", 12, 3)}Paruošta dalintis</span></div>
      <div class="row" style="gap:8px"><button class="btn sm" type="button" data-act="copy" data-v="https://statybos24.lt/?pristatymas=pavyzdys">Kopijuoti nuorodą</button><button class="btn sm" type="button" data-act="toast" data-msg="Tikroje svetainėje atsidarys pristatymo puslapis">Atidaryti puslapį</button></div>
    </section>
  </div>`;
}

function aWorkers() {
  const D = A(), f = aF("w", "all");
  const all = Object.values(WORKERS).filter((w) => !(D.deleted || {})[w.id]), susp = all.filter((w) => wStatus(w.id));
  const L = all.filter((w) => (f === "all" || (f === "susp" ? wStatus(w.id) : !wStatus(w.id))) && aMatch("w", `${w.name} ${w.city}`));
  return `${aHead("Darbuotojai", `${all.length} registruoti darbuotojai`)}
  <div class="abar2">${aSearch("w", "Ieškoti pagal vardą ar miestą")}${aChips("w", [["all", "Visi", all.length], ["ok", "Aktyvūs", all.length - susp.length], ["susp", "Suspenduoti", susp.length]])}</div>
  <section class="card"><div class="atbl aw">
    <div class="atr ath"><span>Darbuotojas</span><span>Patikimumas</span><span>Įvertinimas</span><span>Darbai</span><span>Būsena</span><span></span></div>
    ${L.length ? L.map((w) => { const s = wStatus(w.id); return `<div class="atr"><span class="acell-nm">${wAv(w, "sm")}<span><b>${esc(w.name)}</b><small>${esc(w.city)} · registr. ${ago(D.wreg[w.id] || -30).toLowerCase()}</small></span></span><span data-l="Patikimumas"><b>${w.att}</b>/100</span><span data-l="Įvertinimas">${w.rating ? `${String(w.rating).replace(".", ",")}/10` : "—"}</span><span data-l="Darbai">${w.jobs}</span><span>${s ? pill(s.s === "worker" ? "Darb. režimas suspenduotas" : "Suspenduotas", "red") : pill("Aktyvus", "green")}</span><span class="aacts"><button class="btn sm" type="button" data-act="aManage" data-k="w" data-id="${w.id}">Valdyti</button></span></div>`; }).join("") : `<p class="small muted" style="padding:14px 4px;margin:0">Nieko nerasta.</p>`}
  </div></section>`;
}

function aEmployers() {
  const D = A(), f = aF("e", "all"), C = D.employers.filter((c) => c.st !== "deleted");
  const L = C.filter((c) => (f === "all" || (f === "unver" && !c.ver) || (f === "susp" && c.st === "susp") || (f === "pr" && c.type === "pr")) && aMatch("e", `${c.n} ${c.code} ${c.city} ${c.owner}`));
  return `${aHead("Darbdaviai ir įmonės", `${C.length} darbdaviai · ${C.filter((c) => c.type === "pr").length} privatūs`)}
  <div class="abar2">${aSearch("e", "Pavadinimas, kodas, miestas")}${aChips("e", [["all", "Visi", C.length], ["unver", "Laukia patvirtinimo", C.filter((c) => !c.ver).length], ["pr", "Privatūs", C.filter((c) => c.type === "pr").length], ["susp", "Suspenduoti", C.filter((c) => c.st === "susp").length]])}</div>
  <section class="card"><div class="atbl ae">
    <div class="atr ath"><span>Darbdavys</span><span>Planas</span><span>Darbų</span><span>Patikimumas</span><span>Būsena</span><span></span></div>
    ${L.length ? L.map((c) => `<div class="atr"><span class="acell-nm"><span class="av co sm" style="border:1px solid var(--line)">${ini(c.n.replace(/^(UAB|MB)\s+/, ""))}</span><span><b>${esc(c.n)}</b><small>${c.type === "pr" ? "Privatus darbdavys" : `Įmonė · ${c.code}`} · ${esc(c.city)}</small></span></span><span data-l="Planas">${PLN[c.plan]}</span><span data-l="Darbų">${c.jobs}</span><span data-l="Patikimumas"><b>${c.rel}</b>/100</span><span>${c.st === "susp" ? pill("Suspenduotas", "red") : !c.ver ? pill("Nepatvirtinta", "orange") : pill("Patvirtinta", "green")}</span><span class="aacts">${!c.ver ? `<button class="btn sm primary" type="button" data-act="aVerify" data-id="${c.id}">Patvirtinti</button>` : ""}<button class="btn sm" type="button" data-act="aManage" data-k="e" data-id="${c.id}">Valdyti</button></span></div>`).join("") : `<p class="small muted" style="padding:14px 4px;margin:0">Nieko nerasta.</p>`}
  </div></section>`;
}

const ABR_C = ["Vokietija", "Nyderlandai", "Norvegija", "Švedija", "Danija", "Suomija", "Belgija", "Austrija", "Šveicarija", "Kita"];
function aAbroad() {
  const D = A(), L = D.abroadWant.map((id) => WORKERS[id]).filter(Boolean), me = S.abroad ? [{ name: "Beata Bune", city: "Vilnius", demo: true }] : [];
  const cs = (L2) => L2 && L2.length ? L2.join(", ") : '<span class="muted">Nenurodė</span>';
  return `${aHead("Domisi darbu užsienyje", `${L.length + me.length} darbuotojai pažymėjo, kad domisi darbu užsienyje`)}
  <section class="card"><div class="atbl aab">
    <div class="atr ath"><span>Darbuotojas</span><span>Dominančios šalys</span><span></span></div>
    ${me.map((w) => `<div class="atr"><span class="acell-nm"><span class="av lt sm">BB</span><span><b>${esc(w.name)}</b><small>${esc(w.city)} · pavyzdinė paskyra</small></span></span><span data-l="Šalys">${cs(S.abroadC)}</span><span class="aacts"></span></div>`).join("")}
    ${L.map((w) => `<div class="atr"><span class="acell-nm">${wAv(w, "sm")}<span><b>${esc(w.name)}</b><small>${esc(w.city)} · patikimumas ${w.att}/100</small></span></span><span data-l="Šalys">${cs((D.abroadC || {})[w.id])}</span><span class="aacts"><button class="btn sm" type="button" data-act="profileW" data-id="${w.id}">${svg("user", 14)}Profilis</button></span></div>`).join("")}
  </div></section>`;
}

// Visi darbai: tikri įmonės darbai (sinchronizuoti su darbdavio puse) + kitų įmonių darbai
function aJobsAll() {
  const L = [], payS = (p, u) => p == null ? "—" : u === "day" ? `${p} €/d.` : `${p} €/val.`;
  E().jobs.forEach((j) => { const acc = j.workers.filter((w) => !["declined", "invited"].includes(w[1])).length; const st = j.d < 0 ? (j.workers.some((w) => w[1] === "toClose") ? "toClose" : "done") : acc < j.need ? "short" : j.d === 0 ? "live" : "full"; L.push({ key: "e:" + j.id, t: j.title, co: ADM_CO, d: j.d, need: j.need, acc, pay: payS(j.pay, j.unit), st }); });
  E().ended.forEach((j) => L.push({ key: "n:" + j.id, t: j.title, co: ADM_CO, d: j.d, need: j.need || 0, acc: (j.workers || []).length, pay: payS(j.pay, j.unit), st: j.result === "cancelled" ? "cancel" : "done", reason: j.reason }));
  A().jobs.forEach((j, i) => { if (j.co !== ADM_CO) L.push(Object.assign({}, j, { key: "a:" + i })); });
  return L.sort((x, y) => y.d - x.d);
}
const aJobGet = (key) => aJobsAll().find((x) => x.key === key);
function aJobs() {
  const J = aJobsAll(), f = aF("j", "all");
  const act = (j) => j.d >= 0 && j.st !== "cancel" && j.st !== "done";
  const L = J.filter((j) => (f === "all" || (f === "act" && act(j)) || (f === "short" && j.st === "short") || (f === "past" && !act(j))) && aMatch("j", `${j.t} ${j.co}`));
  return `${aHead("Visi darbai", "Visų darbdavių darbo pasiūlymai")}
  <div class="abar2">${aSearch("j", "Darbas arba darbdavys")}${aChips("j", [["all", "Visi", J.length], ["act", "Aktyvūs", J.filter(act).length], ["short", "Trūksta žmonių", J.filter((j) => j.st === "short").length], ["past", "Pasibaigę", J.filter((j) => !act(j)).length]])}</div>
  <section class="card"><div class="atbl aj">
    <div class="atr ath"><span>Darbas</span><span>Data</span><span>Žmonių</span><span>Atlygis</span><span>Būsena</span><span></span></div>
    ${L.length ? L.map((j) => `<div class="atr"><button type="button" class="acell-nm alink" data-act="aJobOpen" data-v="${j.key}"><span><b>${up(j.t)}</b><small>${esc(j.co)}</small></span></button><span data-l="Data">${dateLabel(j.d)}</span><span data-l="Žmonių"><b>${j.acc}</b>/${j.need}</span><span data-l="Atlygis">${j.pay}</span><span>${pill(...AJ_ST[j.st])}</span><span class="aacts"><button class="btn sm" type="button" data-act="aJobChat" data-v="${j.key}">${svg("chat", 14)}Pokalbis</button>${act(j) ? `<button class="btn sm ghost" type="button" data-act="aJobDel" data-v="${j.key}" aria-label="Ištrinti darbą" title="Ištrinti darbą">${svg("x", 15, 2.2)}</button>` : ""}</span></div>`).join("") : `<p class="small muted" style="padding:14px 4px;margin:0">Nieko nerasta.</p>`}
  </div></section>`;
}

function aEmployment() {
  const P = A().placements, n = (s) => P.filter((p) => p.st === s).length;
  const st = { active: ["Dirba", "green"], pending: ["Laukia parašo", "orange"], ended: ["Pasibaigė", ""] };
  return `${aHead("Įdarbinti darbuotojai", "Ilgalaikiai įdarbinimai per platformą")}
  <div class="stats"><div class="stat"><small>Aktyviai įdarbinti</small><b>${n("active")}</b></div><div class="stat"><small>Laukiantys pasiūlymai</small><b>${n("pending")}</b></div><div class="stat"><small>Pasiūlymai šį mėnesį</small><b>3</b></div><div class="stat"><small>Pasibaigę įdarbinimai</small><b>${n("ended")}</b></div></div>
  <section class="card"><div class="atbl ap">
    <div class="atr ath"><span>Darbuotojas</span><span>Įmonė</span><span>Pozicija</span><span>Sutartis</span><span>Būsena</span></div>
    ${P.map((p) => `<div class="atr"><span class="acell-nm">${wAv(WORKERS[p.w], "sm")}<span><b>${esc(WORKERS[p.w].name)}</b><small>${p.start > 0 ? `Pradės ${dateLabel(p.start).toLowerCase()}` : `Nuo ${iso(dOff(p.start))}`}</small></span></span><span data-l="Įmonė">${esc(p.co)}</span><span data-l="Pozicija">${esc(p.pos)}</span><span data-l="Sutartis">${esc(p.contract)}</span><span>${pill(...st[p.st])}</span></div>`).join("")}
  </div></section>`;
}

const FH_ST = [["new", "Nauja"], ["sourcing", "Ieškoma"], ["presented", "Pateikti kandidatai"], ["interview", "Interviu"], ["offer", "Pasiūlymas"], ["hired", "Įdarbinti"], ["started", "Pradėjo dirbti"]];
function aForeign() {
  const F = A().foreign;
  return `${aHead("Tarptautinė atranka", "Įmonių užklausos darbuotojams iš užsienio")}
  <div class="list fhl">${F.map((f) => { const si = FH_ST.findIndex((x) => x[0] === f.st); return `<section class="card fh"><header><div><h2>${esc(f.prof)} × ${f.need}</h2><p class="small muted" style="margin:2px 0 0">${esc(f.co)} · pateikta ${ago(f.d).toLowerCase()}</p></div>${f.st === "new" ? `<button class="btn sm primary" type="button" data-act="aFhStart" data-id="${f.id}">Pradėti paiešką</button>` : `<button class="btn sm" type="button" data-act="aFhNext" data-id="${f.id}"${si >= FH_ST.length - 1 ? " disabled" : ""}>Kitas etapas</button>`}</header>
    <div class="fhsteps">${FH_ST.map(([k, t], i) => `<div class="ats${i <= si ? " on" : ""}"><i>${i <= si ? svg("check", 12, 3) : ""}</i><span>${t}</span></div>`).join("")}</div>
    <div class="fhmeta"><span>${svg("euro", 15)}${esc(f.pay)}</span><span>${svg("home", 15)}Būstas: ${esc(f.house)}</span>${f.cands ? `<span>${svg("people", 15)}${f.cands} kandidatai</span>` : ""}</div></section>`; }).join("")}</div>`;
}

function aDisputes() {
  const D = A().disputes, f = aF("d", "open"), L = D.filter((d) => f === "open" ? d.open : !d.open);
  const side = (who, says, arr, left, note, file) => `<div class="dside"><small>${who}</small><b>${says}</b><dl><div><dt>Atvyko</dt><dd>${arr}</dd></div><div><dt>Išėjo</dt><dd>${left}</dd></div></dl>${note ? `<p>„${esc(note)}“</p>` : ""}${file ? `<button type="button" class="tag doc" data-act="toast" data-msg="Tikroje svetainėje atsidarys įkeltas failas">${svg("file", 13)}${esc(file)}</button>` : ""}</div>`;
  return `${aHead("Darbo dienos ginčai", "Kai darbuotojo ir darbdavio duomenys apie darbo dieną nesutampa")}
  ${aChips("d", [["open", "Neišspręsti", D.filter((d) => d.open).length], ["closed", "Išspręsti", D.filter((d) => !d.open).length]])}
  ${L.length ? L.map((d) => `<section class="card disp"><header><div><span class="eyebrow">Ginčas · ${ago(d.d)}</span><h2>${up(d.job)}</h2><p class="small muted" style="margin:2px 0 0">${esc(WORKERS[d.w].name)} ↔ ${esc(d.co)}</p></div>${d.open ? pill("Laukia sprendimo", "orange") : pill(d.res, "green")}</header>
    <div class="dgrid">${side("Darbuotojo pareiškimas", d.wSays, d.wArr, d.wLeft, d.wNote, d.wFile)}${side("Darbdavio patvirtinimas", d.eSays, d.eArr, d.eLeft, d.eNote, "")}</div>
    ${d.open ? `<div class="row dact"><button class="btn sm" type="button" data-act="aChatWith" data-v="${esc(WORKERS[d.w].name)}">${svg("chat", 14)}Rašyti darbuotojui</button><button class="btn sm" type="button" data-act="aChatWith" data-v="${esc(d.co)}">${svg("chat", 14)}Rašyti darbdaviui</button><span class="spacer"></span><button class="btn sm primary" type="button" data-act="aResolve" data-id="${d.id}" data-v="w">Darbuotojo naudai</button><button class="btn sm primary" type="button" data-act="aResolve" data-id="${d.id}" data-v="e">Darbdavio naudai</button></div>` : d.resNote ? `<p class="small muted" style="margin:0">Sprendimas: ${esc(d.resNote)}</p>` : ""}
  </section>`).join("") : `<section class="card">${empty(f === "open" ? "Neišspręstų ginčų nėra" : "Išspręstų ginčų dar nėra", "", "shield")}</section>`}`;
}

function aBugs() {
  const B = A().bugs, f = aF("b", "active"), L = B.filter((b) => f === "all" || b.st === f);
  const st = { active: ["Aktyvi", "orange"], fixed: ["Sutvarkyta", "green"], na: ["Neaktualu", ""] };
  return `${aHead("Svetainės klaidos", "Naudotojų pranešimai per „Pranešti apie klaidą“")}
  ${aChips("b", [["active", "Aktyvios", B.filter((b) => b.st === "active").length], ["fixed", "Sutvarkytos"], ["all", "Visos", B.length]])}
  ${L.length ? L.map((b) => `<section class="card bug"><div class="bugrow">${b.img ? `<div class="bugshot real"><img src="${b.img}" alt="Ekrano nuotrauka"></div>` : b.shot ? `<div class="bugshot" aria-label="Ekrano nuotrauka"><div class="bs-bar"></div><div class="bs-l"></div><div class="bs-l s"></div><div class="bs-mark"></div></div>` : ""}<div class="bugtx"><div class="row" style="gap:8px;flex-wrap:wrap">${pill(...st[b.st])}<span class="small muted">${ago(b.d)} ${b.tm} · ${esc(b.page)} · ${esc(b.dev)}</span></div><p style="white-space:pre-line">${esc(b.t)}</p><span class="small"><b>${esc(b.who)}</b> <span class="muted">· ${b.kind}</span></span></div></div>
    <div class="row dact">${b.conv ? `<button class="btn sm" type="button" data-act="aConvGo" data-k="${b.conv}">${svg("chat", 14)}Atsakyti</button>` : `<button class="btn sm" type="button" data-act="aChatWith" data-v="${esc(b.who)}">${svg("chat", 14)}Atsakyti</button>`}<span class="spacer"></span>${b.st === "active" ? `<button class="btn sm" type="button" data-act="aBugSet" data-id="${b.id}" data-v="na">Neaktualu</button><button class="btn sm primary" type="button" data-act="aBugSet" data-id="${b.id}" data-v="fixed">${svg("check", 14, 2.6)}Sutvarkyta</button>` : `<button class="btn sm" type="button" data-act="aBugSet" data-id="${b.id}" data-v="active">Grąžinti į aktyvias</button>`}</div></section>`).join("") : `<section class="card">${empty("Klaidų pranešimų nėra", "", "check")}</section>`}`;
}

function aRatings() {
  const R = A().reviews;
  return `${aHead("Atsiliepimai", "Darbuotojų ir darbdavių atsiliepimai vienas apie kitą")}
  <section class="card"><div class="list">${R.map((r, i) => `<div class="revrow${r.flag ? " flag" : ""}"><span class="revscore">${r.r}/10</span><div class="revtx"><b>${esc(r.by)} → ${esc(r.about)}</b><p>„${esc(r.t)}“</p><small class="muted">${up(r.job)} · ${ago(r.d)}</small></div>${r.flag ? pill("Pažymėtas", "orange") : ""}<button class="btn sm" type="button" data-act="aRevDel" data-v="${i}">Pašalinti</button></div>`).join("") || empty("Atsiliepimų dar nėra", "", "star")}</div></section>`;
}

// Darbo puslapis administratoriui – toks pat kaip darbdavio / darbuotojo, tik peržiūros režimu
function aJobPage() {
  const key = S.aJobKey || "", src = key[0], id = key.slice(2), nj = src !== "w" ? aJobGet(key) : null;
  const strip = (h) => h.replace(/<(button|a)\b[^>]*data-act="(?!invTab)[^"]*"[^>]*>[\s\S]*?<\/\1>/g, "").replace(/<(button|a)\b[^>]*data-go="[^"]*"[^>]*>[\s\S]*?<\/\1>/g, "").replace(/<label\b[^>]*class="[^"]*cvup[^"]*"[\s\S]*?<\/label>/g, "").replace(/<section class="card[^"]*">\s*(<div[^>]*>\s*<\/div>\s*)*<\/section>/g, "");
  const asRole = (r, fn) => { const o = S.role; S.role = r; try { return fn(); } finally { S.role = o; } };
  let body = "", co = ADM_CO;
  if (src === "e" && E().jobs.some((x) => x.id === id)) { E().openJob = id; body = asRole("employer", eJob); }
  else if (src === "n" && E().ended.some((x) => x.id === id)) { S.endedId = id; body = asRole("employer", eEndedJob); }
  else if (src === "w") { const j = S.worker.jobs.find((x) => x.id === id); if (j) { co = j.company; S.wJobId = id; body = asRole("worker", wJob); } }
  else if (src === "a" && nj) { const j = A().jobs[+id]; co = j.co; const ppl = (j.ws || []).map((w) => WORKERS[w]).filter(Boolean);
    body = `<div class="head"><div><h1>${up(j.t)}</h1><p class="lead">${esc(j.co)}${j.city ? " · " + esc(j.city) : ""}</p></div>${pill(...AJ_ST[j.st])}</div>
    <div class="jd-grid"><div class="jd-main"><section class="card"><h2>Darbo informacija</h2><div class="kv"><div><small>Data ir laikas</small><b>${dateLabel(j.d)}${j.from ? ` · ${j.from}–${j.to}` : ""}</b></div><div><small>Adresas</small><b>${esc(j.addr || "—")}</b></div><div><small>Atlygis</small><b>${j.pay}</b></div><div><small>Pietų pertrauka</small><b>${esc(j.lunch || "—")}</b></div></div>${j.desc ? `<p style="margin:0">${esc(j.desc)}</p>` : ""}</section>
    <section class="card"><h2>Priimti darbuotojai · ${j.acc}/${j.need}</h2>${ppl.length ? `<div class="list">${ppl.map((w) => `<div class="co-line"><div class="av lt sm">${ini(w.name)}</div><div><b>${esc(w.name)}</b><small>${esc(w.city)} · patikimumas ${w.att}/100</small></div></div>`).join("")}</div>` : `<p class="small muted" style="margin:0">Dar niekas nepriėmė.</p>`}</section></div>
    <aside class="jd-side"><section class="card"><h2>Darbdavys</h2><b>${esc(j.co)}</b></section></aside></div>`; }
  if (!body) return `${aHead("Darbas", "Nerastas")}<button class="btn" type="button" data-act="aJobBack">← Visi darbai</button>`;
  const canDel = nj && nj.d >= 0 && nj.st !== "cancel" && nj.st !== "done";
  return `<div class="adm-jobbar"><button class="btn sm" type="button" data-act="aJobBack">${svg("left", 15, 2.4)}Visi darbai</button><span class="adm-jobtag">${svg("eye", 14)}Administratoriaus peržiūra · ${esc(co)}</span><span class="spacer"></span>${nj || src === "w" ? `<button class="btn sm" type="button" data-act="aJobChat" data-v="${key}">${svg("chat", 14)}Darbo pokalbis</button>` : ""}${canDel ? `<button class="btn sm danger" type="button" data-act="aJobDel" data-v="${key}">Ištrinti darbą</button>` : ""}</div><div class="ajob-ro">${strip(body)}</div>`;
}
// Darbo skelbimai (ilgalaikis darbas)
function aAds() {
  const L = E().ads.filter((a) => aMatch("ad", `${a.title} ${a.city} ${ADM_CO}`));
  return `${aHead("Darbo skelbimai", "Ilgalaikio darbo skelbimai ir kandidatai")}
  <div class="abar2">${aSearch("ad", "Skelbimas, miestas ar įmonė")}</div>
  <section class="card"><div class="atbl aa2">
    <div class="atr ath"><span>Skelbimas</span><span>Kandidatai</span><span>Peržiūros</span><span>Įsiminė</span><span>Galioja</span><span></span></div>
    ${L.length ? L.map((a) => `<div class="atr"><button type="button" class="acell-nm alink" data-act="aAdOpen" data-id="${a.id}"><span><b>${up(a.title)}</b><small>${ADM_CO} · ${esc(a.city)}</small></span></button><span data-l="Kandidatai"><b>${a.cands.length}</b></span><span data-l="Peržiūros">${a.views}</span><span data-l="Įsiminė">${(a.saves || []).length}</span><span data-l="Galioja">${a.until} d.</span><span class="aacts"><button class="btn sm" type="button" data-act="aAdOpen" data-id="${a.id}">${svg("eye", 14)}Peržiūrėti</button><button class="btn sm ghost" type="button" data-act="aAdDel" data-id="${a.id}" aria-label="Pašalinti skelbimą" title="Pašalinti skelbimą">${svg("x", 15, 2.2)}</button></span></div>`).join("") : `<p class="small muted" style="padding:14px 4px;margin:0">Skelbimų nėra.</p>`}
  </div></section>`;
}
// Administratorių komanda: administratorius ir moderatoriai
const ADM_PERMS = [
  ["disputes", "Spręsti ginčus", "shield"], ["bugs", "Tvarkyti klaidų pranešimus", "bell"], ["reviews", "Moderuoti atsiliepimus", "star"],
  ["chats", "Skaityti ir rašyti pokalbiuose", "chat"], ["verify", "Patvirtinti įmones", "check"], ["suspend", "Suspenduoti paskyras", "lock"],
  ["foreign", "Tarptautinė atranka", "nav"], ["delete", "Trinti paskyras, darbus ir failus", "x"], ["loginAs", "„Prisijungti kaip“ naudotojas", "eye"], ["plans", "Keisti įmonių planus", "card"], ["admins", "Valdyti administratorių komandą", "team"]
];
const ADM_ALL = ADM_PERMS.map((x) => x[0]), ADM_DEP = ["disputes", "bugs", "reviews", "chats", "verify", "suspend", "foreign"];
const ACT_PERM = { aDelOpen: "delete", aDelOk: "delete", aJobDel: "delete", aFileDel: "delete", aLoginAs: "loginAs", aPlan: "plans", aAdDel: "delete", admInvite: "admins", admRemove: "admins", admPreset: "admins", admPerm: "admins", admInvCancel: "admins", aResolve: "disputes", aResolveOk: "disputes", aBugSet: "bugs", aRevDel: "reviews", aSend: "chats", aChatWith: "chats", aConvsOf: "chats", aJobChat: "chats", aTeamView: "chats", aConvOpen: "chats", aConvGo: "chats", aVerify: "verify", aSuspOpen: "suspend", aSuspOk: "suspend", aUnsusp: "suspend", aFhStart: "foreign", aFhNext: "foreign" };
const VIEW_PERM = { disputes: "disputes", bugs: "bugs", ratings: "reviews", teamchats: "chats", foreign: "foreign", aadmins: "admins" };
const admMe = () => S.admAs ? A().admins.find((x) => x.id === S.admAs) : null;
const admPerms = (m) => !m || m.p == null ? ADM_ALL : m.p;
const admCan = (perm) => !perm || admPerms(admMe()).includes(perm);
const admPresetOf = (p) => p == null || ADM_ALL.every((k) => p.includes(k)) ? "admin" : ADM_DEP.length === p.length && ADM_DEP.every((k) => p.includes(k)) ? "deputy" : "custom";
const ADM_PRESET_N = { admin: "Administratorius", deputy: "Moderatorius", custom: "Pasirinktinės teisės" };
// Naudotojams vardas nerodomas – tik rolė
const admPub = () => !admMe() || admPresetOf(admMe().p) === "admin" ? "Administratorius" : "Moderatorius";
const ADM_LABELS = ["Administratorius", "Moderatorius"];
function admPermBoxes(sel, dataAttrs, disabled) {
  return `<div class="adm-perms">${ADM_PERMS.map(([k, t, ic]) => `<label class="adm-perm${sel.includes(k) ? " on" : ""}"><input type="checkbox" data-act="admPerm" ${dataAttrs} data-k="${k}"${sel.includes(k) ? " checked" : ""}${disabled ? " disabled" : ""}><span class="adm-pi">${svg(ic, 14, 2.2)}</span><span>${t}</span></label>`).join("")}</div>`;
}
function aAdmins() {
  const D = A(), invSel = S.admInvP || ADM_DEP;
  const presetSeg = (cur, attrs) => `<div class="seg sm" role="group" aria-label="Rolė">${["admin", "deputy"].map((r) => `<button type="button" data-act="admPreset" ${attrs} data-v="${r}" aria-pressed="${cur === r}">${ADM_PRESET_N[r]}</button>`).join("")}</div>`;
  return `${aHead("Administratoriai", "Kas valdo platformą ir kokias teises turi")}
  <section class="card"><header><div><h2>Komanda</h2></div><span class="pill">${D.admins.length} nariai</span></header>
    <div class="adm-list">${D.admins.map((m) => { const pr = admPresetOf(m.p), open = S.admOpen === m.id; return `<div class="adm-row"><span class="av lt sm">${m.owner ? "AD" : ini(m.n)}</span><div class="adm-tx"><b>${esc(m.n)}${m.owner ? ' <span class="muted small">(jūs)</span>' : ""}</b><small>${esc(m.e)} · nuo ${iso(dOff(m.since))}</small></div>${m.owner ? pill("Visos teisės", "green") : `${pill(ADM_PRESET_N[pr], pr === "custom" ? "orange" : "")}<button class="btn sm" type="button" data-act="admToggle" data-id="${m.id}" aria-expanded="${open}">${svg("lock", 14)}Teisės · ${admPerms(m).length}/${ADM_ALL.length}</button><button class="btn sm" type="button" data-act="admViewAs" data-id="${m.id}" title="Peržiūrėti, ką mato šis žmogus">${svg("eye", 14)}Peržiūrėti</button><button class="btn sm" type="button" data-act="admRemove" data-id="${m.id}">Pašalinti</button>`}
      ${!m.owner && open ? `<div class="adm-edit"><div class="adm-edh"><span class="small muted">Greitas pasirinkimas:</span>${presetSeg(pr, `data-id="${m.id}"`)}</div>${admPermBoxes(admPerms(m), `data-id="${m.id}"`)}</div>` : ""}</div>`; }).join("")}
    ${D.admInv.map((v) => `<div class="adm-row inv"><span class="av lt sm">${svg("mail", 14)}</span><div class="adm-tx"><b>${esc(v.n)}</b><small>${esc(v.e)} · ${ADM_PRESET_N[admPresetOf(v.p)]} (${v.p.length}/${ADM_ALL.length}) · kvietimas išsiųstas</small></div>${pill("Laukia", "orange")}<button class="btn sm" type="button" data-act="admInvCancel" data-e="${esc(v.e)}">Atšaukti</button></div>`).join("")}</div>
  </section>
  <section class="card"><header><div><h2>Pakviesti administratorių ar moderatorių</h2></div></header>
    <form class="form adm-inv" data-form="admInvite" novalidate><label class="field" for="ai-n">Vardas Pavardė<input id="ai-n" class="nmcap" placeholder="Vardas Pavardė" autocomplete="off" value="${esc(S.admInvN || "")}"></label><label class="field" for="ai-e">El. paštas<input id="ai-e" type="email" placeholder="vardas@imone.lt" autocomplete="off" value="${esc(S.admInvE || "")}"></label>
    <div class="field adm-full"><span>Teisės</span><div class="adm-edh"><span class="small muted">Greitas pasirinkimas:</span>${presetSeg(admPresetOf(invSel), 'data-id="inv"')}</div>${admPermBoxes(invSel, 'data-id="inv"')}</div>
    <p class="ferr" id="ai-err" role="alert"></p><div class="row" style="justify-content:flex-end"><button class="btn primary" type="submit">${svg("send", 15)}Siųsti kvietimą</button></div></form>
  </section>
  <p class="small muted" style="margin:0">Visi veiksmai įrašomi į veiksmų istoriją su atlikusio žmogaus vardu. Visi komandos nariai mato naudotojus, darbus ir statistiką. Naudotojams moderatoriaus vardas nerodomas – žinutės ir veiksmai matomi kaip „Moderatorius“.</p>`;
}
// Administratoriaus pokalbių centras – visi platformos pokalbiai: skaityti ir rašyti
const ADM_CO = "UAB Pavyzdinė statyba", ADM_WK = "Beata Bune";
function aXConv(i) {
  const D = A(); D.xconvs = D.xconvs || {};
  if (!D.xconvs[i]) { const j = D.jobs[i]; D.xconvs[i] = { id: "x" + i, kind: "group", name: j.t, co: j.co, msgs: [["Jonas Vadovas", "Labas rytas visiems, rytoj pradedame 7:30."], ["Tomas K.", "Gerai, būsiu."], ["Mantas P.", "Kur statyti automobilį?"], ["Jonas Vadovas", "Kieme už vartų."]].map(([w, t], k) => ({ w, t, d: "Vakar", tm: `18:${String(2 + k * 7).padStart(2, "0")}` })) }; }
  return D.xconvs[i];
}
function aAllConvs() {
  const L = [], D = A();
  const kname = { team: "Vadovybės", group: "Darbo", support: "Klaidos", private: "Privatus", mine: "Mano", arch: "Archyvas" };
  const add = (key, c, me, title, sub, kind) => L.push({ key, c, me, title, sub, kind, kl: kname[kind] });
  E().convs.forEach((c) => add("e:" + c.id, c, c.kind === "team" ? "Savininkas" : ADM_CO, c.kind === "private" ? `${ADM_CO} ↔ ${c.name}` : c.kind === "team" ? `${ADM_CO} · vadovybė` : c.kind === "support" ? `${ADM_CO} → pagalba` : up(c.name), c.kind === "group" ? ADM_CO : c.kind === "team" ? (c.parts || []).map((p) => p === "Jūs" ? "Savininkas" : p).join(", ") : c.kind === "support" ? "Pranešimas apie klaidą" : "Darbdavys ir darbuotojas", c.kind));
  S.worker.convs.forEach((c) => add("w:" + c.id, c, ADM_WK, c.kind === "private" ? `${ADM_WK} ↔ ${c.name}` : c.kind === "support" ? `${ADM_WK} → pagalba` : up(c.name), c.kind === "group" ? (c.person || "Darbo pokalbis") : c.kind === "support" ? "Pranešimas apie klaidą" : "Darbuotojas ir darbdavys", c.kind));
  Object.keys(D.xconvs || {}).forEach((i) => { const c = D.xconvs[i]; add("x:" + i, c, "", up(c.name), c.co, "group"); });
  (E().archive || []).forEach((c) => add("re:" + c.id, c, ADM_CO, up(c.name), `${ADM_CO} · darbas baigtas`, "arch"));
  (S.worker.archive || []).forEach((c) => add("rw:" + c.id, c, ADM_WK, up(c.name), `${c.person || "Darbo pokalbis"} · darbas baigtas`, "arch"));
  D.convs.forEach((c) => add("a:" + c.id, c, "Administratorius", `Administratorius ↔ ${c.name}`, "Jūsų pokalbis", "mine"));
  return L;
}
function aJobRef(cur) {
  if (!cur || (cur.kind !== "group" && cur.kind !== "arch")) return null;
  const t = (cur.c.name || cur.c.job || "").toLocaleLowerCase("lt-LT"), src = cur.key[0];
  if (src === "x") return "a:" + cur.key.slice(2);
  if (src === "w") { const j = S.worker.jobs.find((x) => x.title.toLocaleLowerCase("lt-LT") === t); if (j) return "w:" + j.id; }
  const hit = aJobsAll().find((x) => x.t.toLocaleLowerCase("lt-LT") === t);
  return hit ? hit.key : null;
}
function aJobInfoHTML(m, head) {
  const kv = (a) => `<div class="kv">${a.filter((x) => x[1] != null && x[1] !== "").map(([k, v]) => `<div><small>${k}</small><b>${v}</b></div>`).join("")}</div>`;
  const key = m.key || "", src = key[0], id = key.slice(2);
  const nj = src !== "w" ? aJobGet(key) : null;
  const acts = nj ? `<div class="row" style="justify-content:flex-end;gap:8px"><button class="btn" type="button" data-act="aJobChat" data-v="${key}">${svg("chat", 15)}Pokalbis</button>${nj.d >= 0 && nj.st !== "cancel" && nj.st !== "done" ? `<button class="btn danger" type="button" data-act="aJobDel" data-v="${key}">Ištrinti darbą</button>` : ""}</div>` : `<div class="row" style="justify-content:flex-end"><button class="btn" type="button" data-close-modal>Uždaryti</button></div>`;
  if (src === "a") { if (!nj) return head("Darbas", "Nerastas"); return head("Darbas", up(nj.t), `<span class="muted small">${esc(nj.co)}</span>`) + kv([["Data", dateLabel(nj.d)], ["Žmonių", `${nj.acc}/${nj.need}`], ["Atlygis", nj.pay], ["Būsena", AJ_ST[nj.st][0]]]) + acts; }
  const j = src === "w" ? S.worker.jobs.find((x) => x.id === id) : src === "n" ? E().ended.find((x) => x.id === id) : E().jobs.find((x) => x.id === id);
  if (!j) return head("Darbas", "Nerastas");
  const ppl = src !== "w" && j.workers ? j.workers.map((w) => (WORKERS[w[0]] || {}).name).filter(Boolean) : [];
  return head("Darbas", up(j.title), `<span class="muted small">${esc(src === "w" ? j.company : ADM_CO)}${j.city ? " · " + esc(j.city) : ""}</span>`) + kv([["Data ir laikas", `${dateLabel(j.d)}${j.from ? ` · ${j.from}–${j.to}` : ""}`], ["Adresas", j.addr ? esc(j.addr) : ""], ["Atlygis", j.pay != null && j.unit ? pay(j.pay, j.unit) : ""], ["Žmonių", j.need ? `${ppl.length}/${j.need}` : ""], ["Būsena", nj ? AJ_ST[nj.st][0] : ""], ["Atsakingas", j.resp ? esc(j.resp) : ""], ["Pietūs", j.lunch ? esc(j.lunch) : ""], ["Priežastis", j.reason ? esc(j.reason) : ""]]) + (ppl.length ? `<div class="field"><span>Darbuotojai</span><div class="row" style="gap:6px;flex-wrap:wrap">${ppl.map((n) => `<span class="pill">${esc(n)}</span>`).join("")}</div></div>` : "") + (j.desc ? `<p class="small" style="margin:0">${esc(j.desc)}</p>` : "") + acts;
}
function aConvFind(key) { return aAllConvs().find((x) => x.key === key); }
function aTeamChats() {
  const all = aAllConvs(), f = aF("cv", "all");
  const kf = (x) => f === "all" || x.kind === f;
  const L = all.filter((x) => kf(x) && aMatch("cv", `${x.title} ${x.sub} ${(x.c.msgs || []).map((m) => m.t).join(" ")}`));
  const cur = S.aConv ? aConvFind(S.aConv) : null;
  const last = (x) => { const m = (x.c.msgs || []).filter((y) => y.w !== "topic").slice(-1)[0]; return m ? `${m.w === "me" ? x.me || "Jūs" : m.w === "them" ? x.c.name : m.w}: ${m.t || (m.img ? "nuotrauka" : m.file ? "failas" : "")}` : "Žinučių dar nėra"; };
  const list = `<div class="acv-list">${L.length ? L.map((x) => `<button type="button" class="acv-it${cur && cur.key === x.key ? " on" : ""}" data-act="aConvOpen" data-k="${x.key}"><span class="cav sm">${ini(x.kind === "private" || x.kind === "mine" ? x.c.name.replace(/^(UAB|MB)\s+/, "") : x.title.replace(/^(UAB|MB)\s+/, ""))}</span><span class="acv-tx"><b>${esc(x.title)}</b><small>${esc(last(x))}</small></span><em class="acv-k k-${x.kind}">${x.kl}</em></button>`).join("") : `<p class="small muted" style="padding:14px;margin:0">Nieko nerasta.</p>`}</div>`;
  let thread = `<div class="acv-empty">${svg("chat", 28)}<p>Pasirinkite pokalbį – matysite visą istoriją ir galėsite parašyti.</p></div>`;
  if (cur) {
    const c = cur.c, who = (m) => m.w === "me" ? (cur.me || "Jūs") : m.w === "them" ? (cur.kind === "support" ? "statybos24 pagalba" : c.name) : m.w, mine = (m) => cur.kind === "mine" ? m.w === "me" : cur.kind === "support" ? m.w === "them" : ADM_LABELS.includes(m.w);
    let rows = "", lastD = null, prevW = null;
    (c.msgs || []).forEach((m, i) => {
      if (c.cut && i === c.cut) rows += `<div class="topicsep"><span>Čia naudotojas ištrynė pokalbį iš savo sąrašo</span></div>`;
      if (m.d !== lastD) { rows += `<div class="dsep">${m.d}</div>`; lastD = m.d; prevW = null; }
      if (m.w === "topic") { rows += `<div class="topicsep"><span>${esc(m.t)}</span></div>`; prevW = null; return; }
      const me = mine(m), w = who(m);
      if (w !== prevW) rows += `<div class="who-n${me ? " me" : ""}">${esc(w)}</div>`;
      rows += `<div class="mrow first last${me ? " me" : ""}"><div class="bubble${me ? " adm" : ""}">${m.t ? esc(m.t) : m.img ? "[nuotrauka]" : m.file ? `[failas: ${esc(m.file.name || "")}]` : ""}</div><span class="mtime">${m.tm || ""}</span></div>`;
      prevW = w;
    });
    thread = `<div class="acv-th"><div class="acv-head"><button type="button" class="tbtn back" data-act="aConvClose" aria-label="Atgal">${svg("back", 20, 2.4)}</button><div class="acv-ht"><b>${esc(cur.title)}</b><small>${esc(cur.sub)} · visa istorija</small></div>${(() => { const r = aJobRef(cur); return r ? `<button class="btn sm" type="button" data-act="aJobOpen" data-v="${r}">${svg("jobs", 14)}Atidaryti darbą</button>` : ""; })()}</div>
      <div class="msgs acv-msgs" id="acv-msgs">${rows || `<p class="small muted" style="margin:auto">Žinučių dar nėra.</p>`}</div>
      ${cur.kind === "arch" ? `<p class="acv-note arch">${svg("lock", 13)}Darbas baigtas – naudotojams šis pokalbis uždarytas. Matote archyvą.</p>` : `<form class="acv-send" data-form="aSend"><input id="acv-in" type="text" placeholder="Rašyti kaip ${admPub().toLowerCase()}…" autocomplete="off" aria-label="Žinutė"><button class="btn primary" type="submit">${svg("send", 16)}Siųsti</button></form>
      <p class="acv-note">${svg("shield", 13)}${cur.kind === "support" ? "Atsakymą naudotojas matys kaip „statybos24 pagalba“." : `Žinutę dalyviai matys su žyma „${admPub()}“ – be jūsų vardo.`}</p>`}</div>`;
  }
  return `${aHead("Pokalbiai", "Visi platformos pokalbiai: privatūs, darbo ir vadovybės. Galite skaityti ir rašyti.")}
  <div class="abar2">${aSearch("cv", "Ieškoti pagal vardą, įmonę ar žinutę")}${aChips("cv", [["all", "Visi", all.length], ["private", "Privatūs", all.filter((x) => x.kind === "private").length], ["group", "Darbo", all.filter((x) => x.kind === "group").length], ["team", "Vadovybės", all.filter((x) => x.kind === "team").length], ["support", "Klaidos", all.filter((x) => x.kind === "support").length], ["arch", "Archyvas", all.filter((x) => x.kind === "arch").length], ["mine", "Mano", all.filter((x) => x.kind === "mine").length]].filter((x) => x[0] === "all" || x[2]))}</div>
  <section class="card acv${cur ? " has-th" : ""}">${list}${thread}</section>`;
}

function aFiles() {
  const F = A().files;
  return `${aHead("Įkelti failai", `${F.length} failai`)}
  <div class="abar2">${aSearch("f", "Failo pavadinimas arba savininkas")}</div>
  <section class="card"><div class="atbl af">
    <div class="atr ath"><span>Failas</span><span>Savininkas</span><span>Susijęs darbas</span><span>Dydis</span><span></span></div>
    ${F.filter((x) => aMatch("f", `${x.n} ${x.who}`)).map((x) => `<div class="atr"><span class="acell-nm"><span class="objic">${svg("file", 16)}</span><span><b>${esc(x.n)}</b><small>${x.kind} · įkelta ${ago(x.d).toLowerCase()}</small></span></span><span data-l="Savininkas">${esc(x.who)}</span><span data-l="Darbas">${x.job ? esc(x.job) : "—"}</span><span data-l="Dydis">${x.size}</span><span class="aacts"><button class="btn sm" type="button" data-act="toast" data-msg="Tikroje svetainėje atsidarys failo peržiūra">${svg("eye", 14)}Peržiūrėti</button><button class="btn sm ghost" type="button" data-act="aFileDel" data-v="${F.indexOf(x)}" aria-label="Ištrinti">${svg("x", 15, 2.2)}</button></span></div>`).join("")}
  </div></section>`;
}

function aAwards() {
  const mo = ["Sausis", "Vasaris", "Kovas", "Balandis", "Gegužė", "Birželis", "Liepa", "Rugpjūtis", "Rugsėjis", "Spalis", "Lapkritis", "Gruodis"], m = (TODAY.getMonth() + 11) % 12;
  const W = [["best", "Mėnesio geriausias", "w1", "9,8/10 · 6 įvertinimai"], ["reliability", "Mėnesio patikimiausias", "w2", "100/100 patikimumas"], ["activity", "Mėnesio aktyviausias", "w7", "14 užbaigtų darbų"]];
  const C = [["best", "Mėnesio geriausia", "UAB Statybų partneris", "9,6/10 · 18 įvertinimų"], ["reliability", "Mėnesio patikimiausia", "UAB Pavyzdinė statyba", "100/100 patikimumas"], ["activity", "Mėnesio aktyviausia", "MB Pamatų meistrai", "42 užbaigti darbai"]];
  const card = (t, lab, name, stat) => `<div class="awc">${awardSVG(t, 40)}<div><small>${lab}</small><b>${esc(name)}</b><span class="muted small">${stat}</span></div></div>`;
  return `${aHead("Mėnesio geriausi", `${mo[m]} · skiriama automatiškai mėnesio 1 d. pagal statistiką`)}
  <section class="card"><header><div><h2>Darbuotojai</h2></div></header><div class="awgrid">${W.map(([t, l, id, s]) => card(t, l, WORKERS[id].name, s)).join("")}</div></section>
  <section class="card"><header><div><h2>Įmonės</h2></div></header><div class="awgrid">${C.map(([t, l, n, s]) => card(t, l, n, s)).join("")}</div></section>`;
}

function aAudit() {
  const L = A().audit;
  return `${aHead("Veiksmų istorija", "Visi administratoriaus veiksmai")}
  <section class="card"><div class="loglist">${L.map(([who, what, obj, d]) => `<div class="logrow"><span class="av lt sm">${who === "Administratorius" ? "AD" : ini(who)}</span><div><b>${esc(what)}</b>${who !== "Administratorius" ? ` <span class="logwho">· ${esc(who)}</span>` : ""} <span class="logobj">${esc(obj)}</span></div><small>${d === 0 ? "Ką tik" : ago(d)}</small></div>`).join("")}</div></section>`;
}

function aModal(m, head) {
  if (m.type === "aManage") {
    if (m.k === "w") {
      const w = WORKERS[m.id], s = wStatus(w.id);
      return head("Darbuotojas", esc(w.name), `<span class="muted small">${esc(w.city)} · registr. ${iso(dOff(A().wreg[w.id] || -30))}</span>`) + `<div class="kv"><div><small>Telefonas</small><b>+3706${(1000000 + w.name.length * 731).toString().slice(0, 7)}</b></div><div><small>Patikimumas</small><b>${w.att}/100</b></div><div><small>Įvertinimas</small><b>${w.rating ? `${String(w.rating).replace(".", ",")}/10 (${w.rc})` : "Dar neįvertintas"}</b></div><div><small>Darbų</small><b>${w.jobs}</b></div></div>
      ${s ? `<div class="alert"><div><b>${s.s === "worker" ? "Darbuotojo režimas suspenduotas" : "Paskyra suspenduota"}</b><p>${esc(s.reason)} · ${s.until ? `iki ${iso(dOff(s.d + s.until))}` : "neterminuotai"}</p></div></div>` : ""}
      <div class="mgrid"><button class="btn" type="button" data-act="aLoginAs" data-k="w" data-id="${w.id}">${svg("eye", 15)}Prisijungti kaip</button><button class="btn" type="button" data-act="aChatWith" data-v="${esc(w.name)}">${svg("chat", 15)}Rašyti žinutę</button><button class="btn" type="button" data-act="aConvsOf" data-v="${esc(w.name)}">${svg("chat", 15)}Jo pokalbiai</button><button class="btn" type="button" data-act="profileW" data-id="${w.id}">${svg("user", 15)}Profilis</button>${s ? `<button class="btn primary" type="button" data-act="aUnsusp" data-k="w" data-id="${w.id}">Nuimti suspendavimą</button>` : `<button class="btn danger" type="button" data-act="aSuspOpen" data-k="w" data-id="${w.id}">Suspenduoti</button>`}</div>
      <button type="button" class="linkbtn dangerlink" data-act="aDelOpen" data-k="w" data-id="${w.id}">Ištrinti paskyrą</button>`;
    }
    const c = coById(m.id);
    return head(c.type === "pr" ? "Privatus darbdavys" : "Įmonė", esc(c.n), `<span class="muted small">${c.type === "pr" ? "" : `Įmonės kodas ${c.code} · `}${esc(c.city)} · registr. ${iso(dOff(c.reg))}</span>`) + `<div class="kv"><div><small>Savininkas</small><b>${esc(c.owner)}</b></div><div><small>El. paštas</small><b>${esc(c.email)}</b></div><div><small>Telefonas</small><b>${esc(c.phone)}</b></div><div><small>Darbų</small><b>${c.jobs}</b></div><div><small>Komandos narių</small><b>${c.team}</b></div></div>
      ${c.st === "susp" ? `<div class="alert"><div><b>Paskyra suspenduota</b><p>${esc(c.reason)}</p></div></div>` : ""}
      <div class="field"><span>Planas</span><div class="seg" role="group" aria-label="Planas">${Object.entries(PLN).map(([k, t]) => `<button type="button" data-act="aPlan" data-id="${c.id}" data-v="${k}" aria-pressed="${c.plan === k}">${t}</button>`).join("")}</div></div>
      <div class="mgrid">${!c.ver ? `<button class="btn primary" type="button" data-act="aVerify" data-id="${c.id}">${svg("check", 15, 2.6)}Patvirtinti įmonę</button>` : ""}<button class="btn" type="button" data-act="aLoginAs" data-k="e" data-id="${c.id}">${svg("eye", 15)}Prisijungti kaip</button><button class="btn" type="button" data-act="aConvsOf" data-v="${esc(c.n)}">${svg("chat", 15)}Įmonės pokalbiai</button><button class="btn" type="button" data-act="aChatWith" data-v="${esc(c.n)}">${svg("chat", 15)}Rašyti žinutę</button>${c.st === "susp" ? `<button class="btn primary" type="button" data-act="aUnsusp" data-k="e" data-id="${c.id}">Nuimti suspendavimą</button>` : `<button class="btn danger" type="button" data-act="aSuspOpen" data-k="e" data-id="${c.id}">Suspenduoti</button>`}</div>
      <button type="button" class="linkbtn dangerlink" data-act="aDelOpen" data-k="e" data-id="${c.id}">Ištrinti paskyrą</button>`;
  }
  if (m.type === "aSusp") {
    const nm = m.k === "w" ? WORKERS[m.id].name : coById(m.id).n;
    return head("Suspendavimas", esc(nm)) + `<div class="ivm">${m.k === "w" ? `<div class="field"><span>Ką suspenduoti</span><div class="segs wide2" role="radiogroup"><label><input type="radio" name="su-what" value="worker" checked><span>Tik darbuotojo režimą</span></label><label><input type="radio" name="su-what" value="all"><span>Visą paskyrą</span></label></div></div>` : ""}
      <label class="field" for="su-len">Trukmė<select id="su-len"><option value="7">7 dienos</option><option value="14">14 dienų</option><option value="30">30 dienų</option><option value="0">Neterminuotai</option></select></label>
      <label class="field" for="su-why">Priežastis (matys naudotojas)<textarea id="su-why" placeholder="Pvz. 3 neatvykimai be priežasties per mėnesį"></textarea></label>
      <p class="small" id="su-err" style="color:var(--red);font-weight:600;margin:0" role="alert"></p>
      <div class="row" style="justify-content:flex-end"><button class="btn" type="button" data-act="aManage" data-k="${m.k}" data-id="${m.id}">Atgal</button><button class="btn danger" type="button" data-act="aSuspOk" data-k="${m.k}" data-id="${m.id}">Suspenduoti</button></div></div>`;
  }
  if (m.type === "aDel") {
    const nm = m.k === "w" ? WORKERS[m.id].name : coById(m.id).n;
    return head("Paskyros ištrynimas", esc(nm)) + `<p class="small muted" style="margin:0">Bus ištrintas profilis, darbų istorija ir failai. Atkurti negalima. Įrašykite <b style="color:var(--navy)">IŠTRINTI</b>, kad patvirtintumėte.</p><label class="field" for="del-c"><span class="sr">Patvirtinimas</span><input id="del-c" autocomplete="off"></label><p class="small" id="del-err" style="color:var(--red);font-weight:600;margin:0" role="alert"></p><div class="row" style="justify-content:flex-end"><button class="btn" type="button" data-act="aManage" data-k="${m.k}" data-id="${m.id}">Atgal</button><button class="btn danger" type="button" data-act="aDelOk" data-k="${m.k}" data-id="${m.id}">Ištrinti visam laikui</button></div>`;
  }
  if (m.type === "aResolve") {
    const d = A().disputes.find((x) => x.id === m.id);
    return head("Ginčo sprendimas", m.v === "w" ? "Darbuotojo naudai" : "Darbdavio naudai", `<span class="muted small">${up(d.job)} · ${esc(WORKERS[d.w].name)} ↔ ${esc(d.co)}</span>`) + `<label class="field" for="rs-n">Paaiškinimas abiem pusėms<textarea id="rs-n" placeholder="${m.v === "w" ? "Pvz. Darbuotojo nuotrauka patvirtina buvimą objekte 14:40." : "Pvz. Darbuotojas nepateikė įrodymų."}"></textarea></label>
      <p class="small muted" style="margin:0">${m.v === "w" ? "Darbo diena bus užskaityta pagal darbuotojo laiką, patikimumas nebus mažinamas." : "Darbo diena bus užskaityta pagal darbdavio laiką, darbuotojo patikimumas bus pakoreguotas."}</p>
      <p class="small" id="rs-err" style="color:var(--red);font-weight:600;margin:0" role="alert"></p>
      <div class="row" style="justify-content:flex-end"><button class="btn" type="button" data-close-modal>Atšaukti</button><button class="btn primary" type="button" data-act="aResolveOk" data-id="${d.id}" data-v="${m.v}">Patvirtinti sprendimą</button></div>`;
  }
  if (m.type === "aReason") {
    return head(m.title, esc(m.obj)) + `<label class="field" for="ar-n">Priežastis<textarea id="ar-n" placeholder="${m.ph}"></textarea></label><p class="small" id="ar-err" style="color:var(--red);font-weight:600;margin:0" role="alert"></p><div class="row" style="justify-content:flex-end"><button class="btn" type="button" data-close-modal>Atšaukti</button><button class="btn danger" type="button" data-act="aReasonOk">${m.btn}</button></div>`;
  }
  if (m.type === "aTeam") {
    const c = A().teamChats[m.v], T = E().convs.find((x) => x.kind === "team");
    return head("Vadovų pokalbis", esc(c.co), `<span class="muted small">Tik skaitymas · ${c.mem} nariai</span>`) + `<div class="msgs archmsgs">${(T ? T.msgs.filter((x) => x.w !== "topic") : []).map((mm) => `<div class="who-n">${esc(mm.w === "me" ? "Jonas Vadovas" : mm.w)}</div><div class="mrow first last"><div class="bubble">${esc(mm.t)}</div></div>`).join("")}</div>`;
  }
  if (m.type === "aJobInfo") return aJobInfoHTML(m, head);
  if (m.type === "aAd") { const a = E().ads.find((x) => x.id === m.id); if (!a) return head("Skelbimas", "Nerastas");
    return head("Darbo skelbimas", up(a.title), `<span class="muted small">${ADM_CO} · ${esc(a.city)}</span>`) + `<div class="kv"><div><small>Atlyginimas</small><b>${a.sal[0]}–${a.sal[1]} € / mėn.</b></div><div><small>Sutartis</small><b>${esc(a.contract)}</b></div><div><small>Grafikas</small><b>${esc(a.sched)}</b></div><div><small>Galioja</small><b>dar ${a.until} d.</b></div><div><small>Peržiūros</small><b>${a.views}</b></div><div><small>Įsiminė</small><b>${(a.saves || []).length}</b></div></div>
    <div class="field"><span>Kandidatai · ${a.cands.length}</span><div class="row" style="gap:6px;flex-wrap:wrap">${a.cands.map((c) => `<span class="pill">${esc((WORKERS[c[0]] || {}).name || "")}</span>`).join("") || '<span class="small muted">Kandidatų dar nėra</span>'}</div></div>
    <div class="row" style="justify-content:flex-end;gap:8px"><button class="btn danger" type="button" data-act="aAdDel" data-id="${a.id}">Pašalinti skelbimą</button></div>`; }
  if (m.type === "aJobChat") {
    const j = A().jobs[m.v];
    const msgs = [["Jonas Vadovas", "Labas rytas visiems, rytoj pradedame 7:30."], ["Tomas K.", "Gerai, būsiu."], ["Mantas P.", "Kur statyti automobilį?"], ["Jonas Vadovas", "Kieme už vartų."]];
    return head("Darbo pokalbis", up(j.t), `<span class="muted small">${esc(j.co)} · tik skaitymas</span>`) + `<div class="msgs archmsgs">${msgs.map(([w, t]) => `<div class="who-n">${esc(w)}</div><div class="mrow first last"><div class="bubble">${esc(t)}</div></div>`).join("")}</div>`;
  }
  return "";
}

const ADMIN_ACT = {
  aFilter(el) { S["af_" + el.dataset.k] = el.dataset.v; },
  aManage(el) { openModal({ type: "aManage", k: el.dataset.k, id: el.dataset.id }); },
  aVerify(el) { const c = coById(el.dataset.id); c.ver = true; aLog("Įmonė patvirtinta", c.n); if (S.modal) S.modal = null; toast(`${c.n} patvirtinta`); },
  aSuspOpen(el) { openModal({ type: "aSusp", k: el.dataset.k, id: el.dataset.id }); },
  aSuspOk(el) { const why = document.getElementById("su-why").value.trim(); if (why.length < 5) { document.getElementById("su-err").textContent = "Įrašykite aiškią priežastį."; return false; } const len = +document.getElementById("su-len").value, k = el.dataset.k, id = el.dataset.id;
    if (k === "w") { const what = (document.querySelector('input[name="su-what"]:checked') || {}).value || "worker"; A().wst[id] = { s: what, reason: why, until: len, d: 0 }; aLog(what === "worker" ? "Darbuotojo režimas suspenduotas" : "Paskyra suspenduota", `${WORKERS[id].name}${len ? ` · ${len} d.` : ""}`); toast(`${WORKERS[id].name} suspenduotas. Jis gaus pranešimą su priežastimi.`); }
    else { const c = coById(id); c.st = "susp"; c.reason = why; aLog("Paskyra suspenduota", `${c.n}${len ? ` · ${len} d.` : ""}`); toast(`${c.n} suspenduota. Įmonė gaus pranešimą su priežastimi.`); }
    S.modal = null; },
  aUnsusp(el) { const k = el.dataset.k, id = el.dataset.id; if (k === "w") { delete A().wst[id]; aLog("Suspendavimas panaikintas", WORKERS[id].name); } else { const c = coById(id); c.st = "ok"; aLog("Suspendavimas panaikintas", c.n); } S.modal = null; toast("Suspendavimas nuimtas"); },
  aDelOpen(el) { openModal({ type: "aDel", k: el.dataset.k, id: el.dataset.id }); },
  aDelOk(el) { if ((document.getElementById("del-c").value || "").trim().toUpperCase() !== "IŠTRINTI") { document.getElementById("del-err").textContent = "Įrašykite IŠTRINTI."; return false; } const nm = el.dataset.k === "w" ? WORKERS[el.dataset.id].name : coById(el.dataset.id).n; if (el.dataset.k === "w") (A().deleted = A().deleted || {})[el.dataset.id] = true; else coById(el.dataset.id).st = "deleted"; aLog("Paskyra ištrinta", nm); S.modal = null; toast(`Paskyra ištrinta: ${nm}`); },
  aLoginAs(el) { S.adminAs = el.dataset.k === "w" ? (WORKERS[el.dataset.id] || {}).name || "Beata Bune" : (coById(el.dataset.id) || {}).n || ADM_CO; S.adminDemo = S.adminAs !== (el.dataset.k === "w" ? "Beata Bune" : ADM_CO); S.modal = null; S.role = el.dataset.k === "w" ? "worker" : "employer"; S.view = "overview"; S.chatOpen = false; S.chatId = null; },
  aBack() { S.adminAs = null; S.role = "admin"; S.view = "overview"; S.chatOpen = false; S.chatId = null; },
  aChatWith(el) { const c = privConv(A().convs, el.dataset.v, null); ACT.chatWith({ dataset: { id: c.id } }); },
  aResolve(el) { openModal({ type: "aResolve", id: el.dataset.id, v: el.dataset.v }); },
  aResolveOk(el) { const n = document.getElementById("rs-n").value.trim(); if (n.length < 5) { document.getElementById("rs-err").textContent = "Parašykite trumpą paaiškinimą."; return false; } const d = A().disputes.find((x) => x.id === el.dataset.id); d.open = false; d.res = el.dataset.v === "w" ? "Darbuotojo naudai" : "Darbdavio naudai"; d.resNote = n; aLog("Ginčas išspręstas", `${d.job} · ${d.res.toLowerCase()}`); S.modal = null; toast("Sprendimas išsiųstas abiem pusėms"); },
  aBugSet(el) { const b = A().bugs.find((x) => x.id === el.dataset.id); b.st = el.dataset.v; if (b.st === "fixed" && b.conv) { const cv = aConvFind(b.conv); if (cv) { cv.c.msgs.push({ w: "them", t: "Ačiū už pranešimą! Klaidą sutvarkėme.", d: "Šiandien", tm: new Date().toTimeString().slice(0, 5) }); cv.c.unread = true; } } aLog(b.st === "fixed" ? "Klaida pažymėta sutvarkyta" : b.st === "na" ? "Klaida pažymėta neaktualia" : "Klaida grąžinta į aktyvias", b.page); toast(b.st === "fixed" ? `${b.who} gaus pranešimą, kad klaida sutvarkyta` : "Būsena pakeista"); },
  aRevDel(el) { const r = A().reviews[+el.dataset.v]; openModal({ type: "aReason", title: "Pašalinti atsiliepimą", obj: `${r.by} → ${r.about}`, ph: "Pvz. Įžeidžiantis turinys", btn: "Pašalinti", run: "rev", i: +el.dataset.v }); },
  aJobDel(el) { const j = aJobGet(el.dataset.v); if (!j) return false; openModal({ type: "aReason", title: "Ištrinti darbą", obj: `${j.t} · ${j.co}`, ph: "Pvz. Netinkamas turinys arba dublikatas", btn: "Ištrinti darbą", run: "job", key: el.dataset.v }); },
  aFileDel(el) { const f = A().files[+el.dataset.v]; openModal({ type: "aReason", title: "Ištrinti failą", obj: f.n, ph: "Pvz. Netinkamas turinys", btn: "Ištrinti failą", run: "file", i: +el.dataset.v }); },
  aReasonOk() { const n = document.getElementById("ar-n").value.trim(); if (n.length < 3) { document.getElementById("ar-err").textContent = "Įrašykite priežastį."; return false; } const m = S.modal, D = A();
    if (m.run === "rev") { D.reviews.splice(m.i, 1); aLog("Atsiliepimas pašalintas", n); }
    if (m.run === "job") { const key = m.key, nj = aJobGet(key);
      if (key[0] === "a") D.jobs[+key.slice(2)].st = "cancel";
      else if (key[0] === "e") { const j = E().jobs.find((x) => x.id === key.slice(2)); if (j) { dropJobChats("employer", j.title); E().jobs = E().jobs.filter((x) => x !== j); E().ended.unshift({ id: "x" + j.id, title: j.title, d: j.d, need: j.need, pay: j.pay, unit: j.unit, city: j.city, addr: j.addr, result: "cancelled", reason: `Ištrynė statybos24 administracija: ${n}` }); } }
      if (nj) aLog("Darbas ištrintas", `${nj.t} · ${n}`); }
    if (m.run === "ad") { const a = E().ads.find((x) => x.id === m.id); if (a) { E().ads = E().ads.filter((x) => x !== a); aLog("Skelbimas pašalintas", `${a.title} · ${n}`); } }
    if (m.run === "file") { const f = D.files.splice(m.i, 1)[0]; aLog("Failas ištrintas", `${f.n} · ${n}`); }
    S.modal = null; toast("Atlikta. Veiksmas įrašytas į istoriją."); },
  aTeamView(el) { const t = E().convs.find((x) => x.kind === "team"); S.modal = null; S.aConv = t ? "e:" + t.id : null; go("teamchats"); },
  admToggle(el) { S.admOpen = S.admOpen === el.dataset.id ? null : el.dataset.id; },
  admPerm(el) { const k = el.dataset.k, id = el.dataset.id;
    if (id === "inv") { const p = (S.admInvP || ADM_DEP).slice(); S.admInvP = p.includes(k) ? p.filter((x) => x !== k) : p.concat(k); S.admInvN = (document.getElementById("ai-n") || {}).value || ""; S.admInvE = (document.getElementById("ai-e") || {}).value || ""; render(true); return false; }
    const m = A().admins.find((x) => x.id === id); if (!m || m.owner) return false; const p = admPerms(m).slice(); m.p = p.includes(k) ? p.filter((x) => x !== k) : p.concat(k);
    const t = (ADM_PERMS.find((x) => x[0] === k) || [])[1]; aLog(m.p.includes(k) ? "Suteikė teisę" : "Atėmė teisę", `${m.n} · ${t}`); render(true); return false; },
  admPreset(el) { const v = el.dataset.v, p = v === "admin" ? ADM_ALL.slice() : ADM_DEP.slice();
    if (el.dataset.id === "inv") { S.admInvP = p; S.admInvN = (document.getElementById("ai-n") || {}).value || ""; S.admInvE = (document.getElementById("ai-e") || {}).value || ""; render(true); return false; }
    const m = A().admins.find((x) => x.id === el.dataset.id); if (!m || m.owner) return false; m.p = p; aLog("Pakeitė teises", `${m.n} → ${ADM_PRESET_N[v]}`); toast(`${m.n}: ${ADM_PRESET_N[v].toLowerCase()}`); },
  admRemove(el) { const D = A(), m = D.admins.find((x) => x.id === el.dataset.id); if (!m || m.owner) return false; D.admins = D.admins.filter((x) => x !== m); aLog("Pašalino iš administratorių", m.n); toast(`${m.n} pašalintas`); },
  admInvCancel(el) { A().admInv = A().admInv.filter((x) => x.e !== el.dataset.e); toast("Kvietimas atšauktas"); },
  admViewAs(el) { S.admAs = el.dataset.id; S.view = "overview"; S.modal = null; render(); window.scrollTo(0, 0); toast(`Peržiūrite kaip ${admMe().n}`); return false; },
  admViewBack() { S.admAs = null; S.view = "aadmins"; render(); window.scrollTo(0, 0); return false; },
  aJobOpen(el) { S.modal = null; S.aJobKey = el.dataset.v; S.aJobFrom = S.view === "teamchats" ? "teamchats" : "ajobs"; go("ajob"); },
  aJobBack() { S.aJobKey = null; go(S.aJobFrom || "ajobs"); },
  aPlan(el) { const c = coById(el.dataset.id); if (!c || c.plan === el.dataset.v) return false; c.plan = el.dataset.v; if (c.n === ADM_CO) S.plan = c.plan; aLog("Pakeistas planas", `${c.n} → ${PLN[c.plan]}`); toast(`${c.n}: ${PLN[c.plan]}`); },
  aAdOpen(el) { openModal({ type: "aAd", id: el.dataset.id }); },
  aAdDel(el) { const a = E().ads.find((x) => x.id === el.dataset.id); if (!a) return false; openModal({ type: "aReason", title: "Pašalinti skelbimą", obj: `${a.title} · ${ADM_CO}`, ph: "Pvz. Netinkamas turinys", btn: "Pašalinti", run: "ad", id: a.id }); },
  aConvGo(el) { S.modal = null; S.aConv = el.dataset.k; go("teamchats"); },
  aConvOpen(el) { S.aConv = el.dataset.k; render(true); const m = document.getElementById("acv-msgs"); if (m) m.scrollTop = m.scrollHeight; return false; },
  aConvClose() { S.aConv = null; render(true); return false; },
  aConvsOf(el) { S.modal = null; S.aConv = null; S.aq_cv = el.dataset.v; S.af_cv = "all"; go("teamchats"); },
  aJobChat(el) { const key = el.dataset.v, j = key[0] === "w" ? { t: "" } : aJobGet(key); if (!j) return false; const t = j.t.toLocaleLowerCase("lt-LT"); S.modal = null;
    if (key[0] === "w") { const wj = S.worker.jobs.find((x) => x.id === key.slice(2)), g = wj && S.worker.convs.find((x) => x.kind === "group" && x.name.toLocaleLowerCase("lt-LT") === wj.title.toLocaleLowerCase("lt-LT")); if (!g) { toast("Šis darbas pokalbio neturi"); return false; } S.aConv = "w:" + g.id; go("teamchats"); return; }
    if (key[0] === "a") { aXConv(+key.slice(2)); S.aConv = "x:" + key.slice(2); }
    else { const g = E().convs.find((x) => x.kind === "group" && x.name.toLocaleLowerCase("lt-LT") === t), r = (E().archive || []).find((x) => (x.name || "").toLocaleLowerCase("lt-LT") === t); S.aConv = g ? "e:" + g.id : r ? "re:" + r.id : null; if (!S.aConv) { toast("Šis darbas pokalbio neturi"); return false; } }
    go("teamchats"); },
  aFhStart(el) { const f = A().foreign.find((x) => x.id === el.dataset.id); f.st = "sourcing"; aLog("Pradėta tarptautinė paieška", `${f.prof} · ${f.co}`); toast("Paieška pradėta. Įmonė gaus pranešimą."); },
  aFhNext(el) { const f = A().foreign.find((x) => x.id === el.dataset.id), i = FH_ST.findIndex((x) => x[0] === f.st); if (i < FH_ST.length - 1) { f.st = FH_ST[i + 1][0]; aLog("Atrankos etapas pakeistas", `${f.prof} · ${FH_ST[i + 1][1]}`); } }
};
document.addEventListener("input", (e) => { const k = e.target.dataset && e.target.dataset.asearch; if (!k) return; S["aq_" + k] = e.target.value; const pos = e.target.selectionStart; render(true); const i = document.getElementById("as-" + k); if (i) { i.focus(); try { i.setSelectionRange(pos, pos); } catch (er) {} } });

/* ---------- Atvaizdavimas ---------- */
const VIEWS = {
  worker: { overview: wOverview, invites: wInvites, jobs: wJobs, history: wHistory, favco: wFavCo, ads: wAds, ad: wAd, wjob: wJob, whist: wHistJob, schedule: wSchedule, profile: wProfile },
  admin: { overview: aOverview, aworkers: aWorkers, aemployers: aEmployers, abroad: aAbroad, ajobs: aJobs, employment: aEmployment, foreign: aForeign, disputes: aDisputes, bugs: aBugs, ratings: aRatings, teamchats: aTeamChats, files: aFiles, awards: aAwards, audit: aAudit, aadmins: aAdmins, aads: aAds, ajob: aJobPage },
  employer: { overview: eOverview, new: eNew, active: eActive, job: eJob, ended: eEnded, endedJob: eEndedJob, calendar: eCalendar, favorites: eFavorites, urgent: eUrgent, eads: eAds, ead: eAd, eadnew: eAdNewPage, team: eTeam, stats: eStats, plans: ePlans, company: eCompany }
};

const root = document.getElementById("root");
const unreadAll = () => (CONVS()).filter((c) => c.unread).length;
function fitMenu() {
  const s = document.querySelector(".side:not(.drawer)"); if (!s || window.innerWidth < 900) return;
  document.body.classList.remove("mfit1", "mfit2", "mfit3", "mfit4");
  const nw = s.querySelector(".navwrap"); const over = () => (nw && nw.scrollHeight > nw.clientHeight + 1) || s.scrollHeight > s.clientHeight + 1;
  for (const c of ["mfit1", "mfit2", "mfit3", "mfit4"]) { if (!over()) break; document.body.classList.add(c); }
}
window.addEventListener("resize", () => { clearTimeout(window.__fm); window.__fm = setTimeout(fitMenu, 80); });
function render(keepScroll) {
  const y = window.scrollY;
  document.body.classList.toggle("rail", !!S.rail);
  document.body.classList.toggle("in-app", S.screen === "app");
  document.body.classList.toggle("adm-dep", S.role === "admin" && !!S.admAs);
  if (S.screen === "hire") {
    root.innerHTML = hirePage() + modalHTML() + toastHTML();
  } else if (S.screen === "public") {
    root.innerHTML = publicPage() + modalHTML() + toastHTML();
  } else {
    if (S.role === "employer") { const deny = { team: !can("team"), plans: !can("plans"), stats: !can("stats"), eads: !can("ads"), ead: !can("ads"), eadnew: !can("ads"), favorites: !can("favorites"), new: !can("create"), ended: RK() === "site", calendar: RK() === "site" }; if (deny[S.view]) S.view = "overview"; }
    if (S.role === "admin" && S.admAs && !admCan(VIEW_PERM[S.view])) S.view = "overview";
    const v = (VIEWS[S.role][S.view] || VIEWS[S.role].overview)();
    const demoCo = S.role === "employer" ? A().employers.find((c) => c.n === ADM_CO) : null, coSusp = demoCo && (demoCo.st === "susp" || demoCo.st === "deleted");
    const roleBar = coSusp && !S.adminAs ? `<div class="rolebar susp">${svg("lock", 15)}<span><b>Paskyra ${demoCo.st === "deleted" ? "ištrinta" : "suspenduota"}</b>${demoCo.reason ? ` – ${esc(demoCo.reason)}` : ""}. Kurti darbų ir kviesti darbuotojų negalima. Susisiekite su statybos24 pagalba.</span></div>` : S.adminAs ? `<div class="rolebar adm">${svg("eye", 15)}<span>Administratorius peržiūri kaip <b>${esc(S.adminAs)}</b>${S.adminDemo ? ` <em class="muted">(prototipe rodoma pavyzdinė paskyra)</em>` : ""}</span><button type="button" data-act="aBack">Grįžti į administratorių</button></div>` : S.role === "employer" && RK() !== "owner" ? `<div class="rolebar">${svg("eye", 15)}<span>Peržiūrite kaip <b>${ROLES[PK()].label}</b> (${esc(ROLES[PK()].name)})</span><button type="button" data-act="viewAs" data-v="owner">Grįžti į savininką</button></div>` : "";
    root.innerHTML = `<header class="topbar"><a href="#" data-go="overview" aria-label="statybos24.lt"><img src="${LOGO_SRC}" alt="statybos24.lt"></a><div class="row" style="gap:8px"><button type="button" class="iconbtn${unreadAll() ? " has-new" : ""}" data-act="openMessenger" aria-label="Žinutės${unreadAll() ? `, neperskaitytų: ${unreadAll()}` : ""}">${svg("chat", 20)}${unreadAll() ? `<span class="nb">${unreadAll()}</span>` : ""}</button><button type="button" class="iconbtn" data-open aria-label="Atidaryti meniu" aria-expanded="${document.body.classList.contains("open")}">${svg("more", 22).replace(I.more, '<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h10"/>')}</button></div></header>
    <div class="app"><aside class="side" aria-label="Meniu">${menuHTML(false)}</aside><main>${roleBar}<div style="display:contents" id="view">${v}</div></main></div>
    <div class="scrim" data-close></div><aside class="side drawer" aria-label="Meniu">${menuHTML(true)}</aside><nav class="tabbar" aria-label="Apatinis meniu">${tabsHTML()}</nav>${S.chatOpen ? `<div class="chatpop" role="dialog" aria-label="Žinutės">${chatView(CONVS().filter((c) => c.kind !== "team" || can("teamChat")), "Žinutės")}</div>` : ""}<button type="button" class="chatfab${S.chatOpen ? " is-open" : ""}${!S.chatOpen && unreadAll() ? " has-new" : ""}" data-act="openMessenger" aria-label="${S.chatOpen ? "Uždaryti žinutes" : "Žinutės"}" aria-expanded="${!!S.chatOpen}">${S.chatOpen ? svg("x", 24, 2.4) : svg("chat", 24, 2.2)}${!S.chatOpen && unreadAll() ? `<span class="nb">${unreadAll()}</span>` : ""}</button>${modalHTML()}${S.lightbox ? `<div class="lightbox" data-act="closeLightbox" role="dialog" aria-label="Nuotrauka"><img src="${S.lightbox}" alt="Nuotrauka"><button type="button" class="lbx" data-act="closeLightbox" aria-label="Uždaryti">${svg("x", 22, 2.4)}</button></div>` : ""}${toastHTML()}`;
  }
  if (S.screen === "app" && S.role === "admin" && S.admAs) root.querySelectorAll("[data-go],[data-act],[data-form],[data-rail]").forEach((e) => { const g = e.dataset.go || e.dataset.rail, a = e.dataset.act || e.dataset.form; if ((g && VIEW_PERM[g] && !admCan(VIEW_PERM[g])) || (a && ACT_PERM[a] && !admCan(ACT_PERM[a]))) e.style.display = "none"; });
  if (keepScroll) window.scrollTo(0, y);
  const msgs = document.getElementById("msgs"); if (msgs) msgs.scrollTop = msgs.scrollHeight;
  syncHash();
  enhanceSelects();
  lpMotion();
  fitMenu();
  if (S.modal && S._focusModal) { S._focusModal = false; const f = root.querySelector(".modal .x"); f && f.focus(); }
}

let toastMsg = "", toastT;
const toastHTML = () => toastMsg ? `<div class="toast" role="status">${esc(toastMsg)}</div>` : "";
function toast(msg) { toastMsg = msg; clearTimeout(toastT); render(true); toastT = setTimeout(() => { toastMsg = ""; const t = root.querySelector(".toast"); t && t.remove(); }, 2600); }
function go(view) { if (view !== "new" && S.editJob) { S.editJob = null; S.form = null; } if (view !== "eadnew") S.adEditId = null; S.view = view; S.hlShort = false; document.body.classList.remove("open"); render(); window.scrollTo(0, 0); }
function openModal(m) { S.modal = m; S._focusModal = true; render(true); }
function closeModal() { S.modal = null; render(true); }

/* ---------- Veiksmai ---------- */
let savedT; function flashSaved() { S.confirmedAt = Date.now(); S.justSaved = true; clearTimeout(savedT); savedT = setTimeout(() => { S.justSaved = false; const p = document.querySelector(".savepill"); if (p) { p.classList.remove("flash"); p.lastChild.textContent = "Išsaugoma automatiškai"; } }, 1800); }
function dropJobChats(role, title) {
  const n = (t) => String(t || "").toLocaleLowerCase("lt-LT");
  const box = role === "worker" ? S.worker : S.emp;
  const gone = box.convs.filter((c) => c.kind === "group" && n(c.job) === n(title)).map((c) => c.id); // privatūs ir komandos pokalbiai lieka visada
  (box.archive = box.archive || []).push(...box.convs.filter((c) => gone.includes(c.id)));
  box.convs = box.convs.filter((c) => !gone.includes(c.id));
  if (gone.includes(S.chatId)) S.chatId = null;
  return gone.length;
}
function finishIfDone(j) {
  if (j.d >= 0 || j.workers.some((w) => ["accepted", "arrived", "confirmed", "toClose", "invited"].includes(w[1]))) return false;
  E().jobs = E().jobs.filter((x) => x !== j);
  const done = j.workers.filter((w) => w[1] === "closed").map((w) => [w[0], j.lastRate || 9]);
  E().ended.unshift({ id: "x" + j.id, title: j.title, d: j.d, need: j.need, result: done.length >= j.need ? "done" : "short", workers: done, from: j.from, to: j.to, city: j.city, addr: j.addr, pay: j.pay, unit: j.unit, lunch: j.lunch, arrival: j.arrival, desc: j.desc });
  dropJobChats("employer", j.title); dropJobChats("worker", j.title);
  if (S.view === "job" && E().openJob === j.id) { S.endedId = "x" + j.id; S.view = "endedJob"; }
  return true;
}
const ACT = {
  free() { if (!S.free && S.worker.jobs.some((j) => j.state === "live" || j.state === "arrived")) { toast("Šiuo metu turite patvirtintą darbą. „Laisvas dabar“ galėsite įjungti pasibaigus suplanuotam darbo laikui."); return; } S.free = !S.free; toast(S.free ? "„Laisvas dabar“ įjungta" : "„Laisvas dabar“ išjungta"); },
  logout() { S.screen = "public"; S.modal = null; document.body.classList.remove("open"); render(); window.scrollTo(0, 0); },
  reset() { const rail = S.rail, role = S.role; S = freshState(); S.rail = rail; S.role = role; S.screen = "app"; toast("Pavyzdiniai duomenys atstatyti"); },
  enter(el) { S.role = el.dataset.v; S.screen = "app"; S.view = "overview"; S.modal = null; render(); window.scrollTo(0, 0); },
  lpFlow(el) { S.lpFlow = el.dataset.v; },
  regEt(el) { S.modal.et = el.dataset.v; },
  auth(el) { document.body.classList.remove("lpm"); S.modal = { type: "auth", v: el.dataset.v }; S._focusModal = true; render(true); },
  toast(el) { toast(el.dataset.msg); },
  copy(el) { const v = el.dataset.v; const done = () => toast(`Nukopijuota: ${v}`); try { navigator.clipboard.writeText(v).then(done, () => toast(`Pažymėkite ir nukopijuokite: ${v}`)); } catch (e) { toast(`Pažymėkite ir nukopijuokite: ${v}`); } },
  confirmSchedule() { S.scheduleConfirmed = true; S.confirmedAt = Date.now(); toast("Grafikas patvirtintas"); },
  qs(el) { S.scheduleConfirmed = true; flashSaved(); const v = el.dataset.v; const f = (document.getElementById("qs-from") || {}).value || "07:00", t = (document.getElementById("qs-to") || {}).value || "18:00"; const W = S.worker.schedule; let n = 0;
    W.forEach((d, i) => { if (d.s === "locked") return; const wd = dOff(i).getDay();
      if (v === "weekdays") { d.s = wd === 0 || wd === 6 ? "busy" : "free"; d.from = f; d.to = t; }
      else if (v === "all") { d.s = "free"; d.from = f; d.to = t; }
      else if (v === "clear") { d.s = "busy"; }
      else if (v === "repeat" && i >= 7) { const src = W[i - 7]; if (src.s === "locked") { d.s = "free"; d.from = src.from; d.to = src.to; } else { d.s = src.s; d.from = src.from; d.to = src.to; } }
      if (d.s === "free") n++; });
    render(true); },
  saveSchedule() { S.scheduleConfirmed = true; toast("Išsaugota"); },
  day(el) { const i = +el.dataset.i; const d = S.worker.schedule[i]; if (S.rep && i >= 7 && d.s !== "locked") S.rep = false; if (d.s === "locked") { const jb = S.worker.jobs.find((x) => x.d === i); toast(`Šią dieną esate įdarbintas${jb ? `: ${up(jb.title)} ${jb.from}–${jb.to}` : ""}. Laiko keisti negalima.`); return; } const qf = (document.getElementById("qs-from") || {}).value || "07:00", qt = (document.getElementById("qs-to") || {}).value || "18:00"; openModal({ type: "dayEdit", i, from: d.s === "free" ? d.from : qf, to: d.s === "free" ? d.to : qt }); },
  deDone() { const m = S.modal; const f = document.getElementById("de-from").value, t = document.getElementById("de-to").value; if (f === t) { document.getElementById("de-err").textContent = "Pradžia ir pabaiga negali sutapti."; return; } const d = S.worker.schedule[m.i]; d.s = "free"; d.from = f; d.to = t; S.scheduleConfirmed = true; S.modal = null; flashSaved(); render(true); },
  deOff() { const d = S.worker.schedule[S.modal.i]; d.s = "busy"; S.scheduleConfirmed = true; S.modal = null; flashSaved(); render(true); },
  deState() { S.scheduleConfirmed = true; flashSaved(); const m = S.modal; const d = S.worker.schedule[m.i]; m.s = m.s === "free" ? "busy" : "free"; if (m.s === "free") { m.from = m.from || "07:00"; m.to = m.to || "18:00"; d.from = m.from; d.to = m.to; } d.s = m.s; m.saved = true; render(true); },
  deSave() { const m = S.modal; const d = S.worker.schedule[m.i]; const f = (document.getElementById("de-from") || {}).value || m.from, t = (document.getElementById("de-to") || {}).value || m.to; if (m.s === "free" && f === t) { document.getElementById("de-err").textContent = "Laisvo laiko pradžia ir pabaiga negali sutapti."; return; } d.s = m.s; d.from = f; d.to = t; S.modal = null; toast(m.s === "free" ? `Išsaugota: ${f}–${t}${t < f ? " (per vidurnaktį)" : ""}` : "Diena pažymėta: nenoriu dirbti"); },
  stats() { S.statsOpen = !S.statsOpen; render(true); },
  reliability() { openModal({ type: "reliability" }); },
  details(el) { S.wJobId = el.dataset.id; S.modal = null; go("wjob"); },
  companyModal(el) { openModal({ type: "company", v: el.dataset.v }); },
  accept(el) { openModal({ type: "commit", id: el.dataset.id }); },
  commitOk(el) { const ok = document.getElementById("commit-ok"); if (!ok || !ok.checked) { ok && ok.focus(); toast("Pažymėkite, kad perskaitėte darbo aprašymą"); return; } const W = S.worker; const i = W.invites.find((x) => x.id === el.dataset.id); i.status = "accepted"; W.jobs.push({ ...i, id: "j" + i.id, state: i.d === 0 ? "live" : "waiting" }); W.jobs.sort((a, b) => a.d - b.d); W.invites = W.invites.filter((x) => x.id !== i.id); S.modal = null; if (S.view === "wjob") S.wJobId = "j" + i.id; toast("Darbas priimtas. Jį rasite skiltyje „Mano darbai“."); },
  decline(el) { const i = S.worker.invites.find((x) => x.id === el.dataset.id); i.status = "declined"; dropJobChats("worker", i.title); if (S.view === "wjob") S.view = "invites"; toast("Kvietimas atmestas"); },
  arrive(el) { const j = S.worker.jobs.find((x) => x.id === el.dataset.id); j.state = "arrived"; toast("Jūsų atvykimas sistemoje užfiksuotas"); },
  arriveHelp(el) { openModal({ type: "arriveHelp", id: el.dataset.id }); },
  worked(el) { const j = S.worker.jobs.find((x) => x.id === el.dataset.id); j.state = "workedWait"; toast("Pažymėjote, kad dirbote. Laukiama darbdavio darbo dienos uždarymo."); },
  noShow(el) { const j = S.worker.jobs.find((x) => x.id === el.dataset.id); S.worker.jobs = S.worker.jobs.filter((x) => x !== j); dropJobChats("worker", j.title); if (S.view === "wjob") S.view = "history"; S.worker.history.unshift({ id: "h" + j.id, title: j.title, company: j.company, d: j.d, from: j.from, to: j.to, result: "cancelled", reason: "Pažymėjote, kad neatvykote." }); toast("Pažymėta: neatvykau. Darbas perkeltas į istoriją."); },
  offerSend() { S.worker.offer.status = "sent"; toast("Pasirašyta darbo sutartis išsiųsta darbdaviui."); },
  offerDecline() { S.worker.offer.status = "declined"; toast("Įdarbinimo pasiūlymas atmestas."); },
  chatWith(el) { const id = el.dataset.id; S.modal = null; S.chatOpen = true; S.chatId = id; const list = CONVS(); const c = list.find((x) => x.id === id); if (c) c.unread = false; document.body.classList.remove("open"); render(true); },
  openMessenger() { S.chatOpen = !S.chatOpen; if (!S.chatOpen) S.chatId = null; document.body.classList.remove("open"); render(true); },
  closeMessenger() { S.chatOpen = false; S.chatId = null; render(true); },
  openChat(el) { const list = CONVS(); S.chatId = el.dataset.id; const c = list.find((x) => x.id === S.chatId); if (c) c.unread = false; render(true); },
  closeChat() { S.chatId = null; render(true); },
  quick(el) { sendMsg(el.dataset.v); },
  chatInfo() {
    const list = CONVS(); const c = list.find((x) => x.id === S.chatId); if (!c || c.kind === "support") return;
    if (c.kind === "team") { openModal({ type: "teamChat" }); return; }
    const norm = (t) => String(t || "").toLocaleLowerCase("lt-LT");
    if (c.kind === "group") {
      if (S.role === "worker") { const j = S.worker.jobs.find((x) => norm(x.title) === norm(c.job)) || S.worker.invites.find((x) => norm(x.title) === norm(c.job)); if (!j) { toast("Darbas nerastas"); return; } if (window.matchMedia("(max-width:899px)").matches) { S.chatOpen = false; } S.wJobId = j.id; S.view = "wjob"; render(); window.scrollTo(0, 0); }
      else { const j = E().jobs.find((x) => norm(x.title) === norm(c.job)); if (!j) { toast("Darbas nerastas"); return; } if (window.matchMedia("(max-width:899px)").matches) { S.chatOpen = false; } E().openJob = j.id; S.view = "job"; render(); window.scrollTo(0, 0); }
      return;
    }
    if (S.role === "worker") { openModal({ type: "company", v: c.name }); return; }
    const w = Object.values(WORKERS).find((x) => x.name === c.name); if (w) openModal({ type: "workerProfile", id: w.id });
  },
  openHist(el) { S.histId = el.dataset.id; go("whist"); },
  pdfChat(el) { openModal({ type: "pdf", id: el.dataset.id, job: el.dataset.job }); },
  archChat(el) { openModal({ type: "archChat", id: el.dataset.id }); },
  favCo(el) { const n = el.dataset.v, L = S.worker.favCo = S.worker.favCo || []; const k = L.indexOf(n); if (k >= 0) L.splice(k, 1); else L.push(n); toast(k >= 0 ? "Pašalinta iš mėgstamų įmonių" : "Pridėta prie mėgstamų įmonių. Jų kvietimai bus rodomi pirmiausia."); },
  freeFavTgl() { if (busyJob()) { toast(`Dabar dirbate iki ${busyJob().to}. Nustatymą galėsite keisti pasibaigus darbui.`); return; } S.freeFav = !S.freeFav; toast(S.freeFav ? "Numerį „Laisvas dabar“ metu matys tik mėgstamos įmonės" : "Numerį „Laisvas dabar“ metu matys visos įmonės"); },
  openAd(el) { S.adId = el.dataset.id; go("ad"); },
  lpMenu(el) { const o = document.body.classList.toggle("lpm"); el.setAttribute("aria-expanded", o); return false; },
  lpTop() { document.body.classList.remove("lpm"); window.scrollTo({ top: 0, behavior: LP_RM ? "auto" : "smooth" }); return false; },
  chatDel() { if (!S.chatId) return false; openModal({ type: "chatDel", id: S.chatId }); },
  chatDelOk(el) { const c = CONVS().find((x) => x.id === el.dataset.id); if (c) { c.cut = c.msgs.length; c.unread = false; } S.chatId = null; S.modal = null; toast("Pokalbis ištrintas"); },
  lpApp() { openModal({ type: "lpApp" }); },
  lpPlay(el) { const v = document.getElementById("lp-video"); if (!v) return false; v.controls = true; el.closest(".lp-vbox").classList.add("on"); v.play().catch(() => {}); return false; },
  lpFs() { lpFull(); return false; },
  lpFsX() { lpFullExit(); return false; },
  openEAd(el) { S.eAdId = el.dataset.id; S.candF = "all"; const a = E().ads.find((x) => x.id === S.eAdId); go("ead"); },
  adTab(el) { S.adTab = el.dataset.v; },
  adCity(el) { S.adCity = el.dataset.v; },
  adSave(el) { const a = S.ads.find((x) => x.id === el.dataset.id); if (!a) return; a.saved = !a.saved; toast(a.saved ? "Įsiminta. Įmonė matys, kad jus domina šis skelbimas." : "Pašalinta iš įsimintų"); },
  candF(el) { S.candF = el.dataset.v; },
  adApply(el) { openModal({ type: "adApply", id: el.dataset.id }); },
  adSend(el) { const a = S.ads.find((x) => x.id === el.dataset.id); a.status = "sent"; a.applied = 0; S.modal = null; toast("Kandidatūra išsiųsta. Kai įmonė peržiūrės, gausite pranešimą."); },
  adWithdraw(el) { const a = S.ads.find((x) => x.id === el.dataset.id); a.status = null; toast("Kandidatūra atšaukta"); },
  candSet(el) { const a = E().ads.find((x) => x.id === el.dataset.ad); const c = a.cands.find((x) => x[0] === el.dataset.id); c[1] = el.dataset.v; toast(el.dataset.v === "interview" ? `${WORKERS[c[0]].name} pakviestas pokalbiui. Galite jam parašyti.` : "Kandidatas atmestas. Jis gaus mandagų pranešimą."); },
  eAdNew() { S.adEditId = null; go("eadnew"); },
  eAdSave() { const t = (document.getElementById("na-t").value || "").trim(), s1 = +document.getElementById("na-s1").value, s2 = +document.getElementById("na-s2").value || s1; if (!t || !s1) { toast("Įveskite pareigas ir atlyginimą"); return false; } const lines = (id) => ((document.getElementById(id) || {}).value || "").split("\n").map((x) => x.trim()).filter(Boolean);
    if (S.adEditId) { const a = E().ads.find((x) => x.id === S.adEditId); Object.assign(a, { title: t, city: document.getElementById("na-c").value, sal: [s1, Math.max(s1, s2)], contract: document.getElementById("na-k").value, start: document.getElementById("na-st").value, gross: (document.querySelector('input[name="na-g2"]:checked') || {}).value === "gross", sched: document.getElementById("na-g").value || "Pagal susitarimą", desc: document.getElementById("na-d").value, req: lines("na-r"), offer: lines("na-o") }); LOG("redagavo skelbimą", t); S.adEditId = null; S.eAdId = a.id; go("ead"); toast("Skelbimas atnaujintas"); return; }
    E().ads.unshift({ id: "ea" + Date.now(), title: t, city: document.getElementById("na-c").value, sal: [s1, Math.max(s1, s2)], contract: document.getElementById("na-k").value, start: (document.getElementById("na-st") || {}).value || "", gross: (document.querySelector('input[name="na-g2"]:checked') || {}).value === "gross", sched: document.getElementById("na-g").value || "Pagal susitarimą", until: 30, views: 0, cands: [], by: ME() }); LOG("paskelbė skelbimą", t); go("eads"); toast("Skelbimas paskelbtas 30 dienų"); },
  docAdd() { openModal({ type: "docAdd" }); },
  docSave() { const t = document.getElementById("dc-type").value, u = document.getElementById("dc-until").value, f = document.getElementById("dc-file"); const days = Math.round((new Date(u) - TODAY) / 864e5); S.worker.docs.push({ id: "d" + Date.now(), type: t, until: isFinite(days) ? days : 365, show: true, file: f && f.files && f.files[0] ? f.files[0].name : "dokumentas.pdf" }); S.modal = null; toast("Dokumentas pridėtas. Darbdaviai jį matys jūsų profilyje."); },
  docVis(el) { const d = S.worker.docs.find((x) => x.id === el.dataset.id); d.show = !d.show; toast(d.show ? "Dokumentas matomas darbdaviams" : "Dokumentas paslėptas nuo darbdavių"); },
  docDel(el) { S.worker.docs = S.worker.docs.filter((x) => x.id !== el.dataset.id); toast("Dokumentas ištrintas"); },
  scrollQ() { const q = document.getElementById("queue"); if (q) q.scrollIntoView({ behavior: "smooth", block: "start" }); },
  urgCity(el) { S.urgentCity = el.dataset.v; },
  handover(el) { openModal({ type: "handover", id: el.dataset.id }); },
  handoverOk(el) { const p = document.querySelector('input[name="ho"]:checked'); if (!p) { document.getElementById("ho-err").textContent = "Pasirinkite, kam perduoti darbą."; return false; } const j = E().jobs.find((x) => x.id === el.dataset.id); j.resp = p.value; LOG(`perdavė darbą ${p.value === "Jūs" ? "sau" : p.value}`, j.title); S.modal = null; toast(p.value === "Jūs" ? "Darbą perėmėte jūs" : `Darbas perduotas: ${p.value}. Jis gaus pranešimą.`); },
  heroNav(el) { S.heroI = (S.heroI || 0) + +el.dataset.v; },
  heroGo(el) { S.heroI = +el.dataset.v; },
  jobChat(el) { const j = E().jobs.find((x) => x.id === el.dataset.id); let c = E().convs.find((x) => x.kind === "group" && x.job.toLowerCase() === j.title.toLowerCase()); if (!c) { c = { id: "ecg" + j.id, kind: "group", name: j.title, person: "Darbo pokalbis", parts: ["Jūs", ...j.workers.filter((w) => ["accepted", "arrived", "confirmed", "toClose", "closed"].includes(w[1])).map((w) => WORKERS[w[0]].name)], online: false, job: j.title, unread: false, msgs: [] }; E().convs.unshift(c); } ACT.chatWith({ dataset: { id: c.id } }); },
  wChat(el) { const j = E().jobs.find((x) => x.id === el.dataset.job), w = WORKERS[el.dataset.id]; ACT.chatWith({ dataset: { id: privConv(E().convs, w.name, j.title, "Darbas").id } }); },
  jobChatW(el) { const W = S.worker, j = W.jobs.find((x) => x.id === el.dataset.id); let c = W.convs.find((x) => x.kind === "group" && x.job.toLowerCase() === j.title.toLowerCase()); if (!c) { c = { id: "cg" + j.id, kind: "group", name: j.title, person: j.company, parts: [j.company, "Jūs"], online: false, job: j.title, unread: false, msgs: [] }; W.convs.unshift(c); } ACT.chatWith({ dataset: { id: c.id } }); },
  coChat(el) { const i = S.worker.invites.find((x) => x.id === el.dataset.id); ACT.chatWith({ dataset: { id: privConv(S.worker.convs, i.company, i.title, "Kvietimas").id } }); },
  docView(el) { openModal({ type: "docView", w: el.dataset.w, v: el.dataset.v }); },
  goShort() { S.jobScope = "all"; go("active"); S.hlShort = true; render(); const f = root.querySelector(".job.shorthl"); if (f) f.scrollIntoView({ block: "center" }); },
  cvReq(el) { const a = E().ads.find((x) => x.id === el.dataset.ad), c = a.cands.find((x) => x[0] === el.dataset.id); c[5] = "req"; toast(`${WORKERS[c[0]].name} gavo prašymą įkelti CV`); },
  cvDemo(el) { const a = E().ads.find((x) => x.id === el.dataset.ad), c = a.cands.find((x) => x[0] === el.dataset.id); c[5] = "got"; },
  regGo(el) { if (el.dataset.v === "employer" && S.modal && S.modal.et !== "pr") { const c = document.getElementById("r-code"), er = c.parentElement.querySelector(".ferr"), v = c.value.trim(); const msg = !/^\d{9}$/.test(v) ? "Įmonės kodas – 9 skaitmenys" : v === "300000000" ? "Ši įmonė jau užregistruota. Paprašykite savininko pakviesti jus į komandą." : ""; er.textContent = msg; c.classList.toggle("bad", !!msg); if (msg) return false; }
    if (el.dataset.v === "worker" || (S.modal && S.modal.et === "pr")) { const fn = document.getElementById("r-fn"), ln = document.getElementById("r-ln"); let bad = false;
      [[fn, "vardą"], [ln, "pavardę"]].forEach(([i, t]) => { const v = capName(i.value.trim()); i.value = v; const er = i.parentElement.querySelector(".ferr"); const msg = nameErr(v, t, i === fn ? ln.value : fn.value); if (er) er.textContent = msg; i.classList.toggle("bad", !!msg); if (msg) bad = true; });
      if (bad) return false; }
    ACT.enter(el); },
  tcToggle(el) { const c = E().convs.find((x) => x.kind === "team"), n = el.dataset.v, inn = c.parts.includes(n); c.parts = inn ? c.parts.filter((x) => x !== n) : c.parts.concat(n); c.joined = c.joined || {}; if (inn) delete c.joined[n]; else c.joined[n] = c.msgs.length; c.msgs.push({ w: "topic", t: inn ? `${n} pašalintas iš pokalbio` : `${n} pridėtas į pokalbį`, d: "Šiandien" }); toast(inn ? `${n} nebematys vadovų pokalbio` : `${n} pridėtas – matys žinutes nuo dabar`); },
  tplUse(el) { const t = E().templates[+el.dataset.v], o = E().objects.find((x) => x.n === t.obj) || {}; S.form = { ...(S.form || {}), title: t.title, people: t.people, from: t.from, to: t.to, lunch: t.lunch, lf: t.lf, lt: t.lt, payAmount: t.payAmount, desc: t.desc, obj: t.obj || "", city: o.city || (S.form || {}).city || "Vilnius", addr: o.addr || "", arrival: o.arrival || "Darbuotojas atvyksta pats" }; S.payUnit = t.unit; toast(`Užpildyta pagal šabloną „${t.n}“ – pasirinkite datą`); },
  tplSave() { const f = S.form || {}; if (!(f.title || "").trim()) { toast("Pirma įrašykite darbo pavadinimą"); return false; } E().templates.push({ n: f.title.trim(), title: f.title.trim(), people: f.people, obj: f.obj || "", from: f.from, to: f.to, lunch: f.lunch, lf: f.lf, lt: f.lt, payAmount: f.payAmount, unit: S.payUnit, desc: f.desc }); toast(`Šablonas „${f.title.trim()}“ išsaugotas`); },
  jobEdit(el) { const j = E().jobs.find((x) => x.id === el.dataset.id), lu = /(\d\d:\d\d)–(\d\d:\d\d)/.exec(j.lunch || ""); S.form = { title: j.title, resp: j.resp, site: j.site || "", people: String(j.need), city: j.city, addr: j.addr, date: iso(dOff(j.d)), from: j.from, to: j.to, lunch: !!lu, lf: lu ? lu[1] : "12:00", lt: lu ? lu[2] : "12:30", payAmount: String(j.pay), arrival: j.arrival, desc: j.desc, agree: true, auto: j.auto !== false, obj: "" }; S.payUnit = j.unit; S.payGross = !!j.gross; S.editJob = j.id; go("new"); },
  jobEditCancel() { const id = S.editJob; S.editJob = null; S.form = null; E().openJob = id; go("job"); },
  adEdit(el) { S.adEditId = el.dataset.id; go("eadnew"); setTimeout(() => { const i = document.getElementById("na-t"); if (i) i.dispatchEvent(new Event("input", { bubbles: true })); }, 30); },
  adEditCancel() { const id = S.adEditId; S.adEditId = null; if (id) { S.eAdId = id; go("ead"); } else go("eads"); },
  adExt(el) { openModal({ type: "adExt", id: el.dataset.id }); },
  adExtOk(el) { const a = E().ads.find((x) => x.id === el.dataset.id); a.until += 30; LOG("pratęsė skelbimą", a.title); S.modal = null; toast(`Skelbimas pratęstas – galioja dar ${a.until} d.`); },
  tplRen(el) { S.modal.ren = +el.dataset.v; render(true); setTimeout(() => { const i = document.getElementById("tpl-ren"); if (i) { i.focus(); i.select(); } }, 20); return false; },
  tplRenOk(el) { const v = (document.getElementById("tpl-ren").value || "").trim(); if (!v) return false; E().templates[+el.dataset.v].n = v; S.modal.ren = null; toast("Šablonas pervadintas"); },
  phOpen(el) { openModal({ type: "phone", key: el.dataset.v, step: 1 }); },
  phSend() { const v = (document.getElementById("ph-new").value || "").replace(/\s/g, ""), err = document.getElementById("ph-err"); if (!/^\+3706\d{7}$/.test(v)) { err.textContent = "Įveskite numerį formatu +3706XXXXXXX."; return false; } if (v === PHONES[S.modal.key]) { err.textContent = "Tai jūsų dabartinis numeris."; return false; } S.modal.num = v; S.modal.step = 2; },
  phVerify() { const c = (document.getElementById("ph-code").value || "").trim(), err = document.getElementById("ph-err"); if (!/^\d{6}$/.test(c)) { err.textContent = "Įveskite 6 skaitmenų kodą iš SMS."; return false; } PHONES[S.modal.key] = S.modal.num; S.modal = null; toast("Naujas telefono numeris patvirtintas"); },
  phBack() { S.modal.step = 1; },
  tplAll() { openModal({ type: "tplAll" }); },
  tplDel(el) { const t = E().templates.splice(+el.dataset.v, 1)[0]; toast(`Šablonas „${t.n}“ ištrintas`); },
  tplPick(el) { S.modal = null; ACT.tplUse(el); },
  objAdd() { openModal({ type: "objEdit" }); },
  objSave() { const g = (id) => document.getElementById(id).value.trim(), n = g("o-n"), a = g("o-a"); if (!n || !a) { document.getElementById("o-err").textContent = "Įrašykite pavadinimą ir adresą."; return false; } E().objects.push({ n, addr: a, city: g("o-c") || "Vilnius", arrival: document.getElementById("o-arr").value, note: g("o-note") }); S.modal = null; toast(`Objektas „${n}“ išsaugotas`); },
  objDel(el) { E().objects.splice(+el.dataset.v, 1); toast("Objektas pašalintas"); },
  repOpen() { openModal({ type: "monthRep" }); },
  autoOff(el) { const j = E().jobs.find((x) => x.id === el.dataset.id); j.auto = false; LOG("išjungė automatinį kvietimą", j.title); toast("Automatinis kvietimas išjungtas šiam darbui"); },
  pwOpen() { openModal({ type: "pw" }); },
  pwEye(el) { const i = document.getElementById(el.dataset.v); if (i) i.type = i.type === "password" ? "text" : "password"; return false; },
  pwSave() { const g = (id) => document.getElementById(id).value, o = g("pw-old"), n = g("pw-new"), r = g("pw-rep"), err = document.getElementById("pw-err");
    if (!o) { err.textContent = "Įveskite dabartinį slaptažodį."; return false; }
    if (n.length < 8 || !/\d/.test(n) || !/[A-ZĄČĘĖĮŠŲŪŽ]/.test(n)) { err.textContent = "Naujas slaptažodis neatitinka reikalavimų."; return false; }
    if (n === o) { err.textContent = "Naujas slaptažodis turi skirtis nuo dabartinio."; return false; }
    if (n !== r) { err.textContent = "Slaptažodžiai nesutampa."; return false; }
    S.modal = null; toast("Slaptažodis pakeistas. Kituose įrenginiuose reikės prisijungti iš naujo."); },
  ivOpen(el) { openModal({ type: "interview", ad: el.dataset.ad, id: el.dataset.id }); },
  ivSend(el) { const a = E().ads.find((x) => x.id === el.dataset.ad), c = a.cands.find((x) => x[0] === el.dataset.id), w = WORKERS[c[0]];
    const how = (document.querySelector('input[name="iv-how"]:checked') || {}).value || "live", dv = document.getElementById("iv-d").value, t = document.getElementById("iv-t").value, addr = document.getElementById("iv-a").value.trim(), msg = document.getElementById("iv-m").value.trim(), err = document.getElementById("iv-err");
    if (!dv) { err.textContent = "Pasirinkite datą."; return false; } if (how === "live" && !addr) { err.textContent = "Įrašykite adresą."; return false; }
    const d = Math.round((new Date(dv) - new Date(iso(dOff(0)))) / 864e5); if (d < 0) { err.textContent = "Data negali būti praeityje."; return false; }
    const again = !!c[4]; c[1] = "interview"; c[4] = { how, d, t, addr, ok: false };
    const cv = privConv(E().convs, w.name, a.title, "Skelbimas");
    cv.msgs.push({ w: "me", d: "Šiandien", t: `${again ? "Pakeitėme pokalbio laiką" : "Kviečiame į pokalbį"}: ${dv} ${t}, ${how === "live" ? addr : "telefonu"}.${msg ? " " + msg : ""}`, tm: new Date().toTimeString().slice(0, 5) });
    S.modal = null; toast(`${w.name} gavo ${again ? "naują laiką" : "kvietimą"}. Patvirtinimą matysite čia.`); },
  adNudge(el) { const a = E().ads.find((x) => x.id === el.dataset.ad); a.nudged = (a.nudged || []).concat(el.dataset.id); toast(`${WORKERS[el.dataset.id].name} gavo pranešimą su kvietimu kandidatuoti`); },
  ivOk(el) { const a = S.ads.find((x) => x.id === el.dataset.id); a.iv.ok = true; toast("Pokalbis patvirtintas. Priminsime dieną prieš."); },
  adChat(el) { const a = E().ads.find((x) => x.id === el.dataset.ad), w = WORKERS[el.dataset.id]; ACT.chatWith({ dataset: { id: privConv(E().convs, w.name, a.title, "Skelbimas").id } }); },
  reportBug() { const list = CONVS(); let c = list.find((x) => x.kind === "support"); if (!c) { c = { id: "sup", kind: "support", name: "statybos24.lt pagalba", person: "Administratorius", online: true, job: "", unread: false, msgs: [{ w: "them", t: "Sveiki! Aprašykite, kas neveikia. Galite pažymėti klaidą ekrane – paspauskite ženkliuką kairėje apačioje.", d: "Šiandien", tm: new Date().toTimeString().slice(0, 5) }] }; list.unshift(c); } ACT.chatWith({ dataset: { id: c.id } }); },
  pendClear() { S.pendImg = null; },
  bugShot() { startBugShot(); },
  invTab(el) { S.invTab = el.dataset.v; },
  siteEdit(el) { openModal({ type: "siteEdit", id: el.dataset.id }); },
  siteOk(el) { const j = E().jobs.find((x) => x.id === el.dataset.id); const p = document.querySelector('input[name="se"]:checked'); j.site = p ? p.value : ""; S.modal = null; toast(j.site ? `${j.site} pasitiks darbuotojus objekte ir gaus pranešimą` : "Atvykimus tvirtins atsakingas"); },
  jobWho(el) { S.jobWho = el.dataset.v; },
  inviteAll(el) { const j = E().jobs.find((x) => x.id === el.dataset.id); const used = new Set(j.workers.map((w) => w[0])); const L = Object.values(WORKERS).filter((w) => !used.has(w.id) && w.city === j.city).slice(0, 4); L.forEach((w) => j.workers.push([w.id, "invited"])); toast(`Pakviesta: ${L.length}. Vietas užims pirmieji priėmę.`); },
  viewAs(el) { const want = { owner: "Savininkas", manager: "Vadovas", recruiter: "Vadybininkas", site: "Objekto vadovas" }[el.dataset.v]; const pk = el.dataset.v === "owner" ? "owner" : Object.keys(ROLES).find((k) => k !== "owner" && ROLES[k].label === want); if (!pk) { toast(`Komandoje nėra nario su role „${want}“`); return; } S.empRole = pk; el = { dataset: { v: pk } }; S.view = el.dataset.v === "owner" ? "team" : "overview"; S.jobScope = "all"; S.chatOpen = false; window.scrollTo(0, 0); },
  memberEdit(el) { openModal({ type: "memberEdit", v: el.dataset.v }); },
  meRole(el) { S.modal.role = el.dataset.v; S.modal.ov = {}; },
  mePerm(el) { const m = S.modal, t = E().team.find((x) => x[0] === m.v); m.ov = m.ov || { ...(t[3] || {}) }; const cur = el.getAttribute("aria-checked") === "true"; m.ov[el.dataset.v] = cur ? 0 : 1; },
  meSave() { const m = S.modal, t = E().team.find((x) => x[0] === m.v); if (m.role) { t[1] = m.role; const k = Object.keys(ROLES).find((x) => ROLES[x].name === t[0]); if (k) ROLES[k].label = m.role; } if (m.ov) t[3] = m.ov; LOG("pakeitė teises", `${t[0]} → ${t[1]}`); S.modal = null; toast(`${t[0]} teisės išsaugotos`); },
  stPlan(el) { S.plan = el.dataset.v; const need = { m3: "business", m6: "business", m12: "pro", cust: "pro" }[S.stPer]; if (need && !hasPlan(need)) S.stPer = "m1"; if ((S.stOpen === "fill" || S.stOpen === "spend") && !hasPlan("business")) S.stOpen = null; },
  stPer(el) { S.stPer = el.dataset.v; },
  goStat(el) { const k = el.dataset.v; S.stOpen = (k === "fill" && !hasPlan("business")) ? null : k; go("stats"); const d = root.querySelector(".ovdet"); if (d) setTimeout(() => d.scrollIntoView({ behavior: "smooth", block: "start" }), 30); },
  stMoney(el) { S.stMoney = el.dataset.v; },
  stCust() { const f = document.getElementById("st-from").value, t = document.getElementById("st-to").value; if (!f || !t || f > t) { toast("Patikrinkite datas: „Nuo“ turi būti ne vėliau nei „Iki“"); return; } S.stFrom = f; S.stTo = t; toast(`Rodoma ${f} – ${t}`); },
  stOpen(el) { S.stOpen = S.stOpen === el.dataset.v ? null : el.dataset.v; },
  wDirect(el) { const w = WORKERS[el.dataset.id]; ACT.chatWith({ dataset: { id: privConv(E().convs, w.name, null).id } }); },
  earnPdf() { openModal({ type: "earnPdf" }); },
  notifPrev() { openModal({ type: "notifPrev" }); },
  remTgl(el) { const k = el.dataset.v; S[k] = S[k] === false; toast(S[k] ? "Priminimas įjungtas" : "Priminimas išjungtas"); },
  repTgl() { S.rep = !S.rep; if (S.rep) mirrorWeek(); toast(S.rep ? "Grafikas kartojamas kas savaitę" : "Kartojimas išjungtas"); },
  lightbox(el) { S.lightbox = el.dataset.src === "pend" ? S.pendImg : el.dataset.src; render(true); },
  closeLightbox() { S.lightbox = null; render(true); },
  pushTgl() { S.push = !S.push; toast(S.push ? "Pranešimai telefone įjungti" : "Pranešimai telefone išjungti"); },
  profSave() { const b = document.getElementById("savebar"); if (b) b.hidden = true; const h = document.getElementById("prof-save"); if (h) { h.classList.add("done"); h.querySelector("span").textContent = "Išsaugota"; clearTimeout(window.__svT); window.__svT = setTimeout(() => { const x = document.getElementById("prof-save"); if (x) { x.classList.remove("done"); x.querySelector("span").textContent = "Išsaugoti"; } }, 2200); } root.querySelectorAll(".toast").forEach((t) => t.remove()); const t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); t.textContent = S.view === "company" ? "Įmonės profilis išsaugotas" : "Profilis išsaugotas"; root.appendChild(t); setTimeout(() => t.remove(), 2600); },
  profUndo() { render(true); toast("Pakeitimai atšaukti"); },
  locTgl() { S.loc = !S.loc; toast(S.loc ? "Lokacija įjungta" : "Lokacija išjungta"); },
  mailTgl() { S.mailN = S.mailN === false; toast(S.mailN ? "El. pašto pranešimai įjungti" : "El. pašto pranešimai išjungti"); },
  abroad(el) { S.abroad = el.dataset.v === "1"; if (!S.abroad) S.abroadC = []; render(true); },
  abroadC(el) { const c = el.dataset.v, L = S.abroadC || []; S.abroadC = L.includes(c) ? L.filter((x) => x !== c) : L.concat(c); render(true); },
  ovOpen(el) { S.ovOpen = S.ovOpen === el.dataset.v ? null : el.dataset.v; render(true); if (S.ovOpen) requestAnimationFrame(() => { const d = document.querySelector(".ovdet"); d && d.scrollIntoView({ behavior: "smooth", block: "nearest" }); }); },
  page(el) { S.pages = S.pages || {}; S.pages[el.dataset.k] = +el.dataset.v; render(true); const l = document.getElementById("pl-" + el.dataset.k); if (l) { const t = l.getBoundingClientRect().top + window.scrollY - 90; if (window.scrollY > t) window.scrollTo({ top: Math.max(0, t), behavior: "smooth" }); } },
  chatFilter(el) { S.chatFilter = el.dataset.v; render(true); },
  /* darbdavys */
  openJob(el) { E().openJob = el.dataset.id; const j = E().jobs.find((x) => x.id === el.dataset.id); if (j) j.unread = 0; go("job"); },
  jobInfo(el) { openModal({ type: "jobInfo", id: el.dataset.id }); },
  scope(el) { S.jobScope = el.dataset.v; render(true); },
  profileW(el) { openModal({ type: "workerProfile", id: el.dataset.id }); },
  invite(el) { const j = E().jobs.find((x) => x.id === el.dataset.job); j.workers.push([el.dataset.id, "invited"]); toast("Kvietimas darbuotojui išsiųstas."); },
  inviteFavs(el) { const j = E().jobs.find((x) => x.id === el.dataset.id); const used = new Set(j.workers.map((w) => w[0])); const f = E().favorites.map((x) => x[0]).filter((id) => !used.has(id) && id !== "w7"); if (!f.length) { toast("Visi tinkami mėgstami darbuotojai jau pakviesti."); return; } f.forEach((id) => j.workers.push([id, "invited"])); toast(`Pakviesta mėgstamų darbuotojų: ${f.length}`); },
  confirmArr(el) { const j = E().jobs.find((x) => x.id === el.dataset.job); const w = j.workers.find((x) => x[0] === el.dataset.id); w[1] = "confirmed"; toast("Atvykimas patvirtintas"); },
  closeDay(el) { openModal({ type: "closeDay", job: el.dataset.job, id: el.dataset.id, res: "full", rate: null }); },
  cdRes(el) { S.modal.res = el.dataset.v; render(true); },
  cdRate(el) { S.modal.rate = +el.dataset.v; render(true); },
  closeAll(el) { const jj = E().jobs.find((x) => x.id === el.dataset.id); openModal({ type: "closeAll", id: jj.id, sel: jj.workers.filter((w) => w[1] === "toClose").map((w) => w[0]), rate: null }); },
  caToggle(el) { const m = S.modal; const id = el.dataset.id; m.sel = m.sel.includes(id) ? m.sel.filter((x) => x !== id) : m.sel.concat(id); render(true); },
  caRate(el) { S.modal.rate = +el.dataset.v; render(true); },
  caSave() { const m = S.modal; if (!m.sel.length) { document.getElementById("ca-err").textContent = "Pažymėkite bent vieną darbuotoją."; return; } if (!m.rate) { document.getElementById("ca-err").textContent = "Pasirinkite įvertinimą nuo 1 iki 10."; return; } const jj = E().jobs.find((x) => x.id === m.id); jj.workers.forEach((w) => { if (m.sel.includes(w[0])) w[1] = "closed"; }); jj.lastRate = m.rate; const n = m.sel.length; { const com = ((document.getElementById("ca-com") || {}).value || "").trim(); m.sel.forEach((id) => A().reviews.unshift({ by: ADM_CO, about: (WORKERS[id] || {}).name || "", r: m.rate, t: com, job: jj.title, d: 0 })); } S.modal = null; const fin = finishIfDone(jj); toast(fin ? `Uždarytos ${n} darbo dienos. Darbas baigtas – jo pokalbiai uždaryti.` : `Uždarytos ${n} darbo dienos, įvertinimas ${m.rate}/10 išsaugotas.`); },
  cdSave() { const m = S.modal; if (m.res !== "no" && !m.rate) { document.getElementById("cd-err").textContent = "Pasirinkite darbuotojo įvertinimą nuo 1 iki 10."; return; } if (m.res === "no" && (document.getElementById("cd-why").value || "").trim().length < 3) { document.getElementById("cd-err").textContent = "Trumpai parašykite, kodėl pažymite neatvykimą."; return; } const j = E().jobs.find((x) => x.id === m.job); const w = j.workers.find((x) => x[0] === m.id); w[1] = "closed"; j.lastRate = m.rate || 9; if (m.res !== "no" && m.rate) A().reviews.unshift({ by: ADM_CO, about: (WORKERS[m.id] || {}).name || "", r: m.rate, t: ((document.getElementById("cd-com") || {}).value || "").trim(), job: j.title, d: 0 });; S.modal = null; const fin = finishIfDone(j); toast(fin ? "Darbo diena uždaryta. Darbas baigtas – jo pokalbiai uždaryti." : m.res === "no" ? "Darbo dienos rezultatas perduotas darbuotojui patvirtinti." : "Darbo diena uždaryta, darbuotojo įvertinimas išsaugotas."); },
  fav(el) { if (!E().favorites.some((f) => f[0] === el.dataset.id)) E().favorites.unshift([el.dataset.id, "Statybvietės tvarkymas", -1]); toast("Pridėta prie mėgstamų darbuotojų"); },
  unfav(el) { E().favorites = E().favorites.filter((f) => f[0] !== el.dataset.id); toast("Pašalinta iš mėgstamų darbuotojų"); },
  cancelJob(el) { openModal({ type: "cancelJob", id: el.dataset.id }); },
  cancelOk(el) { const why = (document.getElementById("cj-why").value || "").trim(); if (why.length < 5) { document.getElementById("cj-err").textContent = "Įrašykite aiškią atšaukimo priežastį."; return false; } const j = E().jobs.find((x) => x.id === el.dataset.id); LOG("atšaukė darbą", j.title); dropJobChats("employer", j.title); E().jobs = E().jobs.filter((x) => x !== j); E().ended.unshift({ id: "x" + j.id, title: j.title, d: j.d, need: j.need, result: "cancelled", reason: why }); S.modal = null; S.view = "ended"; toast("Poreikis atšauktas."); window.scrollTo(0, 0); },
  openEnded(el) { S.endedId = el.dataset.id; go("endedJob"); },
  copyJob(el) { const x = E().ended.find((y) => y.id === el.dataset.id); S.form = null; go("new"); const t = document.getElementById("f-title"); if (t) { t.value = x.title; S.form.title = x.title; } toast("Darbo sąlygos nukopijuotos. Patikrinkite naują datą ir išsaugokite."); },
  lunch(el) { S.form.lunch = el.dataset.v === "1"; render(true); },
  payUnit(el) { S.payUnit = el.dataset.v; render(true); },
  payKind(el) { S.payGross = el.dataset.v === "gross"; },
  calDay(el) { S.calDay = el.dataset.k; render(true); const c = root.querySelector(".calsel"); if (c && window.innerWidth < 900) c.scrollIntoView({ behavior: "smooth" }); },
  newOnDay(el) { S.form = null; go("new"); S.form.date = el.dataset.k; render(); },
  period(el) { S.planPeriod = el.dataset.v; render(true); },
  teamRole(el) { E().teamRole = el.dataset.v; render(true); },
  removeMember(el) { S.modal = null; E().team = E().team.filter((t) => t[0] !== el.dataset.v); toast("Komandos narys pašalintas."); },
  hireForm() { openModal({ type: "hireForm" }); },
  hireSend() { S.modal = null; toast("Įdarbinimo pasiūlymas išsiųstas (prototipas)."); }
};

const REPLIES = { worker: ["Gerai, ačiū!", "Supratau, iki susitikimo objekte.", "Puiku, laukiame."], employer: ["Gerai, ačiū!", "Supratau.", "Būsiu laiku."], admin: ["Ačiū, supratau.", "Gerai, pasitikslinsiu ir parašysiu.", "Ačiū už informaciją."] };
function sendMsg(text, img, file) {
  if (!text && !img && !file) return;
  const list = CONVS(); const c = list.find((x) => x.id === S.chatId); if (!c) return;
  const now = new Date(); const tm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  c.msgs.push({ w: "me", t: text || "", img: img || null, file: file || null, d: "Šiandien", tm });
  if (c.kind === "support" && S.role !== "admin") { const B = A().bugs, ck = (S.role === "worker" ? "w:" : "e:") + c.id, ex = B.find((b) => b.conv === ck && b.st === "active");
    if (ex) { ex.t += (text ? "\n" + text : ""); ex.shot = ex.shot || !!img; ex.tm = tm; }
    else B.unshift({ id: "b" + Date.now(), who: S.role === "worker" ? ADM_WK : ADM_CO, kind: S.role === "worker" ? "Darbuotojas" : "Darbdavys", page: "Pranešimas per pagalbą", t: text || (img ? "Atsiųsta ekrano nuotrauka" : "Atsiųstas failas"), d: 0, tm, st: "active", shot: !!img, img: img || null, dev: window.innerWidth < 900 ? "Telefonas" : "Kompiuteris", conv: ck }); }
  render(true); focusCompose();
  const cid = c.id; const role = S.role;
  setTimeout(() => { if (S.chatId !== cid) return; S.typing = cid; render(true); focusCompose(); }, 900);
  setTimeout(() => { if (S.typing === cid) S.typing = null; const r = c.kind === "support" ? "Ačiū! Perdavėme techninei komandai. Pranešime, kai sutvarkysime." : (REPLIES[role] || REPLIES.employer)[c.msgs.length % 3]; const who = (c.kind === "group" || c.kind === "team") ? ((c.parts || []).filter((p) => p !== "Jūs")[c.msgs.length % 2] || "them") : "them"; c.msgs.push({ w: who, t: r, d: "Šiandien", tm }); if (S.chatId === cid) { render(true); focusCompose(); } else c.unread = true; }, 2600);
}
function focusCompose() { const n = document.getElementById("msg-in"); if (n && window.matchMedia("(min-width:761px)").matches) n.focus({ preventScroll: true }); }

const FORMS = {
  admInvite() { const n = capName((document.getElementById("ai-n").value || "").trim()), e = (document.getElementById("ai-e").value || "").trim().toLowerCase(), err = document.getElementById("ai-err"), D = A();
    if (n.split(" ").filter(Boolean).length < 2) { err.textContent = "Įrašykite vardą ir pavardę."; return; }
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(e)) { err.textContent = "Įrašykite teisingą el. pašto adresą."; return; }
    if (D.admins.some((x) => x.e === e) || D.admInv.some((x) => x.e === e)) { err.textContent = "Šis el. paštas jau yra komandoje arba pakviestas."; return; }
    const p = (S.admInvP || ADM_DEP).slice(); if (!p.length) { err.textContent = "Pažymėkite bent vieną teisę."; return; } D.admInv.push({ n, e, p }); S.admInvP = null; S.admInvN = S.admInvE = ""; aLog("Pakvietė", `${n} · ${ADM_PRESET_N[admPresetOf(p)]}`); render(true); toast(`Kvietimas išsiųstas: ${e}`); },
  aSend() { const i = document.getElementById("acv-in"), t = (i.value || "").trim(); if (!t) return; const cur = aConvFind(S.aConv); if (!cur) return; if (cur.kind === "arch") return; const own = cur.kind === "mine"; cur.c.msgs.push({ w: own ? "me" : cur.kind === "support" ? "them" : admPub(), t, d: "Šiandien", tm: new Date().toTimeString().slice(0, 5) }); cur.c.unread = !own; aLog("Parašė į pokalbį", cur.title); render(true); const m = document.getElementById("acv-msgs"); if (m) m.scrollTop = m.scrollHeight; const n = document.getElementById("acv-in"); if (n) n.focus(); },
  job(form) {
    const f = S.form, err = document.getElementById("f-err");
    if (!f.title.trim()) { err.textContent = "Įrašykite poreikio pavadinimą."; document.getElementById("f-title").focus(); return; }
    if (!f.addr.trim()) { err.textContent = "Įrašykite adresą, kuriuo darbuotojas turi atvykti."; document.getElementById("f-addr").focus(); return; }
    if (!(+String(f.payAmount).replace(",", ".") > 0)) { err.textContent = "Įveskite atlygio sumą prieš kuriant darbo pasiūlymą."; document.getElementById("f-pay").focus(); return; }
    if (f.desc.trim().length < 10) { err.textContent = "Darbo aprašymas turi būti bent 10 simbolių."; document.getElementById("f-desc").focus(); return; }
    if (!f.agree) { err.textContent = "Prieš paskelbdami darbą patvirtinkite darbdavio atsakomybių ir platformos vaidmens informaciją."; return false; }
    const d = Math.round((new Date(f.date + "T12:00:00") - TODAY) / 864e5);
    if (S.editJob) { const j = E().jobs.find((x) => x.id === S.editJob); Object.assign(j, { title: f.title.trim(), d: isFinite(d) ? d : j.d, from: f.from, to: f.to, city: f.city, addr: f.addr, need: +f.people, pay: String(f.payAmount).replace(",", "."), unit: S.payUnit, gross: !!S.payGross, resp: f.resp, site: f.site || "", lunch: f.lunch ? `${f.lf}–${f.lt}` : "Pietų pertraukos nėra", arrival: f.arrival, desc: f.desc, auto: hasPlan("pro") && f.auto !== false }); LOG("redagavo darbą", j.title); S.editJob = null; S.form = null; E().openJob = j.id; S.view = "job"; toast("Darbo sąlygos atnaujintos"); window.scrollTo(0, 0); return; }
    E().usedMonth[PLAN()] = (E().usedMonth[PLAN()] || 0) + 1;
    const id = "n" + (++E().draftNo);
    E().jobs.push({ id, title: f.title.trim(), d: isFinite(d) ? d : 2, from: f.from, to: f.to, city: f.city || "Vilnius", addr: f.addr, need: +f.people, pay: String(f.payAmount).replace(",", "."), unit: S.payUnit, gross: !!S.payGross, resp: f.resp, site: f.site || "", lunch: f.lunch ? `${f.lf}–${f.lt}` : "Pietų pertraukos nėra", arrival: f.arrival, desc: f.desc, workers: [], unread: 0, auto: hasPlan("pro") && f.auto !== false, autoLog: [] });
    LOG("sukūrė darbą", f.title.trim());
    S.form = null; E().openJob = id; S.view = "job"; toast("Darbo pasiūlymas sukurtas. Žemiau rodomi tinkami darbuotojai."); window.scrollTo(0, 0);
  },
  send() { const inp = document.getElementById("msg-in"); const img = S.pendImg; S.pendImg = null; sendMsg(inp.value.trim(), img); },
  teamSend() { const inp = document.getElementById("tm-in"); const t = inp.value.trim(); if (!t) return; const now = new Date(); E().teamChat.push(["Jūs", t, `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`]); render(true); const n = document.getElementById("tm-in"); n && n.focus(); },
  urgent() { S.urgentCity = document.getElementById("u-city").value; render(true); },
  teamInvite() { const n = document.getElementById("t-name").value.trim(), m = document.getElementById("t-mail").value.trim(); if (!n || !m) { toast("Įveskite vardą ir el. paštą"); return; } E().pendingInvites.push([n, E().teamRole, m]); toast("Kvietimas sukurtas. Nukopijuokite nuorodą iš komandos lango."); }
};

document.addEventListener("click", (e) => {
  const t = e.target;
  if (t.matches("[data-modal-bg]")) { closeModal(); return; }
  const el = t.closest("[data-go],[data-act],[data-role],[data-open],[data-close],[data-close-modal],[data-rail],[data-scroll]");
  if (!el) return;
  if (el.tagName === "A") e.preventDefault();
  if (el.hasAttribute("data-close-modal")) return closeModal();
  if (el.hasAttribute("data-open")) { document.body.classList.add("open"); syncHash(); const c = root.querySelector(".drawer .closebtn"); c && c.focus(); return; }
  if (el.hasAttribute("data-close")) { document.body.classList.remove("open"); syncHash(); return; }
  if (el.hasAttribute("data-rail")) { S.rail = !S.rail; try { localStorage.setItem("s24full-rail", S.rail ? "1" : "0"); } catch (err) {} render(true); const b = root.querySelector(".app .collapse"); b && b.focus(); return; }
  if (el.hasAttribute("data-scroll")) { document.body.classList.remove("lpm"); const s = document.getElementById(el.dataset.scroll); s && s.scrollIntoView({ behavior: "smooth" }); return; }
  if (el.hasAttribute("data-role")) { S.adminAs = null; S.role = el.dataset.role; S.view = "overview"; S.chatId = null; S.chatOpen = false; render(); window.scrollTo(0, 0); return; }
  if (el.hasAttribute("data-go")) { if (S.screen !== "app") return; if (el.dataset.go === "new") S.form = null; S.modal = null; go(el.dataset.go); return; }
  const fn = ACT[el.dataset.act]; if (fn) { if (fn(el) === false) return; if (!["toast", "scrollQ", "profSave", "copy", "auth", "details", "accept", "closeDay", "cancelJob", "jobInfo", "profileW", "reliability", "companyModal", "arriveHelp", "hireForm", "cdRes", "cdRate", "deState", "enter", "logout", "chatWith", "openJob", "copyJob", "stats", "day", "lunch", "payUnit", "calDay", "period", "teamRole", "scope", "openChat", "closeChat", "quick", "chatFilter", "abroad", "ovOpen", "page", "openMessenger", "closeMessenger", "chatInfo", "lightbox", "closeLightbox", "archChat"].includes(el.dataset.act)) render(true); }
});
function planOpen(card, wrap) { const w = wrap || (card && card.parentElement); if (!w || (card && card.classList.contains("open"))) return; w.querySelectorAll(".pc").forEach((c) => c.classList.toggle("open", c === card)); w.classList.toggle("any", !!card); S.planOpen = card ? card.dataset.plan : ""; }
let planT;
document.addEventListener("mouseover", (e) => { if (!window.matchMedia("(hover:hover) and (min-width:981px)").matches) return; const c = e.target.closest && e.target.closest(".pcards .pc"); if (c) { clearTimeout(planT); planOpen(c); return; } const w = document.querySelector(".pcards.any"); if (w && !(e.target.closest && e.target.closest(".pcards"))) { clearTimeout(planT); planT = setTimeout(() => planOpen(null, w), 200); } });
document.addEventListener("mouseleave", () => { const w = document.querySelector(".pcards.any"); if (w && window.matchMedia("(min-width:981px)").matches) planOpen(null, w); });
document.addEventListener("click", (e) => { const c = e.target.closest && e.target.closest(".pcards .pc"); if (c && !c.classList.contains("open") && !e.target.closest("button")) planOpen(c); });
document.addEventListener("focusin", (e) => { const c = e.target.closest && e.target.closest(".pcards .pc"); if (c) planOpen(c); });
document.addEventListener("input", (e) => { const i = e.target; if (!i.classList || !i.classList.contains("nmcap")) return; const p = i.selectionStart, v = capName(i.value); if (v !== i.value) { const d = i.value.length - v.length; i.value = v; try { i.setSelectionRange(p - d, p - d); } catch (er) {} } i.classList.remove("bad"); const er = i.parentElement.querySelector(".ferr"); if (er) er.textContent = ""; });
function tplArrows() { const c = document.getElementById("tplchips"); if (!c) return; const car = c.parentElement, over = c.scrollWidth > c.clientWidth + 2; car.classList.toggle("over", over); }
document.addEventListener("click", (e) => { const b = e.target.closest && e.target.closest("[data-tplscroll]"); if (!b) return; const c = document.getElementById("tplchips"), dir = +b.dataset.tplscroll, max = c.scrollWidth - c.clientWidth; if (dir > 0 && c.scrollLeft >= max - 4) c.scrollTo({ left: 0, behavior: "smooth" }); else if (dir < 0 && c.scrollLeft <= 4) c.scrollTo({ left: max, behavior: "smooth" }); else c.scrollBy({ left: dir * Math.max(160, c.clientWidth * 0.7), behavior: "smooth" }); });
document.addEventListener("scroll", (e) => { if (e.target.id === "tplchips") tplArrows(); }, true);
window.addEventListener("resize", tplArrows);
new MutationObserver(() => tplArrows()).observe(document.getElementById("root") || document.body, { childList: true, subtree: false });
document.addEventListener("input", (e) => { if (e.target.id !== "tpl-q") return; const q = e.target.value.trim().toLocaleLowerCase("lt-LT"); let n = 0; document.querySelectorAll("#tpl-list .tplrow").forEach((r) => { const ok = !q || r.dataset.q.includes(q); r.hidden = !ok; if (ok) n++; }); const no = document.getElementById("tpl-none"); if (no) no.hidden = n > 0; });
document.addEventListener("input", (e) => { if (e.target.id !== "pw-new") return; const v = e.target.value, ok = { len: v.length >= 8, num: /\d/.test(v), up: /[A-ZĄČĘĖĮŠŲŪŽ]/.test(v) }; document.querySelectorAll("#pw-rules li").forEach((li) => li.classList.toggle("ok", ok[li.dataset.r])); });
document.addEventListener("change", (e) => { if (e.target.id !== "cv-file" || !e.target.files[0]) return; const a = S.ads.find((x) => x.id === e.target.dataset.id); a.cvSent = e.target.files[0].name; toast("CV išsiųstas įmonei"); render(); });
document.addEventListener("change", (e) => { if (e.target.id === "ad-city") { S.adCity = e.target.value; render(); } });
document.addEventListener("change", (e) => {
  if (e.target.id === "chat-anyfile" && e.target.files && e.target.files[0]) { const fl = e.target.files[0]; sendMsg("", null, { name: fl.name, size: fmtSize(fl.size) }); return; }
  if (e.target.id !== "chat-file" || !e.target.files || !e.target.files[0]) return;
  const file = e.target.files[0]; if (!/^image\//.test(file.type)) { toast("Galima įkelti tik nuotrauką"); return; }
  const rd = new FileReader(); rd.onload = () => { const im = new Image(); im.onload = () => { const mx = 1200, k = Math.min(1, mx / Math.max(im.width, im.height)); const cv = document.createElement("canvas"); cv.width = Math.round(im.width * k); cv.height = Math.round(im.height * k); cv.getContext("2d").drawImage(im, 0, 0, cv.width, cv.height); let url; try { url = cv.toDataURL("image/jpeg", 0.85); } catch (err) { url = rd.result; } const txt = (document.getElementById("msg-in") || {}).value || ""; sendMsg(txt.trim(), url); }; im.onerror = () => toast("Nepavyko nuskaityti nuotraukos"); im.src = rd.result; }; rd.readAsDataURL(file);
});
function markDirty(e) { if (S.view !== "profile" && S.view !== "company" || !e.target.closest("#p-fn, .form, .form *")) return; if (!e.target.matches("input, textarea, select")) return; const b = document.getElementById("savebar"); if (b) b.hidden = false; }
document.addEventListener("input", markDirty); document.addEventListener("change", markDirty);
document.addEventListener("submit", (e) => { const f = e.target.closest("[data-form]"); if (!f) return; e.preventDefault(); const fn = FORMS[f.dataset.form]; fn && fn(f); });
document.addEventListener("input", (e) => {
  if (e.target.matches("[data-chatq]")) { S.chatQ = e.target.value; const pos = e.target.selectionStart; render(true); const n = document.getElementById("chat-q"); if (n) { n.focus(); n.setSelectionRange(pos, pos); } return; } const f = e.target.closest('[data-form="job"]'); if (!f || !S.form) return; const n = e.target.name; if (!n) return; S.form[n] = e.target.type === "checkbox" ? e.target.checked : e.target.value; });
document.addEventListener("change", (e) => { const f = e.target.closest('[data-form="job"]'); if (!f || !S.form) return; const n = e.target.name; if (!n) return; S.form[n] = e.target.type === "checkbox" ? e.target.checked : e.target.value; if (n === "obj") { const o = E().objects.find((x) => x.n === e.target.value); if (o) { Object.assign(S.form, { city: o.city, addr: o.addr, arrival: o.arrival }); } render(true); } });
document.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches("article.job[data-act]")) { e.preventDefault(); e.target.click(); return; } if (e.key !== "Escape") return; if (S.lightbox) { S.lightbox = null; render(true); } else if (S.modal) closeModal(); else if (S.chatOpen) { S.chatOpen = false; S.chatId = null; render(true); } else if (document.body.classList.contains("open")) document.body.classList.remove("open"); });

/* ---------- Savo stiliaus išskleidžiami sąrašai ---------- */
function enhanceSelects() {
  document.querySelectorAll("select:not([data-enh])").forEach((sel) => {
    sel.setAttribute("data-enh", "1");
    sel.classList.add("sr"); sel.tabIndex = -1; sel.setAttribute("aria-hidden", "true");
    const wrap = document.createElement("div"); wrap.className = "dd";
    const btn = document.createElement("button"); btn.type = "button"; btn.className = "ddbtn"; btn.setAttribute("aria-haspopup", "listbox"); btn.setAttribute("aria-expanded", "false");
    const lab = sel.closest("label"); if (lab) { const t = [...lab.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(" "); if (t) btn.setAttribute("aria-label", t); }
    const list = document.createElement("div"); list.className = "ddlist"; list.setAttribute("role", "listbox"); list.hidden = true;
    const paint = () => { btn.innerHTML = `<span>${esc(sel.options[sel.selectedIndex]?.text || "")}</span>${svg("back", 16, 2.2).replace("<svg", '<svg class="chev"')}`; list.innerHTML = [...sel.options].map((o, i) => `<button type="button" role="option" class="ddopt" data-i="${i}" aria-selected="${i === sel.selectedIndex}">${esc(o.text)}${i === sel.selectedIndex ? svg("check", 16, 2.4) : ""}</button>`).join(""); };
    const close = () => { list.hidden = true; btn.setAttribute("aria-expanded", "false"); wrap.classList.remove("open"); };
    const place = () => { const r = btn.getBoundingClientRect(); const vh = window.innerHeight, below = vh - r.bottom - 12, above = r.top - 12; const up = below < 200 && above > below; const h = Math.min(260, Math.max(120, up ? above : below)); list.style.position = "fixed"; list.style.left = `${Math.max(8, Math.min(r.left, window.innerWidth - r.width - 8))}px`; list.style.width = `${r.width}px`; list.style.right = "auto"; list.style.maxHeight = `${h}px`; if (up) { list.style.top = "auto"; list.style.bottom = `${vh - r.top + 6}px`; } else { list.style.bottom = "auto"; list.style.top = `${r.bottom + 6}px`; } };
    const open = () => { document.querySelectorAll(".dd.open").forEach((d) => d._close && d._close()); list.hidden = false; btn.setAttribute("aria-expanded", "true"); wrap.classList.add("open"); place(); const cur = list.querySelector('[aria-selected="true"]') || list.firstElementChild; if (cur) { cur.focus({ preventScroll: true }); cur.scrollIntoView({ block: "center" }); } };
    wrap._close = close;
    btn.addEventListener("click", (e) => { e.stopPropagation(); list.hidden ? open() : close(); });
    list.addEventListener("click", (e) => { const o = e.target.closest(".ddopt"); if (!o) return; e.stopPropagation(); sel.selectedIndex = +o.dataset.i; sel.dispatchEvent(new Event("change", { bubbles: true })); paint(); close(); btn.focus(); });
    list.addEventListener("keydown", (e) => { const opts = [...list.querySelectorAll(".ddopt")]; const i = opts.indexOf(document.activeElement); if (e.key === "ArrowDown") { e.preventDefault(); (opts[i + 1] || opts[0]).focus(); } else if (e.key === "ArrowUp") { e.preventDefault(); (opts[i - 1] || opts[opts.length - 1]).focus(); } else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); btn.focus(); } else if (e.key === "Tab") close(); });
    btn.addEventListener("keydown", (e) => { if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); open(); } });
    paint(); wrap.append(btn, list); sel.after(wrap);
  });
}
document.addEventListener("click", (e) => { if (!e.target.closest(".dd")) document.querySelectorAll(".dd.open").forEach((d) => d._close && d._close()); }, true);
window.addEventListener("resize", () => document.querySelectorAll(".dd.open").forEach((d) => d._close && d._close()));
document.addEventListener("scroll", (e) => { if (e.target.closest && e.target.closest(".ddlist")) return; document.querySelectorAll(".dd.open").forEach((d) => d._close && d._close()); }, true);

/* ---------- Naršyklės „Atgal“ – žingsnis atgal svetainės viduje ---------- */
let applyingHash = false;
function navHash() {
  if (S.screen === "public") return S.modal ? "pradzia-m" : "pradzia";
  if (S.screen === "hire") return "hire-" + (S.hpage || "landing");
  const r = S.role === "worker" ? "w" : S.role === "admin" ? "a" : "e";
  const id = S.view === "wjob" ? S.wJobId : S.view === "job" ? E().openJob : S.view === "endedJob" ? S.endedId : S.view === "whist" ? S.histId : S.view === "ad" ? S.adId : S.view === "ead" ? S.eAdId : "";
  let h = `${r}-${S.view}${id ? "-" + id : ""}`;
  if (S.modal) h += "-m";
  if (S.lightbox) h += "-l";
  if (document.body.classList.contains("open")) h += "-n";
  return h.replace(/[^A-Za-z0-9-]/g, "");
}
const prevOf = {};
function syncHash() {
  if (applyingHash || LP_MINI) return;
  const want = navHash(), cur = location.hash.slice(1);
  if (want === cur) return;
  try {
    if (cur && cur.startsWith(want + "-") && /^(-[cmnl][A-Za-z0-9]*)+$/.test(cur.slice(want.length))) {
      if (prevOf[cur] === want) { applyingHash = true; history.back(); setTimeout(() => { applyingHash = false; }, 50); }
      else history.replaceState(null, "", "#" + want);
      return;
    }
    prevOf[want] = cur; location.hash = want;
  } catch (e) {}
}
function applyHash() {
  const h = location.hash.slice(1); if (!h) return;
  applyingHash = true;
  try {
    const parts = h.split("-");
    if (parts[0] === "pradzia") { S.screen = "public"; S.modal = h.endsWith("-m") ? S.modal : null; }
    else if (parts[0] === "hire") { S.screen = "hire"; const p = parts[1] || "landing"; S.hpage = ["home", "need", "newneed", "setpw"].includes(p) && !S.hpReq ? "login" : p; }
    else if (parts[0] === "w" || parts[0] === "e" || parts[0] === "a") {
      S.screen = "app"; S.role = parts[0] === "w" ? "worker" : parts[0] === "a" ? "admin" : "employer"; S.view = parts[1] || "overview";
      const id = parts[2] && !/^[cmnl]/.test(parts[2]) ? parts[2] : "";
      if (id) { if (S.view === "wjob") S.wJobId = id; else if (S.view === "job") E().openJob = id; else if (S.view === "endedJob") S.endedId = id; else if (S.view === "whist") S.histId = id; else if (S.view === "ad") S.adId = id; else if (S.view === "ead") S.eAdId = id; }
      const flags = parts.slice(id ? 3 : 2);
      if (!flags.includes("m")) S.modal = null;
      if (!flags.includes("l")) S.lightbox = null;
      document.body.classList.toggle("open", flags.includes("n"));
    }
    render(); window.scrollTo(0, 0);
  } finally { applyingHash = false; }
}
window.addEventListener("hashchange", () => { if (location.hash.slice(1) !== navHash()) applyHash(); });
// pradinis atvaizdavimas – skripto pabaigoje (po visų modulių)


/* vieningi iššokantys paaiškinimai */
(() => {
  const tip = document.createElement("div"); tip.id = "tipx"; tip.setAttribute("role", "tooltip"); document.body.appendChild(tip);
  let cur = null, tmr = 0;
  const hide = () => { clearTimeout(tmr); cur = null; tip.classList.remove("on"); };
  const show = (el) => {
    if (el.hasAttribute("title")) { el.dataset.tip = el.getAttribute("title"); el.removeAttribute("title"); if (!el.textContent.trim() && !el.hasAttribute("aria-label")) el.setAttribute("aria-label", el.dataset.tip); }
    const aw = el.classList.contains("award") ? el.querySelector(".awtip") : null;
    const t = aw ? aw.innerHTML : el.dataset.tip; if (!t) return;
    if (!aw && (el.innerText || "").replace(/\s+/g, " ").includes(t) && !el.classList.contains("free2")) return;
    cur = el; clearTimeout(tmr);
    tmr = setTimeout(() => {
      if (cur !== el || !document.body.contains(el)) return;
      if (aw) tip.innerHTML = t; else tip.textContent = t; tip.className = aw ? "aw" : ""; const r = el.getBoundingClientRect(); const side = el.closest(".side:not(.drawer)") && innerWidth >= 900;
      tip.style.left = "0px"; tip.style.top = "0px"; tip.classList.add(side && !aw ? "r" : "t");
      const w = tip.offsetWidth, h = tip.offsetHeight; let x, y;
      if (side && !aw) { x = r.right + 12; y = r.top + r.height / 2 - h / 2; }
      else { x = r.left + r.width / 2 - w / 2; y = r.top - h - 10; if (y < 8) { y = r.bottom + 10; tip.classList.replace("t", "b"); } }
      const cx = Math.max(8, Math.min(innerWidth - w - 8, x)); tip.style.setProperty("--ax", (r.left + r.width / 2 - cx) + "px");
      tip.style.left = cx + "px"; tip.style.top = Math.max(8, y) + "px"; tip.classList.add("on");
    }, 180);
  };
  document.addEventListener("mouseover", (e) => { if (matchMedia("(hover:none)").matches) return; const el = e.target.closest(".award,[title],[data-tip]"); if (!el) { if (cur) hide(); return; } if (el !== cur) show(el); });
  document.addEventListener("focusin", (e) => { const el = e.target.closest(".award,[title],[data-tip]"); if (el && e.target.matches(":focus-visible")) show(el); });
  document.addEventListener("click", (e) => { const el = e.target.closest(".award"); if (el) { e.stopPropagation(); cur = null; show(el); } }, true);
  document.addEventListener("focusout", hide); document.addEventListener("mousedown", hide); addEventListener("scroll", hide, true); addEventListener("resize", hide);
})();

/* šiandienos darbų slinkimas pirštu */
(() => { let x0 = null, y0 = 0; document.addEventListener("touchstart", (e) => { const h = e.target.closest("[data-swipe=hero]"); if (!h || !h.querySelector(".th-nav")) { x0 = null; return; } x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  document.addEventListener("touchend", (e) => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null; if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) { S.heroI = (S.heroI || 0) + (dx < 0 ? 1 : -1); render(true); } }, { passive: true }); })();

/* jautrių dokumentų apsauga peržiūroje */
document.addEventListener("contextmenu", (e) => { if (e.target.closest("[data-protect]")) e.preventDefault(); });
document.addEventListener("dragstart", (e) => { if (e.target.closest("[data-protect]")) e.preventDefault(); });
document.addEventListener("copy", (e) => { const sel = document.getSelection(); if (sel && sel.anchorNode && sel.anchorNode.parentElement && sel.anchorNode.parentElement.closest("[data-protect]")) e.preventDefault(); });

/* dokumentas paslepiamas, kai langas praranda fokusą ar bandoma daryti ekrano nuotrauką */
(() => {
  const hide = () => document.querySelectorAll("[data-protect]").forEach((p) => p.classList.add("shut"));
  const show = () => document.querySelectorAll("[data-protect]").forEach((p) => p.classList.remove("shut"));
  window.addEventListener("blur", hide); window.addEventListener("focus", show);
  document.addEventListener("visibilitychange", () => (document.hidden ? hide() : show()));
  document.addEventListener("keydown", (e) => { if (!document.querySelector("[data-protect]")) return; if (e.key === "PrintScreen" || (e.metaKey && e.shiftKey) || (e.key === "s" && e.shiftKey && (e.metaKey || e.ctrlKey))) { hide(); try { navigator.clipboard && navigator.clipboard.writeText(""); } catch (err) {} setTimeout(show, 2500); } });
  document.addEventListener("keyup", (e) => { if (e.key === "PrintScreen" && document.querySelector("[data-protect]")) { hide(); try { navigator.clipboard && navigator.clipboard.writeText(""); } catch (err) {} setTimeout(show, 2500); } });
})();

/* skelbimo peržiūra kuriant */
document.addEventListener("input", adPreview); document.addEventListener("change", adPreview);
function adPreview(e) {
  if (!e.target.closest || !e.target.closest(".adnew")) return;
  const v = (id) => (document.getElementById(id) || {}).value || "";
  const t = v("na-t").trim(), s1 = +v("na-s1"), s2 = +v("na-s2"), g = (document.querySelector('input[name="na-g2"]:checked') || {}).value;
  const set = (id, x) => { const n = document.getElementById(id); if (n) n.textContent = x; };
  set("pv-t", t ? up(t) : "PAREIGOS");
  set("pv-c", `${v("na-c")} · ${v("na-k")}`);
  set("pv-s", s1 ? (s2 && s2 > s1 ? `${s1.toLocaleString("lt-LT")}–${s2.toLocaleString("lt-LT")} €` : `${s1.toLocaleString("lt-LT")} €`) : "— €");
  set("pv-g", `${g === "gross" ? "ant popieriaus" : "į rankas"} / mėn.`);
  set("pv-g2", v("na-g"));
}

/* klaidos ekrano nuotrauka su pažymėjimu */
function loadH2C() { return window.html2canvas ? Promise.resolve() : new Promise((ok, no) => { const sc = document.createElement("script"); sc.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"; sc.onload = ok; sc.onerror = no; document.head.appendChild(sc); }); }
async function startBugShot() {
  S.chatOpen = false; render(true);
  const ov = document.createElement("div"); ov.id = "shot"; ov.innerHTML = `<div class="sh-load">Daroma ekrano nuotrauka…</div>`; document.body.appendChild(ov);
  await new Promise((r) => setTimeout(r, 60));
  let base;
  try {
    await loadH2C(); ov.style.visibility = "hidden";
    const H = Math.max(document.documentElement.scrollHeight, innerHeight);
    const full = await window.html2canvas(document.documentElement, { width: innerWidth, height: H, windowWidth: innerWidth, windowHeight: innerHeight, scrollX: 0, scrollY: 0, x: 0, y: 0, scale: Math.min(window.devicePixelRatio || 1, 1.5), backgroundColor: getComputedStyle(document.body).backgroundColor || "#f8f8fa", useCORS: true, logging: false,
      ignoreElements: (el) => el.id === "shot" || el.id === "tipx" || (el.classList && el.classList.contains("chatfab")),
      onclone: (doc) => { const sy = window.scrollY, sx = window.scrollX; doc.documentElement.style.minHeight = H + "px"; doc.body.style.minHeight = H + "px"; [".side:not(.drawer)", ".topbar", ".tabbar"].forEach((sel) => { const o = document.querySelector(sel), c = doc.querySelector(sel); if (!o || !c) return; const cs = getComputedStyle(o); if (cs.position !== "fixed" && cs.position !== "sticky") return; const r = o.getBoundingClientRect(); Object.assign(c.style, { position: "absolute", top: r.top + sy + "px", left: r.left + sx + "px", width: r.width + "px", height: r.height + "px", bottom: "auto", right: "auto" }); }); } });
    const k = full.width / innerWidth; base = document.createElement("canvas"); base.width = Math.round(innerWidth * k); base.height = Math.round(innerHeight * k); base.getContext("2d").drawImage(full, 0, Math.round(window.scrollY * k), base.width, base.height, 0, 0, base.width, base.height);
  } catch (err) {
    base = document.createElement("canvas"); base.width = innerWidth; base.height = innerHeight; const g = base.getContext("2d"); g.fillStyle = "#f8f8fa"; g.fillRect(0, 0, base.width, base.height); g.fillStyle = "#666879"; g.font = "16px Inter, sans-serif"; g.fillText("Ekrano vaizdas (prototipe nepavyko užfiksuoti)", 24, 40);
  }
  ov.style.visibility = "";
  ov.innerHTML = `<div class="sh-bar"><b>Apibraukite vietą, kur yra klaida</b><div class="sh-acts"><button type="button" class="btn sm" id="sh-clear">Išvalyti</button><button type="button" class="btn sm" id="sh-cancel">Atšaukti</button><button type="button" class="btn sm primary" id="sh-ok">${svg("check", 15, 2.4)}Pridėti prie žinutės</button></div></div><div class="sh-stage"><canvas id="sh-base"></canvas><canvas id="sh-draw"></canvas></div>`;
  const bc = ov.querySelector("#sh-base"), dc = ov.querySelector("#sh-draw");
  [bc, dc].forEach((c) => { c.width = base.width; c.height = base.height; });
  bc.getContext("2d").drawImage(base, 0, 0);
  const g = dc.getContext("2d"); const k = base.width / innerWidth; g.strokeStyle = "#e5484d"; g.lineWidth = 4 * k; g.lineCap = "round"; g.lineJoin = "round";
  let drawing = false;
  const pt = (e) => { const r = dc.getBoundingClientRect(); return [(e.clientX - r.left) * (dc.width / r.width), (e.clientY - r.top) * (dc.height / r.height)]; };
  dc.addEventListener("pointerdown", (e) => { drawing = true; dc.setPointerCapture(e.pointerId); const [x, y] = pt(e); g.beginPath(); g.moveTo(x, y); });
  dc.addEventListener("pointermove", (e) => { if (!drawing) return; const [x, y] = pt(e); g.lineTo(x, y); g.stroke(); });
  dc.addEventListener("pointerup", () => { drawing = false; });
  const close = () => { ov.remove(); S.chatOpen = true; S.chatId = "sup"; render(true); focusCompose(); };
  ov.querySelector("#sh-clear").onclick = () => g.clearRect(0, 0, dc.width, dc.height);
  ov.querySelector("#sh-cancel").onclick = close;
  ov.querySelector("#sh-ok").onclick = () => { const out = document.createElement("canvas"); const sc = Math.min(1, 1400 / base.width); out.width = Math.round(base.width * sc); out.height = Math.round(base.height * sc); const o = out.getContext("2d"); o.drawImage(bc, 0, 0, out.width, out.height); o.drawImage(dc, 0, 0, out.width, out.height); S.pendImg = out.toDataURL("image/jpeg", 0.85); close(); };
}

document.addEventListener("change", (e) => { const sel = e.target.closest && e.target.closest("select.rolepick"); if (!sel) return; const m = E().team.find((t) => t[0] === sel.dataset.member); if (!m || m[1] === sel.value) return; m[1] = sel.value; const k = Object.keys(ROLES).find((x) => ROLES[x].name === m[0]); if (k) { ROLES[k].label = sel.value; } toast(`${m[0]} dabar – ${sel.value.toLowerCase()}. Teisės pasikeitė iš karto.`); });

document.addEventListener("input", (e) => { if (!e.target.closest || !e.target.closest(".newjob")) return; const v = (id) => (document.getElementById(id) || {}).value || ""; const set = (id, x) => { const n = document.getElementById(id); if (n) n.textContent = x; };
   });
document.addEventListener("change", (e) => { if (!e.target.closest || !e.target.closest(".newjob")) return; const v = (id) => (document.getElementById(id) || {}).value || ""; const set = (id, x) => { const n = document.getElementById(id); if (n) n.textContent = x; }; set("mt-time", `${v("f-from")}–${v("f-to")}`); set("mt-date", v("f-date")); });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => fitMenu());
window.addEventListener("load", () => fitMenu());

Object.assign(ACT, ADMIN_ACT);
Object.keys(ACT_PERM).forEach((k) => { const f = ACT[k]; if (!f) return; ACT[k] = function (el) { if (S.role === "admin" && !admCan(ACT_PERM[k])) { toast("Neturite teisės atlikti šio veiksmo"); return false; } return f.call(this, el); }; });
["admInvite", "aSend"].forEach((k) => { const fi = FORMS[k]; FORMS[k] = (f) => { if (S.role === "admin" && !admCan(ACT_PERM[k])) { toast("Neturite teisės atlikti šio veiksmo"); return; } fi(f); }; });
