import {
  buildAthleteCheckInSummary,
  buildAthleteWeeklyCheckInForProgramme,
  type AthleteWeeklyCheckInView,
  type AthleteCheckInSummary,
} from "@/app/lib/hyroxAthleteCheckInServer";
import { fetchAthleteProgressFlags } from "@/app/lib/hyroxAthleteServer";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";
import { resolveAthletePortalPageAuth } from "@/app/lib/hyroxAthletePortalSnapshot";
import { fetchAthletePublishedProgramme } from "@/app/lib/hyroxProgrammeServer";
import type { PortalAthleteSummary } from "@/components/athlete-command-centre/athletePortalContext";
import type { AthleteLiveProgrammePayload } from "@/components/athlete-command-centre/useAthleteLiveProgramme";

export type CheckInPageServerDebug = {
  route: string;
  authSource: string;
  athleteId: string | null;
  email: string | null;
  serverAuthConfirmed: boolean;
  selectedWeekNumber: number | null;
  programmeWeekId: string | null;
  liveGlobalWeek: number | null;
  reasonNotSignedIn: string | null;
};

export type CheckInPageServerPayload = {
  variant: "ready" | "no-session" | "not-linked" | "waiting";
  initialCheckIn: AthleteWeeklyCheckInView | null;
  initialSummary: AthleteCheckInSummary | null;
  serverProgrammePublished: boolean;
  serverPortalAthlete: PortalAthleteSummary | null;
  serverProgramme: AthleteLiveProgrammePayload | null;
  debug: CheckInPageServerDebug;
};

export async function loadAthleteCheckInPageServer(): Promise<CheckInPageServerPayload> {
  const route = "/athlete/check-in";
  const portal = await resolveAthletePortalPageAuth(route);

  const baseDebug: CheckInPageServerDebug = {
    route,
    authSource: portal.source,
    athleteId: portal.athleteId,
    email: portal.email,
    serverAuthConfirmed: portal.serverAuthConfirmed,
    selectedWeekNumber: null,
    programmeWeekId: null,
    liveGlobalWeek: portal.serverProgramme?.liveGlobalWeek ?? null,
    reasonNotSignedIn: null,
  };

  if (!portal.user) {
    return {
      variant: "no-session",
      initialCheckIn: null,
      initialSummary: null,
      serverProgrammePublished: false,
      serverPortalAthlete: null,
      serverProgramme: null,
      debug: {
        ...baseDebug,
        reasonNotSignedIn: portal.auth.athleteSessionCookieValid
          ? "h365_athlete_session present but user could not be resolved"
          : "No Supabase user or h365_athlete_session on check-in page load",
      },
    };
  }

  if (!portal.serverAuthConfirmed || !portal.athlete || !portal.portalAthlete) {
    return {
      variant: "not-linked",
      initialCheckIn: null,
      initialSummary: null,
      serverProgrammePublished: false,
      serverPortalAthlete: null,
      serverProgramme: null,
      debug: {
        ...baseDebug,
        reasonNotSignedIn: "Signed in but no linked paid Hyrox athlete profile",
      },
    };
  }

  if (!portal.serverProgrammePublished) {
    return {
      variant: "waiting",
      initialCheckIn: null,
      initialSummary: null,
      serverProgrammePublished: false,
      serverPortalAthlete: portal.portalAthlete,
      serverProgramme: portal.serverProgramme,
      debug: baseDebug,
    };
  }

  const { client: supabase } = await createCoachServerClient();
  const flags = await fetchAthleteProgressFlags(supabase, portal.athlete.id);
  const programme = await fetchAthletePublishedProgramme(supabase, portal.athlete, flags);
  const checkIn = await buildAthleteWeeklyCheckInForProgramme(
    supabase,
    portal.athlete,
    programme
  );
  const summary = buildAthleteCheckInSummary(checkIn);

  if (process.env.NODE_ENV === "development") {
    console.log("[athlete-check-in-page] server load", {
      route,
      athleteId: portal.athlete.id,
      authSource: portal.source,
      selectedWeekNumber: checkIn.weekNumber,
      programmeWeekId: checkIn.programmeWeekId,
      liveGlobalWeek: programme.liveGlobalWeek,
    });
  }

  return {
    variant: "ready",
    initialCheckIn: checkIn,
    initialSummary: summary,
    serverProgrammePublished: true,
    serverPortalAthlete: portal.portalAthlete,
    serverProgramme: portal.serverProgramme,
    debug: {
      ...baseDebug,
      selectedWeekNumber: checkIn.weekNumber,
      programmeWeekId: checkIn.programmeWeekId,
      liveGlobalWeek: programme.liveGlobalWeek,
    },
  };
}
