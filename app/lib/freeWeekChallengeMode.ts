export type ChallengeMode = "standard" | "hybrid75";

/** Official Hybrid 75 Summer Challenge free group — override via env. */
export const HYBRID75_TELEGRAM_DEFAULT_URL = "https://t.me/+0WAGU5S9BrQxYzQ0";

/** Override via NEXT_PUBLIC_HYBRID75_TELEGRAM_URL or NEXT_PUBLIC_FREE_WEEK_TELEGRAM_URL */
export const FREE_WEEK_TELEGRAM_URL =
  process.env.NEXT_PUBLIC_HYBRID75_TELEGRAM_URL?.trim() ||
  process.env.NEXT_PUBLIC_FREE_WEEK_TELEGRAM_URL?.trim() ||
  HYBRID75_TELEGRAM_DEFAULT_URL;

/** Alias for Hybrid 75 CTAs (landing, plan dashboard, session logging). */
export const HYBRID75_TELEGRAM_URL = FREE_WEEK_TELEGRAM_URL;

export const HYBRID75_TELEGRAM_GROUP_LABEL = "Join the Telegram Group";

export const HYBRID75_TELEGRAM_SUPPORTING_COPY =
  "The weekly Hybrid Hard Challenge, proof posts, leaderboard updates and prize information will be released inside the Telegram group.";

export const FREE_WEEK_PLAN_PATH = (planId: string) => `/plan/${planId}`;

export const HYBRID75_RULES = [
  "Run 3x per week",
  "Lift 3x per week",
  "Complete the weekly Hybrid Hard Challenge",
  "Mobility 1–2x per week",
  "Hydrate 3–4L daily",
  "Eat clean",
  "Log and prove your work",
] as const;

export type Hybrid75PlanMeta = {
  rules: readonly string[];
  targets: {
    runs: number;
    /** Public challenge rule: 3 lift days (2 upper + 1 hybrid leg endurance). */
    lifts: number;
    lifts_min: number;
    lifts_max: number;
    upper_exposures: number;
    hybrid_leg_exposures: number;
    weekly_challenge: number;
    mobility_min: number;
    mobility_max: number;
  };
  scheduled_counts: {
    runs: number;
    lifts: number;
    mobility: number;
    upper_exposures: number;
    hybrid_leg_exposures: number;
    challenge: number;
  };
  habits: {
    hydration_litres: string;
    clean_eating: string;
    accountability_proof: string;
  };
  compression_note?: string;
  telegram_url: string;
  challenge_cta: {
    label: string;
    url: string;
  };
  /** Per-session stress/stimulus snapshot for dashboard display (Hybrid 75 only). */
  session_classifications?: Array<{
    day: string;
    title: string;
    stress: "easy" | "moderate" | "hard";
    primaryStimulus: string;
  }>;
  /** Coaching notes from Hybrid 75 sequencing / compression. */
  methodology_notes?: string[];
  /** Human-readable list of repairs applied to the week. */
  sequencing_repairs_applied?: string[];
  /** Day-level stress rhythm summary, e.g. Mon:S → Tue:H → Wed:E */
  hard_easy_summary?: string;
};

export function normalizeChallengeMode(value: unknown): ChallengeMode {
  if (value === "hybrid75") return "hybrid75";
  return "standard";
}

export function challengeModeFromSearchParam(value: string | null | undefined): ChallengeMode {
  if (value?.toLowerCase() === "hybrid75") return "hybrid75";
  return "standard";
}
