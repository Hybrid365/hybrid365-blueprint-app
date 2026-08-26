/**
 * Hybrid365 1-1 HYROX landing — copy and athlete cards only.
 * Image paths reuse existing homepage/community assets. Does not mutate Community data.
 *
 * `currentGoal` is omitted until real goals are supplied — do not invent or show placeholders.
 */

import type { PhoneScreenId } from "@/app/lib/homepage/phoneScreens";

export const HYROX_ONE_TO_ONE_APPLY_HREF = "/hyrox-team/apply";

export const HYROX_ONE_TO_ONE_NAV = {
  included: "#included",
  athletes: "#athletes",
  teamTraining: "#team-training",
  system: "#system",
  liveCoaching: "#live-coaching",
} as const;

/** External Vercel Blob URLs — do not download 4K sources into the repo. */
export const HYROX_ONE_TO_ONE_VIDEOS = {
  cinematicTraining: {
    src: "https://kvmrgulr06huygnw.public.blob.vercel-storage.com/C0732_1.mp4",
    width: 3840,
    height: 2160,
    label: "Hybrid365 team training session — cinematic trailer",
  },
  liveCoaching: {
    src: "https://kvmrgulr06huygnw.public.blob.vercel-storage.com/Sequence%2001_183.mp4",
    width: 2160,
    height: 3840,
    label: "Live Hybrid365 1-1 coaching during a team session",
  },
} as const;

export const HYROX_ONE_TO_ONE_CINEMATIC = {
  eyebrow: "TEAM TRAINING",
  headline: ["INDIVIDUALLY COACHED.", "PUSHED BY THE TEAM."],
  body: "Real sessions. Real coaching. Real athletes working towards individual HYROX goals.",
} as const;

export const HYROX_ONE_TO_ONE_LIVE_COACHING = {
  eyebrow: "REAL COACHING",
  headline: ["THE PROGRAMME IS ONLY", "PART OF THE COACHING."],
  body: "Your training is reviewed, discussed and adapted around how you are actually performing — not simply delivered and forgotten.",
  points: [
    {
      title: "WATCH",
      body: "Sessions, check-ins and performance data reviewed.",
    },
    {
      title: "COACH",
      body: "Direct feedback on execution, pacing and technique.",
    },
    {
      title: "ADAPT",
      body: "Training adjusted around performance, fatigue and race progression.",
    },
  ],
} as const;

export const HYROX_ONE_TO_ONE_HERO = {
  eyebrow: "HYBRID365 1-1 HYROX COACHING",
  headline: ["YOUR FASTEST HYROX", "STARTS WITH A PLAN", "BUILT AROUND YOU."],
  body: "Individual HYROX coaching built around your race calendar, current performance, training availability and weaknesses.",
  primaryCta: "APPLY FOR 1-1 COACHING",
  secondaryCta: "SEE WHAT'S INCLUDED",
  videoLabel: "WATCH THIS FIRST ↓",
  proof: [
    { value: "1-1", label: "Personalised programming" },
    { value: "Weekly", label: "Coach check-ins" },
    { value: "HYROX", label: "Race-specific build" },
  ],
} as const;

export type HyroxOneToOneAthleteCard = {
  id: string;
  name: string;
  photoSrc: string;
  photoAlt: string;
  hyroxPb?: string;
  fiveK?: string;
  /** Real current coaching goal only. Leave unset until supplied. */
  currentGoal?: string;
  coachingFocus?: string;
};

/**
 * Current coached athletes — same photos/PBs/focus as Community.
 * `currentGoal` intentionally omitted until real goals are supplied (do not invent).
 * Founder proof lives in the following section, not this roster.
 */
export const HYROX_ONE_TO_ONE_ATHLETES: HyroxOneToOneAthleteCard[] = [
  {
    id: "ben-kelly",
    name: "Ben Kelly",
    photoSrc: "/images/homepage/team/ben-kelly.jpg",
    photoAlt: "Ben Kelly — Hybrid365 athlete",
    hyroxPb: "1:03 Pro Doubles",
    fiveK: "16:16",
    coachingFocus: "Efficiency",
    // currentGoal: supply real goal later e.g. "Sub-60 Pro"
  },
  {
    id: "ricci-lee-jarvis",
    name: "Ricci-Lee Jarvis",
    photoSrc: "/images/homepage/team/ben-kelly-training.png",
    photoAlt: "Ricci-Lee Jarvis — Hybrid365 athlete",
    fiveK: "18:45",
    coachingFocus: "Strength + Load Tolerance",
  },
  {
    id: "rae-wall",
    name: "Rae Wall",
    photoSrc: "/images/homepage/team/rae-wall-training.png",
    photoAlt: "Rae Wall — Hybrid365 athlete",
    fiveK: "24:30",
    coachingFocus: "Body Composition",
  },
  {
    id: "bobby-harrison",
    name: "Bobby Harrison",
    photoSrc: "/images/homepage/team/bobby-harrison-wall-ball.png",
    photoAlt: "Bobby Harrison — Hybrid365 athlete",
    hyroxPb: "1:04",
    coachingFocus: "Strength + Running",
  },
];

export const HYROX_ONE_TO_ONE_PROOF = {
  eyebrow: "THE SYSTEM BEHIND SUB-60",
  headline: ["THE SYSTEM BEHIND", "SUB-60."],
  imageSrc: "/images/hyrox-team/Hyrox-Result.jpg",
  imageAlt: "HYROX race finish — Hybrid365 founder progression",
  metrics: [
    { value: "1:08:37", label: "Starting Pro Solo", accent: false },
    { value: "59:14", label: "Current Pro Solo", accent: true },
    { value: "9:23", label: "Improvement", accent: false },
    { value: "16:00", label: "5K PB", accent: false },
  ],
  body: [
    "Built through aerobic development, threshold running, strength, strength endurance, compromised running and race execution.",
    "1-1 coaching applies those principles around your starting point, race date, strengths, weaknesses, schedule, equipment, recovery and progress.",
  ],
} as const;

export type HyroxOneToOneGalleryItem = {
  id: string;
  title: string;
  caption: string;
  screenId: PhoneScreenId;
};

export const HYROX_ONE_TO_ONE_SYSTEM = {
  eyebrow: "YOUR COACHING ENVIRONMENT",
  headline: ["NOT JUST A PROGRAMME.", "A COMPLETE 1-1 COACHING SYSTEM."],
  body: "Your training doesn't just get delivered. It gets reviewed, tracked and adapted around your performance.",
} as const;

export const HYROX_ONE_TO_ONE_GALLERY: HyroxOneToOneGalleryItem[] = [
  {
    id: "programme",
    title: "HYROX Programme",
    caption: "Individual programming built around your race date, availability and limiters.",
    screenId: "programme",
  },
  {
    id: "session",
    title: "Session Detail",
    caption: "Clear session purpose, intensity and execution — reviewed by your coach.",
    screenId: "threshold-run",
  },
  {
    id: "check-in",
    title: "Weekly Check-In",
    caption: "Weekly feedback that shapes the next adjustment, not a static plan.",
    screenId: "weekly-check-in",
  },
  {
    id: "overview",
    title: "Performance Overview",
    caption: "Race readiness and key metrics in one view for coach decision-making.",
    screenId: "progress-overview",
  },
  {
    id: "testing",
    title: "Performance Testing",
    caption: "Benchmarks that identify the next limiter and prove the work is landing.",
    screenId: "performance-testing",
  },
  {
    id: "progress",
    title: "Progress Tracking",
    caption: "Threshold, volume and recovery tracked so the plan can actually progress.",
    screenId: "threshold-progression",
  },
];
