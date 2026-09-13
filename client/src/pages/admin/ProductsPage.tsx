import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { PageKop } from "../../components/admin/ui/PageKop";
import { LegeStaat } from "../../components/admin/ui/LegeStaat";
import { Badge } from "../../components/admin/ui/Badge";
import { Bedrag } from "../../components/admin/ui/Bedrag";
import { Sheet, SheetSectie } from "../../components/ui/Sheet";
import { useSheetParam } from "../../hooks/useSheetParam";
import {
  BTW_LABEL,
  PRODUCT_CATEGORIE_LABEL,
  type BtwTarief,
  type Product,
} from "@shared/schema";
import { Trash2, Plus, Package, PackagePlus, Pencil } from "lucide-react";

const CATEGORIES = Object.keys(PRODUCT_CATEGORIE_LABEL) as Product["category"][];

/** Wat er in de sheet bewerkt wordt. `id` ontbreekt zolang het product nieuw is. */
type Concept = Partial<Product>;

const LEEG: Concept = {
  name: "",
  category: "taart_los",
  basePrice: "0",
  unit: "stuk",
  active: true,
  publicVisible: false,
  sortOrder: 0,
  description: "",
  vatRate: null,
};

/** De kop van dit scherm. Apart zodat de paginacomponent over de lijst gaat en niet over opmaak. */
function PageKopProducten({ onNieuw }: { onNieuw: () => void }) {
  return (
    <PageKop
      titel={<>Taarten &amp; prijslijst</>}
      bovenschrift="Taart-prijslijst"
      icoon={Package}
      actie={
        <button onClick={onNieuw} className="btn-sage !py-2 !px-4 text-xs">
          <Plus size={14} /> Nieuwe taart
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

  /*
   * De sheet hangt aan het webadres, net als bij boekingen en pakketten: `?product=12` is een
   * deelbare link en de terugknop sluit de sheet in plaats van je van de pagina af te gooien.
   */
  const sheet = useSheetParam("product");
  const [concept, setConcept] = useState<Concept | null>(null);

  // De werkkopie volgt het webadres. Zo opent een gedeelde link met de juiste taart open, en
  // laat een verversing het scherm niet leeg achter.
  useEffect(() => {
    if (sheet.isNieuw) setConcept({ ...LEEG });
    else if (sheet.id) {
      const gevonden = products?.find((p) => p.id === sheet.id);
      if (gevonden) setConcept({ ...gevonden });
    } else setConcept(null);
  }, [sheet.id, sheet.isNieuw, products]);

  const bewaar = useMutation({
    mutationFn: (p: Concept) =>
      p.id
        ? api.patch(`/api/admin/products/${p.id}`, ontdoeVanAfgeleide(p))
        : api.post("/api/admin/products", ontdoeVanAfgeleide(p)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      qc.invalidateQueries({ queryKey: ["public", "products"] });
      sheet.sluiten();
    },
  });

  /** Alleen het vinkje "op de site", zonder de sheet te openen. */
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      qc.invalidateQueries({ queryKey: ["public", "products"] });
      sheet.sluiten();
    },
  });

  return (
    <div>
      <PageKopProducten onNieuw={sheet.openenNieuw} />
      <p className="text-charcoal/60 text-sm mb-8 max-w-2xl">
        Je prijslijst voor taarten en desserts. Klik een regel aan om hem te wijzigen. Zet{" "}
        <strong>op de site</strong> aan om hem te tonen in het taartenblok op de aanbod-pagina —
        de rest blijft intern, voor op je offertes.
      </p>

      <div className="card p-0 overflow-hidden">
        <table className="tabel-admin w-full text-sm">
          <thead>
            <tr>
              <th className="text-left px-4 py-3">Naam</th>
              <th className="text-left px-4 py-3">Soort</th>
              <th className="text-right px-4 py-3">Prijs</th>
              <th className="text-left px-4 py-3">Btw</th>
              <th className="text-center px-4 py-3">Op de site</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products?.length ? products.map((p) => (
              <tr
                key={p.id}
                className="rij-hover cursor-pointer"
                onClick={() => sheet.openen(p.id)}
              >
                <td className="px-4 py-3 font-medium">
                  {p.name}
                  {p.description && (
                    <div className="text-xs font-normal text-charcoal/55">{p.description}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-charcoal/60">
                  {PRODUCT_CATEGORIE_LABEL[p.category]}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {p.priceIsFrom && <span className="text-xs text-charcoal/50">vanaf </span>}
                  <Bedrag waarde={p.basePrice} vet />
                  <span className="text-charcoal/40"> / {p.unit}</span>
                </td>
                {/* Zonder bedrijfsbrede btw-instelling is dit het enige wat je eraan herinnert
                    dat dit product nog geen tarief heeft. */}
                <td className="px-4 py-3">
                  {p.vatRate ? (
                    <span className="text-charcoal/70">{BTW_LABEL[p.vatRate as BtwTarief]}</span>
                  ) : (
                    // Boterbloem en niet burgundy: er is niets kapot, er ontbreekt iets. Zie de
                    // kleurtaal in index.css.
                    <Badge toon="boterbloem" titel="Zonder tarief telt dit product niet mee in de btw-uitsplitsing">
                      nog niet ingesteld
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={p.publicVisible}
                    aria-label={`${p.name} op de site tonen`}
                    onChange={(e) => zichtbaar.mutate({ id: p.id, publicVisible: e.target.checked })}
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="inline-flex items-center gap-1 text-xs text-charcoal/40">
                    <Pencil size={14} /> wijzigen
                  </span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="p-4">
                  <LegeStaat
                    icoon={PackagePlus}
                    titel="Nog geen taarten"
                    hint="De prijslijst is leeg. Voeg een taart toe en zet 'op de site' aan als hij publiek mag."
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ProductSheet
        product={concept}
        open={sheet.id !== null || sheet.isNieuw}
        onOpenChange={(o) => !o && sheet.sluiten()}
        onChange={setConcept}
        onOpslaan={() => concept && bewaar.mutate(concept)}
        onVerwijder={() => {
          if (!concept?.id) return;
          if (confirm(`'${concept.name}' verwijderen?`)) del.mutate(concept.id);
        }}
        bezig={bewaar.isPending}
        fout={bewaar.isError ? bewaar.error : null}
      />
    </div>
  );
}

/**
 * Velden die de server zelf bepaalt gaan niet mee terug.
 *
 * `slug` staat er bewust niet bij: die wordt server-side uit de naam afgeleid en hoort na het
 * aanmaken vast te staan. `createdAt` en `id` horen sowieso niet in een body.
 */
function ontdoeVanAfgeleide(p: Concept) {
  const { id: _id, createdAt: _c, slug: _s, ...rest } = p as Product;
  return rest;
}

/**
 * Bewerken in een sheet die van rechts inschuift, net als bij een boeking of een pakket.
 *
 * Dit scherm kon tot nu toe alleen toevoegen en verwijderen: een prijs corrigeren betekende de
 * regel weggooien en opnieuw intikken. De route kon het al lang -- `PATCH` accepteert elk veld
 * via `insertProductSchema.partial()` -- alleen had de UI er geen formulier voor.
 */
function ProductSheet({
  product,
  open,
  onOpenChange,
  onChange,
  onOpslaan,
  onVerwijder,
  bezig,
  fout,
}: {
  product: Concept | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (p: Concept) => void;
  onOpslaan: () => void;
  onVerwijder: () => void;
  bezig: boolean;
  fout: unknown;
}) {
  if (!product) return null;
  const naamLeeg = !product.name?.trim();

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={product.name?.trim() || (product.id ? "Taart bewerken" : "Nieuwe taart")}
      subtitle={product.id ? "Wijzigingen gelden meteen op je site" : "Nog niet opgeslagen"}
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          {product.id ? (
            <button
              className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs text-charcoal/50 transition hover:bg-burgundy/10 hover:text-burgundy"
              onClick={onVerwijder}
            >
              <Trash2 size={14} /> Verwijderen
            </button>
          ) : <span />}
          <div className="flex gap-3">
            <button className="btn-ghost !py-2 !px-4 text-xs" onClick={() => onOpenChange(false)}>
              Annuleren
            </button>
            <button
              className="btn-sage !py-2 !px-5 text-xs"
              disabled={naamLeeg || bezig}
              title={naamLeeg ? "Vul eerst een naam in." : undefined}
              onClick={onOpslaan}
            >
              {bezig ? "Opslaan…" : "Opslaan"}
            </button>
          </div>
        </div>
      }
    >
      <SheetSectie titel="Wat het is">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="taart-naam">Naam *</label>
            <input
              id="taart-naam"
              className="input"
              value={product.name ?? ""}
              placeholder="Basis taart"
              onChange={(e) => onChange({ ...product, name: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="taart-omschrijving">Omschrijving</label>
            <input
              id="taart-omschrijving"
              className="input"
              placeholder="12–15 personen"
              value={product.description ?? ""}
              onChange={(e) => onChange({ ...product, description: e.target.value })}
            />
            <p className="mt-1 text-xs text-charcoal/55">
              Staat op de site onder de naam. Kort houden — bijvoorbeeld voor hoeveel personen.
            </p>
          </div>
          <div>
            <label className="label" htmlFor="taart-soort">Soort</label>
            <select
              id="taart-soort"
              className="input"
              value={product.category ?? "taart_los"}
              onChange={(e) => onChange({ ...product, category: e.target.value as Product["category"] })}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{PRODUCT_CATEGORIE_LABEL[c]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="taart-volgorde">Volgorde</label>
            <input
              id="taart-volgorde"
              className="input"
              type="number"
              value={product.sortOrder ?? 0}
              onChange={(e) => onChange({ ...product, sortOrder: Number(e.target.value) })}
            />
            <p className="mt-1 text-xs text-charcoal/55">Laag getal staat bovenaan.</p>
          </div>
        </div>
      </SheetSectie>

      <SheetSectie titel="Prijs">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="taart-prijs">Prijs (€)</label>
            <input
              id="taart-prijs"
              className="input"
              type="number"
              step="0.01"
              min="0"
              value={product.basePrice ?? "0"}
              onChange={(e) => onChange({ ...product, basePrice: e.target.value })}
            />
          </div>
          <div>
            <label className="label" htmlFor="taart-eenheid">Per</label>
            <input
              id="taart-eenheid"
              className="input"
              placeholder="stuk"
              value={product.unit ?? "stuk"}
              onChange={(e) => onChange({ ...product, unit: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={product.priceIsFrom ?? false}
                onChange={(e) => onChange({ ...product, priceIsFrom: e.target.checked })}
              />
              <span className="text-sm">
                Dit is een vanaf-prijs
                <span className="mt-0.5 block text-xs text-charcoal/55">
                  Op de site komt er dan <strong>vanaf</strong> voor het bedrag. Gebruik dit voor
                  werk op maat, waarbij het ontwerp de uiteindelijke prijs bepaalt.
                </span>
              </span>
            </label>
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="taart-btw">Btw-tarief</label>
            <select
              id="taart-btw"
              className="input"
              value={product.vatRate ?? ""}
              onChange={(e) => onChange({ ...product, vatRate: e.target.value || null })}
            >
              <option value="">Nog niet ingesteld</option>
              {(Object.keys(BTW_LABEL) as BtwTarief[]).map((t) => (
                <option key={t} value={t}>{BTW_LABEL[t]}</option>
              ))}
            </select>
            {/* Geen verdeling zoals bij een pakket: een taart is één ding, en dat ding is eten
                (9%). Blijkt een product tóch samengesteld, dan hoort het een pakket te zijn. */}
            <p className="mt-1 text-xs text-charcoal/55">Taarten en desserts vallen onder 9%.</p>
          </div>
        </div>
      </SheetSectie>

      <SheetSectie titel="Waar het staat">
        <label className="flex cursor-pointer items-start gap-2.5">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={product.publicVisible ?? false}
            onChange={(e) => onChange({ ...product, publicVisible: e.target.checked })}
          />
          <span className="text-sm">
            Op de site
            <span className="mt-0.5 block text-xs text-charcoal/55">
              Verschijnt in het taartenblok op <strong>/aanbod</strong>. Staat dit uit, dan
              gebruik je de regel alleen intern op offertes.
            </span>
          </span>
        </label>
      </SheetSectie>

      {fout != null && (
        <div className="rounded-lg bg-burgundy/10 px-4 py-3 text-sm text-burgundy">
          Opslaan mislukt: {fout instanceof Error ? fout.message : "onbekende fout"}
        </div>
      )}
    </Sheet>
  );
}
