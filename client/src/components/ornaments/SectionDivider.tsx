import { cn } from "../../lib/utils";

interface Props {
  /** Color of the wave/curve (the *top* section's background, bleeding down). */
  color?: string;
  variant?: "wave" | "asymmetric" | "scallop";
  /** Flip vertically so the curve points up instead of down. */
  flip?: boolean;
  className?: string;
}

/** Organic SVG divider between sections. Render at the boundary, the SVG bleeds into the next section. */
export function SectionDivider({ color = "fill-linen", variant = "wave", flip = false, className }: Props) {
  return (
    <div className={cn("relative pointer-events-none w-full leading-none -mt-px", className)}>
      <svg
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        className={cn("block w-full h-12 sm:h-16 md:h-20", color, flip && "rotate-180")}
        aria-hidden="true"
      >
        {variant === "wave" && (
          <path d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z" />
        )}
        {variant === "asymmetric" && (
          <path d="M0,30 C360,80 720,10 1080,50 C1260,70 1380,75 1440,60 L1440,80 L0,80 Z" />
        )}
        {variant === "scallop" && (
          <path d="M0,40 Q120,80 240,40 Q360,0 480,40 Q600,80 720,40 Q840,0 960,40 Q1080,80 1200,40 Q1320,0 1440,40 L1440,80 L0,80 Z" />
        )}
      </svg>
    </div>
  );
}
