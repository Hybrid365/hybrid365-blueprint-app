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

type PendingWhopRow = {
  id: string;
  email: string;
  whop_email: string | null;
  status: string;
  expires_at: string | null;
  whop_membership_id: string | null;
  whop_user_id: string | null;
  whop_plan_id: string | null;
  whop_product_id: string | null;
  last_whop_event_id: string | null;
  last_whop_event_type: string | null;
  last_whop_event_at: string | null;
};

const PENDING_SELECT =
  "id, email, whop_email, status, expires_at, whop_membership_id, whop_user_id, whop_plan_id, whop_product_id, last_whop_event_id, last_whop_event_type, last_whop_event_at";

export function normalizeWhopEmail(email: string): string {
  return email.trim().toLowerCase();
}

function pendingEmailMatchesUser(pending: PendingWhopRow, userEmail: string): boolean {
  const target = normalizeWhopEmail(userEmail);
  const keys = [pending.email, pending.whop_email].filter(Boolean) as string[];
  return keys.some((e) => normalizeWhopEmail(e) === target);
}

/**
 * Find unclaimed active pending row by normalized email or whop_email.
 */
export async function findActivePendingWhopMembership(
  admin: SupabaseClient,
  userEmail: string
): Promise<{ row: PendingWhopRow | null; lookupError?: string }> {
  const normalized = normalizeWhopEmail(userEmail);
  if (!normalized) return { row: null };

  const base = () =>
    admin
      .from("pending_whop_memberships")
      .select(PENDING_SELECT)
      .is("claimed_at", null)
      .eq("status", "active");

  const { data: byEmail, error: emailError } = await base().ilike("email", normalized);
  if (emailError) {
    return { row: null, lookupError: emailError.message };
  }

  let candidates = (byEmail ?? []) as PendingWhopRow[];

  const { data: byWhopEmail, error: whopEmailError } = await base().ilike("whop_email", normalized);
  if (whopEmailError) {
    const missingColumn =
      whopEmailError.message.includes("whop_email") &&
      whopEmailError.message.toLowerCase().includes("does not exist");
    if (!missingColumn) {
      return { row: null, lookupError: whopEmailError.message };
    }
  } else if (byWhopEmail?.length) {
    const seen = new Set(candidates.map((r) => r.id));
    for (const row of byWhopEmail as PendingWhopRow[]) {
      if (!seen.has(row.id)) candidates.push(row);
    }
  }

  const exact = candidates.find((row) => pendingEmailMatchesUser(row, normalized));
  if (exact) return { row: exact };

  return { row: null };
}

async function logNoPendingRowFound(admin: SupabaseClient, userEmail: string): Promise<void> {
  const normalized = normalizeWhopEmail(userEmail);
  const localPart = normalized.split("@")[0] ?? "";

  const { count: unclaimedActiveCount } = await admin
    .from("pending_whop_memberships")
    .select("id", { count: "exact", head: true })
    .is("claimed_at", null)
    .eq("status", "active");

  let similarEmailMatchCount = 0;
  if (localPart.length >= 3) {
    const { count: emailCount } = await admin
      .from("pending_whop_memberships")
      .select("id", { count: "exact", head: true })
      .is("claimed_at", null)
      .eq("status", "active")
      .ilike("email", `%${localPart}%`);
    similarEmailMatchCount = emailCount ?? 0;
    if (similarEmailMatchCount === 0) {
      const { count: whopCount } = await admin
        .from("pending_whop_memberships")
        .select("id", { count: "exact", head: true })
        .is("claimed_at", null)
        .eq("status", "active")
        .ilike("whop_email", `%${localPart}%`);
      similarEmailMatchCount = whopCount ?? 0;
    }
  }

  console.log("[whop claim] no pending row found for email", {
    unclaimedActiveCount: unclaimedActiveCount ?? 0,
    similarEmailMatchCount,
  });
}

/**
 * Apply unclaimed active pending Whop row to public.memberships when emails match.
 */
export async function claimPendingWhopMembershipForUser(
  admin: SupabaseClient,
  userId: string,
  email: string
): Promise<ClaimPendingWhopResult> {
  const normalized = normalizeWhopEmail(email);
  if (!normalized) return { claimed: false, activated: false };

  console.log("[whop claim] called for email", { hasEmail: true });

  const { row: pending, lookupError } = await findActivePendingWhopMembership(admin, email);

  if (lookupError) {
    console.error("[whop claim] pending lookup failed", { message: lookupError });
    return { claimed: false, activated: false };
  }

  if (!pending) {
    await logNoPendingRowFound(admin, email);
    return { claimed: false, activated: false };
  }

  if (pending.status !== "active") {
    console.log("[whop claim] no pending row found for email", {
      reason: "pending_not_active",
      pendingStatus: pending.status,
    });
    return { claimed: false, activated: false };
  }

  console.log("[whop claim] pending row found", { pendingId: pending.id });

  const nowIso = new Date().toISOString();
  const whopEmail = normalizeWhopEmail(pending.whop_email ?? pending.email);

  const membershipRow = {
    user_id: userId,
    status: "active" as const,
    source: "whop" as const,
    expires_at: pending.expires_at,
    whop_email: whopEmail,
    whop_membership_id: pending.whop_membership_id,
    whop_user_id: pending.whop_user_id,
    whop_plan_id: pending.whop_plan_id,
    whop_product_id: pending.whop_product_id,
    last_whop_event_id: pending.last_whop_event_id,
    last_whop_event_type: pending.last_whop_event_type,
    last_whop_event_at: pending.last_whop_event_at ?? nowIso,
    updated_at: nowIso,
  };

  const { error: upsertError } = await admin
    .from("memberships")
    .upsert(membershipRow, { onConflict: "user_id" });

  if (upsertError) {
    console.error("[whop claim] membership update failed", {
      code: upsertError.code,
      message: upsertError.message,
      details: upsertError.details,
      hint: upsertError.hint,
    });
    return { claimed: false, activated: false };
  }

  console.log("[whop claim] membership update success", { userId });

  const { error: claimError } = await admin
    .from("pending_whop_memberships")
    .update({
      claimed_at: nowIso,
      claimed_user_id: userId,
      updated_at: nowIso,
    })
    .eq("id", pending.id)
    .is("claimed_at", null);

  if (claimError) {
    console.error("[whop claim] pending row marked claimed failed", {
      code: claimError.code,
      message: claimError.message,
      details: claimError.details,
      hint: claimError.hint,
    });
  } else {
    console.log("[whop claim] pending row marked claimed", { pendingId: pending.id });
  }

  return { claimed: true, activated: true };
}

/**
 * Find auth user id by primary email (case-insensitive). Paginates admin listUsers.
 */
export async function findAuthUserIdByEmail(
  admin: SupabaseClient,
  email: string
): Promise<AuthLookupResult> {
  const target = normalizeWhopEmail(email);
  if (!target) return { ok: false, userId: null };

  let page = 1;
  const perPage = 1000;

  while (page <= MAX_USER_LIST_PAGES) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      return { ok: false, userId: null, listError: error.message };
    }
    const users = data?.users ?? [];
    const hit = users.find((u) => normalizeWhopEmail(u.email ?? "") === target);
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
  const email = normalizeWhopEmail(params.email);

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
  const { error } = await admin.from("pending_whop_memberships").upsert(
    {
      ...row,
      email: normalizeWhopEmail(row.email),
      whop_email: normalizeWhopEmail(row.whop_email),
    },
    { onConflict: "email" }
  );

  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true };
}
