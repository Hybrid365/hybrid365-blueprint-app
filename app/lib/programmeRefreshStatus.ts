/**
 * Detect whether assessment was saved after the current programme plan was written.
 * Used for refresh guidance only — does not trigger regeneration.
 */

export function parseIsoMs(iso: string | null | undefined): number | null {
  if (!iso || typeof iso !== "string") return null;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : null;
}

/** Best-effort timestamp for when the stored 12-week plan was last written. */
export function resolveProgrammeGeneratedAt(args: {
  weeksMaxUpdatedAt: string | null;
  instanceUpdatedAt: string | null;
  instanceCreatedAt: string | null;
}): string | null {
  return (
    args.weeksMaxUpdatedAt ?? args.instanceUpdatedAt ?? args.instanceCreatedAt ?? null
  );
}

/** True when assessment save is meaningfully after programme weeks were last upserted. */
export function assessmentUpdatedAfterProgramme(
  assessmentUpdatedAt: string | null,
  programmeGeneratedAt: string | null
): boolean {
  const a = parseIsoMs(assessmentUpdatedAt);
  const p = parseIsoMs(programmeGeneratedAt);
  if (a == null || p == null) return false;
  // Small buffer for same-request writes (assessment save vs generate).
  return a > p + 2000;
}

export function maxIsoTimestamp(values: (string | null | undefined)[]): string | null {
  let best: number | null = null;
  let bestIso: string | null = null;
  for (const iso of values) {
    const ms = parseIsoMs(iso);
    if (ms == null) continue;
    if (best == null || ms > best) {
      best = ms;
      bestIso = iso!;
    }
  }
  return bestIso;
}
