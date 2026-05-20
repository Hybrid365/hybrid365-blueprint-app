/**
 * Assessment → structured athlete profile mapping (Hybrid365 Hyrox coach layer).
 */

import { classifyAthlete, type AthleteClassificationInput } from "@/src/lib/hyrox/athleteClassification";
import { parseTimeToSeconds } from "@/src/lib/hyrox/paceCalculator";
import { calculatePaceZones } from "@/src/lib/hyrox/paceCalculator";
import type {
  DoubleSessionReadiness,
  HyroxAbilityLevel,
  RaceTimelinePhase,
  RecoveryStatus,
  StationWeakness,
} from "@/src/lib/hyrox/types";
import type { CoachAthlete } from "@/app/lib/hyroxCoachMockAthletes";
import type {
  HyroxAssessmentInput,
  HyroxAthleteProfile,
  HyroxCoachReviewFlag,
  HyroxProgrammePriority,
  HyroxAthleteProfileStatus,
  ProfileReviewOverrides,
} from "@/app/lib/hyroxAthleteProfileTypes";

function weeksToRacePhase(weeks: number): RaceTimelinePhase {
  if (weeks <= 1) return "race_week";
  if (weeks <= 4) return "near";
  if (weeks <= 12) return "mid";
  return "far";
}

export function classifyAthleteLevel(assessment: HyroxAssessmentInput): HyroxAbilityLevel {
  const fiveSec = parseTimeToSeconds(assessment.fiveKmTime);
  const exp = assessment.experienceHyrox;
  const strength = assessment.strengthSelfRating;
  if (exp === "none" && fiveSec != null && fiveSec > 28 * 60) return "beginner";
  if (exp === "competitive" && fiveSec != null && fiveSec < 20 * 60) return "pro";
  if (fiveSec != null && fiveSec < 22 * 60 && strength === "high") return "advanced";
  if (fiveSec != null && fiveSec < 24 * 60) return "intermediate";
  return "intermediate";
}

export function identifyMainLimiter(assessment: HyroxAssessmentInput): string {
  const w = assessment.stationWeaknesses.filter((x) => x !== "none_significant");
  if (w.length === 0) return "Balanced — prioritise engine";
  const primary: StationWeakness = w[0]!;
  const map: Partial<Record<StationWeakness, string>> = {
    wall_balls: "Wall balls",
    wall_ball: "Wall balls",
    sled: "Sled",
    sled_push_pull: "Sled",
    ski: "Ski",
    row: "Row",
    lunges: "Lunges",
    burpees: "Burpees",
    farmers_carry: "Farmers carry",
    carry: "Carries",
    running_under_fatigue: "Compromised running",
  };
  return map[primary] ?? "Stations";
}

export function identifySecondaryLimiter(assessment: HyroxAssessmentInput): string {
  const w = assessment.stationWeaknesses.filter((x) => x !== "none_significant");
  if (w.length < 2) {
    const fiveSec = parseTimeToSeconds(assessment.fiveKmTime);
    if (fiveSec != null && fiveSec > 26 * 60) return "Running engine";
    return "Accessory stations";
  }
  const second = w[1]!;
  const labels: Partial<Record<StationWeakness, string>> = {
    wall_balls: "Wall balls",
    sled: "Sled",
    ski: "Ski",
    row: "Row",
    lunges: "Lunges",
    burpees: "Burpees",
  };
  return labels[second] ?? "Secondary station work";
}

export function calculateRecoveryRisk(assessment: HyroxAssessmentInput): "low" | "moderate" | "high" {
  if (assessment.sleepQuality === "poor" && assessment.stressLevel === "high") return "high";
  if (assessment.sleepQuality === "poor" || assessment.stressLevel === "high") return "moderate";
  if (assessment.injuryFlags.some((i) => i.toLowerCase().includes("acute"))) return "high";
  return "low";
}

export function determineDoubleSessionReadiness(
  assessment: HyroxAssessmentInput,
  level: HyroxAbilityLevel
): DoubleSessionReadiness {
  if (calculateRecoveryRisk(assessment) === "high") return "not_ready";
  if (assessment.weeklyTrainingHoursTarget < 6) return "not_ready";
  if (assessment.trainingDaysPreference.length < 5) return "aerobic_double_only";
  if (level === "beginner") return "aerobic_double_only";
  if (level === "advanced" || level === "pro") return "threshold_run_plus_erg_threshold";
  return "threshold_run_plus_easy_aerobic";
}

export function determineEquipmentSpecificity(assessment: HyroxAssessmentInput): string {
  const eq = assessment.equipmentAvailable;
  const have = [
    eq.track && "track",
    eq.sled && "sled",
    eq.skiErg && "ski",
    eq.rowErg && "row",
    eq.wallBalls && "wall balls",
  ].filter(Boolean);
  if (have.length >= 4) return "Full Hyrox toolkit — high session specificity";
  if (!eq.sled && !eq.wallBalls)
    return "Limited station equipment — bias to ergs, gym strength and run-driven work";
  return `Equipment: ${have.join(", ") || "minimal"}${assessment.equipmentLimitations ? ` · ${assessment.equipmentLimitations}` : ""}`;
}

export function determineFirstBlockFocus(profile: HyroxAthleteProfile): string {
  const lim = profile.mainLimiter;
  if (profile.recoveryRisk === "high") {
    return "Block 1: aerobic base, load tolerance, conservative progressions — recovery-led volume";
  }
  return `Block 1: aerobic base, load tolerance, Tuesday threshold foundation, Thursday lower strength endurance, and ${lim.toLowerCase()} density in key sessions.`;
}

export function buildKeyProgrammePriorities(profile: HyroxAthleteProfile): HyroxProgrammePriority[] {
  const out: HyroxProgrammePriority[] = [];
  out.push({ label: "Tuesday threshold run (engine anchor)", kind: "threshold" });
  out.push({ label: "Thursday lower strength endurance — Hyrox legs", kind: "strength" });
  out.push({ label: "Saturday Hyrox key session / overload", kind: "station" });
  const wb =
    profile.stationWeaknesses.includes("wall_balls") ||
    profile.stationWeaknesses.includes("wall_ball");
  if (wb) out.push({ label: "Wall ball EMOM / density add-on", kind: "station" });
  const sled = profile.stationWeaknesses.some((s) => s === "sled" || s === "sled_push_pull");
  if (sled) out.push({ label: "Sled exposure in strength + compromised", kind: "station" });
  out.push({ label: "Easy gym aerobic + upper/grip support day", kind: "engine" });
  if (profile.recoveryRisk !== "low") out.push({ label: "Recovery guardrails — cap hard stack", kind: "recovery" });
  return out.slice(0, 6);
}

export function buildCoachReviewFlags(profile: HyroxAthleteProfile): HyroxCoachReviewFlag[] {
  const flags: HyroxCoachReviewFlag[] = [];
  if (profile.sleepQuality === "poor" || profile.recoveryRisk !== "low") {
    flags.push({
      id: "recovery",
      severity: "warn",
      label: "Poor sleep / recovery",
      detail: "Monitor load — cap threshold stack and prioritise rhythm over volume.",
    });
  }
  const eqText = profile.equipmentAccess.join(" ").toLowerCase();
  if (!eqText.includes("sled") || !eqText.includes("wall")) {
    flags.push({
      id: "equipment",
      severity: "warn",
      label: "Limited equipment",
      detail: "Reduced station specificity — rotate gym alternatives and run-led work.",
    });
  }
  if (profile.currentWeeklyRunVolumeKm < 20 && profile.abilityLevel !== "beginner") {
    flags.push({
      id: "run_vol",
      severity: "warn",
      label: "Low run volume",
      detail: "Build weekly run km gradually to support Hyrox running demands.",
    });
  }
  const weak = profile.stationWeaknesses.filter((w) => w !== "none_significant");
  if (weak.length >= 3) {
    flags.push({
      id: "multi_station",
      severity: "info",
      label: "Multiple station weaknesses",
      detail: "Rotate primary focus across the block — avoid doubling stress same week.",
    });
  }
  if (profile.injuryFlags.length > 0) {
    flags.push({
      id: "injury",
      severity: "warn",
      label: "Injury / niggle",
      detail: "Avoid aggressive run progression until moving pain-free.",
    });
  }
  return flags;
}

export function buildPaceZonesFromAssessment(
  profile: Pick<HyroxAthleteProfile, "fiveKmTime" | "tenKmTime" | "abilityLevel">
): HyroxAthleteProfile["estimatedPaceZones"] {
  return calculatePaceZones(profile.fiveKmTime, profile.tenKmTime || null);
}

export function mapAssessmentToAthleteProfile(
  assessment: HyroxAssessmentInput,
  status: HyroxAthleteProfileStatus = "profile_mapped"
): HyroxAthleteProfile {
  const level = classifyAthleteLevel(assessment);
  const main = identifyMainLimiter(assessment);
  const secondary = identifySecondaryLimiter(assessment);
  const recoveryRisk = calculateRecoveryRisk(assessment);
  const doubleReady = determineDoubleSessionReadiness(assessment, level);

  const weeksToRace = Math.max(
    0,
    Math.ceil(
      (new Date(assessment.raceDate).getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000)
    )
  );
  const raceTimelineWeeks = Number.isFinite(weeksToRace) ? weeksToRace : 16;
  const phase = weeksToRacePhase(raceTimelineWeeks);

  const trainingDays = Math.min(
    7,
    Math.max(3, assessment.trainingDaysPreference.length || 4)
  );

  const sleep: "good" | "average" | "poor" =
    assessment.sleepQuality === "good"
      ? "good"
      : assessment.sleepQuality === "average"
        ? "average"
        : "poor";

  const recoveryForClassify: RecoveryStatus =
    sleep === "poor" ? "poor" : sleep === "average" ? "moderate" : "good";

  const classificationInput: AthleteClassificationInput = {
    experienceLevel:
      assessment.experienceHyrox === "none"
        ? "new"
        : assessment.experienceHyrox === "competitive"
          ? "competitive"
          : "experienced",
    abilityLevel: level,
    fiveKmSeconds: parseTimeToSeconds(assessment.fiveKmTime),
    tenKmSeconds: assessment.tenKmTime ? parseTimeToSeconds(assessment.tenKmTime) : null,
    weeklyRunKm: assessment.currentWeeklyRunVolumeKm,
    strengthLevel:
      assessment.strengthSelfRating === "low"
        ? "low"
        : assessment.strengthSelfRating === "high"
          ? "high"
          : "moderate",
    stationWeaknesses: assessment.stationWeaknesses,
    recoveryProfile: recoveryForClassify,
    weeksToRace: raceTimelineWeeks,
  };

  const classified = classifyAthlete(classificationInput);

  const equipmentAccess: string[] = [];
  const e = assessment.equipmentAvailable;
  if (e.treadmill) equipmentAccess.push("Treadmill");
  if (e.track) equipmentAccess.push("Track");
  if (e.skiErg) equipmentAccess.push("SkiErg");
  if (e.rowErg) equipmentAccess.push("RowErg");
  if (e.bike) equipmentAccess.push("Bike");
  if (e.sled) equipmentAccess.push("Sled");
  if (e.wallBalls) equipmentAccess.push("Wall balls");
  if (e.farmersHandles) equipmentAccess.push("Farmers handles");
  if (e.sandbag) equipmentAccess.push("Sandbag");
  if (e.fullGym) equipmentAccess.push("Full gym");

  const base: HyroxAthleteProfile = {
    athleteId: assessment.athleteId,
    name: assessment.name,
    email: assessment.email,
    status,
    raceName: assessment.raceName,
    raceDate: assessment.raceDate,
    raceCategory: assessment.raceCategory,
    targetTime: assessment.targetTimeBand,
    raceTimelineWeeks,
    raceTimelinePhase: phase,
    trainingDays,
    weeklyTrainingHours: assessment.weeklyTrainingHoursTarget,
    preferredTrainingDays: assessment.trainingDaysPreference.map(String),
    canDoubleSession: doubleReady !== "not_ready",
    doubleSessionReadiness: doubleReady,
    abilityLevel: level,
    currentWeeklyRunVolumeKm: assessment.currentWeeklyRunVolumeKm,
    recentTrainingSummary: assessment.recentTrainingSummary,
    recentThresholdSession: assessment.recentThresholdSession,
    fiveKmTime: assessment.fiveKmTime,
    tenKmTime: assessment.tenKmTime,
    maxHeartRate: assessment.maxHeartRate,
    thresholdHeartRate: assessment.thresholdHeartRate,
    usesHeartRateMonitor: assessment.usesHeartRateMonitor,
    estimatedPaceZones: buildPaceZonesFromAssessment({
      fiveKmTime: assessment.fiveKmTime,
      tenKmTime: assessment.tenKmTime,
      abilityLevel: level,
    }),
    strengthProfile:
      assessment.strengthSelfRating === "high"
        ? "Strong — emphasise Hyrox-specific endurance"
        : assessment.strengthSelfRating === "low"
          ? "Build gym confidence — tempo strength before race loads"
          : "Balanced — standard Hyrox strength endurance",
    stationWeaknesses: assessment.stationWeaknesses,
    mainLimiter: main,
    secondaryLimiter: secondary,
    equipmentAccess,
    equipmentLimitations: assessment.equipmentLimitations ?? "",
    injuryFlags: assessment.injuryFlags,
    recoveryRisk,
    sleepQuality: sleep,
    stressLevel: assessment.stressLevel,
    bodyweightKg: assessment.bodyweightKg,
    bodyCompositionGoal: assessment.bodyCompositionGoal,
    documentationConsent: assessment.documentationConsent,
    firstBlockFocus: "",
    keyProgrammePriorities: [],
    coachReviewFlags: [],
    suggestedWeeklyStructure:
      trainingDays >= 5
        ? "Mon easy · Tue threshold · Wed aerobic/erg · Thu strength · Fri easy/support · Sat key Hyrox"
        : "Tue threshold · Thu strength · weekend key — protect easy days",
    suggestedKeySessions: [
      "Tuesday threshold run",
      "Thursday lower strength endurance",
      "Saturday Hyrox key session",
      ...(assessment.stationWeaknesses.some((s) => s === "wall_balls" || s === "wall_ball")
        ? ["Wall ball EMOM add-on"]
        : []),
      "Easy gym aerobic + upper/grip",
    ],
    classificationId: classified.classification,
  };

  base.firstBlockFocus = determineFirstBlockFocus(base);
  base.keyProgrammePriorities = buildKeyProgrammePriorities(base);
  base.coachReviewFlags = buildCoachReviewFlags(base);

  return base;
}

export function applyProfileOverrides(
  profile: HyroxAthleteProfile,
  overrides: ProfileReviewOverrides
): HyroxAthleteProfile {
  const next = { ...profile, estimatedPaceZones: profile.estimatedPaceZones };
  if (overrides.abilityLevel) next.abilityLevel = overrides.abilityLevel;
  if (overrides.mainLimiter) next.mainLimiter = overrides.mainLimiter;
  if (overrides.secondaryLimiter) next.secondaryLimiter = overrides.secondaryLimiter;
  if (overrides.recoveryRisk) next.recoveryRisk = overrides.recoveryRisk;
  if (overrides.doubleSessionReadiness) next.doubleSessionReadiness = overrides.doubleSessionReadiness;
  if (overrides.weeklyTrainingHours != null) next.weeklyTrainingHours = overrides.weeklyTrainingHours;
  if (overrides.firstBlockFocus) next.firstBlockFocus = overrides.firstBlockFocus;
  next.estimatedPaceZones = buildPaceZonesFromAssessment(next);
  next.keyProgrammePriorities = buildKeyProgrammePriorities(next);
  next.coachReviewFlags = buildCoachReviewFlags(next);
  return next;
}

function mapLimiterToProgrammeInput(main: string, secondary: string): string {
  const m = main.toLowerCase();
  if (m.includes("running") || m.includes("engine")) return "running";
  if (m.includes("wall")) return "wall_balls";
  if (m.includes("sled")) return "sled";
  if (m.includes("ski") || m.includes("row") || m.includes("erg")) return "ergs";
  if (m.includes("compromise")) return "compromised_running";
  const s = secondary.toLowerCase();
  if (s.includes("running")) return "running";
  return "running";
}

function mapStationToInputs(weak: StationWeakness[]): string[] {
  return weak
    .filter((w) => w !== "none_significant")
    .map((w) => (w === "wall_ball" ? "wall_balls" : w));
}

function raceTimelineFromWeeks(weeks: number): "16_plus" | "12" | "8" | "4" | "race_week" {
  if (weeks <= 0) return "race_week";
  if (weeks <= 4) return "4";
  if (weeks <= 8) return "8";
  if (weeks <= 12) return "12";
  return "16_plus";
}

export function mergeProfileIntoCoachAthlete(
  base: CoachAthlete,
  profile: HyroxAthleteProfile
): CoachAthlete {
  const mainKey = mapLimiterToProgrammeInput(profile.mainLimiter, profile.secondaryLimiter);
  const stationWeaknesses =
    mapStationToInputs(profile.stationWeaknesses).length > 0
      ? mapStationToInputs(profile.stationWeaknesses)
      : base.programmeInputs.stationWeaknesses;

  const recoveryStatus =
    profile.recoveryRisk === "high"
      ? "poor"
      : profile.recoveryRisk === "moderate"
        ? "average"
        : "good";

  const sleepQuality =
    profile.sleepQuality === "good"
      ? "good"
      : profile.sleepQuality === "average"
        ? "average"
        : "poor";

  return {
    ...base,
    classification: `Mapped: ${profile.classificationId ?? "custom"}`,
    blockFocus: profile.firstBlockFocus,
    mainLimiter: profile.mainLimiter,
    secondaryLimiter: profile.secondaryLimiter,
    trainingDays: profile.trainingDays,
    weeklyHours: profile.weeklyTrainingHours,
    weeklyRunKm: profile.currentWeeklyRunVolumeKm,
    recoveryRisk: profile.recoveryRisk,
    programmePriorities: profile.keyProgrammePriorities.map((p) => p.label),
    assessment: {
      ...base.assessment,
      stationWeaknesses: profile.stationWeaknesses.map((s) => String(s).replace(/_/g, " ")),
      equipmentAccess: profile.equipmentAccess,
      recoveryProfile: profile.recentTrainingSummary.slice(0, 80),
    },
    programmeInputs: {
      ...base.programmeInputs,
      abilityLevel: profile.abilityLevel,
      trainingDays: profile.trainingDays,
      weeklyTrainingHours: profile.weeklyTrainingHours,
      weeklyRunKm: Math.max(profile.currentWeeklyRunVolumeKm, base.programmeInputs.weeklyRunKm),
      fiveKm: profile.fiveKmTime,
      tenKm: profile.tenKmTime,
      maxHeartRate: profile.maxHeartRate,
      thresholdHeartRate: profile.thresholdHeartRate,
      mainLimiter: mainKey,
      stationWeaknesses,
      doubleSessionReadiness: profile.doubleSessionReadiness,
      recoveryStatus,
      sleepQuality,
      raceTimeline: raceTimelineFromWeeks(profile.raceTimelineWeeks),
    },
  };
}

export function profileFromCoachAthleteFallback(athlete: CoachAthlete): HyroxAthleteProfile {
  const inv: HyroxAssessmentInput = {
    athleteId: athlete.id,
    submittedAt: athlete.lastUpdated,
    name: athlete.name,
    email: athlete.email,
    raceName: "Race",
    raceDate: athlete.raceDate,
    raceCategory: athlete.raceCategory,
    trainingDaysPreference: ["Tue", "Thu", "Sat", "Sun"].slice(0, athlete.trainingDays),
    weeklyTrainingHoursTarget: athlete.weeklyHours,
    currentWeeklyRunVolumeKm: athlete.weeklyRunKm,
    recentTrainingSummary: athlete.assessment.recoveryProfile,
    fiveKmTime: athlete.programmeInputs.fiveKm,
    tenKmTime: athlete.programmeInputs.tenKm,
    usesHeartRateMonitor: true,
    maxHeartRate: athlete.programmeInputs.maxHeartRate,
    thresholdHeartRate: athlete.programmeInputs.thresholdHeartRate,
    experienceHyrox: "some",
    strengthSelfRating: "moderate",
    stationWeaknesses: athlete.programmeInputs.stationWeaknesses as StationWeakness[],
    equipmentAvailable: {
      treadmill: athlete.programmeInputs.equipment.treadmill,
      track: athlete.programmeInputs.equipment.track,
      skiErg: athlete.programmeInputs.equipment.skiErg,
      rowErg: athlete.programmeInputs.equipment.rowErg,
      bike: athlete.programmeInputs.equipment.bike,
      sled: athlete.programmeInputs.equipment.sled,
      wallBalls: athlete.programmeInputs.equipment.wallBalls,
      farmersHandles: athlete.programmeInputs.equipment.farmersHandles,
      sandbag: athlete.programmeInputs.equipment.sandbag,
      fullGym: athlete.programmeInputs.equipment.fullGym,
    },
    injuryFlags: [],
    sleepQuality:
      athlete.recoveryStatus === "poor" ? "poor" : athlete.recoveryStatus === "moderate" ? "average" : "good",
    stressLevel: "moderate",
    contentConsent: true,
    documentationConsent: athlete.assessment.documentationConsent,
  };
  return mapAssessmentToAthleteProfile(inv, "profile_mapped");
}
