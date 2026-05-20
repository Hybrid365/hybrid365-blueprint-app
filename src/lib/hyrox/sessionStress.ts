import type { DaySlotRole, SessionSchedulingMetadata } from "./types";

/** Default stress metadata by session id — used for hard/easy, threshold tracking, placement. */
export const SESSION_SCHEDULING_METADATA: Record<string, SessionSchedulingMetadata> = {
  hyrox_run_easy: {
    hardDay: false,
    intensityType: "easy",
    impactType: "run",
    muscularStress: "low",
    estimatedDurationMinutes: 45,
    paceTargetType: "easy",
  },
  hyrox_run_long_easy: {
    hardDay: false,
    intensityType: "easy",
    impactType: "run",
    muscularStress: "low",
    estimatedDurationMinutes: 70,
    paceTargetType: "easy",
  },
  hyrox_run_threshold_6x6: {
    hardDay: true,
    hardDayReason: "Threshold run intervals",
    intensityType: "threshold",
    thresholdMinutes: 30,
    thresholdModality: "run",
    impactType: "run",
    muscularStress: "moderate",
    sessionStress: "high",
    estimatedDurationMinutes: 65,
    paceTargetType: "threshold",
    avoidDayAfter: ["erg_threshold", "hard_run"],
    avoidDayBefore: ["strength_lower"],
  },
  hyrox_run_threshold_3x10: {
    hardDay: true,
    intensityType: "threshold",
    thresholdMinutes: 30,
    thresholdModality: "run",
    impactType: "run",
    muscularStress: "moderate",
    estimatedDurationMinutes: 55,
    paceTargetType: "threshold",
    avoidDayBefore: ["strength_lower"],
  },
  hyrox_run_tempo_hm: {
    hardDay: true,
    hardDayReason: "Tempo / aerobic quality — not full threshold unless HR drifts",
    intensityType: "tempo",
    qualityRunMinutes: 30,
    impactType: "run",
    muscularStress: "moderate",
    estimatedDurationMinutes: 55,
    paceTargetType: "HM",
  },
  hyrox_run_5k_pace_8x3: {
    hardDay: true,
    intensityType: "quality",
    qualityRunMinutes: 24,
    fastRunMinutes: 24,
    impactType: "run",
    muscularStress: "moderate",
    sessionStress: "high",
    paceTargetType: "5k",
    preferredDay: ["Sat"],
  },
  hyrox_erg_ski_threshold_8x4: {
    hardDay: true,
    hardDayReason: "Erg threshold counts as hard day",
    intensityType: "threshold",
    thresholdMinutes: 32,
    thresholdModality: "ski",
    impactType: "erg",
    muscularStress: "moderate",
    estimatedDurationMinutes: 50,
    avoidDayAfter: ["hard_run", "erg_threshold"],
    avoidDayBefore: ["hard_run"],
  },
  hyrox_erg_row_threshold_8x4: {
    hardDay: true,
    intensityType: "threshold",
    thresholdMinutes: 32,
    thresholdModality: "row",
    impactType: "erg",
    muscularStress: "moderate",
    estimatedDurationMinutes: 50,
    avoidDayAfter: ["hard_run", "erg_threshold"],
    avoidDayBefore: ["hard_run"],
  },
  hyrox_erg_bike_z2: {
    hardDay: false,
    intensityType: "easy",
    impactType: "bike",
    muscularStress: "low",
    estimatedDurationMinutes: 45,
    emomAttachRoles: ["gym_aerobic_upper"],
  },
  hyrox_erg_mixed_aerobic: {
    hardDay: false,
    intensityType: "easy",
    impactType: "erg",
    muscularStress: "low",
    estimatedDurationMinutes: 50,
    emomAttachRoles: ["gym_aerobic_upper"],
  },
  hyrox_erg_mixed_recovery: {
    hardDay: false,
    intensityType: "easy",
    impactType: "erg",
    muscularStress: "low",
    estimatedDurationMinutes: 40,
  },
  hyrox_strength_heavy_legs: {
    hardDay: true,
    hardDayReason: "Lower-body strength endurance — muscular damage risk",
    intensityType: "steady",
    impactType: "none",
    muscularStress: "high",
    sessionStress: "high",
    estimatedDurationMinutes: 55,
    avoidDayBefore: ["hard_run"],
    avoidDayAfter: ["hard_run"],
    emomAttachRoles: ["strength_lower"],
  },
  hyrox_strength_lower_sled: {
    hardDay: true,
    hardDayReason: "Sled-heavy lower session",
    muscularStress: "high",
    impactType: "none",
    sessionStress: "high",
    estimatedDurationMinutes: 55,
    avoidDayBefore: ["hard_run"],
    avoidDayAfter: ["hard_run"],
    emomAttachRoles: ["strength_lower"],
  },
  hyrox_strength_upper_emom: {
    hardDay: false,
    intensityType: "steady",
    muscularStress: "moderate",
    sessionStress: "low",
    impactType: "none",
    estimatedDurationMinutes: 45,
    emomAttachRoles: ["strength_upper", "gym_aerobic_upper"],
  },
  hyrox_gym_aerobic_upper_grip: {
    hardDay: false,
    intensityType: "easy",
    impactType: "bike",
    muscularStress: "low",
    estimatedDurationMinutes: 60,
    emomAttachRoles: ["gym_aerobic_upper"],
  },
  hyrox_compromised_mini_test: {
    hardDay: true,
    intensityType: "race_pace",
    impactType: "mixed",
    muscularStress: "high",
    sessionStress: "high",
    compromisedRunVolumeM: 2400,
    estimatedDurationMinutes: 50,
    preferredDay: ["Sat"],
    emomAttachRoles: ["compromised_hybrid"],
  },
  hyrox_compromised_run_wallballs: {
    hardDay: true,
    intensityType: "race_pace",
    impactType: "mixed",
    muscularStress: "high",
    sessionStress: "high",
    compromisedRunVolumeM: 3000,
    stationStress: ["wall_balls"],
    preferredDay: ["Sat"],
    emomAttachRoles: ["compromised_hybrid", "strength_lower"],
  },
  hyrox_compromised_sled_burpee: {
    hardDay: true,
    impactType: "mixed",
    muscularStress: "high",
    sessionStress: "high",
    compromisedRunVolumeM: 2800,
    preferredDay: ["Sat"],
    emomAttachRoles: ["compromised_hybrid"],
  },
  hyrox_compromised_threshold_run_station_overload: {
    hardDay: true,
    hardDayReason: "Saturday key — threshold run into station overload",
    intensityType: "threshold",
    thresholdMinutes: 27,
    qualityRunMinutes: 27,
    fastRunMinutes: 27,
    thresholdModality: "run",
    impactType: "mixed",
    muscularStress: "high",
    sessionStress: "high",
    compromisedRunVolumeM: 3000,
    stationOverloadMinutes: 6,
    estimatedDurationMinutes: 60,
    paceTargetType: "5k",
    preferredDay: ["Sat"],
    emomAttachRoles: ["compromised_hybrid"],
  },
};

export function getSessionSchedulingMetadata(
  sessionId: string,
  overrides?: Partial<SessionSchedulingMetadata>
): SessionSchedulingMetadata {
  const base = SESSION_SCHEDULING_METADATA[sessionId] ?? {
    hardDay: false,
    muscularStress: "low" as const,
    estimatedDurationMinutes: 50,
  };
  return { ...base, ...overrides };
}

export function isRoleInherentlyHard(role: DaySlotRole): boolean {
  return (
    role === "hard_run" ||
    role === "erg_threshold" ||
    role === "compromised_hybrid" ||
    role === "strength_lower" ||
    role === "testing" ||
    role === "tempo_aerobic"
  );
}

export function deloadThresholdMinutes(minutes: number, blockWeek: number): number {
  if (blockWeek !== 4) return minutes;
  return Math.round(minutes * 0.7);
}
