"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import {
  summarizeWorkoutLoad,
  type WorkoutTimelineViewModel,
} from "@/app/lib/visual-system/workoutTimelineViewModel";
import { usePrefersReducedMotion, vsTransition, VS_DURATION } from "../motion";

function fmtClock(totalSec: number) {
  const s = Math.round(totalSec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function fmtLoad(totalSec: number) {
  const s = Math.round(totalSec);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (r === 0) return `${m}m`;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function blockTone(kind: "work" | "recovery", modality: string) {
  if (kind === "recovery") return "bg-zinc-700";
  if (modality === "station") return "bg-[var(--h365-text)]";
  return "bg-[var(--h365-accent)]";
}

/**
 * Compact structure preview — v0 IntervalTimeline heights:
 * work ≈ h-12 gold, recovery ≈ h-5 muted; proportional flex when durations known.
 */
export function CompactWorkoutPreview({
  timeline,
  className,
  showLoadSummary = true,
}: {
  timeline: WorkoutTimelineViewModel;
  className?: string;
  showLoadSummary?: boolean;
}) {
  const reduced = usePrefersReducedMotion();
  const segs = timeline.segments;
  if (!segs.length) return null;

  const work = segs.filter((s) => s.kind === "work");
  const lead = work[0];
  const equalFlex = !timeline.canProportionByDuration;
  const load = showLoadSummary ? summarizeWorkoutLoad(timeline) : null;

  return (
    <div
      data-compact-workout-preview=""
      data-timeline-support={timeline.support}
      data-timeline-segments={segs.length}
      className={cn("flex flex-col gap-2", className)}
    >
      <div className="flex items-baseline justify-between gap-3 text-[11px] text-[var(--h365-text-muted)]">
        <span className="flex items-center gap-2 num">
          {lead?.targetPace ? (
            <span className="font-medium text-[var(--h365-accent)]">{lead.targetPace}</span>
          ) : lead?.distanceLabel ? (
            <span className="font-medium text-[var(--h365-accent)]">{lead.distanceLabel}</span>
          ) : (
            <span className="font-medium text-[var(--h365-text-muted)]">Structure</span>
          )}
        </span>
        <span className="num">
          {timeline.totalDurationSec != null
            ? work.length > 1 && lead?.durationSec != null
              ? `${work.length} × ${fmtClock(lead.durationSec)}`
              : fmtClock(timeline.totalDurationSec)
            : `${segs.length} segments`}
        </span>
      </div>

      <div
        className="relative flex h-12 items-end gap-1"
        role="img"
        aria-label={`Workout structure: ${segs.length} segments`}
      >
        {segs.map((s, i) => (
          <motion.div
            key={s.id}
            data-timeline-segment=""
            data-segment-kind={s.kind}
            data-segment-modality={s.modality}
            title={s.label}
            className={cn(
              "min-w-0 origin-bottom rounded-sm transition-[filter] duration-150 hover:brightness-110",
              blockTone(s.kind, s.modality)
            )}
            style={{
              flexGrow: equalFlex ? 1 : s.durationSec ?? 1,
              flexBasis: 0,
              height: s.kind === "work" ? "100%" : "41.67%", // h-12 vs h-5 of 48px
            }}
            initial={reduced ? false : { scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            transition={vsTransition(reduced, VS_DURATION.reveal + i * 0.012)}
          />
        ))}
      </div>

      {load ? (
        <dl
          data-workout-load-summary=""
          className="mt-1 grid grid-cols-3 gap-2 border-t border-[var(--h365-border)] pt-2"
        >
          {(
            [
              ["Work", load.workSec],
              ["Recovery", load.recoverySec],
              ["Total", load.totalSec],
            ] as const
          ).map(([label, sec]) => (
            <div key={label}>
              <dt className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--h365-text-muted)]">
                {label}
              </dt>
              <dd className="mt-0.5 text-sm font-semibold tabular-nums text-[var(--h365-text)] num">
                {fmtLoad(sec)}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {!timeline.canProportionByDuration ? (
        <p className="text-[10px] text-[var(--h365-text-muted)]">
          Durations incomplete — equal-width preview (not proportional).
        </p>
      ) : null}
    </div>
  );
}
