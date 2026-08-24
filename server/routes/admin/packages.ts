import { Router } from "express";
import { db } from "../../db.js";
import { packages, insertPackageSchema } from "@shared/schema";
import { asc, eq } from "drizzle-orm";
import { requireFields } from "../../lib/patch.js";

export const packagesRouter = Router();

packagesRouter.get("/", async (_req, res, next) => {
  try {
    const rows = await db.select().from(packages).orderBy(asc(packages.sortOrder), asc(packages.name));
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

packagesRouter.post("/", async (req, res, next) => {
  try {
    const data = insertPackageSchema.parse(req.body);
    const [row] = await db.insert(packages).values(data).returning();
    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
});

packagesRouter.patch("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const data = requireFields(insertPackageSchema.partial().parse(req.body));
    const [row] = await db.update(packages).set(data).where(eq(packages.id, id)).returning();
    if (!row) return res.status(404).json({ error: "Pakket niet gevonden" });
    res.json(row);
  } catch (err) {
    next(err);
  }
});

packagesRouter.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await db.delete(packages).where(eq(packages.id, id));
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
