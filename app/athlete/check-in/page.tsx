import type { Metadata } from "next";
import { loadAthleteCheckInPageServer } from "@/app/lib/hyroxAthleteCheckInPageServer";
import CheckInPageClient from "./CheckInPageClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Check-In | Hyrox Team Athlete",
};

export default async function AthleteCheckInPage() {
  const payload = await loadAthleteCheckInPageServer();

  return (
    <CheckInPageClient
      variant={payload.variant}
      serverDebug={payload.debug}
      initialCheckIn={payload.initialCheckIn}
      initialSummary={payload.initialSummary}
      serverProgrammePublished={payload.serverProgrammePublished}
      serverPortalAthlete={payload.serverPortalAthlete}
      serverProgramme={payload.serverProgramme}
    />
  );
}
