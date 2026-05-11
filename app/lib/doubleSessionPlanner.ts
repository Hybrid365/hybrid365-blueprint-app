/**
 * Double-session planner — additive, backward-compatible.
 *
 * Mutates nothing in the existing DayPlan structure.
 * Returns a new array where eligible days have a `double_session` field
 * added. Existing fields are untouched.
 */

import type { DayPlan, GoalFocus, WeeklyHoursBand } from "./sessionLibrary";
import type { AbilityLevel } from "./sessionLibrary";

// ─── Public types (additive to DayPlan) ───────────────────────────────────────

export type DoubleSessionCategory = "aerobic" | "recovery" | "strength" | "hybrid";

export type DoubleSessionDetail = {
  enabled: boolean;
  label: "AM/PM" | "Optional Support";
  secondary: {
    title: string;
    intent: string;
    time_cap_minutes: number;
    category: DoubleSessionCategory;
    session: {
      main: string[];
      notes?: string[];
    };
    priority: {
      rank: 2 | 3;
      label: string;
      display_label: string;
      category_label: string;
      reason: string;
    };
  };
};

export type DayPlanWithDouble = DayPlan & {
  double_session?: DoubleSessionDetail;
};

// ─── Configuration ─────────────────────────────────────────────────────────────

/** Max doubles per week by ability + band */
function maxDoublesForWeek(
  ability: AbilityLevel,
  band: WeeklyHoursBand
): number {
  if (band === "2-3" || band === "3-5") return 0; // not enough time
  if (ability === "beginner") return band === "5-7" ? 1 : 1;
  if (ability === "intermediate") return band === "5-7" ? 1 : 2;
  // advanced
  if (band === "5-7") return 2;
  if (band === "7-10") return 3;
  return 3; // 10+
}

/** Days of the week that are inherently high-fatigue — avoid adding secondary sessions */
function isHighFatigueTitle(title: string): boolean {
  const t = title.toLowerCase();
  return (
    t.includes("threshold") ||
    t.includes("interval") ||
    t.includes("compromised") ||
    t.includes("race") ||
    t.includes("peak") ||
    t.includes("engine") ||
    t.includes("heavy")
  );
}

function isAlreadyRecovery(day: DayPlan): boolean {
  const t = (day.title ?? "").toLowerCase();
  const t0 = (day.tags?.[0] ?? "").toLowerCase();
  return (
    t0 === "recovery" ||
    t.includes("recovery") ||
    t.includes("mobility") ||
    t.includes("rest")
  );
}

// ─── Secondary session catalogue ───────────────────────────────────────────────

type SecondaryTemplate = {
  title: string;
  intent: string;
  time_cap_minutes: number;
  category: DoubleSessionCategory;
  session: { main: string[]; notes?: string[] };
  suits: GoalFocus[];
  minHoursBand: WeeklyHoursBand;
};

const SECONDARY_SESSIONS: SecondaryTemplate[] = [
  {
    title: "Easy Z2 Bike / Row Flush",
    intent: "Low-intensity aerobic flush to promote recovery and extend aerobic base without adding fatigue.",
    time_cap_minutes: 30,
    category: "aerobic",
    session: {
      main: [
        "30 min easy bike or rowing ergometer at Z2 pace (conversational, nose-breathe)",
        "HR should stay below 140 bpm throughout",
      ],
      notes: ["Optional — skip if legs feel heavy from the AM session.", "This is a support session only; effort level should feel almost too easy."],
    },
    suits: ["hybrid", "running", "muscle"],
    minHoursBand: "5-7",
  },
  {
    title: "Mobility & Activation",
    intent: "Targeted mobility and movement prep to support recovery and keep you moving well.",
    time_cap_minutes: 20,
    category: "recovery",
    session: {
      main: [
        "Hip flexor stretch x 90 sec each side",
        "Thoracic spine rotation x 10 each side",
        "Glute bridge hold x 45 sec x 3",
        "Ankle circles and calf raises x 20",
        "Light foam roll: quads, hamstrings, lats",
      ],
      notes: ["No intensity target — this is recovery work only.", "Do it in 15–20 min or skip if pressed for time."],
    },
    suits: ["hybrid", "running", "muscle"],
    minHoursBand: "5-7",
  },
  {
    title: "Upper Accessory Work",
    intent: "Optional upper-body accessory to complement strength training without adding lower-body fatigue.",
    time_cap_minutes: 25,
    category: "strength",
    session: {
      main: [
        "3 x 10 dumbbell rows (each arm)",
        "3 x 12 banded pull-aparts",
        "3 x 10 dumbbell shoulder press",
        "2 x 12 tricep dips or pushdowns",
      ],
      notes: ["Keep weights moderate — this is support work, not a main strength session.", "Skip if shoulders or elbows feel stiff from morning session."],
    },
    suits: ["hybrid", "muscle"],
    minHoursBand: "5-7",
  },
  {
    title: "Easy SkiErg or Rower Easy",
    intent: "Low-cost aerobic session using erg modality to build capacity without impact.",
    time_cap_minutes: 25,
    category: "aerobic",
    session: {
      main: [
        "25 min continuous easy SkiErg or Row at Z2 pace",
        "Target: pace feels controlled, breathing comfortable throughout",
      ],
      notes: ["Optional support session — skip if afternoon energy is low.", "Focus on stroke quality and relaxed posture, not split times."],
    },
    suits: ["hybrid", "running"],
    minHoursBand: "5-7",
  },
  {
    title: "Recovery Walk or Easy Jog",
    intent: "Active recovery to promote circulation and prepare for the next quality session.",
    time_cap_minutes: 20,
    category: "recovery",
    session: {
      main: [
        "20 min easy walk or gentle jog (conversational pace only)",
        "Focus on getting outside and moving — no intensity target",
      ],
      notes: ["This is pure recovery. Treat it like a break, not training.", "If the weather is poor, use a treadmill at walking speed or skip entirely."],
    },
    suits: ["hybrid", "running", "muscle"],
    minHoursBand: "5-7",
  },
];

const BAND_ORDER: WeeklyHoursBand[] = ["2-3", "3-5", "5-7", "7-10", "10+"];
function bandIndex(b: WeeklyHoursBand): number {
  return BAND_ORDER.indexOf(b);
}
function bandMeets(actual: WeeklyHoursBand, min: WeeklyHoursBand): boolean {
  return bandIndex(actual) >= bandIndex(min);
}

function pickSecondaryTemplate(
  goal: GoalFocus,
  band: WeeklyHoursBand,
  hasInjury: boolean,
  usedTitles: Set<string>,
  /** After hard AM sessions: only mobility / recovery walk style — never Z2 bike as “second hard”. */
  forceRecoveryOnly?: boolean
): SecondaryTemplate | null {
  const recoveryOnly = Boolean(hasInjury || forceRecoveryOnly);
  const candidates = SECONDARY_SESSIONS.filter(
    (s) =>
      s.suits.includes(goal) &&
      bandMeets(band, s.minHoursBand) &&
      !usedTitles.has(s.title) &&
      (!recoveryOnly || s.category === "recovery")
  );
  if (candidates.length > 0) return candidates[0] ?? null;

  if (recoveryOnly) {
    return (
      SECONDARY_SESSIONS.find(
        (s) =>
          s.category === "recovery" &&
          s.suits.includes(goal) &&
          bandMeets(band, s.minHoursBand) &&
          !usedTitles.has(s.title)
      ) ?? null
    );
  }
  return null;
}

function dayKeyToName(day: string): string {
  return day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
}

// ─── Main planner ─────────────────────────────────────────────────────────────

export type DoublePlannerInput = {
  schedule: DayPlan[];
  goal_focus: GoalFocus;
  ability_level: AbilityLevel;
  weekly_hours_band: WeeklyHoursBand;
  double_sessions: boolean;
  double_session_days?: string[]; // preferred days from assessment
  has_injury?: boolean;
};

export function applyDoubleSessions(
  input: DoublePlannerInput
): DayPlanWithDouble[] {
  if (!input.double_sessions || input.weekly_hours_band === "2-3" || input.weekly_hours_band === "3-5") {
    // No doubles — return plain schedule as DayPlanWithDouble[] (no double_session field)
    return input.schedule as DayPlanWithDouble[];
  }

  const maxDoubles = maxDoublesForWeek(input.ability_level, input.weekly_hours_band);
  if (maxDoubles === 0) return input.schedule as DayPlanWithDouble[];

  const result: DayPlanWithDouble[] = input.schedule.map((d) => ({ ...d }));

  // Normalise preferred day names for comparison
  const preferredDays = (input.double_session_days ?? []).map((d) =>
    d.toLowerCase().trim().slice(0, 3)
  );

  const usedSecondaryTitles = new Set<string>();
  let doublesApplied = 0;

  for (let i = 0; i < result.length && doublesApplied < maxDoubles; i++) {
    const day = result[i];

    // Skip rest / recovery days — no secondary
    if (isAlreadyRecovery(day)) continue;

    // Check day matches preferred days (if provided)
    const dayKey = (day.day ?? "").toLowerCase().trim().slice(0, 3);
    if (preferredDays.length > 0 && !preferredDays.includes(dayKey)) continue;

    /** Hard AM sessions: intermediate/advanced get recovery/mobility PM only (not Z2 / strength add-ons). */
    const forceRecoveryOnly =
      input.ability_level !== "beginner" && isHighFatigueTitle(day.title);

    const secondary = pickSecondaryTemplate(
      input.goal_focus,
      input.weekly_hours_band,
      Boolean(input.has_injury),
      usedSecondaryTitles,
      forceRecoveryOnly
    );
    if (!secondary) continue;

    usedSecondaryTitles.add(secondary.title);

    const label: "AM/PM" | "Optional Support" =
      input.ability_level === "beginner" ? "Optional Support" : "AM/PM";

    result[i] = {
      ...day,
      double_session: {
        enabled: true,
        label,
        secondary: {
          title: secondary.title,
          intent: secondary.intent,
          time_cap_minutes: secondary.time_cap_minutes,
          category: secondary.category,
          session: secondary.session,
          priority: {
            rank: 3,
            label: "Optional",
            display_label: "Optional Support",
            category_label: secondary.category.charAt(0).toUpperCase() + secondary.category.slice(1),
            reason: `This is a secondary support session on ${dayKeyToName(day.day ?? "this day")}. It adds aerobic or recovery value without competing with your main session.`,
          },
        },
      },
    };
    doublesApplied++;
  }

  return result;
}
