import "dotenv/config";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { db } from "../server/db.js";
import { users, galleryCategories, products, packages, siteSettings } from "../shared/schema.js";
import { hashPassword } from "../server/auth.js";
import { eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";

/**
 * Gelegenheden, niet taart-typen. De bezoeker zoekt "iets voor een babyshower", niet
 * "een bruidstaart" — zie de meeting van 24-08.
 *
 * Dit is een **startset**: de klant beheert ze zelf in het beheerpaneel. Hernoemen mag,
 * maar laat de slug staan zodra de site live is: die zit in het webadres.
 */
async function ensureGalleryCategories() {
  const defaults = [
    { slug: "babyshower", name: "Babyshower", sortOrder: 0 },
    { slug: "bruiloft", name: "Bruiloft", sortOrder: 1 },
    { slug: "verjaardag", name: "Verjaardag", sortOrder: 2 },
    { slug: "communie", name: "Communie & lentefeest", sortOrder: 3 },
    { slug: "geboorte", name: "Geboorte & doopsuiker", sortOrder: 4 },
    { slug: "bedrijfsevent", name: "Bedrijfsevent", sortOrder: 5 },
    { slug: "overig", name: "Overig", sortOrder: 6 },
    /*
     * Niet gepubliceerd, en dat is het hele punt. Foto's die bij de site horen en niet bij een
     * feest — haar portret op de over-pagina — moeten ergens onder staan, want de galerij
     * weigert een upload zonder gelegenheid: een foto die nergens onder hangt is onvindbaar.
     * Hier landen ze, en omdat `published` op false staat verschijnt deze gelegenheid niet op
     * /galerij. De fotokiezer in de instellingen ziet hem wél.
     */
    { slug: "sitefotos", name: "Sitefoto's", sortOrder: 99, published: false },
  ];
  for (const cat of defaults) {
    await db.insert(galleryCategories).values(cat).onConflictDoNothing({ target: galleryCategories.slug });
  }
}

/**
 * Drie pakketten uit de meeting. Bewust `active: false` en prijs 0: ze staan klaar in het
 * beheerpaneel, maar verschijnen pas op de site als de klant de prijzen heeft doorgegeven.
 */
async function ensurePackages() {
  const defaults = [
    {
      slug: "sweet-table",
      name: "Sweet Table",
      tagline: "Het complete zoete tafereel voor je feest",
      priceUnit: "totaal" as const,
      personsMin: 15,
      personsMax: 40,
      includes: [
        "Taart als centrepiece",
        "Vier soorten mini desserts",
        "Cupcakes",
        "Styling, stands en glaswerk",
        "Opbouw ter plaatse",
      ],
      sortOrder: 0,
      featured: true,
    },
    {
      slug: "sweet-table-xl",
      name: "Sweet Table XL",
      tagline: "Voor grotere feesten, met meer variatie",
      priceUnit: "totaal" as const,
      personsMin: 40,
      personsMax: 80,
      includes: [
        "Grote taart als centrepiece",
        "Zes tot acht soorten mini desserts",
        "Cupcakes en macarons",
        "Uitgebreide styling met meerdere niveaus",
        "Opbouw en afbouw ter plaatse",
      ],
      sortOrder: 1,
      featured: true,
    },
    {
      slug: "bruiloft-table",
      name: "Bruiloft Table",
      tagline: "Afgestemd op jullie dag, tot de laatste suikerbloem",
      priceUnit: "totaal" as const,
      personsMin: 40,
      includes: [
        "Persoonlijk ontwerpgesprek",
        "Bruidstaart op maat",
        "Ruime dessertselectie",
        "Styling in jullie kleuren en stijl",
        "Opbouw, afbouw en overleg met de locatie",
      ],
      sortOrder: 2,
      featured: true,
    },
  ];
  for (const p of defaults) {
    await db.insert(packages).values(p).onConflictDoNothing({ target: packages.slug });
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
        // Sweet en grazing tables voorop — dat is de hoofdfocus sinds de meeting van 24-08.
        // Taarten horen erbij, maar zijn niet waar de site over gaat.
        tagline: "Sweet tables en grazing tables voor jouw mooiste momenten",
        ctaLabel: "Vraag offerte aan",
        ctaHref: "/contact",
        imageFilename: "",
      },
    },
    {
      key: "about",
      value: {
        heading: "Over Atelier Boterbloem",
        body: "Vanuit liefde voor het ambacht bouwen wij elke tafel met de hand op. Sweet tables, grazing tables en taarten — ieder ontwerp wordt persoonlijk afgestemd op jouw verhaal.",
        imageFilename: "",
      },
    },
    {
      key: "levertijden",
      value: {
        standaardDagen: 10,
        taartenDagen: 5,
        tekst:
          "Vraag je aan minimaal 10 dagen van tevoren aan. Voor taarten kunnen we vaak flexibeler zijn — vraag gerust.",
        // Token voor de agenda-feed. Wordt hier eenmalig gegenereerd; te vervangen vanuit
        // het instellingen-scherm zonder dat het wachtwoord verandert.
        agendaFeedToken: randomBytes(24).toString("hex"),
      },
    },
  ];
  for (const s of defaults) {
    await db.insert(siteSettings).values(s).onConflictDoNothing({ target: siteSettings.key });
  }
}

async function main() {
  // Allow non-interactive run via env vars (CI / scripted).
  const envUsername = process.env.ADMIN_USERNAME;
  const envName = process.env.ADMIN_NAME;
  const envPassword = process.env.ADMIN_PASSWORD;

  let username: string;
  let name: string;
  let password: string;

  if (envUsername && envPassword) {
    username = envUsername.trim().toLowerCase();
    name = (envName ?? "").trim();
    password = envPassword;
    console.log(`\n=== Atelier Boterbloem — admin seeding (non-interactive) ===\nGebruikersnaam: ${username}\n`);
  } else {
    const rl = readline.createInterface({ input, output });
    console.log("\n=== Atelier Boterbloem — admin seeding ===\n");
    username = (await rl.question("Gebruikersnaam: ")).trim().toLowerCase();
    name = (await rl.question("Naam (optioneel): ")).trim();
    password = await rl.question("Wachtwoord (min 10 tekens): ");
    rl.close();
  }

  if (!username || !password || password.length < 10) {
    console.error("Gebruikersnaam en wachtwoord (>=10 tekens) zijn verplicht.");
    process.exit(1);
  }

  const existing = await db.select().from(users).where(eq(users.username, username)).limit(1);
  const passwordHash = await hashPassword(password);

  if (existing.length) {
    await db.update(users).set({ passwordHash, name: name || existing[0].name }).where(eq(users.id, existing[0].id));
    console.log(`✓ Bestaande gebruiker '${username}' bijgewerkt (nieuw wachtwoord).`);
  } else {
    await db.insert(users).values({ username, passwordHash, name: name || null, role: "admin" });
    console.log(`✓ Nieuwe admin '${username}' aangemaakt.`);
  }

  console.log("Galerij-categorieën seeden...");
  await ensureGalleryCategories();
  console.log("Pakketten seeden...");
  await ensurePackages();
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
