// app/lib/buildWeekBlueprint.ts

import { weightedPick } from "./weightedPick";
import {
  GoalFocus,
  AbilityLevel,
  WeeklyHoursBand,
  DayKey,
  DayPlan,
  PlanJson,
  LOWER_STRENGTH,
  UPPER_STRENGTH,
  QUALITY_RUNS,
  AEROBIC_BASE,
  LONG_RUNS,
  COMPROMISED_HYROX,
  RECOVERY,
  Template,
} from "./sessionLibrary";

export type BlueprintInput = {
  days_per_week: number;
  weekly_hours_band: WeeklyHoursBand;
  goal_focus: GoalFocus;
  ability_level: AbilityLevel;
};

function getIntensitySplit(ability: AbilityLevel) {
  if (ability === "beginner") return { easy_percent: 75, hard_percent: 25 };
  if (ability === "advanced") return { easy_percent: 65, hard_percent: 35 };
  return { easy_percent: 70, hard_percent: 30 };
}

function shouldBeActive(day: DayKey, daysPerWeek: number): boolean {
  if (daysPerWeek <= 2) return ["Mon", "Tue"].includes(day);
  if (daysPerWeek === 3) return ["Mon", "Tue", "Fri"].includes(day);
  if (daysPerWeek === 4) return ["Mon", "Tue", "Wed", "Fri"].includes(day);
  if (daysPerWeek === 5) return ["Mon", "Tue", "Wed", "Fri", "Sat"].includes(day);
  if (daysPerWeek === 6) return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].includes(day);
  return true;
}

function pickMonday(goal: GoalFocus): Template {
  if (goal === "muscle") {
    return weightedPick([
      { item: LOWER_STRENGTH[1], weight: 0.35 },
      { item: LOWER_STRENGTH[4], weight: 0.25 },
      { item: LOWER_STRENGTH[0], weight: 0.20 },
      { item: LOWER_STRENGTH[2], weight: 0.10 },
      { item: LOWER_STRENGTH[3], weight: 0.10 },
    ]);
  }

  if (goal === "running") {
    return weightedPick([
      { item: LOWER_STRENGTH[0], weight: 0.35 },
      { item: LOWER_STRENGTH[3], weight: 0.25 },
      { item: LOWER_STRENGTH[2], weight: 0.20 },
      { item: LOWER_STRENGTH[1], weight: 0.10 },
      { item: LOWER_STRENGTH[4], weight: 0.10 },
    ]);
  }

  return weightedPick([
    { item: LOWER_STRENGTH[0], weight: 0.20 },
    { item: LOWER_STRENGTH[1], weight: 0.20 },
    { item: LOWER_STRENGTH[2], weight: 0.20 },
    { item: LOWER_STRENGTH[3], weight: 0.20 },
    { item: LOWER_STRENGTH[4], weight: 0.20 },
  ]);
}

function pickTuesday(goal: GoalFocus, ability: AbilityLevel): Template {
  const beginnerOptions = QUALITY_RUNS.filter((x) => x.id.startsWith("RUN-BEG"));
  const thresholdOptions = QUALITY_RUNS.filter((x) => x.id.startsWith("THR"));

  if (ability === "beginner") {
    return weightedPick([
      { item: beginnerOptions[0], weight: 0.4 },
      { item: beginnerOptions[1], weight: 0.3 },
      { item: beginnerOptions[2], weight: 0.3 },
    ]);
  }

  if (goal === "running") {
    return weightedPick([
      { item: thresholdOptions[0], weight: 0.45 },
      { item: thresholdOptions[2], weight: 0.30 },
      { item: thresholdOptions[1], weight: 0.25 },
    ]);
  }

  if (goal === "muscle") {
    return weightedPick([
      { item: thresholdOptions[1], weight: 0.45 },
      { item: thresholdOptions[0], weight: 0.30 },
      { item: beginnerOptions[1], weight: 0.25 },
    ]);
  }

  return weightedPick([
    { item: thresholdOptions[0], weight: 0.34 },
    { item: thresholdOptions[1], weight: 0.33 },
    { item: thresholdOptions[2], weight: 0.33 },
  ]);
}

function pickWednesday(goal: GoalFocus): Template {
  if (goal === "muscle") {
    return weightedPick([
      { item: UPPER_STRENGTH[1], weight: 0.30 },
      { item: UPPER_STRENGTH[0], weight: 0.20 },
      { item: UPPER_STRENGTH[2], weight: 0.15 },
      { item: UPPER_STRENGTH[3], weight: 0.15 },
      { item: UPPER_STRENGTH[4], weight: 0.20 },
    ]);
  }

  return weightedPick([
    { item: UPPER_STRENGTH[0], weight: 0.22 },
    { item: UPPER_STRENGTH[1], weight: 0.22 },
    { item: UPPER_STRENGTH[2], weight: 0.18 },
    { item: UPPER_STRENGTH[3], weight: 0.18 },
    { item: UPPER_STRENGTH[4], weight: 0.20 },
  ]);
}

function pickThursday(hours: WeeklyHoursBand): Template {
  if (hours === "10+" || hours === "7-10") {
    return weightedPick([
      { item: AEROBIC_BASE[1], weight: 0.25 },
      { item: AEROBIC_BASE[2], weight: 0.15 },
      { item: AEROBIC_BASE[3], weight: 0.20 },
      { item: AEROBIC_BASE[4], weight: 0.20 },
      { item: AEROBIC_BASE[5], weight: 0.20 },
    ]);
  }

  return weightedPick([
    { item: AEROBIC_BASE[0], weight: 0.25 },
    { item: AEROBIC_BASE[1], weight: 0.20 },
    { item: AEROBIC_BASE[2], weight: 0.20 },
    { item: AEROBIC_BASE[3], weight: 0.15 },
    { item: AEROBIC_BASE[4], weight: 0.20 },
  ]);
}

function pickFriday(goal: GoalFocus, ability: AbilityLevel): Template {
  const easier = COMPROMISED_HYROX.filter((x) => ["COMP-D", "COMP-F"].includes(x.id));
  const harder = COMPROMISED_HYROX.filter((x) => ["COMP-A", "COMP-B", "COMP-C", "COMP-E"].includes(x.id));

  if (ability === "beginner") {
    return weightedPick([
      { item: easier[0], weight: 0.35 },
      { item: easier[1], weight: 0.25 },
      { item: harder[0], weight: 0.20 },
      { item: harder[2], weight: 0.20 },
    ]);
  }

  if (goal === "running") {
    return weightedPick([
      { item: COMPROMISED_HYROX[0], weight: 0.25 },
      { item: COMPROMISED_HYROX[2], weight: 0.25 },
      { item: COMPROMISED_HYROX[3], weight: 0.20 },
      { item: COMPROMISED_HYROX[5], weight: 0.15 },
      { item: COMPROMISED_HYROX[1], weight: 0.15 },
    ]);
  }

  if (goal === "muscle") {
    return weightedPick([
      { item: COMPROMISED_HYROX[3], weight: 0.30 },
      { item: COMPROMISED_HYROX[5], weight: 0.20 },
      { item: COMPROMISED_HYROX[0], weight: 0.20 },
      { item: COMPROMISED_HYROX[2], weight: 0.15 },
      { item: COMPROMISED_HYROX[4], weight: 0.15 },
    ]);
  }

  return weightedPick([
    { item: COMPROMISED_HYROX[0], weight: 0.18 },
    { item: COMPROMISED_HYROX[1], weight: 0.20 },
    { item: COMPROMISED_HYROX[2], weight: 0.18 },
    { item: COMPROMISED_HYROX[3], weight: 0.14 },
    { item: COMPROMISED_HYROX[4], weight: 0.15 },
    { item: COMPROMISED_HYROX[5], weight: 0.15 },
  ]);
}

function pickSaturday(goal: GoalFocus, ability: AbilityLevel): Template {
  if (goal === "running") {
    return weightedPick([
      { item: LONG_RUNS[1], weight: 0.25 },
      { item: LONG_RUNS[0], weight: 0.20 },
      { item: LONG_RUNS[2], weight: 0.15 },
      { item: LONG_RUNS[3], weight: 0.20 },
      { item: LONG_RUNS[5], weight: 0.20 },
    ]);
  }

  if (goal === "muscle") {
    return weightedPick([
      { item: LONG_RUNS[0], weight: 0.30 },
      { item: LONG_RUNS[2], weight: 0.20 },
      { item: LONG_RUNS[5], weight: 0.20 },
      { item: LONG_RUNS[3], weight: 0.15 },
      { item: LONG_RUNS[4], weight: 0.15 },
    ]);
  }

  if (ability === "beginner") {
    return weightedPick([
      { item: LONG_RUNS[0], weight: 0.35 },
      { item: LONG_RUNS[2], weight: 0.25 },
      { item: LONG_RUNS[5], weight: 0.20 },
      { item: LONG_RUNS[3], weight: 0.20 },
    ]);
  }

  return weightedPick([
    { item: LONG_RUNS[0], weight: 0.18 },
    { item: LONG_RUNS[1], weight: 0.18 },
    { item: LONG_RUNS[2], weight: 0.16 },
    { item: LONG_RUNS[3], weight: 0.16 },
    { item: LONG_RUNS[4], weight: 0.16 },
    { item: LONG_RUNS[5], weight: 0.16 },
  ]);
}

function pickSunday(): Template {
  return weightedPick([
    { item: RECOVERY[0], weight: 0.20 },
    { item: RECOVERY[1], weight: 0.20 },
    { item: RECOVERY[2], weight: 0.20 },
    { item: RECOVERY[3], weight: 0.20 },
    { item: RECOVERY[4], weight: 0.20 },
  ]);
}

function buildDay(
  day: DayKey,
  template: Template,
  ability: AbilityLevel,
  hours: WeeklyHoursBand,
  intent: string
): DayPlan {
  return {
    day,
    title: template.title,
    intent,
    session: template.build(ability, hours),
    time_cap_minutes: template.time_cap_minutes,
    tags: template.tags,
  };
}

function recoveryReplacement(day: DayKey): DayPlan {
  return {
    day,
    title: "Recovery / Mobility",
    intent: "Light recovery support.",
    session: {
      main: ["20–30 min easy walk or bike", "10–15 min mobility"],
      notes: ["Keep this easy. The goal is recovery, not fatigue."],
    },
    time_cap_minutes: 35,
    tags: ["recovery"],
  };
}

export function buildWeekBlueprint(input: BlueprintInput): PlanJson {
  const { days_per_week, weekly_hours_band, goal_focus, ability_level } = input;

  const week: DayPlan[] = [
    buildDay("Mon", pickMonday(goal_focus), ability_level, weekly_hours_band, "Primary lower body strength day."),
    buildDay("Tue", pickTuesday(goal_focus, ability_level), ability_level, weekly_hours_band, "Primary quality run day."),
    buildDay("Wed", pickWednesday(goal_focus), ability_level, weekly_hours_band, "Upper body strength + aerobic support."),
    buildDay("Thu", pickThursday(weekly_hours_band), ability_level, weekly_hours_band, "Aerobic base builder."),
    buildDay("Fri", pickFriday(goal_focus, ability_level), ability_level, weekly_hours_band, "Compromised hybrid / Hyrox style session."),
    buildDay("Sat", pickSaturday(goal_focus, ability_level), ability_level, weekly_hours_band, "Long aerobic development."),
    buildDay("Sun", pickSunday(), ability_level, weekly_hours_band, "Recovery, mobility and durability."),
  ];

  const finalWeek = week.map((day) => {
    if (shouldBeActive(day.day, days_per_week)) return day;

    if (day.day === "Thu") {
      return {
        day: "Thu" as const,
        title: "Aerobic Support (Light)",
        intent: "Light base work only.",
        session: {
          main: ["20–40 min easy Z2 bike or jog", "Optional: lower leg durability 2 rounds"],
          notes: ["Keep it very easy."],
        },
        time_cap_minutes: 40,
        tags: ["aerobic", "easy"],
      };
    }

    if (day.day === "Sat") {
      return {
        day: "Sat" as const,
        title: "Optional Aerobic",
        intent: "Optional easy base work.",
        session: {
          main: ["30–45 min Z2 run or bike", "10 min mobility"],
          notes: ["Only do this if recovery feels good."],
        },
        time_cap_minutes: 50,
        tags: ["aerobic", "easy"],
      };
    }

    return recoveryReplacement(day.day);
  });

  return {
    intensity_split: getIntensitySplit(ability_level),
    schedule: finalWeek,
    cta: {
      headline: "Want this fully personalised to your numbers and race goals?",
      body: "Hybrid365 members get full session detail, progression week-to-week, and accountability.",
      button_url: "https://www.levelete.com/hybridtrainingmastery",
    },
  };
}