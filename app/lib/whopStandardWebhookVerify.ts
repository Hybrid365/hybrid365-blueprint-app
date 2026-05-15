import crypto from "node:crypto";

const WEBHOOK_TOLERANCE_SEC = 300;

export type SecretDecodingCandidateLabel =
  | "whsec_base64_candidate"
  | "utf8_candidate"
  | "plain_base64_candidate";

export type WhopWebhookSafeVerifyDebug = {
  webhookSecretExists: boolean;
  webhookIdHeaderExists: boolean;
  webhookTimestampHeaderExists: boolean;
  webhookSignatureHeaderExists: boolean;
  detectedSignatureFormat: string | null;
  timestampSkewSeconds: number | null;
  verificationFailureReason: WebhookVerifyFailureReason | null;
  secretDecodingCandidateUsed: SecretDecodingCandidateLabel | null;
  secretDecodingCandidatesTried: SecretDecodingCandidateLabel[];
  expectedSignatureLength: number | null;
  providedSignatureLength: number | null;
};

export type WebhookVerifyFailureReason =
  | "missing_secret"
  | "missing_headers"
  | "timestamp_out_of_range"
  | "bad_signature";

export type WebhookVerifyResult =
  | { ok: true; debug: WhopWebhookSafeVerifyDebug }
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
 * Standard Webhooks symmetric secret: strip `whsec_` / `ws_`, then base64-decode.
 * @see https://github.com/standard-webhooks/standard-webhooks
 */
export function decodeStandardWebhookSecret(raw: string): Buffer {
  const trimmed = raw.trim();

  for (const prefix of ["whsec_", "ws_"] as const) {
    if (trimmed.startsWith(prefix)) {
      const remainder = trimmed.slice(prefix.length);
      const decoded = tryBase64DecodeSecret(remainder);
      if (!decoded) {
        throw new Error("Invalid whsec secret: base64 decode failed");
      }
      return decoded;
    }
  }

  const decoded = tryBase64DecodeSecret(trimmed);
  if (!decoded) {
    throw new Error("Invalid webhook secret: base64 decode failed");
  }
  return decoded;
}

export type SecretKeyCandidate = {
  label: SecretDecodingCandidateLabel;
  key: Buffer;
};

/**
 * Key candidates aligned with Standard Webhooks:
 * - `whsec_` / `ws_`: base64-decode after prefix only (no UTF-8 fallback).
 * - No prefix: base64-decode whole secret; if that fails, UTF-8 (Whop SDK btoa(env) path).
 */
export function getWebhookSecretKeyCandidates(raw: string): SecretKeyCandidate[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  const candidates: SecretKeyCandidate[] = [];
  const add = (label: SecretDecodingCandidateLabel, key: Buffer) => {
    if (key.length === 0) return;
    if (!candidates.some((c) => c.label === label && c.key.equals(key))) {
      candidates.push({ label, key });
    }
  };

  if (trimmed.startsWith("whsec_") || trimmed.startsWith("ws_")) {
    const prefix = trimmed.startsWith("whsec_") ? "whsec_" : "ws_";
    const remainder = trimmed.slice(prefix.length);
    const decoded = tryBase64DecodeSecret(remainder);
    if (decoded) add("whsec_base64_candidate", decoded);
    return candidates;
  }

  const decoded = tryBase64DecodeSecret(trimmed);
  if (decoded) add("plain_base64_candidate", decoded);
  add("utf8_candidate", Buffer.from(trimmed, "utf8"));

  return candidates;
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

function firstV1SignaturePayload(signatures: ParsedWebhookSignature[]): string | null {
  return signatures.find((s) => s.version === "v1")?.payload ?? null;
}

function computeSignatureLengthDebug(
  signedVariants: string[],
  key: Buffer,
  providedPayload: string | null
): Pick<WhopWebhookSafeVerifyDebug, "expectedSignatureLength" | "providedSignatureLength"> {
  let expectedSignatureLength: number | null = null;
  if (signedVariants.length > 0) {
    const expectedB64 = crypto
      .createHmac("sha256", key)
      .update(signedVariants[0]!, "utf8")
      .digest("base64");
    expectedSignatureLength = expectedB64.length;
  }

  const providedSignatureLength = providedPayload ? providedPayload.length : null;

  return { expectedSignatureLength, providedSignatureLength };
}

export function buildWebhookVerifyDebug(params: {
  secret: string;
  headers: WhopWebhookHeaders;
  reason?: WebhookVerifyFailureReason | null;
  signatureFormat?: string | null;
  timestampSkewSeconds?: number | null;
  secretDecodingCandidateUsed?: SecretDecodingCandidateLabel | null;
  secretDecodingCandidatesTried?: SecretDecodingCandidateLabel[];
  expectedSignatureLength?: number | null;
  providedSignatureLength?: number | null;
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
    secretDecodingCandidateUsed: params.secretDecodingCandidateUsed ?? null,
    secretDecodingCandidatesTried: params.secretDecodingCandidatesTried ?? [],
    expectedSignatureLength: params.expectedSignatureLength ?? null,
    providedSignatureLength: params.providedSignatureLength ?? null,
  };
}

function verifyWithKey(
  key: Buffer,
  signedVariants: string[],
  signatures: ParsedWebhookSignature[]
): boolean {
  for (const signedContent of signedVariants) {
    const expectedDigest = crypto.createHmac("sha256", key).update(signedContent, "utf8").digest();
    const expectedB64 = expectedDigest.toString("base64");

    for (const { version, payload: sigPayload } of signatures) {
      if (version !== "v1") continue;

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
  const providedPayload = firstV1SignaturePayload(signatures);

  const keyCandidates = getWebhookSecretKeyCandidates(trimmedSecret);
  const candidatesTried: SecretDecodingCandidateLabel[] =
    keyCandidates.length > 0
      ? keyCandidates.map((c) => c.label)
      : trimmedSecret.startsWith("whsec_") || trimmedSecret.startsWith("ws_")
        ? ["whsec_base64_candidate"]
        : ["plain_base64_candidate", "utf8_candidate"];

  if (keyCandidates.length === 0) {
    debug = {
      ...debug,
      verificationFailureReason: "bad_signature",
      secretDecodingCandidatesTried: candidatesTried,
      providedSignatureLength: providedPayload?.length ?? null,
    };
    return { ok: false, reason: "bad_signature", debug };
  }

  for (const { label, key } of keyCandidates) {
    if (verifyWithKey(key, signedVariants, signatures)) {
      debug = {
        ...debug,
        secretDecodingCandidateUsed: label,
        secretDecodingCandidatesTried: candidatesTried,
        ...computeSignatureLengthDebug(signedVariants, key, providedPayload),
        verificationFailureReason: null,
      };
      return { ok: true, debug };
    }
  }

  const primary = keyCandidates[0]!;
  const lengthDebug = computeSignatureLengthDebug(signedVariants, primary.key, providedPayload);

  debug = {
    ...debug,
    verificationFailureReason: "bad_signature",
    secretDecodingCandidatesTried: candidatesTried,
    ...lengthDebug,
  };
  return { ok: false, reason: "bad_signature", debug };
}

export function logWhopWebhookVerifySafe(
  message: string,
  debug: WhopWebhookSafeVerifyDebug
): void {
  console.log(`[whop webhook verify] ${message}`, debug);
}
