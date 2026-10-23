/** Presentation tokens. Do not encode a new metric or status meaning here. */

export const MOTION_MS = {
  fast: 120,
  base: 160,
  enter: 180,
} as const;

export const MOTION_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

export const ATHLETE_STATUS_WORDS = [
  "Current",
  "Pending review",
  "Approved",
  "Coach verified",
  "Historical",
] as const;

export type AthleteStatusWord = (typeof ATHLETE_STATUS_WORDS)[number];

export type AthleteStatusKey =
  | "current"
  | "pending"
  | "approved"
  | "coach_verified"
  | "historical";

export const ATHLETE_STATUS_LABEL: Record<AthleteStatusKey, AthleteStatusWord> = {
  current: "Current",
  pending: "Pending review",
  approved: "Approved",
  coach_verified: "Coach verified",
  historical: "Historical",
};

export function athleteBenchmarkStatus(row: {
  status: string;
  active_for_programming?: boolean;
  source?: string | null;
}): AthleteStatusKey {
  if (row.status === "pending") return "pending";
  if (row.status === "historical") return "historical";
  if (row.active_for_programming) return "current";
  if (row.source === "coach_entered" || row.source === "lab_test") return "coach_verified";
  return "approved";
}

export const visualCard = "rounded-2xl border border-zinc-800 bg-zinc-950/80";
export const visualCardQuiet = "rounded-xl border border-zinc-800 bg-zinc-950/60";
export const visualCardPad = "px-5 py-5 sm:px-6";
export const visualNumber =
  "text-[30px] font-bold leading-none tracking-tight text-white tabular-nums sm:text-4xl";
export const visualPerformanceNumber = visualNumber;
export const visualDerived = "mt-1.5 text-sm text-zinc-300 tabular-nums";
export const visualMeta = "text-xs text-zinc-400";
export const visualBody = "text-sm leading-relaxed text-zinc-300";
export const visualMuted = "text-xs text-zinc-400";
export const visualEyebrow =
  "text-[10px] font-bold uppercase tracking-[0.2em] text-yellow-400/90";
export const visualSectionTitle = "text-sm font-semibold text-zinc-200";
export const visualHairline = "border-zinc-800";
export const visualTouch = "min-h-11 min-w-11";
export const ENV_BADGE_HEIGHT_PX = 24;
export const envBadgeOffsetClass = "top-[var(--hybrid365-env-badge-height,0px)]";
/** Clears the fixed athlete mobile nav + home-indicator so last cards stay readable. */
export const athleteMobileNavClearanceClass =
  "pb-[calc(7.25rem+env(safe-area-inset-bottom,0px))] lg:pb-10";
