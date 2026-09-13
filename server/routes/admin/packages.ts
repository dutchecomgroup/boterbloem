import { Router } from "express";
import { db } from "../../db.js";
import { packages, galleryItems, insertPackageSchema } from "@shared/schema";
import { asc, eq } from "drizzle-orm";
import { requireFields } from "../../lib/patch.js";
import { vrijePakketSlug } from "../../lib/slug.js";

export const packagesRouter = Router();

packagesRouter.get("/", async (_req, res, next) => {
  try {
    // De coverfoto komt mee via een LEFT JOIN, net als op de publieke route. Anders moet het
    // beheerscherm voor elke miniatuur de hele galerij ophalen en er zelf op zoeken, en dat is
    // precies de reden dat de fotokiezer daar tot nu toe ontbrak.
    //
    // `left` en niet `inner`: een pakket zonder cover hoort gewoon in de lijst te staan, met
    // `cover: null`. Er staat bewust geen foreign key op `cover_item_id`, dus de verwijzing kan
    // ook naar een verwijderde foto wijzen -- ook dan valt hij hier op `null` terug.
    const rows = await db
      .select({ pakket: packages, cover: galleryItems })
      .from(packages)
      .leftJoin(galleryItems, eq(packages.coverItemId, galleryItems.id))
      .orderBy(asc(packages.sortOrder), asc(packages.name));

    res.json(rows.map((r) => ({ ...r.pakket, cover: r.cover })));
  } catch (err) {
    next(err);
  }
});

packagesRouter.post("/", async (req, res, next) => {
  try {
    const data = insertPackageSchema.parse(req.body);
    // Het webadres maakt de server, uit de naam. Twee pakketten met dezelfde naam gaven een
    // databasefout in beeld; nu krijgt de tweede `-2`.
    const slug = await vrijePakketSlug(data.name, data.slug);
    const [row] = await db.insert(packages).values({ ...data, slug }).returning();
    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
});

packagesRouter.patch("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    // `slug` is na het aanmaken niet meer te wijzigen: een gedeelde link naar
    // /contact?pakket=<slug> hoort niet te breken omdat iemand de naam bijschaaft.
    const data = requireFields(insertPackageSchema.omit({ slug: true }).partial().parse(req.body));
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
