/**
 * StructuredWorkout → athlete-safe WorkoutTimelineViewModel.
 * Batch 0: repeat + continuous only. Never invents zones, pace, or distance.
 */

import type {
  IntervalBlock,
  RecoverySpec,
  StructuredWorkout,
  WorkSpec,
} from "@/app/lib/hyroxSessionFamilyTypes";

export type TimelineSegmentKind = "work" | "recovery";

export type TimelineModality =
  | "run"
  | "walk"
  | "jog"
  | "ski"
  | "row"
  | "bike"
  | "station"
  | "strength"
  | "other";

export type WorkoutTimelineSegment = {
  id: string;
  kind: TimelineSegmentKind;
  modality: TimelineModality;
  /** Seconds when known from WorkSpec/RecoverySpec; null if unknown. */
  durationSec: number | null;
  /** Derived start offset when every prior segment has duration; else null. */
  startOffsetSec: number | null;
  /** Display label e.g. R01 / Rec */
  label: string;
  /** Athlete-facing cue — never internal notes. */
  cue: string | null;
  targetPace: string | null;
  targetWatts: string | null;
  targetSplit: string | null;
  distanceLabel: string | null;
  reps: number | null;
  station: string | null;
  load: string | null;
  recoveryLabel: string | null;
};

export type WorkoutTimelineSupport =
  | "supported"
  | "partial"
  | "unsupported";

export type WorkoutTimelineViewModel = {
  support: WorkoutTimelineSupport;
  /** Human-readable gaps for lab / future expansion. */
  unsupportedReasons: string[];
  segments: WorkoutTimelineSegment[];
  /** Sum of known durations only; null if any segment lacks duration. */
  totalDurationSec: number | null;
  /** True when every segment has durationSec (proportional layout allowed). */
  canProportionByDuration: boolean;
};

export type WorkoutTimelineOptions = {
  /** Optional athlete-facing cues keyed by segment id after expand. */
  cuesBySegmentId?: Record<string, string>;
  /** Optional primary target strings applied to work segments (already athlete-safe). */
  workTarget?: {
    pace?: string | null;
    watts?: string | null;
    split?: string | null;
  };
  /**
   * Work-segment modality. Required for honest presentation — callers must infer
   * from real session/family data. Defaults to "other" (never invents "run").
   */
  workModality?: TimelineModality;
};

function workDurationSec(work: WorkSpec): number | null {
  if (work.kind === "time" && work.unit === "sec" && Number.isFinite(work.value)) {
    return work.value;
  }
  return null;
}

function workDistanceLabel(work: WorkSpec): string | null {
  if (work.kind !== "distance" || !Number.isFinite(work.value)) return null;
  if (work.unit === "km") return `${work.value} km`;
  if (work.unit === "m") return `${work.value} m`;
  return null;
}

function recoveryModality(type: RecoverySpec["type"]): TimelineModality {
  if (type === "walk") return "walk";
  if (type === "jog") return "jog";
  if (type === "easy_move") return "other";
  return "other";
}

function applyOffsets(segments: WorkoutTimelineSegment[]): WorkoutTimelineSegment[] {
  let t = 0;
  let ok = true;
  return segments.map((s) => {
    if (!ok || s.durationSec == null) {
      ok = false;
      return { ...s, startOffsetSec: null };
    }
    const start = t;
    t += s.durationSec;
    return { ...s, startOffsetSec: start };
  });
}

function expandRepeat(
  block: Extract<IntervalBlock, { type: "repeat" }>,
  blockIndex: number,
  opts: WorkoutTimelineOptions
): { segments: WorkoutTimelineSegment[]; reasons: string[] } {
  const reasons: string[] = [];
  if (block.recoveries.length > 1) {
    reasons.push(
      "compound recoveries (multiple RecoverySpec) are not expanded in Batch 0 — using first recovery only between reps"
    );
  }
  const recovery = block.recoveries[0] ?? null;
  const segments: WorkoutTimelineSegment[] = [];
  const workDur = workDurationSec(block.work);
  const dist = workDistanceLabel(block.work);
  const workModality = opts.workModality ?? "other";

  for (let i = 0; i < block.reps; i++) {
    const id = `b${blockIndex}-w${i + 1}`;
    segments.push({
      id,
      kind: "work",
      modality: workModality,
      durationSec: workDur,
      startOffsetSec: null,
      label: `R${String(i + 1).padStart(2, "0")}`,
      cue: opts.cuesBySegmentId?.[id] ?? null,
      targetPace: opts.workTarget?.pace ?? null,
      targetWatts: opts.workTarget?.watts ?? null,
      targetSplit: opts.workTarget?.split ?? null,
      distanceLabel: dist,
      reps: null,
      station: null,
      load: null,
      recoveryLabel: null,
    });
    if (i < block.reps - 1 && recovery) {
      const rid = `b${blockIndex}-r${i + 1}`;
      segments.push({
        id: rid,
        kind: "recovery",
        modality: recoveryModality(recovery.type),
        durationSec: Number.isFinite(recovery.durationSeconds)
          ? recovery.durationSeconds
          : null,
        startOffsetSec: null,
        label: "Rec",
        cue: opts.cuesBySegmentId?.[rid] ?? recovery.note ?? null,
        targetPace: null,
        targetWatts: null,
        targetSplit: null,
        distanceLabel: null,
        reps: null,
        station: null,
        load: null,
        recoveryLabel: `${recovery.type} · ${recovery.durationSeconds}s`,
      });
    }
  }
  return { segments, reasons };
}

function expandContinuous(
  block: Extract<IntervalBlock, { type: "continuous" }>,
  blockIndex: number,
  opts: WorkoutTimelineOptions
): WorkoutTimelineSegment {
  const id = `b${blockIndex}-c1`;
  return {
    id,
    kind: "work",
    modality: opts.workModality ?? "other",
    durationSec: workDurationSec(block.work),
    startOffsetSec: null,
    label: "Work",
    cue: opts.cuesBySegmentId?.[id] ?? null,
    targetPace: opts.workTarget?.pace ?? null,
    targetWatts: opts.workTarget?.watts ?? null,
    targetSplit: opts.workTarget?.split ?? null,
    distanceLabel: workDistanceLabel(block.work),
    reps: null,
    station: null,
    load: null,
    recoveryLabel: null,
  };
}

/**
 * Pure adapter. Missing data stays null. Unsupported blocks do not fabricate segments.
 */
export function buildWorkoutTimelineViewModel(
  workout: StructuredWorkout | null | undefined,
  opts: WorkoutTimelineOptions = {}
): WorkoutTimelineViewModel {
  if (!workout) {
    return {
      support: "unsupported",
      unsupportedReasons: ["no StructuredWorkout provided"],
      segments: [],
      totalDurationSec: null,
      canProportionByDuration: false,
    };
  }

  const reasons: string[] = [];
  if (workout.warmup?.length) {
    reasons.push("warmup string[] is not timed in Batch 0");
  }
  if (workout.cooldown?.length) {
    reasons.push("cooldown string[] is not timed in Batch 0");
  }

  const segments: WorkoutTimelineSegment[] = [];
  let hasSupported = false;
  let hasUnsupportedBlock = false;

  workout.blocks.forEach((block, bi) => {
    if (block.type === "repeat") {
      hasSupported = true;
      const expanded = expandRepeat(block, bi, opts);
      reasons.push(...expanded.reasons);
      segments.push(...expanded.segments);
      return;
    }
    if (block.type === "continuous") {
      hasSupported = true;
      segments.push(expandContinuous(block, bi, opts));
      return;
    }
    hasUnsupportedBlock = true;
    if (block.type === "station_round") {
      reasons.push(`block[${bi}] station_round unsupported in Batch 0`);
    } else if (block.type === "strength") {
      reasons.push(`block[${bi}] strength unsupported in Batch 0`);
    } else {
      reasons.push(`block[${bi}] unknown type unsupported`);
    }
  });

  const withOffsets = applyOffsets(segments);
  const allHaveDuration = withOffsets.every((s) => s.durationSec != null);
  const totalDurationSec = allHaveDuration
    ? withOffsets.reduce((a, s) => a + (s.durationSec as number), 0)
    : null;

  let support: WorkoutTimelineSupport = "unsupported";
  if (hasSupported && !hasUnsupportedBlock) support = "supported";
  else if (hasSupported) support = "partial";

  return {
    support,
    unsupportedReasons: reasons,
    segments: withOffsets,
    totalDurationSec,
    canProportionByDuration: allHaveDuration && withOffsets.length > 0,
  };
}
