import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import MemberDashboardClient, {
  type WeekPayload,
} from "./MemberDashboardClient";

type ProgrammeInstanceRow = {
  id: string;
  title: string | null;
  current_week?: number | null;
};

type ProgrammeWeekRow = {
  week_number: number;
  title: string | null;
  is_unlocked: boolean | null;
  plan_json: unknown | null;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const { data: instance } = await supabase
    .from("programme_instances")
    .select("id, title, current_week")
    .eq("user_id", user.id)
    .maybeSingle();

  const typedInstance = instance as ProgrammeInstanceRow | null;

  let weeks: ProgrammeWeekRow[] = [];
  if (typedInstance?.id) {
    const { data: weekRows } = await supabase
      .from("programme_weeks")
      .select("week_number, title, is_unlocked, plan_json")
      .eq("programme_instance_id", typedInstance.id)
      .order("week_number", { ascending: true });

    weeks = (weekRows ?? []) as ProgrammeWeekRow[];
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select("status, expires_at")
    .eq("user_id", user.id)
    .maybeSingle();

  const programmeTitle =
    typedInstance?.title?.trim() || "Your Hybrid365 programme";

  const weeksFromDb: WeekPayload[] = weeks.map((w) => ({
    week_number: w.week_number,
    title: w.title,
    is_unlocked: w.is_unlocked,
    plan_json: w.plan_json,
  }));

  const instanceCurrentWeek =
    typeof typedInstance?.current_week === "number"
      ? typedInstance.current_week
      : null;

  return (
    <MemberDashboardClient
      email={user.email ?? ""}
      programmeTitle={programmeTitle}
      membershipExpiresAt={
        membership?.expires_at ? String(membership.expires_at) : null
      }
      instanceCurrentWeek={instanceCurrentWeek}
      weeksFromDb={weeksFromDb}
    />
  );
}
