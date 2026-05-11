/**
 * Hybrid365 member display name — single source for UI (dashboard, leaderboard, cards).
 * Order: assessment first_name → profile full_name → cleaned email local-part → "Hybrid Athlete".
 * Never surfaces UUID-shaped strings or full email addresses on public surfaces.
 */

export const HYBRID_ATHLETE_FALLBACK = "Hybrid Athlete";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function looksLikeUuidOrOpaqueId(raw: string): boolean {
  const t = raw.trim();
  if (!t) return true;
  if (UUID_RE.test(t)) return true;
  if (t.length >= 20 && /^[0-9a-f-]+$/i.test(t) && !/\s/.test(t)) return true;
  return false;
}

function titleCaseWord(w: string): string {
  if (!w) return "";
  if (w.length === 1) return w.toUpperCase();
  return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
}

/** Email local-part only, formatted for display (never includes @domain). */
export function formatEmailLocalPartForDisplay(email: string | null | undefined): string | null {
  if (!email || typeof email !== "string") return null;
  const at = email.indexOf("@");
  if (at <= 0) return null;
  const raw = email.slice(0, at).trim();
  if (!raw || raw.length > 64) return null;
  if (looksLikeUuidOrOpaqueId(raw)) return null;
  const spaced = raw.replace(/[._]+/g, " ").replace(/-+/g, " ").trim();
  if (!spaced) return null;
  const parts = spaced.split(/\s+/).filter(Boolean);
  const out = parts.map(titleCaseWord).join(" ");
  if (out.length < 2) return null;
  return out.length > 42 ? `${out.slice(0, 39)}…` : out;
}

function sanitizeFirstName(raw: string | null | undefined): string | null {
  const t = (raw ?? "").trim();
  if (!t || t.length > 80) return null;
  if (looksLikeUuidOrOpaqueId(t)) return null;
  const first = t.split(/\s+/)[0] ?? "";
  if (first.length < 2) return null;
  if (/^[^a-zA-ZÀ-ž]+$/.test(first)) return null;
  return titleCaseWord(first);
}

function sanitizeFullName(raw: string | null | undefined): string | null {
  const t = (raw ?? "").trim();
  if (!t || t.length > 120) return null;
  if (looksLikeUuidOrOpaqueId(t)) return null;
  return t.replace(/\s+/g, " ");
}

/**
 * Canonical Hybrid365 display name for the signed-in experience and safe public labels.
 */
export function hybridAthleteDisplayName(params: {
  assessmentFirstName?: string | null;
  profileFullName?: string | null;
  email?: string | null;
}): string {
  const fromAssessment = sanitizeFirstName(params.assessmentFirstName);
  if (fromAssessment) return fromAssessment;
  const fromProfile = sanitizeFullName(params.profileFullName);
  if (fromProfile) return fromProfile;
  const fromEmail = formatEmailLocalPartForDisplay(params.email);
  if (fromEmail) return fromEmail;
  return HYBRID_ATHLETE_FALLBACK;
}
