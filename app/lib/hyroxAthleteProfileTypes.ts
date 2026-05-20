/**
 * Structured athlete profile — assessment → programme (coach layer).
 */

import type {
  DoubleSessionReadiness,
  HyroxAbilityLevel,
  RaceTimelinePhase,
  StationWeakness,
} from "@/src/lib/hyrox/types";
import type { PaceZones } from "@/src/lib/hyrox/types";

/** Raw intake aligned with assessment form + testing */
export type HyroxAssessmentInput = {
  athleteId: string;
  submittedAt: string;
  name: string;
  email: string;
  raceName: string;
  raceDate: string;
  raceCategory: string;
  targetTimeBand?: string;
  trainingDaysPreference: (string | number)[];
  weeklyTrainingHoursTarget: number;
  currentWeeklyRunVolumeKm: number;
  recentTrainingSummary: string;
  recentThresholdSession?: string;
  fiveKmTime: string;
  tenKmTime: string;
  usesHeartRateMonitor: boolean;
  maxHeartRate: number | null;
  thresholdHeartRate: number | null;
  experienceHyrox: "none" | "some" | "seasoned" | "competitive";
  strengthSelfRating: "low" | "moderate" | "high";
  stationWeaknesses: StationWeakness[];
  equipmentAvailable: {
    treadmill?: boolean;
    track?: boolean;
    skiErg?: boolean;
    rowErg?: boolean;
    bike?: boolean;
    sled?: boolean;
    wallBalls?: boolean;
    farmersHandles?: boolean;
    sandbag?: boolean;
    fullGym?: boolean;
  };
  equipmentLimitations?: string;
  injuryFlags: string[];
  sleepQuality: "good" | "average" | "poor";
  stressLevel: "low" | "moderate" | "high";
  recoveryNotes?: string;
  bodyweightKg?: number;
  bodyCompositionGoal?: string;
  contentConsent: boolean;
  documentationConsent: boolean;
};

export type HyroxCoachReviewFlag = {
  id: string;
  severity: "info" | "warn";
  label: string;
  detail: string;
};

export type HyroxProgrammePriority = {
  label: string;
  kind: "threshold" | "strength" | "station" | "engine" | "recovery" | "testing";
};

export type HyroxAthleteProfileStatus =
  | "assessment_required"
  | "testing_required"
  | "profile_mapped"
  | "draft_ready"
  | "published";

export type HyroxAthleteProfile = {
  athleteId: string;
  name: string;
  email: string;
  status: HyroxAthleteProfileStatus;
  raceName: string;
  raceDate: string;
  raceCategory: string;
  targetTime?: string;
  raceTimelineWeeks: number;
  raceTimelinePhase: RaceTimelinePhase;
  trainingDays: number;
  weeklyTrainingHours: number;
  preferredTrainingDays: string[];
  canDoubleSession: boolean;
  doubleSessionReadiness: DoubleSessionReadiness;
  abilityLevel: HyroxAbilityLevel;
  currentWeeklyRunVolumeKm: number;
  recentTrainingSummary: string;
  recentThresholdSession?: string;
  fiveKmTime: string;
  tenKmTime: string;
  maxHeartRate: number | null;
  thresholdHeartRate: number | null;
  usesHeartRateMonitor: boolean;
  estimatedPaceZones: (PaceZones & { source: string; note: string; hyroxRaceRunEstimate?: string }) | null;
  strengthProfile: string;
  stationWeaknesses: StationWeakness[];
  mainLimiter: string;
  secondaryLimiter: string;
  equipmentAccess: string[];
  equipmentLimitations: string;
  injuryFlags: string[];
  recoveryRisk: "low" | "moderate" | "high";
  sleepQuality: "good" | "average" | "poor";
  stressLevel: "low" | "moderate" | "high";
  bodyweightKg?: number;
  bodyCompositionGoal?: string;
  documentationConsent: boolean;
  firstBlockFocus: string;
  keyProgrammePriorities: HyroxProgrammePriority[];
  coachReviewFlags: HyroxCoachReviewFlag[];
  suggestedWeeklyStructure: string;
  suggestedKeySessions: string[];
  /** Classification id from src/lib/hyrox */
  classificationId?: string;
};

export type ProfileReviewOverrides = {
  abilityLevel?: HyroxAbilityLevel;
  mainLimiter?: string;
  secondaryLimiter?: string;
  recoveryRisk?: "low" | "moderate" | "high";
  doubleSessionReadiness?: DoubleSessionReadiness;
  weeklyTrainingHours?: number;
  firstBlockFocus?: string;
};
