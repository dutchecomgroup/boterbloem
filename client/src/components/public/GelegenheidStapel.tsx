import { useRef } from "react";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import type { GalleryItem } from "@shared/schema";
import type { PubliekeGelegenheid } from "../../lib/galerij";
import { usePrefersReducedMotion, useMediaQuery } from "../../lib/prefersReducedMotion";
import { FotoCyclus } from "../FotoCyclus";

/**
 * Het galerij-overzicht als stapel: elke gelegenheid is een volle kaart die blijft plakken
 * terwijl de volgende eroverheen schuift.
 *
 * Verving een raster van drie gelijke tegels. Dat raster behandelde vijf heel verschillende
 * gelegenheden als vijf keer hetzelfde ding; de stapel geeft elk zijn eigen moment, mét de
 * intro-tekst die de klant per gelegenheid schreef en die in het raster nergens paste.
 *
 * **Alleen vanaf `md`.** Op een telefoon staat de foto bóven de tekst, waardoor een kaart
 * hoger wordt dan het scherm -- en een sticky element dat niet in beeld past heeft geen ruimte
 * om te plakken: de volgende kaart schuift er dan overheen terwijl de vorige nog halverwege
 * staat. Precies de knoeiboel die dat oplevert. Onder `md` dus gewoon kaarten onder elkaar.
 *
 * **Puur CSS-sticky, geen scroll-jacking.** Alle kaarten zijn directe kinderen van één
 * ouder en plakken elk op (bijna) dezelfde `top`; de volgende kaart schuift er in de gewone
 * scroll-stroom overheen. Twee dingen zijn daarbij makkelijk fout te doen, en waren dat in
 * een eerdere versie ook:
 *
 * - **Geen wikkel per kaart.** `position: sticky` is begrensd door zijn ouder, en een wikkel
 *   ter grootte van de kaart laat nul ruimte over om te plakken — de stapel wordt dan stil
 *   een gewone rij.
 * - **De voortgang meet de óuder, niet de kaart.** Een vastgeplakte kaart staat stil in het
 *   beeld, dus `useScroll` op de kaart zelf bevriest precies op het moment dat het
 *   diepte-effect zou moeten beginnen. Eén meting op de ouder, in banden per kaart verdeeld,
 *   heeft daar geen last van.
 *
 * **Expliciete `zIndex` en géén opacity.** De bedekte kaart werd eerst ook doorzichtig
 * gemaakt, en een half-doorzichtige kaart in een stapel laat per definitie de kaart eronder
 * zien -- dat las als een renderfout, niet als diepte. En leunen op "latere broer wint" is
 * hier te fragiel: `motion` zet op elke kaart een transform, en dat maakt van elke kaart een
 * eigen stapelcontext. Nu bepaalt de index de volgorde, ondubbelzinnig.
 *
 * Wat er overblijft is één krimp van 4,5%, vanaf de bovenrand, en die staat uit onder
 * `prefers-reduced-motion`.
 */

/** Boven de kaart blijft dit aan lucht over; de trapjes van 14px laten de stapelranden zien. */
const KLEEF_MARGE = 84;

/**
 * De kaarten staan twee aan twee: de tweede van elk paar valt met zijn bovenrand over de
 * onderrand van de eerste. Dat effect ontstond eerst per ongeluk, halverwege het scrollen van
 * de stapel, en bleek er beter uit te zien dan de gelijke tussenruimte die er stond.
 *
 * **Pas vanaf `md`.** Daaronder is een kaart één kolom met de knop onderaan, en dan zou de
 * volgende kaart precies die knop bedekken. In twee kolommen staat de tekst verticaal
 * gecentreerd en valt de overlap in de padding eronder — daar bedekt hij niets.
 *
 * De bovenliggende kaart moet winnen: bij het stapelen doet `zIndex: index` dat, en zonder
 * stapelen wint de latere broer vanzelf omdat er dan geen transform en dus geen eigen
 * stapelcontext op de kaarten zit.
 */
function marge(index: number): string {
  if (index === 0) return "";
  return index % 2 === 1
    ? "mt-5 sm:mt-8 md:-mt-14"   // tweede van het paar: eroverheen
    : "mt-5 sm:mt-8 md:mt-10";   // nieuw paar: gewone lucht
}

function StapelKaart({
  gelegenheid,
  fotos,
  index,
  aantal,
  voortgang,
  rustig,
  stapelen,
}: {
  gelegenheid: PubliekeGelegenheid;
  fotos: GalleryItem[];
  index: number;
  aantal: number;
  voortgang: MotionValue<number>;
  rustig: boolean;
  stapelen: boolean;
}) {
  /**
   * De band van deze kaart in de voortgang van de hele stapel: kaart `i` wordt bedekt
   * ruwweg terwijl de voortgang van `(i+0,2)/n` naar `(i+1)/n` loopt. Benadering, maar een
   * diepte-effect hoeft niet op de pixel — het moet kloppen met wat je ziet gebeuren.
   */
  const van = (index + 0.2) / aantal;
  const tot = (index + 1) / aantal;
  const schaal = useTransform(voortgang, [van, tot], [1, 0.955]);

  const laatste = index === aantal - 1;
  const bewegen = stapelen && !rustig && !laatste;
  /**
   * De foto staat per **paar** op dezelfde kant, en het paar daarna op de andere.
   *
   * Wisselde eerst per kaart, en dat botste met de overlap: de onderste kaart van een paar
   * legde dan zijn witte tekstvlak precies over de foto van de kaart erboven, en sneed die
   * doormidden. Nu ligt op de naad foto op foto en tekstvlak op tekstvlak -- de afbeelding is
   * het overlappende element en er snijdt geen wit vlak meer doorheen.
   */
  const fotoLinks = Math.floor(index / 2) % 2 === 0;

  /**
   * Wordt deze kaart in rust bedekt door de volgende? Alleen de eerste van een paar, en
   * alleen als er nog een kaart achter komt. Die krijgt onderaan extra lucht ter grootte van
   * de overlap, zodat de kaart erboven in leegte landt en niet op de laatste regel of de knop.
   * Zonder dat verschuift het probleem alleen maar: dan snijdt er geen foto meer doorheen,
   * maar verdwijnt de knop eronder.
   */
  const wordtBedekt = index % 2 === 0 && index < aantal - 1;

  return (
    <motion.article
      style={{
        ...(stapelen ? { top: KLEEF_MARGE + index * 14, zIndex: index } : {}),
        // Vanaf de bovenrand krimpen, niet vanuit het midden: anders kruipt de kaart bij het
        // terugschalen omhoog onder de kaart die eroverheen komt, en zie je een spleet.
        ...(bewegen ? { scale: schaal, transformOrigin: "top center" } : {}),
      }}
      className={`${stapelen ? "md:sticky" : ""} ${marge(index)} overflow-hidden rounded-3xl bg-linen shadow-xl ring-1 ring-sage/20 will-change-transform`}
    >
      <div className={`grid md:min-h-[26rem] md:grid-cols-2 ${fotoLinks ? "" : "md:[direction:rtl]"}`}>
        {/* [direction:rtl] draait alleen de kolomvolgorde; de inhoud zet zichzelf terug. */}
        <div className="relative aspect-[16/10] sm:aspect-[2/1] md:aspect-auto md:[direction:ltr]">
          <FotoCyclus
            fotos={fotos}
            alt={gelegenheid.name}
            vertraging={index * 700}
            periode={5600}
          />
        </div>

        <div className={`flex flex-col justify-center p-5 sm:p-8 md:[direction:ltr] lg:p-12 ${wordtBedekt ? "md:pb-24 lg:pb-28" : ""}`}>
          <div className="tag mb-3">
            {gelegenheid.itemCount} {gelegenheid.itemCount === 1 ? "foto" : "foto's"}
          </div>
          <h2 className="font-display text-2xl leading-tight tracking-tight text-charcoal sm:text-3xl lg:text-4xl">
            {gelegenheid.name}
          </h2>
          {gelegenheid.description && (
            <p className="mt-4 max-w-md text-sm leading-relaxed text-charcoal/75 sm:text-base">
              {gelegenheid.description}
            </p>
          )}
          <div className="mt-5 sm:mt-7">
            <Link href={`/galerij/${gelegenheid.slug}`} className="btn-outline">
              Bekijk {gelegenheid.name.toLowerCase()} <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export function GelegenheidStapel({
  gelegenheden,
  tegelFotos,
}: {
  gelegenheden: PubliekeGelegenheid[];
  /** Welke foto's de tegel van een gelegenheid doorloopt — de pagina bepaalt de selectie. */
  tegelFotos: (g: PubliekeGelegenheid) => GalleryItem[];
}) {
  const ouderRef = useRef<HTMLDivElement>(null);
  const rustig = usePrefersReducedMotion();
  const breed = useMediaQuery("(min-width: 768px)");
  // Een stapel van twee is geen stapel, en op een telefoon past een kaart niet in het beeld.
  const stapelen = gelegenheden.length >= 3 && breed;

  const { scrollYProgress } = useScroll({
    target: ouderRef,
    offset: ["start start", "end end"],
  });

  return (
    /* Geen `space-y` hier: die zet margin-top op elk kind behalve het eerste en zou de
       overlap-marge van `marge()` overschrijven, afhankelijk van de volgorde in de bundel. */
    <div ref={ouderRef}>
      {gelegenheden.map((g, i) => (
        <StapelKaart
          key={g.id}
          gelegenheid={g}
          fotos={tegelFotos(g)}
          index={i}
          aantal={gelegenheden.length}
          voortgang={scrollYProgress}
          rustig={rustig}
          stapelen={stapelen}
        />
      ))}
    </div>
  );
}
