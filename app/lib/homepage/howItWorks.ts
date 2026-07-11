/** What-you-get timeline — steps after primary CTA. */

export type HowItWorksStep = {
  step: number;
  title: string;
  description: string;
};

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    step: 1,
    title: "Build your personalised training week",
    description:
      "Answer a short assessment. Your Week 1 sample is built around your level, schedule, equipment and goals — including HYROX-specific options.",
  },
  {
    step: 2,
    title: "Receive your training dashboard",
    description:
      "Sessions, pacing targets, coaching notes and structure — delivered to your personal plan dashboard.",
  },
  {
    step: 3,
    title: "Join the free community",
    description:
      "Connect with other Hybrid365 athletes in the free Telegram group for accountability and support.",
  },
  {
    step: 4,
    title: "Progress into the Hybrid365 Team",
    description:
      "When you are ready for 1-1 coaching, race-specific programming and direct coach support — apply for the HYROX Team.",
  },
];
