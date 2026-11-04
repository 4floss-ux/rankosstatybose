# Patvirtinto pokalbio kontaktas ir raudonas pakeitimo pranešimas

Šaka `fix/interview-contact-and-news`, 2026-11-04. Ankstesnės patvirtintos pataisos išsaugotos.

- Esamas `job_ad_company_detail` SQL saugykloje jau grąžina `user_private.phone` tik statusui `interview` su `interview_confirmed_at`, be Business Pro sąlygos. Tikros schemos ar savininko paskyrų šioje sesijoje netikrinau. Atidarant profilį šis serverio grąžintas laukas buvo pametamas – dabar jis perduodamas patvirtintai kandidatūrai. Esamas profilio langas telefoną rodo prieš plano užrakinimo kortelę.
- Kandidato kortelėje prie patvirtinto pokalbio pridėtas aiškus „Kandidato telefonas“ ir tel nuoroda. Taikoma visiems planams ir abiem būdams: gyvai / telefonu. Iki patvirtinimo ir po pakeitimo, kuris panaikina patvirtinimą, kontaktas nerodomas. Rodomas tik autorizuoto skelbimo detalės atsakymo numeris; jokios viešos profilių paieškos kontaktams gauti nepridėta.
- Raudonas ne tik pagrindinis pakeisto kvietimo blokas, bet ir naujienos blokas su „Pažymėti perskaityta“. Naudojama svetainės esama raudona spalva. Taikoma `interview_changed` įvykiui: jau įdiegtas trigeris jį žymi pakeitus laiką, būdą, adresą ar pastabą. Pagrindinio kvietimo raudona būsena lieka iki pakartotinio patvirtinimo.
- Naujo SQL nereikia, senų SQL kartoti nereikia. Duomenų bazės, planų, tikrų kontaktų ar teisių nekeičiau.

Patikros: 22 Node testai PASS (kontaktų taisyklės, 18 sesijų testų, viešos nuorodos), 1440 / 390 px naršyklės testai su Basic planu ir sintetiniais duomenimis (telefoninis bei gyvas patvirtintas pokalbis; numerio paslėpimas po pakeitimo; raudonas naujienos blokas), darbdavio skelbimo regresijos ir build PASS. Kontakto vienetiniai testai įtraukti į esamą GitHub Actions patikrą.

Ši pataisa paskelbta tik peržiūrai. Nekeičiau Maintenance, nediegiau, šakų nejungiau. Tikras prisijungusių testinių paskyrų bandymas dar lieka; vietiniai bandymai realios Supabase integracijos nepatvirtina.
