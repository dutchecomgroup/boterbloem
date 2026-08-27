import { cn } from "../lib/utils";

interface Props {
  items: string[];
  className?: string;
  /** Duration in seconds for one full cycle. */
  duration?: number;
  /** Reverse direction. */
  reverse?: boolean;
}

/** CSS-only horizontal marquee. Pauses on hover. Duplicates content so loop is seamless. */
export function Marquee({ items, className, duration = 40, reverse = false }: Props) {
  return (
    <div
      className={cn(
        "marquee group relative overflow-hidden border-y border-sage/20 bg-linen py-4 sm:py-5",
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
            className="shrink-0 inline-flex items-center gap-10 sm:gap-14 text-xs sm:text-sm uppercase tracking-[0.3em] text-charcoal/70"
          >
            <span className="font-display italic text-sage-dark normal-case tracking-normal text-base sm:text-lg">
              ❦
            </span>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
