import { computePaceGuidanceFromFiveKSeconds } from "@/app/lib/paceGuidance";
import { parseTimeToSeconds } from "@/app/lib/mapAssessmentToProgrammeInput";
import type { CommunityPreviewInput } from "./types";

const TREADMILL_NOTE =
  "Treadmill: 1% incline unless calf/Achilles issues. If HR drifts above threshold, slow down and keep the stimulus correct.";

function formatSecPerKm(secPerKm: number): string {
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${s.toString().padStart(2, "0")}/km`;
}

function thresholdFrom5k(seconds: number): string {
  const g = computePaceGuidanceFromFiveKSeconds(seconds);
  if (!g) return "";
  return g.zones.threshold;
}

function thresholdFrom10k(seconds: number): string {
  const baseSecPerKm = seconds / 10;
  const fast = baseSecPerKm;
  const slow = baseSecPerKm + 15;
  return `${formatSecPerKm(fast)}–${formatSecPerKm(slow)}/km`;
}

export type RunPaceContext = {
  has5k: boolean;
  has10k: boolean;
  thresholdRange: string | null;
  easyGuidance: string;
  tempoRange: string | null;
};

export function buildRunPaceContext(input: CommunityPreviewInput): RunPaceContext {
  const sec5k = parseTimeToSeconds(input.current_5k_time);
  const sec10k = parseTimeToSeconds(input.current_10k_time);
  const g5k = sec5k ? computePaceGuidanceFromFiveKSeconds(sec5k) : null;

  let thresholdRange: string | null = null;
  if (sec5k) {
    thresholdRange = thresholdFrom5k(sec5k);
  } else if (sec10k) {
    thresholdRange = thresholdFrom10k(sec10k);
  }

  const easyGuidance = g5k
    ? `Conversational RPE 2–4 · easy zone ${g5k.zones.easy} — effort over pace`
    : "Conversational RPE 2–4 · talk-test easy — do not pace-drive easy running";

  const tempoRange = g5k ? g5k.zones.tempo : sec10k ? thresholdFrom10k(sec10k) : null;

  return {
    has5k: Boolean(sec5k),
    has10k: Boolean(sec10k),
    thresholdRange,
    easyGuidance,
    tempoRange,
  };
}

export function thresholdPaceGuidance(
  input: CommunityPreviewInput,
  rpe: string
): string {
  const ctx = buildRunPaceContext(input);
  if (ctx.thresholdRange) {
    const anchor = ctx.has5k ? "5K anchor" : "10K anchor";
    return `Target: ${ctx.thresholdRange} or RPE ${rpe}. ${TREADMILL_NOTE}`;
  }
  return `Target: RPE ${rpe} · controlled threshold — sustainable, not sprinting. Talk test: 3–4 word answers between reps. ${TREADMILL_NOTE}`;
}

export function easyRunPaceGuidance(input: CommunityPreviewInput): string {
  const ctx = buildRunPaceContext(input);
  return ctx.easyGuidance;
}

export function compromisedRunPaceGuidance(
  input: CommunityPreviewInput,
  rpe: string
): string {
  const ctx = buildRunPaceContext(input);
  if (ctx.has5k && ctx.tempoRange) {
    return `Between stations: ${ctx.tempoRange} or RPE ${rpe} — controlled, not all-out. Form before pace.`;
  }
  return `Between stations: RPE ${rpe} — controlled race rhythm. Form before pace.`;
}

function ergSplitFrom1k(seconds: number, label: string): string {
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  const base = `${min}:${sec.toString().padStart(2, "0")}`;
  const per500 = seconds / 2;
  const pMin = Math.floor(per500 / 60);
  const pSec = Math.round(per500 % 60);
  return `${label} 1K ${base} → threshold ~${pMin}:${pSec.toString().padStart(2, "0")}/500m`;
}

export function ergThresholdGuidance(
  input: CommunityPreviewInput,
  modality: "ski" | "row" | "mixed",
  rpe: string
): string {
  const skiSec = parseTimeToSeconds(input.ski_1k_time);
  const rowSec = parseTimeToSeconds(input.row_1k_time);
  const parts: string[] = [];

  if (modality === "ski" || modality === "mixed") {
    if (skiSec) {
      parts.push(
        `${ergSplitFrom1k(skiSec, "Ski")} — work around sustainable race pace to ~5 sec faster per 500m if advanced`
      );
    }
  }
  if (modality === "row" || modality === "mixed") {
    if (rowSec) {
      parts.push(
        `${ergSplitFrom1k(rowSec, "Row")} — work around sustainable race pace to ~5 sec faster per 500m if advanced`
      );
    }
  }

  if (parts.length === 0) {
    return `RPE ${rpe} · consistent splits — hold technique; beginners prioritise rhythm over pace`;
  }
  return `${parts.join(". ")}. RPE ${rpe}. Avoid overconfidence on early blocks.`;
}

export function ergEasyGuidance(): string {
  return "RPE 2–4 · nasal breathing where possible · smooth stroke/rpm — add aerobic volume without run impact";
}
