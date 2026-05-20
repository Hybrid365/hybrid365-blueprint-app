"use client";

import HyroxTeamDashboardActive from "./HyroxTeamDashboardActive";
import HyroxTeamDashboardLocked from "./HyroxTeamDashboardLocked";

type Props = {
  programmePublishedMock: boolean;
};

export default function HyroxTeamDashboardView({ programmePublishedMock }: Props) {
  if (!programmePublishedMock) {
    return <HyroxTeamDashboardLocked />;
  }
  return <HyroxTeamDashboardActive />;
}
