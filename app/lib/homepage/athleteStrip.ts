/** Real athlete teaser strip — first human section after hero. */

export type AthleteStripCard = {
  id: string;
  name: string;
  photoSrc: string;
  photoAlt: string;
  metrics: { label: string; value: string }[];
  focus: string;
};

export const ATHLETE_STRIP_COPY = {
  eyebrow: "The team",
  headline: ["Real athletes.", "Real progression."],
  body: "People with different goals.\nOne coaching system.",
} as const;

export const ATHLETE_STRIP_CARDS: AthleteStripCard[] = [
  {
    id: "ben-kelly",
    name: "Ben Kelly",
    photoSrc: "/images/homepage/team/ben-kelly-training.png",
    photoAlt: "Ben Kelly — Hybrid365 HYROX Team athlete",
    metrics: [
      { label: "5K", value: "16:16" },
      { label: "HYROX", value: "1:03 Pro Doubles" },
    ],
    focus: "Efficiency",
  },
  {
    id: "ricci-lee-jarvis",
    name: "Ricci-Lee Jarvis",
    photoSrc: "/images/homepage/team/ricci-lee-jarvis-training.png",
    photoAlt: "Ricci-Lee Jarvis — Hybrid365 HYROX Team athlete",
    metrics: [{ label: "5K", value: "18:45" }],
    focus: "Strength + Load Tolerance",
  },
  {
    id: "rae-wall",
    name: "Rae Wall",
    photoSrc: "/images/homepage/team/rae-wall-training.png",
    photoAlt: "Rae Wall — Hybrid365 HYROX Team athlete",
    metrics: [{ label: "5K", value: "24:30" }],
    focus: "Body Composition",
  },
  {
    id: "bobby-harrison",
    name: "Bobby Harrison",
    photoSrc: "/images/homepage/team/bobby-harrison-wall-ball.png",
    photoAlt: "Bobby Harrison — Hybrid365 HYROX Team athlete",
    metrics: [{ label: "HYROX", value: "1:04" }],
    focus: "Strength + Running",
  },
];
