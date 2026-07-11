/** Homepage-only athlete editorial photography — real Hybrid365 assets. */

export type EditorialPhotoTreatment =
  | "bleed-left"
  | "bleed-right"
  | "fade-bottom"
  | "fade-edges"
  | "angled-tr"
  | "soft-mask"
  | "cinematic";

export type AthleteEditorialPhoto = {
  id: string;
  src: string;
  alt: string;
  treatment: EditorialPhotoTreatment;
  /** CSS object-position hint */
  objectPosition?: string;
};

/** Primary real Hybrid365 athlete photography — attached Jul 2026 */
export const ATHLETE_EDITORIAL_PHOTOS: Record<string, AthleteEditorialPhoto> = {
  strengthSession: {
    id: "strength-session",
    src: "/images/homepage/athletes/athlete-strength-session.png",
    alt: "Hybrid365 athlete — strength session under cinematic gym light",
    treatment: "cinematic",
    objectPosition: "center 20%",
  },
  treadmillEffort: {
    id: "treadmill-effort",
    src: "/images/homepage/athletes/athlete-treadmill-effort.png",
    alt: "Hybrid365 athlete — threshold effort on the treadmill",
    treatment: "cinematic",
    objectPosition: "center center",
  },
  gritProfile: {
    id: "grit-profile",
    src: "/images/homepage/athletes/athlete-grit-profile.png",
    alt: "Hybrid365 athlete — focused effort, sweat and discipline",
    treatment: "fade-edges",
    objectPosition: "center center",
  },
  /** Founder proof — retained for results journey */
  raceFinish: {
    id: "race-finish",
    src: "/images/hyrox-team/Hyrox-Result.jpg",
    alt: "Hybrid365 founder crossing the HYROX finish line",
    treatment: "soft-mask",
    objectPosition: "center top",
  },
};

/** Hero: one powerful image max — subtle environment only */
export const HERO_ECOSYSTEM_PHOTO = ATHLETE_EDITORIAL_PHOTOS.gritProfile;

/** Identity / standard section — introduce community through all three */
export const STANDARD_COLLAGE_PHOTOS = [
  ATHLETE_EDITORIAL_PHOTOS.strengthSession,
  ATHLETE_EDITORIAL_PHOTOS.treadmillEffort,
  ATHLETE_EDITORIAL_PHOTOS.gritProfile,
] as const;

/** Results section — effort imagery alongside metrics */
export const RESULTS_EDITORIAL_PHOTOS = [
  ATHLETE_EDITORIAL_PHOTOS.treadmillEffort,
  ATHLETE_EDITORIAL_PHOTOS.strengthSession,
] as const;

/** Community — strongest visual presence */
export const COMMUNITY_EDITORIAL_PHOTOS = STANDARD_COLLAGE_PHOTOS;
