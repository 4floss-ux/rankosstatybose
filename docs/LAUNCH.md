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
- [ ] Tarptautinė atranka → užklausa → būsena, poreikis, kandidatai, „Pridėti kandidatą“ (Statybos24 bazė / išorinis)

/hire:
- [ ] statybos24.lt/hire – forma (galima nesiųsti), „Sign in“ → /hire/login
- [ ] /hire/portal (su testine įmonės prieiga) – sutartis, poreikiai, poreikio puslapis su kandidatais, naujo poreikio forma

Visiems:
- [ ] Prisijungimo / registracijos langas (Prisijungti, Registruotis, Ieškau darbo / darbuotojų, Pamiršau slaptažodį)

Pastaba: 9,99 € apmokėjimas naudoja tikrą (live) Stripe raktą – testuojant bus tikras mokėjimas.
Jei norite išbandyti – sumokėkite ir grąžinkite pinigus Stripe skydelyje (Refund).

## 3. Paleidimas

1. GitHub → PR #14 → „Ready for review“ → „Merge pull request“.
2. Palaukti ~2 min., kol Cloudflare įdiegs (GitHub prie commit'o – žalia varnelė).
3. Atsidaryti statybos24.lt kaip administratorius (priežiūros režimas vis dar įjungtas) – greitai peržiūrėti.
4. Cloudflare → `MAINTENANCE_MODE` = `off` → svetainė atvira visiems.
5. Įjungti kvietimų atsakymo terminą (12 val., nuolatinei komandai 24 val.) – Supabase → SQL editor, paleisti:
   ```sql
   alter table public.job_invitations enable trigger job_invitations_enforce_deadline;
   select cron.schedule('expire-overdue-invitations', '*/5 * * * *', 'select public.expire_overdue_job_invitations()');
   ```
   (Iki šio žingsnio sena svetainė veikia kaip anksčiau – terminas tik rodomas naujame dizaine.)

## Jei kas nors negerai

- GitHub → sujungtas PR #14 → „Revert“ → sujungti. Cloudflare grąžins seną versiją per ~2 min.
- DB grąžinti nereikia: nauji objektai seno kodo netrukdo.

## Kas sąmoningai atidėta (paleidimui netrukdo)

- Komandos „Veiksmų istorija“ – migracija paruošta (`docs/redesign/pending-migrations/`), bet nepritaikyta.
- Skelbimuose nėra „Rašyti įmonei / kandidatui“ pokalbio.
