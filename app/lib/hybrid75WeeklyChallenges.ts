import type { FreePlanSession } from "@/app/lib/freePlanDashboard";

export type Hybrid75WeeklyChallengeStatus = "active" | "coming_soon";

export type Hybrid75WeeklyChallengeDefinition = {
  weekNumber: number;
  status: Hybrid75WeeklyChallengeStatus;
  badge: string;
  title: string;
  shortTitle: string;
  workoutIntro?: string;
  movements?: string[];
  scoreLabel?: string;
  rules?: string[];
  points?: string[];
  proofCopy?: string;
  postFormat?: string[];
  comingSoonCopy?: string;
};

export const HYBRID75_CHALLENGE_HOME_TEASER =
  "400m run · 20 press-ups · 30 air squats · 400m run";

export const HYBRID75_WEEKLY_CHALLENGES: Hybrid75WeeklyChallengeDefinition[] = [
  {
    weekNumber: 1,
    status: "active",
    badge: "Week 1 · Active",
    title: "HYBRID HARD WEEK 1 — ENGINE TEST",
    shortTitle: "Engine Test",
    workoutIntro: "Complete as fast as possible:",
    movements: ["400m run", "20 press-ups", "30 air squats", "400m run"],
    scoreLabel: "Score = total time to complete.",
    rules: [
      "The full workout must be completed in order.",
      "Time starts when you begin the first 400m run.",
      "Time stops when you finish the final 400m run.",
      "Rest and breaks are included in your overall time.",
      "Treadmill users must set the treadmill to 1% incline.",
      "The challenge must be recorded to count for leaderboard placement.",
    ],
    points: [
      "+30 points for completing the challenge with proof",
      "+10 bonus points for the top 3 fastest times this week",
    ],
    proofCopy:
      "To count for the leaderboard, post your proof in the Telegram group or tag @kieranhiggsfit / @hybrid.365 on Instagram, then log the Hybrid Hard Challenge inside your dashboard.",
    postFormat: [
      "Name:",
      "Time:",
      "Treadmill/outdoor:",
      "Proof/video:",
      "RPE:",
      "Any notes:",
    ],
  },
  {
    weekNumber: 2,
    status: "coming_soon",
    badge: "Week 2",
    title: "Week 2 — Coming soon",
    shortTitle: "Week 2",
    comingSoonCopy:
      "Released weekly inside the Telegram group and updated here in your dashboard.",
  },
  {
    weekNumber: 3,
    status: "coming_soon",
    badge: "Week 3",
    title: "Week 3 — Coming soon",
    shortTitle: "Week 3",
    comingSoonCopy:
      "Released weekly inside the Telegram group and updated here in your dashboard.",
  },
  {
    weekNumber: 4,
    status: "coming_soon",
    badge: "Week 4",
    title: "Week 4 — Coming soon",
    shortTitle: "Week 4",
    comingSoonCopy:
      "Released weekly inside the Telegram group and updated here in your dashboard.",
  },
];

export function getActiveHybrid75WeeklyChallenge(): Hybrid75WeeklyChallengeDefinition | undefined {
  return HYBRID75_WEEKLY_CHALLENGES.find((w) => w.status === "active");
}

/** Schedule session used for dashboard challenge logging. */
export function findHybridHardChallengeSession(
  sessions: FreePlanSession[]
): FreePlanSession | undefined {
  return sessions.find(
    (s) =>
      s.hybrid75Role === "challenge" ||
      s.category === "Challenge" ||
      s.title.toLowerCase().includes("hybrid hard")
  );
}
