import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "../../lib/api";
import type { ContactRequest } from "@shared/schema";
import { formatDateShort } from "../../lib/utils";
import { CalendarPlus, Mail, Phone } from "lucide-react";

const STATUSES: ContactRequest["status"][] = ["nieuw", "gelezen", "opgevolgd", "omgezet_naar_order"];

const STATUS_LABEL: Record<ContactRequest["status"], string> = {
  nieuw: "Nieuw",
  gelezen: "Gelezen",
  opgevolgd: "Opgevolgd",
  omgezet_naar_order: "→ Boeking",
};

export default function ContactRequestsPage() {
  const qc = useQueryClient();
  const [active, setActive] = useState<ContactRequest | null>(null);

  const { data: requests } = useQuery({
    queryKey: ["admin", "contact-requests"],
    queryFn: () => api.get<ContactRequest[]>("/api/admin/contact-requests"),
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ContactRequest["status"] }) =>
      api.patch(`/api/admin/contact-requests/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "contact-requests"] }),
  });

  const convert = useMutation({
    mutationFn: (id: number) => api.post("/api/admin/orders/from-contact", { contactRequestId: id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "contact-requests"] });
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
      qc.invalidateQueries({ queryKey: ["admin", "customers"] });
      setActive(null);
      alert("Aanvraag omgezet naar boeking.");
    },
  });

  return (
    <div>
      <h1 className="text-3xl mb-2">Aanvragen</h1>
      <p className="text-charcoal/60 text-sm mb-8">Inkomende contactformulier-aanvragen.</p>

      <div className="grid lg:grid-cols-[1fr_2fr] gap-6">
        <div className="card p-0 overflow-hidden divide-y divide-charcoal/5 max-h-[70vh] overflow-y-auto">
          {requests?.length ? requests.map((r) => (
            <button
              key={r.id}
              onClick={() => { setActive(r); if (r.status === "nieuw") setStatus.mutate({ id: r.id, status: "gelezen" }); }}
              className={`block w-full text-left px-4 py-3 hover:bg-cream/60 ${active?.id === r.id ? "bg-gold/10" : ""}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium truncate">{r.name}</span>
                <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded ${r.status === "nieuw" ? "bg-gold text-cream" : "bg-charcoal/10 text-charcoal/60"}`}>
                  {STATUS_LABEL[r.status]}
                </span>
              </div>
              <div className="text-xs text-charcoal/50 mt-0.5">{formatDateShort(r.createdAt)} · {r.eventType ?? "—"}</div>
              <div className="text-xs text-charcoal/60 mt-1 line-clamp-2">{r.message}</div>
            </button>
          )) : (
            <div className="p-8 text-center text-charcoal/40 text-sm">Geen aanvragen</div>
          )}
        </div>

        <div className="card">
          {active ? (
            <>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl">{active.name}</h2>
                  <div className="text-sm text-charcoal/60 mt-1">{formatDateShort(active.createdAt)}</div>
                </div>
                <select
                  value={active.status}
                  onChange={(e) => setStatus.mutate({ id: active.id, status: e.target.value as ContactRequest["status"] })}
                  className="input !w-auto !py-1.5"
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 text-sm mb-6">
                <div className="flex items-center gap-2"><Mail size={14} className="text-gold" /><a href={`mailto:${active.email}`} className="hover:text-gold">{active.email}</a></div>
                {active.phone && <div className="flex items-center gap-2"><Phone size={14} className="text-gold" /><a href={`tel:${active.phone}`} className="hover:text-gold">{active.phone}</a></div>}
                {active.eventDate && <div><span className="text-charcoal/50">Datum:</span> {formatDateShort(active.eventDate)}</div>}
                {active.eventType && <div><span className="text-charcoal/50">Type:</span> {active.eventType}</div>}
                {active.persons && <div><span className="text-charcoal/50">Personen:</span> {active.persons}</div>}
              </div>

              <div className="border-t border-charcoal/10 pt-6">
                <div className="text-xs uppercase tracking-widest text-charcoal/50 mb-2">Bericht</div>
                <p className="whitespace-pre-wrap text-charcoal/80 leading-relaxed">{active.message}</p>
              </div>

              <div className="mt-6 flex gap-3">
                <a href={`mailto:${active.email}?subject=Re: aanvraag Atelier Boterbloem`} className="btn-outline">Reageren via e-mail</a>
                {active.status !== "omgezet_naar_order" && (
                  <button onClick={() => convert.mutate(active.id)} className="btn-gold">
                    <CalendarPlus size={16} /> Maak boeking
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="text-charcoal/40 text-center py-20">Selecteer een aanvraag links.</div>
          )}
        </div>
      </div>
    </div>
  );
}
