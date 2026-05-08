import type {
  AbilityLevel,
  Fatigue,
  Intensity,
  SessionCategory,
  WeeklyHoursBand,
  WeeklyStressLabel,
  WeeklyStressSummary,
} from "./sessionLibrary";

export type SessionStressInput = {
  day: string;
  title: string;
  category: SessionCategory;
  type: string;
  intensity: Intensity;
  fatigue: Fatigue;
  duration: number;
};

const DISCLOSURE =
  "This score is a planning guide, not a medical or physiological measurement.";

const COACHING_NOTES: Record<WeeklyStressLabel, string> = {
  low: "This is a lower-stress week designed to build consistency without excessive fatigue.",
  balanced:
    "This week has a balanced stress profile for your level and available training time.",
  high: "This week carries a higher training load. Prioritise sleep, nutrition and recovery around the key sessions.",
  very_high:
    "This week is a very high load relative to your inputs. Treat recovery as non-negotiable and reduce optional extras if needed.",
};

const DISPLAY_LABELS: Record<WeeklyStressLabel, string> = {
  low: "Low Relative Load",
  balanced: "Balanced Load",
  high: "High Relative Load",
  very_high: "Very High Relative Load",
};

function dailyLabelFromScore(score: number): "low" | "moderate" | "high" | "very_high" {
  if (score < 1.5) return "low";
  if (score <= 2.75) return "moderate";
  if (score <= 3.75) return "high";
  return "very_high";
}

function fatigueScore(f: Fatigue): number {
  if (f === "low") return 1;
  if (f === "medium") return 2;
  return 3;
}

function intensityScore(i: Intensity): number {
  if (i === "low") return 1;
  if (i === "medium") return 2;
  return 3;
}

function durationFactor(minutes: number): number {
  if (minutes <= 30) return 0.75;
  if (minutes <= 45) return 1;
  if (minutes <= 75) return 1.25;
  return 1.5;
}

function categoryModifier(category: SessionCategory): number {
  if (category === "recovery") return 0.5;
  if (category === "aerobic") return 0.8;
  if (category === "strength") return 1;
  if (category === "run") return 1;
  return 1.15;
}

export function computeSessionStress(input: SessionStressInput): number {
  const f = fatigueScore(input.fatigue);
  const i = intensityScore(input.intensity);
  const d = durationFactor(input.duration);
  const base = (f * 0.6 + i * 0.4) * d;
  const score = base * categoryModifier(input.category);
  return Math.round(score * 10) / 10;
}

function baseBudget(hours: WeeklyHoursBand): number {
  const map: Record<WeeklyHoursBand, number> = {
    "2-3": 6,
    "3-5": 8,
    "5-7": 11,
    "7-10": 14,
    "10+": 17,
  };
  return map[hours];
}

function abilityMultiplier(level: AbilityLevel): number {
  if (level === "beginner") return 0.85;
  if (level === "advanced") return 1.15;
  return 1;
}

function labelFromRelativeLoad(rel: number): WeeklyStressLabel {
  if (rel < 0.75) return "low";
  if (rel <= 1.15) return "balanced";
  if (rel <= 1.35) return "high";
  return "very_high";
}

export function computeWeeklyStress(
  inputs: SessionStressInput[],
  weekly_hours_band: WeeklyHoursBand,
  ability_level: AbilityLevel,
  planned_minutes: number
): WeeklyStressSummary {
  const scoredDays = inputs.map((s) => {
    const score = computeSessionStress(s);
    return {
      day: s.day,
      title: s.title,
      category: s.category,
      score,
      label: dailyLabelFromScore(score),
    };
  });
  const raw_score = Math.round(scoredDays.reduce((sum, day) => sum + day.score, 0) * 10) / 10;

  const budget =
    Math.round(baseBudget(weekly_hours_band) * abilityMultiplier(ability_level) * 100) / 100;

  const relative_load = budget > 0 ? Math.round((raw_score / budget) * 1000) / 1000 : 0;

  const label = labelFromRelativeLoad(relative_load);
  const hard_sessions = inputs.filter((s) => s.intensity === "high").length;
  const high_fatigue_sessions = inputs.filter((s) => s.fatigue === "high").length;
  const safePlannedMinutes = Math.max(0, Math.round(planned_minutes));
  const estimated_hours = Math.round((safePlannedMinutes / 60) * 10) / 10;

  return {
    raw_score,
    budget,
    relative_load,
    label,
    display_label: DISPLAY_LABELS[label],
    hard_sessions,
    high_fatigue_sessions,
    planned_minutes: safePlannedMinutes,
    estimated_hours,
    daily_breakdown: scoredDays,
    notes: [COACHING_NOTES[label], DISCLOSURE],
  };
}
