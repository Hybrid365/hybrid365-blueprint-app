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
    body: "Threshold work and pacing discipline — for athletes who refuse average on the run leg, whether HYROX, 5K or hybrid.",
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
    body: "Running, strength and conditioning sequenced with recovery and progression — clarity for people who already put in the work.",
  },
];

export const HERO_PILLAR_LABELS = PERFORMANCE_PILLARS.map((p) => p.title);
