/**
 * Per-session run intensity guidance (pace, HR, RPE) for paid programme plans.
 * Estimates from 5km benchmark and optional max HR — coaching ranges, not lab precision.
 */

import type { GoalFocus } from "./sessionLibrary";
import type { PaceGuidance } from "./paceGuidance";

export type RunPrescription = {
  pace_range: string | null;
  hr_range: string | null;
  rpe: string;
  effort_description: string;
  coach_note: string;
};

type IntensityKey = "easy" | "steady" | "tempo" | "threshold" | "interval" | "hyrox_race";

const COACH_NOTES: Record<IntensityKey, string> = {
  easy:
    "Keep this genuinely easy. You should be able to talk in full sentences.",
  steady:
    "Comfortable aerobic. Do not turn this into a race.",
  tempo:
    "Smoothly uncomfortable. Hold a rhythm you could sustain for 20–30 minutes in a race.",
  threshold:
    "Controlled hard. You should be able to complete every rep without sprinting. Finish feeling like you could do one more.",
  interval:
    "Fast but controlled. Prioritise repeatability over one heroic rep.",
  hyrox_race:
    "Race-pace running between stations — controlled aggression, not an all-out 5km.",
};

const EFFORT_DESCRIPTIONS: Record<IntensityKey, string> = {
  easy: "Easy aerobic — conversational effort.",
  steady: "Steady aerobic — breathing rises but you stay controlled.",
  tempo: "Tempo — sustained moderate-hard rhythm.",
  threshold: "Threshold — hard but repeatable; lactate steady-state effort.",
  interval: "VO₂ / speed — hard intervals with full recovery between reps.",
  hyrox_race: "Hyrox race-pace running — firm but sustainable between stations.",
};

const RPE_BY_INTENSITY: Record<IntensityKey, string> = {
  easy: "RPE 3–4",
  steady: "RPE 4–5",
  tempo: "RPE 6–7",
  threshold: "RPE 7–8",
  interval: "RPE 8–9",
  hyrox_race: "RPE 7–8",
};

const HR_PCT: Record<IntensityKey, { low: number; high: number; caution?: string } | null> = {
  easy: { low: 0.65, high: 0.75 },
  steady: { low: 0.75, high: 0.82 },
  tempo: { low: 0.8, high: 0.85 },
  threshold: { low: 0.85, high: 0.9 },
  interval: { low: 0.9, high: 0.97, caution: "Use HR as a ceiling, not a target — stop the rep if form breaks down." },
  hyrox_race: { low: 0.82, high: 0.88 },
};

const FALLBACK_BY_INTENSITY: Record<
  IntensityKey,
  { rpe: string; effort: string; talkTest?: string }
> = {
  easy: {
    rpe: "RPE 3–4",
    effort: "Easy aerobic effort.",
    talkTest: "Talk-test: full sentences, no gasping.",
  },
  steady: {
    rpe: "RPE 4–5",
    effort: "Steady aerobic — controlled breathing.",
    talkTest: "Talk-test: short phrases, still in control.",
  },
  tempo: {
    rpe: "RPE 6–7",
    effort: "Tempo — rhythmically uncomfortable.",
    talkTest: "Talk-test: a few words at a time.",
  },
  threshold: {
    rpe: "RPE 7–8",
    effort: "Threshold — hard but repeatable.",
    talkTest: "Talk-test: single words only between efforts.",
  },
  interval: {
    rpe: "RPE 8–9",
    effort: "Hard intervals — full recovery between reps.",
    talkTest: "Talk-test: not sustainable during work intervals.",
  },
  hyrox_race: {
    rpe: "RPE 7–8",
    effort: "Firm race-pace running between stations.",
    talkTest: "Talk-test: minimal during work; recover on stations.",
  },
};

function intensityKeyForSessionType(sessionType: string, goalFocus?: GoalFocus): IntensityKey {
  switch (sessionType) {
    case "aerobic_run":
      return "easy";
    case "long_run":
      return "steady";
    case "tempo_run":
      return "tempo";
    case "threshold_run":
      return "threshold";
    case "interval_run":
      return "interval";
    default:
      if (goalFocus === "hybrid") return "hyrox_race";
      return "steady";
  }
}

function paceRangeForIntensity(g: PaceGuidance, key: IntensityKey): string | null {
  switch (key) {
    case "easy":
      return g.zones.easy;
    case "steady":
      return g.zones.steady;
    case "tempo":
      return g.zones.tempo;
    case "threshold":
      return g.zones.threshold;
    case "interval":
      return g.zones.interval;
    case "hyrox_race":
      return g.zones.hyrox_race ?? g.zones.steady;
    default:
      return null;
  }
}

function formatHrRange(maxHr: number, lowPct: number, highPct: number): string {
  const low = Math.round(maxHr * lowPct);
  const high = Math.round(maxHr * highPct);
  return `${low}–${high} bpm`;
}

function hrRangeForIntensity(maxHr: number, key: IntensityKey): string | null {
  const spec = HR_PCT[key];
  if (!spec) return null;
  const base = formatHrRange(maxHr, spec.low, spec.high);
  if (spec.caution) return `${base}. ${spec.caution}`;
  return base;
}

/**
 * Build structured intensity guidance for a run session in the programme plan.
 */
export function buildRunPrescription(args: {
  sessionType: string;
  paceGuidance: PaceGuidance | null;
  maxHeartRate: number | null;
  goalFocus?: GoalFocus;
}): RunPrescription {
  const key = intensityKeyForSessionType(args.sessionType, args.goalFocus);
  const pace =
    args.paceGuidance != null ? paceRangeForIntensity(args.paceGuidance, key) : null;
  const hr =
    args.maxHeartRate != null && Number.isFinite(args.maxHeartRate)
      ? hrRangeForIntensity(args.maxHeartRate, key)
      : null;

  const fallback = FALLBACK_BY_INTENSITY[key];
  const talkPart = !pace && fallback.talkTest ? ` ${fallback.talkTest}` : "";

  let effort_description = pace
    ? EFFORT_DESCRIPTIONS[key]
    : `${fallback.effort}${talkPart}`;

  if (!pace && hr) {
    effort_description = `${fallback.effort} Use HR as your primary guide.`;
  }

  return {
    pace_range: pace,
    hr_range: hr,
    rpe: pace ? RPE_BY_INTENSITY[key] : fallback.rpe,
    effort_description,
    coach_note: COACH_NOTES[key],
  };
}
