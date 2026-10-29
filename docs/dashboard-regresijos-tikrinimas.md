# Statybos24 dashboard dizaino regresijos patikra

Šis šakos pakeitimas yra **pirmas desktop UI etapas**, dar ne produkcinis diegimas.

## Kas pakeista
- Naujas tik prisijungusio darbuotojo ir darbdavio kairysis meniu (nuo 1100 px pločio).
- Esami meniu paspaudimai kviečia jau egzistuojančius dashboard veiksmus.
- Administratoriaus esamos veikiančios kortelės / skirtukai kompiuteryje pateikiami vertikaliai.
- Pritaikyta esama oranžinė `#f08a28` ir balta; mažesniuose ekranuose paliktas ankstesnis išdėstymas.
- Nekeistas `/`, `/hire`, `/hire/login`, `/hire/portal` maršrutizavimas, duomenų užklausos ar autorizacija.

## Patikrinti prieš sujungiant PR
- [ ] `npm ci` (jei lockfile nėra: `npm install`) ir `npm run build` – veiksmingoje testavimo aplinkoje.
- [ ] Darbuotojas: prisijungimas, apžvalga, darbai, kvietimai, užimtumas, statistika, profilis, atsijungimas.
- [ ] Darbdavys: prisijungimas, darbo sukūrimas, darbų sąrašas, darbuotojų paieška, kalendorius (įskaitant plano ribojimą), planai, įmonės profilis, atsijungimas.
- [ ] Administratorius: visi pagrindiniai skirtukai ir „Kiti skyriai“, vartotojų režimai, atsijungimas.
- [ ] Darbdavys / darbuotojas: pranešimai, pokalbiai, kvietimų priėmimas / atmetimas, asmens ir įmonės duomenų išsaugojimas.
- [ ] Viešas pagrindinis puslapis: dizainas, navigacija, CTA, registracija ir prisijungimas liko tokie patys.
- [ ] `/hire`, `/hire/login`, `/hire/portal` su ankstesnėmis URL nuorodomis veikia.
- [ ] 1366 px, 1440 px ir 1920 px langai: šoninis meniu nevirsta horizontaliu, turinys neuždengiamas.
- [ ] 375 px, 768 px ir 1024 px: lieka sena mobili / tablet navigacija, be horizontalaus perpildymo.
- [ ] Klaviatūros navigacija, fokusavimo žiedai, darbalaukio mažinimas ir padidinimas.
- [ ] Patikrinti Cloudflare **preview**, nenaudoti gamybinio domeno testavimui.

## Ko šis PR nedaro
- Nekeičia pagrindinio puslapio.
- Neperkelia `/hire` į `hire.statybos24.lt`.
- Nepakeičia autentifikavimo, Supabase politikų, DB schemos, saugyklos ar Cloudflare domenų.
- Neatlieka automatinio deploy į `main`.

## Pastaba dėl subdomenų
Nauji `app.` ir `hire.` adresai turi būti tvarkomi **atskiru migracijos PR**, po Cloudflare route/DNS, prisijungimo sesijų, Supabase redirect URL, senų nuorodų ir PWA scope audito.
