/** The four foundations of the Hybrid365 HYROX performance system. */

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
    body: "Progress running speed through controlled threshold work, aerobic capacity and pacing discipline — the engine behind every HYROX race.",
  },
  {
    id: "lift-heavy",
    title: "Lift Heavy",
    headline: "Strength that transfers to race day",
    body: "Useful strength and leg endurance for sled, stations and compromised running — without turning every gym session into junk volume.",
  },
  {
    id: "perform",
    title: "Perform",
    headline: "Race-specific HYROX integration",
    body: "The four pillars combine into one system: running, strength and station work sequenced for progression, recovery and race-day execution.",
  },
];
