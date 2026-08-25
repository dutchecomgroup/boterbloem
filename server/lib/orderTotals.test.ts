import { describe, it, expect } from "vitest";
import {
  regelTotaal, boekingTotaal, openstaand, ontvangen, pakketNaarRegels,
  naarCenten, naarBedrag, BedragTeGroot, MAX_BEDRAG,
  btwUitBedrag, geldendTarief, btwPerTarief,
} from "./orderTotals.js";

/**
 * De genummerde scenario's verwijzen naar de honderd klantsituaties in het plan. Dit is de
 * plek waar het rekenwerk vastligt: een fout hier gaat als bedrag naar een klant.
 */

describe("regeltotaal", () => {
  it("scenario 60 — 3 × € 12,35 is € 37,05", () => {
    // De klassieke valkuil: 3 * 12.35 = 37.049999999999997 in JavaScript.
    expect(regelTotaal(3, "12.35")).toBe("37.05");
  });

  it("scenario 61 — een half pakket: 0,5 × € 200,00", () => {
    expect(regelTotaal("0.5", "200.00")).toBe("100.00");
  });

  it("scenario 12 — 50 macarons van € 1,20", () => {
    expect(regelTotaal(50, "1.20")).toBe("60.00");
  });

  it("scenario 53 — korting als negatieve regel", () => {
    expect(regelTotaal(1, "-25.00")).toBe("-25.00");
  });

  it("aantal 0 geeft € 0,00, geen fout", () => {
    // Situatie: regel alvast neerzetten als plaatshouder.
    expect(regelTotaal(0, "275.00")).toBe("0.00");
  });

  it("accepteert een komma, want dat typt een mens", () => {
    expect(regelTotaal(2, "12,50")).toBe("25.00");
  });

  it("onzin in het aantal geeft € 0,00 in plaats van NaN", () => {
    expect(regelTotaal("abc", "10.00")).toBe("0.00");
  });

  it("scenario 62 — een bedrag boven het maximum wordt geweigerd", () => {
    expect(() => regelTotaal(1, "120000.00")).toThrow(BedragTeGroot);
    // Ook als het pas ná vermenigvuldigen te groot wordt.
    expect(() => regelTotaal(1000, "500.00")).toThrow(BedragTeGroot);
  });

  it("precies op het maximum mag nog", () => {
    expect(regelTotaal(1, String(MAX_BEDRAG))).toBe("99999.99");
  });
});

describe("boekingtotaal", () => {
  it("telt de regels op", () => {
    const regels = [
      { lineTotal: "275.00" },
      { lineTotal: "60.00" },
      { lineTotal: "35.00" },
      { lineTotal: "25.00" },
      { lineTotal: "-25.00" },
    ];
    expect(boekingTotaal(regels)).toBe("370.00");
  });

  it("scenario 63 — geen regels geeft € 0,00, niet leeg", () => {
    expect(boekingTotaal([])).toBe("0.00");
  });

  it("scenario 64 — korting groter dan de rest geeft een negatief totaal", () => {
    expect(boekingTotaal([{ lineTotal: "50.00" }, { lineTotal: "-75.00" }])).toBe("-25.00");
  });

  it("een stuksprijs met drie decimalen wordt eerst op centen afgerond", () => {
    // Bewust: `unit_price` is numeric(10,2), dus € 0,335 bestaat niet als stuksprijs. Hij
    // wordt € 0,34 en dáármee wordt gerekend — 3 × € 0,34 = € 1,02.
    // Zou je pas op het eind afronden, dan stond er € 1,01 op de offerte terwijl de regel
    // "3 × € 0,34" leest. Dat verschil is precies waar een klant over belt.
    expect(regelTotaal(3, "0.335")).toBe("1.02");
  });

  it("telt de al afgeronde regeltotalen op", () => {
    // De klant telt op de offerte de regels bij elkaar op. Het totaal moet daarmee kloppen,
    // dus we sommeren de regels zoals ze er staan en rekenen niet opnieuw vanaf aantal × prijs.
    const r = regelTotaal(3, "0.34");
    expect(r).toBe("1.02");
    expect(boekingTotaal([{ lineTotal: r }, { lineTotal: r }, { lineTotal: r }])).toBe("3.06");
  });

  it("veel regels blijven exact", () => {
    const regels = Array.from({ length: 100 }, () => ({ lineTotal: "0.07" }));
    expect(boekingTotaal(regels)).toBe("7.00");
  });
});

describe("ontvangen bedrag", () => {
  it("telt de betaalregels op", () => {
    expect(ontvangen([{ amount: "125.00" }, { amount: "170.00" }])).toBe("295.00");
  });

  it("geen betalingen is nul, niet leeg", () => {
    expect(ontvangen([])).toBe("0.00");
  });

  it("blijft exact bij bedragen die in een float scheefgaan", () => {
    expect(ontvangen([{ amount: "0.10" }, { amount: "0.20" }])).toBe("0.30");
  });
});

describe("openstaand bedrag", () => {
  it("scenario 51 — € 445 totaal, € 125 ontvangen", () => {
    expect(openstaand("445.00", "125.00")).toBe("320.00");
  });

  it("scenario 52 — volledig betaald", () => {
    expect(openstaand("370.00", "370.00")).toBe("0.00");
  });

  it("scenario 55 — te veel betaald geeft een negatief bedrag", () => {
    expect(openstaand("100.00", "150.00")).toBe("-50.00");
  });

  it("niets ontvangen laat het hele bedrag openstaan", () => {
    expect(openstaand("275.00", "0")).toBe("275.00");
  });

  /*
   * De fout van 25-08, nu vastgelegd in het model in plaats van in een vlag: `depositAmount` is
   * de *afgesproken* aanbetaling en nooit een ontvangen bedrag. Een afspraak zonder betaling
   * heeft geen regel in `order_payments`, dus ontvangen is 0 en het hele bedrag staat open.
   */
  it("een afgesproken maar onbetaalde aanbetaling verlaagt het openstaande bedrag niet", () => {
    const geenBetaling: Array<{ amount: string }> = [];
    expect(openstaand("295.00", ontvangen(geenBetaling))).toBe("295.00");
    expect(openstaand("295.00", ontvangen([{ amount: "200.00" }]))).toBe("95.00");
  });

  /*
   * De aanleiding voor `order_payments`: ABB-2026-014 was afgeleverd én volledig betaald, maar
   * kon dat nergens kwijt. Met een betaalregel voor het hele bedrag staat er niets meer open.
   */
  it("een volledig betaalde boeking staat op nul, ook zonder aanbetaling", () => {
    expect(openstaand("295.00", ontvangen([{ amount: "295.00" }]))).toBe("0.00");
  });

  it("in delen betalen komt op hetzelfde uit als in één keer", () => {
    const inDelen = ontvangen([{ amount: "100.00" }, { amount: "95.00" }, { amount: "100.00" }]);
    expect(openstaand("295.00", inDelen)).toBe("0.00");
  });
});

describe("pakket naar regels", () => {
  const pakket = {
    id: 2,
    name: "Sweet Table XL",
    priceFrom: "395.00",
    priceUnit: "totaal",
    includes: ["Grote taart als centrepiece", "Zes soorten mini desserts"],
  };

  it("wordt één regel met de vanaf-prijs", () => {
    const regels = pakketNaarRegels(pakket, 45);
    // Eén regel, niet één per onderdeel: anders staan er zes posten waarvan vijf € 0,00.
    expect(regels).toHaveLength(1);
    expect(regels[0]).toMatchObject({
      description: "Sweet Table XL",
      quantity: "1",
      unitPrice: "395.00",
      lineTotal: "395.00",
    });
  });

  it("zet wat erin zit als subregels onder die ene regel", () => {
    expect(pakketNaarRegels(pakket, 45)[0].details).toEqual({
      inbegrepen: ["Grote taart als centrepiece", "Zes soorten mini desserts"],
      packageId: 2,
    });
  });

  it("onthoudt uit welk pakket de regel komt", () => {
    // Daarmee wordt hetzelfde pakket nog eens toevoegen een hoger aantal in plaats van een
    // tweede identieke regel — twee keer "Sweet Table € 25,00" leest als een fout.
    expect(pakketNaarRegels(pakket, 45)[0].details.packageId).toBe(2);
  });

  it("kopieert de lijst, zodat een latere wijziging aan het pakket de boeking niet raakt", () => {
    const regels = pakketNaarRegels(pakket, 45);
    pakket.includes.push("Iets wat er later bij bedacht is");
    expect(regels[0].details.inbegrepen).toHaveLength(2);
    pakket.includes.pop();
  });

  it("scenario 15 — per persoon: aantal wordt het aantal gasten", () => {
    // Zonder dit belandt € 12,50 p.p. voor 45 gasten als één regel van € 12,50 op de offerte.
    const pp = { ...pakket, priceUnit: "per_persoon", priceFrom: "12.50" };
    const regels = pakketNaarRegels(pp, 45);
    expect(regels[0].quantity).toBe("45");
    expect(regels[0].lineTotal).toBe("562.50");
  });

  it("scenario 47 — per persoon zonder aantal valt terug op 1, geen € 0", () => {
    const pp = { ...pakket, priceUnit: "per_persoon", priceFrom: "12.50" };
    expect(pakketNaarRegels(pp, null)[0].quantity).toBe("1");
    expect(pakketNaarRegels(pp, 0)[0].quantity).toBe("1");
  });

  it("scenario 45 — pakket zonder prijs geeft € 0,00 en geen fout", () => {
    const gratis = { ...pakket, priceFrom: "0" };
    expect(pakketNaarRegels(gratis, 45)[0].lineTotal).toBe("0.00");
  });

  it("pakket zonder inbegrepen geeft geen lege subregels", () => {
    // Geen `inbegrepen`-sleutel en niet `[]`: het scherm hoeft dan geen uitklapper te tonen
    // die niets bevat.
    expect(pakketNaarRegels({ ...pakket, includes: [] }, 45)[0].details).toEqual({ packageId: 2 });
  });
});

describe("btw", () => {
  it("geen btw geeft géén regel, niet een regel van nul", () => {
    // Het verschil dat ertoe doet: `null` betekent "er hoort hier niets te staan".
    // Zou dit `{btw: "0.00"}` geven, dan komt er "waarvan € 0,00 btw" op de offerte en dat
    // suggereert dat er gerekend is.
    expect(btwUitBedrag("370.00", "geen")).toBeNull();
  });

  it("9% wordt uit het bedrag gehaald, niet erbij opgeteld", () => {
    // De klassieke fout is 370 × 0,09 = € 33,30. Dat is de btw over een bedrag exclusief.
    // Correct bij een inclusief bedrag: 370 × 9/109 = € 30,55.
    expect(btwUitBedrag("370.00", "laag")).toEqual({
      percentage: 9,
      btw: "30.55",
      exclusief: "339.45",
    });
  });

  it("21% idem", () => {
    expect(btwUitBedrag("121.00", "hoog")).toEqual({
      percentage: 21,
      btw: "21.00",
      exclusief: "100.00",
    });
  });

  it("btw plus exclusief is weer precies het totaal", () => {
    // Zonder deze eigenschap telt de offerte niet op en belt de klant.
    for (const bedrag of ["370.00", "0.01", "12.35", "562.50", "99999.99"]) {
      for (const tarief of ["laag", "hoog"] as const) {
        const r = btwUitBedrag(bedrag, tarief)!;
        expect(naarCenten(r.btw) + naarCenten(r.exclusief)).toBe(naarCenten(bedrag));
      }
    }
  });

  it("werkt op een negatief totaal", () => {
    // Scenario 64: korting groter dan de rest.
    const r = btwUitBedrag("-25.00", "laag")!;
    expect(naarCenten(r.btw) + naarCenten(r.exclusief)).toBe(-2500);
  });

  it("het tarief op de boeking wint van de standaard", () => {
    expect(geldendTarief("hoog", "geen")).toBe("hoog");
  });

  it("geen keuze op de boeking volgt de instelling", () => {
    expect(geldendTarief(null, "laag")).toBe("laag");
  });

  it("onzin valt terug op geen btw, niet op een tarief", () => {
    // De veilige kant: liever geen btw-regel dan een bedrag dat er niet hoort te staan.
    expect(geldendTarief("9%", null)).toBe("geen");
    expect(geldendTarief(null, "hoogg")).toBe("geen");
  });
});

describe("centen heen en terug", () => {
  it("verliest niets bij bedragen met twee decimalen", () => {
    for (const b of ["0.01", "12.35", "99999.99", "-25.00", "0.00"]) {
      expect(naarBedrag(naarCenten(b))).toBe(b);
    }
  });

  it("rondt een derde decimaal af op hele centen", () => {
    expect(naarBedrag(naarCenten("0.335"))).toBe("0.34");
    expect(naarBedrag(naarCenten("0.334"))).toBe("0.33");
  });
});


/*
 * De btw-uitsplitsing. Aanleiding: een sweet table bevat eten (9%) én verhuur, materiaal en
 * opbouw (21%), en de Belastingdienst staat niet toe dat het 21%-deel meelift op het lage
 * tarief. Eén tarief over het totaal is dus geen vereenvoudiging maar een fout.
 */
describe("btw per tarief", () => {
  it("splitst een offerte met twee tarieven", () => {
    const uit = btwPerTarief([
      { lineTotal: "440.00", vatRate: "laag" },
      { lineTotal: "60.00", vatRate: "hoog" },
    ]);
    expect(uit).toHaveLength(2);
    // 440 incl. 9% → 440 × 9/109 = 36,33
    expect(uit[0]).toMatchObject({ percentage: 9, over: "440.00", excl: "403.67", btw: "36.33" });
    // 60 incl. 21% → 60 × 21/121 = 10,41
    expect(uit[1]).toMatchObject({ percentage: 21, over: "60.00", excl: "49.59", btw: "10.41" });
  });

  it("telt per tarief op vóór het rekenen, niet per regel", () => {
    // Twee regels van 10,01 onder hetzelfde tarief: per regel afronden en optellen kan een cent
    // afwijken van het tarief los op het subtotaal toepassen.
    const samen = btwPerTarief([
      { lineTotal: "10.01", vatRate: "laag" },
      { lineTotal: "10.01", vatRate: "laag" },
    ]);
    const inEen = btwPerTarief([{ lineTotal: "20.02", vatRate: "laag" }]);
    expect(samen[0].btw).toBe(inEen[0].btw);
  });

  it("een regel zonder tarief levert geen btw-regel op", () => {
    expect(btwPerTarief([{ lineTotal: "295.00" }])).toEqual([]);
    expect(btwPerTarief([{ lineTotal: "295.00", vatRate: "geen" }])).toEqual([]);
  });

  it("houdt een vaste volgorde, laag vóór hoog", () => {
    const uit = btwPerTarief([
      { lineTotal: "60.00", vatRate: "hoog" },
      { lineTotal: "440.00", vatRate: "laag" },
    ]);
    expect(uit.map((b) => b.percentage)).toEqual([9, 21]);
  });
});

describe("pakket met een btw-verdeling", () => {
  const perPersoon = {
    id: 7,
    name: "Luxe Buffet",
    priceFrom: "25.00",
    priceUnit: "per_persoon",
    includes: ["Eten en drinken", "Servies en bestek"],
    vatSplitLow: "22.00",
    vatSplitHigh: "3.00",
  };

  it("wordt twee regels, elk met zijn eigen tarief", () => {
    const regels = pakketNaarRegels(perPersoon, 20);
    expect(regels).toHaveLength(2);
    expect(regels[0]).toMatchObject({ unitPrice: "22.00", lineTotal: "440.00", vatRate: "laag" });
    expect(regels[1]).toMatchObject({ unitPrice: "3.00", lineTotal: "60.00", vatRate: "hoog" });
  });

  it("de twee regels samen zijn de pakketprijs maal het aantal", () => {
    const regels = pakketNaarRegels(perPersoon, 20);
    expect(boekingTotaal(regels)).toBe("500.00");
    expect(boekingTotaal(regels)).toBe(regelTotaal(20, perPersoon.priceFrom));
  });

  it("markeert welk deel elke regel is, zodat nog eens toevoegen beide verhoogt", () => {
    const regels = pakketNaarRegels(perPersoon, 20);
    expect(regels.map((r) => r.details.deel)).toEqual(["laag", "hoog"]);
  });

  it("zet de inhoud alleen onder het eten-deel", () => {
    const regels = pakketNaarRegels(perPersoon, 20);
    expect(regels[0].details.inbegrepen).toHaveLength(2);
    expect(regels[1].details.inbegrepen).toBeUndefined();
  });

  it("een deel van nul levert geen regel op", () => {
    const regels = pakketNaarRegels({ ...perPersoon, vatSplitHigh: "0" }, 20);
    expect(regels).toHaveLength(1);
    expect(regels[0].vatRate).toBe("laag");
  });

  it("zonder verdeling blijft het één regel met het pakket-tarief", () => {
    const regels = pakketNaarRegels(
      { ...perPersoon, vatSplitLow: null, vatSplitHigh: null, vatRate: "laag" },
      20,
    );
    expect(regels).toHaveLength(1);
    expect(regels[0]).toMatchObject({ unitPrice: "25.00", lineTotal: "500.00", vatRate: "laag" });
  });
});
