import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { Copy, Check, RefreshCw, ExternalLink, Settings } from "lucide-react";
import { PageKop } from "../../components/admin/ui/PageKop";
import { api } from "../../lib/api";
import { FotoKiezer } from "../../components/admin/FotoKiezer";
import type { GalleryItem } from "@shared/schema";
import {
  type ContactSettings,
  type HeroSettings,
  type AboutSettings,
  type LevertijdenSettings,
  type BtwSettings,
} from "@shared/schema";

interface AllSettings {
  contact?: ContactSettings;
  hero?: HeroSettings;
  about?: AboutSettings;
  levertijden?: LevertijdenSettings;
  btw?: BtwSettings;
}

/**
 * Waar de knop onder de hero heen kan. Paginanamen in plaats van webadressen: er stond een
 * kaal tekstveld met het opschrift "CTA link" waar `/contact` in moest, en dat is kennis die
 * de eigenaar van de site niet heeft. De opgeslagen waarde is nog steeds het pad.
 */
const KNOP_BESTEMMINGEN = [
  { pad: "/contact", naam: "Contactformulier" },
  { pad: "/aanbod", naam: "Aanbod" },
  { pad: "/galerij", naam: "Galerij" },
  { pad: "/over", naam: "Over ons" },
] as const;

const ANDER_ADRES = "__ander__";

/** Een sectie die zegt waar hij over gaat, met een link naar de pagina in kwestie. */
function Blok({
  titel,
  uitleg,
  bekijk,
  children,
}: {
  titel: string;
  uitleg?: string;
  /** Pad op de publieke site, bijvoorbeeld `/over`. */
  bekijk?: string;
  children: ReactNode;
}) {
  return (
    <section className="card">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl">{titel}</h2>
          {uitleg && <p className="mt-1 text-sm text-charcoal/60">{uitleg}</p>}
        </div>
        {bekijk && (
          <a
            href={bekijk}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center gap-1.5 text-xs uppercase tracking-widest text-sage-dark hover:underline"
          >
            Bekijk <ExternalLink size={13} />
          </a>
        )}
      </div>
      {children}
    </section>
  );
}

/** Label plus één regel uitleg eronder. De uitleg is waar het scherm zichzelf verklaart. */
function Veld({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-charcoal/50">{hint}</p>}
    </div>
  );
}

export default function SettingsPage() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => api.get<AllSettings>("/api/admin/settings"),
  });

  const [contact, setContact] = useState<ContactSettings>({});
  const [hero, setHero] = useState<HeroSettings>({ tagline: "", ctaLabel: "", ctaHref: "/contact", fotoIds: [] });
  const [about, setAbout] = useState<AboutSettings>({ heading: "", body: "" });
  const [levertijden, setLevertijden] = useState<LevertijdenSettings>({
    standaardDagen: 10, tekst: "", agendaFeedToken: "",
  });
  const [btw, setBtw] = useState<BtwSettings>({ standaardTarief: "geen", toelichting: "" });
  const [gekopieerd, setGekopieerd] = useState(false);

  useEffect(() => {
    if (data?.contact) setContact(data.contact);
    // `fotoIds` kan in oudere rijen ontbreken: `site_settings` is jsonb, dus wat er vóór dit
    // veld is opgeslagen heeft de sleutel niet. Zonder terugval wordt de state `undefined` en
    // klapt `.map()` in de fotokiezers eruit.
    if (data?.hero) setHero({ ...data.hero, fotoIds: data.hero.fotoIds ?? [] });
    if (data?.about) setAbout(data.about);
    if (data?.levertijden) setLevertijden(data.levertijden);
    if (data?.btw) setBtw(data.btw);
  }, [data]);

  const save = useMutation({
    /*
     * Achter elkaar, niet met `Promise.all`. Bij vier gelijktijdige verzoeken slaat een
     * mislukking halverwege een gedeeltelijk opgeslagen scherm op: drie sleutels bijgewerkt,
     * één niet, en niets dat dat zegt. Nu stopt het bij de eerste fout en blijft de rest zoals
     * hij was, en de melding eronder vertelt welke het was.
     */
    mutationFn: async () => {
      await api.put("/api/admin/settings/contact", contact);
      await api.put("/api/admin/settings/hero", hero);
      await api.put("/api/admin/settings/about", about);
      await api.put("/api/admin/settings/levertijden", levertijden);
      await api.put("/api/admin/settings/btw", btw);
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

  const bekendeBestemming = KNOP_BESTEMMINGEN.some((b) => b.pad === hero.ctaHref);

  /**
   * De hero bewaart foto-**id's**; `FotoKiezer` toont een **bestandsnaam**. Deze query vertaalt
   * daartussen. Hij draait toch al voor de fotokiezer zelf, dus hij kost niets extra's.
   */
  const { data: galerij } = useQuery({
    queryKey: ["admin", "gallery"],
    queryFn: () => api.get<GalleryItem[]>("/api/admin/gallery"),
  });
  const heroFotoNamen = [0, 1, 2].map((i) => {
    const id = hero.fotoIds?.[i];
    return id ? galerij?.find((f) => f.id === id)?.filename : undefined;
  });

  /**
   * Eén plek uit de rij vervangen of leegmaken.
   *
   * De lijst blijft compact: plek 2 leegmaken schuift plek 3 op, in plaats van een `null` in
   * het midden achter te laten. De homepage vult vanaf de eerste, dus een gat zou daar toch
   * niet als gat aankomen -- maar wél als een kiezer die leeg lijkt terwijl er een foto staat.
   */
  function zetHeroFoto(index: number, id: number | null) {
    const huidig = [...(hero.fotoIds ?? [])];
    if (id === null) huidig.splice(index, 1);
    else huidig[index] = id;
    setHero({ ...hero, fotoIds: huidig.filter(Boolean).slice(0, 3) });
  }

  return (
    <div>
      <PageKop
        titel="Instellingen"
        icoon={Settings}
        onderschrift="Alles wat op je site staat en niet bij een boeking, foto of pakket hoort."
      />

      <div className="space-y-6">
        <Blok
          titel="Je contactgegevens"
          uitleg="Dit staat op je contactpagina en onderaan elke pagina."
          bekijk="/contact"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Veld label="E-mailadres">
              <input className="input" type="email" value={contact.email ?? ""}
                onChange={(e) => setContact({ ...contact, email: e.target.value })} />
            </Veld>
            <Veld label="Telefoonnummer">
              <input className="input" value={contact.phone ?? ""}
                onChange={(e) => setContact({ ...contact, phone: e.target.value })} />
            </Veld>
            <Veld label="WhatsApp-nummer" hint="Bezoekers kunnen je hiermee direct appen. Leeg laten = geen knop.">
              <input className="input" value={contact.whatsapp ?? ""} placeholder="06 12 34 56 78"
                onChange={(e) => setContact({ ...contact, whatsapp: e.target.value })} />
            </Veld>
            <Veld label="Instagram" hint="Het hele adres, bijvoorbeeld instagram.com/atelierboterbloem">
              <input className="input" value={contact.instagram ?? ""}
                onChange={(e) => setContact({ ...contact, instagram: e.target.value })} />
            </Veld>
            <div className="sm:col-span-2">
              <p className="mb-2 text-xs text-charcoal/50">Alleen invullen als klanten bij je langskomen.</p>
              <div className="grid gap-4 sm:grid-cols-3">
                <Veld label="Adres">
                  <input className="input" value={contact.address ?? ""}
                    onChange={(e) => setContact({ ...contact, address: e.target.value })} />
                </Veld>
                <Veld label="Postcode">
                  <input className="input" value={contact.postcode ?? ""}
                    onChange={(e) => setContact({ ...contact, postcode: e.target.value })} />
                </Veld>
                <Veld label="Plaats">
                  <input className="input" value={contact.city ?? ""}
                    onChange={(e) => setContact({ ...contact, city: e.target.value })} />
                </Veld>
              </div>
            </div>
          </div>
        </Blok>

        <Blok titel="Bovenaan de homepage" uitleg="Het eerste wat een bezoeker ziet." bekijk="/">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Veld label="Zin onder je naam" hint="Eén zin die zegt wat je maakt.">
                <input className="input" value={hero.tagline ?? ""}
                  onChange={(e) => setHero({ ...hero, tagline: e.target.value })} />
              </Veld>
            </div>
            <Veld label="Tekst op de knop" hint='Bijvoorbeeld "Vraag offerte aan".'>
              <input className="input" value={hero.ctaLabel ?? ""}
                onChange={(e) => setHero({ ...hero, ctaLabel: e.target.value })} />
            </Veld>
            <Veld label="Waar de knop heen gaat">
              <select
                className="input"
                value={bekendeBestemming ? hero.ctaHref : ANDER_ADRES}
                onChange={(e) =>
                  setHero({ ...hero, ctaHref: e.target.value === ANDER_ADRES ? "" : e.target.value })
                }
              >
                {KNOP_BESTEMMINGEN.map((b) => (
                  <option key={b.pad} value={b.pad}>{b.naam}</option>
                ))}
                <option value={ANDER_ADRES}>Ander adres…</option>
              </select>
              {/* Het tekstveld verschijnt pas bij "Ander adres…", zodat het gewone geval één
                  keuze is en niet een keuze plus een leeg veld dat vragen oproept. */}
              {!bekendeBestemming && (
                <input className="input mt-2" value={hero.ctaHref ?? ""} placeholder="https://…"
                  onChange={(e) => setHero({ ...hero, ctaHref: e.target.value })} />
              )}
            </Veld>

            {/*
              De drie foto's van de collage bovenaan de homepage.

              Ze werden automatisch gekozen -- de eerste drie foto's met "uitgelicht" aan -- en
              dat is een prima terugval, maar geen keuze: welke drie er staan hing af van de
              volgorde in de galerij. Hier kies je ze zelf.
            */}
            <div className="sm:col-span-2">
              <Veld
                label="Foto's bovenaan"
                hint="Drie foto's, naast elkaar uitgewaaierd. Laat je ze leeg, dan pakt de site je uitgelichte foto's."
              >
                <div className="mt-2 grid gap-5 sm:grid-cols-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i}>
                      <div className="label !mb-2">Foto {i + 1}</div>
                      <FotoKiezer
                        waarde={heroFotoNamen[i]}
                        leegTekst={`Foto ${i + 1}`}
                        onKies={(_bestandsnaam, item) => zetHeroFoto(i, item?.id ?? null)}
                      />
                    </div>
                  ))}
                </div>
              </Veld>
            </div>
          </div>
        </Blok>

        <Blok titel={'De pagina "Over ons"'} bekijk="/over">
          <div className="space-y-4">
            <Veld label="Kop boven je verhaal">
              <input className="input" value={about.heading ?? ""}
                onChange={(e) => setAbout({ ...about, heading: e.target.value })} />
            </Veld>
            <Veld label="Jouw verhaal">
              <textarea className="input min-h-[200px]" value={about.body ?? ""}
                onChange={(e) => setAbout({ ...about, body: e.target.value })} />
            </Veld>
            <Veld label="Foto van jou" hint="Staat naast je verhaal. Kies er een uit je galerij of upload een nieuwe.">
              <div className="mt-2">
                <FotoKiezer
                  waarde={about.imageFilename}
                  onKies={(bestandsnaam) => setAbout({ ...about, imageFilename: bestandsnaam })}
                />
              </div>
            </Veld>
          </div>
        </Blok>

        <Blok
          titel="Hoe ver vooruit je wilt weten"
          uitleg="Voor mensen die een aanvraag doen voor een datum die snel is."
          bekijk="/aanbod"
        >
          <div className="space-y-4">
            <Veld
              label="Minimaal aantal dagen vooraf"
              hint="Kiest iemand een datum die dichterbij ligt, dan krijgt die een vriendelijke waarschuwing. Aanvragen kan altijd."
            >
              <input className="input sm:max-w-[160px]" type="number" min="0" value={levertijden.standaardDagen}
                onChange={(e) => setLevertijden({ ...levertijden, standaardDagen: Number(e.target.value) })} />
            </Veld>
            <Veld label="Wat bezoekers hierover lezen" hint="Staat op je aanbod- en je contactpagina.">
              <textarea className="input min-h-[80px]" value={levertijden.tekst}
                onChange={(e) => setLevertijden({ ...levertijden, tekst: e.target.value })} />
            </Veld>
          </div>
        </Blok>

        <Blok titel="Op je offertes">
          {/*
            Alleen de tekst, geen tarief. Wélk btw-tarief geldt hoort bij het pakket of het
            product, want dat weet wat het is: een grazing table is eten, een stylingpakket niet.
            Een bedrijfsbrede standaard concurreerde met die keuze om dezelfde vraag, en dan is
            niet meer af te lezen welk antwoord wint. Een pakket of product zonder tarief wordt
            in zijn eigen scherm gemarkeerd.
          */}
          <Veld
            label="Extra regel onderaan je offerte"
            hint="Leeg laten is prima, dan komt er vanzelf een passende zin te staan."
          >
            <input className="input" value={btw.toelichting ?? ""}
              onChange={(e) => setBtw({ ...btw, toelichting: e.target.value })} />
          </Veld>
        </Blok>

        <Blok titel="Je agenda op je telefoon">
          <p className="mb-4 text-xs text-charcoal/50">
            Abonneer je op deze link in Google Agenda (<em>Andere agenda's → Via URL</em>) of op
            je iPhone (<em>Agenda's → Account toevoegen → Andere → Agenda-abonnement</em>). Je
            boekingen verschijnen dan vanzelf in je eigen agenda.
          </p>

          <div className="flex flex-wrap items-center gap-2">
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
        </Blok>

        <div className="sticky bottom-6 flex justify-end gap-3">
          <button onClick={() => save.mutate()} disabled={save.isPending} className="btn-sage">
            {save.isPending ? "Opslaan…" : "Alles opslaan"}
          </button>
        </div>

        {save.isSuccess && <div className="text-right text-sm text-emerald-700">Opgeslagen.</div>}
        {/* Een mislukte opslag zei eerst helemaal niets, dus je dacht dat het gelukt was. */}
        {save.isError && (
          <div className="rounded-lg bg-burgundy/10 px-4 py-3 text-right text-sm text-burgundy">
            Opslaan mislukt: {save.error instanceof Error ? save.error.message : "onbekende fout"}
          </div>
        )}
      </div>
    </div>
  );
}
