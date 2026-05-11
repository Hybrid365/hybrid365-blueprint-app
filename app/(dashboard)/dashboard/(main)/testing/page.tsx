import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import { hasMeaningfulPlanJson } from "@/app/lib/programmePlan";
import TestingClient, { type BenchmarkTestRow } from "./TestingClient";

type ProgrammeInstanceRow = {
  id: string;
};

type AthleteAssessmentRow = {
  completed_at: string | null;
};

export default async function TestingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/testing");

  const { data: instance } = await supabase
    .from("programme_instances")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  const typedInstance = instance as ProgrammeInstanceRow | null;

  let programmeGenerated = false;
  if (typedInstance?.id) {
    const { data: weekRows } = await supabase
      .from("programme_weeks")
      .select("plan_json")
      .eq("programme_instance_id", typedInstance.id)
      .limit(12);
    programmeGenerated = (weekRows ?? []).some((w) =>
      hasMeaningfulPlanJson((w as { plan_json?: unknown }).plan_json)
    );
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
