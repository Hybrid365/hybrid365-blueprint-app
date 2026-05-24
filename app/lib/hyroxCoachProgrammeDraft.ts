/**
 * Coach programme draft — generation, validation, weekly summary (mock/local state).
 */

import {
  buildSandboxWeeklySchedule,
  sandboxBuildProgrammeContext,
  sandboxToClassificationInput,
  type ProgrammeSandboxInputs,
  type SandboxDaySession,
  type SandboxSessionBlock,
  type SandboxTimeOfDay,
} from "@/app/lib/hyroxProgrammeSandbox";
import type { CoachAthlete, CoachAthleteProgrammeInputs } from "@/app/lib/hyroxCoachMockAthletes";
import {
  categoryToSessionType,
  getCoachLibraryEntry,
  volumeMetaFromEntry,
  type CoachLibraryEntry,
} from "@/app/lib/hyroxCoachSessionLibrary";
import type { CoachSessionVolumeMeta } from "@/app/lib/hyroxCoachSessionLibraryTypes";
import { classifyAthlete } from "@/src/lib/hyrox/athleteClassification";
import { HYROX_SESSION_LIBRARY, getHyroxSession } from "@/src/lib/hyrox/sessionLibrary";
import { resolveSessionPrescription } from "@/src/lib/hyrox/sessionResolver";
import type { HyroxSessionDefinition } from "@/src/lib/hyrox/types";
import type { ResolvedSessionPrescription } from "@/src/lib/hyrox/types";

/** Publish / review workflow status (local mock). */
export type CoachProgrammeStatus =
  | "generated_draft"
  | "coach_reviewing"
  | "edited_draft"
  | "approved"
  | "published";

/** Roster list status for coach dashboard. */
export type CoachAthleteListStatus =
  | "assessment_submitted"
  | "profile_mapped"
  | "draft_generated"
  | "needs_coach_review"
  | "approved"
  | "published_to_athlete"
  | "check_in_requires_adjustment";

export type CoachSessionEditKind =
  | "threshold_run"
  | "erg_interval"
  | "easy_aerobic"
  | "strength_endurance"
  | "compromised"
  | "generic";

export type CoachSessionEditConfig = {
  kind: CoachSessionEditKind;
  sessionName: string;
  reps?: number;
  repDurationMinutes?: number;
  recovery?: string;
  targetPace?: string;
  hrGuide?: string;
  rpeTarget?: string;
  thresholdMinutes?: number;
  coachNote?: string;
  whatToRecord?: string[];
  modality?: "ski" | "row" | "bike";
  intervalDurationMinutes?: number;
  ergReps?: number;
  targetSplit?: string;
  durationMinutes?: number;
  hrZone?: string;
  upperGripAddOn?: boolean;
  exercises?: string;
  setsReps?: string;
  tempo?: string;
  rest?: string;
  loadRpe?: string;
  stationFinisher?: string;
  rounds?: number;
  runDistanceM?: number;
  station?: string;
  stationDetail?: string;
  targetPaceLoad?: string;
  filmPrompt?: string;
  bikeWatts?: string;
  bikeDurationMinutes?: number;
  wallBallReps?: number;
  burpeeReps?: number;
  emomMinutes?: number;
  lungeDurationMinutes?: number;
  skiDistanceM?: number;
};

export type CoachDraftSession = SandboxSessionBlock & {
  draftId: string;
  coachNote: string;
  placementWarning?: string;
  editConfig: CoachSessionEditConfig;
  showDetail?: boolean;
  /** Coach library id when added from expanded library */
  coachLibraryId?: string;
  volumeMeta?: CoachSessionVolumeMeta;
};

/** @deprecated use LibraryCategory from hyroxCoachSessionLibrary */
export type LibraryFilter = import("@/app/lib/hyroxCoachSessionLibrary").LibraryCategory;

export { LIBRARY_CATEGORY_LABELS as LIBRARY_FILTER_LABELS } from "@/app/lib/hyroxCoachSessionLibrary";

export type CoachDraftDay = Omit<SandboxDaySession, "sessions"> & {
  sessions: CoachDraftSession[];
};

export type CoachDraftWeek = {
  athleteId: string;
  block: number;
  week: number;
  days: CoachDraftDay[];
  generatedAt: string;
};

export type CoachDraftSessionCounts = {
  total: number;
  key: number;
  optional: number;
  main: number;
  am: number;
  pm: number;
};

/** Session counts from generated draft JSON (before publish). */
export function countCoachDraftSessions(draft: CoachDraftWeek): CoachDraftSessionCounts {
  const counts: CoachDraftSessionCounts = {
    total: 0,
    key: 0,
    optional: 0,
    main: 0,
    am: 0,
    pm: 0,
  };

  for (const day of draft.days) {
    for (const sess of day.sessions) {
      counts.total += 1;
      if (sess.isKeySession && !sess.isOptional) counts.key += 1;
      if (sess.isOptional) counts.optional += 1;
      if (sess.timeOfDay === "Main") counts.main += 1;
      else if (sess.timeOfDay === "AM") counts.am += 1;
      else if (sess.timeOfDay === "PM") counts.pm += 1;
    }
  }

  return counts;
}

export type ValidationItem = {
  id: string;
  severity: "warn" | "error" | "ok";
  message: string;
};

export type WeeklySummary = {
  plannedHours: number;
  availableHours: number;
  runVolumeKm: number;
  thresholdMinutes: number;
  qualityRunMinutes: number;
  ergMinutes: number;
  bikeMinutes: number;
  strengthMinutes: number;
  stationVolume: number;
  hardDays: number;
  easySupportDays: number;
  strengthSessions: number;
  hyroxSessions: number;
  optionalAddOns: number;
  stationWeaknessTouches: string[];
  upperGripTouches: number;
  doubleSessionDays: number;
};

let draftIdCounter = 0;
function nextDraftId(): string {
  draftIdCounter += 1;
  return `draft-${Date.now()}-${draftIdCounter}`;
}

const LIMITER_MAP: Record<string, ProgrammeSandboxInputs["mainLimiter"]> = {
  running: "running",
  stations: "wall_balls",
  sled: "sled",
  recovery: "recovery",
  ergs: "ergs",
  compromised_running: "compromised_running",
  wall_balls: "wall_balls",
};

export function athleteInputsToSandbox(
  inputs: CoachAthleteProgrammeInputs
): ProgrammeSandboxInputs {
  return {
    abilityLevel: inputs.abilityLevel,
    raceTimeline: inputs.raceTimeline,
    trainingDays: inputs.trainingDays,
    weeklyTrainingHours: inputs.weeklyTrainingHours,
    weeklyRunKm: inputs.weeklyRunKm,
    fiveKm: inputs.fiveKm,
    tenKm: inputs.tenKm,
    maxHeartRate: inputs.maxHeartRate,
    thresholdHeartRate: inputs.thresholdHeartRate,
    mainLimiter: LIMITER_MAP[inputs.mainLimiter] ?? "running",
    stationWeaknesses: inputs.stationWeaknesses as ProgrammeSandboxInputs["stationWeaknesses"],
    equipment: {
      treadmill: inputs.equipment.treadmill ?? false,
      track: inputs.equipment.track ?? false,
      skiErg: inputs.equipment.skiErg ?? false,
      rowErg: inputs.equipment.rowErg ?? false,
      bike: inputs.equipment.bike ?? false,
      sled: inputs.equipment.sled ?? false,
      wallBalls: inputs.equipment.wallBalls ?? false,
      sandbag: inputs.equipment.sandbag ?? false,
      farmersHandles: inputs.equipment.farmersHandles ?? false,
      fullGym: inputs.equipment.fullGym ?? false,
    },
    doubleSessionReadiness: inputs.doubleSessionReadiness,
    recoveryStatus: inputs.recoveryStatus,
    sleepQuality: inputs.sleepQuality,
    programmeBlock: inputs.programmeBlock,
    blockWeek: inputs.blockWeek,
    saturdayAvailable: inputs.saturdayAvailable,
    preferredLongAerobicDay: inputs.preferredLongAerobicDay,
    lowerBodySoreness: inputs.lowerBodySoreness,
  };
}

export function inferEditKind(
  sessionId: string | null,
  sessionType: string,
  coachLibraryId?: string
): CoachSessionEditKind {
  const coachEntry = coachLibraryId ? getCoachLibraryEntry(coachLibraryId) : null;
  if (coachEntry) {
    if (coachEntry.category === "threshold_runs" || coachEntry.tags.includes("threshold")) {
      if (coachEntry.impactType === "run") return "threshold_run";
      if (coachEntry.impactType === "erg" || coachEntry.impactType === "bike") return "erg_interval";
    }
    if (coachEntry.category === "tempo_aerobic") return "threshold_run";
    if (coachEntry.category === "easy_erg" || coachEntry.hardEasy === "easy") {
      if (coachEntry.impactType === "erg" || coachEntry.impactType === "bike") return "easy_aerobic";
    }
    if (coachEntry.category === "strength_endurance") return "strength_endurance";
    if (coachEntry.category === "hyrox_compromised") return "compromised";
    if (coachEntry.category === "erg_intervals") return "erg_interval";
    if (coachEntry.category === "upper_grip" || coachEntry.category === "station_emom") {
      return "strength_endurance";
    }
  }
  if (coachLibraryId?.startsWith("kieran-")) {
    if (coachEntry?.id === "kieran-race-pace-tempo") return "threshold_run";
    if (coachEntry?.id === "kieran-bike-th-overload") return "compromised";
    if (coachEntry?.impactType === "run") return "threshold_run";
    return "compromised";
  }
  if (!sessionId) return "generic";
  if (sessionId.startsWith("coach_")) {
    if (sessionId.includes("compromised")) return "compromised";
    if (sessionId.includes("strength")) return "strength_endurance";
    if (sessionId.includes("erg") || sessionId.includes("ski") || sessionId.includes("row")) {
      return sessionId.includes("threshold") ? "erg_interval" : "easy_aerobic";
    }
  }
  if (sessionId.includes("threshold") && sessionType.includes("run")) return "threshold_run";
  if (sessionId.includes("erg") && sessionId.includes("threshold")) return "erg_interval";
  if (
    sessionId.includes("erg_bike") ||
    sessionId.includes("mixed_aerobic") ||
    sessionId.includes("run_easy") ||
    sessionId.includes("hyrox_run_easy") ||
    sessionId.includes("long_easy")
  ) {
    return sessionId.includes("threshold") ? "erg_interval" : "easy_aerobic";
  }
  if (sessionId.includes("strength_heavy") || sessionId.includes("strength_lower")) {
    return "strength_endurance";
  }
  if (sessionType === "compromised_running" || sessionId.includes("compromised")) {
    return "compromised";
  }
  if (sessionId.includes("threshold") || sessionId.includes("5k_pace")) return "threshold_run";
  if (sessionId.includes("tempo")) return "threshold_run";
  return "generic";
}

export function defaultEditConfig(session: CoachDraftSession): CoachSessionEditConfig {
  const p = session.prescription;
  const coachEntry = session.coachLibraryId
    ? getCoachLibraryEntry(session.coachLibraryId)
    : null;
  const kind = inferEditKind(session.sessionId, session.sessionType, session.coachLibraryId);
  const base: CoachSessionEditConfig = {
    kind,
    sessionName: session.title,
    coachNote: session.coachNote,
    rpeTarget: p?.rpeTarget ?? session.intensity,
    hrGuide: p?.targetHRRange ?? p?.fallbackHRGuide ?? undefined,
    targetPace: p?.targetPace ?? undefined,
    targetSplit: p?.targetSplit ?? undefined,
    thresholdMinutes: session.thresholdMinutes,
    whatToRecord: p?.whatToRecord ?? [],
    filmPrompt: p?.filmPrompt ?? undefined,
  };

  if (kind === "threshold_run") {
    const m = session.title.match(/(\d+)\s*x\s*(\d+)/i);
    return {
      ...base,
      reps: m ? Number(m[1]) : coachEntry?.prescription.mainSet[0]?.match(/(\d+)×/)?.[1]
        ? Number(coachEntry.prescription.mainSet[0].match(/(\d+)×/)![1])
        : 5,
      repDurationMinutes: m
        ? Number(m[2])
        : coachEntry?.thresholdMinutes && coachEntry.thresholdMinutes % 5 === 0
          ? 5
          : 5,
      recovery: "90 sec",
      thresholdMinutes: coachEntry?.thresholdMinutes ?? session.thresholdMinutes,
    };
  }
  if (kind === "erg_interval") {
    return {
      ...base,
      modality: session.sessionId?.includes("row") ? "row" : "ski",
      ergReps: 8,
      intervalDurationMinutes: 4,
      recovery: "60–90 sec",
    };
  }
  if (kind === "easy_aerobic") {
    return {
      ...base,
      modality: session.sessionId?.includes("bike") ? "bike" : "ski",
      durationMinutes: parseDurationMinutes(session.duration),
      hrZone: "Z1–Z2",
      upperGripAddOn: session.sessionId === "hyrox_gym_aerobic_upper_grip",
    };
  }
  if (kind === "strength_endurance") {
    return {
      ...base,
      exercises: p?.mainSet?.join("\n") ?? "",
      setsReps: "4×8–10 squat · 4×8 RDL · 3×20–30m lunges",
      tempo: "3 sec lower, 1 sec pause",
      rest: "75–90 sec",
      loadRpe: "RPE 7–8",
      stationFinisher: "Weakness-based EMOM",
    };
  }
  if (kind === "compromised") {
    const coach = session.coachLibraryId
      ? getCoachLibraryEntry(session.coachLibraryId)
      : null;
    return {
      ...base,
      rounds: coach?.id === "kieran-bike-wb" ? 4 : 2,
      bikeDurationMinutes: coach?.bikeMinutes ? Math.round((coach.bikeMinutes ?? 12) / 4) : 3,
      bikeWatts: "300–400w",
      wallBallReps: 15,
      burpeeReps: 20,
      emomMinutes: coach?.id === "kieran-four-part-emom" ? 42 : undefined,
      lungeDurationMinutes: coach?.id === "kieran-bike-th-overload" ? 3 : undefined,
      runDistanceM: coach?.runDistanceKm ? Math.round(coach.runDistanceKm * 1000) : 750,
      station: coach?.subcategory.includes("lunge") ? "Lunges" : "Wall balls",
      stationDetail: coach?.prescription.mainSet[0] ?? "3 min @ race height",
      rest: "90–120 sec between blocks",
      targetPaceLoad: p?.targetPace ?? undefined,
    };
  }
  return base;
}

export function calcThresholdMinutesFromConfig(c: CoachSessionEditConfig): number | undefined {
  if (c.kind === "threshold_run" && c.reps && c.repDurationMinutes) {
    return c.reps * c.repDurationMinutes;
  }
  if (c.kind === "erg_interval" && c.ergReps && c.intervalDurationMinutes) {
    return c.ergReps * c.intervalDurationMinutes;
  }
  return c.thresholdMinutes;
}

function volumeMetaFromEdit(
  session: CoachDraftSession,
  c: CoachSessionEditConfig,
  thresholdMinutes: number | undefined
): CoachSessionVolumeMeta {
  const base = session.volumeMeta ?? {
    durationMinutes: parseDurationMinutes(session.duration),
    thresholdMinutes: thresholdMinutes ?? session.thresholdMinutes ?? 0,
    qualityRunMinutes: 0,
    runDistanceKm: 0,
    ergMinutes: 0,
    bikeMinutes: 0,
    strengthMinutes: 0,
    stationVolume: 0,
    hardDay: session.isKeySession,
    impactType: "mixed" as const,
    muscularStress: "moderate" as const,
    stationStress: "none" as const,
    isOptionalAddOn: session.isOptional,
  };

  const next = { ...base, thresholdMinutes: thresholdMinutes ?? base.thresholdMinutes };

  if (c.kind === "threshold_run" && c.reps && c.repDurationMinutes) {
    next.thresholdMinutes = c.reps * c.repDurationMinutes;
    next.qualityRunMinutes = 0;
    next.runDistanceKm = Math.round((next.thresholdMinutes / 5) * 1.8 * 10) / 10;
    next.durationMinutes = Math.max(base.durationMinutes, 40 + c.reps * 3);
  }
  if (c.kind === "erg_interval" && c.ergReps && c.intervalDurationMinutes) {
    next.thresholdMinutes = c.ergReps * c.intervalDurationMinutes;
    next.ergMinutes = c.modality === "bike" ? 0 : next.thresholdMinutes;
    next.bikeMinutes = c.modality === "bike" ? next.thresholdMinutes : 0;
    next.durationMinutes = Math.max(base.durationMinutes, 35 + c.ergReps * 2);
  }
  if (c.kind === "easy_aerobic" && c.durationMinutes) {
    next.durationMinutes = c.durationMinutes;
    if (c.modality === "bike") {
      next.bikeMinutes = c.durationMinutes;
      next.ergMinutes = 0;
    } else {
      next.ergMinutes = c.durationMinutes;
    }
  }
  if (c.kind === "strength_endurance") {
    next.strengthMinutes = Math.max(base.strengthMinutes, 45);
    next.muscularStress = "high";
  }
  if (c.kind === "compromised" && c.reps && c.repDurationMinutes) {
    next.thresholdMinutes = c.reps * c.repDurationMinutes;
    next.bikeMinutes = Math.max(next.bikeMinutes, next.thresholdMinutes);
  }
  if (c.kind === "compromised" && c.rounds) {
    next.stationVolume = Math.max(
      base.stationVolume,
      c.rounds * (c.wallBallReps ?? 15)
    );
    if (c.bikeDurationMinutes) {
      next.bikeMinutes = Math.max(
        base.bikeMinutes,
        c.rounds * c.bikeDurationMinutes
      );
    }
    if (c.runDistanceM) {
      next.runDistanceKm =
        Math.round(((c.runDistanceM * (c.rounds ?? 1)) / 1000 + base.runDistanceKm) * 10) / 10;
    }
    next.qualityRunMinutes = Math.max(base.qualityRunMinutes, (c.rounds ?? 2) * 8);
  }
  if (c.emomMinutes) {
    next.durationMinutes = Math.max(base.durationMinutes, c.emomMinutes);
  }
  if (c.lungeDurationMinutes && c.rounds) {
    next.stationVolume = Math.max(base.stationVolume, c.rounds * c.lungeDurationMinutes);
  }

  return next;
}

export function applyEditConfigToSession(session: CoachDraftSession): CoachDraftSession {
  const c = session.editConfig;
  const thresholdMinutes = calcThresholdMinutesFromConfig(c) ?? session.thresholdMinutes;
  let title = c.sessionName;
  let duration = session.duration;
  let rpeHr = c.rpeTarget ?? session.rpeHr;

  if (c.kind === "threshold_run" && c.reps && c.repDurationMinutes) {
    title = `${c.sessionName || "Threshold Run"} — ${c.reps} x ${c.repDurationMinutes} min`;
    duration = `~${45 + c.reps * 2} min`;
    if (c.targetPace) rpeHr = `${c.rpeTarget ?? "RPE 7–8"} · ${c.targetPace}`;
  }
  if (c.kind === "erg_interval" && c.ergReps && c.intervalDurationMinutes) {
    const mod = c.modality === "row" ? "Row" : c.modality === "bike" ? "Bike" : "Ski";
    title = `${mod} Threshold — ${c.ergReps} x ${c.intervalDurationMinutes} min`;
    if (c.targetSplit) rpeHr = `${c.rpeTarget ?? "RPE 7–8"} · ${c.targetSplit}`;
  }
  if (c.kind === "easy_aerobic" && c.durationMinutes) {
    duration = `${c.durationMinutes} min`;
  }
  if (c.hrGuide) {
    rpeHr = `${c.rpeTarget ?? session.rpeHr} · ${c.hrGuide}`;
  }

  const volumeMeta = volumeMetaFromEdit(session, c, thresholdMinutes);

  return {
    ...session,
    title,
    duration,
    rpeHr,
    thresholdMinutes: volumeMeta.thresholdMinutes,
    coachNote: c.coachNote ?? session.coachNote,
    intensity: c.rpeTarget ?? session.intensity,
    volumeMeta,
  };
}

function blockToCoachDraftSession(block: SandboxSessionBlock): CoachDraftSession {
  const draft: CoachDraftSession = {
    ...block,
    draftId: nextDraftId(),
    coachNote: "",
    placementWarning: undefined,
    editConfig: {
      kind: "generic",
      sessionName: block.title,
    },
  };
  draft.editConfig = defaultEditConfig(draft);
  return draft;
}

export function globalWeekForBlock(
  programmeBlock: 1 | 2 | 3,
  blockWeekInCycle: 1 | 2 | 3 | 4
): number {
  return (programmeBlock - 1) * 4 + blockWeekInCycle;
}

export const BLOCK_WEEK_FOCUS_LABELS: Record<1 | 2 | 3 | 4, string> = {
  1: "Base Intro",
  2: "Base Progression",
  3: "Base Peak",
  4: "Deload / Review",
};

export function generateCoachDraftWeekForBlockCycle(
  athlete: CoachAthlete,
  blockWeekInCycle: 1 | 2 | 3 | 4
): CoachDraftWeek {
  const programmeInputs = {
    ...athlete.programmeInputs,
    programmeBlock: athlete.programmeBlock,
    blockWeek: blockWeekInCycle,
  };
  const sandboxInputs = athleteInputsToSandbox(programmeInputs);
  const classification = classifyAthlete(sandboxToClassificationInput(sandboxInputs));
  const ctx = sandboxBuildProgrammeContext(sandboxInputs, classification);
  const schedule = buildSandboxWeeklySchedule(sandboxInputs, ctx, classification);

  return {
    athleteId: athlete.id,
    block: athlete.programmeBlock,
    week: globalWeekForBlock(athlete.programmeBlock, blockWeekInCycle),
    generatedAt: new Date().toISOString(),
    days: schedule.days.map((day) => ({
      ...day,
      sessions: day.sessions.map(blockToCoachDraftSession),
    })),
  };
}

export function generateCoachBlockDraftWeeks(athlete: CoachAthlete): CoachDraftWeek[] {
  const cycles: Array<1 | 2 | 3 | 4> = [1, 2, 3, 4];
  return cycles.map((cycle) => generateCoachDraftWeekForBlockCycle(athlete, cycle));
}

export function generateCoachDraftWeek(athlete: CoachAthlete): CoachDraftWeek {
  const cycle = Math.min(4, Math.max(1, athlete.blockWeek)) as 1 | 2 | 3 | 4;
  return generateCoachDraftWeekForBlockCycle(athlete, cycle);
}

export function parseDurationMinutes(duration: string): number {
  const nums = duration.match(/\d+/g)?.map(Number) ?? [];
  if (nums.length >= 2) return Math.round((nums[0]! + nums[1]!) / 2);
  if (nums.length === 1) return nums[0]!;
  return 45;
}

function sessionVolume(s: CoachDraftSession): CoachSessionVolumeMeta {
  if (s.volumeMeta) return s.volumeMeta;
  return {
    durationMinutes: s.editConfig.durationMinutes ?? parseDurationMinutes(s.duration),
    thresholdMinutes: s.thresholdMinutes ?? s.editConfig.thresholdMinutes ?? 0,
    qualityRunMinutes:
      s.sessionType === "tempo_aerobic_quality" || s.title.toLowerCase().includes("tempo") ? 24 : 0,
    runDistanceKm: 0,
    ergMinutes: 0,
    bikeMinutes: 0,
    strengthMinutes: s.sessionType === "strength" ? 50 : 0,
    stationVolume: 0,
    hardDay: s.isKeySession,
    impactType: "mixed",
    muscularStress: "moderate",
    stationStress: "none",
    isOptionalAddOn: s.isOptional,
  };
}

export function computeWeeklySummary(
  draft: CoachDraftWeek,
  athlete: CoachAthlete
): WeeklySummary {
  let plannedMinutes = 0;
  let thresholdMinutes = 0;
  let qualityRunMinutes = 0;
  let runVolumeKm = 0;
  let ergMinutes = 0;
  let bikeMinutes = 0;
  let strengthMinutes = 0;
  let stationVolume = 0;
  let hardDays = 0;
  let easySupportDays = 0;
  let strengthSessions = 0;
  let hyroxSessions = 0;
  let upperGripTouches = 0;
  let optionalAddOns = 0;
  let doubleSessionDays = 0;
  const stationTouches = new Set<string>();
  const hardDayFlags = new Set<number>();

  draft.days.forEach((day, dayIdx) => {
    if (day.hardDay) hardDays += 1;
    if (!day.hardDay && day.intensity !== "rest") easySupportDays += 1;
    if (day.stationFocus) stationTouches.add(day.stationFocus);
    const slots = new Set(day.sessions.map((s) => s.timeOfDay));
    if (slots.size > 1 && day.sessions.length > 1) doubleSessionDays += 1;

    for (const s of day.sessions) {
      const v = sessionVolume(s);
      plannedMinutes += v.durationMinutes;
      thresholdMinutes += v.thresholdMinutes;
      qualityRunMinutes += v.qualityRunMinutes;
      runVolumeKm += v.runDistanceKm;
      ergMinutes += v.ergMinutes;
      bikeMinutes += v.bikeMinutes;
      strengthMinutes += v.strengthMinutes;
      stationVolume += v.stationVolume;

      if (v.hardDay || v.muscularStress === "high" || v.thresholdMinutes >= 20) {
        hardDayFlags.add(dayIdx);
      }
      if (s.isOptional || v.isOptionalAddOn) optionalAddOns += 1;
      if (s.sessionType === "strength" || v.strengthMinutes > 0) strengthSessions += 1;
      if (s.sessionType === "compromised_running") hyroxSessions += 1;
      if (
        s.sessionId === "hyrox_gym_aerobic_upper_grip" ||
        s.coachLibraryId?.includes("grip") ||
        s.coachLibraryId?.includes("upper") ||
        s.title.toLowerCase().includes("grip") ||
        s.title.toLowerCase().includes("upper")
      ) {
        upperGripTouches += 1;
      }
      if (v.stationStress !== "none" && v.stationStress !== "low") {
        const coach = s.coachLibraryId ? getCoachLibraryEntry(s.coachLibraryId) : null;
        coach?.tags.forEach((t) => {
          if (["wall_ball", "sled", "lunge", "burpee", "carry", "ski", "row"].includes(t)) {
            stationTouches.add(t);
          }
        });
        if (s.emom) stationTouches.add(s.emom.movement);
      }
    }
  });

  const computedHardDays = Math.max(hardDays, hardDayFlags.size);

  return {
    plannedHours: Math.round((plannedMinutes / 60) * 10) / 10,
    availableHours: athlete.weeklyHours,
    runVolumeKm: runVolumeKm > 0 ? Math.round(runVolumeKm * 10) / 10 : athlete.weeklyRunKm,
    thresholdMinutes,
    qualityRunMinutes,
    ergMinutes,
    bikeMinutes,
    strengthMinutes,
    stationVolume,
    hardDays: computedHardDays,
    easySupportDays,
    strengthSessions,
    hyroxSessions,
    optionalAddOns,
    stationWeaknessTouches: [...stationTouches],
    upperGripTouches,
    doubleSessionDays,
  };
}

export function validateCoachDraft(
  draft: CoachDraftWeek,
  athlete: CoachAthlete
): { warnings: ValidationItem[]; positives: ValidationItem[] } {
  const warnings: ValidationItem[] = [];
  const positives: ValidationItem[] = [];
  const summary = computeWeeklySummary(draft, athlete);
  const days = draft.days;
  const dayIndex = (d: string) => days.findIndex((x) => x.day === d);

  const thu = days.find((d) => d.day === "Thu");
  const tue = days.find((d) => d.day === "Tue");
  const sat = days.find((d) => d.day === "Sat");
  const wed = days.find((d) => d.day === "Wed");

  if (thu?.hardDay && tue?.hardDay && dayIndex("Thu") === dayIndex("Tue") + 1) {
    const thuStrength = thu.sessions.some(
      (s) => s.sessionId === "hyrox_strength_heavy_legs" || s.title.includes("Hyrox Legs")
    );
    if (thuStrength) {
      warnings.push({
        id: "leg_before_threshold",
        severity: "warn",
        message: "Hard leg endurance scheduled the day before Tuesday threshold run.",
      });
    }
  }

  const tueIdx = dayIndex("Tue");
  const wedIdx = dayIndex("Wed");
  if (tueIdx >= 0 && wedIdx === tueIdx + 1) {
    const tueTh = tue?.sessions.some((s) => s.thresholdMinutes && s.thresholdMinutes > 0);
    const wedErgTh = wed?.sessions.some(
      (s) =>
        s.sessionId?.includes("threshold") ||
        s.title.toLowerCase().includes("threshold")
    );
    if (tueTh && wedErgTh) {
      warnings.push({
        id: "threshold_then_erg_threshold",
        severity: "warn",
        message: "Threshold run followed by erg threshold next day — high stress stack.",
      });
    }
  }

  for (let i = 0; i < days.length - 1; i++) {
    const today = days[i]!;
    const tomorrow = days[i + 1]!;
    const todayKieranStress = today.sessions.some((s) => {
      const e = s.coachLibraryId ? getCoachLibraryEntry(s.coachLibraryId) : null;
      return e?.sessionStress === "very_high" || e?.tags.includes("very_high_stress");
    });
    const tomorrowHard =
      tomorrow.hardDay ||
      tomorrow.sessions.some((s) => s.isKeySession && (s.thresholdMinutes ?? 0) > 0);
    if (todayKieranStress && tomorrowHard) {
      warnings.push({
        id: `kieran_density_adjacent_${i}`,
        severity: "warn",
        message: `High-density coach staple on ${today.day} before hard work ${tomorrow.day} — check recovery and spacing.`,
      });
      break;
    }
  }

  if (athlete.trainingDays >= 5 && athlete.programmeInputs.saturdayAvailable) {
    const satKey = sat?.sessions.some((s) => s.isKeySession && !s.isOptional);
    if (!satKey) {
      warnings.push({
        id: "saturday_not_key",
        severity: "warn",
        message: "Saturday is not a key session for a 5–6 day athlete — consider Hyrox key work.",
      });
    } else {
      positives.push({
        id: "saturday_key",
        severity: "ok",
        message: "Saturday key session present.",
      });
    }
  }

  const recoveryDay = days.find(
    (d) => d.intensity === "rest" || (!d.hardDay && d.sessions.every((s) => !s.isKeySession))
  );
  const emomOnRecovery = recoveryDay?.sessions.some((s) => s.emom);
  if (emomOnRecovery) {
    warnings.push({
      id: "emom_recovery",
      severity: "warn",
      message: "Station EMOM placed on a recovery-oriented day.",
    });
  }

  const maxThreshold =
    athlete.programmeInputs.abilityLevel === "beginner"
      ? 28
      : athlete.programmeInputs.abilityLevel === "intermediate"
        ? 36
        : 42;
  if (summary.thresholdMinutes > maxThreshold) {
    warnings.push({
      id: "threshold_high",
      severity: "warn",
      message: `Threshold minutes (${summary.thresholdMinutes}) may be high for ${athlete.programmeInputs.abilityLevel} Block ${athlete.programmeBlock}.`,
    });
  } else {
    positives.push({
      id: "threshold_range",
      severity: "ok",
      message: `Threshold minutes (${summary.thresholdMinutes}) within expected range.`,
    });
  }

  if (summary.plannedHours > athlete.weeklyHours + 0.75) {
    warnings.push({
      id: "hours_exceed",
      severity: "error",
      message: `Planned hours (${summary.plannedHours}h) exceed athlete availability (${athlete.weeklyHours}h).`,
    });
  } else if (Math.abs(summary.plannedHours - athlete.weeklyHours) <= 1) {
    positives.push({
      id: "hours_matched",
      severity: "ok",
      message: "Weekly hours closely matched to athlete availability.",
    });
  }

  const hasStrength = days.some((d) =>
    d.sessions.some((s) => s.sessionId === "hyrox_strength_heavy_legs")
  );
  if (!hasStrength && athlete.trainingDays >= 4) {
    warnings.push({
      id: "strength_missing",
      severity: "error",
      message: "Lower strength endurance (Hyrox Legs) missing from the week.",
    });
  } else if (hasStrength) {
    positives.push({
      id: "thursday_strength",
      severity: "ok",
      message: "Thursday lower strength endurance present.",
    });
  }

  const hasTuesdayThreshold = tue?.sessions.some(
    (s) =>
      s.title.toLowerCase().includes("threshold") ||
      s.title.toLowerCase().includes("controlled fast")
  );
  if (!hasTuesdayThreshold && athlete.trainingDays >= 4) {
    warnings.push({
      id: "tuesday_threshold_missing",
      severity: "error",
      message: "Tuesday threshold session missing.",
    });
  } else if (hasTuesdayThreshold) {
    positives.push({
      id: "tuesday_threshold",
      severity: "ok",
      message: "Tuesday threshold protected.",
    });
  }

  if (summary.stationWeaknessTouches.length === 0) {
    warnings.push({
      id: "no_station_exposure",
      severity: "warn",
      message: "No clear station weakness exposure this week.",
    });
  } else {
    positives.push({
      id: "station_addressed",
      severity: "ok",
      message: `Station weakness exposure: ${summary.stationWeaknessTouches.join(", ")}.`,
    });
  }

  if (summary.upperGripTouches === 0 && athlete.trainingDays >= 5) {
    warnings.push({
      id: "no_upper_grip",
      severity: "warn",
      message: "No upper/grip support work across the week.",
    });
  } else if (summary.upperGripTouches > 0) {
    positives.push({
      id: "upper_grip_included",
      severity: "ok",
      message: "Upper/grip work included this week.",
    });
  }

  let consecutiveHard = 0;
  for (const d of days) {
    if (d.hardDay) {
      consecutiveHard += 1;
      if (consecutiveHard >= 3) {
        warnings.push({
          id: "hard_streak",
          severity: "warn",
          message: "Three or more consecutive hard days — check easy/hard rhythm.",
        });
        break;
      }
    } else {
      consecutiveHard = 0;
    }
  }
  if (consecutiveHard < 3 && summary.hardDays <= 3) {
    positives.push({
      id: "rhythm",
      severity: "ok",
      message: "Hard/easy rhythm broadly respected.",
    });
  }

  return { warnings, positives };
}

export function filterSessionLibrary(filter: LibraryFilter): HyroxSessionDefinition[] {
  if (filter === "all") return HYROX_SESSION_LIBRARY;
  return HYROX_SESSION_LIBRARY.filter((s) => {
    const tags = s.tags.join(" ").toLowerCase();
    const name = s.name.toLowerCase();
    const cat = s.category;
    switch (filter) {
      case "run_development":
        return cat === "run_development";
      case "threshold_runs":
        return tags.includes("threshold") || name.includes("threshold");
      case "tempo_aerobic":
        return cat === "tempo_aerobic_quality" || tags.includes("tempo");
      case "strength_endurance":
        return s.id === "hyrox_strength_heavy_legs" || tags.includes("strength_endurance");
      case "hyrox_compromised":
        return cat === "compromised_running";
      case "station_emom":
        return tags.includes("emom") || tags.includes("wall_ball");
      case "erg_intervals":
        return cat === "erg_development" && (tags.includes("threshold") || tags.includes("ski") || tags.includes("row"));
      case "easy_erg":
        return (
          cat === "erg_development" &&
          (tags.includes("z2") || tags.includes("aerobic") || tags.includes("bike"))
        );
      case "upper_grip":
        return (
          s.id === "hyrox_gym_aerobic_upper_grip" ||
          tags.includes("upper") ||
          tags.includes("grip")
        );
      case "testing":
        return cat === "testing" || tags.includes("benchmark");
      case "race_week":
        return tags.includes("race") || name.includes("primer");
      case "coach_staples":
        return false;
      default:
        return true;
    }
  });
}

function coachEntryToPrescription(
  entry: CoachLibraryEntry,
  athlete: CoachAthlete
): ResolvedSessionPrescription {
  const p = entry.prescription;
  return {
    sessionLibraryId: entry.sessionLibraryId,
    name: entry.name,
    category: entry.category,
    subcategory: entry.subcategory,
    objective: p.objective,
    warmup: p.warmup,
    mainSet: p.mainSet,
    cooldown: p.cooldown,
    keySetSummary: p.mainSet[0] ?? entry.name,
    targetPace: p.targetPace ?? null,
    targetSplit: null,
    targetLoad: p.targetLoad ?? null,
    targetHRRange: p.targetHR ?? null,
    fallbackHRGuide: p.targetHR ?? null,
    rpeTarget: p.targetRPE ?? entry.intensityType,
    duration: entry.duration,
    thresholdMinutes: entry.thresholdMinutes,
    qualityRunMinutes: entry.qualityRunMinutes,
    hardDay: entry.hardDay,
    hardDayReason: entry.hardDayReason,
    whatToRecord: p.whatToRecord,
    coachNote: p.coachNote,
    safetyNote: p.safetyNote ?? "",
    progressionNote: p.progression ?? "",
    filmPrompt: entry.tags.includes("film") ? "Film key station sets" : null,
    equipmentRequired: entry.equipmentRequired,
    progressionLabel: entry.progressionOptions?.[0] ?? "",
    variantSummary: entry.level,
  };
}

function buildSessionFromCoachEntry(
  athlete: CoachAthlete,
  entry: CoachLibraryEntry,
  timeOfDay: SandboxTimeOfDay
): CoachDraftSession {
  const hyroxLib = getHyroxSession(entry.sessionLibraryId);
  let prescription: ResolvedSessionPrescription | null = coachEntryToPrescription(entry, athlete);

  if (hyroxLib && !entry.sessionLibraryId.startsWith("coach_")) {
    const resolved = resolveSessionPrescription({
      sessionId: entry.sessionLibraryId,
      abilityLevel: athlete.programmeInputs.abilityLevel,
      programmeBlock: athlete.programmeInputs.programmeBlock,
      blockWeek: athlete.programmeInputs.blockWeek,
      fiveKm: athlete.programmeInputs.fiveKm,
      tenKm: athlete.programmeInputs.tenKm || null,
      maxHeartRate: athlete.programmeInputs.maxHeartRate,
      thresholdHeartRate: athlete.programmeInputs.thresholdHeartRate,
      stationWeaknesses: athlete.programmeInputs
        .stationWeaknesses as import("@/src/lib/hyrox/types").StationWeakness[],
      equipment: athlete.programmeInputs.equipment,
      recoveryStatus: athlete.programmeInputs.recoveryStatus,
      weeklyTrainingHours: athlete.programmeInputs.weeklyTrainingHours,
    });
    prescription = {
      ...resolved,
      name: entry.name,
      thresholdMinutes: entry.thresholdMinutes ?? resolved.thresholdMinutes,
      qualityRunMinutes: entry.qualityRunMinutes ?? resolved.qualityRunMinutes,
      mainSet: entry.prescription.mainSet.length > 0 ? entry.prescription.mainSet : resolved.mainSet,
      warmup: entry.prescription.warmup.length > 0 ? entry.prescription.warmup : resolved.warmup,
      cooldown: entry.prescription.cooldown.length > 0 ? entry.prescription.cooldown : resolved.cooldown,
      objective: entry.prescription.objective || resolved.objective,
      whatToRecord:
        entry.prescription.whatToRecord.length > 0 ? entry.prescription.whatToRecord : resolved.whatToRecord,
      coachNote: entry.prescription.coachNote || resolved.coachNote,
      safetyNote: entry.prescription.safetyNote || resolved.safetyNote,
    };
  }

  const badges: SandboxSessionBlock["badges"] = [
    ...(timeOfDay === "AM" ? (["AM"] as const) : timeOfDay === "PM" ? (["PM"] as const) : (["Main"] as const)),
  ];
  if (entry.hardDay || entry.isStaple) badges.push("Key Session");
  if (entry.isOptionalAddOn || timeOfDay === "Optional") badges.push("Optional Add-On");

  const volumeMeta = volumeMetaFromEntry(entry);

  const draft: CoachDraftSession = {
    draftId: nextDraftId(),
    timeOfDay,
    badges,
    title: entry.name,
    sessionType: categoryToSessionType(entry.category),
    duration: entry.duration,
    intensity: prescription.rpeTarget,
    rpeHr: prescription.targetHRRange
      ? `${prescription.rpeTarget} · ${prescription.targetHRRange}`
      : prescription.rpeTarget,
    isKeySession: entry.hardDay || entry.isStaple === true,
    isOptional: entry.isOptionalAddOn === true || timeOfDay === "Optional",
    rationale: entry.prescription.objective,
    sessionId: entry.sessionLibraryId,
    coachLibraryId: entry.id,
    prescription,
    sessionDetail: null,
    thresholdMinutes: volumeMeta.thresholdMinutes,
    volumeMeta,
    emom: null,
    coachNote: entry.prescription.coachNote,
    editConfig: { kind: "generic", sessionName: entry.name },
  };
  draft.editConfig = defaultEditConfig(draft);
  return draft;
}

export function sessionFromLibrary(
  athlete: CoachAthlete,
  sessionId: string,
  timeOfDay: SandboxTimeOfDay = "Main"
): CoachDraftSession | null {
  const coachEntry = getCoachLibraryEntry(sessionId);
  if (coachEntry) {
    return buildSessionFromCoachEntry(athlete, coachEntry, timeOfDay);
  }

  const lib = getHyroxSession(sessionId);
  if (!lib) return null;
  const sandboxInputs = athleteInputsToSandbox(athlete.programmeInputs);
  const prescription = resolveSessionPrescription({
    sessionId,
    abilityLevel: athlete.programmeInputs.abilityLevel,
    programmeBlock: athlete.programmeInputs.programmeBlock,
    blockWeek: athlete.programmeInputs.blockWeek,
    fiveKm: athlete.programmeInputs.fiveKm,
    tenKm: athlete.programmeInputs.tenKm || null,
    maxHeartRate: athlete.programmeInputs.maxHeartRate,
    thresholdHeartRate: athlete.programmeInputs.thresholdHeartRate,
    stationWeaknesses: athlete.programmeInputs.stationWeaknesses as import("@/src/lib/hyrox/types").StationWeakness[],
    equipment: athlete.programmeInputs.equipment,
    recoveryStatus: athlete.programmeInputs.recoveryStatus,
    weeklyTrainingHours: athlete.programmeInputs.weeklyTrainingHours,
  });

  const badges: SandboxSessionBlock["badges"] = [
    ...(timeOfDay === "AM" ? (["AM"] as const) : timeOfDay === "PM" ? (["PM"] as const) : (["Main"] as const)),
  ];
  if (lib.scheduling?.hardDay) badges.push("Key Session");

  const draft: CoachDraftSession = {
    draftId: nextDraftId(),
    timeOfDay,
    badges,
    title: prescription.name,
    sessionType: lib.category,
    duration: prescription.duration,
    intensity: prescription.rpeTarget,
    rpeHr: prescription.targetHRRange
      ? `${prescription.rpeTarget} · ${prescription.targetHRRange}`
      : prescription.rpeTarget,
    isKeySession: lib.scheduling?.hardDay ?? false,
    isOptional: timeOfDay === "Optional" || timeOfDay === "AM",
    rationale: lib.prescriptionRationale ?? lib.objective,
    sessionId,
    prescription,
    sessionDetail: null,
    thresholdMinutes: prescription.thresholdMinutes,
    emom: null,
    coachNote: "",
    editConfig: { kind: "generic", sessionName: prescription.name },
  };
  draft.editConfig = defaultEditConfig(draft);
  draft.volumeMeta = {
    durationMinutes: parseDurationMinutes(draft.duration),
    thresholdMinutes: draft.thresholdMinutes ?? 0,
    qualityRunMinutes: prescription.qualityRunMinutes ?? 0,
    runDistanceKm: 0,
    ergMinutes: 0,
    bikeMinutes: 0,
    strengthMinutes: lib.category === "strength" ? 50 : 0,
    stationVolume: 0,
    hardDay: draft.isKeySession,
    impactType: "mixed",
    muscularStress: "moderate",
    stationStress: "none",
    isOptionalAddOn: draft.isOptional,
  };
  return draft;
}

export function duplicateAsOptional(session: CoachDraftSession): CoachDraftSession {
  return {
    ...session,
    draftId: nextDraftId(),
    timeOfDay: "Optional",
    isOptional: true,
    badges: ["Optional Add-On"],
    editConfig: { ...session.editConfig, sessionName: `${session.editConfig.sessionName} (copy)` },
    volumeMeta: session.volumeMeta
      ? { ...session.volumeMeta, isOptionalAddOn: true }
      : session.volumeMeta,
  };
}

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export type WeekdayName = (typeof WEEKDAYS)[number];

export const TIME_OF_DAY_OPTIONS: SandboxTimeOfDay[] = ["AM", "Main", "PM", "Optional"];
