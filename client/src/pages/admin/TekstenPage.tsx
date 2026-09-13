import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Type, ChevronUp, ChevronDown, Trash2, Plus } from "lucide-react";
import { PageKop } from "../../components/admin/ui/PageKop";
import { Blok, Veld } from "../../components/admin/ui/Instelblok";
import { FotoKiezer } from "../../components/admin/FotoKiezer";
import { api } from "../../lib/api";
import type { GalleryItem } from "@shared/schema";
import type {
  PaginaHomeSettings,
  PaginaAanbodSettings,
  PaginaGalerijSettings,
  PaginaWerkwijzeSettings,
  PaginaContactSettings,
  VoettekstSettings,
  WerkwijzeSettings,
  WerkwijzeStapData,
} from "@shared/schema";

/**
 * De teksten van de publieke site.
 *
 * **Waarom dit scherm los staat van Instellingen.** Dat scherm gaat over gegevens en techniek:
 * contactgegevens, levertijden, de agenda-feed. Dit gaat over wat een bezoeker leest. Bij elkaar
 * zou het één lijst van ruim zestig velden zijn waarin haar telefoonnummer tussen de koppen van
 * de homepage staat.
 *
 * Elk blok heeft een *Bekijk*-link naar de pagina waar de tekst op staat, zodat "waar staat dit
 * dan?" geen giswerk is.
 */

type AlleTeksten = {
  paginaHome?: PaginaHomeSettings;
  paginaAanbod?: PaginaAanbodSettings;
  paginaGalerij?: PaginaGalerijSettings;
  paginaWerkwijze?: PaginaWerkwijzeSettings;
  paginaContact?: PaginaContactSettings;
  voettekst?: VoettekstSettings;
  werkwijze?: WerkwijzeSettings;
};

/** De sleutels die dit scherm beheert, in de vololgorde waarin de blokken staan. */
const SLEUTELS = [
  "paginaHome",
  "paginaAanbod",
  "paginaGalerij",
  "paginaWerkwijze",
  "paginaContact",
  "voettekst",
  "werkwijze",
] as const;

type Sleutel = (typeof SLEUTELS)[number];

export default function TekstenPage() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => api.get<AlleTeksten>("/api/admin/settings"),
  });

  const [teksten, setTeksten] = useState<AlleTeksten>({});
  /** Wat er binnenkwam, om bij het opslaan te bepalen wat er écht veranderd is. */
  const [origineel, setOrigineel] = useState<AlleTeksten>({});

  useEffect(() => {
    if (!data) return;
    const binnen: AlleTeksten = {};
    for (const k of SLEUTELS) if (data[k]) (binnen as Record<string, unknown>)[k] = data[k];
    setTeksten(binnen);
    setOrigineel(JSON.parse(JSON.stringify(binnen)));
  }, [data]);

  /**
   * Alleen de gewijzigde sleutels versturen, en achter elkaar.
   *
   * Zeven sleutels blind opslaan betekent zeven verzoeken en zeven aangeraakte rijen voor één
   * gewijzigd woord. Sequentieel en niet met `Promise.all`, om dezelfde reden als in
   * `SettingsPage`: bij een fout halverwege blijft de rest staan zoals hij was, en de melding
   * zegt welke sleutel het was.
   */
  const opslaan = useMutation({
    mutationFn: async () => {
      for (const k of SLEUTELS) {
        const nu = teksten[k];
        if (!nu) continue;
        if (JSON.stringify(nu) === JSON.stringify(origineel[k])) continue;
        try {
          await api.put(`/api/admin/settings/${k}`, nu);
        } catch (e) {
          throw new Error(
            `${LABEL[k]}: ${e instanceof Error ? e.message : "onbekende fout"}`,
          );
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "settings"] });
      qc.invalidateQueries({ queryKey: ["public", "settings"] });
    },
  });

  // De fotokiezer werkt met bestandsnamen, de werkwijze-stappen bewaren id's. Deze query draait
  // toch al voor de kiezer zelf, dus de vertaling kost niets extra's.
  const { data: galerij } = useQuery({
    queryKey: ["admin", "gallery"],
    queryFn: () => api.get<GalleryItem[]>("/api/admin/gallery"),
  });

  /** Eén veld binnen één sleutel bijwerken. */
  function zet<K extends Sleutel>(sleutel: K, veld: string, waarde: unknown) {
    setTeksten((t) => ({
      ...t,
      [sleutel]: { ...((t[sleutel] ?? {}) as object), [veld]: waarde },
    }));
  }

  const home = teksten.paginaHome;
  const aanbod = teksten.paginaAanbod;
  const galerijT = teksten.paginaGalerij;
  const werkwijzeT = teksten.paginaWerkwijze;
  const contactT = teksten.paginaContact;
  const voet = teksten.voettekst;
  const stappen = teksten.werkwijze;

  return (
    <div>
      <PageKop
        titel="Teksten"
        icoon={Type}
        onderschrift="Alles wat een bezoeker op je site leest. Laat je een veld leeg, dan komt de standaardtekst terug."
      />

      <div className="space-y-6">
        {/* ---------------- Homepage ---------------- */}
        <Blok titel="Homepage" uitleg="De koppen boven elk blok en de oproep onderaan." bekijk="/">
          <div className="grid gap-4 sm:grid-cols-2">
            <Veld label="Label boven het aanbod" hint="Klein kopje in hoofdletters.">
              <input className="input" value={home?.aanbodTag ?? ""}
                onChange={(e) => zet("paginaHome", "aanbodTag", e.target.value)} />
            </Veld>
            <Veld label="Kop boven het aanbod">
              <input className="input" value={home?.aanbodTitel ?? ""}
                onChange={(e) => zet("paginaHome", "aanbodTitel", e.target.value)} />
            </Veld>
            <Veld label="Label boven je werk">
              <input className="input" value={home?.werkTag ?? ""}
                onChange={(e) => zet("paginaHome", "werkTag", e.target.value)} />
            </Veld>
            <Veld label="Kop boven je werk">
              <input className="input" value={home?.werkTitel ?? ""}
                onChange={(e) => zet("paginaHome", "werkTitel", e.target.value)} />
            </Veld>
            <Veld label="Link naar de galerij" hint='Staat rechts naast "Uitgelicht werk".'>
              <input className="input" value={home?.werkLink ?? ""}
                onChange={(e) => zet("paginaHome", "werkLink", e.target.value)} />
            </Veld>
            <Veld label="Label boven de reviews">
              <input className="input" value={home?.reviewsTag ?? ""}
                onChange={(e) => zet("paginaHome", "reviewsTag", e.target.value)} />
            </Veld>
            <Veld label="Kop boven de reviews">
              <input className="input" value={home?.reviewsTitel ?? ""}
                onChange={(e) => zet("paginaHome", "reviewsTitel", e.target.value)} />
            </Veld>
            <Veld label="Label boven je werkwijze" hint="De stappen zelf bewerk je verderop.">
              <input className="input" value={home?.procesTag ?? ""}
                onChange={(e) => zet("paginaHome", "procesTag", e.target.value)} />
            </Veld>
            <Veld label="Kop boven je werkwijze">
              <input className="input" value={home?.procesTitel ?? ""}
                onChange={(e) => zet("paginaHome", "procesTitel", e.target.value)} />
            </Veld>
            <Veld label="Link naar de hele werkwijze">
              <input className="input" value={home?.procesLink ?? ""}
                onChange={(e) => zet("paginaHome", "procesLink", e.target.value)} />
            </Veld>
            <div className="sm:col-span-2 mt-2 border-t border-charcoal/10 pt-4">
              <p className="label !mb-3">Het blok onderaan</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Veld label="Zin in schuinschrift">
                  <input className="input" value={home?.slotAccent ?? ""}
                    onChange={(e) => zet("paginaHome", "slotAccent", e.target.value)} />
                </Veld>
                <Veld label="Kop">
                  <input className="input" value={home?.slotTitel ?? ""}
                    onChange={(e) => zet("paginaHome", "slotTitel", e.target.value)} />
                </Veld>
                <div className="sm:col-span-2">
                  <Veld label="Tekst">
                    <textarea className="input min-h-[70px]" value={home?.slotTekst ?? ""}
                      onChange={(e) => zet("paginaHome", "slotTekst", e.target.value)} />
                  </Veld>
                </div>
                <Veld label="Tekst op de knop">
                  <input className="input" value={home?.slotKnop ?? ""}
                    onChange={(e) => zet("paginaHome", "slotKnop", e.target.value)} />
                </Veld>
              </div>
            </div>
          </div>
        </Blok>

        {/* ---------------- Aanbod ---------------- */}
        <Blok titel="Aanbod" uitleg="De pagina met je pakketten en taartprijzen." bekijk="/aanbod">
          <div className="grid gap-4 sm:grid-cols-2">
            <Veld label="Label bovenaan">
              <input className="input" value={aanbod?.tag ?? ""}
                onChange={(e) => zet("paginaAanbod", "tag", e.target.value)} />
            </Veld>
            <Veld label="Kop bovenaan">
              <input className="input" value={aanbod?.titel ?? ""}
                onChange={(e) => zet("paginaAanbod", "titel", e.target.value)} />
            </Veld>
            <div className="sm:col-span-2">
              <Veld label="Introtekst">
                <textarea className="input min-h-[80px]" value={aanbod?.intro ?? ""}
                  onChange={(e) => zet("paginaAanbod", "intro", e.target.value)} />
              </Veld>
            </div>
            <div className="sm:col-span-2">
              <Veld label="Zin onder de pakketten" hint="Staat onder de rij pakketkaarten.">
                <textarea className="input min-h-[70px]" value={aanbod?.pakkettenSlotzin ?? ""}
                  onChange={(e) => zet("paginaAanbod", "pakkettenSlotzin", e.target.value)} />
              </Veld>
            </div>

            <div className="sm:col-span-2 border-t border-charcoal/10 pt-4">
              <Veld label='Kop boven "Goed om te weten"'>
                <input className="input" value={aanbod?.weetjesTitel ?? ""}
                  onChange={(e) => zet("paginaAanbod", "weetjesTitel", e.target.value)} />
              </Veld>
              <div className="mt-4">
                <p className="label !mb-2">De punten daaronder</p>
                <LijstBewerker
                  items={aanbod?.weetjes ?? []}
                  onChange={(v) => zet("paginaAanbod", "weetjes", v)}
                  nieuw={() => ({ icoon: "•", titel: "", tekst: "" })}
                  velden={[
                    { sleutel: "icoon", label: "Teken", breedte: "smal" },
                    { sleutel: "titel", label: "Kop" },
                    { sleutel: "tekst", label: "Tekst", lang: true },
                  ]}
                />
                <p className="mt-2 text-xs text-charcoal/50">
                  Laat de tekst van het eerste punt leeg om je levertijd uit Instellingen te
                  gebruiken.
                </p>
              </div>
            </div>

            <div className="sm:col-span-2 border-t border-charcoal/10 pt-4">
              <p className="label !mb-3">Het taartenblok</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Veld label="Label">
                  <input className="input" value={aanbod?.taartenTag ?? ""}
                    onChange={(e) => zet("paginaAanbod", "taartenTag", e.target.value)} />
                </Veld>
                <Veld label="Kop">
                  <input className="input" value={aanbod?.taartenTitel ?? ""}
                    onChange={(e) => zet("paginaAanbod", "taartenTitel", e.target.value)} />
                </Veld>
                <div className="sm:col-span-2">
                  <Veld label="Introtekst">
                    <textarea className="input min-h-[70px]" value={aanbod?.taartenIntro ?? ""}
                      onChange={(e) => zet("paginaAanbod", "taartenIntro", e.target.value)} />
                  </Veld>
                </div>
                <div className="sm:col-span-2">
                  <Veld label="Zin onder de prijzen">
                    <input className="input" value={aanbod?.taartenBijschrift ?? ""}
                      onChange={(e) => zet("paginaAanbod", "taartenBijschrift", e.target.value)} />
                  </Veld>
                </div>
                <div className="sm:col-span-2">
                  <Veld label="Kop boven de smaken">
                    <input className="input" value={aanbod?.smakenTitel ?? ""}
                      onChange={(e) => zet("paginaAanbod", "smakenTitel", e.target.value)} />
                  </Veld>
                  <div className="mt-3">
                    <LijstBewerker
                      items={aanbod?.smaken ?? []}
                      onChange={(v) => zet("paginaAanbod", "smaken", v)}
                      nieuw={() => ({ naam: "", omschrijving: "" })}
                      velden={[
                        { sleutel: "naam", label: "Naam" },
                        { sleutel: "omschrijving", label: "Omschrijving" },
                      ]}
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <Veld label="Zin onder de smaken">
                    <input className="input" value={aanbod?.smakenSlot ?? ""}
                      onChange={(e) => zet("paginaAanbod", "smakenSlot", e.target.value)} />
                  </Veld>
                </div>
              </div>
            </div>

            <div className="sm:col-span-2 border-t border-charcoal/10 pt-4">
              <p className="label !mb-3">Onderaan de pagina</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Veld label="Zin in schuinschrift">
                  <input className="input" value={aanbod?.slotAccent ?? ""}
                    onChange={(e) => zet("paginaAanbod", "slotAccent", e.target.value)} />
                </Veld>
                <Veld label="Tekst op de knop">
                  <input className="input" value={aanbod?.slotKnop ?? ""}
                    onChange={(e) => zet("paginaAanbod", "slotKnop", e.target.value)} />
                </Veld>
                <div className="sm:col-span-2">
                  <Veld label="Tekst">
                    <textarea className="input min-h-[70px]" value={aanbod?.slotTekst ?? ""}
                      onChange={(e) => zet("paginaAanbod", "slotTekst", e.target.value)} />
                  </Veld>
                </div>
              </div>
            </div>

            <div className="sm:col-span-2 border-t border-charcoal/10 pt-4">
              <p className="label !mb-3">Als er nog geen pakketten op de site staan</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Veld label="Kop">
                  <input className="input" value={aanbod?.leegTitel ?? ""}
                    onChange={(e) => zet("paginaAanbod", "leegTitel", e.target.value)} />
                </Veld>
                <div className="sm:col-span-2">
                  <Veld label="Tekst">
                    <textarea className="input min-h-[70px]" value={aanbod?.leegTekst ?? ""}
                      onChange={(e) => zet("paginaAanbod", "leegTekst", e.target.value)} />
                  </Veld>
                </div>
              </div>
            </div>
          </div>
        </Blok>

        {/* ---------------- Galerij ---------------- */}
        <Blok titel="Galerij" uitleg="De kop boven je portfolio." bekijk="/galerij">
          <div className="grid gap-4 sm:grid-cols-2">
            <Veld label="Label bovenaan">
              <input className="input" value={galerijT?.tag ?? ""}
                onChange={(e) => zet("paginaGalerij", "tag", e.target.value)} />
            </Veld>
            <Veld label="Kop bovenaan">
              <input className="input" value={galerijT?.titel ?? ""}
                onChange={(e) => zet("paginaGalerij", "titel", e.target.value)} />
            </Veld>
            <div className="sm:col-span-2">
              <Veld label="Introtekst">
                <textarea className="input min-h-[70px]" value={galerijT?.intro ?? ""}
                  onChange={(e) => zet("paginaGalerij", "intro", e.target.value)} />
              </Veld>
            </div>
            <Veld label="Vraag onderaan">
              <input className="input" value={galerijT?.slotVraag ?? ""}
                onChange={(e) => zet("paginaGalerij", "slotVraag", e.target.value)} />
            </Veld>
            <Veld label="Tekst op de knop">
              <input className="input" value={galerijT?.slotKnop ?? ""}
                onChange={(e) => zet("paginaGalerij", "slotKnop", e.target.value)} />
            </Veld>
          </div>
        </Blok>

        {/* ---------------- Werkwijze ---------------- */}
        <Blok titel="Werkwijze" uitleg="De kop en het levertijd-blok." bekijk="/werkwijze">
          <div className="grid gap-4 sm:grid-cols-2">
            <Veld label="Label bovenaan">
              <input className="input" value={werkwijzeT?.tag ?? ""}
                onChange={(e) => zet("paginaWerkwijze", "tag", e.target.value)} />
            </Veld>
            <Veld label="Kop bovenaan">
              <input className="input" value={werkwijzeT?.titel ?? ""}
                onChange={(e) => zet("paginaWerkwijze", "titel", e.target.value)} />
            </Veld>
            <div className="sm:col-span-2">
              <Veld label="Introtekst">
                <textarea className="input min-h-[70px]" value={werkwijzeT?.intro ?? ""}
                  onChange={(e) => zet("paginaWerkwijze", "intro", e.target.value)} />
              </Veld>
            </div>
            <Veld label="Label bij de levertijd">
              <input className="input" value={werkwijzeT?.levertijdTag ?? ""}
                onChange={(e) => zet("paginaWerkwijze", "levertijdTag", e.target.value)} />
            </Veld>
            <Veld label="Kop bij de levertijd" hint="De tekst zelf staat bij Instellingen.">
              <input className="input" value={werkwijzeT?.levertijdTitel ?? ""}
                onChange={(e) => zet("paginaWerkwijze", "levertijdTitel", e.target.value)} />
            </Veld>
            <Veld label="Vraag onderaan">
              <input className="input" value={werkwijzeT?.slotVraag ?? ""}
                onChange={(e) => zet("paginaWerkwijze", "slotVraag", e.target.value)} />
            </Veld>
            <Veld label="Tekst op de knop">
              <input className="input" value={werkwijzeT?.slotKnop ?? ""}
                onChange={(e) => zet("paginaWerkwijze", "slotKnop", e.target.value)} />
            </Veld>
          </div>
        </Blok>

        {/* ---------------- Jouw werkwijze in stappen ---------------- */}
        <Blok
          titel="Jouw werkwijze, stap voor stap"
          uitleg="Je eigen verhaal. De korte versie staat op de homepage en je contactpagina, de lange op /werkwijze."
          bekijk="/werkwijze"
        >
          <div className="space-y-8">
            <StappenBewerker
              titel="Korte versie"
              hint="Staat als strip op je homepage en op je contactpagina. Houd het bij één zin per stap."
              stappen={stappen?.kort ?? []}
              galerij={galerij}
              onChange={(v) => zet("werkwijze", "kort", v)}
            />
            <StappenBewerker
              titel="Lange versie"
              hint="Het hele verhaal op /werkwijze, met een foto per stap."
              stappen={stappen?.lang ?? []}
              galerij={galerij}
              onChange={(v) => zet("werkwijze", "lang", v)}
            />
          </div>
        </Blok>

        {/* ---------------- Contact ---------------- */}
        <Blok titel="Contactpagina" uitleg="De kop, het bedankscherm en de stappen." bekijk="/contact">
          <div className="grid gap-4 sm:grid-cols-2">
            <Veld label="Label bovenaan">
              <input className="input" value={contactT?.tag ?? ""}
                onChange={(e) => zet("paginaContact", "tag", e.target.value)} />
            </Veld>
            <Veld label="Kop bovenaan">
              <input className="input" value={contactT?.titel ?? ""}
                onChange={(e) => zet("paginaContact", "titel", e.target.value)} />
            </Veld>
            <div className="sm:col-span-2">
              <Veld label="Introtekst">
                <textarea className="input min-h-[70px]" value={contactT?.intro ?? ""}
                  onChange={(e) => zet("paginaContact", "intro", e.target.value)} />
              </Veld>
            </div>
            <Veld label="Kop na het versturen">
              <input className="input" value={contactT?.bedanktTitel ?? ""}
                onChange={(e) => zet("paginaContact", "bedanktTitel", e.target.value)} />
            </Veld>
            <div className="sm:col-span-2">
              <Veld label="Tekst na het versturen">
                <textarea className="input min-h-[60px]" value={contactT?.bedanktTekst ?? ""}
                  onChange={(e) => zet("paginaContact", "bedanktTekst", e.target.value)} />
              </Veld>
            </div>
            <Veld label="Label boven de stappen">
              <input className="input" value={contactT?.stappenTag ?? ""}
                onChange={(e) => zet("paginaContact", "stappenTag", e.target.value)} />
            </Veld>
            <Veld label="Kop boven de stappen">
              <input className="input" value={contactT?.stappenTitel ?? ""}
                onChange={(e) => zet("paginaContact", "stappenTitel", e.target.value)} />
            </Veld>
          </div>
        </Blok>

        {/* ---------------- Voettekst ---------------- */}
        <Blok titel="Onderaan elke pagina" uitleg="Je voettekst." bekijk="/">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Veld label="Zin onder je naam">
                <textarea className="input min-h-[60px]" value={voet?.payoff ?? ""}
                  onChange={(e) => zet("voettekst", "payoff", e.target.value)} />
              </Veld>
            </div>
            <Veld label="Kop boven je gegevens">
              <input className="input" value={voet?.contactKop ?? ""}
                onChange={(e) => zet("voettekst", "contactKop", e.target.value)} />
            </Veld>
            <Veld label="Kop boven je Instagram">
              <input className="input" value={voet?.volgKop ?? ""}
                onChange={(e) => zet("voettekst", "volgKop", e.target.value)} />
            </Veld>
          </div>
        </Blok>

        <div className="sticky bottom-6 flex justify-end gap-3">
          <button onClick={() => opslaan.mutate()} disabled={opslaan.isPending} className="btn-sage">
            {opslaan.isPending ? "Opslaan…" : "Alles opslaan"}
          </button>
        </div>

        {opslaan.isSuccess && <div className="text-right text-sm text-emerald-700">Opgeslagen.</div>}
        {opslaan.isError && (
          <div className="rounded-lg bg-burgundy/10 px-4 py-3 text-right text-sm text-burgundy">
            Opslaan mislukt — {opslaan.error instanceof Error ? opslaan.error.message : "onbekende fout"}
          </div>
        )}
      </div>
    </div>
  );
}

/** Voor de foutmelding: welke sleutel het misging, in gewone taal. */
const LABEL: Record<Sleutel, string> = {
  paginaHome: "Homepage",
  paginaAanbod: "Aanbod",
  paginaGalerij: "Galerij",
  paginaWerkwijze: "Werkwijze",
  paginaContact: "Contactpagina",
  voettekst: "Voettekst",
  werkwijze: "Jouw werkwijze",
};

/* -------------------------------------------------------------------------- */

type VeldDef = { sleutel: string; label: string; lang?: boolean; breedte?: "smal" };

/**
 * Een rijtje gelijkvormige regels — de weetjes op /aanbod, de smaken.
 *
 * Verplaatsen met pijltjes en niet met slepen: dezelfde keuze als bij de `includes` van een
 * pakket en de blokken van een album, zodat het overal in het beheerpaneel hetzelfde werkt.
 */
function LijstBewerker<T extends Record<string, string>>({
  items,
  onChange,
  nieuw,
  velden,
}: {
  items: T[];
  onChange: (v: T[]) => void;
  nieuw: () => T;
  velden: VeldDef[];
}) {
  const verplaats = (i: number, richting: -1 | 1) => {
    const j = i + richting;
    if (j < 0 || j >= items.length) return;
    const kopie = [...items];
    [kopie[i], kopie[j]] = [kopie[j], kopie[i]];
    onChange(kopie);
  };

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-1.5">
          <div className="flex shrink-0 flex-col pt-1">
            <button type="button" aria-label="Omhoog" className="text-charcoal/35 hover:text-charcoal"
              onClick={() => verplaats(i, -1)}>
              <ChevronUp size={14} />
            </button>
            <button type="button" aria-label="Omlaag" className="text-charcoal/35 hover:text-charcoal"
              onClick={() => verplaats(i, 1)}>
              <ChevronDown size={14} />
            </button>
          </div>
          <div className="grid flex-1 gap-2 sm:grid-cols-[auto_1fr]">
            {velden.map((v) => (
              <div key={v.sleutel} className={v.breedte === "smal" ? "sm:w-16" : "sm:col-span-1"}>
                {v.lang ? (
                  <textarea
                    className="input min-h-[54px] text-sm"
                    placeholder={v.label}
                    value={item[v.sleutel] ?? ""}
                    onChange={(e) =>
                      onChange(items.map((r, j) => (j === i ? { ...r, [v.sleutel]: e.target.value } : r)))
                    }
                  />
                ) : (
                  <input
                    className="input text-sm"
                    placeholder={v.label}
                    value={item[v.sleutel] ?? ""}
                    onChange={(e) =>
                      onChange(items.map((r, j) => (j === i ? { ...r, [v.sleutel]: e.target.value } : r)))
                    }
                  />
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            aria-label="Verwijderen"
            className="mt-1 shrink-0 rounded p-1 text-charcoal/30 transition hover:bg-burgundy/10 hover:text-burgundy"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button type="button" className="btn-ghost !py-1.5 !px-3 text-xs" onClick={() => onChange([...items, nieuw()])}>
        <Plus size={13} /> Regel toevoegen
      </button>
    </div>
  );
}

/**
 * De stappen van haar werkwijze, met een foto per stap.
 *
 * Het nummer staat er niet bij: dat volgt uit de volgorde. Stond het in de data, dan zou "03"
 * boven de eerste stap komen zodra je er een verplaatst.
 */
function StappenBewerker({
  titel,
  hint,
  stappen,
  galerij,
  onChange,
}: {
  titel: string;
  hint: string;
  stappen: WerkwijzeStapData[];
  galerij: GalleryItem[] | undefined;
  onChange: (v: WerkwijzeStapData[]) => void;
}) {
  const verplaats = (i: number, richting: -1 | 1) => {
    const j = i + richting;
    if (j < 0 || j >= stappen.length) return;
    const kopie = [...stappen];
    [kopie[i], kopie[j]] = [kopie[j], kopie[i]];
    onChange(kopie);
  };

  const wijzig = (i: number, veld: keyof WerkwijzeStapData, waarde: unknown) =>
    onChange(stappen.map((s, j) => (j === i ? { ...s, [veld]: waarde } : s)));

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <h3 className="tag">{titel}</h3>
        <span className="text-xs text-charcoal/45">{stappen.length} stappen</span>
      </div>
      <p className="mb-3 text-xs text-charcoal/55">{hint}</p>

      <div className="space-y-3">
        {stappen.map((stap, i) => (
          <div key={i} className="rounded-lg border border-charcoal/10 bg-white/50 p-3">
            <div className="flex items-start gap-2">
              <div className="flex shrink-0 flex-col pt-1">
                <button type="button" aria-label="Omhoog" className="text-charcoal/35 hover:text-charcoal"
                  onClick={() => verplaats(i, -1)}>
                  <ChevronUp size={15} />
                </button>
                <span className="py-0.5 text-center font-display text-xs text-charcoal/45">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <button type="button" aria-label="Omlaag" className="text-charcoal/35 hover:text-charcoal"
                  onClick={() => verplaats(i, 1)}>
                  <ChevronDown size={15} />
                </button>
              </div>

              <div className="min-w-0 flex-1 space-y-2">
                <input
                  className="input text-sm font-medium"
                  placeholder="Titel van de stap"
                  value={stap.titel}
                  onChange={(e) => wijzig(i, "titel", e.target.value)}
                />
                <textarea
                  className="input min-h-[70px] text-sm"
                  placeholder="Wat er in deze stap gebeurt"
                  value={stap.tekst}
                  onChange={(e) => wijzig(i, "tekst", e.target.value)}
                />
                <div>
                  <div className="label !mb-1.5">Foto bij deze stap</div>
                  <FotoKiezer
                    waarde={galerij?.find((f) => f.id === stap.fotoItemId)?.filename}
                    leegTekst="Geen foto"
                    onKies={(_naam, item) => wijzig(i, "fotoItemId", item?.id ?? null)}
                  />
                </div>
              </div>

              <button
                type="button"
                aria-label="Stap verwijderen"
                className="shrink-0 rounded p-1 text-charcoal/30 transition hover:bg-burgundy/10 hover:text-burgundy"
                onClick={() => onChange(stappen.filter((_, j) => j !== i))}
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          className="btn-ghost !py-1.5 !px-3 text-xs"
          onClick={() => onChange([...stappen, { titel: "", tekst: "", fotoItemId: null }])}
        >
          <Plus size={13} /> Stap toevoegen
        </button>
      </div>
    </div>
  );
}
