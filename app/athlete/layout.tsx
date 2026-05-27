import { headers } from "next/headers";
import {
  buildAthleteAccessDebug,
  evaluateAthleteEmailAccess,
} from "@/app/lib/hyroxAthleteAutoLink";
import { logHyroxAuthDebug } from "@/app/lib/hyroxAuthDebug";
import { buildHyroxPortalServerAuth } from "@/app/lib/hyroxAthletePortalContract";
import { resolveAthletePortalPageAuth } from "@/app/lib/hyroxAthletePortalSnapshot";
import { createHyroxPortalMutationToken } from "@/app/lib/hyroxPortalMutationToken";
import { isHyroxProgrammeRoute } from "@/app/lib/supabase/resolveAuthUser";
import { AthletePaymentPendingNotice } from "@/components/athlete-command-centre/AthletePaymentPendingNotice";
import { AthleteUnlinkedNotice } from "@/components/athlete-command-centre/AthleteUnlinkedNotice";
import {
  AthletePortalProvider,
  type PortalAthleteSummary,
  type PortalLayoutAuth,
} from "@/components/athlete-command-centre/athletePortalContext";

export const dynamic = "force-dynamic";

/** Auth: middleware + resolveAthletePortalPageAuth (sb cookies or h365_athlete_session). */
export default async function AthleteLayout({ children }: { children: React.ReactNode }) {
  const headerStore = await headers();
  const pathname =
    (headerStore.get("x-pathname") ?? "/athlete").split("?")[0] ?? "/athlete";
  const programmeRoute = isHyroxProgrammeRoute(pathname);

  const portalAuth = await resolveAthletePortalPageAuth(pathname);
  const { auth, user, portalResolved } = portalAuth;

  const layoutAuth: PortalLayoutAuth = {
    hasSession: portalAuth.isAuthenticated,
    email: portalAuth.email,
    userId: portalAuth.authUserId,
    hasSupabaseAuthCookie: auth.validSessionCookiesPresent || auth.authCookiesPresent,
  };

  const serverProgrammePublishedSeed = portalAuth.serverProgrammePublished;

  const routeAuthDebug = {
    authSource: portalAuth.source,
    athleteId: portalAuth.athleteId,
    route: pathname,
    wouldRedirectToLogin: portalAuth.wouldRedirectToLogin,
    serverProgrammePublishedSeed,
    publishedSessionsCount: portalAuth.publishedSessionsCount,
  };

  if (programmeRoute) {
    if (process.env.NODE_ENV === "development") {
      console.log("[hyrox-programme-route] layout", {
        pathname,
        ...routeAuthDebug,
        hasUser: Boolean(user),
        h365Session: auth.athleteSessionCookieValid,
      });
    }
  }

  if (!user) {
    if (portalAuth.wouldRedirectToLogin) {
      console.warn("[hyrox-athlete-layout] unauthenticated render (middleware should redirect)", {
        pathname,
        ...routeAuthDebug,
      });
    }

    return (
      <AthletePortalProvider
        hasLinkedAthlete={false}
        portalAthlete={null}
        layoutAuth={layoutAuth}
        portalAuthSource="none"
        routeAuthDebug={routeAuthDebug}
      >
        {children}
      </AthletePortalProvider>
    );
  }

  const resolvedAthlete = portalResolved?.athlete ?? null;
  const accessReason = portalResolved?.accessReason ?? null;
  const portalLinked =
    accessReason === "LINKED" &&
    Boolean(resolvedAthlete?.payment_status === "paid" && resolvedAthlete.user_id === user.id);

  logHyroxAuthDebug("athlete-layout", {
    authUserId: user.id,
    authEmail: user.email ?? null,
    authSource: portalAuth.source,
    matchSource: portalResolved?.matchSource ?? null,
    resolvedAthleteId: resolvedAthlete?.id ?? null,
    emailAccessReason: accessReason,
    portalLinked,
    h365AthleteSession: auth.athleteSessionCookieValid,
    wouldRedirectToLogin: portalAuth.wouldRedirectToLogin,
  });

  if (accessReason === "ATHLETE_EMAIL_LINKED_TO_DIFFERENT_AUTH_USER") {
    return (
      <AthleteUnlinkedNotice
        variant="wrong_auth_user"
        debug={portalResolved?.debug ?? null}
      />
    );
  }

  if (!resolvedAthlete || accessReason === "NO_PAID_ATHLETE_FOUND" || accessReason === "LOOKUP_FAILED") {
    const unlinkedDebug =
      process.env.NODE_ENV === "development" && user.email
        ? (portalResolved?.debug ??
          buildAthleteAccessDebug({
            authUserId: user.id,
            authEmail: user.email,
            athlete: null,
            reason: accessReason === "LOOKUP_FAILED" ? "LOOKUP_FAILED" : "NO_PAID_ATHLETE_FOUND",
          }))
        : null;

    return <AthleteUnlinkedNotice debug={unlinkedDebug} />;
  }

  if (accessReason === "UNLINKED_PAID") {
    const emailAccess = user.email
      ? await evaluateAthleteEmailAccess(user.id, user.email)
      : null;
    const unlinkedDebug =
      process.env.NODE_ENV === "development"
        ? (emailAccess?.debug ?? portalResolved?.debug ?? null)
        : null;
    return <AthleteUnlinkedNotice debug={unlinkedDebug} />;
  }

  if (resolvedAthlete.payment_status !== "paid") {
    return <AthletePaymentPendingNotice />;
  }

  const displayName =
    resolvedAthlete.name?.trim() ||
    user.email?.split("@")[0]?.trim() ||
    "Athlete";

  const portalAthlete: PortalAthleteSummary = {
    id: resolvedAthlete.id,
    name: displayName,
    email: resolvedAthlete.email ?? user.email ?? null,
    status: resolvedAthlete.status,
  };

  const serverAuth = buildHyroxPortalServerAuth({
    layoutAuth,
    hasLinkedAthlete: portalLinked,
    portalAthlete,
    portalMatchSource: portalResolved?.matchSource ?? "none",
  });

  const portalMutationToken = serverAuth.serverAuthConfirmed
    ? createHyroxPortalMutationToken({
        athleteId: resolvedAthlete.id,
        authUserId: user.id,
        email: user.email,
      })
    : null;

  return (
    <AthletePortalProvider
      hasLinkedAthlete={serverAuth.hasLinkedAthlete}
      portalAthlete={serverAuth.portalAthlete}
      portalMatchSource={serverAuth.portalMatchSource}
      layoutAuth={serverAuth.layoutAuth}
      serverAuthConfirmed={portalAuth.serverAuthConfirmed}
      serverProgrammePublishedSeed={serverProgrammePublishedSeed}
      portalMutationToken={portalMutationToken}
      portalAuthSource={portalAuth.source}
      routeAuthDebug={routeAuthDebug}
    >
      {children}
    </AthletePortalProvider>
  );
}
