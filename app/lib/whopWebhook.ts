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

/** Walk shallow + one level of `data` for string fields. */
function collectStringPaths(obj: unknown, prefix = ""): Map<string, string> {
  const out = new Map<string, string>();
  if (!isRecord(obj)) return out;
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string" && v.trim()) out.set(path, v.trim());
    else if (isRecord(v)) {
      for (const [k2, v2] of Object.entries(v)) {
        const p2 = `${path}.${k2}`;
        if (typeof v2 === "string" && v2.trim()) out.set(p2, v2.trim());
      }
    }
  }
  return out;
}

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

const EMAIL_PATHS = [
  "data.email",
  "data.user.email",
  "data.member.email",
  "data.customer.email",
  "data.membership.email",
  "data.user_email",
  "data.member_email",
  "email",
  "user.email",
];

export function extractWhopEmail(payload: WhopWebhookPayload): string | null {
  const paths = collectStringPaths(payload);
  for (const p of EMAIL_PATHS) {
    const v = paths.get(p);
    if (v && v.includes("@")) return v.toLowerCase();
  }
  // Fallback: any leaf ending in .email
  for (const [path, val] of paths) {
    if (path.endsWith(".email") && val.includes("@")) return val.toLowerCase();
  }
  return null;
}

export function extractWhopMembershipId(payload: WhopWebhookPayload): string | null {
  const data = isRecord(payload.data) ? payload.data : null;
  return (
    pickString(data?.membership_id) ??
    pickString(data?.membershipId) ??
    pickString((data as { membership?: { id?: unknown } } | null)?.membership?.id) ??
    pickString(data?.id)
  );
}

export function extractWhopUserId(payload: WhopWebhookPayload): string | null {
  const data = isRecord(payload.data) ? payload.data : null;
  return (
    pickString(data?.user_id) ??
    pickString(data?.userId) ??
    pickString((data as { user?: { id?: unknown } } | null)?.user?.id) ??
    pickString((data as { member?: { id?: unknown } } | null)?.member?.id)
  );
}

export function extractWhopPlanId(payload: WhopWebhookPayload): string | null {
  const data = isRecord(payload.data) ? payload.data : null;
  const plan = data && isRecord((data as { plan?: unknown }).plan) ? (data as { plan: Record<string, unknown> }).plan : null;
  return pickString(data?.plan_id) ?? pickString(data?.planId) ?? pickString(plan?.id);
}

export function extractWhopProductId(payload: WhopWebhookPayload): string | null {
  const data = isRecord(payload.data) ? payload.data : null;
  const product =
    data && isRecord((data as { product?: unknown }).product)
      ? (data as { product: Record<string, unknown> }).product
      : null;
  return (
    pickString(data?.product_id) ??
    pickString(data?.productId) ??
    pickString(product?.id)
  );
}

/** ISO string or unix seconds from nested data. */
export function extractMembershipExpiresAt(payload: WhopWebhookPayload): string | null {
  const data = isRecord(payload.data) ? payload.data : null;
  const candidates: unknown[] = [
    data?.expires_at,
    data?.expiresAt,
    data?.valid_until,
    data?.current_period_end,
    (data as { membership?: { expires_at?: unknown } } | null)?.membership?.expires_at,
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
 *
 * v1 is intentionally minimal — extend here when invoice/payment payloads are validated.
 */
export function mapWhopEventToMembershipStatus(eventType: string | null): MembershipGateStatus | null {
  if (!eventType) return null;
  const t = eventType.toLowerCase().trim();

  if (t === "membership.activated" || t === "membership_activated") return "active";
  if (t === "membership.deactivated" || t === "membership_deactivated") return "inactive";

  return null;
}
