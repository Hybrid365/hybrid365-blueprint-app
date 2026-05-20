"use client";

import { MOCK_COACHING_HISTORY, MOCK_COACH_NOTES, MOCK_FEEDBACK_PROMPTS } from "@/app/lib/hyroxTeamDashboardMock";
import {
  ATHLETE_PAGE_META,
  PageContent,
  PageHeader,
  SectionTitle,
  athleteCard,
  athleteCardHighlight,
  athleteCardPadding,
  eyebrowClass,
} from "./athleteUi";

function CoachCard({
  label,
  text,
  primary,
  warn,
}: {
  label: string;
  text: string;
  primary?: boolean;
  warn?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-5 sm:p-6 ${
        warn
          ? "border-red-500/25 bg-red-500/5"
          : primary
            ? "border-yellow-500/30 bg-gradient-to-br from-yellow-400/10 to-zinc-900/80"
            : `${athleteCard} bg-zinc-950/50`
      }`}
    >
      <p className={`${eyebrowClass} ${warn ? "!text-red-300/80" : primary ? "" : "!text-zinc-500"}`}>{label}</p>
      <p className="mt-3 text-sm leading-relaxed text-zinc-300">{text}</p>
    </div>
  );
}

export function CoachNotesPageView() {
  const meta = ATHLETE_PAGE_META.coachNotes;

  return (
    <PageContent>
      <PageHeader eyebrow={meta.eyebrow} title={meta.title} subtitle={meta.subtitle} />

      <div className="grid gap-4 lg:grid-cols-2">
        <CoachCard label="Current focus" text={MOCK_COACH_NOTES.currentFocus} primary />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <CoachCard label="Recent adjustment" text={MOCK_COACH_NOTES.recentAdjustment} />
          <CoachCard label="Next priority" text={MOCK_COACH_NOTES.nextPriority} />
        </div>
        <CoachCard label="Avoid this week" text={MOCK_COACH_NOTES.avoidThisWeek} warn />
      </div>

      <div className={`${athleteCardHighlight} ${athleteCardPadding}`}>
        <p className={eyebrowClass}>Why this week is built this way</p>
        <p className="mt-3 text-sm leading-relaxed text-zinc-300">{MOCK_COACH_NOTES.whyThisWeek}</p>
      </div>

      <section>
        <SectionTitle title="This week's feedback prompts" description={MOCK_FEEDBACK_PROMPTS.intro} />
        <ul className="space-y-3">
          {MOCK_FEEDBACK_PROMPTS.items.map((item) => (
            <li key={item.id} className={`list-none ${athleteCard} ${athleteCardPadding}`}>
              <p className="font-semibold text-white">{item.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-zinc-500">{item.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <SectionTitle
          title="Coaching history"
          description="Placeholder — full history will sync from coach reviews"
        />
        <ul className="space-y-3">
          {MOCK_COACHING_HISTORY.map((entry) => (
            <li key={entry.week} className={`list-none ${athleteCard} ${athleteCardPadding}`}>
              <p className="text-xs font-bold text-yellow-400/80">
                Week {entry.week} · {entry.label}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-zinc-400">{entry.summary}</p>
            </li>
          ))}
        </ul>
      </section>
    </PageContent>
  );
}
