import { parseTimeToSeconds } from "./mapAssessmentToProgrammeInput";
import type { BlueprintInput } from "./buildWeekBlueprint";
import type { AbilityLevel, GoalFocus, StructureRole } from "./sessionLibrary";
import type { WeeklyStructure } from "./weeklyStructures";
import { pickWeeklyStructure, WEEKLY_STRUCTURES } from "./weeklyStructures";

export const RUN_VOLUME_BAND_OPTIONS = [
  "0-10km/week",
  "10-20km/week",
  "20-35km/week",
  "35-50km/week",
  "50-70km/week",
  "70km+/week",
] as const;

export type RunVolumeBand = (typeof RUN_VOLUME_BAND_OPTIONS)[number];

export type RunVolumePlan = {
  minRunSessionsPerWeek: number;
  preferredRunSessionsPerWeek: number;
  targetKmMin: number;
  targetKmMax: number;
  conservative: boolean;
  highVolumeAdvanced: boolean;
  structureIdHint: string | null;
  runStructureSummary: string;
  rationaleLine: string;
};

function isRunVolumeBand(v: string | null | undefined): v is RunVolumeBand {
  return Boolean(v && (RUN_VOLUME_BAND_OPTIONS as readonly string[]).includes(v));
}

function bandMidpointKm(band: RunVolumeBand | null): number | null {
  switch (band) {
    case "0-10km/week":
      return 8;
    case "10-20km/week":
      return 15;
    case "20-35km/week":
      return 28;
    case "35-50km/week":
      return 42;
    case "50-70km/week":
      return 58;
    case "70km+/week":
      return 72;
    default:
      return null;
  }
}

function bandMaxKm(band: RunVolumeBand | null): number | null {
  switch (band) {
    case "0-10km/week":
      return 10;
    case "10-20km/week":
      return 20;
    case "20-35km/week":
      return 35;
    case "35-50km/week":
      return 50;
    case "50-70km/week":
      return 70;
    case "70km+/week":
      return 85;
    default:
      return null;
  }
}

function fiveKSeconds(input: BlueprintInput): number | null {
  return parseTimeToSeconds(input.five_k_time ?? null);
}

function isAdvancedRunner(input: BlueprintInput): boolean {
  if (input.ability_level === "advanced") return true;
  const sec = fiveKSeconds(input);
  return sec != null && sec <= 21 * 60;
}

function isHighPerformanceRunner(input: BlueprintInput): boolean {
  const sec = fiveKSeconds(input);
  return sec != null && sec < 16 * 60 + 30;
}

function isRunningPriority(goal: GoalFocus): boolean {
  return goal === "running" || goal === "hybrid";
}

function weekScaleFactor(weekNumber: number, weekFocus?: string | null): number {
  const blockWeek = ((weekNumber - 1) % 4) + 1;
  if (weekFocus?.includes("deload") || blockWeek === 4) return 0.88;
  if (blockWeek === 2) return 1.04;
  if (blockWeek === 3) return 1.08;
  return 1;
}

/** Week-level km targets from athlete profile + optional band. */
export function planWeeklyRunVolume(
  input: BlueprintInput,
  weekNumber = 1,
  weekFocus?: string | null
): RunVolumePlan {
  const band = isRunVolumeBand(input.current_run_volume_band)
    ? input.current_run_volume_band
    : null;
  const injury = Boolean(input.has_injury);
  const goal = input.goal_focus;
  const advanced = isAdvancedRunner(input);
  const hp = isHighPerformanceRunner(input);
  const days = input.days_per_week;
  const doubles = Boolean(input.double_sessions);
  const highHours = input.weekly_hours_band === "7-10" || input.weekly_hours_band === "10+";

  let minRuns = 2;
  let preferredRuns = 3;

  if (input.ability_level === "beginner" || injury) {
    minRuns = injury ? 1 : 2;
    preferredRuns = injury ? 2 : 3;
  } else if (input.ability_level === "intermediate") {
    minRuns = injury ? 2 : 3;
    preferredRuns = injury ? 2 : 4;
  } else   if (advanced) {
    minRuns = injury ? 2 : 4;
    preferredRuns = injury ? 3 : 5;
    if (days >= 6 && highHours && !injury) preferredRuns = 5;
    if (
      days >= 7 &&
      hp &&
      doubles &&
      !injury &&
      (band === "50-70km/week" || band === "70km+/week")
    ) {
      preferredRuns = 6;
    }
    if (input.hyrox_track?.active && !injury) {
      minRuns = Math.max(minRuns, days >= 7 ? 5 : 4);
      preferredRuns = Math.max(preferredRuns, days >= 7 ? 5 : 4);
    }
  }

  if (goal === "muscle") {
    minRuns = Math.min(minRuns, injury ? 1 : 2);
    preferredRuns = Math.min(preferredRuns, injury ? 2 : 3);
  }

  if (!isRunningPriority(goal)) {
    minRuns = Math.min(minRuns, 2);
    preferredRuns = Math.min(preferredRuns, 3);
  }

  let targetMin = 18;
  let targetMax = 28;
  let conservative = true;
  let highVolumeAdvanced = false;

  const midpoint = bandMidpointKm(band);
  const bandCap = bandMaxKm(band);

  if (advanced && days >= 6 && highHours && !injury && isRunningPriority(goal)) {
    highVolumeAdvanced = true;
    if (band === "35-50km/week") {
      targetMin = 35;
      targetMax = 45;
    } else if (band === "50-70km/week") {
      targetMin = 45;
      targetMax = 60;
    } else if (band === "70km+/week") {
      targetMin = 55;
      targetMax = 70;
    } else if (band === "20-35km/week") {
      targetMin = 28;
      targetMax = 38;
    } else if (band === "10-20km/week") {
      targetMin = 22;
      targetMax = 32;
      conservative = true;
    } else {
      targetMin = 35;
      targetMax = 50;
    }
    conservative = Boolean(band && (band === "0-10km/week" || band === "10-20km/week"));
  } else if (advanced && isRunningPriority(goal)) {
    if (midpoint != null) {
      targetMin = Math.round(midpoint * 0.92);
      targetMax = Math.round(midpoint * 1.05);
      if (bandCap != null) targetMax = Math.min(targetMax, bandCap);
    } else {
      const sec = fiveKSeconds(input);
      if (sec != null && sec <= 18 * 60) {
        targetMin = 30;
        targetMax = 42;
      } else {
        targetMin = 24;
        targetMax = 36;
      }
    }
    conservative = Boolean(band && bandMaxKm(band)! <= 20);
  } else if (input.ability_level === "intermediate") {
    if (midpoint != null) {
      targetMin = Math.round(midpoint * 0.9);
      targetMax = Math.round(midpoint * 1.02);
      if (bandCap != null) targetMax = Math.min(targetMax, bandCap);
    } else {
      targetMin = 18;
      targetMax = 28;
    }
  } else {
    if (midpoint != null) {
      targetMin = Math.round(midpoint * 0.85);
      targetMax = Math.round(midpoint * 0.98);
    } else {
      targetMin = 10;
      targetMax = 18;
    }
    conservative = true;
  }

  if (injury) {
    targetMin = Math.round(targetMin * 0.72);
    targetMax = Math.round(targetMax * 0.78);
    conservative = true;
    highVolumeAdvanced = false;
  }

  const scale = weekScaleFactor(weekNumber, weekFocus);
  targetMin = Math.max(8, Math.round(targetMin * scale));
  targetMax = Math.max(targetMin + 4, Math.round(targetMax * scale));

  let structureIdHint: string | null = null;
  if (highVolumeAdvanced && days >= 7 && goal === "hybrid") {
    structureIdHint = "7D-D";
  } else if (highVolumeAdvanced && days >= 6 && goal === "hybrid") {
    structureIdHint = "6D-E";
  } else if (goal === "running" && days >= 7 && advanced) {
    structureIdHint = "7D-B";
  }

  const runStructureSummary = buildRunStructureSummary(preferredRuns, injury, conservative, highVolumeAdvanced);
  const rationaleLine = buildRationaleLine({
    preferredRuns,
    injury,
    conservative,
    highVolumeAdvanced,
    band,
  });

  return {
    minRunSessionsPerWeek: minRuns,
    preferredRunSessionsPerWeek: preferredRuns,
    targetKmMin: targetMin,
    targetKmMax: targetMax,
    conservative,
    highVolumeAdvanced,
    structureIdHint,
    runStructureSummary,
    rationaleLine,
  };
}

function buildRunStructureSummary(
  preferredRuns: number,
  injury: boolean,
  conservative: boolean,
  highVolumeAdvanced: boolean
): string {
  if (injury) {
    return "Running is kept moderate with low-impact swaps available; quality is prioritised over mileage.";
  }
  if (preferredRuns >= 5 && highVolumeAdvanced) {
    return `${preferredRuns} weekly run exposures: threshold, speed/compromised, long run, and supporting aerobic mileage around strength and hybrid work.`;
  }
  if (preferredRuns >= 4) {
    return `${preferredRuns} weekly runs including threshold, intervals or tempo, a long run, and easy aerobic support.`;
  }
  return `${preferredRuns} weekly runs with conservative progression and recovery between quality days.`;
}

function buildRationaleLine(args: {
  preferredRuns: number;
  injury: boolean;
  conservative: boolean;
  highVolumeAdvanced: boolean;
  band: RunVolumeBand | null;
}): string {
  if (args.injury) {
    return "Running volume progresses conservatively from your current baseline to protect recovery, with low-impact alternatives when needed.";
  }
  if (args.conservative || args.band === "0-10km/week" || args.band === "10-20km/week") {
    return "Running volume progresses conservatively from your current baseline to protect recovery.";
  }
  if (args.highVolumeAdvanced) {
    return "Your running load is high enough to support performance, but distributed around strength and hybrid work so quality stays high.";
  }
  if (args.preferredRuns >= 4) {
    return "Your plan includes threshold, speed or compromised, long-run, and aerobic support sessions across the week.";
  }
  return "Running is layered progressively alongside your primary goal without aggressive volume jumps.";
}

export function pickStructureWithRunVolume(
  input: BlueprintInput,
  plan: RunVolumePlan
): WeeklyStructure {
  if (plan.structureIdHint) {
    const hinted = WEEKLY_STRUCTURES.find((s) => s.id === plan.structureIdHint);
    if (hinted && hinted.days_per_week === input.days_per_week) {
      return hinted;
    }
  }

  return pickWeeklyStructure({
    days_per_week: input.days_per_week,
    goal_focus: input.goal_focus,
    ability_level: input.ability_level,
    double_sessions: input.double_sessions,
    weekly_hours_band: input.weekly_hours_band,
    run_volume_plan: plan,
  });
}

/** Adjust roles so run frequency meets plan without exceeding days. */
export function applyRunVolumeToStructureRoles(
  roles: StructureRole[],
  plan: RunVolumePlan,
  input: BlueprintInput
): StructureRole[] {
  const out = [...roles];
  const runRoleCount = (rs: StructureRole[]) =>
    rs.filter((r) =>
      ["run_quality", "run_quality_beginner", "run_aerobic", "run_long"].includes(r)
    ).length;

  let runs = runRoleCount(out);
  const target = Math.min(plan.preferredRunSessionsPerWeek, input.days_per_week);

  while (runs < plan.minRunSessionsPerWeek) {
    const replaceIdx = out.findIndex((r) => r === "aerobic_support" || r === "hybrid_density");
    if (replaceIdx < 0) break;
    out[replaceIdx] = "run_aerobic";
    runs += 1;
  }

  while (runs < target) {
    const replaceIdx = out.findIndex((r) => r === "aerobic_support");
    if (replaceIdx < 0) break;
    out[replaceIdx] = "run_aerobic";
    runs += 1;
  }

  if (input.hyrox_track?.active && input.ability_level === "advanced" && runs < target) {
    const replaceIdx = out.findIndex((r) => r === "recovery");
    if (replaceIdx >= 0) {
      out[replaceIdx] = "run_aerobic";
      runs += 1;
    }
  }

  if (input.hyrox_track?.active && input.ability_level === "advanced" && runs < target) {
    const replaceIdx = out.findIndex((r) => r === "upper_primary" || r === "upper_full");
    if (replaceIdx >= 0) {
      out[replaceIdx] = "run_aerobic";
      runs += 1;
    }
  }

  if (
    plan.highVolumeAdvanced &&
    input.days_per_week >= 6 &&
    runs < target &&
    !out.filter((r) => r === "run_quality").length
  ) {
    /* structure should already include run_quality */
  }

  if (input.goal_focus === "muscle" && runs > 3) {
    return out.map((r) => (r === "run_aerobic" ? "aerobic_support" : r));
  }

  return out;
}

export function countRunExposuresInSchedule(
  schedule: { title: string; tags?: string[] }[]
): number {
  return schedule.filter((d) => {
    const t0 = d.tags?.[0] ?? "";
    const title = d.title.toLowerCase();
    if (
      t0 === "threshold_run" ||
      t0 === "interval_run" ||
      t0 === "long_run" ||
      t0 === "aerobic_run" ||
      t0 === "tempo_run"
    ) {
      return true;
    }
    if (t0 === "hybrid_compromised" || /compromised run|race.?density/i.test(title)) {
      return true;
    }
    if (/easy run|long run|threshold run|aerobic run/i.test(title)) return true;
    return false;
  }).length;
}
