# Patvirtintų skelbimų naujienų diegimo įrodymas

Patikrinta 2026-11-04T13:08:14.061308+02:00 (Lietuvos laiku).

- Svetainė: statybos24.lt; Cloudflare Worker `rankosstatybose`.
- Patvirtintas pakeitimas: `16a54b4`; perkeltas tik `git diff ab5e2f3 16a54b4 -- src`.
- Faktinis produkcijos pagrindas: `d0a6e9d`, ankstesnė aktyvi versija `75983651-3a43-4491-b55f-f514f3e09924`. Jis nustatytas prieš darbą per oficialią Cloudflare API, ne spėjant pagal šaką.
- Atskira lokali diegimo šaka: `release/job-ad-news-maintenance`, šaltinio įrašas `da83813390d84a25109705a5725cc76ff3e72dc7`. Tik 7 frontend failai; visas peržiūros šakos medis neperkeltas.
- Nauja aktyvi versija: **`c773869b-ab68-42a9-8308-5583ae22b89e`**, **100 %** srauto.
- Deployment ID: `e2b3df1f-b91f-4196-9569-8901d5740680`; sukurta `2026-11-04T11:07:41.958904Z`.
- **Maintenance ON**. Seno ir naujo varianto bindings palyginti ir identiški. Worker kodas, wrangler konfigūracija, paketų sąrašas bei lock failas nepakito. Maršrutų / domenų / trigerių diegimas nevykdytas.
- SQL nekartotas, Supabase ir Stripe veiksmai nevykdyti. Hire ir redesign peržiūros atskirai neatnaujintos. Main / redesign šakos nejungtos.

## Patikros

- Tikslus nuo produkcijos paruoštas paketas: `npm run build` PASS; išlieka įprastas didesnio JS paketo įspėjimas.
- `node --experimental-vm-modules --test tests/impersonation.test.mjs tests/public-job-ads.test.mjs`: **20 PASS, 0 FAIL** (patvirtinto įrašo testai nukopijuoti lokaliam tikrinimui).
- `job_ad_news_frontend.py`, `employer_ad_detail_frontend.py`, `public_jobs_frontend.py`, `public_jobs_auth_frontend.py`: visi PASS **1440 / 390 px**. Kandidatūros naujienos, perskaityto Messenger pokalbio išlikimas, CV / pokalbio kortelės, valdikliai, pilna skelbimo informacija, miestų filtras, nuoroda ir prisijungimo grąžinimas.
- Naršyklės patikros atliktos su sintetiniais duomenimis ir užblokuotu išoriniu tinklu. Tikro prisijungimo ir tikros Supabase integracijos bandymo neteigiu.

## Cloudflare patvirtinimas po diegimo

`wrangler versions deploy c773869b-ab68-42a9-8308-5583ae22b89e@100%` baigėsi SUCCESS. Po to atskirai GET deployments ir GET versions per oficialią API patvirtino tą patį aktyvų ID, 100 % srautą ir Maintenance `on`. Prieš perjungimą taip pat patikrinta, kad produkcijos pirmtakas nepasikeitė darbo metu.

Mašininis įrodymas: [JOB_AD_NEWS_DEPLOY_2026-11-04.json](JOB_AD_NEWS_DEPLOY_2026-11-04.json).

Tiesioginis statybos24.lt HTTP / prisijungimo bandymas iš šios aplinkos neatliktas: domenas nėra leidžiamų tinklo adresų sąraše. Tai nebuvo apeita. Diegimo būsena patvirtinta Cloudflare valdymo API; reali testinių paskyrų integracinė patikra dar lieka.
