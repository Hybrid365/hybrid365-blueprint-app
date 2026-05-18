/**
 * Paid membership access + month-based programme week entitlement.
 *
 * Launch rule (by days since access_started_at):
 * - Month 1 (days 0–30): weeks 1–4
 * - Month 2 (days 31–60): weeks 1–8
 * - Month 3+ (day 61+): weeks 1–12
 *
 * Requires memberships.access_started_at (see scripts/sql/memberships-access-started-at.sql).
 * Falls back to created_at / updated_at when access_started_at is null (logged once per process).
 */

export const MEMBERSHIP_ACCESS_SELECT =
  "status, expires_at, access_started_at, created_at, updated_at";

export type MembershipForAccess = {
  status: string | null;
  expires_at: string | null;
  access_started_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type WeekWithEntitlement = {
  week_number: number;
  title?: string | null;
  is_unlocked?: boolean | null;
  plan_json?: unknown | null;
};

const MS_PER_DAY = 86_400_000;

let loggedAccessStartedFallback = false;

function parseDate(value: string | null | undefined): Date | null {
  if (!value?.trim()) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** ISO timestamp used for membership-month calculation. */
export function resolveAccessStartedAt(membership: MembershipForAccess): Date {
  const fromAccess = parseDate(membership.access_started_at);
  if (fromAccess) return fromAccess;

  const fromCreated = parseDate(membership.created_at);
  if (fromCreated) {
    if (!loggedAccessStartedFallback && typeof console !== "undefined") {
      loggedAccessStartedFallback = true;
      console.warn(
        "[membership access] access_started_at missing — using created_at for week unlock. Run memberships-access-started-at.sql and set on activation."
      );
    }
    return fromCreated;
  }

  const fromUpdated = parseDate(membership.updated_at);
  if (fromUpdated) return fromUpdated;

  return new Date();
}

export function isMembershipActive(membership: MembershipForAccess | null | undefined): boolean {
  if (!membership || membership.status !== "active") return false;
  const expiresAt = parseDate(membership.expires_at ?? null);
  if (!expiresAt) return true;
  return expiresAt > new Date();
}

/** 0 = inactive; 1–3 = entitlement month band. */
export function getMembershipMonth(membership: MembershipForAccess | null | undefined): number {
  if (!isMembershipActive(membership) || !membership) return 0;
  const started = resolveAccessStartedAt(membership);
  const days = Math.floor((Date.now() - started.getTime()) / MS_PER_DAY);
  if (days < 0) return 1;
  if (days <= 30) return 1;
  if (days <= 60) return 2;
  return 3;
}

/** Max programme week number the member may view (0 if inactive). */
export function getUnlockedWeekCount(membership: MembershipForAccess | null | undefined): number {
  if (!isMembershipActive(membership)) return 0;
  const month = getMembershipMonth(membership);
  if (month <= 1) return 4;
  if (month === 2) return 8;
  return 12;
}

export function getUnlockedWeeksForMembership(
  membership: MembershipForAccess | null | undefined
): number[] {
  const count = getUnlockedWeekCount(membership);
  return Array.from({ length: count }, (_, i) => i + 1);
}

/**
 * Apply entitlement to week rows for UI: lock weeks above allowance and strip plan_json on locked weeks.
 */
export function applyMembershipEntitlementToWeeks<T extends WeekWithEntitlement>(
  weeks: T[],
  membership: MembershipForAccess | null | undefined
): T[] {
  const maxWeek = getUnlockedWeekCount(membership);
  const active = isMembershipActive(membership);

  return weeks.map((week) => {
    const entitled = active && week.week_number >= 1 && week.week_number <= maxWeek;
    return {
      ...week,
      is_unlocked: entitled,
      title: entitled ? week.title : null,
      plan_json: entitled ? week.plan_json : null,
    };
  });
}

/** access_started_at for new activations (preserve existing). */
export function accessStartedAtForActivation(
  existing: { access_started_at?: string | null } | null,
  nowIso: string
): string | undefined {
  if (existing?.access_started_at) return undefined;
  return nowIso;
}
