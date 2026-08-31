import type { GalleryAlbum, GalleryCategory, GalleryItem } from "@shared/schema";

/**
 * De vorm die `GET /api/public/gallery` teruggeeft.
 *
 * Deze types stonden tot 27-08 in `lib/demoGallery.ts` en heetten `DemoCategory` en
 * `DemoAlbum` — de opvulling was toevallig de eerste die ze nodig had, en de echte pagina's
 * leenden ze. Toen de demo verdween, verdween daarmee bijna de enige plek waar de vorm van
 * een publiek antwoord beschreven stond.
 *
 * Ze horen bij het antwoord, niet bij de opvulling. `nest()` in `server/routes/public.ts`
 * bouwt precies dit; wijzigt daar iets, dan hoort het hier mee te veranderen.
 */

export type PubliekAlbum = GalleryAlbum & {
  items: GalleryItem[];
  cover: GalleryItem | null;
};

export type PubliekeGelegenheid = GalleryCategory & {
  albums: PubliekAlbum[];
  /**
   * Foto's die rechtstreeks onder de gelegenheid hangen, zonder event ertussen.
   *
   * Dit is sinds de aanlevering van de klant (27-08) de normale situatie en niet de
   * uitzondering: haar foto's zijn niet per feest gegroepeerd, dus ze staan los onder hun
   * gelegenheid. De eventlaag komt eronder zodra er materiaal per feest is.
   */
  losseItems: GalleryItem[];
  /** De omslag: `cover_item_id` van de gelegenheid, anders de eerste beschikbare foto. */
  cover: GalleryItem | null;
  /** Foto's in events plus losse foto's — waarop een lege gelegenheid herkend wordt. */
  itemCount: number;
};

export interface GalerijAntwoord {
  categories: PubliekeGelegenheid[];
  items: GalleryItem[];
}
