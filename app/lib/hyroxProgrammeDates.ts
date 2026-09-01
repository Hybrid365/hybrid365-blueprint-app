/** Calendar logic for Hyrox Team programme weeks (no mock dates). */

export type ProgrammeLengthWeeks = 12 | 16;

/** Safety cap only — not a product limit. Drafts/weeks have no 1–3 DB constraint. */
export const PROGRAMME_BLOCK_HARD_CAP = 24;

export const WEEKS_PER_BLOCK = 4;

/** Shown in admin when start date is not a Monday. */
export const PROGRAMME_START_MUST_BE_MONDAY =
  "Programme start date must be a Monday so session days align correctly.";

export type ProgrammeWeekCalendarStatus = "past" | "live" | "upcoming";

export type BlockRoadmapPhase = {
  blockNumber: number;
  name: string;
  globalWeeks: [number, number, number, number];
  weekRoles: [string, string, string, string];
};

const BLOCK_1_ROLES: [string, string, string, string] = [
  "Base Intro",
  "Base Progression",
  "Base Peak",
  "Deload / Review",
];

const ROADMAP_12: BlockRoadmapPhase[] = [
  {
    blockNumber: 1,
    name: "Base + load tolerance",
    globalWeeks: [1, 2, 3, 4],
    weekRoles: BLOCK_1_ROLES,
  },
  {
    blockNumber: 2,
    name: "Threshold + station tolerance",
    globalWeeks: [5, 6, 7, 8],
    weekRoles: ["Re-build", "Progression", "Peak", "Deload / Review"],
  },
  {
    blockNumber: 3,
    name: "Hyrox race prep",
    globalWeeks: [9, 10, 11, 12],
    weekRoles: ["Specificity build", "Race-specific peak", "Sharpen / taper begin", "Race week"],
  },
];

const ROADMAP_16: BlockRoadmapPhase[] = [
  {
    blockNumber: 1,
    name: "Base + movement quality",
    globalWeeks: [1, 2, 3, 4],
    weekRoles: BLOCK_1_ROLES,
  },
  {
    blockNumber: 2,
    name: "Aerobic volume + threshold",
    globalWeeks: [5, 6, 7, 8],
    weekRoles: ["Volume build", "Threshold intro", "Threshold peak", "Deload / Review"],
  },
  {
    blockNumber: 3,
    name: "Compromised running + stations",
    globalWeeks: [9, 10, 11, 12],
    weekRoles: ["Station density", "Compromised build", "Compromised peak", "Deload / Review"],
  },
  {
    blockNumber: 4,
    name: "Race specificity + taper",
    globalWeeks: [13, 14, 15, 16],
    weekRoles: ["Race-specific build", "Sharpen", "Taper", "Race week"],
  },
];

export function getProgrammeRoadmap(length: ProgrammeLengthWeeks = 12): BlockRoadmapPhase[] {
  return length === 16 ? ROADMAP_16 : ROADMAP_12;
}

export function plannedProgrammeBlocks(length: ProgrammeLengthWeeks = 12): number {
  return length === 16 ? 4 : 3;
}

export function clampProgrammeBlock(blockNumber: number): number {
  if (!Number.isFinite(blockNumber)) return 1;
  return Math.min(PROGRAMME_BLOCK_HARD_CAP, Math.max(1, Math.floor(blockNumber)));
}

export function parseCoachBlockNumber(raw: unknown): number | null {
  const n = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
  if (!Number.isFinite(n) || n < 1) return null;
  return clampProgrammeBlock(n);
}

/**
 * Block number used when publishing a programme block.
 * Lower-bounds at 1 only — never clamps Block 4 down to Block 3.
 */
export function resolvePublishBlockNumber(blockNumber: number): number {
  if (!Number.isFinite(blockNumber)) return 1;
  return Math.max(1, Math.floor(blockNumber));
}

export function globalWeeksForBlock(blockNumber: number): [number, number, number, number] {
  const start = (clampProgrammeBlock(blockNumber) - 1) * WEEKS_PER_BLOCK + 1;
  return [start, start + 1, start + 2, start + 3];
}

/** Inverse of `globalWeekForBlock` — Week 17 → Block 5. Not capped at Block 4. */
export function blockNumberForGlobalWeek(weekNumber: number): number {
  if (!Number.isFinite(weekNumber) || weekNumber < 1) return 1;
  return clampProgrammeBlock(Math.floor((weekNumber - 1) / WEEKS_PER_BLOCK) + 1);
}

/** 1–4 cycle index inside the block. Week 17 → 1, Week 16 → 4. */
export function cycleInBlockForGlobalWeek(weekNumber: number): 1 | 2 | 3 | 4 {
  if (!Number.isFinite(weekNumber) || weekNumber < 1) return 1;
  return ((((Math.floor(weekNumber) - 1) % WEEKS_PER_BLOCK) + 1) as 1 | 2 | 3 | 4);
}

export function parseCoachGlobalWeek(raw: unknown): number | null {
  const n = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
  if (!Number.isFinite(n) || n < 1) return null;
  const week = Math.floor(n);
  const maxWeek = PROGRAMME_BLOCK_HARD_CAP * WEEKS_PER_BLOCK;
  if (week > maxWeek) return null;
  return week;
}

const CONTINUATION_ROLES: [string, string, string, string] = [
  "Build",
  "Progression",
  "Peak",
  "Deload / Review",
];

export function getBlockPhase(
  blockNumber: number,
  length: ProgrammeLengthWeeks = 12
): BlockRoadmapPhase {
  const block = clampProgrammeBlock(blockNumber);
  const named = getProgrammeRoadmap(length).find((p) => p.blockNumber === block);
  if (named) return named;
  const from16 = ROADMAP_16.find((p) => p.blockNumber === block);
  if (from16) return from16;
  return {
    blockNumber: block,
    name: `Block ${block}`,
    globalWeeks: globalWeeksForBlock(block),
    weekRoles: CONTINUATION_ROLES,
  };
}

/**
 * How many block tabs the coach builder should show.
 * Always includes the original plan length, any existing blocks, the requested
 * block, and one next empty block once the athlete is at/past plan length.
 */
export function visibleCoachBlockCount(params: {
  programmeLengthWeeks: ProgrammeLengthWeeks;
  highestExistingBlock: number;
  requestedBlock?: number;
}): number {
  const planned = plannedProgrammeBlocks(params.programmeLengthWeeks);
  const existing = Math.max(0, Math.floor(params.highestExistingBlock || 0));
  const requested =
    params.requestedBlock != null ? clampProgrammeBlock(params.requestedBlock) : 1;
  const withNext = existing >= planned ? existing + 1 : planned;
  return clampProgrammeBlock(Math.max(planned, existing, withNext, requested));
}

export function getBlockWeekRole(
  blockNumber: number,
  cycle: 1 | 2 | 3 | 4,
  length: ProgrammeLengthWeeks = 12
): string {
  const phase = getBlockPhase(blockNumber, length);
  return phase.weekRoles[cycle - 1] ?? CONTINUATION_ROLES[cycle - 1]!;
}

export function parseYmd(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y!, m! - 1, d!, 12, 0, 0, 0);
}

export function toYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
}

/** Next Monday on or after the given date (default: today). */
export function nextMondayFrom(reference: Date = new Date()): Date {
  const day = startOfLocalDay(reference);
  const dow = day.getDay();
  const daysUntilMonday = dow === 0 ? 1 : dow === 1 ? 0 : 8 - dow;
  const monday = new Date(day);
  monday.setDate(monday.getDate() + daysUntilMonday);
  return monday;
}

export function defaultProgrammeStartYmd(reference: Date = new Date()): string {
  return toYmd(nextMondayFrom(reference));
}

export function isMondayYmd(ymd: string): boolean {
  try {
    return startOfLocalDay(parseYmd(ymd)).getDay() === 1;
  } catch {
    return false;
  }
}

/** Returns an error message when invalid; null when OK. */
export function validateProgrammeStartDateYmd(ymd: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd.trim())) {
    return "programme_start_date must be YYYY-MM-DD.";
  }
  if (!isMondayYmd(ymd)) {
    return PROGRAMME_START_MUST_BE_MONDAY;
  }
  return null;
}

export function weekDateRangeFromProgrammeStart(
  programmeStartYmd: string,
  globalWeekNumber: number
): { start: Date; end: Date; startYmd: string; endYmd: string } {
  const start = parseYmd(programmeStartYmd);
  start.setDate(start.getDate() + (globalWeekNumber - 1) * 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return { start, end, startYmd: toYmd(start), endYmd: toYmd(end) };
}

const MS_PER_DAY = 86400000;

/** True when start/end look like a Mon–Sun training week (not swapped or truncated DB values). */
export function isValidWeekDateRangeYmd(startYmd: string, endYmd: string): boolean {
  try {
    const start = startOfLocalDay(parseYmd(startYmd));
    const end = startOfLocalDay(parseYmd(endYmd));
    if (end < start) return false;
    if (start.getDay() !== 1 || end.getDay() !== 0) return false;
    const spanDays = Math.round((end.getTime() - start.getTime()) / MS_PER_DAY);
    return spanDays === 6;
  } catch {
    return false;
  }
}

export type ResolvedAthleteWeekDates = {
  startYmd: string;
  endYmd: string;
  dateRangeLabel: string;
  source: "db" | "programme_start" | "programme_start_mismatch_db";
  /** Set when DB span is valid but dates do not match programme_start + weekNumber. */
  dbMismatchWarning?: string | null;
};

/** Expected Mon–Sun range for global week N from programme start (W1 = start, +6d end). */
export function expectedWeekDateRangeFromProgrammeStart(
  programmeStartYmd: string,
  weekNumber: number
): { startYmd: string; endYmd: string } {
  const { startYmd, endYmd } = weekDateRangeFromProgrammeStart(programmeStartYmd, weekNumber);
  return { startYmd, endYmd };
}

/** DB week dates accepted only when span is valid and exactly match expected derived range. */
export function dbWeekDatesMatchExpected(
  dbStartYmd: string,
  dbEndYmd: string,
  expectedStartYmd: string,
  expectedEndYmd: string
): boolean {
  if (!isValidWeekDateRangeYmd(dbStartYmd, dbEndYmd)) return false;
  return dbStartYmd === expectedStartYmd && dbEndYmd === expectedEndYmd;
}

/**
 * Prefer DB week_start/end only when they exactly match programme_start + weekNumber.
 * Valid-length but misaligned DB rows (e.g. W2 dated before W1) use derived dates.
 */
export function resolveAthleteWeekDateRange(input: {
  programmeStartYmd: string | null;
  weekNumber: number;
  dbWeekStartYmd?: string | null;
  dbWeekEndYmd?: string | null;
}): ResolvedAthleteWeekDates | null {
  const programmeStart = input.programmeStartYmd?.trim() || null;
  const expected = programmeStart
    ? weekDateRangeFromProgrammeStart(programmeStart, input.weekNumber)
    : null;

  const dbStart = input.dbWeekStartYmd?.trim() || null;
  const dbEnd = input.dbWeekEndYmd?.trim() || null;

  if (expected && dbStart && dbEnd) {
    if (dbWeekDatesMatchExpected(dbStart, dbEnd, expected.startYmd, expected.endYmd)) {
      return {
        startYmd: dbStart,
        endYmd: dbEnd,
        dateRangeLabel: formatWeekDateRangeFromYmd(dbStart, dbEnd),
        source: "db",
      };
    }

    if (isValidWeekDateRangeYmd(dbStart, dbEnd)) {
      return {
        startYmd: expected.startYmd,
        endYmd: expected.endYmd,
        dateRangeLabel: formatWeekDateRangeFromYmd(expected.startYmd, expected.endYmd),
        source: "programme_start_mismatch_db",
        dbMismatchWarning: `DB ${dbStart}→${dbEnd} does not match expected W${input.weekNumber} ${expected.startYmd}→${expected.endYmd}`,
      };
    }

    return {
      startYmd: expected.startYmd,
      endYmd: expected.endYmd,
      dateRangeLabel: formatWeekDateRangeFromYmd(expected.startYmd, expected.endYmd),
      source: "programme_start",
    };
  }

  if (expected) {
    return {
      startYmd: expected.startYmd,
      endYmd: expected.endYmd,
      dateRangeLabel: formatWeekDateRangeFromYmd(expected.startYmd, expected.endYmd),
      source: "programme_start",
    };
  }

  if (dbStart && dbEnd && isValidWeekDateRangeYmd(dbStart, dbEnd)) {
    return {
      startYmd: dbStart,
      endYmd: dbEnd,
      dateRangeLabel: formatWeekDateRangeFromYmd(dbStart, dbEnd),
      source: "db",
    };
  }

  if (dbStart && dbEnd) {
    return {
      startYmd: dbStart,
      endYmd: dbEnd,
      dateRangeLabel: formatWeekDateRangeFromYmd(dbStart, dbEnd),
      source: "db",
    };
  }

  return null;
}

export function deriveWeekCalendarStatusForAthleteWeek(input: {
  programmeStartYmd: string | null;
  weekNumber: number;
  dbWeekStartYmd?: string | null;
  dbWeekEndYmd?: string | null;
  today?: Date;
}): ProgrammeWeekCalendarStatus {
  const resolved = resolveAthleteWeekDateRange(input);
  if (!resolved) return "upcoming";
  return deriveWeekCalendarStatus(resolved.startYmd, resolved.endYmd, input.today);
}

export function formatWeekDateRangeShort(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  const a = start.toLocaleDateString("en-GB", opts);
  const b = end.toLocaleDateString("en-GB", opts);
  return `${a} – ${b}`;
}

export function formatWeekDateRangeFromYmd(startYmd: string, endYmd: string): string {
  return formatWeekDateRangeShort(parseYmd(startYmd), parseYmd(endYmd));
}

export function deriveWeekCalendarStatus(
  weekStartYmd: string,
  weekEndYmd: string,
  today: Date = new Date()
): ProgrammeWeekCalendarStatus {
  const t = startOfLocalDay(today);
  const start = startOfLocalDay(parseYmd(weekStartYmd));
  const end = startOfLocalDay(parseYmd(weekEndYmd));
  if (t > end) return "past";
  if (t < start) return "upcoming";
  return "live";
}

/** Global week number (1-based) that is live today; before programme start returns 1. */
export function deriveLiveGlobalWeek(
  programmeStartYmd: string,
  today: Date = new Date()
): number {
  const start = startOfLocalDay(parseYmd(programmeStartYmd));
  const t = startOfLocalDay(today);
  const days = Math.floor((t.getTime() - start.getTime()) / 86400000);
  if (days < 0) return 1;
  return Math.floor(days / 7) + 1;
}

export function weeksUntilGlobalWeek(programmeStartYmd: string, globalWeek: number): number {
  const { start } = weekDateRangeFromProgrammeStart(programmeStartYmd, globalWeek);
  const today = startOfLocalDay(new Date());
  return Math.ceil((start.getTime() - today.getTime()) / 86400000);
}

export function shouldShowNextBlockPrompt(params: {
  currentBlock: number;
  programmeLengthWeeks: ProgrammeLengthWeeks;
  programmeStartYmd: string | null;
  blockPublished: boolean;
}): boolean {
  if (!params.blockPublished || !params.programmeStartYmd) return false;
  if (params.currentBlock < 1) return false;
  const liveWeek = deriveLiveGlobalWeek(params.programmeStartYmd);
  const cycleInBlock = ((liveWeek - 1) % 4) + 1;
  return cycleInBlock >= 3;
}

/** Next 4-week block after `currentBlock`. No plan-length cap — Block 4+ is additive. */
export function nextBlockNumber(
  currentBlock: number,
  length?: ProgrammeLengthWeeks
): number {
  void length;
  return clampProgrammeBlock(Math.max(1, currentBlock) + 1);
}
