# Izoliuota dizaino testavimo aplinka

URL: https://test.statybos24.lt
Alternatyva: https://statybos24-design-test.4floss.workers.dev

## Prisijungimas

Atidarykite URL, spauskite „Prisijungti“ ir naudokite atskirai perduotus
testinių paskyrų duomenis. Paskyrų adresai: darbuotojas@example.test,
darbdavys@example.test, administratorius@example.test. Slaptažodžiai saugykloje nesaugomi.
Keisdami rolę pirmiausia atsijunkite. Gamybinės paskyros čia neveikia.

## Izoliacija

- Atskiras Worker `statybos24-design-test`, konfigūracija `wrangler.staging.jsonc`.
- Tik `test.statybos24.lt` custom domain; gamybinė `wrangler.jsonc` nepakeista.
- Supabase šaka `statybos24-design-test`, ref `wpldojonwvccdmpmlbfe`,
  parent `vxbfihnhielqambosmkc`. Sukurta su `with_data=false`.
- Patikrinta, kad prieš testinių paskyrų sukūrimą klientų lentelės tuščios.
- Ne gamybiniuose hostuose klientas visada naudoja testinės šakos URL/raktą,
  net jei automatinis Cloudflare branch build paveldi produkcinius VITE kintamuosius.
- Atskiras staging Worker atmeta gamybinius hostus ir visus `/api/*` kvietimus.
- CSP leidžia tik testinės bazės Auth, REST, Storage ir Realtime ryšius.
  Edge Functions (SMS, mokėjimai, geokodavimas, push, /hire integracijos) blokuojamos.
- Sentry ir push service worker registracija testinėje aplinkoje išjungti.
- `X-Robots-Tag: noindex, nofollow, noarchive`; cache išjungta.
- Tai izoliuotas funkcinis/UI testas, ne pilnas integracijų patvirtinimas.
  Nenaudokite tikrų kontaktų ar asmens duomenų.

## Diegimas

```powershell
npm ci --no-audit --no-fund
node --test staging.test.js
npm run build:staging
npx --yes wrangler@4 deploy --config wrangler.staging.jsonc
```

Nenaudoti numatytojo `wrangler deploy` šiai aplinkai.
Supabase šaka laikina (persistent=false), gali būti pristabdyta neveikimo metu.
Jos skaičiavimo ištekliai gali būti apmokestinami pagal Supabase planą.
Nesujungti šakos į pagrindinę bazę ir nekopijuoti klientų duomenų.

## Testinės schemos papildymai

2026-10-29 nustatytas schema drift: branching atkūrė migracijų istoriją,
tačiau joje trūko jau produkcijos schemoje esančių laukų. Tik testinėje bazėje
pridėti `jobs.platform_scope_acknowledged_at`, `platform_scope_version`,
`location_latitude`, `location_longitude`, `location_geocoded_at`,
`user_private.birth_date` ir `worker_profiles.search_location_enabled`,
`search_latitude`, `search_longitude`, `search_location_accuracy_m`,
`search_location_updated_at`. Gamyboje vykdytos tik schemos metaduomenų SELECT užklausos.
Atkuriant šaką šiuos laukus reikia vėl suderinti; tai nėra produkcinė migracija.

## Patikros ir ribos

- Ankstesnio PR head `111acff7` GitHub build ir Cloudflare build sėkmingi.
- Vietoje sėkmingai sukompiliuoti production ir staging paketai.
- `node --test staging.test.js`: 2 sėkmingos izoliacijos patikros.
- Naršyklėje patikrintas HTTPS domenas, darbdavio ir darbuotojo prisijungimas.
- Pilna scenarijų matrica tebėra `dashboard-regresijos-tikrinimas.md`.
- Supabase advisors rodo paveldėtas SECURITY DEFINER perspėjimų grupes ir
  RLS lenteles be politikų (uždaryta prieiga). Tai nėra visos schemos saugumo auditas.
  https://supabase.com/docs/guides/database/database-linter
- Vite rodo ankstesnius /hire vertimų pasikartojančių raktų ir didelio paketo perspėjimus.

Administratoriaus prisijungimas patikrintas; ekrane nustatytos trūkstamos RPC
`admin_get_account_day_stats` ir `get_admin_foreign_hire_requests`.
Šių integracijų ir visos desktop/mobile matricos patikra neužbaigta.
