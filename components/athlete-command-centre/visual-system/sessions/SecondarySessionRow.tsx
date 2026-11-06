"use client";

import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SessionStatusPill } from "../primitives/StatusPill";
import { usePrefersReducedMotion, vsTransition, VS_DURATION } from "../motion";
import type { AthleteSessionCardViewModel } from "./sessionCardTypes";

function statusSuffix(status: AthleteSessionCardViewModel["status"]): string | null {
  if (status === "completed") return "Completed";
  if (status === "partial") return "Modified";
  if (status === "missed") return "Missed";
  return null;
}

/**
 * Compact secondary session — closer to v0 SessionPreview density.
 */
export function SecondarySessionRow({
  session,
  onOpen,
  className,
}: {
  session: AthleteSessionCardViewModel;
  onOpen?: () => void;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const statusText = statusSuffix(session.status);
  const meta = [session.categoryLabel, session.focusLabel, statusText]
    .filter(Boolean)
    .join(" · ");

  const body = (
    <>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--h365-text-muted)]">
            {meta}
          </span>
          <SessionStatusPill status={session.status} />
        </span>
        <span className="mt-1.5 block font-display text-base font-semibold uppercase leading-tight tracking-wide text-[var(--h365-text)]">
          {session.title}
        </span>
        {session.primaryTarget ? (
          <span className="mt-1 block text-lg font-bold tabular-nums leading-none text-[var(--h365-text)] num">
            {session.primaryTarget}
          </span>
        ) : null}
        {session.prescriptionLine || session.durationLabel ? (
          <span className="mt-1.5 block truncate text-xs text-[var(--h365-text-muted)] num">
            {[session.prescriptionLine, session.durationLabel].filter(Boolean).join(" · ")}
          </span>
        ) : null}
      </span>
      {onOpen ? (
        <ArrowUpRight
          className="mt-1 size-4 shrink-0 text-[var(--h365-text-muted)] transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          aria-hidden
        />
      ) : null}
    </>
  );

  return (
    <motion.article
      data-home-d-session={session.id}
      data-home-d-secondary=""
      initial={reduced ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={vsTransition(reduced, VS_DURATION.normal)}
      className={cn(
        "rounded-xl border border-[var(--h365-border)] bg-[var(--h365-surface)]/80",
        className
      )}
    >
      {onOpen ? (
        <button
          type="button"
          onClick={onOpen}
          className="group flex w-full min-h-11 items-start gap-3 px-4 py-3.5 text-left outline-none transition-colors hover:bg-[var(--h365-surface-raised)]/40 focus-visible:ring-2 focus-visible:ring-[var(--h365-accent)]"
        >
          {body}
        </button>
      ) : (
        <div className="flex w-full min-h-11 items-start gap-3 px-4 py-3.5">{body}</div>
      )}
    </motion.article>
  );
}
