import { NextResponse } from "next/server";
import { generate12WeekProgramme } from "@/app/lib/generate12WeekProgramme";
import { isInternalAdminEmail } from "@/app/lib/internalAdminAccess";
import {
  analyseProgrammePreview,
  type ProgrammePreviewAnalysis,
} from "@/app/lib/internalProgrammePreviewAnalysis";
import {
  assessmentFromPreviewForm,
  type ProgrammePreviewFormState,
} from "@/app/lib/internalProgrammePreviewPresets";
import { mapAssessmentToProgrammeInput } from "@/app/lib/mapAssessmentToProgrammeInput";
import { createClient } from "@/app/lib/supabase/server";

export type ProgrammePreviewApiResponse = {
  weeks: ReturnType<typeof generate12WeekProgramme>;
  input_summary: {
    goal_focus: string;
    ability_level: string;
    days_per_week: number;
    hyrox_track: boolean;
  };
  analysis: ProgrammePreviewAnalysis;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isInternalAdminEmail(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { form?: ProgrammePreviewFormState };
  try {
    body = (await request.json()) as { form?: ProgrammePreviewFormState };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.form) {
    return NextResponse.json({ error: "Missing form" }, { status: 400 });
  }

  try {
    const assessment = assessmentFromPreviewForm(body.form);
    const input = mapAssessmentToProgrammeInput({
      assessment,
      benchmarkTests: [],
      email: user.email ?? "preview@hybrid365.internal",
      profile: { full_name: "Preview Athlete" },
    });

    const weeks = generate12WeekProgramme(input);
    const analysis = analyseProgrammePreview(weeks, input);

    const payload: ProgrammePreviewApiResponse = {
      weeks,
      input_summary: {
        goal_focus: input.goal_focus,
        ability_level: input.ability_level,
        days_per_week: input.days_per_week,
        hyrox_track: Boolean(input.hyrox_track?.active),
      },
      analysis,
    };

    return NextResponse.json(payload);
  } catch (e) {
    console.error("internal programme-preview generate error", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Generation failed" },
      { status: 500 }
    );
  }
}
