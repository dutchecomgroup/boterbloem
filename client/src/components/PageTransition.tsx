import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "motion/react";

/** Cross-fade between routes. Skips initial mount to avoid a flash on first load. */
export function PageTransition({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location}
        initial={mounted ? { opacity: 0, y: 8 } : false}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
