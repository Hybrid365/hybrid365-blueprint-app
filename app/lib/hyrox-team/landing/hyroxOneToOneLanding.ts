/**
 * Hybrid365 HYROX Team landing — copy and athlete cards only.
 * Image paths reuse existing homepage/community assets. Does not mutate Community data.
 *
 * `currentGoal` is omitted until real goals are supplied — do not invent or show placeholders.
 */

import type { PhoneScreenId } from "@/app/lib/homepage/phoneScreens";

export const HYROX_ONE_TO_ONE_APPLY_HREF = "/hyrox-team/apply";

export const HYROX_ONE_TO_ONE_NAV = {
  included: "#offer",
  athletes: "#athletes",
  teamTraining: "#team-training",
  system: "#platform",
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
  headline: ["THE PROGRAMME IS ONLY", "PART OF IT."],
  body: "Your training is reviewed, discussed and adapted around how you are actually performing.",
  points: [
    {
      title: "WATCH",
      body: "Performance, training and feedback are reviewed.",
    },
    {
      title: "COACH",
      body: "Guidance around execution, pacing, technique and preparation.",
    },
    {
      title: "ADAPT",
      body: "Training changes as fitness, fatigue and race demands change.",
    },
  ],
} as const;

export const HYROX_ONE_TO_ONE_HERO = {
  eyebrow: "HYBRID365 HYROX TEAM",
  headline: ["YOUR FASTEST HYROX", "STARTS WITH A PLAN", "BUILT AROUND YOU."],
  body: "Individual programming, direct coaching and a performance team built around helping you race faster.",
  primaryCta: "APPLY TO JOIN THE HYROX TEAM",
  secondaryCta: "MEET THE TEAM",
  videoLabel: "WATCH THIS FIRST ↓",
  credibility: "Individual coaching · Team environment · Built around your performance",
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
  },
  {
    id: "ricci-lee-jarvis",
    name: "Ricci-Lee Jarvis",
    photoSrc: "/images/homepage/team/ricci-lee-jarvis-training.png",
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

export const HYROX_ONE_TO_ONE_PILLARS = {
  eyebrow: "THE OFFER",
  headline: ["PROGRAMME.", "COACH.", "TEAM."],
  items: [
    {
      id: "programme",
      title: "PROGRAMME",
      body: "Individual training built around current performance, testing, race calendar, strengths, weaknesses, availability and recovery.",
    },
    {
      id: "coach",
      title: "COACH",
      body: "Training is reviewed, discussed, adapted and progressed. You are actively coached — not just sent sessions.",
    },
    {
      id: "team",
      title: "TEAM",
      body: "Team training, technique work, benchmark sessions, in-person coaching and a race environment around the individual plan.",
    },
  ],
} as const;

export const HYROX_ONE_TO_ONE_INCLUSIONS = {
  eyebrow: "THE HYROX TEAM",
  headline: ["EVERYTHING YOU NEED", "TO PERFORM."],
  items: [
    "Individual HYROX programme",
    "Full athlete assessment",
    "Performance testing week",
    "Individual run pace targets",
    "Individual bike / SkiErg / RowErg targets",
    "Individual strength prescription",
    "Weekly programme adjustments",
    "Direct access to coach",
    "Weekly check-ins",
    "Performance tracking",
    "Nutrition support",
    "In-person team training",
    "HYROX technique coaching",
    "Race strategy & preparation",
  ],
} as const;

export const HYROX_ONE_TO_ONE_JOURNEY = {
  eyebrow: "YOUR HYBRID365 JOURNEY",
  headline: ["FROM ASSESSMENT", "TO RACE DAY."],
  steps: [
    {
      id: "assess",
      number: "01",
      title: "ASSESS",
      body: "Full athlete assessment and testing week establish current ability across running, ergs, strength and HYROX-specific performance.",
    },
    {
      id: "build",
      number: "02",
      title: "BUILD",
      body: "Training is built around testing data, weaknesses, availability, race calendar and individual goals.",
    },
    {
      id: "coach",
      number: "03",
      title: "COACH & ADAPT",
      body: "Training is completed, feedback is reviewed and the programme is adjusted week-to-week as the athlete progresses.",
    },
    {
      id: "team",
      number: "04",
      title: "TRAIN WITH THE TEAM",
      body: "Team training and technique sessions develop execution, movement efficiency and HYROX-specific skills.",
    },
    {
      id: "blocks",
      number: "05",
      title: "BUILD THROUGH BLOCKS",
      body: "Progress through structured training blocks towards the target race, becoming increasingly race-specific as competition approaches.",
    },
    {
      id: "race",
      number: "06",
      title: "RACE",
      body: "Arrive with clear pacing, station and execution targets. Race performance then informs the next training phase.",
    },
  ],
} as const;

export const HYROX_ONE_TO_ONE_PROOF = {
  eyebrow: "THE SYSTEM BEHIND SUB-60",
  headline: "1:08:37 → 59:14",
  imageSrc: "/images/hyrox-team/Hyrox-Result.jpg",
  imageAlt: "Kieran Higgs celebrating 59:14 HYROX finish",
  from: "1:08:37",
  to: "59:14",
  fiveK: "16:00",
  event: "Pro Solo HYROX",
  body: [
    "The result came from combining running development, aerobic capacity, threshold, strength, strength endurance, HYROX-specific work and race execution.",
    "HYROX Team applies those principles around the individual athlete rather than copying one programme across everyone.",
  ],
} as const;

export type HyroxOneToOneGalleryItem = {
  id: string;
  eyebrow: string;
  title: string;
  caption: string;
  points: string[];
  screenId: PhoneScreenId;
};

export const HYROX_ONE_TO_ONE_SYSTEM = {
  eyebrow: "HYBRID365 COACHING PLATFORM",
  headline: "THE PLATFORM DELIVERS THE TRAINING.",
  highlight: "THE COACH MAKES IT INDIVIDUAL.",
  body: "The same Hybrid365 system athletes train from every day — with greater coach involvement around it.",
} as const;

export const HYROX_ONE_TO_ONE_GALLERY: HyroxOneToOneGalleryItem[] = [
  {
    id: "programme",
    eyebrow: "PROGRAMME",
    title: "TRAINING BUILT AROUND YOU.",
    caption: "Individual programming built around your race date, availability and limiters.",
    points: ["Weekly structure", "Session purpose", "Built around your numbers"],
    screenId: "programme",
  },
  {
    id: "session",
    eyebrow: "SESSION",
    title: "KNOW EXACTLY WHAT TO DO.",
    caption: "Purpose, prescription, pace, watts or load, intensity and coach notes — not a vague workout.",
    points: ["Purpose", "Pace / watts / load", "RPE / intensity", "Coach notes"],
    screenId: "threshold-run",
  },
  {
    id: "review",
    eyebrow: "REVIEW / PROGRESS",
    title: "TRAINING THAT GETS REVIEWED.",
    caption: "Check-ins, benchmarks and monitoring so the plan can actually be adapted.",
    points: ["Weekly check-ins", "Benchmark data", "Coach feedback"],
    screenId: "weekly-check-in",
  },
];

export const HYROX_ONE_TO_ONE_RESULTS = {
  eyebrow: "ATHLETE RESULTS",
  headline: ["VERIFIED MARKERS.", "REAL ATHLETES."],
  note: "Current performance markers only. Before/after times are shown only where we have them.",
} as const;

export const HYROX_ONE_TO_ONE_BEYOND = {
  eyebrow: "THE EXPERIENCE",
  headline: ["MORE THAN", "ONLINE COACHING."],
  body: "HYROX Team is a coaching setup — not a PDF and a chat thread.",
  points: [
    "In-person team training",
    "Technique coaching",
    "Testing / benchmark sessions",
    "Nutrition support",
    "Race strategy",
    "Accountability",
    "Direct communication",
    "Programme adaptation",
    "Team environment",
  ],
  photos: [
    {
      src: "/images/homepage/team/ben-kelly-ski-erg.png",
      alt: "Hybrid365 athlete on the ski erg",
    },
    {
      src: "/images/homepage/team/bobby-harrison-farmers-carry.png",
      alt: "Hybrid365 athlete during a farmer carry",
    },
    {
      src: "/images/homepage/team/rae-wall-training.png",
      alt: "Hybrid365 athlete in training",
    },
    {
      src: "/images/homepage/team/ricci-lee-jarvis-training.png",
      alt: "Hybrid365 athlete in a strength session",
    },
  ],
} as const;

export const HYROX_ONE_TO_ONE_WHO = {
  eyebrow: "WHO IT'S FOR",
  headline: ["BUILT FOR ATHLETES WHO WANT", "MORE FROM THEIR TRAINING."],
  fits: [
    "Trains consistently",
    "Wants measurable improvement",
    "Wants direct coaching",
    "Is coachable",
    "Will complete testing and check-ins",
    "Wants a performance-focused team",
  ],
} as const;

export const HYROX_ONE_TO_ONE_FINAL = {
  headline: ["READY TO SEE HOW", "FAST YOU CAN GET?"],
  body: "Apply to join the Hybrid365 HYROX Team.",
  note: "Limited athlete capacity to protect coaching quality.",
  cta: "APPLY TO JOIN THE HYROX TEAM",
} as const;
