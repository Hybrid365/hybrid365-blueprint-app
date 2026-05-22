import type { Metadata } from "next";
import { loadAthleteProgrammePageServer } from "@/app/lib/hyroxAthleteProgrammePageServer";
import ProgrammePageClient from "./ProgrammePageClient";

export const metadata: Metadata = {
  title: "Programme | Hyrox Team Athlete",
  description: "Your weekly Hybrid365 Hyrox training programme.",
};

/**
 * Auth gate: app/athlete/layout.tsx only (redirect to login when no session).
 * This page never calls redirect("/athlete/login") — avoids RSC/prefetch false negatives.
 */
export default async function AthleteProgrammePage() {
  const payload = await loadAthleteProgrammePageServer();

  return (
    <ProgrammePageClient
      variant={payload.variant}
      serverDebug={payload.debug}
      initialProgramme={payload.initialProgramme}
      serverProgrammePublished={payload.serverProgrammePublished}
    />
  );
}
