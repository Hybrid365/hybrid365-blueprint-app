import { NextResponse } from "next/server";
import {
  createAdminClientOrError,
  fullRegenerateMemberProgramme,
  lookupMemberForProgrammeRefresh,
  REFRESH_CONFIRM_TOKEN,
} from "@/app/lib/internalProgrammeRefreshServer";
import { getStrictInternalAdminUser } from "@/app/lib/requireInternalAdmin";

export async function GET(request: Request) {
  console.info("[programme refresh] lookup requested");

  const adminUser = await getStrictInternalAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  console.info("[programme refresh] admin authorised", { adminEmail: adminUser.email });

  const url = new URL(request.url);
  const email = url.searchParams.get("email")?.trim() ?? "";
  if (!email) {
    return NextResponse.json({ error: "Missing email query parameter." }, { status: 400 });
  }

  const adminClient = createAdminClientOrError();
  if (!adminClient.ok) {
    console.error("[programme refresh] failed", adminClient.error);
    return NextResponse.json({ error: adminClient.error }, { status: 500 });
  }

  const lookup = await lookupMemberForProgrammeRefresh(adminClient.client, email);
  if (!lookup.ok) {
    console.info("[programme refresh] user not found");
    return NextResponse.json({ error: lookup.error }, { status: lookup.status });
  }

  console.info("[programme refresh] user found", { userId: lookup.data.userId });
  return NextResponse.json({ member: lookup.data });
}

export async function POST(request: Request) {
  console.info("[programme refresh] regenerate requested");

  const adminUser = await getStrictInternalAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  console.info("[programme refresh] admin authorised", { adminEmail: adminUser.email });

  let body: { email?: string; confirm?: string; mode?: string };
  try {
    body = (await request.json()) as { email?: string; confirm?: string; mode?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email?.trim() ?? "";
  const confirm = body.confirm?.trim() ?? "";
  const mode = body.mode?.trim() ?? "full";

  if (confirm !== REFRESH_CONFIRM_TOKEN) {
    return NextResponse.json(
      { error: `Type ${REFRESH_CONFIRM_TOKEN} to confirm.` },
      { status: 400 }
    );
  }

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  if (mode !== "full") {
    return NextResponse.json(
      { error: "Only full reset/regenerate is available in v1." },
      { status: 400 }
    );
  }

  const adminClient = createAdminClientOrError();
  if (!adminClient.ok) {
    console.error("[programme refresh] failed", adminClient.error);
    return NextResponse.json({ error: adminClient.error }, { status: 500 });
  }

  const lookup = await lookupMemberForProgrammeRefresh(adminClient.client, email);
  if (!lookup.ok) {
    console.info("[programme refresh] user not found");
    return NextResponse.json({ error: lookup.error }, { status: lookup.status });
  }

  console.info("[programme refresh] user found", { userId: lookup.data.userId });

  const regen = await fullRegenerateMemberProgramme(adminClient.client, lookup.data.userId);
  if (!regen.ok) {
    console.error("[programme refresh] failed", regen.error);
    return NextResponse.json({ error: regen.error }, { status: regen.status });
  }

  console.info("[programme refresh] full regenerate success", {
    userId: lookup.data.userId,
    programmeInstanceId: regen.result.programmeInstanceId,
    replacedExisting: regen.result.replacedExisting,
  });

  return NextResponse.json({
    ok: true,
    email: lookup.data.email,
    userId: lookup.data.userId,
    weeksGenerated: regen.result.weeksGenerated,
    unlockedWeeks: regen.result.unlockedWeeks,
    programmeInstanceId: regen.result.programmeInstanceId,
    replacedExisting: regen.result.replacedExisting,
    sessionLogsPreserved: lookup.data.programme.sessionLogCount,
    checkInsPreserved: lookup.data.programme.checkInCount,
  });
}
