import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { differenceInCalendarDays, parseISO, format } from "date-fns";
import { nl } from "date-fns/locale";
import { CalendarPlus, Mail, Phone, Info, Loader2, ExternalLink } from "lucide-react";
import { api } from "../../lib/api";
import { Sheet, SheetSectie } from "../ui/Sheet";
import { centenNaarTekst, naarCenten } from "../../lib/boeking";
import type { ContactRequest, Package, GalleryCategory } from "@shared/schema";

/**
 * De aanvraagsheet — wireframe W4.
 *
 * Vervangt de blinde omzetting: dat was een knop die zonder uitleg een klant aanmaakte, een
 * boeking maakte en de aanvraag afsloot, met een `alert()` achteraf. Nu staat er vóóraf wat er
 * gaat gebeuren — of de klant gekoppeld of nieuw aangemaakt wordt, welke regels het pakket
 * oplevert en wat het totaal wordt.
 *
 * Dat voorbeeld komt van de server (`/orders/from-contact/:id/voorbeeld`) en niet uit een
 * herberekening hier: de regel voor het ontdubbelen staat daar, en die twee keer opschrijven
 * is precies hoe ze uit elkaar gaan lopen.
 */

const STATUSSEN: ContactRequest["status"][] = ["nieuw", "gelezen", "opgevolgd", "omgezet_naar_order"];

const STATUS_LABEL: Record<string, string> = {
  nieuw: "Nieuw",
  gelezen: "Gelezen",
  opgevolgd: "Opgevolgd",
  omgezet_naar_order: "→ Boeking",
};

type Voorbeeld = {
  alOmgezet: number | null;
  bestaandeKlant: { id: number; name: string } | null;
  pakket: { id: number; name: string } | null;
  aantalRegels: number;
  totaal: string;
};

export function AanvraagSheet({
  aanvraagId,
  onClose,
  onBoekingGemaakt,
}: {
  aanvraagId: number | null;
  onClose: () => void;
  onBoekingGemaakt: (boekingId: number) => void;
}) {
  const qc = useQueryClient();
  const open = aanvraagId !== null;

  const { data: aanvragen } = useQuery({
    queryKey: ["admin", "contact-requests"],
    queryFn: () => api.get<ContactRequest[]>("/api/admin/contact-requests"),
    enabled: open,
  });
  const aanvraag = aanvragen?.find((a) => a.id === aanvraagId) ?? null;

  const { data: voorbeeld } = useQuery({
    queryKey: ["admin", "aanvraag", aanvraagId, "voorbeeld"],
    queryFn: () => api.get<Voorbeeld>(`/api/admin/orders/from-contact/${aanvraagId}/voorbeeld`),
    enabled: open,
  });

  const { data: pakketten } = useQuery({
    queryKey: ["admin", "packages"],
    queryFn: () => api.get<Package[]>("/api/admin/packages"),
    enabled: open,
  });
  const { data: gelegenheden } = useQuery({
    queryKey: ["admin", "gallery", "categories"],
    queryFn: () => api.get<GalleryCategory[]>("/api/admin/gallery/categories"),
    enabled: open,
  });

  const setStatus = useMutation({
    mutationFn: (status: string) =>
      api.patch(`/api/admin/contact-requests/${aanvraagId}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "contact-requests"] }),
  });

  const omzetten = useMutation({
    mutationFn: () =>
      api.post<{ order: { id: number } }>("/api/admin/orders/from-contact", {
        contactRequestId: aanvraagId,
      }),
    onSuccess: async (r) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["admin", "contact-requests"] }),
        qc.invalidateQueries({ queryKey: ["admin", "orders"] }),
        qc.invalidateQueries({ queryKey: ["admin", "customers"] }),
        qc.invalidateQueries({ queryKey: ["admin", "agenda"] }),
      ]);
      onBoekingGemaakt(r.order.id);
    },
  });

  const alOmgezet = voorbeeld?.alOmgezet ?? aanvraag?.convertedOrderId ?? null;

  const dagenTot =
    aanvraag?.eventDate != null
      ? differenceInCalendarDays(parseISO(aanvraag.eventDate), new Date())
      : null;

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => !o && onClose()}
      width="md"
      title={aanvraag ? `Aanvraag #${aanvraag.id}` : "Aanvraag"}
      subtitle={
        aanvraag
          ? `binnengekomen ${format(parseISO(String(aanvraag.createdAt)), "d MMMM yyyy, HH:mm", { locale: nl })}`
          : undefined
      }
      headerRight={
        aanvraag && (
          <select
            value={aanvraag.status}
            onChange={(e) => setStatus.mutate(e.target.value)}
            aria-label="Status"
            className="shrink-0 rounded-full border-0 bg-charcoal/8 px-3 py-1 text-xs font-medium text-charcoal/70 outline-none"
          >
            {STATUSSEN.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        )
      }
      footer={
        aanvraag && (
          <>
            <a
              href={`mailto:${aanvraag.email}?subject=Re: aanvraag Atelier Boterbloem`}
              className="inline-flex items-center gap-1.5 rounded-full border border-gold px-4 py-2 text-xs uppercase tracking-widest text-gold-dark transition hover:bg-gold/10"
            >
              <Mail className="h-3.5 w-3.5" /> Mailen
            </a>
            <div className="flex-1" />
            {alOmgezet ? (
              // Scenario 83: al omgezet. Geen tweede boeking, wel een weg ernaartoe.
              <button
                type="button"
                onClick={() => onBoekingGemaakt(alOmgezet)}
                className="inline-flex items-center gap-1.5 rounded-full border border-charcoal/20 px-4 py-2 text-xs uppercase tracking-widest text-charcoal/70 transition hover:bg-charcoal/5"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Open de boeking
              </button>
            ) : (
              <button
                type="button"
                onClick={() => omzetten.mutate()}
                disabled={omzetten.isPending}
                className="inline-flex items-center gap-1.5 rounded-full bg-gold px-4 py-2 text-xs uppercase tracking-widest text-cream transition hover:bg-gold-dark disabled:opacity-50"
              >
                {omzetten.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CalendarPlus className="h-3.5 w-3.5" />
                )}
                Maak er een boeking van
              </button>
            )}
          </>
        )
      }
    >
      {aanvraag && (
        <>
          <div className="mb-6">
            <p className="font-display text-lg text-charcoal">{aanvraag.name}</p>
            <p className="mt-0.5 break-words text-sm text-charcoal/75">
              <a href={`mailto:${aanvraag.email}`} className="hover:text-gold-dark">
                {aanvraag.email}
              </a>
              {aanvraag.phone && (
                <>
                  {" · "}
                  <a href={`tel:${aanvraag.phone}`} className="inline-flex items-center gap-1 hover:text-gold-dark">
                    <Phone className="h-3 w-3" />
                    {aanvraag.phone}
                  </a>
                </>
              )}
            </p>
          </div>

          <SheetSectie titel="Wat ze vraagt">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
              <Rij label="Gelegenheid">
                {gelegenheden?.find((c) => c.id === aanvraag.categoryId)?.name ??
                  aanvraag.eventType ??
                  "—"}
              </Rij>
              <Rij label="Pakket">
                {pakketten?.find((p) => p.id === aanvraag.packageId)?.name ?? "Weet ze nog niet"}
              </Rij>
              <Rij label="Datum">
                {aanvraag.eventDate ? (
                  <>
                    {format(parseISO(aanvraag.eventDate), "d MMMM yyyy", { locale: nl })}
                    {dagenTot !== null && (
                      <span className={dagenTot < 10 ? "text-burgundy" : "text-charcoal/65"}>
                        {dagenTot < 0
                          ? " (is geweest)"
                          : dagenTot === 0
                            ? " (vandaag)"
                            : ` (nog ${dagenTot} ${dagenTot === 1 ? "dag" : "dagen"})`}
                      </span>
                    )}
                  </>
                ) : (
                  "Nog geen datum"
                )}
              </Rij>
              <Rij label="Personen">{aanvraag.persons ?? "—"}</Rij>
            </dl>
          </SheetSectie>

          <SheetSectie titel="Bericht">
            <p className="whitespace-pre-wrap break-words rounded-md bg-white/60 px-3 py-2.5 text-sm leading-relaxed text-charcoal/80">
              {aanvraag.message}
            </p>
          </SheetSectie>

          {/* Wat er gebeurt als je op de knop drukt — vóóraf, niet in een alert erna. */}
          {!alOmgezet && voorbeeld && (
            <div className="rounded-md border border-gold/30 bg-gold/[0.07] px-3.5 py-3">
              <p className="mb-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-gold-dark">
                <Info className="h-3 w-3" /> Wat er gaat gebeuren
              </p>
              <ul className="space-y-1 text-sm text-charcoal/80">
                <li>
                  {voorbeeld.bestaandeKlant ? (
                    <>
                      Deze klant bestaat al (<strong>{voorbeeld.bestaandeKlant.name}</strong>) —
                      wordt gekoppeld, er komt geen tweede klantregel bij.
                    </>
                  ) : (
                    <>
                      Er wordt een nieuwe klant aangemaakt: <strong>{aanvraag.name}</strong>.
                    </>
                  )}
                </li>
                <li>
                  {voorbeeld.pakket ? (
                    <>
                      Het pakket <strong>{voorbeeld.pakket.name}</strong> komt er als{" "}
                      {voorbeeld.aantalRegels} regels in — totaal{" "}
                      <strong>{centenNaarTekst(naarCenten(voorbeeld.totaal))}</strong>.
                    </>
                  ) : (
                    "Er is geen pakket gekozen, dus de boeking start zonder regels."
                  )}
                </li>
                <li>De aanvraag wordt afgesloten en verdwijnt uit de agenda.</li>
              </ul>
            </div>
          )}

          {omzetten.isError && (
            <p className="mt-3 text-sm text-burgundy">
              {omzetten.error instanceof Error ? omzetten.error.message : "Omzetten mislukt"}
            </p>
          )}
        </>
      )}
    </Sheet>
  );
}

function Rij({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-charcoal/70">{label}</dt>
      <dd className="break-words text-charcoal">{children}</dd>
    </>
  );
}
