import type { BlockWeekInCycle } from "./types";

export const THRESHOLD_HR_RPE_NOTE =
  "Pace is a target. HR/RPE controls the session. If HR drifts above threshold, slow slightly and keep the stimulus correct. Increase pace only when HR/RPE efficiency improves at the current pace — not every block by default.";

export type ProgrammeBlockNumber = 1 | 2 | 3;

type ThresholdWeekSpec = {
  reps: number;
  repDurationMinutes: number;
  recovery: string;
  thresholdMinutes: number;
  paceNote: string;
  coachNote: string;
  /** Library template for equipment / category metadata */
  sessionLibraryId: string;
  useControlledFastLabel?: boolean;
};

export type ThresholdSessionForWeek = {
  name: string;
  reps: number;
  repDurationMinutes: number;
  recovery: string;
  thresholdMinutes: number;
  mainSet: string;
  block: ProgrammeBlockNumber;
  week: BlockWeekInCycle;
  progressionLabel: string;
  paceNote: string;
  coachNote: string;
  sessionLibraryId: string;
};

const BLOCK_1: Record<BlockWeekInCycle, ThresholdWeekSpec> = {
  1: {
    reps: 5,
    repDurationMinutes: 5,
    recovery: "90 sec",
    thresholdMinutes: 25,
    paceNote: "Block 1 Week 1 — establish HR/RPE discipline at prescribed pace",
    coachNote: "Foundation week — efficiency at pace before adding speed or volume.",
    sessionLibraryId: "hyrox_run_threshold_6x6",
  },
  2: {
    reps: 6,
    repDurationMinutes: 5,
    recovery: "75–90 sec",
    thresholdMinutes: 30,
    paceNote: "Progress total threshold time; hold pace if HR drifts",
    coachNote: "Block 1 Week 2 — add one rep; keep threshold HR/RPE.",
    sessionLibraryId: "hyrox_run_threshold_6x6",
  },
  3: {
    reps: 6,
    repDurationMinutes: 6,
    recovery: "60–75 sec",
    thresholdMinutes: 36,
    paceNote: "Longer reps, shorter rest — still threshold HR/RPE",
    coachNote: "Block 1 Week 3 — duration and density before pace increases.",
    sessionLibraryId: "hyrox_run_threshold_6x6",
  },
  4: {
    reps: 4,
    repDurationMinutes: 5,
    recovery: "90 sec",
    thresholdMinutes: 20,
    paceNote: "Week 4 deload — reduce volume, maintain rhythm",
    coachNote: "Block 1 deload — same intent, less total threshold time.",
    sessionLibraryId: "hyrox_run_threshold_3x10",
  },
};

const BLOCK_2: Record<BlockWeekInCycle, ThresholdWeekSpec> = {
  1: {
    reps: 3,
    repDurationMinutes: 8,
    recovery: "2 min",
    thresholdMinutes: 24,
    paceNote: "Block 2 — longer duration reps; reduce rest before pace increases",
    coachNote: "Block 2 Week 1 — sustained threshold blocks.",
    sessionLibraryId: "hyrox_run_threshold_3x10",
  },
  2: {
    reps: 3,
    repDurationMinutes: 10,
    recovery: "90 sec",
    thresholdMinutes: 30,
    paceNote: "Hold threshold HR/RPE — do not chase faster splits",
    coachNote: "Block 2 Week 2 — 3×10 min threshold.",
    sessionLibraryId: "hyrox_run_threshold_3x10",
  },
  3: {
    reps: 2,
    repDurationMinutes: 15,
    recovery: "90 sec",
    thresholdMinutes: 30,
    paceNote: "Sustained threshold blocks — efficiency first",
    coachNote: "Block 2 Week 3 — 2×15 min threshold.",
    sessionLibraryId: "hyrox_run_threshold_3x10",
  },
  4: {
    reps: 2,
    repDurationMinutes: 10,
    recovery: "90 sec",
    thresholdMinutes: 20,
    paceNote: "Block 2 week 4 deload",
    coachNote: "Deload — 2×10 min or 4×5 min controlled if fatigued.",
    sessionLibraryId: "hyrox_run_threshold_3x10",
  },
};

const BLOCK_3: Record<BlockWeekInCycle, ThresholdWeekSpec> = {
  1: {
    reps: 8,
    repDurationMinutes: 3,
    recovery: "90 sec",
    thresholdMinutes: 24,
    paceNote: "Block 3 — controlled fast only if HR/RPE stays controlled",
    coachNote: "Block 3 Week 1 — 5km pace / controlled fast intervals.",
    sessionLibraryId: "hyrox_run_5k_pace_8x3",
    useControlledFastLabel: true,
  },
  2: {
    reps: 9,
    repDurationMinutes: 3,
    recovery: "75 sec",
    thresholdMinutes: 27,
    paceNote: "Maintain quality — Saturday carries Hyrox-specific overload",
    coachNote: "Block 3 Week 2 — 9×3 min controlled fast.",
    sessionLibraryId: "hyrox_run_5k_pace_8x3",
    useControlledFastLabel: true,
  },
  3: {
    reps: 8,
    repDurationMinutes: 3,
    recovery: "60 sec",
    thresholdMinutes: 27,
    paceNote: "Tuesday maintenance threshold; race-specific work on Saturday",
    coachNote: "Block 3 Week 3 — maintain; Sat key station overload.",
    sessionLibraryId: "hyrox_run_5k_pace_8x3",
    useControlledFastLabel: true,
  },
  4: {
    reps: 3,
    repDurationMinutes: 10,
    recovery: "90 sec",
    thresholdMinutes: 15,
    paceNote: "Taper — sharpness only, no new threshold PRs",
    coachNote: "Race week primer — reduced volume.",
    sessionLibraryId: "hyrox_run_threshold_3x10",
  },
};

function specTable(block: ProgrammeBlockNumber): Record<BlockWeekInCycle, ThresholdWeekSpec> {
  if (block === 1) return BLOCK_1;
  if (block === 2) return BLOCK_2;
  return BLOCK_3;
}

function buildName(spec: ThresholdWeekSpec): string {
  if (spec.useControlledFastLabel) {
    return `Controlled Fast Run — ${spec.reps} x ${spec.repDurationMinutes} Minutes`;
  }
  return `Threshold Run — ${spec.reps} x ${spec.repDurationMinutes} Minutes`;
}

function buildMainSet(spec: ThresholdWeekSpec): string {
  if (spec.useControlledFastLabel) {
    return `${spec.reps} x ${spec.repDurationMinutes} min @ 5km pace / controlled fast · ${spec.recovery} recovery`;
  }
  return `${spec.reps} x ${spec.repDurationMinutes} min @ controlled threshold · ${spec.recovery} recovery`;
}

/** Single source of truth for Tuesday threshold — title, main set, minutes, metadata. */
export function getThresholdSessionForWeek(
  block: ProgrammeBlockNumber,
  week: BlockWeekInCycle
): ThresholdSessionForWeek {
  const spec = specTable(block)[week];
  return {
    name: buildName(spec),
    reps: spec.reps,
    repDurationMinutes: spec.repDurationMinutes,
    recovery: spec.recovery,
    thresholdMinutes: spec.thresholdMinutes,
    mainSet: buildMainSet(spec),
    block,
    week,
    progressionLabel: `Block ${block} Week ${week}`,
    paceNote: spec.paceNote,
    coachNote: spec.coachNote,
    sessionLibraryId: spec.sessionLibraryId,
  };
}

/** @deprecated Use getThresholdSessionForWeek — returns library id only */
export function getThresholdBlockProgression(
  programmeBlock: ProgrammeBlockNumber,
  blockWeek: BlockWeekInCycle
) {
  const s = getThresholdSessionForWeek(programmeBlock, blockWeek);
  return {
    block: programmeBlock,
    blockWeek,
    label: s.mainSet,
    thresholdMinutes: s.thresholdMinutes,
    sessionId: s.sessionLibraryId,
    paceNote: s.paceNote,
  };
}

export function getTuesdayThresholdSessionId(
  programmeBlock: ProgrammeBlockNumber,
  blockWeek: BlockWeekInCycle
): string {
  return getThresholdSessionForWeek(programmeBlock, blockWeek).sessionLibraryId;
}

export function isTempoSessionId(sessionId: string | null | undefined): boolean {
  return sessionId === "hyrox_run_tempo_hm";
}

export function isAboveThresholdAddOn(text: string | null | undefined): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return (
    lower.includes("threshold") ||
    lower.includes("tempo") ||
    lower.includes("interval") ||
    lower.includes("5k pace") ||
    lower.includes("station overload") ||
    lower.includes("hard emom")
  );
}

/** Thursday AM tempo optional add-on — never replaces strength slot */
export function shouldScheduleThursdayAmTempo(options: {
  trainingDaysAvailable: number;
  doubleSessionReadiness?: string;
  recoveryStatus?: string;
  weeklyTrainingHours?: number;
}): boolean {
  if (options.trainingDaysAvailable < 5) return false;
  if (options.doubleSessionReadiness === "not_ready" || !options.doubleSessionReadiness) return false;
  if (options.recoveryStatus === "poor") return false;
  if ((options.weeklyTrainingHours ?? 0) < 5) return false;
  return true;
}

export type TempoSessionDisplay = {
  name: string;
  mainSet: string;
  duration: string;
  intensity: string;
  progressionLabel: string;
};

export function getTempoSessionDisplay(blockWeek: BlockWeekInCycle): TempoSessionDisplay {
  const sets =
    blockWeek === 1
      ? "3 x 8–10 min @ estimated HM effort · 90s jog"
      : blockWeek === 2
        ? "3 x 10 min @ HM · 75s rest"
        : blockWeek === 3
          ? "25–30 min controlled tempo below threshold"
          : "20 min steady aerobic quality (deload)";
  return {
    name: "Tempo Run — Aerobic Quality",
    mainSet: sets,
    duration: "45–55 min",
    intensity: "RPE 6–7 · below threshold unless HR drifts",
    progressionLabel: `Block tempo layer · Week ${blockWeek}`,
  };
}
