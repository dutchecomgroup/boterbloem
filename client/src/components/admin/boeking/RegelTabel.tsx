import { useState } from "react";
import { Plus, Trash2, ChevronUp, ChevronDown, ChevronRight, X } from "lucide-react";
import { centenNaarTekst, naarCenten, regelTotaalCenten } from "../../../lib/boeking";

/**
 * De regels van een boeking, met inline toevoegen (W3).
 *
 * Bedragen worden **op de server** berekend en opgeslagen; wat hier gerekend wordt is puur om
 * mee te laten lopen tijdens het typen. Zodra de server antwoordt komt zijn waarde terug via
 * de query-cache. Dat betekent dat `regelTotaalCenten` hier hetzelfde moet doen als
 * `regelTotaal` daar, anders springt het bedrag bij het opslaan.
 *
 * **Herordenen stuurt de volledige lijst met ids**, geen `sortOrder ± 1`. Dat laatste zat er
 * eerder in het galerijscherm en ging stuk zodra de nummering gaten of duplicaten had — een
 * aanname die na de eerste verwijdering al niet meer klopt.
 */

export type Regel = {
  id: number;
  description: string;
  quantity: string;
  unitPrice: string;
  lineTotal: string;
  /** Wat er in deze regel zit — bij een pakket: waar het uit bestaat. */
  details: { inbegrepen?: string[] } | null;
  /** Btw-tarief van déze regel. `null` = volg de boeking. */
  vatRate?: string | null;
};

type Props = {
  regels: Regel[];
  totalPrice: string;
  bezig?: boolean;
  toevoegen: (r: { description: string; quantity: string; unitPrice: string }) => Promise<unknown>;
  wijzigen: (id: number, velden: Partial<Regel>) => Promise<unknown>;
  verwijderen: (id: number) => Promise<unknown>;
  herordenen: (ids: number[]) => Promise<unknown>;
};

export function RegelTabel({
  regels,
  totalPrice,
  bezig,
  toevoegen,
  wijzigen,
  verwijderen,
  herordenen,
}: Props) {
  const [nieuwOpen, setNieuwOpen] = useState(false);

  function verplaats(index: number, richting: -1 | 1) {
    const doel = index + richting;
    if (doel < 0 || doel >= regels.length) return;
    const ids = regels.map((r) => r.id);
    [ids[index], ids[doel]] = [ids[doel], ids[index]];
    void herordenen(ids);
  }

  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h3 className="tag">Regels</h3>
        {!nieuwOpen && (
          <button
            type="button"
            onClick={() => setNieuwOpen(true)}
            className="inline-flex items-center gap-1 rounded-full border border-gold/50 px-3 py-1 text-xs text-gold-dark transition hover:bg-gold/10"
          >
            <Plus className="h-3 w-3" /> Regel
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-md border border-gold/25 bg-white">
        {regels.length === 0 && !nieuwOpen && (
          // Scenario 63: geen regels is een geldige toestand, geen fout.
          <p className="px-3 py-6 text-center text-sm text-charcoal/60">
            Nog geen regels. Het totaal is € 0,00.
          </p>
        )}

        {regels.map((r, i) => (
          <RegelRij
            key={r.id}
            regel={r}
            eerste={i === 0}
            laatste={i === regels.length - 1}
            bezig={bezig}
            omhoog={() => verplaats(i, -1)}
            omlaag={() => verplaats(i, 1)}
            wijzigen={(velden) => wijzigen(r.id, velden)}
            verwijderen={() => verwijderen(r.id)}
          />
        ))}

        {nieuwOpen && (
          <NieuweRegel
            annuleren={() => setNieuwOpen(false)}
            opslaan={async (r) => {
              await toevoegen(r);
              // Open laten: wie één regel toevoegt, voegt er meestal meer toe.
            }}
          />
        )}

        <div className="flex items-center justify-between border-t-2 border-charcoal/15 bg-cream/60 px-3 py-2.5">
          <span className="text-xs font-medium uppercase tracking-wider text-charcoal/75">Totaal</span>
          <span className="font-display text-lg tabular-nums text-charcoal">
            {centenNaarTekst(naarCenten(totalPrice))}
          </span>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function RegelRij({
  regel,
  eerste,
  laatste,
  bezig,
  omhoog,
  omlaag,
  wijzigen,
  verwijderen,
}: {
  regel: Regel;
  eerste: boolean;
  laatste: boolean;
  bezig?: boolean;
  omhoog: () => void;
  omlaag: () => void;
  wijzigen: (velden: Partial<Regel>) => Promise<unknown>;
  verwijderen: () => Promise<unknown>;
}) {
  // Een regel van € 0,00 is geen fout maar een vermelding — "bezorging: gratis voor een vaste
  // klant" (scenario 57). Lichter tonen, niet verbergen.
  const isVermelding = naarCenten(regel.lineTotal) === 0;
  const isKorting = naarCenten(regel.lineTotal) < 0;

  const inbegrepen = regel.details?.inbegrepen ?? [];
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-charcoal/[0.07] last:border-b-0">
      <div className="group flex items-center gap-2 px-2 py-1.5 hover:bg-cream/50">
        <div className="flex shrink-0 flex-col opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
          <button
            type="button"
            onClick={omhoog}
            disabled={eerste || bezig}
            aria-label="Regel omhoog"
            className="rounded p-0.5 text-charcoal/55 hover:text-charcoal disabled:opacity-25"
          >
            <ChevronUp className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={omlaag}
            disabled={laatste || bezig}
            aria-label="Regel omlaag"
            className="rounded p-0.5 text-charcoal/55 hover:text-charcoal disabled:opacity-25"
          >
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-1">
          <CelTekst
            waarde={regel.description}
            opslaan={(v) => wijzigen({ description: v })}
            className={`min-w-0 text-sm ${isVermelding ? "text-charcoal/70" : "text-charcoal"}`}
          />
          {/* Wat er in een pakket zit staat ingeklapt: de regeltabel gaat over bedragen, en
              vijf onderdelen eronder duwen het volgende bedrag uit beeld. */}
          {inbegrepen.length > 0 && (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              className="inline-flex shrink-0 items-center gap-0.5 rounded px-1 py-0.5 text-[11px] text-charcoal/65 transition hover:bg-white hover:text-charcoal"
            >
              {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              {inbegrepen.length}
            </button>
          )}
        </div>

        <CelGetal
          waarde={kortAantal(regel.quantity)}
          opslaan={(v) => wijzigen({ quantity: v })}
          breedte="w-14"
          label="Aantal"
        />
        <CelGetal
          waarde={regel.unitPrice}
          opslaan={(v) => wijzigen({ unitPrice: v })}
          breedte="w-20"
          label="Stuksprijs"
        />

        {/*
          Btw per regel, want btw wordt over een bedrag gerekend en het bedrag staat hier. Eén
          offerte kan een grazing table (9%) en styling met glaswerk (21%) naast elkaar
          bevatten; één tarief over het hele totaal is dan gewoon fout.

          Het tarief komt mee uit het pakket of product waaruit de regel ontstond; hier pas je
          het aan als deze ene regel afwijkt. Leeg betekent dat er geen btw over dit bedrag
          gerekend wordt — de veilige kant, want er verschijnt dan geen bedrag op de offerte dat
          er misschien niet hoort te staan.
        */}
        <select
          value={regel.vatRate ?? ""}
          onChange={(e) => void wijzigen({ vatRate: e.target.value || null })}
          disabled={bezig}
          aria-label={`Btw voor "${regel.description}"`}
          title="Btw-tarief van deze regel"
          className={`w-16 shrink-0 rounded border border-transparent bg-transparent px-1 py-0.5 text-xs tabular-nums hover:border-charcoal/15 focus:border-gold focus:outline-none ${
            regel.vatRate ? "text-charcoal/70" : "text-charcoal/35"
          }`}
        >
          <option value="">geen</option>
          <option value="laag">9%</option>
          <option value="hoog">21%</option>
        </select>

        <span
          className={`w-24 shrink-0 text-right text-sm tabular-nums ${
            isKorting ? "text-burgundy" : isVermelding ? "text-charcoal/60" : "text-charcoal"
          }`}
        >
          {centenNaarTekst(naarCenten(regel.lineTotal))}
        </span>

        <button
          type="button"
          onClick={() => {
            // Eén pakket is één regel, dus verwijderen haalt het geheel weg — inclusief wat
            // erin zat. Bij meer dan een paar onderdelen zeggen we dat erbij.
            const vraag =
              inbegrepen.length > 0
                ? `"${regel.description}" verwijderen? De ${inbegrepen.length} onderdelen eronder gaan mee.`
                : null;
            if (vraag && !confirm(vraag)) return;
            void verwijderen();
          }}
          disabled={bezig}
          aria-label={`Regel "${regel.description}" verwijderen`}
          className="shrink-0 rounded p-1 text-charcoal/55 opacity-0 transition hover:bg-burgundy/10 hover:text-burgundy group-hover:opacity-100 focus:opacity-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {open && inbegrepen.length > 0 && (
        <ul className="bg-cream/40 px-2 pb-2 pl-12 text-xs text-charcoal/75">
          {inbegrepen.map((r, i) => (
            <li key={i} className="flex gap-2 py-0.5">
              <span className="text-gold-dark" aria-hidden>
                ·
              </span>
              <span className="break-words">{r}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** "50.00" → "50" — twee decimalen bij een aantal zeggen niemand iets. "0.50" blijft "0,5". */
function kortAantal(q: string): string {
  const n = Number(q);
  if (!Number.isFinite(n)) return q;
  return String(n).replace(".", ",");
}

/* -------------------------------------------------------------------------- */

function CelTekst({
  waarde,
  opslaan,
  className = "",
}: {
  waarde: string;
  opslaan: (v: string) => Promise<unknown>;
  className?: string;
}) {
  const [concept, setConcept] = useState<string | null>(null);

  return concept === null ? (
    <button
      type="button"
      onClick={() => setConcept(waarde)}
      className={`truncate rounded px-1 py-0.5 text-left hover:bg-white ${className}`}
      title={waarde}
    >
      {waarde}
    </button>
  ) : (
    <input
      autoFocus
      value={concept}
      onChange={(e) => setConcept(e.target.value)}
      onBlur={async () => {
        if (concept !== waarde && concept.trim()) await opslaan(concept);
        setConcept(null);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") setConcept(null);
        if (e.key === "Enter") e.currentTarget.blur();
      }}
      className={`rounded border-b-2 border-gold bg-white px-1 py-0.5 outline-none ${className}`}
    />
  );
}

function CelGetal({
  waarde,
  opslaan,
  breedte,
  label,
}: {
  waarde: string;
  opslaan: (v: string) => Promise<unknown>;
  breedte: string;
  label: string;
}) {
  const [concept, setConcept] = useState<string | null>(null);

  return concept === null ? (
    <button
      type="button"
      onClick={() => setConcept(waarde)}
      aria-label={label}
      className={`${breedte} shrink-0 rounded px-1 py-0.5 text-right text-sm tabular-nums text-charcoal/85 hover:bg-white`}
    >
      {waarde.replace(".", ",")}
    </button>
  ) : (
    <input
      autoFocus
      inputMode="decimal"
      aria-label={label}
      value={concept}
      onChange={(e) => setConcept(e.target.value)}
      onBlur={async () => {
        if (concept !== waarde) await opslaan(concept);
        setConcept(null);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") setConcept(null);
        if (e.key === "Enter") e.currentTarget.blur();
      }}
      className={`${breedte} shrink-0 rounded border-b-2 border-gold bg-white px-1 py-0.5 text-right text-sm tabular-nums outline-none`}
    />
  );
}

/* -------------------------------------------------------------------------- */

/** W3 — de invoerregel onder de tabel. Het regeltotaal rekent live mee tijdens het typen. */
function NieuweRegel({
  opslaan,
  annuleren,
}: {
  opslaan: (r: { description: string; quantity: string; unitPrice: string }) => Promise<unknown>;
  annuleren: () => void;
}) {
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  const voorbeeld = regelTotaalCenten(quantity, unitPrice);
  const kanOpslaan = description.trim().length > 0 && !bezig;

  async function bewaren() {
    if (!kanOpslaan) return;
    setBezig(true);
    setFout(null);
    try {
      await opslaan({ description: description.trim(), quantity, unitPrice: unitPrice || "0" });
      setDescription("");
      setQuantity("1");
      setUnitPrice("");
    } catch (err) {
      // De server weigert bijvoorbeeld een bedrag boven € 99.999,99 (scenario 62). Die melding
      // is voor een mens geschreven, dus tonen we hem zoals hij is.
      setFout(err instanceof Error ? err.message : "Toevoegen mislukt");
    } finally {
      setBezig(false);
    }
  }

  return (
    <div className="border-b border-charcoal/[0.07] bg-cream/60 px-3 py-2.5">
      <div className="flex items-center gap-2">
        <input
          autoFocus
          placeholder="Omschrijving"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void bewaren()}
          className="min-w-0 flex-1 rounded border border-charcoal/15 bg-white px-2 py-1 text-sm outline-none focus:border-gold"
        />
        <input
          inputMode="decimal"
          aria-label="Aantal"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void bewaren()}
          className="w-14 shrink-0 rounded border border-charcoal/15 bg-white px-2 py-1 text-right text-sm tabular-nums outline-none focus:border-gold"
        />
        <input
          inputMode="decimal"
          aria-label="Stuksprijs"
          placeholder="0,00"
          value={unitPrice}
          onChange={(e) => setUnitPrice(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void bewaren()}
          className="w-20 shrink-0 rounded border border-charcoal/15 bg-white px-2 py-1 text-right text-sm tabular-nums outline-none focus:border-gold"
        />
        <span className="w-24 shrink-0 text-right text-sm tabular-nums text-charcoal/75">
          {centenNaarTekst(voorbeeld)}
        </span>
        <button
          type="button"
          onClick={annuleren}
          aria-label="Annuleren"
          className="shrink-0 rounded p-1 text-charcoal/55 hover:text-charcoal"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-xs text-burgundy">{fout}</p>
        <button
          type="button"
          onClick={() => void bewaren()}
          disabled={!kanOpslaan}
          className="shrink-0 rounded-full bg-gold px-4 py-1 text-xs uppercase tracking-widest text-cream transition hover:bg-gold-dark disabled:opacity-40"
        >
          Toevoegen
        </button>
      </div>
    </div>
  );
}
