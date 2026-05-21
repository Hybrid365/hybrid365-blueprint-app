/** Mock data for Hyrox Team athlete dashboard — wire to real APIs later. */

export type SessionStatus = "complete" | "upcoming" | "missed" | "modified";

export type HyroxSession = {
  id: string;
  programmeWeekId?: string;
  day: string;
  dayShort: string;
  dateLabel: string;
  name: string;
  type: "Run" | "Strength" | "Hybrid" | "Recovery" | "Aerobic";
  focus: string;
  duration: string;
  rpeTarget: string;
  status: SessionStatus;
  loggedRpe?: string;
  logNotes?: string;
  logModifications?: string;
  logScore?: string;
  completedAt?: string | null;
  priority: "Key" | "Supporting" | "Optional";
  intent: string;
  timeOfDay?: "AM" | "Main" | "PM" | "Optional";
  coachNote?: string;
};

export const HYROX_BLOCKS = [
  { id: 1, name: "Build the Base", weeks: [1, 2, 3, 4] as const, dot: "bg-yellow-400" },
  { id: 2, name: "Build the Engine", weeks: [5, 6, 7, 8] as const, dot: "bg-amber-500" },
  { id: 3, name: "Race Performance", weeks: [9, 10, 11, 12] as const, dot: "bg-orange-500" },
] as const;

export const MOCK_ATHLETE = {
  name: "Alex Morgan",
  status: "Active Athlete" as const,
  raceCountdownWeeks: 11,
  raceLocation: "London",
  raceCategory: "Hyrox Open",
  race: "Hyrox London · Open",
  targetTime: "sub-1:05",
  blockPhase: "Build the Base",
  blockId: 1 as 1 | 2 | 3,
  currentWeek: 1,
  totalWeeks: 12,
  weeklyCompletionPct: 43,
  coachingFocus: "Aerobic base + station movement quality — protect easy runs and log RPE honestly.",
  weeklyFocus:
    "Establish repeatable station rhythm under fatigue. Keep Tuesday threshold controlled and Thursday as your key hybrid day.",
};

/** Mock: set true once coach publishes week — when false, athlete sees coach-build placeholder only. */
export const MOCK_ATHLETE_PROGRAMME_VISIBLE = false;

export const MOCK_WEEK_RATIONALE = {
  weekRole: "Foundation week 1",
  whyMatters:
    "We are building volume tolerance without spiking intensity. Every run should feel repeatable — save the race simulation for Thursday.",
  prioritise: [
    "Thursday Hyrox compromised session",
    "Tuesday threshold run — stay honest on pace",
    "Saturday long aerobic + stations",
  ],
  progressionFocus: "Introduce station density at sub-max effort. Running stays mostly aerobic.",
  coachNote: "If calf tightness persists, flag it in check-in before adding extra volume.",
};

export const MOCK_NEXT_SESSION = {
  sessionId: "w4",
  name: "Hyrox compromised session",
  day: "Thursday",
  dateLabel: "Thu 15 May",
  type: "Hybrid" as const,
  duration: "50 min",
  rpeTarget: "7–8",
  objective:
    "Station work into running — practice race rhythm without redlining early. Log transitions and first/last km splits.",
  coachNote: "Keep transitions sharp. You should finish feeling like you had 1–2 reps in reserve on wall balls.",
  priority: "Key" as const,
};

export const MOCK_UPCOMING: HyroxSession[] = [
  {
    id: "u1",
    day: "Thursday",
    dayShort: "Thu",
    dateLabel: "Thu 15 May",
    name: "Hyrox compromised session",
    type: "Hybrid",
    focus: "Stations → run",
    duration: "50 min",
    rpeTarget: "7–8",
    status: "upcoming",
    priority: "Key",
    intent: "Race-pace station transitions into running.",
  },
  {
    id: "u2",
    day: "Friday",
    dayShort: "Fri",
    dateLabel: "Fri 16 May",
    name: "Rest / mobility",
    type: "Recovery",
    focus: "Optional mobility only",
    duration: "20 min",
    rpeTarget: "—",
    status: "upcoming",
    priority: "Optional",
    intent: "Restore — no extra fatigue.",
  },
  {
    id: "u3",
    day: "Saturday",
    dayShort: "Sat",
    dateLabel: "Sat 17 May",
    name: "Long aerobic + stations",
    type: "Aerobic",
    focus: "Zone 2 + sled/row touch",
    duration: "75 min",
    rpeTarget: "6–7",
    status: "upcoming",
    priority: "Key",
    intent: "Build engine density — steady effort, crisp stations.",
  },
  {
    id: "u4",
    day: "Sunday",
    dayShort: "Sun",
    dateLabel: "Sun 18 May",
    name: "Optional recovery bike",
    type: "Recovery",
    focus: "Easy spin only if fresh",
    duration: "30 min",
    rpeTarget: "4–5",
    status: "upcoming",
    priority: "Optional",
    intent: "Flush legs — skip if fatigued.",
  },
];

export const MOCK_WEEK_SESSIONS: HyroxSession[] = [
  {
    id: "w1",
    day: "Monday",
    dayShort: "Mon",
    dateLabel: "Mon 12 May",
    name: "Lower strength + easy run",
    type: "Strength",
    focus: "Squat pattern + 25 min Z2 flush",
    duration: "70 min",
    rpeTarget: "7",
    status: "complete",
    loggedRpe: "7",
    priority: "Key",
    intent: "Strength base without compromising tomorrow's run.",
  },
  {
    id: "w2",
    day: "Tuesday",
    dayShort: "Tue",
    dateLabel: "Tue 13 May",
    name: "Threshold run",
    type: "Run",
    focus: "20 min @ threshold + warm-up/cool-down",
    duration: "50 min",
    rpeTarget: "7–8",
    status: "complete",
    loggedRpe: "7",
    priority: "Key",
    intent: "Controlled discomfort — repeatable, not heroic.",
  },
  {
    id: "w3",
    day: "Wednesday",
    dayShort: "Wed",
    dateLabel: "Wed 14 May",
    name: "Upper strength",
    type: "Strength",
    focus: "Pull + press + carry (modified volume)",
    duration: "45 min",
    rpeTarget: "6",
    status: "modified",
    loggedRpe: "6",
    priority: "Supporting",
    intent: "Reduced sets — calf management per check-in.",
  },
  {
    id: "w4",
    day: "Thursday",
    dayShort: "Thu",
    dateLabel: "Thu 15 May",
    name: "Hyrox compromised session",
    type: "Hybrid",
    focus: "Station work into running",
    duration: "50 min",
    rpeTarget: "7–8",
    status: "upcoming",
    priority: "Key",
    intent: "Key session — race rhythm practice.",
  },
  {
    id: "w5",
    day: "Friday",
    dayShort: "Fri",
    dateLabel: "Fri 16 May",
    name: "Rest / mobility",
    type: "Recovery",
    focus: "Optional mobility only",
    duration: "20 min",
    rpeTarget: "—",
    status: "upcoming",
    priority: "Optional",
    intent: "Restore ahead of Saturday.",
  },
  {
    id: "w6",
    day: "Saturday",
    dayShort: "Sat",
    dateLabel: "Sat 17 May",
    name: "Long aerobic + stations",
    type: "Aerobic",
    focus: "Zone 2 + sled/row touch",
    duration: "75 min",
    rpeTarget: "6–7",
    status: "upcoming",
    priority: "Key",
    intent: "Longest session of the week — fuel and hydrate.",
  },
  {
    id: "w7",
    day: "Sunday",
    dayShort: "Sun",
    dateLabel: "Sun 18 May",
    name: "Optional recovery bike",
    type: "Recovery",
    focus: "Easy spin if fresh",
    duration: "30 min",
    rpeTarget: "4–5",
    status: "upcoming",
    priority: "Optional",
    intent: "Optional flush — skip if heavy legs.",
  },
];

export const MOCK_PROGRESS_STATS = {
  sessionsCompleted: 2,
  sessionsPlanned: 6,
  weeklyCompletionPct: 43,
  checkInStreak: 3,
  blockProgressPct: 8,
  blockLabel: "Week 1 of 12 · Block 1",
  weeklyRunKm: 28,
  weeklyRunKmPlanned: 34,
  trainingHours: 4.2,
  trainingHoursPlanned: 8.5,
  avgSessionRpe: 6.7,
  missedSessions: 0,
  modifiedSessions: 1,
  weeklyLoad: "Moderate — base phase",
};

export const MOCK_THIS_WEEK_TRACKING = {
  consistencyLabel: "43% session completion · on track for Week 1 base targets",
  sessions: { completed: 2, planned: 6 },
  runs: { completed: 1, planned: 2 },
  strength: { completed: 1, planned: 2 },
  hybrid: { completed: 0, planned: 1 },
  checkInComplete: false,
};

export const MOCK_CHECK_IN = {
  status: "Due" as "Due" | "Submitted" | "Coach reviewed",
  dueLabel: "Sunday 18 May",
  lastSummary: {
    week: 0,
    sleep: "7.2 h avg",
    energy: "7/10",
    stress: "4/10",
    soreness: "5/10 calves",
    bodyweight: "82.6 kg",
    sessionsCompleted: "2 / 4",
    availability: "Full week except Wed PM",
    note: "Calf tight — eased Wednesday upper session.",
  },
  tracks: [
    "Sleep & energy",
    "Stress & soreness",
    "Pain / niggles",
    "Bodyweight",
    "Session completion",
    "Next week availability",
  ],
  lastMetrics: {
    bodyweight: "82.6 kg",
    sleep: "7.2 h",
    energy: "7/10",
    recovery: "6/10",
  },
};

export const MOCK_BODYWEIGHT = {
  startKg: 83.2,
  currentKg: 82.4,
  targetKg: 82.0,
  targetRange: { min: 81.5, max: 83.0 },
  weeklyChangeKg: -0.2,
  weeklyTrendKg: -0.2,
  series: [
    { week: 1, kg: 83.2 },
    { week: 2, kg: 82.9 },
    { week: 3, kg: 82.6 },
    { week: 4, kg: 82.4 },
  ],
  coachNote:
    "Trend is stable — priority is performance fuelling and recovery, not aggressive deficit. Use weight as a signal, not the goal.",
  performanceCoachNote:
    "Bodyweight is tracked to support performance, fuelling and power-to-weight — not just fat loss.",
};

export const MOCK_BENCHMARKS = [
  { test: "5km run", baseline: "22:42", latest: "22:14", change: "28s faster", positive: true },
  { test: "1km SkiErg", baseline: "4:18", latest: "4:02", change: "16s faster", positive: true },
  { test: "1km RowErg", baseline: "4:05", latest: "3:58", change: "7s faster", positive: true },
  { test: "Wall balls", baseline: "72 ub", latest: "78 ub", change: "+6 reps", positive: true },
  { test: "Mini compromised run test", baseline: "—", latest: "—", change: "Submit Week 2", positive: false },
  { test: "Sandbag lunges", baseline: "90 m / 20 kg", latest: "100 m", change: "+10 m", positive: true },
  { test: "Farmer's carry", baseline: "200 m / 2×24 kg", latest: "200 m / 2×28 kg", change: "Heavier", positive: true },
  { test: "Weekly run volume", baseline: "24 km", latest: "28 km", change: "+4 km", positive: true },
];

export const MOCK_BENCHMARK_SNAPSHOT = [
  { label: "5km run", latest: "22:14", change: "28s faster", logged: true },
  { label: "1km SkiErg", latest: "4:02", change: "16s faster", logged: true },
  { label: "Wall balls", latest: "78 ub", change: "+6 reps", logged: true },
  { label: "Mini compromised", latest: "Not logged", change: null, logged: false },
  { label: "Sandbag lunges", latest: "100 m", change: "+10 m", logged: true },
  { label: "Run volume", latest: "28 km", change: "+4 km", logged: true },
];

export const MOCK_PERFORMANCE_PROFILE = {
  athleteType: "Hybrid engine-builder",
  mainLimiter: "Running under fatigue (late-race fade)",
  secondaryLimiter: "Wall ball muscular endurance",
  strengths: ["Row / Ski rhythm", "Strength base", "Training consistency"],
  weaknesses: ["Sled pacing", "BBJ efficiency", "Compromised run splits"],
  weeklyStructure: "4 training days · 2 runs · 2 strength · 1 hybrid · optional recovery",
  firstBlockFocus: "Aerobic density, movement quality, repeatable station work — no race-week intensity yet.",
};

export const MOCK_COACH_NOTES = {
  currentFocus: "Build aerobic base while ingraining efficient station transitions.",
  recentAdjustment: "Wednesday upper strength reduced — calf management per check-in.",
  nextPriority: "Complete mini compromised test before end of Week 2.",
  avoidThisWeek: "No extra HIIT, random leg burnout, or unplanned long runs outside plan.",
  whyThisWeek:
    "Week 1 is a foundation block: aerobic density, movement quality on stations, and controlled threshold exposure — not race-week intensity. Every session should feel repeatable.",
};

export const MOCK_RACE_PREP = {
  locked: true,
  targetRunPace: "4:35–4:45 /km average (race sim TBC Week 8)",
  stationStrategy: "Conservative sled 1 · steady row/ski · wall balls in sets of 15",
  fuelling: "Carb focus 24h pre-race · practice in long session Week 8",
  taper: "Unlocks Week 10 — volume drops, sharpness rises",
  raceDayChecklist: "Kit, warm-up, pacing card, transition plan, fuelling timeline",
};

export const MOCK_RESOURCES = [
  { title: "Race-day guide", desc: "Warm-up, pacing, transitions", icon: "flag" },
  { title: "Fuelling guide", desc: "Training & race-week nutrition", icon: "fuel" },
  { title: "Wall ball technique", desc: "Efficiency & breathing", icon: "ball" },
  { title: "Sled push / pull guide", desc: "Body position & leg drive", icon: "sled" },
  { title: "Compromised running guide", desc: "Pacing after station work", icon: "run" },
  { title: "Taper / race week guide", desc: "Week 10–12 protocol", icon: "taper" },
  { title: "Recovery guide", desc: "Sleep, mobility, deload signals", icon: "recovery" },
];

export const DASHBOARD_SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "this-week", label: "This Week" },
  { id: "next-session", label: "Next Session" },
  { id: "progress", label: "Progress" },
  { id: "benchmarks", label: "Benchmarks" },
  { id: "check-in", label: "Check-In" },
  { id: "coach-notes", label: "Coach Notes" },
  { id: "feedback", label: "Feedback" },
  { id: "race-prep", label: "Race Prep" },
  { id: "resources", label: "Resources" },
] as const;

export type DashboardSectionId = (typeof DASHBOARD_SECTIONS)[number]["id"];

export type SessionDetail = {
  sessionId: string;
  weekLabel: string;
  categoryTag: string;
  objective: string;
  durationMin: number;
  rpeTarget: string;
  hrZone: string;
  targetPaceLoad: string;
  tags: string[];
  warmUp: string[];
  mainSet: string[];
  coolDown: string[];
  coachNote: string;
  recordFields: string[];
  filmPrompt?: string;
};

export const MOCK_SESSION_DETAILS: Record<string, SessionDetail> = {
  w2: {
    sessionId: "w2",
    weekLabel: "Tuesday · Week 1",
    categoryTag: "Running",
    objective:
      "Build threshold capacity with controlled tempo efforts. Maintain consistent pace without chasing speed on rep one.",
    durationMin: 50,
    rpeTarget: "7–8",
    hrZone: "Z4",
    targetPaceLoad: "Threshold pace from 5km test — even splits",
    tags: ["Key Session", "Threshold"],
    warmUp: [
      "10 min easy jog at conversational pace",
      "Dynamic drills: A-skips, B-skips, high knees",
      "4 × 20 m strides building to 80%",
    ],
    mainSet: ["20 min continuous @ threshold pace", "or 4 × 5 min @ threshold · 60 sec jog recovery"],
    coolDown: ["8–10 min easy jog", "Light calf stretch"],
    coachNote: "Stay even — finish with 1–2 reps in reserve. Log every km split.",
    recordFields: ["Average pace", "RPE", "HR average", "Notes on legs"],
    filmPrompt: "Optional: screenshot threshold splits for coach review",
  },
  w4: {
    sessionId: "w4",
    weekLabel: "Thursday · Week 1",
    categoryTag: "Hyrox",
    objective:
      "Station work into running — practice race rhythm without redlining early. Log transitions and first/last km splits.",
    durationMin: 50,
    rpeTarget: "7–8",
    hrZone: "Z3–Z4",
    targetPaceLoad: "Controlled race effort on runs — not all-out",
    tags: ["Key Session", "Hyrox"],
    warmUp: ["10 min easy row or jog", "Station activation: sled, wall ball prep"],
    mainSet: [
      "3 rounds: 500 m row → 20 wall balls → 400 m run @ controlled race effort",
      "2 min easy between rounds",
    ],
    coolDown: ["10 min easy bike flush", "Mobility: hips, calves"],
    coachNote: "Keep transitions sharp. Finish feeling like 1–2 reps in reserve on wall balls.",
    recordFields: ["Round times", "Run splits", "Transition quality (1–5)"],
    filmPrompt: "Record transition work during the Hyrox session",
  },
  w1: {
    sessionId: "w1",
    weekLabel: "Monday · Week 1",
    categoryTag: "Strength",
    objective: "Lower strength foundation with a short easy aerobic flush — protect Tuesday threshold.",
    durationMin: 70,
    rpeTarget: "6–7",
    hrZone: "—",
    targetPaceLoad: "Top sets @ RPE 7 · easy run truly Z2",
    tags: ["Strength", "Running"],
    warmUp: ["5 min bike", "Goblet squat × 10", "RDL patterning"],
    mainSet: ["Back squat 4 × 5", "RDL 3 × 8", "25 min easy Z2 run"],
    coolDown: ["5 min walk", "Calf stretch"],
    coachNote: "Good foundation work. Keep the easy run truly easy.",
    recordFields: ["Top set RPE", "Easy run pace feel"],
  },
};

export function getSessionDetail(sessionId: string): SessionDetail {
  return (
    MOCK_SESSION_DETAILS[sessionId] ?? {
      sessionId,
      weekLabel: "Session",
      categoryTag: "Training",
      objective: "Complete prescribed work at target RPE. Log honestly for coach review.",
      durationMin: 45,
      rpeTarget: "7",
      hrZone: "—",
      targetPaceLoad: "Per programme prescription",
      tags: ["Session"],
      warmUp: ["10 min easy movement prep"],
      mainSet: ["Follow programme prescription"],
      coolDown: ["5–10 min easy flush"],
      coachNote: "Flag pain or excessive fatigue in your weekly check-in.",
      recordFields: ["Session RPE", "Completion notes"],
    }
  );
}

export const MOCK_PERFORMANCE_METRICS = {
  raceReadiness: { value: 68, delta: "+4% this block", trend: "up" as const },
  consistency: { value: 87, delta: "+5%", trend: "up" as const },
  runningFitness: { value: 8, label: "↑ Building", unit: "%", trend: "up" as const },
  strengthEndurance: { value: 10, label: "↑ Base", unit: "%", trend: "up" as const },
  stationTolerance: { value: 12, label: "↑ Early", unit: "%", trend: "up" as const },
  compromisedRunning: {
    currentPct: 52,
    targetPct: 65,
    improvement: "+6% vs baseline",
  },
};

export const MOCK_THRESHOLD_CHART = [
  { week: "W1", minutes: 24, deload: false },
  { week: "W2", minutes: 30, deload: false },
  { week: "W3", minutes: 36, deload: false },
  { week: "W4", minutes: 22, deload: true },
  { week: "W5", minutes: 38, deload: false },
  { week: "W6", minutes: 44, deload: false },
  { week: "W7", minutes: 48, deload: false },
  { week: "W8", minutes: 31, deload: true },
];

export const MOCK_RUN_VOLUME_CHART = [
  { week: "W1", km: 25, deload: false, race: false, peak: false },
  { week: "W2", km: 31, deload: false, race: false, peak: false },
  { week: "W3", km: 36, deload: false, race: false, peak: false },
  { week: "W4", km: 24, deload: true, race: false, peak: false },
  { week: "W5", km: 38, deload: false, race: false, peak: false },
  { week: "W6", km: 42, deload: false, race: false, peak: false },
  { week: "W7", km: 48, deload: false, race: false, peak: false },
  { week: "W8", km: 32, deload: true, race: false, peak: false },
  { week: "W9", km: 44, deload: false, race: false, peak: false },
  { week: "W10", km: 50, deload: false, race: false, peak: true },
  { week: "W11", km: 41, deload: false, race: false, peak: false },
  { week: "W12", km: 22, deload: false, race: true, peak: false },
];

export const MOCK_THRESHOLD_SUMMARY = {
  currentMinutes: 24,
  targetMinutes: 55,
  growthPct: "On track",
  startMinutes: 24,
};

export const MOCK_RUN_VOLUME_SUMMARY = {
  currentKm: 28,
  peakKm: 50,
  peakWeek: 10,
  totalKm: 443,
  growthFromWeek1: "Week 1 base",
};

export type TrainingWeekStatus = "build" | "deload" | "race";

export const MOCK_TRAINING_LOAD = {
  weeklyHours: 4.2,
  weeklyHoursPlanned: 8.5,
  weeklyRunKm: 28,
  weeklyRunKmPlanned: 34,
  thresholdMinutes: 24,
  thresholdMinutesPlanned: 30,
  easyAerobicMinutes: 85,
  easyAerobicMinutesPlanned: 100,
  strengthSessions: 2,
  strengthSessionsPlanned: 2,
  hyroxSessions: 1,
  hyroxSessionsPlanned: 1,
  sessionCompletionPct: 43,
  sessionsCompleted: 2,
  sessionsPlanned: 6,
  blockWeek: 1,
  blockName: "Build the Base",
  blockPhase: "Build the Base",
  weekStatus: "build" as TrainingWeekStatus,
  weekStatusLabel: "Foundation week — prioritise consistency and movement quality",
};

export const MOCK_PROGRESS_INTERPRETATION = [
  { title: "Current focus", body: "Build aerobic volume before increasing threshold load" },
  { title: "Deload logic", body: "Week 4 reduces volume so the athlete can absorb training" },
  { title: "Next progression", body: "Longer threshold intervals before increasing speed" },
] as const;

export const MOCK_PROGRESS_COPY = {
  thresholdInterpretation:
    "Threshold time is progressed gradually to build sustainable Hyrox race pace without drifting into grey-zone fatigue.",
  runVolumeNote:
    "Run volume builds progressively, while extra aerobic work can be added through bike, SkiErg and RowErg to protect key run sessions.",
  bodyweightNote:
    "Bodyweight is tracked to support performance, fuelling and power-to-weight — not just fat loss.",
};

export const MOCK_CHECK_IN_FORM = {
  status: "Not Submitted" as "Not Submitted" | "Submitted" | "Coach reviewed",
  coachReviewStatus: "Pending submission",
  dueLabel: "Week 1 · Due Sunday",
  sleep: 7,
  energy: 7,
  stress: 4,
  soreness: 5,
  recovery: 6,
  bodyweightKg: 82.4,
  targetRange: { min: 81.5, max: 83.0 },
  sessionsCompleted: 2,
  sessionsPlanned: 6,
  painNiggles: "Mild calf tightness — eased Wednesday upper session",
  biggestWin: "Completed both key sessions with honest RPE",
  biggestStruggle: "Energy dip mid-week — sleep was inconsistent",
  nextWeekAvailability: "Full week except Wednesday PM",
};

export const MOCK_PROGRESS_METHODOLOGY_TAGS = [
  "Aerobic base",
  "Threshold volume",
  "Deload week",
  "Run volume",
  "Race specificity",
  "Recovery-led adjustments",
] as const;

export const MOCK_COACHING_HISTORY = [
  { week: 0, label: "Testing week", summary: "Baseline benchmarks logged · programme build started" },
  { week: 1, label: "Current", summary: "Foundation block · aerobic density focus" },
] as const;

export const MOCK_BENCHMARKS_TRACKER = [
  {
    id: "5k",
    name: "5km run",
    baseline: "22:42",
    latest: "22:14",
    target: "21:30",
    change: "28s faster",
    positive: true,
    progressPct: 62,
  },
  {
    id: "10k",
    name: "10km run",
    baseline: "—",
    latest: "—",
    target: "Log Week 4",
    change: "Not yet tested",
    positive: false,
    progressPct: 0,
  },
  {
    id: "ski",
    name: "1km SkiErg",
    baseline: "4:18",
    latest: "4:02",
    target: "3:55",
    change: "16s faster",
    positive: true,
    progressPct: 68,
  },
  {
    id: "row",
    name: "1km RowErg",
    baseline: "4:05",
    latest: "3:58",
    target: "3:45",
    change: "7s faster",
    positive: true,
    progressPct: 58,
  },
  {
    id: "wall",
    name: "Wall balls",
    baseline: "72 ub",
    latest: "78 ub",
    target: "85 ub",
    change: "+6 reps",
    positive: true,
    progressPct: 55,
  },
  {
    id: "mini",
    name: "Mini compromised run test",
    baseline: "—",
    latest: "—",
    target: "Log Week 2",
    change: "Submit Week 2",
    positive: false,
    progressPct: 0,
  },
  {
    id: "lunges",
    name: "Sandbag lunges",
    baseline: "90 m / 20 kg",
    latest: "100 m",
    target: "120 m",
    change: "+10 m",
    positive: true,
    progressPct: 45,
  },
  {
    id: "farmers",
    name: "Farmer's carry",
    baseline: "200 m / 2×24 kg",
    latest: "200 m / 2×28 kg",
    target: "200 m / 2×32 kg",
    change: "Heavier",
    positive: true,
    progressPct: 50,
  },
  {
    id: "runvol",
    name: "Weekly run volume",
    baseline: "24 km",
    latest: "28 km",
    target: "34 km",
    change: "+4 km",
    positive: true,
    progressPct: 40,
  },
] as const;

export const MOCK_FEEDBACK_PROMPTS = {
  intro:
    "These prompts support coaching feedback, movement review, accountability and social proof. Complete what applies this week.",
  items: [
    {
      id: "wb",
      title: "Film final wall ball set",
      detail: "Last set of Thursday Hyrox session — full reps, breathing visible",
    },
    {
      id: "sled",
      title: "Send sled push video to Telegram",
      detail: "Side angle · 10 m acceleration focus",
    },
    {
      id: "splits",
      title: "Screenshot threshold run splits",
      detail: "Tuesday threshold — upload watch or app screenshot",
    },
    {
      id: "trans",
      title: "Record transition work during Hyrox session",
      detail: "Station → run transitions · 15–30 sec clip",
    },
    {
      id: "race",
      title: "Upload race prep clips when relevant",
      detail: "Unlocks closer to race week — pacing rehearsals",
    },
  ],
} as const;

export const LOCKED_PREVIEW_MODULES = [
  { title: "Weekly training", preview: "7-day schedule · run + strength + hybrid" },
  { title: "Next session", preview: "Hyrox compromised · Thu" },
  { title: "Check-in & bodyweight", preview: "Recovery trends + weight chart" },
  { title: "Benchmarks", preview: "5km · Ski · Row · Stations" },
  { title: "Coach notes", preview: "Focus · adjustments · priorities" },
  { title: "Race prep", preview: "Pacing · fuelling · taper" },
];
