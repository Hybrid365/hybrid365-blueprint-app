import { NextResponse } from "next/server";
import {
  fetchWeeklyCheckin,
  isHybrid75HabitStorageConfigured,
  upsertWeeklyCheckin,
} from "@/app/lib/hybrid75HabitServer";
import { getWeekStartDate } from "@/app/lib/hybrid75HabitLogging";
import { validateScore } from "@/app/lib/hybrid75CheckinLogging";

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET(request: Request) {
  if (!isHybrid75HabitStorageConfigured()) {
    return NextResponse.json({ configured: false, checkin: null, week_start: getWeekStartDate() });
  }

  const { searchParams } = new URL(request.url);
  const planId = searchParams.get("plan_id")?.trim();
  if (!planId) return badRequest("plan_id is required");

  const weekStart = searchParams.get("week_start")?.trim() || getWeekStartDate();

  try {
    const checkin = await fetchWeeklyCheckin(planId, weekStart);
    return NextResponse.json({ configured: true, checkin, week_start: weekStart });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch check-in";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isHybrid75HabitStorageConfigured()) {
    return NextResponse.json(
      { error: "Weekly check-in is not configured on this environment" },
      { status: 503 }
    );
  }

  const body = (await request.json()) as Record<string, unknown>;
  const planId = typeof body.plan_id === "string" ? body.plan_id.trim() : "";
  if (!planId) return badRequest("plan_id is required");

  try {
    const payload = {
      plan_id: planId,
      email: typeof body.email === "string" ? body.email : undefined,
      name: typeof body.name === "string" ? body.name : undefined,
      week_start: typeof body.week_start === "string" ? body.week_start : undefined,
      sessions_completed:
        typeof body.sessions_completed === "number" ? body.sessions_completed : null,
      proof_posts: typeof body.proof_posts === "number" ? body.proof_posts : null,
      energy_score: validateScore(body.energy_score, "energy_score"),
      recovery_score: validateScore(body.recovery_score, "recovery_score"),
      soreness_score: validateScore(body.soreness_score, "soreness_score"),
      biggest_win: typeof body.biggest_win === "string" ? body.biggest_win : null,
      biggest_struggle: typeof body.biggest_struggle === "string" ? body.biggest_struggle : null,
      support_needed: typeof body.support_needed === "string" ? body.support_needed : null,
      interested_full_programme:
        typeof body.interested_full_programme === "boolean"
          ? body.interested_full_programme
          : null,
    };

    const checkin = await upsertWeeklyCheckin(payload);
    return NextResponse.json({ checkin });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save check-in";
    const status = message.includes("must be 1-10") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
