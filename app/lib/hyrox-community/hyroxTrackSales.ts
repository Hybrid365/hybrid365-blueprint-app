/** HYROX Track (£39.99) sales page — copy and data only. */

import { FREE_WEEK_ROUTES } from "@/app/lib/homepage/freeWeekRoutes";
import { FOUNDER_TRANSFORM } from "@/app/lib/homepage/peopleWhoRefuseAverage";
import type { PhoneScreenId } from "@/app/lib/homepage/phoneScreens";
import { getWhopJoinUrl } from "@/app/lib/hybrid365PublicLinks";

export function getHyroxTrackJoinUrl() {
  return getWhopJoinUrl();
}

export const HYROX_TRACK_FREE_WEEK_URL = FREE_WEEK_ROUTES.hyrox;

export const HYROX_TRACK_NAV = {
  athletes: "#athletes",
  system: "#system",
  included: "#whats-included",
  promise: "#promise",
  pricing: "#pricing",
  faq: "#faq",
  join: "#pricing",
} as const;

export const HYROX_TRACK_HERO = {
  eyebrow: "Hybrid365 HYROX Track",
  headline: ["Train for HYROX", "with a programme built around you."],
  body: "Progressive HYROX-specific programming built from your assessment, race date, current fitness, equipment access and individual station weaknesses.",
  price: "£39.99/month",
  reassurance: [
    "Personalised from your assessment",
    "Detailed HYROX dashboard",
    "Cancel anytime",
  ],
  primaryCta: "Join the HYROX Track",
  secondaryCta: "See what's included",
  guaranteeCue: "Hybrid365 Performance Promise",
} as const;

export type HyroxAthleteCard = {
  id: string;
  name: string;
  photoSrc: string;
  photoAlt: string;
  hyroxPb?: string;
  fiveK?: string;
  focus: string;
};

export const HYROX_TRACK_ATHLETES: HyroxAthleteCard[] = [
  {
    id: "kieran-higgs",
    name: FOUNDER_TRANSFORM.name,
    photoSrc: FOUNDER_TRANSFORM.currentPhoto.src,
    photoAlt: FOUNDER_TRANSFORM.currentPhoto.alt,
    hyroxPb: "59:14 Pro",
    fiveK: "16:00",
    focus: "Engine + Race Execution",
  },
  {
    id: "ben-kelly",
    name: "Ben Kelly",
    photoSrc: "/images/homepage/team/ben-kelly.jpg",
    photoAlt: "Ben Kelly — Hybrid365 athlete",
    hyroxPb: "1:03 Pro Doubles",
    fiveK: "16:16",
    focus: "Efficiency",
  },
  {
    id: "ricci-lee-jarvis",
    name: "Ricci-Lee Jarvis",
    photoSrc: "/images/homepage/team/ben-kelly-training.png",
    photoAlt: "Ricci-Lee Jarvis — Hybrid365 athlete",
    fiveK: "18:45",
    focus: "Strength + Load Tolerance",
  },
  {
    id: "rae-wall",
    name: "Rae Wall",
    photoSrc: "/images/homepage/team/rae-wall-training.png",
    photoAlt: "Rae Wall — Hybrid365 athlete",
    fiveK: "24:30",
    focus: "Body Composition",
  },
  {
    id: "bobby-harrison",
    name: "Bobby Harrison",
    photoSrc: "/images/homepage/team/bobby-harrison-wall-ball.png",
    photoAlt: "Bobby Harrison — Hybrid365 athlete",
    hyroxPb: "1:04",
    focus: "Strength + Running",
  },
];

export const HYROX_TRACK_SUB60 = {
  eyebrow: "The system behind sub-60",
  headline: ["The system behind", "sub-60."],
  metrics: [
    { value: "1:08:37", label: "Starting Pro Solo", accent: false },
    { value: "59:14", label: "Current Pro Solo", accent: true },
    { value: "9:23", label: "Improvement", accent: false },
    { value: "16:00", label: "5K PB", accent: false },
  ],
  body: [
    "The system was built through developing the engine, threshold running, strength endurance and the ability to run under station fatigue.",
    "Your programme applies those principles around your own starting point, race date and weaknesses.",
  ],
} as const;

export const HYROX_TRACK_SYSTEM_COPY = {
  eyebrow: "What you actually access",
  headline: ["Not a PDF.", "A complete HYROX coaching system."],
  body: "Your programme, sessions, check-ins, benchmarks and progress all live inside one clear coaching environment.",
} as const;

export type HyroxGalleryItem = {
  id: string;
  title: string;
  caption: string;
  screenId: PhoneScreenId;
};

export const HYROX_TRACK_GALLERY: HyroxGalleryItem[] = [
  {
    id: "programme",
    title: "HYROX Programme",
    caption: "A structured training week with session purpose and clear progression.",
    screenId: "programme",
  },
  {
    id: "session",
    title: "Session Detail",
    caption: "Know what the session builds, the intensity required and how to execute it.",
    screenId: "threshold-run",
  },
  {
    id: "check-in",
    title: "Weekly Check-In",
    caption: "Sleep, energy, soreness and adherence shape the next decision.",
    screenId: "weekly-check-in",
  },
  {
    id: "overview",
    title: "Performance Overview",
    caption: "Race readiness, consistency and key HYROX metrics in one view.",
    screenId: "progress-overview",
  },
  {
    id: "testing",
    title: "Performance Testing",
    caption: "Measure the areas that matter and identify the next limiter.",
    screenId: "performance-testing",
  },
  {
    id: "progress",
    title: "Progress Tracking",
    caption: "Watch threshold, volume and readiness move across training blocks.",
    screenId: "threshold-progression",
  },
  {
    id: "team",
    title: "Accountability",
    caption: "Team standards, challenges and leaderboards keep the work visible.",
    screenId: "hybrid365-team",
  },
];

export const HYROX_TRACK_PERSONALISED = {
  eyebrow: "Personalised from your assessment",
  headline: ["We don't guess.", "We build from data."],
  close: [
    "Your starting point shapes the programme.",
    "Your feedback shapes what comes next.",
  ],
  stages: [
    {
      number: "01",
      title: "Screen",
      items: ["Race date and category", "Current PBs", "Station weaknesses", "Schedule and equipment"],
    },
    {
      number: "02",
      title: "Build",
      items: ["Running volume", "Strength", "Station work", "Recovery"],
    },
    {
      number: "03",
      title: "Track",
      items: ["Completion", "Pace/load", "RPE", "Weekly check-ins"],
    },
    {
      number: "04",
      title: "Adapt",
      items: ["Recovery", "Benchmarks", "Adherence", "Next training block"],
    },
  ],
} as const;

export const HYROX_TRACK_COMMUNITY = {
  eyebrow: "Team training days and community",
  headline: ["Train online.", "Meet the team in person."],
  items: [
    "Access to selected Hybrid365 team training days",
    "HYROX group sessions",
    "Running sessions",
    "Station workshops",
    "Benchmark/testing sessions",
    "Community challenges",
    "Leaderboards",
    "Group accountability",
    "Team training discussion",
    "Media/content opportunities where applicable",
  ],
  close: ["Coached individually.", "Pushed by the team."],
  photos: [
    {
      src: "/images/homepage/team/bobby-harrison-wall-ball.png",
      alt: "Hybrid365 athlete — wall ball training",
    },
    {
      src: "/images/homepage/team/ben-kelly.jpg",
      alt: "Hybrid365 athlete — SkiErg training",
    },
    {
      src: "/images/hyrox-team/Hyrox-Result.jpg",
      alt: "HYROX race finish — Hybrid365",
    },
  ],
} as const;

export const HYROX_TRACK_DEVELOPS = {
  eyebrow: "What the programme develops",
  headline: ["Built for", "HYROX performance."],
  areas: [
    {
      title: "The Engine",
      items: ["Aerobic base", "Threshold running", "Ski / Row / Bike fitness"],
    },
    {
      title: "HYROX Strength",
      items: ["Sled durability", "Lunges", "Wall balls", "Grip and carries"],
    },
    {
      title: "Race Performance",
      items: ["Compromised running", "Station efficiency", "Race pacing"],
    },
    {
      title: "Testing and Progression",
      items: ["Benchmarks", "Four-week blocks", "Race-readiness tracking"],
    },
  ],
} as const;

/**
 * Formal money-back guarantee terms are not approved yet.
 * Ship Performance Promise only — no money-back claim.
 */
export const HYROX_TRACK_PROMISE = {
  id: "promise",
  eyebrow: "The Hybrid365 standard",
  headline: "The Hybrid365 Performance Promise",
  body: "Follow the agreed programme, complete your check-ins and meet the adherence standard. If progress stalls, we review the data, adjust the plan and keep working until the next benchmark moves.",
  note: "A formal HYROX PB money-back guarantee will be published here once full eligibility terms are approved.",
} as const;

export const HYROX_TRACK_PRICING = {
  eyebrow: "What's included",
  headline: ["Everything in the", "HYROX Track."],
  inclusions: [
    "Personalised HYROX programme",
    "Progressive four-week blocks",
    "Full dashboard access",
    "Detailed session guidance",
    "Weekly check-ins",
    "Performance testing",
    "Progress tracking",
    "Community challenges",
    "Leaderboards",
    "Selected team training days",
  ],
  price: "£39.99",
  period: "/month",
  billing: ["Billed monthly", "Cancel anytime"],
  primaryCta: "Join the HYROX Track",
  secondaryCta: "Try my free HYROX week",
} as const;

export const HYROX_TRACK_FAQ = {
  eyebrow: "Questions",
  headline: "Before you join",
  items: [
    {
      id: "personalised",
      question: "Is the programme genuinely personalised?",
      answer:
        "Yes. Your assessment — race date, category, PBs, station weaknesses, schedule and equipment — shapes the programme you receive.",
    },
    {
      id: "level",
      question: "What level do I need to be?",
      answer:
        "The track works across levels. Your starting data determines the first progression — not a generic week number.",
    },
    {
      id: "days",
      question: "How many days per week do I need?",
      answer:
        "It depends on your assessment. We build around the days and recovery your week can support.",
    },
    {
      id: "equipment",
      question: "What equipment do I need?",
      answer:
        "Tell us what you have access to. Programming adapts around gym, erg and station availability.",
    },
    {
      id: "club",
      question: "Can it work around my run club or gym?",
      answer:
        "Yes. Available days and existing commitments are part of screening so the week fits your life.",
    },
    {
      id: "checkins",
      question: "How do weekly check-ins work?",
      answer:
        "You log recovery and adherence each week so training can adapt around real feedback.",
    },
    {
      id: "training-days",
      question: "What happens at team training days?",
      answer:
        "Selected Hybrid365 team training days may include HYROX group work, running, station workshops and testing — announced inside the community.",
    },
    {
      id: "guarantee",
      question: "How does the HYROX PB guarantee work?",
      answer:
        "We currently operate under the Hybrid365 Performance Promise: adhere, check in, and we keep adapting until the next benchmark moves. Formal money-back guarantee terms will be published when approved.",
    },
    {
      id: "after-join",
      question: "What happens after I join?",
      answer:
        "Complete your assessment, unlock your HYROX programme and dashboard, then train, check in and progress inside the Hybrid365 system.",
    },
  ],
} as const;

export const HYROX_TRACK_FINAL = {
  headline: ["Your next HYROX", "deserves a system."],
  body: "Join the HYROX Track. Build from your assessment. Train with structure, accountability and a clear path toward a faster race.",
  primaryCta: "Join the HYROX Track",
  secondaryCta: "Try my free HYROX week",
  close: "Refuse average.",
} as const;
