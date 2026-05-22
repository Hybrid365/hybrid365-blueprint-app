import { resolveHyroxPortalAthlete } from "@/app/lib/hyroxAthletePortalResolve";
import { fetchAthleteLiveProgrammeForServer } from "@/app/lib/hyroxAthleteProgrammeServer";
import {
  getAthleteLayoutSessionUser,
  resolveLinkedHyroxAthleteForServer,
} from "@/app/lib/hyroxAthletePortalServerAuth";
import { createClient } from "@/app/lib/supabase/server";
import type { AthleteLiveProgrammePayload } from "@/components/athlete-command-centre/useAthleteLiveProgramme";

export type ProgrammePageServerDebug = {
  pageExecuted: boolean;
  authUserEmail: string | null;
  authUserId: string | null;
  linkedAthleteId: string | null;
  linkedAthleteEmail: string | null;
  programmePublished: boolean;
  publishedWeekCount: number;
  linkFailureReason: string | null;
  /** Dev: programme page used to redirect here when user was null. */
  wouldHaveRedirectedToLogin: boolean;
};

export type ProgrammePageServerPayload = {
  debug: ProgrammePageServerDebug;
  initialProgramme: AthleteLiveProgrammePayload | null;
  serverProgrammePublished: boolean;
  variant: "ready" | "no-session" | "not-linked";
};

export async function loadAthleteProgrammePageServer(): Promise<ProgrammePageServerPayload> {
  const user = await getAthleteLayoutSessionUser();

  const baseDebug: ProgrammePageServerDebug = {
    pageExecuted: true,
    authUserEmail: user?.email?.trim().toLowerCase() ?? null,
    authUserId: user?.id ?? null,
    linkedAthleteId: null,
    linkedAthleteEmail: null,
    programmePublished: false,
    publishedWeekCount: 0,
    linkFailureReason: null,
    wouldHaveRedirectedToLogin: !user,
  };

  if (!user) {
    return {
      debug: baseDebug,
      initialProgramme: null,
      serverProgrammePublished: false,
      variant: "no-session",
    };
  }

  const linked = await resolveLinkedHyroxAthleteForServer();
  if (!linked) {
    const supabase = await createClient();
    const portal = await resolveHyroxPortalAthlete({
      user,
      supabase,
      attemptAutoLink: true,
    });

    return {
      debug: {
        ...baseDebug,
        linkFailureReason: portal.accessReason ?? "LINKED_RESOLVE_FAILED",
      },
      initialProgramme: null,
      serverProgrammePublished: false,
      variant: "not-linked",
    };
  }

  const initialProgramme = await fetchAthleteLiveProgrammeForServer(
    linked.athlete,
    linked.user.email
  );

  const publishedWeekCount =
    initialProgramme?.programmeWeeks?.filter((w) => w.generated).length ?? 0;

  const serverProgrammePublished =
    Boolean(initialProgramme?.published) ||
    initialProgramme?.state === "published" ||
    publishedWeekCount > 0;

  const debug: ProgrammePageServerDebug = {
    ...baseDebug,
    linkedAthleteId: linked.athlete.id,
    linkedAthleteEmail: linked.athlete.email ?? linked.user.email ?? null,
    programmePublished: serverProgrammePublished,
    publishedWeekCount,
    linkFailureReason: null,
    wouldHaveRedirectedToLogin: false,
  };

  return {
    debug,
    initialProgramme,
    serverProgrammePublished,
    variant: "ready",
  };
}
