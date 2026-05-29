import type { GalleryItem, GalleryCategory } from "@shared/schema";

const u = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const DEMO_CATEGORIES: GalleryCategory[] = [
  { id: 1, slug: "bruidstaarten", name: "Bruidstaarten", sortOrder: 0 },
  { id: 2, slug: "verjaardagstaarten", name: "Verjaardagstaarten", sortOrder: 1 },
  { id: 3, slug: "mini-desserts", name: "Mini desserts", sortOrder: 2 },
  { id: 4, slug: "cupcakes", name: "Cupcakes", sortOrder: 3 },
  { id: 5, slug: "party-setups", name: "Party setups", sortOrder: 4 },
  { id: 6, slug: "overig", name: "Overig", sortOrder: 5 },
];

const mk = (
  id: number,
  categoryId: number,
  unsplashId: string,
  altText: string,
  caption: string,
  featured = false,
): GalleryItem => ({
  id,
  categoryId,
  filename: u(unsplashId),
  altText,
  caption,
  width: 1200,
  height: 1500,
  featured,
  sortOrder: id - 100,
  source: "demo",
  createdAt: new Date(0) as unknown as Date,
});

export const DEMO_ITEMS: GalleryItem[] = [
  mk(101, 1, "photo-1535254973040-607b474cb50d", "Witte bruidstaart met bloemen", "Drielaags bruidstaart met verse bloemen", true),
  mk(103, 1, "photo-1535141192574-5d4897c12636", "Tweelaags bruidstaart", "Tweelaags met suikerbloemen"),
  mk(104, 2, "photo-1578985545062-69928b1d9587", "Verjaardagstaart met bessen", "Verjaardagstaart met seizoensbessen", true),
  mk(105, 2, "photo-1571115177098-24ec42ed204d", "Chocolade verjaardagstaart", "Chocolade ganache verjaardagstaart"),
  mk(106, 2, "photo-1464195244916-405fa0a82545", "Pistache verjaardagstaart", "Pistache & framboos"),
  mk(107, 3, "photo-1551024601-bec78aea704b", "Mini cheesecakes", "Mini cheesecakejes met fruit", true),
  mk(108, 3, "photo-1488477181946-6428a0291777", "Tartelettes", "Tartelettes met crème en bessen"),
  mk(109, 4, "photo-1486427944299-d1955d23e34d", "Cupcakes met buttercream", "Cupcakes met buttercream-rozen", true),
  mk(110, 4, "photo-1599785209707-a456fc1337bb", "Vanille cupcakes", "Vanille cupcakes met goudglitter"),
  mk(111, 5, "photo-1464349095431-e9a21285b5f3", "Sweet table opstelling", "Sweet table voor bruiloft", true),
  mk(112, 5, "photo-1530648672449-81f6c723e2f1", "Dessert bar", "Dessert bar met macarons en taart"),
  mk(113, 6, "photo-1565958011703-44f9829ba187", "Bonbons", "Handgemaakte bonbons"),
  mk(114, 6, "photo-1519869325930-281384150729", "Bruidstaart met goud", "Bruidstaart met bladgoud"),
];

export const DEMO_FEATURED: GalleryItem[] = DEMO_ITEMS.filter((i) => i.featured);

export function imageSrc(item: { filename: string }): string {
  if (item.filename.startsWith("http")) return item.filename;
  return `/uploads/gallery/${item.filename}`;
}

export function withFallback<T extends { length: number }>(real: T | undefined, demo: T): T {
  return real && real.length > 0 ? real : demo;
}

/** Pick one demo image per category slug (for service cards, etc.) */
export function demoImageForSlug(slug: string): string | null {
  const cat = DEMO_CATEGORIES.find((c) => c.slug === slug);
  if (!cat) return null;
  const item = DEMO_ITEMS.find((i) => i.categoryId === cat.id && i.featured) ?? DEMO_ITEMS.find((i) => i.categoryId === cat.id);
  return item ? imageSrc(item) : null;
}
