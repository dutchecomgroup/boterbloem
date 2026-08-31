# Klantenbeheer — de restpunten

> **Status:** 🎯 Uitgewerkt, klaar om te starten
> **Thema:** 👥 klanten
> **Laatst bijgewerkt:** 2026-08-24
> **Afhankelijk van:** —
> **Effort-schatting:** ~0,5 dag

## Context

Klantenbeheer stond op de wensenlijst van 24-08 en **werkt al**: `customers`-tabel,
CRUD-routes, en een beheerscherm in
[`CustomersPage.tsx`](../../../client/src/pages/admin/CustomersPage.tsx). Dit plan gaat
alleen over drie restpunten die tijdens de code-doorloop van 24-08 opvielen.

Geen afhankelijkheden — dit kan er op elk moment tussendoor.

## De drie punten

### 1. Terugkerende klanten worden gedupliceerd

[`POST /api/admin/orders/from-contact`](../../../server/routes/admin/orders.ts) maakt **altijd
een nieuwe klant** aan uit de contactgegevens van de aanvraag:

```ts
const [customer] = await db.insert(customers).values({ name: cr.name, email: cr.email, … })
```

Bij een klant die voor de tweede keer aanvraagt — en dat is precies het soort klant dat je wil
herkennen — komt er een dubbele rij bij. De omzet per klant klopt dan niet meer en de
klantenlijst raakt vervuild.

**Oplossing:** vóór het aanmaken zoeken op e-mailadres. Gevonden? Dan de bestaande klant
gebruiken en de aanvraag als notitie toevoegen in plaats van de bestaande notities te
overschrijven. Niet gevonden? Aanmaken zoals nu. De respons krijgt er een veld bij dat
aangeeft of het een bestaande klant was, zodat het beheerscherm dat kan tonen: *"Gekoppeld
aan bestaande klant"*.

Een e-mailadres is hier goed genoeg als sleutel; het formulier maakt het verplicht en valideert
het al via `insertContactRequestSchema`.

### 2. Klanthistorie is er wel, maar nergens te zien

`GET /api/admin/customers/:id` levert de klant **inclusief al zijn boekingen**, gesorteerd op
datum — dat staat er al in [`customers.ts:17-31`](../../../server/routes/admin/customers.ts).
Alleen wordt die route door de frontend nergens aangeroepen. Het klantenscherm is een platte
lijst zonder detailweergave.

**Oplossing:** klantregel klikbaar maken naar een detailscherm met de gegevens en de
boekingen-historie eronder, elk klikbaar naar de boeking. Serverwerk is nul — de route staat
er.

### 3. Geen zoekveld

Bij een handjevol klanten geen probleem, na een jaar wel. `GET /api/admin/customers` haalt
bovendien **alle** klanten op zonder paginering.

**Oplossing:** zoekveld dat client-side filtert op naam, e-mail en telefoon. Bij deze
aantallen is dat ruim voldoende en het scheelt een server-ronde. Paginering pas als het echt
nodig is — nu zou het onnodige complexiteit zijn.

## Scope

**Wel:** de drie punten hierboven.

**Niet:** notitiegeschiedenis per klant, tags of segmenten, klantwaarde-berekening, export.
Allemaal denkbaar, geen van alle gevraagd.

## Bestanden

| Bestand | Wijziging |
|---|---|
| `server/routes/admin/orders.ts` | `/from-contact` zoekt op e-mail vóór het aanmaken |
| `client/src/pages/admin/CustomersPage.tsx` | zoekveld, regels klikbaar |
| `client/src/pages/admin/CustomerDetailPage.tsx` | nieuw — gegevens + boekingenhistorie |
| `client/src/App.tsx` | route `/admin/klanten/:id` |
| `client/src/pages/admin/ContactRequestsPage.tsx` | melden dat er gekoppeld is aan een bestaande klant |

## Verificatie

- [ ] Tweede aanvraag met hetzelfde e-mailadres → **geen** tweede klantrij
- [ ] Bij koppeling blijven de bestaande notities staan, de nieuwe aanvraag komt eronder
- [ ] Nieuw e-mailadres → nieuwe klant, zoals voorheen
- [ ] Aanvraag met een e-mailadres in andere schrijfwijze (hoofdletters) koppelt óók — vergelijking hoofdletterongevoelig
- [ ] Klantdetail toont alle boekingen van die klant, nieuwste eerst
- [ ] Klant zonder boekingen toont een nette lege staat
- [ ] Zoeken op deel van een naam, e-mail en telefoonnummer werkt

## Effort-schatting

| Onderdeel | Inschatting |
|---|---|
| Ontdubbeling `/from-contact` | 1,5 uur |
| Klantdetailscherm | 2 uur |
| Zoekveld | ½ uur |
| **Totaal** | **~0,5 dag** |
