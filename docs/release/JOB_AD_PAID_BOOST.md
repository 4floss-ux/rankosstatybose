# Darbo skelbimo iškėlimas – peržiūrai, NEĮJUNGTA

Savininko pasirinkimas: **4,99 € už 7 dienas**, vienkartinis pirkimas visuose planuose. Pasibaigus galima pirkti vėl tiek kartų, kiek reikia; jokio bendro pirkimų limito ar automatinio pratęsimo. Kol iškėlimas aktyvus, antro tokio pat laikotarpio pirkimas blokuojamas, kad nebūtų dvigubai mokama.

## Kas paruošta

- Skelbimo valdyme esamo dizaino mygtukas ir modalas „Iškelti skelbimą“. Kaina ir trukmė fiksuota serveryje, nepriimama iš naršyklės. Mygtukas nerodomas, kol serveris nepraneša, kad peržiūrėta funkcija įjungta.
- Darbuotojo ir viešų skelbimų sąrašuose aktyvūs iškelti skelbimai yra aukščiau įprastų; tarp jų – naujausiai iškelti. Miesto filtrai, galiojančio skelbimo ir įmonės prieigos taisyklės išlieka. Viešų skelbimų rikiavimas atliekamas prieš puslapiavimą, o ne tik matomame puslapyje. Žyma „Iškeltas“, automatinis galiojimo pervertinimas kas minutę matomame puslapyje.
- Nauji SQL apvalkalai naudoja esamas JSON projekcijas ir grąžina jų laukus su dviem viešais iškėlimo laikais. Esami kandidatavimo, CV, `interview_note`, kontaktų ir mokėjimų RPC neperrašomi, esamų leidimų neišplečia. Iki naujų RPC įdiegimo naudojami senieji tik gavus „funkcija neegzistuoja“, ne leidimų klaidos atveju.
- Esamas `job-ad-checkout` papildytas atskiromis `boost_create` / `boost_confirm` šakomis. Įprastas 9,99 € skelbimo apmokėjimas, jo lease / deletion apsauga, prenumeratos, pirmo nemokamo skelbimo ir Pro kvotos nekeičiami. Boost užsakymai atskiri nuo skelbimo paskelbimų / pratęsimų kvotos.
- Atskiras naujas tos pačios Stripe paskyros raktas `STRIPE_BOOST_SECRET_KEY`. Esamo Stripe kliento ID naudojamas tik sutampančioje aplinkoje; jo reikšmė užfiksuojama užsakyme, kad pakartotinės užklausos nekeistų checkout parametrų. Įmonės billing įrašai neperrašomi. Bandomi boost mokėjimai **nekeičia** esamo `STRIPE_SECRET_KEY` ar jo veikimo. Test / live užsakymai ir iškėlimo būsena atskirti; testinės būsenos nepersikelia į live. Test režimas ribojamas vienos aiškiai nustatytos testinės įmonės ID.
- Stripe užsakymas pakartotinai naudojamas, pirkimo idempotency raktas susietas su vienu užsakymu. Naujas pirkimas po galiojimo – naujas užsakymas. Serveris tikrina apmokėjimą, 499 ct, EUR, vienkartinį payment režimą, Stripe aplinką, užsakymą, įmonę ir skelbimą. Viešas browser callback iškėlimo pats neaktyvuoja.
- Naujas pasirašytas `job-ad-boost-webhook` patvirtina mokėjimą ir negrįžus į svetainę. HMAC / laiko lango patikra, gavus įvykį papildomas serverinis Stripe sesijos patikrinimas, idempotentinis DB įjungimas. Nutraukta sesijos registracija atsigauna gavus tikrą apmokėjimo webhook.
- Į produkciją šiame darbe mokėjimų kodas nediegtas, SQL netaikytas, Stripe nepasiektas, jokių tikrų mokėjimų ar duomenų rašymų neatlikta. Maintenance ir esamos sistemos nepakeistos.

## Ką būtina peržiūrėti prieš įjungiant

SQL: `docs/sql-review/20261105003000_job_ad_paid_boost_REVIEW.sql`. Naujos privačios lentelės / RPC, pagal nutylėjimą **OFF**, test aplinka ir jokia testinė įmonė nenustatyta. Palyginti naujus vardus, esamas matomumo / darbuotojo / įmonės funkcijas ir tikrą schemą. SQL neskirtas automatiniam pakartotiniam vykdymui.

**Svarbi galiojimo sąlyga:** skelbimas turi galioti dar bent **8 dienas**. Taip užtikrinamos pilnos 7 iškėlimo dienos net jei Stripe checkout užbaigiamas per jo iki 24 val. langą. Patvirtinant tikrinama, kad liktų 7 dienos. Trumpesnio skelbimo galiojimas automatiškai ir nemokamai nepratęsiamas; sąsaja pasiūlo pirmiau pratęsti patį skelbimą. Tai aiškiai rodoma modale, reikalinga savininko verslo taisyklės peržiūra.

**Sumokėta, bet skelbimas uždarytas / ištrintas / nebeprieinamas mokėjimo metu:** iškėlimas neviešinamas, užsakymas lieka `paid_unfulfilled`, klientui nesakoma mokėti vėl. Turi būti sutarta operacinė peržiūros / grąžinimo tvarka; automatiniai realūs refund čia neįgyvendinti ir nevykdomi. Tam pateiktas `JOB_AD_BOOST_MONITOR_READONLY.sql`. Prieš paleidimą tai laikyti nebaigta mokėjimų operacine dalimi, ne sėkmingai suteikta paslauga.

## Minimalus išorinis paruošimas (šioje sesijoje nėra Stripe / Supabase administravimo prieigos)

Tik po savininko ir nepriklausomo tikrintojo patvirtinimo:

1. Pritaikyti naują SQL patikrintoje testavimo aplinkoje. Nieko ankstesnio nekartoti.
2. Pirmiausia palyginti tikrą įdiegtą `job-ad-checkout` su saugyklos versija. Saugyklos checkout jau turi ankstesnes `job_ad_checkout_acquire` / `job_ad_checkout_release` priklausomybes; šis boost SQL jų neprideda. Jei jos dar neįdiegtos, **neperrašyti veikiančio checkout visa šakos kopija** – prie tikro įdiegto pagrindo perkelti tik šio pakeitimo boost importą / veiksmų šaką ir atskirus naujus modulius, arba atskirai užbaigti ankstesnę lease peržiūrą. Šiame darbe tikro Edge serverio turinio pasiekti negaliu. Įdiegti peržiūrėtą papildytą `job-ad-checkout` ir naują `job-ad-boost-webhook`. Naujam webhook pridėti TIK jo konfigūracijos skiltį iš `supabase/functions/job-ad-boost-webhook/config.REVIEW.toml` (`verify_jwt=false`); senų funkcijų nustatymų nekeisti. Viešą webhook saugo HMAC, ne vartotojo JWT.
3. Stripe **Sandbox** sukurti endpoint `https://<projekto-ref>.supabase.co/functions/v1/job-ad-boost-webhook` įvykiams `checkout.session.completed` ir `checkout.session.async_payment_succeeded`. Endpoint signing secret saugiai įrašyti į `JOB_AD_BOOST_WEBHOOK_SECRET`, Sandbox API raktą į `STRIPE_BOOST_SECRET_KEY`. Nei jų, nei sesijų į chat nesiųsti. Esamo `STRIPE_SECRET_KEY` nekeisti.
4. Tik patvirtintam testui nustatyti `app_private.job_ad_boost_settings`: `environment='test'`, konkretus sintetinis `test_company_id`, `enabled=true`. Kitoms įmonėms mokėjimo pasirinkimas lieka išjungtas.
5. Realiai Sandbox išbandyti sėkmę, atšaukimą, pakartotinį paspaudimą, vėluojantį / kartotinį webhook, uždarytą naršyklę, nebeprieinamą skelbimą, rikiavimą ir pasibaigusį laikotarpį. Patikrinti `webhook_seen_at`, kad rezultatas nepriklausytų nuo naršyklės grįžimo. Vietiniai testai to neatstoja.
6. Užbaigti / patikrintai uždaryti testines laukiančias sesijas ir perskaityti monitoringo rezultatą. Po atskiro patvirtinimo nustatyti atskirą live boost raktą / live webhook secret, `environment='live'` ir įjungti funkciją. Savininkas turi patikrinti kainos / mokesčių / sąskaitų taisykles ir grąžinimo tvarką. Nė vienas šių veiksmų šiame darbe neatliktas.

Be šių patikrų mokamam iškėlimui **NO-GO**. Likusios svetainės ar Maintenance būsenos ši išvada nekeičia.

## Papildomas savininko prašymas

Atskiras šaltinio įrašas `d16d4a2` (`fix/interview-candidate-accordion`): „Pakviesti pokalbiui“ pradžioje rodo tik vardą / pavardę, išskleidimo rodyklę ir svarbų neperskaitytų naujienų skaitiklį. Paspaudus atsiveria ankstesnė pilna kortelė. Suskleistos kortelės nelaikomos perskaitytomis. Šis UI jau įdiegtas atskirai, be mokėjimų kodo ar SQL. Diegimo įrodymas: `docs/release/INTERVIEW_ACCORDION_DEPLOY.json`; aktyvi versija `ec03d89f-2eb2-47f8-8c6e-7a6ccbc44193`, 100 %, Maintenance ON.

## Vietinė patikra

42 Node patikros PASS: tikras naujas SQL izoliuotame PGlite, nemokamų / iškeltų rikiavimas ir puslapiavimas, pakartotiniai pirkimai po galiojimo, kainos / aplinkos / įmonės / skelbimo įrodymas, HMAC, vėluojanti sesijos registracija, sintetinė checkout idempotencija, ankstesnės checkout / delete apsaugos ir administratoriaus sesijos. 1440 / 390 px naujo boost pasiūlymo, jo OFF / eligibility / klaidos / pakartojimo ir prioriteto UI, taip pat ankstesnių skelbimų, kandidatavimo, CV, Messenger ir suskleidimo regresijos PASS. Build ir webhook TypeScript bundling PASS. Tai nėra tikras Stripe ar Supabase integracijos bandymas.

Rollback prieš tikrą paleidimą: stabdyti naujus pirkimus per `enabled=false`, bet palikti naują skaitymo / rikiavimo kodą iki jau apmokėtų iškėlimų pabaigos. Aktyvių mokamų iškėlimų metu aklai grįžti į senus nerikiuojančius klientus negalima. Prieš įjungiant taip pat sutarti, kaip sąsaja perspės savininką apie jau iškelto skelbimo uždarymą / ištrynimą; šios refund sąlygos savavališkai nenustatytos.
