# Pokalbio pakeitimų ir kandidato kortelės pataisa

2026-11-04. Šaka `fix/interview-attention-card`. Pagrindas – jau patvirtinta `16a54b4` funkcija ir jos diegimo dokumentacija; ankstesnis kodas išsaugotas.

- Raudonas kandidato skaitiklis apima žinutę, įkeltą CV ar patvirtintą pokalbį. Be tikros paskyros serverio atsakymo neteigiu, kuri konkreti naujiena liko prie savininko nurodytos paskyros. Skaitikliui pridėtas paaiškinimas. Matomos CV / patvirtinimo naujienos po 1,2 s automatiškai pažymimos perskaitytomis per esamą `job_ad_news_read`; už ekrano / paslėptoje skiltyje esančios naujienos nežymimos. Įeinančios žinutės nuo to neperskaitomos. Klaidos atveju žymėjimas lieka ir galima pakartoti rankiniu mygtuku.
- Darbuotojo pakeistas, dar iš naujo nepatvirtintas kvietimas rodomas svetainės raudona dėmesio spalva su paaiškinimu. Pirminis kvietimas išlieka žalias; pakartotinai patvirtintas kvietimas tampa žalias. Būsena nepriklauso nuo to, ar perskaitytas naujienos pranešimas. Pakeitimas apima laiką ir būdą (gyvai / telefonu), kaip žymi jau įdiegtas kvietimo versijos trigeris.
- Darbdavio kandidato kortelėje atskirtos vardo / miesto / patikimumo eilutės, CV pavadinimas, kandidato žinutė ir pokalbio duomenys. Data, būdas, pastaba ir patvirtinimas sudėti į tvarkingą vidinę kortelę; veiksmų mygtukai vienodi. Telefone veiksmai išsidėsto po informacija.

## Atskiras SQL – tik peržiūrai, NETAIKYTA

`20261104140000_job_ad_interview_state_REVIEW.sql` prideda vieną **tik skaitymo** RPC, grąžinantį prisijungusio darbuotojo kandidatūrų ID ir būtinybę iš naujo patvirtinti pakeistą kvietimą. Tai neskaito CV, žinučių turinio ar kito darbuotojo duomenų. Naudojama esama `job_ad_require_worker()` su `account_can_use_platform` ir darbuotojo rolės patikra; anoniminė prieiga uždrausta.

Esami `job_ads_worker_list`, `job_ad_news`, kvietimo, CV bei mokėjimų RPC neperrašomi. Naujų lentelių / trigerių nėra. Be šio naujo RPC sąsaja gali parodyti raudoną būseną pagal neperskaitytą laiko pakeitimo įvykį, tačiau patikimam išlaikymui po perskaitymo / pakartotinio atidarymo reikia peržiūrėto SQL. Jau pritaikyto `20261104003000_job_ad_news_REVIEW.sql` produkcijoje kartoti nereikia.

## Vietinės patikros

- 1440 / 390 px sintetiniai naršyklės bandymai: žalia pradinė ir patvirtinta kortelė; raudona pakeista kortelė net kai pranešimų sąrašas jau tuščias; po patvirtinimo vėl žalia. Matomo kandidato CV / patvirtinimo skaitiklis dingsta, bet neperskaityta žinutė lieka. Išsaugoti Messenger, CV įkėlimo, kvietimo laiko keitimo ir klaidų scenarijai.
- Tikras naujas SQL vykdytas tik izoliuotame vietiniame PGlite: pakeisto kvietimo būsena išlieka po skaitymo, dingsta patvirtinus, grįžta pakeitus būdą; kita paskyra, darbdavys, sustabdyta paskyra ir anoniminis kvietimas nepasiekia darbuotojo būsenos.
- Sesijų / viešų nuorodų regresijos ir surinkimas. Node rinkinys: 29 PASS.
- Tikrų paskyrų integracija neatlikta. Produkcijos, SQL, Maintenance ir tikrų klientų duomenų nekeičiau. Pataisa skirta peržiūrai, ne automatiškai diegiama.

## Sintetiniai vaizdai

[Darbdavio kortelė kompiuteryje](previews/s24-candidate-card-1440.png) · [Darbdavio kortelė telefone](previews/s24-candidate-card-390.png) · [Raudonas pakeistas kvietimas telefone](previews/s24-interview-changed-390.png). Tai vietiniai bandymai, ne tikros paskyros duomenys.
