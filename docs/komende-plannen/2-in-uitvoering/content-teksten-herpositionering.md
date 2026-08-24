# Teksten: van taart-eerst naar tables-eerst

> **Status:** 🟡 Gebouwd (25-08) — wacht op de teksten van de klant
> **Thema:** ⭐ content
> **Laatst bijgewerkt:** 2026-08-25
> **Afhankelijk van:** terugkoppeling van de klant op de toon
> **Effort-schatting:** ~0,5 dag — gedaan

## Context

Na de meeting van 24-08 is de **structuur** omgezet: `/aanbod` zet sweet en grazing tables
voorop, de galerij gaat per gelegenheid, pakketten bestaan. Maar de **teksten** door de site
heen gingen nog over taarten — en dat is wat een bezoeker daadwerkelijk leest.

Uit de meeting: *Sweet Tables & Grazing Tables zijn de hoofdfocus. Taarten blijven in het
aanbod, maar klein.*

Het gaat niet om "taart" wegpoetsen. Taarten horen erbij. Het gaat om de **volgorde**: tables
eerst, taarten erbij.

## 🐛 Bijvangst: de portretfoto op /over was verdwenen

`AboutPage.tsx` riep `demoImageForSlug("bruidstaarten")` aan. Die slug bestond niet meer sinds
de demo-categorieën gelegenheden werden — de functie gaf stil `null` terug en de foto viel weg
zonder dat iets klaagde.

Twee dingen aangepast:
- De aanroep wijst nu naar `bruiloft`
- `demoImageForSlug()` **valt terug op het eerste beschikbare beeld** in plaats van `null`, en
  waarschuwt in de console bij een onbekende slug. Een zichtbaar verkeerd beeld valt op; een
  leeg vlak niet.

Daarbij kwam nog iets aan het licht: `client/src/vite-env.d.ts` ontbrak, het standaard
Vite-typebestand. Zonder dat kent TypeScript `import.meta.env` niet. Toegevoegd.

## Wat er gewijzigd is

| Plek | Van | Naar |
|---|---|---|
| `client/index.html` titel | "Handgemaakte taarten" | "Sweet tables & grazing tables" |
| `client/index.html` omschrijving | "bruidstaarten, verjaardagstaarten, mini desserts en cupcakes" | "sweet tables en grazing tables … Ook taarten op maat" |
| `client/index.html` | — | Open Graph-tags, voor als iemand de link deelt |
| `PublicLayout` voettekst | "Handgemaakte taarten, mini desserts en zoete creaties" | "sweet tables, grazing tables en taarten" |
| `HomePage` marquee | Bruidstaarten · Verjaardagstaarten · Cupcakes voorop | Sweet tables · Grazing tables · Bruiloften voorop |
| `HomePage` inleiding | "Iedere taart vertelt een verhaal" · "ontwerpen en bakken" | "Iedere tafel vertelt een verhaal" · "ontwerpen en maken" |
| `HomePage` processtap 03 | "Bakken" | "Maken" |
| `HomePage` hero-terugval | "Handgemaakte taarten voor jouw mooiste momenten" | "Sweet tables en grazing tables voor jouw mooiste momenten" |
| `ContactPage` | "Van idee tot taart" | "Van idee tot tafel" |
| `AboutPage` standaardtekst | "elke taart met de hand" | "elke tafel met de hand op … Sweet tables, grazing tables en taarten" |
| `scripts/seed-admin.ts` | hero-tagline en about-tekst, beide taart-eerst | tables-eerst |

**Vindbaarheid** meegenomen omdat het dezelfde bestanden raakt: `robots.txt` (met `/admin`
uitgesloten) en `sitemap.xml` staan in `client/public/` en komen mee in de build.

De teksten uit `site_settings` (hero-tagline, about-body) zijn de klant haar eigen woorden
zodra ze die invult. Wij hebben alleen de **standaardwaarden in de seed** aangepast en de
teksten die hardgecodeerd in de pagina's staan.

## Open punten

**~~Het webadres van de aanbod-pagina is `/diensten`~~ — ✅ opgelost 25-08.** Hernoemd naar
`/aanbod`, in de woorden van de gebruiker: *"het zijn geen diensten"*. Aangepast in `App.tsx`,
`PublicLayout`, `HomePage` en `sitemap.xml`; `ServicesPage.tsx` heet nu `AanbodPage.tsx`. Er is
géén doorverwijzing van het oude adres nodig — de site staat nog niet live, dus er bestaat geen
gedeelde link die breekt. Precies daarom moest dit vóór de livegang gebeuren.

**De toon is van ons, niet van haar.** Deze teksten zijn geschreven om de positionering te
laten kloppen, niet om haar stem te vangen. Laat haar de hero-tagline, de over-tekst en de
gelegenheid-omschrijvingen zelf invullen in het beheerscherm — dan verdwijnen onze
standaardwaarden vanzelf.

**Open Graph-afbeelding ontbreekt nog.** De tags staan er, maar er is geen beeld om naar te
wijzen. Dat wacht op een echte foto; zie de content-checklist.

## Verificatie

- [x] `npm run typecheck`, `npm test` (27), `npm run build` groen
- [x] `robots.txt` en `sitemap.xml` komen mee in `dist/client/`
- [x] Titel in de gebouwde `index.html` klopt
- [ ] Portretfoto op `/over` is terug — **klikronde**
- [ ] Marquee toont de nieuwe volgorde — **klikronde**
- [ ] Onbekende slug in `demoImageForSlug` geeft een console-waarschuwing én een beeld
- [ ] Klant leest de teksten en herkent zichzelf erin
