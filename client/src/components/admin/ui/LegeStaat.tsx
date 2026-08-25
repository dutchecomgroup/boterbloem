import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Wat er staat als er nog niets is.
 *
 * Overal in de hub stond hiervoor `text-charcoal/40` met een half woord erin — "Nog geen
 * klanten", "Geen data". Grijs, en het vertelt je niet of er iets mis is of dat je gewoon nog
 * moet beginnen.
 *
 * Een lege staat is bijna altijd het begin van iets. Daarom een warme cream-ondergrond met een
 * goudkleurig icoon en een regel die zegt wát je nu kunt doen — geen alarm, wel een uitnodiging.
 * Is er wél iets mis (een mislukte zoekopdracht bijvoorbeeld), dan geef je een eigen `hint` mee.
 */

export function LegeStaat({
  icoon: Icoon,
  titel,
  hint,
  actie,
  compact,
}: {
  icoon?: LucideIcon;
  titel: string;
  /** Eén regel: wat je nu kunt doen, of waarom het leeg is. */
  hint?: ReactNode;
  actie?: ReactNode;
  /** Voor een lege staat binnen een sheet of een kleine kaart. */
  compact?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg border border-dashed
        border-gold/30 bg-cream/60 text-center ${compact ? "px-4 py-8" : "px-6 py-14"}`}
    >
      {Icoon && (
        <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gold/15">
          <Icoon size={18} className="text-gold-dark" aria-hidden />
        </span>
      )}
      <p className="font-display text-lg text-charcoal">{titel}</p>
      {hint && <p className="mt-1 max-w-sm text-sm text-charcoal/60">{hint}</p>}
      {actie && <div className="mt-4">{actie}</div>}
    </div>
  );
}
