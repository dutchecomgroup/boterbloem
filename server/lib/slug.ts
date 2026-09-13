import { and, eq, isNull, ne } from "drizzle-orm";
import { db } from "../db.js";
import { galleryAlbums, galleryCategories, packages, products } from "@shared/schema";
import { slugify, vrijNummer } from "@shared/slug";

/**
 * Vrije webadressen per tabel, server-side.
 *
 * **Slugs worden alleen bij aanmaken afgeleid, nooit bij hernoemen.** Dat is een vastgelegd
 * besluit (docs/archive/planning/portfolio-categorie-albums.md): een gelegenheid staat op
 * `/galerij/:slug`, en wie de naam wijzigt hoort gedeelde links en zoekresultaten niet stil te
 * breken.
 *
 * Bewust vier kleine functies en geen generieke `vrijeSlug(tabel, kolom)`: generiek typeren over
 * Drizzle-tabellen levert casts op, en een paar regels per tabel is minder code dan die
 * typegymnastiek. De kern -- doortellen tot er een vrij nummer is -- staat maar op één plek.
 *
 * `negeerId` is voor een bewuste wijziging van een bestaande slug: zonder die uitzondering
 * botst een rij met zichzelf.
 */

/** Maakt van een naam een vrije slug. Een expliciet meegegeven slug gaat ook door `slugify`. */
function basisVan(naam: string, expliciet?: string | null): string {
  return slugify(expliciet?.trim() ? expliciet : naam);
}

export async function vrijeProductSlug(naam: string, expliciet?: string | null, negeerId?: number) {
  const rijen = await db
    .select({ slug: products.slug })
    .from(products)
    .where(negeerId ? ne(products.id, negeerId) : undefined);
  return vrijNummer(new Set(rijen.map((r) => r.slug)), basisVan(naam, expliciet));
}

export async function vrijePakketSlug(naam: string, expliciet?: string | null, negeerId?: number) {
  const rijen = await db
    .select({ slug: packages.slug })
    .from(packages)
    .where(negeerId ? ne(packages.id, negeerId) : undefined);
  return vrijNummer(new Set(rijen.map((r) => r.slug)), basisVan(naam, expliciet));
}

export async function vrijeCategorieSlug(naam: string, expliciet?: string | null, negeerId?: number) {
  const rijen = await db
    .select({ slug: galleryCategories.slug })
    .from(galleryCategories)
    .where(negeerId ? ne(galleryCategories.id, negeerId) : undefined);
  return vrijNummer(new Set(rijen.map((r) => r.slug)), basisVan(naam, expliciet));
}

/**
 * Albums zijn uniek **per gelegenheid** (`gallery_albums_cat_slug_unique`), niet globaal: twee
 * keer "Sweet 16" onder Verjaardag botst, onder Verjaardag en Babyshower niet.
 *
 * Stond als `vrijeAlbumSlug` in `routes/admin/gallery.ts`; het gedrag is ongewijzigd.
 */
export async function vrijeAlbumSlug(
  categoryId: number | null,
  naam: string,
  expliciet?: string | null,
  negeerId?: number,
) {
  const binnenGelegenheid =
    categoryId === null ? isNull(galleryAlbums.categoryId) : eq(galleryAlbums.categoryId, categoryId);
  const rijen = await db
    .select({ slug: galleryAlbums.slug })
    .from(galleryAlbums)
    .where(negeerId ? and(binnenGelegenheid, ne(galleryAlbums.id, negeerId)) : binnenGelegenheid);
  return vrijNummer(new Set(rijen.map((r) => r.slug)), basisVan(naam, expliciet));
}
