/**
 * /start coaching pathway selector — copy and destination mapping only.
 * Lead insert still goes through POST /api/start/talk → coaching_enquiries.
 */

export const START_LOGIN_HREF = "/login";

export const START_GOAL_COPY = {
  eyebrow: "HYBRID365",
  headline: "What are you training for?",
  supporting: "Choose your primary goal and we'll show you the best Hybrid365 pathway.",
  proofLabel: "Trusted by athletes. Proven in performance.",
  loginPrompt: "Already a member?",
  loginCta: "Log in",
} as const;

export type StartGoalId = "hybrid" | "hyrox";
export type StartFunnelStep = 1 | 2 | 3;

export const START_GOALS = {
  hybrid: {
    id: "hybrid" as const,
    title: "Hybrid Performance",
    positioning: "Run faster. Lift stronger. Perform everywhere.",
    supporting: "Build strength, muscle, speed and complete fitness.",
    enquiryGoal: "Hybrid Performance",
    imageSrc: "/images/community/running.jpg",
    imageAlt: "Kieran Higgs running",
    imageClassName:
      "object-cover object-[78%_12%] sm:object-[76%_16%] lg:object-[68%_26%]",
  },
  hyrox: {
    id: "hyrox" as const,
    title: "HYROX Performance",
    positioning: "Train specifically for HYROX. Race with confidence.",
    supporting: "Race-specific running, stations and confidence under fatigue.",
    enquiryGoal: "HYROX Performance",
    imageSrc: "/images/homepage/team/bobby-harrison-farmers-carry.png",
    imageAlt: "Bobby Harrison — Hybrid365 athlete, HYROX farmers carry",
    imageClassName:
      "object-cover object-[center_30%] sm:object-[center_26%] lg:object-[center_22%]",
  },
} as const;

export const START_LEAD_COPY = {
  kicker: "Great choice.",
  headline: "Where should we send your recommendation?",
  supporting: "Enter your details and we'll show you the best way to achieve your goal.",
  cta: "Show me my options →",
  submitting: "Showing options…",
  privacy: "We respect your privacy. No spam.",
  back: "← Change goal",
} as const;

export const START_SUPPORT_COPY = {
  goalLabel: "Your goal",
  headline: "How do you want to be coached?",
  supporting: "Choose the support level that suits you best.",
  back: "← Change goal",
} as const;

export const START_SUPPORT_OPTIONS = {
  hybrid: [
    {
      id: "hybrid-track",
      icon: "system" as const,
      eyebrow: "Follow the system",
      title: "Track",
      positioning: "Structured programme, platform and accountability.",
      price: "£39.99/month",
      href: "/hybrid-performance/track",
    },
    {
      id: "hybrid-1-1",
      icon: "coach" as const,
      eyebrow: "Work directly with a coach",
      title: "1-1 Coaching",
      positioning: "Individual programming, direct coaching and ongoing adaptation.",
      price: null,
      href: "/hybrid-performance",
    },
  ],
  hyrox: [
    {
      id: "hyrox-track",
      icon: "system" as const,
      eyebrow: "Follow the system",
      title: "HYROX Track",
      positioning: "Structured HYROX programming, testing and progression.",
      price: null,
      href: "/hyrox-community",
    },
    {
      id: "hyrox-team",
      icon: "coach" as const,
      eyebrow: "Work directly with a coach",
      title: "HYROX Team",
      positioning: "Personalised programming, direct coaching and team support.",
      price: null,
      href: "/hyrox-team",
    },
  ],
} as const;

export const START_PLATFORM_PREVIEWS = [
  {
    id: "programme" as const,
    label: "Your programme",
  },
  {
    id: "threshold-run" as const,
    label: "Your sessions",
  },
  {
    id: "progress-overview" as const,
    label: "Your progress",
  },
] as const;

/** Compact first-viewport proof. Faces and metrics from verified Hybrid365 records. */
export const START_PROOF_STRIP = [
  {
    id: "rae",
    name: "Rae",
    metric: "5K 23:02",
    photoSrc: "/images/homepage/team/rae-wall-training.png",
    photoAlt: "Rae Wall — Hybrid365 athlete",
    photoClassName: "object-cover object-[center_18%]",
  },
  {
    id: "ricci",
    name: "Ricci",
    metric: "Hybrid Test 45:13.9",
    photoSrc: "/images/homepage/team/ricci-lee-jarvis-training.png",
    photoAlt: "Ricci-Lee Jarvis — Hybrid365 athlete",
    photoClassName: "object-cover object-center",
  },
  {
    id: "bobby",
    name: "Bobby",
    metric: "5K 18:42",
    photoSrc: "/images/homepage/team/bobby-harrison-announcement.png",
    photoAlt: "Bobby Harrison — Hybrid365 athlete",
    photoClassName: "object-cover object-[center_12%]",
  },
  {
    id: "founder",
    name: "Kieran",
    metric: "HYROX Pro 59:14",
    photoSrc: "/images/community/Main Hero photo of me.jpg",
    photoAlt: "Kieran Higgs — Hybrid365 founder",
    photoClassName: "object-cover object-[center_12%]",
  },
] as const;

export const TALK_COPY = {
  eyebrow: "TALK TO KIERAN",
  headline: "NOT SURE WHICH OPTION FITS?",
  body: "Tell me where you're currently at and what you're working towards. I'll point you in the right direction.",
  cta: "SEND MY DETAILS",
  instagramHint: "So I know who I'm speaking to if I reach out.",
  successTitle: "THANKS — I'VE GOT IT.",
  successBody:
    "I'll take a look at where you're currently at and point you towards the Hybrid365 coaching option that makes the most sense.",
  successNote: "If your Instagram account is private, keep an eye on your message requests.",
  trackCta: "Explore HYROX Track",
  trackHref: "/hyrox-community",
  teamCta: "View HYROX Team",
  teamHref: "/hyrox-team",
} as const;
