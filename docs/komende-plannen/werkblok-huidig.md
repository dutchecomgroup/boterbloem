# Werkblok — huidig (gestart 2026-08-24)

> **Status:** 🟢 **Alles uit de meeting is gebouwd en draait op `atelierboterbloem_dev`.**
> Wat er nog moet: de zes migraties op live draaien, de code deployen, en de livegang zelf.
> **Branch:** `development` — daar landt het werk; `main` blijft wat er live hoort te kunnen.
> **Bij afsluiten:** archiveren als `werkblok-v0.1.md` in `../archive/planning/` en dit bestand resetten.

---

## Waar staan we?

| | |
|---|---|
| `npm run typecheck` | ✅ |
| `npm test` | ✅ 78 tests |
| `npm run build` | ✅ |
| Endpoint-verificatie tegen dev | ✅ |
| Migraties op dev | ✅ alle zes, idempotent |
| Migraties op live | ⏳ **nog niet** |
| Democontent op dev | ✅ 36 foto's, 9 events, 4 pakketten, 5 reviews |

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
| **7** | Livegang: demo eruit, SEO, testronde | ⏳ wacht op materiaal |

---

## Wat er nu moet gebeuren

**1. De zes migraties op live**, in de vaste volgorde uit [../deployment/pending.md](../deployment/pending.md).
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

## Beslissingen die de scope bepaalden

**📭 Mail valt volledig buiten scope (25-08).** Geen mailmodule, geen notificatie bij een nieuwe
aanvraag. Het enige signaal is de teller op het dashboard.

**🖼️ We bouwen door op demofoto's (25-08).** Die mogen **niet** mee naar de publieke live site.
Blokkerende stap in [../deployment/testscript-master.md](../deployment/testscript-master.md) §8.8.

**🌐 De preview komt op de VPS (25-08).** Vraagt een `DEMO_PREVIEW`-slot met `noindex` en een
zichtbare demo-balk — voorwaarde, geen afwerking, vanwege de stockfoto's en de verzonnen reviews.

**🧾 Btw hoort bij de regel (25-08).** Niet bij de boeking, en niet bedrijfsbreed in de
instellingen.

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

1. **De zes migraties naar live**, dan deployen, dan de oude taart-categorieën opruimen
2. **`DEMO_PREVIEW`-slot** — voorwaarde voordat de preview op de server mag
3. **`check:demo` uitbreiden** met een databasecontrole; hij scant nu alleen de gebouwde bundel
4. **`demoImageForSlug()` lekt** op `/over`, `/contact` en de processtappen van de homepage: die
   roepen 'm onvoorwaardelijk aan, dus daar staan stock-taarten tussen het nieuwe werk
5. **De klikronde**: stap 13 plus de breedtes van de nieuwe schermen
