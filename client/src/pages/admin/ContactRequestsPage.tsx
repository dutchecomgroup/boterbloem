import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { api } from "../../lib/api";
import { formatDateShort } from "../../lib/utils";
import { AanvraagSheet } from "../../components/admin/AanvraagSheet";
import { BoekingSheet } from "../../components/admin/BoekingSheet";
import { useSheetParam } from "../../hooks/useSheetParam";
import type { ContactRequest, GalleryCategory } from "@shared/schema";

const STATUS_LABEL: Record<string, string> = {
  nieuw: "Nieuw",
  gelezen: "Gelezen",
  opgevolgd: "Opgevolgd",
  omgezet_naar_order: "→ Boeking",
};

export default function ContactRequestsPage() {
  const qc = useQueryClient();
  const aanvraag = useSheetParam("aanvraag");
  const boeking = useSheetParam("boeking");

  const { data: gelegenheden } = useQuery({
    queryKey: ["admin", "gallery", "categories"],
    queryFn: () => api.get<GalleryCategory[]>("/api/admin/gallery/categories"),
  });

  const { data: requests } = useQuery({
    queryKey: ["admin", "contact-requests"],
    queryFn: () => api.get<ContactRequest[]>("/api/admin/contact-requests"),
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.patch(`/api/admin/contact-requests/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "contact-requests"] }),
  });

  function openen(r: ContactRequest) {
    aanvraag.openen(r.id);
    // Openen telt als lezen. Anders blijft de teller op het dashboard staan terwijl ze de
    // aanvraag al gezien heeft.
    if (r.status === "nieuw") setStatus.mutate({ id: r.id, status: "gelezen" });
  }

  const nieuw = requests?.filter((r) => r.status === "nieuw").length ?? 0;

  return (
    <div>
      <h1 className="mb-2 text-3xl">Aanvragen</h1>
      <p className="mb-8 text-sm text-charcoal/60">
        Inkomende contactformulier-aanvragen. Klik er een aan om te zien wat er gevraagd wordt
        en er een boeking van te maken.
        {nieuw > 0 && <> Er {nieuw === 1 ? "is" : "zijn"} <strong>{nieuw}</strong> nieuw.</>}
      </p>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-charcoal/5 text-xs uppercase tracking-widest text-charcoal/60">
            <tr>
              <th className="px-4 py-3 text-left">Binnengekomen</th>
              <th className="px-4 py-3 text-left">Naam</th>
              <th className="px-4 py-3 text-left">Gelegenheid</th>
              <th className="px-4 py-3 text-left">Datum feest</th>
              <th className="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {requests?.length ? (
              requests.map((r) => {
                const dagen =
                  r.eventDate != null
                    ? Math.ceil(
                        (new Date(r.eventDate).getTime() - Date.now()) / 86_400_000,
                      )
                    : null;
                return (
                  <tr
                    key={r.id}
                    onClick={() => openen(r)}
                    className="cursor-pointer border-t border-charcoal/5 hover:bg-cream/40"
                  >
                    <td className="px-4 py-3 text-charcoal/60">{formatDateShort(r.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{r.name}</span>
                      <span className="block max-w-[28ch] truncate text-xs text-charcoal/50">
                        {r.message}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-charcoal/70">
                      {gelegenheden?.find((c) => c.id === r.categoryId)?.name ?? r.eventType ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {r.eventDate ? (
                        <span className="inline-flex items-center gap-1.5">
                          {formatDateShort(r.eventDate)}
                          {/* Scenario 98: een aanvraag binnen de levertijd. Opvallen, niet blokkeren. */}
                          {dagen !== null && dagen >= 0 && dagen < 10 && (
                            <AlertTriangle
                              className="h-3.5 w-3.5 text-burgundy"
                              aria-label="Binnen de levertijd"
                            />
                          )}
                        </span>
                      ) : (
                        <span className="text-charcoal/40">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] uppercase tracking-widest ${
                          r.status === "nieuw"
                            ? "bg-gold text-cream"
                            : r.status === "omgezet_naar_order"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-charcoal/10 text-charcoal/60"
                        }`}
                      >
                        {STATUS_LABEL[r.status]}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-charcoal/40">
                  Geen aanvragen
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AanvraagSheet
        aanvraagId={aanvraag.id}
        onClose={aanvraag.sluiten}
        onBoekingGemaakt={(id) => {
          // Direct doorschuiven naar de boeking: na het omzetten wil je meteen de regels en
          // de datum aanvullen, niet terug naar de lijst.
          aanvraag.sluiten();
          boeking.openen(id);
        }}
      />

      <BoekingSheet boekingId={boeking.id} onClose={boeking.sluiten} />
    </div>
  );
}
