# Datamodel

Alles staat in [`shared/schema.ts`](../../shared/schema.ts) — Drizzle-tabellen, Zod-schema's
en TypeScript-types in één bestand. Dat is de **single source of truth**: nieuw veld? Eerst
daar, dan een `.sql`-migratie, dan de route, dan de frontend.
Zie [../deployment/db-migraties.md](../deployment/db-migraties.md) — **nooit** `db:push` op live.

---

## Huidige tabellen

### `sessions`
Beheerd door connect-pg-simple. `sid` (pk), `sess` (jsonb), `expire` (met index). Zelf niet
aanraken.

### `users`
Beheerders. `username` (uniek, kleine letters), `passwordHash` (bcrypt, 12 rondes), `name`,
`role` (standaard `admin`).

### `customers`
`name` (verplicht), `email`, `phone`, `address`, `notes`, tijdstempels.

### `products`
Taart- en dienstaanbod. `slug` (uniek), `name`, `category` (enum), `description`,
`basePrice` numeric(10,2), `unit`, `active`, `sortOrder`.

> Nog **niet publiek ontsloten** — er is geen `GET /api/public/products`. Wordt de
> taart-prijslijst; zie
> [../komende-plannen/1-klaar-voor-livegang/pakketten-en-prijzen.md](../komende-plannen/1-klaar-voor-livegang/pakketten-en-prijzen.md).

### `orders` + `order_items`
Boekingen. `customerId` (→ customers, `set null`), `eventDate` (**date**, zonder tijd),
`deliveryType` (enum), `status` (enum), `totalPrice`, `depositAmount`, `depositPaid`,
`paidAt` (**timestamp**), `notes`. Regels in `order_items` met `orderId` (cascade),
`productId` (`set null`), `description`, `quantity`, `unitPrice`, `lineTotal`, `sortOrder`.

Index op `status` en `eventDate`.

### `contact_requests`
Binnengekomen aanvragen. `name`, `email`, `phone`, `eventDate`, `eventType` (vrij tekstveld),
`persons`, `message`, `status` (enum), `convertedOrderId` (→ orders).

### `gallery_categories` + `gallery_items`
Categorie met `slug` (uniek), `name`, `sortOrder`. Foto met `categoryId` (`set null`),
`filename` (UUID-gebaseerd), `altText`, `caption`, `width`, `height`, `featured`,
`sortOrder`, `source`.

> Categorieën zijn nu ingedeeld op **taart-type**. Ze worden **gelegenheden**, met een
> album-laag ertussen; zie
> [../komende-plannen/1-klaar-voor-livegang/portfolio-categorie-albums.md](../komende-plannen/1-klaar-voor-livegang/portfolio-categorie-albums.md).

### `site_settings`
Sleutel-waarde met jsonb. Sleutels: `contact`, `hero`, `about`. Nieuwe instellingen kunnen
hier bij **zonder schemawijziging** — handig, maar het betekent ook dat er niets valideert
wat je erin zet. Zie
[../komende-plannen/2-in-uitvoering/security-hardening.md](../komende-plannen/2-in-uitvoering/security-hardening.md)
bevinding 3.

---

## Enums

| Enum | Waarden |
|---|---|
| `order_status` | aanvraag · bevestigd · in_productie · klaar · afgeleverd · geannuleerd |
| `contact_status` | nieuw · gelezen · opgevolgd · omgezet_naar_order |
| `product_category` | bruidstaart · verjaardag · mini_desserts · cupcakes · taart_los · overig |
| `delivery_type` | afhalen · bezorgen · ter_plaatse |

> ⚠️ Een waarde toevoegen aan een bestaande enum kan in Postgres **niet binnen een
> transactieblok** (`ALTER TYPE … ADD VALUE`). Dat moet los, vóór de code die hem gebruikt.
> Zie [../deployment/db-migraties.md](../deployment/db-migraties.md).

---

## Conventies

**Geld** als `numeric(10,2)` — in JavaScript is dat een **string**. Converteer met `Number()`
waar je rekent, en gebruik `formatCurrency()` uit
[`client/src/lib/utils.ts`](../../client/src/lib/utils.ts) om te tonen. Nooit als `float`
opslaan.

**Datums**: een evenement is een `date` (zonder tijd), een betaalmoment een `timestamp`. Komt
er een tijd bij een evenement, dan in een eigen `time`-kolom — zie
[../komende-plannen/1-klaar-voor-livegang/agenda-boekingen.md](../komende-plannen/1-klaar-voor-livegang/agenda-boekingen.md).

**Verwijderen**: `set null` waar het record zelfstandig betekenis houdt (een boeking zonder
klant blijft een boeking), `cascade` waar het dat niet doet (regels zonder boeking zijn
zinloos).

**Zod** komt uit `createInsertSchema` met de gegenereerde velden eruit ge-`omit`. Overschrijf
per veld waar de databaseregel niet streng genoeg is — zoals bij e-mail en de minimumlengte
van een bericht in `insertContactRequestSchema`.

---

## Wat erbij komt in fase 1

Alle schemawijzigingen uit de meeting van 24-08 gaan in **één** migratie:
[`2026-08-25-fase-1-schema.sql`](../deployment/sql-pending/2026-08-25-fase-1-schema.sql).
Additief en idempotent; dry run tegen live geslaagd op 25-08. Hier het overzicht:

| Tabel | Wijziging | Plan |
|---|---|---|
| `packages` | **nieuw** — pakketten met vanaf-prijs, personen-bereik, "wat zit erin" | [pakketten-en-prijzen](../komende-plannen/1-klaar-voor-livegang/pakketten-en-prijzen.md) |
| `packages` | `vatRate`, `vatSplitLow`, `vatSplitHigh` — één tarief, of een verdeling per eenheid tussen eten (9%) en styling (21%) | btw-per-regel |
| `order_items` | `vatRate` — het tarief hoort bij het bedrag, en dat staat op de regel | btw-per-regel |
| `gallery_albums` | **nieuw** — event-laag tussen categorie en foto | [portfolio-categorie-albums](../komende-plannen/1-klaar-voor-livegang/portfolio-categorie-albums.md) |
| `reviews` | **nieuw** — echte reviews met publicatie-schakelaar | [content-reviews](../komende-plannen/1-klaar-voor-livegang/content-reviews.md) |
| `gallery_items` | `albumId` | portfolio |
| `gallery_categories` | `description`, `published` | portfolio |
| `products` | `publicVisible`, `vatRate` | pakketten · btw-per-regel |
| `orders` | `eventTime`, `location` | [agenda-boekingen](../komende-plannen/1-klaar-voor-livegang/agenda-boekingen.md) |
| `contact_requests` | `packageId`, `categoryId` | [aanvragen-formulier-uitbreiding](../komende-plannen/1-klaar-voor-livegang/aanvragen-formulier-uitbreiding.md) |
| `site_settings` | sleutel `levertijden` — **geen** schemawijziging (jsonb) | agenda |
