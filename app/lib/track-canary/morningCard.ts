export type SavedMorning = {
  localDate: string;
  sleep: number;
  energy: number;
  recovery: number;
  soreness: number;
  readiness: number;
  pain: boolean;
};

function dayKey(value: string): string {
  return value.slice(0, 10);
}

/** Yesterday's row never satisfies today. Missing today stays empty. */
export function savedMorningForDate(rows: SavedMorning[], date: string): SavedMorning | null {
  const key = dayKey(date);
  return [...rows].reverse().find((row) => dayKey(row.localDate) === key) ?? null;
}
