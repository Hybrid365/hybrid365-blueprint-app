/**
 * Hybrid Performance Track public sales page — copy only.
 * Checkout is the existing Community Whop membership (getWhopJoinUrl).
 * Track selection happens after payment on /dashboard/assessment.
 */

import type { PhoneScreenId } from "@/app/lib/homepage/phoneScreens";
import { getWhopJoinUrl } from "@/app/lib/hybrid365PublicLinks";

export const HYBRID_PERFORMANCE_1_1_HREF = "/hybrid-performance";

export function getHybridPerformanceTrackJoinUrl() {
  return getWhopJoinUrl();
}

export const HYBRID_PERFORMANCE_TRACK_NAV = {
  results: "#results",
  vsl: "#vsl",
  how: "#how-it-works",
  train: "#train",
  platform: "#platform",
  included: "#included",
  compare: "#compare",
} as const;

export const HYBRID_PERFORMANCE_TRACK_HERO = {
  eyebrow: "HYBRID365 | HYBRID PERFORMANCE TRACK",
  headline: ["Train with purpose.", "Build complete fitness."],
  supporting:
    "Structured running, strength and hybrid training designed to help you get fitter, stronger and faster — without guessing what to do next.",
  primaryCta: "Join Hybrid Performance",
  secondaryCta: "See how the Track works →",
  secondaryHref: "#how-it-works",
  price: "£39.99/month",
  membershipNote: "Community membership · cancel anytime",
} as const;

export const HYBRID_PERFORMANCE_TRACK_RESULTS = {
  eyebrow: "The Hybrid365 method in action",
  headline: "Built from the same performance principles.",
  supporting:
    "Verified Hybrid365 results. These athletes were coached 1-1. The Track uses the same training principles — assessment, structured programming, testing and progression — delivered through the platform.",
} as const;

export const HYBRID_PERFORMANCE_TRACK_VSL = {
  id: "vsl",
  eyebrow: "The Hybrid365 approach",
  headline: ["Build strength.", "Run fast.", "Perform."],
  supporting:
    "Watch how we approach building complete hybrid performance — and why your training needs structure, progression and purpose.",
} as const;

export const HYBRID_PERFORMANCE_TRACK_HOW = {
  eyebrow: "How the Track works",
  headline: "Assess → Train → Log → Review → Progress",
  supporting:
    "You join Hybrid365 Community membership, then complete your athlete profile and confirm Hybrid Performance as your training track. The programme is generated from that assessment — not written by a coach each week.",
  steps: [
    {
      number: "01",
      title: "Assess",
      body: "Complete your athlete profile: training history, goals, availability and equipment. Optional baseline tests can be logged before you generate.",
    },
    {
      number: "02",
      title: "Train",
      body: "A 12-week Hybrid Performance programme is generated from your assessment, with a clear weekly structure and session targets.",
    },
    {
      number: "03",
      title: "Log",
      body: "Train the session in front of you, then log it in the Hybrid365 dashboard so the work is actually tracked.",
    },
    {
      number: "04",
      title: "Review",
      body: "Weekly check-ins capture recovery, adherence and how the week actually went.",
    },
    {
      number: "05",
      title: "Progress",
      body: "Training blocks unlock as membership continues. Keep showing up and the structure keeps moving.",
    },
  ],
} as const;

export const HYBRID_PERFORMANCE_TRACK_TRAIN = {
  eyebrow: "What you'll train",
  headline: "Running, strength and hybrid work in one system.",
  supporting:
    "Sessions are generated around your profile. Goal focus can bias running, hybrid conditioning or muscle — the week still develops complete fitness.",
  pillars: [
    {
      id: "run",
      title: "Run",
      body: "Aerobic development, threshold work and speed — with prescribed pace targets on quality sessions.",
    },
    {
      id: "strength",
      title: "Strength",
      body: "Useful strength and muscle work that sits inside the same week as your running and conditioning.",
    },
    {
      id: "hybrid",
      title: "Hybrid",
      body: "Mixed-modality conditioning so fitness transfers — not just isolated gym or run work.",
    },
    {
      id: "recover",
      title: "Recover",
      body: "Easier aerobic work, planned deload weeks, and daily habits: water, protein, steps, sleep and mobility.",
    },
  ],
} as const;

export type HybridPerformanceTrackPlatformSlide = {
  id: string;
  eyebrow: string;
  title: string;
  caption: string;
  points: string[];
  screenId: PhoneScreenId;
};

export const HYBRID_PERFORMANCE_TRACK_PLATFORM = {
  eyebrow: "The Hybrid365 platform",
  headline: "Your week. Your session. Your progress.",
  slides: [
    {
      id: "week",
      eyebrow: "Your week",
      title: "Know the structure.",
      caption:
        "A generated week of training — sessions, purpose and recovery — so you are not building the plan yourself.",
      points: ["Weekly programme view", "Session purpose", "Recovery built in"],
      screenId: "programme" as const,
    },
    {
      id: "session",
      eyebrow: "Your session",
      title: "Know exactly what to do.",
      caption:
        "Open the session and train it. Quality work includes prescribed targets so the session has a job.",
      points: ["Session detail", "Pace / load / intensity", "Clear intent"],
      screenId: "threshold-run" as const,
    },
    {
      id: "progress",
      eyebrow: "Your progress",
      title: "See the work adding up.",
      caption:
        "Adherence, bodyweight, running volume and benchmarks live in the dashboard — not a separate spreadsheet.",
      points: ["Session logging", "Benchmarks", "Running volume"],
      screenId: "progress-overview" as const,
    },
    {
      id: "check-in",
      eyebrow: "Your check-in",
      title: "Review the week honestly.",
      caption:
        "Weekly check-ins keep recovery, energy and adherence visible so you can see how the block is landing.",
      points: ["Weekly check-in", "Recovery scores", "Habit tracking"],
      screenId: "weekly-check-in" as const,
    },
  ] satisfies HybridPerformanceTrackPlatformSlide[],
} as const;

/**
 * Checklist grounded in live Community dashboard routes and membership behaviour.
 * Excluded (marketed on /community but not live as in-app products):
 * education library, nutrition/recipe library, 16-week programme, 1-1 coach contact.
 */
export const HYBRID_PERFORMANCE_TRACK_INCLUDED = {
  eyebrow: "What's included",
  headline: "Hybrid Performance Track.",
  note: "Community membership. Hybrid Performance is selected on your athlete profile after you join.",
  items: [
    "Athlete assessment and Hybrid Performance track selection",
    "Optional baseline testing in the dashboard",
    "12-week Hybrid Performance programme generated from your profile",
    "Weekly structure with prescribed session targets",
    "Session logging",
    "Weekly check-ins",
    "Daily habit tracking (water, protein, steps, sleep, mobility)",
    "Progress tracking in the Hybrid365 dashboard",
    "Challenges and leaderboard",
    "Community / Telegram accountability",
    "Programme weeks unlock as membership continues",
  ],
} as const;

export const HYBRID_PERFORMANCE_TRACK_COMPARE = {
  eyebrow: "Choose the right pathway",
  headline: "Track or 1-1.",
  track: {
    title: "Hybrid Performance Track",
    bestIf: "Best if you want",
    items: [
      "Structured hybrid programming",
      "Clear sessions and targets",
      "Platform, check-ins and habits",
      "Community accountability",
      "A lower-cost coaching system",
    ],
    cta: "Join Hybrid Performance",
  },
  oneToOne: {
    title: "Hybrid Performance 1-1",
    bestIf: "Best if you want",
    items: [
      "A programme built specifically around you",
      "Direct coach contact",
      "Ongoing individual adaptation",
      "Goals, races and lifestyle planned around you",
      "Higher-touch review",
    ],
    cta: "See 1-1 coaching",
    href: HYBRID_PERFORMANCE_1_1_HREF,
  },
} as const;

export const HYBRID_PERFORMANCE_TRACK_IDENTITY = {
  eyebrow: "The Hybrid365 standard",
  headline: ["For people who want", "more from themselves."],
  body: "Training should feel part of a higher-standard lifestyle — not a workout subscription you dip in and out of.",
} as const;

export const HYBRID_PERFORMANCE_TRACK_STICKY = {
  primaryCta: "Join Hybrid Performance",
  supporting: "£39.99/month · Community membership",
  points: [
    { title: "Structured programming", body: "Generated from your assessment" },
    { title: "Clear session targets", body: "Train the work in front of you" },
    { title: "Platform + community", body: "Log, check in, keep progressing" },
  ],
} as const;

export const HYBRID_PERFORMANCE_TRACK_FINAL = {
  headline: ["Stop guessing.", "Start progressing."],
  supporting:
    "Join Hybrid Performance Track and follow a system built to develop strength, speed and fitness together.",
  primaryCta: "Join Hybrid Performance",
  motto: "Train with purpose.",
} as const;
