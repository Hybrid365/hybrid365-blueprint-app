/** Transparent cutout assets — generated from public/images/homepage/ui-screens/ */
export const HOMEPAGE_UI_MOCKUP_BASE = "/homepage/ui-mockups";

export type PhoneScreenId =
  | "programme"
  | "threshold-run"
  | "progress-overview"
  | "performance-testing"
  | "hybrid365-team"
  | "your-journey"
  | "threshold-progression"
  | "weekly-run-volume"
  | "weight-tracking"
  | "weekly-check-in"
  | "team-athlete-overview";

export type PhoneScreen = {
  id: PhoneScreenId;
  src: string;
  alt: string;
  title: string;
  description: string;
};

export const PHONE_SCREENS: Record<PhoneScreenId, PhoneScreen> = {
  programme: {
    id: "programme",
    src: `${HOMEPAGE_UI_MOCKUP_BASE}/programme.png`,
    alt: "Hybrid365 app — Your Programme weekly training plan",
    title: "Your Programme",
    description: "Structured weekly sessions with coach notes — not random workouts.",
  },
  "threshold-run": {
    id: "threshold-run",
    src: `${HOMEPAGE_UI_MOCKUP_BASE}/threshold-run.png`,
    alt: "Hybrid365 app — Threshold Run session detail",
    title: "Threshold Run",
    description: "Clear objectives, pacing targets and session structure for every run.",
  },
  "progress-overview": {
    id: "progress-overview",
    src: `${HOMEPAGE_UI_MOCKUP_BASE}/progress-overview.png`,
    alt: "Hybrid365 app — Performance Overview dashboard",
    title: "Progress Overview",
    description: "Race readiness, consistency and key performance metrics in one view.",
  },
  "performance-testing": {
    id: "performance-testing",
    src: `${HOMEPAGE_UI_MOCKUP_BASE}/performance-testing.png`,
    alt: "Hybrid365 app — Performance Testing benchmarks",
    title: "Performance Testing",
    description: "Running and station benchmarks tracked against targets.",
  },
  "hybrid365-team": {
    id: "hybrid365-team",
    src: `${HOMEPAGE_UI_MOCKUP_BASE}/hybrid365-team.png`,
    alt: "Hybrid365 app — Hybrid365 Team culture screen",
    title: "Hybrid365 Team",
    description: "Coached individually. Built as a team. Standards, not vibes.",
  },
  "your-journey": {
    id: "your-journey",
    src: `${HOMEPAGE_UI_MOCKUP_BASE}/your-journey.png`,
    alt: "Hybrid365 app — Your Journey from testing to race day",
    title: "Your Journey",
    description: "From assessment to race day — a clear roadmap with accountability.",
  },
  "threshold-progression": {
    id: "threshold-progression",
    src: `${HOMEPAGE_UI_MOCKUP_BASE}/threshold-progression.png`,
    alt: "Hybrid365 app — Threshold Progression chart",
    title: "Threshold Progression",
    description: "Watch threshold capacity build week over week with planned deloads.",
  },
  "weekly-run-volume": {
    id: "weekly-run-volume",
    src: `${HOMEPAGE_UI_MOCKUP_BASE}/weekly-run-volume.png`,
    alt: "Hybrid365 app — Weekly Run Volume progression",
    title: "Weekly Run Volume",
    description: "Progressive running volume managed for race-day performance.",
  },
  "weight-tracking": {
    id: "weight-tracking",
    src: `${HOMEPAGE_UI_MOCKUP_BASE}/weight-tracking.png`,
    alt: "Hybrid365 app — Weight Tracking dashboard",
    title: "Weight Tracking",
    description: "Body composition tracked against targets — look athletic, perform better.",
  },
  "weekly-check-in": {
    id: "weekly-check-in",
    src: `${HOMEPAGE_UI_MOCKUP_BASE}/weekly-check-in.png`,
    alt: "Hybrid365 app — Weekly Check-In accountability",
    title: "Weekly Check-In",
    description: "Sleep, energy, soreness and adherence — coach feedback every week.",
  },
  "team-athlete-overview": {
    id: "team-athlete-overview",
    src: `${HOMEPAGE_UI_MOCKUP_BASE}/team-athlete-overview.png`,
    alt: "Hybrid365 app — Team Athlete Overview dashboard",
    title: "Team Athlete Overview",
    description: "Your full coaching dashboard — sessions, progress and race countdown.",
  },
};

/** Hero: primary + supporting screens */
export const HERO_PHONE_SCREENS = {
  primary: "programme" as const,
  supporting: ["threshold-run", "progress-overview"] as const,
};

/** System / product carousel */
export const PRODUCT_PHONE_SCREENS: PhoneScreenId[] = [
  "programme",
  "threshold-run",
  "weekly-check-in",
  "progress-overview",
  "performance-testing",
  "team-athlete-overview",
];

/** Culture / team */
export const CULTURE_PHONE_SCREENS: PhoneScreenId[] = [
  "hybrid365-team",
  "your-journey",
];

/** Results / proof */
export const PROOF_PHONE_SCREENS: PhoneScreenId[] = [
  "threshold-progression",
  "weekly-run-volume",
  "weight-tracking",
  "performance-testing",
];

/** What you get — mapped to offer features */
export const WHAT_YOU_GET_PHONE_SCREENS: {
  screenId: PhoneScreenId;
  feature: string;
}[] = [
  { screenId: "weekly-check-in", feature: "Weekly accountability" },
  { screenId: "programme", feature: "Structured programming" },
  { screenId: "threshold-run", feature: "Session-level coaching" },
  { screenId: "team-athlete-overview", feature: "Full athlete dashboard" },
];

export function getPhoneScreen(id: PhoneScreenId): PhoneScreen {
  return PHONE_SCREENS[id];
}
