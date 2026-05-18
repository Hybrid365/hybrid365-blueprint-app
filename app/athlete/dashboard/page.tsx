import type { Metadata } from "next";
import DashboardPageClient from "./DashboardPageClient";

export const metadata: Metadata = {
  title: "Dashboard | Hyrox Team Athlete",
  description: "Your Hybrid365 Hyrox Team athlete dashboard.",
};

export default function AthleteDashboardPage() {
  return <DashboardPageClient />;
}
