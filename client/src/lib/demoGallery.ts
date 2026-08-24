import type { GalleryItem, GalleryCategory, GalleryAlbum } from "@shared/schema";
import { imageSrc } from "./images";

/**
 * ⚠️ TIJDELIJKE OPVULLING — moet weg vóór de livegang.
 *
 * Dit zijn stockfoto's van Unsplash, geen werk van het atelier. Ze staan er zodat het
 * ontwerp te beoordelen is en de klant ziet hoe de site eruit gaat zien voordat ze een
 * fotoshoot plant (besloten 25-08).
 *
 * Ze mogen **niet** mee naar de publieke live site: andermans taarten tonen als haar werk
 * misleidt bezoekers die daarop een offerte aanvragen. Zie testscript §8.8 — dat is een
 * blokkerende stap.
 *
 * Zodra er één echte foto in de database staat, verdwijnt alles hieronder vanzelf: zie
 * `heeftEchteContent()`.
 */

const u = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export { imageSrc };

// ---------- Gelegenheden ----------

const cat = (id: number, slug: string, name: string, description: string): GalleryCategory => ({
  id, slug, name, description, published: true, sortOrder: id - 1,
});

export const DEMO_CATEGORIES: GalleryCategory[] = [
  cat(1, "babyshower", "Babyshower", "Zacht, speels en met veel pastel."),
  cat(2, "bruiloft", "Bruiloft", "Van intiem tot uitbundig, altijd op maat ontworpen."),
  cat(3, "verjaardag", "Verjaardag", "Voor wie iets bijzonders verdient."),
  cat(4, "bedrijfsevent", "Bedrijfsevent", "Representatief, en toch persoonlijk."),
];

// ---------- Albums (events) ----------

const alb = (
  id: number, categoryId: number, slug: string, title: string,
  eventDate: string, description: string,
): GalleryAlbum => ({
  id, categoryId, slug, title, eventDate, description,
  // Opvulmateriaal krijgt geen blokken: dan valt de weergave terug op omschrijving + foto's,
  // precies zoals een echt album dat nog niet ingedeeld is.
  blocks: null,
  coverItemId: null, sortOrder: id, published: true,
  createdAt: new Date(0) as unknown as Date,
});

export const DEMO_ALBUMS: GalleryAlbum[] = [
  alb(1, 1, "pastel-sweet-table", "Pastel sweet table", "2026-03-14", "Roze, mint en veel bloemen"),
  alb(2, 1, "grazing-table-lente", "Grazing table in de lente", "2026-05-02", "Fruit, macarons en mini cheesecakes"),
  alb(3, 2, "bruiloft-tuinfeest", "Tuinbruiloft", "2026-06-21", "Drielaags met verse bloemen"),
  alb(4, 2, "bruiloft-goud", "Bruiloft met bladgoud", "2026-07-11", "Strak wit met gouden accenten"),
  alb(5, 3, "verjaardag-bessen", "Verjaardag met seizoensbessen", "2026-04-08", "Frisse taart met veel fruit"),
  alb(6, 4, "borrel-dessertbar", "Dessertbar bedrijfsborrel", "2026-02-19", "Hapklaar, voor honderd gasten"),
];

// ---------- Foto's ----------

const mk = (
  id: number, categoryId: number, albumId: number, unsplashId: string,
  altText: string, caption: string, featured = false,
): GalleryItem => ({
  id, categoryId, albumId,
  filename: u(unsplashId),
  altText, caption,
  width: 1200, height: 1500,
  featured, sortOrder: id - 100, source: "demo",
  createdAt: new Date(0) as unknown as Date,
});

export const DEMO_ITEMS: GalleryItem[] = [
  mk(101, 1, 1, "photo-1486427944299-d1955d23e34d", "Cupcakes met buttercream", "Cupcakes met buttercream-rozen", true),
  mk(102, 1, 1, "photo-1599785209707-a456fc1337bb", "Vanille cupcakes", "Vanille cupcakes met goudglitter"),
  mk(103, 1, 2, "photo-1551024601-bec78aea704b", "Mini cheesecakes", "Mini cheesecakejes met fruit", true),
  mk(104, 1, 2, "photo-1488477181946-6428a0291777", "Tartelettes", "Tartelettes met crème en bessen"),
  mk(105, 2, 3, "photo-1535254973040-607b474cb50d", "Witte bruidstaart met bloemen", "Drielaags met verse bloemen", true),
  mk(106, 2, 3, "photo-1535141192574-5d4897c12636", "Tweelaags bruidstaart", "Tweelaags met suikerbloemen"),
  mk(107, 2, 4, "photo-1519869325930-281384150729", "Bruidstaart met bladgoud", "Strak wit met bladgoud", true),
  mk(108, 2, 4, "photo-1464349095431-e9a21285b5f3", "Sweet table opstelling", "Sweet table voor de bruiloft"),
  mk(109, 3, 5, "photo-1578985545062-69928b1d9587", "Verjaardagstaart met bessen", "Met seizoensbessen", true),
  mk(110, 3, 5, "photo-1571115177098-24ec42ed204d", "Chocolade verjaardagstaart", "Chocolade ganache"),
  mk(111, 3, 5, "photo-1464195244916-405fa0a82545", "Pistache verjaardagstaart", "Pistache & framboos"),
  mk(112, 4, 6, "photo-1530648672449-81f6c723e2f1", "Dessert bar", "Dessertbar met macarons en taart", true),
  mk(113, 4, 6, "photo-1565958011703-44f9829ba187", "Bonbons", "Handgemaakte bonbons"),
];

// ---------- Samenstellen ----------

export type DemoAlbum = GalleryAlbum & { items: GalleryItem[]; cover: GalleryItem | null };
export type DemoCategory = GalleryCategory & {
  albums: DemoAlbum[];
  losseItems: GalleryItem[];
  cover: GalleryItem | null;
  itemCount: number;
};

/** Zelfde vorm als `GET /api/public/gallery` levert, zodat de pagina's niets hoeven te weten. */
export const DEMO_NESTED: DemoCategory[] = DEMO_CATEGORIES.map((c) => {
  const albums = DEMO_ALBUMS.filter((a) => a.categoryId === c.id).map((a) => {
    const items = DEMO_ITEMS.filter((i) => i.albumId === a.id);
    return { ...a, items, cover: items[0] ?? null };
  });
  return {
    ...c,
    albums,
    losseItems: [],
    cover: albums.find((a) => a.cover)?.cover ?? null,
    itemCount: albums.reduce((n, a) => n + a.items.length, 0),
  };
});

export const DEMO_FEATURED: GalleryItem[] = DEMO_ITEMS.filter((i) => i.featured);

/**
 * Eén plek die bepaalt of we demo tonen. Zodra er echte content is, verdwijnt de opvulling
 * volledig — geen mengeling van echt werk en stockfoto's, want dat is het slechtste van
 * twee werelden.
 */
export function heeftEchteContent(items: unknown[] | undefined): boolean {
  return Array.isArray(items) && items.length > 0;
}

/**
 * Kies één demo-beeld per gelegenheid, voor kaarten die nog geen eigen foto hebben.
 *
 * Valt terug op het eerste beschikbare beeld in plaats van `null` bij een onbekende slug.
 * Dat is bewust: toen de categorieën van taart-type naar gelegenheid gingen, bleef
 * `demoImageForSlug("bruidstaarten")` in AboutPage staan en verdween de portretfoto zonder
 * dat iets klaagde. Een zichtbaar verkeerd beeld valt op; een leeg vlak niet.
 */
export function demoImageForSlug(slug: string): string | null {
  const c = DEMO_NESTED.find((x) => x.slug === slug);
  if (c?.cover) return imageSrc(c.cover);

  if (import.meta.env.DEV) {
    console.warn(
      `[demoGallery] onbekende gelegenheid "${slug}" — terugval op het eerste demo-beeld. ` +
        `Bekend: ${DEMO_NESTED.map((x) => x.slug).join(", ")}`,
    );
  }
  const terugval = DEMO_NESTED.find((x) => x.cover)?.cover;
  return terugval ? imageSrc(terugval) : null;
}
