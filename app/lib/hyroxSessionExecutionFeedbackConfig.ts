/**
 * Type-aware athlete feedback UI config.
 * Canonical schema stays in hyroxSessionExecutionTypes — this only chooses which chips to show.
 */

import { inferSessionActivityType } from "@/app/lib/hyrox-team/modules/sessionLogging/inferActivityType";
import type { SessionActivityType } from "@/app/lib/hyrox-team/modules/sessionLogging/types";

export const FEEDBACK_PROFILES = [
  "threshold_interval",
  "easy_aerobic",
  "hyrox_compromised",
  "erg_interval",
  "strength",
  "performance_test",
  "default",
] as const;

export type FeedbackProfileId = (typeof FEEDBACK_PROFILES)[number];

export type FeedbackFieldId =
  | "execution"
  | "control"
  | "rpe"
  | "pain"
  | "energy"
  | "legs"
  | "note"
  | "actualPace"
  | "actualSplitOrPower"
  | "actualLoadOrReps"
  | "primaryResult"
  | "stationLimiting";

export type FeedbackProfile = {
  id: FeedbackProfileId;
  label: string;
  /** Required on complete/partial when chips flag is on */
  required: FeedbackFieldId[];
  /** Shown but optional */
  optional: FeedbackFieldId[];
};

const PROFILES: Record<FeedbackProfileId, FeedbackProfile> = {
  threshold_interval: {
    id: "threshold_interval",
    label: "Threshold / tempo / intervals",
    required: ["execution", "control", "rpe", "pain"],
    optional: ["actualPace", "energy", "note"],
  },
  easy_aerobic: {
    id: "easy_aerobic",
    label: "Easy / aerobic",
    required: ["rpe", "pain"],
    optional: ["energy", "legs", "note"],
  },
  hyrox_compromised: {
    id: "hyrox_compromised",
    label: "HYROX / compromised",
    required: ["execution", "control", "rpe", "pain"],
    optional: ["stationLimiting", "note"],
  },
  erg_interval: {
    id: "erg_interval",
    label: "Erg intervals",
    required: ["execution", "control", "rpe", "pain"],
    optional: ["actualSplitOrPower", "note"],
  },
  strength: {
    id: "strength",
    label: "Strength",
    required: ["execution", "rpe", "pain"],
    optional: ["actualLoadOrReps", "note"],
  },
  performance_test: {
    id: "performance_test",
    label: "Performance test",
    required: ["primaryResult", "rpe", "pain"],
    optional: ["note"],
  },
  default: {
    id: "default",
    label: "Session",
    required: ["rpe", "pain"],
    optional: ["execution", "control", "energy", "note"],
  },
};

export function resolveFeedbackProfile(input: {
  activityType?: SessionActivityType | null;
  category?: string | null;
  sessionName?: string | null;
  sessionTypeLabel?: string | null;
}): FeedbackProfile {
  const activityType =
    input.activityType ??
    inferSessionActivityType({
      category: input.category,
      sessionName: input.sessionName,
      sessionTypeLabel: input.sessionTypeLabel,
    });
  const blob = [input.category, input.sessionName, input.sessionTypeLabel, activityType]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/test|assessment|benchmark|5k time|2k ski|2k row|ftp/.test(blob)) {
    return PROFILES.performance_test;
  }
  if (activityType === "hyrox" || /compromised|station overload|hyrox/.test(blob)) {
    return PROFILES.hyrox_compromised;
  }
  if (activityType === "strength") return PROFILES.strength;
  if (activityType === "ski" || activityType === "row" || activityType === "bike") {
    if (/easy|zone 2|z2|recovery|aerobic/.test(blob)) return PROFILES.easy_aerobic;
    return PROFILES.erg_interval;
  }
  if (activityType === "run") {
    if (/threshold|tempo|interval|repeat|quality|progression/.test(blob)) {
      return PROFILES.threshold_interval;
    }
    if (/easy|aerobic|recovery|long|shakeout|zone 2|z2/.test(blob)) {
      return PROFILES.easy_aerobic;
    }
    return PROFILES.threshold_interval;
  }
  if (/easy|aerobic|recovery|mobility/.test(blob)) return PROFILES.easy_aerobic;
  return PROFILES.default;
}

export function getFeedbackProfile(id: FeedbackProfileId): FeedbackProfile {
  return PROFILES[id];
}
