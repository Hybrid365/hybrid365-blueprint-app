/**
 * Extract planned targets from published prescription / athlete detail for planned-vs-completed.
 */

import type { AthleteSessionDetailContent } from "@/app/lib/hyroxAthleteSessionDetail";
import type { HyroxJson } from "@/app/lib/hyroxDatabaseTypes";
import { inferSessionActivityType } from "@/app/lib/hyrox-team/modules/sessionLogging/inferActivityType";
import type {
  SessionActivityType,
  SessionPlannedTargets,
} from "@/app/lib/hyrox-team/modules/sessionLogging/types";

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function str(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  return s || null;
}

function parseEstimatedMinutes(duration: string | null | undefined, explicit?: unknown): number | null {
  if (typeof explicit === "number" && Number.isFinite(explicit) && explicit > 0) {
    return Math.round(explicit);
  }
  if (!duration) return null;
  const n = parseInt(duration, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function extractPlannedTargets(params: {
  prescription?: HyroxJson | null;
  detail?: AthleteSessionDetailContent | null;
  category?: string | null;
  sessionName?: string | null;
  activityType?: SessionActivityType | null;
}): SessionPlannedTargets {
  const prescription = asRecord(params.prescription);
  const edit = asRecord(prescription.editConfig);
  const detail = params.detail;

  const activityType =
    params.activityType ??
    inferSessionActivityType({
      category: params.category,
      sessionName: params.sessionName,
      prescriptionCategory: str(prescription.category),
    });

  const purpose =
    str(prescription.purpose) ||
    str(edit.objective) ||
    str(prescription.objective) ||
    detail?.objective ||
    null;

  const targetPace =
    str(edit.targetPaceLoad) ||
    str(edit.targetPace) ||
    str(prescription.targetPace) ||
    (detail?.targetPaceLoad && detail.targetPaceLoad !== "—" ? detail.targetPaceLoad : null);

  const targetHR =
    str(edit.hrGuide) ||
    str(edit.hrZone) ||
    str(prescription.targetHRRange) ||
    str(prescription.fallbackHRGuide) ||
    detail?.hrZone ||
    null;

  const targetRPE =
    str(edit.rpeTarget) ||
    str(prescription.rpeTarget) ||
    detail?.rpe ||
    null;

  const estimatedDurationMinutes = parseEstimatedMinutes(
    detail?.duration ?? str(prescription.duration),
    prescription.estimatedDurationMinutes ?? edit.durationMinutes
  );

  return {
    purpose,
    estimatedDurationMinutes,
    targetPace,
    targetSplit: str(edit.targetSplit) || str(prescription.targetSplit),
    targetLoad: str(edit.targetLoad) || str(prescription.targetLoad),
    targetHR,
    targetRPE,
    activityType,
  };
}
