import { describe, it, expect } from "vitest";
import { siteSettingSchemas, publiekeSiteSettingSchemas } from "@shared/schema";
import { vulInstellingenAan } from "./instellingen.js";

/**
 * Het beheerscherm Teksten was leeg: de admin-route gaf alleen opgeslagen rijen terug, en de
 * tekstsleutels waren nog nooit bewaard. Deze tests leggen vast dat een ontbrekende sleutel met
 * zijn standaardtekst aankomt, voor de site én voor het beheerscherm.
 */
describe("vulInstellingenAan", () => {
  it("vult een nooit opgeslagen tekstsleutel met de standaardteksten", () => {
    const uit = vulInstellingenAan(siteSettingSchemas, new Map(), "ruw") as Record<string, any>;
    expect(uit.paginaHome.aanbodTitel).toBe("Sweet & grazing tables");
    expect(uit.werkwijze.kort).toHaveLength(5);
    expect(uit.paginaAanbod.smaken).toHaveLength(4);
  });

  it("geeft elke geregistreerde sleutel terug, ook als er niets is opgeslagen", () => {
    const uit = vulInstellingenAan(siteSettingSchemas, new Map(), "ruw");
    expect(Object.keys(uit).sort()).toEqual(Object.keys(siteSettingSchemas).sort());
  });

  it("laat wat zij heeft ingevuld staan en vult alleen de rest aan", () => {
    const opgeslagen = new Map<string, unknown>([["paginaHome", { aanbodTitel: "Haar eigen kop" }]]);
    const uit = vulInstellingenAan(siteSettingSchemas, opgeslagen, "ruw") as Record<string, any>;
    expect(uit.paginaHome.aanbodTitel).toBe("Haar eigen kop");
    expect(uit.paginaHome.werkTitel).toBe("Uitgelicht werk");
  });

  it("bewaart het agenda-token in het beheerscherm", () => {
    const opgeslagen = new Map<string, unknown>([["levertijden", { standaardDagen: 10, tekst: "x", agendaFeedToken: "abc" }]]);
    const uit = vulInstellingenAan(siteSettingSchemas, opgeslagen, "ruw") as Record<string, any>;
    expect(uit.levertijden.agendaFeedToken).toBe("abc");
  });

  it("laat het agenda-token weg op de publieke site", () => {
    const opgeslagen = new Map<string, unknown>([["levertijden", { standaardDagen: 10, tekst: "x", agendaFeedToken: "abc" }]]);
    const uit = vulInstellingenAan(publiekeSiteSettingSchemas, opgeslagen, "standaard");
    expect(JSON.stringify(uit)).not.toContain("agendaFeedToken");
  });

  describe("een ongeldige opgeslagen waarde", () => {
    const kapot = new Map<string, unknown>([["levertijden", { standaardDagen: -5 }]]);

    it("toont het beheerscherm wat er echt staat, zodat opslaan niets stil overschrijft", () => {
      const uit = vulInstellingenAan(siteSettingSchemas, kapot, "ruw") as Record<string, any>;
      expect(uit.levertijden.standaardDagen).toBe(-5);
    });

    it("krijgt de site de standaardwaarde, zodat de pagina niet leeg valt", () => {
      const uit = vulInstellingenAan(publiekeSiteSettingSchemas, kapot, "standaard") as Record<string, any>;
      expect(uit.levertijden.standaardDagen).toBe(10);
    });
  });
});
