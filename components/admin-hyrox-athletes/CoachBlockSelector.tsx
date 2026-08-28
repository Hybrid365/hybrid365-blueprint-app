"use client";

import {
  BLOCK_SELECTOR_STATUS_LABELS,
  blockSelectorStatusMessage,
  type BlockSelectorStatus,
} from "@/app/lib/hyroxBlockProgrammeStatus";
import {
  plannedProgrammeBlocks,
  type ProgrammeLengthWeeks,
} from "@/app/lib/hyroxProgrammeDates";

export type BlockSummary = {
  blockNumber: number;
  weeksStart: number;
  weeksEnd: number;
  status: BlockSelectorStatus;
  publishedWeeksCount: number;
  generatedWeeksCount: number;
};

const STATUS_STYLES: Record<BlockSelectorStatus, string> = {
  published: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
  draft_available: "border-sky-500/40 bg-sky-500/10 text-sky-200",
  needs_generation: "border-zinc-600 bg-zinc-900/80 text-zinc-400",
  needs_approval: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  ready_to_publish: "border-yellow-500/40 bg-yellow-400/10 text-yellow-200",
};

export function CoachBlockSelector({
  blocks,
  selectedBlock,
  programmeLengthWeeks,
  onSelectBlock,
  onGenerateNextBlock,
  generating,
  reviewMissingWarning,
}: {
  blocks: BlockSummary[];
  selectedBlock: number;
  programmeLengthWeeks: ProgrammeLengthWeeks;
  onSelectBlock: (block: number) => void;
  onGenerateNextBlock?: (reviewedBlock: number) => void;
  generating?: boolean;
  reviewMissingWarning?: string | null;
}) {
  const maxBlocks = Math.max(
    plannedProgrammeBlocks(programmeLengthWeeks),
    selectedBlock,
    ...blocks.map((b) => b.blockNumber)
  );
  const selected = blocks.find((b) => b.blockNumber === selectedBlock);
  const statusMessage = selected
    ? blockSelectorStatusMessage(selected.blockNumber, selected.status)
    : selectedBlock > 0
      ? blockSelectorStatusMessage(selectedBlock, "needs_generation")
      : null;

  const highestPublished = Math.max(
    0,
    ...blocks.filter((b) => b.status === "published").map((b) => b.blockNumber)
  );
  const nextBlock = highestPublished + 1;
  const nextStatus =
    blocks.find((b) => b.blockNumber === nextBlock)?.status ?? "needs_generation";
  const showCreateNextCta =
    Boolean(onGenerateNextBlock) &&
    highestPublished >= 1 &&
    nextStatus === "needs_generation" &&
    selectedBlock >= highestPublished &&
    selectedBlock <= nextBlock;
  const nextWeeksStart = (nextBlock - 1) * 4 + 1;
  const nextWeeksEnd = nextBlock * 4;

  return (
    <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-950/60 px-4 py-3">
      <div>
        <p className="text-sm font-bold text-white">Programme blocks</p>
        <p className="mt-0.5 text-xs text-zinc-500">
          Switch between blocks without losing edits. Publish applies to the selected block only.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {Array.from({ length: maxBlocks }, (_, i) => i + 1).map((blockNum) => {
          const block = blocks.find((b) => b.blockNumber === blockNum);
          const status = block?.status ?? "needs_generation";
          const weeksStart = block?.weeksStart ?? (blockNum - 1) * 4 + 1;
          const weeksEnd = block?.weeksEnd ?? blockNum * 4;
          const isSelected = selectedBlock === blockNum;

          return (
            <button
              key={blockNum}
              type="button"
              onClick={() => onSelectBlock(blockNum)}
              className={`rounded-xl border px-3 py-2 text-left transition ${
                isSelected
                  ? "border-yellow-500/50 ring-1 ring-yellow-500/30"
                  : "border-zinc-700 hover:border-zinc-500"
              }`}
            >
              <p className="text-xs font-bold text-white">
                Block {blockNum} · W{weeksStart}–{weeksEnd}
              </p>
              <span
                className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[status]}`}
              >
                {BLOCK_SELECTOR_STATUS_LABELS[status]}
              </span>
            </button>
          );
        })}
      </div>

      {statusMessage ? (
        <p className="text-xs text-zinc-400">{statusMessage}</p>
      ) : null}

      {reviewMissingWarning ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-950/20 px-3 py-2 text-xs text-amber-100/90">
          {reviewMissingWarning}
        </p>
      ) : null}

      {showCreateNextCta && onGenerateNextBlock ? (
        <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 px-3 py-3">
          <p className="text-sm font-semibold text-cyan-100">Create Next Block</p>
          <p className="mt-1 text-xs text-zinc-400">
            Block {highestPublished} is published. Create Block {nextBlock} (Weeks {nextWeeksStart}
            –{nextWeeksEnd}) from the Block {highestPublished} review and athlete response. Earlier
            blocks are not modified.
          </p>
          <button
            type="button"
            disabled={generating}
            onClick={() => onGenerateNextBlock(highestPublished)}
            className="mt-3 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-xs font-bold text-cyan-100 disabled:opacity-50"
          >
            {generating ? `Creating Block ${nextBlock}…` : "Create Next Block"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
