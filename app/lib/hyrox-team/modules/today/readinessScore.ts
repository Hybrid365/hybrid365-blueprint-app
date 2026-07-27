/**
 * HYROX Team — Daily readiness indicator (rule engine).
 *
 * DOCUMENTATION (source of truth for scoring behaviour)
 * ----------------------------------------------------
 * Purpose: A transparent, deterministic readiness *indicator* for coaching
 *          awareness. Not a medical diagnosis, not HRV, not recovery science AI.
 *
 * Input scale (subjective, required when submitting):
 *   sleep_quality, energy, motivation, stress, muscle_soreness — integers 1–10
 *   Higher is better for sleep / energy / motivation.
 *   Higher is worse for stress / muscle_soreness.
 *
 * Optional (ignored by score if missing):
 *   bodyweight, resting_hr — stored for coach context only; never invent HRV.
 *
 * Boolean:
 *   feeling_unwell — illness override → category forced to red.
 *
 * Missing subjective values:
 *   Any missing 1–10 field is excluded from the weighted average and its weight
 *   is redistributed among present fields. If fewer than 2 subjective fields are
 *   present, score is null and category defaults to amber with an explanation
 *   asking the athlete to complete the check-in.
 *
 * Weights (explicit, no hidden terms):
 *   sleep_quality     0.25
 *   energy            0.20
 *   motivation        0.15
 *   stress (inverted) 0.20
 *   muscle_soreness (inverted) 0.20
 *
 * Normalisation:
 *   positive metric → (value / 10) * 100
 *   inverted metric → ((11 - value) / 10) * 100
 *   Weighted mean → bounded score 0–100 (rounded).
 *
 * Category thresholds:
 *   green  ≥ 70  → Ready
 *   amber  45–69 → Manage Load
 *   red    < 45  → Recovery Priority
 *
 * Overrides (applied after base score):
 *   1. feeling_unwell === true → red (score capped at 30 if higher)
 *   2. muscle_soreness >= 9 AND sleep_quality <= 4 → red
 *   3. muscle_soreness >= 8 → category cannot be green (downgrade to amber)
 *
 * Explanation:
 *   Lists up to two largest negative contributors (lowest normalised component
 *   scores), plus illness/soreness override notes when applied.
 *
 * Coaching prompts (conservative; never auto-change programme):
 *   green — Complete the session as prescribed.
 *   amber — Begin as planned, but keep the session controlled and report how you feel.
 *   red   — Contact your coach before completing high-intensity work.
 */

export type ReadinessCategory = "green" | "amber" | "red";

export type DailyReadinessInputs = {
  sleepQuality?: number | null;
  energy?: number | null;
  motivation?: number | null;
  stress?: number | null;
  muscleSoreness?: number | null;
  feelingUnwell?: boolean;
  bodyweight?: number | null;
  restingHr?: number | null;
  /** Optional — stored in inputs_json; manual entry only. */
  sleepDurationMinutes?: number | null;
  /** Optional — stored in inputs_json; manual entry only. */
  hrv?: number | null;
  /** Optional — stored in inputs_json. */
  recoveryNotes?: string | null;
};

export type ReadinessScoreResult = {
  score: number | null;
  category: ReadinessCategory;
  label: "Ready" | "Manage Load" | "Recovery Priority";
  explanation: string;
  coachingPrompt: string;
  contributors: Array<{ key: string; label: string; normalised: number; weight: number }>;
  overridesApplied: string[];
};

const WEIGHTS = {
  sleepQuality: 0.25,
  energy: 0.2,
  motivation: 0.15,
  stress: 0.2,
  muscleSoreness: 0.2,
} as const;

const LABELS: Record<keyof typeof WEIGHTS, string> = {
  sleepQuality: "sleep",
  energy: "energy",
  motivation: "motivation",
  stress: "stress",
  muscleSoreness: "muscle soreness",
};

const PROMPTS: Record<ReadinessCategory, string> = {
  green: "Complete the session as prescribed.",
  amber: "Begin as planned, but keep the session controlled and report how you feel.",
  red: "Contact your coach before completing high-intensity work.",
};

const CATEGORY_LABEL: Record<ReadinessCategory, ReadinessScoreResult["label"]> = {
  green: "Ready",
  amber: "Manage Load",
  red: "Recovery Priority",
};

function clampInt(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  const rounded = Math.round(n);
  if (rounded < 1 || rounded > 10) return null;
  return rounded;
}

function categoryFromScore(score: number): ReadinessCategory {
  if (score >= 70) return "green";
  if (score >= 45) return "amber";
  return "red";
}

/**
 * Compute the daily readiness indicator from athlete inputs.
 * Pure / deterministic — same inputs always yield the same result.
 */
export function computeDailyReadinessScore(raw: DailyReadinessInputs): ReadinessScoreResult {
  const sleepQuality = clampInt(raw.sleepQuality);
  const energy = clampInt(raw.energy);
  const motivation = clampInt(raw.motivation);
  const stress = clampInt(raw.stress);
  const muscleSoreness = clampInt(raw.muscleSoreness);
  const feelingUnwell = Boolean(raw.feelingUnwell);

  const components: ReadinessScoreResult["contributors"] = [];

  const pushPositive = (key: keyof typeof WEIGHTS, value: number | null) => {
    if (value == null) return;
    components.push({
      key,
      label: LABELS[key],
      normalised: (value / 10) * 100,
      weight: WEIGHTS[key],
    });
  };
  const pushInverted = (key: keyof typeof WEIGHTS, value: number | null) => {
    if (value == null) return;
    components.push({
      key,
      label: LABELS[key],
      normalised: ((11 - value) / 10) * 100,
      weight: WEIGHTS[key],
    });
  };

  pushPositive("sleepQuality", sleepQuality);
  pushPositive("energy", energy);
  pushPositive("motivation", motivation);
  pushInverted("stress", stress);
  pushInverted("muscleSoreness", muscleSoreness);

  const overridesApplied: string[] = [];
  let score: number | null = null;
  let category: ReadinessCategory = "amber";

  if (components.length < 2) {
    return {
      score: null,
      category: "amber",
      label: CATEGORY_LABEL.amber,
      explanation: "Complete at least two readiness ratings to generate today’s indicator.",
      coachingPrompt: PROMPTS.amber,
      contributors: components,
      overridesApplied,
    };
  }

  const weightSum = components.reduce((a, c) => a + c.weight, 0);
  score = Math.round(
    components.reduce((a, c) => a + c.normalised * c.weight, 0) / weightSum
  );
  score = Math.max(0, Math.min(100, score));
  category = categoryFromScore(score);

  if (feelingUnwell) {
    overridesApplied.push("illness");
    category = "red";
    if (score > 30) score = 30;
  }

  if (muscleSoreness != null && muscleSoreness >= 9 && sleepQuality != null && sleepQuality <= 4) {
    overridesApplied.push("high-soreness-low-sleep");
    category = "red";
  } else if (muscleSoreness != null && muscleSoreness >= 8 && category === "green") {
    overridesApplied.push("high-soreness");
    category = "amber";
  }

  const sortedNeg = [...components].sort((a, b) => a.normalised - b.normalised);
  const topNeg = sortedNeg.slice(0, 2).filter((c) => c.normalised < 70);
  let explanation: string;
  if (feelingUnwell) {
    explanation = "Illness / feeling unwell flagged — recovery is the priority today.";
  } else if (topNeg.length >= 2) {
    explanation = `Lower ${topNeg[0].label} and ${topNeg[1].label} reduced today’s readiness.`;
  } else if (topNeg.length === 1) {
    explanation = `Lower ${topNeg[0].label} reduced today’s readiness.`;
  } else if (category === "green") {
    explanation = "Subjective markers look solid for today’s prescribed work.";
  } else {
    explanation = "Readiness is moderated — keep today controlled and report how you feel.";
  }

  if (overridesApplied.includes("high-soreness") || overridesApplied.includes("high-soreness-low-sleep")) {
    explanation = `${explanation} High muscle soreness was weighted carefully.`.replace(
      /\.\./g,
      "."
    );
  }

  return {
    score,
    category,
    label: CATEGORY_LABEL[category],
    explanation,
    coachingPrompt: PROMPTS[category],
    contributors: components,
    overridesApplied,
  };
}

export function readinessCategoryChipClass(category: ReadinessCategory): string {
  if (category === "green") return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
  if (category === "amber") return "border-amber-500/40 bg-amber-500/10 text-amber-200";
  return "border-red-500/40 bg-red-500/10 text-red-200";
}
