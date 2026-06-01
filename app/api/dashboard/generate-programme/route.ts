import { NextResponse } from "next/server";
import { runCommunityGenerateProgramme } from "@/app/lib/communityGenerateProgramme";
import { createClient } from "@/app/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runCommunityGenerateProgramme(supabase, user);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    ok: true,
    programmeInstanceId: result.programmeInstanceId,
    weeksGenerated: result.weeksGenerated,
    unlockedWeeks: result.unlockedWeeks,
    message: result.message,
    unlockAt: result.unlockAt,
    status: result.status,
  });
}
