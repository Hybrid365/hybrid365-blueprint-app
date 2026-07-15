/** Homepage FAQ — conversion-focused, concise. */

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export const FAQ_COPY = {
  eyebrow: "Questions",
  headline: "Before you start",
} as const;

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: "only-hyrox",
    question: "Is Hybrid365 only for HYROX athletes?",
    answer:
      "No. HYROX Performance is one track. Run Performance and Strong. Fit. Fast. serve athletes chasing run PBs or athletic physique and hybrid fitness — all under the same coaching system.",
  },
  {
    id: "which-track",
    question: "Which track is right for me?",
    answer:
      "Choose the outcome you care about most right now. Your track sets emphasis; screening shapes the actual week. You are never locked into a generic template.",
  },
  {
    id: "personalised",
    question: "Is every programme personalised?",
    answer:
      "Yes. Goals, baseline data, equipment, schedule and feedback drive what you receive. No two athletes get the same week by default.",
  },
  {
    id: "days",
    question: "How many days per week do I need?",
    answer:
      "That depends on your screening — available days, recovery and current volume. We build around what your week can realistically support.",
  },
  {
    id: "gym-club",
    question: "Can the programme work around my gym or run club?",
    answer:
      "Yes. Available days, environment and existing commitments are part of screening so the week fits your life rather than fighting it.",
  },
  {
    id: "screening",
    question: "What happens during athlete screening?",
    answer:
      "We collect goals, training history, injury history, equipment, available days, lifestyle demands and upcoming events — before writing sessions.",
  },
  {
    id: "data",
    question: "What data do I need?",
    answer:
      "Current run benchmarks, HYROX or station scores where relevant, strength markers, training volume and recovery notes. More accurate baselines build better first progressions.",
  },
  {
    id: "checkins",
    question: "How do check-ins work?",
    answer:
      "Daily session feedback (completion, RPE, notes) plus a weekly check-in covering sleep, energy, soreness and progress so the programme can adapt.",
  },
  {
    id: "challenges",
    question: "What are the weekly challenges?",
    answer:
      "Short performance or consistency tests that give the team a shared reason to show up and a chance to measure progress without losing individual focus.",
  },
  {
    id: "leaderboards",
    question: "How do leaderboards work?",
    answer:
      "They recognise completion, challenge scores and progress — competitive motivation under a team standard, not a replacement for personalised coaching.",
  },
  {
    id: "after-free",
    question: "What happens after the free week?",
    answer:
      "You see how Hybrid365 would structure your training. From there you can continue into coaching if the system and standard fit what you want.",
  },
  {
    id: "track-diff",
    question: "What is the difference between the coaching tracks?",
    answer:
      "HYROX emphasises race running and stations. Run Performance emphasises 5K–half progression with supportive strength. Strong. Fit. Fast. balances physique, strength and aerobic fitness.",
  },
];
