import "dotenv/config";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "../server/db.js";
import {
  galleryCategories,
  galleryItems,
  orderItems,
  packages,
  products,
  siteSettings,
} from "../shared/schema.js";

/**
 * De teksten en prijzen die de klant aanleverde in de database zetten.
 *
 *   npx tsx scripts/seed-klantcontent.ts --dry-run
 *   npx tsx scripts/seed-klantcontent.ts
 *
 * Bron: `uploads/content/teksten/pakketten-en-taartprijzen.pdf` plus de intro-teksten per
 * gelegenheid. Wat er níét in stond staat als gat in `docs/klant/content-invulplan.md` —
 * de belangrijkste is dat **geen van de zes pakketten een prijs heeft**.
 *
 * Losstaand van `import-klantfotos.ts`: foto's en tekst komen op verschillende momenten binnen
 * en horen elkaar niet te blokkeren.
 */

const dryRun = process.argv.includes("--dry-run");

// ---------------------------------------------------------------------------
// Gelegenheden — haar eigen intro-teksten
// ---------------------------------------------------------------------------

const CATEGORIE_INTRO: Record<string, string> = {
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
    "Een klein tafeltje voor de kraamvisite, of doosjes om mee te geven. Ook leuk als de grote " +
    "broer of zus mag helpen kiezen.",
  bedrijfsevent:
    "Representatief en toch persoonlijk. Meestal staand, dus alles zonder bordje en bestek te " +
    "eten. Vertel ons hoeveel gasten en hoe lang de avond duurt.",
  // Niet van de klant: "Overig" stond niet in haar lijstje, maar de gelegenheid bestaat en er
  // hangen vijf foto's onder. Deze zin is van ons en staat als zodanig in het invulplan.
  overig:
    "Wat er verder langskomt: een kerstdiner, een zomerse borrel, een jubileum. Staat jouw " +
    "gelegenheid er niet bij? Vraag het gerust, er kan meer dan je denkt.",
};

// ---------------------------------------------------------------------------
// Pakketten — zes, uit haar PDF
// ---------------------------------------------------------------------------

interface Pakket {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  personsMin: number;
  personsMax: number;
  /**
   * `includes` staat niet in haar PDF. Deze regels zijn door ons geschreven op basis van de
   * eerdere pakketteksten en de foto's, en staan als **concept** in het invulplan. Ze zijn
   * bewust concreet: "vier soorten mini dessert" is na te kijken, "veel lekkers" niet.
   */
  includes: string[];
  sortOrder: number;
  /**
   * Fragment uit de `altText` van de foto die de kaart van dit pakket vult. Zelfde aanpak als
   * in `content/werkwijze.ts`: een zoekterm en geen id, want id's verschillen per database.
   *
   * De drie graze-pakketten hebben er géén. Dat is geen omissie in dit script maar een gat in
   * de aanlevering: bij de twintig foto's zit **geen enkele grazing table** — alles is zoet.
   * Zonder foto toont `PakketKaart` een zacht kleurvlak, en dat is eerlijker dan een sweet
   * table gebruiken om een hartige tafel te verkopen.
   */
  coverZoek?: string;
}

/**
 * Prijzen ontbreken in de aanlevering, dus `priceFrom` blijft `0` en `active` blijft `false`.
 *
 * Dat is geen vergissing maar de veilige stand: een pakket zonder prijs dat wél actief is,
 * belooft iets op de site waar geen bedrag bij hoort. `Number(p.priceFrom) > 0` bepaalt in de
 * frontend of er een vanaf-bedrag getoond wordt, dus zodra zij een prijs invult en het pakket
 * aanzet, klopt de pagina vanzelf.
 */
const PAKKETTEN: Pakket[] = [
  {
    slug: "petite-table",
    name: "Petite Table",
    tagline: "Voor kleinere gezelschappen en intieme momenten",
    description:
      "Een compacte sweet table voor een klein gezelschap. Een taart als middelpunt, met " +
      "daaromheen een kleine selectie hapklaar zoet, opgebouwd op locatie.",
    personsMin: 10,
    personsMax: 20,
    includes: [
      "Taart als middelpunt",
      "Drie soorten mini dessert",
      "Cupcakes of macarons",
      "Styling met stands en glaswerk",
      "Opbouw ter plaatse",
    ],
    sortOrder: 1,
    coverZoek: "geel gestreept",
  },
  {
    slug: "signature-table",
    name: "Signature Table",
    tagline: "De perfecte middenmaat voor verjaardagen, babyshowers en feestjes",
    description:
      "De maat die het vaakst gekozen wordt. Genoeg variatie zodat iedereen iets vindt, en " +
      "genoeg hoogteverschil om de tafel ook van een afstand te laten kloppen.",
    personsMin: 20,
    personsMax: 30,
    includes: [
      "Taart als middelpunt",
      "Vier tot vijf soorten mini dessert",
      "Cupcakes en macarons",
      "Styling in de kleuren van je feest",
      "Opbouw en afbouw ter plaatse",
    ],
    sortOrder: 2,
    coverZoek: "zeemeerminttaart met gouden schelpen",
  },
  {
    slug: "grande-table",
    name: "Grande Table",
    tagline: "Een royale tafel die echt een eyecatcher wordt op je feest",
    description:
      "De grootste van de drie. Een ruime dessertselectie over meerdere niveaus, met de " +
      "styling erop afgestemd — dit is de tafel waar gasten een foto van maken.",
    personsMin: 30,
    personsMax: 50,
    includes: [
      "Grote taart als middelpunt",
      "Zes tot acht soorten mini dessert",
      "Cupcakes, macarons en cakepops",
      "Uitgebreide styling met meerdere niveaus",
      "Opbouw en afbouw ter plaatse",
    ],
    sortOrder: 3,
    coverZoek: "kristallen coupes met bordeaux",
  },
  {
    slug: "the-little-graze",
    name: "The little graze",
    tagline: "Klein, gezellig en verfijnd",
    description:
      "Een hartige tafel voor een klein gezelschap: kazen, charcuterie, seizoensfruit en verse " +
      "broodjes. Alles zonder bordje en bestek te eten.",
    personsMin: 20,
    personsMax: 30,
    includes: [
      "Kazen en charcuterie",
      "Seizoensfruit en rauwkost",
      "Verse broodjes, crackers en dips",
      "Noten, olijven en tapenades",
      "Styling met planken, kistjes en groen",
    ],
    sortOrder: 4,
  },
  {
    slug: "the-classic-graze",
    name: "The classic graze",
    tagline: "Simpel, chic en heel passend bij een styled grazing table",
    description:
      "De middenmaat, met meer variatie in kaas en charcuterie en een langere opstelling. " +
      "Combineert goed met een sweet table aan de andere kant van de zaal.",
    personsMin: 40,
    personsMax: 60,
    includes: [
      "Ruime selectie kazen en charcuterie",
      "Seizoensfruit, rauwkost en olijven",
      "Verse broodjes, crackers en drie dips",
      "Noten en tapenades",
      "Styling met planken, kistjes en groen",
      "Opbouw ter plaatse",
    ],
    sortOrder: 5,
  },
  {
    slug: "the-grand-graze",
    name: "The grand graze",
    tagline: "Rijkelijk gevuld en echt een statement op je feest",
    description:
      "Over de volle lengte van de tafel opgebouwd, voor een grote groep. Rijk gevuld en " +
      "bedoeld om de hele avond mee te gaan.",
    personsMin: 70,
    personsMax: 100,
    includes: [
      "Uitgebreide selectie kazen en charcuterie",
      "Seizoensfruit, rauwkost en antipasti",
      "Verse broodjes, crackers en meerdere dips",
      "Noten, olijven en tapenades",
      "Styling over de volle lengte van de tafel",
      "Opbouw en afbouw ter plaatse",
    ],
    sortOrder: 6,
  },
];

// ---------------------------------------------------------------------------
// Taarten — prijslijst uit haar PDF
// ---------------------------------------------------------------------------

interface Taart {
  slug: string;
  name: string;
  description: string;
  basePrice: string;
  sortOrder: number;
}

const TAARTEN: Taart[] = [
  {
    slug: "taart-basis",
    name: "Basis taart",
    description: "Voor 12 tot 15 personen",
    basePrice: "65.00",
    sortOrder: 1,
  },
  {
    slug: "taart-middelgroot",
    name: "Middelgrote taart",
    description: "Voor 15 tot 20 personen",
    basePrice: "75.00",
    sortOrder: 2,
  },
  {
    slug: "taart-groot",
    name: "Grote taart",
    description: "Voor 25 tot 30 personen",
    basePrice: "95.00",
    sortOrder: 3,
  },
];

/**
 * Deze stonden er al, met prijs € 0,00 en zichtbaar op de site. Ze blijven bestaan als regel
 * op een offerte, maar gaan van de publieke prijslijst af: anders staat er twee keer een lijst
 * met taarten, waarvan één zonder bedragen.
 */
const OUDE_PRODUCTEN_VERBERGEN = ["bruidstaart", "verjaardagstaart", "cupcakes", "mini-desserts"];

// ---------------------------------------------------------------------------

async function zetCategorieTeksten() {
  for (const [slug, description] of Object.entries(CATEGORIE_INTRO)) {
    if (!dryRun) {
      await db.update(galleryCategories).set({ description }).where(eq(galleryCategories.slug, slug));
    }
    console.log(`  · ${slug}`);
  }
  console.log(`  ✓ ${Object.keys(CATEGORIE_INTRO).length} intro-teksten`);
}

/**
 * De vier oude pakketten opruimen — maar niet als er boekingen aan hangen.
 *
 * `order_items.details.packageId` is een herkomst-notitie zonder foreign key, dus de database
 * houdt ons niet tegen. Een pakket verwijderen waar een offerte naar verwijst laat die offerte
 * intact (de regels staan er los in), maar maakt de omzet-per-pakket op `/admin/omzet` blind
 * voor die boeking. Dan liever op niet-actief: onzichtbaar op de site, wél terug te vinden.
 */
async function ruimOudePakkettenOp() {
  const oud = await db
    .select()
    .from(packages)
    .where(inArray(packages.slug, ["sweet-table", "sweet-table-xl", "bruiloft-table", "grazing-table"]));
  if (oud.length === 0) return;

  const ids = oud.map((p) => p.id);
  const gebruikt = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(orderItems)
    .where(sql`(${orderItems.details} -> 'packageId')::int = any(${sql.raw(`array[${ids.join(",")}]`)})`);

  if (gebruikt[0].n > 0) {
    if (!dryRun) {
      await db.update(packages).set({ active: false, featured: false }).where(inArray(packages.id, ids));
    }
    console.log(`  ⚠ ${oud.length} oude pakketten op niet-actief (${gebruikt[0].n} boekingsregel(s) verwijzen ernaar)`);
    return;
  }

  if (!dryRun) await db.delete(packages).where(inArray(packages.id, ids));
  console.log(`  ✓ ${oud.length} oude pakketten verwijderd (geen boekingen eraan)`);
}

async function zetPakketten() {
  const fotos = await db.select().from(galleryItems);
  const zoekFoto = (term?: string) =>
    term ? (fotos.find((f) => (f.altText ?? "").toLowerCase().includes(term.toLowerCase()))?.id ?? null) : null;

  for (const p of PAKKETTEN) {
    const [bestaand] = await db.select().from(packages).where(eq(packages.slug, p.slug)).limit(1);
    const coverItemId = zoekFoto(p.coverZoek);
    const waarden = {
      slug: p.slug,
      name: p.name,
      tagline: p.tagline,
      description: p.description,
      personsMin: p.personsMin,
      personsMax: p.personsMax,
      includes: p.includes,
      sortOrder: p.sortOrder,
      coverItemId,
    };
    if (dryRun) {
      console.log(
        `  ${bestaand ? "~" : "+"} ${p.name} (${p.personsMin}–${p.personsMax} pers.)` +
          (coverItemId ? "" : "  ⚠ geen coverfoto"),
      );
      continue;
    }
    if (bestaand) {
      // `priceFrom`, `vatRate` en de btw-verdeling niet overschrijven: zodra zij die invult,
      // hoort een tweede run van dit script haar werk niet ongedaan te maken.
      await db.update(packages).set(waarden).where(eq(packages.id, bestaand.id));
      console.log(`  ~ ${p.name}${coverItemId ? "" : "  ⚠ geen coverfoto"}`);
    } else {
      await db.insert(packages).values({ ...waarden, priceFrom: "0" });
      console.log(`  + ${p.name} (${p.personsMin}–${p.personsMax} pers.)${coverItemId ? "" : "  ⚠ geen coverfoto"}`);
    }
  }

  await handhaafZichtbaarheid();
}

/**
 * Een pakket zonder prijs staat niet op de site.
 *
 * Dit stond eerst alleen als `active: false` bij het aanmaken, en dat bleek niet genoeg: de zes
 * pakketten kwamen na de eerste seed toch als actief én uitgelicht in de database te staan, met
 * `€ 0` op de homepage als gevolg. Waar dat vandaan kwam is niet meer te achterhalen — een
 * eenmalige aanname bij het aanmaken is sowieso het verkeerde niveau, want zij kan een pakket
 * later aanzetten en de prijs weer leegmaken.
 *
 * Nu is het een regel die bij elke run opnieuw geldt en die zichzelf herstelt. Een prijs
 * invullen is genoeg om een pakket te mogen aanzetten; het omgekeerde gebeurt vanzelf.
 */
async function handhaafZichtbaarheid() {
  const alle = await db.select().from(packages);
  const zonderPrijs = alle.filter((p) => Number(p.priceFrom) <= 0 && (p.active || p.featured));
  if (zonderPrijs.length === 0) {
    console.log("  ✓ zichtbaarheid klopt: geen actief pakket zonder prijs");
    return;
  }
  if (!dryRun) {
    await db
      .update(packages)
      .set({ active: false, featured: false })
      .where(inArray(packages.id, zonderPrijs.map((p) => p.id)));
  }
  console.log(
    `  🚫 ${zonderPrijs.length} pakket(ten) zonder prijs op niet-zichtbaar gezet: ` +
      zonderPrijs.map((p) => p.name).join(", "),
  );
}

async function zetTaarten() {
  for (const t of TAARTEN) {
    const [bestaand] = await db.select().from(products).where(eq(products.slug, t.slug)).limit(1);
    const waarden = {
      slug: t.slug,
      name: t.name,
      description: t.description,
      basePrice: t.basePrice,
      unit: "stuk",
      category: "taart_los" as const,
      active: true,
      publicVisible: true,
      sortOrder: t.sortOrder,
    };
    if (dryRun) {
      console.log(`  ${bestaand ? "~" : "+"} ${t.name} — € ${t.basePrice}`);
      continue;
    }
    if (bestaand) {
      // `vatRate` met rust laten: dat is haar keuze, niet die van de PDF.
      await db.update(products).set(waarden).where(eq(products.id, bestaand.id));
      console.log(`  ~ ${t.name} — € ${t.basePrice}`);
    } else {
      await db.insert(products).values(waarden);
      console.log(`  + ${t.name} — € ${t.basePrice}`);
    }
  }

  if (!dryRun) {
    await db
      .update(products)
      .set({ publicVisible: false })
      .where(inArray(products.slug, OUDE_PRODUCTEN_VERBERGEN));
  }
  console.log(`  ✓ ${OUDE_PRODUCTEN_VERBERGEN.length} oude productregels van de publieke lijst af`);
}

/**
 * Alleen wat de klant daadwerkelijk heeft aangeleverd.
 *
 * `about.body` blijft met opzet ongemoeid: er is nog geen over-tekst binnen, en er iets
 * neerzetten dat er echt uitziet maakt een gat onzichtbaar. `contact.email` blijft ook staan —
 * het adres in de database is nooit bevestigd en dat hoort een vraag te blijven, geen aanname.
 */
async function zetInstellingen() {
  const [hero] = await db.select().from(siteSettings).where(eq(siteSettings.key, "hero")).limit(1);
  const huidig = (hero?.value ?? {}) as Record<string, unknown>;
  const nieuw = {
    ...huidig,
    tagline: "Voor momenten die je maar één keer beleeft. Luxe sweet tables, grazing tables en taarten op maat.",
    ctaLabel: "Offerte aanvragen",
    ctaHref: "/contact",
  };
  if (!dryRun) {
    await db
      .insert(siteSettings)
      .values({ key: "hero", value: nieuw })
      .onConflictDoUpdate({ target: siteSettings.key, set: { value: nieuw, updatedAt: new Date() } });
  }
  console.log("  ✓ hero-tagline uit haar huisstijl-moodboard");
}

async function main() {
  console.log(`\nKlantcontent${dryRun ? " (dry run)" : ""}\n`);

  console.log("Gelegenheden");
  await zetCategorieTeksten();

  console.log("\nOude pakketten");
  await ruimOudePakkettenOp();

  console.log("\nPakketten uit de PDF");
  await zetPakketten();

  console.log("\nTaarten");
  await zetTaarten();

  console.log("\nInstellingen");
  await zetInstellingen();

  console.log(
    "\n⚠ Nog niet ingevuld, want niet aangeleverd:\n" +
      "   · prijs van alle zes de pakketten (staan daarom op niet-actief)\n" +
      "   · btw-verdeling per pakket en btw-tarief per taart\n" +
      "   · over-tekst, reviews, telefoon/WhatsApp/adres\n" +
      "   Zie docs/klant/content-invulplan.md\n",
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("\n✗ Mislukt:", err instanceof Error ? err.message : err);
  process.exit(1);
});
