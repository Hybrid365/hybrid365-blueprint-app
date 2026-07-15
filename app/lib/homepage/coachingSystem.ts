/** Coaching system phone views — real UI cutouts only. */

import type { PhoneScreenId } from "@/app/lib/homepage/phoneScreens";

export const COACHING_SYSTEM_COPY = {
  eyebrow: "The coaching system",
  headline: ["Not a PDF.", "A complete coaching system."],
  body: "Your sessions, feedback, benchmarks and progress live in one clear coaching experience.",
  note: "Your programme changes as your performance and recovery change.",
} as const;

export type CoachingSystemView = {
  id: string;
  label: string;
  question: string;
  screenId: PhoneScreenId;
};

export const COACHING_SYSTEM_VIEWS: CoachingSystemView[] = [
  {
    id: "programme",
    label: "Programme",
    question: "What am I doing this week?",
    screenId: "programme",
  },
  {
    id: "session",
    label: "Session Detail",
    question: "Why am I doing this session?",
    screenId: "threshold-run",
  },
  {
    id: "check-in",
    label: "Weekly Check-In",
    question: "How am I recovering?",
    screenId: "weekly-check-in",
  },
  {
    id: "progress",
    label: "Progress Tracking",
    question: "Am I improving?",
    screenId: "progress-overview",
  },
  {
    id: "benchmarks",
    label: "Benchmark Testing",
    question: "What needs work next?",
    screenId: "performance-testing",
  },
];
