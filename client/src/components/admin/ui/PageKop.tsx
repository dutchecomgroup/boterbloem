import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * De kop van een beheerscherm.
 *
 * Elke pagina begon met een kale `<h1 className="text-3xl">Klanten</h1>` — veertien keer
 * hetzelfde, zonder enig merk of houvast. Je zag aan een schermafdruk niet welk scherm het was.
 *
 * Nu: een saliestreepje met een `.tag` erboven, de titel, en rechts de plek voor de
 * hoofdactie. Het streepje is het enige dat kleur toevoegt — genoeg om een scherm herkenbaar te
 * maken, te weinig om ergens mee te concurreren.
 *
 * De titel staat in charcoal en niet in salie: op 30 px zou sage-dark net mogen, maar dan
 * verschilt hij van elke andere kop in de hub. Zie de contrastregel in `index.css`.
 */

export function PageKop({
  titel,
  bovenschrift,
  onderschrift,
  icoon: Icoon,
  actie,
}: {
  titel: ReactNode;
  /** Klein saliekleurig kopje erboven — waar je bent. Standaard de titel in hoofdletters. */
  bovenschrift?: string;
  /** Eén regel uitleg eronder. Alleen als het iets toevoegt. */
  onderschrift?: ReactNode;
  icoon?: LucideIcon;
  /** Rechts uitgelijnd: de hoofdactie van dit scherm. */
  actie?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 gap-3">
        {/* Het streepje loopt over de volle hoogte van de kop, inclusief het onderschrift. */}
        <span aria-hidden className="mt-1 w-1 shrink-0 rounded-full bg-sage" />
        <div className="min-w-0">
          {bovenschrift !== "" && (
            <div className="tag mb-1 flex items-center gap-1.5">
              {Icoon && <Icoon size={13} aria-hidden />}
              {bovenschrift ?? (typeof titel === "string" ? titel : "")}
            </div>
          )}
          <h1 className="text-3xl leading-tight">{titel}</h1>
          {onderschrift && (
            <p className="mt-1.5 text-sm text-charcoal/60">{onderschrift}</p>
          )}
        </div>
      </div>
      {actie && <div className="flex shrink-0 flex-wrap items-center gap-2">{actie}</div>}
    </div>
  );
}
