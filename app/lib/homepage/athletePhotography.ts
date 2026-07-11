/** Homepage-only athlete editorial photography — real Hybrid365 assets. */

export type EditorialPhotoTreatment =
  | "bleed-left"
  | "bleed-right"
  | "fade-bottom"
  | "angled-tr"
  | "soft-mask";

export type AthleteEditorialPhoto = {
  id: string;
  src: string;
  alt: string;
  treatment: EditorialPhotoTreatment;
  /** CSS object-position hint */
  objectPosition?: string;
};

export const ATHLETE_EDITORIAL_PHOTOS: Record<string, AthleteEditorialPhoto> = {
  trainingIntensity: {
    id: "training-intensity",
    src: "/images/hyrox-team/Sequence 01.00_37_26_11.Still015.jpg",
    alt: "Hybrid365 athlete training with focus and intensity",
    treatment: "bleed-left",
    objectPosition: "center 30%",
  },
  teamEffort: {
    id: "team-effort",
    src: "/images/hyrox-team/Sequence 01.00_45_14_14.Still017.jpg",
    alt: "Hybrid365 athletes pushing through a hard session",
    treatment: "bleed-right",
    objectPosition: "center 40%",
  },
  hybridGrind: {
    id: "hybrid-grind",
    src: "/images/hyrox-team/dump5.jpg",
    alt: "Hybrid365 athlete mid-session — discipline in action",
    treatment: "fade-bottom",
    objectPosition: "center top",
  },
  strengthStandard: {
    id: "strength-standard",
    src: "/images/hyrox-team/b-and-ww.jpg",
    alt: "Hybrid365 athlete — strength and conditioning standard",
    treatment: "angled-tr",
    objectPosition: "center center",
  },
  raceFinish: {
    id: "race-finish",
    src: "/images/hyrox-team/Hyrox-Result.jpg",
    alt: "Hybrid365 founder crossing the HYROX finish line",
    treatment: "soft-mask",
    objectPosition: "center top",
  },
  communityRun: {
    id: "community-run",
    src: "/images/community/running.jpg",
    alt: "Hybrid365 community athlete running",
    treatment: "fade-bottom",
    objectPosition: "center center",
  },
};

/** Hero ecosystem environment layers */
export const HERO_ECOSYSTEM_PHOTOS = [
  ATHLETE_EDITORIAL_PHOTOS.trainingIntensity,
  ATHLETE_EDITORIAL_PHOTOS.teamEffort,
] as const;

/** Standard section collage */
export const STANDARD_COLLAGE_PHOTOS = [
  ATHLETE_EDITORIAL_PHOTOS.trainingIntensity,
  ATHLETE_EDITORIAL_PHOTOS.hybridGrind,
  ATHLETE_EDITORIAL_PHOTOS.strengthStandard,
  ATHLETE_EDITORIAL_PHOTOS.teamEffort,
] as const;
