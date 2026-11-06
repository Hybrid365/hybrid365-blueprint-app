"use client";

import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SessionStatusPill } from "../primitives/StatusPill";
import { AthleteCoachNote } from "../primitives/CoachNote";
import { CompactWorkoutPreview } from "../workout/CompactWorkoutPreview";
import { usePrefersReducedMotion, vsTransition, VS_DURATION } from "../motion";
import type { AthleteSessionCardViewModel } from "./sessionCardTypes";

function statusLine(status: AthleteSessionCardViewModel["status"]): string | null {
  if (status === "completed") return "Completed";
  if (status === "partial") return "Modified";
  if (status === "missed") return "Missed";
  return null;
}

/**
 * Primary Home session hero — v0 SessionPreview hierarchy + live timeline/CTA.
 */
export function PrimarySessionCard({
  session,
  onOpen,
  className,
}: {
  session: AthleteSessionCardViewModel;
  onOpen?: () => void;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const statusText = statusLine(session.status);
  const metaBits = [
    session.categoryLabel,
    session.focusLabel,
    statusText,
  ].filter(Boolean);

  return (
    <motion.article
      data-home-d-session={session.id}
      data-home-d-primary=""
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={vsTransition(reduced, VS_DURATION.reveal)}
      className={cn(
        "overflow-hidden rounded-xl border border-[var(--h365-border)] bg-[var(--h365-surface)]",
        className
      )}
    >
      <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--h365-text-muted)]">
            {metaBits.join(" · ")}
          </p>
          <SessionStatusPill status={session.status} />
        </div>

        <div className="flex flex-col gap-1.5">
          <h3 className="font-display text-[22px] font-bold uppercase leading-[0.95] tracking-tight text-balance text-[var(--h365-text)] sm:text-[26px]">
            {session.title}
          </h3>
          {session.primaryTarget ? (
            <p className="text-[22px] font-bold tabular-nums leading-none tracking-tight text-[var(--h365-text)] num sm:text-[26px]">
              {session.primaryTarget}
            </p>
          ) : null}
          {session.prescriptionLine ? (
            <p className="mt-0.5 text-sm tabular-nums text-[var(--h365-text-muted)] num">
              {session.prescriptionLine}
            </p>
          ) : null}
          {session.durationLabel ? (
            <p className="text-xs text-[var(--h365-text-muted)] num">{session.durationLabel}</p>
          ) : null}
        </div>

        {session.timeline?.segments.length ? (
          <CompactWorkoutPreview timeline={session.timeline} />
        ) : null}

        {session.objective ? (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--h365-text-muted)]">
              Objective
            </p>
            <p className="mt-1.5 text-pretty text-sm leading-relaxed text-[var(--h365-text)]/90">
              {session.objective}
            </p>
          </div>
        ) : null}

        {session.coachNote ? (
          <AthleteCoachNote note={session.coachNote} label="Session cue" />
        ) : null}
      </div>

      {onOpen ? (
        <div className="border-t border-[var(--h365-border)] p-4 sm:p-5">
          <button
            type="button"
            onClick={onOpen}
            className="group flex h-12 w-full items-center justify-between rounded-lg bg-[var(--h365-accent)] px-4 text-sm font-semibold text-[var(--h365-background)] transition-transform duration-150 active:scale-[0.99]"
          >
            {session.status === "completed" ? "Review session" : "Open session"}
            <ArrowUpRight
              className="size-4 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden
            />
          </button>
        </div>
      ) : null}
    </motion.article>
  );
}
