/**
 * Editable programme sandbox — converts admin inputs to src/lib/hyrox helpers.
 * Local preview only; not persisted.
 */

import { classifyAthlete, CLASSIFICATION_LABELS, type ExperienceLevel } from "@/src/lib/hyrox/athleteClassification";
import type { AthleteClassificationInput, AthleteClassificationResult } from "@/src/lib/hyrox/athleteClassification";
import {
  buildSessionSelectionHints,
  getRecoveryAdjustmentSuggestions,
  type ProgrammeContext,
} from "@/src/lib/hyrox/programmeRules";
import {
  calculateHyroxRunPaceEstimate,
  calculatePaceZones,
  parseTimeToSeconds,
} from "@/src/lib/hyrox/paceCalculator";
import { getHyroxSession } from "@/src/lib/hyrox/sessionLibrary";
import {
  getSessionProgressionForWeek,
  HYROX_SESSION_PROGRESSIONS,
} from "@/src/lib/hyrox/sessionProgression";
import {
  getStationWeaknessRules,
  rotateStationFocusForBlock,
} from "@/src/lib/hyrox/stationPersonalisation";
import {
  AEROBIC_DAY_EXTRA_GUIDANCE,
  applyDoubleSessionStacking,
  attachStationEmom,
  enrichScheduledDay,
  planWeeklyHours,
  roleToDefaultSessionId,
  sortDaysCalendar,
  SUNDAY_AEROBIC_DOUBLE_RATIONALE,
  validateWeeklyStress,
  type ScheduledDaySlot,
} from "@/src/lib/hyrox/schedulingRules";
import {
  resolveSessionPrescription,
  type SessionResolverInput,
} from "@/src/lib/hyrox/sessionResolver";
import {
  getTempoSessionDisplay,
  getThresholdSessionForWeek,
  getTuesdayThresholdSessionId,
  shouldScheduleThursdayAmTempo,
  THRESHOLD_HR_RPE_NOTE,
} from "@/src/lib/hyrox/thresholdBlockProgression";
import type {
  BlockWeekInCycle,
  DaySlotRole,
  DoubleSessionReadiness,
  EmomPrescription,
  HyroxAbilityLevel,
  HyroxSessionCategory,
  HyroxSessionDefinition,
  RecoveryStatus,
  ResolvedSessionPrescription,
  SchedulingValidationWarning,
  StationWeakness,
  WeeklyDayTemplate,
  WeeklyHoursPlan,
  Weekday,
} from "@/src/lib/hyrox/types";
import {
  applyBlockWeekDeload,
  applyRaceTimelineToStructure,
  suggestWeeklyStructure,
  weeksToRacePhase,
} from "@/src/lib/hyrox/weeklyStructureRules";
import type { MockHyroxProfile } from "@/app/lib/hyroxPreviewMockProfiles";
import { profileToClassificationInput, profileToProgrammeContext } from "@/app/lib/hyroxPreviewMockProfiles";

export type SandboxAbilityLevel = "beginner" | "intermediate" | "advanced" | "pro";

export type SandboxRaceTimeline = "16_plus" | "12" | "8" | "4" | "race_week";

export type SandboxMainLimiter =
  | "running"
  | "wall_balls"
  | "sled"
  | "burpees"
  | "lunges"
  | "ergs"
  | "grip_carries"
  | "compromised_running"
  | "recovery"
  | "body_composition";

export type SandboxStationOption =
  | "ski"
  | "sled_push_pull"
  | "burpees"
  | "row"
  | "farmers_carry"
  | "lunges"
  | "wall_balls";

export type SandboxDoubleReadiness =
  | "not_ready"
  | "aerobic_double_only"
  | "threshold_run_plus_easy_aerobic"
  | "threshold_run_plus_erg_threshold";

export type SandboxRecoveryStatus = "good" | "average" | "poor";
export type SandboxSleepQuality = "good" | "average" | "poor";

export type SandboxProgrammeBlock = 1 | 2 | 3;

export type ProgrammeSandboxInputs = {
  abilityLevel: SandboxAbilityLevel;
  raceTimeline: SandboxRaceTimeline;
  trainingDays: number;
  weeklyTrainingHours: number;
  weeklyRunKm: number;
  fiveKm: string;
  tenKm: string;
  maxHeartRate: number | null;
  thresholdHeartRate: number | null;
  mainLimiter: SandboxMainLimiter;
  stationWeaknesses: SandboxStationOption[];
  equipment: {
    treadmill: boolean;
    track: boolean;
    skiErg: boolean;
    rowErg: boolean;
    bike: boolean;
    sled: boolean;
    wallBalls: boolean;
    sandbag: boolean;
    farmersHandles: boolean;
    fullGym: boolean;
  };
  doubleSessionReadiness: SandboxDoubleReadiness;
  recoveryStatus: SandboxRecoveryStatus;
  sleepQuality: SandboxSleepQuality;
  programmeBlock: SandboxProgrammeBlock;
  blockWeek: BlockWeekInCycle;
  saturdayAvailable: boolean;
  preferredLongAerobicDay: Weekday;
  lowerBodySoreness: "none" | "mild" | "high";
};

export const DEFAULT_SANDBOX_INPUTS: ProgrammeSandboxInputs = {
  abilityLevel: "intermediate",
  raceTimeline: "12",
  trainingDays: 5,
  weeklyTrainingHours: 7,
  weeklyRunKm: 28,
  fiveKm: "21:30",
  tenKm: "45:00",
  maxHeartRate: null,
  thresholdHeartRate: null,
  mainLimiter: "running",
  stationWeaknesses: ["wall_balls", "sled_push_pull"],
  equipment: {
    treadmill: true,
    track: true,
    skiErg: true,
    rowErg: true,
    bike: true,
    sled: true,
    wallBalls: true,
    sandbag: true,
    farmersHandles: true,
    fullGym: true,
  },
  doubleSessionReadiness: "aerobic_double_only",
  recoveryStatus: "good",
  sleepQuality: "good",
  programmeBlock: 1,
  blockWeek: 2,
  saturdayAvailable: true,
  preferredLongAerobicDay: "Sun",
  lowerBodySoreness: "none",
};

const RACE_WEEKS: Record<SandboxRaceTimeline, number> = {
  "16_plus": 16,
  "12": 12,
  "8": 8,
  "4": 4,
  race_week: 1,
};

const BLOCK_LABELS: Record<SandboxProgrammeBlock, string> = {
  1: "Block 1 — Base & load tolerance",
  2: "Block 2 — Threshold build",
  3: "Block 3 — Specific race build",
};

const MAIN_LIMITER_LABELS: Record<SandboxMainLimiter, string> = {
  running: "Running",
  wall_balls: "Wall balls",
  sled: "Sled push / pull",
  burpees: "Burpees",
  lunges: "Lunges",
  ergs: "Ergs",
  grip_carries: "Grip / carries",
  compromised_running: "Compromised running",
  recovery: "Recovery",
  body_composition: "Body composition",
};

const STATION_OPTION_TO_WEAKNESS: Record<SandboxStationOption, StationWeakness> = {
  ski: "ski",
  sled_push_pull: "sled_push_pull",
  burpees: "burpees",
  row: "row",
  farmers_carry: "farmers_carry",
  lunges: "lunges",
  wall_balls: "wall_balls",
};

const ROLE_DISPLAY: Record<DaySlotRole, string> = {
  easy_run: "Easy run",
  hard_run: "Threshold run",
  tempo_aerobic: "Tempo / aerobic quality",
  long_aerobic: "Long aerobic",
  erg_threshold: "Erg threshold",
  erg_z2: "Easy bike / erg Z2",
  strength_lower: "Lower strength endurance",
  strength_upper: "Recovery aerobic + upper strength",
  gym_aerobic_upper: "Gym aerobic + upper / grip",
  compromised_hybrid: "Hyrox compromised / key",
  recovery: "Recovery / mobility",
  rest: "Rest",
  testing: "Benchmark / testing",
};

const ROLE_TO_SESSION: Partial<Record<DaySlotRole, string>> = {
  easy_run: "hyrox_run_easy",
  hard_run: "hyrox_run_threshold_6x6",
  long_aerobic: "hyrox_run_long_easy",
  erg_threshold: "hyrox_erg_ski_threshold_8x4",
  erg_z2: "hyrox_erg_bike_z2",
  strength_lower: "hyrox_strength_lower_sled",
  strength_upper: "hyrox_strength_upper_emom",
  compromised_hybrid: "hyrox_compromised_run_wallballs",
  recovery: "hyrox_erg_mixed_recovery",
};

function experienceFromAbility(level: SandboxAbilityLevel): ExperienceLevel {
  if (level === "beginner") return "new";
  if (level === "intermediate") return "some_structure";
  if (level === "advanced") return "experienced";
  return "competitive";
}

function recoveryToLib(status: SandboxRecoveryStatus): RecoveryStatus {
  if (status === "poor") return "poor";
  if (status === "average") return "moderate";
  return "good";
}

function sleepToLib(q: SandboxSleepQuality): "good" | "poor" {
  return q === "good" ? "good" : "poor";
}

function doubleToLib(d: SandboxDoubleReadiness): DoubleSessionReadiness {
  return d;
}

function stationOptionsToWeaknesses(opts: SandboxStationOption[]): StationWeakness[] {
  return opts.map((o) => STATION_OPTION_TO_WEAKNESS[o]);
}

function mainLimiterToContext(
  limiter: SandboxMainLimiter
): ProgrammeContext["mainLimiter"] {
  if (limiter === "running" || limiter === "compromised_running") return "running";
  if (limiter === "recovery") return "recovery";
  if (
    limiter === "wall_balls" ||
    limiter === "sled" ||
    limiter === "burpees" ||
    limiter === "lunges" ||
    limiter === "ergs" ||
    limiter === "grip_carries"
  ) {
    return "stations";
  }
  return "balanced";
}

function pickCompromisedSessionId(
  day: WeeklyDayTemplate,
  inputs: ProgrammeSandboxInputs,
  focus: StationWeakness[]
): string {
  const isSaturdayKey =
    day.day === "Sat" &&
    inputs.saturdayAvailable &&
    inputs.trainingDays >= 5 &&
    (inputs.abilityLevel === "intermediate" ||
      inputs.abilityLevel === "advanced" ||
      inputs.abilityLevel === "pro");

  if (
    isSaturdayKey &&
    inputs.blockWeek >= 2 &&
    inputs.recoveryStatus !== "poor" &&
    inputs.lowerBodySoreness !== "high"
  ) {
    return "hyrox_compromised_threshold_run_station_overload";
  }

  const primary = focus[0];
  if (primary === "wall_balls" || primary === "wall_ball") return "hyrox_compromised_run_wallballs";
  if (primary === "sled" || primary === "sled_push_pull") return "hyrox_compromised_sled_burpee";
  if (primary === "lunges") return "hyrox_compromised_run_lunges";
  if (primary === "burpees") return "hyrox_compromised_sled_burpee";
  if (primary === "running_under_fatigue") return "hyrox_compromised_mini_test";
  if (inputs.blockWeek >= 3) return "hyrox_compromised_threshold_run_station_overload";
  return "hyrox_compromised_mini_test";
}

function variantForLevel(
  session: HyroxSessionDefinition,
  level: HyroxAbilityLevel
): { label: string; text: string } {
  const map = {
    beginner: session.beginnerVersion,
    intermediate: session.intermediateVersion,
    advanced: session.advancedVersion,
    pro: session.proVersion,
  } as const;
  const v = map[level];
  return { label: level, text: v.summary };
}

export function sandboxToMockProfile(inputs: ProgrammeSandboxInputs): MockHyroxProfile {
  const allowsDoubles = inputs.doubleSessionReadiness !== "not_ready";
  return {
    id: "a",
    label: "Sandbox",
    shortLabel: "Sandbox",
    fiveKm: inputs.fiveKm,
    tenKm: inputs.tenKm.trim() || null,
    trainingDays: inputs.trainingDays,
    weeklyTrainingHours: inputs.weeklyTrainingHours,
    weeksToRace: RACE_WEEKS[inputs.raceTimeline],
    stationWeaknesses: stationOptionsToWeaknesses(inputs.stationWeaknesses),
    recoveryStatus: recoveryToLib(inputs.recoveryStatus),
    sleepQuality: sleepToLib(inputs.sleepQuality),
    stressLevel:
      inputs.recoveryStatus === "poor" ? "high" : inputs.recoveryStatus === "average" ? "average" : "low",
    doubleSessionReadiness: doubleToLib(inputs.doubleSessionReadiness),
    programmeBlock: inputs.programmeBlock,
    blockWeek: inputs.blockWeek,
    experienceLevel: experienceFromAbility(inputs.abilityLevel),
    abilityLevel: inputs.abilityLevel,
    allowsDoubles,
  };
}

export function sandboxToClassificationInput(
  inputs: ProgrammeSandboxInputs
): AthleteClassificationInput {
  const profile = sandboxToMockProfile(inputs);
  const base = profileToClassificationInput(profile);
  return {
    ...base,
    weeklyRunKm: inputs.weeklyRunKm,
    abilityLevel: inputs.abilityLevel,
  };
}

export function sandboxBuildProgrammeContext(
  inputs: ProgrammeSandboxInputs,
  classification: AthleteClassificationResult
): ProgrammeContext {
  const profile = sandboxToMockProfile(inputs);
  const ctx = profileToProgrammeContext(profile, classification.classification);
  const eq = inputs.equipment;
  return {
    ...ctx,
    mainLimiter: mainLimiterToContext(inputs.mainLimiter),
    weeklyTrainingHours: inputs.weeklyTrainingHours,
    hasSkiErg: eq.skiErg,
    hasRowErg: eq.rowErg,
    hasBike: eq.bike,
    hasSled: eq.sled,
    hasFullGym: eq.fullGym,
    equipment: [
      eq.treadmill ? "Treadmill" : null,
      eq.track ? "Track / measured route" : null,
      eq.skiErg ? "SkiErg" : null,
      eq.rowErg ? "RowErg" : null,
      eq.bike ? "Bike / Assault bike" : null,
      eq.sled ? "Sled" : null,
      eq.wallBalls ? "Wall balls" : null,
      eq.sandbag ? "Sandbag" : null,
      eq.farmersHandles ? "Farmers / KBs" : null,
      eq.fullGym ? "Full gym" : null,
    ].filter(Boolean) as string[],
    preferErgOverRun:
      classification.preferErgOverRun ||
      inputs.mainLimiter === "ergs" ||
      !eq.track && !eq.treadmill,
    suggestRecoveryMonitoring:
      inputs.recoveryStatus !== "good" || inputs.sleepQuality !== "good",
    sleepQuality: inputs.sleepQuality === "good" ? "good" : "poor",
    recoveryStatus: recoveryToLib(inputs.recoveryStatus),
    saturdayAvailable: inputs.saturdayAvailable,
    preferredLongAerobicDay: inputs.preferredLongAerobicDay,
    lowerBodySoreness: inputs.lowerBodySoreness,
    weeklyRunKm: inputs.weeklyRunKm,
  };
}

export type SandboxProfilePreview = {
  classification: string;
  mainLimiter: string;
  secondaryLimiter: string;
  stationPriorities: string;
  recoveryRisk: string;
  doubleSessionReadiness: string;
  raceTimeline: string;
  blockFocus: string;
  coachingPriority: string;
};

export function buildSandboxProfilePreview(
  inputs: ProgrammeSandboxInputs,
  classification: AthleteClassificationResult,
  ctx: ProgrammeContext
): SandboxProfilePreview {
  const weaknesses = stationOptionsToWeaknesses(inputs.stationWeaknesses);
  const focus = rotateStationFocusForBlock(weaknesses, inputs.blockWeek);
  const secondary =
    inputs.mainLimiter === "running"
      ? focus[0] ? `Stations (${focus[0].replace(/_/g, " ")})` : "Station durability"
      : inputs.mainLimiter === "recovery"
        ? "Load management"
        : "Running engine maintenance";

  const recoveryRisk =
    inputs.recoveryStatus === "poor" || inputs.sleepQuality === "poor"
      ? "Elevated — cap hard days and monitor"
      : inputs.recoveryStatus === "average" || inputs.sleepQuality === "average"
        ? "Moderate — protect easy days"
        : "Low — standard progression";

  const doubleLabels: Record<SandboxDoubleReadiness, string> = {
    not_ready: "Not ready",
    aerobic_double_only: "Aerobic doubles only",
    threshold_run_plus_easy_aerobic: "Threshold + easy aerobic",
    threshold_run_plus_erg_threshold: "Threshold + erg threshold",
  };

  return {
    classification: CLASSIFICATION_LABELS[classification.classification],
    mainLimiter: MAIN_LIMITER_LABELS[inputs.mainLimiter],
    secondaryLimiter: secondary,
    stationPriorities: focus.length ? focus.map((w) => w.replace(/_/g, " ")).join(" → ") : "None flagged",
    recoveryRisk,
    doubleSessionReadiness: doubleLabels[inputs.doubleSessionReadiness],
    raceTimeline: `${RACE_WEEKS[inputs.raceTimeline]} weeks out (${ctx.raceTimeline})`,
    blockFocus: BLOCK_LABELS[inputs.programmeBlock],
    coachingPriority:
      classification.suggestedFocus[0] ??
      `Address ${MAIN_LIMITER_LABELS[inputs.mainLimiter]} while holding week ${inputs.blockWeek} rhythm`,
  };
}

export type SandboxSessionBadge =
  | "Key Session"
  | "Optional Add-On"
  | "Support Add-On"
  | "Performance Test"
  | "AM"
  | "PM"
  | "Main";

export type SandboxTimeOfDay = "AM" | "PM" | "Main" | "Optional";

export type SandboxSessionBlock = {
  timeOfDay: SandboxTimeOfDay;
  badges: SandboxSessionBadge[];
  title: string;
  sessionType: HyroxSessionCategory | "rest";
  duration: string;
  intensity: string;
  rpeHr: string;
  isKeySession: boolean;
  isOptional: boolean;
  rationale: string;
  sessionId: string | null;
  prescription: ResolvedSessionPrescription | null;
  /** @deprecated use prescription */
  sessionDetail: SandboxSessionDetail | null;
  thresholdMinutes?: number;
  emom?: EmomPrescription | null;
};

export type SandboxDaySession = {
  day: string;
  role: DaySlotRole;
  roleLabel: string;
  title: string;
  sessionType: HyroxSessionCategory | "rest";
  intensity: string;
  duration: string;
  rpeHr: string;
  isKeySession: boolean;
  hardDay: boolean;
  hardEasyLabel: string;
  thresholdMinutes: number;
  qualityRunMinutes: number;
  plannedMinutes: number;
  rationale: string;
  sessions: SandboxSessionBlock[];
  /** @deprecated use sessions[] */
  optionalAddOn: string | null;
  emom: EmomPrescription | null;
  stationFocus: string | null;
  equipment: string[];
  sessionId: string | null;
  prescription: ResolvedSessionPrescription | null;
  /** @deprecated use prescription */
  sessionDetail: SandboxSessionDetail | null;
};

export type SandboxWeeklyScheduleResult = {
  days: SandboxDaySession[];
  warnings: SchedulingValidationWarning[];
  hoursPlan: WeeklyHoursPlan;
};

export type SandboxSessionDetail = {
  sessionId: string;
  category: string;
  objective: string;
  variantLevel: string;
  variantSummary: string;
  progressionRule: string | null;
  progressionLabel: string;
  mainSet: string | null;
  paceGuidance: string;
  whatToRecord: string[];
  coachNote: string;
  mainSetPrescription?: string[];
};

function resolveSessionForDay(
  day: WeeklyDayTemplate,
  inputs: ProgrammeSandboxInputs,
  ctx: ProgrammeContext,
  classification: AthleteClassificationResult
): string | null {
  if (day.intensity === "rest") return null;

  const focus = rotateStationFocusForBlock(
    stationOptionsToWeaknesses(inputs.stationWeaknesses),
    inputs.blockWeek
  );

  if (day.role === "compromised_hybrid") {
    return pickCompromisedSessionId(day, inputs, focus);
  }

  if (day.role === "hard_run") {
    if (day.day === "Tue" && inputs.trainingDays >= 4) {
      return getTuesdayThresholdSessionId(inputs.programmeBlock, inputs.blockWeek);
    }
    if (inputs.trainingDays >= 4) {
      return getTuesdayThresholdSessionId(inputs.programmeBlock, inputs.blockWeek);
    }
    if (inputs.blockWeek === 4) return "hyrox_run_threshold_3x10";
    return "hyrox_run_threshold_6x6";
  }

  if (day.role === "tempo_aerobic") {
    if (day.day === "Tue") {
      return getTuesdayThresholdSessionId(inputs.programmeBlock, inputs.blockWeek);
    }
    return "hyrox_run_tempo_hm";
  }

  if (day.role === "gym_aerobic_upper") {
    return "hyrox_gym_aerobic_upper_grip";
  }

  if (day.role === "long_aerobic" && (classification.preferErgOverRun || ctx.preferErgOverRun)) {
    if (inputs.equipment.bike || inputs.equipment.skiErg) return "hyrox_erg_mixed_aerobic";
  }

  if (day.role === "erg_threshold") {
    if (focus.includes("row") && inputs.equipment.rowErg) return "hyrox_erg_row_threshold_8x4";
    if (inputs.equipment.skiErg) return "hyrox_erg_ski_threshold_8x4";
    if (inputs.equipment.rowErg) return "hyrox_erg_row_threshold_8x4";
    return "hyrox_erg_bike_z2";
  }

  if (day.role === "erg_z2" && (inputs.recoveryStatus === "poor" || inputs.sleepQuality === "poor")) {
    return "hyrox_erg_mixed_recovery";
  }

  if (day.role === "strength_lower") {
    if (focus.includes("sled") || focus.includes("sled_push_pull")) {
      return inputs.equipment.sled ? "hyrox_strength_lower_sled" : "hyrox_strength_heavy_legs";
    }
    return "hyrox_strength_heavy_legs";
  }

  const defaultId = roleToDefaultSessionId(day.role, {
    preferErgOverRun: ctx.preferErgOverRun,
    blockWeek: inputs.blockWeek,
    programmeBlock: inputs.programmeBlock,
    saturdayKey: day.day === "Sat" && inputs.saturdayAvailable,
    abilityLevel: inputs.abilityLevel,
  });
  if (defaultId) return defaultId;

  return ROLE_TO_SESSION[day.role] ?? null;
}

function resolverInput(
  inputs: ProgrammeSandboxInputs,
  sessionId: string,
  extras?: Partial<SessionResolverInput>
): SessionResolverInput {
  return {
    sessionId,
    abilityLevel: inputs.abilityLevel,
    programmeBlock: inputs.programmeBlock,
    blockWeek: inputs.blockWeek,
    fiveKm: inputs.fiveKm,
    tenKm: inputs.tenKm.trim() || null,
    maxHeartRate: inputs.maxHeartRate,
    thresholdHeartRate: inputs.thresholdHeartRate,
    stationWeaknesses: stationOptionsToWeaknesses(inputs.stationWeaknesses),
    equipment: inputs.equipment as Record<string, boolean>,
    recoveryStatus: inputs.recoveryStatus,
    weeklyTrainingHours: inputs.weeklyTrainingHours,
    ...extras,
  };
}

function resolvePrescription(
  inputs: ProgrammeSandboxInputs,
  sessionId: string,
  extras?: Partial<SessionResolverInput>
): ResolvedSessionPrescription {
  return resolveSessionPrescription(resolverInput(inputs, sessionId, extras));
}

function prescriptionToSessionDetail(
  prescription: ResolvedSessionPrescription,
  inputs: ProgrammeSandboxInputs
): SandboxSessionDetail {
  return {
    sessionId: prescription.sessionLibraryId,
    category: prescription.category,
    objective: prescription.objective,
    variantLevel: inputs.abilityLevel,
    variantSummary: prescription.variantSummary,
    progressionLabel: prescription.progressionLabel,
    progressionRule: prescription.progressionNote || null,
    mainSet: prescription.keySetSummary,
    paceGuidance: [
      prescription.targetPace,
      prescription.targetSplit,
      prescription.targetLoad,
      prescription.targetHRRange,
    ]
      .filter(Boolean)
      .join(" · ") || prescription.rpeTarget,
    whatToRecord: prescription.whatToRecord,
    coachNote: prescription.coachNote,
    mainSetPrescription: prescription.mainSet,
  };
}

function formatRpeHr(prescription: ResolvedSessionPrescription): string {
  const parts = [prescription.rpeTarget];
  if (prescription.targetHRRange) parts.push(prescription.targetHRRange);
  else if (prescription.fallbackHRGuide) parts.push(prescription.fallbackHRGuide);
  return parts.join(" · ");
}

function buildThresholdBlock(
  inputs: ProgrammeSandboxInputs,
  hintReason: string,
  timeOfDay: SandboxTimeOfDay,
  isTuesdayPmDouble: boolean
): SandboxSessionBlock {
  const prog = getThresholdSessionForWeek(inputs.programmeBlock, inputs.blockWeek);
  const prescription = resolvePrescription(inputs, prog.sessionLibraryId, {
    thresholdProgression: prog,
    nameOverride: prog.name,
    rationale: hintReason,
  });
  const badges: SandboxSessionBadge[] = [
    timeOfDay === "AM" ? "AM" : timeOfDay === "PM" ? "PM" : "Main",
    "Key Session",
  ];
  return {
    timeOfDay,
    badges,
    title: prescription.name,
    sessionType: "run_development",
    duration: prescription.duration,
    intensity: prescription.rpeTarget,
    rpeHr: `Threshold ${prog.thresholdMinutes} min · ${formatRpeHr(prescription)}`,
    isKeySession: true,
    isOptional: false,
    rationale: isTuesdayPmDouble
      ? `Key Tuesday threshold (AM) — ${prog.mainSet}. ${THRESHOLD_HR_RPE_NOTE}`
      : `Key Tuesday threshold — ${prog.mainSet}. ${prog.paceNote} ${THRESHOLD_HR_RPE_NOTE}`,
    sessionId: prog.sessionLibraryId,
    prescription,
    sessionDetail: prescriptionToSessionDetail(prescription, inputs),
    thresholdMinutes: prog.thresholdMinutes,
    emom: null,
  };
}

function buildStrengthEnduranceBlock(
  slot: ScheduledDaySlot,
  inputs: ProgrammeSandboxInputs,
  hintReason: string,
  timeOfDay: SandboxTimeOfDay
): SandboxSessionBlock {
  const sessionId = slot.sessionId ?? "hyrox_strength_heavy_legs";
  const prescription = resolvePrescription(inputs, sessionId, { rationale: hintReason });
  const badges: SandboxSessionBadge[] = [
    timeOfDay === "PM" ? "PM" : "Main",
    "Key Session",
  ];
  return {
    timeOfDay,
    badges,
    title: prescription.name,
    sessionType: "strength",
    duration: prescription.duration,
    intensity: prescription.rpeTarget,
    rpeHr: formatRpeHr(prescription),
    isKeySession: true,
    isOptional: false,
    rationale:
      slot.notes ??
      "Thursday staple — lower strength endurance for Hyrox leg durability. Tempo never replaces this session.",
    sessionId,
    prescription,
    sessionDetail: prescriptionToSessionDetail(prescription, inputs),
    emom: slot.emom ?? null,
  };
}

function buildTempoAmBlock(inputs: ProgrammeSandboxInputs): SandboxSessionBlock {
  const tempo = getTempoSessionDisplay(inputs.blockWeek);
  const prescription = resolvePrescription(inputs, "hyrox_run_tempo_hm", {
    tempoDisplay: tempo,
    nameOverride: tempo.name,
  });
  return {
    timeOfDay: "AM",
    badges: ["AM", "Optional Add-On"],
    title: prescription.name,
    sessionType: "tempo_aerobic_quality",
    duration: prescription.duration,
    intensity: prescription.rpeTarget,
    rpeHr: formatRpeHr(prescription),
    isKeySession: false,
    isOptional: true,
    rationale:
      "Optional Thursday AM tempo — secondary aerobic quality below threshold. PM lower strength endurance remains the staple key session.",
    sessionId: "hyrox_run_tempo_hm",
    prescription,
    sessionDetail: prescriptionToSessionDetail(prescription, inputs),
    emom: null,
  };
}

function buildMainSessionBlock(
  slot: ScheduledDaySlot,
  inputs: ProgrammeSandboxInputs,
  ctx: ProgrammeContext,
  classification: AthleteClassificationResult,
  hintReason: string
): SandboxSessionBlock {
  if (slot.day === "Tue" && slot.role === "hard_run") {
    return buildThresholdBlock(inputs, hintReason, "Main", false);
  }
  if (slot.day === "Thu" && slot.role === "strength_lower") {
    return buildStrengthEnduranceBlock(slot, inputs, hintReason, slot.optionalAmRole ? "PM" : "Main");
  }
  const sessionId = slot.sessionId ?? null;
  const libSession = sessionId ? getHyroxSession(sessionId) : undefined;
  const prescription = sessionId
    ? resolvePrescription(inputs, sessionId, { rationale: hintReason })
    : null;
  const isKey =
    slot.role === "compromised_hybrid" ||
    (slot.role === "hard_run" && slot.day === "Tue") ||
    (slot.role === "strength_lower" && slot.day === "Thu") ||
    slot.role === "erg_threshold";

  let rationale = slot.notes ?? ROLE_DISPLAY[slot.role];
  if (slot.role === "compromised_hybrid") {
    rationale = slot.notes ?? "Saturday key Hyrox session";
  }

  const badges: SandboxSessionBadge[] = ["Main"];
  if (isKey) badges.push("Key Session");
  if (slot.role === "gym_aerobic_upper") badges.push("Support Add-On");

  return {
    timeOfDay: "Main",
    badges,
    title: prescription?.name ?? ROLE_DISPLAY[slot.role],
    sessionType: libSession?.category ?? "run_development",
    duration: prescription?.duration ?? `~${slot.plannedMinutes} min`,
    intensity: prescription?.rpeTarget ?? slot.intensity,
    rpeHr: prescription ? formatRpeHr(prescription) : "—",
    isKeySession: isKey,
    isOptional: false,
    rationale,
    sessionId,
    prescription,
    sessionDetail: prescription ? prescriptionToSessionDetail(prescription, inputs) : null,
    thresholdMinutes: prescription?.thresholdMinutes ?? slot.thresholdMinutes,
    emom: slot.emom ?? null,
  };
}

function buildOptionalPmBlocks(
  slot: ScheduledDaySlot,
  inputs: ProgrammeSandboxInputs,
  ctx: ProgrammeContext
): SandboxSessionBlock[] {
  const blocks: SandboxSessionBlock[] = [];
  const day = slot.day;

  if (day === "Sun" && slot.role === "long_aerobic" && inputs.doubleSessionReadiness !== "not_ready") {
    const pmId = "hyrox_erg_bike_z2";
    const prescription = resolvePrescription(inputs, pmId, {
      rationale: SUNDAY_AEROBIC_DOUBLE_RATIONALE,
    });
    blocks.push({
      timeOfDay: "PM",
      badges: ["PM", "Optional Add-On"],
      title: "Easy Aerobic Double",
      sessionType: "erg_development",
      duration: "30–45 min",
      intensity: prescription.rpeTarget,
      rpeHr: formatRpeHr(prescription),
      isKeySession: false,
      isOptional: true,
      rationale: SUNDAY_AEROBIC_DOUBLE_RATIONALE,
      sessionId: pmId,
      prescription,
      sessionDetail: prescriptionToSessionDetail(prescription, inputs),
      emom: null,
    });
  }

  if (day === "Tue" && slot.role === "hard_run" && inputs.doubleSessionReadiness !== "not_ready") {
    const pmId =
      inputs.doubleSessionReadiness === "threshold_run_plus_erg_threshold"
        ? "hyrox_erg_ski_threshold_8x4"
        : "hyrox_erg_bike_z2";
    const prescription = resolvePrescription(inputs, pmId, {
      rationale: "Tuesday PM double — only when athlete is double-session ready.",
    });
    const pmLabel =
      inputs.doubleSessionReadiness === "threshold_run_plus_erg_threshold"
        ? prescription.name
        : inputs.doubleSessionReadiness === "threshold_run_plus_easy_aerobic"
          ? "Easy Aerobic (PM)"
          : prescription.name;
    blocks.push({
      timeOfDay: "PM",
      badges: ["PM", "Optional Add-On"],
      title: pmLabel,
      sessionType: "erg_development",
      duration: prescription.duration,
      intensity:
        inputs.doubleSessionReadiness === "threshold_run_plus_erg_threshold" ? "hard" : "easy",
      rpeHr: formatRpeHr(prescription),
      isKeySession: inputs.doubleSessionReadiness === "threshold_run_plus_erg_threshold",
      isOptional: true,
      rationale: "Tuesday PM double — only when athlete is double-session ready.",
      sessionId: pmId,
      prescription,
      sessionDetail: prescriptionToSessionDetail(prescription, inputs),
      emom: null,
    });
  }

  if (
    (slot.role === "erg_z2" || slot.role === "gym_aerobic_upper") &&
    slot.intensity === "easy" &&
    day !== "Sun"
  ) {
    const pmId = "hyrox_erg_bike_z2";
    const prescription = resolvePrescription(inputs, pmId, {
      rationale: AEROBIC_DAY_EXTRA_GUIDANCE,
    });
    blocks.push({
      timeOfDay: "Optional",
      badges: ["Optional Add-On"],
      title: "Extra Low-Impact Aerobic",
      sessionType: "erg_development",
      duration: prescription.duration,
      intensity: "easy",
      rpeHr: formatRpeHr(prescription),
      isKeySession: false,
      isOptional: true,
      rationale: AEROBIC_DAY_EXTRA_GUIDANCE,
      sessionId: pmId,
      prescription,
      sessionDetail: prescriptionToSessionDetail(prescription, inputs),
      emom: null,
    });
  }

  return blocks;
}

function buildDaySessions(
  slot: ScheduledDaySlot,
  inputs: ProgrammeSandboxInputs,
  ctx: ProgrammeContext,
  classification: AthleteClassificationResult,
  hintReason: string
): SandboxSessionBlock[] {
  const sessions: SandboxSessionBlock[] = [];

  if (
    slot.day === "Thu" &&
    slot.role === "strength_lower" &&
    slot.optionalAmRole === "tempo_aerobic"
  ) {
    sessions.push(buildTempoAmBlock(inputs));
    sessions.push(buildStrengthEnduranceBlock(slot, inputs, hintReason, "PM"));
    return [...sessions, ...buildOptionalPmBlocks(slot, inputs, ctx)];
  }

  sessions.push(buildMainSessionBlock(slot, inputs, ctx, classification, hintReason));
  return [...sessions, ...buildOptionalPmBlocks(slot, inputs, ctx)];
}

function validateSandboxSchedule(
  days: SandboxDaySession[],
  inputs: ProgrammeSandboxInputs
): SchedulingValidationWarning[] {
  const warnings: SchedulingValidationWarning[] = [];
  for (const d of days) {
    if (d.day === "Thu" && d.role === "tempo_aerobic") {
      warnings.push({
        id: "tempo_replaces_strength",
        severity: "warn",
        message: "Tempo must not replace Thursday lower strength endurance.",
        days: ["Thu"],
      });
    }
    const thuKey = d.sessions.find((s) => s.title.includes("Hyrox Legs") || s.sessionId === "hyrox_strength_heavy_legs");
    const thuTempoOnly = d.sessions.length === 1 && d.sessions[0]?.sessionId === "hyrox_run_tempo_hm";
    if (d.day === "Thu" && thuTempoOnly) {
      warnings.push({
        id: "tempo_replaces_strength",
        severity: "warn",
        message: "Thursday shows tempo only — lower strength endurance staple is missing.",
        days: ["Thu"],
      });
    }
    if (d.day === "Thu" && !thuKey && d.intensity !== "rest") {
      warnings.push({
        id: "strength_not_key",
        severity: "warn",
        message: "Lower strength endurance should appear as Thursday key session.",
        days: ["Thu"],
      });
    }
    const tueBlock = d.sessions.find(
      (s) =>
        s.isKeySession &&
        (s.title.startsWith("Threshold") || s.title.startsWith("Controlled Fast"))
    );
    if (d.day === "Tue" && tueBlock) {
      const prog = getThresholdSessionForWeek(inputs.programmeBlock, inputs.blockWeek);
      if (!tueBlock.title.includes(`${prog.reps} x ${prog.repDurationMinutes}`)) {
        warnings.push({
          id: "threshold_title_mismatch",
          severity: "warn",
          message: `Threshold title "${tueBlock.title}" does not match progression ${prog.mainSet}.`,
          days: ["Tue"],
        });
      }
    }
    if (
      d.sessions.length > 1 &&
      !d.sessions.some((s) => s.timeOfDay === "AM" || s.timeOfDay === "PM")
    ) {
      warnings.push({
        id: "double_session_unclear",
        severity: "warn",
        message: `${d.day} has multiple sessions but AM/PM labels are missing.`,
        days: [d.day as import("@/src/lib/hyrox/types").Weekday],
      });
    }
  }
  return warnings;
}

function scheduledSlotToSandboxDay(
  slot: ScheduledDaySlot,
  inputs: ProgrammeSandboxInputs,
  ctx: ProgrammeContext,
  classification: AthleteClassificationResult,
  hintReason: string,
  stationFocusLabel: string | null
): SandboxDaySession {
  if (slot.intensity === "rest") {
    return {
      day: slot.day,
      role: slot.role,
      roleLabel: ROLE_DISPLAY[slot.role],
      title: "Rest",
      sessionType: "rest",
      intensity: "rest",
      duration: "—",
      rpeHr: "—",
      isKeySession: false,
      hardDay: false,
      hardEasyLabel: "Rest",
      thresholdMinutes: 0,
      qualityRunMinutes: 0,
      plannedMinutes: 0,
      rationale: slot.notes ?? "Rest day — absorb training",
      sessions: [],
      optionalAddOn: null,
      emom: null,
      stationFocus: null,
      equipment: [],
      sessionId: null,
      prescription: null,
      sessionDetail: null,
    };
  }

  const sessions = buildDaySessions(slot, inputs, ctx, classification, hintReason);
  const primary = sessions.find((s) => s.timeOfDay === "Main" || s.timeOfDay === "PM") ?? sessions[0];
  const keySession = sessions.find((s) => s.isKeySession && !s.isOptional) ?? primary;

  return {
    day: slot.day,
    role: slot.role,
    roleLabel: ROLE_DISPLAY[slot.role],
    title: keySession?.title ?? ROLE_DISPLAY[slot.role],
    sessionType: keySession?.sessionType ?? "run_development",
    intensity: slot.intensity,
    duration: keySession?.duration ?? `~${slot.plannedMinutes} min`,
    rpeHr: keySession?.rpeHr ?? "—",
    isKeySession: sessions.some((s) => s.isKeySession && !s.isOptional),
    hardDay: slot.hardDay,
    hardEasyLabel: slot.hardDay ? "Hard" : slot.intensity === "moderate" ? "Moderate" : "Easy",
    thresholdMinutes: slot.thresholdMinutes,
    qualityRunMinutes: slot.qualityRunMinutes,
    plannedMinutes: slot.plannedMinutes,
    rationale: slot.notes ?? keySession?.rationale ?? "",
    sessions,
    optionalAddOn: null,
    emom: slot.emom ?? null,
    stationFocus: stationFocusLabel,
    equipment: primary?.sessionId ? getHyroxSession(primary.sessionId)?.equipment ?? [] : [],
    sessionId: primary?.sessionId ?? slot.sessionId ?? null,
    prescription: primary?.prescription ?? null,
    sessionDetail: primary?.sessionDetail ?? null,
  };
}

export function buildSandboxWeeklySchedule(
  inputs: ProgrammeSandboxInputs,
  ctx: ProgrammeContext,
  classification: AthleteClassificationResult
): SandboxWeeklyScheduleResult {
  const phase = weeksToRacePhase(RACE_WEEKS[inputs.raceTimeline]);
  const scheduleOpts = {
    trainingDaysAvailable: inputs.trainingDays,
    saturdayAvailable: inputs.saturdayAvailable,
    preferredLongAerobicDay: inputs.preferredLongAerobicDay,
    recoveryStatus: ctx.recoveryStatus,
    blockWeek: inputs.blockWeek,
    stationWeaknesses: stationOptionsToWeaknesses(inputs.stationWeaknesses),
    doubleSessionReadiness: ctx.doubleSessionReadiness,
    lowerBodySoreness: inputs.lowerBodySoreness,
    weeklyTrainingHours: inputs.weeklyTrainingHours,
  };

  let structure = suggestWeeklyStructure({
    trainingDaysAvailable: inputs.trainingDays,
    classification: classification.classification,
    allowsDoubles: ctx.allowsDoubleSessions,
    scheduleOptions: scheduleOpts,
  });
  structure = applyRaceTimelineToStructure(structure, phase);
  structure = applyBlockWeekDeload(structure, inputs.blockWeek);

  let days = sortDaysCalendar(structure.days);
  days = applyDoubleSessionStacking(days, ctx.doubleSessionReadiness);

  if (!inputs.saturdayAvailable) {
    const sat = days.find((d) => d.day === "Sat");
    if (sat) {
      sat.role = "erg_z2";
      sat.intensity = "easy";
      sat.notes = "Saturday unavailable — key session moved to Tue/Thu where possible";
    }
  }

  const hints = buildSessionSelectionHints(ctx);
  const hintReason = hints[0]?.reason ?? structure.description;
  const stationFocus = rotateStationFocusForBlock(
    stationOptionsToWeaknesses(inputs.stationWeaknesses),
    inputs.blockWeek
  );
  const stationFocusLabel = stationFocus.length
    ? stationFocus.map((w) => w.replace(/_/g, " ")).join(" → ")
    : null;

  const scheduled: ScheduledDaySlot[] = days.map((day) => {
    if (day.intensity === "rest" || day.active === false) {
      return enrichScheduledDay({ ...day, intensity: "rest", role: "rest" }, null, inputs.blockWeek);
    }
    const sessionId = resolveSessionForDay(day, inputs, ctx, classification);
    let slot = enrichScheduledDay(day, sessionId, inputs.blockWeek);

    if (slot.day === "Tue" && slot.role === "hard_run") {
      const prog = getThresholdSessionForWeek(inputs.programmeBlock, inputs.blockWeek);
      slot.sessionId = prog.sessionLibraryId;
      slot.thresholdMinutes =
        inputs.blockWeek === 4
          ? Math.round(prog.thresholdMinutes * 0.85)
          : prog.thresholdMinutes;
    }

    slot = attachStationEmom(slot, stationOptionsToWeaknesses(inputs.stationWeaknesses), inputs.blockWeek);
    return slot;
  });

  const warnings = [
    ...validateWeeklyStress(scheduled, {
      ...scheduleOpts,
      trainingDays: inputs.trainingDays,
      abilityLevel: inputs.abilityLevel,
      weeklyTrainingHours: inputs.weeklyTrainingHours,
      programmeBlock: inputs.programmeBlock,
    }),
  ];

  const hoursPlan = planWeeklyHours(scheduled, inputs.weeklyTrainingHours, inputs.blockWeek);

  const sandboxDays = scheduled.map((slot) =>
    scheduledSlotToSandboxDay(
      slot,
      inputs,
      ctx,
      classification,
      hintReason,
      stationFocusLabel
    )
  );

  return {
    days: sandboxDays,
    warnings: [...warnings, ...validateSandboxSchedule(sandboxDays, inputs)],
    hoursPlan,
  };
}

export type SandboxProgressionRow = {
  week: BlockWeekInCycle;
  label: string;
  runThreshold: string;
  runVolume: string;
  stationWeakness: string;
  compromisedRunning: string;
  strengthEndurance: string;
};

export function buildSandboxFourWeekProgression(
  inputs: ProgrammeSandboxInputs
): SandboxProgressionRow[] {
  const weaknesses = stationOptionsToWeaknesses(inputs.stationWeaknesses);
  const weeks: BlockWeekInCycle[] = [1, 2, 3, 4];

  return weeks.map((w) => {
    const focus = rotateStationFocusForBlock(weaknesses, w);
    const stationLabel = focus.length
      ? `Focus: ${focus.map((f) => f.replace(/_/g, " ")).join(", ")}`
      : "General station maintenance";

    const thresholdProg = getThresholdSessionForWeek(inputs.programmeBlock, w).mainSet;
    const volumeNote =
      w === 4
        ? `Deload — ~${Math.round(inputs.weeklyRunKm * 0.85)} km target`
        : `Build toward ${inputs.weeklyRunKm + (w - 1) * 3} km / week`;

    const compromisedProg =
      getSessionProgressionForWeek("hyrox_compromised_threshold_run_station_overload", w) ??
      getSessionProgressionForWeek("hyrox_compromised_run_wallballs", w) ??
      getSessionProgressionForWeek("hyrox_compromised_mini_test", w);

    const strengthProg = getSessionProgressionForWeek("hyrox_strength_heavy_legs", w);

    return {
      week: w,
      label: w === 4 ? "Week 4 — deload" : `Week ${w}`,
      runThreshold: thresholdProg ?? "Threshold progression family",
      runVolume: volumeNote,
      stationWeakness: stationLabel,
      compromisedRunning: compromisedProg ?? "Compromised density progression",
      strengthEndurance: strengthProg ?? "Leg endurance / tempo strength",
    };
  });
}

export function buildSandboxRecoveryAdjustments(
  inputs: ProgrammeSandboxInputs,
  ctx: ProgrammeContext
): { poor: string[]; good: string[] } {
  const poor: string[] = [...getRecoveryAdjustmentSuggestions(ctx)];
  const good: string[] = [];

  if (inputs.recoveryStatus === "poor" || inputs.sleepQuality === "poor") {
    poor.push("Reduce threshold volume — consider 3×10 min instead of 6×6.");
    poor.push("Swap one hard run day for 40–50 min easy bike/erg (Z2).");
    poor.push("Remove double sessions until sleep/recovery improves.");
    poor.push("Move key run 24 hours later if legs are heavy from strength.");
    poor.push("Reduce lower-body strength volume ~25–30% — keep movement quality.");
  }

  if (inputs.recoveryStatus === "good" && inputs.sleepQuality === "good") {
    if (inputs.abilityLevel === "advanced" || inputs.abilityLevel === "pro") {
      if (inputs.doubleSessionReadiness !== "not_ready") {
        good.push("Optional aerobic double on suitable days (easy run AM + bike PM).");
      }
      if (inputs.doubleSessionReadiness === "threshold_run_plus_erg_threshold") {
        good.push("Threshold run AM + Ski/Row threshold PM when prior weeks were compliant.");
      }
    }
    if (inputs.raceTimeline === "4" || inputs.raceTimeline === "race_week") {
      good.push("Increase Hyrox specificity — race-pace stations and compromised density.");
    }
    if (inputs.recoveryStatus === "good" && inputs.trainingDays >= 5) {
      good.push("Maintain weekly rhythm — add duration to long aerobic before extra threshold.");
    }
  }

  if (inputs.blockWeek === 4) {
    poor.push("Week 4 deload — reduce volume 10–20% while keeping session types.");
  }

  return {
    poor: poor.length ? poor : ["No poor-recovery overrides needed for current inputs."],
    good: good.length ? good : ["Standard progression — no recovery-driven upgrades."],
  };
}

export { MAIN_LIMITER_LABELS, BLOCK_LABELS, ROLE_DISPLAY };
