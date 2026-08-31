import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import type { GalleryItem } from "@shared/schema";
import type { PubliekeGelegenheid } from "../../lib/galerij";
import { FotoCyclus } from "../FotoCyclus";

/**
 * Het galerij-overzicht als reeks paren: elke gelegenheid is een volle kaart, en de tweede
 * van elk paar valt met zijn bovenrand over de onderrand van de eerste.
 *
 * Verving een raster van drie gelijke tegels. Dat raster behandelde vijf heel verschillende
 * gelegenheden als vijf keer hetzelfde ding; zo krijgt elke gelegenheid haar eigen vlak, mét
 * de intro-tekst die de klant per gelegenheid schreef en die in het raster nergens paste.
 *
 * ## Waarom hier geen sticky stapel meer staat
 *
 * Tot 31-08 plakten de kaarten vast en schoof de volgende er tijdens het scrollen overheen.
 * Dat las mooi, maar had een eigenschap die niet te repareren viel: zodra een kaart vastplakt
 * schuift hij omlaag de volgende kaart in, en dan groeit de overlap van de bedoelde 56 px naar
 * ruim 140 px. Gemeten, niet geschat. Die extra overlap at de knop van de kaart eronder op.
 *
 * Genoeg lucht onder de tekst zetten om dat op te vangen kan wel, maar dan staat de tekst
 * zichtbaar boven het midden van de kaart, en scheef staan is een hogere prijs dan het effect
 * waard is. De overlap is nu een vast getal dat op elke scrollpositie hetzelfde is.
 *
 * ## De twee regels die het geheel dragen
 *
 * - **De foto wisselt per kaart van kant** (`fotoLinks`), om en om. Op de naad valt de foto van
 *   de onderste kaart daardoor over het tekstvlak van de bovenste, en het tekstvlak van de
 *   onderste over de foto van de bovenste. Dat is de bedoeling: het is wat het geheel als een
 *   collage laat lezen in plaats van als een rij losse blokken.
 * - **De kaart die bedekt wordt, krijgt lucht onderaan** (`wordtBedekt`). Zonder dat landt de
 *   foto van de kaart eronder precies op de knop, en verdwijnt die. Dat gebeurde ook echt: op
 *   de eerste versie had de bovenste kaart geen zichtbare knop meer.
 *
 * **Pas vanaf `md`.** Daaronder is een kaart één kolom met de knop onderaan, en daar zou de
 * volgende kaart precies die knop bedekken. In twee kolommen staat de tekst verticaal
 * gecentreerd en valt de overlap in de padding eronder.
 */

/**
 * De lucht per kaart. Geen `space-y` op de ouder: die zet margin-top op elk kind behalve het
 * eerste, en zou per kaart met de overlap-marge vechten met de volgorde in de bundel als
 * scheidsrechter.
 */
function marge(index: number): string {
  if (index === 0) return "";
  return index % 2 === 1
    ? "mt-5 sm:mt-8 md:-mt-14" // tweede van het paar: 56 px eroverheen
    : "mt-5 sm:mt-8 md:mt-10"; // nieuw paar: gewone lucht
}

function StapelKaart({
  gelegenheid,
  fotos,
  index,
  aantal,
}: {
  gelegenheid: PubliekeGelegenheid;
  fotos: GalleryItem[];
  index: number;
  aantal: number;
}) {
  const fotoLinks = index % 2 === 0;

  /**
   * Wordt deze kaart bedekt door de volgende? Alleen de eerste van een paar, en alleen als er
   * nog een kaart achter komt. Die krijgt onderaan meer lucht dan de overlap breed is, zodat
   * de kaart erboven in leegte landt en niet op de laatste regel of de knop.
   */
  const wordtBedekt = index % 2 === 0 && index < aantal - 1;

  return (
    <article
      /* `relative` zodat `zIndex` telt: de bovenliggende kaart moet de onderliggende bedekken
         en niet andersom. Leunen op "latere broer wint" zou hier toevallig werken, maar één
         transform op een kaart maakt er een eigen stapelcontext van en dan klopt het niet meer. */
      style={{ zIndex: index }}
      className={`relative ${marge(index)} overflow-hidden rounded-3xl bg-linen shadow-xl ring-1 ring-sage/20`}
    >
      <div className={`grid md:min-h-[26rem] md:grid-cols-2 ${fotoLinks ? "" : "md:[direction:rtl]"}`}>
        {/* [direction:rtl] draait alleen de kolomvolgorde; de inhoud zet zichzelf terug. */}
        <div className="relative aspect-[16/10] sm:aspect-[2/1] md:aspect-auto md:[direction:ltr]">
          <FotoCyclus
            fotos={fotos}
            alt={gelegenheid.name}
            vertraging={index * 700}
            periode={5600}
          />
        </div>

        <div
          className={`flex flex-col justify-center p-5 sm:p-8 md:[direction:ltr] lg:p-12 ${
            wordtBedekt ? "md:pb-20 lg:pb-24" : ""
          }`}
        >
          <div className="tag mb-3">
            {gelegenheid.itemCount} {gelegenheid.itemCount === 1 ? "foto" : "foto's"}
          </div>
          <h2 className="font-display text-2xl leading-tight tracking-tight text-charcoal sm:text-3xl lg:text-4xl">
            {gelegenheid.name}
          </h2>
          {gelegenheid.description && (
            <p className="mt-4 max-w-md text-sm leading-relaxed text-charcoal/75 sm:text-base">
              {gelegenheid.description}
            </p>
          )}
          <div className="mt-5 sm:mt-7">
            <Link href={`/galerij/${gelegenheid.slug}`} className="btn-outline">
              Bekijk {gelegenheid.name.toLowerCase()} <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export function GelegenheidStapel({
  gelegenheden,
  tegelFotos,
}: {
  gelegenheden: PubliekeGelegenheid[];
  /** Welke foto's de tegel van een gelegenheid doorloopt — de pagina bepaalt de selectie. */
  tegelFotos: (g: PubliekeGelegenheid) => GalleryItem[];
}) {
  return (
    <div>
      {gelegenheden.map((g, i) => (
        <StapelKaart
          key={g.id}
          gelegenheid={g}
          fotos={tegelFotos(g)}
          index={i}
          aantal={gelegenheden.length}
        />
      ))}
    </div>
  );
}
