import { useEffect, useState } from "react";
import type { GalleryItem } from "@shared/schema";
import { imageSrc } from "../lib/images";

/**
 * Eén vlak dat rustig door een setje foto's kruisvervaagt.
 *
 * Gebruikt op de galerijtegels (de foto's van de events eronder) en in `FotoTrio` op de
 * aanbod-pagina. Eén foto per gelegenheid laat de bezoeker maar één feest zien; door te
 * wisselen toont dezelfde tegel er een stuk of tien.
 *
 * `vertraging` zet tegels naast elkaar uit de pas. Zonder dat slaan alle tegels op een pagina
 * tegelijk om, en dat leest als een storing in plaats van als beweging.
 */
export function FotoCyclus({
  fotos,
  vertraging = 0,
  periode = 5000,
  alt,
  className = "",
}: {
  fotos: GalleryItem[];
  vertraging?: number;
  periode?: number;
  /** Overschrijft de alt-tekst van de foto's. Voor een sfeertegel die één ding voorstelt. */
  alt?: string;
  /**
   * Klassen voor het **omhulsel**, niet voor de foto's zelf. Bedoeld voor dingen als een
   * hover-zoom.
   *
   * Dat onderscheid is geen muggenzifterij: stonden ze op de foto's, dan botst de
   * `transition-transform` van een hover-zoom met de `transition-opacity` van het
   * kruisvervagen. `transition-property` kan er maar één zijn, dus de laatste wint en de
   * andere overgang gebeurt **instant** — dat is precies waarom de foto's leken te flitsen in
   * plaats van over te vloeien.
   */
  className?: string;
}) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (fotos.length < 2) return;
    // Wie beweging heeft uitgezet krijgt een stilstaande foto. Een tegel die uit zichzelf
    // wisselt is precies waar die instelling voor bedoeld is.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    let interval: ReturnType<typeof setInterval>;
    const start = setTimeout(() => {
      interval = setInterval(() => setIdx((i) => i + 1), periode);
    }, vertraging);

    return () => {
      clearTimeout(start);
      clearInterval(interval);
    };
  }, [fotos.length, periode, vertraging]);

  if (fotos.length === 0) return null;

  const actief = idx % fotos.length;
  const vorige = (actief - 1 + fotos.length) % fotos.length;

  return (
    // Het omhulsel draagt de klassen van de aanroeper (de hover-zoom); de foto's erbinnen
    // dragen alleen hun eigen kruisvervaging. Zo staan de twee overgangen op verschillende
    // elementen en kunnen ze elkaar niet uitschakelen.
    <div className={`absolute inset-0 ${className}`}>
      {fotos.map((foto, i) => (
        <img
          key={foto.id}
          src={imageSrc(foto)}
          alt={i === 0 ? (alt ?? foto.altText ?? "") : ""}
          // De actieve, de vorige en de volgende hebben we snel nodig; de rest heeft nog
          // minstens een paar tellen voordat hij aan de beurt is.
          loading={i <= 2 ? "eager" : "lazy"}
          decoding="async"
          /*
            Kruisvervagen zonder dip.

            Eerst vervaagde de oude foto tegelijk met het invaden van de nieuwe. Halverwege
            staan ze dan allebei op 50%, en omdat opaciteit niet optelt tot dekkend, schemert de
            achtergrond erdoorheen.

            Nu blijft de vorige foto er **volledig** onder staan terwijl de nieuwe eroverheen
            komt. Er is dus op geen enkel moment iets doorzichtigs in beeld. De foto die
            dáárvóór lag mag stil wegvallen: die ligt onder twee dekkende lagen.
          */
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1400ms] ease-in-out ${
            i === actief
              ? "z-20 opacity-100"
              : i === vorige
                ? "z-10 opacity-100"
                : "z-0 opacity-0"
          }`}
        />
      ))}
    </div>
  );
}
