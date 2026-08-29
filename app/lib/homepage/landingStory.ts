/**
 * Mobile-first public homepage story — presentation copy only.
 * Conversion hrefs stay on existing /start and free-week routes.
 */

import { ATHLETE_PROFILES } from "@/app/lib/homepage/peopleWhoRefuseAverage";
import {
  COACHING_START_URL,
  FREE_WEEK_HYROX_URL,
  SECONDARY_LINKS,
  TALK_TO_KIERAN_URL,
} from "@/app/lib/homepage/homepageLinks";
import type { PhoneScreenId } from "@/app/lib/homepage/phoneScreens";

export const LANDING_HERO = {
  brand: "Hybrid365",
  headline: "Build elite hybrid performance.",
  supporting:
    "Run faster. Build strength. Get leaner. Develop the fitness and mindset to perform at your highest level.",
  credibility: "59:14 HYROX Pro · 16:00 5K · Coach & Athlete",
  primaryCta: "I'm Ready to Start",
  primaryHref: COACHING_START_URL,
  secondaryCta: "Build My Free Week",
  secondaryHref: FREE_WEEK_HYROX_URL,
  seeHowItWorks: "See how it works",
  seeHowItWorksHref: "#system",
  mediaAlt: "Kieran Higgs — Hybrid365 founder and coach",
} as const;

export const LANDING_SOCIAL_PROOF = {
  eyebrow: "Built for more",
  headline: ["Look strong.", "Run fast.", "Perform."],
  body: "More muscle. Less body fat. Faster running. Greater strength. A body built to perform.",
} as const;

export type LandingAthleteCard = {
  id: string;
  name: string;
  photoSrc: string;
  photoAlt: string;
  imageClassName?: string;
  primary: { label: string; value: string };
  secondary?: { label: string; value: string };
  focus: string;
};

/** Verified current markers only — no invented before/after. */
export const LANDING_ATHLETE_CARDS: LandingAthleteCard[] = ATHLETE_PROFILES.map(
  (athlete) => ({
    id: athlete.id,
    name: athlete.name,
    photoSrc: athlete.photoSrc,
    photoAlt: athlete.photoAlt,
    imageClassName: athlete.imageClassName,
    primary: athlete.metric,
    secondary: athlete.secondaryMetric,
    focus: athlete.focus,
  })
);

export const LANDING_SYSTEM = {
  eyebrow: "The Hybrid365 system",
  headline: "Test → Train → Progress",
  steps: [
    {
      number: "01",
      title: "Test",
      line: "Understand where you are.",
      detail:
        "Running, fitness, strength and performance testing set current ability and individual training targets.",
    },
    {
      number: "02",
      title: "Train",
      line: "Train with purpose.",
      detail:
        "Pace, watts, load and intensity — individual targets, not a generic plan.",
    },
    {
      number: "03",
      title: "Progress",
      line: "Raise the standard.",
      detail:
        "Measure improvement, review the work and keep moving the target as you get better.",
    },
  ],
} as const;

export type ProductShowcaseSlide = {
  id: string;
  eyebrow: string;
  headline: string;
  points: string[];
  screenId: PhoneScreenId;
  overlay?: {
    kicker: string;
    title: string;
    value: string;
    note: string;
  };
};

export const LANDING_PRODUCT_SHOWCASE = {
  eyebrow: "The athlete platform",
  headline: "Not a PDF. A coaching system.",
  slides: [
    {
      id: "today",
      eyebrow: "Today",
      headline: "Know exactly what to do today.",
      points: ["Today's training", "Personal targets", "Weekly progress", "Recovery / feedback"],
      screenId: "team-athlete-overview" as const,
    },
    {
      id: "train",
      eyebrow: "Train",
      headline: "Train to your numbers.",
      points: ["Session purpose", "Pace / watts / load", "Clear intensity"],
      screenId: "threshold-run" as const,
      overlay: {
        kicker: "Product preview",
        title: "5 × 5 min",
        value: "3:38–3:42/km",
        note: "Illustrative session targets — not a live athlete log.",
      },
    },
    {
      id: "progress",
      eyebrow: "Progress",
      headline: "See the work paying off.",
      points: ["Running mileage", "Completion", "Benchmarks", "Training zones"],
      screenId: "progress-overview" as const,
    },
  ] satisfies ProductShowcaseSlide[],
} as const;

export const LANDING_FOUNDER = {
  eyebrow: "More than a physical transformation",
  headline: ["100KG → 86KG.", "But the biggest change wasn't the weight."],
  fromWeight: "~100KG",
  toWeight: "86KG",
  from: "1:08:37",
  to: "59:14",
  event: "Pro Solo HYROX",
  fiveK: "16:00",
  fiveKLabel: "5K",
  intro: "I wanted more than to look better. I wanted to become someone capable of more.",
  body: [
    "Overweight, unhappy with how I looked and lacking direction — then lean muscle, a 16:00 5K and 59:14 Pro Solo HYROX.",
    "The work built a different body. It also built a different standard: more disciplined, more capable, harder to break.",
  ],
  photos: [
    {
      src: "/images/homepage/founder/kieran-starting-point.png",
      alt: "Kieran Higgs — starting point around 100kg",
      label: "~100KG",
      imageClassName: "object-cover object-top grayscale",
    },
    {
      src: "/images/community/lean muscle phisique photo.jpg",
      alt: "Kieran Higgs — current lean physique",
      label: "86KG",
      imageClassName: "object-cover object-top",
    },
    {
      src: "/images/community/running.jpg",
      alt: "Kieran Higgs — running performance",
      label: "16:00 5K",
      imageClassName: "object-cover object-center",
    },
    {
      src: "/images/hyrox-team/Hyrox-Result.jpg",
      alt: "Kieran Higgs — 59:14 Pro Solo HYROX",
      label: "59:14",
      imageClassName: "object-cover object-top",
    },
  ],
} as const;

export const LANDING_CLIENT_RESULTS = {
  eyebrow: "Client results",
  headline: "The system doesn't stop with me.",
  note: "Verified current performance markers. Before/after times are shown only where we have them.",
} as const;

export const LANDING_HUMAN_COACHING = {
  eyebrow: "Real coaching",
  headline: "More than an app.",
  body: "Hybrid365 combines structured programming and performance tracking with real coaching, feedback, technique development and a genuine athlete environment.",
} as const;

export const LANDING_BELONGING = {
  eyebrow: "The Hybrid365 standard",
  headline: ["Surround yourself with people", "who refuse average."],
  body: "A community of hard-working people chasing more from themselves — stronger bodies, faster times, bigger goals and higher standards.",
  telegramLabel: "Free community on Telegram",
  telegramHref: SECONDARY_LINKS.telegram,
  photos: [
    {
      src: "/images/homepage/team/ben-kelly-ski-erg.png",
      alt: "Hybrid365 athlete on the ski erg",
      imageClassName: "object-cover object-top",
    },
    {
      src: "/images/homepage/team/bobby-harrison-farmers-carry.png",
      alt: "Hybrid365 athlete during a farmer carry",
      imageClassName: "object-cover object-top",
    },
    {
      src: "/images/homepage/team/rae-wall-training.png",
      alt: "Hybrid365 athlete in training",
      imageClassName: "object-cover object-top",
    },
    {
      src: "/images/homepage/team/ben-kelly-training.png",
      alt: "Ricci-Lee Jarvis — Hybrid365 athlete",
      imageClassName: "object-cover object-[42%_12%]",
    },
  ],
} as const;

export const LANDING_COACHING_LEVELS = {
  eyebrow: "Current coaching pathways",
  headline: "Choose how you want to train.",
  reassurance: "Both pathways are personalised. The difference is how close the coaching sits to you.",
  tracks: [
    {
      id: "track",
      eyebrow: "HYROX Track",
      title: "Personalised training system",
      points: [
        "Assessment and testing",
        "Personalised programming",
        "Athlete dashboard",
        "Performance tracking",
        "Weekly structure and check-ins",
        "Community",
        "More independent execution",
      ],
      cta: "Explore HYROX Track",
      href: SECONDARY_LINKS.hyroxCommunity,
    },
    {
      id: "team",
      eyebrow: "HYROX Team",
      title: "Full coaching experience",
      points: [
        "Everything in the personalised system",
        "Direct coach involvement",
        "Greater programme adaptation",
        "Team training and technique sessions",
        "Testing and benchmark sessions",
        "Nutrition support and race strategy",
        "Full team environment",
      ],
      cta: "Explore HYROX Team",
      href: SECONDARY_LINKS.hyroxTeam,
    },
  ],
} as const;

export const LANDING_FINAL = {
  headline: ["Build an unbreakable body.", "Develop an unbreakable mindset."],
  primaryCta: "I'm Ready to Start",
  primaryHref: COACHING_START_URL,
  secondaryCta: "Build My Free Week",
  secondaryHref: FREE_WEEK_HYROX_URL,
  talkLabel: "Not sure? Talk to Kieran →",
  talkHref: TALK_TO_KIERAN_URL,
} as const;
