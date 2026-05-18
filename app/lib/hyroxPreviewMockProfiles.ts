import { parseTimeToSeconds } from "@/src/lib/hyrox/paceCalculator";
import { classifyAthlete, type AthleteClassificationInput } from "@/src/lib/hyrox/athleteClassification";
import type {
  BlockWeekInCycle,
  DoubleSessionReadiness,
  HyroxAbilityLevel,
  RecoveryStatus,
  StationWeakness,
} from "@/src/lib/hyrox/types";
import type { ProgrammeContext } from "@/src/lib/hyrox/programmeRules";
import type { ExperienceLevel } from "@/src/lib/hyrox/athleteClassification";

export type MockHyroxProfileId = "a" | "b" | "c" | "d";

export type MockHyroxProfile = {
  id: MockHyroxProfileId;
  label: string;
  shortLabel: string;
  fiveKm: string;
  tenKm: string | null;
  trainingDays: number;
  weeklyTrainingHours: number;
  weeksToRace: number;
  stationWeaknesses: StationWeakness[];
  recoveryStatus: RecoveryStatus;
  sleepQuality: "good" | "poor";
  stressLevel?: "low" | "average" | "high";
  doubleSessionReadiness: DoubleSessionReadiness;
  programmeBlock: 1 | 2 | 3;
  blockWeek: BlockWeekInCycle;
  experienceLevel: ExperienceLevel;
  abilityLevel: HyroxAbilityLevel;
  allowsDoubles: boolean;
};

export const MOCK_HYROX_PROFILES: MockHyroxProfile[] = [
  {
    id: "a",
    label: "A) Running-limited beginner",
    shortLabel: "Running-limited beginner",
    fiveKm: "27:00",
    tenKm: null,
    trainingDays: 4,
    weeklyTrainingHours: 5,
    weeksToRace: 12,
    stationWeaknesses: ["burpees", "wall_balls"],
    recoveryStatus: "moderate",
    sleepQuality: "good",
    stressLevel: "average",
    doubleSessionReadiness: "not_ready",
    programmeBlock: 1,
    blockWeek: 1,
    experienceLevel: "new",
    abilityLevel: "beginner",
    allowsDoubles: false,
  },
  {
    id: "b",
    label: "B) Strong runner / weak stations",
    shortLabel: "Strong runner · weak stations",
    fiveKm: "18:30",
    tenKm: "39:00",
    trainingDays: 5,
    weeklyTrainingHours: 7,
    weeksToRace: 10,
    stationWeaknesses: ["sled", "sled_push_pull", "wall_balls"],
    recoveryStatus: "good",
    sleepQuality: "good",
    doubleSessionReadiness: "aerobic_double_only",
    programmeBlock: 1,
    blockWeek: 2,
    experienceLevel: "experienced",
    abilityLevel: "intermediate",
    allowsDoubles: true,
  },
  {
    id: "c",
    label: "C) Advanced competitive athlete",
    shortLabel: "Advanced competitive",
    fiveKm: "16:45",
    tenKm: "35:30",
    trainingDays: 6,
    weeklyTrainingHours: 12,
    weeksToRace: 8,
    stationWeaknesses: ["wall_balls", "running_under_fatigue"],
    recoveryStatus: "good",
    sleepQuality: "good",
    doubleSessionReadiness: "threshold_run_plus_erg_threshold",
    programmeBlock: 2,
    blockWeek: 3,
    experienceLevel: "competitive",
    abilityLevel: "advanced",
    allowsDoubles: true,
  },
  {
    id: "d",
    label: "D) High stress / poor recovery",
    shortLabel: "Poor recovery · high stress",
    fiveKm: "21:00",
    tenKm: null,
    trainingDays: 5,
    weeklyTrainingHours: 6,
    weeksToRace: 14,
    stationWeaknesses: ["running_under_fatigue", "sled", "sled_push_pull"],
    recoveryStatus: "poor",
    sleepQuality: "poor",
    stressLevel: "high",
    doubleSessionReadiness: "not_ready",
    programmeBlock: 1,
    blockWeek: 2,
    experienceLevel: "some_structure",
    abilityLevel: "intermediate",
    allowsDoubles: false,
  },
];

export function profileToClassificationInput(p: MockHyroxProfile): AthleteClassificationInput {
  const fiveSec = parseTimeToSeconds(p.fiveKm);
  return {
    experienceLevel: p.experienceLevel,
    abilityLevel: p.abilityLevel,
    fiveKmSeconds: fiveSec,
    tenKmSeconds: p.tenKm ? parseTimeToSeconds(p.tenKm) : null,
    weeklyRunKm: Math.round(p.weeklyTrainingHours * 3.5),
    stationWeaknesses: p.stationWeaknesses,
    recoveryProfile: p.recoveryStatus,
    weeksToRace: p.weeksToRace,
  };
}

export function profileToProgrammeContext(
  p: MockHyroxProfile,
  classificationId: ProgrammeContext["classification"]
): ProgrammeContext {
  const input = profileToClassificationInput(p);
  const classified = classifyAthlete(input);
  return {
    classification: classificationId,
    raceTimeline:
      p.weeksToRace > 9 ? "far" : p.weeksToRace >= 5 ? "mid" : p.weeksToRace >= 2 ? "near" : "race_week",
    weeksToRace: p.weeksToRace,
    mainLimiter:
      classificationId.includes("running") ? "running"
      : classificationId.includes("station") || classificationId.includes("runner_dominant") ?
        "stations"
      : classificationId === "high_output_poor_recovery" ? "recovery"
      : "balanced",
    trainingDaysAvailable: p.trainingDays,
    allowsDoubleSessions: p.allowsDoubles,
    recoveryStatus: p.recoveryStatus,
    equipment: ["Full gym", "SkiErg", "RowErg", "Bike", "Sled"],
    hasSkiErg: true,
    hasRowErg: true,
    hasBike: true,
    hasSled: true,
    hasFullGym: true,
    programmeBlock: p.programmeBlock,
    blockWeekInCycle: p.blockWeek,
    stationWeaknesses: p.stationWeaknesses,
    doubleSessionReadiness: p.doubleSessionReadiness,
    weeklyTrainingHours: p.weeklyTrainingHours,
    onlyFiveKmBenchmark: p.tenKm == null,
    sleepQuality: p.sleepQuality,
    suggestRecoveryMonitoring: p.recoveryStatus === "poor" || p.sleepQuality === "poor",
    preferErgOverRun: classified.preferErgOverRun || p.id === "a" || p.id === "d",
  };
}
