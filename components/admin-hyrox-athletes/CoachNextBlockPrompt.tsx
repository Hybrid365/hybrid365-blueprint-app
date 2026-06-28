"use client";

import { nextBlockNumber, type ProgrammeLengthWeeks } from "@/app/lib/hyroxProgrammeDates";

export function CoachNextBlockPrompt({
  currentBlock,
  programmeLengthWeeks,
  onGenerateNextBlock,
  generating,
}: {
  currentBlock: number;
  programmeLengthWeeks: ProgrammeLengthWeeks;
  onGenerateNextBlock: () => void;
  generating?: boolean;
}) {
  const next = nextBlockNumber(currentBlock, programmeLengthWeeks);
  if (!next) return null;

  const startWeek = (next - 1) * 4 + 1;
  const endWeek = startWeek + 3;

  return (
    <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 px-4 py-3">
      <p className="text-sm font-bold text-cyan-100">
        Block {currentBlock} complete. Review athlete response, then generate Block {next}.
      </p>
      <p className="mt-1 text-xs leading-relaxed text-zinc-400">
        Block {next} covers Weeks {startWeek}–{endWeek}. Generation uses Block {currentBlock}{" "}
        completion, RPE, check-ins, and coach review — Block {currentBlock} published sessions are
        preserved.
      </p>
      <button
        type="button"
        disabled={generating}
        onClick={onGenerateNextBlock}
        className="mt-3 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-xs font-bold text-cyan-100 disabled:opacity-50"
      >
        {generating ? "Generating…" : `Generate Block ${next}`}
      </button>
    </div>
  );
}
