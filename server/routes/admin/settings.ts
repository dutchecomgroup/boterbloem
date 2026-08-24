import { Router } from "express";
import { db } from "../../db.js";
import { siteSettings, siteSettingSchemas, isSiteSettingKey } from "@shared/schema";
import { eq } from "drizzle-orm";

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

settingsRouter.put("/:key", async (req, res, next) => {
  try {
    const key = req.params.key;

    // Onbekende sleutel weigeren: anders maakt een typefout stilzwijgend een nieuwe rij aan
    // die nooit meer gelezen wordt.
    if (!isSiteSettingKey(key)) {
      return res.status(400).json({
        error: `Onbekende instelling '${key}'`,
        details: { key: [`Toegestaan: ${Object.keys(siteSettingSchemas).join(", ")}`] },
      });
    }

    // Valideren tegen het schema van déze sleutel. Gooit een ZodError bij een verkeerde
    // vorm, die de errorHandler naar een 400 met veldfouten vertaalt.
    const value = siteSettingSchemas[key].parse(req.body);

    await db
      .insert(siteSettings)
      .values({ key, value })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: { value, updatedAt: new Date() },
      });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
