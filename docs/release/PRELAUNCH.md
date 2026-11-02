# Statybos24: sesijos pataisymas ir paleidimo vartai

Pagrindas: `redesign` 3d69b2c. Šio PR apimtis: `src/App.jsx`,
`src/admin/impersonation.js`, `tests/impersonation.test.mjs` ir ši ataskaita.
Ankstesni dizaino bei testinės infrastruktūros failai į PR neįtraukti ir išsaugoti.
DB, Edge funkcijų, Cloudflare, Stripe ir prototipo failai nekeičiami.

## Pataisymas

- Administratoriaus atkūrimo duomenys pašalinami tik patvirtinus grįžimą.
- Naujas įrašas saugo pradinio admino ID; grįžimas tikrina tapatybę ir aktyvią
  rolę per esamą `is_admin()`. Seniems įrašams taip pat privaloma `is_admin()` patikra.
- Vieno skirtuko vienalaikiai grįžimo prašymai vykdo vieną operaciją; retry po
  laikinos RPC klaidos jau atkurto admino neatjungia.
- 12 val. riba tikrinama laikmačiu, focus, visibility ir storage įvykiais.
  Pasibaigęs įrašas išsaugomas grįžimui, naudotojo dashboard neberodomas.
- Nesėkmės būsenoje galima kartoti arba vietiškai atsijungti ir prisijungti iš naujo.
- Pasibaigus impersonacijai nebevykdomas naudotojo aktyvumo registravimas.
- Normalios būsenos prototipo išvaizda, grįžimo mygtukas ir navigacija nepakeisti.
  Klaidos kelias naudoja esamas dizaino klases ir lietuviškus pranešimus.

12 val. kontrolė yra browser apsauga, ne serverinė tokeno TTL garantija.
Uždarytas/offline browser negali įvykdyti Auth atsijungimo. Įrašas vietinėje
saugykloje lieka jautrus: jo negalima įtraukti į logus ar screenshot.

## Patikros ir jų ribos

```bash
node --experimental-vm-modules tests/impersonation.test.mjs
VITE_SUPABASE_URL= VITE_SUPABASE_PUBLISHABLE_KEY= npm run build
```

18 sintetinių sesijos testų praėjo: termino riba, klaidinga tapatybė, vietinio
signout/restore/RPC klaidos, retry, vienalaikiai paspaudimai ir OTP rollback.
Tai valdymo logikos testai be tinklo; jie neįrodo tikro Auth, tokenų rotacijos ar RLS.

Prieš PR atliktos saugios frontend patikros su imitaciniais duomenimis:
- Darbuotojo, darbdavio ir admin scenarijai 1440/390; JS klaidų/perpildymo nenustatyta.
- Darbdavio senas testas pirmą kartą nepraėjo dėl neegzistuojančio „Istorija“ tab;
  laikinoje kopijoje naudotas esamas „Pasibaigę darbai“ meniu ir testas praėjo.
- Login/forgot/back/registracijos pasirinkimai/close 1440/390 praėjo; formos nesiųstos.
- Su sintetiniu Auth darbuotojo 1440 ir darbdavio 390 ekranai po termino blokuoti;
  po atkūrimo klaidos duomenys išliko, retry grąžino sintetinį admin dashboard.
- Išoriniai browser prašymai ir webfontai blokuoti; pilnas visų ekranų 1:1
  vizualinis atitikimas su tikrais webfontais šiais testais nepatvirtintas.

Ankstesnės frontend patikros vyko bendroje darbo kopijoje su išsaugotais,
nepublikuojamais dizaino pataisymais. Jos nėra šio PR atskiro medžio patikros.
Prieš commit iš tikslaus PR failų rinkinio atskiroje laikinoje kopijoje praėjo
visi 18 testų ir produkcinis build (3,21 s).

Savininkas nepriklausomai patvirtino produkcijos ACTIVE_HEALTHY būseną, 65 public
lenteles, 335 funkcijas, 311 migracijų, 12 Edge funkcijų bei aktyvaus admino
patikrą `is_admin()`. Tai jo patikros rezultatai, ne mūsų DB integracijos testai.
Kvietimų termino trigeris išjungtas ir cron nesuplanuotas.

## 24 anonimiškai vykdomos SECURITY DEFINER funkcijos

Savininko papildoma tik skaitymo patikra: 24 SECURITY DEFINER funkcijos turi
EXECUTE anon ir authenticated rolėms; 9 grąžina trigger ir nėra tiesioginiai
įprasti PostgREST RPC, likusios 15 yra iškviečiamos funkcijos.
`app_private.foreign_employer_session_account` tikrina SHA-256 sesijos rakto
maišą, galiojimą, atšaukimą ir paskyros aktyvumą; tiesioginės anon/authenticated
EXECUTE prieigos neturi. Tai savininko patikros rezultatas, ne mūsų SQL analizė.

**Saugumo auditas neužbaigtas.** Tikslių 15 RPC vardų, overload parašų,
apibrėžimų ir faktinių teisių negavome. Paskirtys (statistika, registracija,
kvietimų peržiūra) ir vien funkcijų skaičius nepatvirtina saugumo.
Jokių funkcijų produkcijoje nekvietėme ir leidimų nekeitėme.

Pirmiausia reikia tikslaus 15 funkcijų sąrašo. Jei žemiau esantys kode matomi
RPC patenka į jį, pilnus apibrėžimus tikrinti tokia tvarka:
1. `foreign_employer_admin_test_login`, `foreign_employer_login` – ar nėra
   admin patikros apėjimo, klaidingo sesijos išdavimo ar credential nutekėjimo.
2. `foreign_employer_change_password`, `foreign_employer_candidate_response`,
   `foreign_employer_submit_need`, `foreign_employer_logout` – ar sesijos
   paskyra susiejama su kiekvienu keičiamu įrašu, ne vien patikrinamas tokenas.
3. `foreign_employer_portal_data`, `get_company_team_invite_public` – ar
   neatveriami kitos įmonės, kandidato ar kvietimo privatūs duomenys.
4. `submit_foreign_hire_request`, `record_site_visit` ir kiti likę registracijos /
   statistikos RPC – įvesties ribos, neleistini šalutiniai pakeitimai, duomenų
   grąžinimas bei piktnaudžiavimo ribojimas. Paskirtis savaime nereiškia mažos rizikos.

Šis prioritetų sąrašas nėra patvirtintas 15 anonimiškai vykdomų funkcijų sąrašas.
Reikia ir saugumui svarbių helper apibrėžimų; 9 trigerių prieigos kelius galima
vertinti vėliau pagal juos aktyvuojančių lentelių INSERT/UPDATE/DELETE leidimus.

Reikalingas tik metaduomenų eksportas: `pg_get_function_identity_arguments`,
`pg_get_functiondef`, savininkas, `proconfig`, efektyvus EXECUTE prieinamumas
`anon` ir `authenticated` rolėms, įskaitant PUBLIC paveldėjimą. Paslaptis iš
apibrėžimų užmaskuoti; klientų eilučių nereikia. Jei funkcija kviečia kitus
helper, reikia ir saugumui reikšmingų jų apibrėžimų.

Klasifikavimas, gavus įrodymus:

| Kategorija | Įrodymas | Paleidimas |
| --- | --- | --- |
| Kritinė / aukšta | Anonimas be tinkamos patikros gali keisti svetimus duomenis, teises, mokėjimo būseną, gauti Auth raktus ar privačius duomenis | Blokuoja |
| Sąlyginė rizika | Pasiekiamumas yra, tačiau trūksta helper/teisių arba tikslinio įrašo patikros įrodymų | Neuždarytas saugumo vartas, ne įrodytas pažeidžiamumas |
| Pagrįstai vieša | Sąmoningai vieša funkcija grąžina tik numatytus viešus duomenis arba saugiai atmeta neautorizuotą kvietimą | Savaime neblokuoja |
| Trigerio / vidinė | Ribotas vykdymo kontekstas; nėra pasiekiamo privilegijuoto piktnaudžiavimo kelio | Vertinti pagal realų pasiekiamumą |

Repo SQL matyti: `job_ad_activate_paid` 5 argumentų versija skirta service_role,
senos 2 argumentų versijos prieiga atšaukiama; `expire_overdue_job_invitations`
neleidžiama PUBLIC/anon/authenticated. Tai migracijų tekstas, ne dabartinės DB ACL įrodymas.
`job_ad_can_manage` nario OR šakos saugumas priklauso nuo `is_company_member`;
be helper apibrėžimo pažeidžiamumas nepatvirtintas. RLS vienas pats neapsaugo nuo
privilegijuoto SECURITY DEFINER savininko. Plataus PUBLIC EXECUTE atšaukimo netaikyti.

## Likę paleidimo vartai

**NO-GO visuotiniam paleidimui**, kol neuždaryta:
1. Tikras Auth impersonacijos/grįžimo, refresh, kelių skirtukų ir ordinary-user
   atmetimo patikrinimas tik su sintetinėmis paskyromis autorizuotoje neprodukcinėje aplinkoje.
2. Kritinės tikros grandinės: login/logout/atkūrimas, darbuotojo kvietimas ir
   atsakymas, darbdavio pasiūlymas/kvietimas bei admin prieigos. Mock to nepakeičia.
3. Konkrečių 24 funkcijų saugumo klasifikacija ir patvirtintų kritinių spragų uždarymas.
4. Sprendimas dėl 12/24 val. kvietimų termino: jei jis žadamas vartotojui, išjungti
   trigeris ir cron nėra veikiančios serverinės kontrolės įrodymas.
5. Jei paleidžiamas mokėjimų kelias, jo neprodukcinė Stripe test-mode patikra;
   realių mokėjimų ši peržiūra neautorizuoja.

Vėliau gali likti automatiniai kvietimai, objekto vadovo rolė, moderatoriai,
papildoma optimizacija ir pilno schemos archyvo sutvarkymas. Atidėtos funkcijos
neturi būti pristatomos kaip veikiančios.

## Saugaus leidimo seka

Peržiūrėti šį PR į `redesign` → uždaryti vartus → izoliuota peržiūra/CI be
produkcinių paslaugų → paruoštas ankstesnis artefaktas ir rollback → atskiras
savininko leidimas sujungimui bei diegimui → priežiūros režimo patikra → atverti.
Kvietimų trigerio/cron įjungimas būtų atskiras autorizuotas DB pakeitimas;
SQL aklai nekartoti. Šis PR nieko nemigruoja, nediegia ir pats nesujungiamas.
