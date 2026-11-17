const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Canonical clock for fixtures and QA. Preview uses the same default. */
export const TRACK_FOUNDATION_AS_OF = "2026-11-17";

export function parseIsoDate(iso: string | null | undefined): number | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const ms = Date.parse(`${iso}T00:00:00Z`);
  return Number.isFinite(ms) ? ms : null;
}

/** Whole days from `date` to `asOf`. Negative when the result is in the future. */
export function ageInDays(asOf: string, date: string): number | null {
  const a = parseIsoDate(asOf);
  const b = parseIsoDate(date);
  if (a == null || b == null) return null;
  return Math.round((a - b) / 86_400_000);
}

export function formatDisplayDate(iso: string): string {
  const ms = parseIsoDate(iso);
  if (ms == null) return iso;
  const d = new Date(ms);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function addDays(iso: string, days: number): string {
  const ms = parseIsoDate(iso);
  if (ms == null) return iso;
  const d = new Date(ms);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Monday of the week that contains `iso` (UTC). */
export function mondayOf(iso: string): string {
  const ms = parseIsoDate(iso);
  if (ms == null) return iso;
  const d = new Date(ms);
  const weekday = d.getUTCDay();
  const delta = weekday === 0 ? -6 : 1 - weekday;
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

export function parseClockToSeconds(raw: string | null | undefined): number | null {
  const t = (raw ?? "").trim();
  if (!t) return null;
  const parts = t.split(":").map((p) => p.trim());
  if (parts.length < 2 || parts.length > 3) return null;
  if (parts.some((p) => p === "" || !/^\d+$/.test(p))) return null;
  const nums = parts.map(Number);
  if (nums.some((n) => !Number.isFinite(n))) return null;
  if (nums.length === 2) return nums[0]! * 60 + nums[1]!;
  return nums[0]! * 3600 + nums[1]! * 60 + nums[2]!;
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export function formatPacePer500(totalSeconds: number, distanceMetres: number): string | null {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0 || distanceMetres <= 0) return null;
  const per = totalSeconds / (distanceMetres / 500);
  const m = Math.floor(per / 60);
  const s = Math.round(per % 60);
  return `${m}:${String(s).padStart(2, "0")}/500m`;
}
