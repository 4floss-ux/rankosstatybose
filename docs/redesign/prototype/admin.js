/* ---------- Administratorius ---------- */
function adminState() {
  return {
    wst: { w6: { s: "worker", reason: "3 neatvykimai per mėnesį be priežasties", until: 14, by: "Administratorius", d: -2 } },
    wreg: { w1: -410, w2: -322, w3: -95, w4: -260, w5: -41, w6: -18, w7: -150 },
    abroadWant: ["w3", "w5", "w7"],
    employers: [
      { id: "c1", n: "UAB Pavyzdinė statyba", type: "co", code: "300000000", city: "Vilnius", plan: "pro", jobs: 42, rel: 97, ver: true, st: "ok", owner: "Jonas Vadovas", email: "vadovas@pavyzdys.lt", phone: "+37060000000", team: 3, reg: -380 },
      { id: "c2", n: "UAB Statybų partneris", type: "co", code: "302345678", city: "Vilnius", plan: "business", jobs: 31, rel: 100, ver: true, st: "ok", owner: "Rasa Jonaitienė", email: "rasa@partneris.lt", phone: "+37061111111", team: 1, reg: -510 },
      { id: "c3", n: "MB Pamatų meistrai", type: "co", code: "305678901", city: "Vilnius", plan: "business", jobs: 42, rel: 94, ver: true, st: "ok", owner: "Darius Kazlauskas", email: "darius@pamatai.lt", phone: "+37062222222", team: 1, reg: -290 },
      { id: "c4", n: "UAB Baltijos sandėliai", type: "co", code: "304567890", city: "Vilnius", plan: "basic", jobs: 12, rel: 91, ver: true, st: "ok", owner: "Darius Petraitis", email: "info@baltsand.lt", phone: "+37063333333", team: 1, reg: -120 },
      { id: "c5", n: "UAB Rytų rangovai", type: "co", code: "306789012", city: "Kaunas", plan: "basic", jobs: 3, rel: 88, ver: false, st: "ok", owner: "Mindaugas Rimkus", email: "rangovai@rytai.lt", phone: "+37064444444", team: 1, reg: -3 },
      { id: "c6", n: "Jonas Petrauskas", type: "pr", code: "", city: "Trakai", plan: "basic", jobs: 2, rel: 100, ver: true, st: "ok", owner: "Jonas Petrauskas", email: "jonas.p@gmail.com", phone: "+37065555555", team: 1, reg: -12 },
      { id: "c7", n: "UAB Greita statyba", type: "co", code: "301234567", city: "Klaipėda", plan: "basic", jobs: 7, rel: 62, ver: true, st: "susp", reason: "Neapmokėti darbai – 3 darbuotojų skundai", until: 0, owner: "Tadas Greitas", email: "info@greita.lt", phone: "+37066666666", team: 1, reg: -200 }
    ],
    jobs: [
      { t: "Pagalbiniai mūro darbai", co: "UAB Pavyzdinė statyba", d: 1, need: 3, acc: 2, pay: "15 €/val.", st: "short" },
      { t: "Betonavimo pagalba", co: "UAB Pavyzdinė statyba", d: 0, need: 2, acc: 2, pay: "130 €/d.", st: "live" },
      { t: "Statybvietės tvarkymas", co: "UAB Pavyzdinė statyba", d: -1, need: 3, acc: 3, pay: "14 €/val.", st: "toClose" },
      { t: "Pagalbiniai statybos darbai", co: "UAB Statybų partneris", d: 2, need: 2, acc: 1, pay: "14 €/val.", st: "short" },
      { t: "Medžiagų nešiojimas", co: "UAB Baltijos sandėliai", d: 3, need: 4, acc: 4, pay: "13 €/val.", st: "full" },
      { t: "Tvarkymo darbai objekte", co: "UAB Rytų rangovai", d: 1, need: 2, acc: 0, pay: "13 €/val.", st: "short" },
      { t: "Sodo tvoros pagalba", co: "Jonas Petrauskas", d: 5, need: 1, acc: 1, pay: "120 €/d.", st: "full" },
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
const aLog = (what, obj) => A().audit.unshift(["Administratorius", what, obj, 0]);
const ago = (d) => d === 0 ? "Šiandien" : d === -1 ? "Vakar" : d < 0 ? `Prieš ${-d} d.` : `Po ${d} d.`;
const aHead = (t, sub, extra = "") => `<div class="head"><div><h1>${t}</h1>${sub ? `<p class="lead">${sub}</p>` : ""}</div>${extra}</div>`;
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
  D.foreign.filter((f) => f.st === "new").forEach((f) => Q.push({ ic: "people", tone: "o", t: `Nauja tarptautinė užklausa: ${f.prof} × ${f.need}`, s: `${f.co} · ${ago(f.d)}`, b: `<button class="btn sm" type="button" data-go="foreign">Atidaryti</button>` }));
  const traffic = [["Telefonu", 642], ["Kompiuteriu", 211]], tt = traffic.reduce((a, x) => a + x[1], 0);
  const cities = [["Vilnius", 412], ["Kaunas", 188], ["Klaipėda", 96], ["Šiauliai", 54], ["Panevėžys", 41]], cm = cities[0][1];
  return `${aHead("Suvestinė", `Šiandien, ${iso(TODAY)}`)}
  <section class="ovsec"><h2 class="sr">Šiandien</h2><div class="ntiles">
    ${tile("user", "Šiandien užsiregistravo", 9, "7 darbuotojai · 2 darbdaviai", 'data-go="aworkers"')}
    ${tile("out", "Šiandien prisijungė", 214, "Vakar 198", 'data-go="aworkers"')}
    ${tile("jobs", "Aktyvūs darbai", D.jobs.filter((j) => j.d >= 0 && j.st !== "cancel").length + 32, "Šiandien vyksta 11", 'data-go="ajobs"')}
    ${tile("shield", "Neišspręsti ginčai", openD, openD ? "Reikia sprendimo" : "Nėra", 'data-go="disputes"', openD)}
  </div></section>
  ${queueCard(Q)}
  <section class="ovsec"><h2 class="sect">Šis mėnuo</h2><div class="stats">
    <div class="stat"><small>Įvykdyti darbai</small><b>412</b><span class="muted small">+8 % nei praeitą mėn.</span></div>
    <div class="stat"><small>Atšaukti darbai</small><b>9</b><span class="muted small">2,1 % visų darbų</span></div>
    <div class="stat"><small>Panaudoti darbuotojai</small><b>287</b><span class="muted small">Dirbo bent vieną dieną</span></div>
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
  const all = Object.values(WORKERS), susp = all.filter((w) => wStatus(w.id));
  const L = all.filter((w) => (f === "all" || (f === "susp" ? wStatus(w.id) : !wStatus(w.id))) && aMatch("w", `${w.name} ${w.city}`));
  return `${aHead("Darbuotojai", `${all.length} registruoti darbuotojai`)}
  <div class="abar2">${aSearch("w", "Ieškoti pagal vardą ar miestą")}${aChips("w", [["all", "Visi", all.length], ["ok", "Aktyvūs", all.length - susp.length], ["susp", "Suspenduoti", susp.length]])}</div>
  <section class="card"><div class="atbl aw">
    <div class="atr ath"><span>Darbuotojas</span><span>Patikimumas</span><span>Įvertinimas</span><span>Darbai</span><span>Būsena</span><span></span></div>
    ${L.length ? L.map((w) => { const s = wStatus(w.id); return `<div class="atr"><span class="acell-nm">${wAv(w, "sm")}<span><b>${esc(w.name)}</b><small>${esc(w.city)} · registr. ${ago(D.wreg[w.id] || -30).toLowerCase()}</small></span></span><span data-l="Patikimumas"><b>${w.att}</b>/100</span><span data-l="Įvertinimas">${String(w.rating).replace(".", ",")}/10</span><span data-l="Darbai">${w.jobs}</span><span>${s ? pill(s.s === "worker" ? "Darb. režimas suspenduotas" : "Suspenduotas", "red") : pill("Aktyvus", "green")}</span><span class="aacts"><button class="btn sm" type="button" data-act="aManage" data-k="w" data-id="${w.id}">Valdyti</button></span></div>`; }).join("") : `<p class="small muted" style="padding:14px 4px;margin:0">Nieko nerasta.</p>`}
  </div></section>`;
}

function aEmployers() {
  const D = A(), f = aF("e", "all"), C = D.employers;
  const L = C.filter((c) => (f === "all" || (f === "unver" && !c.ver) || (f === "susp" && c.st === "susp") || (f === "pr" && c.type === "pr")) && aMatch("e", `${c.n} ${c.code} ${c.city} ${c.owner}`));
  return `${aHead("Darbdaviai ir įmonės", `${C.length} darbdaviai · ${C.filter((c) => c.type === "pr").length} privatūs`)}
  <div class="abar2">${aSearch("e", "Pavadinimas, kodas, miestas")}${aChips("e", [["all", "Visi", C.length], ["unver", "Laukia patvirtinimo", C.filter((c) => !c.ver).length], ["pr", "Privatūs", C.filter((c) => c.type === "pr").length], ["susp", "Suspenduoti", C.filter((c) => c.st === "susp").length]])}</div>
  <section class="card"><div class="atbl ae">
    <div class="atr ath"><span>Darbdavys</span><span>Planas</span><span>Darbų</span><span>Patikimumas</span><span>Būsena</span><span></span></div>
    ${L.length ? L.map((c) => `<div class="atr"><span class="acell-nm"><span class="av co sm" style="border:1px solid var(--line)">${ini(c.n.replace(/^(UAB|MB)\s+/, ""))}</span><span><b>${esc(c.n)}</b><small>${c.type === "pr" ? "Privatus darbdavys" : `Įmonė · ${c.code}`} · ${esc(c.city)}</small></span></span><span data-l="Planas">${PLN[c.plan]}</span><span data-l="Darbų">${c.jobs}</span><span data-l="Patikimumas"><b>${c.rel}</b>/100</span><span>${c.st === "susp" ? pill("Suspenduotas", "red") : !c.ver ? pill("Nepatvirtinta", "orange") : pill("Patvirtinta", "green")}</span><span class="aacts">${!c.ver ? `<button class="btn sm primary" type="button" data-act="aVerify" data-id="${c.id}">Patvirtinti</button>` : ""}<button class="btn sm" type="button" data-act="aManage" data-k="e" data-id="${c.id}">Valdyti</button></span></div>`).join("") : `<p class="small muted" style="padding:14px 4px;margin:0">Nieko nerasta.</p>`}
  </div></section>`;
}

function aAbroad() {
  const L = A().abroadWant.map((id) => WORKERS[id]);
  const info = { w3: ["Norvegija, Švedija", "Anglų B1", "Mūrininkas"], w5: ["Vokietija", "Rusų, vokiečių A2", "Krautuvo vairuotojas"], w7: ["Norvegija", "Anglų A2", "Pagalbinis darbuotojas"] };
  return `${aHead("Domisi darbu užsienyje", `${L.length} darbuotojai pažymėjo, kad domisi darbu užsienyje`)}
  <section class="card"><div class="atbl aa">
    <div class="atr ath"><span>Darbuotojas</span><span>Šalys</span><span>Kalbos</span><span>Profesija</span><span></span></div>
    ${L.map((w) => `<div class="atr"><span class="acell-nm">${wAv(w, "sm")}<span><b>${esc(w.name)}</b><small>${esc(w.city)}</small></span></span><span data-l="Šalys">${info[w.id][0]}</span><span data-l="Kalbos">${info[w.id][1]}</span><span data-l="Profesija">${info[w.id][2]}</span><span class="aacts"><button class="btn sm" type="button" data-act="profileW" data-id="${w.id}">${svg("user", 14)}Profilis</button></span></div>`).join("")}
  </div></section>`;
}

function aJobs() {
  const J = A().jobs, f = aF("j", "all");
  const L = J.filter((j) => (f === "all" || (f === "act" && j.d >= 0 && j.st !== "cancel") || (f === "short" && j.st === "short") || (f === "past" && (j.d < 0 || j.st === "cancel"))) && aMatch("j", `${j.t} ${j.co}`));
  return `${aHead("Visi darbai", "Visų darbdavių darbo pasiūlymai")}
  <div class="abar2">${aSearch("j", "Darbas arba darbdavys")}${aChips("j", [["all", "Visi", J.length], ["act", "Aktyvūs"], ["short", "Trūksta žmonių"], ["past", "Pasibaigę"]])}</div>
  <section class="card"><div class="atbl aj">
    <div class="atr ath"><span>Darbas</span><span>Data</span><span>Žmonių</span><span>Atlygis</span><span>Būsena</span><span></span></div>
    ${L.map((j, i) => `<div class="atr"><span class="acell-nm"><span><b>${up(j.t)}</b><small>${esc(j.co)}</small></span></span><span data-l="Data">${dateLabel(j.d)}</span><span data-l="Žmonių"><b>${j.acc}</b>/${j.need}</span><span data-l="Atlygis">${j.pay}</span><span>${pill(...AJ_ST[j.st])}</span><span class="aacts"><button class="btn sm" type="button" data-act="aJobChat" data-v="${J.indexOf(j)}">${svg("chat", 14)}Pokalbis</button>${j.d >= 0 && j.st !== "cancel" ? `<button class="btn sm ghost" type="button" data-act="aJobDel" data-v="${J.indexOf(j)}" aria-label="Ištrinti darbą" title="Ištrinti darbą">${svg("x", 15, 2.2)}</button>` : ""}</span></div>`).join("")}
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
  ${L.length ? L.map((b) => `<section class="card bug"><div class="bugrow">${b.shot ? `<div class="bugshot" aria-label="Ekrano nuotrauka"><div class="bs-bar"></div><div class="bs-l"></div><div class="bs-l s"></div><div class="bs-mark"></div></div>` : ""}<div class="bugtx"><div class="row" style="gap:8px;flex-wrap:wrap">${pill(...st[b.st])}<span class="small muted">${ago(b.d)} ${b.tm} · ${esc(b.page)} · ${esc(b.dev)}</span></div><p>${esc(b.t)}</p><span class="small"><b>${esc(b.who)}</b> <span class="muted">· ${b.kind}</span></span></div></div>
    <div class="row dact"><button class="btn sm" type="button" data-act="aChatWith" data-v="${esc(b.who)}">${svg("chat", 14)}Atsakyti</button><span class="spacer"></span>${b.st === "active" ? `<button class="btn sm" type="button" data-act="aBugSet" data-id="${b.id}" data-v="na">Neaktualu</button><button class="btn sm primary" type="button" data-act="aBugSet" data-id="${b.id}" data-v="fixed">${svg("check", 14, 2.6)}Sutvarkyta</button>` : `<button class="btn sm" type="button" data-act="aBugSet" data-id="${b.id}" data-v="active">Grąžinti į aktyvias</button>`}</div></section>`).join("") : `<section class="card">${empty("Klaidų pranešimų nėra", "", "check")}</section>`}`;
}

function aRatings() {
  const R = A().reviews;
  return `${aHead("Atsiliepimai", "Darbuotojų ir darbdavių atsiliepimai vienas apie kitą")}
  <section class="card"><div class="list">${R.map((r, i) => `<div class="revrow${r.flag ? " flag" : ""}"><span class="revscore">${r.r}/10</span><div class="revtx"><b>${esc(r.by)} → ${esc(r.about)}</b><p>„${esc(r.t)}“</p><small class="muted">${up(r.job)} · ${ago(r.d)}</small></div>${r.flag ? pill("Pažymėtas", "orange") : ""}<button class="btn sm" type="button" data-act="aRevDel" data-v="${i}">Pašalinti</button></div>`).join("") || empty("Atsiliepimų dar nėra", "", "star")}</div></section>`;
}

function aTeamChats() {
  return `${aHead("Vadovų pokalbiai", "Įmonių vidiniai komandos pokalbiai. Matote tik skaitymo režimu.")}
  <section class="card"><div class="atbl at">
    <div class="atr ath"><span>Įmonė</span><span>Planas</span><span>Narių</span><span>Žinučių</span><span></span></div>
    ${A().teamChats.map((c, i) => `<div class="atr"><span class="acell-nm"><span class="av co sm" style="border:1px solid var(--line)">${ini(c.co.replace(/^(UAB|MB)\s+/, ""))}</span><span><b>${esc(c.co)}</b><small>${c.msgs ? `Paskutinė žinutė ${c.last}` : "Pokalbis dar tuščias"}</small></span></span><span data-l="Planas">${c.plan}</span><span data-l="Narių">${c.mem}</span><span data-l="Žinučių">${c.msgs}</span><span class="aacts">${c.msgs ? `<button class="btn sm" type="button" data-act="aTeamView" data-v="${i}">${svg("eye", 14)}Peržiūrėti</button>` : ""}</span></div>`).join("")}
  </div></section>`;
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
  <section class="card"><div class="loglist">${L.map(([who, what, obj, d]) => `<div class="logrow"><span class="av lt sm">AD</span><div><b>${esc(what)}</b> <span class="logobj">${esc(obj)}</span></div><small>${d === 0 ? "Ką tik" : ago(d)}</small></div>`).join("")}</div></section>`;
}

function aModal(m, head) {
  if (m.type === "aManage") {
    if (m.k === "w") {
      const w = WORKERS[m.id], s = wStatus(w.id);
      return head("Darbuotojas", esc(w.name), `<span class="muted small">${esc(w.city)} · registr. ${iso(dOff(A().wreg[w.id] || -30))}</span>`) + `<div class="kv"><div><small>Telefonas</small><b>+3706${(1000000 + w.name.length * 731).toString().slice(0, 7)}</b></div><div><small>Patikimumas</small><b>${w.att}/100</b></div><div><small>Įvertinimas</small><b>${String(w.rating).replace(".", ",")}/10 (${w.rc})</b></div><div><small>Darbų</small><b>${w.jobs}</b></div></div>
      ${s ? `<div class="alert"><div><b>${s.s === "worker" ? "Darbuotojo režimas suspenduotas" : "Paskyra suspenduota"}</b><p>${esc(s.reason)} · ${s.until ? `iki ${iso(dOff(s.d + s.until))}` : "neterminuotai"}</p></div></div>` : ""}
      <div class="mgrid"><button class="btn" type="button" data-act="aLoginAs" data-k="w" data-id="${w.id}">${svg("eye", 15)}Prisijungti kaip</button><button class="btn" type="button" data-act="aChatWith" data-v="${esc(w.name)}">${svg("chat", 15)}Rašyti žinutę</button><button class="btn" type="button" data-act="profileW" data-id="${w.id}">${svg("user", 15)}Profilis</button>${s ? `<button class="btn primary" type="button" data-act="aUnsusp" data-k="w" data-id="${w.id}">Nuimti suspendavimą</button>` : `<button class="btn danger" type="button" data-act="aSuspOpen" data-k="w" data-id="${w.id}">Suspenduoti</button>`}</div>
      <button type="button" class="linkbtn dangerlink" data-act="aDelOpen" data-k="w" data-id="${w.id}">Ištrinti paskyrą</button>`;
    }
    const c = coById(m.id);
    return head(c.type === "pr" ? "Privatus darbdavys" : "Įmonė", esc(c.n), `<span class="muted small">${c.type === "pr" ? "" : `Įmonės kodas ${c.code} · `}${esc(c.city)} · registr. ${iso(dOff(c.reg))}</span>`) + `<div class="kv"><div><small>Savininkas</small><b>${esc(c.owner)}</b></div><div><small>Planas</small><b>${PLN[c.plan]}</b></div><div><small>El. paštas</small><b>${esc(c.email)}</b></div><div><small>Telefonas</small><b>${esc(c.phone)}</b></div><div><small>Darbų</small><b>${c.jobs}</b></div><div><small>Komandos narių</small><b>${c.team}</b></div></div>
      ${c.st === "susp" ? `<div class="alert"><div><b>Paskyra suspenduota</b><p>${esc(c.reason)}</p></div></div>` : ""}
      <div class="mgrid">${!c.ver ? `<button class="btn primary" type="button" data-act="aVerify" data-id="${c.id}">${svg("check", 15, 2.6)}Patvirtinti įmonę</button>` : ""}<button class="btn" type="button" data-act="aLoginAs" data-k="e" data-id="${c.id}">${svg("eye", 15)}Prisijungti kaip</button><button class="btn" type="button" data-act="aChatWith" data-v="${esc(c.n)}">${svg("chat", 15)}Rašyti žinutę</button>${c.st === "susp" ? `<button class="btn primary" type="button" data-act="aUnsusp" data-k="e" data-id="${c.id}">Nuimti suspendavimą</button>` : `<button class="btn danger" type="button" data-act="aSuspOpen" data-k="e" data-id="${c.id}">Suspenduoti</button>`}</div>
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
  aDelOk(el) { if ((document.getElementById("del-c").value || "").trim().toUpperCase() !== "IŠTRINTI") { document.getElementById("del-err").textContent = "Įrašykite IŠTRINTI."; return false; } const nm = el.dataset.k === "w" ? WORKERS[el.dataset.id].name : coById(el.dataset.id).n; aLog("Paskyra ištrinta", nm); S.modal = null; toast(`Prototipe paskyra neištrinama. Veiksmas įrašytas į istoriją.`); },
  aLoginAs(el) { S.adminAs = el.dataset.k === "w" ? "Beata Bune" : "UAB Pavyzdinė statyba"; S.modal = null; S.role = el.dataset.k === "w" ? "worker" : "employer"; S.view = "overview"; S.chatOpen = false; S.chatId = null; },
  aBack() { S.adminAs = null; S.role = "admin"; S.view = "overview"; S.chatOpen = false; S.chatId = null; },
  aChatWith(el) { const c = privConv(A().convs, el.dataset.v, null); ACT.chatWith({ dataset: { id: c.id } }); },
  aResolve(el) { openModal({ type: "aResolve", id: el.dataset.id, v: el.dataset.v }); },
  aResolveOk(el) { const n = document.getElementById("rs-n").value.trim(); if (n.length < 5) { document.getElementById("rs-err").textContent = "Parašykite trumpą paaiškinimą."; return false; } const d = A().disputes.find((x) => x.id === el.dataset.id); d.open = false; d.res = el.dataset.v === "w" ? "Darbuotojo naudai" : "Darbdavio naudai"; d.resNote = n; aLog("Ginčas išspręstas", `${d.job} · ${d.res.toLowerCase()}`); S.modal = null; toast("Sprendimas išsiųstas abiem pusėms"); },
  aBugSet(el) { const b = A().bugs.find((x) => x.id === el.dataset.id); b.st = el.dataset.v; aLog(b.st === "fixed" ? "Klaida pažymėta sutvarkyta" : b.st === "na" ? "Klaida pažymėta neaktualia" : "Klaida grąžinta į aktyvias", b.page); toast(b.st === "fixed" ? `${b.who} gaus pranešimą, kad klaida sutvarkyta` : "Būsena pakeista"); },
  aRevDel(el) { const r = A().reviews[+el.dataset.v]; openModal({ type: "aReason", title: "Pašalinti atsiliepimą", obj: `${r.by} → ${r.about}`, ph: "Pvz. Įžeidžiantis turinys", btn: "Pašalinti", run: "rev", i: +el.dataset.v }); },
  aJobDel(el) { const j = A().jobs[+el.dataset.v]; openModal({ type: "aReason", title: "Ištrinti darbą", obj: `${j.t} · ${j.co}`, ph: "Pvz. Netinkamas turinys arba dublikatas", btn: "Ištrinti darbą", run: "job", i: +el.dataset.v }); },
  aFileDel(el) { const f = A().files[+el.dataset.v]; openModal({ type: "aReason", title: "Ištrinti failą", obj: f.n, ph: "Pvz. Netinkamas turinys", btn: "Ištrinti failą", run: "file", i: +el.dataset.v }); },
  aReasonOk() { const n = document.getElementById("ar-n").value.trim(); if (n.length < 3) { document.getElementById("ar-err").textContent = "Įrašykite priežastį."; return false; } const m = S.modal, D = A();
    if (m.run === "rev") { D.reviews.splice(m.i, 1); aLog("Atsiliepimas pašalintas", n); }
    if (m.run === "job") { const j = D.jobs[m.i]; j.st = "cancel"; aLog("Darbas ištrintas", `${j.t} · ${n}`); }
    if (m.run === "file") { const f = D.files.splice(m.i, 1)[0]; aLog("Failas ištrintas", `${f.n} · ${n}`); }
    S.modal = null; toast("Atlikta. Veiksmas įrašytas į istoriją."); },
  aTeamView(el) { openModal({ type: "aTeam", v: +el.dataset.v }); },
  aJobChat(el) { openModal({ type: "aJobChat", v: +el.dataset.v }); },
  aFhStart(el) { const f = A().foreign.find((x) => x.id === el.dataset.id); f.st = "sourcing"; aLog("Pradėta tarptautinė paieška", `${f.prof} · ${f.co}`); toast("Paieška pradėta. Įmonė gaus pranešimą."); },
  aFhNext(el) { const f = A().foreign.find((x) => x.id === el.dataset.id), i = FH_ST.findIndex((x) => x[0] === f.st); if (i < FH_ST.length - 1) { f.st = FH_ST[i + 1][0]; aLog("Atrankos etapas pakeistas", `${f.prof} · ${FH_ST[i + 1][1]}`); } }
};
document.addEventListener("input", (e) => { const k = e.target.dataset && e.target.dataset.asearch; if (!k) return; S["aq_" + k] = e.target.value; const pos = e.target.selectionStart; render(true); const i = document.getElementById("as-" + k); if (i) { i.focus(); try { i.setSelectionRange(pos, pos); } catch (er) {} } });
