import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "../../lib/api";
import { PageKop } from "../../components/admin/ui/PageKop";
import { LegeStaat } from "../../components/admin/ui/LegeStaat";
import { Badge } from "../../components/admin/ui/Badge";
import { Bedrag } from "../../components/admin/ui/Bedrag";
import { BTW_LABEL, type BtwTarief, type Product } from "@shared/schema";
import { Trash2, Plus, Package, PackagePlus } from "lucide-react";

const CATEGORIES: Product["category"][] = [
  "bruidstaart", "verjaardag", "mini_desserts", "cupcakes", "taart_los", "overig",
];

/** De kop van dit scherm. Apart zodat de paginacomponent over de lijst gaat en niet over opmaak. */
function PageKopProducten({ onNieuw }: { onNieuw: () => void }) {
  return (
    <PageKop
      titel={<>Producten &amp; prijslijst</>}
      bovenschrift="Taart-prijslijst"
      icoon={Package}
      actie={
        <button onClick={onNieuw} className="btn-gold !py-2 !px-4 text-xs">
          <Plus size={14} /> Nieuw product
        </button>
      }
    />
  );
}

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
      <PageKopProducten onNieuw={() => setShowNew((s) => !s)} />
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
        <table className="tabel-admin w-full text-sm">
          <thead>
            <tr><th className="text-left px-4 py-3">Naam</th><th className="text-left px-4 py-3">Categorie</th><th className="text-right px-4 py-3">Prijs</th><th className="text-left px-4 py-3">Btw</th><th className="text-center px-4 py-3">Op de site</th><th></th></tr>
          </thead>
          <tbody>
            {products?.length ? products.map((p) => (
              <tr key={p.id} className="rij-hover">
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 text-charcoal/60">{p.category}</td>
                <td className="px-4 py-3 text-right">
                  <Bedrag waarde={p.basePrice} vet />
                  <span className="text-charcoal/40"> / {p.unit}</span>
                </td>
                {/* Zonder bedrijfsbrede btw-instelling is dit het enige wat je eraan herinnert
                    dat dit product nog geen tarief heeft. */}
                <td className="px-4 py-3">
                  {p.vatRate ? (
                    <span className="text-charcoal/70">{BTW_LABEL[p.vatRate as BtwTarief]}</span>
                  ) : (
                    // Butter en niet burgundy: er is niets kapot, er ontbreekt iets. Zie de
                    // kleurtaal in index.css.
                    <Badge toon="butter" titel="Zonder tarief telt dit product niet mee in de btw-uitsplitsing">
                      nog niet ingesteld
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <input type="checkbox" checked={p.publicVisible}
                    onChange={(e) => zichtbaar.mutate({ id: p.id, publicVisible: e.target.checked })} />
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => confirm(`'${p.name}' verwijderen?`) && del.mutate(p.id)} className="rounded p-1 text-charcoal/30 transition hover:bg-burgundy/10 hover:text-burgundy">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="p-4">
                  <LegeStaat
                    icoon={PackagePlus}
                    titel="Nog geen producten"
                    hint="De taart-prijslijst is leeg. Voeg een product toe en zet 'op de site' aan als het publiek mag."
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
