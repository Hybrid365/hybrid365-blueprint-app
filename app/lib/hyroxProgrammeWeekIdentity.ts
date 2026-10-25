/**
 * Canonical programme-week identity for hyrox_programme_weeks.
 *
 * Logical identity: athlete_id + week_number (global week).
 * block_number is denormalised from the global week and must stay consistent.
 *
 * Schema has NO unique constraint on (athlete_id, block_number, week_number) —
 * multiple published rows can exist (historical publish always INSERTed).
 * Readers MUST pick one deterministic "active" row per logical week.
 *
 * Active selection (documented):
 *   status = 'published'
 *   then latest published_at
 *   then latest updated_at
 *   then latest created_at
 *   then id desc
 *
 * Superseded published rows may be marked status = 'archived' on republish
 * (no hard delete; sessions/feedback remain attached to their week id).
 */

import type { HyroxProgrammeWeekRow } from "@/app/lib/hyroxDatabaseTypes";

export type ProgrammeWeekLogicalKey = {
  athleteId: string;
  weekNumber: number;
  blockNumber?: number;
};

export function comparePublishedWeekRecency(
  a: Pick<HyroxProgrammeWeekRow, "published_at" | "updated_at" | "created_at" | "id">,
  b: Pick<HyroxProgrammeWeekRow, "published_at" | "updated_at" | "created_at" | "id">
): number {
  const aPub = a.published_at ?? "";
  const bPub = b.published_at ?? "";
  if (aPub !== bPub) return aPub < bPub ? -1 : 1;
  const aUp = a.updated_at ?? "";
  const bUp = b.updated_at ?? "";
  if (aUp !== bUp) return aUp < bUp ? -1 : 1;
  const aCr = a.created_at ?? "";
  const bCr = b.created_at ?? "";
  if (aCr !== bCr) return aCr < bCr ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/** Prefer the newer of two published weeks. */
export function pickNewerPublishedWeek<T extends Pick<HyroxProgrammeWeekRow, "published_at" | "updated_at" | "created_at" | "id">>(
  a: T,
  b: T
): T {
  return comparePublishedWeekRecency(a, b) >= 0 ? a : b;
}

/**
 * Collapse many week rows to one canonical row per global week_number.
 * Ignores non-published when preferPublishedOnly is true (default).
 */
export function collapseToCanonicalPublishedWeeks(
  rows: HyroxProgrammeWeekRow[],
  opts?: { preferPublishedOnly?: boolean }
): HyroxProgrammeWeekRow[] {
  const preferPublishedOnly = opts?.preferPublishedOnly !== false;
  const byWeek = new Map<number, HyroxProgrammeWeekRow>();
  for (const row of rows) {
    if (preferPublishedOnly && row.status !== "published") continue;
    const prev = byWeek.get(row.week_number);
    if (!prev) {
      byWeek.set(row.week_number, row);
      continue;
    }
    byWeek.set(row.week_number, pickNewerPublishedWeek(prev, row));
  }
  return [...byWeek.values()].sort((a, b) => a.week_number - b.week_number);
}

export function selectCanonicalPublishedWeek(
  rows: HyroxProgrammeWeekRow[]
): HyroxProgrammeWeekRow | null {
  const published = rows.filter((r) => r.status === "published");
  if (!published.length) return null;
  return published.reduce((best, row) => pickNewerPublishedWeek(best, row));
}
