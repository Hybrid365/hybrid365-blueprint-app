import Link from "next/link";
import { HyroxPageShell } from "@/components/hyrox-team/HyroxTeamUi";

export function AthletePaymentPendingNotice() {
  return (
    <HyroxPageShell maxWidth="max-w-lg">
      <main className="flex min-h-[50vh] flex-col justify-center py-16 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400/90">
          Payment pending
        </p>
        <h1 className="mt-4 text-2xl font-semibold text-white">Assessment not unlocked yet</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-zinc-400">
          Your payment is not confirmed yet. Once confirmed, your assessment will unlock.
        </p>
        <p className="mx-auto mt-3 max-w-md text-xs text-zinc-500">
          If you have already paid, your coach will confirm payment manually and link your account shortly.
        </p>
        <Link
          href="/hyrox-team"
          className="mx-auto mt-8 rounded-xl border border-zinc-700 px-5 py-2.5 text-sm font-medium text-white hover:border-zinc-500"
        >
          Hyrox Team
        </Link>
      </main>
    </HyroxPageShell>
  );
}
