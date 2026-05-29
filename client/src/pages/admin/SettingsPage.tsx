import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import type { ContactSettings, HeroSettings, AboutSettings } from "@shared/schema";

interface AllSettings {
  contact?: ContactSettings;
  hero?: HeroSettings;
  about?: AboutSettings;
}

export default function SettingsPage() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => api.get<AllSettings>("/api/admin/settings"),
  });

  const [contact, setContact] = useState<ContactSettings>({ openingHours: [] });
  const [hero, setHero] = useState<HeroSettings>({ title: "Atelier Boterbloem", tagline: "", ctaLabel: "", ctaHref: "/contact" });
  const [about, setAbout] = useState<AboutSettings>({ heading: "", body: "" });

  useEffect(() => {
    if (data?.contact) setContact({ ...data.contact, openingHours: data.contact.openingHours ?? [] });
    if (data?.hero) setHero(data.hero);
    if (data?.about) setAbout(data.about);
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      await Promise.all([
        api.put("/api/admin/settings/contact", contact),
        api.put("/api/admin/settings/hero", hero),
        api.put("/api/admin/settings/about", about),
      ]);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "settings"] });
      qc.invalidateQueries({ queryKey: ["public", "settings"] });
    },
  });

  return (
    <div>
      <h1 className="text-3xl mb-2">Instellingen</h1>
      <p className="text-charcoal/60 text-sm mb-8">Site-content en contactgegevens.</p>

      <div className="space-y-6">
        <section className="card">
          <h2 className="text-xl mb-4">Contactgegevens</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="label">E-mail</label><input className="input" type="email" value={contact.email ?? ""} onChange={(e) => setContact({ ...contact, email: e.target.value })} /></div>
            <div><label className="label">Telefoon</label><input className="input" value={contact.phone ?? ""} onChange={(e) => setContact({ ...contact, phone: e.target.value })} /></div>
            <div><label className="label">WhatsApp</label><input className="input" value={contact.whatsapp ?? ""} onChange={(e) => setContact({ ...contact, whatsapp: e.target.value })} /></div>
            <div><label className="label">Instagram URL</label><input className="input" value={contact.instagram ?? ""} onChange={(e) => setContact({ ...contact, instagram: e.target.value })} /></div>
            <div><label className="label">Adres</label><input className="input" value={contact.address ?? ""} onChange={(e) => setContact({ ...contact, address: e.target.value })} /></div>
            <div><label className="label">Postcode</label><input className="input" value={contact.postcode ?? ""} onChange={(e) => setContact({ ...contact, postcode: e.target.value })} /></div>
            <div><label className="label">Plaats</label><input className="input" value={contact.city ?? ""} onChange={(e) => setContact({ ...contact, city: e.target.value })} /></div>
          </div>
        </section>

        <section className="card">
          <h2 className="text-xl mb-4">Homepage hero</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="label">Titel</label><input className="input" value={hero.title ?? ""} onChange={(e) => setHero({ ...hero, title: e.target.value })} /></div>
            <div><label className="label">CTA tekst</label><input className="input" value={hero.ctaLabel ?? ""} onChange={(e) => setHero({ ...hero, ctaLabel: e.target.value })} /></div>
            <div className="sm:col-span-2"><label className="label">Tagline</label><input className="input" value={hero.tagline ?? ""} onChange={(e) => setHero({ ...hero, tagline: e.target.value })} /></div>
            <div><label className="label">CTA link</label><input className="input" value={hero.ctaHref ?? ""} onChange={(e) => setHero({ ...hero, ctaHref: e.target.value })} /></div>
            <div><label className="label">Hero-afbeelding bestandsnaam (galerij)</label><input className="input" value={hero.imageFilename ?? ""} onChange={(e) => setHero({ ...hero, imageFilename: e.target.value })} placeholder="bv. uuid.webp" /></div>
          </div>
        </section>

        <section className="card">
          <h2 className="text-xl mb-4">Over-pagina</h2>
          <div className="space-y-4">
            <div><label className="label">Titel</label><input className="input" value={about.heading ?? ""} onChange={(e) => setAbout({ ...about, heading: e.target.value })} /></div>
            <div><label className="label">Tekst</label><textarea className="input min-h-[200px]" value={about.body ?? ""} onChange={(e) => setAbout({ ...about, body: e.target.value })} /></div>
            <div><label className="label">Foto bestandsnaam</label><input className="input" value={about.imageFilename ?? ""} onChange={(e) => setAbout({ ...about, imageFilename: e.target.value })} /></div>
          </div>
        </section>

        <div className="flex justify-end gap-3 sticky bottom-6">
          <button onClick={() => save.mutate()} disabled={save.isPending} className="btn-gold">
            {save.isPending ? "Opslaan…" : "Alles opslaan"}
          </button>
        </div>
        {save.isSuccess && <div className="text-sm text-emerald-700 text-right">Opgeslagen.</div>}
      </div>
    </div>
  );
}
