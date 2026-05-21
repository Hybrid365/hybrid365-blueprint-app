import Link from "next/link";

export const metadata = {
  title: "Athlete access required | Hybrid365 Hyrox",
  robots: { index: false, follow: false },
};

export default function HyroxAthleteNoAccessPage() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold text-white">Hyrox athlete access required</h1>
      <p className="mt-4 text-sm leading-relaxed text-zinc-400">
        The athlete portal is for accepted Hyrox Team members. Sign in with the email linked to
        your athlete record, or ask your coach to set{" "}
        <code className="text-zinc-300">profiles.role</code> to{" "}
        <code className="text-zinc-300">athlete</code> and link your account in{" "}
        <code className="text-zinc-300">hyrox_athletes.user_id</code>.
      </p>
      <p className="mt-3 text-xs text-zinc-500">
        Use the same email address your coach has on your Hyrox Team athlete record.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/hyrox-team"
          className="rounded-xl border border-zinc-700 px-5 py-2.5 text-sm font-medium text-white hover:border-zinc-500"
        >
          Hyrox Team
        </Link>
        <Link
          href="/athlete/login?next=/athlete/onboarding"
          className="rounded-xl bg-[#F4D23C] px-5 py-2.5 text-sm font-semibold text-black hover:bg-[#e5c436]"
        >
          Athlete login
        </Link>
      </div>
    </main>
  );
}
