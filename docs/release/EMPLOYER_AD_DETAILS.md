# Skelbimo informacija ir nuolatinis ištrynimas

Šaka `fix/employer-ad-details`. Serverio SQL ir Edge pakeitimai paruošti vietoje, bet šioje sesijoje netaikyti Supabase. Archyvo nėra.

Frontend įdiegtas į statybos24.lt atskiru įrašu [`66d1c4f`](https://github.com/4floss-ux/rankosstatybose/commit/66d1c4f), šakoje `release/employer-ad-details-maintenance`. Aktyvi Cloudflare versija `7ce52ecc-f407-4368-8a1e-3ce5ee51f74e`, 100 %, Maintenance ON. Patvirtinta API `2026-11-03T21:33:38.954776+00:00`. Main ir redesign nesujungti; main turinys savaime šio diegimo neparodo. Kol serverio schema / Edge / cleanup neįdiegti ir neaktyvuoti, trynimo mygtukas sąmoningai neaktyvus. Jokių realių įrašų nepašalinta.


## Paruošta sąsaja

- Darbdaviui rodoma visa įvesta informacija tuo pačiu `JobAdContent` komponentu, kurį naudoja darbuotojas ir vieša peržiūra: aprašymas, sutartis, grafikas, pradžia, adresas, reikalavimai ir pasiūlymai.
- „Redaguoti skelbimą“, „Pratęsti skelbimą“ ir „Ištrinti skelbimą“ yra atskirame „Skelbimo valdymas“ bloke. Kandidatų skilties antraštėje skelbimo valdymo mygtukų nėra.
- Tuščios pokalbių ir įsiminusiųjų kortelės, piktogramos bei skaitikliai naudoja esamus prototipo stilius.
- Trynimas įjungiamas tik gavus `job_ad_deletion_available=true` iš serverio. Nesant naujo serverio arba nepavykus patikrai mygtukas neveiks; neveikia joks paslėptas `job_ad_close` pakaitalas.
- Patvirtinus kviečiama `job-ad-delete` Edge funkcija. Rodoma tik patvirtinta sėkmė arba aiški klaida. Jei duomenys ištrinti, o failų šalinimas dar kartojamas, ši būsena aiškiai parodoma.

## Paruoštas serveris

1. `20261103220000_job_ad_delete_REVIEW.sql`: pradinė būsena OFF, teisių patikros, transakcinis skelbimo DELETE ir susiję CASCADE įrašai. Prieš diegimą patikrinamos būtinos CASCADE sąsajos; jos aklai nekeičiamos. Administratoriaus pašalintų (`removed`) skelbimų savininkas ištrinti negali: išsaugoma esama administracinės peržiūros riba.
2. `job-ad-delete` Edge: tikras `auth.getUser`, veiksmas prisijungusio vartotojo kontekste, Storage objektų trynimas tik iš serverio patvirtintų `job-ad-cv/<application UUID>/` aplankų. Kliento pateikti failų keliai ignoruojami. Eilėje išsaugomi ir tikslūs senų UUID aplankų raidžių dydžiai iš Storage metaduomenų; saugiai išvalomi ir seni vidiniai poaplankiai. Bendri profilio dokumentai ir kiti bucket neliečiami.
3. Nuolatinė privati pakartojimų eilė, tarnybinis cleanup kas penkias minutes, lease žetonai apsaugo nuo pavėlavusių užbaigimų. Nesėkmingi darbai neprarandami; sėkmingų darbų aplankų sąrašai išvalomi iškart, techniniai pakartojimo kvitai pašalinami po paros. Tai nėra skelbimo turinio ar kandidatūrų archyvas.
4. CV Storage metaduomenų įrašai ir trynimas naudoja sutampančius transakcinius advisory lock. Upload patikra užrakina ir kandidatūros eilutę. Tai būtina, kad įkėlimas neatsirastų po aplanko išvalymo; tikras kelių DB jungčių ir tikro Storage elgesys dar nepatikrintas.
5. Išsaugomi tik minimalūs mokėjimų apskaitos duomenys (mokėjimo identifikatorius, ad/įmonės UUID, suma, valiuta, aplinka, data) privačioje lentelėje. Skelbimo tekstai, kandidatų ir jų žinučių duomenys ten nekopijuojami.
6. Vienkartinės dovanos claim lieka. Ankstesniam leidėjui be dovanos claim sukuriama tik ankstesnės publikacijos tinkamumo žyma, o ne išgalvotas dovanos panaudojimo įvykis. Todėl ištrynimas dovanos neatkuria ir senoms paskyroms.
7. Jei vėliau įdiegiama Pro kvota, jos panaudojimas negrąžinamas. Pasirenkamoje pratęsimų receipt lentelėje išvalomas ištrinto skelbimo JSON, paliekant tik idempotency identifikatorius.
8. Esamos `job-ad-checkout` Edge funkcijos papildymas: lease prieš išorines užklausas, pakartotinis ad perskaitymas po lease, patikrintas sesijos įrašymas tik egzistuojančiam nepašalintam skelbimui, lease atleidimas `finally`. Naujos mokėjimo operacijos šiame darbe nevykdytos.
9. Pradėtas mokėjimas arba gyvas checkout lease blokuoja ištrynimą. Neužbaigto / pasibaigusio checkout negalima aklai išvalyti nepatikrinus jo būsenos. Tai sąmoninga apsauga nuo mokėjimo už ištrintą skelbimą. Automatinis pasibaigusios, bet vis dar įrašytos pending checkout sesijos atlaisvinimas šiame pakeitime neįgyvendintas; tokiam skelbimui ištrynimas lieka užblokuotas iki serverinio būsenos sutvarkymo. Tai likęs mokamų skelbimų trynimo blokatorius, o ne įrodytas pilnas mokėjimų veikimas. Stripe atsiskaitymų integracija turi būti išbandyta tik test-mode.

## Diegimo tvarka tikrintojui su tikra prieiga

Savininkas jau leido tęsti šį darbą ir bandymus jo testinėmis paskyromis. Trūkstama prieiga nėra prašymas naujam leidimui. Šioje Codex sesijoje nėra Supabase valdymo įrankio / slaptažodžių / prisijungusios Work naršyklės.

1. Palyginti SQL su tikra schema, ypač visais `job_ads` FK, papildomomis turinio kopijomis, tikra `job_ad_cv_access` ir mokėjimų / prenumeratos pataisomis. Išsaugoti naujesnius Claude / administratoriaus aktyvumo patikrinimus, jei tikroji apibrėžtis skiriasi. Patikrinti Storage transakcijų režimą ir advisory/row lock suderinamumą. Neužtenka vien anon funkcijų skaičiaus.
2. Pritaikyti tik patikrintą deletion schemos SQL su OFF. Dovanos ir viešų skelbimų schemų pakartotinai netaikyti. Šis failas esamų skelbimų netrina.
3. Sujungus mažą checkout diff su tikru naujausiu Edge kodu, įdiegti `job-ad-checkout` ir naują `job-ad-delete`. Neperrašyti naujesnių mokėjimo patikrų. Esamus Supabase/Stripe secret nustatymus palikti; nieko nesiųsti į pokalbį. Edge maksimalus vykdymo laikas turi būti trumpesnis už 15 min. checkout lease.
4. Vault saugiai sukonfigūruoti to paties projekto `job_ad_cleanup_url` (šio projekto `/functions/v1/job-ad-delete`) ir `job_ad_cleanup_service_key` (serverio service-role JWT, ne browser raktas). Secret reikšmių netalpinti į GitHub ar chatą. Patikrinti, kad cron/pg_net žurnalai ir lentelės nepasiekiami anon/authenticated rolėms.
5. Pritaikyti `20261103221000_job_ad_delete_cleanup_schedule_REVIEW.sql`. Patikrinti tikrą service cleanup kvietimą, HTTP sėkmę ir eilės būklę. Vien HTTP 200 neįrodo, kad visi failai ištrinti: nesėkmės lieka eilėje ir kartojamos.
6. Tik įdiegus suderintą frontendą, patvirtinus Edge kodą ir cleanup vykdymą, pritaikyti `20261103222000_job_ad_delete_ACTIVATE_REVIEW.sql`. Maintenance palikti ON. SQL patikros pačios negali patvirtinti Edge diegimo ar tikro Storage veikimo.
7. Savininko testiniu skelbimu patikrinti kandidatūrą / žinutes / sintetinį CV, tikrą ištrynimą, dingimą abiem pusėms ir iš Storage, dovanos neatkūrimą. Tikrų klientų duomenų netrinti; jokio live mokėjimo. Tikras mokamų įrašų išsaugojimas tik Stripe test-mode aplinkoje.

## Vietiniai testai

- `job-ad-delete-sql.test.mjs`: tikras PGlite PostgreSQL variklis, sintetinės tapatybės, kaskados, aktyvavimo apsaugos, cron SQL su imituotais cron/pg_net/Vault, checkout lease, mokėjimo kvitas, dovana ir senas leidėjas, JSON kopijos pašalinimas, rollback, pasikartojimai, service-only cleanup, terminai.
- `job-ad-delete-cleanup.test.mjs`: daugiau nei vienas Storage puslapis, ištuštinimas nuo nulio, kelio ribos, klaida / pakartojimas ir pavėlavęs užbaigimas.
- `job-ad-delete-edge.test.mjs`: abi Edge funkcijos per sintetinį SDK ir fetch, tikras handler kodas, netinkama tapatybė, kitos įmonės draudimas, sėkmė ir dalinė failų nesėkmė, service-only cron, checkout lenktynių apsaugos. Nė vienas tinklo kvietimas neišeina į Stripe ar Supabase.
- `employer_ad_detail_frontend.py`, `ad_quota_frontend.py`, `public_jobs_frontend.py`: 1440 ir 390 px, visa informacija, atskiras valdymas, patvirtinimas / atšaukimas, OFF būsena, klaida ir sėkmė bei failų pending pranešimas. Tik imituota integracija.
- Abu produkciniai build.

PGlite užklausas serializuoja. Tikras lygiagretumas, tikras Storage, cron/Vault leidimai ir tikra Supabase / Stripe test-mode integracija lieka nepatikrinta. Backend aktyvavimui NO-GO iki šių patikrų. Joks tikras skelbimas, kandidatas, failas ar mokėjimas šioje sesijoje nebuvo ištrintas.
