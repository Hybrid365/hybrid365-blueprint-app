import { getDashboardSession } from "@/app/lib/dashboardAuth";
import {
  fetchCommunityProgrammeInstance,
  resolveCommunityProgrammeGenerated,
} from "@/app/lib/communityProgrammeStatus";
import TestingClient, { type BenchmarkTestRow } from "./TestingClient";

type AthleteAssessmentRow = {
  completed_at: string | null;
};

export default async function TestingPage() {
  const { supabase, user } = await getDashboardSession("/dashboard/testing");

  const typedInstance = await fetchCommunityProgrammeInstance(supabase, user.id);

  let programmeGenerated = false;
  let weekRows: { plan_json?: unknown }[] = [];
  if (typedInstance?.id) {
    const { data: weeks } = await supabase
      .from("programme_weeks")
      .select("plan_json")
      .eq("programme_instance_id", typedInstance.id)
      .limit(12);
    weekRows = (weeks ?? []) as { plan_json?: unknown }[];
    programmeGenerated = resolveCommunityProgrammeGenerated(typedInstance.id, weekRows);
  }

  const { data: assess } = await supabase
    .from("athlete_assessments")
    .select("completed_at")
    .eq("user_id", user.id)
    .maybeSingle();
  const assessmentCompleted = Boolean((assess as AthleteAssessmentRow | null)?.completed_at);

  const { data: tests } = await supabase
    .from("benchmark_tests")
    .select("*")
    .eq("user_id", user.id)
    .order("tested_at", { ascending: false });

  return (
    <TestingClient
      programmeInstanceId={typedInstance?.id ?? null}
      initialTests={(tests ?? []) as BenchmarkTestRow[]}
      assessmentCompleted={assessmentCompleted}
      programmeGenerated={programmeGenerated}
    />
  );
}
