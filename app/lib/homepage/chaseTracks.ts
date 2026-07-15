/** What Are You Chasing? — three personalised coaching tracks. */

import { FREE_WEEK_ROUTES } from "@/app/lib/homepage/freeWeekRoutes";

export const TRACK_CHASE_COPY = {
  eyebrow: "Personalised coaching tracks",
  headline: "What are you chasing?",
  body: "One coaching system. Different priorities. Every programme built around the individual.",
  reassurance:
    "Your track sets the emphasis. It never places you into a generic template.",
} as const;

export type ChaseTrackId = "hyrox" | "run" | "hybrid";

export type ChaseTrack = {
  id: ChaseTrackId;
  number: string;
  title: string;
  identity: string;
  highlights: string[];
  personalisation: string;
  ctaLabel: string;
  href: string;
  selectedMessage: string;
};

export const CHASE_TRACKS: ChaseTrack[] = [
  {
    id: "hyrox",
    number: "01",
    title: "HYROX Performance",
    identity: "I want to race HYROX faster.",
    highlights: [
      "Faster HYROX running",
      "Stronger stations",
      "Better fatigue resistance",
      "Race-specific benchmarks",
    ],
    personalisation:
      "Built around your race date, division, current PB, limiters and available equipment.",
    ctaLabel: "Build my free HYROX week",
    href: FREE_WEEK_ROUTES.hyrox,
    selectedMessage: "We'll build your free week around HYROX Performance.",
  },
  {
    id: "run",
    number: "02",
    title: "Run Performance",
    identity: "I want to run a PB without losing strength.",
    highlights: [
      "Faster 5K / 10K / half marathon",
      "Threshold development",
      "Aerobic volume progression",
      "Running-supportive strength",
    ],
    personalisation:
      "Built around your PB, mileage, injury history, target event and available days.",
    ctaLabel: "Build my free run PB week",
    href: FREE_WEEK_ROUTES.run,
    selectedMessage: "We'll build your free week around Run Performance.",
  },
  {
    id: "hybrid",
    number: "03",
    title: "Strong. Fit. Fast.",
    identity: "I want to look athletic and perform like one.",
    highlights: [
      "Build strength and muscle",
      "Improve body composition",
      "Develop aerobic fitness",
      "Become a complete hybrid athlete",
    ],
    personalisation:
      "Built around your physique goal, training history, availability and preferred run/lift balance.",
    ctaLabel: "Build my free hybrid week",
    href: FREE_WEEK_ROUTES.hybrid,
    selectedMessage: "We'll build your free week around Strong. Fit. Fast.",
  },
];
