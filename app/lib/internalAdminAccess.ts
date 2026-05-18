/**
 * Internal QA / admin route guard — uses INTERNAL_ADMIN_EMAILS when set.
 */

export function parseInternalAdminEmails(): string[] {
  const raw = process.env.INTERNAL_ADMIN_EMAILS?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isInternalAdminEmail(email: string | null | undefined): boolean {
  if (!email?.trim()) return false;
  const allowed = parseInternalAdminEmails();
  if (allowed.length === 0) {
    return true;
  }
  return allowed.includes(email.trim().toLowerCase());
}
