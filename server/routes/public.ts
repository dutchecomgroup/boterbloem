import { Router } from "express";
import { db } from "../db.js";
import {
  contactRequests,
  galleryItems,
  galleryCategories,
  siteSettings,
  insertContactRequestSchema,
} from "@shared/schema";
import { asc, desc, eq } from "drizzle-orm";

export const publicRouter = Router();

// GET /api/public/settings
publicRouter.get("/settings", async (_req, res, next) => {
  try {
    const rows = await db.select().from(siteSettings);
    const out: Record<string, unknown> = {};
    for (const row of rows) out[row.key] = row.value;
    res.json(out);
  } catch (err) {
    next(err);
  }
});

// GET /api/public/gallery
publicRouter.get("/gallery", async (_req, res, next) => {
  try {
    const [items, cats] = await Promise.all([
      db
        .select()
        .from(galleryItems)
        .orderBy(desc(galleryItems.featured), asc(galleryItems.sortOrder), desc(galleryItems.createdAt)),
      db.select().from(galleryCategories).orderBy(asc(galleryCategories.sortOrder)),
    ]);
    res.json({ items, categories: cats });
  } catch (err) {
    next(err);
  }
});

// GET /api/public/gallery/:slug
publicRouter.get("/gallery/:slug", async (req, res, next) => {
  try {
    const cat = await db
      .select()
      .from(galleryCategories)
      .where(eq(galleryCategories.slug, req.params.slug))
      .limit(1);
    if (!cat.length) return res.status(404).json({ error: "Categorie niet gevonden" });
    const items = await db
      .select()
      .from(galleryItems)
      .where(eq(galleryItems.categoryId, cat[0].id))
      .orderBy(desc(galleryItems.featured), asc(galleryItems.sortOrder));
    res.json({ category: cat[0], items });
  } catch (err) {
    next(err);
  }
});

// POST /api/public/contact
publicRouter.post("/contact", async (req, res, next) => {
  try {
    const data = insertContactRequestSchema.parse(req.body);
    const [row] = await db.insert(contactRequests).values(data).returning({ id: contactRequests.id });
    res.status(201).json({ ok: true, id: row.id });
  } catch (err) {
    next(err);
  }
});
