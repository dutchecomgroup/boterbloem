import { Router, type Request, type Response, type NextFunction } from "express";
import multer from "multer";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import path from "node:path";
import fs from "node:fs/promises";
import { db } from "../../db.js";
import {
  galleryItems,
  galleryAlbums,
  galleryCategories,
  insertGalleryItemSchema,
  insertGalleryCategorySchema,
  insertGalleryAlbumSchema,
} from "@shared/schema";
import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { env } from "../../env.js";
import { requireFields } from "../../lib/patch.js";

export const galleryRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|webp|heic|heif|avif)$/i.test(file.mimetype)) cb(null, true);
    else cb(new Error("Alleen afbeeldingen toegestaan"));
  },
});

/**
 * Kan deze Sharp HEIC lezen?
 *
 * De meegeleverde binaries van Sharp bevatten libheif **zonder** HEVC-decoder — dat mag niet
 * vanwege patenten. `format.heif.fileSuffix` bevat dan alleen `.avif`. Een iPhone maakt
 * standaard HEIC, dus dit is precies het bestand dat een klant aanlevert; zonder deze
 * controle komt het door de mimetype-filter, klapt Sharp eruit en krijgt de gebruiker een 500
 * zonder te weten wat hij moet doen.
 */
const HEIC_ONDERSTEUND = ((
  sharp.format.heif as { fileSuffix?: string[] } | undefined
)?.fileSuffix ?? []).some((s: string) => /\.hei[cf]$/i.test(s));

/** Onmiskenbaar aan de eerste bytes: `....ftypheic` / `ftypmif1` / `ftyphevc`. */
function isHeic(buffer: Buffer): boolean {
  if (buffer.length < 16) return false;
  if (buffer.toString("ascii", 4, 8) !== "ftyp") return false;
  const merk = buffer.toString("ascii", 8, 12).toLowerCase();
  return ["heic", "heix", "hevc", "heim", "heis", "hevm", "mif1", "msf1"].includes(merk);
}

class UploadFout extends Error {
  status = 400;
}

const GALLERY_DIR = path.resolve(env.UPLOADS_DIR, "gallery");
await fs.mkdir(GALLERY_DIR, { recursive: true });

/**
 * Lost een opgeslagen bestandsnaam op binnen GALLERY_DIR en weigert alles wat daarbuiten
 * uitkomt. Vangnet: `filename` wordt bij het uploaden door ons gezet (UUID) en is via de
 * patch-route niet aanpasbaar, maar een pad-check vóór een `unlink` is te goedkoop om weg
 * te laten.
 */
function resolveInGalleryDir(filename: string): string | null {
  const resolved = path.resolve(GALLERY_DIR, filename);
  const prefix = GALLERY_DIR + path.sep;
  return resolved.startsWith(prefix) ? resolved : null;
}

// ---------- Categories ----------

galleryRouter.get("/categories", async (_req, res, next) => {
  try {
    // Aantallen erbij zodat de zijbalk kan tonen wat er onder een gelegenheid hangt.
    //
    // Twee losse tellingen en geen dubbele JOIN: een gelegenheid met 2 events en 12 foto's zou
    // in één query 24 rijen opleveren en dus 24 tellen. `count(distinct …)` lost dat op maar
    // wordt traag zodra er echt foto's staan; twee kleine queries zijn hier duidelijker.
    const [rows, perCat] = await Promise.all([
      db.select().from(galleryCategories).orderBy(asc(galleryCategories.sortOrder)),
      db
        .select({
          categoryId: galleryItems.categoryId,
          fotos: sql<number>`count(*)::int`,
        })
        .from(galleryItems)
        .groupBy(galleryItems.categoryId),
    ]);

    const albumsPerCat = await db
      .select({
        categoryId: galleryAlbums.categoryId,
        events: sql<number>`count(*)::int`,
      })
      .from(galleryAlbums)
      .groupBy(galleryAlbums.categoryId);

    const fotos = new Map(perCat.map((r) => [r.categoryId, r.fotos]));
    const events = new Map(albumsPerCat.map((r) => [r.categoryId, r.events]));

    res.json(
      rows.map((c) => ({
        ...c,
        eventCount: events.get(c.id) ?? 0,
        itemCount: fotos.get(c.id) ?? 0,
      })),
    );
  } catch (err) {
    next(err);
  }
});

galleryRouter.post("/categories", async (req, res, next) => {
  try {
    const data = insertGalleryCategorySchema.parse(req.body);
    const [row] = await db.insert(galleryCategories).values(data).returning();
    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
});

galleryRouter.patch("/categories/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const data = requireFields(insertGalleryCategorySchema.partial().parse(req.body));
    const [row] = await db.update(galleryCategories).set(data).where(eq(galleryCategories.id, id)).returning();
    if (!row) return res.status(404).json({ error: "Categorie niet gevonden" });
    res.json(row);
  } catch (err) {
    next(err);
  }
});

galleryRouter.delete("/categories/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await db.delete(galleryCategories).where(eq(galleryCategories.id, id));
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ---------- Albums ----------
//
// Een album is een uitgevoerd event binnen een gelegenheid. De bezoeker komt binnen op de
// gelegenheid ("babyshower") en ziet daar meerdere events, elk met eigen foto's.

galleryRouter.get("/albums", async (req, res, next) => {
  try {
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : null;
    // 🔴 Tellen via een LEFT JOIN, niet via een subquery met `sql`-interpolatie.
    //
    // Dit stond er als:
    //   sql`(select count(*)::int from ${galleryItems} where ${galleryItems.albumId} = ${galleryAlbums.id})`
    // en Drizzle maakte daarvan:
    //   (select count(*)::int from "gallery_items" where "album_id" = "id")
    // Het laat de tabelnaam wég bij een geïnterpoleerde kolom, dus binnen de subquery sloegen
    // *beide* namen op `gallery_items`: een foto's `album_id` vergeleken met zijn eigen `id`.
    // Dat is bijna altijd onwaar, dus elk album meldde 0 foto's — zonder foutmelding.
    const rows = await db
      .select({
        id: galleryAlbums.id,
        categoryId: galleryAlbums.categoryId,
        slug: galleryAlbums.slug,
        title: galleryAlbums.title,
        eventDate: galleryAlbums.eventDate,
        description: galleryAlbums.description,
        // Zonder dit kon de eventpagina de blokken niet lezen: deze query somt de kolommen
        // expliciet op, dus een nieuwe kolom komt hier niet vanzelf mee.
        blocks: galleryAlbums.blocks,
        coverItemId: galleryAlbums.coverItemId,
        sortOrder: galleryAlbums.sortOrder,
        published: galleryAlbums.published,
        createdAt: galleryAlbums.createdAt,
        // `count(items.id)` en niet `count(*)`: bij een LEFT JOIN zonder foto's telt `*` de
        // lege rij mee en zou een leeg album 1 melden.
        itemCount: sql<number>`count(${galleryItems.id})::int`,
      })
      .from(galleryAlbums)
      .leftJoin(galleryItems, eq(galleryItems.albumId, galleryAlbums.id))
      .where(categoryId ? eq(galleryAlbums.categoryId, categoryId) : undefined)
      .groupBy(galleryAlbums.id)
      .orderBy(asc(galleryAlbums.sortOrder), asc(galleryAlbums.id));
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

/**
 * Een webadres dat nog niet bestaat binnen deze gelegenheid.
 *
 * Slugs zijn uniek per categorie (`gallery_albums_cat_slug_unique`), en twee feesten met
 * dezelfde titel is heel gewoon — twee keer "Sweet 16" onder Verjaardag. Zonder deze stap
 * gaf de tweede een 500 met een databasefout in beeld. Nu wordt het `sweet-16-2`.
 */
async function vrijeAlbumSlug(categoryId: number | null, basis: string): Promise<string> {
  const bestaand = await db
    .select({ slug: galleryAlbums.slug })
    .from(galleryAlbums)
    .where(categoryId === null
      ? isNull(galleryAlbums.categoryId)
      : eq(galleryAlbums.categoryId, categoryId));

  const bezet = new Set(bestaand.map((r) => r.slug));
  if (!bezet.has(basis)) return basis;

  // Doortellen tot er een vrij nummer is; het eerste duplicaat wordt `-2`, zoals een mens
  // het zou nummeren.
  for (let n = 2; n < 1000; n++) {
    const kandidaat = `${basis}-${n}`;
    if (!bezet.has(kandidaat)) return kandidaat;
  }
  return `${basis}-${Date.now()}`;
}

galleryRouter.post("/albums", async (req, res, next) => {
  try {
    const data = insertGalleryAlbumSchema.parse(req.body);
    const slug = await vrijeAlbumSlug(data.categoryId ?? null, data.slug);
    const [row] = await db.insert(galleryAlbums).values({ ...data, slug }).returning();
    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
});

galleryRouter.patch("/albums/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const data = requireFields(insertGalleryAlbumSchema.partial().strict().parse(req.body));
    const [row] = await db.update(galleryAlbums).set(data).where(eq(galleryAlbums.id, id)).returning();
    if (!row) return res.status(404).json({ error: "Album niet gevonden" });
    res.json(row);
  } catch (err) {
    next(err);
  }
});

// Verwijderen laat de foto's bestaan: `album_id` staat op SET NULL, dus ze vallen terug
// onder hun gelegenheid in plaats van te verdwijnen.
galleryRouter.delete("/albums/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await db.delete(galleryAlbums).where(eq(galleryAlbums.id, id));
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ---------- Items ----------

galleryRouter.get("/", async (_req, res, next) => {
  try {
    const rows = await db.select().from(galleryItems).orderBy(asc(galleryItems.sortOrder));
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

/**
 * Multer gooit zijn fouten vóór de route-handler, dus zonder deze laag komen ze als 500 met
 * een technische tekst binnen ("Unexpected field", "File too large"). Het zijn juist de
 * fouten die een gebruiker zelf kan oplossen, dus ze horen een 400 met uitleg te zijn.
 */
function ontvangBestanden(req: Request, res: Response, next: NextFunction) {
  upload.array("files", 30)(req, res, (err: unknown) => {
    if (!err) return next();

    const { code, field } = err as { code?: string; field?: string };

    // `LIMIT_UNEXPECTED_FILE` betekent twee heel verschillende dingen: te veel bestanden op
    // het verwachte veld, of een veld dat we niet kennen. Dat laatste is een fout in de
    // aanroep, niet iets wat de gebruiker verkeerd deed — `field` maakt het onderscheid.
    const melding =
      code === "LIMIT_FILE_SIZE"
        ? `Deze foto is groter dan ${env.MAX_UPLOAD_MB} MB. Maak hem kleiner of stuur een andere.`
        : code === "LIMIT_UNEXPECTED_FILE" && field !== undefined && field !== "files"
          ? `Onverwacht veld "${field}" — bestanden horen onder "files" te zitten.`
          : code === "LIMIT_UNEXPECTED_FILE" || code === "LIMIT_FILE_COUNT"
            ? "Te veel bestanden tegelijk — maximaal 30 per keer."
            : err instanceof Error
              ? err.message
              : "Uploaden mislukt";

    res.status(400).json({ error: melding });
  });
}

galleryRouter.post("/", ontvangBestanden, async (req, res, next) => {
  try {
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    if (!files.length) return res.status(400).json({ error: "Geen bestanden meegestuurd" });

    const categoryIdRaw = req.body.categoryId ? Number(req.body.categoryId) : null;
    const albumIdRaw = req.body.albumId ? Number(req.body.albumId) : null;

    // Zonder gelegenheid komt een foto nergens onder te staan: hij verdwijnt uit beeld terwijl
    // het uploaden "gelukt" is. Dan liever weigeren met uitleg.
    if (categoryIdRaw === null && albumIdRaw === null) {
      return res.status(400).json({
        error: "Kies eerst een gelegenheid of een event — anders komen de foto's nergens onder te staan.",
      });
    }

    const created: unknown[] = [];

    for (const file of files) {
      if (!HEIC_ONDERSTEUND && isHeic(file.buffer)) {
        throw new UploadFout(
          `"${file.originalname}" is een HEIC-bestand en dat kan deze server niet omzetten. ` +
            "Op een iPhone: Instellingen → Camera → Formaten → Meest compatibel. " +
            "Al gemaakte foto's kun je delen als JPEG via de deel-knop.",
        );
      }

      const id = randomUUID();
      const outName = `${id}.webp`;
      const outPath = path.join(GALLERY_DIR, outName);

      let meta;
      try {
        meta = await sharp(file.buffer)
          .rotate()
          .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
          .webp({ quality: 82 })
          .toFile(outPath);
      } catch (err) {
        // Sharp meldt "unsupported image format" of "premature end" — technisch juist, maar
        // niet iets waar iemand mee verder kan.
        throw new UploadFout(
          `"${file.originalname}" kon niet verwerkt worden. Waarschijnlijk is het bestand ` +
            `beschadigd of een formaat dat we niet lezen. Probeer een JPEG of PNG. (${
              err instanceof Error ? err.message : "onbekende fout"
            })`,
        );
      }

      const [row] = await db
        .insert(galleryItems)
        .values({
          categoryId: categoryIdRaw ?? null,
          albumId: albumIdRaw ?? null,
          filename: outName,
          width: meta.width,
          height: meta.height,
          source: "upload",
        })
        .returning();
      created.push(row);
    }

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

/**
 * `filename` en `source` zijn door ons gezet en horen niet van buiten te komen — de regel
 * uit CLAUDE.md is dat er nooit gebruikersinvoer in een bestandsnaam belandt. Bij het
 * uploaden wordt die regel gevolgd; hier viel hij per ongeluk weg doordat het volledige
 * insert-schema partieel werd geaccepteerd. `width` en `height` komen uit Sharp en zijn om
 * dezelfde reden niet aanpasbaar.
 */
const patchGalleryItemSchema = insertGalleryItemSchema
  .omit({ filename: true, source: true, width: true, height: true })
  .partial()
  .strict(); // afwijzen, niet stilzwijgend strippen — zie hieronder

galleryRouter.patch("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    // `.strict()` in plaats van stilzwijgend strippen: wie `filename` meestuurt krijgt een
    // 400 te zien in plaats van een 200 waarna het veld nooit is opgeslagen. Stil negeren
    // van invoer die de aanroeper wél verwacht is een bug die je pas veel later opmerkt.
    const data = requireFields(patchGalleryItemSchema.parse(req.body));
    const [row] = await db.update(galleryItems).set(data).where(eq(galleryItems.id, id)).returning();
    if (!row) return res.status(404).json({ error: "Afbeelding niet gevonden" });
    res.json(row);
  } catch (err) {
    next(err);
  }
});

const reorderSchema = z.object({
  order: z.array(z.object({ id: z.number().int(), sortOrder: z.number().int() })),
});

galleryRouter.post("/reorder", async (req, res, next) => {
  try {
    const { order } = reorderSchema.parse(req.body);
    await Promise.all(
      order.map((o) => db.update(galleryItems).set({ sortOrder: o.sortOrder }).where(eq(galleryItems.id, o.id))),
    );
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

galleryRouter.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [row] = await db.select().from(galleryItems).where(eq(galleryItems.id, id)).limit(1);
    if (row) {
      await db.delete(galleryItems).where(eq(galleryItems.id, id));
      const filePath = resolveInGalleryDir(row.filename);
      if (filePath) {
        await fs.unlink(filePath).catch(() => {});
      } else {
        console.warn(`[gallery] bestandsnaam buiten de galerijmap, niet verwijderd: ${row.filename}`);
      }
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
