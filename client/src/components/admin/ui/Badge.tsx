import type { ReactNode } from "react";

/**
 * Eén badge voor het hele beheerpaneel.
 *
 * Stond hiervoor als losse `<span className="rounded px-2 py-0.5 text-[10px] uppercase…">` op
 * zes plekken, elke keer net anders. De vorm hoort op één plek te staan; de kleur komt uit de
 * kleurtaal en niet uit de smaak van het scherm.
 *
 * **`toon` is semantisch, geen kleurnaam.** Je kiest wat iets *betekent*, niet hoe het eruitziet.
 * Daardoor blijft "afgehandeld" overal hetzelfde, ook als we later besluiten dat groen te hard is.
 *
 * Voor status van een boeking of aanvraag gebruik je `STATUS_KLEUR` uit `lib/boeking.ts` of
 * `AANVRAAG_KLEUR` uit `lib/aanvraag.ts` en geef je die door als `klassen` — die tabellen zijn
 * de bron voor status, deze component alleen voor de vorm.
 */

export type BadgeToon = "goud" | "groen" | "butter" | "burgundy" | "rustig";

const TOON: Record<BadgeToon, string> = {
  /** Merk, herkomst, iets dat opvalt zonder te alarmeren. */
  goud: "bg-gold/25 text-charcoal",
  /** Voldaan, afgerond, gelukt. */
  groen: "bg-emerald-100 text-emerald-800",
  /** Vraagt aandacht: nieuw, onvolledig, wacht op jou. */
  butter: "bg-butter text-charcoal",
  /** Fout, gevaar, iets dat rechtgezet moet worden. */
  burgundy: "bg-burgundy/10 text-burgundy",
  /** Afgehandeld of uitgeschakeld — aanwezig, maar niet luid. */
  rustig: "bg-charcoal/10 text-charcoal/55",
};

export function Badge({
  children,
  toon = "rustig",
  klassen,
  titel,
}: {
  children: ReactNode;
  toon?: BadgeToon;
  /** Rechtstreekse kleurklassen, voor status uit `STATUS_KLEUR` / `AANVRAAG_KLEUR`. Wint van `toon`. */
  klassen?: string;
  titel?: string;
}) {
  return (
    <span
      title={titel}
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5
        text-[10px] font-medium uppercase tracking-widest ${klassen ?? TOON[toon]}`}
    >
      {children}
    </span>
  );
}
