import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import {
  buildSessionLogUpsertRow,
  SESSION_LOG_SELECT,
  validateSessionLogPayload,
  type MemberSessionLogRecord,
} from "@/app/lib/sessionLogServer";

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

  const payload = (await request.json()) as Record<string, unknown>;
  const validated = validateSessionLogPayload(payload as Parameters<typeof validateSessionLogPayload>[0]);
  if (!validated.ok) {
    return badRequest(validated.error);
  }

  const { data: instance, error: instanceError } = await supabase
    .from("programme_instances")
    .select("id")
    .eq("id", validated.data.programme_instance_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (instanceError) {
    return NextResponse.json({ error: "Failed to verify programme instance" }, { status: 500 });
  }
  if (!instance?.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const upsertPayload = buildSessionLogUpsertRow(user.id, validated.data);

  const { data, error } = await supabase
    .from("session_logs")
    .upsert(upsertPayload, {
      onConflict: "user_id,programme_instance_id,week_number,session_key",
    })
    .select(SESSION_LOG_SELECT)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ log: data as MemberSessionLogRecord });
}
