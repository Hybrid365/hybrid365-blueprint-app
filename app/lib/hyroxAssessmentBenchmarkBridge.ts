/**
 * Coach bridge: completed onboarding assessment → Performance Profile candidates.
 * Never auto-activates. Never invents threshold / HYROX run pace from race or 5K.
 */

import type { HyroxAthleteBenchmarkRow } from "@/app/lib/hyroxBenchmarkTypes";
import {
  BenchmarkMathError,
  parseClockToSeconds,
  parsePositiveNumber,
} from "@/app/lib/hyroxBenchmarkMath";
import {
  benchmarkLabel,
  normalizeBenchmarkInput,
  type BenchmarkDraftInput,
  type BenchmarkType,
} from "@/app/lib/hyroxBenchmarkTypes";
import type { HyroxAssessmentRow } from "@/app/lib/hyroxDatabaseTypes";

export type AssessmentBridgeMatch =
  | "none"
  | "pending_same"
  | "active_same"
  | "active_different"
  | "pending_different"
  | "historical_same";

export type AssessmentBridgeCandidate = {
  /** Stable field key for import idempotency */
  key: string;
  benchmarkType: BenchmarkType;
  label: string;
  displayValue: string;
  draft: BenchmarkDraftInput;
  provenance: string;
  match: AssessmentBridgeMatch;
  matchDetail: string | null;
  /** Race/context only — not importable as a pace anchor */
  contextOnly?: boolean;
};

export type AssessmentBridgePayload = {
  assessmentId: string;
  submittedAt: string | null;
  candidates: AssessmentBridgeCandidate[];
  /** Contextual rows that must not auto-map to hyrox_run_pace / threshold */
  context: Array<{ label: string; displayValue: string; note: string }>;
};

function assessmentDate(assessment: HyroxAssessmentRow): string {
  const submitted = assessment.submitted_at?.slice(0, 10);
  if (submitted && /^\d{4}-\d{2}-\d{2}$/.test(submitted)) return submitted;
  const created = assessment.created_at?.slice(0, 10);
  if (created && /^\d{4}-\d{2}-\d{2}$/.test(created)) return created;
  return new Date().toISOString().slice(0, 10);
}

function cleanTime(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const t = raw.trim();
  if (!t) return null;
  if (/^n\/?a$/i.test(t) || /^unknown$/i.test(t) || /^see assessment$/i.test(t)) return null;
  try {
    parseClockToSeconds(t);
    return t;
  } catch {
    return null;
  }
}

function rawString(raw: Record<string, unknown>, key: string): string | null {
  const v = raw[key];
  if (v == null) return null;
  const t = String(v).trim();
  return t || null;
}

function parseLoadKgEstimate(raw: string | null): string | null {
  if (!raw) return null;
  const cleaned = raw.replace(/,/g, "").trim();
  const m = cleaned.match(/^(\d+(?:\.\d+)?)\s*(kg)?$/i);
  if (!m) return null;
  try {
    const n = parsePositiveNumber(m[1], "load");
    return String(n);
  } catch {
    return null;
  }
}

function valuesEqual(a: number, b: number, unit: string): boolean {
  if (unit === "watts" || unit === "kg") return Math.round(a) === Math.round(b);
  return Math.abs(a - b) < 0.51;
}

function matchAgainstRows(
  type: BenchmarkType,
  normalizedValue: number,
  normalizedUnit: string,
  rows: HyroxAthleteBenchmarkRow[]
): { match: AssessmentBridgeMatch; matchDetail: string | null } {
  const sameType = rows.filter((r) => r.benchmark_type === type);
  const active = sameType.find((r) => r.active_for_programming && r.status === "approved");
  if (active && valuesEqual(active.normalized_value, normalizedValue, normalizedUnit)) {
    return { match: "active_same", matchDetail: "Already active for programming" };
  }
  if (active) {
    return {
      match: "active_different",
      matchDetail: `Active value differs (${active.result_value})`,
    };
  }
  const pendingSame = sameType.find(
    (r) =>
      r.status === "pending" && valuesEqual(r.normalized_value, normalizedValue, normalizedUnit)
  );
  if (pendingSame) {
    return { match: "pending_same", matchDetail: "Already pending coach review" };
  }
  const pendingOther = sameType.find((r) => r.status === "pending");
  if (pendingOther) {
    return {
      match: "pending_different",
      matchDetail: `Other pending value (${pendingOther.result_value})`,
    };
  }
  const histSame = sameType.find(
    (r) =>
      (r.status === "historical" || r.status === "approved") &&
      !r.active_for_programming &&
      valuesEqual(r.normalized_value, normalizedValue, normalizedUnit)
  );
  if (histSame) {
    return {
      match: "historical_same",
      matchDetail: "Same value already in history (not active)",
    };
  }
  return { match: "none", matchDetail: null };
}

function candidateFromDraft(
  key: string,
  draft: BenchmarkDraftInput,
  provenance: string,
  rows: HyroxAthleteBenchmarkRow[]
): AssessmentBridgeCandidate | null {
  try {
    const normalized = normalizeBenchmarkInput(draft);
    const { match, matchDetail } = matchAgainstRows(
      normalized.benchmarkType,
      normalized.normalizedValue,
      normalized.normalizedUnit,
      rows
    );
    return {
      key,
      benchmarkType: normalized.benchmarkType,
      label: benchmarkLabel(normalized.benchmarkType),
      displayValue: normalized.resultValue,
      draft: {
        ...draft,
        notes: draft.notes ?? "Imported from onboarding assessment",
      },
      provenance,
      match,
      matchDetail,
    };
  } catch (error) {
    if (error instanceof BenchmarkMathError) return null;
    return null;
  }
}

/**
 * Extract importable assessment values + non-importable context for coach UI.
 */
export function buildAssessmentBenchmarkBridge(
  assessment: HyroxAssessmentRow | null | undefined,
  rows: HyroxAthleteBenchmarkRow[]
): AssessmentBridgePayload | null {
  if (!assessment) return null;
  const date = assessmentDate(assessment);
  const raw =
    assessment.raw_answers && typeof assessment.raw_answers === "object"
      ? (assessment.raw_answers as Record<string, unknown>)
      : {};
  const provenance = "From onboarding assessment";
  const candidates: AssessmentBridgeCandidate[] = [];

  const five =
    cleanTime(assessment.five_k_time) ?? cleanTime(rawString(raw, "fiveKmTime"));
  if (five) {
    const c = candidateFromDraft(
      "five_k_time",
      { benchmarkType: "run_5k", time: five, date },
      provenance,
      rows
    );
    if (c) candidates.push(c);
  }

  const ten =
    cleanTime(assessment.ten_k_time) ?? cleanTime(rawString(raw, "tenKmTime"));
  if (ten) {
    const c = candidateFromDraft(
      "ten_k_time",
      { benchmarkType: "run_10k", time: ten, date },
      provenance,
      rows
    );
    if (c) candidates.push(c);
  }

  const raceTime =
    cleanTime(rawString(raw, "previousHyroxPb")) ??
    cleanTime(rawString(raw, "bestOverallTime"));
  if (raceTime) {
    const division = rawString(raw, "raceCategory") ?? "";
    const eventName = rawString(raw, "raceLocation") ?? "";
    const c = candidateFromDraft(
      "hyrox_race_pb",
      {
        benchmarkType: "hyrox_race",
        time: raceTime,
        date,
        division,
        eventName,
        notes: "Imported from onboarding assessment race PB",
      },
      provenance,
      rows
    );
    if (c) candidates.push(c);
  }

  const squat = parseLoadKgEstimate(rawString(raw, "squatEstimate"));
  if (squat) {
    const c = candidateFromDraft(
      "squat_estimate",
      {
        benchmarkType: "squat",
        loadKg: squat,
        reps: "1",
        date,
        notes: "Imported from onboarding assessment strength estimate",
      },
      provenance,
      rows
    );
    if (c) candidates.push(c);
  }

  const deadlift = parseLoadKgEstimate(rawString(raw, "deadliftEstimate"));
  if (deadlift) {
    const c = candidateFromDraft(
      "deadlift_estimate",
      {
        benchmarkType: "deadlift",
        loadKg: deadlift,
        reps: "1",
        date,
        notes: "Imported from onboarding assessment strength estimate",
      },
      provenance,
      rows
    );
    if (c) candidates.push(c);
  }

  const context: AssessmentBridgePayload["context"] = [];
  const easyPace = rawString(raw, "easyRunPace");
  if (easyPace) {
    context.push({
      label: "Easy run pace (assessment)",
      displayValue: easyPace,
      note: "Context only — does not set Threshold or HYROX run pace",
    });
  }
  if (raceTime) {
    context.push({
      label: "HYROX race / PB (assessment)",
      displayValue: raceTime,
      note: "Can import as race history. Does not set HYROX run pace — coach sets that explicitly.",
    });
  }
  const thrHr = assessment.threshold_heart_rate ?? rawString(raw, "thresholdHeartRate");
  if (thrHr != null && String(thrHr).trim()) {
    context.push({
      label: "Threshold HR (assessment)",
      displayValue: String(thrHr),
      note: "Context only — Threshold pace still requires an explicit coach estimate or lab entry",
    });
  }

  if (!candidates.length && !context.length) return null;

  return {
    assessmentId: assessment.id,
    submittedAt: assessment.submitted_at,
    candidates,
    context,
  };
}

export function assessmentImportIdempotencyKey(
  assessmentId: string,
  fieldKey: string,
  draft: BenchmarkDraftInput
): string {
  try {
    const n = normalizeBenchmarkInput(draft);
    return `assessment:${assessmentId}:${fieldKey}:${n.benchmarkType}:${n.normalizedValue}:${n.resultDate}`;
  } catch {
    return `assessment:${assessmentId}:${fieldKey}`;
  }
}

export function findAssessmentCandidate(
  bridge: AssessmentBridgePayload,
  fieldKey: string
): AssessmentBridgeCandidate | null {
  return bridge.candidates.find((c) => c.key === fieldKey) ?? null;
}
