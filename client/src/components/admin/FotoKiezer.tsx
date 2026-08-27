import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Upload, Images, Trash2, Check } from "lucide-react";
import { api } from "../../lib/api";
import { imageSrc } from "../../lib/images";
import type { GalleryItem } from "@shared/schema";

/**
 * Een foto kiezen voor een plek op de site.
 *
 * Er stond eerst een tekstveld met het opschrift "Foto bestandsnaam", waar je letterlijk
 * `a3f9c2e1-….webp` in moest typen. In de woorden van de gebruiker: *"dit kan een gebruiker
 * toch niet gebruiken?"* Klopt: die naam staat nergens in beeld, dus je moest de database
 * kennen om het veld in te vullen.
 *
 * Nu een voorbeeld van de gekozen foto met twee knoppen: kiezen uit wat er al is, of een
 * nieuwe uploaden. De opgeslagen waarde blijft de bestandsnaam, dus aan de publieke kant
 * verandert er niets.
 */

/** Zie `UploadKaart`: HEIC komt door de mimetype-filter maar niet door Sharp. */
const TOEGESTAAN = "image/jpeg,image/png,image/webp,image/avif";

/**
 * Waar een foto landt die hier geüpload wordt.
 *
 * De galerij weigert een upload zonder gelegenheid, en dat is met opzet: een foto die nergens
 * onder staat is onvindbaar. Maar een portret van de eigenaar hoort niet tussen de feesten in
 * de publieke galerij. Vandaar een eigen gelegenheid die op niet-gepubliceerd staat, zodat hij
 * hier wél te kiezen is en op de site niet verschijnt.
 */
const SITEFOTOS_SLUG = "sitefotos";

interface Categorie {
  id: number;
  slug: string;
  name: string;
}

export function FotoKiezer({
  waarde,
  onKies,
  leegTekst = "Nog geen foto gekozen",
}: {
  /** De opgeslagen bestandsnaam, of leeg. */
  waarde: string | undefined;
  onKies: (bestandsnaam: string) => void;
  leegTekst?: string;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const bestandRef = useRef<HTMLInputElement>(null);

  const { data: fotos } = useQuery({
    queryKey: ["admin", "gallery"],
    queryFn: () => api.get<GalleryItem[]>("/api/admin/gallery"),
    enabled: open,
  });
  const { data: categorieen } = useQuery({
    queryKey: ["admin", "gallery", "categories"],
    queryFn: () => api.get<Categorie[]>("/api/admin/gallery/categories"),
  });

  async function upload(bestanden: FileList | null) {
    const bestand = bestanden?.[0];
    if (!bestand) return;

    const site = categorieen?.find((c) => c.slug === SITEFOTOS_SLUG);
    if (!site) {
      setFout(
        'De gelegenheid "Sitefoto\'s" bestaat nog niet. Draai `npm run seed:admin` om hem aan te maken.',
      );
      return;
    }

    setBezig(true);
    setFout(null);
    try {
      const form = new FormData();
      form.append("files", bestand);
      form.append("categoryId", String(site.id));
      const [nieuw] = await api.upload<GalleryItem[]>("/api/admin/gallery", form);
      qc.invalidateQueries({ queryKey: ["admin", "gallery"] });
      onKies(nieuw.filename);
      setOpen(false);
    } catch (e) {
      // De server schrijft zijn meldingen voor een mens ("groter dan 10 MB", de HEIC-uitleg).
      setFout(e instanceof Error ? e.message : "Uploaden mislukt");
    } finally {
      setBezig(false);
      if (bestandRef.current) bestandRef.current.value = "";
    }
  }

  const naamPerCategorie = new Map((categorieen ?? []).map((c) => [c.id, c.name]));

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-blush/30 ring-1 ring-sage/15">
          {waarde ? (
            <img src={imageSrc({ filename: waarde })} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center px-2 text-center text-[10px] leading-tight text-charcoal/40">
              {leegTekst}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setOpen(true)} className="btn-outline !px-4 !py-2 text-xs">
            <Images size={14} /> Kies uit je galerij
          </button>
          <button
            type="button"
            onClick={() => bestandRef.current?.click()}
            disabled={bezig}
            className="btn-ghost !px-4 !py-2 text-xs"
          >
            <Upload size={14} /> {bezig ? "Bezig…" : "Foto uploaden"}
          </button>
          {waarde && (
            <button
              type="button"
              onClick={() => onKies("")}
              className="btn-ghost !px-4 !py-2 text-xs text-burgundy"
            >
              <Trash2 size={14} /> Weghalen
            </button>
          )}
        </div>
      </div>

      <input
        ref={bestandRef}
        type="file"
        accept={TOEGESTAAN}
        className="hidden"
        onChange={(e) => void upload(e.target.files)}
      />

      {fout && <p className="mt-2 text-sm text-burgundy">{fout}</p>}

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-charcoal/40 backdrop-blur-sm data-[state=open]:animate-sheet-fade" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[85vh] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg bg-linen p-6 shadow-2xl outline-none">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <Dialog.Title className="font-display text-xl text-charcoal">Kies een foto</Dialog.Title>
                <Dialog.Description className="mt-0.5 text-sm text-charcoal/75">
                  Alle foto's die je in de galerij hebt staan.
                </Dialog.Description>
              </div>
              <Dialog.Close className="-mr-1 rounded-full p-2 text-charcoal/70 hover:bg-charcoal/5" aria-label="Sluiten">
                <X size={18} />
              </Dialog.Close>
            </div>

            <div className="-mx-1 flex-1 overflow-y-auto px-1">
              {!fotos ? (
                <p className="py-12 text-center text-sm text-charcoal/40">Laden…</p>
              ) : fotos.length === 0 ? (
                <p className="py-12 text-center text-sm text-charcoal/50">
                  Je hebt nog geen foto's. Upload er een met de knop hiernaast.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                  {fotos.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        onKies(f.filename);
                        setOpen(false);
                      }}
                      title={f.altText ?? naamPerCategorie.get(f.categoryId ?? -1) ?? ""}
                      className={`group relative aspect-square overflow-hidden rounded-lg ring-1 transition ${
                        f.filename === waarde
                          ? "ring-2 ring-sage"
                          : "ring-sage/15 hover:ring-sage/50"
                      }`}
                    >
                      <img
                        src={imageSrc(f)}
                        alt={f.altText ?? ""}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                      {f.filename === waarde && (
                        <span className="absolute right-1.5 top-1.5 rounded-full bg-sage p-1 text-linen">
                          <Check size={12} />
                        </span>
                      )}
                      {/* Waar de foto vandaan komt, zodat je een portret niet verwart met een
                          feestfoto die er toevallig op lijkt. */}
                      <span className="absolute inset-x-0 bottom-0 truncate bg-charcoal/70 px-1.5 py-1 text-left text-[10px] text-linen opacity-0 transition-opacity group-hover:opacity-100">
                        {naamPerCategorie.get(f.categoryId ?? -1) ?? "Losse foto"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
