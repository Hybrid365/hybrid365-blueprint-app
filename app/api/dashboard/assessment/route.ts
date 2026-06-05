import { NextResponse } from "next/server";
import { runCommunityGenerateProgramme } from "@/app/lib/communityGenerateProgramme";
import {
  fetchCommunityProgrammeInstance,
  loadCommunityProgrammeWeeks,
  resolveCommunityProgrammeGenerated,
} from "@/app/lib/communityProgrammeStatus";
import {
  DEFAULT_TRAINING_TRACK,
  hyroxDetailsToAssessmentColumns,
  parseHyroxDetails,
  parseTrainingTrack,
  serializeHyroxDetails,
  validateHyroxAssessment,
  type CommunityHyroxDetails,
} from "@/app/lib/communityHyroxAssessment";
import { createClient } from "@/app/lib/supabase/server";

type AssessmentPayload = {
  programme_instance_id: string | null;
  training_track?: string | null;
  hyrox_details?: Record<string, unknown> | null;
  first_name: string | null;
  goal_focus: string | null;
  event_type: string | null;
  event_date: string | null;
  target_time: string | null;
  training_days_per_week: number | null;
  weekly_hours_band: string | null;
  preferred_training_days: string[] | null;
  double_session_days: string[] | null;
  current_run_volume_band: string | null;
  current_running_volume_km: number | null;
  longest_recent_run_km: number | null;
  recent_5k_time: string | null;
  max_heart_rate: number | null;
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

  const trainingTrack = parseTrainingTrack(payload.training_track ?? DEFAULT_TRAINING_TRACK);
  const hyroxDetails: CommunityHyroxDetails =
    trainingTrack === "hyrox"
      ? parseHyroxDetails(payload.hyrox_details)
      : parseHyroxDetails({});

  const hyroxValidationError = validateHyroxAssessment(trainingTrack, hyroxDetails);
  if (hyroxValidationError) {
    return badRequest(hyroxValidationError);
  }

  if (payload.event_date && !/^\d{4}-\d{2}-\d{2}$/.test(payload.event_date)) {
    return badRequest("event_date must be YYYY-MM-DD");
  }

  const hyroxColumns =
    trainingTrack === "hyrox" ? hyroxDetailsToAssessmentColumns(hyroxDetails) : null;

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

  const toMaxHrOrNull = (v: unknown): number | null => {
    if (v === null || v === undefined || v === "") return null;
    const n = typeof v === "number" ? v : Number(String(v).trim());
    if (!Number.isFinite(n)) return null;
    const rounded = Math.round(n);
    if (rounded < 100 || rounded > 230) return null;
    return rounded;
  };
  const toArrayOrNull = (v: unknown): string[] | null =>
    Array.isArray(v) ? v.map((x) => String(x)) : null;

  const upsertPayload = {
    user_id: user.id,
    programme_instance_id: programmeInstanceId,
    training_track: trainingTrack,
    hyrox_details:
      trainingTrack === "hyrox" ? serializeHyroxDetails(hyroxDetails) : {},
    first_name: payload.first_name?.trim() ? payload.first_name.trim().slice(0, 80) : null,
    goal_focus: payload.goal_focus?.trim() || null,
    event_type: payload.event_type?.trim() || null,
    event_date: hyroxColumns?.event_date ?? payload.event_date ?? null,
    target_time: hyroxColumns?.target_time ?? (payload.target_time?.trim() || null),
    training_days_per_week: toNumOrNull(payload.training_days_per_week),
    weekly_hours_band: payload.weekly_hours_band?.trim() || null,
    preferred_training_days: toArrayOrNull(payload.preferred_training_days),
    double_session_days: toArrayOrNull(payload.double_session_days),
    current_run_volume_band: payload.current_run_volume_band?.trim() || null,
    current_running_volume_km:
      hyroxColumns?.current_running_volume_km ?? toNumOrNull(payload.current_running_volume_km),
    longest_recent_run_km:
      hyroxColumns?.longest_recent_run_km ?? toNumOrNull(payload.longest_recent_run_km),
    recent_5k_time: hyroxColumns?.recent_5k_time ?? (payload.recent_5k_time?.trim() || null),
    max_heart_rate: toMaxHrOrNull(payload.max_heart_rate),
    recent_10k_time: hyroxColumns?.recent_10k_time ?? (payload.recent_10k_time?.trim() || null),
    hyrox_pb: hyroxColumns?.hyrox_pb ?? (payload.hyrox_pb?.trim() || null),
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

  let programmeQueued = false;
  let programmeUnlockAt: string | null = null;

  if (upsertPayload.completed_at) {
    const instance = await fetchCommunityProgrammeInstance(supabase, user.id);
    const weeksRaw = instance?.id
      ? await loadCommunityProgrammeWeeks(supabase, instance.id)
      : [];
    const hasProgramme = resolveCommunityProgrammeGenerated(instance?.id ?? null, weeksRaw);

    if (!hasProgramme) {
      const gen = await runCommunityGenerateProgramme(supabase, user);
      programmeQueued = gen.ok;
      programmeUnlockAt = gen.ok ? gen.unlockAt : null;
      if (!gen.ok) {
        console.warn("[assessment] programme generation after profile save failed", gen.error);
      }
    }
  }

  return NextResponse.json({
    assessment: data,
    programmeQueued,
    programmeUnlockAt,
  });
}
