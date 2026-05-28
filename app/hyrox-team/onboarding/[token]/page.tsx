import type { Metadata } from "next";
import Link from "next/link";
import AssessmentFormShell from "@/app/athlete/assessment/AssessmentFormShell";
import { verifyHyroxOnboardingLinkToken } from "@/app/lib/hyroxOnboardingLinkToken";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";
import { fetchHyroxAthleteById } from "@/app/lib/hyroxAthleteCoachDb";

export const metadata: Metadata = {
  title: "Hyrox Team Onboarding",
  description: "Complete your personal Hybrid365 Hyrox Team onboarding assessment.",
};

type RouteContext = { params: Promise<{ token: string }> };

function InvalidOnboardingLink() {
  return (
    <main className="mx-auto min-h-screen max-w-[760px] px-4 py-12 text-zinc-100 sm:px-6">
      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 sm:p-8">
        <p className="m-0 text-xs font-black uppercase tracking-wide text-[#f4d23c]">Onboarding link</p>
        <h1 className="m-0 mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
          This onboarding link is invalid
        </h1>
        <p className="m-0 mt-4 text-sm leading-relaxed text-zinc-400">
          Please contact your coach and ask for a new onboarding link.
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

export default async function HyroxTeamOnboardingTokenPage({ params }: RouteContext) {
  const { token } = await params;
  const verified = verifyHyroxOnboardingLinkToken(token);
  if (!verified.ok) return <InvalidOnboardingLink />;

  const { client } = await createCoachServerClient();
  const { athlete, error } = await fetchHyroxAthleteById(client, verified.payload.athleteId);
  if (error || !athlete) return <InvalidOnboardingLink />;
  if (athlete.email.trim().toLowerCase() !== verified.payload.email) {
    return <InvalidOnboardingLink />;
  }

  return (
    <AssessmentFormShell
      apiBasePath={`/api/hyrox/onboarding/${encodeURIComponent(token)}/assessment`}
      headingName={athlete.name}
      intro="This is your personal onboarding assessment link. Complete this form so your coach can map your profile and prepare your programme build."
      successMessage="Assessment complete. Your coach can now review your profile and prepare programme generation."
      primaryAfterSubmitHref={null}
    />
  );
}
