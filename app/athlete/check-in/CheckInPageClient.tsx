"use client";

import Link from "next/link";
import { ActiveAthletePage } from "@/components/athlete-command-centre/ActiveAthletePage";
import { CheckInPageView } from "@/components/athlete-command-centre/CheckInPageView";
import {
  AthletePortalSeedProvider,
  useAthletePortal,
} from "@/components/athlete-command-centre/athletePortalContext";
import type { CheckInPageServerDebug } from "@/app/lib/hyroxAthleteCheckInPageServer";
import type {
  AthleteCheckInSummary,
  AthleteWeeklyCheckInView,
} from "@/app/lib/hyroxAthleteCheckInServer";
import type { PortalAthleteSummary } from "@/components/athlete-command-centre/athletePortalContext";
import type { AthleteLiveProgrammePayload } from "@/components/athlete-command-centre/useAthleteLiveProgramme";

type Variant = "ready" | "no-session" | "not-linked" | "waiting";

function CheckInAuthBlocked({
  title,
  message,
  debug,
}: {
  title: string;
  message: string;
  debug: CheckInPageServerDebug;
}) {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center text-white">
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="mt-3 text-sm text-zinc-400">{message}</p>
      {process.env.NODE_ENV === "development" ? (
        <p className="mt-2 text-[10px] font-mono text-zinc-600">
          {debug.reasonNotSignedIn ?? "—"} · auth: {debug.authSource}
        </p>
      ) : null}
      <div className="mt-6">
        <Link
          href="/athlete/login?next=/athlete/check-in"
          className="rounded-full bg-yellow-400 px-4 py-2 text-sm font-semibold text-black"
        >
          Athlete login
        </Link>
      </div>
    </div>
  );
}

function CheckInPageInner({
  variant,
  serverDebug,
  initialCheckIn,
  initialSummary,
  serverProgrammePublished,
  serverPortalAthlete,
  serverProgramme,
}: {
  variant: Variant;
  serverDebug: CheckInPageServerDebug;
  initialCheckIn: AthleteWeeklyCheckInView | null;
  initialSummary: AthleteCheckInSummary | null;
  serverProgrammePublished: boolean;
  serverPortalAthlete: PortalAthleteSummary | null;
  serverProgramme: AthleteLiveProgrammePayload | null;
}) {
  const { serverAuthConfirmed, hasLinkedAthlete } = useAthletePortal();

  const serverResolved =
    variant === "ready" ||
    variant === "waiting" ||
    Boolean(serverPortalAthlete?.id) ||
    (serverAuthConfirmed && hasLinkedAthlete);

  if (variant === "no-session" && !serverAuthConfirmed) {
    return (
      <CheckInAuthBlocked
        title="Sign in required"
        message="Sign in to complete your weekly check-in."
        debug={serverDebug}
      />
    );
  }

  if (variant === "not-linked" && !serverAuthConfirmed) {
    return (
      <CheckInAuthBlocked
        title="Account not linked"
        message="Your login is not linked to a paid Hyrox athlete profile yet. Contact your coach."
        debug={serverDebug}
      />
    );
  }

  return (
    <AthletePortalSeedProvider
      serverProgrammePublished={serverProgrammePublished}
      serverProgramme={serverProgramme}
      serverPortalAthlete={serverPortalAthlete}
    >
      <ActiveAthletePage allowLinkedProgrammeAccess>
        <CheckInPageView
          initialCheckIn={initialCheckIn}
          initialSummary={initialSummary}
          serverDebug={serverDebug}
          serverResolved={serverResolved}
        />
      </ActiveAthletePage>
    </AthletePortalSeedProvider>
  );
}

export default function CheckInPageClient(props: {
  variant: Variant;
  serverDebug: CheckInPageServerDebug;
  initialCheckIn?: AthleteWeeklyCheckInView | null;
  initialSummary?: AthleteCheckInSummary | null;
  serverProgrammePublished?: boolean;
  serverPortalAthlete?: PortalAthleteSummary | null;
  serverProgramme?: AthleteLiveProgrammePayload | null;
}) {
  return (
    <CheckInPageInner
      variant={props.variant}
      serverDebug={props.serverDebug}
      initialCheckIn={props.initialCheckIn ?? null}
      initialSummary={props.initialSummary ?? null}
      serverProgrammePublished={props.serverProgrammePublished ?? false}
      serverPortalAthlete={props.serverPortalAthlete ?? null}
      serverProgramme={props.serverProgramme ?? null}
    />
  );
}
