/** Loose Whop / Standard Webhooks JSON payload. */
export type WhopWebhookPayload = Record<string, unknown>;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function pickString(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

/** Dot-path read on nested objects (any depth). */
export function getWhopValueAtPath(obj: unknown, path: string): unknown {
  const parts = path.split(".").filter(Boolean);
  let cur: unknown = obj;
  for (const part of parts) {
    if (!isRecord(cur)) return undefined;
    cur = cur[part];
  }
  return cur;
}

function normalizeWhopEmail(value: unknown): string | null {
  const raw = pickString(value);
  if (!raw || !raw.includes("@")) return null;
  return raw.toLowerCase();
}

/**
 * Accept full webhook payload or a bare `data` object (paths resolved on both).
 */
function whopLookupRoots(payload: WhopWebhookPayload): WhopWebhookPayload[] {
  const roots: WhopWebhookPayload[] = [payload];
  const data = isRecord(payload.data) ? payload.data : null;
  if (data) roots.push(data);
  return roots;
}

const EMAIL_DOT_PATHS_ON_PAYLOAD = [
  "data.user.email",
  "data.user.email_address",
  "data.email",
  "data.member.email",
  "data.customer.email",
  "data.membership.email",
  "data.user_email",
  "data.member_email",
  "user.email",
  "user.email_address",
  "email",
] as const;

const EMAIL_SEGMENTS_ON_ROOT = [
  ["user", "email"],
  ["user", "email_address"],
  ["email"],
  ["member", "email"],
  ["customer", "email"],
  ["membership", "email"],
] as const;

export function extractWhopEventType(payload: WhopWebhookPayload): string | null {
  return pickString(payload.type) ?? pickString(payload.event) ?? pickString(payload.name);
}

export function extractWhopEventId(payload: WhopWebhookPayload): string | null {
  const data = isRecord(payload.data) ? payload.data : null;
  return (
    pickString(payload.id) ??
    pickString((payload as { event_id?: unknown }).event_id) ??
    pickString((payload as { webhook_id?: unknown }).webhook_id) ??
    pickString(data?.id)
  );
}

export function extractWhopEmail(payload: WhopWebhookPayload): string | null {
  for (const dotPath of EMAIL_DOT_PATHS_ON_PAYLOAD) {
    const email = normalizeWhopEmail(getWhopValueAtPath(payload, dotPath));
    if (email) return email;
  }

  for (const root of whopLookupRoots(payload)) {
    for (const segments of EMAIL_SEGMENTS_ON_ROOT) {
      let cur: unknown = root;
      for (const seg of segments) {
        if (!isRecord(cur)) {
          cur = undefined;
          break;
        }
        cur = cur[seg];
      }
      const email = normalizeWhopEmail(cur);
      if (email) return email;
    }
  }

  return null;
}

export function extractWhopMembershipId(payload: WhopWebhookPayload): string | null {
  const data = isRecord(payload.data) ? payload.data : payload;
  if (!isRecord(data)) return null;
  return (
    pickString(data.id) ??
    pickString(data.membership_id) ??
    pickString(data.membershipId) ??
    pickString((data as { membership?: { id?: unknown } }).membership?.id)
  );
}

export function extractWhopUserId(payload: WhopWebhookPayload): string | null {
  const data = isRecord(payload.data) ? payload.data : payload;
  if (!isRecord(data)) return null;
  const user = isRecord(data.user) ? data.user : null;
  return (
    pickString(user?.id) ??
    pickString(data.user_id) ??
    pickString(data.userId) ??
    pickString((data as { member?: { id?: unknown } }).member?.id)
  );
}

export function extractWhopPlanId(payload: WhopWebhookPayload): string | null {
  const data = isRecord(payload.data) ? payload.data : payload;
  if (!isRecord(data)) return null;
  const plan = isRecord(data.plan) ? data.plan : null;
  return pickString(plan?.id) ?? pickString(data.plan_id) ?? pickString(data.planId);
}

export function extractWhopProductId(payload: WhopWebhookPayload): string | null {
  const data = isRecord(payload.data) ? payload.data : payload;
  if (!isRecord(data)) return null;
  const product = isRecord(data.product) ? data.product : null;
  return pickString(product?.id) ?? pickString(data.product_id) ?? pickString(data.productId);
}

/** ISO string or unix seconds from nested data. */
export function extractMembershipExpiresAt(payload: WhopWebhookPayload): string | null {
  const data = isRecord(payload.data) ? payload.data : payload;
  if (!isRecord(data)) return null;

  const candidates: unknown[] = [
    data.renewal_period_end,
    data.expires_at,
    data.expiresAt,
    data.valid_until,
    data.current_period_end,
    (data as { membership?: { expires_at?: unknown } }).membership?.expires_at,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
    if (typeof c === "number" && Number.isFinite(c)) {
      const ms = c < 1e12 ? c * 1000 : c;
      return new Date(ms).toISOString();
    }
  }
  return null;
}

export type MembershipGateStatus = "active" | "inactive";

/**
 * Map Whop / Standard Webhooks event names to dashboard membership status.
 * Returns null when the event should be acknowledged but not applied to membership.
 */
export function mapWhopEventToMembershipStatus(eventType: string | null): MembershipGateStatus | null {
  if (!eventType) return null;
  const t = eventType.toLowerCase().trim();

  if (t === "membership.activated" || t === "membership_activated") return "active";
  if (t === "membership.deactivated" || t === "membership_deactivated") return "inactive";

  return null;
}
