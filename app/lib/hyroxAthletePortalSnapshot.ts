import { cookies, headers } from "next/headers";
import { normalizeOptionalEmail } from "@/app/lib/hyroxAthleteMutationActor";
import { athletePortalHasValidServerSession } from "@/app/lib/hyroxAthletePortalSessionGate";
import { fetchAthleteLiveProgrammeForServer } from "@/app/lib/hyroxAthleteProgrammeServer";
import {
  countProgrammeWeeksGenerated,
  countPublishedSessionsFromProgramme,
  type ProgrammePageRenderDecision,
} from "@/app/lib/hyroxAthleteProgrammePageGate";
import {
  resolveHyroxPortalAthlete,
  type ResolvedPortalAthlete,
} from "@/app/lib/hyroxAthletePortalResolve";
import { hasValidSupabaseSessionCookies } from "@/app/lib/supabase/apiRoute";
import {
  HYROX_MW_COOKIE_HEADER,
  HYROX_MW_INTERNAL_NAV_HEADER,
  HYROX_MW_USER_HEADER,
  middlewareForwardedAthleteAuth,
  middlewareForwardedAthleteIdentity,
  probeAthleteAuthMarkers,
  shouldAthleteLayoutRedirectToLogin,
} from "@/app/lib/supabase/athleteAuthGate";
import { createAthleteServerSupabase } from "@/app/lib/supabase/athleteServerClient";
import {
  readAthleteSessionCookieFromEntries,
  resolveSupabaseUserFromAthleteSession,
} from "@/app/lib/supabase/hyroxAthleteSessionCookie";
import {
  readAthletePortalCookies,
  type AuthCookieSummary,
  type CookieStorageProbeReadDebug,
  type MainAuthCookieReadDebug,
  type MergedCookieDebug,
} from "@/app/lib/supabase/mergedAthleteCookies";
import {
  isAthleteServerPrefetch,
  resolveAuthUserForMiddleware,
  resolveAuthUserWithSessionRetry,
} from "@/app/lib/supabase/resolveAuthUser";
import type {
  PortalAthleteSummary,
  PortalLayoutAuth,
} from "@/components/athlete-command-centre/athletePortalContext";
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
  athleteSessionCookiePresent: boolean;
  athleteSessionCookieValid: boolean;
  authCookieNames: string[];
  authCookieValueLengths: number[];
  cookieMerge: MergedCookieDebug;
  authCookieSummaries: AuthCookieSummary[];
  mainAuth: MainAuthCookieReadDebug;
  storageProbe: CookieStorageProbeReadDebug;
  getSessionError: string | null;
  getUserError: string | null;
  userSource: "supabase" | "middleware-forwarded" | "h365-athlete-session" | "none";
  authUserId: string | null;
  authUserEmail: string | null;
  sessionUserId: string | null;
};

export type AthletePortalAuthSource = "supabase-cookie" | "h365-athlete-session" | "none";

/** Unified portal auth for layout + pages — Supabase cookies or h365_athlete_session. */
export type AthletePortalPageAuth = {
  isAuthenticated: boolean;
  source: AthletePortalAuthSource;
  authUserId: string | null;
  email: string | null;
  athleteId: string | null;
  athlete: HyroxAthleteRow | null;
  portalAthlete: PortalAthleteSummary | null;
  serverAuthConfirmed: boolean;
  wouldRedirectToLogin: boolean;
  routePath: string;
  auth: HyroxPortalSnapshotAuthProbe;
  user: User | null;
  portalResolved: ResolvedPortalAthlete | null;
  /** Server-loaded programme publish state (shared across all /athlete/* routes). */
  serverProgrammePublished: boolean;
  publishedWeekCount: number;
  publishedSessionsCount: number;
  serverProgramme: AthleteLiveProgrammePayload | null;
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
  const {
    cookies: mergedCookies,
    debug: cookieMerge,
    mainAuth,
    storageProbe,
  } = await readAthletePortalCookies();
  const authMarkers = probeAthleteAuthMarkers(cookieStore, headerStore);
  const middlewareAuth = middlewareForwardedAthleteAuth(headerStore);
  const mwIdentity = middlewareForwardedAthleteIdentity(headerStore);
  const hasAuthCookie = authMarkers.present || middlewareAuth;

  const pathname =
    (headerStore.get("x-pathname") ?? routePath).split("?")[0] ?? routePath;
  const currentUrl = headerStore.get("x-pathname") ?? routePath;

  const validSessionCookiesPresent = hasValidSupabaseSessionCookies(mergedCookies);
  const athleteSessionPayload = readAthleteSessionCookieFromEntries(mergedCookies);
  const athleteSessionCookiePresent = Boolean(athleteSessionPayload);
  const athleteSessionCookieValid = Boolean(athleteSessionPayload);
  const authCookieSummaries = cookieMerge.authCookieSummaries;

  const supabase = await createAthleteServerSupabase();

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

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

  if (!user && athleteSessionPayload) {
    const fromAthleteSession = await resolveSupabaseUserFromAthleteSession(
      athleteSessionPayload
    );
    if (fromAthleteSession) {
      user = fromAthleteSession;
      userSource = "h365-athlete-session";
    }
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
    athleteSessionCookiePresent,
    athleteSessionCookieValid,
    authCookieNames: authCookieSummaries.map((c) => c.name),
    authCookieValueLengths: authCookieSummaries.map((c) => c.mergedLength),
    cookieMerge,
    authCookieSummaries,
    mainAuth,
    storageProbe,
    getSessionError: sessionError?.message ?? null,
    getUserError: userRetryError?.message ?? userFirstError?.message ?? null,
    userSource,
    authUserId: user?.id ?? null,
    authUserEmail: normalizeOptionalEmail(user?.email),
    sessionUserId: session?.user?.id ?? null,
  };

  return { auth, user, supabase };
}

function mapUserSourceToPortalAuthSource(
  userSource: HyroxPortalSnapshotAuthProbe["userSource"],
  validSessionCookiesPresent: boolean
): AthletePortalAuthSource {
  if (userSource === "h365-athlete-session") return "h365-athlete-session";
  if (userSource === "supabase" || userSource === "middleware-forwarded") {
    return validSessionCookiesPresent ? "supabase-cookie" : "h365-athlete-session";
  }
  return "none";
}

/**
 * Single shared resolver for /athlete/* layout and server pages.
 * Accepts Supabase sb-* session or h365_athlete_session signed cookie.
 */
export async function resolveAthletePortalPageAuth(
  routePath = "/athlete"
): Promise<AthletePortalPageAuth> {
  const headerStore = await headers();
  const cookieStore = await cookies();
  const pathname =
    (headerStore.get("x-pathname") ?? routePath).split("?")[0] ?? routePath;
  const authMarkers = probeAthleteAuthMarkers(cookieStore, headerStore);
  const middlewareForwardedAuth = middlewareForwardedAthleteAuth(headerStore);
  const isPrefetch = isAthleteServerPrefetch(headerStore);

  const { auth, user, supabase } = await probeHyroxPortalAuth(pathname);

  const source = user
    ? mapUserSourceToPortalAuthSource(auth.userSource, auth.validSessionCookiesPresent)
    : "none";

  const layoutAuth: PortalLayoutAuth = {
    hasSession: Boolean(user),
    email: normalizeOptionalEmail(user?.email),
    userId: user?.id ?? null,
    hasSupabaseAuthCookie: auth.authCookiesPresent || auth.validSessionCookiesPresent,
  };

  const wouldRedirectToLogin = shouldAthleteLayoutRedirectToLogin({
    pathname,
    userPresent: Boolean(user),
    authMarkers,
    middlewareForwardedAuth,
    isPrefetch,
    athleteSessionCookieValid: auth.athleteSessionCookieValid,
  });

  const emptyBase: AthletePortalPageAuth = {
    isAuthenticated: Boolean(user),
    source,
    authUserId: user?.id ?? null,
    email: layoutAuth.email,
    athleteId: null,
    athlete: null,
    portalAthlete: null,
    serverAuthConfirmed: false,
    wouldRedirectToLogin,
    routePath: pathname,
    auth,
    user,
    portalResolved: null,
    serverProgrammePublished: false,
    publishedWeekCount: 0,
    publishedSessionsCount: 0,
    serverProgramme: null,
  };

  if (!user) {
    return emptyBase;
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
    return { ...emptyBase, portalResolved: portal };
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

  const serverAuthConfirmed = athletePortalHasValidServerSession({
    layoutAuth: { ...layoutAuth, hasSession: true, userId: user.id },
    serverAuthConfirmed: true,
    authProbe: auth,
  });

  const programme = await fetchAthleteLiveProgrammeForServer(athlete, user.email);
  const publishedWeekCount = countProgrammeWeeksGenerated(programme);
  const publishedSessionsCount = countPublishedSessionsFromProgramme(programme);
  const serverProgrammePublished =
    Boolean(programme?.published) ||
    programme?.state === "published" ||
    publishedWeekCount > 0 ||
    publishedSessionsCount > 0;

  return {
    isAuthenticated: true,
    source,
    authUserId: user.id,
    email: layoutAuth.email,
    athleteId: athlete.id,
    athlete,
    portalAthlete,
    serverAuthConfirmed,
    wouldRedirectToLogin: false,
    routePath: pathname,
    auth,
    user,
    portalResolved: portal,
    serverProgrammePublished,
    publishedWeekCount,
    publishedSessionsCount,
    serverProgramme: programme,
  };
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
