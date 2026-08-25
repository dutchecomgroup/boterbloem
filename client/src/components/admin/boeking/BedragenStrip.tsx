import { bedragen } from "../../../lib/boeking";
import { Bedrag } from "../ui/Bedrag";

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
 *
 * Ontvangen komt sinds 25-08 uit `order_payments` en niet meer uit de aanbetaling: anders kon
 * een volledig betaalde boeking nooit op nul uitkomen.
 */
export function BedragenStrip({
  totalPrice,
  ontvangen,
  depositAmount,
}: {
  totalPrice: string | null;
  /** Wat er binnen is: de som van de betaalregels, door de server berekend. */
  ontvangen: string | null;
  /** Wat er is afgesproken als aanbetaling. Alleen om de melding eronder te kunnen tonen. */
  depositAmount: string | null;
}) {
  const b = bedragen(totalPrice, ontvangen, depositAmount);

  // Openstaand is het getal dat je moet zien: goud als er nog wat komt, groen als het rond is,
  // burgundy als er te veel binnen is — dat laatste is een fout die iemand moet rechtzetten.
  const openRol = b.teVeelBetaald ? "negatief" : b.voldaan ? "voldaan" : "openstaand";
  const totaalC = b.openCenten + b.ontvangenCenten;

  return (
    <div className="mb-7 rounded-lg border border-gold/30 bg-gradient-to-br from-butter/25 to-white px-4 py-3.5">
      <div className="grid grid-cols-3 gap-3">
        <Getal label="Totaal">
          <Bedrag waarde={totaalC / 100} />
        </Getal>
        <Getal label="Ontvangen">
          {/* Nul ontvangen is geen prestatie, dus geen groen: dan blijft het rustig zwart. */}
          <Bedrag
            waarde={b.ontvangenCenten / 100}
            rol={b.ontvangenCenten > 0 ? "voldaan" : "neutraal"}
            klassen={b.wachtOpAanbetaling ? "opacity-60" : ""}
          />
        </Getal>
        <Getal label={b.teVeelBetaald ? "Te veel betaald" : b.voldaan ? "Voldaan" : "Openstaand"}>
          <Bedrag waarde={Math.abs(b.openCenten) / 100} rol={openRol} vet />
        </Getal>
      </div>

      {b.wachtOpAanbetaling && (
        <p className="mt-2.5 border-t border-gold/25 pt-2.5 text-xs text-charcoal/70">
          Aanbetaling van <strong className="text-charcoal">{b.aanbetaling}</strong> afgesproken,
          nog niet volledig binnen. Leg hem hieronder vast onder <em>Betaling</em>.
        </p>
      )}
    </div>
  );
}

function Getal({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] font-medium uppercase tracking-wider text-charcoal/75">{label}</div>
      <div className="font-display text-lg leading-tight">{children}</div>
    </div>
  );
}
