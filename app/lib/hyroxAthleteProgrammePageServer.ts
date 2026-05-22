import {
  programmeRenderDecisionFromSnapshot,
  resolveHyroxAthletePortalSnapshot,
} from "@/app/lib/hyroxAthletePortalSnapshot";
import type { ProgrammePageRenderDecision } from "@/app/lib/hyroxAthleteProgrammePageGate";
import type { PortalAthleteSummary } from "@/components/athlete-command-centre/athletePortalContext";
import type { AthleteLiveProgrammePayload } from "@/components/athlete-command-centre/useAthleteLiveProgramme";

export type ProgrammePageServerDebug = {
  pageExecuted: boolean;
  currentUrl: string;
  authCookiesPresent: boolean;
  rawCookieHeaderPresent: boolean;
  middlewareCookiePresent: boolean;
  middlewareUserPresent: boolean;
  middlewareInternalNav: boolean;
  getSessionSucceeded: boolean;
  getUserSucceeded: boolean;
  getUserAfterRetrySucceeded: boolean;
  userSource: string;
  authUserEmail: string | null;
  authUserId: string | null;
  sessionUserId: string | null;
  middlewareAuthUserId: string | null;
  middlewareAuthEmail: string | null;
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
  const snapshot = await resolveHyroxAthletePortalSnapshot({
    routePath: "/athlete/programme",
    loadProgramme: true,
  });

  const { auth, user, athlete, portalAthlete, programme } = snapshot;
  const publishedWeekCount = snapshot.publishedWeekCount;
  const publishedSessionsCount = snapshot.publishedSessionsCount;
  const serverProgrammePublished = snapshot.serverProgrammePublished;

  const baseDebug: Omit<ProgrammePageServerDebug, "finalRenderDecision" | "renderReason"> = {
    pageExecuted: true,
    currentUrl: auth.currentUrl,
    authCookiesPresent: auth.authCookiesPresent,
    rawCookieHeaderPresent: auth.rawCookieHeaderPresent,
    middlewareCookiePresent: auth.middlewareCookiePresent,
    middlewareUserPresent: auth.middlewareUserPresent,
    middlewareInternalNav: auth.middlewareInternalNav,
    getSessionSucceeded: auth.getSessionSucceeded,
    getUserSucceeded: auth.getUserSucceeded,
    getUserAfterRetrySucceeded: auth.getUserAfterRetrySucceeded,
    userSource: auth.userSource,
    authUserEmail: auth.authUserEmail,
    authUserId: auth.authUserId,
    sessionUserId: auth.sessionUserId,
    middlewareAuthUserId: auth.middlewareAuthUserId,
    middlewareAuthEmail: auth.middlewareAuthEmail,
    linkedAthleteId: athlete?.id ?? null,
    linkedAthleteEmail: athlete?.email ?? auth.authUserEmail,
    programmePublished: serverProgrammePublished,
    publishedWeekCount,
    publishedSessionsCount,
    linkFailureReason: snapshot.linkFailureReason,
    wouldHaveRedirectedToLogin: !user && !auth.authCookiesPresent,
  };

  if (!user) {
    const finalRenderDecision: ProgrammePageRenderDecision = "auth-debug";
    return {
      debug: {
        ...baseDebug,
        finalRenderDecision,
        renderReason:
          auth.authCookiesPresent || auth.rawCookieHeaderPresent
            ? "Auth cookies/markers present but no Supabase user after merged-cookie session retry."
            : "No auth cookies, middleware identity, or Supabase user on programme page load.",
      },
      initialProgramme: null,
      serverProgrammePublished: false,
      serverPortalAthlete: null,
      variant: "no-session",
    };
  }

  if (!athlete || !portalAthlete) {
    const finalRenderDecision: ProgrammePageRenderDecision = "not-linked";
    return {
      debug: {
        ...baseDebug,
        finalRenderDecision,
        renderReason: snapshot.linkFailureReason ?? "LINKED_RESOLVE_FAILED",
      },
      initialProgramme: null,
      serverProgrammePublished: false,
      serverPortalAthlete: null,
      variant: "not-linked",
    };
  }

  const finalRenderDecision = programmeRenderDecisionFromSnapshot(snapshot);
  const renderReason =
    finalRenderDecision === "programme"
      ? `Linked athlete ${athlete.id} and programme loaded via portal snapshot (${publishedWeekCount} weeks, ${publishedSessionsCount} sessions).`
      : finalRenderDecision === "waiting"
        ? "Linked athlete resolved; programme not published yet."
        : "Published programme flag set but zero sessions in server payload.";

  return {
    debug: {
      ...baseDebug,
      linkedAthleteId: athlete.id,
      linkedAthleteEmail: athlete.email ?? user.email ?? null,
      programmePublished: serverProgrammePublished,
      publishedWeekCount,
      publishedSessionsCount,
      linkFailureReason: null,
      wouldHaveRedirectedToLogin: false,
      finalRenderDecision,
      renderReason,
    },
    initialProgramme: programme,
    serverProgrammePublished,
    serverPortalAthlete: portalAthlete,
    variant: "ready",
  };
}
