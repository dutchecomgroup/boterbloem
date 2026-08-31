import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { useSearch } from "wouter";
import { api, ApiError } from "../../lib/api";
import { usePublicSettings } from "../../hooks/usePublicSettings";
import { Instagram, Mail, Phone, MapPin, Info, MessageCircle } from "lucide-react";
import { whatsappLink } from "../../lib/utils";
import type { Package } from "@shared/schema";
import { BotanicalPattern } from "../../components/ornaments/BotanicalPattern";
import { BotanicalCorner } from "../../components/ornaments/BotanicalCorner";
import { SierDivider } from "../../components/ornaments/SierDivider";
import { FloralFrame } from "../../components/ornaments/FloralFrame";
import { imageSrc } from "../../lib/images";
import type { GalerijAntwoord } from "../../lib/galerij";

const schema = z.object({
  name: z.string().min(2, "Vul je naam in"),
  email: z.string().email("Geldig e-mailadres vereist"),
  phone: z.string().optional(),
  eventDate: z.string().optional(),
  // De gelegenheid als keuze uit de echte categorieën. `eventType` blijft bestaan als vrij
  // veld voor "anders, namelijk" en voor aanvragen van vóór deze wijziging.
  categoryId: z.coerce.number().int().positive().optional().or(z.literal("")).transform((v) => (v === "" ? undefined : v)),
  eventType: z.string().optional(),
  packageId: z.coerce.number().int().positive().optional().or(z.literal("")).transform((v) => (v === "" ? undefined : v)),
  persons: z.coerce.number().int().positive().optional().or(z.literal("")).transform((v) => (v === "" ? undefined : v)),
  message: z.string().min(5, "Schrijf een kort bericht"),
  // Honeypot — hoort altijd leeg te zijn. Zie het verborgen veld in het formulier.
  website: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;



const STEPS = [
  { n: "01", title: "Aanvraag", body: "Vertel ons over jouw moment en idee via het formulier." },
  { n: "02", title: "Voorstel", body: "Binnen enkele dagen ontvang je een persoonlijk voorstel met smaakopties." },
  { n: "03", title: "Ontwerp", body: "Samen verfijnen we het ontwerp tot het volledig past." },
  { n: "04", title: "De dag zelf", body: "Wij zorgen voor levering of opbouw, jij geniet." },
];

export default function ContactPage() {
  const { data: settings } = usePublicSettings();
  const contact = settings?.contact;
  const levertijden = (settings as { levertijden?: { standaardDagen?: number; tekst?: string } } | undefined)?.levertijden;
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: pakketten } = useQuery({
    queryKey: ["public", "packages"],
    queryFn: () => api.get<Package[]>("/api/public/packages"),
  });
  const { data: gallery } = useQuery({
    queryKey: ["public", "gallery"],
    queryFn: () => api.get<GalerijAntwoord>("/api/public/gallery"),
  });
  const gelegenheden = gallery?.categories ?? [];

  // Een uitgelichte foto naast het formulier, of de eerste die er is. Hier stond tot 27-08 een
  // vaste stockfoto; nu komt hij uit haar eigen galerij, en is er geen galerij dan staat er
  // niets in plaats van andermans werk.
  const heroImg = useMemo(() => {
    const items = gallery?.items ?? [];
    const keuze = items.find((i) => i.featured) ?? items[0];
    return keuze ? imageSrc(keuze) : null;
  }, [gallery]);

  // ?pakket=<slug> vanaf een pakketkaart op /aanbod. Zo komt de aanvraag binnen met de
  // context waar de bezoeker net naar keek. Onbekende slug = gewoon niets voorselecteren.
  const zoek = useSearch();
  const voorgeselecteerd = useMemo(() => {
    const slug = new URLSearchParams(zoek).get("pakket");
    return slug ? pakketten?.find((p) => p.slug === slug)?.id : undefined;
  }, [zoek, pakketten]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: voorgeselecteerd ? ({ packageId: voorgeselecteerd } as Partial<FormValues> as FormValues) : undefined,
  });

  const gekozenDatum = form.watch("eventDate");
  const drempel = levertijden?.standaardDagen ?? 10;
  const teKrap = useMemo(() => {
    if (!gekozenDatum) return false;
    const dagen = (new Date(gekozenDatum + "T12:00:00").getTime() - Date.now()) / 86_400_000;
    return dagen >= 0 && dagen < drempel;
  }, [gekozenDatum, drempel]);

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
      <section className="relative bg-section-sand overflow-hidden section-y">
        <BotanicalPattern opacity={0.06} />
        <FloralFrame className="absolute -top-8 -right-8 md:-top-12 md:-right-12 w-32 sm:w-56 md:w-80 h-32 sm:h-56 md:h-80" color="text-sage/20" />
        <FloralFrame className="absolute -bottom-8 -left-8 md:-bottom-12 md:-left-12 rotate-180 w-24 sm:w-40 md:w-64 h-24 sm:h-40 md:h-64" color="text-blush" />

        <div className="container-tight relative grid lg:grid-cols-[1fr_1.2fr] gap-8 sm:gap-12 lg:gap-16">
          <div>
            <div className="tag mb-3">Contact</div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl">Vertel ons jouw idee</h1>
            <div className="mt-4 mb-4 sm:mt-6 sm:mb-6"><SierDivider className="!mx-0 !max-w-[180px]" /></div>
            <p className="text-charcoal/70 leading-relaxed mb-8 sm:mb-10 text-sm sm:text-base">
              Vul het formulier in met zoveel mogelijk details: datum, gelegenheid en aantal personen. Dan komen we zo snel mogelijk bij je terug met een voorstel.
            </p>

            {/* Op mobiel staat de foto hier, boven de contactgegevens: hij stond alleen in de
                `lg`-variant onderaan de kolom, en daardoor opende de pagina op een telefoon met
                een kop, een lap tekst en een formulier — zonder één beeld. */}
            {heroImg && (
              <div className="relative mb-8 aspect-[16/10] overflow-hidden rounded-2xl shadow-xl ring-1 ring-sage/20 lg:hidden">
                <img src={heroImg} alt="" className="absolute inset-0 h-full w-full object-cover" />
                <div className="pointer-events-none absolute inset-3 rounded-xl border border-linen/30" />
              </div>
            )}

            <ul className="space-y-4 text-sm mb-8 sm:mb-10">
              {contact?.email && (
                <li className="flex items-start gap-3"><Mail size={18} className="text-sage mt-0.5" /><a href={`mailto:${contact.email}`} className="hover:text-sage-dark">{contact.email}</a></li>
              )}
              {contact?.phone && (
                <li className="flex items-start gap-3"><Phone size={18} className="text-sage mt-0.5" /><a href={`tel:${contact.phone}`} className="hover:text-sage-dark">{contact.phone}</a></li>
              )}
              {/* Het WhatsApp-nummer stond wel in de instellingen maar werd nergens getoond,
                  terwijl dat juist het kanaal is waar dit soort aanvragen binnenkomt. */}
              {whatsappLink(contact?.whatsapp) && (
                <li className="flex items-start gap-3">
                  <MessageCircle size={18} className="text-sage mt-0.5" />
                  <a href={whatsappLink(contact?.whatsapp)!} target="_blank" rel="noreferrer" className="hover:text-sage-dark">
                    Stuur een WhatsApp
                  </a>
                </li>
              )}
              {(contact?.address || contact?.city) && (
                <li className="flex items-start gap-3"><MapPin size={18} className="text-sage mt-0.5" /><span>{[contact.address, contact.postcode, contact.city].filter(Boolean).join(", ")}</span></li>
              )}
              {contact?.instagram && (
                <li className="flex items-start gap-3"><Instagram size={18} className="text-sage mt-0.5" /><a href={contact.instagram} target="_blank" rel="noreferrer" className="hover:text-sage-dark">@atelierboterbloem</a></li>
              )}
            </ul>

            {heroImg && (
              <div className="relative aspect-[5/4] rounded-2xl overflow-hidden shadow-xl ring-1 ring-sage/20 hidden lg:block">
                <img src={heroImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="pointer-events-none absolute inset-3 border border-linen/30 rounded-xl" />
              </div>
            )}
          </div>

          <div>
            {sent ? (
              <div className="card hairline-sage bg-linen relative">
                <BotanicalCorner position="tl" className="w-16 h-16 sm:w-20 sm:h-20" color="text-sage/40" />
                <BotanicalCorner position="br" className="w-16 h-16 sm:w-20 sm:h-20" color="text-sage/40" />
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
              <form onSubmit={form.handleSubmit(onSubmit)} className="card hairline-sage space-y-5">
                {/*
                  Honeypot: onzichtbaar voor bezoekers, wél in de HTML. Bots vullen elk veld
                  in dat ze vinden; is dit ingevuld, dan negeert de server de aanvraag.
                  `aria-hidden` + tabIndex houden het buiten schermlezers en tab-volgorde,
                  zodat het voor iemand met een schermlezer niet bestaat.
                */}
                <div className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
                  <label htmlFor="website">Vul dit veld niet in</label>
                  <input
                    id="website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    {...form.register("website")}
                  />
                </div>
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
                  <div>
                    <label className="label">Datum gelegenheid</label>
                    <input className="input" type="date" {...form.register("eventDate")} />
                    {teKrap && (
                      <p className="mt-1.5 flex items-start gap-1.5 text-xs text-charcoal/70 bg-boterbloem/30 rounded px-2 py-1.5">
                        <Info size={14} className="text-sage-dark shrink-0 mt-px" />
                        <span>
                          Dat is korter dan {drempel} dagen vooraf. Stuur je aanvraag gerust,
                          we laten weten of het lukt.
                        </span>
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Wat voor gelegenheid?</label>
                    <select className="input" {...form.register("categoryId")}>
                      <option value="">Kies een optie</option>
                      {gelegenheden.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div><label className="label">Aantal personen</label><input className="input" type="number" min="1" {...form.register("persons")} /></div>
                </div>
                {pakketten && pakketten.length > 0 && (
                  <div>
                    <label className="label">Welk pakket heb je ongeveer voor ogen?</label>
                    <select className="input" {...form.register("packageId")}>
                      {/* Deze optie moet er staan: wie het nog niet weet, mag niet het gevoel
                          krijgen dat ze eerst iets moet uitzoeken. */}
                      <option value="">Weet ik nog niet</option>
                      {pakketten.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}{Number(p.priceFrom) > 0 ? ` · vanaf € ${Number(p.priceFrom).toFixed(0)}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="label">Bericht *</label>
                  <textarea className="input min-h-[140px]" {...form.register("message")} />
                  {form.formState.errors.message && <p className="text-xs text-burgundy mt-1">{form.formState.errors.message.message}</p>}
                </div>
                {error && <div className="text-sm text-burgundy">{error}</div>}
                <button type="submit" disabled={form.formState.isSubmitting} className="btn-sage w-full">
                  {form.formState.isSubmitting ? "Versturen…" : "Bericht versturen"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Steps section */}
      <section className="relative bg-section-sage section-y overflow-hidden">
        <BotanicalPattern opacity={0.05} />
        <div className="container-tight relative">
          <div className="text-center mb-10 sm:mb-14">
            <div className="tag mb-3">Hoe het werkt</div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl">Van idee tot tafel</h2>
            <div className="mt-6"><SierDivider /></div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {STEPS.map((s) => (
              <div key={s.n} className="card hairline-sage bg-linen relative">
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
