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
      <p className="text-sm font-bold text-cyan-100">Prepare next block: Weeks {startWeek}–{endWeek}</p>
      <p className="mt-1 text-xs leading-relaxed text-zinc-400">
        Block {next} drafts use assessment, benchmarks, check-ins, and Block {currentBlock}{" "}
        completion. Generation uses the next block in your {programmeLengthWeeks}-week roadmap —
        not a restart at Week 1.
      </p>
      <button
        type="button"
        disabled={generating}
        onClick={onGenerateNextBlock}
        className="mt-3 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-xs font-bold text-cyan-100 disabled:opacity-50"
      >
        {generating ? "Generating…" : `Generate Block ${next} Draft`}
      </button>
      <p className="mt-2 text-[10px] text-zinc-600">
        Coming soon: full auto-generation from progress data. For now, switch generation scope and
        generate after moving to Block {next} in the athlete profile.
      </p>
    </div>
  );
}
