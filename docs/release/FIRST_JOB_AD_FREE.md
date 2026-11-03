# Pirmas nemokamas skelbimas – atskiras pasiūlymas

Paruošta peržiūrai, neįdiegta. `20261103200000_first_job_ad_free_REVIEW.sql` dabar gali veikti be Business Pro mėnesinės kvotos SQL. Dabartiniai mokėjimų ir prenumeratos RPC neperrašomi.

- Viena naujo skelbimo publikacija 30 dienų kiekvienai paskyrai visiems planams, įskaitant įmonės narius, turinčius leidimą skelbti.
- Dovana netaikoma pratęsimui, neatsinaujina kas mėnesį ir negrąžinama ištrynus skelbimą. Nepavykęs INSERT dovanos nesunaudoja.
- Esami autoriai, kurių išlikusi istorija rodo publikuotą skelbimą, dovanos negauna. Tušti dabartiniai sąrašai neįrodo, kad anksčiau ištrintų skelbimų nebuvo.
- Privačios claims/policy lentelės su RLS; naršyklė negali jų skaityti ar įjungti dovanos.
- `job_ad_offer` tikrina teises ir grąžina pirmo skelbimo pasiūlymą. Mėnesinė kvota naudojama tik jeigu atskirai įdiegta; jos nebuvimas dovanos neblokuoja.
- Forma naudoja serverio pasiūlymą: „Pirmas jūsų skelbimas – nemokamas“, 0 €, „Paskelbti skelbimą“. Siuntimo metu pasikeitus pasiūlymui nenukreipiama į mokėjimą be naujo paspaudimo.
- „10 skelbimų“ tekstas nerodomas, kol serveris nepatvirtina mėnesinės kvotos įjungimo. Esamos Pro sąlygos šiuo pakeitimu nepakeičiamos.

## Patikra prieš leidimą

1. Nepriklausomas peržiūrėtojas paleidžia tik skaitymo `docs/sql-review/FIRST_JOB_AD_FREE_PREFLIGHT.sql`, palygina originalų `job_ad_upsert`, mokamą aktyvavimą ir visus BEFORE INSERT trigerius. Patikrina `auth.role()` kontekstą ir tvarką su galimai vėliau įdiegiama kvota.
2. Įvertina anksčiau ištrintų skelbimų istoriją ir patvirtina galimybę nustatyti, kam skelbimas tikrai pirmas. Neatkurti ir nekurti išgalvotos istorijos.
3. Po atskiro leidimo pritaiko tik atnaujintą pirmojo skelbimo SQL; mėnesinės kvotos SQL nereikalingas. Dovana po migracijos tebėra išjungta.
4. Įdiegiama tik suderinta skelbimo formos ir pasiūlymo logika, ne mėnesinės kvotos planų reklaminiai tekstai. Maintenance lieka ON.
5. Po atskiro aktyvavimo patvirtinimo įjungiama policy. SQL aktyvavimo eilutė faile palikta tik komentare; joks šios sesijos testas jos produkcijoje nevykdo.
6. Patvirtintu bandomuoju skelbimu patikrinamas tikras 0 € paskelbimas, matomumas, vienkartinis kandidatavimas. Jokių Stripe operacijų.

## Vietiniai testai

`tests/first-job-ad-sql.test.mjs`: pasiūlymas be kvotos SQL, Basic/Business pirmas ir antras skelbimas, galiojimas 30 d., nepavykęs INSERT, pratęsimo atmetimas, ištrynimas, nario dovana, Pro esamų sąlygų išsaugojimas ir privačių lentelių apsauga.

`tests/ad-quota-sql.test.mjs`: suderinamumas su ankstesniu mėnesinės kvotos pasiūlymu.

`tests/ad_quota_frontend.py`: sintetinis pirmas nemokamas pasiūlymas telefone / kompiuteryje, jokio realaus checkout.

Tikra Supabase integracija ir istorija nepatikrinta šioje sesijoje. Produkcijoje niekas neįjungta.

## Savininko leidimas ir prieigos riba

Savininkas pokalbyje suteikė leidimą paskelbti, diegti ir išbandyti pakeitimus su jo testinėmis paskyromis. Pakartotinio leidimo įprastiems šio darbo veiksmams nereikia. Čia nėra Supabase valdymo įrankio ar prisijungusios testinės naršyklės; tai prieigos, ne leidimo kliūtis. Tikras mokėjimas, kitų klientų duomenų keitimas ir viešas atidarymas neįtraukiami.

Tikrinančiam asmeniui: atlikti preflight ir istorijos vertinimą, palyginti bei pritaikyti atnaujintą `20261103200000_first_job_ad_free_REVIEW.sql`; įdiegus pasiūlymo frontendą pritaikyti atskirą `20261103203000_first_job_ad_free_ACTIVATE_REVIEW.sql`. Šis aktyvavimas nekeičia esamų skelbimų ar mokėjimų ir neįjungia mėnesinės kvotos. Atskirai patikrinti `job_ad_offer` tikros testinės paskyros kontekste, pirmą 0 € paskelbimą ir antrą mokamą pasiūlymą be Stripe checkout vykdymo. Vien lentelės sukūrimas dovanos neįjungia.
