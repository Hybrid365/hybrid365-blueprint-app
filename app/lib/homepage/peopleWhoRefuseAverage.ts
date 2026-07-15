/**
 * People Who Refuse Average — confirmed athlete data only.
 * Primary photos: real training/race imagery (not announcement posters).
 */

export const PEOPLE_COPY = {
  eyebrow: "Real athletes",
  headline: ["The people who", "refuse average."],
  body: "Different starting points. Different goals. One standard.",
} as const;

export const FOUNDER_TRANSFORM = {
  name: "Kieran Higgs",
  roleLabel: "Founder · Hybrid365",
  startPhoto: {
    src: "/images/homepage/founder/kieran-starting-point.png",
    alt: "Kieran Higgs — starting point",
  },
  currentPhoto: {
    src: "/images/community/lean muscle phisique photo.jpg",
    alt: "Kieran Higgs — current Hybrid365 standard",
  },
  progressions: [
    { from: "25-minute 5K", to: "16:00 5K" },
    { from: "Overweight and directionless", to: "59:14 Pro HYROX" },
  ],
  copy: [
    "From overweight and running a 25-minute 5K to becoming stronger, fitter and leaner than ever before.",
    "The biggest change was having structure, purpose and a clear direction for the work.",
    "No more wasted potential.",
  ],
} as const;

export type AthleteProfile = {
  id: string;
  name: string;
  photoSrc: string;
  photoAlt: string;
  metric: { label: string; value: string };
  secondaryMetric?: { label: string; value: string };
  focus: string;
};

/** Confirmed metrics from approved repository / team graphics. */
export const ATHLETE_PROFILES: AthleteProfile[] = [
  {
    id: "ben-kelly",
    name: "Ben Kelly",
    photoSrc: "/images/homepage/team/ben-kelly-training.png",
    photoAlt: "Ben Kelly — Hybrid365 athlete",
    metric: { label: "5K", value: "16:16" },
    secondaryMetric: { label: "HYROX", value: "1:03 Pro Doubles" },
    focus: "Efficiency",
  },
  {
    id: "ricci-lee-jarvis",
    name: "Ricci-Lee Jarvis",
    photoSrc: "/images/homepage/team/ricci-lee-jarvis-training.png",
    photoAlt: "Ricci-Lee Jarvis — Hybrid365 athlete",
    metric: { label: "5K", value: "18:45" },
    focus: "Strength + Load Tolerance",
  },
  {
    id: "rae-wall",
    name: "Rae Wall",
    photoSrc: "/images/homepage/team/rae-wall-training.png",
    photoAlt: "Rae Wall — Hybrid365 athlete",
    metric: { label: "5K", value: "24:30" },
    focus: "Body Composition",
  },
  {
    id: "bobby-harrison",
    name: "Bobby Harrison",
    photoSrc: "/images/homepage/team/bobby-harrison-wall-ball.png",
    photoAlt: "Bobby Harrison — Hybrid365 athlete",
    metric: { label: "HYROX", value: "1:04" },
    focus: "Strength + Running",
  },
];
