/** What-you-get timeline — steps after primary CTA. */

export type HowItWorksStep = {
  step: number;
  title: string;
  description: string;
};

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    step: 1,
    title: "Build your personalised week",
    description:
      "Short assessment. Week 1 built around your level, schedule, equipment and goals.",
  },
  {
    step: 2,
    title: "Train from your dashboard",
    description:
      "Sessions, pacing targets and coaching notes — structured like real coaching.",
  },
  {
    step: 3,
    title: "Join the community",
    description:
      "Accountability with athletes on the same standard — free Telegram group.",
  },
  {
    step: 4,
    title: "Level up to HYROX Team",
    description:
      "1-1 coaching, race-specific blocks and direct coach support when ready.",
  },
];
