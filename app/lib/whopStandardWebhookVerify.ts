import { Webhook, WebhookVerificationError } from "standardwebhooks";

const WS_PREFIX = "ws_";

export type SecretPrefixDetected = "whsec" | "ws" | "none";

export type WebhookVerifyFailureReason =
  | "missing_secret"
  | "missing_headers"
  | "timestamp_out_of_range"
  | "bad_signature";

export type StandardWebhooksVerifyMethod =
  | "standardwebhooks_whsec"
  | "standardwebhooks_whop_btoa"
  | "standardwebhooks_raw_full"
  | "standardwebhooks_raw_ws_suffix";

export type WhopWebhookSafeVerifyLog = {
  hasSecret: boolean;
  hasWebhookId: boolean;
  hasWebhookTimestamp: boolean;
  hasWebhookSignature: boolean;
  secretPrefixDetected: SecretPrefixDetected;
  verificationMethodUsed: StandardWebhooksVerifyMethod | null;
  verificationMethodsTried: StandardWebhooksVerifyMethod[];
  verificationFailureReason: WebhookVerifyFailureReason | null;
};

export type WebhookVerifyResult =
  | { ok: true; log: WhopWebhookSafeVerifyLog }
  | {
      ok: false;
      reason: WebhookVerifyFailureReason;
      log: WhopWebhookSafeVerifyLog;
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

/** Read webhook headers (`webhook-*` and `svix-*`, case-insensitive). */
export function readStandardWebhookHeaders(request: Request): WhopWebhookHeaders {
  return {
    webhookId: getHeader(request, "webhook-id", "svix-id"),
    webhookTimestamp: getHeader(request, "webhook-timestamp", "svix-timestamp"),
    webhookSignature: getHeader(request, "webhook-signature", "svix-signature"),
  };
}

export function detectSecretPrefix(secret: string): SecretPrefixDetected {
  const trimmed = secret.trim();
  if (trimmed.startsWith("whsec_")) return "whsec";
  if (trimmed.startsWith(WS_PREFIX)) return "ws";
  return "none";
}

function verificationMethodsForPrefix(prefix: SecretPrefixDetected): StandardWebhooksVerifyMethod[] {
  switch (prefix) {
    case "whsec":
      return ["standardwebhooks_whsec", "standardwebhooks_whop_btoa"];
    case "ws":
      return [
        "standardwebhooks_raw_full",
        "standardwebhooks_raw_ws_suffix",
        "standardwebhooks_whop_btoa",
        "standardwebhooks_whsec",
      ];
    case "none":
      return ["standardwebhooks_whsec", "standardwebhooks_whop_btoa", "standardwebhooks_raw_full"];
  }
}

function createWebhookForMethod(
  method: StandardWebhooksVerifyMethod,
  secret: string
): Webhook | null {
  try {
    switch (method) {
      case "standardwebhooks_whsec":
        return new Webhook(secret);
      case "standardwebhooks_whop_btoa":
        return new Webhook(Buffer.from(secret, "utf8").toString("base64"));
      case "standardwebhooks_raw_full":
        return new Webhook(secret, { format: "raw" });
      case "standardwebhooks_raw_ws_suffix": {
        if (!secret.trim().startsWith(WS_PREFIX)) return null;
        return new Webhook(secret.trim().slice(WS_PREFIX.length), { format: "raw" });
      }
    }
  } catch {
    return null;
  }
}

function toStandardWebhookHeaders(headers: WhopWebhookHeaders): Record<string, string> | null {
  const { webhookId, webhookTimestamp, webhookSignature } = headers;
  if (!webhookId || !webhookTimestamp || !webhookSignature) return null;
  return {
    "webhook-id": webhookId,
    "webhook-timestamp": webhookTimestamp,
    "webhook-signature": webhookSignature,
  };
}

function mapVerificationError(error: unknown): WebhookVerifyFailureReason {
  if (error instanceof WebhookVerificationError) {
    const msg = error.message.toLowerCase();
    if (msg.includes("timestamp") || msg.includes("invalid signature headers")) {
      return "timestamp_out_of_range";
    }
    if (msg.includes("missing required headers")) {
      return "missing_headers";
    }
  }
  return "bad_signature";
}

export function buildWhopWebhookSafeVerifyLog(params: {
  secret: string;
  headers: WhopWebhookHeaders;
  verificationMethodUsed?: StandardWebhooksVerifyMethod | null;
  verificationMethodsTried?: StandardWebhooksVerifyMethod[];
  verificationFailureReason?: WebhookVerifyFailureReason | null;
}): WhopWebhookSafeVerifyLog {
  const { secret, headers } = params;
  return {
    hasSecret: secret.trim().length > 0,
    hasWebhookId: Boolean(headers.webhookId),
    hasWebhookTimestamp: Boolean(headers.webhookTimestamp),
    hasWebhookSignature: Boolean(headers.webhookSignature),
    secretPrefixDetected: detectSecretPrefix(secret),
    verificationMethodUsed: params.verificationMethodUsed ?? null,
    verificationMethodsTried: params.verificationMethodsTried ?? [],
    verificationFailureReason: params.verificationFailureReason ?? null,
  };
}

/**
 * Verify with the official `standardwebhooks` package.
 * Signed content: `${webhook-id}.${parsedTimestamp}.${rawBody}` (library behavior).
 */
export function verifyWhopWebhookWithStandardWebhooks(params: {
  rawBody: string;
  headers: WhopWebhookHeaders;
  secret: string;
}): WebhookVerifyResult {
  const { rawBody, headers, secret } = params;
  const trimmedSecret = secret.trim();
  const prefix = detectSecretPrefix(trimmedSecret);
  const methods = verificationMethodsForPrefix(prefix);

  const baseLog = buildWhopWebhookSafeVerifyLog({
    secret,
    headers,
    verificationMethodsTried: methods,
  });

  if (!baseLog.hasSecret) {
    return {
      ok: false,
      reason: "missing_secret",
      log: { ...baseLog, verificationFailureReason: "missing_secret" },
    };
  }

  const stdHeaders = toStandardWebhookHeaders(headers);
  if (!stdHeaders) {
    return {
      ok: false,
      reason: "missing_headers",
      log: { ...baseLog, verificationFailureReason: "missing_headers" },
    };
  }

  let lastReason: WebhookVerifyFailureReason = "bad_signature";

  for (const method of methods) {
    const wh = createWebhookForMethod(method, trimmedSecret);
    if (!wh) continue;

    try {
      wh.verify(rawBody, stdHeaders);
      return {
        ok: true,
        log: {
          ...baseLog,
          verificationMethodUsed: method,
          verificationFailureReason: null,
        },
      };
    } catch (error) {
      lastReason = mapVerificationError(error);
    }
  }

  return {
    ok: false,
    reason: lastReason,
    log: {
      ...baseLog,
      verificationFailureReason: lastReason,
    },
  };
}

export function logWhopWebhookVerifySafe(message: string, log: WhopWebhookSafeVerifyLog): void {
  console.log(`[whop webhook verify] ${message}`, log);
}
