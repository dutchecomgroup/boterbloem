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
  [../komende-plannen/2-in-uitvoering/security-hardening.md](../komende-plannen/2-in-uitvoering/security-hardening.md)
- Publieke bundel is 931 kB in één stuk (beheerpaneel laadt mee voor iedere bezoeker)
- Stockfoto's en verzonnen testimonials staan nog op de site
- Geen migratiebestanden — `db:push` ging rechtstreeks naar de live database (omgezet naar `.sql`-migraties op 25-08)
