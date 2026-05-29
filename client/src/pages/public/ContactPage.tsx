import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api, ApiError } from "../../lib/api";
import { usePublicSettings } from "../../hooks/usePublicSettings";
import { Instagram, Mail, Phone, MapPin } from "lucide-react";

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

export default function ContactPage() {
  const { data: settings } = usePublicSettings();
  const contact = settings?.contact;
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setError(null);
    try {
      await api.post("/api/public/contact", {
        ...values,
        eventDate: values.eventDate || undefined,
      });
      setSent(true);
      form.reset();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Verzenden mislukt");
    }
  }

  return (
    <section className="container-tight py-20 grid lg:grid-cols-2 gap-16">
      <div>
        <div className="text-xs uppercase tracking-[0.3em] text-gold-dark mb-3">Contact</div>
        <h1 className="text-5xl md:text-6xl mb-6">Vertel ons jouw idee</h1>
        <p className="text-charcoal/70 leading-relaxed mb-10">
          Vul het formulier in met zoveel mogelijk details — datum, gelegenheid, aantal personen — en we komen zo snel mogelijk bij je terug met een voorstel.
        </p>

        <ul className="space-y-4 text-sm">
          {contact?.email && (
            <li className="flex items-start gap-3">
              <Mail size={18} className="text-gold mt-0.5" />
              <a href={`mailto:${contact.email}`} className="hover:text-gold">{contact.email}</a>
            </li>
          )}
          {contact?.phone && (
            <li className="flex items-start gap-3">
              <Phone size={18} className="text-gold mt-0.5" />
              <a href={`tel:${contact.phone}`} className="hover:text-gold">{contact.phone}</a>
            </li>
          )}
          {(contact?.address || contact?.city) && (
            <li className="flex items-start gap-3">
              <MapPin size={18} className="text-gold mt-0.5" />
              <span>{[contact.address, contact.postcode, contact.city].filter(Boolean).join(", ")}</span>
            </li>
          )}
          {contact?.instagram && (
            <li className="flex items-start gap-3">
              <Instagram size={18} className="text-gold mt-0.5" />
              <a href={contact.instagram} target="_blank" rel="noreferrer" className="hover:text-gold">
                @atelierboterbloem
              </a>
            </li>
          )}
        </ul>
      </div>

      <div>
        {sent ? (
          <div className="card bg-gold/10 border-gold/30">
            <h2 className="text-2xl mb-2">Bedankt!</h2>
            <p className="text-charcoal/70">
              Je bericht is verstuurd. We nemen zo snel mogelijk contact met je op.
            </p>
            <button onClick={() => setSent(false)} className="btn-outline mt-6">
              Nog een bericht sturen
            </button>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="card space-y-5">
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
              <div>
                <label className="label">Telefoon</label>
                <input className="input" {...form.register("phone")} />
              </div>
              <div>
                <label className="label">Datum gelegenheid</label>
                <input className="input" type="date" {...form.register("eventDate")} />
              </div>
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
              <div>
                <label className="label">Aantal personen</label>
                <input className="input" type="number" min="1" {...form.register("persons")} />
              </div>
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
    </section>
  );
}
