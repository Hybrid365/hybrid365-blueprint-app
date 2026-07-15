/**
 * Athlete proof — confirmed results only (no invented quotes).
 * Replace with verified testimonials when supplied.
 */

import { ATHLETE_PROFILES, FOUNDER_TRANSFORM } from "@/app/lib/homepage/peopleWhoRefuseAverage";

export const ATHLETE_PROOF_COPY = {
  eyebrow: "Athlete proof",
  headline: ["Real athletes.", "Real standards."],
  body: "Confirmed performance markers from people inside the Hybrid365 system — not generic praise.",
  note: "Built around your life, not forced on top of it.",
} as const;

export type ProofCard = {
  id: string;
  name: string;
  photoSrc: string;
  photoAlt: string;
  trackHint: string;
  result: string;
  context: string;
};

export const ATHLETE_PROOF_CARDS: ProofCard[] = [
  {
    id: "kieran-proof",
    name: FOUNDER_TRANSFORM.name,
    photoSrc: FOUNDER_TRANSFORM.currentPhoto.src,
    photoAlt: FOUNDER_TRANSFORM.currentPhoto.alt,
    trackHint: "HYROX · Founder",
    result: "25-min 5K → 16:00 · 59:14 Pro HYROX",
    context: FOUNDER_TRANSFORM.copy[0],
  },
  ...ATHLETE_PROFILES.map((athlete) => ({
    id: `${athlete.id}-proof`,
    name: athlete.name,
    photoSrc: athlete.photoSrc,
    photoAlt: athlete.photoAlt,
    trackHint: athlete.focus,
    result: athlete.secondaryMetric
      ? `${athlete.metric.label} ${athlete.metric.value} · ${athlete.secondaryMetric.label} ${athlete.secondaryMetric.value}`
      : `${athlete.metric.label} ${athlete.metric.value}`,
    context: `Coaching focus: ${athlete.focus}.`,
  })),
];
