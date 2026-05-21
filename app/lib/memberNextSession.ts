import { hasMeaningfulPlanJson } from "@/app/lib/programmePlan";
import {
  normalizeProgrammeScheduleForWeek,
  type SessionWithKey,
} from "@/app/lib/programmePageMetrics";

export type MemberWeekPayload = {
  week_number: number;
  is_unlocked: boolean | null;
  plan_json: unknown | null;
};

/** First incomplete session from `startWeek` onward, then earlier unlocked weeks. */
export function findNextMemberSession(args: {
  weeks: MemberWeekPayload[];
  sessionLogs: Record<string, { completed?: boolean } | undefined>;
  startWeek: number;
}): SessionWithKey | null {
  const unlocked = args.weeks
    .filter((w) => w.is_unlocked && hasMeaningfulPlanJson(w.plan_json))
    .sort((a, b) => a.week_number - b.week_number);
  if (!unlocked.length) return null;

  const fromStart = unlocked.filter((w) => w.week_number >= args.startWeek);
  const beforeStart = unlocked.filter((w) => w.week_number < args.startWeek);
  const ordered = [...fromStart, ...beforeStart];

  for (const week of ordered) {
    const sessions = normalizeProgrammeScheduleForWeek(week.week_number, week.plan_json);
    const next = sessions.find((s) => !args.sessionLogs[s.sessionKey]?.completed);
    if (next) return next;
  }
  return null;
}
