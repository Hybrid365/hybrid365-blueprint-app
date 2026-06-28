import { NextResponse } from "next/server";
import { requireHyroxCoachApi } from "@/app/lib/hyroxApiAuth";
import { fetchHyroxAthleteById } from "@/app/lib/hyroxAthleteCoachDb";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";
import type { HyroxAthleteRow } from "@/app/lib/hyroxDatabaseTypes";
import { approveProgrammeBlockDrafts } from "@/app/lib/hyroxProgrammeServer";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireHyroxCoachApi();
  if (auth.error) return auth.error;

  const { id: athleteId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { block_number?: number };
  const { client: supabase } = await createCoachServerClient();

  const { athlete, error: athleteError } = await fetchHyroxAthleteById(supabase, athleteId);
  if (athleteError) {
    return NextResponse.json({ success: false, error: athleteError }, { status: 500 });
  }
  if (!athlete) {
    return NextResponse.json({ success: false, error: "Athlete not found." }, { status: 404 });
  }

  const maxBlocks = athlete.programme_length_weeks === 16 ? 4 : 3;
  const blockNumber = body.block_number
    ? Math.min(maxBlocks, Math.max(1, Number(body.block_number)))
    : (athlete.current_block ?? 1);

  try {
    const result = await approveProgrammeBlockDrafts(supabase, {
      athleteRow: athlete as HyroxAthleteRow,
      blockNumber,
      changedBy: auth.ctx.userId,
    });

    return NextResponse.json({
      success: true,
      approved: result.approved,
      draftIds: result.draftIds,
      message:
        result.approved > 0
          ? `Approved ${result.approved} draft week(s) in block ${blockNumber}.`
          : "All block weeks were already approved or published.",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Block approve failed.";
    return NextResponse.json(
      {
        success: false,
        error: message,
        ...(process.env.NODE_ENV === "development" ? { detail: message } : {}),
      },
      { status: 500 }
    );
  }
}
