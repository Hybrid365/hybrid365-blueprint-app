/** Personalised From Day One — compact Screen → Build → Track → Adapt. */

import { FREE_WEEK_ROUTES } from "@/app/lib/homepage/freeWeekRoutes";

export const PERSONALISED_COPY = {
  eyebrow: "Personalised from day one",
  headline: ["Data in.", "Better decisions out."],
  body: "We understand where you are now before deciding what comes next.",
  statement: ["Coached individually.", "Held to a team standard."],
  ctaLabel: "Start my athlete screening",
  ctaHref: FREE_WEEK_ROUTES.default,
} as const;

export type PersonalisedStage = {
  number: string;
  title: string;
  items: string[];
  microcopy: string;
};

export const PERSONALISED_STAGES: PersonalisedStage[] = [
  {
    number: "01",
    title: "Screen",
    items: ["Goals", "Current PBs", "Schedule", "Injury history"],
    microcopy: "We understand the athlete before building the week.",
  },
  {
    number: "02",
    title: "Build",
    items: ["Running", "Strength", "Recovery", "Progression"],
    microcopy: "Every session has a purpose within the wider plan.",
  },
  {
    number: "03",
    title: "Track",
    items: ["Completion", "Pace / load", "RPE", "Feedback"],
    microcopy: "Your programme stays connected to what is actually happening.",
  },
  {
    number: "04",
    title: "Adapt",
    items: ["Recovery", "Check-ins", "Benchmarks", "Programme changes"],
    microcopy: "Your feedback shapes what comes next.",
  },
];

export const ACCOUNTABILITY_STRIP = [
  "Daily accountability",
  "Weekly challenges",
  "Leaderboards",
  "Team standards",
] as const;
