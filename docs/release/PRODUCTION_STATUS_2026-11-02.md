# Statybos24.lt – reali paleidimo būsena, 2026-11-02

## Patvirtinta (savininko leidimu)

- Naujas dizainas: PR #14 sujungtas į `main`, merge commit `2385054e2080c2ea4077e47a44a15ebad4e3e752`; prieš tai apsaugos patikra patvirtino `MAINTENANCE_MODE=on`.
- Live Cloudflare: `https://statybos24.lt/api/status` sugrąžino `release: "s24-redesign-20261102"`, `maintenance: true`; anoniminis `/` HTTP 503. Tai patikrinta GitHub Actions `Verify live redesign deployment`, run `41510930567`.
- Produkcinė Supabase `vxbfihnhielqambosmkc`: atliktos migracijos `20261102193520 launch_company_registration_guard_20261102` ir `20261102193537 launch_admin_company_audit_20261102`. Jos kuria naujus triggerius/funkcijas/claim lentelę; nevalo senų duomenų.
- Trečia produkcinė migracija: `activate_job_invitation_deadlines_20261102` (trigeris ir 5 min. cron aktyvūs).
- Po migracijų yra **6** tikėtinos funkcijos, **4** nauji trigeriai. `anon` neturi EXECUTE teisių trigeriams, admin audito RPC prieiga tik `authenticated` su papildoma `is_admin()` patikra.
- Read-only emuliuotos trijų savininko paskyrų sesijos: admin gali skaityti įmonės auditą; worker/employer atmetami (SQLSTATE 42501).
- Tikroje produkcinėje Supabase atliktas vienas integracinis bandymas su laikinąja įmone, darbuotojų/kitų naudotojų nekeičiant: blogas kodas INSERT/UPDATE atmestas, teisingas kodas rezervuotas, admin pakeitimas įrašytas į auditą. Visa bandymo transakcija **ROLLBACK**; patikrinta 0 claim įrašų, 0 testinių įmonių, 0 testinių audito įrašų po atšaukimo.
- Prieš migracijas DB buvo **19 esamų įmonių**: 12 skirtingų užpildytų kodų ir vienas juridinis darbdavys be kodo; nepakeista automatinė esamų įrašų migracija.

## Kas dar tikrinama prieš MAINTENANCE_MODE=off

1. **Realus prisijungusio naudotojo E2E:** su trimis savininko paskyromis praeiti login/refresh/logout, administratoriaus impersonaciją ir grįžimą, įmonės skelbimą, darbuotojo atsakymą/kvietimus/žinutes. Dabartinis pokalbis neturi prisijungusios naršyklės valdymo; šių veiksmų neapsimetame atlikę.
2. **Stripe testinė aplinka:** mokėjimų scenarijus nebuvo bandomas su realia kortele; produkcijos Stripe live kortelės nenaudoti testui.
3. **Kvietimų terminai įjungti:** migracija `activate_job_invitation_deadlines_20261102`. Trigeris `job_invitations_enforce_deadline` aktyvus (`tgenabled=O`), vienas `cron.job` kas 5 min. suplanuotas; prieš pakeitimą ir po jo `job_invitations` turėjo 0 įrašų. Ateities kvietimų 12/24 val. elgseną dar reikia patikrinti realiu Auth E2E, bet serverinė kontrolė įjungta.
4. **UI/pagrindinių veiksmų peržiūra tikrame telefone/kompiuteryje:** prototipo atitikimo, mokamų planų ir sesijos atkūrimo mock/CI testai nėra pakaitalas.

## Saugus tęstinumas ir rollback

- Kol vartai neuždaryti, laikyti `MAINTENANCE_MODE=on`. Neatskleisti lankytojams testinio domeno, jei jis naudoja tą pačią produkcinę DB ir live Stripe.
- Senas pagrindinės šakos commit prieš PR #14: `0a24b04857186ce7f65b1f607d78f18000dc5ba0`. **Vien senosios UI versijos sugrąžinimas nėra pakankamas rollback**, nes joje įmonės kodas registruojantis buvo neprivalomas, o aktyvi DB dabar tai blokuoja. Jei būtina grąžinti seną frontą, koreguoti ir DB registracijos trigerius atominiu, atskirai peržiūrėtu rollback – nešalinti klientų ar istorinių įrašų.
- Po įdiegimo **nekartoti** `docs/sql-review/*_REVIEW.sql`: jie jau įrašyti migracijų istorijoje. Failai laikomi kaip istorinis peržiūros šaltinis, ne kaip automatiškai vykdomas scenarijus.
