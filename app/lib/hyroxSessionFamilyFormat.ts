/**
 * Display formatters for StructuredWorkout — derived strings only; AST remains SoT.
 */

import type {
  IntervalBlock,
  RecoverySpec,
  RecoveryType,
  StructuredWorkout,
  WorkSpec,
} from "@/app/lib/hyroxSessionFamilyTypes";

const RECOVERY_LABEL: Record<RecoveryType, string> = {
  walk: "walk",
  jog: "jog",
  easy_move: "easy move",
  passive: "passive",
};

/**
 * Durations: prefer "2 min" for whole minutes ≥ 2; keep sub-2-minute whole minutes
 * as seconds ("60 sec") so compound recoveries read like coaching copy.
 */
export function formatDurationSeconds(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return `${seconds} sec`;
  if (seconds === 0) return "0 sec";
  if (seconds >= 120 && seconds % 60 === 0) {
    const minutes = seconds / 60;
    return `${minutes} min`;
  }
  if (seconds % 60 === 0 && seconds >= 60) {
    // 60 sec stays "60 sec" (not "1 min") for recovery clarity
    return `${seconds} sec`;
  }
  if (seconds < 60) return `${seconds} sec`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export function formatWorkSpec(work: WorkSpec): string {
  if (work.kind === "time") {
    if (work.value % 60 === 0) {
      const minutes = work.value / 60;
      return minutes === 1 ? "1 min" : `${minutes} min`;
    }
    return formatDurationSeconds(work.value);
  }
  if (work.unit === "km") {
    return work.value === 1 ? "1 km" : `${work.value} km`;
  }
  return `${work.value} m`;
}

export function formatRecoverySpec(recovery: RecoverySpec): string {
  return `${formatDurationSeconds(recovery.durationSeconds)} ${RECOVERY_LABEL[recovery.type]}`;
}

/** Compound recovery: "60 sec walk + 60 sec jog" */
export function formatRecoveries(recoveries: RecoverySpec[]): string {
  if (recoveries.length === 0) return "no recovery";
  return recoveries.map(formatRecoverySpec).join(" + ");
}

export function formatRecoveriesWithSuffix(recoveries: RecoverySpec[]): string {
  if (recoveries.length === 0) return "no recovery";
  if (recoveries.length === 1) {
    return `${formatRecoverySpec(recoveries[0])} recovery`;
  }
  return `${formatRecoveries(recoveries)} recovery`;
}

export function formatRepeatBlock(block: Extract<IntervalBlock, { type: "repeat" }>): string {
  return `${block.reps} × ${formatWorkSpec(block.work)}`;
}

export function formatIntervalBlock(block: IntervalBlock): string {
  switch (block.type) {
    case "repeat": {
      const main = formatRepeatBlock(block);
      const recovery = formatRecoveriesWithSuffix(block.recoveries);
      return `${main} · ${recovery}`;
    }
    case "continuous":
      return `Continuous ${formatWorkSpec(block.work)}`;
    case "station_round":
      return `${block.rounds} rounds · ${block.station.name}`;
    case "strength":
      return block.exercises.map((e) => e.name).join(", ");
    default: {
      const _never: never = block;
      return String(_never);
    }
  }
}

export function formatStructuredWorkoutSummary(workout: StructuredWorkout): string {
  return workout.blocks.map(formatIntervalBlock).join(" | ");
}

export function formatStructuredWorkoutLines(workout: StructuredWorkout): {
  warmup: string[];
  main: string[];
  cooldown: string[];
  guidance: string[];
} {
  return {
    warmup: [...workout.warmup],
    main: workout.blocks.map(formatIntervalBlock),
    cooldown: [...workout.cooldown],
    guidance: [...workout.guidance],
  };
}
