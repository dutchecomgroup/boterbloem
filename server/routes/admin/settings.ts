import { Router } from "express";
import { db } from "../../db.js";
import { siteSettings, siteSettingSchemas, isSiteSettingKey } from "@shared/schema";
import { vulInstellingenAan } from "../../lib/instellingen.js";

export const settingsRouter = Router();

/**
 * Alle instellingen, volledig ingevuld.
 *
 * Gaf eerder alleen de rijen terug die in de tabel stonden. Een sleutel die nog nooit was
 * opgeslagen kwam dus niet mee, en het beheerscherm Teksten toonde lege velden terwijl de site
 * de standaardteksten liet zien. Nu wordt elke sleutel door zijn schema aangevuld -- dezelfde
 * logica als de publieke route. Zie `server/lib/instellingen.ts`.
 */
settingsRouter.get("/", async (_req, res, next) => {
  try {
    const rows = await db.select().from(siteSettings);
    const opgeslagen = new Map(rows.map((r) => [r.key, r.value]));
    res.json(vulInstellingenAan(siteSettingSchemas, opgeslagen, "ruw"));
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
