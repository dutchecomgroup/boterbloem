import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import {
  Trash2, Plus, Pencil, Check, X, ChevronUp, ChevronDown, ChevronRight,
  Images, Search, CalendarDays,
} from "lucide-react";
import { api } from "../../lib/api";
import { FotoRaster } from "../../components/admin/galerij/FotoRaster";
import { UploadKaart } from "../../components/admin/galerij/UploadKaart";
import type { GalleryItem, GalleryCategory, GalleryAlbum } from "@shared/schema";

type AlbumMetTelling = GalleryAlbum & { itemCount: number };
type CatMetTelling = GalleryCategory & { eventCount: number; itemCount: number };

/**
 * Galerij → Categorie → Event → Foto's.
 *
 * Dit scherm ging eerder **van foto's uit**: het startte op "Alle foto's" en toonde een plat
 * raster van élke foto in het systeem, met de categorie als filter en het event als pil. Dat
 * is precies andersom: het event is het ding dat je aankleedt, foto's zijn wat je erin stopt.
 *
 * Nu: categorieën in de zijbalk, **events in het hoofdvlak**, en een event opent als eigen
 * pagina (`GalleryEventPage`). De publieke site is al zo opgebouwd — `/galerij` naar
 * `/galerij/babyshower` — dus dit is er de spiegel van.
 *
 * "Alle foto's" blijft bestaan als hulpmiddel, niet als startpunt: een foto die in de
 * verkeerde categorie belandde moet je terug kunnen vinden.
 */
export default function GalleryAdminPage() {
  const qc = useQueryClient();
  const zoek = useSearch();
  const [, navigeer] = useLocation();

  const [nieuweCat, setNieuweCat] = useState("");
  const [bewerkCat, setBewerkCat] = useState<{ id: number; name: string } | null>(null);
  const [fout, setFout] = useState<string | null>(null);

  const { data: cats } = useQuery({
    queryKey: ["admin", "gallery", "categories"],
    queryFn: () => api.get<CatMetTelling[]>("/api/admin/gallery/categories"),
  });
  const { data: albums } = useQuery({
    queryKey: ["admin", "gallery", "albums"],
    queryFn: () => api.get<AlbumMetTelling[]>("/api/admin/gallery/albums"),
  });
  const { data: items } = useQuery({
    queryKey: ["admin", "gallery"],
    queryFn: () => api.get<GalleryItem[]>("/api/admin/gallery"),
  });

  /**
   * Welke categorie open staat, in het webadres. Zo houdt verversen je op je plek en is een
   * link deelbaar — en komt de terug-link vanaf een event op de juiste categorie uit.
   * `alle` is de zoekweergave over alle foto's heen.
   */
  const param = new URLSearchParams(zoek).get("categorie");
  const toonAlle = param === "alle";
  const catId = toonAlle ? null : param && /^\d+$/.test(param) ? Number(param) : null;
  const kies = (v: number | "alle" | null) =>
    navigeer(v === null ? "/admin/galerij" : `/admin/galerij?categorie=${v}`, { replace: true });

  // Zonder keuze de eerste categorie openen. Landen op "niets gekozen" is een leeg scherm dat
  // niets uitlegt; landen op alle foto's was juist het probleem.
  useEffect(() => {
    if (!param && cats?.length) kies(cats[0].id);
  }, [param, cats]); // eslint-disable-line react-hooks/exhaustive-deps

  const ververs = () => {
    qc.invalidateQueries({ queryKey: ["admin", "gallery"] });
    qc.invalidateQueries({ queryKey: ["public", "gallery"] });
  };
  const mut = <T,>(fn: (v: T) => Promise<unknown>) =>
    ({ mutationFn: fn, onSuccess: ververs, onError: (e: Error) => setFout(e.message) });

  const catAanmaken = useMutation(mut(async (name: string) => {
    const c = await api.post<GalleryCategory>("/api/admin/gallery/categories", {
      name, slug: slugify(name), sortOrder: cats?.length ?? 0,
    });
    kies(c.id);
  }));
  const catBijwerken = useMutation(mut((v: { id: number } & Record<string, unknown>) => {
    const { id, ...velden } = v;
    return api.patch(`/api/admin/gallery/categories/${id}`, velden);
  }));
  /**
   * Wisselt met de buur in de getoonde lijst. Niet `sortOrder ± 1`: die aanname klopt alleen
   * bij unieke, aaneengesloten waarden, en na de eerste verwijdering ontstaan er gaten.
   */
  const catVerplaatsen = useMutation(mut(async ({ id, richting }: { id: number; richting: -1 | 1 }) => {
    const lijst = cats ?? [];
    const i = lijst.findIndex((c) => c.id === id);
    const j = i + richting;
    if (i < 0 || j < 0 || j >= lijst.length) return;
    await Promise.all([
      api.patch(`/api/admin/gallery/categories/${lijst[i].id}`, { sortOrder: j }),
      api.patch(`/api/admin/gallery/categories/${lijst[j].id}`, { sortOrder: i }),
    ]);
  }));
  const catVerwijderen = useMutation(mut((id: number) =>
    api.delete(`/api/admin/gallery/categories/${id}`)));

  const albumAanmaken = useMutation(mut(async (titel: string) => {
    const a = await api.post<GalleryAlbum>("/api/admin/gallery/albums", {
      categoryId: catId, title: titel, slug: slugify(titel),
      sortOrder: albumsVanCat.length,
    });
    navigeer(`/admin/galerij/${a.id}`);
  }));

  const itemPatch = useMutation(mut(({ id, ...rest }: { id: number } & Record<string, unknown>) =>
    api.patch(`/api/admin/gallery/${id}`, rest)));
  const itemVerwijderen = useMutation(mut((id: number) => api.delete(`/api/admin/gallery/${id}`)));

  const albumsVanCat = useMemo(
    () => (albums ?? []).filter((a) => a.categoryId === catId),
    [albums, catId],
  );
  const actieveCat = cats?.find((c) => c.id === catId) ?? null;
  const losseFotos = (items ?? []).filter((i) => i.categoryId === catId && i.albumId == null);

  return (
    <div>
      <h1 className="mb-2 text-3xl">Galerij</h1>
      <p className="mb-6 text-sm text-charcoal/75">
        Een <strong>gelegenheid</strong> (babyshower, bruiloft) bevat <strong>events</strong> —
        één uitgevoerd feest. In een event zet je de tekst en de foto&apos;s.
      </p>

      {fout && (
        <div className="card mb-4 flex items-start justify-between gap-4 border-burgundy/30 text-sm text-burgundy">
          <span>{fout}</span>
          <button onClick={() => setFout(null)} aria-label="Melding sluiten"><X size={16} /></button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* ---------------- Gelegenheden ---------------- */}
        <div className="card self-start overflow-hidden p-0">
          <div className="border-b border-charcoal/10 px-4 py-3 text-xs font-medium uppercase tracking-widest text-charcoal/75">
            Gelegenheden
          </div>

          {cats?.map((c, i) => (
            <div key={c.id} className="group border-b border-charcoal/5">
              {bewerkCat?.id === c.id ? (
                <div className="flex gap-1 p-2">
                  <input
                    autoFocus
                    className="input !px-2 !py-1 text-sm"
                    value={bewerkCat.name}
                    onChange={(e) => setBewerkCat({ ...bewerkCat, name: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { catBijwerken.mutate(bewerkCat); setBewerkCat(null); }
                      if (e.key === "Escape") setBewerkCat(null);
                    }}
                  />
                  <button className="p-1 text-gold-dark" aria-label="Opslaan"
                    onClick={() => { catBijwerken.mutate(bewerkCat); setBewerkCat(null); }}>
                    <Check size={16} />
                  </button>
                </div>
              ) : (
                <div
                  className={`flex items-center ${
                    catId === c.id ? "bg-gold/10" : "hover:bg-cream/60"
                  }`}
                >
                  <button
                    onClick={() => kies(c.id)}
                    className={`min-w-0 flex-1 px-4 py-2.5 text-left text-sm ${
                      catId === c.id ? "font-medium text-gold-dark" : ""
                    }`}
                  >
                    <span className="block truncate">{c.name}</span>
                    <span className="text-xs text-charcoal/65">
                      {c.eventCount} {c.eventCount === 1 ? "event" : "events"} · {c.itemCount} foto&apos;s
                    </span>
                  </button>
                  <div className="flex shrink-0 pr-1 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                    <button className="p-1 text-charcoal/55 hover:text-charcoal" aria-label="Omhoog"
                      disabled={i === 0} onClick={() => catVerplaatsen.mutate({ id: c.id, richting: -1 })}>
                      <ChevronUp size={14} />
                    </button>
                    <button className="p-1 text-charcoal/55 hover:text-charcoal" aria-label="Omlaag"
                      disabled={i === (cats?.length ?? 0) - 1} onClick={() => catVerplaatsen.mutate({ id: c.id, richting: 1 })}>
                      <ChevronDown size={14} />
                    </button>
                    <button className="p-1 text-charcoal/55 hover:text-charcoal" aria-label="Hernoemen"
                      onClick={() => setBewerkCat({ id: c.id, name: c.name })}>
                      <Pencil size={14} />
                    </button>
                    <button className="p-1 text-charcoal/55 hover:text-burgundy" aria-label="Verwijderen"
                      onClick={() => {
                        // De events gaan mee (cascade), de foto's blijven bestaan. Dat verschil
                        // moet je weten vóór je klikt.
                        if (confirm(
                          `"${c.name}" verwijderen? De ${c.eventCount} event(s) eronder gaan mee. ` +
                          `De ${c.itemCount} foto's blijven bestaan zonder gelegenheid.`
                        )) {
                          catVerwijderen.mutate(c.id);
                          if (catId === c.id) kies(null);
                        }
                      }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          <div className="flex gap-1 border-b border-charcoal/5 p-2">
            <input
              className="input !px-2 !py-1 text-sm"
              placeholder="Nieuwe gelegenheid"
              value={nieuweCat}
              onChange={(e) => setNieuweCat(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && nieuweCat.trim()) { catAanmaken.mutate(nieuweCat.trim()); setNieuweCat(""); }
              }}
            />
            <button className="p-1 text-gold-dark disabled:opacity-30" aria-label="Toevoegen"
              disabled={!nieuweCat.trim()}
              onClick={() => { catAanmaken.mutate(nieuweCat.trim()); setNieuweCat(""); }}>
              <Plus size={16} />
            </button>
          </div>

          {/* Hulpmiddel, geen startpunt: om een foto terug te vinden die in de verkeerde
              gelegenheid belandde. */}
          <button
            onClick={() => kies("alle")}
            className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm ${
              toonAlle ? "bg-gold/10 font-medium text-gold-dark" : "text-charcoal/75 hover:bg-cream/60"
            }`}
          >
            <Search size={14} /> Alle foto&apos;s
            <span className="text-charcoal/65">({items?.length ?? 0})</span>
          </button>
        </div>

        {/* ---------------- Hoofdvlak ---------------- */}
        {toonAlle ? (
          <div className="space-y-4">
            <div className="card">
              <h2 className="text-xl">Alle foto&apos;s</h2>
              <p className="mt-1 text-sm text-charcoal/75">
                Alles door elkaar, met per foto waar hij hoort. Handig om iets terug te vinden;
                voor het aankleden van een feest ga je naar het event zelf.
              </p>
            </div>
            <FotoRaster
              items={items ?? []}
              context={{ soort: "alle", albums: albums ?? [], categorieen: cats ?? [] }}
              onPatch={(v) => itemPatch.mutate(v)}
              onVerwijder={(id) => itemVerwijderen.mutate(id)}
              leegTekst="Er staan nog geen foto's in de galerij."
            />
          </div>
        ) : actieveCat ? (
          <CategorieVlak
            categorie={actieveCat}
            albums={albumsVanCat}
            losseFotos={losseFotos}
            alleAlbums={albums ?? []}
            onIntro={(description) => catBijwerken.mutate({ id: actieveCat.id, description })}
            onNieuwEvent={(titel) => albumAanmaken.mutate(titel)}
            onItemPatch={(v) => itemPatch.mutate(v)}
            onItemVerwijder={(id) => itemVerwijderen.mutate(id)}
            onVervers={ververs}
          />
        ) : (
          <div className="card py-16 text-center text-sm text-charcoal/75">
            Maak links een gelegenheid aan om te beginnen.
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function CategorieVlak({
  categorie,
  albums,
  losseFotos,
  alleAlbums,
  onIntro,
  onNieuwEvent,
  onItemPatch,
  onItemVerwijder,
  onVervers,
}: {
  categorie: CatMetTelling;
  albums: AlbumMetTelling[];
  losseFotos: GalleryItem[];
  alleAlbums: GalleryAlbum[];
  onIntro: (tekst: string | null) => void;
  onNieuwEvent: (titel: string) => void;
  onItemPatch: (v: { id: number } & Record<string, unknown>) => void;
  onItemVerwijder: (id: number) => void;
  onVervers: () => void;
}) {
  const [nieuwTitel, setNieuwTitel] = useState("");
  const [losseOpen, setLosseOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl">{categorie.name}</h2>
            <p className="mt-0.5 text-xs text-charcoal/70">
              /galerij/{categorie.slug} · {categorie.eventCount}{" "}
              {categorie.eventCount === 1 ? "event" : "events"} · {categorie.itemCount} foto&apos;s
            </p>
          </div>
        </div>

        <label className="label" htmlFor="cat-intro">Inleiding op deze gelegenheid</label>
        <textarea
          id="cat-intro"
          className="input min-h-[72px]"
          placeholder="Bijvoorbeeld: waar je op let bij een babyshower, wat er mogelijk is, wat klanten meestal kiezen."
          defaultValue={categorie.description ?? ""}
          key={`intro-${categorie.id}`}
          onBlur={(e) => {
            const w = e.target.value.trim();
            if (w !== (categorie.description ?? "")) onIntro(w || null);
          }}
        />
        <p className="mt-1 text-xs text-charcoal/70">
          Verschijnt onder de titel op de publieke pagina. Opgeslagen zodra je wegklikt.
        </p>
      </div>

      {/* ---------- Events ---------- */}
      <div className="card p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-charcoal/10 px-4 py-3">
          <span className="text-xs font-medium uppercase tracking-widest text-charcoal/75">Events</span>
          <div className="flex gap-1">
            <input
              className="input !px-2 !py-1 text-sm"
              placeholder="Titel van het feest"
              value={nieuwTitel}
              onChange={(e) => setNieuwTitel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && nieuwTitel.trim()) { onNieuwEvent(nieuwTitel.trim()); setNieuwTitel(""); }
              }}
            />
            <button
              className="btn-gold !px-3 !py-1.5 text-xs disabled:opacity-40"
              disabled={!nieuwTitel.trim()}
              onClick={() => { onNieuwEvent(nieuwTitel.trim()); setNieuwTitel(""); }}
            >
              <Plus size={13} /> Event
            </button>
          </div>
        </div>

        {albums.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-charcoal/75">
              Nog geen events onder <strong>{categorie.name}</strong>.
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-charcoal/70">
              Een event is één uitgevoerd feest — de babyshower van Lisa, de bruiloft van Sanne.
              Geef het een titel hierboven; daarna kun je er tekst en foto&apos;s in zetten.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-charcoal/5">
            {albums.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/admin/galerij/${a.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition hover:bg-cream/60"
                >
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded bg-blush/30">
                    <EventOmslag album={a} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-charcoal">{a.title}</div>
                    <div className="flex flex-wrap items-center gap-x-2 text-xs text-charcoal/70">
                      {a.eventDate && (
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays size={11} /> {a.eventDate}
                        </span>
                      )}
                      <span>{a.itemCount} {a.itemCount === 1 ? "foto" : "foto's"}</span>
                      {a.blocks?.length ? <span className="text-gold-dark">verhaal ✓</span> : null}
                      {!a.published && <span className="text-burgundy">niet zichtbaar</span>}
                    </div>
                  </div>
                  <ChevronRight size={16} className="shrink-0 text-charcoal/40" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ---------- Losse foto's ---------- */}
      <div className="card p-0">
        <button
          onClick={() => setLosseOpen((v) => !v)}
          className="flex w-full items-center gap-2 px-4 py-3 text-left"
          aria-expanded={losseOpen}
        >
          <Images size={15} className="text-charcoal/60" />
          <span className="flex-1 text-sm">
            Losse foto&apos;s <span className="text-charcoal/70">({losseFotos.length})</span>
            <span className="block text-xs text-charcoal/70">
              Horen bij deze gelegenheid maar nog niet bij een event — ze verschijnen publiek
              onder &ldquo;Meer werk&rdquo;.
            </span>
          </span>
          {losseOpen ? <ChevronUp size={16} className="text-charcoal/55" /> : <ChevronDown size={16} className="text-charcoal/55" />}
        </button>

        {losseOpen && (
          <div className="space-y-4 border-t border-charcoal/10 p-4">
            <UploadKaart
              categoryId={categorie.id}
              doelNaam={`${categorie.name} (zonder event)`}
              onKlaar={onVervers}
            />
            <FotoRaster
              items={losseFotos}
              context={{ soort: "losse", categoryId: categorie.id, albums: alleAlbums }}
              onPatch={onItemPatch}
              onVerwijder={onItemVerwijder}
              leegTekst="Geen losse foto's — alles zit in een event."
            />
          </div>
        )}
      </div>
    </div>
  );
}

/** Omslag van een event: de gekozen cover, anders de eerste foto, anders niets. */
function EventOmslag({ album }: { album: AlbumMetTelling }) {
  const { data: items } = useQuery({
    queryKey: ["admin", "gallery"],
    queryFn: () => api.get<GalleryItem[]>("/api/admin/gallery"),
  });
  const cover =
    (album.coverItemId && items?.find((i) => i.id === album.coverItemId)) ||
    items?.find((i) => i.albumId === album.id);

  if (!cover) {
    return <div className="flex h-full w-full items-center justify-center text-[10px] text-charcoal/50">geen foto</div>;
  }
  return (
    <img
      src={`/uploads/gallery/${cover.filename}`}
      alt=""
      loading="lazy"
      className="h-full w-full object-cover"
    />
  );
}

/** Webadres-veilige naam. Alleen bij aanmaken gebruikt — hernoemen laat de slug staan. */
function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}
