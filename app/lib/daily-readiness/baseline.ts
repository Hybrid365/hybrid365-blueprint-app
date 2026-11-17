/**
 * The athlete's own recent normal.
 * Fewer than three mornings is not a baseline.
 */

import type { BaselineMaturity, MetricComparison, ReadinessSubmission } from "@/app/lib/daily-readiness/types";

const FIELDS = ["sleep", "energy", "recovery", "soreness", "trainingReadiness"] as const;

export function baselineMaturity(count: number): BaselineMaturity {
  if (count < 3) return "INSUFFICIENT";
  if (count < 6) return "EMERGING";
  return "ESTABLISHED";
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const value = sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
  return Math.round(value * 10) / 10;
}

export function compareWithBaseline(history: ReadinessSubmission[], today: ReadinessSubmission | null): MetricComparison[] {
  const prior = history.filter((item) => item.id !== today?.id);
  return FIELDS.map((field) => {
    const normal = median(prior.map((item) => item[field]).filter((value): value is number => value != null));
    const current = today?.[field] ?? null;
    const worse = current != null && normal != null
      ? field === "soreness" ? current - normal >= 2 : normal - current >= 2
      : false;
    return {
      field,
      today: current,
      normal,
      delta: current != null && normal != null ? Math.round((current - normal) * 10) / 10 : null,
      worse,
    };
  });
}
