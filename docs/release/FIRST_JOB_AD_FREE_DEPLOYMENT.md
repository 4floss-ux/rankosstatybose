# Pirmojo nemokamo skelbimo sąsajos diegimo patvirtinimas

Svetainės kodas jau įdiegtas atskirai nuo GitHub main šakos sujungimo. Vien main šakos turinys šio diegimo būsenos neparodo.

- Diegto kodo įrašas: `5e33e0b`, šaka `release/first-job-ad-maintenance`.
- Cloudflare Worker: `rankosstatybose` (statybos24.lt).
- Aktyvi versija: `d173dc57-c5b0-4713-83cd-ddf76eb5d234`.
- Diegimas: `e0d650c8-31dc-46bb-ad03-0eb92bef0852`, 100 % srauto.
- Versijos žyma: `first-ad-ui-5e33e0b`.
- Maintenance: `on`.
- Pakartotinai patikrinta Cloudflare valdymo API: `2026-11-03T20:44:30.332102+00:00`.

Įdiegta `src/p24/employer/EmployerAds.jsx` pasiūlymo logika ir `src/employer/adQuota.js`. Basic paskyra skaito `job_ad_offer` ir gavusi `first_free_available=true` rodo 0 € bei nemokamą paskelbimą. Kol dovana išjungta serveryje, mokama kaina yra laukiamas rezultatas. Tai savaime nerodo senos sąsajos.

Sąsaja išsaugo ankstesnius viešų skelbimų pakeitimus ir plano galiojimo išvaizdą. Planų reklaminiai tekstai apie dar neįdiegtą kvotą neįtraukti; mėnesinė kvota neįjungta. Main ir redesign nesujungti.

Patikros: produkcinis build, 5 pasiūlymo pagalbinių funkcijų testai, vietinė 1440/390 px forma su imituotu serveriu (pirmas skelbimas 0 €, siuntimas be checkout, pasiūlymo pasikeitimas be automatinio mokėjimo). Tikri registracijos laiškai, paskelbimas ir kandidatavimas šiais testais neįrodomi.

## Likęs duomenų bazės žingsnis

Tikrinantis asmuo pranešė, kad iš `4ca3b8b` pirmojo nemokamo skelbimo schema sėkmingai pritaikyta ir dovana dar išjungta. Suderinto frontendo įdiegimo sąlyga dabar patvirtinta aktyvios Cloudflare versijos patikra. Įvertinęs istoriją tikrintojas gali vykdyti savininko jau leistą `docs/sql-review/20261103203000_first_job_ad_free_ACTIVATE_REVIEW.sql` iš `4ca3b8b`; pakartotinai taikyti schemos SQL nereikia.

Po įjungimo tikrinti `job_ad_offer` su sutarta testine paskyra ir atnaujintą skelbimo formą būtent statybos24.lt. Nei anoniminis skelbimų sąrašas, nei admin rolė savaime nepatvirtina darbdavio pasiūlymo. Tada išbandyti pirmą paskelbimą be Stripe ir vienkartinį kandidatavimą. Jokio realaus mokėjimo. Maintenance paliekamas ON.
