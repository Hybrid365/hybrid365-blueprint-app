/**
 * Analytics-ready readers over activity logs.
 * Phase 1: pure helpers only — no UI. Enables weekly hours, volume, exposures, compliance later.
 */

import type { HyroxJson } from "@/app/lib/hyroxDatabaseTypes";
import type {
  ErgSessionMetrics,
  HyroxAthleteSessionFeedbackV2,
  HyroxSessionMetrics,
  RunSessionMetrics,
  SessionActivityType,
  StrengthSessionMetrics,
} from "@/app/lib/hyrox-team/modules/sessionLogging/types";
import { SESSION_LOG_SCHEMA_VERSION } from "@/app/lib/hyrox-team/modules/sessionLogging/types";

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function parseOptionalNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const cleaned = String(value).replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** Parse "mm:ss" or "h:mm:ss" or "45" (minutes) into minutes. */
export function parseDurationToMinutes(value: unknown): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const s = String(value).trim();
  if (!s) return null;
  if (/^\d+(\.\d+)?$/.test(s)) return Number(s);
  const parts = s.split(":").map((p) => Number(p));
  if (parts.some((p) => !Number.isFinite(p))) return null;
  if (parts.length === 2) return parts[0] + parts[1] / 60;
  if (parts.length === 3) return parts[0] * 60 + parts[1] + parts[2] / 60;
  return null;
}

export function parseSessionFeedback(raw: unknown): HyroxAthleteSessionFeedbackV2 {
  const o = asRecord(raw);
  return {
    rpe: o.rpe != null ? String(o.rpe) : null,
    notes: o.notes != null ? String(o.notes) : null,
    modifications: o.modifications != null ? String(o.modifications) : null,
    score: o.score != null ? String(o.score) : null,
    loggedAt: o.loggedAt != null ? String(o.loggedAt) : null,
    schemaVersion:
      o.schemaVersion === SESSION_LOG_SCHEMA_VERSION || o.schemaVersion === 1
        ? (o.schemaVersion as 1 | 2)
        : o.activityType || o.metrics
          ? SESSION_LOG_SCHEMA_VERSION
          : 1,
    activityType: (o.activityType as SessionActivityType) ?? null,
    planned: (o.planned as HyroxAthleteSessionFeedbackV2["planned"]) ?? null,
    metrics: (o.metrics as HyroxAthleteSessionFeedbackV2["metrics"]) ?? null,
  };
}

export type SessionLogAnalyticsRow = {
  activityType: SessionActivityType | null;
  durationMinutes: number | null;
  distanceKm: number | null;
  rpe: number | null;
  isStrengthExposure: boolean;
  isHyroxExposure: boolean;
  isErgExposure: boolean;
  isRunExposure: boolean;
  hasLog: boolean;
};

/**
 * Normalize one athlete_feedback blob into analytics-friendly scalars.
 * Safe for legacy logs (rpe/notes only).
 */
export function toSessionLogAnalyticsRow(feedback: unknown): SessionLogAnalyticsRow {
  const parsed = parseSessionFeedback(feedback);
  const type = parsed.activityType ?? null;
  const metrics = asRecord(parsed.metrics);
  const legacyRpe = parseOptionalNumber(parsed.rpe);

  let durationMinutes: number | null = null;
  let distanceKm: number | null = null;
  let rpe = legacyRpe;

  if (type === "run") {
    const m = metrics as RunSessionMetrics;
    durationMinutes = parseDurationToMinutes(m.duration);
    distanceKm = parseOptionalNumber(m.distanceKm);
    rpe = parseOptionalNumber(m.rpe) ?? legacyRpe;
  } else if (type === "bike" || type === "row" || type === "ski") {
    const m = metrics as ErgSessionMetrics;
    durationMinutes = parseDurationToMinutes(m.duration);
    distanceKm = parseOptionalNumber(m.distance);
    // treat erg distance in meters if large
    if (distanceKm != null && distanceKm > 50) distanceKm = distanceKm / 1000;
    rpe = parseOptionalNumber(m.rpe) ?? legacyRpe;
  } else if (type === "hyrox") {
    const m = metrics as HyroxSessionMetrics;
    durationMinutes = parseDurationToMinutes(m.totalDuration);
    rpe = parseOptionalNumber(m.rpe) ?? legacyRpe;
  } else if (type === "strength") {
    const m = metrics as StrengthSessionMetrics;
    rpe = parseOptionalNumber(m.sessionRpe) ?? legacyRpe;
    durationMinutes = parsed.planned?.estimatedDurationMinutes ?? null;
  } else {
    durationMinutes =
      parseDurationToMinutes(metrics.duration) ??
      parsed.planned?.estimatedDurationMinutes ??
      null;
  }

  const hasLog = Boolean(
    parsed.loggedAt ||
      parsed.rpe ||
      parsed.notes ||
      parsed.score ||
      parsed.modifications ||
      parsed.metrics
  );

  return {
    activityType: type,
    durationMinutes,
    distanceKm,
    rpe,
    isStrengthExposure: type === "strength" && hasLog,
    isHyroxExposure: type === "hyrox" && hasLog,
    isErgExposure: (type === "bike" || type === "row" || type === "ski") && hasLog,
    isRunExposure: type === "run" && hasLog,
    hasLog,
  };
}

/**
 * Aggregate helpers for future Performance Hub / weekly rollups.
 * Not wired to UI in Phase 1.
 */
export function aggregateSessionLogRows(rows: SessionLogAnalyticsRow[]) {
  const logged = rows.filter((r) => r.hasLog);
  const sum = (xs: Array<number | null | undefined>) =>
    xs.reduce<number>((acc, v) => acc + (typeof v === "number" && Number.isFinite(v) ? v : 0), 0);
  const nums = (xs: Array<number | null | undefined>) =>
    xs.filter((v): v is number => typeof v === "number" && Number.isFinite(v));

  const rpes = nums(logged.map((r) => r.rpe));
  const hours = sum(logged.map((r) => r.durationMinutes)) / 60;
  const runVolumeKm = sum(logged.filter((r) => r.isRunExposure).map((r) => r.distanceKm));
  const ergVolumeKm = sum(logged.filter((r) => r.isErgExposure).map((r) => r.distanceKm));

  return {
    weeklyTrainingHours: hours,
    runningVolumeKm: runVolumeKm,
    ergVolumeKm,
    strengthExposures: logged.filter((r) => r.isStrengthExposure).length,
    hyroxExposures: logged.filter((r) => r.isHyroxExposure).length,
    ergExposures: logged.filter((r) => r.isErgExposure).length,
    runExposures: logged.filter((r) => r.isRunExposure).length,
    averageRpe: rpes.length ? rpes.reduce((a, b) => a + b, 0) / rpes.length : null,
    loggedCount: logged.length,
    scheduledCount: rows.length,
    /** Compliance = logged / scheduled when scheduled > 0 */
    complianceRate: rows.length ? logged.length / rows.length : null,
    /**
     * Threshold / easy minutes require prescription intensity tags — reserved for later.
     * Callers can refine using planned.targetPace / HR when those heuristics exist.
     */
    thresholdMinutes: null as number | null,
    easyVolumeKm: null as number | null,
  };
}

export function feedbackRowsFromProgrammeSessions(
  sessions: Array<{ athlete_feedback?: HyroxJson | null }>
): SessionLogAnalyticsRow[] {
  return sessions.map((s) => toSessionLogAnalyticsRow(s.athlete_feedback));
}
