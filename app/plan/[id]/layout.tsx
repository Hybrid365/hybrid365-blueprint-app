import { notFound } from "next/navigation";
import { FreePlanProvider } from "@/components/free-week/FreePlanProvider";
import Hybrid75DashboardShell from "@/components/free-week/Hybrid75DashboardShell";
import { getFreePlanById } from "@/app/lib/getFreePlanById";

export const dynamic = "force-dynamic";

type PlanLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

export default async function PlanLayout({ children, params }: PlanLayoutProps) {
  const { id } = await params;
  const plan = await getFreePlanById(id);

  if (!plan) {
    notFound();
  }

  return (
    <FreePlanProvider
      planId={plan.planId}
      planJson={plan.planJson}
      isHybrid75={plan.isHybrid75}
      isHyrox={plan.isHyrox}
      hybrid75Meta={plan.hybrid75Meta}
      hyroxMeta={plan.hyroxMeta}
    >
      {plan.isHybrid75 ? (
        <Hybrid75DashboardShell planId={plan.planId}>{children}</Hybrid75DashboardShell>
      ) : (
        children
      )}
    </FreePlanProvider>
  );
}
