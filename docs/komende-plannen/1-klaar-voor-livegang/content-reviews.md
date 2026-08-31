# Reviews — echte reacties in plaats van verzonnen quotes

> **Status:** 🎯 Uitgewerkt, wacht op reviews van de klant
> **Thema:** ⭐ content
> **Laatst bijgewerkt:** 2026-08-24
> **Afhankelijk van:** fase 1 (datamodel) · reviews van de klant
> **Effort-schatting:** ~1 dag

## Context

Reviews stonden op de wensenlijst van 24-08, naast contactgegevens.

Wat er nu staat: een `TESTIMONIALS`-array met **verzonnen quotes**, hardcoded in
[`HomePage.tsx:121`](../../../client/src/pages/public/HomePage.tsx). Die zijn er als
opvulling gekomen om het ontwerp te kunnen beoordelen, maar het zijn geen echte reacties van
echte klanten en ze mogen **niet mee live**. Een verzonnen review op een zakelijke site is
niet alleen misleidend richting bezoekers, het is ook een risico voor haar als iemand ernaar
vraagt.

Contactgegevens zijn wél al geregeld: die komen uit `site_settings.contact`, verschijnen
automatisch in de voettekst en op de contactpagina, en zijn te beheren via het
instellingen-scherm. Daar hoeft niets aan gebouwd te worden — alleen invullen, zie de
[content-checklist](../../klant/content-checklist.md).

## Scope

**Wel:**
- `reviews`-tabel met beheerscherm
- Review-blok op de homepage en op `/aanbod`
- De verzonnen quotes eruit

**Niet:**
- Reviews die bezoekers zelf achterlaten — dat vraagt moderatie en spam-afweer, en ze
  verzamelt ze nu via WhatsApp en Instagram
- Automatisch ophalen uit Google Reviews of Facebook — kan later; het `source`-veld houdt de
  deur open
- Sterrenwaardering als vindbaarheids-opmaak (schema.org) — pas zinvol met echte, verifieerbare reviews

## Aanpak

### Fase A — Schema (onderdeel van de gebundelde migratie in fase 1)

Nieuwe tabel `reviews`:

| Kolom | Type | Toelichting |
|---|---|---|
| `id` | serial pk | |
| `authorName` | varchar(120) | voornaam volstaat |
| `eventType` | varchar(120) | "Bruiloft, juni 2026" |
| `rating` | integer | 1–5, nullable |
| `body` | text | de review zelf |
| `occurredOn` | date | wanneer het event was, nullable |
| `published` | boolean | default false — bewust: publiceren is een handeling |
| `featured` | boolean | uitgelicht op de homepage |
| `sortOrder` | integer | default 0 |
| `source` | varchar(32) | `"handmatig"` \| `"google"` \| `"instagram"` |
| `createdAt` | timestamp | |

`published` staat op `false` bij aanmaken. Zo kan ze een review invoeren, teruglezen en pas
publiceren als de tekst klopt en de persoon akkoord is.

### Fase B — Server (~1,5 uur)

`server/routes/admin/reviews.ts` — CRUD in het stramien van
[`products.ts`](../../../server/routes/admin/products.ts), mounten in
`server/routes/admin/index.ts`.

In `server/routes/public.ts`: `GET /api/public/reviews` — alleen `published: true`,
gesorteerd op `sortOrder` en dan `occurredOn` aflopend.

### Fase C — Beheerscherm (~2,5 uur)

Nieuw `/admin/reviews`, naar het model van `ProductsPage.tsx`. Per regel: naam, gelegenheid,
tekst, cijfer, en schakelaars voor gepubliceerd en uitgelicht. Menu-item in `NAV` in
[`AdminLayout.tsx`](../../../client/src/components/layout/AdminLayout.tsx).

Eén zin boven het scherm die eraan herinnert dat een naam pas op de site mag met toestemming
van de persoon in kwestie.

### Fase D — Publieke kant (~2,5 uur)

De opmaak van het bestaande testimonial-blok op de homepage blijft — dat ziet er goed uit, er
verandert alleen waar de gegevens vandaan komen. De `TESTIMONIALS`-array verdwijnt en het
blok haalt de uitgelichte reviews op via TanStack Query, net als de galerij dat al doet.

Op `/aanbod` een compacter review-blok onder de pakketten (zie
[pakketten-en-prijzen.md](pakketten-en-prijzen.md), punt 6 in de pagina-opbouw).

**Bij nul gepubliceerde reviews verdwijnt het blok volledig** — geen lege staat, geen
"binnenkort reviews". Een leeg reviewblok is slechter dan geen reviewblok.

## Bestanden

| Bestand | Wijziging |
|---|---|
| `shared/schema.ts` | `reviews`-tabel, Zod-schema's, types |
| `server/routes/admin/reviews.ts` | nieuw — CRUD |
| `server/routes/admin/index.ts` | router mounten |
| `server/routes/public.ts` | `GET /reviews` |
| `client/src/pages/admin/ReviewsPage.tsx` | nieuw |
| `client/src/components/layout/AdminLayout.tsx` | menu-item |
| `client/src/App.tsx` | route `/admin/reviews` |
| `client/src/pages/public/HomePage.tsx` | `TESTIMONIALS`-array eruit, gegevens uit de database |
| `client/src/pages/public/ServicesPage.tsx` | review-blok |

## Verificatie

- [ ] Review aanmaken staat standaard op niet-gepubliceerd en is **niet** zichtbaar op de site
- [ ] Publiceren maakt hem zichtbaar; uitgelicht zet hem op de homepage
- [ ] Nul gepubliceerde reviews → blok verdwijnt volledig van beide pagina's
- [ ] `GET /api/public/reviews` levert **geen** niet-gepubliceerde reviews (ook niet in de ruwe respons)
- [ ] Volgorde in het beheerscherm komt overeen met de volgorde op de site
- [ ] Lange review (300+ woorden) breekt de opmaak niet
- [ ] Review zonder cijfer rendert netjes zonder sterren
- [ ] `grep TESTIMONIALS client/` geeft nul treffers — de verzonnen quotes zijn echt weg

## Effort-schatting

| Onderdeel | Inschatting |
|---|---|
| Schema (rijdt mee in fase 1) | ½ uur |
| Server CRUD + publieke route | 1,5 uur |
| Beheerscherm | 2,5 uur |
| Publieke blokken | 2,5 uur |
| **Totaal** | **~1 dag** |
