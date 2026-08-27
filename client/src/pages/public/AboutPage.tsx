import { usePublicSettings } from "../../hooks/usePublicSettings";
import { BotanicalPattern } from "../../components/ornaments/BotanicalPattern";
import { BotanicalCorner } from "../../components/ornaments/BotanicalCorner";
import { SierDivider } from "../../components/ornaments/SierDivider";
import { FloralFrame } from "../../components/ornaments/FloralFrame";
import { imageSrc } from "../../lib/images";

/** Zichtbaar tot de klant haar eigen tekst invult via het instellingen-scherm. */
const DEFAULT_ABOUT_BODY = `Vanuit liefde voor het ambacht bouwen wij elke tafel met de hand op. Sweet tables, grazing tables en taarten. Ieder ontwerp wordt persoonlijk afgestemd op jouw verhaal, van de eerste schets tot het laatste suikerbloemetje.

We werken met seizoensgebonden ingrediënten en geven de voorkeur aan natuurlijke smaken. Geen twee tafels zijn hetzelfde, omdat geen twee verhalen hetzelfde zijn.`;

export default function AboutPage() {
  const { data } = usePublicSettings();
  const about = data?.about;
  // Geen terugval op een galerijfoto: een taart als portret bij "Over ons" is niet fout maar
  // wel raar, en tot 27-08 stond hier een stockfoto van iemand anders. Geen foto gekozen in het
  // instellingen-scherm betekent nu: geen foto, en het raster valt terug op één kolom.
  const portraitSrc = about?.imageFilename ? imageSrc({ filename: about.imageFilename }) : null;

  const body = about?.body || DEFAULT_ABOUT_BODY;
  const kop = about?.heading || "Atelier";
  const koptNoemtBoterbloem = /boterbloem/i.test(kop);

  return (
    <>
      <section className="relative bg-section-warm overflow-hidden section-y">
        <BotanicalPattern opacity={0.05} />
        <FloralFrame className="absolute -top-8 -right-8 md:-top-12 md:-right-12 w-32 sm:w-56 md:w-72 h-32 sm:h-56 md:h-72" color="text-sage/20" />
        <FloralFrame className="absolute -bottom-8 -left-8 md:-bottom-12 md:-left-12 rotate-180 w-24 sm:w-40 md:w-64 h-24 sm:h-40 md:h-64" color="text-blush" />

        <div className="container-tight relative">
          {/* Zonder portret geen tweede kolom: anders staat de tekst op 60% breedte met een
              leeg vlak ernaast. */}
          <div className={`grid gap-8 sm:gap-12 lg:gap-20 items-center ${portraitSrc ? "lg:grid-cols-[1.1fr_1fr]" : "max-w-3xl"}`}>
            <div>
              <div className="tag mb-3">Over</div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl">{kop}</h1>
              {/* Het sierlijke "Boterbloem" is een ontwerp-accent dat de kop afmaakt. Staat
                  het woord al in de kop uit de instellingen — zoals bij de standaardwaarde
                  "Over Atelier Boterbloem" — dan zou het er twee keer staan. */}
              {!koptNoemtBoterbloem && (
                <div className="script-accent text-4xl sm:text-5xl md:text-6xl -mt-1">Boterbloem</div>
              )}
              <div className="mt-4 mb-4 sm:mt-6 sm:mb-6"><SierDivider className="!mx-0 !max-w-[180px]" /></div>
              <div className="text-base sm:text-lg text-charcoal/80 leading-relaxed whitespace-pre-line">
                {body}
              </div>
            </div>
            {portraitSrc && (
              <div className="relative">
                <div className="absolute -inset-6 -z-10 bg-gradient-to-br from-sage/10 via-transparent to-blush/30 rounded-[2rem] blur-2xl" />
                <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-sage/20">
                  <img src={portraitSrc} alt="Atelier Boterbloem" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="pointer-events-none absolute inset-3 border border-linen/30 rounded-xl" />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Pull quote */}
      <section className="relative bg-section-sand section-y overflow-hidden">
        <BotanicalPattern opacity={0.05} />
        <BotanicalCorner position="tl" color="text-sage/30" />
        <BotanicalCorner position="br" color="text-sage/30" />
        <div className="container-narrow relative text-center">
          <div className="script-accent text-3xl sm:text-5xl md:text-6xl leading-tight mb-6">
            "Smaak, ambacht, en een glimlach in elke beet."
          </div>
          <div className="tag">Atelier Boterbloem</div>
          <div className="mt-8 sm:mt-10"><SierDivider /></div>
        </div>
      </section>
    </>
  );
}
