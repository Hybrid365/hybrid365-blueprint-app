import { NextResponse } from "next/server";
import {
  extractWhopEmail,
  extractWhopEventId,
  extractWhopEventType,
  extractWhopMembershipId,
  mapWhopEventToMembershipStatus,
  type WhopWebhookPayload,
} from "@/app/lib/whopWebhook";
import {
  buildWhopMembershipFields,
  findAuthUserIdByEmail,
  isWhopWebhookEventProcessed,
  upsertPendingWhopMembership,
} from "@/app/lib/whopMembershipSync";
import { createServiceRoleClient } from "@/app/lib/supabaseAdmin";
import {
  buildWhopWebhookSafeVerifyLog,
  logWhopWebhookVerifySafe,
  readStandardWebhookHeaders,
  verifyWhopWebhookWithStandardWebhooks,
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

  logWhopWebhookVerifySafe(
    "incoming request",
    buildWhopWebhookSafeVerifyLog({ secret, headers: whHeaders })
  );

  if (isProduction() && !secret) {
    console.error("[whop webhook] WHOP_WEBHOOK_SECRET missing in production — refusing webhook");
    return NextResponse.json(
      { error: "Server misconfiguration: WHOP_WEBHOOK_SECRET not set" },
      { status: 503 }
    );
  }

  if (secret) {
    const verifyResult = verifyWhopWebhookWithStandardWebhooks({
      rawBody,
      headers: whHeaders,
      secret,
    });
    if (!verifyResult.ok) {
      logWhopWebhookVerifySafe("verification failed", verifyResult.log);
      console.error("[whop webhook] Signature verification failed", verifyResult.log);
      return NextResponse.json(
        { error: "invalid_signature", reason: verifyResult.reason },
        { status: 401 }
      );
    }
    logWhopWebhookVerifySafe("verification succeeded", verifyResult.log);
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

  if (webhookId && (await isWhopWebhookEventProcessed(admin, webhookId))) {
    logWhopSafe("duplicate delivery (idempotent skip)", { webhookId });
    return NextResponse.json({ ok: true, skipped: "duplicate_event" }, { status: 200 });
  }

  const whopFields = buildWhopMembershipFields({
    payload,
    email,
    status,
    webhookId,
    eventType,
  });

  const authLookup = await findAuthUserIdByEmail(admin, email);
  if (!authLookup.ok && authLookup.listError) {
    console.error("[whop webhook] auth.admin.listUsers error", { listError: authLookup.listError });
    return NextResponse.json({ error: "Auth lookup failed" }, { status: 500 });
  }

  if (!authLookup.ok || !authLookup.userId) {
    const pendingResult = await upsertPendingWhopMembership(admin, {
      email: whopFields.whop_email,
      ...whopFields,
    });

    if (!pendingResult.ok) {
      console.error("[whop webhook] pending_whop_memberships upsert failed", {
        message: pendingResult.message,
      });
      return NextResponse.json({ error: "Pending membership update failed" }, { status: 500 });
    }

    logWhopSafe("stored pending Whop membership (auth user not found yet)", {
      status,
      eventType: eventType ?? "(none)",
      webhookId: webhookId ?? "(none)",
    });
    return NextResponse.json({ ok: true, pending: true, status }, { status: 200 });
  }

  const userId = authLookup.userId;

  const { error: upsertError } = await admin.from("memberships").upsert(
    { user_id: userId, ...whopFields },
    { onConflict: "user_id" }
  );

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
