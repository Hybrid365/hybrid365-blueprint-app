import { getDashboardSession } from "@/app/lib/dashboardAuth";
import {
  fetchCommunityProgrammeInstance,
  resolveCommunityProgrammeGenerated,
} from "@/app/lib/communityProgrammeStatus";
import AssessmentClient, { type AssessmentRow } from "./AssessmentClient";

export default async function AssessmentPage() {
  const { supabase, user } = await getDashboardSession("/dashboard/assessment");

  const typedInstance = await fetchCommunityProgrammeInstance(supabase, user.id);

  let hasGeneratedProgramme = false;
  if (typedInstance?.id) {
    const { data: weekRows } = await supabase
      .from("programme_weeks")
      .select("plan_json")
      .eq("programme_instance_id", typedInstance.id)
      .limit(12);
    hasGeneratedProgramme = resolveCommunityProgrammeGenerated(
      typedInstance.id,
      (weekRows ?? []) as { plan_json?: unknown }[]
    );
  }

  const { data: assessment } = await supabase
    .from("athlete_assessments")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <AssessmentClient
      programmeInstanceId={typedInstance?.id ?? null}
      initialAssessment={(assessment as AssessmentRow | null) ?? null}
      hasGeneratedProgramme={hasGeneratedProgramme}
    />
  );
}
