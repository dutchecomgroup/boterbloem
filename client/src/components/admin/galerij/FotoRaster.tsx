import { Star, Trash2, Image as ImageIcon } from "lucide-react";
import type { GalleryItem, GalleryAlbum, GalleryCategory } from "@shared/schema";

/**
 * Het fotoraster van het beheerpaneel.
 *
 * Stond inline in `GalleryAdminPage` toen dat scherm nog de enige plek was waar foto's
 * verschenen. Nu is het er op drie: binnen een event, bij de losse foto's van een gelegenheid,
 * en in de "alle foto's"-zoekweergave. Die drie verschillen alleen in wat er ónder een foto
 * hoort te staan — daarom `context`.
 */

export type FotoContext =
  /** Binnen één event: alleen "waarheen verplaatsen" is nog zinnig. */
  | { soort: "event"; albumId: number; albums: GalleryAlbum[] }
  /** Losse foto's van een gelegenheid: hier kies je bij welk event hij hoort. */
  | { soort: "losse"; categoryId: number; albums: GalleryAlbum[] }
  /** Alles door elkaar: dan moet erbij staan waar een foto vandaan komt. */
  | { soort: "alle"; albums: GalleryAlbum[]; categorieen: GalleryCategory[] };

export function FotoRaster({
  items,
  context,
  onPatch,
  onVerwijder,
  onCover,
  leegTekst = "Nog geen foto's hier.",
}: {
  items: GalleryItem[];
  context: FotoContext;
  onPatch: (velden: { id: number } & Record<string, unknown>) => void;
  onVerwijder: (id: number) => void;
  /** Alleen binnen een event: deze foto als omslag van het event. */
  onCover?: (itemId: number) => void;
  leegTekst?: string;
}) {
  if (items.length === 0) {
    return (
      <div className="card py-14 text-center text-sm text-charcoal/70">{leegTekst}</div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
      {items.map((it) => (
        <div key={it.id} className="overflow-hidden rounded-lg border border-charcoal/5 bg-white shadow-sm">
          <div className="group relative aspect-square">
            <img
              src={`/uploads/gallery/${it.filename}`}
              alt={it.altText ?? ""}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-charcoal/0 opacity-0 transition group-hover:bg-charcoal/40 group-hover:opacity-100 focus-within:opacity-100">
              <button
                type="button"
                onClick={() => onPatch({ id: it.id, featured: !it.featured })}
                className={`rounded-full p-2 ${it.featured ? "bg-gold text-cream" : "bg-cream text-charcoal"}`}
                title="Uitgelicht op de homepage"
                aria-pressed={it.featured}
              >
                <Star size={16} />
              </button>

              {onCover && (
                <button
                  type="button"
                  onClick={() => onCover(it.id)}
                  className="rounded-full bg-cream p-2 text-charcoal"
                  title="Als omslag van dit event instellen"
                >
                  <ImageIcon size={16} />
                </button>
              )}

              <button
                type="button"
                onClick={() => confirm("Foto verwijderen?") && onVerwijder(it.id)}
                className="rounded-full bg-burgundy p-2 text-cream"
                title="Foto verwijderen"
              >
                <Trash2 size={16} />
              </button>
            </div>
            {it.featured && (
              <div className="absolute left-2 top-2 rounded bg-gold px-2 py-0.5 text-xs text-cream">★</div>
            )}
          </div>

          <div className="space-y-1 p-2">
            {/* Bijschrift staat onder de foto op de publieke pagina en in de lightbox.
                Opgeslagen bij wegklikken. */}
            <input
              className="input !px-2 !py-1 text-xs"
              placeholder="Bijschrift…"
              aria-label="Bijschrift"
              defaultValue={it.caption ?? ""}
              key={`cap-${it.id}`}
              onBlur={(e) => {
                const waarde = e.target.value.trim();
                if (waarde !== (it.caption ?? "")) onPatch({ id: it.id, caption: waarde || null });
              }}
            />

            {/* Wat eronder hoort, hangt af van waar je kijkt. Binnen een event de
                gelegenheid en het event herhalen die je in de kop al koos, leest als ruis. */}
            {context.soort === "alle" ? (
              <p className="px-1 text-[11px] leading-snug text-charcoal/70">
                {context.categorieen.find((c) => c.id === it.categoryId)?.name ?? "geen gelegenheid"}
                {" · "}
                {context.albums.find((a) => a.id === it.albumId)?.title ?? "geen event"}
              </p>
            ) : (
              <select
                className="input !px-2 !py-1 text-xs"
                aria-label="Verplaatsen naar event"
                value={it.albumId ?? ""}
                onChange={(e) =>
                  onPatch({ id: it.id, albumId: e.target.value ? Number(e.target.value) : null })
                }
              >
                <option value="">— geen event —</option>
                {context.albums
                  .filter((a) => a.categoryId === it.categoryId)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title}
                    </option>
                  ))}
              </select>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
