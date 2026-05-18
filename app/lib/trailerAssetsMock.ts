/**
 * Mock data for /internal/trailer-assets — trailer visuals only.
 * Not connected to production APIs or user data.
 */

export const TRAILER_HYROX_TEAM = {
  name: "Alex Morgan",
  programme: "Hyrox Pro Build",
  raceCountdownWeeks: 11,
  raceLabel: "Hyrox London · Pro",
  currentBlock: "Block 2 — Build the Engine",
  blockWeek: "Week 6 of 12",
  weeklyCompletionPct: 78,
  nextSession: {
    title: "Hyrox Compromised Run Session",
    day: "Saturday",
    duration: "55 min",
    rpe: "7–8",
  },
  coachFocus:
    "Threshold tolerance under station fatigue — keep Tuesday controlled and protect Sunday long run.",
  raceTarget: "sub-1:02",
};

export const TRAILER_WEEK_DAYS = [
  {
    day: "Monday",
    short: "Mon",
    title: "Lower Strength + Easy Run",
    duration: "75 min",
    rpe: "6–7",
    status: "complete" as const,
    note: "Tempo squats + 25 min easy flush — leave 2 reps in reserve on main lifts.",
  },
  {
    day: "Tuesday",
    short: "Tue",
    title: "Threshold Run",
    duration: "50 min",
    rpe: "7–8",
    status: "complete" as const,
    note: "5×5 min @ threshold — even splits, controlled breathing.",
  },
  {
    day: "Wednesday",
    short: "Wed",
    title: "Upper Strength",
    duration: "55 min",
    rpe: "6–7",
    status: "upcoming" as const,
    note: "Pulling volume + grip endurance for farmers carry.",
  },
  {
    day: "Thursday",
    short: "Thu",
    title: "Hyrox Station Conditioning",
    duration: "50 min",
    rpe: "7–8",
    status: "upcoming" as const,
    note: "Wall ball density + ski transitions — race rhythm, not max effort.",
  },
  {
    day: "Friday",
    short: "Fri",
    title: "Recovery / Mobility",
    duration: "25 min",
    rpe: "3–4",
    status: "upcoming" as const,
    note: "Optional flush — skip if fatigue is high.",
  },
  {
    day: "Saturday",
    short: "Sat",
    title: "Compromised Run Session",
    duration: "55 min",
    rpe: "7–8",
    status: "upcoming" as const,
    note: "Key session — stations into running, log transitions.",
  },
  {
    day: "Sunday",
    short: "Sun",
    title: "Long Zone 2",
    duration: "80 min",
    rpe: "4–5",
    status: "upcoming" as const,
    note: "Conversational pace — aerobic anchor for the week.",
  },
];

/** Weekly run volume (km) — weeks 1–12 with deloads at 4 and 8 */
export const TRAILER_RUN_VOLUME_WEEKS = [
  { week: 1, km: 24, deload: false },
  { week: 2, km: 26, deload: false },
  { week: 3, km: 28, deload: false },
  { week: 4, km: 22, deload: true },
  { week: 5, km: 30, deload: false },
  { week: 6, km: 32, deload: false },
  { week: 7, km: 36, deload: false },
  { week: 8, km: 28, deload: true },
  { week: 9, km: 38, deload: false },
  { week: 10, km: 40, deload: false },
  { week: 11, km: 42, deload: false },
  { week: 12, km: 32, deload: false },
];

export const TRAILER_5K_PROGRESSION = [
  { label: "Week 1", value: "20:42", kind: "baseline" as const },
  { label: "Week 4", value: "19:58", kind: "checkpoint" as const },
  { label: "Week 8", value: "19:21", kind: "checkpoint" as const },
  { label: "Week 12 Target", value: "18:45", kind: "target" as const },
];

export const TRAILER_THRESHOLD_PACE = {
  start: "4:15/km",
  end: "3:52/km",
  startSec: 255,
  endSec: 232,
  coachNote:
    "Controlled threshold progression based on benchmark testing, HR and RPE feedback.",
};

export const TRAILER_BENCHMARKS = [
  {
    name: "5km Run",
    previous: "20:42",
    current: "19:58",
    target: "18:45",
  },
  {
    name: "1km SkiErg",
    previous: "4:12",
    current: "3:58",
    target: "3:45",
  },
  {
    name: "1km Row",
    previous: "3:48",
    current: "3:36",
    target: "3:28",
  },
  {
    name: "Sled Push",
    previous: "1:42",
    current: "1:34",
    target: "1:28",
  },
  {
    name: "Sled Pull",
    previous: "1:38",
    current: "1:31",
    target: "1:24",
  },
  {
    name: "Wall Balls",
    previous: "88 reps",
    current: "100 reps",
    target: "100 unbroken",
  },
  {
    name: "Hyrox Simulation",
    previous: "1:09:40",
    current: "1:06:12",
    target: "sub-1:02",
  },
];

export const TRAILER_VOLUME_BLOCKS = [
  {
    name: "Block 1",
    subtitle: "Aerobic Base + Movement Quality",
    metrics: {
      runVolume: 62,
      ergVolume: 45,
      strengthEndurance: 55,
      hyroxSpecificity: 40,
      recoveryManagement: 70,
    },
  },
  {
    name: "Block 2",
    subtitle: "Threshold Development",
    metrics: {
      runVolume: 78,
      ergVolume: 65,
      strengthEndurance: 68,
      hyroxSpecificity: 58,
      recoveryManagement: 72,
    },
  },
  {
    name: "Block 3",
    subtitle: "Compromised Running + Station Tolerance",
    metrics: {
      runVolume: 88,
      ergVolume: 72,
      strengthEndurance: 82,
      hyroxSpecificity: 85,
      recoveryManagement: 68,
    },
  },
  {
    name: "Block 4",
    subtitle: "Race Prep + Taper",
    metrics: {
      runVolume: 55,
      ergVolume: 50,
      strengthEndurance: 60,
      hyroxSpecificity: 92,
      recoveryManagement: 90,
    },
  },
];

export const TRAILER_COMPROMISED_SESSION = {
  title: "Hyrox Compromised Run Session",
  objective:
    "Build running-under-fatigue tolerance with race-relevant station density — controlled aggression, not a daily max effort.",
  warmUp: [
    "8 min easy jog + dynamic prep",
    "2×20s strides @ relaxed pace",
    "Wall ball technique: 2×15 @ light load",
  ],
  mainWork: [
    "3 rounds: 400m run @ firm race pace → 20 wall balls → 250m SkiErg",
    "Rest 90s between rounds — transitions sharp, breathing controlled",
    "Finisher: 800m run @ steady-hard (RPE 7–8)",
  ],
  targetPace: "4:05–4:15/km on run segments",
  rpe: "7–8 on work intervals",
  coachingNotes: [
    "First run rep sets the tone — do not sprint rep one.",
    "Wall balls: smooth cycles, exhale on effort.",
    "Log transition times — we review trends in check-in.",
  ],
  scaling: [
    "Reduce to 2 rounds if sleep <6h or soreness ≥7/10.",
    "Swap SkiErg for row if shoulders are tight.",
    "Wall balls: 15 reps per set if grip is limiting.",
  ],
};

export const TRAILER_CHECK_IN = {
  sleep: "7.2 h avg",
  energy: "7 / 10",
  soreness: "4 / 10 (quads)",
  bodyweight: "78.4 kg",
  sessionsCompleted: "4 / 6",
  athleteNotes:
    "Tuesday threshold felt strong. Quads tight after Thursday stations — long run Sunday as planned.",
  coachStatus: "Reviewed — adjustments applied for next week",
};

export const TRAILER_COACH_ADJUSTMENTS = [
  "Reduce sled volume by 15%",
  "Keep threshold run unchanged",
  "Add wall ball EMOM finisher",
  "Move long run to Sunday",
  "Monitor quad soreness next week",
];

export const TRAILER_ONE_TO_ONE = {
  name: "Jordan Ellis",
  programme: "12-Week Hyrox Pro Build",
  raceTarget: "Hyrox Manchester Pro — sub-1:00",
  weekLabel: "Week 7 · Build the Engine",
  benchmarks: [
    { label: "5km", value: "19:12" },
    { label: "SkiErg 1km", value: "3:52" },
    { label: "Simulation", value: "1:04:30" },
  ],
  checkInStatus: "Submitted Tue · Coach reviewed",
  coachFeedback:
    "Threshold block is landing well. Keep Sunday long run easy — we are protecting legs for simulation week 8.",
  adjustmentNotes:
    "Sled push sets +1 rep; compromised session moved to Saturday for travel.",
};

export const TRAILER_COMMUNITY = {
  name: "Sam Rivera",
  programmeOptions: ["3-day Hybrid", "4-day Hybrid", "5-day Hyrox Priority"],
  activeProgramme: "5-day Hyrox Priority",
  weeklyChallenge: "March Engine Builder — 120 min threshold (team)",
  challengeRank: "#14 of 186",
  hyroxAddOn: "Station durability — Wall ball focus",
  leaderboardSnippet: [
    { rank: 1, name: "Ella K.", pts: 2840 },
    { rank: 2, name: "Marcus T.", pts: 2795 },
    { rank: 14, name: "Sam Rivera (you)", pts: 2410, highlight: true },
  ],
  education: ["Threshold pacing masterclass", "Sled mechanics", "Recovery for hybrid athletes"],
  checkInPrompt: "Weekly check-in due in 2 days — log sleep, energy and soreness.",
};

export const TRAILER_REEL_HEADLINES = [
  "I'm building a small Hyrox team.",
  "This is not a generic Hyrox plan.",
  "Your programme. Your check-ins. Your progress.",
  "Built for athletes who want structure.",
  "Applications opening soon.",
];
