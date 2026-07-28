/**
 * BoxCross Ski Challenge — service-role DB access (server-only).
 */

import { createServiceRoleClient } from "@/app/lib/supabaseAdmin";
import { challengeAcceptsEntries, isChallengeFinal } from "./leaderboard";
import { parseSkiTimeToMs } from "./time";
import {
  BOXCROSS_CHALLENGE_SLUG,
  type BoxCrossCreateAttemptInput,
  type BoxCrossSkiAttempt,
  type BoxCrossSkiChallenge,
  type BoxCrossVerificationMethod,
  type BoxCrossSkiCategory,
} from "./types";

export function isBoxCrossDbConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  );
}

export async function fetchChallengeBySlug(
  slug = BOXCROSS_CHALLENGE_SLUG
): Promise<BoxCrossSkiChallenge | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("boxcross_ski_challenges")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as BoxCrossSkiChallenge | null) ?? null;
}

export async function fetchAttemptsForChallenge(
  challengeId: string,
  opts?: { verifiedOnly?: boolean }
): Promise<BoxCrossSkiAttempt[]> {
  const supabase = createServiceRoleClient();
  let query = supabase
    .from("boxcross_ski_attempts")
    .select("*")
    .eq("challenge_id", challengeId)
    .order("time_ms", { ascending: true });

  if (opts?.verifiedOnly) {
    query = query.eq("verified", true);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as BoxCrossSkiAttempt[]) ?? [];
}

function validateCreateInput(
  challenge: BoxCrossSkiChallenge,
  input: BoxCrossCreateAttemptInput
): { ok: true; time_ms: number } | { ok: false; error: string } {
  const name = input.athlete_name?.trim();
  if (!name) return { ok: false, error: "Athlete name is required" };
  if (input.category !== "male" && input.category !== "female") {
    return { ok: false, error: "Category must be male or female" };
  }
  if (
    input.verification_method !== "staff_witnessed" &&
    input.verification_method !== "full_video"
  ) {
    return { ok: false, error: "Verification method is required" };
  }

  const time_ms = parseSkiTimeToMs(input.time);
  if (time_ms == null || time_ms <= 0) {
    return { ok: false, error: "Time must be greater than zero (e.: 3:42.6)" };
  }

  const attempted = new Date(input.attempted_at);
  if (Number.isNaN(attempted.getTime())) {
    return { ok: false, error: "Attempt date is invalid" };
  }

  const outside =
    attempted.getTime() < new Date(challenge.start_date).getTime() ||
    attempted.getTime() > new Date(challenge.end_date).getTime();

  if (outside && !input.allow_outside_period) {
    return {
      ok: false,
      error:
        "Attempt date is outside the challenge period. Enable admin override to force.",
    };
  }

  if (!challengeAcceptsEntries(challenge) && input.verified !== false && !input.allow_outside_period) {
    if (isChallengeFinal(challenge)) {
      return {
        ok: false,
        error: "Challenge is final — new verified entries are closed. Use override if needed.",
      };
    }
  }

  return { ok: true, time_ms };
}

export async function createAttempt(
  challenge: BoxCrossSkiChallenge,
  input: BoxCrossCreateAttemptInput
): Promise<BoxCrossSkiAttempt> {
  const validated = validateCreateInput(challenge, input);
  if (!validated.ok) throw new Error(validated.error);

  const supabase = createServiceRoleClient();
  const row = {
    challenge_id: challenge.id,
    athlete_name: input.athlete_name.trim(),
    category: input.category as BoxCrossSkiCategory,
    time_ms: validated.time_ms,
    attempted_at: new Date(input.attempted_at).toISOString(),
    verification_method: input.verification_method as BoxCrossVerificationMethod,
    verified: input.verified ?? true,
    verified_by: input.verified_by?.trim() || null,
    proof_url: input.proof_url?.trim() || null,
    witness_name: input.witness_name?.trim() || null,
    internal_notes: input.internal_notes?.trim() || null,
    created_by: input.created_by?.trim() || null,
  };

  const { data, error } = await supabase
    .from("boxcross_ski_attempts")
    .insert(row)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as BoxCrossSkiAttempt;
}

export async function updateAttempt(
  attemptId: string,
  challenge: BoxCrossSkiChallenge,
  patch: Partial<BoxCrossCreateAttemptInput> & {
    verified?: boolean;
    verified_by?: string | null;
  }
): Promise<BoxCrossSkiAttempt> {
  const supabase = createServiceRoleClient();
  const { data: existing, error: fetchError } = await supabase
    .from("boxcross_ski_attempts")
    .select("*")
    .eq("id", attemptId)
    .eq("challenge_id", challenge.id)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!existing) throw new Error("Attempt not found");

  const merged: BoxCrossCreateAttemptInput = {
    athlete_name: patch.athlete_name ?? existing.athlete_name,
    category: patch.category ?? existing.category,
    time: patch.time ?? existing.time_ms,
    attempted_at: patch.attempted_at ?? existing.attempted_at,
    verification_method: patch.verification_method ?? existing.verification_method,
    verified: patch.verified ?? existing.verified,
    verified_by: patch.verified_by !== undefined ? patch.verified_by : existing.verified_by,
    proof_url: patch.proof_url !== undefined ? patch.proof_url : existing.proof_url,
    witness_name:
      patch.witness_name !== undefined ? patch.witness_name : existing.witness_name,
    internal_notes:
      patch.internal_notes !== undefined ? patch.internal_notes : existing.internal_notes,
    allow_outside_period: patch.allow_outside_period,
  };

  const validated = validateCreateInput(challenge, merged);
  if (!validated.ok) throw new Error(validated.error);

  const { data, error } = await supabase
    .from("boxcross_ski_attempts")
    .update({
      athlete_name: merged.athlete_name.trim(),
      category: merged.category,
      time_ms: validated.time_ms,
      attempted_at: new Date(merged.attempted_at).toISOString(),
      verification_method: merged.verification_method,
      verified: merged.verified ?? true,
      verified_by: merged.verified_by?.trim() || null,
      proof_url: merged.proof_url?.trim() || null,
      witness_name: merged.witness_name?.trim() || null,
      internal_notes: merged.internal_notes?.trim() || null,
    })
    .eq("id", attemptId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as BoxCrossSkiAttempt;
}

export async function deleteAttempt(attemptId: string, challengeId: string): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("boxcross_ski_attempts")
    .delete()
    .eq("id", attemptId)
    .eq("challenge_id", challengeId);
  if (error) throw new Error(error.message);
}

export async function markChallengeFinal(challengeId: string): Promise<BoxCrossSkiChallenge> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("boxcross_ski_challenges")
    .update({ status: "final" })
    .eq("id", challengeId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as BoxCrossSkiChallenge;
}
