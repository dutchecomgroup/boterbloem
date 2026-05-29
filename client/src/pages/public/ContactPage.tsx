import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api, ApiError } from "../../lib/api";
import { usePublicSettings } from "../../hooks/usePublicSettings";
import { Instagram, Mail, Phone, MapPin } from "lucide-react";
import { BotanicalPattern } from "../../components/ornaments/BotanicalPattern";
import { BotanicalCorner } from "../../components/ornaments/BotanicalCorner";
import { GoldDivider } from "../../components/ornaments/GoldDivider";
import { FloralFrame } from "../../components/ornaments/FloralFrame";
import { demoImageForSlug } from "../../lib/demoGallery";

const schema = z.object({
  name: z.string().min(2, "Vul je naam in"),
  email: z.string().email("Geldig e-mailadres vereist"),
  phone: z.string().optional(),
  eventDate: z.string().optional(),
  eventType: z.string().optional(),
  persons: z.coerce.number().int().positive().optional().or(z.literal("")).transform((v) => (v === "" ? undefined : v)),
  message: z.string().min(5, "Schrijf een kort bericht"),
});

type FormValues = z.infer<typeof schema>;

const STEPS = [
  { n: "01", title: "Aanvraag", body: "Vertel ons over jouw moment en idee via het formulier." },
  { n: "02", title: "Voorstel", body: "Binnen enkele dagen ontvang je een persoonlijk voorstel met smaakopties." },
  { n: "03", title: "Ontwerp", body: "Samen verfijnen we het ontwerp tot het volledig past." },
  { n: "04", title: "De dag zelf", body: "Wij zorgen voor levering of opbouw — jij geniet." },
];

export default function ContactPage() {
  const { data: settings } = usePublicSettings();
  const contact = settings?.contact;
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<FormValues>({ resolver: zodResolver(schema) });
  const heroImg = demoImageForSlug("party-setups");

  async function onSubmit(values: FormValues) {
    setError(null);
    try {
      await api.post("/api/public/contact", { ...values, eventDate: values.eventDate || undefined });
      setSent(true);
      form.reset();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Verzenden mislukt");
    }
  }

  return (
    <>
      <section className="relative bg-section-blush overflow-hidden py-20">
        <BotanicalPattern opacity={0.06} />
        <FloralFrame className="absolute -top-12 -right-12" size={340} color="text-gold/20" />
        <FloralFrame className="absolute -bottom-12 -left-12 rotate-180" size={260} color="text-blush" />

        <div className="container-tight relative grid lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-16">
          <div>
            <div className="tag mb-3">Contact</div>
            <h1 className="text-5xl md:text-6xl">Vertel ons jouw idee</h1>
            <div className="mt-6 mb-6"><GoldDivider className="!mx-0 !max-w-[180px]" /></div>
            <p className="text-charcoal/70 leading-relaxed mb-10">
              Vul het formulier in met zoveel mogelijk details — datum, gelegenheid, aantal personen — en we komen zo snel mogelijk bij je terug met een voorstel.
            </p>

            <ul className="space-y-4 text-sm mb-10">
              {contact?.email && (
                <li className="flex items-start gap-3"><Mail size={18} className="text-gold mt-0.5" /><a href={`mailto:${contact.email}`} className="hover:text-gold-dark">{contact.email}</a></li>
              )}
              {contact?.phone && (
                <li className="flex items-start gap-3"><Phone size={18} className="text-gold mt-0.5" /><a href={`tel:${contact.phone}`} className="hover:text-gold-dark">{contact.phone}</a></li>
              )}
              {(contact?.address || contact?.city) && (
                <li className="flex items-start gap-3"><MapPin size={18} className="text-gold mt-0.5" /><span>{[contact.address, contact.postcode, contact.city].filter(Boolean).join(", ")}</span></li>
              )}
              {contact?.instagram && (
                <li className="flex items-start gap-3"><Instagram size={18} className="text-gold mt-0.5" /><a href={contact.instagram} target="_blank" rel="noreferrer" className="hover:text-gold-dark">@atelierboterbloem</a></li>
              )}
            </ul>

            {heroImg && (
              <div className="relative aspect-[5/4] rounded-2xl overflow-hidden shadow-xl ring-1 ring-gold/20 hidden lg:block">
                <img src={heroImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="pointer-events-none absolute inset-3 border border-cream/30 rounded-xl" />
              </div>
            )}
          </div>

          <div>
            {sent ? (
              <div className="card hairline-gold bg-cream relative">
                <BotanicalCorner position="tl" size={80} color="text-gold/40" />
                <BotanicalCorner position="br" size={80} color="text-gold/40" />
                <div className="text-center py-10">
                  <div className="script-accent text-5xl mb-4">Bedankt!</div>
                  <p className="text-charcoal/70 max-w-md mx-auto">
                    Je bericht is verstuurd. We nemen zo snel mogelijk contact met je op.
                  </p>
                  <button onClick={() => setSent(false)} className="btn-outline mt-8">
                    Nog een bericht sturen
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={form.handleSubmit(onSubmit)} className="card hairline-gold space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Naam *</label>
                    <input className="input" {...form.register("name")} />
                    {form.formState.errors.name && <p className="text-xs text-burgundy mt-1">{form.formState.errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="label">E-mail *</label>
                    <input className="input" type="email" {...form.register("email")} />
                    {form.formState.errors.email && <p className="text-xs text-burgundy mt-1">{form.formState.errors.email.message}</p>}
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div><label className="label">Telefoon</label><input className="input" {...form.register("phone")} /></div>
                  <div><label className="label">Datum gelegenheid</label><input className="input" type="date" {...form.register("eventDate")} /></div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Type gelegenheid</label>
                    <select className="input" {...form.register("eventType")}>
                      <option value="">— Kies —</option>
                      <option>Bruiloft</option>
                      <option>Verjaardag</option>
                      <option>Babyshower</option>
                      <option>Doop</option>
                      <option>Bedrijfsevent</option>
                      <option>Anders</option>
                    </select>
                  </div>
                  <div><label className="label">Aantal personen</label><input className="input" type="number" min="1" {...form.register("persons")} /></div>
                </div>
                <div>
                  <label className="label">Bericht *</label>
                  <textarea className="input min-h-[140px]" {...form.register("message")} />
                  {form.formState.errors.message && <p className="text-xs text-burgundy mt-1">{form.formState.errors.message.message}</p>}
                </div>
                {error && <div className="text-sm text-burgundy">{error}</div>}
                <button type="submit" disabled={form.formState.isSubmitting} className="btn-gold w-full">
                  {form.formState.isSubmitting ? "Versturen…" : "Bericht versturen"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Steps section */}
      <section className="relative bg-section-butter py-20 overflow-hidden">
        <BotanicalPattern opacity={0.05} />
        <div className="container-tight relative">
          <div className="text-center mb-14">
            <div className="tag mb-3">Hoe het werkt</div>
            <h2 className="text-4xl md:text-5xl">Van idee tot taart</h2>
            <div className="mt-6"><GoldDivider /></div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s) => (
              <div key={s.n} className="card hairline-gold bg-cream relative">
                <div className="script-accent text-5xl leading-none mb-3">{s.n}</div>
                <h3 className="text-xl mb-2">{s.title}</h3>
                <p className="text-sm text-charcoal/70 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
