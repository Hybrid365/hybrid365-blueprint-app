import { NextResponse } from "next/server";
import { requireHyroxCoachApi } from "@/app/lib/hyroxApiAuth";
import { fetchHyroxAthleteById } from "@/app/lib/hyroxAthleteCoachDb";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";
import type { HyroxAthleteRow } from "@/app/lib/hyroxDatabaseTypes";
import { validateProgrammeStartDateYmd } from "@/app/lib/hyroxProgrammeDates";
import {
  fetchProgrammeDraftById,
  logCoachDraftRoute,
  publishProgrammeBlock,
  publishProgrammeDraft,
  StaleDraftPublishError,
} from "@/app/lib/hyroxProgrammeServer";

type RouteContext = { params: Promise<{ draftId: string }> };

function parseExpectedSessionCountsByWeek(
  raw: unknown
): Partial<Record<number, number>> | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const out: Partial<Record<number, number>> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const week = Number(key);
    const count = typeof value === "number" ? value : Number(value);
    if (Number.isFinite(week) && week >= 1 && Number.isFinite(count) && count > 0) {
      out[week] = count;
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireHyroxCoachApi();
  if (auth.error) return auth.error;

  const { draftId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    weekly_focus?: string;
    /** When true (default), publish all four weeks in the athlete's current block. */
    publish_block?: boolean;
    programme_start_date?: string;
    /** Global week number → session count shown in admin UI (validates DB draft before write). */
    expected_session_counts_by_week?: Record<string, number>;
    /** Single-week publish: expected session count for the draft being published. */
    expected_session_count?: number;
  };
  const publishBlock = body.publish_block !== false;
  const expectedByWeek = parseExpectedSessionCountsByWeek(body.expected_session_counts_by_week);

  const { client: supabase, mode } = await createCoachServerClient();
  const { draft, error: draftError } = await fetchProgrammeDraftById(supabase, draftId);
  logCoachDraftRoute("publish", draftId, draft, { coachSupabaseMode: mode });

  if (draftError) {
    return NextResponse.json(
      {
        success: false,
        error: draftError,
        ...(process.env.NODE_ENV === "development" ? { detail: draftError } : {}),
      },
      { status: 500 }
    );
  }
  if (!draft) {
    return NextResponse.json(
      {
        success: false,
        error: "Draft not found.",
        ...(process.env.NODE_ENV === "development"
          ? { detail: `No hyrox_programme_drafts row for id ${draftId}` }
          : {}),
      },
      { status: 404 }
    );
  }

  if (
    !publishBlock &&
    draft.status !== "approved" &&
    draft.status !== "published"
  ) {
    return NextResponse.json(
      {
        success: false,
        error: "Draft must be approved before publishing. Approve the week first.",
        draftStatus: draft.status,
      },
      { status: 409 }
    );
  }
  if (
    publishBlock &&
    draft.status !== "approved" &&
    draft.status !== "published"
  ) {
    return NextResponse.json(
      {
        success: false,
        error: "Block drafts must be approved or previously published before syncing.",
        draftStatus: draft.status,
      },
      { status: 409 }
    );
  }

  const { athlete, error: athleteError } = await fetchHyroxAthleteById(supabase, draft.athlete_id);

  if (athleteError) {
    return NextResponse.json({ success: false, error: athleteError }, { status: 500 });
  }
  if (!athlete) {
    return NextResponse.json({ success: false, error: "Athlete not found." }, { status: 404 });
  }

  const programmeStartDate =
    body.programme_start_date?.trim() ||
    (athlete as HyroxAthleteRow).programme_start_date?.trim() ||
    null;

  if (!programmeStartDate) {
    return NextResponse.json(
      {
        success: false,
        error: "Set a programme start date before publishing.",
      },
      { status: 400 }
    );
  }

  const startDateError = validateProgrammeStartDateYmd(programmeStartDate);
  if (startDateError) {
    return NextResponse.json({ success: false, error: startDateError }, { status: 400 });
  }

  try {
    if (publishBlock) {
      const athleteRow = athlete as HyroxAthleteRow;
      const blockNumber = athleteRow.current_block ?? draft.block_number ?? 1;

      const blockResult = await publishProgrammeBlock(supabase, {
        athleteRow,
        blockNumber,
        programmeStartDate,
        changedBy: auth.ctx.userId,
        expectedSessionCountsByWeek: expectedByWeek,
        seedDraftId: draftId,
      });

      const syncVerificationPassed = blockResult.weekResults.every(
        (w) => w.verification?.verificationPassed !== false
      );
      const syncVerificationErrors = blockResult.weekResults.flatMap(
        (w) => w.verification?.errors ?? []
      );

      return NextResponse.json({
        success: true,
        syncVerificationPassed,
        syncVerificationErrors,
        weeks: blockResult.weeks,
        sessionCount: blockResult.sessionCount,
        generatedWeekNumbers: blockResult.generatedWeekNumbers,
        syncedWeekNumbers: blockResult.syncedWeekNumbers,
        weekResults: blockResult.weekResults,
        publishBlock: true,
        message: syncVerificationPassed
          ? `Published ${blockResult.weeks.length} week(s) in block ${blockNumber} from approved drafts (no regeneration).${
              blockResult.syncedWeekNumbers.length > 0
                ? ` Synced week(s): ${blockResult.syncedWeekNumbers.join(", ")}.`
                : ""
            }`
          : `Publish completed but draft edits were not verified in published sessions. ${syncVerificationErrors[0] ?? "See publish result panel."}`,
      });
    }

    const expectedSingle =
      body.expected_session_count ??
      expectedByWeek?.[draft.week_number] ??
      undefined;

    const result = await publishProgrammeDraft(supabase, {
      draft,
      athleteRow: athlete as HyroxAthleteRow,
      weeklyFocus: body.weekly_focus ?? "",
      programmeStartDate,
      changedBy: auth.ctx.userId,
      expectedSessionCount: expectedSingle,
    });

    return NextResponse.json({
      success: true,
      week: result.week,
      sessionCount: result.sessionCount,
      weekResults: [
        {
          ...result.audit,
          sessionsToInsertCount: result.sessionCount,
          sessionsToInsertTitles: result.audit.approvedDraftSessionTitles,
          existingRowsBefore: 0,
          draftSessionsCount: result.audit.approvedDraftSessionCount,
          insertedRowsCount: result.sessionCount,
          updatedRowsCount: 0,
          unchangedRowsCount: 0,
          skippedRowsCount: 0,
          skippedBecauseLoggedCount: 0,
          skippedReasons: [],
          warnings: [],
          updatedSessions: [],
          sessionSyncDetails: [],
          verification: {
            verificationPassed: true,
            missingOrUnsyncedDraftSessionTitles: [],
            livePreviewForEditedSessions: [],
            errors: [],
          },
          rowsAfterPublish: result.sessionCount,
        },
      ],
      publishBlock: false,
      message: `Published ${result.sessionCount} session(s) from approved draft ${draft.id.slice(0, 8)}…`,
    });
  } catch (e) {
    if (e instanceof StaleDraftPublishError) {
      return NextResponse.json(
        {
          success: false,
          error: e.message,
          code: e.code,
          audit: e.audit,
        },
        { status: 409 }
      );
    }
    const message = e instanceof Error ? e.message : "Publish failed.";
    return NextResponse.json(
      {
        success: false,
        error: message,
        ...(process.env.NODE_ENV === "development" ? { detail: message } : {}),
      },
      { status: 500 }
    );
  }
}
