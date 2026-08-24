# Agenda + levertijden

> **Status:** 🎯 Uitgewerkt, klaar om te starten
> **Thema:** 📅 agenda
> **Laatst bijgewerkt:** 2026-08-24
> **Afhankelijk van:** fase 1 (datamodel)
> **Effort-schatting:** ~1,5 dag

## Context

Twee wensen uit de meeting van 24-08 die dezelfde data raken.

**Agenda.** Ze wil zien wat er aan komt. Boekingen hebben wel een `eventDate`, maar de enige
plek waar iets datum-achtigs staat is de dashboard-tegel "Komende 30 dagen" — een getal, geen
overzicht. De boekingenlijst in
[`OrdersPage.tsx`](../../../client/src/pages/admin/OrdersPage.tsx) is een tabel op datum
gesorteerd. Er is geen kalender, en niets op haar telefoon.

**Levertijden.** Standaard **10 dagen van tevoren** aanvragen; voor taarten is ze flexibeler.
Dat staat nu nergens — niet op de site, niet in het formulier, niet in de code.

**Gekozen aanpak (besloten 24-08):** eigen maandkalender in het beheerpaneel, plús een
**read-only ICS-feed** die ze kan abonneren in Google Calendar of op haar telefoon. Geen
two-way Google-koppeling: dat vraagt OAuth, token-vernieuwing en conflictafhandeling, en de
winst — items in Google kunnen aanmaken — is klein als de boekingen toch in het beheerpaneel
ontstaan.

## Scope

**Wel:**
- Maandkalender in het beheerpaneel met boekingen en aanvragen-met-datum
- Tijd en locatie per boeking
- ICS-feed met eigen token, abonneerbaar in elke agenda-app
- Levertijd-regels instelbaar, zichtbaar op de site, gebruikt door het contactformulier

**Niet:**
- Two-way sync met Google Calendar
- Beschikbaarheid tonen aan bezoekers of online reserveren
- Herinneringen of notificaties vanuit de agenda (aanvraag-notificatie zit in
  [aanvragen-formulier-uitbreiding.md](aanvragen-formulier-uitbreiding.md))

## Aanpak

### Fase A — Schema (onderdeel van de gebundelde migratie in fase 1)

Op `orders`:

| Kolom | Type | Toelichting |
|---|---|---|
| `eventTime` | time | nullable — hoe laat het af/geleverd moet zijn |
| `location` | text | nullable — waar het heen gaat |

`eventDate` blijft `date` zonder tijd, conform de regel in
[`CLAUDE.md`](../../../CLAUDE.md); de tijd komt in een eigen kolom zodat "datum bekend, tijd
nog niet" een geldige toestand blijft.

In `site_settings` (jsonb, dus **geen** schemawijziging) een nieuwe key `levertijden`:

```json
{
  "standaardDagen": 10,
  "taartenDagen": 5,
  "tekst": "Vraag je aan minimaal 10 dagen van tevoren aan. Voor taarten kunnen we vaak flexibeler zijn — vraag gerust.",
  "agendaFeedToken": "<willekeurige 32 hex>"
}
```

Bijbehorend Zod-schema naast `contactSettingsSchema` in `shared/schema.ts`, en — anders dan
de bestaande drie — daadwerkelijk **aansluiten** op de settings-route; zie
[security-hardening.md](../2-in-uitvoering/security-hardening.md), waar dat sowieso opgelost wordt.

### Fase B — Kalender in het beheerpaneel (~4 uur)

Nieuw `/admin/agenda`, menu-item in `NAV` in
[`AdminLayout.tsx:6-14`](../../../client/src/components/layout/AdminLayout.tsx) tussen
Dashboard en Boekingen.

`GET /api/admin/agenda?from=YYYY-MM-DD&to=YYYY-MM-DD` levert in één respons:

- boekingen uit `orders` met een `eventDate` in het bereik, met klantnaam, status, tijd, locatie
- aanvragen uit `contact_requests` met een `eventDate` in het bereik en status ≠
  `omgezet_naar_order` — die zijn nog geen boeking maar bezetten wel mogelijk die dag

Weergave: maandraster, per dag de items als gekleurde regels. Kleur volgt de bestaande
`order_status`-enum — aanvraag / bevestigd / in productie / klaar / afgeleverd / geannuleerd.
Aanvragen krijgen een afwijkende, lichtere stijl zodat het verschil met een echte boeking
zichtbaar blijft. Klik op een item → naar de boeking of de aanvraag.

Bouwen met `date-fns`, dat al in `package.json` staat — geen kalenderbibliotheek erbij. Een
maandraster is een `startOfMonth` / `eachDayOfInterval` en een grid van zeven kolommen.

Op mobiel valt het raster terug op een lijst per dag; een maandraster van 30 vakjes is op een
telefoon onleesbaar.

### Fase C — ICS-feed (~3 uur)

`GET /api/agenda.ics?token=…` — **buiten** `/api/admin/*` gemount, want die router zit
achter `requireAuth` en agenda-apps sturen geen sessie-cookie mee. In plaats daarvan een
`agendaFeedToken` uit `site_settings`, met een vergelijking in constante tijd
(`crypto.timingSafeEqual`) en een knop in het instellingen-scherm om het token te
vernieuwen.

> ⚠️ Zo'n feed-URL is een geheim: wie hem heeft, ziet alle boekingen met klantnaam. Daarom
> een eigen token dat los te vervangen is zonder wachtwoordwijziging, en dat we alleen tonen
> via een kopieerknop.

De feed levert `VEVENT`-regels voor boekingen die niet geannuleerd zijn:

- `SUMMARY` — klantnaam + pakket of korte omschrijving
- `DTSTART` / `DTEND` — `eventDate` + `eventTime`; zonder tijd een hele-dag-event
  (`VALUE=DATE`)
- `LOCATION` — het nieuwe `location`-veld
- `DESCRIPTION` — status, totaalbedrag, link naar de boeking
- `UID` — `order-<id>@atelierboterbloem` zodat updates niet dubbelen
- `STATUS` — `CONFIRMED` / `TENTATIVE` op basis van de order-status

Met de hand opgebouwd; ICS is een regelgebaseerd formaat en de enige valkuilen zijn
CRLF-regeleindes, escaping van komma's en puntkomma's, en regels van maximaal 75 octetten
vouwen. Geen bibliotheek nodig.

In het instellingen-scherm de feed-URL met een kopieerknop en een kort uitlegblokje: in
Google Calendar via *Andere agenda's → Via URL*, op iPhone via *Agenda's → Account
toevoegen → Andere*.

### Fase D — Levertijden op de site (~1 uur)

- Blok op `/aanbod` en `/contact` met de tekst uit `site_settings.levertijden`
- Het contactformulier waarschuwt bij een datum binnen de termijn: *"Dit is korter dan 10
  dagen vooraf. Stuur je aanvraag gerust — we laten weten of het lukt."* Geen blokkade; ze
  wil zelf beslissen.
- Instellingen-scherm krijgt de velden om dagen en tekst aan te passen

## Bestanden

| Bestand | Wijziging |
|---|---|
| `shared/schema.ts` | `eventTime` + `location` op orders, `levertijdenSchema` |
| `server/routes/admin/agenda.ts` | nieuw — bereikquery over orders + contact_requests |
| `server/routes/agenda-ics.ts` | nieuw — token-geverifieerde ICS-feed, buiten `/api/admin` |
| `server/index.ts` | ICS-route mounten vóór de admin-router |
| `server/routes/admin/index.ts` | agenda-router mounten |
| `client/src/pages/admin/AgendaPage.tsx` | nieuw — maandraster + mobiele lijst |
| `client/src/pages/admin/SettingsPage.tsx` | levertijden + feed-URL + token vernieuwen |
| `client/src/pages/admin/OrdersPage.tsx` | tijd + locatie in het boekingsformulier |
| `client/src/components/layout/AdminLayout.tsx` | menu-item Agenda |
| `client/src/App.tsx` | route `/admin/agenda` |
| `client/src/pages/public/ContactPage.tsx` | levertijd-waarschuwing bij datumkeuze |
| `scripts/seed-admin.ts` | `levertijden`-key met default + gegenereerd token |

## Verificatie

- [ ] Boeking met datum verschijnt op de juiste dag in de maandweergave
- [ ] Aanvraag met datum verschijnt lichter en is te onderscheiden van een boeking
- [ ] Aanvraag die omgezet is naar een boeking verschijnt **één keer**, niet dubbel
- [ ] Geannuleerde boeking staat wel in de kalender, niet in de ICS-feed
- [ ] Maandnavigatie vooruit en achteruit werkt, ook over een jaargrens
- [ ] Mobiel: lijstweergave in plaats van raster
- [ ] ICS-feed zonder token → 401; met verkeerd token → 401
- [ ] Feed daadwerkelijk geabonneerd in Google Calendar **en** op een iPhone: events komen door
- [ ] Boeking met tijd → tijdgebonden event; zonder tijd → hele-dag-event
- [ ] Boeking wijzigen → agenda-app werkt het bestaande event bij, maakt geen tweede aan
- [ ] Klantnaam met een komma of puntkomma breekt de feed niet (escaping)
- [ ] Token vernieuwen maakt de oude feed-URL ongeldig
- [ ] Datum binnen 10 dagen in het contactformulier → waarschuwing, verzenden lukt nog steeds

## Effort-schatting

| Onderdeel | Inschatting |
|---|---|
| Schema (rijdt mee in fase 1) | ½ uur |
| Agenda-endpoint | 1,5 uur |
| Maandraster + mobiele lijst | 4 uur |
| ICS-feed + token + uitleg | 3 uur |
| Levertijden site + formulier | 1 uur |
| **Totaal** | **~1,5 dag** |
