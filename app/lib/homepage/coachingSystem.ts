/** Coaching system showcase — real UI cutouts, horizontal gallery. */

import type { PhoneScreenId } from "@/app/lib/homepage/phoneScreens";
import { FREE_WEEK_ROUTES } from "@/app/lib/homepage/freeWeekRoutes";

export const COACHING_SYSTEM_COPY = {
  eyebrow: "What you actually get",
  headline: ["Not a PDF.", "A complete coaching system."],
  body: "Your programme, sessions, feedback, benchmarks and progress—all in one clear coaching experience.",
  ctaLabel: "See what my free week looks like",
  ctaHref: FREE_WEEK_ROUTES.default,
} as const;

export type CoachingGalleryItem = {
  id: string;
  title: string;
  caption: string;
  screenId: PhoneScreenId;
};

export const COACHING_GALLERY: CoachingGalleryItem[] = [
  {
    id: "programme",
    title: "Your Programme",
    caption:
      "A structured training week with session purpose, coach notes and clear progression.",
    screenId: "programme",
  },
  {
    id: "session",
    title: "Session Detail",
    caption:
      "Know exactly what the session is building, the required intensity and how to execute it.",
    screenId: "threshold-run",
  },
  {
    id: "check-in",
    title: "Weekly Check-In",
    caption: "Sleep, energy, soreness, bodyweight and adherence shape the next decision.",
    screenId: "weekly-check-in",
  },
  {
    id: "overview",
    title: "Performance Overview",
    caption: "See changes in running, strength, consistency, readiness and body composition.",
    screenId: "progress-overview",
  },
  {
    id: "benchmarks",
    title: "Benchmark Testing",
    caption: "Measure the areas that matter and identify the next limiter.",
    screenId: "performance-testing",
  },
  {
    id: "accountability",
    title: "Accountability",
    caption:
      "Session completion, team standards, challenges and leaderboards keep the work visible.",
    screenId: "hybrid365-team",
  },
];
