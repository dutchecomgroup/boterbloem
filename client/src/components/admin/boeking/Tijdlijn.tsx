import { useState } from "react";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";

/**
 * De tijdlijn van één boeking.
 *
 * Beantwoordt vragen die anders alleen in iemands hoofd zitten: *"wanneer is dit bevestigd?"*,
 * *"is de aanbetaling al binnen?"*, *"wanneer kwam die regel erbij?"* (scenario's 85 en 86).
 *
 * **De lege staat zegt erbij waaróm hij leeg is.** Alleen wat ná de invoering gelogd is
 * verschijnt hier; bij een oude boeking staat er dus weinig. Zonder die uitleg denkt iemand dat
 * er iets mist.
 */

export type Gebeurtenis = {
  id: number;
  at: string;
  kind: string;
  summary: string;
  details: Record<string, unknown> | null;
  actor: string | null;
};

/** Alleen de betekenisdragers krijgen een gevulde stip; de rest is een streepje op de lijn. */
const OPVALLEND = new Set(["aangemaakt", "betaling", "status"]);

const KIND_KLEUR: Record<string, string> = {
  aangemaakt: "bg-sage",
  status: "bg-sage-dark",
  betaling: "bg-emerald-600",
  regel: "bg-charcoal/25",
  offerte: "bg-charcoal/25",
  wijziging: "bg-charcoal/25",
};

const EERSTE_AANTAL = 6;

export function Tijdlijn({ gebeurtenissen }: { gebeurtenissen: Gebeurtenis[] }) {
  const [allesTonen, setAllesTonen] = useState(false);

  if (gebeurtenissen.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-sage/25 bg-linen/60 px-3 py-4 text-sm text-charcoal/70">
        Nog geen gebeurtenissen. De tijdlijn vult zich vanaf nu — wijzigingen van vóór deze
        versie zijn niet vastgelegd.
      </p>
    );
  }

  const zichtbaar = allesTonen ? gebeurtenissen : gebeurtenissen.slice(0, EERSTE_AANTAL);
  const rest = gebeurtenissen.length - zichtbaar.length;

  return (
    <div>
      <ol className="relative space-y-0">
        {zichtbaar.map((g, i) => (
          <li key={g.id} className="relative flex gap-3 pb-3 last:pb-0">
            {/* De verbindingslijn stopt bij de laatste stip — anders hangt hij in het niets. */}
            {i < zichtbaar.length - 1 && (
              // `bg-charcoal/12` stond hier, en 12 zit niet in Tailwinds opacity-schaal — de
              // klasse werd nooit gegenereerd, dus de verbindingslijn was er simpelweg niet.
              <span className="absolute left-[3px] top-2 h-full w-px bg-sage/30" aria-hidden />
            )}
            <span
              className={`relative z-10 mt-1.5 h-[7px] w-[7px] shrink-0 rounded-full ${
                KIND_KLEUR[g.kind] ?? "bg-charcoal/25"
              } ${OPVALLEND.has(g.kind) ? "" : "opacity-70"}`}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p
                className={`break-words text-sm leading-snug ${
                  OPVALLEND.has(g.kind) ? "text-charcoal" : "text-charcoal/80"
                }`}
              >
                {g.summary}
              </p>
              <p className="text-[11px] text-charcoal/60">
                {format(parseISO(g.at), "d MMM yyyy HH:mm", { locale: nl })}
                {g.actor && ` · ${g.actor}`}
              </p>
            </div>
          </li>
        ))}
      </ol>

      {rest > 0 && (
        <button
          type="button"
          onClick={() => setAllesTonen(true)}
          className="mt-2 text-xs text-sage-dark underline-offset-2 hover:underline"
        >
          Nog {rest} {rest === 1 ? "gebeurtenis" : "gebeurtenissen"} tonen
        </button>
      )}
    </div>
  );
}
