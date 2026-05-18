/** Mock data for Hyrox Team Launch trailer asset pack — not live user data. */

export const LAUNCH_OPENING_CARDS = [
  "HYROX EXPOSES EVERYTHING",
  "RUNNING. STRENGTH. STATIONS. MINDSET.",
  "REFUSING AVERAGE",
  "BUILT FOR ATHLETES WHO WANT MORE THAN GENERIC TRAINING",
];

export const LAUNCH_RANDOM_TRAINING = [
  "hard sessions",
  "no progression",
  "no testing",
  "no feedback",
  "no race-specific plan",
];

export const LAUNCH_STRUCTURED_TRAINING = [
  "personalised programme",
  "weekly check-ins",
  "benchmark testing",
  "progress tracking",
  "race-day execution",
];

export const LAUNCH_JOURNEY_STAGES = [
  { step: 1, label: "Apply" },
  { step: 2, label: "Get Accepted" },
  { step: 3, label: "Athlete Assessment" },
  { step: 4, label: "Testing Day" },
  { step: 5, label: "Programme Built" },
  { step: 6, label: "Weekly Check-Ins" },
  { step: 7, label: "Progress Tracking" },
  { step: 8, label: "Team Training" },
  { step: 9, label: "Hyrox Simulation" },
  { step: 10, label: "Race Prep" },
  { step: 11, label: "Race Week" },
  { step: 12, label: "Race Day" },
];

export const LAUNCH_WHATS_INCLUDED = [
  "1-1 Personalised Hyrox Programme",
  "Weekly Coaching Check-Ins",
  "Athlete Dashboard",
  "Benchmark Testing",
  "Progress Tracking",
  "Race-Specific Preparation",
  "Team Accountability",
  "Documented Journey",
  "Coach Feedback & Adjustments",
  "Testing Day to Race Day Process",
];

export const LAUNCH_TEAM_ATHLETE = {
  name: "Team Athlete 01",
  programme: "Hyrox Pro Build",
  raceLabel: "Hyrox London · Pro",
  raceCountdownWeeks: 9,
  currentWeek: "Week 8 of 12",
  phase: "Block 2 — Build the Engine",
  weeklyCompletionPct: 83,
  raceReadiness: 82,
  nextSession: { title: "Threshold Run + SkiErg Support", day: "Tuesday", duration: "95 min", rpe: "7–8" },
  coachNote:
    "Threshold tolerance improving. Keep Sunday long run conversational — we are building durability before the simulation block.",
  bodyweight: { start: "85.1", current: "82.4", range: "81–83" },
  thresholdTrend: "+18 min vs Week 1",
  weeklyRunKm: "37 km",
  benchmarks: [
    { label: "5km", value: "19:21" },
    { label: "Ski 1km", value: "3:43" },
    { label: "Simulation", value: "63:25" },
  ],
  checkInStatus: "Submitted · Coach reviewed",
};

export const LAUNCH_PROGRESS_METRICS = [
  { label: "Overall Race Readiness", value: 82, delta: null },
  { label: "Running Fitness", value: 86, delta: "+14%" },
  { label: "Strength Endurance", value: 84, delta: "+16%" },
  { label: "Station Tolerance", value: 81, delta: "+18%" },
  { label: "Compromised Running", value: 79, delta: "+11%" },
  { label: "Consistency Score", value: 87, delta: null },
];

export const LAUNCH_THRESHOLD_RUN_WEEKS = [
  { week: 1, min: 24, deload: false },
  { week: 2, min: 30, deload: false },
  { week: 3, min: 36, deload: false },
  { week: 4, min: 24, deload: true },
  { week: 5, min: 40, deload: false },
  { week: 6, min: 44, deload: false },
  { week: 7, min: 48, deload: false },
  { week: 8, min: 34, deload: true },
  { week: 9, min: 52, deload: false },
  { week: 10, min: 56, deload: false },
  { week: 11, min: 44, deload: false },
  { week: 12, min: 0, deload: false, race: true },
];

export const LAUNCH_RUN_VOLUME_WEEKS = [
  { week: 1, km: 24, deload: false },
  { week: 2, km: 28, deload: false },
  { week: 3, km: 31, deload: false },
  { week: 4, km: 24, deload: true },
  { week: 5, km: 34, deload: false },
  { week: 6, km: 37, deload: false },
  { week: 7, km: 40, deload: false },
  { week: 8, km: 32, deload: true },
  { week: 9, km: 42, deload: false },
  { week: 10, km: 44, deload: false },
  { week: 11, km: 38, deload: false },
  { week: 12, km: 0, deload: false, race: true },
];

export const LAUNCH_BODYWEIGHT_WEEKS = [
  { week: 1, kg: 85.1 },
  { week: 2, kg: 84.6 },
  { week: 3, kg: 84.0 },
  { week: 4, kg: 83.5 },
  { week: 5, kg: 83.2 },
  { week: 6, kg: 82.9 },
  { week: 7, kg: 82.6 },
  { week: 8, kg: 82.4 },
];

export const LAUNCH_BENCHMARKS = [
  { name: "5km Run", icon: "🏃", previous: "20:42", current: "19:21", target: "18:45", up: true },
  { name: "1km SkiErg", icon: "🎿", previous: "3:52", current: "3:43", target: "3:35", up: true },
  { name: "1km Row", icon: "🚣", previous: "3:38", current: "3:31", target: "3:25", up: true },
  { name: "Sled Push", icon: "🛷", previous: "1:18", current: "1:09", target: "1:05", up: true },
  { name: "Sled Pull", icon: "⛓", previous: "1:25", current: "1:15", target: "1:10", up: true },
  { name: "Wall Balls", icon: "⚽", previous: "75", current: "100 unbroken", target: "100", up: true },
  { name: "Hyrox Simulation", icon: "🏁", previous: "67:40", current: "63:25", target: "sub-1:02", up: true },
];

export const LAUNCH_CHECK_IN = {
  sleep: "7/10",
  energy: "8/10",
  soreness: "4/10",
  bodyweight: "82.4kg",
  sessionsCompleted: "5/6",
  athleteNote: "Threshold felt strong, legs heavy after sleds.",
  coachFeedback:
    "Keep Tuesday intensity. Reduce Thursday sled volume by 15%. Add wall ball EMOM finisher.",
};

export const LAUNCH_COACH_ADJUSTMENTS = [
  "Reduce sled volume by 15%",
  "Keep threshold run unchanged",
  "Add wall ball EMOM finisher",
  "Move long run to Sunday",
  "Monitor quad soreness",
];

export const LAUNCH_REFUSING_AVERAGE = [
  "Built for athletes who want more than generic training.",
  "Higher standards. Better structure. Full accountability.",
  "Personalised coaching. Team environment. Race-day execution.",
  "The Hybrid365 Hyrox Team.",
];

export const LAUNCH_DOCUMENTED_STAGES = [
  "Testing Day",
  "Weekly Training",
  "Check-Ins",
  "Progress Tracking",
  "Team Sessions",
  "Race Prep",
  "Race Day",
];

export const LAUNCH_MOBILE_SCREENS = [
  { id: "home", label: "Home", title: "Team Athlete 01", sub: "Week 8 · Hyrox Pro Build" },
  { id: "progress", label: "Progress", title: "Race Readiness", sub: "82% · +6% this block" },
  { id: "programme", label: "Programme", title: "This Week", sub: "6 sessions · 5 complete" },
  { id: "checkin", label: "Check-In", title: "Weekly Check-In", sub: "Due Sunday" },
  { id: "benchmarks", label: "Tests", title: "Benchmarks", sub: "7 tests tracked" },
  { id: "team", label: "Team", title: "Hyrox Team", sub: "Refusing Average" },
  { id: "race", label: "Race", title: "Race Timeline", sub: "9 weeks to go" },
  { id: "apply", label: "Apply", title: "Applications", sub: "Opening soon" },
];
