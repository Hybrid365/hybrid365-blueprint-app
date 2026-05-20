"use client";

import { ActiveAthletePage } from "@/components/athlete-command-centre/ActiveAthletePage";
import { CoachNotesPageView } from "@/components/athlete-command-centre/CoachNotesPageView";

export default function CoachNotesPageClient() {
  return (
    <ActiveAthletePage>
      <CoachNotesPageView />
    </ActiveAthletePage>
  );
}
