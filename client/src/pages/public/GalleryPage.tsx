import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "wouter";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { api } from "../../lib/api";
import type { GalleryItem } from "@shared/schema";
import { imageSrc } from "../../lib/images";
import { DEMO_NESTED, heeftEchteContent, type DemoCategory } from "../../lib/demoGallery";
import { BotanicalPattern } from "../../components/ornaments/BotanicalPattern";
import { BotanicalCorner } from "../../components/ornaments/BotanicalCorner";
import { GoldDivider } from "../../components/ornaments/GoldDivider";
import { Reveal } from "../../components/Reveal";
import { PageHeader } from "../../components/PageHeader";
import { FotoScrim, FOTO_TEKST_SCHADUW } from "../../components/FotoScrim";
import { FotoCyclus } from "../../components/FotoCyclus";

interface GalleryResponse {
  categories: DemoCategory[];
  items: GalleryItem[];
}

/**
 * Drie niveaus, gelijk aan het beheerpaneel en aan hoe je erover praat:
 * `/galerij` (gelegenheden) → `/galerij/babyshower` (events) → `/galerij/babyshower/lisa`.
 *
 * Elk event heeft daarmee een eigen webadres, zodat je één feest kunt delen zonder de hele
 * gelegenheid mee te sturen.
 */
export default function GalleryPage() {
  const params = useParams<{ slug?: string; albumSlug?: string }>();
  if (params.slug && params.albumSlug) {
    return <EventPagina slug={params.slug} albumSlug={params.albumSlug} />;
  }
  return params.slug ? <GelegenheidPagina slug={params.slug} /> : <OverzichtPagina />;
}

/**
 * De foto's die een gelegenheid-tegel doorloopt: de gekozen cover eerst, daarna alles uit de
 * events eronder. Ontdubbeld, want de cover zit meestal ook in een event, en dan zou hij twee
 * keer voorbijkomen in dezelfde ronde.
 *
 * Begrensd op twaalf: elke foto in de tegel wordt ingeladen zodra hij aan de beurt is, en een
 * gelegenheid met honderd foto's hoort geen honderd verzoeken op te leveren voor één vlak.
 */
function tegelFotos(c: DemoCategory): GalleryItem[] {
  const uitEvents = c.albums.flatMap((a) => a.items);
  const alles = c.cover ? [c.cover, ...uitEvents] : uitEvents;
  const gezien = new Set<number>();
  return alles.filter((f) => !gezien.has(f.id) && gezien.add(f.id)).slice(0, 12);
}

/** Eén gelegenheid met haar events en foto's — gedeeld door de twee pagina's eronder. */
function useGelegenheid(slug: string) {
  const { data, isLoading } = useQuery({
    queryKey: ["public", "gallery", slug],
    queryFn: () => api.get<{ category: DemoCategory }>(`/api/public/gallery/${slug}`),
    retry: false,
  });
  const demo = DEMO_NESTED.find((c) => c.slug === slug) ?? null;
  const echt = data?.category && data.category.itemCount > 0;
  return { cat: echt ? data!.category : demo, isLoading };
}

function NietGevonden() {
  return (
    <div className="container-tight py-32 text-center">
      <h1 className="mb-4 text-4xl">Niet gevonden</h1>
      <p className="mb-6 text-sm text-charcoal/75">
        Deze pagina bestaat niet (meer). Misschien is hij hernoemd of verwijderd.
      </p>
      <Link href="/galerij" className="text-gold underline">Terug naar de galerij</Link>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* /galerij — tegels per gelegenheid                                   */
/* ------------------------------------------------------------------ */

function OverzichtPagina() {
  const { data, isLoading } = useQuery({
    queryKey: ["public", "gallery"],
    queryFn: () => api.get<GalleryResponse>("/api/public/gallery"),
  });

  const echt = heeftEchteContent(data?.items);
  const categories = echt ? (data?.categories ?? []) : DEMO_NESTED;
  const zichtbaar = categories.filter((c) => c.itemCount > 0);

  return (
    <>
      <Kop
        tag="Galerij"
        titel="Ons werk"
        tekst="Kies een gelegenheid en bekijk wat we eerder maakten. Per gelegenheid zie je meerdere feesten, zodat je een idee krijgt van wat er mogelijk is."
      />

      <section className="relative bg-cream section-y overflow-hidden">
        <BotanicalPattern opacity={0.04} />
        <div className="container-tight relative">
          {isLoading ? (
            <div className="text-center py-20 text-charcoal/40">Laden…</div>
          ) : zichtbaar.length === 0 ? (
            <div className="card text-center text-charcoal/50 py-20">Nog geen werk om te tonen.</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {zichtbaar.map((c, i) => (
                <Reveal key={c.id} delay={i * 0.05}>
                  <Link
                    href={`/galerij/${c.slug}`}
                    className="group block rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-xl transition-all ring-1 ring-gold/10"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-blush/30">
                      {/*
                        Wisselt door de foto's van álle events onder deze gelegenheid. Eén
                        vaste cover liet de bezoeker maar één feest zien, terwijl er tien
                        onder zitten. De cover blijft vooraan staan: dat is de foto die
                        bewust gekozen is, en die hoort als eerste in beeld te komen.
                      */}
                      <FotoCyclus
                        fotos={tegelFotos(c)}
                        alt={c.name}
                        vertraging={i * 900}
                        periode={5400}
                        className="transition-transform duration-700 group-hover:scale-105"
                      />
                      <FotoScrim />
                      <div
                        className={`absolute bottom-4 left-5 right-5 z-30 font-display text-2xl leading-tight text-cream sm:text-3xl ${FOTO_TEKST_SCHADUW}`}
                      >
                        {c.name}
                      </div>
                    </div>
                    {c.description && (
                      <p className="p-5 text-sm text-charcoal/70 leading-relaxed">{c.description}</p>
                    )}
                  </Link>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* /galerij/:slug — de events binnen één gelegenheid                   */
/* ------------------------------------------------------------------ */

function GelegenheidPagina({ slug }: { slug: string }) {
  const [lightbox, setLightbox] = useState<{ items: GalleryItem[]; index: number } | null>(null);
  const { cat, isLoading } = useGelegenheid(slug);

  if (isLoading) {
    return <div className="container-tight py-32 text-center text-charcoal/70">Laden…</div>;
  }
  if (!cat) return <NietGevonden />;

  const albums = cat.albums.filter((a) => a.items.length > 0);
  const los = cat.losseItems ?? [];

  return (
    <>
      <Kop tag="Galerij" titel={cat.name} tekst={cat.description ?? undefined} terug />

      <section className="relative bg-cream section-y-sm overflow-hidden">
        <BotanicalPattern opacity={0.04} />
        <div className="container-tight relative space-y-16">
          {albums.length === 0 && los.length === 0 && (
            <div className="card py-20 text-center text-charcoal/70">
              Nog geen foto&apos;s bij deze gelegenheid.
            </div>
          )}

          {/* Tegels per event, dezelfde vorm als de gelegenheid-tegels op /galerij. Alle
              events onder elkaar mét al hun foto's maakte van deze pagina een eindeloze rol
              waarin je één feest niet kon aanwijzen — en niet kon delen. */}
          {albums.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {albums.map((album, i) => (
                <Reveal key={album.id} delay={i * 0.05}>
                  <Link
                    href={`/galerij/${cat.slug}/${album.slug}`}
                    className="group block overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gold/10 transition-all hover:shadow-xl"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-blush/30">
                      {/* Ook hier wisselen, nu door de foto's van dít feest. */}
                      <FotoCyclus
                        fotos={album.items.slice(0, 12)}
                        alt={album.title}
                        vertraging={i * 900}
                        periode={5400}
                        className="transition-transform duration-700 group-hover:scale-105"
                      />
                      <FotoScrim />
                      <div className="absolute bottom-4 left-5 right-5 z-30 text-cream">
                        <div className={`font-display text-2xl sm:text-3xl leading-tight ${FOTO_TEKST_SCHADUW}`}>
                          {album.title}
                        </div>
                        {album.eventDate && (
                          <div className={`mt-1 text-xs uppercase tracking-[0.15em] text-cream/85 ${FOTO_TEKST_SCHADUW}`}>
                            {maandJaar(album.eventDate)}
                          </div>
                        )}
                      </div>
                    </div>
                    {album.description && (
                      <p className="p-5 text-sm leading-relaxed text-charcoal/75">{album.description}</p>
                    )}
                  </Link>
                </Reveal>
              ))}
            </div>
          )}

          {los.length > 0 && (
            <Reveal>
              <article>
                <h2 className="mb-5 text-center text-2xl sm:text-3xl">Meer werk</h2>
                <FotoRaster items={los} onOpen={(index) => setLightbox({ items: los, index })} />
              </article>
            </Reveal>
          )}

          <div className="text-center pt-4">
            <GoldDivider />
            <p className="mt-8 text-charcoal/70 text-sm sm:text-base">
              Iets gezien dat past bij jouw feest?
            </p>
            <Link href="/contact" className="btn-gold mt-5">Vraag een offerte aan</Link>
          </div>
        </div>
      </section>

      {lightbox && (
        <Lightbox
          items={lightbox.items}
          index={lightbox.index}
          onIndex={(index) => setLightbox({ ...lightbox, index })}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* /galerij/:slug/:albumSlug — één event                               */
/* ------------------------------------------------------------------ */

function EventPagina({ slug, albumSlug }: { slug: string; albumSlug: string }) {
  const [lightbox, setLightbox] = useState<{ items: GalleryItem[]; index: number } | null>(null);
  const { cat, isLoading } = useGelegenheid(slug);

  if (isLoading) {
    return <div className="container-tight py-32 text-center text-charcoal/70">Laden…</div>;
  }
  const album = cat?.albums.find((a) => a.slug === albumSlug) ?? null;
  if (!cat || !album) return <NietGevonden />;

  return (
    <>
      {/* De gelegenheid is hier het label boven de titel, en de terug-link gaat naar de
          gelegenheid in plaats van naar de hele galerij — je kwam daar tenslotte vandaan. */}
      <Kop
        tag={album.eventDate ? maandJaar(album.eventDate) : "Ons werk"}
        titel={album.title}
        tekst={album.description ?? undefined}
        terug={{ href: `/galerij/${cat.slug}`, label: cat.name }}
      />

      <section className="relative overflow-hidden bg-cream section-y-sm">
        <BotanicalPattern opacity={0.04} />
        <div className="container-tight relative">
          <AlbumInhoud album={album} onOpen={(items, index) => setLightbox({ items, index })} />

          <div className="pt-14 text-center">
            <GoldDivider />
            <p className="mt-8 text-sm text-charcoal/75 sm:text-base">
              Iets gezien dat past bij jouw feest?
            </p>
            <Link href="/contact" className="btn-gold mt-5">Vraag een offerte aan</Link>
          </div>
        </div>
      </section>

      {lightbox && (
        <Lightbox
          items={lightbox.items}
          index={lightbox.index}
          onIndex={(index) => setLightbox({ ...lightbox, index })}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */

function Kop({
  tag,
  titel,
  tekst,
  terug,
}: {
  tag: string;
  titel: string;
  tekst?: string;
  /** `true` = terug naar alle gelegenheden; een object = terug naar een specifieke pagina. */
  terug?: boolean | { href: string; label: string };
}) {
  const doel = terug === true ? { href: "/galerij", label: "Alle gelegenheden" } : terug || null;
  return (
    <PageHeader
      tag={tag}
      titel={titel}
      tekst={tekst}
      boven={
        doel && (
          <Link
            href={doel.href}
            className="mb-4 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-gold-dark transition-all hover:gap-3"
          >
            <ArrowLeft size={14} /> {doel.label}
          </Link>
        )
      }
    >
      <BotanicalCorner position="tl" color="text-gold/30" />
      <BotanicalCorner position="tr" color="text-gold/30" />
    </PageHeader>
  );
}

/**
 * De inhoud van één event: de blokken in volgorde, of — zolang er geen blokken zijn — gewoon
 * alle foto's. Dat laatste is de toestand van elk bestaand album, dus dat pad moet goed zijn.
 *
 * **Foto's die in geen enkel fotoblok staan verschijnen onderaan.** Zonder dat zou een foto
 * die je uploadt nadat je de blokken hebt ingedeeld stilzwijgend onzichtbaar zijn — en dat
 * merk je pas als de klant vraagt waar zijn foto is.
 */
function AlbumInhoud({
  album,
  onOpen,
}: {
  album: DemoCategory["albums"][number];
  onOpen: (items: GalleryItem[], index: number) => void;
}) {
  const blokken = album.blocks ?? [];

  if (blokken.length === 0) {
    return <FotoRaster items={album.items} onOpen={(i) => onOpen(album.items, i)} />;
  }

  const perId = new Map(album.items.map((i) => [i.id, i]));
  const gebruikt = new Set<number>();
  for (const b of blokken) {
    if (b.soort === "fotos") b.itemIds.forEach((id) => gebruikt.add(id));
  }
  const rest = album.items.filter((i) => !gebruikt.has(i.id));

  return (
    <div className="space-y-8">
      {blokken.map((blok, i) => {
        if (blok.soort === "kop") {
          return (
            <h3 key={i} className="text-center font-display text-xl text-charcoal sm:text-2xl">
              {blok.inhoud}
            </h3>
          );
        }
        if (blok.soort === "tekst") {
          return (
            <p
              key={i}
              className="mx-auto max-w-2xl whitespace-pre-line text-center text-sm leading-relaxed text-charcoal/75 sm:text-base"
            >
              {blok.inhoud}
            </p>
          );
        }
        // Een verwijzing naar een verwijderde foto mag het blok niet laten omvallen.
        const fotos = blok.itemIds.map((id) => perId.get(id)).filter(Boolean) as GalleryItem[];
        if (fotos.length === 0) return null;
        return <FotoRaster key={i} items={fotos} onOpen={(idx) => onOpen(fotos, idx)} />;
      })}

      {rest.length > 0 && <FotoRaster items={rest} onOpen={(idx) => onOpen(rest, idx)} />}
    </div>
  );
}

function FotoRaster({ items, onOpen }: { items: GalleryItem[]; onOpen: (index: number) => void }) {
  return (
    <div className="columns-2 md:columns-3 gap-4 md:gap-6 [column-fill:_balance]">
      {items.map((item, i) => (
        <button
          key={item.id}
          onClick={() => onOpen(i)}
          className="mb-4 md:mb-6 block w-full break-inside-avoid overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-gold/10 group"
        >
          <img
            src={imageSrc(item)}
            alt={item.altText ?? ""}
            loading="lazy"
            className="w-full h-auto transition-transform duration-500 group-hover:scale-[1.02]"
          />
          {item.caption && <div className="p-3 text-center text-xs leading-relaxed text-charcoal/70">{item.caption}</div>}
        </button>
      ))}
    </div>
  );
}

function Lightbox({ items, index, onIndex, onClose }: {
  items: GalleryItem[]; index: number; onIndex: (i: number) => void; onClose: () => void;
}) {
  const item = items[index];
  const meer = items.length > 1;
  const ga = (stap: number) => onIndex((index + stap + items.length) % items.length);

  return (
    <div
      className="fixed inset-0 bg-charcoal/95 z-50 flex items-center justify-center p-4 md:p-12"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <BotanicalCorner position="tl" color="text-gold/40" />
      <BotanicalCorner position="br" color="text-gold/40" />

      <button onClick={onClose} aria-label="Sluiten"
        className="absolute top-4 right-4 text-cream/80 hover:text-cream p-2 z-10"><X size={28} /></button>

      {meer && (
        <>
          <button onClick={(e) => { e.stopPropagation(); ga(-1); }} aria-label="Vorige"
            className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-cream/15 hover:bg-cream/30 text-cream flex items-center justify-center z-10">
            <ArrowLeft size={20} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); ga(1); }} aria-label="Volgende"
            className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-cream/15 hover:bg-cream/30 text-cream flex items-center justify-center z-10">
            <ArrowRight size={20} />
          </button>
        </>
      )}

      <div className="relative max-h-full max-w-full" onClick={(e) => e.stopPropagation()}>
        <img src={imageSrc(item)} alt={item.altText ?? ""}
          className="max-h-[80vh] max-w-full object-contain rounded-md ring-1 ring-gold/30" />
        <div className="mt-4 text-center text-cream/80 text-sm">
          {item.caption}
          {meer && <span className="ml-3 text-cream/40">{index + 1} / {items.length}</span>}
        </div>
      </div>
    </div>
  );
}

/** "2026-03-14" → "maart 2026" */
function maandJaar(datum: string): string {
  const d = new Date(datum + "T12:00:00Z");
  if (Number.isNaN(d.getTime())) return datum;
  return d.toLocaleDateString("nl-NL", { month: "long", year: "numeric" });
}
