import { useEffect } from "react";
import Lenis from "lenis";
import { prefersReducedMotion } from "../lib/prefersReducedMotion";

/**
 * Soepel scrollen via Lenis. Uit bij prefers-reduced-motion.
 *
 * `enabled` bestaat omdat Lenis het scrollwiel document-breed afvangt en omzet in
 * paginascroll. Een genest scrollgebied (een lijst met `overflow-y-auto`) krijgt het event
 * daardoor nooit en scrollt niet meer. Op het beheerpaneel — waar zulke lijsten zitten en
 * waar soepel scrollen niets toevoegt — zetten we hem daarom uit.
 *
 * Heb je op de publieke site tóch een genest scrollgebied nodig, zet dan
 * `data-lenis-prevent` op dat element.
 */
export function useLenis(enabled = true) {
  useEffect(() => {
    if (!enabled || prefersReducedMotion()) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      lerp: 0.1,
    });

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, [enabled]);
}
