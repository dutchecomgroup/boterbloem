import { cn } from "../../lib/utils";

interface Props {
  className?: string;
  opacity?: number;
}

/**
 * Tileable subtle botanical SVG pattern, fixed position behind content.
 * Use as an absolutely-positioned inset-0 layer inside a relative container.
 */
export function BotanicalPattern({ className, opacity = 0.05 }: Props) {
  return (
    <svg
      aria-hidden="true"
      className={cn("absolute inset-0 w-full h-full pointer-events-none text-gold", className)}
      style={{ opacity }}
    >
      <defs>
        <pattern id="bot-pat" width="160" height="160" patternUnits="userSpaceOnUse">
          {/* main sprig */}
          <path
            d="M30 30 C 50 40, 60 60, 70 90 C 75 105, 80 120, 90 130"
            stroke="currentColor"
            strokeWidth="0.7"
            fill="none"
            opacity="0.9"
          />
          <path d="M40 45 C 50 40, 60 45, 64 53 C 56 56, 46 53, 40 45 Z" fill="currentColor" opacity="0.7" />
          <path d="M55 70 C 65 65, 75 70, 79 78 C 71 81, 61 78, 55 70 Z" fill="currentColor" opacity="0.6" />
          {/* small flower */}
          <g transform="translate(86 108)" opacity="0.8">
            {[0, 72, 144, 216, 288].map((a) => (
              <ellipse key={a} cx="0" cy="-6" rx="2.5" ry="5" fill="currentColor" transform={`rotate(${a})`} />
            ))}
            <circle r="2.2" fill="currentColor" />
          </g>
          {/* second cluster - offset */}
          <path
            d="M120 110 C 130 120, 140 130, 145 145"
            stroke="currentColor"
            strokeWidth="0.6"
            fill="none"
            opacity="0.7"
          />
          <path d="M125 122 C 132 118, 140 122, 142 128 C 137 130, 130 128, 125 122 Z" fill="currentColor" opacity="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#bot-pat)" />
    </svg>
  );
}
