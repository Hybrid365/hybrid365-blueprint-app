/**
 * Home V2 — modality-aware compact session targets (max 2, no placeholder labels).
 */

import type { HyroxSession, SessionDetail } from "@/app/lib/hyroxTeamDashboardMock";
import { inferSessionActivityType } from "@/app/lib/hyrox-team/modules/sessionLogging/inferActivityType";
import type { SessionActivityType } from "@/app/lib/hyrox-team/modules/sessionLogging/types";

export type CompactSessionTarget = { label: string; value: string };

const PLACEHOLDER_PHRASES = [
  "see session prescription",
  "per programme prescription",
  "see coach pacing note",
];

function norm(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

export function isPopulatedTargetValue(value: string | null | undefined): value is string {
  if (value == null) return false;
  const t = String(value).trim();
  if (!t || t === "—" || t.toLowerCase() === "n/a") return false;
  const n = norm(t);
  if (PLACEHOLDER_PHRASES.some((p) => n === p || n.startsWith(p))) return false;
  return true;
}

function looksLikeRpe(value: string): boolean {
  const n = norm(value);
  return /^rpe\b/.test(n) || /\brpe\s*\d/.test(n);
}

function looksLikeHr(value: string): boolean {
  if (looksLikeRpe(value)) return false;
  const n = norm(value);
  return (
    /\bz[1-5]\b/.test(n) ||
    /\b\d+\s*bpm\b/.test(n) ||
    /\bhr\b/.test(n) ||
    /\bheart\s*rate\b/.test(n) ||
    /%\s*max/.test(n)
  );
}

function looksLikePaceOrSplit(value: string): boolean {
  const n = norm(value);
  return (
    /\/\s*km\b/.test(n) ||
    /\/\s*500m\b/.test(n) ||
    /\/\s*1000m\b/.test(n) ||
    /\bmin\/km\b/.test(n) ||
    /\b\d+:\d{2}\b/.test(n) ||
    /\bpace\b/.test(n) ||
    /\bsplit\b/.test(n)
  );
}

function looksLikeLoad(value: string): boolean {
  const n = norm(value);
  if (looksLikePaceOrSplit(value)) return false;
  return (
    /\bkg\b/.test(n) ||
    /\blbs?\b/.test(n) ||
    /@\s*rpe\b/.test(n) ||
    /\btop\s+set\b/.test(n) ||
    /\bload\b/.test(n) ||
    /\b%\s*1rm\b/.test(n)
  );
}

function looksLikeWatts(value: string): boolean {
  const n = norm(value);
  return /\b\d+\s*w\b/.test(n) || /\bwatts?\b/.test(n);
}

function looksLikeTempo(value: string): boolean {
  const n = norm(value);
  return (
    /\b\d+[-–]\d+[-–]\d+\b/.test(n) ||
    /\btempo\b/.test(n) ||
    /\bsec(ond)?s?\s+(lower|pause|up)\b/.test(n)
  );
}

function firstPopulated(...values: Array<string | null | undefined>): string | null {
  for (const v of values) {
    if (isPopulatedTargetValue(v)) return v;
  }
  return null;
}

function pick(
  label: string,
  value: string | null | undefined,
  validate?: (v: string) => boolean
): CompactSessionTarget | null {
  if (!isPopulatedTargetValue(value)) return null;
  if (validate && !validate(value)) return null;
  return { label, value };
}

export function resolveSessionModality(session: HyroxSession): SessionActivityType {
  const fromPlanned = session.plannedTargets?.activityType;
  if (fromPlanned && fromPlanned !== "other") return fromPlanned;
  if (session.activityType && session.activityType !== "other") return session.activityType;

  const fromType =
    session.type === "Run"
      ? "run"
      : session.type === "Strength"
        ? "strength"
        : session.type === "Hybrid"
          ? "hyrox"
          : null;
  if (fromType) return fromType;

  return inferSessionActivityType({
    category: session.focus,
    sessionName: session.name,
    sessionTypeLabel: session.type,
  });
}

export function resolveCompactSessionTargets(
  session: HyroxSession,
  detail: SessionDetail | null
): CompactSessionTarget[] {
  const modality = resolveSessionModality(session);
  const planned = session.plannedTargets;
  const d = detail;

  const rpe = firstPopulated(planned?.targetRPE, d?.rpeTarget, session.rpeTarget);
  const hr = firstPopulated(planned?.targetHR, d?.hrZone);
  const pace = firstPopulated(planned?.targetPace);
  const split = firstPopulated(planned?.targetSplit);
  const load = firstPopulated(planned?.targetLoad);
  const paceLoadBlob = firstPopulated(d?.targetPaceLoad);

  const coachEmphasis = firstPopulated(d?.coachPacingNote, d?.coachNote);
  const stationTarget = isPopulatedTargetValue(d?.stationFocus) ? d!.stationFocus! : null;

  const candidates: CompactSessionTarget[] = [];

  if (modality === "strength") {
    const loadVal =
      load ||
      (paceLoadBlob && looksLikeLoad(paceLoadBlob) ? paceLoadBlob : null) ||
      (paceLoadBlob && !looksLikePaceOrSplit(paceLoadBlob) && !looksLikeRpe(paceLoadBlob)
        ? paceLoadBlob
        : null);
    const tempoVal =
      (paceLoadBlob && looksLikeTempo(paceLoadBlob) ? paceLoadBlob : null) ||
      (coachEmphasis && looksLikeTempo(coachEmphasis) ? coachEmphasis : null);

    if (pick("Target RPE", rpe)) candidates.push(pick("Target RPE", rpe)!);
    if (pick("Target load", loadVal, (v) => looksLikeLoad(v) || !looksLikePaceOrSplit(v)))
      candidates.push(pick("Target load", loadVal, (v) => looksLikeLoad(v) || !looksLikePaceOrSplit(v))!);
    if (pick("Tempo", tempoVal, looksLikeTempo)) candidates.push(pick("Tempo", tempoVal, looksLikeTempo)!);
    if (pick("Coach emphasis", coachEmphasis, (v) => !looksLikeTempo(v)))
      candidates.push(pick("Coach emphasis", coachEmphasis, (v) => !looksLikeTempo(v))!);
  } else if (modality === "run") {
    const paceVal =
      pace ||
      (paceLoadBlob && looksLikePaceOrSplit(paceLoadBlob) ? paceLoadBlob : null) ||
      (paceLoadBlob && !looksLikeRpe(paceLoadBlob) && !looksLikeHr(paceLoadBlob) ? paceLoadBlob : null);
    if (pick("Pace", paceVal, (v) => !looksLikeRpe(v))) candidates.push(pick("Pace", paceVal, (v) => !looksLikeRpe(v))!);
    if (pick("HR", hr, looksLikeHr)) candidates.push(pick("HR", hr, looksLikeHr)!);
    if (pick("RPE", rpe)) candidates.push(pick("RPE", rpe)!);
  } else if (modality === "ski" || modality === "row" || modality === "bike") {
    const splitVal =
      split ||
      (paceLoadBlob && looksLikePaceOrSplit(paceLoadBlob) ? paceLoadBlob : null);
    const wattsVal =
      (paceLoadBlob && looksLikeWatts(paceLoadBlob) ? paceLoadBlob : null) ||
      (split && looksLikeWatts(split) ? split : null);
    if (pick("Split", splitVal, (v) => looksLikePaceOrSplit(v) && !looksLikeWatts(v)))
      candidates.push(pick("Split", splitVal, (v) => looksLikePaceOrSplit(v) && !looksLikeWatts(v))!);
    if (pick("Watts", wattsVal, looksLikeWatts)) candidates.push(pick("Watts", wattsVal, looksLikeWatts)!);
    if (pick("HR", hr, looksLikeHr)) candidates.push(pick("HR", hr, looksLikeHr)!);
    if (pick("RPE", rpe)) candidates.push(pick("RPE", rpe)!);
  } else if (modality === "hyrox") {
    const runPace =
      pace ||
      (paceLoadBlob && looksLikePaceOrSplit(paceLoadBlob) ? paceLoadBlob : null);
    if (pick("RPE", rpe)) candidates.push(pick("RPE", rpe)!);
    if (pick("Run pace", runPace, (v) => !looksLikeRpe(v)))
      candidates.push(pick("Run pace", runPace, (v) => !looksLikeRpe(v))!);
    if (pick("Station target", stationTarget)) candidates.push(pick("Station target", stationTarget)!);
    if (pick("Coach emphasis", coachEmphasis))
      candidates.push(pick("Coach emphasis", coachEmphasis)!);
  } else {
    if (pick("RPE", rpe)) candidates.push(pick("RPE", rpe)!);
    if (pick("Pace", pace)) candidates.push(pick("Pace", pace)!);
    if (pick("HR", hr, looksLikeHr)) candidates.push(pick("HR", hr, looksLikeHr)!);
  }

  const seen = new Set<string>();
  const unique: CompactSessionTarget[] = [];
  for (const c of candidates) {
    const key = `${c.label}:${norm(c.value)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(c);
  }

  return unique.slice(0, 2);
}
