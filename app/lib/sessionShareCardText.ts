/**
 * Plain-text + main-work summaries for session share cards (Milestone 13A).
 * Reusable later for weekly / benchmark / challenge cards.
 */

export type SessionSharePlaintextInput = {
  weekNumber: number;
  day: string;
  title: string;
  categoryLabel: string;
  duration: string;
  priorityLabel: string;
  mainWorkLines: string[];
  completed: boolean;
  rpe: number | null;
  /** When false, copy uses "Today's session" framing */
  preview?: boolean;
};

const MAX_MAIN_LINES = 5;
const MAX_CHARS_PER_LINE = 76;

/**
 * Prefer main work lines; cap count and truncate long lines for small cards.
 */
export function buildMainWorkSummaryLines(mainWork: string[] | undefined | null): string[] {
  if (!mainWork?.length) return [];
  const out: string[] = [];
  for (const raw of mainWork) {
    const t = String(raw).trim();
    if (!t) continue;
    if (out.length >= MAX_MAIN_LINES) break;
    out.push(t.length <= MAX_CHARS_PER_LINE ? t : `${t.slice(0, MAX_CHARS_PER_LINE - 1)}…`);
  }
  return out;
}

export function buildSessionSharePlaintext(input: SessionSharePlaintextInput): string {
  const lines: string[] = [
    input.completed ? "HYBRID365 SESSION COMPLETE" : "HYBRID365 — TODAY'S SESSION",
  ];

  lines.push(`Week ${input.weekNumber} · ${input.day}`);
  lines.push(input.title);
  lines.push(`${input.categoryLabel} · ${input.duration} · ${input.priorityLabel}`);

  if (input.mainWorkLines.length) {
    lines.push(`Main: ${input.mainWorkLines.join(" / ")}`);
  }

  if (input.completed && input.rpe != null) {
    lines.push(`RPE: ${input.rpe}/10`);
  }

  lines.push("@hybrid.365");
  return lines.join("\n");
}

export function mapMemberSessionToShareCardInput(args: {
  weekNumber: number;
  day: string;
  title: string;
  category: string;
  duration: string;
  priorityDisplayLabel: string;
  mainWork: string[];
  completed: boolean;
  rpe: number | null;
  preview?: boolean;
}): SessionSharePlaintextInput {
  return {
    weekNumber: args.weekNumber,
    day: args.day,
    title: args.title,
    categoryLabel: `${args.category} session`,
    duration: args.duration,
    priorityLabel: args.priorityDisplayLabel,
    mainWorkLines: buildMainWorkSummaryLines(args.mainWork),
    completed: args.completed,
    rpe: args.rpe,
    preview: args.preview ?? !args.completed,
  };
}

export function shareCardInputFromMemberSession(
  session: {
    weekNumber: number;
    day: string;
    title: string;
    category: string;
    duration: string;
    priorityDisplayLabel: string;
    mainWork: string[];
  },
  log: { completed: boolean; rpe: number | null } | null | undefined
): SessionSharePlaintextInput {
  const completed = Boolean(log?.completed);
  return mapMemberSessionToShareCardInput({
    weekNumber: session.weekNumber,
    day: session.day,
    title: session.title,
    category: session.category,
    duration: session.duration,
    priorityDisplayLabel: session.priorityDisplayLabel,
    mainWork: session.mainWork,
    completed,
    rpe: log?.rpe ?? null,
    preview: !completed,
  });
}
