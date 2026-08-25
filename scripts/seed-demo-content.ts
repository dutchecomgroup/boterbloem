import "dotenv/config";
import path from "node:path";
import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "../server/db.js";
import { env } from "../server/env.js";
import {
  galleryCategories,
  galleryAlbums,
  galleryItems,
  packages,
  reviews,
  siteSettings,
  type AlbumBlok,
} from "../shared/schema.js";

/**
 * ⚠️ DEMOCONTENT — moet weg vóór de livegang.
 *
 * Vult de database met samenhangende voorbeeldinhoud zodat de klant kan zien hoe haar site
 * eruit gaat zien voordat ze een fotoshoot plant en prijzen doorgeeft.
 *
 * Waarom in de database en niet in `client/src/lib/demoGallery.ts`? Die frontend-demo schakelt
 * zichzelf uit zodra er één echte foto in de database staat (`heeftEchteContent()`), en het
 * beheerpaneel blijft er leeg bij. Met echte rijen kan de klant óók door Galerij, Pakketten en
 * Reviews klikken.
 *
 * Alles wat dit script maakt draagt `source: "demo"` of staat in DEMO_ALBUM_SLUGS. Dat is de
 * haak waar `--verwijder` aan hangt.
 *
 *   npx tsx scripts/seed-demo-content.ts                 # aanvullen (idempotent)
 *   npx tsx scripts/seed-demo-content.ts --schoon        # eerst weg, dan opnieuw
 *   npx tsx scripts/seed-demo-content.ts --verwijder     # alle democontent weg
 *   npx tsx scripts/seed-demo-content.ts --testdata-weg  # oude testuploads opruimen
 *
 * 🔴 De foto's zijn stockmateriaal van Unsplash, geen werk van het atelier, en de reviews zijn
 * verzonnen. Ze tonen als haar werk misleidt bezoekers die daarop een offerte aanvragen. Zie
 * `docs/deployment/testscript-master.md` §8.8 — dat is een blokkerende stap.
 */

// ---------------------------------------------------------------------------
// Foto's
// ---------------------------------------------------------------------------

/**
 * Unsplash-licentie: gratis, ook commercieel, naamsvermelding niet verplicht.
 *
 * Elke URL hieronder is met `curl` op 200 gecontroleerd. Let op bij aanvullen: de
 * zoekresultaten van Unsplash mengen er `plus.unsplash.com/premium_photo-…` doorheen en dát is
 * Unsplash+ — betaald. Alleen `images.unsplash.com/photo-…` mag hier staan.
 */
const bron = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=80`;

interface DemoFoto {
  /** Unsplash-id, tevens de sleutel om er later naar te verwijzen (pakket-covers). */
  id: string;
  alt: string;
  caption: string;
}

interface DemoEvent {
  categorieSlug: string;
  slug: string;
  title: string;
  eventDate: string;
  description: string;
  fotos: DemoFoto[];
  /**
   * Het verhaal bij dit event. Krijgt de zojuist aangemaakte foto-id's in dezelfde volgorde als
   * `fotos`. Weglaten = `blocks: null` = "nog niet ingedeeld", en dan toont de pagina gewoon de
   * omschrijving met alle foto's eronder. Allebei de weergaven staan er bewust in.
   */
  verhaal?: (fotoIds: number[]) => AlbumBlok[];
}

const DEMO_EVENTS: DemoEvent[] = [
  {
    categorieSlug: "babyshower",
    slug: "pastel-sweet-table",
    title: "Pastel sweet table voor Lisa",
    eventDate: "2026-03-14",
    description:
      "Een zachte tafel in oudroze, mint en gebroken wit. De taart als middelpunt, daaromheen " +
      "cakepops, macarons en kleine bordjes zodat iedereen wat kan proeven.",
    fotos: [
      {
        id: "photo-1709423166198-cc44576fbe72",
        alt: "Sweet table met witte taart en verschillende desserts",
        caption: "De hele tafel, opgebouwd in drie hoogtes",
      },
      {
        id: "photo-1555526148-7d64113f1574",
        alt: "Cakepops en cupcakes op een schaal",
        caption: "Cakepops en mini cupcakes",
      },
      {
        id: "photo-1555526148-5cd740b44241",
        alt: "Bordje met verschillende mini desserts",
        caption: "Vier soorten mini dessert per gast",
      },
      {
        id: "photo-1702745572427-c7c772b45ff3",
        alt: "Macarons in pasteltinten",
        caption: "Macarons in de kleuren van het feest",
      },
      {
        id: "photo-1525956570400-207225f50dd6",
        alt: "Drie taarten op etagères voor een spiegel",
        caption: "Etagères geven de tafel diepte",
      },
    ],
    verhaal: (f) => [
      { soort: "tekst", inhoud: "Lisa wilde geen strakke witte tafel maar iets zachts, met veel pastel en bloemen. We zijn begonnen bij de taart en hebben de rest daar omheen gekozen." },
      { soort: "fotos", itemIds: [f[0]] },
      { soort: "kop", inhoud: "Klein, zodat je alles kunt proeven" },
      { soort: "tekst", inhoud: "Alles op deze tafel is hapklaar. Vijfentwintig gasten, geen bordjes en bestek nodig, en dat houdt het feest in beweging." },
      { soort: "fotos", itemIds: [f[1], f[2], f[3]] },
      { soort: "kop", inhoud: "Hoogte maakt het verschil" },
      { soort: "tekst", inhoud: "Een tafel die helemaal vlak is oogt altijd voller op de foto dan in het echt. Met etagères en een paar kistjes eronder krijg je lagen, en dan valt elk onderdeel op." },
      { soort: "fotos", itemIds: [f[4]] },
    ],
  },
  {
    categorieSlug: "babyshower",
    slug: "grazing-table-lente",
    title: "Grazing table in de lente",
    eventDate: "2026-05-02",
    description:
      "Hartig deze keer: kazen, charcuterie, seizoensfruit en verse broodjes over de volle lengte " +
      "van de tafel. Gasten schuiven aan wanneer ze willen.",
    fotos: [
      {
        id: "photo-1642643151267-86ee35313758",
        alt: "Houten tafel vol kaas, fruit en brood",
        caption: "Over de volle lengte opgebouwd",
      },
      {
        id: "photo-1576021182211-9ea8dced3690",
        alt: "Verschillende soorten fruit naast elkaar",
        caption: "Fruit van het seizoen",
      },
      {
        id: "photo-1640618491853-95b2c5041eda",
        alt: "Plank met kaas, crackers, noten en olijven",
        caption: "Kaas, noten en olijven",
      },
      {
        id: "photo-1633981744930-15bb79ca2c41",
        alt: "Schaal met kaas, crackers en aardbeien",
        caption: "Zoet en hartig door elkaar",
      },
    ],
  },
  {
    categorieSlug: "bruiloft",
    slug: "tuinbruiloft",
    title: "Tuinbruiloft",
    eventDate: "2026-06-21",
    description:
      "Een tafel in de tuin, met verse bloemen uit dezelfde stukken als op de gasttafels. " +
      "Drielaags als middelpunt, daaromheen kleine taartjes.",
    fotos: [
      {
        id: "photo-1719512037593-ff130a27903a",
        alt: "Desserttafel met bloemen",
        caption: "Dezelfde bloemen als op de gasttafels",
      },
      {
        id: "photo-1549312142-d1b299cfe034",
        alt: "Witte taart op een taartstandaard",
        caption: "Drielaags, met verse bloemen",
      },
      {
        id: "photo-1776267890245-a54746d62d1a",
        alt: "Tafel vol desserts en bloemstukken",
        caption: "De tafel vlak voor de gasten kwamen",
      },
      {
        id: "photo-1508349307373-ab2edc239589",
        alt: "Gebak op een glazen etagère",
        caption: "Kleine taartjes op glaswerk",
      },
      {
        id: "photo-1635341109654-b226bba47446",
        alt: "Tafel met champagneglazen",
        caption: "Naast de bar opgesteld",
      },
    ],
    verhaal: (f) => [
      { soort: "tekst", inhoud: "Een bruiloft in de eigen tuin, en dus geen locatie die vertelt hoe het eruit moet zien. We hebben de bloemist gebeld en dezelfde bloemen besteld die op de gasttafels stonden." },
      { soort: "fotos", itemIds: [f[0], f[1]] },
      { soort: "kop", inhoud: "Buiten opbouwen vraagt om andere keuzes" },
      { soort: "tekst", inhoud: "In de zon houdt buttercream het niet. Alles op deze tafel is gemaakt met ganache of een stevige vulling, en de tafel stond bewust in de schaduw van de haag. Om vijf uur schoof de zon door, maar toen was de tafel al leeg." },
      { soort: "fotos", itemIds: [f[2], f[3], f[4]] },
    ],
  },
  {
    categorieSlug: "bruiloft",
    slug: "bruiloft-bladgoud",
    title: "Bruiloft met bladgoud",
    eventDate: "2026-07-11",
    description: "Strak wit met gouden accenten. Weinig kleuren, veel textuur.",
    fotos: [
      {
        id: "photo-1774660810442-c98a8324f683",
        alt: "Witte taart met gouden monogram en bloemen",
        caption: "Monogram in bladgoud",
      },
      {
        id: "photo-1774660811213-37f1b8e8f00c",
        alt: "Desserttafel met taart en bloemstukken",
        caption: "De tafel in wit en goud",
      },
      {
        id: "photo-1780586383335-7a64e1dcb30c",
        alt: "Witte desserts in een kristallen schaal",
        caption: "Kristal leende de bruid van haar oma",
      },
      {
        id: "photo-1780586383327-67801165daf8",
        alt: "Witte truffels in een kristallen schaal",
        caption: "Truffels met witte chocolade",
      },
    ],
  },
  {
    categorieSlug: "verjaardag",
    slug: "sweet-16",
    title: "Sweet 16",
    eventDate: "2026-04-08",
    description: "Vrolijk, kleurrijk en vooral veel keuze. Precies wat een zestienjarige wil.",
    fotos: [
      {
        id: "photo-1624353365286-3f8d62daad51",
        alt: "Desserttafel met verschillende zoetigheden",
        caption: "Alles wat ze zelf uitkoos",
      },
      {
        id: "photo-1559090337-ba4123bb1682",
        alt: "Tafel met gebak en taart",
        caption: "Vijfentwintig gasten, niets over",
      },
      {
        id: "photo-1623246123320-0d6636755796",
        alt: "Cupcakes met glazuur op een tafel",
        caption: "Cupcakes in drie smaken",
      },
      {
        id: "photo-1569864358642-9d1684040f43",
        alt: "Franse macarons in verschillende kleuren",
        caption: "Macarons in vijf kleuren",
      },
      {
        id: "photo-1531594652722-292a43e752b4",
        alt: "Schaal met Franse macarons",
        caption: "Per kleur een eigen smaak",
      },
    ],
    verhaal: (f) => [
      { soort: "kop", inhoud: "Ze koos zelf" },
      { soort: "tekst", inhoud: "De moeder belde, maar de dochter besliste. We hebben samen een lijstje gemaakt en daar één ding aan toegevoegd dat zij nog niet kende: de macarons, en die waren als eerste op." },
      { soort: "fotos", itemIds: [f[0], f[2], f[3]] },
      { soort: "tekst", inhoud: "Voor vijfentwintig gasten reken je ongeveer vier tot vijf stuks per persoon. Klinkt veel, maar op een sweet table pakt iedereen iets kleins en komt daarna nog een keer terug." },
      { soort: "fotos", itemIds: [f[1], f[4]] },
    ],
  },
  {
    // Bewust maar twee foto's: zo ziet een event eruit dat net is aangemaakt, en dan is te zien
    // hoe de pagina zich houdt wanneer zij pas begint met uploaden.
    categorieSlug: "verjaardag",
    slug: "vijftig-jaar-bordeaux",
    title: "Vijftig jaar, in bordeaux en goud",
    eventDate: "2026-01-24",
    description: "Donkerder palet dan we meestal doen. Bordeaux, diep groen en mat goud.",
    fotos: [
      {
        id: "photo-1583337912553-c0e828c51bc5",
        alt: "Desserttafel in donkere tinten",
        caption: "Bordeaux en mat goud",
      },
      {
        id: "photo-1565548256460-392ca7bd3633",
        alt: "Verschillende desserts op een tafel",
        caption: "Chocolade, koffie en karamel",
      },
    ],
  },
  {
    categorieSlug: "bedrijfsevent",
    slug: "grazing-table-borrel",
    title: "Grazing table bij een bedrijfsborrel",
    eventDate: "2026-02-19",
    description:
      "Honderd gasten, staand, en niemand die met een bordje wil sjouwen. Alles hapklaar en " +
      "twee keer bijgevuld tijdens de avond.",
    fotos: [
      {
        id: "photo-1565661834093-b749691b6c82",
        alt: "Tafel met verschillende soorten hapjes",
        caption: "Opgebouwd voor honderd gasten",
      },
      {
        id: "photo-1575178018553-5b4e17b751be",
        alt: "Hapjes en desserts naast elkaar",
        caption: "Hartig links, zoet rechts",
      },
      {
        id: "photo-1653559251018-f59d60ab3223",
        alt: "Houten tafel met verschillende gerechten",
        caption: "Alles zonder bestek te eten",
      },
      {
        id: "photo-1678572823447-45fc146df43c",
        alt: "Houten tafel vol met verschillende soorten eten",
        caption: "Halverwege de avond bijgevuld",
      },
      {
        id: "photo-1566802516196-1bb541e324e2",
        alt: "Gesneden groenten",
        caption: "Rauwkost met drie dips",
      },
    ],
    verhaal: (f) => [
      { soort: "tekst", inhoud: "Bij een borrel van honderd man werkt een sweet table niet: iedereen staat, en niemand wil een bordje vasthouden naast zijn glas. Dit is daarom een grazing table geworden, hartig met een zoete hoek." },
      { soort: "fotos", itemIds: [f[0], f[1]] },
      { soort: "kop", inhoud: "Twee keer bijvullen" },
      { soort: "tekst", inhoud: "Een tafel die halverwege de avond half leeg is, oogt zielig. We houden daarom een derde van alles achter en vullen twee keer bij, om half negen en om tien uur." },
      { soort: "fotos", itemIds: [f[2], f[3], f[4]] },
    ],
  },
  {
    categorieSlug: "communie",
    slug: "communie-wit-groen",
    title: "Communie in wit en groen",
    eventDate: "2026-05-17",
    description: "Rustig, licht en niet te zoet, met veel groen uit de tuin.",
    fotos: [
      {
        id: "photo-1561940329-7382e6704231",
        alt: "Gebak op keramische schalen",
        caption: "Wit gebak met groen eromheen",
      },
      {
        id: "photo-1565320095022-b810fe4b51ff",
        alt: "Gebakken taartje",
        caption: "Tartelettes met citroen",
      },
      {
        id: "photo-1587668178277-295251f900ce",
        alt: "Cupcake met wit glazuur",
        caption: "Cupcakes met vanille",
      },
    ],
  },
  {
    categorieSlug: "geboorte",
    slug: "doopsuiker-mini-desserts",
    title: "Doopsuiker en mini desserts",
    eventDate: "2026-06-06",
    description: "Een klein tafeltje voor de kraamvisite, met doosjes om mee te geven.",
    fotos: [
      {
        id: "photo-1518566585952-954bb14432d1",
        alt: "Schaal met donuts",
        caption: "Mini donuts met suikerglazuur",
      },
      {
        id: "photo-1568065574407-60ffd4bc32ab",
        alt: "Cakepop in een cadeauverpakking",
        caption: "Doosjes om mee te geven",
      },
      {
        id: "photo-1558326567-98ae2405596b",
        alt: "Macarons op tafel",
        caption: "Macarons in babyroze",
      },
    ],
  },
];

/** Voor `--verwijder`: albums hebben geen `source`-kolom, dus dit is de lijst. */
const DEMO_ALBUM_SLUGS = DEMO_EVENTS.map((e) => e.slug);

// ---------------------------------------------------------------------------
// Overige inhoud
// ---------------------------------------------------------------------------

/** De inleiding boven een gelegenheid-pagina. Stond overal op `null`. */
const CATEGORIE_TEKST: Record<string, string> = {
  babyshower:
    "Zacht, speels en meestal in pastel. Een sweet table op een babyshower is klein en hapklaar, " +
    "want je gasten zitten door elkaar en lopen langs de tafel wanneer ze willen.",
  bruiloft:
    "Van een intieme tafel voor dertig gasten tot een opstelling die de hele avond meegaat. " +
    "We stemmen de kleuren af op jullie bloemen en de locatie.",
  verjaardag:
    "Voor wie iets bijzonders verdient. Een taart als middelpunt, en daaromheen genoeg keuze " +
    "zodat iedereen iets vindt dat hij lekker vindt.",
  communie:
    "Licht en rustig, meestal in wit met groen. Niet te zoet, want er wordt die dag al genoeg " +
    "gegeten.",
  geboorte:
    "Een klein tafeltje voor de kraamvisite, of doosjes om mee te geven. Ook leuk als de " +
    "grote broer of zus mag helpen kiezen.",
  bedrijfsevent:
    "Representatief en toch persoonlijk. Meestal staand, dus alles zonder bordje en bestek te " +
    "eten. Vertel ons hoeveel gasten en hoe lang de avond duurt.",
  overig:
    "Een jubileum, een afscheid, een housewarming: een tafel vol zoets past bij meer dan je " +
    "denkt. Vraag gerust wat er mogelijk is.",
};

/**
 * Vanaf-prijzen, afgeleid van wat Nederlandse aanbieders vragen (grazing tables € 17,50–€ 33,50
 * p.p.). Dit zijn **plaatsvervangers zodat de kaarten niet leeg staan**, geen advies. De klant
 * bevestigt ze voordat de site live gaat; tot die tijd staat er in de demo-balk dat het
 * voorbeelden zijn.
 */
const DEMO_PAKKETTEN = [
  {
    slug: "sweet-table",
    priceFrom: "295.00",
    priceUnit: "totaal",
    personsMin: 15,
    personsMax: 40,
    description:
      "Het complete zoete tafereel: een taart als middelpunt, vier soorten mini dessert, " +
      "cupcakes en de styling eromheen. Wij bouwen op locatie op.",
    coverFoto: "photo-1709423166198-cc44576fbe72",
  },
  {
    slug: "sweet-table-xl",
    priceFrom: "545.00",
    priceUnit: "totaal",
    personsMin: 40,
    personsMax: 80,
    description:
      "Voor grotere feesten. Zes tot acht soorten mini dessert, macarons erbij, en een " +
      "opstelling met meerdere niveaus zodat de tafel ook op afstand klopt.",
    coverFoto: "photo-1624353365286-3f8d62daad51",
  },
  {
    slug: "bruiloft-table",
    priceFrom: "695.00",
    priceUnit: "totaal",
    personsMin: 40,
    personsMax: null,
    description:
      "Afgestemd op jullie dag, tot de laatste suikerbloem. Inclusief ontwerpgesprek, " +
      "bruidstaart op maat en overleg met de locatie over opbouw en afbouw.",
    coverFoto: "photo-1719512037593-ff130a27903a",
  },
  {
    // Ontbrak volledig, terwijl de site "Sweet & grazing tables" als kop voert.
    slug: "grazing-table",
    name: "Grazing Table",
    tagline: "Hartig, over de volle lengte van de tafel",
    priceFrom: "24.50",
    priceUnit: "per_persoon",
    personsMin: 20,
    personsMax: null,
    description:
      "Kazen, charcuterie, seizoensfruit, verse broodjes en dips, over de volle lengte " +
      "opgebouwd. Alles zonder bordje en bestek te eten, dus ideaal bij een staande borrel.",
    includes: [
      "Kazen en charcuterie",
      "Seizoensfruit en rauwkost",
      "Verse broodjes, crackers en drie dips",
      "Noten, olijven en tapenades",
      "Styling met planken, kistjes en groen",
      "Opbouw ter plaatse",
    ],
    coverFoto: "photo-1642643151267-86ee35313758",
  },
];

/**
 * 🔴 Verzonnen. Alleen voornaam plus initiaal, en de demo-balk zegt erbij dat het voorbeelden
 * zijn. Aanbevelingen met een naam eronder die niet bestaat zijn geen detail: iemand die daarop
 * een offerte aanvraagt is misleid. Weg vóór de livegang.
 */
const DEMO_REVIEWS = [
  {
    // Bewust niet "Sanne": er stond al een review van een Sanne over een babyshower in de
    // database. Twee bijna gelijke namen bij hetzelfde soort feest naast elkaar op de homepage
    // leest als een fout, ook al is het er geen.
    authorName: "Iris B.",
    eventType: "Babyshower",
    rating: 5,
    occurredOn: "2026-03-16",
    featured: true,
    sortOrder: 0,
    body:
      "De tafel was precies zoals ik het me had voorgesteld, en eigenlijk nog mooier. Iedereen " +
      "stond te fotograferen voordat er iemand durfde te pakken. De macarons waren binnen een " +
      "half uur op.",
  },
  {
    authorName: "Mark & Eline",
    eventType: "Bruiloft",
    rating: 5,
    occurredOn: "2026-06-23",
    featured: true,
    sortOrder: 1,
    body:
      "We hadden een tuinbruiloft en dus geen locatie die alles regelt. Er werd meegedacht over " +
      "de schaduw, de tijden en zelfs over onze bloemist. Dat scheelde ons een hoop zorgen op de " +
      "dag zelf.",
  },
  {
    authorName: "Joyce H.",
    eventType: "Verjaardag",
    rating: 5,
    occurredOn: "2026-04-10",
    featured: false,
    sortOrder: 2,
    body:
      "Mijn dochter mocht zelf kiezen wat erop kwam en dat vond ze het leukste van haar hele " +
      "feest. Er werd geduldig met haar overlegd, ook toen ze halverwege van gedachten " +
      "veranderde.",
  },
  {
    authorName: "Bram de W.",
    eventType: "Bedrijfsevent",
    rating: 5,
    occurredOn: "2026-02-21",
    featured: false,
    sortOrder: 3,
    body:
      "Honderd man op een borrel en toch geen rij bij de tafel. Er werd twee keer bijgevuld " +
      "zonder dat wij er iets van merkten. Collega's vragen nog steeds wie dat verzorgd heeft.",
  },
  {
    authorName: "Miriam K.",
    eventType: "Communie",
    rating: 4,
    occurredOn: "2026-05-19",
    featured: false,
    sortOrder: 4,
    body:
      "Licht en niet te zoet, precies waar ik om gevraagd had. Het enige minpuntje: ik had er " +
      "meer van moeten bestellen, want om vier uur was alles weg.",
  },
];

// ---------------------------------------------------------------------------
// Foto binnenhalen — zelfde weg als een echte upload
// ---------------------------------------------------------------------------

const GALLERY_DIR = path.resolve(env.UPLOADS_DIR, "gallery");

/**
 * Downloaden en door Sharp halen, exact zoals `server/routes/admin/gallery.ts` dat bij een
 * upload doet. Zo gedraagt democontent zich als de rest: WebP, maximaal 1600×1600, een
 * UUID-bestandsnaam, en `width`/`height` uit Sharp in plaats van geraden.
 *
 * Het enige verschil: `source: "demo"`.
 */
async function haalFotoBinnen(foto: DemoFoto, categoryId: number, albumId: number, sortOrder: number) {
  const res = await fetch(bron(foto.id));
  if (!res.ok) {
    throw new Error(`Foto ${foto.id} gaf ${res.status}. Bestaat hij nog op Unsplash?`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());

  const outName = `${randomUUID()}.webp`;
  const meta = await sharp(buffer)
    .rotate()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(path.join(GALLERY_DIR, outName));

  const [row] = await db
    .insert(galleryItems)
    .values({
      categoryId,
      albumId,
      filename: outName,
      altText: foto.alt,
      caption: foto.caption,
      width: meta.width,
      height: meta.height,
      // Eerste foto van elk event uitgelicht: dat vult "Uitgelicht werk" en de hero-carousel
      // op de homepage. Zonder dit valt de carousel terug op de stock-taarten uit
      // demoGallery.ts, en dan meng je twee soorten opvulling door elkaar.
      featured: sortOrder === 0,
      sortOrder,
      source: "demo",
    })
    .returning();

  return row;
}

// ---------------------------------------------------------------------------
// Vullen
// ---------------------------------------------------------------------------

async function vulCategorieTeksten() {
  for (const [slug, description] of Object.entries(CATEGORIE_TEKST)) {
    await db.update(galleryCategories).set({ description }).where(eq(galleryCategories.slug, slug));
  }
  console.log(`  ✓ inleiding gezet op ${Object.keys(CATEGORIE_TEKST).length} gelegenheden`);
}

async function vulEvents() {
  const cats = await db.select().from(galleryCategories);
  const catId = new Map(cats.map((c) => [c.slug, c.id]));

  /** Voor de pakket-covers: Unsplash-id → net aangemaakte gallery_item-id. */
  const fotoIdPerBron = new Map<string, number>();

  for (const ev of DEMO_EVENTS) {
    const categoryId = catId.get(ev.categorieSlug);
    if (!categoryId) {
      console.log(`  ⚠ gelegenheid "${ev.categorieSlug}" bestaat niet — "${ev.title}" overgeslagen`);
      continue;
    }

    const [bestaat] = await db
      .select({ id: galleryAlbums.id })
      .from(galleryAlbums)
      .where(eq(galleryAlbums.slug, ev.slug));
    if (bestaat) {
      console.log(`  · "${ev.title}" bestaat al — overgeslagen`);
      continue;
    }

    const [album] = await db
      .insert(galleryAlbums)
      .values({
        categoryId,
        slug: ev.slug,
        title: ev.title,
        eventDate: ev.eventDate,
        description: ev.description,
        published: true,
        sortOrder: DEMO_EVENTS.indexOf(ev),
      })
      .returning();

    const ids: number[] = [];
    for (const [i, foto] of ev.fotos.entries()) {
      const row = await haalFotoBinnen(foto, categoryId, album.id, i);
      ids.push(row.id);
      fotoIdPerBron.set(foto.id, row.id);
    }

    // Cover en verhaal kunnen pas nu: allebei verwijzen naar foto-id's die hierboven ontstaan.
    await db
      .update(galleryAlbums)
      .set({
        coverItemId: ids[0] ?? null,
        blocks: ev.verhaal ? ev.verhaal(ids) : null,
      })
      .where(eq(galleryAlbums.id, album.id));

    console.log(`  ✓ ${ev.title} — ${ids.length} foto's${ev.verhaal ? " + verhaal" : ""}`);
  }

  return fotoIdPerBron;
}

async function vulPakketten(fotoIdPerBron: Map<string, number>) {
  for (const p of DEMO_PAKKETTEN) {
    const { slug, coverFoto, ...velden } = p;
    const coverItemId = fotoIdPerBron.get(coverFoto) ?? null;

    const [bestaat] = await db.select({ id: packages.id }).from(packages).where(eq(packages.slug, slug));

    if (bestaat) {
      // Bestaande pakketten krijgen alleen prijs, personen, omschrijving en cover erbij. Naam,
      // tagline en `includes` komen uit seed-admin en zijn al goed.
      await db
        .update(packages)
        .set({ ...velden, coverItemId, active: true, featured: true })
        .where(eq(packages.id, bestaat.id));
      console.log(`  ✓ ${slug} — prijs en cover gezet`);
    } else {
      await db.insert(packages).values({
        slug,
        name: (velden as { name?: string }).name ?? slug,
        ...velden,
        coverItemId,
        active: true,
        featured: true,
        sortOrder: DEMO_PAKKETTEN.indexOf(p),
      } as typeof packages.$inferInsert);
      console.log(`  ✓ ${slug} — nieuw aangemaakt`);
    }
  }
}

async function vulReviews() {
  for (const r of DEMO_REVIEWS) {
    const [bestaat] = await db
      .select({ id: reviews.id })
      .from(reviews)
      .where(eq(reviews.authorName, r.authorName));
    if (bestaat) continue;
    await db.insert(reviews).values({ ...r, published: true, source: "demo" });
  }
  console.log(`  ✓ ${DEMO_REVIEWS.length} reviews`);
}

/**
 * `upsert`, niet `onConflictDoNothing`. Dat laatste is precies waarom de over-tekst nooit is
 * bijgewerkt toen de site van taart-eerst naar tables-eerst ging: de rij bestond al, dus de
 * nieuwe standaardwaarde uit seed-admin landde nooit.
 */
async function zetInstellingen() {
  const waarden: Record<string, unknown> = {
    hero: {
      title: "Atelier Boterbloem",
      tagline:
        "Sweet tables en grazing tables voor jouw mooiste momenten. Bruiloften, babyshowers, " +
        "en alles daartussen.",
      ctaLabel: "Vraag offerte aan",
      ctaHref: "/contact",
      imageFilename: "",
    },
    about: {
      heading: "Over Atelier Boterbloem",
      body:
        "Vanuit liefde voor het ambacht bouwen wij elke tafel met de hand op. Sweet tables, " +
        "grazing tables en taarten. Ieder ontwerp wordt persoonlijk afgestemd op jouw verhaal.",
      imageFilename: "",
    },
  };

  // Contact apart: alleen het e-mailadres, want dat is haar eigen domein. Het telefoonnummer
  // blijft leeg tot zij er een doorgeeft — een verzonnen 06-nummer is van iemand anders.
  const [huidig] = await db.select().from(siteSettings).where(eq(siteSettings.key, "contact"));
  const contact = (huidig?.value ?? {}) as Record<string, unknown>;
  waarden.contact = {
    ...contact,
    email: "hallo@atelierboterbloem.nl",
    phone: "",
    instagram: contact.instagram ?? "https://instagram.com/atelierboterbloem",
  };

  for (const [key, value] of Object.entries(waarden)) {
    await db
      .insert(siteSettings)
      .values({ key, value })
      .onConflictDoUpdate({ target: siteSettings.key, set: { value, updatedAt: new Date() } });
  }
  console.log(`  ✓ instellingen: hero, about, contact`);
}

// ---------------------------------------------------------------------------
// Verwijderen
// ---------------------------------------------------------------------------

async function verwijderDemo() {
  const items = await db.select().from(galleryItems).where(eq(galleryItems.source, "demo"));

  // Eerst de verwijzingen los, anders houdt een cover of een pakket de rij vast.
  for (const it of items) {
    await db.update(galleryAlbums).set({ coverItemId: null }).where(eq(galleryAlbums.coverItemId, it.id));
    await db.update(packages).set({ coverItemId: null }).where(eq(packages.coverItemId, it.id));
  }

  await db.delete(galleryItems).where(eq(galleryItems.source, "demo"));

  let bestandenWeg = 0;
  for (const it of items) {
    try {
      await fs.unlink(path.join(GALLERY_DIR, it.filename));
      bestandenWeg++;
    } catch {
      // Al weg is ook goed.
    }
  }

  const albums = await db.delete(galleryAlbums).where(inArray(galleryAlbums.slug, DEMO_ALBUM_SLUGS)).returning();
  const revs = await db.delete(reviews).where(eq(reviews.source, "demo")).returning();

  // Pakketten blijven staan — die zijn echte inhoud. Ze gaan terug naar de staat uit
  // seed-admin: geen prijs, niet zichtbaar, zodat er geen verzonnen bedrag op de site staat.
  await db.update(packages).set({ priceFrom: "0", active: false, coverItemId: null });

  console.log(`  ✓ ${items.length} foto's (${bestandenWeg} bestanden), ${albums.length} events, ${revs.length} reviews`);
  console.log(`  ✓ pakketten terug op prijs 0 en niet-zichtbaar`);
}

/**
 * De testdata van 24/25-08: uploads zonder alt-tekst of bijschrift, en een album "dwdwdw".
 * Achter een eigen vlag met een telling vooraf, want dit script hoort ook te draaien op een
 * database waar wél echte foto's van de klant in staan.
 */
async function verwijderTestdata() {
  const verdacht = await db
    .select()
    .from(galleryItems)
    .where(sql`${galleryItems.source} = 'upload' and ${galleryItems.altText} is null and ${galleryItems.caption} is null`);

  if (verdacht.length === 0) {
    console.log("  · geen testuploads gevonden");
  } else {
    console.log(`  ! ${verdacht.length} uploads zonder alt-tekst én zonder bijschrift:`);
    for (const it of verdacht) console.log(`      #${it.id}  ${it.filename}`);

    for (const it of verdacht) {
      await db.update(galleryAlbums).set({ coverItemId: null }).where(eq(galleryAlbums.coverItemId, it.id));
      await db.update(packages).set({ coverItemId: null }).where(eq(packages.coverItemId, it.id));
    }
    await db.delete(galleryItems).where(inArray(galleryItems.id, verdacht.map((i) => i.id)));
    for (const it of verdacht) {
      try {
        await fs.unlink(path.join(GALLERY_DIR, it.filename));
      } catch {
        /* al weg */
      }
    }
    console.log(`  ✓ ${verdacht.length} testuploads weg`);
  }

  const rommel = await db.delete(galleryAlbums).where(inArray(galleryAlbums.slug, ["dwdwdw"])).returning();
  if (rommel.length) console.log(`  ✓ album "dwdwdw" weg`);

  /*
   * Een album dat na het opruimen leeg overblijft én dezelfde slug draagt als een event dat we
   * zo gaan aanmaken, houdt dat event tegen: `vulEvents()` ziet de slug, denkt "bestaat al" en
   * slaat over. Zo bleef "Sweet 16" achter als een event zonder foto's.
   *
   * Alleen bij die botsing, en alleen als het album leeg is. Een album van de klant met foto's
   * erin blijft staan, en een leeg album dat zij net zelf heeft aangemaakt ook — tenzij het
   * toevallig een demo-slug draagt, en dan is het van ons.
   */
  const leegEnBotst = await db
    .select({ id: galleryAlbums.id, slug: galleryAlbums.slug, title: galleryAlbums.title })
    .from(galleryAlbums)
    .where(
      sql`${galleryAlbums.slug} in ${sql`(${sql.join(DEMO_ALBUM_SLUGS.map((s) => sql`${s}`), sql`, `)})`}
          and not exists (select 1 from gallery_items gi where gi.album_id = ${galleryAlbums.id})`,
    );

  for (const a of leegEnBotst) {
    await db.delete(galleryAlbums).where(eq(galleryAlbums.id, a.id));
    console.log(`  ✓ leeg event "${a.title}" weg — maakte plaats voor het demo-event`);
  }

  // Verzonnen reviews die niet van dit script komen worden **niet** stilzwijgend verwijderd:
  // dit script kan het verschil niet zien met een echte review van een klant. Wel melden, want
  // `--verwijder` laat ze straks staan en dan gaan ze mee naar de live site.
  const vreemd = await db
    .select({ id: reviews.id, authorName: reviews.authorName })
    .from(reviews)
    .where(sql`${reviews.published} and ${reviews.source} <> 'demo'`);
  if (vreemd.length) {
    console.log(`\n  ⚠ ${vreemd.length} gepubliceerde review(s) die niet van dit script komen:`);
    for (const r of vreemd) console.log(`      #${r.id}  ${r.authorName}`);
    console.log("      `--verwijder` laat deze staan. Controleer of ze echt zijn vóór de livegang.");
  }
}

// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const verwijder = args.includes("--verwijder");
  const schoon = args.includes("--schoon");
  const testdataWeg = args.includes("--testdata-weg");

  await fs.mkdir(GALLERY_DIR, { recursive: true });

  if (testdataWeg) {
    console.log("\nTestdata opruimen");
    await verwijderTestdata();
  }

  if (verwijder || schoon) {
    console.log("\nDemocontent verwijderen");
    await verwijderDemo();
    if (verwijder) {
      console.log("\nKlaar.\n");
      process.exit(0);
    }
  }

  console.log("\nDemocontent aanmaken");
  console.log("  (foto's worden van Unsplash gehaald — dit duurt even)\n");

  await vulCategorieTeksten();
  const fotoIds = await vulEvents();
  await vulPakketten(fotoIds);
  await vulReviews();
  await zetInstellingen();

  console.log(
    "\n🔴 Dit is democontent: stockfoto's van Unsplash en verzonnen reviews.\n" +
      "   Weg vóór de livegang — `--verwijder`. Zie testscript-master.md §8.8.\n",
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("\n✗ Mislukt:", err instanceof Error ? err.message : err);
  process.exit(1);
});
