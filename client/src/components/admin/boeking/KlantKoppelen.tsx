import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Loader2 } from "lucide-react";
import { api } from "../../../lib/api";

/**
 * Een klant aan een bestaande boeking hangen.
 *
 * Een boeking zónder klant is geldig — iemand appt *"kan er iets voor zondag?"* zonder naam
 * (scenario 3), of de klant is verwijderd (76). Maar zodra je die naam wél hebt, moest je hem
 * tot nu toe nergens kwijt: het blok zei "Nog geen klant gekoppeld" en daar bleef het bij.
 *
 * Zoeken gaat op wat je typt, met dezelfde gedachte als de ontdubbeling in `from-contact`: een
 * terugkerende klant hoort aan zijn bestaande rij gekoppeld te worden, niet aan een tweede. Het
 * verschil is dat je hier meekijkt terwijl je typt, dus de treffers staan in beeld voordat je
 * op "nieuw" drukt.
 */
export function KlantKoppelen({ boekingId }: { boekingId: number }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [naam, setNaam] = useState("");
  const [email, setEmail] = useState("");
  const [telefoon, setTelefoon] = useState("");
  const [fout, setFout] = useState<string | null>(null);

  const { data: klanten } = useQuery({
    queryKey: ["admin", "customers"],
    queryFn: () => api.get<Array<{ id: number; name: string; email: string | null; phone: string | null }>>(
      "/api/admin/customers",
    ),
    enabled: open,
  });

  const treffers =
    naam.trim().length >= 2
      ? (klanten ?? []).filter((k) => k.name.toLowerCase().includes(naam.trim().toLowerCase())).slice(0, 5)
      : [];

  const koppel = useMutation({
    mutationFn: async (customerId: number) => {
      await api.patch(`/api/admin/orders/${boekingId}`, { customerId });
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["admin", "boeking", boekingId] }),
        qc.invalidateQueries({ queryKey: ["admin", "boeking", boekingId, "events"] }),
        qc.invalidateQueries({ queryKey: ["admin", "orders"] }),
      ]);
      setOpen(false);
      setNaam("");
      setEmail("");
      setTelefoon("");
    },
    onError: (e) => setFout(e instanceof Error ? e.message : "Koppelen mislukt"),
  });

  const nieuwEnKoppel = useMutation({
    mutationFn: async () => {
      const klant = await api.post<{ id: number }>("/api/admin/customers", {
        name: naam.trim(),
        email: email.trim() || undefined,
        phone: telefoon.trim() || undefined,
      });
      await api.patch(`/api/admin/orders/${boekingId}`, { customerId: klant.id });
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["admin", "boeking", boekingId] }),
        qc.invalidateQueries({ queryKey: ["admin", "boeking", boekingId, "events"] }),
        qc.invalidateQueries({ queryKey: ["admin", "orders"] }),
        qc.invalidateQueries({ queryKey: ["admin", "customers"] }),
      ]);
      setOpen(false);
      setNaam("");
      setEmail("");
      setTelefoon("");
    },
    onError: (e) => setFout(e instanceof Error ? e.message : "Aanmaken mislukt"),
  });

  const bezig = koppel.isPending || nieuwEnKoppel.isPending;

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-outline mt-2 !px-4 !py-2 text-xs">
        <UserPlus size={14} /> Klant koppelen
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-md border border-sage/25 bg-white/60 p-3">
      <label className="label">Naam</label>
      <input
        className="input"
        autoFocus
        value={naam}
        onChange={(e) => { setNaam(e.target.value); setFout(null); }}
        placeholder="Begin te typen om te zoeken"
      />

      {treffers.length > 0 && (
        <ul className="mt-2 space-y-1">
          {treffers.map((k) => (
            <li key={k.id}>
              <button
                type="button"
                disabled={bezig}
                onClick={() => koppel.mutate(k.id)}
                className="w-full rounded px-2.5 py-1.5 text-left text-sm hover:bg-linen"
              >
                <span className="font-medium">{k.name}</span>
                {(k.email || k.phone) && (
                  <span className="ml-2 text-xs text-charcoal/55">{k.email ?? k.phone}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* De velden voor een nieuwe klant verschijnen pas als er iets getypt is, zodat het
          zoeken vooropstaat: eerst kijken of ze al bestaat, dan pas aanmaken. */}
      {naam.trim().length >= 2 && (
        <div className="mt-3 border-t border-sage/15 pt-3">
          <p className="mb-2 text-xs text-charcoal/55">
            {treffers.length > 0 ? "Staat ze er niet bij? Maak een nieuwe klant:" : "Nieuwe klant:"}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <input className="input" placeholder="E-mailadres" value={email}
              onChange={(e) => setEmail(e.target.value)} />
            <input className="input" placeholder="Telefoon" value={telefoon}
              onChange={(e) => setTelefoon(e.target.value)} />
          </div>
        </div>
      )}

      {fout && <p className="mt-2 text-sm text-burgundy">{fout}</p>}

      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={() => { setOpen(false); setFout(null); }} className="btn-ghost !px-4 !py-2 text-xs">
          Annuleren
        </button>
        <button
          type="button"
          disabled={bezig || naam.trim().length < 2}
          onClick={() => nieuwEnKoppel.mutate()}
          className="btn-sage !px-4 !py-2 text-xs"
        >
          {bezig ? <><Loader2 size={14} className="animate-spin" /> Bezig…</> : "Nieuwe klant koppelen"}
        </button>
      </div>
    </div>
  );
}
