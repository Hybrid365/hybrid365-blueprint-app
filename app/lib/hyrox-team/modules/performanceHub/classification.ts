/**
 * Session classification for Performance Hub distribution + intensity minutes.
 *
 * DOCUMENTATION
 * -------------
 * Sources (read-only; never mutates stored sessions):
 *   1. activityType from athlete_feedback V2 (when logged)
 *   2. Infer from category / session name / prescription category
 *   3. Intensity band from prescription extension (intensityBand) when present
 *   4. Heuristics on session name: threshold|tempo|quality|easy|recovery|mobility|hyrox|strength
 *
 * Confidence:
 *   high   — V2 activityType present OR clear intensityBand
 *   medium — strong name/category match
 *   low    — weak heuristics → Unclassified / Other
 *
 * Legacy sessions without structured metadata are classified as "other" or
 * "unclassified" and never rewritten in the database.
 */

import { inferSessionActivityType } from "@/app/lib/hyrox-team/modules/sessionLogging/inferActivityType";
import type { SessionActivityType } from "@/app/lib/hyrox-team/modules/sessionLogging/types";
import { readPrescriptionExtensions } from "@/app/lib/hyrox-team/modules/sessionPrescription/extensions";
import type { HyroxJson } from "@/app/lib/hyroxDatabaseTypes";

export type TrainingDistributionBucket =
  | "easy_aerobic"
  | "threshold_quality"
  | "strength"
  | "hyrox_station"
  | "recovery_mobility"
  | "other"
  | "unclassified";

export type ClassificationConfidence = "high" | "medium" | "low";

export type SessionClassification = {
  bucket: TrainingDistributionBucket;
  activityType: SessionActivityType;
  confidence: ClassificationConfidence;
  isThresholdQuality: boolean;
  isEasyAerobic: boolean;
};

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

export function classifySessionForHub(params: {
  category?: string | null;
  sessionName?: string | null;
  prescription?: HyroxJson | null;
  loggedActivityType?: SessionActivityType | null;
}): SessionClassification {
  const blob = [params.category, params.sessionName].filter(Boolean).join(" ").toLowerCase();
  const ext = readPrescriptionExtensions(params.prescription);
  const activityType =
    params.loggedActivityType ??
    inferSessionActivityType({
      category: params.category,
      sessionName: params.sessionName,
      prescriptionCategory: String(asRecord(params.prescription).category ?? ""),
    });

  const band = ext.intensityBand;
  let isThresholdQuality = band === "threshold" || band === "quality" || band === "race";
  let isEasyAerobic = band === "easy" || band === "recovery";

  if (!band) {
    if (/threshold|tempo|quality|intervals?|vo2|race.?pace/.test(blob)) isThresholdQuality = true;
    if (/easy|recovery run|aerobic base|zone.?2|\bz2\b/.test(blob)) isEasyAerobic = true;
  }

  if (/recovery|mobility|rest day|flush/.test(blob) || activityType === "other" && /mobility|recovery/.test(blob)) {
    return {
      bucket: "recovery_mobility",
      activityType,
      confidence: band === "recovery" ? "high" : "medium",
      isThresholdQuality: false,
      isEasyAerobic: false,
    };
  }

  if (activityType === "hyrox" || /compromised|station|sled|wall.?ball|farmer|lunge|burpee/.test(blob)) {
    return {
      bucket: "hyrox_station",
      activityType: activityType === "run" ? "hyrox" : activityType,
      confidence: params.loggedActivityType === "hyrox" || band === "race" ? "high" : "medium",
      isThresholdQuality,
      isEasyAerobic: false,
    };
  }

  if (activityType === "strength" || band === "strength") {
    return {
      bucket: "strength",
      activityType: "strength",
      confidence: params.loggedActivityType === "strength" || band === "strength" ? "high" : "medium",
      isThresholdQuality: false,
      isEasyAerobic: false,
    };
  }

  if (isThresholdQuality && (activityType === "run" || activityType === "bike" || activityType === "row" || activityType === "ski")) {
    return {
      bucket: "threshold_quality",
      activityType,
      confidence: band ? "high" : "medium",
      isThresholdQuality: true,
      isEasyAerobic: false,
    };
  }

  if (isEasyAerobic || (activityType === "run" && /easy|aerobic/.test(blob))) {
    return {
      bucket: "easy_aerobic",
      activityType,
      confidence: band === "easy" ? "high" : "medium",
      isThresholdQuality: false,
      isEasyAerobic: true,
    };
  }

  if (activityType === "run" || activityType === "bike" || activityType === "row" || activityType === "ski") {
    return {
      bucket: "easy_aerobic",
      activityType,
      confidence: "low",
      isThresholdQuality: false,
      isEasyAerobic: true,
    };
  }

  if (activityType === "other") {
    return {
      bucket: "unclassified",
      activityType,
      confidence: "low",
      isThresholdQuality: false,
      isEasyAerobic: false,
    };
  }

  return {
    bucket: "other",
    activityType,
    confidence: "low",
    isThresholdQuality: false,
    isEasyAerobic: false,
  };
}

export const DISTRIBUTION_LABELS: Record<TrainingDistributionBucket, string> = {
  easy_aerobic: "Easy aerobic",
  threshold_quality: "Threshold / quality",
  strength: "Strength",
  hyrox_station: "HYROX / station work",
  recovery_mobility: "Recovery / mobility",
  other: "Other",
  unclassified: "Unclassified",
};
