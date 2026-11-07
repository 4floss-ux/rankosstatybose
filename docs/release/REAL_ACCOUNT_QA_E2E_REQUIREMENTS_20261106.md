# Statybos24: reikalavimas tikram 3 vaidmenų E2E testavimui
Data: 2026-11-06

## Vartotojo tikslas

Prisijungus prie statybos24.lt viena iš trijų savininko patvirtintų paskyrų, testavimo režime perjungti asmenį ir realiai naudoti **tuos pačius gamybinius React ekrano komponentus** kaip darbuotojas, darbdavys arba administratorius. Kiekvieno žmogaus veiksmas atsispindi kitų žmonių tikros sąsajos ekranuose.

Tai NĖRA statinių „po 10“ kortelių peržiūra su atskirais simuliuojamais mygtukais. Failas `src/p24/qa/QaSandbox.jsx` šiuo metu rodo būtent tik simuliaciją ir neatitinka galutinio E2E reikalavimo; jo **nevadinti pilnai veikiančiu tikrų paskyrų testu**.

## Privalomi funkciniai scenarijai

1. 10 netikrų darbdavio paskelbtų darbų, 10 ilgesnių darbo skelbimų, 10 kandidatų; su realia CRUD ir realiu ryšiu tarp scenarijaus paskyrų.
2. Perjungiamas testinis vaidmuo, kartu ir testinė tapatybė / sesija: atskiri darbuotojai (ne vien filtrai), darbdavio įmonė, administratoriaus paskyra.
3. Darbuotojas pamato skelbimą tikrame darbuotojo puslapyje, kandidatuoja; darbdavys pamato kandidatūrą tikroje kandidatų skiltyje; administratorius gali ją peržiūrėti iš savo rolės.
4. Darbdavys kviečia kandidatą į pokalbį, darbuotojas mato kvietimą; pokalbių skiltis pagal esamą išskleidžiamą vaizdą.
5. Darbdavys redaguoja, pratęsia ir ištrina **testinį** skelbimą; darbuotojui jis dingsta; bandomojo CV failų tvarkymas vyksta tik testinėje saugykloje.
6. Realūs meniu, filtravimas, paieška, žinutės, mėgstami, pranešimai, kvietimai, rezervacijos, darbo laikas, įvertinimai ir administratoriaus sąrašai. Kiekviena kategorija turi bent 10 tarpusavyje nuoseklių testinių objektų.
7. Tik Stripe test-mode, atskira testinė Storage, jokie tikri SMS, el. laiškai, sąskaitos ar mokėjimai; draudžiami produkciniai šalutiniai efektai.
8. Vienu paspaudimu atstatoma pradinė testinė būsena. Aiški juosta „TESTINIAI DUOMENYS“ viršuje.

## Saugumo kriterijai

- Tik trys savininko iš anksto patvirtintos **autentifikuotos** paskyros gali atidaryti testavimo režimą.
- Tapatybių perjungimą autorizuoja serveris, ne kliento pasirinktas el. paštas ar role claim.
- Jokių testinių įrašų viešoje produkcinėje paieškoje; visus testinių objektų įrašus skaityti / keisti gali tik izoliuotas testavimo backend.
- Tikri įrašai, Stripe live, produkcinės Storage saugyklos ir klientų pranešimai niekada nemodifikuojami.
- Tas pats frontend kodas / komponentai, atskirtas backend ir testinės tapatybės; testų rezultatai matomi skirtinguose vaidmenyse.

## Techniniai patikrinimai (atlikti tik skaitymo režimu)

- Produkcinėje Supabase bazėje: 326 migracijos, yra `job_ads` ir aktyvūs realūs duomenys.
- Esama development branch `statybos24-design-test` (ref `wpldojonwvccdmpmlbfe`) turi po vieną `admin`, `employer`, `worker` profilį, 1 įmonę, 2 darbuotojų profilius, 0 darbų.
- Esamos branch būsena `MIGRATIONS_FAILED`, tik 198 migracijos: **trūksta 128**. Joje neegzistuoja `job_ads`. Tai nepakankamai suderintas E2E backend.
- `QaSandbox` yra izoliuota sintetinė simuliacija: ne tikros rolės ir ne tie patys programos ekranai. Nereikia jos painioti su šiuo reikalavimu.
- Cloudflare paskelbimo prieigos šioje sesijoje nėra. GitHub pataisos savaime neatnaujina statybos24.lt.

## Įgyvendinimo eiga ir GO/NO-GO

1. Gauti naujausią realų frontend release ir pilnai suderintos schemos **atskirą staging** DB (atnaujinti seną branch tik jei galima saugiai atkurti visas migracijas, kitu atveju naujas izoliuotas projektas tik su savininko patvirtintais kaštais).
2. Sukurti testinį Auth aktorių rinkinį, įmonę, 10 tarpusavyje susietų įrašų kiekvienam scenarijui, testinę Storage ir atskirą pranešimų išsiuntimo stub.
3. Atskiras Cloudflare saugomas /testas kelias arba subdomenas pateikia tą patį frontendą, bet su **staging** Supabase instancija ir perjungiamais testinių asmenų prisijungimais. Produkcinis auth tikrina, ar testuotojas autorizuotas.
4. Test-mode mokėjimų izoliuoti nuo live Stripe; auditinti kiekvieną side-effect endpoint prieš paleidimą.
5. Atlikti tikrą E2E testą worker→employer→admin→worker su įrodymu, kad kiekvienas vienas kitą mato ir jokie realūs klientai testinių įrašų nemato.
6. Tik tada deploy į Cloudflare (staging route) ir pateikti testuotojui nuorodą.

**NO-GO produkcijos įjungimui, kol realios sesijos, izoliacija, E2E scenarijus ir Cloudflare deployment nepatvirtinti.**
