/**
 * Thin Command Centre adapter for Workstream B.
 *
 * Types against the frozen HyroxAthleteAnalytics shape. Does not compute
 * rolling volume, modality distribution, session-RPE load, run distance, or
 * training duration. When getHyroxAthleteAnalytics is not registered on this
 * branch, returns unavailable / null. Never invents athlete numbers.
 */

import type {
  GetHyroxAthleteAnalytics,
  HyroxAnalyticsModality,
  HyroxAthleteAnalytics,
  HyroxWeekSummary,
} from "@/app/lib/hyroxCommandCentreAnalyticsTypes";

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

let analyticsGetter: GetHyroxAthleteAnalytics | null = null;

/** Tests, or a later merge of B, register the real engine. Production C leaves this unset. */
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

function asWeek(raw: unknown): HyroxWeekSummary | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.startDate !== "string" || typeof raw.endDate !== "string") return null;
  if (typeof raw.plannedSessions !== "number" || typeof raw.completedSessions !== "number") return null;
  if (typeof raw.keySessionsCompleted !== "number") return null;
  if (typeof raw.keySessionsPlanned !== "number") return null;
  let completeWeek: boolean | null = null;
  if (typeof raw.completeWeek === "boolean") completeWeek = raw.completeWeek;
  else if (typeof raw.incomplete === "boolean") completeWeek = !raw.incomplete;
  if (completeWeek == null) return null;
  return {
    startDate: raw.startDate,
    endDate: raw.endDate,
    completeWeek,
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
 * Map a Workstream B payload onto the frozen consumer type.
 * Accepts `currentWeek` (frozen) or `week` / `thisWeek` aliases.
 * Missing numeric fields stay null. Invalid payloads return null.
 */
export function adaptHyroxAthleteAnalytics(raw: unknown): HyroxAthleteAnalytics | null {
  if (!isRecord(raw) || typeof raw.athleteId !== "string") return null;
  const currentWeek = asWeek(raw.currentWeek) ?? asWeek(raw.week) ?? asWeek(raw.thisWeek);
  if (!currentWeek) return null;
  if (typeof raw.generatedAt !== "string") return null;

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
        const normalizedUnit =
          typeof point.normalizedUnit === "string"
            ? point.normalizedUnit
            : typeof point.unit === "string"
              ? point.unit
              : null;
        const source = typeof point.source === "string" ? point.source : null;
        const status = typeof point.status === "string" ? point.status : null;
        if (!normalizedUnit || !source || !status) return [];
        return [
          {
            date: point.date,
            display: point.display,
            normalizedValue: point.normalizedValue,
            normalizedUnit,
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
    generatedAt: raw.generatedAt,
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
}): Promise<{ status: CommandCentreAnalyticsStatus; analytics: HyroxAthleteAnalytics | null }> {
  if (!analyticsGetter) return { status: "unavailable", analytics: null };
  try {
    const payload = await analyticsGetter(input);
    const mapped = adaptHyroxAthleteAnalytics(payload);
    if (!mapped) return { status: "unavailable", analytics: null };
    return { status: "ok", analytics: mapped };
  } catch {
    return { status: "unavailable", analytics: null };
  }
}
