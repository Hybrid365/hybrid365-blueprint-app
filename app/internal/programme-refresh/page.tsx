import { notFound, redirect } from "next/navigation";
import {
  getStrictInternalAdminUser,
  isInternalAdminRouteConfigured,
} from "@/app/lib/requireInternalAdmin";
import ProgrammeRefreshClient from "./ProgrammeRefreshClient";

export const metadata = {
  title: "Programme Refresh | Hybrid365 Internal",
  description: "Admin-only community programme regeneration.",
  robots: { index: false, follow: false },
};

export default async function InternalProgrammeRefreshPage() {
  if (!isInternalAdminRouteConfigured()) {
    notFound();
  }

  const user = await getStrictInternalAdminUser();
  if (!user) {
    redirect("/login?next=/internal/programme-refresh");
  }

  return (
    <ProgrammeRefreshClient
      adminEmail={user.email ?? ""}
      adminListConfigured={isInternalAdminRouteConfigured()}
    />
  );
}
