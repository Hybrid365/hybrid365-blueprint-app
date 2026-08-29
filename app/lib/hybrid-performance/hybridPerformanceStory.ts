/**
 * Hybrid Performance 1-1 public offer — copy and verified asset mappings only.
 * Apply reuses /api/hybrid-1-1/applications (hybrid_1_1_applications).
 */

import type { PhoneScreenId } from "@/app/lib/homepage/phoneScreens";

export const HYBRID_PERFORMANCE_APPLY_HREF = "/hybrid-performance/apply";

export const HYBRID_PERFORMANCE_NAV = {
  results: "#results",
  vsl: "#vsl",
  founder: "#founder",
  system: "#system",
  platform: "#platform",
  included: "#included",
  apply: HYBRID_PERFORMANCE_APPLY_HREF,
} as const;

export const HYBRID_PERFORMANCE_HERO = {
  headline: ["Look strong.", "Run fast.", "Perform."],
  supporting: "1-1 hybrid performance coaching for people who refuse average.",
  primaryCta: "Apply for 1-1 coaching",
  primaryHref: HYBRID_PERFORMANCE_APPLY_HREF,
  secondaryCta: "See what you're capable of →",
  secondaryHref: "#results",
  mediaSrc: "/images/community/Main Hero photo of me.jpg",
  mediaAlt: "Kieran Higgs — Hybrid365 founder",
} as const;

export const HYBRID_PERFORMANCE_VSL = {
  id: "vsl",
  label: "Watch the full story",
  /** Swap in a YouTube ID, Vimeo ID or direct src when the VSL is ready. */
  youtubeId: "LHe592B0I6U" as string | null,
  vimeoId: null as string | null,
  src: null as string | null,
} as const;

export const HYBRID_PERFORMANCE_RESULTS = {
  headline: "Real athletes. Real results.",
  supporting: "Different starting points. Same standard.",
} as const;

export const HYBRID_PERFORMANCE_PROBLEM = {
  eyebrow: "The problem",
  headline: ["Stop choosing between", "strength and endurance."],
  body: "Most training pushes people toward one extreme: look like a bodybuilder and lose fitness, or run well and lose muscle. Hybrid Performance is built so those qualities develop together — strength, muscle, running and aerobic fitness in one system.",
  note: "The work is individual. How those qualities balance depends on your starting point, availability and goals.",
} as const;

export const HYBRID_PERFORMANCE_OUTCOMES = {
  eyebrow: "What we're building",
  headline: "A more complete athlete.",
  items: [
    {
      id: "run",
      title: "Run",
      body: "Faster 5K and 10K performance, and a stronger aerobic engine.",
      src: "/images/community/running.jpg",
      alt: "Kieran Higgs running",
    },
    {
      id: "lift",
      title: "Lift",
      body: "Greater strength and useful muscle — not gym work that ignores the rest of your training.",
      src: "/images/community/run and lift in one photo.jpg",
      alt: "Hybrid training — running and lifting in the same system",
    },
    {
      id: "look",
      title: "Look",
      body: "A leaner, more athletic physique that matches how you actually perform.",
      src: "/images/community/lean muscle phisique photo.jpg",
      alt: "Lean athletic physique",
    },
    {
      id: "perform",
      title: "Perform",
      body: "Fitness that transfers — work capacity, pace and strength you can use.",
      src: "/images/homepage/team/bobby-harrison-wall-ball.png",
      alt: "Bobby Harrison — Hybrid365 athlete training",
    },
  ],
  mindset: {
    title: "Mindset",
    body: "Discipline, higher standards and the resilience to keep doing hard things. An unbreakable mindset is built through the work — not slogans.",
  },
} as const;

/**
 * Athlete photos: mappings taken from existing repo metadata (filename + alt/copy),
 * not visual identification.
 * Ricci training.png is mapped in some files but is an unsafe/wrong-person asset —
 * announcement.png is the metadata-confirmed Ricci file.
 */
export const HYBRID_PERFORMANCE_ATHLETES = {
  eyebrow: "Hybrid365 athletes",
  headline: ["Muscle.", "Speed.", "Capability."],
  body: "People training to look strong, run fast and actually perform — not one quality at the expense of the others.",
  cards: [
    {
      id: "ben-kelly",
      name: "Ben Kelly",
      photoSrc: "/images/homepage/team/ben-kelly.jpg",
      photoAlt: "Ben Kelly — Hybrid365 athlete",
      imageClassName: "object-cover object-top",
      primary: { label: "5K", value: "16:16" },
      secondary: { label: "HYROX", value: "1:03 Pro Doubles" },
      focus: "Running + efficiency",
    },
    {
      id: "ricci-lee-jarvis",
      name: "Ricci-Lee Jarvis",
      photoSrc: "/images/homepage/team/ricci-lee-jarvis-announcement.png",
      photoAlt: "Ricci-Lee Jarvis — Hybrid365 athlete",
      imageClassName: "object-cover object-[82%_20%]",
      primary: { label: "5K", value: "18:45" },
      focus: "Strength + load tolerance",
    },
    {
      id: "rae-wall",
      name: "Rae Wall",
      photoSrc: "/images/homepage/team/rae-wall-training.png",
      photoAlt: "Rae Wall — Hybrid365 athlete",
      imageClassName: "object-cover object-top",
      primary: { label: "5K", value: "24:30" },
      focus: "Body composition",
    },
    {
      id: "bobby-harrison",
      name: "Bobby Harrison",
      photoSrc: "/images/homepage/team/bobby-harrison-wall-ball.png",
      photoAlt: "Bobby Harrison — Hybrid365 athlete",
      imageClassName: "object-cover object-top",
      primary: { label: "HYROX", value: "1:04" },
      focus: "Strength + running",
    },
  ],
} as const;

export const HYBRID_PERFORMANCE_FOUNDER = {
  headline: "From 100kg to 86kg.",
  supporting: "But the biggest change wasn't the weight.",
  note: "The goal stopped being losing weight. It became seeing what I was capable of.",
  fromWeight: "~100KG",
  toWeight: "86KG",
  fiveK: "16:00",
  hyrox: "59:14",
  hyroxEvent: "HYROX Pro Solo",
  photos: [
    {
      src: "/images/homepage/founder/kieran-starting-point.png",
      alt: "Kieran Higgs — starting point around 100kg",
      lines: ["~100KG"],
      imageClassName: "object-cover object-top grayscale",
    },
    {
      src: "/images/community/lean muscle phisique photo.jpg",
      alt: "Kieran Higgs — current lean physique",
      lines: ["86KG"],
      imageClassName: "object-cover object-top",
    },
    {
      src: "/images/community/running.jpg",
      alt: "Kieran Higgs — running performance",
      lines: ["5K", "16:00"],
      imageClassName: "object-cover object-center",
    },
    {
      src: "/images/hyrox-team/Hyrox-Result.jpg",
      alt: "Kieran Higgs — 59:14 Pro Solo HYROX",
      lines: ["HYROX PRO SOLO", "59:14"],
      imageClassName: "object-cover object-top",
    },
  ],
} as const;

export const HYBRID_PERFORMANCE_SYSTEM = {
  eyebrow: "The coaching system",
  headline: "Test → Build → Train → Review → Progress",
  steps: [
    {
      number: "01",
      title: "Test",
      body: "Establish where you are: running, aerobic capacity, strength, relevant bike/erg performance, training history, goals and availability.",
    },
    {
      number: "02",
      title: "Build",
      body: "An individual programme around those results — not a generic hybrid template.",
    },
    {
      number: "03",
      title: "Train",
      body: "Clear weekly structure with individual pace, load and intensity targets.",
    },
    {
      number: "04",
      title: "Review",
      body: "Weekly check-ins and coach feedback so the work can actually be adapted.",
    },
    {
      number: "05",
      title: "Progress",
      body: "Training blocks move with you. The standard rises as you do.",
    },
  ],
} as const;

export type HybridPerformancePlatformSlide = {
  id: string;
  eyebrow: string;
  title: string;
  caption: string;
  points: string[];
  screenId: PhoneScreenId;
};

export const HYBRID_PERFORMANCE_PLATFORM = {
  eyebrow: "The Hybrid365 platform",
  headline: "The infrastructure behind the coaching.",
  slides: [
    {
      id: "week",
      eyebrow: "Your week",
      title: "Know the structure.",
      caption: "A clear week of training — sessions, purpose and recovery — built around your life.",
      points: ["Weekly structure", "Session purpose", "Built around your days"],
      screenId: "programme" as const,
    },
    {
      id: "session",
      eyebrow: "Your session",
      title: "Know exactly what to do.",
      caption: "Pace, load and intensity prescribed for the session in front of you — not a vague workout.",
      points: ["Purpose", "Pace / watts / load", "Intensity"],
      screenId: "threshold-run" as const,
    },
    {
      id: "progress",
      eyebrow: "Your progress",
      title: "See the work paying off.",
      caption: "Check-ins, benchmarks and tracking so the plan can change as you do.",
      points: ["Weekly check-ins", "Benchmarks", "Coach review"],
      screenId: "weekly-check-in" as const,
    },
  ] satisfies HybridPerformancePlatformSlide[],
} as const;

/**
 * Checklist aligned to the existing Hybrid 1-1 operational offer
 * (one-to-one-coaching inclusions + application / assessment flow).
 * Nutrition is library + coaching guidance — not a custom meal-plan service.
 */
export const HYBRID_PERFORMANCE_INCLUDED = {
  eyebrow: "What's included",
  headline: "Hybrid Performance 1-1.",
  note: "Application-based coaching. No payment on this page.",
  items: [
    "Full athlete assessment",
    "Initial performance testing",
    "Individual training programme",
    "Individual running targets",
    "Individual strength prescription",
    "Strength and hypertrophy programming where it fits your goal",
    "Aerobic development",
    "Weekly programme adjustments",
    "Direct coach contact",
    "Weekly check-ins",
    "Performance tracking in the Hybrid365 athlete app",
    "Nutrition support (library, recipes and coaching guidance)",
    "Training blocks built around your goals",
  ],
} as const;

export const HYBRID_PERFORMANCE_IDENTITY = {
  eyebrow: "The Hybrid365 standard",
  headline: ["For people who", "refuse average."],
  body: "This is not just about hitting numbers. It is about becoming someone who trains with purpose, keeps promises to themselves, raises their standards and continually pursues improvement.",
} as const;

export const HYBRID_PERFORMANCE_STICKY = {
  primaryCta: "Apply now",
  primaryHref: HYBRID_PERFORMANCE_APPLY_HREF,
  supporting: "See what you're capable of.",
  points: [
    { title: "1-1 Coaching", body: "Fully personalised" },
    { title: "Test. Train. Review.", body: "Data led. Results driven." },
    { title: "Real human coach", body: "Here to push and guide you." },
  ],
} as const;

export const HYBRID_PERFORMANCE_FINAL = {
  headline: ["See what you're", "capable of."],
  supporting:
    "Build strength. Run faster. Transform your fitness and become a more complete athlete.",
  primaryCta: "Apply for 1-1 coaching",
  primaryHref: HYBRID_PERFORMANCE_APPLY_HREF,
  motto: "Refuse average.",
} as const;

export const HYBRID_PERFORMANCE_APPLY_PAGE = {
  eyebrow: "Hybrid365 Hybrid Performance · 1-1 application",
  headline: ["Apply for", "Hybrid Performance 1-1."],
  body: "Application-based 1-1 coaching for athletes who want strength, muscle, speed and fitness in one system. Take your time — every application is reviewed manually.",
  backLabel: "← Back to Hybrid Performance",
  backHref: "/hybrid-performance",
} as const;
