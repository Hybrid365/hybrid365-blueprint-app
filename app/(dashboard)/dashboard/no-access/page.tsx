import Link from "next/link";
import { redirect } from "next/navigation";
import { claimPendingWhopMembershipForUser } from "@/app/lib/whopMembershipSync";
import { createServiceRoleClient } from "@/app/lib/supabaseAdmin";
import { createClient } from "@/app/lib/supabase/server";

export default async function NoAccessPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.email) {
    try {
      const admin = createServiceRoleClient();
      const claim = await claimPendingWhopMembershipForUser(admin, user.id, user.email);
      if (claim.activated) {
        const { data: membership } = await supabase
          .from("memberships")
          .select("status, expires_at")
          .eq("user_id", user.id)
          .maybeSingle();
        const expiresAt = membership?.expires_at ? new Date(String(membership.expires_at)) : null;
        const notExpired =
          expiresAt === null || Number.isNaN(expiresAt.getTime()) || expiresAt > new Date();
        if (membership?.status === "active" && notExpired) {
          redirect("/dashboard");
        }
      }
    } catch {
      /* claim optional; show no-access */
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 text-center">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#F4D23C]/30 bg-[#F4D23C]/10 text-[#F4D23C]">
          —
        </div>
        <h1 className="text-xl font-semibold text-white">
          Your Hybrid365 app access isn&apos;t active yet.
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-zinc-400">
          Paid members get the full 12-week dashboard, week-by-week guidance,
          and soon — session completion, RPE, and weekly check-ins.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-zinc-500">
          If you&apos;ve just joined through Whop, sign in with the same email you used at checkout —
          your access is linked automatically on first login. Refresh this page if it doesn&apos;t
          update right away, or contact support.
        </p>
        {user?.email ? (
          <p className="mt-3 text-xs text-zinc-500">
            Signed in as {user.email}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/community"
          className="inline-flex justify-center rounded-xl bg-[#F4D23C] px-5 py-3 text-sm font-semibold text-black hover:bg-[#e6c235]"
        >
          Explore Hybrid365 Community
        </Link>
        <Link
          href="/login"
          className="inline-flex justify-center rounded-xl border border-zinc-700 px-5 py-3 text-sm font-medium text-zinc-300 hover:border-zinc-600"
        >
          Back to sign in
        </Link>
      </div>

      <p className="text-xs text-zinc-600">
        Testing? Set your row in{" "}
        <code className="text-zinc-500">memberships</code> to{" "}
        <code className="text-zinc-500">active</code> in Supabase.
      </p>
    </div>
  );
}
