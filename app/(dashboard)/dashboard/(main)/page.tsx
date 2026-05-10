import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";

type ProgrammeWeekRow = {
  week_number: number;
  title: string | null;
  is_unlocked: boolean | null;
};

type ProgrammeInstanceRow = {
  id: string;
  title: string | null;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const email = user.email ?? "Member";

  const { data: instance } = await supabase
    .from("programme_instances")
    .select("id, title")
    .eq("user_id", user.id)
    .maybeSingle();

  const typedInstance = instance as ProgrammeInstanceRow | null;

  let weeks: ProgrammeWeekRow[] = [];
  if (typedInstance?.id) {
    const { data: weekRows } = await supabase
      .from("programme_weeks")
      .select("week_number, title, is_unlocked")
      .eq("programme_instance_id", typedInstance.id)
      .order("week_number", { ascending: true });

    weeks = (weekRows ?? []) as ProgrammeWeekRow[];
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select("status, expires_at")
    .eq("user_id", user.id)
    .maybeSingle();

  const currentWeek =
    weeks.find((w) => w.is_unlocked)?.week_number ??
    weeks.find((w) => w.week_number === 1)?.week_number ??
    null;

  const programmeTitle =
    typedInstance?.title?.trim() || "Your Hybrid365 programme";

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Signed in as <span className="text-zinc-200">{email}</span>
        </p>
        <p className="mt-4 text-sm leading-relaxed text-zinc-400">
          This is the paid Hybrid365 app foundation — a Runna-style shell for
          your 12-week hybrid programme. Session logging, RPE, and check-ins
          will layer on here next.
        </p>
      </div>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Membership
        </h2>
        <dl className="mt-3 grid gap-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Status</dt>
            <dd className="font-medium text-[#F4D23C]">
              {membership?.status === "active" ? "Active" : String(membership?.status ?? "—")}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Access until</dt>
            <dd className="text-zinc-200">
              {membership?.expires_at
                ? new Date(membership.expires_at).toLocaleDateString()
                : "No expiry set"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Programme
        </h2>
        <p className="mt-2 text-lg font-medium text-white">{programmeTitle}</p>
        <p className="mt-1 text-sm text-zinc-400">
          Current focus:{" "}
          <span className="text-zinc-200">
            {currentWeek !== null ? `Week ${currentWeek}` : "Set up your weeks in Supabase"}
          </span>
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold text-white">Weeks 1–12</h2>
        {!typedInstance ? (
          <p className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/40 p-4 text-sm text-zinc-400">
            No programme instance found. Add a row to{" "}
            <code className="text-zinc-300">programme_instances</code> for your
            user, then seed{" "}
            <code className="text-zinc-300">programme_weeks</code>.
          </p>
        ) : weeks.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/40 p-4 text-sm text-zinc-400">
            No weeks yet. Insert rows in{" "}
            <code className="text-zinc-300">programme_weeks</code> for this
            programme (week_number 1–12).
          </p>
        ) : (
          <ul className="space-y-2">
            {weeks.map((w) => (
              <li
                key={w.week_number}
                className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3"
              >
                <div>
                  <span className="font-medium text-white">
                    Week {w.week_number}
                  </span>
                  {w.title ? (
                    <span className="ml-2 text-sm text-zinc-400">{w.title}</span>
                  ) : null}
                </div>
                <span
                  className={
                    w.is_unlocked
                      ? "rounded-full border border-[#F4D23C]/40 bg-[#F4D23C]/10 px-2.5 py-0.5 text-xs font-medium text-[#F4D23C]"
                      : "rounded-full border border-zinc-700 bg-zinc-800/50 px-2.5 py-0.5 text-xs text-zinc-500"
                  }
                >
                  {w.is_unlocked ? "Unlocked" : "Locked"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
