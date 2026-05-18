/** Mock data for Hyrox Team athlete dashboard — wire to real APIs later. */

export type SessionStatus = "complete" | "upcoming" | "missed" | "modified";

export type HyroxSession = {
  id: string;
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
  priority: "Key" | "Supporting" | "Optional";
  intent: string;
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
  weeklyChangeKg: -0.2,
  series: [
    { week: 1, kg: 83.2 },
    { week: 2, kg: 82.9 },
    { week: 3, kg: 82.6 },
    { week: 4, kg: 82.4 },
  ],
  coachNote:
    "Trend is stable — priority is performance fuelling and recovery, not aggressive deficit. Use weight as a signal, not the goal.",
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

export const LOCKED_PREVIEW_MODULES = [
  { title: "Weekly training", preview: "7-day schedule · run + strength + hybrid" },
  { title: "Next session", preview: "Hyrox compromised · Thu" },
  { title: "Check-in & bodyweight", preview: "Recovery trends + weight chart" },
  { title: "Benchmarks", preview: "5km · Ski · Row · Stations" },
  { title: "Coach notes", preview: "Focus · adjustments · priorities" },
  { title: "Race prep", preview: "Pacing · fuelling · taper" },
];
