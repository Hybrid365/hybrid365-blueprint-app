/**
 * Session resolver — turns session type + athlete context into a full executable prescription.
 */

import { calculateHyroxRunPaceEstimate, calculatePaceZones } from "./paceCalculator";
import { getHyroxSession } from "./sessionLibrary";
import { getSessionProgressionForWeek } from "./sessionProgression";
import {
  getTempoSessionDisplay,
  getThresholdSessionForWeek,
  THRESHOLD_HR_RPE_NOTE,
  type ProgrammeBlockNumber,
  type TempoSessionDisplay,
  type ThresholdSessionForWeek,
} from "./thresholdBlockProgression";
import type {
  BlockWeekInCycle,
  HyroxAbilityLevel,
  HyroxSessionDefinition,
  PaceZones,
  RecoveryStatus,
  ResolvedSessionPrescription,
  StationWeakness,
} from "./types";

export const SESSION_SAFETY_NOTE =
  "Pace is a target. HR/RPE controls the session. If HR rises above the intended zone or RPE is too high, reduce pace and keep the stimulus correct.";

export type SessionResolverInput = {
  sessionId: string;
  abilityLevel: HyroxAbilityLevel;
  programmeBlock: ProgrammeBlockNumber;
  blockWeek: BlockWeekInCycle;
  fiveKm: string;
  tenKm?: string | null;
  maxHeartRate?: number | null;
  thresholdHeartRate?: number | null;
  stationWeaknesses?: StationWeakness[];
  equipment?: Record<string, boolean>;
  recoveryStatus?: RecoveryStatus | "good" | "average" | "poor";
  weeklyTrainingHours?: number;
  rationale?: string;
  /** Tuesday threshold — dynamic name/main set from block progression */
  thresholdProgression?: ThresholdSessionForWeek;
  /** Thursday AM tempo add-on */
  tempoDisplay?: TempoSessionDisplay;
  nameOverride?: string;
};

type HrZoneKind = "easy" | "z2" | "tempo" | "threshold" | "interval";

type PaceContext = {
  zones: PaceZones & { hyroxRaceRunEstimate?: string };
  hyroxRacePace: string | null;
  tempoPace: string;
  paceReference: string;
};

const UNIVERSAL_COACHING_NOTES = {
  easyDays: "Easy days should stay easy — do not sneak intensity.",
  strengthEndurance: "Strength endurance should not go to failure — breathe through reps.",
  pain: "Stop or modify if pain changes how you move.",
  rpeHonest: "Record RPE honestly — it drives progression decisions.",
} as const;

function buildPaceContext(input: SessionResolverInput): PaceContext | null {
  const merged = calculatePaceZones(input.fiveKm, input.tenKm?.trim() || null);
  if (!merged) return null;
  const hyroxRacePace =
    merged.hyroxRaceRunEstimate ??
    calculateHyroxRunPaceEstimate(input.fiveKm, input.abilityLevel) ??
    merged.hyroxRaceRun;
  const tempoPace = merged.tenK;
  const paceReference = [
    `Easy ${merged.easy}`,
    `Steady ${merged.steady}`,
    `Tempo/HM ${tempoPace}`,
    `Threshold ${merged.threshold}`,
    `10K ${merged.tenK}`,
    `5K ${merged.fiveK}`,
    hyroxRacePace ? `Hyrox race run ~${hyroxRacePace}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return { zones: merged, hyroxRacePace, tempoPace, paceReference };
}

function hrFromMaxHr(maxHr: number, lowPct: number, highPct: number): string {
  const lo = Math.round(maxHr * lowPct);
  const hi = Math.round(maxHr * highPct);
  return `${lo}–${hi} bpm (${Math.round(lowPct * 100)}–${Math.round(highPct * 100)}% max HR)`;
}

function hrFromThresholdHr(thr: number, margin = 4): string {
  return `${thr - margin}–${thr + margin} bpm (threshold HR ±${margin})`;
}

function resolveHrGuide(
  kind: HrZoneKind,
  input: SessionResolverInput
): { targetHRRange: string | null; fallbackHRGuide: string | null } {
  const maxHr = input.maxHeartRate ?? null;
  const thrHr = input.thresholdHeartRate ?? null;

  if (kind === "threshold" && thrHr != null && thrHr > 0) {
    return {
      targetHRRange: hrFromThresholdHr(thrHr),
      fallbackHRGuide: maxHr
        ? `If no chest strap: stay near ${hrFromMaxHr(maxHr, 0.85, 0.92)} only if RPE confirms threshold.`
        : null,
    };
  }

  if (maxHr != null && maxHr > 0) {
    const bands: Record<HrZoneKind, [number, number]> = {
      easy: [0.6, 0.75],
      z2: [0.7, 0.8],
      tempo: [0.8, 0.87],
      threshold: [0.85, 0.92],
      interval: [0.9, 0.97],
    };
    const [lo, hi] = bands[kind];
    const range = hrFromMaxHr(maxHr, lo, hi);
    const fallback =
      kind === "interval"
        ? "90%+ max HR may occur late in reps — do not chase HR; pace and RPE lead."
        : "Use RPE if HR drifts from target — reduce pace before adding load.";
    return { targetHRRange: range, fallbackHRGuide: fallback };
  }

  const rpeFallback: Record<HrZoneKind, string> = {
    easy: "RPE 2–4 — conversational, nose-breathing possible",
    z2: "RPE 4–5 — easy aerobic, full sentences",
    tempo: "RPE 6–7 — controlled hard, below threshold unless HR drifts",
    threshold: "RPE 7–8 — sustainably hard, 20–30 min speakable in short phrases only",
    interval: "RPE 8–9 on reps — do not chase HR; quality over numbers",
  };
  return { targetHRRange: null, fallbackHRGuide: rpeFallback[kind] };
}

function variantForLevel(
  session: HyroxSessionDefinition,
  level: HyroxAbilityLevel
): string {
  const map = {
    beginner: session.beginnerVersion,
    intermediate: session.intermediateVersion,
    advanced: session.advancedVersion,
    pro: session.proVersion,
  } as const;
  return map[level].summary;
}

function keySetSummaryFromMain(mainSet: string[]): string {
  return mainSet.slice(0, 3).join(" · ");
}

function basePrescription(
  session: HyroxSessionDefinition,
  input: SessionResolverInput,
  partial: Partial<ResolvedSessionPrescription>
): ResolvedSessionPrescription {
  const sched = session.scheduling;
  const progressionNote =
    partial.progressionNote ??
    getSessionProgressionForWeek(session.id, input.blockWeek) ??
    session.prescriptionRationale ??
    "";
  const mainSet = partial.mainSet ?? [...session.mainSet];
  return {
    sessionLibraryId: session.id,
    name: partial.name ?? session.name,
    category: partial.category ?? session.category.replace(/_/g, " "),
    subcategory: partial.subcategory ?? session.subcategory.replace(/_/g, " "),
    objective: partial.objective ?? session.objective,
    warmup: partial.warmup ?? [...session.warmup],
    mainSet,
    cooldown: partial.cooldown ?? [...session.cooldown],
    keySetSummary: partial.keySetSummary ?? keySetSummaryFromMain(mainSet),
    targetPace: partial.targetPace ?? null,
    targetSplit: partial.targetSplit ?? null,
    targetLoad: partial.targetLoad ?? null,
    targetHRRange: partial.targetHRRange ?? null,
    fallbackHRGuide: partial.fallbackHRGuide ?? null,
    rpeTarget: partial.rpeTarget ?? session.intensity,
    duration: partial.duration ?? session.duration,
    thresholdMinutes: partial.thresholdMinutes ?? sched?.thresholdMinutes,
    qualityRunMinutes: partial.qualityRunMinutes ?? sched?.qualityRunMinutes,
    hardDay: partial.hardDay ?? sched?.hardDay ?? false,
    hardDayReason: partial.hardDayReason ?? sched?.hardDayReason,
    whatToRecord: partial.whatToRecord ?? [...session.whatToRecord],
    coachNote: partial.coachNote ?? session.coachNotes[0] ?? session.prescriptionRationale ?? "",
    safetyNote: partial.safetyNote ?? SESSION_SAFETY_NOTE,
    progressionNote,
    filmPrompt: partial.filmPrompt ?? session.filmPrompt ?? null,
    equipmentRequired: partial.equipmentRequired ?? [...session.equipment],
    progressionLabel: partial.progressionLabel ?? `Block ${input.programmeBlock} Week ${input.blockWeek}`,
    variantSummary: partial.variantSummary ?? variantForLevel(session, input.abilityLevel),
  };
}

function stationFinisherLine(weaknesses: StationWeakness[] | undefined): string {
  const primary = weaknesses?.[0];
  if (!primary || primary === "none_significant") {
    return "Optional finisher (if fresh): Grip — DB max holds 3–5 × 30–60 sec · heavier than race farmer weight";
  }
  if (primary === "wall_balls" || primary === "wall_ball") {
    return "Finisher — Wall balls: 10 min EMOM × 10–15 reps · smooth breathing, race height";
  }
  if (primary === "sled_push_pull" || primary === "sled") {
    return "Finisher — Sled: every 2 min ×5 · 12.5m push + 12.5m pull · low hips on push";
  }
  if (primary === "burpees") {
    return "Finisher — Burpees: 10 min alternating EMOM · BBJ or burpee rhythm — no redline";
  }
  if (primary === "farmers_carry" || primary === "carry") {
    return "Finisher — Grip: DB max holds 3–5 × 30–60 sec · heavier than Hyrox farmer carry race weight";
  }
  if (primary === "lunges") {
    return "Finisher — Walking lunges: 3 × 20m @ moderate load · smooth breathing";
  }
  if (primary === "ski") {
    return "Finisher — SkiErg: 5 × 2 min @ steady-hard · 60s easy between";
  }
  if (primary === "row") {
    return "Finisher — Row: 5 × 500m @ moderate · 90s easy between";
  }
  return "Optional finisher: station weakness drill 8–10 min controlled";
}

function stationOverloadBlock(weaknesses: StationWeakness[] | undefined): string {
  const primary = weaknesses?.[0];
  if (primary === "wall_balls" || primary === "wall_ball") {
    return "3 min wall ball — 30–40 reps continuous or sets of 15–20 @ race height";
  }
  if (primary === "sled_push_pull" || primary === "sled") {
    return "3 min sled — 4–6 × 12.5m push + pull @ race load/angle";
  }
  if (primary === "burpees") {
    return "3 min burpee broad jump or burpees — steady rhythm, no redline start";
  }
  if (primary === "lunges") {
    return "3 min walking lunges or sandbag lunges — 20–30m reps, controlled breathing";
  }
  if (primary === "farmers_carry" || primary === "carry") {
    return "3 min farmer carry — 2–3 × 50m @ race or slightly heavier DB/KB";
  }
  if (primary === "ski") {
    return "3 min SkiErg — steady-hard split, posture over rate";
  }
  if (primary === "row") {
    return "3 min RowErg — moderate-hard 500m rhythm";
  }
  return "3 min station (pick primary weakness): wall ball, sled, BBJ, lunges, carry, ski or row";
}

function resolveThresholdRun(
  session: HyroxSessionDefinition,
  input: SessionResolverInput,
  pace: PaceContext | null
): ResolvedSessionPrescription {
  const prog =
    input.thresholdProgression ??
    getThresholdSessionForWeek(input.programmeBlock, input.blockWeek);
  const hr = resolveHrGuide("threshold", input);
  const isControlledFast = prog.mainSet.includes("5km pace");
  const targetPace = isControlledFast
    ? pace
      ? `5K ${pace.zones.fiveK} or slightly faster · controlled fast — ${pace.zones.intervalVo2} only if RPE stays ≤8`
      : "5km pace or slightly faster — RPE 8 max; do not chase HR spikes"
    : pace
      ? `Threshold ${pace.zones.threshold} · ${THRESHOLD_HR_RPE_NOTE}`
      : "Controlled threshold pace — HR/RPE governs";

  const mainSet = [
    `${prog.reps} × ${prog.repDurationMinutes} min @ ${isControlledFast ? "5km pace / controlled fast" : "controlled threshold"}`,
    `Recovery ${prog.recovery} jog/walk between reps`,
    "Stay in threshold HR/RPE — reduce pace 5–10 sec/km if HR drifts high",
  ];

  return basePrescription(session, input, {
    name: input.nameOverride ?? prog.name,
    mainSet,
    keySetSummary: prog.mainSet,
    targetPace,
    targetHRRange: hr.targetHRRange,
    fallbackHRGuide: hr.fallbackHRGuide,
    rpeTarget: isControlledFast ? "RPE 7–8 · do not exceed 8 on early reps" : "RPE 7–8 · threshold",
    duration: session.duration,
    thresholdMinutes: prog.thresholdMinutes,
    qualityRunMinutes: prog.thresholdMinutes,
    hardDay: true,
    hardDayReason: "Tuesday key threshold run",
    coachNote: `${prog.coachNote} ${prog.paceNote}`,
    progressionNote: prog.mainSet,
    progressionLabel: prog.progressionLabel,
    safetyNote: `${SESSION_SAFETY_NOTE} ${THRESHOLD_HR_RPE_NOTE}`,
    whatToRecord: [
      "Interval pace per rep",
      "Avg HR per rep",
      "RPE per rep",
      "Recovery quality between reps",
      "Pace vs prescribed if using watch",
    ],
  });
}

function resolveTempoRun(
  session: HyroxSessionDefinition,
  input: SessionResolverInput,
  pace: PaceContext | null
): ResolvedSessionPrescription {
  const tempo = input.tempoDisplay ?? getTempoSessionDisplay(input.blockWeek);
  const hr = resolveHrGuide("tempo", input);
  const mainSet = [
    tempo.mainSet,
    "Stay below threshold HR/RPE — this is aerobic quality, not a threshold session unless HR drifts",
    "If HR crosses threshold zone, ease pace 10–15 sec/km and finish the block controlled",
  ];
  return basePrescription(session, input, {
    name: input.nameOverride ?? tempo.name,
    mainSet,
    keySetSummary: tempo.mainSet,
    targetPace: pace
      ? `HM / tempo aerobic quality ${pace.tempoPace} · below threshold ${pace.zones.threshold}`
      : "Estimated HM / tempo effort — below threshold unless HR drifts",
    targetHRRange: hr.targetHRRange,
    fallbackHRGuide: hr.fallbackHRGuide,
    rpeTarget: tempo.intensity,
    duration: tempo.duration,
    qualityRunMinutes: 24,
    hardDay: true,
    hardDayReason: tempo.progressionLabel,
    coachNote:
      "Tempo bridges easy aerobic and threshold — do not classify as full threshold unless athlete reaches threshold HR/RPE.",
    progressionLabel: tempo.progressionLabel,
    progressionNote: tempo.mainSet,
    safetyNote: SESSION_SAFETY_NOTE,
    whatToRecord: ["Block/rep pace", "Avg HR", "RPE", "Drift vs target", "Whether HR crossed threshold"],
  });
}

function resolveStrengthHeavyLegs(
  session: HyroxSessionDefinition,
  input: SessionResolverInput
): ResolvedSessionPrescription {
  const finisher = stationFinisherLine(input.stationWeaknesses);
  const mainSet = [
    "A. Tempo Hack Squat or Tempo Squat — 4 × 8–10 · tempo 3 sec lower, 1 sec pause, controlled drive · rest 75–90 sec · RPE 7–8",
    "B. Romanian Deadlift — 4 × 8 · rest 90 sec · RPE 7",
    "C. Walking Lunges or Sandbag Walking Lunges — 3 × 20–30m · rest 90 sec · smooth breathing, no rushing",
    "D. Quad Extension — 3 × 15–20 · rest 45–60 sec · controlled squeeze",
    "E. Calf Isometric Holds — 3–4 × 30–45 sec · heavy controlled hold",
    finisher,
  ];
  const scaled =
    input.abilityLevel === "beginner"
      ? "Beginner scale: goblet squat or leg press 3×10 · DB RDL 3×10 · step-ups 2–3×12/side · skip finisher if sore"
      : input.abilityLevel === "pro"
        ? "Pro: full prescription at race-prep loads — breathe through reps, no failure chasing"
        : variantForLevel(session, input.abilityLevel);

  return basePrescription(session, input, {
    warmup: [
      "8–10 min easy bike",
      "Hip and ankle mobility — 5 min",
      "2–3 ramp-up sets on first lift (empty → working load)",
    ],
    mainSet,
    cooldown: ["Light bike flush 5 min", "Hip / quad / calf stretch 5 min"],
    keySetSummary: "4×8–10 tempo squat · 4×8 RDL · 3×20–30m lunges · finisher by weakness",
    targetLoad: "Moderate-heavy — RPE 7–8 on squats/RDL; lunges smooth not maximal",
    targetHRRange: null,
    fallbackHRGuide: "RPE 7–8 on main lifts · easy on warm-up bike",
    rpeTarget: "RPE 7–8 · hard lower-body stress",
    hardDay: true,
    hardDayReason: "Lower strength endurance — Hyrox leg durability",
    coachNote: `${session.coachNotes[0]} ${UNIVERSAL_COACHING_NOTES.strengthEndurance}`,
    safetyNote: `${SESSION_SAFETY_NOTE} ${UNIVERSAL_COACHING_NOTES.pain}`,
    progressionNote:
      getSessionProgressionForWeek(session.id, input.blockWeek) ??
      "Thursday staple — never replaced by tempo.",
    variantSummary: scaled,
    whatToRecord: [
      "Loads used",
      "RPE each lift",
      "Soreness next day",
      "Lunge load/distance",
      "Finisher reps/load",
      "Any pain/niggles",
    ],
  });
}

function resolveCompromisedThresholdOverload(
  session: HyroxSessionDefinition,
  input: SessionResolverInput,
  pace: PaceContext | null
): ResolvedSessionPrescription {
  const weekProg =
    getSessionProgressionForWeek(session.id, input.blockWeek) ??
    "8×3 min @ 5km pace or slightly faster · 90s rest · then 750m run + 3 min station + 750m run ×2";
  const station = stationOverloadBlock(input.stationWeaknesses);
  const hrHard = resolveHrGuide("interval", input);
  const hrSteady = resolveHrGuide("tempo", input);

  const mainSet = [
    `Part 1 — ${weekProg.split("·")[0]?.trim() ?? weekProg}`,
    "Rest 120s after final interval",
    `Part 2 — Round 1: 750m run → ${station} → 750m run · rest 120s`,
    "Part 2 — Round 2: repeat same structure",
    pace?.hyroxRacePace
      ? `Runs after station: target ${pace.hyroxRacePace} or controlled race effort — expect 5–15 sec/km drop-off`
      : "Runs after station: controlled race effort — record pace drop-off",
  ];

  return basePrescription(session, input, {
    name: "Threshold Run Into Station Overload",
    mainSet,
    keySetSummary: `Fast intervals → 750m + station ×2 rounds · ${station.split("—")[0]?.trim()}`,
    targetPace: pace
      ? `Part 1: 5K ${pace.zones.fiveK} or slightly faster · Part 2 runs: Hyrox race ~${pace.hyroxRacePace ?? pace.zones.hyroxRaceRun}`
      : "5km pace intervals; race-effort runs after station",
    targetHRRange: hrHard.targetHRRange,
    fallbackHRGuide: `${hrHard.fallbackHRGuide ?? ""} Station work: ${hrSteady.targetHRRange ?? "RPE 8–9"}`,
    rpeTarget: "RPE 8–9 · highest session stress of the week",
    thresholdMinutes: session.scheduling?.thresholdMinutes ?? 24,
    qualityRunMinutes: session.scheduling?.qualityRunMinutes ?? 24,
    hardDay: true,
    hardDayReason: "Saturday key — threshold into station overload",
    coachNote:
      "Protect with easy days around this session. Station chosen from athlete weakness. Pace drop-off after station is the key learning metric.",
    progressionNote: weekProg,
    filmPrompt: session.filmPrompt ?? "Film final 750m run split after station for coach pacing review.",
    safetyNote: SESSION_SAFETY_NOTE,
    whatToRecord: [
      "Interval pace each rep",
      "HR on intervals",
      "Station reps/load/time",
      "Run pace before vs after station",
      "Pace drop-off %",
      "RPE each part",
    ],
  });
}

function resolveEasyBike(
  session: HyroxSessionDefinition,
  input: SessionResolverInput,
  pace: PaceContext | null
): ResolvedSessionPrescription {
  const duration =
    (input.weeklyTrainingHours ?? 7) < 5
      ? "45–55 min"
      : (input.weeklyTrainingHours ?? 7) < 8
        ? "50–65 min"
        : "55–75 min";
  const hr = resolveHrGuide("easy", input);
  return basePrescription(session, input, {
    warmup: ["5 min easy spin", "Light leg circles"],
    mainSet: [
      `${duration} continuous Z1 / low Z2 cycling`,
      "Cadence 80–95 rpm — smooth legs",
      "No intervals unless prescribed — stay easy",
    ],
    keySetSummary: `${duration} Z1/low Z2 bike`,
    targetHRRange: hr.targetHRRange,
    fallbackHRGuide: hr.fallbackHRGuide,
    rpeTarget: "RPE 2–4",
    duration,
    coachNote: `${session.coachNotes[0]} ${UNIVERSAL_COACHING_NOTES.easyDays}`,
    whatToRecord: ["Duration", "Avg HR", "RPE", "Fatigue after"],
  });
}

function resolveMixedErgAerobic(
  session: HyroxSessionDefinition,
  input: SessionResolverInput
): ResolvedSessionPrescription {
  const hr = resolveHrGuide("z2", input);
  const eq = input.equipment ?? {};
  const rounds: string[] = [];
  if (eq.bike !== false) rounds.push("15 min bike @ easy Z1/Z2");
  if (eq.rowErg) rounds.push("10 min row @ easy Z1/Z2");
  if (eq.skiErg) rounds.push("5 min SkiErg @ easy Z1/Z2");
  const mainSet =
    rounds.length >= 2
      ? [`3 rounds (continuous easy):`, ...rounds.map((r, i) => `${i + 1}. ${r}`), "All easy — conversational"]
      : [
          "Alternating 8–12 min Ski / 8–12 min Row @ Z2",
          "Up to 40–50 min total work — no threshold/tempo add-ons",
        ];

  return basePrescription(session, input, {
    mainSet,
    keySetSummary: mainSet[0] ?? "Mixed erg Z2",
    targetHRRange: hr.targetHRRange,
    fallbackHRGuide: hr.fallbackHRGuide,
    rpeTarget: "RPE 2–4 · Z1/Z2",
    coachNote: "Accumulate low-impact aerobic volume — no grey-zone pacing.",
    whatToRecord: ["Total duration", "Modality split", "RPE", "HR average"],
  });
}

function resolveLongAerobic(
  session: HyroxSessionDefinition,
  input: SessionResolverInput,
  pace: PaceContext | null
): ResolvedSessionPrescription {
  const hours = input.weeklyTrainingHours ?? 7;
  const duration =
    hours < 5 ? "50–60 min" : hours < 7 ? "55–70 min" : hours < 10 ? "65–80 min" : "75–90 min";
  const hr = resolveHrGuide("z2", input);
  return basePrescription(session, input, {
    mainSet: [
      `${duration} continuous easy run — strictly Z2`,
      "No threshold/tempo add-ons — long aerobic Sunday (or preferred long day)",
      pace ? `Target easy pace ${pace.zones.easy}` : "Conversational pace — walk breaks OK if needed",
    ],
    keySetSummary: `${duration} easy Z2 — no quality add-ons`,
    targetPace: pace ? pace.zones.easy : null,
    targetHRRange: hr.targetHRRange,
    fallbackHRGuide: hr.fallbackHRGuide,
    rpeTarget: "RPE 4–5 · Z2",
    duration,
    coachNote: `Duration scales with weekly hours (~${hours}h/week). ${UNIVERSAL_COACHING_NOTES.easyDays}`,
    whatToRecord: ["Duration", "Pace", "RPE", "Fuel/hydration"],
  });
}

function resolveGymAerobicUpperGrip(
  session: HyroxSessionDefinition,
  input: SessionResolverInput
): ResolvedSessionPrescription {
  const hr = resolveHrGuide("z2", input);
  const isBeginner = input.abilityLevel === "beginner";
  const emomPull = isBeginner ? "assisted pull-up or lat pulldown 6–8" : "6–8 pull-ups";
  const emomPush = isBeginner ? "incline or knee push-ups 12–15" : "15–20 push-ups";

  const mainSet = [
    "45–60 min easy bike or mixed erg (bike / ski / row rotation) — all Z1/Z2",
    "Then — Upper Body Density EMOM 10 min:",
    "  Minute 1: " + emomPull,
    "  Minute 2: " + emomPush,
    "Then — Grip: DB max holds 3–5 × 30–60 sec · use heavier than Hyrox farmer carry race weight where possible",
  ];

  return basePrescription(session, input, {
    objective:
      "Gym-based easy aerobic volume plus upper strength endurance and grip — no lower-body stress.",
    mainSet,
    keySetSummary: "45–60 min Z2 + 10 min upper EMOM + grip holds",
    targetHRRange: hr.targetHRRange,
    fallbackHRGuide: hr.fallbackHRGuide,
    rpeTarget: "RPE 4–6 aerobic · RPE 6–7 on EMOM · holds challenging not maximal",
    coachNote:
      "Support session — ticks upper/grip without compromising lower-body quality days.",
    whatToRecord: [
      "Aerobic duration",
      "EMOM reps per minute",
      "Hold weight/time",
      "RPE aerobic vs upper",
    ],
  });
}

function resolveEasyRun(
  session: HyroxSessionDefinition,
  input: SessionResolverInput,
  pace: PaceContext | null
): ResolvedSessionPrescription {
  const hr = resolveHrGuide("z2", input);
  return basePrescription(session, input, {
    mainSet: [
      "Continuous easy run at Z2 — conversational",
      pace ? `Target ${pace.zones.easy}` : "Easy — walk breaks OK",
      "Optional 4×20s strides in final 10 min only if fresh",
    ],
    targetPace: pace?.zones.easy ?? null,
    targetHRRange: hr.targetHRRange,
    fallbackHRGuide: hr.fallbackHRGuide,
    rpeTarget: "RPE 4–5",
    coachNote: UNIVERSAL_COACHING_NOTES.easyDays,
  });
}

function resolveHyroxRacePaceRun(
  session: HyroxSessionDefinition,
  input: SessionResolverInput,
  pace: PaceContext | null
): ResolvedSessionPrescription {
  const hr = resolveHrGuide("tempo", input);
  const racePace = pace?.hyroxRacePace ?? pace?.zones.hyroxRaceRun ?? "Hyrox race effort";
  return basePrescription(session, input, {
    mainSet: [
      "5–8 × 800m–1km @ estimated Hyrox race run pace",
      "Equal time easy jog recovery between reps",
      "Note: expect pace drop-off after station work in race — practise even splits here",
    ],
    targetPace: `${racePace} · controlled race rhythm`,
    targetHRRange: hr.targetHRRange,
    fallbackHRGuide: hr.fallbackHRGuide,
    rpeTarget: "RPE 7–8 · race rhythm",
    hardDay: true,
    coachNote: "Should feel like race km 3–6, not km 1.",
  });
}

function resolveErgThreshold(
  session: HyroxSessionDefinition,
  input: SessionResolverInput
): ResolvedSessionPrescription {
  const hr = resolveHrGuide("threshold", input);
  const isSki = session.id.includes("ski");
  const isRow = session.id.includes("row");
  const modality = isSki ? "SkiErg" : isRow ? "RowErg" : "Erg";
  return basePrescription(session, input, {
    mainSet: [
      `8 × 4 min @ ${modality} threshold watts/pace`,
      "60–90s easy between reps — same split rep 1 to rep 8",
    ],
    targetSplit: isRow
      ? "Threshold 500m pace — hold consistent; posture over rate"
      : "Threshold split/watts — hold consistent stroke rate",
    targetHRRange: hr.targetHRRange,
    fallbackHRGuide: hr.fallbackHRGuide,
    rpeTarget: "RPE 7–8",
    thresholdMinutes: 32,
    hardDay: true,
    coachNote: "Substitute for run threshold when legs need relief — not extra junk volume.",
  });
}

function enrichFromLibrary(
  session: HyroxSessionDefinition,
  input: SessionResolverInput,
  pace: PaceContext | null
): ResolvedSessionPrescription {
  const sched = session.scheduling;
  const intensityType = sched?.intensityType;
  let hrKind: HrZoneKind = "z2";
  if (intensityType === "threshold") hrKind = "threshold";
  else if (intensityType === "tempo") hrKind = "tempo";
  else if (intensityType === "easy") hrKind = "easy";
  else if (intensityType === "race_pace" || intensityType === "quality") hrKind = "interval";

  const hr = resolveHrGuide(hrKind, input);
  let targetPace: string | null = null;
  if (pace && session.category === "run_development") {
    const pt = sched?.paceTargetType;
    if (pt === "easy") targetPace = pace.zones.easy;
    else if (pt === "threshold") targetPace = pace.zones.threshold;
    else if (pt === "5k") targetPace = pace.zones.fiveK;
    else if (pt === "10k") targetPace = pace.zones.tenK;
    else if (pt === "HM") targetPace = pace.tempoPace;
    else if (pt === "race_pace") targetPace = pace.hyroxRacePace ?? pace.zones.hyroxRaceRun;
    else targetPace = pace.paceReference;
  }

  const coachNote = [
    session.coachNotes[0] ?? session.prescriptionRationale ?? "",
    input.rationale ?? "",
    UNIVERSAL_COACHING_NOTES.rpeHonest,
  ]
    .filter(Boolean)
    .join(" ");

  return basePrescription(session, input, {
    targetPace,
    targetHRRange: hr.targetHRRange,
    fallbackHRGuide: hr.fallbackHRGuide,
    coachNote,
    safetyNote: SESSION_SAFETY_NOTE,
  });
}

const THRESHOLD_LIBRARY_IDS = new Set([
  "hyrox_run_threshold_6x6",
  "hyrox_run_threshold_3x10",
  "hyrox_run_5k_pace_8x3",
]);

/** Resolve a complete executable session prescription for preview and generation. */
export function resolveSessionPrescription(
  input: SessionResolverInput
): ResolvedSessionPrescription {
  const session = getHyroxSession(input.sessionId);
  if (!session) {
    return {
      sessionLibraryId: input.sessionId,
      name: input.nameOverride ?? "Unknown session",
      category: "unknown",
      subcategory: "unknown",
      objective: input.rationale ?? "Session template not found",
      warmup: [],
      mainSet: ["Refer to coach"],
      cooldown: [],
      keySetSummary: "—",
      targetPace: null,
      targetSplit: null,
      targetLoad: null,
      targetHRRange: null,
      fallbackHRGuide: "Use RPE",
      rpeTarget: "—",
      duration: "—",
      hardDay: false,
      whatToRecord: ["RPE", "Notes"],
      coachNote: input.rationale ?? "",
      safetyNote: SESSION_SAFETY_NOTE,
      progressionNote: "",
      filmPrompt: null,
      equipmentRequired: [],
      progressionLabel: `Week ${input.blockWeek}`,
      variantSummary: input.abilityLevel,
    };
  }

  const pace = buildPaceContext(input);

  if (input.thresholdProgression || THRESHOLD_LIBRARY_IDS.has(session.id)) {
    return resolveThresholdRun(session, input, pace);
  }

  switch (session.id) {
    case "hyrox_run_tempo_hm":
      return resolveTempoRun(session, input, pace);
    case "hyrox_strength_heavy_legs":
      return resolveStrengthHeavyLegs(session, input);
    case "hyrox_compromised_threshold_run_station_overload":
      return resolveCompromisedThresholdOverload(session, input, pace);
    case "hyrox_erg_bike_z2":
      return resolveEasyBike(session, input, pace);
    case "hyrox_erg_mixed_aerobic":
      return resolveMixedErgAerobic(session, input);
    case "hyrox_run_long_easy":
      return resolveLongAerobic(session, input, pace);
    case "hyrox_gym_aerobic_upper_grip":
      return resolveGymAerobicUpperGrip(session, input);
    case "hyrox_run_easy":
      return resolveEasyRun(session, input, pace);
    case "hyrox_run_race_pace_repeats":
      return resolveHyroxRacePaceRun(session, input, pace);
    case "hyrox_erg_ski_threshold_8x4":
    case "hyrox_erg_row_threshold_8x4":
      return resolveErgThreshold(session, input);
    default:
      return enrichFromLibrary(session, input, pace);
  }
}
