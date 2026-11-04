# 514dfc4 tikslinio diegimo įrodymas

Patikrinta 2026-11-04T22:18:57.639788+02:00 Lietuvos laiku.

- Patvirtintas šaltinis `514dfc4`; perkeltas tik jo frontend skirtumas (`git diff 514dfc4^ 514dfc4 -- src`).
- Faktinės produkcijos pagrindas `da83813`, ankstesnė aktyvi Cloudflare versija `c773869b-ab68-42a9-8308-5583ae22b89e`. Pirmtakas nustatytas oficialia API ir prieš perjungimą patikrinta, kad jis nepasikeitė darbo metu.
- Atskiras diegimo įrašas `a49e70b8bb1b546198f78380a1c89a8ef20776a8`, lokali šaka `release/interview-attention-maintenance`.
- Pakeisti tik 4 frontend failai: `adNews.jsx`, `EmployerAds.jsx`, `p24.css`, `WorkerAds.jsx`. Visos ankstesnės produkcijos pataisos išsaugotos; visa peržiūros šaka neįdiegta.
- Aktyvi Cloudflare versija **`373459c2-5162-47cf-865f-7d1a1d671eaa`**, **100 %** srauto.
- Deployment ID `5f5766ae-32df-4b74-9e32-1f4b49ac2da0`, sukurta `2026-11-04T20:18:35.343301Z`.
- **Maintenance ON**, seno ir naujo varianto bindings identiški. Worker / wrangler konfigūracija, maršrutai, paketai ir lock failas nekeisti. Hire ir redesign peržiūros atskirai nediegtos.
- SQL NEKARTOTAS; Supabase įrašų, mokėjimų, tikrų paskyrų ir Main / redesign šakų neliečiau. Apie jau pritaikytą naują SQL remiamasi savininko pateikta nepriklausoma patikra.

## Patikros

- Tikslus produkcijos pagrindu paruoštas paketas: `npm run build` PASS, tik įprastas didesnio JS paketo įspėjimas.
- Patvirtinto šaltinio sesijų ir viešų skelbimų nuorodų testai paleisti šiame pakete: **20 PASS, 0 FAIL**.
- 1440 / 390 px vietiniai testai: pakeisto kvietimo raudona būsena po pranešimo perskaitymo, grįžimas į žalią patvirtinus; matomų CV / patvirtinimo naujienų automatinis perskaitymas neperskaitant žinučių; kandidato kortelė; Messenger; skelbimo detalė; viešas sąrašas / filtras / nuoroda; grįžimas po prisijungimo ir vienkartinis kandidatavimas – PASS.
- Naršyklės testai sintetiniai, išorinis tinklas juose užblokuotas. Tikros prisijungusios testinės paskyros ir tikra Supabase integracija šio diegimo metu NETIKRINTOS. Work naršyklės valdymo įrankio šioje sesijoje nėra.

Po `wrangler versions deploy` SUCCESS aktyvus ID, 100 % srautas ir Maintenance `on` papildomai patvirtinti oficialia Cloudflare GET deployments / versions API. Tiesioginis statybos24.lt HTTP bandymas iš šios aplinkos neatliktas: domeno nėra tinklo leidimų sąraše; apribojimas neapeitas.

[Mašininis patvirtinimas](INTERVIEW_ATTENTION_DEPLOY_2026-11-04.json).

Liekantis tikras bandymas: darbdavys pakeičia pokalbio laiką / būdą, darbuotojas pamato raudoną kortelę, perskaito pranešimą (kortelė lieka raudona), patvirtina (kortelė žalia), darbdavys gauna patvirtinimo naujieną, ją pamatęs skaitiklis dingsta; neperskaityta žinutė nuo šių veiksmų nepradingsta.
