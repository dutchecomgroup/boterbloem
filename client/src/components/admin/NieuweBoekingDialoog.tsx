import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2 } from "lucide-react";
import { api } from "../../lib/api";

/**
 * Een boeking aanmaken zonder dat er een aanvraag aan vooraf ging — want de helft van het werk
 * komt binnen via de telefoon (scenario 1: *"Marieke belt: taart voor 12 personen, zaterdag
 * over drie weken"*). Tot nu toe kon dat niet: wie belde kon je niet invoeren.
 *
 * **Alleen het hoognodige.** Naam en datum, meer niet — de rest vul je in de sheet in, die
 * meteen erna opent. Een formulier met vijftien velden aan de telefoon invullen werkt niet;
 * je wil de boeking in het systeem hebben terwijl je nog praat.
 *
 * **Klant is optioneel** (scenario 3: iemand appt "kan er iets voor zondag?" zonder naam), en
 * **de datum ook** (scenario 4: de klant weet hem nog niet).
 */
export function NieuweBoekingDialoog({
  open,
  onClose,
  onAangemaakt,
  datum,
}: {
  open: boolean;
  onClose: () => void;
  onAangemaakt: (boekingId: number) => void;
  /** Voorgevuld vanuit de agenda: klikken op een dag maakt een boeking op díé dag. */
  datum?: string;
}) {
  const qc = useQueryClient();
  const [naam, setNaam] = useState("");
  const [klantId, setKlantId] = useState<number | null>(null);
  const [telefoon, setTelefoon] = useState("");
  const [email, setEmail] = useState("");
  const [eventDate, setEventDate] = useState(datum ?? "");
  const [fout, setFout] = useState<string | null>(null);

  const { data: klanten } = useQuery({
    queryKey: ["admin", "customers"],
    queryFn: () => api.get<Array<{ id: number; name: string; email: string | null }>>("/api/admin/customers"),
    enabled: open,
  });

  // Zoeken op wat er getypt is. Zo koppel je een terugkerende klant aan zijn bestaande rij in
  // plaats van er een tweede aan te maken (scenario 2) — dezelfde ontdubbeling die
  // `from-contact` op e-mailadres doet, maar hier met de ogen van degene die zit te typen.
  const treffers =
    naam.trim().length >= 2 && klantId === null
      ? (klanten ?? []).filter((k) => k.name.toLowerCase().includes(naam.trim().toLowerCase())).slice(0, 5)
      : [];

  const aanmaken = useMutation({
    mutationFn: async () => {
      let customerId = klantId;

      // Nieuwe klant alleen als er een naam getypt is én er geen bestaande gekozen is.
      if (customerId === null && naam.trim()) {
        const klant = await api.post<{ id: number }>("/api/admin/customers", {
          name: naam.trim(),
          email: email.trim() || undefined,
          phone: telefoon.trim() || undefined,
        });
        customerId = klant.id;
      }

      const boeking = await api.post<{ id: number }>("/api/admin/orders", {
        order: {
          customerId: customerId ?? undefined,
          eventDate: eventDate || undefined,
          status: "aanvraag",
        },
        items: [],
      });
      return boeking.id;
    },
    onSuccess: async (id) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["admin", "orders"] }),
        qc.invalidateQueries({ queryKey: ["admin", "customers"] }),
        qc.invalidateQueries({ queryKey: ["admin", "agenda"] }),
      ]);
      herstel();
      onAangemaakt(id);
    },
    onError: (err) => setFout(err instanceof Error ? err.message : "Aanmaken mislukt"),
  });

  function herstel() {
    setNaam("");
    setKlantId(null);
    setTelefoon("");
    setEmail("");
    setEventDate(datum ?? "");
    setFout(null);
  }

  const inHetVerleden = eventDate !== "" && eventDate < new Date().toISOString().slice(0, 10);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          herstel();
          onClose();
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-charcoal/40 backdrop-blur-sm data-[state=open]:animate-sheet-fade" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-cream p-6 shadow-2xl outline-none">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <Dialog.Title className="font-display text-xl text-charcoal">Nieuwe boeking</Dialog.Title>
              <Dialog.Description className="mt-0.5 text-sm text-charcoal/75">
                Alleen het hoognodige — de rest vul je zo in.
              </Dialog.Description>
            </div>
            <Dialog.Close className="-mr-1 rounded-full p-2 text-charcoal/70 hover:bg-charcoal/5" aria-label="Sluiten">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <label className="label" htmlFor="nb-naam">Klant</label>
              <input
                id="nb-naam"
                className="input"
                placeholder="Naam — leeg laten mag ook"
                value={naam}
                onChange={(e) => {
                  setNaam(e.target.value);
                  setKlantId(null);
                }}
                autoFocus
              />

              {treffers.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-charcoal/15 bg-white shadow-lg">
                  <li className="border-b border-charcoal/10 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-charcoal/70">
                    Bestaande klant koppelen
                  </li>
                  {treffers.map((k) => (
                    <li key={k.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setKlantId(k.id);
                          setNaam(k.name);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-cream"
                      >
                        {k.name}
                        {k.email && <span className="text-charcoal/65"> · {k.email}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {klantId !== null && (
                <p className="mt-1 text-xs text-emerald-700">
                  Gekoppeld aan de bestaande klant — er komt geen tweede klantregel bij.
                </p>
              )}
            </div>

            {/* Alleen bij een níeuwe klant: bij een bestaande zijn deze gegevens er al. */}
            {klantId === null && naam.trim() && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label" htmlFor="nb-tel">Telefoon</label>
                  <input id="nb-tel" className="input" value={telefoon} onChange={(e) => setTelefoon(e.target.value)} />
                </div>
                <div>
                  <label className="label" htmlFor="nb-mail">E-mail</label>
                  <input id="nb-mail" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
            )}

            <div>
              <label className="label" htmlFor="nb-datum">Datum</label>
              <input
                id="nb-datum"
                className="input"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
              {/* Scenario 100: een boeking van vorig jaar invoeren voor de administratie mag —
                  een zachte melding, geen blokkade. */}
              {inHetVerleden && (
                <p className="mt-1 text-xs text-gold-dark">
                  Deze datum ligt in het verleden. Dat mag — handig voor de administratie.
                </p>
              )}
            </div>

            {fout && <p className="text-sm text-burgundy">{fout}</p>}
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Dialog.Close className="btn-ghost">Annuleren</Dialog.Close>
            <button
              type="button"
              onClick={() => aanmaken.mutate()}
              disabled={aanmaken.isPending}
              className="btn-gold"
            >
              {aanmaken.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Aanmaken en openen
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
