import type { ReactNode } from "react";
import { BotanicalPattern } from "./ornaments/BotanicalPattern";
import { SierDivider } from "./ornaments/SierDivider";

/**
 * De kop van een publieke pagina over de volle breedte.
 *
 * Stond in viervoud in de pagina's zelf en liep uit de pas: links uitgelijnd terwijl de inhoud
 * eronder gecentreerd staat, en met een verschillende hoeveelheid ruimte eronder. Eén component
 * houdt dat gelijk.
 *
 * **Alleen voor koppen over de volle breedte.** `/over` en `/contact` zetten hun kop naast een
 * portret of een formulier; daar is links uitgelijnd juist goed, en die pagina's gebruiken dit
 * dus bewust niet.
 *
 * De ruimte onder de kop is klein gehouden: de sectie eronder brengt zijn eigen `section-y`
 * mee, en die twee bij elkaar gaven een gat van bijna tweehonderd pixels waarin niets staat.
 */
export function PageHeader({
  tag,
  titel,
  tekst,
  achtergrond = "bg-section-blush",
  boven,
  onder,
  children,
}: {
  tag: string;
  titel: ReactNode;
  tekst?: string;
  /** Een van de `bg-section-*`-klassen uit `index.css`. */
  achtergrond?: string;
  /** Bijvoorbeeld een terug-link, boven het label. */
  boven?: ReactNode;
  /** Onder de tekst — knoppen, of niets. */
  onder?: ReactNode;
  /** Sier-elementen die absoluut in de sectie gepositioneerd worden. */
  children?: ReactNode;
}) {
  return (
    <section className={`relative overflow-hidden ${achtergrond} pt-10 pb-8 sm:pt-16 sm:pb-10`}>
      <BotanicalPattern opacity={0.05} />
      {children}
      <div className="container-tight relative text-center">
        {boven}
        <div className="tag mb-3">{tag}</div>
        {/* Een slag groter dan voorheen: de editoriale taal van de site leunt op het
            contrast tussen een grote Playfair-kop en de kleine hoofdletter-labels. */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl">{titel}</h1>
        <div className="mb-4 mt-4 sm:mb-5 sm:mt-6">
          <SierDivider className="!max-w-[180px]" />
        </div>
        {tekst && (
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-charcoal/75 sm:text-base">
            {tekst}
          </p>
        )}
        {onder}
      </div>
    </section>
  );
}
