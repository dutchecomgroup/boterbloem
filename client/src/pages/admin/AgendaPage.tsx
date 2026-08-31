import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  format, addMonths, isSameMonth, isToday, parseISO,
} from "date-fns";
import { nl } from "date-fns/locale";
import {
  ChevronLeft, ChevronRight, MapPin, Clock, Plus, ExternalLink,
  FileText, Trash2, AlertTriangle, CalendarDays,
} from "lucide-react";
import { api } from "../../lib/api";
import { formatCurrency } from "../../lib/utils";
import { STATUSSEN, STATUS_LABEL, STATUS_KLEUR } from "../../lib/boeking";
import { PageKop } from "../../components/admin/ui/PageKop";
import { LegeStaat } from "../../components/admin/ui/LegeStaat";
import { BoekingSheet } from "../../components/admin/BoekingSheet";
import { AanvraagSheet } from "../../components/admin/AanvraagSheet";
import { NieuweBoekingDialoog } from "../../components/admin/NieuweBoekingDialoog";
import { ContextMenu, type MenuPositie } from "../../components/ui/ContextMenu";
import { useSheetParam } from "../../hooks/useSheetParam";

/**
 * De agenda als werkkalender.
 *
 * Was alleen-lezen: elke boeking linkte naar `/admin/boekingen` — de lijst, niet de boeking.
 * Nu opent een klik het feest zelf in een sheet, plant een rechtermuisklik op een lege dag een
 * boeking in, en verplaatst slepen een boeking naar een andere dag.
 */

interface Boeking {
  id: number; soort: "boeking";
  reference: string | null;
  eventDate: string; eventTime: string | null; location: string | null;
  status: string; deliveryType: string; totalPrice: string; notes: string | null;
  customerName: string | null; customerPhone: string | null;
  heeftAllergie?: boolean;
}
interface Aanvraag {
  id: number; soort: "aanvraag";
  eventDate: string; name: string; eventType: string | null;
  persons: number | null; status: string;
}
type Item = Boeking | Aanvraag;

export default function AgendaPage() {
  const qc = useQueryClient();
  const [maand, setMaand] = useState(() => startOfMonth(new Date()));
  const [menu, setMenu] = useState<MenuPositie>(null);
  const [nieuwOpDatum, setNieuwOpDatum] = useState<string | null>(null);
  const [sleept, setSleept] = useState<number | null>(null);
  const [overDag, setOverDag] = useState<string | null>(null);
  const sheet = useSheetParam("boeking");
  const aanvraagSheet = useSheetParam("aanvraag");

  const van = format(startOfWeek(startOfMonth(maand), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const tot = format(endOfWeek(endOfMonth(maand), { weekStartsOn: 1 }), "yyyy-MM-dd");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "agenda", van, tot],
    queryFn: () => api.get<{ boekingen: Boeking[]; aanvragen: Aanvraag[] }>(
      `/api/admin/agenda?from=${van}&to=${tot}`,
    ),
  });

  const dagen = eachDayOfInterval({ start: parseISO(van), end: parseISO(tot) });
  const alles: Item[] = [...(data?.boekingen ?? []), ...(data?.aanvragen ?? [])];
  const perDag = (d: Date) => alles.filter((i) => i.eventDate === format(d, "yyyy-MM-dd"));

  async function verversen() {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["admin", "agenda"] }),
      qc.invalidateQueries({ queryKey: ["admin", "orders"] }),
    ]);
  }

  const boekingBijwerken = useMutation({
    mutationFn: ({ id, velden }: { id: number; velden: object }) =>
      api.patch(`/api/admin/orders/${id}`, velden),
    onSuccess: verversen,
  });

  const boekingVerwijderen = useMutation({
    mutationFn: (id: number) => api.delete(`/api/admin/orders/${id}`),
    onSuccess: verversen,
  });

  /** Scenario 67: slepen naar een andere dag. Vragen als de nieuwe datum al geweest is. */
  function verplaatsNaar(datum: string) {
    const id = sleept;
    setSleept(null);
    setOverDag(null);
    if (id === null) return;

    const vandaag = format(new Date(), "yyyy-MM-dd");
    if (datum < vandaag && !confirm(`${nlDatum(datum)} ligt in het verleden. Toch verplaatsen?`)) {
      return;
    }
    void boekingBijwerken.mutateAsync({ id, velden: { eventDate: datum } });
  }

  /* ---- Contextmenu's -------------------------------------------------- */

  function menuVoorDag(e: React.MouseEvent, d: Date) {
    e.preventDefault();
    const datum = format(d, "yyyy-MM-dd");
    setMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        { soort: "kop", label: nlDatum(datum) },
        { soort: "scheiding" },
        {
          soort: "actie",
          label: "Nieuwe boeking op deze dag",
          icoon: <Plus className="h-3.5 w-3.5" />,
          onClick: () => setNieuwOpDatum(datum),
        },
      ],
    });
  }

  function menuVoorBoeking(e: React.MouseEvent, b: Boeking) {
    e.preventDefault();
    e.stopPropagation();
    setMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        { soort: "kop", label: `${b.reference ?? `Boeking ${b.id}`} · ${b.customerName ?? "geen klant"}` },
        { soort: "scheiding" },
        {
          soort: "actie",
          label: "Openen",
          icoon: <ExternalLink className="h-3.5 w-3.5" />,
          onClick: () => sheet.openen(b.id),
        },
        ...STATUSSEN.filter((s) => s !== b.status).map((s) => ({
          soort: "actie" as const,
          label: `Status → ${STATUS_LABEL[s].toLowerCase()}`,
          icoon: <span className={`inline-block h-2.5 w-2.5 rounded ${STATUS_KLEUR[s]}`} />,
          onClick: () => void boekingBijwerken.mutateAsync({ id: b.id, velden: { status: s } }),
        })),
        { soort: "scheiding" },
        {
          soort: "actie",
          label: "Offerte openen",
          icoon: <FileText className="h-3.5 w-3.5" />,
          onClick: () => window.open(`/api/admin/orders/${b.id}/offerte`, "_blank"),
        },
        {
          soort: "actie",
          label: "Verwijderen",
          icoon: <Trash2 className="h-3.5 w-3.5" />,
          gevaarlijk: true,
          onClick: () => {
            if (confirm(`${b.reference ?? `Boeking ${b.id}`} verwijderen? De regels gaan mee.`)) {
              void boekingVerwijderen.mutateAsync(b.id);
            }
          },
        },
      ],
    });
  }

  /* ---- Weergave -------------------------------------------------------- */

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <PageKop
          titel="Agenda"
          icoon={CalendarDays}
          onderschrift="Klik op een dag om een boeking in te plannen, op een boeking om hem te openen. Rechtermuisklik geeft meer. Slepen verplaatst naar een andere dag."
        />
        <div className="flex items-center gap-2">
          <button onClick={() => setMaand(addMonths(maand, -1))}
            className="rounded-md p-2 hover:bg-charcoal/5" aria-label="Vorige maand">
            <ChevronLeft size={18} />
          </button>
          <div className="min-w-[180px] text-center font-display text-xl capitalize">
            {format(maand, "LLLL yyyy", { locale: nl })}
          </div>
          <button onClick={() => setMaand(addMonths(maand, 1))}
            className="rounded-md p-2 hover:bg-charcoal/5" aria-label="Volgende maand">
            <ChevronRight size={18} />
          </button>
          <button onClick={() => setMaand(startOfMonth(new Date()))}
            className="btn-ghost ml-2 text-xs !px-3 !py-2">Vandaag</button>
        </div>
      </div>

      {isLoading && <div className="card py-10 text-center text-charcoal/40">Laden…</div>}

      {/* Maandraster — vanaf md. Een raster van 35 vakjes is op een telefoon onleesbaar. */}
      <div className="card hidden overflow-hidden p-0 md:block">
        <div className="grid grid-cols-7 border-b border-sage/40 bg-sand">
          {["ma", "di", "wo", "do", "vr", "za", "zo"].map((d) => (
            <div key={d} className="px-2 py-2 text-center text-[10px] font-medium uppercase tracking-widest text-charcoal/80">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {dagen.map((d) => {
            const datum = format(d, "yyyy-MM-dd");
            const items = perDag(d);
            const buitenMaand = !isSameMonth(d, maand);
            // Zaterdag en zondag krijgen een lichte wassing: daar valt het meeste werk, en
            // zo tel je de kolommen niet af om te zien welke dag je voor je hebt.
            const weekend = d.getDay() === 0 || d.getDay() === 6;
            return (
              <div
                key={datum}
                onClick={() => setNieuwOpDatum(datum)}
                onContextMenu={(e) => menuVoorDag(e, d)}
                onDragOver={(e) => {
                  if (sleept === null) return;
                  e.preventDefault();
                  setOverDag(datum);
                }}
                onDragLeave={() => setOverDag((v) => (v === datum ? null : v))}
                onDrop={(e) => {
                  e.preventDefault();
                  verplaatsNaar(datum);
                }}
                className={`min-h-[104px] cursor-pointer border-b border-r border-charcoal/5 p-1.5 transition
                  ${buitenMaand ? "bg-charcoal/[0.02]" : weekend ? "bg-linen/50" : ""}
                  ${isToday(d) ? "ring-1 ring-inset ring-sage/40" : ""}
                  ${overDag === datum ? "bg-sage/15 ring-1 ring-inset ring-sage" : "hover:bg-sand"}`}
              >
                <div className={`mb-1 text-xs ${
                  isToday(d)
                    ? "inline-flex h-5 w-5 items-center justify-center rounded-full bg-sage text-linen"
                    : buitenMaand ? "text-charcoal/25" : "text-charcoal/50"
                }`}>
                  {format(d, "d")}
                </div>
                {/* Scenario 89: vijf boekingen op één zaterdag in december. Het vakje scrollt
                    in plaats van de rijhoogte op te rekken en het hele raster te verstoren. */}
                <div className="max-h-[136px] space-y-1 overflow-y-auto">
                  {items.map((i) => (
                    <Chip
                      key={`${i.soort}-${i.id}`}
                      item={i}
                      openen={() =>
                        i.soort === "boeking" ? sheet.openen(i.id) : aanvraagSheet.openen(i.id)
                      }
                      contextmenu={(e) => i.soort === "boeking" && menuVoorBoeking(e, i)}
                      sleepStart={() => i.soort === "boeking" && setSleept(i.id)}
                      sleepEind={() => setSleept(null)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobiel: lijst per dag. Scenario 94 — inplannen gaat daar via de knop, niet via
          rechtermuisklik, want die bestaat op een telefoon niet. */}
      <div className="space-y-3 md:hidden">
        <button
          type="button"
          onClick={() => setNieuwOpDatum(format(new Date(), "yyyy-MM-dd"))}
          className="btn-sage w-full"
        >
          <Plus className="h-4 w-4" /> Nieuwe boeking
        </button>
        {dagen.filter((d) => isSameMonth(d, maand) && perDag(d).length > 0).map((d) => (
          <div key={d.toISOString()} className="card">
            <div className="mb-2 text-xs uppercase tracking-widest text-charcoal/50">
              {format(d, "EEEE d MMMM", { locale: nl })}
            </div>
            <div className="space-y-1.5">
              {perDag(d).map((i) => (
                <Chip
                  key={`${i.soort}-${i.id}`}
                  item={i}
                  groot
                  openen={() =>
                    i.soort === "boeking" ? sheet.openen(i.id) : aanvraagSheet.openen(i.id)
                  }
                />
              ))}
            </div>
          </div>
        ))}
        {!isLoading && dagen.filter((d) => isSameMonth(d, maand) && perDag(d).length > 0).length === 0 && (
          <LegeStaat icoon={CalendarDays} titel="Niets deze maand" hint="Tik op de knop hierboven om een boeking in te plannen." compact />
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-4 text-xs text-charcoal/50">
        {Object.entries(STATUS_LABEL).map(([k, v]) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span className={`inline-block h-3 w-3 rounded ${STATUS_KLEUR[k]}`} />{v}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded border border-dashed border-charcoal/40" />
          Aanvraag zonder boeking
        </span>
      </div>

      <ContextMenu menu={menu} sluiten={() => setMenu(null)} />

      <BoekingSheet boekingId={sheet.id} onClose={sheet.sluiten} />

      <AanvraagSheet
        aanvraagId={aanvraagSheet.id}
        onClose={aanvraagSheet.sluiten}
        onBoekingGemaakt={(id) => {
          aanvraagSheet.sluiten();
          sheet.openen(id);
        }}
      />

      <NieuweBoekingDialoog
        open={nieuwOpDatum !== null}
        datum={nieuwOpDatum ?? undefined}
        onClose={() => setNieuwOpDatum(null)}
        onAangemaakt={(id) => {
          setNieuwOpDatum(null);
          sheet.openen(id);
        }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Chip({
  item,
  groot,
  openen,
  contextmenu,
  sleepStart,
  sleepEind,
}: {
  item: Item;
  groot?: boolean;
  openen?: () => void;
  contextmenu?: (e: React.MouseEvent) => void;
  sleepStart?: () => void;
  sleepEind?: () => void;
}) {
  // Een aanvraag is nog geen afspraak — stippellijn, en klikken brengt je naar de aanvragen.
  if (item.soort === "aanvraag") {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          openen?.();
        }}
        className={`block w-full rounded border border-dashed border-charcoal/30 bg-white/60 px-1.5 py-1 text-left text-charcoal/70 hover:border-sage ${
          groot ? "text-sm" : "text-[11px]"
        }`}
      >
        <span className="block truncate">{item.name}</span>
        <span className="text-charcoal/40">{item.eventType ?? "aanvraag"}</span>
      </button>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      draggable={Boolean(sleepStart)}
      onDragStart={sleepStart}
      onDragEnd={sleepEind}
      // Het dagvakje eronder opent de aanmaakdialoog; een klik op een boeking mag daar niet
      // óók bij uitkomen.
      onClick={(e) => {
        e.stopPropagation();
        openen?.();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openen?.();
        }
      }}
      onContextMenu={contextmenu}
      title={[item.customerName, item.location, item.notes].filter(Boolean).join(" · ")}
      className={`block cursor-pointer rounded px-1.5 py-1 hover:ring-1 hover:ring-sage ${
        STATUS_KLEUR[item.status] ?? ""
      } ${groot ? "text-sm" : "text-[11px]"}`}
    >
      <span className="flex items-center gap-1 truncate font-medium">
        {item.heeftAllergie && <AlertTriangle className="h-2.5 w-2.5 shrink-0" />}
        <span className="truncate">{item.customerName ?? `Boeking ${item.id}`}</span>
      </span>
      <span className="flex flex-wrap items-center gap-x-2 opacity-70">
        {item.eventTime && (
          <span className="inline-flex items-center gap-0.5"><Clock size={10} />{item.eventTime.slice(0, 5)}</span>
        )}
        {item.location && (
          <span className="inline-flex items-center gap-0.5 truncate"><MapPin size={10} />{item.location}</span>
        )}
        {Number(item.totalPrice) > 0 && <span>{formatCurrency(Number(item.totalPrice))}</span>}
      </span>
    </div>
  );
}

function nlDatum(datum: string): string {
  return format(parseISO(datum), "EEEE d MMMM yyyy", { locale: nl });
}
