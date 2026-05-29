import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { api } from "../../lib/api";
import type { GalleryItem, GalleryCategory } from "@shared/schema";
import { Upload, Trash2, Star } from "lucide-react";

export default function GalleryAdminPage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadCategory, setUploadCategory] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);

  const { data: items } = useQuery({
    queryKey: ["admin", "gallery"],
    queryFn: () => api.get<GalleryItem[]>("/api/admin/gallery"),
  });
  const { data: categories } = useQuery({
    queryKey: ["admin", "gallery", "categories"],
    queryFn: () => api.get<GalleryCategory[]>("/api/admin/gallery/categories"),
  });

  const del = useMutation({
    mutationFn: (id: number) => api.delete(`/api/admin/gallery/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "gallery"] }),
  });

  const toggleFeatured = useMutation({
    mutationFn: ({ id, featured }: { id: number; featured: boolean }) =>
      api.patch(`/api/admin/gallery/${id}`, { featured }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "gallery"] }),
  });

  const setCategory = useMutation({
    mutationFn: ({ id, categoryId }: { id: number; categoryId: number | null }) =>
      api.patch(`/api/admin/gallery/${id}`, { categoryId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "gallery"] }),
  });

  async function onUpload(files: FileList | null) {
    if (!files || !files.length) return;
    setUploading(true);
    setProgress(`0 / ${files.length}`);
    try {
      const form = new FormData();
      Array.from(files).forEach((f) => form.append("files", f));
      if (uploadCategory) form.append("categoryId", uploadCategory);
      await api.upload("/api/admin/gallery", form);
      setProgress(null);
      qc.invalidateQueries({ queryKey: ["admin", "gallery"] });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div>
      <h1 className="text-3xl mb-2">Galerij</h1>
      <p className="text-charcoal/60 text-sm mb-8">Upload, sorteer en beheer je showcase-foto's.</p>

      <div className="card mb-6">
        <div className="grid sm:grid-cols-[1fr_auto_auto] gap-4 items-end">
          <div>
            <label className="label">Upload naar categorie</label>
            <select className="input" value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value)}>
              <option value="">— geen categorie —</option>
              {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => onUpload(e.target.files)}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="btn-gold"
          >
            <Upload size={16} /> {uploading ? "Bezig…" : "Foto's kiezen"}
          </button>
        </div>
        {progress && <div className="mt-3 text-sm text-charcoal/60">{progress}</div>}
      </div>

      {items?.length ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((it) => (
            <div key={it.id} className="bg-white rounded-lg overflow-hidden shadow-sm border border-charcoal/5">
              <div className="aspect-square relative group">
                <img
                  src={`/uploads/gallery/${it.filename}`}
                  alt={it.altText ?? ""}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-charcoal/0 group-hover:bg-charcoal/40 transition flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => toggleFeatured.mutate({ id: it.id, featured: !it.featured })}
                    className={`p-2 rounded-full ${it.featured ? "bg-gold text-cream" : "bg-cream text-charcoal"}`}
                    title="Uitgelicht"
                  >
                    <Star size={16} />
                  </button>
                  <button
                    onClick={() => confirm("Verwijderen?") && del.mutate(it.id)}
                    className="p-2 rounded-full bg-burgundy text-cream"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                {it.featured && (
                  <div className="absolute top-2 left-2 bg-gold text-cream text-xs px-2 py-0.5 rounded">★</div>
                )}
              </div>
              <div className="p-2">
                <select
                  className="input !py-1 !px-2 text-xs"
                  value={it.categoryId ?? ""}
                  onChange={(e) => setCategory.mutate({ id: it.id, categoryId: e.target.value ? Number(e.target.value) : null })}
                >
                  <option value="">— geen —</option>
                  {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center text-charcoal/40 py-16">Nog geen foto's geüpload.</div>
      )}
    </div>
  );
}
