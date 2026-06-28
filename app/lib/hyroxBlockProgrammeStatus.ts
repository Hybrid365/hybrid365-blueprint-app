/** Coach Programme Builder — per-block status for block selector UI. */

export type BlockSelectorStatus =
  | "published"
  | "draft_available"
  | "needs_generation"
  | "needs_approval"
  | "ready_to_publish";

export type BlockWeekStatusInput = {
  generated: boolean;
  sessionCount: number;
  published: boolean;
  approved: boolean;
};

export function deriveBlockSelectorStatus(
  weeks: BlockWeekStatusInput[],
  publishedWeeksInDb = 0
): BlockSelectorStatus {
  const generated = weeks.filter((w) => w.generated && w.sessionCount > 0);
  const publishedFromDrafts = weeks.filter((w) => w.published);
  const publishedCount = Math.max(publishedFromDrafts.length, publishedWeeksInDb);

  if (publishedCount >= 4) return "published";

  if (generated.length === 0) return "needs_generation";
  if (generated.length < 4) return "draft_available";

  const approved = weeks.filter((w) => w.approved || w.published);
  if (approved.length < 4) return "needs_approval";

  return "ready_to_publish";
}

export const BLOCK_SELECTOR_STATUS_LABELS: Record<BlockSelectorStatus, string> = {
  published: "Published",
  draft_available: "Draft available",
  needs_generation: "Needs generation",
  needs_approval: "Needs approval",
  ready_to_publish: "Ready to publish",
};

export function blockSelectorStatusMessage(
  blockNumber: number,
  status: BlockSelectorStatus
): string | null {
  switch (status) {
    case "published":
      return `Block ${blockNumber} published to athlete.`;
    case "draft_available":
      return `Block ${blockNumber} draft generated. Review and edit before approving.`;
    case "needs_generation":
      return blockNumber === 2
        ? "Block 1 complete. Review athlete response, then generate Block 2."
        : `Generate Block ${blockNumber} when the previous block is complete.`;
    case "needs_approval":
      return `Block ${blockNumber} needs coach approval before publishing.`;
    case "ready_to_publish":
      return `Block ${blockNumber} approved and ready to publish.`;
    default:
      return null;
  }
}
