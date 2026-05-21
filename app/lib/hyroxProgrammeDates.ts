/** Calendar logic for Hyrox Team programme weeks (no mock dates). */

export type ProgrammeLengthWeeks = 12 | 16;

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

export function getBlockWeekRole(
  blockNumber: number,
  cycle: 1 | 2 | 3 | 4,
  length: ProgrammeLengthWeeks = 12
): string {
  const phase = getProgrammeRoadmap(length).find((p) => p.blockNumber === blockNumber);
  return phase?.weekRoles[cycle - 1] ?? BLOCK_1_ROLES[cycle - 1]!;
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
  const maxBlock = params.programmeLengthWeeks === 16 ? 4 : 3;
  if (params.currentBlock >= maxBlock) return false;
  const liveWeek = deriveLiveGlobalWeek(params.programmeStartYmd);
  const cycleInBlock = ((liveWeek - 1) % 4) + 1;
  return cycleInBlock >= 3;
}

export function nextBlockNumber(currentBlock: number, length: ProgrammeLengthWeeks): number | null {
  const max = length === 16 ? 4 : 3;
  return currentBlock < max ? currentBlock + 1 : null;
}
