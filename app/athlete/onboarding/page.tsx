import type { Metadata } from "next";
import { fetchAthleteOnboardingProgress } from "@/app/lib/hyroxAthleteOnboardingServer";
import { resolveAthletePortalPageAuth } from "@/app/lib/hyroxAthletePortalSnapshot";
import OnboardingStatusClient from "./OnboardingStatusClient";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Onboarding | Hyrox Team Athlete",
  description: "Track your Hybrid365 Hyrox Team athlete onboarding progress.",
};

export default async function AthleteOnboardingPage() {
  const portalAuth = await resolveAthletePortalPageAuth("/athlete/onboarding");
  const athlete = portalAuth.athlete;

  if (!portalAuth.isAuthenticated || !athlete) {
    return (
      <main className="mx-auto min-h-screen max-w-[760px] px-4 py-12 text-zinc-100 sm:px-6">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 sm:p-8">
          <p className="m-0 text-xs font-black uppercase tracking-wide text-[#f4d23c]">Onboarding access</p>
          <h1 className="m-0 mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
            Account not linked yet
          </h1>
          <p className="m-0 mt-4 text-sm leading-relaxed text-zinc-400">
            Your athlete dashboard is not linked yet. Your coach may still be setting up your profile
            and training programme.
          </p>
          <p className="m-0 mt-3 text-sm leading-relaxed text-zinc-400">
            Please make sure you used the same email you applied with. If you think your dashboard
            should already be ready, message your coach and we&apos;ll get it linked.
          </p>
          <p className="m-0 mt-3 text-sm leading-relaxed text-zinc-500">
            Once your profile is linked, you&apos;ll be able to access your dashboard, programme,
            weekly check-ins and session logging.
          </p>
          <Link
            href="/athlete/login"
            className="mt-6 inline-flex min-h-[46px] items-center justify-center rounded-full bg-[#f4d23c] px-6 text-sm font-black text-[#050505] transition hover:opacity-90"
          >
            Back to login
          </Link>
        </section>
      </main>
    );
  }

  const progress = athlete ? await fetchAthleteOnboardingProgress(athlete) : null;

  return (
    <OnboardingStatusClient
      athleteName={athlete?.name ?? null}
      initialProgress={progress}
    />
  );
}
