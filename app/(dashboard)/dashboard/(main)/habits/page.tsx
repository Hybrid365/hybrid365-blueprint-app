import { getDashboardSession } from "@/app/lib/dashboardAuth";
import HabitsClient from "./HabitsClient";

type ProgrammeInstanceRow = { id: string };

export default async function HabitsPage() {
  const { supabase, user } = await getDashboardSession("/dashboard/habits");

  const { data: instance } = await supabase
    .from("programme_instances")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const typedInstance = instance as ProgrammeInstanceRow | null;

  return <HabitsClient programmeInstanceId={typedInstance?.id ?? null} />;
}
