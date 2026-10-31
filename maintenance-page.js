// Atnaujinimo puslapis, kurį Cloudflare worker grąžina visiems lankytojams, kai įjungtas MAINTENANCE_MODE.
// Puslapis visiškai savarankiškas: jokių nuorodų į svetainės JS ar CSS, kad niekas negalėtų užkrauti programos.
import { LOGO_LIGHT_PNG, MARK_PNG } from "./maintenance-assets.js";

const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export function maintenancePage({ until = "", error = "", next = "/" } = {}) {
  const untilMs = Date.parse(until);
  const hasUntil = Number.isFinite(untilMs);
  return `<!doctype html>
<html lang="lt">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<meta name="theme-color" content="#222631">
<title>Atsinaujiname | statybos24.lt</title>
<link rel="icon" type="image/png" href="data:image/png;base64,${MARK_PNG}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap">
<style>
:root{--navy:#222631;--lil:#6b5b95;--lil2:#c9b8f2;--apr:#e7c9a9;--line:rgba(255,255,255,.12);--muted:rgba(255,255,255,.68)}
*{box-sizing:border-box;margin:0;padding:0}
html,body{min-height:100%;background:var(--navy);color:#fff;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
body{min-height:100vh;display:flex;flex-direction:column;overflow-x:hidden}
.glow{position:fixed;inset:-30% -20% auto auto;width:900px;height:900px;border-radius:50%;background:radial-gradient(circle,rgba(107,91,149,.55),rgba(107,91,149,0) 62%);pointer-events:none}
.glow.b{inset:auto auto -45% -25%;width:760px;height:760px;opacity:.6}
header,main,footer{position:relative;width:100%;max-width:1080px;margin:0 auto;padding-left:max(20px,env(safe-area-inset-left));padding-right:max(20px,env(safe-area-inset-right))}
header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-top:24px}
header img{height:34px;width:auto;display:block}
.lang{display:flex;border:1px solid var(--line);border-radius:5px;overflow:hidden}
.lang button{border:0;background:none;color:var(--muted);font:600 12.5px Inter,sans-serif;padding:7px 11px;cursor:pointer}
.lang button[aria-pressed="true"]{background:#fff;color:var(--navy)}
main{flex:1;display:flex;flex-direction:column;justify-content:center;gap:28px;padding-top:48px;padding-bottom:48px}
.k{display:inline-flex;align-items:center;gap:10px;align-self:flex-start;padding:7px 12px;border-radius:5px;background:rgba(255,255,255,.07);border:1px solid var(--line);font-size:12.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--lil2)}
.k i{width:8px;height:8px;border-radius:50%;background:var(--apr);box-shadow:0 0 0 0 rgba(231,201,169,.6);animation:p 2s infinite}
@keyframes p{0%{box-shadow:0 0 0 0 rgba(231,201,169,.55)}70%{box-shadow:0 0 0 10px rgba(231,201,169,0)}100%{box-shadow:0 0 0 0 rgba(231,201,169,0)}}
h1{font-size:clamp(38px,6.4vw,76px);line-height:1.06;letter-spacing:-.04em;font-weight:800;max-width:820px}
h1 span{background:linear-gradient(90deg,var(--lil2),var(--apr));-webkit-background-clip:text;background-clip:text;color:transparent}
.lead{font-size:clamp(16px,1.8vw,19px);line-height:1.6;color:var(--muted);max-width:620px}
.cd{display:grid;grid-template-columns:repeat(4,minmax(0,120px));gap:12px}
.cd div{padding:18px 10px 14px;border-radius:8px;background:rgba(255,255,255,.06);border:1px solid var(--line);text-align:center}
.cd b{display:block;font-size:clamp(30px,5vw,46px);font-weight:800;letter-spacing:-.03em;font-variant-numeric:tabular-nums}
.cd small{display:block;margin-top:4px;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.when{font-size:14px;color:var(--muted)}
.when b{color:#fff;font-weight:600}
.late{display:none;padding:12px 14px;border-radius:6px;background:rgba(231,201,169,.12);border:1px solid rgba(231,201,169,.32);color:#f0dcc5;font-size:14.5px;max-width:620px}
.sorry{display:flex;gap:12px;align-items:flex-start;max-width:620px;padding-top:22px;border-top:1px solid var(--line);font-size:15px;line-height:1.55;color:var(--muted)}
.sorry svg{flex:none;margin-top:2px;color:var(--lil2)}
.sorry a{color:#fff}
footer{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding-bottom:22px;font-size:12.5px;color:rgba(255,255,255,.45)}
.adm{border:0;background:none;color:rgba(255,255,255,.45);font:500 12.5px Inter,sans-serif;cursor:pointer;text-decoration:underline;text-underline-offset:3px}
.adm:hover{color:#fff}
dialog{margin:auto;width:min(92vw,400px);padding:0;border:0;border-radius:8px;background:#fff;color:var(--navy);box-shadow:0 30px 70px rgba(0,0,0,.45)}
dialog::backdrop{background:rgba(15,17,23,.6);backdrop-filter:blur(3px)}
.dlg{padding:24px;display:flex;flex-direction:column;gap:14px}
.dlg h2{font-size:20px;letter-spacing:-.02em}
.dlg p{font-size:13.5px;color:#666879;line-height:1.5}
.dlg label{display:flex;flex-direction:column;gap:6px;font-size:12.5px;font-weight:700}
.dlg input{height:42px;padding:0 12px;border:1px solid #dcdfe5;border-radius:5px;font:500 15px Inter,sans-serif;color:var(--navy)}
.dlg input:focus{outline:2px solid rgba(107,91,149,.35);border-color:var(--lil)}
.dlg .err{color:#c2412d;font-size:13px;font-weight:600}
.row{display:flex;gap:8px;justify-content:flex-end}
.btn{height:42px;padding:0 16px;border-radius:5px;border:1px solid #dcdfe5;background:#fff;color:var(--navy);font:700 14px Inter,sans-serif;cursor:pointer}
.btn.p{background:var(--lil);border-color:var(--lil);color:#fff}
@media (max-width:560px){.cd{grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.cd div{padding:14px 4px 10px}.cd small{font-size:10.5px;letter-spacing:.04em}header img{height:28px}}
@media (prefers-reduced-motion:reduce){.k i{animation:none}}
</style>
</head>
<body>
<div class="glow" aria-hidden="true"></div><div class="glow b" aria-hidden="true"></div>
<header><img src="data:image/png;base64,${LOGO_LIGHT_PNG}" alt="statybos24.lt"><div class="lang" role="group" aria-label="Kalba"><button type="button" data-l="lt" aria-pressed="true">LT</button><button type="button" data-l="en" aria-pressed="false">EN</button></div></header>
<main>
  <span class="k"><i></i><span data-t="k">Vyksta atnaujinimas</span></span>
  <h1><span data-t="h1">Atsinaujiname.</span><br><span data-t="h2">Netrukus grįšime.</span></h1>
  <p class="lead" data-t="lead">Šiuo metu tobuliname statybos24.lt – kad darbų paieška ir darbuotojų kvietimas būtų dar paprastesni. Svetainė laikinai nepasiekiama.</p>
  ${hasUntil ? `<div class="cd" id="cd" aria-live="polite"><div><b id="d">00</b><small data-t="d">dienos</small></div><div><b id="h">00</b><small data-t="h">valandos</small></div><div><b id="m">00</b><small data-t="m">minutės</small></div><div><b id="s">00</b><small data-t="s">sekundės</small></div></div>
  <p class="when"><span data-t="when">Planuojame grįžti</span> <b id="when"></b></p>` : ""}
  <p class="late" id="late" data-t="late">Atnaujinimas užtrunka šiek tiek ilgiau, nei planavome. Puslapis atsinaujins pats, kai tik grįšime.</p>
  <div class="sorry"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8Z"/></svg><p><span data-t="sorry">Atsiprašome už nepatogumus ir dėkojame už kantrybę. Jūsų paskyros, darbai ir žinutės yra saugūs.</span> <span data-t="mail">Skubiais klausimais rašykite</span> <a href="mailto:info@statybos24.lt">info@statybos24.lt</a>.</p></div>
</main>
<footer><span>© ${new Date().getFullYear()} statybos24.lt</span><button type="button" class="adm" id="admBtn" data-t="adm">Administratoriaus prisijungimas</button></footer>
<dialog id="dlg" data-err="${error ? "1" : ""}"><form class="dlg" method="post" action="/__admin/login" autocomplete="on">
  <h2 data-t="ah">Administratoriaus prisijungimas</h2><p data-t="ap">Prisijungti gali tik statybos24.lt administratorius. Kitiems naudotojams svetainė bus pasiekiama, kai baigsime atnaujinimą.</p>
  <input type="hidden" name="next" value="${esc(next)}">
  <label><span data-t="ae">El. paštas</span><input name="email" type="email" required autocomplete="username"></label>
  <label><span data-t="aw">Slaptažodis</span><input name="password" type="password" required autocomplete="current-password"></label>
  ${error ? `<p class="err" data-t="${error === "rate" ? "arate" : "aerr"}"></p>` : ""}
  <div class="row"><button type="button" class="btn" id="dlgX" data-t="ac">Atšaukti</button><button type="submit" class="btn p" data-t="as">Prisijungti</button></div>
</form></dialog>
<script>
(function(){
  var until=${hasUntil ? untilMs : "null"};
  var T={lt:{k:"Vyksta atnaujinimas",h1:"Atsinaujiname.",h2:"Netrukus grįšime.",lead:"Šiuo metu tobuliname statybos24.lt – kad darbų paieška ir darbuotojų kvietimas būtų dar paprastesni. Svetainė laikinai nepasiekiama.",d:"dienos",h:"valandos",m:"minutės",s:"sekundės",when:"Planuojame grįžti",late:"Atnaujinimas užtrunka šiek tiek ilgiau, nei planavome. Puslapis atsinaujins pats, kai tik grįšime.",sorry:"Atsiprašome už nepatogumus ir dėkojame už kantrybę. Jūsų paskyros, darbai ir žinutės yra saugūs.",mail:"Skubiais klausimais rašykite",adm:"Administratoriaus prisijungimas",ah:"Administratoriaus prisijungimas",ap:"Prisijungti gali tik statybos24.lt administratorius. Kitiems naudotojams svetainė bus pasiekiama, kai baigsime atnaujinimą.",ae:"El. paštas",aw:"Slaptažodis",ac:"Atšaukti",as:"Prisijungti",aerr:"Neteisingi duomenys arba neturite administratoriaus teisių.",arate:"Per daug bandymų. Pabandykite po kelių minučių.",loc:"lt-LT"},
         en:{k:"Update in progress",h1:"We're updating.",h2:"Back very soon.",lead:"We are improving statybos24.lt to make finding work and inviting workers even easier. The site is temporarily unavailable.",d:"days",h:"hours",m:"minutes",s:"seconds",when:"We plan to be back",late:"The update is taking a little longer than planned. This page will refresh automatically as soon as we are back.",sorry:"We apologise for the inconvenience and thank you for your patience. Your accounts, jobs and messages are safe.",mail:"For urgent questions, email",adm:"Administrator sign-in",ah:"Administrator sign-in",ap:"Only the statybos24.lt administrator can sign in. The site will be available to everyone else once the update is complete.",ae:"Email",aw:"Password",ac:"Cancel",as:"Sign in",aerr:"Incorrect details or you do not have administrator rights.",arate:"Too many attempts. Please try again in a few minutes.",loc:"en-GB"}};
  var lang="lt"; try{lang=localStorage.getItem("s24_mlang")||"lt"}catch(e){}
  function apply(){var t=T[lang];document.documentElement.lang=lang;[].forEach.call(document.querySelectorAll("[data-t]"),function(e){var k=e.getAttribute("data-t");if(t[k])e.textContent=t[k]});[].forEach.call(document.querySelectorAll("[data-l]"),function(b){b.setAttribute("aria-pressed",b.getAttribute("data-l")===lang)});var w=document.getElementById("when");if(w&&until)w.textContent=new Date(until).toLocaleString(t.loc,{timeZone:"Europe/Vilnius",weekday:"long",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"})+(lang==="en"?" (Lithuanian time)":"")}
  [].forEach.call(document.querySelectorAll("[data-l]"),function(b){b.onclick=function(){lang=b.getAttribute("data-l");try{localStorage.setItem("s24_mlang",lang)}catch(e){}apply()}});
  function pad(n){return(n<10?"0":"")+n}
  function tick(){if(!until)return;var ms=until-Date.now();if(ms<=0){document.getElementById("cd").style.display="none";document.getElementById("late").style.display="block";return}var s=Math.floor(ms/1e3);document.getElementById("d").textContent=pad(Math.floor(s/86400));document.getElementById("h").textContent=pad(Math.floor(s%86400/3600));document.getElementById("m").textContent=pad(Math.floor(s%3600/60));document.getElementById("s").textContent=pad(s%60)}
  apply();tick();setInterval(tick,1000);
  if(!until)document.getElementById("late").style.display="none";
  // kas 30 s patikriname, ar svetainė vėl veikia – tada puslapis persikrauna pats
  setInterval(function(){fetch("/api/status",{cache:"no-store"}).then(function(r){return r.json()}).then(function(j){if(j&&j.maintenance===false)location.reload()}).catch(function(){})},30000);
  var d=document.getElementById("dlg");document.getElementById("admBtn").onclick=function(){if(d.showModal){if(!d.open)d.showModal()}else d.setAttribute("open","")};document.getElementById("dlgX").onclick=function(){d.close?d.close():d.removeAttribute("open")};
  if(d.getAttribute("data-err")){if(d.showModal)d.showModal();else d.setAttribute("open","");try{history.replaceState(null,"","/")}catch(e){}}
})();
</script>
</body>
</html>`;
}
