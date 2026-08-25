# Content-checklist — wat we van de klant nodig hebben

> **Laatst bijgewerkt:** 2026-08-25
> **Komt voort uit:** [2026-08-24-meeting-wensen.md](2026-08-24-meeting-wensen.md)

Deze lijst loopt mee met
[../komende-plannen/werkblok-huidig.md](../komende-plannen/werkblok-huidig.md).

**Sinds 25-08 blokkeert het materiaal het bouwen niet meer** — we werken door op
demo-content en vullen het echte materiaal in zodra het er is. Wat de lijst nu bepaalt is
niet wanneer we kunnen bouwen, maar **wanneer de site live kan**.

Werk de statuskolom bij zodra iets binnenkomt: ⏳ open · 📥 ontvangen · ✅ verwerkt.

---

## Statusoverzicht

| Wat | Nodig voor | Status | Opmerking |
|---|---|---|---|
| Foto's, gegroepeerd per event | **livegang** | ⏳ open | Bouwen kan door op demo — zie de eisen hieronder |
| ~~Definitieve lijst gelegenheden~~ | — | ✅ **vervalt** | Startset wordt geseed, zij past het zelf aan in het beheerpaneel |
| Vanaf-prijzen per pakket | fase 3 | ⏳ open | **Vier** pakketten sinds Grazing Table erbij kwam. Er staan nu demo-prijzen |
| "Wat zit er in het pakket"-regels | fase 3 | ⏳ open | 4–8 regels per pakket |
| Basis-prijslijst taarten | fase 3 | ⏳ open | Naam + vanaf-prijs + eenheid |
| Reviews | **livegang** | ⏳ open | Minimaal 3, liefst 6. Er staan nu **vijf verzonnen** demo-reviews die weg moeten |
| Over-tekst | **livegang** | ⏳ open | 150–250 woorden |
| Contactgegevens | **livegang** | ⏳ open | Zelf in te vullen in het beheerscherm. WhatsApp-nummer is nieuw en levert een knop op |
| ~~Openingstijden~~ | — | ✅ **vervalt** | Veld is 25-08 verwijderd: een atelier op afspraak heeft ze niet |
| **Btw-verdeling per pakket** | **livegang** | ⏳ open | Welk deel van de prijs is eten (9%) en welk deel styling en opbouw (21%). Met haar boekhouder afstemmen |
| **Btw-tarief per taart** | **livegang** | ⏳ open | Meestal 9%; in te stellen op `/admin/producten` |
| ~~Beslissing mail-hosting~~ | — | ✅ **beslist 25-08** | Buiten scope — blijft Gmail op haar telefoon |
| E-mailadres voor op de contactpagina | **livegang** | ⏳ open | Dit is wat de `mailto:`-link opent |
| Toegang mijndomein (DNS) | fase 0 | ⏳ open | Inloggegevens of iemand die de records zet |
| Logo in vectorformaat | **livegang** | ⏳ open | Voor favicon + voorbeeldweergave bij delen |
| Gewenste live-datum | planning | ⏳ open | |

**Wat er nog écht blokkeert vóór livegang:** foto's, prijzen, de btw-verdeling, reviews,
over-tekst en contactgegevens. Alles wat daar niet in staat, kunnen we voorbouwen.

> 🔴 **Sinds 25-08 staat er democontent in de dev-database**: 36 stockfoto's en vijf verzonnen
> reviews. Die zijn er om te laten zien hoe de site eruit gaat zien, en ze moeten er vóór de
> livegang uit met `npm run seed:demo -- --verwijder`.

---

## Foto's — de eisen

Dit is het belangrijkste item op de lijst, en het item waar de meeste misverstanden
ontstaan. Concreet:

**Per event een eigen mapje.** Niet één grote map met alles door elkaar. De site toont per
gelegenheid meerdere uitgevoerde events, dus we moeten weten welke foto bij welk event
hoort. Mapnaam bijvoorbeeld: `babyshower-lisa-maart-2026`.

**Per event graag ook:**
- de gelegenheid (babyshower / bruiloft / verjaardag / …)
- ongeveer wanneer het was
- één zin die het event beschrijft — die komt onder het album te staan
- welke foto de "cover" mag zijn

**Technisch:**
- **liggend én staand** door elkaar is prima, allebei bruikbaar
- **minimaal 1600 pixels** aan de lange zijde — kleiner wordt onscherp op grote schermen
- **origineel bestand**, niet een WhatsApp-doorstuur (die comprimeert hard)
- JPG, PNG of HEIC; wij zetten het automatisch om
- 4–10 foto's per event is een goede hoeveelheid

**Wat er nu staat:** de site toont stockfoto's als opvulling, en dat blijft zo tijdens het
bouwen — besloten 25-08. Zo kunnen we het portfolio afmaken en kan zij zien hoe het eruit gaat
zien voordat ze een fotoshoot plant.

> ⚠️ **Die foto's mogen niet mee naar de publieke live site.** Het zijn taarten van anderen,
> en die tonen als haar werk misleidt bezoekers die op basis daarvan een offerte aanvragen.
> Het staat als blokkerende stap in het testscript (§8.8): geen echte foto's, geen livegang.

**Praktisch:** we hebben niet meteen alles nodig. Twee of drie events met goede foto's is al
genoeg om de site echt te maken; de rest kan daarna aangevuld worden.

---

## Gelegenheden — startset, zelf aan te passen

**Dit hoeft niet vooraf vast te staan.** We zetten onderstaande set klaar als beginpunt, en
zodra het categorie-beheer in fase 2 klaar is kan ze zelf gelegenheden toevoegen, hernoemen
en verwijderen. Een album naar een andere gelegenheid verplaatsen is een keuzelijst.

Startset op basis van de meeting:

- Babyshower
- Bruiloft
- Verjaardag
- Communie / lentefeest
- Doopsuiker / geboorte
- Bedrijfsevent
- Overig

Deze lijst vult het portfolio én de keuzes in het contactformulier. Wijzigt ze hem later, dan
verandert dat mee.

> Eén technisch punt voor ná de livegang: de naam van een gelegenheid zit in het webadres
> (`/galerij/babyshower`). Vóór de livegang kan er vrij aan geschoven worden; daarna maakt
> hernoemen een gedeelde link ongeldig. Zie
> [../komende-plannen/1-klaar-voor-livegang/portfolio-categorie-albums.md](../komende-plannen/1-klaar-voor-livegang/portfolio-categorie-albums.md).

---

## Pakketten — wat we per pakket nodig hebben

Voor elk van de drie pakketten (normale sweet table, XL table, bruiloft table):

| Veld | Voorbeeld |
|---|---|
| Naam | Sweet Table XL |
| Eén zin eronder | Voor grotere feesten vanaf 40 gasten |
| Vanaf-prijs | € 275 |
| Prijs-eenheid | vanaf / per persoon |
| Voor hoeveel personen | 40–80 |
| Wat zit erin | 4–8 opsommingsregels |
| Welke foto hoort erbij | verwijzing naar een foto uit het portfolio |

De vanaf-prijs is nadrukkelijk een **richtprijs** — de site vermeldt erbij dat het pakket
aangevuld kan worden.

---

## Taarten — basis-prijslijst

Klein blok op de site, onder de tables. Per regel:

| Veld | Voorbeeld |
|---|---|
| Naam | Bruidstaart op maat |
| Vanaf-prijs | € 4,50 |
| Eenheid | per persoon |
| Korte omschrijving | optioneel, één zin |

---

## Reviews

Per review:

- **naam** van de klant (voornaam volstaat)
- **gelegenheid** ("Bruiloft, juni 2026")
- **de tekst** zelf — 2 tot 4 zinnen leest het prettigst
- eventueel een **cijfer** 1–5

Minimaal drie om het blok gevuld te krijgen; zes maakt het geloofwaardiger. Bestaande
reacties uit WhatsApp of Instagram mogen ook — wel even toestemming vragen aan de persoon
in kwestie voordat we een naam op de site zetten.

---

## Mail — wat we níét nodig hebben

Voor de duidelijkheid, want het scheelt haar een vraag: we hebben **geen toegang tot haar
mail nodig**. Geen wachtwoord, geen app-wachtwoord, geen koppeling. Mail valt buiten scope
(besloten 25-08) — ze blijft gewoon Gmail op haar telefoon gebruiken.

Het enige wat we nodig hebben is het **e-mailadres dat op de contactpagina komt te staan**.
Dat wordt een klikbare link die bij een bezoeker de mail-app opent.

> **Wel goed om te weten:** de site stuurt haar geen berichtje als er een aanvraag
> binnenkomt. Nieuwe aanvragen staan in het beheerpaneel onder *Aanvragen*, met een teller op
> het dashboard. Ze moet daar dus zelf even kijken. Wil ze dat later toch anders, dan is dat
> een losse toevoeging van ongeveer een dagdeel.

---

## Teksten

**Over-tekst:** 150–250 woorden over wie ze is en hoe ze werkt. Dit is na de foto's het
meest gelezen stuk van de site.

**Per gelegenheid** mag een korte introductie (2–3 zinnen), maar dat kan ook later — we
starten met een neutrale tekst en verfijnen die als de site staat.
