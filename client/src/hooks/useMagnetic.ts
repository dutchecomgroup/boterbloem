import { useEffect, useRef } from "react";
import { useMotionValue, useSpring, type MotionValue } from "motion/react";
import { isFinePointer, prefersReducedMotion } from "../lib/prefersReducedMotion";

interface Result {
  ref: React.RefObject<HTMLAnchorElement | HTMLButtonElement | null>;
  x: MotionValue<number>;
  y: MotionValue<number>;
}

/**
 * Magnetic effect: element subtly drifts toward cursor when mouse approaches.
 * Returns ref + motion values to bind to the element's style.
 */
export function useMagnetic(maxPull = 8, radius = 100): Result {
  const ref = useRef<HTMLAnchorElement | HTMLButtonElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 18 });
  const sy = useSpring(y, { stiffness: 200, damping: 18 });

  useEffect(() => {
    if (prefersReducedMotion() || !isFinePointer()) return;
    const el = ref.current;
    if (!el) return;

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      const effectiveRadius = Math.max(rect.width, rect.height) / 2 + radius;
      if (dist > effectiveRadius) {
        x.set(0);
        y.set(0);
        return;
      }
      const strength = 1 - dist / effectiveRadius;
      x.set((dx / effectiveRadius) * maxPull * strength * 2);
      y.set((dy / effectiveRadius) * maxPull * strength * 2);
    };
    const onLeave = () => {
      x.set(0);
      y.set(0);
    };

    window.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [maxPull, radius, x, y]);

  return { ref, x: sx, y: sy };
}
