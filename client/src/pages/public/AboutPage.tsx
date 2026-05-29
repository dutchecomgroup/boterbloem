import { usePublicSettings } from "../../hooks/usePublicSettings";
import { BotanicalPattern } from "../../components/ornaments/BotanicalPattern";
import { BotanicalCorner } from "../../components/ornaments/BotanicalCorner";
import { GoldDivider } from "../../components/ornaments/GoldDivider";
import { FloralFrame } from "../../components/ornaments/FloralFrame";
import { imageSrc, demoImageForSlug } from "../../lib/demoGallery";

const DEFAULT_ABOUT_BODY = `Vanuit liefde voor het ambacht maken wij elke taart met de hand. Ieder ontwerp wordt persoonlijk afgestemd op jouw verhaal — van de eerste schets tot het laatste suikerbloemetje.

We werken met seizoensgebonden ingrediënten en geven de voorkeur aan natuurlijke smaken. Geen twee taarten zijn hetzelfde, omdat geen twee verhalen hetzelfde zijn.`;

export default function AboutPage() {
  const { data } = usePublicSettings();
  const about = data?.about;
  const portraitSrc = about?.imageFilename
    ? imageSrc({ filename: about.imageFilename })
    : demoImageForSlug("bruidstaarten");

  const body = about?.body || DEFAULT_ABOUT_BODY;

  return (
    <>
      <section className="relative bg-section-warm overflow-hidden pt-20 pb-20">
        <BotanicalPattern opacity={0.05} />
        <FloralFrame className="absolute -top-12 -right-12" size={300} color="text-gold/20" />
        <FloralFrame className="absolute -bottom-12 -left-12 rotate-180" size={260} color="text-blush" />

        <div className="container-tight relative">
          <div className="grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-20 items-center">
            <div>
              <div className="tag mb-3">Over</div>
              <h1 className="text-5xl md:text-6xl">{about?.heading ?? "Atelier"}</h1>
              <div className="script-accent text-5xl md:text-6xl -mt-1">Boterbloem</div>
              <div className="mt-6 mb-6"><GoldDivider className="!mx-0 !max-w-[180px]" /></div>
              <div className="text-lg text-charcoal/80 leading-relaxed whitespace-pre-line">
                {body}
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-6 -z-10 bg-gradient-to-br from-gold/10 via-transparent to-blush/30 rounded-[2rem] blur-2xl" />
              {portraitSrc && (
                <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-gold/20">
                  <img src={portraitSrc} alt="Atelier Boterbloem" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="pointer-events-none absolute inset-3 border border-cream/30 rounded-xl" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Pull quote */}
      <section className="relative bg-section-butter py-20 overflow-hidden">
        <BotanicalPattern opacity={0.05} />
        <BotanicalCorner position="tl" size={140} color="text-gold/30" />
        <BotanicalCorner position="br" size={140} color="text-gold/30" />
        <div className="container-narrow relative text-center">
          <div className="script-accent text-5xl md:text-6xl leading-none mb-6">
            "Smaak, ambacht, en een glimlach in elke beet."
          </div>
          <div className="tag">— Atelier Boterbloem</div>
          <div className="mt-10"><GoldDivider /></div>
        </div>
      </section>
    </>
  );
}
