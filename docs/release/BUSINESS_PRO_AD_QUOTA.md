# Business Pro: 10 bendrų nemokamų paskelbimų

Statusas: vietinis pasiūlymas peržiūrai. SQL nevykdytas, kainodara neįdiegta.

## Savininko pasirinkta taisyklė

- 10 nemokamų paskelbimų visai įmonei, bendra savininko ir teisę skelbti turinčių
  aktyvių komandos narių kvota. Atskira asmeninė prenumerata nariui nesukuriama.
- Vienas naujas skelbimas arba vienas pratęsimas dar 30 dienų naudoja vieną.
  Visus 10 galima panaudoti vienam jau esamam skelbimui pratęsti 300 dienų.
- Išnaudojus 10, papildomas paskelbimas/pratęsimas kainuoja 9,99 € už 30 dienų
  per esamą apmokėjimo kelią. Mokėjimų kainos ar Stripe funkcija neperrašomi.
- Kvota skaičiuojama nuo tikros prenumeratos įsigijimo datos, ne kalendorinio
  mėnesio 1 dienos. Metiniam planui taip pat suteikiama po 10 kas mėnesį.
- Siūloma techninė taisyklė: skaičiuoti pagal patvirtintą billing UTC anchor,
  naudotojui datas rodyti Lietuvos laiku. 31 dienos atvejis trumpame mėnesyje
  ribojamas paskutine to mėnesio diena; vėlesni mėnesiai nepraranda pradinės dienos.
- Nepanaudoti mėnesio paskelbimai nekaupiami. Senų skelbimų redagavimas ar
  pašalinimas nesugrąžina jau panaudotų paskelbimų.

## Paruošta

- Planų tekstai, likučio ir atsinaujinimo datos rodymas skelbimų puslapyje,
  nemokamo/mokamo pasiūlymo pasirinkimas iš serverio rezultato.
- Kvotos skaitymas per naują RPC. Neįdiegus naujos funkcijos arba neįjungus
  įmonės naujos sąlygos, išsaugomas ankstesnis jos pasiūlymas. Tinklo/teisių klaidos
  neignoruojamos kaip nemokamos kvotos patvirtinimas.
- Pasikeitus kvotai kito nario veiksmu, neperadresuojama netikėtai į checkout:
  naujam skelbimui parodomas esamas neapmokėto skelbimo ekranas; pratęsimui
  parodoma 9,99 € kaina ir reikia naujo naudotojo paspaudimo.
- Pratęsimo operacijos ID saugomas retry metu; serverio receipt neleidžia antrą
  kartą pratęsti ar sunaudoti kredito dėl to paties užklausos pakartojimo.
- SQL projektas `docs/sql-review/20261103190000_business_pro_ad_quota_REVIEW.sql`:
  trys privačios lentelės su RLS, vienas ad triggeris, privačios funkcijos ir
  trys viešos RPC. Nauji skaitikliai atnaujinami atominiu UPSERT; esamos
  `job_ad_upsert`, `job_ad_extend_plan` ir mokėjimų funkcijos neperrašomos.

## Tikras likęs integracijos blokatorius

Repozitorijoje nėra prenumeratos pirkimo/webhook apdorojimo funkcijų kodo ir
patvirtinto tikros įsigijimo/billing anchor datos lauko. NENAUDOTI įmonės sukūrimo
datos, naršyklės datos, dabartinės datos, sąskaitos ID ar metinio periodo pabaigos
kaip prenumeratos pradžios pakaitalo.

Tikrintojas, turintis esamo prenumeratos serverio kodo prieigą, turi:

1. Palyginti SQL su realiais ad RPC, trigeriais, auth.role() ir mokėjimų aktyvavimu.
   Patvirtinti, kad apmokėta aktyvacija vykdoma service_role kontekste ir
   paid_via='stripe', o free RPC kvietimai iš naršyklės lieka authenticated.
2. Prie patvirtinto Business Pro pirkimo/aplikavimo prijungti serverinį
   `job_ad_set_pro_quota_anchor(company_id, subscription_ref, original_anchor)`.
   Tik service_role gali jį vykdyti; browser/net administratorius jo kviesti negali.
   Naudoti patikrintą aktyvios prenumeratos ID ir originalų anchor. Replay tam
   pačiam ID nepakeičia anchor; pratęsimai neturi iš naujo sukurti kvotos.
3. Užtikrinti, kad pavėlavę senos prenumeratos įvykiai neperrašys naujesnės.
   Peržiūrėti, nuo kada naujos sąlygos taikomos esamiems abonentams. Šis SQL
   automatiškai nepakeičia nė vienos esamos įmonės pasiūlymo ir nekuria backfill.
4. Atskirai patvirtinti ir pritaikyti SQL, integracijos kodą ir frontendą kartu.
   Kol integracijos nėra, 10 ribos negalima laikyti veikiančia produkcijoje.

## Testai ir ribos

- Vietiniai pasiūlymo/compatibility testai ir visas produkcinis surinkimas.
- SQL vykdomas PGlite tik su sintetinėmis įmonėmis, tapatybėmis ir mokėjimo
  žymėjimu; naudojami esami repo `job_ad_upsert` ir `job_ad_extend_plan` tekstai.
  Tikrinami 10/11, owner/manager bendra kvota, pakartojimas, 10 vieno skelbimo
  pratęsimų, trumpi mėnesiai, atsinaujinimas, redagavimas, pašalinimas, rollback,
  skirtingos įmonės, teisių blokavimas ir mokamo periodo neįtraukimas į kvotą.
- Naršyklės 1440/390 testai naudoja tik imituotas RPC ir checkout funkcijas.
- PGlite užklausas serializuoja. Tikras kelių jungčių vienalaikiškumas,
  tikras pirkimas/atšaukimas/pratęsimas test-mode aplinkoje ir tikro auth/DB
  integracija dar nepatikrinti. Jokių realių mokėjimų ar produkcinių įrašų nekeista.

Šis pakeitimas nepaskelbtas ir neįdiegtas. Atskirai jau įdiegta Planų galiojimo
kortelė nekeičia skelbimų kainodaros; pagrindinės svetainės Maintenance paliktas ON.
