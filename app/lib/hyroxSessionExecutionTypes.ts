/**
 * Canonical session execution / feedback chips for the coaching loop.
 * Stored additively under athlete_feedback.execution — does not replace legacy fields.
 */

export const SESSION_COMPLETIONS = ["complete", "partial", "missed"] as const;
export type SessionCompletion = (typeof SESSION_COMPLETIONS)[number];

export const SESSION_EXECUTION_TARGETS = ["all", "most", "some", "missed_target"] as const;
export type SessionExecutionTarget = (typeof SESSION_EXECUTION_TARGETS)[number];

export const SESSION_CONTROLS = [
  "very_controlled",
  "controlled",
  "appropriate",
  "hard",
  "maximal",
] as const;
export type SessionControl = (typeof SESSION_CONTROLS)[number];

export const SESSION_PAIN_LEVELS = ["none", "minor", "meaningful"] as const;
export type SessionPainLevel = (typeof SESSION_PAIN_LEVELS)[number];

export const SESSION_ENERGY_LEVELS = ["good", "ok", "low"] as const;
export type SessionEnergyLevel = (typeof SESSION_ENERGY_LEVELS)[number];

export const SESSION_LEGS_LEVELS = ["good", "heavy", "sore"] as const;
export type SessionLegsLevel = (typeof SESSION_LEGS_LEVELS)[number];

export const SESSION_MISSED_REASONS = [
  "illness",
  "life",
  "fatigue",
  "pain_injury",
  "schedule",
  "other",
] as const;
export type SessionMissedReason = (typeof SESSION_MISSED_REASONS)[number];

/** Athlete-submitted structured chips (jsonb). */
export type SessionExecutionChips = {
  completion: SessionCompletion;
  execution?: SessionExecutionTarget | null;
  rpe?: number | null;
  control?: SessionControl | null;
  pain?: SessionPainLevel | null;
  energy?: SessionEnergyLevel | null;
  legs?: SessionLegsLevel | null;
  athleteNote?: string | null;
  missedReason?: SessionMissedReason | null;
  actuals?: Record<string, string | number | null> | null;
};

/** Downstream-canonical summary. */
export type SessionExecutionSummary = {
  completion: SessionCompletion;
  execution: SessionExecutionTarget | null;
  rpe: number | null;
  control: SessionControl | null;
  pain: SessionPainLevel | null;
  energy: SessionEnergyLevel | null;
  legs: SessionLegsLevel | null;
  athleteNote: string | null;
  missedReason: SessionMissedReason | null;
  actuals: Record<string, string | number | null> | null;
  /** structured = chips present; legacy_inferred = derived from status + rpe only */
  source: "structured" | "legacy_inferred";
};

export function isSessionCompletion(v: unknown): v is SessionCompletion {
  return typeof v === "string" && (SESSION_COMPLETIONS as readonly string[]).includes(v);
}

export function isSessionExecutionTarget(v: unknown): v is SessionExecutionTarget {
  return typeof v === "string" && (SESSION_EXECUTION_TARGETS as readonly string[]).includes(v);
}

export function isSessionControl(v: unknown): v is SessionControl {
  return typeof v === "string" && (SESSION_CONTROLS as readonly string[]).includes(v);
}

export function isSessionPainLevel(v: unknown): v is SessionPainLevel {
  return typeof v === "string" && (SESSION_PAIN_LEVELS as readonly string[]).includes(v);
}

export function isSessionEnergyLevel(v: unknown): v is SessionEnergyLevel {
  return typeof v === "string" && (SESSION_ENERGY_LEVELS as readonly string[]).includes(v);
}

export function isSessionLegsLevel(v: unknown): v is SessionLegsLevel {
  return typeof v === "string" && (SESSION_LEGS_LEVELS as readonly string[]).includes(v);
}

export function isSessionMissedReason(v: unknown): v is SessionMissedReason {
  return typeof v === "string" && (SESSION_MISSED_REASONS as readonly string[]).includes(v);
}

export function parseRpeInteger(raw: unknown): number | null {
  if (raw == null || raw === "") return null;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    const n = Math.round(raw);
    return n >= 1 && n <= 10 ? n : null;
  }
  const s = String(raw).trim();
  const range = s.match(/^(\d+)\s*[-–]\s*(\d+)$/);
  if (range) {
    const hi = Number(range[2]);
    return hi >= 1 && hi <= 10 ? hi : null;
  }
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  const rounded = Math.round(n);
  return rounded >= 1 && rounded <= 10 ? rounded : null;
}
