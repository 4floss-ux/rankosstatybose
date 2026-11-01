function publicPage() {
  const ck = svg("check", 16, 2.6);
  const li = (t) => `<li>${ck}<span>${t}</span></li>`;
  const tile = (cls, ic, t, p, vis) => `<article class="lp-tile ${cls}" data-rv><div class="lp-tic">${svg(ic, 20)}</div><h3>${t}</h3><p>${p}</p>${vis || ""}</article>`;
  const flowE = [["Sukurkite darbą", "Vieta, data, laikas, atlygis ir kiek žmonių reikia. Su šablonais – vienu paspaudimu."], ["Pakvieskite tinkamus", "Matote, kas tą dieną laisvas, jų patikimumą ir įvertinimus. Kviesti galite kiek norite – vietas užims pirmieji priėmę."], ["Valdykite darbo dieną", "Darbuotojai pažymi „Atvykau“, jūs patvirtinate, uždarote dieną ir įvertinate."]];
  const flowW = [["Pažymėkite, kada galite", "Užpildote grafiką arba įjungiate „Laisvas dabar“. Nereikia CV."], ["Gaukite kvietimą", "Iš karto matote darbą, vietą, laiką ir atlygį – sprendžiate patys."], ["Dirbkite ir kaupkite reputaciją", "Kiekviena užbaigta diena ir įvertinimas kelia jūsų patikimumą."]];
  const fl = S.lpFlow === "w" ? flowW : flowE;
  return `<header class="pub-top lp-top"><div class="pub-in"><a href="#" aria-label="statybos24.lt"><img src="${LOGO_SRC}" alt="statybos24.lt"></a><nav class="pub-nav" aria-label="Pagrindinė navigacija"><a href="#kam" data-scroll="kam">Kam skirta</a><a href="#kaip" data-scroll="kaip">Kaip veikia</a><a href="#galimybes" data-scroll="galimybes">Galimybės</a><a href="#planai" data-scroll="planai">Planai</a></nav><div class="row" style="gap:8px"><button class="btn" type="button" data-act="auth" data-v="login">Prisijungti</button><button class="btn primary" type="button" data-act="auth" data-v="signup">Registruotis</button></div></div></header>
  <main class="lp">
  <section class="lp-hero"><div class="lp-glow" aria-hidden="true"></div><div class="pub-in lp-hero-in">
    <div class="lp-hero-tx">
      <span class="lp-eyebrow"><i></i>Statybų darbų platforma Lietuvoje</span>
      <h1>Žmonės statybų darbams.<br><span>Darbai žmonėms.</span></h1>
      <p>statybos24.lt sujungia įmones ir privačius darbdavius su darbuotojais, kurie gali dirbti tada, kai jų reikia – šiandien, rytoj ar ilgam.</p>
      <div class="lp-cta"><button class="btn primary lp-big" type="button" data-act="auth" data-v="signup-emp">Ieškau darbuotojų</button><button class="btn lp-big lp-ghost" type="button" data-act="auth" data-v="signup-wk">Ieškau darbo</button></div>
      <ul class="lp-proof">${li("Darbuotojams – nemokamai")}${li("Be CV ir tarpininkų")}${li("Darbas matomas prieš sutinkant")}</ul>
    </div>
    <div class="lp-phone-wrap" aria-hidden="true"><div class="lp-phone"><div class="lp-notch"></div>
      <div class="lp-scr">
        <div class="lp-n n1"><small>Naujas kvietimas</small><b>PAGALBINIAI MŪRO DARBAI</b><span>Rytoj · 07:30–16:30 · Vilnius</span><em>15 € į rankas / val.</em><div class="lp-nb"><i>Atmesti</i><i class="ok">Priimti</i></div></div>
        <div class="lp-n n2"><span class="lp-av">TK</span><div><b>Tomas K. priėmė darbą</b><span>Komanda 3 / 3 surinkta</span></div></div>
        <div class="lp-n n3"><span class="lp-av g">${svg("check", 14, 3)}</span><div><b>Atvykimas patvirtintas</b><span>Šiandien 07:28 · Kalvarijų g.</span></div></div>
        <div class="lp-n n4"><span class="lp-av s">10</span><div><b>Darbas įvertintas 10/10</b><span>„Puikiai atliko užduotis“</span></div></div>
      </div></div></div>
  </div></section>

  <section class="lp-statement"><div class="pub-in"><p data-words>Statybose žmonių reikia greitai, o darbuotojai nori aiškumo. Mes sutvarkėme abu dalykus: darbdavys mato, kas tikrai gali atvykti, o darbuotojas – ką, kur ir už kiek dirbs, dar prieš sutikdamas.</p></div></section>

  <section class="lp-sec" id="kam"><div class="pub-in lp-col">
    <div class="lp-sh" data-rv><span class="lp-k">Kam skirta</span><h2>Viena platforma abiem darbo pusėms.</h2></div>
    <div class="lp-aud">
      <article class="lp-card dark" data-rv><span class="lp-k">Darbdaviams</span><h3>Įmonėms ir privatiems darbdaviams.</h3><p>Nuo vienos dienos pagalbos iki nuolatinės komandos – raskite žmones pagal miestą, datą ir realų prieinamumą.</p>
        <ul class="lp-list">${li("Darbuotojų paieška pagal prieinamumą")}${li("Kvietimai, atvykimų patvirtinimas ir darbo dienos uždarymas")}${li("Patikimumas, įvertinimai ir mėgstami darbuotojai")}${li("Darbo skelbimai ilgalaikiam darbui")}${li("Komanda su rolėmis: vadovas, vadybininkas, objekto vadovas")}</ul>
        <button class="btn primary" type="button" data-act="auth" data-v="signup-emp">Pradėti nemokamai</button></article>
      <article class="lp-card" data-rv><span class="lp-k">Darbuotojams</span><h3>Dirbantiems statybose ir pagalbiniuose darbuose.</h3><p>Pažymėkite, kada galite dirbti, ir gaukite aiškius pasiūlymus. Jokio CV siuntinėjimo ir laukimo.</p>
        <ul class="lp-list">${li("Darbo vieta, laikas ir atlygis matomi iš karto")}${li("Prieinamumo grafikas ir „Laisvas dabar“")}${li("Darbų istorija ir įvertinimai vienoje vietoje")}${li("Nuolatinio darbo skelbimai – kandidatuokite su profiliu")}${li("Registracija ir naudojimasis – nemokamai")}</ul>
        <button class="btn" type="button" data-act="auth" data-v="signup-wk">Registruotis darbuotojui</button></article>
    </div></div></section>

  <section class="lp-sec alt" id="kaip"><div class="pub-in lp-col">
    <div class="lp-sh" data-rv><span class="lp-k">Kaip veikia</span><h2>Trys žingsniai iki darbo dienos.</h2>
      <div class="toggle2 lp-tg" role="group" aria-label="Kam rodyti"><button type="button" data-act="lpFlow" data-v="e" aria-pressed="${S.lpFlow !== "w"}">Darbdaviui</button><button type="button" data-act="lpFlow" data-v="w" aria-pressed="${S.lpFlow === "w"}">Darbuotojui</button></div></div>
    <ol class="lp-steps">${fl.map(([t, p], i) => `<li data-rv style="--d:${i * 120}ms"><span class="lp-sn">${i + 1}</span><h3>${t}</h3><p>${p}</p></li>`).join("")}</ol>
  </div></section>

  <section class="lp-sec" id="galimybes"><div class="pub-in lp-col">
    <div class="lp-sh" data-rv><span class="lp-k">Ką rasite</span><h2>Viskas, ko reikia darbui organizuoti.</h2></div>
    <div class="lp-bento">
      ${tile("w2 dark", "mail", "Aiškūs darbo kvietimai", "Kvietime iš karto matyti darbas, adresas, laikas, pietų pertrauka ir atlygis – į rankas arba ant popieriaus.", `<div class="lp-mini"><span>Rytoj · 07:30–16:30</span><b>15 € / val.</b></div>`)}
      ${tile("", "cal", "Prieinamumo grafikas", "Darbuotojas pažymi dienas ir valandas – darbdavys mato tik tuos, kas tikrai laisvas.", `<div class="lp-days">${["Pr", "An", "Tr", "Ke", "Pe"].map((d, i) => `<i class="${i === 2 ? "" : "on"}">${d}</i>`).join("")}</div>`)}
      ${tile("", "shield", "Patikimumas ir įvertinimai", "Atvykimų istorija ir abipusiai įvertinimai 1–10 padeda rinktis žmones ir įmones.", `<div class="lp-score"><b>97</b><span>/100 patikimumas</span></div>`)}
      ${tile("", "chat", "Darbo pokalbiai", "Bendras pokalbis su visa darbo komanda ir privačios žinutės – istorija išlieka.")}
      ${tile("", "briefcase", "Darbo skelbimai", "Ilgalaikiam darbui: kandidatai kandidatuoja su savo profiliu, kviečiate į pokalbį tiesiai platformoje.")}
      ${tile("w2", "team", "Komanda ir rolės", "Savininkas, vadovas, vadybininkas ir objekto vadovas – kiekvienas mato ir daro tai, kas jam priskirta. Visi veiksmai matomi istorijoje.")}
    </div></div></section>

  <section class="lp-sec lp-why"><div class="pub-in lp-col">
    <div class="lp-sh" data-rv><span class="lp-k">Mūsų principai</span><h2>Sąžininga abiem pusėms.</h2></div>
    <div class="lp-why-g">
      <div data-rv><b>Viskas matoma prieš sutinkant</b><p>Jokių netikėtumų darbo dieną – sąlygos aiškios iš anksto.</p></div>
      <div data-rv style="--d:120ms"><b>Darbuotojams nemokama</b><p>Registracija, kvietimai ir darbas per platformą darbuotojui nekainuoja.</p></div>
      <div data-rv style="--d:240ms"><b>Be tarpininkų</b><p>Darbdavys atsiskaito su darbuotoju tiesiogiai – platforma tik padeda susitikti ir susitarti.</p></div>
    </div></div></section>

  <section class="lp-sec alt" id="planai"><div class="pub-in lp-col">
    <div class="lp-sh row-sh" data-rv><div><span class="lp-k">Darbdavių planai</span><h2>Pradėkite nemokamai.</h2><p class="lp-sub">Naujoms įmonėms – 30 dienų Business nemokamai, be kortelės.</p></div>${periodToggle()}</div>
    ${planCards(true)}
  </div></section>

  <section class="lp-sec"><div class="pub-in lp-col lp-faq-w">
    <div class="lp-sh" data-rv><span class="lp-k">Dažni klausimai</span><h2>Trumpai ir aiškiai.</h2></div>
    <div class="lp-faq">${[["Ar darbuotojui reikia mokėti?", "Ne. Darbuotojams registracija ir naudojimasis platforma – nemokami."], ["Ar reikia CV?", "Ne. Užtenka užpildyti profilį ir pažymėti, kada galite dirbti. CV gali paprašyti tik konkreti įmonė darbo skelbime."], ["Kas moka už darbą?", "Darbdavys atsiskaito su darbuotoju tiesiogiai. Platforma atlygio nemoka ir jo neperveda."], ["Ar galiu registruotis kaip privatus asmuo?", "Taip. Registruodamiesi pasirinkite „Privatus asmuo“ – pvz. jei reikia pagalbos statant ar remontuojant namą."]].map(([q, a]) => `<details data-rv><summary>${q}<i>${svg("plus", 16, 2.4)}</i></summary><p>${a}</p></details>`).join("")}</div>
  </div></section>

  <section class="lp-final"><div class="lp-glow" aria-hidden="true"></div><div class="pub-in lp-col" style="align-items:center;text-align:center" data-rv><h2>Raskite žmogų darbui<br>arba darbą sau.</h2><p>Registracija užtrunka kelias minutes.</p><div class="lp-cta" style="justify-content:center"><button class="btn primary lp-big" type="button" data-act="auth" data-v="signup-emp">Ieškau darbuotojų</button><button class="btn lp-big lp-ghost" type="button" data-act="auth" data-v="signup-wk">Ieškau darbo</button></div></div></section>
  </main>
  <footer class="foot"><div class="pub-in"><span>© ${TODAY.getFullYear()} statybos24.lt</span><span class="row" style="gap:16px"><a href="#" data-act="toast" data-msg="Naudojimosi sąlygos atsidarys kaip dabar">Naudojimosi sąlygos</a><a href="#" data-act="toast" data-msg="Privatumo politika atsidarys kaip dabar">Privatumo politika</a><a href="#" data-act="toast" data-msg="Rekvizitai atsidarys kaip dabar">Rekvizitai</a></span></div></footer>
  <div class="demo pubdemo" style="position:fixed;left:50%;transform:translateX(-50%);bottom:calc(14px + env(safe-area-inset-bottom,0px));z-index:40;box-shadow:0 10px 30px rgba(34,38,49,.18);max-width:calc(100% - 32px)"><span><strong>Prototipas</strong> · peržiūrėkite paskyrą:</span><div class="seg"><button type="button" data-act="enter" data-v="worker">Darbuotojas</button><button type="button" data-act="enter" data-v="employer">Darbdavys</button><button type="button" data-act="enter" data-v="admin">Admin</button></div></div>`;
}
/* Judesys: atsiradimas slenkant ir žodžių paryškinimas */
const LP_RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let lpIO = null;
function lpMotion() {
  if (S.screen !== "public") return;
  const words = document.querySelector("[data-words]");
  if (words && !words.dataset.split) { words.dataset.split = 1; words.innerHTML = words.textContent.split(" ").map((w) => `<span>${w}</span>`).join(" "); }
  if (LP_RM || !("IntersectionObserver" in window)) { document.querySelectorAll("[data-rv]").forEach((e) => e.classList.add("in")); return; }
  document.body.classList.add("lp-js");
  if (lpIO) lpIO.disconnect();
  lpIO = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); lpIO.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll("[data-rv]:not(.in)").forEach((e) => lpIO.observe(e));
  lpWords();
}
function lpWords() {
  const w = document.querySelector("[data-words]"); if (!w) return;
  const r = w.getBoundingClientRect(), vh = window.innerHeight;
  const p = Math.max(0, Math.min(1, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
  const sp = w.querySelectorAll("span"), n = Math.round(p * sp.length);
  sp.forEach((s, i) => s.classList.toggle("on", LP_RM || i < n));
}
window.addEventListener("scroll", () => { if (S.screen === "public") requestAnimationFrame(lpWords); }, { passive: true });
