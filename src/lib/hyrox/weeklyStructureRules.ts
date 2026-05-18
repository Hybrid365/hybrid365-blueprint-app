import type { RaceTimelinePhase, WeeklyStructureTemplate } from "./types";

export const WEEKLY_STRUCTURE_TEMPLATES: WeeklyStructureTemplate[] = [
  {
    id: "beginner_4_day",
    label: "Beginner — 4 days",
    daysPerWeek: 4,
    allowsDoubleSessions: false,
    description:
      "Hard/easy rhythm with max 2 true hard days. Erg/bike supports aerobic work without extra run impact.",
    hardEasyRhythm:
      "Sun/Mon often easier — Sun longer aerobic, Mon recovery aerobic + upper. Hard mid-week where possible.",
    sessionCategoryEmphasis: ["run_development", "erg_development", "strength", "compromised_running"],
    days: [
      {
        day: "Sun",
        role: "long_aerobic",
        intensity: "easy",
        notes: "Longer-duration aerobic (run, bike or mixed erg) — true Z2",
      },
      {
        day: "Mon",
        role: "strength_upper",
        intensity: "moderate",
        notes: "Recovery-leaning aerobic optional AM + upper strength",
      },
      { day: "Tue", role: "hard_run", intensity: "hard", notes: "Threshold or controlled intervals" },
      { day: "Wed", role: "erg_z2", intensity: "easy", notes: "Bike or mixed erg Z2" },
      { day: "Thu", role: "compromised_hybrid", intensity: "hard", notes: "Short compromised builder" },
      { day: "Fri", role: "rest", intensity: "rest" },
      { day: "Sat", role: "easy_run", intensity: "easy", notes: "Easy run or deload flush" },
    ],
  },
  {
    id: "intermediate_5_day",
    label: "Intermediate — 5 days",
    daysPerWeek: 5,
    allowsDoubleSessions: false,
    description:
      "Three hard touches: threshold run, strength, compromised. Easy run + erg Z2 fill aerobic gaps.",
    hardEasyRhythm:
      "Sun long aerobic · Mon upper/recovery aerobic · hard Tue/Thu · easy fillers. Week 4 deload volume.",
    sessionCategoryEmphasis: [
      "run_development",
      "erg_development",
      "strength",
      "compromised_running",
    ],
    days: [
      {
        day: "Sun",
        role: "long_aerobic",
        intensity: "easy",
        notes: "Longer aerobic — Z2, low impact option via erg/bike",
      },
      {
        day: "Mon",
        role: "strength_upper",
        intensity: "moderate",
        notes: "Upper strength + optional easy aerobic — recovery-leaning",
      },
      { day: "Tue", role: "hard_run", intensity: "hard", notes: "Threshold session" },
      { day: "Wed", role: "easy_run", intensity: "easy" },
      { day: "Thu", role: "compromised_hybrid", intensity: "hard" },
      { day: "Fri", role: "erg_z2", intensity: "easy", notes: "Ski/row/bike Z2" },
      { day: "Sat", role: "easy_run", intensity: "easy", notes: "Easy run or secondary aerobic" },
    ],
  },
  {
    id: "advanced_6_day",
    label: "Advanced — 6 days",
    daysPerWeek: 6,
    allowsDoubleSessions: true,
    description:
      "Higher frequency with erg threshold and compromised density. Doubles optional (Z2 erg PM).",
    hardEasyRhythm: "Alternate hard/easy — max 3–4 hard exposures with true easy between.",
    sessionCategoryEmphasis: [
      "run_development",
      "erg_development",
      "compromised_running",
      "strength",
    ],
    days: [
      { day: "Mon", role: "strength_upper", intensity: "moderate" },
      { day: "Tue", role: "hard_run", intensity: "hard" },
      { day: "Wed", role: "erg_threshold", intensity: "hard", notes: "Ski or row threshold" },
      { day: "Thu", role: "compromised_hybrid", intensity: "hard" },
      { day: "Fri", role: "easy_run", intensity: "easy" },
      { day: "Sat", role: "long_aerobic", intensity: "moderate" },
      {
        day: "Sun",
        role: "long_aerobic",
        intensity: "easy",
        notes: "Long aerobic — primary Z2 duration day",
      },
    ],
  },
  {
    id: "pro_high_volume_6_7_day",
    label: "Pro / high volume — 6–7 days",
    daysPerWeek: 7,
    allowsDoubleSessions: true,
    description:
      "High aerobic throughput — doubles for Z2 erg. Race-specific compromised increases near event.",
    hardEasyRhythm: "Hard Mon/Tue/Thu/Sat pattern with easy doubles and recovery flush days.",
    sessionCategoryEmphasis: [
      "run_development",
      "erg_development",
      "compromised_running",
      "strength",
      "testing",
    ],
    days: [
      { day: "Mon", role: "strength_lower", intensity: "moderate" },
      { day: "Tue", role: "hard_run", intensity: "hard", notes: "AM threshold" },
      { day: "Wed", role: "erg_threshold", intensity: "hard" },
      { day: "Thu", role: "compromised_hybrid", intensity: "hard" },
      { day: "Fri", role: "easy_run", intensity: "easy", notes: "Optional PM erg Z2 double" },
      { day: "Sat", role: "long_aerobic", intensity: "moderate" },
      {
        day: "Sun",
        role: "long_aerobic",
        intensity: "easy",
        notes: "Long aerobic + optional PM Z2 double when readiness allows",
      },
    ],
  },
];

/** Week 4 of each 4-week block — apply deload notes to structure. */
export function applyBlockWeekDeload(
  template: WeeklyStructureTemplate,
  blockWeek: import("./types").BlockWeekInCycle
): WeeklyStructureTemplate {
  if (blockWeek !== 4) return template;
  return {
    ...template,
    description: `${template.description} Week 4: reduce total volume ~10–20% — maintain rhythm.`,
  };
}

export function getWeeklyStructure(id: WeeklyStructureTemplate["id"]): WeeklyStructureTemplate | undefined {
  return WEEKLY_STRUCTURE_TEMPLATES.find((t) => t.id === id);
}

export function suggestWeeklyStructure(options: {
  trainingDaysAvailable: number;
  classification: import("./types").AthleteClassificationId;
  allowsDoubles?: boolean;
}): WeeklyStructureTemplate {
  const { trainingDaysAvailable, classification, allowsDoubles } = options;

  if (trainingDaysAvailable <= 4 || classification === "beginner_foundation") {
    return getWeeklyStructure("beginner_4_day")!;
  }
  if (trainingDaysAvailable === 5 || classification === "balanced_intermediate") {
    return getWeeklyStructure("intermediate_5_day")!;
  }
  if (
    trainingDaysAvailable >= 7 ||
    classification === "advanced_competitive" ||
    (allowsDoubles && trainingDaysAvailable >= 6)
  ) {
    return getWeeklyStructure("pro_high_volume_6_7_day")!;
  }
  return getWeeklyStructure("advanced_6_day")!;
}

/** Adjust slot emphasis by weeks to race — specificity ramps up. */
export function applyRaceTimelineToStructure(
  template: WeeklyStructureTemplate,
  phase: RaceTimelinePhase
): WeeklyStructureTemplate {
  const notes =
    phase === "far"
      ? "Emphasise threshold, Z2, strength base — minimal race simulation."
      : phase === "mid"
        ? "Add compromised builders and station volume."
        : phase === "near"
          ? "Race-pace runs, compromised density, reduce strength maxes."
          : "Taper — sharpness only, minimal fatigue.";

  return {
    ...template,
    description: `${template.description} (${notes})`,
    sessionCategoryEmphasis:
      phase === "near" || phase === "race_week"
        ? ["compromised_running", "run_development", "erg_development", "testing"]
        : phase === "far"
          ? ["run_development", "erg_development", "strength", "testing"]
          : template.sessionCategoryEmphasis,
  };
}

export function weeksToRacePhase(weeksToRace: number | null | undefined): RaceTimelinePhase {
  if (weeksToRace == null || weeksToRace > 9) return "far";
  if (weeksToRace >= 5) return "mid";
  if (weeksToRace >= 2) return "near";
  return "race_week";
}
