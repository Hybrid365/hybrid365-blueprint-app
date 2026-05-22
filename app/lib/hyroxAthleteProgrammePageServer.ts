import { resolveHyroxPortalAthlete } from "@/app/lib/hyroxAthletePortalResolve";
import { fetchAthleteLiveProgrammeForServer } from "@/app/lib/hyroxAthleteProgrammeServer";
import {
  countProgrammeWeeksGenerated,
  countPublishedSessionsFromProgramme,
  type ProgrammePageRenderDecision,
} from "@/app/lib/hyroxAthleteProgrammePageGate";
import {
  getAthleteLayoutSessionUser,
  resolveLinkedHyroxAthleteForServer,
} from "@/app/lib/hyroxAthletePortalServerAuth";
import { createClient } from "@/app/lib/supabase/server";
import type { PortalAthleteSummary } from "@/components/athlete-command-centre/athletePortalContext";
import type { AthleteLiveProgrammePayload } from "@/components/athlete-command-centre/useAthleteLiveProgramme";

export type ProgrammePageServerDebug = {
  pageExecuted: boolean;
  authUserEmail: string | null;
  authUserId: string | null;
  linkedAthleteId: string | null;
  linkedAthleteEmail: string | null;
  programmePublished: boolean;
  publishedWeekCount: number;
  publishedSessionsCount: number;
  linkFailureReason: string | null;
  wouldHaveRedirectedToLogin: boolean;
  finalRenderDecision: ProgrammePageRenderDecision;
  renderReason: string;
};

export type ProgrammePageServerPayload = {
  debug: ProgrammePageServerDebug;
  initialProgramme: AthleteLiveProgrammePayload | null;
  serverProgrammePublished: boolean;
  serverPortalAthlete: PortalAthleteSummary | null;
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
    publishedSessionsCount: 0,
    linkFailureReason: null,
    wouldHaveRedirectedToLogin: !user,
    finalRenderDecision: "auth-debug",
    renderReason: "pending",
  };

  if (!user) {
    return {
      debug: {
        ...baseDebug,
        finalRenderDecision: "auth-debug",
        renderReason: "No Supabase user resolved on programme page server load.",
      },
      initialProgramme: null,
      serverProgrammePublished: false,
      serverPortalAthlete: null,
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
        finalRenderDecision: "not-linked",
        renderReason: portal.accessReason ?? "LINKED_RESOLVE_FAILED",
      },
      initialProgramme: null,
      serverProgrammePublished: false,
      serverPortalAthlete: null,
      variant: "not-linked",
    };
  }

  const initialProgramme = await fetchAthleteLiveProgrammeForServer(
    linked.athlete,
    linked.user.email
  );

  const publishedWeekCount = countProgrammeWeeksGenerated(initialProgramme);
  const publishedSessionsCount = countPublishedSessionsFromProgramme(initialProgramme);

  const serverProgrammePublished =
    Boolean(initialProgramme?.published) ||
    initialProgramme?.state === "published" ||
    publishedWeekCount > 0;

  const serverPortalAthlete: PortalAthleteSummary = {
    id: linked.athlete.id,
    name:
      linked.athlete.name?.trim() ||
      linked.user.email?.split("@")[0]?.trim() ||
      "Athlete",
    email: linked.athlete.email ?? linked.user.email ?? null,
    status: linked.athlete.status,
  };

  const finalRenderDecision: ProgrammePageRenderDecision = !serverProgrammePublished
    ? "waiting"
    : publishedSessionsCount === 0
      ? "published-empty"
      : "programme";

  const debug: ProgrammePageServerDebug = {
    ...baseDebug,
    linkedAthleteId: linked.athlete.id,
    linkedAthleteEmail: linked.athlete.email ?? linked.user.email ?? null,
    programmePublished: serverProgrammePublished,
    publishedWeekCount,
    publishedSessionsCount,
    linkFailureReason: null,
    wouldHaveRedirectedToLogin: false,
    finalRenderDecision,
    renderReason:
      finalRenderDecision === "programme"
        ? "Linked athlete and published programme resolved on server."
        : finalRenderDecision === "waiting"
          ? "Linked athlete; programme not published yet."
          : "Published programme flag set but zero sessions in server payload.",
  };

  return {
    debug,
    initialProgramme,
    serverProgrammePublished,
    serverPortalAthlete,
    variant: "ready",
  };
}
