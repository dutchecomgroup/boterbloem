import { describe, it, expect } from "vitest";
import {
  siteSettingSchemas,
  publiekeSiteSettingSchemas,
  werkwijzeSettingsSchema,
  insertProductSchema,
  insertGalleryCategorySchema,
  insertPackageSchema,
} from "./schema.js";

/**
 * De beheerbare teksten (13-09). Het uitgangspunt was dat er bij het in gebruik nemen niets
 * verandert aan wat een bezoeker leest: elke standaardwaarde is de tekst die er stond.
 */
describe("teksten: standaardwaarden", () => {
  it("vult elke tekstsleutel volledig in vanuit een lege rij", () => {
    for (const k of ["paginaHome", "paginaAanbod", "paginaGalerij", "paginaWerkwijze", "paginaContact", "voettekst"] as const) {
      const r = siteSettingSchemas[k].parse({}) as Record<string, unknown>;
      for (const [veld, waarde] of Object.entries(r)) {
        if (typeof waarde === "string") expect(waarde, `${k}.${veld}`).not.toBe("");
      }
    }
  });

  it("zet de smaken en weetjes van /aanbod als lijst klaar", () => {
    const r = siteSettingSchemas.paginaAanbod.parse({});
    expect(r.smaken.map((s) => s.naam)).toEqual(["Lemon Bliss", "Strawberry Blush", "Caramel Cocoa", "Coco Blanc"]);
    expect(r.weetjes).toHaveLength(4);
  });

  it("kent de nieuwe hero- en over-velden", () => {
    expect(siteSettingSchemas.hero.parse({}).bovenschrift).toContain("Grazing tables");
    expect(siteSettingSchemas.about.parse({}).citaat).toContain("ambacht");
  });
});

describe("werkwijze", () => {
  /*
   * Deze standaard stond eerst op een lege lijst. Bij een database waar de sleutel nog niet
   * bestond verdween daardoor de hele strip op de homepage, en kwamen twee groene banden direct
   * op elkaar te staan. Dit legt vast dat haar tekst er altijd staat.
   */
  it("staat nooit leeg: haar eigen stappen zijn de standaard", () => {
    const r = werkwijzeSettingsSchema.parse({});
    expect(r.kort).toHaveLength(5);
    expect(r.lang).toHaveLength(7);
    expect(r.kort[0].titel).toBe("Aanvraag");
    expect(r.lang[6].titel).toBe("En dan is het zover");
  });

  it("geeft per keer een nieuwe kopie, zodat een wijziging niet doorlekt", () => {
    const eerste = werkwijzeSettingsSchema.parse({});
    eerste.kort[0].titel = "gewijzigd";
    expect(werkwijzeSettingsSchema.parse({}).kort[0].titel).toBe("Aanvraag");
  });

  it("weigert een stap zonder titel", () => {
    const r = werkwijzeSettingsSchema.safeParse({ kort: [{ titel: "", tekst: "x" }], lang: [] });
    expect(r.success).toBe(false);
  });

  it("slaat geen stapnummer op: dat volgt uit de volgorde", () => {
    const r = werkwijzeSettingsSchema.parse({ kort: [{ titel: "Een", n: "03" }], lang: [] });
    expect(r.kort[0]).not.toHaveProperty("n");
  });
});

describe("teksten zijn publiek, gegevens niet", () => {
  it("stuurt de teksten wel en het agenda-token nog steeds niet mee", () => {
    expect(publiekeSiteSettingSchemas).toHaveProperty("paginaAanbod");
    expect(publiekeSiteSettingSchemas).toHaveProperty("werkwijze");
    expect(publiekeSiteSettingSchemas).not.toHaveProperty("btw");
  });
});

describe("slug: de server maakt hem", () => {
  it("accepteert een taart zonder slug", () => {
    expect(insertProductSchema.safeParse({ name: "Bruidstaart" }).success).toBe(true);
  });

  it("accepteert een pakket zonder slug", () => {
    expect(insertPackageSchema.safeParse({ name: "Petite Table", priceUnit: "totaal", includes: [] }).success).toBe(true);
  });

  it("accepteert een gelegenheid zonder slug, en laat een expliciete slug staan", () => {
    expect(insertGalleryCategorySchema.safeParse({ name: "Babyshower" }).success).toBe(true);
    // De seed maakt zo de verborgen gelegenheid waar de fotokiezer naar uploadt.
    expect(insertGalleryCategorySchema.parse({ name: "Sitefoto's", slug: "sitefotos" }).slug).toBe("sitefotos");
  });
});
