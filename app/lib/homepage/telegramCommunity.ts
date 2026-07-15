/** Telegram / free community funnel section. */

import { SECONDARY_LINKS } from "@/app/lib/homepage/homepageLinks";
import { FREE_WEEK_ROUTES } from "@/app/lib/homepage/freeWeekRoutes";

export const TELEGRAM_SECTION_COPY = {
  eyebrow: "The free Hybrid365 community",
  headline: ["Get the week.", "Join the team."],
  body: "Your free week gives you structure. The Hybrid365 Telegram community gives you the sessions, challenges and accountability to keep showing up.",
  reassurance: "Free sessions. Weekly challenges. Real accountability.",
  primaryCta: "Build my free training week",
  primaryHref: FREE_WEEK_ROUTES.default,
  secondaryCta: "Join the free Telegram",
  secondaryHref: SECONDARY_LINKS.telegram,
  steps: [
    { number: "01", title: "Build your personalised free week" },
    { number: "02", title: "Join Telegram and take part" },
  ],
  posted: [
    "Regular HYROX sessions",
    "Running sessions",
    "Lifting sessions",
    "Functional-fitness workouts",
    "Weekly challenges",
    "Leaderboards",
    "Training discussion",
    "Group accountability",
    "Community support",
  ],
} as const;
