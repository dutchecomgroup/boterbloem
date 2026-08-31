# Aanvraagflow — gelegenheid en pakket in het formulier

> **Status:** ✅ **Afgerond** — gebouwd 25-08, live sinds 31-08.
> **Thema:** 📨 aanvragen
> **Laatst bijgewerkt:** 2026-08-25
> **Afhankelijk van:** fase 1 (datamodel) · [pakketten-en-prijzen](pakketten-en-prijzen.md)
> **Effort-schatting:** ~0,5 dag

## Context

Uit de meeting van 24-08:

> *"Op de website wordt niet besteld, alleen een contactformulier. Kan wel aangegeven worden
> wat voor feest het is, en wat voor pakketten ze ongeveer wil hebben."*

Het formulier bestaat en werkt: [`ContactPage.tsx`](../../../client/src/pages/public/ContactPage.tsx)
valideert met Zod, `POST /api/public/contact` schrijft in `contact_requests`, en het
beheerscherm toont de aanvragen. `eventType` en `persons` zitten er al in.

Wat ontbreekt: de bezoeker kan geen **pakket** aanwijzen, de gelegenheid is een vrij tekstveld
in plaats van een keuze uit de echte categorieën, en er is **geen datumcheck** tegen de
levertijd.

## 📭 Geen mailnotificatie

> **Besloten 25-08: mail valt volledig buiten scope.** Er wordt géén mailtje verstuurd als er
> een aanvraag binnenkomt. Aanvragen komen alleen binnen in het beheerpaneel onder
> *Aanvragen*, en de afspraak is dat ze daar zelf kijkt.
>
> Dat scheelt ongeveer drie uur werk, een verzendlaag, een omgevingsschakelaar en een
> app-wachtwoord in `.env`.
>
> **Wat dat wél betekent:** er is geen enkel signaal naar buiten. Een aanvraag die op zaterdag
> binnenkomt ligt er tot ze inlogt. Bij een bedrijf dat op aanvragen draait is dat het risico
> dat hier tegenover de eenvoud staat — het is een bewuste keuze, geen vergissing, en dit is
> de plek waar dat vastligt voor als de vraag later terugkomt.
>
> **Als het alsnog nodig blijkt:** de aangewezen plek is `POST /api/public/contact` in
> [`server/routes/public.ts`](../../../server/routes/public.ts), ná het wegschrijven van de rij
> en met een `.catch()` eromheen — een mail die niet weggaat mag de aanvraag van een klant
> nooit laten mislukken. Reken op ~3 uur plus een verzendkanaal.

Het contactformulier staat verder publiek open zonder rem — geen honeypot, geen
snelheidsbegrenzing. Dat wordt in [security-hardening.md](security-hardening.md) opgelost;
hier alleen genoemd omdat het hetzelfde formulier raakt.

## Scope

**Wel:**
- Gelegenheid als keuze uit de echte categorieën
- Pakket-voorkeur als keuze, voor-geselecteerd vanaf `/aanbod`
- Datumcheck tegen de levertijd-regel — waarschuwing, geen blokkade
- Gelegenheid en pakket zichtbaar in het beheerscherm

**Niet:**
- **Mail, in welke vorm dan ook** — zie hierboven
- Meerstapsformulier of wizard
- Bestanden meesturen (inspiratiefoto's) — leuk, maar het brengt uploadbeveiliging met zich
  mee; apart plan als de behoefte er is

## Aanpak

### Fase A — Schema (onderdeel van de gebundelde migratie in fase 1)

Op `contact_requests`:

| Kolom | Type | Toelichting |
|---|---|---|
| `packageId` | integer → `packages.id` | `onDelete: set null`, nullable |
| `categoryId` | integer → `gallery_categories.id` | `onDelete: set null`, nullable — de gelegenheid |

`eventType` (varchar) blijft bestaan als vrij tekstveld voor "anders, namelijk" en voor de
bestaande aanvragen — die hebben nog geen `categoryId` en moeten leesbaar blijven.

### Fase B — Formulier (~3 uur)

In [`ContactPage.tsx`](../../../client/src/pages/public/ContactPage.tsx), binnen het
bestaande react-hook-form + Zod-stramien:

- **Gelegenheid** — select gevuld uit `GET /api/public/gallery` (categorieën), met "Anders"
  dat het vrije `eventType`-veld toont
- **Pakket-voorkeur** — select uit `GET /api/public/packages`, met een expliciete optie *"Weet
  ik nog niet"*. Die optie moet er zijn: iemand die het nog niet weet mag niet het gevoel
  krijgen dat ze eerst iets moet uitzoeken
- **Datum** — bij een datum binnen de levertijd-termijn een waarschuwing onder het veld, geen
  blokkade. Termijn uit `site_settings.levertijden` (zie
  [agenda-boekingen.md](agenda-boekingen.md))

**Voor-selecteren vanaf `/aanbod`:** de *Vraag aan*-knop op een pakketkaart linkt naar
`/contact?pakket=<slug>`. De pagina leest de query-parameter en zet de select goed. Zo komt
de aanvraag binnen met de context waar de bezoeker net naar keek.

De server valideert opnieuw — `insertContactRequestSchema` in `shared/schema.ts` is de bron,
en `packageId` en `categoryId` moeten daar bestaan én naar bestaande rijen wijzen.

### Fase C — Beheerscherm (~1 uur)

[`ContactRequestsPage.tsx`](../../../client/src/pages/admin/ContactRequestsPage.tsx) toont
gelegenheid en gewenst pakket per aanvraag, en krijgt een filter op gelegenheid. De bestaande
*omzetten naar boeking*-knop neemt `packageId` mee naar de nieuwe boeking.

Omdat er geen notificatie is, is **de teller op het dashboard het enige signaal** dat er iets
ligt. De tegel *Nieuwe aanvragen* linkt al naar dit scherm; controleer bij het bouwen dat die
telling klopt en direct opvalt.

## Bestanden

| Bestand | Wijziging |
|---|---|
| `shared/schema.ts` | `packageId` + `categoryId` op contact_requests, Zod bijwerken |
| `server/routes/public.ts` | uitgebreide validatie |
| `client/src/pages/public/ContactPage.tsx` | selects, datumcheck, query-parameter |
| `client/src/pages/public/ServicesPage.tsx` | *Vraag aan* → `/contact?pakket=<slug>` |
| `client/src/pages/admin/ContactRequestsPage.tsx` | gelegenheid + pakket tonen, filter |
| `server/routes/admin/orders.ts` | `packageId` meenemen in `/from-contact` |

## Verificatie

- [ ] Aanvraag met gelegenheid + pakket komt compleet aan in het beheerscherm
- [ ] `/contact?pakket=sweet-table-xl` selecteert het juiste pakket
- [ ] Onbekende slug in de query-parameter → geen crash, select blijft leeg
- [ ] "Weet ik nog niet" verzendt zonder `packageId` en zonder foutmelding
- [ ] "Anders" bij gelegenheid toont het vrije tekstveld en slaat dat op
- [ ] Datum binnen de termijn → waarschuwing, verzenden lukt nog steeds
- [ ] Bestaande aanvragen zonder `categoryId` renderen nog steeds netjes
- [ ] Pakket verwijderd dat aan een aanvraag hing → aanvraag blijft leesbaar
- [ ] Dashboard-tegel *Nieuwe aanvragen* telt correct — dat is het enige signaal dat er is

## Effort-schatting

| Onderdeel | Inschatting |
|---|---|
| Schema (rijdt mee in fase 1) | ½ uur |
| Formulier + selects + datumcheck | 3 uur |
| Beheerscherm | 1 uur |
| **Totaal** | **~0,5 dag** |

Was ~1 dag; de mailnotificatie eruit scheelt ongeveer drie uur.
