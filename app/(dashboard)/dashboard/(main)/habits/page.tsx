import { getDashboardSession } from "@/app/lib/dashboardAuth";
import { fetchCommunityProgrammeInstance } from "@/app/lib/communityProgrammeStatus";
import HabitsClient from "./HabitsClient";

export default async function HabitsPage() {
  const { supabase, user } = await getDashboardSession("/dashboard/habits");

  const typedInstance = await fetchCommunityProgrammeInstance(supabase, user.id);

  return <HabitsClient programmeInstanceId={typedInstance?.id ?? null} />;
}
