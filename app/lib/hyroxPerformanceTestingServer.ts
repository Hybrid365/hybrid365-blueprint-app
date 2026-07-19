import type { SupabaseClient } from "@supabase/supabase-js";
import { buildHyroxPerformanceProfile } from "@/app/lib/hyroxPerformanceProfile";
import {
  detectPerformanceTestingVersion,
  PERFORMANCE_TEST_WEEK_ID,
  requiredPerformanceTestTypesForVersion,
  validatePerformanceTestResult,
  type PerformanceTestingVersion,
  type PerformanceTestResultRow,
  type PerformanceTestStatus,
  type PerformanceTestType,
  type RecoveryBaselineRow,
} from "@/app/lib/hyroxPerformanceTestingTypes";
import type { HyroxAthleteRow, HyroxProgrammeSessionRow } from "@/app/lib/hyroxDatabaseTypes";

export const PERFORMANCE_TEST_RESULT_SELECT =
  "id, athlete_id, programme_week_id, test_week_id, test_type, test_date, status, result_json, notes, video_url, proof_url, coach_reviewed, coach_notes, created_at, updated_at";

export const RECOVERY_BASELINE_SELECT =
  "id, athlete_id, test_week_id, resting_hr_baseline, baseline_days, average_hrv, average_sleep_minutes, average_daily_steps, average_training_hours, device_source, notes, created_at, updated_at";

export type PerformanceTestingWeekSession = {
  id: string;
  dayOfWeek: string;
  sessionSlot: string;
  sessionName: string;
  testType: string;
  testWeekId: string;
  performanceTestingVersion?: number | null;
  prescription: Record<string, unknown> | null;
};

export type AthletePerformanceTestingPayload = {
  testWeekId: string;
  programmeWeekId: string | null;
  weekLabel: string;
  performanceTestingVersion: PerformanceTestingVersion;
  isLegacyProtocol: boolean;
  sessions: PerformanceTestingWeekSession[];
  results: PerformanceTestResultRow[];
  baseline: RecoveryBaselineRow | null;
  profile: ReturnType<typeof buildHyroxPerformanceProfile>;
  completion: {
    submitted: number;
    total: number;
    reviewed: number;
  };
};

function isPerformanceTestSession(session: HyroxProgrammeSessionRow): boolean {
  const meta = (session.metadata ?? {}) as Record<string, unknown>;
  return meta.isPerformanceTest === true && Boolean(meta.performanceTestType);
}

export async function findPublishedPerformanceTestingWeek(
  supabase: SupabaseClient,
  athleteId: string,
  testWeekId: string = PERFORMANCE_TEST_WEEK_ID
): Promise<{
  programmeWeekId: string | null;
  sessions: PerformanceTestingWeekSession[];
}> {
  const { data: weeks, error: weeksError } = await supabase
    .from("hyrox_programme_weeks")
    .select("id, week_number, weekly_focus, published_at")
    .eq("athlete_id", athleteId)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (weeksError) throw new Error(weeksError.message);

  for (const week of weeks ?? []) {
    const { data: sessions, error: sessionsError } = await supabase
      .from("hyrox_programme_sessions")
      .select(
        "id, day_of_week, session_slot, session_name, category, prescription, metadata"
      )
      .eq("programme_week_id", week.id);

    if (sessionsError) throw new Error(sessionsError.message);

    const perfSessions = ((sessions ?? []) as HyroxProgrammeSessionRow[]).filter(
      (s) => {
        const meta = (s.metadata ?? {}) as Record<string, unknown>;
        return (
          meta.isPerformanceTest === true &&
          (meta.performanceTestWeekId === testWeekId || !meta.performanceTestWeekId)
        );
      }
    );

    if (perfSessions.length >= 3) {
      const mapped = perfSessions.map((s) => {
        const meta = (s.metadata ?? {}) as Record<string, unknown>;
        const versionRaw = meta.performanceTestingVersion;
        const versionNum =
          typeof versionRaw === "number"
            ? versionRaw
            : typeof versionRaw === "string" && versionRaw.trim()
              ? Number(versionRaw)
              : null;
        return {
          id: s.id,
          dayOfWeek: s.day_of_week,
          sessionSlot: s.session_slot,
          sessionName: s.session_name,
          testType: String(meta.performanceTestType ?? ""),
          testWeekId: String(meta.performanceTestWeekId ?? testWeekId),
          performanceTestingVersion: Number.isFinite(versionNum) ? versionNum : null,
          prescription: (s.prescription as Record<string, unknown> | null) ?? null,
        };
      });
      return {
        programmeWeekId: week.id,
        sessions: mapped,
      };
    }
  }

  return { programmeWeekId: null, sessions: [] };
}

export async function fetchPerformanceTestResults(
  supabase: SupabaseClient,
  athleteId: string,
  testWeekId: string
): Promise<PerformanceTestResultRow[]> {
  const { data, error } = await supabase
    .from("hyrox_performance_test_results")
    .select(PERFORMANCE_TEST_RESULT_SELECT)
    .eq("athlete_id", athleteId)
    .eq("test_week_id", testWeekId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as PerformanceTestResultRow[];
}

export async function fetchRecoveryBaseline(
  supabase: SupabaseClient,
  athleteId: string,
  testWeekId: string
): Promise<RecoveryBaselineRow | null> {
  const { data, error } = await supabase
    .from("hyrox_athlete_recovery_baselines")
    .select(RECOVERY_BASELINE_SELECT)
    .eq("athlete_id", athleteId)
    .eq("test_week_id", testWeekId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as RecoveryBaselineRow | null) ?? null;
}

export async function buildAthletePerformanceTestingPayload(
  supabase: SupabaseClient,
  athlete: HyroxAthleteRow,
  testWeekId: string = PERFORMANCE_TEST_WEEK_ID
): Promise<AthletePerformanceTestingPayload> {
  const [weekInfo, results, baseline] = await Promise.all([
    findPublishedPerformanceTestingWeek(supabase, athlete.id, testWeekId),
    fetchPerformanceTestResults(supabase, athlete.id, testWeekId),
    fetchRecoveryBaseline(supabase, athlete.id, testWeekId),
  ]);

  const submitted = results.filter((r) => r.status === "submitted" || r.status === "reviewed");
  const reviewed = results.filter((r) => r.coach_reviewed || r.status === "reviewed");
  const performanceTestingVersion = detectPerformanceTestingVersion({
    sessionTestTypes: weekInfo.sessions.map((s) => s.testType),
    metadataVersions: weekInfo.sessions.map((s) => s.performanceTestingVersion),
  });
  const requiredTypes = requiredPerformanceTestTypesForVersion(performanceTestingVersion);
  const submittedRequired = submitted.filter((r) =>
    requiredTypes.includes(r.test_type as PerformanceTestType)
  );

  return {
    testWeekId,
    programmeWeekId: weekInfo.programmeWeekId,
    weekLabel: "Test Week 1",
    performanceTestingVersion,
    isLegacyProtocol: performanceTestingVersion === 1,
    sessions: weekInfo.sessions,
    results,
    baseline,
    profile: buildHyroxPerformanceProfile(results, baseline, performanceTestingVersion),
    completion: {
      submitted: submittedRequired.length,
      total: requiredTypes.length,
      reviewed: reviewed.filter((r) => requiredTypes.includes(r.test_type as PerformanceTestType))
        .length,
    },
  };
}

export type UpsertPerformanceTestInput = {
  testWeekId: string;
  programmeWeekId?: string | null;
  testType: PerformanceTestType;
  status: PerformanceTestStatus;
  resultJson: Record<string, unknown>;
  notes?: string | null;
  videoUrl?: string | null;
  proofUrl?: string | null;
  testDate?: string | null;
};

export async function upsertPerformanceTestResult(
  supabase: SupabaseClient,
  athleteId: string,
  input: UpsertPerformanceTestInput
): Promise<PerformanceTestResultRow> {
  const existing = await supabase
    .from("hyrox_performance_test_results")
    .select("id, status, coach_reviewed")
    .eq("athlete_id", athleteId)
    .eq("test_week_id", input.testWeekId)
    .eq("test_type", input.testType)
    .maybeSingle();

  if (existing.error) throw new Error(existing.error.message);

  const row = existing.data as { id: string; status: string; coach_reviewed: boolean } | null;
  if (row?.coach_reviewed && input.status !== "reviewed") {
    throw new Error("This result has been coach-reviewed and cannot be edited.");
  }

  if (input.status === "submitted") {
    const validation = validatePerformanceTestResult(input.testType, input.resultJson);
    if (!validation.valid) {
      throw new Error(validation.errors.join(" "));
    }
  }

  const payload = {
    athlete_id: athleteId,
    programme_week_id: input.programmeWeekId ?? null,
    test_week_id: input.testWeekId,
    test_type: input.testType,
    test_date: input.testDate ?? new Date().toISOString().slice(0, 10),
    status: input.status,
    result_json: input.resultJson,
    notes: input.notes ?? null,
    video_url: input.videoUrl ?? null,
    proof_url: input.proofUrl ?? null,
    updated_at: new Date().toISOString(),
  };

  if (row?.id) {
    const { data, error } = await supabase
      .from("hyrox_performance_test_results")
      .update(payload)
      .eq("id", row.id)
      .select(PERFORMANCE_TEST_RESULT_SELECT)
      .single();
    if (error) throw new Error(error.message);
    return data as PerformanceTestResultRow;
  }

  const { data, error } = await supabase
    .from("hyrox_performance_test_results")
    .insert({ ...payload, status: input.status === "not_started" ? "draft" : input.status })
    .select(PERFORMANCE_TEST_RESULT_SELECT)
    .single();

  if (error) throw new Error(error.message);
  return data as PerformanceTestResultRow;
}

export type UpsertRecoveryBaselineInput = {
  testWeekId: string;
  restingHrBaseline: number;
  baselineDays: number;
  averageHrv?: number | null;
  averageSleepMinutes?: number | null;
  averageDailySteps?: number | null;
  averageTrainingHours?: number | null;
  deviceSource?: string | null;
  notes?: string | null;
};

export async function upsertRecoveryBaseline(
  supabase: SupabaseClient,
  athleteId: string,
  input: UpsertRecoveryBaselineInput
): Promise<RecoveryBaselineRow> {
  if (!Number.isFinite(input.restingHrBaseline) || input.restingHrBaseline <= 0) {
    throw new Error("Average resting HR is required.");
  }
  if (!Number.isFinite(input.baselineDays) || input.baselineDays < 7 || input.baselineDays > 10) {
    throw new Error("Baseline days must be between 7 and 10.");
  }

  const payload = {
    athlete_id: athleteId,
    test_week_id: input.testWeekId,
    resting_hr_baseline: Math.round(input.restingHrBaseline),
    baseline_days: Math.round(input.baselineDays),
    average_hrv: input.averageHrv ?? null,
    average_sleep_minutes: input.averageSleepMinutes ?? null,
    average_daily_steps: input.averageDailySteps ?? null,
    average_training_hours: input.averageTrainingHours ?? null,
    device_source: input.deviceSource?.trim() || null,
    notes: input.notes?.trim() || null,
    updated_at: new Date().toISOString(),
  };

  const { data: existing, error: existingError } = await supabase
    .from("hyrox_athlete_recovery_baselines")
    .select("id")
    .eq("athlete_id", athleteId)
    .eq("test_week_id", input.testWeekId)
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);

  if (existing?.id) {
    const { data, error } = await supabase
      .from("hyrox_athlete_recovery_baselines")
      .update(payload)
      .eq("id", existing.id)
      .select(RECOVERY_BASELINE_SELECT)
      .single();
    if (error) throw new Error(error.message);
    return data as RecoveryBaselineRow;
  }

  const { data, error } = await supabase
    .from("hyrox_athlete_recovery_baselines")
    .insert(payload)
    .select(RECOVERY_BASELINE_SELECT)
    .single();

  if (error) throw new Error(error.message);
  return data as RecoveryBaselineRow;
}

export type CoachReviewPerformanceTestInput = {
  resultId: string;
  coachReviewed: boolean;
  coachNotes?: string | null;
  reopen?: boolean;
};

export async function coachReviewPerformanceTestResult(
  supabase: SupabaseClient,
  athleteId: string,
  input: CoachReviewPerformanceTestInput
): Promise<PerformanceTestResultRow> {
  const { data: row, error: fetchError } = await supabase
    .from("hyrox_performance_test_results")
    .select(PERFORMANCE_TEST_RESULT_SELECT)
    .eq("id", input.resultId)
    .eq("athlete_id", athleteId)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!row) throw new Error("Result not found.");

  const update = {
    coach_reviewed: input.reopen ? false : input.coachReviewed,
    coach_notes: input.coachNotes ?? (row as PerformanceTestResultRow).coach_notes,
    status: input.reopen
      ? "submitted"
      : input.coachReviewed
        ? "reviewed"
        : (row as PerformanceTestResultRow).status,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("hyrox_performance_test_results")
    .update(update)
    .eq("id", input.resultId)
    .select(PERFORMANCE_TEST_RESULT_SELECT)
    .single();

  if (error) throw new Error(error.message);
  return data as PerformanceTestResultRow;
}

export { isPerformanceTestSession };
