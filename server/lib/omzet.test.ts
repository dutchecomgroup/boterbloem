import { describe, it, expect } from "vitest";
import {
  maandSleutel, weekSleutel, reeks, sleutelLabel, perBucket, som, vorigePeriode,
} from "./omzet.js";

describe("sleutels", () => {
  it("maand is gewoon de eerste zeven tekens", () => {
    expect(maandSleutel("2026-09-06")).toBe("2026-09");
  });

  it("week volgt ISO 8601 — maandag is de eerste dag", () => {
    // 2026-09-06 is een zondag en hoort dus nog bij de week die op 31 augustus begon.
    expect(weekSleutel("2026-08-31")).toBe(weekSleutel("2026-09-06"));
    expect(weekSleutel("2026-09-07")).not.toBe(weekSleutel("2026-09-06"));
  });

  /*
   * De klassieke valkuil: 1 januari hoort vaak bij de laatste week van het vórige jaar.
   * 2027-01-01 is een vrijdag, dus die week begon op maandag 28 december 2026 — week 53.
   */
  it("een januaridag kan bij het vorige jaar horen", () => {
    expect(weekSleutel("2027-01-01")).toBe("2026-W53");
  });

  it("labels zijn leesbaar", () => {
    expect(sleutelLabel("2026-09")).toBe("sep 2026");
    expect(sleutelLabel("2026-W36")).toBe("week 36 · 2026");
  });
});

describe("reeks", () => {
  it("levert elke maand op, ook de lege", () => {
    expect(reeks("2026-01-01", "2026-04-30", "maand")).toEqual([
      "2026-01", "2026-02", "2026-03", "2026-04",
    ]);
  });

  it("een periode binnen één maand geeft één bucket", () => {
    expect(reeks("2026-03-05", "2026-03-20", "maand")).toEqual(["2026-03"]);
  });

  it("weken lopen over een jaargrens door", () => {
    const r = reeks("2026-12-20", "2027-01-10", "week");
    expect(r).toContain("2026-W53");
    expect(new Set(r).size).toBe(r.length);
  });
});

describe("perBucket", () => {
  const rijen = [
    { datum: "2026-01-15", bedrag: "295.00" },
    { datum: "2026-01-28", bedrag: "150.00" },
    { datum: "2026-03-02", bedrag: "400.00" },
  ];

  it("telt per maand op en houdt de lege maand op nul", () => {
    expect(perBucket(rijen, "2026-01-01", "2026-03-31", "maand")).toEqual([
      { sleutel: "2026-01", label: "jan 2026", bedrag: "445.00" },
      { sleutel: "2026-02", label: "feb 2026", bedrag: "0.00" },
      { sleutel: "2026-03", label: "mrt 2026", bedrag: "400.00" },
    ]);
  });

  it("laat rijen buiten de periode staan", () => {
    const uit = perBucket(rijen, "2026-02-01", "2026-02-28", "maand");
    expect(uit).toEqual([{ sleutel: "2026-02", label: "feb 2026", bedrag: "0.00" }]);
  });

  /*
   * Een boeking zonder feestdatum hoort in geen enkele periode. Hem in de eerste stoppen maakt
   * die maand onverklaarbaar hoog, en dat is precies het getal waar iemand op afgaat.
   */
  it("negeert rijen zonder datum", () => {
    const uit = perBucket([{ datum: null, bedrag: "999.00" }], "2026-01-01", "2026-01-31", "maand");
    expect(uit[0].bedrag).toBe("0.00");
  });
});

describe("som", () => {
  it("telt in centen, niet in floats", () => {
    expect(som(["0.10", "0.20"])).toBe("0.30");
    expect(som([])).toBe("0.00");
  });
});

describe("vorigePeriode", () => {
  it("is even lang en ligt er direct voor", () => {
    expect(vorigePeriode("2026-03-01", "2026-03-31")).toEqual({
      van: "2026-01-29", tot: "2026-02-28",
    });
  });

  it("werkt ook voor één dag", () => {
    expect(vorigePeriode("2026-03-10", "2026-03-10")).toEqual({
      van: "2026-03-09", tot: "2026-03-09",
    });
  });
});
