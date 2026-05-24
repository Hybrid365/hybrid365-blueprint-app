import type { Metadata } from "next";
import Link from "next/link";
import type { AthleteOnboardingProgress } from "@/app/lib/hyroxAthleteOnboardingFlow";
import { fetchAthleteOnboardingProgress } from "@/app/lib/hyroxAthleteOnboardingServer";
import { fetchAthleteLiveProgrammeForServer } from "@/app/lib/hyroxAthleteProgrammeServer";
import { resolveLinkedHyroxAthleteForServer } from "@/app/lib/hyroxAthletePortalServerAuth";
import { resolveAthletePortalPageAuth } from "@/app/lib/hyroxAthletePortalSnapshot";
import { AthletePortalSeedProvider } from "@/components/athlete-command-centre/athletePortalContext";
import DashboardPageClient from "./DashboardPageClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard | Hyrox Team Athlete",
  description: "Your Hybrid365 Hyrox Team athlete dashboard.",
};

function DashboardAuthBlocked({ reason }: { reason: string }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center text-white">
      <h1 className="text-xl font-semibold">Sign in required</h1>
      <p className="mt-3 text-sm text-zinc-400">{reason}</p>
      <p className="mt-2 text-xs text-zinc-500">
        Sign in again to load your dashboard and programme.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/athlete/login?next=/athlete/dashboard"
          className="rounded-full bg-yellow-400 px-4 py-2 text-sm font-semibold text-black"
        >
          Athlete login
        </Link>
      </div>
    </div>
  );
}

export default async function AthleteDashboardPage() {
  const portalAuth = await resolveAthletePortalPageAuth("/athlete/dashboard");
  const { auth, user } = portalAuth;

  const layoutAuth = {
    hasSession: Boolean(user),
    email: auth.authUserEmail,
    userId: auth.authUserId,
    hasSupabaseAuthCookie: auth.validSessionCookiesPresent || auth.authCookiesPresent,
  };

  const serverAuthConfirmed = portalAuth.serverAuthConfirmed;

  if (!serverAuthConfirmed) {
    const reason = !user
      ? "No Supabase user on this request."
      : !auth.validSessionCookiesPresent
        ? "Auth cookie names may be present but session values are empty or invalid."
        : "Session could not be verified.";
    return <DashboardAuthBlocked reason={reason} />;
  }

  let initialProgress: AthleteOnboardingProgress | null = null;
  let initialProgramme = null;

  const linked = await resolveLinkedHyroxAthleteForServer();
  if (!linked) {
    return (
      <DashboardAuthBlocked reason="Signed in but no linked paid Hyrox athlete profile for this account." />
    );
  }

  const [progress, programme] = await Promise.all([
    fetchAthleteOnboardingProgress(linked.athlete),
    fetchAthleteLiveProgrammeForServer(linked.athlete, linked.user.email),
  ]);
  initialProgress = progress;
  initialProgramme = programme;

  const serverProgrammePublished =
    Boolean(initialProgress?.programmePublished) ||
    Boolean(initialProgramme?.published) ||
    (initialProgramme?.programmeWeeks?.filter((w) => w.generated).length ?? 0) > 0;

  return (
    <AthletePortalSeedProvider
      serverProgrammePublished={serverProgrammePublished}
      serverProgramme={initialProgramme}
      serverPortalAthlete={{
        id: linked.athlete.id,
        name:
          linked.athlete.name?.trim() ||
          linked.user.email?.split("@")[0]?.trim() ||
          "Athlete",
        email: linked.athlete.email ?? linked.user.email ?? null,
        status: linked.athlete.status,
      }}
    >
      <DashboardPageClient
        initialProgress={initialProgress}
        serverAuthConfirmed={serverAuthConfirmed}
        dataSource="server-linked-athlete"
        resolvedAthleteId={linked.athlete.id}
      />
    </AthletePortalSeedProvider>
  );
}
