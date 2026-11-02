# Patvirtintų administratoriaus problemų pataisymai

Šaka: `fix/admin-prelaunch-confirmed`, iš `redesign` pagrindo su išsaugotais
ankstesniais sesijos ir vietiniais dizaino pataisymais. Publikuojama tik atskira
Git šaka peržiūrai; niekas nejungiama ir nediegiama. Produkcinė Supabase, Stripe
ir Cloudflare nekviestos.

## Frontend

- `AdminForeignHire.jsx` tiesiogiai importuoja `../hire.css`. Ankstesnė priklausomybė
  nuo to, ar naršyklė jau užkrovė kitą /hire modulį, panaikinta. Naudojamos tos
  pačios prototipo šešių žingsnių taisyklės: 6/3/2 stulpeliai, vienas skaičius
  apskritime, be ol žymeklių. Prototipo failai nekeičiami.
- Vadovų pokalbių lentelė desktop naudoja bendrus CSS subgrid stulpelius antraštei
  ir duomenims. Kiekvienos eilutės auto veiksmų plotis nebepastumia kitų stulpelių.
  Mobilus prototipo kortelių išdėstymas paliktas.
- Admin redaktoriuose suvienodintos .field/.wide/.input klasės. Datos, laiko ir
  pasirinkimo valdiklių veikimo logika palikta; senos laiko valdiklio !important
  taisyklės perrašytos tik šiame redaktoriuje. Laukai 38 px, desktop 13 px tekstas,
  mobile 15 px pagal prototipą; textarea min 84 px. RoundedSelect gauna jau
  egzistuojantį ariaLabel ir todėl yra prieinamas vardu.
- „Patvirtinti“ išlaikytas, bet prieš RPC privalomas esamo stiliaus patvirtinimo
  langas, paaiškinantis rankinę duomenų peržiūrą ir automatinės registro patikros
  nebuvimą. Tas pats paaiškinimas taikomas keičiant patvirtinimą redaktoriuje.
  Nevyksta nei automatinis patvirtinimas, nei registro užklausa.
- Naujo juridinio darbdavio kodas privalomas: tik 7 arba 9 ASCII skaitmenys,
  be pradinių nulių. 9 skaitmenims Mod-11 kontrolinis skaitmuo su antru svorių
  rinkiniu; 7 skaitmenų istoriniams kodams šiuolaikinis checksum netaikomas.
  Privatūs darbdaviai ir komandos kvietimų kelias kodo nereikalauja.
- Joks checksum neįrodo įmonės egzistavimo, statuso ar kodo priklausymo tam
  registruotojui. Tai atskira administratoriaus patikra oficialiame registre.

## Paruoštos SQL migracijos – NETAIKYTOS

`20261102120000_company_registration_guard_REVIEW.sql`:
- naujų companies INSERT ir juridinio asmens Auth signup metaduomenų vartai;
- tokia pati 7/9 skaitmenų formato ir 9 skaitmenų checksum patikra kaip frontend;
- naujos įmonės nepradeda su is_verified=true;
- esamų kodų lookup ir naujų registracijų rezervacijų PK apsaugo nuo to paties
  normalizuoto kodo pakartojimo bei vienalaikių registracijų;
- esamos įmonės neperrašomos, jų kodai netaisomi, duplikatai netrinami ir
  neįvedamas globalus unique indeksas, kuris užblokuotų senus duomenis.

Riba: istorinio 7 ir dabartinio 9 skaitmenų skirtingų numerių priklausymo tam
pačiam juridiniam asmeniui patikimai nenustatome be registro atitikties taisyklių.
Dublikatų prevencija pagal kodą nėra įmonės tapatybės patvirtinimas registre.
Prieš patvirtinant 7 skaitmenų istorinį kodą būtina oficiali registro patikra.

`20261102121000_admin_company_audit_REVIEW.sql`:
- esamas admin_update_company neperrašomas;
- companies AFTER UPDATE trigeris aktyvaus admino pakeitimą įrašo į
  admin_audit_log toje pačioje transakcijoje; audito klaida neatmetama tyliai;
- saugomi actor ID, company ID, serverio laikas ir tik pakeistų laukų vardai,
  be senų/naujų reikšmių, kontaktų ar eilučių kopijų;
- atnaujinimas be realių pakeitimų audito nekuria; updated_at ignoruojamas;
- naujas siauras, admin-only get_admin_company_change_log grąžina šiuos įrašus;
  UI sujungia juos su esama istorija pagal audit_id ir rodo įmonę, laukus,
  aktorių bei laiką. Kol RPC neįdiegtas, PGRST202/42883 neužblokuoja senos istorijos;
  kitos užklausos klaidos nėra nutylimos;
- joks backfill ar istorinių įvykių kūrimas nenumatytas.

## Būtina peržiūra prieš taikymą

Savininko nepriklausomas recenzentas turi tikros schemos read-only prieigą.
Prieš taikant migracijas jis turi patikrinti companies ir admin_audit_log DDL,
indeksus, action apribojimus, admin_update_company, get_admin_audit_log ir
esamus Auth įmonės kūrimo trigerius. Reikia patvirtinti:
- owner_id, company_code, is_verified ir id tipus/default;
- audito lentelės ID, admin_id, action, target_role, metadata, created_at ir
  likusių stulpelių NULL/default taisykles bei company_updated action priimtinumą;
- esamų trigerių eiliškumą, employer_type semantiką privatiems asmenims ir
  kvietimams, klaidų gaudymą bei paslėptus kūrimo kelius;
- oficialias istorinių kodų taisykles ir skirtingų kodų atitikties politiką;
- faktinį audit-only RPC prieigos atmetimą, RLS bei transakcijos rollback.

Kol tai nepatvirtinta, migracijos nėra parengtos aklam taikymui. SQL parseris
netikrina tikros schemos, leidimų, trigerių vykdymo ar konkurentinių transakcijų.
Migracijų failai yra supabase/migrations – neleistina paleisti automatinio
push/reset, kol jie neperžiūrėti ir atskirai neautorizuoti.

## Patikros

```bash
node tests/company-code.test.mjs
node --experimental-vm-modules tests/impersonation.test.mjs
python tests/admin_frontend.py
VITE_SUPABASE_URL= VITE_SUPABASE_PUBLISHABLE_KEY= npm run build
```

- Produkcinis build praėjo (3,00 s), git diff --check praėjo.
- Esami darbuotojo ir darbdavio 1440/390 scenarijai su naujausiu bundle praėjo.
- 3 kodo validacijos testų grupės (netinkamas formatas, checksum abu fallback,
  istoriniai kodai) ir 18 ankstesnių sesijos testų.
- Browser testai 1440/390: cold-load CSS be /hire puslapio, šeši žingsniai,
  heading/value x koordinačių sutapimas, laukų matmenys, datos/laiko/select
  atidarymas, įmonės patvirtinimo atšaukimas be update RPC, audito parodymas.
- Registracijos testai sintetinėje aplinkoje: required/format/checksum klaidos,
  privataus darbdavio pasirinkimas. Tikri signup nevykdomi.
- Abi SQL migracijos ir 5 PL/pgSQL funkcijos sintaksiškai patikrintos pglast
  parseriu be DB prisijungimo. DDL ir serverio logika NEVYKDYTA.
- Visi išoriniai browser prašymai blokuojami. Tai frontend ir valdymo logikos
  patikros, ne realios Supabase integracijos ar visų leidimų įrodymas.
- Webfontų atsisiuntimas blokuojamas; visiškas 1:1 su realiais webfontais dar
  reikalauja savininko peržiūros. Prototipo tekstų ir komponentų neperprojektuojame.

## Realūs testai su savininko paskyromis

Savininkas autorizavo tris savo testines paskyras, bet šioje aplinkoje nėra jų
prisijungimo duomenų, Supabase kintamųjų ar bendrinamos autentifikuotos browser
sesijos. Slaptažodžių pokalbyje nereikia. Juos galima pateikti tik per saugius
aplinkos Secrets / palaikomą autentifikuotos naršyklės sesiją; sesijų/tokenų
neeksportuoti į Git ar testų logus. Kintamuosius tikrinome tik vardais ir buvimu.

Prieš naudojant bendrą projektą reikia atskiro konkrečių įrašymų patvirtinimo:
1. Trijų paskyrų prisijungimai (Auth gali pakeisti last_sign_in_at ir sesijas).
2. Svetainė prisijungusi automatiškai kviečia record_my_account_day ir darbuotojo
   aktyvumo RPC; vien „atidaryti dashboard“ nėra garantuotai read-only.
3. Admin impersonacijos bandymas kvies admin-impersonate ir sukurs
   impersonate_start audito įrašą, tada keis Auth sesiją ir grąžins administratorių.

Šių veiksmų nevykdėme. Jokio paskyrų trynimo, slaptažodžių atkūrimo, company
verification, subscription/billing keitimo, realaus mokėjimo ar migracijų taikymo.
