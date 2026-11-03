# Statybos24.lt: visos pasiekiamos saugios patikros

Data: 2026-11-03 (Europe/Vilnius). Šaka `feat/business-pro-ad-quota`.
Tikrinamas paruoštas kodas su naujomis skelbimų taisyklėmis, ne tik gyva versija.
Produkcijos duomenys, mokėjimai, leidimai, diegimai ir Maintenance šioje patikroje
nekeisti. Nauji SQL projektai nebuvo vykdomi Supabase.

## Praėjo

| Patikra | Rezultatas ir tikrosios ribos |
| --- | --- |
| Vietiniai testai | 54 PASS: kodai, ankstesnės E2E pataisos, Hire adresai ir žinutės, planų galiojimas, skelbimų pasiūlymai, 18 administratoriaus sesijos scenarijų |
| SQL | 9 Hire ir 16 skelbimų kvotos/dovanos scenarijų vietiniame PGlite. Esami repo skelbimų RPC vykdyti su sintetiniais auth/company helperiais |
| Registracija ir auditas | Esamas 48 SQL sakinių assertions.sql scenarijus praėjo izoliuotoje atminties DB. Tai ne nauja produkcijos migracija |
| Vaidmenų navigacija | 7 darbuotojo, 10 darbdavio ir 15 administratoriaus ekranų × 1440/390 px: 64 patikros. JS klaidų ir horizontalaus slinkimo nenustatyta |
| Viešas puslapis ir auth formos | Tikras Vite paketas: pradinis puslapis, prisijungimas, Pamiršau/Grįžti, abu registracijos tipai 1440/390. Formos nesiųstos |
| Administratorius | Tarptautinės atrankos šaltas užkrovimas, šeši žingsniai, pokalbių lentelės stulpeliai, profilio/darbo formos, data/laikas, patvirtinimo atšaukimas, audito rodymas: sintetiniai testai PASS |
| Įmonės kodas | Privalomumas, formatas, kontrolinis skaitmuo ir fizinio asmens išimtis: vietiniai ir sintetinės UI patikros PASS |
| Planai | Galiojimo datos ir atnaujinta mobili kortelė, Basic/trial būsenos bei esamas prenumeratos mygtukas: PASS |
| Skelbimai | Kvota 10/11, dovaninis pirmas skelbimas, mokama būsena be netikėto checkout, pratęsimo retry ir kainos pasikeitimas: sintetinės UI ir SQL patikros PASS |
| Žinutės | Esamas Messenger, abu vaidmenys, neperskaitytų žymės, juodraštis, retry, siuntėjai, inicialai ir ribos: PASS 1440/781/390 |
| Hire prisijungimas | 7 kalbos × 1440/555/390: tekstai ir mygtukai nesikarpo |
| Atskiri projektai | Pagrindinio puslapio/Hire navigacija, atskiros saugyklos ir PWA: PASS |
| Surinkimas | Main ir Hire produkciniai paketai PASS; išlieka ankstesnis main didelio paketo perspėjimas |

## Rasta ir pataisyta vietoje

Netaisyklingas pasiūlymo RPC atsakymas (pvz., masyvas vietoje objekto ar trūkstami
kvotos laukai) galėjo būti parodytas kaip senasis neribotas Pro pasiūlymas.
Pridėta `jobAdOfferValid`: tikrinami būsenos tipai, dovanos požymis, 10 limitas,
naudojimo/likučio ribos ir atsinaujinimo data. Blogas atsakymas parodo klaidą,
blokuoja paskelbimą ir nepradeda checkout. Tik aiškiai neegzistuojantis RPC
leidžia palaikyti seną sistemos versiją. Vienetinis ir naršyklės regresijos testai
praėjo. Serveris ir toliau nepriklausomai sprendžia, ar paskelbimas nemokamas.

Laikinuose viešo puslapio bandymuose pataisytas testų scenarijus: telefone reikia
pirmiausia atidaryti Meniu, o grįžimo mygtukas vadinasi „Grįžti“. Paslėpto meniu
mygtuko paspaudimas nebuvo produkto klaida; jo dėl šio bandymo nekeitėme.

## Kas nepatvirtinta ir blokuoja viso paleidimo GO

1. Naujų kvotos/dovanos SQL suderinamumas su tikra schema, esamais trigeriais ir
   prenumeratos serveriu. Prenumeratos pirkimo/webhook kodas nėra repozitorijoje:
   būtina patikrintu serveriniu įvykiu prijungti originalią įsigijimo datą.
   Dovanos kampanija pagal nutylėjimą išjungta; esamos įmonės neperjungiamos.
2. Tikras owner/manager vienalaikis paskelbimas keliose DB jungtyse ir realus
   Auth/RLS/el. laiškų/failų saugyklos srautas. PGlite užklausas serializuoja;
   imitacinės sesijos nepatvirtina tikros Supabase integracijos.
3. Tikri darbdavio–darbuotojo skelbimo, kvietimo/atsakymo ir administratoriaus
   impersonacijos/grįžimo bandymai su savininko testinėmis paskyromis. Šioje
   sesijoje nėra prisijungusios Work naršyklės valdymo ar paskyrų kredencialų.
4. Stripe test-mode sėkmė, atšaukimas, pakartojimas ir lygiagretus checkout.
   Testinės Stripe prieigos šioje sesijoje nėra. Jokių realių mokėjimų nevykdyta.
5. Galutinė likusių viešai pasiekiamų privilegijuotų DB funkcijų saugumo išvada;
   ankstesnis bendras auditas repozitorijoje neužbaigtas. Naujo kodo patikra
   nepakeičia visos esamos DB nepriklausomos peržiūros.

Žinomi savininko tikri sėkmingi bandymai (ankstesniame pokalbyje): pagrindinis
admin ir Hire login, Hire logout, dvipusės sintetinės įmonės žinutės ir skaitiklis.
Jų nevadiname šioje sesijoje savarankiškai pakartotais testais.

## Sprendimas

Vietinės patikros PASS; viešam visos svetainės paleidimui dar NO-GO.
Pirmiausia nepriklausomo tikrintojo peržiūra ir tikrų srautų bandymai už
Maintenance. Naujų skelbimų kainodaros ir dovanos gyvai dar nėra.
Laikini testų žurnalai: `/tmp/s24-final-full-check/`.
