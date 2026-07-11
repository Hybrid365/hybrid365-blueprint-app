/** The four foundations of the Hybrid365 performance system. */

export type PerformancePillar = {
  id: string;
  title: string;
  headline: string;
  body: string;
};

export const PERFORMANCE_PILLARS: PerformancePillar[] = [
  {
    id: "run-fast",
    title: "Run Fast",
    headline: "Build a real engine",
    body: "Threshold work, aerobic development and pacing discipline — for HYROX, 5Ks, or hybrid athletes who need a faster run leg.",
  },
  {
    id: "lift-heavy",
    title: "Lift Heavy",
    headline: "Strength that carries over",
    body: "Useful strength and leg endurance for the gym floor, sled work and compromised running — without junk volume.",
  },
  {
    id: "look-athletic",
    title: "Look Athletic",
    headline: "Lean, strong, athletic",
    body: "Body composition that looks the part — muscle that supports performance, not random HIIT that stalls progress.",
  },
  {
    id: "perform-better",
    title: "Perform Better",
    headline: "One integrated system",
    body: "Running, strength and conditioning sequenced into blocks with recovery, progression and race-day execution — HYROX pathways included.",
  },
];

export const HERO_PILLAR_LABELS = PERFORMANCE_PILLARS.map((p) => p.title);
