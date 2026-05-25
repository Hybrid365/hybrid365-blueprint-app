import type { SupabaseClient } from "@supabase/supabase-js";
import { mergeProfileIntoCoachAthlete } from "@/app/lib/hyroxAssessmentMapping";
import type { CoachAthlete } from "@/app/lib/hyroxCoachMockAthletes";
import { buildCoachAthleteStubFromLiveRow } from "@/app/lib/hyroxLiveCoachAthlete";
import type { HyroxAthleteProfile } from "@/app/lib/hyroxAthleteProfileTypes";
import { fetchAthleteProgressFlags } from "@/app/lib/hyroxAthleteServer";
import {
  type BlockReviewGenerationContext,
  type BlockReviewGenerationPlan,
  buildCoachNotesFromBlockReview,
  generateBlockDraftWeeksFromReview,
  generateRetestWeekDraftFromReview,
  resolveNextBlockGenerationPlan,
} from "@/app/lib/hyroxBlockReviewGeneration";
import {
  fetchHyroxBlockReview,
  loadBlockReviewForCoach,
} from "@/app/lib/hyroxBlockReviewServer";
import {
  parseCoachNotesJson,
  type HyroxBlockReviewNextRecommendation,
} from "@/app/lib/hyroxBlockReview";
import type { CoachDraftWeek } from "@/app/lib/hyroxCoachProgrammeDraft";
import type { HyroxAthleteRow, HyroxProgrammeDraftRow } from "@/app/lib/hyroxDatabaseTypes";
import type { ProgrammeLengthWeeks } from "@/app/lib/hyroxProgrammeDates";
import {
  fetchBlockProgrammeDrafts,
  fetchLatestMappedProfile,
  insertProgrammeDraft,
  updateProgrammeDraft,
} from "@/app/lib/hyroxProgrammeServer";

export type GeneratedWeekResult = {
  globalWeek: number;
  cycle: number;
  draftId: string | null;
  sessionCount: number;
  action: "created" | "updated" | "skipped";
  skipReason?: string;
};

export type GenerateNextBlockResult = {
  plan: BlockReviewGenerationPlan;
  weeks: GeneratedWeekResult[];
  nextBlockNumber: number | null;
  message: string;
};

async function fetchPublishedGlobalWeeks(
  supabase: SupabaseClient,
  athleteId: string,
  weekNumbers: number[]
): Promise<Set<number>> {
  if (!weekNumbers.length) return new Set();
  const { data } = await supabase
    .from("hyrox_programme_weeks")
    .select("week_number")
    .eq("athlete_id", athleteId)
    .eq("status", "published")
    .in("week_number", weekNumbers);
  return new Set((data ?? []).map((r) => r.week_number as number));
}

function latestDraftByGlobalWeek(
  rows: HyroxProgrammeDraftRow[]
): Map<number, HyroxProgrammeDraftRow> {
  const sorted = [...rows].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
  const map = new Map<number, HyroxProgrammeDraftRow>();
  for (const row of sorted) {
    if (!map.has(row.week_number)) {
      map.set(row.week_number, row);
    }
  }
  return map;
}

async function persistGeneratedDrafts(
  supabase: SupabaseClient,
  params: {
    athlete: CoachAthlete;
    athleteRow: HyroxAthleteRow;
    mappedProfileId: string | null;
    targetBlock: number;
    drafts: CoachDraftWeek[];
    coachNote: string;
    athleteFacingNote: string;
    changedBy: string | null;
  }
): Promise<GeneratedWeekResult[]> {
  const weekNumbers = params.drafts.map((d) => d.week);
  const publishedWeeks = await fetchPublishedGlobalWeeks(
    supabase,
    params.athleteRow.id,
    weekNumbers
  );
  const existingRows = await fetchBlockProgrammeDrafts(
    supabase,
    params.athleteRow.id,
    params.targetBlock
  );
  const existingByWeek = latestDraftByGlobalWeek(existingRows);

  const results: GeneratedWeekResult[] = [];

  for (const draft of params.drafts) {
    const cycle = (((draft.week - 1) % 4) + 1) as 1 | 2 | 3 | 4;
    const sessionCount = draft.days.reduce((n, d) => n + d.sessions.length, 0);

    if (publishedWeeks.has(draft.week)) {
      results.push({
        globalWeek: draft.week,
        cycle,
        draftId: existingByWeek.get(draft.week)?.id ?? null,
        sessionCount,
        action: "skipped",
        skipReason: "Week already published to athlete — not modified.",
      });
      continue;
    }

    const existing = existingByWeek.get(draft.week);
    if (existing?.status === "published") {
      results.push({
        globalWeek: draft.week,
        cycle,
        draftId: existing.id,
        sessionCount,
        action: "skipped",
        skipReason: "Draft already published — not modified.",
      });
      continue;
    }

    if (existing) {
      const updated = await updateProgrammeDraft(supabase, {
        draftId: existing.id,
        athlete: params.athlete,
        athleteRow: params.athleteRow,
        draft,
        coachNote: params.coachNote,
        athleteFacingNote: params.athleteFacingNote,
        coachStatus: "generated_draft",
        changedBy: params.changedBy,
      });
      results.push({
        globalWeek: draft.week,
        cycle,
        draftId: updated.id,
        sessionCount,
        action: "updated",
      });
      continue;
    }

    const created = await insertProgrammeDraft(supabase, {
      athlete: params.athlete,
      athleteRow: params.athleteRow,
      mappedProfileId: params.mappedProfileId,
      draft,
      coachNote: params.coachNote,
      athleteFacingNote: params.athleteFacingNote,
      changedBy: params.changedBy,
    });
    results.push({
      globalWeek: draft.week,
      cycle,
      draftId: created.id,
      sessionCount,
      action: "created",
    });
  }

  return results;
}

export async function generateNextBlockFromSavedReview(
  supabase: SupabaseClient,
  params: {
    athleteRow: HyroxAthleteRow;
    reviewedBlockNumber: number;
    effectiveProfile: HyroxAthleteProfile;
    changedBy: string | null;
    forceRetestWeek?: boolean;
  }
): Promise<GenerateNextBlockResult> {
  const programmeLengthWeeks = (params.athleteRow.programme_length_weeks === 16
    ? 16
    : 12) as ProgrammeLengthWeeks;

  const savedReview = await fetchHyroxBlockReview(
    supabase,
    params.athleteRow.id,
    params.reviewedBlockNumber
  );

  if (!savedReview) {
    throw new Error(
      `Save a Block ${params.reviewedBlockNumber} review before generating the next block.`
    );
  }

  const recommendation =
    (savedReview.next_block_recommendation as HyroxBlockReviewNextRecommendation | null) ??
    "progress_as_planned";

  const plan = resolveNextBlockGenerationPlan({
    reviewedBlockNumber: params.reviewedBlockNumber,
    programmeLengthWeeks,
    recommendation: params.forceRetestWeek ? "retest_recalibrate" : recommendation,
  });

  if (plan.kind === "unavailable") {
    return { plan, weeks: [], nextBlockNumber: null, message: plan.message };
  }

  const flags = await fetchAthleteProgressFlags(supabase, params.athleteRow.id);
  const stub = buildCoachAthleteStubFromLiveRow(params.athleteRow, flags);
  const coachAthlete = mergeProfileIntoCoachAthlete(stub, params.effectiveProfile);
  const mappedProfile = await fetchLatestMappedProfile(supabase, params.athleteRow.id);

  const { summary } = await loadBlockReviewForCoach(
    supabase,
    params.athleteRow,
    params.reviewedBlockNumber
  );

  const genCtx: BlockReviewGenerationContext = {
    reviewedBlockNumber: params.reviewedBlockNumber,
    recommendation,
    nextBlockFocus: savedReview.next_block_focus,
    coachNotes: parseCoachNotesJson(savedReview.coach_notes),
    completionSummary: summary,
    effectiveProfile: params.effectiveProfile,
    raceDate: params.athleteRow.race_date,
    raceName: params.athleteRow.race_name,
  };

  const notes = buildCoachNotesFromBlockReview(genCtx);

  if (plan.kind === "retest_week") {
    const draft = generateRetestWeekDraftFromReview(
      coachAthlete,
      genCtx,
      plan.globalWeekNumber
    );
    const weeks = await persistGeneratedDrafts(supabase, {
      athlete: coachAthlete,
      athleteRow: params.athleteRow,
      mappedProfileId: mappedProfile?.id ?? null,
      targetBlock: 3,
      drafts: [draft],
      coachNote: notes.coachNote,
      athleteFacingNote: notes.athleteFacingNote,
      changedBy: params.changedBy,
    });

    return {
      plan,
      weeks,
      nextBlockNumber: 3,
      message:
        weeks[0]?.action === "skipped"
          ? `Week ${plan.globalWeekNumber} was not changed (${weeks[0]?.skipReason}).`
          : `Retest-focused draft for Week ${plan.globalWeekNumber} is ready in Programme Builder.`,
    };
  }

  const drafts = generateBlockDraftWeeksFromReview(coachAthlete, genCtx, plan);
  const weeks = await persistGeneratedDrafts(supabase, {
    athlete: coachAthlete,
    athleteRow: params.athleteRow,
    mappedProfileId: mappedProfile?.id ?? null,
    targetBlock: plan.nextBlockNumber,
    drafts,
    coachNote: notes.coachNote,
    athleteFacingNote: notes.athleteFacingNote,
    changedBy: params.changedBy,
  });

  await supabase
    .from("hyrox_athletes")
    .update({
      current_block: plan.nextBlockNumber,
      current_programme_block: plan.nextBlockNumber,
      programme_status: "draft_generated",
      status:
        params.athleteRow.status === "programme_published"
          ? "programme_published"
          : "draft_generated",
    })
    .eq("id", params.athleteRow.id);

  const created = weeks.filter((w) => w.action !== "skipped").length;
  const skipped = weeks.filter((w) => w.action === "skipped").length;

  return {
    plan,
    weeks,
    nextBlockNumber: plan.nextBlockNumber,
    message: `Generated Block ${plan.nextBlockNumber} (W${plan.weeksStart}–${plan.weeksEnd}): ${created} week draft(s)${skipped ? `, ${skipped} skipped (already published)` : ""}. Open Programme Builder to review.`,
  };
}

export function parseStoredCoachNotes(raw: unknown) {
  return typeof raw === "object" && raw !== null && !Array.isArray(raw)
    ? (raw as BlockReviewGenerationContext["coachNotes"])
    : {};
}
