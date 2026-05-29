import { Link } from "wouter";
import { motion } from "motion/react";
import { useMagnetic } from "../hooks/useMagnetic";
import { cn } from "../lib/utils";

interface Props {
  href: string;
  className?: string;
  children: React.ReactNode;
}

/** A wouter Link wrapped with magnetic pull (desktop only). */
export function MagneticLink({ href, className, children }: Props) {
  const { ref, x, y } = useMagnetic();
  return (
    <motion.span style={{ x, y, display: "inline-block" }}>
      <Link
        href={href}
        ref={ref as React.Ref<HTMLAnchorElement>}
        className={cn(className)}
      >
        {children}
      </Link>
    </motion.span>
  );
}
