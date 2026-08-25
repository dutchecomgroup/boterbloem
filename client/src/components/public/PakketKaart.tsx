import { Link } from "wouter";
import { Check } from "lucide-react";
import type { GalleryItem, Package } from "@shared/schema";
import { imageSrc } from "../../lib/images";
import { formatCurrency, personenBereik } from "../../lib/utils";

export type PakketMetCover = Package & { cover: GalleryItem | null };

/**
 * Eén pakket als blok: coverfoto boven, prijs en inhoud eronder.
 *
 * Uit `AanbodPage` gelicht zodat de pagina over de indeling gaat en dit bestand over de kaart.
 */
export function PakketKaart({ pakket: p }: { pakket: PakketMetCover }) {
  const bereik = personenBereik(p.personsMin, p.personsMax);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gold/10 transition-shadow hover:shadow-xl">
      {/* Zonder cover een zacht kleurvlak in plaats van een gat: de kaarten blijven dan even
          hoog naast elkaar. */}
      <div className="relative aspect-[16/10] overflow-hidden bg-blush/40">
        {p.cover ? (
          <img
            src={imageSrc(p.cover)}
            alt={p.cover.altText ?? p.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="script-accent text-3xl opacity-50">Boterbloem</span>
          </div>
        )}
      </div>

      {/* Twee kolommen op een telefoon maakt de kaart ~170 px breed. Alles schaalt daarom mee:
          kleinere koppen, minder ruimte, en een vinkje van 12 px in plaats van 16, want op die
          breedte scheelt elke pixel een woord op de regel.

          Bewust wél de volledige inhoud, ook op een telefoon. "Wat zit erin" is de tweede vraag
          na de prijs, en een kaart die dat weglaat dwingt de bezoeker om te gokken. */}
      <div className="flex flex-1 flex-col p-4 sm:p-6 lg:p-7">
        <h3 className="text-lg leading-tight sm:text-2xl lg:text-3xl">{p.name}</h3>
        {p.tagline && <p className="mt-1 text-xs text-charcoal/70 sm:text-sm">{p.tagline}</p>}

        {/* De vanaf-prijs is waar de bezoeker op afkomt, dus het zwaarste element op de kaart.
            Een pakket zonder prijs mag niet als "vanaf € 0,00" op de site staan: dat leest als
            gratis. */}
        <div className="mt-3 border-y border-gold/20 py-2.5 sm:mt-4 sm:py-3">
          {Number(p.priceFrom) > 0 ? (
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-[9px] uppercase tracking-[0.2em] text-charcoal/60 sm:text-[10px]">vanaf</span>
              <span className="font-display text-2xl leading-none text-gold-dark sm:text-3xl lg:text-4xl">
                {formatCurrency(Number(p.priceFrom))}
              </span>
              {p.priceUnit === "per_persoon" && (
                <span className="text-xs text-charcoal/70 sm:text-sm">p.p.</span>
              )}
            </div>
          ) : (
            <span className="font-display text-xl text-gold-dark sm:text-2xl">Prijs op aanvraag</span>
          )}
          {bereik && <div className="mt-1 text-[11px] text-charcoal/60 sm:text-xs">{bereik}</div>}
        </div>

        {p.description && (
          <p className="mt-3 text-xs leading-relaxed text-charcoal/75 sm:mt-4 sm:text-sm">
            {p.description}
          </p>
        )}

        {p.includes.length > 0 && (
          <ul className="mt-3 space-y-1.5 text-xs text-charcoal/80 sm:mt-5 sm:space-y-2 sm:text-sm">
            {p.includes.map((r, i) => (
              <li key={i} className="flex gap-1.5 sm:gap-2">
                <Check className="mt-0.5 h-3 w-3 shrink-0 text-gold sm:h-4 sm:w-4" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        )}

        {/* `mt-auto`: de knop staat onderaan de kaart, ook als de ene kaart meer regels heeft
            dan de andere. */}
        <Link
          href={`/contact?pakket=${p.slug}`}
          className="btn-gold mt-auto w-full !px-3 pt-3 text-xs sm:!px-6 sm:text-sm"
        >
          Vraag aan
        </Link>
      </div>
    </article>
  );
}
