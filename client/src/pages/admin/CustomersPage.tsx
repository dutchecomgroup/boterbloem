import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { api } from "../../lib/api";
import type { Customer } from "@shared/schema";
import { Trash2, Plus, Search, Users, UserPlus } from "lucide-react";
import { Link } from "wouter";
import { PageKop } from "../../components/admin/ui/PageKop";
import { LegeStaat } from "../../components/admin/ui/LegeStaat";

export default function CustomersPage() {
  const qc = useQueryClient();
  const { data: customers } = useQuery({
    queryKey: ["admin", "customers"],
    queryFn: () => api.get<Customer[]>("/api/admin/customers"),
  });

  const [zoek, setZoek] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", notes: "" });

  const create = useMutation({
    mutationFn: (data: typeof form) => api.post("/api/admin/customers", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "customers"] });
      setShowNew(false);
      setForm({ name: "", email: "", phone: "", address: "", notes: "" });
    },
  });

  // Client-side filteren: bij deze aantallen ruim voldoende, en het scheelt een serverronde.
  const gefilterd = useMemo(() => {
    const q = zoek.trim().toLowerCase();
    if (!q) return customers ?? [];
    return (customers ?? []).filter((c) =>
      [c.name, c.email, c.phone].filter(Boolean).some((v) => v!.toLowerCase().includes(q)),
    );
  }, [customers, zoek]);

  const del = useMutation({
    mutationFn: (id: number) => api.delete(`/api/admin/customers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "customers"] }),
  });

  return (
    <div>
      <PageKop
        titel="Klanten"
        icoon={Users}
        onderschrift="Klantgegevens en historie. Klik een klant aan voor de boekingen."
        actie={
          <button onClick={() => setShowNew((s) => !s)} className="btn-sage !py-2 !px-4 text-xs">
            <Plus size={14} /> Nieuwe klant
          </button>
        }
      />

      <div className="relative mb-6 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-sage-dark/50" />
        <input className="input !pl-9" placeholder="Zoek op naam, e-mail of telefoon"
          value={zoek} onChange={(e) => setZoek(e.target.value)} />
      </div>

      {showNew && (
        <form
          className="card mb-6 grid sm:grid-cols-2 gap-4"
          onSubmit={(e) => { e.preventDefault(); create.mutate(form); }}
        >
          <div><label className="label">Naam *</label><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">E-mail</label><input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><label className="label">Telefoon</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><label className="label">Adres</label><input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div className="sm:col-span-2"><label className="label">Notities</label><textarea className="input min-h-[80px]" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="sm:col-span-2 flex gap-3 justify-end">
            <button type="button" className="btn-ghost" onClick={() => setShowNew(false)}>Annuleren</button>
            <button type="submit" className="btn-sage" disabled={create.isPending}>{create.isPending ? "Opslaan…" : "Opslaan"}</button>
          </div>
        </form>
      )}

      <div className="card overflow-hidden p-0">
        <table className="tabel-admin w-full text-sm">
          <thead>
            <tr><th className="text-left px-4 py-3">Naam</th><th className="text-left px-4 py-3">E-mail</th><th className="text-left px-4 py-3">Telefoon</th><th></th></tr>
          </thead>
          <tbody>
            {gefilterd.length ? gefilterd.map((c) => (
              <tr key={c.id} className="rij-hover">
                <td className="px-4 py-3 font-medium">
                  <Link href={`/admin/klanten/${c.id}`} className="text-charcoal transition-colors hover:text-sage-dark">{c.name}</Link>
                </td>
                <td className="px-4 py-3 text-charcoal/70">{c.email ?? <span className="text-charcoal/30">—</span>}</td>
                <td className="px-4 py-3 text-charcoal/70">{c.phone ?? <span className="text-charcoal/30">—</span>}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => confirm(`'${c.name}' verwijderen?`) && del.mutate(c.id)} className="rounded p-1 text-charcoal/30 transition hover:bg-burgundy/10 hover:text-burgundy">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} className="p-4">
                  <LegeStaat
                    icoon={zoek ? Search : UserPlus}
                    titel={zoek ? "Geen klant gevonden" : "Nog geen klanten"}
                    hint={zoek
                      ? `Niets dat past bij "${zoek}". Probeer een deel van de naam of het e-mailadres.`
                      : "Klanten komen er vanzelf bij zodra je een aanvraag omzet naar een boeking."}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
