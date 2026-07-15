/** Homepage FAQ — conversion-ordered, concise. */

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
    id: "after-submit",
    question: "What happens after I submit the assessment?",
    answer:
      "You receive a personalised free training week structured around your goal, level, schedule and equipment.",
  },
  {
    id: "personalised",
    question: "Is every free week personalised?",
    answer:
      "Yes. Your answers shape the emphasis, volume and balance of the week — not a copied template.",
  },
  {
    id: "which-track",
    question: "Which coaching track is right for me?",
    answer:
      "Choose the outcome you care about most. If you’re unsure, complete the assessment and we’ll recommend the best starting point.",
  },
  {
    id: "days",
    question: "How many days per week do I need?",
    answer:
      "It depends on your screening. We build around the days and recovery your week can support.",
  },
  {
    id: "only-hyrox",
    question: "Is Hybrid365 only for HYROX athletes?",
    answer:
      "No. HYROX is one track. Run Performance and Strong. Fit. Fast. sit under the same coaching system.",
  },
  {
    id: "checkins",
    question: "How do check-ins and accountability work?",
    answer:
      "Session feedback and weekly recovery check-ins keep the programme connected to what’s actually happening — plus challenges and leaderboards in the community.",
  },
  {
    id: "telegram",
    question: "What is posted in the Telegram community?",
    answer:
      "HYROX, running, lifting and functional sessions, weekly challenges, leaderboards, discussion and group accountability.",
  },
  {
    id: "after-free",
    question: "What happens after the free week?",
    answer:
      "You can keep training with the free community, or continue into coaching if the system and standard fit what you want.",
  },
];
