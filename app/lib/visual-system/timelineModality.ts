/**
 * Safe modality inference for timeline presentation.
 * Never invents "run" when modality is unknown.
 */

import type { TimelineModality } from "@/app/lib/visual-system/workoutTimelineViewModel";
import type { SessionFamilyModality } from "@/app/lib/hyroxSessionFamilyTypes";

const KNOWN: TimelineModality[] = [
  "run",
  "walk",
  "jog",
  "ski",
  "row",
  "bike",
  "station",
  "strength",
  "other",
];

export function isKnownTimelineModality(value: string): value is TimelineModality {
  return (KNOWN as string[]).includes(value);
}

/**
 * Map session / family modality labels → timeline modality.
 * Unknown → "other" (neutral). Never defaults to "run".
 */
export function inferTimelineModality(params: {
  sessionType?: string | null;
  sessionName?: string | null;
  focus?: string | null;
  familyModality?: SessionFamilyModality | string | null;
  category?: string | null;
}): TimelineModality {
  const family = (params.familyModality ?? "").toString().toLowerCase().trim();
  if (family === "run") return "run";
  if (family === "ski") return "ski";
  if (family === "row") return "row";
  if (family === "bike") return "bike";
  if (family === "strength") return "strength";
  if (family === "hyrox") return "station";
  if (family === "mixed") return "other";
  if (family === "recovery") return "other";

  const blob = [params.sessionType, params.category, params.focus, params.sessionName]
    .map((x) => (x ?? "").toLowerCase())
    .join(" ");

  if (/\bski\b/.test(blob)) return "ski";
  if (/\brow\b|rowing/.test(blob)) return "row";
  if (/\bbike\b|cycling|wattbike|assault\s*bike/.test(blob)) return "bike";
  if (/\bstrength\b|squat|hinge|lift/.test(blob)) return "strength";
  if (/\bstation\b|hyrox|sled|farmers|wall\s*ball|burpee/.test(blob)) return "station";
  if (/\brun\b|threshold|tempo|jog|easy\s*aerobic|aerobic/.test(blob)) return "run";
  if (/\brecovery\b|rest\b/.test(blob)) return "other";

  return "other";
}
