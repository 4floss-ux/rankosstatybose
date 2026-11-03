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

## Įdiegimas

Cloudflare valdymo API patvirtinta `2026-11-03T22:22:43.224847+00:00`:

- Statybos24.lt: įrašas `6187b5b`, šaka `release/unified-ui-maintenance`, versija `aeb6910e-fecb-4713-8685-241fbab7b3d6`, 100 %, Maintenance ON.
- Redesign alias: `700764f`, versija `3083806a-6451-49eb-98fb-e9137cc919e5`, jo ankstesnis testavimo režimas OFF paliktas; ši versija neaktyvuota produkciniam srautui.
- Hire: `700764f`, versija `7bd042e9-4e86-4669-aae3-3ffdd3fc5c80`, 100 %, ankstesnis režimas OFF paliktas. Worker/routing/sesijų kodas nekeistas nuo patvirtinto `bb27102`.

Tiesioginis automatinis HTTP kreipimasis į redesign grąžino 403, todėl tikro nuotolinio vaizdo / prisijungimo neteigiu. Alias ir aktyvios versijos patvirtinti valdymo API, išvaizda bei veiksmai tikrinti vietinėje naršyklėje su sintetiniais duomenimis. Supabase schemų, įrašų, leidimų ir Stripe šiame pakeitime neliečiau.
