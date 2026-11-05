"use client";

import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SessionStatusPill } from "../primitives/StatusPill";
import { AthleteCoachNote } from "../primitives/CoachNote";
import { CompactWorkoutPreview } from "../workout/CompactWorkoutPreview";
import type { AthleteSessionCardViewModel } from "./sessionCardTypes";

export function PrimarySessionCard({
  session,
  onOpen,
  className,
}: {
  session: AthleteSessionCardViewModel;
  onOpen?: () => void;
  className?: string;
}) {
  return (
    <article
      data-home-d-session={session.id}
      className={cn(
        "overflow-hidden rounded-xl border border-[var(--h365-border)] bg-[var(--h365-surface)]",
        className
      )}
    >
      <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="label-caps text-[var(--h365-text-muted)]">
            <span className="text-[var(--h365-accent)]">{session.categoryLabel}</span>
            {session.focusLabel ? ` · ${session.focusLabel}` : ""}
          </span>
          <SessionStatusPill status={session.status} />
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="font-display text-[24px] font-bold uppercase leading-[0.95] tracking-tight text-balance text-[var(--h365-text)] sm:text-[30px]">
            {session.title}
          </h3>
          {session.prescriptionLine ? (
            <p className="text-sm text-[var(--h365-text-muted)] num">
              {session.prescriptionLine}
            </p>
          ) : null}
        </div>

        {session.timeline?.segments.length ? (
          <CompactWorkoutPreview timeline={session.timeline} />
        ) : null}
      </div>

      <div className="flex flex-col gap-4 border-t border-[var(--h365-border)] p-5">
        <dl className="flex flex-col gap-3 text-sm">
          {session.primaryTarget ? (
            <div className="grid grid-cols-[7.5rem_1fr] gap-3">
              <dt className="label-caps pt-0.5 text-[var(--h365-text-muted)]">
                Primary target
              </dt>
              <dd className="font-medium text-pretty leading-relaxed text-[var(--h365-text)]">
                {session.primaryTarget}
              </dd>
            </div>
          ) : null}
          {session.durationLabel ? (
            <div className="grid grid-cols-[7.5rem_1fr] gap-3">
              <dt className="label-caps pt-0.5 text-[var(--h365-text-muted)]">Duration</dt>
              <dd className="text-[var(--h365-text)]/85 num">{session.durationLabel}</dd>
            </div>
          ) : null}
          {session.objective ? (
            <div className="grid grid-cols-[7.5rem_1fr] gap-3">
              <dt className="label-caps pt-0.5 text-[var(--h365-text-muted)]">Objective</dt>
              <dd className="text-pretty leading-relaxed text-[var(--h365-text)]/85">
                {session.objective}
              </dd>
            </div>
          ) : null}
        </dl>
        {session.coachNote ? <AthleteCoachNote note={session.coachNote} /> : null}
        {onOpen ? (
          <button
            type="button"
            onClick={onOpen}
            className="group flex h-12 items-center justify-between rounded-lg bg-[var(--h365-accent)] px-4 text-sm font-semibold text-[var(--h365-background)] transition-transform duration-150 active:scale-[0.99]"
          >
            {session.status === "completed" ? "Review session" : "Open session"}
            <ArrowUpRight
              className="size-4 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden
            />
          </button>
        ) : null}
      </div>
    </article>
  );
}
