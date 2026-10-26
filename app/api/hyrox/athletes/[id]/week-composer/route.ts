import { NextResponse } from "next/server";
import { requireHyroxCoachApi } from "@/app/lib/hyroxApiAuth";
import { fetchHyroxAthleteById } from "@/app/lib/hyroxAthleteCoachDb";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";
import { isHyroxWeekComposerEnabled } from "@/app/lib/hyroxWeekComposerFlag";
import { createWeekComposerInstruction } from "@/app/lib/hyroxWeekComposerInstruction";
import type { WeekComposerStructuredInstruction } from "@/app/lib/hyroxWeekComposerTypes";
import { WEEK_COMPOSER_MODES } from "@/app/lib/hyroxWeekComposerTypes";
import {
  buildProposalFromContext,
  loadWeekComposerContext,
} from "@/app/lib/hyroxWeekComposerServer";

type RouteContext = { params: Promise<{ id: string }> };

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
    mode?: string;
    sourceWeekNumber?: number;
    freeText?: string;
    structured?: Partial<WeekComposerStructuredInstruction>;
  };

  const mode = WEEK_COMPOSER_MODES.includes(body.mode as (typeof WEEK_COMPOSER_MODES)[number])
    ? (body.mode as (typeof WEEK_COMPOSER_MODES)[number])
    : "next_week";
  const sourceWeekNumber =
    typeof body.sourceWeekNumber === "number" && body.sourceWeekNumber >= 1
      ? body.sourceWeekNumber
      : 1;

  const { client: supabase } = await createCoachServerClient();
  const { athlete, error: athleteError } = await fetchHyroxAthleteById(supabase, athleteId);
  if (athleteError || !athlete) {
    return NextResponse.json(
      { success: false, error: athleteError ?? "Athlete not found." },
      { status: athleteError ? 500 : 404 }
    );
  }

  const instruction = createWeekComposerInstruction(body.freeText ?? "", body.structured);
  const { context: composerContext } = await loadWeekComposerContext({
    supabase,
    athlete,
    mode,
    sourceWeekNumber,
    instruction,
  });
  const proposal = buildProposalFromContext(composerContext);

  return NextResponse.json({
    success: true,
    contextSummary: {
      athleteId: composerContext.athlete.id,
      mode: composerContext.mode,
      sourceWeek: composerContext.sourceWeek.weekNumber,
      targetWeek: composerContext.athlete.targetWeek,
      anchorsPresent: composerContext.anchors.filter((a) => a.present).map((a) => a.key),
      painFlags: composerContext.weekly.painFlags.length,
      decisionAuthority: composerContext.decisionAuthority,
    },
    proposal,
  });
}
