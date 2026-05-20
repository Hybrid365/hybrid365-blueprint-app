"use client";

import { useCallback, useState } from "react";
import {
  HYROX_BLOCKS,
  MOCK_ATHLETE,
  MOCK_WEEK_RATIONALE,
  MOCK_WEEK_SESSIONS,
} from "@/app/lib/hyroxTeamDashboardMock";
import {
  ATHLETE_PAGE_META,
  PageContent,
  PageHeader,
  SectionTitle,
  ProgressBar,
  eyebrowClass,
  athleteCard,
  athleteCardPadding,
} from "./athleteUi";
import { SessionDrawer } from "./SessionDrawer";
import { WeekSessionCard } from "./WeekSessionCard";

export function ProgrammePageView() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState<string | undefined>();
  const a = MOCK_ATHLETE;
  const block = HYROX_BLOCKS.find((b) => b.id === a.blockId)!;
  const completed = MOCK_WEEK_SESSIONS.filter((s) => s.status === "complete").length;
  const meta = ATHLETE_PAGE_META.programme;

  const openSession = useCallback((id: string, title?: string) => {
    setSessionId(id);
    setSessionTitle(title);
  }, []);

  return (
    <PageContent>
      <PageHeader
        eyebrow={meta.eyebrow}
        title={meta.title}
        subtitle={`${meta.subtitle} · Week ${a.currentWeek} of ${a.totalWeeks}`}
        action={
          <select
            className="min-h-[44px] rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-300"
            defaultValue={String(a.currentWeek)}
            aria-label="Week selector"
          >
            <option value={String(a.currentWeek)}>Week {a.currentWeek} (current)</option>
            <option disabled>Earlier weeks — coming soon</option>
          </select>
        }
      />

      <div className={`${athleteCard} ${athleteCardPadding}`}>
        <p className={eyebrowClass}>
          Block {a.blockId} · {block.name} · {MOCK_WEEK_RATIONALE.weekRole}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-zinc-300">{MOCK_WEEK_RATIONALE.whyMatters}</p>
        <ul className="mt-4 space-y-1.5">
          {MOCK_WEEK_RATIONALE.prioritise.map((item) => (
            <li key={item} className="flex gap-2 text-sm text-zinc-400">
              <span className="text-yellow-400">›</span>
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-4 border-t border-zinc-800 pt-4 text-xs italic text-zinc-500">
          Coach: {MOCK_WEEK_RATIONALE.coachNote}
        </p>
      </div>

      <section>
        <SectionTitle
          title="This week's sessions"
          description={`${completed} of ${MOCK_WEEK_SESSIONS.length} complete`}
          action={
            <ProgressBar
              value={Math.round((completed / MOCK_WEEK_SESSIONS.length) * 100)}
              className="w-32"
            />
          }
        />
        <div className="space-y-4">
          {MOCK_WEEK_SESSIONS.map((session) => (
            <WeekSessionCard
              key={session.id}
              session={session}
              onView={() => openSession(session.id, session.name)}
              onLog={() => openSession(session.id, session.name)}
            />
          ))}
        </div>
      </section>

      <SessionDrawer
        sessionId={sessionId}
        sessionTitle={sessionTitle}
        onClose={() => {
          setSessionId(null);
          setSessionTitle(undefined);
        }}
      />
    </PageContent>
  );
}
