import { useEffect } from "react";
import Lenis from "lenis";
import { prefersReducedMotion } from "../lib/prefersReducedMotion";

/**
 * De draaiende Lenis-instantie, of `null` als er geen is (beheerpaneel,
 * prefers-reduced-motion). Module-niveau omdat `scrollNaarBoven()` erbij moet zonder dat de
 * instantie door de hele boom doorgegeven hoeft te worden — er is er per definitie maar één.
 */
let actief: Lenis | null = null;

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
    actief = lenis;

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      // Alleen loslaten als dit nog de huidige is: bij een snelle wissel kan er al een
      // nieuwe instantie staan, en die mag deze opruiming niet wissen.
      if (actief === lenis) actief = null;
    };
  }, [enabled]);
}

/**
 * Direct naar de bovenkant, zonder animatie.
 *
 * Moet via Lenis zolang die draait: Lenis houdt zijn eigen scrollwaarde bij en zet een kale
 * `window.scrollTo` in de volgende frame gewoon weer terug. Zonder Lenis is de gewone weg
 * de juiste.
 */
export function scrollNaarBoven() {
  // Allebei, en bewust niet in een if/else. Ze mikken op hetzelfde punt, dus ze kunnen
  // elkaar niet tegenspreken, en zo blijft het werken als `actief` even niet klopt --
  // bij hot reload draait er soms nog een oude instantie die deze module niet meer kent.
  actief?.scrollTo(0, { immediate: true, force: true });
  window.scrollTo(0, 0);
}
