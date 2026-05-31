import { NextResponse } from "next/server";
import { requireHyroxCoachApi } from "@/app/lib/hyroxApiAuth";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";
import { listPublishedViewSummaries } from "@/app/lib/hyroxCoachPublishedViewsServer";

export async function GET() {
  const auth = await requireHyroxCoachApi();
  if (auth.error) return auth.error;

  const { client: supabase } = await createCoachServerClient();
  const { rows, error } = await listPublishedViewSummaries(supabase);

  if (error) {
    return NextResponse.json({ success: false, error }, { status: 500 });
  }

  return NextResponse.json({ success: true, athletes: rows });
}
