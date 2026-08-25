import { useState } from "react";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { formatCurrency } from "../../../lib/utils";
import { naarCenten } from "../../../lib/boeking";

/**
 * Wat er binnen is, als losse regels.
 *
 * **Waarom regels en geen vinkje.** Het scherm had één selectievakje, *Ontvangen: binnen*, dat
 * hoorde bij de aanbetaling. Daarmee was "de aanbetaling is voldaan" vast te leggen en "de rest
 * ook" niet: een afgeleverde boeking van € 295 bleef voor altijd op openstaand staan. Een klant
 * die in twee of drie keer betaalt is bovendien gewoon normaal, en dan wil je zien wánneer.
 *
 * De aanbetaling ernaast blijft wat hij was: het bedrag dat is **afgesproken** en dat op de
 * offerte staat als "nu te voldoen". Afspraak en ontvangst zijn twee dingen — dat ze eerder
 * hetzelfde veld deelden is precies waar het misging.
 */

export type Betaling = {
  id: number;
  amount: string;
  paidOn: string;
  method: string | null;
  note: string | null;
};

const METHODEN = [
  { waarde: "", label: "Wijze onbekend" },
  { waarde: "overboeking", label: "Overboeking" },
  { waarde: "contant", label: "Contant" },
  { waarde: "tikkie", label: "Tikkie" },
  { waarde: "anders", label: "Anders" },
];

const METHODE_LABEL: Record<string, string> = {
  overboeking: "Overboeking", contant: "Contant", tikkie: "Tikkie", anders: "Anders",
};

export function BetalingenBlok({
  betalingen,
  openstaandBedrag,
  bezig,
  toevoegen,
  verwijderen,
}: {
  betalingen: Betaling[];
  /** Wat er nog open staat — de startwaarde van het bedragveld. */
  openstaandBedrag: string;
  bezig: boolean;
  toevoegen: (b: { amount: string; paidOn: string; method: string | null; note: string | null }) => Promise<unknown>;
  verwijderen: (id: number) => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const vandaag = format(new Date(), "yyyy-MM-dd");

  // Het openstaande bedrag als startwaarde: "de klant heeft de rest betaald" is verreweg het
  // vaakst wat er gebeurt, en dan hoef je alleen op Opslaan te drukken.
  const [form, setForm] = useState({
    amount: openstaandBedrag,
    paidOn: vandaag,
    method: "",
    note: "",
  });

  function openen() {
    setForm({ amount: openstaandBedrag, paidOn: vandaag, method: "", note: "" });
    setFout(null);
    setOpen(true);
  }

  async function opslaan() {
    const centen = naarCenten(form.amount);
    if (centen === 0) {
      setFout("Vul een bedrag in dat niet nul is.");
      return;
    }
    setFout(null);
    try {
      await toevoegen({
        // De server wil de vorm van een `numeric(10,2)`: punt als decimaalteken, geen euroteken.
        // Via centen, zodat "295,-" en "295,00" allebei goed gaan.
        amount: (centen / 100).toFixed(2),
        paidOn: form.paidOn,
        method: form.method || null,
        note: form.note.trim() || null,
      });
      setOpen(false);
    } catch (e) {
      setFout(e instanceof Error ? e.message : "Opslaan is niet gelukt.");
    }
  }

  return (
    <div>
      {betalingen.length > 0 && (
        <ul className="mb-3 divide-y divide-gold/15 rounded-lg border border-gold/25 bg-white/70">
          {betalingen.map((b) => (
            <li key={b.id} className="flex items-center gap-3 px-3 py-2 text-sm">
              <span className="font-medium tabular-nums text-emerald-700">{formatCurrency(b.amount)}</span>
              <span className="text-charcoal/60">
                {format(parseISO(b.paidOn), "d MMM yyyy", { locale: nl })}
              </span>
              {b.method && <span className="text-xs text-charcoal/45">{METHODE_LABEL[b.method] ?? b.method}</span>}
              {b.note && <span className="truncate text-xs text-charcoal/45">· {b.note}</span>}
              <button
                type="button"
                disabled={bezig}
                onClick={() => void verwijderen(b.id)}
                className="ml-auto shrink-0 rounded p-1 text-charcoal/30 transition hover:bg-burgundy/10 hover:text-burgundy disabled:opacity-40"
                aria-label={`Betaling van ${formatCurrency(b.amount)} verwijderen`}
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {!open ? (
        <button type="button" onClick={openen} disabled={bezig}
          className="flex items-center gap-1.5 text-sm text-gold-dark transition hover:underline disabled:opacity-40">
          <Plus size={15} /> Betaling toevoegen
        </button>
      ) : (
        <div className="rounded-lg border border-gold/30 bg-white/70 p-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <label className="block">
              <span className="mb-0.5 block text-[11px] font-medium uppercase tracking-wider text-charcoal/75">Bedrag</span>
              <input className="input !py-1.5" inputMode="decimal" value={form.amount} autoFocus
                onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </label>
            <label className="block">
              <span className="mb-0.5 block text-[11px] font-medium uppercase tracking-wider text-charcoal/75">Datum</span>
              <input className="input !py-1.5" type="date" value={form.paidOn}
                onChange={(e) => setForm({ ...form, paidOn: e.target.value })} />
            </label>
            <label className="block">
              <span className="mb-0.5 block text-[11px] font-medium uppercase tracking-wider text-charcoal/75">Wijze</span>
              <select className="input !py-1.5" value={form.method}
                onChange={(e) => setForm({ ...form, method: e.target.value })}>
                {METHODEN.map((m) => <option key={m.waarde} value={m.waarde}>{m.label}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-0.5 block text-[11px] font-medium uppercase tracking-wider text-charcoal/75">Notitie</span>
              <input className="input !py-1.5" value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </label>
          </div>

          {fout && <p className="mt-2 text-xs text-burgundy">{fout}</p>}

          <div className="mt-3 flex items-center gap-2">
            <button type="button" onClick={() => void opslaan()} disabled={bezig}
              className="btn-gold !px-4 !py-1.5 text-xs disabled:opacity-50">
              {bezig ? <Loader2 size={14} className="animate-spin" /> : "Opslaan"}
            </button>
            <button type="button" onClick={() => setOpen(false)}
              className="text-xs text-charcoal/50 transition hover:text-charcoal">
              Annuleren
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
