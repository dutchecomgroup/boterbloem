import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { usePublicSettings } from "../../hooks/usePublicSettings";
import type { GalleryItem, GalleryCategory } from "@shared/schema";
import { ArrowRight } from "lucide-react";

interface GalleryResponse {
  items: GalleryItem[];
  categories: GalleryCategory[];
}

export default function HomePage() {
  const { data: settings } = usePublicSettings();
  const hero = settings?.hero;
  const { data: gallery } = useQuery({
    queryKey: ["public", "gallery"],
    queryFn: () => api.get<GalleryResponse>("/api/public/gallery"),
  });
  const featured = gallery?.items?.filter((i) => i.featured).slice(0, 6) ?? gallery?.items?.slice(0, 6) ?? [];
  const heroImage = hero?.imageFilename
    ? `/uploads/gallery/${hero.imageFilename}`
    : gallery?.items?.[0]
    ? `/uploads/gallery/${gallery.items[0].filename}`
    : null;

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cream via-blush/30 to-butter/40" />
        {heroImage && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-60"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-cream via-cream/30 to-transparent" />
        <div className="container-tight relative z-10 py-24">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-[0.3em] text-gold-dark mb-6">Patisserie · Op maat</div>
            <h1 className="text-5xl md:text-7xl leading-[1.05]">
              <span className="block">Atelier</span>
              <span className="script-accent text-7xl md:text-9xl block leading-none -mt-2">Boterbloem</span>
            </h1>
            <p className="mt-8 text-lg md:text-xl text-charcoal/75 max-w-xl leading-relaxed">
              {hero?.tagline ?? "Handgemaakte taarten voor jouw mooiste momenten — bruiloften, verjaardagen, en alles daartussen."}
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
        </div>
      </section>

      {/* Featured gallery */}
      <section className="py-24 bg-cream">
        <div className="container-tight">
          <div className="flex items-end justify-between mb-12">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-gold-dark mb-3">Onze creaties</div>
              <h2 className="text-4xl md:text-5xl">Uitgelicht werk</h2>
            </div>
            <Link href="/galerij" className="hidden md:inline-flex items-center gap-2 text-sm uppercase tracking-widest text-charcoal/60 hover:text-gold-dark">
              Alle creaties <ArrowRight size={16} />
            </Link>
          </div>
          {featured.length === 0 ? (
            <div className="card text-center text-charcoal/50 py-20">
              Foto's verschijnen hier zodra ze geüpload zijn.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {featured.map((item) => (
                <Link key={item.id} href="/galerij" className="group relative aspect-square overflow-hidden rounded-lg bg-white shadow-sm">
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
              { title: "Bruidstaarten", body: "Een centrepiece dat het verhaal van jullie dag vertelt — vanaf het ontwerp tot de laatste suikerbloem." },
              { title: "Verjaardagstaarten", body: "Persoonlijk, smaakvol en altijd met dat ene detail dat het bijzonder maakt." },
              { title: "Mini desserts & cupcakes", body: "Sweet tables, dessertbars en cupcake-arrangementen voor je feest of borrel." },
            ].map((s) => (
              <div key={s.title} className="card hover:shadow-md transition-shadow">
                <h3 className="text-2xl mb-3">{s.title}</h3>
                <p className="text-charcoal/70 leading-relaxed text-sm">{s.body}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/diensten" className="btn-outline">Volledig aanbod</Link>
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
          <Link href="/contact" className="btn-gold">Stuur een bericht</Link>
        </div>
      </section>
    </>
  );
}
