import { cookies, headers } from "next/headers";
import { fetchAthleteLiveProgrammeForServer } from "@/app/lib/hyroxAthleteProgrammeServer";
import {
  countProgrammeWeeksGenerated,
  countPublishedSessionsFromProgramme,
  type ProgrammePageRenderDecision,
} from "@/app/lib/hyroxAthleteProgrammePageGate";
import { resolveHyroxPortalAthlete } from "@/app/lib/hyroxAthletePortalResolve";
import {
  hasValidSupabaseSessionCookies,
  isSupabaseAuthCookieName,
} from "@/app/lib/supabase/apiRoute";
import {
  HYROX_MW_COOKIE_HEADER,
  HYROX_MW_INTERNAL_NAV_HEADER,
  HYROX_MW_USER_HEADER,
  middlewareForwardedAthleteAuth,
  middlewareForwardedAthleteIdentity,
  probeAthleteAuthMarkers,
} from "@/app/lib/supabase/athleteAuthGate";
import { createAthleteServerSupabase } from "@/app/lib/supabase/athleteServerClient";
import {
  resolveAuthUserForMiddleware,
  resolveAuthUserWithSessionRetry,
} from "@/app/lib/supabase/resolveAuthUser";
import type { PortalAthleteSummary } from "@/components/athlete-command-centre/athletePortalContext";
import type { AthleteLiveProgrammePayload } from "@/components/athlete-command-centre/useAthleteLiveProgramme";
import type { HyroxAthleteRow } from "@/app/lib/hyroxDatabaseTypes";
import type { User } from "@supabase/supabase-js";

export type HyroxPortalSnapshotAuthProbe = {
  routePath: string;
  currentUrl: string;
  authCookiesPresent: boolean;
  rawCookieHeaderPresent: boolean;
  middlewareCookiePresent: boolean;
  middlewareUserPresent: boolean;
  middlewareInternalNav: boolean;
  middlewareAuthUserId: string | null;
  middlewareAuthEmail: string | null;
  getSessionSucceeded: boolean;
  getUserSucceeded: boolean;
  getUserAfterRetrySucceeded: boolean;
  validSessionCookiesPresent: boolean;
  authCookieNames: string[];
  authCookieValueLengths: number[];
  getSessionError: string | null;
  getUserError: string | null;
  userSource: "supabase" | "middleware-forwarded" | "none";
  authUserId: string | null;
  authUserEmail: string | null;
  sessionUserId: string | null;
};

export type HyroxPortalSnapshot = {
  auth: HyroxPortalSnapshotAuthProbe;
  user: User | null;
  athlete: HyroxAthleteRow | null;
  portalAthlete: PortalAthleteSummary | null;
  accessReason: string | null;
  linkFailureReason: string | null;
  programme: AthleteLiveProgrammePayload | null;
  publishedWeekCount: number;
  publishedSessionsCount: number;
  serverProgrammePublished: boolean;
};

function syntheticUserFromMiddlewareIdentity(
  userId: string,
  email: string
): User {
  return {
    id: userId,
    email,
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: "",
  } as User;
}

/** Shared athlete-portal auth probe — merged cookies, session retry, middleware-forwarded identity. */
export async function probeHyroxPortalAuth(
  routePath = "/athlete"
): Promise<{
  auth: HyroxPortalSnapshotAuthProbe;
  user: User | null;
  supabase: Awaited<ReturnType<typeof createAthleteServerSupabase>>;
}> {
  const headerStore = await headers();
  const cookieStore = await cookies();
  const authMarkers = probeAthleteAuthMarkers(cookieStore, headerStore);
  const middlewareAuth = middlewareForwardedAthleteAuth(headerStore);
  const mwIdentity = middlewareForwardedAthleteIdentity(headerStore);
  const hasAuthCookie = authMarkers.present || middlewareAuth;

  const pathname =
    (headerStore.get("x-pathname") ?? routePath).split("?")[0] ?? routePath;
  const currentUrl = headerStore.get("x-pathname") ?? routePath;

  const supabase = await createAthleteServerSupabase();

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  const mergedCookies = [
    ...cookieStore.getAll(),
    ...authMarkers.fromCookieHeader
      ? parseCookieHeaderForProbe(headerStore.get("cookie") ?? "")
      : [],
  ];
  const authCookieEntries = mergedCookies.filter((c) => isSupabaseAuthCookieName(c.name));
  const validSessionCookiesPresent = hasValidSupabaseSessionCookies(
    cookieStore.getAll().length > 0 ? cookieStore.getAll() : mergedCookies
  );

  const { user: userFirst, error: userFirstError } = await resolveAuthUserForMiddleware(
    supabase,
    hasAuthCookie
  );
  const { user: userAfterRetry, error: userRetryError } =
    await resolveAuthUserWithSessionRetry(supabase, {
      hasAuthCookie,
    });

  let user: User | null = userAfterRetry ?? userFirst;
  let userSource: HyroxPortalSnapshotAuthProbe["userSource"] = user ? "supabase" : "none";

  if (
    !user &&
    hasAuthCookie &&
    mwIdentity.userId &&
    mwIdentity.email &&
    headerStore.get(HYROX_MW_USER_HEADER) === "yes"
  ) {
    user = syntheticUserFromMiddlewareIdentity(mwIdentity.userId, mwIdentity.email);
    userSource = "middleware-forwarded";
  }

  const auth: HyroxPortalSnapshotAuthProbe = {
    routePath: pathname,
    currentUrl,
    authCookiesPresent: authMarkers.present,
    rawCookieHeaderPresent: authMarkers.fromCookieHeader,
    middlewareCookiePresent: headerStore.get(HYROX_MW_COOKIE_HEADER) === "yes",
    middlewareUserPresent: headerStore.get(HYROX_MW_USER_HEADER) === "yes",
    middlewareInternalNav: headerStore.get(HYROX_MW_INTERNAL_NAV_HEADER) === "1",
    middlewareAuthUserId: mwIdentity.userId,
    middlewareAuthEmail: mwIdentity.email,
    getSessionSucceeded: Boolean(session?.user),
    getUserSucceeded: Boolean(userFirst),
    getUserAfterRetrySucceeded: Boolean(userAfterRetry),
    validSessionCookiesPresent,
    authCookieNames: authCookieEntries.map((c) => c.name),
    authCookieValueLengths: authCookieEntries.map((c) => c.value?.length ?? 0),
    getSessionError: sessionError?.message ?? null,
    getUserError: userRetryError?.message ?? userFirstError?.message ?? null,
    userSource,
    authUserId: user?.id ?? null,
    authUserEmail: user?.email?.trim().toLowerCase() ?? null,
    sessionUserId: session?.user?.id ?? null,
  };

  return { auth, user, supabase };
}

function parseCookieHeaderForProbe(raw: string): { name: string; value: string }[] {
  if (!raw.trim()) return [];
  return raw.split(";").flatMap((part) => {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq < 1) return [];
    return [{ name: trimmed.slice(0, eq).trim(), value: trimmed.slice(eq + 1).trim() }];
  });
}

export async function resolveHyroxAthletePortalSnapshot(options?: {
  routePath?: string;
  loadProgramme?: boolean;
}): Promise<HyroxPortalSnapshot> {
  const routePath = options?.routePath ?? "/athlete";
  const { auth, user, supabase } = await probeHyroxPortalAuth(routePath);

  const empty: HyroxPortalSnapshot = {
    auth,
    user,
    athlete: null,
    portalAthlete: null,
    accessReason: null,
    linkFailureReason: user ? "LINKED_RESOLVE_PENDING" : "NO_AUTH_USER",
    programme: null,
    publishedWeekCount: 0,
    publishedSessionsCount: 0,
    serverProgrammePublished: false,
  };

  if (!user) {
    return {
      ...empty,
      linkFailureReason: auth.authCookiesPresent
        ? "AUTH_MARKERS_NO_USER"
        : "NO_AUTH_SESSION",
    };
  }

  const portal = await resolveHyroxPortalAthlete({
    user,
    supabase,
    attemptAutoLink: true,
  });

  const linked =
    portal.accessReason === "LINKED" &&
    portal.athlete?.payment_status === "paid" &&
    portal.athlete.user_id === user.id;

  if (!linked || !portal.athlete) {
    return {
      ...empty,
      accessReason: portal.accessReason,
      linkFailureReason: portal.accessReason ?? "LINKED_RESOLVE_FAILED",
    };
  }

  const athlete = portal.athlete;
  const portalAthlete: PortalAthleteSummary = {
    id: athlete.id,
    name:
      athlete.name?.trim() ||
      user.email?.split("@")[0]?.trim() ||
      "Athlete",
    email: athlete.email ?? user.email ?? null,
    status: athlete.status,
  };

  let programme: AthleteLiveProgrammePayload | null = null;
  if (options?.loadProgramme) {
    programme = await fetchAthleteLiveProgrammeForServer(athlete, user.email);
  }

  const publishedWeekCount = countProgrammeWeeksGenerated(programme);
  const publishedSessionsCount = countPublishedSessionsFromProgramme(programme);
  const serverProgrammePublished =
    Boolean(programme?.published) ||
    programme?.state === "published" ||
    publishedWeekCount > 0;

  return {
    auth,
    user,
    athlete,
    portalAthlete,
    accessReason: portal.accessReason,
    linkFailureReason: null,
    programme,
    publishedWeekCount,
    publishedSessionsCount,
    serverProgrammePublished,
  };
}

export function programmeRenderDecisionFromSnapshot(
  snapshot: HyroxPortalSnapshot
): ProgrammePageRenderDecision {
  if (!snapshot.athlete) {
    return snapshot.user ? "not-linked" : "auth-debug";
  }
  if (!snapshot.serverProgrammePublished) return "waiting";
  if (snapshot.publishedSessionsCount === 0) return "published-empty";
  return "programme";
}
