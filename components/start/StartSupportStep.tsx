import { ChevronRight, Layers, Users } from "lucide-react";
import {
  START_GOALS,
  START_SUPPORT_COPY,
  START_SUPPORT_OPTIONS,
  type StartGoalId,
} from "@/app/lib/start/startCopy";
import { AttributedLink } from "./AttributedLink";
import { StartFunnelCard } from "./StartFunnelCard";

function SupportIcon({ kind }: { kind: "system" | "coach" }) {
  const Icon = kind === "system" ? Layers : Users;
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#f4d23c]/40 text-[#f4d23c] sm:h-11 sm:w-11">
      <Icon className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.1} />
    </span>
  );
}

export function StartSupportStep({
  goalId,
  onBack,
}: {
  goalId: StartGoalId;
  onBack: () => void;
}) {
  const goal = START_GOALS[goalId];
  const options = START_SUPPORT_OPTIONS[goalId];

  return (
    <StartFunnelCard step={3}>
      <button
        type="button"
        onClick={onBack}
        className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/38 transition hover:text-white/70"
      >
        {START_SUPPORT_COPY.back}
      </button>

      <p className="mt-3 text-center text-[9px] font-bold uppercase tracking-[0.2em] text-white/32">
        {START_SUPPORT_COPY.goalLabel}
      </p>
      <p className="mt-0.5 text-center text-[11px] font-black uppercase tracking-[0.14em] text-[#f4d23c] sm:text-[12px]">
        {goal.title}
      </p>
      <h1 className="mt-2 text-center font-black uppercase leading-[0.92] tracking-[-0.04em] text-white text-[clamp(1.25rem,4.8vw,1.85rem)]">
        {START_SUPPORT_COPY.headline}
      </h1>
      <p className="mx-auto mt-2 max-w-[36ch] text-center text-[12px] leading-snug text-white/48 sm:text-[13px]">
        {START_SUPPORT_COPY.supporting}
      </p>

      <div className="mt-4 grid gap-2.5 sm:mt-5">
        {options.map((option) => (
          <AttributedLink
            key={option.id}
            href={option.href}
            className="group flex items-center gap-3 rounded-md border border-white/12 bg-[#101010] px-3.5 py-3.5 transition hover:border-[#f4d23c]/45 sm:gap-4 sm:px-4 sm:py-4"
          >
            <SupportIcon kind={option.icon} />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-black uppercase tracking-[0.12em] text-white sm:text-[15px]">
                {option.eyebrow}
              </p>
              <h2 className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#f4d23c] sm:text-[12px]">
                {option.title}
              </h2>
              <p className="mt-1 text-[12px] leading-snug text-white/48">{option.positioning}</p>
              {option.price ? (
                <p className="mt-1.5 text-[12px] font-bold text-[#f4d23c]">{option.price}</p>
              ) : null}
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-[#f4d23c]" strokeWidth={2.2} />
          </AttributedLink>
        ))}
      </div>
    </StartFunnelCard>
  );
}
