import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { api } from "../../lib/api";
import { usePublicSettings } from "../../hooks/usePublicSettings";
import type { GalleryItem, Review, Package } from "@shared/schema";
import { ArrowRight, Quote } from "lucide-react";
import { imageSrc } from "../../lib/images";
import { BotanicalPattern } from "../../components/ornaments/BotanicalPattern";
import { SierDivider } from "../../components/ornaments/SierDivider";
import { BotanicalCorner } from "../../components/ornaments/BotanicalCorner";
import { SectionDivider } from "../../components/ornaments/SectionDivider";
import { Reveal } from "../../components/Reveal";
import { Marquee } from "../../components/Marquee";
import { MagneticLink } from "../../components/MagneticLink";
import { type ProcessStep } from "../../components/ProcessStory";
import { KORTE_STAPPEN, stapFotos } from "../../content/werkwijze";
import type { GalerijAntwoord } from "../../lib/galerij";
import { ProcessStrip } from "../../components/ProcessStrip";
import { HeroCollage } from "../../components/public/HeroCollage";

// Volgorde is niet willekeurig: sweet en grazing tables zijn de hoofdfocus, taarten horen
// erbij maar zijn niet waar de site over gaat. Zie de meeting van 24-08.
const MARQUEE_TAGS = [
  "Sweet tables",
  "Grazing tables",
  "Bruiloften",
  "Babyshowers",
  "Dessertbars",
  "Mini desserts",
  "Macarons",
  "Taarten op maat",
  "Bedrijfsevents",
];

/**
 * Het spotlight-blok toont bij voorkeur de uitgelichte **pakketten** — dat is waar de site
 * over gaat sinds de meeting van 24-08. Zijn er nog geen pakketten actief, dan vallen we
 * terug op de gelegenheden uit de galerij, zodat het blok nooit leeg staat.
 */
interface SpotlightItem {
  key: string; href: string; title: string; body: string;
  img: string | null; cta: string; vanaf?: string;
}



export default function HomePage() {
  const { data: settings } = usePublicSettings();
  const hero = settings?.hero;
  const { data: reviews } = useQuery({
    queryKey: ["public", "reviews"],
    queryFn: () => api.get<Review[]>("/api/public/reviews"),
  });
  const { data: pakketten } = useQuery({
    queryKey: ["public", "packages"],
    queryFn: () => api.get<Package[]>("/api/public/packages"),
  });
  const { data: gallery } = useQuery({
    queryKey: ["public", "gallery"],
    queryFn: () => api.get<GalerijAntwoord>("/api/public/gallery"),
  });

  const items: GalleryItem[] = gallery?.items ?? [];
  /**
   * De foto achter de afsluitende CTA: de ivoor-en-bordeaux met kaarsen, de sfeervolste en
   * donkerste uit haar set -- die verdraagt de charcoal-overlay zonder te verdrinken. Zoeken
   * op `altText`-fragment, zelfde aanpak als `stapFotos()`. Geen treffer = het vlak van nu.
   */
  const ctaFoto = useMemo(
    () => items.find((i) => (i.altText ?? "").toLowerCase().includes("bordeaux taart naast")) ?? null,
    [items],
  );

  /** Gelegenheid-slug per foto, zodat een werktegel naar zíjn gelegenheid linkt. */
  const slugPerCategorie = useMemo(
    () => new Map((gallery?.categories ?? []).map((c) => [c.id, c.slug])),
    [gallery],
  );
  const featured = items.filter((i) => i.featured);
  /**
   * De drie foto's van de hero-collage.
   *
   * Eerst wat ze in de instellingen koos (`hero.fotoIds`, op volgorde), aangevuld met
   * uitgelicht werk tot er drie staan. Een id dat nergens meer heen wijst -- de foto is
   * verwijderd -- valt er stil uit: `site_settings` is jsonb, dus de database kan die
   * verwijzing niet voor ons opruimen, en een gat in de collage is erger dan een andere foto.
   */
  const heroFotos = useMemo(() => {
    const gekozen = (hero?.fotoIds ?? [])
      .map((id) => items.find((i) => i.id === id))
      .filter((f): f is GalleryItem => Boolean(f));
    const rest = (featured.length ? featured : items).filter(
      (f) => !gekozen.some((g) => g.id === f.id),
    );
    return [...gekozen, ...rest].slice(0, 3);
  }, [hero, items, featured]);
  const gridFeatured = (featured.length ? featured : items).slice(0, 6);

  // Pakketten eerst; zonder actieve pakketten de gelegenheden uit de galerij.
  const gelegenheden = gallery?.categories ?? [];
  const spotlight: SpotlightItem[] = (pakketten ?? []).filter((p) => p.featured).length
    ? (pakketten ?? []).filter((p) => p.featured).slice(0, 6).map((p, i) => ({
        key: `pakket-${p.id}`,
        href: `/contact?pakket=${p.slug}`,
        title: p.name,
        body: p.tagline ?? p.description ?? "",
        // De gekozen cover, anders een andere foto per kaart. De terugval was `items[0]` voor
        // álle kaarten, dus een rij met exact hetzelfde beeld — dat leest als een fout, ook
        // al is er alleen een cover niet ingesteld.
        img: (() => {
          const gekozen = p.coverItemId ? items.find((x) => x.id === p.coverItemId) : undefined;
          const terugval = items[i] ?? items[0];
          const foto = gekozen ?? terugval;
          return foto ? imageSrc(foto) : null;
        })(),
        cta: "Vraag aan",
        vanaf: Number(p.priceFrom) > 0
          ? `€ ${Number(p.priceFrom).toFixed(0)}${p.priceUnit === "per_persoon" ? " p.p." : ""}`
          : undefined,
      }))
    : gelegenheden.filter((c) => c.itemCount > 0).slice(0, 6).map((c) => ({
        key: `gelegenheid-${c.id}`,
        href: `/galerij/${c.slug}`,
        title: c.name,
        body: c.description ?? "",
        img: c.cover ? imageSrc(c.cover) : null,
        cta: "Bekijk werk",
      }));

  /**
   * De vijf stappen komen uit `content/werkwijze.ts` — haar eigen tekst, en dezelfde bron als
   * de uitgebreide versie op `/werkwijze`. Hier stond tot 27-08 door ons geschreven tekst met
   * stockfoto's ("Jij geniet van het moment terwijl iedere gast zegt: wow, kijk dat").
   */
  const processSteps: ProcessStep[] = useMemo(() => {
    const fotos = stapFotos(KORTE_STAPPEN, items);
    return KORTE_STAPPEN.map((stap, i) => ({
      n: stap.n,
      title: stap.title,
      body: stap.body,
      imageSrc: fotos[i] ?? "",
    }));
  }, [items]);

  return (
    <>
      {/* ========== HERO ========== */}
      <HeroCollage
        fotos={heroFotos}
        tagline={hero?.tagline}
        ctaLabel={hero?.ctaLabel}
        ctaHref={hero?.ctaHref}
      />

      {/* ========== MARQUEE ========== */}
      <Marquee items={MARQUEE_TAGS} duration={50} />

      {/* ========== WAT WE MAKEN — de pakketten, hoog op de pagina ==========
           De bezoeker heeft één vraag: "kan zij iets moois maken voor mijn feest,
           en wat kost dat ongeveer?" Dit blok beantwoordt de tweede helft, dus het
           staat direct onder de hero in plaats van op tweederde van de pagina. */}
      <Reveal as="section" className="relative section-y bg-section-sand overflow-hidden">
        <BotanicalPattern opacity={0.04} />
        <div className="container-tight relative">
          <div className="text-center mb-10 sm:mb-16">
            <div className="tag mb-3">Wat we maken</div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl">Sweet &amp; grazing tables</h2>
            <div className="mt-6"><SierDivider /></div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {spotlight.map((s) => (
              <Link
                key={s.key}
                href={s.href}
                className="group rounded-2xl overflow-hidden bg-linen shadow-sm hover:shadow-xl transition-shadow ring-1 ring-sage/25 block"
              >
                {s.img && (
                  <div className="relative aspect-[5/4] overflow-hidden">
                    <img
                      src={s.img}
                      alt={s.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/40 via-transparent to-transparent" />
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-2xl mb-3 group-hover:text-sage-dark transition-colors">{s.title}</h3>
                  <p className="text-charcoal/70 leading-relaxed text-sm">{s.body}</p>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-sage-dark">
                      {s.cta} <ArrowRight size={14} />
                    </span>
                    {s.vanaf && (
                      <span className="text-sm text-sage-dark whitespace-nowrap">vanaf {s.vanaf}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/aanbod" className="btn-outline">Volledig aanbod</Link>
          </div>
        </div>
      </Reveal>

      <SectionDivider color="fill-linen" variant="scallop" />

      {/* ========== ONS WERK — de foto's, groot ========== */}
      <Reveal as="section" className="relative section-y bg-linen overflow-hidden">
        <BotanicalPattern opacity={0.04} />
        <div className="container-tight relative">
          <div className="flex items-end justify-between mb-8 sm:mb-12">
            <div>
              <div className="tag mb-3">Onze creaties</div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl">Uitgelicht werk</h2>
            </div>
            <Link
              href="/galerij"
              className="hidden md:inline-flex items-center gap-2 text-sm uppercase tracking-widest text-charcoal/60 hover:text-sage-dark"
            >
              Alle creaties <ArrowRight size={16} />
            </Link>
          </div>
          {/*
            Masonry in plaats van zes gedwongen vierkanten: `gallery_items` kent de echte
            afmetingen, dus de foto's mogen hun eigen verhouding houden -- staand naast
            liggend, zoals in een magazine. CSS-kolommen doen het metselwerk; per kaart houdt
            `break-inside-avoid` foto en bijschrift bij elkaar.

            De bijschriften staan er áltijd, niet pas bij hover: op een telefoon bestaat hover
            niet, en ze zijn precies daarvoor geschreven.
          */}
          <div className="columns-2 gap-4 md:columns-3 md:gap-6">
            {gridFeatured.map((item) => (
              <Link
                key={item.id}
                href={item.categoryId != null && slugPerCategorie.get(item.categoryId)
                  ? `/galerij/${slugPerCategorie.get(item.categoryId)}`
                  : "/galerij"}
                className="group mb-4 block break-inside-avoid md:mb-6"
              >
                <div
                  className="relative w-full overflow-hidden rounded-lg bg-linen shadow-sm ring-1 ring-sage/25 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-lg"
                  style={{
                    aspectRatio:
                      item.width && item.height ? `${item.width} / ${item.height}` : "4 / 5",
                  }}
                >
                  <img
                    src={imageSrc(item)}
                    alt={item.altText ?? ""}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                {item.caption && (
                  <p className="mt-2 px-0.5 text-xs leading-snug text-charcoal/65 transition-colors group-hover:text-charcoal">
                    {item.caption}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      </Reveal>

      {/* ========== ZO GAAT HET ==========
           Eén strip in plaats van het scroll-verhaal: dat kostte 260vh voor vier zinnen.
           De uitgebreide versie (`ProcessStory`) past beter op /over. */}
      <ProcessStrip steps={processSteps} />

      <SectionDivider color="fill-sand" variant="wave" flip />

      {/* ========== REVIEWS ========== */}
      {/* Nul gepubliceerde reviews = geen blok. Een leeg reviewblok is slechter dan geen. */}
      {(reviews?.length ?? 0) > 0 && (
      <Reveal as="section" className="relative section-y bg-section-blush overflow-hidden" staggerChildren={0.12}>
        <BotanicalPattern opacity={0.05} />
        <BotanicalCorner position="tl" color="text-sage/30" />
        <BotanicalCorner position="br" color="text-sage/30" />
        <div className="container-tight relative">
          <div className="text-center mb-10 sm:mb-14">
            <div className="tag mb-3">Klanten over ons</div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl">Wat klanten vertellen</h2>
            <div className="mt-6"><SierDivider /></div>
          </div>
          <div className="grid md:grid-cols-3 gap-5 sm:gap-6">
            {(reviews ?? []).filter((r) => r.featured).concat((reviews ?? []).filter((r) => !r.featured)).slice(0, 3).map((t, i) => (
              <Reveal
                key={i}
                delay={i * 100}
                className="card hairline-sage bg-linen/80 backdrop-blur relative flex flex-col"
              >
                <Quote size={32} className="text-sage mb-4" />
                <p className="text-charcoal/80 leading-relaxed text-base sm:text-lg italic flex-1">
                  "{t.body}"
                </p>
                <div className="mt-6 pt-6 border-t border-sage/20">
                  <div className="script-accent text-2xl leading-none mb-1">{t.authorName}</div>
                  {t.eventType && <div className="tag !text-[10px]">{t.eventType}</div>}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Reveal>
      )}

      {/* ========== CTA STRIP ========== */}
      <Reveal as="section" className="relative section-y bg-charcoal text-linen overflow-hidden">
        {/* Beeld onder een dikke charcoal-wassing: sfeer zonder het contrast van de tekst aan
            te tasten. Zonder foto blijft het gewoon het vlak dat er stond. */}
        {ctaFoto && (
          <>
            <img
              src={imageSrc(ctaFoto)}
              alt=""
              aria-hidden
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-charcoal/85" />
          </>
        )}
        <BotanicalPattern opacity={0.06} className="text-linen" />
        <div className="container-narrow relative text-center">
          <SierDivider className="!text-sage/60" />
          <div className="script-accent text-3xl sm:text-4xl mt-6 mb-2">Een idee?</div>
          <h2 className="text-linen text-3xl sm:text-4xl md:text-5xl mb-6">Laten we het bespreken</h2>
          <p className="text-linen/70 mb-8 leading-relaxed text-sm sm:text-base">
            Of het nu een bruiloft, verjaardag of een doopfeest is: vertel ons over jouw moment en we ontwerpen iets unieks.
          </p>
          <MagneticLink href="/contact" className="btn-sage">Stuur een bericht</MagneticLink>
          <div className="mt-8 sm:mt-10"><SierDivider className="!text-sage/60" /></div>
        </div>
      </Reveal>

    </>
  );
}
