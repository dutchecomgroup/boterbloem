import { Router } from "express";
import { db } from "../../db.js";
import { siteSettings } from "@shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const settingsRouter = Router();

settingsRouter.get("/", async (_req, res, next) => {
  try {
    const rows = await db.select().from(siteSettings);
    const out: Record<string, unknown> = {};
    for (const r of rows) out[r.key] = r.value;
    res.json(out);
  } catch (err) {
    next(err);
  }
});

const upsertSchema = z.object({
  key: z.string().min(1).max(80),
  value: z.unknown(),
});

settingsRouter.put("/:key", async (req, res, next) => {
  try {
    const key = req.params.key;
    const { value } = upsertSchema.parse({ key, value: req.body });
    await db
      .insert(siteSettings)
      .values({ key, value: value as never })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: { value: value as never, updatedAt: new Date() },
      });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
