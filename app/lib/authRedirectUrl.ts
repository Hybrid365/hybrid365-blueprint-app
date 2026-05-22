/**
 * Auth redirect URLs for magic-link sign-in.
 * Must match Supabase Dashboard → Authentication → URL Configuration → Redirect URLs.
 */

/** Default post-login destination for community members (no ?next=). */
export const AUTH_DEFAULT_NEXT = "/dashboard";

/** Default post-login destination for Hyrox Team athlete login (no ?next=). */
export const AUTH_ATHLETE_DEFAULT_NEXT = "/athlete/dashboard";

const ATHLETE_LOGIN_PATH = "/athlete/login";

/** Paths that must never be used as Hyrox athlete post-login destinations. */
const BLOCKED_ATHLETE_NEXT_PATHS = [
  "/free-week",
  "/dashboard",
  "/login",
  "/community",
];

export type AuthPortal = "athlete" | "community";

function siteUrlBase(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    (typeof window !== "undefined" ? window.location.origin : "")
  );
}

export function isAthletePortalParam(portal: string | null | undefined): boolean {
  return portal?.trim().toLowerCase() === "athlete";
}

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

/** Hyrox athlete portal — only /athlete/* destinations (never community / free-week). */
export function sanitizeAthleteAuthNextPath(next: string | null | undefined): string {
  const raw = (next ?? "").trim();
  if (!raw) return AUTH_ATHLETE_DEFAULT_NEXT;

  const n = sanitizeAuthNextPath(raw);
  const pathOnly = n.split("?")[0] ?? n;

  if (BLOCKED_ATHLETE_NEXT_PATHS.some((p) => pathOnly === p || pathOnly.startsWith(`${p}/`))) {
    return AUTH_ATHLETE_DEFAULT_NEXT;
  }

  if (n === AUTH_DEFAULT_NEXT && raw && !raw.startsWith("/athlete/")) {
    return AUTH_ATHLETE_DEFAULT_NEXT;
  }

  if (!n.startsWith("/athlete/") || pathOnly === ATHLETE_LOGIN_PATH) {
    return AUTH_ATHLETE_DEFAULT_NEXT;
  }

  return n;
}

export function buildAthleteLoginNextFromRequest(pathname: string, search = ""): string {
  if (pathname === ATHLETE_LOGIN_PATH) return AUTH_ATHLETE_DEFAULT_NEXT;
  return sanitizeAthleteAuthNextPath(`${pathname}${search}`);
}

/**
 * Post-OTP redirect for verify-otp API.
 * Athlete portal must never fall through to community /dashboard or /free-week.
 */
export function resolveVerifyOtpRedirect(
  next: string | null | undefined,
  portal?: AuthPortal
): string {
  const raw = (next ?? "").trim();
  if (portal === "athlete" || raw.startsWith("/athlete/")) {
    return sanitizeAthleteAuthNextPath(raw || null);
  }
  return sanitizeAuthNextPath(next);
}

/**
 * Post-auth redirect from /auth/callback.
 * Uses ?portal=athlete to avoid empty ?next= defaulting to community /dashboard.
 */
export function resolveAuthCallbackNext(
  next: string | null | undefined,
  options?: { portal?: string | null }
): string {
  const raw = (next ?? "").trim();
  const athletePortal =
    isAthletePortalParam(options?.portal) ||
    raw.startsWith("/athlete/") ||
    raw === "/athlete/onboarding";

  if (athletePortal) {
    return sanitizeAthleteAuthNextPath(raw || null);
  }

  if (!raw) {
    return AUTH_DEFAULT_NEXT;
  }

  return sanitizeAuthNextPath(raw);
}

/** Hyrox athlete magic-link / OTP email callback (includes portal=athlete). */
export function buildAthleteAuthCallbackUrl(next: string | null | undefined): string {
  const safeNext = sanitizeAthleteAuthNextPath(next);
  const url = new URL("/auth/callback", siteUrlBase());
  url.searchParams.set("portal", "athlete");
  url.searchParams.set("next", safeNext);
  return url.toString();
}

/** @deprecated Use buildAthleteAuthCallbackUrl — kept for imports. */
export function buildAthleteEmailRedirectTo(next: string | null | undefined): string {
  return buildAthleteAuthCallbackUrl(next);
}

export function buildLoginUrl(origin: string, next: string | null | undefined): string {
  const safeNext = sanitizeAuthNextPath(next);
  const url = new URL("/login", origin);
  if (safeNext !== AUTH_DEFAULT_NEXT || (next ?? "").trim()) {
    url.searchParams.set("next", safeNext);
  }
  return url.toString();
}

/** Community magic-link callback (never used for Hyrox athlete login). */
export function buildEmailRedirectTo(next: string | null | undefined): string {
  const safeNext = sanitizeAuthNextPath(next);
  const url = new URL("/auth/callback", siteUrlBase());
  url.searchParams.set("portal", "community");
  url.searchParams.set("next", safeNext);
  return url.toString();
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
