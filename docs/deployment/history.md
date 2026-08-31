# Deploy-historie

> Log van wat er wanneer naar live is gegaan. Nieuwste bovenaan. Entry komt uit
> [pending.md](pending.md) zodra de deploy geslaagd is.

**Format per entry:**

```markdown
## YYYY-MM-DD — korte titel

**Wat:** …
**Migraties:** … (of: geen)
**Commits:** `abc1234` … `def5678`
**Bijzonderheden:** … (of: —)
```

---

## 2026-08-31 — livegang op de server: alles van 24 t/m 31 augustus naar live

**Wat:** de server draaide `main` van 29 mei met een lege database. Nu draait alles wat sinds de
meeting van 24-08 gebouwd is, op haar eigen content: 23 foto's, 5 zichtbare gelegenheden, 6
pakketten, haar teksten en de salie-huisstijl. Bereikbaar op `http://85.215.182.227:6778`.

**Migraties:** de acht uit `sql-pending/` — maar **niet stuk voor stuk gedraaid**. De database
`atelierboterbloem_dev` is in zijn geheel gedumpt en teruggezet in `atelierboterbloem`, omdat dev
het resultaat *was* van die acht en de opdracht luidde: zet er precies neer wat er lokaal draait.
Zie het kader in [db-migraties.md](db-migraties.md#log).

**Commits:** `4f3fb26` … `47830d4` (merge van `development` in `main`, twee keer)

**Bijzonderheden:**

- **Poort 6778 stond dicht.** Bij de hardening van 28-08 ging UFW op `default deny (incoming)` en
  6778 is toen nooit toegevoegd. De app draaide al 33 dagen prima; er kwam alleen niemand bij.
  Regel toegevoegd met een comment die zegt wanneer hij weer weg mag.
- **`COOKIE_SECURE=false` in `.env`.** `NODE_ENV=production` is wat de gebouwde site serveert,
  maar zet ook `secure` op de sessiecookie — en die bewaart een browser niet over gewoon `http`.
  Zonder deze sleutel kan zij niet inloggen met een kloppend wachtwoord. 🔴 **Weghalen zodra er
  HTTPS is**; tot dan reist haar wachtwoord leesbaar over de lijn.
- **`npm ci` liep vast** op een lockfile die npm 11 (laptop) schreef zonder
  `vitest/node_modules/esbuild`, terwijl npm 10 (server) die entry eist. Aangevuld door npm op de
  server en teruggezet in git: één entry erbij, geen versie gewijzigd. `npm ci` werkt nu.
- **Testdata opgeruimd:** 14 ontwikkel-boekingen, 8 testklanten en 13 aanvragen verwijderd, zodat
  zij op een leeg beheerpaneel begint. De cascade nam 12 regels, 4 betalingen en 89
  tijdlijn-gebeurtenissen mee.
- **Accounts:** `esmee.steensma` aangemaakt, het oude ontwikkelaccount `esmee` verwijderd, `admin`
  ongewijzigd. ⏳ Het admin-wachtwoord is nog het oude.
- **Backup-cron staat er nu**, elke nacht 03:20: beide databases + `uploads/`, 30 dagen bewaard.
  Eerste run met de hand gedaan en gecontroleerd (57 MB, 23 foto's in de tar).
- **`robots.txt` op `Disallow: /`** zolang dit een besloten preview is.

**Nog open:** HTTPS en een domein, de drie Unsplash-foto's bij de graze-pakketten, de prijzen,
reviews en over-tekst van de klant, en het admin-wachtwoord.

---

## Beginstand — 2026-08-24

Eerste vastlegging. Er is nog geen deploy-log bijgehouden; wat hieronder staat is de stand
zoals aangetroffen bij het opzetten van deze documentatie.

**Wat draait er:**
Publieke site (home, galerij, aanbod, over, contact) + beheerpaneel (dashboard, boekingen,
aanvragen, klanten, producten, galerij, instellingen) op de VPS `85.215.182.227`, poort 6778,
via PM2 als `atelierboterbloem`.

**Nog niet ingericht:**
- geen domein, geen HTTPS — de applicatie hangt kaal op poort 6778
- geen automatische backups

**Bewust niet:** mail, in geen enkele vorm (besloten 25-08).

**Commit-historie tot hier** (13 commits, allemaal op `main`):

| Commit | Wat |
|---|---|
| `3760d94` | chore: test push vanaf nieuwe laptop |
| `4f3fb26` | Fix ProcessStory: `useTransform`-waarden begrenzen op [0,1] |
| `3d797f6` | Fix ProcessStory: `overflow-hidden` eruit |
| `6759916` | Fase 3: editorial-uitstraling — Lenis + Motion + 9 verfijningen |
| `7d30526` | Homepage v2: spotlight, testimonials, Instagram-raster, scroll-onthullingen |
| `5d914eb` | Mobiele hero: tekst/beeld-volgorde, gecentreerde tekst |
| `7317c53` | Mobiel: responsieve typografie, kleinere ornamenten |
| `88ebb20` | Fase 2 visuele afwerking: ornamenten, demo-terugval |
| `9af0a85` | Gebouwde `dist/client` serveren in productie |
| `ebf611d` | `tsx` in productie gebruiken (voorkomt problemen met padaliassen) |
| `7b59aeb` | Hero: twee kolommen met beeldcarrousel |
| `1b10c3a` | Beheer-auth naar gebruikersnaam + één `npm run dev` |
| `1bebe2b` | Eerste opzet: showcase + beheerpaneel |

**Bekende punten bij deze stand:**
- Poort 5432 publiek open, verbinding valt stil terug op onversleuteld →
  [../komende-plannen/2-in-uitvoering/security-hardening.md](../archive/planning/security-hardening.md)
- Publieke bundel is 931 kB in één stuk (beheerpaneel laadt mee voor iedere bezoeker)
- Stockfoto's en verzonnen testimonials staan nog op de site
- Geen migratiebestanden — `db:push` ging rechtstreeks naar de live database (omgezet naar `.sql`-migraties op 25-08)
