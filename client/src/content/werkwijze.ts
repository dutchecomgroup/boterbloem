import type { GalleryItem } from "@shared/schema";
import { imageSrc } from "../lib/images";

/**
 * De werkwijze, in haar eigen woorden.
 *
 * **Herkomst.** De klant leverde één geschreven artikel aan, *"Van eerste idee tot taart op
 * tafel"* (`uploads/content/teksten/artikel-van-idee-tot-taart.pdf`). Dat is als blog
 * aangeleverd, maar een blog met één artikel is een leeg archief met een inhoudsopgave. De
 * tekst is bovendien geen nieuwsbericht maar een procesbeschrijving — precies wat haar eigen
 * huisstijl-moodboard onder `WERKWIJZE` in de navigatie zet, met vijf iconen. Ze had de pagina
 * dus zelf al bedacht; alleen de tekst ervoor lag los.
 *
 * Eén tekst, twee dieptes, één bron:
 * - `KORTE_STAPPEN` — de vijf van haar moodboard, één zin elk, voor de strip op de homepage.
 * - `LANGE_STAPPEN` — haar zeven kopjes met de bijbehorende alinea's, voor `/werkwijze`.
 *
 * **Wat er aan haar tekst veranderd is.** Zo min mogelijk. Waar ze "de taart" schrijft terwijl
 * de zin net zo goed over een sweet table gaat, staat er nu iets breders — de site kopt sinds
 * de meeting van 24-08 op tafels, en een werkwijze die alleen over taarten gaat leest dan als
 * een andere onderneming. Elke aanpassing staat in `docs/klant/content-invulplan.md`, zodat ze
 * kan nakijken of ze zich er nog in herkent.
 */

export interface WerkwijzeStap {
  /** "01" t/m "07" — het opschrift boven de stap. */
  n: string;
  title: string;
  body: string;
  /**
   * Waar de foto bij deze stap vandaan komt: een fragment uit de `altText` van een van haar
   * eigen foto's.
   *
   * Bewust een zoekterm en geen id: id's verschillen per database, en een import die opnieuw
   * draait geeft nieuwe. De alt-teksten staan vast in `scripts/import-klantfotos.ts` en zijn
   * per foto uniek. Levert het zoeken niets op, dan valt `stapFotos()` terug op de volgorde,
   * zodat er nooit een gat in de rij staat.
   */
  zoek: string;
}

/** Vijf stappen, zoals ze ze zelf op haar moodboard zette. Eén zin per stap. */
export const KORTE_STAPPEN: WerkwijzeStap[] = [
  {
    n: "01",
    title: "Aanvraag",
    body:
      "Je stuurt een berichtje met de datum, het aantal gasten en waar je aan denkt. Een foto of een bord vol inspiratie mag ook.",
    zoek: "monsterabladeren",
  },
  {
    n: "02",
    title: "Kennismaking",
    body:
      "We bespreken de wensen: hoe groot het moet worden, voor hoeveel personen, welke stijl erbij past en welke smaak het wordt.",
    zoek: "geel gestreept",
  },
  {
    n: "03",
    title: "Offerte",
    body:
      "Je krijgt een voorstel met wat erin zit en wat het kost. Pas als dat klopt, leggen we de datum vast.",
    zoek: "gezichtsvormige",
  },
  {
    n: "04",
    title: "Ontwerp",
    body:
      "Kleuren, vormen, decoratie en details worden één geheel. Een schets laat vooraf zien waar we naartoe werken.",
    zoek: "bovenaf",
  },
  {
    n: "05",
    title: "Levering & opbouw",
    body:
      "Alles wordt vers gemaakt, zorgvuldig verpakt en op locatie opgebouwd. Jij hoeft er niets meer aan te doen.",
    zoek: "taartdoos",
  },
];

/** Haar zeven kopjes met de bijbehorende alinea's, vrijwel woordelijk. */
export const LANGE_STAPPEN: WerkwijzeStap[] = [
  {
    n: "01",
    title: "Alles begint met een idee",
    body:
      "Vaak kom je met een foto, een bord vol inspiratie of alleen een paar losse ideeën. Misschien een bepaalde kleur, bloemen, een thema of juist een bepaalde sfeer. Samen bespreken we wat de wensen zijn. Hoe groot moet het worden? Voor hoeveel personen? Welke stijl past erbij? En natuurlijk: welke smaak gaat het worden?",
    zoek: "monsterabladeren",
  },
  {
    n: "02",
    title: "Van inspiratie naar een concreet ontwerp",
    body:
      "Als alle wensen duidelijk zijn, begint voor mij het leukste gedeelte: het ontwerp. Ik kijk naar de kleuren, vormen, decoratie en details en maak daar een concreet ontwerp van. Zo ontstaat er van een verzameling ideeën uiteindelijk één geheel. Een schets helpt om vooraf precies voor ogen te hebben waar we naartoe werken. Soms verandert er nog iets, maar juist dat overleg maakt het persoonlijk.",
    zoek: "bovenaf",
  },
  {
    n: "03",
    title: "Tijd om in te kopen",
    body:
      "Wanneer het ontwerp en de smaken vaststaan, begint de voorbereiding. De ingrediënten worden ingekocht en alle decoratie wordt verzameld. Denk aan chocolade, boter, eieren en verse ingrediënten, maar ook aan kartons, dozen, linten en natuurlijk alle details die het uiteindelijk compleet maken.",
    zoek: "gezichtsvormige",
  },
  {
    n: "04",
    title: "Bakken, vullen en opbouwen",
    body:
      "Dan is het eindelijk tijd om de keuken in te duiken. De lagen worden gebakken en zodra alles goed is afgekoeld, begint het opbouwen. De lagen worden gevuld, gestapeld en afgesmeerd, en vervolgens krijgt het zijn definitieve vorm. Dit is het moment waarop de schets langzaam werkelijkheid begint te worden.",
    zoek: "twee handen",
  },
  {
    n: "05",
    title: "De details maken het af",
    body:
      "Daarna komt het decoreren. Bloemen, strikjes, chocolade, parels, tekst of andere persoonlijke details worden één voor één aangebracht. Juist de kleine details zorgen ervoor dat het echt van jou wordt. En natuurlijk wordt alles nog even gecontroleerd: klopt de kleur, staat alles recht, en ziet het eruit zoals we vooraf hadden bedacht?",
    zoek: "zwarte strikken",
  },
  {
    n: "06",
    title: "Klaarmaken voor afhalen",
    body:
      "Als alles helemaal klaar is, wordt het zorgvuldig verpakt. De taart gaat veilig in een passende doos en wordt gekoeld bewaard tot het moment van afhalen. Want na al die uren werk wil je natuurlijk maar één ding: dat alles heelhuids op de feestlocatie aankomt.",
    zoek: "taartdoos",
  },
  {
    n: "07",
    title: "En dan is het zover",
    body:
      "Wat begon als een berichtje, een paar inspiratiebeelden en een aantal wensen, staat klaar om onderdeel te worden van jouw bijzondere moment.",
    zoek: "kaarslicht",
  },
];

/**
 * Koppelt elke stap aan een foto uit de galerij.
 *
 * Twee regels, en de tweede is de belangrijkste: **geen enkele stap krijgt twee keer dezelfde
 * foto** zolang er genoeg foto's zijn. Een rij stappen waarin hetzelfde beeld twee keer staat
 * leest als een fout, ook al is het er geen.
 *
 * Zijn er helemaal geen foto's — een verse database, of alles verwijderd — dan komt er `null`
 * terug en laten de schermen het beeld weg. Er wordt níét teruggevallen op opvulmateriaal:
 * tot 27-08 stonden hier stockfoto's van anderen tussen haar eigen werk.
 */
export function stapFotos(stappen: WerkwijzeStap[], items: GalleryItem[]): (string | null)[] {
  const gebruikt = new Set<number>();

  const pak = (kandidaat: GalleryItem | undefined) => {
    if (!kandidaat || gebruikt.has(kandidaat.id)) return null;
    gebruikt.add(kandidaat.id);
    return imageSrc(kandidaat);
  };

  // Eerst iedereen zijn eigen zoekterm gunnen, daarna pas de gaten vullen. Andersom zou een
  // vroege stap de foto kunnen inpikken die een latere stap bij naam vraagt.
  const uit: (string | null)[] = stappen.map((stap) =>
    pak(items.find((i) => (i.altText ?? "").toLowerCase().includes(stap.zoek.toLowerCase()))),
  );

  return uit.map((src) => src ?? pak(items.find((i) => !gebruikt.has(i.id))));
}
