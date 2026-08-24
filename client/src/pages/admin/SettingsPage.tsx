import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Copy, Check, RefreshCw } from "lucide-react";
import { api } from "../../lib/api";
import type { ContactSettings, HeroSettings, AboutSettings, LevertijdenSettings } from "@shared/schema";

interface AllSettings {
  contact?: ContactSettings;
  hero?: HeroSettings;
  about?: AboutSettings;
  levertijden?: LevertijdenSettings;
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
  const [levertijden, setLevertijden] = useState<LevertijdenSettings>({
    standaardDagen: 10, taartenDagen: 5, tekst: "", agendaFeedToken: "",
  });
  const [gekopieerd, setGekopieerd] = useState(false);

  useEffect(() => {
    if (data?.contact) setContact({ ...data.contact, openingHours: data.contact.openingHours ?? [] });
    if (data?.hero) setHero(data.hero);
    if (data?.about) setAbout(data.about);
    if (data?.levertijden) setLevertijden(data.levertijden);
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      await Promise.all([
        api.put("/api/admin/settings/contact", contact),
        api.put("/api/admin/settings/hero", hero),
        api.put("/api/admin/settings/about", about),
        api.put("/api/admin/settings/levertijden", levertijden),
      ]);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "settings"] });
      qc.invalidateQueries({ queryKey: ["public", "settings"] });
    },
  });

  const feedUrl = levertijden.agendaFeedToken
    ? `${window.location.origin}/api/agenda.ics?token=${levertijden.agendaFeedToken}`
    : "";

  /** Nieuw token = de oude feed-URL werkt niet meer. Bewust een aparte handeling. */
  function vernieuwToken() {
    if (!confirm("Nieuw token maken? De agenda's die nu op de oude link staan abonneren, stoppen met bijwerken.")) return;
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    const token = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    setLevertijden({ ...levertijden, agendaFeedToken: token });
  }

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

        <section className="card">
          <h2 className="text-xl mb-1">Levertijden</h2>
          <p className="text-xs text-charcoal/50 mb-4">
            Deze tekst staat op je aanbod- en contactpagina. Kiest iemand in het formulier een
            datum die korter dan het aantal dagen hieronder is, dan krijgt die een vriendelijke
            waarschuwing — geen blokkade.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Standaard aantal dagen vooraf</label>
              <input className="input" type="number" min="0" value={levertijden.standaardDagen}
                onChange={(e) => setLevertijden({ ...levertijden, standaardDagen: Number(e.target.value) })} />
            </div>
            <div>
              <label className="label">Voor taarten (informatief)</label>
              <input className="input" type="number" min="0" value={levertijden.taartenDagen}
                onChange={(e) => setLevertijden({ ...levertijden, taartenDagen: Number(e.target.value) })} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Tekst op de site</label>
              <textarea className="input min-h-[80px]" value={levertijden.tekst}
                onChange={(e) => setLevertijden({ ...levertijden, tekst: e.target.value })} />
            </div>
          </div>
        </section>

        <section className="card">
          <h2 className="text-xl mb-1">Agenda op je telefoon</h2>
          <p className="text-xs text-charcoal/50 mb-4">
            Abonneer je op deze link in Google Agenda (<em>Andere agenda's → Via URL</em>) of op
            je iPhone (<em>Agenda's → Account toevoegen → Andere → Agenda-abonnement</em>). Je
            boekingen verschijnen dan vanzelf in je eigen agenda.
          </p>

          <div className="flex flex-wrap gap-2 items-center">
            <input className="input font-mono text-xs flex-1 min-w-[240px]" readOnly value={feedUrl}
              onFocus={(e) => e.currentTarget.select()} />
            <button className="btn-outline !py-2 !px-4 text-xs"
              onClick={() => {
                navigator.clipboard.writeText(feedUrl);
                setGekopieerd(true);
                setTimeout(() => setGekopieerd(false), 2000);
              }}>
              {gekopieerd ? <><Check size={14} /> Gekopieerd</> : <><Copy size={14} /> Kopiëren</>}
            </button>
            <button className="btn-ghost !py-2 !px-4 text-xs" onClick={vernieuwToken}>
              <RefreshCw size={14} /> Nieuwe link
            </button>
          </div>

          <p className="mt-3 text-xs text-burgundy/80">
            Deel deze link met niemand: wie hem heeft, kan al je boekingen met klantnamen zien.
            Per ongeluk gedeeld? Maak een nieuwe link en abonneer je opnieuw.
          </p>
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
