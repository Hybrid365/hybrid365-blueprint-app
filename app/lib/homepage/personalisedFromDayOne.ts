/** Personalised From Day One — merged screening / build / track / adapt. */

export const PERSONALISED_COPY = {
  eyebrow: "Personalised from day one",
  headline: ["Data in.", "Better decisions out."],
  body: "We understand where you are now before deciding what comes next.",
  statement: ["Coached individually.", "Held to a team standard."],
} as const;

export type PersonalisedStage = {
  number: string;
  title: string;
  items: string[];
  microcopy: string;
};

export const PERSONALISED_STAGES: PersonalisedStage[] = [
  {
    number: "01",
    title: "Screen",
    items: [
      "Goals",
      "Current training",
      "Current PBs",
      "Injury history",
      "Schedule",
      "Equipment",
      "Upcoming races",
    ],
    microcopy: "We understand the athlete before building the week.",
  },
  {
    number: "02",
    title: "Build",
    items: [
      "Running",
      "Strength",
      "Hybrid work",
      "Intensity",
      "Recovery",
      "Progression",
    ],
    microcopy: "Every session has a purpose within the wider plan.",
  },
  {
    number: "03",
    title: "Track",
    items: [
      "Completion",
      "Pace",
      "Load",
      "RPE",
      "Pain or tightness",
      "Daily feedback",
    ],
    microcopy: "Your programme stays connected to what is actually happening.",
  },
  {
    number: "04",
    title: "Adapt",
    items: [
      "Sleep",
      "Energy",
      "Soreness",
      "Consistency",
      "Benchmarks",
      "Weekly check-ins",
    ],
    microcopy: "Your feedback shapes what comes next.",
  },
];

export const ACCOUNTABILITY_STRIP = [
  "Daily accountability",
  "Weekly challenges",
  "Leaderboards",
  "Team standards",
] as const;
