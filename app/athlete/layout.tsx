import {
  buildAthleteAccessDebug,
  evaluateAthleteEmailAccess,
} from "@/app/lib/hyroxAthleteAutoLink";
import { getHyroxAccessContext } from "@/app/lib/hyroxAccess";
import { logHyroxAuthDebug } from "@/app/lib/hyroxAuthDebug";
import { resolveHyroxPortalAthlete } from "@/app/lib/hyroxAthletePortalResolve";
import { createClient } from "@/app/lib/supabase/server";
import { AthletePaymentPendingNotice } from "@/components/athlete-command-centre/AthletePaymentPendingNotice";
import { AthleteUnlinkedNotice } from "@/components/athlete-command-centre/AthleteUnlinkedNotice";
import {
  AthletePortalProvider,
  type PortalAthleteSummary,
} from "@/components/athlete-command-centre/athletePortalContext";

/** Auth: middleware. Payment + link gates before portal content. */
export default async function AthleteLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <AthletePortalProvider hasLinkedAthlete={false} portalAthlete={null}>
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

  return (
    <AthletePortalProvider
      hasLinkedAthlete={hasLinkedAthlete}
      portalAthlete={portalAthlete}
      portalMatchSource={portalResolved.matchSource}
    >
      {children}
    </AthletePortalProvider>
  );
}
