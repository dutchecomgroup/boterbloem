import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "../../lib/api";
import { BTW_LABEL, type BtwTarief, type Product } from "@shared/schema";
import { formatCurrency } from "../../lib/utils";
import { Trash2, Plus } from "lucide-react";

const CATEGORIES: Product["category"][] = [
  "bruidstaart", "verjaardag", "mini_desserts", "cupcakes", "taart_los", "overig",
];

export default function ProductsPage() {
  const qc = useQueryClient();
  const { data: products } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: () => api.get<Product[]>("/api/admin/products"),
  });

  const empty = { slug: "", name: "", category: "overig" as Product["category"], basePrice: "0", unit: "stuk", active: true, sortOrder: 0, description: "", vatRate: null as string | null };
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState(empty);

  const create = useMutation({
    mutationFn: (data: typeof form) => api.post("/api/admin/products", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "products"] }); setShowNew(false); setForm(empty); },
  });
  const zichtbaar = useMutation({
    mutationFn: ({ id, ...rest }: { id: number } & Record<string, unknown>) =>
      api.patch(`/api/admin/products/${id}`, rest),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      qc.invalidateQueries({ queryKey: ["public", "products"] });
    },
  });

  const del = useMutation({
    mutationFn: (id: number) => api.delete(`/api/admin/products/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "products"] }),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl">Producten &amp; prijslijst</h1>
        <button onClick={() => setShowNew((s) => !s)} className="btn-gold !py-2 !px-4 text-xs">
          <Plus size={14} /> Nieuw product
        </button>
      </div>
      <p className="text-charcoal/60 text-sm mb-8 max-w-2xl">
        Prijslijst voor je boekingen. Zet <strong>op de site</strong> aan om een regel te tonen
        in het taartenblok op de aanbod-pagina — de rest blijft intern.
      </p>

      {showNew && (
        <form className="card mb-6 grid sm:grid-cols-2 gap-4" onSubmit={(e) => { e.preventDefault(); create.mutate(form); }}>
          <div><label className="label">Naam *</label><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">Slug *</label><input className="input" required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
          <div><label className="label">Categorie</label>
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Product["category"] })}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div><label className="label">Basisprijs (€)</label><input className="input" type="number" step="0.01" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} /></div>
          <div><label className="label">Eenheid</label><input className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></div>
          <div>
            <label className="label">Btw-tarief</label>
            <select className="input" value={form.vatRate ?? ""}
              onChange={(e) => setForm({ ...form, vatRate: e.target.value || null })}>
              <option value="">Nog niet ingesteld</option>
              {(Object.keys(BTW_LABEL) as BtwTarief[]).map((t) => (
                <option key={t} value={t}>{BTW_LABEL[t]}</option>
              ))}
            </select>
            {/* Geen verdeling zoals bij een pakket: een taart is één ding, en dat ding is eten
                (9%). Blijkt een product tóch samengesteld, dan hoort het een pakket te zijn. */}
            <p className="mt-1 text-xs text-charcoal/55">Taarten en desserts vallen onder 9%.</p>
          </div>
          <div className="sm:col-span-2"><label className="label">Omschrijving</label><textarea className="input min-h-[80px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="sm:col-span-2 flex justify-end gap-3">
            <button type="button" className="btn-ghost" onClick={() => setShowNew(false)}>Annuleren</button>
            <button type="submit" className="btn-gold" disabled={create.isPending}>{create.isPending ? "Opslaan…" : "Opslaan"}</button>
          </div>
        </form>
      )}

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-charcoal/5 text-charcoal/60 text-xs uppercase tracking-widest">
            <tr><th className="text-left px-4 py-3">Naam</th><th className="text-left px-4 py-3">Categorie</th><th className="text-right px-4 py-3">Prijs</th><th className="text-left px-4 py-3">Btw</th><th className="text-center px-4 py-3">Op de site</th><th></th></tr>
          </thead>
          <tbody>
            {products?.length ? products.map((p) => (
              <tr key={p.id} className="border-t border-charcoal/5 hover:bg-cream/40">
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 text-charcoal/60">{p.category}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(p.basePrice)} / {p.unit}</td>
                {/* Zonder bedrijfsbrede btw-instelling is dit het enige wat je eraan herinnert
                    dat dit product nog geen tarief heeft. */}
                <td className={`px-4 py-3 ${p.vatRate ? "text-charcoal/60" : "text-burgundy"}`}>
                  {p.vatRate ? BTW_LABEL[p.vatRate as BtwTarief] : "nog niet ingesteld"}
                </td>
                <td className="px-4 py-3 text-center">
                  <input type="checkbox" checked={p.publicVisible}
                    onChange={(e) => zichtbaar.mutate({ id: p.id, publicVisible: e.target.checked })} />
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => confirm(`'${p.name}' verwijderen?`) && del.mutate(p.id)} className="text-charcoal/40 hover:text-burgundy">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-charcoal/40">Nog geen producten</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
