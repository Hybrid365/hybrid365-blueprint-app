"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type {
  AthleteHomeDInsight,
  AthleteHomeDProgressMetric,
  AthleteHomeDWeekContext,
  AthleteHomeDCoachContext,
} from "@/app/lib/hyroxAthleteHomeDViewModel";
import { AthleteCoachNote } from "../primitives/CoachNote";
import { usePrefersReducedMotion, vsTransition, VS_DURATION } from "../motion";

function formatMinutes(total: number | null | undefined): string {
  if (total == null || !Number.isFinite(total) || total <= 0) return "—";
  const m = Math.round(total);
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h <= 0) return `${r} min`;
  if (r === 0) return `${h}h`;
  return `${h}h ${r}m`;
}

/**
 * Right-rail / below-fold insights — v0 HomeDInsights visual pattern
 * with real programme + benchmark fields only.
 */
export function HomeInsightsPanel({
  coachContext,
  weekContext,
  performanceInsight,
  progressSnapshot,
  compact = false,
  className,
}: {
  coachContext: AthleteHomeDCoachContext | null;
  weekContext: AthleteHomeDWeekContext | null;
  performanceInsight: AthleteHomeDInsight | null;
  progressSnapshot: AthleteHomeDProgressMetric[] | null;
  compact?: boolean;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const hasWeek = Boolean(weekContext && weekContext.plannedSessions > 0);
  const hasPerf = Boolean(performanceInsight);
  const hasProgress = Boolean(progressSnapshot?.length);
  const hasCoach = Boolean(coachContext);

  if (!hasWeek && !hasPerf && !hasProgress && !hasCoach) return null;

  return (
    <motion.section
      data-home-d-insights=""
      initial={reduced ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={vsTransition(reduced, VS_DURATION.reveal)}
      className={className}
    >
      {hasCoach && coachContext ? (
        <div className={compact ? "mb-8" : "mb-6"}>
          <AthleteCoachNote
            note={coachContext.body}
            label={coachContext.title || "Week strategy"}
          />
        </div>
      ) : null}

      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--h365-accent)]/90">
        My insights
      </p>
      <p className="mt-1 text-xs text-[var(--h365-text-muted)]">
        From your published week and logged benchmarks.
      </p>

      {hasWeek && weekContext ? (
        <div className="mt-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--h365-text-muted)]">
            This week
          </p>
          <p className="mt-2 text-4xl font-bold tabular-nums tracking-tight text-[var(--h365-text)] num">
            {weekContext.completedSessions}
            <span className="text-2xl font-semibold text-[var(--h365-text-muted)]">
              {" "}
              / {weekContext.plannedSessions}
            </span>
          </p>
          <p className="mt-1 text-xs text-[var(--h365-text-muted)]">Sessions complete</p>

          <div
            className={`mt-6 grid gap-6 ${compact ? "grid-cols-1" : "grid-cols-2"}`}
          >
            {weekContext.plannedDurationMinutes != null ? (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--h365-text-muted)]">
                  Planned time
                </p>
                <p className="mt-2 text-2xl font-bold tabular-nums text-[var(--h365-text)] num">
                  {formatMinutes(weekContext.plannedDurationMinutes)}
                </p>
                <p className="mt-1 text-xs text-[var(--h365-text-muted)]">
                  {weekContext.sessionsWithDuration} of {weekContext.plannedSessions} with
                  duration
                </p>
              </div>
            ) : null}

            {weekContext.modalityCounts.length ? (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--h365-text-muted)]">
                  Modalities
                </p>
                <ul className="mt-2 space-y-1.5">
                  {weekContext.modalityCounts.slice(0, 4).map((m) => (
                    <li
                      key={m.label}
                      className="flex items-baseline justify-between gap-2 text-sm"
                    >
                      <span className="truncate text-[var(--h365-text)]">{m.label}</span>
                      <span className="tabular-nums text-[var(--h365-text-muted)] num">
                        {m.count}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {hasPerf && performanceInsight ? (
        <div className="mt-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--h365-text-muted)]">
            {performanceInsight.label}
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-[var(--h365-text)] num">
            {performanceInsight.value}
          </p>
          {performanceInsight.detail ? (
            <p className="mt-1 text-xs text-[var(--h365-text-muted)]">
              {performanceInsight.detail}
            </p>
          ) : (
            <p className="mt-1 text-xs text-[var(--h365-text-muted)]">Latest logged</p>
          )}
          <Link
            href="/athlete/benchmarks"
            className="mt-2 inline-flex min-h-11 items-center text-xs font-semibold text-[var(--h365-accent)]"
          >
            View Performance
          </Link>
        </div>
      ) : null}

      {hasProgress && progressSnapshot?.length ? (
        <div className="mt-8">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--h365-text-muted)]">
              Progress
            </p>
            <Link
              href="/athlete/progress"
              className="text-[11px] font-semibold text-[var(--h365-accent)]"
            >
              View
            </Link>
          </div>
          <ul className="mt-3 space-y-2">
            {progressSnapshot.map((m) => (
              <li key={m.label}>
                <p className="text-xs text-[var(--h365-text-muted)]">{m.label}</p>
                <p className="text-sm font-semibold tabular-nums num text-[var(--h365-text)]">
                  {m.from} → {m.to}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </motion.section>
  );
}

export function homeInsightsHasContent(opts: {
  coachContext: AthleteHomeDCoachContext | null;
  weekContext: AthleteHomeDWeekContext | null;
  performanceInsight: AthleteHomeDInsight | null;
  progressSnapshot: AthleteHomeDProgressMetric[] | null;
}): boolean {
  return Boolean(
    opts.coachContext ||
      (opts.weekContext && opts.weekContext.plannedSessions > 0) ||
      opts.performanceInsight ||
      (opts.progressSnapshot && opts.progressSnapshot.length > 0)
  );
}
