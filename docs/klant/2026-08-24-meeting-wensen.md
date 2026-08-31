# Meeting met de klant — 24 augustus 2026

> **Onderwerp:** wensen en scope voor de website + het beheersysteem
> **Vastgelegd:** 2026-08-24
> **Status:** verwerkt in [../komende-plannen/werkblok-huidig.md](../komende-plannen/werkblok-huidig.md)

Dit document is de **bron**. Alles wat hieronder staat komt uit het gesprek; de uitwerking
per onderwerp staat in de plan-documenten waarnaar verwezen wordt. Wijzigt de wens? Pas dan
eerst dit bestand aan, daarna het plan-document.

---

## De kern in vier zinnen

**Sweet Tables & Grazing Tables zijn de hoofdfocus.** Taarten blijven in het aanbod, maar
klein en met een eenvoudige basis-prijslijst. Het portfolio wordt getoond **per gelegenheid**
(babyshower, bruiloft) met daaronder meerdere echte events, niet als één losse verzameling
foto's. En er wordt **niet besteld op de site** — alleen een contactformulier waarin de
bezoeker aangeeft wat voor feest het is en welk pakket haar ongeveer voor ogen staat.

---

## 1. Aanbod: pakketten in plaats van losse prijzen

Ze wil richting **pakketten** werken. Denk aan:

- normale sweet table
- XL table
- bruiloft table

Elk pakket krijgt een **vanaf-prijs**. Dat geeft de klant een richtlijn zonder dat het een
vaste prijs wordt — het pakket kan altijd aangevuld worden met extra's.

> *"Hiermee is er een richtlijn voor de klant met een vanaf-prijs, kan dan aangevuld worden."*

Voor **taarten** geldt hetzelfde principe: een **basis-prijslijst**, geen pakketten. Taarten
worden klein aangeboden op de website — ze horen erbij, maar ze zijn niet waar de site over
gaat.

**Prijzen op de site zijn belangrijk.** Dit was expliciet: bezoekers moeten kunnen zien wat
iets ongeveer kost voordat ze contact opnemen.

→ [../komende-plannen/1-klaar-voor-livegang/pakketten-en-prijzen.md](../archive/planning/pakketten-en-prijzen.md)

---

## 2. Portfolio per categorie, niet per event

Dit was het duidelijkste punt van de meeting, en het wijkt af van hoe het nu gebouwd is.

> *"Bijvoorbeeld bij Babyshower, niet een los event zien maar meer dat je de optie biedt voor
> een babyshower met een weergave van meerdere events."*

De bezoeker komt binnen op de **gelegenheid** ("ik zoek iets voor een babyshower") en ziet
dan **meerdere uitgevoerde events** binnen die gelegenheid — elk met eigen foto's. Zo krijgt
ze een beeld van de variatie in plaats van één willekeurige set.

Op dit moment is de galerij ingedeeld op **taart-type** (bruidstaarten, verjaardagstaarten,
cupcakes) en is er geen groepering per event. Dat moet om.

→ [../komende-plannen/1-klaar-voor-livegang/portfolio-categorie-albums.md](../archive/planning/portfolio-categorie-albums.md)

---

## 3. Foto's

**Kwalitatief goede foto's** zijn een voorwaarde, niet een detail. De hele site leunt erop.

De upload-kant werkt al (foto's worden automatisch omgezet naar WebP en verkleind), maar er
is nog geen echt fotomateriaal. Wat er nu op de site staat zijn **stockfoto's** die als
tijdelijke opvulling dienen.

> **✅ Besloten (25-08): we bouwen door op demo-foto's.** Het portfolio wordt gebouwd en
> getoond met opvulmateriaal tot zij haar eigen foto's aanlevert. Dat haalt de foto's van het
> kritieke pad af — fase 2 kan meteen starten.
>
> ⚠️ **Wel een harde grens:** die stockfoto's mogen niet mee naar de publieke live site.
> Andermans taarten tonen als haar werk is misleidend richting bezoekers die een offerte
> aanvragen, en het is precies het soort ding waar je op aangesproken wordt. Demo-materiaal is
> prima om op te bouwen en om haar te laten zien hoe het eruit gaat zien; livegang wacht op
> echte foto's. Dat is als blokkerende stap opgenomen in het testscript (§8.8).

→ [content-checklist.md](content-checklist.md)

---

## 4. Aanvragen: contactformulier, geen bestelling

Er wordt **niet besteld** op de site. Eén contactformulier, en van daaruit persoonlijk
contact.

Wel moet de bezoeker in het formulier kunnen aangeven:

- **wat voor feest** het is (de gelegenheid)
- **welk pakket** haar ongeveer voor ogen staat

Zo komt een aanvraag binnen met genoeg context om meteen een voorstel te kunnen maken.

→ [../komende-plannen/1-klaar-voor-livegang/aanvragen-formulier-uitbreiding.md](../archive/planning/aanvragen-formulier-uitbreiding.md)

---

## 5. Levertijden

- **10 dagen van tevoren** aanvragen is de standaard
- voor **taarten is ze flexibeler**

Dit moet zichtbaar zijn op de site, en het formulier mag erop wijzen als iemand een datum
kiest die te dichtbij is. Geen harde blokkade — een waarschuwing, want ze wil zelf kunnen
beslissen of iets nog past.

→ [../komende-plannen/1-klaar-voor-livegang/agenda-boekingen.md](../archive/planning/agenda-boekingen.md)

---

## 6. Beheersysteem: klanten, agenda

Wat ze nodig heeft aan de beheerkant:

- **Klantenbeheer** — bestaat al en werkt
- **Agenda** — bestaat nog niet. Boekingen hebben wel een datum, maar er is geen
  kalenderweergave. Ze wil kunnen zien wat er aan komt, ook op haar telefoon.

→ [../komende-plannen/1-klaar-voor-livegang/agenda-boekingen.md](../archive/planning/agenda-boekingen.md)
· [../komende-plannen/1-klaar-voor-livegang/klanten-uitbreiding.md](../archive/planning/klanten-uitbreiding.md)

---

## 7. Reviews en contactgegevens

**Reviews** moeten op de site. Nu staan er verzonnen quotes in de code als opvulling — die
moeten vervangen worden door echte reviews die ze zelf kan beheren.

**Contactgegevens** worden al beheerd via het instellingen-scherm en verschijnen automatisch
in de footer en op de contactpagina. Die kant is klaar; alleen invullen.

→ [../komende-plannen/1-klaar-voor-livegang/content-reviews.md](../archive/planning/content-reviews.md)

---

## 8. Domein en mail

- Domeinnaam: **atelierboterbloem**
- Staat bij **mijndomein**, kan overgezet worden naar de hostingserver

> *"Even kijken hoe het met de mailing moet, kan dit naar de server."*

> **✅ Besloten (25-08): mail valt volledig buiten scope.**
>
> Haar mail loopt via **Gmail op haar telefoon** en blijft daar. Er komt geen mailmodule in
> het beheerpaneel, geen synchronisatie, geen mailserver op de VPS, en **geen automatische
> notificatie** bij een nieuwe aanvraag.
>
> Het enige wat er over mail in het systeem zit is de **`mailto:`-link** op de contactpagina
> en in de voettekst — die opent de mail-app van de bezoeker. Dat werkt al.
>
> **Voor de DNS betekent dit:** ⚠️ de MX- en TXT-records blijven met rust. Ze hebben niets met
> deze server te maken.
>
> **Praktisch gevolg om te weten:** nieuwe aanvragen komen alleen binnen in het beheerpaneel
> onder *Aanvragen*. Er gaat geen signaal naar buiten, dus een aanvraag ligt er tot ze
> inlogt. Bewuste keuze — vastgelegd zodat de vraag later niet opnieuw hoeft.

→ [../komende-plannen/3-onaangeraakt/infra-domein-livegang.md](../komende-plannen/3-onaangeraakt/infra-domein-livegang.md)

---

## Dekkingstabel — wens tegenover wat er nu staat

| Wens uit de meeting | Stand nu | Waar het opgepakt wordt |
|---|---|---|
| Klantenbeheer | ✅ werkt | [klanten-uitbreiding](../archive/planning/klanten-uitbreiding.md) |
| Agenda | ❌ niet aanwezig | [agenda-boekingen](../archive/planning/agenda-boekingen.md) |
| Portfolio per gelegenheid, meerdere events per gelegenheid | ⚠️ categorieën zijn taart-type, geen event-laag | [portfolio-categorie-albums](../archive/planning/portfolio-categorie-albums.md) |
| Pakketten met vanaf-prijs, aanvulbaar | ❌ niet aanwezig | [pakketten-en-prijzen](../archive/planning/pakketten-en-prijzen.md) |
| Sweet & Grazing Tables als hoofdfocus | ❌ site zet taarten voorop | [pakketten-en-prijzen](../archive/planning/pakketten-en-prijzen.md) |
| Taarten klein, met basis-prijslijst | ⚠️ productenlijst bestaat, is niet publiek zichtbaar | [pakketten-en-prijzen](../archive/planning/pakketten-en-prijzen.md) |
| Prijzen zichtbaar op de site | ❌ nergens zichtbaar | [pakketten-en-prijzen](../archive/planning/pakketten-en-prijzen.md) |
| Geen bestellen, alleen contactformulier | ✅ klopt al | — |
| Feest-type + gewenst pakket in het formulier | ⚠️ feest-type kan al, pakket niet | [aanvragen-formulier-uitbreiding](../archive/planning/aanvragen-formulier-uitbreiding.md) |
| Mail | ✅ buiten scope — `mailto:`-link werkt al | — |
| Kwalitatief goede foto's | ⚠️ upload werkt, materiaal ontbreekt | [content-checklist](content-checklist.md) |
| Reviews | ❌ nu verzonnen quotes in de code | [content-reviews](../archive/planning/content-reviews.md) |
| Contactgegevens | ✅ werkt, moet ingevuld | [content-checklist](content-checklist.md) |
| Levertijden — 10 dagen, taarten flexibeler | ❌ nergens vastgelegd | [agenda-boekingen](../archive/planning/agenda-boekingen.md) |
| Domein via mijndomein | ❌ nog niet ingericht | [infra-domein-livegang](../komende-plannen/3-onaangeraakt/infra-domein-livegang.md) |

---

## Open beslispunten

Deze vragen zijn in de meeting niet beantwoord en houden werk tegen:

| # | Vraag | Blokkeert | Wie beslist |
|---|---|---|---|
| ~~1~~ | ~~Hoe regelen we de mail?~~ | — | ✅ **Beslist 25-08: buiten scope, blijft Gmail op haar telefoon** |
| ~~2~~ | ~~Welke gelegenheden worden de definitieve categorieën?~~ | — | ✅ **Vervalt 25-08: ze beheert ze zelf.** We seeden een startset (babyshower, bruiloft, verjaardag, communie, doopsuiker, bedrijfsevent, overig); vanaf fase 2 kan ze zelf toevoegen, hernoemen en verwijderen |
| 3 | Wat zijn de vanaf-prijzen van de drie pakketten, en wat zit er precies in? | fase 3 | klant |
| 4 | Wat komt er op de basis-prijslijst voor taarten? | fase 3 | klant |
| 5 | Wat is de gewenste live-datum? | de hele planning | klant |
| 6 | Welk e-mailadres komt op de contactpagina te staan? | livegang — het is wat de `mailto:`-link opent | klant |

---

## Wat we van de klant nodig hebben

Zie [content-checklist.md](content-checklist.md) — dat is de lijst die we met haar
doorlopen, met per item de status.

**Belangrijk om te benoemen richting de klant:** het kritieke pad zit niet in het bouwwerk
maar in het materiaal. Foto's, prijzen en reviews bepalen wanneer de site live kan.
