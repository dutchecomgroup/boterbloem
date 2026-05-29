import { motion, type Variants } from "motion/react";
import { cn } from "../lib/utils";

interface Props {
  text: string;
  /** Split by character (default) or by word. */
  by?: "char" | "word";
  className?: string;
  /** ms between elements */
  stagger?: number;
  delay?: number;
  lift?: number;
  /** Render as a span (default) or block-level element */
  as?: "span" | "div";
}

/** Letter- or word-by-word reveal with stagger. Wrap in <h1> or styled parent. */
export function SplitText({
  text,
  by = "char",
  className,
  stagger = 30,
  delay = 0,
  lift = 24,
  as = "span",
}: Props) {
  const tokens = by === "word" ? text.split(/(\s+)/) : Array.from(text);

  const container: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: stagger / 1000,
        delayChildren: delay / 1000,
      },
    },
  };

  const child: Variants = {
    hidden: { opacity: 0, y: lift },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const Tag = motion[as as "span"];

  return (
    <Tag
      className={cn("inline-block", className)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      variants={container}
      aria-label={text}
    >
      {tokens.map((t, i) => {
        if (/^\s+$/.test(t)) return <span key={i}>{t}</span>;
        return (
          <motion.span key={i} variants={child} className="inline-block" aria-hidden="true">
            {t}
          </motion.span>
        );
      })}
    </Tag>
  );
}
