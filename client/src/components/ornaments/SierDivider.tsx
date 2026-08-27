import { cn } from "../../lib/utils";

interface Props {
  className?: string;
  /** Kleurklasse voor de lijn en het motief. Standaard salie-donker. */
  color?: string;
}

/**
 * Haarlijn met een klein bloemmotief in het midden.
 *
 * Heette `GoldDivider` tot 27-08, toen het palet nog goud was. De naam is nu neutraal, zodat
 * hij de volgende kleurwissel overleeft — de vorm is de scheiding, niet de kleur.
 */
export function SierDivider({ className, color = "text-sage-dark" }: Props) {
  return (
    <div className={cn("flex items-center gap-4 w-full max-w-md mx-auto", color, className)}>
      <span className="flex-1 h-px bg-current opacity-40" />
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" className="opacity-80">
        <g fill="currentColor">
          <circle cx="10" cy="10" r="2" />
          <circle cx="10" cy="4" r="2" opacity="0.7" />
          <circle cx="10" cy="16" r="2" opacity="0.7" />
          <circle cx="4" cy="10" r="2" opacity="0.7" />
          <circle cx="16" cy="10" r="2" opacity="0.7" />
        </g>
      </svg>
      <span className="flex-1 h-px bg-current opacity-40" />
    </div>
  );
}
