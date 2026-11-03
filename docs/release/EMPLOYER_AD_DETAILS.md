# Darbdavio skelbimo puslapis – peržiūros juodraštis

Savininko naujai patvirtintas išdėstymas: visa skelbimo informacija, atskiras skelbimo valdymas, aiškūs mygtukai. Archyvo savininkas atsisakė. Ši šaka dar nėra diegta.

## Paruošta ir vietoje patikrinta

- `JobAdContent` atvaizduoja tą patį esamo prototipo turinį darbdaviui, darbuotojui ir viešai: pilną aprašymą, sąlygas, adresą, pradžią, reikalavimus ir pasiūlymus. Darbuotojo / viešo turinio išvaizda išsaugota.
- Darbdavio redagavimas ir pratęsimas perkelti iš kandidatų antraštės į „Skelbimo valdymas“, aiškiai įvardijant, kad veiksmai skirti skelbimui.
- Suvienodintos tuščios pokalbių ir įsiminusiųjų kortelės, piktogramos ir skaitikliai. Telefonas – viena kolona.
- Trynimo patvirtinimas ir saugus klaidos atvejis paruošti, bet tikro trynimo backend dar NĖRA. Mygtukas NEKVIETĖ ir NEKVIEČIA senos `job_ad_close` funkcijos kaip tariamo ištrynimo. Nesant naujos funkcijos aiškiai praneša, kad skelbimas nepakeistas.
- 1440/390 px sintetiniai detalės, viešo skelbimo ir kainodaros / pratęsimo testai; production ir Hire build.

## Tikras likęs blokatorius – nuolatinis trynimas

Nediegti šakos kaip užbaigto ištrynimo. `job_ad_delete` dar neįgyvendinta ir netaikyta; šaka kol kas skirta išdėstymo peržiūrai. Tai nėra duomenų bazės prieigos ar migracijos įvykdymo įrodymas.

Savininkas nori pašalinti skelbimo turinį, kandidatūras, pokalbius, įsimintus įrašus ir susijusius skelbimo CV priedus, o ne perkelti į archyvą. Kitų vartotojo profilio dokumentų trinti negalima. Vienkartinės dovanos panaudojimo žyma turi išlikti. Apmokėtų skelbimų atveju būtina atskirai išlaikyti minimalų mokėjimo apskaitos įrašą; dabartinė `job_ad_payments.ad_id` sąsaja turi `ON DELETE CASCADE`, todėl aklas DELETE šią apsaugą sunaikintų.

Serverio sprendimui būtina:

1. Tikra veikėjo tapatybė ir esamas `job_ad_can_manage` patikrinimas, apsauga nuo kitų įmonių / darbuotojų / anoniminio trynimo.
2. Faktinių FK / trigerių patikra realioje schemoje, susijusių DB įrašų pašalinimas transakcijoje, dovanos išsaugojimas.
3. CV objektų pašalinimas per Storage API, ne tiesiog ištrinant `storage.objects` metaduomenis. Saugus pakartojimas po laikino gedimo ir vienalaikio įkėlimo apsauga. Vien SQL cascade failų neištrina.
4. Mokėjimo kvito išsaugojimas be skelbimo teksto / kandidatų; pradėto checkout ir trynimo lenktynių apsauga. Esamas checkout įrašo `pending_session_id` po išorinės užklausos be `status <> removed` sąlygos – vien ad eilutės užrakto nepakanka. Negalima pradėti mokėjimo už jau ištrintą skelbimą.
5. Tik po serverio įdiegimo ir izoliuotų testų – tikras savininko testinis trynimas. Nevykdyti tikrų Stripe operacijų ir netrinti klientų duomenų testuojant.

Joks skelbimas, kandidatūra, failas ar mokėjimas šio darbo metu nebuvo ištrintas. Maintenance nekeistas. Archyvas nesukurtas.
