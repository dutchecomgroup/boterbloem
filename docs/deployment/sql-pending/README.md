# SQL-migraties klaar voor live

Elke schemawijziging is een `.sql`-bestand in deze map. **Geen enkele uitzondering** — zie
[../db-migraties.md](../db-migraties.md) voor het waarom en de procedure.

## Naamgeving

`YYYY-MM-DD-<korte-omschrijving>.sql`

## Wat er in een migratiebestand hoort

1. **Een kop die uitlegt waaróm.** Niet wat de SQL doet — dat lees je eronder — maar welk
   probleem het oplost en welke afweging erachter zat. Over een half jaar is dat het enige
   wat je nog nodig hebt.
2. **Additief en idempotent** waar het kan: `ADD COLUMN IF NOT EXISTS`,
   `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`. Twee keer draaien mag geen
   schade doen.
3. **Een `🚨 vóór de code`-notitie** als het om kolommen op bestaande tabellen gaat. Drizzle
   neemt élk schemaveld op in de SELECT, dus één ontbrekende kolom breekt élke query op die
   tabel — niet alleen de nieuwe functionaliteit.

## Draaien

```powershell
# 1. Altijd eerst: kijken of het werkt zonder iets te wijzigen
npx tsx scripts/run-sql-migration.ts docs/deployment/sql-pending/<bestand>.sql --dry-run

# 2. Echt uitvoeren (vraagt om de databasenaam als bevestiging)
npx tsx scripts/run-sql-migration.ts docs/deployment/sql-pending/<bestand>.sql
```

De runner draait het bestand in **één transactie**: een fout halverwege laat niets half af.
De dry run doet precies hetzelfde en rolt aan het eind terug.

> ⚠️ **Uitzondering:** `ALTER TYPE ... ADD VALUE` (een waarde aan een enum toevoegen) kan in
> Postgres niet in een transactieblok. Zet zo'n statement in een **eigen** bestand en draai
> het met `--no-transaction`, vóór de migratie die de nieuwe waarde gebruikt.

## Na afloop

Werk [../db-migraties.md](../db-migraties.md) bij: `DEV ✅` of `LIVE ✅`. Zonder die regel
weet niemand — jijzelf over drie weken incluis — wat er al gedraaid heeft.

Een uitgevoerde migratie blijft hier staan tot hij zowel op dev als op live groen is; daarna
mag hij weg of naar het archief. De regel in `db-migraties.md` blijft altijd staan.
