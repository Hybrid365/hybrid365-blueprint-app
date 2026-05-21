import {
  buildAthleteAccessDebug,
  evaluateAthleteEmailAccess,
  linkHyroxAthleteToAuthUser,
  type HyroxAthleteAccessDebug,
} from "@/app/lib/hyroxAthleteAutoLink";
import { fetchHyroxAthletesByEmail } from "@/app/lib/hyroxAthleteCoachDb";
import { HYROX_ATHLETE_SELECT } from "@/app/lib/hyroxCurrentAthlete";
import { fetchAthleteProgressFlags } from "@/app/lib/hyroxAthleteServer";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";
import { logHyroxAuthDebug } from "@/app/lib/hyroxAuthDebug";
import type { HyroxAthleteRow } from "@/app/lib/hyroxDatabaseTypes";
import { createClient } from "@/app/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

export type AthleteMatchSource = "user_id" | "email" | "none";

export type ResolvedPortalAthlete = {
  athlete: HyroxAthleteRow | null;
  matchSource: AthleteMatchSource;
  accessReason: HyroxAthleteAccessDebug["accessReason"];
  debug: HyroxAthleteAccessDebug;
  duplicateEmailAthletes: HyroxAthleteRow[];
  autoLinkAttempted: boolean;
  autoLinked: boolean;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function fetchAthleteByUserId(
  supabase: SupabaseClient,
  userId: string
): Promise<HyroxAthleteRow | null> {
  const { data, error } = await supabase
    .from("hyrox_athletes")
    .select(HYROX_ATHLETE_SELECT)
    .eq("user_id", userId)
    .limit(1);

  if (error) {
    console.warn("[hyrox/portal-resolve] user_id lookup:", error.message);
    return null;
  }
  return (data?.[0] as HyroxAthleteRow | undefined) ?? null;
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

async function scoreAthleteRow(
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

/** When multiple paid rows share an email, prefer linked user, then most programme data. */
async function pickBestPaidAthleteForLogin(
  supabase: SupabaseClient,
  candidates: HyroxAthleteRow[],
  authUserId: string
): Promise<{ athlete: HyroxAthleteRow; reason: "user_id" | "email" } | null> {
  const paid = candidates.filter((a) => a.payment_status === "paid");
  if (!paid.length) return null;

  const linked = paid.find((a) => a.user_id === authUserId);
  if (linked) return { athlete: linked, reason: "user_id" };

  if (paid.length === 1) {
    return { athlete: paid[0]!, reason: "email" };
  }

  const scored = await Promise.all(
    paid.map(async (a) => {
      const flags = await fetchAthleteProgressFlags(supabase, a.id);
      const weeks = await countPublishedWeeks(supabase, a.id);
      const score =
        weeks * 100 +
        (flags.hasTesting ? 10 : 0) +
        (flags.hasAssessment ? 5 : 0) +
        (a.user_id ? 3 : 0);
      return { athlete: a, score, weeks };
    })
  );

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0]!;

  if (process.env.NODE_ENV === "development" && paid.length > 1) {
    console.warn("[hyrox/portal-resolve] duplicate paid athletes for email — picked best by data", {
      authUserId,
      pickedId: best.athlete.id,
      pickedWeeks: best.weeks,
      all: scored.map((s) => ({
        id: s.athlete.id,
        name: s.athlete.name,
        user_id: s.athlete.user_id,
        weeks: s.weeks,
        score: s.score,
      })),
    });
  }

  return { athlete: best.athlete, reason: "email" };
}

export async function resolveHyroxPortalAthlete(params: {
  user: User;
  supabase?: SupabaseClient;
  attemptAutoLink?: boolean;
}): Promise<ResolvedPortalAthlete> {
  const supabase = params.supabase ?? (await createClient());
  const email = params.user.email?.trim() ?? "";
  const normalizedEmail = email ? normalizeEmail(email) : "";

  const byUserId = await fetchAthleteByUserId(supabase, params.user.id);

  let duplicateEmailAthletes: HyroxAthleteRow[] = [];
  let emailPick: { athlete: HyroxAthleteRow; reason: "user_id" | "email" } | null = null;

  const { client: coachClient } = await createCoachServerClient();

  if (normalizedEmail) {
    const { athletes, error } = await fetchHyroxAthletesByEmail(coachClient, normalizedEmail);
    if (error) {
      const debug = buildAthleteAccessDebug({
        authUserId: params.user.id,
        authEmail: normalizedEmail,
        athlete: null,
        reason: "LOOKUP_FAILED",
      });
      return {
        athlete: byUserId,
        matchSource: byUserId ? "user_id" : "none",
        accessReason: debug.accessReason,
        debug,
        duplicateEmailAthletes: [],
        autoLinkAttempted: false,
        autoLinked: false,
      };
    }
    duplicateEmailAthletes = athletes;
    const coach = await createCoachServerClient();
    emailPick = await pickBestPaidAthleteForLogin(coachClient, athletes, params.user.id);
  }

  let athlete: HyroxAthleteRow | null = null;
  let matchSource: AthleteMatchSource = "none";

  if (byUserId && emailPick && byUserId.id !== emailPick.athlete.id) {
    const userIdScore = await scoreAthleteRow(coachClient, byUserId, params.user.id);
    const emailScore = await scoreAthleteRow(coachClient, emailPick.athlete, params.user.id);
    if (process.env.NODE_ENV === "development") {
      console.warn("[hyrox/portal-resolve] user_id row differs from email row — picking by data score", {
        authUserId: params.user.id,
        authEmail: normalizedEmail,
        userIdRow: { id: byUserId.id, name: byUserId.name, score: userIdScore },
        emailRow: { id: emailPick.athlete.id, name: emailPick.athlete.name, score: emailScore },
      });
    }
    if (emailScore > userIdScore) {
      athlete = emailPick.athlete;
      matchSource = emailPick.reason;
    } else {
      athlete = byUserId;
      matchSource = "user_id";
    }
  } else if (byUserId) {
    athlete = byUserId;
    matchSource = "user_id";
  } else if (emailPick) {
    athlete = emailPick.athlete;
    matchSource = emailPick.reason;
  }

  const emailAccess = normalizedEmail
    ? await evaluateAthleteEmailAccess(params.user.id, normalizedEmail)
    : null;

  let accessReason: HyroxAthleteAccessDebug["accessReason"] =
    emailAccess?.debug.accessReason ?? (athlete ? "LINKED" : "NO_PAID_ATHLETE_FOUND");

  if (athlete && athlete.payment_status === "paid") {
    if (!athlete.user_id) {
      accessReason = "UNLINKED_PAID";
    } else if (athlete.user_id === params.user.id) {
      accessReason = "LINKED";
    } else {
      accessReason = "ATHLETE_EMAIL_LINKED_TO_DIFFERENT_AUTH_USER";
    }
  } else if (!athlete) {
    accessReason = emailAccess?.debug.accessReason ?? "NO_PAID_ATHLETE_FOUND";
  }

  let autoLinkAttempted = false;
  let autoLinked = false;

  if (
    params.attemptAutoLink &&
    athlete &&
    athlete.payment_status === "paid" &&
    accessReason === "UNLINKED_PAID" &&
    normalizedEmail
  ) {
    autoLinkAttempted = true;
    const linkResult = await linkHyroxAthleteToAuthUser({
      athleteId: athlete.id,
      targetUserId: params.user.id,
      email: normalizedEmail,
      changedBy: params.user.id,
      historyReason: "auto_link_on_portal_load",
    });
    autoLinked = linkResult.linked;
    if (autoLinked) {
      const refreshed = await fetchAthleteByUserId(supabase, params.user.id);
      if (refreshed) {
        athlete = refreshed;
        matchSource = "user_id";
        accessReason = "LINKED";
      }
    }
  }

  const debug = buildAthleteAccessDebug({
    authUserId: params.user.id,
    authEmail: normalizedEmail || email,
    athlete,
    reason: accessReason,
  });

  logHyroxAuthDebug("resolveHyroxPortalAthlete", {
    authUserId: params.user.id,
    authEmail: normalizedEmail,
    matchSource,
    athleteId: athlete?.id ?? null,
    accessReason,
    duplicateCount: duplicateEmailAthletes.length,
    autoLinked,
  });

  return {
    athlete,
    matchSource,
    accessReason,
    debug,
    duplicateEmailAthletes,
    autoLinkAttempted,
    autoLinked,
  };
}

export type AthletePortalDebugSnapshot = {
  authEmail: string;
  authUserId: string;
  matchedAthleteId: string | null;
  matchedAthleteName: string | null;
  matchedBy: AthleteMatchSource;
  athleteEmailInDb: string | null;
  athleteUserId: string | null;
  athleteStatus: string | null;
  accessReason: string | null;
  duplicateEmailCount: number;
  duplicateAthletes: Array<{
    id: string;
    name: string | null;
    email: string | null;
    user_id: string | null;
    publishedWeekCount: number;
  }>;
  assessmentSubmitted: boolean;
  testingSubmitted: boolean;
  publishedWeekCount: number;
  programmeStartDate: string | null;
  programmeLive: boolean;
  mockPreviewEnabled: boolean;
  apiErrors: string[];
};

export async function buildAthletePortalDebugSnapshot(params: {
  user: User;
  mockPreviewEnabled?: boolean;
}): Promise<AthletePortalDebugSnapshot> {
  const apiErrors: string[] = [];
  const resolved = await resolveHyroxPortalAthlete({
    user: params.user,
    attemptAutoLink: false,
  });

  const athlete = resolved.athlete;
  const { client: coachClient } = await createCoachServerClient();

  let assessmentSubmitted = false;
  let testingSubmitted = false;
  let publishedWeeks = 0;

  if (athlete) {
    const flags = await fetchAthleteProgressFlags(coachClient, athlete.id);
    assessmentSubmitted = flags.hasAssessment;
    testingSubmitted = flags.hasTesting;
    publishedWeeks = await countPublishedWeeks(coachClient, athlete.id);
  }

  const duplicateAthletes = await Promise.all(
    resolved.duplicateEmailAthletes.map(async (row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      user_id: row.user_id,
      publishedWeekCount: await countPublishedWeeks(coachClient, row.id),
    }))
  );

  return {
    authEmail: params.user.email?.trim().toLowerCase() ?? "",
    authUserId: params.user.id,
    matchedAthleteId: athlete?.id ?? null,
    matchedAthleteName: athlete?.name?.trim() || null,
    matchedBy: resolved.matchSource,
    athleteEmailInDb: athlete?.email ?? null,
    athleteUserId: athlete?.user_id ?? null,
    athleteStatus: athlete?.status ?? null,
    accessReason: resolved.accessReason,
    duplicateEmailCount: resolved.duplicateEmailAthletes.length,
    duplicateAthletes,
    assessmentSubmitted,
    testingSubmitted,
    publishedWeekCount: publishedWeeks,
    programmeStartDate: athlete?.programme_start_date ?? null,
    programmeLive: publishedWeeks > 0,
    mockPreviewEnabled: Boolean(params.mockPreviewEnabled),
    apiErrors,
  };
}
