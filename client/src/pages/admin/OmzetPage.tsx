import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  startOfQuarter, endOfQuarter, startOfYear, endOfYear, format,
} from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Download, TriangleAlert, Euro, BarChart3 } from "lucide-react";
import { api } from "../../lib/api";
import { formatCurrency } from "../../lib/utils";
import { PageKop } from "../../components/admin/ui/PageKop";
import { LegeStaat } from "../../components/admin/ui/LegeStaat";
import { Bedrag } from "../../components/admin/ui/Bedrag";

/**
 * De cijfers, op één pagina.
 *
 * **Omzet telt op de datum van het feest**, niet op de dag dat het geld binnenkwam (besloten
 * 25-08). Het werk is dan geleverd, dus de omzet is verdiend. Wat er wél binnenkwam staat er
 * los naast onder *Ontvangen* — dat zijn twee vragen en ze horen twee antwoorden te hebben.
 * Dezelfde regel geldt op het dashboard; die twee stonden eerder los van elkaar en gaven
 * daardoor andere getallen.
 */

type Reeks = { sleutel: string; label: string; bedrag: string };

type OmzetData = {
  periode: { van: string; tot: string; groep: string };
  omzet: string;
  aantalBoekingen: number;
  gemiddeld: string;
  vorige: { van: string; tot: string; omzet: string; verschil: string; procent: number | null };
  reeks: Reeks[];
  btw: Array<{ tarief: string; percentage: number; over: string; excl: string; btw: string }>;
  perPakket: Array<{ naam: string; omzet: string }>;
  kas: { ontvangen: string; reeks: Reeks[] };
  openstaand: {
    totaal: string;
    posten: Array<{
      id: number; reference: string | null; eventDate: string | null;
      klant: string | null; totalPrice: string; ontvangen: string; open: string;
    }>;
  };
};

const iso = (d: Date) => format(d, "yyyy-MM-dd");

/**
 * De vaste perioden. `groep` hoort bij de periode: een jaar in weken is 52 staafjes op een as
 * die daar geen ruimte voor heeft, en een week per maand is één staafje.
 */
function presets(nu: Date) {
  return {
    week: { label: "Deze week", van: iso(startOfWeek(nu, { weekStartsOn: 1 })), tot: iso(endOfWeek(nu, { weekStartsOn: 1 })), groep: "week" },
    maand: { label: "Deze maand", van: iso(startOfMonth(nu)), tot: iso(endOfMonth(nu)), groep: "week" },
    kwartaal: { label: "Dit kwartaal", van: iso(startOfQuarter(nu)), tot: iso(endOfQuarter(nu)), groep: "maand" },
    jaar: { label: "Dit jaar", van: iso(startOfYear(nu)), tot: iso(endOfYear(nu)), groep: "maand" },
  } as const;
}

type PresetSleutel = keyof ReturnType<typeof presets>;

function Tegel({ label, waarde, onder, toon, rand }: {
  label: string; waarde: string; onder?: React.ReactNode;
  toon?: "gewoon" | "open"; rand?: string;
}) {
  return (
    <div className={`card border-l-4 ${rand ?? "border-l-charcoal/15"}`}>
      <div className="text-xs uppercase tracking-widest text-charcoal/50">{label}</div>
      <div className={`mt-3 text-3xl font-display ${toon === "open" ? "text-burgundy" : ""}`}>{waarde}</div>
      {onder && <div className="text-xs mt-1 text-charcoal/50">{onder}</div>}
    </div>
  );
}

export default function OmzetPage() {
  const nu = useMemo(() => new Date(), []);
  const vast = useMemo(() => presets(nu), [nu]);
  const [keuze, setKeuze] = useState<PresetSleutel | "vrij">("jaar");
  const [vrij, setVrij] = useState({ van: vast.jaar.van, tot: vast.jaar.tot, groep: "maand" });

  const periode = keuze === "vrij" ? vrij : vast[keuze];

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "omzet", periode.van, periode.tot, periode.groep],
    queryFn: () => api.get<OmzetData>(
      `/api/admin/omzet?van=${periode.van}&tot=${periode.tot}&groep=${periode.groep}`,
    ),
  });

  /**
   * Puntkomma als scheidingsteken: Excel in een Nederlandse regio leest een komma niet als
   * kolomgrens, en dan staat de hele regel in kolom A. De BOM ervoor houdt é en € heel.
   */
  function exporteer() {
    if (!data) return;
    const rijen: string[][] = [
      ["Periode", `${data.periode.van} t/m ${data.periode.tot}`],
      [],
      ["Omzet", data.omzet],
      ["Aantal boekingen", String(data.aantalBoekingen)],
      ["Gemiddelde boeking", data.gemiddeld],
      ["Ontvangen in periode", data.kas.ontvangen],
      ["Openstaand (alle perioden)", data.openstaand.totaal],
      [],
      ["Btw-tarief", "Over", "Exclusief", "Btw"],
      ...data.btw.map((b) => [`${b.percentage}%`, b.over, b.excl, b.btw]),
      [],
      [data.periode.groep === "week" ? "Week" : "Maand", "Omzet"],
      ...data.reeks.map((r) => [r.label, r.bedrag]),
      [],
      ["Pakket", "Omzet"],
      ...data.perPakket.map((p) => [p.naam, p.omzet]),
      [],
      ["Openstaand", "Datum", "Klant", "Totaal", "Ontvangen", "Open"],
      ...data.openstaand.posten.map((p) => [
        p.reference ?? "", p.eventDate ?? "", p.klant ?? "", p.totalPrice, p.ontvangen, p.open,
      ]),
    ];
    const escape = (v: string) => `"${String(v).split('"').join('""')}"`;
    const csv = rijen.map((r) => r.map(escape).join(";")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `omzet-${data.periode.van}-tot-${data.periode.tot}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const grafiek = (data?.reeks ?? []).map((r) => ({ label: r.label, omzet: Number(r.bedrag) }));
  const heeftOmzet = grafiek.some((r) => r.omzet !== 0);

  return (
    <div>
      <PageKop
        titel="Omzet"
        icoon={Euro}
        onderschrift="Op basis van afgeleverde boekingen, geteld op de datum van het feest."
        actie={
          <button className="btn-outline flex items-center gap-2 text-sm" onClick={exporteer} disabled={!data}>
            <Download size={16} /> Exporteer CSV
          </button>
        }
      />

      <div className="flex flex-wrap items-center gap-2 my-6">
        {(Object.keys(vast) as PresetSleutel[]).map((k) => (
          <button
            key={k}
            onClick={() => setKeuze(k)}
            className={`pill ${keuze === k ? "pill-active" : "pill-inactive"}`}
          >
            {vast[k].label}
          </button>
        ))}
        <button
          onClick={() => setKeuze("vrij")}
          className={`pill ${keuze === "vrij" ? "pill-active" : "pill-inactive"}`}
        >
          Vrije periode
        </button>

        {keuze === "vrij" && (
          <div className="flex flex-wrap items-center gap-2 ml-1">
            <input type="date" className="input !py-1.5 !w-auto" value={vrij.van}
              onChange={(e) => setVrij({ ...vrij, van: e.target.value })} />
            <span className="text-charcoal/40 text-sm">t/m</span>
            <input type="date" className="input !py-1.5 !w-auto" value={vrij.tot}
              onChange={(e) => setVrij({ ...vrij, tot: e.target.value })} />
            <select className="input !py-1.5 !w-auto" value={vrij.groep}
              onChange={(e) => setVrij({ ...vrij, groep: e.target.value })}>
              <option value="maand">per maand</option>
              <option value="week">per week</option>
            </select>
          </div>
        )}
      </div>

      {error && (
        <div className="card border-burgundy/30 text-burgundy text-sm mb-6">
          {(error as Error).message}
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Tegel
          label="Omzet"
          rand="border-l-emerald-600"
          waarde={data ? formatCurrency(data.omzet) : "—"}
          onder={data && (
            data.vorige.procent !== null
              ? <span className={Number(data.vorige.verschil) >= 0 ? "text-emerald-600" : "text-burgundy"}>
                  {Number(data.vorige.verschil) >= 0 ? "+" : ""}{data.vorige.procent}% vs vorige periode
                </span>
              : <>vorige periode: {formatCurrency(data.vorige.omzet)}</>
          )}
        />
        <Tegel label="Boekingen" rand="border-l-gold" waarde={data ? String(data.aantalBoekingen) : "—"}
          onder={data ? <>gemiddeld {formatCurrency(data.gemiddeld)}</> : undefined} />
        <Tegel label="Ontvangen in periode" rand="border-l-emerald-600"
          waarde={data ? formatCurrency(data.kas.ontvangen) : "—"} onder="op betaaldatum" />
        <Tegel label="Openstaand"
          rand={data && Number(data.openstaand.totaal) > 0 ? "border-l-burgundy" : "border-l-charcoal/15"}
          waarde={data ? formatCurrency(data.openstaand.totaal) : "—"}
          toon={data && Number(data.openstaand.totaal) > 0 ? "open" : "gewoon"}
          onder={data ? <>{data.openstaand.posten.length} boeking(en), alle perioden</> : undefined} />
      </div>

      <div className="card mb-8">
        <h2 className="text-xl mb-6">Omzet per {periode.groep}</h2>
        <div className="h-72">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-charcoal/40 text-sm">Laden…</div>
          ) : heeftOmzet ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={grafiek} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0001" />
                <XAxis dataKey="label" stroke="#2B2926" fontSize={11} />
                <YAxis stroke="#2B2926" fontSize={12} tickFormatter={(v) => `€${v}`} />
                <Tooltip
                  formatter={(v: number) => formatCurrency(v)}
                  contentStyle={{ background: "#FBF6EE", border: "1px solid #C8A560" }}
                />
                <Bar dataKey="omzet" fill="#C8A560" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <LegeStaat
              icoon={BarChart3}
              titel="Geen omzet in deze periode"
              hint="Er staat geen enkele boeking op afgeleverd met een feestdatum binnen deze periode."
            />
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h2 className="text-xl mb-1">Btw</h2>
          <p className="text-xs text-charcoal/50 mb-4">
            Per tarief, uitgesplitst uit de regels van deze boekingen. Bedragen zijn inclusief btw.
          </p>
          {data?.btw.length ? (
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-widest text-charcoal/55">
                <tr>
                  <th className="text-left py-2">Tarief</th>
                  <th className="text-right py-2">Over</th>
                  <th className="text-right py-2">Excl.</th>
                  <th className="text-right py-2">Btw</th>
                </tr>
              </thead>
              <tbody>
                {data.btw.map((b) => (
                  <tr key={b.tarief} className="border-t border-charcoal/5">
                    <td className="py-2">{b.percentage}%</td>
                    <td className="py-2 text-right">{formatCurrency(b.over)}</td>
                    <td className="py-2 text-right text-charcoal/60">{formatCurrency(b.excl)}</td>
                    <td className="py-2 text-right"><Bedrag waarde={b.btw} vet /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-sm text-charcoal/50 flex gap-2">
              <TriangleAlert size={16} className="shrink-0 mt-0.5 text-gold" />
              <span>
                Geen btw te berekenen. De regels van deze boekingen hebben nog geen tarief — dat
                komt van het pakket of het product waaruit ze ontstaan. Zet het daar, en het
                verschijnt hier vanzelf.
              </span>
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-xl mb-1">Per pakket</h2>
          <p className="text-xs text-charcoal/50 mb-4">Waar de omzet vandaan komt.</p>
          {data?.perPakket.length ? (
            <table className="w-full text-sm">
              <tbody>
                {data.perPakket.map((p) => (
                  <tr key={p.naam} className="border-t border-charcoal/5 first:border-0">
                    <td className="py-2">{p.naam}</td>
                    <td className="py-2 text-right"><Bedrag waarde={p.omzet} rol="voldaan" vet /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-sm text-charcoal/50">Nog niets in deze periode.</div>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl mb-1">Openstaand</h2>
        <p className="text-xs text-charcoal/50 mb-4">
          Afgeleverd maar nog niet volledig betaald. Bewust over álle perioden: een rekening van
          vier maanden geleden is juist het geval dat je wilt zien.
        </p>
        {data?.openstaand.posten.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-charcoal/50 text-xs uppercase tracking-widest">
                <tr>
                  <th className="text-left py-2">Boeking</th>
                  <th className="text-left py-2">Datum</th>
                  <th className="text-left py-2">Klant</th>
                  <th className="text-right py-2">Totaal</th>
                  <th className="text-right py-2">Ontvangen</th>
                  <th className="text-right py-2">Open</th>
                </tr>
              </thead>
              <tbody>
                {data.openstaand.posten.map((p) => (
                  <tr key={p.id} className="rij-hover">
                    <td className="py-2">
                      <Link href={`/admin/boekingen?boeking=${p.id}`} className="text-gold-dark hover:underline">
                        {p.reference ?? `#${p.id}`}
                      </Link>
                    </td>
                    <td className="py-2 text-charcoal/60">{p.eventDate ?? "—"}</td>
                    <td className="py-2">{p.klant ?? "—"}</td>
                    <td className="py-2 text-right text-charcoal/60">{formatCurrency(p.totalPrice)}</td>
                    <td className="py-2 text-right text-charcoal/60">{formatCurrency(p.ontvangen)}</td>
                    <td className="py-2 text-right"><Bedrag waarde={p.open} rol="negatief" vet /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-sm text-charcoal/50">Alles is betaald.</div>
        )}
      </div>
    </div>
  );
}
