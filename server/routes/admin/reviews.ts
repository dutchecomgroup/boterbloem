import { Router } from "express";
import { db } from "../../db.js";
import { reviews, insertReviewSchema } from "@shared/schema";
import { asc, desc, eq } from "drizzle-orm";
import { requireFields } from "../../lib/patch.js";

export const reviewsRouter = Router();

reviewsRouter.get("/", async (_req, res, next) => {
  try {
    const rows = await db
      .select()
      .from(reviews)
      .orderBy(asc(reviews.sortOrder), desc(reviews.occurredOn), desc(reviews.id));
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

reviewsRouter.post("/", async (req, res, next) => {
  try {
    const data = insertReviewSchema.parse(req.body);
    const [row] = await db.insert(reviews).values(data).returning();
    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
});

reviewsRouter.patch("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const data = requireFields(insertReviewSchema.partial().parse(req.body));
    const [row] = await db.update(reviews).set(data).where(eq(reviews.id, id)).returning();
    if (!row) return res.status(404).json({ error: "Review niet gevonden" });
    res.json(row);
  } catch (err) {
    next(err);
  }
});

reviewsRouter.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await db.delete(reviews).where(eq(reviews.id, id));
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
