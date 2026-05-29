import { Router } from "express";
import multer from "multer";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import path from "node:path";
import fs from "node:fs/promises";
import { db } from "../../db.js";
import {
  galleryItems,
  galleryCategories,
  insertGalleryItemSchema,
  insertGalleryCategorySchema,
} from "@shared/schema";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { env } from "../../env.js";

export const galleryRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|webp|heic|heif|avif)$/i.test(file.mimetype)) cb(null, true);
    else cb(new Error("Alleen afbeeldingen toegestaan"));
  },
});

const GALLERY_DIR = path.resolve(env.UPLOADS_DIR, "gallery");
await fs.mkdir(GALLERY_DIR, { recursive: true });

// ---------- Categories ----------

galleryRouter.get("/categories", async (_req, res, next) => {
  try {
    const rows = await db.select().from(galleryCategories).orderBy(asc(galleryCategories.sortOrder));
    res.json(rows);
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
    const data = insertGalleryCategorySchema.partial().parse(req.body);
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

// ---------- Items ----------

galleryRouter.get("/", async (_req, res, next) => {
  try {
    const rows = await db.select().from(galleryItems).orderBy(asc(galleryItems.sortOrder));
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

galleryRouter.post("/", upload.array("files", 30), async (req, res, next) => {
  try {
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    if (!files.length) return res.status(400).json({ error: "Geen bestanden meegestuurd" });

    const categoryIdRaw = req.body.categoryId ? Number(req.body.categoryId) : null;
    const created: unknown[] = [];

    for (const file of files) {
      const id = randomUUID();
      const outName = `${id}.webp`;
      const outPath = path.join(GALLERY_DIR, outName);

      const meta = await sharp(file.buffer)
        .rotate()
        .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(outPath);

      const [row] = await db
        .insert(galleryItems)
        .values({
          categoryId: categoryIdRaw ?? null,
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

galleryRouter.patch("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const data = insertGalleryItemSchema.partial().parse(req.body);
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
      await fs.unlink(path.join(GALLERY_DIR, row.filename)).catch(() => {});
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
