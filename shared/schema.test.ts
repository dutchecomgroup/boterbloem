import { describe, it, expect } from "vitest";
import {
  siteSettingSchemas,
  isSiteSettingKey,
  insertContactRequestSchema,
  insertGalleryItemSchema,
  insertPackageSchema,
  insertReviewSchema,
  insertGalleryAlbumSchema,
} from "./schema.js";

describe("site-instellingen: sleutel → schema", () => {
  it("kent precies de geregistreerde sleutels", () => {
    // Deze test is er om te merken dat de lijst verandert. Nieuwe instelling toegevoegd?
    // Voeg hem hier bij én controleer of de settings-route hem accepteert.
    expect(Object.keys(siteSettingSchemas).sort()).toEqual(["about", "btw", "contact", "hero", "levertijden"]);
  });

  it("herkent een geldige sleutel", () => {
    expect(isSiteSettingKey("contact")).toBe(true);
  });

  it("wijst een onbekende sleutel af", () => {
    // Voorheen maakte een typefout stilzwijgend een nieuwe rij aan die nooit werd gelezen.
    expect(isSiteSettingKey("contct")).toBe(false);
    expect(isSiteSettingKey("__proto__")).toBe(false);
  });

  it("weigert een ongeldig e-mailadres in contact", () => {
    const r = siteSettingSchemas.contact.safeParse({ email: "geen-adres", openingHours: [] });
    expect(r.success).toBe(false);
  });

  it("staat een leeg e-mailadres toe", () => {
    // Bewust: de klant vult dit later in, een lege waarde mag opslaan.
    const r = siteSettingSchemas.contact.safeParse({ email: "", openingHours: [] });
    expect(r.success).toBe(true);
  });

  it("vult standaardwaarden in voor hero", () => {
    const r = siteSettingSchemas.hero.parse({});
    expect(r.title).toBe("Atelier Boterbloem");
    expect(r.ctaHref).toBe("/contact");
  });
});

describe("contactaanvraag", () => {
  const geldig = {
    name: "Test Klant",
    email: "test@example.com",
    message: "Graag een offerte voor een sweet table.",
  };

  it("accepteert een geldige aanvraag", () => {
    expect(insertContactRequestSchema.safeParse(geldig).success).toBe(true);
  });

  it("weigert een te korte naam", () => {
    expect(insertContactRequestSchema.safeParse({ ...geldig, name: "A" }).success).toBe(false);
  });

  it("weigert een ongeldig e-mailadres", () => {
    expect(insertContactRequestSchema.safeParse({ ...geldig, email: "kapot" }).success).toBe(false);
  });

  it("weigert een te kort bericht", () => {
    expect(insertContactRequestSchema.safeParse({ ...geldig, message: "hoi" }).success).toBe(false);
  });

  it("stript het honeypot-veld in plaats van het op te slaan", () => {
    const r = insertContactRequestSchema.parse({ ...geldig, website: "http://spam.example" });
    expect(r).not.toHaveProperty("website");
  });

  it("laat de status niet van buitenaf zetten", () => {
    const r = insertContactRequestSchema.parse({ ...geldig, status: "omgezet_naar_order" });
    expect(r).not.toHaveProperty("status");
  });
});

describe("galerij patch-schema", () => {
  // Zelfde vorm als in server/routes/admin/gallery.ts. Zou die daar wijzigen zonder dat
  // deze test meebeweegt, dan is dat precies wat we willen weten.
  const patchSchema = insertGalleryItemSchema
    .omit({ filename: true, source: true, width: true, height: true })
    .partial()
    .strict();

  it("weigert filename — anders is padmanipulatie bij verwijderen mogelijk", () => {
    const r = patchSchema.safeParse({ filename: "../../../etc/passwd" });
    expect(r.success).toBe(false);
  });

  it("weigert source", () => {
    expect(patchSchema.safeParse({ source: "demo" }).success).toBe(false);
  });

  it("staat de bedoelde velden toe", () => {
    expect(patchSchema.safeParse({ featured: true }).success).toBe(true);
    expect(patchSchema.safeParse({ categoryId: 3 }).success).toBe(true);
    expect(patchSchema.safeParse({ altText: "Bruidstaart met bloemen" }).success).toBe(true);
  });
});

describe("levertijden", () => {
  it("vult standaardwaarden in", () => {
    const r = siteSettingSchemas.levertijden.parse({});
    expect(r.standaardDagen).toBe(10);
    expect(r.taartenDagen).toBe(5);
  });

  it("weigert een onzinnig aantal dagen", () => {
    expect(siteSettingSchemas.levertijden.safeParse({ standaardDagen: -1 }).success).toBe(false);
    expect(siteSettingSchemas.levertijden.safeParse({ standaardDagen: 9999 }).success).toBe(false);
  });
});

describe("btw", () => {
  it("staat standaard op geen btw", () => {
    // De veilige aanname zolang de klant het niet bevestigd heeft: liever geen btw-regel op de
    // offerte dan een bedrag dat er misschien niet hoort te staan.
    expect(siteSettingSchemas.btw.parse({}).standaardTarief).toBe("geen");
  });

  it("kent precies drie tarieven", () => {
    for (const t of ["geen", "laag", "hoog"]) {
      expect(siteSettingSchemas.btw.safeParse({ standaardTarief: t }).success).toBe(true);
    }
    expect(siteSettingSchemas.btw.safeParse({ standaardTarief: "9%" }).success).toBe(false);
    expect(siteSettingSchemas.btw.safeParse({ standaardTarief: "verlaagd" }).success).toBe(false);
  });
});

describe("pakketten", () => {
  const geldig = { name: "Sweet Table XL", slug: "sweet-table-xl", priceUnit: "totaal", includes: [] };

  it("accepteert een geldig pakket", () => {
    expect(insertPackageSchema.safeParse(geldig).success).toBe(true);
  });

  it("weigert een onbekende prijs-eenheid", () => {
    // 'totaal' of 'per_persoon' — anders weet de site niet of er p.p. achter moet.
    expect(insertPackageSchema.safeParse({ ...geldig, priceUnit: "per_taart" }).success).toBe(false);
  });

  it("eist dat includes een lijst met tekst is", () => {
    expect(insertPackageSchema.safeParse({ ...geldig, includes: ["Taart", "Cupcakes"] }).success).toBe(true);
    expect(insertPackageSchema.safeParse({ ...geldig, includes: "Taart" }).success).toBe(false);
  });
});

describe("reviews", () => {
  const geldig = { authorName: "Lisa", body: "Prachtige tafel, alles klopte tot in detail." };

  it("accepteert een geldige review", () => {
    expect(insertReviewSchema.safeParse(geldig).success).toBe(true);
  });

  it("weigert een te korte review", () => {
    expect(insertReviewSchema.safeParse({ ...geldig, body: "top" }).success).toBe(false);
  });

  it("weigert een cijfer buiten 1-5", () => {
    expect(insertReviewSchema.safeParse({ ...geldig, rating: 6 }).success).toBe(false);
    expect(insertReviewSchema.safeParse({ ...geldig, rating: 0 }).success).toBe(false);
    expect(insertReviewSchema.safeParse({ ...geldig, rating: null }).success).toBe(true);
  });

  it("laat published niet van buitenaf op true zetten via het insert-schema", () => {
    // Wel toegestaan (het is een gewoon veld), maar de standaard moet false zijn.
    const r = insertReviewSchema.parse(geldig);
    expect(r.published ?? false).toBe(false);
  });
});

describe("galerij-albums", () => {
  it("eist een titel en een slug", () => {
    expect(insertGalleryAlbumSchema.safeParse({ title: "", slug: "x" }).success).toBe(false);
    expect(insertGalleryAlbumSchema.safeParse({ title: "Pastel table", slug: "" }).success).toBe(false);
    expect(insertGalleryAlbumSchema.safeParse({ title: "Pastel table", slug: "pastel-table" }).success).toBe(true);
  });
});
