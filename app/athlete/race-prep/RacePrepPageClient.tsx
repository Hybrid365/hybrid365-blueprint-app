"use client";

import { ActiveAthletePage } from "@/components/athlete-command-centre/ActiveAthletePage";
import { RacePrepPageView } from "@/components/athlete-command-centre/RacePrepPageView";

export default function RacePrepPageClient() {
  return (
    <ActiveAthletePage>
      <RacePrepPageView />
    </ActiveAthletePage>
  );
}
