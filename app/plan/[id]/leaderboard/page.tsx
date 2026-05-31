import { notFound, redirect } from "next/navigation";
import Hybrid75LeaderboardClient from "@/components/free-week/Hybrid75LeaderboardClient";
import { getFreePlanById } from "@/app/lib/getFreePlanById";

export const dynamic = "force-dynamic";

export default async function Hybrid75LeaderboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const plan = await getFreePlanById(id);
  if (!plan) notFound();
  if (!plan.isHybrid75) redirect(`/plan/${plan.planId}`);
  return <Hybrid75LeaderboardClient />;
}
