/** Athlete screening and personalisation flow — homepage storytelling only. */

export const SCREENING_COPY = {
  eyebrow: "Personalised from day one",
  headline: ["We don't guess.", "We build from data."],
  body: "Before your programme is built, we assess where you are now, what you are chasing and what your week can realistically support.",
  close: ["Data in.", "Better decisions out."],
  note: "No two athletes receive the same week by default.",
} as const;

export type ScreeningStep = {
  number: string;
  title: string;
  items: string[];
  microcopy: string;
};

export const SCREENING_STEPS: ScreeningStep[] = [
  {
    number: "01",
    title: "Athlete Screening",
    items: [
      "Goals",
      "Training history",
      "Current weekly structure",
      "Injury history",
      "Available equipment",
      "Available training days",
      "Lifestyle and recovery",
      "Upcoming races or events",
    ],
    microcopy: "We understand the athlete before writing the programme.",
  },
  {
    number: "02",
    title: "Baseline Data",
    items: [
      "Current 5K / 10K benchmarks",
      "HYROX PB or station scores",
      "Current strength markers",
      "Current training volume",
      "Body-composition goals where relevant",
      "Recovery and consistency baseline",
    ],
    microcopy: "Your starting point determines the first progression — not a generic week number.",
  },
  {
    number: "03",
    title: "Programme Design",
    items: [
      "Run volume",
      "Strength exposures",
      "Intensity distribution",
      "Hybrid sessions",
      "Recovery days",
      "Session purpose",
      "Progression blocks",
    ],
    microcopy: "Every session has a purpose and a place in the wider week.",
  },
  {
    number: "04",
    title: "Daily Accountability",
    items: [
      "Session completion",
      "RPE",
      "Pace / time / load",
      "Notes",
      "Pain or tightness",
      "Coach feedback",
      "Adherence",
    ],
    microcopy: "Your programme does not disappear after it is delivered.",
  },
  {
    number: "05",
    title: "Weekly Adaptation",
    items: [
      "Weekly check-in",
      "Sleep",
      "Energy",
      "Soreness",
      "Bodyweight",
      "Session completion",
      "Progress review",
      "Programme adjustment",
    ],
    microcopy: "Training evolves around real feedback, recovery and performance.",
  },
];
