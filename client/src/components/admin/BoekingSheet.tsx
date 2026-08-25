import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import { ExternalLink, Trash2, FileText, Loader2 } from "lucide-react";
import { api } from "../../lib/api";
import { Sheet, SheetSectie } from "../ui/Sheet";
import { VeldInline } from "../ui/VeldInline";
import { BedragenStrip } from "./boeking/BedragenStrip";
import { AllergieBlok } from "./boeking/AllergieBlok";
import { RegelTabel, type Regel } from "./boeking/RegelTabel";
import { PakketToevoegen, type PakketOptie } from "./boeking/PakketToevoegen";
import { Tijdlijn, type Gebeurtenis } from "./boeking/Tijdlijn";
import { KlantKoppelen } from "./boeking/KlantKoppelen";
import { BetalingenBlok, type Betaling } from "./boeking/BetalingenBlok";
import { STATUSSEN, STATUS_LABEL, STATUS_KLEUR, LEVERING_LABEL, bedragen } from "../../lib/boeking";

/**
 * De detailsheet van één boeking — wireframe W2.
 *
 * **De sheet houdt alleen het id vast** en leest het record uit de query-cache. Dat is bewust:
 * de vergelijkbare sheet in rubyescaperoom bewaart een *kopie* van de boeking en heeft twee
 * `useEffect`-blokken nodig om die synchroon te houden met verse kalenderdata. Door alleen het
 * id vast te houden bestaat dat probleem niet — na elke mutatie is het scherm vanzelf actueel.
 */

type Klant = { id: number; name: string; email: string | null; phone: string | null };
type Pakket = { id: number; name: string };

type Boeking = {
  id: number;
  reference: string | null;
  status: string;
  eventDate: string | null;
  eventTime: string | null;
  setupTime: string | null;
  location: string | null;
  deliveryType: string;
  persons: number | null;
  theme: string | null;
  allergies: string | null;
  notes: string | null;
  totalPrice: string;
  depositAmount: string;
  depositPaid: boolean;
  /** De som van `betalingen`, door de server berekend zodat scherm en offerte niet uiteenlopen. */
  ontvangen: string;
  betalingen: Betaling[];
  vatRate: string | null;
  packageId: number | null;
  customer: Klant | null;
  pakket: Pakket | null;
  items: Regel[];
};

export function BoekingSheet({
  boekingId,
  onClose,
}: {
  boekingId: number | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const open = boekingId !== null;

  const { data: boeking, isLoading, isError, error } = useQuery({
    queryKey: ["admin", "boeking", boekingId],
    queryFn: () => api.get<Boeking>(`/api/admin/orders/${boekingId}`),
    enabled: open,
  });

  const { data: gebeurtenissen } = useQuery({
    queryKey: ["admin", "boeking", boekingId, "events"],
    queryFn: () => api.get<Gebeurtenis[]>(`/api/admin/orders/${boekingId}/events`),
    enabled: open,
  });

  const { data: pakketten } = useQuery({
    queryKey: ["admin", "packages"],
    queryFn: () => api.get<PakketOptie[]>("/api/admin/packages"),
    enabled: open,
  });

  /**
   * Elke wijziging ververst de boeking, de tijdlijn én de lijsten eromheen. Dat laatste is
   * geen luxe: verzet je een datum vanuit de agenda, dan moet die agenda meebewegen — anders
   * staat de boeking daar nog op de oude dag tot je ververst.
   */
  async function verversen() {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["admin", "boeking", boekingId] }),
      qc.invalidateQueries({ queryKey: ["admin", "agenda"] }),
      qc.invalidateQueries({ queryKey: ["admin", "orders"] }),
    ]);
  }

  const patchBoeking = useMutation({
    mutationFn: (velden: Record<string, unknown>) =>
      api.patch(`/api/admin/orders/${boekingId}`, velden),
    onSuccess: verversen,
  });

  const regelToevoegen = useMutation({
    mutationFn: (r: object) => api.post(`/api/admin/orders/${boekingId}/items`, r),
    onSuccess: verversen,
  });
  const regelWijzigen = useMutation({
    mutationFn: ({ id, velden }: { id: number; velden: object }) =>
      api.patch(`/api/admin/orders/${boekingId}/items/${id}`, velden),
    onSuccess: verversen,
  });
  const regelVerwijderen = useMutation({
    mutationFn: (id: number) => api.delete(`/api/admin/orders/${boekingId}/items/${id}`),
    onSuccess: verversen,
  });
  const regelsHerordenen = useMutation({
    mutationFn: (ids: number[]) => api.post(`/api/admin/orders/${boekingId}/items/reorder`, { ids }),
    onSuccess: verversen,
  });
  const pakketToepassen = useMutation({
    mutationFn: ({ packageId, aantal }: { packageId: number; aantal: number }) =>
      api.post(`/api/admin/orders/${boekingId}/apply-package`, { packageId, aantal }),
    onSuccess: verversen,
  });

  const betalingToevoegen = useMutation({
    mutationFn: (b: object) => api.post(`/api/admin/orders/${boekingId}/betalingen`, b),
    onSuccess: verversen,
  });
  const betalingVerwijderen = useMutation({
    mutationFn: (id: number) => api.delete(`/api/admin/orders/${boekingId}/betalingen/${id}`),
    onSuccess: verversen,
  });

  const boekingVerwijderen = useMutation({
    mutationFn: () => api.delete(`/api/admin/orders/${boekingId}`),
    onSuccess: async () => {
      await verversen();
      onClose();
    },
  });

  /** Eén veld bijwerken. `""` wordt `null` — een leeggemaakt veld hoort leeg te zijn, geen "". */
  const veld = (naam: string) => async (waarde: string) => {
    await patchBoeking.mutateAsync({ [naam]: waarde === "" ? null : waarde });
  };

  /** Getalvelden: `"45"` moet als getal aankomen, anders weigert Zod het. */
  const getalVeld = (naam: string) => async (waarde: string) => {
    await patchBoeking.mutateAsync({ [naam]: waarde === "" ? null : Number(waarde) });
  };

  const bezig =
    regelToevoegen.isPending ||
    regelWijzigen.isPending ||
    regelVerwijderen.isPending ||
    regelsHerordenen.isPending;

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={boeking?.reference ?? (isLoading ? "Laden…" : "Boeking")}
      subtitle={boeking ? kopRegel(boeking) : undefined}
      headerRight={
        boeking && (
          <select
            value={boeking.status}
            onChange={(e) => void patchBoeking.mutateAsync({ status: e.target.value })}
            aria-label="Status"
            className={`shrink-0 rounded-full border-0 px-3 py-1 text-xs font-medium outline-none ring-1 ring-inset ring-charcoal/10 ${
              STATUS_KLEUR[boeking.status] ?? ""
            }`}
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
        boeking && (
          <>
            <button
              type="button"
              onClick={() => {
                // Regels en tijdlijn gaan mee (cascade). Dat zeggen we erbij, want het is
                // niet terug te draaien.
                if (confirm(`${boeking.reference} verwijderen? De regels en de tijdlijn gaan mee.`)) {
                  void boekingVerwijderen.mutateAsync();
                }
              }}
              className="rounded-full p-2 text-charcoal/55 transition hover:bg-burgundy/10 hover:text-burgundy"
              aria-label="Boeking verwijderen"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <div className="flex-1" />
            <a
              href={`/api/admin/orders/${boeking.id}/offerte`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-gold px-4 py-2 text-xs uppercase tracking-widest text-gold-dark transition hover:bg-gold/10"
            >
              <FileText className="h-3.5 w-3.5" /> Offerte
            </a>
          </>
        )
      }
    >
      {isLoading && (
        <div className="flex items-center gap-2 py-8 text-sm text-charcoal/70">
          <Loader2 className="h-4 w-4 animate-spin" /> Boeking laden…
        </div>
      )}

      {/* Scenario 87 en 88: een net verwijderde boeking of een verzonnen id uit de adresbalk.
          Een nette melding, en de agenda erachter blijft gewoon bruikbaar. */}
      {isError && (
        <div className="rounded-md border border-burgundy/25 bg-burgundy/[0.06] px-4 py-6 text-sm text-charcoal">
          <p className="font-medium text-burgundy">Deze boeking bestaat niet (meer).</p>
          <p className="mt-1 text-charcoal/70">
            {error instanceof Error ? error.message : "Onbekende fout"}. Mogelijk is hij net
            verwijderd, of klopt het nummer in het webadres niet.
          </p>
        </div>
      )}

      {boeking && (
        <>
          <BedragenStrip
            totalPrice={boeking.totalPrice}
            ontvangen={boeking.ontvangen}
            depositAmount={boeking.depositAmount}
          />

          <AllergieBlok allergies={boeking.allergies} opslaan={veld("allergies")} />

          <SheetSectie
            titel="Klant"
            actie={
              boeking.customer && (
                <Link
                  href={`/admin/klanten/${boeking.customer.id}`}
                  className="inline-flex items-center gap-1 text-xs text-gold-dark hover:underline"
                >
                  Klantpagina <ExternalLink className="h-3 w-3" />
                </Link>
              )
            }
          >
            {boeking.customer ? (
              <div className="rounded-md bg-white/60 px-3 py-2.5">
                <p className="text-sm font-medium text-charcoal">{boeking.customer.name}</p>
                <p className="mt-0.5 break-words text-xs text-charcoal/75">
                  {boeking.customer.email && (
                    // Een mailadres opent haar eigen mailprogramma; mail zit verder niet in
                    // het systeem, dat doet ze op haar telefoon.
                    <a href={`mailto:${boeking.customer.email}`} className="hover:text-gold-dark">
                      {boeking.customer.email}
                    </a>
                  )}
                  {boeking.customer.email && boeking.customer.phone && " · "}
                  {boeking.customer.phone && (
                    <a href={`tel:${boeking.customer.phone}`} className="hover:text-gold-dark">
                      {boeking.customer.phone}
                    </a>
                  )}
                </p>
              </div>
            ) : (
              // Scenario 3 en 76: een boeking zonder klant is geldig — iemand appt "kan er iets
              // voor zondag?" zonder naam, of de klant is verwijderd. Maar zodra de naam er wél
              // is, moet je hem kwijt kunnen; hier stond alleen een mededeling.
              <>
                <p className="rounded-md border border-dashed border-gold/25 bg-cream/60 px-3 py-2.5 text-sm text-charcoal/70">
                  Nog geen klant gekoppeld.
                </p>
                <KlantKoppelen boekingId={boeking.id} />
              </>
            )}
          </SheetSectie>

          {/* Personen en thema horen hier: het zijn eigenschappen van het feest, niet van het
              aanbod. Ze stonden eerder in een aparte sectie "Wat", samen met de pakketkeuze —
              maar het aantal personen bepaalt hoevéél er nodig is, niet wát. */}
          <SheetSectie titel="Het feest">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <VeldInline label="Datum" type="date" waarde={boeking.eventDate} opslaan={veld("eventDate")} leegTekst="Nog geen datum" />
              <VeldInline label="Bezorgwijze" type="select" waarde={boeking.deliveryType} opslaan={veld("deliveryType")}
                opties={Object.entries(LEVERING_LABEL).map(([waarde, label]) => ({ waarde, label }))} />
              <VeldInline label="Feest om" type="time" waarde={boeking.eventTime} opslaan={veld("eventTime")} leegTekst="Tijd onbekend" />
              <VeldInline label="Opbouw om" type="time" waarde={boeking.setupTime} opslaan={veld("setupTime")} leegTekst="—" />
              <VeldInline label="Personen" type="number" waarde={boeking.persons} opslaan={getalVeld("persons")} leegTekst="—" />
              <VeldInline label="Thema" waarde={boeking.theme} opslaan={veld("theme")} leegTekst="—" />
              <VeldInline label="Locatie" type="textarea" regels={2} waarde={boeking.location} opslaan={veld("location")}
                leegTekst="Geen locatie" className="col-span-2" />
            </div>
          </SheetSectie>

          <section className="mb-7">
            {/* Direct boven de tabel, want dat is waar het effect landt. */}
            <PakketToevoegen
              pakketten={pakketten ?? []}
              personen={boeking.persons}
              gekozenId={boeking.packageId}
              toevoegen={(packageId, aantal) => pakketToepassen.mutateAsync({ packageId, aantal })}
            />
            <RegelTabel
              regels={boeking.items}
              totalPrice={boeking.totalPrice}
              bezig={bezig}
              toevoegen={(r) => regelToevoegen.mutateAsync(r)}
              wijzigen={(id, velden) => regelWijzigen.mutateAsync({ id, velden })}
              verwijderen={(id) => regelVerwijderen.mutateAsync(id)}
              herordenen={(ids) => regelsHerordenen.mutateAsync(ids)}
            />
          </section>

          <SheetSectie titel="Betaling">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <VeldInline label="Aanbetaling" waarde={boeking.depositAmount} opslaan={veld("depositAmount")} />
              <div>
                <span className="mb-0.5 block text-[11px] font-medium uppercase tracking-wider text-charcoal/75">
                  Ontvangen
                </span>
                <div className="px-2 py-1 text-sm tabular-nums text-charcoal">
                  {bedragen(boeking.totalPrice, boeking.ontvangen, boeking.depositAmount).ontvangen}
                </div>
              </div>
              {/*
                Hier stond een btw-keuze voor de hele boeking. Die is eruit: het tarief hoort bij
                het bedrag, en het bedrag staat op de regel. Met een keuze op pakket-, boekings-
                én regelniveau was niet meer af te lezen welke wint. Nu bepaalt het pakket de
                startwaarde en heeft de regel het laatste woord.
              */}
            </div>

            {/*
              Hier stond een selectievakje "Ontvangen: binnen" dat bij de aanbetaling hoorde.
              Daarmee viel niet vast te leggen dat de rest ook betaald was, en een klant die in
              twee keer betaalt paste er al helemaal niet in. Zie BetalingenBlok.
            */}
            <div className="mt-4">
              <BetalingenBlok
                betalingen={boeking.betalingen ?? []}
                openstaandBedrag={(
                  Math.max(0, bedragen(boeking.totalPrice, boeking.ontvangen).openCenten) / 100
                ).toFixed(2)}
                bezig={betalingToevoegen.isPending || betalingVerwijderen.isPending}
                toevoegen={(b) => betalingToevoegen.mutateAsync(b)}
                verwijderen={(id) => betalingVerwijderen.mutateAsync(id)}
              />
            </div>
          </SheetSectie>

          <SheetSectie titel="Notities">
            <VeldInline label="" type="textarea" regels={3} waarde={boeking.notes} opslaan={veld("notes")}
              leegTekst="Geen notities — klik om te schrijven" />
          </SheetSectie>

          <SheetSectie titel="Tijdlijn">
            <Tijdlijn gebeurtenissen={gebeurtenissen ?? []} />
          </SheetSectie>
        </>
      )}
    </Sheet>
  );
}

/** "za 12 september 2026 · 14:30 · opbouw 12:00" — leeg wat er niet is. */
function kopRegel(b: Boeking): string {
  const delen: string[] = [];
  if (b.eventDate) {
    delen.push(format(parseISO(b.eventDate), "EEEE d MMMM yyyy", { locale: nl }));
  } else {
    delen.push("Nog geen datum");
  }
  if (b.eventTime) delen.push(b.eventTime.slice(0, 5));
  if (b.setupTime) delen.push(`opbouw ${b.setupTime.slice(0, 5)}`);
  return delen.join(" · ");
}
