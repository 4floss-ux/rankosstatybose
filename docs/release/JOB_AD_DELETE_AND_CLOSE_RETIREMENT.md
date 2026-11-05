# Skelbimų ištrynimas ir „Uždaryti“ būsenos atsisakymas – saugus diegimo planas

Savininko sprendimas (2026-11-05): darbdaviui palikti tik **„Ištrinti skelbimą“**; atskiras skelbimo uždarymas nereikalingas. Skelbimui pasibaigus jis nebėra viešas, tačiau pratęsimas lieka galimas.

## Šios šakos pakeitimai

- Darbdavio ir administratoriaus skelbimų būsenų žymose pašalintas senas `closed` atvaizdavimas. Administratoriaus modalinio lango mygtukas dabar „Grįžti“ (jis **niekada nekeitė skelbimo būsenos**).
- Viešoje nuorodoje nenaudojamas tekstas „uždarytas“; ištrynimo patvirtinime įspėjama apie aktyvaus 4,99 € iškėlimo praradimą. Refund **nėra automatinis**.
- Saugyklos checkout šaltinyje naujiems 9,99 € mokėjimams senoji `closed` būsena nebeleidžiama. **NEDIEGTI šio checkout failo tiesiai į produkciją:** realiai veikianti checkout versija yra kita ir jai reikia atskiro, tikslinio suderinimo.
- Peržiūrai skirtame `job_ad_delete` SQL pridėtas **užraktas prieš ištrynimą, kol egzistuoja laukiamas 4,99 € iškėlimo užsakymas**. Mokėjimo būseną būtina patikrinti prieš leidžiant trinti; neiškylančių „pending“ įrašų negalima savavališkai išvalyti.
- Atskiras, **nepaleistas** `docs/sql-review/20261105200000_job_ad_closed_retirement_REVIEW.sql` pašalina `job_ad_close` ir `closed` iš CHECK tik po to, kai jau įdiegtas ir patikrintas pilnas ištrynimas.

## Produkcijos priklausomybės / išleidimo tvarka

1. Patikrinti esamą veikiantį **9,99 € `job-ad-checkout`** ir pritaikyti į jį tik checkout nuomos (`job_ad_checkout_acquire/release`) suderinamą apsaugą. Nepakeisti `STRIPE_SECRET_KEY` ar esamo apmokėjimo eigos; 4,99 € lieka **Sandbox / OFF**.
2. Patikrinti visas senesnės ištrynimo migracijos priklausomybes su produkcine schema, Storage CV prieigos užraktais, kvotos/dovanos logika, kandidatų žinučių FK, mokėjimų apskaita. Pritaikyti `20261103220000_job_ad_delete_REVIEW.sql` vieną kartą **su `enabled=false`**.
3. Įdiegti `job-ad-delete` Edge su `verify_jwt=true`; sutvarkyti service-only failų valymo Cron/Vault saugiai, be slaptų raktų įrašo į GitHub/žurnalus. Patikrinti valymą, autorizaciją, pakartotinį trynimą ir neapmokėtas/aktyvias Stripe sesijas.
4. Tik po išsamių Sandbox ir testinės paskyros bandymų įjungti ištrynimą atskiru `20261103222000_job_ad_delete_ACTIVATE_REVIEW.sql`.
5. Įsitikinti, kad **nėra `closed` skelbimų**, neliko klientų kvietimų į `job_ad_close`, ir pasiekiamas naujas ištrynimo kelias. Tada atskirai vykdyti `20261105200000_job_ad_closed_retirement_REVIEW.sql`.
6. Patikrinti 9,99 € skelbimų paskelbimą/pratęsimą, 4,99 € pending/paid mokėjimo režimus, skelbimų matomumą, kandidatus, CV valymą ir savininko trynimo teises. `Maintenance` palikti **ON**.

## Saugos ribos

**Šio pakeitimo įkėlimas į GitHub nėra produkcinis diegimas.** Kol visi integraciniai patikrinimai nebaigti, nediegti DDL, nerevokuoti kitų leidimų ir neįjungti trynimo ar iškėlimo. Istorinių migracijų nekeisti. Jei senoji `closed` būsena dar naudojama ne GitHub laikomame kliente, prieš `DROP FUNCTION` reikia jį išjungti. Jeigu iškėlimo užsakymas įstrigo `pending`, pirmiau patikrinti Stripe sesiją ir atitinkamai įvykdyti ar atšaukti mokėjimą – ne trinti po laiko limito.
