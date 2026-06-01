/**
 * Paid community programme unlock timing (not Hybrid 75 / Hyrox).
 */

export const COMMUNITY_PROGRAMME_UNLOCK_HOURS = 12;

export type CommunityProgrammeInstanceStatus = "pending_unlock" | "live" | null;

export type ProgrammeInstanceUnlockFields = {
  status?: string | null;
  unlock_at?: string | null;
  programme_generated_at?: string | null;
};

export type CommunityProgrammeUnlockState = {
  programmePendingUnlock: boolean;
  canViewProgramme: boolean;
  unlockAt: string | null;
  unlockAtMs: number | null;
  /** Exposed for Kit / email automation */
  programmeUnlockAt: string | null;
  programmeGeneratedAt: string | null;
};

export function computeCommunityProgrammeUnlockAt(fromMs: number = Date.now()): string {
  return new Date(fromMs + COMMUNITY_PROGRAMME_UNLOCK_HOURS * 60 * 60 * 1000).toISOString();
}

function parseUnlockMs(unlockAt: string | null | undefined): number | null {
  if (!unlockAt?.trim()) return null;
  const ms = Date.parse(unlockAt);
  return Number.isNaN(ms) ? null : ms;
}

/**
 * Whether a generated programme is visible to the member.
 * Legacy: meaningful weeks + no unlock_at + status not pending_unlock → live.
 */
export function resolveCommunityProgrammeUnlockState(
  instance: ProgrammeInstanceUnlockFields | null | undefined,
  programmeGenerated: boolean
): CommunityProgrammeUnlockState {
  const empty: CommunityProgrammeUnlockState = {
    programmePendingUnlock: false,
    canViewProgramme: false,
    unlockAt: null,
    unlockAtMs: null,
    programmeUnlockAt: null,
    programmeGeneratedAt: instance?.programme_generated_at ?? null,
  };

  if (!programmeGenerated) return empty;

  const status = instance?.status ?? null;
  const unlockAt = instance?.unlock_at ?? null;
  const unlockAtMs = parseUnlockMs(unlockAt);
  const generatedAt = instance?.programme_generated_at ?? null;

  if (status === "live") {
    return {
      programmePendingUnlock: false,
      canViewProgramme: true,
      unlockAt,
      unlockAtMs,
      programmeUnlockAt: unlockAt,
      programmeGeneratedAt: generatedAt,
    };
  }

  if (unlockAtMs != null && unlockAtMs > Date.now()) {
    return {
      programmePendingUnlock: true,
      canViewProgramme: false,
      unlockAt,
      unlockAtMs,
      programmeUnlockAt: unlockAt,
      programmeGeneratedAt: generatedAt,
    };
  }

  if (status === "pending_unlock" && !unlockAt) {
    return {
      programmePendingUnlock: true,
      canViewProgramme: false,
      unlockAt: null,
      unlockAtMs: null,
      programmeUnlockAt: null,
      programmeGeneratedAt: generatedAt,
    };
  }

  // Legacy instances (no unlock_at) or unlock time passed
  return {
    programmePendingUnlock: false,
    canViewProgramme: true,
    unlockAt,
    unlockAtMs,
    programmeUnlockAt: unlockAt,
    programmeGeneratedAt: generatedAt,
  };
}

export function formatUnlockCountdown(unlockAtMs: number, nowMs: number = Date.now()): string {
  const diffMs = Math.max(0, unlockAtMs - nowMs);
  const totalHours = Math.ceil(diffMs / (60 * 60 * 1000));
  if (totalHours <= 1) return "Unlocks in less than 1 hour";
  if (totalHours < 24) return `Unlocks in approximately ${totalHours} hours`;
  const days = Math.ceil(totalHours / 24);
  return days === 1 ? "Unlocks in approximately 1 day" : `Unlocks in approximately ${days} days`;
}

export function formatUnlockDateTime(unlockAtMs: number, locale = "en-GB"): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(unlockAtMs));
}
