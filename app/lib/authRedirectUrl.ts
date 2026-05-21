/**
 * Auth redirect URLs for magic-link sign-in.
 * Must match Supabase Dashboard → Authentication → URL Configuration → Redirect URLs.
 */

/** Default post-login destination for community members (no ?next=). */
export const AUTH_DEFAULT_NEXT = "/dashboard";

/** Default post-login destination for Hyrox Team athlete login (no ?next=). */
export const AUTH_ATHLETE_DEFAULT_NEXT = "/athlete/onboarding";

const ATHLETE_LOGIN_PATH = "/athlete/login";

export function sanitizeAuthNextPath(next: string | null | undefined): string {
  const n = (next ?? "").trim();
  if (!n) return AUTH_DEFAULT_NEXT;
  if (!n.startsWith("/") || n.startsWith("//")) return AUTH_DEFAULT_NEXT;
  if (n.includes("://") || n.includes("\\") || n.includes("\0") || /[\r\n]/.test(n)) {
    return AUTH_DEFAULT_NEXT;
  }
  try {
    const decoded = decodeURIComponent(n);
    if (
      decoded !== n &&
      (decoded.includes("://") || decoded.startsWith("//") || !decoded.startsWith("/"))
    ) {
      return AUTH_DEFAULT_NEXT;
    }
  } catch {
    return AUTH_DEFAULT_NEXT;
  }
  return n;
}

export function buildLoginNextFromRequest(pathname: string, search = ""): string {
  return sanitizeAuthNextPath(`${pathname}${search}`);
}

/** Hyrox athlete portal — only /athlete/* destinations (never community /dashboard). */
export function sanitizeAthleteAuthNextPath(next: string | null | undefined): string {
  const raw = (next ?? "").trim();
  if (!raw) return AUTH_ATHLETE_DEFAULT_NEXT;

  const n = sanitizeAuthNextPath(raw);
  if (n === AUTH_DEFAULT_NEXT && raw) return AUTH_ATHLETE_DEFAULT_NEXT;
  if (!n.startsWith("/athlete/") || n === ATHLETE_LOGIN_PATH) {
    return AUTH_ATHLETE_DEFAULT_NEXT;
  }
  return n;
}

export function buildAthleteLoginNextFromRequest(pathname: string, search = ""): string {
  if (pathname === ATHLETE_LOGIN_PATH) return AUTH_ATHLETE_DEFAULT_NEXT;
  return sanitizeAthleteAuthNextPath(`${pathname}${search}`);
}

/** Post-auth redirect target from /auth/callback ?next= (athlete vs community). */
export function resolveAuthCallbackNext(next: string | null | undefined): string {
  const raw = (next ?? "").trim();
  if (raw.startsWith("/athlete/") || raw === "/athlete/onboarding") {
    return sanitizeAthleteAuthNextPath(raw);
  }
  return sanitizeAuthNextPath(raw);
}

/** Client-side: magic-link callback for athlete login. */
export function buildAthleteEmailRedirectTo(next: string | null | undefined): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const safeNext = sanitizeAthleteAuthNextPath(next);
  return `${base}/auth/callback?next=${encodeURIComponent(safeNext)}`;
}

export function buildLoginUrl(origin: string, next: string | null | undefined): string {
  const safeNext = sanitizeAuthNextPath(next);
  const url = new URL("/login", origin);
  if (safeNext !== AUTH_DEFAULT_NEXT || (next ?? "").trim()) {
    url.searchParams.set("next", safeNext);
  }
  return url.toString();
}

/** Client-side: build emailRedirectTo for signInWithOtp (PKCE). */
export function buildEmailRedirectTo(next: string | null | undefined): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const safeNext = sanitizeAuthNextPath(next);
  return `${base}/auth/callback?next=${encodeURIComponent(safeNext)}`;
}

/** Server-side: canonical origin for redirects after /auth/callback. */
export function getRequestOrigin(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost.split(",")[0]!.trim()}`;
  }

  return new URL(request.url).origin;
}
