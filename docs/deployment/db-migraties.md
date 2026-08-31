# Migratie-log

> Elke schemawijziging krijgt hier een regel, met de status op **dev** en op **live**. Dit is
> de enige plek waar terug te lezen is wat er wanneer aan de databasestructuur veranderd is.

---

## 🔴 De regel: nooit `db:push` op live

Sinds 24-08 gaat elke schemawijziging via een **handgeschreven `.sql`-bestand** in
[sql-pending/](sql-pending/), uitgevoerd met een runner. Niet meer via `drizzle-kit push`.

**Waarom:**

| `db:push` | `.sql` + runner |
|---|---|
| Diffed het schema en voert zelf DDL uit — je ziet pas achteraf wat er gebeurde | Je leest de SQL vóór hij draait |
| Geen versiegeschiedenis | Elk bestand staat in git, met uitleg waaróm |
| Geen weg terug | Dry run eerst; de echte run zit in één transactie |
| Kan bij een hernoeming een kolom **droppen en opnieuw aanmaken** — data weg | Je schrijft `RENAME COLUMN` en houdt je data |

`npm run db:push` blijft in `package.json` staan als hulpmiddel om te *zien* of schema en
database uit de pas lopen. **Nooit uitvoeren tegen de live database.**

---

## Procedure

```powershell
# 1. shared/schema.ts aanpassen
# 2. Bijpassend .sql-bestand schrijven in docs/deployment/sql-pending/
# 3. Regel toevoegen aan de tabel hieronder, met DEV ⏳ / LIVE ⏳
npx tsc --noEmit                      # moet groen zijn

# 4. Op DEV draaien (zie hieronder hoe je daarheen wijst)
npx tsx scripts/run-sql-migration.ts docs/deployment/sql-pending/<bestand>.sql
#    → daarna DEV ✅ in de tabel

# 5. Applicatie tegen dev testen — dit is de test die telt
# 6. pg_dump op de VPS
# 7. Op LIVE draaien → LIVE ✅
# 8. Pas dán de code deployen die de nieuwe kolommen gebruikt
```

**Backup vooraf, altijd:**

```bash
ssh -i keys/tcgdeckmaster_vps root@85.215.182.227
sudo -u postgres pg_dump atelierboterbloem | gzip > ~/backups/2026-08/abb-pre-$(date +%F-%H%M).sql.gz
```

> ℹ️ De SSH-sleutel voor deze server is `keys/tcgdeckmaster_vps` (dezelfde machine als
> tcgdeckmaster). De `strato-vps`-host in `~/.ssh/config` wijst naar **85.215.181.179** —
> dat is dutchthrifthub, een andere server.

---

## De dev-database

Sinds 24-08 bestaat **`atelierboterbloem_dev`** op dezelfde Postgres-server: een kopie van
live waar een migratie mag stuklopen. Elke migratie draait daar eerst.

**Er naartoe wijzen vanaf je laptop** — zet `DATABASE_URL` om zonder je `.env` aan te passen:

```powershell
$env:DATABASE_URL = (node -e "require('dotenv').config();console.log(process.env.DATABASE_URL.replace('/atelierboterbloem','/atelierboterbloem_dev'))")
npx tsx scripts/run-sql-migration.ts docs/deployment/sql-pending/<bestand>.sql
```

De runner herkent een databasenaam op `_dev` en laat de rode LIVE-waarschuwing dan weg.

**Verversen met een verse kopie van live** (live blijft ongemoeid — `pg_dump` leest alleen):

```bash
ssh -i keys/tcgdeckmaster_vps root@85.215.182.227

# 1. Verbindingen verbreken, anders weigert Postgres de DROP stil
sudo -u postgres psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='atelierboterbloem_dev' AND pid <> pg_backend_pid();"
sudo -u postgres psql -c "DROP DATABASE IF EXISTS atelierboterbloem_dev;"
sudo -u postgres psql -c "CREATE DATABASE atelierboterbloem_dev OWNER abb_app;"

# 2. VERIFIEER dat hij leeg is — moet 0 zijn. Niet 0? STOP, de DROP is mislukt.
sudo -u postgres psql -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';" -d atelierboterbloem_dev

# 3. Pas dán inladen
sudo -u postgres pg_dump atelierboterbloem | sudo -u postgres psql -d atelierboterbloem_dev
```

> ⚠️ **Nazorg na elke verversing:** een kopie van live mist alles wat nog niet live staat, dus
> elke migratie die in de tabel hieronder op `LIVE ⏳` staat moet opnieuw op dev gedraaid
> worden. Sinds 31-08 staat alles op `LIVE ✅`, dus op dit moment is er niets na te lopen —
> maar die situatie duurt precies tot de eerstvolgende schemawijziging.

> 🔴 **Test nooit tegen live.** Op 24-08 draaide een verificatiesuite tegen de live database en
> overschreef daarbij `site_settings.contact` en `.hero` met testwaarden — zichtbaar op de
> publieke site — plus acht testrijen in `contact_requests`. Er was op dat moment geen backup
> van vóór de schade, dus herstellen kon alleen op basis van de seed-waarden. De dev-database
> bestaat nu; gebruik hem.

---

## Wanneer een migratie extra aandacht vraagt

**Waarde toevoegen aan een enum.** `ALTER TYPE … ADD VALUE` kan **niet** in een
transactieblok. Eigen bestand, `--no-transaction`, en vóór de code die de waarde gebruikt.

**Kolom hernoemen.** Schrijf `ALTER TABLE … RENAME COLUMN …`. Zou je dit via `db:push` doen,
dan ziet Drizzle "kolom weg, kolom erbij" en **gooit je data weg**.

**Kolom `NOT NULL` maken op een tabel met rijen.** Eerst vullen, dan de beperking.

**Kolom op een bestaande tabel.** 🚨 Vóór de code draaien — Drizzle neemt élk schemaveld op
in de SELECT, dus één ontbrekende kolom breekt élke query op die tabel.

---

## Log

| Datum | Bestand | Wat | DEV | LIVE |
|---|---|---|---|---|
| _(begin)_ | — | Eerste schema via `db:push`: users, customers, products, orders, order_items, contact_requests, gallery_*, site_settings, sessions | n.v.t. | ✅ |
| 2026-08-24 | [`2026-08-25-fase-1-schema.sql`](sql-pending/2026-08-25-fase-1-schema.sql) | Fase 1: `packages`, `gallery_albums`, `reviews` + `album_id`, `description`/`published`, `public_visible`, `event_time`/`location`, `package_id`/`category_id` | ✅ | ✅ |
| 2026-08-24 | [`2026-08-25-boekingen.sql`](sql-pending/2026-08-25-boekingen.sql) | Boekingen: `reference`/`package_id`/`persons`/`allergies`/`theme`/`setup_time` op `orders`, nieuwe tabel `order_events`, boekingsnummers voor bestaande rijen | ✅ | ✅ |
| 2026-08-24 | [`2026-08-25-btw.sql`](sql-pending/2026-08-25-btw.sql) | Btw: `orders.vat_rate` met CHECK op geen/laag/hoog + standaardtarief in `site_settings.btw` | ✅ | ✅ |
| 2026-08-24 | [`2026-08-25-regel-details.sql`](sql-pending/2026-08-25-regel-details.sql) | `order_items.details` voor subregels; bestaande `· `-regels van € 0,00 samengevoegd tot subregels en verwijderd | ✅ | ✅ |
| 2026-08-24 | [`2026-08-25-album-blokken.sql`](sql-pending/2026-08-25-album-blokken.sql) | `gallery_albums.blocks` — tekst en foto's door elkaar per event, met CHECK dat het een array is | ✅ | ✅ |
| 2026-08-25 | [`2026-08-25-betalingen.sql`](sql-pending/2026-08-25-betalingen.sql) | Betalingen: nieuwe tabel `order_payments` (bedrag, datum, wijze, notitie) + betaalde aanbetalingen overgezet als betaalregel | ✅ | ✅ |
| 2026-08-25 | [`2026-08-25-btw-per-regel.sql`](sql-pending/2026-08-25-btw-per-regel.sql) | Btw per regel: `order_items.vat_rate`, `packages.vat_rate` + `vat_split_low`/`vat_split_high`, `products.vat_rate`, elk met een CHECK op geen/laag/hoog | ✅ | ✅ |
| 2026-08-24 | [`2026-08-24-herstel-testdata.sql`](sql-pending/2026-08-24-herstel-testdata.sql) | Herstel: `contact`/`hero` terug naar seed-waarden + 8 testrijen uit `contact_requests` | n.v.t. | ✅ |
| 2026-08-27 | [`2026-08-27-categorie-omslagfoto.sql`](sql-pending/2026-08-27-categorie-omslagfoto.sql) | `gallery_categories.cover_item_id` — een gelegenheid wijst zelf haar omslagfoto aan, nu foto's zonder event eronder hangen | ✅ | ✅ |

> **Volgorde op live:** fase 1 → boekingen → btw → regel-details → album-blokken → betalingen →
> btw-per-regel → categorie-omslagfoto. `boekingen.sql` legt een foreign key naar `packages`, en
> die tabel komt uit fase 1; de andere raken `orders` en `order_items` die dan al de nieuwe
> kolommen hebben. `categorie-omslagfoto` staat los van de rest en mag als laatste.

> 🔴 **Hoe deze acht op live zijn geland (31-08): niet stuk voor stuk.** Bij de livegang is de
> hele database `atelierboterbloem_dev` gedumpt en teruggezet in `atelierboterbloem`
> (`DROP SCHEMA public CASCADE` → `pg_dump | psql`). Dev *was* het resultaat van deze acht
> migraties, dus live heeft nu exact dat schema — geverifieerd: 15 tabellen, eigenaar `abb_app`.
>
> Waarom zo: live had 0 foto's en alleen mei-testdata, en de vraag was "zet er precies neer wat
> er lokaal draait". Een kopie geeft dat; acht migraties achter elkaar geven een reconstructie
> die er *bijna* gelijk aan is. Wat er bij de kopie verdween — 2 klanten, 2 boekingen, 1
> aanvraag uit mei — staat in `~/backups/boterbloem/atelierboterbloem-voor-livegang.sql.gz`.
>
> **Gevolg voor de volgende keer:** de bestanden in `sql-pending/` zijn hiermee uitgewerkt en
> horen naar de historie. Een volgende schemawijziging volgt weer gewoon de normale weg — dev,
> dry run, `pg_dump`, live. Dit was een eenmalige inhaalslag, geen nieuwe werkwijze.

> ⚠️ **`btw-per-regel` stond hier niet in** tot 27-08, terwijl hij wél op dev gedraaid was. Het
> bestand bestond, de regel ontbrak — precies het gat dat deze tabel hoort te dichten. Alsnog
> toegevoegd; de volgorde hierboven is bijgewerkt.

### 2026-08-24 — fase 1

**Status: DEV ✅ — gedraaid en volledig geverifieerd. LIVE ✅ 31-08** (via de kopie van dev, zie het kader bij het log).

Op `atelierboterbloem_dev` uitgevoerd en gecontroleerd:

- 3 nieuwe tabellen, 8 nieuwe kolommen, types en nullability zoals bedoeld
- foreign keys met de juiste delete-regel: `CASCADE` op album→categorie, `SET NULL` op de rest
- bestaande data ongemoeid — rij-voor-rij gelijk aan live
- **idempotent**: tweede run sloeg elk statement netjes over
- **applicatie getest tegen het nieuwe schema: 12/12 endpoints 200**, inclusief elke tabel die
  kolommen erbij kreeg. Dat is de test die telt — Drizzle neemt elk schemaveld op in de
  SELECT, dus één verschil breekt élke query op die tabel.
- `npm run typecheck` en `npm test` groen tegen dev

Alles in dit bestand is **additief en idempotent**: geen kolom verdwijnt, niets wordt
hernoemd, geen enum krijgt een waarde.

**Voor live nog nodig:** `pg_dump`, dan de migratie draaien, dan pas de code deployen die de
nieuwe kolommen gebruikt.

Overzicht per tabel: [../architecture/datamodel.md](../architecture/datamodel.md).

### 2026-08-24 — boekingen

**Status: DEV ✅ — gedraaid en geverifieerd. LIVE ✅ 31-08** (via de kopie van dev, zie het kader bij het log).

Op `atelierboterbloem_dev` uitgevoerd en gecontroleerd:

- 6 nieuwe kolommen op `orders`, 1 nieuwe tabel `order_events` met een index op
  `(order_id, at)`
- **elke bestaande boeking kreeg een uniek boekingsnummer**, `ABB-2026-001` t/m `ABB-2026-006`,
  oplopend op volgorde van aanmaak
- **elke bestaande boeking kreeg één `aangemaakt`-gebeurtenis** met de oorspronkelijke
  `created_at` als tijdstip, zodat de tijdlijn bij oude boekingen niet leeg oogt
- **idempotent**: de tweede run sloeg 9 statements over en hernummerde niets — de
  `UPDATE` raakt alleen rijen waar `reference IS NULL`
- de afsluitende controle in het bestand gooit een fout als er nog een boeking zonder nummer of
  zonder tijdlijnbegin over is; die kwam schoon door

**Nummering leidt af uit het hoogste bestaande nummer**, niet uit `count(*)`. Een verwijderde
boeking laat zijn nummer daarmee niet hergebruiken — dat nummer staat al op een offerte bij een
klant.

### 2026-08-25 — btw per regel, per pakket en per product

**Status: DEV ✅ — gedraaid en geverifieerd. LIVE ✅ 31-08** (via de kopie van dev, zie het kader bij het log).

Aanleiding: het model van `2026-08-25-btw.sql` legde het tarief op de **boeking**, en dat is te
grof. Eén offerte kan twee tarieven bevatten — een grazing table valt onder 9% (eten en drinken),
de styling, het glaswerk en de opbouw ernaast onder 21%. De Belastingdienst staat niet toe dat
het 21%-deel meelift op het lage tarief; bij één prijs naar de klant hoort het bedrag aan de
achterkant gesplitst te worden volgens de marktwaarde.

Wat erbij kwam:

- `order_items.vat_rate` — het tarief hoort bij het **bedrag**, en het bedrag staat op de regel
- `packages.vat_rate` — één tarief, voor een pakket dat één prestatie is
- `packages.vat_split_low` / `vat_split_high` — de verdeling voor een pakket dat allebei bevat.
  **Per eenheid**, net als `price_from`: bij € 25,00 p.p. is dat € 22,00 eten en € 3,00 servies,
  en het aantal gasten op de regel doet de vermenigvuldiging
- `products.vat_rate` — de taart-prijslijst. Geen verdeling: een taart is één ding

Alle vier met een `CHECK` op de toegestane waarden, plus een controle dat een deelprijs niet
negatief is. Zonder die controles laat `varchar` gewoon `'hoogg'` toe, en dat merk je pas als er
een offerte uitrolt met een leeg btw-blok.

Additief en idempotent: geen kolom verdwijnt, geen bedrag wordt herrekend. `line_total` en
`total_price` blijven precies zoals ze waren — alleen de uitsplitsing op de offerte verandert.

`orders.vat_rate` blijft staan maar wordt niet meer uitgelezen; de bedrijfsbrede standaard in
`site_settings.btw` evenmin. Die twee concurreerden met het pakket om dezelfde vraag, waardoor
niet meer af te lezen was welk antwoord wint.

### 2026-08-24 — herstel testdata

Geen schemawijziging; een datacorrectie. Zie de rode waarschuwing hierboven bij *De
dev-database* voor wat er misging.

### 2026-08-25 — betalingen

**Status: DEV ✅ — gedraaid en geverifieerd. LIVE ✅ 31-08** (via de kopie van dev, zie het kader bij het log).

Aanleiding: `orders.paid_at` werd door de hele codebase alleen **gelezen** en nooit geschreven,
terwijl de omzettegels erop filterden. Die stonden daardoor structureel op € 0,00. En er was geen
veld om vast te leggen dat een boeking volledig betaald was — het model kende alleen een
afgesproken aanbetaling en een vinkje of díe binnen was.

Op `atelierboterbloem_dev` uitgevoerd en gecontroleerd:

- tabel `order_payments` met twee indexen en een CHECK op `method`
- **idempotent**: de tweede run sloeg tabel en indexen over en zette geen tweede betaalregel neer
- **betaalde aanbetalingen overgezet**: ABB-2026-007 kreeg zijn € 125,00 als betaalregel, met
  `orders.created_at` als datum. Niet vandaag — dan zou een oude betaling in de huidige maand
  opduiken en de cijfers vervuilen
- de afsluitende controle in het bestand gooit een fout als er een betaalde aanbetaling zonder
  betaalregel overblijft; die kwam schoon door
- endpoint-controle tegen dev: `/api/admin/omzet` over 2026 geeft € 770,00 over 3 afgeleverde
  boekingen, met € 475,00 in augustus en € 295,00 in september
- `npm run typecheck`, `npm test` (96) en `npm run build` groen tegen dev

**`deposit_paid` en `paid_at` blijven staan** maar worden niet meer gelezen. De migratie is
additief; ze weghalen hoort een eigen migratie te zijn, na een ronde waarin niets ze mist.
