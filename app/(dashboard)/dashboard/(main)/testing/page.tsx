import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import TestingClient, { type BenchmarkTestRow } from "./TestingClient";

type ProgrammeInstanceRow = {
  id: string;
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
  let testsQuery = supabase.from("benchmark_tests").select("*").eq("user_id", user.id);
  if (typedInstance?.id) {
    testsQuery = testsQuery.eq("programme_instance_id", typedInstance.id);
  }
  const { data: tests } = await testsQuery.order("tested_at", { ascending: false });

  return (
    <TestingClient
      programmeInstanceId={typedInstance?.id ?? null}
      initialTests={(tests ?? []) as BenchmarkTestRow[]}
    />
  );
}
