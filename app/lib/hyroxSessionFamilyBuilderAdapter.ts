/**
 * StructuredWorkout ↔ CoachSessionEditConfig adapters (slice 2).
 * Pure. Not wired to live builder UX.
 */

import type { CoachSessionEditConfig } from "@/app/lib/hyroxCoachProgrammeDraft";
import {
  formatIntervalBlock,
  formatRecoveries,
  formatRecoveriesWithSuffix,
  formatRepeatBlock,
} from "@/app/lib/hyroxSessionFamilyFormat";
import type {
  RecoverySpec,
  RecoveryType,
  StructuredWorkout,
  WorkSpec,
} from "@/app/lib/hyroxSessionFamilyTypes";

export type FamilyCoachSessionEditConfig = CoachSessionEditConfig & {
  structuredRecoveries?: RecoverySpec[];
};

export type StructuredWorkoutToEditConfigOptions = {
  sessionName: string;
  kind?: CoachSessionEditConfig["kind"];
  objective?: string;
  coachNote?: string;
  rpeTarget?: string;
  thresholdMinutes?: number;
};

export type AdapterGap = {
  code: string;
  detail: string;
};

export type StructuredWorkoutToEditConfigResult = {
  editConfig: FamilyCoachSessionEditConfig;
  /** Derived display recovery string for legacy fields — structuredRecoveries remain SoT. */
  derivedRecoveryLabel: string | null;
  gaps: AdapterGap[];
};

const RECOVERY_TYPES = new Set<RecoveryType>(["walk", "jog", "easy_move", "passive"]);

function workToRepDurationMinutes(work: WorkSpec): number | null {
  if (work.kind !== "time" || work.unit !== "sec") return null;
  if (work.value % 60 !== 0) return null;
  return work.value / 60;
}

/**
 * Convert StructuredWorkout → existing builder editConfig.
 * Threshold repeat pilot converts losslessly for reps / duration / structured recoveries.
 */
export function structuredWorkoutToCoachEditConfig(
  workout: StructuredWorkout,
  options: StructuredWorkoutToEditConfigOptions
): StructuredWorkoutToEditConfigResult {
  const gaps: AdapterGap[] = [];
  const repeat = workout.blocks.find((b) => b.type === "repeat");

  if (!repeat || repeat.type !== "repeat") {
    gaps.push({
      code: "no_repeat_block",
      detail: "Pilot adapter expects a repeat block; falling back to generic mainSetLines.",
    });
    return {
      editConfig: {
        kind: options.kind ?? "generic",
        sessionName: options.sessionName,
        objective: options.objective,
        coachNote: options.coachNote,
        rpeTarget: options.rpeTarget,
        warmUpLines: [...workout.warmup],
        coolDownLines: [...workout.cooldown],
        mainSetLines: workout.blocks.map(formatIntervalBlock),
        whatToRecord: ["Rep paces", "RPE", "HR if used"],
      },
      derivedRecoveryLabel: null,
      gaps,
    };
  }

  const repDurationMinutes = workToRepDurationMinutes(repeat.work);
  if (repDurationMinutes == null) {
    gaps.push({
      code: "non_minute_work",
      detail: "Work duration is not whole minutes; repDurationMinutes omitted.",
    });
  }

  if (repeat.work.kind === "distance") {
    gaps.push({
      code: "distance_work",
      detail: "Distance-based work is not mapped to threshold_run repDurationMinutes.",
    });
  }

  const structuredRecoveries = repeat.recoveries.map((r) => ({ ...r }));
  const derivedRecoveryLabel =
    structuredRecoveries.length > 0 ? formatRecoveriesWithSuffix(structuredRecoveries) : null;

  // Legacy free-text fields filled for current UI — must not be treated as SoT when structuredRecoveries present.
  const recoveryText =
    structuredRecoveries.length === 1
      ? formatRecoveries(structuredRecoveries)
      : structuredRecoveries.length > 1
        ? formatRecoveries(structuredRecoveries)
        : undefined;

  if (workout.blocks.length > 1) {
    gaps.push({
      code: "multi_block",
      detail: "Only the first repeat block maps into reps/recovery fields; other blocks stay in mainSetLines.",
    });
  }

  const mainSetLines = [
    `${formatRepeatBlock(repeat)}${derivedRecoveryLabel ? `; ${derivedRecoveryLabel}` : ""}`,
    ...workout.blocks.filter((b) => b !== repeat).map(formatIntervalBlock),
  ];

  const editConfig: FamilyCoachSessionEditConfig = {
    kind: options.kind ?? "threshold_run",
    sessionName: options.sessionName,
    objective: options.objective,
    coachNote: options.coachNote,
    rpeTarget: options.rpeTarget ?? "7–8",
    reps: repeat.reps,
    repDurationMinutes: repDurationMinutes ?? undefined,
    thresholdMinutes: options.thresholdMinutes ?? (repDurationMinutes != null ? repeat.reps * repDurationMinutes : undefined),
    structuredRecoveries,
    recovery: recoveryText,
    restRecovery: recoveryText,
    warmUpLines: [...workout.warmup],
    coolDownLines: [...workout.cooldown],
    mainSetLines,
    whatToRecord: ["Rep paces", "RPE", "HR if used"],
    coachPacingNote: workout.guidance[0],
  };

  return { editConfig, derivedRecoveryLabel, gaps };
}

function parseRecoveriesFromEditConfig(config: FamilyCoachSessionEditConfig): RecoverySpec[] | null {
  if (Array.isArray(config.structuredRecoveries) && config.structuredRecoveries.length > 0) {
    const out: RecoverySpec[] = [];
    for (const r of config.structuredRecoveries) {
      if (
        typeof r?.durationSeconds !== "number" ||
        !RECOVERY_TYPES.has(r.type as RecoveryType)
      ) {
        return null;
      }
      out.push({
        durationSeconds: r.durationSeconds,
        type: r.type as RecoveryType,
        note: r.note,
      });
    }
    return out;
  }
  return null;
}

/**
 * Round-trip helper for family-generated threshold configs.
 * Returns null when config is not a family-compatible threshold repeat.
 */
export function coachEditConfigToStructuredWorkout(
  config: FamilyCoachSessionEditConfig
): StructuredWorkout | null {
  if (config.kind !== "threshold_run") return null;
  if (typeof config.reps !== "number" || config.reps < 1) return null;
  if (typeof config.repDurationMinutes !== "number" || config.repDurationMinutes <= 0) return null;

  const recoveries = parseRecoveriesFromEditConfig(config);
  if (!recoveries) {
    // Cannot losslessly recover compound recovery from free text alone.
    return null;
  }

  return {
    warmup: [...(config.warmUpLines ?? [])],
    blocks: [
      {
        type: "repeat",
        reps: config.reps,
        work: { kind: "time", value: config.repDurationMinutes * 60, unit: "sec" },
        recoveries,
      },
    ],
    cooldown: [...(config.coolDownLines ?? [])],
    guidance: config.coachPacingNote ? [config.coachPacingNote] : [],
  };
}

/** Structural fingerprint used for unlink decisions (threshold-focused v1). */
export type FamilyStructuralFingerprint = {
  kind: CoachSessionEditConfig["kind"];
  reps: number | null;
  repDurationMinutes: number | null;
  recoveries: RecoverySpec[];
};

export function structuralFingerprintFromWorkout(
  workout: StructuredWorkout,
  kind: CoachSessionEditConfig["kind"] = "threshold_run"
): FamilyStructuralFingerprint | null {
  const repeat = workout.blocks.find((b) => b.type === "repeat");
  if (!repeat || repeat.type !== "repeat") return null;
  const minutes = workToRepDurationMinutes(repeat.work);
  return {
    kind,
    reps: repeat.reps,
    repDurationMinutes: minutes,
    recoveries: repeat.recoveries.map((r) => ({
      durationSeconds: r.durationSeconds,
      type: r.type,
    })),
  };
}

export function structuralFingerprintFromEditConfig(
  config: FamilyCoachSessionEditConfig
): FamilyStructuralFingerprint | null {
  const recoveries = parseRecoveriesFromEditConfig(config);
  if (!recoveries) return null;
  return {
    kind: config.kind,
    reps: typeof config.reps === "number" ? config.reps : null,
    repDurationMinutes:
      typeof config.repDurationMinutes === "number" ? config.repDurationMinutes : null,
    recoveries: recoveries.map((r) => ({
      durationSeconds: r.durationSeconds,
      type: r.type,
    })),
  };
}

export function fingerprintsEqual(
  a: FamilyStructuralFingerprint,
  b: FamilyStructuralFingerprint
): boolean {
  if (a.kind !== b.kind) return false;
  if (a.reps !== b.reps) return false;
  if (a.repDurationMinutes !== b.repDurationMinutes) return false;
  if (a.recoveries.length !== b.recoveries.length) return false;
  return a.recoveries.every(
    (r, i) =>
      r.durationSeconds === b.recoveries[i].durationSeconds && r.type === b.recoveries[i].type
  );
}
