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

### 1. `DATABASE_URL` — host verschilt per machine, en gaat sinds 28-08 door een tunnel

🔴 **Poort 5432 staat dicht** sinds de hardening van 28-08 (UFW `default deny`). Rechtstreeks
verbinden vanaf je laptop kan dus niet meer. Open eerst een SSH-tunnel en laat dat venster open
staan:

```powershell
ssh -i $env:USERPROFILE\.ssh\tcgdeckmaster_vps -N -L 15432:localhost:5432 root@85.215.182.227
```

```bash
# Op je laptop, via de tunnel:
DATABASE_URL=postgresql://abb_app:<wachtwoord>@localhost:15432/atelierboterbloem_dev

# Op de VPS:
DATABASE_URL=postgresql://abb_app:<wachtwoord>@localhost:5432/atelierboterbloem
```

Poort **15432** en niet 5433 of 5432: 5433 bleek op de laptop bezet, en 5432 zou botsen met een
eventuele lokale Postgres. `localhost` zorgt er meteen voor dat
[`server/db.ts`](../../server/db.ts) TLS overslaat, en dat klopt hier — de tunnel versleutelt al.

> ⚠️ **Zonder tunnel zie je geen foutpagina maar een lege site.** De queries falen, TanStack
> Query houdt de data op `undefined`, en de pagina toont zijn lege staat: `/aanbod` zegt dan
> "Binnenkort — we zetten de pakketten en prijzen op dit moment op een rij". Dat las als een
> contentprobleem terwijl het een verbindingsprobleem was, en heeft op 31-08 een half uur
> gekost. Zie je die tekst terwijl er zes pakketten in de database staan: kijk eerst naar de
> tunnel.

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

- **Inloggen lukt niet.** [`server/index.ts`](../../server/index.ts) zet `secure: cookieSecure`
  op de sessiecookie, en die volgt standaard `NODE_ENV`. Een `secure`-cookie wordt niet
  meegestuurd over `http://localhost`. Je logt in, krijgt geen foutmelding, en bent meteen weer
  uitgelogd. (Op de server draait sinds 31-08 `COOKIE_SECURE=false` om precies deze reden —
  daar is `NODE_ENV=production` nodig om de gebouwde site te serveren. Lokaal heb je die sleutel
  niet nodig: zet gewoon `NODE_ENV=development`.)
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
