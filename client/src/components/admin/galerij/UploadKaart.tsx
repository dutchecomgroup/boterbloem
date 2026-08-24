import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { api } from "../../../lib/api";

/**
 * Foto's uploaden naar een gelegenheid of een event.
 *
 * `image/*` in de bestandskiezer zou ook HEIC aanbieden, en dat kan de server niet omzetten:
 * de meegeleverde Sharp-binaries bevatten libheif zónder HEVC-decoder. De kiezer laat daarom
 * alleen zien wat er ook echt door de verwerking komt. De server weigert HEIC alsnog met een
 * uitleg, voor het geval iemand het bestand er langs sleept.
 */
const TOEGESTAAN = "image/jpeg,image/png,image/webp,image/avif";

export function UploadKaart({
  categoryId,
  albumId,
  doelNaam,
  onKlaar,
}: {
  categoryId: number | null;
  /** Leeg = de foto's komen onder de gelegenheid zonder event. */
  albumId?: number | null;
  /** Waar de foto's heen gaan, in gewone taal. */
  doelNaam: string;
  onKlaar: () => void;
}) {
  const bestandRef = useRef<HTMLInputElement>(null);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  async function upload(bestanden: FileList | null) {
    if (!bestanden?.length) return;
    setBezig(true);
    setFout(null);
    try {
      const form = new FormData();
      Array.from(bestanden).forEach((f) => form.append("files", f));
      if (categoryId) form.append("categoryId", String(categoryId));
      if (albumId) form.append("albumId", String(albumId));
      await api.upload("/api/admin/gallery", form);
      onKlaar();
    } catch (e) {
      // De server schrijft zijn meldingen voor een mens ("groter dan 10 MB", de HEIC-uitleg),
      // dus die tonen we zoals ze zijn.
      setFout(e instanceof Error ? e.message : "Uploaden mislukt");
    } finally {
      setBezig(false);
      if (bestandRef.current) bestandRef.current.value = "";
    }
  }

  return (
    <div className="card">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="text-sm text-charcoal/75">
          Uploaden naar <strong className="text-charcoal">{doelNaam}</strong>
        </div>
        <input
          ref={bestandRef}
          type="file"
          multiple
          accept={TOEGESTAAN}
          className="hidden"
          onChange={(e) => void upload(e.target.files)}
        />
        <button
          type="button"
          onClick={() => bestandRef.current?.click()}
          disabled={bezig || !categoryId}
          className="btn-gold !px-5 !py-2 text-xs"
        >
          <Upload size={14} /> {bezig ? "Bezig…" : "Foto's kiezen"}
        </button>
      </div>

      {fout && <p className="mt-3 text-sm text-burgundy">{fout}</p>}
    </div>
  );
}
