import crypto from "node:crypto";

const WEBHOOK_TOLERANCE_SEC = 300;

export type WhopWebhookSafeVerifyDebug = {
  webhookSecretExists: boolean;
  webhookIdHeaderExists: boolean;
  webhookTimestampHeaderExists: boolean;
  webhookSignatureHeaderExists: boolean;
  detectedSignatureFormat: string | null;
  timestampSkewSeconds: number | null;
  verificationFailureReason: WebhookVerifyFailureReason | null;
};

export type WebhookVerifyFailureReason =
  | "missing_secret"
  | "missing_headers"
  | "timestamp_out_of_range"
  | "bad_signature";

export type WebhookVerifyResult =
  | { ok: true }
  | {
      ok: false;
      reason: WebhookVerifyFailureReason;
      debug: WhopWebhookSafeVerifyDebug;
    };

export type WhopWebhookHeaders = {
  webhookId: string | null;
  webhookTimestamp: string | null;
  webhookSignature: string | null;
};

function getHeader(request: Request, ...names: string[]): string | null {
  for (const name of names) {
    const value = request.headers.get(name);
    if (value?.trim()) return value.trim();
  }
  return null;
}

/** Read Standard / Svix webhook headers (`webhook-*` and `svix-*`, case-insensitive). */
export function readStandardWebhookHeaders(request: Request): WhopWebhookHeaders {
  return {
    webhookId: getHeader(request, "webhook-id", "svix-id"),
    webhookTimestamp: getHeader(request, "webhook-timestamp", "svix-timestamp"),
    webhookSignature: getHeader(request, "webhook-signature", "svix-signature"),
  };
}

function tryBase64DecodeSecret(remainder: string): Buffer | null {
  try {
    const decoded = Buffer.from(remainder, "base64");
    if (decoded.length > 0) return decoded;
  } catch {
    /* fall through */
  }
  return null;
}

/**
 * Decode Standard Webhooks symmetric signing secret.
 * 1. `whsec_` / `ws_` prefix: strip and base64-decode remainder; on failure use UTF-8 of remainder.
 * 2. Otherwise: try base64-decode whole secret; on failure use UTF-8 of full trimmed secret.
 *
 * @see https://github.com/standard-webhooks/standard-webhooks
 */
export function decodeStandardWebhookSecret(raw: string): Buffer {
  const trimmed = raw.trim();

  for (const prefix of ["whsec_", "ws_"] as const) {
    if (trimmed.startsWith(prefix)) {
      const remainder = trimmed.slice(prefix.length);
      return tryBase64DecodeSecret(remainder) ?? Buffer.from(remainder, "utf8");
    }
  }

  return tryBase64DecodeSecret(trimmed) ?? Buffer.from(trimmed, "utf8");
}

/** Key material candidates for secrets stored in different dashboard formats. */
export function getWebhookSecretKeyCandidates(raw: string): Buffer[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  const keys: Buffer[] = [];
  const add = (buf: Buffer) => {
    if (buf.length === 0) return;
    if (!keys.some((k) => k.equals(buf))) keys.push(buf);
  };

  add(decodeStandardWebhookSecret(trimmed));

  if (!trimmed.startsWith("whsec_") && !trimmed.startsWith("ws_")) {
    add(Buffer.from(trimmed, "utf8"));
    const b64 = tryBase64DecodeSecret(trimmed);
    if (b64) add(b64);
  }

  return keys;
}

function padBase64UrlSafe(s: string): string {
  const t = s.replace(/-/g, "+").replace(/_/g, "/");
  const m = t.length % 4;
  if (m === 0) return t;
  return t + "=".repeat(4 - m);
}

function tryDecodeSignatureB64(b64: string): Buffer | null {
  const candidates = [b64.trim(), padBase64UrlSafe(b64.trim())];
  for (const c of candidates) {
    try {
      const buf = Buffer.from(c, "base64");
      if (buf.length > 0) return buf;
    } catch {
      /* continue */
    }
  }
  return null;
}

/** Constant-time compare of two UTF-8 strings (same length only). */
function timingSafeEqualUtf8Strings(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length || ba.length === 0) return false;
  try {
    return crypto.timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

export type ParsedWebhookSignature = {
  version: string;
  payload: string;
};

/**
 * Parse `webhook-signature` / `svix-signature` values:
 * space-separated `v1,<base64>` entries, comma-separated repeats, or mixed.
 */
export function parseWebhookSignatureHeader(sigHeader: string): ParsedWebhookSignature[] {
  const parsed: ParsedWebhookSignature[] = [];
  const seen = new Set<string>();

  const add = (version: string, payload: string) => {
    const v = version.trim().toLowerCase();
    const p = payload.trim();
    if (!v || !p) return;
    const key = `${v}:${p}`;
    if (seen.has(key)) return;
    seen.add(key);
    parsed.push({ version: v, payload: p });
  };

  const versioned = /(v\d+a?),([^,\s]+)/gi;
  let match: RegExpExecArray | null;
  while ((match = versioned.exec(sigHeader)) !== null) {
    add(match[1], match[2]);
  }
  if (parsed.length > 0) return parsed;

  for (const part of sigHeader.split(/\s+/).filter(Boolean)) {
    const comma = part.indexOf(",");
    if (comma === -1) continue;
    add(part.slice(0, comma), part.slice(comma + 1));
  }

  return parsed;
}

export function detectSignatureFormat(sigHeader: string | null): string | null {
  if (!sigHeader?.trim()) return null;
  const parts = parseWebhookSignatureHeader(sigHeader);
  if (parts.length === 0) return "unrecognized";
  const versions = [...new Set(parts.map((p) => p.version))];
  if (versions.length === 1) return versions[0]!;
  return versions.join("+");
}

export function buildWebhookVerifyDebug(params: {
  secret: string;
  headers: WhopWebhookHeaders;
  reason?: WebhookVerifyFailureReason | null;
  signatureFormat?: string | null;
  timestampSkewSeconds?: number | null;
}): WhopWebhookSafeVerifyDebug {
  const { secret, headers, reason = null } = params;
  return {
    webhookSecretExists: secret.trim().length > 0,
    webhookIdHeaderExists: Boolean(headers.webhookId),
    webhookTimestampHeaderExists: Boolean(headers.webhookTimestamp),
    webhookSignatureHeaderExists: Boolean(headers.webhookSignature),
    detectedSignatureFormat:
      params.signatureFormat ?? detectSignatureFormat(headers.webhookSignature),
    timestampSkewSeconds: params.timestampSkewSeconds ?? null,
    verificationFailureReason: reason,
  };
}

function verifyWithKey(
  key: Buffer,
  signedVariants: string[],
  signatures: ParsedWebhookSignature[],
  debug: WhopWebhookSafeVerifyDebug
): boolean {
  for (const signedContent of signedVariants) {
    const expectedDigest = crypto.createHmac("sha256", key).update(signedContent, "utf8").digest();
    const expectedB64 = expectedDigest.toString("base64");

    for (const { version, payload: sigPayload } of signatures) {
      if (version === "v1") {
        debug.detectedSignatureFormat = "v1";

        if (timingSafeEqualUtf8Strings(expectedB64, sigPayload)) {
          return true;
        }

        const theirBuf = tryDecodeSignatureB64(sigPayload);
        if (
          theirBuf &&
          theirBuf.length === expectedDigest.length &&
          crypto.timingSafeEqual(expectedDigest, theirBuf)
        ) {
          return true;
        }
      } else if (!debug.detectedSignatureFormat || debug.detectedSignatureFormat === "unrecognized") {
        debug.detectedSignatureFormat = version;
      }
    }
  }
  return false;
}

/**
 * Verify Standard Webhooks `v1` HMAC on `${webhookId}.${webhookTimestamp}.${rawBody}` (SHA-256).
 */
export function verifyStandardWebhookV1(params: {
  rawBody: string;
  headers: WhopWebhookHeaders;
  secret: string;
}): WebhookVerifyResult {
  const { rawBody, headers, secret } = params;
  const trimmedSecret = secret.trim();

  let debug = buildWebhookVerifyDebug({ secret, headers });

  if (!debug.webhookSecretExists) {
    debug = { ...debug, verificationFailureReason: "missing_secret" };
    return { ok: false, reason: "missing_secret", debug };
  }

  const id = headers.webhookId;
  const ts = headers.webhookTimestamp;
  const sigHeader = headers.webhookSignature;

  if (!id || !ts || !sigHeader) {
    debug = { ...debug, verificationFailureReason: "missing_headers" };
    return { ok: false, reason: "missing_headers", debug };
  }

  const now = Math.floor(Date.now() / 1000);
  const t = Number.parseInt(ts, 10);
  if (!Number.isFinite(t)) {
    debug = { ...debug, verificationFailureReason: "timestamp_out_of_range" };
    return { ok: false, reason: "timestamp_out_of_range", debug };
  }

  const skew = Math.abs(now - t);
  debug.timestampSkewSeconds = skew;
  if (skew > WEBHOOK_TOLERANCE_SEC) {
    debug = { ...debug, verificationFailureReason: "timestamp_out_of_range" };
    return { ok: false, reason: "timestamp_out_of_range", debug };
  }

  const parsedTs = String(t);
  const signedVariants = [`${id}.${parsedTs}.${rawBody}`];
  if (parsedTs !== ts.trim()) {
    signedVariants.push(`${id}.${ts}.${rawBody}`);
  }

  const signatures = parseWebhookSignatureHeader(sigHeader);
  debug.detectedSignatureFormat = detectSignatureFormat(sigHeader);

  const keyCandidates = getWebhookSecretKeyCandidates(trimmedSecret);
  for (const key of keyCandidates) {
    if (verifyWithKey(key, signedVariants, signatures, debug)) {
      return { ok: true };
    }
  }

  debug = { ...debug, verificationFailureReason: "bad_signature" };
  return { ok: false, reason: "bad_signature", debug };
}

export function logWhopWebhookVerifySafe(
  message: string,
  debug: WhopWebhookSafeVerifyDebug
): void {
  console.log(`[whop webhook verify] ${message}`, debug);
}
