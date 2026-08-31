# Atelier Boterbloem

Website + mini-bedrijfssysteem voor Atelier Boterbloem (handgemaakte taarten en desserts).

Publieke showcase + admin panel met boekingen, klanten, omzet-tracking en galerij.

📚 **Alle documentatie staat in [docs/](docs/)** — begin bij [docs/README.md](docs/README.md).
Waar we mee bezig zijn: [docs/komende-plannen/werkblok-huidig.md](docs/komende-plannen/werkblok-huidig.md).

## Stack

React · Vite · TypeScript · Tailwind · Express · Drizzle ORM · PostgreSQL · PM2

## Quickstart (lokaal)

```bash
cp .env.example .env
# Vul DATABASE_URL in (live VPS Postgres) en SESSION_SECRET
npm install
# schema-migraties: zie docs/deployment/db-migraties.md
npm run seed:admin       # eenmalig admin + defaults
npm run dev              # backend op :6778
npm run dev:client       # frontend op :5173 (proxy naar :6778)
```

In productie serveert Express ook de gebuildte client (één poort: 6778):

```bash
npm run build
npm start                # of via PM2
```

## Deploy naar VPS (Strato `85.215.182.227`)

Zie [docs/deployment/procedure.md](docs/deployment/procedure.md) voor de volledige procedure.
