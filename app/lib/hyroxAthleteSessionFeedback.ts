/**
 * HYROX Team athlete session feedback — dual-read legacy + activity-specific v2.
 * Stored on hyrox_programme_sessions.athlete_feedback (jsonb). Additive only.
 */

import type { HyroxJson } from "@/app/lib/hyroxDatabaseTypes";
import type {
  HyroxAthleteSessionFeedbackV2,
  SessionActivityMetrics,
  SessionActivityType,
  SessionPlannedTargets,
} from "@/app/lib/hyrox-team/modules/sessionLogging/types";
import { SESSION_LOG_SCHEMA_VERSION } from "@/app/lib/hyrox-team/modules/sessionLogging/types";

/** @deprecated Prefer HyroxAthleteSessionFeedbackV2 — alias kept for existing imports. */
export type HyroxAthleteSessionFeedback = HyroxAthleteSessionFeedbackV2;

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function strOrNull(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;
  return String(value);
}

export function parseHyroxAthleteSessionFeedback(
  raw: HyroxJson | null | undefined
): HyroxAthleteSessionFeedbackV2 {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const o = raw as Record<string, unknown>;
  const hasV2 = o.activityType != null || o.metrics != null || o.planned != null || o.schemaVersion === 2;

  return {
    rpe: o.rpe != null ? String(o.rpe) : null,
    notes: typeof o.notes === "string" ? o.notes : o.notes != null ? String(o.notes) : null,
    modifications: typeof o.modifications === "string" ? o.modifications : null,
    score: typeof o.score === "string" ? o.score : o.score != null ? String(o.score) : null,
    loggedAt: typeof o.loggedAt === "string" ? o.loggedAt : null,
    schemaVersion: hasV2
      ? SESSION_LOG_SCHEMA_VERSION
      : o.schemaVersion === 1
        ? 1
        : undefined,
    activityType: (o.activityType as SessionActivityType) ?? null,
    planned: (o.planned as SessionPlannedTargets) ?? null,
    metrics: (o.metrics as SessionActivityMetrics) ?? null,
  };
}

/**
 * Derive legacy top-level fields from activity metrics so older UI keeps working.
 */
export function deriveLegacyFieldsFromMetrics(
  activityType: SessionActivityType | null | undefined,
  metrics: SessionActivityMetrics | null | undefined
): Pick<HyroxAthleteSessionFeedbackV2, "rpe" | "notes" | "score"> {
  if (!metrics || !activityType) return {};
  const m = metrics as Record<string, unknown>;

  if (activityType === "run") {
    return {
      rpe: strOrNull(m.rpe),
      notes: strOrNull(m.notes),
      score: [m.duration, m.distanceKm, m.averagePace].filter(Boolean).join(" · ") || null,
    };
  }
  if (activityType === "strength") {
    return {
      rpe: strOrNull(m.sessionRpe),
      notes: strOrNull(m.notes),
      score: null,
    };
  }
  if (activityType === "bike" || activityType === "row" || activityType === "ski") {
    return {
      rpe: strOrNull(m.rpe),
      notes: strOrNull(m.notes),
      score: [m.duration, m.distance, m.watts, m.paceOrSplit].filter(Boolean).join(" · ") || null,
    };
  }
  if (activityType === "hyrox") {
    return {
      rpe: strOrNull(m.rpe),
      notes: strOrNull(m.notes),
      score: strOrNull(m.totalDuration),
    };
  }
  return {
    rpe: strOrNull(m.rpe),
    notes: strOrNull(m.notes),
    score: strOrNull(m.duration),
  };
}

/**
 * Merge patch into existing feedback without dropping unknown jsonb keys.
 * Always preserves legacy rpe/notes/modifications/score.
 */
export function buildHyroxAthleteSessionFeedback(
  current: HyroxJson | null | undefined,
  patch: HyroxAthleteSessionFeedbackV2
): HyroxJson {
  const raw = asRecord(current);
  const base = parseHyroxAthleteSessionFeedback(current);

  const activityType = patch.activityType !== undefined ? patch.activityType : base.activityType;
  const metrics = patch.metrics !== undefined ? patch.metrics : base.metrics;
  const planned = patch.planned !== undefined ? patch.planned : base.planned;

  const derived =
    patch.rpe === undefined && patch.notes === undefined && patch.score === undefined
      ? deriveLegacyFieldsFromMetrics(activityType, metrics)
      : {};

  const next: Record<string, unknown> = {
    ...raw,
    rpe: patch.rpe !== undefined ? patch.rpe : derived.rpe !== undefined ? derived.rpe : base.rpe,
    notes:
      patch.notes !== undefined ? patch.notes : derived.notes !== undefined ? derived.notes : base.notes,
    modifications: patch.modifications !== undefined ? patch.modifications : base.modifications,
    score:
      patch.score !== undefined ? patch.score : derived.score !== undefined ? derived.score : base.score,
    loggedAt: patch.loggedAt ?? new Date().toISOString(),
  };

  if (activityType != null || metrics != null || planned != null || patch.schemaVersion === 2) {
    next.schemaVersion = SESSION_LOG_SCHEMA_VERSION;
  }
  if (activityType !== undefined) next.activityType = activityType;
  if (metrics !== undefined) next.metrics = metrics;
  if (planned !== undefined) next.planned = planned;

  return next as HyroxJson;
}
