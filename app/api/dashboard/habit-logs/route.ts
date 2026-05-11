import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import type { DailyHabitLogRow, DailyHabitLogUpsertBody } from "@/app/lib/dailyHabitLogs";

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

const SELECT_FIELDS =
  "id, user_id, programme_instance_id, log_date, water_hit, protein_hit, steps_hit, sleep_hit, mobility_hit, proof_posted, notes, created_at, updated_at";

function isIsoDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (!from || !to) return badRequest("from and to query params are required (YYYY-MM-DD)");
  if (!isIsoDate(from) || !isIsoDate(to)) return badRequest("Invalid date format");
  if (from > to) return badRequest("from must be <= to");

  const { data, error } = await supabase
    .from("daily_habit_logs")
    .select(SELECT_FIELDS)
    .eq("user_id", user.id)
    .gte("log_date", from)
    .lte("log_date", to)
    .order("log_date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ logs: (data ?? []) as DailyHabitLogRow[] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json()) as Partial<DailyHabitLogUpsertBody>;
  if (!payload.log_date || !isIsoDate(payload.log_date)) {
    return badRequest("log_date is required (YYYY-MM-DD)");
  }

  const boolKeys = [
    "water_hit",
    "protein_hit",
    "steps_hit",
    "sleep_hit",
    "mobility_hit",
    "proof_posted",
  ] as const;
  for (const k of boolKeys) {
    if (typeof payload[k] !== "boolean") {
      return badRequest(`${k} boolean is required`);
    }
  }

  let programmeInstanceId: string | null =
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
      return NextResponse.json({ error: "Failed to verify programme instance" }, { status: 500 });
    }
    if (!instance?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  let notesValue: string | null;
  if (typeof payload.notes === "string") {
    notesValue = payload.notes.trim() || null;
  } else if (payload.notes === null) {
    notesValue = null;
  } else {
    const { data: existing } = await supabase
      .from("daily_habit_logs")
      .select("notes")
      .eq("user_id", user.id)
      .eq("log_date", payload.log_date)
      .maybeSingle();
    notesValue = (existing as { notes: string | null } | null)?.notes ?? null;
  }

  const upsertRow = {
    user_id: user.id,
    programme_instance_id: programmeInstanceId,
    log_date: payload.log_date,
    water_hit: payload.water_hit!,
    protein_hit: payload.protein_hit!,
    steps_hit: payload.steps_hit!,
    sleep_hit: payload.sleep_hit!,
    mobility_hit: payload.mobility_hit!,
    proof_posted: payload.proof_posted!,
    notes: notesValue,
  };

  const { data, error } = await supabase
    .from("daily_habit_logs")
    .upsert(upsertRow, { onConflict: "user_id,log_date" })
    .select(SELECT_FIELDS)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ log: data as DailyHabitLogRow });
}
