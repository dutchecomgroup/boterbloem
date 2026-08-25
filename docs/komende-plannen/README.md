# Komende plannen

Plannen voor werk dat op het programma staat maar nog niet is opgepakt. Hier landen ze zodra
ze uitgewerkt zijn en wachten op een werkronde.

---

## ⭐ Huidige ronde

→ **[werkblok-huidig.md](werkblok-huidig.md)** — de fasering, wat er als eerste opgepakt
wordt, en waar we op wachten. Dit is de single source of truth voor het lopende werk.

---

## Naming-conventie

Format: `{thema}-{onderwerp}.md` — kebab-case, Nederlands, geen fases of versies in de naam.

| Prefix | Thema |
|---|---|
| 🖼️ `portfolio-` | Galerij, categorieën, albums |
| 🍰 `pakketten-` | Pakketten, prijslijst, taart-aanbod |
| 📅 `agenda-` | Agenda, boekingen, levertijden |
| 📨 `aanvragen-` | Contactformulier, aanvraagflow |
| 👥 `klanten-` | Klantenbeheer |
| ⭐ `content-` | Reviews, teksten, foto's, vindbaarheid |
| 🔒 `security-` | Auth, hardening |
| ⚙️ `infra-` | Domein, deploy, backups |
| 📅 `werkblok-` | Werkrondes (huidig + gearchiveerd) |

**Elk plan-bestand opent met dit status-header-blok:**

```markdown
> **Status:** [actief / klaar / wacht / discussie / parkeer / afgerond]
> **Thema:** 🖼️ portfolio
> **Laatst bijgewerkt:** YYYY-MM-DD
> **Afhankelijk van:** [referentie of —]
> **Effort-schatting:** [dagen/uren]
```

En bevat: Context · Scope (wel/niet) · Aanpak in fases · Bestanden-tabel · Verificatie ·
Effort-schatting.

---

## Werkwijze

- **Toevoegen** — nieuw plan hier neerzetten zodra het uitgewerkt is. Volg de conventie hierboven.
- **Oppakken** — bij start verplaatsen naar [2-in-uitvoering/](2-in-uitvoering/) en de status bijwerken.
- **Afsluiten** — entry in [../deployment/history.md](../deployment/history.md), plan verplaatsen naar [../archive/planning/](../archive/planning/) met status `afgerond`, en zo nodig een implementatie-doc in [../features/](../features/).
- **Niet meer relevant** — archiveren met de reden in de commit-boodschap.

---

# Status-indeling

**🚀 klaar voor livegang** → **🚧 in uitvoering** → **📋 onaangeraakt**

Een plan verhuist naar `1-klaar-voor-livegang/` zodra **zijn eigen verificatielijst is
afgevinkt** — niet zodra de code er staat. Naar `../archive/planning/` gaat het pas als het
**live** draait.

## 🚀 Klaar voor livegang

Gebouwd én doorgeklikt tegen `atelierboterbloem_dev` op 25-08. Wat er voor live nog moet
gebeuren staat in [../deployment/pending.md](../deployment/pending.md); de schema-migratie
moet er als eerste heen, vóór de code.

- 🖼️ [portfolio-categorie-albums](1-klaar-voor-livegang/portfolio-categorie-albums.md) — categorie → album → foto's, plus het categorie-beheer dat er niet was. Getest: aanmaken, herordenen, verwijderen met bevestiging, en dat album- en categorieverwijdering de foto's laat staan.
- 🍰 [pakketten-en-prijzen](1-klaar-voor-livegang/pakketten-en-prijzen.md) — `packages` met vanaf-prijs en "wat zit erin" (inclusief herordenen), `/aanbod` herschreven. Getest: nul actieve pakketten geeft de "Binnenkort"-staat.
- 📅 [agenda-boekingen](1-klaar-voor-livegang/agenda-boekingen.md) — maandweergave met boekingen én aanvragen, ICS-feed met eigen token. Getest: aanvragen staan met stippellijn, tijd en locatie renderen, ICS-formaat machinaal geverifieerd.
- ⭐ [content-reviews](1-klaar-voor-livegang/content-reviews.md) — concept standaard, blok verdwijnt bij nul. Getest: een niet-gepubliceerde review komt **niet** in de publieke respons voor.
- 📨 [aanvragen-formulier-uitbreiding](1-klaar-voor-livegang/aanvragen-formulier-uitbreiding.md) — gelegenheid + pakket + levertijd-waarschuwing.
- 👥 [klanten-uitbreiding](1-klaar-voor-livegang/klanten-uitbreiding.md) — ontdubbeling, detailscherm, zoekveld. Getest: `LISA@Example.COM` koppelt aan `lisa@example.com` zonder tweede klantrij.

## 🚧 In uitvoering

- 🧾 [boekingen-detailsheet-en-agenda](2-in-uitvoering/boekingen-detailsheet-en-agenda.md) — de
  boeking bruikbaar maken: regels, totalen, tijdlijn, detailsheet, agenda en offerte. Bevat de
  **wireframes** en **100 klantsituaties** als testscript. **Stand:** stap 1 t/m 12 af en tegen
  dev doorlopen. **Open:** stap 13, de scenario's die een muis en meerdere stappen vragen —
  rechtermuisklik in de agenda, slepen tussen dagen, de terugknop die een sheet sluit, en de
  drukte-gevallen uit groep H. Dit is het enige echte bouwwerk dat hier nog staat.

- 🍰 [pakketten-aanbodpagina-indeling](2-in-uitvoering/pakketten-aanbodpagina-indeling.md) —
  `/aanbod` opnieuw ingedeeld: gelegenheden als doorlopende strook in de kop, pakketten als
  blokken eronder. ✅ gebouwd 25-08. **Open:** doorklikken op 375 / 768 / 1440 px en de
  randgevallen.

- 🔒 [security-hardening](2-in-uitvoering/security-hardening.md) — vier van de vijf bevindingen
  af. **Open:** poort 5432 dichtzetten in de firewall — vraagt SSH, geen codewerk.

- ⭐ [content-teksten-herpositionering](2-in-uitvoering/content-teksten-herpositionering.md) —
  teksten van taart-eerst naar tables-eerst, plus `robots.txt`, `sitemap.xml` en Open Graph.
  ✅ gebouwd; de kastlijntjes zijn er 25-08 uit gehaald. **Open:** de klant die haar eigen
  woorden invult.

- 🖼️ [portfolio-albums-als-verhaal](2-in-uitvoering/portfolio-albums-als-verhaal.md) — tekst
  tussen de foto's van een event. Stap 1 (blokken) en stap 2 (eigen webadres per event) zijn
  allebei af. Stap 3 (artikelen zonder event) is uit scope tenzij de klant erom vraagt.
  **Open:** `sitemap.xml` uit de database en Open Graph per event — allebei pas zinnig met
  echte foto's.

## 📋 Onaangeraakt

- ⚙️ [infra-domein-livegang](3-onaangeraakt/infra-domein-livegang.md) — domein, HTTPS, backups. **Wacht op:** DNS-toegang. Bundel opsplitsen is al gedaan: 1012 kB → 536 kB.

## 📦 Recent afgerond

_(nog niets — pas na de eerste livegang)_

---

## Verwante documentatie

- **Wat staat er klaar voor live?** → [../deployment/pending.md](../deployment/pending.md)
- **Wat wilde de klant precies?** → [../klant/2026-08-24-meeting-wensen.md](../klant/2026-08-24-meeting-wensen.md)
- **Waar wachten we op?** → [../klant/content-checklist.md](../klant/content-checklist.md)
- **Hoe zit het systeem in elkaar?** → [../architecture/](../architecture/)
