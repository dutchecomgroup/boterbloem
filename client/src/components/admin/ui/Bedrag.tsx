import { formatCurrency } from "../../../lib/utils";

/**
 * Een geldbedrag met de kleur van zijn betekenis.
 *
 * De kleurtaal kent drie geldrollen en die zijn hier de enige keuzes: **voldaan** is groen,
 * **openstaand** sage-deep, **negatief** burgundy. Dat laatste is te veel betaald of een
 * terugbetaling, en dat hoort op te vallen — het is een fout die iemand rechtzet, geen detail.
 *
 * `tabular-nums` staat er niet voor de sier: zonder dat springen bedragen in een kolom heen en
 * weer zodra een cijfer verandert, en dan is een lijst niet meer te scannen.
 *
 * Een bedrag zonder betekenis is gewoon `charcoal`. Niet elk getal hoeft een kleur — een totaal
 * dat niets vraagt is rustiger in het zwart.
 */

export type BedragRol = "neutraal" | "voldaan" | "openstaand" | "negatief";

const ROL: Record<BedragRol, string> = {
  neutraal: "text-charcoal",
  voldaan: "text-emerald-700",
  // `gold-deep` en niet `gold-dark`: dit is een bedrag dat gelezen wordt, en
  // `gold-dark` haalt de contrasteis voor gewone tekst niet. Zie tailwind.config.ts.
  openstaand: "text-sage-deep",
  negatief: "text-burgundy",
};

/**
 * De rol afleiden uit het bedrag zelf, voor de gewone gevallen: nul is voldaan, negatief is een
 * fout, de rest staat open. Bewust een aparte functie, zodat een scherm die kan overrulen —
 * "€ 0,00 ontvangen" is geen prestatie en hoort niet groen te zijn.
 */
export function rolVanOpenstaand(waarde: string | number): BedragRol {
  const n = Number(waarde);
  if (!Number.isFinite(n)) return "neutraal";
  if (n < 0) return "negatief";
  if (n === 0) return "voldaan";
  return "openstaand";
}

export function Bedrag({
  waarde,
  rol = "neutraal",
  vet,
  klassen = "",
}: {
  waarde: string | number | null | undefined;
  rol?: BedragRol;
  vet?: boolean;
  klassen?: string;
}) {
  return (
    <span className={`tabular-nums ${vet ? "font-medium" : ""} ${ROL[rol]} ${klassen}`}>
      {formatCurrency(waarde ?? 0)}
    </span>
  );
}
