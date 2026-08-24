# Lokale dev-omgeving

Hoe je het project op je eigen machine draait, en de valkuilen die het al een keer hebben
laten struikelen.

---

## Opstarten

```powershell
cd "C:\Users\User\Documents\Projecten\boterbloem"
npm install
npm run dev
```

`npm run dev` start twee processen tegelijk:

| Proces | Poort | Wat |
|---|---|---|
| `server` | 6778 | Express + API |
| `client` | 5173 | Vite dev-server met hot reload |

**Werk op http://localhost:5173.** Vite proxyt `/api` en `/uploads` door naar 6778, dus
je krijgt hot reload én echte data. Zie [`vite.config.ts`](../../vite.config.ts).

Beheerpaneel: http://localhost:5173/admin/login

---

## `.env` — twee dingen die fout gaan

`.env` staat niet in git (terecht), dus elke machine heeft een eigen exemplaar. Twee
waarden verschillen tussen je laptop en de server, en allebei geven een foutmelding die
niet vertelt wat er echt aan de hand is.

### 1. `DATABASE_URL` — host verschilt per machine

```bash
# Op je laptop:
DATABASE_URL=postgresql://abb_app:<wachtwoord>@85.215.182.227:5432/atelierboterbloem

# Op de VPS:
DATABASE_URL=postgresql://abb_app:<wachtwoord>@localhost:5432/atelierboterbloem
```

Staat `localhost` in je lokale `.env`, dan praat de applicatie tegen een Postgres op je
eigen machine. Als je die hebt draaien krijg je:

```
PostgresError: password authentication failed for user "abb_app"  (code 28P01)
```

Dat leest als "verkeerd wachtwoord", maar het is "verkeerde server". Heb je lokaal geen
Postgres, dan krijg je `ECONNREFUSED` — duidelijker, maar met dezelfde oorzaak.

> Er is bewust **geen lokale dev-database**: er is één live database en `.env` verbindt daar
> altijd direct mee. Zie [../README.md](../README.md#database).

### 2. `NODE_ENV` — moet lokaal op `development`

```bash
NODE_ENV=development
```

Staat er `production` in je lokale `.env`, dan gebeuren er drie dingen die je niet wil:

- **Inloggen lukt niet.** [`server/index.ts`](../../server/index.ts) zet `secure: isProd` op
  de sessiecookie, en een `secure`-cookie wordt niet meegestuurd over `http://localhost`. Je
  logt in, krijgt geen foutmelding, en bent meteen weer uitgelogd.
- **Express serveert `dist/client`** in plaats van door te laten naar Vite — je ziet een
  oude gebouwde versie zonder hot reload.
- **De databaseverbinding zet SSL uit** (`ssl: isProd ? false : "prefer"` in
  [`server/db.ts`](../../server/db.ts)), terwijl je juist vanaf de laptop over het open
  internet verbindt.

---

## Database-inloggegevens

Het wachtwoord van `abb_app` staat in `.env` en nergens anders in de repo. Kwijt? Dan van de
VPS halen: `/projects/atelierboterbloem/.env`.

> 🔴 **Plak database-inloggegevens nooit in een chat, transcript of issue.** Poort 5432 staat
> op dit moment publiek open — zie
> [../komende-plannen/2-in-uitvoering/security-hardening.md](../komende-plannen/2-in-uitvoering/security-hardening.md).
> Gebeurt het toch: wachtwoord meteen roteren.

---

## Beheerdersaccount

Aanmaken of wachtwoord resetten:

```powershell
npm run seed:admin
```

Vraagt om gebruikersnaam, naam en wachtwoord (minimaal 10 tekens). Bestaat de gebruikersnaam
al, dan wordt het wachtwoord bijgewerkt. Draait ook niet-interactief via `ADMIN_USERNAME`,
`ADMIN_NAME` en `ADMIN_PASSWORD`.

Ditzelfde script zet ook de galerij-categorieën, standaardproducten en site-instellingen
klaar als die er nog niet zijn — veilig om opnieuw te draaien.

---

## Controles vóór je commit

```powershell
npm run typecheck    # tsc --noEmit
npm run build        # moet slagen
```

Beide waren groen op 2026-08-24. Loopt er iets stuk, dan is dat door jouw wijziging gekomen.

---

## Schema wijzigen

Schemawijzigingen gaan via een handgeschreven `.sql` in `docs/deployment/sql-pending/`,
**nooit** via `db:push`.

```powershell
# 1. Dry run — draait alles en rolt terug, wijzigt niets
npx tsx scripts/run-sql-migration.ts docs/deployment/sql-pending/<bestand>.sql --dry-run

# 2. pg_dump op de VPS, daarna echt draaien
npx tsx scripts/run-sql-migration.ts docs/deployment/sql-pending/<bestand>.sql
```

> ⚠️ **Er is één database en die is live.** De runner toont een rode waarschuwing en vraagt
> je de databasenaam te typen voordat hij iets doet. Volledige procedure:
> [../deployment/db-migraties.md](../deployment/db-migraties.md).

Volgorde bij een nieuw veld: eerst [`shared/schema.ts`](../../shared/schema.ts), dan de
`.sql`, dan de routes, dan de frontend. Het schema is de single source of truth.

---

## Handige scripts

| Script | Wat |
|---|---|
| `npx tsx scripts/inspect-db.ts` | tabellen en rijaantallen bekijken |
| `npx tsx scripts/quick-seed.ts` | testdata erin zetten |
| `npm run db:studio` | Drizzle Studio — database in de browser |

> `quick-seed` schrijft naar de **live** database. Alleen gebruiken zolang er nog geen echte
> klantgegevens in staan.
