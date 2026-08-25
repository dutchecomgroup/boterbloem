import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "../../lib/api";
import { BTW_LABEL, type BtwTarief, type Package } from "@shared/schema";
import { Plus, Trash2, GripVertical, X, ChevronUp, ChevronDown, ExternalLink } from "lucide-react";
import { personenBereik } from "../../lib/utils";

const LEEG: Partial<Package> = {
  name: "", slug: "", tagline: "", description: "",
  priceFrom: "0", priceUnit: "totaal", includes: [], active: false, featured: false,
  vatRate: null, vatSplitLow: null, vatSplitHigh: null,
};

export default function PackagesPage() {
  const qc = useQueryClient();
  const [bewerk, setBewerk] = useState<Partial<Package> | null>(null);
  const [fout, setFout] = useState<string | null>(null);

  const { data: pakketten } = useQuery({
    queryKey: ["admin", "packages"],
    queryFn: () => api.get<Package[]>("/api/admin/packages"),
  });

  const ververs = () => {
    qc.invalidateQueries({ queryKey: ["admin", "packages"] });
    qc.invalidateQueries({ queryKey: ["public", "packages"] });
  };

  const opslaan = useMutation({
    mutationFn: (p: Partial<Package>) => {
      const body = {
        name: p.name, slug: p.slug || slugify(p.name ?? ""),
        tagline: p.tagline || null, description: p.description || null,
        priceFrom: String(p.priceFrom ?? "0"), priceUnit: p.priceUnit ?? "totaal",
        personsMin: p.personsMin ?? null, personsMax: p.personsMax ?? null,
        includes: p.includes ?? [], active: p.active ?? false, featured: p.featured ?? false,
        vatRate: p.vatRate ?? null,
        vatSplitLow: p.vatSplitLow ? String(p.vatSplitLow).replace(",", ".") : null,
        vatSplitHigh: p.vatSplitHigh ? String(p.vatSplitHigh).replace(",", ".") : null,
        sortOrder: p.sortOrder ?? (pakketten?.length ?? 0),
      };
      return p.id ? api.patch(`/api/admin/packages/${p.id}`, body) : api.post("/api/admin/packages", body);
    },
    onSuccess: () => { ververs(); setBewerk(null); },
    onError: (e: Error) => setFout(e.message),
  });

  const schakel = useMutation({
    mutationFn: ({ id, ...rest }: { id: number } & Record<string, unknown>) =>
      api.patch(`/api/admin/packages/${id}`, rest),
    onSuccess: ververs,
    onError: (e: Error) => setFout(e.message),
  });

  const verwijderen = useMutation({
    mutationFn: (id: number) => api.delete(`/api/admin/packages/${id}`),
    onSuccess: ververs,
  });

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
        <h1 className="text-3xl">Pakketten</h1>
        <button className="btn-gold !py-2 !px-5 text-xs" onClick={() => setBewerk({ ...LEEG })}>
          <Plus size={14} /> Pakket toevoegen
        </button>
      </div>
      <p className="text-charcoal/60 text-sm mb-6 max-w-2xl">
        Sweet tables en grazing tables met een vanaf-prijs. Een pakket verschijnt pas op de
        site als je hem op <strong>actief</strong> zet — zo kun je hem eerst rustig invullen.
      </p>

      {fout && (
        <div className="card mb-4 border-burgundy/30 text-burgundy text-sm flex items-start justify-between gap-4">
          <span>{fout}</span><button onClick={() => setFout(null)}><X size={16} /></button>
        </div>
      )}

      {bewerk && (
        <Formulier
          pakket={bewerk}
          onChange={setBewerk}
          onOpslaan={() => opslaan.mutate(bewerk)}
          onAnnuleer={() => setBewerk(null)}
          bezig={opslaan.isPending}
        />
      )}

      <div className="space-y-3">
        {pakketten?.map((p) => (
          <div key={p.id} className="card flex flex-wrap items-start gap-4">
            <GripVertical size={16} className="text-charcoal/20 mt-1 shrink-0" />
            <div className="flex-1 min-w-[220px]">
              <div className="flex items-baseline gap-2 flex-wrap">
                <h2 className="text-xl">{p.name}</h2>
                <span className="text-xs text-charcoal/40">/{p.slug}</span>
                {!p.active && (
                  <span className="text-[10px] uppercase tracking-widest bg-charcoal/10 text-charcoal/60 px-2 py-0.5 rounded">
                    niet zichtbaar
                  </span>
                )}
              </div>
              {p.tagline && <p className="text-sm text-charcoal/60 mt-0.5">{p.tagline}</p>}
              <div className="mt-2 text-sm">
                {Number(p.priceFrom) > 0 ? (
                  <span className="text-gold-dark font-medium">
                    vanaf € {Number(p.priceFrom).toFixed(2).replace(".", ",")}
                    {p.priceUnit === "per_persoon" && " p.p."}
                  </span>
                ) : (
                  <span className="text-burgundy">nog geen prijs ingevuld</span>
                )}
                {personenBereik(p.personsMin, p.personsMax) && (
                  <span className="text-charcoal/50 ml-2">
                    · {personenBereik(p.personsMin, p.personsMax)}
                  </span>
                )}
                {/*
                  Er is geen bedrijfsbrede btw-instelling meer, dus dit is het enige wat je
                  eraan herinnert dat dit pakket nog geen tarief heeft. Zonder markering zou het
                  stil op "geen btw" blijven staan zodra je btw-plichtig wordt.
                */}
                <span className="ml-2 text-charcoal/50">· btw {btwOmschrijving(p)}</span>
              </div>
              {p.includes.length > 0 && (
                <ul className="mt-2 text-xs text-charcoal/60 space-y-0.5">
                  {p.includes.map((r, i) => <li key={i}>· {r}</li>)}
                </ul>
              )}

              {/* Waar dit pakket terechtkomt, in gewone taal. De twee schakelaars heetten
                  "Zichtbaar op de site" en "Uitgelicht op home" zonder te zeggen wélke pagina
                  dat is — dan is niet af te lezen wat aanzetten oplevert. */}
              <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-charcoal/70">
                <span aria-hidden>📍</span>
                {p.active ? (
                  <>
                    <span>Staat op <strong>/aanbod</strong></span>
                    {p.featured && <span>· en uitgelicht op de <strong>homepage</strong></span>}
                    <a
                      href="/aanbod"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-gold-dark underline-offset-2 hover:underline"
                    >
                      Bekijk op de site <ExternalLink size={11} />
                    </a>
                  </>
                ) : (
                  <span className="text-burgundy">
                    Staat <strong>nergens</strong> op de site — zet "Zichtbaar op de site" aan.
                    {p.featured && " (uitgelicht telt pas mee als het pakket zichtbaar is)"}
                  </span>
                )}
              </p>
            </div>
            <div className="flex flex-col gap-2 items-end shrink-0">
              <label className="flex items-center gap-2 text-xs text-charcoal/60">
                <input type="checkbox" checked={p.active}
                  onChange={(e) => schakel.mutate({ id: p.id, active: e.target.checked })} />
                Zichtbaar op de site
              </label>
              <label className="flex items-center gap-2 text-xs text-charcoal/60">
                <input type="checkbox" checked={p.featured}
                  onChange={(e) => schakel.mutate({ id: p.id, featured: e.target.checked })} />
                Uitgelicht op home
              </label>
              <div className="flex gap-2 mt-1">
                <button className="btn-outline !py-1.5 !px-3 text-xs" onClick={() => setBewerk(p)}>Bewerken</button>
                <button className="p-1.5 text-charcoal/40 hover:text-burgundy"
                  onClick={() => confirm(`"${p.name}" verwijderen?`) && verwijderen.mutate(p.id)}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {pakketten?.length === 0 && (
          <div className="card text-center text-charcoal/40 py-16 text-sm">Nog geen pakketten.</div>
        )}
      </div>
    </div>
  );
}

function Formulier({ pakket, onChange, onOpslaan, onAnnuleer, bezig }: {
  pakket: Partial<Package>;
  onChange: (p: Partial<Package>) => void;
  onOpslaan: () => void;
  onAnnuleer: () => void;
  bezig: boolean;
}) {
  const regels = pakket.includes ?? [];
  const zetRegel = (i: number, v: string) =>
    onChange({ ...pakket, includes: regels.map((r, j) => (j === i ? v : r)) });

  /** De volgorde bepaalt hoe het pakket op /aanbod leest — het belangrijkste bovenaan. */
  const verplaats = (i: number, richting: -1 | 1) => {
    const j = i + richting;
    if (j < 0 || j >= regels.length) return;
    const nieuw = [...regels];
    [nieuw[i], nieuw[j]] = [nieuw[j], nieuw[i]];
    onChange({ ...pakket, includes: nieuw });
  };

  return (
    <div className="card mb-6 border-gold/30">
      <h2 className="text-xl mb-4">{pakket.id ? "Pakket bewerken" : "Nieuw pakket"}</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Naam *</label>
          <input className="input" value={pakket.name ?? ""}
            onChange={(e) => onChange({
              ...pakket, name: e.target.value,
              slug: pakket.id ? pakket.slug : slugify(e.target.value),
            })} />
        </div>
        <div>
          <label className="label">Eén zin eronder</label>
          <input className="input" placeholder="Voor grotere feesten vanaf 40 gasten"
            value={pakket.tagline ?? ""} onChange={(e) => onChange({ ...pakket, tagline: e.target.value })} />
        </div>
        <div>
          <label className="label">Vanaf-prijs</label>
          <input className="input" type="number" step="0.01" min="0" value={pakket.priceFrom ?? "0"}
            onChange={(e) => onChange({ ...pakket, priceFrom: e.target.value })} />
        </div>
        <div>
          <label className="label">Prijs geldt</label>
          <select className="input" value={pakket.priceUnit ?? "totaal"}
            onChange={(e) => onChange({ ...pakket, priceUnit: e.target.value })}>
            <option value="totaal">als totaalprijs</option>
            <option value="per_persoon">per persoon</option>
          </select>
        </div>
        <div>
          <label className="label">Vanaf personen</label>
          <input className="input" type="number" min="1" value={pakket.personsMin ?? ""}
            onChange={(e) => onChange({ ...pakket, personsMin: e.target.value ? Number(e.target.value) : null })} />
        </div>
        <div>
          <label className="label">Tot personen</label>
          <input className="input" type="number" min="1" value={pakket.personsMax ?? ""}
            onChange={(e) => onChange({ ...pakket, personsMax: e.target.value ? Number(e.target.value) : null })} />
        </div>
        <div className="sm:col-span-2 rounded-lg bg-cream/60 p-4 ring-1 ring-gold/15">
          <BtwBlok pakket={pakket} onChange={onChange} />
        </div>

        <div className="sm:col-span-2">
          <label className="label">Beschrijving</label>
          <textarea className="input min-h-[80px]" value={pakket.description ?? ""}
            onChange={(e) => onChange({ ...pakket, description: e.target.value })} />
        </div>
      </div>

      <div className="mt-4">
        <label className="label">Wat zit erin</label>
        <div className="space-y-2">
          {regels.map((r, i) => (
            <div key={i} className="flex gap-1 items-center">
              <div className="flex flex-col shrink-0">
                <button
                  type="button"
                  className="px-1 text-charcoal/30 hover:text-charcoal disabled:opacity-20"
                  disabled={i === 0}
                  onClick={() => verplaats(i, -1)}
                  aria-label="Regel omhoog"
                ><ChevronUp size={14} /></button>
                <button
                  type="button"
                  className="px-1 text-charcoal/30 hover:text-charcoal disabled:opacity-20"
                  disabled={i === regels.length - 1}
                  onClick={() => verplaats(i, 1)}
                  aria-label="Regel omlaag"
                ><ChevronDown size={14} /></button>
              </div>
              <input className="input !py-2" value={r} onChange={(e) => zetRegel(i, e.target.value)} />
              <button
                type="button"
                className="p-2 text-charcoal/40 hover:text-burgundy shrink-0"
                onClick={() => onChange({ ...pakket, includes: regels.filter((_, j) => j !== i) })}
                aria-label="Regel verwijderen"
              ><Trash2 size={15} /></button>
            </div>
          ))}
          <button className="btn-ghost !py-2 !px-3 text-xs"
            onClick={() => onChange({ ...pakket, includes: [...regels, ""] })}>
            <Plus size={14} /> Regel toevoegen
          </button>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button className="btn-ghost !py-2 !px-4 text-xs" onClick={onAnnuleer}>Annuleren</button>
        {/* Een verdeling die niet optelt tot de pakketprijs zou een ander bedrag op de offerte
            zetten dan de klant op de site zag. Dat mag niet stil gebeuren. */}
        <button
          className="btn-gold !py-2 !px-5 text-xs"
          disabled={!pakket.name?.trim() || bezig || verdelingKlopt(pakket) === false}
          title={verdelingKlopt(pakket) === false ? "De btw-verdeling telt niet op tot de vanaf-prijs." : undefined}
          onClick={onOpslaan}
        >
          {bezig ? "Opslaan…" : "Opslaan"}
        </button>
      </div>
    </div>
  );
}

function slugify(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120);
}

/* -------------------------------------------------------------------------- */

/** De optelsom van de verdeling in centen, zodat er niet met halve centen vergeleken wordt. */
function centen(v: string | null | undefined): number {
  const n = Number(String(v ?? "0").replace(",", "."));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

export function heeftVerdeling(p: Partial<Package>): boolean {
  return centen(p.vatSplitLow) > 0 || centen(p.vatSplitHigh) > 0;
}

/**
 * Klopt de verdeling met de pakketprijs? `null` betekent: er is geen verdeling, dus niets te
 * controleren.
 *
 * Dit is geen nette-heid maar een rem: wijkt de som af, dan staat er op de offerte een ander
 * bedrag dan de prijs die de klant op de site zag.
 */
export function verdelingKlopt(p: Partial<Package>): boolean | null {
  if (!heeftVerdeling(p)) return null;
  return centen(p.vatSplitLow) + centen(p.vatSplitHigh) === centen(p.priceFrom);
}

/**
 * Btw bij een pakket.
 *
 * Twee vormen, want een pakket is óf één ding óf een samenstelling:
 *
 * - **Eén tarief** als het pakket één prestatie is — een taart bezorgen is eten, en dat is 9%.
 * - **Een verdeling** als er eten én verhuur/opbouw in zit. De Belastingdienst staat niet toe
 *   dat het 21%-deel meelift op het lage tarief van het eten; bij één prijs naar de klant moet
 *   het bedrag aan de achterkant gesplitst worden volgens de marktwaarde.
 *
 * De bedragen zijn **per eenheid**, net als de vanaf-prijs. Staat de prijs per persoon, dan is
 * dit dus € 22,00 eten en € 3,00 servies bij € 25,00 p.p.; het aantal gasten op de regel doet
 * de vermenigvuldiging.
 */
function BtwBlok({
  pakket,
  onChange,
}: {
  pakket: Partial<Package>;
  onChange: (p: Partial<Package>) => void;
}) {
  const gesplitst = heeftVerdeling(pakket);
  const klopt = verdelingKlopt(pakket);
  const som = centen(pakket.vatSplitLow) + centen(pakket.vatSplitHigh);
  const perStuk = pakket.priceUnit === "per_persoon" ? " p.p." : "";

  return (
    <fieldset>
      <legend className="label">Btw over dit pakket</legend>

      <label className="mt-1 flex items-start gap-2.5 text-sm">
        <input
          type="radio"
          name="btwvorm"
          className="mt-1"
          checked={!gesplitst}
          onChange={() => onChange({ ...pakket, vatSplitLow: null, vatSplitHigh: null })}
        />
        <span>
          Eén tarief voor het hele pakket
          {!gesplitst && (
            <select
              className="input mt-1.5"
              value={pakket.vatRate ?? ""}
              onChange={(e) => onChange({ ...pakket, vatRate: e.target.value || null })}
            >
              <option value="">Nog niet ingesteld</option>
              {(Object.keys(BTW_LABEL) as BtwTarief[]).map((t) => (
                <option key={t} value={t}>{BTW_LABEL[t]}</option>
              ))}
            </select>
          )}
        </span>
      </label>

      <label className="mt-3 flex items-start gap-2.5 text-sm">
        <input
          type="radio"
          name="btwvorm"
          className="mt-1"
          checked={gesplitst}
          onChange={() =>
            onChange({ ...pakket, vatSplitLow: String(pakket.priceFrom ?? "0"), vatSplitHigh: "0" })
          }
        />
        <span className="flex-1">
          Splitsen, want er zit eten <em>en</em> styling of materiaal in
        </span>
      </label>

      {gesplitst && (
        <div className="mt-3 space-y-3 border-l-2 border-gold/30 pl-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Waarvan eten en drinken (9%)</label>
              <input
                className="input"
                inputMode="decimal"
                value={pakket.vatSplitLow ?? ""}
                onChange={(e) => onChange({ ...pakket, vatSplitLow: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Waarvan styling, materiaal en opbouw (21%)</label>
              <input
                className="input"
                inputMode="decimal"
                value={pakket.vatSplitHigh ?? ""}
                onChange={(e) => onChange({ ...pakket, vatSplitHigh: e.target.value })}
              />
            </div>
          </div>

          {/* De optelsom in beeld, want een verdeling die niet klopt zet een ander bedrag op de
              offerte dan de prijs die de klant op de site zag. */}
          <p className={`text-xs ${klopt ? "text-emerald-700" : "text-burgundy"}`}>
            Samen € {(som / 100).toFixed(2).replace(".", ",")}{perStuk}
            {klopt
              ? " — klopt met de vanaf-prijs."
              : ` — dit hoort € ${Number(pakket.priceFrom ?? 0).toFixed(2).replace(".", ",")}${perStuk} te zijn.`}
          </p>

          <p className="text-xs text-charcoal/55">
            Dit pakket wordt in een boeking twee regels, elk met het eigen tarief. Bij een prijs
            per persoon doet het aantal gasten de vermenigvuldiging. Overleg de verdeling met je
            boekhouder: de Belastingdienst wil een reële verdeling zien, geen ronde greep.
          </p>
        </div>
      )}
    </fieldset>
  );
}

/** Wat er over de btw van dit pakket in de lijst staat. */
function btwOmschrijving(p: Package): string {
  if (heeftVerdeling(p)) {
    const laag = Number(p.vatSplitLow ?? 0).toFixed(2).replace(".", ",");
    const hoog = Number(p.vatSplitHigh ?? 0).toFixed(2).replace(".", ",");
    return `gesplitst (€ ${laag} laag · € ${hoog} hoog)`;
  }
  if (!p.vatRate) return "nog niet ingesteld";
  return BTW_LABEL[p.vatRate as BtwTarief] ?? p.vatRate;
}
