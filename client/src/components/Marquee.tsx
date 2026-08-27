import { cn } from "../lib/utils";

interface Props {
  items: string[];
  className?: string;
  /** Duration in seconds for one full cycle. */
  duration?: number;
  /** Reverse direction. */
  reverse?: boolean;
}

/**
 * Doorlopende band met trefwoorden. CSS-only, pauzeert bij hover, verdubbelt zijn inhoud zodat
 * de lus naadloos is.
 *
 * Staat op het merkgroen met linen-tekst. Hij stond op zand met `text-charcoal/70`, en dat
 * betekende dat de band als een pauze tussen twee lichte secties las in plaats van als een
 * streep die ze scheidt -- terwijl dit juist het moment is waarop de merkkleur even mag
 * spreken.
 *
 * Contrast: linen op sage-deep haalt 5,04:1. Daarom staat de tekst op vol linen en niet op een
 * doorzichtige variant: al bij 85% zakt het onder de AA-eis.
 */
export function Marquee({ items, className, duration = 40, reverse = false }: Props) {
  return (
    <div
      className={cn(
        "marquee group relative overflow-hidden border-y border-sage-deep bg-sage-deep py-4 text-linen sm:py-5",
        className,
      )}
    >
      <div
        className="marquee-track flex gap-10 sm:gap-14 will-change-transform group-hover:[animation-play-state:paused]"
        style={{
          animation: `marquee ${duration}s linear infinite ${reverse ? "reverse" : ""}`,
        }}
      >
        {[...items, ...items, ...items].map((item, i) => (
          <span
            key={i}
            className="shrink-0 inline-flex items-center gap-10 sm:gap-14 text-xs sm:text-sm uppercase tracking-[0.3em] text-linen"
          >
            <span className="font-display italic text-linen/70 normal-case tracking-normal text-base sm:text-lg" aria-hidden>
              ❦
            </span>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
