/**
 * Athlete-safe presentation for Session Family sessions.
 * Coach UI may show stage/family labels; athlete UI must not.
 */

import type { SessionFamilyDraftAttachment } from "@/app/lib/hyroxSessionFamilyDraftTypes";
import type { SessionFamily } from "@/app/lib/hyroxSessionFamilyTypes";

const ATHLETE_FAMILY_TITLES: Record<string, string> = {
  threshold_5min_repeats: "Threshold Intervals",
  hyrox_compromised_run: "Compromised Running",
  tempo_aerobic_quality: "Tempo Run",
  easy_long_run_volume: "Easy Run",
  ski_threshold_intervals: "Ski Intervals",
  row_threshold_intervals: "Row Intervals",
  bike_ftp_quality: "Bike Intervals",
  sled_push_capacity: "Sled Push",
  wall_ball_density: "Wall Balls",
  burpee_economy: "Burpee Broad Jumps",
  lunge_durability: "Walking Lunges",
  farmers_carry_durability: "Farmers Carry",
  strength_lower_foundation: "Lower Strength",
  strength_upper_foundation: "Upper Strength",
};

/** Stable athlete-facing product name for a family (no stage numbers / Beginner–Advanced). */
export function athleteFacingSessionFamilyTitle(family: {
  id: string;
  name: string;
}): string {
  if (ATHLETE_FAMILY_TITLES[family.id]) return ATHLETE_FAMILY_TITLES[family.id];
  // Generic fallback: drop em-dash suffix noise, keep short brand name.
  return family.name.replace(/\s+[—\-]\s+.+$/, "").trim() || family.name;
}

/**
 * Easy/long stages need natural athlete titles by stage role.
 * Coach still sees duration labels; athletes never see Stage N.
 */
export function athleteFacingEasyLongTitle(stageKey: string | null | undefined): string {
  if (!stageKey) return "Easy Run";
  if (stageKey === "stage_3" || stageKey === "stage_4" || stageKey === "consolidation") {
    return "Long Run";
  }
  return "Easy Run";
}

/**
 * Strip coach progression markers that must never reach athlete titles.
 * Examples: "… · S1 — …", "… · Stage 2", "… · Consolidation".
 */
export function sanitizeAthleteSessionTitle(raw: string | null | undefined): string {
  let title = (raw ?? "").trim();
  if (!title) return "Session";

  title = title
    .replace(/\s*[·|]\s*S\d+\b.*$/i, "")
    .replace(/\s*[·|]\s*Stage\s+\d+\b.*$/i, "")
    .replace(/\s*[·|]\s*Consol(?:idation)?\b.*$/i, "")
    .replace(/\s*[·|]\s*Deload\b.*$/i, "")
    .replace(/\s+[—\-]\s*S\d+\b.*$/i, "")
    .replace(/\bThreshold\s*[—\-]\s*5\s*Minute\s*Repeats\b/i, "Threshold Intervals")
    .replace(/\bHYROX\s*[—\-]\s*Compromised Running\b/i, "Compromised Running")
    .replace(/\bTempo\s*[—\-]\s*Aerobic Quality\b/i, "Tempo Run")
    .replace(/\bEasy\s*\/\s*Long Run Volume\b/i, "Easy Run")
    .replace(/\bBeginner\b/gi, "")
    .replace(/\bIntermediate\b/gi, "")
    .replace(/\bAdvanced\b/gi, "")
    .replace(/\bLevel\s*[123]\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s*[—\-]\s*$/g, "")
    .trim();

  // Collapse coach/family Threshold titles to the stable athlete product name.
  if (
    /^threshold\b/i.test(title) &&
    /\b(S\d+|Stage\s*\d+|Repeats|progression|5\s*Minute)\b/i.test(title)
  ) {
    return "Threshold Intervals";
  }
  if (/^threshold\s+progression\b/i.test(title)) {
    return "Threshold Intervals";
  }
  if (/compromised/i.test(title)) return "Compromised Running";
  if (/^tempo\b/i.test(title)) return "Tempo Run";
  if (/^long\b/i.test(title)) return "Long Run";
  if (/^easy\b/i.test(title)) return "Easy Run";

  return title || "Session";
}

export function coachStageShortLabel(stageKey: string): string {
  if (stageKey.startsWith("stage_")) return `Stage ${stageKey.replace("stage_", "")}`;
  if (stageKey === "consolidation") return "Consolidation";
  if (stageKey.startsWith("deload")) return "Deload";
  return stageKey;
}

/** Compact coach badge: "Threshold 5 Minute Repeats · Stage 2" */
export function coachFamilyContextLabel(attachment: {
  familyName: string;
  stageKey: string;
  stageLabel?: string;
}): string {
  const short = coachStageShortLabel(attachment.stageKey);
  const familyShort = attachment.familyName.replace(/^Threshold — /, "Threshold ");
  return `${familyShort} · ${short}`;
}

/** Coach card primary title — family product name only (no stage/structure). */
export function coachFamilySessionTitle(familyName: string): string {
  return familyName.trim() || "Session";
}

/** Coach card secondary line: Stage N · structure */
export function coachFamilySessionSubtitle(args: {
  stageKey: string;
  structureLine: string;
}): string {
  const stage = coachStageShortLabel(args.stageKey);
  const structure = args.structureLine.trim();
  return structure ? `${stage} · ${structure}` : stage;
}

export function athleteFacingTitleForFamilyAttachment(
  attachment:
    | (Pick<SessionFamilyDraftAttachment, "familyId" | "familyName"> & {
        stageKey?: string | null;
      })
    | null
    | undefined,
  family?: SessionFamily | null
): string | null {
  if (!attachment && !family) return null;
  const familyId = family?.id ?? attachment!.familyId;
  if (familyId === "easy_long_run_volume") {
    return athleteFacingEasyLongTitle(attachment?.stageKey);
  }
  return athleteFacingSessionFamilyTitle({
    id: familyId,
    name: family?.name ?? attachment!.familyName,
  });
}
