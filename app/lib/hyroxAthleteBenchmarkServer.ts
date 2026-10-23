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
  type HyroxAthleteBenchmarkRow,
  type NormalizedBenchmark,
} from "@/app/lib/hyroxBenchmarkTypes";
import {
  applyBenchmarkCoachAction,
  assertSingleActivePerType,
  BenchmarkWorkflowError,
  type BenchmarkCoachAction,
  type BenchmarkWorkflowRow,
} from "@/app/lib/hyroxBenchmarkWorkflow";

export const HYROX_BENCHMARK_SELECT =
  "id, athlete_id, benchmark_type, result_value, result_unit, normalized_value, normalized_unit, derived_value, derived_unit, result_date, source, status, active_for_programming, context, notes, source_table, source_id, idempotency_key, submitted_by_user_id, approved_by_user_id, approved_at, created_at, updated_at";

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
    idempotency_key: raw.idempotency_key == null ? null : String(raw.idempotency_key),
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
  if (error.code === "PGRST205" || error.code === "42P01") return true;
  return /(could not find the table|relation) .*hyrox_athlete_benchmarks/i.test(error.message ?? "");
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

const SUBMISSION_KEY_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A form submission key becomes a scoped idempotency key. Invalid or missing keys give null. */
export function submissionIdempotencyKey(scope: "athlete" | "coach", submissionKey: unknown): string | null {
  if (typeof submissionKey !== "string") return null;
  const key = submissionKey.trim();
  if (!SUBMISSION_KEY_PATTERN.test(key)) return null;
  return `${scope}:${key.toLowerCase()}`;
}

/**
 * One linked source record, type, value and date is one benchmark. The same value on another
 * date, or from another source record, is a separate result and gets its own key.
 */
export function linkedIdempotencyKey(
  link: { sourceTable: string; sourceId: string },
  normalized: Pick<NormalizedBenchmark, "benchmarkType" | "normalizedValue" | "resultDate">
): string {
  return `${link.sourceTable}:${link.sourceId}:${normalized.benchmarkType}:${normalized.normalizedValue}:${normalized.resultDate}`;
}

function insertPayload(
  athleteId: string,
  normalized: NormalizedBenchmark,
  source: BenchmarkSource,
  status: BenchmarkStatus,
  extra: {
    submittedByUserId?: string | null;
    approvedByUserId?: string | null;
    sourceTable?: string | null;
    sourceId?: string | null;
    idempotencyKey?: string | null;
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
    active_for_programming: false,
    context: normalized.context,
    notes: normalized.notes,
    source_table: extra.sourceTable ?? null,
    source_id: extra.sourceId ?? null,
    idempotency_key: extra.idempotencyKey ?? null,
    submitted_by_user_id: extra.submittedByUserId ?? null,
    approved_by_user_id: status === "approved" ? extra.approvedByUserId ?? null : null,
    approved_at: status === "approved" ? now : null,
  };
}

function isIdempotencyConflict(error: { code?: string; message?: string; details?: string } | null): boolean {
  if (!error || error.code !== "23505") return false;
  return /hyrox_athlete_benchmarks_idempotency_key/.test(`${error.message ?? ""} ${error.details ?? ""}`);
}

async function findByIdempotencyKey(
  client: SupabaseClient,
  athleteId: string,
  idempotencyKey: string
): Promise<HyroxAthleteBenchmarkRow | null> {
  const { data, error } = await client
    .from("hyrox_athlete_benchmarks")
    .select(HYROX_BENCHMARK_SELECT)
    .eq("athlete_id", athleteId)
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapBenchmarkRow(data as Record<string, unknown>) : null;
}

/** Atomically make one result the programming anchor for its type (database function). */
export async function activateAthleteBenchmark(
  client: SupabaseClient,
  athleteId: string,
  benchmarkId: string,
  options: { approve?: boolean; actorUserId?: string | null } = {}
): Promise<HyroxAthleteBenchmarkRow> {
  const { data, error } = await client.rpc("hyrox_activate_athlete_benchmark", {
    p_athlete_id: athleteId,
    p_benchmark_id: benchmarkId,
    p_actor_user_id: options.actorUserId ?? null,
    p_approve: Boolean(options.approve),
  });
  if (error) {
    if (error.code === "P0002" || error.code === "22023") throw new BenchmarkWorkflowError(error.message);
    throw new Error(error.message);
  }
  const raw = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null;
  const row = raw ? mapBenchmarkRow(raw) : null;
  if (!row) throw new Error("Activated benchmark could not be read.");
  return row;
}

/**
 * Insert one result. A retry with the same idempotency key returns the existing row unchanged
 * and does not re-run activation.
 */
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
    idempotencyKey?: string | null;
  }
): Promise<{ row: HyroxAthleteBenchmarkRow; duplicate: boolean }> {
  const status = options.status ?? (options.source === "athlete_submitted" ? "pending" : "approved");
  const { data, error } = await client
    .from("hyrox_athlete_benchmarks")
    .insert(insertPayload(athleteId, normalized, options.source, status, options))
    .select(HYROX_BENCHMARK_SELECT)
    .single();

  if (error && options.idempotencyKey && isIdempotencyConflict(error)) {
    const existing = await findByIdempotencyKey(client, athleteId, options.idempotencyKey);
    if (existing) return { row: existing, duplicate: true };
  }
  if (error || !data) throw new Error(error?.message ?? "Could not save benchmark.");
  const inserted = mapBenchmarkRow(data as Record<string, unknown>);
  if (!inserted) throw new Error("Saved benchmark could not be read.");

  if (options.makeActive && status === "approved") {
    const active = await activateAthleteBenchmark(client, athleteId, inserted.id, {
      actorUserId: options.approvedByUserId ?? null,
    });
    return { row: active, duplicate: false };
  }
  return { row: inserted, duplicate: false };
}

/** Append a linked testing result without overwriting older benchmark history. */
export async function appendLinkedBenchmark(
  client: SupabaseClient,
  athleteId: string,
  normalized: NormalizedBenchmark,
  link: { source: BenchmarkSource; sourceTable: string; sourceId: string; submittedByUserId?: string | null }
): Promise<"inserted" | "unchanged" | "unavailable"> {
  const idempotencyKey = linkedIdempotencyKey(link, normalized);
  let saved: { row: HyroxAthleteBenchmarkRow; duplicate: boolean };
  try {
    saved = await insertAthleteBenchmark(client, athleteId, normalized, {
      source: link.source,
      status: "pending",
      makeActive: false,
      submittedByUserId: link.submittedByUserId,
      sourceTable: link.sourceTable,
      sourceId: link.sourceId,
      idempotencyKey,
    });
  } catch (error) {
    if (error instanceof Error && isMissingTable({ message: error.message })) return "unavailable";
    throw error;
  }
  if (saved.duplicate) return "unchanged";

  // An edited source record supersedes its earlier unreviewed value; reviewed rows are left alone.
  const { error } = await client
    .from("hyrox_athlete_benchmarks")
    .update({ status: "historical", active_for_programming: false })
    .eq("athlete_id", athleteId)
    .eq("source_table", link.sourceTable)
    .eq("source_id", link.sourceId)
    .eq("benchmark_type", normalized.benchmarkType)
    .eq("status", "pending")
    .neq("id", saved.row.id);
  if (error) throw new Error(error.message);
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
  if (!target || target.athlete_id !== athleteId) throw new BenchmarkWorkflowError("Result not found.");

  const next = applyBenchmarkCoachAction(listed.rows.map(toWorkflow), benchmarkId, action);
  assertSingleActivePerType(next);
  const updated = next.find((row) => row.id === benchmarkId);
  if (!updated) throw new BenchmarkWorkflowError("Result not found.");

  if (action === "make_active" || action === "approve_and_activate") {
    return activateAthleteBenchmark(client, athleteId, benchmarkId, {
      approve: action === "approve_and_activate",
      actorUserId,
    });
  }

  // The remaining actions only change the target row.
  const patch: Record<string, unknown> = {
    status: updated.status,
    active_for_programming: updated.status === "approved" ? updated.activeForProgramming : false,
  };
  if (action === "approve") {
    patch.approved_by_user_id = actorUserId;
    patch.approved_at = new Date().toISOString();
  }

  const { data, error } = await client
    .from("hyrox_athlete_benchmarks")
    .update(patch)
    .eq("id", benchmarkId)
    .eq("athlete_id", athleteId)
    .eq("status", target.status)
    .select(HYROX_BENCHMARK_SELECT)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new BenchmarkWorkflowError("This result changed. Refresh and try again.");
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
