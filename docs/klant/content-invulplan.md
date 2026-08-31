# Content-invulplan — wat de klant aanleverde, en wat er nog mist

> **Datum:** 27 augustus 2026
> **Bron:** `uploads/content/` — 20 werkfoto's, 2 logobestanden, 1 huisstijl-moodboard, 2 PDF's
> **Vervangt:** [content-checklist.md](content-checklist.md) als werkdocument. Die lijst bleef
> tot 27-08 op "alles open" staan; dit document zegt wat er binnen is, wat ermee gedaan is en
> wat er nog ontbreekt.

De democontent is weg — 36 stockfoto's, 9 verzonnen events en 6 verzonnen reviews. De site
draait volledig op haar eigen materiaal, en sinds **31-08 op de server**:
`http://85.215.182.227:6778`. Zij kan er zelf in met `esmee.steensma`.

> Nog geen domein en geen HTTPS, dus het is een besloten preview: `robots.txt` staat op
> `Disallow: /` en de link is nergens gedeeld. Wat er nog van haar nodig is om écht open te
> gaan, staat in §7 hieronder.

---

## In het kort

| | |
|---|---|
| **Foto's** | 20 geïmporteerd, verdeeld over 5 gelegenheden |
| **Gelegenheden zichtbaar** | 5 van de 7 — Communie en Geboorte hebben nul foto's en staan op verborgen |
| **Events** | 0, met opzet: haar foto's zijn niet per feest gegroepeerd |
| **Pakketten** | 6 uit haar PDF, zichtbaar met *"Prijs op aanvraag"* — de **prijzen ontbreken nog** |
| **Taarten** | 3 prijzen live, 4 smaken op `/aanbod` |
| **Reviews** | 0 — er is niets aangeleverd |
| **Huisstijl** | omgezet naar haar moodboard: salie, off-white, Playfair Display, Montserrat |
| **Nieuwe pagina** | `/werkwijze`, gevuld met haar geschreven artikel |

---

## 1. De foto's

Twintig bruikbare werkfoto's. Ze zijn hernoemd naar wat erop staat, HEIC is omgezet naar JPG en
de originelen staan in `uploads/content/origineel/`.

### Wat waar staat

| Gelegenheid | Foto's | Omslag |
|---|---|---|
| **Bruiloft** | 4 | `bruidstaart-ivoor-rozen-kaarslicht` |
| **Verjaardag** | 8 | `taart-geel-frangipani-zij` |
| **Overig** | 5 | `mini-desserts-citroen-amalfi` |
| **Bedrijfsevent** | 2 | `mini-desserts-jubileum-25` |
| **Babyshower** | 1 | `cupcakes-jungle-babyshower` |
| Communie & lentefeest | 0 | — *verborgen* |
| Geboorte & doopsuiker | 0 | — *verborgen* |

### De volledige lijst

| Oorspronkelijke naam | Nieuwe naam | Wat erop staat | Waar |
|---|---|---|---|
| `78dafcd2-….jpg` | `bruidstaart-ivoor-rozen-kaarslicht.jpg` | Tweelaags ivoor, roomrozen, satijnen strikken, kaarslicht | Bruiloft ★omslag ★uitgelicht |
| `IMG_7891.HEIC` | `bruidstaart-ivoor-rozen-tafel.jpg` | Zelfde taart, roosjes in vaasjes | Bruiloft |
| `cb7f81b7-….jpg` | `bruidstaart-ivoor-rozen-gedragen.jpg` | Taart met twee handen gedragen | Bruiloft |
| `IMG_7896.HEIC` | `taarten-ivoor-en-bordeaux-kaarsen.jpg` | Ivoor naast bordeaux, hoge kaarsen | Bruiloft |
| `IMG_7079.HEIC` | `taart-geel-frangipani-zij.jpg` | Boterbloemgeel, frangipani, zilveren parels | Verjaardag ★omslag ★uitgelicht |
| `IMG_7084.HEIC` | `taart-geel-frangipani-boven.jpg` | Zelfde taart van bovenaf | Verjaardag |
| `IMG_7088.HEIC` | `taart-geel-frangipani-voor.jpg` | Zelfde taart van voren | Verjaardag |
| `22e40c8f-….jpg` | `taart-bordeaux-tweelaags-strikken.jpg` | Bordeaux, zwarte strikken, gouden parels | Verjaardag ★uitgelicht |
| `79838959-….png` | `zeemeermin-taart-en-mini-desserts.png` | Zeemeermintaart + schaal mini desserts | Verjaardag |
| `IMG_9458.HEIC` | `zeemeermin-taart-met-schaal.jpg` | Zelfde set, volledig in beeld | Verjaardag |
| `IMG_6878.PNG` | `taart-perzik-bloemen-schelpen.png` | Perzik, zijden bloemen, gouden schelpen | Verjaardag |
| `IMG_6879.PNG` | `taart-perzik-bloemen-tuin.png` | Zelfde taart in de tuin | Verjaardag |
| `24a09d17-….jpg` | `cupcakes-jungle-babyshower.jpg` | Jungle-cupcakes op monsterabladeren | Babyshower ★omslag ★uitgelicht |
| `IMG_4940.heic` | `mini-desserts-jubileum-25.jpg` | Coupe-toren, bordeaux/wit, "25"-letters | Bedrijfsevent ★omslag |
| `IMG_4945.heic` | `mini-desserts-jubileum-toren.jpg` | Close-up van de toren | Bedrijfsevent |
| `IMG_1089.HEIC` | `mini-desserts-citroen-amalfi.jpg` | Citroen mini's, geel gestreept kleed | Overig ★omslag ★uitgelicht |
| `0A6762BE-….jpg` | `taart-kerst-witte-chocolade-drip.jpg` | Kersttaart, witte drip, rozemarijn | Overig |
| `IMG_1549.HEIC` | `mini-desserts-nude-parels.jpg` | Nude mini's, kristallen coupes, parels | Overig |
| `IMG_1548.HEIC` | `styling-bloemvaas-en-coupes.jpg` | Bloemstuk in gezichtsvaas + coupes | Overig |
| `IMG_7097.HEIC` | `verpakking-doos-met-kaartje.jpg` | Verpakte doos met lint en kaartje | Overig · slot van `/werkwijze` |

**Merkbestanden** (niet in de galerij): `logo-atelier-boterbloem.png` en `.jpg`,
`huisstijl-moodboard.png` — allemaal in `uploads/content/merk/`.

### Twee dingen over de foto's

**HEIC kon niet door de uploadknop.** Twaalf van de twintig zijn HEIC, en de server weigert die
met opzet: de meegeleverde Sharp-binaries bevatten libheif zonder HEVC-decoder. Ze zijn vooraf
met `ffmpeg` omgezet. **Wil ze zelf foto's uploaden, dan moet haar iPhone op *Meest compatibel*
staan** (Instellingen → Camera → Formaten), anders krijgt ze een foutmelding.

**Vier foto's zijn kleiner dan 1600 px** op de lange zijde — telefoon-exports van 1170 px breed:
de twee perzik-foto's, de zeemeermintaart en de kersttaart. Ze zijn bruikbaar maar worden op een
groot scherm iets zachter. Het origineel uit de fotogalerij van haar telefoon is scherper.

---

## 2. Gelegenheden: haar teksten

Elke gelegenheid heeft nu een inleiding die onder de titel op de publieke pagina verschijnt.
Zes zijn van haar; **"Overig" is door ons geschreven** en mag ze aanpassen.

| Gelegenheid | Inleiding |
|---|---|
| Babyshower | *Zacht, speels en meestal in pastel. Een sweet table op een babyshower is klein en hapklaar, want je gasten zitten door elkaar en lopen langs de tafel wanneer ze willen.* |
| Bruiloft | *Van een intieme tafel voor dertig gasten tot een opstelling die de hele avond meegaat. We stemmen de kleuren af op jullie bloemen en de locatie.* |
| Verjaardag | *Voor wie iets bijzonders verdient. Een taart als middelpunt, en daaromheen genoeg keuze zodat iedereen iets vindt dat hij lekker vindt.* |
| Communie & lentefeest | *Licht en rustig, meestal in wit met groen. Niet te zoet, want er wordt die dag al genoeg gegeten.* — **staat klaar, gelegenheid verborgen** |
| Geboorte & doopsuiker | *Een klein tafeltje voor de kraamvisite, of doosjes om mee te geven. Ook leuk als de grote broer of zus mag helpen kiezen.* — **staat klaar, gelegenheid verborgen** |
| Bedrijfsevent | *Representatief en toch persoonlijk. Meestal staand, dus alles zonder bordje en bestek te eten. Vertel ons hoeveel gasten en hoe lang de avond duurt.* |
| Overig | ⚠️ *van ons* — *Wat er verder langskomt: een kerstdiner, een zomerse borrel, een jubileum. Staat jouw gelegenheid er niet bij? Vraag het gerust, er kan meer dan je denkt.* |

### Waarom er geen events zijn

De aanlevering is niet per feest gegroepeerd, dus de foto's hangen **rechtstreeks onder hun
gelegenheid**. Dat kon het schema al (`gallery_items.album_id` mag leeg), maar het beheerscherm
noemde die foto's *"losse foto's die nog niet bij een event horen"* — het omgekeerde van wat we
nu doen. Dat scherm is aangepast: de foto's staan nu in de kaart van de gelegenheid zelf, direct
onder de inleiding, en events zijn zichtbaar optioneel geworden.

**Wat een event toevoegt** — en wanneer het de moeite waard is: één feest krijgt een eigen titel,
datum, een eigen webadres om te delen, en tekst tussen de foto's door. Zodra ze van één bruiloft
of babyshower een set foto's heeft, is dat het moment.

---

## 3. Pakketten

Zes pakketten uit `Informatie website.pdf`, met haar namen, taglines en gastenaantallen. Ze
**staan op de site**, met *"Prijs op aanvraag"* in plaats van een bedrag: `PakketKaart` zet
nooit € 0,00 op de pagina. Zodra ze een vanaf-prijs invult op `/admin/pakketten` verschijnt die
vanzelf.

Op `/aanbod` staan ze in twee groepen met een eigen kleur — blush voor de Tables, salie voor de
Grazes — zodat je ziet welke drie bij elkaar horen.

| Pakket | Personen | Prijs | Coverfoto |
|---|---|---|---|
| Petite Table | 10–20 | ⏳ **ontbreekt** | citroen mini desserts |
| Signature Table | 20–30 | ⏳ **ontbreekt** | zeemeermintaart |
| Grande Table | 30–50 | ⏳ **ontbreekt** | jubileum coupe-toren |
| The little graze | 20–30 | ⏳ **ontbreekt** | 🔴 tijdelijke Unsplash-foto |
| The classic graze | 40–60 | ⏳ **ontbreekt** | 🔴 tijdelijke Unsplash-foto |
| The grand graze | 70–100 | ⏳ **ontbreekt** | 🔴 tijdelijke Unsplash-foto |

> 🔴 **De drie graze-covers zijn stockfoto's van Unsplash**, geplaatst omdat er bij haar
> aanlevering geen enkele grazing table zit. Ze staan onder een niet-gepubliceerde gelegenheid,
> dus ze komen niet in de galerij of op de homepage — alleen op de pakketkaart. Weg vóór de
> livegang: `npx tsx scripts/seed-demo-grazefotos.ts --verwijder`.

### De "wat zit erin"-regels zijn van ons

Haar PDF geeft alleen namen, één zin en gastenaantallen. De opsommingen per pakket zijn door ons
geschreven op basis van de eerdere pakketteksten en haar foto's. **Die moet ze nakijken** — ze
zijn bewust concreet ("vier tot vijf soorten mini dessert"), dus als het aantal niet klopt, klopt
de belofte niet. Ze staan in `scripts/seed-klantcontent.ts` en zijn per pakket te wijzigen op
`/admin/pakketten`.

---

## 4. Taarten

Drie maten, met haar prijzen, zichtbaar op `/aanbod`:

| Naam | Voor | Vanaf |
|---|---|---|
| Basis taart | 12–15 personen | € 65,00 |
| Middelgrote taart | 15–20 personen | € 75,00 |
| Grote taart | 25–30 personen | € 95,00 |

De vier oude productregels (`Bruidstaart op maat`, `Verjaardagstaart`, `Cupcakes`,
`Mini desserts`) stonden op € 0,00 en zichtbaar. Ze bestaan nog als regel voor op een offerte,
maar staan niet meer in de publieke prijslijst — anders stonden er twee taartlijsten onder
elkaar, waarvan één zonder bedragen.

### De vier smaken

Op `/aanbod` onder de prijzen: **Lemon Bliss** (citroen & vanille) · **Strawberry Blush** (witte
chocolade & aardbei) · **Caramel Cocoa** (chocolade & karamel) · **Coco Blanc** (kokos, witte
chocolade & hazelnoot).

Bewust geen producten in de database: een smaak is een keuze bij elke maat, geen artikel met een
eigen prijs. Als product zou de prijslijst twaalf regels krijgen waarvan er elf hetzelfde bedrag
hebben.

---

## 5. Haar geschreven tekst

`Blogs website.pdf` bevat één artikel: *"Van eerste idee tot taart op tafel"*, ruim 500 woorden
in zeven stappen.

**Het is geen blog geworden.** Een blog met één artikel is een leeg archief met een
inhoudsopgave, en de tekst is geen nieuwsbericht maar een procesbeschrijving. Haar eigen
moodboard heeft `WERKWIJZE` al in de navigatie staan, met vijf stappen als iconen — ze had de
pagina zelf bedacht, alleen de tekst ervoor lag los.

**Eén tekst, twee dieptes, één bron** (`client/src/content/werkwijze.ts`):

1. **`/werkwijze`** — haar zeven stappen uitgeschreven, elk met een eigen foto, in een
   scroll-verhaal waarin het beeld meeloopt. De slotstap *"Klaarmaken voor afhalen"* krijgt de
   foto van de verpakte doos met haar kaartje.
2. **Homepage** — vijf korte stappen, precies de vijf van haar moodboard (Aanvraag ·
   Kennismaking · Offerte · Ontwerp · Levering & opbouw), met een link naar het hele verhaal.
   Hier stond tot nu toe door ons geschreven tekst.

### Wat er aan haar tekst veranderd is

Zo min mogelijk. Op zes plekken staat er iets breders waar zij "de taart" schreef terwijl de zin
net zo goed over een sweet table gaat — de site kopt sinds de meeting van 24-08 op tafels, en een
werkwijze die alleen over taarten gaat leest dan als een andere onderneming.

| Haar tekst | Op de site |
|---|---|
| "Achter iedere taart zit een heel proces" | "Achter iedere tafel en iedere taart" |
| "Hoe groot moet de taart worden?" | "Hoe groot moet het worden?" |
| "maakt iedere taart persoonlijk" | "maakt het persoonlijk" |
| "taartkartons, doos, linten" | "kartons, dozen, linten" |
| "De taartlagen worden gebakken" | "De lagen worden gebakken" |
| "dat een taart echt eigen wordt" | "dat het echt van jou wordt" |

De titel van de pagina is **"Zo werkt het"** in plaats van haar "Van eerste idee tot taart op
tafel", om dezelfde reden.

> ❓ **Vraag aan haar:** dekt deze ene tekst ook de sweet en grazing tables, of wil ze een
> tweede stuk dat specifiek over het opbouwen van een tafel gaat?

---

## 6. Huisstijl

Het moodboard (`uploads/content/merk/huisstijl-moodboard.png`) bleek een andere richting te
bevatten dan wat er gebouwd was: salie-groen en off-white met Playfair Display en Montserrat,
tegenover cream en goud met Cormorant Garamond, Allura en Inter. Haar logo — olijfgroen met een
gele boterbloem op linnen — hoort bij het moodboard, niet bij het goud.

Het palet is omgezet, inclusief het beheerpaneel. Contrastwaarden zijn gemeten, niet geschat:

| Token | Hex | Op wit | Waarvoor |
|---|---|---|---|
| `linen` | `#F7F5F0` | — | achtergrond van vrijwel alles |
| `sand` | `#EDE7DE` | — | sectie-verlopen, tabelkoppen |
| `mist` | `#DCD6CB` | — | haarlijnen |
| `sage` | `#A7B49A` | 2,18:1 | vlakken en accenten — **nooit tekst** |
| `sage-dark` | `#8A9A7B` | 3,00:1 | randen, iconen, koppen vanaf 24 px |
| `sage-deep` | `#5F6E4E` | **5,49:1** | salie die gelezen mag worden — haalt AA |
| `olive` | `#6E7B4E` | 4,56:1 | woordmerk; op `linen` 4,18:1, dus geen lopende tekst |
| `blush` | `#F5D9DE` | — | sectie-verlopen |
| `boterbloem` | `#F2C230` | 1,68:1 | "vraagt aandacht"; charcoal erop is 8,66:1 |
| `burgundy` | `#7A1F2B` | — | fout, gevaar, negatief |
| `charcoal` | `#2B2926` | 14,5:1 | alle tekst |

Lettertypen: **Playfair Display** voor koppen, **Montserrat** voor lopende tekst. Allura is
vervallen — het moodboard zet zijn accentregel in cursieve serif, niet in een schrijfletter.

Volledige uitleg in [../architecture/design-system.md](../architecture/design-system.md).

---

## 7. Wat er nog ontbreekt

### 🔴 Blokkeert de livegang

| # | Wat | Waarom het blokkeert |
|---|---|---|
| 1 | **Prijs voor alle zes de pakketten** | Zonder prijs staan ze op onzichtbaar en heeft `/aanbod` geen aanbod. Dit is het grootste gat. |
| 2 | **Foto's van een grazing table** | Bij de twintig foto's zit er **geen enkele**. Alles is zoet. Er staan nu drie **tijdelijke Unsplash-foto's** bij de graze-pakketten zodat de pagina compleet oogt; die moeten eruit vóór de livegang (`npx tsx scripts/seed-demo-grazefotos.ts --verwijder`). |
| 3 | **Reviews** | Nul aangeleverd; de zes die er stonden waren verzonnen en zijn verwijderd. Het blok is nu leeg. Minimaal drie, liefst zes. |
| 4 | **Over-tekst** (150–250 woorden) | De huidige tekst op `/over` is van ons. Na de foto's is dit het meest gelezen stuk. |
| 5 | **Btw-verdeling per pakket** | Welk deel is eten (9%) en welk deel styling en opbouw (21%). Met haar boekhouder. Staat open sinds 25-08. |
| 6 | **Btw-tarief per taart** | Vermoedelijk 9%, maar dat mag zij bevestigen. |
| 7 | **Contactgegevens** | `hallo@atelierboterbloem.nl` staat in de database maar is nooit bevestigd. Telefoon, WhatsApp, adres en plaats zijn leeg. |
| 8 | **Logo in vectorformaat** | Beide bestanden zijn bitmaps met linnen ondergrond, zonder transparantie — op 32×32 onleesbaar. Er staat nu een zelfgetekende boterbloem in `client/public/favicon.svg`; die hoort vervangen te worden zodra het vectorbestand er is. |
| 9 | **Portretfoto voor `/over`** | Er is er geen, dus die pagina toont nu alleen tekst. |

### ❓ Vragen die beantwoord moeten worden

| # | Vraag |
|---|---|
| 10 | **Mag het bedrijfsevent gepubliceerd worden?** Op `mini-desserts-jubileum-25` is het lint van **Cosy Fashion** leesbaar. Werk van een klant met hun merk in beeld tonen vraagt om hun akkoord. Zonder dat kunnen die twee foto's beter uit het portfolio. |
| 11 | **De smaken spreken elkaar tegen.** De PDF noemt vier vaste smaken; haar artikel noemt *"Vanille, chocolade, Citroen & Witte chocola, Aarbei"* (met typefout). De PDF-lijst staat nu op de site. Welke is de echte? |
| 12 | **Gaten in de gastenaantallen.** Grazing: 20–30, 40–60, 70–100 — wie 35 of 65 gasten heeft valt tussen wal en schip. Sweet tables overlappen juist op 20 en 30. |
| 13 | **Communie en Geboorte staan verborgen** omdat ze nul foto's hebben. Twee van de zeven gelegenheden staan dus niet op de site. Heeft ze daar werk van? |
| 14 | **Dekt de werkwijze-tekst ook de tafels**, of wil ze er een tweede stuk bij? |
| 15 | **Beeldkwaliteit.** `styling-bloemvaas-en-coupes` en `mini-desserts-nude-parels` zijn telefoonfoto's in hard zonlicht tegen een bakstenen muur. Ze staan er wel in, maar niet als omslag. Wil ze ze houden? |
| 16 | **Gewenste live-datum**, en **toegang tot mijndomein** voor de DNS-records. |

### Wat ze zelf kan doen zodra er materiaal is

- **Foto's toevoegen** — `/admin/galerij`, gelegenheid kiezen, *Foto's kiezen*. Let op: geen HEIC.
- **De drie foto's bovenaan de homepage kiezen** — `/admin/instellingen`, blok *Bovenaan de
  homepage*, veld *Foto's bovenaan*. Laat ze leeg en de site pakt de uitgelichte foto's.
- **De coverfoto van een pakket kiezen** — `/admin/pakketten`, pakket openen, blok *Coverfoto*.
- **De omslag wisselen** — het afbeelding-icoon op een foto.
- **Een gelegenheid weer zichtbaar maken** — zodra er foto's onder staan.
- **Prijzen invullen en een pakket aanzetten** — `/admin/pakketten`.
- **Reviews toevoegen** — `/admin/reviews`, met toestemming van de persoon in kwestie.
- **Over-tekst en contactgegevens** — `/admin/instellingen`.

---

## De scripts

| Script | Wat |
|---|---|
| `npx tsx scripts/import-klantfotos.ts` | Foto's uit `uploads/content/fotos/` importeren. Idempotent, met `--dry-run` en `--verwijder`. Zet ook de omslagen en verbergt lege gelegenheden. |
| `npx tsx scripts/seed-klantcontent.ts` | Intro-teksten, zes pakketten, taartprijzen en de hero-tagline. Idempotent; raakt prijzen en btw die zij zelf invulde niet aan. |
| `npm run seed:demo -- --verwijder` | De oude democontent verwijderen. Is al gedraaid; er staat niets meer van. |
| `npx tsx scripts/seed-demo-grazefotos.ts` | 🔴 **Tijdelijk.** Drie Unsplash-foto's bij de graze-pakketten, omdat er geen eigen grazing-foto's zijn. Ze staan onder een verborgen gelegenheid en dragen `source: "demo"`. Weg met `--verwijder`. |
| `npm run check:demo -- --strict` | Controleert de gebouwde bundel **en** de database op demo-materiaal. Faalt nu bewust op de drie graze-foto's. |
