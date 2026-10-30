# Statybos24.lt prisijungusių vartotojų valdymo atnaujinimas

## Patvirtintos ribos
- Nekeisti esamo viešo pagrindinio puslapio dizaino.
- Išsaugoti Statybos24.lt oranžinę spalvų paletę ir dabartinį vizualinį identitetą.
- Keisti tik prisijungusių vartotojų darbo aplinkos išdėstymą bei dizainą.
- Išsaugoti duomenis, Supabase autentifikavimą, roles ir verslo funkcijas.
- Nedirbti tiesiogiai gamybinėje (`main`) versijoje.

## Siūloma struktūra
- `statybos24.lt`: esamas viešas puslapis.
- `app.statybos24.lt`: bendras darbuotojų, darbdavių ir administratorių prisijungusių naudotojų UI.
- `hire.statybos24.lt`: `/hire` funkcijų atskira prieiga, *jeigu tai patvirtins esamų Cloudflare maršrutų ir autentifikavimo analizė*.
- **Viena GitHub saugykla**, galimai atskiri Cloudflare diegimai / maršrutai; nereikia iškart kurti atskirų repo.

## Etapai
1. Audit: nustatyti aktyvaus įėjimo failo, maršrutų, komponentų ir `/hire` Cloudflare maršruto sąveiką. Taip pat surašyti roles, funkcijas ir pagrindinius srautus.
2. UI shell: iškelti tik prisijungusios aplinkos layout su fiksuojamu / suskleidžiamu šoniniu meniu, viršutine juosta ir responsive navigacija.
3. Sukurti atskirų rolių meniu; išsaugoti esamų puslapių logiką ir API kvietimus.
4. Patikrinti darbdavio, darbuotojo, administratoriaus srautus, pranešimus, kvietimus, pokalbius, planus, prieinamumą ir prisijungimą.
5. Staging deploy: atskirai nuo `main`, su testinėmis DNS/prieigos taisyklėmis, be gamybinės svetainės perjungimo.
6. Patvirtinus dizainą, atskirai spręsti `app` ir `hire` subdomenų migraciją, Supabase Auth redirect / CORS / sesijų klausimus, senų URL nukreipimus ir PWA scope.

## Techninės pastabos
- Esamas `index.html` specialiai netaiko PWA manifestui `/hire` kelio – nekeisti to netikrinus dabartinio maršrutizavimo.
- Aktyvus `src/main.jsx` yra didelis, todėl skaidyti inkrementiškai, ne vienu metu perrašyti verslo logiką.
- Prieš keisdami subdomenus, patikrinti Cloudflare Routes, DNS, ir kokia aplikacija realiai aptarnauja `/hire`.
- Supabase sesija localStorage tarp subdomenų automatiškai nesidalija; jei reikia vieno prisijungimo, suplanuoti saugų SSO / redirect flow.
- Kiekvienas pakeitimas pereina per PR, build patikrą ir rankinius smoke testus; nereikia automatinio diegimo į `main`.
