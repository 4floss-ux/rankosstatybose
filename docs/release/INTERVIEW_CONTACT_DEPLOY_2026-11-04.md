# 0edff3f kontaktų ir pranešimo pataisos diegimas

Patikrinta 2026-11-04T22:29:11.507193+02:00 Lietuvos laiku.

- Tikslinis patvirtintas pakeitimas `0edff3f`; perkeltas tik `git diff 0edff3f^ 0edff3f -- src`.
- Faktinės produkcijos pagrindas `a49e70b`, ankstesnė aktyvi versija `373459c2-5162-47cf-865f-7d1a1d671eaa`. Ankstesnės pataisos išsaugotos; visa peržiūros šaka neperkelta.
- Atskiras diegimo šaltinis `18656a75770f7e8359c779ba482f88268473d859`, šaka `release/interview-contact-maintenance`. Pakeisti tik 5 frontend failai.
- Nauja aktyvi Cloudflare versija **`c2d24799-889c-44d9-bbf8-994eae86bd33`**, **100 %** srauto.
- Deployment ID `5221c219-bd51-43c4-b648-18eacd5f913e`, sukurta `2026-11-04T20:28:53.094703Z`.
- **Maintenance ON**. Senos ir naujos versijos bindings identiški. Worker kodas, wrangler konfigūracija, paketai, maršrutai, Hire ir redesign peržiūra nekeisti. Main / redesign nejungtos.
- SQL nevykdytas ir nekartotas; tikri kontaktai, paskyros, mokėjimai ar Supabase įrašai nekeisti.

Tikslus produkcijos paketas: build PASS; **22 Node testai PASS**; 1440 / 390 px kandidato naujienų, Basic plano patvirtinto gyvo ir telefoninio kontakto, kontakto paslėpimo po pakeitimo, raudono pranešimo, darbdavio skelbimo, viešų skelbimų ir prisijungimo grąžinimo naršyklės testai PASS. Visi naršyklės duomenys sintetiniai, išorinis tinklas blokuotas.

Po CLI SUCCESS aktyvi versija, 100 % srautas ir Maintenance ON atskirai patvirtinti oficialia Cloudflare API. [Mašininis įrodymas](INTERVIEW_CONTACT_DEPLOY_2026-11-04.json).

Tikro prisijungusių paskyrų bandymo neteigiu: Work naršyklės įrankio nėra, statybos24.lt ir Supabase nepatenka į leidžiamus šios aplinkos tinklo adresus. Apribojimai neapeiti. Liko realiai patikrinti, ar serveris konkrečiai patvirtintai kandidatūrai pateikia numerį; sąsajoje atvaizduojamas tik jo jau autorizuotas atsakymas, be plano ribojimo.
