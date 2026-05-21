import { NextResponse } from "next/server";
import { fetchHyroxAthleteById } from "@/app/lib/hyroxAthleteCoachDb";
import { linkHyroxAthleteToAuthUser } from "@/app/lib/hyroxAthleteAutoLink";
import { requireHyroxCoachApi } from "@/app/lib/hyroxApiAuth";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";
import { createServiceRoleClient } from "@/app/lib/supabaseAdmin";
import { listAuthUsersByEmail } from "@/app/lib/whopMembershipSync";

type RouteContext = { params: Promise<{ id: string }> };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireHyroxCoachApi();
  if (auth.error) return auth.error;

  const { id: athleteId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    userId?: string;
  };

  const { client: supabase, mode } = await createCoachServerClient();
  const { athlete: existing, error: fetchError } = await fetchHyroxAthleteById(
    supabase,
    athleteId
  );

  if (fetchError) {
    return NextResponse.json({ success: false, error: fetchError }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json(
      { success: false, error: "Athlete not found.", detail: `No row for id ${athleteId}` },
      { status: 404 }
    );
  }

  if (existing.payment_status !== "paid") {
    return NextResponse.json(
      { success: false, error: "Confirm payment before relinking." },
      { status: 400 }
    );
  }

  const email = (body.email ?? existing.email)?.trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ success: false, error: "A valid email is required." }, { status: 400 });
  }

  let admin;
  try {
    admin = createServiceRoleClient();
  } catch (e) {
    console.error("[hyrox/relink-user] service role unavailable", e);
    return NextResponse.json(
      { success: false, error: "Server configuration error." },
      { status: 500 }
    );
  }

  const { users, listError } = await listAuthUsersByEmail(admin, email);
  if (listError) {
    return NextResponse.json({ success: false, error: listError }, { status: 500 });
  }
  if (users.length === 0) {
    return NextResponse.json(
      {
        success: false,
        error: "No auth user found for this email. Athlete must sign in at /athlete/login first.",
      },
      { status: 404 }
    );
  }

  const explicitUserId = body.userId?.trim();
  let targetUserId = explicitUserId ?? "";

  if (!targetUserId) {
    if (users.length > 1) {
      return NextResponse.json(
        {
          success: false,
          error: "DUPLICATE_AUTH_USERS",
          message:
            "Multiple auth accounts share this email. Pass userId to relink to the account the athlete is using.",
          authUsers: users,
        },
        { status: 409 }
      );
    }
    targetUserId = users[0]!.id;
  } else if (!users.some((u) => u.id === targetUserId)) {
    return NextResponse.json(
      {
        success: false,
        error: "userId is not an auth account with this athlete email.",
        authUsers: users,
      },
      { status: 400 }
    );
  }

  const result = await linkHyroxAthleteToAuthUser({
    athleteId,
    targetUserId,
    email,
    changedBy: auth.ctx.userId,
    historyReason: "coach_relink_user",
    forceRelink: true,
  });

  if (!result.linked) {
    return NextResponse.json(
      {
        success: false,
        error: result.reason ?? "RELINK_FAILED",
        message: result.message,
        detail: result.message,
        coachSupabaseMode: mode,
      },
      { status: 500 }
    );
  }

  const { athlete: updated, error: reloadError } = await fetchHyroxAthleteById(
    supabase,
    athleteId
  );

  if (reloadError || !updated) {
    return NextResponse.json(
      { success: false, error: "Relink saved but athlete could not be reloaded." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Athlete relinked to auth user.",
    athlete: updated,
    linkedUserId: targetUserId,
    relinked: true,
    previousUserId: existing.user_id,
  });
}
