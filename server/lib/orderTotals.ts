/**
 * Het rekenwerk van een boeking: regeltotalen en het totaal eronder.
 *
 * Pure functies, zonder database, zodat ze te testen zijn met echte bedragen in plaats van
 * met een draaiende server. Dat is bewust: dit is de plek waar een fout het duurst is — een
 * offerte met een verkeerd bedrag gaat naar een klant.
 *
 * **Geld is een string, geen getal.** `numeric(10,2)` komt als string uit Postgres, en dat
 * houden we zo. `0.1 + 0.2` is in JavaScript niet `0.3`, en bij bedragen die opgeteld naar
 * een offerte gaan is dat geen theoretisch bezwaar. We rekenen daarom in **centen** en
 * converteren pas op het laatst terug.
 */

import { BTW_TARIEVEN, isBtwTarief, type BtwTarief } from "@shared/schema";

/** `numeric(10,2)` gaat tot 99999999.99, maar dat is geen realistisch bedrag voor één regel. */
export const MAX_BEDRAG = 99_999.99;

export class BedragTeGroot extends Error {
  status = 400;
  constructor(veld: string) {
    super(`${veld} is te groot — maximaal € ${MAX_BEDRAG.toLocaleString("nl-NL")}`);
  }
}

/**
 * "12.35" → 1235 centen. Werkt ook met een komma, want dat typt een mens.
 *
 * Afronden gebeurt hier één keer, op de kleinste eenheid. Doe je dat later, dan telt de
 * afrondingsfout van elke regel op in het totaal.
 */
export function naarCenten(waarde: string | number): number {
  const n = typeof waarde === "number" ? waarde : Number(String(waarde).replace(",", "."));
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

/** 1235 → "12.35" — de vorm die Postgres in een `numeric(10,2)` verwacht. */
export function naarBedrag(centen: number): string {
  return (centen / 100).toFixed(2);
}

/**
 * Regeltotaal = aantal × stuksprijs.
 *
 * Aantallen mogen gebroken zijn (`0.5 × € 200` voor een half pakket), dus het aantal blijft
 * een gewoon getal en alleen de prijs gaat in centen. Het resultaat wordt afgerond op hele
 * centen — dat is wat er op de offerte komt te staan.
 */
export function regelTotaal(quantity: string | number, unitPrice: string | number): string {
  const aantal = typeof quantity === "number" ? quantity : Number(String(quantity).replace(",", "."));
  if (!Number.isFinite(aantal)) return "0.00";

  const prijsCenten = naarCenten(unitPrice);
  if (Math.abs(prijsCenten) > MAX_BEDRAG * 100) throw new BedragTeGroot("Stuksprijs");

  const centen = Math.round(aantal * prijsCenten);
  if (Math.abs(centen) > MAX_BEDRAG * 100) throw new BedragTeGroot("Regeltotaal");

  return naarBedrag(centen);
}

/**
 * Het totaal van een boeking: de som van de **al afgeronde** regeltotalen.
 *
 * Bewust de afgeronde regels optellen en niet opnieuw vanaf aantal × prijs rekenen. Anders
 * kan het totaal een cent afwijken van wat de klant op de offerte bij elkaar optelt, en dat
 * is precies het soort verschil waar iemand over belt.
 */
export function boekingTotaal(regels: Array<{ lineTotal: string | number }>): string {
  const centen = regels.reduce((som, r) => som + naarCenten(r.lineTotal), 0);
  if (Math.abs(centen) > MAX_BEDRAG * 100) throw new BedragTeGroot("Totaal");
  return naarBedrag(centen);
}

/**
 * Wat er nog openstaat. Negatief betekent dat er te veel betaald is — dat mag, en het scherm
 * zegt het erbij.
 */
export function openstaand(totaal: string | number, aanbetaling: string | number): string {
  return naarBedrag(naarCenten(totaal) - naarCenten(aanbetaling));
}

/**
 * De btw die in een bedrag zit.
 *
 * Bedragen zijn **inclusief** btw, dus dit haalt hem eruit en telt hem er niet bij op. Bij 9%
 * is dat `bedrag × 9/109`, niet `bedrag × 0,09` — dat laatste is de klassieke fout en scheelt
 * bij € 370 ruim drie euro.
 *
 * Geeft `null` bij het tarief `geen`. Dat is geen nulwaarde maar een afwezigheid: op de
 * offerte hoort dan géén btw-regel te staan. Een regel met `€ 0,00 btw` suggereert dat er
 * gerekend is en dat het toevallig nul werd.
 */
export function btwUitBedrag(
  bedrag: string | number,
  tarief: BtwTarief,
): { percentage: number; btw: string; exclusief: string } | null {
  const percentage = BTW_TARIEVEN[tarief];
  if (!percentage) return null;

  const totaalCenten = naarCenten(bedrag);
  const btwCenten = Math.round((totaalCenten * percentage) / (100 + percentage));
  return {
    percentage,
    btw: naarBedrag(btwCenten),
    exclusief: naarBedrag(totaalCenten - btwCenten),
  };
}

/**
 * Welk tarief geldt: de keuze op de boeking, en anders de standaard uit de instellingen.
 * Valt terug op `geen` — de veilige kant, want dan verschijnt er geen btw-regel in plaats van
 * een bedrag dat er misschien niet hoort te staan.
 */
export function geldendTarief(
  opBoeking: string | null | undefined,
  standaard: string | null | undefined,
): BtwTarief {
  if (isBtwTarief(opBoeking)) return opBoeking;
  if (isBtwTarief(standaard)) return standaard;
  return "geen";
}

/**
 * "370.00" → "€ 370,00". Voor tijdlijnregels en de offerte, waar een bedrag als tekst in een
 * zin belandt. De klant leest deze regels, dus Nederlandse notatie met een komma.
 */
export function formatBedrag(waarde: string | number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(naarCenten(waarde) / 100);
}

export type PakketRegel = {
  description: string;
  quantity: string;
  unitPrice: string;
  lineTotal: string;
  details: { inbegrepen?: string[]; packageId: number };
};

/**
 * Een pakket wordt **één regel** met het volledige bedrag; wat erin zit komt eronder te staan
 * als subregels.
 *
 * Was eerder één regel per "inbegrepen", elk van € 0,00. Dat leverde bij een pakket met vijf
 * onderdelen zes regels op waarvan er vijf niets kostten — onleesbaar in de tabel, en op de
 * offerte leek het alsof er zes posten waren.
 *
 * Bij een prijs per persoon wordt het aantal het aantal gasten. Zonder dat zou een pakket van
 * € 12,50 p.p. voor 45 gasten als één regel van € 12,50 op de offerte belanden.
 */
export function pakketNaarRegels(
  pakket: { id: number; name: string; priceFrom: string; priceUnit: string; includes: string[] },
  personen: number | null,
  /**
   * Zelf ingevuld aantal, dat wint van de afleiding uit `personen`. Nodig voor het echte
   * geval van twee pakketten naast elkaar: bij tien gasten vijf van het ene en vijf van het
   * andere. Zonder dit zou elk pakket voor alle tien rekenen en het totaal verdubbelen.
   */
  aantalOverride?: number | null,
): PakketRegel[] {
  const perPersoon = pakket.priceUnit === "per_persoon";
  const aantal =
    aantalOverride != null && Number.isFinite(aantalOverride) && aantalOverride > 0
      ? aantalOverride
      : perPersoon
        ? Math.max(1, personen ?? 1)
        : 1;

  return [
    {
      description: pakket.name,
      quantity: String(aantal),
      unitPrice: pakket.priceFrom,
      lineTotal: regelTotaal(aantal, pakket.priceFrom),
      details: {
        // Een momentopname: het pakket mag later veranderen zonder dat de afspraak met déze
        // klant meeverandert.
        ...(pakket.includes.length ? { inbegrepen: [...pakket.includes] } : {}),
        // Waar deze regel vandaan komt — zodat hetzelfde pakket nog eens toevoegen het aantal
        // verhoogt in plaats van een tweede identieke regel neer te zetten.
        packageId: pakket.id,
      },
    },
  ];
}
