/** Free training week breakdown — lead magnet storytelling. */

import { FREE_WEEK_ROUTES } from "@/app/lib/homepage/freeWeekRoutes";

export const FREE_WEEK_BREAKDOWN_COPY = {
  eyebrow: "Start with your week",
  headline: ["See what better", "structure looks like."],
  body: "Choose your priority, share where you are now and receive a week organised around your goal.",
  reassurance: [
    "No generic template.",
    "No random session generator.",
    "A real introduction to the Hybrid365 coaching method.",
  ],
  ctaLabel: "Build my free training week",
  ctaHref: FREE_WEEK_ROUTES.default,
  note: "Your volume, intensity and progression are built around your current level.",
} as const;

export const FREE_WEEK_FEATURES = [
  "Personalised weekly structure",
  "Running and strength balance",
  "Session purpose",
  "Intensity / RPE guidance",
  "Schedule considered",
  "Equipment considered",
  "Current level considered",
  "A clear next step",
] as const;
