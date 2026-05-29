import { Router } from "express";
import { db } from "../../db.js";
import { contactRequests } from "@shared/schema";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

export const contactRequestsRouter = Router();

contactRequestsRouter.get("/", async (req, res, next) => {
  try {
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const base = db.select().from(contactRequests).orderBy(desc(contactRequests.createdAt));
    const rows = status ? await base.where(eq(contactRequests.status, status as never)) : await base;
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

const statusSchema = z.object({
  status: z.enum(["nieuw", "gelezen", "opgevolgd", "omgezet_naar_order"]),
});

contactRequestsRouter.patch("/:id/status", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { status } = statusSchema.parse(req.body);
    const [row] = await db
      .update(contactRequests)
      .set({ status })
      .where(eq(contactRequests.id, id))
      .returning();
    if (!row) return res.status(404).json({ error: "Aanvraag niet gevonden" });
    res.json(row);
  } catch (err) {
    next(err);
  }
});

contactRequestsRouter.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await db.delete(contactRequests).where(eq(contactRequests.id, id));
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
