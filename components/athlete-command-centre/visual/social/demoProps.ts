/**
 * Clearly labelled prototype values for staging social cards.
 * These are not live athlete results and must never be rendered as such.
 */
export const SOCIAL_PROTOTYPE_DEMO = {
  athleteName: "Prototype athlete",
  sessionName: "Threshold run",
  rpe: "7",
  duration: "48 min",
  note: "Demo card — sample copy only",
  weekLabel: "Week 3 · Build",
  completed: 4,
  planned: 5,
  focus: "Demo focus — not coach copy",
  benchmarkLabel: "5K",
  benchmarkValue: "17:55",
  benchmarkDerived: "3:35/km",
  benchmarkStatus: "Current",
} as const;
