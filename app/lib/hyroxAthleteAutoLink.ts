import { fetchHyroxAthleteByEmail } from "@/app/lib/hyroxAthleteCoachDb";
import { getNextHyroxAthleteStatus } from "@/app/lib/hyroxAthleteStatus";
import { fetchAthleteProgressFlags, recordHyroxStatusHistory } from "@/app/lib/hyroxAthleteServer";
import { isHyroxCoachRole } from "@/app/lib/hyroxRoles";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";
import { createServiceRoleClient } from "@/app/lib/supabaseAdmin";
import type { HyroxAthleteRow } from "@/app/lib/hyroxDatabaseTypes";

export type HyroxAutoLinkReason =
  | "NO_PAID_ATHLETE_FOUND"
  | "ATHLETE_EMAIL_LINKED_TO_DIFFERENT_AUTH_USER"
  | "LOOKUP_FAILED"
  | "UPDATE_FAILED"
  | "ROLE_UPDATE_FAILED";

export type HyroxAthleteAccessDebug = {
  authUserId: string;
  authEmail: string;
  athleteId: string | null;
  athleteEmail: string | null;
  athleteUserId: string | null;
  emailMatchFound: boolean;
  paymentPaid: boolean;
  userIdsMatch: boolean;
  accessReason: HyroxAutoLinkReason | "LINKED" | "UNLINKED_PAID" | null;
};

export type HyroxAutoLinkResult = {
  linked: boolean;
  alreadyLinked?: boolean;
  autoLinked?: boolean;
  relinked?: boolean;
  reason?: HyroxAutoLinkReason;
  athleteId?: string;
  status?: string;
  message?: string;
  debug?: HyroxAthleteAccessDebug;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function buildAthleteAccessDebug(params: {
  authUserId: string;
  authEmail: string;
  athlete: HyroxAthleteRow | null;
  reason: HyroxAthleteAccessDebug["accessReason"];
}): HyroxAthleteAccessDebug {
  const athlete = params.athlete;
  return {
    authUserId: params.authUserId,
    authEmail: normalizeEmail(params.authEmail),
    athleteId: athlete?.id ?? null,
    athleteEmail: athlete?.email ? normalizeEmail(athlete.email) : null,
    athleteUserId: athlete?.user_id ?? null,
    emailMatchFound: Boolean(athlete),
    paymentPaid: athlete?.payment_status === "paid",
    userIdsMatch: Boolean(athlete?.user_id && athlete.user_id === params.authUserId),
    accessReason: params.reason,
  };
}

export async function fetchPaidAthleteByEmail(email: string) {
  const { client: supabase } = await createCoachServerClient();
  return fetchHyroxAthleteByEmail(supabase, normalizeEmail(email));
}

/** Evaluate paid athlete row for session email (coach client — bypasses athlete RLS). */
export async function evaluateAthleteEmailAccess(
  userId: string,
  email: string
): Promise<{
  canAccessPortal: boolean;
  canAccessContent: boolean;
  athlete: HyroxAthleteRow | null;
  debug: HyroxAthleteAccessDebug;
}> {
  const normalizedEmail = normalizeEmail(email);
  const { athlete, error } = await fetchPaidAthleteByEmail(normalizedEmail);

  if (error) {
    const debug = buildAthleteAccessDebug({
      authUserId: userId,
      authEmail: normalizedEmail,
      athlete: null,
      reason: "LOOKUP_FAILED",
    });
    return { canAccessPortal: false, canAccessContent: false, athlete: null, debug };
  }

  if (!athlete) {
    const debug = buildAthleteAccessDebug({
      authUserId: userId,
      authEmail: normalizedEmail,
      athlete: null,
      reason: "NO_PAID_ATHLETE_FOUND",
    });
    return { canAccessPortal: false, canAccessContent: false, athlete: null, debug };
  }

  if (athlete.payment_status !== "paid") {
    const debug = buildAthleteAccessDebug({
      authUserId: userId,
      authEmail: normalizedEmail,
      athlete,
      reason: "NO_PAID_ATHLETE_FOUND",
    });
    return { canAccessPortal: false, canAccessContent: false, athlete, debug };
  }

  if (!athlete.user_id) {
    const debug = buildAthleteAccessDebug({
      authUserId: userId,
      authEmail: normalizedEmail,
      athlete,
      reason: "UNLINKED_PAID",
    });
    return { canAccessPortal: true, canAccessContent: false, athlete, debug };
  }

  if (athlete.user_id === userId) {
    const debug = buildAthleteAccessDebug({
      authUserId: userId,
      authEmail: normalizedEmail,
      athlete,
      reason: "LINKED",
    });
    return { canAccessPortal: true, canAccessContent: true, athlete, debug };
  }

  const debug = buildAthleteAccessDebug({
    authUserId: userId,
    authEmail: normalizedEmail,
    athlete,
    reason: "ATHLETE_EMAIL_LINKED_TO_DIFFERENT_AUTH_USER",
  });
  return { canAccessPortal: true, canAccessContent: false, athlete, debug };
}

async function setProfileAthleteRole(userId: string): Promise<string | null> {
  let admin;
  try {
    admin = createServiceRoleClient();
  } catch (e) {
    console.error("[hyrox/link] service role unavailable", e);
    return "Service role unavailable.";
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  const currentRole = profile?.role as string | undefined;
  if (isHyroxCoachRole(currentRole)) return null;

  const { error: roleError } = await admin
    .from("profiles")
    .update({ role: "athlete" })
    .eq("id", userId);

  return roleError?.message ?? null;
}

export async function linkHyroxAthleteToAuthUser(params: {
  athleteId: string;
  targetUserId: string;
  email: string;
  changedBy: string;
  historyReason: string;
  forceRelink?: boolean;
}): Promise<HyroxAutoLinkResult> {
  const normalizedEmail = normalizeEmail(params.email);
  const { client: supabase } = await createCoachServerClient();

  const { athlete, error: fetchError } = await fetchHyroxAthleteByEmail(supabase, normalizedEmail);
  if (fetchError) {
    return { linked: false, reason: "LOOKUP_FAILED", message: fetchError };
  }
  if (!athlete || athlete.id !== params.athleteId) {
    return { linked: false, reason: "NO_PAID_ATHLETE_FOUND", message: "Athlete not found for email." };
  }

  if (athlete.payment_status !== "paid") {
    return {
      linked: false,
      reason: "NO_PAID_ATHLETE_FOUND",
      message: "Payment must be confirmed before linking.",
      athleteId: athlete.id,
    };
  }

  if (athlete.user_id === params.targetUserId) {
    return {
      linked: true,
      alreadyLinked: true,
      athleteId: athlete.id,
      status: athlete.status,
    };
  }

  if (athlete.user_id && athlete.user_id !== params.targetUserId && !params.forceRelink) {
    return {
      linked: false,
      reason: "ATHLETE_EMAIL_LINKED_TO_DIFFERENT_AUTH_USER",
      message: "Athlete email is linked to a different auth user.",
      athleteId: athlete.id,
      debug: buildAthleteAccessDebug({
        authUserId: params.targetUserId,
        authEmail: normalizedEmail,
        athlete,
        reason: "ATHLETE_EMAIL_LINKED_TO_DIFFERENT_AUTH_USER",
      }),
    };
  }

  const flags = await fetchAthleteProgressFlags(supabase, athlete.id);
  const nextStatus = getNextHyroxAthleteStatus({
    payment_status: athlete.payment_status,
    user_id: params.targetUserId,
    status: athlete.status,
    hasAssessment: flags.hasAssessment,
    hasTesting: flags.hasTesting,
  });

  const { error: linkError } = await supabase
    .from("hyrox_athletes")
    .update({
      user_id: params.targetUserId,
      email: normalizedEmail,
      status: nextStatus,
    })
    .eq("id", athlete.id);

  if (linkError) {
    return {
      linked: false,
      reason: "UPDATE_FAILED",
      message: linkError.message,
      athleteId: athlete.id,
    };
  }

  const roleError = await setProfileAthleteRole(params.targetUserId);
  if (roleError) {
    return {
      linked: false,
      reason: "ROLE_UPDATE_FAILED",
      message: roleError,
      athleteId: athlete.id,
    };
  }

  await recordHyroxStatusHistory(supabase, {
    athleteId: athlete.id,
    statusFrom: athlete.status,
    statusTo: nextStatus,
    changedBy: params.changedBy,
    reason: params.historyReason,
    metadata: {
      email: normalizedEmail,
      user_id: params.targetUserId,
      previous_user_id: athlete.user_id,
      force_relink: Boolean(params.forceRelink),
    },
  });

  return {
    linked: true,
    autoLinked: !params.forceRelink,
    relinked: Boolean(params.forceRelink),
    athleteId: athlete.id,
    status: nextStatus,
  };
}

export async function autoLinkHyroxAthleteByEmail(
  userId: string,
  email: string
): Promise<HyroxAutoLinkResult> {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return {
      linked: false,
      reason: "NO_PAID_ATHLETE_FOUND",
      message: "No email on account.",
      debug: buildAthleteAccessDebug({
        authUserId: userId,
        authEmail: "",
        athlete: null,
        reason: "NO_PAID_ATHLETE_FOUND",
      }),
    };
  }

  const access = await evaluateAthleteEmailAccess(userId, normalizedEmail);
  const debug = access.debug;

  if (!access.athlete || access.debug.accessReason === "NO_PAID_ATHLETE_FOUND") {
    return {
      linked: false,
      reason: "NO_PAID_ATHLETE_FOUND",
      message: "No paid Hyrox athlete record for this email.",
      debug,
    };
  }

  if (access.debug.accessReason === "ATHLETE_EMAIL_LINKED_TO_DIFFERENT_AUTH_USER") {
    return {
      linked: false,
      reason: "ATHLETE_EMAIL_LINKED_TO_DIFFERENT_AUTH_USER",
      message:
        "Your email matches a paid athlete profile, but it is linked to a different sign-in account. Sign out and use the same login you used before, or ask your coach to relink your account.",
      athleteId: access.athlete.id,
      debug,
    };
  }

  if (access.canAccessContent) {
    return {
      linked: true,
      alreadyLinked: true,
      athleteId: access.athlete.id,
      status: access.athlete.status,
      debug,
    };
  }

  const result = await linkHyroxAthleteToAuthUser({
    athleteId: access.athlete.id,
    targetUserId: userId,
    email: normalizedEmail,
    changedBy: userId,
    historyReason: "auto_link_on_login",
    forceRelink: false,
  });

  return { ...result, debug };
}

export function autoLinkUserMessage(result: HyroxAutoLinkResult): string | null {
  if (result.linked) return null;
  if (result.reason === "NO_PAID_ATHLETE_FOUND") {
    return "We couldn’t find a paid Hyrox Team athlete profile for this email yet. If you’ve just joined, your coach may still need to activate your account.";
  }
  if (result.reason === "ATHLETE_EMAIL_LINKED_TO_DIFFERENT_AUTH_USER") {
    return (
      result.message ??
      "Your email matches a paid athlete profile, but it is linked to a different sign-in account. Ask your coach to relink your account, or sign in with the original login."
    );
  }
  return result.message ?? null;
}

export function attachDevDebug(
  result: HyroxAutoLinkResult,
  debug?: HyroxAthleteAccessDebug
): HyroxAutoLinkResult {
  if (process.env.NODE_ENV !== "development" || !debug) return result;
  return { ...result, debug };
}

/** True when paid athlete row is linked to this auth user (email evaluation is source of truth). */
export function isAthletePortalLinked(
  emailAccess: {
    canAccessContent: boolean;
    debug: HyroxAthleteAccessDebug;
  } | null
): boolean {
  if (!emailAccess) return false;
  return (
    emailAccess.debug.accessReason === "LINKED" ||
    (emailAccess.canAccessContent &&
      emailAccess.debug.userIdsMatch &&
      emailAccess.debug.paymentPaid)
  );
}

export function shouldShowAthleteUnlinkedNotice(params: {
  user: { id: string; email?: string | null } | null;
  emailAccess: Awaited<ReturnType<typeof evaluateAthleteEmailAccess>> | null;
  resolvedAthlete: HyroxAthleteRow | null;
}): boolean {
  const { user, emailAccess, resolvedAthlete } = params;
  if (!user) return false;
  if (isAthletePortalLinked(emailAccess)) return false;
  if (
    emailAccess?.debug.accessReason === "ATHLETE_EMAIL_LINKED_TO_DIFFERENT_AUTH_USER"
  ) {
    return false;
  }
  if (resolvedAthlete?.user_id === user.id && resolvedAthlete.payment_status === "paid") {
    return false;
  }
  return true;
}
