import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildHyroxAthletePerformanceProfile,
  type HyroxAthletePerformanceProfile,
  type ProfileBenchmarkRow,
} from "@/app/lib/hyroxBenchmarkProfile";
import {
  isBenchmarkType,
  type BenchmarkContext,
  type BenchmarkSource,
  type BenchmarkStatus,
  type BenchmarkType,
  type HyroxAthleteBenchmarkRow,
  type NormalizedBenchmark,
} from "@/app/lib/hyroxBenchmarkTypes";
import {
  applyBenchmarkCoachAction,
  assertSingleActivePerType,
  type BenchmarkCoachAction,
  type BenchmarkWorkflowRow,
} from "@/app/lib/hyroxBenchmarkWorkflow";

export const HYROX_BENCHMARK_SELECT =
  "id, athlete_id, benchmark_type, result_value, result_unit, normalized_value, normalized_unit, derived_value, derived_unit, result_date, source, status, active_for_programming, context, notes, source_table, source_id, submitted_by_user_id, approved_by_user_id, approved_at, created_at, updated_at";

function num(value: unknown): number {
  return typeof value === "number" ? value : Number(value);
}

export function mapBenchmarkRow(raw: Record<string, unknown>): HyroxAthleteBenchmarkRow | null {
  const type = String(raw.benchmark_type ?? "");
  if (!isBenchmarkType(type)) return null;
  return {
    id: String(raw.id),
    athlete_id: String(raw.athlete_id),
    benchmark_type: type,
    result_value: String(raw.result_value ?? ""),
    result_unit: String(raw.result_unit ?? ""),
    normalized_value: num(raw.normalized_value),
    normalized_unit: String(raw.normalized_unit ?? ""),
    derived_value: raw.derived_value == null ? null : num(raw.derived_value),
    derived_unit: raw.derived_unit == null ? null : String(raw.derived_unit),
    result_date: String(raw.result_date ?? ""),
    source: raw.source as BenchmarkSource,
    status: raw.status as BenchmarkStatus,
    active_for_programming: Boolean(raw.active_for_programming),
    context: (raw.context ?? {}) as BenchmarkContext,
    notes: raw.notes == null ? null : String(raw.notes),
    source_table: raw.source_table == null ? null : String(raw.source_table),
    source_id: raw.source_id == null ? null : String(raw.source_id),
    submitted_by_user_id: raw.submitted_by_user_id == null ? null : String(raw.submitted_by_user_id),
    approved_by_user_id: raw.approved_by_user_id == null ? null : String(raw.approved_by_user_id),
    approved_at: raw.approved_at == null ? null : String(raw.approved_at),
    created_at: String(raw.created_at ?? ""),
    updated_at: String(raw.updated_at ?? ""),
  };
}

function toProfileRow(row: HyroxAthleteBenchmarkRow): ProfileBenchmarkRow {
  return {
    id: row.id,
    benchmarkType: row.benchmark_type,
    normalizedValue: row.normalized_value,
    normalizedUnit: row.normalized_unit,
    derivedValue: row.derived_value,
    derivedUnit: row.derived_unit,
    resultDate: row.result_date,
    source: row.source,
    status: row.status,
    activeForProgramming: row.active_for_programming,
    context: row.context as Record<string, unknown>,
  };
}

function toWorkflow(row: HyroxAthleteBenchmarkRow): BenchmarkWorkflowRow {
  return {
    id: row.id,
    athleteId: row.athlete_id,
    benchmarkType: row.benchmark_type,
    status: row.status,
    activeForProgramming: row.active_for_programming,
  };
}

function isMissingTable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === "PGRST205" || error.code === "42P01" || /hyrox_athlete_benchmarks/i.test(error.message ?? "");
}

export async function listAthleteBenchmarks(
  client: SupabaseClient,
  athleteId: string
): Promise<{ rows: HyroxAthleteBenchmarkRow[]; unavailable: boolean; error: string | null }> {
  const { data, error } = await client
    .from("hyrox_athlete_benchmarks")
    .select(HYROX_BENCHMARK_SELECT)
    .eq("athlete_id", athleteId)
    .order("result_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingTable(error)) return { rows: [], unavailable: true, error: null };
    return { rows: [], unavailable: false, error: error.message };
  }
  return {
    rows: ((data ?? []) as Record<string, unknown>[]).map(mapBenchmarkRow).filter((row): row is HyroxAthleteBenchmarkRow => Boolean(row)),
    unavailable: false,
    error: null,
  };
}

export async function getHyroxAthletePerformanceProfile(
  client: SupabaseClient,
  athleteId: string
): Promise<{ profile: HyroxAthletePerformanceProfile; rows: HyroxAthleteBenchmarkRow[]; unavailable: boolean; error: string | null }> {
  const listed = await listAthleteBenchmarks(client, athleteId);
  return {
    profile: buildHyroxAthletePerformanceProfile(listed.rows.map(toProfileRow)),
    rows: listed.rows,
    unavailable: listed.unavailable,
    error: listed.error,
  };
}

function insertPayload(
  athleteId: string,
  normalized: NormalizedBenchmark,
  source: BenchmarkSource,
  status: BenchmarkStatus,
  active: boolean,
  extra: {
    submittedByUserId?: string | null;
    approvedByUserId?: string | null;
    sourceTable?: string | null;
    sourceId?: string | null;
  }
) {
  const now = new Date().toISOString();
  return {
    athlete_id: athleteId,
    benchmark_type: normalized.benchmarkType,
    result_value: normalized.resultValue,
    result_unit: normalized.resultUnit,
    normalized_value: normalized.normalizedValue,
    normalized_unit: normalized.normalizedUnit,
    derived_value: normalized.derivedValue,
    derived_unit: normalized.derivedUnit,
    result_date: normalized.resultDate,
    source,
    status,
    active_for_programming: active,
    context: normalized.context,
    notes: normalized.notes,
    source_table: extra.sourceTable ?? null,
    source_id: extra.sourceId ?? null,
    submitted_by_user_id: extra.submittedByUserId ?? null,
    approved_by_user_id: status === "approved" ? extra.approvedByUserId ?? null : null,
    approved_at: status === "approved" ? now : null,
  };
}

async function clearActive(
  client: SupabaseClient,
  athleteId: string,
  type: BenchmarkType,
  exceptId?: string
) {
  let query = client
    .from("hyrox_athlete_benchmarks")
    .update({ active_for_programming: false })
    .eq("athlete_id", athleteId)
    .eq("benchmark_type", type)
    .eq("active_for_programming", true);
  if (exceptId) query = query.neq("id", exceptId);
  const { error } = await query;
  if (error) throw new Error(error.message);
}

export async function insertAthleteBenchmark(
  client: SupabaseClient,
  athleteId: string,
  normalized: NormalizedBenchmark,
  options: {
    source: BenchmarkSource;
    status?: BenchmarkStatus;
    makeActive?: boolean;
    submittedByUserId?: string | null;
    approvedByUserId?: string | null;
    sourceTable?: string | null;
    sourceId?: string | null;
  }
): Promise<HyroxAthleteBenchmarkRow> {
  const status = options.status ?? (options.source === "athlete_submitted" ? "pending" : "approved");
  const makeActive = Boolean(options.makeActive) && status === "approved";
  if (makeActive) {
    await clearActive(client, athleteId, normalized.benchmarkType);
  }
  const { data, error } = await client
    .from("hyrox_athlete_benchmarks")
    .insert(insertPayload(athleteId, normalized, options.source, status, makeActive, options))
    .select(HYROX_BENCHMARK_SELECT)
    .single();
  if (error || !data) throw new Error(error?.message ?? "Could not save benchmark.");
  const row = mapBenchmarkRow(data as Record<string, unknown>);
  if (!row) throw new Error("Saved benchmark could not be read.");
  return row;
}

export function linkedBenchmarkUnchanged(
  existing: Pick<HyroxAthleteBenchmarkRow, "normalized_value" | "result_date"> | null,
  next: NormalizedBenchmark
): boolean {
  if (!existing) return false;
  return existing.normalized_value === next.normalizedValue && existing.result_date === next.resultDate;
}

/** Append a linked testing result without overwriting older benchmark history. */
export async function appendLinkedBenchmark(
  client: SupabaseClient,
  athleteId: string,
  normalized: NormalizedBenchmark,
  link: { source: BenchmarkSource; sourceTable: string; sourceId: string; submittedByUserId?: string | null }
): Promise<"inserted" | "unchanged" | "unavailable"> {
  const { data, error } = await client
    .from("hyrox_athlete_benchmarks")
    .select("id, normalized_value, result_date, status")
    .eq("athlete_id", athleteId)
    .eq("source_table", link.sourceTable)
    .eq("source_id", link.sourceId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (isMissingTable(error)) return "unavailable";
    throw new Error(error.message);
  }

  const previous = data as { id: string; normalized_value: number; result_date: string; status: string } | null;
  if (
    previous &&
    linkedBenchmarkUnchanged(
      { normalized_value: num(previous.normalized_value), result_date: previous.result_date },
      normalized
    )
  ) {
    return "unchanged";
  }

  if (previous?.status === "pending") {
    await client
      .from("hyrox_athlete_benchmarks")
      .update({ status: "historical", active_for_programming: false })
      .eq("id", previous.id);
  }

  await insertAthleteBenchmark(client, athleteId, normalized, {
    source: link.source,
    status: "pending",
    makeActive: false,
    submittedByUserId: link.submittedByUserId,
    sourceTable: link.sourceTable,
    sourceId: link.sourceId,
  });
  return "inserted";
}

export async function applyStoredBenchmarkAction(
  client: SupabaseClient,
  athleteId: string,
  benchmarkId: string,
  action: BenchmarkCoachAction,
  actorUserId: string | null
): Promise<HyroxAthleteBenchmarkRow> {
  const listed = await listAthleteBenchmarks(client, athleteId);
  if (listed.error) throw new Error(listed.error);
  if (listed.unavailable) throw new Error("Benchmark history is not available yet.");
  const target = listed.rows.find((row) => row.id === benchmarkId);
  if (!target || target.athlete_id !== athleteId) throw new Error("Result not found.");

  const next = applyBenchmarkCoachAction(listed.rows.map(toWorkflow), benchmarkId, action);
  assertSingleActivePerType(next);
  const updated = next.find((row) => row.id === benchmarkId);
  if (!updated) throw new Error("Result not found.");

  const changed = next.filter((row) => {
    const before = listed.rows.find((item) => item.id === row.id);
    return (
      before &&
      (before.status !== row.status || before.active_for_programming !== row.activeForProgramming)
    );
  });

  for (const row of changed) {
    if (row.id === benchmarkId) continue;
    const { error } = await client
      .from("hyrox_athlete_benchmarks")
      .update({ active_for_programming: false })
      .eq("id", row.id)
      .eq("athlete_id", athleteId);
    if (error) throw new Error(error.message);
  }

  const patch: Record<string, unknown> = {
    status: updated.status,
    active_for_programming: updated.activeForProgramming,
  };
  if (action === "approve" || action === "approve_and_activate") {
    patch.approved_by_user_id = actorUserId;
    patch.approved_at = new Date().toISOString();
  }
  if (updated.status !== "approved") {
    patch.active_for_programming = false;
  }

  const { data, error } = await client
    .from("hyrox_athlete_benchmarks")
    .update(patch)
    .eq("id", benchmarkId)
    .eq("athlete_id", athleteId)
    .select(HYROX_BENCHMARK_SELECT)
    .single();
  if (error || !data) throw new Error(error?.message ?? "Could not update benchmark.");
  const row = mapBenchmarkRow(data as Record<string, unknown>);
  if (!row) throw new Error("Updated benchmark could not be read.");
  return row;
}

export async function updateBenchmarkNotes(
  client: SupabaseClient,
  athleteId: string,
  benchmarkId: string,
  notes: string
): Promise<HyroxAthleteBenchmarkRow> {
  const { data, error } = await client
    .from("hyrox_athlete_benchmarks")
    .update({ notes: notes.trim() || null })
    .eq("id", benchmarkId)
    .eq("athlete_id", athleteId)
    .select(HYROX_BENCHMARK_SELECT)
    .single();
  if (error || !data) throw new Error(error?.message ?? "Could not update notes.");
  const row = mapBenchmarkRow(data as Record<string, unknown>);
  if (!row) throw new Error("Updated benchmark could not be read.");
  return row;
}

export async function correctBenchmarkResult(
  client: SupabaseClient,
  athleteId: string,
  benchmarkId: string,
  normalized: NormalizedBenchmark
): Promise<HyroxAthleteBenchmarkRow> {
  const { data, error } = await client
    .from("hyrox_athlete_benchmarks")
    .update({
      benchmark_type: normalized.benchmarkType,
      result_value: normalized.resultValue,
      result_unit: normalized.resultUnit,
      normalized_value: normalized.normalizedValue,
      normalized_unit: normalized.normalizedUnit,
      derived_value: normalized.derivedValue,
      derived_unit: normalized.derivedUnit,
      result_date: normalized.resultDate,
      context: normalized.context,
      notes: normalized.notes,
    })
    .eq("id", benchmarkId)
    .eq("athlete_id", athleteId)
    .select(HYROX_BENCHMARK_SELECT)
    .single();
  if (error || !data) throw new Error(error?.message ?? "Could not correct benchmark.");
  const row = mapBenchmarkRow(data as Record<string, unknown>);
  if (!row) throw new Error("Corrected benchmark could not be read.");
  return row;
}
