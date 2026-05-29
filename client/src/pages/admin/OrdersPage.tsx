import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "../../lib/api";
import { formatCurrency, formatDateShort } from "../../lib/utils";
import type { Order, Customer } from "@shared/schema";

interface OrderRow {
  id: number;
  eventDate: string | null;
  status: Order["status"];
  totalPrice: string;
  deliveryType: Order["deliveryType"];
  customer: Customer | null;
  createdAt: string;
}

const STATUSES: Order["status"][] = [
  "aanvraag",
  "bevestigd",
  "in_productie",
  "klaar",
  "afgeleverd",
  "geannuleerd",
];

const STATUS_COLORS: Record<Order["status"], string> = {
  aanvraag: "bg-blush/40 text-burgundy",
  bevestigd: "bg-butter/60 text-gold-dark",
  in_productie: "bg-gold/20 text-gold-dark",
  klaar: "bg-emerald-100 text-emerald-700",
  afgeleverd: "bg-charcoal/10 text-charcoal/70",
  geannuleerd: "bg-burgundy/10 text-burgundy",
};

export default function OrdersPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Order["status"] | "alles">("alles");
  const { data: orders } = useQuery({
    queryKey: ["admin", "orders", filter],
    queryFn: () => api.get<OrderRow[]>(`/api/admin/orders${filter === "alles" ? "" : `?status=${filter}`}`),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: Order["status"] }) =>
      api.patch(`/api/admin/orders/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "orders"] }),
  });

  return (
    <div>
      <h1 className="text-3xl mb-2">Boekingen</h1>
      <p className="text-charcoal/60 text-sm mb-8">Beheer al je orders en hun status.</p>

      <div className="flex flex-wrap gap-2 mb-6">
        {["alles", ...STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s as typeof filter)}
            className={`px-3 py-1.5 rounded-full text-xs uppercase tracking-widest transition ${
              filter === s ? "bg-gold text-cream" : "bg-white border border-charcoal/10 text-charcoal/60 hover:text-charcoal"
            }`}
          >
            {s.replaceAll("_", " ")}
          </button>
        ))}
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-charcoal/5 text-charcoal/60 text-xs uppercase tracking-widest">
            <tr>
              <th className="text-left px-4 py-3">Datum</th>
              <th className="text-left px-4 py-3">Klant</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Totaal</th>
            </tr>
          </thead>
          <tbody>
            {orders?.length ? (
              orders.map((o) => (
                <tr key={o.id} className="border-t border-charcoal/5 hover:bg-cream/40">
                  <td className="px-4 py-3">{formatDateShort(o.eventDate)}</td>
                  <td className="px-4 py-3">{o.customer?.name ?? <span className="text-charcoal/40">—</span>}</td>
                  <td className="px-4 py-3">
                    <select
                      value={o.status}
                      onChange={(e) => updateStatus.mutate({ id: o.id, status: e.target.value as Order["status"] })}
                      className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[o.status]}`}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s.replaceAll("_", " ")}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(o.totalPrice)}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={4} className="px-4 py-12 text-center text-charcoal/40">Geen boekingen</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
