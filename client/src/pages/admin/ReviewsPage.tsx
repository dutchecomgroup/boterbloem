import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "../../lib/api";
import type { Review } from "@shared/schema";
import { Plus, Trash2, Star, X, MessageSquareQuote } from "lucide-react";
import { PageKop } from "../../components/admin/ui/PageKop";
import { LegeStaat } from "../../components/admin/ui/LegeStaat";
import { Badge } from "../../components/admin/ui/Badge";

const LEEG: Partial<Review> = {
  authorName: "", eventType: "", body: "", rating: 5,
  occurredOn: null, published: false, featured: false, source: "handmatig",
};

export default function ReviewsPage() {
  const qc = useQueryClient();
  const [bewerk, setBewerk] = useState<Partial<Review> | null>(null);
  const [fout, setFout] = useState<string | null>(null);

  const { data: reviews } = useQuery({
    queryKey: ["admin", "reviews"],
    queryFn: () => api.get<Review[]>("/api/admin/reviews"),
  });

  const ververs = () => {
    qc.invalidateQueries({ queryKey: ["admin", "reviews"] });
    qc.invalidateQueries({ queryKey: ["public", "reviews"] });
  };

  const opslaan = useMutation({
    mutationFn: (r: Partial<Review>) => {
      const body = {
        authorName: r.authorName, eventType: r.eventType || null, body: r.body,
        rating: r.rating ?? null, occurredOn: r.occurredOn || null,
        published: r.published ?? false, featured: r.featured ?? false,
        source: r.source ?? "handmatig", sortOrder: r.sortOrder ?? (reviews?.length ?? 0),
      };
      return r.id ? api.patch(`/api/admin/reviews/${r.id}`, body) : api.post("/api/admin/reviews", body);
    },
    onSuccess: () => { ververs(); setBewerk(null); },
    onError: (e: Error) => setFout(e.message),
  });

  const schakel = useMutation({
    mutationFn: ({ id, ...rest }: { id: number } & Record<string, unknown>) =>
      api.patch(`/api/admin/reviews/${id}`, rest),
    onSuccess: ververs,
    onError: (e: Error) => setFout(e.message),
  });

  const verwijderen = useMutation({
    mutationFn: (id: number) => api.delete(`/api/admin/reviews/${id}`),
    onSuccess: ververs,
  });

  const gepubliceerd = reviews?.filter((r) => r.published).length ?? 0;

  return (
    <div>
      <PageKop
        titel="Reviews"
        icoon={MessageSquareQuote}
        onderschrift={
          <>
            Reacties van klanten. Een review staat na het aanmaken op <strong>niet
            gepubliceerd</strong> — zo kun je hem eerst teruglezen.
          </>
        }
        actie={
          <button className="btn-gold !py-2 !px-5 text-xs" onClick={() => setBewerk({ ...LEEG })}>
            <Plus size={14} /> Review toevoegen
          </button>
        }
      />
      <p className="-mt-4 mb-6 max-w-2xl text-xs text-charcoal/50">
        Vraag even toestemming voordat je iemands naam op de site zet, ook bij een reactie uit
        WhatsApp of Instagram.
      </p>

      {gepubliceerd === 0 && (reviews?.length ?? 0) > 0 && (
        <div className="card mb-4 border-l-4 border-l-butter bg-butter/20 text-sm text-charcoal/80">
          Er is nog niets gepubliceerd, dus het reviewblok staat niet op de site. Dat is
          bewust: een leeg reviewblok is slechter dan geen reviewblok.
        </div>
      )}

      {fout && (
        <div className="card mb-4 border-burgundy/30 text-burgundy text-sm flex items-start justify-between gap-4">
          <span>{fout}</span><button onClick={() => setFout(null)}><X size={16} /></button>
        </div>
      )}

      {bewerk && (
        <div className="card mb-6 border-gold/30">
          <h2 className="text-xl mb-4">{bewerk.id ? "Review bewerken" : "Nieuwe review"}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Naam *</label>
              <input className="input" placeholder="Lisa" value={bewerk.authorName ?? ""}
                onChange={(e) => setBewerk({ ...bewerk, authorName: e.target.value })} />
            </div>
            <div>
              <label className="label">Gelegenheid</label>
              <input className="input" placeholder="Bruiloft, juni 2026" value={bewerk.eventType ?? ""}
                onChange={(e) => setBewerk({ ...bewerk, eventType: e.target.value })} />
            </div>
            <div>
              <label className="label">Cijfer</label>
              <select className="input" value={bewerk.rating ?? ""}
                onChange={(e) => setBewerk({ ...bewerk, rating: e.target.value ? Number(e.target.value) : null })}>
                <option value="">— geen cijfer —</option>
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} van 5</option>)}
              </select>
            </div>
            <div>
              <label className="label">Datum van het feest</label>
              <input className="input" type="date" value={bewerk.occurredOn ?? ""}
                onChange={(e) => setBewerk({ ...bewerk, occurredOn: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">De review *</label>
              <textarea className="input min-h-[120px]" value={bewerk.body ?? ""}
                onChange={(e) => setBewerk({ ...bewerk, body: e.target.value })} />
              <p className="text-xs text-charcoal/40 mt-1">Twee tot vier zinnen leest het prettigst.</p>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button className="btn-ghost !py-2 !px-4 text-xs" onClick={() => setBewerk(null)}>Annuleren</button>
            <button className="btn-gold !py-2 !px-5 text-xs"
              disabled={!bewerk.authorName?.trim() || (bewerk.body ?? "").trim().length < 10 || opslaan.isPending}
              onClick={() => opslaan.mutate(bewerk)}>
              {opslaan.isPending ? "Opslaan…" : "Opslaan"}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {reviews?.map((r) => (
          <div key={r.id} className={`card flex flex-wrap gap-4 border-l-4 ${r.published ? "border-l-gold" : "border-l-charcoal/15"}`}>
            <div className="flex-1 min-w-[240px]">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-medium">{r.authorName}</span>
                {r.eventType && <span className="text-xs text-charcoal/50">{r.eventType}</span>}
                {r.rating && (
                  <span className="inline-flex text-gold">
                    {Array.from({ length: r.rating }, (_, i) => <Star key={i} size={12} fill="currentColor" />)}
                  </span>
                )}
                {!r.published && <Badge toon="butter">concept</Badge>}
                {r.featured && <Badge toon="goud">homepage</Badge>}
              </div>
              <p className="text-sm text-charcoal/70 mt-2 leading-relaxed">{r.body}</p>
            </div>
            <div className="flex flex-col gap-2 items-end shrink-0">
              <label className="flex items-center gap-2 text-xs text-charcoal/60">
                <input type="checkbox" checked={r.published}
                  onChange={(e) => schakel.mutate({ id: r.id, published: e.target.checked })} />
                Gepubliceerd
              </label>
              <label className="flex items-center gap-2 text-xs text-charcoal/60">
                <input type="checkbox" checked={r.featured}
                  onChange={(e) => schakel.mutate({ id: r.id, featured: e.target.checked })} />
                Op de homepage
              </label>
              <div className="flex gap-2 mt-1">
                <button className="btn-outline !py-1.5 !px-3 text-xs" onClick={() => setBewerk(r)}>Bewerken</button>
                <button className="rounded p-1.5 text-charcoal/30 transition hover:bg-burgundy/10 hover:text-burgundy"
                  onClick={() => confirm(`Review van ${r.authorName} verwijderen?`) && verwijderen.mutate(r.id)}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {reviews?.length === 0 && (
          <LegeStaat
            icoon={MessageSquareQuote}
            titel="Nog geen reviews"
            hint="Tot die tijd staat er geen reviewblok op de site."
          />
        )}
      </div>
    </div>
  );
}
