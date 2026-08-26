import type { CommunityHyroxDetails } from "@/app/lib/communityHyroxAssessment";
import type { DashboardWeekTrackingSummary } from "@/app/lib/dashboardWeekTracking";
import type { MemberSessionDetail } from "@/app/lib/memberDashboardSchedule";
import type { MemberSessionDrawerSession } from "@/app/lib/memberSessionTypes";
import type { MemberSessionLogRecord, SessionLogStatus } from "@/app/lib/sessionLogTypes";

export const LAB_TODAY_WEEKDAY = "Wednesday";
export const LAB_CURRENT_WEEK = 6;
export const LAB_TOTAL_WEEKS = 12;

type LabHabitDay = {
  date: string;
  hydration: boolean;
  mobility: boolean;
  stretching: boolean;
  sleep: boolean;
  nutrition: boolean;
};

type LabWeekProgress = {
  week: number;
  plannedRunKm: number;
  completedRunKm: number;
  durationMinutes: number;
  sessionsPlanned: number;
  sessionsCompleted: number;
  avgRpe: number;
  hrZones: { z1: number; z2: number; z3: number; z4: number; z5: number };
  thresholdMinutes: number;
  strengthExposures: number;
  hyroxStationMinutes: number;
  readiness: number;
  habitAdherencePct: number;
};

type LabTestResult = {
  id: string;
  test: string;
  value: string;
  unit: string;
  testedAt: string;
  notes?: string;
};

function detail(input: {
  day: string;
  title: string;
  category: MemberSessionDetail["category"];
  intent: string;
  duration: string;
  timeCap?: string;
  tags?: string[];
  warmUp: string[];
  mainWork: string[];
  coolDown: string[];
  finisher?: string[];
  coachingNotes: string;
  rpeGuide: string;
  effortDescription: string;
  runPrescription?: MemberSessionDetail["runPrescription"];
  priorityRank?: 1 | 2 | 3;
  priorityDisplayLabel?: string;
  priorityCategoryLabel?: string;
  priorityReason?: string;
}): MemberSessionDetail {
  const rank = input.priorityRank ?? 2;
  return {
    day: input.day,
    dayShort: input.day.slice(0, 3).toUpperCase(),
    title: input.title,
    category: input.category,
    status: "planned",
    intent: input.intent,
    duration: input.duration,
    timeCap: input.timeCap,
    tags: input.tags ?? [input.category.toLowerCase()],
    warmUp: input.warmUp,
    mainWork: input.mainWork,
    coolDown: input.coolDown,
    finisher: input.finisher,
    coachingNotes: input.coachingNotes,
    rpeGuide: input.rpeGuide,
    effortDescription: input.effortDescription,
    runPrescription: input.runPrescription,
    priorityRank: rank,
    priorityDisplayLabel: input.priorityDisplayLabel ?? `Priority ${rank}`,
    priorityCategoryLabel:
      input.priorityCategoryLabel ??
      (rank === 1 ? "Key Session" : rank === 3 ? "Optional / Flexible" : "Support Session"),
    priorityReason: input.priorityReason ?? "Supports the structure of the week.",
  };
}

function labSession(
  weekNumber: number,
  scheduleIndex: number,
  session: MemberSessionDetail
): MemberSessionDrawerSession {
  const sessionKey = `lab-week-${weekNumber}-${session.day.toLowerCase()}-${scheduleIndex}`;
  return { ...session, sessionKey, weekNumber };
}

function log(args: {
  session: MemberSessionDrawerSession;
  status: SessionLogStatus;
  rpe: number | null;
  duration_minutes: number | null;
  distance_km?: number | null;
  average_pace?: string | null;
  average_hr?: number | null;
  notes?: string | null;
  load_notes?: string | null;
  station_notes?: string | null;
  raw_log?: Record<string, unknown>;
}): MemberSessionLogRecord {
  return {
    id: `lab-log-${args.session.sessionKey}`,
    week_number: args.session.weekNumber,
    session_key: args.session.sessionKey,
    session_title: args.session.title,
    session_day: args.session.day,
    session_type: args.session.category,
    session_status: args.status,
    completed: args.status === "completed",
    completed_at: args.status === "completed" ? "2026-08-19T18:00:00.000Z" : null,
    rpe: args.rpe,
    notes: args.notes ?? null,
    duration_minutes: args.duration_minutes,
    distance_km: args.distance_km ?? null,
    average_pace: args.average_pace ?? null,
    average_hr: args.average_hr ?? null,
    load_notes: args.load_notes ?? null,
    station_notes: args.station_notes ?? null,
    proof_url: null,
    pain_or_tightness: null,
    raw_log: args.raw_log ?? null,
  };
}

const hyroxDetails: CommunityHyroxDetails = {
  race_booked: "yes",
  race_date: "2027-03-14",
  race_location: "HYROX London",
  category: "open",
  division: "mens",
  target_time: "Sub-65",
  previous_time: "1:09:40",
  race_priority: "improve_time",
  current_5k_time: "19:42",
  current_10k_time: "41:10",
  weekly_run_volume_km: 38,
  longest_recent_run: "14 km",
  running_confidence: 7,
  treadmill_access: true,
  ski_1k_time: "3:58",
  row_1k_time: "3:36",
  wall_ball_standard: "9kg / 3m",
  wall_ball_max_unbroken: 42,
  burpee_broad_jump_confidence: 6,
  farmers_carry_confidence: 7,
  sled_push_pull_experience: "moderate",
  sandbag_lunge_confidence: 6,
  station_weaknesses: ["wall_balls", "sled_push", "compromised_running"],
  equipment: ["skierg", "rowerg", "sled", "wall_balls", "sandbag", "farmers_carry", "full_gym"],
};

const week6Sessions: MemberSessionDrawerSession[] = [
  labSession(6, 0, detail({
    day: "Monday",
    title: "Easy run",
    category: "Run",
    intent: "Aerobic base. Keep it conversational.",
    duration: "45 min",
    timeCap: "50 min",
    warmUp: ["5 min walk", "Drills"],
    mainWork: ["8 km easy", "Keep HR in zone 2"],
    coolDown: ["Walk 4 min"],
    coachingNotes: "If yesterday was heavy, start even easier.",
    rpeGuide: "4–5",
    effortDescription: "Easy aerobic",
    runPrescription: {
      pace_range: "5:20–5:40 /km",
      treadmill_speed_range: "10.6–11.3 km/h",
      hr_range: "138–152",
      rpe: "4–5",
      effort_description: "Easy, nasal breathing possible",
      coach_note: "Do not chase pace.",
      personalization_line: "Built from your 19:42 5K.",
      intensity_label: "Easy",
      pace_unavailable_note: null,
      hr_add_note: null,
    },
  })),
  labSession(6, 1, detail({
    day: "Monday",
    title: "Ski / Row aerobic",
    category: "Aerobic",
    intent: "Engine work without running load.",
    duration: "30 min",
    warmUp: ["5 min easy ski"],
    mainWork: ["10 min ski Z2", "10 min row Z2", "5 min mixed easy"],
    coolDown: ["Easy spin"],
    coachingNotes: "Smooth 500m splits. No racing.",
    rpeGuide: "5",
    effortDescription: "Steady aerobic",
    tags: ["aerobic"],
  })),
  labSession(6, 2, detail({
    day: "Tuesday",
    title: "Lower-body strength",
    category: "Strength",
    intent: "Sled and squat strength for HYROX.",
    duration: "55 min",
    warmUp: ["Bike 6 min", "Hip openers"],
    mainWork: ["Back squat 5x5", "Romanian deadlift 4x6", "Walking lunges", "Core"],
    coolDown: ["Easy walk"],
    coachingNotes: "Leave 2 reps in reserve on the last set.",
    rpeGuide: "7",
    effortDescription: "Strength quality",
    tags: ["strength"],
  })),
  labSession(6, 3, detail({
    day: "Tuesday",
    title: "Bike threshold",
    category: "Aerobic",
    intent: "Threshold without extra run pounding.",
    duration: "40 min",
    warmUp: ["10 min easy"],
    mainWork: ["4 x 5 min threshold / 2 min easy"],
    coolDown: ["8 min easy"],
    coachingNotes: "Moved from Thursday to sit beside strength.",
    rpeGuide: "7–8",
    effortDescription: "Controlled threshold",
    tags: ["aerobic"],
  })),
  labSession(6, 4, detail({
    day: "Wednesday",
    title: "Threshold run",
    category: "Run",
    intent: "Lift sustainable race pace.",
    duration: "50 min",
    warmUp: ["12 min easy", "4 x 20s strides"],
    mainWork: ["3 x 8 min threshold / 90s easy"],
    coolDown: ["8 min easy"],
    coachingNotes: "This is today's key session. Keep the last rep honest, not heroic.",
    rpeGuide: "7",
    effortDescription: "Threshold",
    tags: ["run"],
    priorityRank: 1,
    priorityDisplayLabel: "Priority 1",
    priorityCategoryLabel: "Key Session",
    priorityReason: "Primary running stimulus this week.",
    runPrescription: {
      pace_range: "4:18–4:28 /km",
      treadmill_speed_range: "13.4–14.0 km/h",
      hr_range: "162–172",
      rpe: "7",
      effort_description: "Strong but repeatable",
      coach_note: "If splits fade more than 5s, stop the interval.",
      personalization_line: "Threshold from your 5K and 30-min test.",
      intensity_label: "Threshold",
      pace_unavailable_note: null,
      hr_add_note: null,
    },
  })),
  labSession(6, 5, detail({
    day: "Thursday",
    title: "Bike aerobic",
    category: "Aerobic",
    intent: "Recover while keeping blood moving.",
    duration: "45 min",
    warmUp: ["Easy"],
    mainWork: ["40 min Z2 bike"],
    coolDown: ["Spin down"],
    coachingNotes: "Genuinely easy after yesterday's threshold.",
    rpeGuide: "4",
    effortDescription: "Easy aerobic",
    tags: ["aerobic"],
  })),
  labSession(6, 6, detail({
    day: "Friday",
    title: "HYROX station work",
    category: "Hybrid",
    intent: "Wall balls, sled, farmers — quality reps.",
    duration: "60 min",
    warmUp: ["Row 6 min", "Wall ball technique"],
    mainWork: ["Sled push/pull", "Farmers 4x40m", "Wall balls 5x20", "Lunges"],
    coolDown: ["Easy ski 5 min"],
    coachingNotes: "Stations before compromised running on Saturday.",
    rpeGuide: "7",
    effortDescription: "Station quality",
    tags: ["hybrid"],
    priorityRank: 1,
    priorityDisplayLabel: "Priority 1",
    priorityCategoryLabel: "Key Session",
    priorityReason: "Primary HYROX station stimulus.",
  })),
  labSession(6, 7, detail({
    day: "Saturday",
    title: "Compromised running",
    category: "Hybrid",
    intent: "Run after stations like race day.",
    duration: "50 min",
    warmUp: ["Easy 8 min"],
    mainWork: ["4 rounds: 400m run + 20 wall balls + 200m farmers"],
    coolDown: ["Walk"],
    coachingNotes: "Settle the first 200m of each run. Don't sprint out of the station.",
    rpeGuide: "8",
    effortDescription: "Race-specific",
    tags: ["hybrid", "run"],
  })),
  labSession(6, 8, detail({
    day: "Sunday",
    title: "Recovery / mobility",
    category: "Recovery",
    intent: "Restore, don't train.",
    duration: "30 min",
    warmUp: [],
    mainWork: ["Walk 20 min", "Hip and T-spine flow", "Breathing"],
    coolDown: [],
    coachingNotes: "Optional. Skip if sleep is poor.",
    rpeGuide: "2–3",
    effortDescription: "Recovery",
    tags: ["recovery"],
    priorityRank: 3,
    priorityDisplayLabel: "Priority 3",
    priorityCategoryLabel: "Optional / Flexible",
    priorityReason: "Can move or skip without losing the week.",
  })),
];

const [easyRun, skiRow, strength, bikeThreshold, thresholdRun, bikeAerobic, hyroxStations, , recovery] =
  week6Sessions;

const week6Logs: MemberSessionLogRecord[] = [
  log({
    session: easyRun,
    status: "completed",
    rpe: 4,
    duration_minutes: 46,
    distance_km: 8.2,
    average_pace: "5:28 /km",
    average_hr: 146,
    notes: "Felt easy. Kept it honest.",
    raw_log: { max_hr: 154, hr_zones: { z1: 8, z2: 36, z3: 2, z4: 0, z5: 0 } },
  }),
  log({
    session: skiRow,
    status: "completed",
    rpe: 5,
    duration_minutes: 31,
    distance_km: 6.4,
    notes: "Ski 2:05/500, row 1:58/500.",
    raw_log: { pace_500: "2:02", average_hr: 141, max_hr: 152 },
  }),
  log({
    session: strength,
    status: "completed",
    rpe: 7,
    duration_minutes: 58,
    load_notes: "Squat 92.5kg, RDL 100kg, lunges 2x20kg",
    notes: "Left 2 RIR on squats.",
    raw_log: {
      strength: [
        { lift: "Back squat", sets: "5x5", load: "92.5kg", rir: 2 },
        { lift: "Romanian deadlift", sets: "4x6", load: "100kg", rir: 2 },
      ],
    },
  }),
  log({
    session: bikeThreshold,
    status: "moved",
    rpe: 8,
    duration_minutes: 41,
    notes: "Moved from Thursday to Tuesday PM.",
    raw_log: { watts: 248, average_hr: 168, max_hr: 176 },
  }),
  log({
    session: bikeAerobic,
    status: "completed",
    rpe: 4,
    duration_minutes: 45,
    raw_log: { watts: 168, average_hr: 132, max_hr: 141 },
  }),
  log({
    session: hyroxStations,
    status: "completed",
    rpe: 7,
    duration_minutes: 62,
    station_notes: "Wall balls 5x20 @ 9kg. Sled heavy but clean.",
    raw_log: {
      station_results: [
        { station: "Sled push", note: "3 x 20m heavy" },
        { station: "Farmers", note: "4 x 40m @ 2x24kg" },
        { station: "Wall balls", note: "100 total, unbroken 22 peak" },
      ],
      average_hr: 158,
      max_hr: 174,
    },
  }),
  log({
    session: recovery,
    status: "completed",
    rpe: 2,
    duration_minutes: 28,
    notes: "Walk + hips. Sleep was 7.5h.",
  }),
];

const weekTracking: DashboardWeekTrackingSummary = {
  programmeWeek: LAB_CURRENT_WEEK,
  hasProgrammePlan: true,
  sessions: { completed: 7, planned: 9 },
  runs: { completed: 1, planned: 3 },
  strength: { completed: 1, planned: 1 },
  hybrid: { completed: 1, planned: 2 },
  aerobicRecovery: { completed: 4, planned: 3 },
  partialCount: 0,
  skippedCount: 0,
  consistencyPct: 78,
  consistencyLabel: "On track",
  weeklyNarrative: {
    headline: "You've completed 7 of 9 planned sessions.",
    body: "Threshold run is still the key session today. Keep easy work easy around it.",
    completedCount: 7,
    plannedCount: 9,
    remainingCount: 2,
    completionPct: 78,
  },
  weeklyCheckInComplete: false,
  runVolume: {
    hasPlannedKmEstimate: true,
    plannedKmMin: 36,
    plannedKmMax: 40,
    hasPerSessionKmMetadata: true,
    completedRunKm: 31.4,
    plannedRunKmFromWeekTarget: 38,
  },
  habit: {
    todayDone: 4,
    todayPct: 67,
    weekHabitHits: 28,
    weekMaxHits: 42,
    weekPct: 67,
    streak: 4,
  },
  challenge: null,
  benchmarks: [
    { label: "5K", latest: "19:42", change: "−0:18", logged: true },
    { label: "Squat", latest: "110kg", change: "+5kg", logged: true },
    { label: "Bodyweight", latest: "79.4kg", change: "−0.6kg", logged: true },
  ],
  hasAnyTrackingActivity: true,
};

const testing: LabTestResult[] = [
  { id: "t-5k", test: "5K TT", value: "19:42", unit: "min", testedAt: "2026-07-12", notes: "Track. Even splits." },
  { id: "t-30", test: "30-minute max-distance run", value: "7.62", unit: "km", testedAt: "2026-07-12" },
  { id: "t-ftp", test: "20-minute bike FTP", value: "252", unit: "W", testedAt: "2026-07-14", notes: "Estimated FTP 239W" },
  { id: "t-ski", test: "2K SkiErg", value: "8:06", unit: "min", testedAt: "2026-07-15" },
  { id: "t-row", test: "2K RowErg", value: "7:22", unit: "min", testedAt: "2026-07-15" },
  { id: "t-wb", test: "150 wall balls", value: "6:48", unit: "min", testedAt: "2026-07-16", notes: "9kg / 3m" },
  { id: "t-squat", test: "Squat", value: "110", unit: "kg", testedAt: "2026-07-18", notes: "Estimated 1RM" },
  { id: "t-dl", test: "Deadlift", value: "150", unit: "kg", testedAt: "2026-07-18" },
  { id: "t-bench", test: "Bench press", value: "85", unit: "kg", testedAt: "2026-07-18" },
  { id: "t-ohp", test: "Military / overhead press", value: "55", unit: "kg", testedAt: "2026-07-18" },
  { id: "t-bw", test: "Bodyweight", value: "79.4", unit: "kg", testedAt: "2026-08-18" },
];

const progressHistory: LabWeekProgress[] = [
  { week: 1, plannedRunKm: 28, completedRunKm: 26.2, durationMinutes: 312, sessionsPlanned: 8, sessionsCompleted: 7, avgRpe: 6.1, hrZones: { z1: 40, z2: 38, z3: 14, z4: 6, z5: 2 }, thresholdMinutes: 18, strengthExposures: 2, hyroxStationMinutes: 25, readiness: 7, habitAdherencePct: 62 },
  { week: 2, plannedRunKm: 30, completedRunKm: 29.1, durationMinutes: 338, sessionsPlanned: 8, sessionsCompleted: 8, avgRpe: 6.3, hrZones: { z1: 36, z2: 40, z3: 15, z4: 7, z5: 2 }, thresholdMinutes: 22, strengthExposures: 2, hyroxStationMinutes: 30, readiness: 7, habitAdherencePct: 71 },
  { week: 3, plannedRunKm: 32, completedRunKm: 33.4, durationMinutes: 354, sessionsPlanned: 9, sessionsCompleted: 8, avgRpe: 6.6, hrZones: { z1: 32, z2: 39, z3: 17, z4: 9, z5: 3 }, thresholdMinutes: 28, strengthExposures: 2, hyroxStationMinutes: 40, readiness: 6, habitAdherencePct: 68 },
  { week: 4, plannedRunKm: 34, completedRunKm: 31.0, durationMinutes: 341, sessionsPlanned: 9, sessionsCompleted: 7, avgRpe: 6.8, hrZones: { z1: 30, z2: 38, z3: 18, z4: 10, z5: 4 }, thresholdMinutes: 30, strengthExposures: 2, hyroxStationMinutes: 45, readiness: 6, habitAdherencePct: 64 },
  { week: 5, plannedRunKm: 36, completedRunKm: 35.8, durationMinutes: 368, sessionsPlanned: 9, sessionsCompleted: 8, avgRpe: 6.7, hrZones: { z1: 28, z2: 40, z3: 18, z4: 10, z5: 4 }, thresholdMinutes: 32, strengthExposures: 2, hyroxStationMinutes: 50, readiness: 7, habitAdherencePct: 74 },
  { week: 6, plannedRunKm: 38, completedRunKm: 31.4, durationMinutes: 311, sessionsPlanned: 9, sessionsCompleted: 7, avgRpe: 5.9, hrZones: { z1: 34, z2: 42, z3: 14, z4: 8, z5: 2 }, thresholdMinutes: 20, strengthExposures: 1, hyroxStationMinutes: 62, readiness: 7, habitAdherencePct: 67 },
];

function habitDay(offsetFromToday: number, flags: [boolean, boolean, boolean, boolean, boolean]): LabHabitDay {
  const date = new Date("2026-08-22T12:00:00Z");
  date.setUTCDate(date.getUTCDate() - offsetFromToday);
  const iso = date.toISOString().slice(0, 10);
  const [hydration, mobility, stretching, sleep, nutrition] = flags;
  return { date: iso, hydration, mobility, stretching, sleep, nutrition };
}

const habits: LabHabitDay[] = [
  habitDay(0, [true, true, false, true, true]),
  habitDay(1, [true, true, true, true, true]),
  habitDay(2, [true, false, true, true, false]),
  habitDay(3, [true, true, true, false, true]),
  habitDay(4, [true, true, false, true, true]),
  habitDay(5, [false, true, true, true, true]),
  habitDay(6, [true, true, true, true, false]),
  habitDay(7, [true, false, false, true, true]),
  habitDay(8, [true, true, true, true, true]),
  habitDay(9, [true, true, false, false, true]),
  habitDay(10, [true, true, true, true, true]),
  habitDay(11, [false, true, true, true, false]),
  habitDay(12, [true, true, true, true, true]),
  habitDay(13, [true, false, true, true, true]),
];

export const ALEX_MORGAN_COMMUNITY_LAB = {
  athlete: {
    id: "lab-alex-morgan",
    firstName: "Alex",
    lastName: "Morgan",
    displayName: "Alex Morgan",
    email: "alex.morgan.lab@hybrid365.test",
    fictional: true as const,
  },
  programme: {
    title: "HYROX Performance — 12 Week Build",
    currentWeek: LAB_CURRENT_WEEK,
    totalWeeks: LAB_TOTAL_WEEKS,
    goal: "Sub-65 HYROX",
    nextRace: "HYROX London",
    weeklySessionsPlanned: 9,
    weeklySessionsCompleted: 7,
    runningTargetKm: 38,
    runningCompletedKm: 31.4,
  },
  labClock: {
    weekday: LAB_TODAY_WEEKDAY,
    note: "Lab day is pinned to Wednesday so Today stays stable.",
  },
  hyroxDetails,
  week6Sessions,
  todaySessionKey: thresholdRun.sessionKey,
  week6Logs,
  weekTracking,
  testing,
  progressHistory,
  habits,
  feedbackHints: [
    "You completed a high-load session yesterday. Keep today's easy work genuinely easy.",
    "Running volume is 8% higher than last week.",
    "You've completed 7 of 9 planned sessions.",
  ],
  liveCommunityRoutes: {
    dashboard: "/dashboard",
    programme: "/dashboard/programme",
    session: "drawer on /dashboard and /dashboard/programme (no session URL)",
    progress: "/dashboard/progress",
    checkIn: "/dashboard/check-in",
    habits: "/dashboard/habits",
    assessment: "/dashboard/assessment",
    testing: "/dashboard/testing",
  },
} as const;

export function labLogsByKey(): Record<string, MemberSessionLogRecord> {
  return Object.fromEntries(ALEX_MORGAN_COMMUNITY_LAB.week6Logs.map((row) => [row.session_key, row]));
}

export function labTodaySession(): MemberSessionDrawerSession {
  const session = ALEX_MORGAN_COMMUNITY_LAB.week6Sessions.find(
    (row) => row.sessionKey === ALEX_MORGAN_COMMUNITY_LAB.todaySessionKey
  );
  if (!session) throw new Error("Lab today session missing");
  return session;
}
