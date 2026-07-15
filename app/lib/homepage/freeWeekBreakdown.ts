/** Free training week — primary conversion section. */

import { FREE_WEEK_ROUTES } from "@/app/lib/homepage/freeWeekRoutes";

export const FREE_WEEK_BREAKDOWN_COPY = {
  eyebrow: "Your starting point",
  headline: ["See what better", "structure looks like."],
  body: "Choose your priority, share where you are now and receive a week structured around your goal, level and schedule.",
  reassurance: [
    "No generic template.",
    "No random workouts.",
    "No payment required.",
  ],
  ctaLabel: "Build my free training week",
  ctaHref: FREE_WEEK_ROUTES.default,
} as const;

export const FREE_WEEK_FEATURES = [
  "Personalised weekly structure",
  "Running and strength balance",
  "Session purpose",
  "Intensity and RPE guidance",
  "Schedule considered",
  "Equipment considered",
  "Current level considered",
  "Clear next step",
] as const;
