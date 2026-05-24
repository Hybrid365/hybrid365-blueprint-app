import { cookies } from "next/headers";
import { globalWeekForBlock } from "@/app/lib/hyroxCoachProgrammeDraft";
import {
  fetchHyroxAthleteById,
  fetchHyroxAthletesByEmail,
} from "@/app/lib/hyroxAthleteCoachDb";
import { buildHyroxPortalServerAuth } from "@/app/lib/hyroxAthletePortalContract";
import { resolveHyroxPortalAthlete } from "@/app/lib/hyroxAthletePortalResolve";
import { fetchAthleteProgressFlags } from "@/app/lib/hyroxAthleteServer";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";
import type { HyroxAthleteRow } from "@/app/lib/hyroxDatabaseTypes";
import { fetchLatestHyroxAssessment } from "@/app/lib/hyroxAthleteAssessmentDb";
import { fetchHyroxAthleteTestingRows } from "@/app/lib/hyroxAthleteTestingDb";
import { countCoachDraftSessions } from "@/app/lib/hyroxCoachProgrammeDraft";
import {
  fetchAthletePublishedProgramme,
  fetchDraftForAthleteWeek,
  parseCoachDraftWeek,
  resolveAthleteProgrammeApiState,
} from "@/app/lib/hyroxProgrammeServer";
import { deriveLiveGlobalWeek } from "@/app/lib/hyroxProgrammeDates";
import {
  authCookiesPresent,
  resolveAuthUserForMiddleware,
  resolveAuthUserWithSessionRetry,
} from "@/app/lib/supabase/resolveAuthUser";
import { createClient } from "@/app/lib/supabase/server";
import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

export type HyroxDiagnosticEnvCheck = {
  hyroxPortalSigningSecretPresent: boolean;
  supabaseServiceRoleKeyPresent: boolean;
  nodeEnv: string;
};

export type HyroxDiagnosticAuthState = {
  authUserId: string | null;
  authEmail: string | null;
  getSessionSucceeded: boolean;
  getUserSucceeded: boolean;
  getUserAfterRetrySucceeded: boolean;
  authCookiesPresent: boolean;
  sessionRefreshAttempted: boolean;
  sessionUserId: string | null;
  viewerRole: "coach" | "unknown";
};

export type HyroxAthleteRowDiagnostic = {
  athleteId: string;
  name: string | null;
  email: string | null;
  userId: string | null;
  status: string;
  paymentStatus: string;
  applicationId: string | null;
  applicationStatus: string | null;
  programmeStartDate: string | null;
  programmeLengthWeeks: number | null;
  currentProgrammeBlock: number | null;
  currentBlock: number;
  currentWeek: number;
  assessmentSubmitted: boolean;
  testingSubmitted: boolean;
  publishedWeekCount: number;
  publishedSessionCount: number;
  publishedWeekNumbers: number[];
  w1ToW4PublishedCount: number;
  dataScore: number;
  looksLikeBestMatch: boolean;
  hasPublishedProgramme: boolean;
};

export type HyroxPortalResolverDiagnostic = {
  label: string;
  simulatedAuthUserId: string | null;
  simulatedAuthEmail: string | null;
  resolvedAthleteId: string | null;
  resolvedAthleteEmail: string | null;
  resolvedAthleteName: string | null;
  matchSource: string;
  accessReason: string | null;
  serverAuthConfirmed: boolean;
  linkFailureReason: string | null;
  duplicateEmailCount: number;
  autoLinkAttempted: boolean;
  autoLinked: boolean;
};

export type HyroxProgrammeWeekSessionRow = {
  id: string;
  title: string;
  day: string;
  slot: string;
  category: string;
  isKey: boolean;
  isOptional: boolean;
};

export type HyroxProgrammeWeekSessionDiagnostic = {
  weekNumber: number;
  programmeWeekId: string | null;
  dbSessionCount: number;
  draftSessionCount: number | null;
  draftKeyCount: number | null;
  draftOptionalCount: number | null;
  draftMainCount: number | null;
  draftAmCount: number | null;
  draftPmCount: number | null;
  mismatchNote: string | null;
  sessions: HyroxProgrammeWeekSessionRow[];
};

export type HyroxProgrammeDiagnostic = {
  athleteId: string;
  publishedWeekCount: number;
  sessionCount: number;
  w1Exists: boolean;
  w2Exists: boolean;
  w3Exists: boolean;
  w4Exists: boolean;
  weekNumbersPublished: number[];
  programmeStartDate: string | null;
  liveGlobalWeek: number | null;
  firstSessionId: string | null;
  firstSessionTitle: string | null;
  programmeApiState: string;
  programmeVisibility: string;
  programmeShouldBeLive: boolean;
  calendarLiveWeekNumber: number | null;
  weekSessionBreakdown: HyroxProgrammeWeekSessionDiagnostic[];
  generatorTrainingDaysNote: string | null;
};

export type HyroxApiProbeDiagnostic = {
  route: string;
  status: "ok" | "auth_failed" | "data_failed" | "skipped";
  authEmail: string | null;
  matchedAthleteId: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  authMethod: "cookie" | "no_auth" | "not_applicable";
  detail?: string;
};

export type HyroxAthleteDiagnosticReport = {
  generatedAt: string;
  searchEmail: string | null;
  searchAthleteId: string | null;
  diagnosis: {
    headlines: string[];
    recommendedActions: string[];
  };
  env: HyroxDiagnosticEnvCheck;
  auth: HyroxDiagnosticAuthState;
  athleteRows: HyroxAthleteRowDiagnostic[];
  portalResolvers: HyroxPortalResolverDiagnostic[];
  programmeChecks: HyroxProgrammeDiagnostic[];
  athleteIdWithPublishedBlock: string | null;
  apiProbes: HyroxApiProbeDiagnostic[];
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function countPublishedWeeks(
  supabase: SupabaseClient,
  athleteId: string
): Promise<number> {
  const { count } = await supabase
    .from("hyrox_programme_weeks")
    .select("id", { count: "exact", head: true })
    .eq("athlete_id", athleteId)
    .eq("status", "published");
  return count ?? 0;
}

async function countPublishedSessions(
  supabase: SupabaseClient,
  athleteId: string
): Promise<number> {
  const { count } = await supabase
    .from("hyrox_programme_sessions")
    .select("id", { count: "exact", head: true })
    .eq("athlete_id", athleteId);
  return count ?? 0;
}

async function publishedWeekNumbersForAthlete(
  supabase: SupabaseClient,
  athleteId: string
): Promise<number[]> {
  const { data } = await supabase
    .from("hyrox_programme_weeks")
    .select("week_number")
    .eq("athlete_id", athleteId)
    .eq("status", "published")
    .order("week_number", { ascending: true });
  return (data ?? []).map((r) => r.week_number as number);
}

async function w1ToW4CountForCurrentBlock(
  supabase: SupabaseClient,
  athlete: HyroxAthleteRow
): Promise<number> {
  const blockNumber = athlete.current_block ?? 1;
  const blockWeekNumbers = [1, 2, 3, 4].map((cycle) =>
    globalWeekForBlock(blockNumber as 1 | 2 | 3, cycle as 1 | 2 | 3 | 4)
  );
  const { count } = await supabase
    .from("hyrox_programme_weeks")
    .select("id", { count: "exact", head: true })
    .eq("athlete_id", athlete.id)
    .eq("status", "published")
    .eq("block_number", blockNumber)
    .in("week_number", blockWeekNumbers);
  return count ?? 0;
}

async function scoreAthleteData(
  supabase: SupabaseClient,
  athlete: HyroxAthleteRow,
  authUserId: string
): Promise<number> {
  const flags = await fetchAthleteProgressFlags(supabase, athlete.id);
  const weeks = await countPublishedWeeks(supabase, athlete.id);
  return (
    weeks * 100 +
    (flags.hasTesting ? 10 : 0) +
    (flags.hasAssessment ? 5 : 0) +
    (athlete.user_id === authUserId ? 50 : 0)
  );
}

async function fetchApplicationStatus(
  supabase: SupabaseClient,
  applicationId: string | null
): Promise<string | null> {
  if (!applicationId) return null;
  const { data } = await supabase
    .from("hyrox_applications")
    .select("status")
    .eq("id", applicationId)
    .maybeSingle();
  return (data?.status as string | undefined) ?? null;
}

async function buildRowDiagnostic(
  supabase: SupabaseClient,
  athlete: HyroxAthleteRow,
  authUserId: string,
  bestAthleteId: string | null
): Promise<HyroxAthleteRowDiagnostic> {
  const flags = await fetchAthleteProgressFlags(supabase, athlete.id);
  const [publishedWeekCount, publishedSessionCount, publishedWeekNumbers, w1w4] =
    await Promise.all([
      countPublishedWeeks(supabase, athlete.id),
      countPublishedSessions(supabase, athlete.id),
      publishedWeekNumbersForAthlete(supabase, athlete.id),
      w1ToW4CountForCurrentBlock(supabase, athlete),
    ]);
  const dataScore = await scoreAthleteData(supabase, athlete, authUserId);
  const applicationStatus = await fetchApplicationStatus(
    supabase,
    athlete.application_id
  );

  return {
    athleteId: athlete.id,
    name: athlete.name?.trim() || null,
    email: athlete.email ?? null,
    userId: athlete.user_id,
    status: athlete.status,
    paymentStatus: athlete.payment_status,
    applicationId: athlete.application_id,
    applicationStatus,
    programmeStartDate: athlete.programme_start_date ?? null,
    programmeLengthWeeks: athlete.programme_length_weeks ?? null,
    currentProgrammeBlock: athlete.current_programme_block ?? null,
    currentBlock: athlete.current_block,
    currentWeek: athlete.current_week,
    assessmentSubmitted: flags.hasAssessment,
    testingSubmitted: flags.hasTesting,
    publishedWeekCount,
    publishedSessionCount,
    publishedWeekNumbers,
    w1ToW4PublishedCount: w1w4,
    dataScore,
    looksLikeBestMatch: athlete.id === bestAthleteId,
    hasPublishedProgramme: publishedWeekCount > 0 && publishedSessionCount > 0,
  };
}

async function buildProgrammeDiagnostic(
  supabase: SupabaseClient,
  athlete: HyroxAthleteRow
): Promise<HyroxProgrammeDiagnostic> {
  const flags = await fetchAthleteProgressFlags(supabase, athlete.id);
  const programme = await fetchAthletePublishedProgramme(supabase, athlete, flags);
  const state = resolveAthleteProgrammeApiState({
    published: programme.published,
    visibility: programme.visibility,
    athleteStatus: programme.athleteStatus,
  });

  const generatedWeeks = programme.weeks.filter((w) => w.generated);
  const weekNums = generatedWeeks.map((w) => w.weekNumber);
  const has = (n: number) => weekNums.includes(n);

  const allSessions = programme.weeks.flatMap((w) => w.sessions);
  const first = allSessions[0] ?? programme.sessions[0] ?? null;
  const liveWeek = programme.weeks.find((w) => w.calendarStatus === "live");

  const programmeStartDate = programme.programmeStartDate;
  const liveGlobalWeek = programmeStartDate
    ? deriveLiveGlobalWeek(programmeStartDate)
    : null;

  const blockNumber = athlete.current_block ?? 1;
  const weekSessionBreakdown: HyroxProgrammeWeekSessionDiagnostic[] = [];

  for (const weekNumber of [1, 2, 3, 4] as const) {
    const bundle = programme.weeks.find((w) => w.weekNumber === weekNumber);
    const dbSessions = bundle?.sessions ?? [];
    const draftRow = await fetchDraftForAthleteWeek(
      supabase,
      athlete.id,
      blockNumber,
      weekNumber
    );
    const draftWeek = draftRow ? parseCoachDraftWeek(draftRow.draft_data) : null;
    const draftCounts = draftWeek ? countCoachDraftSessions(draftWeek) : null;

    let mismatchNote: string | null = null;
    if (draftCounts && dbSessions.length < draftCounts.total) {
      mismatchNote = `DB has ${dbSessions.length} rows; latest draft has ${draftCounts.total} — republish block to sync missing sessions.`;
    } else if (draftCounts && dbSessions.length === 4 && draftCounts.total > 4) {
      mismatchNote =
        "Likely published with 4 training days (generator emits 4 sessions/week). Mapped profile may now request more — republish block.";
    }

    weekSessionBreakdown.push({
      weekNumber,
      programmeWeekId: bundle?.week?.id ?? null,
      dbSessionCount: dbSessions.length,
      draftSessionCount: draftCounts?.total ?? null,
      draftKeyCount: draftCounts?.key ?? null,
      draftOptionalCount: draftCounts?.optional ?? null,
      draftMainCount: draftCounts?.main ?? null,
      draftAmCount: draftCounts?.am ?? null,
      draftPmCount: draftCounts?.pm ?? null,
      mismatchNote,
      sessions: dbSessions.map((s) => {
        const meta = (s.metadata ?? {}) as Record<string, unknown>;
        return {
          id: s.id,
          title: s.session_name,
          day: s.day_of_week,
          slot: s.session_slot,
          category: s.category,
          isKey: Boolean(meta.isKeySession),
          isOptional: Boolean(meta.isOptional),
        };
      }),
    });
  }

  const w1Count = weekSessionBreakdown.find((w) => w.weekNumber === 1)?.dbSessionCount ?? 0;
  const w2Count = weekSessionBreakdown.find((w) => w.weekNumber === 2)?.dbSessionCount ?? 0;
  let generatorTrainingDaysNote: string | null = null;
  if (w2Count === 4 && w1Count > 4) {
    generatorTrainingDaysNote =
      "W2–W4 have 4 DB sessions each (typical of 4-day generator output); W1 has more — weeks may have been published at different training-day settings or W1 was synced separately.";
  } else if (weekSessionBreakdown.every((w) => w.dbSessionCount === 4)) {
    generatorTrainingDaysNote =
      "All weeks have 4 DB sessions — matches generator output for athletes with 4 training days per week (not a UI filter).";
  }

  return {
    athleteId: athlete.id,
    publishedWeekCount: generatedWeeks.length,
    sessionCount: allSessions.length,
    w1Exists: has(1),
    w2Exists: has(2),
    w3Exists: has(3),
    w4Exists: has(4),
    weekNumbersPublished: weekNums,
    programmeStartDate,
    liveGlobalWeek,
    firstSessionId: first?.id ?? null,
    firstSessionTitle: first?.session_name ?? null,
    programmeApiState: state,
    programmeVisibility: programme.visibility,
    programmeShouldBeLive:
      state === "published" && generatedWeeks.some((w) => w.calendarStatus === "live"),
    calendarLiveWeekNumber: liveWeek?.weekNumber ?? liveGlobalWeek,
    weekSessionBreakdown,
    generatorTrainingDaysNote,
  };
}

async function probeApiEndpoints(
  user: User | null,
  hasAuthCookie: boolean
): Promise<HyroxApiProbeDiagnostic[]> {
  const routes = [
    "/api/hyrox/athlete/assessment",
    "/api/hyrox/athlete/testing",
    "/api/hyrox/athlete/programme",
    "/api/hyrox/athlete/session-log",
  ] as const;

  if (!user) {
    return routes.map((route) => ({
      route,
      status: "auth_failed" as const,
      authEmail: null,
      matchedAthleteId: null,
      errorCode: "NO_AUTH",
      errorMessage: "Not signed in",
      authMethod: "no_auth" as const,
    }));
  }

  const supabase = await createClient();
  const portal = await resolveHyroxPortalAthlete({
    user,
    supabase,
    attemptAutoLink: false,
  });

  const linked =
    portal.accessReason === "LINKED" &&
    portal.athlete?.payment_status === "paid" &&
    portal.athlete.user_id === user.id;

  const athlete = linked ? portal.athlete : null;

  if (!athlete) {
    return routes.map((route) => ({
      route,
      status: "auth_failed" as const,
      authEmail: user.email?.trim().toLowerCase() ?? null,
      matchedAthleteId: portal.athlete?.id ?? null,
      errorCode: portal.accessReason ?? "NO_AUTH",
      errorMessage:
        portal.accessReason === "UNLINKED_PAID"
          ? "Paid athlete profile found but not linked to this sign-in."
          : "No Hyrox athlete profile found for this login email",
      authMethod: "no_auth" as const,
      detail: `matchSource=${portal.matchSource}`,
    }));
  }

  const { client: coachClient } = await createCoachServerClient();
  const authEmail = user.email?.trim().toLowerCase() ?? null;
  const probes: HyroxApiProbeDiagnostic[] = [];

  for (const route of routes) {
    if (route === "/api/hyrox/athlete/session-log") {
      probes.push({
        route,
        status: "ok",
        authEmail,
        matchedAthleteId: athlete.id,
        errorCode: null,
        errorMessage: null,
        authMethod: "cookie",
        detail: "Auth probe only (no mutation). Cookie session + linked athlete OK.",
      });
      continue;
    }

    try {
      if (route === "/api/hyrox/athlete/assessment") {
        const { assessment, error } = await fetchLatestHyroxAssessment(athlete.id);
        if (error) {
          probes.push({
            route,
            status: "data_failed",
            authEmail,
            matchedAthleteId: athlete.id,
            errorCode: "FETCH_ERROR",
            errorMessage: error,
            authMethod: "cookie",
          });
        } else {
          probes.push({
            route,
            status: "ok",
            authEmail,
            matchedAthleteId: athlete.id,
            errorCode: null,
            errorMessage: null,
            authMethod: "cookie",
            detail: assessment ? "Assessment row found" : "No assessment row",
          });
        }
        continue;
      }

      if (route === "/api/hyrox/athlete/testing") {
        const { tests, error } = await fetchHyroxAthleteTestingRows(athlete.id);
        if (error) {
          probes.push({
            route,
            status: "data_failed",
            authEmail,
            matchedAthleteId: athlete.id,
            errorCode: "FETCH_ERROR",
            errorMessage: error,
            authMethod: "cookie",
          });
        } else {
          const submitted = tests.length;
          probes.push({
            route,
            status: "ok",
            authEmail,
            matchedAthleteId: athlete.id,
            errorCode: null,
            errorMessage: null,
            authMethod: "cookie",
            detail: `${submitted} submitted testing row(s)`,
          });
        }
        continue;
      }

      const flags = await fetchAthleteProgressFlags(coachClient, athlete.id);
      const programme = await fetchAthletePublishedProgramme(coachClient, athlete, flags);
      const state = resolveAthleteProgrammeApiState({
        published: programme.published,
        visibility: programme.visibility,
        athleteStatus: programme.athleteStatus,
      });
      probes.push({
        route,
        status: "ok",
        authEmail,
        matchedAthleteId: athlete.id,
        errorCode: null,
        errorMessage: null,
        authMethod: "cookie",
        detail: `state=${state}, weeks=${programme.weeks.filter((w) => w.generated).length}, sessions=${programme.weeks.flatMap((w) => w.sessions).length}`,
      });
    } catch (e) {
      probes.push({
        route,
        status: "data_failed",
        authEmail,
        matchedAthleteId: athlete.id,
        errorCode: "EXCEPTION",
        errorMessage: e instanceof Error ? e.message : "Unknown error",
        authMethod: "cookie",
      });
    }
  }

  return probes;
}

async function buildPortalResolverDiagnostic(
  label: string,
  user: User
): Promise<HyroxPortalResolverDiagnostic> {
  const supabase = await createClient();
  const portal = await resolveHyroxPortalAthlete({
    user,
    supabase,
    attemptAutoLink: true,
  });

  const resolved = portal.athlete;
  const portalLinked =
    portal.accessReason === "LINKED" &&
    Boolean(resolved?.payment_status === "paid" && resolved.user_id === user.id);

  const serverAuth = buildHyroxPortalServerAuth({
    layoutAuth: {
      hasSession: true,
      email: user.email?.trim().toLowerCase() ?? null,
      userId: user.id,
      hasSupabaseAuthCookie: true,
    },
    hasLinkedAthlete: portalLinked,
    portalAthlete: resolved
      ? {
          id: resolved.id,
          name: resolved.name?.trim() || "Athlete",
          email: resolved.email ?? user.email ?? null,
          status: resolved.status,
        }
      : null,
    portalMatchSource: portal.matchSource,
  });

  let linkFailureReason: string | null = null;
  if (portal.accessReason === "UNLINKED_PAID") {
    linkFailureReason = "Paid profile exists but user_id is not linked to this auth user.";
  } else if (portal.accessReason === "ATHLETE_EMAIL_LINKED_TO_DIFFERENT_AUTH_USER") {
    linkFailureReason = "Email matches a paid athlete linked to a different auth account.";
  } else if (portal.accessReason === "NO_PAID_ATHLETE_FOUND") {
    linkFailureReason = "No paid hyrox_athletes row for this login.";
  } else if (!portalLinked && resolved) {
    linkFailureReason = `Resolved row ${resolved.id} but portalLinked=false (${portal.accessReason}).`;
  }

  return {
    label,
    simulatedAuthUserId: user.id,
    simulatedAuthEmail: user.email?.trim().toLowerCase() ?? null,
    resolvedAthleteId: resolved?.id ?? null,
    resolvedAthleteEmail: resolved?.email ?? null,
    resolvedAthleteName: resolved?.name?.trim() || null,
    matchSource: portal.matchSource,
    accessReason: portal.accessReason,
    serverAuthConfirmed: serverAuth.serverAuthConfirmed,
    linkFailureReason,
    duplicateEmailCount: portal.duplicateEmailAthletes.length,
    autoLinkAttempted: portal.autoLinkAttempted,
    autoLinked: portal.autoLinked,
  };
}

function buildDiagnosis(report: Omit<HyroxAthleteDiagnosticReport, "diagnosis">): HyroxAthleteDiagnosticReport["diagnosis"] {
  const headlines: string[] = [];
  const recommendedActions: string[] = [];

  if (
    report.env.nodeEnv === "production" &&
    !report.env.hyroxPortalSigningSecretPresent
  ) {
    headlines.push("HYROX_PORTAL_SIGNING_SECRET is missing in production.");
    recommendedActions.push("Add HYROX_PORTAL_SIGNING_SECRET in Vercel and redeploy.");
  }

  if (!report.env.supabaseServiceRoleKeyPresent) {
    headlines.push("SUPABASE_SERVICE_ROLE_KEY is not set — coach DB reads and signed-token saves may fail.");
    recommendedActions.push("Add SUPABASE_SERVICE_ROLE_KEY in Vercel.");
  }

  const paidRows = report.athleteRows.filter((r) => r.paymentStatus === "paid");
  if (paidRows.length > 1) {
    headlines.push(
      `Duplicate email rows found (${paidRows.length} paid). Resolver may pick a different row than where programme was published.`
    );
    recommendedActions.push("Delete or merge duplicate hyrox_athletes rows for this email.");
  }

  const withProgramme = report.athleteRows.filter((r) => r.w1ToW4PublishedCount >= 4);
  const resolvedId =
    report.portalResolvers.find((p) => p.label.includes("search"))?.resolvedAthleteId ??
    report.portalResolvers[0]?.resolvedAthleteId ??
    null;

  if (
    report.athleteIdWithPublishedBlock &&
    resolvedId &&
    report.athleteIdWithPublishedBlock !== resolvedId
  ) {
    headlines.push(
      `Portal resolves to athlete ${resolvedId.slice(0, 8)}… but published W1–W4 block is on athlete ${report.athleteIdWithPublishedBlock.slice(0, 8)}….`
    );
    recommendedActions.push("Republish programme to the resolved athlete id or merge rows and relink user_id.");
  }

  const resolvedProgramme = report.programmeChecks.find(
    (p) => p.athleteId === resolvedId
  );
  if (resolvedId && resolvedProgramme && resolvedProgramme.programmeApiState === "building") {
    headlines.push(
      "Programme data exists but API state is “building” — athlete UI may show “Your programme is being built”."
    );
    recommendedActions.push(
      "Check draft status / visibility rules or publish all four weeks for the current block."
    );
  }

  if (resolvedId && resolvedProgramme && resolvedProgramme.publishedWeekCount === 0) {
    headlines.push("No published programme weeks for the resolved athlete id.");
    recommendedActions.push("Publish the 4-week block to the resolved athlete in coach admin.");
  }

  if (resolvedId && resolvedProgramme?.generatorTrainingDaysNote) {
    headlines.push(resolvedProgramme.generatorTrainingDaysNote);
    recommendedActions.push(
      "Coach admin: Publish 4-week block again (syncs missing sessions into existing weeks from current mapped profile)."
    );
  }

  const w2Diag = resolvedProgramme?.weekSessionBreakdown.find((w) => w.weekNumber === 2);
  if (w2Diag?.mismatchNote) {
    headlines.push(`Week 2 sessions: ${w2Diag.mismatchNote}`);
  }

  if (
    resolvedId &&
    resolvedProgramme &&
    resolvedProgramme.publishedWeekCount > 0 &&
    resolvedProgramme.sessionCount === 0
  ) {
    headlines.push("Published weeks exist but session count is zero.");
    recommendedActions.push("Republish sessions for this athlete’s programme weeks.");
  }

  const apiFails = report.apiProbes.filter((p) => p.status === "auth_failed");
  const viewerResolver = report.portalResolvers.find((p) => p.label === "Current browser session");
  if (
    apiFails.length > 0 &&
    viewerResolver?.serverAuthConfirmed
  ) {
    headlines.push(
      "API cookie auth fails but layout-style resolver would confirm the athlete — likely stale client API state or cookie mismatch on fetch."
    );
    recommendedActions.push("Use server programme seed as source of truth; verify athlete APIs on device as the athlete user.");
  } else if (apiFails.length > 0 && !report.auth.getUserSucceeded) {
    headlines.push("No Supabase session is available to APIs for the current browser session.");
    recommendedActions.push(
      "Open this page while logged in as the athlete, or compare email rows below; athlete must log in again on Safari."
    );
  } else if (apiFails.length > 0) {
    headlines.push("Athlete APIs would return Not signed in for the current browser session.");
    recommendedActions.push("Fix API resolver / link user_id on the paid hyrox_athletes row.");
  }

  if (headlines.length === 0) {
    if (report.athleteRows.length === 0) {
      headlines.push("No hyrox_athletes rows found for the searched email.");
      recommendedActions.push("Confirm email spelling or create/link athlete in coach admin.");
    } else {
      headlines.push("No obvious mismatch detected from DB + resolver checks.");
      recommendedActions.push(
        "If the live portal still errors, compare athlete id in dev panel vs resolved id here and hard-refresh Safari."
      );
    }
  }

  return { headlines, recommendedActions };
}

export async function buildHyroxAthleteDiagnosticReport(params: {
  searchEmail?: string | null;
  searchAthleteId?: string | null;
}): Promise<HyroxAthleteDiagnosticReport> {
  const cookieStore = await cookies();
  const cookieList = cookieStore.getAll();
  const hasAuthCookie = authCookiesPresent(cookieList);
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { user, retriedWithSession } = await resolveAuthUserForMiddleware(
    supabase,
    hasAuthCookie
  );

  const { user: userAfterRetry } = await resolveAuthUserWithSessionRetry(supabase, {
    hasAuthCookie,
  });

  const auth: HyroxDiagnosticAuthState = {
    authUserId: user?.id ?? null,
    authEmail: user?.email?.trim().toLowerCase() ?? null,
    getSessionSucceeded: Boolean(session?.user),
    getUserSucceeded: Boolean(user),
    getUserAfterRetrySucceeded: Boolean(userAfterRetry),
    authCookiesPresent: hasAuthCookie,
    sessionRefreshAttempted: retriedWithSession,
    sessionUserId: session?.user?.id ?? null,
    viewerRole: user ? "coach" : "unknown",
  };

  const env: HyroxDiagnosticEnvCheck = {
    hyroxPortalSigningSecretPresent: Boolean(
      process.env.HYROX_PORTAL_SIGNING_SECRET?.trim()
    ),
    supabaseServiceRoleKeyPresent: Boolean(
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
    ),
    nodeEnv: process.env.NODE_ENV ?? "unknown",
  };

  const searchEmail = params.searchEmail?.trim()
    ? normalizeEmail(params.searchEmail)
    : auth.authEmail;
  const searchAthleteId = params.searchAthleteId?.trim() || null;

  const { client: coachClient } = await createCoachServerClient();

  let athletes: HyroxAthleteRow[] = [];
  if (searchAthleteId) {
    const { athlete } = await fetchHyroxAthleteById(coachClient, searchAthleteId);
    if (athlete) athletes = [athlete];
    else if (searchEmail) {
      const byEmail = await fetchHyroxAthletesByEmail(coachClient, searchEmail);
      athletes = byEmail.athletes;
    }
  } else if (searchEmail) {
    const byEmail = await fetchHyroxAthletesByEmail(coachClient, searchEmail);
    athletes = byEmail.athletes;
  }

  const paid = athletes.filter((a) => a.payment_status === "paid");
  let bestAthleteId: string | null = null;
  if (paid.length > 0) {
    const scored = await Promise.all(
      paid.map(async (a) => ({
        id: a.id,
        score: await scoreAthleteData(
          coachClient,
          a,
          a.user_id ?? user?.id ?? ""
        ),
      }))
    );
    scored.sort((a, b) => b.score - a.score);
    bestAthleteId = scored[0]?.id ?? null;
  }

  const athleteRows = await Promise.all(
    athletes.map((a) =>
      buildRowDiagnostic(coachClient, a, user?.id ?? a.user_id ?? "", bestAthleteId)
    )
  );

  const athleteIdWithPublishedBlock =
    athleteRows.find((r) => r.w1ToW4PublishedCount >= 4)?.athleteId ?? null;

  const portalResolvers: HyroxPortalResolverDiagnostic[] = [];

  if (user) {
    portalResolvers.push(
      await buildPortalResolverDiagnostic("Current browser session", user)
    );
  }

  if (searchEmail) {
    const simUserId =
      user && normalizeEmail(user.email ?? "") === searchEmail
        ? user.id
        : paid.find((a) => a.user_id)?.user_id ??
          athletes.find((a) => a.user_id)?.user_id ??
          "00000000-0000-0000-0000-000000000000";

    const simUser = {
      id: simUserId,
      email: searchEmail,
    } as User;

    const label =
      user && normalizeEmail(user.email ?? "") === searchEmail
        ? "Search email (same as current session)"
        : `Search email simulation (auth user ${simUserId.slice(0, 8)}…)`;

    portalResolvers.push(await buildPortalResolverDiagnostic(label, simUser));
  }

  const programmeAthleteIds = new Set<string>();
  if (bestAthleteId) programmeAthleteIds.add(bestAthleteId);
  for (const r of portalResolvers) {
    if (r.resolvedAthleteId) programmeAthleteIds.add(r.resolvedAthleteId);
  }
  if (athleteIdWithPublishedBlock) programmeAthleteIds.add(athleteIdWithPublishedBlock);

  const programmeChecks: HyroxProgrammeDiagnostic[] = [];
  for (const id of programmeAthleteIds) {
    const row = athletes.find((a) => a.id === id);
    if (!row) {
      const { athlete } = await fetchHyroxAthleteById(coachClient, id);
      if (athlete) {
        programmeChecks.push(await buildProgrammeDiagnostic(coachClient, athlete));
      }
    } else {
      programmeChecks.push(await buildProgrammeDiagnostic(coachClient, row));
    }
  }

  const apiProbes = await probeApiEndpoints(user, hasAuthCookie);

  const partial = {
    generatedAt: new Date().toISOString(),
    searchEmail: searchEmail ?? null,
    searchAthleteId,
    env,
    auth,
    athleteRows,
    portalResolvers,
    programmeChecks,
    athleteIdWithPublishedBlock,
    apiProbes,
  };

  const diagnosis = buildDiagnosis(partial);

  return { ...partial, diagnosis };
}
