"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import type { WorkoutTimelineViewModel } from "@/app/lib/visual-system/workoutTimelineViewModel";
import { usePrefersReducedMotion, vsTransition } from "../motion";

function fmtClock(totalSec: number) {
  const s = Math.round(totalSec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function blockTone(kind: "work" | "recovery", modality: string) {
  if (kind === "recovery") return "bg-[var(--h365-recovery)]";
  if (modality === "station") return "bg-[var(--h365-text)]";
  return "bg-[var(--h365-accent)]";
}

export function CompactWorkoutPreview({
  timeline,
  className,
}: {
  timeline: WorkoutTimelineViewModel;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const segs = timeline.segments;
  if (!segs.length) return null;

  const work = segs.filter((s) => s.kind === "work");
  const lead = work[0];
  const equalFlex = !timeline.canProportionByDuration;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
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

      <div className="relative">
        <div
          className="relative flex h-12 items-end gap-0.5"
          role="img"
          aria-label={`Workout structure: ${segs.length} segments`}
        >
          {segs.map((s, i) => (
            <motion.div
              key={s.id}
              className={cn("origin-bottom rounded-[2px]", blockTone(s.kind, s.modality))}
              style={{
                flexGrow: equalFlex ? 1 : s.durationSec ?? 1,
                flexBasis: 0,
                height: s.kind === "work" ? "82%" : "36%",
              }}
              initial={reduced ? false : { scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              transition={vsTransition(reduced, 0.32 + i * 0.01)}
            />
          ))}
        </div>
        <div className="mt-1 h-px bg-[var(--h365-border)]" />
      </div>
      {!timeline.canProportionByDuration ? (
        <p className="text-[10px] text-[var(--h365-text-muted)]">
          Durations incomplete — equal-width preview (not proportional).
        </p>
      ) : null}
    </div>
  );
}
