import { ReactNode } from "react";
import { motion, type Variants } from "motion/react";
import { cn } from "../lib/utils";

interface Props {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** Stagger child motion elements with this gap (s). Children must be motion.* */
  staggerChildren?: number;
  as?: "div" | "section" | "article" | "ul";
  /** Lift in px. Default 12 — editorial-rustig. */
  lift?: number;
}

/** Editorial fade + lift on enter view (one-shot). Respects prefers-reduced-motion. */
export function Reveal({
  children,
  className,
  delay = 0,
  staggerChildren,
  as = "div",
  lift = 12,
}: Props) {
  const variants: Variants = {
    hidden: { opacity: 0, y: lift },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1],
        delay: delay / 1000,
        ...(staggerChildren ? { staggerChildren, delayChildren: delay / 1000 } : {}),
      },
    },
  };

  const Tag = motion[as as "div"];

  return (
    <Tag
      className={cn(className)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      variants={variants}
    >
      {children}
    </Tag>
  );
}

export const childReveal: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};
