import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AlertTriangle, Plus } from "lucide-react";
import { api } from "../../lib/api";
import { formatCurrency, formatDateShort } from "../../lib/utils";
import { STATUSSEN, STATUS_LABEL, STATUS_KLEUR, bedragen } from "../../lib/boeking";
import { BoekingSheet } from "../../components/admin/BoekingSheet";
import { NieuweBoekingDialoog } from "../../components/admin/NieuweBoekingDialoog";
import { useSheetParam } from "../../hooks/useSheetParam";
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
      <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="mb-2 text-3xl">Boekingen</h1>
          <p className="text-sm text-charcoal/60">
            Klik op een rij om het feest te openen.
          </p>
        </div>
        <button type="button" onClick={() => setNieuwOpen(true)} className="btn-gold">
          <Plus className="h-4 w-4" /> Nieuwe boeking
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {["alles", ...STATUSSEN].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1.5 text-xs uppercase tracking-widest transition ${
              filter === s
                ? "bg-gold text-cream"
                : "border border-charcoal/10 bg-white text-charcoal/60 hover:text-charcoal"
            }`}
          >
            {s === "alles" ? "alles" : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-charcoal/5 text-xs uppercase tracking-widest text-charcoal/60">
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
                const b = bedragen(o.totalPrice, o.depositAmount, o.depositPaid);
                return (
                  <tr
                    key={o.id}
                    onClick={() => sheet.openen(o.id)}
                    className="cursor-pointer border-t border-charcoal/5 hover:bg-cream/40"
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
                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                      {formatCurrency(o.totalPrice)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right tabular-nums ${
                        b.teVeelBetaald
                          ? "text-burgundy"
                          : b.voldaan
                            ? "text-emerald-700"
                            : "text-gold-dark"
                      }`}
                    >
                      {b.voldaan ? "voldaan" : b.openstaand}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-charcoal/40">
                  Geen boekingen
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
