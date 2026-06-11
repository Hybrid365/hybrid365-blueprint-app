import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import { SESSION_LOG_SELECT, type MemberSessionLogRecord } from "@/app/lib/sessionLogServer";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const programmeInstanceId = url.searchParams.get("programme_instance_id")?.trim();
  const weekParam = url.searchParams.get("week_number");

  if (!programmeInstanceId) {
    return NextResponse.json({ error: "programme_instance_id is required" }, { status: 400 });
  }

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

  let query = supabase
    .from("session_logs")
    .select(SESSION_LOG_SELECT)
    .eq("user_id", user.id)
    .eq("programme_instance_id", programmeInstanceId)
    .order("week_number", { ascending: true });

  if (weekParam) {
    const weekNumber = parseInt(weekParam, 10);
    if (!Number.isFinite(weekNumber) || weekNumber < 1 || weekNumber > 12) {
      return NextResponse.json({ error: "Invalid week_number" }, { status: 400 });
    }
    query = query.eq("week_number", weekNumber);
  } else {
    query = query.gte("week_number", 1).lte("week_number", 12);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ logs: (data ?? []) as MemberSessionLogRecord[] });
}
