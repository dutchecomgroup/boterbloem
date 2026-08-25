# Pending — klaar voor live

> Wat staat er klaar om naar live te gaan? Na de deploy: entry verplaatsen naar
> [history.md](history.md).
>
> **Bij het deployen:** [procedure.md](procedure.md) als stappenplan, [rollback.md](rollback.md)
> als het misgaat, [db-migraties.md](db-migraties.md) bijwerken na de migratie.
>
> 📍 Groter plaatje: [../komende-plannen/werkblok-huidig.md](../komende-plannen/werkblok-huidig.md)

---

## 🚨 Deployvolgorde

**Migratie eerst, dan pas de code.** Drizzle neemt élk schemaveld op in de SELECT, dus zodra
`shared/schema.ts` een kolom kent die de database niet heeft, breekt **elke** query op die
tabel — niet alleen de nieuwe functionaliteit. Andersom is veilig: de database mag kolommen
hebben die de code nog niet gebruikt.

```
1. pg_dump
2. sql-pending/2026-08-25-fase-1-schema.sql draaien
3. sql-pending/2026-08-25-boekingen.sql draaien
4. sql-pending/2026-08-25-btw.sql draaien
5. sql-pending/2026-08-25-regel-details.sql draaien
6. sql-pending/2026-08-25-album-blokken.sql draaien
7. sql-pending/2026-08-25-btw-per-regel.sql draaien
8. sql-pending/2026-08-25-betalingen.sql draaien
9. db-migraties.md → LIVE ✅
10. git pull && npm ci && npm run build && pm2 reload
11. Oude taart-categorieën opruimen in het galerijscherm
12. testscript-master.md doorlopen
```

De volgorde is niet vrij: `boekingen.sql` verwijst naar `packages`, en die tabel komt uit fase 1.
`btw-per-regel.sql` raakt `order_items` en `packages`, dus die twee moeten er al staan.
`betalingen.sql` legt een foreign key naar `orders` en leest `deposit_paid`; die staan er al vanaf
het begin, dus hij mag achteraan.

---

## SQL-migraties klaar voor live

| Bestand | Dev | Live | Wanneer |
|---|---|---|---|
| [`2026-08-25-fase-1-schema.sql`](sql-pending/2026-08-25-fase-1-schema.sql) | ✅ | ⏳ | 🚨 **Vóór de code.** Additief + idempotent |
| [`2026-08-25-boekingen.sql`](sql-pending/2026-08-25-boekingen.sql) | ✅ | ⏳ | 🚨 **Vóór de code, ná fase 1.** Additief + idempotent |
| [`2026-08-25-btw.sql`](sql-pending/2026-08-25-btw.sql) | ✅ | ⏳ | 🚨 **Vóór de code.** `orders.vat_rate` + `site_settings.btw` |
| [`2026-08-25-regel-details.sql`](sql-pending/2026-08-25-regel-details.sql) | ✅ | ⏳ | 🚨 **Vóór de code.** `order_items.details` + oude `·`-regels opruimen |
| [`2026-08-25-album-blokken.sql`](sql-pending/2026-08-25-album-blokken.sql) | ✅ | ⏳ | 🚨 **Vóór de code.** `gallery_albums.blocks` |
| [`2026-08-25-btw-per-regel.sql`](sql-pending/2026-08-25-btw-per-regel.sql) | ✅ | ⏳ | 🚨 **Vóór de code.** Btw op regel, pakket en product |
| [`2026-08-25-betalingen.sql`](sql-pending/2026-08-25-betalingen.sql) | ✅ | ⏳ | 🚨 **Vóór de code.** Tabel `order_payments` + betaalde aanbetalingen overgezet |
| [`2026-08-24-herstel-testdata.sql`](sql-pending/2026-08-24-herstel-testdata.sql) | n.v.t. | ✅ | Gedraaid 24-08, datacorrectie |

---

## Pending features

### 💶 Omzet zichtbaar maken — betalingen, omzetpagina, hub gerepareerd

Aanleiding: boeking ABB-2026-014 stond op `afgeleverd` met € 295,00 en er verscheen nergens
omzet. In de woorden van de gebruiker: *"Boeking is afgeleverd, maar ik zie geen omzet bij de
klant en in de hub?"*

**Twee fouten, allebei in het model.**

`orders.paid_at` werd door de hele codebase alleen **gelezen** — vier keer in `stats.ts`. Geen
route, geen script en geen migratie schreef hem ooit. De omzettegels en de 12-maandsgrafiek
filterden op `paid_at IS NOT NULL` en stonden daarmee structureel op € 0,00, voor elke boeking,
altijd. En er was geen manier om "de rest is ook betaald" vast te leggen: het model kende alleen
`deposit_amount` (afgesproken) en `deposit_paid` (binnen), dus ontvangen kon nooit meer worden dan
de aanbetaling.

Daar kwam bij dat er **twee definities van omzet** naast elkaar stonden: de hub eiste `afgeleverd`
+ `paid_at`, de klantdetailpagina keek alleen naar `afgeleverd`. Twee schermen, twee antwoorden.

**Wat er nu staat:**

- **`order_payments`** — betalingen als losse regels (bedrag, datum, wijze, notitie). Een klant die
  in twee keer betaalt past er in, en je ziet wánneer. `deposit_amount` behoudt zijn betekenis: het
  **afgesproken** bedrag dat op de offerte staat als "nu te voldoen".
- **Omzet telt op de datum van het feest**, bij status `afgeleverd` (besloten 25-08). Het werk is
  dan geleverd, dus de omzet is verdiend, ook als de klant later betaalt. `paid_at` zit in geen
  enkele omzetvraag meer.
- **`/admin/omzet`** — periodekiezer (week · maand · kwartaal · jaar · vrij), kerncijfers met
  vergelijking met de even lange vorige periode, staafgrafiek, **btw per tarief**, omzet per pakket,
  openstaande posten over álle perioden, en een CSV-export voor de boekhouder.
- **De hub gebruikt dezelfde regel** als de omzetpagina. Dat is het punt — ze stonden los.
- **Betaalblok in de boekingsheet**, in plaats van het selectievakje *Ontvangen: binnen*.

**Niets gaat automatisch.** Een betaling bestaat pas als hij is vastgelegd; een status op
`afgeleverd` zetten raakt de betalingen niet aan.

**Getest tegen dev:** migratie idempotent (tweede run zet niets dubbel), betaalde aanbetalingen
overgezet (ABB-2026-007 → € 125,00), `/api/admin/omzet` over 2026 geeft € 770,00 over 3 boekingen
met de juiste maandverdeling, een omgekeerde periode geeft 400, en ABB-2026-014 staat na het
vastleggen van € 295,00 op openstaand € 0,00. 18 nieuwe tests (96 totaal).

> ⚠️ **`deposit_paid` en `paid_at` worden niet meer gelezen.** Ze blijven staan omdat de migratie
> additief is. Weghalen kan pas na een ronde waarin niets ze mist — en dat is dan een eigen
> migratie, geen bijvangst.

---

### 🖼️ Portfolio per gelegenheid — categorie → album → foto's

Uit de meeting: *"niet een los event zien maar meer dat je de optie biedt voor een babyshower
met een weergave van meerdere events."*

**Nieuw:** `gallery_albums` als laag tussen categorie en foto. De categorieën gaan van
taart-type naar **gelegenheid**.

**Categorie-beheer dat er niet was.** De routes bestonden al in `gallery.ts`, maar er was geen
scherm dat ze aanriep — de zes categorieën kwamen uit de seed en waren niet te wijzigen. Het
galerijscherm is nu drielaags: gelegenheden links (toevoegen, hernoemen, herordenen,
verwijderen), albums per gelegenheid, foto's per album.

**Twee dingen bewust zo gebouwd:**
- **Hernoemen verandert de slug niet.** De slug zit in het webadres (`/galerij/babyshower`);
  automatisch meebewegen zou gedeelde links breken zodra de site live is.
- **Verwijderen waarschuwt met aantallen.** Een categorie verwijderen cascadet de albums weg
  maar laat de foto's bestaan; het scherm zegt dat, met het aantal betrokken albums.

**Publiek:** `/galerij` toont gelegenheid-tegels met cover en aantal events; `/galerij/:slug`
toont de events onder elkaar, elk met eigen foto's en een lightbox met vorige/volgende.

**Getest tegen dev:** album aanmaken → foto's uploaden met `albumId` → geneste publieke
respons klopt → album verwijderen laat de foto's staan en zet ze onder "Losse foto's" →
categorie verwijderen cascadet het album maar niet de foto's.

---

### 🍰 Pakketten & prijzen — Sweet Tables voorop

**Nieuw:** `packages` met `priceFrom`, `priceUnit`, personen-bereik en een `includes`-lijst.
Beheerscherm op `/admin/pakketten`. Drie pakketten geseed op **inactief** met prijs 0 — ze
staan klaar maar verschijnen pas op de site als de klant de prijzen doorgeeft.

**`/aanbod` is herschreven.** De hardcoded `SERVICES`-array is weg. Nieuwe opbouw: pakketten
bovenaan met vanaf-prijs en "wat zit erin", dan de gelegenheden, dan de taarten als compact
prijslijstje, dan levertijden en reviews. Zonder actieve pakketten toont de pagina een nette
"binnenkort"-staat met een link naar het contactformulier — geen kapotte pagina.

**`products` is publiek te maken** via een `publicVisible`-schakelaar per regel. Twee
voorwaarden voor de publieke route: actief **én** publiek gezet, zodat een intern product
intern blijft.

**Homepage:** het spotlight-blok toont nu de uitgelichte pakketten; zonder pakketten valt het
terug op de gelegenheden.

---

### 📅 Agenda + ICS-feed

**Nieuw:** `/admin/agenda` met een maandraster. Boekingen én aanvragen-met-datum op één
kalender; aanvragen krijgen een stippellijn omdat het nog geen afspraak is, en verdwijnen
zodra ze omgezet zijn — anders telt dezelfde dag dubbel. Kleur per status. Op mobiel een lijst
per dag: een raster van 35 vakjes is op een telefoon onleesbaar.

**`orders`** krijgt `eventTime` en `location`. `eventDate` blijft een `date` zonder tijd, zodat
"datum bekend, tijd nog niet" een geldige toestand blijft.

**ICS-feed** op `GET /api/agenda.ics?token=…`, buiten `/api/admin` gemount omdat agenda-apps
geen sessie-cookie sturen. Eigen token in `site_settings.levertijden`, vergeleken in constante
tijd, te vervangen vanuit het instellingen-scherm zonder wachtwoordwijziging.

**Formaat geverifieerd:** 29 CRLF-regels, nul losse LF's, nul regels boven 75 octetten,
escaping van komma's en puntkomma's (getest met een klantnaam die beide bevat), stabiele UID's
zodat een wijziging het bestaande event bijwerkt in plaats van een tweede aan te maken,
hele-dag-events zonder tijd en tijdgebonden events mét.

> ⚠️ Wie de feed-URL heeft, ziet alle boekingen met klantnamen. Het instellingen-scherm zegt
> dat erbij en biedt een knop om een nieuwe link te maken.

---

### 📨 Aanvraagflow

`contact_requests` krijgt `categoryId` en `packageId`. Het formulier heeft nu een
gelegenheid-keuze uit de echte categorieën en een pakket-keuze met een expliciete optie
**"Weet ik nog niet"** — wie het nog niet weet mag niet het gevoel krijgen eerst iets te
moeten uitzoeken.

**Voorselectie:** de *Vraag aan*-knop op een pakketkaart linkt naar `/contact?pakket=<slug>`.
Onbekende slug = niets voorgeselecteerd, geen fout.

**Levertijd-waarschuwing** bij een datum binnen de termijn uit `site_settings.levertijden`.
Een waarschuwing, geen blokkade — ze wil zelf beslissen of iets nog past.

Het beheerscherm toont gelegenheid en pakket per aanvraag.

---

### ⭐ Reviews

**Nieuw:** `reviews` met `published` standaard op **false** — publiceren is een bewuste
handeling, ook omdat er toestemming nodig is voor een naam op de site. Beheerscherm op
`/admin/reviews`, met die herinnering erbij.

**De verzonnen quotes zijn uit de code.** `grep TESTIMONIALS client/` geeft nul treffers. Het
blok op de homepage en op `/aanbod` verdwijnt volledig bij nul gepubliceerde reviews — een leeg
reviewblok is slechter dan geen reviewblok.

---

### 👥 Klantenbeheer

**Terugkerende klanten werden gedupliceerd.** `POST /orders/from-contact` maakte altijd een
nieuwe klant aan, ook bij een bekend e-mailadres — juist het soort klant dat je wil herkennen.
Nu wordt er eerst gezocht (hoofdletterongevoelig) en bij een treffer gekoppeld, waarbij de
bestaande notities worden **aangevuld** en niet overschreven.

**Klantdetailscherm** op `/admin/klanten/:id` met de boekingenhistorie. Die route leverde die
historie al, maar er was geen scherm dat hem aanriep.

**Zoekveld** op naam, e-mail en telefoon.

---

### ⚡ Bundel opgesplitst

De beheerpagina's laden nu via `React.lazy`. Een bezoeker van de homepage downloadde
voorheen het volledige beheerpaneel inclusief Recharts mee.

| | Voor | Na |
|---|---|---|
| Hoofdbundel | 1012 kB | **535 kB** (164 kB gzip) |
| Dashboard (Recharts) | in de hoofdbundel | eigen chunk, 386 kB |
| Overige beheerpagina's | in de hoofdbundel | 2–35 kB per stuk |

---

### 🧾 Boekingen — regels, totalen en een tijdlijn

**`order_items` werd nergens gebruikt.** De tabel bestond, `GET /orders/:id` leverde de regels
al mee, en er was geen enkele route om er een toe te voegen. Een boeking was daardoor een rij
met een handmatig ingetypt totaal.

**`orders`** krijgt `reference` (`ABB-2026-014`), `packageId`, `persons`, `allergies`, `theme`
en `setupTime`. **`order_events`** is nieuw: de tijdlijn per boeking.

**Nieuwe routes** — regel toevoegen, wijzigen, verwijderen, herordenen, regels uit een pakket
overnemen, en de tijdlijn uitlezen. Elke regelwijziging draait in **één transactie**: regel
wegschrijven → `lineTotal` berekenen → `totalPrice` opnieuw optellen uit álle regels → tijdlijn
bijwerken. Zo kan het totaal nooit uit de pas lopen met de regels eronder, ook niet met twee
schermen open.

**Het rekenwerk zit in `server/lib/orderTotals.ts`** als pure functies, testbaar zonder
database. Drie keuzes die vastliggen in tests:
- **In centen rekenen.** `3 × € 12,35` is in JavaScript `37.049999999999997`; bedragen die naar
  een offerte gaan mogen daar niet van afhangen.
- **Het totaal is de som van de al afgeronde regels**, niet een herberekening vanaf aantal ×
  prijs. Anders wijkt het totaal een cent af van wat de klant op de offerte optelt.
- **Bedragen boven € 99.999,99 worden geweigerd** met een leesbare melding in plaats van een
  databasefout — `numeric(10,2)` gaat niet verder.

**`from-contact` was een tekstverwerker.** Gelegenheid en personen werden als `"Type: … ·
Personen: …"` in `notes` gepropt, waardoor je er niet op kon filteren en de agenda ze niet kon
tonen. Nu gaan `packageId`, `persons`, `eventDate` en de gelegenheid mee als **velden**, komt
het gevraagde pakket meteen als regels binnen, en houdt `notes` alleen het bericht van de klant.
Een tweede omzetting van dezelfde aanvraag geeft **409 met het bestaande boekingsnummer** in
plaats van een tweede boeking.

**Twee dingen bewust dichtgezet:**
- Een regel-URL controleert dat de regel bij **déze** boeking hoort — anders bewerkt
  `/orders/1/items/99` een regel van een andere boeking.
- Herordenen weigert een lijst die niet exact de regels van de boeking bevat (409). Een
  verouderd scherm zou een net toegevoegde regel anders stilzwijgend bovenaan zetten.

**Nog niet gebouwd:** de detailsheet, de werkende agenda en de offerte. Dit is de serverkant.

---

### 🐛 Galerij — de fototeller loog, en uploaden meldde niets

**Elk event meldde "0 foto's" terwijl de foto's er wél stonden.** Daardoor leek uploaden
kapot. De oorzaak zat in één query:

```ts
sql`(select count(*)::int from ${galleryItems} where ${galleryItems.albumId} = ${galleryAlbums.id})`
```

Drizzle laat bij een geïnterpoleerde kolom in een `sql`-template de **tabelnaam weg**:

```sql
select "id", (select count(*)::int from "gallery_items" where "album_id" = "id") from "gallery_albums"
```

Binnen die subquery slaan *beide* namen op `gallery_items` — een foto's `album_id` vergeleken
met zijn eigen `id`. Bijna altijd onwaar, dus altijd 0, en **nooit een foutmelding**. Vervangen
door een `LEFT JOIN` met `count(items.id)` (niet `count(*)`: dat telt bij een left join de lege
rij mee en zou een leeg album op 1 zetten).

> Les: gebruik geen ruwe subquery met kolom-interpolatie over twee tabellen. Drizzle kwalificeert
> kolommen wél correct in join-voorwaarden. De overige `sql`-templates in dit project raken maar
> één tabel en zijn daarom ondubbelzinnig.

**Uploadfouten gaven een 500 met een technische tekst.** Nu een 400 met uitleg:
- **HEIC wordt herkend en geweigerd met instructie.** De meegeleverde Sharp-binaries bevatten
  libheif zónder HEVC-decoder (patenten), dus een iPhone-foto kwam door de mimetype-filter,
  klapte in Sharp en gaf een 500. De melding zegt nu: *Instellingen → Camera → Formaten → Meest
  compatibel*. De bestandskiezer biedt HEIC ook niet meer aan.
- Te groot → *"groter dan 10 MB"*. Te veel bestanden en een onverwacht veld zijn nu twee
  verschillende meldingen (multer gebruikt voor allebei `LIMIT_UNEXPECTED_FILE`).
- **Uploaden zonder gelegenheid wordt geweigerd.** Dat "lukte" eerst, waarna de foto nergens
  onder stond en dus onvindbaar was. De knop is nu ook uitgeschakeld tot er een gelegenheid
  gekozen is.

**Twee keuzelijsten onder elke foto** herhaalden de gelegenheid en het event die je in de kop al
gekozen had. Binnen een event staat er nu alleen nog "verplaatsen naar"; de gelegenheid-keuze
verschijnt alleen bij losse foto's.

**Publiek:** de albumtekst staat als eigen gecentreerde alinea onder de titel, met een leesbare
regellengte en behoud van regeleindes — in plaats van als losse regel naast de datum.

---

### 🏠 Publieke site opnieuw ingedeeld

**De homepage was 9.500 pixels hoog** voor een bedrijf dat één ding verkoopt. Nu **5.173** —
gemeten in de browser op 1440×900, niet geschat.

| | Voor | Na |
|---|---|---|
| Paginahoogte | 9.500 px | **5.173 px** |
| Secties | 9 | **6** |
| `ProcessStory` | 260vh (~2.300 px) | **430 px** als strip |
| Pakketten | op tweederde van de pagina | **tweede schermhoogte** |

**Nieuwe volgorde:** hero · band · **wat we maken (pakketten)** · ons werk · zo gaat het ·
reviews · CTA.

- **`ProcessStrip`** vervangt `ProcessStory` op de homepage. Die had `gap-[55vh]` plus
  `py-[20vh]` — een derde van de pagina waarin de bezoeker vier zinnen leest en de stappen 02
  tot 04 als bijna onzichtbare tekst voorbij ziet komen. `ProcessStory` blijft bestaan voor
  `/over`, waar iemand komt die het verháál wil.
- **Missieblok en editorial spotlight vervallen** — ze zeiden hetzelfde als de hero en de
  pakketten, met andere woorden.
- **Instagram-raster eruit**: het toonde dezelfde foto's als "Ons werk" eronder. De link stond
  al in de voettekst.

**`/aanbod` heeft ritme gekregen.** Pakketkaarten hebben nu een **coverfoto** (de publieke
route levert hem mee via een LEFT JOIN op `cover_item_id`, dus een pakket zonder cover valt
niet uit de lijst) en de vanaf-prijs is het zwaarste element op de kaart. "Goed om te weten"
stond onderaan als zwevende tekst en is nu een kaart met vier punten, direct onder de prijzen —
daar komen die vragen op. Gelegenheid-tegels van vier naar drie kolommen, dus groter.
**Gemeten: geen enkel gat tussen secties, en geen horizontaal schuiven op 375 px.**

**Gedeelde `PageHeader`.** Vier pagina's hadden elk hun eigen kop-blok en die liepen uit de
pas: links uitgelijnd terwijl de inhoud eronder gecentreerd stond, met verschillende
hoeveelheden ruimte eronder. `/aanbod` en `/galerij` gebruiken nu één component, gecentreerd.
`/over` en `/contact` bewust niet — die zetten hun kop naast een portret of formulier, en daar
hoort links uitgelijnd.

**`/admin/pakketten` zegt nu waar een pakket terechtkomt:** *"Staat op /aanbod · en uitgelicht
op de homepage"* met een bekijk-link, of in burgundy *"Staat nergens op de site"*. De twee
schakelaars heetten "Zichtbaar op de site" en "Uitgelicht op home" zonder te zeggen wélke
pagina dat is.

**Galerij: teksten waar ze horen.** `gallery_categories.description` (de inleiding boven een
gelegenheid) en `gallery_items.caption` (bijschrift per foto) bestonden allebei al in de
database maar waren **nergens in te vullen**. Beide nu bewerkbaar, opgeslagen bij wegklikken.
De albumtekst staat publiek als eigen gecentreerde alinea met een leesbare regellengte, met
behoud van regeleindes.

---

### 📖 Een event kan nu een verhaal zijn

De vraag: *"ik wil bij de events of de galerijen tekst kunnen plaatsen, zodat het ook
informatie heeft."* Besloten richting: **portfolio met meer tekst**, geen losse blog.

**`gallery_albums.blocks jsonb`** — een geordende lijst van blokken: `kop`, `tekst` of
`fotos` (een groep foto-id's). De volgorde in de lijst is de volgorde op de pagina, dus tekst
kan tussen de foto's staan in plaats van er alleen bovenop.

**Drie keuzes die ertoe doen:**

- **`blocks = NULL` betekent "nog niet ingedeeld"** en dan verschijnt het album zoals
  voorheen: omschrijving, dan alle foto's. Elk bestaand album blijft dus werken zonder dat er
  iets aan hoeft te veranderen.
- **Blokken bezitten geen foto's, ze verwijzen ernaar.** Een foto die in geen enkel blok staat
  verschijnt onderaan de pagina. Zonder dat zou een foto die je uploadt ná het indelen
  stilzwijgend onzichtbaar zijn — en dat merk je pas als de klant vraagt waar zijn foto is.
  Het beheerscherm zegt het er ook bij: *"1 foto staat niet in een blok — die verschijnt
  onderaan de pagina."*
- **jsonb en geen aparte tabel met `sort_order`.** De volgorde ís hier de betekenis, en een
  losse tabel met een volgordekolom is precies waar herordenen fout gaat — dat is in dit
  project al een keer gebeurd met `sortOrder ± 1` in het galerijscherm.

**Geen opmaak-editor.** Vet en cursief via `contenteditable` levert rommelige HTML en een
aanvalsvlak op een publieke pagina. Platte tekst met regeleindes; een tussenkop is een eigen
bloksoort in plaats van een opmaakknop.

Een `CHECK` op de kolom eist een array. Zonder die controle kan er een string of object in
belanden en klapt een publieke pagina eruit. Zod weigert een onbekende bloksoort met een 400.

**Getest tegen dev:** tekst → 2 foto's → tussenkop → tekst → 1 foto rendert in die volgorde,
met `<h3>` en `<p>` op de juiste plek; de vierde foto stond buiten de blokken en verscheen
onderaan; `blocks: null` viel terug op alle vier de foto's; een blok met soort `"onzin"` gaf
een 400.

---

### 🗂️ Galerijbeheer: van fotobak naar Categorie → Event → Foto&apos;s

In de woorden van de gebruiker: *"De UI is heel onlogisch nu, het gaat van afbeeldingen uit in
plaats van galerij 1, 2, 3 etc."* en *"Het is Galerij — Categorie — Event — Foto's, en in het
Event kun je een titel maken."*

**Het datamodel klopte al** — `gallery_categories` → `gallery_albums` → `gallery_items` is
precies die hiërarchie. Het scherm niet: het startte op `catId = null`, en dat betekende
**"Alle foto's"**. Je landde dus op een plat raster van élke foto, met de categorie als filter
en het event als **pil** in een rij. Terwijl het event juist het ding is dat je aankleedt.

**Nu:** gelegenheden in de zijbalk, **events in het hoofdvlak**, en een event als eigen pagina
(`/admin/galerij/:id`). De gekozen gelegenheid staat in het webadres (`?categorie=`), zodat
verversen je niet terugzet en de terug-link vanaf een event op de juiste plek uitkomt.

**Drie fouten die hierbij boven water kwamen:**

- 🐛 **`GET /gallery/albums` leverde `blocks` niet mee.** Die query somt de kolommen expliciet
  op, dus de kolom die net was toegevoegd kwam er niet vanzelf bij. De eventpagina kón het
  verhaal dus niet eens lezen.
- 🐛 **Een leeg tekstblok werd door de server geweigerd.** Het schema eist `inhoud.min(1)`, en
  de editor stuurde elke klik direct op. Je klikte "Tekst", het blok ging weg, kreeg een 400 en
  verdween weer — *"ik kan hier nog niks doen"*. De blokken worden nu **lokaal** bewerkt met
  een expliciete **Verhaal opslaan**-knop; lege blokken zijn gemarkeerd als *"nog leeg — wordt
  niet opgeslagen"* en vallen bij opslaan weg.
- 🐛 **Twee events met dezelfde titel gaven een 500** met een ruwe databasefout in beeld
  (`gallery_albums_cat_slug_unique`). Twee keer "Sweet 16" onder Verjaardag is heel gewoon; de
  tweede wordt nu `sweet-16-2`.

**Publiek: elk event heeft een eigen webadres.** `/galerij` → `/galerij/verjaardag` →
`/galerij/verjaardag/sweet-16`. De gelegenheid-pagina toonde alle events onder elkaar mét al
hun foto's — een eindeloze rol waarin je één feest niet kon aanwijzen en al helemaal niet kon
delen. Nu event-tegels, in dezelfde vorm als de gelegenheid-tegels een niveau hoger.

**Geen migratie nodig.** `gallery_albums_cat_slug_unique` bestond al, en `blocks`, `caption`,
`published` en `coverItemId` ook.

**`published` per event is nu bedienbaar.** Dat veld bestond maar er was nooit een schakelaar
voor, dus elk event stond op zichtbaar zonder dat iemand dat gekozen had.

**Herbruikbaar gemaakt:** `components/admin/galerij/FotoRaster.tsx` (met een `context` voor de
drie plekken waar foto's staan) en `components/admin/galerij/UploadKaart.tsx`.

---

### 🖼️ Democontent in de database

`scripts/seed-demo-content.ts` — 36 Unsplash-foto's langs dezelfde Sharp-pijplijn als een echte
upload, negen events (vier met `blocks`), vier pakketten met cover en prijs, vijf reviews, en
nette site-instellingen. Alles met `source: "demo"` als merkteken, en vlaggen `--verwijder`,
`--schoon` en `--testdata-weg`.

**In de database en niet in de frontend-demo-laag**, want die schakelt zichzelf uit zodra er één
echte foto staat en laat het beheerpaneel leeg.

**Grazing Table is als vierde pakket toegevoegd** — dat ontbrak, terwijl de site "Sweet & grazing
tables" als kop voert.

> 🔴 **Blokkerend vóór livegang.** Stockfoto's van anderen en verzonnen reviews. Weg met
> `npm run seed:demo -- --verwijder`. Zie [testscript-master.md](testscript-master.md) §8.8.

---

### ⚙️ Instellingen bruikbaar voor een niet-technische gebruiker

Het scherm was geschreven vanuit de database. Secties heten nu naar **waar het staat**, met een
*Bekijk*-link per sectie en één regel uitleg per veld. *Tagline* → "Zin onder je naam", *CTA
tekst* → "Tekst op de knop", *CTA link* → "Waar de knop heen gaat" als keuzelijst met
paginanamen.

**Fotokiezer** in plaats van een veld waar je `uuid.webp` in moest typen: kiezen uit de galerij of
uploaden. Een upload landt onder de niet-gepubliceerde gelegenheid **Sitefoto's** (nieuw in
`seed-admin.ts`), zodat een portret niet tussen de feesten opduikt.

**Vijf dode velden weg**: `hero.title`, `hero.imageFilename`, `levertijden.taartenDagen`,
`contact.openingHours` en `contact.facebook`. Geen van vijven werd ergens uitgelezen — de kop op
de homepage staat hardgecodeerd en de hero toont de carousel. De sleutels blijven in bestaande
jsonb-rijen staan; niets leest ze meer, en Zod stript ze bij de eerstvolgende opslag.

**WhatsApp aangesloten** op de contactpagina en in de voettekst. Het veld bestond al maar werd
nergens getoond.

**Een mislukte opslag zei niets.** Vier PUT's naast elkaar via `Promise.all`; faalde er één, dan
waren de andere drie al door en toonde het scherm niets. Nu achter elkaar, met de servermelding.

---

### 🧾 Btw per regel, per pakket en per product

**Het model lag op de boeking en dat is te grof.** Eén offerte kan twee tarieven bevatten: een
grazing table valt onder 9% (eten en drinken), de styling en het glaswerk ernaast onder 21%. De
Belastingdienst staat niet toe dat het hoge deel meelift op het lage tarief; bij één prijs naar de
klant hoort het bedrag aan de achterkant gesplitst te worden volgens de marktwaarde.

- `order_items.vat_rate` — het tarief hoort bij het **bedrag**, en dat staat op de regel
- `packages.vat_rate` voor een pakket dat één prestatie is
- `packages.vat_split_low` / `vat_split_high` voor een pakket dat allebei bevat. **Per eenheid**,
  net als `price_from`: € 22,00 eten en € 3,00 servies bij € 25,00 p.p. wordt voor twintig gasten
  € 440,00 en € 60,00. Het pakketformulier telt live op en **weigert op te slaan** als de
  verdeling niet uitkomt op de vanaf-prijs
- `products.vat_rate` voor de taart-prijslijst. Geen verdeling: een taart is één ding

**Btw is uit de instellingen én uit de boeking gehaald.** Die twee concurreerden met het pakket om
dezelfde vraag, waardoor niet af te lezen was welk antwoord wint. Als vangnet krijgt een pakket of
product zonder tarief een zichtbare markering in het beheerscherm.

De offerte splitst per tarief uit. `apply-package` matcht nu **per deel**: zonder dat verhoogde
een tweede toevoeging alleen de eerste regel en kwam de andere er los naast te staan.

> ⚠️ Welk deel van een pakketprijs eten is, is een vraag voor de boekhouder van de klant.

---

### 🐛 Drie rekenfouten en twee gaten in het beheerpaneel

- **De aanbetaling werd afgetrokken zonder te kijken of hij betaald was.** `depositAmount` is de
  *afgesproken* aanbetaling, `depositPaid` zegt of hij binnen is. Een boeking van € 295 met een
  onbetaalde aanbetaling van € 200 las als "openstaand € 95,00" — precies het getal waarop je
  afgaat als je iemand belt over zijn rekening. Vastgelegd in een test.
- **`?–40 personen` op de publieke site** wanneer alleen de bovengrens was ingevuld. Nu
  `personenBereik()` in `lib/utils.ts`, gedeeld door de publieke en de beheerkant.
- **Klant → boeking was niet klikbaar** terwijl de rij een hover-kleur had. Nu klikbaar, met het
  boekingsnummer als linktekst.
- **Een klant koppelen aan een bestaande boeking kon niet.** Nu zoeken-terwijl-je-typt met
  ontdubbeling, en pas daarna de optie om een nieuwe klant aan te maken.
- **De offerte opnieuw opgebouwd.** De puntenrij is een gelabelde lijst geworden, en de betaling
  staat in twee stappen: *nu te voldoen* en *daarna, bij oplevering*.

---

### 🎨 Publieke site

**`/aanbod` opnieuw ingedeeld** — zie
[../komende-plannen/2-in-uitvoering/pakketten-aanbodpagina-indeling.md](../komende-plannen/2-in-uitvoering/pakketten-aanbodpagina-indeling.md).
De gelegenheden staan als doorlopende strook in de kop en de pakketten als blokken eronder, twee
kolommen ook op een telefoon. Met vier pakketten stond de vierde eerder alleen op een nieuwe rij
met een gat ernaast; `flex-wrap justify-center` zet een overblijver in het midden.

**Koppen op foto's waren onleesbaar** op een lichte foto: het verloop liep over de hele tegel en
viel op halve hoogte al weg. `FotoScrim` lost dat op één plek op, gedeeld door drie schermen.

**Tegels wisselen door de foto's van hun events** (`FotoCyclus`) in plaats van één vaste cover.
Twee fouten daarin gerepareerd: de oude foto vervaagde tegelijk met het invaden van de nieuwe
(waardoor de achtergrond erdoorheen schemerde), en de `transition-transform` van de hover-zoom
schakelde de `transition-opacity` van het kruisvervagen uit — `transition-property` kan er maar
één zijn. De twee overgangen staan nu op verschillende elementen.

**Kastlijntjes (—) uit alle publieke teksten**, op verzoek. Ook uit de seed en uit de database.

---

## Getest

| | |
|---|---|
| `npm run typecheck` | ✅ |
| `npm test` | ✅ 78 tests (was 27) |
| `npm run build` | ✅ |
| Endpoints tegen dev | ✅ 22/22 + de nieuwe regelroutes |
| Migraties op dev | ✅ beide + idempotent bij tweede run |

**Boekingen tegen dev doorlopen:** regels toevoegen tot het wireframe-totaal van € 370,00 ·
aantal 50 → 80 herrekent regel én totaal · regel verwijderen verlaagt het totaal · € 120.000
geweigerd met 400 · regel van een andere boeking geeft 404 · onvolledige herordening geeft 409 ·
pakket per persoon wordt 45 × € 12,50 = € 562,50 · aanvraag met pakket levert een boeking van
€ 562,50 met 6 regels · tweede omzetting geeft 409 · tijdlijn toont dertien gebeurtenissen in
omgekeerde volgorde · UTF-8 gaat byte-voor-byte gelijk heen en terug (allergieteksten).

**Bestanden:** `shared/schema.ts`, `server/routes/{public,agenda-ics}.ts`,
`server/lib/{orderTotals,orderEvents}.ts`, `server/routes/admin/{gallery,packages,reviews,agenda,orders,index}.ts`,
`client/src/pages/admin/{GalleryAdmin,Packages,Reviews,Agenda,CustomerDetail,Customers,Products,ContactRequests,Settings}Page.tsx`,
`client/src/pages/public/{Gallery,Services,Contact,Home}Page.tsx`,
`client/src/lib/{images,demoGallery}.ts`, `client/src/App.tsx`,
`client/src/components/layout/AdminLayout.tsx`, `scripts/seed-admin.ts`

**Migraties:** `fase-1-schema` → `boekingen` → `btw` → `regel-details` → `album-blokken` →
`btw-per-regel` — 🚨 alle zes vóór de code

---

## Na de deploy

1. **Oude categorieën opruimen.** Live heeft nog de taart-typen. Nieuwe gelegenheden
   aanmaken via het galerijscherm, oude verwijderen — ze zijn leeg.
2. **`npm run seed:admin`** draaien: dat zet de gelegenheden, de drie pakketten en de
   `levertijden`-sleutel met agenda-token klaar. Veilig om opnieuw te draaien.
3. **Dev-database verversen** vanaf live, zodat beide weer gelijk lopen.
