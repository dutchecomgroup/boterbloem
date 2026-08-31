# Werkwijze

> Dagelijkse dev-workflow, commando-referentie en hoe je een dag afsluit.

```
💻 Lokaal ontwikkelen
    ↓ testen op localhost:5173
📤 Commit + push naar GitHub
    ↓
🚀 Deploy naar de VPS → poort 6778
```

Opzetten van je omgeving: [lokale-dev-omgeving.md](lokale-dev-omgeving.md).

---

## Branches

Op dit moment is er **één branch: `main`**. Dat is werkbaar zolang er één persoon aan
bouwt en er nog geen publiek domein aan hangt.

> **Zodra de site live staat**, is een `development`-branch aan te raden — dan is `main` wat
> op de server draait en werk je daar niet meer rechtstreeks in. Bij dutchthrifthub is dat de
> opzet: `development` lokaal, `main` op de server, en nooit rechtstreeks naar `main` pushen.

---

## Stap 1 — Ontwikkelen

```powershell
cd "C:\Users\User\Documents\Projecten\boterbloem"
git pull
npm install          # na een pull met wijzigingen in package.json
npm run dev
```

Werken op http://localhost:5173.

**Volgorde bij een nieuw veld** — schema-first, zoals vastgelegd in [`CLAUDE.md`](../../CLAUDE.md):

1. [`shared/schema.ts`](../../shared/schema.ts) — tabel + Zod-schema + type
2. `.sql` in `docs/deployment/sql-pending/` + dry run + `pg_dump`, dan draaien
3. Route in `server/routes/`
4. Frontend

---

## Stap 2 — Controleren

```powershell
npm run typecheck
npm run build
```

Allebei groen op 2026-08-24. Werken ze niet meer, dan komt dat door je eigen wijziging.

Testscript voor de functionele kant: [../deployment/testscript-master.md](../deployment/testscript-master.md).

---

## Stap 3 — Commit + push

```powershell
git status
git add .
git commit -m "feat: korte beschrijving"
git push
```

Commit-boodschappen: `feat:`, `fix:`, `chore:`, `docs:`. Gerust meerdere keren per dag —
GitHub is ook je backup.

**Check vóór je commit:** staat `.env` er niet bij? Die is gitignored, maar controleer het
als je met `git add .` werkt.

---

## Stap 4 — Deployen

Volledig stappenplan: [../deployment/procedure.md](../deployment/procedure.md).

```bash
ssh root@85.215.182.227
cd /projects/atelierboterbloem
git pull
npm ci
# schema veranderd? .sql uit docs/deployment/sql-pending/ draaien — pg_dump eerst
npm run build
pm2 reload atelierboterbloem
pm2 logs atelierboterbloem --lines 30
```

Staat er een schemawijziging bij, werk dan
[../deployment/db-migraties.md](../deployment/db-migraties.md) bij en verplaats de entry van
[../deployment/pending.md](../deployment/pending.md) naar
[../deployment/history.md](../deployment/history.md).

---

## Dagafsluiting

Aan het eind van een werkronde, in
[../komende-plannen/werkblok-huidig.md](../komende-plannen/werkblok-huidig.md):

- Wat is af, en wat staat er nog open?
- Zijn er nieuwe bevindingen die een eigen plan-document verdienen?
- Is er iets veranderd aan wat we van de klant nodig hebben? →
  [../klant/content-checklist.md](../klant/content-checklist.md)
- Klaar voor live? → entry in [../deployment/pending.md](../deployment/pending.md)

Deze aantekening kost vijf minuten en scheelt de volgende sessie een half uur uitzoeken waar
je gebleven was.

---

## Documentatie bijwerken

| Wat er gebeurt | Wat je bijwerkt |
|---|---|
| Plan opgepakt | Plan naar `komende-plannen/2-in-uitvoering/`, status in de header |
| Feature af | Entry in `deployment/pending.md`, plan naar `archive/planning/`, zo nodig doc in `features/` |
| Gedeployd | Entry van `pending.md` naar `history.md`, `db-migraties.md` bijwerken |
| Nieuwe wens van de klant | Eerst `klant/`, dan een plan-document |
| Iets ontdekt dat later weer bijt | Erbij in het betreffende doc — niet in je hoofd |
