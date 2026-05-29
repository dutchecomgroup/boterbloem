import { cn } from "../../lib/utils";

interface Props {
  className?: string;
  color?: string;
  size?: number;
}

/** A larger ornamental floral cluster, suitable as a hero corner accent. */
export function FloralFrame({ className, color = "text-gold/25", size = 280 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 280 280"
      fill="none"
      aria-hidden="true"
      className={cn("pointer-events-none", color, className)}
    >
      {/* main flowing stem */}
      <path
        d="M20 40 C 80 50, 140 100, 180 180 C 200 220, 220 250, 250 270"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />
      {/* secondary stem */}
      <path
        d="M40 60 C 80 90, 100 130, 110 170"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />
      {/* large leaves along main stem */}
      <path d="M50 60 C 70 50, 90 55, 100 70 C 88 78, 65 75, 50 60 Z" fill="currentColor" opacity="0.55" />
      <path d="M90 95 C 115 88, 135 95, 145 110 C 130 118, 105 115, 90 95 Z" fill="currentColor" opacity="0.5" />
      <path d="M140 140 C 165 132, 185 140, 195 158 C 180 165, 155 162, 140 140 Z" fill="currentColor" opacity="0.45" />
      <path d="M180 195 C 200 188, 220 195, 230 210 C 215 218, 195 215, 180 195 Z" fill="currentColor" opacity="0.4" />
      {/* small leaves */}
      <ellipse cx="65" cy="78" rx="6" ry="3" fill="currentColor" opacity="0.5" transform="rotate(30 65 78)" />
      <ellipse cx="105" cy="118" rx="6" ry="3" fill="currentColor" opacity="0.5" transform="rotate(40 105 118)" />
      <ellipse cx="150" cy="170" rx="6" ry="3" fill="currentColor" opacity="0.45" transform="rotate(50 150 170)" />

      {/* flowers — boterbloem style with 5 petals */}
      <g>
        {[
          { cx: 110, cy: 85, r: 14 },
          { cx: 165, cy: 130, r: 12 },
          { cx: 215, cy: 180, r: 11 },
        ].map((f, i) => (
          <g key={i} transform={`translate(${f.cx} ${f.cy})`} opacity="0.75">
            {[0, 72, 144, 216, 288].map((angle) => (
              <ellipse
                key={angle}
                cx="0"
                cy={-f.r * 0.7}
                rx={f.r * 0.45}
                ry={f.r * 0.7}
                fill="currentColor"
                transform={`rotate(${angle})`}
              />
            ))}
            <circle r={f.r * 0.3} fill="currentColor" opacity="0.9" />
          </g>
        ))}
      </g>
    </svg>
  );
}
