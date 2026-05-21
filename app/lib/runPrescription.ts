/**
 * Per-session run intensity guidance (pace, HR, RPE) for paid programme plans.
 * Estimates from 5km benchmark and optional max HR — coaching ranges, not lab precision.
 *
 * Note: programmes generated before pace/treadmill fields were added need regeneration
 * after updating 5km time or max HR in the assessment (or use week plan pace_guidance at display time).
 */

import type { GoalFocus } from "./sessionLibrary";
import {
  treadmillSpeedRangeFromPaceRange,
  type PaceGuidance,
} from "./paceGuidance";

export type RunPrescription = {
  pace_range: string | null;
  treadmill_speed_range: string | null;
  hr_range: string | null;
  rpe: string;
  effort_description: string;
  coach_note: string;
  /** Shown when 5km anchor exists, e.g. "Based on your 5km time…" */
  personalization_line: string | null;
  /** e.g. "Threshold — controlled hard" */
  intensity_label: string | null;
  pace_unavailable_note: string | null;
  hr_add_note: string | null;
};

export type ErgIntensityGuide = {
  rpe: string;
  hr_range: string | null;
  effort_description: string;
  coach_note: string;
  benchmark_note: string | null;
};

type IntensityKey = "easy" | "steady" | "tempo" | "threshold" | "interval" | "hyrox_race";

const INTENSITY_LABELS: Record<IntensityKey, string> = {
  easy: "Easy — conversational",
  steady: "Steady aerobic",
  tempo: "Tempo — controlled moderate-hard",
  threshold: "Threshold — controlled hard",
  interval: "Intervals — hard, repeatable",
  hyrox_race: "HYROX run — controlled race effort",
};

const COACH_NOTES: Record<IntensityKey, string> = {
  easy:
    "Keep this genuinely easy — conversational (RPE 3–4/10). If tired, run slower than the pace range rather than forcing it.",
  steady: "Comfortable aerobic. Do not turn this into a race.",
  tempo: "Smoothly uncomfortable. Hold a rhythm you could sustain for 20–30 minutes in a race.",
  threshold:
    "Controlled hard. You should be able to complete every rep without sprinting. Finish feeling like you could do one more.",
  interval: "Fast but controlled. Prioritise repeatability over one heroic rep.",
  hyrox_race:
    "Run pace: controlled HYROX race effort, not all-out. Use the pace range as a guide, but prioritise repeatability after stations.",
};

const EFFORT_DESCRIPTIONS: Record<IntensityKey, string> = {
  easy: "Easy aerobic — conversational effort. Effort matters more than forcing the top of the pace range.",
  steady: "Steady aerobic — breathing rises but you stay controlled.",
  tempo: "Tempo — sustained moderate-hard rhythm.",
  threshold: "Threshold — hard but repeatable; lactate steady-state effort.",
  interval: "VO₂ / speed — hard intervals with full recovery between reps.",
  hyrox_race: "HYROX race-pace running — firm but sustainable between stations.",
};

const RPE_BY_INTENSITY: Record<IntensityKey, string> = {
  easy: "RPE 3–4/10",
  steady: "RPE 4–5/10",
  tempo: "RPE 6–7/10",
  threshold: "RPE 7–8/10",
  interval: "RPE 8–9/10",
  hyrox_race: "RPE 7–8/10",
};

const HR_PCT: Record<IntensityKey, { low: number; high: number; caution?: string } | null> = {
  easy: { low: 0.65, high: 0.75 },
  steady: { low: 0.75, high: 0.82 },
  tempo: { low: 0.8, high: 0.85 },
  threshold: { low: 0.85, high: 0.9 },
  interval: {
    low: 0.9,
    high: 0.97,
    caution: "Use HR as a ceiling, not a target — stop the rep if form breaks down.",
  },
  hyrox_race: { low: 0.82, high: 0.88 },
};

const FALLBACK_BY_INTENSITY: Record<
  IntensityKey,
  { rpe: string; effort: string; talkTest?: string }
> = {
  easy: {
    rpe: "RPE 3–4/10",
    effort: "Easy aerobic effort.",
    talkTest: "Talk-test: full sentences, no gasping.",
  },
  steady: {
    rpe: "RPE 4–5/10",
    effort: "Steady aerobic — controlled breathing.",
    talkTest: "Talk-test: short phrases, still in control.",
  },
  tempo: {
    rpe: "RPE 6–7/10",
    effort: "Tempo — rhythmically uncomfortable.",
    talkTest: "Talk-test: a few words at a time.",
  },
  threshold: {
    rpe: "RPE 7–8/10",
    effort: "Threshold — hard but repeatable.",
    talkTest: "Talk-test: single words only between efforts.",
  },
  interval: {
    rpe: "RPE 8–9/10",
    effort: "Hard intervals — full recovery between reps.",
    talkTest: "Talk-test: not sustainable during work intervals.",
  },
  hyrox_race: {
    rpe: "RPE 7–8/10",
    effort: "Firm race-pace running between stations.",
    talkTest: "Talk-test: minimal during work; recover on stations.",
  },
};

const RUN_SESSION_TYPES = new Set([
  "aerobic_run",
  "long_run",
  "tempo_run",
  "threshold_run",
  "interval_run",
  "hybrid_compromised",
  "hybrid_density",
]);

const PACE_UNAVAILABLE =
  "Pace target unavailable — use RPE and talk-test guidance.";
const HR_ADD_NOTE = "Add max HR in your assessment for HR-based targets.";
const PERSONALIZATION_WITH_PACE =
  "Based on your 5km time and assessment data.";
const PERSONALIZATION_FALLBACK =
  "Built from your assessment: training level and current weekly running volume.";

const COMPROMISED_COACH =
  "Controlled compromise — run segments are firm but repeatable. Recover on stations; do not sprint the first run.";

export function sessionHasRunComponent(tags: string[], title: string): boolean {
  const t0 = (tags[0] ?? "").toLowerCase();
  if (RUN_SESSION_TYPES.has(t0)) return true;
  if (t0 === "hybrid_compromised") return true;
  const joined = tags.join(" ").toLowerCase();
  if (joined.includes("_run") || joined.includes("aerobic_run")) return true;
  if (/threshold run|tempo run|long run|easy run|interval run|aerobic run/i.test(title)) {
    return true;
  }
  if (/compromised|hyrox/i.test(title) && /run/i.test(title)) return true;
  return false;
}

export function intensityKeyForSessionType(
  sessionType: string,
  goalFocus?: GoalFocus
): IntensityKey {
  switch (sessionType) {
    case "aerobic_run":
      return "easy";
    case "long_run":
      return "easy";
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

/** Backfill treadmill / labels on prescriptions saved before display fields existed. */
export function enrichRunPrescription(rx: RunPrescription): RunPrescription {
  const treadmill =
    rx.treadmill_speed_range ?? treadmillSpeedRangeFromPaceRange(rx.pace_range);
  return {
    ...rx,
    treadmill_speed_range: treadmill,
    pace_unavailable_note: rx.pace_unavailable_note ?? (rx.pace_range ? null : PACE_UNAVAILABLE),
    hr_add_note: rx.hr_add_note ?? (rx.hr_range ? null : HR_ADD_NOTE),
    personalization_line:
      rx.personalization_line ??
      (rx.pace_range ? PERSONALIZATION_WITH_PACE : PERSONALIZATION_FALLBACK),
  };
}

/**
 * Build structured intensity guidance for a run session in the programme plan.
 */
export function buildRunPrescription(args: {
  sessionType: string;
  paceGuidance: PaceGuidance | null;
  maxHeartRate: number | null;
  goalFocus?: GoalFocus;
  hyroxTrack?: boolean;
}): RunPrescription {
  const key =
    args.hyroxTrack && args.sessionType === "hybrid_compromised"
      ? "hyrox_race"
      : args.hyroxTrack && args.sessionType === "hybrid_density"
        ? "steady"
        : intensityKeyForSessionType(args.sessionType, args.goalFocus);
  const pace =
    args.paceGuidance != null ? paceRangeForIntensity(args.paceGuidance, key) : null;
  const treadmill = treadmillSpeedRangeFromPaceRange(pace);
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

  let coach_note =
    args.hyroxTrack && args.sessionType === "hybrid_compromised"
      ? COMPROMISED_COACH
      : COACH_NOTES[key];
  if (args.sessionType === "long_run") {
    coach_note =
      "Long run should feel genuinely aerobic — conversational throughout. Prioritise RPE and talk test over hitting a pace.";
  }
  if (args.sessionType === "aerobic_run" || args.sessionType === "long_run") {
    coach_note = `${coach_note} Effort matters more than forcing the top of the pace range.`;
  }

  const rx: RunPrescription = {
    pace_range: pace,
    treadmill_speed_range: treadmill,
    hr_range: hr,
    rpe: RPE_BY_INTENSITY[key],
    effort_description,
    coach_note,
    personalization_line: pace ? PERSONALIZATION_WITH_PACE : PERSONALIZATION_FALLBACK,
    intensity_label: INTENSITY_LABELS[key],
    pace_unavailable_note: pace ? null : PACE_UNAVAILABLE,
    hr_add_note: hr ? null : HR_ADD_NOTE,
  };

  return rx;
}

/** Resolve prescription for dashboard display (stored plan or rebuilt from week pace_guidance). */
export function resolveRunPrescriptionForSession(args: {
  stored: RunPrescription | undefined;
  tags: string[];
  title: string;
  paceGuidance: PaceGuidance | null;
  maxHeartRate: number | null;
  goalFocus?: GoalFocus;
  hyroxTrack?: boolean;
}): RunPrescription | undefined {
  if (!sessionHasRunComponent(args.tags, args.title)) return undefined;

  if (args.stored) {
    return enrichRunPrescription(args.stored);
  }

  const sessionType = args.tags[0] ?? "";
  if (!RUN_SESSION_TYPES.has(sessionType) && sessionType !== "hybrid_compromised") {
    return undefined;
  }

  return buildRunPrescription({
    sessionType,
    paceGuidance: args.paceGuidance,
    maxHeartRate: args.maxHeartRate,
    goalFocus: args.goalFocus,
    hyroxTrack: args.hyroxTrack,
  });
}

/** Erg threshold support (Ski/Row/Bike) — RPE-led when no erg benchmark splits exist. */
export function buildErgIntensityGuide(args: {
  maxHeartRate: number | null;
  hasEngineBenchmark: boolean;
}): ErgIntensityGuide {
  const hr =
    args.maxHeartRate != null && Number.isFinite(args.maxHeartRate)
      ? formatHrRange(args.maxHeartRate, 0.85, 0.9)
      : null;

  return {
    rpe: "RPE 7–8/10",
    hr_range: hr,
    effort_description: "Strong but repeatable — controlled threshold on the erg.",
    coach_note:
      "Intent: build engine without trashing legs. Hold form; every rep should look similar.",
    benchmark_note: args.hasEngineBenchmark
      ? null
      : "No Ski/Row benchmark on file — use RPE (and HR if set). TODO: erg splits when benchmark helpers land.",
  };
}

export function sessionHasErgThresholdComponent(
  tags: string[],
  title: string,
  progressionFamily?: string | null
): boolean {
  const pf = (progressionFamily ?? "").toLowerCase();
  if (pf.startsWith("erg_threshold")) return true;
  const t0 = tags[0] ?? "";
  if (t0.includes("erg") && /threshold/i.test(title)) return true;
  if (/erg threshold|ski threshold|row threshold|bike threshold/i.test(title)) return true;
  return false;
}
