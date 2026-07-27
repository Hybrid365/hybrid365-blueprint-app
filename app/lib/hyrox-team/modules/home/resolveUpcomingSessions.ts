/**
 * Resolve upcoming programme sessions for Home V2 preview list.
 */

import { sessionDateYmdFromProgrammeStart } from "@/app/lib/hyroxAthleteProgrammeSort";
import { localDateYmd } from "@/app/lib/hyrox-team/modules/today/resolveTodaySessions";
import type { HyroxSession } from "@/app/lib/hyroxTeamDashboardMock";

export type UpcomingSessionRow = {
  session: HyroxSession;
  ymd: string;
};

export function resolveUpcomingProgrammeSessions(params: {
  programmeStartDate: string | null | undefined;
  programmeWeeks: Array<{ weekNumber: number; sessions: HyroxSession[] }>;
  todayYmd?: string;
  limit?: number;
  /** Session IDs already shown in Today's Mission — excluded from upcoming list. */
  excludeSessionIds?: Iterable<string>;
}): UpcomingSessionRow[] {
  const start = params.programmeStartDate;
  if (!start) return [];

  const todayYmd = params.todayYmd?.trim() || localDateYmd();
  const limit = params.limit ?? 5;
  const excluded = new Set(params.excludeSessionIds ?? []);

  const dated: UpcomingSessionRow[] = [];
  for (const week of params.programmeWeeks) {
    for (const session of week.sessions) {
      const ymd = sessionDateYmdFromProgrammeStart(start, week.weekNumber, session.day);
      if (ymd <= todayYmd) continue;
      if (excluded.has(session.id)) continue;
      dated.push({ session, ymd });
    }
  }

  return dated
    .sort((a, b) => a.ymd.localeCompare(b.ymd) || a.session.name.localeCompare(b.session.name))
    .slice(0, limit);
}
