import { NextResponse } from "next/server";
import { requireHyroxCoachApi } from "@/app/lib/hyroxApiAuth";
import { fetchHyroxAthleteById } from "@/app/lib/hyroxAthleteCoachDb";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";
import type { HyroxAthleteRow } from "@/app/lib/hyroxDatabaseTypes";
import { approveProgrammeBlockDrafts } from "@/app/lib/hyroxProgrammeServer";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
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
