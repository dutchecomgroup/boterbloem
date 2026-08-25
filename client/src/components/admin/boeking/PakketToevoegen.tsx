import { useEffect, useState } from "react";
import { Plus, Loader2, AlertCircle } from "lucide-react";
import { centenNaarTekst, naarCenten, pakketVoorbeeld, standaardAantal } from "../../../lib/boeking";

/**
 * Een pakket omzetten in regels — direct boven de regeltabel, want dat is waar het effect
 * landt.
 *
 * Stond eerder als "Regels overnemen" in een aparte sectie *"Wat"*, en dat werkte niet: je
 * moest eerst het pakket op de boeking zetten, dan een knop zoeken die ergens anders stond, en
 * pas ná het klikken zag je wat eruit kwam. Nu kies je een pakket en staat het bedrag er
 * meteen bij — inclusief de vermenigvuldiging met het aantal personen.
 *
 * **Toevoegen, niet vervangen.** Wie eerst een paar regels typt en daarna een pakket kiest,
 * raakt die regels niet kwijt.
 */

export type PakketOptie = {
  id: number;
  name: string;
  priceFrom: string;
  priceUnit: string;
  includes: string[];
  active: boolean;
};

export function PakketToevoegen({
  pakketten,
  personen,
  gekozenId,
  toevoegen,
}: {
  pakketten: PakketOptie[];
  personen: number | null;
  /** Het pakket dat al op de boeking staat — dat is de logische eerste keuze. */
  gekozenId: number | null;
  toevoegen: (packageId: number, aantal: number) => Promise<unknown>;
}) {
  const [keuze, setKeuze] = useState<number | null>(gekozenId);
  const [aantal, setAantal] = useState("1");
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  // Een inactief pakket blijft kiesbaar als het al op de boeking staat: scenario 21 — de klant
  // vroeg erom toen het nog aanstond, en dan moet je hem kunnen blijven gebruiken.
  const kiesbaar = pakketten.filter((p) => p.active || p.id === gekozenId);
  const pakket = kiesbaar.find((p) => p.id === keuze) ?? null;

  // Bij het kiezen van een pakket een zinnig aantal voorstellen — het aantal gasten bij een
  // prijs per persoon, anders één. Alleen een startwaarde: wie er twee pakketten naast elkaar
  // wil, past het aan.
  useEffect(() => {
    if (pakket) setAantal(String(standaardAantal(pakket, personen)));
  }, [pakket?.id, personen]); // eslint-disable-line react-hooks/exhaustive-deps

  const aantalGetal = Number(aantal.replace(",", "."));
  const geldigAantal = Number.isFinite(aantalGetal) && aantalGetal > 0;
  const voorbeeld = pakket && geldigAantal ? pakketVoorbeeld(pakket, aantalGetal) : null;

  async function doen() {
    if (!pakket || !geldigAantal) return;
    setBezig(true);
    setFout(null);
    try {
      await toevoegen(pakket.id, aantalGetal);
    } catch (err) {
      setFout(err instanceof Error ? err.message : "Toevoegen mislukt");
    } finally {
      setBezig(false);
    }
  }

  if (kiesbaar.length === 0) {
    return (
      <p className="mb-2.5 rounded-md border-l-2 border-gold/50 bg-cream/70 px-3 py-2 text-xs text-charcoal/75">
        Er zijn nog geen actieve pakketten. Zet ze aan op{" "}
        <a href="/admin/pakketten" className="text-gold-dark underline-offset-2 hover:underline">
          Pakketten
        </a>
        .
      </p>
    );
  }

  return (
    <div className="mb-2.5 rounded-md border border-gold/30 bg-gold/[0.06] px-3 py-2.5">
      <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-gold-dark">
        Voeg pakket toe
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={keuze ?? ""}
          onChange={(e) => {
            setKeuze(e.target.value ? Number(e.target.value) : null);
            setFout(null);
          }}
          aria-label="Pakket"
          className="min-w-0 flex-1 rounded border border-charcoal/15 bg-white px-2 py-1.5 text-sm outline-none focus:border-gold"
        >
          <option value="">Kies een pakket…</option>
          {kiesbaar.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
              {!p.active ? " (niet actief)" : ""}
            </option>
          ))}
        </select>

        {/* Zelf te zetten: bij tien gasten kan het vijf van dit pakket en vijf van een ander
            zijn. Alleen zichtbaar zodra er een pakket gekozen is. */}
        {pakket && (
          <label className="flex shrink-0 items-center gap-1.5 text-xs text-charcoal/75">
            <span>Aantal</span>
            <input
              inputMode="decimal"
              value={aantal}
              onChange={(e) => setAantal(e.target.value)}
              aria-label="Aantal"
              className={`w-16 rounded border bg-white px-2 py-1.5 text-right text-sm tabular-nums outline-none focus:border-gold ${
                geldigAantal ? "border-charcoal/15" : "border-burgundy"
              }`}
            />
            {pakket.priceUnit === "per_persoon" && <span className="text-charcoal/65">p.</span>}
          </label>
        )}

        <button
          type="button"
          onClick={() => void doen()}
          disabled={!pakket || !geldigAantal || bezig}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gold px-4 py-1.5 text-xs uppercase tracking-widest text-cream transition hover:bg-gold-dark disabled:opacity-40"
        >
          {bezig ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Toevoegen
        </button>
      </div>

      {/* De rekensom staat er vóór het klikken, niet erna. Dit is precies de plek waar een
          pakket per persoon anders uitpakt dan je verwacht. */}
      {voorbeeld && pakket && (
        <p className="mt-2 text-sm text-charcoal/80">
          {aantalGetal} × {centenNaarTekst(naarCenten(pakket.priceFrom))}
          {voorbeeld.perPersoon ? " p.p." : ""} ={" "}
          <strong className="tabular-nums">{centenNaarTekst(voorbeeld.totaalCenten)}</strong>
          <span className="text-charcoal/65">
            {" · "}één regel
            {voorbeeld.subregels > 0 && `, met ${voorbeeld.subregels} onderdelen eronder`}
          </span>

          {/* Scenario 45: een pakket waarvan de prijs nog niet bekend is. Dat mag, maar het
              moet niet als "gratis" overkomen. */}
          {voorbeeld.totaalCenten === 0 && (
            <span className="mt-1 flex items-start gap-1 text-xs text-gold-dark">
              <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
              Dit pakket heeft nog geen prijs — de regel komt er op € 0,00 in.
            </span>
          )}

          {voorbeeld.perPersoon && personen === null && (
            <span className="mt-1 flex items-start gap-1 text-xs text-gold-dark">
              <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
              Het aantal personen staat nog niet in de boeking — controleer het aantal hiernaast.
            </span>
          )}
        </p>
      )}

      {!geldigAantal && pakket && (
        <p className="mt-1.5 text-xs text-burgundy">Vul een aantal groter dan nul in.</p>
      )}

      {fout && <p className="mt-1.5 text-xs text-burgundy">{fout}</p>}
    </div>
  );
}
