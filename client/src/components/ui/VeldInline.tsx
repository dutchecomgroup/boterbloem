import { useEffect, useRef, useState } from "react";
import { Check, AlertCircle, Loader2, Pencil } from "lucide-react";

/**
 * Een veld dat eruitziet als tekst tot je erop klikt.
 *
 * Geen bewerkmodus en geen Opslaan-knop: klikken maakt er een invoerveld van, wegklikken slaat
 * op. Dat is het patroon van Notion en Linear, en het past bij een scherm waar je de hele dag
 * losse dingen in bijstelt — een datum, een aantal, een notitie.
 *
 * **Het risico van opslaan bij `blur` is dat een mislukte opslag ongemerkt voorbijgaat.** Je
 * bent immers al weg. Daarom blijft het veld bij een fout in bewerkstand staan mét de getypte
 * tekst erin en een rode melding ernaast. Wat je typte raak je nooit kwijt aan een netwerkfout.
 *
 * **In rust ziet het er nu uit als een veld, niet als tekst.** "Eruitzien als tekst" was het
 * uitgangspunt, maar op een scherm dat vrijwel volledig uit deze velden bestaat sloeg dat door:
 * in de woorden van de gebruiker *"nu lijkt het net alles overal tekst waar je niks mee kan
 * doen"*. Een lichte pil met een hairline en een potloodje dat bij hover oplicht is genoeg —
 * zonder dat het scherm een formulier wordt.
 */

type Basis = {
  label: string;
  /** De opgeslagen waarde. Komt uit de query-cache, dus na een mutatie vanzelf actueel. */
  waarde: string | number | null | undefined;
  /** Krijgt de nieuwe waarde. Gooit een fout als opslaan mislukt. */
  opslaan: (nieuw: string) => Promise<unknown>;
  /** Wat er staat als het veld leeg is. */
  leegTekst?: string;
  className?: string;
};

type VeldInlineProps = Basis &
  (
    | { type?: "text" | "date" | "time" | "number"; opties?: never; regels?: never }
    | { type: "textarea"; regels?: number; opties?: never }
    | { type: "select"; opties: Array<{ waarde: string; label: string }>; regels?: never }
  );

export function VeldInline({
  label,
  waarde,
  opslaan,
  type = "text",
  opties,
  regels = 3,
  leegTekst = "—",
  className = "",
}: VeldInlineProps) {
  const [bewerkt, setBewerkt] = useState(false);
  const [concept, setConcept] = useState("");
  const [bezig, setBezig] = useState(false);
  const [gelukt, setGelukt] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const veldRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null);

  const opgeslagen = waarde === null || waarde === undefined ? "" : String(waarde);

  useEffect(() => {
    if (bewerkt) veldRef.current?.focus();
  }, [bewerkt]);

  // Het vinkje is een bevestiging, geen blijvende staat: na anderhalve seconde weg, anders
  // staat het scherm vol met vinkjes van een uur geleden.
  useEffect(() => {
    if (!gelukt) return;
    const t = setTimeout(() => setGelukt(false), 1500);
    return () => clearTimeout(t);
  }, [gelukt]);

  function beginnen() {
    setConcept(opgeslagen);
    setFout(null);
    setBewerkt(true);
  }

  async function bevestigen() {
    if (concept === opgeslagen) {
      // Niets veranderd — dan ook geen verzoek en geen vinkje. Wie alleen even keek hoort
      // geen "opgeslagen" te zien.
      setBewerkt(false);
      setFout(null);
      return;
    }

    setBezig(true);
    try {
      await opslaan(concept);
      setBewerkt(false);
      setFout(null);
      setGelukt(true);
    } catch (err) {
      // Bewust in bewerkstand blijven staan: de getypte tekst is het enige exemplaar.
      setFout(err instanceof Error ? err.message : "Opslaan mislukt");
    } finally {
      setBezig(false);
    }
  }

  function afbreken() {
    setBewerkt(false);
    setConcept("");
    setFout(null);
  }

  function bijToets(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      afbreken();
      return;
    }
    // In een tekstvak is Enter een regeleinde; daar slaat Ctrl/⌘+Enter op.
    const opslaanToets = type === "textarea" ? e.key === "Enter" && (e.metaKey || e.ctrlKey) : e.key === "Enter";
    if (opslaanToets) {
      e.preventDefault();
      void bevestigen();
    }
  }

  const veldKlassen =
    "w-full rounded-sm border-0 border-b-2 border-gold bg-white/70 px-2 py-1 text-sm " +
    "text-charcoal outline-none focus:bg-white disabled:opacity-60";

  return (
    <div className={className}>
      <div className="mb-0.5 flex items-center gap-1.5">
        <span className="text-[11px] font-medium uppercase tracking-wider text-charcoal/75">{label}</span>
        {bezig && <Loader2 className="h-3 w-3 animate-spin text-gold-dark" />}
        {gelukt && <Check className="h-3 w-3 text-gold-dark" />}
      </div>

      {bewerkt ? (
        <>
          {type === "textarea" ? (
            <textarea
              ref={veldRef as React.RefObject<HTMLTextAreaElement>}
              className={`${veldKlassen} resize-y leading-relaxed`}
              rows={regels}
              value={concept}
              disabled={bezig}
              onChange={(e) => setConcept(e.target.value)}
              onBlur={() => void bevestigen()}
              onKeyDown={bijToets}
            />
          ) : type === "select" ? (
            <select
              ref={veldRef as React.RefObject<HTMLSelectElement>}
              className={veldKlassen}
              value={concept}
              disabled={bezig}
              onChange={(e) => setConcept(e.target.value)}
              onBlur={() => void bevestigen()}
              onKeyDown={bijToets}
            >
              <option value="">{leegTekst}</option>
              {opties?.map((o) => (
                <option key={o.waarde} value={o.waarde}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              ref={veldRef as React.RefObject<HTMLInputElement>}
              type={type}
              className={veldKlassen}
              value={concept}
              disabled={bezig}
              onChange={(e) => setConcept(e.target.value)}
              onBlur={() => void bevestigen()}
              onKeyDown={bijToets}
            />
          )}

          {fout && (
            <p className="mt-1 flex items-start gap-1 text-xs text-burgundy">
              <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
              <span>
                {fout} — je tekst staat er nog. Probeer opnieuw of druk op Escape.
              </span>
            </p>
          )}
        </>
      ) : (
        <button
          type="button"
          onClick={beginnen}
          title="Klik om te wijzigen"
          // `.veld-pil` staat in index.css: de belofte "hier kun je iets wijzigen" hoort op
          // één plek te staan, zodat elk klikbaar veld in de hub er hetzelfde uitziet.
          className="veld-pil group flex w-full items-start gap-2 px-2 py-1 text-left text-sm
            leading-relaxed text-charcoal"
        >
          {/* `whitespace-pre-wrap`: een adres van drie regels blijft drie regels (scenario 30),
              en `break-words` houdt een lang e-mailadres binnen het paneel (scenario 97).
              `min-w-0` is wat dat laatste in een flexrij daadwerkelijk laat werken. */}
          <span className="min-w-0 flex-1 whitespace-pre-wrap break-words">
            {toonWaarde(opgeslagen, type, opties) || (
              <span className="text-charcoal/55">{leegTekst}</span>
            )}
          </span>
          {/* Altijd zichtbaar, maar zacht: het potloodje moet het veld aanwijzen, niet opeisen.
              `aria-hidden` omdat de knoptekst en de titel het al zeggen. */}
          <Pencil
            aria-hidden
            className="mt-1 h-3 w-3 shrink-0 text-charcoal/25 transition group-hover:text-gold-dark"
          />
        </button>
      )}
    </div>
  );
}

function toonWaarde(
  waarde: string,
  type: string,
  opties?: Array<{ waarde: string; label: string }>,
): string {
  if (!waarde) return "";
  if (type === "select") return opties?.find((o) => o.waarde === waarde)?.label ?? waarde;
  // Datums in Nederlandse notatie tonen maar als `yyyy-mm-dd` bewerken — dat is wat
  // `<input type="date">` verwacht en wat de server opslaat.
  if (type === "date") {
    const [j, m, d] = waarde.split("-");
    return j && m && d ? `${d}-${m}-${j}` : waarde;
  }
  // Postgres geeft een `time` terug als "14:30:00"; de seconden zeggen niemand iets.
  if (type === "time") return waarde.slice(0, 5);
  return waarde;
}
