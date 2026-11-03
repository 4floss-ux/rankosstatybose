# Vieši darbo skelbimai – paruošta peržiūrai

Šaka `feat/public-job-ads`. Vietinis kodas, ne įdiegimo patvirtinimas.

## Paruoštas veikimas

- Pradiniame puslapyje „Darbo skelbimai“ kompiuterio ir telefono meniu bei apačioje.
- Viešas sąrašas `/darbo-skelbimai`, miestų filtras, puslapiai po 24 skelbimus.
- Kiekvieno skelbimo nuolatinė nuoroda `/darbo-skelbimai/<UUID>`; „Dalintis“ viešame, darbuotojo ir darbdavio skelbimo lange. Telefono dalijimosi meniu arba kopijavimas; nepavykus pateikiama rankiniu būdu kopijuojama nuoroda.
- Rodomi tik galiojantys skelbimai, kurių įmonės savininko paskyra gali naudotis platforma. Uždaryti, pašalinti, neapmokėti ir pasibaigę skelbimai neviešinami.
- Neprisijungęs lankytojas gali skaityti; „Kandidatuoti“ atidaro įprastą prisijungimą / registraciją. Prisijungus darbuotoju grąžinamas tas pats skelbimas. Kandidatūra pati neišsiunčiama.
- Registracijos patvirtinimo nuorodai perduodamas to paties skelbimo adresas. Darbdavio ar administratoriaus paskyra kandidatuoti negali.
- Viena kandidatūra paskyrai ir skelbimui, nepriklausomai nuo jos būsenos. Kandidatūros atšaukimo mygtukas pašalintas. Siūlomas serverio pakeitimas atmeta ir senų klientų atšaukimo užklausas. Istorinės kandidatūros neperrašomos.
- Naudojami esami prototipo skelbimų komponentai ir kandidatavimo langas; prototipo failai nepakeisti.

## Patikra

`tests/public-job-ads.test.mjs`: adresai ir saugus registracijos grįžimo adresas.

`tests/public-job-ads-sql.test.mjs`: tikras PostgreSQL variklis PGlite su sintetinėmis lentelėmis: vieši laukai, galiojimas, miestai, puslapiai, paskyrų teisės, pasikartojimų atmetimas visoms būsenoms ir atšaukimo atmetimas nekeičiant įrašo.

`tests/public_jobs_frontend.py`: 1440 ir 390 px, viešas sąrašas / filtras / detalė / dalijimasis, prisijungimo vartai, netinkama rolė, klaidos ir kartojimas, atšaukimo ir pakartotinio kandidatavimo mygtukų nebuvimas.

`tests/public_jobs_auth_frontend.py`: visa App su imituota autentifikacija 1440 ir 390 px: grįžimas į tą patį skelbimą po prisijungimo ir vienas kandidatūros siuntimas. Jokio tikro prisijungimo, el. laiško ar duomenų bazės ryšio.

Bendri saugūs testai bei abu production build (`npm run build`, `npm run build:hire`) praėjo. Build perspėjimas dėl didelių dalių išlieka; tai ne nauja funkcinė klaida.

## Būtina prieš įdiegiant

1. Nepriklausomas schemos peržiūrėtojas palygina `docs/sql-review/20261103210000_public_job_ads_REVIEW.sql` su tikromis funkcijomis, ypač `job_ads_worker_list`, `job_ad_apply`, `job_ad_withdraw`, ir RLS. Tai pakeičia esamų funkcijų turinį – naujesni serverio pataisymai neturi būti prarasti. Patikra nutraukia SQL, jei nėra tikro unikalaus `(ad_id,worker_id)` indekso; istorinių dublikatų netrina.
2. Patvirtinti viešinamų laukų sąrašą: įmonės pavadinimas, logotipas ir paskelbto skelbimo tekstai, atlygis, miestas / darbo adresas. Kandidatų, CV, paskyrų kontaktų, mokėjimų ir sesijų duomenys negrąžinami. Darbdavio į skelbimo tekstą savarankiškai įrašyti kontaktai bus vieši kartu su tekstu.
3. Patikrinti Supabase registracijos patvirtinimo leidžiamus grįžimo adresus: produkcijai `https://statybos24.lt/darbo-skelbimai/*` ir peržiūrai atitinkamą hostą. Tikslų šabloną peržiūrėti pagal dabartinę Auth konfigūraciją. Ši konfigūracija nepakeista.
4. Atskirai patvirtinus pritaikyti SQL ir įdiegti kodą, paliekant Maintenance įjungtą. Šio darbo metu niekas nepublikuota, nemigruota ir nediegta.
5. Tikruose testiniuose prisijungimuose patikrinti registraciją su el. laišku, dalijimosi nuorodos atidarymą kitame įrenginyje, kandidatavimą vieną kartą, darbdavio kandidatų sąrašą ir atšaukimo atmetimą. Kandidatūros įrašymas į bendrą bazę reikalauja konkretaus bandymo patvirtinimo.

Esamos skelbimų kainodaros pasiūlymai ankstesniuose `20261103190000_business_pro_ad_quota_REVIEW.sql` ir `20261103200000_first_job_ad_free_REVIEW.sql` dar nėra įdiegti. Business Pro mėnesio kvotai reikia serverinio prenumeratos laikotarpio integravimo; vien UI ar šie imitaciniai testai to neįrodo. Šis viešų skelbimų pakeitimas pats mokėjimų ar kvotų nekeičia.

Neįrodyta: tikra Supabase integracija, el. laiško grįžimas, tikra Stripe testinio režimo eiga, serverio socialinių tinklų peržiūros metaduomenys konkrečiam skelbimui (nuoroda veikia kaip SPA). Bendras viešas paleidimas dar NO-GO iki tikros integracijos patikros.
