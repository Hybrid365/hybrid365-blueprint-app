import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  sanitizeAthleteAuthNextPath,
  sanitizeAuthNextPath,
} from "@/app/lib/authRedirectUrl";
import { isInternalAdminEmail, parseInternalAdminEmails } from "@/app/lib/internalAdminAccess";
import {
  isHyroxAthleteRole,
  isHyroxCoachRole,
  type ProfileRole,
} from "@/app/lib/hyroxRoles";
import { createClient } from "@/app/lib/supabase/server";

export type HyroxAccessContext = {
  userId: string;
  email: string | null;
  profileRole: ProfileRole | null;
  hyroxAthleteId: string | null;
  isCoach: boolean;
  isAthlete: boolean;
};

/** Optional env bridge until all coaches have profiles.role set (comma-separated emails). */
export function parseHyroxCoachEmails(): string[] {
  const raw = process.env.HYROX_COACH_EMAILS?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isHyroxCoachEmail(email: string | null | undefined): boolean {
  if (!email?.trim()) return false;
  const allowed = parseHyroxCoachEmails();
  if (allowed.length === 0) return false;
  return allowed.includes(email.trim().toLowerCase());
}

export function resolveHyroxCoachAccess(
  profileRole: string | null | undefined,
  email: string | null | undefined
): boolean {
  return (
    isHyroxCoachRole(profileRole) ||
    isInternalAdminEmail(email) ||
    isHyroxCoachEmail(email)
  );
}

export function resolveHyroxAthleteAccess(
  profileRole: string | null | undefined,
  hyroxAthleteId: string | null
): boolean {
  return isHyroxAthleteRole(profileRole) || Boolean(hyroxAthleteId);
}

async function redirectToCommunityLogin(fallbackNext: string): Promise<never> {
  const headerStore = await headers();
  const requested = headerStore.get("x-pathname");
  const next = sanitizeAuthNextPath(requested ?? fallbackNext);
  redirect(`/login?next=${encodeURIComponent(next)}`);
}

async function redirectToAthleteLogin(fallbackNext: string): Promise<never> {
  const headerStore = await headers();
  const requested = headerStore.get("x-pathname");
  const next = sanitizeAthleteAuthNextPath(requested ?? fallbackNext);
  redirect(`/athlete/login?next=${encodeURIComponent(next)}`);
}

export async function getHyroxAccessContext(): Promise<HyroxAccessContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [{ data: profile }, { data: athleteRow }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
    supabase
      .from("hyrox_athletes")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const profileRole = (profile?.role as ProfileRole | undefined) ?? null;
  const hyroxAthleteId = athleteRow?.id ?? null;
  const email = user.email ?? null;

  return {
    userId: user.id,
    email,
    profileRole,
    hyroxAthleteId,
    isCoach: resolveHyroxCoachAccess(profileRole, email),
    isAthlete: resolveHyroxAthleteAccess(profileRole, hyroxAthleteId),
  };
}

/** Server layout guard for /admin/* */
export async function assertHyroxCoachAccess(): Promise<HyroxAccessContext> {
  const ctx = await getHyroxAccessContext();
  if (!ctx) {
    return redirectToCommunityLogin("/admin/hyrox-athletes");
  }
  if (!ctx.isCoach) {
    redirect("/admin/no-access");
  }
  return ctx;
}

/** Server layout guard for /athlete/* */
export async function assertHyroxAthleteAccess(): Promise<HyroxAccessContext> {
  const ctx = await getHyroxAccessContext();
  if (!ctx) {
    return redirectToAthleteLogin("/athlete/onboarding");
  }
  if (!ctx.isAthlete) {
    redirect("/athlete/no-access");
  }
  return ctx;
}
