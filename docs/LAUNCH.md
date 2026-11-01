# statybos24.lt – naujo dizaino paleidimas

Viskas paruošta šakoje `redesign` (PR #14). DB pakeitimai jau pritaikyti ir yra tik pridedantys –
dabartinė svetainė su jais veikia kaip anksčiau, todėl paleisti galima bet kada.

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

/hire:
- [ ] statybos24.lt/hire – forma (galima nesiųsti), „Sign in“ → /hire/login

Pastaba: 9,99 € apmokėjimas naudoja tikrą (live) Stripe raktą – testuojant bus tikras mokėjimas.
Jei norite išbandyti – sumokėkite ir grąžinkite pinigus Stripe skydelyje (Refund).

## 3. Paleidimas

1. GitHub → PR #14 → „Ready for review“ → „Merge pull request“.
2. Palaukti ~2 min., kol Cloudflare įdiegs (GitHub prie commit'o – žalia varnelė).
3. Atsidaryti statybos24.lt kaip administratorius (priežiūros režimas vis dar įjungtas) – greitai peržiūrėti.
4. Cloudflare → `MAINTENANCE_MODE` = `off` → svetainė atvira visiems.

## Jei kas nors negerai

- GitHub → sujungtas PR #14 → „Revert“ → sujungti. Cloudflare grąžins seną versiją per ~2 min.
- DB grąžinti nereikia: nauji objektai seno kodo netrukdo.

## Kas sąmoningai atidėta (paleidimui netrukdo)

- Admin „Tarptautinė atranka“ ir /hire/portal – esamas (veikiantis) vidus su nauju stiliumi, ne 1:1.
- Verslo pristatymo puslapio ekrano nuotraukos rodo seną dizainą.
- Skelbimuose nėra „Rašyti įmonei / kandidatui“ pokalbio.
