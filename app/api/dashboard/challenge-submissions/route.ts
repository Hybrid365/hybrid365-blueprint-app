import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import { HYBRID_CHALLENGE_POINTS, HYBRID_CHALLENGE_WEEKS } from "@/app/lib/hybridChallengeConfig";

const SELECT_FIELDS =
  "id, user_id, programme_instance_id, challenge_key, challenge_week, challenge_title, score_value, score_unit, score_time, proof_url, proof_note, status, points_awarded, admin_notes, submitted_at, reviewed_at, created_at, updated_at";

const AUTO_SUBMISSION_POINTS = HYBRID_CHALLENGE_POINTS.weeklyChallengeSubmission;

/** Supabase `.single()` / `.maybeSingle()` throw when row count ≠ 1; use this after `.limit(1)` or small arrays. */
function firstOrNull<T>(rows: T[] | null | undefined): T | null {
  if (!rows?.length) return null;
  return rows[0] ?? null;
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

const validKeys = new Set(HYBRID_CHALLENGE_WEEKS.map((w) => w.challengeKey));

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json()) as Record<string, unknown>;
  const challenge_week = Number(payload.challenge_week);
  const challenge_key = typeof payload.challenge_key === "string" ? payload.challenge_key.trim() : "";
  const challenge_title = typeof payload.challenge_title === "string" ? payload.challenge_title.trim() : "";

  if (!Number.isInteger(challenge_week) || challenge_week < 1 || challenge_week > 6) {
    return badRequest("challenge_week must be 1-6");
  }
  if (!challenge_key || !validKeys.has(challenge_key)) {
    return badRequest("Invalid challenge_key");
  }
  if (!challenge_title) {
    return badRequest("challenge_title is required");
  }

  let programmeInstanceId: string | null =
    typeof payload.programme_instance_id === "string" && payload.programme_instance_id.trim()
      ? payload.programme_instance_id.trim()
      : null;

  if (programmeInstanceId) {
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
  }

  const score_time = typeof payload.score_time === "string" ? payload.score_time.trim() || null : null;
  const score_unit = typeof payload.score_unit === "string" ? payload.score_unit.trim() || null : null;
  let score_value: number | null = null;
  if (payload.score_value != null && payload.score_value !== "") {
    const n = Number(payload.score_value);
    if (!Number.isFinite(n)) return badRequest("score_value must be numeric");
    score_value = n;
  }

  const proof_url = typeof payload.proof_url === "string" ? payload.proof_url.trim() || null : null;
  const proof_note = typeof payload.proof_note === "string" ? payload.proof_note.trim() || null : null;

  // Do not use .maybeSingle() here: duplicate legacy rows would error with
  // "Cannot coerce the result to a single JSON object".
  const { data: existingRows, error: selErr } = await supabase
    .from("challenge_submissions")
    .select("id, status, points_awarded")
    .eq("user_id", user.id)
    .eq("challenge_week", challenge_week)
    .eq("challenge_key", challenge_key);

  if (selErr) {
    return NextResponse.json({ error: selErr.message }, { status: 500 });
  }

  const rows = existingRows ?? [];
  if (rows.some((r) => r.status === "rejected")) {
    return NextResponse.json(
      { error: "This submission was rejected. Contact support if you need it re-opened." },
      { status: 409 }
    );
  }

  const approvedRow = rows.find((r) => r.status === "approved");
  const points_awarded =
    approvedRow && typeof approvedRow.points_awarded === "number"
      ? approvedRow.points_awarded
      : AUTO_SUBMISSION_POINTS;

  const upsertRow = {
    user_id: user.id,
    programme_instance_id: programmeInstanceId,
    challenge_key,
    challenge_week,
    challenge_title,
    score_value,
    score_unit,
    score_time,
    proof_url,
    proof_note,
    submitted_at: new Date().toISOString(),
    status: "approved" as const,
    points_awarded,
  };

  const { data: savedRows, error } = await supabase
    .from("challenge_submissions")
    .upsert(upsertRow, { onConflict: "user_id,challenge_week,challenge_key" })
    .select(SELECT_FIELDS)
    .limit(1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const submission = firstOrNull(savedRows);
  if (!submission) {
    return NextResponse.json({ error: "Submission save did not return a row" }, { status: 500 });
  }

  return NextResponse.json({ submission });
}
