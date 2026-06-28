import { NextResponse } from "next/server";
import { requireHyroxCoachApi } from "@/app/lib/hyroxApiAuth";
import { fetchHyroxAthleteById } from "@/app/lib/hyroxAthleteCoachDb";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";
import { globalWeekForBlock, BLOCK_WEEK_FOCUS_LABELS } from "@/app/lib/hyroxCoachProgrammeDraft";
import { draftDbToCoachStatus } from "@/app/lib/hyroxCoachProgrammeStatusMap";
import { deriveBlockSelectorStatus } from "@/app/lib/hyroxBlockProgrammeStatus";
import { blockWeekRange } from "@/app/lib/hyroxBlockReview";
import {
  fetchBlockProgrammeDrafts,
  fetchPublishedWeekCountForBlock,
  parseCoachDraftWeek,
} from "@/app/lib/hyroxProgrammeServer";
import type { HyroxProgrammeDraftRow } from "@/app/lib/hyroxDatabaseTypes";

type RouteContext = { params: Promise<{ id: string }> };

function buildWeeksMeta(blockNumber: number, rows: HyroxProgrammeDraftRow[]) {
  const byWeek = new Map(rows.map((r) => [r.week_number, r]));

  return ([1, 2, 3, 4] as const).map((cycle) => {
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
}

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireHyroxCoachApi();
  if (auth.error) return auth.error;

  const { id: athleteId } = await context.params;
  const { client: supabase } = await createCoachServerClient();
  const url = new URL(request.url);
  const blockParam = url.searchParams.get("block");
  const summaryAll = url.searchParams.get("summary") === "all";

  const { athlete, error: athleteError } = await fetchHyroxAthleteById(supabase, athleteId);
  if (athleteError) {
    return NextResponse.json({ success: false, error: athleteError }, { status: 500 });
  }
  if (!athlete) {
    return NextResponse.json({ success: false, error: "Athlete not found." }, { status: 404 });
  }

  const maxBlocks = athlete.programme_length_weeks === 16 ? 4 : 3;
  const defaultBlock = athlete.current_block ?? 1;
  const requestedBlock = blockParam ? Number(blockParam) : defaultBlock;
  const blockNumber = Number.isFinite(requestedBlock)
    ? Math.min(maxBlocks, Math.max(1, requestedBlock))
    : defaultBlock;

  try {
    if (summaryAll) {
      const blocks = await Promise.all(
        Array.from({ length: maxBlocks }, (_, i) => i + 1).map(async (b) => {
          const rows = await fetchBlockProgrammeDrafts(supabase, athleteId, b);
          const weeks = buildWeeksMeta(b, rows);
          const publishedWeeksCount = await fetchPublishedWeekCountForBlock(
            supabase,
            athleteId,
            b
          );
          const { weeksStart, weeksEnd } = blockWeekRange(b);
          const status = deriveBlockSelectorStatus(weeks, publishedWeeksCount);
          return {
            blockNumber: b,
            weeksStart,
            weeksEnd,
            status,
            publishedWeeksCount,
            generatedWeeksCount: weeks.filter((w) => w.generated).length,
            weeks,
          };
        })
      );

      const activeWeeks = blocks.find((b) => b.blockNumber === blockNumber)?.weeks ?? [];

      return NextResponse.json({
        success: true,
        blockNumber,
        weeks: activeWeeks,
        blocks: blocks.map(({ weeks: _w, ...rest }) => rest),
        drafts: await fetchBlockProgrammeDrafts(supabase, athleteId, blockNumber),
      });
    }

    const rows = await fetchBlockProgrammeDrafts(supabase, athleteId, blockNumber);
    const weeks = buildWeeksMeta(blockNumber, rows);
    const publishedWeeksCount = await fetchPublishedWeekCountForBlock(
      supabase,
      athleteId,
      blockNumber
    );

    return NextResponse.json({
      success: true,
      blockNumber,
      weeks,
      blockStatus: deriveBlockSelectorStatus(weeks, publishedWeeksCount),
      publishedWeeksCount,
      drafts: rows,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not load block drafts.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
