import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "../../lib/api";
import type { GalleryItem, GalleryCategory } from "@shared/schema";
import { X } from "lucide-react";
import { useParams } from "wouter";
import { DEMO_ITEMS, DEMO_CATEGORIES, imageSrc, withFallback } from "../../lib/demoGallery";
import { BotanicalPattern } from "../../components/ornaments/BotanicalPattern";
import { BotanicalCorner } from "../../components/ornaments/BotanicalCorner";
import { GoldDivider } from "../../components/ornaments/GoldDivider";

interface GalleryResponse {
  items: GalleryItem[];
  categories: GalleryCategory[];
}

export default function GalleryPage() {
  const params = useParams<{ slug?: string }>();
  const [activeSlug, setActiveSlug] = useState<string | null>(params.slug ?? null);
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["public", "gallery"],
    queryFn: () => api.get<GalleryResponse>("/api/public/gallery"),
  });

  const categories = withFallback(data?.categories, DEMO_CATEGORIES);
  const items = withFallback(data?.items, DEMO_ITEMS);
  const filtered = activeSlug
    ? items.filter((i) => {
        const cat = categories.find((c) => c.id === i.categoryId);
        return cat?.slug === activeSlug;
      })
    : items;

  return (
    <>
      <section className="relative bg-section-blush overflow-hidden pt-16 pb-16">
        <BotanicalPattern opacity={0.05} />
        <BotanicalCorner position="tl" size={140} color="text-gold/30" />
        <BotanicalCorner position="tr" size={140} color="text-gold/30" />
        <div className="container-tight relative">
          <div className="tag mb-3">Galerij</div>
          <h1 className="text-5xl md:text-6xl">Onze creaties</h1>
          <div className="mt-6 mb-6"><GoldDivider className="!mx-0 !max-w-[180px]" /></div>
          <p className="text-charcoal/70 max-w-2xl leading-relaxed">
            Een selectie van bruidstaarten, verjaardagstaarten, mini desserts en sweet tables die we eerder hebben gemaakt.
          </p>

          <div className="mt-10 flex flex-wrap gap-2">
            <button
              onClick={() => setActiveSlug(null)}
              className={`pill ${!activeSlug ? "pill-active" : "pill-inactive"}`}
            >
              Alles
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveSlug(c.slug)}
                className={`pill ${activeSlug === c.slug ? "pill-active" : "pill-inactive"}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="relative bg-cream py-20 overflow-hidden">
        <BotanicalPattern opacity={0.04} />
        <div className="container-tight relative">
          {isLoading ? (
            <div className="text-center py-20 text-charcoal/40">Laden…</div>
          ) : filtered.length === 0 ? (
            <div className="card text-center text-charcoal/50 py-20">
              Nog geen foto's in deze categorie.
            </div>
          ) : (
            <div className="columns-2 md:columns-3 gap-4 md:gap-6 [column-fill:_balance]">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setLightbox(item)}
                  className="mb-4 md:mb-6 block w-full break-inside-avoid overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-gold/10 group"
                >
                  <img
                    src={imageSrc(item)}
                    alt={item.altText ?? ""}
                    className="w-full h-auto transition-transform duration-500 group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                  {item.caption && (
                    <div className="p-3 text-xs text-charcoal/60 text-left">{item.caption}</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {lightbox && (
        <div
          className="fixed inset-0 bg-charcoal/95 z-50 flex items-center justify-center p-4 md:p-12"
          onClick={() => setLightbox(null)}
        >
          <BotanicalCorner position="tl" size={120} color="text-gold/40" />
          <BotanicalCorner position="br" size={120} color="text-gold/40" />
          <button
            className="absolute top-4 right-4 text-cream/80 hover:text-cream p-2"
            aria-label="Sluiten"
          >
            <X size={28} />
          </button>
          <div className="relative max-h-full max-w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={imageSrc(lightbox)}
              alt={lightbox.altText ?? ""}
              className="max-h-[80vh] max-w-full object-contain rounded-md ring-1 ring-gold/30"
            />
            {lightbox.caption && (
              <div className="mt-4 text-center text-cream/80 text-sm">{lightbox.caption}</div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
