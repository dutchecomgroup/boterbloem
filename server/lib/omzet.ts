/**
 * Het rekenwerk van de omzetpagina: perioden, buckets en optellingen.
 *
 * Pure functies zonder database, om dezelfde reden als `orderTotals.ts`: dit zijn de cijfers
 * die naar de boekhouder gaan, en die wil je met echte bedragen kunnen natrekken.
 *
 * **Omzet telt op de datum van het feest**, niet op de dag dat het geld binnenkwam. Dat is de
 * afspraak (25-08) en het sluit aan op het factuurstelsel: het werk is geleverd, dus de omzet
 * is verdiend, ook als de klant pas in de volgende maand betaalt. Wat er wél binnenkwam staat
 * er los naast als kaspositie -- dat zijn twee vragen, en ze horen twee antwoorden te hebben.
 *
 * Datums zijn hier **tekst** (`YYYY-MM-DD`), net als in de database. Ze door een `Date` halen
 * om ze daarna weer als tekst te gebruiken levert alleen tijdzonefouten op: `2026-01-01` wordt
 * in een westelijke zone zomaar `2025-12-31`.
 */

import { naarBedrag, naarCenten } from "./orderTotals.js";

export type Groep = "maand" | "week";

/** "2026-09-06" → "2026-09". Puur tekst, dus geen tijdzone die eraan kan trekken. */
export function maandSleutel(iso: string): string {
  return iso.slice(0, 7);
}

/**
 * "2026-09-06" → "2026-W36", volgens ISO 8601: een week begint op maandag en week 1 is de week
 * met de eerste donderdag erin.
 *
 * In UTC gerekend. De datum heeft geen tijd, dus elke lokale interpretatie is een aanname, en
 * rond middernacht schuift die een dag op.
 */
export function weekSleutel(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  // Naar de donderdag van deze week: dan bepaalt het jaar van die donderdag het weeknummer,
  // en dat is precies wat ISO 8601 zegt. Zonder die stap valt 1 januari in het verkeerde jaar.
  const dag = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dag + 3);
  const jaar = d.getUTCFullYear();
  const eersteDonderdag = new Date(Date.UTC(jaar, 0, 4));
  const offset = (eersteDonderdag.getUTCDay() + 6) % 7;
  eersteDonderdag.setUTCDate(eersteDonderdag.getUTCDate() - offset + 3);
  const week = 1 + Math.round((d.getTime() - eersteDonderdag.getTime()) / (7 * 86400000));
  return `${jaar}-W${String(week).padStart(2, "0")}`;
}

export function sleutelVan(iso: string, groep: Groep): string {
  return groep === "week" ? weekSleutel(iso) : maandSleutel(iso);
}

/**
 * Alle buckets tussen twee datums, ook de lege.
 *
 * De lege horen erbij: een maand zonder omzet is informatie, en een grafiek die hem overslaat
 * suggereert dat er niets gemeten is in plaats van dat er niets verdiend is.
 */
export function reeks(van: string, tot: string, groep: Groep): string[] {
  const uit: string[] = [];
  const eind = new Date(`${tot}T00:00:00Z`);
  const cursor = new Date(`${van}T00:00:00Z`);
  if (Number.isNaN(cursor.getTime()) || Number.isNaN(eind.getTime())) return uit;

  let vorige = "";
  // Per dag lopen en de sleutel afleiden. Trager dan per maand opschuiven, maar het kan niet
  // misgaan bij een maand met 28 dagen of een week die over een jaargrens valt.
  while (cursor <= eind) {
    const iso = cursor.toISOString().slice(0, 10);
    const s = sleutelVan(iso, groep);
    if (s !== vorige) {
      uit.push(s);
      vorige = s;
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return uit;
}

/** "2026-09" → "sep 2026" · "2026-W36" → "week 36 · 2026". Voor de as van de grafiek. */
export function sleutelLabel(sleutel: string): string {
  if (sleutel.includes("W")) {
    const [jaar, week] = sleutel.split("-W");
    return `week ${Number(week)} · ${jaar}`;
  }
  const [jaar, maand] = sleutel.split("-");
  const namen = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
  return `${namen[Number(maand) - 1] ?? maand} ${jaar}`;
}

export type Telbaar = { datum: string | null; bedrag: string | number };

/**
 * Bedragen optellen per bucket, met elke bucket uit `reeks` aanwezig.
 *
 * Rijen zonder datum vallen weg: een boeking zonder feestdatum hoort in geen enkele periode
 * thuis, en hem stilzwijgend in de eerste stoppen maakt die maand onverklaarbaar hoog.
 */
export function perBucket(rijen: Telbaar[], van: string, tot: string, groep: Groep) {
  const buckets = new Map<string, number>();
  for (const s of reeks(van, tot, groep)) buckets.set(s, 0);

  for (const r of rijen) {
    if (!r.datum) continue;
    if (r.datum < van || r.datum > tot) continue;
    const s = sleutelVan(r.datum, groep);
    if (!buckets.has(s)) continue;
    buckets.set(s, (buckets.get(s) ?? 0) + naarCenten(r.bedrag));
  }

  return [...buckets].map(([sleutel, centen]) => ({
    sleutel,
    label: sleutelLabel(sleutel),
    bedrag: naarBedrag(centen),
  }));
}

/** Som van een stel bedragen, in centen gerekend zodat er geen cent verdwijnt. */
export function som(bedragen: Array<string | number>): string {
  return naarBedrag(bedragen.reduce((n: number, b) => n + naarCenten(b), 0));
}

/**
 * De periode die even lang is en er direct vóór ligt, om mee te vergelijken.
 *
 * Even lang en niet "dezelfde maand vorig jaar": bij een bedrijf dat een jaar oud is bestaat
 * dat vorige jaar meestal niet, en dan staat er een vergelijking met nul.
 */
export function vorigePeriode(van: string, tot: string): { van: string; tot: string } {
  const v = new Date(`${van}T00:00:00Z`);
  const t = new Date(`${tot}T00:00:00Z`);
  const dagen = Math.round((t.getTime() - v.getTime()) / 86400000) + 1;
  const nieuwTot = new Date(v.getTime() - 86400000);
  const nieuwVan = new Date(nieuwTot.getTime() - (dagen - 1) * 86400000);
  return {
    van: nieuwVan.toISOString().slice(0, 10),
    tot: nieuwTot.toISOString().slice(0, 10),
  };
}
