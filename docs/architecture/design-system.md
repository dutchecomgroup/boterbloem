# Design system

De visuele taal zit op twee plekken: kleuren en lettertypen in
[`tailwind.config.ts`](../../tailwind.config.ts), herbruikbare klassen in
[`client/src/index.css`](../../client/src/index.css). Nieuwe UI gebruikt die klassen — niet
losse utility-stapels die net iets anders zijn.

---

## Kleuren

| Token | Hex | Waarvoor |
|---|---|---|
| `cream` | `#FBF6EE` | Achtergrond van vrijwel alles |
| `gold` | `#C8A560` | Accent, knoppen, actieve staat |
| `gold-light` | `#D9BE85` | Zachte accenten |
| `gold-dark` | `#A0813E` | Koppen, randen, iconen — **niet** voor lopende tekst (3,7:1) |
| `gold-deep` | `#8A6E36` | Goud dat gelezen mag worden: 4,9:1, haalt AA |
| `butter` | `#F5E6A8` | Sectie-verloop |
| `blush` | `#F4D9D0` | Sectie-verloop |
| `burgundy` | `#7A1F2B` | Waarschuwing, verwijderen, negatief |
| `charcoal` | `#2B2926` | Alle tekst |

Er is bewust **geen zwart en geen zuiver wit** in de tekstkleuren — alles is charcoal op
cream. Dat geeft de warme uitstraling die bij het merk hoort.

Doorzichtigheid als nuance: `text-charcoal/70` voor lopende tekst, `/60` voor bijschriften,
`/40` voor lege staten.

---

## Typografie

| Familie | Font | Waarvoor |
|---|---|---|
| `font-display` | Cormorant Garamond | Alle koppen — `h1` t/m `h4` krijgen dit automatisch |
| `font-body` | Inter | Lopende tekst, formulieren, beheerpaneel |
| `font-script` | Allura | Accenten, via `.script-accent` |

`.script-accent` is Allura in goud. Spaarzaam gebruiken — één per sectie, hoogstens. Het is
een accent, geen tekstlettertype.

Koppen staan op `tracking-tight`; kleine hoofdletter-labels juist ruim uit elkaar
(`tracking-widest` tot `tracking-[0.3em]`).

---

## Componentklassen

Gedefinieerd in `@layer components` in `index.css`.

### Opbouw

| Klasse | Wat |
|---|---|
| `.container-tight` | `max-w-6xl` + responsieve padding — de standaard |
| `.container-narrow` | `max-w-3xl` — voor lopende tekst |
| `.section-y` | Verticale sectie-ruimte: `py-14 sm:py-20 md:py-24` |
| `.section-y-sm` | Compactere variant |

### Knoppen

| Klasse | Wat |
|---|---|
| `.btn` | Basis — pilvorm, hoofdletters, `min-h-[44px]` |
| `.btn-gold` | Primair, gouden vlak |
| `.btn-outline` | Secundair, gouden rand |
| `.btn-ghost` | Tertiair, geen rand |

`min-h-[44px]` is de aanraakdoelmaat voor mobiel en staat er bewust in. Niet weghalen.

### Formulieren

| Klasse | Wat |
|---|---|
| `.input` | Invoervelden, keuzelijsten en tekstvlakken — allemaal dezelfde |
| `.label` | Kleine hoofdletters boven een veld |

### Overig

| Klasse | Wat |
|---|---|
| `.card` | Witte kaart met rand en zachte schaduw — de standaard voor beheerblokken |
| `.tag` | Klein gouden hoofdletter-label boven een sectiekop |
| `.pill` + `.pill-active` / `.pill-inactive` | Filterknoppen, zoals in de galerij |
| `.hairline-gold` | Fijne gouden rand |
| `.script-accent` | Allura in goud |

### Sectie-verlopen

`.bg-section-cream`, `.bg-section-blush`, `.bg-section-butter`, `.bg-section-warm` — zachte
verlopen die secties van elkaar scheiden zonder harde lijn. Wissel ze af zodat een lange
pagina ritme krijgt.

---

## Ornamenten

In [`client/src/components/ornaments/`](../../client/src/components/ornaments/) — allemaal
inline SVG, geen afbeeldingen:

| Component | Wat |
|---|---|
| `BotanicalPattern` | Herhalend achtergrondpatroon, `opacity`-prop (0.04–0.06) |
| `BotanicalCorner` | Hoekversiering, `position`: `tl` / `tr` / `bl` / `br` |
| `FloralFrame` | Grote bloemvorm, meestal half buiten beeld |
| `GoldDivider` | Gouden scheiding met middenmotief |
| `SectionDivider` | Overgang tussen twee secties |

Ze staan altijd op `absolute` binnen een `relative overflow-hidden`-sectie, en de inhoud
erboven op `relative`. Vergeet je die laatste, dan verdwijnt de tekst achter het patroon.

---

## Beweging

| Component / hook | Wat |
|---|---|
| `useLenis` | Soepel scrollen, aangeroepen in `App.tsx` |
| `Reveal` | Inhoud die verschijnt bij het in beeld scrollen |
| `SplitText` | Kop die letter voor letter opbouwt |
| `Marquee` | Doorlopende band met trefwoorden |
| `MagneticLink` / `useMagnetic` | Knop die de muis licht volgt |
| `MouseSpotlight` | Zachte lichtvlek die de cursor volgt |
| `ProcessStory` | Scroll-gestuurd verhaal met meebewegende beelden |
| `PageTransition` | Overgang tussen publieke pagina's |

**Verminderde beweging wordt gerespecteerd.** `index.css` zet alle animaties en overgangen
uit onder `prefers-reduced-motion: reduce`, en er is een `prefersReducedMotion`-helper in
`client/src/lib/`. Nieuwe animatie moet daar doorheen — iemand met bewegingsklachten hoort
geen scroll-effecten te krijgen.

---

## Beheerpaneel

Het beheerpaneel gebruikt dezelfde tokens: `bg-cream/60` als achtergrond, witte `.card`-blokken.
Geen ornamenten, geen scroll-animaties — het is een werkomgeving.

Zijbalk is `w-64`, in drie groepen (*Werk · Geld · Inhoud*), en verdwijnt onder `md`; op mobiel
komt er een eenvoudige koptekst voor in de plaats. Zie
[`AdminLayout.tsx`](../../client/src/components/layout/AdminLayout.tsx).

### De kleurtaal

**Kleur heeft hier een betekenis en is geen versiering.** Aanleiding (26-08): gemeten over alle
adminpagina's won `charcoal/xx` met een factor 2 tot 4 van elke kleur, terwijl `butter`, `blush`,
`pill` en `hairline-gold` in nul adminbestanden voorkwamen. In de woorden van de gebruiker: *"het
is niet duidelijk alles."*

Zeven rollen. Alles kiest hieruit; past een accent in geen enkele rol, dan blijft het charcoal.

| Rol | Token | Waar |
|---|---|---|
| Merk, navigatie, sectiekop | `gold` / `gold-dark` | paginakoppen, `.tag`, actief menu-item |
| Bewerkbaar | `.veld-pil` — goudrand + potlood | `VeldInline` |
| Geld: voldaan, ontvangen | `emerald-700` | betaald, voldaan, positieve verandering |
| Geld: openstaand | `gold-deep` | openstaand bedrag |
| Fout, gevaar, te veel betaald | `burgundy` | verwijderen, validatie, negatief saldo |
| Aandacht, actie nodig | `butter` | nieuwe aanvragen, ontbrekend btw-tarief, concept |
| Afgehandeld, rustig | `charcoal/40` | afgeleverd, gelezen, uitgeschakeld |

> ⚠️ Eén uitzondering, bewust: **allergieën blijven burgundy**, ook al is "vraagt aandacht"
> normaal butter. Het is een veiligheidssignaal en butter zou dat verzwakken.

### 🔴 Contrast

`gold` haalt op wit **2,3:1** en `gold-dark` **3,7:1** — allebei onder de AA-eis van 4,5:1 voor
gewone tekst.

- `gold-dark`: koppen vanaf 24 px (of 19 px vet), randen, iconen, streepjes.
- **`gold-deep`** (4,9:1) als goud de betekenis draagt én de tekst gelezen moet worden — een
  openstaand bedrag bijvoorbeeld.
- Lopende tekst, tabelinhoud en labels blijven **charcoal**.
- Op `butter` en `blush` staat tekst altijd in charcoal, nooit in goud.

### Gedeelde onderdelen

In [`components/admin/ui/`](../../client/src/components/admin/ui/):

| Component | Waarvoor |
|---|---|
| `PageKop` | De kop van elk scherm: goudstreepje, `.tag`, titel, actie rechts |
| `Badge` | Eén badge-vorm; `toon` is semantisch, of `klassen` uit een statustabel |
| `Bedrag` | Kleurt een bedrag naar betekenis, met `tabular-nums` |
| `LegeStaat` | Lege staat met warme ondergrond en een zin die zegt wat je nu kunt doen |

En in `index.css`: `.card-accent`, `.tabel-admin`, `.rij-hover`, `.veld-pil`.

**Statuskleuren staan in een tabel, niet in een component:** `STATUS_KLEUR` in
[`lib/boeking.ts`](../../client/src/lib/boeking.ts) en `AANVRAAG_KLEUR` in
[`lib/aanvraag.ts`](../../client/src/lib/aanvraag.ts). Die stonden eerder in meerdere kopieën met
de kleuren los daarvan in een ternaire keten midden in een tabel — precies waar "waarom is nieuw
hier goud en daar grijs?" vandaan komt.

---

## Vuistregels

- **Bestaande klasse boven nieuwe utility-stapel.** Heb je `.card` nodig maar net anders? Pas
  `.card` aan of maak een variant, maak geen eenmalige stapel.
- **Mobiel eerst bij ruimte en tekstgrootte** — de basiswaarde is de mobiele, `sm:` en `md:`
  schalen op.
- **Aanraakdoelen minimaal 44px.**
- **Geen kleuren buiten het palet.** Heb je iets nodig dat er niet is, voeg het toe aan
  `tailwind.config.ts` in plaats van een losse hex in een component.
