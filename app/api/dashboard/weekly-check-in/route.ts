import { NextResponse } from "next/server";
import {
  parseHyroxCheckInDetails,
  serializeHyroxCheckInDetails,
  validateHyroxCheckInDetails,
  type CommunityHyroxCheckInDetails,
} from "@/app/lib/communityHyroxCheckIn";
import { createClient } from "@/app/lib/supabase/server";

type WeeklyCheckInPayload = {
  programme_instance_id: string;
  week_number: number;
  bodyweight_kg: number | null;
  sleep_hours: number | null;
  energy_score: number | null;
  recovery_score: number | null;
  stress_score: number | null;
  motivation_score: number | null;
  adherence_score: number | null;
  biggest_win: string | null;
  biggest_struggle: string | null;
  pain_or_injury: string | null;
  notes: string | null;
  hyrox_checkin_details?: Record<string, unknown> | null;
};

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function checkScoreRange(value: number | null | undefined, fieldLabel: string) {
  if (value == null) return null;
  if (value < 1 || value > 10) return `${fieldLabel} must be between 1 and 10`;
  return null;
}

function checkAdherenceRange(value: number | null | undefined) {
  if (value == null) return null;
  if (value < 0 || value > 100) return "Adherence (%) must be between 0 and 100";
  return null;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json()) as Partial<WeeklyCheckInPayload>;
  if (!payload.programme_instance_id) return badRequest("programme_instance_id is required");
  if (typeof payload.week_number !== "number") return badRequest("week_number is required");
  if (payload.week_number < 1 || payload.week_number > 12) return badRequest("Invalid week_number");

  for (const issue of [
    checkScoreRange(payload.energy_score, "Energy"),
    checkScoreRange(payload.recovery_score, "Recovery"),
    checkScoreRange(payload.stress_score, "Stress"),
    checkScoreRange(payload.motivation_score, "Motivation"),
    checkAdherenceRange(payload.adherence_score),
  ]) {
    if (issue) return badRequest(issue);
  }

  const { data: instance, error: instanceError } = await supabase
    .from("programme_instances")
    .select("id")
    .eq("id", payload.programme_instance_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (instanceError) {
    return NextResponse.json({ error: "Failed to verify programme instance" }, { status: 500 });
  }
  if (!instance?.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const hyroxDetails: CommunityHyroxCheckInDetails = parseHyroxCheckInDetails(
    payload.hyrox_checkin_details
  );
  const hyroxValidation = validateHyroxCheckInDetails(hyroxDetails);
  if (hyroxValidation) return badRequest(hyroxValidation);

  const upsertPayload = {
    user_id: user.id,
    programme_instance_id: payload.programme_instance_id,
    week_number: payload.week_number,
    bodyweight_kg: payload.bodyweight_kg ?? null,
    sleep_hours: payload.sleep_hours ?? null,
    energy_score: payload.energy_score ?? null,
    recovery_score: payload.recovery_score ?? null,
    stress_score: payload.stress_score ?? null,
    motivation_score: payload.motivation_score ?? null,
    adherence_score: payload.adherence_score ?? null,
    biggest_win: payload.biggest_win?.trim() || null,
    biggest_struggle: payload.biggest_struggle?.trim() || null,
    pain_or_injury: payload.pain_or_injury?.trim() || null,
    notes: payload.notes?.trim() || null,
    hyrox_checkin_details: serializeHyroxCheckInDetails(hyroxDetails),
    submitted_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("weekly_check_ins")
    .upsert(upsertPayload, {
      onConflict: "user_id,programme_instance_id,week_number",
    })
    .select(
      "id, week_number, bodyweight_kg, sleep_hours, energy_score, recovery_score, stress_score, motivation_score, adherence_score, biggest_win, biggest_struggle, pain_or_injury, notes, hyrox_checkin_details, submitted_at"
    )
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Unable to save weekly check-in right now. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ checkIn: data });
}
