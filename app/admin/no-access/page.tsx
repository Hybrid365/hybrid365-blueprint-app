import Link from "next/link";

export const metadata = {
  title: "Coach access required | Hybrid365",
  robots: { index: false, follow: false },
};

export default function HyroxAdminNoAccessPage() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold text-white">Coach access required</h1>
      <p className="mt-4 text-sm leading-relaxed text-zinc-400">
        This area is for Hybrid365 Hyrox coaches only. Your account does not have coach or
        admin access. If you need access, ask the team to set{" "}
        <code className="text-zinc-300">profiles.role</code> to <code className="text-zinc-300">coach</code>{" "}
        or add your email to <code className="text-zinc-300">HYROX_COACH_EMAILS</code> /{" "}
        <code className="text-zinc-300">INTERNAL_ADMIN_EMAILS</code> for development.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/hyrox-team"
          className="rounded-xl border border-zinc-700 px-5 py-2.5 text-sm font-medium text-white hover:border-zinc-500"
        >
          Hyrox Team
        </Link>
        <Link
          href="/login?next=/admin/hyrox-athletes"
          className="rounded-xl bg-[#F4D23C] px-5 py-2.5 text-sm font-semibold text-black hover:bg-[#e5c436]"
        >
          Sign in with another account
        </Link>
      </div>
    </main>
  );
}
