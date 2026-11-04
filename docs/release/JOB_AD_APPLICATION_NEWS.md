# Kandidatavimo išvaizda ir naujienos – peržiūrai

2026-11-04. Šaka `fix/job-ad-application-news`, pagrindas `ab5e2f3` (ankstesnės UI ir Claude pataisos išsaugotos). Nieko nediegta, šakos nejungtos, Maintenance nekeistas. Esami neįrašyti failai neįtraukti ir neperrašyti.

## Pakeitimai

- Darbuotojo „Dalintis“ naudoja tą patį pilno pločio mygtuką kaip kiti dešinės kortelės veiksmai. Pašalintas sakinys „Įmonė matys jūsų profilį, patikimumą ir įvertinimus“.
- CV kortelė rodo būseną, failo pavadinimą su ilgo teksto laužymu ir privatumo paaiškinimą. Įkėlimo ir klaidos atšaukimo eiga išsaugota.
- Kvietimo data naudoja esamą `RoundedDateSelect`, laikas – esamą `SiteSelect`, pokalbio būdas – svetainės segmentų valdiklį. Sutvarkytos radijo reikšmės, nuo kurių priklauso telefono paaiškinimo rodymas.
- Telefoninio pokalbio kortelėje matoma data, laikas, būdas, pastaba ir patvirtinimas.
- Meniu / skelbimų / kandidatų skaitikliai atnaujinami kas 15 s matomame puslapyje ir grįžus į langą. Atviro darbdavio skelbimo kandidatai taip pat atnaujinami. Užklausų ir rodymo būsena atskirta pagal paskyrą bei pasirinktą įmonę; pavėluoti ankstesnės paskyros atsakymai atmetami.
- Skelbimų pokalbiai įtraukti į esamą `Messenger` sąrašą ir burbuliuko neperskaitytų pokalbių indikatorių abiem pusėms; iš jo galima tiesiai atidaryti tą patį pokalbį. Išsaugomas esamas „paslėpti sau / vėl parodyti gavus naują žinutę“ elgesys.
- Nauja žinutė abiem kryptimis remiasi esamomis `job_ad_chat_unread`, `job_ad_chat_messages` ir `job_ad_message_reads`. Žinutė perskaitoma atidarius matomą pokalbį. Paslėptas pokalbis jos nenuima. Rašyti leidžiama ir prieš kvietimą į pokalbį, kaip leidžia esamas serveris. Atmesto kandidato pokalbį galima peržiūrėti, bet ne rašyti.
- CV, CV prašymo, kvietimo, naujo laiko ir patvirtinimo naujienos rodomos prie konkrečios kandidatūros. „Pažymėti perskaityta“ patvirtina tik parodytas įvykio versijas. Tai nepažymi žinučių perskaitytomis. Vėliau gautas pakeitimas išlieka neperskaitytas, senas atsakymas negali atsukti skaitymo būsenos.

## SQL – tik atskirai peržiūrėti, NETAIKYTA

`docs/sql-review/20261104003000_job_ad_news_REVIEW.sql`

Nekuriama antra žinučių ar pranešimų lentelė. Papildoma esama `job_ad_message_reads` lentelė įvykių skaitymo versijomis ir `job_ad_applications` – kvietimo pakeitimo laiku / versija. Du nauji RPC naudoja esamą `job_ad_chat_side` ir `job_ad_can_manage`. Tiesioginė lentelių prieiga neatveriama, anoniminiai kvietimai uždrausti, neaktyvi paskyra naujienų negauna. Įmonės skaitymo būsena bendrinama jos įgaliotiems vadovams, kaip esamoje skelbimų žinučių sistemoje; tai nėra atskiras kiekvieno komandos nario gautųjų sąrašas.

Bendroji `job_notifications` naudojama trumpalaikiams darbams / kvietimams ir nėra patikimai apibrėžta šioje saugykloje kaip darbo skelbimų kandidatūrų saugykla. Todėl į ją neįrašomi spėjami `job_id` ar nauji įvykių tipai. Skelbimų naujienos išplečia jau turimą skelbimų pokalbių sistemą.

SQL neperrašo registracijos, mokėjimų, CV įkėlimo, kandidatavimo ar kvietimo RPC. Papildantis trigeris pažymi naują / pakeistą kvietimą ir neleidžia to paties CV ar to paties patvirtinimo pakartotinio kvietimo paversti nauju įvykiu; nepakeisto kvietimo persiuntimas nenuima jau duoto patvirtinimo. Seni kvietimai masiškai neatnaujinami; pirmas seno kvietimo laiko pakeitimas teisingai žymimas pakeitimu. Esamo CV / patvirtinimo aktuali būsena gali būti parodyta pirmą kartą, bet nauja istorinė įvykių lentelė nekuriama. Išoriniai laiškai, push ir Stripe veiksmai nenumatyti.

Prieš bet kokį būsimą diegimą nepriklausomas tikrintojas turi palyginti šį papildymą su tikra schema ir susijusiais esamais trigeriais. Po peržiūros pirmiausia reikėtų pritaikyti suderintą SQL, tada kodą ir atlikti tikrą dviejų testinių paskyrų bandymą. Ši užduotis šių veiksmų neautorizuoja.

## Patikrinta vietoje

- `python tests/job_ad_news_frontend.py`: 1440 / 390 px, automatiniai meniu ir eilučių skaitikliai neatidarius skelbimo, skirtingos pusės, esamo Messenger sąrašo / burbuliuko sutartis ir atidarymas, žinutės perskaitymas, CV / patvirtinimo įvykiai, skaitymo klaidos išsaugojimas, CV įkėlimo ir pokalbio patvirtinimo frontend keliai, datos / laiko / būdo valdikliai, ilgas failo pavadinimas, vienodas mygtukų plotis, be horizontalaus perpildymo.
- `node --test tests/job-ad-news-sql.test.mjs`: tikras siūlomas SQL izoliuotame vietiniame PGlite, 7 scenarijų grupės ir bendras testas (8 PASS). Abipusės žinutės, CV, kvietimas, patvirtinimas, laiko pakeitimas, pakartotinių veiksmų deduplikavimas, konkurencinis naujo įvykio išsaugojimas, senesnio perskaitymo atsakymo atmetimas, įmonės filtras, kita paskyra, anoniminės teisės ir lentelės apsauga.
- Susiję ankstesni testai: darbdavio skelbimo detalė, viešas sąrašas / miesto filtras / nuoroda, grįžimas po prisijungimo, vienkartinio kandidatavimo SQL, 18 administratoriaus sesijos testų.
- Galutinis bendras Node testų paleidimas: **36 PASS, 0 FAIL** (įskaitant 8 naujienų SQL ir 18 administratoriaus sesijos patikrų).
- Pagrindinės svetainės ir atskiro Hire surinkimas. Išlieka įprastas didesnių JS paketų įspėjimas.

Visuose naršyklės testuose Supabase ir Storage atsakymai sintetiniai, išorinis tinklas užblokuotas. Vietinis SQL testas nepatvirtina produkcinės schemos ar realios Supabase integracijos. Tikras testas su savininko paskyromis neatliktas: šioje sesijoje nėra saugios prisijungusios Work naršyklės valdymo ir Supabase prieigos. Slaptažodžiai, sesijos, klientų duomenys ar mokėjimai nenaudoti.

## Nepriklausomos peržiūros pataisos po `34bec97`

- Darbdavio Messenger sąrašas nebefiltruojamas vien pagal neperskaitytas žinutes. SQL grąžina ir perskaitytus pokalbius, kuriuose yra žinučių, o sąsaja išlaiko juos su nuliniu skaitikliu. Paskutinės žinutės laikas skaičiuojamas iš abiejų pusių žinučių, todėl išlieka ir darbdavio pradėtas pokalbis be kandidato atsakymo. Tuščios kandidatūros ar vien CV / kvietimo naujiena į Messenger pokalbių sąrašą savaime nepridedamos.
- Abiejose naujose SQL funkcijose papildomai naudojama esama `public.account_can_use_platform(auth.uid())` patikra. Išsaugota aktyvumo, konkrečios kandidatūros pusės ir pasirinktos įmonės apsauga. Sustabdytas darbuotojas ar darbdavys negauna net perskaitytų pokalbių metaduomenų ir negali keisti skaitymo žymėjimo.
- Pridėti atskiri SQL testai: pokalbio išlikimas perskaičius; tik darbdavio siųstos žinutės; aktyvus, bet sustabdytas darbuotojas ir darbdavys; bandymas pažymėti naujienas perskaitytomis sustabdytos paskyros teisėmis. Naršyklėje 1440 / 390 px patikrinamas pakartotinis perskaityto pokalbio atidarymas ir išlikimas po automatinio atnaujinimo.
- Šis SQL vis dar tik peržiūrai. Tikros Supabase ar tikrų paskyrų šiuo papildymu nebandyta, nieko nediegta, šakos nejungtos, Maintenance nekeistas.
