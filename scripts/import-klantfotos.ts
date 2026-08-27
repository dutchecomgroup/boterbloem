import "dotenv/config";
import path from "node:path";
import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "../server/db.js";
import { env } from "../server/env.js";
import { galleryCategories, galleryItems } from "../shared/schema.js";

/**
 * De foto's van de klant importeren — het echte werk, niet de opvulling.
 *
 *   npx tsx scripts/import-klantfotos.ts --dry-run   # tellen, niets schrijven
 *   npx tsx scripts/import-klantfotos.ts             # aanvullen (idempotent)
 *   npx tsx scripts/import-klantfotos.ts --schoon    # eerst weg, dan opnieuw
 *   npx tsx scripts/import-klantfotos.ts --verwijder # alles met source "klant" weg
 *
 * **Waarom een script en geen handmatige upload.** Twaalf van de twintig bestanden zijn HEIC en
 * de uploadroute weigert die met opzet: de meegeleverde Sharp-binaries bevatten libheif zónder
 * HEVC-decoder. Ze zijn daarom vooraf met ffmpeg naar JPG gezet en staan in
 * `uploads/content/fotos/`; de originelen liggen ernaast in `uploads/content/origineel/`.
 *
 * **Waarom geen events.** De aanlevering is niet per feest gegroepeerd — het is een verzameling
 * losse foto's van verschillende gelegenheden. Ze hangen daarom rechtstreeks onder een
 * gelegenheid (`albumId: null`), wat het schema uitdrukkelijk toestaat. Zodra de klant materiaal
 * per feest heeft, komt de eventlaag eronder en verhuizen de foto's daarheen.
 *
 * **Idempotent op `bestand`.** Elke rij onthoudt in `caption` niets over zijn herkomst — dat zou
 * publieke tekst vervuilen. In plaats daarvan is `altText` de sleutel: die is per foto uniek en
 * door ons geschreven. Een tweede run vindt de bestaande rij en werkt hem bij in plaats van er
 * een tweede naast te zetten.
 */

// ---------------------------------------------------------------------------
// Wat er geïmporteerd wordt
// ---------------------------------------------------------------------------

const BRON_DIR = path.resolve("uploads/content/fotos");
const GALLERY_DIR = path.resolve(env.UPLOADS_DIR, "gallery");

interface KlantFoto {
  /** Bestandsnaam in `uploads/content/fotos/`. */
  bestand: string;
  /** Slug van de gelegenheid waar hij onder komt. */
  categorieSlug: string;
  /** Beschrijving voor schermlezers. Tevens de sleutel waarop dit script herkent wat er al staat. */
  alt: string;
  /** Bijschrift onder de foto op de publieke pagina. Mag leeg. */
  caption: string;
  /**
   * Omslagfoto van zijn gelegenheid. Precies één per gelegenheid; het script controleert dat.
   * Vult `gallery_categories.cover_item_id`.
   */
  omslag?: boolean;
  /**
   * Uitgelicht op de homepage: vult de hero-carousel en "Uitgelicht werk". Bewust een
   * kleine selectie — alles uitlichten is niets uitlichten.
   */
  uitgelicht?: boolean;
}

/**
 * Volgorde binnen deze lijst is de volgorde op de site (`sortOrder`). Per gelegenheid staat de
 * sterkste foto vooraan, want dat is ook de terugval voor de omslag als `cover_item_id` ooit
 * naar een verwijderde foto wijst.
 */
const KLANT_FOTOS: KlantFoto[] = [
  // ---- Bruiloft ----
  {
    bestand: "bruidstaart-ivoor-rozen-kaarslicht.jpg",
    categorieSlug: "bruiloft",
    alt: "Tweelaags ivoren bruidstaart met roomrozen en satijnen strikken bij kaarslicht",
    caption: "Tweelaags in gebroken wit, met roomrozen en satijnen strikken",
    omslag: true,
    uitgelicht: true,
  },
  {
    bestand: "bruidstaart-ivoor-rozen-tafel.jpg",
    categorieSlug: "bruiloft",
    alt: "Ivoren bruidstaart op een gedrapeerde tafel met roosjes in kleine vaasjes",
    caption: "De tafel eromheen afgemaakt met losse roosjes in kleine vaasjes",
  },
  {
    bestand: "bruidstaart-ivoor-rozen-gedragen.jpg",
    categorieSlug: "bruiloft",
    alt: "De bruidstaart wordt met twee handen op een marmeren standaard gedragen",
    caption: "Vlak voor het opbouwen op locatie",
  },
  {
    bestand: "taarten-ivoor-en-bordeaux-kaarsen.jpg",
    categorieSlug: "bruiloft",
    alt: "Een ivoren en een bordeaux taart naast elkaar met hoge kaarsen",
    caption: "Twee taarten naast elkaar: licht en donker, met hoge kaarsen ertussen",
  },

  // ---- Verjaardag ----
  {
    bestand: "taart-geel-frangipani-zij.jpg",
    categorieSlug: "verjaardag",
    alt: "Boterbloemgele taart met witte frangipani en zilveren parels, van opzij",
    caption: "Boterbloemgeel met frangipani en zilveren parels",
    omslag: true,
    uitgelicht: true,
  },
  {
    bestand: "taart-geel-frangipani-boven.jpg",
    categorieSlug: "verjaardag",
    alt: "Dezelfde gele taart van bovenaf, met het spuitwerk in beeld",
    caption: "Van bovenaf, met het spuitwerk in beeld",
  },
  {
    bestand: "taart-geel-frangipani-voor.jpg",
    categorieSlug: "verjaardag",
    alt: "De gele taart van voren, met de witte onderlaag zichtbaar",
    caption: "Twee tinten geel over een witte onderlaag",
  },
  {
    bestand: "taart-bordeaux-tweelaags-strikken.jpg",
    categorieSlug: "verjaardag",
    alt: "Tweelaags bordeaux taart met zwarte strikken en gouden parels",
    caption: "Bordeaux met zwarte strikken en gouden parels",
    uitgelicht: true,
  },
  {
    bestand: "zeemeermin-taart-en-mini-desserts.png",
    categorieSlug: "verjaardag",
    alt: "Roze zeemeerminttaart met gouden schelpen naast een schaal mini desserts",
    caption: "Zeemeermin-thema: taart en mini desserts in dezelfde kleuren",
  },
  {
    bestand: "zeemeermin-taart-met-schaal.jpg",
    categorieSlug: "verjaardag",
    alt: "De zeemeerminttaart met een lange schaal mini desserts op koekkruim",
    caption: "Twintig mini desserts op een bedje van koekkruim",
  },
  {
    bestand: "taart-perzik-bloemen-schelpen.png",
    categorieSlug: "verjaardag",
    alt: "Perzikkleurige taart met zijden bloemen en gouden schelpen",
    caption: "Perzik met zijden bloemen en gouden schelpen",
  },
  {
    bestand: "taart-perzik-bloemen-tuin.png",
    categorieSlug: "verjaardag",
    alt: "Dezelfde perzikkleurige taart op een glazen schaal in de tuin",
    caption: "Buiten opgesteld, op een glazen schaal",
  },

  // ---- Babyshower ----
  {
    bestand: "cupcakes-jungle-babyshower.jpg",
    categorieSlug: "babyshower",
    alt: "Cupcakes met groene en witte buttercream op monsterabladeren, met jungledieren",
    caption: "Jungle-thema: groen en gebroken wit, met de dieren als topper",
    omslag: true,
    uitgelicht: true,
  },

  // ---- Bedrijfsevent ----
  {
    bestand: "mini-desserts-jubileum-25.jpg",
    categorieSlug: "bedrijfsevent",
    alt: "Toren van kristallen coupes met bordeaux en witte mini desserts bij een jubileum",
    caption: "Mini desserts in kristallen coupes, in de huisstijl van de jarige",
    omslag: true,
  },
  {
    bestand: "mini-desserts-jubileum-toren.jpg",
    categorieSlug: "bedrijfsevent",
    alt: "Close-up van de coupe-toren met bordeaux en witte mini desserts",
    caption: "Elk laagje een andere smaak",
  },

  // ---- Overig ----
  {
    bestand: "mini-desserts-citroen-amalfi.jpg",
    categorieSlug: "overig",
    alt: "Citroen mini desserts in glazen coupes op een geel gestreept tafelkleed",
    caption: "Zomerse citroen, in coupes op een geel gestreept kleed",
    omslag: true,
    uitgelicht: true,
  },
  {
    bestand: "taart-kerst-witte-chocolade-drip.jpg",
    categorieSlug: "overig",
    alt: "Kersttaart met witte chocoladedrip, gouden parels en rozemarijn",
    caption: "Kerst: witte chocoladedrip met gouden parels en rozemarijn",
  },
  {
    bestand: "mini-desserts-nude-parels.jpg",
    categorieSlug: "overig",
    alt: "Nude mini desserts in kristallen coupes tussen parelkettingen",
    caption: "Nude en parelmoer, met parelkettingen door de opstelling",
  },
  {
    bestand: "styling-bloemvaas-en-coupes.jpg",
    categorieSlug: "overig",
    alt: "Bloemstuk in een gezichtsvormige vaas naast coupes met mini desserts",
    caption: "De styling telt mee: bloemen, glaswerk en hoogteverschil",
  },

  // Onder "Overig" en niet onder "Sitefoto's": die gelegenheid staat op niet-gepubliceerd, en
  // sinds de lek in de publieke galerij dicht zit (server/routes/public.ts) komt daar niets
  // meer uit. Deze foto hóórt ook publiek: hij sluit de werkwijze-pagina af bij "klaarmaken
  // voor afhalen", en dat is de laatste stap die een klant van haar werk ziet.
  {
    bestand: "verpakking-doos-met-kaartje.jpg",
    categorieSlug: "overig",
    alt: "Witte taartdoos met lint en een kaartje van Atelier Boterbloem",
    caption: "Zorgvuldig verpakt, klaar om opgehaald te worden",
  },
];

// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const verwijder = args.includes("--verwijder");
const schoon = args.includes("--schoon");

/**
 * Zelfde pijplijn als een echte upload in `server/routes/admin/gallery.ts`: `rotate()` voor de
 * EXIF-stand, maximaal 1600×1600 zonder te vergroten, WebP op kwaliteit 82, UUID als naam.
 * Wijkt dit ooit af, dan gedraagt een geïmporteerde foto zich anders dan een geüploade, en dat
 * is precies het soort verschil waar je later een uur naar zoekt.
 */
async function verwerk(bestand: string) {
  const buffer = await fs.readFile(path.join(BRON_DIR, bestand));
  const outName = `${randomUUID()}.webp`;
  const meta = await sharp(buffer)
    .rotate()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(path.join(GALLERY_DIR, outName));
  return { outName, width: meta.width, height: meta.height };
}

async function verwijderKlantFotos() {
  const rijen = await db.select().from(galleryItems).where(eq(galleryItems.source, "klant"));
  if (rijen.length === 0) {
    console.log("  · niets te verwijderen");
    return;
  }

  // Omslagverwijzingen eerst losmaken: er staat geen foreign key op, dus een verweesde
  // cover_item_id zou blijven staan en naar een verwijderde foto wijzen.
  const ids = rijen.map((r) => r.id);
  await db
    .update(galleryCategories)
    .set({ coverItemId: null })
    .where(inArray(galleryCategories.coverItemId, ids));

  for (const r of rijen) {
    await fs.unlink(path.join(GALLERY_DIR, r.filename)).catch(() => {
      // Bestand al weg is prima — de rij is wat telt.
    });
  }
  await db.delete(galleryItems).where(eq(galleryItems.source, "klant"));
  console.log(`  ✓ ${rijen.length} klantfoto's verwijderd`);
}

async function importeer() {
  const cats = await db.select().from(galleryCategories);
  const catId = new Map(cats.map((c) => [c.slug, c.id]));

  // Vooraf controleren in plaats van halverwege stuklopen: een half geïmporteerde galerij is
  // vervelender dan een script dat niets doet en zegt waarom.
  const problemen: string[] = [];
  const omslagPerCat = new Map<string, number>();
  for (const f of KLANT_FOTOS) {
    if (!catId.has(f.categorieSlug)) problemen.push(`gelegenheid "${f.categorieSlug}" bestaat niet`);
    try {
      await fs.access(path.join(BRON_DIR, f.bestand));
    } catch {
      problemen.push(`bestand ontbreekt: ${f.bestand}`);
    }
    if (f.omslag) omslagPerCat.set(f.categorieSlug, (omslagPerCat.get(f.categorieSlug) ?? 0) + 1);
  }
  for (const [slug, n] of omslagPerCat) {
    if (n > 1) problemen.push(`gelegenheid "${slug}" heeft ${n} omslagfoto's, dat moet er één zijn`);
  }
  if (problemen.length) {
    console.error("\n✗ Niet geïmporteerd:\n" + problemen.map((p) => `  · ${p}`).join("\n") + "\n");
    process.exit(1);
  }

  const bestaand = await db.select().from(galleryItems).where(eq(galleryItems.source, "klant"));
  const perAlt = new Map(bestaand.map((r) => [r.altText ?? "", r]));

  let nieuw = 0;
  let bijgewerkt = 0;
  const omslagen: { categoryId: number; itemId: number }[] = [];
  const volgordePerCat = new Map<string, number>();

  for (const f of KLANT_FOTOS) {
    const categoryId = catId.get(f.categorieSlug)!;
    const sortOrder = volgordePerCat.get(f.categorieSlug) ?? 0;
    volgordePerCat.set(f.categorieSlug, sortOrder + 1);

    const al = perAlt.get(f.alt);
    if (al) {
      if (!dryRun) {
        await db
          .update(galleryItems)
          .set({
            categoryId,
            albumId: null,
            caption: f.caption,
            featured: f.uitgelicht ?? false,
            sortOrder,
          })
          .where(eq(galleryItems.id, al.id));
      }
      if (f.omslag) omslagen.push({ categoryId, itemId: al.id });
      bijgewerkt++;
      continue;
    }

    if (dryRun) {
      console.log(`  + ${f.categorieSlug.padEnd(14)} ${f.bestand}`);
      nieuw++;
      continue;
    }

    const { outName, width, height } = await verwerk(f.bestand);
    const [row] = await db
      .insert(galleryItems)
      .values({
        categoryId,
        albumId: null,
        filename: outName,
        altText: f.alt,
        caption: f.caption,
        width,
        height,
        featured: f.uitgelicht ?? false,
        sortOrder,
        source: "klant",
      })
      .returning();
    if (f.omslag) omslagen.push({ categoryId, itemId: row.id });
    nieuw++;
    console.log(`  + ${f.categorieSlug.padEnd(14)} ${f.bestand} → ${width}×${height}`);
  }

  if (!dryRun) {
    for (const { categoryId, itemId } of omslagen) {
      await db
        .update(galleryCategories)
        .set({ coverItemId: itemId })
        .where(eq(galleryCategories.id, categoryId));
    }
  }

  console.log(
    `\n  ${nieuw} nieuw, ${bijgewerkt} bijgewerkt, ${omslagen.length} omslagfoto's` +
      (dryRun ? " (dry run — niets geschreven)" : ""),
  );
}

/**
 * Een gelegenheid zonder foto's hoort niet op de site: een tegel zonder beeld en een pagina die
 * "nog geen foto's" zegt, terwijl de bezoeker er via het menu naartoe geklikt is. De intro-tekst
 * blijft staan, dus zodra er foto's komen is het één vinkje.
 */
async function verbergLegeGelegenheden() {
  // Twee losse queries en geen gecorreleerde subquery: die telde in een eerdere versie stil nul
  // voor élke gelegenheid, omdat Drizzle de buitenste tabel in de subquery niet bindt zoals je
  // zou verwachten. Een teller die zonder klagen nul zegt is erger dan een fout — hij had hier
  // alle zeven gelegenheden verborgen. Dit is dezelfde vorm als in de galerijroute.
  const [rijen, perCat] = await Promise.all([
    db.select().from(galleryCategories),
    db
      .select({ categoryId: galleryItems.categoryId, n: sql<number>`count(*)::int` })
      .from(galleryItems)
      .groupBy(galleryItems.categoryId),
  ]);
  const aantal = new Map(perCat.map((r) => [r.categoryId, r.n]));

  for (const rij of rijen) {
    const c = { ...rij, fotos: aantal.get(rij.id) ?? 0 };
    if (c.slug === "sitefotos") continue; // hoort per definitie verborgen te blijven
    const moetZichtbaar = c.fotos > 0;
    if (c.published === moetZichtbaar) continue;
    if (!dryRun) {
      await db
        .update(galleryCategories)
        .set({ published: moetZichtbaar })
        .where(eq(galleryCategories.id, c.id));
    }
    console.log(`  ${moetZichtbaar ? "👁" : "🚫"} ${c.name} → ${moetZichtbaar ? "zichtbaar" : "verborgen"} (${c.fotos} foto's)`);
  }
}

async function main() {
  await fs.mkdir(GALLERY_DIR, { recursive: true });

  if (verwijder || schoon) {
    console.log("\nKlantfoto's verwijderen");
    if (dryRun) {
      const n = await db
        .select({ n: sql<number>`count(*)::int` })
        .from(galleryItems)
        .where(eq(galleryItems.source, "klant"));
      console.log(`  · ${n[0].n} zouden verwijderd worden (dry run)`);
    } else {
      await verwijderKlantFotos();
    }
    if (verwijder) {
      console.log("\nKlaar.\n");
      process.exit(0);
    }
  }

  console.log(`\nKlantfoto's importeren uit ${path.relative(process.cwd(), BRON_DIR)}\n`);
  await importeer();

  console.log("\nGelegenheden zonder foto's verbergen");
  await verbergLegeGelegenheden();

  // Losse controle: hangt er nog iets van de klant onder een event? Dat mag, maar het is niet
  // wat dit script maakt, dus het hoort opgemerkt te worden.
  const inEvent = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(galleryItems)
    .where(and(eq(galleryItems.source, "klant"), sql`${galleryItems.albumId} is not null`));
  if (inEvent[0].n > 0) {
    console.log(`\n  ℹ ${inEvent[0].n} klantfoto('s) hangen onder een event — met de hand verplaatst?`);
  }

  const losseZonderCat = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(galleryItems)
    .where(and(eq(galleryItems.source, "klant"), isNull(galleryItems.categoryId)));
  if (losseZonderCat[0].n > 0) {
    console.log(`  ⚠ ${losseZonderCat[0].n} klantfoto('s) staan onder geen enkele gelegenheid`);
  }

  console.log("\nKlaar.\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("\n✗ Mislukt:", err instanceof Error ? err.message : err);
  process.exit(1);
});
