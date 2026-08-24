# Atelier Boterbloem — Claude rules

Mini-bedrijfssysteem voor je schoonzus: publieke showcase + admin (boekingen, klanten, omzet, galerij). Draait op poort **6778** op de Strato VPS (`85.215.182.227`), zelfde server als `tcgdeckmaster` en `beautystudiodynamic`.

## 📍 Lees dit eerst

| Wat | Waar |
|---|---|
| **Waar staan we / wat gaan we bouwen** | [`docs/komende-plannen/werkblok-huidig.md`](docs/komende-plannen/werkblok-huidig.md) |
| **Wat wilde de klant** | [`docs/klant/2026-08-24-meeting-wensen.md`](docs/klant/2026-08-24-meeting-wensen.md) |
| **Documentatie-index** | [`docs/README.md`](docs/README.md) |

**Sinds de meeting van 24-08:** Sweet Tables & Grazing Tables zijn de hoofdfocus, taarten zijn een klein neven-aanbod. Portfolio gaat per **gelegenheid** (met een album-laag per event), er komen **pakketten met vanaf-prijzen**, een **agenda met ICS-feed**, en **reviews**. Werk je aan een van die onderdelen: lees eerst het bijbehorende plan-document in [`docs/komende-plannen/3-onaangeraakt/`](docs/komende-plannen/3-onaangeraakt/).

**Documentatie bijwerken hoort bij het werk.** Feature af → entry in `docs/deployment/pending.md`, plan naar `docs/archive/planning/`. Schema gewijzigd → `docs/deployment/db-migraties.md`. Zie [`docs/workflow/werkwijze.md`](docs/workflow/werkwijze.md).

## Stack

- React 18 + Vite + TypeScript + Tailwind + Wouter + TanStack Query + React Hook Form + Zod
- Express 4 + Drizzle ORM + `postgres-js` + express-session (PgStore via connect-pg-simple) + bcrypt
- Multer + Sharp voor galerij-upload (→ WebP, max 1600×1600)
- Recharts voor het omzet-dashboard

## Database

**Eén live PostgreSQL database** op de VPS (`localhost:5432` op de server, `85.215.182.227:5432` vanaf je laptop).
Geen lokale dev-DB, geen demo-mode. Schema is single source of truth in `shared/schema.ts`.

### 🔴 Schema wijzigen — NOOIT `db:push` op live

Elke schemawijziging gaat via een handgeschreven `.sql` in `docs/deployment/sql-pending/`:

1. `shared/schema.ts` aanpassen
2. `.sql`-bestand schrijven (additief + idempotent, met uitleg waaróm in de kop)
3. Regel toevoegen in `docs/deployment/db-migraties.md` met `DEV ⏳ / LIVE ⏳`
4. `npx tsx scripts/run-sql-migration.ts <bestand> --dry-run` — draait alles en rolt terug
5. `pg_dump` op de VPS
6. Echt draaien, log bijwerken naar ✅
7. **Pas dán** de code deployen die de nieuwe kolommen gebruikt

`db:push` diffed en voert zelf DDL uit: geen versiegeschiedenis, geen weg terug, en bij een
hernoeming gooit het je data weg. Er is één database en die is live. Volledige uitleg:
[`docs/deployment/db-migraties.md`](docs/deployment/db-migraties.md).

## Layout

- `client/` — React SPA, dev-server op poort 5173 (proxy naar 6778)
- `server/` — Express, mount op `/api/public/*` (open) + `/api/admin/*` (sessie-cookie)
- `shared/schema.ts` — alles wat Drizzle + Zod beide nodig hebben
- `uploads/` — gegenereerde WebP files (gitignored). In productie serveert Express deze als static of via Apache `Alias`.
- `scripts/seed-admin.ts` — eenmalig: admin user + galerij-categorieën + default site_settings

## Belangrijke regels

- **Schema-first**: nieuwe velden? Eerst `shared/schema.ts`, dan een `.sql` in `docs/deployment/sql-pending/`, dan routes + frontend. Zie de DB-sectie hierboven.
- **Geen lokale Postgres**: `.env` connect altijd direct naar de VPS.
- **Galerij-bestandsnamen** zijn UUID-gebaseerd; nooit user-input gebruiken in filenames.
- **Multer in-memory only** — Sharp streamt naar disk, dus geen tijdelijke uploads op disk.
- **Admin auth**: `requireAuth` middleware op alles onder `/api/admin/*` behalve `/auth/*`.
- **Currency** opslaan als `numeric(10,2)` (string in JS); converteer met `Number()` waar nodig.
- **Datums** voor evenementen als `date` (geen tijd), `paidAt` als `timestamp`.

## Routes

Public (geen auth):
- `GET /api/public/settings`
- `GET /api/public/gallery` + `GET /api/public/gallery/:slug`
- `POST /api/public/contact` (Zod-validated insert in `contact_requests`)

Admin (sessie vereist):
- `/api/admin/auth/{login,logout,me}` — sessie cookie `abb.sid`
- `/api/admin/orders` + `/from-contact`
- `/api/admin/customers`
- `/api/admin/products`
- `/api/admin/gallery` — POST is multipart (`files[]`, optionele `categoryId`), `/categories/*`, `/reorder`
- `/api/admin/contact-requests` — incl. `:id/status`
- `/api/admin/settings` — JSONB upserts per key (`contact`, `hero`, `about`)
- `/api/admin/stats/dashboard` — totalen + 12-maands omzet

## Deploy (VPS)

Zie [`docs/deployment/`](docs/deployment/) — procedure, pending, rollback, migratie-log. Korte versie:
1. `git pull` op `/projects/atelierboterbloem/`
2. `npm ci && npm run build`
3. Schema veranderd? `.sql` uit `docs/deployment/sql-pending/` draaien (**niet** `db:push`)
4. `pm2 reload atelierboterbloem`

## Stijl

Design tokens in `tailwind.config.ts` — cream/gold/butter/blush/burgundy/charcoal palet.
Fonts: Cormorant Garamond (display), Allura (script accent), Inter (body).
