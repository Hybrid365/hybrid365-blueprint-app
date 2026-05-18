/**
 * Auth redirect URLs for magic-link sign-in.
 * Must match Supabase Dashboard → Authentication → URL Configuration → Redirect URLs.
 */

const DEFAULT_NEXT = "/dashboard";

export function sanitizeAuthNextPath(next: string | null | undefined): string {
  const n = (next ?? "").trim();
  if (n.startsWith("/") && !n.startsWith("//")) return n;
  return DEFAULT_NEXT;
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
