import { useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { usePublicSettings } from "../../hooks/usePublicSettings";
import type { GalerijAntwoord } from "../../lib/galerij";
import { LANGE_STAPPEN, stapFotos } from "../../content/werkwijze";
import { ProcessStory, type ProcessStep } from "../../components/ProcessStory";
import { PageHeader } from "../../components/PageHeader";
import { SierDivider } from "../../components/ornaments/SierDivider";
import { BotanicalPattern } from "../../components/ornaments/BotanicalPattern";
import { BotanicalCorner } from "../../components/ornaments/BotanicalCorner";
import { FloralFrame } from "../../components/ornaments/FloralFrame";
import { Reveal } from "../../components/Reveal";

/**
 * Zo werkt het — het verhaal van aanvraag tot levering.
 *
 * **Waarom deze pagina bestaat.** De klant leverde één geschreven artikel aan en noemde het een
 * blog. Een blog met één artikel is een leeg archief met een inhoudsopgave, en de tekst is geen
 * nieuwsbericht maar een procesbeschrijving. Haar eigen huisstijl-moodboard heeft `WERKWIJZE`
 * al in de navigatie staan, met vijf stappen als iconen — ze had de pagina zelf bedacht, alleen
 * de tekst ervoor lag los. Hier komen die twee bij elkaar.
 *
 * **Waarom `ProcessStory`.** Dat component stond al in de codebase maar werd nergens
 * gerenderd: alleen zijn `ProcessStep`-type werd geïmporteerd door de homepage. Het is gebouwd
 * voor precies dit — een meelopend beeld dat wisselt terwijl je door de stappen scrollt, met
 * een gewone stapel op mobiel. Op de homepage was het te zwaar (260vh voor vier zinnen, zie de
 * kop van `ProcessStrip`); op een pagina waar iemand komt om het verháál te lezen is het waar
 * het voor bedoeld was.
 *
 * De korte versie van dezelfde tekst staat als strip op de homepage. Eén bron:
 * `content/werkwijze.ts`.
 */
export default function WerkwijzePage() {
  const { data: settings } = usePublicSettings();
  const levertijden = (settings as { levertijden?: { tekst?: string } } | undefined)?.levertijden;

  const { data: gallery } = useQuery({
    queryKey: ["public", "gallery"],
    queryFn: () => api.get<GalerijAntwoord>("/api/public/gallery"),
  });

  const stappen: ProcessStep[] = useMemo(() => {
    const fotos = stapFotos(LANGE_STAPPEN, gallery?.items ?? []);
    return LANGE_STAPPEN.map((stap, i) => ({
      n: stap.n,
      title: stap.title,
      body: stap.body,
      imageSrc: fotos[i] ?? "",
    }));
  }, [gallery]);

  // Zonder foto's heeft het scroll-verhaal niets te tonen: de beeldkolom blijft dan leeg en de
  // stappen staan er verloren naast. Dan liever de tekst alleen, netjes gezet.
  const heeftBeeld = stappen.some((s) => s.imageSrc);

  return (
    <>
      <PageHeader
        achtergrond="bg-section-warm"
        tag="Werkwijze"
        titel="Zo werkt het"
        tekst="Achter iedere tafel en iedere taart zit een heel proces: van het eerste berichtje tot het moment waarop alles klaarstaat. Dit is hoe dat gaat."
      >
        <FloralFrame className="absolute -top-8 -right-8 h-32 w-32 sm:h-56 sm:w-56 md:-top-12 md:-right-12 md:h-72 md:w-72" color="text-sage/20" />
      </PageHeader>

      {heeftBeeld ? (
        <ProcessStory steps={stappen} metKop={false} />
      ) : (
        <section className="relative overflow-hidden bg-linen section-y">
          <BotanicalPattern opacity={0.04} />
          <div className="container-narrow relative space-y-10">
            {stappen.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.05}>
                <article>
                  <div className="script-accent text-4xl leading-none">{s.n}</div>
                  <h2 className="mt-1 text-2xl sm:text-3xl">{s.title}</h2>
                  <p className="mt-3 leading-relaxed text-charcoal/75">{s.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ---------- Levertijd ---------- */}
      <section className="relative overflow-hidden bg-section-diep text-linen section-y-sm">
        <BotanicalPattern opacity={0.07} className="text-linen" />
        <BotanicalCorner position="tl" color="text-linen/25" />
        <BotanicalCorner position="br" color="text-linen/25" />
        <div className="container-narrow relative text-center">
          <div className="tag mb-3">Op tijd aanvragen</div>
          <h2 className="text-2xl sm:text-3xl">Wanneer moet je het vastleggen?</h2>
          <p className="mx-auto mt-4 max-w-xl leading-relaxed text-charcoal/75">
            {levertijden?.tekst ||
              "Vraag je tafel het liefst een paar weken van tevoren aan. Voor een losse taart kan het vaak sneller, dus vraag gerust naar de mogelijkheden."}
          </p>
          <div className="mt-8">
            <SierDivider color="text-linen/50" />
          </div>
          <p className="mt-8 text-sm text-charcoal/75 sm:text-base">
            Weet je al wat je zoekt, of juist nog niet?
          </p>
          <Link href="/contact" className="btn-sage mt-5">
            Offerte aanvragen
          </Link>
        </div>
      </section>
    </>
  );
}
