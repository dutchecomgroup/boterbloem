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
> worden.

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
| 2026-08-24 | [`2026-08-25-fase-1-schema.sql`](sql-pending/2026-08-25-fase-1-schema.sql) | Fase 1: `packages`, `gallery_albums`, `reviews` + `album_id`, `description`/`published`, `public_visible`, `event_time`/`location`, `package_id`/`category_id` | ✅ | ⏳ |
| 2026-08-24 | [`2026-08-25-boekingen.sql`](sql-pending/2026-08-25-boekingen.sql) | Boekingen: `reference`/`package_id`/`persons`/`allergies`/`theme`/`setup_time` op `orders`, nieuwe tabel `order_events`, boekingsnummers voor bestaande rijen | ✅ | ⏳ |
| 2026-08-24 | [`2026-08-25-btw.sql`](sql-pending/2026-08-25-btw.sql) | Btw: `orders.vat_rate` met CHECK op geen/laag/hoog + standaardtarief in `site_settings.btw` | ✅ | ⏳ |
| 2026-08-24 | [`2026-08-25-regel-details.sql`](sql-pending/2026-08-25-regel-details.sql) | `order_items.details` voor subregels; bestaande `· `-regels van € 0,00 samengevoegd tot subregels en verwijderd | ✅ | ⏳ |
| 2026-08-24 | [`2026-08-25-album-blokken.sql`](sql-pending/2026-08-25-album-blokken.sql) | `gallery_albums.blocks` — tekst en foto's door elkaar per event, met CHECK dat het een array is | ✅ | ⏳ |
| 2026-08-24 | [`2026-08-24-herstel-testdata.sql`](sql-pending/2026-08-24-herstel-testdata.sql) | Herstel: `contact`/`hero` terug naar seed-waarden + 8 testrijen uit `contact_requests` | n.v.t. | ⏳ |

> **Volgorde op live:** fase 1 → boekingen → btw → regel-details → album-blokken. `boekingen.sql` legt een
> foreign key naar `packages`, en die tabel komt uit fase 1; de andere twee raken `orders` en
> `order_items` die dan al de nieuwe kolommen hebben.

### 2026-08-24 — fase 1

**Status: DEV ✅ — gedraaid en volledig geverifieerd. LIVE ⏳.**

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

**Status: DEV ✅ — gedraaid en geverifieerd. LIVE ⏳.**

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

### 2026-08-24 — herstel testdata

Geen schemawijziging; een datacorrectie. Zie de rode waarschuwing hierboven bij *De
dev-database* voor wat er misging.
