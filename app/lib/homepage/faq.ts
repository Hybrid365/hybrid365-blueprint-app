/** Homepage FAQ — short, conversion-focused. */

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
      "No. HYROX is one track. Run Performance and Strong. Fit. Fast. sit under the same coaching system.",
  },
  {
    id: "which-track",
    question: "Which track is right for me?",
    answer:
      "Choose the outcome you care about most right now. Your track sets emphasis — screening shapes the week.",
  },
  {
    id: "personalised",
    question: "Is every programme personalised?",
    answer:
      "Yes. Goals, baseline data, schedule, equipment and feedback drive what you receive.",
  },
  {
    id: "days",
    question: "How many days per week do I need?",
    answer:
      "It depends on your screening. We build around the days and recovery your week can support.",
  },
  {
    id: "screening",
    question: "What happens during athlete screening?",
    answer:
      "We collect goals, training history, PBs, injury history, schedule, equipment and upcoming races before writing sessions.",
  },
  {
    id: "checkins",
    question: "How do check-ins work?",
    answer:
      "Daily session feedback plus a weekly check-in on sleep, energy, soreness and adherence so training can adapt.",
  },
  {
    id: "after-free",
    question: "What happens after the free week?",
    answer:
      "You see how Hybrid365 would structure your training. From there you can continue into coaching if it fits.",
  },
];
