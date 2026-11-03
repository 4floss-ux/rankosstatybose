# Business Pro: 10 bendrų nemokamų paskelbimų

Statusas: vietinis pasiūlymas peržiūrai. SQL nevykdytas, kainodara neįdiegta.

## Pirmas skelbimas po registracijos (papildytas savininko reikalavimas)

- Basic, Business ir Business Pro vartotojo pirmas naujas skelbimas nemokamas
  vieną kartą po registracijos, galioja 30 dienų. Tai ne mėnesinė dovana ir
  ne pratęsimo kuponas. Nepanaudotai dovanai papildomas laiko terminas nenustatytas.
- Pagal savininko ankstesnį „kiekvienam vartotojui“ reikalavimą gavėjas yra
  paskyra, įskaitant skelbti teisę turintį pakviestą narį. Įmonės pakeitimas
  nesukuria naujos dovanos tam pačiam vartotojui.
- Pro dovana papildoma prie bendrų 10, todėl naujų komandos narių vienkartinės
  dovanos gali padidinti bendrą įmonės nemokamų skelbimų skaičių. Įprasti
  mėnesio 10 ir toliau bendri visai įmonei. Ši papildoma dovana neatsinaujina.
- Jau publikavęs paskyros naudotojas nelaikomas pirmą kartą publikuojančiu.
  Paskelbimo istorija tikrinama ir tarp pašalintų/uždarytų skelbimų. Naujas
  panaudojimo įrašas išlieka ir po skelbimo ar įmonės pašalinimo.
- `20261103200000_first_job_ad_free_REVIEW.sql` taikomas tik po pagrindinio
  kvotos projekto. Sukuria dvi privačias RLS lenteles, apsaugotą pirmo
  paskelbimo trigerį ir `job_ad_offer` RPC. Kampanija pagal nutylėjimą IŠJUNGTA.
- Abu projektus ir priežiūrą reikia peržiūrėti kartu. Tikrintojas turi patvirtinti
  esamų BEFORE INSERT trigerių eiliškumą, publikacijų istorijos išsaugojimą ir
  `auth.role()`/paslaugos aktoriaus kontekstą. Istoriniai fiziškai ištrinti
  publikacijų įrašai negali būti atkurti iš likusių eilučių; prieš aktyvuojant
  esamoms paskyroms reikia patvirtinti realų istorijos patikimumą.
- Viešai nerodyti naujo pasiūlymo, kol neperžiūrėtas visas kelias. Diegimą,
  serverio įjungimą ir pirmos dovanos kampanijos aktyvaciją atlikti už įjungto
  Maintenance, atskirai patvirtinus savininkui. Šioje sesijoje niekas neįjungta.

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
- Sujungtų projektų 16 SQL scenarijų praėjo. Papildomai patikrintas vienkartinis
  Basic/Business/Pro paskelbimas, claim atšaukimas po neteisingo INSERT,
  dovanos išsaugojimas pašalinus skelbimą, nekaupimas kas mėnesį, atskira
  įmonės Pro kvota, nario dovana, ta pati paskyra skirtingose įmonėse ir
  draudimas naršyklei keisti kampanijos būseną ar claims.
- PGlite užklausas serializuoja. Tikras kelių jungčių vienalaikiškumas,
  tikras pirkimas/atšaukimas/pratęsimas test-mode aplinkoje ir tikro auth/DB
  integracija dar nepatikrinti. Jokių realių mokėjimų ar produkcinių įrašų nekeista.

Šis pakeitimas nepaskelbtas ir neįdiegtas. Atskirai jau įdiegta Planų galiojimo
kortelė nekeičia skelbimų kainodaros; pagrindinės svetainės Maintenance paliktas ON.
