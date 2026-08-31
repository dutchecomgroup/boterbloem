# Portfolio per gelegenheid — categorie → album → foto's

> **Status:** ✅ **Afgerond** — gebouwd 25-08, live sinds 31-08.
> **Thema:** 🖼️ portfolio
> **Laatst bijgewerkt:** 2026-08-25
> **Afhankelijk van:** fase 1 (datamodel)
> **Effort-schatting:** ~1,5 dag

## Context

Uit de meeting van 24-08:

> *"Bijvoorbeeld bij Babyshower, niet een los event zien maar meer dat je de optie biedt voor
> een babyshower met een weergave van meerdere events."*

De bezoeker komt binnen op de **gelegenheid** en wil dan **variatie** zien: meerdere echt
uitgevoerde events binnen die gelegenheid, elk met eigen foto's. Dat is iets anders dan één
grote hoop foto's met een filter erop.

**Wat er nu staat.** [`gallery_categories`](../../../shared/schema.ts) is ingedeeld op
**taart-type** — bruidstaarten, verjaardagstaarten, mini-desserts, cupcakes, party-setups,
overig. `gallery_items` hangt met `categoryId` direct onder een categorie; er is geen laag
ertussen. De publieke [`GalleryPage.tsx`](../../../client/src/pages/public/GalleryPage.tsx)
haalt alles op via `GET /api/public/gallery` en filtert client-side op categorie in één
metselwerk-grid. Er is geen manier om te zien welke foto's bij hetzelfde event horen.

Daarbovenop toont de site nu **stockfoto's van Unsplash** via
`demoGallery.ts`. **Dat bestand bestaat niet meer** — het is op 27-08 verwijderd toen de
site op haar eigen foto's ging draaien. De types die eruit kwamen staan nu in
[`lib/galerij.ts`](../../../client/src/lib/galerij.ts).

> **✅ Besloten 25-08: we bouwen door op die demo-foto's.** Het portfolio wordt gebouwd en
> getoond met opvulmateriaal tot de klant haar eigen foto's aanlevert. Dat haalt dit plan van
> het kritieke pad af — het kan starten zodra fase 1 klaar is.
>
> 🚫 **Harde grens:** demo-materiaal mag **niet mee naar de publieke live site**. Andermans
> taarten tonen als haar werk misleidt bezoekers die daarop een offerte aanvragen. Staat als
> blokkerende stap in [../../deployment/testscript-master.md](../../deployment/testscript-master.md) §8.8.

> 🐛 **Bevinding 24-08: categorieën zijn niet te beheren in het beheerpaneel.**
> [`GalleryAdminPage.tsx`](../../../client/src/pages/admin/GalleryAdminPage.tsx) laadt
> categorieën alleen in om twee keuzelijsten te vullen (regel 68 en 126) — er is geen knop om
> er een aan te maken, te hernoemen of te verwijderen. De routes bestaan wél
> ([`gallery.ts:43-73`](../../../server/routes/admin/gallery.ts)), er roept alleen niets ze
> aan. De huidige zes categorieën komen uit
> [`seed-admin.ts`](../../../scripts/seed-admin.ts) en zijn eenmalig ingezet. Dit wordt
> opgelost in fase C hieronder — de klant kan tot die tijd geen gelegenheden toevoegen.

## Scope

**Wel:**
- Nieuwe album-laag tussen categorie en foto
- Categorieën omzetten van taart-type naar gelegenheid, inclusief datamigratie van bestaande foto's
- Beheerscherm: albums aanmaken onder een categorie, foto's toewijzen, cover kiezen, volgorde
- Publiek: `/galerij` toont gelegenheid-tegels, `/galerij/:slug` toont de albums van die gelegenheid
- Stockfoto-opvulling achter een schakelaar, en eruit zodra er echt materiaal is

**Niet:**
- Foto's slepen om te herordenen (de bestaande `/reorder`-route met op-en-neer-knoppen volstaat)
- Watermerken, download-beveiliging
- Losse detailpagina per album met eigen URL — albums renderen als blokken binnen de categoriepagina

## Aanpak

### Fase A — Schema (onderdeel van de gebundelde migratie in fase 1)

Nieuwe tabel `gallery_albums`:

| Kolom | Type | Toelichting |
|---|---|---|
| `id` | serial pk | |
| `categoryId` | integer → `gallery_categories.id` | `onDelete: cascade` |
| `slug` | varchar(120) | uniek binnen categorie |
| `title` | varchar(200) | "Sweet table Lisa" |
| `eventDate` | date | wanneer het event was, nullable |
| `description` | text | de ene zin onder het album |
| `coverItemId` | integer → `gallery_items.id` | `onDelete: set null` |
| `sortOrder` | integer | default 0 |
| `published` | boolean | default true |
| `createdAt` | timestamp | |

Op `gallery_items`: `albumId` (integer → `gallery_albums.id`, `onDelete: set null`,
nullable — een foto mag los onder een categorie blijven hangen).

Op `gallery_categories`: `description` (text) en `published` (boolean, default true), zodat
een gelegenheid een introtekst kan krijgen en tijdelijk verborgen kan worden.

Index op `gallery_albums.categoryId` en op `gallery_items.albumId`.

### Fase B — Van taart-type naar gelegenheid

De huidige zes categorieën zijn taart-type, de nieuwe zijn gelegenheid. Dat is geen
hernoeming maar een herindeling.

**De lijst hoeft niet vooraf vast te staan** (besloten 25-08). We seeden een startset en
zodra fase C klaar is beheert de klant ze zelf. Startset:

`babyshower` · `bruiloft` · `verjaardag` · `communie` · `doopsuiker` · `bedrijfsevent` ·
`overig`

Verder:

1. Bestaande foto's toewijzen aan de juiste gelegenheid — handmatig, het gaat om een
   handjevol items
2. Oude taart-type-categorieën op `published: false` tot ze leeg zijn, dan verwijderen

Doen we dit vóórdat de echte foto's binnenkomen, dan is er niets te migreren en vervalt
stap 1.

> ⚠️ **De slug zit in het webadres** (`/galerij/babyshower`). Vóór de livegang is hernoemen
> gratis; daarna maakt het gedeelde links en zoekresultaten ongeldig. Twee dingen om bij het
> bouwen te regelen: bij hernoemen in het beheerscherm de slug **niet** automatisch
> meeveranderen met de naam, en een korte waarschuwing tonen als iemand de slug van een
> gepubliceerde categorie tóch aanpast.

### Fase C — Beheerkant (~0,5 dag)

[`GalleryAdminPage.tsx`](../../../client/src/pages/admin/GalleryAdminPage.tsx) wordt
tweelaags: links de gelegenheden, per gelegenheid de albums, per album de foto's.

**Categorie-beheer hoort hier expliciet bij** — dat is de bevinding hierboven, en het is de
reden dat de lijst gelegenheden geen beslispunt vooraf meer is. De routes `POST`, `PATCH` en
`DELETE /categories` bestaan al in
[`gallery.ts:43-73`](../../../server/routes/admin/gallery.ts); er moet alleen een scherm
omheen dat ze aanroept: toevoegen, hernoemen, volgorde, verwijderen, en een introtekst per
gelegenheid.

> Verwijderen van een categorie waar nog albums onder hangen: de foreign key staat op
> `set null`, dus die albums verdwijnen niet maar raken los. Vraag om bevestiging en meld
> hoeveel albums het betreft, in plaats van stilzwijgend loskoppelen.

Nieuwe routes onder `server/routes/admin/gallery.ts`, in het stramien van de bestaande
categorie-routes daar:

- `GET /api/admin/gallery/albums` — alle albums, optioneel `?categoryId=`
- `POST /api/admin/gallery/albums`
- `PATCH /api/admin/gallery/albums/:id`
- `DELETE /api/admin/gallery/albums/:id` — foto's blijven bestaan, `albumId` wordt null

De bestaande upload-route krijgt een optionele `albumId` in de multipart-body, naast de
`categoryId` die er al is. Het cover-veld is een `PATCH` op het album met een `coverItemId`.

> ⚠️ Bij het uitbreiden van `PATCH /gallery/:id`: de huidige route accepteert het volledige
> insert-schema partieel, inclusief `filename`. Dat wordt in
> [security-hardening.md](security-hardening.md) dichtgezet — houd `albumId` er wél in en
> `filename` eruit.

### Fase D — Publieke kant (~0,5 dag)

`GET /api/public/gallery` levert nu een platte lijst. Wordt genest:

```
{ categories: [ { …categorie, albums: [ { …album, items: [...] } ] } ] }
```

`GET /api/public/gallery/:slug` idem, maar voor één gelegenheid.

[`GalleryPage.tsx`](../../../client/src/pages/public/GalleryPage.tsx) splitst in twee
weergaven:

- **`/galerij`** — tegels per gelegenheid met de cover van het meest recente album, aantal
  events erbij ("6 events")
- **`/galerij/:slug`** — de albums van die gelegenheid onder elkaar, elk met titel, datum,
  de ene zin, en een rij foto's. De bestaande lightbox blijft.

Het bestaande metselwerk-grid en de lightbox uit `GalleryPage.tsx` blijven hergebruikt; de
`imageSrc()`-helper uit `demoGallery.ts` verhuist naar `client/src/lib/images.ts` zodat hij
blijft bestaan als de demo-data verdwijnt.

### Fase E — Demo-materiaal beheersbaar maken

We bouwen door op demo-content, dus die moet mee-evolueren met de nieuwe structuur én
onmiskenbaar herkenbaar blijven als opvulling.

- **Demo-albums.** `demoGallery.ts` levert nu een platte lijst met een `categoryId`. Die
  wordt uitgebreid tot demo-**albums** per gelegenheid — twee of drie per categorie — zodat
  de nieuwe weergave ook met opvulmateriaal klopt en je kunt zien of het ontwerp werkt bij
  meerdere events naast elkaar.
- **Eén schakelaar.** De terugval naar demo-content loopt nu via `withFallback()`, verspreid
  over drie pagina's. Dat wordt één plek, zodat "demo uit" straks één wijziging is en geen
  zoektocht.
- **Zichtbare melding in het beheerscherm** zolang demo-content actief is: *"De site toont
  nu voorbeeldfoto's. Die moeten vervangen zijn voordat de site live gaat."*
- **Vangnet bij de bouw:** een controle die faalt als er `images.unsplash.com` in de gebouwde
  bundel zit terwijl demo uit staat. Zo kan het niet per ongeluk meeliften naar productie.

`demoGallery.ts` verdwijnt helemaal in fase 7, samen met de vlag.

## Bestanden

| Bestand | Wijziging |
|---|---|
| `shared/schema.ts` | `galleryAlbums`-tabel, `albumId` op items, velden op categories, relations, Zod-schema's |
| `server/routes/admin/gallery.ts` | album-CRUD, `albumId` bij upload |
| `server/routes/public.ts` | geneste respons voor `/gallery` en `/gallery/:slug` |
| `client/src/pages/admin/GalleryAdminPage.tsx` | tweelaags beheer |
| `client/src/pages/public/GalleryPage.tsx` | splitsen in overzicht + gelegenheidpagina |
| `client/src/lib/demoGallery.ts` | `imageSrc()` eruit halen → `lib/images.ts` |
| `scripts/seed-admin.ts` | gelegenheid-categorieën als default in plaats van taart-typen |

## Verificatie

- [ ] Gelegenheid toevoegen, hernoemen, herordenen en verwijderen werkt in het beheerscherm
- [ ] Hernoemen van een gelegenheid verandert de slug **niet** automatisch mee
- [ ] Gelegenheid verwijderen met albums eronder → bevestiging met het aantal, albums blijven bestaan
- [ ] Een gelegenheid met drie albums toont op `/galerij/:slug` drie losse blokken, elk met eigen foto's
- [ ] `/galerij` toont per gelegenheid de juiste cover en het juiste aantal events
- [ ] Een foto zonder album blijft zichtbaar onder zijn gelegenheid (valt niet weg)
- [ ] Album verwijderen laat de foto's bestaan
- [ ] Foto verwijderen die cover was: album valt terug op de eerste foto, geen kapotte verwijzing
- [ ] Upload met `albumId` landt in het juiste album
- [ ] Lege gelegenheid toont een nette lege staat, geen foutmelding
- [ ] Met nul echte foto's toont de site demo-albums per gelegenheid, en meldt het beheerscherm dat
- [ ] Eén echte foto uploaden → de demo-content verdwijnt volledig, geen mengeling van echt en demo
- [x] Buildcontrole bestaat: `npm run check:demo` vindt demo-content in `dist/client/` (25-08 — ontbrak eerst)
- [ ] Met demo uit geeft `npm run check:demo --strict` groen — kan pas als er echte foto's zijn

## Effort-schatting

| Onderdeel | Inschatting |
|---|---|
| Schema + relations + Zod | 1 uur (rijdt mee in fase 1) |
| Album-CRUD server | 2 uur |
| Beheerscherm tweelaags | 3 uur |
| Publieke galerij splitsen | 3 uur |
| Datamigratie + seed | 1 uur |
| **Totaal** | **~1,5 dag** |
