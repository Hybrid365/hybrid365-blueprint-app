/**
 * Verified athlete proof / coaching case studies.
 *
 * Shared content layer so homepage, /hybrid-performance, /hyrox-team and a
 * future Hybrid Performance Track page can opt in independently.
 * Do not auto-mount this on those pages — select by surface.
 *
 * Store only verified information. Do not invent test values.
 */

export type ProofSurface =
  | "homepage"
  | "hybrid-performance"
  | "hyrox-team"
  | "hybrid-performance-track";

export type ProofMetricSource = "supplied_asset" | "repo_verified" | "coach_context";

export type ProofMetricContext = "starting" | "testing" | "on_file";

export type ProofMetric = {
  id: string;
  label: string;
  value: string;
  detail?: string;
  context: ProofMetricContext;
  source: ProofMetricSource;
  /** Surface in the 2–4 key data points on a case-study card. */
  highlight?: boolean;
};

export type ProofAssetKind = "testing-week" | "test-strip" | "training" | "portrait";

export type ProofAsset = {
  src: string;
  alt: string;
  kind: ProofAssetKind;
  label?: string;
  width: number;
  height: number;
  objectPosition?: string;
};

export type ProofStageResult = {
  stage: string;
  work: string;
  detail?: string;
  time: string;
};

export type ProofPortrait = {
  src: string;
  alt: string;
  objectPosition?: string;
  /**
   * ASSET REPLACEMENT REQUIRED when true.
   * Only a chrome-bearing announcement crop is safely mapped — not a final portrait.
   */
  temporaryAnnouncement?: boolean;
};

export type ProofCardMetric = {
  id: string;
  label: string;
  value: string;
  previous?: string;
  note?: string;
};

export type AthleteCaseStudy = {
  id: string;
  athlete: {
    id: string;
    name: string;
    firstName: string;
  };
  headline: string;
  contrastLine: string;
  startingProfile: {
    summary: string;
    markers: ProofMetric[];
  };
  identified: string;
  trained: string[];
  improved: string[];
  coachNote: string;
  /** Compact 25–45 word note for slider cards. */
  cardNote: string;
  identityCallout?: string;
  portrait: ProofPortrait;
  cardMetrics: ProofCardMetric[];
  verifiedResults: ProofMetric[];
  assets: ProofAsset[];
  stages?: ProofStageResult[];
  surfaces: ProofSurface[];
};
