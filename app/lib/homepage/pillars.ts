/** The four foundations of the Hybrid365 performance system. */

export type PerformancePillar = {
  id: string;
  title: string;
  headline: string;
  body: string;
};

export const PERFORMANCE_PILLARS: PerformancePillar[] = [
  {
    id: "look-good",
    title: "Look Good",
    headline: "Lean muscle that supports performance",
    body: "Build or retain athletic muscle without sacrificing run quality. Body composition follows structured hybrid training — not random HIIT.",
  },
  {
    id: "run-fast",
    title: "Run Fast",
    headline: "Threshold and aerobic development",
    body: "Progress running speed through controlled threshold work, aerobic capacity and pacing discipline — the engine behind hybrid performance and HYROX races.",
  },
  {
    id: "lift-heavy",
    title: "Lift Heavy",
    headline: "Strength that transfers to training and race day",
    body: "Useful strength and leg endurance for the gym, sled work and compromised running — without turning every session into junk volume.",
  },
  {
    id: "perform",
    title: "Perform",
    headline: "Integrated hybrid performance",
    body: "The four pillars combine into one system: running, strength and conditioning sequenced for progression, recovery and race-day execution — including HYROX-specific pathways.",
  },
];

/** Short labels for hero pillar strip */
export const HERO_PILLAR_LABELS = PERFORMANCE_PILLARS.map((p) => p.title);
