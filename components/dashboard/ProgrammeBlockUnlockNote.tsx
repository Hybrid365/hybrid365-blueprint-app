import { Lock } from "lucide-react";

/** Explains monthly 4-week block unlocks on paid programme pages. */
export function ProgrammeBlockUnlockNote({ unlockedCount }: { unlockedCount: number }) {
  return (
    <div className="rounded-xl border border-yellow-500/20 bg-yellow-400/[0.06] px-4 py-3 sm:px-5 sm:py-4">
      <p className="text-sm font-semibold text-yellow-200/95">
        Your next 4-week block unlocks each month as your membership continues.
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-zinc-400 sm:text-sm">
        You currently have access to this month&apos;s 4-week block ({unlockedCount} week
        {unlockedCount === 1 ? "" : "s"}). The next 4-week block unlocks after your next
        membership month, keeping your programme progressive and structured.
      </p>
      <p className="mt-2 text-xs text-zinc-500">
        This helps keep the programme progressive and gives you a clear focus for the current block.
      </p>
    </div>
  );
}

export function LockedWeekMessage() {
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-950">
        <Lock className="h-6 w-6 text-zinc-500" />
      </div>
      <h3 className="mt-4 text-lg font-bold text-white">Unlocks in your next monthly block</h3>
      <p className="mt-2 max-w-md text-sm text-zinc-400">
        This block unlocks as your membership continues. Session details stay hidden until this
        week opens — planned progression, not an error.
      </p>
    </div>
  );
}
