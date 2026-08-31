# Werkblok — huidig (gestart 2026-08-24)

> **Status:** 🟢 **Gebouwd, en sinds 31-08 draait het op de server** — `http://85.215.182.227:6778`,
> op haar eigen content, met een account voor Esmee. Wat er nog moet: HTTPS en een domein, en de
> content die alleen zij kan aanleveren (prijzen, reviews, over-tekst). Zie
> [../klant/content-invulplan.md](../klant/content-invulplan.md) en
> [../deployment/pending.md](../deployment/pending.md).
> **Branch:** `development` — daar landt het werk; `main` blijft wat er live hoort te kunnen.
> **Bij afsluiten:** archiveren als `werkblok-v0.1.md` in `../archive/planning/` en dit bestand resetten.

---

## Waar staan we?

| | |
|---|---|
| `npm run typecheck` | ✅ |
| `npm test` | ✅ 96 tests |
| `npm run build` | ✅ |
| Endpoint-verificatie tegen dev | ✅ |
| Migraties op dev | ✅ alle acht, idempotent |
| Migraties op live | ✅ 31-08, via een kopie van dev — zie [../deployment/db-migraties.md](../deployment/db-migraties.md) |
| Democontent | ✅ **weg** (27-08) — 36 foto's, 9 events en 6 reviews verwijderd |
| Klantcontent op dev | ✅ 20 foto's, 5 gelegenheden, 6 pakketten, 3 taartprijzen |

---

## Fasering — stand

| Fase | Wat | Stand |
|---|---|---|
| **0** | [Hardening](../archive/planning/security-hardening.md) + [domein](3-onaangeraakt/infra-domein-livegang.md) + backups | 🟡 code ✅ · firewall ✅ 28-08 · backup-cron ✅ 31-08 · **DNS open** |
| **1** | Datamodel: `packages`, `gallery_albums`, `reviews` + velden | ✅ **DEV ✅ / LIVE ✅** |
| **2** | [Portfolio](../archive/planning/portfolio-categorie-albums.md): gelegenheden, albums, categorie-beheer | ✅ |
| **3** | [Pakketten & prijzen](../archive/planning/pakketten-en-prijzen.md) | ✅ |
| **4** | [Aanvraagflow](../archive/planning/aanvragen-formulier-uitbreiding.md) | ✅ |
| **5** | [Agenda](../archive/planning/agenda-boekingen.md) + ICS-feed | ✅ |
| **6** | [Reviews](../archive/planning/content-reviews.md) | ✅ |
| — | [Klantenbeheer](../archive/planning/klanten-uitbreiding.md) | ✅ |
| — | [Boekingen: sheet, agenda, offerte](2-in-uitvoering/boekingen-detailsheet-en-agenda.md) | ✅ stap 1–12 · stap 13 (muis-scenario's) open |
| — | [Democontent](#democontent) | ✅ staat op dev |
| — | [Instellingen bruikbaar maken](#instellingen) | ✅ |
| — | [Btw per regel, pakket en product](#btw) | ✅ **DEV ✅ / LIVE ✅** |
| — | [`/aanbod` opnieuw ingedeeld](2-in-uitvoering/pakketten-aanbodpagina-indeling.md) | ✅ |
| — | [Betalingen + omzetpagina](#omzet) | ✅ **DEV ✅ / LIVE ✅** |
| — | [Kleur door het beheerpaneel](#kleur) | ✅ |
| — | [Klantcontent + huisstijl](#klantcontent) | ✅ **DEV ✅ / LIVE ✅** |
| — | [Pakketbeheer in een sheet + coverfoto](#pakketsheet) | ✅ |
| — | [Ontwerp: hero, galerijstapel, kleur](#ontwerp) | ✅ |
| **7** | Livegang: SEO, testronde | 🟡 draait als besloten preview op het IP · wacht op prijzen, reviews, over-tekst en DNS |

---

## Wat er nu moet gebeuren

**1. HTTPS.** Het enige punt dat écht dringend is. Zolang de site op een kaal IP draait, gaat
haar wachtwoord leesbaar over het internet. Twee wegen: een subdomein op een domein dat al op
deze server staat (`tcgdeckmaster.com`) met Let's Encrypt — dat kan vandaag en raakt het
`atelierboterbloem.nl`-traject niet — of meteen het echte domein, waarvoor DNS-toegang nodig is.
Wat er daarna teruggedraaid moet worden staat in
[../deployment/infra/domein.md](../deployment/infra/domein.md).

**2. Sterk wachtwoord voor het live `admin`-account.** Eén commando, staat al maanden open:
`ADMIN_USERNAME=admin ADMIN_PASSWORD=… npm run seed:admin`.

**3. De klikronde afmaken** — stap 13 van het boekingenplan, plus de breedtes van de nieuwe
schermen (375 / 768 / 1440) en de randgevallen. Nu op de echte server te doen in plaats van
lokaal.

**4. De gatenlijst bij de klant.** Zonder prijzen heeft `/aanbod` geen aanbod, en zonder reviews
blijft dat blok leeg. Zie [../klant/content-invulplan.md](../klant/content-invulplan.md) §7.

---

## Wat er op 25-08 bij is gekomen

### <a id="democontent"></a>🖼️ Democontent in de database

`scripts/seed-demo-content.ts` vult de database met samenhangende voorbeeldinhoud, zodat de
klant kan zien hoe haar site eruit gaat zien voordat ze een fotoshoot plant.

**In de database en niet in de frontend-demo-laag**, want die schakelt zichzelf uit zodra er één
echte foto staat (`heeftEchteContent()`) en laat het beheerpaneel leeg. Met echte rijen kan ze
óók door Galerij, Pakketten en Reviews klikken.

36 Unsplash-foto's langs dezelfde Sharp-pijplijn als een echte upload, met `source: "demo"` als
merkteken. Negen events, waarvan vier met `blocks` (tekst tussen de foto's) en één met maar twee
foto's — zo zie je hoe een pas aangemaakt event eruitziet. Vier pakketten met prijs en cover,
waaronder **Grazing Table**, dat ontbrak terwijl de site erop kopt. Vijf reviews.

Vlaggen: `--verwijder`, `--schoon`, `--testdata-weg`.

> 🔴 Stockfoto's en verzonnen reviews. Weg vóór de livegang. Zie
> [../deployment/testscript-master.md](../deployment/testscript-master.md) §8.8.

**Twee fouten in het script gevonden en gerepareerd:** een oud testdata-album met de slug
`sweet-16` hield het gelijknamige demo-event tegen, waardoor er een leeg event overbleef. En een
demo-review "Sanne V." stond naast een bestaande "Sanne" over hetzelfde soort feest.

### <a id="instellingen"></a>⚙️ Instellingen: bruikbaar voor iemand die geen ontwikkelaar is

Het scherm was geschreven vanuit de database. In de woorden van de gebruiker: *"En wat moet ik
hier met FOTO Bestandsnaam? dit kan een gebruiker toch niet gebruiken?"*

- Secties heten naar **waar het staat**, met een *Bekijk*-link en één regel uitleg per veld
- *Tagline* → **Zin onder je naam** · *CTA tekst* → **Tekst op de knop** · *CTA link* → **Waar
  de knop heen gaat**, als keuzelijst met paginanamen
- *Foto bestandsnaam* → een **fotokiezer**: kiezen uit de galerij of uploaden. Een upload landt
  onder de niet-gepubliceerde gelegenheid **Sitefoto's**, zodat een portret niet tussen de
  feesten opduikt
- **Vijf dode velden weg**: `hero.title` (de kop is hardgecodeerd), `hero.imageFilename` (de hero
  toont de carousel), `taartenDagen`, `openingHours` en `facebook` — geen van vijven werd ergens
  uitgelezen
- **WhatsApp aangesloten** op de contactpagina en in de voettekst, met een `wa.me`-link die
  "06 12 34 56 78" gewoon slikt
- Een mislukte opslag **zegt nu iets**, en de verzoeken gaan achter elkaar in plaats van naast
  elkaar, zodat een fout halverwege geen half opgeslagen scherm achterlaat

### <a id="btw"></a>🧾 Btw per regel, per pakket en per product

Het model lag op de **boeking**, en dat is te grof. In de woorden van de gebruiker: *"ik kan
bijv. ook styling of andere dingen aanbieden die wel 21% zijn."*

De Belastingdienst staat niet toe dat een 21%-deel meelift op het lage tarief van het eten; bij
één prijs naar de klant hoort het bedrag aan de achterkant gesplitst te worden volgens de
marktwaarde. Bronnen staan in de kop van
[`sql-pending/2026-08-25-btw-per-regel.sql`](../deployment/sql-pending/2026-08-25-btw-per-regel.sql).

- **Het tarief hoort bij het bedrag**, dus bij de regel. `order_items.vat_rate`
- **Een pakket kan zichzelf splitsen**: `vat_split_low` / `vat_split_high`, per eenheid. Bij
  € 25,00 p.p. verdeeld in € 22,00 en € 3,00 levert dat voor twintig gasten € 440,00 (9%) en
  € 60,00 (21%) op. Het formulier telt live op en **weigert op te slaan** als de verdeling niet
  uitkomt op de vanaf-prijs
- **`products.vat_rate`** voor de taart-prijslijst. Geen verdeling: een taart is één ding
- **Btw is uit de instellingen én uit de boeking**, op verzoek. Die twee concurreerden met het
  pakket om dezelfde vraag. Als vangnet krijgt een pakket of product zonder tarief een zichtbare
  markering in het beheerscherm
- De offerte splitst per tarief uit: *"€ 440,00 incl. 9% btw → € 403,67 excl. — btw € 36,33"*

> ⚠️ Welk deel van een pakketprijs eten is en welk deel styling, is een vraag voor haar
> boekhouder. Wij bouwen het gereedschap; de verdeling is haar keuze.

### 🐛 Drie fouten gevonden bij het doorklikken

- **De aanbetaling werd afgetrokken zonder te kijken of hij betaald was.** `depositAmount` is wat
  je *afspreekt*, `depositPaid` of hij *binnen* is, en die twee waren door elkaar gehaald. Een
  boeking van € 295 met een onbetaalde aanbetaling van € 200 las als "openstaand € 95,00".
  Vastgelegd in een test.
- **`?–40 personen` op de publieke site.** Wie alleen een bovengrens invulde, kreeg dat
  vraagteken te zien. Nu `personenBereik()`, gedeeld door de publieke en de beheerkant.
- **Klant → boeking was niet klikbaar**, terwijl de rij wél een hover-kleur had. Nu klikbaar,
  met het boekingsnummer als linktekst.

Bijkomend: **een klant koppelen aan een bestaande boeking** kon niet. Het blok zei "Nog geen
klant gekoppeld" en daar bleef het bij.

### 🎨 Publieke site

- **De offerte opnieuw opgebouwd.** De puntenrij (*"Jaren 60 · 26 augustus 2026 · 15 personen"*)
  is een gelabelde lijst geworden, en de betaling staat in twee stappen: *nu te voldoen* en
  *daarna, bij oplevering*.
- **`/aanbod` opnieuw ingedeeld** — zie
  [pakketten-aanbodpagina-indeling.md](2-in-uitvoering/pakketten-aanbodpagina-indeling.md).
  Gelegenheden als doorlopende strook in de kop, pakketten als blokken eronder, twee kolommen
  ook op een telefoon.
- **Koppen op foto's waren onleesbaar** op een lichte foto: het verloop viel op halve hoogte al
  weg. `FotoScrim` lost dat op één plek op, gedeeld door drie schermen.
- **Tegels wisselen door de foto's van hun events** (`FotoCyclus`) in plaats van één vaste cover
  te tonen.
- **Kastlijntjes (—) uit alle teksten**, op verzoek. Ook uit de seed en uit de database.

---

### <a id="omzet"></a>💶 Betalingen en een omzetpagina

Gevonden bij het doorklikken: boeking ABB-2026-014 stond op `afgeleverd` met € 295,00 en er
verscheen nergens omzet. *"Boeking is afgeleverd, maar ik zie geen omzet bij de klant en in de
hub?"*

**Twee fouten, allebei in het model.** `orders.paid_at` werd door de hele codebase alleen
**gelezen** — vier keer in `stats.ts` — en door niets ooit geschreven. De omzettegels en de
12-maandsgrafiek filterden op `paid_at IS NOT NULL` en stonden daarmee structureel op € 0,00, voor
elke boeking. En "de rest is ook betaald" was nergens vast te leggen: het model kende alleen
`deposit_amount` (afgesproken) en `deposit_paid` (binnen), dus ontvangen kon nooit meer worden dan
de aanbetaling.

Daar bovenop stonden er **twee definities van omzet** naast elkaar: de hub eiste `afgeleverd` +
`paid_at`, de klantdetailpagina keek alleen naar `afgeleverd`. Twee schermen, twee antwoorden op
dezelfde vraag.

- **`order_payments`** — betalingen als losse regels met bedrag, datum, wijze en notitie. In twee
  keer betalen past erin, en je ziet wánneer. `depositAmount` behoudt zijn betekenis: het
  **afgesproken** bedrag dat op de offerte staat als "nu te voldoen"
- **`/admin/omzet`** — periodekiezer (week · maand · kwartaal · jaar · vrij), kerncijfers met een
  vergelijking tegen de even lange vorige periode, staafgrafiek, **btw per tarief**, omzet per
  pakket, openstaande posten over álle perioden, en een CSV-export voor de boekhouder
- **De hub gebruikt nu dezelfde regel** als de omzetpagina
- **Betaalblok in de boekingsheet** in plaats van het selectievakje *Ontvangen: binnen*

Het btw-blok was bijna gratis: `btwPerTarief()` bestond al voor de offerte, en de tarieven zitten
sinds 25-08 per regel in `order_items`. Per kwartaal uitgesplitst is precies wat de boekhouder wil
zien.

> ⚠️ Btw verschijnt pas zodra pakketten en producten een tarief hebben. Zonder tarief telt een
> regel wel mee in de omzet maar levert hij geen btw-regel op — dat is de veilige kant.

### ✏️ Invulbare velden zagen eruit als tekst

*"nu lijkt het net alles overal tekst waar je niks mee kan doen."* `VeldInline` was gebouwd op
"ziet eruit als tekst tot je erop klikt", maar op een scherm dat vrijwel volledig uit die velden
bestaat sloeg dat door: de boekingsheet las als een afdruk. In rust nu een lichte pil met een
hairline en een zacht potloodje dat bij hover oplicht. Geldt in één klap voor elk veld in de
sheet, inclusief het allergieblok.

---

## Wat er op 26-08 bij is gekomen

### <a id="kleur"></a>🎨 Kleur door het hele beheerpaneel

*"Ik wil meer kleurelementen in de schermen... het is niet duidelijk alles."* En daarna: *"Dit
mag door de hele hub heen."*

Gemeten voordat er iets veranderde: over alle veertien adminpagina's won `charcoal/xx` met een
factor 2 tot 4 van elke kleur — op élke pagina. `butter`, de `bg-section-*` verlopen, `pill` en
`hairline-gold` kwamen in **nul** adminbestanden voor. Het palet bestond; de hub gebruikte het
niet.

**Uitgangspunt: kleur krijgt betekenis, geen versiering.** Zeven rollen, vastgelegd in
[../architecture/design-system.md](../architecture/design-system.md). Past een accent in geen
enkele rol, dan blijft het charcoal. Dat is de rem die voorkomt dat het bont wordt.

- **Vier gedeelde onderdelen** in `components/admin/ui/`: `PageKop` (vervangt veertien losse
  `<h1>`), `Badge`, `Bedrag`, `LegeStaat`. Plus `.card-accent`, `.tabel-admin`, `.rij-hover` en
  `.veld-pil` in `index.css`
- **`lib/aanvraag.ts`** — statuslabels en -kleuren van een aanvraag stonden in **twee** kopieën,
  met de kleuren los daarvan in een ternaire keten midden in een tabel. `CustomerDetailPage`
  dupliceerde daarnaast de boeking-labels uit `lib/boeking.ts`. Alle drie weg
- **Zijbalk in drie groepen** — *Werk · Geld · Inhoud*. Elf gelijkwaardige items werden drie
  korte lijstjes
- **`SheetSectie`** krijgt een goudstreepje en een haarlijn: een sheet met zeven secties las als
  één doorlopende lap

### 🐛 Drie klassen die stil niets deden

Tailwind accepteert opacity alleen in stappen van vijf; `/8` en `/12` worden zonder foutmelding
genegeerd. Gevonden bij het nalopen:

- **`bg-charcoal/12` in `Tijdlijn`** — de verbindingslijn tussen de stippen is er dus nooit
  geweest. Nu `bg-gold/30`, en hij is er
- `bg-charcoal/8` in `AanvraagSheet` en in de nieuwe `Badge`
- `bg-burgundy/8` in `ContextMenu`

Een grep over de hele client vindt ze nu niet meer:
`grep -rhoE "(bg|text|border)-[a-z]+/[0-9]+" client/src | awk -F/ '{ if ($NF % 5 != 0) print }'`

### 🔴 Contrast, en een nieuw token

`gold` haalt op wit 2,3:1 en `gold-dark` 3,7:1 — allebei onder de AA-eis van 4,5:1 voor gewone
tekst. Dat is geen smaakkwestie, dus staat het nu als regel in het design-systeem: `gold-dark`
mag op koppen, randen en iconen; lopende tekst blijft charcoal.

Eén plek had daar last van: `Bedrag` zette openstaande bedragen in `gold-dark` op ~14 px, en dat
zijn getallen waar iemand op afgaat. Daarvoor is **`gold-deep` (`#8A6E36`, 4,9:1)** toegevoegd —
goud dat je mág lezen.

> ⚠️ Eén bewuste afwijking van het plan: **allergieën blijven burgundy** in plaats van butter.
> Het is een veiligheidssignaal, en butter zou dat verzwakken.

---

## Wat er op 27-08 bij is gekomen

### <a id="klantcontent"></a>🖼️ De content van de klant, en haar huisstijl

Het materiaal kwam binnen in `uploads/content/`: **20 werkfoto's, 2 PDF's, een logo en een
huisstijl-moodboard**. Volledige verantwoording en de gatenlijst:
[../klant/content-invulplan.md](../klant/content-invulplan.md).

**Foto's zonder events.** Haar aanlevering is niet per feest gegroepeerd, dus de foto's hangen
rechtstreeks onder hun gelegenheid. Dat kon het schema al, maar het beheerscherm noemde zulke
foto's *"losse foto's die nog niet bij een event horen"* — precies het omgekeerde van wat we nu
doen. Het fotoblok staat nu in de kaart van de gelegenheid zelf, altijd open, en events zijn
zichtbaar optioneel. Nieuw: `gallery_categories.cover_item_id`, zodat een gelegenheid zelf haar
omslag aanwijst in plaats van "de eerste op volgorde".

**Twee bugs kwamen daarbij naar boven:**

- **Foto's uit een verborgen gelegenheid lekten naar de homepage.** `haalGalerij()` filterde de
  geneste `categories` op `published`, maar de platte `items`-lijst niet — en dát is de lijst
  achter de hero-carrousel en het uitgelicht-blok. Een portret onder de bewust verborgen
  gelegenheid *Sitefoto's* kon dus op de voorpagina staan.
- **`btw-per-regel.sql` ontbrak in het migratielog** terwijl hij op dev gedraaid was. Het bestand
  bestond, de regel niet — precies het gat dat die tabel hoort te dichten.

**Haar geschreven tekst is geen blog geworden.** Eén artikel is een leeg archief met een
inhoudsopgave, en de tekst is een procesbeschrijving. Haar eigen moodboard heeft `WERKWIJZE` al
in de navigatie staan met vijf stappen; die pagina bestaat nu, gevuld met haar zeven beats. Dat
geeft meteen een thuis aan `ProcessStory`, dat al in de codebase stond maar nergens gerenderd
werd. De homepage-strip gebruikt dezelfde bron, met haar woorden in plaats van de onze.

**Huisstijl omgezet.** Het moodboard bleek een andere richting te bevatten dan wat er gebouwd
was: salie en off-white met Playfair Display en Montserrat, tegenover cream en goud met
Cormorant, Allura en Inter. Haar logo hoort bij het eerste. De tokennamen zijn meeveranderd
(`gold` → `sage`, `cream` → `linen`, `butter` → `boterbloem`) — 358 vervangingen in 53
bestanden — zodat een token niet iets anders heet dan het is. Het beheerpaneel kwam gratis mee.

**Pakketten kunnen zichzelf niet meer verkeerd tonen.** Er geldt nu een regel die bij elke run
opnieuw geldt: *een pakket zonder prijs is niet zichtbaar*. Dat kwam voort uit een zes pakketten
die na de eerste seed toch als actief in de database stonden, met € 0,00 op de homepage.

### <a id="pakketsheet"></a>🖼️ Pakketbeheer: een sheet, en eindelijk een coverfoto

*"waar moet ik de foto toevoegen/wijzigen van een pakket?!"* — het antwoord was: nergens.
`packages.cover_item_id` bestond, de publieke site las hem uit via een LEFT JOIN en
`PakketKaart` toonde hem, maar het beheerscherm had er geen enkel veld voor. De covers die er
stonden waren alleen via een seed-script ingevuld.

- **`FotoKiezer` geeft nu ook het item terug**, niet alleen de bestandsnaam. De instellingen
  bewaren een bestandsnaam in jsonb, een pakket bewaart een id in `cover_item_id`; één van
  beide teruggeven zou de ander dwingen de hele galerij op te halen
- **De admin-route stuurt de cover mee**, zodat de lijst een miniatuur toont — met een
  markering als hij ontbreekt
- **Bewerken in een `Sheet`** die van rechts inschuift, zoals bij boekingen. Het formulier
  stond als kaart bóven de lijst: alles schoof weg bij het openen en de opslaan-knop verdween
  onder de vouw. `useSheetParam` kent nu ook `"pakket"` en de waarde `nieuw`, dus de terugknop
  sluit de sheet en `?pakket=19` is een deelbare link
- **De taarten op `/aanbod` zijn een menukaart geworden** met een foto ernaast — de vorm die
  op haar eigen moodboard staat

### <a id="ontwerp"></a>🎨 Het ontwerp een niveau hoger, en kleur terug

Twee rondes, na onderzoek naar wat winnende food-sites in 2026 doen: groot editoriaal
letterwerk, scroll-gebonden verhalen in plaats van scroll-jacking, en bijschriften als
redactionele laag in plaats van hover-geheimen.

- **Hero als editoriale collage.** De zin over de volle breedte met "één keer" cursief in
  salie, en drie foto's als licht gedraaide kaarten met scroll-parallax. De carrousel die er
  stond wisselde op een timer — beweging die niemand gevraagd had. De kaarten staan in een
  **flexwaaier en niet op absolute posities**: die stonden vast op `left`/`right` binnen een
  kolom die meeschaalt, en dan viel de rechterkaart eruit
- **`/galerij` is een sticky stapel**, één volle kaart per gelegenheid met haar eigen
  intro-tekst. Stapelen gebeurt pas vanaf `md`: op een telefoon is een kaart hoger dan het
  scherm, en dan heeft `sticky` geen ruimte en kruipen de kaarten over elkaar heen
- **Header-foto's zijn instelbaar**: `hero.fotoIds` in `site_settings` (jsonb, dus geen
  migratie), drie kiezers in het instellingenscherm. Leeg = de uitgelichte foto's

#### 🔴 "Bijna alles is WIT op de hele website"

De klacht van de gebruiker, en hij was meetbaar: **28 bijna-witte vlakken tegen 9
kleurvlakken**. Twee structurele oorzaken:

1. **Elk sectie-verloop begon én eindigde op linen `#F7F5F0`.** Bij iedere naad viel de kleur
   dus weg; vier secties op elkaar gaven één doorlopend wit veld met een vage zweem in het
   midden. De verlopen hieven zichzelf op
2. **Elke kaart was `bg-white`** op een bijna-witte sectie — geen rand om op te vallen. Daarom
   lazen de pakketkaarten als niets

Nu vlakke velden, de regel *twee aangrenzende secties nooit hetzelfde vlak*, en `.card` op
linen. Plus het **massieve saliepaneel** dat op haar moodboard staat maar in de uitvoering
volledig ontbrak. Dat vroeg werk: `text-linen` op de sectie wint niet van de `text-charcoal`
die `h2` uit `@layer base` krijgt, dus stond er donkere tekst op donker en verdween `btn-sage`
(salie op salie) helemaal. Beide omgekeerd met afstammelingsselectors, en **geen
doorzichtigheid daar**: linen op `sage-deep` haalt 5,04:1, maar al bij 85% zak je onder AA.

**Pakketkaarten krijgen kleur per familie** — blush voor de drie Tables, salie voor de drie
Grazes, met een kop boven elke groep zodat de tint iets zégt. Kop en tagline hebben vaste
hoogte, want anders begint de prijsband per kaart op een andere hoogte.

Details in [../architecture/design-system.md](../architecture/design-system.md).

### 🐛 Wat er stuk bleek te zijn

- **Het mobiele menu klapte niet uit.** Het stond als `fixed inset-0` bínnen de header, en
  `backdrop-blur` maakt van een element een containing block voor `position: fixed` — dus
  `inset-0` viel terug op de 64 px hoge balk en het paneel werd bovenaan afgeknipt. Nu via een
  Radix-portal: half scherm, doorschijnend met de pagina wazig erachter
- **Foto's uit een verborgen gelegenheid lekten naar de homepage** (zie hierboven bij
  klantcontent)
- **`seed-klantcontent.ts` overschreef instellingen.** Eén run om een tekstje bij te werken
  zette alle zes pakketten terug op onzichtbaar en wiste de covers van de graze-pakketten. Twee
  fouten: "niet genoemd in dit script" werd behandeld als "maak leeg", en er stond een regel
  die bij elke run afdwong dat een pakket zonder prijs onzichtbaar moest zijn. Die regel is
  weg — `PakketKaart` toont een prijsloos pakket al als *"Prijs op aanvraag"* en zet nooit
  € 0,00 op de site, dus het probleem dat hij oploste bestond niet
- **`/favicon.svg` gaf een 404** — er stond een verwijzing zonder bestand
- **"Patisserie · Op maat"** in de hero was de oude taart-eerste framing; een grazing table is
  hartig en dus geen patisserie

---

## Wat er op 31-08 bij is gekomen

### <a id="livegang"></a>🚀 De livegang: alles naar de server

De server draaide `main` van **29 mei** met een lege database. Nu draait alles van 24 t/m 31
augustus op `http://85.215.182.227:6778`, met haar eigen content en een account voor Esmee.
Volledige verantwoording: [../deployment/history.md](../deployment/history.md).

**De database is als geheel gekopieerd**, niet migratie voor migratie. `atelierboterbloem_dev`
*was* het resultaat van de acht migraties, en de vraag was "zet er precies neer wat er lokaal
draait" — een kopie geeft dat, acht migraties achter elkaar geven een reconstructie die er
bijna gelijk aan is. Live had niets te verliezen: 0 foto's en wat mei-testdata, en die staat in
`~/backups/boterbloem/atelierboterbloem-voor-livegang.sql.gz`.

**Testdata eruit.** 14 ontwikkel-boekingen, 8 testklanten en 13 aanvragen. De cascade nam 12
regels, 4 betalingen en 89 tijdlijn-gebeurtenissen mee. Haar beheerpaneel begint leeg.

**De foto's staan nu op drie plekken**: de pc thuis, Google Drive en de server. Tot vandaag was
dat er één, en de originele HEIC's zijn niet opnieuw te maken. In Drive staan ze onder
`13 Boterbloem / 04 Assets & Foto's`, gesplitst in wat onaanraakbaar is en wat afgeleid is —
zie het LEESMIJ daar.

**De backup-cron draait**, elke nacht 03:20, beide databases plus `uploads/`, 30 dagen bewaard.
Eerste run met de hand gedaan en gecontroleerd: alle archieven geldig, 23 foto's in de tar.

### 🔴 De poort die bij de hardening meeging

De site was onbereikbaar, en dat had niets met de deploy te maken. Bij de **hardening van 28-08**
ging UFW op `default deny (incoming)`, en 6778 is toen nooit toegevoegd. De app draaide al 33
dagen door met 0 herstarts — er kwam alleen niemand bij, en dat viel niet op omdat er nog
niemand keek.

Dezelfde oorzaak zat achter een tweede raadsel: **5432 ging óók dicht**, dus lokaal `npm run dev`
kreeg geen enkele rij binnen. Dat geeft geen foutpagina maar een lege site, en `/aanbod` toonde
zijn lege staat — *"Binnenkort, we zetten de pakketten en prijzen op dit moment op een rij"* —
terwijl er zes pakketten in de database stonden. Dat las als een contentprobleem en was een
verbindingsprobleem. Lokaal gaat het nu via een SSH-tunnel op 15432.

> **Les:** zet je een poort dicht, controleer dan ook wat je *wél* wilde bereiken. En een lege
> staat die netjes is opgemaakt, verbergt een storing beter dan een foutmelding dat doet.

### 🍪 Een sessiecookie die ook zonder HTTPS blijft plakken

`NODE_ENV=production` doet twee dingen tegelijk: het serveert de gebouwde client
([`server/index.ts:61`](../../server/index.ts#L61)) én het zet `secure` op de sessiecookie
(regel 37). Op een kaal IP zonder certificaat bewaart een browser die cookie niet, dus inloggen
lukte en was bij de volgende pagina weer vergeten — met een wachtwoord dat gewoon klopte.
`NODE_ENV` verlagen kon niet: dan is er geen site meer.

`COOKIE_SECURE` maakt dat ene geval expliciet in plaats van `NODE_ENV` ervoor te verbuigen. Niet
gezet = precies het oude gedrag; wel gezet in productie = een waarschuwing in het log, want het
wachtwoord reist dan leesbaar mee en dat hoort niet stil te gebeuren.

> 🔴 **Dit is een tijdelijke toestand, geen eindsituatie.** Zolang er geen certificaat is, gaat
> haar wachtwoord onversleuteld over het internet. De drie dingen die terug moeten zodra HTTPS
> er is, staan in [../deployment/infra/domein.md](../deployment/infra/domein.md).

### 🔧 De lockfile die op twee npm-versies anders uitpakt

`npm ci` liep vast op de server: `Missing: esbuild@0.28.2 from lock file`. De oorzaak is een
verschil tussen de machines — npm **11** op de laptop, npm **10** op de server. npm 11 schreef de
boom zonder `vitest/node_modules/esbuild`, terwijl de geneste `vite` van vitest die wel eist, en
npm 10 weigert zo'n lockfile.

Onderliggend zit er een echte scheefheid: **vitest 4 vraagt `vite ^6 || ^7 || ^8` als peer,
terwijl het project op vite 5 zit.** npm 11 lost dat op met een geneste vite 7 en laat een gat
achter; npm 10 struikelt erover.

Opnieuw genereren op de laptop hielp niet — dan schoven er 157 versies mee en klapte `npm ci` op
platformspecifieke `@esbuild/*`-pakketten die op Windows als verplicht werden weggeschreven. Wat
wel werkte: npm op de server zelf het gat laten dichten met de bestaande lockfile als vertrekpunt.
Eén entry erbij, **geen enkele versie gewijzigd, niets verdwenen**, en teruggezet in git. `npm ci`
werkt nu op beide machines.

### 🎨 Zes pakketten op de homepage

*"Wat we maken"* toonde er drie terwijl er zes actief én uitgelicht zijn. Een bezoeker zag dus de
helft, en juist de graze-pakketten vielen buiten beeld — terwijl de kop erboven *"Sweet & grazing
tables"* zegt. Het raster van drie kolommen vult nu twee rijen.

### 🖼️ De galerij: van sticky stapel naar vaste overlap

Begon met een waarneming van de gebruiker: de bovenste twee kaarten schoven halverwege het
scrollen een stukje over elkaar heen, *"wat eig. best wel mooi is wat eig een bug is."* Dat effect
is nu opzet, maar het kostte vier rondes om te leren waaróm het niet zomaar kon.

1. **Overlap per paar** met een negatieve marge. Zag er goed uit aan de kant waar de foto over
   het tekstvlak viel, maar aan de andere kant lag het witte tekstvlak over de foto en sneed die
   doormidden.
2. **Foto per paar op dezelfde kant**, zodat op de naad foto op foto ligt. Dat loste het snijden
   op, maar toen bleek de knop van de kaart eronder te verdwijnen.
3. **Lucht onder de bedekte kaart.** Werkte bij het tweede paar en niet bij het eerste — en de
   meting legde uit waarom: **de overlap was daar geen 56 px maar 140.** Zodra een kaart
   vastplakt schuift hij omlaag de volgende kaart in. Met sticky uit was het overal precies 56.
4. **Het plakken eruit.** Genoeg lucht reserveren voor de maximale overlap kan wel, maar dan
   staat de tekst zichtbaar boven het midden van de kaart. Scheef staan is een hogere prijs dan
   het effect waard is.

Wat overblijft is gewone CSS: een vaste overlap van 56 px per paar, op elke scrollpositie
hetzelfde, en nooit een bedekte knop. De scroll-meting, de krimp-animatie, de mediaquery in JS en
de motion-import zijn daarmee vervallen — 105 regels eruit, 47 erin.

De foto wisselt **om en om per kaart** van kant, op verzoek: dat leest als een collage. De
oplossing uit ronde 2 (per paar dezelfde kant) was een reparatie voor een probleem dat met het
weghalen van het plakken al verdwenen was, en is dus teruggedraaid.

> **Les:** een effect dat per ongeluk ontstaat tijdens het scrollen, is niet hetzelfde als een
> effect dat je op elke scrollpositie kunt garanderen. Meten met de sticky aan én uit was wat het
> uiteindelijk uitlegde.

---

## Beslissingen die de scope bepaalden

**🗄️ De database is gekopieerd, niet gemigreerd (31-08).** Dev *was* het resultaat van de acht
migraties, en de vraag was "zet er precies neer wat er lokaal draait". Een kopie geeft dat; acht
migraties achter elkaar geven een reconstructie die er bijna gelijk aan is. Dit was een eenmalige
inhaalslag omdat live niets te verliezen had — **geen nieuwe werkwijze.** Een volgende
schemawijziging volgt weer gewoon de normale weg.

**🔓 De preview draait bewust op http (31-08).** Er is geen domein en geen certificaat, dus
`COOKIE_SECURE=false` en poort 6778 open. Dat is een aanvaard risico voor een besloten preview op
een adres dat nergens gedeeld wordt, en géén eindsituatie: haar wachtwoord gaat tot die tijd
leesbaar over de lijn.

**🖼️ Een vaste overlap wint van een sticky stapel (31-08).** De stapel las mooi, maar zodra een
kaart vastplakt schuift hij omlaag de volgende kaart in en groeit de overlap van 56 naar 140 px —
genoeg om een knop op te eten. Voorspelbaar op elke scrollpositie is meer waard dan een effect
dat je alleen tijdens het scrollen krijgt.

**📭 Mail valt volledig buiten scope (25-08).** Geen mailmodule, geen notificatie bij een nieuwe
aanvraag. Het enige signaal is de teller op het dashboard.

**🖼️ ~~We bouwen door op demofoto's (25-08).~~** ✅ **Achterhaald 27-08:** de democontent is
weg en de site draait op haar eigen foto's. De blokkerende stap in
[../deployment/testscript-master.md](../deployment/testscript-master.md) §8.8 is daarmee gehaald.

**🖼️ Geen events bij de start (27-08).** Haar foto's zijn niet per feest gegroepeerd, dus ze
hangen los onder hun gelegenheid. De eventlaag komt eronder zodra ze materiaal per feest heeft.
Een gelegenheid zonder foto's staat op verborgen: een tegel zonder beeld en een pagina die "nog
geen foto's" zegt, is erger dan geen pagina.

**🎨 Kleur is de ondergrond, niet de ster (27-08).** Secties en kaarten dragen kleur zodat de
pagina ritme heeft, maar haar foto's blijven het eerste wat opvalt. Eén massief saliepaneel per
pagina, niet meer.

**🎨 De huisstijl van de klant wint (27-08).** Het moodboard dat zij aanleverde is leidend, ook
al betekende dat een paletwissel door de hele codebase. Een site in een stijl die niet bij haar
logo past, is een site die ze niet als de hare herkent.

**🌐 De preview komt op de VPS (25-08).** Vraagt een `DEMO_PREVIEW`-slot met `noindex` en een
zichtbare demo-balk — voorwaarde, geen afwerking, vanwege de stockfoto's en de verzonnen reviews.

**🎨 Kleur heeft betekenis (26-08).** Niet per module een eigen tint en geen warme herstyling
van de hub, maar zeven semantische rollen. Je leest een scherm sneller omdat de kleur je iets
vertelt, en niet omdat het vrolijker is.

**🧾 Btw hoort bij de regel (25-08).** Niet bij de boeking, en niet bedrijfsbreed in de
instellingen.

**💶 Omzet telt op de datum van het feest (25-08).** Status `afgeleverd` + `event_date`, niet de
betaaldatum. Het werk is dan geleverd, dus de omzet is verdiend, ook als de klant later betaalt.
Wat er binnenkwam staat er los naast als kaspositie -- twee vragen, twee antwoorden. En er gaat
niets automatisch: een betaling bestaat pas als hij is vastgelegd.

---

## Wat er van de klant nodig is

Niet om te bouwen — wel om **live** te gaan. Status per item:
[../klant/content-checklist.md](../klant/content-checklist.md).

| Wat | Waarvoor |
|---|---|
| Foto's per event | vervangt de demo-content |
| Vanaf-prijzen + pakketinhoud | de demo-prijzen zijn plaatsvervangers |
| **Btw-verdeling per pakket** | welk deel eten is en welk deel styling — met haar boekhouder |
| Taart-prijslijst | staat op niet-publiek tot ze hem aanzet |
| Reviews | de vijf die er nu staan zijn verzonnen |
| Over-tekst, contactgegevens | in te vullen in het beheerscherm |
| DNS-toegang | voor het domein |

---

## Volgende sessie

1. **HTTPS regelen** — zie hierboven. Daarna `COOKIE_SECURE` uit `.env`, de UFW-regel op 6778
   dicht en `robots.txt` terug op `Allow: /`. Alle drie staan ze met reden in
   [../deployment/infra/domein.md](../deployment/infra/domein.md)
2. **De klant de gatenlijst voorleggen** uit
   [../klant/content-invulplan.md](../klant/content-invulplan.md). Wat nu blokkeert: de
   **prijzen** van alle zes pakketten, **foto's van een grazing table** (er zit er geen enkele
   bij haar twintig), **reviews** en de **over-tekst**
3. **De klikronde**: stap 13 van het boekingenplan, plus de nieuwe schermen op 375 / 768 / 1440
4. **Reduced motion nakijken** in de browser — de hero-parallax schakelt zichzelf uit via
   `usePrefersReducedMotion`, maar dat is alleen op code gecontroleerd. De galerij hoort daar
   sinds 31-08 niet meer bij: die heeft geen scroll-animatie meer
5. **Een backup één keer terugzetten.** Er draait er nu elke nacht een, maar teruggezet is er
   nooit één — en dan is het een aanname. Combineer het met de eerstvolgende keer dat de
   dev-database toch ververst moet worden
6. **`vitest` en `vite` rechttrekken.** vitest 4 vraagt `vite ^6 || ^7 || ^8`, het project zit op
   vite 5. Dat is wat de lockfile scheef trok en `npm ci` liet vallen. Nu gerepareerd, maar de
   scheefheid zelf staat er nog

**Opgelost sinds vorige keer:** de acht migraties staan op live, de code draait op de server, de
backup-cron bestaat, en de foto's staan niet meer op één machine. `demoImageForSlug()` was al
weg; `check:demo` controleert nu ook de database.

> ⚠️ **Drie Unsplash-foto's staan bewust nog bij de grazing-pakketten**, en zijn op 31-08
> meegegaan naar de server. Dat kan omdat de site niet publiek vindbaar is: geen domein, en
> `robots.txt` staat op `Disallow: /`. Ze moeten eruit vóór de site echt open gaat.
> `npm run check:demo -- --strict` faalt erop, en dat is de bedoeling — het is de bewaker.
> Weghalen: `npx tsx scripts/seed-demo-grazefotos.ts --verwijder`.
