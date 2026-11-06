# REAL E2E Statybos24 – izoliuotos testinės svetainės įjungimas

Atnaujinta: 2026-11-06.

## Kas jau yra
- Atskira Supabase development DB `wpldojonwvccdmpmlbfe`, visi 326 produkcinės schemos migracijų įrašai, 10 aktyvių skelbimų, 10 dienos darbų, 10 susietų kandidatūrų, 10 susietų kvietimų.
- 3 testinės rolės: `worker`, `employer`, `admin`. Reikia realiai patikrinti jų autentifikavimo duomenis, galiojimą ir galimybes atlikti kiekvieną veiksmą.
- Tikrieji `WorkerDashboard`, `EmployerDashboard`, `AdminDashboard` su originaliu React kodu. Atskira QA build konfigūracija `VITE_E2E_REAL_ACCOUNTS=true` nerodo ankstesnės sintetinės `QaSandbox` imitacijos, bet atidaro tikrus dashboardus.
- `wrangler.e2e.jsonc` naudoja ATSKIRĄ Cloudflare Worker pavadinimą `statybos24-e2e-test`, nenaudoja produkcinio `rankosstatybose`.
- `scripts/build-e2e.mjs` uždraudžia sukurti E2E build su produkcinio Supabase URL.

## Saugaus diegimo vartai (dar neužbaigti)
1. Cloudflare Access apsauga **prieš paskelbiant E2E svetainę viešame URL**: tik trijų savininko nurodytų el. paštų Allow politika, Access login patikra (Google/OTP) ir MFA jei įmanoma. Vien URL slaptumo nepakanka.
2. Atskiri Cloudflare Worker E2E aplinkos kintamieji: `VITE_SUPABASE_URL=https://wpldojonwvccdmpmlbfe.supabase.co` (build-time), šios šakos `VITE_SUPABASE_PUBLISHABLE_KEY` (build-time) ir `VITE_E2E_REAL_ACCOUNTS=true`. NIEKADA nedėti `service_role` į frontendą.
3. Prieš E2E URL paskelbimą patikrinti staging `auth.users` 3 scenarijaus tapatybių prisijungimą. Paskyros perjungiamos paspaudus „Pakeisti testinę paskyrą“: tai saugus atsijungimas, po kurio reikia prisijungti prie kitos testinės paskyros. **Ne administratorinis impersonation** ir ne vieno klavišo sesijų klastojimas.
4. Peržiūrėti visus išorinius integracijų endpointus: Stripe live, email, SMS, webpush, Sentry, geocoding, Telegram etc. Atjungti arba nukreipti į staging stub prieš suteikiant galimybę atlikti veiksmus. Supabase branch atskiria DB, bet automatiškai neapsaugo nuo išorinių side-effect funkcijų.
5. Naudoti `node scripts/build-e2e.mjs`, tik po Access policy įjungimo `npx wrangler deploy --config wrangler.e2e.jsonc` su patikrinimu, kad adresas ne pagrindinis `statybos24.lt`.
6. E2E smoke: iš darbuotojo realiai kandidatuoti -> darbdavio tikrame puslapyje matyti kandidatūrą -> pakviesti į pokalbį -> darbuotojas mato kvietimą -> admin mato įvykį. Papildomai patikrinti, kad vieši produkcinės DB sąrašai išlieka nepakeisti.

## Ko neteigiame
- Nei Cloudflare Access, nei E2E darbuotojų/įmonių srautų veikimas, nei live E2E serverio diegimas šiuo metu nepatvirtintas.
- QA build sėkmė nereiškia E2E mokėjimų/sesijų/saugumo audito sėkmės.
- `?testas=1` produkcijoje su įprastu build vis dar reiškia atskirą sintetinį peržiūros režimą, o ne tikrą E2E sesiją. Realus E2E bus atskirame Access apsaugotame Worker.
