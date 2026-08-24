import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Check } from "lucide-react";
import { api } from "../../lib/api";
import type { Package, Product, Review, GalleryItem } from "@shared/schema";

/** De publieke route levert de coverfoto mee; `null` als er geen cover gekozen is. */
type PakketMetCover = Package & { cover: GalleryItem | null };
import { formatCurrency } from "../../lib/utils";
import { imageSrc } from "../../lib/images";
import { DEMO_NESTED, heeftEchteContent } from "../../lib/demoGallery";
import { usePublicSettings } from "../../hooks/usePublicSettings";
import { BotanicalPattern } from "../../components/ornaments/BotanicalPattern";
import { FloralFrame } from "../../components/ornaments/FloralFrame";
import { GoldDivider } from "../../components/ornaments/GoldDivider";
import { BotanicalCorner } from "../../components/ornaments/BotanicalCorner";
import { Reveal } from "../../components/Reveal";
import { PageHeader } from "../../components/PageHeader";

interface GalleryResponse { categories: typeof DEMO_NESTED; items: unknown[] }

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
    queryFn: () => api.get<GalleryResponse>("/api/public/gallery"),
  });

  const cats = heeftEchteContent(gallery?.items) ? (gallery?.categories ?? []) : DEMO_NESTED;
  const levertijden = (settings as { levertijden?: { tekst?: string } } | undefined)?.levertijden;

  return (
    <>
      {/* ---------- Kop ---------- */}
      <PageHeader
        achtergrond="bg-section-warm"
        tag="Aanbod"
        titel={<>Sweet &amp; grazing tables</>}
        tekst="Een tafel vol zoets die het middelpunt van je feest wordt. We werken met pakketten als startpunt — een richtlijn met een vanaf-prijs, die we samen aanvullen tot het precies past bij jouw dag."
      >
        <FloralFrame className="absolute -top-8 -right-8 md:-top-12 md:-right-12 w-32 sm:w-56 md:w-80 h-32 sm:h-56 md:h-80" color="text-gold/20" />
        <FloralFrame className="absolute -bottom-8 -left-8 md:-bottom-12 md:-left-12 rotate-180 w-24 sm:w-40 md:w-64 h-24 sm:h-40 md:h-64" color="text-blush" />
      </PageHeader>

      {/* ---------- Pakketten ---------- */}
      <section className="relative bg-cream section-y overflow-hidden">
        <BotanicalPattern opacity={0.04} />
        <div className="container-tight relative">
          {pakketten && pakketten.length > 0 ? (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pakketten.map((p, i) => (
                  <Reveal key={p.id} delay={i * 0.06}>
                    <article className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gold/10 transition-shadow hover:shadow-xl">
                      {/* Coverfoto. Zonder cover een zachte kleurvlak in plaats van een gat —
                          de kaarten blijven dan even hoog naast elkaar. */}
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

                      <div className="flex flex-1 flex-col p-6 sm:p-7">
                        <h2 className="text-2xl sm:text-3xl">{p.name}</h2>
                        {p.tagline && <p className="mt-1 text-sm text-charcoal/70">{p.tagline}</p>}

                        {/* De vanaf-prijs is waar de bezoeker op afkomt, dus het zwaarste
                            element op de kaart. Een pakket zonder prijs mag niet als
                            "vanaf € 0,00" op de site staan — dat leest als gratis. */}
                        <div className="mt-4 border-y border-gold/20 py-3">
                          {Number(p.priceFrom) > 0 ? (
                            <div className="flex items-baseline gap-2">
                              <span className="text-[10px] uppercase tracking-[0.2em] text-charcoal/60">vanaf</span>
                              <span className="font-display text-4xl leading-none text-gold-dark">
                                {formatCurrency(Number(p.priceFrom))}
                              </span>
                              {p.priceUnit === "per_persoon" && (
                                <span className="text-sm text-charcoal/70">p.p.</span>
                              )}
                            </div>
                          ) : (
                            <span className="font-display text-2xl text-gold-dark">Prijs op aanvraag</span>
                          )}
                          {(p.personsMin || p.personsMax) && (
                            <div className="mt-1 text-xs text-charcoal/60">
                              {p.personsMin ?? "?"}–{p.personsMax ?? "meer"} personen
                            </div>
                          )}
                        </div>

                        {p.description && (
                          <p className="mt-4 text-sm leading-relaxed text-charcoal/75">{p.description}</p>
                        )}

                        {p.includes.length > 0 && (
                          <ul className="mt-5 space-y-2 text-sm text-charcoal/80">
                            {p.includes.map((r, j) => (
                              <li key={j} className="flex gap-2">
                                <Check size={16} className="mt-0.5 shrink-0 text-gold" />
                                <span>{r}</span>
                              </li>
                            ))}
                          </ul>
                        )}

                        {/* `mt-auto`: de knop staat onderaan de kaart, ook als de ene kaart
                            meer regels heeft dan de andere. */}
                        <Link href={`/contact?pakket=${p.slug}`} className="btn-gold mt-auto w-full pt-3">
                          Vraag aan
                        </Link>
                      </div>
                    </article>
                  </Reveal>
                ))}
              </div>

              {/* "Dat rekenen we er gewoon bij" las als een waarschuwing dat het duurder
                  wordt — precies het tegenovergestelde van wat er bedoeld is. */}
              <p className="text-center text-charcoal/70 text-sm mt-8 max-w-xl mx-auto">
                Elk pakket is een startpunt. Meer gasten, een extra lekkernij of een eigen
                kleurenschema? Dat is allemaal mogelijk — we kijken samen wat bij je feest past.
              </p>
            </>
          ) : (
            <div className="card text-center py-14">
              <div className="script-accent text-4xl mb-3">Binnenkort</div>
              <p className="text-charcoal/70 max-w-md mx-auto text-sm">
                We zetten de pakketten en prijzen op dit moment op een rij. Wil je nu al weten
                wat er mogelijk is voor jouw feest? Stuur gerust een bericht.
              </p>
              <Link href="/contact" className="btn-gold mt-6">Vraag een offerte aan</Link>
            </div>
          )}
        </div>
      </section>

      {/* ---------- Goed om te weten ---------- */}
      {/* Stond onderaan als zwevende tekst zonder kader. Deze vier vragen komen op bij het
          zien van een prijs, dus staan ze er direct onder — en in een kaart, zodat het één
          blok is in plaats van een losse mededeling. */}
      <section className="relative bg-section-butter section-y-sm overflow-hidden">
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
                Een losse taart heeft minder voorbereiding nodig dan een hele tafel — vraag
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

      {/* ---------- Gelegenheden ---------- */}
      {cats.filter((c) => c.itemCount > 0).length > 0 && (
        <section className="relative bg-section-blush section-y overflow-hidden">
          <BotanicalPattern opacity={0.05} />
          <div className="container-tight relative">
            <div className="text-center mb-10">
              <div className="tag mb-3">Gelegenheden</div>
              <h2 className="text-3xl sm:text-4xl">Waar we tables voor maken</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {cats.filter((c) => c.itemCount > 0).slice(0, 6).map((c) => (
                <Link key={c.id} href={`/galerij/${c.slug}`}
                  className="group relative aspect-[3/2] overflow-hidden rounded-xl ring-1 ring-gold/10">
                  {c.cover && (
                    <img src={imageSrc(c.cover)} alt={c.name} loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 to-transparent" />
                  <div className="absolute bottom-4 left-5 font-display text-2xl text-cream drop-shadow">
                    {c.name}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------- Taarten ---------- */}
      <section className="relative bg-cream section-y-sm overflow-hidden">
        <BotanicalPattern opacity={0.04} />
        <div className="container-narrow relative">
          <div className="text-center mb-8">
            <div className="tag mb-3">Ook mogelijk</div>
            <h2 className="text-3xl sm:text-4xl">Taarten</h2>
            <p className="mt-3 text-sm leading-relaxed text-charcoal/75 sm:text-base">
              Een taart zonder tafel eromheen kan natuurlijk ook — voor een verjaardag, een
              bruiloft of gewoon omdat het kan.
            </p>
          </div>

          {producten && producten.length > 0 ? (
            <div className="card divide-y divide-charcoal/5 p-0">
              {producten.map((p) => (
                <div key={p.id} className="flex items-baseline justify-between gap-4 px-5 py-3.5">
                  <div>
                    <div className="font-medium">{p.name}</div>
                    {p.description && <div className="mt-0.5 text-xs text-charcoal/70">{p.description}</div>}
                  </div>
                  <div className="text-sm text-gold-dark whitespace-nowrap">
                    vanaf {formatCurrency(Number(p.basePrice))}
                    <span className="text-charcoal/65"> / {p.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card text-center">
              <p className="text-sm text-charcoal/75">
                De taartprijzen staan nog niet online. Vraag gerust naar de mogelijkheden.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ---------- Reviews ---------- */}
      {reviews && reviews.length > 0 && (
        <section className="relative bg-cream section-y overflow-hidden">
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
      <section className="relative bg-section-blush section-y overflow-hidden">
        <BotanicalPattern opacity={0.05} />
        <BotanicalCorner position="tl" color="text-gold/30" />
        <BotanicalCorner position="br" color="text-gold/30" />
        <div className="container-narrow relative text-center">
          <div className="script-accent text-4xl sm:text-5xl mb-4 leading-none">Klaar om te plannen?</div>
          <p className="text-charcoal/70 mb-8 leading-relaxed text-sm sm:text-base">
            Vertel ons over je feest — de datum, het aantal gasten en wat je voor je ziet.
            We denken graag mee.
          </p>
          <Link href="/contact" className="btn-gold">
            Vraag een offerte aan <ArrowRight size={16} />
          </Link>
          <div className="mt-8 sm:mt-10"><GoldDivider /></div>
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
