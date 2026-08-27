import { Link } from "wouter";
import type { GalleryItem } from "@shared/schema";
import { FotoCyclus } from "../FotoCyclus";
import { FotoScrim, FOTO_TEKST_SCHADUW } from "../FotoScrim";

/** Zelfde vorm als de publieke galerij-respons levert. */
export type Gelegenheid = {
  id: number;
  slug: string;
  name: string;
  itemCount: number;
  cover: GalleryItem | null;
  albums: Array<{ items: GalleryItem[] }>;
};

/**
 * "Waar we tables voor maken": een doorlopende strook die zacht van rechts naar links schuift.
 *
 * Stond eerder als raster onderaan `/aanbod`, ruim duizend pixels onder de prijzen. Wie zich
 * bij een pakket afvraagt *"kan zij dit ook voor een babyshower?"* moest daarvoor langs de
 * prijslijst, de levertijden en de reviews scrollen.
 *
 * **Dezelfde aanpak als `Marquee` op de homepage**, en om dezelfde reden: de inhoud staat er
 * drie keer en de baan schuift met een CSS-animatie naar `-33,333%`. Het einde van de tweede
 * reeks is daardoor precies het begin van de eerste, dus hij loopt naadloos rond zonder sprong.
 * Het is bovendien een `transform`, dus de browser doet het op de GPU en blijft het soepel, ook
 * op een traag tempo.
 *
 * **Waarom niet de scrollende variant.** De eerste versie schoof met `scrollBy` blok voor blok
 * door een `overflow-x-auto`-rij. Dat is geen rivier maar een klok: elke paar seconden een
 * sprong. Vloeiend scrollen kán, maar `scroll-snap` trekt dan bij elk snappunt terug en de
 * tegels gaan trillen — en zonder snap voelt vegen met de hand weer rommelig.
 *
 * De prijs van deze keuze: je kunt de strook niet met de hand opzij vegen. Elke tegel blijft een
 * gewone link, dus aantikken werkt, en wie alles wil zien klikt door naar de galerij.
 */
export function GelegenheidCarrousel({
  gelegenheden,
  /** Seconden voor één volledige ronde. Hoger is rustiger. */
  duur = 55,
}: {
  gelegenheden: Gelegenheid[];
  duur?: number;
}) {
  const zichtbaar = gelegenheden.filter((c) => c.itemCount > 0);
  if (zichtbaar.length === 0) return null;

  return (
    <div className="group relative overflow-hidden">
      <div
        // `marquee-track` zet `width: max-content` én wordt in `index.css` stilgezet bij
        // `prefers-reduced-motion`. Dat laatste weegt hier zwaar: dit beweegt uit zichzelf.
        className="marquee-track flex gap-3 will-change-transform group-hover:[animation-play-state:paused] sm:gap-4"
        style={{ animation: `marquee ${duur}s linear infinite` }}
      >
        {[...zichtbaar, ...zichtbaar, ...zichtbaar].map((c, i) => {
          // Alleen de eerste reeks telt mee voor het toetsenbord en de schermlezer; de twee
          // kopieën zijn er puur om de lus rond te maken.
          const kopie = i >= zichtbaar.length;
          return (
            <Link
              key={i}
              href={`/galerij/${c.slug}`}
              aria-hidden={kopie || undefined}
              tabIndex={kopie ? -1 : undefined}
              // Vaste breedtes, geen percentages: de baan is `max-content` breed, en een
              // percentage daarvan is een cirkelredenering die de tegels laat inklappen.
              className="group/tegel relative aspect-[3/4] w-[10.5rem] shrink-0 overflow-hidden rounded-xl bg-blush/30 ring-1 ring-sage/10 sm:w-[13rem] lg:w-[16rem]"
            >
              <FotoCyclus
                fotos={tegelFotos(c)}
                alt={c.name}
                // Uit de pas, zodat er telkens één tegel omslaat in plaats van allemaal tegelijk.
                vertraging={i * 900}
                periode={5400}
                className="transition-transform duration-700 group-hover/tegel:scale-105"
              />
              <FotoScrim />
              <div
                className={`absolute bottom-3 left-3 right-3 z-30 font-display text-base leading-tight text-linen sm:bottom-4 sm:left-4 sm:right-4 sm:text-xl lg:text-2xl ${FOTO_TEKST_SCHADUW}`}
              >
                {c.name}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/**
 * De cover eerst, daarna alles uit de events eronder. Ontdubbeld, want de cover zit meestal ook
 * in een event en zou anders twee keer voorbijkomen in dezelfde ronde.
 *
 * Begrensd op twaalf: elke foto wordt ingeladen zodra hij aan de beurt is, en een gelegenheid
 * met honderd foto's hoort geen honderd verzoeken op te leveren voor één vlak.
 */
function tegelFotos(c: Gelegenheid): GalleryItem[] {
  const uitEvents = c.albums.flatMap((a) => a.items);
  const alles = c.cover ? [c.cover, ...uitEvents] : uitEvents;
  const gezien = new Set<number>();
  return alles.filter((f) => !gezien.has(f.id) && gezien.add(f.id)).slice(0, 12);
}
