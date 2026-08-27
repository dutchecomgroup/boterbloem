import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { ArrowLeft, Trash2, ExternalLink, Loader2, Images } from "lucide-react";
import { PageKop } from "../../components/admin/ui/PageKop";
import { api } from "../../lib/api";
import { AlbumBlokken } from "../../components/admin/AlbumBlokken";
import { FotoRaster } from "../../components/admin/galerij/FotoRaster";
import { UploadKaart } from "../../components/admin/galerij/UploadKaart";
import type { AlbumBlok, GalleryAlbum, GalleryCategory, GalleryItem } from "@shared/schema";

type AlbumMetTelling = GalleryAlbum & { itemCount: number };

/**
 * Eén event, en alles wat je eraan kunt hangen: de gegevens, het verhaal, de foto's.
 *
 * Dit scherm bestond niet. Het event was een *pil* in een rij boven een fotoraster, met zijn
 * gegevens in een uitklapformuliertje — terwijl het event juist het ding is dat je aankleedt.
 * Vandaar een eigen pagina, zoals `/admin/klanten/:id` dat voor een klant is.
 */
export default function GalleryEventPage() {
  const qc = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const albumId = Number(id);

  const { data: albums, isLoading } = useQuery({
    queryKey: ["admin", "gallery", "albums"],
    queryFn: () => api.get<AlbumMetTelling[]>("/api/admin/gallery/albums"),
  });
  const { data: cats } = useQuery({
    queryKey: ["admin", "gallery", "categories"],
    queryFn: () => api.get<GalleryCategory[]>("/api/admin/gallery/categories"),
  });
  const { data: items } = useQuery({
    queryKey: ["admin", "gallery"],
    queryFn: () => api.get<GalleryItem[]>("/api/admin/gallery"),
  });

  /**
   * De blokken worden **lokaal** bewerkt en pas op de knop opgeslagen.
   *
   * Ze gingen eerst bij elke klik direct naar de server, en dat kon niet werken: het schema
   * eist `inhoud.min(1)`, dus een vers toegevoegd — en dus nog leeg — tekstblok werd met een
   * 400 geweigerd en verdween meteen weer. Bovendien zou typen een verzoek per toetsaanslag
   * opleveren.
   *
   * `null` betekent "gelijk aan wat er op de server staat".
   */
  const [concept, setConcept] = useState<AlbumBlok[] | null>(null);

  const album = albums?.find((a) => a.id === albumId) ?? null;
  const categorie = cats?.find((c) => c.id === album?.categoryId) ?? null;
  const fotos = (items ?? []).filter((i) => i.albumId === albumId);

  useEffect(() => setConcept(null), [albumId]);

  const ververs = () => {
    qc.invalidateQueries({ queryKey: ["admin", "gallery"] });
    qc.invalidateQueries({ queryKey: ["public", "gallery"] });
  };

  const bijwerken = useMutation({
    mutationFn: (velden: Record<string, unknown>) =>
      api.patch(`/api/admin/gallery/albums/${albumId}`, velden),
    onSuccess: ververs,
  });
  const itemPatch = useMutation({
    mutationFn: ({ id: itemId, ...rest }: { id: number } & Record<string, unknown>) =>
      api.patch(`/api/admin/gallery/${itemId}`, rest),
    onSuccess: ververs,
  });
  const itemVerwijderen = useMutation({
    mutationFn: (itemId: number) => api.delete(`/api/admin/gallery/${itemId}`),
    onSuccess: ververs,
  });
  const verwijderen = useMutation({
    mutationFn: () => api.delete(`/api/admin/gallery/albums/${albumId}`),
    onSuccess: ververs,
  });

  const blokkenOpslaan = useMutation({
    mutationFn: (blokken: AlbumBlok[]) => {
      // Lege blokken zijn plaatshouders, geen inhoud. Ze gaan er hier uit; het scherm zegt
      // per blok dat het leeg is, dus dat is geen verrassing.
      const schoon = blokken.filter((b) =>
        b.soort === "fotos" ? b.itemIds.length > 0 : b.inhoud.trim().length > 0,
      );
      return api.patch(`/api/admin/gallery/albums/${albumId}`, {
        blocks: schoon.length ? schoon : null,
      });
    },
    onSuccess: () => {
      setConcept(null);
      ververs();
    },
  });

  /** Eén veld opslaan bij wegklikken; leeg wordt `null`. */
  const veld = (naam: string) => (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const waarde = e.target.value.trim();
    const huidig = (album as Record<string, unknown> | null)?.[naam] ?? "";
    if (waarde !== String(huidig ?? "")) bijwerken.mutate({ [naam]: waarde || null });
  };

  if (isLoading) {
    return <div className="py-20 text-center text-sm text-charcoal/70">Laden…</div>;
  }

  // Een verwijderd event of een verzonnen nummer in het webadres: nette melding, geen crash.
  if (!album) {
    return (
      <div className="card py-16 text-center">
        <h1 className="mb-2 text-2xl">Dit event bestaat niet (meer)</h1>
        <p className="mb-6 text-sm text-charcoal/75">
          Mogelijk is het net verwijderd, of klopt het nummer in het webadres niet.
        </p>
        <Link href="/admin/galerij" className="btn-outline">Terug naar de galerij</Link>
      </div>
    );
  }

  const terug = `/admin/galerij${album.categoryId ? `?categorie=${album.categoryId}` : ""}`;
  const blokken = concept ?? ((album.blocks ?? []) as AlbumBlok[]);
  const vuil = concept !== null;

  return (
    <div>
      <Link href={terug} className="mb-4 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-sage-dark hover:gap-3 transition-all">
        <ArrowLeft size={14} /> {categorie?.name ?? "Galerij"}
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <PageKop
          titel={album.title}
          bovenschrift={categorie?.name ?? "Event"}
          icoon={Images}
          onderschrift={
            categorie && (
              <>
                /galerij/{categorie.slug}/{album.slug} · {fotos.length}{" "}
                {fotos.length === 1 ? "foto" : "foto's"}
              </>
            )
          }
        />
        <div className="flex items-center gap-2">
          {categorie && (
            <a
              href={`/galerij/${categorie.slug}/${album.slug}`}
              target="_blank"
              rel="noreferrer"
              className="btn-outline !px-4 !py-2 text-xs"
            >
              Bekijk op de site <ExternalLink size={13} />
            </a>
          )}
          <button
            type="button"
            onClick={() => {
              if (confirm(`Event "${album.title}" verwijderen? De foto's blijven bestaan en komen bij "Losse foto's" te staan.`)) {
                verwijderen.mutate(undefined, {
                  onSuccess: () => { window.location.href = terug; },
                });
              }
            }}
            className="rounded-full p-2 text-charcoal/55 transition hover:bg-burgundy/10 hover:text-burgundy"
            aria-label="Event verwijderen"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* ---------- Het event ---------- */}
        <section className="card">
          <h2 className="tag mb-4">Het event</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="ev-titel">Titel</label>
              <input
                id="ev-titel"
                className="input"
                defaultValue={album.title}
                key={`t-${album.id}`}
                onBlur={(e) => {
                  const w = e.target.value.trim();
                  if (w && w !== album.title) bijwerken.mutate({ title: w });
                }}
              />
            </div>
            <div>
              <label className="label" htmlFor="ev-datum">Datum van het event</label>
              <input
                id="ev-datum"
                type="date"
                className="input"
                defaultValue={album.eventDate ?? ""}
                key={`d-${album.id}`}
                onBlur={veld("eventDate")}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="ev-samenvatting">Samenvatting</label>
              <input
                id="ev-samenvatting"
                className="input"
                placeholder="Pasteltinten met verse bloemen"
                defaultValue={album.description ?? ""}
                key={`s-${album.id}`}
                onBlur={veld("description")}
              />
              <p className="mt-1 text-xs text-charcoal/70">
                Korte zin, staat boven het verhaal. Het uitgebreide verhaal maak je hieronder.
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-charcoal/10 pt-4">
            {/* Het webadres verandert niet mee met de titel: het staat in de publieke URL, en
                automatisch meebewegen zou gedeelde links breken. Dezelfde regel als bij
                gelegenheden. */}
            <p className="text-xs text-charcoal/70">
              Webadres{" "}
              <code className="rounded bg-charcoal/5 px-1.5 py-0.5">
                /galerij/{categorie?.slug}/{album.slug}
              </code>{" "}
              — verandert niet als je de titel aanpast, zodat gedeelde links blijven werken.
            </p>

            {/* `published` bestond al in het schema maar er was nooit een schakelaar voor: elk
                event stond dus op zichtbaar zonder dat iemand dat gekozen had. */}
            <label className="flex cursor-pointer items-center gap-2 text-sm text-charcoal">
              <input
                type="checkbox"
                checked={album.published}
                onChange={(e) => bijwerken.mutate({ published: e.target.checked })}
                className="h-4 w-4 rounded border-charcoal/25 text-sage focus:ring-sage/40"
              />
              Zichtbaar op de site
            </label>
          </div>
        </section>

        {/* ---------- Het verhaal ---------- */}
        <section className="card">
          <h2 className="tag mb-1">Het verhaal</h2>
          <p className="mb-4 text-xs text-charcoal/70">
            Tekst en foto&apos;s door elkaar, in de volgorde waarin ze op de pagina komen.
          </p>

          <AlbumBlokken
            blokken={blokken}
            fotos={fotos}
            onChange={setConcept}
          />

          {/* Verschijnt zodra er iets veranderd is — anders staat er een knop die niets doet. */}
          {vuil && (
            <div className="mt-4 flex flex-wrap items-center justify-end gap-3 border-t border-charcoal/10 pt-4">
              <span className="mr-auto text-xs text-sage-dark">Niet opgeslagen wijzigingen</span>
              <button
                type="button"
                onClick={() => setConcept(null)}
                disabled={blokkenOpslaan.isPending}
                className="btn-ghost !px-4 !py-2 text-xs"
              >
                Annuleren
              </button>
              <button
                type="button"
                onClick={() => blokkenOpslaan.mutate(blokken)}
                disabled={blokkenOpslaan.isPending}
                className="btn-sage !px-5 !py-2 text-xs"
              >
                {blokkenOpslaan.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Verhaal opslaan
              </button>
            </div>
          )}

          {blokkenOpslaan.isError && (
            <p className="mt-2 text-sm text-burgundy">
              {blokkenOpslaan.error instanceof Error ? blokkenOpslaan.error.message : "Opslaan mislukt"}
            </p>
          )}
        </section>

        {/* ---------- Foto's ---------- */}
        <section>
          <h2 className="tag mb-3">Foto&apos;s</h2>
          <div className="space-y-4">
            <UploadKaart
              categoryId={album.categoryId}
              albumId={album.id}
              doelNaam={album.title}
              onKlaar={ververs}
            />
            <FotoRaster
              items={fotos}
              context={{ soort: "event", albumId: album.id, albums: albums ?? [] }}
              onPatch={(v) => itemPatch.mutate(v)}
              onVerwijder={(itemId) => itemVerwijderen.mutate(itemId)}
              onCover={(itemId) => bijwerken.mutate({ coverItemId: itemId })}
              leegTekst="Nog geen foto's in dit event. Upload ze hierboven."
            />
          </div>
        </section>
      </div>
    </div>
  );
}
