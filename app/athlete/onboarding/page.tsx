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
            Your onboarding is not linked yet
          </h1>
          <p className="m-0 mt-4 text-sm leading-relaxed text-zinc-400">
            Please use the login link sent by your coach so we can open the correct athlete profile.
          </p>
          <Link
            href="/athlete/login"
            className="mt-6 inline-flex min-h-[46px] items-center justify-center rounded-full bg-[#f4d23c] px-6 text-sm font-black text-[#050505] transition hover:opacity-90"
          >
            Open athlete login
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
