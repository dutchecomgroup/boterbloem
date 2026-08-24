# Werkblok — huidig (gestart 2026-08-24)

> **Status:** 🟢 **Fase 0 t/m 6 gebouwd en geverifieerd tegen `atelierboterbloem_dev`.**
> Wat er nog moet: de schema-migratie op live draaien, de code deployen, en de laatste
> livegang-punten (fase 7) — die wachten op materiaal van de klant.
> **Branch:** `development` — daar landt het werk; `main` blijft wat er live hoort te kunnen.
> **Bij afsluiten:** archiveren als `werkblok-v0.1.md` in `../archive/planning/` en dit bestand resetten.

---

## Waar staan we?

Alles wat de meeting van 24-08 vroeg is gebouwd, behalve de livegang zelf. Het draait op de
dev-database; live heeft de nieuwe tabellen nog niet.

| | |
|---|---|
| `npm run typecheck` | ✅ |
| `npm test` | ✅ 66 tests |
| `npm run build` | ✅ 535 kB hoofdbundel (was 1012 kB) |
| Endpoint-verificatie tegen dev | ✅ 22/22 + de nieuwe regelroutes |
| Migraties op dev | ✅ alle vier gedraaid, idempotent, app getest |
| Migraties op live | ⏳ **nog niet** |

**Sinds 25-08 loopt er een tweede blok**: de boeking zelf bruikbaar maken. Zie
[boekingen-detailsheet-en-agenda.md](2-in-uitvoering/boekingen-detailsheet-en-agenda.md) — daar
staat het plan met de wireframes en de honderd klantsituaties. Stappen 1 t/m 12 staan; de
laatste stap — de honderd scenario's volledig doorlopen — is deels gedaan.

Er zijn drie migraties bij gekomen (`boekingen`, `btw`, `regel-details`), allemaal DEV ✅ /
LIVE ⏳. Zie [../deployment/pending.md](../deployment/pending.md) voor de deployvolgorde.

---

## Beslissingen die de scope bepaalden

**📭 Mail valt volledig buiten scope (25-08).** Geen mailmodule, geen notificatie bij een
nieuwe aanvraag. Haar mail blijft Gmail op haar telefoon; het enige wat in het systeem zit is
de `mailto:`-link.

> Gevolg om te kennen: **er is geen signaal naar buiten** als er een aanvraag binnenkomt. De
> teller op het dashboard is het enige wat erop wijst. Bewuste keuze.

**🖼️ We bouwen door op demo-foto's (25-08).** Het portfolio staat er compleet, gevuld met
opvulmateriaal tot zij haar eigen foto's aanlevert.

> ⚠️ Harde grens: die stockfoto's mogen **niet mee naar de publieke live site**. Staat als
> blokkerende stap in [../deployment/testscript-master.md](../deployment/testscript-master.md) §8.8.

**🗂️ De lijst gelegenheden hoeft niet vooraf vast te staan (25-08).** Fase 2 bouwde het
categorie-beheer dat er niet was, dus ze past de startset zelf aan.

---

## Fasering — stand

| Fase | Wat | Stand |
|---|---|---|
| **0** | [Hardening](2-in-uitvoering/security-hardening.md) + [domein](3-onaangeraakt/infra-domein-livegang.md) + backups | 🟡 code af · firewall, DNS en backups open |
| **1** | Datamodel: `packages`, `gallery_albums`, `reviews` + velden | 🟡 **DEV ✅ / LIVE ⏳** |
| **2** | [Portfolio](1-klaar-voor-livegang/portfolio-categorie-albums.md): gelegenheden, albums, categorie-beheer, publieke galerij | ✅ gebouwd |
| **3** | [Pakketten & prijzen](1-klaar-voor-livegang/pakketten-en-prijzen.md): beheer-CRUD, `/aanbod` herschreven, taart-prijslijst | ✅ gebouwd |
| **4** | [Aanvraagflow](1-klaar-voor-livegang/aanvragen-formulier-uitbreiding.md): gelegenheid + pakket + levertijd-check | ✅ gebouwd |
| **5** | [Agenda](1-klaar-voor-livegang/agenda-boekingen.md): maandweergave + ICS-feed | ✅ gebouwd |
| **6** | [Reviews](1-klaar-voor-livegang/content-reviews.md) | ✅ gebouwd |
| — | [Klantenbeheer](1-klaar-voor-livegang/klanten-uitbreiding.md): ontdubbeling, detailscherm, zoeken | ✅ gebouwd |
| — | Bundel opsplitsen (uit het infra-plan) | ✅ 1012 → 535 kB |
| **7** | Livegang: demo eruit, SEO, testronde | ⏳ wacht op materiaal |

---

## Wat er nu moet gebeuren

**1. Migratie op live.** Alles staat klaar en is op dev bewezen. Volgorde: `pg_dump` →
migratie → code deployen. Nooit andersom: Drizzle neemt elk schemaveld op in de SELECT, dus
code op een oud schema breekt élke query op die tabel.

```bash
cd c:/Users/User/Documents/Projecten
scp -i keys/tcgdeckmaster_vps boterbloem/docs/deployment/sql-pending/2026-08-25-fase-1-schema.sql root@85.215.182.227:/tmp/
ssh -i keys/tcgdeckmaster_vps root@85.215.182.227 "sudo -u postgres pg_dump atelierboterbloem | gzip > ~/backups/2026-08/abb-pre-fase1.sql.gz && sudo -u postgres psql -d atelierboterbloem -f /tmp/2026-08-25-fase-1-schema.sql"
```

**2. Oude categorieën opruimen op live.** Live heeft nog de taart-typen (bruidstaarten,
cupcakes …). Na de migratie en de deploy: in het galerijscherm de nieuwe gelegenheden
aanmaken en de oude verwijderen. Ze zijn leeg, dus dat kan zonder dataverlies.

**3. Firewall.** Poort 5432 dicht. TLS beschermt de verbinding, niet de deur.

**4. Sterk wachtwoord** voor het `admin`-account op live.

---

## Wat er van de klant nodig is

Niet om te bouwen — wel om **live** te gaan. De schermen staan er; het materiaal vult ze.

| Wat | Waarvoor |
|---|---|
| Foto's per event | vervangt de demo-content |
| Vanaf-prijzen + pakketinhoud | de drie pakketten staan op inactief tot dan |
| Taart-prijslijst | staat op niet-publiek tot ze hem aanzet |
| Reviews | het blok verschijnt vanzelf zodra er één gepubliceerd is |
| Over-tekst, contactgegevens | in te vullen in het beheerscherm |
| DNS-toegang | voor het domein |

Status per item: [../klant/content-checklist.md](../klant/content-checklist.md)

---

## Volgende sessie

De migratie op live, dan deployen, dan de oude categorieën opruimen. Daarna is fase 7 aan de
beurt — en die wacht op de klant.

Losse punten: firewall, sterk admin-wachtwoord, en de dev-database verversen zodra live is
bijgewerkt (zie [../deployment/db-migraties.md](../deployment/db-migraties.md)).

---

## Waar we gebleven zijn (25-08, eind van de dag)

**Af en getest tegen dev:** boekingen met regels, totalen, tijdlijn en offerte · agenda als
werkkalender · btw in drie tarieven · publieke site opnieuw ingedeeld (homepage 9.500 → 5.173
px) · galerij herbouwd naar Categorie → Event → Foto's, met een verhaal per event en een eigen
webadres per event.

**Morgen als eerste:**

1. **De vijf migraties naar live** — allemaal DEV ✅ / LIVE ⏳. Volgorde en commando's staan in
   [../deployment/pending.md](../deployment/pending.md).
2. **De honderd scenario's afmaken** met Playwright. De gevallen die een muis en meerdere
   stappen vragen — rechtermuisklik in de agenda, slepen tussen dagen, de terugknop die een
   sheet sluit, de drukte-gevallen uit groep H — zijn nog niet doorlopen.
3. **Losse eindjes in de galerij**: `sitemap.xml` uit de database, en Open Graph per event.
   Allebei pas zinnig zodra er echte foto's staan.

**Waar we op wachten:** foto's en prijzen van de klant, DNS-toegang, en een sterk wachtwoord
voor het live `admin`-account.

---

## ✅ Afgemaakt op 25-08 (restpunten)

Bij het nalopen van de verificatielijsten bleken twee dingen **niet gebouwd** en één ding
**stuk**. Alle drie opgelost:

- 🐛 **Portretfoto op `/over` was verdwenen.** `AboutPage` vroeg om een demo-slug die niet meer
  bestond sinds de categorieën gelegenheden werden; `demoImageForSlug()` gaf stil `null`
  terug. Nu een zichtbare terugval plus een console-waarschuwing — een verkeerd beeld valt op,
  een leeg vlak niet. Bijvangst: `client/src/vite-env.d.ts` ontbrak, waardoor TypeScript
  `import.meta.env` niet kende.
- ➕ **`includes`-regels herordenen** in het pakkettenscherm. Het plan vroeg toevoegen,
  herordenen én verwijderen; alleen de eerste twee waren er. De volgorde bepaalt hoe een
  pakket op `/aanbod` leest.
- ➕ **`npm run check:demo`** — buildcontrole die demo-content in `dist/client/` vindt.
  Waarschuwt standaard, faalt met `--strict`. Hoort in de deploy-stap zodra de echte foto's
  binnen zijn.
- ⭐ **Teksten omgedraaid naar tables-eerst** — zie
  [2-in-uitvoering/content-teksten-herpositionering.md](2-in-uitvoering/content-teksten-herpositionering.md).
  Inclusief `robots.txt`, `sitemap.xml` en Open Graph-tags.

> ✅ **Besloten en doorgevoerd 25-08:** `/diensten` heet nu `/aanbod` — *"het zijn geen
> diensten"*. Aangepast in `App.tsx`, `PublicLayout`, `HomePage` en `sitemap.xml`;
> `ServicesPage.tsx` heet nu `AanbodPage.tsx`. Geen doorverwijzing nodig, de site staat nog
> niet live.

**Nog open uit de verificatielijsten:** de **klikronde** door de schermen. De API-laag is
geverifieerd, de schermen niet — dat vraagt Playwright MCP, en daarvoor moet Claude Code
herstart worden (`.mcp.json` wordt bij het opstarten ingelezen).

---

## 🖱️ Klikronde 25-08 — wat de API-tests niet vingen

Met Playwright door alle schermen gelopen. Vier dingen gevonden die typecheck, tests en
endpoint-controles alle drie hadden doorgelaten:

| Bevinding | Waarom het niet eerder opviel |
|---|---|
| 🐛 **Kop op `/over` zei twee keer "Boterbloem"** — het ontwerp zet altijd een sierlijk "Boterbloem" onder de kop, maar de kop uit de instellingen bevat dat woord al | Pure opmaak; geen enkele test kijkt naar tekst op een pagina |
| 🐛 **`vanaf € 0,00` op de publieke aanbod-pagina** — een pakket zonder prijs las als gratis | De API gaf keurig `priceFrom: "0.00"` terug; dat is geldig |
| 🐛 **Herordenen werkte alleen bij aaneengesloten waarden** — de knoppen deden `sortOrder ± 1`, terwijl de seed dubbele waarden had opgeleverd | Alleen zichtbaar met echte data waarin gaten of duplicaten zitten |
| 🎨 **Eén review stond eenzaam links** in een driekolomsraster | Werkt technisch prima |

Alle vier gerepareerd. De laatste twee zijn het leerzaamst: `sortOrder ± 1` gaat uit van een
lijst die netjes van 0 doorloopt, en dat is een aanname die na de eerste verwijdering al niet
meer klopt. Het wisselt nu met de buur in de getoonde lijst en normaliseert de nummering
onderweg.

**Bevestigd werkend:** gelegenheid aanmaken met automatische slug · herordenen · verwijderen
met bevestiging · agenda met boekingen én aanvragen (stippellijn, tijd, locatie, status-kleur)
· review als concept die **niet** in de publieke respons voorkomt · publiceren maakt hem
zichtbaar · klant zoeken · klantdetail met historie · ontdubbeling op hoofdletterongevoelig
e-mailadres · nul actieve pakketten geeft de "Binnenkort"-staat · nul reviews laat het blok
verdwijnen.

---

## Bevindingen tijdens het bouwen (24/25-08)

- 🐛 **Dashboard gaf een 500** — een `Date` in een ruwe `sql`-template in `stats.ts`. Gefixt.
- 🐛 **Adminpagina's scrollden niet** — `useLenis()` draaide ook op de admin en kaapte het
  scrollwiel, waardoor de aanvragenlijst niet scrollde. Lenis staat nu uit op `/admin/*`.
- 🐛 **Categorieën waren niet te beheren** — de routes bestonden, het scherm niet. Gebouwd in fase 2.
- 🐛 **Lege PATCH gaf overal een 500** — Zod stript een weggelaten veld stilzwijgend, waarna
  Drizzle `No values to set` gooide. Opgelost met `requireFields()` + `.strict()`.
- 🔧 **`.env` stond verkeerd** — wees naar `localhost` en `NODE_ENV=production`. Nu naar
  `atelierboterbloem_dev`, zoals het hoort.
- 🔴 **Testdata in live beland** — een verificatiesuite draaide tegen productie en overschreef
  `site_settings.contact` en `.hero`. Hersteld. De dev-database bestaat nu juist hierom; zie
  de waarschuwing in [../deployment/db-migraties.md](../deployment/db-migraties.md).
