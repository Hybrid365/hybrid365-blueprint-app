import type { Metadata } from "next";
import ResourcesPageClient from "./ResourcesPageClient";

export const metadata: Metadata = {
  title: "Resources | Hyrox Team Athlete",
};

export default function AthleteResourcesPage() {
  return <ResourcesPageClient />;
}
