import crypto from "node:crypto";

const WEBHOOK_TOLERANCE_SEC = 300;

/**
 * Decode Standard Webhooks symmetric signing secret (`whsec_<base64>`) or use raw bytes.
 * @see https://github.com/standard-webhooks/standard-webhooks
 */
export function decodeStandardWebhookSecret(raw: string): Buffer {
  const trimmed = raw.trim();
  if (trimmed.startsWith("whsec_")) {
    return Buffer.from(trimmed.slice("whsec_".length), "base64");
  }
  // Whop dashboard secrets may omit the prefix; try base64, else UTF-8.
  try {
    const asB64 = Buffer.from(trimmed, "base64");
    if (asB64.length >= 16) return asB64;
  } catch {
    /* ignore */
  }
  return Buffer.from(trimmed, "utf8");
}

export type WhopWebhookHeaders = {
  webhookId: string | null;
  webhookTimestamp: string | null;
  webhookSignature: string | null;
};

export function readStandardWebhookHeaders(request: Request): WhopWebhookHeaders {
  return {
    webhookId: request.headers.get("webhook-id"),
    webhookTimestamp: request.headers.get("webhook-timestamp"),
    webhookSignature: request.headers.get("webhook-signature"),
  };
}

/**
 * Verify Standard Webhooks `v1` HMAC signatures on `webhook-id.webhook-timestamp.rawBody`.
 * Returns false if headers missing, timestamp stale, or no signature matches.
 */
export function verifyStandardWebhookV1(params: {
  rawBody: string;
  headers: WhopWebhookHeaders;
  secret: string;
}): boolean {
  const { rawBody, headers, secret } = params;
  const id = headers.webhookId;
  const ts = headers.webhookTimestamp;
  const sigHeader = headers.webhookSignature;
  if (!id || !ts || !sigHeader) return false;

  const now = Math.floor(Date.now() / 1000);
  const t = Number.parseInt(ts, 10);
  if (!Number.isFinite(t) || Math.abs(now - t) > WEBHOOK_TOLERANCE_SEC) {
    return false;
  }

  const signedContent = `${id}.${ts}.${rawBody}`;
  const key = decodeStandardWebhookSecret(secret);
  const expectedMac = crypto.createHmac("sha256", key).update(signedContent, "utf8").digest("base64");

  const parts = sigHeader.split(/\s+/);
  for (const part of parts) {
    if (!part.startsWith("v1,")) continue;
    const theirB64 = part.slice(3).trim();
    try {
      const a = Buffer.from(expectedMac, "base64");
      const b = Buffer.from(theirB64, "base64");
      if (a.length === b.length && a.length > 0 && crypto.timingSafeEqual(a, b)) {
        return true;
      }
    } catch {
      /* invalid base64 */
    }
  }
  return false;
}
