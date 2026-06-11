/**
 * Paid community session classification helpers (dashboard / programme drawer).
 */

import type { MemberSessionDetail } from "@/app/lib/memberDashboardSchedule";
import { sessionHasErgThresholdComponent, sessionHasRunComponent } from "@/app/lib/runPrescription";

export type SessionRunningClassificationInput = Pick<
  MemberSessionDetail,
  | "category"
  | "tags"
  | "title"
  | "intent"
  | "runPrescription"
  | "warmUp"
  | "mainWork"
  | "coolDown"
  | "finisher"
  | "coachingNotes"
  | "doubleSession"
> & {
  session_type?: string | null;
};

const RUN_TAG_EXACT = new Set([
  "run",
  "running",
  "threshold_run",
  "tempo_run",
  "long_run",
  "aerobic_run",
  "interval_run",
  "easy_run",
  "hybrid_compromised",
  "hybrid_density",
  "parkrun",
  "compromised_running",
]);

const RUN_TAG_SUBSTRINGS = [
  "run",
  "running",
  "parkrun",
  "easy run",
  "long run",
  "race pace",
  "compromised running",
  "interval",
  "threshold",
  "tempo",
] as const;

const CONTEXTUAL_TAG_SUBSTRINGS = ["threshold", "tempo", "aerobic", "interval", "intervals"] as const;

const TITLE_RUN_RE =
  /\b(run|running|threshold|tempo|parkrun|race\s*pace|compromised\s*running|intervals?)\b/i;

const BODY_RUN_RE = /\b(run|running|jog|jogging)\b/i;

const DISTANCE_RE =
  /\b(400m|800m|1\s*km|2\s*km|3\s*km|5\s*km|10\s*km|\d+(\.\d+)?\s*km|\d+(\.\d+)?\s*kilomet(?:er|re)s?|\d+(\.\d+)?\s*miles?)\b/i;

const INTENT_RUN_RE =
  /\b(run|running|threshold|tempo|aerobic\s+run|long\s+run|easy\s+run|race\s+pace|compromised|intervals?|parkrun)\b/i;

const PURE_ERG_RE =
  /\b(ski\s*erg|skierg|row(?:ing)?\s*(?:erg|machine)?|bike|cycle|cycling|erg\s*threshold)\b/i;

function sessionTypeValue(session: SessionRunningClassificationInput): string {
  return (session.session_type ?? session.category ?? "").trim().toLowerCase();
}

function collectTextParts(session: SessionRunningClassificationInput): string[] {
  const parts: string[] = [
    session.title ?? "",
    session.intent ?? "",
    session.coachingNotes ?? "",
    ...(session.warmUp ?? []),
    ...(session.mainWork ?? []),
    ...(session.coolDown ?? []),
    ...(session.finisher ?? []),
  ];
  const ds = session.doubleSession;
  if (ds) {
    parts.push(ds.title ?? "", ds.intent ?? "", ...(ds.main ?? []), ...(ds.notes ?? []));
  }
  return parts.filter((p) => p.trim().length > 0);
}

function tagHaystack(tags: string[]): string {
  return tags.map((t) => t.toLowerCase()).join(" ");
}

function hasRunInTags(tags: string[]): boolean {
  const joined = tagHaystack(tags);
  for (const tag of tags) {
    const t = tag.toLowerCase().trim();
    if (!t) continue;
    if (RUN_TAG_EXACT.has(t)) return true;
    for (const sub of RUN_TAG_SUBSTRINGS) {
      if (t.includes(sub)) return true;
    }
  }
  for (const ctx of CONTEXTUAL_TAG_SUBSTRINGS) {
    if (!joined.includes(ctx)) continue;
    if (joined.includes("run") || joined.includes("running")) return true;
  }
  return false;
}

function isPureStrengthWithoutRunning(
  session: SessionRunningClassificationInput,
  hay: string,
  tags: string[]
): boolean {
  const type = sessionTypeValue(session);
  if (type !== "strength") return false;
  if (session.runPrescription) return false;
  if (sessionHasRunComponent(tags, session.title ?? "")) return false;
  if (hasRunInTags(tags)) return false;
  if (BODY_RUN_RE.test(hay) || TITLE_RUN_RE.test(session.title ?? "")) return false;
  if (DISTANCE_RE.test(hay)) return false;
  return true;
}

function isPureErgAerobicWithoutRunning(
  session: SessionRunningClassificationInput,
  hay: string,
  tags: string[]
): boolean {
  const type = sessionTypeValue(session);
  if (type !== "aerobic" && type !== "recovery") return false;

  const joined = tagHaystack(tags);
  const ergByTag =
    joined.includes("aerobic_support") ||
    joined.includes("erg_threshold") ||
    tags.some((t) => t.toLowerCase().includes("erg"));

  const title = session.title ?? "";
  const ergByTitle =
    sessionHasErgThresholdComponent(tags, title) || PURE_ERG_RE.test(title) || PURE_ERG_RE.test(hay);

  if (!ergByTag && !ergByTitle) return false;

  if (session.runPrescription) return false;
  if (sessionHasRunComponent(tags, title)) return false;
  if (hasRunInTags(tags)) return false;
  if (BODY_RUN_RE.test(hay) || DISTANCE_RE.test(hay)) return false;
  if (TITLE_RUN_RE.test(title) && !PURE_ERG_RE.test(title)) return false;

  return true;
}

/**
 * True when a paid community session includes running worth logging distance for.
 */
export function sessionIncludesRunning(session: SessionRunningClassificationInput): boolean {
  const tags = session.tags ?? [];
  const title = session.title ?? "";
  const type = sessionTypeValue(session);
  const hay = collectTextParts(session).join(" ").toLowerCase();

  if (isPureStrengthWithoutRunning(session, hay, tags)) return false;
  if (isPureErgAerobicWithoutRunning(session, hay, tags)) return false;

  if (type === "run" || type.includes("run")) return true;
  if (session.runPrescription) return true;
  if (sessionHasRunComponent(tags, title)) return true;
  if (hasRunInTags(tags)) return true;
  if (TITLE_RUN_RE.test(title)) return true;
  if (INTENT_RUN_RE.test(session.intent ?? "")) return true;
  if (BODY_RUN_RE.test(hay)) return true;
  if (DISTANCE_RE.test(hay) || DISTANCE_RE.test(title)) return true;

  return false;
}
