import type { ProgrammeContext } from "./programmeRules";
import { getHyroxSession } from "./sessionLibrary";
import {
  deloadThresholdMinutes,
  getSessionSchedulingMetadata,
  isRoleInherentlyHard,
} from "./sessionStress";
import {
  getTuesdayThresholdSessionId,
  getThresholdSessionForWeek,
  isTempoSessionId,
  shouldScheduleThursdayAmTempo,
} from "./thresholdBlockProgression";
import { getStationWeaknessRules, rotateStationFocusForBlock } from "./stationPersonalisation";
import type {
  BlockWeekInCycle,
  DaySlotRole,
  EmomPrescription,
  SchedulingValidationWarning,
  StationWeakness,
  WeeklyDayTemplate,
  WeeklyHoursPlan,
  WeeklyStructureTemplate,
  Weekday,
} from "./types";

const DAY_ORDER: Weekday[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export type ScheduledDaySlot = WeeklyDayTemplate & {
  sessionId?: string | null;
  hardDay: boolean;
  thresholdMinutes: number;
  qualityRunMinutes: number;
  plannedMinutes: number;
  emom?: EmomPrescription | null;
  optionalAmRole?: DaySlotRole;
};

export type WeeklyScheduleBuildOptions = {
  trainingDaysAvailable: number;
  saturdayAvailable?: boolean;
  preferredLongAerobicDay?: Weekday;
  recoveryStatus: ProgrammeContext["recoveryStatus"];
  blockWeek: BlockWeekInCycle;
  stationWeaknesses?: StationWeakness[];
  doubleSessionReadiness?: ProgrammeContext["doubleSessionReadiness"];
  lowerBodySoreness?: "none" | "mild" | "high";
  weeklyTrainingHours?: number;
};

/** Apply Hybrid365 weekly rhythm + Saturday key-day rule for 5–6+ day athletes. */
export function applyHybrid365WeeklyRhythm(
  template: WeeklyStructureTemplate,
  options: WeeklyScheduleBuildOptions
): WeeklyStructureTemplate {
  const days = template.days.map((d) => ({ ...d }));
  const activeCount = options.trainingDaysAvailable;

  if (activeCount >= 5 && options.saturdayAvailable !== false) {
    const sat = days.find((d) => d.day === "Sat");
    const recoveryOk = options.recoveryStatus !== "poor";
    if (sat && recoveryOk && sat.intensity !== "hard") {
      sat.role = "compromised_hybrid";
      sat.intensity = "hard";
      sat.notes =
        "Saturday key session — Hyrox compromised, threshold→station overload, or race-specific work.";
    }
  }

  if (options.preferredLongAerobicDay === "Sun") {
    const sun = days.find((d) => d.day === "Sun");
    if (sun && sun.intensity !== "rest") {
      sun.role = "long_aerobic";
      sun.intensity = "easy";
      sun.notes = sun.notes ?? "Primary long easy aerobic day";
    }
  }

  if (activeCount <= 4) {
    return applyLimitedDaysStructure(template, activeCount, options);
  }

  const rhythmDays = protectTuesdayThreshold(days, options);
  return {
    ...template,
    days: applyThursdayTempoPlacement(rhythmDays, options),
    hardEasyRhythm:
      "Sun long easy · Mon recovery upper · Tue KEY threshold · Wed easy · Thu legs (tempo AM if double-ready) · Fri support · Sat KEY Hyrox.",
  };
}

/** Tuesday is the staple key threshold day after Sun/Mon aerobic — never replaced by tempo. */
export function protectTuesdayThreshold(
  days: WeeklyDayTemplate[],
  options: WeeklyScheduleBuildOptions
): WeeklyDayTemplate[] {
  if (options.trainingDaysAvailable < 4) return days;

  const out = days.map((d) => ({ ...d }));
  const tue = out.find((d) => d.day === "Tue");
  if (!tue || tue.intensity === "rest") return out;

  tue.role = "hard_run";
  tue.intensity = "hard";
  tue.notes =
    "Key Tuesday threshold run — primary weekly run-quality progression. Sun/Mon are easier so athlete should be fresh. Tempo does not replace this slot.";
  return out;
}

/** Thursday staple = lower strength endurance; tempo is optional AM only when double-ready. */
export function applyThursdayTempoPlacement(
  days: WeeklyDayTemplate[],
  options: WeeklyScheduleBuildOptions & { weeklyTrainingHours?: number }
): WeeklyDayTemplate[] {
  if (options.trainingDaysAvailable < 5) return days;

  const out = days.map((d) => ({ ...d }));
  const thu = out.find((d) => d.day === "Thu");
  if (!thu || thu.intensity === "rest") return out;

  const amTempo = shouldScheduleThursdayAmTempo({
    trainingDaysAvailable: options.trainingDaysAvailable,
    doubleSessionReadiness: options.doubleSessionReadiness,
    recoveryStatus: options.recoveryStatus,
    weeklyTrainingHours: options.weeklyTrainingHours,
  });

  thu.role = "strength_lower";
  thu.intensity = "hard";
  thu.optionalAmRole = amTempo ? "tempo_aerobic" : undefined;
  thu.notes = amTempo
    ? "Thursday staple: Lower Strength Endurance — Hyrox Legs (PM key). Optional AM: tempo / aerobic quality for double-ready athletes."
    : "Thursday staple: Lower Strength Endurance — Hyrox Legs (key session). Tempo omitted — not double-ready, recovery limited, or insufficient weekly hours.";

  return out;
}

export const SUNDAY_AEROBIC_DOUBLE_RATIONALE =
  "Sunday is used to build aerobic volume without creating fatigue that compromises Tuesday threshold. Optional extras: easy bike, Ski/Row Z1–low Z2, mobility only — never threshold, tempo or intervals.";

export const AEROBIC_DAY_EXTRA_GUIDANCE =
  "Extra time on aerobic days: add low Z1/low Z2 bike, SkiErg or RowErg only — no threshold, tempo, station overload, hard EMOMs or lower-body fatigue.";

/** 3–4 day athletes — highest-value sessions first; strength endurance may replace a run slot. */
function applyLimitedDaysStructure(
  template: WeeklyStructureTemplate,
  daysPerWeek: number,
  options: WeeklyScheduleBuildOptions
): WeeklyStructureTemplate {
  const rhythm =
    daysPerWeek === 3
      ? "3 days: run quality/tempo → strength endurance + station finisher → Hyrox compromised or long aerobic hybrid."
      : "4 days: threshold/tempo → strength endurance → Hyrox compromised → long easy aerobic.";

  const baseDays: WeeklyDayTemplate[] = [
    { day: "Mon", role: "rest", intensity: "rest", active: false },
    { day: "Tue", role: "hard_run", intensity: "hard", notes: "Key Tuesday threshold run" },
    { day: "Wed", role: "rest", intensity: "rest", active: false },
    {
      day: "Thu",
      role: "strength_lower",
      intensity: "hard",
      notes: "Strength endurance + station weakness finisher",
    },
    { day: "Fri", role: "rest", intensity: "rest", active: false },
    {
      day: "Sat",
      role: "compromised_hybrid",
      intensity: "hard",
      notes: "Hyrox-specific / compromised or key simulation",
    },
    {
      day: "Sun",
      role: "long_aerobic",
      intensity: "easy",
      notes: daysPerWeek === 3 ? "Optional — often rest if only 3 days" : "Long easy aerobic",
    },
  ];

  const activeRoles: { day: Weekday; role: DaySlotRole; intensity: WeeklyDayTemplate["intensity"] }[] =
    daysPerWeek === 3
      ? [
          { day: "Tue", role: "hard_run", intensity: "hard" },
          { day: "Thu", role: "strength_lower", intensity: "hard" },
          { day: "Sat", role: "compromised_hybrid", intensity: "hard" },
        ]
      : [
          { day: "Tue", role: "hard_run", intensity: "hard" },
          { day: "Thu", role: "strength_lower", intensity: "hard" },
          { day: "Sat", role: "compromised_hybrid", intensity: "hard" },
          { day: "Sun", role: "long_aerobic", intensity: "easy" },
        ];

  const days = baseDays.map((d) => {
    const match = activeRoles.find((r) => r.day === d.day);
    if (!match) return { ...d, active: false, intensity: "rest" as const, role: "rest" as const };
    return { ...d, ...match, active: true };
  });

  return {
    ...template,
    daysPerWeek,
    description: rhythm,
    hardEasyRhythm: "Limited days — preserve highest-value sessions; no forced extra threshold runs.",
    days,
  };
}

/** Stack Tue threshold + Wed erg threshold into Tue when double-ready (AM/PM same calendar day). */
export function applyDoubleSessionStacking(
  days: WeeklyDayTemplate[],
  readiness: ProgrammeContext["doubleSessionReadiness"]
): WeeklyDayTemplate[] {
  if (readiness !== "threshold_run_plus_erg_threshold") return days;

  const out = days.map((d) => ({ ...d }));
  const tue = out.find((d) => d.day === "Tue");
  const wed = out.find((d) => d.day === "Wed");

  if (tue?.role === "hard_run" && wed?.role === "erg_threshold") {
    tue.notes = `${tue.notes ?? ""} AM threshold run + PM Ski/Row threshold (stacked hard day).`.trim();
    wed.role = "erg_z2";
    wed.intensity = "easy";
    wed.notes = "Recovery-leaning after stacked threshold day";
  }
  return out;
}

export function buildEmomForWeakness(
  weakness: StationWeakness,
  attachRole: DaySlotRole
): EmomPrescription | null {
  const rules = getStationWeaknessRules([weakness]);
  const rule = rules[0];
  if (!rule) return null;

  if (weakness === "wall_balls" || weakness === "wall_ball") {
    return {
      id: "wb_emom",
      movement: "Wall balls",
      durationMinutes: 10,
      repsOrLoad: "10–15 reps @ category-appropriate load",
      rpe: "RPE 6–7 — smooth breathing, no redline",
      purpose: "Wall ball density — breathing and smooth reps",
      whatToRecord: ["Total reps", "Breaks", "RPE"],
      attachToRole: attachRole,
    };
  }
  if (weakness === "burpees") {
    return {
      id: "burpee_emom",
      movement: "Burpee broad jumps",
      durationMinutes: 10,
      repsOrLoad: "Min 1: 6–10 BBJ · Min 2: walk/reset",
      rpe: "RPE 6–7",
      purpose: "Burpee rhythm under manageable fatigue",
      whatToRecord: ["Reps per minute", "Rhythm", "RPE"],
      attachToRole: attachRole,
    };
  }
  if (weakness === "sled" || weakness === "sled_push_pull") {
    return {
      id: "sled_density",
      movement: "Sled push or pull",
      durationMinutes: 10,
      repsOrLoad: "Every 2 min × 5 · 12.5m @ moderate race load",
      rpe: "RPE 7",
      purpose: "Sled density — technique and repeatability",
      whatToRecord: ["Load", "Surface", "RPE"],
      attachToRole: attachRole,
    };
  }
  if (weakness === "farmers_carry" || weakness === "carry") {
    return {
      id: "grip_holds",
      movement: "DB max holds",
      durationMinutes: 8,
      repsOrLoad: "3–5 × 30–60 sec — heavier than race farmer weight",
      rpe: "RPE 7–8 grip",
      purpose: "Grip strength for farmers carry",
      whatToRecord: ["Weight", "Hold time", "RPE"],
      attachToRole: attachRole,
    };
  }
  return null;
}

export function attachStationEmom(
  day: ScheduledDaySlot,
  weaknesses: StationWeakness[],
  blockWeek: BlockWeekInCycle
): ScheduledDaySlot {
  const focus = rotateStationFocusForBlock(weaknesses, blockWeek);
  const primary = focus[0];
  if (!primary) return day;

  const allowedRoles: DaySlotRole[] = [
    "strength_lower",
    "compromised_hybrid",
    "hard_run",
    "compromised_hybrid",
  ];
  if (!allowedRoles.includes(day.role)) return day;

  if (day.role === "erg_z2" || day.role === "easy_run" || day.role === "long_aerobic") {
    return day;
  }

  const emom = buildEmomForWeakness(primary, day.role);
  return emom ? { ...day, emom } : day;
}

export function planWeeklyHours(
  scheduledDays: ScheduledDaySlot[],
  weeklyTrainingHours: number,
  blockWeek: BlockWeekInCycle
): WeeklyHoursPlan {
  const targetMin = Math.round(weeklyTrainingHours * 60);
  let keyMin = 0;
  let easyMin = 0;
  let thresholdMin = 0;

  for (const d of scheduledDays) {
    if (d.intensity === "rest") continue;
    const mins = d.plannedMinutes;
    if (d.hardDay) keyMin += mins;
    else easyMin += mins;
    thresholdMin += d.thresholdMinutes;
  }

  if (blockWeek === 4) {
    keyMin = Math.round(keyMin * 0.85);
    easyMin = Math.round(easyMin * 0.85);
    thresholdMin = deloadThresholdMinutes(thresholdMin, 4);
  }

  const total = keyMin + easyMin;
  const remaining = Math.max(0, targetMin - total);

  const fill: string[] = [];
  if (remaining > 30) {
    fill.push(`${remaining} min remaining → fill with bike/Ski/Row Z2 or mixed erg aerobic`);
    fill.push("Do not add extra hard sessions when filling time");
    if (weeklyTrainingHours >= 12) {
      fill.push("High volume: bias Z1/low Z2 erg to protect run quality");
    }
    if (weeklyTrainingHours < 8) {
      fill.push("Time-restricted: fill with purposeful true Z2, not grey zone");
    }
  }

  return {
    weeklyTrainingHoursTarget: weeklyTrainingHours,
    plannedKeySessionMinutes: keyMin,
    plannedEasySupportMinutes: easyMin + remaining,
    remainingAerobicMinutes: remaining,
    totalPlannedMinutes: total + remaining,
    weeklyThresholdMinutes: thresholdMin,
    fillStrategy: fill,
    coachRationale:
      "Key sessions placed first; remaining time filled with easy aerobic/support — weekly hours gates total volume, not hard-session count.",
  };
}

const MAX_THRESHOLD_BY_LEVEL: Record<string, number> = {
  beginner: 30,
  intermediate: 50,
  advanced: 65,
  pro: 75,
};

export function validateWeeklyStress(
  days: ScheduledDaySlot[],
  options: WeeklyScheduleBuildOptions & {
    trainingDays: number;
    abilityLevel?: string;
    weeklyTrainingHours: number;
    programmeBlock?: number;
  }
): SchedulingValidationWarning[] {
  const warnings: SchedulingValidationWarning[] = [];
  const active = days.filter((d) => d.intensity !== "rest");

  for (let i = 0; i < active.length - 1; i++) {
    const a = active[i]!;
    const b = active[i + 1]!;
    if (a.role === "strength_lower" && b.role === "hard_run") {
      warnings.push({
        id: "legs_before_run",
        severity: "warn",
        message: "Lower-body strength endurance is scheduled the day before a threshold/hard run.",
        days: [a.day, b.day],
      });
    }
    if (a.role === "hard_run" && b.role === "erg_threshold") {
      warnings.push({
        id: "run_then_erg_threshold",
        severity: "warn",
        message: "Erg threshold should not follow threshold run on the next day — stack same day if double-ready.",
        days: [a.day, b.day],
      });
    }
    if (a.hardDay && b.hardDay && a.day !== b.day) {
      warnings.push({
        id: "consecutive_hard",
        severity: "warn",
        message: `Back-to-back hard days: ${a.day} (${a.role}) → ${b.day} (${b.role}).`,
        days: [a.day, b.day],
      });
    }
  }

  const sat = days.find((d) => d.day === "Sat");
  if (
    options.trainingDays >= 5 &&
    options.saturdayAvailable !== false &&
    sat &&
    sat.intensity !== "hard" &&
    options.recoveryStatus !== "poor"
  ) {
    warnings.push({
      id: "saturday_not_key",
      severity: "warn",
      message: "Saturday is easy/rest for a 5–6 day athlete with no Saturday constraint — usually should be key/hard.",
      days: ["Sat"],
    });
  }

  for (const d of days) {
    if (d.emom && (d.role === "easy_run" || d.role === "long_aerobic" || d.role === "erg_z2")) {
      if (!d.emom.lowFatigueTechniqueOnly) {
        warnings.push({
          id: "emom_on_easy_day",
          severity: "warn",
          message: `Station EMOM on ${d.day} (${d.role}) — should attach to strength/Hyrox hard day unless low-fatigue technique only.`,
          days: [d.day],
        });
      }
    }
  }

  const totalThreshold = days.reduce((s, d) => s + d.thresholdMinutes, 0);
  const cap = MAX_THRESHOLD_BY_LEVEL[options.abilityLevel ?? "intermediate"] ?? 50;
  const deloadCap = options.programmeBlock && options.blockWeek === 4 ? cap * 0.7 : cap;
  if (totalThreshold > deloadCap) {
    warnings.push({
      id: "threshold_volume_high",
      severity: "warn",
      message: `Planned threshold minutes (${totalThreshold}) may exceed sensible load for level/block (guide ~${Math.round(deloadCap)} min).`,
    });
  }

  const hoursPlan = planWeeklyHours(days, options.weeklyTrainingHours, options.blockWeek);
  if (hoursPlan.totalPlannedMinutes > options.weeklyTrainingHours * 60 + 30) {
    warnings.push({
      id: "hours_exceeded",
      severity: "warn",
      message: `Planned time (~${Math.round(hoursPlan.totalPlannedMinutes / 60)}h) exceeds weekly training hours target (${options.weeklyTrainingHours}h).`,
    });
  }

  if (options.lowerBodySoreness === "high" && days.some((d) => d.role === "hard_run")) {
    warnings.push({
      id: "run_with_leg_soreness",
      severity: "warn",
      message: "High lower-body soreness flagged — consider swapping threshold run or reducing leg session.",
    });
  }

  const thu = days.find((d) => d.day === "Thu");
  if (
    thu &&
    thu.intensity !== "rest" &&
    (thu.role === "tempo_aerobic" || (thu.sessionId && isTempoSessionId(thu.sessionId) && thu.role !== "strength_lower"))
  ) {
    warnings.push({
      id: "tempo_replaces_strength",
      severity: "warn",
      message:
        "Tempo must not replace Thursday lower strength endurance — strength is the staple; tempo is optional AM only.",
      days: ["Thu"],
    });
  }

  const tue = days.find((d) => d.day === "Tue");
  if (
    options.trainingDays >= 4 &&
    tue &&
    tue.intensity !== "rest" &&
    (tue.role !== "hard_run" || tue.sessionId === "hyrox_run_tempo_hm")
  ) {
    warnings.push({
      id: "tuesday_threshold_replaced",
      severity: "warn",
      message:
        "Tuesday should be the key threshold run — tempo must not replace Tuesday threshold for this athlete.",
      days: ["Tue"],
    });
  }

  const sun = days.find((d) => d.day === "Sun");
  if (sun?.sessionId && isTempoSessionId(sun.sessionId)) {
    warnings.push({
      id: "sunday_above_threshold",
      severity: "warn",
      message: "Sunday should be aerobic-only volume — no threshold, tempo or above-threshold work.",
      days: ["Sun"],
    });
  }
  if (sun?.sessionId) {
    const sunMeta = getSessionSchedulingMetadata(sun.sessionId);
    if (
      sunMeta.intensityType === "threshold" ||
      sunMeta.intensityType === "quality" ||
      sunMeta.intensityType === "tempo"
    ) {
      warnings.push({
        id: "sunday_above_threshold",
        severity: "warn",
        message: "Sunday should be aerobic-only volume — no threshold, tempo or above-threshold work.",
        days: ["Sun"],
      });
    }
  }

  for (const d of days) {
    if (d.sessionId === "hyrox_strength_heavy_legs") {
      const lib = getHyroxSession(d.sessionId);
      if (lib && lib.mainSet.length < 4) {
        warnings.push({
          id: "leg_endurance_vague",
          severity: "warn",
          message: "Lower strength endurance session lacks detailed sets/reps/rest prescription.",
          days: [d.day],
        });
      }
    }
  }

  return warnings;
}

export function roleToDefaultSessionId(
  role: DaySlotRole,
  ctx: {
    preferErgOverRun?: boolean;
    blockWeek: BlockWeekInCycle;
    programmeBlock?: 1 | 2 | 3;
    saturdayKey?: boolean;
    abilityLevel?: string;
  }
): string | null {
  if (role === "rest" || role === "recovery") return null;

  const map: Partial<Record<DaySlotRole, string>> = {
    easy_run: "hyrox_run_easy",
    hard_run: getTuesdayThresholdSessionId(ctx.programmeBlock ?? 1, ctx.blockWeek),
    tempo_aerobic: "hyrox_run_tempo_hm",
    long_aerobic: ctx.preferErgOverRun ? "hyrox_erg_mixed_aerobic" : "hyrox_run_long_easy",
    erg_threshold: "hyrox_erg_ski_threshold_8x4",
    erg_z2: "hyrox_erg_bike_z2",
    strength_lower: "hyrox_strength_heavy_legs",
    strength_upper: "hyrox_strength_upper_emom",
    gym_aerobic_upper: "hyrox_gym_aerobic_upper_grip",
    compromised_hybrid:
      ctx.saturdayKey && (ctx.abilityLevel === "intermediate" || ctx.abilityLevel === "advanced" || ctx.abilityLevel === "pro")
        ? "hyrox_compromised_threshold_run_station_overload"
        : "hyrox_compromised_run_wallballs",
  };
  return map[role] ?? null;
}

export function enrichScheduledDay(
  day: WeeklyDayTemplate,
  sessionId: string | null,
  blockWeek: BlockWeekInCycle
): ScheduledDaySlot {
  const meta = sessionId ? getSessionSchedulingMetadata(sessionId) : null;
  const hard =
    day.intensity === "hard" ||
    isRoleInherentlyHard(day.role) ||
    (meta?.hardDay ?? false);

  let thresholdMinutes = meta?.thresholdMinutes ?? 0;
  if (blockWeek === 4 && thresholdMinutes > 0) {
    thresholdMinutes = deloadThresholdMinutes(thresholdMinutes, 4);
  }

  return {
    ...day,
    sessionId,
    hardDay: hard,
    thresholdMinutes,
    qualityRunMinutes: meta?.qualityRunMinutes ?? 0,
    plannedMinutes: meta?.estimatedDurationMinutes ?? (day.intensity === "rest" ? 0 : 50),
    emom: null,
    optionalAmRole: day.optionalAmRole,
  };
}

export function sortDaysCalendar(days: WeeklyDayTemplate[]): WeeklyDayTemplate[] {
  return [...days].sort(
    (a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day)
  );
}
