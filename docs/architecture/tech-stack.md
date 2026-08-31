# Tech stack

Alle versies uit [`package.json`](../../package.json), stand 2026-08-24. Node ≥ 20 vereist.

---

## Frontend

| Pakket | Versie | Waarvoor |
|---|---|---|
| `react` / `react-dom` | ^18.3 | |
| `vite` | ^5.4 | Dev-server (5173) en bundelen |
| `typescript` | ^5.6 | `strict: true` |
| `wouter` | ^3.3 | Routering — klein, hooks-gebaseerd |
| `@tanstack/react-query` | ^5.59 | Serverdata ophalen en cachen |
| `react-hook-form` + `@hookform/resolvers` | ^7.53 | Formulieren |
| `zod` | ^3.23 | Validatie — gedeeld met de server |
| `tailwindcss` | ^3.4 | Opmaak |
| `@radix-ui/*` | 1.x / 2.x | Toegankelijke basiscomponenten |
| `lucide-react` | ^0.451 | Iconen |
| `recharts` | ^2.13 | Omzetgrafiek |
| `motion` | ^12.40 | Animatie |
| `lenis` | ^1.3 | Soepel scrollen |
| `date-fns` | ^4.1 | Datums — ook de basis voor de agenda |

**Geen shadcn/ui.** De Radix-primitieven staan er, maar de opmaak komt uit de eigen
componentklassen in `index.css`. Zie [design-system.md](design-system.md).

---

## Backend

| Pakket | Versie | Waarvoor |
|---|---|---|
| `express` | ^4.21 | |
| `drizzle-orm` | ^0.36 | Query's, type-veilig |
| `drizzle-kit` | ^0.28 | `db:studio`; `db:push` alleen als diff-hulpmiddel, **nooit** op live |
| `postgres` | ^3.4 | Driver (`postgres-js`) |
| `drizzle-zod` | ^0.5 | Zod-schema's uit de tabellen |
| `express-session` + `connect-pg-simple` | ^1.18 / ^10 | Sessies in Postgres |
| `bcrypt` | ^5.1 | Wachtwoorden, 12 rondes |
| `multer` | ^1.4 | Uploads, in geheugen |
| `sharp` | ^0.33 | Beeldbewerking → WebP |
| `uuid` | ^10 | Bestandsnamen |
| `dotenv` | ^16.4 | `.env` |
| `tsx` | ^4.19 | TypeScript uitvoeren — **ook in productie** |

---

## Twee keuzes die opvallen

### `tsx` in productie, geen compileerstap

`npm start` en de PM2-configuratie draaien `tsx server/index.ts` rechtstreeks. `npm run build`
bouwt **alleen de client**; de server wordt nooit naar JavaScript gecompileerd.

Bewuste keuze (commit `ebf611d`, *"Use tsx in production — avoids tsc + path-alias resolution
issues"*): de `@shared/*`-aliassen uit `tsconfig.json` zijn met een aparte compileerstap
lastig werkend te krijgen op Node.

Wat het betekent: iets langere opstarttijd en meer geheugen, en **`npm run typecheck` is je
enige vangnet** — er is geen compileerstap die fouten tegenhoudt vóór de deploy. Draai hem
dus ook echt.

### Eén live database, geen dev-kopie

Er is geen aparte ontwikkeldatabase. `.env` verbindt lokaal met dezelfde database als de
productieserver, over het open internet. Zie [../README.md](../README.md#database) en de
waarschuwingen in [../workflow/lokale-dev-omgeving.md](../workflow/lokale-dev-omgeving.md).

---

## Niet aanwezig

| Wat | Stand |
|---|---|
| Tests | Geen. Geen vitest, geen playwright |
| CI | Geen. Geen GitHub Actions |
| Migratiebestanden | Sinds 25-08 handgeschreven `.sql` in `docs/deployment/sql-pending/`, met runner en dry run |
| E-mail | Geen — en **bewust geen**, besloten 25-08. Alleen een `mailto:`-link op de contactpagina |
| Foutmelding-monitoring | Geen. Alles via `console.error` naar PM2-logs |
| Snelheidsbegrenzing | Geen. Zie [../komende-plannen/2-in-uitvoering/security-hardening.md](../archive/planning/security-hardening.md) |

Bij een project van deze omvang zijn de meeste hiervan verdedigbaar. De twee die wél
aandacht verdienen: **geen migratiebestanden** (geen weg terug bij een fout schema) en **geen
snelheidsbegrenzing** (één beheerdersaccount, onbeperkt raden).

---

## Poorten

| Poort | Wat | Extern |
|---|---|---|
| 6778 | Express | ⚠️ **Open sinds 31-08** voor de besloten preview op het kale IP. Dicht zodra alles via 443 loopt — de UFW-regel draagt die reden als comment |
| 5173 | Vite dev-server | Alleen lokaal |
| 5432 | PostgreSQL | ✅ **Dicht sinds 28-08** (UFW `default deny`). Lokaal verbinden gaat via een SSH-tunnel op 15432 — zie [../workflow/lokale-dev-omgeving.md](../workflow/lokale-dev-omgeving.md) |

UFW laat verder alleen 22, 80, 443, 8443, 8880 en de mailpoorten door.
