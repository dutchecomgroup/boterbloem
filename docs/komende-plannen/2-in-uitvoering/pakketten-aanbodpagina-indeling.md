> **Status:** ✅ gebouwd (25-08), nog niet doorgeklikt op alle breedtes
> **Thema:** 🍰 pakketten
> **Laatst bijgewerkt:** 2026-08-25
> **Afhankelijk van:** de democontent (staat op dev), `FotoCyclus` en `FotoScrim`
> **Effort-schatting:** ~3 uur — gedaan

# `/aanbod`: gelegenheden in de kop, pakketten als blokken eronder

## Waar dit vandaan komt

*"Kan dit ipv onder elkaar niet naast elkaar? dus eerst wat wij hebben, en rechterdeel wat we
allemaal gemaakt hebben oftewel: Waar we tables voor maken?"*

Daar is één tussenstap overheen gegaan. De eerste uitvoering zette het écht naast elkaar, in
twee kolommen. Dat viel af, en om een goede reden: *"Dit is geen 1 geheel meer, net zoals de
achtergrond, die splitst nu heel vreemd, ook zijn er teveel titels en subtitels nu."*

Klopt allebei, en het tweede punt was de fout. `bg-section-warm` is een verloop, en dat wordt
**per sectie opnieuw getekend** — twee secties met dezelfde achtergrondklasse leveren dus een
harde streep dwars over de pagina op. En elke eigen sectie vraagt om een eigen kop, waardoor er
twee label-plus-titel-paren onder elkaar stonden voordat de bezoeker iets gezien had.

De uiteindelijke vorm: de gelegenheden zitten **in de kop**, als carrousel, en de pakketten staan
daaronder als blokken.

## Wat er nu misging

**Het vierde pakket stond in zijn eentje op een nieuwe rij.** De kaarten stonden in een raster
van drie, en er zijn er vier. Grazing Table — het enige hartige aanbod, en het enige met een
per-persoon-prijs — landde daardoor links uitgelijnd op rij twee met een leeg vak ernaast. Dat
leest als een nakomertje, terwijl het de helft van de kop van de pagina is.

**Het bewijs stond te ver van het aanbod.** *"Waar we tables voor maken"* stond ruim duizend
pixels onder de prijzen. Wie zich afvraagt *"kan zij dit ook voor een babyshower?"* moest daarvoor
langs de prijslijst, de levertijden en de reviews scrollen.

**Drie fotoblokken op één pagina.** Het `FotoTrio` in de kop, de gelegenheid-tegels onderaan, en
de galerij één klik verderop toonden alle drie hetzelfde materiaal.

## Wireframe — desktop

```
┌────────────────────────────────────────────────────────────────────────┐
│                              AANBOD                                    │
│                      Sweet & grazing tables                            │
│                             ──────                                     │
│         Een tafel vol zoets die het middelpunt van je feest wordt.      │
│         We werken met pakketten als startpunt…                         │
│                                                                        │
│  ‹ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────  ›     │
│    │ ▓▓▓▓▓▓▓▓ │ │ ▓▓▓▓▓▓▓▓ │ │ ▓▓▓▓▓▓▓▓ │ │ ▓▓▓▓▓▓▓▓ │ │ ▓▓▓▓▓▓        │
│    │ ▓▓▓▓▓▓▓▓ │ │ ▓▓▓▓▓▓▓▓ │ │ ▓▓▓▓▓▓▓▓ │ │ ▓▓▓▓▓▓▓▓ │ │ ▓▓▓▓▓▓        │
│    │Babyshower│ │ Bruiloft │ │Verjaardag│ │ Communie │ │ Geboo…        │
│    └──────────┘ └──────────┘ └──────────┘ └──────────┘ └───────        │
│                     BEKIJK ALLE EVENTS →                               │
└────────────────────────────────────────────────────────────────────────┘
        ↑ één sectie, één achtergrondverloop, één kop

┌────────────────────────────────────────────────────────────────────────┐
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐            │
│  │  ▓▓▓ foto ▓▓▓  │  │  ▓▓▓ foto ▓▓▓  │  │  ▓▓▓ foto ▓▓▓  │            │
│  │ Sweet Table    │  │ Sweet Table XL │  │ Bruiloft Table │            │
│  │ ────────────   │  │ ────────────   │  │ ────────────   │            │
│  │ vanaf € 295,00 │  │ vanaf € 545,00 │  │ vanaf € 695,00 │            │
│  │ 15–40 personen │  │ 40–80 personen │  │ vanaf 40 pers. │            │
│  │ ✓ Taart als…   │  │ ✓ Grote taart… │  │ ✓ Persoonlijk… │            │
│  │ ✓ Vier soorten │  │ ✓ Zes tot acht │  │ ✓ Bruidstaart  │            │
│  │ [  Vraag aan ] │  │ [  Vraag aan ] │  │ [  Vraag aan ] │            │
│  └────────────────┘  └────────────────┘  └────────────────┘            │
│                                                                        │
│                    ┌────────────────┐                                  │
│                    │  ▓▓▓ foto ▓▓▓  │   ← een overblijver staat        │
│                    │ Grazing Table  │     in het midden, niet links    │
│                    │ € 24,50 p.p.   │     met een gat ernaast          │
│                    └────────────────┘                                  │
│                                                                        │
│    Elk pakket is een startpunt. Meer gasten, een extra lekkernij…      │
└────────────────────────────────────────────────────────────────────────┘

              daaronder: goed om te weten · taart-prijslijst
                        levertijden · reviews · CTA
```

## Wireframe — mobiel (375)

```
┌───────────────────────────┐
│         AANBOD            │
│  Sweet & grazing tables   │
│         ──────            │
│  Een tafel vol zoets…     │
│                           │
│ ┌────────┐┌────────┐┌──── │ ← vegen, geen knoppen
│ │▓▓▓▓▓▓▓▓││▓▓▓▓▓▓▓▓││▓▓▓▓ │
│ │Babyshow││Bruiloft││Verj… │
│ └────────┘└────────┘└──── │
│   BEKIJK ALLE EVENTS →    │
├───────────────────────────┤
│ ┌───────────────────────┐ │
│ │ ▓▓▓▓ foto ▓▓▓▓▓▓▓▓▓▓▓ │ │
│ │ Sweet Table           │ │  één kolom, kaarten
│ │ vanaf € 295,00        │ │  onder elkaar
│ │ [    Vraag aan     ]  │ │
│ └───────────────────────┘ │
│ ┌───────────────────────┐ │
│ │ Sweet Table XL        │ │
│ └───────────────────────┘ │
└───────────────────────────┘
```

## Drie keuzes die ertoe doen

**De carrousel zit ín de kop, niet in een eigen sectie.** Dat is de les uit de eerste poging:
een tweede sectie met hetzelfde achtergrondverloop geeft een zichtbare naad, en vraagt om een
eigen kop die er niet hoort te staan. De `onder`-slot van `PageHeader` bestond al precies
hiervoor.

**Geen kop boven de carrousel.** Elke tegel draagt zijn eigen naam, dus *"Gelegenheden — Waar we
tables voor maken"* erboven zei twee keer hetzelfde en duwde de prijzen verder naar beneden.

**Flexbox met `justify-center`, geen raster.** In een raster van drie belandt een vierde kaart
links uitgelijnd op een nieuwe rij met een gat ernaast. Met `flex-wrap justify-center` staat een
overblijver in het midden en leest hij als een keuze in plaats van als een restje. Werkt ook bij
vijf of zeven pakketten, zonder dat er iemand aan een kolomgetal hoeft te draaien.

**Schuiven in plaats van stapelen.** Zeven gelegenheden in een raster kosten twee rijen hoogte
voordat de bezoeker bij de prijzen is; opzij schuiven kost er één, en de half zichtbare tegel aan
de rand laat zien dat er meer is.

## Bestanden

| Bestand | Wat |
|---|---|
| `client/src/components/public/GelegenheidCarrousel.tsx` | **nieuw** — schuifbare tegels, elk wisselend via `FotoCyclus` |
| `client/src/components/public/PakketKaart.tsx` | **nieuw** — de kaart, uit `AanbodPage` gelicht |
| `client/src/pages/public/AanbodPage.tsx` | carrousel in de `onder`-slot van de kop, pakketten als gecentreerde flex-blokken |
| `client/src/components/FotoTrio.tsx` | **verwijderd** — de carrousel doet hetzelfde, mét namen erbij |

Geen wijziging aan de database of de routes: alle gegevens kwamen al binnen op deze pagina.

## Verificatie

Gedaan:
- `npm run typecheck` · `npm test` (78) · `npm run build` — alle drie groen

Nog doen, met Playwright:
- **1440 px**: één doorlopend achtergrondverloop over kop en carrousel, geen naad
- **Vier pakketten**: de vierde staat gecentreerd, niet links met een gat ernaast
- Pijlknoppen schuiven precies één tegel op; ze verschijnen pas vanaf vier gelegenheden
- **375 px**: vegen werkt, geen horizontaal schuiven van de página, knoppen raakbaar
- **Nul actieve pakketten**: "Binnenkort"-staat, en de carrousel staat er gewoon boven
- **Nul gelegenheden met foto's**: de kop valt terug op titel plus tekst, zonder lege strook
- `prefers-reduced-motion`: de tegels wisselen niet

## De carrousel schuift vanzelf door

Op verzoek toegevoegd: elke 3,8 seconde één tegel opzij, van rechts naar links, en aan het eind
smooth terug naar het begin.

Het bezwaar tegen zoiets is reëel — er schuift iets onder je muis weg terwijl je erop wilt
klikken — maar dat is op te lossen in plaats van te vermijden. Hij staat stil:

| Wanneer | Hoe lang |
|---|---|
| muis erboven | zolang je erboven hangt |
| toetsenbordfocus erin | zolang je erin navigeert |
| zelf vegen, slepen of scrollen | 6 seconden na de laatste aanraking |
| tabblad niet in beeld | zolang dat zo is |
| `prefers-reduced-motion` | altijd — hij beweegt dan helemaal niet |

Stapsgewijs en niet vloeiend, want de rij gebruikt `snap-mandatory`: een constante drift zou
daartegenin werken en de tegels laten trillen op elk snappunt.

## Wat níét

- **Geen bolletjes onder de carrousel.** Bij zeven tegels waarvan er vier zichtbaar zijn, zeggen
  bolletjes niets dat de half afgesneden tegel niet al laat zien.
- **Geen prijzen op de gelegenheid-tegels.** De prijs hoort bij het pakket; hetzelfde bedrag op
  twee plekken gaat vroeg of laat uit de pas lopen.
