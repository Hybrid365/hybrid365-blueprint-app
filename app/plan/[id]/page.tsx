import { notFound } from "next/navigation";
import FreePlanDashboardClient from "@/components/free-week/FreePlanDashboardClient";
import Hybrid75OverviewClient from "@/components/free-week/Hybrid75OverviewClient";
import { getFreePlanById } from "@/app/lib/getFreePlanById";

export const dynamic = "force-dynamic";

type PlanPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PlanPage({ params }: PlanPageProps) {
  const { id } = await params;
  const plan = await getFreePlanById(id);

  if (!plan) {
    notFound();
  }

  if (plan.isHybrid75) {
    return <Hybrid75OverviewClient />;
  }

  return (
    <FreePlanDashboardClient
      planId={plan.planId}
      planJson={plan.planJson}
      isHybrid75={false}
      hybrid75Meta={null}
    />
  );
}
