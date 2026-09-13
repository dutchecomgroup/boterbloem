import { ExternalLink } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Een sectie in een instellingen- of tekstenscherm: zegt waar hij over gaat, met een link naar
 * de pagina in kwestie.
 *
 * Stond als lokale hulpcomponent in `SettingsPage`. Sinds er een tweede scherm is dat precies
 * dezelfde vorm nodig heeft, staat hij hier -- anders was het een kopie, en dat is hoe
 * `slugify` twee keer in de codebase belandde.
 */
export function Blok({
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
export function Veld({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-charcoal/50">{hint}</p>}
    </div>
  );
}
