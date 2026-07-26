/**
 * Infer logging activity family from published session category / name / prescription.
 */

import type { SessionActivityType } from "@/app/lib/hyrox-team/modules/sessionLogging/types";

export function inferSessionActivityType(params: {
  category?: string | null;
  sessionName?: string | null;
  prescriptionCategory?: string | null;
  sessionTypeLabel?: string | null;
}): SessionActivityType {
  const blob = [
    params.category,
    params.sessionName,
    params.prescriptionCategory,
    params.sessionTypeLabel,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    /compromised|hyrox|station|sled|wall.?ball|farmer|lunge|burpee|benchmark/.test(blob) &&
    !/strength assessment|controlled strength/.test(blob)
  ) {
    if (/ski.?erg|ski 2|2km ski|2 km ski/.test(blob)) return "ski";
    if (/row.?erg|row 2|2km row|2 km row/.test(blob)) return "row";
    if (/strength|squat|deadlift/.test(blob) && !/hyrox|compromised|station/.test(blob)) {
      return "strength";
    }
    if (/ski/.test(blob) && /erg|test/.test(blob)) return "ski";
    if (/row/.test(blob) && /erg|test/.test(blob)) return "row";
    return "hyrox";
  }

  if (/strength|squat|deadlift|lunge assessment|press|pull.?up/.test(blob)) return "strength";
  if (/ski.?erg|\bski\b/.test(blob) && !/run/.test(blob)) return "ski";
  if (/row.?erg|\brow\b/.test(blob) && !/run/.test(blob)) return "row";
  if (/\bbike\b|cycling|wattbike|assault|echo/.test(blob)) return "bike";
  if (/run|threshold|tempo|5.?km|5km|stride|easy run|quality run/.test(blob)) return "run";
  if (/recovery|mobility|rest|aerobic/.test(blob)) return "other";

  return "other";
}

export function activityTypeLabel(type: SessionActivityType): string {
  switch (type) {
    case "run":
      return "Running";
    case "strength":
      return "Strength";
    case "bike":
      return "Bike";
    case "row":
      return "RowErg";
    case "ski":
      return "SkiErg";
    case "hyrox":
      return "HYROX";
    default:
      return "General";
  }
}
