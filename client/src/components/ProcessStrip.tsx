import { Reveal } from "./Reveal";
import { GoldDivider } from "./ornaments/GoldDivider";
import type { ProcessStep } from "./ProcessStory";

/**
 * De vier stappen als één strip, in plaats van een scroll-verhaal.
 *
 * `ProcessStory` blijft bestaan voor `/over`, waar iemand komt die het verháál wil. Op de
 * homepage kostte hij **260vh** — `gap-[55vh]` plus `py-[20vh]` — en dat is ruim 2300 pixels
 * waarin de bezoeker vier zinnen leest en de stappen 02 tot 04 als bijna onzichtbare tekst
 * voorbij ziet komen. Dat is een derde van de pagina voor de minst dringende vraag.
 *
 * Deze versie past binnen één schermhoogte en zegt hetzelfde.
 */
export function ProcessStrip({ steps }: { steps: ProcessStep[] }) {
  return (
    <section className="relative overflow-hidden bg-cream section-y-sm">
      <div className="container-tight relative">
        <div className="mb-10 text-center">
          <div className="tag mb-3">Het proces</div>
          <h2 className="text-3xl sm:text-4xl">Zo gaat het</h2>
          <div className="mt-5">
            <GoldDivider className="!max-w-[180px]" />
          </div>
        </div>

        <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.08}>
              <li className="relative text-center lg:text-left">
                {/* De verbindingslijn loopt naar de volgende stap en stopt bij de laatste —
                    alleen op breed scherm, want daaronder staan de stappen onder elkaar. */}
                {i < steps.length - 1 && (
                  <span
                    className="absolute left-[calc(50%+1.75rem)] top-5 hidden h-px w-[calc(100%-3.5rem)] bg-gold/30 lg:left-14 lg:block lg:w-[calc(100%-3.5rem)]"
                    aria-hidden
                  />
                )}
                <div className="mb-3 flex justify-center lg:justify-start">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/15 font-display text-lg text-gold-dark ring-1 ring-gold/30">
                    {s.n}
                  </span>
                </div>
                <h3 className="font-display text-xl text-charcoal">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-charcoal/75">{s.body}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
