import { NextResponse } from "next/server";
import { requireHyroxCoachApi } from "@/app/lib/hyroxApiAuth";
import {
  fetchHybrid11ApplicationById,
  updateHybrid11Application,
} from "@/app/lib/hybrid11ApplicationCoachDb";
import {
  HYBRID11_APPLICATION_STATUSES,
  type Hybrid11ApplicationRow,
  type Hybrid11ApplicationStatus,
} from "@/app/lib/hybrid11DatabaseTypes";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireHyroxCoachApi();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const { client: supabase, mode } = await createCoachServerClient();
  const { application, error } = await fetchHybrid11ApplicationById(supabase, id);

  if (error) {
    console.error("Hybrid 1-1 application fetch failed", { id, message: error, coachSupabaseMode: mode });
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
  if (!application) {
    return NextResponse.json({ success: false, error: "Application not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true, application });
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireHyroxCoachApi();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const body = (await request.json()) as {
    status?: Hybrid11ApplicationStatus;
    coach_notes?: string | null;
  };

  const updates: Record<string, unknown> = {};
  if (body.status !== undefined) {
    if (!HYBRID11_APPLICATION_STATUSES.includes(body.status)) {
      return NextResponse.json({ success: false, error: "Invalid status." }, { status: 400 });
    }
    updates.status = body.status;
  }
  if (body.coach_notes !== undefined) {
    updates.coach_notes =
      typeof body.coach_notes === "string" ? body.coach_notes.trim() || null : null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ success: false, error: "No updates provided." }, { status: 400 });
  }

  const { client: supabase, mode } = await createCoachServerClient();
  const { application, error } = await updateHybrid11Application(supabase, id, updates);

  if (error) {
    console.error("Hybrid 1-1 application update failed", { id, message: error, coachSupabaseMode: mode });
    return NextResponse.json({ success: false, error }, { status: 500 });
  }

  return NextResponse.json({ success: true, application: application as Hybrid11ApplicationRow });
}
