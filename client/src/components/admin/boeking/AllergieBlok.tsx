import { AlertTriangle, Check } from "lucide-react";
import { VeldInline } from "../../ui/VeldInline";

/**
 * Allergieën en dieetwensen, vlak onder de bedragen.
 *
 * **Het blok staat er ook als het leeg is.** Dat is de hele reden dat het een eigen blok is:
 * "geen bijzonderheden" is een vaststelling, een leeg vlak is een onbeantwoorde vraag. Bij eten
 * is dat verschil het belangrijkste op dit scherm (scenario 42).
 *
 * Gevuld is dit het enige rode element in de sheet. Dat werkt alleen zolang er verder niets
 * rood is — zodra alles opvalt, valt niets meer op.
 */
export function AllergieBlok({
  allergies,
  opslaan,
}: {
  allergies: string | null;
  opslaan: (nieuw: string) => Promise<unknown>;
}) {
  const heeft = Boolean(allergies?.trim());

  return (
    <div
      className={`mb-7 rounded-r-md border-l-4 py-3 pl-4 pr-3 ${
        heeft ? "border-burgundy bg-burgundy/[0.07]" : "border-gold/40 bg-cream/70"
      }`}
    >
      <div className="mb-1 flex items-center gap-1.5">
        {heeft ? (
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-burgundy" />
        ) : (
          <Check className="h-3.5 w-3.5 shrink-0 text-gold-dark" />
        )}
        <span
          className={`text-[10px] font-medium uppercase tracking-[0.2em] ${
            heeft ? "text-burgundy" : "text-charcoal/75"
          }`}
        >
          Allergieën &amp; dieet
        </span>
      </div>

      {/* Vrij tekstveld, geen keuzelijst: "iets met kleurstoffen" en "halal, plus één veganist"
          passen in geen enkele lijst die je vooraf bedenkt (scenario 44, 47). */}
      <VeldInline
        label=""
        type="textarea"
        regels={2}
        waarde={allergies}
        opslaan={opslaan}
        leegTekst="Geen bijzonderheden — klik om toe te voegen"
        className={heeft ? "[&_button]:text-burgundy" : ""}
      />
    </div>
  );
}
