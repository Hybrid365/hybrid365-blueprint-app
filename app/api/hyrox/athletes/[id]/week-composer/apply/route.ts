import { NextResponse } from "next/server";
import { requireHyroxCoachApi } from "@/app/lib/hyroxApiAuth";
import { fetchHyroxAthleteById } from "@/app/lib/hyroxAthleteCoachDb";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";
import type { CoachDraftWeek } from "@/app/lib/hyroxCoachProgrammeDraft";
import { isHyroxWeekComposerEnabled } from "@/app/lib/hyroxWeekComposerFlag";
import { applyWeekProposalToLiveDraft } from "@/app/lib/hyroxWeekComposerLiveApply";
import type { WeekProposal } from "@/app/lib/hyroxWeekComposerTypes";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Apply proposal → real programme DRAFT week (persist).
 * Never publishes. Never mutates published history / current_week.
 */
export async function POST(request: Request, context: RouteContext) {
  const auth = await requireHyroxCoachApi();
  if (auth.error) return auth.error;

  const { id: athleteId } = await context.params;
  if (!isHyroxWeekComposerEnabled({ id: athleteId })) {
    return NextResponse.json(
      { success: false, error: "Week Composer is not enabled for this athlete." },
      { status: 403 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    proposal?: WeekProposal;
    sourceDraft?: CoachDraftWeek;
    acceptedProposalIds?: string[];
    rejectedProposalIds?: string[];
    persist?: boolean;
  };

  if (!body.proposal) {
    return NextResponse.json(
      { success: false, error: "proposal is required." },
      { status: 400 }
    );
  }

  if (body.proposal.athleteId !== athleteId) {
    return NextResponse.json(
      { success: false, error: "Proposal athlete mismatch." },
      { status: 400 }
    );
  }

  const { client: supabase } = await createCoachServerClient();
  const { athlete, error: athleteError } = await fetchHyroxAthleteById(supabase, athleteId);
  if (athleteError || !athlete) {
    return NextResponse.json(
      { success: false, error: athleteError ?? "Athlete not found." },
      { status: athleteError ? 500 : 404 }
    );
  }

  try {
    const result = await applyWeekProposalToLiveDraft({
      supabase,
      athlete,
      proposal: body.proposal,
      acceptedProposalIds: body.acceptedProposalIds,
      rejectedProposalIds: body.rejectedProposalIds,
      sourceDraftOverride: body.sourceDraft ?? null,
      mappedProfileId: null,
    });

    return NextResponse.json({
      success: true,
      draftId: result.draftId,
      draftWeek: result.draftWeek,
      targetWeekNumber: result.targetWeekNumber,
      appliedProposalIds: result.appliedProposalIds,
      skippedProposalIds: result.skippedProposalIds,
      createdDraft: result.createdDraft,
      published: false,
      autoApplyForbidden: true,
      decisionAuthority: "coach",
      openProgrammeBuilderWeek: result.openProgrammeBuilderWeek,
      message: result.message,
    });
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        error: e instanceof Error ? e.message : "Could not apply proposal to draft.",
      },
      { status: 500 }
    );
  }
}
