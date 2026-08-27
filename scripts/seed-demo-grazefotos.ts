import "dotenv/config";
import path from "node:path";
import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { eq, inArray } from "drizzle-orm";
import { db } from "../server/db.js";
import { env } from "../server/env.js";
import { galleryCategories, galleryItems, packages } from "../shared/schema.js";

/**
 * ⚠️ TIJDELIJK — drie voorbeeldfoto's voor de grazing-pakketten.
 *
 *   npx tsx scripts/seed-demo-grazefotos.ts             # plaatsen
 *   npx tsx scripts/seed-demo-grazefotos.ts --verwijder # weer weg
 *
 * **Waarom dit bestaat.** Bij de twintig foto's die de klant aanleverde zit géén enkele grazing
 * table — alles is zoet. Drie van haar zes pakketten zijn hartig en hadden dus geen beeld,
 * terwijl de site op "Sweet & grazing tables" kopt. Dit vult dat gat tot ze eigen foto's heeft.
 *
 * 🔴 **Dit is werk van anderen en mag niet mee naar de publieke live site.** Alle drie dragen
 * `source: "demo"`, waarmee `scripts/check-geen-demo-content.ts` ze vindt: die controle faalt
 * vanaf nu bewust met `--strict`, en dat is precies de bedoeling. Weghalen doe je met
 * `--verwijder` of met `npm run seed:demo -- --verwijder`.
 *
 * **Waar ze landen.** In een eigen gelegenheid `voorbeeldbeelden` die op **niet-gepubliceerd**
 * staat. Daardoor komen ze niet in de galerij, niet in de hero-carrousel en niet in het
 * uitgelicht-blok — de publieke galerij filtert sinds 27-08 óók de platte `items`-lijst op
 * gepubliceerde gelegenheden. Ze zijn alleen zichtbaar waar ze bedoeld zijn: als coverfoto van
 * een pakket, via `packages.cover_item_id`.
 *
 * Unsplash-licentie: gratis, ook commercieel, naamsvermelding niet verplicht. Alleen
 * `images.unsplash.com/photo-…` — `plus.unsplash.com/premium_photo-…` is betaald en mag hier
 * niet staan.
 */

const CATEGORIE_SLUG = "voorbeeldbeelden";
const GALLERY_DIR = path.resolve(env.UPLOADS_DIR, "gallery");

interface GrazeFoto {
  /** Slug van het pakket waarvan dit de cover wordt. */
  pakketSlug: string;
  /** Unsplash-id. Elk van de drie is met `curl` op 200 gecontroleerd én bekeken. */
  id: string;
  alt: string;
  caption: string;
}

/**
 * Drie foto's, gekozen op een oplopende schaal die de drie maten weerspiegelt: één plank, een
 * grote plank, een hele tafel. Twee andere kandidaten vielen af — een kerstplank met
 * goudglitter (verkeerd seizoen, en goud botst met het salie-palet) en een marmeren plank vol
 * chocolade (leest als dessert, niet als graze).
 */
const GRAZE_FOTOS: GrazeFoto[] = [
  {
    pakketSlug: "the-little-graze",
    id: "photo-1695606392727-d8b959879721",
    alt: "Houten plank met salami, prosciutto, kazen, olijven en gegrild brood",
    caption: "Voorbeeldbeeld — één plank, voor een klein gezelschap",
  },
  {
    pakketSlug: "the-classic-graze",
    id: "photo-1576021182211-9ea8dced3690",
    alt: "Grote plank met kazen, vijgen, druiven, olijven, crackers en jam",
    caption: "Voorbeeldbeeld — ruimer gevuld, met fruit van het seizoen",
  },
  {
    pakketSlug: "the-grand-graze",
    id: "photo-1642643151267-86ee35313758",
    alt: "Grazing table over meerdere houten niveaus, met bordjes voor de gasten",
    caption: "Voorbeeldbeeld — over de volle lengte, met hoogteverschil",
  },
];

const verwijder = process.argv.includes("--verwijder");

async function haalCategorie(): Promise<number> {
  const [bestaand] = await db
    .select()
    .from(galleryCategories)
    .where(eq(galleryCategories.slug, CATEGORIE_SLUG))
    .limit(1);
  if (bestaand) return bestaand.id;

  const [nieuw] = await db
    .insert(galleryCategories)
    .values({
      slug: CATEGORIE_SLUG,
      name: "Voorbeeldbeelden",
      description:
        "Tijdelijke voorbeeldfoto's bij de grazing-pakketten. Geen werk van het atelier — " +
        "weg vóór de livegang.",
      // Niet gepubliceerd: dan komen ze nergens op de site behalve als pakket-cover.
      published: false,
      sortOrder: 98,
    })
    .returning();
  return nieuw.id;
}

async function plaats() {
  await fs.mkdir(GALLERY_DIR, { recursive: true });
  const categoryId = await haalCategorie();

  const bestaande = await db.select().from(galleryItems).where(eq(galleryItems.source, "demo"));
  const perAlt = new Map(bestaande.map((r) => [r.altText ?? "", r]));

  for (const [i, foto] of GRAZE_FOTOS.entries()) {
    const [pakket] = await db.select().from(packages).where(eq(packages.slug, foto.pakketSlug)).limit(1);
    if (!pakket) {
      console.log(`  ⚠ pakket "${foto.pakketSlug}" bestaat niet — overgeslagen`);
      continue;
    }

    let itemId = perAlt.get(foto.alt)?.id;

    if (itemId == null) {
      const res = await fetch(`https://images.unsplash.com/${foto.id}?auto=format&fit=crop&w=1600&q=80`);
      if (!res.ok) throw new Error(`${foto.id} gaf ${res.status}`);
      const buffer = Buffer.from(await res.arrayBuffer());

      // Zelfde pijplijn als een echte upload, zodat een voorbeeldfoto zich niet anders
      // gedraagt dan haar eigen werk.
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
          albumId: null,
          filename: outName,
          altText: foto.alt,
          caption: foto.caption,
          width: meta.width,
          height: meta.height,
          // Nooit uitgelicht: dat blok hoort haar eigen werk te tonen.
          featured: false,
          sortOrder: i,
          source: "demo",
        })
        .returning();
      itemId = row.id;
      console.log(`  + ${foto.pakketSlug.padEnd(18)} ${meta.width}×${meta.height}`);
    } else {
      console.log(`  · ${foto.pakketSlug.padEnd(18)} stond er al`);
    }

    await db.update(packages).set({ coverItemId: itemId }).where(eq(packages.id, pakket.id));
  }

  console.log(
    "\n🔴 Dit zijn stockfoto's van Unsplash, geen werk van het atelier.\n" +
      "   `npx tsx scripts/check-geen-demo-content.ts --strict` faalt hier vanaf nu op,\n" +
      "   en dat is de bedoeling. Weghalen: dit script met --verwijder.\n",
  );
}

async function weg() {
  const rijen = await db.select().from(galleryItems).where(eq(galleryItems.source, "demo"));
  if (rijen.length === 0) {
    console.log("  · niets te verwijderen");
    return;
  }
  const ids = rijen.map((r) => r.id);

  // Verwijzingen eerst losmaken: er staat geen foreign key op `cover_item_id`, dus een
  // verweesde verwijzing zou blijven staan en naar een verdwenen foto wijzen.
  await db.update(packages).set({ coverItemId: null }).where(inArray(packages.coverItemId, ids));
  await db
    .update(galleryCategories)
    .set({ coverItemId: null })
    .where(inArray(galleryCategories.coverItemId, ids));

  for (const r of rijen) {
    await fs.unlink(path.join(GALLERY_DIR, r.filename)).catch(() => {});
  }
  await db.delete(galleryItems).where(eq(galleryItems.source, "demo"));
  await db.delete(galleryCategories).where(eq(galleryCategories.slug, CATEGORIE_SLUG));
  console.log(`  ✓ ${rijen.length} voorbeeldfoto's verwijderd`);
}

if (verwijder) {
  console.log("\nVoorbeeldfoto's verwijderen\n");
  await weg();
} else {
  console.log("\nVoorbeeldfoto's bij de grazing-pakketten\n");
  await plaats();
}
process.exit(0);
