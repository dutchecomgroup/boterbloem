import { describe, it, expect } from "vitest";
import { slugify, vrijNummer } from "./slug.js";

/**
 * De slug maakt sinds 13-09 de server, uit de naam. Deze functies stonden daarvoor twee keer
 * identiek in de client, en het taartscherm liet de klant hem zelf intikken.
 */
describe("slugify", () => {
  it("maakt van een naam een webadres", () => {
    expect(slugify("Bruidstaart op maat")).toBe("bruidstaart-op-maat");
  });

  it("haalt accenten weg in plaats van de letter", () => {
    expect(slugify("Crème brûlée")).toBe("creme-brulee");
    expect(slugify("Communie & lentefeest")).toBe("communie-lentefeest");
  });

  it("laat geen streepjes aan de randen of dubbel achter", () => {
    expect(slugify("  --Sweet   Table!!  ")).toBe("sweet-table");
  });

  it("houdt de familie-regel van de pakketten intact", () => {
    // `pakketFamilie()` kleurt alles wat op `-graze` eindigt als hartig. Voor haar eigen
    // pakketnamen moet de automatische slug daar dus nog steeds op uitkomen.
    expect(slugify("The little graze")).toBe("the-little-graze");
    expect(slugify("The grand graze").endsWith("-graze")).toBe(true);
  });

  it("kapt af op de lengte van de kolom", () => {
    expect(slugify("a".repeat(300))).toHaveLength(120);
  });
});

describe("vrijNummer", () => {
  it("geeft de basis terug als die nog vrij is", () => {
    expect(vrijNummer(new Set(["taart"]), "bruidstaart")).toBe("bruidstaart");
  });

  it("nummert door bij een dubbele naam, zoals een mens dat doet", () => {
    // Twee keer "Bruidstaart" gaf eerder een databasefout in beeld.
    expect(vrijNummer(new Set(["bruidstaart"]), "bruidstaart")).toBe("bruidstaart-2");
    expect(vrijNummer(new Set(["bruidstaart", "bruidstaart-2"]), "bruidstaart")).toBe("bruidstaart-3");
  });

  it("zet nooit een lege slug in de database", () => {
    // Een naam van alleen leestekens of emoji levert bij slugify een lege uitkomst op.
    expect(vrijNummer(new Set(), "")).toBe("item");
    expect(vrijNummer(new Set(["item"]), "")).toBe("item-2");
  });
});
