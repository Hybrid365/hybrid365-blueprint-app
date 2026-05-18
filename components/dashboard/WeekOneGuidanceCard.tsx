import { Compass } from "lucide-react";

type Props = {
  className?: string;
};

export function WeekOneGuidanceCard({ className = "" }: Props) {
  return (
    <div
      className={`rounded-2xl border border-yellow-500/20 bg-yellow-400/[0.04] p-5 sm:p-6 ${className}`}
    >
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-400/15 ring-1 ring-yellow-400/25">
          <Compass className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-bold text-white sm:text-lg">How to approach Week 1</h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Do not chase perfection. Hit the sessions, keep easy work easy, log honest RPE and build momentum.
          </p>
        </div>
      </div>
    </div>
  );
}
