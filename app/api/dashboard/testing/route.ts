import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

type BenchmarkPayload = {
  programme_instance_id: string | null;
  test_type: string;
  test_label: string | null;
  test_value: number | null;
  test_unit: string | null;
  test_time: string | null;
  bodyweight_kg: number | null;
  week_number: number | null;
  test_phase: string | null;
  notes: string | null;
  tested_at: string | null;
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

  const payload = (await request.json()) as Partial<BenchmarkPayload>;
  if (!payload.test_type) return badRequest("test_type is required");
  if (!payload.test_label?.trim()) return badRequest("test_label is required");

  const programmeInstanceId =
    typeof payload.programme_instance_id === "string" && payload.programme_instance_id.trim()
      ? payload.programme_instance_id.trim()
      : null;

  if (programmeInstanceId) {
    const { data: instance, error: instanceError } = await supabase
      .from("programme_instances")
      .select("id")
      .eq("id", programmeInstanceId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (instanceError) {
      console.error("benchmark instance verify error", instanceError);
      return NextResponse.json({ error: "Failed to verify programme instance" }, { status: 500 });
    }
    if (!instance?.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const testedAt =
    typeof payload.tested_at === "string" && payload.tested_at.trim()
      ? payload.tested_at.trim()
      : new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(testedAt)) {
    return badRequest("tested_at must be YYYY-MM-DD");
  }

  const timeBasedTypes = new Set([
    "5km time trial",
    "1km SkiErg",
    "1km Row",
    "Hyrox race",
  ]);
  const isTimeBased = timeBasedTypes.has(payload.test_type);

  const insertPayload = {
    user_id: user.id,
    programme_instance_id: programmeInstanceId,
    test_type: payload.test_type,
    test_label: payload.test_label?.trim() || null,
    test_value: isTimeBased
      ? null
      : typeof payload.test_value === "number" && Number.isFinite(payload.test_value)
      ? payload.test_value
      : null,
    test_unit: payload.test_unit?.trim() || null,
    test_time: isTimeBased ? payload.test_time?.trim() || null : null,
    bodyweight_kg:
      typeof payload.bodyweight_kg === "number" && Number.isFinite(payload.bodyweight_kg)
        ? payload.bodyweight_kg
        : null,
    week_number:
      typeof payload.week_number === "number" && Number.isFinite(payload.week_number)
        ? payload.week_number
        : null,
    test_phase: payload.test_phase?.trim() || null,
    notes: payload.notes?.trim() || null,
    tested_at: testedAt,
  };

  const { data, error } = await supabase
    .from("benchmark_tests")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error) {
    console.error("benchmark save error", error);
    return NextResponse.json(
      { error: "Unable to save benchmark test right now. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ test: data });
}
