import type { BenchmarkStatus, BenchmarkType } from "@/app/lib/hyroxBenchmarkTypes";

export type BenchmarkWorkflowRow = {
  id: string;
  athleteId: string;
  benchmarkType: BenchmarkType;
  status: BenchmarkStatus;
  activeForProgramming: boolean;
};

export type BenchmarkCoachAction =
  | "approve"
  | "approve_and_activate"
  | "reject"
  | "make_active"
  | "remove_active"
  | "mark_historical";

export class BenchmarkWorkflowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BenchmarkWorkflowError";
  }
}

function clone(rows: BenchmarkWorkflowRow[]): BenchmarkWorkflowRow[] {
  return rows.map((row) => ({ ...row }));
}

function deactivateType(rows: BenchmarkWorkflowRow[], athleteId: string, type: BenchmarkType, exceptId?: string) {
  for (const row of rows) {
    if (row.athleteId === athleteId && row.benchmarkType === type && row.id !== exceptId) {
      row.activeForProgramming = false;
    }
  }
}

/**
 * Pure approval rules. Active programming anchors are explicit and unique per type.
 * Fastest or most recent results are never selected here.
 */
export function applyBenchmarkCoachAction(
  rows: BenchmarkWorkflowRow[],
  benchmarkId: string,
  action: BenchmarkCoachAction
): BenchmarkWorkflowRow[] {
  const next = clone(rows);
  const row = next.find((item) => item.id === benchmarkId);
  if (!row) throw new BenchmarkWorkflowError("Result not found.");

  if (action === "reject") {
    if (row.status !== "pending") {
      throw new BenchmarkWorkflowError("Only a pending result can be rejected.");
    }
    row.status = "rejected";
    row.activeForProgramming = false;
    return next;
  }

  if (action === "approve" || action === "approve_and_activate") {
    if (row.status !== "pending") {
      throw new BenchmarkWorkflowError("Only a pending result can be approved.");
    }
    row.status = "approved";
    row.activeForProgramming = false;
    if (action === "approve_and_activate") {
      deactivateType(next, row.athleteId, row.benchmarkType, row.id);
      row.activeForProgramming = true;
    }
    return next;
  }

  if (action === "make_active") {
    if (row.status !== "approved") {
      throw new BenchmarkWorkflowError("Only an approved result can be used for programming.");
    }
    deactivateType(next, row.athleteId, row.benchmarkType, row.id);
    row.activeForProgramming = true;
    return next;
  }

  if (action === "remove_active") {
    row.activeForProgramming = false;
    return next;
  }

  if (row.status !== "approved" && row.status !== "historical") {
    throw new BenchmarkWorkflowError("Only an approved result can be marked historical.");
  }
  row.status = "historical";
  row.activeForProgramming = false;
  return next;
}

export function activeBenchmarks(rows: BenchmarkWorkflowRow[]): BenchmarkWorkflowRow[] {
  return rows.filter((row) => row.activeForProgramming && row.status === "approved");
}

export function assertSingleActivePerType(rows: BenchmarkWorkflowRow[]) {
  const seen = new Set<string>();
  for (const row of activeBenchmarks(rows)) {
    const key = `${row.athleteId}:${row.benchmarkType}`;
    if (seen.has(key)) {
      throw new BenchmarkWorkflowError(`More than one active ${row.benchmarkType} benchmark.`);
    }
    seen.add(key);
  }
}
