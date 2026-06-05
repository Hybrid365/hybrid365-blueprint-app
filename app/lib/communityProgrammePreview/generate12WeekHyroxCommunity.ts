import { analyseCommunityProgrammePreview } from "./analysePreview";
import { generateCommunityProgrammePreview } from "./generatePreview";
import { hyroxPreviewWeekToPlanJson } from "./toPlanJson";
import type { CommunityPreviewInput } from "./types";
import type { GeneratedProgrammeWeek } from "@/app/lib/generate12WeekProgramme";

function blockForWeek(weekNumber: number): 1 | 2 | 3 {
  if (weekNumber <= 4) return 1;
  if (weekNumber <= 8) return 2;
  return 3;
}

function weekInBlock(weekNumber: number): number {
  return ((weekNumber - 1) % 4) + 1;
}

export type HyroxGenerationQaSummary = {
  block_number: number;
  pass_count: number;
  warn_count: number;
  fail_count: number;
  sample_messages: string[];
};

export type Generate12WeekHyroxResult = {
  weeks: GeneratedProgrammeWeek[];
  qaSummaries: HyroxGenerationQaSummary[];
  totalSessions: number;
};

/**
 * Build 12 weeks of paid community HYROX programming from three 4-week block previews.
 * Server-safe — no database writes.
 */
export function generate12WeekHyroxCommunityProgramme(
  baseInput: CommunityPreviewInput
): Generate12WeekHyroxResult {
  const blockPreviews = new Map<number, ReturnType<typeof generateCommunityProgrammePreview>>();
  const qaSummaries: HyroxGenerationQaSummary[] = [];

  for (const blockNumber of [1, 2, 3] as const) {
    const input = { ...baseInput, block_number: blockNumber };
    const preview = generateCommunityProgrammePreview(input);
    blockPreviews.set(blockNumber, preview);

    const qa = analyseCommunityProgrammePreview(preview, input);
    qaSummaries.push({
      block_number: blockNumber,
      pass_count: qa.pass_count,
      warn_count: qa.warn_count,
      fail_count: qa.fail_count,
      sample_messages: qa.checks
        .filter((c) => c.status !== "pass")
        .slice(0, 5)
        .map((c) => c.message),
    });
  }

  const weeks: GeneratedProgrammeWeek[] = [];
  let totalSessions = 0;

  for (let weekNumber = 1; weekNumber <= 12; weekNumber += 1) {
    const blockNumber = blockForWeek(weekNumber);
    const preview = blockPreviews.get(blockNumber)!;
    const wib = weekInBlock(weekNumber);
    const previewWeek = preview.weeks.find((w) => w.week_number === wib);
    if (!previewWeek) {
      throw new Error(`HYROX preview missing week ${wib} in block ${blockNumber}`);
    }

    totalSessions += previewWeek.sessions.length;

    weeks.push({
      week_number: weekNumber,
      block_number: blockNumber,
      title: `Week ${weekNumber}: ${previewWeek.title}`,
      plan_json: hyroxPreviewWeekToPlanJson({
        weekNumber,
        blockNumber,
        preview,
        previewWeek,
        input: { ...baseInput, block_number: blockNumber },
        includeProgrammeRationale: weekNumber === 1,
      }),
    });
  }

  return { weeks, qaSummaries, totalSessions };
}
