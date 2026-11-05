"use client";

import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion, vsTransition } from "../motion";

export function RollingValue({
  value,
  className,
}: {
  value: string | number;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  if (reduced) {
    return <span className={cn("inline-block num", className)}>{value}</span>;
  }
  return (
    <span className={cn("relative inline-flex overflow-hidden align-bottom num", className)}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={String(value)}
          initial={{ y: "55%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-55%", opacity: 0 }}
          transition={vsTransition(false, 0.18)}
          className="inline-block"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
