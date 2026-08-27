# Werkblok — huidig (gestart 2026-08-24)

> **Status:** 🟢 **Alles uit de meeting is gebouwd, en sinds 27-08 draait het op de echte
> content van de klant.** Wat er nog moet: de acht migraties op live draaien, de code deployen,
> en de livegang zelf — waarvoor nog materiaal ontbreekt, zie
> [../klant/content-invulplan.md](../klant/content-invulplan.md).
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
| Migraties op live | ⏳ **nog niet** |
| Democontent | ✅ **weg** (27-08) — 36 foto's, 9 events en 6 reviews verwijderd |
| Klantcontent op dev | ✅ 20 foto's, 5 gelegenheden, 6 pakketten, 3 taartprijzen |

---

## Fasering — stand

| Fase | Wat | Stand |
|---|---|---|
| **0** | [Hardening](2-in-uitvoering/security-hardening.md) + [domein](3-onaangeraakt/infra-domein-livegang.md) + backups | 🟡 code af · firewall, DNS en backups open |
| **1** | Datamodel: `packages`, `gallery_albums`, `reviews` + velden | 🟡 **DEV ✅ / LIVE ⏳** |
| **2** | [Portfolio](1-klaar-voor-livegang/portfolio-categorie-albums.md): gelegenheden, albums, categorie-beheer | ✅ |
| **3** | [Pakketten & prijzen](1-klaar-voor-livegang/pakketten-en-prijzen.md) | ✅ |
| **4** | [Aanvraagflow](1-klaar-voor-livegang/aanvragen-formulier-uitbreiding.md) | ✅ |
| **5** | [Agenda](1-klaar-voor-livegang/agenda-boekingen.md) + ICS-feed | ✅ |
| **6** | [Reviews](1-klaar-voor-livegang/content-reviews.md) | ✅ |
| — | [Klantenbeheer](1-klaar-voor-livegang/klanten-uitbreiding.md) | ✅ |
| — | [Boekingen: sheet, agenda, offerte](2-in-uitvoering/boekingen-detailsheet-en-agenda.md) | ✅ stap 1–12 · stap 13 (muis-scenario's) open |
| — | [Democontent](#democontent) | ✅ staat op dev |
| — | [Instellingen bruikbaar maken](#instellingen) | ✅ |
| — | [Btw per regel, pakket en product](#btw) | ✅ **DEV ✅ / LIVE ⏳** |
| — | [`/aanbod` opnieuw ingedeeld](2-in-uitvoering/pakketten-aanbodpagina-indeling.md) | ✅ |
| — | [Betalingen + omzetpagina](#omzet) | ✅ **DEV ✅ / LIVE ⏳** |
| — | [Kleur door het beheerpaneel](#kleur) | ✅ |
| — | [Klantcontent + huisstijl](#klantcontent) | ✅ **DEV ✅ / LIVE ⏳** |
| **7** | Livegang: SEO, testronde | ⏳ wacht op prijzen, reviews en over-tekst |

---

## Wat er nu moet gebeuren

**1. De acht migraties op live**, in de vaste volgorde uit [../deployment/pending.md](../deployment/pending.md).
`pg_dump` eerst, dan de migraties, dan pas de code. Nooit andersom: Drizzle neemt elk schemaveld
op in de SELECT, dus code op een oud schema breekt élke query op die tabel.

**2. De klikronde afmaken** — stap 13 van het boekingenplan, plus de breedtes van de nieuwe
schermen (375 / 768 / 1440) en de randgevallen.

**3. Firewall** (poort 5432), **sterk wachtwoord** voor het live `admin`-account, **backup-cron**.

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

---

## Beslissingen die de scope bepaalden

**📭 Mail valt volledig buiten scope (25-08).** Geen mailmodule, geen notificatie bij een nieuwe
aanvraag. Het enige signaal is de teller op het dashboard.

**🖼️ ~~We bouwen door op demofoto's (25-08).~~** ✅ **Achterhaald 27-08:** de democontent is
weg en de site draait op haar eigen foto's. De blokkerende stap in
[../deployment/testscript-master.md](../deployment/testscript-master.md) §8.8 is daarmee gehaald.

**🖼️ Geen events bij de start (27-08).** Haar foto's zijn niet per feest gegroepeerd, dus ze
hangen los onder hun gelegenheid. De eventlaag komt eronder zodra ze materiaal per feest heeft.
Een gelegenheid zonder foto's staat op verborgen: een tegel zonder beeld en een pagina die "nog
geen foto's" zegt, is erger dan geen pagina.

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

1. **De acht migraties naar live**, dan deployen, dan de foto's en de twee contentscripts op de
   server draaien — zie de deployvolgorde in [../deployment/pending.md](../deployment/pending.md)
2. **De klant de gatenlijst voorleggen** uit
   [../klant/content-invulplan.md](../klant/content-invulplan.md) — prijzen, grazing-foto's,
   reviews en de over-tekst zijn wat er nu blokkeert
3. **`check:demo` uitbreiden** met een databasecontrole; hij scant nu alleen de gebouwde bundel
4. **De klikronde**: stap 13 plus de breedtes van de nieuwe schermen
5. **`DEMO_PREVIEW`-slot** — nu minder dringend: er staat geen stockmateriaal meer op de site,
   dus de preview toont echt werk. Het `noindex` blijft wel nodig zolang het domein niet leeft

**Opgelost sinds vorige keer:** `demoImageForSlug()` lekte op `/over`, `/contact` en de
processtappen van de homepage — die hele laag is verwijderd.
