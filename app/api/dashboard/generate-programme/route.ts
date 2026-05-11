import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import { generate12WeekProgramme } from "@/app/lib/generate12WeekProgramme";
import {
  mapAssessmentToProgrammeInput,
  type AthleteAssessmentRowForProgramme,
  type BenchmarkTestRowForProgramme,
} from "@/app/lib/mapAssessmentToProgrammeInput";

function jsonOk(body: unknown) {
  return NextResponse.json(body);
}

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select("status, expires_at")
    .eq("user_id", user.id)
    .maybeSingle();

  const active = membership?.status === "active";
  let notExpired = true;
  if (membership?.expires_at) {
    const expires = new Date(String(membership.expires_at));
    notExpired = !Number.isNaN(expires.getTime()) && expires > new Date();
  }
  if (!active || !notExpired) {
    return NextResponse.json({ error: "Active membership required" }, { status: 403 });
  }

  const { data: assessment, error: assessErr } = await supabase
    .from("athlete_assessments")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (assessErr) {
    console.error("generate-programme assessment fetch:", assessErr);
    return NextResponse.json({ error: "Could not load your assessment." }, { status: 500 });
  }

  const typedAssessment = assessment as AthleteAssessmentRowForProgramme | null;
  if (!typedAssessment?.completed_at) {
    return NextResponse.json(
      { error: "Complete your athlete assessment before generating your programme." },
      { status: 400 }
    );
  }

  let profile: { full_name: string | null } | null = null;
  const profilesResult = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profilesResult.error) {
    console.warn(
      "generate-programme profiles optional fetch:",
      profilesResult.error.message
    );
  } else {
    profile = profilesResult.data as { full_name: string | null } | null;
  }

  const { data: testsRaw } = await supabase
    .from("benchmark_tests")
    .select("test_type, test_label, test_time, test_value, test_unit, tested_at")
    .eq("user_id", user.id)
    .order("tested_at", { ascending: false });

  const benchmarkTests =
    (testsRaw ?? []) as BenchmarkTestRowForProgramme[];

  const blueprintInput = mapAssessmentToProgrammeInput({
    assessment: typedAssessment,
    benchmarkTests,
    email: user.email ?? null,
    profile,
  });

  const { data: existingInstance } = await supabase
    .from("programme_instances")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const existingId = (existingInstance as { id?: string } | null)?.id;

  let hadWeeksAlready = false;
  if (existingId) {
    const { data: wc } = await supabase
      .from("programme_weeks")
      .select("week_number")
      .eq("programme_instance_id", existingId)
      .limit(1);
    hadWeeksAlready = (wc ?? []).length > 0;
  }

  let generated;
  try {
    generated = generate12WeekProgramme(blueprintInput);
  } catch (e) {
    console.error("generate12WeekProgramme error:", e);
    return NextResponse.json(
      { error: "Unable to generate programme plan. Try again shortly." },
      { status: 500 }
    );
  }

  const programmeInstancePayload = {
    user_id: user.id,
    title: "Hybrid365 12-Week Programme",
    current_week: 1,
    goal_focus: blueprintInput.goal_focus,
    ability_level: blueprintInput.ability_level,
    weekly_hours_band: blueprintInput.weekly_hours_band,
  };

  let programmeInstanceId: string;

  if (existingId) {
    programmeInstanceId = existingId;

    const { error: updErr } = await supabase
      .from("programme_instances")
      .update({
        title: programmeInstancePayload.title,
        current_week: programmeInstancePayload.current_week,
        goal_focus: programmeInstancePayload.goal_focus,
        ability_level: programmeInstancePayload.ability_level,
        weekly_hours_band: programmeInstancePayload.weekly_hours_band,
      })
      .eq("id", programmeInstanceId)
      .eq("user_id", user.id);

    if (updErr) {
      console.error("programme_instances update:", updErr);
      return NextResponse.json(
        { error: "Could not save your programme metadata. Verify Supabase programme_instances columns (goal_focus, ability_level, weekly_hours_band)." },
        { status: 500 }
      );
    }
  } else {
    const { data: inserted, error: insErr } = await supabase
      .from("programme_instances")
      .insert(programmeInstancePayload)
      .select("id")
      .single();

    if (insErr || !(inserted as { id?: string } | null)?.id) {
      console.error("programme_instances insert:", insErr);
      return NextResponse.json(
        {
          error:
            "Could not create programme instance. Confirm programme_instances columns include title, user_id, current_week (and optionally goal_focus, ability_level, weekly_hours_band), or migrate your schema.",
        },
        { status: 500 }
      );
    }
    programmeInstanceId = (inserted as { id: string }).id;
  }

  const weekRows = generated.map((week) => ({
    programme_instance_id: programmeInstanceId,
    week_number: week.week_number,
    title: week.title,
    plan_json: week.plan_json as unknown as Record<string, unknown>,
    is_unlocked: week.week_number <= 4,
  }));

  const { error: upsertErr } = await supabase.from("programme_weeks").upsert(weekRows, {
    onConflict: "programme_instance_id,week_number",
  });

  if (upsertErr) {
    console.error("programme_weeks upsert:", upsertErr);
    return NextResponse.json(
      { error: "Could not save programme weeks. Confirm unique constraint programme_instance_id,week_number and RLS." },
      { status: 500 }
    );
  }

  const updateAssessment = await supabase
    .from("athlete_assessments")
    .update({ programme_instance_id: programmeInstanceId })
    .eq("user_id", user.id);

  if (updateAssessment.error) {
    console.warn("generate-programme athlete_assessment link:", updateAssessment.error.message);
  }

  const orphanBenchmarkLink = await supabase
    .from("benchmark_tests")
    .update({ programme_instance_id: programmeInstanceId })
    .eq("user_id", user.id)
    .is("programme_instance_id", null);

  if (orphanBenchmarkLink.error) {
    console.warn("generate-programme benchmarks link:", orphanBenchmarkLink.error.message);
  }

  const message = hadWeeksAlready ? "Existing programme updated." : "Programme generated.";

  return jsonOk({
    ok: true,
    programmeInstanceId,
    weeksGenerated: 12,
    unlockedWeeks: [1, 2, 3, 4],
    message,
  });
}
