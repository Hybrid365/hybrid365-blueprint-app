/**
 * Additive prescription helpers for HYROX Team.
 * Extends existing ResolvedSessionPrescription / editConfig — does not replace them.
 */

import type { HyroxJson } from "@/app/lib/hyroxDatabaseTypes";
import type { SessionPlannedTargets } from "@/app/lib/hyrox-team/modules/sessionLogging/types";
import { extractPlannedTargets } from "@/app/lib/hyrox-team/modules/sessionLogging/plannedTargets";

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function str(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  return s || null;
}

/**
 * Optional additive keys that may appear on prescription jsonb over time.
 * Existing readers ignore unknown keys; writers should only set when present.
 */
export type PrescriptionExtensionHints = {
  /** Explicit activity family for logging UI (optional override of inference). */
  loggingActivityType?: string | null;
  /** Free-text intensity band for future threshold/easy volume analytics. */
  intensityBand?: "easy" | "threshold" | "quality" | "race" | "strength" | "recovery" | null;
  /** Structured planned targets mirror (optional; derived from editConfig if absent). */
  plannedTargets?: SessionPlannedTargets | null;
};

export function readPrescriptionExtensions(prescription: HyroxJson | null | undefined): PrescriptionExtensionHints {
  const p = asRecord(prescription);
  const edit = asRecord(p.editConfig);
  const intensity =
    str(p.intensityBand) ||
    str(edit.intensityBand) ||
    null;

  return {
    loggingActivityType: str(p.loggingActivityType) || str(edit.loggingActivityType),
    intensityBand: intensity as PrescriptionExtensionHints["intensityBand"],
    plannedTargets: (p.plannedTargets as SessionPlannedTargets) || null,
  };
}

/**
 * Display pair for planned vs completed — used by logging UI and future comparisons.
 */
export type PlannedCompletedPair = {
  key: string;
  label: string;
  planned: string | null;
  completed: string | null;
};

export function buildPlannedCompletedPairs(params: {
  planned: SessionPlannedTargets | null | undefined;
  completed: Record<string, string | null | undefined>;
}): PlannedCompletedPair[] {
  const planned = params.planned ?? {};
  const c = params.completed;
  const pairs: PlannedCompletedPair[] = [
    { key: "pace", label: "Pace / load", planned: planned.targetPace ?? null, completed: c.pace ?? c.averagePace ?? c.paceOrSplit ?? null },
    { key: "hr", label: "Heart rate", planned: planned.targetHR ?? null, completed: c.hr ?? c.averageHr ?? null },
    { key: "rpe", label: "RPE", planned: planned.targetRPE ?? null, completed: c.rpe ?? c.sessionRpe ?? null },
    {
      key: "duration",
      label: "Duration",
      planned: planned.estimatedDurationMinutes != null ? `${planned.estimatedDurationMinutes} min` : null,
      completed: c.duration ?? c.totalDuration ?? null,
    },
  ];
  return pairs.filter((p) => p.planned || p.completed);
}

export function plannedTargetsFromPrescription(
  prescription: HyroxJson | null | undefined,
  meta?: { category?: string | null; sessionName?: string | null }
): SessionPlannedTargets {
  const ext = readPrescriptionExtensions(prescription);
  if (ext.plannedTargets) return ext.plannedTargets;
  return extractPlannedTargets({
    prescription: prescription ?? null,
    category: meta?.category,
    sessionName: meta?.sessionName,
  });
}
