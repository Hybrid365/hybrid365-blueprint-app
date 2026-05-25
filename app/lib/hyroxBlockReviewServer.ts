import type { SupabaseClient } from "@supabase/supabase-js";
import { parseHyroxAthleteSessionFeedback } from "@/app/lib/hyroxAthleteSessionFeedback";
import {
  blockMetaForReview,
  blockWeekRange,
  type BlockReviewCompletionSummary,
  type HyroxBlockReviewCoachNotes,
  type HyroxBlockReviewNextRecommendation,
  type HyroxBlockReviewRecord,
  isHighLoggedRpe,
  isKeyProgrammeSession,
  parseCoachNotesJson,
  parseLoggedRpe,
} from "@/app/lib/hyroxBlockReview";
import type {
  HyroxAthleteRow,
  HyroxBlockReviewRow,
  HyroxJson,
  HyroxProgrammeSessionRow,
  HyroxProgrammeWeekRow,
} from "@/app/lib/hyroxDatabaseTypes";
import type { ProgrammeLengthWeeks } from "@/app/lib/hyroxProgrammeDates";

const REVIEW_SELECT =
  "id, athlete_id, block_number, weeks_start, weeks_end, completion_summary, coach_notes, next_block_recommendation, next_block_focus, created_at, updated_at";

const WEEK_SELECT =
  "id, athlete_id, block_number, week_number, week_start_date, week_end_date, weekly_focus, status, published_at";

const SESSION_SELECT =
  "id, programme_week_id, athlete_id, day_of_week, session_slot, session_name, category, metadata, status, completed_at, athlete_feedback";

function testingResultSummary(result: HyroxJson): string {
  if (!result || typeof result !== "object") return "—";
  const o = result as Record<string, unknown>;
  if (typeof o.time === "string") return o.time;
  if (typeof o.value === "string") return o.value;
  if (typeof o.distance === "string") return o.distance;
  if (o.minutes != null && o.seconds != null) return `${o.minutes}:${o.seconds}`;
  try {
    const flat = Object.entries(o)
      .filter(([, v]) => typeof v === "string" || typeof v === "number")
      .slice(0, 3)
      .map(([k, v]) => `${k}: ${v}`)
      .join(" · ");
    return flat || "—";
  } catch {
    return "—";
  }
}

export async function buildBlockReviewCompletionSummary(
  supabase: SupabaseClient,
  athlete: HyroxAthleteRow,
  blockNumber: number
): Promise<BlockReviewCompletionSummary> {
  const programmeLengthWeeks = (athlete.programme_length_weeks === 16 ? 16 : 12) as ProgrammeLengthWeeks;
  const { weeksStart, weeksEnd, blockTitle, weekLabels } = blockMetaForReview(
    blockNumber,
    programmeLengthWeeks
  );
  const weekNumbers = Array.from(
    { length: weeksEnd - weeksStart + 1 },
    (_, i) => weeksStart + i
  );

  const [
    { data: weeks },
    { data: mappedProfile },
    { data: assessment },
    { data: checkIns },
    { data: testing },
  ] = await Promise.all([
    supabase
      .from("hyrox_programme_weeks")
      .select(WEEK_SELECT)
      .eq("athlete_id", athlete.id)
      .eq("status", "published")
      .in("week_number", weekNumbers)
      .order("week_number", { ascending: true }),
    supabase
      .from("hyrox_mapped_profiles")
      .select(
        "main_limiter, secondary_limiter, first_block_focus, recovery_risk, effective_profile, status"
      )
      .eq("athlete_id", athlete.id)
      .neq("status", "superseded")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("hyrox_assessments")
      .select("station_weaknesses, bodyweight")
      .eq("athlete_id", athlete.id)
      .not("submitted_at", "is", null)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("hyrox_check_ins")
      .select(
        "status, bodyweight, sleep, energy, stress, soreness, pain_niggles, biggest_struggle, week_number"
      )
      .eq("athlete_id", athlete.id)
      .in("week_number", weekNumbers)
      .order("submitted_at", { ascending: false }),
    supabase
      .from("hyrox_testing_results")
      .select("test_type, test_date, result, rpe, notes, created_at, status")
      .eq("athlete_id", athlete.id)
      .eq("status", "submitted")
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  const weekRows = (weeks as HyroxProgrammeWeekRow[] | null) ?? [];
  const weekIds = weekRows.map((w) => w.id);

  let sessionRows: HyroxProgrammeSessionRow[] = [];
  if (weekIds.length > 0) {
    const { data: sessions } = await supabase
      .from("hyrox_programme_sessions")
      .select(SESSION_SELECT)
      .in("programme_week_id", weekIds);
    sessionRows = (sessions as HyroxProgrammeSessionRow[] | null) ?? [];
  }

  const weekById = new Map(weekRows.map((w) => [w.id, w]));

  let sessionsCompleted = 0;
  let sessionsTotal = 0;
  let keySessionsCompleted = 0;
  let keySessionsTotal = 0;
  let missedSessions = 0;
  let sessionsWithNotes = 0;
  let sessionsWithModifications = 0;
  let highRpeSessionCount = 0;
  const rpeValues: number[] = [];
  const skippedKeyMissed: string[] = [];
  const highRpeSessions: BlockReviewCompletionSummary["highRpeSessions"] = [];
  const sessionsWithNotesList: BlockReviewCompletionSummary["sessionsWithNotesList"] = [];

  const weekStats = new Map<number, { completed: number; total: number; published: boolean }>();
  for (const wn of weekNumbers) {
    weekStats.set(wn, { completed: 0, total: 0, published: weekRows.some((w) => w.week_number === wn) });
  }

  for (const s of sessionRows) {
    const week = weekById.get(s.programme_week_id);
    const weekNumber = week?.week_number ?? 0;
    if (!weekNumber) continue;

    sessionsTotal += 1;
    const stats = weekStats.get(weekNumber);
    if (stats) stats.total += 1;

    const meta = (s.metadata ?? {}) as Record<string, unknown>;
    const isKey = isKeyProgrammeSession({
      metadata: meta,
      sessionSlot: s.session_slot,
      category: s.category,
    });
    if (isKey) keySessionsTotal += 1;

    const feedback = parseHyroxAthleteSessionFeedback(s.athlete_feedback);
    const rpe = parseLoggedRpe(feedback.rpe);
    if (rpe != null) rpeValues.push(rpe);

    const complete = s.status === "completed";
    if (complete) {
      sessionsCompleted += 1;
      if (stats) stats.completed += 1;
      if (isKey) keySessionsCompleted += 1;
    }

    if (s.status === "missed") missedSessions += 1;

    if (feedback.notes?.trim()) {
      sessionsWithNotes += 1;
      sessionsWithNotesList.push({
        sessionName: s.session_name,
        weekNumber,
        notePreview:
          feedback.notes.trim().slice(0, 80) + (feedback.notes.length > 80 ? "…" : ""),
      });
    }
    if (feedback.modifications?.trim()) sessionsWithModifications += 1;

    if (isHighLoggedRpe(rpe)) {
      highRpeSessionCount += 1;
      highRpeSessions.push({
        sessionName: s.session_name,
        weekNumber,
        dayOfWeek: s.day_of_week,
        rpe: rpe!,
      });
    }

    if (isKey && !complete && (s.status === "missed" || s.status === "scheduled")) {
      skippedKeyMissed.push(`W${weekNumber} ${s.day_of_week} · ${s.session_name}`);
    }
  }

  const checkInRows = checkIns ?? [];
  const submittedCheckIns = checkInRows.filter((c) => c.status === "submitted" || c.status === "reviewed");
  const avg = (vals: (number | null | undefined)[]) => {
    const nums = vals.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    if (!nums.length) return null;
    return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
  };

  const effective = (mappedProfile?.effective_profile ?? {}) as Record<string, unknown>;
  const stationFromAssessment = Array.isArray(assessment?.station_weaknesses)
    ? (assessment.station_weaknesses as string[])
    : [];

  return {
    blockNumber,
    weeksStart,
    weeksEnd,
    blockTitle,
    weekLabels,
    sessionsCompleted,
    sessionsTotal,
    keySessionsCompleted,
    keySessionsTotal,
    averageRpe: rpeValues.length
      ? Math.round((rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length) * 10) / 10
      : null,
    rpeSampleCount: rpeValues.length,
    missedSessions,
    sessionsWithNotes,
    sessionsWithModifications,
    highRpeSessionCount,
    skippedKeyMissed: skippedKeyMissed.slice(0, 8),
    highRpeSessions: highRpeSessions.slice(0, 6),
    sessionsWithNotesList: sessionsWithNotesList.slice(0, 6),
    weekBreakdown: weekNumbers.map((weekNumber) => {
      const s = weekStats.get(weekNumber) ?? { completed: 0, total: 0, published: false };
      return { weekNumber, ...s };
    }),
    checkIn: {
      count: checkInRows.length,
      submittedCount: submittedCheckIns.length,
      avgBodyweight: avg(submittedCheckIns.map((c) => c.bodyweight)),
      avgSleep: avg(submittedCheckIns.map((c) => c.sleep)),
      avgEnergy: avg(submittedCheckIns.map((c) => c.energy)),
      avgStress: avg(submittedCheckIns.map((c) => c.stress)),
      avgSoreness: avg(submittedCheckIns.map((c) => c.soreness)),
      painNiggles: submittedCheckIns
        .map((c) => c.pain_niggles?.trim())
        .filter((x): x is string => Boolean(x))
        .slice(0, 4),
      biggestStruggles: submittedCheckIns
        .map((c) => c.biggest_struggle?.trim())
        .filter((x): x is string => Boolean(x))
        .slice(0, 4),
    },
    testing: (testing ?? []).map((t) => ({
      testType: t.test_type,
      testDate: t.test_date,
      resultSummary: testingResultSummary(t.result as HyroxJson),
      rpe: t.rpe,
      notes: t.notes,
      createdAt: t.created_at,
    })),
    athleteContext: {
      mainLimiter: mappedProfile?.main_limiter ?? null,
      secondaryLimiter: mappedProfile?.secondary_limiter ?? null,
      firstBlockFocus: mappedProfile?.first_block_focus ?? null,
      recoveryRisk: mappedProfile?.recovery_risk ?? null,
      stationWeaknesses:
        stationFromAssessment.length > 0
          ? stationFromAssessment
          : typeof effective.stationWeaknesses === "object" && Array.isArray(effective.stationWeaknesses)
            ? (effective.stationWeaknesses as string[])
            : [],
      assessmentBodyweight:
        typeof assessment?.bodyweight === "number" ? assessment.bodyweight : null,
    },
    computedAt: new Date().toISOString(),
  };
}

function rowToRecord(row: HyroxBlockReviewRow): HyroxBlockReviewRecord {
  return {
    id: row.id,
    athleteId: row.athlete_id,
    blockNumber: row.block_number,
    weeksStart: row.weeks_start,
    weeksEnd: row.weeks_end,
    completionSummary: row.completion_summary as BlockReviewCompletionSummary,
    coachNotes: parseCoachNotesJson(row.coach_notes),
    nextBlockRecommendation: (row.next_block_recommendation as HyroxBlockReviewNextRecommendation) ?? null,
    nextBlockFocus: row.next_block_focus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchHyroxBlockReview(
  supabase: SupabaseClient,
  athleteId: string,
  blockNumber: number
): Promise<HyroxBlockReviewRow | null> {
  const { data, error } = await supabase
    .from("hyrox_block_reviews")
    .select(REVIEW_SELECT)
    .eq("athlete_id", athleteId)
    .eq("block_number", blockNumber)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as HyroxBlockReviewRow | null) ?? null;
}

export async function loadBlockReviewForCoach(
  supabase: SupabaseClient,
  athlete: HyroxAthleteRow,
  blockNumber: number
): Promise<{ summary: BlockReviewCompletionSummary; review: HyroxBlockReviewRecord | null }> {
  const summary = await buildBlockReviewCompletionSummary(supabase, athlete, blockNumber);
  const row = await fetchHyroxBlockReview(supabase, athlete.id, blockNumber);
  return { summary, review: row ? rowToRecord(row) : null };
}

export async function upsertHyroxBlockReview(
  supabase: SupabaseClient,
  params: {
    athlete: HyroxAthleteRow;
    blockNumber: number;
    coachNotes: HyroxBlockReviewCoachNotes;
    nextBlockRecommendation: HyroxBlockReviewNextRecommendation | null;
    nextBlockFocus: string | null;
    completionSummary: BlockReviewCompletionSummary;
  }
): Promise<HyroxBlockReviewRecord> {
  const { weeksStart, weeksEnd } = blockWeekRange(params.blockNumber);
  const now = new Date().toISOString();
  const payload = {
    athlete_id: params.athlete.id,
    block_number: params.blockNumber,
    weeks_start: weeksStart,
    weeks_end: weeksEnd,
    completion_summary: params.completionSummary as unknown as HyroxJson,
    coach_notes: params.coachNotes as unknown as HyroxJson,
    next_block_recommendation: params.nextBlockRecommendation,
    next_block_focus: params.nextBlockFocus?.trim() || null,
    updated_at: now,
  };

  const existing = await fetchHyroxBlockReview(supabase, params.athlete.id, params.blockNumber);

  if (existing) {
    const { data, error } = await supabase
      .from("hyrox_block_reviews")
      .update(payload)
      .eq("id", existing.id)
      .select(REVIEW_SELECT)
      .single();
    if (error) throw new Error(error.message);
    return rowToRecord(data as HyroxBlockReviewRow);
  }

  const { data, error } = await supabase
    .from("hyrox_block_reviews")
    .insert({ ...payload, created_at: now })
    .select(REVIEW_SELECT)
    .single();
  if (error) throw new Error(error.message);
  return rowToRecord(data as HyroxBlockReviewRow);
}
