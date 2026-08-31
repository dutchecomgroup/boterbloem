import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AlertTriangle, Plus, CalendarCheck, CalendarX } from "lucide-react";
import { api } from "../../lib/api";
import { formatDateShort } from "../../lib/utils";
import { STATUSSEN, STATUS_LABEL, STATUS_KLEUR, bedragen } from "../../lib/boeking";
import { BoekingSheet } from "../../components/admin/BoekingSheet";
import { NieuweBoekingDialoog } from "../../components/admin/NieuweBoekingDialoog";
import { useSheetParam } from "../../hooks/useSheetParam";
import { PageKop } from "../../components/admin/ui/PageKop";
import { LegeStaat } from "../../components/admin/ui/LegeStaat";
import { Bedrag, rolVanOpenstaand } from "../../components/admin/ui/Bedrag";
import type { Customer } from "@shared/schema";

interface OrderRow {
  id: number;
  reference: string | null;
  eventDate: string | null;
  eventTime: string | null;
  status: string;
  totalPrice: string;
  depositAmount: string;
  depositPaid: boolean;
  /** Som van de betaalregels, als tekst uit de subquery in de lijstroute. */
  ontvangen: string;
  deliveryType: string;
  persons: number | null;
  location: string | null;
  heeftAllergie: boolean;
  customer: Customer | null;
  createdAt: string;
}

export default function OrdersPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("alles");
  const [nieuwOpen, setNieuwOpen] = useState(false);
  const sheet = useSheetParam("boeking");

  const { data: orders } = useQuery({
    queryKey: ["admin", "orders", filter],
    queryFn: () =>
      api.get<OrderRow[]>(`/api/admin/orders${filter === "alles" ? "" : `?status=${filter}`}`),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.patch(`/api/admin/orders/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "orders"] }),
  });

  return (
    <div>
      <PageKop
        titel="Boekingen"
        icoon={CalendarCheck}
        onderschrift="Klik op een rij om het feest te openen."
        actie={
          <button type="button" onClick={() => setNieuwOpen(true)} className="btn-sage">
            <Plus className="h-4 w-4" /> Nieuwe boeking
          </button>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {["alles", ...STATUSSEN].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`pill ${filter === s ? "pill-active" : "pill-inactive"}`}
          >
            {s === "alles" ? "alles" : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden p-0">
        <table className="tabel-admin w-full text-sm">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left">Nummer</th>
              <th className="px-4 py-3 text-left">Datum</th>
              <th className="px-4 py-3 text-left">Klant</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Totaal</th>
              <th className="px-4 py-3 text-right">Openstaand</th>
            </tr>
          </thead>
          <tbody>
            {orders?.length ? (
              orders.map((o) => {
                const b = bedragen(o.totalPrice, o.ontvangen, o.depositAmount);
                return (
                  <tr
                    key={o.id}
                    onClick={() => sheet.openen(o.id)}
                    className="rij-hover cursor-pointer"
                  >
                    <td className="px-4 py-3 font-medium tabular-nums text-charcoal/70">
                      <span className="inline-flex items-center gap-1.5">
                        {o.reference ?? "—"}
                        {/* De lijst toont niet wélke allergie, wel dát er op gelet moet worden. */}
                        {o.heeftAllergie && (
                          <AlertTriangle
                            className="h-3.5 w-3.5 text-burgundy"
                            aria-label="Heeft allergieën"
                          />
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {formatDateShort(o.eventDate)}
                      {o.eventTime && (
                        <span className="text-charcoal/45"> · {o.eventTime.slice(0, 5)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {o.customer?.name ?? <span className="text-charcoal/40">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {/* De statuskeuze mag de rij niet openen — anders kun je hem niet bedienen. */}
                      <select
                        value={o.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => updateStatus.mutate({ id: o.id, status: e.target.value })}
                        className={`rounded px-2 py-1 text-xs font-medium ${STATUS_KLEUR[o.status] ?? ""}`}
                      >
                        {STATUSSEN.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABEL[s]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Bedrag waarde={o.totalPrice} vet />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {b.voldaan ? (
                        <span className="text-xs font-medium uppercase tracking-widest text-emerald-700">
                          voldaan
                        </span>
                      ) : (
                        <Bedrag waarde={b.openCenten / 100} rol={rolVanOpenstaand(b.openCenten / 100)} />
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="p-4">
                  <LegeStaat
                    icoon={CalendarX}
                    titel={filter === "alles" ? "Nog geen boekingen" : "Niets met deze status"}
                    hint={filter === "alles"
                      ? "Zet een aanvraag om naar een boeking, of maak er hier zelf een aan."
                      : "Kies een andere status, of 'alles' om alles te zien."}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <BoekingSheet boekingId={sheet.id} onClose={sheet.sluiten} />
      <NieuweBoekingDialoog
        open={nieuwOpen}
        onClose={() => setNieuwOpen(false)}
        onAangemaakt={(id) => {
          setNieuwOpen(false);
          sheet.openen(id);
        }}
      />
    </div>
  );
}
