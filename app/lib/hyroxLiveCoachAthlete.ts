import type { CoachAthlete } from "@/app/lib/hyroxCoachMockAthletes";
import { suggestedNextCoachAction } from "@/app/lib/hyroxCoachMockAthletes";
import type { HyroxAthleteRow } from "@/app/lib/hyroxDatabaseTypes";
import type { HyroxAthleteStatus } from "@/app/lib/hyroxDatabaseTypes";

/** Minimal CoachAthlete shell for live Supabase rows (programme builder still uses mock flows where needed). */
export function buildCoachAthleteStubFromLiveRow(
  row: HyroxAthleteRow,
  flags: { hasAssessment: boolean; hasTesting: boolean }
): CoachAthlete {
  const listStatus = liveListStatus(row.status, flags);
  return {
    id: row.id,
    name: row.name,
    initials: row.name
      .split(/\s+/)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
    email: row.email,
    raceDate: row.race_date ?? "TBC",
    raceCategory: row.race_category ?? "Open",
    weeksToRace: 12,
    programmeBlock: (row.current_block as 1 | 2 | 3) ?? 1,
    blockWeek: (Math.min(4, Math.max(1, row.current_week)) as 1 | 2 | 3 | 4) ?? 1,
    classification: "Live athlete · Supabase",
    raceGoal: row.target_time ?? "—",
    blockFocus: "Coach review in progress",
    mainLimiter: "—",
    secondaryLimiter: "—",
    trainingDays: 4,
    weeklyHours: 6,
    weeklyRunKm: 25,
    checkInStatus: "current",
    recoveryStatus: "good",
    programmeStatus: row.status === "programme_published" ? "published" : "coach_reviewing",
    listStatus,
    lastUpdated: row.updated_at.slice(0, 10),
    nextCoachAction: suggestedNextCoachAction(listStatus),
    recoveryRisk: "moderate",
    programmePriorities: [],
    assessment: {
      runningProfile: flags.hasAssessment ? "From submitted assessment" : "Pending assessment",
      strengthProfile: "See assessment",
      stationWeaknesses: [],
      equipmentAccess: [],
      recoveryProfile: "See assessment",
      injuryRecovery: "See assessment",
      nutritionBodyweight: "See assessment",
      contentConsent: true,
      documentationConsent: false,
    },
    benchmarks: [],
    programmeInputs: {
      abilityLevel: "intermediate",
      raceTimeline: "12",
      trainingDays: 4,
      weeklyTrainingHours: 6,
      weeklyRunKm: 25,
      fiveKm: "",
      tenKm: "",
      maxHeartRate: null,
      thresholdHeartRate: null,
      mainLimiter: "engine",
      stationWeaknesses: [],
      programmeBlock: 1,
      blockWeek: 1,
      doubleSessionReadiness: "not_ready",
      recoveryStatus: "good",
      sleepQuality: "good",
      saturdayAvailable: true,
      preferredLongAerobicDay: "Sun",
      lowerBodySoreness: "none",
      equipment: { fullGym: true },
    },
    weeklyCoachNote: "",
    weekRationale: "",
    thingsToAvoid: "",
    keyFocus: "",
    athleteFacingNote: "",
  };
}

function liveListStatus(
  status: HyroxAthleteStatus,
  flags: { hasAssessment: boolean; hasTesting: boolean }
): CoachAthlete["listStatus"] {
  if (status === "programme_published") return "approved";
  if (status === "draft_generated") return "draft_generated";
  if (status === "coach_reviewing" || (flags.hasAssessment && flags.hasTesting)) {
    return "needs_coach_review";
  }
  if (flags.hasAssessment) return "assessment_submitted";
  return "assessment_submitted";
}
