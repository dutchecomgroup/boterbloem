import { ReactNode } from "react";
import { useReveal } from "../hooks/useReveal";
import { cn } from "../lib/utils";

interface Props {
  children: ReactNode;
  className?: string;
  /** Delay in ms before the reveal kicks in (for staggered effects). */
  delay?: number;
  /** Override the threshold for intersection. */
  threshold?: number;
  /** Use a different HTML tag (default div). */
  as?: "div" | "section" | "article";
}

/** Subtle fade + 8px lift when scrolled into view. */
export function Reveal({ children, className, delay = 0, threshold = 0.15, as = "div" }: Props) {
  const { ref, visible } = useReveal<HTMLDivElement>(threshold);
  const Tag = as as "div";
  return (
    <Tag
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
        className,
      )}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
    >
      {children}
    </Tag>
  );
}
