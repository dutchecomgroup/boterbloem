/**
 * Wat elk boekingsscherm nodig heeft: statuslabels, kleuren en het rekenwerk voor de bedragen.
 *
 * Stond hiervoor in tweevoud in `AgendaPage` en `OrdersPage`. Met de sheet erbij zouden het er
 * drie worden, en dan gaan ze onvermijdelijk uit de pas lopen — precies waar een gebruiker over
 * struikelt ("waarom is bevestigd hier goud en daar grijs?").
 */

export const STATUSSEN = [
  "aanvraag",
  "bevestigd",
  "in_productie",
  "klaar",
  "afgeleverd",
  "geannuleerd",
] as const;

export type BoekingStatus = (typeof STATUSSEN)[number];

export const STATUS_LABEL: Record<string, string> = {
  aanvraag: "Aanvraag",
  bevestigd: "Bevestigd",
  in_productie: "In productie",
  klaar: "Klaar",
  afgeleverd: "Afgeleverd",
  geannuleerd: "Geannuleerd",
};

export const STATUS_KLEUR: Record<string, string> = {
  aanvraag: "bg-charcoal/10 text-charcoal/70",
  bevestigd: "bg-gold/25 text-gold-dark",
  in_productie: "bg-butter text-charcoal",
  klaar: "bg-emerald-100 text-emerald-800",
  afgeleverd: "bg-charcoal/5 text-charcoal/40",
  geannuleerd: "bg-burgundy/10 text-burgundy line-through",
};

export const LEVERING_LABEL: Record<string, string> = {
  afhalen: "Afhalen",
  bezorgen: "Bezorgen",
};

/* ---------------------------------------------------------------------------
 * Bedragen
 *
 * Dezelfde regel als op de server: rekenen in centen. Het scherm laat het openstaande bedrag
 * live meelopen terwijl je typt, dus het rekent hier opnieuw — en dan moet het hetzelfde
 * antwoord geven als `server/lib/orderTotals.ts`, anders springt het bedrag bij het opslaan.
 * ------------------------------------------------------------------------- */

export function naarCenten(waarde: string | number | null | undefined): number {
  if (waarde === null || waarde === undefined || waarde === "") return 0;
  const n = typeof waarde === "number" ? waarde : Number(String(waarde).replace(",", "."));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

export function centenNaarTekst(centen: number): string {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(centen / 100);
}

/** Regeltotaal zoals de server het berekent — voor de live meerekening tijdens het typen. */
export function regelTotaalCenten(aantal: string | number, stuksprijs: string | number): number {
  const n = typeof aantal === "number" ? aantal : Number(String(aantal).replace(",", "."));
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * naarCenten(stuksprijs));
}

/**
 * Wat een pakket zou opleveren, vóórdat je op de knop drukt.
 *
 * Spiegelt `pakketNaarRegels` op de server. Bewust hier herhaald en niet via een extra
 * endpoint: dit rekent mee terwijl je aan het aantal personen zit te draaien, en een
 * heen-en-weertje per toetsaanslag maakt dat traag. Het is pure rekenkunde — aantal × prijs —
 * en de server heeft er tests op; wijkt het ooit af, dan wint de server want die slaat op.
 */
export function pakketVoorbeeld(
  pakket: { priceFrom: string; priceUnit: string; includes: string[] },
  aantal: number,
): { totaalCenten: number; subregels: number; perPersoon: boolean } {
  return {
    perPersoon: pakket.priceUnit === "per_persoon",
    totaalCenten: regelTotaalCenten(aantal, pakket.priceFrom),
    // Eén regel, met wat erin zit als subregels eronder.
    subregels: pakket.includes?.length ?? 0,
  };
}

/**
 * Het aantal waarmee een pakket standaard binnenkomt: het aantal gasten bij een prijs per
 * persoon, anders één. Alleen een startwaarde — je kunt hem overschrijven, want twee pakketten
 * naast elkaar voor tien gasten is vijf en vijf, niet tien en tien.
 */
export function standaardAantal(pakket: { priceUnit: string }, personen: number | null): number {
  return pakket.priceUnit === "per_persoon" ? Math.max(1, personen ?? 1) : 1;
}

/**
 * De drie getallen bovenaan de sheet. Openstaand mag negatief zijn: te veel betaald is een
 * echte situatie en het scherm hoort hem te benoemen, niet af te ronden naar nul.
 *
 * **`betaald` hoort erbij.** `depositAmount` is wat er is *afgesproken*, niet wat er binnen is;
 * `depositPaid` zegt dat laatste. Zonder dat onderscheid las een boeking van € 295 met een nog
 * niet betaalde aanbetaling van € 200 als "openstaand € 95,00", terwijl er niets ontvangen was.
 */
export function bedragen(totaal: string | null, aanbetaling: string | null, betaald: boolean) {
  const totaalC = naarCenten(totaal);
  const afgesprokenC = naarCenten(aanbetaling);
  const ontvangenC = betaald ? afgesprokenC : 0;
  const openC = totaalC - ontvangenC;
  return {
    totaal: centenNaarTekst(totaalC),
    /** Wat er is afgesproken, betaald of niet. */
    aanbetaling: centenNaarTekst(afgesprokenC),
    /** Wat er daadwerkelijk binnen is. */
    ontvangen: centenNaarTekst(ontvangenC),
    openstaand: centenNaarTekst(openC),
    openCenten: openC,
    /** Er is een aanbetaling afgesproken die nog niet binnen is. */
    wachtOpAanbetaling: afgesprokenC > 0 && !betaald,
    voldaan: openC === 0 && totaalC !== 0,
    teVeelBetaald: openC < 0,
  };
}
