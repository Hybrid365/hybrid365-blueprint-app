/**
 * Athlete-safe presentation for Session Family sessions.
 * Coach UI may show stage/family labels; athlete UI must not.
 */

import type { SessionFamilyDraftAttachment } from "@/app/lib/hyroxSessionFamilyDraftTypes";
import type { SessionFamily } from "@/app/lib/hyroxSessionFamilyTypes";

/** Stable athlete-facing product name for a family (no stage numbers). */
export function athleteFacingSessionFamilyTitle(family: {
  id: string;
  name: string;
}): string {
  if (family.id === "threshold_5min_repeats") return "Threshold Intervals";
  // Generic fallback: drop em-dash suffix noise, keep short brand name.
  return family.name.replace(/\s+[—\-]\s+.+$/, "").trim() || family.name;
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
    .replace(/\s{2,}/g, " ")
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
  attachment: Pick<SessionFamilyDraftAttachment, "familyId" | "familyName"> | null | undefined,
  family?: SessionFamily | null
): string | null {
  if (!attachment && !family) return null;
  return athleteFacingSessionFamilyTitle({
    id: family?.id ?? attachment!.familyId,
    name: family?.name ?? attachment!.familyName,
  });
}
