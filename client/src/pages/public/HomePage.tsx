import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { usePublicSettings } from "../../hooks/usePublicSettings";
import type { GalleryItem, GalleryCategory } from "@shared/schema";
import { ArrowRight, ChevronLeft, ChevronRight, Instagram, Quote } from "lucide-react";
import { DEMO_ITEMS, DEMO_FEATURED, imageSrc, withFallback, demoImageForSlug } from "../../lib/demoGallery";
import { BotanicalPattern } from "../../components/ornaments/BotanicalPattern";
import { FloralFrame } from "../../components/ornaments/FloralFrame";
import { GoldDivider } from "../../components/ornaments/GoldDivider";
import { BotanicalCorner } from "../../components/ornaments/BotanicalCorner";
import { SectionDivider } from "../../components/ornaments/SectionDivider";
import { Reveal } from "../../components/Reveal";
import { SplitText } from "../../components/SplitText";
import { Marquee } from "../../components/Marquee";
import { MagneticLink } from "../../components/MagneticLink";
import { MouseSpotlight } from "../../components/MouseSpotlight";
import { ProcessStory, type ProcessStep } from "../../components/ProcessStory";

interface GalleryResponse {
  items: GalleryItem[];
  categories: GalleryCategory[];
}

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
      <div className="relative aspect-[4/3] sm:aspect-[4/5] rounded-2xl bg-gradient-to-br from-blush/40 via-cream to-butter/50 shadow-xl border border-gold/10 flex items-center justify-center">
        <div className="text-center px-6">
          <div className="script-accent text-4xl mb-3">Atelier</div>
          <div className="tag">Foto's verschijnen hier zodra ze geüpload zijn</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-[4/3] sm:aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-gold/20 group">
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
      <div className="pointer-events-none absolute inset-3 border border-cream/30 rounded-xl" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-charcoal/60 to-transparent" />
      {items[idx]?.caption && (
        <div className="absolute bottom-6 left-6 right-20 text-cream text-sm font-medium drop-shadow">
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
                i === idx ? "w-6 bg-cream" : "w-2 bg-cream/40 hover:bg-cream/70"
              }`}
            />
          ))}
        </div>
      )}
      {count > 1 && (
        <>
          <button
            onClick={() => setIdx((i) => (i - 1 + count) % count)}
            className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-cream/80 backdrop-blur text-charcoal hover:bg-cream transition opacity-0 group-hover:opacity-100"
            aria-label="Vorige"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => setIdx((i) => (i + 1) % count)}
            className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-cream/80 backdrop-blur text-charcoal hover:bg-cream transition opacity-0 group-hover:opacity-100"
            aria-label="Volgende"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}
    </div>
  );
}

const MARQUEE_TAGS = [
  "Bruidstaarten",
  "Mini desserts",
  "Verjaardagstaarten",
  "Doopsuiker",
  "Sweet tables",
  "Macarons",
  "Cupcakes",
  "Babyshowers",
  "Op maat",
];

const SERVICE_PREVIEWS = [
  { slug: "bruidstaarten", title: "Bruidstaarten", body: "Een centrepiece dat het verhaal van jullie dag vertelt — vanaf het ontwerp tot de laatste suikerbloem." },
  { slug: "verjaardagstaarten", title: "Verjaardagstaarten", body: "Persoonlijk, smaakvol en altijd met dat ene detail dat het bijzonder maakt." },
  { slug: "mini-desserts", title: "Mini desserts & cupcakes", body: "Sweet tables, dessertbars en cupcake-arrangementen voor je feest of borrel." },
];

const TESTIMONIALS = [
  {
    quote:
      "Het centrum van onze bruiloft. Esmee dacht écht mee, van de eerste schets tot de laatste suikerbloem.",
    name: "Sanne & Joris",
    occasion: "Bruiloft · juni 2024",
  },
  {
    quote:
      "Een verjaardagstaart die we nooit meer vergeten. Smaak én optisch perfect, tot in elk detail.",
    name: "Femke v.d. Berg",
    occasion: "Verjaardag · 2024",
  },
  {
    quote:
      "Sweet table-styling was écht boven verwachting. Iedere gast maakte foto's voordat ze proefden.",
    name: "Lisa & Maartje",
    occasion: "Jubileum · 2024",
  },
];

export default function HomePage() {
  const { data: settings } = usePublicSettings();
  const hero = settings?.hero;
  const igHandle = settings?.contact?.instagram ?? "https://instagram.com/atelierboterbloem";
  const { data: gallery } = useQuery({
    queryKey: ["public", "gallery"],
    queryFn: () => api.get<GalleryResponse>("/api/public/gallery"),
  });

  const items = withFallback(gallery?.items, DEMO_ITEMS);
  const featured = items.filter((i) => i.featured);
  const carouselItems = (featured.length ? featured : DEMO_FEATURED).slice(0, 6);
  const gridFeatured = (featured.length ? featured : items).slice(0, 6);
  const igItems = items.slice(0, 6);
  const spotlightItem = featured[0] ?? items[0] ?? DEMO_ITEMS[0];

  // Process steps: 4 stappen, gebruik demo-images per categorie
  const processSteps: ProcessStep[] = [
    {
      n: "01",
      title: "Aanvraag",
      body:
        "Vertel ons over jouw moment: type evenement, datum, sfeer en aantal gasten. Wij denken meteen mee.",
      imageSrc: demoImageForSlug("mini-desserts") ?? imageSrc(items[2] ?? DEMO_ITEMS[6]),
    },
    {
      n: "02",
      title: "Ontwerp",
      body:
        "Een persoonlijk gesprek, smaakopties en een handgetekende schets. Niets is gemaakt voor het ontwerp klopt.",
      imageSrc: demoImageForSlug("cupcakes") ?? imageSrc(items[3] ?? DEMO_ITEMS[8]),
    },
    {
      n: "03",
      title: "Bakken",
      body:
        "Met de hand opgebouwd, vers vlak voor jouw dag. Iedere suikerbloem, iedere laag — gemaakt zoals het hoort.",
      imageSrc: demoImageForSlug("bruidstaarten") ?? imageSrc(items[0] ?? DEMO_ITEMS[0]),
    },
    {
      n: "04",
      title: "Levering",
      body:
        "Wij brengen of bouwen op. Jij geniet van het moment terwijl iedere gast zegt: wow, kijk dat.",
      imageSrc: demoImageForSlug("party-setups") ?? imageSrc(items[4] ?? DEMO_ITEMS[10]),
    },
  ];

  return (
    <>
      {/* ========== HERO ========== */}
      <section className="relative overflow-hidden bg-section-warm">
        <MouseSpotlight />
        <BotanicalPattern opacity={0.05} />
        <FloralFrame className="absolute -top-8 -right-8 md:-top-12 md:-right-12 w-32 sm:w-56 md:w-80 h-32 sm:h-56 md:h-80" color="text-gold/20" />
        <FloralFrame className="absolute -bottom-8 -left-8 md:-bottom-12 md:-left-12 rotate-180 w-24 sm:w-40 md:w-64 h-24 sm:h-40 md:h-64" color="text-blush" />

        <div className="container-tight relative py-10 sm:py-16 md:py-24">
          <div className="grid lg:grid-cols-[1.05fr_1fr] gap-8 sm:gap-12 lg:gap-20 items-center">
            <div className="relative text-center lg:text-left">
              <div className="tag mb-4 sm:mb-6">Patisserie · Op maat</div>
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
                <GoldDivider className="!mx-auto lg:!mx-0 !max-w-[180px]" />
              </Reveal>
              <Reveal delay={1300}>
                <p className="text-base sm:text-lg text-charcoal/75 max-w-xl leading-relaxed mx-auto lg:mx-0">
                  {hero?.tagline ??
                    "Handgemaakte taarten voor jouw mooiste momenten — bruiloften, verjaardagen, en alles daartussen."}
                </p>
              </Reveal>
              <Reveal delay={1450} className="mt-6 sm:mt-10 flex flex-wrap gap-3 sm:gap-4 justify-center lg:justify-start">
                <MagneticLink href={hero?.ctaHref ?? "/contact"} className="btn-gold">
                  {hero?.ctaLabel ?? "Vraag offerte aan"}
                </MagneticLink>
                <Link href="/galerij" className="btn-outline">
                  Bekijk de galerij
                </Link>
              </Reveal>
            </div>

            <Reveal delay={500} className="relative max-w-md mx-auto lg:max-w-none w-full">
              <div className="absolute -inset-6 -z-10 bg-gradient-to-br from-gold/10 via-transparent to-blush/20 rounded-[2rem] blur-2xl" />
              <HeroCarousel items={carouselItems} />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ========== MARQUEE ========== */}
      <Marquee items={MARQUEE_TAGS} duration={50} />

      {/* ========== MISSION ========== */}
      <Reveal as="section" className="relative bg-section-blush overflow-hidden section-y">
        <BotanicalPattern opacity={0.06} />
        <BotanicalCorner position="tl" color="text-gold/30" />
        <BotanicalCorner position="br" color="text-gold/30" />
        <div className="container-narrow relative text-center">
          <div className="script-accent text-4xl sm:text-5xl md:text-6xl mb-4 sm:mb-6 leading-none">
            Iedere taart vertelt een verhaal
          </div>
          <p className="text-charcoal/70 max-w-xl mx-auto text-base sm:text-lg leading-relaxed">
            Vanuit liefde voor het ambacht en oog voor detail — wij ontwerpen en bakken zoete creaties die jouw moment compleet maken.
          </p>
          <div className="mt-8 sm:mt-10"><GoldDivider /></div>
        </div>
      </Reveal>

      <SectionDivider color="fill-blush" variant="wave" />

      {/* ========== PROCESS STORY (sticky scroll) ========== */}
      <ProcessStory steps={processSteps} />

      <SectionDivider color="fill-cream" variant="asymmetric" flip />

      {/* ========== EDITORIAL SPOTLIGHT ========== */}
      <Reveal as="section" className="relative section-y bg-section-butter overflow-hidden">
        <BotanicalPattern opacity={0.04} />
        <FloralFrame className="absolute top-0 right-0 w-32 sm:w-48 md:w-64 h-32 sm:h-48 md:h-64 opacity-50" color="text-gold/20" />
        <div className="container-tight relative">
          <div className="grid lg:grid-cols-12 gap-8 sm:gap-12 items-center">
            <div className="lg:col-span-7 relative">
              <div className="relative aspect-[5/4] sm:aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-gold/20">
                <img
                  src={imageSrc(spotlightItem)}
                  alt={spotlightItem.altText ?? "Featured creation"}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="pointer-events-none absolute inset-3 border border-cream/30 rounded-xl" />
                <div className="absolute top-4 left-4 bg-cream/90 backdrop-blur px-3 py-1 rounded-full">
                  <span className="tag !text-[10px]">Uitgelicht</span>
                </div>
              </div>
            </div>
            <div className="lg:col-span-5 text-center lg:text-left">
              <div className="tag mb-3">Featured creation</div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl leading-tight mb-2">
                Een verhaal in suiker
              </h2>
              <div className="script-accent text-3xl sm:text-4xl leading-none mb-6">
                — La Rosaline
              </div>
              <div className="mb-6"><GoldDivider className="!mx-auto lg:!mx-0 !max-w-[160px]" /></div>
              <p className="text-charcoal/75 leading-relaxed mb-4 text-sm sm:text-base">
                Drie lagen ivoor, met de hand gerolde suikerrozen en de tedere kus van bladgoud. Een ontwerp dat begint bij jullie ja-woord en eindigt op het bord van iedere gast.
              </p>
              <p className="text-charcoal/60 text-sm leading-relaxed mb-8">
                Elke creatie wordt ontworpen na een persoonlijk gesprek. Geen twee zijn ooit hetzelfde.
              </p>
              <Link href="/galerij" className="btn-outline">
                Meer creaties
              </Link>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ========== FEATURED GRID ========== */}
      <Reveal as="section" className="relative section-y bg-cream overflow-hidden">
        <BotanicalPattern opacity={0.04} />
        <div className="container-tight relative">
          <div className="flex items-end justify-between mb-8 sm:mb-12">
            <div>
              <div className="tag mb-3">Onze creaties</div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl">Uitgelicht werk</h2>
            </div>
            <Link
              href="/galerij"
              className="hidden md:inline-flex items-center gap-2 text-sm uppercase tracking-widest text-charcoal/60 hover:text-gold-dark"
            >
              Alle creaties <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {gridFeatured.map((item) => (
              <Link
                key={item.id}
                href="/galerij"
                className="group relative aspect-square overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-gold/10"
              >
                <img
                  src={imageSrc(item)}
                  alt={item.altText ?? ""}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                {item.caption && (
                  <div className="absolute bottom-3 left-3 right-3 text-cream text-xs opacity-0 group-hover:opacity-100 transition-opacity drop-shadow">
                    {item.caption}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      </Reveal>

      <SectionDivider color="fill-cream" variant="scallop" />

      {/* ========== DIENSTEN PREVIEW ========== */}
      <Reveal as="section" className="relative section-y bg-section-warm overflow-hidden">
        <BotanicalPattern opacity={0.04} />
        <div className="container-tight relative">
          <div className="text-center mb-10 sm:mb-16">
            <div className="tag mb-3">Aanbod</div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl">Voor elke gelegenheid</h2>
            <div className="mt-6"><GoldDivider /></div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {SERVICE_PREVIEWS.map((s) => {
              const img = demoImageForSlug(s.slug);
              return (
                <Link
                  key={s.slug}
                  href={`/galerij/${s.slug}`}
                  className="group rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-xl transition-shadow ring-1 ring-gold/10 block"
                >
                  {img && (
                    <div className="relative aspect-[5/4] overflow-hidden">
                      <img
                        src={img}
                        alt={s.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/40 via-transparent to-transparent" />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-2xl mb-3 group-hover:text-gold-dark transition-colors">{s.title}</h3>
                    <p className="text-charcoal/70 leading-relaxed text-sm">{s.body}</p>
                    <div className="mt-4 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-gold-dark">
                      Bekijk werk <ArrowRight size={14} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="text-center mt-12">
            <Link href="/diensten" className="btn-outline">Volledig aanbod</Link>
          </div>
        </div>
      </Reveal>

      <SectionDivider color="fill-blush" variant="wave" flip />

      {/* ========== TESTIMONIALS ========== */}
      <Reveal as="section" className="relative section-y bg-section-blush overflow-hidden" staggerChildren={0.12}>
        <BotanicalPattern opacity={0.05} />
        <BotanicalCorner position="tl" color="text-gold/30" />
        <BotanicalCorner position="br" color="text-gold/30" />
        <div className="container-tight relative">
          <div className="text-center mb-10 sm:mb-14">
            <div className="tag mb-3">Klanten over ons</div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl">Wat klanten vertellen</h2>
            <div className="mt-6"><GoldDivider /></div>
          </div>
          <div className="grid md:grid-cols-3 gap-5 sm:gap-6">
            {TESTIMONIALS.map((t, i) => (
              <Reveal
                key={i}
                delay={i * 100}
                className="card hairline-gold bg-cream/80 backdrop-blur relative flex flex-col"
              >
                <Quote size={32} className="text-gold mb-4" />
                <p className="text-charcoal/80 leading-relaxed text-base sm:text-lg italic flex-1">
                  "{t.quote}"
                </p>
                <div className="mt-6 pt-6 border-t border-gold/20">
                  <div className="script-accent text-2xl leading-none mb-1">{t.name}</div>
                  <div className="tag !text-[10px]">{t.occasion}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Reveal>

      <SectionDivider color="fill-blush" variant="asymmetric" />

      {/* ========== INSTAGRAM GRID ========== */}
      <Reveal as="section" className="relative section-y bg-cream overflow-hidden">
        <BotanicalPattern opacity={0.04} />
        <div className="container-tight relative">
          <div className="text-center mb-8 sm:mb-12">
            <div className="tag mb-3 flex items-center justify-center gap-2">
              <Instagram size={14} className="text-gold" /> Instagram
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl">@atelierboterbloem</h2>
            <p className="mt-4 text-charcoal/60 text-sm sm:text-base max-w-md mx-auto">
              Volg ons op Instagram voor nieuwste creaties en behind-the-scenes momenten.
            </p>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3">
            {igItems.map((item) => (
              <a
                key={item.id}
                href={igHandle}
                target="_blank"
                rel="noreferrer"
                className="group relative aspect-square overflow-hidden bg-white ring-1 ring-charcoal/10 hover:ring-gold transition-all"
              >
                <img
                  src={imageSrc(item)}
                  alt={item.altText ?? ""}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-charcoal/0 group-hover:bg-charcoal/50 transition-colors flex items-center justify-center">
                  <Instagram size={24} className="text-cream opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </a>
            ))}
          </div>
          <div className="text-center mt-8 sm:mt-10">
            <a href={igHandle} target="_blank" rel="noreferrer" className="btn-outline">
              <Instagram size={16} /> Volg @atelierboterbloem
            </a>
          </div>
        </div>
      </Reveal>

      {/* ========== CTA STRIP ========== */}
      <Reveal as="section" className="relative section-y bg-charcoal text-cream overflow-hidden">
        <BotanicalPattern opacity={0.06} className="text-cream" />
        <div className="container-narrow relative text-center">
          <GoldDivider className="!text-gold/60" />
          <div className="script-accent text-3xl sm:text-4xl mt-6 mb-2">Een idee?</div>
          <h2 className="text-cream text-3xl sm:text-4xl md:text-5xl mb-6">Laten we het bespreken</h2>
          <p className="text-cream/70 mb-8 leading-relaxed text-sm sm:text-base">
            Of het nu een bruiloft, verjaardag of een doopfeest is — vertel ons over jouw moment en we ontwerpen iets unieks.
          </p>
          <MagneticLink href="/contact" className="btn-gold">Stuur een bericht</MagneticLink>
          <div className="mt-8 sm:mt-10"><GoldDivider className="!text-gold/60" /></div>
        </div>
      </Reveal>
    </>
  );
}
