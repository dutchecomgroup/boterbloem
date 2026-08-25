# Atelier Boterbloem — Documentatie

**Laatste update:** 25 augustus 2026 (einde dag)

> Voor AI/Claude-instructies: zie [`CLAUDE.md`](../CLAUDE.md) in de projectroot.
> Voor de dagelijkse dev-workflow: zie [workflow/werkwijze.md](workflow/werkwijze.md).

---

## 📍 Huidige ronde

**Waar staan we?** → [komende-plannen/werkblok-huidig.md](komende-plannen/werkblok-huidig.md)

Dat document is de single source of truth voor het lopende werk: de fasering, wat er als
eerste opgepakt wordt, en waar we op wachten.

**Waar komt het vandaan?** → [klant/2026-08-24-meeting-wensen.md](klant/2026-08-24-meeting-wensen.md)
— de meeting met de klant waarin de scope scherp is geworden.

---

## 🚀 Snel naar...

| Wat zoek je? | Ga naar |
|---|---|
| 📅 **Wat gaan we bouwen** — roadmap en fasering | [komende-plannen/](komende-plannen/) |
| 🗣️ **Wat wilde de klant** — meeting-verslag, content-checklist | [klant/](klant/) |
| 🏗️ **Architectuur** — hoe zit het systeem in elkaar | [architecture/](architecture/) |
| 🚢 **Naar live deployen** — stappenplan, pending, rollback, migraties | [deployment/](deployment/) |
| ✨ **Bestaande features** — implementatie-docs | [features/](features/) |
| 🛠️ **Dagelijkse dev-workflow** — commando's, gewoontes | [workflow/](workflow/) |
| 📦 **Archief** — afgeronde plannen | [archive/](archive/) |

---

## Wat is Atelier Boterbloem?

Website + mini-bedrijfssysteem voor een taartenatelier: een publieke showcase met portfolio
en prijzen, en een beheerpaneel voor boekingen, klanten, omzet en galerij.

**Hoofdfocus (besloten 24-08):** Sweet Tables & Grazing Tables. Taarten blijven in het
aanbod, maar klein en met een basis-prijslijst.

Er wordt **niet besteld** op de site — bezoekers vragen een offerte aan via het
contactformulier, waarin ze de gelegenheid en een pakket-voorkeur kunnen aangeven.

**Mail valt buiten scope** (besloten 25-08): geen mailmodule, geen notificaties. Alleen een
`mailto:`-link op de contactpagina. Zie
[architecture/platform-overview.md](architecture/platform-overview.md).

**Server:** Strato VPS `85.215.182.227`, PM2, poort **6778** — zelfde machine als
`tcgdeckmaster` en `beautystudiodynamic`.
**Domein:** `atelierboterbloem` staat bij mijndomein, nog niet gekoppeld — zie
[komende-plannen/3-onaangeraakt/infra-domein-livegang.md](komende-plannen/3-onaangeraakt/infra-domein-livegang.md).

---

## Tech stack

| Laag | Tech |
|---|---|
| Frontend | React 18 + Vite, TypeScript, Wouter, TanStack Query, React Hook Form + Zod, Tailwind |
| Animatie | Motion, Lenis (soepel scrollen — alleen op de publieke site) |
| Backend | Express 4, TypeScript, draait via `tsx` (geen aparte compileerstap) |
| Database | PostgreSQL via Drizzle ORM + `postgres-js` |
| Sessies | express-session met opslag in Postgres (connect-pg-simple), bcrypt |
| Uploads | Multer (in geheugen) + Sharp → WebP, maximaal 1600×1600 |
| Grafieken | Recharts (omzet-dashboard) |
| Tests | Vitest (`npm test`) + Playwright MCP voor screenshots |
| Proces | PM2 (`ecosystem.config.cjs`) |

Details: [architecture/tech-stack.md](architecture/tech-stack.md).

---

## Projectstructuur

**Server:** `/projects/atelierboterbloem/`

```
boterbloem/
├── client/                 # React SPA
│   └── src/
│       ├── pages/public/   # Home, Galerij, Aanbod, Over, Contact
│       ├── pages/admin/    # Dashboard, Boekingen, Aanvragen, Klanten, Producten, Galerij, Instellingen
│       ├── components/     # Layouts, ornamenten, animatie-componenten
│       ├── hooks/          # useAuth, usePublicSettings, useLenis, useReveal
│       └── lib/            # api, utils, queryClient
│
├── server/                 # Express
│   ├── routes/public.ts    # open endpoints
│   ├── routes/admin/       # achter sessie-auth
│   ├── lib/                # gedeelde helpers (requireFields)
│   ├── auth.ts             # bcrypt + requireAuth
│   ├── db.ts               # Drizzle-client (TLS afgedwongen buiten loopback)
│   └── index.ts            # opstarten, sessies, statische bestanden
│
├── shared/schema.ts        # Drizzle-tabellen + Zod-schema's + types — single source of truth
├── scripts/                # seed-admin, run-sql-migration, quick-seed, inspect-db
├── docs/                   # deze documentatie
└── uploads/                # gegenereerde WebP-bestanden (niet in git)
```

Volledig overzicht van pagina's en routes: [architecture/platform-overview.md](architecture/platform-overview.md).

---

## Dev-commando's

```bash
npm run dev          # server (6778) + client (5173) tegelijk
npm run dev:server   # alleen backend
npm run dev:client   # alleen frontend, proxyt /api en /uploads naar 6778
npm run build        # productiebundel (Vite)
npm start            # productieserver
npm run typecheck    # tsc --noEmit — het enige vangnet, de server compileert niet
npm test             # Vitest
npm run db:migrate   # .sql-migratie draaien — zie deployment/db-migraties.md
npm run seed:admin   # eenmalig: admin-account + categorieën + standaardinstellingen
npm run seed:demo    # democontent erin — zie deployment/pending.md. `-- --verwijder` haalt hem weg
npm run check:demo   # zit er nog demo-content in de gebouwde bundel?
```

---

## Database

**Eén live PostgreSQL-database** op de VPS. Geen aparte dev-database, geen demo-modus.

| | Waarde |
|---|---|
| Database | `atelierboterbloem` |
| Op de server | `localhost:5432` |
| Vanaf de laptop | `85.215.182.227:5432` — TLS verplicht |
| Schema | `shared/schema.ts` — single source of truth |

> 🔴 **Schemawijzigingen gaan via een `.sql` in [deployment/sql-pending/](deployment/sql-pending/)**,
> nooit via `db:push`. Dry run + `pg_dump` vooraf. Procedure en log:
> [deployment/db-migraties.md](deployment/db-migraties.md).

> ⚠️ **Poort 5432 staat nog publiek open.** De verbinding is sinds 25-08 versleuteld
> (`server/db.ts` dwingt TLS af buiten loopback), maar de poort zelf moet nog dicht in de
> firewall — zie
> [komende-plannen/2-in-uitvoering/security-hardening.md](komende-plannen/2-in-uitvoering/security-hardening.md).

---

## Backups

**Er draait op dit moment niets automatisch.** De commando's staan in
[deployment/procedure.md](deployment/procedure.md), maar er is geen cron. Inrichten is
onderdeel van [komende-plannen/3-onaangeraakt/infra-domein-livegang.md](komende-plannen/3-onaangeraakt/infra-domein-livegang.md)
fase B.

Wat er weg moet kunnen: de database én `uploads/` — dat zijn de foto's van de klant, en die
staan nergens anders.

---

## Omgevingsvariabelen

| Variabele | Doel |
|---|---|
| `DATABASE_URL` | PostgreSQL-verbinding. De **host** bepaalt of TLS wordt afgedwongen |
| `SESSION_SECRET` | Sessie-ondertekening — minimaal 32 tekens, app start niet zonder |
| `PORT` | Standaard 6778 |
| `NODE_ENV` | `production` zet `secure` cookies aan en serveert de gebouwde client |
| `UPLOADS_DIR` | Standaard `./uploads` |
| `MAX_UPLOAD_MB` | Standaard 10 |
| `PUBLIC_BASE_URL` | Voor absolute links — moet naar het echte domein bij livegang |

Validatie in [`server/env.ts`](../server/env.ts): een ontbrekende of foute waarde stopt de
applicatie bij het opstarten in plaats van halverwege.

> Lokaal draaien en het lukt niet? Twee klassiekers staan in
> [workflow/lokale-dev-omgeving.md](workflow/lokale-dev-omgeving.md): `DATABASE_URL` op
> `localhost` (de servervariant) en `NODE_ENV=production` (dan werkt inloggen niet over http).
