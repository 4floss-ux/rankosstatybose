# Tikslus 102bdfa diegimas į statybos24.lt

Patikrinta 2026-11-04T23:07:03.933836+02:00 Lietuvos laiku.

## Produkcijos pagrindas ir ribos

Prieš rengiant paketą GET Cloudflare deployments / versions patvirtino tikrą aktyvų Worker `rankosstatybose` variantą `c2d24799-889c-44d9-bbf8-994eae86bd33`, 100 % srauto, Maintenance ON. Jo anotacija `contact-0edff3f`, ankstesnis į GitHub įrašytas diegimo įrodymas `INTERVIEW_CONTACT_DEPLOY_2026-11-04.json` ir originalus to diegimo API patikros įrašas sutapo. Visi nurodo produkcijos kodo pagrindą **`18656a75770f7e8359c779ba482f88268473d859`**. Prieš perjungimą API papildomai patikrinta, kad aktyvus pirmtakas nepasikeitė darbo metu.

Atskira lokali šaka `release/candidate-confirmation-savers-maintenance` sukurta nuo šio pagrindo. Perkeltas tik **`git diff 102bdfa^ 102bdfa -- src`**. Paruoštas skirtumas baitas į baitą palygintas su prašytu skirtumu: sutampa. Patch SHA-256 `678d349a8f82f95865361209a6c6805d41f34eea7358fd73985d2a94228bd8ee`.

Tikslūs perkelti failai:

- `src/p24/adNews.jsx`
- `src/p24/employer/EmployerAds.jsx`
- `src/p24/p24.css`
- `src/p24/worker/WorkerAds.jsx`

Diegimo šaltinio įrašas `70d5ccd7bd09e7b8e2675de20125443e5a2d5a05`. Visa peržiūros šaka, SQL failai, CI pakeitimai ar kitos funkcijos į produkciją neperkelti.

## Diegimo įrodymas

- Aktyvi versija **`7a01c5c7-24ce-49df-bddb-4521ecc19bc9`**.
- Deployment ID **`8121756a-48f0-4b4e-ba8d-186d8f6440a2`**, sukurta `2026-11-04T21:06:40.240681Z`.
- **100 % srauto, Maintenance ON**, patvirtinta atskirais GET deployments ir GET versions po CLI SUCCESS.
- Seno ir naujo varianto visos bindings identiškos. Worker, wrangler, paketų ir lock failai nepakito. Trigerių / domenų / maršrutų deploy nevykdytas.
- **Jokio SQL nevykdyta, net vietiniuose šio diegimo testuose.** Apie naujo SQL įdiegimą remiamasi savininko pateikta patikra. Ankstesni SQL nekartoti. Tikros paskyros, mokėjimai ir Supabase įrašai nekeisti.
- Main ir redesign šakos nejungtos; Hire bei atskira redesign peržiūra neatnaujintos.

## Prieš diegimą atliktos patikros

| Patikra | Rezultatas |
|---|---|
| Produkcijos build | PASS, įprastas didesnio JS paketo įspėjimas |
| Kontaktų, administratoriaus sesijų ir viešų nuorodų Node testai (be SQL) | 22 PASS, 0 FAIL |
| Kandidatavimo / naujienų / Messenger naršyklė | PASS, 1440 / 390 px |
| Darbdavio skelbimo detalė / ankstesni veiksmai | PASS, 1440 / 390 px |
| Vieši skelbimai / filtras / nuorodos | PASS, 1440 / 390 px |
| Viso App prisijungimo grąžinimas ir vienkartinis kandidatavimas | PASS, 1440 / 390 px |
| Papildomas tikro WorkerProfileModal komponento bandymas | PASS, 1440 / 390 px, Basic / Business / Pro, gyvai / telefonu |

Prašyti 5 atvejai patikrinti su sintetiniais duomenimis:

1. Širdelė prie atlyginimo sąraše ir atidarytame skelbime veikia jau kandidatavus; Enter nebeatidaro skelbimo paspaudus širdelę.
2. Darbdavys mato įsiminusį kandidatą su „Jau kandidatavo“, jam neberodomas kvietimas kandidatuoti iš naujo.
3. Laukiant pakeisto kvietimo patvirtinimo yra vienas „Patvirtinti pokalbį“, nėra dubliuojančio „Pažymėti perskaityta“. Patvirtinus perskaitomos tik kvietimo naujienos.
4. Telefonas neberodomas pokalbio kortelėje. Tikras profilio komponentas rodo autorizuotą telefono reikšmę po patvirtinimo visiems trims planams ir abiem pokalbio būdams; iki patvirtinimo numerio nerodo. Ankstesnis serverio autorizuoto kontakto perdavimas į profilį išsaugotas.
5. Ankstesni CV, raudonos būsenos, naujienų perskaitymo, perskaityto pokalbio išlikimo ir Messenger scenarijai veikia vietiniuose testuose.

Naršyklės testuose Supabase / prisijungimas / Storage pakeisti sintetiniais atsakymais, išorinis tinklas blokuotas. **Reali prisijungusių paskyrų Supabase integracija NETIKRINTA**: Work naršyklės įrankio nėra, o statybos24.lt ir Supabase nėra leidžiamų šios aplinkos tinklo adresų sąraše. Apribojimai neapeiti. Produkcijos diegimo būsena patvirtinta oficialia Cloudflare API; naujų RPC veikimas su tikromis paskyromis yra likusi tikrinimo riba.

[Mašininis API ir skirtumo patvirtinimas](CANDIDATE_SAVERS_DEPLOY_2026-11-04.json).
