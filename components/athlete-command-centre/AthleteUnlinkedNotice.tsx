import Link from "next/link";
import { HyroxPageShell } from "@/components/hyrox-team/HyroxTeamUi";
import type { HyroxAthleteAccessDebug } from "@/app/lib/hyroxAthleteAutoLink";

type AthleteUnlinkedNoticeProps = {
  variant?: "unlinked" | "wrong_auth_user";
  debug?: HyroxAthleteAccessDebug | null;
};

export function AthleteUnlinkedNotice({
  variant = "unlinked",
  debug = null,
}: AthleteUnlinkedNoticeProps) {
  const isWrongAuth = variant === "wrong_auth_user";

  return (
    <HyroxPageShell maxWidth="max-w-lg">
      <main className="flex min-h-[50vh] flex-col justify-center py-16 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-yellow-400/90">
          Hybrid365 Hyrox Team
        </p>
        <h1 className="mt-4 text-2xl font-semibold text-white">
          {isWrongAuth ? "Sign-in account mismatch" : "Account not linked yet"}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-zinc-400">
          {isWrongAuth ? (
            <>
              Your email matches a paid Hyrox Team athlete profile, but it is linked to a different
              sign-in account. Sign out and try the login you used when you first signed up, or ask
              your coach to use <strong className="font-medium text-zinc-300">Relink to auth user</strong>{" "}
              in the coach dashboard.
            </>
          ) : (
            <>
              Your athlete account is not linked yet. If you have just joined, your coach will activate
              your dashboard shortly.
            </>
          )}
        </p>
        {process.env.NODE_ENV === "development" ? (
          <div className="mx-auto mt-6 max-w-md text-left text-xs text-zinc-500">
            <p>
              <span className="font-semibold text-zinc-400">Authenticated email:</span>{" "}
              {debug?.authEmail ?? "—"}
            </p>
            <p className="mt-1">
              <span className="font-semibold text-zinc-400">hyrox_athletes match:</span>{" "}
              {debug?.emailMatchFound ? "email found" : "no matching hyrox_athletes row for this sign-in"}
            </p>
            {debug && Object.keys(debug).length > 0 ? (
              <pre className="mt-3 overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-[10px] leading-relaxed">
                {JSON.stringify(debug, null, 2)}
              </pre>
            ) : null}
          </div>
        ) : null}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/logout?next=/athlete/login"
            className="rounded-xl border border-zinc-700 px-5 py-2.5 text-sm font-medium text-white hover:border-zinc-500"
          >
            Sign out & try again
          </Link>
          <Link
            href="/athlete/login?next=/athlete/onboarding"
            className="rounded-xl bg-[#F4D23C] px-5 py-2.5 text-sm font-semibold text-black hover:bg-[#e5c436]"
          >
            Return to athlete login
          </Link>
        </div>
      </main>
    </HyroxPageShell>
  );
}
