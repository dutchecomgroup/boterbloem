import { Router } from "express";
import rateLimit from "express-rate-limit";
import { db } from "../db.js";
import {
  contactRequests,
  galleryItems,
  galleryAlbums,
  galleryCategories,
  siteSettings,
  packages,
  products,
  reviews,
  insertContactRequestSchema,
  type GalleryItem,
  type GalleryAlbum,
  type GalleryCategory,
} from "@shared/schema";
import { and, asc, desc, eq } from "drizzle-orm";

export const publicRouter = Router();

/**
 * Dit endpoint staat open en schrijft in de database. Zodra de site vindbaar is, vult
 * formulierspam de aanvragenlijst — en dat is precies de lijst waar ze op moet kunnen
 * vertrouwen, want er gaat geen notificatie uit.
 *
 * Vijf per uur per IP is ruim: een bezoeker stuurt er één, hooguit twee als de eerste
 * mislukte. Bewust geen captcha — dat kost echte bezoekers moeite, terwijl honeypot plus
 * begrenzing het overgrote deel al vangt.
 */
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Te veel aanvragen verstuurd. Probeer het later opnieuw." },
});

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

/**
 * Nest foto's onder hun album, en albums onder hun gelegenheid.
 *
 * Foto's zonder album blijven zichtbaar: ze komen in `losseItems` van hun gelegenheid
 * terecht in plaats van te verdwijnen. Dat is bewust — `album_id` is nullable zodat een
 * losse foto direct onder een gelegenheid kan hangen.
 */
function nest(cats: GalleryCategory[], albums: GalleryAlbum[], items: GalleryItem[]) {
  const perAlbum = new Map<number, GalleryItem[]>();
  const losPerCat = new Map<number, GalleryItem[]>();

  for (const item of items) {
    if (item.albumId != null) {
      const lijst = perAlbum.get(item.albumId) ?? [];
      lijst.push(item);
      perAlbum.set(item.albumId, lijst);
    } else if (item.categoryId != null) {
      const lijst = losPerCat.get(item.categoryId) ?? [];
      lijst.push(item);
      losPerCat.set(item.categoryId, lijst);
    }
  }

  return cats.map((cat) => {
    const catAlbums = albums
      .filter((a) => a.categoryId === cat.id)
      .map((album) => {
        const albumItems = perAlbum.get(album.id) ?? [];
        return {
          ...album,
          items: albumItems,
          // Cover: de gekozen foto, anders de eerste van het album.
          cover: albumItems.find((i) => i.id === album.coverItemId) ?? albumItems[0] ?? null,
        };
      });

    const losseItems = losPerCat.get(cat.id) ?? [];
    const eersteCover = catAlbums.find((a) => a.cover)?.cover ?? losseItems[0] ?? null;

    return {
      ...cat,
      albums: catAlbums,
      losseItems,
      cover: eersteCover,
      itemCount: catAlbums.reduce((n, a) => n + a.items.length, 0) + losseItems.length,
    };
  });
}

/** Alleen gepubliceerd, in de volgorde die het beheerscherm bepaalt. */
async function haalGalerij(categoryId?: number) {
  const [cats, albums, items] = await Promise.all([
    db
      .select()
      .from(galleryCategories)
      .where(
        categoryId
          ? and(eq(galleryCategories.published, true), eq(galleryCategories.id, categoryId))
          : eq(galleryCategories.published, true),
      )
      .orderBy(asc(galleryCategories.sortOrder), asc(galleryCategories.id)),
    db
      .select()
      .from(galleryAlbums)
      .where(eq(galleryAlbums.published, true))
      .orderBy(asc(galleryAlbums.sortOrder), desc(galleryAlbums.eventDate)),
    db
      .select()
      .from(galleryItems)
      .orderBy(desc(galleryItems.featured), asc(galleryItems.sortOrder), desc(galleryItems.createdAt)),
  ]);
  return { cats, albums, items };
}

// GET /api/public/gallery — alle gelegenheden met hun albums
publicRouter.get("/gallery", async (_req, res, next) => {
  try {
    const { cats, albums, items } = await haalGalerij();
    res.json({
      categories: nest(cats, albums, items),
      // Platte lijst blijft meegaan: de homepage-carrousel en het uitgelicht-blok gebruiken
      // hem, en die hoeven niets van de albumstructuur te weten.
      items,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/public/gallery/:slug — één gelegenheid met haar albums
publicRouter.get("/gallery/:slug", async (req, res, next) => {
  try {
    const [cat] = await db
      .select()
      .from(galleryCategories)
      .where(and(eq(galleryCategories.slug, req.params.slug), eq(galleryCategories.published, true)))
      .limit(1);
    if (!cat) return res.status(404).json({ error: "Gelegenheid niet gevonden" });

    const { cats, albums, items } = await haalGalerij(cat.id);
    const [genest] = nest(cats, albums, items);
    res.json({ category: genest });
  } catch (err) {
    next(err);
  }
});


// GET /api/public/packages — alleen actieve pakketten, met coverfoto
publicRouter.get('/packages', async (_req, res, next) => {
  try {
    // De coverfoto komt uit `cover_item_id` via een LEFT JOIN, zodat een pakket zonder cover
    // gewoon meekomt met `cover: null` in plaats van uit de lijst te vallen.
    const rows = await db
      .select({
        pakket: packages,
        cover: galleryItems,
      })
      .from(packages)
      .leftJoin(galleryItems, eq(packages.coverItemId, galleryItems.id))
      .where(eq(packages.active, true))
      .orderBy(asc(packages.sortOrder), asc(packages.id));

    res.json(rows.map((r) => ({ ...r.pakket, cover: r.cover })));
  } catch (err) {
    next(err);
  }
});

// GET /api/public/products — de taart-prijslijst. Twee voorwaarden: actief EN bewust
// publiek gezet. Zo blijft een intern product intern.
publicRouter.get('/products', async (_req, res, next) => {
  try {
    const rows = await db
      .select()
      .from(products)
      .where(and(eq(products.active, true), eq(products.publicVisible, true)))
      .orderBy(asc(products.sortOrder), asc(products.name));
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/public/reviews — alleen gepubliceerd
publicRouter.get('/reviews', async (_req, res, next) => {
  try {
    const rows = await db
      .select()
      .from(reviews)
      .where(eq(reviews.published, true))
      .orderBy(asc(reviews.sortOrder), desc(reviews.occurredOn), desc(reviews.id));
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/public/contact
publicRouter.post("/contact", contactLimiter, async (req, res, next) => {
  try {
    // Honeypot: een veld dat verborgen staat en dus alleen door een bot wordt ingevuld.
    // We geven bewust een 201 terug — een bot die een foutmelding krijgt, past zich aan.
    if (typeof req.body?.website === "string" && req.body.website.trim() !== "") {
      console.warn(`[contact] honeypot ingevuld, aanvraag genegeerd (${req.ip})`);
      return res.status(201).json({ ok: true });
    }

    const data = insertContactRequestSchema.parse(req.body);
    const [row] = await db.insert(contactRequests).values(data).returning({ id: contactRequests.id });
    res.status(201).json({ ok: true, id: row.id });
  } catch (err) {
    next(err);
  }
});
