/**
 * Hybrid Challenge — static copy & weekly workout spec (Milestone 14).
 * No I/O; safe for future admin / Whop automation.
 */

export const HYBRID_CHALLENGE_NAME = "Hybrid Challenge";
export const HYBRID_CHALLENGE_TAGLINE = "Train. Track. Prove.";
export const HYBRID_CHALLENGE_DURATION_WEEKS = 6;

export const HYBRID_CHALLENGE_RULES: string[] = [
  "Complete your scheduled training week where possible — no missed training days when life allows.",
  "Run at least 2× per week.",
  "Lift / strength-hybrid at least 2× per week.",
  "Recover properly (sleep, mobility, easy days as programmed).",
  "Hit daily accountability habits.",
  "Submit your weekly check-in.",
  "Complete the weekly challenge workout and log your score.",
  "Post proof in the community / Telegram.",
  "Optional: share session cards and tag @hybrid.365 for social proof.",
];

/** Provisional scoring — habits/check-ins/sessions; challenge submission points auto-award on submit (see weeklyChallengeSubmission). */
export const HYBRID_CHALLENGE_POINTS = {
  /** Per habit tick (water, protein, steps, sleep, mobility, proof) for that calendar day. */
  habitPerCompletion: 5,
  /** Once per programme week when a weekly check-in exists. */
  weeklyCheckIn: 25,
  /** Per completed session log in challenge-relevant programme weeks (v1 cap: weeks 1–6). */
  sessionComplete: 10,
  /**
   * Auto-awarded when a member submits that week’s challenge workout (status approved on insert).
   * Admin can still lower to 0 or reject in Supabase if proof is invalid.
   */
  weeklyChallengeSubmission: 25,
} as const;

export type ChallengeWeekSpec = {
  week: number;
  challengeKey: string;
  title: string;
  purpose: string;
  workoutLines: string[];
  scalingNote: string | null;
  scoreFormat: string;
  /** Primary field we ask for in the submit modal. */
  primaryScore: "time" | "time_total" | "reps_rounds" | "time_for_time";
  beginnerOption: string | null;
};

export const HYBRID_CHALLENGE_WEEKS: readonly ChallengeWeekSpec[] = [
  {
    week: 1,
    challengeKey: "week-1-baseline-engine",
    title: "Baseline Engine",
    purpose: "Day 1 sets baseline — establish your engine reference.",
    workoutLines: [
      "5 km time trial (hard, even effort).",
      "Record total time as your score.",
    ],
    scalingNote: "Beginner option: 3 km time trial — still score as total time.",
    scoreFormat: "Time (mm:ss or total minutes)",
    primaryScore: "time",
    beginnerOption: "3 km time trial",
  },
  {
    week: 2,
    challengeKey: "week-2-erg-engine",
    title: "Erg Engine",
    purpose: "Build repeatable power on SkiErg and Row.",
    workoutLines: [
      "1 km SkiErg for time.",
      "Rest as needed, then 1 km Row for time.",
      "Score: combined time (Ski + Row).",
    ],
    scalingNote: "No machine: 12-minute run for max distance — score distance in metres.",
    scoreFormat: "Total time (Ski + Row) or run distance (m)",
    primaryScore: "time_total",
    beginnerOption: "12 min run distance",
  },
  {
    week: 3,
    challengeKey: "week-3-hybrid-density",
    title: "Hybrid Density",
    purpose: "Hybrid repeatability under fatigue.",
    workoutLines: [
      "12-minute AMRAP:",
      "· 10 burpees",
      "· 20 wall balls or goblet squats",
      "· 300 m run or 60 s bike",
      "Score: total rounds + partial reps (log as notes or numeric score).",
    ],
    scalingNote: "Use a single DB / KB weight you can move well for 12 minutes.",
    scoreFormat: "Rounds + reps (describe in proof note if needed)",
    primaryScore: "reps_rounds",
    beginnerOption: null,
  },
  {
    week: 4,
    challengeKey: "week-4-strength-endurance",
    title: "Strength Endurance",
    purpose: "Muscular endurance under time pressure.",
    workoutLines: [
      "For time:",
      "· 100 walking lunges",
      "· 80 push-ups",
      "· 60 DB snatches (switch arms as needed)",
      "· 40 burpees",
      "· 20 wall balls or goblet squats",
      "Score: total time.",
    ],
    scalingNote: "Scale push-ups to incline or knee; reduce DB load; partition reps if needed — note scaling in proof.",
    scoreFormat: "Time to complete",
    primaryScore: "time_for_time",
    beginnerOption: null,
  },
  {
    week: 5,
    challengeKey: "week-5-compromised-run",
    title: "Compromised Run",
    purpose: "Running legs under station fatigue.",
    workoutLines: [
      "4 rounds for total time:",
      "· 800 m run",
      "· 30 wall balls or goblet squats",
      "Score: total time for all four rounds.",
    ],
    scalingNote: "Reduce run to 600 m or wall balls to 20 if needed — note in proof.",
    scoreFormat: "Total time",
    primaryScore: "time_total",
    beginnerOption: null,
  },
  {
    week: 6,
    challengeKey: "week-6-final-test",
    title: "Final Test",
    purpose: "Repeat Week 1 test — compare to baseline.",
    workoutLines: [
      "Repeat the Week 1 test:",
      "· 5 km time trial (or 3 km beginner option)",
      "Score: total time.",
    ],
    scalingNote: "Same course / conditions as baseline if possible.",
    scoreFormat: "Time (compare to Week 1)",
    primaryScore: "time",
    beginnerOption: "3 km time trial",
  },
] as const;

export function getChallengeWeekSpec(week: number): ChallengeWeekSpec | null {
  const w = HYBRID_CHALLENGE_WEEKS.find((x) => x.week === week);
  return w ?? null;
}

export function displayChallengeWeek(programmeCurrentWeek: number | null): number {
  const cw = typeof programmeCurrentWeek === "number" && programmeCurrentWeek >= 1 ? programmeCurrentWeek : 1;
  return Math.min(HYBRID_CHALLENGE_DURATION_WEEKS, Math.max(1, cw));
}
