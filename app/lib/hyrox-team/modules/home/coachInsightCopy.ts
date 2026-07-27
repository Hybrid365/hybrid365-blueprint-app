/**
 * Athlete-facing coach insight copy — strip internal/system generation language.
 */

const GENERATED_PREFIX =
  /^Generated from Block \d+ review[^.]*\.\s*/i;
const AUTO_PREFIX = /^(Auto-generated|System generated|AI generated)[^.]*\.\s*/i;
const COMPLETION_LINE = /^Completion:\s*\d+\/\d+ sessions[^.]*\.\s*/gim;
const AVG_RPE_LINE = /^Avg logged RPE:[^.]*\.\s*/gim;

export function sanitizeCoachInsightForAthlete(raw: string | null | undefined): {
  body: string;
  sourceHint: string | null;
} {
  if (!raw?.trim()) {
    return { body: "", sourceHint: null };
  }

  let body = raw.trim();
  const hadBlockReview = GENERATED_PREFIX.test(body);
  body = body
    .replace(GENERATED_PREFIX, "")
    .replace(AUTO_PREFIX, "")
    .replace(COMPLETION_LINE, "")
    .replace(AVG_RPE_LINE, "")
    .replace(/\s+/g, " ")
    .trim();

  // Prefer athlete-facing sentences over coach-admin bullet dumps
  const focusMatch = body.match(/This block:\s*([^.]+)/i);
  if (focusMatch?.[1]) {
    body = focusMatch[1].trim();
  }

  const words = body.split(/\s+/).filter(Boolean);
  if (words.length > 80) {
    body = `${words.slice(0, 80).join(" ")}…`;
  }

  return {
    body,
    sourceHint: hadBlockReview ? "Updated following your latest block review." : null,
  };
}
