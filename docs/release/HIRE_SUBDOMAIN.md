# hire.statybos24.lt atskyrimas – vietiniai pakeitimai

Šaka: fix/separate-hire-subdomain. 2026-11-03 savininkui aiškiai leidus įdiegtas
atskiras statybos24-hire Worker ir prijungtas hire.statybos24.lt. Supabase, Stripe
ir pagrindinės svetainės Worker nekeisti. Ankstesni darbai išsaugoti. GitHub šaka
šiame žingsnyje nepublikuota ir nesujungta.

## Du atskirai paleidžiami projektai

- Pagrindinis: src/main.jsx, npm run build, dist, wrangler.jsonc.
- Tarptautinė atranka: src/hire/main.jsx, npm run build:hire, dist-hire,
  wrangler.hire.jsonc (atskiras Worker statybos24-hire, MAINTENANCE_MODE=off).
- Naujo projekto adresai: /, /login, /portal. Main nebepaleidžia hire puslapių.
- Senų /hire GET/HEAD nuorodų 308 redirect į fiksuotą hire.statybos24.lt adresą
  išsaugo kelią, kalbą, query ir fragmentą. POST nenukreipiamas.
- Admin generuojamos portalo nuorodos rodo naują adresą.

## Kandidatų ryšys išlieka

Statybos24.lt administracijoje lieka darbuotojų paieška ir kandidatų siūlymas
užsienio darbdaviams. Naudojama ta pati esama DB ir tie patys RPC. Nekuriama
antra DB, darbuotojai nekopijuojami, esamos teisių taisyklės nekeičiamos.
Reali pasiūlymo → darbdavio portalo → atsakymo grandinė dar nepatikrinta.

Auth būsenos nesidalija tarp host: hire vis dar naudoja atskirą memory-only
Supabase Auth klientą ir savo portalo tokeną. Senos /hire portalo sesijos
neperkeliamos į naują origin; reikės prisijungti naujame adrese. Pagrindinės
svetainės sesija savo domene lieka. Main PWA į hire nekeliama.

## Savininko prašyta prisijungimo lango korekcija

Pašalinta antraštė „Prisijungti“, palikta „Darbdavio portalas“. Mygtukas naudoja
trumpą esamą vertimą („Prisijungti“, „Sign in“ ir kt.). Mygtukas ir klaida apima
visą formos eilutę, tekstas gali persikelti ir nenukerpamas. Login logika nekeičiama.
Prototipo šaltiniai nekeičiami; ši konkreti vizualinė korekcija prašyta savininko.

## Patikros po darbo aplinkos atkūrimo

- npm run build ir npm run build:hire – PASS.
- 6 hire route/server, 3 įmonės kodo ir 18 sesijos testų – PASS.
- tests/hire_frontend.py – PASS 1440/390: nepriklausomi built root/login/portal,
  savo domeno nuorodos, atskira storage, be main PWA, be runtime klaidų.
- Bundle patikros: hire neturi main administratoriaus App, main neturi hire
  login RPC, hire viešuose failuose nėra main PWA ar main sitemap.
- tests/hire_login_layout.py – PASS: 7 kalbos × 1440/555/390, kartojamos antraštės
  nėra, klaida ir mygtukas pilno pločio, tekstas nenukerpamas.
- Visi išoriniai testų browser prašymai blokuoti. Tikri prisijungimai, DB įrašymai,
  kandidatų siūlymas, naujo host CORS ir realūs webfontai nepatikrinti.

## Peržiūra ir leidimo eiga – nevykdyta

1. Peržiūrėti diff ir pateikti PR tik gavus publikavimo leidimą.
2. Atskirai autorizuoti naujo Worker paruošimą ir hire.statybos24.lt DNS/HTTPS
   susiejimą. Main turi likti prie savo build/dist; hire – prie build:hire/dist-hire.
3. Naujam projektui suteikti tik būtinus nustatymus. Frontend naudoti esamos DB
   URL ir publishable key, niekada service-role. Priežiūros režimą palikti įjungtą.
4. Patikrinti naują origin esamų portal-files ir kitų Edge funkcijų leidimuose;
   Auth redirect taisykles keisti tik jei konkrečiai reikia, neplatinti aklai.
5. Saugioje peržiūroje su savininko paskyromis patikrinti kandidatų siūlymą ir
   teisių izoliaciją. Laikytis sutartų shared-live duomenų įrašymo leidimų.
6. Main redirect publikuoti tik tada, kai naujas host jau veikia, kad senos
   nuorodos nenukreiptų į neveikiantį adresą. Jokio automatinio viešo perjungimo.

DB migracijų šiam adreso pakeitimui nenumatyta. Realiam diegimui ir viešam
paleidimui reikia atskiro savininko patvirtinimo.

## Įdiegimo rezultatas 2026-11-03

- Host: https://hire.statybos24.lt, Worker: statybos24-hire.
- Cloudflare versija: 61bcb6c7-e661-4b1c-98c2-7f1784cc275b.
- workers.dev ir papildomi preview URL išjungti; susietas tik savininko nurodytas host.
- Prieš diegimą patikrinta, kad nėra seno hire DNS įrašo ar kito tokio Worker;
  niekas neperrašyta. Pagrindinio rankosstatybose Worker versijos ID prieš ir po
  diegimo sutapo.
- /, /login, /portal ir /api/status atsako HTTPS 200. HTML ir entry JS/CSS
  hash sutampa su vietiniu įdiegtu build; maintenance=false tik naujam hire.
- Tikri vieši diegto host failai atvaizduoti 1440/390: forma ir pataisytas login
  matomi, nėra pasikartojančios heading, teksto nukirpimo, overflow ar JS klaidų.
  Browser užklausos ne į hire host ir visi ne GET metodai testuose blokuoti.
- Prisijungimai, užklausų pateikimas, kandidatų veiksmai ir duomenų įrašymai
  netestuoti. DB užklausų, migracijų, Stripe operacijų ir paskyrų pakeitimų nebuvo.
- Main /hire redirect ir admin generuojamų naujų nuorodų kodas yra šioje vietinėje
  šakoje, bet pagrindinis Worker nediegtas. Senas main /hire kelias dar nekeistas.
