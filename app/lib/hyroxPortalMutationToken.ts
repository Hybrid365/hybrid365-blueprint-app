import { createHmac, timingSafeEqual } from "node:crypto";

export const HYROX_PORTAL_MUTATION_PURPOSE = "hyrox-athlete-mutation" as const;

/** Short-lived signed token for Hyrox athlete mutations when cookie auth is unreliable. */
export const HYROX_PORTAL_MUTATION_TOKEN_TTL_MS = 2 * 60 * 60 * 1000;

export type HyroxPortalMutationTokenPayload = {
  athleteId: string;
  authUserId: string | null;
  email: string | null;
  issuedAt: number;
  expiresAt: number;
  purpose: typeof HYROX_PORTAL_MUTATION_PURPOSE;
};

export type HyroxPortalMutationTokenVerifyFailure =
  | "missing"
  | "malformed"
  | "bad-signature"
  | "expired"
  | "wrong-purpose";

function getSigningSecret(): string {
  const secret = process.env.HYROX_PORTAL_SIGNING_SECRET?.trim();
  if (secret) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "HYROX_PORTAL_SIGNING_SECRET is required in production for Hyrox athlete mutations."
    );
  }

  if (process.env.NODE_ENV === "development") {
    console.warn(
      "[hyrox] HYROX_PORTAL_SIGNING_SECRET is not set — using dev-only fallback. Set it in .env.local."
    );
  }

  return "dev-only-hyrox-portal-mutation-signing-secret";
}

function signBody(bodyB64: string): string {
  return createHmac("sha256", getSigningSecret()).update(bodyB64).digest("base64url");
}

export function createHyroxPortalMutationToken(input: {
  athleteId: string;
  authUserId?: string | null;
  email?: string | null;
}): string {
  const now = Date.now();
  const payload: HyroxPortalMutationTokenPayload = {
    athleteId: input.athleteId,
    authUserId: input.authUserId ?? null,
    email: input.email?.trim().toLowerCase() ?? null,
    issuedAt: now,
    expiresAt: now + HYROX_PORTAL_MUTATION_TOKEN_TTL_MS,
    purpose: HYROX_PORTAL_MUTATION_PURPOSE,
  };

  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = signBody(body);
  return `${body}.${signature}`;
}

export function verifyHyroxPortalMutationToken(
  token: string | null | undefined
):
  | { ok: true; payload: HyroxPortalMutationTokenPayload }
  | { ok: false; reason: HyroxPortalMutationTokenVerifyFailure } {
  if (!token?.trim()) {
    return { ok: false, reason: "missing" };
  }

  const parts = token.trim().split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return { ok: false, reason: "malformed" };
  }

  const [bodyB64, signature] = parts;
  const expectedSig = signBody(bodyB64);
  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSig);
  if (
    sigBuf.length !== expectedBuf.length ||
    !timingSafeEqual(sigBuf, expectedBuf)
  ) {
    return { ok: false, reason: "bad-signature" };
  }

  let payload: HyroxPortalMutationTokenPayload;
  try {
    payload = JSON.parse(
      Buffer.from(bodyB64, "base64url").toString("utf8")
    ) as HyroxPortalMutationTokenPayload;
  } catch {
    return { ok: false, reason: "malformed" };
  }

  if (payload.purpose !== HYROX_PORTAL_MUTATION_PURPOSE) {
    return { ok: false, reason: "wrong-purpose" };
  }

  if (!payload.athleteId?.trim()) {
    return { ok: false, reason: "malformed" };
  }

  if (Date.now() > payload.expiresAt) {
    return { ok: false, reason: "expired" };
  }

  return { ok: true, payload };
}
