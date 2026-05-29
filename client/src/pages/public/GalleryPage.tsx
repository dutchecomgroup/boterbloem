import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "../../lib/api";
import type { GalleryItem, GalleryCategory } from "@shared/schema";
import { X } from "lucide-react";
import { useParams } from "wouter";

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

  const categories = data?.categories ?? [];
  const items = data?.items ?? [];
  const filtered = activeSlug
    ? items.filter((i) => {
        const cat = categories.find((c) => c.id === i.categoryId);
        return cat?.slug === activeSlug;
      })
    : items;

  return (
    <>
      <section className="container-tight pt-16 pb-12">
        <div className="text-xs uppercase tracking-[0.3em] text-gold-dark mb-3">Galerij</div>
        <h1 className="text-5xl md:text-6xl">Onze creaties</h1>
        <p className="mt-6 text-charcoal/70 max-w-2xl leading-relaxed">
          Een selectie van bruidstaarten, verjaardagstaarten, mini desserts en sweet tables die we eerder hebben gemaakt.
        </p>

        <div className="mt-12 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveSlug(null)}
            className={`px-4 py-2 rounded-full text-xs uppercase tracking-widest transition ${
              !activeSlug ? "bg-gold text-cream" : "bg-white text-charcoal/60 hover:text-charcoal border border-charcoal/10"
            }`}
          >
            Alles
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveSlug(c.slug)}
              className={`px-4 py-2 rounded-full text-xs uppercase tracking-widest transition ${
                activeSlug === c.slug ? "bg-gold text-cream" : "bg-white text-charcoal/60 hover:text-charcoal border border-charcoal/10"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </section>

      <section className="container-tight pb-32">
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
                className="mb-4 md:mb-6 block w-full break-inside-avoid overflow-hidden rounded-lg bg-white shadow-sm group"
              >
                <img
                  src={`/uploads/gallery/${item.filename}`}
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
      </section>

      {lightbox && (
        <div
          className="fixed inset-0 bg-charcoal/90 z-50 flex items-center justify-center p-4 md:p-12"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-cream/80 hover:text-cream p-2"
            aria-label="Sluiten"
          >
            <X size={28} />
          </button>
          <img
            src={`/uploads/gallery/${lightbox.filename}`}
            alt={lightbox.altText ?? ""}
            className="max-h-full max-w-full object-contain rounded-md"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
