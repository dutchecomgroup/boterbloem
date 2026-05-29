import { useEffect, useRef } from "react";
import { isFinePointer, prefersReducedMotion } from "../lib/prefersReducedMotion";
import { cn } from "../lib/utils";

interface Props {
  className?: string;
  /** Radius in px */
  size?: number;
  /** 0..1 */
  opacity?: number;
  color?: string;
}

/**
 * Pointer-tracking radial gold glow. Mounted as an absolute-positioned layer
 * inside a relative parent. Pure CSS gradient with CSS variables driven by JS.
 */
export function MouseSpotlight({
  className,
  size = 500,
  opacity = 0.18,
  color = "200, 165, 96",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion() || !isFinePointer()) return;
    const el = ref.current;
    if (!el) return;
    const parent = el.parentElement;
    if (!parent) return;

    let raf = 0;
    let nextX = 0;
    let nextY = 0;
    let pending = false;
    const onMove = (e: PointerEvent) => {
      const rect = parent.getBoundingClientRect();
      nextX = e.clientX - rect.left;
      nextY = e.clientY - rect.top;
      if (!pending) {
        pending = true;
        raf = requestAnimationFrame(() => {
          el.style.setProperty("--mx", `${nextX}px`);
          el.style.setProperty("--my", `${nextY}px`);
          pending = false;
        });
      }
    };
    const onEnter = () => {
      el.style.opacity = "1";
    };
    const onLeave = () => {
      el.style.opacity = "0";
    };

    parent.addEventListener("pointermove", onMove);
    parent.addEventListener("pointerenter", onEnter);
    parent.addEventListener("pointerleave", onLeave);
    return () => {
      parent.removeEventListener("pointermove", onMove);
      parent.removeEventListener("pointerenter", onEnter);
      parent.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 transition-opacity duration-500 opacity-0",
        className,
      )}
      style={{
        background: `radial-gradient(${size}px circle at var(--mx, 50%) var(--my, 50%), rgba(${color}, ${opacity}), transparent 60%)`,
      }}
    />
  );
}
