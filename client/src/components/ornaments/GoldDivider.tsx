import { cn } from "../../lib/utils";

interface Props {
  className?: string;
  /** Color utility class for the line + ornament. Default gold. */
  color?: string;
}

/** Horizontal hairline with a small flower in the middle. */
export function GoldDivider({ className, color = "text-gold" }: Props) {
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
