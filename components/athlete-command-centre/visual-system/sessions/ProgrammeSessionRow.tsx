"use client";

import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SessionStatusPill } from "../primitives/StatusPill";
import { CompactWorkoutPreview } from "../workout/CompactWorkoutPreview";
import { usePrefersReducedMotion, vsTransition, VS_DURATION } from "../motion";
import type { AthleteSessionCardViewModel } from "./sessionCardTypes";

/**
 * Dense Programme session row — Home visual language, list density.
 * Full Home hero is reserved for Home; Programme stays scannable.
 */
export function ProgrammeSessionRow({
  session,
  onOpen,
  onLog,
  className,
}: {
  session: AthleteSessionCardViewModel;
  onOpen: () => void;
  onLog?: () => void;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const meta = [session.categoryLabel, session.focusLabel].filter(Boolean).join(" · ");
  const showTimeline = Boolean(session.timeline?.segments.length);

  return (
    <motion.article
      data-programme-session={session.id}
      initial={reduced ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={vsTransition(reduced, VS_DURATION.normal)}
      className={cn(
        "rounded-xl border border-[var(--h365-border)] bg-[var(--h365-surface)]",
        className
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        className="group flex w-full min-h-11 flex-col gap-3 px-3.5 py-3.5 text-left outline-none transition-colors hover:bg-[var(--h365-surface-raised)]/35 focus-visible:ring-2 focus-visible:ring-[var(--h365-accent)] sm:px-4"
      >
        <div className="flex items-start gap-3">
          <span className="min-w-0 flex-1">
            <span className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--h365-text-muted)]">
                {meta}
              </span>
              <SessionStatusPill status={session.status} />
            </span>
            <span className="mt-1.5 block font-display text-[17px] font-semibold uppercase leading-tight tracking-wide text-[var(--h365-text)]">
              {session.title}
            </span>
            {session.primaryTarget ? (
              <span className="mt-1 block text-lg font-bold tabular-nums leading-none text-[var(--h365-text)] num">
                {session.primaryTarget}
              </span>
            ) : null}
            {(session.durationLabel || session.objective) && (
              <span className="mt-1.5 block text-xs text-[var(--h365-text-muted)] num">
                {[session.durationLabel, session.objective].filter(Boolean).join(" · ")}
              </span>
            )}
          </span>
          <ArrowUpRight
            className="mt-1 size-4 shrink-0 text-[var(--h365-text-muted)] transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden
          />
        </div>

        {showTimeline && session.timeline ? (
          <CompactWorkoutPreview
            timeline={session.timeline}
            showLoadSummary={false}
            className="opacity-95"
          />
        ) : null}
      </button>

      {onLog ? (
        <div className="flex border-t border-[var(--h365-border)] px-3.5 py-2 sm:px-4">
          <button
            type="button"
            onClick={onLog}
            className="inline-flex min-h-11 items-center text-xs font-semibold text-[var(--h365-accent)]"
          >
            Log result
          </button>
        </div>
      ) : null}
    </motion.article>
  );
}
