"use client";

import { Check } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { SESSION_STATUS_LABELS, type SessionStatusKey } from "../tokens";
import { usePrefersReducedMotion, vsTransition } from "../motion";

const TONE: Record<SessionStatusKey, string> = {
  upcoming: "text-[var(--h365-text-muted)] border-[var(--h365-border)]",
  completed:
    "text-[var(--h365-background)] bg-[var(--h365-accent)] border-[var(--h365-accent)]",
  partial: "text-[var(--h365-accent)] border-[var(--h365-accent)]/40",
  missed: "text-[var(--h365-danger)] border-[var(--h365-danger)]/40",
  unresolved: "text-[var(--h365-text-muted)] border-[var(--h365-border)]",
};

export function SessionStatusPill({
  status,
  className,
}: {
  status: SessionStatusKey;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const label = SESSION_STATUS_LABELS[status];
  return (
    <motion.span
      layout={!reduced}
      key={status}
      initial={reduced ? false : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={vsTransition(reduced, 0.16)}
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full border px-2.5 label-caps",
        TONE[status],
        className
      )}
    >
      {status === "completed" ? (
        <Check className="size-3" aria-hidden />
      ) : (
        <span
          className={cn(
            "size-1.5 rounded-full",
            status === "partial" ? "bg-[var(--h365-accent)]" : "bg-[var(--h365-text-muted)]/60"
          )}
          aria-hidden
        />
      )}
      {label}
    </motion.span>
  );
}
