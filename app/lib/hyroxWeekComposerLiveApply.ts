/**
 * Persist Week Composer proposals into real programme DRAFT weeks.
 * Never publishes. Never mutates published history or athlete current_week.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getHyroxAthletePerformanceProfile } from "@/app/lib/hyroxAthleteBenchmarkServer";
import type { CoachAthlete } from "@/app/lib/hyroxCoachMockAthletes";
import type { CoachDraftWeek } from "@/app/lib/hyroxCoachProgrammeDraft";
import {
  computeWeeklySummary,
  parseCoachDraftWeekJson,
  validateCoachDraft,
} from "@/app/lib/hyroxCoachProgrammeDraft";
import type { HyroxAthleteRow, HyroxJson } from "@/app/lib/hyroxDatabaseTypes";
import { buildCoachAthleteStubFromLiveRow } from "@/app/lib/hyroxLiveCoachAthlete";
import { applyWeekProposalToDraft } from "@/app/lib/hyroxWeekComposerApply";
import type { WeekProposal } from "@/app/lib/hyroxWeekComposerTypes";
import {
  ensureProgrammeDraftWeekExists,
  fetchLatestDraftForGlobalWeek,
} from "@/app/lib/hyroxSessionFamilyEnsureDraft";
import { buildEmptyCoachDraftWeekShell } from "@/app/lib/hyroxSessionFamilyApply";

export type ComposerLiveApplyResult = {
  ok: true;
  draftId: string;
  draftWeek: CoachDraftWeek;
  targetWeekNumber: number;
  sourceWeekNumber: number;
  appliedProposalIds: string[];
  skippedProposalIds: string[];
  createdDraft: boolean;
  published: false;
  autoApplyForbidden: true;
  decisionAuthority: "coach";
  openProgrammeBuilderWeek: number;
  message: string;
};

/**
 * Load source week draft (or empty shell), apply proposal into target week draft, persist.
 * Idempotent on target week row (reuse latest non-archived draft for that week_number).
 */
export async function applyWeekProposalToLiveDraft(args: {
  supabase: SupabaseClient;
  athlete: HyroxAthleteRow;
  proposal: WeekProposal;
  acceptedProposalIds?: string[];
  rejectedProposalIds?: string[];
  /** Optional: explicit source draft body from client; else loaded from DB */
  sourceDraftOverride?: CoachDraftWeek | null;
  mappedProfileId?: string | null;
}): Promise<ComposerLiveApplyResult> {
  const { supabase, athlete, proposal } = args;
  const coachAthlete: CoachAthlete = buildCoachAthleteStubFromLiveRow(athlete, {
    hasAssessment: false,
    hasTesting: false,
  });
  const targetWeek = proposal.targetWeekNumber;
  const sourceWeek = proposal.sourceWeekNumber;

  let sourceDraft = args.sourceDraftOverride ?? null;
  if (!sourceDraft) {
    const sourceRow = await fetchLatestDraftForGlobalWeek(supabase, athlete.id, sourceWeek);
    sourceDraft = sourceRow ? parseCoachDraftWeekJson(sourceRow.draft_data) : null;
  }
  if (!sourceDraft) {
    sourceDraft = buildEmptyCoachDraftWeekShell({
      athleteId: athlete.id,
      globalWeek: sourceWeek,
    });
  }

  const { profile } = await getHyroxAthletePerformanceProfile(supabase, athlete.id);
  const applied = applyWeekProposalToDraft({
    sourceDraft,
    request: {
      proposal,
      acceptedProposalIds: args.acceptedProposalIds,
      rejectedProposalIds: args.rejectedProposalIds,
    },
    profile,
  });

  const draftWeek = applied.draftWeek;
  const summary = computeWeeklySummary(draftWeek, coachAthlete);
  const validation = validateCoachDraft(draftWeek, coachAthlete);
  const validationPayload = {
    warnings: validation.warnings,
    positives: validation.positives,
    weekComposerApply: true,
    appliedProposalIds: applied.appliedProposalIds,
    skippedProposalIds: applied.skippedProposalIds,
  } as unknown as HyroxJson;

  const existing = await fetchLatestDraftForGlobalWeek(supabase, athlete.id, targetWeek);
  const existingIsPublished =
    Boolean(existing?.published_at) || existing?.status === "published";

  let draftId: string;
  let createdDraft: boolean;

  if (existing && !existingIsPublished) {
    const { data, error } = await supabase
      .from("hyrox_programme_drafts")
      .update({
        draft_data: draftWeek as unknown as HyroxJson,
        weekly_summary: summary as unknown as HyroxJson,
        validation_warnings: validationPayload,
        status: "edited",
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .is("published_at", null)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    draftId = (data as { id: string }).id;
    createdDraft = false;
  } else {
    // No draft, or only a published row exists — insert a new unpublished draft.
    // Never overwrite published history.
    const ensured = await ensureProgrammeDraftWeekExists(supabase, {
      athleteId: athlete.id,
      athlete: coachAthlete,
      globalWeek: targetWeek,
      mappedProfileId: args.mappedProfileId ?? null,
      coachNote: "Week Composer draft apply",
      athleteFacingNote: "",
    });
    if (ensured.draft.published_at || ensured.draft.status === "published") {
      // ensure returned published row (edge) — force insert sibling draft
      const { data, error } = await supabase
        .from("hyrox_programme_drafts")
        .insert({
          athlete_id: athlete.id,
          mapped_profile_id: args.mappedProfileId ?? null,
          block_number: draftWeek.block,
          week_number: targetWeek,
          draft_data: draftWeek as unknown as HyroxJson,
          weekly_summary: summary as unknown as HyroxJson,
          validation_warnings: validationPayload,
          coach_note: "Week Composer draft apply",
          athlete_facing_note: "",
          status: "edited",
          published_at: null,
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      draftId = (data as { id: string }).id;
      createdDraft = true;
    } else {
      const { data, error } = await supabase
        .from("hyrox_programme_drafts")
        .update({
          draft_data: draftWeek as unknown as HyroxJson,
          weekly_summary: summary as unknown as HyroxJson,
          validation_warnings: validationPayload,
          status: "edited",
          updated_at: new Date().toISOString(),
        })
        .eq("id", ensured.draft.id)
        .is("published_at", null)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      draftId = (data as { id: string }).id;
      createdDraft = ensured.created;
    }
  }

  return {
    ok: true,
    draftId,
    draftWeek,
    targetWeekNumber: targetWeek,
    sourceWeekNumber: sourceWeek,
    appliedProposalIds: applied.appliedProposalIds,
    skippedProposalIds: applied.skippedProposalIds,
    createdDraft,
    published: false,
    autoApplyForbidden: true,
    decisionAuthority: "coach",
    openProgrammeBuilderWeek: targetWeek,
    message: `Applied ${applied.appliedProposalIds.length} session(s) to DRAFT week ${targetWeek}. Publish separately in Programme Builder.`,
  };
}
