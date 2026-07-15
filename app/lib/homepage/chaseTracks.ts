/** What Are You Chasing? — three personalised coaching tracks. */

import { FREE_WEEK_ROUTES } from "@/app/lib/homepage/freeWeekRoutes";

export const TRACK_CHASE_COPY = {
  eyebrow: "Personalised coaching tracks",
  headline: "What are you chasing?",
  body: "One coaching system. Different priorities. Every programme built around the individual.",
  reassurance: "Your track sets the emphasis — it never puts you into a generic template.",
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
      "Improve compromised running, station efficiency, strength endurance and race execution through programming built around your next event.",
    highlights: [
      "Faster HYROX running",
      "Stronger stations",
      "Better fatigue resistance",
      "Race-specific benchmarks",
    ],
    personalisation:
      "Built around your race date, division, current PB, individual limiters and available equipment.",
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
      "Structured 5K, 10K or half-marathon development supported by strength work that improves durability rather than compromising running quality.",
    highlights: [
      "Faster 5K / 10K / half marathon",
      "Threshold progression",
      "Aerobic volume development",
      "Running-supportive strength",
    ],
    personalisation:
      "Built around your current PB, weekly mileage, injury history, available days and target event.",
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
      "Build muscle, improve conditioning, become leaner and develop the engine to run well — without having to choose between physique and performance.",
    highlights: [
      "Build strength and muscle",
      "Improve body composition",
      "Develop aerobic fitness",
      "Become a complete hybrid athlete",
    ],
    personalisation:
      "Built around your physique goal, training history, weekly availability and preferred balance of running and lifting.",
    ctaLabel: "Build my free hybrid week",
    href: FREE_WEEK_ROUTES.hybrid,
    selectedMessage: "We'll build your free week around Strong. Fit. Fast.",
    imageSrc: "/images/homepage/team/ricci-lee-jarvis-training.png",
    imageAlt: "Ricci-Lee Jarvis — Hybrid365 strength and hybrid training",
  },
];
