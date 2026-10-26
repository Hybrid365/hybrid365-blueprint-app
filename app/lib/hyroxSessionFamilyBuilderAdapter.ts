/**
 * StructuredWorkout ↔ CoachSessionEditConfig adapters.
 * StructuredWorkout is source of truth. editConfig carries an additive copy +
 * kind-specific UI fields for the live builder. Round-trip prefers structuredWorkout.
 */

import type { CoachSessionEditConfig, CoachSessionEditKind } from "@/app/lib/hyroxCoachProgrammeDraft";
import {
  formatIntervalBlock,
  formatRecoveries,
  formatRecoveriesWithSuffix,
  formatRepeatBlock,
  formatWorkSpec,
} from "@/app/lib/hyroxSessionFamilyFormat";
import type {
  IntervalBlock,
  RecoverySpec,
  RecoveryType,
  StrengthExerciseSpec,
  StructuredWorkout,
  WorkSpec,
} from "@/app/lib/hyroxSessionFamilyTypes";

export type FamilyCoachSessionEditConfig = CoachSessionEditConfig & {
  structuredRecoveries?: RecoverySpec[];
  /** Additive SoT — preferred for round-trip over reconstructed fields. */
  structuredWorkout?: StructuredWorkout;
  /** Strength exercises when kind is strength_endurance (additive). */
  structuredExercises?: StrengthExerciseSpec[];
};

export type StructuredWorkoutToEditConfigOptions = {
  sessionName: string;
  kind?: CoachSessionEditKind;
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
  derivedRecoveryLabel: string | null;
  gaps: AdapterGap[];
};

const RECOVERY_TYPES = new Set<RecoveryType>(["walk", "jog", "easy_move", "passive"]);

function workToRepDurationMinutes(work: WorkSpec): number | null {
  if (work.kind !== "time" || work.unit !== "sec") return null;
  if (work.value % 60 !== 0) return null;
  return work.value / 60;
}

function cloneWorkout(workout: StructuredWorkout): StructuredWorkout {
  return structuredClone(workout);
}

function inferKind(
  workout: StructuredWorkout,
  preferred?: CoachSessionEditKind
): CoachSessionEditKind {
  if (preferred) return preferred;
  const primary = workout.blocks[0];
  if (!primary) return "generic";
  if (primary.type === "repeat") return "threshold_run";
  if (primary.type === "station_round") return "compromised";
  if (primary.type === "strength") return "strength_endurance";
  if (primary.type === "continuous") return "easy_aerobic";
  return "generic";
}

function recoveriesLabel(recoveries: RecoverySpec[] | undefined): string | null {
  if (!recoveries?.length) return null;
  return formatRecoveriesWithSuffix(recoveries);
}

/**
 * Convert StructuredWorkout → builder editConfig.
 * Always embeds structuredWorkout for lossless round-trip.
 */
export function structuredWorkoutToCoachEditConfig(
  workout: StructuredWorkout,
  options: StructuredWorkoutToEditConfigOptions
): StructuredWorkoutToEditConfigResult {
  const gaps: AdapterGap[] = [];
  const kind = inferKind(workout, options.kind);
  const structuredWorkout = cloneWorkout(workout);
  const mainSetLines = workout.blocks.map(formatIntervalBlock);

  const base: FamilyCoachSessionEditConfig = {
    kind,
    sessionName: options.sessionName,
    objective: options.objective,
    coachNote: options.coachNote,
    rpeTarget: options.rpeTarget,
    warmUpLines: [...workout.warmup],
    coolDownLines: [...workout.cooldown],
    mainSetLines,
    whatToRecord: ["Key metrics", "RPE"],
    coachPacingNote: workout.guidance[0],
    structuredWorkout,
  };

  const primary = workout.blocks[0];
  if (!primary) {
    gaps.push({ code: "empty_blocks", detail: "No structured blocks." });
    return { editConfig: base, derivedRecoveryLabel: null, gaps };
  }

  if (workout.blocks.length > 1) {
    gaps.push({
      code: "multi_block_ui_partial",
      detail:
        "UI kind fields map the first block; full ordering preserved in structuredWorkout.",
    });
  }

  if (primary.type === "repeat") {
    const repDurationMinutes = workToRepDurationMinutes(primary.work);
    if (repDurationMinutes == null) {
      gaps.push({
        code: "non_minute_or_distance_work",
        detail: "Work is not whole-minute time; repDurationMinutes may be omitted.",
      });
    }
    const structuredRecoveries = primary.recoveries.map((r) => ({ ...r }));
    const derivedRecoveryLabel = recoveriesLabel(structuredRecoveries);
    const recoveryText =
      structuredRecoveries.length > 0 ? formatRecoveries(structuredRecoveries) : undefined;

    return {
      editConfig: {
        ...base,
        kind: options.kind ?? "threshold_run",
        reps: primary.reps,
        repDurationMinutes: repDurationMinutes ?? undefined,
        thresholdMinutes:
          options.thresholdMinutes ??
          (repDurationMinutes != null ? primary.reps * repDurationMinutes : undefined),
        structuredRecoveries,
        recovery: recoveryText,
        restRecovery: recoveryText,
        whatToRecord: ["Rep paces", "RPE", "HR if used"],
        rpeTarget: options.rpeTarget ?? "7–8",
        runDistanceM:
          primary.work.kind === "distance" && primary.work.unit === "m"
            ? primary.work.value
            : undefined,
      },
      derivedRecoveryLabel,
      gaps,
    };
  }

  if (primary.type === "station_round") {
    const structuredRecoveries = (primary.recoveries ?? []).map((r) => ({ ...r }));
    const derivedRecoveryLabel = recoveriesLabel(structuredRecoveries);
    const recoveryText =
      structuredRecoveries.length > 0 ? formatRecoveries(structuredRecoveries) : undefined;
    const runMeters =
      primary.run?.kind === "distance" && primary.run.unit === "m" ? primary.run.value : undefined;

    return {
      editConfig: {
        ...base,
        kind: options.kind ?? "compromised",
        rounds: primary.rounds,
        station: primary.station.name,
        stationDetail: primary.station.note,
        runDistanceM: runMeters,
        structuredRecoveries: structuredRecoveries.length ? structuredRecoveries : undefined,
        recovery: recoveryText,
        restRecovery: recoveryText,
        targetPaceLoad: primary.station.note,
        whatToRecord: ["Run splits", "Station notes", "RPE"],
        rpeTarget: options.rpeTarget ?? "7–8",
      },
      derivedRecoveryLabel,
      gaps,
    };
  }

  if (primary.type === "strength") {
    const exercises = primary.exercises.map((e) => ({ ...e }));
    const exercisesLine = exercises
      .map((e) => {
        const setsReps =
          e.sets != null && e.reps != null ? `${e.sets}×${e.reps}` : e.sets != null ? `${e.sets} sets` : "";
        return [e.name, setsReps, e.loadNote, e.rpe ? `RPE ${e.rpe}` : ""]
          .filter(Boolean)
          .join(" · ");
      })
      .join("\n");

    return {
      editConfig: {
        ...base,
        kind: options.kind ?? "strength_endurance",
        exercises: exercisesLine,
        setsReps: exercises
          .map((e) => (e.sets != null && e.reps != null ? `${e.sets}×${e.reps}` : ""))
          .filter(Boolean)
          .join(", "),
        loadRpe: exercises.map((e) => e.loadNote).filter(Boolean).join("; ") || "Coach load",
        structuredExercises: exercises,
        whatToRecord: ["Loads", "RPE", "Notes"],
        rpeTarget: options.rpeTarget ?? "7",
      },
      derivedRecoveryLabel: null,
      gaps,
    };
  }

  if (primary.type === "continuous") {
    const durationMinutes =
      primary.work.kind === "time" ? Math.round(primary.work.value / 60) : undefined;
    return {
      editConfig: {
        ...base,
        kind: options.kind ?? "easy_aerobic",
        durationMinutes,
        whatToRecord: ["Duration", "RPE", "Feel"],
        rpeTarget: options.rpeTarget ?? "4–5",
        coachPacingNote: workout.guidance[0] ?? `Continuous ${formatWorkSpec(primary.work)}`,
      },
      derivedRecoveryLabel: null,
      gaps,
    };
  }

  gaps.push({ code: "unknown_block", detail: "Unhandled block type — structuredWorkout still embedded." });
  return { editConfig: base, derivedRecoveryLabel: null, gaps };
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
 * Fingerprint from coach-editable UI fields only (ignores embedded structuredWorkout).
 * Used for unlink detection and divergence checks.
 */
export function structuralFingerprintFromUiFields(
  config: FamilyCoachSessionEditConfig
): FamilyStructuralFingerprint | null {
  const recoveries = parseRecoveriesFromEditConfig(config) ?? [];
  return {
    kind: config.kind,
    reps: typeof config.reps === "number" ? config.reps : null,
    repDurationMinutes:
      typeof config.repDurationMinutes === "number" ? config.repDurationMinutes : null,
    rounds: typeof config.rounds === "number" ? config.rounds : null,
    runDistanceM: typeof config.runDistanceM === "number" ? config.runDistanceM : null,
    stationName: config.station ?? null,
    exerciseCount: config.structuredExercises?.length ?? null,
    durationMinutes: typeof config.durationMinutes === "number" ? config.durationMinutes : null,
    recoveries: recoveries.map((r) => ({
      durationSeconds: r.durationSeconds,
      type: r.type,
    })),
  };
}

function reconstructStructuredWorkoutFromFields(
  config: FamilyCoachSessionEditConfig
): StructuredWorkout | null {
  if (config.kind === "threshold_run" || config.kind === "erg_interval") {
    if (typeof config.reps !== "number" || config.reps < 1) return null;
    if (typeof config.repDurationMinutes !== "number" || config.repDurationMinutes <= 0) return null;
    const recoveries = parseRecoveriesFromEditConfig(config);
    if (!recoveries) return null;
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

  if (config.kind === "compromised") {
    if (typeof config.rounds !== "number" || config.rounds < 1) return null;
    if (!config.station?.trim()) return null;
    const recoveries = parseRecoveriesFromEditConfig(config) ?? undefined;
    const run: WorkSpec | undefined =
      typeof config.runDistanceM === "number" && config.runDistanceM > 0
        ? { kind: "distance", value: config.runDistanceM, unit: "m" }
        : undefined;
    return {
      warmup: [...(config.warmUpLines ?? [])],
      blocks: [
        {
          type: "station_round",
          rounds: config.rounds,
          run,
          station: { name: config.station, note: config.stationDetail },
          recoveries,
        },
      ],
      cooldown: [...(config.coolDownLines ?? [])],
      guidance: config.coachPacingNote ? [config.coachPacingNote] : [],
    };
  }

  if (config.kind === "strength_endurance") {
    const exercises =
      config.structuredExercises?.length
        ? config.structuredExercises.map((e) => ({ ...e }))
        : null;
    if (!exercises?.length) return null;
    return {
      warmup: [...(config.warmUpLines ?? [])],
      blocks: [{ type: "strength", exercises }],
      cooldown: [...(config.coolDownLines ?? [])],
      guidance: config.coachPacingNote ? [config.coachPacingNote] : [],
    };
  }

  if (config.kind === "easy_aerobic") {
    if (typeof config.durationMinutes !== "number" || config.durationMinutes <= 0) return null;
    return {
      warmup: [...(config.warmUpLines ?? [])],
      blocks: [
        {
          type: "continuous",
          work: { kind: "time", value: config.durationMinutes * 60, unit: "sec" },
        },
      ],
      cooldown: [...(config.coolDownLines ?? [])],
      guidance: config.coachPacingNote ? [config.coachPacingNote] : [],
    };
  }

  return null;
}

/**
 * Prefer embedded structuredWorkout when UI fields still match (lossless).
 * If coach-edited UI fields diverge, rebuild from those fields.
 */
export function coachEditConfigToStructuredWorkout(
  config: FamilyCoachSessionEditConfig
): StructuredWorkout | null {
  if (config.structuredWorkout?.blocks?.length) {
    const embeddedFp = structuralFingerprintFromWorkout(
      config.structuredWorkout,
      config.kind
    );
    const uiFp = structuralFingerprintFromUiFields(config);
    if (
      embeddedFp &&
      uiFp &&
      fingerprintsEqual(embeddedFp, uiFp)
    ) {
      return cloneWorkout(config.structuredWorkout);
    }
    // Fall through — UI structure changed; rebuild so SoT matches coach edit.
  }
  return reconstructStructuredWorkoutFromFields(config);
}

/** Deep structural equality for round-trip QA (order-sensitive). */
export function structuredWorkoutsEqual(a: StructuredWorkout, b: StructuredWorkout): boolean {
  return JSON.stringify(normalizeWorkout(a)) === JSON.stringify(normalizeWorkout(b));
}

function normalizeWorkout(w: StructuredWorkout): StructuredWorkout {
  return {
    warmup: [...w.warmup],
    blocks: w.blocks.map(normalizeBlock),
    cooldown: [...w.cooldown],
    guidance: [...w.guidance],
  };
}

function normalizeBlock(block: IntervalBlock): IntervalBlock {
  if (block.type === "repeat") {
    return {
      type: "repeat",
      reps: block.reps,
      work: { ...block.work },
      recoveries: block.recoveries.map((r) => ({
        durationSeconds: r.durationSeconds,
        type: r.type,
        ...(r.note ? { note: r.note } : {}),
      })),
    };
  }
  if (block.type === "continuous") {
    return { type: "continuous", work: { ...block.work } };
  }
  if (block.type === "station_round") {
    return {
      type: "station_round",
      rounds: block.rounds,
      ...(block.run ? { run: { ...block.run } } : {}),
      station: { name: block.station.name, ...(block.station.note ? { note: block.station.note } : {}) },
      ...(block.recoveries
        ? {
            recoveries: block.recoveries.map((r) => ({
              durationSeconds: r.durationSeconds,
              type: r.type,
              ...(r.note ? { note: r.note } : {}),
            })),
          }
        : {}),
    };
  }
  return {
    type: "strength",
    exercises: block.exercises.map((e) => ({
      name: e.name,
      ...(e.sets != null ? { sets: e.sets } : {}),
      ...(e.reps != null ? { reps: e.reps } : {}),
      ...(e.loadNote ? { loadNote: e.loadNote } : {}),
      ...(e.rpe ? { rpe: e.rpe } : {}),
    })),
  };
}

export type FamilyStructuralFingerprint = {
  kind: CoachSessionEditKind;
  reps: number | null;
  repDurationMinutes: number | null;
  rounds: number | null;
  runDistanceM: number | null;
  stationName: string | null;
  exerciseCount: number | null;
  durationMinutes: number | null;
  recoveries: RecoverySpec[];
};

export function structuralFingerprintFromWorkout(
  workout: StructuredWorkout,
  kind: CoachSessionEditKind = "threshold_run"
): FamilyStructuralFingerprint | null {
  const primary = workout.blocks[0];
  if (!primary) return null;
  if (primary.type === "repeat") {
    return {
      kind,
      reps: primary.reps,
      repDurationMinutes: workToRepDurationMinutes(primary.work),
      rounds: null,
      runDistanceM: primary.work.kind === "distance" && primary.work.unit === "m" ? primary.work.value : null,
      stationName: null,
      exerciseCount: null,
      durationMinutes: null,
      recoveries: primary.recoveries.map((r) => ({
        durationSeconds: r.durationSeconds,
        type: r.type,
      })),
    };
  }
  if (primary.type === "station_round") {
    return {
      kind,
      reps: null,
      repDurationMinutes: null,
      rounds: primary.rounds,
      runDistanceM:
        primary.run?.kind === "distance" && primary.run.unit === "m" ? primary.run.value : null,
      stationName: primary.station.name,
      exerciseCount: null,
      durationMinutes: null,
      recoveries: (primary.recoveries ?? []).map((r) => ({
        durationSeconds: r.durationSeconds,
        type: r.type,
      })),
    };
  }
  if (primary.type === "strength") {
    return {
      kind,
      reps: null,
      repDurationMinutes: null,
      rounds: null,
      runDistanceM: null,
      stationName: null,
      exerciseCount: primary.exercises.length,
      durationMinutes: null,
      recoveries: [],
    };
  }
  if (primary.type === "continuous") {
    return {
      kind,
      reps: null,
      repDurationMinutes: null,
      rounds: null,
      runDistanceM: null,
      stationName: null,
      exerciseCount: null,
      durationMinutes:
        primary.work.kind === "time" ? Math.round(primary.work.value / 60) : null,
      recoveries: [],
    };
  }
  return null;
}

export function structuralFingerprintFromEditConfig(
  config: FamilyCoachSessionEditConfig
): FamilyStructuralFingerprint | null {
  // Unlink detection must follow coach-edited UI fields, not a stale embedded AST.
  return structuralFingerprintFromUiFields(config);
}

export function fingerprintsEqual(
  a: FamilyStructuralFingerprint,
  b: FamilyStructuralFingerprint
): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
