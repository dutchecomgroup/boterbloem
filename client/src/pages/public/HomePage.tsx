import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import { usePublicSettings } from "../../hooks/usePublicSettings";
import type { GalleryItem, GalleryCategory, Review, Package } from "@shared/schema";
import { ArrowRight, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { imageSrc } from "../../lib/images";
import { BotanicalPattern } from "../../components/ornaments/BotanicalPattern";
import { FloralFrame } from "../../components/ornaments/FloralFrame";
import { SierDivider } from "../../components/ornaments/SierDivider";
import { BotanicalCorner } from "../../components/ornaments/BotanicalCorner";
import { SectionDivider } from "../../components/ornaments/SectionDivider";
import { Reveal } from "../../components/Reveal";
import { SplitText } from "../../components/SplitText";
import { Marquee } from "../../components/Marquee";
import { MagneticLink } from "../../components/MagneticLink";
import { MouseSpotlight } from "../../components/MouseSpotlight";
import { type ProcessStep } from "../../components/ProcessStory";
import { KORTE_STAPPEN, stapFotos } from "../../content/werkwijze";
import type { GalerijAntwoord } from "../../lib/galerij";
import { ProcessStrip } from "../../components/ProcessStrip";

function HeroCarousel({ items }: { items: GalleryItem[] }) {
  const [idx, setIdx] = useState(0);
  const count = items.length;

  useEffect(() => {
    if (count < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % count), 4500);
    return () => clearInterval(t);
  }, [count]);

  if (count === 0) {
    return (
      <div className="relative aspect-[4/3] sm:aspect-[4/5] rounded-2xl bg-gradient-to-br from-blush/40 via-linen to-boterbloem/50 shadow-xl border border-sage/10 flex items-center justify-center">
        <div className="text-center px-6">
          <div className="script-accent text-4xl mb-3">Atelier</div>
          <div className="tag">Foto's verschijnen hier zodra ze geüpload zijn</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-[4/3] sm:aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-sage/20 group">
      {items.map((item, i) => (
        <img
          key={item.id}
          src={imageSrc(item)}
          alt={item.altText ?? ""}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1500ms] ease-in-out ${
            i === idx ? "opacity-100" : "opacity-0"
          }`}
          loading={i === 0 ? "eager" : "lazy"}
        />
      ))}
      <div className="pointer-events-none absolute inset-3 border border-linen/30 rounded-xl" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-charcoal/60 to-transparent" />
      {items[idx]?.caption && (
        <div className="absolute bottom-6 left-6 right-20 text-linen text-sm font-medium drop-shadow">
          {items[idx].caption}
        </div>
      )}
      {count > 1 && (
        <div className="absolute bottom-5 right-5 flex items-center gap-1.5">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`Foto ${i + 1}`}
              className={`h-2 rounded-full transition-all ${
                i === idx ? "w-6 bg-linen" : "w-2 bg-linen/40 hover:bg-linen/70"
              }`}
            />
          ))}
        </div>
      )}
      {count > 1 && (
        <>
          <button
            onClick={() => setIdx((i) => (i - 1 + count) % count)}
            className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-linen/80 backdrop-blur text-charcoal hover:bg-linen transition opacity-0 group-hover:opacity-100"
            aria-label="Vorige"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => setIdx((i) => (i + 1) % count)}
            className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-linen/80 backdrop-blur text-charcoal hover:bg-linen transition opacity-0 group-hover:opacity-100"
            aria-label="Volgende"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}
    </div>
  );
}

// Volgorde is niet willekeurig: sweet en grazing tables zijn de hoofdfocus, taarten horen
// erbij maar zijn niet waar de site over gaat. Zie de meeting van 24-08.
const MARQUEE_TAGS = [
  "Sweet tables",
  "Grazing tables",
  "Bruiloften",
  "Babyshowers",
  "Dessertbars",
  "Mini desserts",
  "Macarons",
  "Taarten op maat",
  "Bedrijfsevents",
];

/**
 * Het spotlight-blok toont bij voorkeur de uitgelichte **pakketten** — dat is waar de site
 * over gaat sinds de meeting van 24-08. Zijn er nog geen pakketten actief, dan vallen we
 * terug op de gelegenheden uit de galerij, zodat het blok nooit leeg staat.
 */
interface SpotlightItem {
  key: string; href: string; title: string; body: string;
  img: string | null; cta: string; vanaf?: string;
}



export default function HomePage() {
  const { data: settings } = usePublicSettings();
  const hero = settings?.hero;
  const { data: reviews } = useQuery({
    queryKey: ["public", "reviews"],
    queryFn: () => api.get<Review[]>("/api/public/reviews"),
  });
  const { data: pakketten } = useQuery({
    queryKey: ["public", "packages"],
    queryFn: () => api.get<Package[]>("/api/public/packages"),
  });
  const { data: gallery } = useQuery({
    queryKey: ["public", "gallery"],
    queryFn: () => api.get<GalerijAntwoord>("/api/public/gallery"),
  });

  const items: GalleryItem[] = gallery?.items ?? [];
  const featured = items.filter((i) => i.featured);
  const carouselItems = (featured.length ? featured : items).slice(0, 6);
  const gridFeatured = (featured.length ? featured : items).slice(0, 6);

  // Pakketten eerst; zonder actieve pakketten de gelegenheden uit de galerij.
  const gelegenheden = gallery?.categories ?? [];
  const spotlight: SpotlightItem[] = (pakketten ?? []).filter((p) => p.featured).length
    ? (pakketten ?? []).filter((p) => p.featured).slice(0, 3).map((p, i) => ({
        key: `pakket-${p.id}`,
        href: `/contact?pakket=${p.slug}`,
        title: p.name,
        body: p.tagline ?? p.description ?? "",
        // De gekozen cover, anders een andere foto per kaart. De terugval was `items[0]` voor
        // álle drie, dus drie kaarten naast elkaar met exact hetzelfde beeld — dat leest als
        // een fout, ook al is er alleen een cover niet ingesteld.
        img: (() => {
          const gekozen = p.coverItemId ? items.find((x) => x.id === p.coverItemId) : undefined;
          const terugval = items[i] ?? items[0];
          const foto = gekozen ?? terugval;
          return foto ? imageSrc(foto) : null;
        })(),
        cta: "Vraag aan",
        vanaf: Number(p.priceFrom) > 0
          ? `€ ${Number(p.priceFrom).toFixed(0)}${p.priceUnit === "per_persoon" ? " p.p." : ""}`
          : undefined,
      }))
    : gelegenheden.filter((c) => c.itemCount > 0).slice(0, 3).map((c) => ({
        key: `gelegenheid-${c.id}`,
        href: `/galerij/${c.slug}`,
        title: c.name,
        body: c.description ?? "",
        img: c.cover ? imageSrc(c.cover) : null,
        cta: "Bekijk werk",
      }));

  /**
   * De vijf stappen komen uit `content/werkwijze.ts` — haar eigen tekst, en dezelfde bron als
   * de uitgebreide versie op `/werkwijze`. Hier stond tot 27-08 door ons geschreven tekst met
   * stockfoto's ("Jij geniet van het moment terwijl iedere gast zegt: wow, kijk dat").
   */
  const processSteps: ProcessStep[] = useMemo(() => {
    const fotos = stapFotos(KORTE_STAPPEN, items);
    return KORTE_STAPPEN.map((stap, i) => ({
      n: stap.n,
      title: stap.title,
      body: stap.body,
      imageSrc: fotos[i] ?? "",
    }));
  }, [items]);

  return (
    <>
      {/* ========== HERO ========== */}
      <section className="relative overflow-hidden bg-section-warm">
        <MouseSpotlight />
        <BotanicalPattern opacity={0.05} />
        <FloralFrame className="absolute -top-8 -right-8 md:-top-12 md:-right-12 w-32 sm:w-56 md:w-80 h-32 sm:h-56 md:h-80" color="text-sage/20" />
        <FloralFrame className="absolute -bottom-8 -left-8 md:-bottom-12 md:-left-12 rotate-180 w-24 sm:w-40 md:w-64 h-24 sm:h-40 md:h-64" color="text-blush" />

        <div className="container-tight relative py-10 sm:py-16 md:py-24">
          <div className="grid lg:grid-cols-[1.05fr_1fr] gap-8 sm:gap-12 lg:gap-20 items-center">
            <div className="relative text-center lg:text-left">
              {/* "Patisserie · Op maat" stond hier nog uit de tijd dat taarten de hoofdmoot
                  waren. Sinds de meeting van 24-08 zijn sweet en grazing tables dat, en een
                  grazing table is hartig — dus geen patisserie. Dit is de regel die de klant
                  zelf onder haar woordmerk zette op het huisstijl-moodboard. */}
              <div className="tag mb-4 sm:mb-6">Sweet tables · Grazing tables · Taarten</div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl leading-[1.05]">
                <SplitText
                  text="Atelier"
                  as="span"
                  by="char"
                  stagger={40}
                  className="block"
                />
                <SplitText
                  text="Boterbloem"
                  as="span"
                  by="char"
                  stagger={40}
                  delay={400}
                  className="script-accent text-5xl sm:text-7xl md:text-8xl block leading-none -mt-1 sm:-mt-2"
                />
              </h1>
              <Reveal delay={1200} className="mt-4 mb-4 sm:mt-6 sm:mb-6">
                <SierDivider className="!mx-auto lg:!mx-0 !max-w-[180px]" />
              </Reveal>
              <Reveal delay={1300}>
                <p className="text-base sm:text-lg text-charcoal/75 max-w-xl leading-relaxed mx-auto lg:mx-0">
                  {hero?.tagline ??
                    "Sweet tables en grazing tables voor jouw mooiste momenten. Bruiloften, babyshowers, en alles daartussen."}
                </p>
              </Reveal>
              <Reveal delay={1450} className="mt-6 sm:mt-10 flex flex-wrap gap-3 sm:gap-4 justify-center lg:justify-start">
                <MagneticLink href={hero?.ctaHref ?? "/contact"} className="btn-sage">
                  {hero?.ctaLabel ?? "Vraag offerte aan"}
                </MagneticLink>
                <Link href="/galerij" className="btn-outline">
                  Bekijk de galerij
                </Link>
              </Reveal>
            </div>

            <Reveal delay={500} className="relative max-w-md mx-auto lg:max-w-none w-full">
              <div className="absolute -inset-6 -z-10 bg-gradient-to-br from-sage/10 via-transparent to-blush/20 rounded-[2rem] blur-2xl" />
              <HeroCarousel items={carouselItems} />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ========== MARQUEE ========== */}
      <Marquee items={MARQUEE_TAGS} duration={50} />

      {/* ========== WAT WE MAKEN — de pakketten, hoog op de pagina ==========
           De bezoeker heeft één vraag: "kan zij iets moois maken voor mijn feest,
           en wat kost dat ongeveer?" Dit blok beantwoordt de tweede helft, dus het
           staat direct onder de hero in plaats van op tweederde van de pagina. */}
      <Reveal as="section" className="relative section-y bg-section-sand overflow-hidden">
        <BotanicalPattern opacity={0.04} />
        <div className="container-tight relative">
          <div className="text-center mb-10 sm:mb-16">
            <div className="tag mb-3">Wat we maken</div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl">Sweet &amp; grazing tables</h2>
            <div className="mt-6"><SierDivider /></div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {spotlight.map((s) => (
              <Link
                key={s.key}
                href={s.href}
                className="group rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-xl transition-shadow ring-1 ring-sage/10 block"
              >
                {s.img && (
                  <div className="relative aspect-[5/4] overflow-hidden">
                    <img
                      src={s.img}
                      alt={s.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/40 via-transparent to-transparent" />
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-2xl mb-3 group-hover:text-sage-dark transition-colors">{s.title}</h3>
                  <p className="text-charcoal/70 leading-relaxed text-sm">{s.body}</p>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-sage-dark">
                      {s.cta} <ArrowRight size={14} />
                    </span>
                    {s.vanaf && (
                      <span className="text-sm text-sage-dark whitespace-nowrap">vanaf {s.vanaf}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/aanbod" className="btn-outline">Volledig aanbod</Link>
          </div>
        </div>
      </Reveal>

      <SectionDivider color="fill-linen" variant="scallop" />

      {/* ========== ONS WERK — de foto's, groot ========== */}
      <Reveal as="section" className="relative section-y bg-linen overflow-hidden">
        <BotanicalPattern opacity={0.04} />
        <div className="container-tight relative">
          <div className="flex items-end justify-between mb-8 sm:mb-12">
            <div>
              <div className="tag mb-3">Onze creaties</div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl">Uitgelicht werk</h2>
            </div>
            <Link
              href="/galerij"
              className="hidden md:inline-flex items-center gap-2 text-sm uppercase tracking-widest text-charcoal/60 hover:text-sage-dark"
            >
              Alle creaties <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {gridFeatured.map((item) => (
              <Link
                key={item.id}
                href="/galerij"
                className="group relative aspect-square overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-sage/10"
              >
                <img
                  src={imageSrc(item)}
                  alt={item.altText ?? ""}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                {item.caption && (
                  <div className="absolute bottom-3 left-3 right-3 text-linen text-xs opacity-0 group-hover:opacity-100 transition-opacity drop-shadow">
                    {item.caption}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      </Reveal>

      {/* ========== ZO GAAT HET ==========
           Eén strip in plaats van het scroll-verhaal: dat kostte 260vh voor vier zinnen.
           De uitgebreide versie (`ProcessStory`) past beter op /over. */}
      <ProcessStrip steps={processSteps} />

      <SectionDivider color="fill-sand" variant="wave" flip />

      {/* ========== REVIEWS ========== */}
      {/* Nul gepubliceerde reviews = geen blok. Een leeg reviewblok is slechter dan geen. */}
      {(reviews?.length ?? 0) > 0 && (
      <Reveal as="section" className="relative section-y bg-section-blush overflow-hidden" staggerChildren={0.12}>
        <BotanicalPattern opacity={0.05} />
        <BotanicalCorner position="tl" color="text-sage/30" />
        <BotanicalCorner position="br" color="text-sage/30" />
        <div className="container-tight relative">
          <div className="text-center mb-10 sm:mb-14">
            <div className="tag mb-3">Klanten over ons</div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl">Wat klanten vertellen</h2>
            <div className="mt-6"><SierDivider /></div>
          </div>
          <div className="grid md:grid-cols-3 gap-5 sm:gap-6">
            {(reviews ?? []).filter((r) => r.featured).concat((reviews ?? []).filter((r) => !r.featured)).slice(0, 3).map((t, i) => (
              <Reveal
                key={i}
                delay={i * 100}
                className="card hairline-sage bg-linen/80 backdrop-blur relative flex flex-col"
              >
                <Quote size={32} className="text-sage mb-4" />
                <p className="text-charcoal/80 leading-relaxed text-base sm:text-lg italic flex-1">
                  "{t.body}"
                </p>
                <div className="mt-6 pt-6 border-t border-sage/20">
                  <div className="script-accent text-2xl leading-none mb-1">{t.authorName}</div>
                  {t.eventType && <div className="tag !text-[10px]">{t.eventType}</div>}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Reveal>
      )}

      {/* ========== CTA STRIP ========== */}
      <Reveal as="section" className="relative section-y bg-charcoal text-linen overflow-hidden">
        <BotanicalPattern opacity={0.06} className="text-linen" />
        <div className="container-narrow relative text-center">
          <SierDivider className="!text-sage/60" />
          <div className="script-accent text-3xl sm:text-4xl mt-6 mb-2">Een idee?</div>
          <h2 className="text-linen text-3xl sm:text-4xl md:text-5xl mb-6">Laten we het bespreken</h2>
          <p className="text-linen/70 mb-8 leading-relaxed text-sm sm:text-base">
            Of het nu een bruiloft, verjaardag of een doopfeest is: vertel ons over jouw moment en we ontwerpen iets unieks.
          </p>
          <MagneticLink href="/contact" className="btn-sage">Stuur een bericht</MagneticLink>
          <div className="mt-8 sm:mt-10"><SierDivider className="!text-sage/60" /></div>
        </div>
      </Reveal>

    </>
  );
}
