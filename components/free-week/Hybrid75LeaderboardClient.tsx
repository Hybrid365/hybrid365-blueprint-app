"use client";

import Hybrid75Leaderboard from "@/components/free-week/Hybrid75Leaderboard";
import { useFreePlan } from "@/components/free-week/FreePlanProvider";
import { useHybrid75ChallengeLogs } from "@/components/free-week/useHybrid75ChallengeLogs";

export default function Hybrid75LeaderboardClient() {
  const { planId, athleteName } = useFreePlan();
  const challengeLogs = useHybrid75ChallengeLogs(planId, true);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white md:text-4xl">Leaderboard</h1>
        <p className="mt-2 text-zinc-400">
          Points come from logged sessions with proof, weekly challenge completion and admin
          adjustments — not from habit ticks.
        </p>
      </div>
      <Hybrid75Leaderboard
        planId={planId}
        athleteName={athleteName}
        pendingPoints={challengeLogs.pendingPoints}
        approvedPoints={challengeLogs.approvedPoints}
        totalPoints={challengeLogs.totalPoints}
      />
    </div>
  );
}
