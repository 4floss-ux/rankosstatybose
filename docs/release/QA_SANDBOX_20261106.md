# Statybos24 – privati QA testavimo aplinka

Sukurta 2026-11-06. Tik demonstracijai, ne tikrų klientų operacijoms.

## Kam skirta

Trys savininko nurodytos prisijungusios paskyros gali matyti tą pačią sintetinę būseną. Paskyrų el. pašto adresai neįrašomi kaip paprastas tekstas į serverio šaltinį.

Autorizacija privalomai tikrinama **Supabase Edge funkcijoje** `qa-preview`, pasitikint `auth.getUser(jwt)`, o ne naršyklės perduotu el. paštu. Prieiga nepatvirtintiems vartotojams neleidžiama.

## Kaip atidaryti

Po patikrinto **Cloudflare diegimo**:
- prisijungti prie `https://statybos24.lt/?testas=1`;
- arba paspausti „🧪 Testavimo režimas“ (matoma tik Edge autorizuotoms paskyroms);
- rinktis „Darbuotojas“, „Darbdavys“, „Administratorius“;
- atidaryti meniu punktus, spausti bandomuosius veiksmus, žymėtis problemas;
- grįžti į tikrą svetainę per „Grįžti į svetainę“;
- „Atstatyti visus po 10“ grąžina pradinę bendrą sintetinę būseną.

## Bandomosios kategorijos

Po 10 startinių įrašų: dienos darbai, darbo skelbimai, kandidatai, darbuotojai, darbdaviai, kvietimai, pokalbiai, žinutės, įsiminimai, pranešimai, dokumentų / CV peržiūros, mokėjimų peržiūros, rezervacijos, darbo laiko įrašai, įvertinimai.

Tai **atskiras demonstracinis ekranas**, naudojantis bendrą Statybos24 apvalkalą ir dizaino elementus. Jis **nepakeičia** tikrų darbuotojo, darbdavio ir administratoriaus puslapių duomenų šaltinių ir **neatlieka** tikrų verslo veiksmų.

## Techninės saugumo ribos

- Testinė būsena laikoma tik `public.qa_preview_state`, su įjungtu RLS ir atimtomis `anon`/`authenticated` teisėmis. Ją keičia tik Edge funkcijos tarnybinis raktas.
- Sukuriami tik sintetiniai pavadinimai ir būsenos. Nėra tikrų naudotojų tapatybių, kontaktų, CV failų ar sąskaitų.
- Niekada nerašoma į `jobs`, `job_ads`, `job_ad_applications`, `job_messages`, `job_ad_payments`, `storage.objects`, `auth.users` ar Stripe.
- Bandomi mygtukai siunčia tik ribotus `act` veiksmus į `qa-preview`, kuri keičia tik `qa_preview_state`.
- Visi 3 testuotojai mato **bendrą** testinę būseną, kuri atnaujinama periodiškai arba mygtuku. Testo duomenys neįtraukiami į viešus skelbimų paieškos sąrašus.
- Jokio realaus mokėjimo, siuntimo, SMS, el. laiško ar fizinio CV failo ištrynimo.

## Patikrinta

- Privati DB lentelė sukurta; `anon` ir `authenticated` neturi tiesioginės SELECT / UPDATE teisės; `service_role` turi.
- `qa-preview` Edge Function ACTIVE, `verify_jwt=true`, turi nepriklausomą paskyros el. pašto patikrą.
- Naujas React kodas sukompiliuotas GitHub Actions „QA sandbox safe build (no deploy)“: SUCCESS.

## Dar nepatikrinta / reikalinga

1. **Cloudflare Workers**: šio pokalbio prieiga negali paleisti `wrangler deploy` į `statybos24.lt`; GitHub commit nėra produkcinis deploy.
2. Prisijungimas su kiekviena iš trijų paskyrų ir sėkmingas `qa-preview` atsakymas realiame domene.
3. Neautorizuoto vartotojo 403 patvirtinimas realiu prisijungimu.
4. Matomų 10 įrašų, išskleidimų, bandymų, atstatymo ir kryžminio atnaujinimo per kelias paskyras E2E testai.
5. Tikrų darbo procesų / mokėjimų bandymams reikės atskiro staging ir test-mode Stripe; QA peržiūra jų nepatvirtina.

## Diegimo tvarka

Prieš Cloudflare diegimą peržiūrėti production branch skirtumus ir nediegti pasenusio `main`, jei gyvas Worker naudoja kitą release. Suderinti tik QA pakeitimus su patikrintu gyvu release, paleisti `npm run build`, išlaikyti dabartines prieigos / maintenance / mokėjimų konfigūracijas ir galimybę grąžinti seną versiją. Tik tada paleisti diegimą. Demo SQL ar Edge nepakeičia Cloudflare publikavimo.
