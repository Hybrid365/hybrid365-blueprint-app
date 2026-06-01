import { notFound, redirect } from "next/navigation";
import Hybrid75ChallengeClient from "@/components/free-week/Hybrid75ChallengeClient";
import { getFreePlanById } from "@/app/lib/getFreePlanById";

export const dynamic = "force-dynamic";

export default async function Hybrid75ChallengePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const plan = await getFreePlanById(id);
  if (!plan) notFound();
  if (!plan.isHybrid75) redirect(`/plan/${plan.planId}`);
  return <Hybrid75ChallengeClient />;
}
