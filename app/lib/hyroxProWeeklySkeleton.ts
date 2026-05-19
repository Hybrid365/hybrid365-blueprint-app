/**
 * Strict HYROX Pro weekly hard/easy skeleton — fixed day roles before session pick.
 */

import type { BlueprintInput } from "./buildWeekBlueprint";
import { resolveHyroxDoublePhase } from "./hyroxDoubleSessionProgression";
import {
  isCompromisedRunExposure,
  isFloatOrIntervalQuality,
  isHardRunExposure,
  isHyroxProAdvancedProfile,
} from "./hyroxRunIntensityPolicy";
import type { DayKey, DayPlan, StructureRole } from "./sessionLibrary";
import { classifyDayPlan } from "./sessionStressClassification";
import { isRunThresholdAnchorDay } from "./thresholdVolumeTracking";

export type HyroxSkeletonDayRole = "recovery" | "hard" | "easy" | "long_aerobic";

export type HyroxSkeletonAssignment = {
  day: DayKey;
  skeleton: HyroxSkeletonDayRole;
  structureRole: StructureRole;
};

const DAY_ORDER: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const SKELETON_7D: Record<DayKey, HyroxSkeletonDayRole> = {
  Mon: "recovery",
  Tue: "hard",
  Wed: "easy",
  Thu: "hard",
  Fri: "easy",
  Sat: "hard",
  Sun: "long_aerobic",
};

const SKELETON_6D: Record<DayKey, HyroxSkeletonDayRole | null> = {
  Mon: "recovery",
  Tue: "hard",
  Wed: "easy",
  Thu: "hard",
  Fri: "easy",
  Sat: "hard",
  Sun: "long_aerobic",
};

export const HYROX_EASY_DAY_BIKE_NOTE =
  "Bike Z2 can replace easy run volume if legs feel heavy. Keep this genuinely easy so the next quality run stays high quality.";

export function shouldUseHyroxProWeeklySkeleton(input: BlueprintInput): boolean {
  return isHyroxProAdvancedProfile(input) && input.days_per_week >= 6;
}

export function skeletonLabel(role: HyroxSkeletonDayRole): string {
  switch (role) {
    case "recovery":
      return "Recovery";
    case "hard":
      return "Hard";
    case "easy":
      return "Easy";
    case "long_aerobic":
      return "Long Aerobic";
  }
}

export function getSkeletonForDay(
  day: DayKey,
  daysPerWeek: number
): HyroxSkeletonDayRole | null {
  if (daysPerWeek >= 7) return SKELETON_7D[day];
  return SKELETON_6D[day];
}

type RolePools = {
  runQuality: StructureRole[];
  runLong: StructureRole[];
  hybridPrimary: StructureRole[];
  hybridDensity: StructureRole[];
  lower: StructureRole[];
  upper: StructureRole[];
  runAerobic: StructureRole[];
  aerobicSupport: StructureRole[];
  recovery: StructureRole[];
  fullBody: StructureRole[];
};

function extractPools(roles: StructureRole[]): RolePools {
  const take = (r: StructureRole) => roles.filter((x) => x === r);
  return {
    runQuality: roles.filter((r) => r === "run_quality" || r === "run_quality_beginner"),
    runLong: take("run_long"),
    hybridPrimary: take("hybrid_primary"),
    hybridDensity: take("hybrid_density"),
    lower: roles.filter((r) => r === "lower_primary" || r === "lower_full"),
    upper: roles.filter((r) => r === "upper_primary" || r === "upper_full"),
    runAerobic: take("run_aerobic"),
    aerobicSupport: take("aerobic_support"),
    recovery: take("recovery"),
    fullBody: take("full_body_strength"),
  };
}

function shift(pool: StructureRole[], fallback: StructureRole): StructureRole {
  return pool.shift() ?? fallback;
}

/** Canonical 7-day HYROX Pro structure — one threshold anchor, no duplicate run_quality slots. */
export function hyroxProSevenDayStructureRoles(): StructureRole[] {
  return [
    "run_quality",
    "lower_primary",
    "aerobic_support",
    "upper_primary",
    "hybrid_primary",
    "run_long",
    "recovery",
  ];
}

/**
 * Map weekly structure roles onto the fixed Mon–Sun skeleton.
 */
export function buildHyroxProSkeletonAssignments(args: {
  input: BlueprintInput;
  structureRoles: StructureRole[];
  weekNumber: number;
  weekFocus?: string | null;
}): HyroxSkeletonAssignment[] | null {
  if (!shouldUseHyroxProWeeklySkeleton(args.input)) return null;

  const pools = extractPools(hyroxProSevenDayStructureRoles());
  const out: HyroxSkeletonAssignment[] = [];

  const assign = (day: DayKey, skeleton: HyroxSkeletonDayRole, role: StructureRole) => {
    out.push({ day, skeleton, structureRole: role });
  };

  assign("Mon", "recovery", shift(pools.recovery, "recovery") || shift(pools.runAerobic, "run_aerobic"));
  assign("Tue", "hard", shift(pools.runQuality, "run_quality"));
  assign(
    "Wed",
    "easy",
    shift(pools.aerobicSupport, "aerobic_support") ||
      shift(pools.runAerobic, "run_aerobic") ||
      shift(pools.upper, "upper_primary")
  );
  assign(
    "Thu",
    "hard",
    shift(pools.lower, "lower_primary") ||
      shift(pools.hybridPrimary, "hybrid_primary") ||
      shift(pools.fullBody, "full_body_strength")
  );
  assign(
    "Fri",
    "easy",
    shift(pools.runAerobic, "run_aerobic") ||
      shift(pools.aerobicSupport, "aerobic_support") ||
      shift(pools.upper, "upper_primary")
  );
  assign(
    "Sat",
    "hard",
    shift(pools.hybridPrimary, "hybrid_primary") ||
      shift(pools.hybridDensity, "hybrid_density") ||
      shift(pools.lower, "lower_primary")
  );
  assign("Sun", "long_aerobic", shift(pools.runLong, "run_long"));

  return out;
}

export function isHeavyLowerOrHyroxLegs(day: DayPlan, role?: StructureRole): boolean {
  const t0 = day.tags?.[0] ?? "";
  const blob = `${day.title} ${day.progression_family ?? ""}`.toLowerCase();
  if (role === "lower_primary" || role === "lower_full") return true;
  if (t0 === "strength_lower" && classifyDayPlan(day, role).session_stress !== "low") return true;
  return /hyrox lower|race.?specific legs|lower strength endurance/i.test(blob);
}

export function isHardStationDensity(day: DayPlan): boolean {
  const blob = `${day.title} ${(day.session?.main ?? []).join(" ")}`.toLowerCase();
  return /race.?density|station density|hyrox density/i.test(blob);
}

export function isLongRunWithHardFinish(day: DayPlan): boolean {
  if (day.tags?.[0] !== "long_run") return false;
  const main = (day.session?.main ?? []).join(" ");
  return /steady finish|progression finish|moderate.?hard|finish.*@ tempo|tempo\s*finish/i.test(main);
}

export function sessionViolatesSkeleton(
  day: DayPlan,
  skeleton: HyroxSkeletonDayRole,
  role?: StructureRole
): boolean {
  const stress = classifyDayPlan(day, role).session_stress;

  if (skeleton === "recovery" || skeleton === "easy") {
    const blob = `${day.title} ${(day.session?.main ?? []).join(" ")}`;
    if (isHardRunExposure(day, role)) return true;
    if (isHeavyLowerOrHyroxLegs(day, role)) return true;
    if (isCompromisedRunExposure(day)) return true;
    if (isHardStationDensity(day)) return true;
    if (/stride|pickup|on\s*\/\s*off|float/i.test(blob)) return true;
    if (stress === "high") return true;
    if (skeleton === "recovery" && stress === "moderate") return true;
    return false;
  }

  if (skeleton === "long_aerobic") {
    if (isHardRunExposure(day, role) && day.tags?.[0] !== "long_run") return true;
    if (isLongRunWithHardFinish(day)) return true;
    if (isCompromisedRunExposure(day)) return true;
    return false;
  }

  return false;
}

/** Tue/Wed/Thu must not all carry run quality (float + intervals + threshold). */
export function hasConsecutiveMidweekRunQuality(schedule: DayPlan[]): boolean {
  const mid = ["Tue", "Wed", "Thu"] as DayKey[];
  let qualityCount = 0;
  for (const day of mid) {
    const d = schedule.find((x) => x.day === day);
    if (!d) continue;
    if (
      isHardRunExposure(d) ||
      isFloatOrIntervalQuality(d) ||
      d.tags?.[0] === "threshold_run" ||
      d.tags?.[0] === "interval_run"
    ) {
      qualityCount += 1;
    }
  }
  return qualityCount >= 3;
}

export function preferredDoubleDaysForSkeleton(
  input: BlueprintInput,
  weekNumber: number,
  weekFocus?: string | null
): DayKey[] {
  const phase = resolveHyroxDoublePhase(
    weekNumber,
    weekFocus,
    input.hyrox_track!.hyrox_event_type
  );
  const preferred = (input.double_session_days ?? [])
    .map((d) => d.trim().slice(0, 3))
    .filter(Boolean);

  const allowed = new Set<DayKey>(["Tue", "Thu", "Sat"]);
  const fromUser = preferred
    .map((p) => {
      const map: Record<string, DayKey> = {
        mon: "Mon",
        tue: "Tue",
        wed: "Wed",
        thu: "Thu",
        fri: "Fri",
        sat: "Sat",
        sun: "Sun",
      };
      return map[p.toLowerCase()] ?? null;
    })
    .filter((d): d is DayKey => d !== null && allowed.has(d));

  if (fromUser.length > 0) return fromUser;

  if (phase === "late_double_threshold") return ["Tue", "Sat"];
  return ["Tue", "Thu", "Sat"];
}

export function skeletonSequenceForPreview(
  schedule: DayPlan[],
  daysPerWeek: number,
  roleByDay?: Map<DayKey, StructureRole>
): string {
  return DAY_ORDER.filter((d) => daysPerWeek >= 7 || d !== "Mon")
    .map((day) => {
      const sk = getSkeletonForDay(day, daysPerWeek);
      if (!sk) return `${day}:—`;
      const plan = schedule.find((x) => x.day === day);
      if (plan && sessionViolatesSkeleton(plan, sk, roleByDay?.get(day))) {
        return `${day}:${skeletonLabel(sk)}⚠`;
      }
      return `${day}:${skeletonLabel(sk)}`;
    })
    .join(" ");
}

export function preserveThresholdAnchor(schedule: DayPlan[]): DayPlan | undefined {
  return schedule.find(isRunThresholdAnchorDay) ?? schedule.find((d) => d.tags?.[0] === "threshold_run");
}
