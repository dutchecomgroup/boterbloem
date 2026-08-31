import { Link } from "wouter";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Check } from "lucide-react";
import { api } from "../../lib/api";
import type { Package, Product, Review, GalleryItem } from "@shared/schema";

import { formatCurrency, personenBereik } from "../../lib/utils";
import { imageSrc } from "../../lib/images";
import type { GalerijAntwoord } from "../../lib/galerij";
import { usePublicSettings } from "../../hooks/usePublicSettings";
import { BotanicalPattern } from "../../components/ornaments/BotanicalPattern";
import { FloralFrame } from "../../components/ornaments/FloralFrame";
import { SierDivider } from "../../components/ornaments/SierDivider";
import { BotanicalCorner } from "../../components/ornaments/BotanicalCorner";
import { Reveal } from "../../components/Reveal";
import { PageHeader } from "../../components/PageHeader";
import { PakketKaart, pakketFamilie, type PakketMetCover } from "../../components/public/PakketKaart";
import { GelegenheidCarrousel } from "../../components/public/GelegenheidCarrousel";

/**
 * De vier vaste taartsmaken uit `uploads/content/teksten/pakketten-en-taartprijzen.pdf`.
 *
 * Bewust hier en niet in `products`: een smaak is een keuze bij elke maat, geen artikel met een
 * eigen prijs. Ze als product opnemen zou betekenen dat er twaalf regels in de prijslijst
 * komen (vier smaken × drie maten) waarvan er elf hetzelfde bedrag hebben.
 *
 * ⚠️ Haar blogtekst noemt een ándere rij smaken ("Vanille, chocolade, Citroen & Witte chocola,
 * Aarbei"). Deze lijst uit de PDF is aangehouden omdat hij namen en combinaties geeft; de
 * tegenstrijdigheid staat als vraag in docs/klant/content-invulplan.md.
 */
const SMAKEN = [
  { naam: "Lemon Bliss", omschrijving: "Citroen & vanille" },
  { naam: "Strawberry Blush", omschrijving: "Witte chocolade & aardbei" },
  { naam: "Caramel Cocoa", omschrijving: "Chocolade & karamel" },
  { naam: "Coco Blanc", omschrijving: "Kokos, witte chocolade & hazelnoot" },
];

export default function AanbodPage() {
  const { data: settings } = usePublicSettings();

  const { data: pakketten } = useQuery({
    queryKey: ["public", "packages"],
    queryFn: () => api.get<PakketMetCover[]>("/api/public/packages"),
  });
  const { data: producten } = useQuery({
    queryKey: ["public", "products"],
    queryFn: () => api.get<Product[]>("/api/public/products"),
  });
  const { data: reviews } = useQuery({
    queryKey: ["public", "reviews"],
    queryFn: () => api.get<Review[]>("/api/public/reviews"),
  });
  const { data: gallery } = useQuery({
    queryKey: ["public", "gallery"],
    queryFn: () => api.get<GalerijAntwoord>("/api/public/gallery"),
  });

  const gelegenheden = (gallery?.categories ?? []).filter((c) => c.itemCount > 0);

  /**
   * De pakketten in hun twee families. De kleur op de kaarten zegt welke drie bij elkaar
   * horen; deze koppen zeggen waaróm. Zonder de kop is de tint versiering.
   */
  const groepen = useMemo(() => {
    const alles = pakketten ?? [];
    return [
      { sleutel: "zoet" as const, titel: "Sweet tables", regel: "Zoet, en het middelpunt van je feest.", items: alles.filter((p) => pakketFamilie(p.slug) === "zoet") },
      { sleutel: "hartig" as const, titel: "Grazing tables", regel: "Hartig, en de hele avond door te eten.", items: alles.filter((p) => pakketFamilie(p.slug) === "hartig") },
    ].filter((g) => g.items.length > 0);
  }, [pakketten]);

  /**
   * De foto naast de taart-menukaart.
   *
   * Zoeken op een fragment uit de `altText` en niet op een id: id's verschillen per database, en
   * een import die opnieuw draait geeft nieuwe. Dezelfde aanpak als `stapFotos()` in
   * `content/werkwijze.ts`.
   *
   * Eerste keus is de boterbloem-gele taart -- letterlijk de kleur van de bloem in het logo, dus
   * de meest merk-eigen taart die ze heeft. Staat die er niet, dan de eerste de beste taartfoto,
   * en anders geen foto: dan valt de tweede kolom weg in plaats van leeg te blijven.
   */
  const taartFoto = useMemo(() => {
    const items = gallery?.items ?? [];
    const zoek = (term: string) =>
      items.find((i) => (i.altText ?? "").toLowerCase().includes(term));
    return zoek("frangipani") ?? zoek("taart") ?? null;
  }, [gallery]);
  const levertijden = (settings as { levertijden?: { tekst?: string } } | undefined)?.levertijden;


  return (
    <>
      {/* ---------- Kop ---------- */}
      <PageHeader
        achtergrond="bg-section-warm"
        tag="Aanbod"
        titel={<>Sweet &amp; grazing tables</>}
        tekst="Een tafel vol zoets die het middelpunt van je feest wordt. We werken met pakketten als startpunt: een richtlijn met een vanaf-prijs, die we samen aanvullen tot het precies past bij jouw dag."
        onder={
          /*
            De gelegenheden zitten ín de kop, niet in een eigen sectie eronder.
            Twee redenen. Het verloop van `bg-section-warm` wordt per sectie opnieuw getekend,
            dus twee secties met dezelfde achtergrond gaven een harde streep dwars over de
            pagina. En een eigen sectie vraagt om een eigen kop, waardoor er twee label-plus-
            titel-paren onder elkaar stonden voordat de bezoeker iets gezien had.

            Een kop erboven is ook niet nodig: elke tegel draagt zijn eigen naam.
          */
          gelegenheden.length > 0 ? (
            /* `-mx-4 sm:-mx-6` heft de padding van `container-tight` op, zodat de strook tot de
               rand van het scherm loopt. Een rivier die op tweederde ophoudt is een rij. */
            <div className="-mx-4 mt-8 sm:-mx-6">
              <GelegenheidCarrousel gelegenheden={gelegenheden} />
              <Link
                href="/galerij"
                className="mt-3 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-sage-dark hover:underline"
              >
                Bekijk de hele galerij <ArrowRight size={14} />
              </Link>
            </div>
          ) : undefined
        }
      >
        <FloralFrame className="absolute -top-8 -right-8 md:-top-12 md:-right-12 w-32 sm:w-56 md:w-80 h-32 sm:h-56 md:h-80" color="text-sage/20" />
        <FloralFrame className="absolute -bottom-8 -left-8 md:-bottom-12 md:-left-12 rotate-180 w-24 sm:w-40 md:w-64 h-24 sm:h-40 md:h-64" color="text-blush" />
      </PageHeader>

      {/* ---------- Pakketten ---------- */}
      <section className="relative bg-linen section-y overflow-hidden">
        <BotanicalPattern opacity={0.04} />
        <div className="container-tight relative">
          {pakketten && pakketten.length > 0 ? (
            <>
              {/*
                Flexbox met `justify-center` in plaats van een raster van drie. Met vier
                pakketten belandde de vierde in een raster alleen op een nieuwe rij, links
                uitgelijnd met een leeg vak ernaast — en dat was uitgerekend Grazing Table, de
                helft van waar deze pagina over gaat. Zo staat een overblijver in het midden en
                leest hij als een keuze in plaats van als een restje.
              */}
              {/* Per familie een kop, tenzij er maar één familie actief is: "Sweet tables"
                  boven de enige rij is een mededeling zonder inhoud. */}
              <div className="space-y-12 sm:space-y-16">
                {groepen.map((groep) => (
                  <div key={groep.sleutel}>
                    {groepen.length > 1 && (
                      <div className="mb-6 text-center sm:mb-8">
                        <h2 className="text-2xl sm:text-3xl">{groep.titel}</h2>
                        <p className="mt-1.5 text-sm text-charcoal/70">{groep.regel}</p>
                      </div>
                    )}
                    <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
                      {groep.items.map((p, i) => (
                        <Reveal
                          key={p.id}
                          delay={i * 0.06}
                          /* Ook op een telefoon twee naast elkaar: één kaart over de volle
                             breedte is zo hoog dat je per scherm nauwelijks een pakket ziet,
                             en dan scroll je langs de prijzen in plaats van ze te
                             vergelijken. */
                          className="w-[calc(50%-0.5rem)] sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]"
                        >
                          <PakketKaart pakket={p} familie={groep.sleutel} />
                        </Reveal>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* "Dat rekenen we er gewoon bij" las als een waarschuwing dat het duurder wordt,
                  precies het tegenovergestelde van wat er bedoeld is. */}
              <p className="mx-auto mt-8 max-w-xl text-center text-sm text-charcoal/70">
                Elk pakket is een startpunt. Meer gasten, een extra lekkernij of een eigen
                kleurenschema? Dat is allemaal mogelijk. We kijken samen wat bij je feest past.
              </p>
            </>
          ) : (
            <div className="card py-14 text-center">
              <div className="script-accent mb-3 text-4xl">Binnenkort</div>
              <p className="mx-auto max-w-md text-sm text-charcoal/70">
                We zetten de pakketten en prijzen op dit moment op een rij. Wil je nu al weten
                wat er mogelijk is voor jouw feest? Stuur gerust een bericht.
              </p>
              <Link href="/contact" className="btn-sage mt-6">Vraag een offerte aan</Link>
            </div>
          )}
        </div>
      </section>

      {/* ---------- Goed om te weten ----------
           Deze vier vragen komen op bij het zien van een prijs, dus ze staan er direct onder. */}
      <section className="relative bg-section-sand section-y-sm overflow-hidden">
        <BotanicalPattern opacity={0.05} />
        <div className="container-tight relative">
          <div className="card mx-auto max-w-3xl">
            <div className="tag mb-4 text-center">Goed om te weten</div>
            <ul className="grid gap-4 sm:grid-cols-2">
              <WeetjeItem icoon="📅" titel="Op tijd aanvragen">
                {levertijden?.tekst ??
                  "Vraag je tafel het liefst een paar weken van tevoren aan; voor taarten kan het vaak sneller."}
              </WeetjeItem>
              <WeetjeItem icoon="🍰" titel="Taarten zijn flexibeler">
                Een losse taart heeft minder voorbereiding nodig dan een hele tafel, dus vraag
                gerust wat er nog kan.
              </WeetjeItem>
              <WeetjeItem icoon="🚚" titel="Bezorgen of afhalen">
                We bezorgen en bouwen ter plaatse op. Afhalen kan ook, dan leggen we uit hoe je
                het veilig vervoert.
              </WeetjeItem>
              <WeetjeItem icoon="💬" titel="Altijd op maat">
                Allergieën, een kleurenschema of een eigen idee? Vertel het bij de aanvraag, dan
                kijken we samen wat past.
              </WeetjeItem>
            </ul>
          </div>
        </div>
      </section>

      {/* ---------- Taarten ---------- */}
      {/* ---------- Taarten ---------- */}
      {/*
        Als menukaart, met een foto ernaast.

        Dit was drie prijsregels en een raster smaken op een vlakke `bg-linen`, direct gevolgd
        door nóg een `bg-linen`-sectie: een lange witte strook zonder beeld waarin de pagina
        stilviel. De menukaart-vorm is niet willekeurig gekozen -- hij staat op het
        huisstijl-moodboard dat de klant zelf aanleverde, en haar vier smaken (Lemon Bliss,
        Strawberry Blush, ...) lezen al als een menu.
      */}
      <section className="relative overflow-hidden bg-section-sage section-y">
        <BotanicalPattern opacity={0.05} />
        <BotanicalCorner position="tl" color="text-sage/25" />
        <BotanicalCorner position="br" color="text-sage/25" />

        <div className="container-tight relative">
          <div className="mb-10 text-center">
            <div className="tag mb-3">Ook mogelijk</div>
            <h2 className="text-3xl sm:text-4xl">Taarten</h2>
            <div className="mt-5"><SierDivider className="!max-w-[180px]" /></div>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-charcoal/75 sm:text-base">
              Een taart zonder tafel eromheen kan natuurlijk ook: voor een verjaardag, een
              bruiloft of gewoon omdat het kan.
            </p>
          </div>

          {/* Zonder foto geen tweede kolom: dan zou de kaart op halve breedte staan met een
              leeg vlak ernaast. */}
          {/* `items-center` en geen `items-start`: de menukaart is korter dan de staande foto,
              en bovenaan uitgelijnd hangt hij scheef in het blok. */}
          <div className={`grid items-center gap-8 lg:gap-12 ${taartFoto ? "lg:grid-cols-[0.8fr_1fr]" : "mx-auto max-w-2xl"}`}>
            {taartFoto && (
              <Reveal>
                <div className="relative aspect-[16/10] overflow-hidden rounded-2xl shadow-xl ring-1 ring-sage/20 lg:aspect-[3/4]">
                  <img
                    src={imageSrc(taartFoto)}
                    alt={taartFoto.altText ?? "Taart van Atelier Boterbloem"}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="pointer-events-none absolute inset-3 rounded-xl border border-linen/30" />
                </div>
              </Reveal>
            )}

            <Reveal delay={0.08}>
              {/* Eén paneel in plaats van twee losse kaarten: maten en smaken horen bij elkaar,
                  je kiest ze in één adem. */}
              <div className="rounded-2xl bg-linen/80 p-6 shadow-sm ring-1 ring-sage/20 backdrop-blur-sm sm:p-8">
                {producten && producten.length > 0 ? (
                  <ul className="space-y-4">
                    {producten.map((p) => (
                      <li key={p.id} className="flex items-baseline gap-3">
                        <div className="shrink-0">
                          <div className="font-display text-lg leading-tight text-charcoal sm:text-xl">
                            {p.name}
                          </div>
                          {p.description && (
                            <div className="mt-0.5 text-xs text-charcoal/70">{p.description}</div>
                          )}
                        </div>
                        {/* De stippellijn van een menukaart: hij vult de ruimte en laat het oog
                            van de naam naar het bedrag lopen. `aria-hidden`, want een
                            schermlezer heeft aan de leesvolgorde genoeg. */}
                        <span
                          aria-hidden
                          className="mx-1 min-w-[1.5rem] flex-1 translate-y-[-0.2em] border-b border-dotted border-charcoal/25"
                        />
                        <div className="shrink-0 whitespace-nowrap font-display text-lg text-sage-deep sm:text-xl">
                          {formatCurrency(Number(p.basePrice))}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-charcoal/75">
                    De taartprijzen staan nog niet online. Vraag gerust naar de mogelijkheden.
                  </p>
                )}

                {producten && producten.length > 0 && (
                  <p className="mt-3 text-xs text-charcoal/60">
                    Vanaf-prijzen per taart. De uiteindelijke prijs hangt af van het ontwerp.
                  </p>
                )}

                {/* De vier vaste smaken. Geen producten in de database: een smaak is een keuze
                    bij elke maat, geen apart artikel met een eigen prijs. Bron: haar eigen PDF. */}
                <div className="mt-7 border-t border-sage/25 pt-6">
                  <div className="tag mb-4">Smaken</div>
                  <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                    {SMAKEN.map((smaak) => (
                      <div key={smaak.naam}>
                        <dt className="font-display text-base text-charcoal sm:text-lg">{smaak.naam}</dt>
                        <dd className="text-xs text-charcoal/70 sm:text-sm">{smaak.omschrijving}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="mt-5 text-xs text-charcoal/65">
                    Iets anders in gedachten? Vraag het gerust, er kan vaak meer.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- Reviews ---------- */}
      {reviews && reviews.length > 0 && (
        <section className="relative bg-linen section-y overflow-hidden">
          <BotanicalPattern opacity={0.04} />
          <div className="container-tight relative">
            <div className="text-center mb-10">
              <div className="tag mb-3">Ervaringen</div>
              <h2 className="text-3xl sm:text-4xl">Wat klanten zeggen</h2>
            </div>
            {/* Bij één of twee reviews centreren; anders staat er één kaart eenzaam links
                in een driekolomsraster. */}
            <div className={`grid gap-6 ${
              reviews.length === 1 ? "max-w-xl mx-auto"
              : reviews.length === 2 ? "md:grid-cols-2 max-w-3xl mx-auto"
              : "md:grid-cols-3"
            }`}>
              {reviews.slice(0, 3).map((r, i) => (
                <Reveal key={r.id} delay={i * 0.06}>
                  <blockquote className="card h-full">
                    <p className="text-charcoal/75 leading-relaxed text-sm">{r.body}</p>
                    <footer className="mt-4 text-xs">
                      <span className="font-medium">{r.authorName}</span>
                      {r.eventType && <span className="text-charcoal/50"> · {r.eventType}</span>}
                    </footer>
                  </blockquote>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------- Slot ---------- */}
      <section className="relative bg-section-diep text-linen section-y overflow-hidden">
        <BotanicalPattern opacity={0.07} className="text-linen" />
        <BotanicalCorner position="tl" color="text-linen/25" />
        <BotanicalCorner position="br" color="text-linen/25" />
        <div className="container-narrow relative text-center">
          <div className="script-accent text-4xl sm:text-5xl mb-4 leading-none">Klaar om te plannen?</div>
          <p className="text-charcoal/70 mb-8 leading-relaxed text-sm sm:text-base">
            Vertel ons over je feest: de datum, het aantal gasten en wat je voor je ziet.
            We denken graag mee.
          </p>
          <Link href="/contact" className="btn-sage">
            Vraag een offerte aan <ArrowRight size={16} />
          </Link>
          <div className="mt-8 sm:mt-10"><SierDivider color="text-linen/50" /></div>
        </div>
      </section>
    </>
  );
}

/** Eén punt in de "goed om te weten"-kaart. */
function WeetjeItem({
  icoon,
  titel,
  children,
}: {
  icoon: string;
  titel: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span className="text-lg leading-none" aria-hidden>{icoon}</span>
      <div>
        <div className="text-sm font-medium text-charcoal">{titel}</div>
        <p className="mt-0.5 text-sm leading-relaxed text-charcoal/75">{children}</p>
      </div>
    </li>
  );
}
