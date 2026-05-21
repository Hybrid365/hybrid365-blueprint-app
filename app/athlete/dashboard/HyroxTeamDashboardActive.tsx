"use client";

import { AthleteHomeDashboard } from "@/components/athlete-command-centre/AthleteHomeDashboard";

export default function HyroxTeamDashboardActive({
  useLiveProgramme = false,
}: {
  useLiveProgramme?: boolean;
}) {
  return <AthleteHomeDashboard useLiveProgramme={useLiveProgramme} />;
}
