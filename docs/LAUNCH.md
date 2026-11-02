# statybos24.lt – naujo dizaino paleidimas

**BŪSENA 2026-11-02: VIEŠAM ATIDARYMUI DAR NO-GO.** PR #14 jau sujungtas į `main`; Cloudflare /api/status patvirtino `s24-redesign-20261102` ir `MAINTENANCE_MODE=on` (neprisijungus / grąžina HTTP 503). Registracijos apsauga ir įmonės auditas pritaikyti per Supabase migracijas `launch_company_registration_guard_20261102` ir `launch_admin_company_audit_20261102`, abiejų bandymai su ROLLBACK patikrinti ir jokių testinių įrašų neišsaugota. Liko realūs Auth/srauto testai, kvietimų termino sprendimas ir mokėjimų testinė patikra. Neišjungti maintenance be GO.

## Patikrinta automatiškai (2026-11-01)

- Visos 166 DB funkcijos ir 23 lentelės, kurias kviečia kodas, egzistuoja; visų 137 iškvietimų parametrai sutampa.
- 82 ekranai (darbuotojas, darbdavys, admin × kompiuteris ir telefonas) – be klaidų ir be horizontalaus perpildymo.
- /hire, /hire/login (nauji, kaip prototipe), teisiniai puslapiai, pradinis puslapis – veikia.
- Cloudflare build – sėkmingas. PR #14 – be konfliktų.
- Teisės DB (transakcijose su testinėmis paskyromis, viskas atšaukta): darbuotojas nemato įmonės duomenų,
  skelbimo be apmokėjimo aktyvuoti neįmanoma, pažymėjimus mato tik leidus.

## 1. Prieš paleidimą (5 min.)

Cloudflare → Workers → `rankosstatybose` → Settings → Variables:
- `MAINTENANCE_TESTERS` = `tattoo.staponas@gmail.com, beatabune@gmail.com` (jei dar nėra)
- `MAINTENANCE_MODE` palikti `on`

## 2. Greitas rankinis testas peržiūroje (15–20 min.)

https://redesign-rankosstatybose.4floss.workers.dev – telefone ir kompiuteryje.

Darbuotojas (`beatabune@gmail.com`):
- [ ] Apžvalga, Kvietimai, Mano darbai, Istorija atsidaro su tikrais duomenimis
- [ ] Profilis: pakeisti km, išsaugoti; įkelti pažymėjimą (nuotrauka iš telefono)
- [ ] Darbo grafikas: pakeisti dieną, išsaugoti
- [ ] Darbo skelbimai: atidaryti skelbimą, įsiminti, kandidatuoti
- [ ] Žinutės (burbulas apačioje)

Darbdavys (`tattoo.staponas@gmail.com`, Business Pro – skelbimai nemokami):
- [ ] Apžvalga, Aktyvūs darbai, naujas darbo pasiūlymas (galima atšaukti)
- [ ] Darbo skelbimai → Naujas skelbimas → Paskelbti (nemokamai) → matosi darbuotojo paskyroje
- [ ] Kandidatas → Kviesti pokalbiui → darbuotojas patvirtina
- [ ] Žinutės, Komanda, Planai, Statistika, Kalendorius atsidaro
- [ ] Įmonės profilis (paspausti įmonės kortelę apačioje kairėje): pakeisti „Trumpai apie įmonę“, Išsaugoti; Keisti slaptažodį (reikia dabartinio)

Administratorius:
- [ ] Suvestinė, Darbuotojai (Valdyti → langas), Darbdaviai, Visi darbai, Ginčai, Klaidos, Darbo skelbimai, Pokalbiai
- [ ] Tarptautinė atranka → užklausa → būsena, poreikis, kandidatai, „Pridėti kandidatą“ (Statybos24 bazė / išorinis)

/hire:
- [ ] statybos24.lt/hire – forma (galima nesiųsti), „Sign in“ → /hire/login
- [ ] /hire/portal (su testine įmonės prieiga) – sutartis, poreikiai, poreikio puslapis su kandidatais, naujo poreikio forma

Visiems:
- [ ] Prisijungimo / registracijos langas (Prisijungti, Registruotis, Ieškau darbo / darbuotojų, Pamiršau slaptažodį)

**SVARBU:** 9,99 € apmokėjimo kelyje yra live Stripe – realių mokėjimų testui nevykdyti. Reikalingas atskiras Stripe test-mode E2E be klientų apmokestinimo.

## 3. Paleidimo būsena ir likę vartai

- [x] PR #14 sujungtas į main, gyvoje Cloudflare versijos žyma matoma, maintenance ON.
- [x] Abi SQL apsaugos ir audito migracijos pritaikytos; tikras įrašų/trigerių bandymas vykdytas su ROLLBACK.
- [ ] Prijungtoje naršyklėje su trimis savininko testinėmis paskyromis išbandyti login, darbdavio skelbimą/kvietimą, darbuotojo atsakymą, žinutes, admin impersonaciją ir grįžimą.
- [ ] Patikrinti Stripe test-mode mokėjimo kelią be realių lėšų.
- [ ] Patikrinti / nuspręsti dėl 12/24 val. kvietimo termino serverinės kontrolės: trigeris ir cron tebėra neįjungti. Neaktyvuoti aklai.
- [ ] Tik po GO Cloudflare keisti MAINTENANCE_MODE=off ir patikrinti viešą svetainę.

## Jei kas nors negerai

Pirma palikti / grąžinti MAINTENANCE_MODE=on ir užfiksuoti klaidą. Paskutinis senos `main` versijos commit prieš PR #14 buvo `0a24b048`, tačiau **vien kodo rollback nepakanka**: naujos serverinės registracijos taisyklės dabar yra aktyvios ir su sena neprivalomo kodo forma būtų nesuderinamos. Rollback planuoti kartu su DB pakeitimų laikinu išjungimu, nepanaikinant klientų duomenų ir nespaudžiant Stripe veiksmų.

## Kas sąmoningai atidėta (paleidimui netrukdo)

- Automatinis kvietimas, objekto vadovo rolė, moderatoriai su teisėmis (planas `docs/redesign/ADMIN_MODERATORS_PLAN.md`).
- Skelbimuose nėra „Rašyti įmonei / kandidatui“ pokalbio.
