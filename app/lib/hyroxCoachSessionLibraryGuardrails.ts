/**
 * Guardrails for high-fatigue HYROX coach library sessions.
 * Used for admin warnings and smart-suggestion filtering — does not block manual admin selection.
 */

import type { CoachAthlete } from "@/app/lib/hyroxCoachMockAthletes";
import type {
  CoachLibraryEntry,
  CoachSessionHyroxMetadata,
  CoachSessionLevel,
} from "./hyroxCoachSessionLibraryTypes";

export type CoachLibraryGuardrailContext = {
  abilityLevel?: CoachSessionLevel;
  recoveryStatus?: "good" | "average" | "poor" | "moderate";
  lowerBodySoreness?: "none" | "mild" | "high";
  raceTimeline?: string;
  isDeloadWeek?: boolean;
  /** Injury / limitation flags from assessment or coach notes */
  injuryFlags?: string[];
  /** When true, show all sessions (admin library panel). Guardrails become warnings only. */
  adminManualSelection?: boolean;
};

export type SessionGuardrailWarning = {
  id: string;
  severity: "info" | "warn" | "block_suggestion";
  message: string;
};

const BEGINNER_LEVELS = new Set(["beginner", "intermediate"]);
const LOWER_LEG_FLAGS = [
  "calf",
  "achilles",
  "knee",
  "knee_pain",
  "calf_or_achilles",
  "achilles_or_calf",
];

function meta(entry: CoachLibraryEntry): CoachSessionHyroxMetadata | undefined {
  return entry.hyroxMetadata;
}

function hasLowerLegIssue(flags: string[] | undefined): boolean {
  if (!flags?.length) return false;
  const blob = flags.join(" ").toLowerCase();
  return LOWER_LEG_FLAGS.some((f) => blob.includes(f));
}

function isPoorRecovery(ctx: CoachLibraryGuardrailContext): boolean {
  return ctx.recoveryStatus === "poor" || ctx.lowerBodySoreness === "high";
}

function isRaceWeek(ctx: CoachLibraryGuardrailContext): boolean {
  return ctx.raceTimeline === "race_week";
}

/** Whether a session should be hidden from automated/smart suggestions (not admin manual pick). */
export function shouldHideFromSmartSuggestions(
  entry: CoachLibraryEntry,
  ctx: CoachLibraryGuardrailContext
): boolean {
  if (ctx.adminManualSelection) return false;

  const m = meta(entry);
  const level = ctx.abilityLevel ?? entry.level;

  if (m?.requiresAdvancedOrPro && BEGINNER_LEVELS.has(level)) {
    return true;
  }

  if (entry.sessionStress === "very_high" && BEGINNER_LEVELS.has(level)) {
    return true;
  }

  if (m?.fatigueCost === "very_high" && level !== "advanced" && level !== "pro") {
    return true;
  }

  if (m?.includesHillSprints && hasLowerLegIssue(ctx.injuryFlags)) {
    return true;
  }

  if (isPoorRecovery(ctx) && (m?.fatigueCost === "very_high" || m?.fatigueCost === "high")) {
    if (entry.avoidIf.some((a) => a.includes("poor_recovery"))) return true;
  }

  if (isRaceWeek(ctx) && m?.blocksRaceWeekFullVolume) {
    return true;
  }

  if (ctx.isDeloadWeek && m?.blocksDeloadWeekFullVolume) {
    return true;
  }

  return false;
}

export function getSessionGuardrailWarnings(
  entry: CoachLibraryEntry,
  ctx: CoachLibraryGuardrailContext
): SessionGuardrailWarning[] {
  const warnings: SessionGuardrailWarning[] = [];
  const m = meta(entry);
  const level = ctx.abilityLevel ?? entry.level;

  if (!m) return warnings;

  if (m.requiresAdvancedOrPro && BEGINNER_LEVELS.has(level)) {
    warnings.push({
      id: "level_too_low",
      severity: ctx.adminManualSelection ? "warn" : "block_suggestion",
      message: `Designed for ${m.suitableLevels.join(", ")} — scale heavily or avoid for ${level} athletes.`,
    });
  }

  if (m.fatigueCost === "very_high") {
    warnings.push({
      id: "very_high_fatigue",
      severity: "warn",
      message: "Very high fatigue cost — place only in late race-specific phase with full recovery.",
    });
  }

  if (m.includesHillSprints && hasLowerLegIssue(ctx.injuryFlags)) {
    warnings.push({
      id: "hill_sprint_lower_leg",
      severity: "block_suggestion",
      message: "Includes hill sprints — avoid with calf/Achilles/knee issues flagged.",
    });
  }

  if (isPoorRecovery(ctx)) {
    warnings.push({
      id: "poor_recovery",
      severity: "warn",
      message: "Poor recovery or high lower-body soreness — reduce volume or reschedule.",
    });
  }

  if (isRaceWeek(ctx) && m.blocksRaceWeekFullVolume) {
    warnings.push({
      id: "race_week_volume",
      severity: "warn",
      message: "Full volume not suitable for race week — use scaled version only.",
    });
  }

  if (ctx.isDeloadWeek && m.blocksDeloadWeekFullVolume) {
    warnings.push({
      id: "deload_week_volume",
      severity: "warn",
      message: "Full volume not suitable for deload week — scale down or skip.",
    });
  }

  if (m.highWallBallVolume) {
    warnings.push({
      id: "high_wall_ball_volume",
      severity: "info",
      message: "High wall ball volume — avoid adjacent to other WB-heavy sessions.",
    });
  }

  if (m.highLowerBodyMuscularLoad) {
    warnings.push({
      id: "high_lower_body_load",
      severity: "info",
      message: "High lower-body muscular load — space from heavy legs, sled/lunge overload and hard threshold runs.",
    });
  }

  return warnings;
}

export function guardrailContextFromAthlete(athlete: CoachAthlete): CoachLibraryGuardrailContext {
  const injuryBlob = [
    athlete.assessment?.injuryRecovery ?? "",
    athlete.mainLimiter,
    athlete.secondaryLimiter,
  ]
    .join(" ")
    .toLowerCase();

  const injuryFlags: string[] = [];
  if (injuryBlob.includes("calf")) injuryFlags.push("calf");
  if (injuryBlob.includes("achilles")) injuryFlags.push("achilles");
  if (injuryBlob.includes("knee")) injuryFlags.push("knee");

  return {
    abilityLevel: athlete.programmeInputs.abilityLevel,
    recoveryStatus:
      athlete.programmeInputs.recoveryStatus === "average"
        ? "average"
        : athlete.recoveryStatus === "moderate"
          ? "moderate"
          : athlete.programmeInputs.recoveryStatus,
    lowerBodySoreness: athlete.programmeInputs.lowerBodySoreness,
    raceTimeline: athlete.programmeInputs.raceTimeline,
    injuryFlags,
    adminManualSelection: true,
  };
}

/** Check adjacent-day conflicts for sessions with hyroxMetadata.avoidAdjacentTo. */
export function getAdjacentSessionWarnings(
  entry: CoachLibraryEntry,
  adjacentSessionTitles: string[],
  adjacentDayLabel: string
): SessionGuardrailWarning[] {
  const m = meta(entry);
  if (!m?.avoidAdjacentTo.length || !adjacentSessionTitles.length) return [];

  const blob = adjacentSessionTitles.join(" ").toLowerCase();
  const hits: string[] = [];

  for (const rule of m.avoidAdjacentTo) {
    const key = rule.replace(/_/g, " ").toLowerCase();
    if (
      (key.includes("threshold") && (blob.includes("threshold") || blob.includes("th "))) ||
      (key.includes("heavy leg") && blob.includes("leg")) ||
      (key.includes("wall ball") && blob.includes("wall ball")) ||
      (key.includes("compromised") && blob.includes("compromised")) ||
      (key.includes("race sim") && blob.includes("race")) ||
      (key.includes("hill sprint") && blob.includes("hill")) ||
      (key.includes("sled") && blob.includes("sled")) ||
      (key.includes("lunge") && blob.includes("lunge")) ||
      (key.includes("track") && blob.includes("track"))
    ) {
      hits.push(rule);
    }
  }

  if (!hits.length) return [];

  return [
    {
      id: `adjacent_${adjacentDayLabel}`,
      severity: "warn",
      message: `Avoid adjacent to ${hits.slice(0, 3).join(", ")} — check ${adjacentDayLabel} schedule.`,
    },
  ];
}
