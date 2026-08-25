import { bedragen } from "../../../lib/boeking";

/**
 * De drie getallen direct onder de kop.
 *
 * Staan bovenaan en niet onderaan omdat de eerste vraag bij een boeking bijna altijd *"wat
 * staat er nog open?"* is. `tabular-nums` zodat de cijfers onder elkaar uitlijnen, anders
 * dansen de bedragen bij elke wijziging heen en weer.
 *
 * **Het middelste getal is wat er binnen is, niet wat er is afgesproken.** Het heette
 * "Aanbetaald" en toonde `depositAmount`, ook als die nog niet betaald was — waardoor een
 * boeking van € 295 met een openstaande aanbetaling van € 200 als "openstaand € 95,00" las.
 * Staat de aanbetaling nog open, dan zegt het strookje dat er met zoveel woorden bij.
 */
export function BedragenStrip({
  totalPrice,
  depositAmount,
  depositPaid,
}: {
  totalPrice: string | null;
  depositAmount: string | null;
  depositPaid: boolean;
}) {
  const b = bedragen(totalPrice, depositAmount, depositPaid);

  // Openstaand is het getal dat je moet zien: goud als er nog wat komt, groen als het rond is,
  // burgundy als er te veel binnen is — dat laatste is een fout die iemand moet rechtzetten.
  const openKleur = b.teVeelBetaald
    ? "text-burgundy"
    : b.voldaan
      ? "text-emerald-700"
      : "text-gold-dark";

  return (
    <div className="mb-7 rounded-lg border border-gold/25 bg-white/70 px-4 py-3.5">
      <div className="grid grid-cols-3 gap-3">
        <Getal label="Totaal" waarde={b.totaal} />
        <Getal
          label="Ontvangen"
          waarde={b.ontvangen}
          kleur={b.wachtOpAanbetaling ? "text-charcoal/40" : "text-charcoal"}
        />
        <Getal
          label={b.teVeelBetaald ? "Te veel betaald" : b.voldaan ? "Voldaan" : "Openstaand"}
          waarde={b.teVeelBetaald ? b.openstaand.replace("-", "") : b.openstaand}
          kleur={openKleur}
        />
      </div>

      {b.wachtOpAanbetaling && (
        <p className="mt-2.5 border-t border-gold/15 pt-2.5 text-xs text-charcoal/70">
          Aanbetaling van <strong className="text-charcoal">{b.aanbetaling}</strong> afgesproken,
          nog niet binnen. Zet hem hieronder op <em>Binnen</em> zodra hij betaald is.
        </p>
      )}
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
