import { NextResponse } from "next/server";
import {
  buildHabitSummaryForPlan,
  isHybrid75HabitStorageConfigured,
  upsertHabitLog,
} from "@/app/lib/hybrid75HabitServer";
import { HYBRID75_HABIT_KEYS, type Hybrid75HabitKey } from "@/app/lib/hybrid75HabitLogging";

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET(request: Request) {
  if (!isHybrid75HabitStorageConfigured()) {
    return NextResponse.json({ configured: false, summary: null });
  }

  const { searchParams } = new URL(request.url);
  const planId = searchParams.get("plan_id")?.trim();
  if (!planId) return badRequest("plan_id is required");

  try {
    const summary = await buildHabitSummaryForPlan(planId);
    return NextResponse.json({ configured: true, summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch habits";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isHybrid75HabitStorageConfigured()) {
    return NextResponse.json(
      { error: "Habit tracking is not configured on this environment" },
      { status: 503 }
    );
  }

  const body = (await request.json()) as Record<string, unknown>;
  const planId = typeof body.plan_id === "string" ? body.plan_id.trim() : "";
  const habitKey = body.habit_key as Hybrid75HabitKey;
  const completed = body.completed === true;

  if (!planId) return badRequest("plan_id is required");
  if (!HYBRID75_HABIT_KEYS.includes(habitKey)) return badRequest("Invalid habit_key");

  const payload = {
    plan_id: planId,
    habit_key: habitKey,
    completed,
    email: typeof body.email === "string" ? body.email : undefined,
    name: typeof body.name === "string" ? body.name : undefined,
  };

  try {
    const log = await upsertHabitLog(payload);
    const summary = await buildHabitSummaryForPlan(planId);
    return NextResponse.json({ log, summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save habit";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
