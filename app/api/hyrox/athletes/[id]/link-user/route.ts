import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/app/lib/supabaseAdmin";
import { requireHyroxCoachApi } from "@/app/lib/hyroxApiAuth";
import { fetchHyroxAthleteById } from "@/app/lib/hyroxAthleteCoachDb";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";
import { getNextHyroxAthleteStatus } from "@/app/lib/hyroxAthleteStatus";
import { isHyroxCoachRole } from "@/app/lib/hyroxRoles";
import { fetchAthleteProgressFlags, recordHyroxStatusHistory } from "@/app/lib/hyroxAthleteServer";
import { findAuthUserIdByEmail } from "@/app/lib/whopMembershipSync";
import type { HyroxAthleteRow } from "@/app/lib/hyroxDatabaseTypes";

type RouteContext = { params: Promise<{ id: string }> };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireHyroxCoachApi();
  if (auth.error) return auth.error;

  const { id: athleteId } = await context.params;
  const body = (await request.json()) as { email?: string };
  const email = body.email?.trim().toLowerCase();

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  const { client: supabase, mode } = await createCoachServerClient();

  const { athlete: existing, error: fetchError } = await fetchHyroxAthleteById(
    supabase,
    athleteId
  );

  if (fetchError) {
    return NextResponse.json({ success: false, error: fetchError }, { status: 500 });
  }
  if (!existing) {
    console.error("Hyrox link-user athlete not found", { athleteId, coachSupabaseMode: mode });
    return NextResponse.json(
      { success: false, error: "Athlete not found.", detail: `No row for id ${athleteId}` },
      { status: 404 }
    );
  }

  const athlete = existing;

  if (athlete.payment_status !== "paid") {
    return NextResponse.json(
      {
        error:
          "Confirm payment before linking an account, or mark payment as paid first.",
      },
      { status: 400 }
    );
  }

  let admin;
  try {
    admin = createServiceRoleClient();
  } catch (e) {
    console.error("[hyrox/link-user] service role unavailable", e);
    return NextResponse.json(
      { error: "Server configuration error. Cannot look up users by email." },
      { status: 500 }
    );
  }

  const lookup = await findAuthUserIdByEmail(admin, email);
  if (!lookup.ok || !lookup.userId) {
    return NextResponse.json(
      {
        error:
          "No user found with this email. Ask athlete to sign in at /athlete/login with the same email, then try again.",
      },
      { status: 404 }
    );
  }

  const userId = lookup.userId;

  const { data: otherAthlete } = await supabase
    .from("hyrox_athletes")
    .select("id, email")
    .eq("user_id", userId)
    .neq("id", athleteId)
    .maybeSingle();

  if (otherAthlete) {
    return NextResponse.json(
      {
        error: "This user is already linked to another Hyrox athlete record.",
      },
      { status: 409 }
    );
  }

  const flags = await fetchAthleteProgressFlags(supabase, athleteId);
  const nextStatus = getNextHyroxAthleteStatus({
    payment_status: athlete.payment_status,
    user_id: userId,
    status: athlete.status,
    hasAssessment: flags.hasAssessment,
    hasTesting: flags.hasTesting,
  });

  const { error: updateError } = await supabase
    .from("hyrox_athletes")
    .update({
      user_id: userId,
      email,
      status: nextStatus,
    })
    .eq("id", athleteId);

  if (updateError) {
    return NextResponse.json(
      { success: false, error: "LINK_USER_FAILED", detail: updateError.message },
      { status: 500 }
    );
  }

  const { athlete: updated, error: reloadError } = await fetchHyroxAthleteById(
    supabase,
    athleteId
  );

  if (reloadError || !updated) {
    return NextResponse.json(
      {
        success: false,
        error: "LINK_USER_FAILED",
        detail: reloadError ?? "Link saved but row could not be reloaded.",
      },
      { status: 500 }
    );
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  const currentRole = profile?.role as string | undefined;
  if (!isHyroxCoachRole(currentRole)) {
    const { error: roleError } = await admin
      .from("profiles")
      .update({ role: "athlete" })
      .eq("id", userId);

    if (roleError) {
      console.error("[hyrox/link-user] profiles.role update failed", {
        userId,
        currentRole,
        message: roleError.message,
      });
      return NextResponse.json(
        {
          success: false,
          error: "LINK_USER_ROLE_FAILED",
          detail: roleError.message,
        },
        { status: 500 }
      );
    }
  }

  await recordHyroxStatusHistory(supabase, {
    athleteId,
    statusFrom: athlete.status,
    statusTo: nextStatus,
    changedBy: auth.ctx.userId,
    reason: "manual_link_user",
    metadata: { linked_user_id: userId, email },
  });

  return NextResponse.json({
    success: true,
    message: "Athlete account linked. They can sign in to the athlete portal.",
    athlete: updated,
    linkedUserId: userId,
  });
}
