import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  buildAthleteAccessDebug,
  evaluateAthleteEmailAccess,
} from "@/app/lib/hyroxAthleteAutoLink";
import { getHyroxAccessContext } from "@/app/lib/hyroxAccess";
import { logHyroxAuthDebug } from "@/app/lib/hyroxAuthDebug";
import { resolveHyroxPortalAthlete } from "@/app/lib/hyroxAthletePortalResolve";
import { buildAthleteLoginNextFromRequest } from "@/app/lib/authRedirectUrl";
import { hasSupabaseAuthCookieNames } from "@/app/lib/supabase/apiRoute";
import { resolveAuthUserForMiddleware } from "@/app/lib/supabase/resolveAuthUser";
import { createClient } from "@/app/lib/supabase/server";
import { AthletePaymentPendingNotice } from "@/components/athlete-command-centre/AthletePaymentPendingNotice";
import { AthleteUnlinkedNotice } from "@/components/athlete-command-centre/AthleteUnlinkedNotice";
import { buildHyroxPortalServerAuth } from "@/app/lib/hyroxAthletePortalContract";
import { createHyroxPortalMutationToken } from "@/app/lib/hyroxPortalMutationToken";
import {
  AthletePortalProvider,
  type PortalAthleteSummary,
  type PortalLayoutAuth,
} from "@/components/athlete-command-centre/athletePortalContext";

const ATHLETE_PUBLIC_PATHS = new Set(["/athlete/login", "/athlete/no-access"]);

async function athletePathFromHeaders(): Promise<string> {
  const headerStore = await headers();
  const requested = headerStore.get("x-pathname") ?? "/athlete";
  return requested.split("?")[0] ?? "/athlete";
}

/** Auth: middleware. Payment + link gates before portal content. */
export default async function AthleteLayout({ children }: { children: React.ReactNode }) {
  const pathname = await athletePathFromHeaders();
  const cookieStore = await cookies();
  const hasSupabaseAuthCookie = hasSupabaseAuthCookieNames(cookieStore.getAll());

  const supabase = await createClient();
  const { user } = await resolveAuthUserForMiddleware(supabase, hasSupabaseAuthCookie);

  const layoutAuth: PortalLayoutAuth = {
    hasSession: Boolean(user),
    email: user?.email?.trim().toLowerCase() ?? null,
    userId: user?.id ?? null,
    hasSupabaseAuthCookie,
  };

  if (!user) {
    if (!ATHLETE_PUBLIC_PATHS.has(pathname)) {
      const next = buildAthleteLoginNextFromRequest(pathname, "");
      redirect(`/athlete/login?next=${encodeURIComponent(next)}`);
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
