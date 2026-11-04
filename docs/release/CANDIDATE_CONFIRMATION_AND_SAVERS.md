# Vienas patvirtinimas, kontaktas tik profilyje ir visi įsiminę darbuotojai

2026-11-04, šaka `fix/candidate-confirmation-and-savers`. Visos ankstesnės pataisos išsaugotos.

- Numeris pašalintas iš darbdavio kandidato / pokalbio kortelės. Esamas numerio perdavimas į kandidato profilį po patvirtinimo išsaugotas; jame nėra plano apribojimo. Nei vieša kontaktų paieška, nei naujas kontaktų RPC nepridėti.
- Darbuotojui laukiant patvirtinimo neberodoma antra tokio pat kvietimo naujienos kortelė su „Pažymėti perskaityta“. Lieka viena pilna kvietimo kortelė ir vienas „Patvirtinti pokalbį“. Patvirtinus per esamą RPC perskaitomos tik tos kandidatūros kvietimo / pakeitimo naujienos. Žinutės ir kitos naujienos neliečiamos. Perskaitymo klaida nepaverčiama nesėkmingu pokalbio patvirtinimu; ją galima pakartoti po jau sėkmingo patvirtinimo. Naujo pakeitimo versija nuo seno žymėjimo nepradingsta, kaip užtikrina esama skaitymo funkcija.
- Širdelė perkelta prie atlyginimo skelbimų sąraše (desktop / mobile) ir atlyginimo kortelėje atidarius skelbimą. Ji prieinama ir kandidatavus / pakvietus pokalbiui. Naudojamas tas pats `job_ad_set_saved`, ne antra įsiminimų sistema. Širdelės klaviatūros Enter nebeatidaro skelbimo; išsaugomas optimistinis pakeitimas ir jo atšaukimas klaidos atveju.
- „Įsiminė skelbimą“ sąrašui paruoštas visų įsiminusių rodymas. Kandidatavusiam rodoma „Jau kandidatavo“ ir nesiūloma pakartotinai kviesti kandidatuoti. Profilis atidaromas per turimą kandidato įrašą, jei toks yra, todėl išsaugomas autorizuotas kontaktas po patvirtinimo.

## Netaikytas SQL peržiūrai

`docs/sql-review/20261104230000_job_ad_company_savers_REVIEW.sql`.

Esamas `job_ad_company_detail` sąmoningai negrąžina jau kandidatavusių įsiminusių darbuotojų. Jo neperrašau: naujas tik skaitymo `job_ad_company_savers(p_ad_id)` grąžina visus realius įsiminimo įrašus bei `has_applied` požymį, be telefono, CV ar kandidatūros žinutės. Tikrinama platformos prieiga, konkrečios įmonės valdymo teisė ir nepašalintas skelbimas. Anoniminis vykdymas uždraustas, lentelių leidimai nekeičiami. Esamų skelbimo / kandidatavimo / kontaktų / mokėjimų funkcijų neliečia.

Iki šio papildymo patikros ir pritaikymo senos produkcijos sąraše vis dar galios senas kandidatavusiųjų filtras. Sąsaja suderinama su senu atsakymu, bet visų įsiminusių rodymui būtinas naujas RPC. Senų SQL kartoti nereikia. Produkcijoje nieko nevykdyta.

## Patikros

- **27 Node testai PASS:** izoliuotas tikro naujo SQL vykdymas su kandidatavusiais ir nekandidatavusiais, visais kandidatūros statusais, įsiminimo nuėmimu, pašalintu skelbimu, kitos įmonės / darbuotojo / sustabdytos / anoniminės prieigos atmetimu; išsaugotos kontaktų, sesijų ir viešų nuorodų apsaugos.
- **1440 / 390 px sintetinė naršyklė PASS:** telefonas neberodomas kandidato kortelėje, vienas patvirtinimas ir jokio dubliuojančio perskaitymo veiksmo, širdelė prie atlyginimo po kandidatavimo, klaviatūros Enter, kandidatas įsiminusiųjų sąraše be kvietimo kandidatuoti iš naujo, Messenger / CV / raudonos būsenos ir automatinio perskaitymo regresijos.
- Darbdavio skelbimo, viešų skelbimų / miesto filtro ir viso prisijungimo grąžinimo testai PASS. Build PASS.
- Tikros savininko paskyros, tikras įsiminimas ar kandidatūros šioje sesijoje nekeisti. Vietinis SQL ir sintetinė naršyklė nepatvirtina produkcinės integracijos. Maintenance nekeistas, diegimo / sujungimo nebuvo.
