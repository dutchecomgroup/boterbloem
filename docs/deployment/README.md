# Deployment

Alles wat met live gaan te maken heeft staat in deze map. Dit is de enige plek waar je hoeft
te kijken als je naar productie gaat.

## Snel naar...

| Wat | Bestand |
|---|---|
| 🚀 **Hoe deploy ik?** | [procedure.md](procedure.md) |
| 📋 **Wat staat er klaar voor live?** | [pending.md](pending.md) |
| 🧪 **Wat moet ik testen vóór de deploy?** | [testscript-master.md](testscript-master.md) |
| 📚 **Welke deploys zijn al gedaan?** | [history.md](history.md) |
| 🔄 **Hoe draai ik terug?** | [rollback.md](rollback.md) |
| 🗄️ **Migratie-log + procedure** | [db-migraties.md](db-migraties.md) |
| 📁 **SQL klaar voor live** | [sql-pending/](sql-pending/) |
| 🌐 **Domein en reverse proxy** | [infra/domein.md](infra/domein.md) |
| 🖼️ **Foto's veiligstellen + backup-cron** | [thuis-fotos-en-backup.md](thuis-fotos-en-backup.md) |

## Standaard deploy-flow

```
1. Lees pending.md → wat ga je deployen?
2. Loop testscript-master.md door → is het klaar?
3. Backup: pg_dump + uploads
4. Volg procedure.md
5. Schema veranderd? .sql uit sql-pending/ draaien, daarna db-migraties.md bijwerken
6. Verplaats de entry van pending.md → history.md
7. Bij problemen: rollback.md
```

## Belangrijke regels

- **NOOIT** `npm run db:push` tegen de live database — schemawijzigingen gaan via een `.sql` in [sql-pending/](sql-pending/)
- **ALTIJD** een dry run én een `pg_dump` vóór een migratie — er is één database en die is live
- **ALTIJD** `db-migraties.md` bijwerken na een schemawijziging
- **ALTIJD** `npm run typecheck` lokaal draaien — de server compileert niet, dus dit is het enige vangnet
- **NOOIT** database-inloggegevens in een chat, transcript of issue plakken
- **NOOIT** met de hand tabellen aanpassen op de server — altijd via een `.sql` die in git staat

## Huidige stand

De applicatie draait op de VPS op poort 6778, **nog niet achter een domein en zonder
HTTPS**. Inrichten daarvan is
[../komende-plannen/3-onaangeraakt/infra-domein-livegang.md](../komende-plannen/3-onaangeraakt/infra-domein-livegang.md).

Er draait **geen automatische backup** — het script en de cron staan klaar in
[thuis-fotos-en-backup.md](thuis-fotos-en-backup.md) stap 3, maar zijn nog niet ingericht. Zie ook
[rollback.md](rollback.md).

🔴 **De foto's van de klant staan op één machine** (de pc thuis): de servermap `uploads/` is leeg
en `uploads/` is gitignored. Stap 1 van datzelfde document haalt dat risico weg.

---

Voor algemene projectcontext: [../README.md](../README.md). Voor de dagelijkse dev-workflow
(niet deployen): [../workflow/](../workflow/).
