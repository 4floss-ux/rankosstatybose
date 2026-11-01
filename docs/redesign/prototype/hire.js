/* ---------- HIRE: tarptautinė atranka (statybos24.lt/hire) ----------
   Vieši tekstai paimti iš dabartinės svetainės (HIRE_COPY, HIRE_INITIAL_REQUEST_COPY).
   Darbdavio portalas, administratoriaus valdymas ir vieša forma naudoja tuos pačius duomenis S.hire. */
const HCOPY = __HCOPY__;
const H_LANGS = [["en", "English"], ["lt", "Lietuvių"], ["de", "Deutsch"], ["nl", "Nederlands"], ["no", "Norsk"], ["sv", "Svenska"], ["da", "Dansk"]];
const HL = () => S.hLang || "en";
const hLangSel = () => `<div class="h-lsel"><select data-hlang aria-label="Language">${H_LANGS.map(([k, t]) => `<option value="${k}"${HL() === k ? " selected" : ""}>${t}</option>`).join("")}</select></div>`;
document.addEventListener("change", (e) => { if (e.target && e.target.matches && e.target.matches("[data-hlang]")) { if (S.hpage === "landing") hSyncForm(); S.hLang = e.target.value; render(true); } });
function hSyncForm() { const g = (k) => (document.getElementById("hf-" + k) || {}).value; if (!document.getElementById("hf-co")) return; S.hForm = { co: g("co"), country: g("country"), contact: g("contact"), job: g("job"), email: g("email"), phone: g("phone"), ok: (document.getElementById("hf-ok") || {}).checked }; }
const H_COUNTRIES = ["Germany", "Netherlands", "Norway", "Sweden", "Denmark", "Finland", "Belgium", "Austria", "Switzerland", "Other"];
const H_PROFS = ["Carpenter", "Concrete worker", "Electrician", "Plumber", "Welder", "Machine operator", "Bricklayer", "Roofer", "Painter", "HVAC worker", "Construction labourer", "Site supervisor", "Other"];
const hc = () => HCOPY[HL()] || HCOPY.en;
const hLc = () => HCOPY._login[HL()] || HCOPY._login.en;
const hOpt = (v) => (hc().opt || {})[v] || v;
const hProf = (v) => (hc().prof || {})[v] || v;
const tr = (en, lt) => HL() === "lt" ? lt : HL() === "en" ? en : ((HCOPY._i18n[en] || {})[HL()] || en);
const H = () => S.hire || (S.hire = hireState());

// Užklausos (įmonės paskyros) ir poreikių būsenos – kaip dabartinėje svetainėje
const HR_ST = { new: ["Nauja", "orange"], under_review: ["Peržiūrima", ""], access_preparing: ["Ruošiama prieiga", ""], waiting_employer: ["Laukiama sutarties ir informacijos", "orange"], employer_submitted: ["Darbdavys pateikė", "orange"], ready_for_sourcing: ["Paruošta paieškai", "green"], sourcing: ["Vyksta paieška", "green"], declined: ["Atmesta", "red"], closed: ["Uždaryta", ""] };
const HN_ST = { new: ["New", "Naujas", "orange"], under_review: ["Under review", "Peržiūrima", ""], approved: ["Approved", "Patvirtinta", "green"], sourcing: ["Sourcing", "Vyksta paieška", "green"], declined: ["Declined", "Atmesta", "red"], completed: ["Completed", "Užbaigta", ""] };
const HC_ST = [["found", "Rastas"], ["contacted", "Susisiekta"], ["interested", "Domisi"], ["screening", "Tikrinamas"], ["ready_to_present", "Paruoštas pateikti"], ["presented", "Pateiktas darbdaviui"], ["interview", "Interviu"], ["offer", "Pasiūlymas"], ["hired", "Įdarbintas"], ["started", "Pradėjo dirbti"]];
const HC_END = { rejected: "Atmestas", withdrawn: "Pasitraukė" };
const HC_AGR = { not_prepared: ["Neparuošta", ""], waiting_signature: ["Laukiama kandidato parašo", "orange"], signed_uploaded: ["Pasirašyta įkelta", "green"], approved: ["Patvirtinta", "green"], rejected: ["Reikia pataisyti", "red"] };
const HC_RESP = { interested: ["Interested", "Domina"], interview: ["Interview requested", "Paprašytas interviu"], accepted: ["Candidate approved", "Kandidatas patvirtintas"], not_suitable: ["Not suitable", "Netinka"] };
const hcIdx = (st) => HC_ST.findIndex((x) => x[0] === st);
const hcLab = (st) => (HC_ST.find((x) => x[0] === st) || [, HC_END[st] || st])[1];
const hVisible = (c) => hcIdx(c.st) >= hcIdx("presented") || c.st === "rejected" && c.resp === "not_suitable";

function hireState() {
  const cand = (o) => Object.assign({ id: "hc" + Math.random().toString(36).slice(2, 7), wid: null, src: "base", age: 34, lic: "Taip (B kategorija)", from: "2026-11-25", needsAcc: true, st: "found", agr: "not_prepared", resp: null, reason: "", emailShared: false, contract: false, confirmed: false, note: "", unseen: false }, o);
  return {
    seq: 4,
    requests: [
      { id: "hr1", co: "Nordbau GmbH", country: "Germany", contact: "Thomas Becker", job: "Projektleiter", email: "t.becker@nordbau.example", phone: "+49 170 000 0000", d: 0, st: "new", access: false, pw: false, agr: "none", needs: [], inv: [] },
      { id: "hr2", loginId: "ID-482913", co: "Bygg Vest AS", country: "Norway", contact: "Lars Hansen", job: "Site manager", email: "lars@byggvest.example", phone: "+47 400 00 000", d: -14, st: "sourcing", access: true, pw: true, agr: "approved", inv: [{ no: "S24-H-2026-007", sum: 2400, due: "2026-11-15", st: "unpaid" }],
        needs: [
          { id: "hn1", title: "Concrete crew – Bergen", prof: "Concrete worker", n: 3, exp: "3+ years", lang: "English B1", lic: "advantage", skills: "Formwork, rebar fixing, concrete pouring", country: "Norway", addr: "Fjøsangerveien 50, Bergen", start: "2026-12-01", by: "2026-11-20", emp: "Full-time", dur: "12 months", hours: 40, ot: true, otPay: "150% of hourly rate", sal: "265", cur: "NOK", freq: "Every 2 weeks", basis: "gross", acc: "employer", room: "Single room", accCost: "", home: "paid", vac: "25 working days", vacPay: "According to employment contract", info: "Safety course (HMS) is an advantage.", st: "sourcing", d: -10,
            cands: [
              cand({ wid: "w3", name: "Darius S.", prof: "Betonuotojas", exp: "6 m. monolitinės konstrukcijos, klojiniai", langs: "Anglų B1", age: 38, st: "presented", agr: "approved", resp: "interview", note: "Dirbo Norvegijoje 2 sezonus. Patikimumas platformoje 94/100." }),
              cand({ wid: "w1", name: "Tomas K.", prof: "Betonuotojas", exp: "4 m. armavimas ir betonavimas", langs: "Anglų A2", age: 29, st: "screening", agr: "waiting_signature", note: "Laukiame tarpininkavimo sutarties parašo." }),
              cand({ src: "external", name: "Marius V.", prof: "Betonuotojas", exp: "8 m. klojiniai, armatūra", langs: "Anglų B2, rusų", age: 41, st: "presented", agr: "signed_uploaded", resp: null, note: "Rekomendacija iš kito darbdavio.", unseen: true })
            ] },
          { id: "hn2", title: "Carpenter – Bergen", prof: "Carpenter", n: 1, exp: "5+ years", lang: "English B1", lic: "required", skills: "Timber framing, formwork", country: "Norway", addr: "Bergen", start: "2027-01-10", by: "2026-12-20", emp: "Full-time", dur: "Permanent", hours: 40, ot: false, otPay: "", sal: "280", cur: "NOK", freq: "Every 2 weeks", basis: "gross", acc: "employee", room: "Shared room", accCost: "4 000 NOK", home: "not_paid", vac: "25 working days", vacPay: "According to employment contract", info: "", st: "new", d: -1, cands: [] }
        ] },
      { id: "hr3", loginId: "ID-517640", co: "Van Dijk Bouw BV", country: "Netherlands", contact: "Sanne de Vries", job: "HR manager", email: "sanne@vandijkbouw.example", phone: "+31 6 0000 0000", d: -4, st: "waiting_employer", access: true, pw: false, agr: "sent", needs: [], inv: [] }
    ]
  };
}
const hReq = (id) => H().requests.find((r) => r.id === id);
const hNeed = (r, id) => (r ? r.needs : []).find((n) => n.id === id);
const hAbroad = () => (A().abroadWant || []).map((id) => WORKERS[id]).filter(Boolean);
const hAbrC = (id) => ((A().abroadC || {})[id] || []).join(", ");

/* ---------- Viešas /hire puslapis: vienas ekranas su įmonės forma ---------- */
function hireTop() {
  const c = hc();
  return `<header class="pub-top h-top2"><div class="h-in"><span class="h-brand"><img src="${LOGO_SRC}" alt="statybos24.lt"><i class="h-sep" aria-hidden="true"></i><span class="h-blab">${esc(c.sidebarLabel || "")}</span></span>
    <div class="h-tright">${hLangSel()}<button class="btn" type="button" data-act="hGo" data-v="login">${esc(hLc().signIn)}</button></div></div></header>`;
}
function hireLanding() {
  const c = hc(), t = c.ir, e = S.hErr || {}, v = S.hForm || {};
  const fld = (key, lab, type = "text", hint = "") => `<label class="field" for="hf-${key}">${esc(lab)} *<input id="hf-${key}" type="${type}" value="${esc(v[key] || "")}" autocomplete="off">${hint ? `<span class="hint">${esc(hint)}</span>` : ""}${e[key] ? `<span class="ferr">${esc(e[key])}</span>` : ""}</label>`;
  const card = S.hpage === "done"
    ? `<div class="h-card h-card-done"><div class="h-done">${svg("check", 28, 2.6)}</div><h2>${esc(t.successTitle)}</h2><p>${esc(t.successText)}</p><p class="h-imp">${esc(t.important)}</p><button class="btn" type="button" data-act="hGo" data-v="landing">${esc(t.reset)}</button></div>`
    : `<form class="h-card h-form" data-form="hRequest" novalidate><h2>${esc(t.companySection)}</h2>
      <div class="h-grid">${fld("co", t.companyName)}
      <label class="field" for="hf-country">${esc(t.companyCountry)} *<select id="hf-country"><option value="">—</option>${H_COUNTRIES.map((x) => `<option value="${x}"${v.country === x ? " selected" : ""}>${esc(hOpt(x))}</option>`).join("")}</select>${e.country ? `<span class="ferr">${esc(e.country)}</span>` : ""}</label>
      ${fld("contact", t.contactName)}${fld("job", t.jobTitle)}</div>${fld("email", t.email, "email", t.emailHint)}
      <label class="field" for="hf-phone">${esc(t.phone)}<input id="hf-phone" type="tel" value="${esc(v.phone || "")}"></label>
      <label class="h-consent"><input type="checkbox" id="hf-ok"${v.ok ? " checked" : ""}><span>${esc(t.consent)}</span></label>${e.ok ? `<span class="ferr">${esc(e.ok)}</span>` : ""}
      <button class="btn primary lp-big" type="submit">${esc(t.submit)}</button></form>`;
  return `<div class="h-one">${hireTop()}<main class="h-hero"><div class="lp-glow" aria-hidden="true"></div><div class="h-in h-hero-in">
    <div class="h-hero-tx"><h1>${esc(t.title)}</h1><p>${esc(t.intro)}</p>
      <div class="h-next"><b>${esc(t.nextTitle)}</b><ol>${t.nextSteps.map((x, i) => `<li><span>${i + 1}</span><p>${esc(x)}</p></li>`).join("")}</ol></div>
      <div class="h-warn">${svg("shield", 17)}<span>${esc(t.important)}</span></div>
      <p class="h-mail"><b>${esc(t.questionsTitle)}</b> ${esc(t.questionsText)}</p></div>
    ${card}
  </div></main><footer class="h-foot2"><div class="h-in"><span>© ${TODAY.getFullYear()} statybos24.lt</span></div></footer></div>`;
}
/* ---------- Darbdavio portalas ---------- */
function hireLogin() {
  const R = H().requests.filter((r) => r.access), L = hLc();
  if (S.hpage === "setpw") {
    const r = hReq(S.hpReq);
    return `<div class="hp-login"><div class="hp-card">${hLangSel()}<img src="${LOGO_SRC}" alt="statybos24.lt" class="hp-logo"><span class="h-k">${tr("FIRST SIGN-IN", "PIRMAS PRISIJUNGIMAS")}</span><h2>${tr("Create your own password", "Susikurkite savo slaptažodį")}</h2><p class="small muted">${esc(r.co)} · ${esc(r.loginId)}</p>
    <form data-form="hSetPw" novalidate class="form"><label class="field" for="hp-p1">${tr("NEW PASSWORD", "NAUJAS SLAPTAŽODIS")}<input id="hp-p1" type="password" placeholder="${tr("At least 12 characters", "Bent 12 simbolių")}"></label><label class="field" for="hp-p2">${tr("CONFIRM PASSWORD", "PAKARTOKITE SLAPTAŽODĮ")}<input id="hp-p2" type="password"></label><span class="hint">${tr("Use at least 12 characters with uppercase, lowercase and a number.", "Naudokite bent 12 simbolių, didžiąją raidę, mažąją raidę ir skaičių.")}</span><p class="ferr" id="hp-err"></p><button class="btn primary" type="submit">${tr("Save password & continue", "Išsaugoti slaptažodį ir tęsti")}</button></form></div></div>`;
  }
  return `<div class="hp-login"><div class="hp-card">${hLangSel()}<img src="${LOGO_SRC}" alt="statybos24.lt" class="hp-logo"><span class="h-k">${esc(L.portal)}</span><h2>${esc(L.signIn)}</h2><p class="small muted" style="margin:0">${esc(L.intro)}</p>
    <form data-form="hLogin" novalidate class="form"><label class="field" for="hl-e">${esc(L.companyId)}<input id="hl-e" value="${esc(S.hlEmail || "")}" placeholder="${esc(L.companyPlaceholder)}" autocomplete="off"></label><label class="field" for="hl-p">${esc(L.password)}<input id="hl-p" type="password" placeholder="${esc(L.passwordPlaceholder)}" value="${S.hlEmail ? "••••••••••••" : ""}"></label><p class="ferr" id="hl-err"></p><button class="btn primary" type="submit">${esc(L.submit)}</button></form>
    <p class="small muted" style="margin:0">${esc(L.help)} info@statybos24.lt</p>
    <div class="hp-demo"><span class="small muted">Prototipas – pasirinkite įmonę:</span>${R.map((r) => `<button type="button" class="btn sm" data-act="hDemoLogin" data-id="${r.id}">${esc(r.co)} · ${esc(r.loginId)}${r.pw ? "" : " · pirmas prisijungimas"}</button>`).join("") || '<span class="small muted">Prieigų dar nėra – suteikite ją administratoriuje.</span>'}</div>
    <button type="button" class="linkbtn" data-act="hGo" data-v="landing">← statybos24.lt/hire</button></div></div>`;
}

const hNst = (n) => { const s = HN_ST[n.st] || HN_ST.new; return pill(tr(s[0], s[1]), s[2]); };

function hirePortal() {
  const r = hReq(S.hpReq); if (!r) { S.hpage = "login"; return hireLogin(); }
  const head = `<header class="hp-top"><div class="h-in"><img src="${LOGO_SRC}" alt="statybos24.lt" class="hp-logo2"><span class="hp-tag">${tr("STATYBOS24 · INTERNATIONAL HIRE", "STATYBOS24 · TARPTAUTINĖ ATRANKA")}</span><span class="spacer"></span>${hLangSel()}<span class="hp-co">${esc(r.co)}</span><button class="btn sm" type="button" data-act="hLogout">${tr("Sign out", "Atsijungti")}</button></div></header>`;
  let body = "";
  if (S.hpage === "newneed") body = hpNeedForm(r);
  else if (S.hpage === "need") body = hpNeed(r);
  else body = hpHome(r);
  return `<div class="hp">${head}<main class="h-in hp-main">${body}</main></div>`;
}
function hpAgreement(r) {
  const st = r.agr === "approved" ? [tr("Your signed agreement has been accepted.", "Jūsų pasirašyta sutartis priimta."), "green"] : r.agr === "signed" ? [tr("Signed agreement uploaded. Statybos24 will review it.", "Pasirašyta sutartis įkelta. Statybos24 ją peržiūrės."), "orange"] : r.agr === "sent" ? [tr("Click the document to read the agreement.", "Paspauskite dokumentą ir perskaitykite sutartį."), ""] : [tr("Agreement is being prepared", "Sutartis ruošiama"), ""];
  return `<section class="card hp-agr"><header><div><h2>${tr("Recruitment agreement", "Tarpininkavimo sutartis")}</h2><p class="small muted" style="margin:2px 0 0">${st[0]}</p></div>${r.agr === "approved" ? pill(tr("Approved", "Patvirtinta"), "green") : r.agr === "signed" ? pill(tr("Under review", "Peržiūrima"), "orange") : ""}</header>
    ${r.agr === "none" ? `<p class="small muted" style="margin:0">${tr("Statybos24 will place the company agreement here.", "Statybos24 čia įkels įmonės sutartį.")}</p>` : `<div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn sm" type="button" data-act="toast" data-msg="${tr("The agreement document opens here in the real portal.", "Tikrame portale čia atsidarys sutarties dokumentas.")}">${svg("file", 15)}${tr("Recruitment agreement", "Tarpininkavimo sutartis")}.pdf</button>${r.agr === "sent" ? `<button class="btn sm primary" type="button" data-act="hpSign">${svg("upload", 15)}${tr("Upload signed agreement", "Įkelti pasirašytą sutartį")}</button>` : `<button class="btn sm" type="button" data-act="toast" data-msg="${tr("Downloaded", "Parsisiųsta")}">${svg("download", 15)}${tr("Download signed copy", "Parsisiųsti pasirašytos sutarties kopiją")}</button>`}</div>`}</section>`;
}
function hpHome(r) {
  const canNeed = r.agr === "signed" || r.agr === "approved";
  const cnt = (n) => n.cands.filter(hVisible).length, upd = (n) => n.cands.some((c) => hVisible(c) && c.unseen);
  return `<div class="hp-hello"><div><span class="h-k">${tr("PRIVATE RECRUITMENT WORKSPACE", "PRIVATI DARBUOTOJŲ ATRANKOS ERDVĖ")}</span><h1>${tr("Hello", "Sveiki")}, ${esc(r.contact.split(" ")[0])}</h1><p class="muted">${tr("Submit workforce needs and review the candidates Statybos24 introduces for each specific job.", "Pateikite darbuotojų poreikius ir kiekvienam konkrečiam darbui peržiūrėkite Statybos24 pateiktus kandidatus.")}</p></div>
    <button class="btn primary" type="button" data-act="hGo" data-v="newneed"${canNeed ? "" : " disabled"}>${svg("plus", 16, 2.4)}${tr("Submit workforce need", "Pateikti darbuotojų poreikį")}</button></div>
    ${canNeed ? "" : `<div class="notebox">${tr("Upload the signed recruitment agreement first – then you can submit workforce needs.", "Pirmiausia įkelkite pasirašytą tarpininkavimo sutartį – tada galėsite pateikti darbuotojų poreikius.")}</div>`}
    ${hpAgreement(r)}
    <section class="card"><header><div><h2>${tr("Your workforce needs", "Jūsų darbuotojų poreikiai")}</h2><p class="small muted" style="margin:2px 0 0">${tr("Open a need to review the information you submitted and the candidates assigned to it.", "Atidarykite poreikį, kad matytumėte pateiktą informaciją ir jam priskirtus kandidatus.")}</p></div></header>
      ${r.needs.length ? `<div class="list">${r.needs.map((n) => `<button type="button" class="hp-need" data-act="hpNeed" data-id="${n.id}"><div><b>${esc(n.title)}</b><small>${esc(hProf(n.prof))} · ${n.n} ${tr("workers", "darbuotojai")} · ${esc(n.addr)} · ${tr("start", "pradžia")} ${n.start}</small></div><span class="row" style="gap:8px">${upd(n) ? `<em class="hp-new">${tr("New candidate update", "Nauja informacija apie kandidatą")}</em>` : ""}<span class="small muted">${tr("Candidates", "Kandidatai")}: <b>${cnt(n)}</b></span>${hNst(n)}</span></button>`).join("")}</div>` : `<p class="small muted" style="margin:0">${tr("No workforce needs submitted yet", "Darbuotojų poreikių dar nepateikta")}</p>`}</section>
    ${r.inv.length ? `<section class="card"><header><div><h2>${tr("Invoices", "Sąskaitos")}</h2></div></header><div class="list">${r.inv.map((i) => `<div class="hp-inv"><span>${svg("file", 15)}<b>${esc(i.no)}</b></span><span>${i.sum.toLocaleString("lt-LT")} €</span><span class="small muted">${tr("Due", "Apmokėti iki")} ${i.due}</span>${i.st === "paid" ? pill(tr("Paid", "Apmokėta"), "green") : pill(tr("Unpaid", "Neapmokėta"), "orange")}<button class="btn sm" type="button" data-act="toast" data-msg="${tr("Invoice downloaded", "Sąskaita parsisiųsta")}">${svg("download", 14)}PDF</button></div>`).join("")}</div></section>` : ""}`;
}
const hAcc = (v) => ({ employer: tr("Employer provides", "Suteikia darbdavys"), none: tr("Not provided", "Nesuteikiama"), employee: tr("Employee pays / contributes", "Moka / prisideda darbuotojas") })[v] || "—";
const hLic = (v) => ({ required: tr("Required", "Privalomas"), advantage: tr("Advantage", "Privalumas"), no: tr("Not required", "Nereikalingas") })[v] || "—";
function hpNeedInfo(n) {
  const kv = (rows) => `<div class="kv">${rows.filter((x) => x[1]).map(([k, v]) => `<div><small>${k}</small><b>${esc(String(v))}</b></div>`).join("")}</div>`;
  return `<h3 class="hp-sub">${tr("Job & project", "Darbas ir projektas")}</h3>${kv([[tr("Profession / trade", "Profesija / specialybė"), hProf(n.prof)], [tr("Workers required", "Reikalingi darbuotojai"), n.n], [tr("Experience", "Patirtis"), n.exp], [tr("Language", "Kalbos"), n.lang], [tr("Driving licence", "Vairuotojo pažymėjimas"), hLic(n.lic)], [tr("Skills / tasks", "Įgūdžiai / darbai"), n.skills], [tr("Country", "Šalis"), hOpt(n.country)], [tr("Location", "Adresas"), n.addr], [tr("Start", "Darbo pradžia"), n.start], [tr("Needed by", "Darbuotojus turėti iki"), n.by]])}
    <h3 class="hp-sub">${tr("Employment conditions", "Darbo sąlygos")}</h3>${kv([[tr("Employment", "Įdarbinimas"), n.emp], [tr("Duration", "Sutarties trukmė"), n.dur], [tr("Hours per week", "Valandų per savaitę"), n.hours], [tr("Overtime", "Viršvalandžiai"), n.ot ? tr("Yes", "Taip") + (n.otPay ? ` · ${n.otPay}` : "") : tr("No", "Ne")], [tr("Salary", "Atlyginimas"), `${n.sal} ${n.cur} · ${n.basis === "net" ? tr("Net", "Neto") : tr("Gross", "Bruto")}`], [tr("Payment frequency", "Mokėjimo dažnumas"), n.freq]])}
    <h3 class="hp-sub">${tr("Accommodation & travel", "Apgyvendinimas, kelionės ir atostogos")}</h3>${kv([[tr("Accommodation", "Apgyvendinimas"), hAcc(n.acc)], [tr("Room", "Kambarys"), n.room], [tr("Cost", "Kaina"), n.accCost], [tr("Home travel", "Kelionės namo"), n.home === "paid" ? tr("Paid by employer", "Apmoka darbdavys") : tr("Not paid by employer", "Darbdavys neapmoka")], [tr("Vacation", "Atostogos"), n.vac], [tr("Vacation pay", "Atostogų apmokėjimas"), n.vacPay]])}
    ${n.info ? `<p class="small" style="margin:6px 0 0">${esc(n.info)}</p>` : ""}`;
}
function hpNeed(r) {
  const n = hNeed(r, S.hpNeed); if (!n) { S.hpage = "home"; return hpHome(r); }
  const C = n.cands.filter(hVisible);
  C.forEach((c) => { c.unseen = false; });
  const resp = (c) => c.resp ? pill(tr(...HC_RESP[c.resp]), c.resp === "not_suitable" ? "red" : "green") : pill(tr("Awaiting decision", "Laukiama sprendimo"), "orange");
  return `<button type="button" class="linkbtn" data-act="hGo" data-v="home">← ${tr("All workforce needs", "Visi poreikiai")}</button>
    <div class="hp-hello"><div><span class="h-k">${tr("WORKFORCE NEED", "DARBUOTOJŲ POREIKIS")}</span><h1>${esc(n.title)}</h1><p class="muted">${esc(hProf(n.prof))} · ${n.n} ${tr("workers", "darbuotojai")} · ${esc(n.addr)}</p></div>${hNst(n)}</div>
    <section class="card"><button type="button" class="hp-tgl" data-act="hpInfo" aria-expanded="${!!S.hpInfo}">${S.hpInfo ? tr("Hide information", "Slėpti informaciją") : tr("Information", "Informacija")}${svg("plus", 14, 2.4)}</button>${S.hpInfo ? hpNeedInfo(n) : ""}</section>
    <section class="card"><header><div><h2>${tr("Candidates", "Kandidatai")} · ${C.length}</h2></div></header>
    ${C.length ? C.map((c) => `<article class="hp-cand"><div class="hp-ch"><span class="av lt">${ini(c.name)}</span><div><b>${esc(c.name)}</b><small>${esc(c.prof)} · ${tr("Age", "Amžius")} ${c.age}</small></div>${resp(c)}</div>
      <div class="kv"><div><small>${tr("Experience", "Patirtis")}</small><b>${esc(c.exp)}</b></div><div><small>${tr("Language", "Kalbos")}</small><b>${esc(c.langs)}</b></div><div><small>${tr("Driving licence", "Vairuotojo paž.")}</small><b>${esc(c.lic)}</b></div><div><small>${tr("Available from", "Gali vykti nuo")}</small><b>${c.from}</b></div><div><small>${tr("Needs accommodation", "Reikalingas būstas")}</small><b>${c.needsAcc ? tr("Yes", "Taip") : tr("No", "Ne")}</b></div></div>
      ${c.note ? `<p class="hp-note"><b>${tr("Statybos24 comment", "Statybos24 komentaras")}:</b> ${esc(c.note)}</p>` : ""}
      <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn sm" type="button" data-act="toast" data-msg="${tr("The candidate CV opens here in the real portal.", "Tikrame portale čia atsidarys kandidato CV.")}">${svg("file", 14)}${tr("Open full CV", "Atidaryti pilną CV")}</button>${c.emailShared ? `<span class="small">${svg("mail", 13)} ${tr("Interview contact provided", "Interviu kontaktas pateiktas")}: ${esc((c.name.split(" ")[0] || "").toLowerCase())}@pastas.lt</span>` : ""}</div>
      ${c.resp === "accepted" ? (c.contract ? `<div class="hp-ok">${svg("check", 15, 2.6)}${c.st === "hired" || c.st === "started" ? tr("Candidate confirmed and accepted.", "Darbuotojas patvirtintas ir priimtas.") : tr("Employment contract uploaded. Statybos24 will coordinate the next step.", "Darbo sutartis įkelta. Statybos24 suderins kitą žingsnį.")}</div>` : `<div class="hp-dec"><b>${tr("Employment contract for review", "Darbo sutartis susipažinimui")}</b><button class="btn sm primary" type="button" data-act="hpContract" data-n="${n.id}" data-id="${c.id}">${svg("upload", 14)}${tr("Choose employment contract PDF / DOCX", "Įkelti darbo sutartį PDF / DOCX")}</button></div>`)
        : c.resp === "not_suitable" ? `<p class="small muted" style="margin:0">${tr("Rejection reason", "Atmetimo priežastis")}: ${esc(c.reason)}</p>`
        : `<div class="hp-dec"><b>${tr("CANDIDATE DECISION", "SPRENDIMAS DĖL KANDIDATO")}</b><div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn sm primary" type="button" data-act="hpResp" data-v="accepted" data-n="${n.id}" data-id="${c.id}">${svg("check", 14, 2.6)}${tr("Approve candidate", "Patvirtinti kandidatą")}</button>${c.resp !== "interview" ? `<button class="btn sm" type="button" data-act="hpResp" data-v="interview" data-n="${n.id}" data-id="${c.id}">${tr("Request interview", "Noriu interviu")}</button>` : ""}<button class="btn sm danger" type="button" data-act="hpReject" data-n="${n.id}" data-id="${c.id}">${tr("Reject candidate", "Atmesti kandidatą")}</button></div></div>`}
    </article>`).join("") : `<p class="small muted" style="margin:0">${tr("No candidates yet", "Kandidatų dar nėra")}</p>`}</section>`;
}
function hpNeedForm(r) {
  const f = S.hnf || (S.hnf = { prof: "", n: 1, country: r.country, ot: false, acc: "employer", basis: "gross", home: "paid", lic: "no" }), e = S.hnErr || "";
  const inp = (k, lab, ph = "", type = "text") => `<label class="field" for="hn-${k}">${lab}<input id="hn-${k}" type="${type}" placeholder="${ph}" value="${esc(f[k] ?? "")}" data-hn="${k}"></label>`;
  const seg = (k, opts) => `<div class="seg" role="group">${opts.map(([v, t]) => `<button type="button" data-act="hnSet" data-k="${k}" data-v="${v}" aria-pressed="${String(f[k]) === v}">${t}</button>`).join("")}</div>`;
  return `<button type="button" class="linkbtn" data-act="hGo" data-v="home">← ${tr("Back", "Atgal")}</button>
  <div class="hp-hello"><div><span class="h-k">${tr("NEW WORKFORCE NEED", "NAUJAS DARBUOTOJŲ POREIKIS")}</span><h1>${tr("Submit workforce need", "Pateikti darbuotojų poreikį")}</h1></div></div>
  <form class="hp-form" data-form="hNeed" novalidate>
   <section class="card"><h2>${tr("Job & project", "Darbas ir projektas")}</h2><div class="h-grid">
    ${inp("title", tr("JOB TITLE *", "DARBO PAVADINIMAS *"), tr("e.g. Drywall installer", "pvz. gipso kartono montuotojas"))}
    <label class="field" for="hn-prof">${tr("PROFESSION / TRADE *", "PROFESIJA / SPECIALYBĖ *")}<select id="hn-prof" data-hn="prof"><option value="">—</option>${H_PROFS.map((p) => `<option value="${p}"${f.prof === p ? " selected" : ""}>${esc(hProf(p))}</option>`).join("")}</select></label>
    ${inp("n", tr("WORKERS NEEDED *", "DARBUOTOJŲ SKAIČIUS *"), "", "number")}${inp("exp", tr("MINIMUM EXPERIENCE", "MINIMALI PATIRTIS"), tr("e.g. 3+ years", "pvz. 3+ metai"))}${inp("lang", tr("LANGUAGE / LEVEL", "KALBA / LYGIS"), tr("e.g. English B1", "pvz. anglų B1"))}
    <div class="field"><span>${tr("DRIVING LICENCE", "VAIRUOTOJO PAŽYMĖJIMAS")}</span>${seg("lic", [["required", tr("Required", "Privalomas")], ["advantage", tr("Advantage", "Privalumas")], ["no", tr("Not required", "Nereikalingas")]])}</div>
    <label class="field hp-wide" for="hn-skills">${tr("REQUIRED SKILLS / TASKS", "REIKALINGI ĮGŪDŽIAI / DARBAI")}<textarea id="hn-skills" data-hn="skills" placeholder="${tr("Drywall installation, framing, ceilings, finishing...", "Gipso montavimas, karkasas, lubos, glaistymas...")}">${esc(f.skills || "")}</textarea></label>
    <label class="field" for="hn-country">${tr("PROJECT COUNTRY *", "PROJEKTO ŠALIS *")}<select id="hn-country" data-hn="country">${H_COUNTRIES.map((x) => `<option value="${x}"${f.country === x ? " selected" : ""}>${esc(hOpt(x))}</option>`).join("")}</select></label>
    ${inp("addr", tr("PROJECT ADDRESS *", "PROJEKTO ADRESAS *"), tr("Street, city", "Gatvė, miestas"))}${inp("start", tr("START DATE *", "DARBO PRADŽIA *"), "", "date")}${inp("by", tr("WORKERS REQUIRED BY *", "DARBUOTOJUS REIKIA TURĖTI IKI *"), "", "date")}
   </div></section>
   <section class="card"><h2>${tr("Employment conditions", "Darbo sąlygos")}</h2><div class="h-grid">
    ${inp("emp", tr("EMPLOYMENT TYPE *", "ĮDARBINIMO TIPAS *"), "Full-time")}${inp("dur", tr("CONTRACT DURATION *", "SUTARTIES TRUKMĖ *"), tr("e.g. 12 months / permanent", "pvz. 12 mėnesių / neterminuota"))}${inp("hours", tr("WORKING HOURS PER WEEK *", "DARBO VALANDŲ PER SAVAITĘ SKAIČIUS *"), tr("e.g. 40", "pvz. 40"), "number")}
    <div class="field"><span>${tr("OVERTIME", "VIRŠVALANDŽIAI")}</span>${seg("ot", [["true", tr("Yes", "Taip")], ["false", tr("No", "Ne")]])}</div>
    ${f.ot ? inp("otPay", tr("OVERTIME PAY *", "KAIP APMOKAMI VIRŠVALANDŽIAI *"), tr("e.g. 125% hourly rate / +5 EUR per hour", "pvz. 125% valandinio tarifo / +5 EUR už valandą")) : ""}
    ${inp("sal", tr("SALARY AMOUNT *", "ATLYGINIMAS *"))}${inp("cur", tr("CURRENCY *", "VALIUTA *"), "EUR")}${inp("freq", tr("PAYMENT FREQUENCY *", "KAIP DAŽNAI MOKAMAS ATLYGINIMAS *"), tr("e.g. every week / every 2 weeks / monthly", "pvz. kas savaitę / kas 2 savaites / kas mėnesį"))}
    <div class="field"><span>${tr("SALARY BASIS", "ATLYGINIMO PAGRINDAS")}</span>${seg("basis", [["gross", tr("Gross", "Bruto")], ["net", tr("Net", "Neto")]])}</div>
   </div></section>
   <section class="card"><h2>${tr("Accommodation & travel", "Apgyvendinimas, kelionės ir atostogos")}</h2><div class="h-grid">
    <div class="field hp-wide"><span>${tr("ACCOMMODATION *", "APGYVENDINIMAS *")}</span>${seg("acc", [["employer", tr("Employer provides", "Suteikia darbdavys")], ["employee", tr("Employee pays / contributes", "Moka / prisideda darbuotojas")], ["none", tr("Not provided", "Nesuteikiama")]])}</div>
    ${f.acc !== "none" ? inp("room", tr("ROOM / ACCOMMODATION TYPE", "KAMBARIO / APGYVENDINIMO TIPAS"), tr("Single / shared room", "Atskiras / bendras kambarys")) + (f.acc === "employee" ? inp("accCost", tr("EMPLOYEE ACCOMMODATION COST", "DARBUOTOJO APGYVENDINIMO KAINA"), tr("amount per month", "suma per mėnesį")) : "") : ""}
    <div class="field"><span>${tr("HOME TRAVEL", "KELIONĖS NAMO")}</span>${seg("home", [["paid", tr("Paid by employer", "Apmoka darbdavys")], ["not_paid", tr("Not paid by employer", "Darbdavys neapmoka")]])}</div>
    ${inp("vac", tr("VACATION", "ATOSTOGOS"), tr("e.g. 24 working days per year", "pvz. 24 darbo dienos per metus"))}${inp("vacPay", tr("VACATION PAY", "ATOSTOGŲ APMOKĖJIMAS"), tr("e.g. paid according to employment contract", "pvz. apmokamos pagal darbo sutartį"))}
    <label class="field hp-wide" for="hn-info">${tr("ADDITIONAL REQUIREMENTS / INFORMATION", "PAPILDOMI REIKALAVIMAI / INFORMACIJA")}<textarea id="hn-info" data-hn="info">${esc(f.info || "")}</textarea></label>
   </div></section>
   ${e ? `<p class="ferr">${esc(e)}</p>` : ""}
   <div class="row" style="justify-content:flex-end"><button class="btn primary lp-big" type="submit">${tr("Submit workforce need", "Pateikti darbuotojų poreikį")}</button></div>
  </form>`;
}

function hirePage() {
  if (["login", "setpw"].includes(S.hpage)) return hireLogin();
  if (["home", "need", "newneed"].includes(S.hpage)) return hirePortal();
  return hireLanding();
}

/* ---------- Administratorius: tarptautinė atranka ---------- */
function aHire() {
  const R = H().requests, f = aF("fh", "all");
  const grp = { all: () => true, act: (r) => !["declined", "closed"].includes(r.st), new: (r) => ["new", "under_review", "access_preparing"].includes(r.st), wait: (r) => ["waiting_employer", "employer_submitted"].includes(r.st) || r.agr === "signed" || r.needs.some((n) => n.st === "new"), src: (r) => ["ready_for_sourcing", "sourcing"].includes(r.st) };
  const L = R.filter((r) => grp[f](r) && aMatch("fh", `${r.co} ${r.country} ${r.contact}`));
  const steps = [["Užklausa", "Įmonė užpildo formą statybos24.lt/hire"], ["Prieiga", "Peržiūrite ir sukuriate privatų portalą"], ["Sutartis", "Įmonė pasirašo tarpininkavimo sutartį"], ["Poreikis", "Įmonė pateikia darbuotojų poreikį, jūs patvirtinate"], ["Kandidatai", "Ieškote „Domisi darbu užsienyje“ bazėje ir pateikiate"], ["Įdarbinimas", "Įmonė patvirtina, įkelia darbo sutartį, išrašote sąskaitą"]];
  return `${aHead("Tarptautinė atranka", "Užsienio statybų įmonės ieško darbuotojų iš Lietuvos – statybos24.lt/hire", `<div class="row" style="gap:8px"><button class="btn sm" type="button" data-act="hOpen" data-v="landing">${svg("eye", 14)}Atidaryti /hire puslapį</button></div>`)}
  <section class="card fh-how"><ol>${steps.map(([t, p], i) => `<li><span>${i + 1}</span><div><b>${t}</b><small>${p}</small></div></li>`).join("")}</ol></section>
  <div class="abar2">${aSearch("fh", "Įmonė, šalis ar kontaktas")}${aChips("fh", [["all", "Visos", R.length], ["new", "Naujos", R.filter(grp.new).length], ["wait", "Reikia veiksmo", R.filter(grp.wait).length], ["src", "Vyksta paieška", R.filter(grp.src).length]])}</div>
  <div class="list fhl">${L.length ? L.map((r) => { const nc = r.needs.reduce((a, n) => a + n.n, 0), hired = r.needs.reduce((a, n) => a + n.cands.filter((c) => ["hired", "started"].includes(c.st)).length, 0); return `<button type="button" class="card fh-row" data-act="aHireOpen" data-id="${r.id}"><div class="fh-rl"><span class="av co sm" style="border:1px solid var(--line)">${ini(r.co)}</span><div><b>${esc(r.co)}</b><small>${esc(hOpt(r.country))} · ${esc(r.contact)} · ${ago(r.d)}</small></div></div><div class="fh-rm"><span class="small muted">Poreikių: <b>${r.needs.length}</b> · Darbuotojų: <b>${hired}/${nc}</b></span>${r.agr === "signed" ? pill("Sutartis laukia patvirtinimo", "orange") : ""}${pill(...HR_ST[r.st])}</div></button>`; }).join("") : `<section class="card">${empty("Užklausų nėra", "", "people")}</section>`}</div>`;
}
function aHireReq() {
  const r = hReq(S.aHire); if (!r) { S.view = "foreign"; return aHire(); }
  const nx = { new: ["under_review", "Pradėti peržiūrą"], under_review: ["access_preparing", "Ruošti prieigą"], access_preparing: ["waiting_employer", "Sukurti prieigą ir išsiųsti sutartį"], employer_submitted: ["ready_for_sourcing", "Patvirtinti – paruošta paieškai"], ready_for_sourcing: ["sourcing", "Pradėti paiešką"] }[r.st];
  const agr = { none: ["Neparuošta", ""], sent: ["Išsiųsta – laukiama parašo", "orange"], signed: ["Pasirašyta įkelta – patikrinkite", "orange"], approved: ["Patvirtinta", "green"] }[r.agr];
  return `<button type="button" class="linkbtn" data-act="aHireBack">← Tarptautinė atranka</button>
  ${aHead(esc(r.co), `${esc(hOpt(r.country))} · užklausa gauta ${ago(r.d).toLowerCase()}`, `<div class="row" style="gap:8px;flex-wrap:wrap">${pill(...HR_ST[r.st])}${r.access ? `<button class="btn sm" type="button" data-act="hOpenPortal" data-id="${r.id}">${svg("eye", 14)}Kaip mato įmonė</button>` : ""}</div>`)}
  <div class="jd-grid"><div class="jd-main">
   <section class="card"><header><div><h2>Būsena</h2></div></header>
    ${(() => { const ks = Object.keys(HR_ST).filter((k) => !["declined", "closed"].includes(k)), ci = ks.indexOf(r.st); return `<div class="fh-steps">${ks.map((k, i) => `<span class="${ci >= 0 && i <= ci ? "on" : ""}${r.st === k ? " cur" : ""}">${HR_ST[k][0]}</span>`).join("")}</div>`; })()}
    <div class="row" style="gap:8px;flex-wrap:wrap">${nx ? `<button class="btn primary" type="button" data-act="aHireSt" data-id="${r.id}" data-v="${nx[0]}">${nx[1]}</button>` : r.st === "waiting_employer" ? `<span class="small muted">Laukiama, kol įmonė pasirašys sutartį ir pateiks poreikį.</span>` : ""}${!["declined", "closed"].includes(r.st) ? `<button class="btn" type="button" data-act="aHireSt" data-id="${r.id}" data-v="closed">Uždaryti</button><button class="btn danger" type="button" data-act="aHireSt" data-id="${r.id}" data-v="declined">Atmesti</button>` : `<button class="btn" type="button" data-act="aHireSt" data-id="${r.id}" data-v="under_review">Atnaujinti</button>`}</div></section>
   <section class="card"><header><div><h2>Darbuotojų poreikiai · ${r.needs.length}</h2></div></header>
    ${r.needs.length ? r.needs.map((n) => aHireNeed(r, n)).join("") : `<p class="small muted" style="margin:0">${r.access ? "Įmonė dar nepateikė poreikio portale." : "Poreikius įmonė pateiks portale, kai suteiksite prieigą."}</p>`}</section>
  </div>
  <aside class="jd-side">
   <section class="card"><h2>Kontaktas</h2><div class="kv one"><div><small>Kontaktinis asmuo</small><b>${esc(r.contact)} · ${esc(r.job)}</b></div><div><small>El. paštas</small><b>${esc(r.email)}</b></div><div><small>Telefonas</small><b>${esc(r.phone || "—")}</b></div><div><small>Portalo prieiga</small><b>${r.access ? `${esc(r.loginId || "")} · ${r.pw ? "aktyvi" : "dar neprisijungė"}` : "Nesukurta"}</b></div></div></section>
   <section class="card"><h2>Tarpininkavimo sutartis</h2>${pill(...agr)}<div class="row" style="gap:8px;flex-wrap:wrap">${r.agr === "signed" ? `<button class="btn sm primary" type="button" data-act="aHireAgr" data-id="${r.id}" data-v="approved">${svg("check", 14, 2.6)}Patvirtinti sutartį</button><button class="btn sm" type="button" data-act="aHireAgr" data-id="${r.id}" data-v="sent">Grąžinti pataisyti</button>` : ""}${r.access && r.agr === "none" ? `<button class="btn sm" type="button" data-act="aHireAgr" data-id="${r.id}" data-v="sent">${svg("upload", 14)}Įkelti sutartį įmonei</button>` : ""}${r.agr !== "none" ? `<button class="btn sm" type="button" data-act="toast" data-msg="Tikroje svetainėje atsidarys sutarties PDF">${svg("file", 14)}Peržiūrėti</button>` : ""}</div></section>
   <section class="card"><h2>Sąskaitos</h2>${r.inv.length ? `<div class="list">${r.inv.map((i, k) => `<div class="fh-inv"><div><b>${esc(i.no)}</b><small>${i.sum.toLocaleString("lt-LT")} € · iki ${i.due}</small></div>${i.st === "paid" ? pill("Apmokėta", "green") : `<button class="btn sm" type="button" data-act="aHirePaid" data-id="${r.id}" data-v="${k}">Pažymėti apmokėta</button>`}</div>`).join("")}</div>` : `<p class="small muted" style="margin:0">Sąskaitų dar nėra.</p>`}<button class="btn sm" type="button" data-act="aHireInv" data-id="${r.id}">${svg("plus", 14, 2.4)}Išrašyti sąskaitą</button></section>
   <button type="button" class="linkbtn dangerlink" data-act="aHireDel" data-id="${r.id}">Ištrinti užklausą ir visus jos duomenis</button>
  </aside></div>`;
}
function aHireNeed(r, n) {
  const open = S.aHireNeed === n.id, nst = HN_ST[n.st];
  const nnx = { new: ["approved", "Patvirtinti poreikį"], under_review: ["approved", "Patvirtinti poreikį"], approved: ["sourcing", "Pradėti paiešką"], sourcing: ["completed", "Užbaigti – visi įdarbinti"] }[n.st];
  const hired = n.cands.filter((c) => ["hired", "started"].includes(c.st)).length;
  return `<div class="fh-need${open ? " open" : ""}"><button type="button" class="fh-nh" data-act="aHireNeedTgl" data-id="${n.id}"><div><b>${esc(n.title)}</b><small>${esc(n.prof)} · ${n.n} darb. · ${esc(n.addr)} · pradžia ${n.start} · ${n.sal} ${n.cur} ${n.basis === "net" ? "neto" : "bruto"}</small></div><span class="row" style="gap:8px"><span class="small muted">Įdarbinta ${hired}/${n.n} · Kandidatų ${n.cands.length}</span>${pill(nst[1], nst[2])}</span></button>
   ${open ? `<div class="fh-nb">
     <div class="row" style="gap:8px;flex-wrap:wrap">${nnx ? `<button class="btn sm primary" type="button" data-act="aHireNeedSt" data-r="${r.id}" data-id="${n.id}" data-v="${nnx[0]}">${nnx[1]}</button>` : ""}${!["declined", "completed"].includes(n.st) ? `<button class="btn sm danger" type="button" data-act="aHireNeedSt" data-r="${r.id}" data-id="${n.id}" data-v="declined">Atmesti poreikį</button>` : ""}<button class="btn sm" type="button" data-act="aHireInfo" data-id="${n.id}">${S.aHireInfo === n.id ? "Slėpti sąlygas" : "Visos sąlygos"}</button></div>
     ${S.aHireInfo === n.id ? `<div class="fh-info">${(() => { const o = S.hLang; S.hLang = "lt"; const h = hpNeedInfo(n); S.hLang = o; return h; })()}</div>` : ""}
     <div class="fh-ch"><b>Kandidatai</b>${["approved", "sourcing"].includes(n.st) ? `<button class="btn sm" type="button" data-act="aHireAdd" data-r="${r.id}" data-id="${n.id}">${svg("plus", 14, 2.4)}Pridėti kandidatą</button>` : `<span class="small muted">Kandidatus galėsite pridėti patvirtinus poreikį.</span>`}</div>
     ${n.cands.length ? `<div class="fh-cands">${n.cands.map((c) => aHireCand(r, n, c)).join("")}</div>` : ""}
   </div>` : ""}</div>`;
}
function aHireCand(r, n, c) {
  const i = hcIdx(c.st), next = i >= 0 && i < HC_ST.length - 1 ? HC_ST[i + 1] : null, ended = c.st === "rejected" || c.st === "withdrawn";
  let block = "";
  if (c.resp === "not_suitable") block = "Darbdavys atmetė kandidatą – pažymėkite jį atmestu.";
  else if (next && ["presented", "interview", "offer", "hired", "started"].includes(next[0]) && !["signed_uploaded", "approved"].includes(c.agr)) block = "Pirmiausia įkelkite pasirašytą kandidato tarpininkavimo sutartį.";
  else if (next && ["interview", "offer", "hired", "started"].includes(next[0]) && !c.resp) block = "Laukiama darbdavio sprendimo portale.";
  else if (next && ["hired", "started"].includes(next[0]) && c.resp !== "accepted") block = "Pirmiausia darbdavys turi patvirtinti kandidatą.";
  else if (next && ["hired", "started"].includes(next[0]) && !c.contract) block = "Pirmiausia darbdavys turi įkelti pasirašytą darbo sutartį.";
  const agrNext = { not_prepared: ["waiting_signature", "Išsiųsti sutartį kandidatui"], waiting_signature: ["signed_uploaded", "Įkelti pasirašytą sutartį"], signed_uploaded: ["approved", "Patvirtinti sutartį"], rejected: ["waiting_signature", "Išsiųsti iš naujo"] }[c.agr];
  return `<div class="fh-cand"><div class="fh-cl"><span class="av lt sm">${ini(c.name)}</span><div><b>${esc(c.name)}</b><small>${esc(c.prof)} · ${c.src === "external" ? "Išorinis kandidatas" : "Statybos24 bazė"} · ${esc(c.langs)}</small></div></div>
    <div class="fh-cst"><span class="pill ${ended ? "red" : i >= hcIdx("hired") ? "green" : ""}">${hcLab(c.st)}</span><span class="pill ${HC_AGR[c.agr][1]}">Sutartis: ${HC_AGR[c.agr][0]}</span><span class="pill ${c.resp === "not_suitable" ? "red" : c.resp ? "green" : ""}">Darbdavys: ${c.resp ? HC_RESP[c.resp][1] : "Laukiama atsakymo"}</span></div>
    ${c.resp === "not_suitable" && c.reason ? `<p class="small muted" style="margin:0">Atmetimo priežastis: ${esc(c.reason)}</p>` : ""}
    ${!ended ? `<div class="fh-cact">${next ? `<button class="btn sm primary" type="button" data-act="aHireCSt" data-r="${r.id}" data-n="${n.id}" data-id="${c.id}" data-v="${next[0]}"${block ? ` disabled title="${esc(block)}"` : ""}>→ ${next[1]}</button>` : ""}${agrNext ? `<button class="btn sm" type="button" data-act="aHireCAgr" data-r="${r.id}" data-n="${n.id}" data-id="${c.id}" data-v="${agrNext[0]}">${agrNext[1]}</button>` : ""}${!c.emailShared && c.resp && c.resp !== "not_suitable" ? `<button class="btn sm" type="button" data-act="aHireMail" data-r="${r.id}" data-n="${n.id}" data-id="${c.id}">Perduoti el. paštą</button>` : ""}${c.resp === "not_suitable" ? `<button class="btn sm" type="button" data-act="aHireCSt" data-r="${r.id}" data-n="${n.id}" data-id="${c.id}" data-v="rejected">Pažymėti atmestu</button>` : ""}<button class="btn sm ghost" type="button" data-act="aHireCSt" data-r="${r.id}" data-n="${n.id}" data-id="${c.id}" data-v="withdrawn">Pasitraukė</button></div>${block && next ? `<p class="small muted" style="margin:0">${block}</p>` : ""}` : ""}</div>`;
}

/* ---------- Veiksmai ---------- */
const hFind = (el) => { const r = hReq(el.dataset.r || S.hpReq), n = hNeed(r, el.dataset.n), c = n && n.cands.find((x) => x.id === el.dataset.id); return { r, n, c }; };
const HIRE_ACT = {
  hOpen(el) { S.screen = "hire"; S.hpage = el.dataset.v || "landing"; S.modal = null; render(); window.scrollTo(0, 0); },
  hOpenPortal(el) { S.screen = "hire"; S.hpReq = el.dataset.id; const r = hReq(el.dataset.id); S.hpage = r.pw ? "home" : "setpw"; render(); window.scrollTo(0, 0); },
  hGo(el) { const v = el.dataset.v; if (v === "request" || v === "landing") { S.hForm = {}; S.hErr = {}; if (v === "request") S.hpage = "landing"; } if (v === "newneed") { S.hnf = null; S.hnErr = ""; } S.hpage = v === "request" ? "landing" : v; render(); window.scrollTo(0, 0); return false; },
  hLang(el) { S.hLang = el.dataset.v; },
  hpLang(el) { S.hpLang = el.dataset.v; },
  hDemoLogin(el) { const r = hReq(el.dataset.id); S.hlEmail = r.loginId; S.hpReq = r.id; S.hpage = r.pw ? "home" : "setpw"; render(); window.scrollTo(0, 0); return false; },
  hLogout() { S.hpReq = null; S.hpage = "login"; },
  hpSign() { const r = hReq(S.hpReq); r.agr = "signed"; if (r.st === "waiting_employer" && r.needs.length) r.st = "employer_submitted"; toast(tr("Signed agreement uploaded. Statybos24 will review it.", "Pasirašyta sutartis įkelta. Statybos24 ją peržiūrės.")); },
  hpNeed(el) { S.hpNeed = el.dataset.id; S.hpInfo = false; S.hpage = "need"; render(); window.scrollTo(0, 0); return false; },
  hpInfo() { S.hpInfo = !S.hpInfo; },
  hpResp(el) { const { c } = hFind(el); c.resp = el.dataset.v; toast(c.resp === "accepted" ? tr("Candidate approved. Statybos24 will coordinate the next step.", "Kandidatas patvirtintas. Statybos24 suderins kitą žingsnį.") : tr("Interview requested. Statybos24 will coordinate the next step.", "Paprašytas interviu. Statybos24 suderins kitą žingsnį.")); },
  hpReject(el) { openModal({ type: "hReject", r: el.dataset.r || S.hpReq, n: el.dataset.n, id: el.dataset.id }); },
  hpRejectOk(el) { const why = (document.getElementById("hr-why").value || "").trim(); if (why.length < 3) { document.getElementById("hr-err").textContent = tr("Please tell us why the candidate is not suitable.", "Nurodykite, kodėl kandidatas netinka."); return false; } const r = hReq(S.hpReq), n = hNeed(r, el.dataset.n), c = n.cands.find((x) => x.id === el.dataset.id); c.resp = "not_suitable"; c.reason = why; S.modal = null; toast(tr("Candidate rejected. The reason was sent to Statybos24.", "Kandidatas atmestas. Priežastis perduota Statybos24.")); },
  hpContract(el) { const r = hReq(S.hpReq), n = hNeed(r, el.dataset.n), c = n.cands.find((x) => x.id === el.dataset.id); c.contract = true; toast(tr("Employment contract uploaded.", "Darbo sutartis įkelta.")); },
  hnSet(el) { hnSync(); const f = S.hnf; const v = el.dataset.v; f[el.dataset.k] = v === "true" ? true : v === "false" ? false : v; },
  aHireOpen(el) { S.aHire = el.dataset.id; S.aHireNeed = null; go("fhreq"); },
  aHireBack() { go("foreign"); },
  aHireSt(el) { const r = hReq(el.dataset.id), v = el.dataset.v; r.st = v; if (v === "waiting_employer") { r.access = true; if (!r.loginId) r.loginId = "ID-" + String(100000 + Math.floor(Math.random() * 899999)); if (r.agr === "none") r.agr = "sent"; } aLog("Tarptautinė užklausa: " + HR_ST[v][0].toLowerCase(), r.co); toast(v === "waiting_employer" ? `Prieiga sukurta (${r.loginId}) – prisijungimo duomenys išsiųsti ${r.email}` : `${r.co}: ${HR_ST[v][0]}`); },
  aHireAgr(el) { const r = hReq(el.dataset.id); r.agr = el.dataset.v; if (r.agr === "sent" && !r.access) { r.access = true; if (!r.loginId) r.loginId = "ID-" + String(100000 + Math.floor(Math.random() * 899999)); } aLog("Tarptautinė sutartis", `${r.co} · ${r.agr}`); toast(r.agr === "approved" ? "Sutartis patvirtinta – įmonė gali teikti poreikius" : "Sutartis išsiųsta įmonei"); },
  aHireNeedTgl(el) { S.aHireNeed = S.aHireNeed === el.dataset.id ? null : el.dataset.id; },
  aHireInfo(el) { S.aHireInfo = S.aHireInfo === el.dataset.id ? null : el.dataset.id; },
  aHireNeedSt(el) { const r = hReq(el.dataset.r), n = hNeed(r, el.dataset.id); n.st = el.dataset.v; if (n.st === "sourcing" && !["sourcing"].includes(r.st)) r.st = "sourcing"; aLog("Tarptautinis poreikis: " + HN_ST[n.st][1].toLowerCase(), `${r.co} · ${n.title}`); toast(`${n.title}: ${HN_ST[n.st][1]}`); },
  aHireAdd(el) { openModal({ type: "aHireAdd", r: el.dataset.r, n: el.dataset.id, src: "base" }); },
  aHireAddSrc(el) { S.modal.src = el.dataset.v; render(true); return false; },
  aHireAddBase(el) { const r = hReq(S.modal.r), n = hNeed(r, S.modal.n), w = WORKERS[el.dataset.id]; if (n.cands.some((c) => c.wid === w.id)) { toast("Šis darbuotojas jau pridėtas"); return false; } n.cands.push({ id: "hc" + Date.now(), wid: w.id, src: "base", name: w.name, prof: n.prof, exp: `${w.jobs} darbų platformoje`, langs: "—", age: 30, lic: "—", from: n.start, needsAcc: true, st: "found", agr: "not_prepared", resp: null, reason: "", emailShared: false, contract: false, note: `Patikimumas ${w.att}/100${w.rating ? `, įvertinimas ${String(w.rating).replace(".", ",")}/10` : ""}.`, unseen: false }); S.modal = null; aLog("Pridėtas kandidatas", `${w.name} → ${n.title}`); toast(`${w.name} pridėtas kaip kandidatas`); },
  aHireCSt(el) { const { r, n, c } = hFind(el); c.st = el.dataset.v; if (c.st === "presented") c.unseen = true; if (n.cands.filter((x) => ["hired", "started"].includes(x.st)).length >= n.n && n.st === "sourcing") { n.st = "completed"; toast("Visi reikalingi darbuotojai įdarbinti. Paieška uždaryta."); } else toast(`${c.name}: ${hcLab(c.st)}`); aLog("Kandidato būsena", `${c.name} · ${hcLab(c.st)}`); },
  aHireCAgr(el) { const { c } = hFind(el); c.agr = el.dataset.v; toast(`${c.name} sutartis: ${HC_AGR[c.agr][0]}`); },
  aHireMail(el) { const { c } = hFind(el); c.emailShared = true; c.unseen = true; aLog("Perduotas kandidato el. paštas", c.name); toast("Kandidato el. paštas perduotas darbdaviui. Telefono numeris lieka privatus."); },
  aHirePaid(el) { const r = hReq(el.dataset.id); r.inv[+el.dataset.v].st = "paid"; toast("Sąskaita pažymėta apmokėta"); },
  aHireInv(el) { openModal({ type: "aHireInv", r: el.dataset.id }); },
  aHireDel(el) { openModal({ type: "aHireDel", r: el.dataset.id }); },
  aHireDelOk(el) { H().requests = H().requests.filter((x) => x.id !== el.dataset.id); S.modal = null; aLog("Ištrinta tarptautinė užklausa", el.dataset.id); toast("Užklausa, prieiga, kandidatai ir susiję dokumentai ištrinti."); go("foreign"); }
};
Object.assign(ACT, HIRE_ACT);
Object.assign(ACT_PERM, { aHireSt: "foreign", aHireAgr: "foreign", aHireNeedSt: "foreign", aHireAdd: "foreign", aHireAddBase: "foreign", aHireCSt: "foreign", aHireCAgr: "foreign", aHireMail: "foreign", aHirePaid: "foreign", aHireInv: "foreign", aHireDel: "delete", aHireDelOk: "delete" });
VIEW_PERM.fhreq = "foreign";
VIEWS.admin.foreign = aHire;
VIEWS.admin.fhreq = aHireReq;
function hnSync() { const f = S.hnf; if (!f) return; document.querySelectorAll("[data-hn]").forEach((e) => { f[e.dataset.hn] = e.value; }); }
Object.assign(FORMS, {
  hRequest() { const t = hc().ir.errors, g = (k) => (document.getElementById("hf-" + k) || {}).value || "", v = { co: g("co").trim(), country: g("country"), contact: g("contact").trim(), job: g("job").trim(), email: g("email").trim(), phone: g("phone").trim(), ok: document.getElementById("hf-ok").checked }, e = {};
    if (!v.co) e.co = t.companyName; if (!v.country) e.country = t.companyCountry; if (!v.contact) e.contact = t.contactName; if (!v.job) e.job = t.jobTitle; if (!v.email) e.email = t.email; else if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v.email)) e.email = t.emailValid; if (!v.ok) e.ok = t.consent;
    S.hForm = v; S.hErr = e; if (Object.keys(e).length) { render(true); return; }
    H().requests.unshift({ id: "hr" + (++H().seq) + Date.now() % 1000, co: v.co, country: v.country, contact: v.contact, job: v.job, email: v.email, phone: v.phone, d: 0, st: "new", access: false, pw: false, agr: "none", needs: [], inv: [] });
    S.hpage = "done"; render(); window.scrollTo(0, 0); },
  hLogin() { const e = (document.getElementById("hl-e").value || "").trim().toUpperCase(), p = (document.getElementById("hl-p").value || ""), r = H().requests.find((x) => x.access && (x.loginId || "").toUpperCase() === e); if (!e || !p) { document.getElementById("hl-err").textContent = hLc().missing; return; } if (!r) { document.getElementById("hl-err").textContent = hLc().accessDenied; return; } S.hpReq = r.id; S.hpage = r.pw ? "home" : "setpw"; render(); window.scrollTo(0, 0); },
  hSetPw() { const a = document.getElementById("hp-p1").value, b = document.getElementById("hp-p2").value, err = document.getElementById("hp-err"); if (a.length < 12 || !/[A-Z]/.test(a) || !/[a-z]/.test(a) || !/\d/.test(a)) { err.textContent = tr("Use at least 12 characters with uppercase, lowercase and a number.", "Naudokite bent 12 simbolių, didžiąją raidę, mažąją raidę ir skaičių."); return; } if (a !== b) { err.textContent = tr("Passwords do not match.", "Slaptažodžiai nesutampa."); return; } hReq(S.hpReq).pw = true; S.hpage = "home"; render(); toast(tr("Password updated.", "Slaptažodis atnaujintas.")); },
  hNeed() { hnSync(); const f = S.hnf, r = hReq(S.hpReq), req = ["title", "prof", "n", "addr", "start", "by", "emp", "dur", "hours", "sal", "cur", "freq"];
    const miss = req.filter((k) => !String(f[k] ?? "").trim());
    if (miss.length) { S.hnErr = tr("Complete all required fields marked with *.", "Užpildykite visus privalomus laukus, pažymėtus *."); render(true); return; }
    if (+f.hours < 1 || +f.hours > 80) { S.hnErr = tr("Enter weekly working hours (1–80).", "Nurodykite darbo valandų per savaitę skaičių (1–80)."); render(true); return; }
    if (f.ot && !String(f.otPay || "").trim()) { S.hnErr = tr("Enter how overtime is paid.", "Nurodykite, kaip apmokami viršvalandžiai."); render(true); return; }
    r.needs.unshift(Object.assign({}, f, { id: "hn" + Date.now(), n: +f.n, hours: +f.hours, st: "new", d: 0, cands: [] }));
    if (["waiting_employer"].includes(r.st)) r.st = "employer_submitted";
    S.hnf = null; S.hnErr = ""; S.hpage = "home"; render(); window.scrollTo(0, 0); toast(tr("Workforce need submitted to Statybos24.", "Darbuotojų poreikis pateiktas Statybos24.")); },
  aHireInv() { const m = S.modal, r = hReq(m.r), sum = +(document.getElementById("hi-sum").value || 0), due = document.getElementById("hi-due").value; if (!sum || !due) { document.getElementById("hi-err").textContent = "Įrašykite sumą ir apmokėjimo datą."; return; } r.inv.push({ no: `S24-H-2026-${String(10 + r.inv.length + H().seq).padStart(3, "0")}`, sum, due, st: "unpaid" }); S.modal = null; aLog("Išrašyta sąskaita", `${r.co} · ${sum} €`); render(true); toast("Sąskaita išrašyta – įmonė ją matys portale"); },
  aHireExt() { const m = S.modal, r = hReq(m.r), n = hNeed(r, m.n), nm = capName((document.getElementById("he-n").value || "").trim()); if (nm.split(" ").filter(Boolean).length < 2) { document.getElementById("he-err").textContent = "Įrašykite kandidato vardą ir pavardę."; return; } n.cands.push({ id: "hc" + Date.now(), wid: null, src: "external", name: nm, prof: (document.getElementById("he-p").value || n.prof).trim(), exp: (document.getElementById("he-x").value || "").trim(), langs: (document.getElementById("he-l").value || "").trim(), age: +(document.getElementById("he-a").value || 0) || 30, lic: "—", from: n.start, needsAcc: true, st: "found", agr: "not_prepared", resp: null, reason: "", emailShared: false, contract: false, note: (document.getElementById("he-c").value || "").trim(), unseen: false }); S.modal = null; aLog("Pridėtas išorinis kandidatas", `${nm} → ${n.title}`); render(true); toast(`${nm} pridėtas`); }
});
Object.assign(ACT_PERM, { aHireInv: "foreign", aHireExt: "foreign" });
["aHireSt", "aHireAgr", "aHireNeedSt", "aHireAdd", "aHireAddBase", "aHireCSt", "aHireCAgr", "aHireMail", "aHirePaid", "aHireInv", "aHireDel", "aHireDelOk"].forEach((k) => { const f = ACT[k]; if (!f) return; ACT[k] = function (el) { if (S.role === "admin" && S.screen === "app" && !admCan(ACT_PERM[k])) { toast("Neturite teisės atlikti šio veiksmo"); return false; } return f.call(this, el); }; });
function hireModal(m, head) {
  if (m.type === "hReject") return head(tr("Reject", "Atmesti"), tr("Why are you rejecting this candidate?", "Kodėl atmetate šį kandidatą?")) + `<label class="field" for="hr-why">${tr("Rejection reason", "Atmetimo priežastis")}<textarea id="hr-why"></textarea></label><p class="ferr" id="hr-err"></p><div class="row" style="justify-content:flex-end;gap:8px"><button class="btn" type="button" data-close-modal>${tr("Cancel", "Atšaukti")}</button><button class="btn danger" type="button" data-act="hpRejectOk" data-n="${m.n}" data-id="${m.id}">${tr("Reject", "Atmesti")}</button></div>`;
  if (m.type === "aHireInv") return head("Sąskaita", "Išrašyti sąskaitą įmonei") + `<form data-form="aHireInv" class="form" novalidate><label class="field" for="hi-sum">Suma, €<input id="hi-sum" type="number" min="1" placeholder="pvz. 2400"></label><label class="field" for="hi-due">Apmokėti iki<input id="hi-due" type="date"></label><p class="ferr" id="hi-err"></p><div class="row" style="justify-content:flex-end"><button class="btn primary" type="submit">Išrašyti</button></div></form>`;
  if (m.type === "aHireDel") return head("Ištrinti", "Ištrinti tarptautinę užklausą?") + `<p class="muted">Bus ištrinta užklausa, portalo prieiga, kandidatai ir susiję dokumentai. Veiksmo atšaukti negalima.</p><div class="row" style="justify-content:flex-end;gap:8px"><button class="btn" type="button" data-close-modal>Atšaukti</button><button class="btn danger" type="button" data-act="aHireDelOk" data-id="${m.r}">Ištrinti</button></div>`;
  if (m.type === "aHireAdd") {
    const r = hReq(m.r), n = hNeed(r, m.n), used = n.cands.map((c) => c.wid);
    return head("Kandidatas", `Pridėti kandidatą · ${esc(n.title)}`) + `<div class="seg" role="group"><button type="button" data-act="aHireAddSrc" data-v="base" aria-pressed="${m.src === "base"}">Statybos24 bazė</button><button type="button" data-act="aHireAddSrc" data-v="ext" aria-pressed="${m.src === "ext"}">Išorinis kandidatas</button></div>` +
      (m.src === "base" ? `<p class="small muted" style="margin:0">Darbuotojai, pažymėję, kad domisi darbu užsienyje.</p><div class="list">${hAbroad().map((w) => `<div class="co-line fh-pick"><div class="av lt sm">${ini(w.name)}</div><div><b>${esc(w.name)}</b><small>${esc(w.city)} · patikimumas ${w.att}/100${w.rating ? ` · ${String(w.rating).replace(".", ",")}/10` : ""}${hAbrC(w.id) ? ` · domina: ${hAbrC(w.id)}` : ""}</small></div>${used.includes(w.id) ? pill("Pridėtas", "green") : `<button class="btn sm" type="button" data-act="aHireAddBase" data-id="${w.id}">Pridėti</button>`}</div>`).join("") || '<p class="small muted">Tokių darbuotojų nėra.</p>'}</div>`
        : `<form data-form="aHireExt" class="form" novalidate><label class="field" for="he-n">Vardas ir pavardė<input id="he-n" class="nmcap"></label><label class="field" for="he-p">Profesija<input id="he-p" value="${esc(n.prof)}"></label><label class="field" for="he-x">Patirtis<input id="he-x" placeholder="Pvz. 6 m. gipso montavimas, metalinis karkasas, lubos, Q2/Q3"></label><label class="field" for="he-l">Kalbos<input id="he-l" placeholder="Pvz. English B1"></label><label class="field" for="he-a">Amžius<input id="he-a" type="number" placeholder="Pvz. 34"></label><label class="field" for="he-c">Komentaras<textarea id="he-c" placeholder="Trumpas mano komentaras apie kandidatą, pokalbį ar tinkamumą šiai užklausai..."></textarea></label><p class="ferr" id="he-err"></p><div class="row" style="justify-content:flex-end"><button class="btn primary" type="submit">Pridėti kandidatą</button></div></form>`);
  }
  return "";
}
