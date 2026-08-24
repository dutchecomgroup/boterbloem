> **Status:** actief — stap 1 en 2 af, stap 3 open (en waarschijnlijk niet nodig)
> **Thema:** 🖼️ portfolio
> **Laatst bijgewerkt:** 2026-08-25
> **Afhankelijk van:** [portfolio-categorie-albums](../1-klaar-voor-livegang/portfolio-categorie-albums.md) — die laag staat er al
> **Effort-schatting:** stap 1 gedaan; stap 2 ~4 uur, stap 3 pas als er content is

# Een album als verhaal — portfolio met meer tekst

## Waar dit vandaan komt

Bij het bekijken van `/galerij/babyshower` op 25-08: *"ook wil ik natuurlijk teksten bij een
galerij kunnen plaatsen? … Het moet een soort blog optie ook worden zeg maar."*

**Wat er al is.** `gallery_albums` heeft `title`, `eventDate` en `description`, allemaal
bewerkbaar in het galerijscherm en zichtbaar op de publieke pagina. De omschrijving staat sinds
25-08 als eigen gecentreerde alinea onder de titel met een leesbare regellengte, in plaats van
als losse regel naast de datum. Eén doorlopend tekstblok per event kan dus al.

**Wat er niet is.** Alles wat een verhaal een verhaal maakt: tussenkoppen, tekst *tussen* de
foto's, een eigen webadres per event, en vindbaarheid.

## ✅ Besloten 25-08: portfolio met meer tekst

De gebruiker koos de eerste kolom: *"portfolio met meer tekst — ik wil bij de events of de
galerijen tekst kunnen plaatsen, zodat het ook informatie heeft."* Geen losse artikelen, geen
eigen blog-overzicht. De tabel hieronder blijft staan omdat de tweede kolom een mogelijke
uitbreiding is, niet een andere bouw.

| | Portfolio met meer tekst | Blog |
|---|---|---|
| Eenheid | het uitgevoerde event | een artikel, ook zonder event |
| Waar te vinden | onder een gelegenheid | eigen overzicht, nieuwste eerst |
| Webadres | `/galerij/babyshower` | `/verhalen/de-babyshower-van-lisa` |
| Onderwerpen | alleen wat ze gemaakt heeft | ook "vijf ideeën voor een grazing table" |
| Waarvoor | de bezoeker overtuigen | gevonden worden in Google |

Reden om hier te beginnen: ze heeft nog nauwelijks foto's aangeleverd, en een blog die
leegblijft is slechter dan geen blog. Als een album eenmaal losse tekstblokken en een eigen
adres heeft, is de stap naar "artikel zonder foto's" klein.

## Voorstel — in drie stappen, elk apart bruikbaar

### ✅ Stap 1 · Tekst tussen de foto's — **af (25-08)**

`gallery_albums.description` is één veld: tekst vóór alle foto's, of niets. Een verhaal wil
tekst *tussen* de beelden.

**Gebouwd:** `gallery_albums.blocks jsonb` — een geordende lijst met `kop`, `tekst` en
`fotos`. `description` bleef bestaan als korte samenvatting voor de tegel.

`blocks = NULL` betekent "nog niet ingedeeld": het album wordt dan getoond zoals voorheen, dus
bestaande albums breken niet. Blokken **bezitten** geen foto's maar verwijzen ernaar; wat in
geen blok staat komt onderaan, zodat een latere upload nooit onzichtbaar wordt. Het
beheerscherm meldt dat expliciet.

Onderweg bleek dat twee tekstvelden al in de database zaten maar nergens in te vullen waren:
`gallery_categories.description` (de inleiding boven een gelegenheid) en
`gallery_items.caption` (bijschrift per foto). Beide zijn nu bewerkbaar.

> Bewust jsonb en geen aparte tabel: de volgorde is de betekenis, en een lijst met een
> `sort_order`-kolom is precies waar herordenen fout gaat — dat is in dit project al een keer
> gebeurd met `sortOrder ± 1` in het galerijscherm.

**Scherm:** blokken toevoegen, herordenen en verwijderen in het albumformulier.

### ✅ Stap 2 · Eigen adres per event — **af (25-08)**

Nu is `/galerij/babyshower` één pagina met alle events eronder. Voor delen én voor Google moet
één event een eigen adres krijgen: `/galerij/babyshower/lisa-en-mark`. De slug staat al op het
album.

**Gebouwd:** `/galerij/:categorie/:event`. De gelegenheid-pagina toont nu **event-tegels** in
plaats van alle events onder elkaar met al hun foto's.

De slug beweegt niet mee met de titel — dezelfde regel als bij categorieën. En omdat
`gallery_albums_cat_slug_unique` al bestond, gaf een tweede event met dezelfde titel een 500;
dat is nu automatische nummering (`sweet-16-2`).

**Nog open binnen deze stap:** `sitemap.xml` uit de database in plaats van statisch, en Open
Graph-tags per event. Beide pas zinnig als er echte foto's staan.

Hoort erbij: `sitemap.xml` uit de database in plaats van statisch, en Open Graph-tags per event
zodat een gedeelde link een foto en een titel toont.

### ⏳ Stap 3 · Artikelen zonder event — **niet meer in scope tenzij de klant erom vraagt**

Pas als er echte content staat. Een `published`-datum, een overzicht op nieuwste-eerst, en een
album dat geen foto's hoeft te hebben.

## Wat níét

- **Geen rich-text-editor.** Vet en cursief in een `contenteditable` is een bron van rommelige
  HTML en een aanvalsvlak. Platte tekst met regeleindes en tussenkoppen als eigen bloksoort.
- **Geen reacties.** Dat is moderatiewerk dat niemand hier gaat doen.
- **Geen tweede navigatie-item** zolang stap 3 er niet is — een menu-item "Verhalen" dat naar
  drie regels tekst leidt, doet meer kwaad dan goed.

## Verificatie

- [x] Album met tekstblokken en fotoblokken staat in de bedoelde volgorde — getest tegen dev:
      tekst → 2 foto's → tussenkop → tekst → 1 foto, met `<h3>`/`<p>` op de juiste plek
- [x] Album zonder blokken toont gewoon `description` + foto's — bestaande albums breken niet
- [x] Foto buiten de blokken verschijnt onderaan in plaats van te verdwijnen
- [x] Ongeldige bloksoort geeft een 400, niet een kapotte publieke pagina
- [ ] Blokken herordenen blijft kloppen na verversen — nog niet met de muis doorlopen
- [ ] Eigen adres deelt goed: Open Graph toont titel en coverfoto
- [ ] Slug beweegt **niet** mee met een titelwijziging
- [ ] Leeg album, album zonder foto's en album zonder tekst geven alle drie iets leesbaars
- [x] 375 px breed: geen horizontaal schuiven
