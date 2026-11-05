"use client";

import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkoutTimelineSegment } from "@/app/lib/visual-system/workoutTimelineViewModel";
import { RollingValue } from "../primitives/RollingValue";
import { usePrefersReducedMotion, vsTransition } from "../motion";

function fmtClock(totalSec: number) {
  const s = Math.round(totalSec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function Field({
  label,
  value,
  unit,
  big,
  accent,
}: {
  label: string;
  value: string;
  unit?: string;
  big?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <dt className="label-caps text-[var(--h365-text-muted)]">{label}</dt>
      <dd
        className={cn(
          "num leading-none",
          big
            ? "font-display text-[28px] font-semibold sm:text-3xl"
            : "text-[15px] font-medium",
          accent ? "text-[var(--h365-accent)]" : "text-[var(--h365-text)]"
        )}
      >
        <RollingValue value={value} />
        {unit ? (
          <span className="ml-1 font-sans text-xs font-normal text-[var(--h365-text-muted)]">
            {unit}
          </span>
        ) : null}
      </dd>
    </div>
  );
}

export function WorkoutSegmentDetail({
  segments,
  selectedId,
  onSelect,
}: {
  segments: WorkoutTimelineSegment[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const reduced = usePrefersReducedMotion();
  const idx = Math.max(
    0,
    segments.findIndex((s) => s.id === selectedId)
  );
  const seg = segments[idx];
  if (!seg) {
    return (
      <p className="text-sm text-[var(--h365-text-muted)]">No segment selected.</p>
    );
  }

  const workGroup = segments.filter((s) => s.kind === "work");
  const posInGroup =
    seg.kind === "work"
      ? workGroup.findIndex((s) => s.id === seg.id) + 1
      : null;
  const next = segments[idx + 1];
  const nextLabel = next
    ? next.kind === "recovery"
      ? next.durationSec != null
        ? `${fmtClock(next.durationSec)} recovery`
        : "Recovery"
      : `${next.label}${next.durationSec != null ? ` · ${fmtClock(next.durationSec)}` : ""}`
    : "Session complete";

  const isWork = seg.kind === "work";

  return (
    <section
      aria-live="polite"
      aria-label="Selected interval"
      className="flex flex-col gap-5"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span
            className={cn(
              "label-caps",
              isWork ? "text-[var(--h365-accent)]" : "text-[var(--h365-text-muted)]"
            )}
          >
            <RollingValue value={isWork ? "Interval" : "Recovery"} />
          </span>
          {posInGroup != null ? (
            <span className="font-display text-3xl font-semibold leading-none num sm:text-4xl">
              <RollingValue value={String(posInGroup).padStart(2, "0")} />
              <span className="text-[var(--h365-text-muted)]">
                {" "}
                / {String(workGroup.length).padStart(2, "0")}
              </span>
            </span>
          ) : (
            <span className="font-display text-3xl font-semibold leading-none num">
              {seg.label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => idx > 0 && onSelect(segments[idx - 1].id)}
            disabled={idx === 0}
            aria-label="Previous segment"
            className="grid size-9 place-items-center rounded-full border border-[var(--h365-border)] text-[var(--h365-text)] transition-colors hover:bg-[var(--h365-surface-raised)] disabled:opacity-30"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() =>
              idx < segments.length - 1 && onSelect(segments[idx + 1].id)
            }
            disabled={idx === segments.length - 1}
            aria-label="Next segment"
            className="grid size-9 place-items-center rounded-full border border-[var(--h365-border)] text-[var(--h365-text)] transition-colors hover:bg-[var(--h365-surface-raised)] disabled:opacity-30"
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-5">
        {seg.durationSec != null ? (
          <Field label="Duration" value={fmtClock(seg.durationSec)} big />
        ) : null}
        {seg.targetPace ? (
          <Field label="Target pace" value={seg.targetPace} big accent={isWork} />
        ) : seg.targetWatts ? (
          <Field label="Target" value={seg.targetWatts} unit="W" big accent={isWork} />
        ) : seg.targetSplit ? (
          <Field label="Target split" value={seg.targetSplit} big accent={isWork} />
        ) : null}
        {seg.distanceLabel ? (
          <Field label="Distance" value={seg.distanceLabel} />
        ) : null}
        <Field label="Then" value={nextLabel} />
        {seg.startOffsetSec != null ? (
          <Field label="Starts at" value={`T+ ${fmtClock(seg.startOffsetSec)}`} />
        ) : null}
        {seg.station ? <Field label="Station" value={seg.station} /> : null}
        {seg.load ? <Field label="Load" value={seg.load} /> : null}
        {seg.reps != null ? <Field label="Reps" value={String(seg.reps)} /> : null}
        {seg.recoveryLabel ? (
          <Field label="Recovery" value={seg.recoveryLabel} />
        ) : null}
      </dl>

      {seg.cue ? (
        <div className="relative min-h-12 overflow-hidden border-t border-[var(--h365-border)] pt-4">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={seg.id}
              initial={reduced ? false : { opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduced ? undefined : { opacity: 0, x: -8 }}
              transition={vsTransition(reduced, 0.16)}
              className="text-pretty text-sm leading-relaxed text-[var(--h365-text-muted)]"
            >
              <span className="text-[var(--h365-text)]">Cue — </span>
              {seg.cue}
            </motion.p>
          </AnimatePresence>
        </div>
      ) : null}
    </section>
  );
}
