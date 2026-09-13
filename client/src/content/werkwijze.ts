import type { GalleryItem, WerkwijzeStapData } from "@shared/schema";
import { imageSrc } from "../lib/images";

/**
 * Hulpmiddelen bij de werkwijze-stappen.
 *
 * **De teksten stonden hier, en staan nu in de database.** Dit bestand bevatte `KORTE_STAPPEN`
 * en `LANGE_STAPPEN` als constanten: haar eigen artikel, overgetypt in TypeScript. Daarmee was
 * het het enige stuk klantcontent dat alleen een ontwikkelaar kon wijzigen -- terwijl het
 * letterlijk haar tekst is. Ze staan nu in `site_settings.werkwijze` en zijn te bewerken op
 * `/admin/teksten`.
 *
 * Wat hier blijft is de koppeling naar de foto's, want die regel is niet triviaal: geen enkele
 * stap mag twee keer hetzelfde beeld krijgen.
 */

/** De vorm die `ProcessStrip` en `ProcessStory` verwachten. */
export type ProcessStapWeergave = {
  n: string;
  title: string;
  body: string;
  imageSrc: string;
};

/**
 * Koppelt elke stap aan een foto uit de galerij.
 *
 * Twee regels, en de tweede is de belangrijkste: **geen enkele stap krijgt twee keer dezelfde
 * foto** zolang er genoeg foto's zijn. Een rij stappen waarin hetzelfde beeld twee keer staat
 * leest als een fout, ook al is het er geen.
 *
 * De stap wijst zijn foto aan met een id. Dat was eerder een zoekterm op de alt-tekst, omdat er
 * geen beheerscherm was en id's per database verschillen bij een seed; nu zij de foto zelf kiest
 * is het id de juiste sleutel. Wijst een id nergens meer heen -- de foto is verwijderd -- dan
 * valt de stap terug op de eerstvolgende ongebruikte foto in plaats van een gat te laten.
 *
 * Zijn er helemaal geen foto's, dan komt er `null` terug en laten de schermen het beeld weg. Er
 * wordt níét teruggevallen op opvulmateriaal: tot 27-08 stonden hier stockfoto's van anderen
 * tussen haar eigen werk.
 */
export function stapFotos(
  stappen: WerkwijzeStapData[],
  items: GalleryItem[],
): (string | null)[] {
  const gebruikt = new Set<number>();

  const pak = (kandidaat: GalleryItem | undefined) => {
    if (!kandidaat || gebruikt.has(kandidaat.id)) return null;
    gebruikt.add(kandidaat.id);
    return imageSrc(kandidaat);
  };

  // Eerst iedereen zijn eigen keuze gunnen, daarna pas de gaten vullen. Andersom zou een vroege
  // stap de foto kunnen inpikken die een latere stap bij naam vraagt.
  const uit: (string | null)[] = stappen.map((stap) =>
    stap.fotoItemId ? pak(items.find((i) => i.id === stap.fotoItemId)) : null,
  );

  return uit.map((src) => src ?? pak(items.find((i) => !gebruikt.has(i.id))));
}

/**
 * Van opgeslagen stappen naar wat de schermen tonen.
 *
 * Het nummer komt uit de volgorde en staat niet in de data: anders draagt een stap zijn oude
 * nummer mee zodra je hem verplaatst, en staat "03" boven de eerste.
 */
export function naarWeergave(
  stappen: WerkwijzeStapData[],
  items: GalleryItem[],
): ProcessStapWeergave[] {
  const fotos = stapFotos(stappen, items);
  return stappen.map((stap, i) => ({
    n: String(i + 1).padStart(2, "0"),
    title: stap.titel,
    body: stap.tekst,
    imageSrc: fotos[i] ?? "",
  }));
}
