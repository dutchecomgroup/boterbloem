import { useEffect, useState } from "react";

/**
 * Staat de pagina nog bovenaan, of is er al gescrold?
 *
 * Hiermee kan de kopbalk boven aan de pagina **onzichtbaar** blijven en pas een eigen vlak
 * krijgen zodra er inhoud onder hem door schuift.
 *
 * **Waarom dat nodig is.** De balk had altijd zijn eigen linen-achtergrond, terwijl de sectie
 * eronder per pagina een andere kleur heeft: warm op de homepage, blush op de galerij, zand op
 * de contactpagina. Dat gaf boven aan elke pagina een lichte streep waar twee vlakken tegen
 * elkaar aan kwamen. Eén vaste kleur kan dat niet oplossen -- er is er geen die overal klopt --
 * dus heeft de balk boven aan de pagina helemaal geen vlak meer.
 *
 * De drempel is bewust een paar pixels en geen 0: met soepel scrollen (Lenis) tikt de positie
 * anders bij de geringste beweging heen en weer tussen aan en uit.
 */
export function useGescrolld(drempel = 8): boolean {
  const [gescrold, setGescrold] = useState(false);

  useEffect(() => {
    const kijk = () => setGescrold(window.scrollY > drempel);
    kijk(); // ook goed staan bij een herladen halverwege de pagina
    window.addEventListener("scroll", kijk, { passive: true });
    return () => window.removeEventListener("scroll", kijk);
  }, [drempel]);

  return gescrold;
}
