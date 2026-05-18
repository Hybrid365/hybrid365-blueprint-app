"use client";

import HyroxTeamDashboardActive from "./HyroxTeamDashboardActive";
import HyroxTeamDashboardLocked from "./HyroxTeamDashboardLocked";

type Props = {
  mockActive: boolean;
};

export default function HyroxTeamDashboardView({ mockActive }: Props) {
  if (!mockActive) {
    return <HyroxTeamDashboardLocked />;
  }
  return <HyroxTeamDashboardActive />;
}
