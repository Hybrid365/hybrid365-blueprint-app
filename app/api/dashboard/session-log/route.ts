import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

type SessionLogPayload = {
  programme_instance_id: string;
  week_number: number;
  session_key: string;
  session_title: string;
  session_day: string;
  completed: boolean;
  rpe: number | null;
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

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json()) as Partial<SessionLogPayload>;
  if (!payload.programme_instance_id) return badRequest("programme_instance_id is required");
  if (!payload.session_key) return badRequest("session_key is required");
  if (!payload.session_title) return badRequest("session_title is required");
  if (!payload.session_day) return badRequest("session_day is required");
  if (typeof payload.week_number !== "number") return badRequest("week_number is required");
  if (payload.week_number < 1 || payload.week_number > 12) return badRequest("Invalid week_number");
  if (typeof payload.completed !== "boolean") return badRequest("completed is required");
  if (payload.rpe != null && (payload.rpe < 1 || payload.rpe > 10)) return badRequest("rpe must be 1-10");

  const { data: instance, error: instanceError } = await supabase
    .from("programme_instances")
    .select("id")
    .eq("id", payload.programme_instance_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (instanceError) {
    return NextResponse.json(
      { error: "Failed to verify programme instance" },
      { status: 500 }
    );
  }
  if (!instance?.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const upsertPayload = {
    user_id: user.id,
    programme_instance_id: payload.programme_instance_id,
    week_number: payload.week_number,
    session_key: payload.session_key,
    session_title: payload.session_title,
    session_day: payload.session_day,
    completed: payload.completed,
    completed_at: payload.completed ? new Date().toISOString() : null,
    rpe: payload.rpe ?? null,
    notes: payload.notes?.trim() || null,
  };

  const { data, error } = await supabase
    .from("session_logs")
    .upsert(upsertPayload, {
      onConflict: "user_id,programme_instance_id,week_number,session_key",
    })
    .select(
      "id, week_number, session_key, session_title, session_day, completed, completed_at, rpe, notes"
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ log: data });
}
