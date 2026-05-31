"use client";

import { AthleteHomeDashboard } from "@/components/athlete-command-centre/AthleteHomeDashboard";

export default function HyroxTeamDashboardActive({
  useLiveProgramme = false,
  readOnly = false,
}: {
  useLiveProgramme?: boolean;
  readOnly?: boolean;
}) {
  return <AthleteHomeDashboard useLiveProgramme={useLiveProgramme} readOnly={readOnly} />;
}
