/** Pure parsers for Command Centre attention rules. No I/O. */

const ILLNESS_RE = /\b(ill|illness|sick|unwell|flu|cold|fever)\b/i;
const HEAVY_LEGS_RE = /\bheavy legs\b/i;

export function parsePrescribedRpeRange(
  raw: string | null | undefined
): { min: number; max: number } | null {
  if (!raw?.trim()) return null;
  const nums = raw.match(/\d+(?:\.\d+)?/g)?.map(Number).filter((n) => Number.isFinite(n)) ?? [];
  if (!nums.length) return null;
  return { min: Math.min(...nums), max: Math.max(...nums) };
}

export function isHighRpeVsPrescribed(logged: number | null, prescribedMax: number | null): boolean {
  if (logged == null || prescribedMax == null) return false;
  return logged > prescribedMax + 1;
}

export function textLooksLikeIllness(raw: string | null | undefined): boolean {
  return Boolean(raw?.trim() && ILLNESS_RE.test(raw));
}

export function textMentionsHeavyLegs(raw: string | null | undefined): boolean {
  return Boolean(raw?.trim() && HEAVY_LEGS_RE.test(raw));
}

export function isHighSoreness(value: number | null | undefined): boolean {
  return value != null && value >= 8;
}

export function isLowEnergy(value: number | null | undefined): boolean {
  return value != null && value <= 4;
}
