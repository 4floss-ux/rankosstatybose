# statybos24.lt – naujo dizaino perkėlimas: perdavimas naujam pokalbiui

> Naujame chate: „Perskaityk `docs/REDESIGN_HANDOFF.md` šakoje `redesign` (repo 4floss-ux/rankosstatybose) ir tęsk darbą.“
> Atsakinėti lietuviškai, trumpai. Neišgalvoti duomenų ar funkcijų.

## 1. Tikslas

Savininko žodžiais: viskas, kas padaryta prototipe, turi būti tikroje svetainėje statybos24.lt **identiškai**.
Ko svetainėje anksčiau nebuvo – pridėti. Kaip viską įdiegti, kad niekas nesipyktų, sprendžia Claude.
Dirbti nesustojant, bet **tvarkingai**: kiekvieną žingsnį patikrinti prieš commit.

## 2. Griežtos taisyklės

- Visas darbas tik šakoje **`redesign`** → PR **#14** (draft). **Nejungti** – jungia savininkas pabaigoje.
- Testuojama pabaigoje peržiūroje: https://redesign-rankosstatybose.4floss.workers.dev
- Gyva svetainė turi veikti. `MAINTENANCE_MODE=on` **neišjungti** (gali jungtis tikri vartotojai).
- Supabase projektas `vxbfihnhielqambosmkc` (~131 profilis, ~111 darbuotojų, ~19 įmonių – tikri žmonės).
  DB keitimai **tik pridedantys** (naujos lentelės / RPC / stulpeliai). Nieko netrinti, nekeisti esamų duomenų.
  Kiekvienai migracijai – failas `supabase/migrations/2026…_*.sql` (dokumentacijai).
- Testinės paskyros (tik jas galima naudoti demonstracijai): `tattoo.staponas@gmail.com` (darbdavys),
  `beatabune@gmail.com` (darbuotojas). Kitų vartotojų neliesti.
- Mokėjimai per platformą ir tapatybės patvirtinimas – **nedaromi**.
- Hire puslapis – **paskutinis**.
- Moderatoriai su teisėmis – laukia savininko sprendimo (žr. 7 sk.).

## 3. Architektūra (kaip daromas perkėlimas)

- React + Vite, hostingas – Cloudflare Worker su statiniais failais (`worker.js`, `wrangler.jsonc`, assets `./dist`).
- Logika lieka esamuose komponentuose: `src/worker/WorkerDashboard.jsx`, `src/employer/EmployerDashboard.jsx`,
  `src/admin/AdminDashboard.jsx`. Keičiamas tik JSX – į prototipo markup'ą, skyrius po skyriaus.
- Prototipo CSS: `src/p24/p24.css`, viskas apribota `.p24`. Gale pridėti „skin“ blokai likusiems seniems elementams
  (kortelės, laukai, mygtukai, modalai `.rs-modal-*`/`.admin-modal*`, darbo forma `#employer-job-form`, profilio redaktorius).
- Rėmas: `src/p24/Shell.jsx` → `P24Shell({groups, tabs, current, onGo, cta, free, who, extra, roleBar, messenger, utility, children})`,
  taip pat `Svg`, `Badge`. Ikonos – `src/p24/icons.js` (prototipo `I`).
- Bendri komponentai: `src/p24/ui.jsx` (`Pill`, `Empty`, `Paged`, `JobCard`, `ListGroup`, `PageHead`, `ActionButtons`, `JobDetail`, datų pagalbininkai).
- Rodiniai: seni blokai pažymimi `data-wv="legacy"`, perjungiama CSS taisyklėmis
  `.wd-shell[data-view="X"] [data-wv]:not([data-wv~="X"]){display:none!important}` (tas pats su `.ed-shell`).
- Darbuotojo rodiniai (`s24-worker-view`): overview, invites, jobs, history, favco, ads, schedule, profile, wjob.
- Darbdavio rodiniai: overview, active, ended, new, company, job.

## 4. Kas jau padaryta (šakoje `redesign`)

**Bendrai:** P24 rėmas (šoninis meniu, viršutinė juosta, apatiniai skirtukai telefone, stalčius), naujas logotipas visur,
ikonėlės `-v3` (programėlės ikonėlė baltame fone – savininkas pasirinko „A: baltas fonas“, jau padaryta),
OG paveikslėliai (`og-statybos24-square-v6.png`, `og-statybos24-v5.png`), modalų skin, formų skin.
Pradinis puslapis 1:1 su prototipu: `src/p24/public/PublicLandingP24.jsx` + `landingHtml.js`.

**Darbuotojas:** apžvalga (`p24/worker/WorkerOverview.jsx`), kvietimai, mano darbai, istorija, pilnas darbo puslapis (wjob),
darbo grafikas (`p24/worker/WorkerSchedule.jsx`), mėgstamos įmonės (`useFavoriteCompanies.js`), žinučių langas
(`p24/Messenger.jsx`, „ištrinti sau“), profilio antraštė, „Darbas užsienyje“ su šalimis (`AbroadSetting` faile `src/worker/workAbroad.jsx`).

**Darbdavys:** apžvalga (`p24/employer/EmployerOverview.jsx`), aktyvūs / pasibaigę darbai, atidarytas darbas (hero skin), žinučių langas.
Meniu punktai (mėgstami, skubūs, ilgalaikiai, vadovų pokalbis, komanda, planai, kalendorius) atidaro esamus langus su skin.

**Admin:** meniu su prototipo ikonomis, suvestinė (plytelės, eilė, mėnesio statistika), privatūs pokalbiai
(`p24/admin/AdminPrivateChats.jsx`, skaityti ir rašyti), užsienio sąrašas su šalimis.

**Worker gate (jau gyvai):** priežiūros režimas, admin prisijungimas, `/api/status`, `MAINTENANCE_TESTERS` (el. paštai, praleidžiami pro vartus).

**DB (pritaikyta, tik pridėta):**
- `admin_list_work_abroad_interested_v2` (+ `abroad_private.list_interested_workers_v2`)
- lentelė `chat_hidden(user_id, conv_key, hidden_at)` su RLS
- `get_admin_private_job_threads`, `get_admin_private_job_messages`, `admin_send_private_job_message` (+ 'admin' režimas `set_job_message_sender_context`)
- lentelė `worker_favorite_companies` su RLS

**Padaryta 2026-11-01 (2 sesija):**
- Darbuotojo profilis 1:1 (`p24/worker/WorkerProfileEditor.jsx`): apdovanojimai, laukai, telefonas su „Keisti“, užrakintas el. paštas,
  pažymėjimai (lentelė `worker_documents` + bucket `worker-documents`), pranešimų perjungiklis (`WebPushSettings` su `data-variant="p24"`),
  lokacija, užsienis, slaptažodžio keitimas, klaidos pranešimas, ištrynimas, neišsaugotų pakeitimų juosta.
- **Darbo skelbimai** (nauja sistema vietoj senų ilgalaikių pasiūlymų, kurie paslėpti `data-wv="legacy"`):
  DB `job_ads`, `job_ad_applications`, `job_ad_saves`, `job_ad_nudges`, `job_ad_views`, `job_ad_payments` (RLS be politikų – tik per RPC),
  bucket `job-ad-cv`. Darbuotojas – `p24/worker/WorkerAds.jsx`, įmonė – `p24/employer/EmployerAds.jsx` (meniu „Įdarbinimas“, savininkas/vadovas),
  administratorius – `p24/admin/AdminJobAds.jsx`.
- Apmokėjimas 9,99 € / 30 d. (Business Pro – nemokamai): **atskira** edge funkcija `job-ad-checkout` (šaltinis `supabase/functions/job-ad-checkout`).
  Esamos Stripe prenumeratų funkcijos nekeistos. Apmokėjimas tikrinamas serveryje (grįžus `?adpay=success…` arba mygtuku „Apmokėti“ – pakartotinai naudoja sesiją).
- Telefono paraštės be dvigubo atitraukimo (`.wd-shell`, `.ed-shell`), pilkas fonas iki ekrano apačios.

**Tvarkymas (2026-11-01):**
- Kodo skaidymas: darbuotojo, darbdavio, admin, /hire ir teisiniai puslapiai kraunami tik prireikus (`src/lib/lazyPage.js`,
  vienkartinis perkrovimas jei po diegimo senas failas dingo). Pradinis JS ~376 KB vietoj ~1,7 MB (min.).
  `AdminPrivateInboxButton` perkeltas į `src/admin/AdminPrivateInbox.jsx` (kad darbuotojo kodas netemptų admin kodo).
- Nuotraukos mažinamos naršyklėje prieš įkeliant (`src/lib/imageUpload.js`): avatarai/logotipai 800 px, pažymėjimai/CV/įrodymai 2000 px.
- `worker.js`: saugumo antraštės (nosniff, SAMEORIGIN, HSTS, permissions-policy), ilgas talpinimas versijuotiems JS/CSS, 404 trūkstamiems `/assets/*`.
- DB: indeksai, pasikartojančių politikų sutvarkymas (tik redizaino lentelės) – `20261101170000_redesign_hardening.sql`.
- `brand-logo.png` sumažintas 2048→960 px (220→68 KB).
- Testavimo `bundle.sh` naudoja `--splitting`.

### Padaryta 2026-11-01 (3 sesija) – „1:1 su prototipu“
- Darbdavys: Komanda, Planai, Įmonės profilis (`EmployerCompany.jsx`: Mano duomenys – kiekvienas narys saugo vardą/pavardę/telefoną;
  Informacija – tik savininkas), Darbų kalendorius (`EmployerCalendar.jsx`, mėnesio tinklelis; senas `EmployerWorkCalendar.jsx` su demo režimu ištrintas).
- Slaptažodžio keitimas kaip prototipe (`src/p24/account/PasswordModal.jsx`): tikrina dabartinį slaptažodį, taisyklės, atkūrimo nuoroda.
- Pašalinta, ko nėra prototipe: darbuotojo „Patirtis statybose (metais)“, įmonės apdovanojimų blokas profilyje, darbdavio pranešimų jungiklis profilyje
  (naršyklės pranešimų pasiūlymas lieka automatinis), skelbimų „Visi skelbimai“ mygtukai (grįžtama paspaudus meniu), skelbimo adreso laukas (DB reikšmė lieka).
- Admin (`src/p24/admin/AdminLists.jsx`): Darbuotojai, Darbdaviai (+ patvirtinimas vienu mygtuku), Visi darbai, Domisi užsienyje, Įdarbinti, Ginčai,
  Klaidos, Atsiliepimai, Vadovų pokalbiai, Failai, Mėnesio geriausi, Veiksmų istorija – prototipo lentelės ir „Valdyti“ langas, veiksmai – esami.
- /hire – vieno ekrano įmonės užklausos forma; /hire/login – prototipo kortelė (`src/p24/hire.css` – prototipo hire stiliai, apriboti `.p24`).
- p24 modalai turi savo `position:fixed` stilių (nepriklauso nuo puslapio).

### Padaryta 2026-11-01 (4 sesija)
- Prisijungimo / registracijos langas (`src/auth/AuthModal.jsx`) – prototipo `auth` langas (P24Modal, `toggle2`, `.field`, `segs`), visa logika ta pati
  (SMS patvirtinimas, komandos kvietimas, slaptažodžio atkūrimas). Seni globalūs uždarymo mygtuko stiliai (`unifiedCloseStyles`) nebeliečia `.p24`.
- /hire/portal (`src/hire/HireEmployerPortalPage.jsx`) – prototipo hpHome / hpNeed / hpNeedForm: sutarties kortelė, poreikių sąrašas, sąskaitos,
  poreikio puslapis su kandidatais ir sprendimo mygtukais, atmetimo ir pirmo prisijungimo slaptažodžio langai (P24Modal), profesijos ir šalies sąrašai.
  Naujas poreikis pateikiamas tik įkėlus pasirašytą sutartį (kaip prototipe).
- Admin „Tarptautinė atranka“ (`src/p24/admin/AdminForeignHire.jsx`) – prototipo sąrašas (paieška, filtrai), užklausos puslapis (būsenos žingsniai,
  poreikis, kandidatai su eiga, sutartimis ir dokumentais, kontaktas, tarpininkavimo sutartis, sąskaita), kandidato pridėjimas iš Statybos24 bazės
  (`admin_search_foreign_hire_workers` – anksčiau nebuvo rodoma) arba išorinis. Visos RPC ir failų funkcijos – esamos.
- Verslo pristatymo ekranai – nauji `public/assets/screens/bp-screen-*.webp` iš naujo dizaino (senų `.svg` nebėra).
- Admin „Prisijungti kaip“ (Darbuotojai / Darbdaviai → Valdyti): edge funkcija `admin-impersonate` (tik aktyvus adminas, ne kitam adminui,
  įrašas `admin_audit_log` „impersonate_start“) duoda vienkartinį raktą; admino sesija laikoma naršyklėje (`src/admin/impersonation.js`),
  viršuje juosta „Grįžti į administratorių“ (ji ir „Atsijungti“ grąžina admino sesiją). Užsiėmus kitu naudotoju juosta nerodoma (tikrinamas user.id, 12 val.).
- Meniu sutankinimas kaip prototipe (`mfit1–4` P24Shell), pašalinta prototipe nesanti admino „Paskyra“ grupė (darbuotojo/darbdavio režimai, paskyros trynimas).
- Smulkūs: darbo puslapio širdelė prieš įmonę, klaidos pataisymo pranešimas `.alert green`, pasibaigęs darbas paryškina „Pasibaigę darbai“.

### 5 sesija
- Pritaikyta DB: komandos veiksmų istorija, skelbimo pokalbis, „Nuolatinė komanda“, kvietimų terminas (12/24 val.; priėmimo trigeris IŠJUNGTAS iki paleidimo – žr. LAUNCH.md).
- Objektai ir šablonai – UI padarytas, migracija `20261101233000_redesign_sites_templates.sql` DAR NEPRITAIKYTA (Supabase patvirtinimas atšauktas automatiškai).
- Likę: automatinis kvietimas, objekto vadovo rolė, moderatoriai (planas `docs/redesign/ADMIN_MODERATORS_PLAN.md`).

## 5. Kas liko

1. Komandos „Veiksmų istorija“ (prototipe yra). Paruošta papildoma migracija `docs/redesign/pending-migrations/20261101210000_redesign_company_team_activity.sql`
   (nauja lentelė, AFTER trigeriai su `exception when others`, RPC `get_company_team_activity`). Nepritaikyta – DB patvirtinimas buvo atšauktas.
   Pritaikius: perkelti į `supabase/migrations/` ir prijungti prie Komandos puslapio.
2. Skelbimų „Rašyti įmonei / kandidatui“ pokalbis (prototipe yra, kanalo nėra) – reikia naujos DB lentelės; nedaryta, kad nebūtų netikros funkcijos.
3. Admin „Administratoriai“ (moderatoriai su teisėmis) – laukia savininko plano (saugumas).
4. Prototipo dalys be duomenų sistemoje: atstumas ir kelionės laikas iki darbo, „Atsakykite iki“ kvietimo terminas, „Nuolatinė komanda“,
   objektai / šablonai / automatinis kvietimas / objekto vadovo rolė. Reikia naujų DB laukų ir logikos.
5. Pabaigoje: pilnas testas peržiūroje su testinėmis paskyromis (žr. `docs/LAUNCH.md`).

## 6. Kaip tikrinti (prieš kiekvieną commit)

npm aplinkoje užblokuotas, todėl vite lokaliai nepaleidžiamas. Įrankiai – `docs/redesign/tools/`
(kelias `/opt/npm-tools/node_modules/{esbuild,typescript,react}`; skriptuose keliai absoliutūs – pasitaisyti pagal naują aplinką):
- `bundle.sh <entry> <outdir>` – esbuild su `stubs/supabase.js` (duomenys iš `window.__ROLE`, `window.__DATA`, raktai – lentelės ir `rpc:<vardas>`).
- `undef.mjs <failai>` – TS patikra neapibrėžtiems vardams. Priimtina tik 2307 (modulių) klaidos; bazinė TOTAL ≈ 41.
- `wlook.py`, `elook.py`, `alook.py`, `lptest.py` – Playwright ekrano nuotraukos 1440 ir 390 px, tikrina horizontalų perpildymą.
  Duomenys – `wdata.js`, `edata.js`.
- Po push: Cloudflare build – `gh api repos/4floss-ux/rankosstatybose/commits/redesign/check-runs` (turi būti success).
- PR kuriami per `gh api .../pulls` (GraphQL užblokuotas). Po push: `git fetch origin redesign:refs/remotes/origin/redesign`.

Prototipas (palyginimui): `docs/redesign/prototype/statybos24-prototipas.html` (pilnas, vienas failas),
šaltiniai `app.js`, `app.css`, `admin.js`, `landing.js`, `hire.*`. Taip pat prototipo artifact `BFpgF6jtaXhH4AUnPoMABd`.

## 7. Laukia savininko

- **Moderatoriai su teisėmis:** būtina serverio pusės apsauga (~40 admin RPC). Saugumui jautru – pirmiau parodyti planą, tik tada daryti.
- **Cloudflare:** pridėti kintamąjį `MAINTENANCE_TESTERS = tattoo.staponas@gmail.com, beatabune@gmail.com` (jei dar nepadaryta).
- **Stripe:** skelbimų mokėjimai eina per tą patį `STRIPE_SECRET_KEY` (live). Peržiūroje bandant apmokėti bus tikras mokėjimas.
- **Pabaiga:** savininkas sujungia PR #14 priežiūros lango metu, po to patikrinama gyvai.
