import { cn } from "../../lib/utils";

type Position = "tl" | "tr" | "bl" | "br";

interface Props {
  position?: Position;
  className?: string;
  color?: string;
}

const ROTATIONS: Record<Position, string> = {
  tl: "rotate-0",
  tr: "rotate-90",
  br: "rotate-180",
  bl: "-rotate-90",
};

const POSITIONS: Record<Position, string> = {
  tl: "top-0 left-0",
  tr: "top-0 right-0",
  br: "bottom-0 right-0",
  bl: "bottom-0 left-0",
};

/** Decorative botanical sprig in a corner. Default w-20 sm:w-28; override via className. */
export function BotanicalCorner({
  position = "tl",
  className,
  color = "text-gold/40",
}: Props) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "absolute pointer-events-none w-20 h-20 sm:w-28 sm:h-28",
        POSITIONS[position],
        ROTATIONS[position],
        color,
        className,
      )}
    >
      <svg viewBox="0 0 120 120" fill="none" className="w-full h-full">
        <path
          d="M10 10 C 30 15, 50 35, 60 65 C 65 80, 70 95, 75 110"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          fill="none"
        />
        <path d="M20 18 C 28 12, 38 14, 42 22 C 38 26, 28 24, 20 18 Z" fill="currentColor" opacity="0.6" />
        <path d="M32 35 C 42 30, 52 34, 56 42 C 50 46, 40 44, 32 35 Z" fill="currentColor" opacity="0.55" />
        <path d="M48 60 C 58 55, 68 60, 72 68 C 65 72, 55 70, 48 60 Z" fill="currentColor" opacity="0.5" />
        <path d="M58 85 C 68 82, 78 87, 82 95 C 75 98, 65 95, 58 85 Z" fill="currentColor" opacity="0.45" />
        <g opacity="0.7">
          <circle cx="68" cy="48" r="3" fill="currentColor" />
          <circle cx="62" cy="44" r="2.5" fill="currentColor" />
          <circle cx="74" cy="44" r="2.5" fill="currentColor" />
          <circle cx="62" cy="52" r="2.5" fill="currentColor" />
          <circle cx="74" cy="52" r="2.5" fill="currentColor" />
        </g>
      </svg>
    </div>
  );
}
