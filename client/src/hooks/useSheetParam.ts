import { useCallback } from "react";
import { useLocation, useSearch } from "wouter";

/**
 * Welke sheet er open staat, in het webadres: `?boeking=14`, `?aanvraag=7`.
 *
 * Waarom in de URL en niet in `useState`: dan is een boeking te delen ("kijk even naar
 * /admin/agenda?boeking=14"), staat hij in de geschiedenis, en **sluit de terugknop de sheet**
 * in plaats van je van de pagina af te gooien. Dat laatste is het belangrijkste — een sheet die
 * over de agenda heen staat voelt niet als een nieuwe pagina, dus gedraagt de terugknop zich
 * ook zo.
 *
 * `replace` bij het sluiten: openen-en-sluiten hoort geen twee stappen in de geschiedenis
 * achter te laten, anders moet je drie keer terug om echt weg te zijn.
 */
export function useSheetParam(naam: "boeking" | "aanvraag" | "pakket") {
  const zoek = useSearch();
  const [pad, navigeer] = useLocation();

  const ruw = new URLSearchParams(zoek).get(naam);
  const id = ruw !== null && /^\d+$/.test(ruw) ? Number(ruw) : null;
  /**
   * `?pakket=nieuw` — iets aanmaken dat nog geen id heeft.
   *
   * Een boeking en een aanvraag ontstaan elders en hebben altijd al een id; een pakket maak je
   * hier aan. Zonder deze waarde zou "nieuw pakket" als enige scherm terugvallen op `useState`,
   * en dan gedraagt de terugknop zich anders dan bij bewerken -- precies het verschil waar je
   * over struikelt.
   */
  const isNieuw = ruw === "nieuw";

  const openen = useCallback(
    (nieuwId: number) => {
      const p = new URLSearchParams(zoek);
      p.set(naam, String(nieuwId));
      navigeer(`${pad}?${p}`);
    },
    [zoek, pad, naam, navigeer],
  );

  const sluiten = useCallback(() => {
    const p = new URLSearchParams(zoek);
    p.delete(naam);
    const query = p.toString();
    navigeer(query ? `${pad}?${query}` : pad, { replace: true });
  }, [zoek, pad, naam, navigeer]);

  const openenNieuw = useCallback(() => {
    const p = new URLSearchParams(zoek);
    p.set(naam, "nieuw");
    navigeer(`${pad}?${p}`);
  }, [zoek, pad, naam, navigeer]);

  return { id, isNieuw, openen, openenNieuw, sluiten };
}
