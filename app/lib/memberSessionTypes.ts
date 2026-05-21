import type { MemberSessionDetail } from "@/app/lib/memberDashboardSchedule";

export type MemberSessionDrawerSession = MemberSessionDetail & {
  sessionKey: string;
  weekNumber: number;
};
