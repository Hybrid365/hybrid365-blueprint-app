/** What Are You Chasing? — three personalised coaching tracks. */

import { FREE_WEEK_ROUTES } from "@/app/lib/homepage/freeWeekRoutes";

export const TRACK_CHASE_COPY = {
  eyebrow: "Personalised coaching tracks",
  headline: "What are you chasing?",
  body: "One coaching system. Different priorities. Every programme built around the individual.",
  reassurance: "Your track sets the emphasis. It does not place you into a generic template.",
} as const;

export type ChaseTrackId = "hyrox" | "run" | "hybrid";

export type ChaseTrack = {
  id: ChaseTrackId;
  number: string;
  title: string;
  identity: string;
  description: string;
  highlights: string[];
  personalisation: string;
  ctaLabel: string;
  href: string;
  selectedMessage: string;
  imageSrc: string;
  imageAlt: string;
};

export const CHASE_TRACKS: ChaseTrack[] = [
  {
    id: "hyrox",
    number: "01",
    title: "HYROX Performance",
    identity: "I want to race HYROX faster.",
    description:
      "Compromised running, station efficiency and race execution built around your next event.",
    highlights: [
      "Faster HYROX running",
      "Stronger stations",
      "Better fatigue resistance",
      "Race-specific benchmarks",
    ],
    personalisation:
      "Race date, division, current PB, limiters and equipment.",
    ctaLabel: "Build my free HYROX week",
    href: FREE_WEEK_ROUTES.hyrox,
    selectedMessage: "We'll build your free week around HYROX performance.",
    imageSrc: "/images/homepage/team/bobby-harrison-wall-ball.png",
    imageAlt: "HYROX station work — Hybrid365 athlete",
  },
  {
    id: "run",
    number: "02",
    title: "Run Performance",
    identity: "I want to run a PB without losing strength.",
    description:
      "Structured 5K, 10K or half development with strength that supports running rather than competing with it.",
    highlights: [
      "Faster 5K / 10K / half",
      "Threshold progression",
      "Aerobic volume",
      "Running-supportive strength",
    ],
    personalisation: "Current PB, mileage, injury history, days and target event.",
    ctaLabel: "Build my free run PB week",
    href: FREE_WEEK_ROUTES.run,
    selectedMessage: "We'll build your free week around run performance.",
    imageSrc: "/images/homepage/team/ben-kelly-training.png",
    imageAlt: "Ben Kelly — Hybrid365 run and hybrid training",
  },
  {
    id: "hybrid",
    number: "03",
    title: "Strong. Fit. Fast.",
    identity: "I want to look athletic and perform like one.",
    description:
      "Build muscle, get leaner and develop the engine to run well — physique and performance together.",
    highlights: [
      "Strength and muscle",
      "Body composition",
      "Aerobic fitness",
      "Complete hybrid athlete",
    ],
    personalisation:
      "Physique goal, training history, availability and run/lift balance.",
    ctaLabel: "Build my free hybrid week",
    href: FREE_WEEK_ROUTES.hybrid,
    selectedMessage: "We'll build your free week around Strong. Fit. Fast.",
    imageSrc: "/images/homepage/team/ricci-lee-jarvis-training.png",
    imageAlt: "Ricci-Lee Jarvis — Hybrid365 strength and hybrid training",
  },
];
