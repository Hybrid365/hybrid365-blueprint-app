"use client";

import type { HyroxSession } from "@/app/lib/hyroxTeamDashboardMock";
import type { UpcomingSessionRow } from "@/app/lib/hyrox-team/modules/home/resolveUpcomingSessions";
import { sessionTypeStyle } from "@/components/hyrox-team/HyroxDashboardUi";
import { AthletePortalNavLink } from "../AthletePortalNavLink";
import { athleteCard, athleteCardPadding, eyebrowClass, StatusBadge } from "../athleteUi";

type Props = {
  sessions: UpcomingSessionRow[];
  onOpenSession?: (session: HyroxSession) => void;
  readOnly?: boolean;
};

function sessionStatusLabel(session: HyroxSession): { text: string; tone: "ok" | "warn" | "neutral" } {
  if (session.status === "complete") return { text: "Complete", tone: "ok" };
  if (session.status === "missed") return { text: "Missed", tone: "warn" };
  if (session.status === "modified") return { text: "Modified", tone: "warn" };
  if (session.loggedRpe || session.activityMetrics) return { text: "In progress", tone: "neutral" };
  return { text: "Upcoming", tone: "neutral" };
}

export function HomeUpcomingProgramme({ sessions, onOpenSession, readOnly }: Props) {
  if (sessions.length === 0) return null;

  return (
    <section className={`${athleteCard} ${athleteCardPadding}`} aria-label="Upcoming programme">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className={eyebrowClass}>Upcoming programme</p>
          <h2 className="mt-1 text-base font-bold text-white">What&apos;s next</h2>
        </div>
        {!readOnly ? (
          <AthletePortalNavLink
            href="/athlete/programme"
            className="text-xs font-semibold text-yellow-400 hover:text-yellow-300"
          >
            View full programme →
          </AthletePortalNavLink>
        ) : null}
      </div>

      <ul className="space-y-2">
        {sessions.map(({ session, ymd }) => {
          const status = sessionStatusLabel(session);
          const duration = session.duration?.trim() || "—";
          const row = (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-medium text-yellow-400/80">
                  {session.dateLabel ?? session.day ?? ymd}
                </p>
                <StatusBadge tone={status.tone === "ok" ? "success" : status.tone === "warn" ? "warn" : "neutral"}>
                  {status.text}
                </StatusBadge>
              </div>
              <p className="mt-1 font-medium text-white">{session.name}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] ${sessionTypeStyle(session.type)}`}
                >
                  {session.type}
                </span>
                <span className="text-[10px] text-zinc-500">{duration}</span>
                {session.priority === "Key" ? (
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-yellow-400/80">
                    Key session
                  </span>
                ) : null}
              </div>
            </>
          );

          if (readOnly || !onOpenSession) {
            return (
              <li
                key={session.id}
                className="list-none rounded-xl border border-zinc-800/80 bg-zinc-950/50 px-4 py-3"
              >
                {row}
              </li>
            );
          }

          return (
            <li key={session.id} className="list-none">
              <button
                type="button"
                onClick={() => onOpenSession(session)}
                className="w-full rounded-xl border border-zinc-800/80 bg-zinc-950/50 px-4 py-3 text-left transition hover:border-zinc-700"
              >
                {row}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
