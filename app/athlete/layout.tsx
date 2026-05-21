import {
  evaluateAthleteEmailAccess,
  isAthletePortalLinked,
  shouldShowAthleteUnlinkedNotice,
} from "@/app/lib/hyroxAthleteAutoLink";
import { getHyroxAccessContext } from "@/app/lib/hyroxAccess";
import { logHyroxAuthDebug } from "@/app/lib/hyroxAuthDebug";
import { getCurrentHyroxAthlete } from "@/app/lib/hyroxCurrentAthlete";
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

  const [ctx, athleteByUserId, emailAccess] = await Promise.all([
    getHyroxAccessContext(),
    getCurrentHyroxAthlete(),
    user?.email
      ? evaluateAthleteEmailAccess(user.id, user.email)
      : Promise.resolve(null),
  ]);

  const resolvedAthlete =
    athleteByUserId ??
    (isAthletePortalLinked(emailAccess) ? (emailAccess?.athlete ?? null) : null);

  const portalLinked = isAthletePortalLinked(emailAccess) || Boolean(resolvedAthlete?.user_id);

  logHyroxAuthDebug("athlete-layout", {
    authUserId: user?.id ?? null,
    authEmail: user?.email ?? null,
    profileRole: ctx?.profileRole ?? null,
    hyroxAthleteId: ctx?.hyroxAthleteId ?? null,
    isAthlete: ctx?.isAthlete ?? false,
    athleteByUserId: athleteByUserId?.id ?? null,
    resolvedAthleteId: resolvedAthlete?.id ?? null,
    resolvedAthleteUserId: resolvedAthlete?.user_id ?? null,
    athleteStatus: resolvedAthlete?.status ?? null,
    athletePaymentStatus: resolvedAthlete?.payment_status ?? null,
    emailAccessReason: emailAccess?.debug.accessReason ?? null,
    portalLinked,
  });

  if (
    user?.email &&
    emailAccess?.debug.accessReason === "ATHLETE_EMAIL_LINKED_TO_DIFFERENT_AUTH_USER"
  ) {
    return (
      <AthleteUnlinkedNotice
        variant="wrong_auth_user"
        debug={emailAccess.debug}
      />
    );
  }

  if (
    shouldShowAthleteUnlinkedNotice({
      user,
      emailAccess,
      resolvedAthlete,
    })
  ) {
    return (
      <AthleteUnlinkedNotice
        debug={
          process.env.NODE_ENV === "development" ? emailAccess?.debug ?? null : null
        }
      />
    );
  }

  if (resolvedAthlete && resolvedAthlete.payment_status !== "paid") {
    return <AthletePaymentPendingNotice />;
  }

  const portalAthlete: PortalAthleteSummary | null = resolvedAthlete
    ? {
        id: resolvedAthlete.id,
        name: resolvedAthlete.name?.trim() || user?.email?.trim() || "Athlete",
        email: resolvedAthlete.email ?? user?.email ?? null,
        status: resolvedAthlete.status,
      }
    : null;

  return (
    <AthletePortalProvider hasLinkedAthlete={portalLinked} portalAthlete={portalAthlete}>
      {children}
    </AthletePortalProvider>
  );
}
