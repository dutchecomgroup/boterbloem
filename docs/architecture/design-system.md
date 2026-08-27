# Design system

De visuele taal zit op twee plekken: kleuren en lettertypen in
[`tailwind.config.ts`](../../tailwind.config.ts), herbruikbare klassen in
[`client/src/index.css`](../../client/src/index.css). Nieuwe UI gebruikt die klassen — niet
losse utility-stapels die net iets anders zijn.

---

## Kleuren

Het palet komt uit het **huisstijl-moodboard dat de klant zelf aanleverde**
(`uploads/content/merk/huisstijl-moodboard.png`). Tot 27-08 stond hier cream met goud — een
richting die vóór haar materiaal gekozen was en die niet bij haar logo past: dat is olijfgroen
met een gele boterbloem op linnen, en daar hoort geen goud bij.

| Token | Hex | Op wit | Waarvoor |
|---|---|---|---|
| `linen` | `#F7F5F0` | — | Achtergrond van vrijwel alles |
| `sand` | `#EDE7DE` | — | Sectie-verloop, tabelkoppen |
| `mist` | `#DCD6CB` | — | Haarlijnen, randen |
| `sage` | `#A7B49A` | 2,18:1 | Accent, knoppen, actieve staat — **nooit lopende tekst** |
| `sage-light` | `#C3CDB9` | — | Zachte accenten |
| `sage-dark` | `#8A9A7B` | 3,00:1 | Koppen, randen, iconen — **niet** voor lopende tekst |
| `sage-deep` | `#5F6E4E` | **5,49:1** | Salie die gelezen mag worden; haalt AA |
| `olive` | `#6E7B4E` | 4,56:1 | Woordmerk en logo. Op `linen` 4,18:1 — dus **geen** lopende tekst |
| `blush` | `#F5D9DE` | — | Sectie-verloop |
| `boterbloem` | `#F2C230` | 1,68:1 | "Vraagt aandacht"; charcoal erop is 8,66:1 |
| `burgundy` | `#7A1F2B` | — | Waarschuwing, verwijderen, negatief |
| `charcoal` | `#2B2926` | 14,5:1 | Alle tekst |

`burgundy` zit niet in het moodboard maar blijft staan: de rol "fout, gevaar, negatief" heeft een
rood nodig, en salie of geel kunnen dat niet dragen.

Er is bewust **geen zwart en geen zuiver wit** in de tekstkleuren — alles is charcoal op linen.

Doorzichtigheid als nuance: `text-charcoal/70` voor lopende tekst, `/60` voor bijschriften,
`/40` voor lege staten.

> ⚠️ **`boterbloem` is verzadigder dan de oude `butter`.** Waar `butter` als vlak op volle sterkte
> kon (`bg-butter`), leest `boterbloem` dan als markeerstift. Badges en statussen gebruiken
> daarom `/55`, en waar het om ritme ging in plaats van om een signaal — de tabelkop, de
> agendakop — staat nu `sand`. Elke tabelkop geel maken maakt het signaal waardeloos.

---

## Typografie

| Familie | Font | Waarvoor |
|---|---|---|
| `font-display` | Playfair Display | Alle koppen — `h1` t/m `h4` krijgen dit automatisch |
| `font-body` | Montserrat | Lopende tekst, formulieren, beheerpaneel |
| `font-script` | Playfair Display *italic* | Accenten, via `.script-accent` |

**Allura is vervallen** (27-08). Het moodboard zet zijn accentregel ("Details maken het
verschil") in een cursieve serif, niet in een schrijfletter. `.script-accent` is nu Playfair
italic in `sage-deep` — een kleur die gelezen mag worden. Spaarzaam gebruiken: één per sectie,
hoogstens.

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
| `.btn-sage` | Primair, salievlak in `sage-deep` |
| `.btn-outline` | Secundair, salierand |
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
| `.tag` | Klein salie-hoofdletterlabel boven een sectiekop, in `sage-deep` |
| `.pill` + `.pill-active` / `.pill-inactive` | Filterknoppen, zoals in de galerij |
| `.hairline-sage` | Fijne salierand |
| `.script-accent` | Playfair italic in `sage-deep` |

### Sectie-verlopen

`.bg-section-linen`, `.bg-section-sand`, `.bg-section-blush`, `.bg-section-warm` en
`.bg-section-sage` — zachte verlopen die secties van elkaar scheiden zonder harde lijn. Wissel
ze af zodat een lange pagina ritme krijgt.

De blush-verlopen zijn op 27-08 verzacht: op 45% las het vlak als rózé, terwijl het moodboard
neutraal is met salie- en blush-*accenten*. De foto's horen het werk te doen.

---

## Ornamenten

In [`client/src/components/ornaments/`](../../client/src/components/ornaments/) — allemaal
inline SVG, geen afbeeldingen:

| Component | Wat |
|---|---|
| `BotanicalPattern` | Herhalend achtergrondpatroon, `opacity`-prop (0.04–0.06) |
| `BotanicalCorner` | Hoekversiering, `position`: `tl` / `tr` / `bl` / `br` |
| `FloralFrame` | Grote bloemvorm, meestal half buiten beeld |
| `SierDivider` | Haarlijn met bloemmotief. Heette `GoldDivider` tot 27-08; de naam is nu neutraal zodat hij de volgende paletwissel overleeft |
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

Het beheerpaneel gebruikt dezelfde tokens: `bg-linen/60` als achtergrond, witte `.card`-blokken.
De paletwissel van 27-08 kwam daarmee gratis mee — alleen de tokens veranderden, niet de
zeven rollen hieronder.
Geen ornamenten, geen scroll-animaties — het is een werkomgeving.

Zijbalk is `w-64`, in drie groepen (*Werk · Geld · Inhoud*), en verdwijnt onder `md`; op mobiel
komt er een eenvoudige koptekst voor in de plaats. Zie
[`AdminLayout.tsx`](../../client/src/components/layout/AdminLayout.tsx).

### De kleurtaal

**Kleur heeft hier een betekenis en is geen versiering.** Aanleiding (26-08): gemeten over alle
adminpagina's won `charcoal/xx` met een factor 2 tot 4 van elke kleur, terwijl het accent, `blush`,
`pill` en de haarlijn in nul adminbestanden voorkwamen. In de woorden van de gebruiker: *"het
is niet duidelijk alles."*

Zeven rollen. Alles kiest hieruit; past een accent in geen enkele rol, dan blijft het charcoal.

| Rol | Token | Waar |
|---|---|---|
| Merk, navigatie, sectiekop | `sage` / `sage-dark` | paginakoppen, `.tag`, actief menu-item |
| Bewerkbaar | `.veld-pil` — salierand + potlood | `VeldInline` |
| Geld: voldaan, ontvangen | `emerald-700` | betaald, voldaan, positieve verandering |
| Geld: openstaand | `sage-deep` | openstaand bedrag |
| Fout, gevaar, te veel betaald | `burgundy` | verwijderen, validatie, negatief saldo |
| Aandacht, actie nodig | `boterbloem/55` | nieuwe aanvragen, ontbrekend btw-tarief, concept |
| Afgehandeld, rustig | `charcoal/40` | afgeleverd, gelezen, uitgeschakeld |

> ⚠️ Eén uitzondering, bewust: **allergieën blijven burgundy**, ook al is "vraagt aandacht"
> normaal boterbloem. Het is een veiligheidssignaal en geel zou dat verzwakken.

### 🔴 Contrast

`sage` haalt op wit **2,18:1** en `sage-dark` **3,00:1** — allebei onder de AA-eis van 4,5:1 voor
gewone tekst.

- `sage-dark`: koppen vanaf 24 px (of 19 px vet), randen, iconen, streepjes.
- **`sage-deep`** (5,49:1) als de kleur de betekenis draagt én de tekst gelezen moet worden — een
  openstaand bedrag bijvoorbeeld.
- Lopende tekst, tabelinhoud en labels blijven **charcoal**.
- Op `boterbloem` en `blush` staat tekst altijd in charcoal, nooit in salie.

### Gedeelde onderdelen

In [`components/admin/ui/`](../../client/src/components/admin/ui/):

| Component | Waarvoor |
|---|---|
| `PageKop` | De kop van elk scherm: saliestreepje, `.tag`, titel, actie rechts |
| `Badge` | Eén badge-vorm; `toon` is semantisch, of `klassen` uit een statustabel |
| `Bedrag` | Kleurt een bedrag naar betekenis, met `tabular-nums` |
| `LegeStaat` | Lege staat met warme ondergrond en een zin die zegt wat je nu kunt doen |

En in `index.css`: `.card-accent`, `.tabel-admin`, `.rij-hover`, `.veld-pil`.

**Statuskleuren staan in een tabel, niet in een component:** `STATUS_KLEUR` in
[`lib/boeking.ts`](../../client/src/lib/boeking.ts) en `AANVRAAG_KLEUR` in
[`lib/aanvraag.ts`](../../client/src/lib/aanvraag.ts). Die stonden eerder in meerdere kopieën met
de kleuren los daarvan in een ternaire keten midden in een tabel — precies waar "waarom is nieuw
hier salie en daar grijs?" vandaan komt.

---

## Vuistregels

- **Bestaande klasse boven nieuwe utility-stapel.** Heb je `.card` nodig maar net anders? Pas
  `.card` aan of maak een variant, maak geen eenmalige stapel.
- **Mobiel eerst bij ruimte en tekstgrootte** — de basiswaarde is de mobiele, `sm:` en `md:`
  schalen op.
- **Aanraakdoelen minimaal 44px.**
- **Geen kleuren buiten het palet.** Heb je iets nodig dat er niet is, voeg het toe aan
  `tailwind.config.ts` in plaats van een losse hex in een component.
