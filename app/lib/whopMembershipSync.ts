import type { SupabaseClient } from "@supabase/supabase-js";
import {
  extractMembershipExpiresAt,
  extractWhopMembershipId,
  extractWhopPlanId,
  extractWhopProductId,
  extractWhopUserId,
  type MembershipGateStatus,
  type WhopWebhookPayload,
} from "@/app/lib/whopWebhook";

const MAX_USER_LIST_PAGES = 25;

export type AuthLookupResult =
  | { ok: true; userId: string }
  | { ok: false; userId: null; listError?: string };

export type WhopMembershipRowFields = {
  status: MembershipGateStatus;
  source: "whop";
  expires_at: string | null;
  whop_membership_id: string | null;
  whop_user_id: string | null;
  whop_email: string;
  whop_plan_id: string | null;
  whop_product_id: string | null;
  last_whop_event_id: string | null;
  last_whop_event_type: string | null;
  last_whop_event_at: string;
  updated_at: string;
};

export type PendingWhopMembershipRow = WhopMembershipRowFields & {
  email: string;
};

export type ClaimPendingWhopResult = {
  claimed: boolean;
  activated: boolean;
};

/**
 * Find auth user id by primary email (case-insensitive). Paginates admin listUsers.
 */
export async function findAuthUserIdByEmail(
  admin: SupabaseClient,
  email: string
): Promise<AuthLookupResult> {
  const target = email.trim().toLowerCase();
  if (!target) return { ok: false, userId: null };

  let page = 1;
  const perPage = 1000;

  while (page <= MAX_USER_LIST_PAGES) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      return { ok: false, userId: null, listError: error.message };
    }
    const users = data?.users ?? [];
    const hit = users.find((u) => (u.email ?? "").toLowerCase() === target);
    if (hit?.id) return { ok: true, userId: hit.id };
    if (users.length < perPage) break;
    page += 1;
  }

  return { ok: false, userId: null };
}

export function buildWhopMembershipFields(params: {
  payload: WhopWebhookPayload;
  email: string;
  status: MembershipGateStatus;
  webhookId: string | null;
  eventType: string | null;
  nowIso?: string;
}): WhopMembershipRowFields {
  const nowIso = params.nowIso ?? new Date().toISOString();
  const email = params.email.trim().toLowerCase();

  return {
    status: params.status,
    source: "whop",
    expires_at: extractMembershipExpiresAt(params.payload),
    whop_membership_id: extractWhopMembershipId(params.payload),
    whop_user_id: extractWhopUserId(params.payload),
    whop_email: email,
    whop_plan_id: extractWhopPlanId(params.payload),
    whop_product_id: extractWhopProductId(params.payload),
    last_whop_event_id: params.webhookId,
    last_whop_event_type: params.eventType,
    last_whop_event_at: nowIso,
    updated_at: nowIso,
  };
}

export function isMembershipCurrentlyActive(params: {
  status: string;
  expires_at: string | null;
}): boolean {
  if (params.status !== "active") return false;
  if (!params.expires_at) return true;
  const expiresAt = new Date(params.expires_at);
  return !Number.isNaN(expiresAt.getTime()) && expiresAt > new Date();
}

/**
 * Apply unclaimed pending Whop row to public.memberships when emails match.
 */
export async function claimPendingWhopMembershipForUser(
  admin: SupabaseClient,
  userId: string,
  email: string
): Promise<ClaimPendingWhopResult> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return { claimed: false, activated: false };

  const { data: pending, error } = await admin
    .from("pending_whop_memberships")
    .select(
      "email, status, expires_at, whop_membership_id, whop_user_id, whop_plan_id, whop_product_id, last_whop_event_id, last_whop_event_type, last_whop_event_at"
    )
    .eq("email", normalized)
    .is("claimed_at", null)
    .maybeSingle();

  if (error) {
    console.error("[whop claim] pending lookup failed", {
      code: error.code,
      message: error.message,
    });
    return { claimed: false, activated: false };
  }

  if (!pending) return { claimed: false, activated: false };

  const nowIso = new Date().toISOString();
  const activated = isMembershipCurrentlyActive({
    status: String(pending.status),
    expires_at: pending.expires_at ? String(pending.expires_at) : null,
  });

  const membershipRow = {
    user_id: userId,
    status: pending.status,
    source: "whop",
    expires_at: pending.expires_at,
    whop_membership_id: pending.whop_membership_id,
    whop_user_id: pending.whop_user_id,
    whop_email: normalized,
    whop_plan_id: pending.whop_plan_id,
    whop_product_id: pending.whop_product_id,
    last_whop_event_id: pending.last_whop_event_id,
    last_whop_event_type: pending.last_whop_event_type,
    last_whop_event_at: pending.last_whop_event_at,
    updated_at: nowIso,
  };

  const { error: upsertError } = await admin
    .from("memberships")
    .upsert(membershipRow, { onConflict: "user_id" });

  if (upsertError) {
    console.error("[whop claim] memberships upsert failed", {
      code: upsertError.code,
      message: upsertError.message,
    });
    return { claimed: false, activated: false };
  }

  const { error: claimError } = await admin
    .from("pending_whop_memberships")
    .update({
      claimed_at: nowIso,
      claimed_user_id: userId,
      updated_at: nowIso,
    })
    .eq("email", normalized)
    .is("claimed_at", null);

  if (claimError) {
    console.error("[whop claim] pending mark claimed failed", {
      code: claimError.code,
      message: claimError.message,
    });
  }

  return { claimed: true, activated };
}

export async function isWhopWebhookEventProcessed(
  admin: SupabaseClient,
  webhookId: string
): Promise<boolean> {
  const [{ data: membershipHit }, { data: pendingHit }] = await Promise.all([
    admin.from("memberships").select("user_id").eq("last_whop_event_id", webhookId).maybeSingle(),
    admin
      .from("pending_whop_memberships")
      .select("email")
      .eq("last_whop_event_id", webhookId)
      .maybeSingle(),
  ]);

  return Boolean(membershipHit?.user_id ?? pendingHit?.email);
}

export async function upsertPendingWhopMembership(
  admin: SupabaseClient,
  row: PendingWhopMembershipRow
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { error } = await admin.from("pending_whop_memberships").upsert(row, {
    onConflict: "email",
  });

  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true };
}
