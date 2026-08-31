# Pending — klaar voor live

> Wat staat er klaar om naar live te gaan? Na de deploy: entry verplaatsen naar
> [history.md](history.md).
>
> **Bij het deployen:** [procedure.md](procedure.md) als stappenplan, [rollback.md](rollback.md)
> als het misgaat, [db-migraties.md](db-migraties.md) bijwerken na de migratie.
>
> 📍 Groter plaatje: [../komende-plannen/werkblok-huidig.md](../komende-plannen/werkblok-huidig.md)

---

## Er staat niets klaar

Alles wat hier stond is op **31-08 gedeployd**. De acht migraties, de content van de klant, de
pakketten, de omzetpagina, het ontwerp — het draait op `http://85.215.182.227:6778`. Volledige
verantwoording in [history.md](history.md#2026-08-31--livegang-op-de-server-alles-van-24-tm-31-augustus-naar-live).

De bestanden in [sql-pending/](sql-pending/) zijn daarmee **uitgewerkt**. Ze zijn niet stuk voor
stuk gedraaid maar meegekomen met een kopie van de dev-database; het kader in
[db-migraties.md](db-migraties.md#log) legt uit waarom en wat dat betekent. Laat ze staan als
naslag — een volgende schemawijziging krijgt weer een eigen bestand en volgt de normale weg.

---

## Wat er open blijft staan

Niet gedeployd, want het is nog niet gebouwd of het wacht op iemand anders.

| Wat | Waarop het wacht |
|---|---|
| 🔴 **HTTPS en een domein** | DNS-toegang van de klant. Zolang dat er niet is, draait de site op `http://` en gaat haar wachtwoord leesbaar over de lijn — zie `COOKIE_SECURE` hieronder |
| 🔴 **`COOKIE_SECURE=false` weghalen** uit `.env` op de server | het certificaat. Deze sleutel bestaat alleen omdat een `secure`-cookie niet over gewoon http bewaard wordt |
| 🔴 **UFW-regel op 6778 sluiten** | dezelfde reverse proxy. Dan loopt alles via 443 en is die losse deur overbodig |
| 🔴 **Drie Unsplash-foto's** bij de graze-pakketten | eigen foto's van een grazing table. Weg met `npx tsx scripts/seed-demo-grazefotos.ts --verwijder` |
| 🟠 **Sterk wachtwoord voor `admin`** | niets — dit kan meteen: `ADMIN_USERNAME=admin ADMIN_PASSWORD=… npm run seed:admin` |
| 🟠 **`robots.txt` terug op `Allow: /`** | de echte livegang. Staat nu op `Disallow: /` |
| 🟡 **Prijzen, reviews, over-tekst, contactgegevens** | de klant. Zij vult ze zelf in; zie [../klant/content-invulplan.md](../klant/content-invulplan.md) §7 |
| 🟡 **Klikronde op 375 / 768 / 1440** | niets — stap 13 van het boekingenplan |

---

## Deployvolgorde — voor de volgende keer

**Migratie eerst, dan pas de code.** Drizzle neemt élk schemaveld op in de SELECT, dus zodra
`shared/schema.ts` een kolom kent die de database niet heeft, breekt **elke** query op die
tabel — niet alleen de nieuwe functionaliteit. Andersom is veilig: de database mag kolommen
hebben die de code nog niet gebruikt.

```
1. pg_dump (of vertrouw op de nachtelijke cron van 03:20)
2. .sql uit sql-pending/ draaien -- eerst --dry-run
3. db-migraties.md bijwerken naar LIVE ✅
4. git pull && npm ci && npm run build && pm2 reload atelierboterbloem
5. testscript-master.md doorlopen
```
