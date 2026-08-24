import { bedragen } from "../../../lib/boeking";

/**
 * De drie getallen direct onder de kop.
 *
 * Staan bovenaan en niet onderaan omdat de eerste vraag bij een boeking bijna altijd *"wat
 * staat er nog open?"* is. `tabular-nums` zodat de cijfers onder elkaar uitlijnen — anders
 * dansen de bedragen bij elke wijziging heen en weer.
 */
export function BedragenStrip({
  totalPrice,
  depositAmount,
}: {
  totalPrice: string | null;
  depositAmount: string | null;
}) {
  const b = bedragen(totalPrice, depositAmount);

  // Openstaand is het getal dat je moet zien: goud als er nog wat komt, groen als het rond is,
  // burgundy als er te veel binnen is — dat laatste is een fout die iemand moet rechtzetten.
  const openKleur = b.teVeelBetaald
    ? "text-burgundy"
    : b.voldaan
      ? "text-emerald-700"
      : "text-gold-dark";

  return (
    <div className="mb-7 grid grid-cols-3 gap-3 rounded-lg border border-gold/25 bg-white/70 px-4 py-3.5">
      <Getal label="Totaal" waarde={b.totaal} />
      <Getal label="Aanbetaald" waarde={b.aanbetaald} />
      <Getal
        label={b.teVeelBetaald ? "Te veel betaald" : b.voldaan ? "Voldaan" : "Openstaand"}
        waarde={b.teVeelBetaald ? b.openstaand.replace("-", "") : b.openstaand}
        kleur={openKleur}
      />
    </div>
  );
}

function Getal({ label, waarde, kleur = "text-charcoal" }: { label: string; waarde: string; kleur?: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] font-medium uppercase tracking-wider text-charcoal/75">{label}</div>
      <div className={`font-display text-lg leading-tight tabular-nums ${kleur}`}>{waarde}</div>
    </div>
  );
}
