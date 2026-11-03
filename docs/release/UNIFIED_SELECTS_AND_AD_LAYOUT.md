# Vienodi pasirinkimai, skelbimo išdėstymas ir planų tekstai

Šaka `fix/ad-layout-unified-selects`. Tik frontend; naujo SQL, mokėjimų ar prenumeratų pakeitimų nėra.

## Pakeitimai

- Darbdavio atlyginimo ir valdymo stulpelis yra `position: static`, neseka slinkimo.
- „Dalintis“ yra tik skelbimo valdyme. Kandidatai, pakviesti pokalbiui ir įsiminusieji yra po reikalavimais / pasiūlymais, kiekviena skiltis užima visą pagrindinio stulpelio plotį.
- Vienas `SiteSelect` pakeičia 22 įprastų select naudojimo vietas viešoje, administratoriaus, darbdavio, darbuotojo ir Hire sąsajose. Esamas `RoundedSelect` naudoja tą patį komponentą ir išsaugo originalų options.value tipą.
- Vienodi balti, svetainės spalvų meniu su pažymėta reikšme; jie iškeliami į portalą ir nėra nukerpami kortelėse ar modaluose. Veikia rodyklės, Home/End, Enter, Escape, Tab ir paieška renkant raides, disabled / required ir HTML FormData. Tikras nematomas select paliktas formų reikšmėms bei validacijai; pilkasis OS popup naudotojui neatidaromas.
- Vietovės automatinio užbaigimo meniu stiliai suderinti, nekeičiant paieškos logikos. Specializuotų datos ir laiko kalendorių veikimas nekeistas.
- Planai aiškiai atskiria trumpalaikių darbų pasiūlymų limitus nuo ilgalaikių darbo skelbimų. Vienkartinis pirmas nemokamas skelbimas matomas visų planų santraukose. 10 bendrų publikacijų / pratęsimų ir 9,99 € po kvotos rodomi tik tada, kai serverio pasiūlymas patvirtina kvotos įjungimą. Kol kvota neįdiegta, nežadamas neveikiantis limitas. Kainos, prenumeratos mygtukų veiksmai ir galiojimo kortelė išsaugoti.

## Patikra

Vietoje praėjo: bendro select klaviatūra / formos / popup ribos 1440 ir 390 px; darbdavio išdėstymo ir visų trijų kortelių pločio patikra; miestų filtras per tikrą naują meniu; planų tekstai su išjungta / įjungta imituota kvota; skelbimo paskelbimo ir pratęsimo ankstesni testai; pilnos App imituotas prisijungimas ir grįžimas į skelbimą; administratoriaus redaktorių laukai, datos / laiko kontrolės ir įmonės kodo validacija; 64 navigacijos peržiūros visoms trims rolėms; Hire prisijungimas 7 kalbomis 1440/555/390 px ir atskiras portalas 1440/390 px. Abu production build praėjo. Tai ne tikros DB / Stripe integracijos įrodymas.

## Neįjungtos funkcijos

Business Pro mėnesinės kvotos webhook integracija vis dar neįdiegta. Šis UI pakeitimas jos nesukuria. Nuolatinio skelbimų trynimo Supabase paketas iš ankstesnės šakos turi būti atskirai peržiūrėtas ir įdiegtas; kol serverio readiness=false, mygtukas lieka neaktyvus. Jokie realūs skelbimai, kandidatūros, failai ar mokėjimai šio darbo metu nebuvo keičiami.

Main / redesign nejungiamos; produkcijos Maintenance paliekamas ON. Atskirai atnaujinant esamą redesign peržiūrą išsaugomas jos atviras testavimo režimas, o ne perkeliamas į produkcinį deployment. Hire prieigos / sesijos ir duomenų bazė nekeičiamos.


Tikro lietimo pataisa papildomai patikrinta 390 px touch režimu: pasirinkimas tap gestu ir sąrašo slinkimas pirštu per Chromium CDP, ne vien programinis scrollTop. Fokuso valdymas neblokuoja pointerdown lietimo įvykių.

## Įdiegimas

Cloudflare valdymo API patvirtinta `2026-11-03T22:33:35.775907+00:00`:

- Statybos24.lt: `d0a6e9d`, šaka `release/unified-ui-maintenance`, versija `75983651-3a43-4491-b55f-f514f3e09924`, 100 %, Maintenance ON.
- Redesign alias: `2829625`, versija `d4065f35-d5c5-4c6d-a574-eff07af99514`, ankstesnis testavimo režimas OFF išsaugotas; šis variantas neaktyvuotas produkciniam srautui.
- Hire: `2829625`, versija `0b2fd960-732d-44ee-a5bd-971650f27eb4`, 100 %, ankstesnis režimas OFF išsaugotas. Worker/routing/sesijų kodas nekeistas nuo patvirtinto `bb27102`.

Tiesioginis automatinis HTTP kreipimasis į redesign grąžino 403, todėl tikro nuotolinio vaizdo / prisijungimo neteigiu. Alias ir aktyvios versijos patvirtinti valdymo API; išvaizda, formų veiksmai ir touch gestai tikrinti vietinėje naršyklėje su sintetiniais duomenimis. Supabase schemų, įrašų, leidimų ir Stripe šiame pakeitime neliečiau.
