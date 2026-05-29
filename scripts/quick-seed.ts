import "dotenv/config";
import { db, pg } from "../server/db.js";
import { users, galleryCategories, products, siteSettings } from "../shared/schema.js";
import { hashPassword } from "../server/auth.js";
import { eq } from "drizzle-orm";

const USERNAME = "esmee";
const NAME = "Esmee";
const PASSWORD = "1234";

console.log("→ admin user");
const existing = await db.select().from(users).where(eq(users.username, USERNAME)).limit(1);
const passwordHash = await hashPassword(PASSWORD);
if (existing.length) {
  await db.update(users).set({ passwordHash, name: NAME }).where(eq(users.id, existing[0].id));
  console.log(`  ✓ '${USERNAME}' bijgewerkt`);
} else {
  await db.insert(users).values({ username: USERNAME, passwordHash, name: NAME, role: "admin" });
  console.log(`  ✓ '${USERNAME}' aangemaakt (wachtwoord: ${PASSWORD})`);
}

console.log("→ galerij categorieën");
for (const cat of [
  { slug: "bruidstaarten", name: "Bruidstaarten", sortOrder: 0 },
  { slug: "verjaardagstaarten", name: "Verjaardagstaarten", sortOrder: 1 },
  { slug: "mini-desserts", name: "Mini desserts", sortOrder: 2 },
  { slug: "cupcakes", name: "Cupcakes", sortOrder: 3 },
  { slug: "party-setups", name: "Party setups", sortOrder: 4 },
  { slug: "overig", name: "Overig", sortOrder: 5 },
]) {
  await db.insert(galleryCategories).values(cat).onConflictDoNothing({ target: galleryCategories.slug });
}
console.log("  ✓");

console.log("→ producten");
for (const p of [
  { slug: "bruidstaart", name: "Bruidstaart op maat", category: "bruidstaart" as const, basePrice: "0", unit: "stuk" },
  { slug: "verjaardagstaart", name: "Verjaardagstaart", category: "verjaardag" as const, basePrice: "0", unit: "stuk" },
  { slug: "cupcakes", name: "Cupcakes", category: "cupcakes" as const, basePrice: "0", unit: "stuk" },
  { slug: "mini-desserts", name: "Mini desserts", category: "mini_desserts" as const, basePrice: "0", unit: "stuk" },
]) {
  await db.insert(products).values(p).onConflictDoNothing({ target: products.slug });
}
console.log("  ✓");

console.log("→ site settings");
for (const s of [
  {
    key: "contact",
    value: {
      email: "",
      phone: "",
      whatsapp: "",
      address: "",
      city: "",
      postcode: "",
      instagram: "https://instagram.com/atelierboterbloem",
      facebook: "",
      openingHours: [],
    },
  },
  {
    key: "hero",
    value: {
      title: "Atelier Boterbloem",
      tagline: "Handgemaakte taarten voor jouw mooiste momenten",
      ctaLabel: "Vraag offerte aan",
      ctaHref: "/contact",
      imageFilename: "",
    },
  },
  {
    key: "about",
    value: {
      heading: "Over Atelier Boterbloem",
      body: "Vanuit liefde voor het ambacht maken wij elke taart met de hand. Ieder ontwerp wordt persoonlijk afgestemd op jouw verhaal.",
      imageFilename: "",
    },
  },
]) {
  await db.insert(siteSettings).values(s).onConflictDoNothing({ target: siteSettings.key });
}
console.log("  ✓");

console.log("\nKlaar.");
await pg.end();
process.exit(0);
