/**
 * Mock coach/admin athlete records (4 athletes) — replace with Supabase later.
 */

import type { BlockWeekInCycle } from "@/src/lib/hyrox/types";
import type { CoachProgrammeStatus, CoachAthleteListStatus } from "@/app/lib/hyroxCoachProgrammeDraft";

export type CoachCheckInStatus = "current" | "due" | "overdue";
export type CoachRecoveryStatus = "good" | "moderate" | "poor";

export type CoachAthleteAssessment = {
  runningProfile: string;
  strengthProfile: string;
  stationWeaknesses: string[];
  equipmentAccess: string[];
  recoveryProfile: string;
  injuryRecovery: string;
  nutritionBodyweight: string;
  contentConsent: boolean;
  documentationConsent: boolean;
};

export type CoachBenchmarkSet = {
  label: string;
  key: string;
  baseline: string;
  current: string;
  target: string;
};

export type CoachAthleteProgrammeInputs = {
  abilityLevel: "beginner" | "intermediate" | "advanced" | "pro";
  raceTimeline: "16_plus" | "12" | "8" | "4" | "race_week";
  trainingDays: number;
  weeklyTrainingHours: number;
  weeklyRunKm: number;
  fiveKm: string;
  tenKm: string;
  maxHeartRate: number | null;
  thresholdHeartRate: number | null;
  mainLimiter: string;
  stationWeaknesses: string[];
  programmeBlock: 1 | 2 | 3;
  blockWeek: BlockWeekInCycle;
  doubleSessionReadiness:
    | "not_ready"
    | "aerobic_double_only"
    | "threshold_run_plus_easy_aerobic"
    | "threshold_run_plus_erg_threshold";
  recoveryStatus: "good" | "average" | "poor";
  sleepQuality: "good" | "average" | "poor";
  saturdayAvailable: boolean;
  preferredLongAerobicDay: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  lowerBodySoreness: "none" | "mild" | "high";
  equipment: Record<string, boolean>;
};

/** Mock coach workflow flags for action queue (local only). */
export type CoachAthleteWorkflow = {
  checkInSubmitted?: boolean;
  checkInDetail?: string;
  recoveryWarning?: boolean;
  recoveryDetail?: string;
  testingOverdue?: boolean;
  testingDetail?: string;
  raceWeekApproaching?: boolean;
  awaitingPublish?: boolean;
  videoFeedbackPending?: boolean;
  videoDetail?: string;
};

export type CoachAthlete = {
  id: string;
  name: string;
  initials: string;
  email: string;
  raceDate: string;
  raceCategory: string;
  weeksToRace: number;
  programmeBlock: 1 | 2 | 3;
  blockWeek: BlockWeekInCycle;
  classification: string;
  raceGoal: string;
  blockFocus: string;
  mainLimiter: string;
  secondaryLimiter: string;
  trainingDays: number;
  weeklyHours: number;
  weeklyRunKm: number;
  checkInStatus: CoachCheckInStatus;
  recoveryStatus: CoachRecoveryStatus;
  programmeStatus: CoachProgrammeStatus;
  listStatus: CoachAthleteListStatus;
  lastUpdated: string;
  nextCoachAction: string;
  recoveryRisk: "low" | "moderate" | "high";
  programmePriorities: string[];
  assessment: CoachAthleteAssessment;
  benchmarks: CoachBenchmarkSet[];
  programmeInputs: CoachAthleteProgrammeInputs;
  weeklyCoachNote: string;
  weekRationale: string;
  thingsToAvoid: string;
  keyFocus: string;
  athleteFacingNote: string;
  coachWorkflow?: CoachAthleteWorkflow;
};

export const COACH_ATHLETES: CoachAthlete[] = [
  {
    id: "sarah-m",
    name: "Sarah Mitchell",
    initials: "SM",
    email: "sarah.m@example.com",
    raceDate: "2026-09-12",
    raceCategory: "Hyrox Women Open",
    weeksToRace: 16,
    programmeBlock: 1,
    blockWeek: 2,
    classification: "Running-limited · foundation",
    raceGoal: "Finish strong · sub 1:35",
    blockFocus: "Aerobic base + first threshold exposures",
    mainLimiter: "Running",
    secondaryLimiter: "Wall balls",
    trainingDays: 4,
    weeklyHours: 5.5,
    weeklyRunKm: 22,
    checkInStatus: "current",
    recoveryStatus: "good",
    programmeStatus: "coach_reviewing",
    listStatus: "needs_coach_review",
    lastUpdated: "2026-05-16",
    nextCoachAction: "Review Week 2 draft · approve threshold volume",
    recoveryRisk: "low",
    programmePriorities: [
      "Build easy run frequency",
      "Tuesday threshold HR discipline",
      "Wall ball breathing on leg day finisher",
    ],
    assessment: {
      runningProfile: "27:00 5km · limited run background · prefers low impact options",
      strengthProfile: "Gym comfortable · needs leg endurance not max strength",
      stationWeaknesses: ["Wall balls", "Burpees"],
      equipmentAccess: ["Full gym", "SkiErg", "RowErg", "Bike", "Wall balls"],
      recoveryProfile: "Good sleep · moderate life stress",
      injuryRecovery: "No current injury · mild calf tightness historically",
      nutritionBodyweight: "Maintain weight · slow body comp improvement",
      contentConsent: true,
      documentationConsent: true,
    },
    benchmarks: benchmarks("sarah"),
    programmeInputs: inputs({
      abilityLevel: "beginner",
      fiveKm: "27:00",
      tenKm: "",
      trainingDays: 4,
      hours: 5.5,
      runKm: 22,
      block: 1,
      week: 2,
      weaknesses: ["wall_balls", "burpees"],
      recovery: "good",
    }),
    weeklyCoachNote: "",
    weekRationale: "Block 1 Week 2 — add threshold rep, keep easy days clearly easy.",
    thingsToAvoid: "No compromised overload yet",
    keyFocus: "Tuesday threshold · Thursday legs",
    athleteFacingNote: "",
    coachWorkflow: {
      videoFeedbackPending: true,
      videoDetail: "Threshold rep 6 video — review cadence",
    },
  },
  {
    id: "james-k",
    name: "James Kerr",
    initials: "JK",
    email: "james.k@example.com",
    raceDate: "2026-08-22",
    raceCategory: "Hyrox Men Pro",
    weeksToRace: 12,
    programmeBlock: 2,
    blockWeek: 3,
    classification: "Advanced competitive",
    raceGoal: "Top 20% Pro · race-pace durability",
    blockFocus: "Threshold density + Saturday key overload",
    mainLimiter: "Compromised running",
    secondaryLimiter: "Wall balls",
    trainingDays: 6,
    weeklyHours: 11,
    weeklyRunKm: 38,
    checkInStatus: "due",
    recoveryStatus: "good",
    programmeStatus: "generated_draft",
    listStatus: "draft_generated",
    lastUpdated: "2026-05-17",
    nextCoachAction: "Open draft · confirm Saturday key session",
    recoveryRisk: "low",
    programmePriorities: [
      "Protect Tuesday threshold",
      "Saturday station overload",
      "Track pace drop-off after stations",
    ],
    assessment: {
      runningProfile: "16:45 5km · 35:30 10km · handles volume",
      strengthProfile: "High strength · Hyrox-specific endurance focus",
      stationWeaknesses: ["Wall balls under fatigue", "Running after stations"],
      equipmentAccess: ["Track", "Full gym", "Sled", "All ergs"],
      recoveryProfile: "Excellent recovery capacity",
      injuryRecovery: "Shoulder managed · no restrictions",
      nutritionBodyweight: "Race weight maintenance",
      contentConsent: true,
      documentationConsent: true,
    },
    benchmarks: benchmarks("james"),
    programmeInputs: inputs({
      abilityLevel: "advanced",
      fiveKm: "16:45",
      tenKm: "35:30",
      trainingDays: 6,
      hours: 11,
      runKm: 38,
      block: 2,
      week: 3,
      weaknesses: ["wall_balls", "ski"],
      recovery: "good",
      doubles: "threshold_run_plus_erg_threshold",
    }),
    weeklyCoachNote: "",
    weekRationale: "Block 2 Week 3 — peak density before deload.",
    thingsToAvoid: "Extra threshold on recovery days",
    keyFocus: "Film final 750m split after station",
    athleteFacingNote: "",
    coachWorkflow: {
      checkInSubmitted: true,
      checkInDetail: "Check-in submitted 17 May — confirm draft",
      testingOverdue: true,
      testingDetail: "5 km retest overdue · update threshold zones",
    },
  },
  {
    id: "priya-n",
    name: "Priya Nair",
    initials: "PN",
    email: "priya.n@example.com",
    raceDate: "2026-10-03",
    raceCategory: "Hyrox Women Open",
    weeksToRace: 18,
    programmeBlock: 1,
    blockWeek: 1,
    classification: "Station-limited · balanced",
    raceGoal: "Consistent pacing · strong sled & carry",
    blockFocus: "Foundation rhythm + sled technique",
    mainLimiter: "Sled",
    secondaryLimiter: "Grip / carries",
    trainingDays: 5,
    weeklyHours: 7,
    weeklyRunKm: 28,
    checkInStatus: "current",
    recoveryStatus: "moderate",
    programmeStatus: "generated_draft",
    listStatus: "assessment_submitted",
    lastUpdated: "2026-05-18",
    nextCoachAction: "Generate & review first draft from assessment",
    recoveryRisk: "moderate",
    programmePriorities: ["Sled exposure", "Grip density", "Threshold from week 2"],
    assessment: {
      runningProfile: "21:30 5km · 45:00 10km · moderate runner",
      strengthProfile: "Strong lower body · sled angle needs work",
      stationWeaknesses: ["Sled push/pull", "Farmers carry"],
      equipmentAccess: ["Sled", "Full gym", "Farmers handles", "RowErg", "Bike"],
      recoveryProfile: "Average sleep · desk job fatigue",
      injuryRecovery: "Low back occasional tightness · monitor sled",
      nutritionBodyweight: "Lose 2kg slowly while keeping strength",
      contentConsent: true,
      documentationConsent: false,
    },
    benchmarks: benchmarks("priya"),
    programmeInputs: inputs({
      abilityLevel: "intermediate",
      fiveKm: "21:30",
      tenKm: "45:00",
      trainingDays: 5,
      hours: 7,
      runKm: 28,
      block: 1,
      week: 1,
      weaknesses: ["sled_push_pull", "farmers_carry"],
      recovery: "average",
    }),
    weeklyCoachNote: "",
    weekRationale: "Foundation week — weekly rhythm and sled technique.",
    thingsToAvoid: "Heavy compromised sessions in week 1",
    keyFocus: "Thursday strength + sled finisher",
    athleteFacingNote: "",
    coachWorkflow: {
      awaitingPublish: false,
    },
  },
  {
    id: "tom-h",
    name: "Tom Hughes",
    initials: "TH",
    email: "tom.h@example.com",
    raceDate: "2026-08-01",
    raceCategory: "Hyrox Men Open",
    weeksToRace: 10,
    programmeBlock: 2,
    blockWeek: 1,
    classification: "Balanced intermediate",
    raceGoal: "Break 1:20 · even station splits",
    blockFocus: "Recovery-managed threshold block",
    mainLimiter: "Ergs",
    secondaryLimiter: "Ski",
    trainingDays: 5,
    weeklyHours: 7.5,
    weeklyRunKm: 30,
    checkInStatus: "overdue",
    recoveryStatus: "poor",
    programmeStatus: "edited_draft",
    listStatus: "check_in_requires_adjustment",
    lastUpdated: "2026-05-17",
    nextCoachAction: "Reduce threshold minutes · review check-in flags",
    recoveryRisk: "high",
    programmePriorities: [
      "SkiErg threshold substitute",
      "Upper/grip on gym day",
      "Cap Tuesday threshold if HR drifts",
    ],
    assessment: {
      runningProfile: "20:00 5km · 42:00 10km",
      strengthProfile: "Balanced · ski technique limiter",
      stationWeaknesses: ["Ski", "Row"],
      equipmentAccess: ["SkiErg", "RowErg", "Bike", "Full gym"],
      recoveryProfile: "Poor sleep × 2 weeks · high work stress",
      injuryRecovery: "Fatigue flags · no acute injury",
      nutritionBodyweight: "Maintain lean mass",
      contentConsent: true,
      documentationConsent: true,
    },
    benchmarks: benchmarks("tom"),
    programmeInputs: inputs({
      abilityLevel: "intermediate",
      fiveKm: "20:00",
      tenKm: "42:00",
      trainingDays: 5,
      hours: 7.5,
      runKm: 30,
      block: 2,
      week: 1,
      weaknesses: ["ski", "row"],
      recovery: "poor",
    }),
    weeklyCoachNote: "Check sleep before adding any extra volume.",
    weekRationale: "Recovery flag — cap threshold, keep structure.",
    thingsToAvoid: "Erg threshold after hard leg day",
    keyFocus: "HR/RPE on Tuesday — shorten if needed",
    athleteFacingNote: "",
    coachWorkflow: {
      checkInSubmitted: true,
      checkInDetail: "Check-in flagged poor sleep + high soreness",
      recoveryWarning: true,
      recoveryDetail: "Recovery poor · reduce threshold volume",
      testingOverdue: true,
      raceWeekApproaching: true,
    },
  },
];

function inputs(opts: {
  abilityLevel: CoachAthleteProgrammeInputs["abilityLevel"];
  fiveKm: string;
  tenKm: string;
  trainingDays: number;
  hours: number;
  runKm: number;
  block: 1 | 2 | 3;
  week: BlockWeekInCycle;
  weaknesses: string[];
  recovery: "good" | "average" | "poor";
  doubles?: CoachAthleteProgrammeInputs["doubleSessionReadiness"];
}): CoachAthleteProgrammeInputs {
  return {
    abilityLevel: opts.abilityLevel,
    raceTimeline: "12",
    trainingDays: opts.trainingDays,
    weeklyTrainingHours: opts.hours,
    weeklyRunKm: opts.runKm,
    fiveKm: opts.fiveKm,
    tenKm: opts.tenKm,
    maxHeartRate: 188,
    thresholdHeartRate: 168,
    mainLimiter: "running",
    stationWeaknesses: opts.weaknesses,
    programmeBlock: opts.block,
    blockWeek: opts.week,
    doubleSessionReadiness: opts.doubles ?? "aerobic_double_only",
    recoveryStatus: opts.recovery,
    sleepQuality: opts.recovery === "poor" ? "poor" : "good",
    saturdayAvailable: true,
    preferredLongAerobicDay: "Sun",
    lowerBodySoreness: opts.recovery === "poor" ? "mild" : "none",
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
  };
}

function benchmarks(seed: string): CoachBenchmarkSet[] {
  const map: Record<string, CoachBenchmarkSet[]> = {
    sarah: rows([
      ["5km", "27:30", "27:00", "24:30"],
      ["10km", "—", "—", "52:00"],
      ["1km SkiErg", "4:45", "4:38", "4:15"],
      ["1km RowErg", "4:20", "4:12", "3:55"],
      ["Wall balls", "80", "95", "120"],
      ["Mini compromised", "—", "Pending", "W3"],
      ["Sled", "Light", "Moderate", "Race"],
      ["Lunges", "20m DB", "25m", "Race"],
      ["Farmer carry", "24kg×50m", "28kg", "Race"],
    ]),
    james: rows([
      ["5km", "17:10", "16:45", "16:15"],
      ["10km", "36:30", "35:30", "34:00"],
      ["1km SkiErg", "3:55", "3:48", "3:35"],
      ["1km RowErg", "3:35", "3:28", "3:18"],
      ["Wall balls", "120", "140", "160"],
      ["Mini compromised", "42:00", "40:15", "38:30"],
      ["Sled", "Race-", "Race", "Race+"],
      ["Lunges", "Race bag", "Race bag", "Race+"],
      ["Farmer carry", "32kg", "36kg", "Race"],
    ]),
    priya: rows([
      ["5km", "22:00", "21:30", "20:00"],
      ["10km", "46:00", "45:00", "42:30"],
      ["1km SkiErg", "4:30", "4:22", "4:05"],
      ["1km RowErg", "4:05", "3:58", "3:45"],
      ["Wall balls", "90", "100", "115"],
      ["Mini compromised", "—", "—", "W3"],
      ["Sled", "Technique", "Moderate", "Race"],
      ["Lunges", "20m", "30m", "Race"],
      ["Farmer carry", "20kg", "24kg", "28kg"],
    ]),
    tom: rows([
      ["5km", "20:30", "20:00", "19:15"],
      ["10km", "43:00", "42:00", "40:00"],
      ["1km SkiErg", "4:25", "4:18", "3:58"],
      ["1km RowErg", "4:00", "3:52", "3:40"],
      ["Wall balls", "95", "105", "120"],
      ["Mini compromised", "—", "Scheduled", "40:00"],
      ["Sled", "Mod", "Mod+", "Race"],
      ["Lunges", "22m", "28m", "Race"],
      ["Farmer carry", "22kg", "26kg", "30kg"],
    ]),
  };
  return map[seed] ?? map.sarah;
}

function rows(data: [string, string, string, string][]): CoachBenchmarkSet[] {
  return data.map(([label, baseline, current, target]) => ({
    label,
    key: label.toLowerCase().replace(/\s+/g, "_"),
    baseline,
    current,
    target,
  }));
}

export function getCoachAthleteById(id: string): CoachAthlete | undefined {
  return COACH_ATHLETES.find((a) => a.id === id);
}

export function formatRaceCountdown(weeksToRace: number): string {
  if (weeksToRace <= 0) return "Race week";
  if (weeksToRace === 1) return "1 week out";
  return `${weeksToRace} weeks out`;
}

export const LIST_STATUS_LABELS: Record<CoachAthleteListStatus, string> = {
  assessment_submitted: "Assessment submitted",
  profile_mapped: "Profile mapped",
  draft_generated: "Draft generated",
  needs_coach_review: "Needs coach review",
  approved: "Approved",
  published_to_athlete: "Published",
  check_in_requires_adjustment: "Check-in requires adjustment",
};

export function suggestedNextCoachAction(status: CoachAthleteListStatus): string {
  switch (status) {
    case "assessment_submitted":
      return "Review profile · map assessment";
    case "profile_mapped":
      return "Generate draft";
    case "draft_generated":
    case "needs_coach_review":
      return "Review programme";
    case "approved":
      return "Publish week";
    case "published_to_athlete":
      return "Ongoing · check-ins";
    case "check_in_requires_adjustment":
      return "Check-in review";
    default:
      return "Review athlete";
  }
}

export const PROGRAMME_STATUS_LABELS: Record<CoachProgrammeStatus, string> = {
  generated_draft: "Generated draft",
  coach_reviewing: "Coach reviewing",
  edited_draft: "Edited draft",
  approved: "Approved",
  published: "Published to athlete",
};
