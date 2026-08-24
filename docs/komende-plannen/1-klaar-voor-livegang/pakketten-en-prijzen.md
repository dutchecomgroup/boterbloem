# Pakketten & prijzen — Sweet Tables voorop, taarten erbij

> **Status:** 🎯 Uitgewerkt, wacht op prijzen van de klant
> **Thema:** 🍰 pakketten
> **Laatst bijgewerkt:** 2026-08-24
> **Afhankelijk van:** fase 1 (datamodel) · vanaf-prijzen + pakketinhoud van de klant
> **Effort-schatting:** ~1,5 dag

## Context

Twee dingen uit de meeting van 24-08 die samen één stuk werk zijn.

**Ten eerste de focus.** Sweet Tables & Grazing Tables zijn de hoofdfocus; taarten blijven
in het aanbod maar klein. De site doet nu het omgekeerde: van de zes blokken in
[`ServicesPage.tsx:9-46`](../../../client/src/pages/public/ServicesPage.tsx) gaan er vier
over taarten en staat "Sweet tables & party setups" op plek vijf.

**Ten tweede de prijzen.** Ze wil richting pakketten werken — normale sweet table, XL table,
bruiloft table — elk met een **vanaf-prijs** als richtlijn die aangevuld kan worden. En
prijzen moeten zichtbaar zijn op de site; dat was expliciet.

**Wat er nu staat.** Er is een `products`-tabel met `slug`, `name`, `category`,
`description`, `basePrice`, `unit`, `active` en `sortOrder`, met een werkend beheerscherm.
Maar er is **geen enkele publieke route** die die producten ontsluit — `server/routes/public.ts`
kent alleen settings, galerij en contact. De prijzen die ze in het beheerscherm invult komen
dus nergens terecht. Het aanbod op de site is volledig hardcoded.

## Scope

**Wel:**
- Nieuwe `packages`-tabel voor de drie tafel-pakketten
- `products` publiek ontsluiten als **basis-prijslijst voor taarten**
- `/aanbod` herschrijven: tables bovenaan met vanaf-prijzen, taarten als klein blok eronder
- Publieke routes voor pakketten en producten
- Beheerscherm voor pakketten

**Niet:**
- Online bestellen of afrekenen — de site blijft bij het contactformulier
- Prijs-calculator of configurator
- Kortingen, staffels, seizoensprijzen

## Waarom een aparte tabel en niet `products` uitbreiden

Overwogen, en bewust niet gedaan. Een pakket heeft velden die een product niet heeft
(personen-bereik, een lijst van wat erin zit, een vanaf-karakter) en het beheerscherm zou
twee soorten regels met verschillende velden in één lijst moeten proppen. Ze zijn ook
inhoudelijk verschillend: een pakket is een **richtprijs met een verhaal**, de taartenlijst
is een **kale prijslijst**. Twee tabellen, twee schermen, elk simpel.

## Aanpak

### Fase A — Schema (onderdeel van de gebundelde migratie in fase 1)

Nieuwe tabel `packages`:

| Kolom | Type | Toelichting |
|---|---|---|
| `id` | serial pk | |
| `slug` | varchar(120) uniek | `sweet-table-xl` |
| `name` | varchar(200) | "Sweet Table XL" |
| `tagline` | varchar(255) | de ene zin eronder |
| `description` | text | langere tekst |
| `priceFrom` | numeric(10,2) | conform de bestaande geld-conventie |
| `priceUnit` | varchar(32) | `"totaal"` \| `"per_persoon"` |
| `personsMin` / `personsMax` | integer | nullable |
| `includes` | jsonb | array van strings — "wat zit erin" |
| `coverItemId` | integer → `gallery_items.id` | `onDelete: set null` |
| `featured` | boolean | uitgelicht op de homepage |
| `active` | boolean | default true |
| `sortOrder` | integer | default 0 |
| `createdAt` | timestamp | |

Op `products`: `publicVisible` (boolean, default false) — zodat de taartenlijst pas
verschijnt als ze hem bewust aanzet, en interne producten intern blijven.

> **Geld als `numeric(10,2)`** conform de regel in [`CLAUDE.md`](../../../CLAUDE.md): opslaan
> als string in JS, converteren met `Number()` waar nodig. `priceFrom` volgt dezelfde
> conventie als `orders.totalPrice` en `products.basePrice`.

### Fase B — Server (~2 uur)

Nieuw `server/routes/admin/packages.ts`, in het stramien van het bestaande
[`products.ts`](../../../server/routes/admin/products.ts) — dat is een schone, compacte
CRUD-router van 47 regels die zich één-op-één laat overnemen. Mounten in
`server/routes/admin/index.ts`.

Publiek in `server/routes/public.ts` erbij:

- `GET /api/public/packages` — alleen `active`, gesorteerd op `sortOrder`
- `GET /api/public/products` — alleen `active` **en** `publicVisible`

Beide gebruiken het bestaande `next(err)`-patroon van de andere routes daar.

### Fase C — Beheerscherm (~3 uur)

Nieuw `/admin/pakketten`, gemodelleerd naar
[`ProductsPage.tsx`](../../../client/src/pages/admin/ProductsPage.tsx). Extra ten opzichte
van producten: het `includes`-veld als lijst waar regels bij kunnen, en een keuze voor de
coverfoto uit de galerij.

Menu-item toevoegen aan `NAV` in
[`AdminLayout.tsx:6-14`](../../../client/src/components/layout/AdminLayout.tsx).

Op het bestaande producten-scherm: een `publicVisible`-schakelaar per regel en een zin die
uitlegt dat dit de publieke taart-prijslijst is.

### Fase D — Publieke `/aanbod` (~3 uur)

[`ServicesPage.tsx`](../../../client/src/pages/public/ServicesPage.tsx) wordt herschreven.
De hardcoded `SERVICES`-array verdwijnt. Nieuwe opbouw van de pagina:

1. **Kop** — Sweet Tables & Grazing Tables, waar het atelier voor staat
2. **De pakketten** — kaart per pakket met coverfoto, naam, tagline, `vanaf € x`, het
   personen-bereik en de "wat zit erin"-lijst. Elke kaart eindigt op *Vraag aan* → `/contact`
   met het pakket voorgeselecteerd (zie
   [aanvragen-formulier-uitbreiding.md](aanvragen-formulier-uitbreiding.md))
3. **Zin over aanvullen** — "elk pakket is een startpunt en kan aangevuld worden"
4. **Taarten** — compact blok met de prijslijst uit `products`: naam, vanaf-prijs, eenheid
5. **Levertijden** — het blok uit [agenda-boekingen.md](agenda-boekingen.md)
6. **Reviews** — het blok uit [content-reviews.md](content-reviews.md)
7. **Slot-CTA** — bestaande sectie blijft

De homepage krijgt de `featured`-pakketten in het bestaande spotlight-blok in plaats van de
hardcoded `SERVICE_PREVIEWS`-array in
[`HomePage.tsx:115-119`](../../../client/src/pages/public/HomePage.tsx).

Prijsweergave via de bestaande `formatCurrency()` in
[`client/src/lib/utils.ts`](../../../client/src/lib/utils.ts), die het dashboard ook al
gebruikt. Bij `priceUnit: "per_persoon"` wordt het `vanaf € 4,50 p.p.`.

### Fase E — Seed

[`scripts/seed-admin.ts`](../../../scripts/seed-admin.ts) heeft al een `ensureProducts()`.
Erbij: `ensurePackages()` met de drie pakketten op prijs `0` en `active: false` — zichtbaar
in het beheerscherm, onzichtbaar op de site tot de klant de prijzen heeft doorgegeven. Zelfde
`onConflictDoNothing`-patroon als de bestaande seeds.

## Bestanden

| Bestand | Wijziging |
|---|---|
| `shared/schema.ts` | `packages`-tabel, `publicVisible` op products, Zod-schema's, types |
| `server/routes/admin/packages.ts` | nieuw — CRUD naar het model van `products.ts` |
| `server/routes/admin/index.ts` | router mounten |
| `server/routes/public.ts` | `/packages` + `/products` |
| `client/src/pages/admin/PackagesPage.tsx` | nieuw |
| `client/src/pages/admin/ProductsPage.tsx` | `publicVisible`-schakelaar |
| `client/src/components/layout/AdminLayout.tsx` | menu-item |
| `client/src/App.tsx` | route `/admin/pakketten` |
| `client/src/pages/public/ServicesPage.tsx` | volledig herschreven |
| `client/src/pages/public/HomePage.tsx` | `SERVICE_PREVIEWS` → featured pakketten |
| `scripts/seed-admin.ts` | `ensurePackages()` |

## Verificatie

- [ ] Drie pakketten in het beheerscherm verschijnen in de juiste volgorde op `/aanbod`
- [ ] Pakket op `active: false` verdwijnt van de site maar blijft in het beheerscherm
- [ ] `vanaf € 275` en `vanaf € 4,50 p.p.` renderen allebei correct via `formatCurrency`
- [ ] Een product zonder `publicVisible` staat **niet** in `GET /api/public/products`
- [x] "Wat zit erin"-regels toevoegen, herordenen en verwijderen werkt (25-08 — herordenen met omhoog/omlaag-knoppen; ontbrak eerst)
- [ ] …en overleeft opslaan — **klikronde**
- [ ] Coverfoto van een pakket verwijderen uit de galerij → pakket toont een nette lege staat
- [ ] Sweet Tables staan bovenaan `/aanbod`, taarten eronder — de focus uit de meeting klopt
- [ ] Nul pakketten actief → `/aanbod` toont een nette staat, geen kapotte pagina

## Effort-schatting

| Onderdeel | Inschatting |
|---|---|
| Schema (rijdt mee in fase 1) | 1 uur |
| Server CRUD + publieke routes | 2 uur |
| Beheerscherm pakketten | 3 uur |
| `/aanbod` herschrijven | 3 uur |
| Homepage-spotlight + seed | 2 uur |
| **Totaal** | **~1,5 dag** |

Zonder prijzen van de klant is alles bouwbaar behalve de inhoud — de pakketten staan dan op
`active: false` klaar.
