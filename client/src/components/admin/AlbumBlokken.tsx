import { ChevronDown, ChevronUp, Trash2, Type, Heading, Images } from "lucide-react";
import type { AlbumBlok, GalleryItem } from "@shared/schema";

/**
 * Het verhaal bij een event samenstellen: tussenkoppen, tekst en groepen foto's, in de
 * volgorde waarin ze op de pagina komen.
 *
 * **Blokken bezitten geen foto's.** Een fotoblok verwijst er alleen naar. Een foto die in geen
 * enkel blok staat verschijnt onderaan op de publieke pagina — dus een nieuwe upload raakt
 * nooit zoek, ook niet als de indeling al klaar was.
 *
 * **Geen opmaak-editor.** Vet en cursief in een `contenteditable` levert rommelige HTML en een
 * aanvalsvlak op een publieke pagina. Platte tekst met regeleindes, en een tussenkop is een
 * eigen bloksoort in plaats van een opmaakknop.
 */
export function AlbumBlokken({
  blokken,
  fotos,
  onChange,
}: {
  blokken: AlbumBlok[];
  /** De foto's van dit album, om uit te kiezen in een fotoblok. */
  fotos: GalleryItem[];
  onChange: (nieuw: AlbumBlok[]) => void;
}) {
  const gebruikt = new Set(blokken.flatMap((b) => (b.soort === "fotos" ? b.itemIds : [])));
  const ongebruikt = fotos.filter((f) => !gebruikt.has(f.id));

  const vervang = (i: number, blok: AlbumBlok) =>
    onChange(blokken.map((b, j) => (j === i ? blok : b)));

  const verplaats = (i: number, richting: -1 | 1) => {
    const j = i + richting;
    if (j < 0 || j >= blokken.length) return;
    const kopie = [...blokken];
    [kopie[i], kopie[j]] = [kopie[j], kopie[i]];
    onChange(kopie);
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
        <div className="flex gap-1">
          <Knop icoon={<Heading size={13} />} onClick={() => onChange([...blokken, { soort: "kop", inhoud: "" }])}>
            Tussenkop
          </Knop>
          <Knop icoon={<Type size={13} />} onClick={() => onChange([...blokken, { soort: "tekst", inhoud: "" }])}>
            Tekst
          </Knop>
          <Knop icoon={<Images size={13} />} onClick={() => onChange([...blokken, { soort: "fotos", itemIds: [] }])}>
            Foto&apos;s
          </Knop>
        </div>
      </div>

      {blokken.length === 0 ? (
        <p className="px-1 py-3 text-xs text-charcoal/70">
          Nog geen indeling. Zonder blokken toont de pagina de omschrijving en daaronder alle
          foto&apos;s — precies zoals nu. Voeg blokken toe om er een verhaal van te maken.
        </p>
      ) : (
        <ol className="space-y-2">
          {blokken.map((blok, i) => {
            // Een leeg blok is een plaatshouder, geen inhoud. Bij opslaan valt hij weg; dat
            // hoort zichtbaar te zijn vóór je op de knop drukt en niet erna.
            const leeg = blok.soort === "fotos" ? blok.itemIds.length === 0 : !blok.inhoud.trim();
            return (
            <li key={i} className={`rounded border bg-white p-2 ${leeg ? "border-dashed border-sage/60" : "border-charcoal/10"}`}>
              <div className="mb-1.5 flex items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-wider text-charcoal/60">
                  {blok.soort === "kop" ? "Tussenkop" : blok.soort === "tekst" ? "Tekst" : "Foto's"}
                </span>
                {leeg && (
                  <span className="text-[10px] text-sage-dark">nog leeg — wordt niet opgeslagen</span>
                )}
                <div className="flex-1" />
                <button type="button" aria-label="Omhoog" disabled={i === 0}
                  onClick={() => verplaats(i, -1)}
                  className="rounded p-0.5 text-charcoal/55 hover:text-charcoal disabled:opacity-25">
                  <ChevronUp size={14} />
                </button>
                <button type="button" aria-label="Omlaag" disabled={i === blokken.length - 1}
                  onClick={() => verplaats(i, 1)}
                  className="rounded p-0.5 text-charcoal/55 hover:text-charcoal disabled:opacity-25">
                  <ChevronDown size={14} />
                </button>
                <button type="button" aria-label="Blok verwijderen"
                  onClick={() => onChange(blokken.filter((_, j) => j !== i))}
                  className="rounded p-0.5 text-charcoal/55 hover:text-burgundy">
                  <Trash2 size={14} />
                </button>
              </div>

              {blok.soort === "kop" && (
                <input
                  className="input !py-1.5 text-sm"
                  placeholder="Bijvoorbeeld: De taart"
                  value={blok.inhoud}
                  onChange={(e) => vervang(i, { soort: "kop", inhoud: e.target.value })}
                />
              )}

              {blok.soort === "tekst" && (
                <textarea
                  className="input min-h-[80px] text-sm"
                  placeholder="Wat er te vertellen valt over dit deel van het feest."
                  value={blok.inhoud}
                  onChange={(e) => vervang(i, { soort: "tekst", inhoud: e.target.value })}
                />
              )}

              {blok.soort === "fotos" && (
                <FotoKiezer
                  fotos={fotos}
                  gekozen={blok.itemIds}
                  onChange={(itemIds) => vervang(i, { soort: "fotos", itemIds })}
                />
              )}
            </li>
            );
          })}
        </ol>
      )}

      {/* Zichtbaar maken wat er buiten de indeling valt, zodat "waar is mijn foto?" niet
          hoeft te ontstaan. */}
      {blokken.length > 0 && ongebruikt.length > 0 && (
        <p className="mt-2 text-xs text-charcoal/70">
          {ongebruikt.length} {ongebruikt.length === 1 ? "foto staat" : "foto's staan"} niet in
          een blok — {ongebruikt.length === 1 ? "die verschijnt" : "die verschijnen"} onderaan
          de pagina.
        </p>
      )}
    </div>
  );
}

function Knop({
  icoon,
  onClick,
  children,
}: {
  icoon: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-full border border-sage/50 px-2.5 py-1 text-[11px] text-sage-dark transition hover:bg-sage/10"
    >
      {icoon}
      {children}
    </button>
  );
}

/** Aanklikken om een foto in of uit het blok te zetten; de volgorde volgt de klikvolgorde. */
function FotoKiezer({
  fotos,
  gekozen,
  onChange,
}: {
  fotos: GalleryItem[];
  gekozen: number[];
  onChange: (ids: number[]) => void;
}) {
  if (fotos.length === 0) {
    return <p className="py-2 text-xs text-charcoal/70">Upload eerst foto&apos;s naar dit event.</p>;
  }

  return (
    <>
      <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
        {fotos.map((f) => {
          const positie = gekozen.indexOf(f.id);
          const aan = positie >= 0;
          return (
            <button
              key={f.id}
              type="button"
              aria-pressed={aan}
              onClick={() =>
                onChange(aan ? gekozen.filter((id) => id !== f.id) : [...gekozen, f.id])
              }
              className={`relative aspect-square overflow-hidden rounded transition ${
                aan ? "ring-2 ring-sage" : "opacity-60 ring-1 ring-charcoal/10 hover:opacity-100"
              }`}
            >
              <img
                src={`/uploads/gallery/${f.filename}`}
                alt={f.altText ?? ""}
                className="absolute inset-0 h-full w-full object-cover"
              />
              {aan && (
                <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-sage text-[10px] text-linen">
                  {positie + 1}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-1 text-[11px] text-charcoal/60">
        Klik om te kiezen. Het nummer is de volgorde binnen dit blok.
      </p>
    </>
  );
}
