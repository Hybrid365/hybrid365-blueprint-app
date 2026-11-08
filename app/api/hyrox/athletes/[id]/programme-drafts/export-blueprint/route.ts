import { NextResponse } from "next/server";
import { requireHyroxCoachApi } from "@/app/lib/hyroxApiAuth";
import { fetchHyroxAthleteById } from "@/app/lib/hyroxAthleteCoachDb";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";
import { exportProgrammeBlueprint } from "@/app/lib/hyroxProgrammeBlueprintExportServer";
import type { ProgrammeBlueprintExportSelection } from "@/app/lib/hyroxProgrammeBlueprintTypes";

type RouteContext = { params: Promise<{ id: string }> };

type Body = {
  block?: number;
  selection?: ProgrammeBlueprintExportSelection;
  global_weeks?: number[];
  /** Optional display label only — never treat as email lookup. */
  athlete_label?: string | null;
};

const SELECTIONS = new Set<ProgrammeBlueprintExportSelection>([
  "current_week",
  "selected_weeks",
  "entire_block",
]);

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireHyroxCoachApi();
  if (auth.error) return auth.error;

  const { id: athleteId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as Body;

  const block = body.block;
  if (!Number.isInteger(block) || (block as number) < 1) {
    return NextResponse.json(
      { success: false, error: "block must be an integer >= 1." },
      { status: 400 }
    );
  }

  const selection = body.selection;
  if (!selection || !SELECTIONS.has(selection)) {
    return NextResponse.json(
      {
        success: false,
        error: "selection must be current_week | selected_weeks | entire_block.",
      },
      { status: 400 }
    );
  }

  const label =
    typeof body.athlete_label === "string" ? body.athlete_label.trim().slice(0, 80) : null;
  // Refuse labels that look like emails to keep exports PII-light by default.
  if (label && label.includes("@")) {
    return NextResponse.json(
      {
        success: false,
        error: "athlete_label must not be an email address. Use a display name only.",
      },
      { status: 400 }
    );
  }

  const { client: supabase } = await createCoachServerClient();
  const { athlete, error } = await fetchHyroxAthleteById(supabase, athleteId);
  if (error) {
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
  if (!athlete) {
    return NextResponse.json({ success: false, error: "Athlete not found." }, { status: 404 });
  }

  try {
    const { document, filename } = await exportProgrammeBlueprint(supabase, {
      athleteId,
      block: block as number,
      selection,
      globalWeeks: body.global_weeks,
      athleteLabel: label,
      programmeLengthWeeks: athlete.programme_length_weeks,
    });

    return NextResponse.json({
      success: true,
      document,
      filename,
      message: `Exported ${document.weeks.length} week(s) with full CoachDraftWeek structure (read-only).`,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Export failed.";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
