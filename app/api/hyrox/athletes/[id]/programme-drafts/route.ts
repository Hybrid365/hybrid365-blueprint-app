import { NextResponse } from "next/server";
import { requireHyroxCoachApi } from "@/app/lib/hyroxApiAuth";
import { fetchHyroxAthleteById } from "@/app/lib/hyroxAthleteCoachDb";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";
import { globalWeekForBlock, BLOCK_WEEK_FOCUS_LABELS } from "@/app/lib/hyroxCoachProgrammeDraft";
import { draftDbToCoachStatus } from "@/app/lib/hyroxCoachProgrammeStatusMap";
import {
  fetchBlockProgrammeDrafts,
  parseCoachDraftWeek,
} from "@/app/lib/hyroxProgrammeServer";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireHyroxCoachApi();
  if (auth.error) return auth.error;

  const { id: athleteId } = await context.params;
  const { client: supabase } = await createCoachServerClient();

  const { athlete, error: athleteError } = await fetchHyroxAthleteById(supabase, athleteId);
  if (athleteError) {
    return NextResponse.json({ success: false, error: athleteError }, { status: 500 });
  }
  if (!athlete) {
    return NextResponse.json({ success: false, error: "Athlete not found." }, { status: 404 });
  }

  const blockNumber = athlete.current_block ?? 1;

  try {
    const rows = await fetchBlockProgrammeDrafts(supabase, athleteId, blockNumber);
    const byWeek = new Map(rows.map((r) => [r.week_number, r]));

    const weeks = ([1, 2, 3, 4] as const).map((cycle) => {
      const globalWeek = globalWeekForBlock(blockNumber as 1 | 2 | 3, cycle);
      const row = byWeek.get(globalWeek) ?? null;
      const draftData = row ? parseCoachDraftWeek(row.draft_data) : null;
      const sessionCount = draftData?.days.reduce((n, d) => n + d.sessions.length, 0) ?? 0;

      return {
        cycle,
        globalWeek,
        role: BLOCK_WEEK_FOCUS_LABELS[cycle],
        draftId: row?.id ?? null,
        dbStatus: row?.status ?? null,
        coachStatus: row ? draftDbToCoachStatus(row.status) : null,
        draftData,
        generated: Boolean(row && sessionCount > 0),
        sessionCount,
        published: row?.status === "published",
        approved: row?.status === "approved" || row?.status === "published",
      };
    });

    return NextResponse.json({
      success: true,
      blockNumber,
      weeks,
      drafts: rows,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not load block drafts.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
