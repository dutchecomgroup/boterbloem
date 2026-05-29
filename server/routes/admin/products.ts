import { Router } from "express";
import { db } from "../../db.js";
import { products, insertProductSchema } from "@shared/schema";
import { asc, eq } from "drizzle-orm";

export const productsRouter = Router();

productsRouter.get("/", async (_req, res, next) => {
  try {
    const rows = await db.select().from(products).orderBy(asc(products.sortOrder), asc(products.name));
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

productsRouter.post("/", async (req, res, next) => {
  try {
    const data = insertProductSchema.parse(req.body);
    const [row] = await db.insert(products).values(data).returning();
    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
});

productsRouter.patch("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const data = insertProductSchema.partial().parse(req.body);
    const [row] = await db.update(products).set(data).where(eq(products.id, id)).returning();
    if (!row) return res.status(404).json({ error: "Product niet gevonden" });
    res.json(row);
  } catch (err) {
    next(err);
  }
});

productsRouter.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await db.delete(products).where(eq(products.id, id));
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
