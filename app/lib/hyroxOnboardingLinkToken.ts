import { createHmac, timingSafeEqual } from "node:crypto";

const HYROX_ONBOARDING_LINK_PURPOSE = "hyrox-onboarding-link" as const;
const HYROX_ONBOARDING_LINK_TTL_MS = 14 * 24 * 60 * 60 * 1000;

export type HyroxOnboardingLinkPayload = {
  athleteId: string;
  applicationId: string | null;
  email: string;
  athleteName: string;
  issuedAt: number;
  expiresAt: number;
  purpose: typeof HYROX_ONBOARDING_LINK_PURPOSE;
};

export type HyroxOnboardingLinkVerifyFailure =
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
      "HYROX_PORTAL_SIGNING_SECRET is required in production for onboarding links."
    );
  }
  return "dev-only-hyrox-onboarding-link-secret";
}

function signBody(bodyB64: string): string {
  return createHmac("sha256", getSigningSecret()).update(bodyB64).digest("base64url");
}

export function createHyroxOnboardingLinkToken(input: {
  athleteId: string;
  applicationId?: string | null;
  email: string;
  athleteName: string;
}): string {
  const now = Date.now();
  const payload: HyroxOnboardingLinkPayload = {
    athleteId: input.athleteId,
    applicationId: input.applicationId ?? null,
    email: input.email.trim().toLowerCase(),
    athleteName: input.athleteName.trim() || "Athlete",
    issuedAt: now,
    expiresAt: now + HYROX_ONBOARDING_LINK_TTL_MS,
    purpose: HYROX_ONBOARDING_LINK_PURPOSE,
  };
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${body}.${signBody(body)}`;
}

export function verifyHyroxOnboardingLinkToken(
  token: string | null | undefined
):
  | { ok: true; payload: HyroxOnboardingLinkPayload }
  | { ok: false; reason: HyroxOnboardingLinkVerifyFailure } {
  if (!token?.trim()) return { ok: false, reason: "missing" };
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

  let payload: HyroxOnboardingLinkPayload;
  try {
    payload = JSON.parse(
      Buffer.from(bodyB64, "base64url").toString("utf8")
    ) as HyroxOnboardingLinkPayload;
  } catch {
    return { ok: false, reason: "malformed" };
  }

  if (payload.purpose !== HYROX_ONBOARDING_LINK_PURPOSE) {
    return { ok: false, reason: "wrong-purpose" };
  }
  if (Date.now() > payload.expiresAt) {
    return { ok: false, reason: "expired" };
  }
  return { ok: true, payload };
}
