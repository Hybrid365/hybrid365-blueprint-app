import type { SupabaseClient } from "@supabase/supabase-js";
import { accessStartedAtForActivation } from "@/app/lib/membershipAccess";
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

const PENDING_FETCH_LIMIT = 50;

export const WHOP_CLAIM_VERSION = "claim-fix-2026-05-18b";

export function normalizeEmail(v: unknown): string {
  return String(v ?? "").trim().toLowerCase();
}

/**
 * Canonical key for claim matching. Auth/session may deliver '+' as space in the local part;
 * DB/Whop store '+'. Collapse local-part whitespace to '+' before compare.
 */
export function emailMatchKey(v: unknown): string {
  const n = normalizeEmail(v);
  const at = n.indexOf("@");
  if (at <= 0) return n;
  const local = n.slice(0, at).replace(/\s+/g, "+");
  const domain = n.slice(at + 1);
  return `${local}@${domain}`;
}

/** @deprecated Use normalizeEmail */
export function normalizeWhopEmail(email: string): string {
  return normalizeEmail(email);
}

function maskEmailForLog(email: string): string {
  const normalized = normalizeEmail(email);
  const at = normalized.indexOf("@");
  if (at <= 0) return "***";
  const local = normalized.slice(0, at);
  const domain = normalized.slice(at + 1);
  const plusIdx = local.indexOf("+");
  if (plusIdx >= 0) {
    const afterPlus = local.slice(plusIdx + 1, plusIdx + 5);
    return `${local.slice(0, 2)}+${afterPlus}…@${domain}`;
  }
  const spaceIdx = local.indexOf(" ");
  if (spaceIdx >= 0) {
    return `${local.slice(0, 2)}_${local.slice(spaceIdx + 1, spaceIdx + 5)}…@${domain}`;
  }
  return `${local.slice(0, Math.min(2, local.length))}…@${domain}`;
}

function emailDebugAlias(email: string) {
  const normalized = normalizeEmail(email);
  const at = normalized.indexOf("@");
  const local = at > 0 ? normalized.slice(0, at) : normalized;
  return {
    masked: maskEmailForLog(normalized),
    length: normalized.length,
    localLength: local.length,
    hasPlus: local.includes("+"),
    hasSpace: local.includes(" "),
  };
}

/**
 * Fetch unclaimed active pending rows (match email in JS — avoids PostgREST `+` / ilike issues).
 */
export async function fetchUnclaimedActivePendingRows(
  admin: SupabaseClient
): Promise<{ candidates: PendingWhopRow[]; lookupError?: string }> {
  const { data, error } = await admin
    .from("pending_whop_memberships")
    .select(PENDING_SELECT)
    .eq("status", "active")
    .is("claimed_at", null)
    .is("claimed_user_id", null)
    .limit(PENDING_FETCH_LIMIT);

  if (error) {
    return { candidates: [], lookupError: error.message };
  }

  return { candidates: (data ?? []) as PendingWhopRow[] };
}

function logNoPendingRowFound(
  normalizedSignedInEmail: string,
  candidates: PendingWhopRow[],
  unclaimedActiveCount: number
): void {
  console.log("[whop claim] no pending row found for email", {
    unclaimedActiveCount,
    candidateCount: candidates.length,
    signedInEmail: emailDebugAlias(normalizedSignedInEmail),
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
  console.log(`[whop claim] version = "${WHOP_CLAIM_VERSION}"`);

  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return { claimed: false, activated: false };

  console.log("[whop claim] called for email", {
    signedInEmail: emailDebugAlias(normalizedEmail),
  });

  const { candidates, lookupError } = await fetchUnclaimedActivePendingRows(admin);

  if (lookupError) {
    console.error("[whop claim] pending lookup failed", { message: lookupError });
    return { claimed: false, activated: false };
  }

  const signedInKey = emailMatchKey(normalizedEmail);

  for (const row of candidates) {
    const candidateEmail = normalizeEmail(row.email);
    const candidateWhopEmail = normalizeEmail(row.whop_email);
    const candidateEmailKey = emailMatchKey(row.email);
    const candidateWhopEmailKey = emailMatchKey(row.whop_email);
    const exactEmailMatch = candidateEmail === normalizedEmail;
    const exactWhopEmailMatch =
      candidateWhopEmail.length > 0 && candidateWhopEmail === normalizedEmail;
    const emailMatch = candidateEmailKey === signedInKey;
    const whopEmailMatch =
      candidateWhopEmailKey.length > 0 && candidateWhopEmailKey === signedInKey;

    console.log("[whop claim] candidate compare", {
      pendingId: row.id,
      signedInEmail: emailDebugAlias(normalizedEmail),
      candidateEmail: emailDebugAlias(candidateEmail),
      candidateWhopEmail: row.whop_email ? emailDebugAlias(candidateWhopEmail) : null,
      exactEmailMatch,
      exactWhopEmailMatch,
      emailMatch,
      whopEmailMatch,
    });
  }

  const pending =
    candidates.find(
      (row) =>
        emailMatchKey(row.email) === signedInKey ||
        emailMatchKey(row.whop_email) === signedInKey
    ) ?? null;

  if (!pending) {
    const { count: unclaimedActiveCount } = await admin
      .from("pending_whop_memberships")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .is("claimed_at", null)
      .is("claimed_user_id", null);

    logNoPendingRowFound(normalizedEmail, candidates, unclaimedActiveCount ?? 0);
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
  const whopEmail = normalizeEmail(pending.whop_email || pending.email);

  const { data: existingMembership } = await admin
    .from("memberships")
    .select("access_started_at")
    .eq("user_id", userId)
    .maybeSingle();

  const accessStarted = accessStartedAtForActivation(
    existingMembership as { access_started_at?: string | null } | null,
    nowIso
  );

  const membershipUpdate = {
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
    ...(accessStarted ? { access_started_at: accessStarted } : {}),
  };

  const membershipInsert = {
    user_id: userId,
    ...membershipUpdate,
  };

  const { data: updatedRows, error: updateError } = await admin
    .from("memberships")
    .update(membershipUpdate)
    .eq("user_id", userId)
    .select("user_id");

  if (updateError) {
    console.error("[whop claim] membership update failed", {
      code: updateError.code,
      message: updateError.message,
      details: updateError.details,
      hint: updateError.hint,
    });
    return { claimed: false, activated: false };
  }

  if (!updatedRows?.length) {
    const { error: insertError } = await admin.from("memberships").insert(membershipInsert);

    if (insertError) {
      console.error("[whop claim] insert fallback failure", {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
      });
      return { claimed: false, activated: false };
    }

    console.log("[whop claim] insert fallback success", { userId });
  } else {
    console.log("[whop claim] membership update success", { userId });
  }

  const { data: membershipAfter, error: verifyError } = await admin
    .from("memberships")
    .select("status, expires_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (verifyError) {
    console.error("[whop claim] membership verify failed", {
      code: verifyError.code,
      message: verifyError.message,
      details: verifyError.details,
      hint: verifyError.hint,
    });
    return { claimed: false, activated: false };
  }

  const activated = isMembershipCurrentlyActive({
    status: String(membershipAfter?.status ?? ""),
    expires_at: membershipAfter?.expires_at ? String(membershipAfter.expires_at) : null,
  });

  if (!activated) {
    console.error("[whop claim] membership verify failed", {
      reason: "membership_not_active_after_claim",
      status: membershipAfter?.status ?? null,
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

  return { claimed: true, activated };
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
