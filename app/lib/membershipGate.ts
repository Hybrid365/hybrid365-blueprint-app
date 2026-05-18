import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isMembershipActive,
  MEMBERSHIP_ACCESS_SELECT,
  type MembershipForAccess,
} from "@/app/lib/membershipAccess";

export async function fetchMembershipForAccess(
  supabase: SupabaseClient,
  userId: string
): Promise<MembershipForAccess | null> {
  const { data, error } = await supabase
    .from("memberships")
    .select(MEMBERSHIP_ACCESS_SELECT)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[membership access] fetch failed", {
      code: error.code,
      message: error.message,
    });
    return null;
  }

  return (data as MembershipForAccess | null) ?? null;
}

export function assertMembershipAllowsDashboard(params: {
  membership: MembershipForAccess | null;
  userId: string;
}): { allowed: true } | { allowed: false } {
  if (isMembershipActive(params.membership)) {
    return { allowed: true };
  }

  console.log("[dashboard access] inactive membership", {
    userId: params.userId,
    status: params.membership?.status ?? null,
    hasExpiresAt: Boolean(params.membership?.expires_at),
  });

  return { allowed: false };
}
