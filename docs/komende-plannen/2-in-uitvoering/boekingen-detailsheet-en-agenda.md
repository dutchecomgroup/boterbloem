# Boekingen — detailsheet, werkende agenda, en een systeem dat je écht kunt gebruiken

> Bewaart de **wireframes**, het **ontwerpuitgangspunt** en **100 echte klantsituaties**. Die
> laatste zijn het naslagwerk: loop ze door voordat je zegt dat het af is.

---

## 📊 Stand van zaken (bijgewerkt 25-08)

**De serverkant staat en is tegen `atelierboterbloem_dev` doorlopen. Er is nog geen scherm.**

| # | Stap uit §10 | Stand |
|---|---|---|
| 1 | Migratie: kolommen + `order_events` + backfill | ✅ **DEV ✅ / LIVE ⏳** |
| 2 | `orderTotals.ts` + tests (scenario's 60–65) + btw | ✅ 37 nieuwe tests, alle 64 groen |
| 3 | `orderEvents.ts` + regelroutes met hertelling en logging | ✅ getest tegen dev |
| 4 | `Sheet.tsx` + `VeldInline.tsx` | ✅ gebouwd |
| 5 | Boekingsheet W2 | ✅ gebouwd, bruikbaar op 375 px |
| 6 | Agenda: contextmenu, klik-op-lege-dag, slepen | ✅ gebouwd |
| 7 | Aanvraagsheet W4 | ✅ met voorbeeld vóóraf van wat er gebeurt |
| 8 | Handmatig aanmaken + lijstkolommen | ✅ dialoog met klant-ontdubbeling |
| 9 | Offerte W5 | ✅ printbaar, met btw-regel volgens §6 |
| 10–12 | Publieke site (§7) | ✅ homepage 9.500 → 5.173 px, `/aanbod` herbouwd, pakketten zeggen waar ze staan |
| 13 | De honderd scenario's met Playwright | 🟡 deels — zie hieronder |

**Al afgedekt door de serverkant** — met echte bedragen tegen dev doorlopen:
scenario's **1** (handmatig aanmaken) · **12/53/56** (regels, korting, bezorgkosten) ·
**14/15** (pakketregels, per persoon: 45 × € 12,50 = € 562,50) · **16** (aantal wijzigen
herrekent alles) · **18** (regel weg) · **41/48** (allergie aanpasbaar, wijziging in de
tijdlijn) · **45** (pakket zonder prijs) · **58** (totaal stijgt, aanbetaling blijft) ·
**60/61** (€ 37,05 en € 100,00 zonder afrondingsfout) · **62** (€ 120.000 geweigerd) ·
**63/64** (leeg = `0.00`, korting mag negatief maken) · **73** (volgorde) ·
**83** (tweede omzetting geweigerd met het bestaande nummer) · **85/86** (tijdlijn) ·
**96** (UTF-8 gaat byte-voor-byte gelijk heen en terug).

**In de browser geverifieerd:** sheet bruikbaar op 375 px (scenario 50) · homepage en
`/aanbod` schuiven niet horizontaal op 375 px · homepage 5.173 px in 6 secties · `/aanbod`
zonder gaten tussen secties · galerijkop gecentreerd met de inleiding erin.

**Nog onbewezen:** de scenario's die een muis en meerdere stappen vragen — rechtermuisklik,
slepen tussen dagen, de terugknop die de sheet sluit, en de drukte-gevallen (§H). Die staan nog
open.

---

## Context

Het beheerpaneel heeft galerij, pakketten, reviews, klanten, aanvragen en een agenda. Maar de
**boeking zelf** — waar het werk gebeurt — bestaat niet als scherm.

Wat er misgaat, in de woorden van de gebruiker: *"Als je op een boeking klikt vanuit de
agenda, dan opent alleen het overzicht op de pagina boekingen. Er is geen pagina of sidebar
van een event of feest zelf."*

Klopt. `AgendaPage` linkt naar `/admin/boekingen` — de lijst, niet de boeking. En die lijst
is een platte tabel waar alleen de status te wisselen is. Daarnaast:

- **`order_items` wordt nergens gebruikt.** De tabel bestaat, `GET /orders/:id` levert de
  regels al mee, en `grep -rn "orderItems" client/` geeft **nul treffers**.
- **Handmatig een boeking aanmaken kan niet.** Wie belt, kun je niet invoeren.
- **De agenda is alleen-lezen.** Je kunt er niets vanuit plannen.
- **`from-contact`** propt gelegenheid, personen en het bericht als tekstbrij in `notes`.

**Uitkomst:** een schuifpaneel dat opent waar je bent — vanuit de agenda, de lijst of de
aanvragen — met alles over dat ene feest erin. En een agenda waarin je met een rechtermuisklik
een afspraak inplant.

**Besloten in overleg:**
- Detailsheet zoals `BookingDetailSheet` in rubyescaperoom · **ook voor aanvragen**
- **Direct bewerkbaar**, opslaan per blok
- **Tijdlijn met gebeurtenissenlog** — nieuwe tabel `order_events`
- Totaal **automatisch uit de regels** · offerte · handmatig aanmaken
- Extra velden: allergieën · personen · thema · opbouwtijd
- **Agenda wordt een werkkalender**: rechtermuisklik om in te plannen

---

## 1. Ontwerp — hoe het eruit moet zien

Het beheerpaneel is nu functioneel maar vlak: witte kaarten op cream, alles even zwaar. De
sheet is het scherm waar ze het vaakst in zit, dus die verdient beter. Vier uitgangspunten:

**Geld staat bovenaan, niet onderaan.** De eerste vraag bij een boeking is bijna altijd *"wat
staat er nog open?"*. Direct onder de kop een strip met drie getallen — totaal, aanbetaald,
openstaand — in `font-display`, met tabellarische cijfers zodat ze onder elkaar uitlijnen.
Openstaand in `gold-dark`; voldaan in emerald; te veel betaald in `burgundy`.

**Allergieën kunnen niet over het hoofd gezien worden.** Bij rubyescaperoom staat de
kindergroep-instructie in een amber blok vlak onder de kop. Hier hetzelfde principe, maar in
`burgundy/8` met een linkerrand — het enige rode op het scherm. En het blok staat er **ook als
het leeg is**, met "geen bijzonderheden": de afwezigheid van allergieën moet een vaststelling
zijn, geen leeg vlak.

**Bewerken zonder knoppen.** Velden zien eruit als tekst tot je erop klikt; dan worden het
invoervelden met een gouden onderrand. Opslaan gebeurt bij `blur`, met een kort gouden vinkje.
Dat is het patroon van Notion en Linear, en het past bij "direct bewerkbaar": geen modus,
geen Opslaan-knop, niets kwijt als je wegklikt.

**Rust door hiërarchie, niet door lijnen.** Sectiekoppen zijn de bestaande `.tag`-klasse:
klein, goud, wijd gespatieerd. Daaronder ruimte in plaats van een scheidingslijn. Alleen de
regeltabel en de tijdlijn krijgen lijnen, want daar dragen ze betekenis.

**Techniek:** `@radix-ui/react-dialog` zit al in `package.json` en wordt **nergens gebruikt** —
daar bouwen we de sheet op. Dat geeft focus-trap, escape-sluiten, scroll-lock en
`aria-modal` gratis. Backdrop: `bg-charcoal/40` met `backdrop-blur-sm`. Binnenkomst vanaf
rechts in 240 ms, en uit onder `prefers-reduced-motion` — die regel staat al in `index.css`.

> **Eén les uit rubyescaperoom:** hun sheet houdt een *kopie* van de boeking vast en ze
> moesten er twee `useEffect`-blokken omheen bouwen om hem synchroon te houden met verse
> kalenderdata. Wij laten de sheet alleen het **id** vasthouden en het record uit de
> query-cache lezen. Dan bestaat dat probleem niet.

---

## 2. Wireframes

### W1 — Agenda als werkkalender

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Agenda                                    ‹  September 2026  ›   [ Vandaag ] │
│ Boekingen en aanvragen met een datum.        (maand ▾) (week) (lijst)        │
│ ┌──────┬──────┬──────┬──────┬──────┬──────┬──────┐                          │
│ │  MA  │  DI  │  WO  │  DO  │  VR  │  ZA  │  ZO  │                          │
│ ├──────┼──────┼──────┼──────┼──────┼──────┼──────┤                          │
│ │  7   │  8   │  9   │ 10   │ 11   │ 12   │ 13   │                          │
│ │      │      │      │      │      │▐Lisa │      │  ▐ = statuskleur         │
│ │      │      │      │      │      │▐14:30│      │                          │
│ │      │      │      │      │      │▐€445 │      │                          │
│ ├──────┼──────┼──────┼──────┼──────┼──────┼──────┤                          │
│ │ 14   │ 15   │ 16   │ 17   │ 18   │ 19   │ 20   │                          │
│ │      │      │  ⋮   │      │      │▐Fam. │┆Anouk│  ┆ = aanvraag (stippel)  │
│ └──────┴──────┴──────┴──────┴──────┴──────┴──────┘                          │
└──────────────────────────────────────────────────────────────────────────────┘
                    │ rechtermuisklik op een lege dag
                    ▼
        ┌────────────────────────────────┐
        │  Woensdag 16 september         │
        ├────────────────────────────────┤
        │  + Nieuwe boeking op deze dag  │
        │  ✎ Notitie voor deze dag       │
        │  🚫 Dag blokkeren (vol/vrij)    │
        ├────────────────────────────────┤
        │  📋 Dag kopiëren naar…          │
        └────────────────────────────────┘

        rechtermuisklik op een bestaande boeking:
        ┌────────────────────────────────┐
        │  ABB-2026-014 · Lisa de Vries  │
        ├────────────────────────────────┤
        │  ↗ Openen                       │
        │  📅 Verplaatsen naar…           │
        │  ● Status → bevestigd ▸        │
        │  📄 Offerte openen              │
        │  🗑 Verwijderen                 │
        └────────────────────────────────┘
```

Ook: **klik op een lege dag** = nieuwe boeking met die datum voorgevuld. **Slepen** verplaatst
een boeking naar een andere dag, met een bevestiging als de nieuwe datum in het verleden ligt.

### W2 — Boekingsheet (schuift van rechts, 560 px)

```
                        ╔═══════════════════════════════════════════════════╗
                        ║ ABB-2026-014                    [bevestigd ▾]  ✕ ║
   agenda blijft        ║ za 12 september 2026 · 14:30 · opbouw 12:00      ║
   zichtbaar en         ║ uit aanvraag #12 ↗                               ║
   scherpgesteld        ╟───────────────────────────────────────────────────╢
   op de achtergrond    ║   TOTAAL        AANBETAALD        OPENSTAAND      ║
                        ║   € 370,00      € 125,00          € 245,00        ║
                        ╟───────────────────────────────────────────────────╢
                        ║ ▌⚠ ALLERGIEËN & DIEET                            ║
                        ║ ▌Twee gasten glutenvrij. Eén notenallergie —      ║
                        ║ ▌géén notenpasta in de buurt.                     ║
                        ║                                                   ║
                        ║ KLANT                                             ║
                        ║ Lisa de Vries                            → pagina ║
                        ║ lisa@example.com · 06-12345678                    ║
                        ║                                                   ║
                        ║ WANNEER & WAAR                                    ║
                        ║ Datum       12-09-2026                            ║
                        ║ Feest om    14:30      Opbouw om   12:00          ║
                        ║ Locatie     Kerkstraat 1, Assen                   ║
                        ║ Levering    bezorgen ▾                            ║
                        ║                                                   ║
                        ║ WAT                                               ║
                        ║ Pakket   Sweet Table XL ▾   [ regels overnemen ]  ║
                        ║ Personen 45     Thema  pastel, roze en mint       ║
                        ║                                                   ║
                        ║ REGELS                              [ + Regel ]   ║
                        ║ ────────────────────────────────────────────────  ║
                        ║ ⠿ Sweet Table XL           1  € 275,00  € 275,00 ║
                        ║ ⠿ Extra macarons          50  €   1,20  €  60,00 ║
                        ║ ⠿ Glutenvrije variant      1  €  35,00  €  35,00 ║
                        ║ ⠿ Bezorging Assen          1  €  25,00  €  25,00 ║
                        ║ ⠿ Korting vaste klant      1  € -25,00  € -25,00 ║
                        ║ ────────────────────────────────────────────────  ║
                        ║                            TOTAAL      € 370,00  ║
                        ║                                                   ║
                        ║ BETALING                                          ║
                        ║ Aanbetaling € 125,00   ☑ betaald  02-09-2026     ║
                        ║                                                   ║
                        ║ NOTITIES                                          ║
                        ║ Belt vrijdag over de kleuren. Locatie heeft geen   ║
                        ║ lift — via de tuin.                               ║
                        ║                                                   ║
                        ║ TIJDLIJN                              alles tonen ║
                        ║ ● 02 sep 14:12  Aanbetaling ontvangen  € 125,00   ║
                        ║ │ 28 aug 09:40  Status → bevestigd                ║
                        ║ │ 28 aug 09:38  Regel erbij: Extra macarons       ║
                        ║ ● 24 aug 11:02  Aangemaakt uit aanvraag #12       ║
                        ╟───────────────────────────────────────────────────╢
                        ║  [ 🗑 ]                    [ Offerte ]  [ Sluiten ]║
                        ╚═══════════════════════════════════════════════════╝
```

Velden zijn direct bewerkbaar: klik erop en het wordt een invoerveld, `blur` slaat op met een
kort gouden vinkje rechts. Geen bewerkmodus, geen Opslaan-knop.

### W3 — Regel toevoegen (inline onder de tabel)

```
║ ┌───────────────────────────────────────────────────────────┐ ║
║ │ Uit prijslijst ▾  (of typ zelf)                           │ ║
║ │ ┌──────────────────────┬───────┬──────────┬─────────────┐ │ ║
║ │ │ Omschrijving         │ Aantal│ Stuksprijs│  = € 0,00  │ │ ║
║ │ └──────────────────────┴───────┴──────────┴─────────────┘ │ ║
║ │                        [ Annuleren ]   [ Toevoegen ]      │ ║
║ └───────────────────────────────────────────────────────────┘ ║
```

Het regeltotaal rekent live mee tijdens het typen, vóór opslaan.

### W4 — Aanvraagsheet (zelfde vorm, andere inhoud)

```
╔═══════════════════════════════════════════════════╗
║ Aanvraag #12                        [nieuw ▾]  ✕ ║
║ binnengekomen 24 augustus 2026, 10:14            ║
╟───────────────────────────────────────────────────╢
║ Lisa de Vries                                     ║
║ lisa@example.com · 06-12345678       [ mailen ↗ ] ║
║                                                   ║
║ WAT ZE VRAAGT                                     ║
║ Gelegenheid  Babyshower                           ║
║ Pakket       Sweet Table XL                       ║
║ Datum        12 september 2026    (nog 19 dagen)  ║
║ Personen     45                                   ║
║                                                   ║
║ BERICHT                                           ║
║ "Hoi! We geven een babyshower voor mijn zus…"     ║
║                                                   ║
║ ⓘ Deze klant bestaat al — wordt gekoppeld,        ║
║   er komt geen tweede klantregel bij.             ║
╟───────────────────────────────────────────────────╢
║  [ 🗑 ]              [ → Maak er een boeking van ] ║
╚═══════════════════════════════════════════════════╝
```

Vervangt de huidige `confirm()` + `alert()`: je ziet vóóraf wat er gebeurt, inclusief of de
klant gekoppeld of nieuw aangemaakt wordt.

### W5 — Offerte (printbaar, eigen tabblad)

```
┌──────────────────────────────────────────────────────┐
│  [ 🖨 Printen / opslaan als PDF ]      ← niet in druk │
├──────────────────────────────────────────────────────┤
│   Atelier Boterbloem            Offerte              │
│   Kerkstraat 1, Assen           ABB-2026-014         │
│   info@…  ·  06-…               24 augustus 2026     │
│                                                      │
│   Voor: Lisa de Vries · lisa@example.com             │
│   Babyshower · 12 september 2026 · 45 personen       │
│   Kerkstraat 1, Assen · bezorgen, opbouw 12:00       │
│   ────────────────────────────────────────────────   │
│   OMSCHRIJVING            AANTAL  STUKS      TOTAAL  │
│   Sweet Table XL               1  € 275,00  € 275,00 │
│   …                                                  │
│   ────────────────────────────────────────────────   │
│                                 TOTAAL      € 370,00 │
│                                 Aanbetaling € 125,00 │
│                                 Openstaand  € 245,00 │
│                                                      │
│   Allergieën: glutenvrij (2×), notenallergie         │
│   Vraag je aan minimaal 10 dagen van tevoren aan…    │
└──────────────────────────────────────────────────────┘
```

**Waarom printbaar en geen gegenereerd bestand:** een echte PDF vraagt `@react-pdf/renderer`
(~2 MB, eigen componentenboom die niets van Tailwind weet) of `puppeteer` (~300 MB Chromium op
een VPS met drie andere projecten). De printroute hergebruikt de huisstijl één-op-één en
*Opslaan als PDF* zit in elke browser — ze houdt er een echt bestand aan over.

---

## 3. Datamodel

Eén migratie in `docs/deployment/sql-pending/2026-08-25-boekingen.sql`, additief en idempotent.
Eerst op `atelierboterbloem_dev`.

**`orders` erbij:**

| Kolom | Type | Waarom |
|---|---|---|
| `reference` | varchar(32) uniek | `ABB-2026-001` — voor de offerte en om naar te verwijzen aan de telefoon |
| `packageId` | → `packages` (set null) | Welk pakket geboekt is |
| `persons` | integer | Bepaalt de omvang; staat al in de aanvraag |
| `allergies` | text | **Apart veld.** Bij eten mag dit niet in de notities ondersneeuwen |
| `theme` | text | Thema, kleuren, stijl |
| `setupTime` | time | Hoe laat zij er moet zijn — los van `eventTime` |

**`order_events` — nieuw, voor de tijdlijn:**

| Kolom | Type |
|---|---|
| `id` · `orderId` (cascade) · `at` (timestamp) | |
| `kind` | varchar — `aangemaakt` · `status` · `regel` · `betaling` · `offerte` · `wijziging` |
| `summary` | text — de leesbare regel |
| `details` | jsonb — bijv. `{"van":"aanvraag","naar":"bevestigd"}` |
| `actor` | varchar — wie het deed |

> Alleen wat ná de invoering gelogd is verschijnt. Bestaande boekingen krijgen één
> `aangemaakt`-event uit `created_at`, en de lege staat zegt dat erbij — anders denkt iemand
> dat er iets mist. *(Dat is precies wat rubyescaperoom in hun tijdlijn ook doet.)*

`totalPrice` blijft bestaan maar wordt **afgeleid**: de server herberekent hem bij elke
regelwijziging. Bewust opgeslagen, zodat lijst, dashboard en agenda simpele queries houden.

`order_items` heeft alles al. Geen wijziging.

---

## 4. Server

```
POST   /api/admin/orders/:id/items            regel toevoegen
PATCH  /api/admin/orders/:id/items/:itemId    regel wijzigen
DELETE /api/admin/orders/:id/items/:itemId    regel verwijderen
POST   /api/admin/orders/:id/items/reorder    volgorde
POST   /api/admin/orders/:id/apply-package    regels uit een pakket
GET    /api/admin/orders/:id/events           tijdlijn
GET    /api/admin/orders/:id/offerte          printbare offerte
```

Elke regel-route in een **transactie**: regel wegschrijven, `lineTotal` berekenen, `totalPrice`
opnieuw optellen uit álle regels, en een `order_events`-regel wegschrijven. Zo kan het totaal
nooit uit de pas lopen — ook niet met twee schermen open.

Rekenwerk in `server/lib/orderTotals.ts` als pure functies, testbaar zonder database.
Gebeurtenissen via één helper `logOrderEvent(tx, orderId, kind, summary, details)` — één plek,
zodat er nooit een route is die vergeet te loggen.

`from-contact` neemt `packageId`, `categoryId`, `persons` en `eventDate` mee als **velden**,
zet het pakket als eerste regel, en logt `aangemaakt`. De ontdubbeling op e-mail blijft.

---

## 5. Bestanden

| Bestand | Wat |
|---|---|
| `docs/deployment/sql-pending/2026-08-25-boekingen.sql` | kolommen + `order_events` + `reference`-backfill |
| `shared/schema.ts` | velden op `orders`, `orderEvents`, Zod, types |
| `server/lib/orderTotals.ts` + `.test.ts` | pure rekenfuncties |
| `server/lib/orderEvents.ts` | `logOrderEvent()` |
| `server/routes/admin/orders.ts` | regel-routes, hertelling, events, rijkere `from-contact` |
| `server/routes/admin/offerte.ts` | printbare offerte |
| `client/src/components/ui/Sheet.tsx` | schuifpaneel op Radix Dialog — **nieuw, herbruikbaar** |
| `client/src/components/admin/boeking/*.tsx` | secties: Kop · Bedragen · Allergieën · Klant · Wanneer · Wat · Regels · Betaling · Notities · Tijdlijn |
| `client/src/components/admin/BoekingSheet.tsx` | stelt de secties samen |
| `client/src/components/admin/AanvraagSheet.tsx` | W4 |
| `client/src/components/ui/VeldInline.tsx` | klik-om-te-bewerken veld, opslaan bij blur |
| `client/src/components/ui/ContextMenu.tsx` | rechtermuisklik-menu voor de agenda |
| `client/src/pages/admin/AgendaPage.tsx` | contextmenu, klik-op-lege-dag, slepen, sheet openen |
| `client/src/pages/admin/OrdersPage.tsx` | rij opent de sheet, kolommen erbij, aanmaakknop |
| `client/src/pages/admin/ContactRequestsPage.tsx` | opent de aanvraagsheet |

**URL-gestuurd:** `?boeking=14` en `?aanvraag=7` via `useSearch()` uit wouter — deelbaar,
bookmarkbaar, en de terugknop sluit de sheet. De sheet houdt alleen het **id** vast en leest
het record uit de query-cache, dus na een mutatie is hij vanzelf actueel.

---

## 6. ✅ Btw — besloten 25-08

**Drie tarieven, instelbaar.** In de woorden van de gebruiker: *"3 opties, geen btw, dus dan
komt er niks op, en laag en normaal."*

| Keuze | Percentage | Op de offerte |
|---|---|---|
| `geen` | — | **Géén btw-regel.** Kleineondernemersregeling |
| `laag` | 9% | "waarvan € 30,55 btw (9%)" |
| `hoog` | 21% | idem, met 21% |

**Bedragen zijn inclusief btw** — de enige juiste keuze voor een particuliere klant: wat op de
offerte staat is wat ze betaalt. De btw wordt er dus **uit gehaald**, niet bij opgeteld. Bij 9%
is dat `bedrag × 9/109`, niet `bedrag × 0,09`; dat laatste is de klassieke fout en scheelt bij
€ 370 ruim drie euro. Een test controleert dat btw + exclusief altijd precies weer het totaal
is, want anders telt de offerte niet op.

**Waarom `geen` geen nul is.** Bij de kleineondernemersregeling hoort er géén btw-regel te
staan. Een regel met `€ 0,00 btw` suggereert dat er gerekend is en dat het toevallig nul werd.
`btwUitBedrag()` geeft daarom `null` terug bij `geen`, geen nulbedrag.

**Waar de keuze staat.** Het tarief is een eigenschap van het bedrijf, dus de standaard staat in
`site_settings.btw` — één keer instellen. `orders.vat_rate` mag ervan afwijken en is standaard
leeg (= volg de instelling). Zo bereikt een latere wijziging van het standaardtarief ook de
lopende boekingen.

**Standaard op `geen`** zolang de klant het niet bevestigd heeft: liever geen btw-regel dan een
bedrag dat er misschien niet hoort te staan.

> **Beperking, bewust:** één tarief per boeking, niet per regel. Klopt zolang alles onder
> hetzelfde tarief valt. Vallen bezorgkosten ooit onder 21% terwijl het eten 9% is, dan is een
> tarief per regel nodig — `order_items` heeft er dan een kolom bij nodig.

**Migratie:** [`2026-08-25-btw.sql`](../../deployment/sql-pending/2026-08-25-btw.sql) — DEV ✅,
LIVE ⏳.

---

## 7. De publieke site opnieuw opbouwen

De homepage en `/aanbod` zijn in de browser bekeken. Beide werken, maar de opbouw deugt niet.

### 7a · Wat er mis is

**De homepage is 9.500 pixels hoog.** Voor een bedrijf dat één ding verkoopt is dat drie keer
te veel. De grootste veroorzaker is `ProcessStory`: `gap-[55vh]` plus `py-[20vh]` maakt
**260vh scrollhoogte voor één sectie** — ruim 2.300 px waarin de bezoeker vier zinnen leest en
de stappen 02, 03 en 04 als bijna onzichtbare tekst voorbij ziet komen.

Verder acht secties achter elkaar met dezelfde `section-y`-ruimte en dezelfde
gecentreerde-kop-opbouw: marquee, missie, procesverhaal, spotlight, uitgelicht werk,
gelegenheden, reviews, Instagram, CTA. Alles even zwaar, dus niets valt op. En het echte werk —
de foto's — staat pas op tweederde van de pagina.

**Op `/aanbod` klopt het ritme niet.** Tussen de pakketkaarten en de gelegenheid-tegels zit
een gat van honderden pixels, terwijl de tegels zelf klein en gedrongen zijn. "Goed om te
weten" is losse zwevende tekst zonder kader. De taartensectie is één regel in het midden. Het
leest als een reeks losse mededelingen in plaats van een pagina die je ergens heen brengt.

### 7b · Waar komen de tables eigenlijk te staan?

Die vraag kwam op, en dat hij opkomt is het probleem. Op dit moment:

| Waar | Wat je ziet | Voorwaarde |
|---|---|---|
| `/aanbod` | De drie pakketkaarten met vanaf-prijs | `active = true` |
| Homepage, spotlight-blok | De **uitgelichte** pakketten | `active` **én** `featured` |
| Homepage, marquee | "Sweet tables · Grazing tables" als tekst | altijd |
| `/galerij` | Gelegenheden met foto's van uitgevoerde tables | foto's aanwezig |

Twee dingen mankeren daaraan. **Er staat nergens dat de pakketten dé kern van het aanbod zijn**
— op de homepage zijn ze één blok tussen acht andere. En **in het beheerscherm is niet af te
lezen waar een pakket terechtkomt**: de schakelaars heten "Zichtbaar op de site" en "Uitgelicht
op home" zonder te zeggen wélke pagina dat is of hoe het eruit komt te zien.

**Op te lossen met:**
- Op `/admin/pakketten` per pakket een regel *"Staat op /aanbod · uitgelicht op de homepage"*,
  met een **Bekijk op de site**-link die de pagina op dat pakket opent
- Op de homepage de pakketten **naar boven**, direct onder de hero-foto's

### 7c · Nieuwe opbouw homepage

De bezoeker heeft één vraag: *"kan zij iets moois maken voor mijn feest, en wat kost dat
ongeveer?"* De pagina beantwoordt die in volgorde, en houdt op zodra dat gelukt is.

```
┌───────────────────────────────────────────────────────────┐
│ HERO                                                       │
│  Atelier Boterbloem            ┌──────────────────┐        │
│  Sweet tables en grazing       │                  │        │
│  tables voor jouw mooiste      │   carrousel      │        │
│  momenten                      │   echt werk      │        │
│  [ Vraag offerte aan ] [Werk]  └──────────────────┘        │
├───────────────────────────────────────────────────────────┤
│ ~ Sweet tables · Grazing tables · Bruiloften · … ~ (band)  │
├───────────────────────────────────────────────────────────┤
│ WAT WE MAKEN                          ← pakketten, hoog    │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                    │
│  │ Sweet   │  │ Sweet   │  │ Bruiloft│   met foto,        │
│  │ Table   │  │ TableXL │  │ Table   │   vanaf-prijs      │
│  │ v.a.€275│  │ v.a.€395│  │ v.a.€650│   en "Vraag aan"   │
│  └─────────┘  └─────────┘  └─────────┘                    │
│              [ Bekijk het hele aanbod → ]                  │
├───────────────────────────────────────────────────────────┤
│ ONS WERK                              ← foto's, groot      │
│  ┌────┬────┬────┐   metselwerk, 6 beelden                  │
│  └────┴────┴────┘   [ Hele galerij → ]                     │
├───────────────────────────────────────────────────────────┤
│ ZO GAAT HET      01 ──── 02 ──── 03 ──── 04                │
│  Aanvraag · Ontwerp · Maken · Levering    ← één strip,     │
│                                             geen scrollepos│
├───────────────────────────────────────────────────────────┤
│ WAT KLANTEN ZEGGEN    (verdwijnt bij nul reviews)          │
├───────────────────────────────────────────────────────────┤
│ Vraag aan minimaal 10 dagen van tevoren aan…               │
│              [ Vraag een offerte aan ]                     │
└───────────────────────────────────────────────────────────┘
```

**Zes secties in plaats van negen, ruwweg de helft van de hoogte.**

- `ProcessStory` gaat van 260vh naar **één horizontale strip**. Het scroll-verhaal is mooi
  gemaakt, maar het kost een derde van de pagina en levert vier zinnen op. De uitgebreide
  versie past beter op `/over`, waar iemand komt die het verháál wil.
- **Missie-blok en editorial spotlight vervallen** — ze zeggen hetzelfde als de hero en de
  pakketten, met andere woorden.
- **Instagram-raster gaat naar de voettekst** als één regel met een link. Het toont nu dezelfde
  foto's als "Uitgelicht werk" eronder.
- De **sectie-achtergronden** wisselen nu bij elke sectie van kleur; dat wordt rustiger:
  cream als basis, en alleen de pakketten en de CTA krijgen een getinte achtergrond.

### 7d · Nieuwe opbouw `/aanbod`

```
┌───────────────────────────────────────────────────────────┐
│ Sweet & grazing tables                                     │
│ Een tafel vol zoets die het middelpunt van je feest wordt. │
├───────────────────────────────────────────────────────────┤
│  ┌───────────┐ ┌───────────┐ ┌───────────┐                │
│  │  [foto]   │ │  [foto]   │ │  [foto]   │  gelijke hoogte │
│  │ Sweet     │ │ Sweet XL  │ │ Bruiloft  │  vanaf-prijs    │
│  │ vanaf€275 │ │ vanaf€395 │ │ vanaf€650 │  groot          │
│  │ 15–40 p.  │ │ 40–80 p.  │ │ 40+ p.    │                 │
│  │ ✓ … ✓ …   │ │ ✓ … ✓ …   │ │ ✓ … ✓ …   │                 │
│  │[Vraag aan]│ │[Vraag aan]│ │[Vraag aan]│                 │
│  └───────────┘ └───────────┘ └───────────┘                │
│  Elk pakket is een startpunt en kan aangevuld worden.      │
├───────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────────┐ │
│ │ GOED OM TE WETEN                          ← echte kaart│ │
│ │ 📅 Minimaal 10 dagen vooraf   🍰 Taarten flexibeler    │ │
│ │ 🚚 Bezorgen of afhalen        💬 Altijd op maat        │ │
│ └───────────────────────────────────────────────────────┘ │
├───────────────────────────────────────────────────────────┤
│ WAAR WE TABLES VOOR MAKEN     ← grotere tegels, 2×2 of 4  │
│  ┌──────────┬──────────┬──────────┬──────────┐            │
│  │Babyshower│ Bruiloft │Verjaardag│ Bedrijf  │            │
│  └──────────┴──────────┴──────────┴──────────┘            │
├───────────────────────────────────────────────────────────┤
│ OOK MOGELIJK · Taarten        ← prijslijst als kaart       │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ Bruidstaart op maat            vanaf € 4,50  p.p.     │ │
│ │ Verjaardagstaart               vanaf € 3,25  p.p.     │ │
│ └───────────────────────────────────────────────────────┘ │
├───────────────────────────────────────────────────────────┤
│ WAT KLANTEN ZEGGEN  ·  [ Vraag een offerte aan ]          │
└───────────────────────────────────────────────────────────┘
```

Wijzigingen: pakketkaarten krijgen een **coverfoto** (nu tekst-only), de vanaf-prijs wordt het
zwaarste element op de kaart, "goed om te weten" wordt een echte kaart met vier punten, de
gelegenheid-tegels worden groter, en de taartenlijst krijgt een kader in plaats van zwevende
tekst. De verticale ruimte tussen secties gaat van `section-y` overal naar afwisselend
`section-y` en `section-y-sm`.

### 7e · Wat níét verandert

De huisstijl blijft: cream/gold/blush, Cormorant Garamond, de ornamenten, de `Reveal`-animaties.
Dit is een herindeling, geen herontwerp. En `prefers-reduced-motion` blijft gerespecteerd.

**Schatting:** ~1 dag voor beide pagina's samen, plus de kleine toevoeging in `/admin/pakketten`.

---

## 8. Honderd echte situaties

Geen abstracte randgevallen maar **klanten en feesten zoals ze binnenkomen**. Elk scenario
bestaat om één ding te controleren. Loop ze door.

### A · Klein en alledaags

| # | Situatie | Moet kunnen |
|---|---|---|
| 1 | Marieke belt: taart voor 12 personen, zaterdag over drie weken | Handmatig aanmaken zonder aanvraag, klant nieuw |
| 2 | Zelfde Marieke belt een maand later opnieuw | Gekoppeld aan de bestaande klant, geen tweede rij |
| 3 | Iemand appt alleen "kan er iets voor zondag?" zonder naam | Boeking met alleen een datum, klant later invullen |
| 4 | Klant weet de datum nog niet | Boeking zonder datum; niet in de agenda, wel in de lijst |
| 5 | Klant weet de datum wel maar de tijd niet | Hele-dag-event in agenda en ICS |
| 6 | Afhalen om 10:00, geen locatie | Locatieveld leeg, bezorgwijze *afhalen* |
| 7 | Klant heeft geen e-mail, alleen telefoon | Klant aanmaken met alleen naam en telefoon |
| 8 | Boeking van één cupcake-doos van € 18 | Eén regel, klein bedrag, geen aanbetaling |
| 9 | Klant komt langs zonder afspraak, betaalt contant | Aanbetaling = totaal, direct voldaan |
| 10 | Boeking voor vandaag | Verschijnt in de agenda op vandaag, gemarkeerd |

### B · Sweet tables — de kern van het aanbod

| # | Situatie | Moet kunnen |
|---|---|---|
| 11 | Lisa, babyshower, 45 gasten, Sweet Table XL | Pakket kiezen, regels overnemen, personen invullen |
| 12 | Ze wil er 50 macarons bij | Regel toevoegen: 50 × € 1,20 = € 60,00 |
| 13 | En de tafel in pastel roze/mint | Thema-veld, komt op de offerte |
| 14 | Klant wil weten wat er precies in het pakket zit | `includes` staan als regels in de boeking |
| 15 | Pakket is per persoon geprijsd, 45 gasten | Regel wordt 45 × stuksprijs, niet 1 × |
| 16 | Gasten lopen op van 45 naar 60 | Aantal aanpassen; regeltotaal en totaal bewegen mee |
| 17 | Grazing table i.p.v. sweet table, zelfde datum | Pakket wisselen; bestaande regels blijven staan |
| 18 | Ze wil de standaard-taart uit het pakket eruit | Regel verwijderen; totaal daalt |
| 19 | Sweet table én los een taart voor de ouders | Twee regels, één boeking |
| 20 | Twee tafels op één dag, verschillende locaties | Twee boekingen, beide op dezelfde dag in de agenda |
| 21 | Pakket staat op inactief, klant vroeg er wel om | Bestaande boeking houdt pakket en regels |
| 22 | Nieuw pakket bedacht tijdens het gesprek | Regels handmatig typen, geen pakket kiezen |
| 23 | Ze wil per se de opstelling van een eerdere klant | Notitie met verwijzing; galerij-album erbij zoeken |
| 24 | Klant vraagt of het ook in het klein kan, 15 personen | Sweet Table i.p.v. XL, personen-bereik klopt |
| 25 | Bedrijfsborrel, 100 personen, dessertbar | Groot aantal, meerdere regels, hoger totaal |

### C · Bruiloften — de duurste en gevoeligste

| # | Situatie | Moet kunnen |
|---|---|---|
| 26 | Sanne & Joris, bruiloft juni, eerst een kennismaking | Boeking op *aanvraag* met datum, nog geen bedrag |
| 27 | Na het gesprek: bruidstaart + sweet table | Pakket + extra regels, totaal loopt op |
| 28 | Aanbetaling 30% bij bevestiging | Aanbetaling invullen, openstaand rekent mee |
| 29 | Ze willen bladgoud, dat kost extra | Regel erbij ná de aanbetaling; openstaand loopt op |
| 30 | Locatie is een kasteel met een lange oprit | Locatie meerdere regels; blijft met regeleindes staan |
| 31 | Opbouw om 11:00, feest om 16:00 | Twee tijden apart; ICS gebruikt de feesttijd |
| 32 | De weddingplanner belt namens het stel | Notitie wie contactpersoon is |
| 33 | Ze willen de taart op de foto voor hun uitnodiging | Notitie; galerij-album koppelen |
| 34 | Datum verschuift een week | Datum wijzigen; agenda en ICS bewegen mee, één event |
| 35 | Bruiloft van 120 personen, betaling in twee termijnen | Aanbetaling + restant zichtbaar, offerte klopt |
| 36 | Een jaar van tevoren geboekt | Agenda navigeert over de jaargrens |
| 37 | Twee bruiloften op dezelfde zaterdag | Beide op één dag zichtbaar, allebei aanklikbaar |
| 38 | Bruiloft gaat niet door, aanbetaling blijft staan | Status *geannuleerd*; uit ICS, wel in de lijst |

### D · Allergieën en dieet — waar het echt fout kan gaan

| # | Situatie | Moet kunnen |
|---|---|---|
| 39 | Twee gasten glutenvrij | Allergieveld, opvallend, bovenaan de sheet |
| 40 | Eén notenallergie — kruisbesmetting is levensgevaarlijk | Tekst blijft volledig staan, geen afkapping |
| 41 | Klant meldt de allergie pas twee dagen vooraf | Veld aanpasbaar tot het laatst; tijdlijn logt de wijziging |
| 42 | Geen enkele allergie | Blok toont **"geen bijzonderheden"** — afwezigheid is ook informatie |
| 43 | Vegan tafel | Allergieveld + aparte regel voor de meerprijs |
| 44 | Lactose-intolerant, halal en één veganist door elkaar | Lange tekst, meerdere regels, blijft leesbaar |
| 45 | Klant typt de allergie per ongeluk in de notities | Het blok staat eróver — dat is de hint |
| 46 | Allergie moet ook op de offerte | Offerte toont de allergieregel |
| 47 | Kinderfeest, iets met kleurstoffen | Vrij tekstveld, geen keuzelijst |
| 48 | Allergie wijzigt van "noten" naar "pinda's" | Tijdlijn toont de wijziging met oude en nieuwe waarde |
| 49 | Twee boekingen op één dag, één met allergie | Alleen die ene toont het blok gevuld |
| 50 | Ze wil de allergie op de dag zelf op haar telefoon zien | Sheet werkt op 375 px breed |

### E · Geld — aanbetaling, korting, meerwerk

| # | Situatie | Moet kunnen |
|---|---|---|
| 51 | € 445 totaal, € 125 aanbetaald | Openstaand € 320, direct zichtbaar bovenaan |
| 52 | Klant betaalt het restant contant op de dag | Aanbetaling naar totaal, "voldaan" |
| 53 | Vaste klant krijgt € 25 korting | Regel met **negatief** bedrag |
| 54 | Korting van 10% op het geheel | Kortingsregel handmatig berekend en ingevoerd |
| 55 | Klant betaalt te veel | Openstaand negatief, melding "te veel betaald" |
| 56 | Bezorgkosten Assen € 25 | Losse regel, telt mee in het totaal |
| 57 | Ze rekent geen bezorgkosten voor een vaste klant | Regel op € 0,00 laten staan als vermelding |
| 58 | Aantal van 45 naar 60 ná de aanbetaling | Totaal stijgt, aanbetaling blijft, openstaand stijgt |
| 59 | Meerwerk op de dag zelf: extra schaal | Regel erbij, ook na *afgeleverd* |
| 60 | Prijs per stuk € 12,35, drie stuks | **€ 37,05** — geen afrondingsfout |
| 61 | Half pakket: 0,5 × € 200 | € 100,00 — halve aantallen mogen |
| 62 | Bedrag van € 120.000 ingetypt (typefout) | Geweigerd — `numeric(10,2)` gaat tot € 99.999,99 |
| 63 | Alle regels verwijderd | Totaal wordt `0.00`, niet leeg |
| 64 | Korting groter dan de rest | Totaal negatief; toegestaan met zachte melding |
| 65 | Omzetgrafiek na een regelwijziging | Telt mee zodra *afgeleverd* mét betaaldatum |

### F · Wijzigingen — want alles verandert

| # | Situatie | Moet kunnen |
|---|---|---|
| 66 | Klant verplaatst de datum twee keer | Beide wijzigingen in de tijdlijn |
| 67 | Boeking van zaterdag naar zondag slepen in de agenda | Datum wijzigt, bevestiging als het in het verleden valt |
| 68 | Tijd verschuift van 14:30 naar 16:00 | ICS werkt het bestaande event bij, geen tweede |
| 69 | Locatie wijzigt naar het adres van de schoonmoeder | Veld aanpassen, blijft op de offerte |
| 70 | Klant wisselt van contactpersoon | Andere klant koppelen; oude houdt zijn boekingen |
| 71 | Verkeerde klant gekoppeld | Loskoppelen; boeking blijft bestaan |
| 72 | Twee mensen bewerken tegelijk in twee tabbladen | Beide komen aan; totaal klopt met de som van de regels |
| 73 | Regel van plaats wisselen | Volgorde blijft na verversen én op de offerte |
| 74 | Omschrijving van een regel verbeteren | Bedragen blijven ongemoeid |
| 75 | Product uit de prijslijst verwijderd dat in een regel zat | Regel blijft met eigen omschrijving en prijs |
| 76 | Klant verwijderd die aan drie boekingen hing | Boekingen blijven, klantveld leeg |
| 77 | Status per ongeluk op *afgeleverd* gezet | Terug te zetten; tijdlijn toont beide stappen |
| 78 | Notitie halverwege typen en wegklikken | Opgeslagen bij `blur`, niets kwijt |

### G · Als het misgaat

| # | Situatie | Moet kunnen |
|---|---|---|
| 79 | Klant zegt af, twee weken vooraf | *Geannuleerd*; uit de ICS, wel in de lijst |
| 80 | Klant zegt af op de dag zelf, aanbetaling niet terug | Geannuleerd, aanbetaling blijft zichtbaar |
| 81 | Zij moet afzeggen wegens ziekte | Zelfde status, notitie met de reden |
| 82 | Boeking dubbel ingevoerd | Verwijderen; regels gaan mee (cascade) |
| 83 | Aanvraag twee keer omgezet | Tweede keer geweigerd, met link naar de bestaande boeking |
| 84 | Aanvraag verwijderd waar een boeking uit kwam | Boeking blijft; de verwijzing verdwijnt |
| 85 | Klant klaagt dat de offerte niet klopt | Tijdlijn toont wanneer welke regel is toegevoegd |
| 86 | Zij weet niet meer of de aanbetaling binnen is | Tijdlijn toont datum en bedrag |
| 87 | Boeking geopend die net verwijderd is | Nette melding in de sheet, geen crash |
| 88 | `?boeking=99999` in de adresbalk | Sheet opent niet, melding, agenda blijft bruikbaar |

### H · Drukte en samenloop

| # | Situatie | Moet kunnen |
|---|---|---|
| 89 | Vijf boekingen op één zaterdag in december | Alle vijf in het dagvakje, scrollbaar of ingeklapt |
| 90 | Volle maand met dertig boekingen | Maandweergave blijft leesbaar en snel |
| 91 | Drie aanvragen op dezelfde dag als een boeking | Aanvragen met stippellijn, visueel te onderscheiden |
| 92 | Aanvraag omgezet naar boeking, zelfde dag | Verschijnt **één keer**, niet dubbel |
| 93 | Rechtermuisklik op een volle dag | Contextmenu opent, "nieuwe boeking" werkt nog |
| 94 | Zij plant op de telefoon een boeking in | Mobiele lijstweergave; nieuwe boeking via een knop |
| 95 | Twee weken vakantie blokkeren | Dag blokkeren, zichtbaar in de agenda |

### I · Uit de praktijk

| # | Situatie | Moet kunnen |
|---|---|---|
| 96 | Klant heet "Familie De Vries; Jansen, Piet" | Komma en puntkomma breken de ICS-feed niet |
| 97 | Klant met een heel lang e-mailadres | Breekt de sheet-opmaak niet af |
| 98 | Aanvraag binnen die korter is dan de levertijd | Waarschuwing in het formulier, aanvraag komt door |
| 99 | Zij wil de agenda op haar telefoon zien | ICS-feed abonneren in Google Agenda én iPhone |
| 100 | Nieuwe boeking van vorig jaar invoeren voor de administratie | Datum in het verleden toegestaan, zachte melding |

---

## 9. Verificatie

**Migratie** — eerst op dev, dry run, volgens `db-migraties.md`:
- [ ] Bestaande boekingen krijgen een uniek `reference`, oplopend per jaar
- [ ] Elke bestaande boeking krijgt één `aangemaakt`-event uit `created_at`
- [ ] Tweede run doet niets (idempotent)
- [ ] Applicatie draait: alle endpoints 200

**Rekenwerk** — `server/lib/orderTotals.test.ts`, scenario's **60 t/m 65**:
- [ ] `3 × € 12,35 = € 37,05` · `0,5 × € 200 = € 100,00`
- [ ] Negatieve regel verlaagt · alles weg = `0.00` · boven € 99.999,99 geweigerd

**Schermen** — de honderd scenario's zijn het testscript. Doorlopen met Playwright:
- [ ] A t/m I, elk vinkje bewust gezet
- [ ] Sheet op 375 px breed bruikbaar (scenario 50)
- [ ] Rechtermuisklik, klik-op-lege-dag en slepen werken (93, 67)
- [ ] Terugknop sluit de sheet, `?boeking=` is deelbaar

**Publieke site (§7)** — meten, niet gokken:
- [ ] Homepage-hoogte **gehalveerd** (nu 9.500 px) — meten met een volledige schermafdruk
- [ ] Pakketten staan boven de vouw op de tweede schermhoogte, niet op tweederde van de pagina
- [ ] `ProcessStory`-strip past binnen één schermhoogte
- [ ] `/aanbod`: geen gat groter dan één sectie-ruimte tussen twee blokken
- [ ] Pakketkaarten hebben een coverfoto en een leesbare vanaf-prijs
- [ ] Nul actieve pakketten → "Binnenkort"-staat blijft werken op beide pagina's
- [ ] `/admin/pakketten` zegt per pakket waar het terechtkomt, met werkende bekijk-link
- [ ] Beide pagina's op 375 px breed: geen horizontaal schuiven
- [ ] `prefers-reduced-motion` aan → geen animaties, pagina blijft leesbaar

**Altijd:** `npm run typecheck`, `npm test`, `npm run build` groen, link-check over `docs/`.

---

## 10. Volgorde

Twee sporen die elkaar niet raken: het **beheerpaneel** (boekingen, agenda) en de **publieke
site**. Het beheerspoor eerst — daar zit het werk dat ze dagelijks doet.

**Spoor A — boekingen en agenda** (het fundament eerst; rekenfouten zijn het duurst)

| # | Wat | Duur |
|---|---|---|
| 1 | Migratie: kolommen + `order_events` + backfill, op dev | 1,5 uur |
| 2 | `orderTotals.ts` + tests (scenario's 60–65) | 2 uur |
| 3 | `orderEvents.ts` + regel-routes met hertelling en logging | 3 uur |
| 4 | `Sheet.tsx` + `VeldInline.tsx` — de herbruikbare basis | 3 uur |
| 5 | Boekingsheet W2 met alle secties | ~1 dag |
| 6 | Agenda: contextmenu, klik-op-lege-dag, slepen, sheet openen | 4 uur |
| 7 | Aanvraagsheet W4 + rijkere `from-contact` | 3 uur |
| 8 | Handmatig aanmaken + lijst met kolommen | 3 uur |
| 9 | Offerte W5 — **ná het btw-antwoord** | 4 uur |

**Spoor B — publieke site** (§7)

| # | Wat | Duur |
|---|---|---|
| 10 | `/aanbod` opnieuw opbouwen: kaarten met foto, "goed om te weten"-kaart, ritme | 4 uur |
| 11 | Homepage: pakketten omhoog, `ProcessStory` naar één strip, drie secties eruit | 4 uur |
| 12 | `/admin/pakketten`: "staat op /aanbod · uitgelicht op home" + bekijk-link | 1 uur |

**Afsluiten**

| # | Wat | Duur |
|---|---|---|
| 13 | De honderd scenario's doorlopen met Playwright, docs bijwerken | 3 uur |

**Schatting: ~5 dagen.** De sheet en de agenda zijn samen bijna de helft; die twee bepalen of
het systeem prettig werkt of niet. De publieke site is een dag en kan parallel als iemand
anders eraan werkt.
