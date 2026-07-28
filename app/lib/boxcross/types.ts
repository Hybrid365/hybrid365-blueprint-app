/**
 * BoxCross UK 1KM Ski Challenge — types + config constants.
 * Isolated module. Does not touch Hybrid365 coaching / Free Week / Community.
 */

export const BOXCROSS_CHALLENGE_SLUG = "boxcross-1km-ski-challenge";

export type BoxCrossSkiCategory = "male" | "female";

export type BoxCrossVerificationMethod = "staff_witnessed" | "full_video";

export type BoxCrossChallengeStatus = "upcoming" | "active" | "final" | "archived";

export type BoxCrossSkiChallenge = {
  id: string;
  title: string;
  slug: string;
  start_date: string;
  end_date: string;
  status: BoxCrossChallengeStatus;
  male_prize: string;
  female_prize: string;
  video_url: string | null;
  created_at: string;
  updated_at: string;
};

export type BoxCrossSkiAttempt = {
  id: string;
  challenge_id: string;
  athlete_name: string;
  category: BoxCrossSkiCategory;
  /** Elapsed time in milliseconds for accurate sort. */
  time_ms: number;
  attempted_at: string;
  verification_method: BoxCrossVerificationMethod;
  verified: boolean;
  verified_by: string | null;
  proof_url: string | null;
  witness_name: string | null;
  internal_notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

/** Public-safe attempt shape (no internal notes). */
export type BoxCrossPublicAttempt = {
  id: string;
  athlete_name: string;
  category: BoxCrossSkiCategory;
  time_ms: number;
  time_display: string;
  attempted_at: string;
  verification_method: BoxCrossVerificationMethod;
  verified: true;
  witness_name: string | null;
  has_proof: boolean;
};

export type BoxCrossLeaderboardRow = BoxCrossPublicAttempt & {
  rank: number;
  isNewest: boolean;
  isMaleLeader: boolean;
  isFemaleLeader: boolean;
};

export type BoxCrossLeaderboardTab = "overall" | "male" | "female";

export type BoxCrossLeaderboardPayload = {
  challenge: {
    id: string;
    title: string;
    slug: string;
    start_date: string;
    end_date: string;
    status: BoxCrossChallengeStatus;
    male_prize: string;
    female_prize: string;
    video_url: string | null;
    is_final: boolean;
    accepts_entries: boolean;
  };
  rows: BoxCrossLeaderboardRow[];
  stats: {
    total_verified_attempts: number;
    unique_athletes: number;
    fastest_overall: BoxCrossLeaderboardRow | null;
    male_leader: BoxCrossLeaderboardRow | null;
    female_leader: BoxCrossLeaderboardRow | null;
    last_updated: string | null;
  };
  generated_at: string;
};

export type BoxCrossCreateAttemptInput = {
  athlete_name: string;
  category: BoxCrossSkiCategory;
  /** Accepts "3:42.6", "3:42", or milliseconds number. */
  time: string | number;
  attempted_at: string;
  verification_method: BoxCrossVerificationMethod;
  verified?: boolean;
  verified_by?: string | null;
  proof_url?: string | null;
  witness_name?: string | null;
  internal_notes?: string | null;
  created_by?: string | null;
  /** Allow dates outside challenge window (admin override). */
  allow_outside_period?: boolean;
};

export const BOXCROSS_GYM = {
  name: "BoxCross UK Gym Wisbech",
  addressLine: "15 Regal Road, Wisbech",
} as const;

export const BOXCROSS_LOGO_PLACEHOLDER_PATH = "/images/boxcross/logo-placeholder.svg";
export const BOXCROSS_OG_PLACEHOLDER_PATH = "/images/boxcross/og-placeholder.svg";

/** Required production assets — replace placeholders when official files arrive. */
export const BOXCROSS_REQUIRED_ASSETS = [
  {
    path: "public/images/boxcross/logo.svg",
    purpose: "Official BoxCross logo (high-resolution SVG or PNG)",
  },
  {
    path: "public/images/boxcross/og-image.jpg",
    purpose: "Open Graph / social share image (~1200×630)",
  },
  {
    path: "public/images/boxcross/challenge-poster.jpg",
    purpose: "Video poster / hero SkiErg imagery",
  },
] as const;
