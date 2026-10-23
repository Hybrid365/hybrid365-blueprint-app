/**
 * Thin Command Centre adapter for canonical Workstream B analytics.
 *
 * Types against HyroxAthleteAnalytics from hyroxAthleteAnalytics.ts.
 * Does not compute rolling volume, modality distribution, session-RPE load,
 * run distance, or training duration.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getHyroxAthleteAnalytics,
  type HyroxAthleteAnalytics,
  type HyroxAnalyticsModality,
  type HyroxAnalyticsWeekSummary,
} from "@/app/lib/hyroxAthleteAnalytics";

export type CommandCentreAnalyticsStatus = "ok" | "unavailable";

const MODALITIES: readonly HyroxAnalyticsModality[] = [
  "run",
  "bike",
  "skierg",
  "rowerg",
  "strength",
  "hyrox_specific",
  "other",
];

export type GetHyroxAthleteAnalytics = (input: {
  athleteId: string;
  now?: Date;
}) => Promise<HyroxAthleteAnalytics | null>;

let analyticsGetter: GetHyroxAthleteAnalytics | null = null;

/** Tests may register a fake engine. Production passes a Supabase client instead. */
export function registerHyroxAthleteAnalyticsGetter(fn: GetHyroxAthleteAnalytics | null): void {
  analyticsGetter = fn;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function nullOrNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asModality(raw: unknown): HyroxAnalyticsModality | null {
  if (raw === "hyrox") return "hyrox_specific";
  if (raw === "ski") return "skierg";
  if (raw === "row") return "rowerg";
  if (typeof raw === "string" && (MODALITIES as readonly string[]).includes(raw)) {
    return raw as HyroxAnalyticsModality;
  }
  return null;
}

function asWeek(raw: unknown): HyroxAnalyticsWeekSummary | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.startDate !== "string" || typeof raw.endDate !== "string") return null;
  if (typeof raw.plannedSessions !== "number" || typeof raw.completedSessions !== "number") return null;
  if (typeof raw.keySessionsCompleted !== "number") return null;
  if (typeof raw.keySessionsPlanned !== "number") return null;
  let complete: boolean | null = null;
  if (typeof raw.complete === "boolean") complete = raw.complete;
  else if (typeof raw.completeWeek === "boolean") complete = raw.completeWeek;
  else if (typeof raw.incomplete === "boolean") complete = !raw.incomplete;
  if (complete == null) return null;
  return {
    startDate: raw.startDate,
    endDate: raw.endDate,
    complete,
    plannedSessions: raw.plannedSessions,
    completedSessions: raw.completedSessions,
    completionPct: nullOrNumber(raw.completionPct),
    runDistanceKm: nullOrNumber(raw.runDistanceKm),
    trainingDurationMinutes: nullOrNumber(raw.trainingDurationMinutes),
    averageRpe: nullOrNumber(raw.averageRpe),
    sessionRpeLoad: nullOrNumber(raw.sessionRpeLoad),
    keySessionsCompleted: raw.keySessionsCompleted,
    keySessionsPlanned: raw.keySessionsPlanned,
  };
}

/**
 * Map a Workstream B payload onto the canonical type.
 * Accepts `asOf` (canonical) or `generatedAt`.
 * Missing numeric fields stay null. Invalid payloads return null.
 */
export function adaptHyroxAthleteAnalytics(raw: unknown): HyroxAthleteAnalytics | null {
  if (!isRecord(raw) || typeof raw.athleteId !== "string") return null;
  const currentWeek = asWeek(raw.currentWeek) ?? asWeek(raw.week) ?? asWeek(raw.thisWeek);
  if (!currentWeek) return null;
  const asOf =
    typeof raw.asOf === "string"
      ? raw.asOf
      : typeof raw.generatedAt === "string"
        ? raw.generatedAt
        : null;
  if (!asOf) return null;

  const rollingRaw = isRecord(raw.rolling4) ? raw.rolling4 : {};
  const distribution: HyroxAthleteAnalytics["distribution"] = [];
  if (Array.isArray(raw.distribution)) {
    for (const slice of raw.distribution) {
      if (!isRecord(slice)) continue;
      const modality = asModality(slice.modality);
      if (!modality || typeof slice.sessionCount !== "number") continue;
      distribution.push({
        modality,
        sessionCount: slice.sessionCount,
        durationMinutes: nullOrNumber(slice.durationMinutes),
      });
    }
  }

  const benchmarks: HyroxAthleteAnalytics["benchmarks"] = [];
  if (Array.isArray(raw.benchmarks)) {
    for (const series of raw.benchmarks) {
      if (!isRecord(series) || typeof series.type !== "string" || typeof series.label !== "string") continue;
      if (!Array.isArray(series.points)) continue;
      const points = series.points.flatMap((point) => {
        if (!isRecord(point)) return [];
        if (typeof point.date !== "string" || typeof point.display !== "string") return [];
        if (typeof point.normalizedValue !== "number") return [];
        const source = typeof point.source === "string" ? point.source : "unknown";
        const status = typeof point.status === "string" ? point.status : "approved";
        return [
          {
            date: point.date,
            display: point.display,
            normalizedValue: point.normalizedValue,
            source,
            status,
          },
        ];
      });
      benchmarks.push({ type: series.type, label: series.label, points });
    }
  }

  return {
    athleteId: raw.athleteId,
    asOf,
    currentWeek,
    previousWeek: asWeek(raw.previousWeek),
    rolling4: {
      runDistanceKm: nullOrNumber(rollingRaw.runDistanceKm),
      trainingDurationMinutes: nullOrNumber(rollingRaw.trainingDurationMinutes),
      completionPct: nullOrNumber(rollingRaw.completionPct),
      averageRpe: nullOrNumber(rollingRaw.averageRpe),
    },
    distribution,
    benchmarks,
    unsupported: Array.isArray(raw.unsupported)
      ? raw.unsupported.filter((item): item is string => typeof item === "string")
      : [],
  };
}

export async function loadHyroxAthleteAnalyticsFromEngine(input: {
  athleteId: string;
  now?: Date;
  client?: SupabaseClient;
}): Promise<{ status: CommandCentreAnalyticsStatus; analytics: HyroxAthleteAnalytics | null }> {
  try {
    let payload: unknown = null;
    if (input.client) {
      payload = await getHyroxAthleteAnalytics(input.client, input.athleteId, { now: input.now });
    } else if (analyticsGetter) {
      payload = await analyticsGetter({ athleteId: input.athleteId, now: input.now });
    } else {
      return { status: "unavailable", analytics: null };
    }
    const mapped = adaptHyroxAthleteAnalytics(payload);
    if (!mapped) return { status: "unavailable", analytics: null };
    return { status: "ok", analytics: mapped };
  } catch {
    return { status: "unavailable", analytics: null };
  }
}
