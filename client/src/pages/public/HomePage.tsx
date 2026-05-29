import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { usePublicSettings } from "../../hooks/usePublicSettings";
import type { GalleryItem, GalleryCategory } from "@shared/schema";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

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
          <div className="text-charcoal/40 text-xs uppercase tracking-widest">
            Foto's verschijnen hier zodra ze geüpload zijn
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-gold/10">
      {items.map((item, i) => (
        <img
          key={item.id}
          src={`/uploads/gallery/${item.filename}`}
          alt={item.altText ?? ""}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1500ms] ease-in-out ${
            i === idx ? "opacity-100" : "opacity-0"
          }`}
          loading={i === 0 ? "eager" : "lazy"}
        />
      ))}

      {/* Decorative gold frame corners */}
      <div className="pointer-events-none absolute inset-3 border border-cream/30 rounded-xl" />

      {/* Bottom gradient + caption */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-charcoal/60 to-transparent" />
      {items[idx]?.caption && (
        <div className="absolute bottom-6 left-6 right-20 text-cream text-sm font-medium drop-shadow">
          {items[idx].caption}
        </div>
      )}

      {/* Navigation dots */}
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

      {/* Arrows (desktop only) */}
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

export default function HomePage() {
  const { data: settings } = usePublicSettings();
  const hero = settings?.hero;
  const { data: gallery } = useQuery({
    queryKey: ["public", "gallery"],
    queryFn: () => api.get<GalleryResponse>("/api/public/gallery"),
  });

  const featured = (gallery?.items?.filter((i) => i.featured) ?? []).slice(0, 6);
  const carouselItems = featured.length ? featured : (gallery?.items ?? []).slice(0, 6);
  const gridFeatured = (gallery?.items?.filter((i) => i.featured) ?? gallery?.items ?? []).slice(0, 6);

  return (
    <>
      {/* Hero — two columns with carousel on the right */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cream via-blush/20 to-butter/40 pointer-events-none" />
        <div className="container-tight relative py-16 md:py-24">
          <div className="grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-20 items-center">
            <div className="order-2 lg:order-1">
              <div className="text-xs uppercase tracking-[0.3em] text-gold-dark mb-6">
                Patisserie · Op maat
              </div>
              <h1 className="text-5xl md:text-6xl leading-[1.05]">
                <span className="block">Atelier</span>
                <span className="script-accent text-7xl md:text-8xl block leading-none -mt-2">
                  Boterbloem
                </span>
              </h1>
              <p className="mt-8 text-lg text-charcoal/75 max-w-xl leading-relaxed">
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

            <div className="order-1 lg:order-2 group relative">
              {/* Soft floating ornament behind the carousel */}
              <div className="absolute -inset-6 -z-10 bg-gradient-to-br from-gold/10 via-transparent to-blush/20 rounded-[2rem] blur-2xl" />
              <HeroCarousel items={carouselItems} />
            </div>
          </div>
        </div>
      </section>

      {/* Featured gallery */}
      <section className="py-24 bg-cream">
        <div className="container-tight">
          <div className="flex items-end justify-between mb-12">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-gold-dark mb-3">
                Onze creaties
              </div>
              <h2 className="text-4xl md:text-5xl">Uitgelicht werk</h2>
            </div>
            <Link
              href="/galerij"
              className="hidden md:inline-flex items-center gap-2 text-sm uppercase tracking-widest text-charcoal/60 hover:text-gold-dark"
            >
              Alle creaties <ArrowRight size={16} />
            </Link>
          </div>
          {gridFeatured.length === 0 ? (
            <div className="card text-center text-charcoal/50 py-20">
              Foto's verschijnen hier zodra ze geüpload zijn.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {gridFeatured.map((item) => (
                <Link
                  key={item.id}
                  href="/galerij"
                  className="group relative aspect-square overflow-hidden rounded-lg bg-white shadow-sm"
                >
                  <img
                    src={`/uploads/gallery/${item.filename}`}
                    alt={item.altText ?? ""}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Diensten preview */}
      <section className="py-24 bg-white">
        <div className="container-tight">
          <div className="text-center mb-16">
            <div className="text-xs uppercase tracking-[0.3em] text-gold-dark mb-3">Aanbod</div>
            <h2 className="text-4xl md:text-5xl">Voor elke gelegenheid</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Bruidstaarten",
                body:
                  "Een centrepiece dat het verhaal van jullie dag vertelt — vanaf het ontwerp tot de laatste suikerbloem.",
              },
              {
                title: "Verjaardagstaarten",
                body:
                  "Persoonlijk, smaakvol en altijd met dat ene detail dat het bijzonder maakt.",
              },
              {
                title: "Mini desserts & cupcakes",
                body:
                  "Sweet tables, dessertbars en cupcake-arrangementen voor je feest of borrel.",
              },
            ].map((s) => (
              <div key={s.title} className="card hover:shadow-md transition-shadow">
                <h3 className="text-2xl mb-3">{s.title}</h3>
                <p className="text-charcoal/70 leading-relaxed text-sm">{s.body}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/diensten" className="btn-outline">
              Volledig aanbod
            </Link>
          </div>
        </div>
      </section>

      {/* CTA strip */}
      <section className="py-20 bg-charcoal text-cream">
        <div className="container-narrow text-center">
          <div className="script-accent text-4xl mb-2">Een idee?</div>
          <h2 className="text-cream text-4xl md:text-5xl mb-6">Laten we het bespreken</h2>
          <p className="text-cream/70 mb-8 leading-relaxed">
            Of het nu een bruiloft, verjaardag of een doopfeest is — vertel ons over jouw moment en we ontwerpen iets unieks.
          </p>
          <Link href="/contact" className="btn-gold">
            Stuur een bericht
          </Link>
        </div>
      </section>
    </>
  );
}
