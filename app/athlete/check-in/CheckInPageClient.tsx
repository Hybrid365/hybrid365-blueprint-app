"use client";

import { ActiveAthletePage } from "@/components/athlete-command-centre/ActiveAthletePage";
import { CheckInPageView } from "@/components/athlete-command-centre/CheckInPageView";

export default function CheckInPageClient() {
  return (
    <ActiveAthletePage>
      <CheckInPageView />
    </ActiveAthletePage>
  );
}
