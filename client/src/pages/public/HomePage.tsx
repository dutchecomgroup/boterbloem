import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { usePublicSettings } from "../../hooks/usePublicSettings";
import type { GalleryItem, GalleryCategory } from "@shared/schema";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { DEMO_ITEMS, DEMO_FEATURED, imageSrc, withFallback, demoImageForSlug } from "../../lib/demoGallery";
import { BotanicalPattern } from "../../components/ornaments/BotanicalPattern";
import { FloralFrame } from "../../components/ornaments/FloralFrame";
import { GoldDivider } from "../../components/ornaments/GoldDivider";
import { BotanicalCorner } from "../../components/ornaments/BotanicalCorner";

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
      <div className="relative aspect-[4/5] rounded-2xl bg-gradient-to-br from-blush/40 via-cream to-butter/50 shadow-xl border border-gold/10 flex items-center justify-center">
        <div className="text-center px-6">
          <div className="script-accent text-4xl mb-3">Atelier</div>
          <div className="tag">Foto's verschijnen hier zodra ze geüpload zijn</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-gold/20 group">
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

const SERVICE_PREVIEWS = [
  { slug: "bruidstaarten", title: "Bruidstaarten", body: "Een centrepiece dat het verhaal van jullie dag vertelt — vanaf het ontwerp tot de laatste suikerbloem." },
  { slug: "verjaardagstaarten", title: "Verjaardagstaarten", body: "Persoonlijk, smaakvol en altijd met dat ene detail dat het bijzonder maakt." },
  { slug: "mini-desserts", title: "Mini desserts & cupcakes", body: "Sweet tables, dessertbars en cupcake-arrangementen voor je feest of borrel." },
];

export default function HomePage() {
  const { data: settings } = usePublicSettings();
  const hero = settings?.hero;
  const { data: gallery } = useQuery({
    queryKey: ["public", "gallery"],
    queryFn: () => api.get<GalleryResponse>("/api/public/gallery"),
  });

  const items = withFallback(gallery?.items, DEMO_ITEMS);
  const featured = items.filter((i) => i.featured);
  const carouselItems = (featured.length ? featured : DEMO_FEATURED).slice(0, 6);
  const gridFeatured = (featured.length ? featured : items).slice(0, 6);

  return (
    <>
      {/* Hero — two columns with carousel + floral frames */}
      <section className="relative overflow-hidden bg-section-warm">
        <BotanicalPattern opacity={0.05} />
        <FloralFrame className="absolute -top-12 -right-12 lg:right-0 lg:-top-8" size={340} color="text-gold/20" />
        <FloralFrame className="absolute -bottom-12 -left-12 rotate-180" size={260} color="text-blush" />

        <div className="container-tight relative py-16 md:py-24">
          <div className="grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-20 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="tag mb-6">Patisserie · Op maat</div>
              <h1 className="text-5xl md:text-6xl leading-[1.05]">
                <span className="block">Atelier</span>
                <span className="script-accent text-7xl md:text-8xl block leading-none -mt-2">
                  Boterbloem
                </span>
              </h1>
              <div className="mt-6 mb-6"><GoldDivider className="!mx-0 !max-w-[180px]" /></div>
              <p className="text-lg text-charcoal/75 max-w-xl leading-relaxed">
                {hero?.tagline ??
                  "Handgemaakte taarten voor jouw mooiste momenten — bruiloften, verjaardagen, en alles daartussen."}
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link href={hero?.ctaHref ?? "/contact"} className="btn-gold">
                  {hero?.ctaLabel ?? "Vraag offerte aan"}
                </Link>
                <Link href="/galerij" className="btn-outline">
                  Bekijk de galerij
                </Link>
              </div>
            </div>

            <div className="order-1 lg:order-2 relative">
              <div className="absolute -inset-6 -z-10 bg-gradient-to-br from-gold/10 via-transparent to-blush/20 rounded-[2rem] blur-2xl" />
              <HeroCarousel items={carouselItems} />
            </div>
          </div>
        </div>
      </section>

      {/* Mission statement */}
      <section className="relative bg-section-blush overflow-hidden py-20">
        <BotanicalPattern opacity={0.06} />
        <BotanicalCorner position="tl" size={140} color="text-gold/30" />
        <BotanicalCorner position="br" size={140} color="text-gold/30" />
        <div className="container-narrow relative text-center">
          <div className="script-accent text-5xl md:text-6xl mb-6 leading-none">
            Iedere taart vertelt een verhaal
          </div>
          <p className="text-charcoal/70 max-w-xl mx-auto text-lg leading-relaxed">
            Vanuit liefde voor het ambacht en oog voor detail — wij ontwerpen en bakken zoete creaties die jouw moment compleet maken.
          </p>
          <div className="mt-10"><GoldDivider /></div>
        </div>
      </section>

      {/* Featured gallery */}
      <section className="relative py-24 bg-section-butter overflow-hidden">
        <BotanicalPattern opacity={0.04} />
        <div className="container-tight relative">
          <div className="flex items-end justify-between mb-12">
            <div>
              <div className="tag mb-3">Onze creaties</div>
              <h2 className="text-4xl md:text-5xl">Uitgelicht werk</h2>
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
      </section>

      {/* Diensten preview met images */}
      <section className="relative py-24 bg-cream overflow-hidden">
        <BotanicalPattern opacity={0.04} />
        <div className="container-tight relative">
          <div className="text-center mb-16">
            <div className="tag mb-3">Aanbod</div>
            <h2 className="text-4xl md:text-5xl">Voor elke gelegenheid</h2>
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
      </section>

      {/* CTA strip */}
      <section className="relative py-20 bg-charcoal text-cream overflow-hidden">
        <BotanicalPattern opacity={0.06} className="text-cream" />
        <div className="container-narrow relative text-center">
          <GoldDivider className="!text-gold/60" />
          <div className="script-accent text-4xl mt-6 mb-2">Een idee?</div>
          <h2 className="text-cream text-4xl md:text-5xl mb-6">Laten we het bespreken</h2>
          <p className="text-cream/70 mb-8 leading-relaxed">
            Of het nu een bruiloft, verjaardag of een doopfeest is — vertel ons over jouw moment en we ontwerpen iets unieks.
          </p>
          <Link href="/contact" className="btn-gold">Stuur een bericht</Link>
          <div className="mt-10"><GoldDivider className="!text-gold/60" /></div>
        </div>
      </section>
    </>
  );
}
