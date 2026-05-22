"use client";

import { Play } from "lucide-react";
import Link from "next/link";
import { AthletePortalNavLink } from "./AthletePortalNavLink";
import { MOCK_ATHLETE, MOCK_CHECK_IN, MOCK_NEXT_SESSION } from "@/app/lib/hyroxTeamDashboardMock";
import { sessionTypeStyle } from "@/components/hyrox-team/HyroxDashboardUi";
import {
  BtnPrimary,
  BtnSecondary,
  StatusBadge,
  athleteCard,
  athleteCardHighlight,
  athleteCardPadding,
  btnPrimaryClass,
  btnGhostClass,
  eyebrowClass,
} from "./athleteUi";
import { nextSessionDisplayForDashboard } from "@/app/lib/hyroxAthleteDashboardLive";
import { useAthleteDashboardLive } from "./useAthleteDashboardLive";
import { ATHLETE_PROGRAMME_HREF } from "./athleteNav";
import { useAthletePortal } from "./athletePortalContext";

type Props = {
  onViewSession: () => void;
  onLogResult: () => void;
};

export function HomeStickyActions({ onViewSession, onLogResult }: Props) {
  const { useMockPreview } = useAthletePortal();
  const { useLive, dashboardLive } = useAthleteDashboardLive();
  const useMockData = useMockPreview;

  const next =
    useLive && dashboardLive
      ? nextSessionDisplayForDashboard(dashboardLive)
      : useMockData
        ? { ...MOCK_NEXT_SESSION, actionable: true }
        : { ...MOCK_NEXT_SESSION, sessionId: "", name: "—", actionable: false };
  const nextActionable = "actionable" in next && next.actionable && Boolean(next.sessionId);
  const checkInDue = useLive && dashboardLive ? dashboardLive.checkInDue : useMockData && MOCK_CHECK_IN.status === "Due";
  const checkInStatus =
    useLive && dashboardLive ? dashboardLive.checkInStatus : useMockData ? MOCK_CHECK_IN.status : "After Week 1";
  const checkInSub =
    useLive && dashboardLive
      ? dashboardLive.checkInSub
      : useMockData
        ? `Due ${MOCK_CHECK_IN.dueLabel}`
        : "Weekly check-ins unlock after your first training week";
  const coachingFocus =
    useLive && dashboardLive
      ? dashboardLive.coachingFocus
      : useMockData
        ? MOCK_ATHLETE.coachingFocus
        : "Your coach will share focus notes when your programme is live.";

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-32 space-y-4">
        <div className={`${athleteCardHighlight} ${athleteCardPadding}`}>
          <p className={eyebrowClass}>Next session</p>
          <p className="mt-2 text-lg font-bold text-white">{next.name}</p>
          <p className="mt-1 text-xs text-zinc-500">
            {next.dateLabel ?? next.day} · {next.duration}
          </p>
          <span className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] ${sessionTypeStyle(next.type)}`}>
            {next.type}
          </span>
          <div className="mt-4 space-y-2">
            <BtnPrimary className="w-full" disabled={!nextActionable} onClick={onViewSession}>
              <Play className="h-4 w-4" />
              View session
            </BtnPrimary>
            <BtnSecondary className="w-full" disabled={!nextActionable} onClick={onLogResult}>
              Log result
            </BtnSecondary>
            <AthletePortalNavLink href={ATHLETE_PROGRAMME_HREF} className={`${btnGhostClass} w-full`}>
              Full programme →
            </AthletePortalNavLink>
          </div>
        </div>

        <div className={`${athleteCard} ${athleteCardPadding}`}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-white">Check-in</span>
            <StatusBadge tone={checkInDue ? "warn" : "success"}>{checkInStatus}</StatusBadge>
          </div>
          <p className="mt-1 text-xs text-zinc-500">{checkInSub}</p>
          {checkInDue ? (
            <Link href="/athlete/check-in" className={`${btnPrimaryClass} mt-3 w-full`}>
              Complete check-in
            </Link>
          ) : (
            <Link href="/athlete/check-in" className={`${btnGhostClass} mt-3 w-full`}>
              View check-in →
            </Link>
          )}
        </div>

        <div className={`${athleteCard} ${athleteCardPadding}`}>
          <p className={`${eyebrowClass} !text-zinc-500`}>Coach focus</p>
          <p className="mt-2 line-clamp-4 text-xs leading-relaxed text-zinc-400">{coachingFocus}</p>
          <Link
            href="/athlete/coach-notes"
            className="mt-3 inline-flex text-xs font-semibold text-yellow-400 hover:text-yellow-300"
          >
            All coach notes →
          </Link>
        </div>
      </div>
    </aside>
  );
}
