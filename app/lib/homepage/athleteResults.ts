/**
 * Athlete results for homepage — REPLACE placeholders with verified client data.
 * Set `placeholder: false` and remove placeholderNote when data is confirmed.
 */

export type AthleteResult = {
  id: string;
  /** PLACEHOLDER — replace with real name */
  name: string;
  photoSrc: string;
  photoAlt: string;
  hyroxPb: string;
  hyroxStart?: string;
  improvement: string;
  runningPb?: string;
  testimonial: string;
  currentGoal?: string;
  placeholder?: boolean;
  placeholderNote?: string;
};

export const ATHLETE_RESULTS: AthleteResult[] = [
  {
    id: "placeholder-1",
    name: "[Athlete name]",
    photoSrc: "/images/homepage/athletes/athlete-strength-session.png",
    photoAlt: "Hybrid365 athlete — strength and discipline",
    hyroxPb: "[Current PB]",
    hyroxStart: "[Starting PB]",
    improvement: "[+Xm improvement]",
    runningPb: "[5K PB]",
    testimonial:
      "[Short verified testimonial — specific result, what changed, how coaching helped.]",
    currentGoal: "[Race / target]",
    placeholder: true,
    placeholderNote: "Replace with verified athlete result #1",
  },
  {
    id: "placeholder-2",
    name: "[Athlete name]",
    photoSrc: "/images/homepage/athletes/athlete-treadmill-effort.png",
    photoAlt: "Hybrid365 athlete — engine work and threshold effort",
    hyroxPb: "[Current PB]",
    hyroxStart: "[Starting PB]",
    improvement: "[+Xm improvement]",
    runningPb: "[5K PB]",
    testimonial:
      "[Short verified testimonial — specific result, what changed, how coaching helped.]",
    currentGoal: "[Race / target]",
    placeholder: true,
    placeholderNote: "Replace with verified athlete result #2",
  },
  {
    id: "placeholder-3",
    name: "[Athlete name]",
    photoSrc: "/images/homepage/athletes/athlete-grit-profile.png",
    photoAlt: "Hybrid365 athlete — earned effort under pressure",
    hyroxPb: "[Current PB]",
    improvement: "[+Xm improvement]",
    testimonial:
      "[Short verified testimonial — specific result, what changed, how coaching helped.]",
    placeholder: true,
    placeholderNote: "Replace with verified athlete result #3",
  },
];
