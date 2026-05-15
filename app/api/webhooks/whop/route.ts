import { NextResponse } from "next/server";
import {
  extractMembershipExpiresAt,
  extractWhopEmail,
  extractWhopEventId,
  extractWhopEventType,
  extractWhopMembershipId,
  extractWhopPlanId,
  extractWhopProductId,
  extractWhopUserId,
  mapWhopEventToMembershipStatus,
  type WhopWebhookPayload,
} from "@/app/lib/whopWebhook";
import { findAuthUserIdByEmail } from "@/app/lib/whopMembershipSync";
import { createServiceRoleClient } from "@/app/lib/supabaseAdmin";
import {
  buildWebhookVerifyDebug,
  logWhopWebhookVerifySafe,
  readStandardWebhookHeaders,
  verifyStandardWebhookV1,
} from "@/app/lib/whopStandardWebhookVerify";

export const runtime = "nodejs";

function isProduction(): boolean {
  return process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
}

function logWhopSafe(message: string, meta: Record<string, unknown>) {
  const safe = { ...meta };
  for (const k of Object.keys(safe)) {
    if (typeof safe[k] === "string" && (k.includes("secret") || k.includes("authorization"))) {
      safe[k] = "[redacted]";
    }
  }
  console.log(`[whop webhook] ${message}`, safe);
}

export async function POST(request: Request) {
  if (request.method !== "POST") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  }

  const rawBody = await request.text();
  const whHeaders = readStandardWebhookHeaders(request);
  const webhookIdHeader = whHeaders.webhookId;
  const secret = process.env.WHOP_WEBHOOK_SECRET?.trim() ?? "";
  const preVerifyDebug = buildWebhookVerifyDebug({ secret, headers: whHeaders });

  logWhopWebhookVerifySafe("incoming request", preVerifyDebug);

  if (isProduction() && !secret) {
    console.error("[whop webhook] WHOP_WEBHOOK_SECRET missing in production — refusing webhook");
    return NextResponse.json(
      { error: "Server misconfiguration: WHOP_WEBHOOK_SECRET not set" },
      { status: 503 }
    );
  }

  if (secret) {
    const verifyResult = verifyStandardWebhookV1({ rawBody, headers: whHeaders, secret });
    if (!verifyResult.ok) {
      logWhopWebhookVerifySafe("verification failed", verifyResult.debug);
      console.error("[whop webhook] Signature verification failed", verifyResult.debug);
      return NextResponse.json(
        { error: "invalid_signature", reason: verifyResult.reason },
        { status: 401 }
      );
    }
    logWhopWebhookVerifySafe("verification succeeded", verifyResult.debug);
  } else {
    console.warn(
      "[whop webhook] WHOP_WEBHOOK_SECRET not set — signature NOT verified (non-production only). TODO: set secret before production traffic."
    );
  }

  let payload: WhopWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as WhopWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const eventType = extractWhopEventType(payload);
  const eventIdBody = extractWhopEventId(payload);
  const webhookId = webhookIdHeader ?? eventIdBody ?? null;
  const email = extractWhopEmail(payload);
  const membershipId = extractWhopMembershipId(payload);

  logWhopSafe("received", {
    eventType: eventType ?? "(none)",
    webhookId: webhookId ?? "(none)",
    emailFound: Boolean(email),
    membershipId: membershipId ?? "(none)",
  });

  if (!email) {
    console.warn("[whop webhook] No email in payload — skipping membership update (test or thin payload OK)");
    return NextResponse.json({ ok: true, skipped: "no_email" }, { status: 200 });
  }

  const status = mapWhopEventToMembershipStatus(eventType);
  if (status === null) {
    logWhopSafe("ignored event type (no membership mapping)", { eventType: eventType ?? "(none)" });
    return NextResponse.json({ ok: true, skipped: "unmapped_event" }, { status: 200 });
  }

  let admin;
  try {
    admin = createServiceRoleClient();
  } catch (e) {
    console.error("[whop webhook] Admin client init failed", e);
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 503 });
  }

  if (webhookId) {
    const { data: dup } = await admin
      .from("memberships")
      .select("user_id")
      .eq("last_whop_event_id", webhookId)
      .maybeSingle();
    if (dup?.user_id) {
      logWhopSafe("duplicate delivery (idempotent skip)", { webhookId });
      return NextResponse.json({ ok: true, skipped: "duplicate_event" }, { status: 200 });
    }
  }

  const authLookup = await findAuthUserIdByEmail(admin, email);
  if (!authLookup.ok && authLookup.listError) {
    console.error("[whop webhook] auth.admin.listUsers error", { listError: authLookup.listError });
    return NextResponse.json({ error: "Auth lookup failed" }, { status: 500 });
  }

  if (!authLookup.ok || !authLookup.userId) {
    console.warn(
      "[whop webhook] Whop member email not found in auth.users yet. User must sign in once with the same email, or run a backfill/sync.",
      { emailHint: `${email.slice(0, 2)}…@${email.split("@")[1] ?? "?"}` }
    );
    return NextResponse.json({ ok: true, skipped: "auth_user_not_found" }, { status: 200 });
  }

  const userId = authLookup.userId;

  const expiresAt = extractMembershipExpiresAt(payload);
  const nowIso = new Date().toISOString();

  const row: Record<string, unknown> = {
    user_id: userId,
    status,
    source: "whop",
    expires_at: expiresAt,
    whop_membership_id: membershipId,
    whop_user_id: extractWhopUserId(payload),
    whop_email: email,
    whop_plan_id: extractWhopPlanId(payload),
    whop_product_id: extractWhopProductId(payload),
    last_whop_event_id: webhookId,
    last_whop_event_type: eventType,
    last_whop_event_at: nowIso,
    updated_at: nowIso,
  };

  const { error: upsertError } = await admin.from("memberships").upsert(row, { onConflict: "user_id" });

  if (upsertError) {
    console.error("[whop webhook] memberships upsert failed", {
      code: upsertError.code,
      message: upsertError.message,
      details: upsertError.details,
    });
    return NextResponse.json({ error: "Membership update failed" }, { status: 500 });
  }

  logWhopSafe("membership updated", {
    userId,
    status,
    eventType,
    webhookId: webhookId ?? "(none)",
  });

  return NextResponse.json({ ok: true, status }, { status: 200 });
}
