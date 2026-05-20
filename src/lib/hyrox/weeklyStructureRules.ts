import type { RaceTimelinePhase, WeeklyStructureTemplate } from "./types";
import { applyHybrid365WeeklyRhythm, type WeeklyScheduleBuildOptions } from "./schedulingRules";

export const WEEKLY_STRUCTURE_TEMPLATES: WeeklyStructureTemplate[] = [
  {
    id: "beginner_4_day",
    label: "Beginner — 4 days",
    daysPerWeek: 4,
    allowsDoubleSessions: false,
    description:
      "Hard/easy rhythm with max 2 true hard days. Erg/bike supports aerobic work without extra run impact.",
    hardEasyRhythm:
      "Sun long easy · Mon recovery upper · Tue threshold/tempo · Thu short Hyrox · easy fillers.",
    sessionCategoryEmphasis: ["run_development", "tempo_aerobic_quality", "erg_development", "strength", "compromised_running"],
    days: [
      { day: "Sun", role: "long_aerobic", intensity: "easy", notes: "Longer-duration aerobic — true Z2" },
      { day: "Mon", role: "strength_upper", intensity: "moderate", notes: "Recovery-leaning + upper support" },
      { day: "Tue", role: "hard_run", intensity: "hard", notes: "Intro threshold / run quality (shortened for beginners)" },
      { day: "Wed", role: "erg_z2", intensity: "easy", notes: "Bike or mixed erg Z2" },
      { day: "Thu", role: "compromised_hybrid", intensity: "hard", notes: "Short compromised builder" },
      { day: "Fri", role: "rest", intensity: "rest" },
      { day: "Sat", role: "easy_run", intensity: "easy", notes: "Easy flush — or key if 5th day added" },
    ],
  },
  {
    id: "intermediate_4_day",
    label: "Intermediate — 4 days (limited)",
    daysPerWeek: 4,
    allowsDoubleSessions: false,
    description: "Limited days — threshold/tempo, strength endurance, Hyrox compromised, long aerobic.",
    hardEasyRhythm: "Highest-value sessions only — strength endurance may replace an extra run quality slot.",
    sessionCategoryEmphasis: ["run_development", "strength", "compromised_running", "erg_development"],
    days: [
      { day: "Sun", role: "long_aerobic", intensity: "easy" },
      { day: "Mon", role: "rest", intensity: "rest" },
      { day: "Tue", role: "hard_run", intensity: "hard" },
      { day: "Wed", role: "rest", intensity: "rest" },
      { day: "Thu", role: "strength_lower", intensity: "hard" },
      { day: "Fri", role: "rest", intensity: "rest" },
      { day: "Sat", role: "compromised_hybrid", intensity: "hard" },
    ],
  },
  {
    id: "intermediate_5_day",
    label: "Intermediate — 5 days",
    daysPerWeek: 5,
    allowsDoubleSessions: false,
    description:
      "Hybrid365 rhythm: Sun long aerobic · Mon recovery upper · Tue run quality · Thu leg endurance · Sat key Hyrox.",
    hardEasyRhythm:
      "Sun long easy · Mon recovery · Tue KEY threshold · Wed easy · Thu strength endurance · Fri support · Sat KEY hard.",
    sessionCategoryEmphasis: [
      "run_development",
      "tempo_aerobic_quality",
      "erg_development",
      "strength",
      "compromised_running",
    ],
    days: [
      { day: "Sun", role: "long_aerobic", intensity: "easy", notes: "Longer aerobic — Z2, erg option if run-limited" },
      { day: "Mon", role: "strength_upper", intensity: "moderate", notes: "Recovery aerobic + upper / grip support" },
      { day: "Tue", role: "hard_run", intensity: "hard", notes: "Key Tuesday threshold run — primary weekly run-quality progression" },
      { day: "Wed", role: "erg_z2", intensity: "easy", notes: "Easy bike / mixed erg" },
      { day: "Thu", role: "strength_lower", intensity: "hard", notes: "Lower strength endurance — tempo AM only if double-ready" },
      { day: "Fri", role: "gym_aerobic_upper", intensity: "easy", notes: "Easy aerobic + upper/grip support" },
      { day: "Sat", role: "compromised_hybrid", intensity: "hard", notes: "Saturday key — Hyrox / compromised / race-specific" },
    ],
  },
  {
    id: "advanced_6_day",
    label: "Advanced — 6 days",
    daysPerWeek: 6,
    allowsDoubleSessions: true,
    description:
      "6-day rhythm with Saturday key. Doubles optional — stack threshold + erg threshold same day when ready.",
    hardEasyRhythm:
      "Sun long easy · Mon recovery upper · Tue run quality · Wed easy · Thu leg endurance · Fri support · Sat KEY.",
    sessionCategoryEmphasis: [
      "run_development",
      "erg_development",
      "compromised_running",
      "strength",
    ],
    days: [
      { day: "Sun", role: "long_aerobic", intensity: "easy", notes: "Primary long Z2 duration" },
      { day: "Mon", role: "strength_upper", intensity: "moderate", notes: "Recovery-leaning + upper" },
      { day: "Tue", role: "hard_run", intensity: "hard", notes: "Threshold run — AM if doubling" },
      { day: "Wed", role: "erg_z2", intensity: "easy", notes: "Easy erg or recovery after stacked hard day" },
      { day: "Thu", role: "strength_lower", intensity: "hard", notes: "Leg endurance / sled — not day before key run" },
      { day: "Fri", role: "erg_z2", intensity: "easy", notes: "Support / flush" },
      { day: "Sat", role: "compromised_hybrid", intensity: "hard", notes: "Saturday key session" },
    ],
  },
  {
    id: "pro_high_volume_6_7_day",
    label: "Pro / high volume — 6–7 days",
    daysPerWeek: 7,
    allowsDoubleSessions: true,
    description:
      "High aerobic throughput — Saturday key. Extra volume via Z1/Z2 erg, not extra hard runs.",
    hardEasyRhythm: "Hard Tue (+ optional erg PM) · Thu legs · Sat key · easy doubles elsewhere.",
    sessionCategoryEmphasis: [
      "run_development",
      "erg_development",
      "compromised_running",
      "strength",
      "testing",
    ],
    days: [
      { day: "Sun", role: "long_aerobic", intensity: "easy", notes: "Long aerobic — optional PM aerobic double only (never threshold/tempo)" },
      { day: "Mon", role: "strength_upper", intensity: "moderate" },
      { day: "Tue", role: "hard_run", intensity: "hard", notes: "AM threshold" },
      { day: "Wed", role: "erg_threshold", intensity: "hard", notes: "PM erg threshold when double-ready — else easy" },
      { day: "Thu", role: "strength_lower", intensity: "hard" },
      { day: "Fri", role: "erg_z2", intensity: "easy" },
      { day: "Sat", role: "compromised_hybrid", intensity: "hard", notes: "Saturday key — race-specific" },
    ],
  },
];

export function applyBlockWeekDeload(
  template: WeeklyStructureTemplate,
  blockWeek: import("./types").BlockWeekInCycle
): WeeklyStructureTemplate {
  if (blockWeek !== 4) return template;
  return {
    ...template,
    description: `${template.description} Week 4: reduce total volume ~10–20% and threshold minutes — maintain rhythm.`,
  };
}

export function getWeeklyStructure(id: WeeklyStructureTemplate["id"]): WeeklyStructureTemplate | undefined {
  return WEEKLY_STRUCTURE_TEMPLATES.find((t) => t.id === id);
}

export function suggestWeeklyStructure(options: {
  trainingDaysAvailable: number;
  classification: import("./types").AthleteClassificationId;
  allowsDoubles?: boolean;
  scheduleOptions?: WeeklyScheduleBuildOptions;
}): WeeklyStructureTemplate {
  const { trainingDaysAvailable, classification, allowsDoubles, scheduleOptions } = options;

  let template: WeeklyStructureTemplate;

  if (trainingDaysAvailable <= 3) {
    template = applyHybrid365WeeklyRhythm(getWeeklyStructure("beginner_4_day")!, {
      trainingDaysAvailable,
      ...scheduleOptions,
      recoveryStatus: scheduleOptions?.recoveryStatus ?? "moderate",
      blockWeek: scheduleOptions?.blockWeek ?? 1,
    });
    return template;
  }

  if (trainingDaysAvailable === 4) {
    template =
      classification === "beginner_foundation"
        ? getWeeklyStructure("beginner_4_day")!
        : getWeeklyStructure("intermediate_4_day")!;
  } else if (trainingDaysAvailable === 5 || classification === "balanced_intermediate") {
    template = getWeeklyStructure("intermediate_5_day")!;
  } else if (
    trainingDaysAvailable >= 7 ||
    classification === "advanced_competitive" ||
    (allowsDoubles && trainingDaysAvailable >= 6)
  ) {
    template = getWeeklyStructure("pro_high_volume_6_7_day")!;
  } else {
    template = getWeeklyStructure("advanced_6_day")!;
  }

  if (scheduleOptions) {
    template = applyHybrid365WeeklyRhythm(template, {
      ...scheduleOptions,
      trainingDaysAvailable,
      recoveryStatus: scheduleOptions.recoveryStatus ?? "moderate",
      blockWeek: scheduleOptions.blockWeek ?? 1,
    });
  }

  return template;
}

export function applyRaceTimelineToStructure(
  template: WeeklyStructureTemplate,
  phase: RaceTimelinePhase
): WeeklyStructureTemplate {
  const notes =
    phase === "far"
      ? "Emphasise tempo/aerobic quality, threshold intro, Z2, strength base — minimal race simulation."
      : phase === "mid"
        ? "Add compromised builders and station volume."
        : phase === "near"
          ? "Race-pace runs, compromised density, Saturday key race-specific sessions."
          : "Taper — sharpness only, minimal fatigue.";

  return {
    ...template,
    description: `${template.description} (${notes})`,
    sessionCategoryEmphasis:
      phase === "near" || phase === "race_week"
        ? ["compromised_running", "run_development", "erg_development", "testing"]
        : phase === "far"
          ? ["run_development", "tempo_aerobic_quality", "erg_development", "strength", "testing"]
          : template.sessionCategoryEmphasis,
  };
}

export function weeksToRacePhase(weeksToRace: number | null | undefined): RaceTimelinePhase {
  if (weeksToRace == null || weeksToRace > 9) return "far";
  if (weeksToRace >= 5) return "mid";
  if (weeksToRace >= 2) return "near";
  return "race_week";
}
