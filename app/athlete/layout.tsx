import { headers, cookies } from "next/headers";
import {
  buildAthleteAccessDebug,
  evaluateAthleteEmailAccess,
} from "@/app/lib/hyroxAthleteAutoLink";
import { getHyroxAccessContext } from "@/app/lib/hyroxAccess";
import { logHyroxAuthDebug } from "@/app/lib/hyroxAuthDebug";
import { resolveHyroxPortalAthlete } from "@/app/lib/hyroxAthletePortalResolve";
import {
  middlewareForwardedAthleteAuth,
  probeAthleteAuthMarkers,
  shouldAthleteLayoutRedirectToLogin,
} from "@/app/lib/supabase/athleteAuthGate";
import { probeHyroxPortalAuth } from "@/app/lib/hyroxAthletePortalSnapshot";
import {
  isAthleteServerPrefetch,
  isHyroxProgrammeRoute,
} from "@/app/lib/supabase/resolveAuthUser";
import { AthletePaymentPendingNotice } from "@/components/athlete-command-centre/AthletePaymentPendingNotice";
import { AthleteUnlinkedNotice } from "@/components/athlete-command-centre/AthleteUnlinkedNotice";
import { buildHyroxPortalServerAuth } from "@/app/lib/hyroxAthletePortalContract";
import { createHyroxPortalMutationToken } from "@/app/lib/hyroxPortalMutationToken";
import {
  AthletePortalProvider,
  type PortalAthleteSummary,
  type PortalLayoutAuth,
} from "@/components/athlete-command-centre/athletePortalContext";

export const dynamic = "force-dynamic";

const ATHLETE_PUBLIC_PATHS = new Set(["/athlete/login", "/athlete/no-access"]);

/** Auth: middleware. Payment + link gates before portal content. */
export default async function AthleteLayout({ children }: { children: React.ReactNode }) {
  const headerStore = await headers();
  const pathname =
    (headerStore.get("x-pathname") ?? "/athlete").split("?")[0] ?? "/athlete";
  const cookieStore = await cookies();
  const authMarkers = probeAthleteAuthMarkers(cookieStore, headerStore);
  const middlewareForwardedAuth = middlewareForwardedAthleteAuth(headerStore);
  const hasSupabaseAuthCookie = authMarkers.present;
  const isPrefetch = isAthleteServerPrefetch(headerStore);
  const programmeRoute = isHyroxProgrammeRoute(pathname);

  const { user, supabase } = await probeHyroxPortalAuth(pathname);

  const layoutAuth: PortalLayoutAuth = {
    hasSession: Boolean(user),
    email: user?.email?.trim().toLowerCase() ?? null,
    userId: user?.id ?? null,
    hasSupabaseAuthCookie,
  };

  if (programmeRoute) {
    console.log("[hyrox-programme-route] layout", {
      pathname,
      hasUser: Boolean(user),
      authMarkers,
      middlewareForwardedAuth,
      isPrefetch,
      isPublicPath: ATHLETE_PUBLIC_PATHS.has(pathname),
    });
  }

  if (!user) {
    const wouldRedirect = shouldAthleteLayoutRedirectToLogin({
      pathname,
      userPresent: false,
      authMarkers,
      middlewareForwardedAuth,
      isPrefetch,
    });

    if (wouldRedirect) {
      /**
       * Login redirect is middleware-only (sets x-hyrox-redirect-source: middleware).
       * Layout must not send users to /athlete/login?next=… when cookies() is empty but
       * middleware already forwarded x-hyrox-cookie-present: yes on the same request.
       */
      console.warn("[hyrox-athlete-layout] unauthenticated render (middleware should redirect)", {
        pathname,
        authMarkers,
        middlewareForwardedAuth,
      });
    }

    return (
      <AthletePortalProvider hasLinkedAthlete={false} portalAthlete={null} layoutAuth={layoutAuth}>
        {children}
      </AthletePortalProvider>
    );
  }

  const [ctx, portalResolved] = await Promise.all([
    getHyroxAccessContext(),
    resolveHyroxPortalAthlete({ user, supabase, attemptAutoLink: true }),
  ]);

  const resolvedAthlete = portalResolved.athlete;
  const accessReason = portalResolved.accessReason;

  const portalLinked =
    accessReason === "LINKED" &&
    Boolean(resolvedAthlete?.payment_status === "paid" && resolvedAthlete.user_id === user.id);

  const hasLinkedAthlete = portalLinked;

  logHyroxAuthDebug("athlete-layout", {
    authUserId: user.id,
    authEmail: user.email ?? null,
    profileRole: ctx?.profileRole ?? null,
    hyroxAthleteId: ctx?.hyroxAthleteId ?? null,
    isAthlete: ctx?.isAthlete ?? false,
    matchSource: portalResolved.matchSource,
    resolvedAthleteId: resolvedAthlete?.id ?? null,
    resolvedAthleteUserId: resolvedAthlete?.user_id ?? null,
    athleteStatus: resolvedAthlete?.status ?? null,
    athletePaymentStatus: resolvedAthlete?.payment_status ?? null,
    emailAccessReason: accessReason,
    portalLinked,
    duplicateEmailCount: portalResolved.duplicateEmailAthletes.length,
    autoLinked: portalResolved.autoLinked,
    hasSupabaseAuthCookie,
  });

  if (accessReason === "ATHLETE_EMAIL_LINKED_TO_DIFFERENT_AUTH_USER") {
    return (
      <AthleteUnlinkedNotice variant="wrong_auth_user" debug={portalResolved.debug} />
    );
  }

  if (!resolvedAthlete || accessReason === "NO_PAID_ATHLETE_FOUND" || accessReason === "LOOKUP_FAILED") {
    const unlinkedDebug =
      process.env.NODE_ENV === "development" && user.email
        ? (portalResolved.debug ??
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
        ? (emailAccess?.debug ?? portalResolved.debug)
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
    hasLinkedAthlete,
    portalAthlete,
    portalMatchSource: portalResolved.matchSource,
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
      serverAuthConfirmed={serverAuth.serverAuthConfirmed}
      portalMutationToken={portalMutationToken}
    >
      {children}
    </AthletePortalProvider>
  );
}
