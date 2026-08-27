import { useRef } from "react";
import { Link } from "wouter";
import { motion, useScroll, useTransform, type Variants, type MotionValue } from "motion/react";
import type { GalleryItem } from "@shared/schema";
import { imageSrc } from "../../lib/images";
import { usePrefersReducedMotion } from "../../lib/prefersReducedMotion";
import { MagneticLink } from "../MagneticLink";
import { Reveal } from "../Reveal";
import { SierDivider } from "../ornaments/SierDivider";
import { BotanicalPattern } from "../ornaments/BotanicalPattern";
import { FloralFrame } from "../ornaments/FloralFrame";
import { MouseSpotlight } from "../MouseSpotlight";

/**
 * De hero als editoriale collage: de zin groot over de volle breedte, met drie foto's als
 * licht gedraaide kaarten die elk op hun eigen snelheid meescrollen.
 *
 * Verving de nette twee-kolommer met een carrousel in een kader. Die was correct maar
 * onopvallend, en de carrousel wisselde op een timer -- beweging die niemand gevraagd had.
 * Hier is de enige beweging scroll-gebonden: de bezoeker stuurt hem zelf, en wie beweging
 * heeft uitgezet krijgt de kaarten gewoon stil op hun plek.
 *
 * De zin is een ontwerp-element en staat hardgecodeerd, net zoals "Atelier Boterbloem" dat
 * hiervoor was (zie `heroSettingsSchema`): het cursieve "één keer" is typografie, geen
 * instelling. De subregel en de knop komen wél uit de instellingen.
 */

/** De woorden die cursief en in salie gezet worden -- het scharnier van de zin. */
const ACCENT = new Set(["één", "keer"]);
const ZIN = "Voor momenten die je maar één keer beleeft.";

const houder: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055, delayChildren: 0.1 } },
};
const woord: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

/**
 * Woord-voor-woord opbouw, hier lokaal in plaats van via `SplitText`: die rendert één
 * `inline-block`-omhulsel per aanroep, en drie aanroepen naast elkaar (voor het cursieve
 * middenstuk) breken dan als blokken in plaats van per woord. Deze variant zet élk woord los,
 * dus de regel loopt op een smal scherm gewoon door.
 */
function GroteZin() {
  return (
    <motion.h1
      className="font-display tracking-tight text-charcoal leading-[1.04] text-[clamp(2.4rem,7.5vw,6rem)]"
      initial="hidden"
      animate="show"
      variants={houder}
      aria-label={ZIN}
    >
      {ZIN.split(" ").map((w, i) => (
        <motion.span
          key={i}
          variants={woord}
          aria-hidden="true"
          className={`mr-[0.28em] inline-block ${ACCENT.has(w.replace(/[.,]/g, "")) ? "italic text-sage-deep" : ""}`}
        >
          {w}
        </motion.span>
      ))}
    </motion.h1>
  );
}

/**
 * Eén collage-kaart: foto in een wit kader, licht gedraaid.
 *
 * Bewust zónder bijschrift. Dat stond er eerst wel, maar op kaartbreedte kapte elke regel af
 * ("Zomerse citroen, in cou…") en een half woord met puntjes leest als een storing. De
 * bijschriften staan waar ze wél passen: onder de foto's in "Uitgelicht werk".
 */
function Kaart({
  foto,
  y,
  draai,
  className = "",
}: {
  foto: GalleryItem;
  y: MotionValue<number> | 0;
  draai: string;
  className?: string;
}) {
  return (
    <motion.div style={y === 0 ? undefined : { y }} className={`${draai} ${className}`}>
      <div className="relative overflow-hidden rounded-xl bg-linen p-2 shadow-xl ring-1 ring-sage/25 sm:p-2.5">
        <div className="relative aspect-[4/5] overflow-hidden rounded-lg">
          <img
            src={imageSrc(foto)}
            alt={foto.altText ?? ""}
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
            decoding="async"
          />
        </div>
      </div>
    </motion.div>
  );
}

export function HeroCollage({
  fotos,
  tagline,
  ctaLabel,
  ctaHref,
}: {
  /** De eerste drie worden getoond; minder mag ook. */
  fotos: GalleryItem[];
  tagline?: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  const sectieRef = useRef<HTMLElement>(null);
  const rustig = usePrefersReducedMotion();

  // Scroll-gebonden parallax, zelfde patroon als ProcessStory: de voortgang van de sectie
  // door het beeld stuurt de verplaatsing. Drie verschillende snelheden geven de collage
  // diepte; de traagste beweegt het minst en leest daardoor als "achterste".
  const { scrollYProgress } = useScroll({
    target: sectieRef,
    offset: ["start start", "end start"],
  });
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -36]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -84]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -140]);

  const drie = fotos.slice(0, 3);

  return (
    <section ref={sectieRef} className="relative overflow-hidden bg-section-warm">
      <MouseSpotlight />
      <BotanicalPattern opacity={0.05} />
      <FloralFrame className="absolute -top-8 -right-8 h-32 w-32 sm:h-56 sm:w-56 md:-top-12 md:-right-12 md:h-80 md:w-80" color="text-sage/20" />
      <FloralFrame className="absolute -bottom-8 -left-8 h-24 w-24 rotate-180 sm:h-40 sm:w-40 md:-bottom-12 md:-left-12 md:h-64 md:w-64" color="text-blush" />

      <div className="container-tight relative pb-14 pt-10 sm:pb-20 sm:pt-16 md:pt-20">
        <div className="tag mb-5 text-center sm:mb-7 lg:text-left">
          Sweet tables · Grazing tables · Taarten
        </div>

        <div className="text-center lg:max-w-4xl lg:text-left">
          <GroteZin />
        </div>

        <div className="mt-8 grid items-center gap-10 sm:mt-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12">
          <div className="relative z-10 text-center lg:text-left">
            <Reveal delay={700}>
              <SierDivider className="!mx-auto !max-w-[180px] lg:!mx-0" />
            </Reveal>
            <Reveal delay={800}>
              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-charcoal/75 sm:text-lg lg:mx-0">
                {tagline ??
                  "Luxe sweet tables, grazing tables en taarten op maat, met liefde, stijl en oog voor detail."}
              </p>
            </Reveal>
            <Reveal delay={950} className="mt-7 flex flex-wrap justify-center gap-3 sm:gap-4 lg:justify-start">
              <MagneticLink href={ctaHref ?? "/contact"} className="btn-sage">
                {ctaLabel ?? "Offerte aanvragen"}
              </MagneticLink>
              <Link href="/galerij" className="btn-outline">
                Bekijk de galerij
              </Link>
            </Reveal>
          </div>

          {/*
            De collage. Op `lg` staan de kaarten uitgewaaierd met elk hun eigen
            parallax-snelheid; daaronder een statische, licht overlappende rij -- parallax op
            een klein scherm duwt de kaarten alleen maar uit beeld.

            Hoogte staat vast op `lg` zodat de absolute kaarten geen ruimte hoeven te raden.
          */}
          {drie.length > 0 && (
            <Reveal delay={400} className="relative">
              {/* Klein scherm: overlappende rij */}
              <div className="flex items-center justify-center lg:hidden">
                {drie.map((f, i) => (
                  <Kaart
                    key={f.id}
                    foto={f}
                    y={0}
                    draai={i === 0 ? "rotate-[-4deg]" : i === 1 ? "z-10 rotate-[1.5deg]" : "rotate-[4deg]"}
                    className={`${i === 1 ? "-mx-4 -mt-5 w-[38%] sm:-mx-5" : "mt-4 w-[33%]"}`}
                  />
                ))}
              </div>

              {/*
                Breed scherm: dezelfde waaier, maar groter en met parallax.

                Bewust géén absolute posities meer. Die stonden vast op `left`/`right` binnen
                een kolom die met het scherm meeschaalt, en dan valt de rechterkaart eruit
                zodra de kolom smaller wordt dan de posities aannamen -- precies wat er
                gebeurde. Een flexrij met negatieve marges waaiert altijd uit binnen de ruimte
                die er is, hoe breed die ook is.
              */}
              <div className="hidden items-center justify-center lg:flex">
                {drie.map((f, i) => (
                  <Kaart
                    key={f.id}
                    foto={f}
                    y={rustig ? 0 : [y1, y2, y3][i]}
                    draai={i === 0 ? "rotate-[-5deg]" : i === 1 ? "z-10 rotate-[1.5deg]" : "rotate-[5deg]"}
                    className={
                      i === 1
                        ? "-mx-6 w-[42%] xl:-mx-8 xl:w-[44%]"
                        : `w-[37%] xl:w-[38%] ${i === 0 ? "mt-12" : "mt-16"}`
                    }
                  />
                ))}
              </div>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}
