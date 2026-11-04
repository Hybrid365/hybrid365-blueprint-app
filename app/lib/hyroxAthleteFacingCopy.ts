/** Weekly copy the athlete is allowed to see. Never falls back to the internal coach note. */
export function athleteFacingWeeklyNote(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

/** Drop the internal weekly coach note before an athlete payload leaves the server. */
export function withoutInternalWeekCoachNote<T extends { coach_note?: string | null }>(
  week: T | null | undefined
): (Omit<T, "coach_note"> & { coach_note?: never }) | null | undefined {
  if (!week) return week;
  const { coach_note: _omit, ...rest } = week;
  return rest;
}
