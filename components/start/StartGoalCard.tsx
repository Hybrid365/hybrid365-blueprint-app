import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { START_GOALS, type StartGoalId } from "@/app/lib/start/startCopy";
import { cn } from "@/lib/utils";

export function StartGoalCard({
  goalId,
  onSelect,
}: {
  goalId: StartGoalId;
  onSelect: (id: StartGoalId) => void;
}) {
  const goal = START_GOALS[goalId];

  return (
    <button
      type="button"
      onClick={() => onSelect(goal.id)}
      className="group relative flex h-[128px] w-full overflow-hidden rounded-md border border-white/12 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4d23c] sm:h-[148px] lg:h-[196px]"
    >
      <Image
        src={goal.imageSrc}
        alt={goal.imageAlt}
        fill
        priority
        className={cn(
          "transition duration-500 group-hover:scale-[1.035]",
          goal.imageClassName
        )}
        sizes="(max-width: 1024px) 100vw, 380px"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/88 via-black/48 to-black/12" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/55 to-transparent" />
      <div className="relative z-10 flex h-full w-full items-center justify-between gap-3 px-3.5 py-3 sm:px-5">
        <div className="min-w-0 max-w-[76%]">
          <h2 className="text-[15px] font-black uppercase leading-[0.92] tracking-[0.04em] text-[#f4d23c] sm:text-[17px] lg:text-[21px]">
            {goal.title}
          </h2>
          <p className="mt-1.5 text-[11px] leading-snug text-white/88 sm:text-[13px]">
            {goal.positioning}
          </p>
          <p className="mt-1 hidden text-[11px] leading-snug text-white/52 lg:block">
            {goal.supporting}
          </p>
        </div>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#f4d23c]/55 text-[#f4d23c] sm:h-9 sm:w-9">
          <ChevronRight className="h-4 w-4" strokeWidth={2.4} />
        </span>
      </div>
    </button>
  );
}
