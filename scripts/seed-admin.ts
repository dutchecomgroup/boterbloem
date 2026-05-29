import "dotenv/config";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { db } from "../server/db.js";
import { users, galleryCategories, products, siteSettings } from "../shared/schema.js";
import { hashPassword } from "../server/auth.js";
import { eq } from "drizzle-orm";

async function ensureGalleryCategories() {
  const defaults = [
    { slug: "bruidstaarten", name: "Bruidstaarten", sortOrder: 0 },
    { slug: "verjaardagstaarten", name: "Verjaardagstaarten", sortOrder: 1 },
    { slug: "mini-desserts", name: "Mini desserts", sortOrder: 2 },
    { slug: "cupcakes", name: "Cupcakes", sortOrder: 3 },
    { slug: "party-setups", name: "Party setups", sortOrder: 4 },
    { slug: "overig", name: "Overig", sortOrder: 5 },
  ];
  for (const cat of defaults) {
    await db.insert(galleryCategories).values(cat).onConflictDoNothing({ target: galleryCategories.slug });
  }
}

async function ensureProducts() {
  const defaults = [
    { slug: "bruidstaart", name: "Bruidstaart op maat", category: "bruidstaart" as const, basePrice: "0", unit: "stuk" },
    { slug: "verjaardagstaart", name: "Verjaardagstaart", category: "verjaardag" as const, basePrice: "0", unit: "stuk" },
    { slug: "cupcakes", name: "Cupcakes", category: "cupcakes" as const, basePrice: "0", unit: "stuk" },
    { slug: "mini-desserts", name: "Mini desserts", category: "mini_desserts" as const, basePrice: "0", unit: "stuk" },
  ];
  for (const p of defaults) {
    await db.insert(products).values(p).onConflictDoNothing({ target: products.slug });
  }
}

async function ensureSiteSettings() {
  const defaults = [
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
  ];
  for (const s of defaults) {
    await db.insert(siteSettings).values(s).onConflictDoNothing({ target: siteSettings.key });
  }
}

async function main() {
  const rl = readline.createInterface({ input, output });
  console.log("\n=== Atelier Boterbloem — admin seeding ===\n");
  const email = (await rl.question("Admin email: ")).trim().toLowerCase();
  const name = (await rl.question("Naam (optioneel): ")).trim();
  const password = await rl.question("Wachtwoord (min 10 tekens): ");
  rl.close();

  if (!email || !password || password.length < 10) {
    console.error("Email en wachtwoord (>=10 tekens) zijn verplicht.");
    process.exit(1);
  }

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const passwordHash = await hashPassword(password);

  if (existing.length) {
    await db.update(users).set({ passwordHash, name: name || existing[0].name }).where(eq(users.id, existing[0].id));
    console.log(`✓ Bestaande gebruiker '${email}' bijgewerkt (nieuw wachtwoord).`);
  } else {
    await db.insert(users).values({ email, passwordHash, name: name || null, role: "admin" });
    console.log(`✓ Nieuwe admin '${email}' aangemaakt.`);
  }

  console.log("Galerij-categorieën seeden...");
  await ensureGalleryCategories();
  console.log("Producten seeden...");
  await ensureProducts();
  console.log("Site settings seeden...");
  await ensureSiteSettings();

  console.log("\nKlaar.\n");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
