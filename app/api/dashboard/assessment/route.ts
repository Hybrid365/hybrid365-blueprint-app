import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

type AssessmentPayload = {
  programme_instance_id: string | null;
  first_name: string | null;
  goal_focus: string | null;
  event_type: string | null;
  event_date: string | null;
  target_time: string | null;
  training_days_per_week: number | null;
  weekly_hours_band: string | null;
  preferred_training_days: string[] | null;
  double_session_days: string[] | null;
  current_running_volume_km: number | null;
  longest_recent_run_km: number | null;
  recent_5k_time: string | null;
  recent_10k_time: string | null;
  hyrox_pb: string | null;
  bodyweight_kg: number | null;
  target_bodyweight_kg: number | null;
  strength_experience: string | null;
  hyrox_experience: string | null;
  equipment: string[] | null;
  injury_flags: string[] | null;
  movements_to_avoid: string[] | null;
  biggest_limiter: string | null;
  notes: string | null;
};

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = (await request.json()) as Partial<AssessmentPayload>;
  const programmeInstanceId =
    typeof payload.programme_instance_id === "string" && payload.programme_instance_id.trim()
      ? payload.programme_instance_id.trim()
      : null;

  if (payload.event_date && !/^\d{4}-\d{2}-\d{2}$/.test(payload.event_date)) {
    return badRequest("event_date must be YYYY-MM-DD");
  }

  if (programmeInstanceId) {
    const { data: instance, error: instanceError } = await supabase
      .from("programme_instances")
      .select("id")
      .eq("id", programmeInstanceId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (instanceError) {
      console.error("assessment instance verify error", instanceError);
      return NextResponse.json({ error: "Failed to verify programme instance" }, { status: 500 });
    }
    if (!instance?.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const toNumOrNull = (v: unknown): number | null =>
    typeof v === "number" && Number.isFinite(v) ? v : null;
  const toArrayOrNull = (v: unknown): string[] | null =>
    Array.isArray(v) ? v.map((x) => String(x)) : null;

  const upsertPayload = {
    user_id: user.id,
    programme_instance_id: programmeInstanceId,
    first_name: payload.first_name?.trim() ? payload.first_name.trim().slice(0, 80) : null,
    goal_focus: payload.goal_focus?.trim() || null,
    event_type: payload.event_type?.trim() || null,
    event_date: payload.event_date ?? null,
    target_time: payload.target_time?.trim() || null,
    training_days_per_week: toNumOrNull(payload.training_days_per_week),
    weekly_hours_band: payload.weekly_hours_band?.trim() || null,
    preferred_training_days: toArrayOrNull(payload.preferred_training_days),
    double_session_days: toArrayOrNull(payload.double_session_days),
    current_running_volume_km: toNumOrNull(payload.current_running_volume_km),
    longest_recent_run_km: toNumOrNull(payload.longest_recent_run_km),
    recent_5k_time: payload.recent_5k_time?.trim() || null,
    recent_10k_time: payload.recent_10k_time?.trim() || null,
    hyrox_pb: payload.hyrox_pb?.trim() || null,
    bodyweight_kg: toNumOrNull(payload.bodyweight_kg),
    target_bodyweight_kg: toNumOrNull(payload.target_bodyweight_kg),
    strength_experience: payload.strength_experience?.trim() || null,
    hyrox_experience: payload.hyrox_experience?.trim() || null,
    equipment: toArrayOrNull(payload.equipment),
    injury_flags: toArrayOrNull(payload.injury_flags),
    movements_to_avoid: toArrayOrNull(payload.movements_to_avoid),
    biggest_limiter: payload.biggest_limiter?.trim() || null,
    notes: payload.notes?.trim() || null,
    completed_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("athlete_assessments")
    .upsert(upsertPayload, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) {
    console.error("assessment save error", error);
    return NextResponse.json(
      { error: "Unable to save assessment right now. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ assessment: data });
}
