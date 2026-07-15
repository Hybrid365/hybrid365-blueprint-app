/** How it works — four-step coaching timeline. */

import { FREE_WEEK_ROUTES } from "@/app/lib/homepage/freeWeekRoutes";

export const HOW_IT_WORKS_V2_COPY = {
  eyebrow: "How it works",
  headline: ["From where you are", "to where you want to go."],
  ctaLabel: "Start my free training week",
  ctaHref: FREE_WEEK_ROUTES.default,
  note: "Your goals choose the direction. Your feedback shapes what comes next.",
} as const;

export const HOW_IT_WORKS_V2_STEPS = [
  {
    number: "01",
    title: "Choose Your Priority",
    body: "Select HYROX Performance, Run Performance or Strong. Fit. Fast.",
  },
  {
    number: "02",
    title: "Complete Your Screening",
    body: "Share your goals, current training, availability and starting data.",
  },
  {
    number: "03",
    title: "Receive Your Structured Week",
    body: "Your sessions are organised around your life, level and outcome.",
  },
  {
    number: "04",
    title: "Train, Check In and Progress",
    body: "Complete the work, provide feedback and let the programme adapt.",
  },
] as const;
