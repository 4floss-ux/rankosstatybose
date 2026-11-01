# „Administratoriai“ (moderatoriai su teisėmis) – planas savininkui

Prototipe: Sistema → Administratoriai. Savininkas kviečia žmogų el. paštu, parenka teises (Pavaduotojas arba pasirinktinai).

## Teisės (kaip prototipe)
Spręsti ginčus · Tvarkyti klaidų pranešimus · Moderuoti atsiliepimus · Skaityti ir rašyti pokalbiuose · Patvirtinti įmones ·
Suspenduoti paskyras · Tarptautinė atranka · Trinti paskyras, darbus ir failus · „Prisijungti kaip“ · Keisti įmonių planus · Valdyti administratorių komandą.
„Pavaduotojas“ = pirmos 7 (be trynimo, „Prisijungti kaip“, planų ir komandos valdymo).

## Kaip padaryti saugiai (tik papildymai DB)
1. Nauja lentelė `admin_team_members (user_id, permissions text[], invited_by, created_at)` ir `admin_team_invites (email, token_hash, permissions, expires_at)`.
   Savininkas (dabartinis `profiles.role = 'admin'`) lieka su visomis teisėmis; jo duomenys nekeičiami.
2. Nauja funkcija `admin_can(p_perm text)` → true savininkui arba nariui su ta teise.
3. Kiekviena esama admin RPC funkcija pradeda tikrinti `admin_can('<teisė>')` vietoj `is_admin()` **papildomai** –
   t. y. `is_admin() or admin_can(...)`. Kol nėra narių, elgsena nesikeičia.
4. RLS politikos, kurios dabar remiasi `is_admin()`, gauna papildomą sąlygą su atitinkama teise.
5. Edge funkcija `admin-impersonate` tikrina teisę „loginAs“.
6. UI: Administratoriai puslapis (sąrašas, kvietimas, teisių langas), meniu punktai slepiami be teisės, veiksmų istorija rodo kas atliko.

## Rizika
Klaidingai pakeitus vieną patikrą, moderatorius gautų daugiau teisių nei turėtų. Todėl: kiekviena funkcija keičiama atskirai,
po to – automatinis testas su testine moderatoriaus paskyra (kiekviena teisė įjungta / išjungta).

Laukiama savininko sprendimo: ar daryti, ir ar reikia visų 11 teisių, ar užtenka „Pavaduotojo“ rinkinio.
