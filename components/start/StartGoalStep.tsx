import { START_GOAL_COPY } from "@/app/lib/start/startCopy";
import type { StartGoalId } from "@/app/lib/start/startCopy";
import { StartFunnelCard } from "./StartFunnelCard";
import { StartGoalCard } from "./StartGoalCard";

export function StartGoalStep({ onSelect }: { onSelect: (id: StartGoalId) => void }) {
  return (
    <StartFunnelCard step={1}>
      <div className="text-center">
        <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-white/40 sm:text-[11px]">
          {START_GOAL_COPY.eyebrow}
        </p>
        <h1 className="mx-auto max-w-[14ch] font-black uppercase leading-[0.9] tracking-[-0.045em] text-white text-[clamp(1.28rem,5vw,2.15rem)]">
          {START_GOAL_COPY.headline}
        </h1>
        <p className="mx-auto mt-2 max-w-[36ch] text-[12px] leading-snug text-white/48 sm:text-[13px]">
          {START_GOAL_COPY.supporting}
        </p>
      </div>

      <div className="mt-3.5 grid gap-2 sm:mt-4 sm:gap-2.5 lg:mt-5 lg:grid-cols-2 lg:gap-3">
        <StartGoalCard goalId="hybrid" onSelect={onSelect} />
        <StartGoalCard goalId="hyrox" onSelect={onSelect} />
      </div>
    </StartFunnelCard>
  );
}
