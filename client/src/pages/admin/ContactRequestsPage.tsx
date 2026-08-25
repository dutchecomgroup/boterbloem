import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Inbox } from "lucide-react";
import { api } from "../../lib/api";
import { formatDateShort } from "../../lib/utils";
import { AanvraagSheet } from "../../components/admin/AanvraagSheet";
import { BoekingSheet } from "../../components/admin/BoekingSheet";
import { useSheetParam } from "../../hooks/useSheetParam";
import type { ContactRequest, GalleryCategory } from "@shared/schema";
import { AANVRAAG_LABEL, AANVRAAG_KLEUR } from "../../lib/aanvraag";
import { PageKop } from "../../components/admin/ui/PageKop";
import { LegeStaat } from "../../components/admin/ui/LegeStaat";
import { Badge } from "../../components/admin/ui/Badge";

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
      <PageKop
        titel="Aanvragen"
        icoon={Inbox}
        onderschrift="Inkomende contactformulier-aanvragen. Klik er een aan om te zien wat er gevraagd wordt en er een boeking van te maken."
        actie={
          // Alleen tonen als er iets ligt: een teller op nul is geen informatie.
          nieuw > 0 ? (
            <Badge toon="butter">
              {nieuw} nieuw{nieuw === 1 ? "" : "e"}
            </Badge>
          ) : undefined
        }
      />

      <div className="card overflow-hidden p-0">
        <table className="tabel-admin w-full text-sm">
          <thead>
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
                    className="rij-hover cursor-pointer"
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
                        <span className="text-charcoal/30">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge klassen={AANVRAAG_KLEUR[r.status]}>{AANVRAAG_LABEL[r.status]}</Badge>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="p-4">
                  <LegeStaat
                    icoon={Inbox}
                    titel="Geen aanvragen"
                    hint="Zodra iemand het contactformulier op de site invult, komt de aanvraag hier binnen."
                  />
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
