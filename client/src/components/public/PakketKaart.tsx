import { Link } from "wouter";
import { Check } from "lucide-react";
import type { GalleryItem, Package } from "@shared/schema";
import { imageSrc } from "../../lib/images";
import { formatCurrency, personenBereik } from "../../lib/utils";

export type PakketMetCover = Package & { cover: GalleryItem | null };

/**
 * Zoet (de drie Tables) of hartig (de drie Grazes).
 *
 * Kleur draagt hier informatie in plaats van versiering: je ziet aan de tint welke drie
 * pakketten bij elkaar horen. Dezelfde regel als in het beheerpaneel -- *kleur heeft
 * betekenis* -- en de twee tinten zijn precies de twee accentkleuren van haar moodboard.
 */
export type PakketFamilie = "zoet" | "hartig";

/** Uit de slug: alles wat op `-graze` eindigt is hartig. */
export function pakketFamilie(slug: string): PakketFamilie {
  return slug.endsWith("-graze") ? "hartig" : "zoet";
}

const TINT: Record<PakketFamilie, {
  kaart: string;
  band: string;
  vink: string;
  prijs: string;
  leeg: string;
}> = {
  zoet: {
    kaart: "bg-blush/25 ring-blush",
    band: "border-y border-blush bg-blush/40",
    vink: "text-burgundy/60",
    prijs: "text-burgundy",
    leeg: "bg-blush/50",
  },
  hartig: {
    kaart: "bg-sage/15 ring-sage/40",
    band: "border-y border-sage/40 bg-sage/25",
    vink: "text-sage-deep",
    prijs: "text-sage-deep",
    leeg: "bg-sage/30",
  },
};

/**
 * Eén pakket als blok: coverfoto boven, prijs en inhoud eronder.
 *
 * Uit `AanbodPage` gelicht zodat de pagina over de indeling gaat en dit bestand over de kaart.
 */
export function PakketKaart({
  pakket: p,
  familie = pakketFamilie(p.slug),
}: {
  pakket: PakketMetCover;
  familie?: PakketFamilie;
}) {
  const bereik = personenBereik(p.personsMin, p.personsMax);
  const tint = TINT[familie];

  return (
    <article
      className={`flex h-full flex-col overflow-hidden rounded-2xl shadow-sm ring-1 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl ${tint.kaart}`}
    >
      {/* Zonder cover een zacht kleurvlak in plaats van een gat: de kaarten blijven dan even
          hoog naast elkaar. */}
      <div className={`relative aspect-[16/10] overflow-hidden ${tint.leeg}`}>
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
        {/*
          Vaste ruimte voor kop en tagline, want anders begint de prijsband per kaart op een
          andere hoogte: "Klein, gezellig en verfijnd" is één regel, "Simpel, chic en heel
          passend bij een styled grazing table" twee. Drie kaarten naast elkaar met de band op
          drie verschillende hoogtes leest als slordig uitgelijnd werk.

          De maat verschilt per breedte, want de kaart verschilt per breedte: op een telefoon
          staan er twee naast elkaar en heeft "De perfecte middenmaat voor verjaardagen,
          babyshowers en feestjes" drie regels nodig, vanaf `sm` past hij in twee. Daar is de
          `line-clamp` op afgestemd, zodat er niets wordt afgekapt wat er nu staat -- en een
          nóg langere tagline de rij niet alsnog scheef trekt.
        */}
        <h3 className="line-clamp-2 min-h-[2.8rem] text-lg leading-tight sm:min-h-[3.75rem] sm:text-2xl lg:min-h-[4.7rem] lg:text-3xl">
          {p.name}
        </h3>
        <p className="mt-1 line-clamp-3 min-h-[3.4rem] text-xs text-charcoal/70 sm:line-clamp-2 sm:min-h-[2.65rem] sm:text-sm">
          {p.tagline}
        </p>

        {/* De vanaf-prijs is waar de bezoeker op afkomt, dus het zwaarste element op de kaart.
            Een pakket zonder prijs mag niet als "vanaf € 0,00" op de site staan: dat leest als
            gratis. */}
        <div className={`-mx-4 mt-3 px-4 py-2.5 sm:-mx-6 sm:mt-4 sm:px-6 sm:py-3 lg:-mx-7 lg:px-7 ${tint.band}`}>
          {Number(p.priceFrom) > 0 ? (
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-[9px] uppercase tracking-[0.2em] text-charcoal/60 sm:text-[10px]">vanaf</span>
              <span className={`font-display text-2xl leading-none sm:text-3xl lg:text-4xl ${tint.prijs}`}>
                {formatCurrency(Number(p.priceFrom))}
              </span>
              {p.priceUnit === "per_persoon" && (
                <span className="text-xs text-charcoal/70 sm:text-sm">p.p.</span>
              )}
            </div>
          ) : (
            <span className={`font-display text-xl sm:text-2xl ${tint.prijs}`}>Prijs op aanvraag</span>
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
                <Check className={`mt-0.5 h-3 w-3 shrink-0 sm:h-4 sm:w-4 ${tint.vink}`} />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        )}

        {/*
          `mt-auto` op de wikkel en niet op de knop zelf: de knop staat onderaan de kaart, ook
          als de ene kaart meer regels heeft dan de andere -- maar de `pt-6` blijft altijd
          staan. Zat het op de knop, dan viel bij een volle kaart de hele tussenruimte weg en
          plakte de knop tegen de laatste opsommingsregel.

          (Er stond ook een losse `pt-3` op de knop, die alleen de bovenkant van zijn eigen
          padding oprekte en hem scheef maakte. Weg.)
        */}
        <div className="mt-auto pt-6">
          <Link
            href={`/contact?pakket=${p.slug}`}
            className="btn-sage w-full !px-3 text-xs sm:!px-6 sm:text-sm"
          >
            Vraag aan
          </Link>
        </div>
      </div>
    </article>
  );
}
